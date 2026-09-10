// Lista do funil «100 Clientes Ideais»: o perfil escolhido (setores e regiões) vira pesquisas em dados
// abertos (OpenStreetMap e Wikidata) e sai uma lista de até 100 empresas reais, com site e telefone
// quando existem. Os dados abertos não trazem número de trabalhadores nem o nome de quem decide.
const { empresasWikidata } = require('./_fontes.js');
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const UA = 'VloomRelatorios/1.0 (marketing@vloom.pt)';
const limpaSite = s => { const u = String(s || '').trim(); return /^https?:\/\/\S+$/i.test(u) ? u.split('?')[0].slice(0, 160) : ''; };
const espera = ms => new Promise(r => setTimeout(r, ms));

// Empresas de um concelho. Procurar o nome em todas as divisões administrativas pesava tanto que o
// servidor respondia «demasiado ocupado» (504) e a zona vinha vazia sem aviso; o concelho é o admin_level 7.
async function empresasConcelho({ filtros, concelho, limite = 80 }) {
  const partes = filtros.map(f => `node${f}(area.a);way${f}(area.a);`).join('');
  const q = `[out:json][timeout:25];area["name"="${String(concelho).replace(/"/g, '')}"]["admin_level"="7"]->.a;(${partes});out center ${limite};`;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const corte = new AbortController(); const t = setTimeout(() => corte.abort(), 30000);
    try {
      const r = await fetch(OVERPASS, { method: 'POST', signal: corte.signal, headers: { 'User-Agent': UA, 'Content-Type': 'text/plain' }, body: q });
      if (r.ok) {
        const j = await r.json().catch(() => null);
        return ((j && j.elements) || []).map(e => {
          const g = e.tags || {};
          return { nome: String(g.name || '').trim().slice(0, 90), site: limpaSite(g.website || g['contact:website']),
                   telefone: String(g.phone || g['contact:phone'] || '').slice(0, 30), zona: concelho };
        }).filter(e => e.nome);
      }
    } catch {} finally { clearTimeout(t); }
    await espera(4000 * (tentativa + 1));
  }
  return [];
}
// normaliza os filtros para a forma ["chave"~"valor"]
function norm(f) {
  const m = /^\[?\s*"?([A-Za-z_:]+)"?\s*([=~])\s*"?([^"\]]+?)"?\s*\]?$/.exec(String(f || '').trim());
  return m ? `["${m[1].toLowerCase()}"${m[2]}"${m[3].trim()}"]` : '';
}
const GHL = 'https://services.leadconnectorhq.com';
const REMETENTE = process.env.GHL_REMETENTE_VLOOM || 'Tiago Severino <tiagoseverino@vloom.pt>';
const IMG = 'https://oferta.vloom.pt/email/';
const esc = s => String(s || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

const SETOR = {
  'Indústria e produção': { f: ['man_made=works', 'industrial~".+"', 'craft~"metal_construction|carpenter|window_construction|stonemason|electrician"'], w: 'indústria' },
  'Construção e imobiliário': { f: ['office~"estate_agent|construction_company|architect"', 'craft~"builder|roofer|tiler|plasterer|carpenter"'], w: 'construção' },
  'Saúde e clínicas': { f: ['amenity~"clinic|dentist|doctors"', 'healthcare~"clinic|dentist|laboratory|physiotherapist|centre"'], w: 'saúde' },
  'Serviços profissionais': { f: ['office~"lawyer|accountant|consulting|tax_advisor|financial|advertising_agency|employment_agency|architect|engineer"'], w: 'consultoria' },
  'Retalho e distribuição': { f: ['shop~"wholesale|trade|department_store|furniture|electronics|car|hardware|supermarket"'], w: 'retalho' },
  'Tecnologia e software': { f: ['office~"it|telecommunication|software"'], w: 'software' },
  'Hotelaria e restauração': { f: ['tourism~"hotel|guest_house|hostel|apartment"', 'amenity~"restaurant"'], w: 'hotel' },
  'Transportes e logística': { f: ['office~"logistics|courier|moving_company|transport"', 'amenity~"car_rental|truck_rental"'], w: 'transportes' },
  'Outro': { f: ['office=company'], w: 'empresa' },
};
const REGIAO = {
  'Área Metropolitana de Lisboa': ['Lisboa', 'Oeiras', 'Cascais', 'Sintra', 'Amadora', 'Loures', 'Almada', 'Seixal', 'Odivelas', 'Setúbal'],
  'Norte': ['Porto', 'Vila Nova de Gaia', 'Braga', 'Matosinhos', 'Guimarães', 'Maia', 'Viana do Castelo', 'Vila Real', 'Bragança'],
  'Centro': ['Coimbra', 'Aveiro', 'Leiria', 'Viseu', 'Castelo Branco', 'Guarda', 'Figueira da Foz'],
  'Alentejo': ['Évora', 'Beja', 'Portalegre', 'Santarém', 'Sines', 'Elvas'],
  'Algarve': ['Faro', 'Loulé', 'Portimão', 'Albufeira', 'Lagos', 'Olhão', 'Tavira'],
  'Açores e Madeira': ['Funchal', 'Ponta Delgada', 'Angra do Heroísmo', 'Santa Cruz', 'Câmara de Lobos'],
};
const PAIS = ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Faro', 'Aveiro', 'Leiria', 'Setúbal', 'Viseu', 'Funchal', 'Évora', 'Vila Nova de Gaia', 'Matosinhos', 'Oeiras'];

// concelhos por ordem, alternando entre as regiões escolhidas para todas ficarem representadas
function concelhos(zonas) {
  const z = (zonas || []).filter(x => REGIAO[x]);
  if (!z.length || (zonas || []).includes('Todo o país')) return PAIS;
  const out = []; const listas = z.map(x => REGIAO[x].slice());
  while (listas.some(l => l.length)) for (const l of listas) if (l.length) out.push(l.shift());
  return out;
}

async function construirLista({ setores, zonas, alvo = 100, segundos = 150 }) {
  const sets = (setores || []).filter(s => SETOR[s]);
  const lista0 = sets.length ? sets : Object.keys(SETOR);
  const filtros = [...new Set(lista0.flatMap(s => SETOR[s].f))].slice(0, 8).map(norm).filter(Boolean);
  const ordem = concelhos(zonas);
  const fim = Date.now() + segundos * 1000;
  const vistos = new Set(); const lista = [];
  const junta = arr => { for (const e of arr) { const k = (e.nome || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (!k || vistos.has(k)) continue; vistos.add(k); lista.push(e); } };
  // um concelho de cada vez: o servidor público recusa pedidos em paralelo
  for (const z of ordem) {
    if (lista.length >= alvo * 3 || Date.now() > fim) break;
    junta(await empresasConcelho({ filtros, concelho: z, limite: 80 }));
  }
  // a Wikidata é nacional: só entra se a pessoa escolheu o país todo ou se os dados locais vieram vazios
  if (lista.length < alvo && ((zonas || []).includes('Todo o país') || !lista.length)) {
    for (const s of lista0.slice(0, 3)) junta(await empresasWikidata({ palavra: SETOR[s].w, limite: 30 }));
  }
  // serviços públicos não são clientes: fora conservatórias, juntas, câmaras, finanças, tribunais e afins
  const PUBLICO = /^(conservat|junta de freguesia|c[aâ]mara municipal|servi[cç]o de finan|finan[cç]as|seguran[cç]a social|loja do cidad|tribunal|cart[oó]rio|minist[eé]rio|instituto|universidade|faculdade|escola|agrupamento de escolas|centro de estudos|edif[ií]cio|posto de turismo|gnr|psp|pol[ií]cia|embaixada|consulado|santander work|iefp|servi[cç]o de emprego|centro de emprego)/i;
  for (let i = lista.length - 1; i >= 0; i--) if (PUBLICO.test(lista[i].nome.trim()) || /irn\.mj\.pt|gov\.pt/i.test(lista[i].site || '')) lista.splice(i, 1);
  // primeiro as que têm site e telefone, que são as que servem para trabalhar
  const nota = e => (e.site ? 2 : 0) + (e.telefone ? 1 : 0);
  // rodízio pelos concelhos, para uma zona não comer a lista toda; dentro de cada uma, as mais completas
  const porZona = {}; for (const e of lista) (porZona[e.zona] = porZona[e.zona] || []).push(e);
  Object.values(porZona).forEach(l => l.sort((a, b) => nota(b) - nota(a)));
  const filas = Object.values(porZona); const escolhidas = [];
  while (escolhidas.length < alvo && filas.some(f => f.length)) for (const f of filas) if (f.length && escolhidas.length < alvo) escolhidas.push(f.shift());
  escolhidas.sort((a, b) => nota(b) - nota(a));
  return escolhidas.map(e => ({ nome: e.nome, localidade: e.zona || '', site: e.site || '', telefone: e.telefone || '' }));
}

function emailListaHtml({ primeiro, n, top, link }) {
  const linhas = top.map((e, i) => `<tr><td style="padding:9px 14px;border-top:1px solid #ecebf4;color:#8b8fa8;font-size:13px;width:28px">${i + 1}</td><td style="padding:9px 14px;border-top:1px solid #ecebf4;color:#252158;font-size:14px;font-weight:700">${esc(e.nome)}</td><td style="padding:9px 14px;border-top:1px solid #ecebf4;color:#6b6f8f;font-size:13px">${esc(e.localidade)}</td></tr>`).join('');
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f3f9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#252158">
  <tr><td style="background:#252158;background-image:linear-gradient(135deg,#252158 0%,#3b4a9c 60%,#8d489b 100%);padding:30px 40px 34px">
    <img src="${IMG}vloom-logo-branco.png" width="120" alt="Vloom" style="display:block;border:0;width:120px;height:auto">
    <p style="margin:26px 0 0;color:#77cef4;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700">100 Clientes Ideais</p>
    <h1 style="margin:10px 0 0;color:#ffffff;font-size:25px;line-height:1.3;font-weight:800">A sua lista está pronta${primeiro ? ', ' + primeiro : ''}.</h1>
  </td></tr>
  <tr><td style="padding:32px 40px 6px">
    <p style="margin:0;font-size:16px;line-height:1.65;color:#3d3f5c">Encontrámos <b style="color:#8d489b;font-size:20px">${n}</b> empresas com o perfil que escolheu. Estas são as primeiras:</p>
  </td></tr>
  <tr><td style="padding:18px 40px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fb;border-radius:10px;overflow:hidden">${linhas}</table></td></tr>
  <tr><td style="padding:26px 40px 6px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#8d489b"><a href="${link}" style="display:inline-block;padding:15px 26px;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none">Ver a lista completa</a></td></tr></table>
  </td></tr>
  <tr><td style="padding:18px 40px 4px">
    <p style="margin:0;font-size:14px;line-height:1.6;color:#6b6f8f">A lista vem de dados abertos e traz o nome, a localidade e, quando existem, o site e o telefone de cada empresa.</p>
  </td></tr>
  <tr><td style="padding:22px 40px 8px">
    <p style="margin:0 0 14px;font-size:16px;color:#3d3f5c">Um abraço,</p>
    <img src="${IMG}assinatura-tiago.png" width="480" alt="Tiago Severino, Head of Marketing, Vloom" style="display:block;border:0;width:100%;max-width:480px;height:auto">
  </td></tr>
  <tr><td style="padding:22px 40px 30px"><p style="margin:0;border-top:1px solid #ecebf4;padding-top:16px;font-size:11px;line-height:1.5;color:#8b8fa8">Fontes: OpenStreetMap e Wikidata. · <a href="https://vloom.pt/politica-de-privacidade/" style="color:#8b8fa8">Política de Privacidade</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

async function enviarLista({ contactId, email, nome, n, top, link }) {
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return { ok: false, error: 'sem credenciais' };
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  if (!contactId && email) {
    const q = await fetch(`${GHL}/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}&limit=1`, { headers }).then(r => r.json()).catch(() => null);
    contactId = q?.contacts?.[0]?.id;
  }
  if (!contactId) return { ok: false, error: 'sem contacto' };
  const primeiro = esc((nome || '').split(' ')[0] || '');
  const html = emailListaHtml({ primeiro, n, top, link });
  const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers, body: JSON.stringify({
    type: 'Email', contactId, emailFrom: REMETENTE, subject: `A sua lista: ${n} empresas com o perfil do seu cliente ideal`, html }) });
  const rj = await r.json().catch(() => null);
  await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['100clientesideais-lista'] }) }).catch(() => {});
  await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: `Lista 100 Clientes Ideais enviada (${n} empresas): ${link}` }) }).catch(() => {});
  return { ok: r.ok, status: r.status, msgId: rj?.emailMessageId || rj?.messageId || null, contactId };
}

// Estado de entrega de um email no GHL: pending, sent, delivered, opened, clicked ou failed.
async function estadoEmail(msgId) {
  if (!msgId) return null;
  const r = await fetch(`${GHL}/conversations/messages/email/${msgId}`, { headers: { Authorization: `Bearer ${process.env.GHL_PIT}`, Version: '2021-07-28' } }).catch(() => null);
  const j = r ? await r.json().catch(() => null) : null;
  const e = j?.emailMessage || j || {};
  return { status: e.status || null, erro: e.error || null };
}

// Alerta ao Tiago: Telegram (se houver credenciais na Vercel) e sempre email para marketing@ com ele em cópia.
async function alertar({ titulo, linhas = [] }) {
  const out = {};
  const bot = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (bot && chat) {
    const txt = `🚨 <b>100 Clientes Ideais</b>\n<b>${esc(titulo)}</b>\n\n` + linhas.map(l => esc(l)).join('\n');
    const r = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: txt, parse_mode: 'HTML', disable_web_page_preview: true }) }).catch(() => null);
    out.telegram = r ? r.status : 'erro';
  }
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (token && locationId) {
    const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
    const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify({ locationId, email: 'marketing@vloom.pt', firstName: 'Vloom Marketing' }) }).then(r => r.json()).catch(() => null);
    const id = up?.contact?.id || up?.id;
    if (id) {
      const html = `<p><b>${esc(titulo)}</b></p><p>${linhas.map(esc).join('<br>')}</p>`;
      const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers, body: JSON.stringify({ type: 'Email', contactId: id,
        emailCc: ['tiagoseverino@vloom.pt'], subject: `🚨 100 Clientes Ideais: ${titulo}`, html }) }).catch(() => null);
      out.email = r ? r.status : 'erro';
    }
  }
  return out;
}

module.exports = { construirLista, enviarLista, emailListaHtml, estadoEmail, alertar, concelhos, SETOR, REGIAO };
