DROP TABLE atributos_jogador;

CREATE TABLE atributos_jogador (
  jogador_id INTEGER PRIMARY KEY REFERENCES jogadores(id) ON DELETE CASCADE,
  ritmo INTEGER CHECK (ritmo BETWEEN 0 AND 99),
  finalizacao INTEGER CHECK (finalizacao BETWEEN 0 AND 99),
  passe INTEGER CHECK (passe BETWEEN 0 AND 99),
  drible INTEGER CHECK (drible BETWEEN 0 AND 99),
  defesa INTEGER CHECK (defesa BETWEEN 0 AND 99),
  fisico INTEGER CHECK (fisico BETWEEN 0 AND 99),
  elasticidade INTEGER CHECK (elasticidade BETWEEN 0 AND 99),
  manejo INTEGER CHECK (manejo BETWEEN 0 AND 99),
  chute INTEGER CHECK (chute BETWEEN 0 AND 99),
  reflexos INTEGER CHECK (reflexos BETWEEN 0 AND 99),
  velocidade_gol INTEGER CHECK (velocidade_gol BETWEEN 0 AND 99),
  posicionamento INTEGER CHECK (posicionamento BETWEEN 0 AND 99),
  CHECK (
    (ritmo IS NOT NULL AND finalizacao IS NOT NULL AND passe IS NOT NULL
      AND drible IS NOT NULL AND defesa IS NOT NULL AND fisico IS NOT NULL)
    OR
    (elasticidade IS NOT NULL AND manejo IS NOT NULL AND chute IS NOT NULL
      AND reflexos IS NOT NULL AND velocidade_gol IS NOT NULL AND posicionamento IS NOT NULL)
  )
);