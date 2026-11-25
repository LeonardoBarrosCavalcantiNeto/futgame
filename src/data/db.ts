import Database from "@tauri-apps/plugin-sql";

export const QUANTIDADE_SLOTS = 3;

let slotAtivo: number | null = null;
const conexoes = new Map<number, Promise<Database>>();

function validarSlot(slot: number): void {
  if (!Number.isInteger(slot) || slot < 1 || slot > QUANTIDADE_SLOTS) {
    throw new Error(`Slot inválido: ${slot}. Use um valor de 1 a ${QUANTIDADE_SLOTS}.`);
  }
}

/** Abre o banco do slot (a migração cria as tabelas na primeira vez). */
export function abrirBancoDoSlot(slot: number): Promise<Database> {
  validarSlot(slot);
  let conexao = conexoes.get(slot);
  if (!conexao) {
    conexao = Database.load(`sqlite:futgame-slot${slot}.db`).catch((erro) => {
      conexoes.delete(slot);
      throw erro;
    });
    conexoes.set(slot, conexao);
  }
  return conexao;
}

/** Define qual slot o jogo está usando agora. */
export async function ativarSlot(slot: number): Promise<void> {
  await abrirBancoDoSlot(slot);
  slotAtivo = slot;
}

export function getSlotAtivo(): number | null {
  return slotAtivo;
}

/** Banco do slot ativo. */
export function getDb(): Promise<Database> {
  if (slotAtivo === null) {
    return Promise.reject(new Error("Nenhum slot ativo. Chame ativarSlot() antes."));
  }
  return abrirBancoDoSlot(slotAtivo);
}
