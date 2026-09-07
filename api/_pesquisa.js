// Pesquisa gratuita (DuckDuckGo HTML). Serve de olhos ao modelo: sem isto, ele inventa.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const limpaTexto = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

async function umPedido(url, pergunta) {
  const r = await fetch(url + encodeURIComponent(pergunta), { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-PT,pt;q=0.9', 'Accept': 'text/html' } });
  if (!r.ok) return '';
  return r.text();
}

function lerHtml(html, quantos) {
  const out = [];
  const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]{0,900}?)(?:<\/div>\s*<\/div>|result__a)/g;
  let m;
  while ((m = re.exec(html)) && out.length < quantos) {
    let url = m[1];
    const uddg = /uddg=([^&]+)/.exec(url);
    if (uddg) { try { url = decodeURIComponent(uddg[1]); } catch {} }
    if (!/^https?:\/\//.test(url)) continue;
    const resumo = (/(class="result__snippet"[^>]*>)([\s\S]*?)<\/a>/.exec(m[3]) || [])[2] || '';
    out.push({ titulo: limpaTexto(m[2]).slice(0, 140), url: url.split('?')[0].slice(0, 200), resumo: limpaTexto(resumo).slice(0, 300) });
  }
  return out;
}

// A versão leve devolve a mesma coisa noutra roupagem: serve de segunda tentativa.
function lerLite(html, quantos) {
  const out = [];
  const re = /<a[^>]*class="result-link"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]{0,800}?)<\/tr>/g;
  let m;
  while ((m = re.exec(html)) && out.length < quantos) {
    let url = m[1];
    const uddg = /uddg=([^&]+)/.exec(url);
    if (uddg) { try { url = decodeURIComponent(uddg[1]); } catch {} }
    if (!/^https?:\/\//.test(url)) continue;
    const resumo = (/class="result-snippet"[^>]*>([\s\S]*?)<\/td>/.exec(m[3]) || [])[1] || '';
    out.push({ titulo: limpaTexto(m[2]).slice(0, 140), url: url.split('?')[0].slice(0, 200), resumo: limpaTexto(resumo).slice(0, 300) });
  }
  return out;
}

async function procurar(pergunta, quantos = 6) {
  try {
    const h = await umPedido('https://html.duckduckgo.com/html/?q=', pergunta);
    let res = h ? lerHtml(h, quantos) : [];
    if (!res.length) {
      const l = await umPedido('https://lite.duckduckgo.com/lite/?q=', pergunta);
      res = l ? lerLite(l, quantos) : [];
    }
    return res;
  } catch { return []; }
}

// Em série e com uma pausa curta: em rajada o motor de busca fecha a porta e vem tudo vazio.
const dormir = ms => new Promise(r => setTimeout(r, ms));
async function dossier(consultas, tecto = 60000) {
  const t0 = Date.now(); const feitas = [];
  for (const q of consultas) {
    if (Date.now() - t0 > tecto) break;
    let res = await procurar(q, 6);
    if (!res.length) { await dormir(700); res = await procurar(q, 6); }
    feitas.push({ q, res });
    await dormir(1200);
  }
  const texto = feitas.filter(f => f.res.length)
    .map(f => `### ${f.q}\n` + f.res.map(r => `- ${r.titulo} | ${r.url}${r.resumo ? '\n  ' + r.resumo : ''}`).join('\n'))
    .join('\n\n');
  return { texto, pesquisas: feitas.filter(f => f.res.length).length };
}

// As perguntas que fazemos por cada caso: identificar as três, achar parecidas e achar quem decide.
function consultas(nomes) {
  const q = [];
  for (const n of nomes) {
    q.push(`${n} site oficial`);
    q.push(`${n} empresa sede sector Portugal`);
    q.push(`${n} linkedin`);
    q.push(`${n} diretor comercial OR CEO OR gerente linkedin`);
  }
  q.push(`empresas semelhantes a ${nomes[0]} em Portugal`);
  q.push(`${nomes[0]} ${nomes[1]} concorrentes Portugal`);
  q.push(`principais empresas do sector de ${nomes[0]} em Portugal lista`);
  return q;
}

module.exports = { procurar, dossier, consultas };
