import type { Question } from '../../game/types';

// ═════════════════════════════════════════════════════════════
// CHAPTER I — THE ISLAND OF THE LOTUS-EATERS
// ═════════════════════════════════════════════════════════════

const q1: Question = {
  id: 1,
  chapterId: 1,
  kind: 'choice',
  visual: 'cards',
  title: 'The Food Gathering',
  story: [
    'Your crew has gone days without a proper meal. Three possible food-gathering strategies are available.',
    'You must choose the strategy that provides the greatest amount of food.',
  ],
  objectiveText: 'Maximize food portions.',
  objective: { sense: 'maximize', metric: { kind: 'attribute', key: 'portions' }, label: 'food portions', unit: 'portions' },
  attributes: [{ key: 'portions', label: 'Food', unit: 'portions', icon: 'wheat' }],
  constraints: [],
  options: [
    { id: 'A', label: 'Gather Berries', description: 'Comb the thickets along the shore for wild berries.', icon: 'berries', attributes: { portions: 12 } },
    { id: 'B', label: 'Catch Fish', description: 'Cast nets into the calm lagoon at dawn.', icon: 'fish', attributes: { portions: 20 } },
    { id: 'C', label: 'Harvest Roots', description: 'Dig for wild roots in the island meadows.', icon: 'roots', attributes: { portions: 16 } },
  ],
  lesson: {
    explanation:
      'Fishing provides 20 portions, the highest available amount. This is a maximization problem because the goal is to select the largest possible value.',
    hint: 'Look for the option producing the greatest quantity of food.',
    principle: 'Maximization: when the objective is “as much as possible,” compare every option’s value and choose the largest.',
    nextTime: 'Identify the quantity you are optimizing, then line up every option’s value side by side before choosing.',
  },
};

const q2: Question = {
  id: 2,
  chapterId: 1,
  kind: 'choice',
  visual: 'trails',
  title: 'The Race to the Ship',
  story: [
    'Several sailors have eaten the lotus fruit and begun forgetting their homeland.',
    'Odysseus must guide them back to the ship before the enchantment spreads.',
  ],
  objectiveText: 'Minimize travel time.',
  objective: { sense: 'minimize', metric: { kind: 'attribute', key: 'minutes' }, label: 'travel time', unit: 'minutes' },
  attributes: [{ key: 'minutes', label: 'Travel time', unit: 'minutes', icon: 'clock' }],
  constraints: [],
  options: [
    { id: 'A', label: 'Forest Trail', description: 'A shaded path winding through the lotus groves.', icon: 'forest', attributes: { minutes: 15 } },
    { id: 'B', label: 'Coastal Trail', description: 'A sandy path that hugs the shoreline.', icon: 'coast', attributes: { minutes: 10 } },
    { id: 'C', label: 'Mountain Trail', description: 'A steep climb over the island’s rocky spine.', icon: 'mountain', attributes: { minutes: 18 } },
  ],
  lesson: {
    explanation: 'The Coastal Trail requires only ten minutes. Since the objective is to minimize time, this is the optimal route.',
    hint: 'When minimizing a quantity, smaller values are better.',
    principle: 'Minimization: when the objective is “as little as possible,” the smallest value is optimal.',
    nextTime: 'Read the objective carefully — “minimize” flips the comparison. The smallest number wins.',
  },
};

const q3: Question = {
  id: 3,
  chapterId: 1,
  kind: 'choice',
  visual: 'cards',
  title: 'The Merchant’s Offer',
  story: [
    'Before leaving the island, Odysseus meets three merchants offering food.',
    'The crew has six gold coins available.',
    'Choose the merchant providing the greatest number of meals per coin.',
  ],
  objectiveText: 'Maximize food efficiency (meals per coin).',
  objective: {
    sense: 'maximize',
    metric: { kind: 'ratio', numerator: 'meals', denominator: 'coins' },
    label: 'meals per coin',
    unit: 'meals/coin',
  },
  attributes: [
    { key: 'meals', label: 'Meals', unit: 'meals', icon: 'wheat' },
    { key: 'coins', label: 'Price', unit: 'coins', icon: 'coins' },
  ],
  constraints: [{ key: 'coins', op: '<=', limit: 6, label: 'Spend at most 6 coins' }],
  options: [
    { id: 'A', label: 'The Grain Seller', description: 'Sacks of barley bread, sold by a smiling old man.', icon: 'merchant', attributes: { meals: 12, coins: 6 } },
    { id: 'B', label: 'The Fig Trader', description: 'Baskets of figs and olives under a striped awning.', icon: 'scale', attributes: { meals: 15, coins: 5 } },
    { id: 'C', label: 'The Fisherwoman', description: 'Salted fish, wrapped in leaves, from a weathered stall.', icon: 'store', attributes: { meals: 16, coins: 4 } },
  ],
  lesson: {
    explanation:
      'Merchant C offers four meals per coin, the greatest efficiency among the available offers. (A = 12 ÷ 6 = 2, B = 15 ÷ 5 = 3, C = 16 ÷ 4 = 4.)',
    hint: 'Divide the number of meals by the price in coins.',
    principle: 'Efficiency is a ratio: output ÷ input. The best deal is the highest rate, not the biggest total.',
    nextTime: 'When the question says “per,” compute a ratio for every option before comparing.',
  },
};

// ═════════════════════════════════════════════════════════════
// CHAPTER II — ESCAPE FROM THE CYCLOPS
// ═════════════════════════════════════════════════════════════

const q4: Question = {
  id: 4,
  chapterId: 2,
  kind: 'choice',
  visual: 'cards',
  title: 'The Escape Plan',
  story: [
    'Polyphemus has rolled a boulder across the cave mouth. Odysseus studies three escape plans by firelight.',
    'Speed matters — but the crew has only five tools, and Odysseus will not sacrifice a single sailor.',
  ],
  objectiveText: 'Minimize escape time.',
  objective: { sense: 'minimize', metric: { kind: 'attribute', key: 'hours' }, label: 'escape time', unit: 'hours' },
  attributes: [
    { key: 'hours', label: 'Time', unit: 'hours', icon: 'clock' },
    { key: 'tools', label: 'Tools', unit: 'tools', icon: 'pickaxe' },
    { key: 'casualties', label: 'Casualties', unit: 'casualties', icon: 'skull' },
  ],
  constraints: [
    { key: 'tools', op: '<=', limit: 5, label: 'At most 5 tools' },
    { key: 'casualties', op: '==', limit: 0, label: 'Zero crew casualties' },
  ],
  options: [
    { id: 'A', label: 'The Tunnel', description: 'Dig beneath the cave wall toward the sea cliffs.', icon: 'pickaxe', attributes: { hours: 3, tools: 6, casualties: 0 } },
    { id: 'B', label: 'The Disguise', description: 'Cling beneath the giant’s sheep as he lets them out to graze.', icon: 'mask', attributes: { hours: 5, tools: 4, casualties: 0 } },
    { id: 'C', label: 'The Cliff Passage', description: 'Climb a narrow chimney of rock toward a crack of daylight.', icon: 'cliff', attributes: { hours: 4, tools: 3, casualties: 1 } },
  ],
  lesson: {
    explanation:
      'The tunnel exceeds the tool limit. The cliff passage violates the safety constraint. The disguise strategy is the only feasible solution.',
    hint: 'An option must satisfy every constraint before you compare its travel time.',
    principle: 'Constrained optimization: first eliminate infeasible options, then optimize the objective among what remains.',
    nextTime: 'Check each option against every constraint first. Only feasible options are allowed to compete.',
  },
};

const q5: Question = {
  id: 5,
  chapterId: 2,
  kind: 'choice',
  visual: 'cards',
  title: 'The Water Shortage',
  story: ['After escaping the cave, the crew must cross difficult terrain.', 'Only eight water units are available.'],
  objectiveText: 'Minimize travel time.',
  objective: { sense: 'minimize', metric: { kind: 'attribute', key: 'hours' }, label: 'travel time', unit: 'hours' },
  attributes: [
    { key: 'hours', label: 'Time', unit: 'hours', icon: 'clock' },
    { key: 'water', label: 'Water', unit: 'water units', icon: 'water' },
  ],
  constraints: [{ key: 'water', op: '<=', limit: 8, label: 'Maximum 8 water units' }],
  options: [
    { id: 'A', label: 'Cave Tunnel', description: 'A dark, direct passage through the mountain’s heart.', icon: 'cave', attributes: { hours: 2, water: 10 } },
    { id: 'B', label: 'Rocky Trail', description: 'A hard scramble across sun-baked boulders.', icon: 'mountain', attributes: { hours: 4, water: 7 } },
    { id: 'C', label: 'Shore Passage', description: 'The long way round, along the cool wet sand.', icon: 'coast', attributes: { hours: 5, water: 4 } },
  ],
  lesson: {
    explanation:
      'The Cave Tunnel is fastest but consumes too much water. The Rocky Trail is the fastest option satisfying the resource constraint.',
    hint: 'Eliminate any route consuming more than eight water units.',
    principle: 'A resource constraint defines the feasible region. The fastest infeasible option is still not allowed.',
    nextTime: 'Cross out options that exceed a resource limit, then pick the best objective value among survivors.',
  },
};

const q6: Question = {
  id: 6,
  chapterId: 2,
  kind: 'choice',
  visual: 'cards',
  title: 'The Sleeping Cyclops',
  story: [
    'Polyphemus has fallen asleep.',
    'Odysseus has fifteen minutes to rescue the sailors trapped deeper inside the cave.',
  ],
  objectiveText: 'Maximize sailors rescued.',
  objective: { sense: 'maximize', metric: { kind: 'attribute', key: 'sailors' }, label: 'sailors rescued', unit: 'sailors' },
  attributes: [
    { key: 'sailors', label: 'Rescued', unit: 'sailors', icon: 'users' },
    { key: 'minutes', label: 'Time', unit: 'minutes', icon: 'hourglass' },
  ],
  constraints: [{ key: 'minutes', op: '<=', limit: 15, label: 'No more than 15 minutes' }],
  options: [
    { id: 'A', label: 'The Deep Chamber', description: 'Rescue 8 sailors from the farthest pen.', icon: 'users', attributes: { sailors: 8, minutes: 18 } },
    { id: 'B', label: 'The Middle Pens', description: 'Rescue 6 sailors from the sheepfolds.', icon: 'users', attributes: { sailors: 6, minutes: 12 } },
    { id: 'C', label: 'The Near Alcove', description: 'Rescue 5 sailors from beside the fire.', icon: 'users', attributes: { sailors: 5, minutes: 10 } },
  ],
  lesson: {
    explanation:
      'Rescuing eight sailors exceeds the time limit. Six is the largest number of sailors that can be rescued within fifteen minutes.',
    hint: 'Find the greatest number of sailors among the options satisfying the time limit.',
    principle: 'The optimal feasible solution is the best objective value among options that satisfy all constraints.',
    nextTime: 'Maximize within the limits: filter by the time constraint, then take the largest value left.',
  },
};

// ═════════════════════════════════════════════════════════════
// CHAPTER III — AEOLUS AND THE WINDS (0/1 knapsack)
// ═════════════════════════════════════════════════════════════

const knapsackPrinciple =
  'The 0/1 knapsack problem: choose the subset of items (each taken 0 or 1 times) that maximizes total value while total weight stays within capacity.';

const q7: Question = {
  id: 7,
  chapterId: 3,
  kind: 'knapsack',
  title: 'Preparing the Ship',
  story: ['Aeolus offers essential supplies for the voyage.', 'Your ship can carry only six additional cargo units.'],
  objectiveText: 'Maximize total survival value without exceeding 6 cargo units.',
  capacity: 6,
  items: [
    { id: 'water', name: 'Water', weight: 3, value: 5, icon: 'water', flavor: 'Amphorae of fresh spring water.' },
    { id: 'food', name: 'Food', weight: 2, value: 4, icon: 'wheat', flavor: 'Barley cakes, cheese and dried figs.' },
    { id: 'shield', name: 'Shield', weight: 4, value: 7, icon: 'shield', flavor: 'A bronze hoplon forged on Aeolia.' },
  ],
  lesson: {
    explanation: 'Food and Shield provide eleven survival points while using exactly six cargo units.',
    hint: 'Look for a combination of items whose total weight stays within six while maximizing total value.',
    principle: knapsackPrinciple,
    nextTime: 'List the combinations that fit, add up each one’s value, and keep the best.',
  },
};

const q8: Question = {
  id: 8,
  chapterId: 3,
  kind: 'knapsack',
  title: 'Repairs Before the Storm',
  story: ['A storm approaches.', 'The crew must prepare the damaged ship using limited cargo space.'],
  objectiveText: 'Maximize total survival value without exceeding 7 cargo units.',
  capacity: 7,
  items: [
    { id: 'rope', name: 'Rope', weight: 3, value: 5, icon: 'rope', flavor: 'Coils of braided flax line.' },
    { id: 'sail', name: 'Sail', weight: 4, value: 8, icon: 'sail', flavor: 'A spare linen sail, wind-blessed.' },
    { id: 'medicine', name: 'Medicine', weight: 2, value: 6, icon: 'medicine', flavor: 'Healing herbs and honeyed salves.' },
    { id: 'anchor', name: 'Anchor', weight: 5, value: 7, icon: 'anchor', flavor: 'A heavy stone-and-bronze anchor.' },
  ],
  lesson: {
    explanation: 'Sail and Medicine produce fourteen points of value while using only six of seven available cargo units.',
    hint: 'The optimal combination does not necessarily use every available cargo unit.',
    principle: knapsackPrinciple,
    nextTime: 'Filling every unit of capacity is not the goal — total value is. Compare totals, not fullness.',
  },
};

const q9: Question = {
  id: 9,
  chapterId: 3,
  kind: 'knapsack',
  title: 'The Final Wind’s Blessing',
  story: ['Before leaving the island, Aeolus grants Odysseus one final opportunity to prepare.', 'Only nine cargo units remain.'],
  objectiveText: 'Maximize total survival value without exceeding 9 cargo units.',
  capacity: 9,
  items: [
    { id: 'map', name: 'Map', weight: 2, value: 4, icon: 'map', flavor: 'A chart of the western isles.' },
    { id: 'lantern', name: 'Lantern', weight: 3, value: 5, icon: 'lantern', flavor: 'An oil lamp that never gutters.' },
    { id: 'water', name: 'Water', weight: 4, value: 8, icon: 'water', flavor: 'Sealed jars of sweet water.' },
    { id: 'medicine', name: 'Medicine', weight: 5, value: 10, icon: 'medicine', flavor: 'Rare remedies from Aeolus’ halls.' },
  ],
  lesson: {
    explanation: 'Water and Medicine provide the maximum total value of eighteen without exceeding capacity.',
    hint: 'Evaluate combinations rather than choosing only the highest-value item.',
    principle: knapsackPrinciple,
    nextTime: 'More items is not always better: three light items (17) can lose to two heavier ones (18).',
  },
};

// ═════════════════════════════════════════════════════════════
// CHAPTER IV — THE FINAL PASSAGE TO ITHACA (shortest paths)
// ═════════════════════════════════════════════════════════════

const pathPrinciple =
  'Shortest path: the best route minimizes the sum of all edge weights from start to destination — not the number of stops.';

const q10: Question = {
  id: 10,
  chapterId: 4,
  kind: 'graph',
  title: 'The Hidden Passage',
  story: [
    'Several passages lead toward Ithaca.',
    'One route appears direct, but an alternative path through smaller islands may be more efficient.',
  ],
  objectiveText: 'Find the route from START to ITHACA with the lowest total cost.',
  start: 'START',
  goal: 'ITHACA',
  nodes: [
    { id: 'START', label: 'START', subtitle: 'Your ship', x: 80, y: 240, role: 'start' },
    { id: 'A', label: 'A', subtitle: 'Sirens’ Rock', x: 360, y: 105, role: 'island' },
    { id: 'B', label: 'B', subtitle: 'Thrinacia', x: 260, y: 370, role: 'island' },
    { id: 'C', label: 'C', subtitle: 'Ogygia', x: 520, y: 370, role: 'island' },
    { id: 'ITHACA', label: 'ITHACA', subtitle: 'Home', x: 740, y: 230, role: 'goal' },
  ],
  edges: [
    { from: 'START', to: 'A', weight: 4 },
    { from: 'START', to: 'B', weight: 2 },
    { from: 'A', to: 'ITHACA', weight: 5 },
    { from: 'B', to: 'C', weight: 3 },
    { from: 'C', to: 'ITHACA', weight: 2 },
    { from: 'B', to: 'ITHACA', weight: 8, curve: -70 },
  ],
  hazards: [{ kind: 'rocks', x: 600, y: 120 }],
  lesson: {
    explanation:
      'The route through B and C costs seven, less than the alternatives. The route with more stops can still have the lowest total cost.',
    hint: 'Add every edge weight along the route. Do not compare only the number of stops.',
    principle: pathPrinciple,
    nextTime: 'Total each candidate route edge by edge. A “direct” route is not automatically the cheapest.',
  },
};

const q11: Question = {
  id: 11,
  chapterId: 4,
  kind: 'graph',
  title: 'The Two Sea Monsters',
  story: ['Scylla and Charybdis guard two deadly passages.', 'Odysseus must carefully compare interconnected routes.'],
  objectiveText: 'Find the route from START to ITHACA with the lowest total cost.',
  start: 'START',
  goal: 'ITHACA',
  nodes: [
    { id: 'START', label: 'START', subtitle: 'Your ship', x: 70, y: 240, role: 'start' },
    { id: 'A', label: 'A', subtitle: 'Scylla’s Cliffs', x: 260, y: 115, role: 'island' },
    { id: 'B', label: 'B', subtitle: 'Misty Shoals', x: 260, y: 370, role: 'island' },
    { id: 'C', label: 'C', subtitle: 'Crag of Bones', x: 490, y: 95, role: 'island' },
    { id: 'D', label: 'D', subtitle: 'Charybdis’ Rim', x: 490, y: 330, role: 'island' },
    { id: 'ITHACA', label: 'ITHACA', subtitle: 'Home', x: 745, y: 220, role: 'goal' },
  ],
  edges: [
    { from: 'START', to: 'A', weight: 3 },
    { from: 'START', to: 'B', weight: 5 },
    { from: 'A', to: 'C', weight: 4 },
    { from: 'A', to: 'D', weight: 6 },
    { from: 'B', to: 'D', weight: 2 },
    { from: 'C', to: 'ITHACA', weight: 4 },
    { from: 'D', to: 'ITHACA', weight: 3 },
  ],
  hazards: [
    { kind: 'scylla', x: 375, y: 40 },
    { kind: 'charybdis', x: 620, y: 395 },
  ],
  lesson: {
    explanation: 'The path through B and D has the minimum total travel cost of ten.',
    hint: 'Calculate the complete cost of each route from START to ITHACA.',
    principle: pathPrinciple,
    nextTime: 'A cheap first leg (START → A costs 3) can still lead to an expensive total. Evaluate complete routes.',
  },
};

const q12: Question = {
  id: 12,
  chapterId: 4,
  kind: 'graph',
  title: 'The Last Voyage Home',
  story: [
    'The shoreline of Ithaca appears through the morning mist.',
    'Only one final network of dangerous routes remains.',
    'Use everything you have learned to navigate home.',
  ],
  objectiveText: 'Find the route from START to ITHACA with the lowest total cost.',
  start: 'START',
  goal: 'ITHACA',
  nodes: [
    { id: 'START', label: 'START', subtitle: 'Your ship', x: 70, y: 240, role: 'start' },
    { id: 'A', label: 'A', subtitle: 'Aeaea', x: 230, y: 95, role: 'island' },
    { id: 'B', label: 'B', subtitle: 'Scheria', x: 230, y: 385, role: 'island' },
    { id: 'C', label: 'C', subtitle: 'Wandering Rocks', x: 425, y: 205, role: 'island' },
    { id: 'D', label: 'D', subtitle: 'Whirlpool Reach', x: 425, y: 400, role: 'island' },
    { id: 'E', label: 'E', subtitle: 'Asteris', x: 600, y: 295, role: 'island' },
    { id: 'ITHACA', label: 'ITHACA', subtitle: 'Home', x: 755, y: 170, role: 'goal' },
  ],
  edges: [
    { from: 'START', to: 'A', weight: 2 },
    { from: 'START', to: 'B', weight: 4 },
    { from: 'A', to: 'C', weight: 4 },
    { from: 'A', to: 'D', weight: 7, labelT: 0.3 },
    { from: 'B', to: 'C', weight: 1, labelT: 0.3 },
    { from: 'B', to: 'D', weight: 5 },
    { from: 'C', to: 'E', weight: 3 },
    { from: 'C', to: 'ITHACA', weight: 7 },
    { from: 'D', to: 'E', weight: 2 },
    { from: 'D', to: 'ITHACA', weight: 4, curve: 150 },
    { from: 'E', to: 'ITHACA', weight: 2 },
  ],
  hazards: [
    { kind: 'scylla', x: 330, y: 40 },
    { kind: 'charybdis', x: 560, y: 440 },
  ],
  lesson: {
    explanation:
      'Choosing the smallest first edge does not guarantee the lowest total cost. Global optimization requires evaluating the entire journey.',
    hint: 'Compare cumulative costs across the whole network rather than choosing the cheapest-looking first step.',
    principle: pathPrinciple,
    nextTime: 'Greedy choices can trap you. Dijkstra’s algorithm keeps the cheapest known cost to every island and only finalizes the smallest.',
  },
};

export const QUESTIONS: Question[] = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12];

export const QUESTIONS_BY_ID: Record<number, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: number): Question {
  const q = QUESTIONS_BY_ID[id];
  if (!q) throw new Error(`Unknown question ${id}`);
  return q;
}
