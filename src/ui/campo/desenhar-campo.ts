export const COMPRIMENTO_M = 105;
export const LARGURA_M = 68;
const MARGEM_M = 3;
const TOTAL_X = COMPRIMENTO_M + 2 * MARGEM_M;
const TOTAL_Y = LARGURA_M + 2 * MARGEM_M;

/** Largura dividida pela altura do canvas (campo mais a margem). */
export const PROPORCAO_CANVAS = TOTAL_X / TOTAL_Y;

const COR_GRAMA_CLARA = "#3f9b3f";
const COR_GRAMA_ESCURA = "#388e38";
const COR_LINHA = "#f2f2f2";
const FAIXAS = 14;

export interface PontoPx {
  x: number;
  y: number;
}

/** Pixels por metro para um canvas com a largura informada. */
export function escalaDoCanvas(largura: number): number {
  return largura / TOTAL_X;
}

/** Converte uma posição do campo (x e y de 0 a 1, como nas formações) em pixels do canvas. */
export function campoParaCanvas(ponto: { x: number; y: number }, largura: number): PontoPx {
  const escala = escalaDoCanvas(largura);
  return {
    x: (MARGEM_M + ponto.x * COMPRIMENTO_M) * escala,
    y: (MARGEM_M + ponto.y * LARGURA_M) * escala,
  };
}

export function desenharCampo(ctx: CanvasRenderingContext2D, largura: number): void {
  const escala = escalaDoCanvas(largura);
  const altura = TOTAL_Y * escala;

  const m = (metros: number) => metros * escala;
  const px = (xMetros: number) => (MARGEM_M + xMetros) * escala;
  const py = (yMetros: number) => (MARGEM_M + yMetros) * escala;

  // Gramado em faixas
  const larguraFaixa = largura / FAIXAS;
  for (let i = 0; i < FAIXAS; i++) {
    ctx.fillStyle = i % 2 === 0 ? COR_GRAMA_CLARA : COR_GRAMA_ESCURA;
    ctx.fillRect(i * larguraFaixa, 0, larguraFaixa, altura);
  }

  ctx.strokeStyle = COR_LINHA;
  ctx.fillStyle = COR_LINHA;
  ctx.lineWidth = Math.max(1.5, escala * 0.25);

  // Contorno e linha do meio
  ctx.strokeRect(px(0), py(0), m(COMPRIMENTO_M), m(LARGURA_M));
  ctx.beginPath();
  ctx.moveTo(px(COMPRIMENTO_M / 2), py(0));
  ctx.lineTo(px(COMPRIMENTO_M / 2), py(LARGURA_M));
  ctx.stroke();

  // Círculo central e ponto central
  ctx.beginPath();
  ctx.arc(px(COMPRIMENTO_M / 2), py(LARGURA_M / 2), m(9.15), 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px(COMPRIMENTO_M / 2), py(LARGURA_M / 2), m(0.4), 0, Math.PI * 2);
  ctx.fill();

  // Áreas, marca do pênalti, meia-lua e gol de cada lado
  const anguloMeiaLua = Math.acos(5.5 / 9.15);
  for (const sentido of [1, -1]) {
    const xGol = sentido === 1 ? 0 : COMPRIMENTO_M;
    const retangulo = (profundidade: number, larguraM: number, dentro: boolean) => {
      const frente = dentro ? profundidade : -profundidade;
      const x0 = sentido * frente > 0 ? xGol : xGol - Math.abs(profundidade);
      ctx.strokeRect(
        px(x0),
        py((LARGURA_M - larguraM) / 2),
        m(Math.abs(profundidade)),
        m(larguraM),
      );
    };

    retangulo(16.5, 40.32, true);
    retangulo(5.5, 18.32, true);
    retangulo(2.44, 7.32, false);

    const xPenalti = xGol + sentido * 11;
    ctx.beginPath();
    ctx.arc(px(xPenalti), py(LARGURA_M / 2), m(0.4), 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    if (sentido === 1) {
      ctx.arc(px(xPenalti), py(LARGURA_M / 2), m(9.15), -anguloMeiaLua, anguloMeiaLua);
    } else {
      ctx.arc(
        px(xPenalti),
        py(LARGURA_M / 2),
        m(9.15),
        Math.PI - anguloMeiaLua,
        Math.PI + anguloMeiaLua,
      );
    }
    ctx.stroke();
  }

  // Arcos de escanteio
  const escanteios: [number, number, number, number][] = [
    [0, 0, 0, Math.PI / 2],
    [0, LARGURA_M, -Math.PI / 2, 0],
    [COMPRIMENTO_M, 0, Math.PI / 2, Math.PI],
    [COMPRIMENTO_M, LARGURA_M, Math.PI, (3 * Math.PI) / 2],
  ];
  for (const [x, y, inicio, fim] of escanteios) {
    ctx.beginPath();
    ctx.arc(px(x), py(y), m(1), inicio, fim);
    ctx.stroke();
  }
}
