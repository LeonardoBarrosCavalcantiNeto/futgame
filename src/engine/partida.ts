import { Aleatorio } from "../core/aleatorio";
import { criarDisciplina, sortearFalta } from "./faltas";
import { resolverFinalizacao } from "./finalizacao";
import { calcularForca } from "./forca-time";
import {
  adversario,
  resolverTick,
  sortearPortador,
  type ContextoTick,
  type EstadoBola,
} from "./tick";
import {
  TICKS_POR_PARTIDA,
  tickParaMinuto,
  type Escalacao,
  type EstatisticasLado,
  type EventoPartida,
  type Lado,
  type Lance,
  type RegistroTick,
  type ResultadoPartida,
  type TipoEvento,
} from "./tipos-partida";

function estatisticasVazias(): EstatisticasLado {
  return { posseTicks: 0, finalizacoes: 0, finalizacoesNoAlvo: 0, escanteios: 0, faltas: 0 };
}

function criarEvento(
  tick: number,
  time: Lado,
  tipo: TipoEvento,
  jogadorId: number | null,
): EventoPartida {
  return { tick, minuto: tickParaMinuto(tick), time, tipo, jogadorId };
}

function saidaDeBola(lado: Lado, contexto: ContextoTick): EstadoBola {
  const portador = sortearPortador(contexto.escalacoes[lado], "MEIO", contexto.aleatorio);
  return { posse: lado, zona: "MEIO", jogadorComBolaId: portador.id };
}

export function simularPartida(casa: Escalacao, fora: Escalacao, seed: number): ResultadoPartida {
  const contexto: ContextoTick = {
    escalacoes: { CASA: casa, FORA: fora },
    forcas: { CASA: calcularForca(casa), FORA: calcularForca(fora) },
    aleatorio: new Aleatorio(seed),
  };

  const placar = { casa: 0, fora: 0 };
  const eventos: EventoPartida[] = [];
  const ticks: RegistroTick[] = [];
  const estatisticas: Record<Lado, EstatisticasLado> = {
    CASA: estatisticasVazias(),
    FORA: estatisticasVazias(),
  };
  const disciplina = criarDisciplina();

  let estado = saidaDeBola("CASA", contexto);

  for (let tick = 0; tick < TICKS_POR_PARTIDA; tick++) {
    if (tick === TICKS_POR_PARTIDA / 2) {
      estado = saidaDeBola("FORA", contexto);
    }

    const ocorrencias = sortearFalta(estado, contexto, disciplina);
    if (ocorrencias.length > 0) {
      const faltoso = adversario(estado.posse);
      for (const ocorrencia of ocorrencias) {
        eventos.push(criarEvento(tick, faltoso, ocorrencia.tipo, ocorrencia.jogadorId));
      }
      estatisticas[faltoso].faltas += 1;

      const autorId = ocorrencias.find((o) => o.tipo === "FALTA")?.jogadorId ?? -1;
      ticks.push({
        tick,
        ...estado,
        lance: { tipo: "FALTA", autorId, vitimaId: estado.jogadorComBolaId },
      });
      estatisticas[estado.posse].posseTicks += 1;
      continue;
    }

    const inicio = estado;
    const resultadoTick = resolverTick(estado, contexto);
    estado = resultadoTick.estado;
    estatisticas[estado.posse].posseTicks += 1;

    let lance: Lance;

    if (resultadoTick.finalizacao) {
      const atacante = estado.posse;
      const defensor = adversario(atacante);
      const chutadorId = estado.jogadorComBolaId;
      const goleiroId = contexto.escalacoes[defensor].titulares[0]?.id ?? null;
      const chute = resolverFinalizacao(estado, contexto);

      estatisticas[atacante].finalizacoes += 1;
      if (chute.noAlvo) {
        estatisticas[atacante].finalizacoesNoAlvo += 1;
      }

      switch (chute.resultado) {
        case "GOL":
          if (atacante === "CASA") {
            placar.casa += 1;
          } else {
            placar.fora += 1;
          }
          eventos.push(criarEvento(tick, atacante, "GOL", chutadorId));
          break;
        case "DEFESA":
          eventos.push(criarEvento(tick, defensor, "DEFESA_GOLEIRO", goleiroId));
          break;
        case "ESCANTEIO":
          eventos.push(criarEvento(tick, defensor, "DEFESA_GOLEIRO", goleiroId));
          eventos.push(criarEvento(tick, atacante, "ESCANTEIO", null));
          estatisticas[atacante].escanteios += 1;
          break;
        case "PARA_FORA":
          eventos.push(criarEvento(tick, atacante, "CHUTE_PARA_FORA", chutadorId));
          break;
      }

      lance = {
        tipo: "CHUTE",
        passadorId: inicio.jogadorComBolaId,
        chutadorId,
        goleiroId,
        resultado: chute.resultado,
      };
      estado = chute.estado;
    } else if (resultadoTick.causaPerda) {
      lance = {
        tipo: "PERDA",
        causa: resultadoTick.causaPerda,
        perdedorId: inicio.jogadorComBolaId,
        zonaOrigem: inicio.zona,
      };
    } else {
      lance = { tipo: "PASSE", passadorId: inicio.jogadorComBolaId, zonaOrigem: inicio.zona };
    }

    ticks.push({ tick, ...estado, lance });
  }

  return { placar, eventos, ticks, estatisticas };
}
