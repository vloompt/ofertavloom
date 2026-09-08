// Marca no GHL quem agendou a reunião no funil dos 100 clientes ideais.
// Duas formas de chegar aqui, porque o calendário é partilhado com os outros funis
// e o seu redirecionamento aponta para outro site (não se lhe toca):
//   1. a página de marcar pergunta de tempos a tempos se já existe marcação (verifica=1);
//   2. a página de reunião marcada avisa ao ser aberta (força a tag).
// Env: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const TAG = '100clientesideais-marcou';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];

module.exports = async function handler(req, res) {
  const o = req.headers.origin || '';
  if (o && ORIGENS_OK.some(h => o.includes(h))) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };

  try {
    let contactId = b.contactId;
    if (!contactId && b.email) {
      const q = await fetch(`${GHL}/contacts/?locationId=${locationId}&query=${encodeURIComponent(b.email)}&limit=1`, { headers })
        .then(r => r.json()).catch(() => null);
      contactId = q?.contacts?.[0]?.id;
    }
    if (!contactId) return res.status(200).json({ ok: false, error: 'sem contacto' });

    // Quando a página só quer saber se já há marcação, confirmamos na agenda antes de marcar a tag.
    if (b.verifica) {
      const ev = await fetch(`${GHL}/contacts/${contactId}/appointments`, { headers })
        .then(r => r.json()).catch(() => null);
      const marcacoes = (ev?.events || []).filter(e => (e.appointmentStatus || 'confirmed') !== 'cancelled');
      if (!marcacoes.length) return res.status(200).json({ ok: true, marcou: false });
    }

    await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: [TAG] }) });
    return res.status(200).json({ ok: true, marcou: true, contactId, tag: TAG });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
};
