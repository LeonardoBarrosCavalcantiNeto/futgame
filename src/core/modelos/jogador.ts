export type PosicaoLinha = "ZAG" | "LD" | "LE" | "VOL" | "MC" | "MEI" | "PON" | "ATA";
export type Posicao = "GOL" | PosicaoLinha;
export type Pe = "D" | "E" | "A";

export interface AtributosLinha {
  ritmo: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
}

export interface AtributosGoleiro {
  elasticidade: number;
  manejo: number;
  chute: number;
  reflexos: number;
  velocidade: number;
  posicionamento: number;
}

export interface Contrato {
  id: number;
  clubeId: number;
  salario: number;
  dataInicio: string;
  dataFim: string;
}

interface JogadorBase {
  id: number;
  nome: string;
  dataNascimento: string;
  nacionalidade: string;
  pe: Pe;
  potencial: number;
  contrato: Contrato | null;
}

export interface JogadorGoleiro extends JogadorBase {
  posicao: "GOL";
  atributos: AtributosGoleiro;
}

export interface JogadorLinha extends JogadorBase {
  posicao: PosicaoLinha;
  atributos: AtributosLinha;
}

export type Jogador = JogadorGoleiro | JogadorLinha;

export function ehGoleiro(jogador: Jogador): jogador is JogadorGoleiro {
  return jogador.posicao === "GOL";
}
