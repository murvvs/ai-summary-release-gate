import { validateCitations } from '../public/rules.js';
import { ungroundedSpecifics } from './grounding';
import type { ServiceBody, Ticket, Verdict } from './types';

/** Deterministic eligibility check for one service response against its ticket. */
export function evaluateSummary(body: ServiceBody, ticket: Ticket): Verdict {
  if (!('status' in body)) return { eligible: false, reasons: ['service_error'] };
  if (body.status === 'insufficient_information') {
    return { eligible: false, reasons: ['insufficient_information'] };
  }

  const ids = ticket.messages.map((m) => m.id);
  const citations = validateCitations(body.sourceIds, ids);
  const reasons = [...citations.reasons];

  if (citations.valid) {
    const cited = ticket.messages
      .filter((m) => body.sourceIds!.includes(m.id))
      .map((m) => m.text)
      .join(' ');
    const bad = ungroundedSpecifics(body.summary, cited);
    if (bad.length) reasons.push('ungrounded_specifics:' + bad.join(','));
  }
  return { eligible: reasons.length === 0, reasons };
}
