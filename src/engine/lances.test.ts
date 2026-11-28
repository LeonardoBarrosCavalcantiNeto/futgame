import { describe, expect, it } from "vitest";
import { escalar } from "./auxiliares-teste";
import { simularPartida } from "./partida";
import {
  TICKS_POR_PARTIDA,
  type CausaPerda,
  type Lance,
  type RegistroTick,
  type ResultadoPartida,
  type Zona,
} from "./tipos-partida";

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

/** Nas saídas de bola dos dois tempos o estado é reiniciado, então esses ticks ficam de fora dos pares. */
const TICKS_DE_SAIDA = [0, TICKS_POR_PARTIDA / 2];

const ZONA_APOS_PERDA: Record<Zona, Zona> = { DEFESA: "MEIO", MEIO: "MEIO", ATAQUE: "DEFESA" };

interface Par {
  anterior: RegistroTick;
  atual: RegistroTick;
}

function jogar(seed: number): ResultadoPartida {
  return simularPartida(
    escalar(() => 70, 1, 0),
    escalar(() => 70, 2, 100),
    seed,
  );
}

function pares(resultado: ResultadoPartida): Par[] {
  const lista: Par[] = [];
  for (let i = 1; i < resultado.ticks.length; i++) {
    if (TICKS_DE_SAIDA.includes(i)) continue;
    const anterior = resultado.ticks[i - 1];
    const atual = resultado.ticks[i];
    if (anterior && atual) lista.push({ anterior, atual });
  }
  return lista;
}

function quemTinhaABola(lance: Lance): number {
  switch (lance.tipo) {
    case "PASSE":
    case "CHUTE":
      return lance.passadorId;
    case "PERDA":
      return lance.perdedorId;
    case "FALTA":
      return lance.vitimaId;
  }
}

describe("lances registrados em cada tick", () => {
  it("só troca a bola de time em perdas e chutes", () => {
    for (const seed of SEEDS) {
      for (const { anterior, atual } of pares(jogar(seed))) {
        const trocou = atual.posse !== anterior.posse;
        if (atual.lance.tipo === "PERDA") expect(trocou).toBe(true);
        if (atual.lance.tipo === "PASSE" || atual.lance.tipo === "FALTA") {
          expect(trocou).toBe(false);
        }
        if (trocou) expect(["PERDA", "CHUTE"]).toContain(atual.lance.tipo);
      }
    }
  });

  it("começa cada lance com quem estava com a bola no tick anterior", () => {
    for (const seed of SEEDS) {
      for (const { anterior, atual } of pares(jogar(seed))) {
        expect(quemTinhaABola(atual.lance)).toBe(anterior.jogadorComBolaId);
      }
    }
  });

  it("entrega a bola, numa perda, a um jogador do outro time e na zona certa", () => {
    for (const seed of SEEDS) {
      for (const { anterior, atual } of pares(jogar(seed))) {
        if (atual.lance.tipo !== "PERDA") continue;
        expect(atual.lance.perdedorId < 100).toBe(anterior.posse === "CASA");
        expect(atual.jogadorComBolaId < 100).toBe(atual.posse === "CASA");
        expect(atual.lance.zonaOrigem).toBe(anterior.zona);
        expect(atual.zona).toBe(ZONA_APOS_PERDA[atual.lance.zonaOrigem]);
      }
    }
  });

  it("faz o chutador ser do time que atacava", () => {
    for (const seed of SEEDS) {
      for (const { anterior, atual } of pares(jogar(seed))) {
        if (atual.lance.tipo !== "CHUTE") continue;
        expect(atual.lance.chutadorId < 100).toBe(anterior.posse === "CASA");
      }
    }
  });

  it("registra um lance de chute por finalização e um de falta por falta", () => {
    for (const seed of SEEDS) {
      const resultado = jogar(seed);
      const { CASA, FORA } = resultado.estatisticas;
      const chutes = resultado.ticks.filter((t) => t.lance.tipo === "CHUTE").length;
      const faltas = resultado.ticks.filter((t) => t.lance.tipo === "FALTA").length;
      expect(chutes).toBe(CASA.finalizacoes + FORA.finalizacoes);
      expect(faltas).toBe(CASA.faltas + FORA.faltas);
    }
  });

  it("divide as perdas em cerca de 40% desarmes, 40% interceptações e 20% bolas fora", () => {
    const contagem: Record<CausaPerda, number> = {
      DESARME: 0,
      PASSE_INTERCEPTADO: 0,
      BOLA_FORA: 0,
    };

    for (let seed = 1; seed <= 200; seed++) {
      for (const registro of jogar(seed).ticks) {
        if (registro.lance.tipo === "PERDA") contagem[registro.lance.causa] += 1;
      }
    }

    const total = contagem.DESARME + contagem.PASSE_INTERCEPTADO + contagem.BOLA_FORA;
    expect(contagem.DESARME / total).toBeGreaterThan(0.36);
    expect(contagem.DESARME / total).toBeLessThan(0.44);
    expect(contagem.PASSE_INTERCEPTADO / total).toBeGreaterThan(0.36);
    expect(contagem.PASSE_INTERCEPTADO / total).toBeLessThan(0.44);
    expect(contagem.BOLA_FORA / total).toBeGreaterThan(0.16);
    expect(contagem.BOLA_FORA / total).toBeLessThan(0.24);
  });
});
