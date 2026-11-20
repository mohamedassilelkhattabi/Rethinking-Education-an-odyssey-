import { MotionConfig } from 'motion/react';
import { Map as MapIcon } from 'lucide-react';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { CHAPTERS, getChapter } from './data/chapters';
import { createInitialState, frontierChapter, gameReducer, type GameAction } from './game/reducer';
import { sfx, setMuted as setSfxMuted } from './game/sound';
import { hasProgress, loadGame, loadSettings, saveGame, saveSettings } from './game/storage';
import type { GameState } from './game/types';
import { ChallengeScreen } from './screens/ChallengeScreen';
import { ChapterCompleteScreen } from './screens/ChapterCompleteScreen';
import { ChapterIntroScreen } from './screens/ChapterIntroScreen';
import { DemoScreen } from './screens/DemoScreen';
import { EducationalReviewScreen } from './screens/EducationalReviewScreen';
import { FailureScreen } from './screens/FailureScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { IntroductionScreen } from './screens/IntroductionScreen';
import { MapScreen } from './screens/MapScreen';
import { TitleScreen } from './screens/TitleScreen';
import { VictoryScreen } from './screens/VictoryScreen';

function progressLabel(s: GameState): string {
  const n = s.completedChapters.length;
  if (n === CHAPTERS.length) return 'Voyage complete · Ithaca reached';
  const next = getChapter(frontierChapter(s.completedChapters));
  return `${n}/${CHAPTERS.length} units · ${s.permanentXP} XP · next: ${next.location}`;
}

/** Group screens so the challenge view isn't remounted between "challenge" and "correct". */
function screenKey(s: GameState): string {
  if (s.screen === 'challenge' || s.screen === 'correct') return `challenge-${s.currentChapter}-${s.chapterAttempts[s.currentChapter] ?? 0}`;
  return s.screen;
}

export default function ClassicApp({ onSurvival }: { onSurvival: () => void }) {
  const [state, rawDispatch] = useReducer(gameReducer, undefined, () => loadGame() ?? createInitialState());
  const [muted, setMuted] = useState(() => loadSettings().muted);
  const prevScreen = useRef(state.screen);

  const dispatch = useCallback((a: GameAction) => rawDispatch(a), []);

  // Persist every state change.
  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    setSfxMuted(muted);
    saveSettings({ muted });
  }, [muted]);

  // Sound cues on meaningful transitions (never on initial load / refresh).
  useEffect(() => {
    const prev = prevScreen.current;
    prevScreen.current = state.screen;
    if (prev === state.screen) return;
    if (state.screen === 'correct') state.lastOutcome?.chapterCompleted ? sfx.chapter() : sfx.correct();
    else if (state.screen === 'failure') sfx.fail();
    else if (state.screen === 'victory') sfx.victory();
    else sfx.click();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, [state.screen, state.lastOutcome]);

  const hud = (actions?: React.ReactNode) => <GameHUD state={state} muted={muted} onToggleSound={() => setMuted((m) => !m)} actions={actions} />;
  const mapButton = (
    <button type="button" className="btn btn-ghost px-3 py-1.5 text-[11px]" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'map' })}>
      <MapIcon className="h-4 w-4" aria-hidden /> Map
    </button>
  );

  let content: React.ReactNode;
  switch (state.screen) {
    case 'title':
      content = (
        <TitleScreen
          hasSave={hasProgress(state)}
          progressLabel={progressLabel(state)}
          onNewGame={() => dispatch({ type: 'NEW_GAME' })}
          onContinue={() => dispatch({ type: 'NAVIGATE', screen: state.introSeen ? 'map' : 'intro' })}
          onHowToPlay={() => dispatch({ type: 'NAVIGATE', screen: 'howToPlay' })}
          onDemo={() => dispatch({ type: 'NAVIGATE', screen: 'demo' })}
          onReview={() => dispatch({ type: 'NAVIGATE', screen: 'review' })}
          onSwitchEdition={onSurvival}
        />
      );
      break;
    case 'howToPlay':
      content = <HowToPlayScreen onBack={() => dispatch({ type: 'BACK' })} />;
      break;
    case 'intro':
      content = <IntroductionScreen onFinish={() => dispatch({ type: 'FINISH_INTRO' })} />;
      break;
    case 'map':
      content = (
        <>
          {hud()}
          <MapScreen
            state={state}
            onOpenChapter={(id) => dispatch({ type: 'OPEN_CHAPTER', chapterId: id })}
            onShipArrived={() => dispatch({ type: 'SHIP_ARRIVED' })}
            onReview={() => dispatch({ type: 'NAVIGATE', screen: 'review' })}
            onTitle={() => dispatch({ type: 'NAVIGATE', screen: 'title' })}
            onVictory={() => dispatch({ type: 'NAVIGATE', screen: 'victory' })}
          />
        </>
      );
      break;
    case 'chapterIntro':
      content = (
        <>
          {hud(mapButton)}
          <ChapterIntroScreen
            chapter={getChapter(state.currentChapter)}
            attempts={state.chapterAttempts[state.currentChapter] ?? 0}
            replay={state.completedChapters.includes(state.currentChapter)}
            onStart={() => dispatch({ type: 'START_CHAPTER' })}
            onBack={() => dispatch({ type: 'ABANDON_CHAPTER' })}
          />
        </>
      );
      break;
    case 'challenge':
    case 'correct':
      content = (
        <>
          {hud()}
          <ChallengeScreen
            state={state}
            onSubmit={(questionId, answer) => dispatch({ type: 'SUBMIT_ANSWER', questionId, answer })}
            onHint={(questionId) => {
              sfx.hint();
              dispatch({ type: 'USE_HINT', questionId });
            }}
            onContinue={() => dispatch({ type: 'CONTINUE' })}
            onAbandon={() => dispatch({ type: 'ABANDON_CHAPTER' })}
          />
        </>
      );
      break;
    case 'failure':
      content = (
        <>
          {hud()}
          <FailureScreen state={state} onRetry={() => dispatch({ type: 'RETRY_CHAPTER' })} onMap={() => dispatch({ type: 'ABANDON_CHAPTER' })} />
        </>
      );
      break;
    case 'chapterComplete':
      content = (
        <>
          {hud()}
          <ChapterCompleteScreen state={state} onContinue={() => dispatch({ type: 'FINISH_CHAPTER' })} />
        </>
      );
      break;
    case 'victory':
      content = (
        <VictoryScreen
          state={state}
          onPlayAgain={() => dispatch({ type: 'PLAY_AGAIN' })}
          onJourney={() => dispatch({ type: 'NAVIGATE', screen: 'map' })}
          onReview={() => dispatch({ type: 'NAVIGATE', screen: 'review' })}
        />
      );
      break;
    case 'review':
      content = <EducationalReviewScreen completedChapters={state.completedChapters} onBack={() => dispatch({ type: 'BACK' })} />;
      break;
    case 'demo':
      content = <DemoScreen onExit={() => dispatch({ type: 'BACK' })} />;
      break;
  }

  return (
    <MotionConfig reducedMotion="user">
      {/* Fade-in only: navigation never waits on an exit animation. */}
      <div key={screenKey(state)} className="screen-fade min-h-screen">
        {content}
      </div>
    </MotionConfig>
  );
}
