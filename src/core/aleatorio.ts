/** Gerador pseudoaleatório com seed (algoritmo mulberry32). */
export class Aleatorio {
  private estado: number;

  constructor(seed: number) {
    if (!Number.isFinite(seed)) throw new Error("A seed deve ser um número finito.");
    this.estado = seed >>> 0;
  }

  /** Número decimal em [0, 1). */
  proximo(): number {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Inteiro entre min e max, ambos incluídos. */
  inteiro(min: number, max: number): number {
    if (min > max) throw new Error("min não pode ser maior que max.");
    return min + Math.floor(this.proximo() * (max - min + 1));
  }

  /** Retorna true com a probabilidade informada (0 a 1). */
  chance(probabilidade: number): boolean {
    return this.proximo() < probabilidade;
  }

  /** Sorteia um item da lista. */
  escolher<T>(lista: readonly T[]): T {
    if (lista.length === 0) throw new Error("A lista está vazia.");
    return lista[this.inteiro(0, lista.length - 1)];
  }

  obterEstado(): number {
    return this.estado;
  }

  definirEstado(estado: number): void {
    this.estado = estado >>> 0;
  }
}
