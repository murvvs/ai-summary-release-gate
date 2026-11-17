(function () {
  var cfg = window.APP_CONFIG || {};
  var ticketId = new URLSearchParams(location.search).get('ticket') || 'T-100';
  var ticket = window.TicketData.TICKETS[ticketId];
  var $ = function (id) { return document.getElementById(id); };

  if (!ticket) { $('ticket-title').textContent = 'Unknown ticket'; return; }
  var messageIds = ticket.messages.map(function (m) { return m.id; });

  $('ticket-title').textContent = ticket.id + ' - ' + ticket.subject;
  ticket.messages.forEach(function (m) {
    var li = document.createElement('li');
    li.dataset.messageId = m.id;
    li.textContent = m.id + ': ' + m.text;
    $('messages').appendChild(li);
  });

  // Single place that decides what the agent sees. Approval is only enabled
  // from the "ok + valid citations" state.
  function render(v) {
    $('status').textContent = v.status || '';
    $('summary').hidden = !v.summary;
    $('summary').textContent = v.summary || '';
    $('retry').hidden = !v.retry;
    $('approve').disabled = !v.approvable;
    $('generate').disabled = !!v.busy;
    $('approved').hidden = true;
  }

  async function generate() {
    render({ status: 'Generating summary...', busy: true });
    try {
      var res = await fetch('/api/tickets/' + ticketId + '/summary', { method: 'POST' });
      if (!res.ok) throw new Error('http_' + res.status);
      var body = await res.json();

      if (body.status === 'insufficient_information') {
        return render({ status: 'Insufficient information to summarize this ticket.' });
      }
      if (body.status === 'ok' && typeof body.summary === 'string') {
        var check = window.SummaryRules.validateCitations(
          body.sourceIds, messageIds, { skipOwnershipCheck: cfg.skipOwnershipCheck });
        if (check.valid) {
          return render({ status: 'Summary ready for review.', summary: body.summary, approvable: true });
        }
        return render({
          status: 'Summary cannot be approved: citations are missing or invalid.',
          summary: body.summary
        });
      }
      throw new Error('unexpected_payload');
    } catch (e) {
      render({ status: 'Summary service unavailable. Please retry.', retry: true });
    }
  }

  $('generate').addEventListener('click', generate);
  $('retry').addEventListener('click', generate);
  $('approve').addEventListener('click', function () {
    $('approve').disabled = true;
    $('approved').hidden = false;
  });
})();
