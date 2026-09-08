// Registo no webinar de 7 de outubro de 2026.
// Contacto no GHL com tag do webinar e tag do segmento (a resposta do passo 1),
// nota com a resposta, e email de confirmação com o link do Zoom.
// Sem oportunidade no pipeline: um webinar traz centenas de registos e não são candidaturas.
// Env: GHL_PIT, GHL_LOCATION_VLOOM, ZOOM_LINK_WEBINAR2026
const GHL = 'https://services.leadconnectorhq.com';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const QUANDO = 'quarta-feira, 7 de outubro, às 21h00 de Lisboa';
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

// segmento a partir da resposta do micro-compromisso
function segmento(r) {
  const t = String(r || '').toLowerCase();
  if (t.includes('quantas leads')) return 'webinar2026-falha-numeros';
  if (t.includes('não viram reuniões')) return 'webinar2026-falha-conversao';
  if (t.includes('não fecho')) return 'webinar2026-falha-comercial';
  if (t.includes('volume')) return 'webinar2026-falha-volume';
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

    // confirmação por email
    let mail = null;
    try {
      const linha = zoom
        ? `<p><b>O seu link para entrar:</b><br><a href="${zoom}">${zoom}</a></p>`
        : `<p>O link do Zoom segue neste email assim que a sala abrir. Fica também na página de confirmação.</p>`;
      const html = `<p>Olá ${esc(nome) || 'e bem-vindo'},</p>
<p>O seu lugar está guardado. O webinar é <b>${QUANDO}</b>. As portas abrem às 20h50 e começamos em ponto.</p>
${linha}
<p><b>Antes de quarta:</b><br>
1. Marque na agenda - 7 de outubro, 21h00.<br>
2. Tenha papel ou uma folha de cálculo à mão. A meio vamos parar para calcular os seus números.<br>
3. Reserve as duas horas. A sessão tem exercícios e não se acompanha em diagonal.</p>
<p>Enviamos um lembrete na véspera - e outro uma hora antes de começar.</p>
<p>Até quarta,<br>Tiago Severino<br>Vloom</p>`;
      const r = await fetch(`${GHL}/conversations/messages`, {
        method: 'POST', headers,
        body: JSON.stringify({ type: 'Email', contactId, subject: 'Lugar guardado: quarta, 7 de outubro às 21h00', html })
      });
      mail = { status: r.status, comLink: !!zoom };
    } catch (_) {}

    return res.status(200).json({ ok: true, contactId, mail });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
};
