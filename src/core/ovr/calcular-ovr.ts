import type { Jogador } from "../modelos/jogador";
import { PESOS_GOLEIRO, PESOS_LINHA } from "./pesos";

function mediaPonderada<T extends Record<keyof T, number>>(
  atributos: T,
  pesos: Record<keyof T, number>,
): number {
  let total = 0;
  for (const chave of Object.keys(pesos) as (keyof T)[]) {
    total += atributos[chave] * pesos[chave];
  }
  return total;
}

export function calcularOvr(jogador: Jogador): number {
  const bruto =
    jogador.posicao === "GOL"
      ? mediaPonderada(jogador.atributos, PESOS_GOLEIRO)
      : mediaPonderada(jogador.atributos, PESOS_LINHA[jogador.posicao]);

  return Math.min(99, Math.max(0, Math.round(bruto)));
}
