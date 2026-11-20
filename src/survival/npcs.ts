export type HairStyle = 'short' | 'long' | 'bald' | 'helmet' | 'hood' | 'curly';
export type Accessory = 'none' | 'staff' | 'spear' | 'scroll' | 'basket' | 'net' | 'torch' | 'map' | 'lantern';

export interface NpcLook {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  beard: 'none' | 'dark' | 'white';
  robe: string;
  robeDark: string;
  trim: string;
  accessory: Accessory;
  crest?: string;
}

export interface NpcDef {
  questionId: number;
  key: string;
  name: string;
  title: string;
  look: NpcLook;
  intro: string[];
  locked: string;
  done: string;
  success: string;
  failure: string;
}

const SKIN = { light: '#e8b48a', tan: '#c98d5e', deep: '#8d5a3b', pale: '#f0c9a4' };

export const NPCS: NpcDef[] = [
  // ── Chapter I · Unit 1: Pre-Calculus & Review ──
  {
    questionId: 1,
    key: 'thales',
    name: 'Thales',
    title: 'Coastal Navigator · Unit 1',
    look: { skin: SKIN.tan, hair: '#5b3a1e', hairStyle: 'curly', beard: 'dark', robe: '#6f9a4a', robeDark: '#4c6e31', trim: '#e0c477', accessory: 'basket' },
    intro: [
      'Welcome to the Lotus Coast. Before facing calculus, sharpen your Pre-Calculus instincts.',
      'Can you invert a rational current function to recover the original wind speed?',
    ],
    locked: 'The sea breeze is sweet today, is it not?',
    done: 'Sharp inversion! Seek Eryon further along the olive terrace.',
    success: 'Exact! Solving for x and swapping variables locks in the inverse function.',
    failure: 'Not quite—remember an inverse function undoes f(x), not the reciprocal 1/f(x).',
  },
  {
    questionId: 2,
    key: 'eryon',
    name: 'Eryon',
    title: 'Star-Chart Sailor · Unit 1',
    look: { skin: SKIN.light, hair: '#2b1a10', hairStyle: 'short', beard: 'none', robe: '#3f6f8e', robeDark: '#2a4d64', trim: '#d8af63', accessory: 'map' },
    intro: [
      'Captain, the astrolabe needs exact unit-circle bearings before twilight falls.',
      'Check both quadrant signs and reference angles to compute our heading.',
    ],
    locked: 'Speak with Thales on the beach first to calibrate our instruments.',
    done: 'Find Melion by the lotus huts for our exponential departure threshold.',
    success: 'Spot on! Both quadrant values are negative and combine cleanly.',
    failure: 'Watch the quadrant signs on the unit circle and review the worked steps.',
  },
  {
    questionId: 3,
    key: 'melion',
    name: 'Melion',
    title: 'Harbor Scholar · Unit 1',
    look: { skin: SKIN.deep, hair: '#1a1a1a', hairStyle: 'bald', beard: 'white', robe: '#9a4a8a', robeDark: '#6d2f61', trim: '#f0d48a', accessory: 'scroll' },
    intro: [
      'Lotus pollen grows exponentially each hour. Solve for the exact time before the threshold.',
      'Isolate the exponential term first, then apply the natural logarithm.',
    ],
    locked: 'Check in with Thales and Eryon first before setting sail.',
    done: 'Unit 1 Pre-Calculus is complete! Board your trireme at the dock.',
    success: 'Brilliant! Natural logarithms undo exponential growth cleanly.',
    failure: 'Isolate the exponential base before taking ln—review the worked solution!',
  },

  // ── Chapter II · Unit 2: Limits & Continuity ──
  {
    questionId: 4,
    key: 'nestor',
    name: 'Nestor',
    title: 'Cavern Scout · Unit 2',
    look: { skin: SKIN.light, hair: '#6b4426', hairStyle: 'short', beard: 'dark', robe: '#8a5a2f', robeDark: '#5e3c1e', trim: '#c9a25a', accessory: 'torch' },
    intro: [
      'Polyphemus has sealed the sea cave. We need limits to test whether the ridge connects smoothly.',
      'Compare both one-sided limits as x approaches 2 from the left and right.',
    ],
    locked: 'Stay low—the Cyclops is listening.',
    done: 'Both sides match! Damon awaits deeper inside with an asymptote challenge.',
    success: 'Exact! When left and right limits agree, the two-sided limit exists.',
    failure: 'Evaluate each piecewise branch separately near x = 2.',
  },
  {
    questionId: 5,
    key: 'damon',
    name: 'Damon',
    title: 'Lantern Keeper · Unit 2',
    look: { skin: SKIN.tan, hair: '#1f140c', hairStyle: 'hood', beard: 'none', robe: '#4d5a3a', robeDark: '#333d25', trim: '#a88a4f', accessory: 'lantern' },
    intro: [
      'As time grows without bound, the cavern smoke settles toward a horizontal asymptote.',
      'Divide by the dominant power of x to find the limit at infinity.',
    ],
    locked: 'Speak with Nestor near the cave entrance first.',
    done: 'Leandros stands near the boulder with our final continuity seal.',
    success: 'Well done! Leading terms govern rational limits at infinity.',
    failure: 'Compare the highest powers in numerator and denominator.',
  },
  {
    questionId: 6,
    key: 'leandros',
    name: 'Leandros',
    title: 'Escape Captain · Unit 2',
    look: { skin: SKIN.deep, hair: '#111111', hairStyle: 'helmet', beard: 'dark', robe: '#7a2e2e', robeDark: '#521c1c', trim: '#d8af63', accessory: 'spear', crest: '#c64f4f' },
    intro: [
      'One removable hole breaks our escape curve at x = 3.',
      'Factor, simplify, and choose k to restore full continuity!',
    ],
    locked: 'Help Nestor and Damon first before we roll the boulder.',
    done: 'The boulder has shifted! Head right to escape into the Aegean daylight.',
    success: 'Continuity restored! The boulder rolls clear of the cave mouth.',
    failure: 'Factor x^2 - 9 before substituting x = 3.',
  },

  // ── Chapter III · Unit 3: Derivatives ──
  {
    questionId: 7,
    key: 'phaedon',
    name: 'Phaedon',
    title: 'Wind Quartermaster · Unit 3',
    look: { skin: SKIN.light, hair: '#c9b18a', hairStyle: 'short', beard: 'white', robe: '#3a6d8f', robeDark: '#28506b', trim: '#f0e2bf', accessory: 'scroll' },
    intro: [
      'Welcome to Aeolus’s floating marble citadel! Here every gust obeys derivatives.',
      'Use the Quotient Rule to find the instantaneous slope of sail pressure at x = 3.',
    ],
    locked: 'Seek the quartermaster at the citadel gates first.',
    done: 'Clean differentiation! Lysander awaits across the cloud bridge.',
    success: 'Masterful Quotient Rule—low d-high minus high d-low over low squared!',
    failure: 'Double-check the subtraction sign in the Quotient Rule numerator.',
  },
  {
    questionId: 8,
    key: 'lysander',
    name: 'Lysander',
    title: 'Cloud Shipwright · Unit 3',
    look: { skin: SKIN.tan, hair: '#3a2414', hairStyle: 'curly', beard: 'dark', robe: '#9a6b3a', robeDark: '#6d4a26', trim: '#d8af63', accessory: 'net' },
    intro: [
      'Logarithmic swirls, exponential gusts, and arctangent shifts collide on these heights.',
      'Apply the Chain Rule and transcendental derivative rules to each term.',
    ],
    locked: 'Phaedon holds the first wind blueprint—talk to him first.',
    done: 'Lord Aeolus awaits by the upper temple for your Related Rates trial.',
    success: 'Precision calculus! Every Chain Rule factor is right in place.',
    failure: 'Check each inner derivative and recall d/dx[arctan(x)] = 1/(1 + x^2).',
  },
  {
    questionId: 9,
    key: 'aeolus',
    name: 'Aeolus',
    title: 'Keeper of the Winds · Unit 3',
    look: { skin: SKIN.pale, hair: '#e8eef2', hairStyle: 'long', beard: 'white', robe: '#5fa8c4', robeDark: '#3c7f99', trim: '#f1d49a', accessory: 'staff' },
    intro: [
      'My spherical wind-orb expands steadily as volume flows in.',
      'Differentiate implicitly with respect to time t to find how fast its radius grows!',
    ],
    locked: 'Prove your mastery to Phaedon and Lysander before approaching my throne.',
    done: 'My west winds fill your sails! Board the wind-ship to descend toward the Sirens.',
    success: '1 m/min! You linked volume rate and radius rate with implicit differentiation.',
    failure: 'Differentiate V = (4/3)pi r^3 with respect to t BEFORE plugging in r = 3.',
  },

  // ── Chapter IV · Unit 4: Applications of Derivatives ──
  {
    questionId: 10,
    key: 'calypso',
    name: 'Calypso',
    title: 'Reef Cartographer · Unit 4',
    look: { skin: SKIN.tan, hair: '#3b1e14', hairStyle: 'long', beard: 'none', robe: '#2e7d7b', robeDark: '#1c5452', trim: '#f1d49a', accessory: 'map' },
    intro: [
      'Welcome to the Sirens’ Strait! Hidden reef peaks and troughs shape these crystal waters.',
      'Use first and second derivatives to classify every local extremum.',
    ],
    locked: 'Listen carefully—begin with my reef chart first.',
    done: 'Extrema mapped! Helena waits past the sunken marble columns.',
    success: 'Exact! Negative concavity marks a peak; positive concavity marks a valley.',
    failure: 'Check the sign of f\'\'(x): concave down (< 0) is a local maximum.',
  },
  {
    questionId: 11,
    key: 'helena',
    name: 'Helena',
    title: 'Siren-Watcher · Unit 4',
    look: { skin: SKIN.pale, hair: '#8f5a2a', hairStyle: 'curly', beard: 'none', robe: '#7a4b8c', robeDark: '#522f61', trim: '#f1d49a', accessory: 'lantern' },
    intro: [
      'Without a calculator at sea, tangent lines let us approximate tricky roots in seconds.',
      'Anchor a linear approximation at a = 16 to estimate sqrt(16.8).',
    ],
    locked: 'Speak with Calypso first to chart the reef depths.',
    done: 'Circe stands near the amphitheater archway with an indeterminate limit.',
    success: '4.1—remarkably close to the exact value using only a tangent line!',
    failure: 'Use L(x) = f(16) + f\'(16)(x - 16) with f\'(x) = 1/(2 sqrt(x)).',
  },
  {
    questionId: 12,
    key: 'circe',
    name: 'Circe',
    title: 'Oracle of Limits · Unit 4',
    look: { skin: SKIN.light, hair: '#5a1e2e', hairStyle: 'hood', beard: 'none', robe: '#a3483b', robeDark: '#6e2c22', trim: '#f6d88b', accessory: 'staff' },
    intro: [
      'The Sirens’ interference creates an indeterminate 0/0 ratio as x approaches 0.',
      'Apply L’Hôpital’s Rule cleanly to uncover the true limiting value.',
    ],
    locked: 'Complete Calypso’s and Helena’s trials before challenging my oracle.',
    done: 'The Sirens’ Strait is cleared! Board your vessel for the storm passage.',
    success: 'Two crisp L’Hôpital steps reveal 2! You are ready for Integrals.',
    failure: 'Differentiate top and bottom separately—and check if 0/0 persists for a second pass.',
  },

  // ── Chapter V · Unit 5: Integrals ──
  {
    questionId: 13,
    key: 'orion',
    name: 'Orion',
    title: 'Storm Cartographer · Unit 5',
    look: { skin: SKIN.light, hair: '#4a3020', hairStyle: 'hood', beard: 'dark', robe: '#2f4a6b', robeDark: '#1f3349', trim: '#d8af63', accessory: 'map' },
    intro: [
      'Lightning splits the Scylla strait! Now we reverse differentiation to find total accumulation.',
      'Compute the general antiderivative of the tidal surge rate.',
    ],
    locked: 'Storms on every horizon—speak with me first, captain.',
    done: 'Solid antiderivative! Cassandra awaits beside the Charybdis lookout.',
    success: 'Exact! Differentiating your antiderivative brings back every term and sign.',
    failure: 'Check the sign of the cosine antiderivative and remember + C.',
  },
  {
    questionId: 14,
    key: 'cassandra',
    name: 'Cassandra',
    title: 'Vortex Seer · Unit 5',
    look: { skin: SKIN.pale, hair: '#8a2d2d', hairStyle: 'long', beard: 'none', robe: '#5a3a7a', robeDark: '#3e2756', trim: '#e0c477', accessory: 'staff' },
    intro: [
      'Charybdis twists functions inside functions. Ordinary power rules alone won’t untangle it.',
      'Choose a smart u-substitution to collapse the vortex integral!',
    ],
    locked: 'Find Orion along the storm rocks first.',
    done: 'Athena waits at the storm shrine with the Fundamental Theorem of Calculus.',
    success: 'Clean u-substitution! The Chain Rule in reverse breaks the vortex.',
    failure: 'Set u = x^2 + 1 and express 6x dx in terms of du = 2x dx.',
  },
  {
    questionId: 15,
    key: 'athena',
    name: 'Athena',
    title: 'Goddess of Wisdom · Unit 5',
    look: { skin: SKIN.pale, hair: '#3a2a1a', hairStyle: 'helmet', beard: 'none', robe: '#e8e0c8', robeDark: '#b9ad8c', trim: '#d8af63', accessory: 'spear', crest: '#2f8190' },
    intro: [
      'Behold the bridge linking derivatives and integrals: the Fundamental Theorem of Calculus.',
      'Differentiate an accumulation integral whose upper bound is x^2—don’t forget the Chain Rule!',
    ],
    locked: 'Solve Orion’s and Cassandra’s integral trials before meeting me.',
    done: 'The storm clears! Board your ship—Ithaca’s golden harbor awaits!',
    success: '20! You united FTC Part 1 and the Chain Rule like a master.',
    failure: 'Substitute t = x^2 into the integrand AND multiply by d/dx(x^2) = 2x.',
  },

  // ── Chapter VI · Unit 6: Applications of Integrals ──
  {
    questionId: 16,
    key: 'telemachus',
    name: 'Telemachus',
    title: 'Prince of Ithaca · Unit 6',
    look: { skin: SKIN.light, hair: '#3b2412', hairStyle: 'curly', beard: 'none', robe: '#3a6ea5', robeDark: '#23466d', trim: '#f1d49a', accessory: 'scroll' },
    intro: [
      'Father, welcome home to Ithaca’s golden harbor! Three final integral trials await.',
      'First, compute the exact area enclosed between the ridge parabola and the pier line.',
    ],
    locked: 'Meet me by the harbor steps first!',
    done: 'The harbor is surveyed! Visit Eumaeus up on the marble terrace.',
    success: '9/2 square units! Intersections first, then integrate top minus bottom.',
    failure: 'Find where 4x - x^2 = x intersects first (x = 0 and x = 3), then integrate (3x - x^2).',
  },
  {
    questionId: 17,
    key: 'eumaeus',
    name: 'Eumaeus',
    title: 'Royal Artisan · Unit 6',
    look: { skin: SKIN.tan, hair: '#7a756c', hairStyle: 'short', beard: 'white', robe: '#8c6239', robeDark: '#5e3f22', trim: '#e0c477', accessory: 'basket' },
    intro: [
      'To honor your return, we spin y = sqrt(x) around the x-axis to forge a royal amphora.',
      'Use the Disk Method to find the vessel’s exact volume.',
    ],
    locked: 'Speak with Prince Telemachus at the docks first.',
    done: 'Queen Penelope awaits at the Acropolis temple with your final trial!',
    success: '8 pi cubic units! Slicing into circular disks makes revolution effortless.',
    failure: 'Remember to square the radius R(x) = sqrt(x) and include the factor pi.',
  },
  {
    questionId: 18,
    key: 'penelope',
    name: 'Penelope',
    title: 'Queen of Ithaca · Unit 6',
    look: { skin: SKIN.pale, hair: '#2a1a12', hairStyle: 'long', beard: 'none', robe: '#b58938', robeDark: '#7a591e', trim: '#fff1c4', accessory: 'staff' },
    intro: [
      'One final challenge crowns your Calculus I Odyssey: drawing the great bow of Ithaca.',
      'Use Hooke’s Law and integration to compute the exact work in Joules.',
    ],
    locked: 'Greet Telemachus and Eumaeus on your way up to the Acropolis first.',
    done: 'Ithaca is yours! Every pillar of Calculus I stands mastered.',
    success: '20 Joules! The great bow sings—welcome home, Master of Calculus I!',
    failure: 'Solve for the stiffness constant k from F(0.5) = 20 first, then integrate kx from 0 to 1.',
  },
];

export const NPC_BY_QUESTION: Record<number, NpcDef> = Object.fromEntries(NPCS.map((n) => [n.questionId, n]));
