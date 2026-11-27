import { FORMACOES, posicaoBase } from "./engine/formacoes";
import type { Formacao, Lado } from "./engine/tipos-partida";
import { CampoCanvas } from "./ui/campo/CampoCanvas";
import type { JogadorNoCampo } from "./ui/campo/desenhar-jogadores";

function montarTime(
  formacao: Formacao,
  lado: Lado,
  idInicial: number,
  corPrimaria: string,
  corSecundaria: string,
): JogadorNoCampo[] {
  return FORMACOES[formacao].map((_, indice) => {
    const ponto = posicaoBase(formacao, indice, lado);
    return {
      id: idInicial + indice,
      numero: indice + 1,
      x: ponto.x,
      y: ponto.y,
      corPrimaria,
      corSecundaria,
    };
  });
}

const JOGADORES_DEMO: JogadorNoCampo[] = [
  ...montarTime("4-3-3", "CASA", 0, "#1d4ed8", "#ffffff"),
  ...montarTime("4-4-2", "FORA", 100, "#dc2626", "#111827"),
];

function App() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <CampoCanvas jogadores={JOGADORES_DEMO} />
    </main>
  );
}

export default App;
