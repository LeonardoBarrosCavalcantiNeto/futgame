import { describe, expect, it } from "vitest";
import type { Jogador, Posicao } from "../core/modelos/jogador";
import { FORMACOES } from "./formacoes";
import { calcularForca } from "./forca-time";
import type { Escalacao } from "./tipos-partida";

function jogador(id: number, posicao: Posicao, valor: number): Jogador {
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

function escalar(valorPorPosicao: (posicao: Posicao) => number): Escalacao {
  return {
    clubeId: 1,
    formacao: "4-3-3",
    titulares: FORMACOES["4-3-3"].map((vaga, i) =>
      jogador(i, vaga.posicao, valorPorPosicao(vaga.posicao)),
    ),
    reservas: [],
  };
}

describe("calcularForca", () => {
  it("devolve o mesmo valor em todos os setores quando o time é uniforme", () => {
    expect(calcularForca(escalar(() => 70))).toEqual({
      goleiro: 70,
      defesa: 70,
      meio: 70,
      ataque: 70,
    });
  });

  it("separa os setores conforme a vaga na formação", () => {
    const forca = calcularForca(escalar((p) => (p === "PON" || p === "ATA" ? 90 : 70)));
    expect(forca.ataque).toBe(90);
    expect(forca.meio).toBe(70);
    expect(forca.defesa).toBe(70);
    expect(forca.goleiro).toBe(70);
  });

  it("lança erro se a escalação não tem 11 titulares", () => {
    const escalacao = escalar(() => 70);
    escalacao.titulares.pop();
    expect(() => calcularForca(escalacao)).toThrow();
  });
});
