import { getDb } from "../db";
import type { Clube, NovoClube } from "../../core/modelos/clube";

interface LinhaClube {
  id: number;
  nome: string;
  sigla: string;
  cor_primaria: string;
  cor_secundaria: string;
  reputacao: number;
  orcamento_transferencias: number;
}

function paraClube(linha: LinhaClube): Clube {
  return {
    id: linha.id,
    nome: linha.nome,
    sigla: linha.sigla,
    corPrimaria: linha.cor_primaria,
    corSecundaria: linha.cor_secundaria,
    reputacao: linha.reputacao,
    orcamentoTransferencias: linha.orcamento_transferencias,
  };
}

export const clubeRepositorio = {
  async listar(): Promise<Clube[]> {
    const db = await getDb();
    const linhas = await db.select<LinhaClube[]>("SELECT * FROM clubes ORDER BY nome");
    return linhas.map(paraClube);
  },

  async buscarPorId(id: number): Promise<Clube | null> {
    const db = await getDb();
    const linhas = await db.select<LinhaClube[]>("SELECT * FROM clubes WHERE id = $1", [id]);
    return linhas[0] ? paraClube(linhas[0]) : null;
  },

  async inserir(clube: NovoClube): Promise<number> {
    const db = await getDb();
    const resultado = await db.execute(
      `INSERT INTO clubes (nome, sigla, cor_primaria, cor_secundaria, reputacao, orcamento_transferencias)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        clube.nome,
        clube.sigla,
        clube.corPrimaria,
        clube.corSecundaria,
        clube.reputacao,
        clube.orcamentoTransferencias,
      ],
    );
    return resultado.lastInsertId as number;
  },
};
