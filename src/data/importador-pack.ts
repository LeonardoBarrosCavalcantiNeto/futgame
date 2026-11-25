import { getDb } from "./db";
import type { Pack } from "../core/pack/schema-pack";
import { contratoDoJogador } from "../core/pack/contrato-padrao";

export interface ResumoImportacao {
  competicoes: number;
  clubes: number;
  jogadores: number;
}

export async function importarPack(pack: Pack): Promise<ResumoImportacao> {
  const db = await getDb();

  const nomes = pack.competicoes.map((c) => c.nome);
  const marcadores = nomes.map((_, i) => `$${i + 1}`).join(",");
  const existentes = await db.select<{ nome: string }[]>(
    `SELECT nome FROM competicoes WHERE nome IN (${marcadores})`,
    nomes,
  );
  if (existentes.length > 0) {
    const lista = existentes.map((e) => e.nome).join(", ");
    throw new Error(`Já existem competições com estes nomes: ${lista}`);
  }

  const idCompeticao = new Map<string, number>();
  for (const competicao of pack.competicoes) {
    const r = await db.execute("INSERT INTO competicoes (nome, tipo, nivel) VALUES ($1, $2, $3)", [
      competicao.nome,
      competicao.tipo,
      competicao.nivel ?? null,
    ]);
    idCompeticao.set(competicao.nome, r.lastInsertId as number);
  }

  let totalJogadores = 0;
  for (const clube of pack.clubes) {
    const rc = await db.execute(
      `INSERT INTO clubes (nome, sigla, cor_primaria, cor_secundaria, reputacao, competicao_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        clube.nome,
        clube.sigla,
        clube.corPrimaria,
        clube.corSecundaria,
        clube.reputacao,
        idCompeticao.get(clube.competicao),
      ],
    );
    const clubeId = rc.lastInsertId as number;

    for (const jogador of clube.jogadores) {
      const rj = await db.execute(
        `INSERT INTO jogadores (nome, data_nascimento, nacionalidade, posicao, pe, potencial)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          jogador.nome,
          jogador.dataNascimento,
          jogador.nacionalidade,
          jogador.posicao,
          jogador.pe,
          jogador.potencial,
        ],
      );
      const jogadorId = rj.lastInsertId as number;

      const a = jogador.atributos;
      if ("reflexos" in a) {
        await db.execute(
          `INSERT INTO atributos_jogador
             (jogador_id, elasticidade, manejo, chute, reflexos, velocidade_gol, posicionamento)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            jogadorId,
            a.elasticidade,
            a.manejo,
            a.chute,
            a.reflexos,
            a.velocidadeGol,
            a.posicionamento,
          ],
        );
      } else {
        await db.execute(
          `INSERT INTO atributos_jogador
             (jogador_id, ritmo, finalizacao, passe, drible, defesa, fisico)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [jogadorId, a.ritmo, a.finalizacao, a.passe, a.drible, a.defesa, a.fisico],
        );
      }

      const contrato = contratoDoJogador(jogador);
      await db.execute(
        `INSERT INTO contratos (jogador_id, clube_id, salario, data_inicio, data_fim)
         VALUES ($1, $2, $3, $4, $5)`,
        [jogadorId, clubeId, contrato.salario, contrato.dataInicio, contrato.dataFim],
      );
      totalJogadores++;
    }
  }

  return {
    competicoes: pack.competicoes.length,
    clubes: pack.clubes.length,
    jogadores: totalJogadores,
  };
}
