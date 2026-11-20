// Tiny synthesized sound effects (Web Audio) — no audio files needed.

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

function audio(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, slideTo?: number) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(start: number, dur: number, gain = 0.15, cutoff = 600) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  jump: () => tone(320, 0, 0.12, 'square', 0.025, 520),
  step: () => noise(0, 0.05, 0.035, 900),
  pickup: () => {
    tone(880, 0, 0.08, 'square', 0.03);
    tone(1320, 0.06, 0.1, 'square', 0.03);
  },
  eat: () => {
    noise(0, 0.08, 0.06, 1400);
    noise(0.1, 0.08, 0.05, 1200);
  },
  damage: () => {
    tone(200, 0, 0.18, 'sawtooth', 0.05, 90);
    noise(0, 0.15, 0.08, 700);
  },
  talk: () => tone(540, 0, 0.05, 'triangle', 0.035),
  death: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.22, 0.45, 'triangle', 0.06));
    noise(0.2, 1.4, 0.12, 300);
  },
  click: () => tone(660, 0, 0.08, 'triangle', 0.05),
  select: () => tone(520, 0, 0.12, 'sine', 0.07, 780),
  hint: () => {
    tone(880, 0, 0.3, 'sine', 0.05);
    tone(1320, 0.08, 0.35, 'sine', 0.04);
  },
  invalid: () => tone(180, 0, 0.18, 'square', 0.04, 120),
  correct: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.45, 'triangle', 0.08));
  },
  fail: () => {
    noise(0, 1.4, 0.22, 400);
    tone(220, 0.05, 0.9, 'sawtooth', 0.05, 70);
  },
  chapter: () => {
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.11, 0.7, 'triangle', 0.07));
  },
  victory: () => {
    [261.63, 329.63, 392, 523.25].forEach((f) => tone(f, 0, 2.2, 'sine', 0.05));
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => tone(f, 0.3 + i * 0.14, 0.9, 'triangle', 0.06));
  },
};
