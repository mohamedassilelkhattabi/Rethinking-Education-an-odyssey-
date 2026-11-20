import { useState } from 'react';
import { MathText } from '../components/MathText';
import type { Answer, QuizQuestion } from '../game/types';

export function QuizChallenge({
  question,
  disabled,
  onSubmit,
}: {
  question: QuizQuestion;
  disabled: boolean;
  onSubmit: (answer: Answer) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const locked = disabled || submitted;

  return (
    <section className="rounded-xl border border-gold/30 bg-midnight/95 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-parchment/75">
        <span>
          {question.unitName} · {question.topic} · {question.difficulty}
        </span>
        {question.personalizedHook && (
          <span className="font-semibold text-aegean-light">Tailored: {question.personalizedHook}</span>
        )}
      </div>

      {question.formulaRef && (
        <div className="mt-3 rounded-lg border border-gold/25 bg-abyss/70 px-3.5 py-2 text-sm text-gold-light">
          <span className="mr-2 text-xs text-parchment/60">Key relation:</span>
          <MathText text={question.formulaRef} />
        </div>
      )}

      {question.code && (
        <div className="mt-4">
          <pre
            className="overflow-x-auto rounded-xl border border-white/20 bg-black/50 p-4 text-sm leading-7 text-parchment"
            tabIndex={0}
            aria-label="Code block"
          >
            <code>{question.code}</code>
          </pre>
        </div>
      )}

      {question.expectedBehavior && (
        <p className="mt-3 text-sm leading-relaxed text-parchment">
          <strong>Expected behavior:</strong> <MathText text={question.expectedBehavior} />
        </p>
      )}

      <fieldset className="mt-5 space-y-2.5" disabled={locked}>
        <legend className="mb-3 text-base font-semibold leading-relaxed text-parchment">
          <MathText text={question.objectiveText} />
        </legend>
        {question.options.map((option) => (
          <label
            key={option.id}
            className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-parchment transition-colors focus-within:ring-2 focus-within:ring-gold ${
              selected === option.id ? 'border-gold bg-gold/15' : 'border-white/15 bg-white/5'
            } ${locked ? 'cursor-default opacity-70' : 'hover:border-gold/65 hover:bg-white/10'}`}
          >
            <input
              className="h-4 w-4 shrink-0 accent-[#d8af63]"
              type="radio"
              name={`quiz-${question.id}`}
              value={option.id}
              checked={selected === option.id}
              onChange={() => setSelected(option.id)}
            />
            <span className="min-w-0 flex-1 break-words text-sm leading-relaxed md:text-base">
              <strong className="mr-1.5 text-gold-light">{option.id}.</strong>
              <MathText text={option.label} />
            </span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="btn btn-gold mt-5 w-full py-3 text-sm"
        disabled={locked || !selected}
        onClick={() => {
          if (!selected || locked) return;
          setSubmitted(true);
          onSubmit({ kind: 'quiz', optionId: selected });
        }}
      >
        Submit answer
      </button>
    </section>
  );
}
