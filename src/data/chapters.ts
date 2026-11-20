import type { Chapter } from '../game/types';

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    numeral: 'I',
    unitLabel: 'Unit 1: Pre-Calculus & Review',
    title: 'The Shores of the Lotus-Eaters',
    location: 'Lotus Coast',
    difficulty: 'Easy',
    focus: ['Functions & Inverse Functions', 'Trig & Unit Circle', 'Exponentials & Logarithms'],
    theme: 'lotus',
    intro: [
      'After days across the sunlit Aegean, Odysseus and his crew anchor beside terraced limestone cliffs draped in lotus blossoms.',
      'Before facing the calculus of motion and change ahead, your crew must sharpen their mathematical bearings.',
      'Invert functions, navigate the unit circle, and untangle exponential growth to break the island’s spell.',
    ],
    completion: [
      'Your bearings are true! The crew breaks free of the lotus haze and pushes off the golden beach.',
      'Ahead looms a jagged basalt headland where torchlight flickers inside a cavernous sea grotto.',
    ],
    questionIds: [1, 2, 3],
    completionEffect: { supplies: 3 },
    completionEffectText: '+3 supplies gathered from the Lotus Coast',
    badge: {
      name: 'Pre-Calculus Navigator',
      description: 'Mastered inverse functions, unit circle trigonometry, and exponential/logarithmic equations.',
      icon: 'trophy',
    },
  },
  {
    id: 2,
    numeral: 'II',
    unitLabel: 'Unit 2: Limits & Continuity',
    title: 'The Cavern of Polyphemus',
    location: 'Cyclops Cavern',
    difficulty: 'Easy',
    focus: ['Tangent Lines & One-Sided Limits', 'Limit Laws & Asymptotes', 'Continuity & IVT'],
    theme: 'cyclops',
    intro: [
      'Deep inside Polyphemus’s limestone sea cave, a colossal boulder seals the exit.',
      'To slip past the Cyclops, Odysseus must analyze what happens as quantities approach critical thresholds without breaking.',
      'Master one-sided limits, infinite behavior, and continuity to roll away the stone.',
    ],
    completion: [
      'With mathematical precision, the boulder grinds aside and Mediterranean sunlight floods the cavern.',
      'On the distant horizon floats a marble citadel suspended high above the cumulus clouds.',
    ],
    questionIds: [4, 5, 6],
    completionEffect: { elapsedTime: 4 },
    completionEffectText: 'Escaped the Cyclops cavern using limits and continuity',
    badge: {
      name: 'Limit Breaker',
      description: 'Evaluated one-sided limits, horizontal asymptotes, and continuity conditions.',
      icon: 'lock',
    },
  },
  {
    id: 3,
    numeral: 'III',
    unitLabel: 'Unit 3: Derivatives',
    title: 'The Floating Isle of Aeolus',
    location: 'Aeolus Citadel',
    difficulty: 'Medium',
    focus: ['Product & Quotient Rules', 'Chain Rule & Transcendentals', 'Implicit Diff. & Related Rates'],
    theme: 'aeolus',
    intro: [
      'High above the wine-dark sea, Aeolus’s sunlit marble colonnades drift among golden cloudbanks.',
      'Here the winds shift every instant. Only those who command instantaneous rates of change can harness the gale.',
      'Apply differentiation rules, the chain rule, and related rates to earn the Wind-Keeper’s favor.',
    ],
    completion: [
      'Aeolus binds the favorable west winds in a leather satchel and blesses your sails.',
      'Below, turquoise waters glisten around the marble arches of the Sirens’ Strait.',
    ],
    questionIds: [7, 8, 9],
    completionEffect: { supplies: 2 },
    completionEffectText: 'Harnessed instantaneous rates of change with Aeolus’s winds',
    badge: {
      name: 'Rate Master',
      description: 'Conquered differentiation rules, chain rule, and related rates.',
      icon: 'package',
    },
  },
  {
    id: 4,
    numeral: 'IV',
    unitLabel: 'Unit 4: Applications of Derivatives',
    title: 'The Sirens’ Strait',
    location: 'Sirens’ Strait',
    difficulty: 'Medium',
    focus: ['Critical Points & Concavity', 'MVT & Linear Approximation', 'Optimization & L’Hôpital’s Rule'],
    theme: 'sirens',
    intro: [
      'Through shimmering sea mist rise sunken marble amphitheaters where the Sirens’ melodies echo across the reefs.',
      'To steer the optimal heading without drifting onto the rocks, Odysseus must find peaks, valleys, and tangent approximations.',
      'Use derivative tests, linear approximation, and L’Hôpital’s Rule to chart the safest path.',
    ],
    completion: [
      'The Sirens’ song fades astern as your ship holds the exact optimal trajectory.',
      'Storm clouds gather ahead—between towering cliffs and a roaring whirlpool wait Scylla and Charybdis.',
    ],
    questionIds: [10, 11, 12],
    completionEffect: { elapsedTime: 3 },
    completionEffectText: 'Navigated extrema, concavity, and L’Hôpital’s Rule past the Sirens',
    badge: {
      name: 'Extremum Strategist',
      description: 'Applied derivative tests, linear approximations, optimization, and L’Hôpital’s Rule.',
      icon: 'compass',
    },
  },
  {
    id: 5,
    numeral: 'V',
    unitLabel: 'Unit 5: Integrals',
    title: 'The Straits of Scylla & Charybdis',
    location: 'Scylla & Charybdis',
    difficulty: 'Hard',
    focus: ['Antiderivatives & Indefinite Integrals', 'u-Substitution', 'Riemann Sums & FTC'],
    theme: 'passage',
    intro: [
      'Lightning splits the sky above basalt sea-cliffs while Charybdis churns the strait into a foaming vortex.',
      'Now you must reverse differentiation—accumulating total distance, area, and momentum across turbulent waters.',
      'Master antiderivatives, u-substitution, and the Fundamental Theorem of Calculus to survive the strait.',
    ],
    completion: [
      'The tempest breaks! Behind your stern, the whirlpool subsides into calm twilight swells.',
      'Ahead in golden morning light rise the terraced cypress cliffs and marble palace of Ithaca.',
    ],
    questionIds: [13, 14, 15],
    completionEffect: { supplies: 2 },
    completionEffectText: 'Accumulated total change through the Fundamental Theorem of Calculus',
    badge: {
      name: 'Integral Voyager',
      description: 'Mastered antiderivatives, u-substitution, and the Fundamental Theorem of Calculus.',
      icon: 'compass',
    },
  },
  {
    id: 6,
    numeral: 'VI',
    unitLabel: 'Unit 6: Applications of Integrals',
    title: 'The Golden Harbor of Ithaca',
    location: 'Ithaca Harbor',
    difficulty: 'Hard',
    focus: ['Area Between Curves & Avg Value', 'Volumes of Revolution', 'Work & Hooke’s Law'],
    theme: 'ithaca',
    intro: [
      'At last, the sunlit cliffs, olive terraces, and golden acropolis of Ithaca gleam above the harbor.',
      'Three final trials await at the palace gates: measure enclosed areas, revolve solid vessels, and calculate the work to string Odysseus’s great bow.',
      'Complete Unit 6 to claim your homecoming as a Calculus I Master.',
    ],
    completion: [
      'The great bow sings true and the harbor bells ring out across the golden Aegean.',
      'Odysseus stands home in Ithaca—every limit, derivative, and integral conquered.',
    ],
    questionIds: [16, 17, 18],
    completionEffect: {},
    completionEffectText: 'Calculus I mastery complete — Ithaca reached!',
    badge: {
      name: 'Sovereign of Ithaca',
      description: 'Solved areas between curves, volumes of revolution, and physical work integrals.',
      icon: 'trophy',
    },
  },
];

export const TOTAL_CHAPTERS = CHAPTERS.length;

export function getChapter(id: number): Chapter {
  const c = CHAPTERS.find((ch) => ch.id === id);
  if (!c) throw new Error(`Unknown chapter ${id}`);
  return c;
}

/** Map locations, in voyage order. Index 0 = Troy, 1..6 = chapters, 7 = Ithaca Crown. */
export const LOCATIONS = [
  { name: 'Troy', chapterId: null as number | null },
  { name: 'Lotus Coast', chapterId: 1 },
  { name: 'Cyclops Cavern', chapterId: 2 },
  { name: 'Aeolus Citadel', chapterId: 3 },
  { name: 'Sirens’ Strait', chapterId: 4 },
  { name: 'Scylla & Charybdis', chapterId: 5 },
  { name: 'Ithaca Harbor', chapterId: 6 },
  { name: 'Palace of Ithaca', chapterId: null as number | null },
];

export const OPENING_NARRATION = [
  'Ten years have passed since the fall of Troy.',
  'Odysseus sails homeward across the Mediterranean, navigating six legendary realms.',
  'Every cliff, current, and citadel hides a law of change waiting to be decoded.',
  'From Pre-Calculus bearings to Limits, Derivatives, and Integrals—wisdom is your compass.',
  'Master Calculus I across six voyages to return home to Ithaca.',
];

export const VICTORY_NARRATION = [
  'After six legendary voyages across the Aegean, Odysseus has returned home to Ithaca.',
  'From Pre-Calculus functions and limits to derivatives, optimization, and integrals, mathematical insight guided every turn.',
  'You have mastered the core pillars of Calculus I.',
];
