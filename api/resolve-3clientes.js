// Resolve os três nomes escritos para empresas reais, ANTES da análise, para o utilizador confirmar.
// «Arena Lisboa» tem de ficar Arena Lisboa (desportos de combate), nunca Altice Arena.
// Rápido: gpt-5-mini, esforço baixo, poucas pesquisas. Devolve candidatos por nome.
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const SCHEMA = { type: 'object', additionalProperties: false,
  properties: { resolvidas: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'object', additionalProperties: false,
    properties: {
      escrito: { type: 'string' }, nome: { type: 'string' }, descricao: { type: 'string' }, localidade: { type: 'string' }, site: { type: 'string' },
      confianca: { type: 'string', enum: ['alta', 'media', 'baixa'] },
      alternativas: { type: 'array', maxItems: 3, items: { type: 'object', additionalProperties: false,
        properties: { nome: { type: 'string' }, descricao: { type: 'string' }, localidade: { type: 'string' } }, required: ['nome','descricao','localidade'] } },
    }, required: ['escrito','nome','descricao','localidade','site','confianca','alternativas'] } } },
  required: ['resolvidas'] };
const INSTR = `Recebes até três nomes de empresas escritos por uma pessoa em Portugal. Para cada um, identifica a empresa real mais provável, com uma pesquisa web curta.
Regra sagrada: NUNCA troques o nome por outra empresa com nome parecido. «Arena Lisboa» é a empresa que se chama Arena Lisboa (um ginásio de desportos de combate em Lisboa), não a Altice Arena. Mantém o que foi escrito em "escrito" e põe em "nome" o nome comercial real (pode ser igual).
Para cada uma: descricao em 6 a 10 palavras (o que faz), localidade (cidade ou concelho), site oficial (URL com https ou string vazia), confianca (alta se há uma correspondência óbvia; media se há dúvida razoável; baixa se não encontraste nada seguro) e até 3 alternativas plausíveis quando a confiança não for alta.
Português de Portugal. Sem URLs fora do campo site. Nunca peças confirmação nem devolvas vazio.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) return res.status(403).json({ ok: false, error: 'origem não autorizada' });
  const KEY = process.env.OPENAI_API_KEY;
  if (!KEY) return res.status(200).json({ ok: false, error: 'sem OPENAI_API_KEY' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const nomes = [b.c1, b.c2, b.c3].map(x => String(x || '').trim()).filter(Boolean).slice(0, 3);
  if (!nomes.length) return res.status(400).json({ ok: false, error: 'sem nomes' });
  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.RESOLVE_MODELO || 'gpt-5-mini', tools: [{ type: 'web_search' }],
        instructions: INSTR, input: 'Nomes escritos: ' + nomes.map((n, i) => `${i + 1}. ${n}`).join(' · '),
        text: { format: { type: 'json_schema', name: 'resolucao', schema: SCHEMA, strict: true } },
        reasoning: { effort: 'low' },
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(200).json({ ok: false, error: j.error?.message || 'falhou' });
    const txt = (j.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []).map(c => c.text || '').join('');
    let out; try { out = JSON.parse(txt); } catch { return res.status(200).json({ ok: false, error: 'resposta ilegível' }); }
    // garantir uma entrada por nome escrito, pela ordem
    const porEscrito = new Map((out.resolvidas || []).map(x => [String(x.escrito || '').toLowerCase().trim(), x]));
    const resolvidas = nomes.map(n => porEscrito.get(n.toLowerCase()) || (out.resolvidas || []).find(x => x.nome && n.toLowerCase().includes(x.nome.toLowerCase().slice(0, 4))) || { escrito: n, nome: n, descricao: '', localidade: '', site: '', confianca: 'baixa', alternativas: [] });
    return res.status(200).json({ ok: true, resolvidas, pesquisas: (j.output || []).filter(o => o.type === 'web_search_call').length });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
};
