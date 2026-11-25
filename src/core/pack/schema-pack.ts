import { z } from "zod";

const nota = z.number().int().min(0).max(99);
const cor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "a cor deve estar no formato #rrggbb");

const atributosLinha = z.strictObject({
  ritmo: nota,
  finalizacao: nota,
  passe: nota,
  drible: nota,
  defesa: nota,
  fisico: nota,
});

const atributosGoleiro = z.strictObject({
  elasticidade: nota,
  manejo: nota,
  chute: nota,
  reflexos: nota,
  velocidadeGol: nota,
  posicionamento: nota,
});

const jogadorSchema = z
  .strictObject({
    nome: z.string().min(1),
    dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use o formato AAAA-MM-DD"),
    nacionalidade: z.string().min(1),
    posicao: z.enum(["GOL", "ZAG", "LD", "LE", "VOL", "MC", "MEI", "PON", "ATA"]),
    pe: z.enum(["D", "E", "A"]),
    potencial: nota,
    atributos: z.union([atributosLinha, atributosGoleiro]),
  })
  .superRefine((jogador, ctx) => {
    const ehGoleiro = jogador.posicao === "GOL";
    const temAtributosGoleiro = "reflexos" in jogador.atributos;
    if (ehGoleiro !== temAtributosGoleiro) {
      ctx.addIssue({
        code: "custom",
        message: ehGoleiro
          ? "goleiro deve usar atributos de goleiro"
          : "jogador de linha deve usar atributos de linha",
        path: ["atributos"],
      });
    }
  });

const competicaoSchema = z.strictObject({
  nome: z.string().min(1),
  tipo: z.enum(["LIGA", "COPA"]),
  nivel: z.number().int().min(1).nullable().optional(),
});

const clubeSchema = z.strictObject({
  nome: z.string().min(1),
  sigla: z.string().min(2).max(4),
  corPrimaria: cor,
  corSecundaria: cor,
  reputacao: z.number().int().min(0).max(100),
  competicao: z.string().min(1),
  jogadores: z.array(jogadorSchema),
});

export const packSchema = z
  .strictObject({
    formato: z.literal(1),
    nome: z.string().min(1),
    autor: z.string().optional(),
    competicoes: z.array(competicaoSchema).min(1),
    clubes: z.array(clubeSchema).min(1),
  })
  .superRefine((pack, ctx) => {
    const nomes = new Set(pack.competicoes.map((c) => c.nome));
    pack.clubes.forEach((clube, i) => {
      if (!nomes.has(clube.competicao)) {
        ctx.addIssue({
          code: "custom",
          message: `competição "${clube.competicao}" não existe na lista de competições`,
          path: ["clubes", i, "competicao"],
        });
      }
    });
  });

export type Pack = z.infer<typeof packSchema>;
