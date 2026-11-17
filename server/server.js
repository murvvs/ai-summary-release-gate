// Minimal static server for the fixture dashboard. No dependencies.
// The summary service itself is NOT implemented here: tests mock it at the
// network boundary with page.route(), so every test controls its own responses.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4173);
const PUBLIC = path.join(__dirname, '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' };

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/healthz') {
      res.writeHead(200);
      return res.end('ok');
    }
    if (url.pathname === '/config.js') {
      // Intentional regression: skip the "citation must belong to this ticket" rule.
      const broken = process.env.BREAK_CITATION_CHECK === '1';
      res.writeHead(200, { 'content-type': TYPES['.js'] });
      return res.end(`window.APP_CONFIG = { skipOwnershipCheck: ${broken} };`);
    }
    if (url.pathname.startsWith('/api/')) {
      // Unmocked service call = test bug. Make it loud.
      res.writeHead(404, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: 'not_mocked' }));
    }

    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.normalize(path.join(PUBLIC, rel));
    if (!file.startsWith(PUBLIC)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(PORT, '127.0.0.1', () => console.log(`fixture dashboard on http://127.0.0.1:${PORT}`));
