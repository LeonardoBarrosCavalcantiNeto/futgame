import { describe, expect, it } from "vitest";
import { escalar } from "../../engine/auxiliares-teste";
import { simularPartida } from "../../engine/partida";
import { calcularPosicoes } from "../../engine/posicionamento";
import { TICKS_POR_PARTIDA } from "../../engine/tipos-partida";
import { criarReprodutor, MS_POR_TICK } from "./reprodutor";

const casa = escalar(() => 70, 1, 0);
const fora = escalar(() => 70, 2, 100);
const escalacoes = { CASA: casa, FORA: fora };
const resultado = simularPartida(casa, fora, 7);
const reprodutor = criarReprodutor(resultado, escalacoes);

function posicoesDoTick(indice: number) {
  const registro = resultado.ticks[indice];
  if (!registro) throw new Error(`Tick ${indice} não existe.`);
  return calcularPosicoes(registro, escalacoes);
}

describe("criarReprodutor", () => {
  it("dura o número de ticks vezes a duração de cada tick", () => {
    expect(reprodutor.totalTicks).toBe(TICKS_POR_PARTIDA);
    expect(reprodutor.duracaoMs).toBe(TICKS_POR_PARTIDA * MS_POR_TICK);
  });

  it("limita o tick ao primeiro e ao último", () => {
    expect(reprodutor.tickEm(-500)).toBe(0);
    expect(reprodutor.tickEm(0)).toBe(0);
    expect(reprodutor.tickEm(MS_POR_TICK * 3 + 1)).toBe(3);
    expect(reprodutor.tickEm(reprodutor.duracaoMs * 2)).toBe(TICKS_POR_PARTIDA - 1);
  });

  it("começa exatamente nas posições do primeiro tick", () => {
    expect(reprodutor.quadroEm(0)).toEqual(posicoesDoTick(0));
    expect(reprodutor.quadroEm(-1000)).toEqual(posicoesDoTick(0));
  });

  it("interpola no meio do caminho entre dois ticks", () => {
    const a = posicoesDoTick(3);
    const b = posicoesDoTick(4);
    const meio = reprodutor.quadroEm(3 * MS_POR_TICK + MS_POR_TICK / 2);

    expect(meio.jogadores).toHaveLength(22);
    expect(meio.bola.x).toBeCloseTo((a.bola.x + b.bola.x) / 2, 5);
    expect(meio.bola.y).toBeCloseTo((a.bola.y + b.bola.y) / 2, 5);

    const primeiroA = a.jogadores[0];
    const primeiroB = b.jogadores[0];
    const primeiroMeio = meio.jogadores[0];
    expect(primeiroMeio?.x).toBeCloseTo(((primeiroA?.x ?? 0) + (primeiroB?.x ?? 0)) / 2, 5);
  });

  it("fica parado nas posições do último tick depois do fim", () => {
    const ultimo = posicoesDoTick(TICKS_POR_PARTIDA - 1);
    expect(reprodutor.quadroEm(reprodutor.duracaoMs + 5000)).toEqual(ultimo);
  });
});
