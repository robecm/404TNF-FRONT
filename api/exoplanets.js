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

    // Choose fetch implementation: global fetch or node-fetch fallback
    let fetchImpl = globalThis.fetch;
    if (!fetchImpl) {
      // dynamic import to avoid adding node-fetch to client bundles
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      const nf = await import('node-fetch');
      fetchImpl = nf.default || nf;
    }

    // Forward method, headers and body if present
    const forwardHeaders = {};
    // forward Accept and User-Agent at minimum
    if (req.headers['accept']) forwardHeaders.accept = req.headers['accept'];
    if (req.headers['user-agent']) forwardHeaders['user-agent'] = req.headers['user-agent'];

    // If request has a body (POST), read it
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // collect body from the incoming request
      body = await new Promise((resolve) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', () => resolve(undefined));
      });
    }

    console.log('Proxying to upstream:', upstreamUrl);

    const upstreamRes = await fetchImpl(upstreamUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    // Mirror status and some headers
    res.statusCode = upstreamRes.status;
    // Copy content-type and cache-control if provided
    const ct = upstreamRes.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    const cc = upstreamRes.headers.get('cache-control');
    if (cc) res.setHeader('cache-control', cc);

    // Read upstream body as text and return
    const text = await upstreamRes.text();
    return res.end(text);
  } catch (err) {
    console.error('Proxy error to exoplanet archive:', String(err));
    res.statusCode = 500;
    // Return a JSON body with diagnostic hints (avoid leaking secrets)
    res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify({ error: 'Proxy error', message: String(err) }));
  }
};
