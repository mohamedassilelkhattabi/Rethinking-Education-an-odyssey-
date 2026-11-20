import { useEffect, useRef } from 'react';
import { REALMS } from '../curriculum/realms';
import type { RealmId } from '../curriculum/types';
import type { AmbientCurrentEvent } from '../engine/retentionEngine';

interface MediterraneanMapCanvasProps {
  theme: 'daylight' | 'dusk';
  eyeRestMode: boolean;
  selectedRealmId: RealmId;
  unlockedRealms: Record<RealmId, boolean>;
  realmMastery: Record<RealmId, number>;
  ambientCurrent: AmbientCurrentEvent | null;
  onSelectRealm: (id: RealmId) => void;
  showLabels?: boolean;
}

/**
 * Serene, painterly-realistic 60 FPS Mediterranean Archipelago Canvas.
 * Matches Warm Aegean Parchment (daylight) and Amber Dusk Sanctuary (evening).
 */
export function MediterraneanMapCanvas({
  theme,
  eyeRestMode,
  selectedRealmId,
  unlockedRealms,
  realmMastery,
  ambientCurrent,
  onSelectRealm,
  showLabels = true,
}: MediterraneanMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({
    theme,
    eyeRestMode,
    selectedRealmId,
    unlockedRealms,
    realmMastery,
    ambientCurrent,
    onSelectRealm,
  });
  propsRef.current = {
    theme,
    eyeRestMode,
    selectedRealmId,
    unlockedRealms,
    realmMastery,
    ambientCurrent,
    onSelectRealm,
  };

  // Smooth ship coordinates in normalized 0..1 map space
  const shipPosRef = useRef({ x: REALMS[0].mapPos.x, y: REALMS[0].mapPos.y, angle: 0 });
  const hoverRealmRef = useRef<RealmId | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(300, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let rafId = 0;
    let timerId = 0;
    let time = 0;
    let lastTs = performance.now();

    const scheduleNext = () => {
      timerId = window.setTimeout(() => {
        rafId = requestAnimationFrame(render);
      }, 33);
    };

    const drawIsland = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      style: string,
      isDusk: boolean,
      unlocked: boolean,
      mastery: number,
      isSelected: boolean,
      isHovered: boolean,
      t: number,
    ) => {
      ctx.save();

      // Shallow turquoise coastal shoal halo around island
      const shoal = ctx.createRadialGradient(cx, cy + 4, rx * 0.45, cx, cy + 4, rx * 1.65);
      if (isDusk) {
        shoal.addColorStop(0, 'rgba(110, 158, 139, 0.24)');
        shoal.addColorStop(0.55, 'rgba(110, 158, 139, 0.08)');
        shoal.addColorStop(1, 'rgba(26, 25, 22, 0)');
      } else {
        shoal.addColorStop(0, 'rgba(72, 148, 136, 0.32)');
        shoal.addColorStop(0.55, 'rgba(118, 174, 162, 0.14)');
        shoal.addColorStop(1, 'rgba(196, 214, 206, 0)');
      }
      ctx.fillStyle = shoal;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5, rx * 1.65, ry * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Selection / hover golden compass ring
      if (isSelected || isHovered) {
        ctx.strokeStyle = isDusk ? 'rgba(217, 155, 67, 0.8)' : 'rgba(196, 132, 45, 0.85)';
        ctx.lineWidth = isSelected ? 2.2 : 1.4;
        ctx.setLineDash(isSelected ? [] : [4, 4]);
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, rx * 1.28, ry * 1.22, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Sandy limestone beach rim
      ctx.fillStyle = isDusk ? '#463E32' : '#E7D8B9';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, rx * 1.05, ry * 0.96, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sculpted island terrain body
      const landGrad = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
      if (isDusk) {
        landGrad.addColorStop(0, unlocked ? '#565242' : '#37342D');
        landGrad.addColorStop(1, unlocked ? '#312E26' : '#25231E');
      } else {
        landGrad.addColorStop(0, unlocked ? '#C9C4A3' : '#C7C1B2');
        landGrad.addColorStop(0.55, unlocked ? '#99A57E' : '#AFA896');
        landGrad.addColorStop(1, unlocked ? '#7A8968' : '#8F8A7C');
      }
      ctx.fillStyle = landGrad;
      ctx.beginPath();
      ctx.moveTo(cx - rx, cy + 2);
      ctx.bezierCurveTo(cx - rx * 0.9, cy - ry * 0.95, cx - rx * 0.1, cy - ry * 1.15, cx + rx * 0.15, cy - ry * 0.9);
      ctx.bezierCurveTo(cx + rx * 0.65, cy - ry * 0.98, cx + rx * 1.04, cy - ry * 0.2, cx + rx * 0.96, cy + ry * 0.42);
      ctx.bezierCurveTo(cx + rx * 0.6, cy + ry * 0.98, cx - rx * 0.65, cy + ry * 0.92, cx - rx, cy + 2);
      ctx.closePath();
      ctx.fill();

      // Sunlit cliff ridge crest
      ctx.fillStyle = isDusk ? 'rgba(217, 155, 67, 0.14)' : 'rgba(245, 239, 226, 0.52)';
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.48, cy - ry * 0.12);
      ctx.quadraticCurveTo(cx - rx * 0.08, cy - ry * 0.85, cx + rx * 0.36, cy - ry * 0.22);
      ctx.quadraticCurveTo(cx, cy - ry * 0.12, cx - rx * 0.48, cy - ry * 0.12);
      ctx.fill();

      // Subtle classical landmark silhouette (Doric temple, lighthouse, summit arch)
      const lx = cx + rx * 0.02;
      const ly = cy - ry * 0.42;
      ctx.fillStyle = isDusk ? '#D8CBB3' : '#F4ECE0';
      ctx.strokeStyle = isDusk ? 'rgba(26,25,22,0.65)' : 'rgba(94,91,82,0.45)';
      ctx.lineWidth = 1;

      if (style === 'citadel' || style === 'summit' || style === 'archipelago') {
        // Miniature Doric temple
        ctx.fillRect(lx - 13, ly - 2, 26, 4);
        for (let c = -9; c <= 9; c += 6) {
          ctx.fillRect(lx + c - 1.2, ly - 12, 2.4, 10);
        }
        ctx.beginPath();
        ctx.moveTo(lx - 15, ly - 12);
        ctx.lineTo(lx, ly - 20);
        ctx.lineTo(lx + 15, ly - 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Ancient harbor lighthouse beacon
        ctx.beginPath();
        ctx.moveTo(lx - 5, ly + 2);
        ctx.lineTo(lx - 3, ly - 18);
        ctx.lineTo(lx + 3, ly - 18);
        ctx.lineTo(lx + 5, ly + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Warm lantern beacon glow (stronger in Dusk mode and as mastery increases)
      if (unlocked) {
        const glowRadius = (isDusk ? 26 : 16) + mastery * 16 + Math.sin(t * 2.1 + cx) * 2;
        const lantern = ctx.createRadialGradient(lx, ly - 15, 1, lx, ly - 15, glowRadius);
        const peakAlpha = isDusk ? 0.55 + mastery * 0.28 : 0.28 + mastery * 0.28;
        lantern.addColorStop(0, `rgba(217, 155, 67, ${peakAlpha})`);
        lantern.addColorStop(0.5, `rgba(217, 155, 67, ${peakAlpha * 0.3})`);
        lantern.addColorStop(1, 'rgba(217, 155, 67, 0)');
        ctx.fillStyle = lantern;
        ctx.beginPath();
        ctx.arc(lx, ly - 15, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Crisp lantern dot
        ctx.fillStyle = isDusk ? '#F4C97A' : '#C4842D';
        ctx.beginPath();
        ctx.arc(lx, ly - 15, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6 tiny spiral mastery pearls curving gently beneath the island
      const doneStages = Math.round(mastery * 6);
      for (let s = 0; s < 6; s++) {
        const ang = Math.PI * 0.22 + (s / 5) * Math.PI * 0.56;
        const px = cx - Math.cos(ang) * (rx * 0.85);
        const py = cy + ry * 0.92 + Math.sin(ang) * 9;
        ctx.beginPath();
        ctx.arc(px, py, 3.1, 0, Math.PI * 2);
        if (s < doneStages) {
          ctx.fillStyle = isDusk ? '#D99B43' : '#C4842D';
          ctx.fill();
        } else {
          ctx.fillStyle = isDusk ? 'rgba(230,220,200,0.16)' : 'rgba(43,42,39,0.16)';
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const drawTrireme = (x: number, y: number, isDusk: boolean, bob: number) => {
      ctx.save();
      ctx.translate(x, y + bob);

      // Gentle V-wake ripples behind ship
      ctx.strokeStyle = isDusk ? 'rgba(230, 220, 200, 0.22)' : 'rgba(250, 246, 236, 0.55)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-12, 7);
      ctx.quadraticCurveTo(-24, 11, -34, 6);
      ctx.moveTo(-10, 9);
      ctx.quadraticCurveTo(-20, 14, -29, 13);
      ctx.stroke();

      // Cedar hull
      ctx.fillStyle = isDusk ? '#8C6239' : '#6F4A28';
      ctx.beginPath();
      ctx.moveTo(-16, 4);
      ctx.quadraticCurveTo(0, 11, 18, 4);
      ctx.lineTo(14, 0);
      ctx.lineTo(-14, 0);
      ctx.closePath();
      ctx.fill();

      // Billowing warm parchment sail
      ctx.fillStyle = isDusk ? '#E6DCC8' : '#FAF6EC';
      ctx.strokeStyle = isDusk ? '#A89E8B' : '#8A7E6B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, -19);
      ctx.quadraticCurveTo(8, -10, 4, 0);
      ctx.lineTo(-9, 0);
      ctx.quadraticCurveTo(-5, -10, -4, -19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ochre gold emblem on sail
      ctx.fillStyle = isDusk ? '#D99B43' : '#C4842D';
      ctx.beginPath();
      ctx.arc(-1, -9, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const {
        theme: activeTheme,
        eyeRestMode: calm,
        selectedRealmId: selId,
        unlockedRealms: unlocked,
        realmMastery: masteryMap,
        ambientCurrent: ambient,
      } = propsRef.current;

      if (!calm) {
        time += dt;
      }

      const isDusk = activeTheme === 'dusk';

      // 1. Atmospheric Mediterranean sea gradient (warm parchment-sage daylight vs obsidian-umber dusk)
      const seaGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isDusk) {
        seaGrad.addColorStop(0, '#1D1E1C');
        seaGrad.addColorStop(0.35, '#212624');
        seaGrad.addColorStop(0.75, '#1B2120');
        seaGrad.addColorStop(1, '#171917');
      } else {
        seaGrad.addColorStop(0, '#EFE6D2');
        seaGrad.addColorStop(0.22, '#DCE5DB');
        seaGrad.addColorStop(0.58, '#C1D7D1');
        seaGrad.addColorStop(1, '#AFCAC4');
      }
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Soft golden-hour sun / crescent moon atmospheric wash in upper sky-horizon
      const sunX = width * 0.78;
      const sunY = height * 0.14;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, Math.max(width, height) * 0.36);
      if (isDusk) {
        sunGlow.addColorStop(0, 'rgba(217, 155, 67, 0.22)');
        sunGlow.addColorStop(0.45, 'rgba(217, 155, 67, 0.06)');
        sunGlow.addColorStop(1, 'rgba(26, 25, 22, 0)');
      } else {
        sunGlow.addColorStop(0, 'rgba(245, 224, 178, 0.65)');
        sunGlow.addColorStop(0.45, 'rgba(235, 214, 174, 0.22)');
        sunGlow.addColorStop(1, 'rgba(245, 239, 226, 0)');
      }
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Subtle ancient cartographic compass rose & rhumb lines
      const roseX = width * 0.09;
      const roseY = height * 0.22;
      ctx.save();
      ctx.strokeStyle = isDusk ? 'rgba(230, 220, 200, 0.06)' : 'rgba(43, 42, 39, 0.07)';
      ctx.lineWidth = 1;
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(roseX, roseY);
        ctx.lineTo(roseX + Math.cos(ang) * width * 0.9, roseY + Math.sin(ang) * width * 0.9);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(roseX, roseY, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 4. Gentle multi-layer Mediterranean water ripples
      ctx.save();
      ctx.strokeStyle = isDusk ? 'rgba(110, 158, 139, 0.12)' : 'rgba(250, 246, 236, 0.42)';
      ctx.lineWidth = 1.25;
      const rows = 9;
      for (let r = 0; r < rows; r++) {
        const baseY = height * (0.16 + (r / rows) * 0.8);
        const speed = (r % 2 === 0 ? 1 : -0.7) * 14;
        for (let k = 0; k < 5; k++) {
          const sx = ((k * width * 0.24 + r * 73 + time * speed) % (width + 140)) - 70;
          ctx.beginPath();
          ctx.moveTo(sx, baseY);
          ctx.quadraticCurveTo(sx + 26, baseY - 3, sx + 52, baseY);
          ctx.quadraticCurveTo(sx + 78, baseY + 3, sx + 104, baseY);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 5. Dotted cartographic voyage lanes connecting Realms I -> VI
      ctx.save();
      for (let i = 0; i < REALMS.length - 1; i++) {
        const a = REALMS[i];
        const b = REALMS[i + 1];
        const ax = a.mapPos.x * width;
        const ay = a.mapPos.y * height;
        const bx = b.mapPos.x * width;
        const by = b.mapPos.y * height;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2 + (i % 2 === 0 ? -36 : 36);

        const nextUnlocked = unlocked[b.id];
        ctx.strokeStyle = nextUnlocked
          ? isDusk
            ? 'rgba(217, 155, 67, 0.52)'
            : 'rgba(46, 111, 101, 0.48)'
          : isDusk
            ? 'rgba(230, 220, 200, 0.16)'
            : 'rgba(94, 91, 82, 0.22)';
        ctx.lineWidth = nextUnlocked ? 2.2 : 1.5;
        ctx.setLineDash([6, 7]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(mx, my, bx, by);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // 6. Silent HLR Ambient Sea Current ring (gentle shimmering ripple around realm nearing forgetting threshold)
      if (ambient) {
        const ambRealm = REALMS.find((r) => r.id === ambient.realmId);
        if (ambRealm) {
          const ax = ambRealm.mapPos.x * width;
          const ay = ambRealm.mapPos.y * height;
          const pulse = calm ? 0.5 : (Math.sin(time * 2.2) + 1) / 2;
          ctx.save();
          ctx.strokeStyle = isDusk
            ? `rgba(110, 158, 139, ${0.32 + pulse * 0.28})`
            : `rgba(46, 111, 101, ${0.35 + pulse * 0.25})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(ax, ay + 2, 62 + pulse * 10, 42 + pulse * 6, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 7. Draw all 6 Mediterranean Realm islands
      const scale = Math.max(0.76, Math.min(1.18, width / 1180));
      for (const realm of REALMS) {
        const cx = realm.mapPos.x * width;
        const cy = realm.mapPos.y * height;
        drawIsland(
          cx,
          cy,
          44 * scale,
          27 * scale,
          realm.islandStyle,
          isDusk,
          Boolean(unlocked[realm.id]),
          masteryMap[realm.id] ?? 0,
          realm.id === selId,
          realm.id === hoverRealmRef.current,
          time,
        );
      }

      // 8. Smoothly interpolate the player's trireme toward the active realm
      const targetRealm = REALMS.find((r) => r.id === selId) ?? REALMS[0];
      const targetX = targetRealm.mapPos.x;
      const targetY = targetRealm.mapPos.y;
      const ship = shipPosRef.current;
      const damp = calm ? 1 : 1 - Math.exp(-dt * 4.5);
      ship.x += (targetX - ship.x) * damp;
      ship.y += (targetY - ship.y) * damp;

      const shipPx = ship.x * width - 52 * scale;
      const shipPy = ship.y * height + 24 * scale;
      const bob = calm ? 0 : Math.sin(time * 2.6) * 2.4;
      drawTrireme(shipPx, shipPy, isDusk, bob);

      scheduleNext();
    };

    rafId = requestAnimationFrame(render);

    const hitTestRealm = (clientX: number, clientY: number): RealmId | null => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      for (const realm of REALMS) {
        const rx = realm.mapPos.x * rect.width;
        const ry = realm.mapPos.y * rect.height;
        const dist = Math.hypot(x - rx, y - ry);
        if (dist <= 64) return realm.id;
      }
      return null;
    };

    const handleMove = (e: PointerEvent) => {
      const hit = hitTestRealm(e.clientX, e.clientY);
      hoverRealmRef.current = hit;
      canvas.style.cursor = hit ? 'pointer' : 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const hit = hitTestRealm(e.clientX, e.clientY);
      if (hit) propsRef.current.onSelectRealm(hit);
    };

    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.clearTimeout(timerId);
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        data-testid="mediterranean-map-canvas"
        className="block h-full w-full"
        aria-label="Interactive Mediterranean Voyage Map showing six Calculus I Realms"
      />
      {/* Accessible interactive realm labels positioned cleanly beneath each island */}
      {showLabels && (
        <div className="pointer-events-none absolute inset-0">
          {REALMS.map((realm) => {
            const isSelected = realm.id === selectedRealmId;
            const unlocked = unlockedRealms[realm.id];
            const doneCount = Math.round((realmMastery[realm.id] ?? 0) * 6);
            return (
              <button
                key={realm.id}
                type="button"
                onClick={() => onSelectRealm(realm.id)}
                style={{
                  left: `${realm.mapPos.x * 100}%`,
                  top: `${realm.mapPos.y * 100}%`,
                }}
                className={`pointer-events-auto absolute -translate-x-1/2 translate-y-10 rounded-lg border px-2.5 py-1 text-center transition-transform duration-150 focus-visible:ring-2 ${
                  isSelected
                    ? 'scale-105 border-[var(--accent-gold)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-md'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)]/95 text-[var(--text-primary)] hover:scale-105'
                } ${!unlocked ? 'opacity-85' : ''}`}
                aria-pressed={isSelected}
                aria-label={`Realm ${realm.numeral}: ${realm.name} (${doneCount} of 6 quests discovered)`}
              >
                <span className="font-display block whitespace-nowrap text-sm font-bold leading-tight">
                  {realm.numeral}. {realm.name}
                </span>
                <span className="block whitespace-nowrap text-[11px] tabular-nums text-[var(--text-secondary)]">
                  {unlocked ? `${doneCount}/6 stages` : 'Chart prior realm'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
