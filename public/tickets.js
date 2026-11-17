// Synthetic tickets. Shared by the fixture app, UI tests and evals.
(function (root) {
  var TICKETS = {
    'T-100': {
      id: 'T-100',
      subject: 'Double charge',
      messages: [
        { id: 'm1', text: 'Customer reports being charged twice for order ORD-1042 on 3 March.' },
        { id: 'm2', text: 'Agent refunded $49.99 to the original card; customer confirmed receipt.' },
        { id: 'm3', text: 'Customer asks for a confirmation email.' }
      ]
    },
    'T-200': {
      id: 'T-200',
      subject: 'Login problem',
      messages: [
        { id: 'm9', text: 'Customer cannot log in after a password reset.' },
        { id: 'm10', text: 'Agent sent a new reset link.' }
      ]
    }
  };
  var api = { TICKETS: TICKETS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TicketData = api;
})(typeof window !== 'undefined' ? window : globalThis);
