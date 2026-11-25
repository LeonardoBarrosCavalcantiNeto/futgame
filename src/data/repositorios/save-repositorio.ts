import { abrirBancoDoSlot, getDb, QUANTIDADE_SLOTS } from "../db";
import type { InfoSlot, NovoSave, Save } from "../../core/modelos/save";

/** Versão da última migração aplicada (hoje: 003). */
export const VERSAO_SCHEMA = 3;

interface LinhaSave {
  id: number;
  slot: number;
  nome_treinador: string;
  clube_id: number | null;
  data_jogo: string;
  criado_em: string;
  atualizado_em: string;
  versao_schema: number;
}

function paraSave(linha: LinhaSave): Save {
  return {
    id: linha.id,
    slot: linha.slot,
    nomeTreinador: linha.nome_treinador,
    clubeId: linha.clube_id,
    dataJogo: linha.data_jogo,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    versaoSchema: linha.versao_schema,
  };
}

// Ordem respeita as chaves estrangeiras (filhas antes das mães).
const TABELAS_PARA_LIMPAR = [
  "saves",
  "eventos_partida",
  "partidas",
  "temporadas",
  "financas",
  "contratos",
  "atributos_jogador",
  "jogadores",
  "clubes",
  "competicoes",
];

export const saveRepositorio = {
  async listarSlots(): Promise<InfoSlot[]> {
    const slots: InfoSlot[] = [];
    for (let slot = 1; slot <= QUANTIDADE_SLOTS; slot++) {
      const db = await abrirBancoDoSlot(slot);
      const linhas = await db.select<LinhaSave[]>("SELECT * FROM saves LIMIT 1");
      slots.push({ slot, save: linhas[0] ? paraSave(linhas[0]) : null });
    }
    return slots;
  },

  /** Registra o save no slot ativo. */
  async criar(save: NovoSave): Promise<void> {
    const db = await getDb();
    const agora = new Date().toISOString();
    await db.execute(
      `INSERT INTO saves (slot, nome_treinador, clube_id, data_jogo, criado_em, atualizado_em, versao_schema)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [save.slot, save.nomeTreinador, save.clubeId, save.dataJogo, agora, agora, save.versaoSchema],
    );
  },

  /** Apaga todo o conteúdo do slot, deixando-o vazio. */
  async apagarSlot(slot: number): Promise<void> {
    const db = await abrirBancoDoSlot(slot);
    for (const tabela of TABELAS_PARA_LIMPAR) {
      await db.execute(`DELETE FROM ${tabela}`);
    }
    await db.execute("DELETE FROM sqlite_sequence");
  },
};
