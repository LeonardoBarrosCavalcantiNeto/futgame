import { describe, expect, it } from "vitest";
import { Aleatorio } from "../core/aleatorio";
import { escalar } from "./auxiliares-teste";
import { resolverFinalizacao, type ResultadoFinalizacao } from "./finalizacao";
import { calcularForca } from "./forca-time";
import type { ContextoTick, EstadoBola } from "./tick";
import type { Escalacao } from "./tipos-partida";

/** O jogador de id 9 é o atacante da CASA no 4-3-3. */
const ESTADO_CHUTE: EstadoBola = { posse: "CASA", zona: "ATAQUE", jogadorComBolaId: 9 };

function criarContexto(casa: Escalacao, fora: Escalacao, seed: number): ContextoTick {
  return {
    escalacoes: { CASA: casa, FORA: fora },
    forcas: { CASA: calcularForca(casa), FORA: calcularForca(fora) },
    aleatorio: new Aleatorio(seed),
  };
}

function criarContextoUniforme(seed: number): ContextoTick {
  return criarContexto(
    escalar(() => 70, 1, 0),
    escalar(() => 70, 2, 100),
    seed,
  );
}

function chutar(contexto: ContextoTick, vezes: number): ResultadoFinalizacao[] {
  const resultados: ResultadoFinalizacao[] = [];
  for (let i = 0; i < vezes; i++) {
    resultados.push(resolverFinalizacao(ESTADO_CHUTE, contexto));
  }
  return resultados;
}

function proporcao(
  resultados: ResultadoFinalizacao[],
  teste: (r: ResultadoFinalizacao) => boolean,
) {
  return resultados.filter(teste).length / resultados.length;
}

const ESTADO_ESPERADO = {
  GOL: { posse: "FORA", zona: "MEIO" },
  DEFESA: { posse: "FORA", zona: "DEFESA" },
  PARA_FORA: { posse: "FORA", zona: "DEFESA" },
  ESCANTEIO: { posse: "CASA", zona: "ATAQUE" },
} as const;

describe("resolverFinalizacao", () => {
  it("é reproduzível com a mesma seed", () => {
    const a = chutar(criarContextoUniforme(42), 200);
    const b = chutar(criarContextoUniforme(42), 200);
    expect(a).toEqual(b);
  });

  it("devolve um estado coerente com cada resultado", () => {
    const contexto = criarContextoUniforme(5);
    const resultados = chutar(contexto, 3000);

    for (const r of resultados) {
      expect({ posse: r.estado.posse, zona: r.estado.zona }).toEqual(ESTADO_ESPERADO[r.resultado]);
      expect(r.noAlvo).toBe(r.resultado !== "PARA_FORA");
      const ids = contexto.escalacoes[r.estado.posse].titulares.map((j) => j.id);
      expect(ids).toContain(r.estado.jogadorComBolaId);
    }

    expect(new Set(resultados.map((r) => r.resultado)).size).toBe(4);
  });

  it("com times iguais, acerta o alvo em cerca de 41% e converte cerca de 11%", () => {
    const resultados = chutar(criarContextoUniforme(11), 20000);
    const noAlvo = proporcao(resultados, (r) => r.noAlvo);
    const gols = proporcao(resultados, (r) => r.resultado === "GOL");
    expect(noAlvo).toBeGreaterThan(0.38);
    expect(noAlvo).toBeLessThan(0.44);
    expect(gols).toBeGreaterThan(0.1);
    expect(gols).toBeLessThan(0.13);
  });

  it("faz um chutador melhor marcar mais", () => {
    const fora = escalar(() => 70, 2, 100);
    const bom = escalar((p) => (p === "ATA" ? 90 : 70), 1, 0);
    const ruim = escalar((p) => (p === "ATA" ? 40 : 70), 1, 0);

    const golsBom = proporcao(
      chutar(criarContexto(bom, fora, 21), 20000),
      (r) => r.resultado === "GOL",
    );
    const golsRuim = proporcao(
      chutar(criarContexto(ruim, fora, 21), 20000),
      (r) => r.resultado === "GOL",
    );
    expect(golsBom).toBeGreaterThan(golsRuim);
  });

  it("faz um goleiro melhor sofrer menos gols", () => {
    const casa = escalar(() => 70, 1, 0);
    const goleiroBom = escalar((p) => (p === "GOL" ? 90 : 70), 2, 100);
    const goleiroRuim = escalar((p) => (p === "GOL" ? 40 : 70), 2, 100);

    const golsContraBom = proporcao(
      chutar(criarContexto(casa, goleiroBom, 31), 20000),
      (r) => r.resultado === "GOL",
    );
    const golsContraRuim = proporcao(
      chutar(criarContexto(casa, goleiroRuim, 31), 20000),
      (r) => r.resultado === "GOL",
    );
    expect(golsContraBom).toBeLessThan(golsContraRuim);
  });

  it("lança erro se o chutador não está em campo", () => {
    const contexto = criarContextoUniforme(1);
    expect(() =>
      resolverFinalizacao({ posse: "CASA", zona: "ATAQUE", jogadorComBolaId: 999 }, contexto),
    ).toThrow();
  });
});
