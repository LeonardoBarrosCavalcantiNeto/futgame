import { Aleatorio } from "../core/aleatorio";
import { ehGoleiro } from "../core/modelos/jogador";
import { setorDaPosicao } from "./forca-time";
import { FORMACOES, type Ponto } from "./formacoes";
import { calcularPosicoes, type PosicoesTick } from "./posicionamento";
import {
  TICKS_POR_PARTIDA,
  type Escalacao,
  type Lado,
  type Lance,
  type RegistroTick,
  type ResultadoPartida,
  type Zona,
} from "./tipos-partida";

/** Duração de um tick na velocidade 1x. */
export const MS_POR_TICK = 1000;
export const PASSOS_POR_TICK = 30;

const MS_POR_PASSO = MS_POR_TICK / PASSOS_POR_TICK;
const DT = 1 / PASSOS_POR_TICK;

/** Passos do tick em que a bola é conduzida por quem a tinha, voa e é conduzida por quem a recebe. */
const PASSO_INICIO_VOO = 8;
const PASSO_FIM_VOO = 22;

const CAMPO_X = 105;
const CAMPO_Y = 68;
const MARGEM_CAMPO = 0.5;

const VELOCIDADE_BASE = 9;
const VELOCIDADE_POR_RITMO = 9;
const ACELERACAO_MAX = 45;
const GANHO_CHEGADA = 2.5;

const PESO_SETOR_DA_BOLA = 0.45;
const PESO_DEMAIS = 0.12;
const ATRACAO_MAX = 18;
const AMPLITUDE_ONDULACAO = 2;
const DISTANCIA_MINIMA = 2.4;

const DISTANCIA_BOLA_CONDUZIDA = 0.9;
const CORRIDA_COM_A_BOLA = 6;
const REFORCO_CONDUCAO = 1.2;
const REFORCO_RECEPCAO = 1.4;
const REFORCO_SAIDA_DE_BOLA = 2;

type Setor = ReturnType<typeof setorDaPosicao>;

/** Setor que "joga" a bola, conforme a zona dela: o de quem a tem e o de quem defende. */
const SETOR_COM_A_BOLA: Record<Zona, Setor> = { DEFESA: "defesa", MEIO: "meio", ATAQUE: "ataque" };
const SETOR_SEM_A_BOLA: Record<Zona, Setor> = { DEFESA: "ataque", MEIO: "meio", ATAQUE: "defesa" };

export interface Cena {
  readonly totalTicks: number;
  readonly duracaoMs: number;
  /** Tick em andamento no instante informado (limitado ao primeiro e ao último). */
  tickEm(tempoMs: number): number;
  /** Posições dos jogadores e da bola no instante informado. */
  quadroEm(tempoMs: number): PosicoesTick;
}

interface Agente {
  id: number;
  lado: Lado;
  setor: Setor;
  velocidadeMax: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fases: readonly [number, number];
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

function misturar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sentidoDeAtaque(lado: Lado): number {
  return lado === "CASA" ? 1 : -1;
}

function quemTinhaABola(lance: Lance): number {
  switch (lance.tipo) {
    case "PASSE":
    case "CHUTE":
      return lance.passadorId;
    case "PERDA":
      return lance.perdedorId;
    case "FALTA":
      return lance.vitimaId;
  }
}

function criarAgentes(escalacoes: Record<Lado, Escalacao>, aleatorio: Aleatorio): Agente[] {
  const agentes: Agente[] = [];
  for (const lado of ["CASA", "FORA"] as const) {
    const escalacao = escalacoes[lado];
    const vagas = FORMACOES[escalacao.formacao];
    escalacao.titulares.forEach((jogador, indice) => {
      const vaga = vagas[indice];
      if (!vaga) return;
      const ritmo = ehGoleiro(jogador) ? jogador.atributos.velocidade : jogador.atributos.ritmo;
      agentes.push({
        id: jogador.id,
        lado,
        setor: setorDaPosicao(vaga.posicao),
        velocidadeMax: VELOCIDADE_BASE + VELOCIDADE_POR_RITMO * (ritmo / 100),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        fases: [aleatorio.proximo() * 2 * Math.PI, aleatorio.proximo() * 2 * Math.PI],
      });
    });
  }
  return agentes;
}

function colocarNaForma(agentes: Agente[], forma: PosicoesTick): void {
  agentes.forEach((agente, indice) => {
    const alvo = forma.jogadores[indice];
    if (!alvo) return;
    agente.x = alvo.x * CAMPO_X;
    agente.y = alvo.y * CAMPO_Y;
    agente.vx = 0;
    agente.vy = 0;
  });
}

function manterNoCampo(agente: Agente): void {
  const x = limitar(agente.x, MARGEM_CAMPO, CAMPO_X - MARGEM_CAMPO);
  const y = limitar(agente.y, MARGEM_CAMPO, CAMPO_Y - MARGEM_CAMPO);
  if (x !== agente.x) agente.vx = 0;
  if (y !== agente.y) agente.vy = 0;
  agente.x = x;
  agente.y = y;
}

/** Faz o agente acelerar e frear em direção ao alvo, sem passar da velocidade máxima. */
function mover(agente: Agente, alvo: Ponto, velocidadeMax: number): void {
  const dx = alvo.x - agente.x;
  const dy = alvo.y - agente.y;
  const distancia = Math.hypot(dx, dy);

  let desejadaX = 0;
  let desejadaY = 0;
  if (distancia > 0.01) {
    const velocidade = Math.min(velocidadeMax, distancia * GANHO_CHEGADA);
    desejadaX = (dx / distancia) * velocidade;
    desejadaY = (dy / distancia) * velocidade;
  }

  let ax = desejadaX - agente.vx;
  let ay = desejadaY - agente.vy;
  const limite = ACELERACAO_MAX * DT;
  const modulo = Math.hypot(ax, ay);
  if (modulo > limite) {
    ax = (ax / modulo) * limite;
    ay = (ay / modulo) * limite;
  }

  agente.vx += ax;
  agente.vy += ay;
  agente.x += agente.vx * DT;
  agente.y += agente.vy * DT;
  manterNoCampo(agente);
}

/** Afasta jogadores que ficaram perto demais uns dos outros. */
function separar(agentes: Agente[]): void {
  for (let i = 0; i < agentes.length; i++) {
    const a = agentes[i];
    if (!a) continue;
    for (let j = i + 1; j < agentes.length; j++) {
      const b = agentes[j];
      if (!b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distancia = Math.hypot(dx, dy);
      if (distancia >= DISTANCIA_MINIMA) continue;

      const ux = distancia < 0.001 ? 1 : dx / distancia;
      const uy = distancia < 0.001 ? 0 : dy / distancia;
      const empurrao = (DISTANCIA_MINIMA - distancia) / 2;
      a.x -= ux * empurrao;
      a.y -= uy * empurrao;
      b.x += ux * empurrao;
      b.y += uy * empurrao;
      manterNoCampo(a);
      manterNoCampo(b);
    }
  }
}

/** Alvo do jogador: lugar na formação, puxado pela bola e com uma ondulação própria. */
function alvoIndividual(
  agente: Agente,
  forma: Ponto,
  bola: Ponto,
  situacao: Pick<RegistroTick, "posse" | "zona">,
  tempo: number,
): Ponto {
  if (agente.setor === "goleiro") {
    return { x: forma.x, y: limitar(CAMPO_Y / 2 + (bola.y - CAMPO_Y / 2) * 0.25, 24, 44) };
  }

  const setores = agente.lado === situacao.posse ? SETOR_COM_A_BOLA : SETOR_SEM_A_BOLA;
  const peso = agente.setor === setores[situacao.zona] ? PESO_SETOR_DA_BOLA : PESO_DEMAIS;

  let puxaoX = (bola.x - forma.x) * peso;
  let puxaoY = (bola.y - forma.y) * peso;
  const modulo = Math.hypot(puxaoX, puxaoY);
  if (modulo > ATRACAO_MAX) {
    puxaoX = (puxaoX / modulo) * ATRACAO_MAX;
    puxaoY = (puxaoY / modulo) * ATRACAO_MAX;
  }

  return {
    x: forma.x + puxaoX + AMPLITUDE_ONDULACAO * Math.sin(tempo * 0.9 + agente.fases[0]),
    y: forma.y + puxaoY + AMPLITUDE_ONDULACAO * Math.cos(tempo * 0.7 + agente.fases[1]),
  };
}

function alvoCorrendoComABola(agente: Agente): Ponto {
  return {
    x: limitar(agente.x + sentidoDeAtaque(agente.lado) * CORRIDA_COM_A_BOLA, 2, CAMPO_X - 2),
    y: agente.y + (CAMPO_Y / 2 - agente.y) * 0.2,
  };
}

/** Onde a bola fica quando o jogador a conduz: um pouco à frente, na direção em que ele corre. */
function posicaoDaBolaConduzida(agente: Agente): Ponto {
  const velocidade = Math.hypot(agente.vx, agente.vy);
  const ux = velocidade > 0.5 ? agente.vx / velocidade : sentidoDeAtaque(agente.lado);
  const uy = velocidade > 0.5 ? agente.vy / velocidade : 0;
  return {
    x: limitar(agente.x + ux * DISTANCIA_BOLA_CONDUZIDA, 0, CAMPO_X),
    y: limitar(agente.y + uy * DISTANCIA_BOLA_CONDUZIDA, 0, CAMPO_Y),
  };
}

export function criarCena(
  resultado: ResultadoPartida,
  escalacoes: Record<Lado, Escalacao>,
  seed = 1,
): Cena {
  const totalTicks = resultado.ticks.length;
  if (totalTicks === 0) {
    throw new Error("A partida não tem ticks para encenar.");
  }

  const aleatorio = new Aleatorio(seed);
  const agentes = criarAgentes(escalacoes, aleatorio);
  const porId = new Map(agentes.map((agente) => [agente.id, agente] as const));
  const buscar = (id: number): Agente => {
    const agente = porId.get(id);
    if (!agente) throw new Error(`O jogador ${id} não está em campo.`);
    return agente;
  };

  const totalPassos = totalTicks * PASSOS_POR_TICK;
  const larguraQuadro = agentes.length * 2 + 2;
  const quadros = new Float32Array((totalPassos + 1) * larguraQuadro);
  const bola: Ponto = { x: CAMPO_X / 2, y: CAMPO_Y / 2 };

  const gravar = (indice: number): void => {
    const base = indice * larguraQuadro;
    agentes.forEach((agente, k) => {
      quadros[base + k * 2] = agente.x / CAMPO_X;
      quadros[base + k * 2 + 1] = agente.y / CAMPO_Y;
    });
    quadros[base + agentes.length * 2] = bola.x / CAMPO_X;
    quadros[base + agentes.length * 2 + 1] = bola.y / CAMPO_Y;
  };

  let tempoSimulado = 0;

  for (let tick = 0; tick < totalTicks; tick++) {
    const registro = resultado.ticks[tick];
    if (!registro) throw new Error(`O tick ${tick} não tem registro.`);

    const idDeQuemTinha = quemTinhaABola(registro.lance);
    const quemTinha = buscar(idDeQuemTinha);
    const quemFicou = buscar(registro.jogadorComBolaId);
    const parado = registro.lance.tipo === "FALTA";

    const comecoDeTempo = tick === 0 || tick === TICKS_POR_PARTIDA / 2;
    let forma = calcularPosicoes(registro, escalacoes);
    let reforcoGeral = 1;

    if (comecoDeTempo) {
      forma = calcularPosicoes(
        { posse: quemTinha.lado, zona: "MEIO", jogadorComBolaId: idDeQuemTinha },
        escalacoes,
      );
      reforcoGeral = REFORCO_SAIDA_DE_BOLA;
      if (tick === 0) colocarNaForma(agentes, forma);

      quemTinha.x = CAMPO_X / 2;
      quemTinha.y = CAMPO_Y / 2;
      quemTinha.vx = 0;
      quemTinha.vy = 0;
      const saida = posicaoDaBolaConduzida(quemTinha);
      bola.x = saida.x;
      bola.y = saida.y;
      if (tick === 0) gravar(0);
    }

    forma.jogadores.forEach((jogador, k) => {
      if (agentes[k]?.id !== jogador.id) {
        throw new Error("A ordem dos jogadores da cena não bate com a das posições.");
      }
    });
    const alvosDaForma: Ponto[] = forma.jogadores.map((j) => ({
      x: j.x * CAMPO_X,
      y: j.y * CAMPO_Y,
    }));

    let inicioDoVoo: Ponto = { x: bola.x, y: bola.y };

    for (let passo = 0; passo < PASSOS_POR_TICK; passo++) {
      tempoSimulado += DT;

      agentes.forEach((agente, k) => {
        const alvoDaForma = alvosDaForma[k] ?? { x: agente.x, y: agente.y };
        let alvo = alvoIndividual(agente, alvoDaForma, bola, registro, tempoSimulado);
        let reforco = reforcoGeral;

        if (parado && agente === quemFicou) {
          alvo = { x: agente.x, y: agente.y };
        } else if (passo < PASSO_INICIO_VOO && agente === quemTinha) {
          alvo = alvoCorrendoComABola(agente);
          reforco *= REFORCO_CONDUCAO;
        } else if (agente === quemFicou) {
          if (passo < PASSO_FIM_VOO) {
            alvo = { x: (alvo.x + bola.x) / 2, y: (alvo.y + bola.y) / 2 };
            reforco *= REFORCO_RECEPCAO;
          } else {
            alvo = alvoCorrendoComABola(agente);
            reforco *= REFORCO_CONDUCAO;
          }
        }

        mover(agente, alvo, agente.velocidadeMax * reforco);
      });

      separar(agentes);

      let novaBola: Ponto;
      if (passo < PASSO_INICIO_VOO) {
        novaBola = posicaoDaBolaConduzida(quemTinha);
      } else if (passo < PASSO_FIM_VOO) {
        if (passo === PASSO_INICIO_VOO) inicioDoVoo = { x: bola.x, y: bola.y };
        const u = (passo - PASSO_INICIO_VOO + 1) / (PASSO_FIM_VOO - PASSO_INICIO_VOO);
        const destino = posicaoDaBolaConduzida(quemFicou);
        novaBola = {
          x: misturar(inicioDoVoo.x, destino.x, u),
          y: misturar(inicioDoVoo.y, destino.y, u),
        };
      } else {
        novaBola = posicaoDaBolaConduzida(quemFicou);
      }
      bola.x = novaBola.x;
      bola.y = novaBola.y;

      gravar(tick * PASSOS_POR_TICK + passo + 1);
    }
  }

  const tickEm = (tempoMs: number): number =>
    Math.min(totalTicks - 1, Math.max(0, Math.floor(tempoMs / MS_POR_TICK)));

  const quadroEm = (tempoMs: number): PosicoesTick => {
    const posicao = limitar(tempoMs / MS_POR_PASSO, 0, totalPassos);
    const indice = Math.min(Math.floor(posicao), totalPassos - 1);
    const t = posicao - indice;
    const a = indice * larguraQuadro;
    const b = (indice + 1) * larguraQuadro;
    const valor = (deslocamento: number): number =>
      misturar(quadros[a + deslocamento] ?? 0, quadros[b + deslocamento] ?? 0, t);

    return {
      jogadores: agentes.map((agente, k) => ({
        id: agente.id,
        lado: agente.lado,
        x: valor(k * 2),
        y: valor(k * 2 + 1),
      })),
      bola: { x: valor(agentes.length * 2), y: valor(agentes.length * 2 + 1) },
    };
  };

  return { totalTicks, duracaoMs: totalTicks * MS_POR_TICK, tickEm, quadroEm };
}
