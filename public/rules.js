// Citation eligibility rules. Used by the dashboard AND by the evals, so the
// definition of "valid citation" lives in exactly one place.
(function (root) {
  /**
   * A summary is citation-valid when it cites at least one message and every
   * cited id belongs to the current ticket.
   */
  function validateCitations(sourceIds, ticketMessageIds, options) {
    var opts = options || {};
    var reasons = [];
    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return { valid: false, reasons: ['missing_citations'] };
    }
    var foreign = sourceIds.filter(function (id) {
      return typeof id !== 'string' || ticketMessageIds.indexOf(id) === -1;
    });
    if (foreign.length && !opts.skipOwnershipCheck) {
      reasons.push('cross_ticket_citation:' + foreign.join(','));
    }
    return { valid: reasons.length === 0, reasons: reasons };
  }

  var api = { validateCitations: validateCitations };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SummaryRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
