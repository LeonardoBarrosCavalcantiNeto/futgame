import type { Aleatorio } from "../core/aleatorio";
import type { Jogador } from "../core/modelos/jogador";
import { FORMACOES } from "./formacoes";
import { setorDaPosicao, type ForcaTime } from "./forca-time";
import type { Escalacao, Lado, RegistroTick, Zona } from "./tipos-partida";

export type EstadoBola = Omit<RegistroTick, "tick">;

export interface ContextoTick {
  escalacoes: Record<Lado, Escalacao>;
  forcas: Record<Lado, ForcaTime>;
  aleatorio: Aleatorio;
}

export interface ResultadoTick {
  estado: EstadoBola;
  /** true quando o time com a bola chuta neste tick; o chutador é estado.jogadorComBolaId. */
  finalizacao: boolean;
}

/** Chance base de perder a bola em cada zona (time com a força igual à do rival). */
const CHANCE_PERDA: Record<Zona, number> = { DEFESA: 0.1, MEIO: 0.22, ATAQUE: 0.3 };

/** Chance base de avançar (no ataque, de finalizar) quando não perdeu a bola. */
const CHANCE_AVANCO: Record<Zona, number> = { DEFESA: 0.5, MEIO: 0.25, ATAQUE: 0.25 };

const ZONA_APOS_AVANCO: Record<Zona, Zona> = { DEFESA: "MEIO", MEIO: "ATAQUE", ATAQUE: "ATAQUE" };

/** Zona de quem recupera a bola, do ponto de vista dele. */
const ZONA_APOS_PERDA: Record<Zona, Zona> = { DEFESA: "MEIO", MEIO: "MEIO", ATAQUE: "DEFESA" };

const SETOR_DA_ZONA: Record<Zona, "defesa" | "meio" | "ataque"> = {
  DEFESA: "defesa",
  MEIO: "meio",
  ATAQUE: "ataque",
};

export function adversario(lado: Lado): Lado {
  return lado === "CASA" ? "FORA" : "CASA";
}

function limitar(valor: number): number {
  return Math.min(1, Math.max(0, valor));
}

/** Parte do duelo que fica com quem tem a bola (0 a 1). */
function vantagemDoAtacante(zona: Zona, atacante: ForcaTime, defensor: ForcaTime): number {
  let forcaAtaque: number;
  let forcaDefesa: number;

  if (zona === "DEFESA") {
    forcaAtaque = atacante.meio;
    forcaDefesa = defensor.ataque;
  } else if (zona === "MEIO") {
    forcaAtaque = atacante.meio;
    forcaDefesa = defensor.meio;
  } else {
    forcaAtaque = atacante.ataque;
    forcaDefesa = defensor.defesa;
  }

  const total = forcaAtaque + forcaDefesa;
  return total === 0 ? 0.5 : forcaAtaque / total;
}

export function sortearPortador(escalacao: Escalacao, zona: Zona, aleatorio: Aleatorio): Jogador {
  const setor = SETOR_DA_ZONA[zona];
  const vagas = FORMACOES[escalacao.formacao];
  const candidatos = escalacao.titulares.filter((_, indice) => {
    const vaga = vagas[indice];
    return vaga !== undefined && setorDaPosicao(vaga.posicao) === setor;
  });
  return aleatorio.escolher(candidatos);
}

export function resolverTick(estado: EstadoBola, contexto: ContextoTick): ResultadoTick {
  const { escalacoes, forcas, aleatorio } = contexto;
  const atacante = estado.posse;
  const defensor = adversario(atacante);

  const vantagem = vantagemDoAtacante(estado.zona, forcas[atacante], forcas[defensor]);
  const chancePerda = limitar(CHANCE_PERDA[estado.zona] * 2 * (1 - vantagem));
  const chanceAvanco = limitar(CHANCE_AVANCO[estado.zona] * 2 * vantagem);

  let posse: Lado = atacante;
  let zona: Zona = estado.zona;
  let finalizacao = false;

  if (aleatorio.chance(chancePerda)) {
    posse = defensor;
    zona = ZONA_APOS_PERDA[estado.zona];
  } else if (aleatorio.chance(chanceAvanco)) {
    if (estado.zona === "ATAQUE") {
      finalizacao = true;
    } else {
      zona = ZONA_APOS_AVANCO[estado.zona];
    }
  }

  const portador = sortearPortador(escalacoes[posse], zona, aleatorio);

  return {
    estado: { posse, zona, jogadorComBolaId: portador.id },
    finalizacao,
  };
}
