// Gemini 3.6 Flash pela Interactions API. É o motor gratuito: não pesquisa sozinho,
// por isso vai sempre acompanhado do dossier que o _pesquisa.js recolheu.
const URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MODELO = process.env.GEMINI_MODELO || 'gemini-3.6-flash';

// A Interactions API recusa 'additionalProperties', 'strict', 'minItems' e 'maxItems': limpa-se o esquema da OpenAI.
function esquemaSimples(o) {
  if (Array.isArray(o)) return o.map(esquemaSimples);
  if (o && typeof o === 'object') {
    const r = {};
    for (const [k, v] of Object.entries(o)) {
      if (['additionalProperties', 'strict', 'minItems', 'maxItems'].includes(k)) continue;
      r[k] = esquemaSimples(v);
    }
    return r;
  }
  return o;
}

async function gerar({ instrucoes, entrada, schema, segundos = 240 }) {
  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) return { ok: false, erro: 'sem chave gemini' };
  const corte = new AbortController();
  const relogio = setTimeout(() => corte.abort(), segundos * 1000);
  try {
    const r = await fetch(URL, {
      method: 'POST', signal: corte.signal,
      headers: { 'x-goog-api-key': KEY, 'Content-Type': 'application/json', 'Api-Revision': '2026-05-20' },
      body: JSON.stringify({ model: MODELO, input: `${instrucoes}\n\n${entrada}`, response_format: esquemaSimples(schema) }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.error) return { ok: false, erro: (j && j.error && j.error.message) || 'falhou' };
    const passo = (j.steps || []).filter(s => s.type === 'model_output').pop();
    const txt = ((passo && passo.content) || []).map(c => c.text || '').join('');
    if (!txt) return { ok: false, erro: 'sem resposta' };
    try { return { ok: true, resultado: JSON.parse(txt), tokens: j.usage && j.usage.total_tokens }; }
    catch { return { ok: false, erro: 'json ilegível' }; }
  } catch (e) { return { ok: false, erro: String(e && e.message || e) }; }
  finally { clearTimeout(relogio); }
}

module.exports = { gerar, MODELO };
