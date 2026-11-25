import type { Pack } from "./schema-pack";

type JogadorPack = Pack["clubes"][number]["jogadores"][number];

export const SALARIO_PADRAO = 5000;
export const INICIO_CONTRATO_PADRAO = "2027-01-01";
export const FIM_CONTRATO_PADRAO = "2028-12-31";

export function contratoDoJogador(jogador: JogadorPack) {
  return {
    salario: jogador.salario ?? SALARIO_PADRAO,
    dataInicio: INICIO_CONTRATO_PADRAO,
    dataFim: jogador.fimContrato ?? FIM_CONTRATO_PADRAO,
  };
}
