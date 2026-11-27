import { useEffect, useRef } from "react";
import { desenharCampo, PROPORCAO_CANVAS } from "./desenhar-campo";

export function CampoCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const redesenhar = () => {
      const largura = container.clientWidth;
      if (largura === 0) return;

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
    };

    redesenhar();
    const observador = new ResizeObserver(redesenhar);
    observador.observe(container);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
