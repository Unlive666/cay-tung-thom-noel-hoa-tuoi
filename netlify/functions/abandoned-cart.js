// Netlify Serverless Function: Abandoned Cart Capture Proxy
const BACKEND_ABANDONED_URL = process.env.BACKEND_ABANDONED_URL || 'https://dua-sap-chatbot.onrender.com/api/meo-abandoned-cart';

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
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false }) };
  }

  try {
    const res = await fetch(BACKEND_ABANDONED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body || '{}'
    });
    const text = await res.text();
    return { statusCode: res.status, headers, body: text };
  } catch {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, queued: false }) };
  }
};
