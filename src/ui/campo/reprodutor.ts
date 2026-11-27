import { calcularPosicoes, type PosicoesTick } from "../../engine/posicionamento";
import type { Escalacao, Lado, ResultadoPartida } from "../../engine/tipos-partida";

/** Duração de um tick na velocidade 1x. */
export const MS_POR_TICK = 400;

export interface Reprodutor {
  readonly totalTicks: number;
  readonly duracaoMs: number;
  /** Tick em andamento no instante informado (limitado ao primeiro e ao último). */
  tickEm(tempoMs: number): number;
  /** Posições dos jogadores e da bola no instante informado, interpoladas entre dois ticks. */
  quadroEm(tempoMs: number): PosicoesTick;
}

function misturar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function criarReprodutor(
  resultado: ResultadoPartida,
  escalacoes: Record<Lado, Escalacao>,
): Reprodutor {
  const quadros = resultado.ticks.map((registro) => calcularPosicoes(registro, escalacoes));
  const totalTicks = quadros.length;
  if (totalTicks === 0) {
    throw new Error("A partida não tem ticks para reproduzir.");
  }

  const tickEm = (tempoMs: number): number =>
    Math.min(totalTicks - 1, Math.max(0, Math.floor(tempoMs / MS_POR_TICK)));

  const quadroEm = (tempoMs: number): PosicoesTick => {
    const indice = tickEm(tempoMs);
    const atual = quadros[indice];
    if (!atual) {
      throw new Error(`Tick ${indice} sem posições calculadas.`);
    }

    const proximo = quadros[indice + 1];
    if (!proximo) return atual;

    const t = Math.min(1, Math.max(0, (tempoMs - indice * MS_POR_TICK) / MS_POR_TICK));

    return {
      jogadores: atual.jogadores.map((jogador, i) => {
        const alvo = proximo.jogadores[i];
        if (!alvo) return jogador;
        return { ...jogador, x: misturar(jogador.x, alvo.x, t), y: misturar(jogador.y, alvo.y, t) };
      }),
      bola: {
        x: misturar(atual.bola.x, proximo.bola.x, t),
        y: misturar(atual.bola.y, proximo.bola.y, t),
      },
    };
  };

  return { totalTicks, duracaoMs: totalTicks * MS_POR_TICK, tickEm, quadroEm };
}
