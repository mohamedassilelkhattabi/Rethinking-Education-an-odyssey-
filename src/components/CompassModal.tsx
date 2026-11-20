import { Compass, Eye, Moon, ShieldCheck, Sparkles, Sun, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { CircadianMode, CompassProfile, MotivationArchetype } from '../curriculum/types';
import { MOTIVATION_ARCHETYPES, TEEN_INTEREST_OPTIONS } from '../engine/retentionEngine';

interface CompassModalProps {
  open: boolean;
  compass: CompassProfile;
  circadianMode: CircadianMode;
  eyeRestMode: boolean;
  explorerMode: boolean;
  onClose: () => void;
  onSaveCompass: (next: CompassProfile) => void;
  onChangeCircadianMode: (mode: CircadianMode) => void;
  onToggleEyeRest: (enabled: boolean) => void;
  onToggleExplorerMode: (enabled: boolean) => void;
  onResetAllData: () => void;
}

export function CompassModal({
  open,
  compass,
  circadianMode,
  eyeRestMode,
  explorerMode,
  onClose,
  onSaveCompass,
  onChangeCircadianMode,
  onToggleEyeRest,
  onToggleExplorerMode,
  onResetAllData,
}: CompassModalProps) {
  const [draft, setDraft] = useState<CompassProfile>(compass);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open) return null;

  const toggleInterest = (tag: string) => {
    setDraft((prev) => {
      const exists = prev.interests.includes(tag);
      const next = exists ? prev.interests.filter((t) => t !== tag) : [...prev.interests, tag].slice(0, 6);
      return { ...prev, interests: next };
    });
  };

  const handleSave = () => {
    onSaveCompass({
      ...draft,
      updatedAt: Date.now(),
    });
    onClose();
  };

  const dialLabel =
    draft.calmChallengeDial <= 35
      ? 'Gentle Sanctuary — richer visual cues and calm pacing'
      : draft.calmChallengeDial <= 70
        ? 'Balanced Voyage — clean intuition with light guidance'
        : 'Open Explorer — minimal hints, wider discovery freedom';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1916]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chart Your Compass"
    >
      <div className="scrollbar-thin flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]">
              <Compass className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold leading-tight text-[var(--text-primary)]">
                Chart Your Compass
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Tune pacing, motivation style, eye-comfort lighting, and optional real-world transfer interests.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-2 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            aria-label="Close Compass settings"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Scrollable body */}
        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* 1. Eye-Comfort Circadian & Low-Stimulation Settings */}
          <section className="space-y-3">
            <h3 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
              Ocular Ergonomics & Lighting
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'daylight', label: 'Aegean Parchment', desc: 'Warm low-glare daylight', icon: Sun },
                  { id: 'dusk', label: 'Amber Dusk', desc: 'Low-blue evening comfort', icon: Moon },
                  { id: 'auto', label: 'Auto Circadian', desc: 'Shifts at 7 PM dusk', icon: Sparkles },
                ] as const
              ).map(({ id, label, desc, icon: Icon }) => {
                const active = circadianMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangeCircadianMode(id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      active
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden />
                    <p className="mt-1.5 text-xs font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Eye className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Low-Stimulation / Eye-Rest Mode</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Pauses subtle water animation and softens contrast for extended calm study sessions.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={eyeRestMode}
                onChange={(e) => onToggleEyeRest(e.target.checked)}
                aria-label="Toggle Low-Stimulation Eye-Rest Mode"
                className="h-4 w-4 accent-[var(--accent-primary)]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Explorer Mode (Unlock All 36 Quests)</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Jump directly into any Calculus I Realm or Stage for previewing or non-linear exploration.
                </p>
              </div>
              <input
                type="checkbox"
                checked={explorerMode}
                onChange={(e) => onToggleExplorerMode(e.target.checked)}
                aria-label="Toggle Explorer Mode"
                className="h-4 w-4 accent-[var(--accent-primary)]"
              />
            </div>
          </section>

          {/* 2. Calm vs. Challenge Dial */}
          <section className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Calm vs. Challenge Dial
              </h3>
              <span className="text-xs font-semibold tabular-nums text-[var(--accent-gold)]">
                {draft.calmChallengeDial} / 100
              </span>
            </div>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
              <div className="mb-2 flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Gentle Sanctuary</span>
                <span>Open Explorer</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={2}
                value={draft.calmChallengeDial}
                onChange={(e) => setDraft((p) => ({ ...p, calmChallengeDial: Number(e.target.value) }))}
                className="odyssey-slider"
                aria-label="Calm versus Challenge Dial"
              />
              <p className="mt-2.5 text-xs text-[var(--text-secondary)]">{dialLabel}</p>
            </div>
          </section>

          {/* 3. Player Motivation Archetype (evidence-based Octalysis/Hexad — NO VARK) */}
          <section className="space-y-2.5">
            <h3 className="font-ui text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
              Voyage Motivation Style
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MOTIVATION_ARCHETYPES.map((arch) => {
                const selected = draft.archetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, archetype: arch.id as MotivationArchetype }))}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-soft)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{arch.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-[var(--text-secondary)]">{arch.tagline}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Consent-First AI Personalization & Teen Interests */}
          <section className="space-y-3 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-primary)]" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Transparent Privacy & AI Personalization Consent
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                  Your display name and chosen interests stay strictly in your browser and are only sent when you ask
                  Stage 4 quests to re-skin a Calculus I puzzle into your world. No ads, no tracking, wipe anytime.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between gap-3 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs">
                <span className="font-medium text-[var(--text-primary)]">
                  I consent to use my selected interests to personalize Stage 4 Real-World Transfer quests
                </span>
                <input
                  type="checkbox"
                  checked={draft.consentGiven && draft.allowAiTransfer}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      consentGiven: e.target.checked,
                      allowAiTransfer: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--accent-primary)]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs">
                <span className="font-medium text-[var(--text-primary)]">
                  Allow optional AI Oracle whispers when I click “Ask the Oracle”
                </span>
                <input
                  type="checkbox"
                  checked={draft.allowOracleNudges}
                  onChange={(e) => setDraft((p) => ({ ...p, allowOracleNudges: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--accent-primary)]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <div>
                <label htmlFor="compass-name" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Voyager Name (for companions & Study Hub)
                </label>
                <input
                  id="compass-name"
                  type="text"
                  value={draft.displayName}
                  onChange={(e) => setDraft((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="Voyager"
                  className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label htmlFor="compass-custom-interest" className="block text-xs font-medium text-[var(--text-secondary)]">
                  Custom Interest or Creator Topic (optional)
                </label>
                <input
                  id="compass-custom-interest"
                  type="text"
                  value={draft.customInterest}
                  onChange={(e) => setDraft((p) => ({ ...p, customInterest: e.target.value }))}
                  placeholder="e.g. Lo-fi beats, Rocket League, Skateboarding"
                  className="mt-1 w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Pick up to 6 real-world worlds you enjoy (ages 15–17 scenarios):
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TEEN_INTEREST_OPTIONS.map((tag) => {
                  const active = draft.interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        active
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-primary-ink)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Local data wipe */}
          <section className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] pt-4">
            <span className="text-xs text-[var(--text-secondary)]">
              Want a fresh voyage? Clear all local progress and preferences anytime.
            </span>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-[var(--border-hairline)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetAllData();
                    setConfirmReset(false);
                    onClose();
                  }}
                  className="rounded-lg bg-[var(--accent-terracotta)] px-3 py-1 text-xs font-semibold text-[#FAF6EC]"
                >
                  Confirm Clear
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-terracotta)] hover:text-[var(--accent-terracotta)]"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Clear Local Data
              </button>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-end gap-2.5 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            data-testid="save-compass-btn"
            className="rounded-xl bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-[var(--accent-primary-ink)] transition hover:bg-[var(--accent-primary-hover)]"
          >
            Save Compass
          </button>
        </footer>
      </div>
    </div>
  );
}
