// Netlify Serverless Function: Secure Order Proxy -> Render / VPS Cloud Gateway
// Zero secrets hardcoded in repo; supports optional TELEGRAM_BOT_TOKEN env backup on Netlify.

const BACKEND_ORDER_URL = process.env.BACKEND_ORDER_URL || 'https://dua-sap-chatbot.onrender.com/api/meo-order';

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }) };
  }

  const rawBody = event.body || '{}';
  let parsed = {};
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
  }

  // Honeypot check
  if (parsed.website_url && String(parsed.website_url).trim() !== '') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ignored: true }) };
  }

  try {
    const res = await fetch(BACKEND_ORDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawBody
    });
    if (res.ok) {
      const text = await res.text();
      return { statusCode: res.status, headers, body: text };
    }
  } catch (err) {
    // Fallback to direct Telegram env alert if configured in Netlify dashboard
  }

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const msg =
      `🌐🎄 <b>ĐƠN HÀNG WEBSITE (NETLIFY BACKUP)</b>\n` +
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

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      order: { order_id: parsed.orderId || `MD-${Date.now().toString().slice(-6)}` }
    })
  };
};
