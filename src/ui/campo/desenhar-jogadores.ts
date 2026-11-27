import { campoParaCanvas, escalaDoCanvas } from "./desenhar-campo";

export interface JogadorNoCampo {
  id: number;
  numero: number;
  /** Posição no campo, de 0 a 1 (mesmo sistema das formações). */
  x: number;
  y: number;
  corPrimaria: string;
  corSecundaria: string;
}

const RAIO_M = 1.7;

/** Escolhe preto ou branco para o número, conforme o brilho da cor de fundo (hex de 6 dígitos). */
function corDoTexto(corFundo: string): string {
  const hex = /^#?([0-9a-f]{6})$/i.exec(corFundo)?.[1];
  if (!hex) return "#ffffff";

  const valor = parseInt(hex, 16);
  const r = (valor >> 16) & 255;
  const g = (valor >> 8) & 255;
  const b = valor & 255;
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6 ? "#111111" : "#ffffff";
}

export function desenharJogadores(
  ctx: CanvasRenderingContext2D,
  largura: number,
  jogadores: readonly JogadorNoCampo[],
): void {
  const raio = RAIO_M * escalaDoCanvas(largura);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${raio * 1.1}px sans-serif`;

  for (const jogador of jogadores) {
    const centro = campoParaCanvas(jogador, largura);

    ctx.beginPath();
    ctx.arc(centro.x, centro.y, raio, 0, Math.PI * 2);
    ctx.fillStyle = jogador.corPrimaria;
    ctx.fill();
    ctx.lineWidth = Math.max(2, raio * 0.18);
    ctx.strokeStyle = jogador.corSecundaria;
    ctx.stroke();

    ctx.fillStyle = corDoTexto(jogador.corPrimaria);
    ctx.fillText(String(jogador.numero), centro.x, centro.y + raio * 0.04);
  }
}
