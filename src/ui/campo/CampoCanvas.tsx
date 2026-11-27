import { useEffect, useRef } from "react";
import { desenharCampo, PROPORCAO_CANVAS } from "./desenhar-campo";
import { desenharJogadores, type JogadorNoCampo } from "./desenhar-jogadores";

interface CampoCanvasProps {
  jogadores?: readonly JogadorNoCampo[];
}

export function CampoCanvas({ jogadores = [] }: CampoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const redesenhar = () => {
      const larguraDisponivel = container.clientWidth;
      const alturaDisponivel = container.clientHeight;
      if (larguraDisponivel === 0 || alturaDisponivel === 0) return;

      const largura = Math.min(larguraDisponivel, alturaDisponivel * PROPORCAO_CANVAS);
      const altura = largura / PROPORCAO_CANVAS;
      const densidade = window.devicePixelRatio || 1;
      canvas.width = Math.round(largura * densidade);
      canvas.height = Math.round(altura * densidade);
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(densidade, 0, 0, densidade, 0, 0);
      desenharCampo(ctx, largura);
      desenharJogadores(ctx, largura, jogadores);
    };

    redesenhar();
    const observador = new ResizeObserver(redesenhar);
    observador.observe(container);
    return () => observador.disconnect();
  }, [jogadores]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
