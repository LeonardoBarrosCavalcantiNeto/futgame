import { describe, it, expect } from "vitest";
import { Aleatorio } from "./aleatorio";

function sequencia(rng: Aleatorio, n: number): number[] {
  return Array.from({ length: n }, () => rng.proximo());
}

describe("Aleatorio", () => {
  it("mesma seed gera a mesma sequência", () => {
    expect(sequencia(new Aleatorio(42), 100)).toEqual(sequencia(new Aleatorio(42), 100));
  });

  it("seeds diferentes geram sequências diferentes", () => {
    expect(sequencia(new Aleatorio(1), 10)).not.toEqual(sequencia(new Aleatorio(2), 10));
  });

  it("proximo fica sempre em [0, 1) e a média é próxima de 0,5", () => {
    const valores = sequencia(new Aleatorio(7), 10000);
    expect(valores.every((v) => v >= 0 && v < 1)).toBe(true);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    expect(media).toBeGreaterThan(0.48);
    expect(media).toBeLessThan(0.52);
  });

  it("inteiro respeita o intervalo e alcança todos os valores", () => {
    const rng = new Aleatorio(3);
    const vistos = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = rng.inteiro(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      vistos.add(v);
    }
    expect(vistos.size).toBe(6);
  });

  it("restaurar o estado continua a mesma sequência", () => {
    const rng = new Aleatorio(99);
    sequencia(rng, 5);
    const estado = rng.obterEstado();
    const esperado = sequencia(rng, 5);
    const outro = new Aleatorio(0);
    outro.definirEstado(estado);
    expect(sequencia(outro, 5)).toEqual(esperado);
  });

  it("escolher falha com lista vazia", () => {
    expect(() => new Aleatorio(1).escolher([])).toThrow();
  });
});
