import type { Posicao } from "../core/modelos/jogador";
import { calcularOvr } from "../core/ovr/calcular-ovr";
import { FORMACOES } from "./formacoes";
import type { Escalacao } from "./tipos-partida";

export interface ForcaTime {
  goleiro: number;
  defesa: number;
  meio: number;
  ataque: number;
}

type Setor = keyof ForcaTime;

function setorDaPosicao(posicao: Posicao): Setor {
  switch (posicao) {
    case "GOL":
      return "goleiro";
    case "ZAG":
    case "LD":
    case "LE":
      return "defesa";
    case "VOL":
    case "MC":
    case "MEI":
      return "meio";
    case "PON":
    case "ATA":
      return "ataque";
  }
}

export function calcularForca(escalacao: Escalacao): ForcaTime {
  const vagas = FORMACOES[escalacao.formacao];
  if (escalacao.titulares.length !== vagas.length) {
    throw new Error(
      `Escalação inválida: ${escalacao.titulares.length} titulares para ${escalacao.formacao}.`,
    );
  }

  const somas: Record<Setor, number> = { goleiro: 0, defesa: 0, meio: 0, ataque: 0 };
  const contagens: Record<Setor, number> = { goleiro: 0, defesa: 0, meio: 0, ataque: 0 };

  escalacao.titulares.forEach((jogador, indice) => {
    const vaga = vagas[indice];
    if (!vaga) return;
    const setor = setorDaPosicao(vaga.posicao);
    somas[setor] += calcularOvr(jogador);
    contagens[setor] += 1;
  });

  const media = (setor: Setor) => (contagens[setor] === 0 ? 0 : somas[setor] / contagens[setor]);

  return {
    goleiro: media("goleiro"),
    defesa: media("defesa"),
    meio: media("meio"),
    ataque: media("ataque"),
  };
}
