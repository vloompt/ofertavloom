// Registo no webinar de 7 de outubro de 2026.
// Contacto no GHL com tag do webinar e tag do segmento (a resposta do passo 1),
// nota com a resposta, e email de confirmação com o link do Zoom.
// Sem oportunidade no pipeline: um webinar traz centenas de registos e não são candidaturas.
// Env: GHL_PIT, GHL_LOCATION_VLOOM, ZOOM_LINK_WEBINAR2026, GHL_AVISO_WEBINAR2026
const GHL = 'https://services.leadconnectorhq.com';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const AVISO_INTERNO = process.env.GHL_AVISO_WEBINAR2026 || 'marketing@vloom.pt';
// cópia para o Tiago (o contacto dele tem «não incomodar» no email, por isso vai em cópia, como no funil 100 Clientes Ideais)
const AVISO_CC = (process.env.GHL_AVISO_CC_WEBINAR2026 || 'tiagoseverino@vloom.pt').split(',').map(x => x.trim()).filter(Boolean);
const QUANDO = 'quarta-feira, 7 de outubro, às 21h00 de Lisboa';
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

// Email ao lead, com a marca Vloom (mesma linha gráfica do email de 100 Clientes Ideais).
const IMG = 'https://oferta.vloom.pt/email/';
function emailLeadHtml({ primeiro, linhaZoom }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f3f9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#252158">
  <tr><td style="background:#252158;background-image:linear-gradient(135deg,#252158 0%,#3b4a9c 60%,#8d489b 100%);padding:30px 40px 34px">
    <img src="${IMG}vloom-logo-branco.png" width="120" alt="Vloom" style="display:block;border:0;width:120px;height:auto">
    <p style="margin:26px 0 0;color:#77cef4;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700">Webinar · 7 de outubro</p>
    <h1 style="margin:10px 0 0;color:#ffffff;font-size:25px;line-height:1.3;font-weight:800">O seu lugar está guardado${primeiro ? ', ' + primeiro : ''}.</h1>
  </td></tr>
  <tr><td style="padding:34px 40px 6px">
    <p style="margin:0;font-size:16px;line-height:1.6;color:#3d3f5c">O webinar é <b style="color:#252158">${QUANDO}</b>. As portas abrem às 20h50 e começamos em ponto.</p>
  </td></tr>
  <tr><td style="padding:20px 40px 4px">${linhaZoom}</td></tr>
  <tr><td style="padding:20px 40px 4px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fb;border-radius:10px;overflow:hidden"><tr><td style="padding:20px 24px">
      <p style="margin:0 0 12px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#8d489b">Antes de quarta</p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#3d3f5c">1. Marque na agenda — 7 de outubro, 21h00.</p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#3d3f5c">2. Tenha à mão quatro números: valor de um cliente, margem, meta e taxa de fecho. A meio vai usá-los para fazer a sua conta.</p>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#3d3f5c">3. Reserve as duas horas. A sessão tem exercícios e não se acompanha em diagonal.</p>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:20px 40px 8px">
    <p style="margin:0;font-size:16px;line-height:1.65;color:#3d3f5c">Enviamos um lembrete na véspera — e outro uma hora antes de começar.</p>
  </td></tr>
  <tr><td style="padding:22px 40px 8px">
    <p style="margin:0 0 14px;font-size:16px;color:#3d3f5c">Até quarta,</p>
    <img src="${IMG}assinatura-tiago.png" width="480" alt="Tiago Severino, Head of Marketing, Vloom" style="display:block;border:0;width:100%;max-width:480px;height:auto">
  </td></tr>
  <tr><td style="padding:22px 40px 30px">
    <p style="margin:0;border-top:1px solid #ecebf4;padding-top:16px;font-size:11px;line-height:1.5;color:#8b8fa8"><a href="https://vloom.pt/politica-de-privacidade/" style="color:#8b8fa8">Política de Privacidade</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

// segmento a partir da resposta do micro-compromisso
function segmento(r) {
  const t = String(r || '').toLowerCase();
  if (t.includes('quantas leads')) return 'webinar2026-falha-numeros';
  if (t.includes('não viram reuniões')) return 'webinar2026-falha-conversao';
  if (t.includes('não fecho')) return 'webinar2026-falha-comercial';
  if (t.includes('volume')) return 'webinar2026-falha-volume';
  if (t.includes('gravação')) return 'webinar2026-quer-gravacao';
  if (t.includes('ao vivo')) return 'webinar2026-ao-vivo';
  return '';
}

module.exports = async function handler(req, res) {
  const o = req.headers.origin || '';
  if (o && ORIGENS_OK.some(h => o.includes(h))) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.empresa_site) return res.status(200).json({ ok: true, bot: true });
  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });

  const nome = (b.nome || '').trim();
  const email = (b.email || '').trim();
  const phone = (b.telefone || b.phone || '').trim();
  const resposta = (b.resposta || '').trim();
  if (!email) return res.status(400).json({ ok: false, error: 'sem email' });

  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  const zoom = process.env.ZOOM_LINK_WEBINAR2026 || '';

  // passo 2 da página de obrigado: só grava o telemóvel para os lembretes por SMS (sem emails)
  if (b.acao === 'telefone') {
    const num = String(phone).replace(/[^0-9]/g, '').replace(/^00351|^351/, '');
    if (!/^9[1236]\d{7}$/.test(num)) return res.status(400).json({ ok: false, error: 'telemóvel inválido' });
    try {
      const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify({ locationId, email, phone: '+351' + num }) });
      const data = await up.json();
      const contactId = data?.contact?.id || data?.id;
      if (!up.ok || !contactId) return res.status(200).json({ ok: false });
      await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['webinar2026-sms'] }) }).catch(() => {});
      return res.status(200).json({ ok: true, contactId });
    } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
  }

  try {
    const corpo = { locationId, email, source: 'Webinar 7 outubro 2026' };
    if (nome) corpo.firstName = nome;
    if (phone) corpo.phone = phone;
    const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify(corpo) });
    const data = await up.json();
    const contactId = data?.contact?.id || data?.id;
    if (!up.ok || !contactId) return res.status(200).json({ ok: false, ghl: data });

    const tags = ['webinar2026-registo'];
    const seg = segmento(resposta);
    if (seg) tags.push(seg);
    await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags }) }).catch(() => {});

    const nota = ['Registo no webinar de 7 de outubro de 2026.',
      resposta ? `Onde diz que a aquisição falha: ${resposta}` : '',
      phone ? 'Deixou telemóvel para o lembrete por SMS.' : 'Sem telemóvel.',
      b.page ? `Página: ${b.page}` : ''].filter(Boolean).join('\n');
    await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: nota }) }).catch(() => {});

    // confirmação por email, na linha gráfica da Vloom
    let mail = null;
    try {
      const linhaZoom = zoom
        ? `<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#252158">O seu link para entrar:</p><p style="margin:0;font-size:16px"><a href="${zoom}" style="color:#8d489b">${zoom}</a></p>`
        : `<p style="margin:0;font-size:16px;line-height:1.6;color:#3d3f5c">O link do Zoom segue neste email assim que a sala abrir. Fica também na página de confirmação.</p>`;
      const html = emailLeadHtml({ primeiro: esc(nome), linhaZoom });
      const r = await fetch(`${GHL}/conversations/messages`, {
        method: 'POST', headers,
        body: JSON.stringify({ type: 'Email', contactId, subject: 'Lugar guardado: quarta, 7 de outubro às 21h00', html })
      });
      mail = { status: r.status, comLink: !!zoom };
    } catch (_) {}

    // aviso interno por email
    let aviso = null;
    try {
      const upT = await fetch(`${GHL}/contacts/upsert`, {
        method: 'POST', headers, body: JSON.stringify({ locationId, email: AVISO_INTERNO, firstName: 'Vloom Marketing' }),
      }).then(r => r.json()).catch(() => null);
      const tId = upT?.contact?.id || upT?.id;
      if (tId) {
        const html = `<p><b>Registo novo — Webinar 7 de outubro</b></p>
<p>Nome: ${esc(nome) || '—'}<br>Email: ${esc(email) || '—'}<br>Telefone: ${esc(phone) || '—'}</p>
${resposta ? `<p>Onde diz que a aquisição falha: ${esc(resposta)}</p>` : ''}`;
        const envio = await fetch(`${GHL}/conversations/messages`, {
          method: 'POST', headers,
          body: JSON.stringify({ type: 'Email', contactId: tId, emailCc: AVISO_CC, subject: `Registo webinar — ${nome || email}`, html }),
        });
        aviso = { para: AVISO_INTERNO, cc: AVISO_CC, status: envio.status };
      }
    } catch (_) {}

    return res.status(200).json({ ok: true, contactId, mail, aviso });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
};
