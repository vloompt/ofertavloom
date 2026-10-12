// Relógio dos lembretes do webinar. Os TEXTOS (emails e SMS) vivem no GHL, nos workflows «🎥 Webinar · …»:
// este cron só põe a etiqueta certa na hora certa a cada inscrito da edição em curso, e o GHL envia.
//   véspera 18h00 (email + SMS) · no dia 12h00 (email) · uma hora antes (email + SMS) · sala aberta (SMS)
// A data vem de api/_webinar.js (EDICAO.inicio); com EDICAO.ativa = false não faz nada.
// Corre de 5 em 5 minutos; fora das janelas não faz nada. Quem pediu só a gravação fica de fora.
// Cada disparo deixa um marcador no Vercel Blob (confirmado pela LISTAGEM, sem cache): ninguém recebe o mesmo
// lembrete duas vezes. Oito minutos depois confere na conversa do contacto se a mensagem saiu mesmo; se não saiu,
// volta a disparar uma vez, e se continuar sem sair avisa no Telegram com os nomes.
// Env: GHL_PIT, GHL_LOCATION_VLOOM, BLOB_READ_WRITE_TOKEN, CRON_SECRET, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
const { enviarTelegram } = require('./_telegram.js');
const { EDICAO, ETIQUETAS, JANELAS, disparar } = require('./_webinar.js');
const GHL = 'https://services.leadconnectorhq.com';
const BLOB = 'https://blob.vercel-storage.com';
const PREFIXO = `lembretes-webinar-${EDICAO.id}/`;
const POR_CORRIDA = 40;
const TETO_SMS = 150;
const TETO_EMAIL = 600;
const ESPERA_CONFERIR = 8 * 60 * 1000;

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

// ── GHL: os inscritos desta edição ────────────────────────────────────────────
async function porEtiqueta(headers, locationId, etiqueta) {
  const todos = [];
  for (let page = 1; page <= 100; page++) {
    const r = await fetch(`${GHL}/contacts/search`, {
      method: 'POST', headers,
      body: JSON.stringify({ locationId, page, pageLimit: 100, filters: [{ field: 'tags', operator: 'contains', value: etiqueta }] }),
    });
    if (!r.ok) throw new Error('ghl pesquisa ' + r.status);
    const cs = (await r.json()).contacts || [];
    todos.push(...cs);
    if (cs.length < 100) break;
  }
  return todos.filter(c => !(c.tags || []).includes(ETIQUETAS.querGravacao));
}
// emails: inscritos com email. SMS: quem pediu SMS e tem telemóvel (um por número).
async function inscritos(headers, locationId) {
  const emails = (await porEtiqueta(headers, locationId, ETIQUETAS.registo)).filter(c => c.email);
  const vistos = new Set();
  const sms = (await porEtiqueta(headers, locationId, ETIQUETAS.sms)).filter(c => c.phone && !vistos.has(c.phone) && vistos.add(c.phone));
  return { emails, sms };
}
// a mensagem saiu? a última mensagem da conversa do contacto é nossa e posterior ao disparo
async function saiu(headers, locationId, contactId, desde) {
  const r = await fetch(`${GHL}/conversations/search?locationId=${locationId}&contactId=${contactId}`, { headers }).then(x => x.json()).catch(() => null);
  const c = r && r.conversations && r.conversations[0];
  return !!(c && c.lastMessageDirection === 'outbound' && Number(c.lastMessageDate) >= desde - 60 * 1000);
}

async function telegram(texto) {
  await enviarTelegram(texto); // com o banner da Vloom por cima (api/_telegram.js)
}
const etiquetaDe = (tipo, canal) => (canal === 'email' ? ETIQUETAS.lembrete[tipo] : ETIQUETAS.smsLembrete[tipo]);

async function correr({ agora = Date.now(), simular = false, teste = false, apenas = null } = {}) {
  if (!EDICAO.ativa && !simular && !teste) return { ok: true, parado: 'entre edições' };
  // dois dias antes: um aviso único para conferir a sala Zoom (uma reunião agendada caduca 30 dias depois da data marcada)
  const T0 = Date.parse(EDICAO.inicio);
  if (!simular && !teste && agora >= T0 - 49 * 3600e3 && agora < T0 - 47 * 3600e3) {
    const ja = await listarTudo(`${PREFIXO}aviso-sala.json`);
    if (!ja.length) {
      await marcar(`${PREFIXO}aviso-sala.json`, {});
      const z = process.env.ZOOM_LINK_WEBINAR2026 || '';
      await telegram(`🎥 <b>Webinar daqui a 2 dias</b>\nConfirme que a sala Zoom é a desta edição.\nLink atual: ${z ? z.replace(/\?.*/, '') : '<b>NENHUM</b> (falta ZOOM_LINK_WEBINAR2026 na Vercel)'}\nOs lembretes começam amanhã às 18h00.`);
    }
    return { ok: true, avisoSala: true };
  }
  const tipo = Object.keys(JANELAS).find(k => agora >= JANELAS[k].de && agora < JANELAS[k].ate);
  if (!tipo) return { ok: true, fora: true };
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  const { emails: lista, sms: listaSms } = await inscritos(headers, locationId);
  if (simular) return { ok: true, tipo, simulado: true, etiquetas: { email: ETIQUETAS.lembrete[tipo], sms: ETIQUETAS.smsLembrete[tipo] }, receberiam: lista.map(c => c.email), sms: listaSms.map(c => c.phone) };
  const J = JANELAS[tipo];
  const tarefas = [];
  if (J.email) for (const c of lista) tarefas.push({ canal: 'email', c });
  if (J.sms) for (const c of listaSms) tarefas.push({ canal: 'sms', c });
  const enviar = ({ canal, c }) => disparar(GHL, headers, c.id, etiquetaDe(tipo, canal));
  // teste: mesmo caminho real (pesquisa, filtro, etiqueta, workflow do GHL) sem marcadores nem Telegram. Só por chamada local.
  if (teste) {
    if (typeof apenas !== 'string' || !apenas.includes('@')) return { ok: false, tipo, erro: 'teste exige apenas: <email de teste>' };
    const tarefasTeste = tarefas.filter(x => x.c.email && x.c.email.toLowerCase() === apenas.toLowerCase());
    if (tarefasTeste.length === 0) return { ok: false, tipo, erro: 'o contacto de teste não está inscrito' };
    const res = [];
    for (const x of tarefasTeste) res.push({ canal: x.canal, email: x.c.email, etiqueta: etiquetaDe(tipo, x.canal), status: await enviar(x) });
    return { ok: true, tipo, teste: true, enviados: res };
  }

  const marcas = await listarTudo(PREFIXO);
  const feitos = new Map(marcas.map(m => [m.caminho, m.em]));
  const trinco = marcas.find(m => m.caminho === `${PREFIXO}trinco-${tipo}.json`);
  if (trinco && agora - trinco.em < 4 * 60 * 1000) return { ok: true, tipo, ocupado: true };
  const rTrinco = await marcar(`${PREFIXO}trinco-${tipo}.json`, { tipo });
  if (!rTrinco.ok) return { ok: false, tipo, erro: 'trinco' };

  const chave = x => `${PREFIXO}${tipo}/${x.canal}/${x.c.id}.json`;
  const porFazer = tarefas.filter(x => !feitos.has(chave(x)));
  const nSmsPorFazer = porFazer.filter(x => x.canal === 'sms').length;
  const nEmailPorFazer = porFazer.filter(x => x.canal === 'email').length;
  if (nSmsPorFazer > TETO_SMS || nEmailPorFazer > TETO_EMAIL) {
    if (!feitos.has(`${PREFIXO}alerta-teto-${tipo}.json`)) {
      await telegram(`⚠️ <b>Webinar: o lembrete «${tipo}» NÃO saiu</b>\n${nEmailPorFazer} emails e ${nSmsPorFazer} SMS por enviar nesta janela.\nparei: inscrições acima do normal, confirme antes.`);
      await marcar(`${PREFIXO}alerta-teto-${tipo}.json`, { tipo, nEmailPorFazer, nSmsPorFazer });
    }
    return { ok: false, tipo, erro: 'teto excedido' };
  }
  let enviados = 0, falhas = 0, erroMarcador = 0;
  for (const x of porFazer.slice(0, POR_CORRIDA)) {
    const st = await enviar(x);
    if (st >= 200 && st < 300) {
      enviados++;
      const rMarca = await marcar(chave(x), { email: x.c.email });
      if (!rMarca.ok) {
        erroMarcador++;
        if (!feitos.has(`${PREFIXO}alerta-marcador-${tipo}.json`)) {
          await telegram('⚠️ <b>Webinar: parei os lembretes «' + tipo + '»</b>\nNão consegui registar um envio no Blob. Parei a volta para não repetir mensagens à mesma pessoa.');
          await marcar(`${PREFIXO}alerta-marcador-${tipo}.json`, { tipo });
        }
        break;
      }
    }
    else falhas++;
  }
  const faltam = porFazer.length - enviados;

  // conferência: quem foi etiquetado há mais de 8 minutos tem de ter a mensagem na conversa
  let conferidos = 0, redisparados = 0; const semMensagem = [];
  for (const x of tarefas) {
    const em = feitos.get(chave(x));
    const cOk = `${PREFIXO}${tipo}/ok/${x.canal}/${x.c.id}.json`, cDe = `${PREFIXO}${tipo}/de-novo/${x.canal}/${x.c.id}.json`, cFa = `${PREFIXO}${tipo}/falhou/${x.canal}/${x.c.id}.json`;
    if (!em || feitos.has(cOk) || feitos.has(cFa) || agora - em < ESPERA_CONFERIR) continue;
    if (conferidos >= POR_CORRIDA) break;
    conferidos++;
    if (await saiu(headers, locationId, x.c.id, em)) { await marcar(cOk, {}); continue; }
    if (!feitos.has(cDe)) { await enviar(x); await marcar(cDe, {}); redisparados++; continue; }
    if (agora - feitos.get(cDe) < ESPERA_CONFERIR) continue;
    await marcar(cFa, {}); semMensagem.push(`${x.c.firstName || x.c.email || x.c.phone} (${x.canal})`);
  }
  if (semMensagem.length) await telegram(`⚠️ <b>Webinar: ${semMensagem.length} lembrete(s) «${tipo}» não saíram</b>\n${semMensagem.slice(0, 15).join(', ')}\nA etiqueta foi posta duas vezes e o GHL não enviou (email cancelado, número inválido ou workflow desligado).`);

  if (faltam === 0 && !feitos.has(`${PREFIXO}resumo-${tipo}.json`)) {
    const nomes = { vespera: 'véspera', hoje: 'é hoje (12h)', hora: '1 hora antes', abertura: 'sala aberta (SMS)' };
    const nEmail = tarefas.filter(x => x.canal === 'email').length, nSms = tarefas.filter(x => x.canal === 'sms').length;
    await telegram(`✅ <b>Webinar: lembrete «${nomes[tipo]}» disparado</b>\n${nEmail} emails · ${nSms} SMS${falhas ? ` · ${falhas} falhas nesta volta` : ''}.`);
    await marcar(`${PREFIXO}resumo-${tipo}.json`, { nEmail, nSms });
  }
  return { ok: true, tipo, inscritos: lista.length, enviados, falhas, faltam, erroMarcador, conferidos, redisparados, semMensagem: semMensagem.length };
}

module.exports = async function handler(req, res) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.authorization !== `Bearer ${segredo}`) return res.status(401).json({ ok: false });
  try { return res.status(200).json(await correr()); }
  catch (e) { return res.status(200).json({ ok: false, erro: String(e && e.message || e).slice(0, 200) }); }
};
module.exports.correr = correr;
