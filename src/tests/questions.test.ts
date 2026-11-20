import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QUESTIONS } from '../data/questions';
import { CHAPTERS } from '../data/chapters';
import { evaluateAnswer } from '../game/optimization';
import { QuizChallenge } from '../challenges/QuizChallenge';
import { StoryPanel } from '../components/StoryPanel';

// Independently reviewed answers for the terminology, tracing, and debugging examples.
const expectedAnswers = ['B', 'A', 'C', 'B', 'A', 'C', 'B', 'A', 'C', 'A', 'B', 'C'];

describe('computer and Python journey', () => {
  it('provides twelve sequential questions in four chapters, from Easy to Hard', () => {
    expect(QUESTIONS.map((q) => q.id)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(CHAPTERS.map((c) => c.difficulty)).toEqual(['Easy', 'Medium', 'Medium', 'Hard']);
    for (const chapter of CHAPTERS) {
      const questions = QUESTIONS.filter((q) => q.chapterId === chapter.id);
      expect(questions.map((q) => q.id)).toEqual(chapter.questionIds);
      expect(questions.every((q) => q.difficulty === chapter.difficulty)).toBe(true);
    }
  });

  it('grades every answer and rejects unknown options and mismatched submissions', () => {
    QUESTIONS.forEach((q, i) => {
      for (const option of q.options) {
        const result = evaluateAnswer(q, { kind: 'quiz', optionId: option.id });
        expect(result.correct).toBe(option.id === expectedAnswers[i]);
        expect(result.reason).toBe(option.explanation);
      }
      expect(evaluateAnswer(q, { kind: 'quiz', optionId: 'unknown' }).correct).toBe(false);
      expect(evaluateAnswer(q, { kind: 'choice', optionId: expectedAnswers[i] }).correct).toBe(false);
    });
  });

  it('shows lessons before answering and preserves Python whitespace without revealing solutions', () => {
    for (const q of QUESTIONS) {
      const lesson = renderToStaticMarkup(createElement(StoryPanel, { question: q, indexLabel: 'Question' }));
      expect(lesson).toContain('Learn before you answer');
      expect(lesson).toContain(q.difficulty);
      const quiz = renderToStaticMarkup(createElement(QuizChallenge, { question: q, disabled: false, onSubmit: () => {} }));
      expect(quiz).toContain('<fieldset');
      expect(quiz.match(/type="radio"/g)).toHaveLength(3);
      expect(quiz).toContain('disabled=""'); // Cannot submit until an answer is chosen.
      expect(quiz).not.toContain(q.lesson.explanation);
      if (q.code) {
        expect(quiz).toContain('<pre');
        expect(quiz).toContain(q.code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;'));
      }
    }
  });
});
