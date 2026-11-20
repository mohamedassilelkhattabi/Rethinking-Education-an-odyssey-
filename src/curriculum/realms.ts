import type { Realm, RealmId, StageArchetype, StageNumber } from './types';

export const STAGE_META: Record<
  StageNumber,
  { archetype: StageArchetype; label: string; shortLabel: string; pedagogyNote: string }
> = {
  1: {
    archetype: 'curiosity',
    label: 'Curiosity & Discovery',
    shortLabel: '1. Curiosity',
    pedagogyNote: 'Play with the world first — zero formulas, pure intuition.',
  },
  2: {
    archetype: 'manipulation',
    label: 'Embodied Manipulation',
    shortLabel: '2. Feel It',
    pedagogyNote: 'Shape waves, slopes, and tides directly with your hands.',
  },
  3: {
    archetype: 'symbolic',
    label: 'The Symbolic Bridge',
    shortLabel: '3. Symbols',
    pedagogyNote: 'Watch the equation emerge straight from the motion you mastered.',
  },
  4: {
    archetype: 'ai-transfer',
    label: 'Real-World Transfer',
    shortLabel: '4. Your World',
    pedagogyNote: 'Carry the exact same calculus into your own interests.',
  },
  5: {
    archetype: 'interleaved',
    label: 'Interleaved Voyage',
    shortLabel: '5. Combine',
    pedagogyNote: 'Blend tools across realms so you know when each insight fits.',
  },
  6: {
    archetype: 'boss-teachback',
    label: 'Harbor Trial & Teach-Back',
    shortLabel: '6. Teach Back',
    pedagogyNote: 'Calm the realm trial and guide a companion in your own words.',
  },
};

export const REALMS: Realm[] = [
  {
    id: 1,
    numeral: 'I',
    name: 'Aegean Foundations',
    subtitle: 'Sunlit Cove of Mirrors & Compasses',
    calculusUnit: 'Pre-Calculus & Functions',
    topics: ['Functions & Transformations', 'Inverse Mirrors', 'Unit Circle & Trig', 'Exponentials & Logarithms'],
    companion: { name: 'Lyra', role: 'Young Navigator' },
    mapPos: { x: 0.13, y: 0.66 },
    islandStyle: 'archipelago',
    archetypeHooks: {
      explorer: 'Uncharted mirrors and circular star-dials hide how every voyage maps forward and back.',
      achiever: 'Calibrate four core navigation instruments to lock in your Aegean sailing mastery.',
      socializer: 'Sail alongside Lyra and compare compass intuition with fellow navigators.',
      'free-spirit': 'Experiment freely with reflections, waves, and lantern growth at your own rhythm.',
      philanthropist: 'Help Lyra calibrate the coastal beacons so arriving fishers find calm water.',
    },
  },
  {
    id: 2,
    numeral: 'II',
    name: 'Horizon of Limits',
    subtitle: 'The Narrowing Strait of Approach',
    calculusUnit: 'Limits & Continuity',
    topics: ['Secant-to-Tangent', 'One-Sided Limits', 'Asymptotes & Infinity', 'Continuity & IVT'],
    companion: { name: 'Thales', role: 'Harbor Cartographer' },
    mapPos: { x: 0.28, y: 0.36 },
    islandStyle: 'strait',
    archetypeHooks: {
      explorer: 'See what happens at the razor-thin edge where a harbor rope stops crossing and barely kisses the wave.',
      achiever: 'Close the gap step by step until left and right tides agree with zero seams.',
      socializer: 'Trade observations with Thales on why approaching a harbor matters more than standing on a broken pier.',
      'free-spirit': 'Zoom in as close as you like—discover how smooth curves hide secret linearity up close.',
      philanthropist: 'Repair the tide-bridge continuity so caravans can cross without sudden drops.',
    },
  },
  {
    id: 3,
    numeral: 'III',
    name: 'Currents of Change',
    subtitle: 'Windward Channels of Instantaneous Motion',
    calculusUnit: 'Derivatives & Rates of Change',
    topics: ['Derivative Intuition', 'Power, Product & Quotient Rules', 'Chain Rule Gears', 'Implicit & Related Rates'],
    companion: { name: 'Nausicaa', role: 'Sailmaker & Helmswoman' },
    mapPos: { x: 0.45, y: 0.62 },
    islandStyle: 'currents',
    archetypeHooks: {
      explorer: 'Feel how every wave crest carries a hidden steepness—and how linked pulleys multiply motion.',
      achiever: 'Master instant slope, chained wind-gears, and expanding harbor ripples.',
      socializer: 'Work with Nausicaa to tune sail trim and share your rate-of-change mental models.',
      'free-spirit': 'Surf the rolling Aegean swells and bend curves to feel slope in real time.',
      philanthropist: 'Predict expanding lighthouse ripples in time to guide twilight boats safely ashore.',
    },
  },
  {
    id: 4,
    numeral: 'IV',
    name: 'Peaks of Olympus',
    subtitle: 'Cloud-Crowned Ridges of Balance & Optima',
    calculusUnit: 'Applications of Derivatives',
    topics: ['Critical Points & Extrema', 'Concavity & Inflection', 'Optimization', "L'Hôpital & Linear Approximation"],
    companion: { name: 'Kallisto', role: 'Terrace Architect' },
    mapPos: { x: 0.61, y: 0.31 },
    islandStyle: 'summit',
    archetypeHooks: {
      explorer: 'Climb where the slope goes perfectly flat—discovering summits, valleys, and bends in the ridge.',
      achiever: 'Optimize ancient stone walls and enclosures to capture the maximum possible space.',
      socializer: 'Sketch hillside curves with Kallisto and trade optimization shortcuts with peers.',
      'free-spirit': 'Reshape orchards, arches, and coastlines until every constraint balances effortlessly.',
      philanthropist: 'Design the most generous village orchard possible using the limited terrace stone available.',
    },
  },
  {
    id: 5,
    numeral: 'V',
    name: 'Tides of Accumulation',
    subtitle: 'The Golden Cisterns of Flowing Water',
    calculusUnit: 'Integrals & Accumulation',
    topics: ['Riemann Sums', 'Antiderivatives', 'Fundamental Theorem of Calculus', 'u-Substitution'],
    companion: { name: 'Philo', role: 'Aqueduct Keeper' },
    mapPos: { x: 0.76, y: 0.63 },
    islandStyle: 'lagoon',
    archetypeHooks: {
      explorer: 'Discover the mirror miracle: slicing flowing tides into tiny strips reverses the slope itself.',
      achiever: 'Pack tide slices finer and finer until approximate sums lock onto exact accumulation.',
      socializer: 'Unpack the Fundamental Theorem with Philo and celebrate how derivatives and integrals reunite.',
      'free-spirit': 'Watch water pour into translucent cisterns as you sculpt curves and slice widths live.',
      philanthropist: 'Measure the exact rainwater flowing off the hills so Ithaca’s summer cisterns never run dry.',
    },
  },
  {
    id: 6,
    numeral: 'VI',
    name: 'Architecture of Ithaca',
    subtitle: 'The Sunlit Harbor & Marble Homecoming',
    calculusUnit: 'Applications of Integrals',
    topics: ['Average Value', 'Area Between Curves', 'Volumes of Revolution', 'Work & Physical Effort'],
    companion: { name: 'Telemachus', role: 'Builder of Ithaca' },
    mapPos: { x: 0.89, y: 0.36 },
    islandStyle: 'citadel',
    archetypeHooks: {
      explorer: 'Spin 2D pottery silhouettes into 3D marble columns and weigh every lift of stone.',
      achiever: 'Complete the six-realm spiral and restore Ithaca’s harbor beacon in full precision.',
      socializer: 'Build alongside Telemachus and pass your clearest Calculus I wisdom to incoming voyagers.',
      'free-spirit': 'Sculpt vessels of revolution, sail banners between curves, and calm harbor waves.',
      philanthropist: 'Rebuild the lighthouse amphora and marble piers so every future traveler comes home safely.',
    },
  },
];

export function getRealm(id: RealmId): Realm {
  return REALMS.find((r) => r.id === id) ?? REALMS[0];
}
