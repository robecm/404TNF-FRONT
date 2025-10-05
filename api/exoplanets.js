// Simple proxy for https://exoplanetarchive.ipac.caltech.edu/TAP/sync
// This file is intended to be deployed on Vercel as a Serverless Function under /api/exoplanets
// It forwards the incoming query string to the upstream TAP sync endpoint and returns the response.

module.exports = async (req, res) => {
  const targetBase = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
  try {
    // Build upstream URL preserving the incoming query string
    const incoming = req.url || '';
    const qs = incoming.includes('?') ? incoming.split('?').slice(1).join('?') : '';
    const upstreamUrl = qs ? `${targetBase}?${qs}` : targetBase;

    // Ensure global fetch exists in the runtime
    if (typeof globalThis.fetch !== 'function') {
      console.error('Global fetch is not available in this runtime.');
      res.statusCode = 501;
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ error: 'FetchUnavailable', message: 'Server runtime does not provide fetch. Use a Node 18+ runtime or enable fetch.' }));
    }

    // Forward minimal headers
    const forwardHeaders = {};
    if (req.headers['accept']) forwardHeaders.accept = req.headers['accept'];
    if (req.headers['user-agent']) forwardHeaders['user-agent'] = req.headers['user-agent'];

    // Read body only for non-GET/HEAD methods
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', () => resolve(undefined));
      });
    }

    console.log(`[exoplanets proxy] ${req.method} -> ${upstreamUrl}`);

    const upstreamRes = await globalThis.fetch(upstreamUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    res.statusCode = upstreamRes.status;
    const ct = upstreamRes.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    const cc = upstreamRes.headers.get('cache-control');
    if (cc) res.setHeader('cache-control', cc);

    const text = await upstreamRes.text();
    return res.end(text);
  } catch (err) {
    console.error('[exoplanets proxy] error:', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify({ error: 'ProxyError', message: String(err) }));
  }
};
