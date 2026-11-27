import { describe, expect, it } from "vitest";
import { Aleatorio } from "../core/aleatorio";
import { escalar } from "./auxiliares-teste";
import { CHANCE_FALTA_POR_TICK, criarDisciplina, sortearFalta } from "./faltas";
import { calcularForca } from "./forca-time";
import { simularPartida } from "./partida";
import type { ContextoTick, EstadoBola } from "./tick";
import type { ResultadoPartida, Zona } from "./tipos-partida";

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

function criarContexto(seed: number): ContextoTick {
  const casa = escalar(() => 70, 1, 0);
  const fora = escalar(() => 70, 2, 100);
  return {
    escalacoes: { CASA: casa, FORA: fora },
    forcas: { CASA: calcularForca(casa), FORA: calcularForca(fora) },
    aleatorio: new Aleatorio(seed),
  };
}

function estadoCom(zona: Zona): EstadoBola {
  return { posse: "CASA", zona, jogadorComBolaId: 5 };
}

function jogar(seed: number): ResultadoPartida {
  return simularPartida(
    escalar(() => 70, 1, 0),
    escalar(() => 70, 2, 100),
    seed,
  );
}

/** Ids dos defensores da FORA (4-3-3, ids 100 a 110) que disputam cada zona da CASA. */
const AUTORES_POR_ZONA: [Zona, number[]][] = [
  ["DEFESA", [108, 109, 110]],
  ["MEIO", [105, 106, 107]],
  ["ATAQUE", [101, 102, 103, 104]],
];

describe("sortearFalta", () => {
  it("acontece em cerca de 4,6% dos ticks", () => {
    const contexto = criarContexto(1);
    const total = 20000;
    let faltas = 0;
    for (let i = 0; i < total; i++) {
      if (sortearFalta(estadoCom("MEIO"), contexto, criarDisciplina()).length > 0) faltas += 1;
    }
    expect(Math.abs(faltas / total - CHANCE_FALTA_POR_TICK)).toBeLessThan(0.008);
  });

  it.each(AUTORES_POR_ZONA)(
    "na zona %s, o autor é do time sem a bola, do setor certo e nunca o goleiro",
    (zona, idsPermitidos) => {
      const contexto = criarContexto(2);
      for (let i = 0; i < 5000; i++) {
        const falta = sortearFalta(estadoCom(zona), contexto, criarDisciplina()).find(
          (o) => o.tipo === "FALTA",
        );
        if (falta) {
          expect(idsPermitidos).toContain(falta.jogadorId);
        }
      }
    },
  );

  it("não escolhe jogadores expulsos", () => {
    const contexto = criarContexto(3);
    const disciplina = criarDisciplina();
    disciplina.expulsos.add(105);
    disciplina.expulsos.add(106);

    for (let i = 0; i < 5000; i++) {
      const falta = sortearFalta(estadoCom("MEIO"), contexto, disciplina).find(
        (o) => o.tipo === "FALTA",
      );
      if (falta) {
        expect(falta.jogadorId).toBe(107);
      }
    }
  });

  it("não gera falta se todos os candidatos estão expulsos", () => {
    const contexto = criarContexto(4);
    const disciplina = criarDisciplina();
    [105, 106, 107].forEach((id) => disciplina.expulsos.add(id));

    for (let i = 0; i < 5000; i++) {
      expect(sortearFalta(estadoCom("MEIO"), contexto, disciplina)).toEqual([]);
    }
  });

  it("dá vermelho no segundo amarelo e ninguém passa de dois amarelos", () => {
    const contexto = criarContexto(5);
    const disciplina = criarDisciplina();

    for (let i = 0; i < 30000; i++) {
      const ocorrencias = sortearFalta(estadoCom("ATAQUE"), contexto, disciplina);
      const tipos = ocorrencias.map((o) => o.tipo);
      for (const ocorrencia of ocorrencias) {
        if (
          ocorrencia.tipo === "CARTAO_AMARELO" &&
          disciplina.amarelos.get(ocorrencia.jogadorId) === 2
        ) {
          expect(tipos).toContain("CARTAO_VERMELHO");
        }
      }
    }

    expect(disciplina.expulsos.size).toBeGreaterThan(0);
    for (const quantidade of disciplina.amarelos.values()) {
      expect(quantidade).toBeLessThanOrEqual(2);
    }
  });
});

describe("faltas e cartões na partida", () => {
  it("mantém as faltas das estatísticas iguais aos eventos", () => {
    for (const seed of SEEDS) {
      const resultado = jogar(seed);
      for (const lado of ["CASA", "FORA"] as const) {
        const eventos = resultado.eventos.filter((e) => e.tipo === "FALTA" && e.time === lado);
        expect(resultado.estatisticas[lado].faltas).toBe(eventos.length);
      }
    }
  });

  it("sempre põe cada cartão junto de uma falta do mesmo jogador", () => {
    for (const seed of SEEDS) {
      const { eventos } = jogar(seed);
      for (const evento of eventos) {
        if (evento.tipo !== "CARTAO_AMARELO" && evento.tipo !== "CARTAO_VERMELHO") continue;
        const temFalta = eventos.some(
          (outro) =>
            outro.tipo === "FALTA" &&
            outro.tick === evento.tick &&
            outro.time === evento.time &&
            outro.jogadorId === evento.jogadorId,
        );
        expect(temFalta).toBe(true);
      }
    }
  });

  it("atribui faltas e cartões a jogadores do time certo", () => {
    for (const seed of SEEDS) {
      for (const evento of jogar(seed).eventos) {
        if (!["FALTA", "CARTAO_AMARELO", "CARTAO_VERMELHO"].includes(evento.tipo)) continue;
        expect(evento.time === "CASA").toBe((evento.jogadorId ?? -1) < 100);
      }
    }
  });

  it("não deixa um expulso cometer novas faltas", () => {
    for (const seed of SEEDS) {
      const expulsos = new Set<number>();
      for (const evento of jogar(seed).eventos) {
        if (evento.jogadorId === null) continue;
        if (evento.tipo === "FALTA") {
          expect(expulsos.has(evento.jogadorId)).toBe(false);
        }
        if (evento.tipo === "CARTAO_VERMELHO") {
          expulsos.add(evento.jogadorId);
        }
      }
    }
  });
});

describe("calibração de faltas e cartões (lote de partidas)", () => {
  it("produz médias realistas por jogo", () => {
    const partidas = 2000;
    let faltas = 0;
    let amarelos = 0;
    let vermelhos = 0;

    for (let i = 0; i < partidas; i++) {
      for (const evento of jogar(i + 1).eventos) {
        if (evento.tipo === "FALTA") faltas += 1;
        if (evento.tipo === "CARTAO_AMARELO") amarelos += 1;
        if (evento.tipo === "CARTAO_VERMELHO") vermelhos += 1;
      }
    }

    const medias = {
      faltasPorJogo: faltas / partidas,
      amarelosPorJogo: amarelos / partidas,
      vermelhosPorJogo: vermelhos / partidas,
    };
    console.log("Faltas e cartões por jogo:", medias);

    expect(medias.faltasPorJogo).toBeGreaterThan(22);
    expect(medias.faltasPorJogo).toBeLessThan(28);
    expect(medias.amarelosPorJogo).toBeGreaterThan(3.4);
    expect(medias.amarelosPorJogo).toBeLessThan(5);
    expect(medias.vermelhosPorJogo).toBeGreaterThan(0.05);
    expect(medias.vermelhosPorJogo).toBeLessThan(0.7);
  }, 60000);
});
