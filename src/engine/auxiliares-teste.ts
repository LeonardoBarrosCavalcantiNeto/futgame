import type { Jogador, Posicao } from "../core/modelos/jogador";
import { FORMACOES } from "./formacoes";
import type { Escalacao } from "./tipos-partida";

export function criarJogador(id: number, posicao: Posicao, valor: number): Jogador {
  const base = {
    id,
    nome: `Jogador ${id}`,
    dataNascimento: "2000-01-01",
    nacionalidade: "Brasil",
    pe: "D" as const,
    potencial: 80,
    contrato: null,
  };

  if (posicao === "GOL") {
    return {
      ...base,
      posicao,
      atributos: {
        elasticidade: valor,
        manejo: valor,
        chute: valor,
        reflexos: valor,
        velocidade: valor,
        posicionamento: valor,
      },
    };
  }

  return {
    ...base,
    posicao,
    atributos: {
      ritmo: valor,
      finalizacao: valor,
      passe: valor,
      drible: valor,
      defesa: valor,
      fisico: valor,
    },
  };
}

/** Escalação 4-3-3 com ids sequenciais a partir de idInicial. */
export function escalar(
  valorPorPosicao: (posicao: Posicao) => number,
  clubeId = 1,
  idInicial = 0,
): Escalacao {
  return {
    clubeId,
    formacao: "4-3-3",
    titulares: FORMACOES["4-3-3"].map((vaga, i) =>
      criarJogador(idInicial + i, vaga.posicao, valorPorPosicao(vaga.posicao)),
    ),
    reservas: [],
  };
}
