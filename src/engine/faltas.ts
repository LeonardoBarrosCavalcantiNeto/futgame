import { FORMACOES } from "./formacoes";
import { setorDaPosicao } from "./forca-time";
import { adversario, type ContextoTick, type EstadoBola } from "./tick";
import type { Zona } from "./tipos-partida";

/** Cerca de 25 faltas por jogo (540 ticks), somando os dois times. */
export const CHANCE_FALTA_POR_TICK = 0.046;
const CHANCE_AMARELO = 0.17;
const CHANCE_VERMELHO_DIRETO = 0.004;
/** Quem já tem amarelo tenta evitar a falta: chance de o sorteio do autor ser repetido uma vez. */
const CHANCE_CAUTELA = 0.8;

/** Setor de quem defende, conforme a zona do time com a bola. */
const SETOR_DO_DEFENSOR: Record<Zona, "defesa" | "meio" | "ataque"> = {
  DEFESA: "ataque",
  MEIO: "meio",
  ATAQUE: "defesa",
};

export interface Disciplina {
  amarelos: Map<number, number>;
  expulsos: Set<number>;
}

export interface OcorrenciaFalta {
  tipo: "FALTA" | "CARTAO_AMARELO" | "CARTAO_VERMELHO";
  jogadorId: number;
}

export function criarDisciplina(): Disciplina {
  return { amarelos: new Map(), expulsos: new Set() };
}

/** Sorteia se há falta neste tick. Devolve a lista de ocorrências (vazia se não houve falta). */
export function sortearFalta(
  estado: EstadoBola,
  contexto: ContextoTick,
  disciplina: Disciplina,
): OcorrenciaFalta[] {
  const { escalacoes, aleatorio } = contexto;
  if (!aleatorio.chance(CHANCE_FALTA_POR_TICK)) return [];

  const escalacao = escalacoes[adversario(estado.posse)];
  const vagas = FORMACOES[escalacao.formacao];
  const setor = SETOR_DO_DEFENSOR[estado.zona];

  const candidatos = escalacao.titulares.filter((jogador, indice) => {
    const vaga = vagas[indice];
    return (
      vaga !== undefined &&
      setorDaPosicao(vaga.posicao) === setor &&
      !disciplina.expulsos.has(jogador.id)
    );
  });
  if (candidatos.length === 0) return [];

  let autor = aleatorio.escolher(candidatos);
  if (disciplina.amarelos.has(autor.id) && aleatorio.chance(CHANCE_CAUTELA)) {
    autor = aleatorio.escolher(candidatos);
  }

  const ocorrencias: OcorrenciaFalta[] = [{ tipo: "FALTA", jogadorId: autor.id }];

  if (aleatorio.chance(CHANCE_VERMELHO_DIRETO)) {
    disciplina.expulsos.add(autor.id);
    ocorrencias.push({ tipo: "CARTAO_VERMELHO", jogadorId: autor.id });
  } else if (aleatorio.chance(CHANCE_AMARELO)) {
    const amarelos = (disciplina.amarelos.get(autor.id) ?? 0) + 1;
    disciplina.amarelos.set(autor.id, amarelos);
    ocorrencias.push({ tipo: "CARTAO_AMARELO", jogadorId: autor.id });

    if (amarelos >= 2) {
      disciplina.expulsos.add(autor.id);
      ocorrencias.push({ tipo: "CARTAO_VERMELHO", jogadorId: autor.id });
    }
  }

  return ocorrencias;
}
