export type RealmId = 1 | 2 | 3 | 4 | 5 | 6;
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type StageArchetype =
  | 'curiosity'
  | 'manipulation'
  | 'symbolic'
  | 'ai-transfer'
  | 'interleaved'
  | 'boss-teachback';

export type SimulationKind =
  | 'function-wave'
  | 'secant-tangent'
  | 'derivative-surf'
  | 'olympus-peaks'
  | 'tide-accumulation'
  | 'ithaca-architecture';

export type MotivationArchetype =
  | 'explorer'
  | 'achiever'
  | 'socializer'
  | 'free-spirit'
  | 'philanthropist';

export type CircadianMode = 'daylight' | 'dusk' | 'auto';

export interface SliderControlSpec {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  target: number;
  tolerance: number;
  /** Physical description shown before symbolic formulas appear */
  sensoryHint: string;
}

export interface InterleavedLensOption {
  id: string;
  label: string;
  conceptRealm: RealmId;
  description: string;
  isBestFit: boolean;
  gentleFeedback: string;
}

export interface TeachBackChoice {
  id: string;
  companionPrompt: string;
  explanation: string;
  isCoreInsight: boolean;
  gentleResponse: string;
}

export interface QuestSimulation {
  kind: SimulationKind;
  /** Selects specific visual-physics sub-scenario within the realm engine */
  variant: string;
  controls: SliderControlSpec[];
  /** Physical goal stated in everyday sensory terms (never a test prompt) */
  physicalGoal: string;
  /** Calm narrative feedback when parameter is too low / too high / aligned */
  feedbackLow: string;
  feedbackHigh: string;
  feedbackAligned: string;
  /** Optional misconception tag recorded silently by HLR if player overshoots repeatedly */
  misconceptionTag: string;
}

export interface Quest {
  id: string; // e.g. 'R1-S1' .. 'R6-S6'
  realmId: RealmId;
  stage: StageNumber;
  stageArchetype: StageArchetype;
  stageLabel: string;
  conceptId: string;
  conceptName: string;
  title: string;
  /** Short, curiosity-first invitation (1-2 sentences, zero test jargon) */
  invitation: string;
  /** Hide all symbolic math until player discovers the visual pattern (true for Stage 1 & 2) */
  hideFormulaInitially: boolean;
  /** Clean KaTeX equation revealed in Stage 3+ or after Stage 1/2 discovery */
  symbolicEquation: string;
  /** Plain-language bridge tying physical motion to the equation */
  symbolicBridgeNote: string;
  /** Interactive visual-spatial simulation config */
  simulation: QuestSimulation;
  /** Stage 4 default teen real-world framing (used offline or before Gemini re-skin) */
  defaultTransferScenario?: {
    hookTag: string;
    title: string;
    story: string;
    realWorldTakeaway: string;
  };
  /** Stage 5 interleaved tool-selection lens (breaks strategy-cue blindness) */
  interleavedLenses?: {
    prompt: string;
    mixedFromRealms: RealmId[];
    options: InterleavedLensOption[];
  };
  /** Stage 6 Protégé Effect teach-back encounter */
  teachBack?: {
    companionName: string;
    companionRole: string;
    dilemma: string;
    choices: TeachBackChoice[];
    communitySeedPrompt: string;
  };
  /** Gentle offline Oracle intuition nudges if API key is unavailable */
  oracleNudges: [string, string];
}

export interface Realm {
  id: RealmId;
  numeral: string;
  name: string;
  subtitle: string;
  calculusUnit: string;
  topics: string[];
  companion: {
    name: string;
    role: string;
  };
  /** Normalized coordinates (0..1) on the painterly Mediterranean world map */
  mapPos: { x: number; y: number };
  islandStyle: 'archipelago' | 'strait' | 'currents' | 'summit' | 'lagoon' | 'citadel';
  /** Framing intros tailored by Player Motivation Archetype */
  archetypeHooks: Record<MotivationArchetype, string>;
}

export interface CompassProfile {
  consentGiven: boolean;
  allowAiTransfer: boolean;
  allowOracleNudges: boolean;
  displayName: string;
  /** 0 = Gentle Sanctuary (rich scaffolding), 100 = Open Explorer (high agency) */
  calmChallengeDial: number;
  archetype: MotivationArchetype;
  interests: string[];
  customInterest: string;
  updatedAt: number;
}

export interface AiTransferSkin {
  questId: string;
  hookTag: string;
  title: string;
  story: string;
  symbolicNote: string;
  realWorldTakeaway: string;
  source: 'gemini' | 'curated-fallback';
  generatedAt: number;
}
