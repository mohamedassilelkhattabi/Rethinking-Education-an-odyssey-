import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronsRight,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChallengeRenderer } from '../../challenges/ChallengeRenderer';
import { DijkstraTrace, Expandable } from '../../components/FeedbackPanel';
import { HintPanel } from '../../components/HintPanel';
import { MathText } from '../../components/MathText';
import { StoryPanel } from '../../components/StoryPanel';
import { WeightedGraph } from '../../components/WeightedGraph';
import { getChapter } from '../../data/chapters';
import { getQuestion, QUESTIONS } from '../../data/questions';
import { evaluateAnswer } from '../../game/optimization';
import type { Answer, QuizQuestion } from '../../game/types';
import { requestPersonalizedQuestion } from '../../personalization/api';
import { applyVariantToQuestion, profileSignature } from '../../personalization/spacedRepetition';
import { getCachedVariant } from '../../personalization/storage';
import type { ConsentSettings, PersonalizedVariant, UserProfile } from '../../personalization/types';
import { npcPortrait } from '../art/characters';
import { PENALTIES } from '../items';
import { getLevel } from '../levels';
import { NPC_BY_QUESTION } from '../npcs';
import { npcStatus } from '../reducer';
import type { GameStore } from '../store';
import type { SurvivalState } from '../types';
import { useKeys, useTypewriter } from './hooks';

const portraitCache = new Map<string, string>();
function portraitFor(questionId: number): string {
  const npc = NPC_BY_QUESTION[questionId];
  if (!portraitCache.has(npc.key)) portraitCache.set(npc.key, npcPortrait(npc.look, 6));
  return portraitCache.get(npc.key)!;
}

// ═════════════════════════════════════════════════════════════
// NPC dialogue (bottom panel, typewriter text)
// ═════════════════════════════════════════════════════════════

export function DialoguePanel({ store, state, questionId }: { store: GameStore; state: SurvivalState; questionId: number }) {
  const npc = NPC_BY_QUESTION[questionId];
  const status = npcStatus(state, questionId);
  const lines = status === 'next' ? npc.intro : status === 'done' ? [npc.done] : [npc.locked];
  const [i, setI] = useState(0);
  const [shown, done, skip] = useTypewriter(lines[Math.min(i, lines.length - 1)]);
  const last = i >= lines.length - 1;

  const close = () => store.setUI({ overlay: 'none', npc: null });
  const accept = () => {
    store.dispatch({ type: 'OPEN_CHALLENGE', questionId });
    if (store.state.activeChallenge?.questionId === questionId) store.setUI({ overlay: 'challenge' });
  };
  const advance = () => {
    if (!done) return skip();
    if (!last) return setI((v) => v + 1);
    if (status === 'next') accept();
    else close();
  };

  useKeys({ e: advance, enter: advance, ' ': advance, escape: close });

  return (
    <div className="absolute inset-x-3 bottom-3 z-30 md:inset-x-[8%]" role="dialog" aria-label={`${npc.name} speaks`}>
      <div className="px-panel flex gap-4 p-3 md:p-4">
        <img src={portraitFor(questionId)} alt="" className="pixelated hidden h-[90px] w-24 shrink-0 border-2 border-[#d8af63] bg-[#3a2a1a] object-cover object-top sm:block" />
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-[11px] text-[#f1d49a]">
            {npc.name} <span className="text-[#c9b98a]">· {npc.title}</span>
          </p>
          <p className="font-term mt-1 min-h-[3.2em] text-2xl leading-7 text-[#f6ead0]" aria-live="polite">
            {shown}
            {!done && <span className="blink">▌</span>}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            {status === 'locked' && (
              <span className="font-pixel mr-auto flex items-center gap-1 text-[9px] text-[#9aa3ad]">
                <Lock className="h-3 w-3" /> Help the others in order first
              </span>
            )}
            {!done && (
              <button type="button" className="px-btn px-btn-dark !text-[9px]" onClick={skip}>
                <ChevronsRight className="h-3.5 w-3.5" /> Skip text
              </button>
            )}
            <button type="button" className="px-btn px-btn-dark !text-[9px]" onClick={close}>
              Leave
            </button>
            {done && !last && (
              <button type="button" className="px-btn !text-[9px]" onClick={advance}>
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            {done && last && status === 'next' && (
              <button type="button" className="px-btn px-btn-red !text-[9px]" onClick={accept} autoFocus>
                <Swords className="h-3.5 w-3.5" /> Accept challenge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Calculus I Challenge Overlay with AI Personalization & Step Hints
// ═════════════════════════════════════════════════════════════

interface ChallengeOverlayProps {
  store: GameStore;
  state: SurvivalState;
  consent: ConsentSettings;
  profile: UserProfile;
  onRequestConsentModal: () => void;
  onRecordAttempt: (questionId: number, isCorrect: boolean, solveMs: number, usedHint: boolean) => void;
}

export function ChallengeOverlay({
  store,
  state,
  consent,
  profile,
  onRequestConsentModal,
  onRecordAttempt,
}: ChallengeOverlayProps) {
  const open = state.activeChallenge;
  const openedAtRef = useRef<number>(Date.now());
  const [variant, setVariant] = useState<PersonalizedVariant | null>(null);
  const [usePersonalized, setUsePersonalized] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const baseQuestion = open ? getQuestion(open.questionId) : null;

  useEffect(() => {
    if (!open || !baseQuestion) return;
    openedAtRef.current = Date.now();
    setAiError(null);
    if (baseQuestion.kind === 'quiz' && consent.decided && consent.allowAiPersonalization) {
      const sanitizedProfile = consent.allowInterestImport
        ? profile
        : { ...profile, importedPlatforms: { youtube: [], instagram: [], spotify: [] } };
      const cached = getCachedVariant(baseQuestion.id, profileSignature(sanitizedProfile));
      if (cached) {
        setVariant(cached);
        setUsePersonalized(true);
        return;
      }
    }
    setVariant(null);
    setUsePersonalized(false);
  }, [open?.token, open?.questionId, baseQuestion, consent, profile]);

  if (!open || !baseQuestion) return null;

  const activeQuestion =
    baseQuestion.kind === 'quiz' && usePersonalized && variant
      ? applyVariantToQuestion(baseQuestion, variant)
      : baseQuestion;

  const npc = NPC_BY_QUESTION[open.questionId];
  const chapter = getChapter(baseQuestion.chapterId);
  const index = chapter.questionIds.indexOf(baseQuestion.id);
  const penalty = PENALTIES[baseQuestion.chapterId] ?? 10;

  const handlePersonalize = async (forceRefresh = false) => {
    if (baseQuestion.kind !== 'quiz') return;
    if (!consent.decided || !consent.allowAiPersonalization) {
      onRequestConsentModal();
      return;
    }
    setAiLoading(true);
    setAiError(null);
    const res = await requestPersonalizedQuestion(baseQuestion as QuizQuestion, profile, {
      forceRefresh,
      includeImportedTags: consent.allowInterestImport,
    });
    setAiLoading(false);
    if (res.error || !res.variant) {
      setAiError(res.error || 'Could not personalize this problem right now.');
      return;
    }
    setVariant(res.variant);
    setUsePersonalized(true);
  };

  const submit = (answer: Answer) => {
    const solveMs = Date.now() - openedAtRef.current;
    const usedHint = !!state.hintsUsed[open.questionId];
    const previewEval = evaluateAnswer(baseQuestion, answer);
    onRecordAttempt(open.questionId, previewEval.correct, solveMs, usedHint);

    store.dispatch({ type: 'SUBMIT', questionId: open.questionId, token: open.token, answer });
    if (store.state.status === 'dead') return;
    store.setUI({ overlay: 'result' });
  };

  const stepAway = () => {
    store.dispatch({ type: 'CLOSE_CHALLENGE' });
    store.setUI({ overlay: 'none', npc: null });
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#070b12]/90 p-2 md:p-5" role="dialog" aria-modal="true" aria-label={activeQuestion.title}>
      <div className="mx-auto max-w-6xl">
        <div className="px-panel mb-3 flex flex-wrap items-center gap-3 px-4 py-2.5">
          <img src={portraitFor(open.questionId)} alt="" className="pixelated h-12 w-12 border-2 border-[#d8af63] bg-[#3a2a1a] object-cover object-top" />
          <div className="min-w-0 flex-1">
            <p className="font-pixel text-[10px] text-[#f1d49a]">
              {npc.name}'s challenge · Unit {chapter.id} ({index + 1} of 3)
            </p>
            <p className="font-term text-xl leading-5 text-[#c9b98a]">
              Streak {state.currentStreak}/3 · Wrong answer: <span className="text-[#ff8a7a]">−{penalty} HP</span> &{' '}
              <span className="text-[#ffb347]">−{penalty} Hunger</span> (resets chapter).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {baseQuestion.kind === 'quiz' && (
              <>
                {variant && (
                  <button
                    type="button"
                    className="px-btn px-btn-dark !px-3 !py-2 !text-[8px]"
                    onClick={() => setUsePersonalized((v) => !v)}
                  >
                    {usePersonalized ? 'Show Classic Problem' : 'Show Personalized'}
                  </button>
                )}
                <button
                  type="button"
                  disabled={aiLoading}
                  className="px-btn px-btn-teal !px-3 !py-2 !text-[8px]"
                  onClick={() => handlePersonalize(Boolean(variant))}
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {aiLoading ? 'Personalizing...' : variant ? 'Remix AI Scenario' : 'Personalize with AI'}
                </button>
              </>
            )}
            <button type="button" className="px-btn px-btn-dark !px-3 !py-2 !text-[8px]" onClick={stepAway}>
              <LogOut className="h-3.5 w-3.5" /> Step away
            </button>
          </div>
        </div>

        {aiError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#c64f4f]/50 bg-[#2b1418] px-4 py-2.5 text-xs text-[#ffb3a8]">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{aiError}</span>
          </div>
        )}

        <div className={`grid gap-3 lg:gap-5 ${activeQuestion.kind === 'graph' ? 'lg:grid-cols-[300px_1fr]' : 'lg:grid-cols-[360px_1fr]'}`}>
          <div className="flex flex-col gap-3">
            <StoryPanel question={activeQuestion} indexLabel={`Problem ${baseQuestion.id} of ${QUESTIONS.length}`} />
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-[#101b2d] p-3 md:p-4">
              <ChallengeRenderer key={`${open.token}-${usePersonalized ? 'ai' : 'base'}`} question={activeQuestion} disabled={false} onSubmit={submit} />
            </div>
            <HintPanel
              hint={activeQuestion.lesson.hint}
              hints={activeQuestion.lesson.hints}
              used={!!state.hintsUsed[baseQuestion.id]}
              onUse={() => store.dispatch({ type: 'USE_HINT', questionId: baseQuestion.id })}
              showCost={!store.demo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Result: CORRECT ANSWER! / AN UNWISE DECISION! (with Worked Solution)
// ═════════════════════════════════════════════════════════════

export function ResultOverlay({ store, state }: { store: GameStore; state: SurvivalState }) {
  const r = state.lastResult;
  const close = () => {
    if (r?.correct && r.chapterCompleted) {
      if (state.status === 'victory') store.setUI({ screen: 'victory', overlay: 'none', npc: null });
      else store.setUI({ overlay: 'chapterComplete', npc: null });
    } else {
      store.setUI({ overlay: 'none', npc: null });
    }
  };
  useKeys({ enter: close, escape: close });
  if (!r) return null;
  const npc = NPC_BY_QUESTION[r.questionId];
  const question = getQuestion(r.questionId);
  const ev = r.evaluation;
  const workedSteps = ev.workedSolution ?? question.lesson.workedSolution ?? [];

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#070b12]/88 p-3 md:p-5" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className={`${r.correct ? 'px-panel' : 'px-panel !border-[#c64f4f]'} my-auto w-full max-w-2xl p-4 md:p-5`}>
        <h2 id="result-title" className={`font-pixel text-center text-xl md:text-2xl ${r.correct ? 'text-[#f1d49a]' : 'text-[#ff8a7a]'}`}>
          {r.correct ? 'CORRECT ANSWER!' : 'AN UNWISE DECISION!'}
        </h2>
        <div className="mt-4 flex items-start gap-3">
          <img src={portraitFor(r.questionId)} alt="" className="pixelated h-14 w-14 shrink-0 border-2 border-[#d8af63] bg-[#3a2a1a] object-cover object-top" />
          <p className="font-term text-2xl leading-7 text-[#f6ead0]">
            <span className="text-[#f1d49a]">{npc.name}:</span> “{r.correct ? npc.success : npc.failure}”
          </p>
        </div>

        <div className="mt-4 space-y-3 font-sans text-sm text-[#f0e2bf]/90">
          <p>
            <span className="text-[#c9b98a]">Your answer:</span>{' '}
            <strong>
              <MathText text={ev.selectedLabel} />
            </strong>
          </p>
          {r.correct ? (
            <>
              <p className="text-base leading-relaxed">
                <MathText text={ev.explanation} />
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border-2 border-[#1a1208] bg-[#2a1d14] p-2">
                  <p className="font-pixel text-base tabular-nums text-[#f1d49a]">{r.xpEarned ? `+${r.xpEarned}` : '—'}</p>
                  <p className="font-term text-lg leading-5 text-[#c9b98a]">XP {r.usedHint ? '(hint)' : ''}</p>
                </div>
                <div className="border-2 border-[#1a1208] bg-[#2a1d14] p-2">
                  <p className="font-pixel text-base tabular-nums text-[#f1d49a]">{r.streakAfter}/3</p>
                  <p className="font-term text-lg leading-5 text-[#c9b98a]">Challenge streak</p>
                </div>
                <div className="border-2 border-[#1a1208] bg-[#2a1d14] p-2">
                  <p className="font-pixel text-[11px] leading-5 tabular-nums text-[#7ee08a]">
                    HP {state.health} · FOOD {state.hunger}
                  </p>
                  <p className="font-term text-lg leading-5 text-[#c9b98a]">Vitals</p>
                </div>
              </div>
              {workedSteps.length > 0 && (
                <Expandable title="View full step-by-step worked solution">
                  <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#f0e2bf]">
                    {workedSteps.map((step, idx) => (
                      <li key={idx}>
                        <MathText text={step} />
                      </li>
                    ))}
                  </ol>
                </Expandable>
              )}
              {question.kind === 'graph' && ev.optimalPath && (
                <Expandable title="See the optimal route & Dijkstra's trace" defaultOpen>
                  <div className="parchment mb-3 rounded-lg p-1">
                    <WeightedGraph question={question} path={ev.optimalPath} highlight={ev.optimalPath} />
                  </div>
                  {ev.dijkstra && <DijkstraTrace steps={ev.dijkstra} path={ev.optimalPath} />}
                </Expandable>
              )}
              {r.chapterCompleted && (
                <p className="font-pixel text-center text-[11px] leading-5 text-[#7ee08a]">
                  Three in a row! {r.chapterXP} XP is now permanent.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="rounded-lg border border-[#c64f4f]/55 bg-[#c64f4f]/15 px-3.5 py-2.5">
                <p className="font-pixel text-[9px] text-[#ff9d8f]">WHY IT FAILED — {ev.headline.toUpperCase()}</p>
                <p className="mt-1 text-base leading-relaxed">
                  <MathText text={ev.discreetReason} />
                </p>
              </div>
              <div className="rounded-lg border border-[#5fb8c4]/45 bg-[#2f8190]/15 px-3.5 py-2.5">
                <p className="font-pixel text-[9px] text-[#5fb8c4]">CALCULUS PRINCIPLE</p>
                <p className="mt-1 leading-relaxed">
                  <MathText text={ev.principle} />
                </p>
              </div>
              {workedSteps.length > 0 && (
                <Expandable title="Full Step-by-Step Worked Solution" defaultOpen>
                  <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#f6ead0]">
                    {workedSteps.map((step, idx) => (
                      <li key={idx}>
                        <MathText text={step} />
                      </li>
                    ))}
                  </ol>
                </Expandable>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border-2 border-[#1a1208] bg-[#3a1414] p-2">
                  <p className="font-pixel text-base tabular-nums text-[#ff8a7a]">-{r.healthLost}</p>
                  <p className="font-term text-lg leading-5 text-[#c9b98a]">Health</p>
                </div>
                <div className="border-2 border-[#1a1208] bg-[#3a2414] p-2">
                  <p className="font-pixel text-base tabular-nums text-[#ffb347]">-{r.hungerLost}</p>
                  <p className="font-term text-lg leading-5 text-[#c9b98a]">Hunger</p>
                </div>
                <div className="border-2 border-[#1a1208] bg-[#2a1d14] p-2">
                  <p className="font-pixel text-base tabular-nums text-[#f0e2bf]">0/3</p>
                  <p className="font-term text-lg leading-5 text-[#c9b98a]">Chapter streak reset</p>
                </div>
              </div>
              <p className="font-term text-xl leading-6 text-[#c9b98a]">
                Health {state.health}/100 · Hunger {state.hunger}/100. This concept has also been scheduled in your Spaced-Repetition tracker!
              </p>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-center">
          <button type="button" className={`px-btn ${r.correct ? '' : 'px-btn-red'}`} onClick={close}>
            {r.correct ? (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" /> Return to chapter start
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Spaced-Repetition Safe Review Encounter Modal
// ═════════════════════════════════════════════════════════════

interface ReviewEncounterOverlayProps {
  questionId: number;
  consent: ConsentSettings;
  profile: UserProfile;
  onRecordAttempt: (questionId: number, isCorrect: boolean, solveMs: number, usedHint: boolean) => void;
  onClose: () => void;
}

export function ReviewEncounterOverlay({
  questionId,
  consent,
  profile,
  onRecordAttempt,
  onClose,
}: ReviewEncounterOverlayProps) {
  const baseQuestion = getQuestion(questionId);
  const openedAtRef = useRef<number>(Date.now());
  const [usedHint, setUsedHint] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof evaluateAnswer> | null>(null);
  const [variant, setVariant] = useState<PersonalizedVariant | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeQuestion =
    baseQuestion.kind === 'quiz' && variant ? applyVariantToQuestion(baseQuestion, variant) : baseQuestion;

  const handlePersonalize = async () => {
    if (baseQuestion.kind !== 'quiz') return;
    setAiLoading(true);
    setAiError(null);
    const res = await requestPersonalizedQuestion(baseQuestion, profile, {
      forceRefresh: Boolean(variant),
      includeImportedTags: consent.allowInterestImport,
    });
    setAiLoading(false);
    if (res.error || !res.variant) {
      setAiError(res.error || 'Unable to personalize right now.');
      return;
    }
    setVariant(res.variant);
  };

  const handleSubmit = (answer: Answer) => {
    const ev = evaluateAnswer(baseQuestion, answer);
    onRecordAttempt(questionId, ev.correct, Date.now() - openedAtRef.current, usedHint);
    setResult(ev);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#060a12]/90 p-3 md:p-6" role="dialog" aria-modal="true" aria-label="Spaced Repetition Review">
      <div className="mx-auto max-w-5xl rounded-2xl border border-[#5fb8c4]/45 bg-[#101928] p-4 text-[#f2e8cf] shadow-2xl md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#d8af63]/20 pb-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5fb8c4]">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Spaced-Repetition Recall Encounter · No Survival Penalty
            </p>
            <h2 className="font-display mt-0.5 text-lg font-bold text-[#f1d49a]">
              Unit {baseQuestion.chapterId} · {activeQuestion.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {baseQuestion.kind === 'quiz' && consent.allowAiPersonalization && !result && (
              <button
                type="button"
                disabled={aiLoading}
                onClick={handlePersonalize}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f8190] px-3 py-1.5 text-xs font-bold text-[#eafcff] hover:bg-[#3a96a7] disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {aiLoading ? 'Personalizing...' : 'Personalize Scenario'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d8af63]/30 bg-[#0b1320] p-2 text-[#f0e2bf] hover:border-[#d8af63]"
              aria-label="Close review encounter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {aiError && (
          <div className="mb-3 rounded-lg border border-[#c64f4f]/50 bg-[#2b1418] px-3 py-2 text-xs text-[#ffb3a8]">{aiError}</div>
        )}

        {!result ? (
          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <div>
              <StoryPanel question={activeQuestion} indexLabel={`Review · Unit ${baseQuestion.chapterId}`} />
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-[#0c1422] p-3">
                <ChallengeRenderer question={activeQuestion} disabled={false} onSubmit={handleSubmit} />
              </div>
              <HintPanel
                hint={activeQuestion.lesson.hint}
                hints={activeQuestion.lesson.hints}
                used={usedHint}
                onUse={() => setUsedHint(true)}
                showCost={false}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`rounded-xl border p-4 ${
                result.correct ? 'border-[#4c9b78]/60 bg-[#122e24]' : 'border-[#c64f4f]/60 bg-[#2e1519]'
              }`}
            >
              <p className="flex items-center gap-2 text-base font-bold text-[#f7eed8]">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
                {result.correct ? 'Strong recall! Next spaced-repetition interval extended.' : 'Concept flagged for extra review — study the worked solution below.'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#e6decb]">
                <MathText text={result.correct ? result.explanation : result.discreetReason} />
              </p>
            </div>
            {result.workedSolution && result.workedSolution.length > 0 && (
              <div className="rounded-xl border border-[#d8af63]/25 bg-[#0c1422] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#f1d49a]">Step-by-Step Worked Solution</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#f0e2bf]">
                  {result.workedSolution.map((step, i) => (
                    <li key={i}>
                      <MathText text={step} />
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[#d8af63] px-5 py-2.5 text-xs font-bold text-[#141008] hover:bg-[#f1d49a]"
              >
                Return to Voyage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Chapter story intro & completion
// ═════════════════════════════════════════════════════════════

export function IntroOverlay({ store, state }: { store: GameStore; state: SurvivalState }) {
  const level = getLevel(state.currentChapter);
  const chapter = getChapter(state.currentChapter);
  const text = level.story.join(' ');
  const [shown, done, skip] = useTypewriter(text, 60);
  const begin = () => {
    store.dispatch({ type: 'SEE_INTRO', chapterId: state.currentChapter });
    store.setUI({ overlay: 'none' });
  };
  useKeys({ enter: () => (done ? begin() : skip()), ' ': () => (done ? begin() : skip()), e: () => (done ? begin() : skip()) });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#070b12]/80 p-4" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="px-panel w-full max-w-2xl p-6 text-center md:p-8">
        <p className="font-pixel text-[10px] text-[#5fb8c4]">
          {chapter.unitLabel.toUpperCase()} · {chapter.difficulty.toUpperCase()}
        </p>
        <h2 id="intro-title" className="font-pixel mt-3 text-lg leading-8 text-[#f1d49a] md:text-2xl md:leading-10">
          {chapter.title}
        </h2>
        <p className="font-term mt-4 min-h-[6.5em] text-2xl leading-7 text-[#f6ead0]" aria-live="polite">
          {shown}
          {!done && <span className="blink">▌</span>}
        </p>
        <p className="font-term mt-3 text-xl leading-6 text-[#c9b98a]">
          Topics: {chapter.focus.join(' · ')}. Find the three challenge-givers marked <span className="text-[#ffd166]">!</span> and solve all three in a row.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          {!done && (
            <button type="button" className="px-btn px-btn-dark" onClick={skip}>
              <ChevronsRight className="h-4 w-4" /> Skip text
            </button>
          )}
          <button type="button" className="px-btn" onClick={begin} autoFocus>
            Begin <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChapterCompleteOverlay({ store, state }: { store: GameStore; state: SurvivalState }) {
  const level = getLevel(state.currentChapter);
  const chapter = getChapter(state.currentChapter);
  const xp = state.chapterXP[state.currentChapter] ?? 0;
  const close = () => store.setUI({ overlay: 'none' });
  useKeys({ enter: close, escape: close });
  const badgeIcon = useMemo(() => chapter.badge.name, [chapter]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#070b12]/78 p-4" role="dialog" aria-modal="true" aria-labelledby="cc-title">
      <div className="px-panel w-full max-w-xl p-6 text-center md:p-8">
        <p className="font-pixel text-[10px] text-[#7ee08a]">UNIT {chapter.id} MASTERED · THREE IN A ROW</p>
        <h2 id="cc-title" className="font-pixel mt-3 text-xl leading-9 text-[#f1d49a]">
          CHAPTER {chapter.numeral} COMPLETE
        </h2>
        <p className="font-term mt-1 text-2xl text-[#f0e2bf]">{chapter.title}</p>
        <div className="font-term mt-4 space-y-1 text-2xl leading-7 text-[#f6ead0]">
          {level.completion.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="border-2 border-[#1a1208] bg-[#2a1d14] p-2">
            <p className="font-pixel text-base tabular-nums text-[#f1d49a]">+{xp}</p>
            <p className="font-term text-lg leading-5 text-[#c9b98a]">XP committed</p>
          </div>
          <div className="border-2 border-[#1a1208] bg-[#2a1d14] p-2">
            <p className="font-pixel text-[10px] leading-5 text-[#f1d49a]">{badgeIcon}</p>
            <p className="font-term text-lg leading-5 text-[#c9b98a]">Badge earned</p>
          </div>
        </div>
        <button type="button" className="px-btn mt-6" onClick={close} autoFocus>
          <BookOpen className="h-4 w-4" /> To the exit
        </button>
      </div>
    </div>
  );
}
