import { describe, it, expect } from "vitest";
import { packSchema } from "./schema-pack";
import { contratoDoJogador } from "./contrato-padrao";
import packMinimo from "../../packs/pack-minimo.json";

const pack = packSchema.parse(packMinimo);
const jogador = pack.clubes[0].jogadores[0];

describe("contratoDoJogador", () => {
  it("usa os valores padrão quando o pack não define", () => {
    expect(contratoDoJogador(jogador)).toEqual({
      salario: 5000,
      dataInicio: "2027-01-01",
      dataFim: "2028-12-31",
    });
  });

  it("respeita salário e fim de contrato do pack", () => {
    const contrato = contratoDoJogador({ ...jogador, salario: 9000, fimContrato: "2030-06-30" });
    expect(contrato.salario).toBe(9000);
    expect(contrato.dataFim).toBe("2030-06-30");
  });
});
