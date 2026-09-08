// Fontes abertas e gratuitas: OpenStreetMap (Overpass) e Wikidata.
// Servem para o relatório não viver de memória do modelo: as empresas semelhantes
// saem daqui, com nome, morada, site e telefone reais.
const UA = 'VloomRelatorios/1.0 (marketing@vloom.pt)';

async function overpass(consulta, segundos = 45) {
  const corte = new AbortController();
  const t = setTimeout(() => corte.abort(), segundos * 1000);
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', signal: corte.signal,
      headers: { 'User-Agent': UA, 'Content-Type': 'text/plain' },
      body: consulta,
    });
    if (!r.ok) return [];
    const j = await r.json().catch(() => null);
    return (j && j.elements) || [];
  } catch { return []; } finally { clearTimeout(t); }
}

const limpaSite = s => {
  const u = String(s || '').trim();
  return /^https?:\/\/\S+$/i.test(u) ? u.split('?')[0].slice(0, 160) : '';
};

// Empresas de uma categoria OSM numa zona (concelho, distrito ou cidade).
// O modelo escreve os filtros de várias maneiras; aqui ficam todos na forma ["chave"="valor"].
function normaliza(f) {
  let x = String(f || '').trim();
  if (!x) return '';
  if (!x.startsWith('[')) x = '[' + x + ']';
  x = x.replace(/^\[+/, '[').replace(/\]+$/, ']');
  return /^\[\s*"[^"]+"\s*[=~]\s*"[^"]+"\s*\]$/.test(x) ? x : '';
}

async function empresasOSM({ filtros, zona, limite = 40 }) {
  const bons = (filtros || []).map(normaliza).filter(Boolean);
  if (!bons.length) return [];
  const partes = bons.map(f => `node${f}(area.a);way${f}(area.a);`).join('');
  const q = `[out:json][timeout:40];area["name"="${String(zona).replace(/"/g, '')}"]["boundary"="administrative"]->.a;(${partes});out center ${limite};`;
  const els = await overpass(q);
  const vistos = new Set(); const out = [];
  for (const e of els) {
    const t = e.tags || {};
    const nome = (t.name || '').trim();
    if (!nome || vistos.has(nome.toLowerCase())) continue;
    vistos.add(nome.toLowerCase());
    out.push({
      nome: nome.slice(0, 90),
      site: limpaSite(t.website || t['contact:website']),
      telefone: (t.phone || t['contact:phone'] || '').slice(0, 30),
      email: (t.email || t['contact:email'] || '').slice(0, 80),
      morada: [t['addr:street'], t['addr:housenumber'], t['addr:city'] || zona].filter(Boolean).join(' ').slice(0, 90),
      zona: String(zona),
      etiquetas: Object.entries(t).filter(([k]) => ['tourism', 'shop', 'amenity', 'office', 'craft', 'cuisine', 'stars', 'healthcare', 'leisure'].includes(k)).map(([k, v]) => `${k}=${v}`).join(' '),
    });
  }
  return out;
}

// Empresas portuguesas conhecidas de um setor, pela Wikidata (bom para as maiores).
async function empresasWikidata({ palavra, limite = 20 }) {
  const p = String(palavra || '').replace(/["\\]/g, '').slice(0, 60);
  const sparql = `SELECT DISTINCT ?nome ?site ?desc WHERE {
    ?item wdt:P31/wdt:P279* wd:Q4830453 ; wdt:P17 wd:Q45 ; rdfs:label ?nome .
    OPTIONAL { ?item wdt:P856 ?site }
    OPTIONAL { ?item schema:description ?desc FILTER(lang(?desc)='pt') }
    FILTER(lang(?nome)='pt')
    FILTER(CONTAINS(LCASE(COALESCE(?desc,'')), LCASE("${p}")))
  } LIMIT ${limite}`;
  try {
    const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(sparql), {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
    });
    if (!r.ok) return [];
    const j = await r.json().catch(() => null);
    return ((j && j.results && j.results.bindings) || []).map(b => ({
      nome: (b.nome && b.nome.value || '').slice(0, 90),
      site: limpaSite(b.site && b.site.value),
      nota: (b.desc && b.desc.value || '').slice(0, 120),
    })).filter(x => x.nome);
  } catch { return []; }
}

module.exports = { empresasOSM, empresasWikidata, overpass };
