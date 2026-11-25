import { describe, it, expect } from "vitest";
import { packSchema } from "./schema-pack";

function criarPack() {
  return {
    formato: 1,
    nome: "Pack de Teste",
    competicoes: [{ nome: "Liga Alfa", tipo: "LIGA", nivel: 1 }],
    clubes: [
      {
        nome: "Clube Exemplo",
        sigla: "EXE",
        corPrimaria: "#ff0000",
        corSecundaria: "#ffffff",
        reputacao: 60,
        competicao: "Liga Alfa",
        jogadores: [
          {
            nome: "Fulano da Silva",
            dataNascimento: "2000-05-10",
            nacionalidade: "Brasil",
            posicao: "ATA",
            pe: "D",
            potencial: 80,
            atributos: {
              ritmo: 75,
              finalizacao: 78,
              passe: 60,
              drible: 70,
              defesa: 30,
              fisico: 68,
            },
          },
        ],
      },
    ],
  };
}

describe("packSchema", () => {
  it("aceita um pack válido", () => {
    expect(packSchema.safeParse(criarPack()).success).toBe(true);
  });

  it("rejeita cor fora do formato #rrggbb", () => {
    const pack = criarPack();
    pack.clubes[0].corPrimaria = "vermelho";
    expect(packSchema.safeParse(pack).success).toBe(false);
  });

  it("rejeita goleiro com atributos de linha", () => {
    const pack = criarPack();
    pack.clubes[0].jogadores[0].posicao = "GOL";
    expect(packSchema.safeParse(pack).success).toBe(false);
  });

  it("rejeita clube com competição inexistente", () => {
    const pack = criarPack();
    pack.clubes[0].competicao = "Liga Fantasma";
    expect(packSchema.safeParse(pack).success).toBe(false);
  });

  it("rejeita campo desconhecido", () => {
    const pack = Object.assign(criarPack(), { campoExtra: 1 });
    expect(packSchema.safeParse(pack).success).toBe(false);
  });
});
