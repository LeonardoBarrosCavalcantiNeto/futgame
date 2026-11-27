import { useEffect, useRef } from "react";
import { desenharBola } from "./desenhar-bola";
import { desenharCampo, PROPORCAO_CANVAS } from "./desenhar-campo";
import { desenharJogadores, type JogadorNoCampo } from "./desenhar-jogadores";
import type { Reprodutor } from "./reprodutor";

export interface EstiloJogador {
  numero: number;
  corPrimaria: string;
  corSecundaria: string;
}

interface PartidaCampoProps {
  reprodutor: Reprodutor;
  /** Número e cores de cada jogador, pelo id. */
  estilos: ReadonlyMap<number, EstiloJogador>;
  velocidade?: number;
}

export function PartidaCampo({ reprodutor, estilos, velocidade = 1 }: PartidaCampoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let largura = 0;

    const ajustarTamanho = () => {
      const larguraDisponivel = container.clientWidth;
      const alturaDisponivel = container.clientHeight;
      if (larguraDisponivel === 0 || alturaDisponivel === 0) {
        largura = 0;
        return;
      }

      largura = Math.min(larguraDisponivel, alturaDisponivel * PROPORCAO_CANVAS);
      const altura = largura / PROPORCAO_CANVAS;
      const densidade = window.devicePixelRatio || 1;
      canvas.width = Math.round(largura * densidade);
      canvas.height = Math.round(altura * densidade);
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;
      ctx.setTransform(densidade, 0, 0, densidade, 0, 0);
    };

    const inicio = performance.now();
    let quadroId = 0;

    const desenharQuadro = (agora: number) => {
      if (largura > 0) {
        const tempo = Math.min((agora - inicio) * velocidade, reprodutor.duracaoMs);
        const quadro = reprodutor.quadroEm(tempo);

        const jogadores: JogadorNoCampo[] = [];
        for (const jogador of quadro.jogadores) {
          const estilo = estilos.get(jogador.id);
          if (estilo) {
            jogadores.push({ id: jogador.id, x: jogador.x, y: jogador.y, ...estilo });
          }
        }

        desenharCampo(ctx, largura);
        desenharJogadores(ctx, largura, jogadores);
        desenharBola(ctx, largura, quadro.bola);
      }
      quadroId = requestAnimationFrame(desenharQuadro);
    };

    ajustarTamanho();
    const observador = new ResizeObserver(ajustarTamanho);
    observador.observe(container);
    quadroId = requestAnimationFrame(desenharQuadro);

    return () => {
      cancelAnimationFrame(quadroId);
      observador.disconnect();
    };
  }, [reprodutor, estilos, velocidade]);

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
