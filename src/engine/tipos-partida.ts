import type { Jogador } from "../core/modelos/jogador";

export const SEGUNDOS_POR_TICK = 10;
export const TICKS_POR_PARTIDA = 540;

export function tickParaMinuto(tick: number): number {
  return Math.floor((tick * SEGUNDOS_POR_TICK) / 60);
}

export type Lado = "CASA" | "FORA";

/** Zona da bola do ponto de vista do time com a posse. */
export type Zona = "DEFESA" | "MEIO" | "ATAQUE";

export type Formacao = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2";

export interface Escalacao {
  clubeId: number;
  formacao: Formacao;
  /** 11 jogadores, na ordem das posições da formação (goleiro primeiro). */
  titulares: Jogador[];
  reservas: Jogador[];
}

export type TipoEvento =
  | "GOL"
  | "DEFESA_GOLEIRO"
  | "CHUTE_PARA_FORA"
  | "ESCANTEIO"
  | "FALTA"
  | "CARTAO_AMARELO"
  | "CARTAO_VERMELHO"
  | "LESAO";

export interface EventoPartida {
  tick: number;
  minuto: number;
  time: Lado;
  tipo: TipoEvento;
  jogadorId: number | null;
}

export type ResultadoChute = "GOL" | "DEFESA" | "ESCANTEIO" | "PARA_FORA";

export type CausaPerda = "DESARME" | "PASSE_INTERCEPTADO" | "BOLA_FORA";

/** O que aconteceu em um tick, para a tela encenar o lance. */
export type Lance =
  | { tipo: "PASSE"; passadorId: number; zonaOrigem: Zona }
  | { tipo: "PERDA"; causa: CausaPerda; perdedorId: number; zonaOrigem: Zona }
  | {
      tipo: "CHUTE";
      passadorId: number;
      chutadorId: number;
      goleiroId: number | null;
      resultado: ResultadoChute;
    }
  | { tipo: "FALTA"; autorId: number; vitimaId: number };

/** Situação no fim do tick: com quem fica a bola, em que zona, e o lance que levou até aqui. */
export interface RegistroTick {
  tick: number;
  posse: Lado;
  zona: Zona;
  jogadorComBolaId: number;
  lance: Lance;
}

export interface Placar {
  casa: number;
  fora: number;
}

export interface EstatisticasLado {
  posseTicks: number;
  finalizacoes: number;
  finalizacoesNoAlvo: number;
  escanteios: number;
  faltas: number;
}

export interface ResultadoPartida {
  placar: Placar;
  eventos: EventoPartida[];
  ticks: RegistroTick[];
  estatisticas: Record<Lado, EstatisticasLado>;
}
