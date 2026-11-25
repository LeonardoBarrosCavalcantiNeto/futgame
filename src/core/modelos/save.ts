export interface Save {
  id: number;
  slot: number;
  nomeTreinador: string;
  clubeId: number | null;
  dataJogo: string;
  criadoEm: string;
  atualizadoEm: string;
  versaoSchema: number;
}

export type NovoSave = Omit<Save, "id" | "criadoEm" | "atualizadoEm">;

export interface InfoSlot {
  slot: number;
  save: Save | null;
}
