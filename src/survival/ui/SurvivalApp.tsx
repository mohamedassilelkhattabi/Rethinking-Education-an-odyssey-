import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { setMuted as setSfxMuted } from '../../game/sound';
import { loadSettings, saveSettings } from '../../game/storage';
import { PersonalizationModal } from '../../personalization/PersonalizationModal';
import { getDueReviews, recordAttempt } from '../../personalization/spacedRepetition';
import {
  clearAllPersonalizationData,
  loadConsent,
  loadMastery,
  loadProfile,
  saveConsent,
  saveMastery,
  saveProfile,
} from '../../personalization/storage';
import type { ConsentSettings, MasteryMap, UserProfile } from '../../personalization/types';
import { EducationalReviewScreen } from '../../screens/EducationalReviewScreen';
import { LocalSocialRepository } from '../../social/repository';
import { SocialDrawer } from '../../social/SocialDrawer';
import { GameHost } from '../phaser/game';
import { loadRecords } from '../save';
import { GameStore, type Overlay, type Screen } from '../store';
import {
  ChallengeOverlay,
  ChapterCompleteOverlay,
  DialoguePanel,
  IntroOverlay,
  ResultOverlay,
  ReviewEncounterOverlay,
} from './Encounters';
import { HUD } from './HUD';
import { useGame } from './hooks';
import { DemoBar, InventoryPanel, PauseMenu, Toast } from './Panels';
import { GameOverScreen, HowToPlay, MainMenu, VictoryScreen } from './Screens';

/** The survival edition: realistic Phaser world + Calculus I curriculum + AI personalization + Social Hub. */
export function SurvivalApp({ onClassic }: { onClassic: () => void }) {
  const campaign = useMemo(() => new GameStore({ persist: true, demo: false, muted: loadSettings().muted }), []);
  const [store, setStore] = useState<GameStore>(campaign);
  const { state, ui } = useGame(store);
  const parentRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<GameHost | null>(null);
  const [records, setRecords] = useState(() => loadRecords());
  const [reviewFrom, setReviewFrom] = useState<'victory' | 'menu'>('menu');
  const prevScreen = useRef<Screen>(ui.screen);
  const [howtoFrom, setHowtoFrom] = useState<Screen>('menu');

  // Personalization & Spaced-Repetition state
  const [consent, setConsent] = useState<ConsentSettings>(() => loadConsent());
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [mastery, setMastery] = useState<MasteryMap>(() => loadMastery());
  const [personalizeTab, setPersonalizeTab] = useState<'consent' | 'profile' | 'mastery'>('consent');
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [reviewQuestionId, setReviewQuestionId] = useState<number | null>(null);
  const overlayBeforeUtilityRef = useRef<Overlay>('none');

  // Social Hub repository
  const socialRepo = useMemo(
    () => new LocalSocialRepository({ displayName: profile.displayName, interests: profile.hobbies }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const socialState = useSyncExternalStore(socialRepo.subscribe, socialRepo.getState, socialRepo.getState);
  const unreadSocial = useMemo(() => socialState.rooms.reduce((sum, r) => sum + r.unreadCount, 0), [socialState.rooms]);
  const dueReviews = useMemo(() => getDueReviews(mastery).length, [mastery]);

  useEffect(() => {
    if (ui.screen === 'howto' && prevScreen.current !== 'howto') setHowtoFrom(prevScreen.current);
    prevScreen.current = ui.screen;
  }, [ui.screen]);

  // Phaser lives for the lifetime of this component.
  useEffect(() => {
    if (!parentRef.current) return;
    const host = new GameHost(parentRef.current, campaign);
    hostRef.current = host;
    return () => {
      host.destroy();
      hostRef.current = null;
    };
  }, [campaign]);

  useEffect(() => {
    hostRef.current?.setStore(store);
  }, [store]);

  useEffect(() => {
    setSfxMuted(ui.muted);
    saveSettings({ muted: ui.muted });
  }, [ui.muted]);

  useEffect(() => {
    if (ui.screen === 'menu') setRecords(loadRecords());
  }, [ui.screen]);

  // Support ?autostart=1 for instant launch into gameplay
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && store.ui.screen === 'menu') {
      store.newRun();
    }
  }, [store]);

  // Mirror high-level game state on document.body.dataset.state
  useEffect(() => {
    const bodyState =
      ui.screen === 'menu' || ui.screen === 'howto' || ui.screen === 'review'
        ? 'title'
        : ui.screen === 'gameover' || ui.screen === 'victory'
          ? 'gameover'
          : ui.overlay !== 'none' || personalizeOpen || socialOpen || reviewQuestionId !== null
            ? 'paused'
            : 'playing';
    document.body.dataset.state = bodyState;
  }, [ui.screen, ui.overlay, personalizeOpen, socialOpen, reviewQuestionId]);

  // No page scrolling while the game owns the viewport.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Dev-only handle for automated playtesting.
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __odyssey?: unknown }).__odyssey = { store, game: hostRef.current?.game };
  }, [store]);

  const toggleMute = () => store.setUI({ muted: !store.ui.muted });

  const openPersonalize = useCallback(
    (tab?: 'consent' | 'profile' | 'mastery') => {
      const targetTab = tab ?? (consent.decided ? 'profile' : 'consent');
      setPersonalizeTab(targetTab);
      setSocialOpen(false);
      if (store.ui.screen === 'play' && store.ui.overlay !== 'personalize' && store.ui.overlay !== 'social') {
        overlayBeforeUtilityRef.current = store.ui.overlay;
        if (store.ui.overlay === 'none') store.setUI({ overlay: 'personalize' });
      }
      setPersonalizeOpen(true);
    },
    [consent.decided, store],
  );

  const closePersonalize = useCallback(() => {
    setPersonalizeOpen(false);
    if (store.ui.screen === 'play' && store.ui.overlay === 'personalize') {
      store.setUI({ overlay: overlayBeforeUtilityRef.current === 'personalize' ? 'none' : overlayBeforeUtilityRef.current });
    }
  }, [store]);

  const openSocial = useCallback(() => {
    setPersonalizeOpen(false);
    if (store.ui.screen === 'play' && store.ui.overlay !== 'social' && store.ui.overlay !== 'personalize') {
      overlayBeforeUtilityRef.current = store.ui.overlay;
      if (store.ui.overlay === 'none') store.setUI({ overlay: 'social' });
    }
    setSocialOpen(true);
  }, [store]);

  const closeSocial = useCallback(() => {
    setSocialOpen(false);
    if (store.ui.screen === 'play' && store.ui.overlay === 'social') {
      store.setUI({ overlay: overlayBeforeUtilityRef.current === 'social' ? 'none' : overlayBeforeUtilityRef.current });
    }
  }, [store]);

  const handleSaveConsent = useCallback((next: ConsentSettings) => {
    setConsent(next);
    saveConsent(next);
  }, []);

  const handleSaveProfile = useCallback(
    (next: UserProfile) => {
      setProfile(next);
      saveProfile(next);
      socialRepo.updateCurrentUser(next.displayName, next.hobbies);
    },
    [socialRepo],
  );

  const handleClearAll = useCallback(() => {
    clearAllPersonalizationData();
    setConsent(loadConsent());
    setProfile(loadProfile());
    setMastery({});
  }, []);

  const handleRecordAttempt = useCallback(
    (questionId: number, isCorrect: boolean, solveMs: number, usedHint: boolean) => {
      if (!consent.allowMasteryTracking && consent.decided) return;
      setMastery((prev) => {
        const next = recordAttempt(prev, { questionId, isCorrect, solveMs, usedHint });
        saveMastery(next);
        return next;
      });
    },
    [consent.allowMasteryTracking, consent.decided],
  );

  const handleStartReviewEncounter = useCallback(
    (questionId: number) => {
      setPersonalizeOpen(false);
      setSocialOpen(false);
      if (store.ui.screen === 'play') {
        store.setUI({ overlay: 'reviewEncounter' });
      }
      setReviewQuestionId(questionId);
    },
    [store],
  );

  const handleCloseReviewEncounter = useCallback(() => {
    setReviewQuestionId(null);
    if (store.ui.screen === 'play' && store.ui.overlay === 'reviewEncounter') {
      store.setUI({ overlay: 'none' });
    }
  }, [store]);

  const startDemo = () => {
    const demo = new GameStore({ persist: false, demo: true, muted: ui.muted });
    demo.dispatch({ type: 'DEMO_REFILL' });
    demo.setUI({ screen: 'play', overlay: 'intro' });
    setStore(demo);
  };
  const exitDemo = () => {
    campaign.setUI({ screen: 'menu', overlay: 'none', npc: null, cinematic: 'none', muted: store.ui.muted });
    setStore(campaign);
  };

  const playing = ui.screen === 'play';

  return (
    <div className="survival-root fixed inset-0 select-none overflow-hidden bg-black">
      {/* 16:9 stage: the Phaser canvas plus in-world UI */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 'min(100vw, 177.78vh)', height: 'min(100vh, 56.25vw)' }}>
        <div ref={parentRef} className="absolute inset-0" />
        {playing && state.status === 'playing' && ui.cinematic === 'none' && (
          <HUD
            store={store}
            state={state}
            muted={ui.muted}
            onToggleMute={toggleMute}
            dueReviews={dueReviews}
            unreadSocial={unreadSocial}
            onOpenPersonalize={openPersonalize}
            onOpenSocial={openSocial}
          />
        )}
        {playing && <Toast state={state} />}
        {playing && ui.overlay === 'dialogue' && ui.npc !== null && <DialoguePanel key={ui.npc} store={store} state={state} questionId={ui.npc} />}
      </div>

      {playing && ui.overlay === 'intro' && <IntroOverlay key={state.currentChapter} store={store} state={state} />}
      {playing && ui.overlay === 'challenge' && (
        <ChallengeOverlay
          store={store}
          state={state}
          consent={consent}
          profile={profile}
          onRequestConsentModal={() => openPersonalize('consent')}
          onRecordAttempt={handleRecordAttempt}
        />
      )}
      {playing && ui.overlay === 'result' && <ResultOverlay store={store} state={state} />}
      {playing && ui.overlay === 'chapterComplete' && <ChapterCompleteOverlay store={store} state={state} />}
      {playing && ui.overlay === 'inventory' && <InventoryPanel store={store} state={state} />}
      {playing && ui.overlay === 'pause' && (
        <PauseMenu store={store} muted={ui.muted} onToggleMute={toggleMute} onQuit={store.demo ? exitDemo : () => store.setUI({ screen: 'menu', overlay: 'none', npc: null })} />
      )}

      {ui.screen === 'menu' && !store.demo && (
        <MainMenu
          hasSave={store.hasLivingSave()}
          records={records}
          keysEnabled={!personalizeOpen && !socialOpen && reviewQuestionId === null}
          dueReviews={dueReviews}
          unreadSocial={unreadSocial}
          onNew={() => store.newRun()}
          onContinue={() => store.continueRun()}
          onHowTo={() => store.setUI({ screen: 'howto' })}
          onDemo={startDemo}
          onClassic={onClassic}
          onPersonalize={() => openPersonalize()}
          onSocial={openSocial}
        />
      )}
      {ui.screen === 'howto' && <HowToPlay onBack={() => store.setUI({ screen: howtoFrom, overlay: howtoFrom === 'play' ? 'pause' : 'none' })} />}
      {ui.screen === 'gameover' && (
        <GameOverScreen
          state={state}
          onRestart={() => {
            store.newRun();
            if (store.demo) store.dispatch({ type: 'DEMO_REFILL' });
          }}
          onMenu={() => (store.demo ? exitDemo() : store.setUI({ screen: 'menu', overlay: 'none' }))}
        />
      )}
      {ui.screen === 'victory' && (
        <VictoryScreen
          state={state}
          onPlayAgain={() => store.newRun()}
          onReview={() => {
            setReviewFrom('victory');
            store.setUI({ screen: 'review' });
          }}
          onMenu={() => (store.demo ? exitDemo() : store.setUI({ screen: 'menu', overlay: 'none' }))}
        />
      )}
      {ui.screen === 'review' && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <EducationalReviewScreen completedChapters={state.completedChapters} onBack={() => store.setUI({ screen: reviewFrom === 'victory' ? 'victory' : 'menu' })} />
        </div>
      )}

      {personalizeOpen && (
        <PersonalizationModal
          initialTab={personalizeTab}
          consent={consent}
          profile={profile}
          mastery={mastery}
          onSaveConsent={handleSaveConsent}
          onSaveProfile={handleSaveProfile}
          onClearAll={handleClearAll}
          onStartReviewEncounter={handleStartReviewEncounter}
          onClose={closePersonalize}
        />
      )}

      <SocialDrawer repo={socialRepo} open={socialOpen} onClose={closeSocial} />

      {reviewQuestionId !== null && (
        <ReviewEncounterOverlay
          questionId={reviewQuestionId}
          consent={consent}
          profile={profile}
          onRecordAttempt={handleRecordAttempt}
          onClose={handleCloseReviewEncounter}
        />
      )}

      {store.demo && <DemoBar store={store} onExit={exitDemo} />}
    </div>
  );
}
