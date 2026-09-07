// Lead do funil "As 100 Empresas": contacto no GHL com tag 100empresas-candidatura,
// nota com o perfil de cliente ideal e oportunidade em Venda / Chegada de Lead.
// Aviso para tiagoseverino@vloom.pt (ordem dele, 07/09/2026).
// Env: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const PIPELINE_VENDA = 'Un2h7k4hLMXrtz3t5MTe';
const STAGE_CHEGADA = '1938d5e5-3ff5-42b8-ade2-b06cc58b3bb6';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const AVISO = process.env.GHL_AVISO_100EMPRESAS || 'tiagoseverino@vloom.pt';
const AVISO_RECUO = 'marketing@vloom.pt'; // o contacto dele tem DND no email; sem isto o aviso perdia-se
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const um = v => Array.isArray(v) ? String(v[0] || '').trim() : String(v || '').trim();

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

  const nome = (b.nome || '').trim(), email = (b.email || '').trim();
  const phone = (b.telefone || b.phone || '').trim(), empresa = (b.empresa || '').trim();
  if (!email && !phone) return res.status(400).json({ ok: false, error: 'sem contacto' });

  const p = b.perfil || {};
  const perfil = [['Setor', um(p.setor)], ['Zona', um(p.zona)], ['Dimensão', um(p.dimensao)],
                  ['Decisor', um(p.decisor)], ['Ticket', um(p.ticket)]].filter(x => x[1]);
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };

  try {
    const corpo = { locationId, source: b.source || 'LP 100 empresas' };
    if (nome) corpo.firstName = nome;
    if (email) corpo.email = email;
    if (phone) corpo.phone = phone;
    if (empresa) corpo.companyName = empresa;
    const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify(corpo) });
    const data = await up.json(); const contactId = data?.contact?.id || data?.id;
    if (!up.ok || !contactId) return res.status(200).json({ ok: false, ghl: data });

    await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['100empresas-candidatura'] }) }).catch(() => {});
    const nota = ['Pedido da LP As 100 Empresas. Falta enviar a lista.',
      empresa ? `Empresa: ${empresa}` : '',
      perfil.length ? 'Perfil de cliente ideal:\n' + perfil.map(x => `- ${x[0]}: ${x[1]}`).join('\n') : '',
      b.utm_source ? `Origem: ${b.utm_source} / ${b.utm_campaign || ''}` : '',
      b.page ? `Página: ${b.page}` : ''].filter(Boolean).join('\n');
    await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: nota }) }).catch(() => {});
    await fetch(`${GHL}/opportunities/upsert`, { method: 'POST', headers, body: JSON.stringify({
      locationId, pipelineId: PIPELINE_VENDA, pipelineStageId: STAGE_CHEGADA, contactId,
      name: `${nome || 'Lead'}: 100 empresas`, status: 'open' }) }).catch(() => {});

    let aviso = null;
    try {
      const html0 = null;
      for (const destino of [AVISO, AVISO_RECUO]) {
      const upT = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify({ locationId, email: destino, firstName: destino === AVISO ? 'Tiago Severino' : 'Vloom Marketing' }) }).then(r => r.json());
      const tId = upT?.contact?.id || upT?.id;
      if (tId) {
        const html = `<p><b>Pedido novo, As 100 Empresas</b></p>`
          + `<p>Nome: ${esc(nome) || 'sem dados'}<br>Empresa: ${esc(empresa) || 'sem dados'}<br>Email: ${esc(email) || 'sem dados'}<br>Telefone: ${esc(phone) || 'sem dados'}</p>`
          + `<p><b>Perfil de cliente ideal</b><br>${perfil.map(x => `${esc(x[0])}: ${esc(x[1])}`).join('<br>')}</p>`
          + `<p>A lista das 100 empresas ainda tem de ser preparada e enviada a este contacto.</p>`;
        const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers, body: JSON.stringify({ type: 'Email', contactId: tId, subject: `100 empresas: ${nome || email}`, html }) });
        aviso = { para: destino, status: r.status };
        if (r.ok) break;
      }
      }
    } catch (_) {}
    return res.status(200).json({ ok: true, contactId, aviso });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
};
