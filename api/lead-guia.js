// Lead dos guias grátis (oferta.vloom.pt/guia-ia/, /guia-google-ads/, /guia-marketing-conteudos/).
// Substituem as páginas mortas do bonus.vloom.pt (404 desde agosto de 2026).
// Cria/atualiza o contacto no GHL da Vloom, põe a tag do guia, deixa nota e dispara o workflow do guia (que envia o PDF).
// Env: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'localhost'];
const REMETENTE = process.env.GHL_REMETENTE_VLOOM || 'Tiago Severino <tiagoseverino@vloom.pt>';
const IMG = 'https://oferta.vloom.pt/email/';

// Um guia por página. Quem envia o guia é o workflow do GHL («🎁 bonus.vloom.pt/…»), disparado pelo seu
// webhook de entrada com os mesmos campos que o site antigo mandava (ordem do Tiago, 15/09/2026).
// `pdf`/`capa` servem o modelo de email e ficam como referência.
const GUIAS = {
  'guia-ia': {
    tag: 'guia-ia-pedido',
    webhook: 'https://services.leadconnectorhq.com/hooks/q5RdiM6QfGioAIRTlZ3Q/webhook-trigger/633f328b-778f-46b9-bb33-c4e8e7242a11',
    origem: 'Squeeze Page IA para CEOs',
    fonte: 'Guia IA para Empresários',
    titulo: 'Guia Prático de IA para CEOs que Já Faturam Milhões',
    pdf: 'https://drive.google.com/file/d/1fPx4bqWwnXMbBEEf6WGqWCyChxiaMW3Y/view',
    capa: 'https://oferta.vloom.pt/email/guia-ia-capa.jpg',
  },
  'guia-google-ads': {
    tag: 'guia-google-ads-pedido',
    webhook: 'https://services.leadconnectorhq.com/hooks/q5RdiM6QfGioAIRTlZ3Q/webhook-trigger/f8f858b4-84d6-4fb4-884e-c1e1dc51f98c',
    origem: 'Squeeze Page Google Ads',
    fonte: 'Guia Google Ads',
    titulo: 'Como Criar Anúncios de Pesquisa em Google Ads',
    pdf: 'https://drive.google.com/file/d/1mWtjFu3sH3Ab2SzuJg1yEfSDp1KLhIrX/view',
    capa: 'https://oferta.vloom.pt/email/guia-google-ads-capa.jpg',
  },
  'guia-marketing-conteudos': {
    tag: 'guia-conteudos-pedido',
    webhook: 'https://services.leadconnectorhq.com/hooks/q5RdiM6QfGioAIRTlZ3Q/webhook-trigger/6b89942f-d296-4168-9e69-c2c4a5c37157',
    origem: 'Marketing de Conteúdos',
    fonte: 'Guia Marketing de Conteúdos',
    titulo: 'Como Construir uma Estratégia de Marketing de Conteúdos que Domina o Teu Nicho',
    // Não está no Drive como os outros: o PDF vive na própria página.
    pdf: 'https://oferta.vloom.pt/guia-marketing-conteudos/guia-marketing-conteudos-vloom.pdf',
    capa: 'https://oferta.vloom.pt/email/guia-marketing-conteudos-capa.jpg',
  },
};

const esc = s => String(s || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const slug = s => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function emailGuiaHtml({ primeiro, g }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f3f9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#252158">
  <tr><td style="background:#252158;background-image:linear-gradient(135deg,#252158 0%,#3b4a9c 60%,#8d489b 100%);padding:30px 40px 34px">
    <img src="${IMG}vloom-logo-branco.png" width="120" alt="Vloom" style="display:block;border:0;width:120px;height:auto">
    <p style="margin:26px 0 0;color:#77cef4;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700">Guia gratuito</p>
    <h1 style="margin:10px 0 0;color:#ffffff;font-size:25px;line-height:1.3;font-weight:800">Aqui está o seu guia${primeiro ? ', ' + primeiro : ''}.</h1>
  </td></tr>
  <tr><td style="padding:34px 40px 6px">
    <p style="margin:0;font-size:16px;line-height:1.65;color:#3d3f5c">Como prometido, segue o <b style="color:#252158">${esc(g.titulo)}</b>.</p>
  </td></tr>
  <tr><td style="padding:22px 40px 4px">
    <a href="${g.pdf}" style="text-decoration:none"><img src="${g.capa}" width="520" alt="${esc(g.titulo)}" style="display:block;border:1px solid #ecebf4;border-radius:10px;width:100%;max-width:520px;height:auto"></a>
  </td></tr>
  <tr><td align="center" style="padding:26px 40px 8px">
    <a href="${g.pdf}" style="display:inline-block;background:#8d489b;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 34px;border-radius:999px">Abrir o guia</a>
  </td></tr>
  <tr><td style="padding:22px 40px 8px">
    <p style="margin:0 0 14px;font-size:16px;color:#3d3f5c">Um abraço,</p>
    <img src="${IMG}assinatura-tiago.png" width="480" alt="Tiago Severino, Head of Marketing, Vloom" style="display:block;border:0;width:100%;max-width:480px;height:auto">
  </td></tr>
  <tr><td style="padding:22px 40px 30px">
    <p style="margin:0;border-top:1px solid #ecebf4;padding-top:16px;font-size:11px;line-height:1.5;color:#8b8fa8">Recebe este email porque pediu o guia em oferta.vloom.pt. · <a href="https://vloom.pt/politica-de-privacidade/" style="color:#8b8fa8">Política de Privacidade</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) {
    return res.status(403).json({ ok: false, error: 'origem não autorizada' });
  }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.empresa_site) return res.status(200).json({ ok: true, bot: true });

  const g = GUIAS[b.guia];
  if (!g) return res.status(400).json({ ok: false, error: 'guia desconhecido' });

  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });

  const nome = (b.nome || '').trim(), email = (b.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'email inválido' });

  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  try {
    const corpo = { locationId, email, source: `LP ${g.fonte}` };
    if (nome) corpo.firstName = nome;
    const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify(corpo) });
    const data = await up.json(); const contactId = data?.contact?.id || data?.id;
    if (!up.ok || !contactId) return res.status(200).json({ ok: false, ghl: data });

    const tags = [g.tag];
    if (b.utm_campaign) tags.push('camp-' + slug(b.utm_campaign));
    await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags }) }).catch(() => {});

    const nota = [`Pediu o ${g.fonte} (${g.titulo}) em oferta.vloom.pt. O email com o PDF sai pelo workflow do GHL.`,
      b.utm_source ? `Origem: ${b.utm_source} / ${b.utm_campaign || ''}` : '',
      b.page ? `Página: ${b.page}` : ''].filter(Boolean).join('\n');
    await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: nota }) }).catch(() => {});

    // O workflow do guia cria/atualiza o contacto e envia o email com o PDF.
    // O formulário pede só o primeiro nome: vai inteiro para firstName (não se parte em nome e apelido).
    const wh = await fetch(g.webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: nome, lastName: '', email, phone: '', source: g.origem,
        pagina: b.page || '', utm_source: b.utm_source || '', utm_campaign: b.utm_campaign || '' }) }).catch((e) => ({ status: 0, erro: String(e) }));
    return res.status(200).json({ ok: true, contactId, workflow: { status: wh.status } });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
};
module.exports.emailGuiaHtml = emailGuiaHtml;
module.exports.GUIAS = GUIAS;
