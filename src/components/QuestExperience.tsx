import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Eye,
  Lightbulb,
  RotateCcw,
  Share2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getRealm, STAGE_META } from '../curriculum/realms';
import type { AiTransferSkin, CompassProfile, Quest } from '../curriculum/types';
import {
  getCuratedFallbackSkin,
  requestGentleOracleNudge,
  requestQuestTransferSkin,
} from '../engine/aiTransferClient';
import { evaluateSimulation } from '../engine/simulationMath';
import { CalculusStageCanvas } from './CalculusStageCanvas';
import { MathText } from './MathText';

export interface QuestCompletionPayload {
  quest: Quest;
  adjustments: number;
  durationMs: number;
  usedOracleNudge: boolean;
}

export interface ShareIntuitionPayload {
  text: string;
  latex: string;
  realmId: number;
}

interface QuestExperienceProps {
  quest: Quest;
  nextQuest: Quest | null;
  theme: 'daylight' | 'dusk';
  eyeRestMode: boolean;
  compass: CompassProfile;
  alreadyCompleted: boolean;
  onCompleteQuest: (payload: QuestCompletionPayload) => void;
  onRecordExploration: (quest: Quest, adjustments: number, durationMs: number, usedOracle: boolean) => void;
  onSelectQuest: (quest: Quest) => void;
  onBackToMap: () => void;
  onOpenCompass: () => void;
  onShareIntuition: (payload: ShareIntuitionPayload) => void;
}

function buildInitialValues(quest: Quest): Record<string, number> {
  const init: Record<string, number> = {};
  for (const ctrl of quest.simulation.controls) {
    init[ctrl.id] = ctrl.initial;
  }
  return init;
}

export function QuestExperience({
  quest,
  nextQuest,
  theme,
  eyeRestMode,
  compass,
  alreadyCompleted,
  onCompleteQuest,
  onRecordExploration,
  onSelectQuest,
  onBackToMap,
  onOpenCompass,
  onShareIntuition,
}: QuestExperienceProps) {
  const realm = getRealm(quest.realmId);
  const stageMeta = STAGE_META[quest.stage];

  const [values, setValues] = useState<Record<string, number>>(() => buildInitialValues(quest));
  const [adjustments, setAdjustments] = useState(0);
  const [formulaRevealed, setFormulaRevealed] = useState(!quest.hideFormulaInitially);
  const [oracleText, setOracleText] = useState<string | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);
  const [usedOracle, setUsedOracle] = useState(false);

  // Stage 4: AI Real-World Transfer skin
  const [transferSkin, setTransferSkin] = useState<AiTransferSkin>(() => getCuratedFallbackSkin(quest));
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferNotice, setTransferNotice] = useState<string | null>(null);

  // Stage 5: Interleaved lens choice
  const [selectedLensId, setSelectedLensId] = useState<string | null>(null);

  // Stage 6: Protégé Effect teach-back choice + player own-words reflection
  const [selectedTeachId, setSelectedTeachId] = useState<string | null>(null);
  const [ownWords, setOwnWords] = useState('');

  // Completion state for this visit
  const [questCompletedNow, setQuestCompletedNow] = useState(alreadyCompleted);
  const startedAtRef = useRef<number>(Date.now());
  const explorationLoggedRef = useRef(false);

  // Reset cleanly ONLY when switching to a different quest (never when alreadyCompleted flips true on solve!)
  useEffect(() => {
    setValues(buildInitialValues(quest));
    setAdjustments(0);
    setFormulaRevealed(!quest.hideFormulaInitially);
    setOracleText(null);
    setOracleLoading(false);
    setUsedOracle(false);
    setTransferSkin(getCuratedFallbackSkin(quest));
    setTransferLoading(false);
    setTransferNotice(null);
    setSelectedLensId(null);
    setSelectedTeachId(null);
    setOwnWords('');
    setQuestCompletedNow(alreadyCompleted);
    startedAtRef.current = Date.now();
    explorationLoggedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest.id]);

  // Auto-personalize Stage 4 if consent & AI transfer are already enabled
  useEffect(() => {
    if (quest.stage !== 4 || !compass.consentGiven || !compass.allowAiTransfer) return;
    let active = true;
    setTransferLoading(true);
    setTransferNotice(null);
    void requestQuestTransferSkin(quest, compass, false).then(({ skin, notice }) => {
      if (!active) return;
      setTransferSkin(skin);
      setTransferNotice(notice ?? null);
      setTransferLoading(false);
    });
    return () => {
      active = false;
    };
  }, [quest, compass]);

  const outcome = useMemo(() => evaluateSimulation(quest.simulation, values), [quest.simulation, values]);

  const selectedLens = useMemo(
    () => quest.interleavedLenses?.options.find((o) => o.id === selectedLensId) ?? null,
    [quest.interleavedLenses, selectedLensId],
  );
  const lensSatisfied = !quest.interleavedLenses || Boolean(selectedLens?.isBestFit);

  const selectedTeach = useMemo(
    () => quest.teachBack?.choices.find((c) => c.id === selectedTeachId) ?? null,
    [quest.teachBack, selectedTeachId],
  );
  const teachSatisfied = !quest.teachBack || Boolean(selectedTeach?.isCoreInsight);

  const stageGoalReady = outcome.aligned && lensSatisfied && teachSatisfied;

  // When player aligns cleanly and satisfies any Stage 5 / 6 step, record discovery automatically
  useEffect(() => {
    if (!stageGoalReady || questCompletedNow) return;
    setQuestCompletedNow(true);
    onCompleteQuest({
      quest,
      adjustments,
      durationMs: Math.max(1000, Date.now() - startedAtRef.current),
      usedOracleNudge: usedOracle,
    });
  }, [stageGoalReady, questCompletedNow, onCompleteQuest, quest, adjustments, usedOracle]);

  const handleSliderChange = (controlId: string, nextVal: number) => {
    setValues((prev) => ({ ...prev, [controlId]: nextVal }));
    setAdjustments((c) => {
      const next = c + 1;
      // Silent productive-failure signal if player explores 6+ times without aligning
      if (next === 6 && !outcome.aligned && !explorationLoggedRef.current) {
        explorationLoggedRef.current = true;
        onRecordExploration(quest, next, Date.now() - startedAtRef.current, usedOracle);
      }
      return next;
    });
  };

  const handleResetControls = () => {
    setValues(buildInitialValues(quest));
  };

  const handleAskOracle = async () => {
    setOracleLoading(true);
    setUsedOracle(true);
    const result = await requestGentleOracleNudge(quest, values, compass);
    setOracleText(result.text);
    setOracleLoading(false);
  };

  const handlePersonalizeTransfer = async (forceRefresh = false) => {
    if (!compass.consentGiven || !compass.allowAiTransfer) {
      onOpenCompass();
      return;
    }
    setTransferLoading(true);
    setTransferNotice(null);
    const { skin, notice } = await requestQuestTransferSkin(quest, compass, forceRefresh);
    setTransferSkin(skin);
    setTransferNotice(notice ?? null);
    setTransferLoading(false);
  };

  const handleShare = () => {
    const baseText =
      ownWords.trim() ||
      selectedTeach?.explanation ||
      `Just clicked on ${quest.conceptName} in ${realm.name}: ${quest.symbolicBridgeNote}`;
    onShareIntuition({
      text: `[Realm ${realm.numeral} · ${quest.conceptName}] ${baseText}`,
      latex: quest.symbolicEquation,
      realmId: quest.realmId,
    });
  };

  // Show symbolic equation automatically for Stage 3+, OR after player explicitly unlocks it in Stage 1/2
  const showSymbolicPanel = !quest.hideFormulaInitially || formulaRevealed;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      {/* Calm minimal top breadcrumb strip (max 3 actions) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMap}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]"
          >
            <ArrowLeft className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
            Sea Chart
          </button>
          <div className="text-sm text-[var(--text-secondary)]">
            <span className="font-display text-base font-bold text-[var(--text-primary)]">
              Realm {realm.numeral}: {realm.name}
            </span>
            <span className="mx-2 opacity-50">·</span>
            <span>
              Stage {quest.stage} of 6 — {stageMeta.label}
            </span>
          </div>
        </div>

        {/* 6 quiet stage dots for instant orientation */}
        <div className="flex items-center gap-1.5" aria-label={`Stage ${quest.stage} of 6`}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === quest.stage
                  ? 'w-7 bg-[var(--accent-gold)]'
                  : s < quest.stage
                    ? 'w-2.5 bg-[var(--accent-primary)]'
                    : 'w-2.5 bg-[var(--border-strong)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main 2-column Embodied Visual Canvas + Progressive Disclosure Control Deck */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT 7 COLUMNS: Interactive Visual-Spatial Simulation */}
        <section className="flex flex-col gap-4 lg:col-span-7">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {quest.stage === 4 ? transferSkin.title : quest.title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              {quest.stage === 4 ? transferSkin.story : quest.invitation}
            </p>
          </div>

          {/* Live 60 FPS Visual-Spatial Canvas */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]">
            <div className="relative h-[300px] w-full sm:h-[360px]">
              <CalculusStageCanvas
                quest={quest}
                values={values}
                theme={theme}
                eyeRestMode={eyeRestMode}
                showSymbolicOverlay={showSymbolicPanel}
              />
            </div>

            {/* Calm Physical Feedback Strip — Terracotta when exploring, Ochre Gold when aligned */}
            <div
              data-testid="simulation-feedback"
              data-aligned={String(outcome.aligned)}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] px-4 py-3 text-sm transition-colors"
              style={{
                backgroundColor: outcome.aligned
                  ? 'var(--accent-gold-soft)'
                  : adjustments > 0
                    ? 'var(--accent-terracotta-soft)'
                    : 'var(--bg-elevated)',
              }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: outcome.aligned
                      ? 'var(--accent-gold)'
                      : adjustments > 0
                        ? 'var(--accent-terracotta)'
                        : 'var(--accent-primary)',
                  }}
                />
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    <MathText text={outcome.physicalMessage} />
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {outcome.readoutLabel}:{' '}
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                      {outcome.readoutValue}
                    </span>
                    <span className="mx-2 opacity-50">·</span>
                    Goal: <MathText text={quest.simulation.physicalGoal} />
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetControls}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                title="Reset physical controls"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Reset
              </button>
            </div>
          </div>

          {/* Stage 3+ Symbolic Bridge Card — Hidden in Stage 1 & 2 until player discovers visual intuition */}
          {showSymbolicPanel ? (
            <div
              data-testid="symbolic-bridge-card"
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  Symbolic Bridge · {quest.conceptName}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  The equation behind the motion you just felt
                </span>
              </div>
              <div className="my-3 overflow-x-auto rounded-xl bg-[var(--bg-surface)] px-4 py-3 text-center text-lg text-[var(--text-primary)]">
                <MathText text={`$$${quest.symbolicEquation}$$`} />
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                <MathText text={quest.stage === 4 ? transferSkin.symbolicNote : quest.symbolicBridgeNote} />
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <span>
                {outcome.aligned
                  ? 'You felt the balance physically. Ready to see the clean Calculus notation behind it?'
                  : 'Explore the physical motion freely first — formulas stay tucked away so intuition leads.'}
              </span>
              {outcome.aligned && (
                <button
                  type="button"
                  onClick={() => setFormulaRevealed(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary-ink)] transition hover:bg-[var(--accent-primary-hover)]"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  Reveal Symbolic Bridge
                </button>
              )}
            </div>
          )}
        </section>

        {/* RIGHT 5 COLUMNS: Tactile Controls, Stage-Specific Interactions & Gentle Oracle */}
        <aside className="flex flex-col gap-4 lg:col-span-5">
          {/* Tactile Visual Manipulation Controls */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Adjust the World
            </h2>
            <div className="mt-4 space-y-5">
              {quest.simulation.controls.map((ctrl) => {
                const val = values[ctrl.id] ?? ctrl.initial;
                return (
                  <div key={ctrl.id} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <label htmlFor={`slider-${ctrl.id}`} className="text-sm font-semibold text-[var(--text-primary)]">
                        {ctrl.label}
                      </label>
                      <span className="font-ui text-sm font-semibold tabular-nums text-[var(--accent-primary)]">
                        {Number.isInteger(ctrl.step) ? Math.round(val) : val.toFixed(2)}
                        {ctrl.unit ? ` ${ctrl.unit}` : ''}
                      </span>
                    </div>
                    <input
                      id={`slider-${ctrl.id}`}
                      data-testid={`slider-${ctrl.id}`}
                      type="range"
                      min={ctrl.min}
                      max={ctrl.max}
                      step={ctrl.step}
                      value={val}
                      onChange={(e) => handleSliderChange(ctrl.id, Number(e.target.value))}
                      className="odyssey-slider"
                    />
                    <p className="text-xs text-[var(--text-secondary)]">
                      <MathText text={ctrl.sensoryHint} />
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Gentle Optional Oracle Nudge (never intrusive, zero red/pressure) */}
            <div className="mt-5 border-t border-[var(--border-hairline)] pt-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleAskOracle}
                  disabled={oracleLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-gold)] disabled:opacity-60"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden />
                  {oracleLoading ? 'Listening to the wind...' : 'Ask the Oracle for a gentle nudge'}
                </button>
                {compass.calmChallengeDial <= 45 && !oracleText && (
                  <span className="text-[11px] text-[var(--text-secondary)]">Sanctuary mode · no penalty</span>
                )}
              </div>

              {oracleText && (
                <div
                  data-testid="oracle-nudge-box"
                  className="mt-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3 text-sm leading-relaxed text-[var(--text-primary)]"
                >
                  <span className="font-semibold text-[var(--accent-gold)]">Oracle whisper: </span>
                  <MathText text={oracleText} />
                </div>
              )}
            </div>
          </div>

          {/* STAGE 4: AI Personalized Teen Real-World Transfer */}
          {quest.stage === 4 && (
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                  Real-World Transfer · {transferSkin.hookTag}
                </span>
                <button
                  type="button"
                  onClick={() => handlePersonalizeTransfer(true)}
                  disabled={transferLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-primary-ink)] transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
                >
                  {compass.consentGiven && compass.allowAiTransfer ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      {transferLoading ? 'Personalizing...' : 'Remix for My Interests'}
                    </>
                  ) : (
                    <>
                      <Compass className="h-3.5 w-3.5" aria-hidden />
                      Enable AI Personalization
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                {transferSkin.realWorldTakeaway}
              </p>
              {transferNotice && (
                <p className="mt-2 text-xs text-[var(--text-secondary)] opacity-85">{transferNotice}</p>
              )}
            </div>
          )}

          {/* STAGE 5: Interleaved Strategy Lens (breaks cue-blindness) */}
          {quest.stage === 5 && quest.interleavedLenses && (
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-soft)]">
              <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Choose the Right Calculus Lens
              </h2>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{quest.interleavedLenses.prompt}</p>
              <div className="mt-3 space-y-2">
                {quest.interleavedLenses.options.map((opt) => {
                  const isPicked = selectedLensId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedLensId(opt.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isPicked
                          ? opt.isBestFit
                            ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-soft)]'
                            : 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta-soft)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{opt.label}</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">Realm {opt.conceptRealm}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{opt.description}</p>
                      {isPicked && (
                        <p className="mt-2 text-xs font-medium text-[var(--text-primary)]">{opt.gentleFeedback}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE 6: Companion Teach-Back (Protégé Effect) + Share Your Intuition */}
          {quest.stage === 6 && quest.teachBack && (
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                  Guide {quest.teachBack.companionName} ({quest.teachBack.companionRole})
                </h2>
                <span className="text-[11px] text-[var(--text-secondary)]">Teach-Back Mastery</span>
              </div>
              <p className="mt-2 text-sm italic text-[var(--text-primary)]">“{quest.teachBack.dilemma}”</p>

              <div className="mt-3 space-y-2">
                {quest.teachBack.choices.map((choice) => {
                  const isPicked = selectedTeachId === choice.id;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => setSelectedTeachId(choice.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isPicked
                          ? choice.isCoreInsight
                            ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-soft)]'
                            : 'border-[var(--accent-terracotta)] bg-[var(--accent-terracotta-soft)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      <p className="text-xs font-semibold text-[var(--accent-primary)]">{choice.companionPrompt}</p>
                      <p className="mt-1 text-sm text-[var(--text-primary)]">{choice.explanation}</p>
                      {isPicked && (
                        <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">{choice.gentleResponse}</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Optional 1-sentence peer insight + 1-click Share Your Intuition */}
              <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
                <label htmlFor="teach-own-words" className="block text-xs font-medium text-[var(--text-secondary)]">
                  {quest.teachBack.communitySeedPrompt}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="teach-own-words"
                    type="text"
                    value={ownWords}
                    onChange={(e) => setOwnWords(e.target.value)}
                    placeholder="In my own words, this clicks because..."
                    className="flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70"
                  />
                  <button
                    type="button"
                    onClick={handleShare}
                    data-testid="share-intuition-btn"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent-gold)] px-3 py-1.5 text-xs font-semibold text-[#1A1916] transition hover:opacity-90"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden />
                    Share Your Intuition
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Serene Discovery Banner & Next Stage Navigation */}
          {questCompletedNow && (
            <div
              data-testid="quest-complete-banner"
              className="rounded-2xl border border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] p-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)] text-[#1A1916]">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-bold text-[var(--text-primary)]">
                    Discovery Charted
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Your compass quietly strengthens {quest.conceptName} in long-term memory.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    {nextQuest ? (
                      <button
                        type="button"
                        onClick={() => onSelectQuest(nextQuest)}
                        data-testid="next-stage-btn"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-primary-ink)] transition hover:bg-[var(--accent-primary-hover)]"
                      >
                        Continue to {nextQuest.realmId === quest.realmId ? `Stage ${nextQuest.stage}` : `Realm ${nextQuest.realmId}`}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onBackToMap}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-gold)] px-4 py-2 text-sm font-semibold text-[#1A1916]"
                      >
                        <Wand2 className="h-4 w-4" aria-hidden />
                        Return to Ithaca Harbor
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onBackToMap}
                      className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]"
                    >
                      Sea Chart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
