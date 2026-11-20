import { Brain, Check, Clock, Download, RefreshCw, ShieldCheck, Sparkles, Trash2, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getQuestion } from '../data/questions';
import { getAllUnitMastery, getDueReviews, overallRetentionStats } from './spacedRepetition';
import type { ConsentSettings, MasteryMap, UserProfile } from './types';

type Tab = 'consent' | 'profile' | 'mastery';

const HOBBY_OPTIONS = [
  'Gaming',
  'Video Editing',
  'Music Production',
  'Coding & Robotics',
  'Digital Art',
  'Skateboarding',
  'Fitness & Running',
  'Filmmaking',
  'Sneakers & Design',
  'Astronomy & Space',
];

const CREATOR_OPTIONS = [
  'MrBeast',
  'Mark Rober',
  '3Blue1Brown',
  'Marques Brownlee',
  'Emma Chamberlain',
  'Veritasium',
  'Ludwig',
  'Cleo Abram',
];

const MUSIC_OPTIONS = ['Lo-Fi Beats', 'Hip-Hop', 'Indie Pop', 'Electronic / EDM', 'Alt Rock', 'K-Pop', 'R&B', 'Classical'];

const SPORT_GAME_OPTIONS = [
  'Valorant',
  'Minecraft',
  'Rocket League',
  'Basketball',
  'Soccer',
  'Track & Field',
  'Fortnite',
  'Chess',
];

const GOAL_OPTIONS = [
  'Ace AP Calculus AB',
  'Build an indie game',
  'Study engineering or CS',
  'Grow a YouTube channel',
  'Make varsity team',
  'Produce an EP',
];

const PLATFORM_PACKS: {
  platform: 'youtube' | 'instagram' | 'spotify';
  label: string;
  packName: string;
  tags: string[];
}[] = [
  {
    platform: 'youtube',
    label: 'YouTube',
    packName: 'STEM, Tech & Creator Analytics',
    tags: ['Viral Video Growth Curves', 'Mark Rober Engineering Builds', 'Esports Frame-Rate Physics'],
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    packName: 'Reels, Photography & Streetwear',
    tags: ['Camera Lens Depth-of-Field', 'Reels Retention & Engagement Rate', 'Drop Resell Pricing'],
  },
  {
    platform: 'spotify',
    label: 'Spotify',
    packName: 'Audio Waves & Concert Acoustics',
    tags: ['BPM Tempo Curves', 'Sound Wave Harmonics', 'Festival Crowd Energy'],
  },
];

interface PersonalizationModalProps {
  initialTab?: Tab;
  consent: ConsentSettings;
  profile: UserProfile;
  mastery: MasteryMap;
  onSaveConsent: (next: ConsentSettings) => void;
  onSaveProfile: (next: UserProfile) => void;
  onClearAll: () => void;
  onStartReviewEncounter: (questionId: number) => void;
  onClose: () => void;
}

function toggleItem(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function formatMs(ms: number): string {
  if (!ms) return '—';
  const sec = Math.round(ms / 1000);
  return sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export function PersonalizationModal({
  initialTab,
  consent,
  profile,
  mastery,
  onSaveConsent,
  onSaveProfile,
  onClearAll,
  onStartReviewEncounter,
  onClose,
}: PersonalizationModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab ?? (consent.decided ? 'profile' : 'consent'));
  const [draftConsent, setDraftConsent] = useState<ConsentSettings>(consent);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customPlatform, setCustomPlatform] = useState<'youtube' | 'instagram' | 'spotify'>('youtube');
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const unitMastery = useMemo(() => getAllUnitMastery(mastery), [mastery]);
  const dueReviews = useMemo(() => getDueReviews(mastery), [mastery]);
  const overall = useMemo(() => overallRetentionStats(mastery), [mastery]);

  const handleSaveConsent = () => {
    const next: ConsentSettings = { ...draftConsent, decided: true, updatedAt: Date.now() };
    setDraftConsent(next);
    onSaveConsent(next);
    setSavedBanner('Privacy preferences saved.');
    if (next.allowAiPersonalization) setTab('profile');
  };

  const handleSaveProfile = () => {
    onSaveProfile(draftProfile);
    if (!draftConsent.decided) {
      const nextConsent = { ...draftConsent, decided: true, updatedAt: Date.now() };
      setDraftConsent(nextConsent);
      onSaveConsent(nextConsent);
    }
    setSavedBanner('Interest profile saved — AI Calculus scenarios will now adapt to your world.');
  };

  const importPack = (platform: 'youtube' | 'instagram' | 'spotify', tags: string[]) => {
    setDraftProfile((prev) => {
      const existing = prev.importedPlatforms[platform];
      const merged = Array.from(new Set([...existing, ...tags]));
      return {
        ...prev,
        importedPlatforms: { ...prev.importedPlatforms, [platform]: merged },
      };
    });
    setSavedBanner(`Imported ${tags.length} ${platform} interest tags.`);
  };

  const addCustomPlatformTag = () => {
    const cleaned = customTagInput.trim();
    if (!cleaned) return;
    setDraftProfile((prev) => ({
      ...prev,
      importedPlatforms: {
        ...prev.importedPlatforms,
        [customPlatform]: Array.from(new Set([...prev.importedPlatforms[customPlatform], cleaned])),
      },
    }));
    setCustomTagInput('');
  };

  const removePlatformTag = (platform: 'youtube' | 'instagram' | 'spotify', tag: string) => {
    setDraftProfile((prev) => ({
      ...prev,
      importedPlatforms: {
        ...prev.importedPlatforms,
        [platform]: prev.importedPlatforms[platform].filter((t) => t !== tag),
      },
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060a12]/85 p-3 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="personalize-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#d8af63]/45 bg-[#101826] text-[#f2e8cf] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d8af63]/20 bg-[#152236] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8af63]/15 text-[#f1d49a]">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 id="personalize-modal-title" className="font-display text-lg font-bold tracking-wide text-[#f1d49a]">
                Personalize Calculus I & Retention
              </h2>
              <p className="text-xs text-[#c9b98a]">
                Consent-first teen scenario adaptation (ages 15–17) · SM-2 Spaced Repetition
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d8af63]/30 bg-[#0d1522] p-2 text-[#f0e2bf] hover:border-[#d8af63]"
            aria-label="Close personalization panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-[#d8af63]/20 bg-[#0d1522] px-5" role="tablist">
          {(
            [
              ['consent', 'Privacy & Consent', ShieldCheck],
              ['profile', 'Interest & Creator Profile', User],
              ['mastery', `Retention & Reviews (${dueReviews.length})`, Brain],
            ] as const
          ).map(([id, label, Icon]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(id);
                  setSavedBanner(null);
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold tracking-wide transition ${
                  active ? 'border-[#d8af63] text-[#f1d49a]' : 'border-transparent text-[#9db0c6] hover:text-[#f0e2bf]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        {savedBanner && (
          <div className="flex items-center justify-between border-b border-[#4c9b78]/40 bg-[#14332a] px-5 py-2.5 text-xs text-[#b5f2d6]">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" aria-hidden /> {savedBanner}
            </span>
            <button type="button" onClick={() => setSavedBanner(null)} className="text-[#8ad9b4] hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Body */}
        <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
          {tab === 'consent' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#5fb8c4]/30 bg-[#132538] p-4">
                <h3 className="text-sm font-bold text-[#f1d49a]">Your data stays yours — strictly for Calculus I</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#d7e2ee]">
                  Before we personalize any math scenario, you choose exactly what Odyssey can use. Your preferences and study history are stored locally on your device. When you click <strong>Personalize with AI</strong> on a question, only your selected interest tags and that Calculus I problem are sent to our AI generator to craft a relevant real-world scenario (e.g., viral video velocity, gaming physics, or sound waves).
                </p>
              </div>

              <div className="space-y-3">
                {(
                  [
                    {
                      key: 'allowAiPersonalization' as const,
                      title: 'AI Real-World Problem Rewriting (Ages 15–17)',
                      desc: 'Allows Gemini to reframe Calculus I problems into teen-relevant scenarios matching your hobbies, sports, music, and goals.',
                    },
                    {
                      key: 'allowInterestImport' as const,
                      title: 'Optional Platform Niche Tag Import (YouTube / Instagram / Spotify)',
                      desc: 'Lets you import or paste public creator/topic tags from platforms you enjoy. No passwords or private account access required.',
                    },
                    {
                      key: 'allowMasteryTracking' as const,
                      title: 'Local Spaced-Repetition & Retention Tracking',
                      desc: 'Tracks your accuracy, solve time, and weak concepts per Calculus unit locally to schedule smart review encounters.',
                    },
                  ] as const
                ).map((item) => {
                  const enabled = draftConsent[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#d8af63]/20 bg-[#152033] p-4 hover:border-[#d8af63]/45"
                    >
                      <div>
                        <span className="block text-sm font-semibold text-[#f5ebd2]">{item.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-[#a8bad0]">{item.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setDraftConsent((c) => ({ ...c, [item.key]: e.target.checked }))}
                        className="mt-1 h-5 w-5 shrink-0 accent-[#d8af63]"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setDraftConsent({
                      decided: true,
                      allowAiPersonalization: false,
                      allowInterestImport: false,
                      allowMasteryTracking: false,
                      updatedAt: Date.now(),
                    });
                    setSavedBanner('All local profile, cached AI variants, and mastery history have been wiped.');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#c64f4f]/50 bg-[#2a1418] px-3.5 py-2 text-xs font-semibold text-[#ffb3a8] hover:bg-[#3a1a20]"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Wipe my local data
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const minimal: ConsentSettings = {
                        decided: true,
                        allowAiPersonalization: false,
                        allowInterestImport: false,
                        allowMasteryTracking: false,
                        updatedAt: Date.now(),
                      };
                      setDraftConsent(minimal);
                      onSaveConsent(minimal);
                      onClose();
                    }}
                    className="rounded-lg border border-[#d8af63]/30 bg-[#152033] px-4 py-2 text-xs font-semibold text-[#c9b98a] hover:text-[#f0e2bf]"
                  >
                    Play Classic Mode (No Personalization)
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConsent}
                    className="rounded-lg bg-[#d8af63] px-4 py-2 text-xs font-bold text-[#141008] hover:bg-[#f1d49a]"
                  >
                    Save Permissions & Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-6">
              {!draftConsent.allowAiPersonalization && (
                <div className="rounded-xl border border-[#e09d43]/40 bg-[#2a1f12] p-3.5 text-xs text-[#f6d9a8]">
                  AI Personalization is currently turned off in Privacy & Consent. Enable it there to rewrite Calculus I questions with your profile.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className="block text-xs font-semibold uppercase tracking-wider text-[#9db0c6]">
                    Display Name (also used in Social Hub)
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={draftProfile.displayName}
                    maxLength={28}
                    onChange={(e) => setDraftProfile((p) => ({ ...p, displayName: e.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-[#d8af63]/30 bg-[#0b1320] px-3 py-2 text-sm text-[#f5ebd2] focus:border-[#d8af63] focus:outline-none"
                    placeholder="e.g., Maya, Jordan, Alex"
                  />
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#9db0c6]">Age Group</span>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {(['15', '16', '17'] as const).map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setDraftProfile((p) => ({ ...p, ageBracket: age }))}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                          draftProfile.ageBracket === age
                            ? 'border-[#d8af63] bg-[#d8af63]/20 text-[#f1d49a]'
                            : 'border-[#d8af63]/20 bg-[#0b1320] text-[#9db0c6] hover:text-[#f0e2bf]'
                        }`}
                      >
                        Age {age}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multi-select interest groups */}
              {(
                [
                  { label: 'Hobbies & Creative Passions', field: 'hobbies' as const, options: HOBBY_OPTIONS },
                  { label: 'Sports & Games You Play', field: 'sportsAndGames' as const, options: SPORT_GAME_OPTIONS },
                  { label: 'Favorite Creators & Channels', field: 'favoriteCreators' as const, options: CREATOR_OPTIONS },
                  { label: 'Music Vibes', field: 'musicGenres' as const, options: MUSIC_OPTIONS },
                  { label: 'Personal Goals & Values', field: 'personalGoals' as const, options: GOAL_OPTIONS },
                ] as const
              ).map((group) => (
                <div key={group.field}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9db0c6]">{group.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.options.map((opt) => {
                      const active = draftProfile[group.field].includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setDraftProfile((p) => ({ ...p, [group.field]: toggleItem(p[group.field], opt) }))}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? 'border-[#5fb8c4] bg-[#2f8190]/35 text-[#eafcff]'
                              : 'border-[#d8af63]/20 bg-[#152033] text-[#c3d0df] hover:border-[#d8af63]/45'
                          }`}
                        >
                          {active ? '✓ ' : ''}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Import External Platform Interest Tags */}
              <div className="rounded-xl border border-[#5fb8c4]/30 bg-[#112031] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#eafcff]">
                      <Download className="h-4 w-4 text-[#5fb8c4]" aria-hidden /> Import Platform Interest Tags
                    </h3>
                    <p className="mt-0.5 text-xs text-[#9eb8cc]">
                      Quick-connect public niche tags from YouTube, Instagram, or Spotify — or add your own favorite channel/niche tags below.
                    </p>
                  </div>
                  {!draftConsent.allowInterestImport && (
                    <span className="text-xs font-semibold text-[#ffb347]">Enable in Privacy & Consent to include in AI prompts</span>
                  )}
                </div>

                <div className="mt-3 grid gap-2.5 md:grid-cols-3">
                  {PLATFORM_PACKS.map((pack) => (
                    <div key={pack.platform} className="rounded-lg border border-[#d8af63]/20 bg-[#0c1624] p-3">
                      <p className="text-xs font-bold text-[#f1d49a]">{pack.label}</p>
                      <p className="mt-0.5 text-[11px] text-[#9eb8cc]">{pack.packName}</p>
                      <button
                        type="button"
                        disabled={!draftConsent.allowInterestImport}
                        onClick={() => importPack(pack.platform, pack.tags)}
                        className="mt-2.5 w-full rounded-md border border-[#5fb8c4]/50 bg-[#19384a] px-2.5 py-1.5 text-[11px] font-semibold text-[#eafcff] hover:bg-[#224b62] disabled:opacity-40"
                      >
                        Import {pack.label} Pack
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    aria-label="Platform for custom tag"
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value as 'youtube' | 'instagram' | 'spotify')}
                    className="rounded-lg border border-[#d8af63]/30 bg-[#0b1320] px-2.5 py-1.5 text-xs text-[#f0e2bf]"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="spotify">Spotify</option>
                  </select>
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomPlatformTag();
                      }
                    }}
                    placeholder="Add a creator, channel, or niche tag (e.g. MKBHD, speedrunning, sneaker drops)..."
                    className="min-w-[220px] flex-1 rounded-lg border border-[#d8af63]/30 bg-[#0b1320] px-3 py-1.5 text-xs text-[#f0e2bf] focus:border-[#d8af63] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!draftConsent.allowInterestImport}
                    onClick={addCustomPlatformTag}
                    className="rounded-lg bg-[#2f8190] px-3.5 py-1.5 text-xs font-semibold text-[#eafcff] hover:bg-[#3a96a7] disabled:opacity-40"
                  >
                    Add Tag
                  </button>
                </div>

                {(['youtube', 'instagram', 'spotify'] as const).some((p) => draftProfile.importedPlatforms[p].length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(['youtube', 'instagram', 'spotify'] as const).flatMap((platform) =>
                      draftProfile.importedPlatforms[platform].map((tag) => (
                        <span
                          key={`${platform}:${tag}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#5fb8c4]/35 bg-[#152d3e] px-2.5 py-1 text-[11px] text-[#dff6fa]"
                        >
                          <strong className="uppercase text-[#5fb8c4]">{platform.slice(0, 2)}</strong> {tag}
                          <button
                            type="button"
                            onClick={() => removePlatformTag(platform, tag)}
                            aria-label={`Remove ${tag}`}
                            className="text-[#9eb8cc] hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      )),
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="profile-notes" className="block text-xs font-semibold uppercase tracking-wider text-[#9db0c6]">
                  Anything else you want woven into your math problems? (Optional)
                </label>
                <textarea
                  id="profile-notes"
                  rows={2}
                  value={draftProfile.customNotes}
                  onChange={(e) => setDraftProfile((p) => ({ ...p, customNotes: e.target.value }))}
                  placeholder="e.g., I'm training for a 5K, learning Blender 3D, and building a Discord bot..."
                  className="mt-1.5 w-full rounded-lg border border-[#d8af63]/30 bg-[#0b1320] px-3 py-2 text-sm text-[#f5ebd2] focus:border-[#d8af63] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#d8af63] px-5 py-2.5 text-xs font-bold text-[#141008] hover:bg-[#f1d49a]"
                >
                  <Check className="h-4 w-4" /> Save Interest Profile
                </button>
              </div>
            </div>
          )}

          {tab === 'mastery' && (
            <div className="space-y-5">
              {/* Summary row */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-[#d8af63]/20 bg-[#152033] p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-[#9db0c6]">Problems Practiced</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#f1d49a]">
                    {overall.attemptedUnique}/{overall.totalCurriculum}
                  </p>
                </div>
                <div className="rounded-xl border border-[#d8af63]/20 bg-[#152033] p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-[#9db0c6]">Overall Accuracy</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#7ee08a]">{overall.accuracyPct}%</p>
                </div>
                <div className="rounded-xl border border-[#d8af63]/20 bg-[#152033] p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-[#9db0c6]">Due For Review</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#5fb8c4]">{overall.dueCount}</p>
                </div>
                <div className="rounded-xl border border-[#d8af63]/20 bg-[#152033] p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-[#9db0c6]">Weak Concepts</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-[#ff9d8f]">{overall.weakCount}</p>
                </div>
              </div>

              {/* Scheduled Spaced-Repetition Encounters */}
              <div className="rounded-xl border border-[#5fb8c4]/30 bg-[#112031] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#eafcff]">
                      <RefreshCw className="h-4 w-4 text-[#5fb8c4]" aria-hidden /> Scheduled Review Encounters
                    </h3>
                    <p className="mt-0.5 text-xs text-[#9eb8cc]">
                      Practice weak or overdue Calculus I concepts without risking chapter survival health.
                    </p>
                  </div>
                  {dueReviews.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onStartReviewEncounter(dueReviews[0].questionId)}
                      className="rounded-lg bg-[#2f8190] px-3.5 py-2 text-xs font-bold text-[#eafcff] hover:bg-[#3d98a9]"
                    >
                      Launch Next Review
                    </button>
                  )}
                </div>

                {dueReviews.length === 0 ? (
                  <p className="mt-3 text-xs text-[#a8bad0]">
                    No reviews due right now. Solve Calculus I challenges in the world and Odyssey will schedule smart recall reviews automatically.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-[#d8af63]/15">
                    {dueReviews.slice(0, 6).map((rec) => {
                      const q = getQuestion(rec.questionId);
                      const acc = Math.round((rec.correct / Math.max(1, rec.attempts)) * 100);
                      return (
                        <li key={rec.questionId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                          <div>
                            <p className="text-sm font-semibold text-[#f5ebd2]">
                              Unit {rec.chapterId} · {q.title}
                            </p>
                            <p className="text-xs text-[#9db0c6]">
                              Accuracy {acc}% · Avg solve {formatMs(rec.avgSolveMs)} · {rec.weak ? 'Needs reinforcement' : 'Due for recall'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onStartReviewEncounter(rec.questionId)}
                            className="rounded-md border border-[#d8af63]/40 bg-[#1a2940] px-3 py-1.5 text-xs font-semibold text-[#f1d49a] hover:border-[#d8af63]"
                          >
                            Review Now
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Per-Unit Breakdown */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9db0c6]">Calculus I Curriculum Mastery (Units 1–6)</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {unitMastery.map((u) => {
                    const pct = Math.round((u.masteredCount / Math.max(1, u.totalQuestions)) * 100);
                    return (
                      <div key={u.chapterId} className="rounded-xl border border-[#d8af63]/20 bg-[#152033] p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#f1d49a]">
                            Unit {u.chapterId}: {u.unitName}
                          </p>
                          <span className="text-xs font-semibold tabular-nums text-[#5fb8c4]">
                            {u.masteredCount}/{u.totalQuestions} mastered
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#0b1320]">
                          <div className="h-full bg-[#d8af63] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-[#9db0c6]">
                          <span>Accuracy: {u.attemptedCount ? `${u.accuracyPct}%` : 'Not started'}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden /> Avg: {formatMs(u.avgSolveMs)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
