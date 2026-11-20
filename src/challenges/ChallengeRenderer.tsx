import { QuizChallenge } from './QuizChallenge';
import type { Answer, Question } from '../game/types';
import { KnapsackChallenge } from './KnapsackChallenge';
import { MultipleChoiceChallenge } from './MultipleChoiceChallenge';
import { ShortestPathChallenge } from './ShortestPathChallenge';

/** Picks the interactive component for a question (discriminated on `kind`). */
export function ChallengeRenderer({ question, disabled, onSubmit }: { question: Question; disabled: boolean; onSubmit: (a: Answer) => void }) {
  switch (question.kind) {
    case 'quiz':
      return <QuizChallenge question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'choice':
      return <MultipleChoiceChallenge question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'knapsack':
      return <KnapsackChallenge question={question} disabled={disabled} onSubmit={onSubmit} />;
    case 'graph':
      return <ShortestPathChallenge question={question} disabled={disabled} onSubmit={onSubmit} />;
  }
}
