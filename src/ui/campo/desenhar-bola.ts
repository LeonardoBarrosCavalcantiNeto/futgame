import { campoParaCanvas, escalaDoCanvas } from "./desenhar-campo";

const RAIO_M = 0.75;

export function desenharBola(
  ctx: CanvasRenderingContext2D,
  largura: number,
  bola: { x: number; y: number },
): void {
  const raio = RAIO_M * escalaDoCanvas(largura);
  const centro = campoParaCanvas(bola, largura);

  ctx.beginPath();
  ctx.arc(centro.x + raio * 0.25, centro.y + raio * 0.3, raio, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centro.x, centro.y, raio, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = Math.max(1, raio * 0.25);
  ctx.strokeStyle = "#111111";
  ctx.stroke();
}
