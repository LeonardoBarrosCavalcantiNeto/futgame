CREATE TABLE clubes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL,
  cor_primaria TEXT NOT NULL,
  cor_secundaria TEXT NOT NULL,
  reputacao INTEGER NOT NULL CHECK (reputacao BETWEEN 0 AND 100),
  orcamento_transferencias INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE jogadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  data_nascimento TEXT NOT NULL,
  nacionalidade TEXT NOT NULL,
  posicao TEXT NOT NULL CHECK (posicao IN ('GOL','ZAG','LD','LE','VOL','MC','MEI','PON','ATA')),
  pe TEXT NOT NULL CHECK (pe IN ('D','E','A')),
  potencial INTEGER NOT NULL CHECK (potencial BETWEEN 0 AND 99)
);

CREATE TABLE atributos_jogador (
  jogador_id INTEGER PRIMARY KEY REFERENCES jogadores(id) ON DELETE CASCADE,
  ritmo INTEGER NOT NULL CHECK (ritmo BETWEEN 0 AND 99),
  finalizacao INTEGER NOT NULL CHECK (finalizacao BETWEEN 0 AND 99),
  passe INTEGER NOT NULL CHECK (passe BETWEEN 0 AND 99),
  drible INTEGER NOT NULL CHECK (drible BETWEEN 0 AND 99),
  defesa INTEGER NOT NULL CHECK (defesa BETWEEN 0 AND 99),
  fisico INTEGER NOT NULL CHECK (fisico BETWEEN 0 AND 99),
  elasticidade INTEGER CHECK (elasticidade BETWEEN 0 AND 99),
  manejo INTEGER CHECK (manejo BETWEEN 0 AND 99),
  chute INTEGER CHECK (chute BETWEEN 0 AND 99),
  reflexos INTEGER CHECK (reflexos BETWEEN 0 AND 99),
  velocidade_gol INTEGER CHECK (velocidade_gol BETWEEN 0 AND 99),
  posicionamento INTEGER CHECK (posicionamento BETWEEN 0 AND 99)
);

CREATE TABLE contratos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jogador_id INTEGER NOT NULL REFERENCES jogadores(id),
  clube_id INTEGER NOT NULL REFERENCES clubes(id),
  salario INTEGER NOT NULL,
  data_inicio TEXT NOT NULL,
  data_fim TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1))
);

CREATE TABLE competicoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('LIGA','COPA')),
  nivel INTEGER
);

CREATE TABLE temporadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competicao_id INTEGER NOT NULL REFERENCES competicoes(id),
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NAO_INICIADA'
    CHECK (status IN ('NAO_INICIADA','EM_ANDAMENTO','ENCERRADA'))
);

CREATE TABLE partidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  temporada_id INTEGER NOT NULL REFERENCES temporadas(id),
  rodada INTEGER NOT NULL,
  data TEXT NOT NULL,
  mandante_id INTEGER NOT NULL REFERENCES clubes(id),
  visitante_id INTEGER NOT NULL REFERENCES clubes(id),
  gols_mandante INTEGER,
  gols_visitante INTEGER,
  status TEXT NOT NULL DEFAULT 'AGENDADA' CHECK (status IN ('AGENDADA','FINALIZADA')),
  seed INTEGER
);

CREATE TABLE eventos_partida (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id INTEGER NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
  minuto INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN
    ('GOL','CARTAO_AMARELO','CARTAO_VERMELHO','LESAO','FALTA','ESCANTEIO','SUBSTITUICAO')),
  jogador_id INTEGER REFERENCES jogadores(id),
  clube_id INTEGER REFERENCES clubes(id)
);

CREATE TABLE financas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clube_id INTEGER NOT NULL REFERENCES clubes(id),
  data TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA','DESPESA')),
  categoria TEXT NOT NULL CHECK (categoria IN
    ('BILHETERIA','PATROCINIO','PREMIACAO','SALARIO','TRANSFERENCIA')),
  valor INTEGER NOT NULL,
  descricao TEXT
);

CREATE TABLE saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot INTEGER NOT NULL UNIQUE,
  nome_treinador TEXT NOT NULL,
  clube_id INTEGER REFERENCES clubes(id),
  data_jogo TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  versao_schema INTEGER NOT NULL
);

CREATE INDEX idx_contratos_clube ON contratos(clube_id);
CREATE INDEX idx_partidas_temporada_rodada ON partidas(temporada_id, rodada);
CREATE INDEX idx_eventos_partida ON eventos_partida(partida_id);
CREATE INDEX idx_financas_clube_data ON financas(clube_id, data);