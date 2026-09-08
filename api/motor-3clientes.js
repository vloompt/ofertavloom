// Motor dos "3 clientes de sonho".
//   POST {c1,c2,c3}      -> lança a análise em background na OpenAI e devolve {id}
//   GET  ?id=resp_xxx    -> {status} enquanto corre; {status:'completed', resultado} no fim
// A análise demora 1 a 2 minutos (pesquisa web), por isso corre em background e a página vai perguntando.
// Env: OPENAI_API_KEY
const { SCHEMA, INSTRUCOES, limpar, magro, filtrarGenericos } = require('./_motor3');
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];

function cors(req, res) {
  const o = req.headers.origin || '';
  if (o && ORIGENS_OK.some(h => o.includes(h))) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

async function lancar(H, nomes, modelo, confirmadas) {
  const conf = Array.isArray(confirmadas) && confirmadas.length ? '\n\nIdentificações CONFIRMADAS pelo utilizador (usa exactamente estas, não voltes a resolver os nomes):\n' + confirmadas.map((c, i) => `${i + 1}. ${c.nome}${c.descricao ? ' — ' + c.descricao : ''}${c.localidade ? ' — ' + c.localidade : ''}${c.site ? ' — ' + c.site : ''}`).join('\n') : '';
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: H,
    body: JSON.stringify({
      model: modelo, background: true, store: true,
      tools: [{ type: 'web_search' }],
      instructions: INSTRUCOES,
      input: 'As três empresas: ' + nomes.join(' · ') + conf,
      text: { format: { type: 'json_schema', name: 'analise', schema: SCHEMA, strict: true } },
      reasoning: { effort: process.env.MOTOR_ESFORCO || 'low' },
      metadata: { nomes: nomes.join(' · ').slice(0, 500), modelo, conf: conf ? conf.slice(0, 480) : '' },
    }),
  });
  return { ok: r.ok, j: await r.json() };
}

const loja = require('./_blob.js');

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const KEY = process.env.OPENAI_API_KEY;
  if (!KEY) return res.status(200).json({ ok: false, error: 'sem chave' });
  const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

  if (req.method === 'POST') {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (b.empresa_site) return res.status(200).json({ ok: true, bot: true });
    const nomes = [b.c1, b.c2, b.c3].map(x => String(x || '').trim().slice(0, 80)).filter(Boolean);
    if (nomes.length < 3) return res.status(400).json({ ok: false, error: 'faltam nomes' });
    try {
      const confirmadas = Array.isArray(b.confirmadas) ? b.confirmadas.slice(0, 3).map(c => ({ nome: String(c.nome || '').slice(0, 120), descricao: String(c.descricao || '').slice(0, 160), localidade: String(c.localidade || '').slice(0, 80), site: /^https?:\/\/\S+$/i.test(String(c.site || '')) ? String(c.site) : '' })) : [];
      const lead = {
        email: String(b.email || '').slice(0, 160),
        nome: String(b.nome || '').slice(0, 120),
        contactId: String(b.contactId || '').slice(0, 60),
      };
      // Motor gratuito: o trabalho fica em fila e o cron trata dele (perfil, recolha, composição).
      if (loja.temStore() && process.env.MOTOR !== 'openai') {
        const id = 'job_' + loja.token();
        const guardado = await loja.escrever(`pendentes/${id}.json`, { id, fase: 'perfil', nomes, confirmadas, tentativas: 0, criado: Date.now(), ...lead });
        if (guardado) return res.status(200).json({ ok: true, id, status: 'queued' });
      }
      const { ok, j } = await lancar(H, nomes, process.env.MOTOR_MODELO || 'gpt-5', confirmadas);
      if (!ok || !j.id) return res.status(200).json({ ok: false, error: j.error?.message || 'falhou a lançar' });
      if (loja.temStore()) {
        await loja.escrever(`pendentes/${j.id}.json`, { id: j.id, fase: 'openai', nomes, criado: Date.now(), ...lead }).catch(() => {});
      }
      return res.status(200).json({ ok: true, id: j.id, status: j.status });
    } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
  }

  if (req.method === 'GET') {
    const id = String(req.query?.id || '');
    if (/^job_[a-z0-9]+$/.test(id)) {
      // trabalho do motor gratuito: o estado vive no guarda-tudo
      const feito = (await loja.listar(`feitos/${id}.json`, 5))[0];
      if (feito) {
        const f = await loja.ler(feito.url);
        if (f && f.token) {
          const rel = (await loja.listar(`r/${f.token}.json`, 5))[0];
          const r = rel ? await loja.ler(rel.url) : null;
          if (r && r.resultado) return res.status(200).json({ ok: true, status: 'completed', resultado: r.resultado, token: f.token });
        }
      }
      const pend = (await loja.listar(`pendentes/${id}.json`, 5))[0];
      if (pend) {
        const p = await loja.ler(pend.url);
        const passos = { perfil: 4, recolha: 9, compor: 14, openai: 12 };
        return res.status(200).json({ ok: true, status: 'in_progress', fase: (p && p.fase) || 'perfil', pesquisas: passos[(p && p.fase)] || 4 });
      }
      return res.status(200).json({ ok: false, error: 'não encontrado' });
    }
    if (!/^resp_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ ok: false, error: 'id inválido' });
    try {
      const r = await fetch(`https://api.openai.com/v1/responses/${id}`, { headers: H });
      const j = await r.json();
      if (!r.ok) return res.status(200).json({ ok: false, error: j.error?.message || 'falhou a ler' });
      const pesquisas = (j.output || []).filter(o => o.type === 'web_search_call').length;
      if (j.status !== 'completed') return res.status(200).json({ ok: true, status: j.status, pesquisas });
      const txt = (j.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []).map(c => c.text || '').join('');
      let resultado; try { resultado = filtrarGenericos(limpar(JSON.parse(txt))); } catch { resultado = null; }
      if (magro(resultado)) {
        const modelo = (j.metadata && j.metadata.modelo) || 'gpt-5-mini';
        if (modelo !== 'gpt-5') {
          // o mini fugiu ao trabalho: volta a lançar com o modelo grande e a página segue o novo id
          const nomes = String((j.metadata && j.metadata.nomes) || '').split(' · ').filter(Boolean);
          if (nomes.length === 3) {
            const { ok, j: j2 } = await lancar(H, nomes, 'gpt-5', []);
            if (ok && j2.id) return res.status(200).json({ ok: true, status: 'in_progress', pesquisas, novoId: j2.id, retry: true });
          }
        }
        if (!resultado) return res.status(200).json({ ok: false, error: 'resposta ilegível' });
      }
      return res.status(200).json({ ok: true, status: 'completed', pesquisas, resultado });
    } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
  }
  return res.status(405).json({ ok: false });
};
