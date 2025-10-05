import https from 'https';
import { URL } from 'url';

// Simple in-memory cache for a single server instance (ephemeral on serverless)
// key -> { status, headers, body(Buffer), expires }
const CACHE = new Map();
const DEFAULT_TTL = 300; // seconds

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('allow', 'GET, HEAD');
      return sendJson(res, 405, { error: 'MethodNotAllowed' });
    }

    const incoming = req.url || '';
    const parts = incoming.split('?');
    const qs = parts.length > 1 ? parts.slice(1).join('?') : '';

    if (!qs) {
      return sendJson(res, 400, { error: 'MissingQuery', message: 'Expected query string with TAP SQL query' });
    }

    const cacheKey = qs;
    const now = Date.now();
    const cached = CACHE.get(cacheKey);
    if (cached && cached.expires > now) {
      // Serve from cache
      res.statusCode = cached.status;
      Object.entries(cached.headers || {}).forEach(([k, v]) => {
        try { res.setHeader(k, v); } catch (e) {}
      });
      res.setHeader('x-cache', 'HIT');
      return res.end(cached.body);
    }

    // Build options for upstream request
    const upstreamUrl = new URL(`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?${qs}`);

    const options = {
      hostname: upstreamUrl.hostname,
      port: 443,
      path: upstreamUrl.pathname + upstreamUrl.search,
      method: 'GET',
      headers: {
        accept: req.headers['accept'] || 'application/json',
        'user-agent': req.headers['user-agent'] || 'space-app-proxy/1.0',
      },
    };

    const ttl = DEFAULT_TTL;

    await new Promise((resolve, reject) => {
      const upstreamReq = https.request(options, (upstreamRes) => {
        const status = upstreamRes.statusCode || 200;
        const contentType = upstreamRes.headers['content-type'];
        const upstreamCache = upstreamRes.headers['cache-control'];

        if (contentType) res.setHeader('content-type', contentType);
        if (upstreamCache) res.setHeader('cache-control', upstreamCache);
        else res.setHeader('cache-control', `s-maxage=${ttl}, stale-while-revalidate=60`);

        res.setHeader('x-cache', 'MISS');

        const chunks = [];
        upstreamRes.on('data', (chunk) => {
          chunks.push(chunk);
          try { res.write(chunk); } catch (e) {}
        });

        upstreamRes.on('end', () => {
          try { res.end(); } catch (e) {}
          try {
            const body = Buffer.concat(chunks);
            CACHE.set(cacheKey, {
              status,
              headers: {
                'content-type': res.getHeader('content-type') || 'application/octet-stream',
                'cache-control': res.getHeader('cache-control'),
              },
              body,
              expires: Date.now() + ttl * 1000,
            });
          } catch (err) {
            console.error('[exoplanets proxy] cache store error', err && err.stack ? err.stack : err);
          }
          resolve();
        });

        upstreamRes.on('error', (err) => {
          console.error('[exoplanets proxy] upstreamRes error', err && err.stack ? err.stack : err);
          reject(err);
        });
      });

      upstreamReq.on('timeout', () => {
        upstreamReq.destroy(new Error('UpstreamTimeout'));
      });

      upstreamReq.on('error', (err) => {
        console.error('[exoplanets proxy] request error', err && err.stack ? err.stack : err);
        if (!res.headersSent) res.setHeader('content-type', 'application/json');
        if (!res.writableEnded) sendJson(res, 502, { error: 'UpstreamError', message: String(err) });
        reject(err);
      });

      upstreamReq.setTimeout(25000);
      upstreamReq.end();
    });
  } catch (err) {
    console.error('[exoplanets proxy] unexpected error', err && err.stack ? err.stack : err);
    if (!res.headersSent) res.setHeader('content-type', 'application/json');
    return sendJson(res, 500, { error: 'ProxyError', message: String(err) });
  }
}

