// Serverless proxy to forward prediction requests to the model backend
// Uses PREDICT_ENDPOINT env var or falls back to a hardcoded default endpoint.

const DEFAULT_ENDPOINT = 'https://back-557899680969.us-south1.run.app/predict/';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body ?? {};
    // basic validation: body should be an object with numeric fields
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid body' });

    const endpoint = process.env.PREDICT_ENDPOINT || DEFAULT_ENDPOINT;

    // log the endpoint and the outgoing body for easier debugging when upstream returns 4xx/5xx
    console.log('[api/predict] forwarding to endpoint:', endpoint);
    console.log('[api/predict] outgoing body:', JSON.stringify(body));

    const upstreamRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      console.error('[api/predict] upstream error', upstreamRes.status, text);
      return res.status(502).json({ error: 'Upstream error', status: upstreamRes.status, body: text });
    }

    const data = await upstreamRes.json();
    // forward upstream response as-is
    return res.json(data);
  } catch (err) {
    console.error('[api/predict] proxy error', err);
    return res.status(500).json({ error: 'Proxy error', detail: String(err) });
  }
}
