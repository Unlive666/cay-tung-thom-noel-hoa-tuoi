// Vercel Serverless Function: Dynamic Meta Pixel ID Config Bridge
// Allows changing Meta Pixel ID remotely via Vercel Env (META_PIXEL_ID) or Render Gateway without redeploying HTML.

const BACKEND_PIXEL_URL = process.env.BACKEND_PIXEL_URL || 'https://dua-sap-chatbot.onrender.com/api/meo-pixel-config';

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const envPixel = (process.env.META_PIXEL_ID || '915190564005655').trim();
  if (/^\d{10,22}$/.test(envPixel)) {
    return res.status(200).json({ ok: true, pixel_id: envPixel, source: 'vercel_env' });
  }

  try {
    const upstream = await fetch(BACKEND_PIXEL_URL, { method: 'GET' });
    if (upstream.ok) {
      const data = await upstream.json();
      if (data && data.pixel_id) {
        return res.status(200).json({ ok: true, pixel_id: String(data.pixel_id).trim(), source: 'cloud_gateway' });
      }
    }
  } catch {}

  return res.status(200).json({ ok: true, pixel_id: '', source: 'unconfigured' });
};
