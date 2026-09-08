// Fecha os relatórios do lado do servidor, de minuto a minuto.
// Motor gratuito em três passos: perfil (Gemini) -> recolha (OpenStreetMap e Wikidata) -> composição (Gemini).
// Se algum passo falhar duas vezes, cai para a OpenAI, que pesquisa sozinha mas é paga.
const { SCHEMA, SCHEMA_PERFIL, INSTRUCOES, INSTRUCOES_PERFIL, INSTRUCOES_COMPOR, limpar, filtrarGenericos, magro } = require('./_motor3.js');
const loja = require('./_blob.js');
const enviarRelatorio = require('./_email3.js');
const { gerar } = require('./_gemini.js');
const { empresasOSM, empresasWikidata } = require('./_fontes.js');

const HORA = 60 * 60 * 1000;

async function lancarOpenAI(nomes, confirmadas) {
  const KEY = process.env.OPENAI_API_KEY;
  if (!KEY) return null;
  const conf = Array.isArray(confirmadas) && confirmadas.length
    ? '\n\nIdentificações CONFIRMADAS pelo utilizador (usa exactamente estas):\n' + confirmadas.map((c, i) => `${i + 1}. ${c.nome}${c.descricao ? ' — ' + c.descricao : ''}`).join('\n') : '';
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.MOTOR_MODELO || 'gpt-5', background: true, store: true,
      tools: [{ type: 'web_search' }], instructions: INSTRUCOES,
      input: 'As três empresas: ' + nomes.join(' · ') + conf,
      text: { format: { type: 'json_schema', name: 'analise', schema: SCHEMA, strict: true } },
      reasoning: { effort: process.env.MOTOR_ESFORCO || 'low' },
      metadata: { nomes: nomes.join(' · ').slice(0, 500), modelo: 'gpt-5' },
    }),
  });
  const j = await r.json().catch(() => null);
  return r.ok && j && j.id ? j.id : null;
}

async function entregar(p, resultado) {
  const t = loja.token();
  const guardado = await loja.escrever(`r/${t}.json`, { token: t, resultado, nomes: p.nomes || [], nome: p.nome || '', criado: Date.now(), job: p.id });
  if (!guardado) return null;
  await loja.escrever(`feitos/${p.id}.json`, { token: t, criado: Date.now() });
  const link = `https://oferta.vloom.pt/3clientes/relatorio/?r=${t}`;
  const envio = await enviarRelatorio({ link, email: p.email, nome: p.nome, nomes: p.nomes, contactId: p.contactId });
  return { link, email: !!envio.ok };
}

module.exports = async function handler(req, res) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.authorization !== `Bearer ${segredo}`) return res.status(401).json({ ok: false });
  if (!loja.temStore()) return res.status(200).json({ ok: false, error: 'sem store' });

  const pendentes = await loja.listar('pendentes/', 100);
  const feitos = [];
  const fim = Date.now() + 230000; // deixa margem antes do limite da função
  let usosGemini = 0; // uma chamada ao Gemini por corrida, para não bater no limite por minuto

  for (const b of pendentes) {
    if (Date.now() > fim) break;
    const p = await loja.ler(b.url);
    if (!p || !p.id) { await loja.apagar(b.url); continue; }
    if (p.criado && Date.now() - p.criado > HORA) { await loja.apagar(b.url); feitos.push({ id: p.id, estado: 'expirou' }); continue; }
    const guardar = extra => loja.escrever(`pendentes/${p.id}.json`, { ...p, ...extra });
    const falhou = async motivo => {
      // limite de ritmo do Gemini não é falha do motor: espera-se o minuto seguinte
      if (/quota|rate limit|too_many_requests|429/i.test(String(motivo))) {
        await guardar({ esperas: (p.esperas || 0) + 1 });
        return { id: p.id, estado: 'à espera do limite por minuto' };
      }
      const t = (p.tentativas || 0) + 1;
      if (t >= 2 && p.fase !== 'openai') {
        const respId = await lancarOpenAI(p.nomes, p.confirmadas);
        if (respId) { await guardar({ fase: 'openai', respId, tentativas: 0 }); return { id: p.id, estado: 'caiu para a openai', motivo }; }
      }
      await guardar({ tentativas: t });
      return { id: p.id, estado: 'tentativa ' + t, motivo };
    };

    try {
      if (p.fase === 'perfil') {
        if (usosGemini >= 1) continue;
        usosGemini++;
        const g = await gerar({ instrucoes: INSTRUCOES_PERFIL, entrada: 'As três empresas: ' + (p.nomes || []).join(' · '), schema: SCHEMA_PERFIL, segundos: 120 });
        if (!g.ok || !g.resultado || !g.resultado.procura) { feitos.push(await falhou(g.erro || 'perfil vazio')); continue; }
        await guardar({ fase: 'recolha', perfil: g.resultado, tentativas: 0 });
        feitos.push({ id: p.id, estado: 'perfil feito' });
        continue;
      }

      if (p.fase === 'recolha') {
        const proc = (p.perfil && p.perfil.procura) || {};
        const lotes = (proc.zonas || []).slice(0, 4).map(z => empresasOSM({ filtros: (proc.filtros_osm || []).slice(0, 3), zona: z, limite: 40 }));
        lotes.push(empresasWikidata({ palavra: proc.palavra_wikidata || 'empresa' }));
        const lista = (await Promise.all(lotes)).flat();
        if (!lista.length) { feitos.push(await falhou('recolha vazia')); continue; }
        await loja.escrever(`ctx/${p.id}.json`, { lista });
        await guardar({ fase: 'compor', recolhidas: lista.length, tentativas: 0 });
        feitos.push({ id: p.id, estado: 'recolha feita', empresas: lista.length });
        continue;
      }

      if (p.fase === 'compor') {
        if (usosGemini >= 1) continue;
        usosGemini++;
        const ctxBlob = (await loja.listar(`ctx/${p.id}.json`, 5))[0];
        const ctx = ctxBlob ? await loja.ler(ctxBlob.url) : null;
        const lista = (ctx && ctx.lista) || [];
        const entrada = 'EMPRESAS IDENTIFICADAS E PERFIL:\n' + JSON.stringify({ empresas: p.perfil.empresas, perfil: p.perfil.perfil })
          + `\n\nLISTA RECOLHIDA EM FONTES ABERTAS (${lista.length}):\n`
          + lista.map(x => `- ${x.nome} | ${x.zona || ''} | ${x.site || 'sem site'} | ${x.telefone || ''} | ${x.etiquetas || x.nota || ''}`).join('\n');
        const g = await gerar({ instrucoes: INSTRUCOES_COMPOR, entrada, schema: SCHEMA, segundos: 200 });
        if (!g.ok || !g.resultado) { feitos.push(await falhou(g.erro || 'composição falhou')); continue; }
        const resultado = filtrarGenericos(limpar(g.resultado));
        if (magro(resultado)) { feitos.push(await falhou('resultado magro')); continue; }
        const e = await entregar(p, resultado);
        if (!e) { feitos.push(await falhou('não guardou')); continue; }
        await loja.apagar(b.url);
        if (ctxBlob) await loja.apagar(ctxBlob.url);
        feitos.push({ id: p.id, estado: 'enviado', email: e.email, link: e.link });
        continue;
      }

      // fase openai: a análise corre lá fora, aqui só se espera por ela
      const respId = p.respId || p.id;
      const r = await fetch(`https://api.openai.com/v1/responses/${respId}`, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j) continue;
      if (j.status === 'failed' || j.status === 'cancelled') { await loja.apagar(b.url); feitos.push({ id: p.id, estado: j.status }); continue; }
      if (j.status !== 'completed') continue;
      const txt = (j.output || []).filter(o => o.type === 'message').flatMap(o => o.content || []).map(c => c.text || '').join('');
      let resultado; try { resultado = filtrarGenericos(limpar(JSON.parse(txt))); } catch { resultado = null; }
      if (!resultado || magro(resultado)) { await loja.apagar(b.url); feitos.push({ id: p.id, estado: 'magro' }); continue; }
      const e = await entregar(p, resultado);
      await loja.apagar(b.url);
      feitos.push({ id: p.id, estado: 'enviado pela openai', email: e && e.email, link: e && e.link });
    } catch (err) {
      feitos.push({ id: p.id, estado: 'erro', motivo: String(err && err.message || err).slice(0, 80) });
    }
  }
  return res.status(200).json({ ok: true, pendentes: pendentes.length, tratados: feitos });
};
