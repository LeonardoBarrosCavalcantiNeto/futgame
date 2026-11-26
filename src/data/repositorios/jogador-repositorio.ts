import { getDb } from "../db";
import type { Jogador, Pe, Posicao } from "../../core/modelos/jogador";

interface LinhaJogador {
  id: number;
  nome: string;
  data_nascimento: string;
  nacionalidade: string;
  posicao: Posicao;
  pe: Pe;
  potencial: number;
  ritmo: number | null;
  finalizacao: number | null;
  passe: number | null;
  drible: number | null;
  defesa: number | null;
  fisico: number | null;
  elasticidade: number | null;
  manejo: number | null;
  chute: number | null;
  reflexos: number | null;
  velocidade_gol: number | null;
  posicionamento: number | null;
  contrato_id: number;
  clube_id: number;
  salario: number;
  data_inicio: string;
  data_fim: string;
}

function exigir(valor: number | null, campo: string, linha: LinhaJogador): number {
  if (valor === null) {
    throw new Error(`Jogador ${linha.id} (${linha.nome}) sem o atributo "${campo}".`);
  }
  return valor;
}

function paraJogador(linha: LinhaJogador): Jogador {
  const base = {
    id: linha.id,
    nome: linha.nome,
    dataNascimento: linha.data_nascimento,
    nacionalidade: linha.nacionalidade,
    pe: linha.pe,
    potencial: linha.potencial,
    contrato: {
      id: linha.contrato_id,
      clubeId: linha.clube_id,
      salario: linha.salario,
      dataInicio: linha.data_inicio,
      dataFim: linha.data_fim,
    },
  };

  if (linha.posicao === "GOL") {
    return {
      ...base,
      posicao: "GOL",
      atributos: {
        elasticidade: exigir(linha.elasticidade, "elasticidade", linha),
        manejo: exigir(linha.manejo, "manejo", linha),
        chute: exigir(linha.chute, "chute", linha),
        reflexos: exigir(linha.reflexos, "reflexos", linha),
        velocidade: exigir(linha.velocidade_gol, "velocidade_gol", linha),
        posicionamento: exigir(linha.posicionamento, "posicionamento", linha),
      },
    };
  }

  return {
    ...base,
    posicao: linha.posicao,
    atributos: {
      ritmo: exigir(linha.ritmo, "ritmo", linha),
      finalizacao: exigir(linha.finalizacao, "finalizacao", linha),
      passe: exigir(linha.passe, "passe", linha),
      drible: exigir(linha.drible, "drible", linha),
      defesa: exigir(linha.defesa, "defesa", linha),
      fisico: exigir(linha.fisico, "fisico", linha),
    },
  };
}

export const jogadorRepositorio = {
  async listarPorClube(clubeId: number): Promise<Jogador[]> {
    const db = await getDb();
    const linhas = await db.select<LinhaJogador[]>(
      `SELECT j.id, j.nome, j.data_nascimento, j.nacionalidade, j.posicao, j.pe, j.potencial,
              a.ritmo, a.finalizacao, a.passe, a.drible, a.defesa, a.fisico,
              a.elasticidade, a.manejo, a.chute, a.reflexos, a.velocidade_gol, a.posicionamento,
              c.id AS contrato_id, c.clube_id, c.salario, c.data_inicio, c.data_fim
       FROM contratos c
       JOIN jogadores j ON j.id = c.jogador_id
       JOIN atributos_jogador a ON a.jogador_id = j.id
       WHERE c.clube_id = $1 AND c.ativo = 1
       ORDER BY j.nome`,
      [clubeId],
    );
    return linhas.map(paraJogador);
  },
};
