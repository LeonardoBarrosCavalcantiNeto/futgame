import { ehGoleiro, type Jogador } from "../core/modelos/jogador";
import { adversario, sortearPortador, type ContextoTick, type EstadoBola } from "./tick";
import type { ResultadoChute, Zona } from "./tipos-partida";

export interface ResultadoFinalizacao {
  resultado: ResultadoChute;
  noAlvo: boolean;
  /** Estado da bola depois do chute (posse, zona e quem está com ela). */
  estado: EstadoBola;
}

/** Valor usado quando um jogador ocupa uma vaga que não é a dele (goleiro na linha ou vice-versa). */
const VALOR_FORA_DE_POSICAO = 20;

const CHANCE_NO_ALVO_BASE = 0.2;
const CHANCE_NO_ALVO_QUALIDADE = 0.3;
const CHANCE_GOL_BASE = 0.28;
const CHANCE_ESCANTEIO_NA_DEFESA = 0.3;

function qualidadeDoChute(jogador: Jogador): number {
  return ehGoleiro(jogador) ? VALOR_FORA_DE_POSICAO : jogador.atributos.finalizacao;
}

function qualidadeDoGoleiro(jogador: Jogador): number {
  if (!ehGoleiro(jogador)) return VALOR_FORA_DE_POSICAO;
  const { reflexos, elasticidade, posicionamento } = jogador.atributos;
  return reflexos * 0.4 + elasticidade * 0.3 + posicionamento * 0.3;
}

function proximoEstado(
  resultado: ResultadoChute,
  estado: EstadoBola,
  contexto: ContextoTick,
): EstadoBola {
  let posse = adversario(estado.posse);
  let zona: Zona = "DEFESA";

  if (resultado === "GOL") {
    zona = "MEIO";
  } else if (resultado === "ESCANTEIO") {
    posse = estado.posse;
    zona = "ATAQUE";
  }

  const portador = sortearPortador(contexto.escalacoes[posse], zona, contexto.aleatorio);
  return { posse, zona, jogadorComBolaId: portador.id };
}

export function resolverFinalizacao(
  estado: EstadoBola,
  contexto: ContextoTick,
): ResultadoFinalizacao {
  const { escalacoes, aleatorio } = contexto;

  const chutador = escalacoes[estado.posse].titulares.find(
    (jogador) => jogador.id === estado.jogadorComBolaId,
  );
  if (!chutador) {
    throw new Error(`O chutador ${estado.jogadorComBolaId} não está em campo.`);
  }

  const goleiro = escalacoes[adversario(estado.posse)].titulares[0];
  if (!goleiro) {
    throw new Error("O time adversário não tem goleiro em campo.");
  }

  const qualidade = qualidadeDoChute(chutador);
  const defesa = qualidadeDoGoleiro(goleiro);

  const chanceNoAlvo = CHANCE_NO_ALVO_BASE + (qualidade / 100) * CHANCE_NO_ALVO_QUALIDADE;

  let resultado: ResultadoChute;
  let noAlvo = true;

  if (!aleatorio.chance(chanceNoAlvo)) {
    resultado = "PARA_FORA";
    noAlvo = false;
  } else {
    const total = qualidade + defesa;
    const vantagem = total === 0 ? 0.5 : qualidade / total;
    const chanceGol = Math.min(1, CHANCE_GOL_BASE * 2 * vantagem);

    if (aleatorio.chance(chanceGol)) {
      resultado = "GOL";
    } else if (aleatorio.chance(CHANCE_ESCANTEIO_NA_DEFESA)) {
      resultado = "ESCANTEIO";
    } else {
      resultado = "DEFESA";
    }
  }

  return { resultado, noAlvo, estado: proximoEstado(resultado, estado, contexto) };
}
