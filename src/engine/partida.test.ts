import { describe, expect, it } from "vitest";
import { escalar } from "./auxiliares-teste";
import { simularPartida } from "./partida";
import { TICKS_POR_PARTIDA, tickParaMinuto, type ResultadoPartida } from "./tipos-partida";

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

function jogar(seed: number): ResultadoPartida {
  return simularPartida(
    escalar(() => 70, 1, 0),
    escalar(() => 70, 2, 100),
    seed,
  );
}

function contar(resultado: ResultadoPartida, tipo: string, time?: "CASA" | "FORA"): number {
  return resultado.eventos.filter((e) => e.tipo === tipo && (!time || e.time === time)).length;
}

describe("simularPartida", () => {
  it("é reproduzível com a mesma seed", () => {
    expect(jogar(7)).toEqual(jogar(7));
  });

  it("muda o resultado com outra seed", () => {
    expect(jogar(1)).not.toEqual(jogar(2));
  });

  it("registra um registro por tick, em ordem", () => {
    const resultado = jogar(3);
    expect(resultado.ticks).toHaveLength(TICKS_POR_PARTIDA);
    resultado.ticks.forEach((registro, indice) => {
      expect(registro.tick).toBe(indice);
    });
  });

  it("distribui toda a posse entre os dois times", () => {
    for (const seed of SEEDS) {
      const { estatisticas } = jogar(seed);
      expect(estatisticas.CASA.posseTicks + estatisticas.FORA.posseTicks).toBe(TICKS_POR_PARTIDA);
    }
  });

  it("mantém o placar igual aos eventos de gol", () => {
    for (const seed of SEEDS) {
      const resultado = jogar(seed);
      expect(resultado.placar.casa).toBe(contar(resultado, "GOL", "CASA"));
      expect(resultado.placar.fora).toBe(contar(resultado, "GOL", "FORA"));
    }
  });

  it("mantém as estatísticas iguais aos eventos", () => {
    for (const seed of SEEDS) {
      const resultado = jogar(seed);
      const { CASA, FORA } = resultado.estatisticas;

      const finalizacoes =
        contar(resultado, "GOL") +
        contar(resultado, "CHUTE_PARA_FORA") +
        contar(resultado, "DEFESA_GOLEIRO");
      const noAlvo = contar(resultado, "GOL") + contar(resultado, "DEFESA_GOLEIRO");

      expect(CASA.finalizacoes + FORA.finalizacoes).toBe(finalizacoes);
      expect(CASA.finalizacoesNoAlvo + FORA.finalizacoesNoAlvo).toBe(noAlvo);
      expect(CASA.escanteios).toBe(contar(resultado, "ESCANTEIO", "CASA"));
      expect(FORA.escanteios).toBe(contar(resultado, "ESCANTEIO", "FORA"));
    }
  });

  it("gera eventos em ordem, com minuto entre 0 e 89", () => {
    const { eventos } = jogar(5);
    let tickAnterior = 0;
    for (const evento of eventos) {
      expect(evento.tick).toBeGreaterThanOrEqual(tickAnterior);
      expect(evento.minuto).toBe(tickParaMinuto(evento.tick));
      expect(evento.minuto).toBeGreaterThanOrEqual(0);
      expect(evento.minuto).toBeLessThanOrEqual(89);
      tickAnterior = evento.tick;
    }
  });

  it("lança erro com escalação inválida", () => {
    const incompleta = escalar(() => 70, 1, 0);
    incompleta.titulares.pop();
    expect(() =>
      simularPartida(
        incompleta,
        escalar(() => 70, 2, 100),
        1,
      ),
    ).toThrow();
  });
});
