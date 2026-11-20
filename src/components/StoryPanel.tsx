import { Lock, Target } from 'lucide-react';
import type { Question } from '../game/types';
import { MathText } from './MathText';
import { Meander } from './Ornaments';

const OP_TEXT = { '<=': '≤', '>=': '≥', '==': '=' } as const;

export function StoryPanel({ question, indexLabel }: { question: Question; indexLabel: string }) {
  const constraints =
    question.kind === 'quiz'
      ? []
      : question.kind === 'choice'
        ? question.constraints.map((c) => ({ label: c.label, math: `${c.key} ${OP_TEXT[c.op]} ${c.limit}` }))
        : question.kind === 'knapsack'
          ? [
              { label: `Total cargo weight at most ${question.capacity} units`, math: `Σ weight ≤ ${question.capacity}` },
              { label: 'Each item is loaded once or not at all', math: 'xᵢ ∈ {0, 1}' },
            ]
          : [
              { label: 'Follow the one-way sea routes (arrows)', math: 'edges are directed' },
              { label: `Begin at ${question.start} and end at ${question.goal}`, math: `${question.start} → … → ${question.goal}` },
            ];

  return (
    <article className="parchment flex flex-col gap-3.5 p-5 md:p-6">
      <div>
        <p className="font-display text-xs font-semibold tracking-wider text-bronze">{indexLabel}</p>
        <h3 className="font-display mt-1 text-xl font-bold leading-snug text-ink md:text-2xl">{question.title}</h3>
        <Meander ink className="mt-2.5" />
      </div>
      <div className="font-serif space-y-2 text-lg leading-snug text-ink/90">
        {question.story.map((p, i) => (
          <p key={i}>
            <MathText text={p} />
          </p>
        ))}
      </div>
      {question.kind === 'quiz' && (
        <section className="rounded-lg border border-bronze/35 bg-[#f7ecd0]/75 p-3">
          <p className="text-xs font-semibold text-bronze-dark">
            {question.unitName} · {question.difficulty} · {question.topic}
          </p>
          <h4 className="mt-1.5 text-sm font-bold text-ink">Concept briefing</h4>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            <MathText text={question.teaching} />
          </p>
        </section>
      )}
      <div className="rounded-lg border border-bronze/35 bg-[#f7ecd0]/75 p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-bronze-dark">
          <Target className="h-3.5 w-3.5" aria-hidden /> Objective
        </p>
        <p className="mt-1 font-sans text-sm font-semibold leading-relaxed text-ink md:text-base">
          <MathText text={question.objectiveText} />
        </p>
      </div>
      {constraints.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-[#f3dcc4]/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-[#8e3030]">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Constraints
          </p>
          <ul className="mt-1.5 space-y-1">
            {constraints.map((c) => (
              <li key={c.label} className="flex flex-wrap items-baseline justify-between gap-x-3 font-sans text-sm font-medium text-ink">
                <span>• {c.label}</span>
                <code className="rounded bg-ink/10 px-1.5 text-xs text-ink/70">{c.math}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
