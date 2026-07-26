// Recebe o lead da LP e cria/atualiza o contacto no GHL da Vloom com a tag site297.
// Variáveis de ambiente no projeto Vercel: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const PIPELINE_297 = 'XpnWU8QhxoIqDFvijht9';
const STAGE_LEAD = 'dea41eec-bffa-4e2a-8dec-9f30c55b8dc7'; // "1. Lead (formulario LP)"
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];

const { emailLead, emailInterno } = require('./_emails');
// Contacto DEDICADO de avisos ("Vloom Avisos"): o +avisos entrega na caixa do Tiago,
// mas no GHL é um contacto próprio — sem o DND de email do contacto pessoal dele.
const AVISO_INTERNO = 'tiagoseverino+avisos@vloom.pt';

const slug = s => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Envia um email pelo GHL a partir de um contactId (type Email)
async function ghlEmail(headers, contactId, subject, html) {
  try {
    const r = await fetch(`${GHL}/conversations/messages`, {
      method: 'POST', headers,
      body: JSON.stringify({ type: 'Email', contactId, subject, html }),
    });
    const txt = await r.text();
    let j; try { j = JSON.parse(txt); } catch { j = { raw: txt.slice(0, 200) }; }
    return { status: r.status, ...j };
  } catch (err) { return { erro: String(err) }; }
}

// CommonJS: sem package.json {"type":"module"}, a Vercel trata /api/*.js como CJS
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.GHL_PIT;
  const locationId = process.env.GHL_LOCATION_VLOOM;
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Só aceita pedidos vindos das nossas páginas
  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) {
    return res.status(403).json({ ok: false, error: 'origem não autorizada' });
  }
  // Armadilha para robôs: campo escondido que só um bot preenche
  if (b.empresa_site) return res.status(200).json({ ok: true, bot: true });

  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });
  if (!b.email && !b.phone) return res.status(400).json({ ok: false, error: 'sem contacto' });

  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid']
    .filter(k => b[k]).map(k => `${k}=${b[k]}`).join(' · ');

  const tags = ['site297'];
  if (b.setor) tags.push('setor-' + slug(b.setor));
  if (b.utm_campaign) tags.push('camp-' + slug(b.utm_campaign));

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };

  try {
    // Só enviar campos COM valor: strings vazias no upsert apagariam dados de um
    // contacto já existente (e as tags vão à parte, para nunca substituir as dele).
    const corpo = { locationId, source: b.source || 'LP Sites 297' };
    if (b.firstName) corpo.firstName = b.firstName;
    if (b.email) corpo.email = b.email;
    if (b.phone) corpo.phone = b.phone;
    const up = await fetch(`${GHL}/contacts/upsert`, {
      method: 'POST',
      headers,
      body: JSON.stringify(corpo),
    });
    const data = await up.json();
    const contactId = data?.contact?.id || data?.id;
    if (!up.ok || !contactId) return res.status(200).json({ ok: false, ghl: data });

    // Tags ADITIVAS (POST /contacts/{id}/tags acrescenta sem tocar nas existentes)
    await fetch(`${GHL}/contacts/${contactId}/tags`, {
      method: 'POST', headers, body: JSON.stringify({ tags }),
    }).catch(() => {});

    // Nota com o contexto da campanha — visível na ficha do contacto
    const nota = [
      `Lead da LP Sites 297 (297€/mês).`,
      b.setor ? `Setor: ${b.setor}` : '',
      utm ? `Campanha: ${utm}` : '',
      b.page ? `Página: ${b.page}` : '',
    ].filter(Boolean).join('\n');

    await fetch(`${GHL}/contacts/${contactId}/notes`, {
      method: 'POST', headers, body: JSON.stringify({ body: nota, userId: undefined }),
    }).catch(() => {});

    // Oportunidade no pipeline do funil, na etapa "1. Lead (formulario LP)".
    // upsert: a mesma pessoa a submeter 2x não cria oportunidades duplicadas.
    {
      await fetch(`${GHL}/opportunities/upsert`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          locationId,
          pipelineId: PIPELINE_297,
          pipelineStageId: process.env.GHL_STAGE_297 || STAGE_LEAD,
          contactId,
          name: `${b.firstName || 'Lead'} — Sites 297`,
          status: 'open',
          monetaryValue: 297,
        }),
      }).catch(() => {});
    }

    // Emails (awaited — no serverless a função pode ser congelada após a resposta).
    // Falham em silêncio: nunca partem a submissão do lead.
    try {
      if (b.email) {
        const e = emailLead({ firstName: b.firstName });
        await ghlEmail(headers, contactId, e.subject, e.html);
      }
      // Aviso interno para o contacto dedicado "Vloom Avisos" (+avisos entrega na
      // caixa do Tiago sem o DND de email do contacto pessoal dele).
      const upT = await fetch(`${GHL}/contacts/upsert`, {
        method: 'POST', headers,
        body: JSON.stringify({ locationId, email: AVISO_INTERNO, firstName: 'Vloom Avisos' }),
      }).then(r => r.json()).catch(() => null);
      const tId = upT?.contact?.id || upT?.id;
      if (tId) {
        const e = emailInterno({ firstName: b.firstName, email: b.email, phone: b.phone, setor: b.setor, utm, page: b.page });
        await ghlEmail(headers, tId, e.subject, e.html);
      }
    } catch (_) {}

    return res.status(200).json({ ok: true, contactId });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err) });
  }
}
