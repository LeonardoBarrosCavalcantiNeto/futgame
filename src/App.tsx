import { escalar } from "./engine/auxiliares-teste";
import { criarCena } from "./engine/cena";
import { simularPartida } from "./engine/partida";
import type { Escalacao } from "./engine/tipos-partida";
import { PartidaCampo, type EstiloJogador } from "./ui/campo/PartidaCampo";

const casa = escalar(() => 74, 1, 0);
const fora = escalar(() => 70, 2, 100);
const resultado = simularPartida(casa, fora, 2026);
const cena = criarCena(resultado, { CASA: casa, FORA: fora });

function estilosDoTime(escalacao: Escalacao, primaria: string, secundaria: string) {
  return escalacao.titulares.map((jogador, indice): [number, EstiloJogador] => [
    jogador.id,
    { numero: indice + 1, corPrimaria: primaria, corSecundaria: secundaria },
  ]);
}

const estilos = new Map<number, EstiloJogador>([
  ...estilosDoTime(casa, "#1d4ed8", "#ffffff"),
  ...estilosDoTime(fora, "#dc2626", "#111827"),
]);

function App() {
  return (
    <main style={{ position: "fixed", inset: 0, padding: 16, boxSizing: "border-box" }}>
      <PartidaCampo reprodutor={cena} estilos={estilos} velocidade={4} />
    </main>
  );
}

export default App;
