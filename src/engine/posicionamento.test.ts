import { describe, expect, it } from "vitest";
import { escalar } from "./auxiliares-teste";
import { calcularPosicoes, type PosicoesTick } from "./posicionamento";
import type { Lado, Zona } from "./tipos-partida";

const escalacoes = {
  CASA: escalar(() => 70, 1, 0),
  FORA: escalar(() => 70, 2, 100),
};

function posicoes(posse: Lado, zona: Zona, jogadorComBolaId: number): PosicoesTick {
  return calcularPosicoes({ posse, zona, jogadorComBolaId }, escalacoes);
}

function xDe(resultado: PosicoesTick, id: number): number {
  return resultado.jogadores.find((jogador) => jogador.id === id)?.x ?? Number.NaN;
}

const ZONAS: Zona[] = ["DEFESA", "MEIO", "ATAQUE"];

describe("calcularPosicoes", () => {
  it("posiciona os 22 jogadores dentro do campo", () => {
    for (const zona of ZONAS) {
      const resultado = posicoes("CASA", zona, 5);
      expect(resultado.jogadores).toHaveLength(22);
      for (const jogador of resultado.jogadores) {
        expect(jogador.x).toBeGreaterThanOrEqual(0);
        expect(jogador.x).toBeLessThanOrEqual(1);
        expect(jogador.y).toBeGreaterThanOrEqual(0);
        expect(jogador.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("coloca a bola junto de quem está com ela", () => {
    const resultado = posicoes("CASA", "ATAQUE", 9);
    const portador = resultado.jogadores.find((j) => j.id === 9);
    expect(Math.abs(resultado.bola.x - (portador?.x ?? 0))).toBeLessThan(0.05);
    expect(resultado.bola.y).toBeCloseTo(portador?.y ?? -1, 5);
  });

  it("mantém cada goleiro perto do próprio gol", () => {
    for (const zona of ZONAS) {
      const resultado = posicoes("CASA", zona, 5);
      expect(xDe(resultado, 0)).toBeLessThan(0.15);
      expect(xDe(resultado, 100)).toBeGreaterThan(0.85);
    }
  });

  it("faz o time com a bola subir quando ela está no ataque", () => {
    const noAtaque = posicoes("CASA", "ATAQUE", 9);
    const naDefesa = posicoes("CASA", "DEFESA", 2);
    expect(xDe(noAtaque, 2)).toBeGreaterThan(xDe(naDefesa, 2));
  });

  it("faz o adversário recuar quando o rival ataca", () => {
    const rivalAtaca = posicoes("CASA", "ATAQUE", 9);
    const rivalDefende = posicoes("CASA", "DEFESA", 2);
    // A FORA defende o gol do lado direito: recuar significa x maior.
    expect(xDe(rivalAtaca, 102)).toBeGreaterThan(xDe(rivalDefende, 102));
  });

  it("espelha a bola quando a FORA tem a posse", () => {
    const resultado = posicoes("FORA", "ATAQUE", 109);
    expect(resultado.bola.x).toBeLessThan(0.5);
  });

  it("lança erro se quem tem a bola não está em campo", () => {
    expect(() => posicoes("CASA", "MEIO", 999)).toThrow();
  });
});
