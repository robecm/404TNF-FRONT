#!/usr/bin/env node
/**
 * Simple Gemini proxy server (ESM).
 * - Reads GEMINI_API_KEY and GEMINI_API_ENDPOINT from process.env (use .env for local dev)
 * - Exposes POST /api/gemini { prompt }
 * - Forwards the prompt to GEMINI_API_ENDPOINT with Authorization: Bearer <GEMINI_API_KEY>
 * If GEMINI_API_ENDPOINT is not configured, returns 501 with instructions.
 */
import express from 'express';
import dotenv from 'dotenv';

// load .env in development
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post('/api/gemini', async (req, res) => {
  const prompt = req.body?.prompt;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt in body' });

  const apiKey = process.env.GEMINI_API_KEY;
  const endpoint = process.env.GEMINI_API_ENDPOINT; // must be set to the actual Gemini/Vertex AI endpoint

  if (!apiKey || !endpoint) {
    return res.status(501).json({ error: 'GEMINI_API_KEY or GEMINI_API_ENDPOINT not configured on server. See README_PROXY.md' });
  }

  try {
    // Forward request to configured endpoint. The exact shape of the request depends on the Gemini API.
    // We forward the prompt as { prompt } and expect the upstream to return JSON with a textual reply.
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
      console.error('Upstream error', upstreamRes.status, text);
      return res.status(502).json({ error: 'Upstream Gemini error', status: upstreamRes.status, body: text });
    }

    const data = await upstreamRes.json();
    // Try to extract a sensible reply field; adapt depending on the upstream API
    const reply = data?.reply ?? data?.result ?? data?.output ?? JSON.stringify(data);
    return res.json({ reply });
  } catch (err) {
    console.error('Error proxying to Gemini', err);
    return res.status(500).json({ error: 'Proxy error', detail: String(err) });
  }
});

// Simple predict proxy for local development. Mirrors /api/predict serverless function behavior.
app.post('/api/predict', async (req, res) => {
  const body = req.body ?? {};
  const DEFAULT_PREDICT = 'https://back-557899680969.us-south1.run.app/predict/';
  const endpoint = process.env.PREDICT_ENDPOINT || DEFAULT_PREDICT;

  console.log('[local proxy] /api/predict ->', endpoint);
  console.log('[local proxy] body:', JSON.stringify(body));

  try {
    const upstreamRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await upstreamRes.text();
    if (!upstreamRes.ok) {
      console.error('[local proxy] predict upstream error', upstreamRes.status, text);
      return res.status(502).json({ error: 'Upstream predict error', status: upstreamRes.status, body: text });
    }

    // try parse JSON, otherwise forward as text
    try {
      const j = JSON.parse(text);
      return res.json(j);
    } catch {
      return res.send(text);
    }
  } catch (err) {
    console.error('[local proxy] predict proxy error', err);
    return res.status(500).json({ error: 'Proxy error', detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini proxy listening on http://localhost:${PORT}`);
});
