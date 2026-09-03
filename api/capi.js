// Meta Conversions API — relay para o pixel 441661273501928.
// Recebe o evento do cliente, faz hash do email/telefone e envia para a Meta.
// Deduplica com o Pixel pelo mesmo event_id.
// Env vars: META_CAPI_TOKEN, META_PIXEL_ID. Sem token devolve 200 {skipped} para
// nunca partir a página — fica só o Pixel do lado do browser.
// CommonJS: sem package.json {"type":"module"}, a Vercel trata /api/*.js como CJS.
const crypto = require('crypto');

const sha256 = v => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
const telE164 = v => String(v || '').replace(/[^0-9]/g, '');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const TOKEN = process.env.META_CAPI_TOKEN;
  const PIXEL = process.env.META_PIXEL_ID || '441661273501928';

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  const cd = b.customData || b.custom_data || {};
  b = { ...cd, ...b };

  if (!TOKEN) return res.status(200).json({ skipped: 'no_token' });

  const ua = req.headers['user-agent'] || '';
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();

  const user_data = { client_user_agent: ua };
  if (ip) user_data.client_ip_address = ip;
  if (b.email) user_data.em = [sha256(b.email)];
  if (b.phone) user_data.ph = [sha256(telE164(b.phone))];
  if (b.firstName) user_data.fn = [sha256(b.firstName)];
  if (b.fbp) user_data.fbp = b.fbp;
  if (b.fbc) user_data.fbc = b.fbc;

  const event = {
    event_name: b.eventName || 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: b.eventId,
    action_source: 'website',
    event_source_url: b.sourceUrl,
    user_data,
    custom_data: {},
  };
  if (b.value != null) { event.custom_data.value = b.value; event.custom_data.currency = b.currency || 'EUR'; }
  if (b.contentName) event.custom_data.content_name = b.contentName;

  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL}/events?access_token=${TOKEN}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [event] }),
    });
    const j = await r.json();
    return res.status(200).json({ ok: r.ok, meta: j });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
};
