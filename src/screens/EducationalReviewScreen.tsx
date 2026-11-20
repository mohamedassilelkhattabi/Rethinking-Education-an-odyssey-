import { ArrowLeft, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { DijkstraTrace, Expandable } from '../components/FeedbackPanel';
import { MathText } from '../components/MathText';
import { Frame } from '../components/Ornaments';
import { ChapterBackdrop } from '../components/Scenes';
import { WeightedGraph } from '../components/WeightedGraph';
import { CHAPTERS } from '../data/chapters';
import { getQuestion } from '../data/questions';
import { dijkstra, evaluateAnswer, formatNumber, optimalAnswer, solveChoice } from '../game/optimization';
import type { Question } from '../game/types';

function Concept({ title, chapter, children }: { title: string; chapter: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gold/20 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-aegean-light">{chapter}</p>
      <h3 className="font-display mt-1 text-lg font-bold text-gold-light">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-parchment/85">{children}</div>
    </div>
  );
}

function SolutionSummary({ q }: { q: Question }) {
  const ev = evaluateAnswer(q, optimalAnswer(q));
  if (q.kind === 'quiz') {
    return (
      <p>
        Correct answer:{' '}
        <strong className="text-gold-light">
          <MathText text={ev.optimalLabel} />
        </strong>
      </p>
    );
  }
  if (q.kind === 'choice') {
    const sol = solveChoice(q);
    return (
      <p>
        Optimal: <strong className="text-gold-light">{ev.optimalLabel}</strong> — {formatNumber(sol.optimalValue)} {q.objective.unit}.
      </p>
    );
  }
  if (q.kind === 'knapsack') {
    return (
      <p>
        Optimal cargo: <strong className="text-gold-light">{ev.optimalLabel}</strong> — total value {ev.optimalValue}.
      </p>
    );
  }
  const r = dijkstra(q.nodes.map((n) => n.id), q.edges, q.start, q.goal);
  return (
    <div className="space-y-3">
      <p>
        Shortest route: <strong className="text-gold-light">{r.path.join(' → ')}</strong> — total cost {r.distance}.
      </p>
      <div className="parchment p-1.5">
        <WeightedGraph question={q} path={r.path} highlight={r.path} />
      </div>
      <DijkstraTrace steps={r.steps} />
    </div>
  );
}

export function EducationalReviewScreen({ completedChapters, onBack }: { completedChapters: number[]; onBack: () => void }) {
  return (
    <main className="relative min-h-screen px-3 py-6 md:px-6 md:py-10">
      <ChapterBackdrop theme="aeolus" dim={0.78} />
      <div className="mx-auto max-w-5xl">
        <button type="button" className="btn btn-ghost mb-4 px-4 py-2 text-xs" onClick={onBack} autoFocus>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        <Frame title="The Scrolls of Wisdom — Calculus I Curriculum">
          <div className="grid gap-4 md:grid-cols-2">
            <Concept chapter="Unit 1 · Pre-Calculus & Review" title="Functions, Trig & Logarithms">
              <p>
                <MathText text="Inverse functions undo $f(x)$ via $f(f^{-1}(x))=x$, unit-circle angles yield exact trig ratios like $\\sin(\\frac{5\\pi}{6})=\\frac{1}{2}$, and $\\ln(e^u)=u$ solves exponential equations." />
              </p>
            </Concept>
            <Concept chapter="Unit 2 · Limits & Continuity" title="Limits, Asymptotes & IVT">
              <p>
                <MathText text="Two-sided limits exist only when $\\lim_{x\\to a^-} f(x) = \\lim_{x\\to a^+} f(x)$. Factoring removes $0/0$ holes, degree comparison gives horizontal asymptotes, and IVT guarantees roots for continuous functions." />
              </p>
            </Concept>
            <Concept chapter="Unit 3 · Derivatives" title="Differentiation Rules & Related Rates">
              <p>
                <MathText text="Use Power, Product, Quotient, and Chain Rules ($\\frac{d}{dx}[f(g(x))]=f'(g(x))g'(x)$) plus implicit differentiation w.r.t. time $t$ for related rates." />
              </p>
            </Concept>
            <Concept chapter="Unit 4 · Applications of Derivatives" title="Extrema, Concavity, MVT & L'Hôpital">
              <p>
                <MathText text="Critical points where $f'(x)=0$ locate extrema, $f''(x)$ governs concavity, MVT matches instantaneous and average slope, and L'Hôpital's Rule resolves $0/0$ and $\\infty/\\infty$." />
              </p>
            </Concept>
            <Concept chapter="Unit 5 · Integrals" title="Antiderivatives, u-Sub & FTC">
              <p>
                <MathText text="Riemann sums converge to definite integrals, $u$-substitution reverses the Chain Rule, and the Fundamental Theorem of Calculus states $\\int_a^b f(x)\\,dx = F(b) - F(a)$." />
              </p>
            </Concept>
            <Concept chapter="Unit 6 · Applications of Integrals" title="Average Value, Areas, Volumes & Work">
              <p>
                <MathText text="Integrate top minus bottom for area, $\\pi\\int [R(x)]^2\\,dx$ or $2\\pi\\int x f(x)\\,dx$ for volumes of revolution, $\\frac{1}{b-a}\\int_a^b f(x)\\,dx$ for average value, and $\\int F(x)\\,dx$ for work." />
              </p>
            </Concept>
          </div>
        </Frame>

        <Frame title="Captain’s Logbook — Solved Calculus I Problems" className="mt-6">
          <div className="space-y-4">
            {CHAPTERS.map((c) => {
              const done = completedChapters.includes(c.id);
              return (
                <div key={c.id}>
                  <h3 className="font-display text-base font-bold text-parchment">
                    {c.unitLabel} — {c.title}
                  </h3>
                  {done ? (
                    <div className="mt-2 space-y-2">
                      {c.questionIds.map((id) => {
                        const q = getQuestion(id);
                        return (
                          <Expandable key={id} title={`Q${id} · ${q.title}`}>
                            <div className="space-y-2 text-sm text-parchment/85">
                              <p className="italic text-parchment/75">
                                <MathText text={q.objectiveText} />
                              </p>
                              <SolutionSummary q={q} />
                              <p>
                                <MathText text={q.lesson.explanation} />
                              </p>
                              {q.lesson.workedSolution && q.lesson.workedSolution.length > 0 && (
                                <ol className="list-decimal space-y-1 pl-5 text-xs text-parchment/80">
                                  {q.lesson.workedSolution.map((step, i) => (
                                    <li key={i}>
                                      <MathText text={step} />
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          </Expandable>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-1 flex items-center gap-2 text-sm text-parchment/45">
                      <Lock className="h-4 w-4" aria-hidden /> Complete Unit {c.id} to unlock its full solutions in the logbook.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Frame>
      </div>
    </main>
  );
}
