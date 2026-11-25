export interface Clube {
  id: number;
  nome: string;
  sigla: string;
  corPrimaria: string;
  corSecundaria: string;
  reputacao: number;
  orcamentoTransferencias: number;
}

export type NovoClube = Omit<Clube, "id">;
