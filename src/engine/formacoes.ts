import type { Posicao } from "../core/modelos/jogador";
import type { Formacao, Lado } from "./tipos-partida";

export interface Vaga {
  posicao: Posicao;
  /** 0 = gol próprio, 1 = gol adversário (do ponto de vista de quem ataca). */
  x: number;
  /** 0 = topo da tela, 1 = base da tela, para quem ataca para a direita. */
  y: number;
}

export interface Ponto {
  x: number;
  y: number;
}

export const FORMACOES: Record<Formacao, Vaga[]> = {
  "4-3-3": [
    { posicao: "GOL", x: 0.05, y: 0.5 },
    { posicao: "LD", x: 0.25, y: 0.88 },
    { posicao: "ZAG", x: 0.22, y: 0.65 },
    { posicao: "ZAG", x: 0.22, y: 0.35 },
    { posicao: "LE", x: 0.25, y: 0.12 },
    { posicao: "VOL", x: 0.4, y: 0.5 },
    { posicao: "MC", x: 0.48, y: 0.72 },
    { posicao: "MC", x: 0.48, y: 0.28 },
    { posicao: "PON", x: 0.75, y: 0.85 },
    { posicao: "ATA", x: 0.82, y: 0.5 },
    { posicao: "PON", x: 0.75, y: 0.15 },
  ],
  "4-4-2": [
    { posicao: "GOL", x: 0.05, y: 0.5 },
    { posicao: "LD", x: 0.25, y: 0.88 },
    { posicao: "ZAG", x: 0.22, y: 0.65 },
    { posicao: "ZAG", x: 0.22, y: 0.35 },
    { posicao: "LE", x: 0.25, y: 0.12 },
    { posicao: "PON", x: 0.5, y: 0.88 },
    { posicao: "MC", x: 0.45, y: 0.62 },
    { posicao: "MC", x: 0.45, y: 0.38 },
    { posicao: "PON", x: 0.5, y: 0.12 },
    { posicao: "ATA", x: 0.8, y: 0.62 },
    { posicao: "ATA", x: 0.8, y: 0.38 },
  ],
  "4-2-3-1": [
    { posicao: "GOL", x: 0.05, y: 0.5 },
    { posicao: "LD", x: 0.25, y: 0.88 },
    { posicao: "ZAG", x: 0.22, y: 0.65 },
    { posicao: "ZAG", x: 0.22, y: 0.35 },
    { posicao: "LE", x: 0.25, y: 0.12 },
    { posicao: "VOL", x: 0.38, y: 0.62 },
    { posicao: "VOL", x: 0.38, y: 0.38 },
    { posicao: "PON", x: 0.65, y: 0.88 },
    { posicao: "MEI", x: 0.62, y: 0.5 },
    { posicao: "PON", x: 0.65, y: 0.12 },
    { posicao: "ATA", x: 0.82, y: 0.5 },
  ],
  "3-5-2": [
    { posicao: "GOL", x: 0.05, y: 0.5 },
    { posicao: "ZAG", x: 0.22, y: 0.75 },
    { posicao: "ZAG", x: 0.2, y: 0.5 },
    { posicao: "ZAG", x: 0.22, y: 0.25 },
    { posicao: "LD", x: 0.5, y: 0.92 },
    { posicao: "MC", x: 0.45, y: 0.68 },
    { posicao: "VOL", x: 0.38, y: 0.5 },
    { posicao: "MC", x: 0.45, y: 0.32 },
    { posicao: "LE", x: 0.5, y: 0.08 },
    { posicao: "ATA", x: 0.8, y: 0.62 },
    { posicao: "ATA", x: 0.8, y: 0.38 },
  ],
};

/** Posição base (0 a 1) de uma vaga no campo inteiro: CASA ataca para a direita, FORA para a esquerda. */
export function posicaoBase(formacao: Formacao, indice: number, lado: Lado): Ponto {
  const vaga = FORMACOES[formacao][indice];
  if (!vaga) {
    throw new Error(`Formação ${formacao} não tem a vaga ${indice}.`);
  }
  return lado === "CASA" ? { x: vaga.x, y: vaga.y } : { x: 1 - vaga.x, y: 1 - vaga.y };
}
