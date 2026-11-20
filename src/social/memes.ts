export interface StudyMeme {
  id: string;
  title: string;
  tag: string;
  dataUrl: string;
}

function makeMemeSvg(bg1: string, bg2: string, accent: string, topText: string, mathText: string, bottomText: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200" viewBox="0 0 360 200">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="360" height="200" rx="14" fill="url(#g)"/>
    <rect x="10" y="10" width="340" height="180" rx="10" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="2"/>
    <text x="180" y="46" text-anchor="middle" fill="#f7eed8" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="16">${esc(topText)}</text>
    <rect x="34" y="66" width="292" height="62" rx="10" fill="#0b1220" fill-opacity="0.72" stroke="${accent}" stroke-opacity="0.6"/>
    <text x="180" y="104" text-anchor="middle" fill="${accent}" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="22">${esc(mathText)}</text>
    <text x="180" y="164" text-anchor="middle" fill="#d9e6f2" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="14">${esc(bottomText)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const STUDY_MEMES: StudyMeme[] = [
  {
    id: 'plus-c',
    title: 'Never Forget + C',
    tag: 'Integrals',
    dataUrl: makeMemeSvg('#182848', '#2a4d69', '#f1d49a', 'FINISHED THE INTEGRAL IN 10s', '∫ 3x² dx = x³  (+ C?!)', 'WHEN YOU ALMOST FORGOT + C'),
  },
  {
    id: 'chain-rule',
    title: 'Chain Rule Layers',
    tag: 'Derivatives',
    dataUrl: makeMemeSvg('#261736', '#4a235a', '#5fb8c4', 'OUTER DERIVATIVE DONE', 'd/dx [f(g(x))] = f\'(g(x)) · g\'(x)', 'DON\'T FORGET THE INNER g\'(x)!'),
  },
  {
    id: 'lhopital',
    title: '0/0 Emergency Rescue',
    tag: 'L\'Hôpital',
    dataUrl: makeMemeSvg('#172d28', '#285943', '#7ee08a', 'PLUGGED IN x AND GOT 0/0', 'lim f(x)/g(x) = lim f\'(x)/g\'(x)', 'L\'HÔPITAL ENTERED THE CHAT'),
  },
  {
    id: 'related-rates',
    title: 'Related Rates Speedrun',
    tag: 'Related Rates',
    dataUrl: makeMemeSvg('#3b1818', '#6b2737', '#ffb347', 'EVERYTHING IS CHANGING AT ONCE', '2x(dx/dt) + 2y(dy/dt) = 0', 'DIFFERENTIATE W.R.T. TIME t'),
  },
  {
    id: 'u-sub',
    title: 'u-Sub Click Moment',
    tag: 'Integrals',
    dataUrl: makeMemeSvg('#102542', '#1d4e89', '#7bdff2', 'WHEN du CANCELS CLEANLY', 'u = x² + 1   →   du = 2x dx', 'PURE CALCULUS SEROTONIN'),
  },
  {
    id: 'ftc',
    title: 'FTC Boss Fight',
    tag: 'FTC',
    dataUrl: makeMemeSvg('#2c1d0f', '#5c3c1e', '#f1d49a', 'AREA UNDER THE CURVE', '∫[a→b] f(x)dx = F(b) - F(a)', 'SLOPES & AREAS ARE INVERSES'),
  },
];
