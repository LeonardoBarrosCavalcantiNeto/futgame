import { describe, it, expect } from "vitest";
import { packSchema } from "./schema-pack";
import packMinimo from "../../packs/pack-minimo.json";

describe("pack mínimo de teste", () => {
  it("é válido segundo o schema", () => {
    const resultado = packSchema.safeParse(packMinimo);
    if (!resultado.success) console.log(resultado.error.issues);
    expect(resultado.success).toBe(true);
  });
});
