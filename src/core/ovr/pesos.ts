import type { AtributosGoleiro, AtributosLinha, PosicaoLinha } from "../modelos/jogador";

export type PesosLinha = Record<keyof AtributosLinha, number>;
export type PesosGoleiro = Record<keyof AtributosGoleiro, number>;

export const PESOS_LINHA: Record<PosicaoLinha, PesosLinha> = {
  ZAG: { ritmo: 0.08, finalizacao: 0.02, passe: 0.1, drible: 0.05, defesa: 0.45, fisico: 0.3 },
  LD: { ritmo: 0.2, finalizacao: 0.03, passe: 0.17, drible: 0.15, defesa: 0.25, fisico: 0.2 },
  LE: { ritmo: 0.2, finalizacao: 0.03, passe: 0.17, drible: 0.15, defesa: 0.25, fisico: 0.2 },
  VOL: { ritmo: 0.07, finalizacao: 0.05, passe: 0.25, drible: 0.1, defesa: 0.33, fisico: 0.2 },
  MC: { ritmo: 0.08, finalizacao: 0.1, passe: 0.32, drible: 0.2, defesa: 0.15, fisico: 0.15 },
  MEI: { ritmo: 0.1, finalizacao: 0.17, passe: 0.3, drible: 0.28, defesa: 0.05, fisico: 0.1 },
  PON: { ritmo: 0.27, finalizacao: 0.2, passe: 0.15, drible: 0.28, defesa: 0.03, fisico: 0.07 },
  ATA: { ritmo: 0.17, finalizacao: 0.42, passe: 0.08, drible: 0.17, defesa: 0.03, fisico: 0.13 },
};

export const PESOS_GOLEIRO: PesosGoleiro = {
  elasticidade: 0.2,
  manejo: 0.2,
  chute: 0.1,
  reflexos: 0.25,
  velocidade: 0.05,
  posicionamento: 0.2,
};
