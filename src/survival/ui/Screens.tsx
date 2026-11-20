import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Home,
  Map as MapIcon,
  Play,
  Presentation,
  RotateCcw,
  Sailboat,
  Sparkles,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { CHAPTERS } from '../../data/chapters';
import { QUESTIONS } from '../../data/questions';
import { heroPortrait } from '../art/characters';
import { heartIcon, hungerIcon, itemDataUrl } from '../art/world';
import { PENALTIES } from '../items';
import type { Records } from '../save';
import type { SurvivalState } from '../types';
import { formatTime, useKeys } from './hooks';

const Shell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`fixed inset-0 z-40 flex items-center justify-center overflow-y-auto p-4 ${className}`}>{children}</div>
);

export function MainMenu(props: {
  hasSave: boolean;
  records: Records;
  keysEnabled: boolean;
  dueReviews: number;
  unreadSocial: number;
  onNew: () => void;
  onContinue: () => void;
  onHowTo: () => void;
  onDemo: () => void;
  onClassic: () => void;
  onPersonalize: () => void;
  onSocial: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const portrait = useMemo(() => heroPortrait(5), []);

  const primaryStart = () => {
    if (props.hasSave) props.onContinue();
    else props.onNew();
  };
  useKeys({ enter: primaryStart, ' ': primaryStart }, props.keysEnabled && !confirm);

  return (
    <Shell className="bg-gradient-to-b from-[#07101f]/55 via-transparent to-[#07101f]/75">
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        <img src={portrait} alt="" className="pixelated mb-2.5 h-[72px] w-20 drop-shadow-[4px_4px_0_#000]" />
        <h1 className="font-pixel text-5xl leading-tight text-[#f1d49a] drop-shadow-[5px_5px_0_#1a1208] md:text-7xl">ODYSSEY</h1>
        <p className="font-pixel mt-2.5 text-sm text-[#f0e2bf] drop-shadow-[3px_3px_0_#1a1208] md:text-lg">
          THE PATH TO ITHACA · CALCULUS I
        </p>
        <p className="font-term mt-3 text-2xl text-[#f6ead0] drop-shadow-[2px_2px_0_#000] md:text-3xl">
          Six Realms of Calculus I · AI-Personalized Scenarios · Study Community
        </p>

        <div className="mt-7 flex w-full max-w-sm flex-col gap-2.5">
          {props.hasSave && (
            <button type="button" data-start="true" className="px-btn" onClick={props.onContinue} autoFocus>
              <Sailboat className="h-4 w-4" /> Continue voyage
            </button>
          )}
          <button
            type="button"
            data-start={props.hasSave ? undefined : 'true'}
            className={`px-btn ${props.hasSave ? 'px-btn-dark' : ''}`}
            onClick={() => (props.hasSave ? setConfirm(true) : props.onNew())}
            autoFocus={!props.hasSave}
          >
            <Play className="h-4 w-4" /> New voyage
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className="px-btn px-btn-teal !px-3 !text-[9px]" onClick={props.onPersonalize}>
              <Sparkles className="h-3.5 w-3.5 shrink-0" /> AI Profile
              {props.dueReviews > 0 ? ` (${props.dueReviews})` : ''}
            </button>
            <button type="button" className="px-btn px-btn-dark !px-3 !text-[9px]" onClick={props.onSocial}>
              <Users className="h-3.5 w-3.5 shrink-0" /> Community
              {props.unreadSocial > 0 ? ` (${props.unreadSocial})` : ''}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className="px-btn px-btn-dark !px-3 !text-[9px]" onClick={props.onHowTo}>
              <HelpCircle className="h-3.5 w-3.5 shrink-0" /> How to play
            </button>
            <button type="button" className="px-btn px-btn-dark !px-3 !text-[9px]" onClick={props.onDemo}>
              <Presentation className="h-3.5 w-3.5 shrink-0" /> Demo mode
            </button>
          </div>
        </div>

        {confirm && (
          <div className="px-panel mt-4 max-w-sm p-4" role="alertdialog" aria-labelledby="new-confirm">
            <p id="new-confirm" className="font-term text-xl leading-6 text-[#f0e2bf]">
              Starting a new voyage abandons your current run. This cannot be undone.
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <button type="button" className="px-btn px-btn-dark !text-[9px]" onClick={() => setConfirm(false)} autoFocus>
                Keep voyage
              </button>
              <button type="button" className="px-btn px-btn-red !text-[9px]" onClick={props.onNew}>
                Start over
              </button>
            </div>
          </div>
        )}

        <p className="font-term mt-5 text-xl tabular-nums text-[#e6d6aa] drop-shadow-[2px_2px_0_#000]">
          Best XP {props.records.bestXP} · Voyages {props.records.runs} · Homecomings {props.records.victories}
        </p>
        <button
          type="button"
          onClick={props.onClassic}
          className="font-pixel mt-2.5 flex items-center gap-2 text-[9px] text-[#d6c79c] underline-offset-4 hover:text-[#f1d49a] hover:underline"
        >
          <MapIcon className="h-3.5 w-3.5" /> Classic map edition
        </button>
      </div>
    </Shell>
  );
}

export function HowToPlay({ onBack }: { onBack: () => void }) {
  useKeys({ escape: onBack });
  const icons = useMemo(
    () => ({ heart: heartIcon(3), hunger: hungerIcon(3), ambrosia: itemDataUrl('ambrosia', 3), bread: itemDataUrl('bread', 3) }),
    [],
  );
  const controls: [string, string][] = [
    ['A / D  or  ← / →', 'Move'],
    ['SPACE / W / ↑', 'Jump (hold for higher)'],
    ['E', 'Talk to NPCs · use exits'],
    ['F', 'Eat the selected food'],
    ['Q', 'Select next food'],
    ['I', 'Inventory'],
    ['ESC', 'Pause / close'],
    ['Mouse', 'Answer Calculus I challenges'],
  ];
  return (
    <Shell className="bg-[#070b12]/85">
      <div className="px-panel w-full max-w-3xl p-5 md:p-7">
        <h2 className="font-pixel text-center text-lg text-[#f1d49a]">HOW TO PLAY — CALCULUS I ODYSSEY</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="font-pixel text-[10px] text-[#5fb8c4]">CONTROLS</h3>
            <dl className="mt-2 space-y-1">
              {controls.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-[#3a2a1a] py-1">
                  <dt className="font-pixel text-[9px] text-[#f0e2bf]">{k}</dt>
                  <dd className="font-term text-xl leading-5 text-[#c9b98a]">{v}</dd>
                </div>
              ))}
            </dl>
            <h3 className="font-pixel mt-4 text-[10px] text-[#5fb8c4]">6-UNIT CURRICULUM</h3>
            <ul className="font-term mt-1.5 space-y-0.5 text-lg leading-5 text-[#e8d9b5]">
              {CHAPTERS.map((c) => (
                <li key={c.id}>
                  {c.unitLabel} ({c.location})
                </li>
              ))}
            </ul>
          </div>
          <div className="font-term space-y-2 text-xl leading-6 text-[#f0e2bf]">
            <h3 className="font-pixel text-[10px] text-[#5fb8c4]">SURVIVE & MASTER</h3>
            <p>• Explore each Mediterranean realm and find the three challenge-givers marked <span className="text-[#ffd166]">!</span>. Press E to talk.</p>
            <p>• Solve all <strong>3 Calculus I problems in a row</strong> to unlock the ship or cave exit to the next unit.</p>
            <p>
              • Wrong answers cost <span className="text-[#ff8a7a]">health</span> and <span className="text-[#ffb347]">hunger</span> ({Object.values(PENALTIES).join(' / ')} by unit), reveal the full worked solution, and schedule a spaced-repetition review.
            </p>
            <p>• Click <strong>Personalize with AI</strong> on any problem to rewrite it around your real-world hobbies, games, music, or creators (consent-first).</p>
            <p>• Open the <strong>Community Hub</strong> anytime to join Calculus study groups, share LaTeX, YouTube clips, memes, or 1-on-1 DMs.</p>
            <p className="flex items-center gap-2">
              <img src={icons.hunger} alt="" className="pixelated h-5 w-5" />
              <img src={icons.bread} alt="" className="pixelated h-5 w-5" />
              <img src={icons.ambrosia} alt="" className="pixelated h-5 w-5" />
              <img src={icons.heart} alt="" className="pixelated h-5 w-5" /> Eat food to stop starvation; drink Ambrosia to heal.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <button type="button" className="px-btn" onClick={onBack} autoFocus>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-2 border-[#1a1208] bg-[#2a1d14] p-2 text-center">
      <p className="font-pixel text-sm tabular-nums text-[#f1d49a]">{value}</p>
      <p className="font-term text-lg leading-5 text-[#c9b98a]">{label}</p>
    </div>
  );
}

export function GameOverScreen({ state, onRestart, onMenu }: { state: SurvivalState; onRestart: () => void; onMenu: () => void }) {
  const s = state.summary;
  return (
    <Shell className="bg-[#1a0606]/55">
      <div className="px-panel w-full max-w-xl !border-[#c64f4f] p-6 text-center md:p-8">
        <h2 className="font-pixel text-2xl leading-10 text-[#ff8a7a] md:text-3xl">ODYSSEUS HAS FALLEN</h2>
        <p className="font-term mt-3 text-2xl leading-7 text-[#f6ead0]">The journey home has ended. Every failed attempt strengthens your Calculus mastery.</p>
        <p className="font-term mt-2 text-xl text-[#c9b98a]">
          {s?.cause === 'starvation'
            ? 'He starved on the road home.'
            : s?.cause === 'environment'
              ? 'The sea claimed him.'
              : s?.cause === 'demo'
                ? '(Presenter demonstration.)'
                : 'One unwise decision too many.'}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
          <Stat label="Unit reached" value={s ? `Unit ${s.chapterReached}` : '—'} />
          <Stat label="Problems solved" value={s?.questionsSolved ?? 0} />
          <Stat label="Incorrect answers" value={s?.incorrectAnswers ?? 0} />
          <Stat label="Total XP earned" value={s?.xp ?? 0} />
          <Stat label="Time survived" value={formatTime(s?.timeSurvivedMs ?? 0)} />
          <Stat label="Food eaten" value={s?.foodConsumed ?? 0} />
        </div>
        <p className="font-term mt-4 text-lg text-[#c9b98a]">Permadeath clears the voyage save, while your Spaced-Repetition retention stats remain saved.</p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <button type="button" className="px-btn px-btn-red" onClick={onRestart} autoFocus>
            <RotateCcw className="h-4 w-4" /> Begin a new odyssey
          </button>
          <button type="button" className="px-btn px-btn-dark !text-[9px]" onClick={onMenu}>
            <Home className="h-3.5 w-3.5" /> Main menu
          </button>
        </div>
      </div>
    </Shell>
  );
}

export function VictoryScreen({ state, onPlayAgain, onReview, onMenu }: { state: SurvivalState; onPlayAgain: () => void; onReview: () => void; onMenu: () => void }) {
  const maxXP = CHAPTERS.length * 300;
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-between overflow-y-auto p-3 md:p-5">
      <div className="max-w-3xl pt-2 text-center drop-shadow-[3px_3px_0_#1a1208] md:pt-6">
        <h2 className="font-pixel text-3xl leading-[3rem] text-[#fff1c4] md:text-5xl md:leading-[4.5rem]">ITHACA AT LAST</h2>
        <div className="font-term space-y-0.5 text-2xl leading-7 text-[#fff6e0] md:text-[1.7rem]">
          <p>Through Pre-Calculus, Limits, Derivatives, Optimization, Integrals, and Volumes of Revolution, Odysseus has returned home.</p>
          <p className="text-[#ffe08a]">Mastery of Calculus I guided the fleet to Ithaca.</p>
        </div>
      </div>
      <div className="px-panel w-full max-w-5xl px-3 py-3 text-center" style={{ animation: 'rise-in 0.5s steps(5) 1.5s both' }}>
        <dl className="grid grid-cols-4 gap-1.5 lg:grid-cols-8">
          {(
            [
              ['Final XP', `${state.xp}/${maxXP}`],
              ['Time survived', formatTime(state.timeSurvivedMs)],
              ['Food eaten', state.foodConsumed],
              ['Wrong answers', state.totalIncorrectAnswers],
              ['Problems solved', `${state.completedChapters.length * 3}/${QUESTIONS.length}`],
              ['Units', `${state.completedChapters.length}/${CHAPTERS.length}`],
              ['Health', `${state.health}/100`],
              ['Hunger', `${state.hunger}/100`],
            ] as [string, string | number][]
          ).map(([k, v]) => (
            <div key={k} className="border-2 border-[#1a1208] bg-[#2a1d14] px-1 py-1.5">
              <dd className="font-pixel text-[11px] tabular-nums text-[#f1d49a]">{v}</dd>
              <dt className="font-term text-base leading-4 text-[#c9b98a]">{k}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" className="px-btn" onClick={onPlayAgain} autoFocus>
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
          <button type="button" className="px-btn px-btn-teal" onClick={onReview}>
            <BookOpen className="h-4 w-4" /> Review Calculus I notes
          </button>
          <button type="button" className="px-btn px-btn-dark" onClick={onMenu}>
            <Home className="h-4 w-4" /> Return to main menu
          </button>
        </div>
      </div>
    </div>
  );
}
