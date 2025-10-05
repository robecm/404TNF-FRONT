import http from 'http';
import handler from '../api/exoplanets.js';

const port = process.env.PORT || 3002;
const server = http.createServer((req, res) => {
  // call the handler exported from api/exoplanets.js
  Promise.resolve(handler(req, res)).catch((err) => {
    console.error('handler error', err && err.stack ? err.stack : err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'HandlerError', message: String(err) }));
    } else {
      try { res.end(); } catch (e) {}
    }
  });
});

server.listen(port, () => console.log(`test server listening http://localhost:${port}`));
