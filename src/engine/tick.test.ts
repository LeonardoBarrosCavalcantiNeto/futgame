import { describe, expect, it } from "vitest";
import { Aleatorio } from "../core/aleatorio";
import { escalar } from "./auxiliares-teste";
import { calcularForca } from "./forca-time";
import { resolverTick, type ContextoTick, type ResultadoTick } from "./tick";

function criarContexto(valorCasa: number, valorFora: number, seed: number): ContextoTick {
  const escalacoes = {
    CASA: escalar(() => valorCasa, 1, 0),
    FORA: escalar(() => valorFora, 2, 100),
  };
  return {
    escalacoes,
    forcas: {
      CASA: calcularForca(escalacoes.CASA),
      FORA: calcularForca(escalacoes.FORA),
    },
    aleatorio: new Aleatorio(seed),
  };
}

function simular(contexto: ContextoTick, ticks: number): ResultadoTick[] {
  const resultados: ResultadoTick[] = [];
  let estado: ResultadoTick["estado"] = { posse: "CASA", zona: "MEIO", jogadorComBolaId: 5 };
  for (let i = 0; i < ticks; i++) {
    const resultado = resolverTick(estado, contexto);
    resultados.push(resultado);
    estado = resultado.estado;
  }
  return resultados;
}

describe("resolverTick", () => {
  it("é reproduzível com a mesma seed", () => {
    const a = simular(criarContexto(70, 70, 42), 300);
    const b = simular(criarContexto(70, 70, 42), 300);
    expect(a).toEqual(b);
  });

  it("sempre entrega a bola a um titular do time com a posse", () => {
    const contexto = criarContexto(70, 70, 7);
    for (const resultado of simular(contexto, 2000)) {
      const ids = contexto.escalacoes[resultado.estado.posse].titulares.map((j) => j.id);
      expect(ids).toContain(resultado.estado.jogadorComBolaId);
    }
  });

  it("só finaliza na zona de ataque", () => {
    for (const resultado of simular(criarContexto(70, 70, 3), 3000)) {
      if (resultado.finalizacao) {
        expect(resultado.estado.zona).toBe("ATAQUE");
      }
    }
  });

  it("deixa times iguais com a posse parecida", () => {
    const resultados = simular(criarContexto(70, 70, 11), 20000);
    const posseCasa =
      resultados.filter((r) => r.estado.posse === "CASA").length / resultados.length;
    expect(posseCasa).toBeGreaterThan(0.45);
    expect(posseCasa).toBeLessThan(0.55);
  });

  it("dá mais posse e mais finalizações ao time mais forte", () => {
    const resultados = simular(criarContexto(85, 55, 11), 20000);
    const daCasa = resultados.filter((r) => r.estado.posse === "CASA");
    const daFora = resultados.filter((r) => r.estado.posse === "FORA");
    expect(daCasa.length).toBeGreaterThan(daFora.length);
    expect(daCasa.filter((r) => r.finalizacao).length).toBeGreaterThan(
      daFora.filter((r) => r.finalizacao).length,
    );
  });
});
