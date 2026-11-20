import { describe, expect, it } from 'vitest';
import { getRank, MAX_CHAPTER_XP, MAX_XP, questionXP, XP_PER_QUESTION, XP_WITH_HINT } from '../game/scoring';

describe('scoring', () => {
  it('awards 100 XP without a hint and 50 with one', () => {
    expect(questionXP(false)).toBe(100);
    expect(questionXP(true)).toBe(50);
    expect(XP_PER_QUESTION).toBe(100);
    expect(XP_WITH_HINT).toBe(50);
  });

  it('caps chapters at 300 XP and the game at 1,200 XP', () => {
    expect(MAX_CHAPTER_XP).toBe(300);
    expect(MAX_XP).toBe(1200);
  });

  it('maps XP to the correct ranks at every boundary', () => {
    expect(getRank(1200).title).toBe('Master Strategist');
    expect(getRank(1100).title).toBe('Master Strategist');
    expect(getRank(1099).title).toBe('Wise Navigator');
    expect(getRank(900).title).toBe('Wise Navigator');
    expect(getRank(899).title).toBe('Courageous Explorer');
    expect(getRank(600).title).toBe('Courageous Explorer');
    expect(getRank(599).title).toBe('Aspiring Adventurer');
    expect(getRank(0).title).toBe('Aspiring Adventurer');
  });

  it('clamps out-of-range XP', () => {
    expect(getRank(-50).title).toBe('Aspiring Adventurer');
    expect(getRank(5000).title).toBe('Master Strategist');
  });
});
