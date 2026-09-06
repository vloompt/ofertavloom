// Lead do funil "3 clientes de sonho": contacto no GHL com tag 3clientes-candidatura,
// nota com os três nomes e oportunidade em Venda / Chegada de Lead. Aviso para marketing@vloom.pt.
// Env: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const PIPELINE_VENDA = 'Un2h7k4hLMXrtz3t5MTe';
const STAGE_CHEGADA = '1938d5e5-3ff5-42b8-ade2-b06cc58b3bb6';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const AVISO = process.env.GHL_AVISO_3CLIENTES || 'marketing@vloom.pt';
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

module.exports = async function handler(req, res) {
  const o = req.headers.origin || '';
  if (o && ORIGENS_OK.some(h => o.includes(h))) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.empresa_site) return res.status(200).json({ ok: true, bot: true });
  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });

  const nome = (b.nome || '').trim(), email = (b.email || '').trim(), phone = (b.telefone || b.phone || '').trim();
  const nomes = [b.c1, b.c2, b.c3].map(x => String(x || '').trim()).filter(Boolean);
  if (!email && !phone) return res.status(400).json({ ok: false, error: 'sem contacto' });
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };

  try {
    const corpo = { locationId, source: b.source || 'LP 3 clientes de sonho' };
    if (nome) corpo.firstName = nome; if (email) corpo.email = email; if (phone) corpo.phone = phone;
    const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify(corpo) });
    const data = await up.json(); const contactId = data?.contact?.id || data?.id;
    if (!up.ok || !contactId) return res.status(200).json({ ok: false, ghl: data });

    await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['3clientes-candidatura'] }) }).catch(() => {});
    const nota = ['Candidatura da LP 3 clientes de sonho.', nomes.length ? 'Os 3 clientes de sonho: ' + nomes.join(' · ') : '', b.page ? `Página: ${b.page}` : ''].filter(Boolean).join('\n');
    await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: nota }) }).catch(() => {});
    await fetch(`${GHL}/opportunities/upsert`, { method: 'POST', headers, body: JSON.stringify({
      locationId, pipelineId: PIPELINE_VENDA, pipelineStageId: STAGE_CHEGADA, contactId,
      name: `${nome || 'Lead'} — 3 clientes de sonho`, status: 'open' }) }).catch(() => {});

    let aviso = null;
    try {
      const upT = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify({ locationId, email: AVISO, firstName: 'Vloom Marketing' }) }).then(r => r.json());
      const tId = upT?.contact?.id || upT?.id;
      if (tId) {
        const html = `<p><b>Candidatura nova, 3 clientes de sonho</b></p><p>Nome: ${esc(nome)||'—'}<br>Email: ${esc(email)||'—'}<br>Telefone: ${esc(phone)||'—'}</p><p>Os três: ${esc(nomes.join(' · '))}</p>`;
        const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers, body: JSON.stringify({ type: 'Email', contactId: tId, subject: `3 clientes de sonho: ${nome || email}`, html }) });
        aviso = { para: AVISO, status: r.status };
      }
    } catch (_) {}
    return res.status(200).json({ ok: true, contactId, aviso });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
};
