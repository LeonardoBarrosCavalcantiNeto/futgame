import { describe, expect, it } from "vitest";
import type { AtributosGoleiro, AtributosLinha, Jogador } from "../modelos/jogador";
import { calcularOvr } from "./calcular-ovr";
import { PESOS_GOLEIRO, PESOS_LINHA } from "./pesos";

const soma = (pesos: Record<string, number>) => Object.values(pesos).reduce((a, b) => a + b, 0);

function atributosLinha(valor: number): AtributosLinha {
  return {
    ritmo: valor,
    finalizacao: valor,
    passe: valor,
    drible: valor,
    defesa: valor,
    fisico: valor,
  };
}

function atributosGoleiro(valor: number): AtributosGoleiro {
  return {
    elasticidade: valor,
    manejo: valor,
    chute: valor,
    reflexos: valor,
    velocidade: valor,
    posicionamento: valor,
  };
}

function jogadorLinha(posicao: "ZAG" | "ATA", atributos: AtributosLinha): Jogador {
  return {
    id: 1,
    nome: "Teste",
    dataNascimento: "2000-01-01",
    nacionalidade: "Brasil",
    pe: "D",
    potencial: 80,
    contrato: null,
    posicao,
    atributos,
  };
}

function goleiro(atributos: AtributosGoleiro): Jogador {
  return {
    id: 2,
    nome: "Goleiro",
    dataNascimento: "2000-01-01",
    nacionalidade: "Brasil",
    pe: "D",
    potencial: 80,
    contrato: null,
    posicao: "GOL",
    atributos,
  };
}

describe("pesos de OVR", () => {
  it("somam 1 em todas as posições de linha", () => {
    for (const pesos of Object.values(PESOS_LINHA)) {
      expect(soma(pesos)).toBeCloseTo(1, 5);
    }
  });

  it("somam 1 para o goleiro", () => {
    expect(soma(PESOS_GOLEIRO)).toBeCloseTo(1, 5);
  });
});

describe("calcularOvr", () => {
  it("devolve o próprio valor quando todos os atributos são iguais", () => {
    expect(calcularOvr(jogadorLinha("ATA", atributosLinha(70)))).toBe(70);
    expect(calcularOvr(goleiro(atributosGoleiro(60)))).toBe(60);
  });

  it("calcula a média ponderada do atacante", () => {
    const ata = jogadorLinha("ATA", {
      ritmo: 80,
      finalizacao: 90,
      passe: 60,
      drible: 80,
      defesa: 30,
      fisico: 70,
    });
    // 80*0.17 + 90*0.42 + 60*0.08 + 80*0.17 + 30*0.03 + 70*0.13 = 80.0
    expect(calcularOvr(ata)).toBe(80);
  });

  it("pesa os grupos de forma diferente conforme a posição", () => {
    const atributos: AtributosLinha = {
      ritmo: 50,
      finalizacao: 90,
      passe: 50,
      drible: 50,
      defesa: 30,
      fisico: 50,
    };
    const ata = calcularOvr(jogadorLinha("ATA", atributos));
    const zag = calcularOvr(jogadorLinha("ZAG", atributos));
    expect(ata).toBeGreaterThan(zag);
  });

  it("calcula o OVR do goleiro com a tabela de goleiro", () => {
    const gol = goleiro({
      elasticidade: 80,
      manejo: 70,
      chute: 50,
      reflexos: 90,
      velocidade: 40,
      posicionamento: 80,
    });
    // 80*0.2 + 70*0.2 + 50*0.1 + 90*0.25 + 40*0.05 + 80*0.2 = 75.5 -> 76
    expect(calcularOvr(gol)).toBe(76);
  });

  it("limita o resultado entre 0 e 99", () => {
    expect(calcularOvr(jogadorLinha("ATA", atributosLinha(99)))).toBe(99);
    expect(calcularOvr(jogadorLinha("ATA", atributosLinha(0)))).toBe(0);
  });
});
