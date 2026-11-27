import { describe, expect, it } from "vitest";
import { escalar } from "./auxiliares-teste";
import { simularPartida } from "./partida";

const PARTIDAS = 2000;
const TIMEOUT = 60000;

interface Resumo {
  golsPorJogo: number;
  finalizacoesPorJogo: number;
  noAlvoPorJogo: number;
  escanteiosPorJogo: number;
  posseCasa: number;
  vitoriasCasa: number;
  empates: number;
  vitoriasFora: number;
}

function rodarLote(valorCasa: number, valorFora: number): Resumo {
  let gols = 0;
  let finalizacoes = 0;
  let noAlvo = 0;
  let escanteios = 0;
  let posseCasa = 0;
  let vitoriasCasa = 0;
  let empates = 0;
  let vitoriasFora = 0;

  for (let i = 0; i < PARTIDAS; i++) {
    const resultado = simularPartida(
      escalar(() => valorCasa, 1, 0),
      escalar(() => valorFora, 2, 100),
      i + 1,
    );
    const { CASA, FORA } = resultado.estatisticas;

    gols += resultado.placar.casa + resultado.placar.fora;
    finalizacoes += CASA.finalizacoes + FORA.finalizacoes;
    noAlvo += CASA.finalizacoesNoAlvo + FORA.finalizacoesNoAlvo;
    escanteios += CASA.escanteios + FORA.escanteios;
    posseCasa += CASA.posseTicks / (CASA.posseTicks + FORA.posseTicks);

    if (resultado.placar.casa > resultado.placar.fora) vitoriasCasa += 1;
    else if (resultado.placar.casa < resultado.placar.fora) vitoriasFora += 1;
    else empates += 1;
  }

  return {
    golsPorJogo: gols / PARTIDAS,
    finalizacoesPorJogo: finalizacoes / PARTIDAS,
    noAlvoPorJogo: noAlvo / PARTIDAS,
    escanteiosPorJogo: escanteios / PARTIDAS,
    posseCasa: posseCasa / PARTIDAS,
    vitoriasCasa: vitoriasCasa / PARTIDAS,
    empates: empates / PARTIDAS,
    vitoriasFora: vitoriasFora / PARTIDAS,
  };
}

describe("calibração do motor (lote de partidas)", () => {
  it(
    "times iguais produzem placares e estatísticas realistas",
    () => {
      const resumo = rodarLote(70, 70);
      console.log("Times iguais (70 x 70):", resumo);

      expect(resumo.golsPorJogo).toBeGreaterThan(2.2);
      expect(resumo.golsPorJogo).toBeLessThan(3.0);
      expect(resumo.finalizacoesPorJogo).toBeGreaterThan(19);
      expect(resumo.finalizacoesPorJogo).toBeLessThan(27);
      expect(resumo.posseCasa).toBeGreaterThan(0.47);
      expect(resumo.posseCasa).toBeLessThan(0.53);
    },
    TIMEOUT,
  );

  it(
    "o time mais forte vence mais",
    () => {
      const resumo = rodarLote(85, 55);
      console.log("Time forte em casa (85 x 55):", resumo);

      expect(resumo.vitoriasCasa).toBeGreaterThan(resumo.vitoriasFora);
      expect(resumo.posseCasa).toBeGreaterThan(0.5);
    },
    TIMEOUT,
  );
});
