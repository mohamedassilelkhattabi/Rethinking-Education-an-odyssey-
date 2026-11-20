import { ArrowLeft, Flame, Lightbulb, Map, Repeat, Save, Star, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { Frame, Medallion } from '../components/Ornaments';
import { TitleScene } from '../components/Scenes';
import { RANKS } from '../game/scoring';

function Rule({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <Medallion className="h-11 w-11 shrink-0">{icon}</Medallion>
      <div>
        <h3 className="font-display text-base font-bold text-gold-light">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-parchment/80">{children}</p>
      </div>
    </div>
  );
}

export function HowToPlayScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="relative min-h-screen px-4 py-8 md:py-12">
      <div className="fixed inset-0 -z-10 opacity-60">
        <TitleScene shipSailing={false} />
      </div>
      <div className="mx-auto max-w-4xl">
        <button type="button" className="btn btn-ghost mb-4 px-4 py-2 text-xs" onClick={onBack} autoFocus>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        <Frame title="How to Play">
          <div className="grid gap-6 md:grid-cols-2">
            <Rule icon={<Map className="h-5 w-5" />} title="Sail the voyage">
              Four chapters stand between Troy and Ithaca. Each is a mythic island with three computer or Python questions. Only the next chapter on the map is open.
            </Rule>
            <Rule icon={<Flame className="h-5 w-5" />} title="Three in a row — or start again">
              To clear a chapter you must answer all <strong>three</strong> challenges correctly, <strong>consecutively</strong>. One mistake ends the attempt and the chapter restarts at question 1.
            </Rule>
            <Rule icon={<Target className="h-5 w-5" />} title="Learn, trace, and debug">
              Read the short lesson, trace any Python example, and choose one answer. Hard questions ask you to fix a small bug using concepts from earlier chapters.
            </Rule>
            <Rule icon={<Lightbulb className="h-5 w-5" />} title="Hints from Athena">
              Every question has a hint. Using one lowers that question’s reward from 100 XP to 50 XP but never fails you.
            </Rule>
            <Rule icon={<Star className="h-5 w-5" />} title="XP is earned, not given">
              XP from a chapter is temporary until all three answers are correct. Fail, and that attempt’s XP and resource changes are discarded. Maximum: 1,200 XP.
            </Rule>
            <Rule icon={<Save className="h-5 w-5" />} title="Your voyage is saved">
              Progress saves automatically in this browser. Completed chapters are never lost — even when a later chapter restarts.
            </Rule>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Easy · Computer basics', 'Chapter I: learn RAM, CPUs, hardware, and software.'],
              ['Medium · Python lessons', 'Chapters II–III: learn variables, types, conditions, lists, loops, and functions.'],
              ['Hard · Spot the issue', 'Chapter IV: choose the fix for a short Python snippet using earlier lessons.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-gold/20 bg-black/25 p-4">
                <p className="font-display text-sm font-bold text-parchment">{t}</p>
                <p className="mt-1 text-sm text-parchment/70">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <h3 className="font-display flex items-center gap-2 text-base font-bold text-gold-light">
              <Repeat className="h-4 w-4" aria-hidden /> Ranks
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {RANKS.map((r) => (
                <div key={r.title} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span className="font-semibold text-parchment">{r.title}</span>
                  <span className="tabular-nums text-parchment/60">
                    {r.min.toLocaleString()}–{r.max.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Frame>
      </div>
    </main>
  );
}
