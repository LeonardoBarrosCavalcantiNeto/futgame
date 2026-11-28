import { describe, expect, it } from "vitest";
import { escalar } from "./auxiliares-teste";
import { criarCena, MS_POR_TICK, PASSOS_POR_TICK } from "./cena";
import { simularPartida } from "./partida";
import { TICKS_POR_PARTIDA } from "./tipos-partida";

const casa = escalar(() => 72, 1, 0);
const fora = escalar(() => 70, 2, 100);
const escalacoes = { CASA: casa, FORA: fora };
const resultado = simularPartida(casa, fora, 11);
const cena = criarCena(resultado, escalacoes);

const MS_POR_PASSO = MS_POR_TICK / PASSOS_POR_TICK;
const TOTAL_PASSOS = TICKS_POR_PARTIDA * PASSOS_POR_TICK;
const PASSO_DA_SAIDA_DO_2O_TEMPO = (TICKS_POR_PARTIDA / 2) * PASSOS_POR_TICK;
const CAMPO_X = 105;
const CAMPO_Y = 68;

describe("criarCena", () => {
  it("dura o número de ticks vezes a duração de cada tick", () => {
    expect(cena.totalTicks).toBe(TICKS_POR_PARTIDA);
    expect(cena.duracaoMs).toBe(TICKS_POR_PARTIDA * MS_POR_TICK);
    expect(cena.tickEm(-10)).toBe(0);
    expect(cena.tickEm(MS_POR_TICK * 3 + 1)).toBe(3);
    expect(cena.tickEm(cena.duracaoMs * 2)).toBe(TICKS_POR_PARTIDA - 1);
  });

  it("é reproduzível com a mesma seed", () => {
    const outra = criarCena(resultado, escalacoes);
    for (const tempo of [0, 12345, 99999, 250000, cena.duracaoMs]) {
      expect(outra.quadroEm(tempo)).toEqual(cena.quadroEm(tempo));
    }
  });

  it("mantém os 22 jogadores dentro do campo", () => {
    for (let tempo = 0; tempo <= cena.duracaoMs; tempo += 250) {
      const quadro = cena.quadroEm(tempo);
      expect(quadro.jogadores).toHaveLength(22);
      for (const ponto of quadro.jogadores) {
        expect(ponto.x).toBeGreaterThanOrEqual(0);
        expect(ponto.x).toBeLessThanOrEqual(1);
        expect(ponto.y).toBeGreaterThanOrEqual(0);
        expect(ponto.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("começa com a bola no centro do campo", () => {
    const { bola } = cena.quadroEm(0);
    expect(Math.abs(bola.x - 0.5)).toBeLessThan(0.02);
    expect(Math.abs(bola.y - 0.5)).toBeLessThan(0.02);
  });

  it("move os jogadores de forma contínua, sem saltos", () => {
    let maiorSalto = 0;
    let anterior = cena.quadroEm(0);
    for (let k = 1; k <= TOTAL_PASSOS; k++) {
      const atual = cena.quadroEm(k * MS_POR_PASSO);
      if (k - 1 !== PASSO_DA_SAIDA_DO_2O_TEMPO) {
        atual.jogadores.forEach((jogador, i) => {
          const antes = anterior.jogadores[i];
          if (!antes) return;
          const salto = Math.hypot(
            (jogador.x - antes.x) * CAMPO_X,
            (jogador.y - antes.y) * CAMPO_Y,
          );
          maiorSalto = Math.max(maiorSalto, salto);
        });
      }
      anterior = atual;
    }
    expect(maiorSalto).toBeLessThan(2.5);
  }, 30000);

  it("termina cada tick com a bola junto de quem a recebeu", () => {
    let maiorDistancia = 0;
    resultado.ticks.forEach((registro, tick) => {
      const quadro = cena.quadroEm((tick + 1) * MS_POR_TICK);
      const portador = quadro.jogadores.find((j) => j.id === registro.jogadorComBolaId);
      if (!portador) throw new Error("Portador não encontrado.");
      const distancia = Math.hypot(
        (quadro.bola.x - portador.x) * CAMPO_X,
        (quadro.bola.y - portador.y) * CAMPO_Y,
      );
      maiorDistancia = Math.max(maiorDistancia, distancia);
    });
    expect(maiorDistancia).toBeLessThan(1.6);
  });

  it("não deixa jogadores empilhados", () => {
    let menorDistancia = Number.POSITIVE_INFINITY;
    for (let tempo = 2000; tempo <= cena.duracaoMs; tempo += 200) {
      const { jogadores } = cena.quadroEm(tempo);
      for (let i = 0; i < jogadores.length; i++) {
        for (let j = i + 1; j < jogadores.length; j++) {
          const a = jogadores[i];
          const b = jogadores[j];
          if (!a || !b) continue;
          menorDistancia = Math.min(
            menorDistancia,
            Math.hypot((a.x - b.x) * CAMPO_X, (a.y - b.y) * CAMPO_Y),
          );
        }
      }
    }
    expect(menorDistancia).toBeGreaterThan(1);
  });

  it("faz cada jogador do time se mover de um jeito, e não todos juntos", () => {
    let somaDosDesvios = 0;
    const amostras = 10;

    for (let i = 0; i < amostras; i++) {
      const inicio = 30000 + i * 20000;
      const antes = cena.quadroEm(inicio);
      const depois = cena.quadroEm(inicio + 1000);
      const deslocamentos = depois.jogadores
        .map((jogador, k) => ({ jogador, antes: antes.jogadores[k] }))
        .filter(({ jogador }) => jogador.lado === "CASA" && jogador.id !== 0)
        .map(({ jogador, antes: anterior }) => (jogador.x - (anterior?.x ?? jogador.x)) * CAMPO_X);

      const media = deslocamentos.reduce((a, b) => a + b, 0) / deslocamentos.length;
      const variancia =
        deslocamentos.reduce((soma, d) => soma + (d - media) ** 2, 0) / deslocamentos.length;
      somaDosDesvios += Math.sqrt(variancia);
    }

    expect(somaDosDesvios / amostras).toBeGreaterThan(0.5);
  });
});

function distanciaEmMetros(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot((a.x - b.x) * CAMPO_X, (a.y - b.y) * CAMPO_Y);
}

const perdas = resultado.ticks.flatMap((registro, tick) =>
  registro.lance.tipo === "PERDA" ? [{ registro, tick, lance: registro.lance }] : [],
);

describe("encenação das perdas de bola", () => {
  it("faz quem desarma chegar perto de quem perdeu a bola", () => {
    const desarmes = perdas.filter((p) => p.lance.causa === "DESARME");
    expect(desarmes.length).toBeGreaterThan(10);

    let comContato = 0;
    for (const { registro, tick, lance } of desarmes) {
      let menor = Number.POSITIVE_INFINITY;
      for (let passo = 0; passo <= PASSOS_POR_TICK; passo++) {
        const quadro = cena.quadroEm(tick * MS_POR_TICK + passo * MS_POR_PASSO);
        const perdedor = quadro.jogadores.find((j) => j.id === lance.perdedorId);
        const ladrao = quadro.jogadores.find((j) => j.id === registro.jogadorComBolaId);
        if (perdedor && ladrao) menor = Math.min(menor, distanciaEmMetros(perdedor, ladrao));
      }
      if (menor < 4) comContato += 1;
    }

    expect(comContato / desarmes.length).toBeGreaterThan(0.85);
  });

  it("leva a bola para fora do campo e a repõe na linha certa", () => {
    const foras = perdas.filter((p) => p.lance.causa === "BOLA_FORA");
    expect(foras.length).toBeGreaterThan(5);

    for (const { tick, lance } of foras) {
      let saiu = false;
      for (let passo = 0; passo <= PASSOS_POR_TICK; passo++) {
        const { bola } = cena.quadroEm(tick * MS_POR_TICK + passo * MS_POR_PASSO);
        if (bola.x < 0 || bola.x > 1 || bola.y < 0 || bola.y > 1) saiu = true;
      }
      expect(saiu).toBe(true);

      const parada = cena.quadroEm(tick * MS_POR_TICK + 25 * MS_POR_PASSO).bola;
      if (lance.zonaOrigem === "ATAQUE") {
        const x = parada.x * CAMPO_X;
        expect(Math.min(Math.abs(x - 5.5), Math.abs(x - 99.5))).toBeLessThan(0.05);
      } else {
        const y = parada.y * CAMPO_Y;
        expect(Math.min(Math.abs(y - 0.6), Math.abs(y - 67.4))).toBeLessThan(0.05);
      }
    }
  });

  it("mantém a bola dentro do campo nos ticks sem bola fora", () => {
    let violacoes = 0;
    resultado.ticks.forEach((registro, tick) => {
      if (registro.lance.tipo === "PERDA" && registro.lance.causa === "BOLA_FORA") return;
      for (let passo = 0; passo <= PASSOS_POR_TICK; passo++) {
        const { bola } = cena.quadroEm(tick * MS_POR_TICK + passo * MS_POR_PASSO);
        if (bola.x < -0.001 || bola.x > 1.001 || bola.y < -0.001 || bola.y > 1.001) violacoes += 1;
      }
    });
    expect(violacoes).toBe(0);
  });

  it("tem passes interceptados na partida de teste", () => {
    expect(perdas.filter((p) => p.lance.causa === "PASSE_INTERCEPTADO").length).toBeGreaterThan(10);
  });
});
