import { describe, expect, it } from "vitest";
import { FORMACOES, posicaoBase } from "./formacoes";
import type { Formacao } from "./tipos-partida";

const nomes = Object.keys(FORMACOES) as Formacao[];

describe("formações", () => {
  it.each(nomes)("%s tem 11 vagas, com o goleiro primeiro", (nome) => {
    const vagas = FORMACOES[nome];
    expect(vagas).toHaveLength(11);
    expect(vagas[0]?.posicao).toBe("GOL");
    expect(vagas.filter((v) => v.posicao === "GOL")).toHaveLength(1);
  });

  it.each(nomes)("%s tem coordenadas entre 0 e 1", (nome) => {
    for (const vaga of FORMACOES[nome]) {
      expect(vaga.x).toBeGreaterThanOrEqual(0);
      expect(vaga.x).toBeLessThanOrEqual(1);
      expect(vaga.y).toBeGreaterThanOrEqual(0);
      expect(vaga.y).toBeLessThanOrEqual(1);
    }
  });

  it.each(nomes)("%s soma 10 jogadores de linha", (nome) => {
    const linha = FORMACOES[nome].filter((v) => v.posicao !== "GOL");
    expect(linha).toHaveLength(10);
  });
});

describe("posicaoBase", () => {
  it("mantém as coordenadas do time da CASA", () => {
    expect(posicaoBase("4-3-3", 0, "CASA")).toEqual({ x: 0.05, y: 0.5 });
  });

  it("espelha as coordenadas do time de FORA", () => {
    const ponto = posicaoBase("4-3-3", 1, "FORA");
    expect(ponto.x).toBeCloseTo(0.75, 5);
    expect(ponto.y).toBeCloseTo(0.12, 5);
  });

  it("lança erro para uma vaga inexistente", () => {
    expect(() => posicaoBase("4-4-2", 11, "CASA")).toThrow();
  });
});
