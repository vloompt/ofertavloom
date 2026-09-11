// Lead do funil "100 Clientes Ideais": contacto no GHL com tag 100empresas-candidatura,
// nota com o perfil de cliente ideal e oportunidade em Venda / Chegada de Lead.
// Aviso para tiagoseverino@vloom.pt (ordem dele, 07/09/2026).
// Env: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const loja = require('./_blob.js');
const PIPELINE_VENDA = 'Un2h7k4hLMXrtz3t5MTe';
const STAGE_CHEGADA = '1938d5e5-3ff5-42b8-ade2-b06cc58b3bb6';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
// O aviso vai ao contacto marketing@vloom.pt (que recebe) com o Tiago em cópia: o contacto dele no GHL
// tem «não incomodar» no email, posto pelo próprio fornecedor (devolução/spam), e o GHL recusa enviar-lhe.
const AVISO = 'marketing@vloom.pt';
const AVISO_CC = (process.env.GHL_AVISO_100CLIENTESIDEAIS || 'tiagoseverino@vloom.pt').split(',').map(x => x.trim()).filter(Boolean);
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const um = v => Array.isArray(v) ? String(v[0] || '').trim() : String(v || '').trim();
const lista = v => (Array.isArray(v) ? v : [v]).map(x => String(x || '').trim()).filter(Boolean);
const REMETENTE = process.env.GHL_REMETENTE_VLOOM || 'Tiago Severino <tiagoseverino@vloom.pt>';
// Numeros de teste (ex.: 919000000): demasiado curto, ou 5+ digitos repetidos seguidos.
const telefoneFalso = t => { const d = String(t || '').replace(/\D/g, ''); return d.length < 9 || /(\d)\1{4,}/.test(d); };
const INE={ano:2023,fonte:"INE, Sistema de Contas Integradas das Empresas",total:1510274,s:{"Indústria e produção":{"t":76680,"z":{"Norte":35635,"Centro":19173,"Área Metropolitana de Lisboa":12395,"Alentejo":4748,"Algarve":2469,"Açores e Madeira":2260},"d":{"Até 10 pessoas":63638,"10 a 50":10100,"50 a 250":2566,"Mais de 250":376}},"Construção e imobiliário":{"t":172653,"z":{"Norte":55565,"Centro":36184,"Área Metropolitana de Lisboa":53889,"Alentejo":8067,"Algarve":13258,"Açores e Madeira":5690},"d":{"Até 10 pessoas":164438,"10 a 50":7349,"50 a 250":796,"Mais de 250":70}},"Saúde e clínicas":{"t":118558,"z":{"Norte":42292,"Centro":23643,"Área Metropolitana de Lisboa":37105,"Alentejo":6023,"Algarve":4602,"Açores e Madeira":4893},"d":{"Até 10 pessoas":116416,"10 a 50":1864,"50 a 250":240,"Mais de 250":38}},"Serviços profissionais":{"t":401064,"z":{"Norte":118738,"Centro":69466,"Área Metropolitana de Lisboa":159177,"Alentejo":17879,"Algarve":20958,"Açores e Madeira":14846},"d":{"Até 10 pessoas":395542,"10 a 50":4389,"50 a 250":843,"Mais de 250":290}},"Retalho e distribuição":{"t":217389,"z":{"Norte":81950,"Centro":49669,"Área Metropolitana de Lisboa":52969,"Alentejo":14740,"Algarve":10823,"Açores e Madeira":7238},"d":{"Até 10 pessoas":206031,"10 a 50":10087,"50 a 250":1120,"Mais de 250":151}},"Tecnologia e software":{"t":33908,"z":{"Norte":8737,"Centro":4836,"Área Metropolitana de Lisboa":16921,"Alentejo":1053,"Algarve":1234,"Açores e Madeira":1127},"d":{"Até 10 pessoas":32164,"10 a 50":1290,"50 a 250":358,"Mais de 250":96}},"Hotelaria e restauração":{"t":125679,"z":{"Norte":35041,"Centro":22059,"Área Metropolitana de Lisboa":32690,"Alentejo":7955,"Algarve":19820,"Açores e Madeira":8114},"d":{"Até 10 pessoas":118073,"10 a 50":6845,"50 a 250":699,"Mais de 250":62}},"Transportes e logística":{"t":54103,"z":{"Norte":13916,"Centro":7415,"Área Metropolitana de Lisboa":24873,"Alentejo":2368,"Algarve":3699,"Açores e Madeira":1832},"d":{"Até 10 pessoas":51696,"10 a 50":1949,"50 a 250":380,"Mais de 250":78}},"Outro":{"t":310240,"z":{"Norte":110238,"Centro":65448,"Área Metropolitana de Lisboa":67703,"Alentejo":30786,"Algarve":16975,"Açores e Madeira":19090},"d":{"Até 10 pessoas":306024,"10 a 50":3610,"50 a 250":550,"Mais de 250":56}}}};
// Conta pelos dois cruzamentos reais do INE: setor x regiao e setor x dimensao.
function contaEmpresas(setores, zonas, dims) {
  let v = 0;
  for (const se of setores) {
    const d = INE.s[se]; if (!d) continue;
    let base = 0; for (const z of zonas) base += d.z[z] || 0;
    let q = 0; for (const x of dims) q += d.d[x] || 0;
    v += base * (d.t ? q / d.t : 0);
  }
  return Math.round(v);
}


// Email ao lead, com a marca Vloom. Sem botão de reunião (ordem dele, 10/09). Assinatura em imagem obrigatória.
const IMG = 'https://oferta.vloom.pt/email/';
function emailLeadHtml({ primeiro, quantas, linhas, ano }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f3f9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#252158">
  <tr><td style="background:#252158;background-image:linear-gradient(135deg,#252158 0%,#3b4a9c 60%,#8d489b 100%);padding:30px 40px 34px">
    <img src="${IMG}vloom-logo-branco.png" width="120" alt="Vloom" style="display:block;border:0;width:120px;height:auto">
    <p style="margin:26px 0 0;color:#77cef4;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700">100 Clientes Ideais</p>
    <h1 style="margin:10px 0 0;color:#ffffff;font-size:25px;line-height:1.3;font-weight:800">Recebemos o perfil do seu cliente ideal${primeiro ? ', ' + primeiro : ''}.</h1>
  </td></tr>
  <tr><td style="padding:34px 40px 6px">
    <p style="margin:0;font-size:16px;line-height:1.6;color:#3d3f5c">Segundo o INE, existem em Portugal</p>
    <p style="margin:6px 0 0;font-size:46px;line-height:1.1;font-weight:800;color:#8d489b">${quantas}</p>
    <p style="margin:4px 0 0;font-size:16px;line-height:1.6;color:#3d3f5c">empresas com esse perfil.</p>
  </td></tr>
  <tr><td style="padding:24px 40px 4px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fb;border-radius:10px;overflow:hidden">${linhas}</table>
  </td></tr>
  <tr><td style="padding:24px 40px 8px">
    <p style="margin:0;font-size:16px;line-height:1.65;color:#3d3f5c">Estamos a preparar as <b style="color:#252158">100 melhores</b> dessa lista, com nome, dimensão e quem decide lá dentro. Chega-lhe por email, deste mesmo endereço.</p>
  </td></tr>
  <tr><td style="padding:22px 40px 8px">
    <p style="margin:0 0 14px;font-size:16px;color:#3d3f5c">Um abraço,</p>
    <img src="${IMG}assinatura-tiago.png" width="480" alt="Tiago Severino, Head of Marketing, Vloom" style="display:block;border:0;width:100%;max-width:480px;height:auto">
  </td></tr>
  <tr><td style="padding:22px 40px 30px">
    <p style="margin:0;border-top:1px solid #ecebf4;padding-top:16px;font-size:11px;line-height:1.5;color:#8b8fa8">Número de empresas: INE, Sistema de Contas Integradas das Empresas, ${ano}. Região e dimensão são contadas em separado. · <a href="https://vloom.pt/politica-de-privacidade/" style="color:#8b8fa8">Política de Privacidade</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

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
  let phone = (b.telefone || b.phone || '').trim();
  const empresa = (b.empresa || '').trim();
  if (phone && telefoneFalso(phone)) phone = '';
  if (!email && !phone) return res.status(400).json({ ok: false, error: 'sem contacto' });

  const p = b.perfil || {};
  const setores = lista(p.setor), zonas = lista(p.zona), dims = lista(p.dimensao);
  const quantas = contaEmpresas(setores, zonas, dims);
  const perfil = [['Setores', setores.join(', ')], ['Regiões', zonas.join(', ')], ['Dimensão', dims.join(', ')],
                  ['Decisor', lista(p.decisor).join(', ')], ['Valor de um cliente', um(p.ticket)]].filter(x => x[1]);
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

    // Um pedido por contacto em 10 minutos. No telemóvel o botão era tocado várias vezes enquanto isto
    // respondia, e cada toque dava nota, email 1, aviso e lista (Bárbara e D, 10/09/2026: 3 de cada).
    // Cada pedido deixa um marcador, espera que os pedidos simultâneos deixem o seu, e só segue o mais antigo.
    if (loja.temStore()) {
      const eu = Date.now();
      await loja.escrever(`lead100/${contactId}-${eu}.json`, { em: eu }).catch(() => null);
      await new Promise(r => setTimeout(r, 1500));
      const antes = (await loja.listar(`lead100/${contactId}-`, 50))
        .map(x => Number(x.pathname.split('-').pop().replace('.json', '')))
        .filter(t => t && t < eu && eu - t < 10 * 60 * 1000);
      if (antes.length) return res.status(200).json({ ok: true, contactId, quantas, repetido: true });
    }

    await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['100clientesideais-candidatura'] }) }).catch(() => {});
    const nota = ['Pedido da LP As 100 Empresas. Falta enviar a lista.',
      empresa ? `Empresa: ${empresa}` : '',
      perfil.length ? 'Perfil de cliente ideal:\n' + perfil.map(x => `- ${x[0]}: ${x[1]}`).join('\n') : '',
      b.utm_source ? `Origem: ${b.utm_source} / ${b.utm_campaign || ''}` : '',
      b.page ? `Página: ${b.page}` : ''].filter(Boolean).join('\n');
    await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: nota }) }).catch(() => {});
    await fetch(`${GHL}/opportunities/upsert`, { method: 'POST', headers, body: JSON.stringify({
      locationId, pipelineId: PIPELINE_VENDA, pipelineStageId: STAGE_CHEGADA, contactId,
      name: `${nome || 'Lead'}: 100 empresas`, status: 'open' }) }).catch(() => {});

    // Email para o lead, do endereço dele. Diz o número real do INE e o que vem a seguir.
    let email_lead = null;
    if (email) {
      try {
        const nf = n => Number(n).toLocaleString('pt-PT');
        const primeiro = esc((nome || '').split(' ')[0] || '');
        const linhas = perfil.map(x => `<tr><td style="padding:10px 16px;border-top:1px solid #ecebf4;color:#6b6f8f;font-size:14px;width:150px">${esc(x[0])}</td><td style="padding:10px 16px;border-top:1px solid #ecebf4;color:#252158;font-size:14px;font-weight:700">${esc(x[1])}</td></tr>`).join('');
        const html = emailLeadHtml({ primeiro, quantas: nf(quantas), linhas, ano: INE.ano });
        const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers, body: JSON.stringify({
          type: 'Email', contactId, emailFrom: REMETENTE,
          subject: `${nf(quantas)} empresas em Portugal com o perfil do seu cliente ideal`, html }) });
        const rj = await r.json().catch(() => null);
        email_lead = { status: r.status, msgId: rj?.emailMessageId || rj?.messageId || null };
      } catch (_) {}
    }

    // Fica em fila para a tarefa agendada montar e enviar a lista (api/cron-lista100.js).
    let fila = null;
    if (email && loja.temStore()) {
      const id = `${contactId}-${Date.now()}`;
      fila = !!(await loja.escrever(`pendentes100/${id}.json`, { id, contactId, email, nome, empresa,
        perfil: { setores, zonas, dimensao: dims, decisor: lista(p.decisor), ticket: um(p.ticket) }, quantas, email1Id: email_lead?.msgId || null, criado: Date.now() }).catch(() => null));
    }

    let aviso = null;
    try {
      const html0 = null;
      for (const destino of [AVISO]) {
      const upT = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify({ locationId, email: destino, firstName: 'Vloom Marketing' }) }).then(r => r.json());
      const tId = upT?.contact?.id || upT?.id;
      if (tId) {
        const html = `<p><b>Pedido novo, As 100 Empresas</b></p>`
          + `<p>Nome: ${esc(nome) || 'sem dados'}<br>Empresa: ${esc(empresa) || 'sem dados'}<br>Email: ${esc(email) || 'sem dados'}<br>Telefone: ${esc(phone) || 'sem dados'}</p>`
          + `<p><b>Perfil de cliente ideal</b><br>${perfil.map(x => `${esc(x[0])}: ${esc(x[1])}`).join('<br>')}</p>`
          + `<p>A lista das 100 empresas ainda tem de ser preparada e enviada a este contacto.</p>`;
        const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers, body: JSON.stringify({ type: 'Email', contactId: tId, emailCc: AVISO_CC, subject: `Lead novo, 100 Clientes Ideais: ${nome || email}`, html }) });
        aviso = { para: destino, cc: AVISO_CC, status: r.status };
        if (r.ok) break;
      }
      }
    } catch (_) {}
    return res.status(200).json({ ok: true, contactId, quantas, email_lead, fila, aviso });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
};
module.exports.emailLeadHtml = emailLeadHtml;
