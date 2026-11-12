// Vercel Serverless Function: Secure Order Proxy -> Render / VPS Cloud Gateway
// Zero secrets hardcoded in repo; supports optional TELEGRAM_BOT_TOKEN env backup on Vercel.

const BACKEND_ORDER_URL = process.env.BACKEND_ORDER_URL || 'https://dua-sap-chatbot.onrender.com/api/meo-order';

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  let parsed = req.body;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed || '{}');
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  } else if (!parsed || typeof parsed !== 'object') {
    parsed = {};
  }

  // Honeypot check
  if (parsed.website_url && String(parsed.website_url).trim() !== '') {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const rawBody = JSON.stringify(parsed);

  try {
    const upstream = await fetch(BACKEND_ORDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawBody
    });
    if (upstream.ok) {
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }
  } catch {
    // Fallback to direct Telegram env alert if configured in Vercel dashboard
  }

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const msg =
      `🌐🎄 <b>ĐƠN HÀNG WEBSITE (VERCEL BACKUP)</b>\n` +
      `👤 Khách: <b>${parsed.name || 'Khách Web'}</b>\n` +
      `📞 SĐT: <code>${parsed.phone || ''}</code>\n` +
      `📍 Đ/C: ${parsed.address || ''}\n` +
      `🌲 Mẫu: <b>${parsed.quantity || 1}x ${parsed.variant || ''}</b>\n` +
      `💳 TT: ${parsed.payment_method || 'COD'}\n` +
      (parsed.card_message ? `💌 Thiệp: <i>${parsed.card_message}</i>\n` : '');
    try {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: msg,
          parse_mode: 'HTML'
        })
      });
    } catch {}
  }

  return res.status(200).json({
    ok: true,
    order: { order_id: parsed.orderId || `MD-${Date.now().toString().slice(-6)}` }
  });
};
