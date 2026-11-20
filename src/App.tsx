import {
  Check,
  Compass,
  Eye,
  Lock,
  Map,
  Moon,
  Sun,
  Users,
  Waves,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { CompassModal } from './components/CompassModal';
import { MediterraneanMapCanvas } from './components/MediterraneanMapCanvas';
import {
  QuestExperience,
  type QuestCompletionPayload,
  type ShareIntuitionPayload,
} from './components/QuestExperience';
import { getNextQuest, getQuestById, getQuestsForRealm, QUESTS_36 } from './curriculum/quests';
import { getRealm, REALMS, STAGE_META } from './curriculum/realms';
import type { CircadianMode, CompassProfile, Quest, RealmId } from './curriculum/types';
import {
  createInitialRetentionState,
  isQuestUnlocked,
  isRealmUnlocked,
  localRetentionStorage,
  pickAmbientCurrent,
  realmMasteryRatio,
  recordConceptPractice,
  resolveEffectiveTheme,
  type RetentionState,
} from './engine/retentionEngine';
import { LocalSocialRepository } from './social/repository';
import { SocialDrawer, type PrefillIntuitionDraft } from './social/SocialDrawer';

type ViewMode = 'title' | 'map' | 'quest';

export function App() {
  const [retention, setRetention] = useState<RetentionState>(() => {
    return localRetentionStorage.load() ?? createInitialRetentionState();
  });

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'map';
    }
    return 'title';
  });

  const [selectedRealmId, setSelectedRealmId] = useState<RealmId>(1);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [compassOpen, setCompassOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [prefillDraft, setPrefillDraft] = useState<PrefillIntuitionDraft | null>(null);

  const socialRepo = useMemo(
    () =>
      new LocalSocialRepository({
        displayName: retention.compass.displayName,
        interests: retention.compass.interests,
      }),
    [],
  );
  const socialState = useSyncExternalStore(socialRepo.subscribe, socialRepo.getState, socialRepo.getState);
  const unreadCount = useMemo(
    () => socialState.rooms.reduce((acc, r) => acc + r.unreadCount, 0),
    [socialState.rooms],
  );

  // Persist neuro-retention & preferences cleanly
  useEffect(() => {
    localRetentionStorage.save(retention);
  }, [retention]);

  // Resolve circadian theme (Daylight Parchment vs Amber Dusk Sanctuary) and sync document classes
  const effectiveTheme = useMemo(
    () => resolveEffectiveTheme(retention.circadianMode),
    [retention.circadianMode],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', effectiveTheme === 'dusk');
    root.dataset.eyeRest = String(retention.eyeRestMode);
  }, [effectiveTheme, retention.eyeRestMode]);

  useEffect(() => {
    document.body.dataset.state = view;
  }, [view]);

  // Title screen keyboard quick-start (Enter / Space)
  useEffect(() => {
    if (view !== 'title' || compassOpen || socialOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
        e.preventDefault();
        setView('map');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, compassOpen, socialOpen]);

  // Derived map state
  const unlockedRealms = useMemo(() => {
    const map = {} as Record<RealmId, boolean>;
    for (const r of REALMS) {
      map[r.id] = isRealmUnlocked(retention, r.id);
    }
    return map;
  }, [retention]);

  const realmMastery = useMemo(() => {
    const map = {} as Record<RealmId, number>;
    for (const r of REALMS) {
      map[r.id] = realmMasteryRatio(retention, r.id);
    }
    return map;
  }, [retention]);

  const ambientCurrent = useMemo(() => pickAmbientCurrent(retention), [retention]);

  const selectedRealm = getRealm(selectedRealmId);
  const selectedRealmQuests = useMemo(() => getQuestsForRealm(selectedRealmId), [selectedRealmId]);
  const activeQuest = useMemo(() => (activeQuestId ? getQuestById(activeQuestId) ?? null : null), [activeQuestId]);
  const nextQuest = useMemo(() => (activeQuest ? getNextQuest(activeQuest.id) : null), [activeQuest]);

  const handleToggleDayDusk = () => {
    setRetention((prev) => ({
      ...prev,
      circadianMode: effectiveTheme === 'dusk' ? 'daylight' : 'dusk',
    }));
  };

  const handleChangeCircadianMode = (mode: CircadianMode) => {
    setRetention((prev) => ({ ...prev, circadianMode: mode }));
  };

  const handleToggleEyeRest = (enabled: boolean) => {
    setRetention((prev) => ({ ...prev, eyeRestMode: enabled }));
  };

  const handleToggleExplorerMode = (enabled: boolean) => {
    setRetention((prev) => ({ ...prev, explorerMode: enabled }));
  };

  const handleSaveCompass = (nextCompass: CompassProfile) => {
    setRetention((prev) => ({ ...prev, compass: nextCompass }));
    socialRepo.updateCurrentUser(nextCompass.displayName, nextCompass.interests);
  };

  const handleResetAllData = () => {
    localRetentionStorage.clear();
    setRetention(createInitialRetentionState());
    setSelectedRealmId(1);
    setActiveQuestId(null);
    setView('map');
  };

  const handleLaunchQuest = (quest: Quest) => {
    setSelectedRealmId(quest.realmId);
    setActiveQuestId(quest.id);
    setView('quest');
  };

  const handleCompleteQuest = useCallback((payload: QuestCompletionPayload) => {
    setRetention((prev) =>
      recordConceptPractice(prev, {
        conceptId: payload.quest.conceptId,
        questId: payload.quest.id,
        realmId: payload.quest.realmId,
        completed: true,
        adjustments: payload.adjustments,
        durationMs: payload.durationMs,
        usedOracleNudge: payload.usedOracleNudge,
        misconceptionTag: payload.quest.simulation.misconceptionTag,
      }),
    );
  }, []);

  const handleRecordExploration = useCallback(
    (quest: Quest, adjustments: number, durationMs: number, usedOracle: boolean) => {
      setRetention((prev) =>
        recordConceptPractice(prev, {
          conceptId: quest.conceptId,
          questId: quest.id,
          realmId: quest.realmId,
          completed: false,
          adjustments,
          durationMs,
          usedOracleNudge: usedOracle,
          misconceptionTag: quest.simulation.misconceptionTag,
        }),
      );
    },
    [],
  );

  const handleShareIntuition = useCallback((payload: ShareIntuitionPayload) => {
    setPrefillDraft({
      id: Date.now(),
      text: payload.text,
      latex: payload.latex,
    });
    setSocialOpen(true);
  }, []);

  const totalCompleted = retention.completedQuestIds.length;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* ====================================================================
          VIEW 1: SERENE TITLE STAGE (Full-bleed Painterly Mediterranean Canvas)
          ==================================================================== */}
      {view === 'title' && (
        <main className="relative flex min-h-screen flex-col overflow-hidden">
          {/* Live full-bleed Mediterranean Archipelago behind the title */}
          <div className="pointer-events-none absolute inset-0">
            <MediterraneanMapCanvas
              theme={effectiveTheme}
              eyeRestMode={retention.eyeRestMode}
              selectedRealmId={selectedRealmId}
              unlockedRealms={unlockedRealms}
              realmMastery={realmMastery}
              ambientCurrent={null}
              onSelectRealm={() => {}}
              showLabels={false}
            />
            {/* Gentle editorial parchment/dusk veil on left half so title reads effortlessly */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  effectiveTheme === 'dusk'
                    ? 'linear-gradient(110deg, rgba(26,25,22,0.96) 0%, rgba(26,25,22,0.84) 40%, rgba(26,25,22,0.22) 72%, rgba(26,25,22,0.06) 100%)'
                    : 'linear-gradient(110deg, rgba(245,239,226,0.96) 0%, rgba(245,239,226,0.86) 40%, rgba(245,239,226,0.24) 72%, rgba(245,239,226,0.04) 100%)',
              }}
            />
          </div>

          {/* Quiet top-right lighting toggle (single subtle button on title screen) */}
          <div className="relative z-10 flex items-center justify-end gap-2 px-6 pt-5 sm:px-10">
            <button
              type="button"
              onClick={handleToggleDayDusk}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-[var(--accent-gold)]"
              aria-label={`Switch to ${effectiveTheme === 'dusk' ? 'Warm Aegean Parchment daylight' : 'Amber Dusk Sanctuary evening'} theme`}
            >
              {effectiveTheme === 'dusk' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden /> Daylight Parchment
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden /> Amber Dusk
                </>
              )}
            </button>
          </div>

          {/* Centered-left calm editorial hero with breathing room */}
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-16 pt-8 sm:px-10">
            <div className="max-w-xl">
              <p className="font-ui text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-primary)]">
                Six Realms · Thirty-Six Visual Discoveries
              </p>
              <h1 className="font-display mt-3 text-5xl font-bold leading-[1.06] tracking-tight text-[var(--text-primary)] sm:text-7xl">
                Odyssey
                <span className="mt-1 block text-3xl font-semibold text-[var(--accent-gold)] sm:text-4xl">
                  The Path to Ithaca
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--text-secondary)]">
                Master Calculus I through curiosity, waves, and geometry—never timed quizzes. Feel limits, slopes, and
                accumulating tides with your hands first, then watch the equations emerge naturally.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-start="true"
                  data-testid="begin-voyage-btn"
                  onClick={() => setView('map')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-[var(--accent-primary-ink)] shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-primary-hover)]"
                >
                  Begin Voyage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleExplorerMode(true);
                    setView('map');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-gold)]"
                >
                  <Map className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden />
                  Explore All 36 Quests
                </button>
                <button
                  type="button"
                  onClick={() => setCompassOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                >
                  <Compass className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
                  Chart Your Compass
                </button>
              </div>

              <p className="mt-6 text-xs text-[var(--text-secondary)]">
                Zero timers · Zero harsh failure screens · Warm ocular-ergonomic palette
              </p>
            </div>
          </div>
        </main>
      )}

      {/* ====================================================================
          PERSISTENT MINIMAL TOP BAR FOR MAP & QUEST VIEWS (Strictly <= 4 controls)
          ==================================================================== */}
      {view !== 'title' && (
        <header className="sticky top-0 z-30 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-2.5 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            {/* Brand + Unboxed voyage progress */}
            <button
              type="button"
              onClick={() => setView('map')}
              className="flex items-baseline gap-2.5 text-left"
            >
              <span className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Odyssey
              </span>
              <span className="hidden text-xs tabular-nums text-[var(--text-secondary)] sm:inline">
                {totalCompleted} / {QUESTS_36.length} charted
              </span>
            </button>

            {/* Exactly 4 clean HUD controls: Explorer, Theme/Eye-Rest, Compass, Community */}
            <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Voyage controls">
              <button
                type="button"
                onClick={() => handleToggleExplorerMode(!retention.explorerMode)}
                data-testid="explorer-toggle-btn"
                aria-pressed={retention.explorerMode}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  retention.explorerMode
                    ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] text-[var(--text-primary)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Unlock all 6 Realms and 36 Quests immediately"
              >
                <Map className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden />
                <span className="hidden sm:inline">{retention.explorerMode ? 'Explorer On' : 'Explorer'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleDayDusk}
                data-testid="theme-toggle-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-gold)]"
                title={effectiveTheme === 'dusk' ? 'Switch to Warm Aegean Parchment' : 'Switch to Amber Dusk Sanctuary'}
              >
                {effectiveTheme === 'dusk' ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden />
                    <span className="hidden sm:inline">Daylight</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden />
                    <span className="hidden sm:inline">Dusk</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCompassOpen(true)}
                data-testid="compass-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]"
              >
                <Compass className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden />
                <span className="hidden sm:inline">Compass</span>
                {retention.eyeRestMode && <Eye className="h-3 w-3 text-[var(--accent-gold)]" aria-label="Eye-Rest active" />}
              </button>

              <button
                type="button"
                onClick={() => setSocialOpen(true)}
                data-testid="community-btn"
                className="relative inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]"
              >
                <Users className="h-3.5 w-3.5 text-[var(--accent-primary)]" aria-hidden />
                <span className="hidden sm:inline">Community</span>
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-gold)] px-1 text-[10px] font-bold text-[#1A1916]">
                    {unreadCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* ====================================================================
          VIEW 2: MEDITERRANEAN SEA CHART & 6-STAGE SPIRAL DOCK
          ==================================================================== */}
      {view === 'map' && (
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
          {/* Silent HLR Ambient Sea Current whisper (never a nagging review popup) */}
          {ambientCurrent && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
                {ambientCurrent.whisperText}
              </span>
              <button
                type="button"
                onClick={() => {
                  const q = getQuestById(ambientCurrent.questId);
                  if (q) handleLaunchQuest(q);
                }}
                className="font-semibold text-[var(--accent-primary)] hover:underline"
              >
                Ride Current →
              </button>
            </div>
          )}

          {/* Painterly Mediterranean Archipelago Map Canvas */}
          <div className="relative h-[400px] w-full overflow-hidden rounded-2xl border border-[var(--border-hairline)] shadow-[var(--shadow-soft)] sm:h-[440px]">
            <MediterraneanMapCanvas
              theme={effectiveTheme}
              eyeRestMode={retention.eyeRestMode}
              selectedRealmId={selectedRealmId}
              unlockedRealms={unlockedRealms}
              realmMastery={realmMastery}
              ambientCurrent={ambientCurrent}
              onSelectRealm={setSelectedRealmId}
            />
          </div>

          {/* Selected Realm 6-Stage Spiral Dock */}
          <section
            aria-label={`Realm ${selectedRealm.numeral} quests`}
            className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-hairline)] pb-3.5">
              <div>
                <p className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                  Realm {selectedRealm.numeral} · {selectedRealm.calculusUnit}
                </p>
                <h2 className="font-display mt-0.5 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                  {selectedRealm.name}
                  <span className="ml-2 font-sans text-sm font-normal text-[var(--text-secondary)]">
                    — {selectedRealm.subtitle}
                  </span>
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">
                  {selectedRealm.archetypeHooks[retention.compass.archetype]}
                </p>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Companion: <span className="font-semibold text-[var(--text-primary)]">{selectedRealm.companion.name}</span>{' '}
                ({selectedRealm.companion.role})
              </div>
            </div>

            {/* 6 Cognitive Stages Grid */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedRealmQuests.map((quest) => {
                const unlocked = isQuestUnlocked(retention, quest.realmId, quest.stage);
                const completed = retention.completedQuestIds.includes(quest.id);
                const meta = STAGE_META[quest.stage];

                return (
                  <button
                    key={quest.id}
                    type="button"
                    disabled={!unlocked}
                    data-testid={`quest-card-${quest.id}`}
                    onClick={() => unlocked && handleLaunchQuest(quest)}
                    className={`group flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                      !unlocked
                        ? 'cursor-not-allowed border-[var(--border-hairline)] bg-[var(--bg-surface)] opacity-60'
                        : completed
                          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-soft)] hover:brightness-[0.98]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-canvas)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-ui font-semibold text-[var(--accent-primary)]">
                          {meta.shortLabel}
                        </span>
                        {completed ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[var(--accent-gold)]">
                            <Check className="h-3.5 w-3.5" aria-hidden /> Charted
                          </span>
                        ) : !unlocked ? (
                          <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                            <Lock className="h-3 w-3" aria-hidden /> Complete prior stage
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)]">
                            Enter →
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">{quest.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {quest.conceptName} · {meta.pedagogyNote}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* ====================================================================
          VIEW 3: INTERACTIVE ZERO-TENSION QUEST WORKSPACE
          ==================================================================== */}
      {view === 'quest' && activeQuest && (
        <QuestExperience
          quest={activeQuest}
          nextQuest={nextQuest}
          theme={effectiveTheme}
          eyeRestMode={retention.eyeRestMode}
          compass={retention.compass}
          alreadyCompleted={retention.completedQuestIds.includes(activeQuest.id)}
          onCompleteQuest={handleCompleteQuest}
          onRecordExploration={handleRecordExploration}
          onSelectQuest={handleLaunchQuest}
          onBackToMap={() => setView('map')}
          onOpenCompass={() => setCompassOpen(true)}
          onShareIntuition={handleShareIntuition}
        />
      )}

      {/* Consent-First Compass & Eye-Comfort Modal */}
      <CompassModal
        open={compassOpen}
        compass={retention.compass}
        circadianMode={retention.circadianMode}
        eyeRestMode={retention.eyeRestMode}
        explorerMode={retention.explorerMode}
        onClose={() => setCompassOpen(false)}
        onSaveCompass={handleSaveCompass}
        onChangeCircadianMode={handleChangeCircadianMode}
        onToggleEyeRest={handleToggleEyeRest}
        onToggleExplorerMode={handleToggleExplorerMode}
        onResetAllData={handleResetAllData}
      />

      {/* Collapsible Study Community Drawer */}
      <SocialDrawer
        repo={socialRepo}
        open={socialOpen}
        onClose={() => setSocialOpen(false)}
        prefillDraft={prefillDraft}
      />
    </div>
  );
}

export default App;
