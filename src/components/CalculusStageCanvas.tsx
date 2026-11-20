import { useEffect, useRef } from 'react';
import type { Quest } from '../curriculum/types';
import {
  amphoraDiskVolume,
  areaBetweenParabolaAndLine,
  coastalOrchardArea,
  cubicWaveHeight,
  cubicWaveSlope,
  evaluateSimulation,
  exactIntegralQuadratic,
  hoistWork,
  midpointRiemannQuadratic,
  rippleAreaRate,
  secantSlopeQuadratic,
} from '../engine/simulationMath';

interface CalculusStageCanvasProps {
  quest: Quest;
  values: Record<string, number>;
  theme: 'daylight' | 'dusk';
  eyeRestMode: boolean;
  showSymbolicOverlay: boolean;
}

/**
 * Interactive Visual-Spatial Calculus I Physics & Geometry Canvas.
 * Renders embodied Mediterranean metaphors (ships, mooring ropes, swells, orchards,
 * filling cisterns, and 3D spun marble amphorae) at 60 FPS in the active circadian palette.
 */
export function CalculusStageCanvas({
  quest,
  values,
  theme,
  eyeRestMode,
  showSymbolicOverlay,
}: CalculusStageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawNowRef = useRef<(() => void) | null>(null);
  const stateRef = useRef({ quest, values, theme, eyeRestMode, showSymbolicOverlay });
  stateRef.current = { quest, values, theme, eyeRestMode, showSymbolicOverlay };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 640;
    let height = 380;
    let rafId = 0;
    let timerId = 0;
    let t = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(300, Math.round(rect.width));
      height = Math.max(240, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawNowRef.current?.();
    };

    const drawMiniShip = (x: number, y: number, angleRad: number, col: { hull: string; sail: string; gold: string }) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angleRad);

      // Hull
      ctx.fillStyle = col.hull;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.quadraticCurveTo(0, 11, 24, 0);
      ctx.lineTo(18, -5);
      ctx.lineTo(-18, -5);
      ctx.closePath();
      ctx.fill();

      // Mast & sail
      ctx.strokeStyle = col.hull;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, -32);
      ctx.stroke();

      ctx.fillStyle = col.sail;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.quadraticCurveTo(16, -18, 10, -7);
      ctx.lineTo(-9, -7);
      ctx.quadraticCurveTo(-4, -18, 0, -30);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = col.gold;
      ctx.beginPath();
      ctx.arc(2, -17, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const paintScene = (dt: number) => {
      const { quest: q, values: vals, theme: th, eyeRestMode: calm, showSymbolicOverlay: showSym } = stateRef.current;
      if (!calm) t += dt;

      const isDusk = th === 'dusk';
      const pal = isDusk
        ? {
            bgTop: '#1E1D19',
            bgBot: '#25231E',
            grid: 'rgba(230, 220, 200, 0.08)',
            axis: 'rgba(230, 220, 200, 0.28)',
            ink: '#E6DCC8',
            muted: '#A89E8B',
            sage: '#6E9E8B',
            sageFill: 'rgba(110, 158, 139, 0.24)',
            gold: '#D99B43',
            goldFill: 'rgba(217, 155, 67, 0.22)',
            clay: '#C9735B',
            clayFill: 'rgba(201, 115, 91, 0.2)',
            hull: '#8A633C',
            sail: '#E6DCC8',
          }
        : {
            bgTop: '#F3ECDC',
            bgBot: '#E8DEC8',
            grid: 'rgba(43, 42, 39, 0.08)',
            axis: 'rgba(43, 42, 39, 0.28)',
            ink: '#2B2A27',
            muted: '#5E5B52',
            sage: '#2E6F65',
            sageFill: 'rgba(46, 111, 101, 0.2)',
            gold: '#C4842D',
            goldFill: 'rgba(196, 132, 45, 0.22)',
            clay: '#B85D43',
            clayFill: 'rgba(184, 93, 67, 0.18)',
            hull: '#6B4726',
            sail: '#FAF6EC',
          };

      const outcome = evaluateSimulation(q.simulation, vals);
      const activeAccent = outcome.aligned ? pal.gold : pal.sage;

      // Soft ergonomic backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, pal.bgTop);
      bg.addColorStop(1, pal.bgBot);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle architectural grid lines (only visible in Stage 3+ or lightly in Stage 2)
      if (showSym || q.stage >= 2) {
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        for (let gx = 48; gx < width; gx += 48) {
          ctx.beginPath();
          ctx.moveTo(gx, 20);
          ctx.lineTo(gx, height - 20);
          ctx.stroke();
        }
        for (let gy = 48; gy < height; gy += 48) {
          ctx.beginPath();
          ctx.moveTo(20, gy);
          ctx.lineTo(width - 20, gy);
          ctx.stroke();
        }
      }

      const sim = q.simulation;
      const pad = 46;
      const plotW = width - pad * 2;
      const plotH = height - pad * 2;

      // =====================================================================
      // 1. REALM I — FUNCTIONS, INVERSES, UNIT CIRCLE, EXP/LOG
      // =====================================================================
      if (sim.kind === 'function-wave') {
        if (sim.variant === 'unit-circle') {
          const deg = vals.angleDeg ?? 30;
          const rad = (deg * Math.PI) / 180;
          const targetRad = ((sim.controls[0]?.target ?? 60) * Math.PI) / 180;
          const cx = width * 0.44;
          const cy = height * 0.6;
          const R = Math.min(width * 0.26, height * 0.4);

          // Compass axes
          ctx.strokeStyle = pal.axis;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(cx - R - 26, cy);
          ctx.lineTo(cx + R + 26, cy);
          ctx.moveTo(cx, cy + R * 0.55);
          ctx.lineTo(cx, cy - R - 24);
          ctx.stroke();

          // Bronze unit circle ring
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.stroke();

          // Target star marker on circle
          const tx = cx + Math.cos(targetRad) * R;
          const ty = cy - Math.sin(targetRad) * R;
          ctx.fillStyle = pal.goldFill;
          ctx.beginPath();
          ctx.arc(tx, ty, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(tx, ty, 6, 0, Math.PI * 2);
          ctx.stroke();

          // Active beam
          const px = cx + Math.cos(rad) * R;
          const py = cy - Math.sin(rad) * R;

          // Horizontal cos shadow + vertical sin lantern pillar
          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, cy);
          ctx.stroke();

          ctx.strokeStyle = pal.clay;
          ctx.lineWidth = 3.2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(px, cy);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.setLineDash([]);

          // Lighthouse beam ray
          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.stroke();

          ctx.fillStyle = activeAccent;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();

          // Live right-hand readout
          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          const rx = width * 0.74;
          ctx.fillText(`Angle: ${Math.round(deg)}°`, rx, height * 0.32);
          ctx.fillStyle = pal.sage;
          ctx.fillText(`Horizontal: ${Math.cos(rad).toFixed(2)}`, rx, height * 0.44);
          ctx.fillStyle = pal.clay;
          ctx.fillText(`Vertical: ${Math.sin(rad).toFixed(2)}`, rx, height * 0.56);
        } else if (sim.variant === 'inverse') {
          const slope = vals.mirrorSlope ?? 1.5;
          const ox = pad + 20;
          const oy = height - pad - 10;
          const span = Math.min(plotW - 40, plotH - 10);

          // Axes
          ctx.strokeStyle = pal.axis;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + span, oy);
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox, oy - span);
          ctx.stroke();

          // Diagonal shimmer mirror y = x
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 1.8;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + span, oy - span);
          ctx.stroke();
          ctx.setLineDash([]);

          // Outbound route y = 2x
          ctx.strokeStyle = pal.muted;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + span * 0.48, oy - span * 0.96);
          ctx.stroke();

          // Target reflected route y = 0.5x (subtle golden ghost)
          ctx.strokeStyle = pal.goldFill;
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + span * 0.96, oy - span * 0.48);
          ctx.stroke();

          // Player's return route y = slope * x
          const endX = Math.min(1, 0.96 / Math.max(slope, 0.2));
          const endY = Math.min(0.96, endX * slope);
          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + span * endX, oy - span * endY);
          ctx.stroke();

          drawMiniShip(ox + span * endX * 0.72, oy - span * endY * 0.72 - 6, -Math.atan(slope) * 0.4, pal);

          ctx.fillStyle = pal.muted;
          ctx.font = '600 12px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText('Outbound path', ox + span * 0.5, oy - span * 0.9);
          ctx.fillText('Mirror line', ox + span * 0.82, oy - span * 0.88);
          ctx.fillStyle = activeAccent;
          ctx.fillText(`Return tilt: ${slope.toFixed(2)}`, ox + span * 0.55, oy - 16);
        } else if (sim.variant === 'exp-log') {
          const k = vals.growthK ?? 0.3;
          const xMap = (x: number) => pad + (x / 2.2) * plotW;
          const yMap = (y: number) => height - pad - (y / 4.2) * plotH;

          // Axes & 2x doubling horizon
          ctx.strokeStyle = pal.axis;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(pad, yMap(0));
          ctx.lineTo(width - pad, yMap(0));
          ctx.moveTo(xMap(0), pad);
          ctx.lineTo(xMap(0), yMap(0));
          ctx.stroke();

          // Target 2x doubling gate at t = 1
          ctx.strokeStyle = pal.gold;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(pad, yMap(2));
          ctx.lineTo(width - pad, yMap(2));
          ctx.moveTo(xMap(1), pad);
          ctx.lineTo(xMap(1), yMap(0));
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = pal.goldFill;
          ctx.beginPath();
          ctx.arc(xMap(1), yMap(2), 12, 0, Math.PI * 2);
          ctx.fill();

          // Exponential curve y = e^(kx)
          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * 2.2;
            const y = Math.min(4.2, Math.exp(k * x));
            const px = xMap(x);
            const py = yMap(y);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          const valAt1 = Math.exp(k);
          ctx.fillStyle = activeAccent;
          ctx.beginPath();
          ctx.arc(xMap(1), yMap(Math.min(4.2, valAt1)), 6.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`At t = 1 hr: ${valAt1.toFixed(2)}× (goal: 2.00×)`, pad + 14, pad + 16);
        } else {
          // Horizontal wave shift & harbor lantern arch
          const shiftX = vals.shiftX ?? 0;
          const targetShift = sim.controls[0]?.target ?? 1.2;
          const xMap = (x: number) => pad + ((x + 4) / 8) * plotW;
          const yMap = (y: number) => height * 0.56 - y * (plotH * 0.24);

          // Target harbor arch crest position (where sin(x - targetShift) = 1 -> x = targetShift + pi/2)
          const goalX = ((targetShift + Math.PI / 2 + 4) % 8) - 4;
          const gx = xMap(goalX);
          const gy = yMap(1);

          // Sunlit harbor buoy lantern & vertical mooring alignment guide
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 1.6;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(gx, gy - 12);
          ctx.lineTo(gx, height - 22);
          ctx.stroke();
          ctx.setLineDash([]);

          const lanternGlow = ctx.createRadialGradient(gx, gy - 26, 3, gx, gy - 26, 40);
          lanternGlow.addColorStop(0, pal.goldFill);
          lanternGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = lanternGlow;
          ctx.beginPath();
          ctx.arc(gx, gy - 26, 40, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.gold;
          ctx.beginPath();
          ctx.arc(gx, gy - 26, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(gx, gy - 26, 13, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = pal.muted;
          ctx.font = '600 12px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText('Harbor Lantern Gate', Math.min(width - 145, Math.max(16, gx - 56)), gy - 46);

          // Sea wave fill
          ctx.fillStyle = pal.sageFill;
          ctx.beginPath();
          ctx.moveTo(pad, height - 18);
          for (let i = 0; i <= 120; i++) {
            const x = -4 + (i / 120) * 8;
            const y = Math.sin(x - shiftX) + (calm ? 0 : Math.sin(t * 1.8 + x) * 0.04);
            ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.lineTo(width - pad, height - 18);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          for (let i = 0; i <= 120; i++) {
            const x = -4 + (i / 120) * 8;
            const y = Math.sin(x - shiftX) + (calm ? 0 : Math.sin(t * 1.8 + x) * 0.04);
            if (i === 0) ctx.moveTo(xMap(x), yMap(y));
            else ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.stroke();

          // Trireme riding the active crest
          const crestX = ((shiftX + Math.PI / 2 + 4) % 8) - 4;
          drawMiniShip(xMap(crestX), yMap(1) - 4, 0, pal);
        }
      }

      // =====================================================================
      // 2. REALM II — SECANT-TO-TANGENT, ONE-SIDED LIMITS, HOLES, ASYMPTOTES, IVT
      // =====================================================================
      else if (sim.kind === 'secant-tangent') {
        if (sim.variant === 'secant') {
          const h = vals.gapH ?? 1.5;
          const x0 = 1.2;
          const xMap = (x: number) => pad + (x / 4.2) * plotW;
          const yMap = (y: number) => height - pad - (y / 14) * plotH;

          // Curve f(x) = x^2
          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * 3.8;
            const px = xMap(x);
            const py = yMap(x * x);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // True golden grazing tangent at x0
          const mTrue = 2 * x0;
          const y0 = x0 * x0;
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 1.8;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(xMap(0.2), yMap(y0 + mTrue * (0.2 - x0)));
          ctx.lineTo(xMap(3.2), yMap(y0 + mTrue * (3.2 - x0)));
          ctx.stroke();
          ctx.setLineDash([]);

          // Secant mooring rope between (x0, x0^2) and (x0+h, (x0+h)^2)
          const mSec = secantSlopeQuadratic(x0, h);
          ctx.strokeStyle = outcome.aligned ? pal.gold : pal.clay;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(xMap(Math.max(0.1, x0 - 0.8)), yMap(y0 + mSec * -0.8));
          ctx.lineTo(xMap(Math.min(4.0, x0 + h + 0.6)), yMap(y0 + mSec * (h + 0.6)));
          ctx.stroke();

          // Two buoys
          ctx.fillStyle = pal.gold;
          ctx.beginPath();
          ctx.arc(xMap(x0), yMap(y0), 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = outcome.aligned ? pal.gold : pal.clay;
          ctx.beginPath();
          ctx.arc(xMap(x0 + h), yMap((x0 + h) ** 2), 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Rope tilt: ${mSec.toFixed(2)}`, pad + 12, pad + 18);
          if (showSym) {
            ctx.fillStyle = pal.muted;
            ctx.fillText(`Target grazing tilt: ${mTrue.toFixed(2)}`, pad + 12, pad + 38);
          }
        } else if (sim.variant === 'one-sided') {
          const offset = vals.rightOffset ?? -1.2;
          const midX = width * 0.5;
          const baseY = height * 0.52;

          // Stone bridge pier at center
          ctx.fillStyle = isDusk ? '#3B362D' : '#D5C7AE';
          ctx.fillRect(midX - 8, baseY - 22, 16, height - baseY + 22);

          // Left water channel
          ctx.fillStyle = pal.sageFill;
          ctx.beginPath();
          ctx.moveTo(pad, height - 20);
          for (let x = pad; x <= midX; x += 6) {
            const wave = Math.sin((x - pad) * 0.03 + (calm ? 0 : t * 2)) * 4;
            ctx.lineTo(x, baseY + wave);
          }
          ctx.lineTo(midX, height - 20);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = pad; x <= midX; x += 6) {
            const wave = Math.sin((x - pad) * 0.03 + (calm ? 0 : t * 2)) * 4;
            if (x === pad) ctx.moveTo(x, baseY + wave);
            else ctx.lineTo(x, baseY + wave);
          }
          ctx.stroke();

          // Right water channel shifted by offset
          const rightY = baseY - offset * 34;
          ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.clayFill;
          ctx.beginPath();
          ctx.moveTo(midX, height - 20);
          for (let x = midX; x <= width - pad; x += 6) {
            const wave = Math.sin((x - midX) * 0.03 + (calm ? 0 : t * 2)) * 4;
            ctx.lineTo(x, rightY + wave);
          }
          ctx.lineTo(width - pad, height - 20);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = outcome.aligned ? pal.gold : pal.clay;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let x = midX; x <= width - pad; x += 6) {
            const wave = Math.sin((x - midX) * 0.03 + (calm ? 0 : t * 2)) * 4;
            if (x === midX) ctx.moveTo(x, rightY + wave);
            else ctx.lineTo(x, rightY + wave);
          }
          ctx.stroke();

          drawMiniShip(midX - 66, baseY - 6, 0, pal);
          drawMiniShip(midX + 66, rightY - 6, 0, pal);
        } else if (sim.variant === 'removable-hole') {
          const bridgeH = vals.bridgeHeight ?? 2.2;
          const xMap = (x: number) => pad + (x / 4.2) * plotW;
          const yMap = (y: number) => height - pad - (y / 6.5) * plotH;

          // Line y = x + 2 with open circle hole at x = 2
          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(xMap(0.2), yMap(2.2));
          ctx.lineTo(xMap(1.88), yMap(3.88));
          ctx.moveTo(xMap(2.12), yMap(4.12));
          ctx.lineTo(xMap(3.9), yMap(5.9));
          ctx.stroke();

          // Open removable hole at (2, 4)
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(xMap(2), yMap(4), 9, 0, Math.PI * 2);
          ctx.stroke();

          // Player's movable keystone at (2, bridgeH)
          ctx.fillStyle = outcome.aligned ? pal.gold : pal.clay;
          ctx.beginPath();
          ctx.arc(xMap(2), yMap(bridgeH), 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Keystone height at x = 2: ${bridgeH.toFixed(1)}`, pad + 12, pad + 18);
        } else if (sim.variant === 'asymptote') {
          const C = vals.ceilingC ?? 2.0;
          const xMap = (x: number) => pad + (x / 30) * plotW;
          const yMap = (y: number) => height - pad - (y / 6.2) * plotH;

          // Target horizon beacon at y = 4.2
          ctx.strokeStyle = pal.gold;
          ctx.setLineDash([6, 5]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pad, yMap(4.2));
          ctx.lineTo(width - pad, yMap(4.2));
          ctx.stroke();
          ctx.setLineDash([]);

          // Curve y = C*t / (t + 4)
          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * 30;
            const y = (C * x) / (x + 4);
            if (i === 0) ctx.moveTo(xMap(x), yMap(y));
            else ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.stroke();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Long-run ceiling: ${C.toFixed(1)} (horizon beacon: 4.2)`, pad + 12, pad + 18);
        } else {
          // IVT crossing
          const probeX = vals.probeX ?? 1.0;
          const f = (x: number) => 0.35 * (x - 2.5) ** 3 + 0.9 * (x - 2.5) + 2.5;
          const xMap = (x: number) => pad + (x / 5) * plotW;
          const yMap = (y: number) => height - pad - (y / 5.5) * plotH;

          // Target depth K = 2.5
          ctx.strokeStyle = pal.gold;
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pad, yMap(2.5));
          ctx.lineTo(width - pad, yMap(2.5));
          ctx.stroke();
          ctx.setLineDash([]);

          // Continuous channel curve
          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const x = 0.4 + (i / 100) * 4.2;
            const y = f(x);
            if (i === 0) ctx.moveTo(xMap(x), yMap(y));
            else ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.stroke();

          const py = f(probeX);
          ctx.fillStyle = activeAccent;
          ctx.beginPath();
          ctx.arc(xMap(probeX), yMap(py), 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // =====================================================================
      // 3. REALM III — DERIVATIVE SURF, POWER RULE, CHAIN GEARS, RELATED RATES
      // =====================================================================
      else if (sim.kind === 'derivative-surf') {
        if (sim.variant === 'chain-gears') {
          const inner = vals.innerRate ?? 1.0;
          const outerFactor = 3;
          const total = inner * outerFactor;
          const cx1 = width * 0.33;
          const cx2 = width * 0.62;
          const cy = height * 0.54;

          const drawGear = (cx: number, r: number, teeth: number, rot: number, color: string) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            ctx.strokeStyle = color;
            ctx.fillStyle = color === pal.gold ? pal.goldFill : pal.sageFill;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            for (let i = 0; i < teeth * 2; i++) {
              const a = (i / (teeth * 2)) * Math.PI * 2;
              const rad = i % 2 === 0 ? r : r - 7;
              if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
              else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          };

          drawGear(cx1, 44, 10, t * inner * 1.4, pal.sage);
          drawGear(cx2, 66, 15, -t * inner * 0.95, outcome.aligned ? pal.gold : pal.clay);

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Inner speed: ${inner.toFixed(1)}×`, cx1 - 48, cy + 84);
          ctx.fillText(`Outer gear: 3×`, cx2 - 44, cy + 84);
          ctx.fillStyle = activeAccent;
          ctx.font = '700 15px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Combined hoist: ${total.toFixed(1)} m/s`, width * 0.36, pad + 14);
        } else if (sim.variant === 'related-rates') {
          const rVal = vals.radius ?? 2.0;
          const areaRate = rippleAreaRate(rVal, 1);
          const cx = width * 0.44;
          const cy = height * 0.54;
          const pxR = rVal * 22;

          // Target ripple outline at r = 4
          ctx.strokeStyle = pal.gold;
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 4 * 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Active expanding water ripple
          ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.sageFill;
          ctx.beginPath();
          ctx.arc(cx, cy, pxR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, pxR, 0, Math.PI * 2);
          ctx.stroke();

          // Outer thin dA ring shimmer
          ctx.strokeStyle = pal.clay;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(cx, cy, pxR + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Radius r = ${rVal.toFixed(1)} m`, width * 0.72, height * 0.42);
          ctx.fillStyle = activeAccent;
          ctx.fillText(`Area speed dA/dt = ${areaRate.toFixed(1)} m²/s`, width * 0.72, height * 0.54);
          ctx.fillStyle = pal.muted;
          ctx.fillText(`Target: 25.1 m²/s (8π)`, width * 0.72, height * 0.66);
        } else if (sim.variant === 'power-tune') {
          const a = vals.coeffA ?? 0.6;
          const xMap = (x: number) => pad + (x / 3.2) * plotW;
          const yMap = (y: number) => height - pad - (y / 12) * plotH;

          // Parabola y = a x^2
          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * 3.0;
            const y = Math.min(12.5, a * x * x);
            if (i === 0) ctx.moveTo(xMap(x), yMap(y));
            else ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.stroke();

          // Live tangent at x = 2 (slope = 4a) vs target golden slope 6
          const px = xMap(2);
          const py = yMap(4 * a);
          const slope = 4 * a;

          ctx.strokeStyle = pal.gold;
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(xMap(1.2), yMap(4 * a - 6 * 0.8));
          ctx.lineTo(xMap(2.8), yMap(4 * a + 6 * 0.8));
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(xMap(1.2), yMap(4 * a - slope * 0.8));
          ctx.lineTo(xMap(2.8), yMap(4 * a + slope * 0.8));
          ctx.stroke();

          ctx.fillStyle = activeAccent;
          ctx.beginPath();
          ctx.arc(px, py, 6.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Live slope at x = 2: ${slope.toFixed(2)} (wind guide: 6.00)`, pad + 12, pad + 18);
        } else {
          // Derivative surf along cubic wave
          const shipX = vals.shipX ?? -0.3;
          const xMap = (x: number) => pad + ((x + 2.6) / 5.2) * plotW;
          const yMap = (y: number) => height * 0.62 - (y - 2) * (plotH * 0.18);

          // Water wave
          ctx.fillStyle = pal.sageFill;
          ctx.beginPath();
          ctx.moveTo(pad, height - 18);
          for (let i = 0; i <= 120; i++) {
            const x = -2.6 + (i / 120) * 5.2;
            ctx.lineTo(xMap(x), yMap(cubicWaveHeight(x)));
          }
          ctx.lineTo(width - pad, height - 18);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 120; i++) {
            const x = -2.6 + (i / 120) * 5.2;
            if (i === 0) ctx.moveTo(xMap(x), yMap(cubicWaveHeight(x)));
            else ctx.lineTo(xMap(x), yMap(cubicWaveHeight(x)));
          }
          ctx.stroke();

          // Live tangent deck vector beneath ship
          const sy = cubicWaveHeight(shipX);
          const slope = cubicWaveSlope(shipX);
          const screenAngle = -Math.atan(slope * 0.45);
          const sx = xMap(shipX);
          const syPx = yMap(sy);

          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(sx - Math.cos(screenAngle) * 58, syPx - Math.sin(screenAngle) * 58);
          ctx.lineTo(sx + Math.cos(screenAngle) * 58, syPx + Math.sin(screenAngle) * 58);
          ctx.stroke();

          drawMiniShip(sx, syPx - 4, screenAngle, pal);

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(
            `Deck tilt: ${slope > 0.08 ? 'Climbing' : slope < -0.08 ? 'Descending' : 'Level'} (${slope.toFixed(2)})`,
            pad + 12,
            pad + 18,
          );
        }
      }

      // =====================================================================
      // 4. REALM IV — PEAKS OF OLYMPUS (ORCHARD OPTIMIZATION, INFLECTION, LINEAR APPROX, L'HOPITAL)
      // =====================================================================
      else if (sim.kind === 'olympus-peaks') {
        if (sim.variant === 'orchard') {
          const w = vals.width ?? 12;
          const length = Math.max(0, 120 - 2 * w);
          const area = coastalOrchardArea(w, 120);

          // Left half: coastal olive orchard blueprint
          const boxMaxW = width * 0.44;
          const boxMaxH = height * 0.52;
          const rectW = (length / 110) * boxMaxW;
          const rectH = (w / 55) * boxMaxH;
          const rx = pad + (boxMaxW - rectW) / 2;
          const ry = pad + 34;

          // Cliff coastline edge along top
          ctx.strokeStyle = pal.muted;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(pad, ry);
          ctx.lineTo(pad + boxMaxW, ry);
          ctx.stroke();

          // Olive orchard shaded rectangle
          ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.sageFill;
          ctx.fillRect(rx, ry, rectW, rectH);
          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx, ry + rectH);
          ctx.lineTo(rx + rectW, ry + rectH);
          ctx.lineTo(rx + rectW, ry);
          ctx.stroke();

          // Right half: live area hill A(w)
          const gx0 = width * 0.56;
          const gw = width * 0.37;
          const gy0 = height - pad - 12;
          const gh = height * 0.55;

          ctx.strokeStyle = pal.axis;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(gx0, gy0);
          ctx.lineTo(gx0 + gw, gy0);
          ctx.stroke();

          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const wi = (i / 60) * 60;
            const ai = coastalOrchardArea(wi, 120);
            const px = gx0 + (wi / 60) * gw;
            const py = gy0 - (ai / 1950) * gh;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          const dotX = gx0 + (w / 60) * gw;
          const dotY = gy0 - (area / 1950) * gh;
          ctx.fillStyle = activeAccent;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Orchard: ${w}m × ${length}m = ${area} m²`, pad, height - 18);
        } else if (sim.variant === 'inflection') {
          const rx = vals.ridgeX ?? -1.5;
          const f = (x: number) => 0.35 * x ** 3 - 0.3 * x;
          const fp = (x: number) => 1.05 * x ** 2 - 0.3;
          const xMap = (x: number) => pad + ((x + 2.4) / 4.8) * plotW;
          const yMap = (y: number) => height * 0.52 - y * (plotH * 0.16);

          // Left dome (concave down, amber) and right bowl (concave up, sage)
          ctx.lineWidth = 3.4;
          ctx.strokeStyle = pal.gold;
          ctx.beginPath();
          for (let i = 0; i <= 50; i++) {
            const x = -2.3 + (i / 50) * 2.3;
            if (i === 0) ctx.moveTo(xMap(x), yMap(f(x)));
            else ctx.lineTo(xMap(x), yMap(f(x)));
          }
          ctx.stroke();

          ctx.strokeStyle = pal.sage;
          ctx.beginPath();
          for (let i = 0; i <= 50; i++) {
            const x = (i / 50) * 2.3;
            if (i === 0) ctx.moveTo(xMap(x), yMap(f(x)));
            else ctx.lineTo(xMap(x), yMap(f(x)));
          }
          ctx.stroke();

          // Tangent plank at rx
          const yVal = f(rx);
          const m = fp(rx);
          ctx.strokeStyle = pal.clay;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(xMap(rx - 0.7), yMap(yVal - m * 0.7));
          ctx.lineTo(xMap(rx + 0.7), yMap(yVal + m * 0.7));
          ctx.stroke();

          ctx.fillStyle = activeAccent;
          ctx.beginPath();
          ctx.arc(xMap(rx), yMap(yVal), 7.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          const bendText = rx < -0.18 ? 'Downward dome (f″ < 0)' : rx > 0.18 ? 'Upward bowl (f″ > 0)' : 'Inflection point (f″ = 0)';
          ctx.fillText(bendText, pad + 12, pad + 18);
        } else if (sim.variant === 'linear-approx') {
          const dx = vals.stepDx ?? 1.4;
          const xMap = (x: number) => pad + ((x - 0.4) / 2.8) * plotW;
          const yMap = (y: number) => height - pad - (y / 9) * plotH;

          // Curve f(x) = x^2 anchored at a = 1
          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 90; i++) {
            const x = 0.5 + (i / 90) * 2.6;
            if (i === 0) ctx.moveTo(xMap(x), yMap(x * x));
            else ctx.lineTo(xMap(x), yMap(x * x));
          }
          ctx.stroke();

          // Tangent L(x) = 1 + 2(x - 1)
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(xMap(0.5), yMap(0));
          ctx.lineTo(xMap(3.1), yMap(5.2));
          ctx.stroke();

          const xEval = 1 + dx;
          const trueY = xEval * xEval;
          const linY = 1 + 2 * dx;
          const err = Math.abs(trueY - linY);

          // Vertical error gap bar
          ctx.strokeStyle = outcome.aligned ? pal.gold : pal.clay;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(xMap(xEval), yMap(trueY));
          ctx.lineTo(xMap(xEval), yMap(linY));
          ctx.stroke();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Step Δx = ${dx.toFixed(2)} · Gap error = ${err.toFixed(3)}`, pad + 12, pad + 18);
        } else {
          // L'Hopital race sin(kx)/x near 0
          const k = vals.freqK ?? 1.5;
          const xMap = (x: number) => pad + ((x + 2.5) / 5) * plotW;
          const yMap = (y: number) => height - pad - ((y + 0.5) / 5.8) * plotH;

          ctx.strokeStyle = pal.gold;
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pad, yMap(3));
          ctx.lineTo(width - pad, yMap(3));
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 120; i++) {
            const x = -2.4 + (i / 120) * 4.8;
            const y = Math.abs(x) < 1e-4 ? k : Math.sin(k * x) / x;
            if (i === 0) ctx.moveTo(xMap(x), yMap(y));
            else ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.stroke();

          ctx.fillStyle = activeAccent;
          ctx.beginPath();
          ctx.arc(xMap(0), yMap(k), 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Settled limit height at x → 0: ${k.toFixed(2)} (target: 3.00)`, pad + 12, pad + 18);
        }
      }

      // =====================================================================
      // 5. REALM V — TIDES OF ACCUMULATION (RIEMANN SUMS, FTC FILL, U-SUB)
      // =====================================================================
      else if (sim.kind === 'tide-accumulation') {
        if (sim.variant === 'u-sub') {
          const k = vals.scaleK ?? 1.0;
          const xMap = (x: number) => pad + (x / Math.PI) * plotW;
          const yMap = (y: number) => height - pad - y * (plotH * 0.72);
          const endArch = Math.PI / (2 * k);
          const area = 1 / k;

          // Shaded positive cosine arch on [0, pi/(2k)]
          ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.sageFill;
          ctx.beginPath();
          ctx.moveTo(xMap(0), yMap(0));
          for (let i = 0; i <= 70; i++) {
            const x = (i / 70) * endArch;
            ctx.lineTo(xMap(x), yMap(Math.cos(k * x)));
          }
          ctx.lineTo(xMap(endArch), yMap(0));
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const x = (i / 100) * Math.min(Math.PI, endArch * 1.4);
            const y = Math.max(0, Math.cos(k * x));
            if (i === 0) ctx.moveTo(xMap(x), yMap(y));
            else ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.stroke();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Compressed arch area: ${area.toFixed(2)} (goal: 0.50)`, pad + 12, pad + 18);
        } else if (sim.variant === 'ftc-fill') {
          const b = vals.upperB ?? 1.5;
          const area = exactIntegralQuadratic(0, b);
          const targetArea = exactIntegralQuadratic(0, sim.controls[0]?.target ?? 3.0);

          // Left: inflow curve f(x) = 1 + 0.5 x^2 with shaded window [0, b]
          const lw = width * 0.58;
          const xMap = (x: number) => pad + (x / 4.2) * lw;
          const yMap = (y: number) => height - pad - (y / 9.5) * plotH;

          ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.sageFill;
          ctx.beginPath();
          ctx.moveTo(xMap(0), yMap(0));
          for (let i = 0; i <= 60; i++) {
            const x = (i / 60) * b;
            ctx.lineTo(xMap(x), yMap(1 + 0.5 * x * x));
          }
          ctx.lineTo(xMap(b), yMap(0));
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) {
            const x = (i / 80) * 4.0;
            if (i === 0) ctx.moveTo(xMap(x), yMap(1 + 0.5 * x * x));
            else ctx.lineTo(xMap(x), yMap(1 + 0.5 * x * x));
          }
          ctx.stroke();

          // Right: Marble Cistern filling proportionally
          const cx = width * 0.76;
          const cw = 72;
          const ch = plotH * 0.85;
          const cy = height - pad - ch;
          const maxCap = 14;
          const fillH = Math.min(1, area / maxCap) * ch;
          const targetH = Math.min(1, targetArea / maxCap) * ch;

          ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.sageFill;
          ctx.fillRect(cx, cy + ch - fillH, cw, fillH);
          ctx.strokeStyle = pal.axis;
          ctx.lineWidth = 2;
          ctx.strokeRect(cx, cy, cw, ch);

          // Golden goal line on cistern
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy + ch - targetH);
          ctx.lineTo(cx + cw + 8, cy + ch - targetH);
          ctx.stroke();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Cistern: ${area.toFixed(2)}`, cx - 8, cy - 10);
          ctx.fillStyle = pal.muted;
          ctx.fillText(`Goal: ${targetArea.toFixed(2)}`, cx - 8, height - 18);
        } else {
          // Riemann slices under 1 + 0.5 x^2 on [0, 3]
          const n = Math.round(vals.slicesN ?? 4);
          const xMap = (x: number) => pad + (x / 3.2) * plotW;
          const yMap = (y: number) => height - pad - (y / 6) * plotH;
          const dx = 3 / n;

          for (let i = 0; i < n; i++) {
            const xm = (i + 0.5) * dx;
            const h = 1 + 0.5 * xm * xm;
            const rx = xMap(i * dx);
            const rw = xMap((i + 1) * dx) - rx;
            const ry = yMap(h);
            ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.sageFill;
            ctx.fillRect(rx, ry, rw - 1, yMap(0) - ry);
            ctx.strokeStyle = activeAccent;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(rx, ry, rw - 1, yMap(0) - ry);
          }

          ctx.strokeStyle = pal.ink;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) {
            const x = (i / 80) * 3;
            if (i === 0) ctx.moveTo(xMap(x), yMap(1 + 0.5 * x * x));
            else ctx.lineTo(xMap(x), yMap(1 + 0.5 * x * x));
          }
          ctx.stroke();

          const approx = midpointRiemannQuadratic(0, 3, n);
          const exact = exactIntegralQuadratic(0, 3);
          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`${n} slices · Sum: ${approx.toFixed(3)} (True: ${exact.toFixed(2)})`, pad + 12, pad + 18);
        }
      }

      // =====================================================================
      // 6. REALM VI — ARCHITECTURE OF ITHACA (AVERAGE VALUE, AREA BETWEEN, 3D REVOLUTION, WORK)
      // =====================================================================
      else if (sim.kind === 'ithaca-architecture') {
        if (sim.variant === 'revolution') {
          const a = vals.flareA ?? 0.8;
          const H = 4;
          const vol = amphoraDiskVolume(a, H);
          const targetA = sim.controls[0]?.target ?? 1.0;
          const targetVol = amphoraDiskVolume(targetA, H);

          const startX = pad + 40;
          const spanX = plotW - 140;
          const midY = height * 0.55;
          const disks = 18;

          // Spun 3D wireframe + shaded marble amphora disks
          for (let i = 1; i <= disks; i++) {
            const x = (i / disks) * H;
            const r = a * Math.sqrt(x) * 28;
            const px = startX + (x / H) * spanX;
            ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.sageFill;
            ctx.strokeStyle = activeAccent;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(px, midY, Math.max(4, r * 0.28), r, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Upper & lower spun silhouette profile
          ctx.strokeStyle = pal.ink;
          ctx.lineWidth = 2.4;
          for (const sign of [-1, 1]) {
            ctx.beginPath();
            for (let i = 0; i <= 50; i++) {
              const x = (i / 50) * H;
              const r = a * Math.sqrt(x) * 28;
              const px = startX + (x / H) * spanX;
              const py = midY + sign * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
          }

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Vessel volume: ${vol.toFixed(1)} (goal: ${targetVol.toFixed(1)})`, pad + 12, pad + 18);
        } else if (sim.variant === 'area-between') {
          const c = vals.boomC ?? 2.0;
          const area = areaBetweenParabolaAndLine(c);
          const xMap = (x: number) => pad + ((x + 2.4) / 4.8) * plotW;
          const yMap = (y: number) => height - pad - ((y + 0.8) / 5.2) * plotH;

          // Fill enclosed sail between y = 4 - x^2 and y = c
          if (c < 4) {
            const root = Math.sqrt(4 - c);
            ctx.fillStyle = outcome.aligned ? pal.goldFill : pal.sageFill;
            ctx.beginPath();
            ctx.moveTo(xMap(-root), yMap(c));
            for (let i = 0; i <= 60; i++) {
              const x = -root + (i / 60) * 2 * root;
              ctx.lineTo(xMap(x), yMap(4 - x * x));
            }
            ctx.lineTo(xMap(root), yMap(c));
            ctx.closePath();
            ctx.fill();
          }

          // Upper parabolic spar
          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) {
            const x = -2.2 + (i / 80) * 4.4;
            if (i === 0) ctx.moveTo(xMap(x), yMap(4 - x * x));
            else ctx.lineTo(xMap(x), yMap(4 - x * x));
          }
          ctx.stroke();

          // Lower horizontal boom y = c
          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pad, yMap(c));
          ctx.lineTo(width - pad, yMap(c));
          ctx.stroke();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Woven sail area: ${area.toFixed(2)} m² (goal: 10.67 m²)`, pad + 12, pad + 18);
        } else if (sim.variant === 'work-hoist') {
          const H = vals.liftH ?? 5;
          const work = hoistWork(20, 2, H);
          const cliffX = width * 0.34;
          const groundY = height - pad;
          const topY = groundY - (H / 14) * (plotH * 0.85);

          // Limestone cliff tower
          ctx.fillStyle = isDusk ? '#3B362D' : '#D5C7AE';
          ctx.fillRect(pad, topY, cliffX - pad, groundY - topY);

          // Hanging braided rope + marble stone block
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cliffX + 26, topY);
          ctx.lineTo(cliffX + 26, groundY - 26);
          ctx.stroke();

          ctx.fillStyle = activeAccent;
          ctx.fillRect(cliffX + 10, groundY - 30, 32, 26);

          // Work effort bar on right
          const bx = width * 0.62;
          const bw = width * 0.28;
          const pct = Math.min(1, work / 450);
          ctx.fillStyle = pal.grid;
          ctx.fillRect(bx, height * 0.48, bw, 20);
          ctx.fillStyle = activeAccent;
          ctx.fillRect(bx, height * 0.48, bw * pct, 20);

          // 300 J goal tick
          const gx = bx + (300 / 450) * bw;
          ctx.strokeStyle = pal.gold;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(gx, height * 0.44);
          ctx.lineTo(gx, height * 0.48 + 26);
          ctx.stroke();

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Height: ${H.toFixed(1)} m · Work: ${Math.round(work)} J (goal: 300 J)`, bx, height * 0.4);
        } else {
          // Average value of wave 2 + 1.5 sin(pi x / 4) on [0, 4]
          const levelY = vals.levelY ?? 2.2;
          const xMap = (x: number) => pad + (x / 4) * plotW;
          const yMap = (y: number) => height - pad - (y / 4.2) * plotH;

          // Wave fill
          ctx.fillStyle = pal.sageFill;
          ctx.beginPath();
          ctx.moveTo(xMap(0), yMap(0));
          for (let i = 0; i <= 80; i++) {
            const x = (i / 80) * 4;
            const y = 2 + 1.5 * Math.sin((Math.PI * x) / 4);
            ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.lineTo(xMap(4), yMap(0));
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = pal.sage;
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) {
            const x = (i / 80) * 4;
            const y = 2 + 1.5 * Math.sin((Math.PI * x) / 4);
            if (i === 0) ctx.moveTo(xMap(x), yMap(y));
            else ctx.lineTo(xMap(x), yMap(y));
          }
          ctx.stroke();

          // Player's flattened water level line
          ctx.strokeStyle = activeAccent;
          ctx.lineWidth = 3;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(pad, yMap(levelY));
          ctx.lineTo(width - pad, yMap(levelY));
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = pal.ink;
          ctx.font = '600 13px "Atkinson Hyperlegible", sans-serif';
          ctx.fillText(`Calm water level: ${levelY.toFixed(2)} m`, pad + 12, pad + 18);
        }
      }

    };

    drawNowRef.current = () => paintScene(0);

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      paintScene(dt);
      timerId = window.setTimeout(() => {
        rafId = requestAnimationFrame(drawFrame);
      }, 33);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    rafId = requestAnimationFrame(drawFrame);
    return () => {
      drawNowRef.current = null;
      window.clearTimeout(timerId);
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  // Repaint instantaneously whenever sliders, quest, or circadian theme change
  useEffect(() => {
    drawNowRef.current?.();
  }, [quest, values, theme, eyeRestMode, showSymbolicOverlay]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        data-testid="calculus-stage-canvas"
        className="block h-full w-full"
        aria-label={`Interactive visual simulation for ${quest.title}`}
      />
    </div>
  );
}
