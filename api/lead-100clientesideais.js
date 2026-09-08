// Lead do funil "100 Clientes Ideais": contacto no GHL com tag 100empresas-candidatura,
// nota com o perfil de cliente ideal e oportunidade em Venda / Chegada de Lead.
// Aviso para tiagoseverino@vloom.pt (ordem dele, 07/09/2026).
// Env: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const PIPELINE_VENDA = 'Un2h7k4hLMXrtz3t5MTe';
const STAGE_CHEGADA = '1938d5e5-3ff5-42b8-ade2-b06cc58b3bb6';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const AVISO = process.env.GHL_AVISO_100CLIENTESIDEAIS || 'tiagoseverino@vloom.pt';
const AVISO_RECUO = 'marketing@vloom.pt'; // o contacto dele tem DND no email; sem isto o aviso perdia-se
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const um = v => Array.isArray(v) ? String(v[0] || '').trim() : String(v || '').trim();
const lista = v => (Array.isArray(v) ? v : [v]).map(x => String(x || '').trim()).filter(Boolean);
const REMETENTE = process.env.GHL_REMETENTE_VLOOM || 'Tiago Severino <tiagoseverino@vloom.pt>';
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
        const linhas = perfil.map(x => `<tr><td style="padding:5px 14px 5px 0;color:#5b6386;font-size:14px">${esc(x[0])}</td><td style="padding:5px 0;color:#0f1d5a;font-size:14px;font-weight:700">${esc(x[1])}</td></tr>`).join('');
        const html = `<div style="font-family:Helvetica,Arial,sans-serif;color:#0f1d5a;line-height:1.55;max-width:560px">
<p>${primeiro ? 'Olá ' + primeiro + ',' : 'Olá,'}</p>
<p>Recebemos o perfil do seu cliente ideal. Segundo o INE, existem em Portugal
<b style="font-size:20px">${nf(quantas)}</b> empresas com esse perfil.</p>
<table style="border-collapse:collapse;margin:16px 0">${linhas}</table>
<p>Estamos a preparar as <b>100 melhores</b> dessa lista, com nome, dimensão e quem decide lá dentro.
Chega-lhe por email, deste mesmo endereço.</p>
<p>Entretanto, o passo que faz a diferença é o próximo: mostrar-lhe como se constrói um sistema
de aquisição de clientes para atrair empresas como estas.</p>
<p><a href="https://oferta.vloom.pt/100clientesideais-marcar/" style="display:inline-block;background:#2c86b8;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:6px">Escolher dia e hora</a></p>
<p style="margin-top:22px">Um abraço,<br><b>Tiago Severino</b><br>Vloom<br>
<a href="tel:+351914310656" style="color:#2c86b8">(+351) 914 310 656</a></p>
<p style="font-size:11px;color:#8b90a8">Número de empresas: INE, Sistema de Contas Integradas das Empresas, ${INE.ano}. Região e dimensão são contadas em separado.</p>
</div>`;
        const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers, body: JSON.stringify({
          type: 'Email', contactId, emailFrom: REMETENTE,
          subject: `${nf(quantas)} empresas em Portugal com o perfil do seu cliente ideal`, html }) });
        email_lead = { status: r.status };
      } catch (_) {}
    }

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
    return res.status(200).json({ ok: true, contactId, quantas, email_lead, aviso });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
};
