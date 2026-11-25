import { describe, it, expect } from "vitest";
import { validarPack } from "./validar-pack";
import packMinimo from "../../packs/pack-minimo.json";

describe("validarPack", () => {
  it("aceita o pack mínimo", () => {
    expect(validarPack(JSON.stringify(packMinimo)).ok).toBe(true);
  });

  it("rejeita texto que não é JSON", () => {
    expect(validarPack("isso não é json").ok).toBe(false);
  });

  it("aponta o caminho do campo inválido", () => {
    const pack = structuredClone(packMinimo);
    pack.clubes[0].corPrimaria = "vermelho";
    const resultado = validarPack(JSON.stringify(pack));
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erros[0]).toContain("clubes.0.corPrimaria");
    }
  });
});
