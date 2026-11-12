// Vercel Serverless Function: Abandoned Cart Capture Proxy
const BACKEND_ABANDONED_URL = process.env.BACKEND_ABANDONED_URL || 'https://dua-sap-chatbot.onrender.com/api/meo-abandoned-cart';

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

  try {
    const upstream = await fetch(BACKEND_ABANDONED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawBody
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(200).json({ ok: true, queued: false });
  }
};
