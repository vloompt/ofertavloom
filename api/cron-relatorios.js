// Fecha o ciclo do lado do servidor: vê as análises a correr, guarda as que acabaram e manda o email.
// Corre de minuto a minuto (crons do vercel.json), por isso o email sai mesmo que a pessoa feche a página.
const { limpar, filtrarGenericos, magro } = require('./_motor3.js');
const loja = require('./_blob.js');
const enviarRelatorio = require('./_email3.js');

const HORAS = 60 * 60 * 1000;

module.exports = async function handler(req, res) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.authorization !== `Bearer ${segredo}`) return res.status(401).json({ ok: false });
  if (!loja.temStore()) return res.status(200).json({ ok: false, error: 'sem store' });
  const KEY = process.env.OPENAI_API_KEY;
  if (!KEY) return res.status(200).json({ ok: false, error: 'sem chave' });
  const H = { Authorization: `Bearer ${KEY}` };

  const pendentes = await loja.listar('pendentes/', 100);
  const feitos = [];
  for (const b of pendentes.slice(0, 12)) {
    const p = await loja.ler(b.url);
    if (!p || !p.id) { await loja.apagar(b.url); continue; }
    // desiste ao fim de uma hora: a análise já não vem
    if (p.criado && Date.now() - p.criado > HORAS) { await loja.apagar(b.url); feitos.push({ id: p.id, estado: 'expirou' }); continue; }
    const r = await fetch(`https://api.openai.com/v1/responses/${p.id}`, { headers: H });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) continue;
    if (j.status === 'failed' || j.status === 'cancelled') { await loja.apagar(b.url); feitos.push({ id: p.id, estado: j.status }); continue; }
    if (j.status !== 'completed') continue;

    const txt = (j.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []).map(c => c.text || '').join('');
    let resultado; try { resultado = filtrarGenericos(limpar(JSON.parse(txt))); } catch { resultado = null; }
    if (!resultado || magro(resultado)) { await loja.apagar(b.url); feitos.push({ id: p.id, estado: 'magro' }); continue; }

    const t = loja.token();
    const guardado = await loja.escrever(`r/${t}.json`, { token: t, resultado, nomes: p.nomes || [], nome: p.nome || '', criado: Date.now(), respId: p.id });
    if (!guardado) continue;
    const link = `https://oferta.vloom.pt/3clientes/relatorio/?r=${t}`;
    const envio = await enviarRelatorio({ link, email: p.email, nome: p.nome, nomes: p.nomes, contactId: p.contactId });
    await loja.apagar(b.url);
    feitos.push({ id: p.id, estado: 'enviado', email: !!envio.ok, link });
  }
  return res.status(200).json({ ok: true, pendentes: pendentes.length, tratados: feitos });
};
