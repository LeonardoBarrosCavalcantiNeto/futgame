import { ativarSlot, getDb, getSlotAtivo } from "./db";
import { importarPack } from "./importador-pack";
import { saveRepositorio, VERSAO_SCHEMA } from "./repositorios/save-repositorio";
import type { Pack } from "../core/pack/schema-pack";
import type { Save } from "../core/modelos/save";

const DATA_INICIAL = "2027-01-01";

export async function novoJogo(
  slot: number,
  pack: Pack,
  nomeTreinador: string,
  nomeClube: string,
): Promise<Save> {
  if (!pack.clubes.some((c) => c.nome === nomeClube)) {
    throw new Error(`O clube "${nomeClube}" não existe no pack.`);
  }

  await ativarSlot(slot);
  if (await saveRepositorio.buscarDoSlotAtivo()) {
    throw new Error(`O slot ${slot} já está ocupado.`);
  }

  try {
    await importarPack(pack);
    const db = await getDb();
    const clubes = await db.select<{ id: number }[]>("SELECT id FROM clubes WHERE nome = $1", [
      nomeClube,
    ]);
    await saveRepositorio.criar({
      slot,
      nomeTreinador,
      clubeId: clubes[0].id,
      dataJogo: DATA_INICIAL,
      versaoSchema: VERSAO_SCHEMA,
    });
  } catch (erro) {
    await saveRepositorio.apagarSlot(slot);
    throw erro;
  }

  const save = await saveRepositorio.buscarDoSlotAtivo();
  if (!save) throw new Error("Falha ao criar o save.");
  return save;
}

export async function carregarJogo(slot: number): Promise<Save> {
  await ativarSlot(slot);
  const save = await saveRepositorio.buscarDoSlotAtivo();
  if (!save) throw new Error(`O slot ${slot} está vazio.`);
  if (save.versaoSchema > VERSAO_SCHEMA) {
    throw new Error("Este save foi criado por uma versão mais nova do jogo.");
  }
  return save;
}

export async function salvarJogo(dataJogo: string): Promise<void> {
  if (getSlotAtivo() === null) throw new Error("Nenhum jogo carregado.");
  await saveRepositorio.atualizarDataJogo(dataJogo);
}
