import { test, expect } from '@playwright/test';
import { CASES } from './dataset';
import { evaluateSummary } from '../../src/evaluate';
import { extractSpecifics, ungroundedSpecifics } from '../../src/grounding';
import { TICKETS } from '../../src/tickets';

test.describe('summary eval (deterministic, synthetic)', () => {
  for (const c of CASES) {
    test(`${c.id} -> ${c.eligible ? 'eligible' : 'blocked'}`, () => {
      const verdict = evaluateSummary(c.body, TICKETS[c.ticketId]);
      expect(verdict.eligible, verdict.reasons.join(' | ')).toBe(c.eligible);
      if (c.reason) expect(verdict.reasons.join('|')).toContain(c.reason);
    });
  }

  test('dataset has both acceptable and unacceptable examples', () => {
    expect(CASES.some((c) => c.eligible)).toBe(true);
    expect(CASES.filter((c) => !c.eligible).length).toBeGreaterThanOrEqual(5);
  });

  test('specific extraction handles amounts, ids and commas', () => {
    expect(extractSpecifics('Refunded $1,200.50 on ORD-77 (20%)')).toEqual(['1200.50', 'ord-77', '20%']);
    expect(ungroundedSpecifics('Refund of $10', 'Agent refunded $10 today')).toEqual([]);
  });
});
