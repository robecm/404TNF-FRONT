// Serverless API route to proxy requests to Gemini-like endpoints
// - Reads GEMINI_API_KEY and GEMINI_API_ENDPOINT from process.env
// - Accepts POST { prompt }
// - Forwards the prompt to the configured endpoint and returns { reply }
// Notes: Keep your GEMINI_API_KEY in Vercel/production env vars, do NOT commit keys.

const cache = new Map(); // simple in-memory cache: prompt -> { reply, ts }
const TTL = 1000 * 60 * 2; // 2 minutes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prompt } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Missing prompt in request body' });
      return;
    }

    // cache hit
    const now = Date.now();
    const cached = cache.get(prompt);
    if (cached && now - cached.ts < TTL) {
      res.json({ reply: cached.reply, cached: true });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const endpoint = process.env.GEMINI_API_ENDPOINT;

    if (!apiKey || !endpoint) {
      res.status(501).json({ error: 'GEMINI_API_KEY or GEMINI_API_ENDPOINT not configured on server.' });
      return;
    }

    // Forward to upstream
    const upstreamRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      console.error('[api/gemini] Upstream error', upstreamRes.status, text);
      res.status(502).json({ error: 'Upstream error', status: upstreamRes.status, body: text });
      return;
    }

    const data = await upstreamRes.json();
    // Try common reply fields
    const reply = data?.reply ?? data?.result ?? data?.output ?? data?.choices?.[0]?.text ?? JSON.stringify(data);

    // store in cache
    cache.set(prompt, { reply, ts: Date.now() });

    res.json({ reply });
  } catch (err) {
    console.error('[api/gemini] proxy error', err);
    res.status(500).json({ error: 'Proxy error', detail: String(err) });
  }
}
