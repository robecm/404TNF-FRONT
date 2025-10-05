// Simple proxy for https://exoplanetarchive.ipac.caltech.edu/TAP/sync
// This file is intended to be deployed on Vercel as a Serverless Function under /api/exoplanets
// It forwards the incoming query string to the upstream TAP sync endpoint and returns the response.

module.exports = async (req, res) => {
  try {
    const targetBase = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

    // Extract the query string from the incoming URL (everything after '?')
    const incoming = req.url || '';
    const qs = incoming.includes('?') ? incoming.split('?').slice(1).join('?') : '';
    const upstreamUrl = qs ? `${targetBase}?${qs}` : targetBase;

    // Forward only GET/HEAD for simplicity (the client uses GET)
    const upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        // Accept JSON by default; allow upstream to decide
        accept: req.headers['accept'] || 'application/json',
        // Forward user-agent if present
        'user-agent': req.headers['user-agent'] || 'node-fetch-proxy',
      },
    });

    // Propagate status and content-type
    res.statusCode = upstreamRes.status;
    const contentType = upstreamRes.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    // Copy some cache headers if present
    const cacheControl = upstreamRes.headers.get('cache-control');
    if (cacheControl) res.setHeader('cache-control', cacheControl);

    // Stream the body back (read as text to avoid stream complexity)
    const body = await upstreamRes.text();
    return res.end(body);
  } catch (err) {
    console.error('Proxy error to exoplanet archive:', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Proxy error', detail: String(err) }));
  }
};
