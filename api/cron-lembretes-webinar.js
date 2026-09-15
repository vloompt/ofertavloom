// Lembretes do webinar de 7 de outubro de 2026, por email (GHL), a quem tem a etiqueta webinar2026-registo.
//   véspera: 6 out, das 18h00 às 22h00 de Lisboa
//   hora:    7 out, das 20h00 às 20h50 de Lisboa
// Corre de 5 em 5 minutos; fora das janelas não faz nada. Quem pediu só a gravação fica de fora.
// Cada envio deixa um marcador no Vercel Blob e o marcador confirma-se pela LISTAGEM (sem cache),
// por isso um contacto nunca recebe o mesmo lembrete duas vezes.
// Env: GHL_PIT, GHL_LOCATION_VLOOM, ZOOM_LINK_WEBINAR2026, BLOB_READ_WRITE_TOKEN, CRON_SECRET,
//      TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
const GHL = 'https://services.leadconnectorhq.com';
const BLOB = 'https://blob.vercel-storage.com';
const PREFIXO = 'lembretes-webinar2026/';
const POR_CORRIDA = 40;
const JANELAS = {
  vespera: { de: Date.parse('2026-10-06T17:00:00Z'), ate: Date.parse('2026-10-06T21:00:00Z') },
  hora: { de: Date.parse('2026-10-07T19:00:00Z'), ate: Date.parse('2026-10-07T19:50:00Z') },
};
const IMG = 'https://oferta.vloom.pt/email/';
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

function botao(zoom) {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#8d489b;border-radius:10px">
    <a href="${zoom}" style="display:inline-block;padding:15px 30px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none">Entrar na sala Zoom</a></td></tr></table>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#8b8fa8">Se o botão não abrir, copie este link:<br><a href="${zoom}" style="color:#8d489b;word-break:break-all">${zoom}</a></p>`;
}

function emailHtml(tipo, { primeiro, zoom }) {
  const vespera = tipo === 'vespera';
  const titulo = vespera ? `É amanhã${primeiro ? ', ' + primeiro : ''}.` : `Começamos daqui a uma hora${primeiro ? ', ' + primeiro : ''}.`;
  const abertura = vespera
    ? 'Amanhã, <b style="color:#252158">quarta-feira, 7 de outubro, às 21h00 de Lisboa</b>, fazemos o webinar ao vivo no Zoom. A sala abre às 20h50.'
    : 'Às <b style="color:#252158">21h00 em ponto</b> abrimos o webinar. A sala abre às 20h50 e pode entrar já com o link abaixo.';
  const lista = vespera ? `
  <tr><td style="padding:22px 40px 4px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7fb;border-radius:10px"><tr><td style="padding:20px 24px">
      <p style="margin:0 0 12px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#8d489b">Para amanhã</p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#3d3f5c">1. Tenha à mão quatro números: valor de um cliente, margem, meta e taxa de fecho.</p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#3d3f5c">2. Entre pelo computador, para ver bem os slides.</p>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#3d3f5c">3. Reserve as duas horas. Quem ficar até ao fim leva o guia prático de objeções.</p>
    </td></tr></table>
  </td></tr>` : '';
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f3f9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f9;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#252158">
  <tr><td style="background:#252158;background-image:linear-gradient(135deg,#252158 0%,#3b4a9c 60%,#8d489b 100%);padding:30px 40px 34px">
    <img src="${IMG}vloom-logo-branco.png" width="120" alt="Vloom" style="display:block;border:0;width:120px;height:auto">
    <p style="margin:26px 0 0;color:#77cef4;font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:700">Webinar · 7 de outubro · 21h00</p>
    <h1 style="margin:10px 0 0;color:#ffffff;font-size:25px;line-height:1.3;font-weight:800">${titulo}</h1>
  </td></tr>
  <tr><td style="padding:34px 40px 6px"><p style="margin:0;font-size:16px;line-height:1.6;color:#3d3f5c">${abertura}</p></td></tr>
  <tr><td style="padding:22px 40px 4px">${botao(zoom)}</td></tr>${lista}
  <tr><td style="padding:22px 40px 8px">
    <p style="margin:0 0 14px;font-size:16px;color:#3d3f5c">${vespera ? 'Até amanhã,' : 'Até já,'}</p>
    <img src="${IMG}assinatura-tiago.png" width="480" alt="Tiago Severino, Head of Marketing, Vloom" style="display:block;border:0;width:100%;max-width:480px;height:auto">
  </td></tr>
  <tr><td style="padding:22px 40px 30px">
    <p style="margin:0;border-top:1px solid #ecebf4;padding-top:16px;font-size:11px;line-height:1.5;color:#8b8fa8"><a href="https://vloom.pt/politica-de-privacidade/" style="color:#8b8fa8">Política de Privacidade</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}
const ASSUNTO = { vespera: 'Amanhã às 21h00: o seu lugar no webinar', hora: 'Começamos daqui a uma hora (21h00)' };

// ── Blob: listagem paginada (sem cache) e escrita ─────────────────────────────
const hBlob = () => ({ authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`, 'x-api-version': '7' });
async function listarTudo(prefixo) {
  const nomes = []; let cursor = '';
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${BLOB}?prefix=${encodeURIComponent(prefixo)}&limit=1000${cursor ? '&cursor=' + cursor : ''}`, { headers: hBlob() });
    if (!r.ok) throw new Error('blob listar ' + r.status);
    const j = await r.json();
    (j.blobs || []).forEach(b => nomes.push({ caminho: b.pathname, em: Date.parse(b.uploadedAt) }));
    if (!j.hasMore) break; cursor = j.cursor;
  }
  return nomes;
}
const marcar = (caminho, dados) => fetch(`${BLOB}/${caminho}`, {
  method: 'PUT', headers: { ...hBlob(), 'x-content-type': 'application/json', 'x-add-random-suffix': '0', 'x-allow-overwrite': '1' },
  body: JSON.stringify({ ...dados, em: Date.now() }),
});

// ── GHL: todos os inscritos ───────────────────────────────────────────────────
async function inscritos(headers, locationId) {
  const todos = [];
  for (let page = 1; page <= 100; page++) {
    const r = await fetch(`${GHL}/contacts/search`, {
      method: 'POST', headers,
      body: JSON.stringify({ locationId, page, pageLimit: 100, filters: [{ field: 'tags', operator: 'contains', value: 'webinar2026-registo' }] }),
    });
    if (!r.ok) throw new Error('ghl pesquisa ' + r.status);
    const cs = (await r.json()).contacts || [];
    todos.push(...cs);
    if (cs.length < 100) break;
  }
  return todos.filter(c => c.email && !(c.tags || []).includes('webinar2026-quer-gravacao'));
}

async function telegram(texto) {
  const t = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!t || !chat) return;
  await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: texto, parse_mode: 'HTML', disable_web_page_preview: true }),
  }).catch(() => {});
}

async function correr({ agora = Date.now(), simular = false, teste = false } = {}) {
  const tipo = Object.keys(JANELAS).find(k => agora >= JANELAS[k].de && agora < JANELAS[k].ate);
  if (!tipo) return { ok: true, fora: true };
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM, zoom = process.env.ZOOM_LINK_WEBINAR2026;
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  const lista = await inscritos(headers, locationId);
  if (simular) return { ok: true, tipo, simulado: true, receberiam: lista.map(c => c.email) };
  // teste: mesmo caminho real (pesquisa, filtro, email, envio GHL) sem marcadores nem Telegram. Só por chamada local.
  if (teste) {
    if (!zoom) return { ok: false, tipo, erro: 'sem link do Zoom' };
    const res = [];
    for (const c of lista) {
      const primeiro = esc(String(c.firstName || '').trim().split(/\s+/)[0]);
      const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers,
        body: JSON.stringify({ type: 'Email', contactId: c.id, subject: ASSUNTO[tipo], html: emailHtml(tipo, { primeiro, zoom }) }) }).catch(() => null);
      res.push({ email: c.email, status: r && r.status });
    }
    return { ok: true, tipo, teste: true, enviados: res };
  }

  const marcas = await listarTudo(PREFIXO);
  const feitos = new Set(marcas.map(m => m.caminho));
  if (!zoom) {
    if (!feitos.has(`${PREFIXO}alerta-sem-zoom-${tipo}.json`)) {
      await telegram(`⚠️ <b>Webinar: o lembrete «${tipo}» NÃO saiu</b>\nFalta o link do Zoom (ZOOM_LINK_WEBINAR2026) na Vercel.`);
      await marcar(`${PREFIXO}alerta-sem-zoom-${tipo}.json`, { tipo });
    }
    return { ok: false, tipo, erro: 'sem link do Zoom' };
  }
  const trinco = marcas.find(m => m.caminho === `${PREFIXO}trinco-${tipo}.json`);
  if (trinco && agora - trinco.em < 4 * 60 * 1000) return { ok: true, tipo, ocupado: true };
  await marcar(`${PREFIXO}trinco-${tipo}.json`, { tipo });

  const porFazer = lista.filter(c => !feitos.has(`${PREFIXO}${tipo}/${c.id}.json`));
  let enviados = 0, falhas = 0;
  for (const c of porFazer.slice(0, POR_CORRIDA)) {
    const primeiro = esc(String(c.firstName || '').trim().split(/\s+/)[0]);
    const r = await fetch(`${GHL}/conversations/messages`, {
      method: 'POST', headers,
      body: JSON.stringify({ type: 'Email', contactId: c.id, subject: ASSUNTO[tipo], html: emailHtml(tipo, { primeiro, zoom }) }),
    }).catch(() => null);
    if (r && r.ok) { enviados++; await marcar(`${PREFIXO}${tipo}/${c.id}.json`, { email: c.email }); }
    else falhas++;
  }
  const faltam = porFazer.length - enviados;
  if (faltam === 0 && !feitos.has(`${PREFIXO}resumo-${tipo}.json`)) {
    const total = lista.length;
    await telegram(`✅ <b>Webinar: lembrete «${tipo === 'vespera' ? 'véspera' : '1 hora antes'}» enviado</b>\n${total} inscritos com email${falhas ? `, ${falhas} falhas nesta volta` : ''}.`);
    await marcar(`${PREFIXO}resumo-${tipo}.json`, { total });
  }
  return { ok: true, tipo, inscritos: lista.length, enviados, falhas, faltam };
}

module.exports = async function handler(req, res) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.authorization !== `Bearer ${segredo}`) return res.status(401).json({ ok: false });
  try { return res.status(200).json(await correr()); }
  catch (e) { return res.status(200).json({ ok: false, erro: String(e && e.message || e).slice(0, 200) }); }
};
module.exports.correr = correr;
module.exports.emailHtml = emailHtml;
module.exports.ASSUNTO = ASSUNTO;
