import type { Quest, QuestSimulation } from '../curriculum/types';

export interface EvaluationOutcome {
  aligned: boolean;
  closeness: number; // 0..1 smooth proximity metric for calm visual feedback
  direction: 'low' | 'high' | 'aligned';
  physicalMessage: string;
  readoutLabel: string;
  readoutValue: string;
}

/**
 * Pure Calculus I mathematical primitives shared by interactive canvases and unit tests.
 */

/** Secant slope of f(x) = x^2 between x0 and x0 + h */
export function secantSlopeQuadratic(x0: number, h: number): number {
  if (Math.abs(h) < 1e-6) return 2 * x0;
  return ((x0 + h) ** 2 - x0 ** 2) / h;
}

/** Exact derivative of f(x) = 0.25 x^3 - 1.5 x + 2 at x */
export function cubicWaveHeight(x: number): number {
  return 0.25 * x * x * x - 1.5 * x + 2;
}

export function cubicWaveSlope(x: number): number {
  return 0.75 * x * x - 1.5;
}

/** Related rates: circular ripple area A(r) = pi r^2, dA/dt = 2 pi r (dr/dt) */
export function rippleAreaRate(radius: number, drDt: number): number {
  return 2 * Math.PI * radius * drDt;
}

/** Optimization: rectangular coastal orchard fenced on 3 sides with total stone L -> A(w) = w(L - 2w) */
export function coastalOrchardArea(width: number, totalFence = 120): number {
  const length = Math.max(0, totalFence - 2 * width);
  return width * length;
}

/** Riemann sum (midpoint) of f(x) = 1 + 0.5*x^2 on [a, b] with n slices */
export function midpointRiemannQuadratic(a: number, b: number, n: number): number {
  const slices = Math.max(1, Math.round(n));
  const dx = (b - a) / slices;
  let sum = 0;
  for (let i = 0; i < slices; i++) {
    const xm = a + (i + 0.5) * dx;
    sum += (1 + 0.5 * xm * xm) * dx;
  }
  return sum;
}

/** Exact integral of f(x) = 1 + 0.5*x^2 on [a, b] */
export function exactIntegralQuadratic(a: number, b: number): number {
  const F = (x: number) => x + (x * x * x) / 6;
  return F(b) - F(a);
}

/** Disk method volume of revolution of r(x) = a * sqrt(x) around x-axis on [0, H] -> pi * a^2 * H^2 / 2 */
export function amphoraDiskVolume(scaleA: number, heightH: number): number {
  return (Math.PI * scaleA * scaleA * heightH * heightH) / 2;
}

/** Average value of f(x) = 2 + 1.5 sin(pi x / 4) on [0, 4] = 2 + 3/pi */
export function exactWaveAverage(): number {
  return 2 + 3 / Math.PI;
}

/** Area between upper parabola y = 4 - x^2 and horizontal chord y = c (for c < 4) */
export function areaBetweenParabolaAndLine(c: number): number {
  if (c >= 4) return 0;
  // integral_{-sqrt(4-c)}^{sqrt(4-c)} (4 - c - x^2) dx = (4/3) * (4 - c)^(3/2)
  return (4 / 3) * Math.pow(4 - c, 1.5);
}

/** Work lifting a stone + hanging chain of linear density rho over height H: W = m*H + 0.5*rho*H^2 */
export function hoistWork(stoneWeight: number, ropeDensity: number, height: number): number {
  return stoneWeight * height + 0.5 * ropeDensity * height * height;
}

/**
 * Evaluates a player's current slider values against any quest's target tolerance.
 * Always calm, continuous, and zero-punishment.
 */
export function evaluateSimulation(
  sim: QuestSimulation,
  values: Record<string, number>,
): EvaluationOutcome {
  let worstRatio = 0;
  let primaryDirection: 'low' | 'high' | 'aligned' = 'aligned';

  for (const ctrl of sim.controls) {
    const v = values[ctrl.id] ?? ctrl.initial;
    const diff = v - ctrl.target;
    const ratio = Math.abs(diff) / Math.max(ctrl.tolerance, 1e-4);
    if (ratio > worstRatio) {
      worstRatio = ratio;
      if (ratio > 1) {
        primaryDirection = diff < 0 ? 'low' : 'high';
      }
    }
  }

  const aligned = worstRatio <= 1;
  // Smooth 0..1 closeness meter
  const closeness = Math.max(0, Math.min(1, 1 / (1 + Math.max(0, worstRatio - 0.5) * 0.65)));

  const firstCtrl = sim.controls[0];
  const firstVal = values[firstCtrl.id] ?? firstCtrl.initial;
  const readoutLabel = firstCtrl.label;
  const readoutValue = `${Number(firstVal.toFixed(2))}${firstCtrl.unit ? ` ${firstCtrl.unit}` : ''}`;

  const physicalMessage = aligned
    ? sim.feedbackAligned
    : primaryDirection === 'low'
      ? sim.feedbackLow
      : sim.feedbackHigh;

  return {
    aligned,
    closeness,
    direction: aligned ? 'aligned' : primaryDirection,
    physicalMessage,
    readoutLabel,
    readoutValue,
  };
}

/** Build a calm, non-spoiling visual intuition nudge based on live parameter state (offline fallback for AI Oracle). */
export function buildGentleVisualNudge(quest: Quest, values: Record<string, number>, calmDial: number): string {
  const outcome = evaluateSimulation(quest.simulation, values);
  if (outcome.aligned) {
    return 'Your setting is already in harmony with the sea — lock in your discovery whenever you feel ready.';
  }
  const gentleExtra =
    calmDial <= 45
      ? ` Try nudging ${quest.simulation.controls[0].label.toLowerCase()} ${outcome.direction === 'low' ? 'slightly higher' : 'slightly lower'} and watch how the motion settles.`
      : '';
  const base = outcome.direction === 'low' ? quest.oracleNudges[0] : quest.oracleNudges[1];
  return `${base}${gentleExtra}`;
}
