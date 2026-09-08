// Lead do funil "10 reuniões" (oferta.vloom.pt/10reunioes).
// Cria/atualiza o contacto no GHL da Vloom com a tag 10reunioes, deixa nota com o
// contexto e abre oportunidade no pipeline Venda, etapa "Chegada de Lead".
// Variáveis de ambiente no projeto Vercel: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const PIPELINE_VENDA = 'Un2h7k4hLMXrtz3t5MTe';
const STAGE_CHEGADA = '1938d5e5-3ff5-42b8-ade2-b06cc58b3bb6'; // "Chegada de Lead"
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
// Destino dos avisos de lead deste funil. Ordem do Tiago (03/09/2026): marketing@vloom.pt.
// Já existe como contacto no GHL (03KNs3OHpCuGb2auvNeu) e sem DND de email.
const AVISO_INTERNO = process.env.GHL_AVISO_10REUNIOES || 'marketing@vloom.pt';

const slug = s => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

async function ghlEmail(headers, contactId, subject, html) {
  try {
    const r = await fetch(`${GHL}/conversations/messages`, {
      method: 'POST', headers,
      body: JSON.stringify({ type: 'Email', contactId, subject, html }),
    });
    return { status: r.status };
  } catch (err) { return { erro: String(err) }; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.GHL_PIT;
  const locationId = process.env.GHL_LOCATION_VLOOM;
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) {
    return res.status(403).json({ ok: false, error: 'origem não autorizada' });
  }
  // Armadilha de robôs. O nome do campo é neutro de propósito: chamava-se
  // "empresa_site" e o preenchimento automático do browser reconhecia-o como
  // "site da empresa", o que fazia cair candidaturas verdadeiras em silêncio.
  const engodo = b.cx_ref || b.empresa_site;
  if (engodo) {
    console.warn('lead-10reunioes: descartado pela armadilha', {
      email: b.email || b.nome, engodo: String(engodo).slice(0, 40),
    });
    return res.status(200).json({ ok: false, bot: true });
  }

  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });

  // A LP manda nome/empresa/email/telefone; aceitar também os nomes em inglês.
  const nome = (b.firstName || b.nome || '').trim();
  const email = (b.email || '').trim();
  const phone = (b.phone || b.telefone || '').trim();
  const empresa = (b.empresa || b.companyName || '').trim();
  if (!email && !phone) return res.status(400).json({ ok: false, error: 'sem contacto' });

  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid']
    .filter(k => b[k]).map(k => `${k}=${b[k]}`).join(' · ');

  const tags = ['10reunioes-candidatura'];
  if (b.utm_campaign) tags.push('camp-' + slug(b.utm_campaign));

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };

  try {
    // Só campos COM valor: strings vazias no upsert apagavam dados de um contacto já existente.
    const corpo = { locationId, source: b.source || 'LP 10 reuniões' };
    if (nome) corpo.firstName = nome;
    if (email) corpo.email = email;
    if (phone) corpo.phone = phone;
    if (empresa) corpo.companyName = empresa;

    const up = await fetch(`${GHL}/contacts/upsert`, {
      method: 'POST', headers, body: JSON.stringify(corpo),
    });
    const data = await up.json();
    const contactId = data?.contact?.id || data?.id;
    if (!up.ok || !contactId) return res.status(200).json({ ok: false, ghl: data });

    // Tags aditivas: nunca substituem as que o contacto já tem.
    await fetch(`${GHL}/contacts/${contactId}/tags`, {
      method: 'POST', headers, body: JSON.stringify({ tags }),
    }).catch(() => {});

    const nota = [
      'Candidatura da LP 10 reuniões (setup uma vez, mensalidade às 10 reuniões realizadas).',
      empresa ? `Empresa: ${empresa}` : '',
      utm ? `Campanha: ${utm}` : '',
      b.page ? `Página: ${b.page}` : '',
    ].filter(Boolean).join('\n');

    await fetch(`${GHL}/contacts/${contactId}/notes`, {
      method: 'POST', headers, body: JSON.stringify({ body: nota }),
    }).catch(() => {});

    // upsert: a mesma pessoa a submeter 2x não cria oportunidades duplicadas.
    await fetch(`${GHL}/opportunities/upsert`, {
      method: 'POST', headers,
      body: JSON.stringify({
        locationId,
        pipelineId: PIPELINE_VENDA,
        pipelineStageId: process.env.GHL_STAGE_10REUNIOES || STAGE_CHEGADA,
        contactId,
        name: `${nome || 'Lead'}${empresa ? ' — ' + empresa : ''} — 10 reuniões`,
        status: 'open',
      }),
    }).catch(() => {});

    // Aviso interno por email.
    let aviso = null;
    try {
      const upT = await fetch(`${GHL}/contacts/upsert`, {
        method: 'POST', headers,
        body: JSON.stringify({ locationId, email: AVISO_INTERNO, firstName: 'Vloom Marketing' }),
      }).then(r => r.json()).catch(() => null);
      const tId = upT?.contact?.id || upT?.id;
      if (tId) {
        const html = `<p><b>Candidatura nova — 10 reuniões</b></p>
<p>Nome: ${esc(nome) || '—'}<br>Empresa: ${esc(empresa) || '—'}<br>
Email: ${esc(email) || '—'}<br>Telefone: ${esc(phone) || '—'}</p>
${utm ? `<p>Campanha: ${esc(utm)}</p>` : ''}`;
        const envio = await ghlEmail(headers, tId, `Candidatura 10 reuniões — ${nome || email || phone}`, html);
        aviso = { para: AVISO_INTERNO, ...envio };
      }
    } catch (_) {}

    return res.status(200).json({ ok: true, contactId, aviso });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err) });
  }
};
