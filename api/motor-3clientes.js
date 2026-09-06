// Motor dos "3 clientes de sonho".
//   POST {c1,c2,c3}      -> lança a análise em background na OpenAI e devolve {id}
//   GET  ?id=resp_xxx    -> {status} enquanto corre; {status:'completed', resultado} no fim
// A análise demora 1 a 2 minutos (pesquisa web), por isso corre em background e a página vai perguntando.
// Env: OPENAI_API_KEY
const { SCHEMA, INSTRUCOES, limpar } = require('./_motor3');
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];

function cors(req, res) {
  const o = req.headers.origin || '';
  if (o && ORIGENS_OK.some(h => o.includes(h))) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

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
      const r = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST', headers: H,
        body: JSON.stringify({
          model: 'gpt-5-mini', background: true, store: true,
          tools: [{ type: 'web_search' }],
          instructions: INSTRUCOES,
          input: 'As três empresas: ' + nomes.join(' · '),
          text: { format: { type: 'json_schema', name: 'analise', schema: SCHEMA, strict: true } },
          reasoning: { effort: 'medium' },
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.id) return res.status(200).json({ ok: false, error: j.error?.message || 'falhou a lançar' });
      return res.status(200).json({ ok: true, id: j.id, status: j.status });
    } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
  }

  if (req.method === 'GET') {
    const id = String(req.query?.id || '');
    if (!/^resp_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ ok: false, error: 'id inválido' });
    try {
      const r = await fetch(`https://api.openai.com/v1/responses/${id}`, { headers: H });
      const j = await r.json();
      if (!r.ok) return res.status(200).json({ ok: false, error: j.error?.message || 'falhou a ler' });
      const pesquisas = (j.output || []).filter(o => o.type === 'web_search_call').length;
      if (j.status !== 'completed') return res.status(200).json({ ok: true, status: j.status, pesquisas });
      const txt = (j.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []).map(c => c.text || '').join('');
      let resultado; try { resultado = limpar(JSON.parse(txt)); } catch { return res.status(200).json({ ok: false, error: 'resposta ilegível' }); }
      return res.status(200).json({ ok: true, status: 'completed', pesquisas, resultado });
    } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
  }
  return res.status(405).json({ ok: false });
};
