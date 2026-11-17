import type { ServiceBody } from '../../src/types';

export interface EvalCase {
  id: string;
  ticketId: string;
  body: ServiceBody;
  eligible: boolean;
  reason?: string; // substring expected in verdict reasons
}

// Synthetic, hand-labelled. Wording varies on purpose: the checks must not
// depend on exact phrasing.
export const CASES: EvalCase[] = [
  // ---- acceptable ----
  { id: 'good-detailed', ticketId: 'T-100', eligible: true,
    body: { status: 'ok', summary: 'Customer was charged twice for ORD-1042; agent refunded $49.99.', sourceIds: ['m1', 'm2'] } },
  { id: 'good-paraphrase', ticketId: 'T-100', eligible: true,
    body: { status: 'ok', summary: 'Duplicate charge on ORD-1042 was refunded and the customer confirmed.', sourceIds: ['m1', 'm2'] } },
  { id: 'good-no-specifics', ticketId: 'T-100', eligible: true,
    body: { status: 'ok', summary: 'Customer would like an email confirming the outcome.', sourceIds: ['m3'] } },
  { id: 'good-other-ticket', ticketId: 'T-200', eligible: true,
    body: { status: 'ok', summary: 'Login failed after reset; a new reset link was sent.', sourceIds: ['m9', 'm10'] } },

  // ---- attribution failures ----
  { id: 'bad-missing-field', ticketId: 'T-100', eligible: false, reason: 'missing_citations',
    body: { status: 'ok', summary: 'Customer was charged twice.' } },
  { id: 'bad-empty-array', ticketId: 'T-100', eligible: false, reason: 'missing_citations',
    body: { status: 'ok', summary: 'Customer was charged twice.', sourceIds: [] } },
  { id: 'bad-cross-ticket', ticketId: 'T-100', eligible: false, reason: 'cross_ticket_citation:m9',
    body: { status: 'ok', summary: 'Customer was charged twice.', sourceIds: ['m1', 'm9'] } },
  { id: 'bad-unknown-id', ticketId: 'T-100', eligible: false, reason: 'cross_ticket_citation:m99',
    body: { status: 'ok', summary: 'Customer was charged twice.', sourceIds: ['m99'] } },

  // ---- unsupported specifics (the extra risk) ----
  { id: 'bad-invented-amount', ticketId: 'T-100', eligible: false, reason: 'ungrounded_specifics:59.99',
    body: { status: 'ok', summary: 'Agent refunded $59.99 for the duplicate charge.', sourceIds: ['m1', 'm2'] } },
  { id: 'bad-invented-order', ticketId: 'T-100', eligible: false, reason: 'ungrounded_specifics:ord-9999',
    body: { status: 'ok', summary: 'Charged twice on ORD-9999.', sourceIds: ['m1'] } },
  { id: 'bad-fact-not-in-cited-msg', ticketId: 'T-100', eligible: false, reason: 'ungrounded_specifics:49.99',
    // $49.99 exists in m2 but the summary only cites m1: attribution is wrong.
    body: { status: 'ok', summary: 'Customer was refunded $49.99.', sourceIds: ['m1'] } },

  // ---- non-summary states ----
  { id: 'insufficient', ticketId: 'T-100', eligible: false, reason: 'insufficient_information',
    body: { status: 'insufficient_information' } },
];
