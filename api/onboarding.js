// Onboarding de clientes do programa de aquisição (oferta.vloom.pt/onboarding/).
// Refeito a 11/11/2026: o original vivia no Manus e morreu com a conta.
//
// POST {acao:'submeter', id?, k?, dados}  → guarda as respostas, devolve {id, k}
// POST {acao:'token', id, k, tipo, nome}  → token de envio direto do browser para o Blob
// POST {acao:'concluir', id, k}           → marca como concluído e avisa a equipa (email + nota no GHL)
// GET  ?id=…&k=…                          → respostas + ficheiros, para a ficha da equipa
//
// Tudo no Vercel Blob: onboarding/<id>/dados.json e onboarding/<id>/ficheiros/<tipo>/<nome>.
// O id é aleatório e a chave k é um HMAC do id: sem as duas, nada se lê nem se escreve.
const crypto = require('crypto');
const loja = require('./_blob.js');

const GHL = 'https://services.leadconnectorhq.com';
const ORIGENS_OK = ['oferta.vloom.pt', 'onboarding.vloom.pt', 'vloom.pt', 'vercel.app', 'localhost'];
const AVISO_INTERNO = process.env.GHL_AVISO_ONBOARDING || 'marketing@vloom.pt';
const AVISO_CC = (process.env.GHL_AVISO_CC_ONBOARDING || 'tiagoseverino@vloom.pt').split(',').map(x => x.trim()).filter(Boolean);
const TIPOS = ['brand_manual', 'ads', 'team_photos', 'database', 'outros'];
const BASE_FICHA = 'https://oferta.vloom.pt/onboarding/ficha/';

const esc = s => String(s || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const RW = () => process.env.BLOB_READ_WRITE_TOKEN || '';
const chave = id => crypto.createHmac('sha256', RW()).update('onb:' + id).digest('hex').slice(0, 24);
const idValido = id => /^[a-z0-9]{22}$/.test(String(id || ''));
const autorizado = (id, k) => idValido(id) && typeof k === 'string' && k.length === 24 &&
  crypto.timingSafeEqual(Buffer.from(k), Buffer.from(chave(id)));
const limpaNome = n => String(n || 'ficheiro').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(-120) || 'ficheiro';

function tokenCliente(pathname) {
  const rw = RW();
  const storeId = rw.split('_')[3];
  const payload = Buffer.from(JSON.stringify({ pathname, addRandomSuffix: false, allowOverwrite: true, validUntil: Date.now() + 2 * 3600e3 })).toString('base64');
  const assinatura = crypto.createHmac('sha256', rw).update(payload).digest('hex');
  return `vercel_blob_client_${storeId}_${Buffer.from(`${assinatura}.${payload}`).toString('base64')}`;
}

// gravar com cache curta (60 s, o mínimo do Blob) e sobrescrita: as respostas mudam se o cliente voltar atrás
const escrever = async (caminho, dados) => {
  const r = await fetch(`https://blob.vercel-storage.com/?pathname=${encodeURIComponent(caminho)}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${RW()}`, 'x-api-version': '11', 'x-content-type': 'application/json', 'x-add-random-suffix': '0', 'x-allow-overwrite': '1', 'x-cache-control-max-age': '60' },
    body: JSON.stringify(dados),
  });
  return r.ok ? r.json() : null;
};

const lerDados = async id => {
  const b = (await loja.listar(`onboarding/${id}/dados.json`, 5))[0];
  return b ? loja.ler(b.url + '?t=' + Date.now()) : null;
};
const listarFicheiros = async id => (await loja.listar(`onboarding/${id}/ficheiros/`, 1000)).map(b => {
  const partes = b.pathname.split('/');
  return { tipo: partes[3], nome: partes.slice(4).join('/'), url: b.url, downloadUrl: b.downloadUrl, tamanho: b.size };
});

async function avisarEquipa(id, k, d, ficheiros) {
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return { saltado: 'sem GHL' };
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  const link = `${BASE_FICHA}?id=${id}&k=${k}`;
  const empresa = d.companyName || 'empresa sem nome';
  const out = {};

  // contacto do cliente: etiqueta + nota com o link da ficha (upsert não apaga nada)
  try {
    if (d.respEmail) {
      const [primeiro, ...resto] = String(d.respName || '').trim().split(/\s+/);
      const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers,
        body: JSON.stringify({ locationId, email: d.respEmail, phone: d.respPhone || undefined, firstName: primeiro || undefined, lastName: resto.join(' ') || undefined, companyName: d.companyName || undefined }) })
        .then(r => r.json()).catch(() => null);
      const cId = up?.contact?.id || up?.id;
      if (cId) {
        await fetch(`${GHL}/contacts/${cId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['onboarding-concluido'] }) }).catch(() => {});
        await fetch(`${GHL}/contacts/${cId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: `Onboarding concluído (${empresa}). Respostas e ficheiros: ${link}` }) }).catch(() => {});
        out.cliente = cId;
      }
    }
  } catch (_) {}

  // email interno: só o nome da empresa e o link (lição do original: nada de 20 anexos)
  try {
    const upT = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify({ locationId, email: AVISO_INTERNO, firstName: 'Vloom Marketing' }) })
      .then(r => r.json()).catch(() => null);
    const tId = upT?.contact?.id || upT?.id;
    if (tId) {
      const html = `<p><b>🚀 Onboarding concluído · ${esc(empresa)}</b></p>
<p>Preenchido por ${esc(d.respName) || '—'} (${esc(d.respEmail) || '—'} · ${esc(d.respPhone) || '—'}).<br>
${ficheiros.length} ficheiro${ficheiros.length === 1 ? '' : 's'} enviado${ficheiros.length === 1 ? '' : 's'}.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 22px;background:#472a70;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Ver respostas e descarregar tudo</a></p>`;
      const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers,
        body: JSON.stringify({ type: 'Email', contactId: tId, emailCc: AVISO_CC, subject: `🚀 Onboarding concluído: ${empresa}`, html }) });
      out.email = { para: AVISO_INTERNO, cc: AVISO_CC, status: r.status };
    }
  } catch (e) { out.emailErro = String(e); }
  return out;
}

module.exports = async function handler(req, res) {
  const o = req.headers.origin || '';
  if (o && ORIGENS_OK.some(h => o.includes(h))) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!loja.temStore()) return res.status(500).json({ ok: false, erro: 'sem armazenamento' });

  try {
    if (req.method === 'GET') {
      const { id, k } = req.query || {};
      if (!autorizado(id, k)) return res.status(403).json({ ok: false });
      const dados = await lerDados(id);
      if (!dados) return res.status(404).json({ ok: false });
      return res.status(200).json({ ok: true, ...dados, ficheiros: await listarFicheiros(id) });
    }
    if (req.method !== 'POST') return res.status(405).json({ ok: false });

    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    if (b.acao === 'submeter') {
      const dados = b.dados && typeof b.dados === 'object' ? b.dados : null;
      if (!dados || !String(dados.companyName || '').trim() || !String(dados.respEmail || '').trim()) return res.status(400).json({ ok: false, erro: 'faltam dados' });
      let id = b.id, k = b.k, anterior = null;
      if (id && autorizado(id, k)) anterior = await lerDados(id);
      else { id = loja.token(); k = chave(id); }
      const agora = new Date().toISOString();
      const registo = { id, dados, estado: anterior?.estado === 'concluido' ? 'concluido' : 'submetido', criadoEm: anterior?.criadoEm || agora, atualizadoEm: agora, concluidoEm: anterior?.concluidoEm || null, code: String(b.code || '').slice(0, 60) || null };
      const ok = await escrever(`onboarding/${id}/dados.json`, registo);
      if (!ok) return res.status(500).json({ ok: false, erro: 'não gravou' });
      return res.status(200).json({ ok: true, id, k });
    }

    if (b.acao === 'token') {
      if (!autorizado(b.id, b.k)) return res.status(403).json({ ok: false });
      const tipo = TIPOS.includes(b.tipo) ? b.tipo : 'outros';
      const pathname = `onboarding/${b.id}/ficheiros/${tipo}/${Date.now().toString(36)}-${limpaNome(b.nome)}`;
      return res.status(200).json({ ok: true, pathname, token: tokenCliente(pathname) });
    }

    if (b.acao === 'concluir') {
      if (!autorizado(b.id, b.k)) return res.status(403).json({ ok: false });
      const registo = await lerDados(b.id);
      if (!registo) return res.status(404).json({ ok: false });
      const ficheiros = await listarFicheiros(b.id);
      const jaConcluido = registo.estado === 'concluido';
      registo.estado = 'concluido';
      registo.concluidoEm = registo.concluidoEm || new Date().toISOString();
      await escrever(`onboarding/${b.id}/dados.json`, registo);
      // avisa só da primeira vez (voltar atrás e concluir de novo não repete o email)
      const aviso = jaConcluido ? { saltado: 'já avisado' } : await avisarEquipa(b.id, b.k, registo.dados || {}, ficheiros);
      return res.status(200).json({ ok: true, ficheiros: ficheiros.length, aviso });
    }

    return res.status(400).json({ ok: false, erro: 'ação desconhecida' });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: String(e) });
  }
};
