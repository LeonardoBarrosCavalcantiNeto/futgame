import { FORMACOES, type Ponto, type Vaga } from "./formacoes";
import { adversario } from "./tick";
import type { Escalacao, Lado, RegistroTick, Zona } from "./tipos-partida";

export interface JogadorPosicionado {
  id: number;
  lado: Lado;
  x: number;
  y: number;
}

export interface PosicoesTick {
  jogadores: JogadorPosicionado[];
  bola: Ponto;
}

/** Parte do campo (0 a 1, no sentido de ataque) onde a bola está em cada zona. */
const X_DA_ZONA: Record<Zona, number> = { DEFESA: 0.22, MEIO: 0.5, ATAQUE: 0.78 };

const RECUO_BASE = 0.04;
const COMPRESSAO = 0.56;
const SOBE_COM_A_BOLA = 0.5;
const RECUA_SEM_A_BOLA = 0.4;
const FATOR_GOLEIRO = 0.2;
const BOLA_A_FRENTE = 0.012;

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

function posicaoNoCampo(lado: Lado, vaga: Vaga, deslocamento: number): Ponto {
  const fator = vaga.posicao === "GOL" ? FATOR_GOLEIRO : 1;
  const xProprio = limitar(RECUO_BASE + vaga.x * COMPRESSAO + deslocamento * fator, 0.02, 0.98);
  return lado === "CASA" ? { x: xProprio, y: vaga.y } : { x: 1 - xProprio, y: 1 - vaga.y };
}

export function calcularPosicoes(
  registro: Pick<RegistroTick, "posse" | "zona" | "jogadorComBolaId">,
  escalacoes: Record<Lado, Escalacao>,
): PosicoesTick {
  const ancora = X_DA_ZONA[registro.zona];
  const deslocamentos: Record<Lado, number> = {
    [registro.posse]: (ancora - 0.5) * SOBE_COM_A_BOLA,
    [adversario(registro.posse)]: (0.5 - ancora) * RECUA_SEM_A_BOLA,
  } as Record<Lado, number>;

  const jogadores: JogadorPosicionado[] = [];
  for (const lado of ["CASA", "FORA"] as const) {
    const escalacao = escalacoes[lado];
    const vagas = FORMACOES[escalacao.formacao];
    escalacao.titulares.forEach((jogador, indice) => {
      const vaga = vagas[indice];
      if (!vaga) return;
      const ponto = posicaoNoCampo(lado, vaga, deslocamentos[lado]);
      jogadores.push({ id: jogador.id, lado, x: ponto.x, y: ponto.y });
    });
  }

  const portador = jogadores.find((jogador) => jogador.id === registro.jogadorComBolaId);
  if (!portador) {
    throw new Error(`O jogador ${registro.jogadorComBolaId} com a bola não está em campo.`);
  }

  const sentido = registro.posse === "CASA" ? 1 : -1;
  const bola: Ponto = {
    x: limitar(portador.x + sentido * BOLA_A_FRENTE, 0, 1),
    y: portador.y,
  };

  return { jogadores, bola };
}
