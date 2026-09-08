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
  const x = String(f || '').trim();
  if (!x) return '';
  // aceita ["shop"="car"], shop=car, Shop = car, shop~"car|truck"
  const m = /^\[?\s*"?([A-Za-z_:]+)"?\s*([=~])\s*"?([^"\]]+?)"?\s*\]?$/.exec(x);
  if (!m) return '';
  const chave = m[1].toLowerCase().trim();
  const op = m[2];
  const valor = m[3].trim();
  if (!chave || !valor) return '';
  return `["${chave}"${op}"${valor}"]`;
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

// Junta empresas de várias zonas até chegar ao alvo, sem repetir e sem a lista ficar coxa.
const ZONAS_BASE = ['Lisboa', 'Porto', 'Vila Nova de Gaia', 'Braga', 'Cascais', 'Sintra', 'Matosinhos', 'Coimbra', 'Oeiras', 'Guimarães', 'Aveiro', 'Faro', 'Leiria', 'Setúbal', 'Funchal', 'Viseu'];

async function cemEmpresas({ filtros, zonas, palavra, alvo = 100 }) {
  const ordem = [...new Set([...(zonas || []), ...ZONAS_BASE])].slice(0, 14);
  const vistos = new Set(); const lista = [];
  const junta = arr => {
    for (const e of arr) {
      const chave = e.nome.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!chave || vistos.has(chave)) continue;
      vistos.add(chave); lista.push(e);
    }
  };
  // três zonas de cada vez, para não esperar por todas em série
  for (let i = 0; i < ordem.length && lista.length < alvo; i += 3) {
    const lote = await Promise.all(ordem.slice(i, i + 3).map(z => empresasOSM({ filtros, zona: z, limite: 60 })));
    lote.forEach(junta);
  }
  if (lista.length < alvo && palavra) junta(await empresasWikidata({ palavra, limite: 30 }));
  // primeiro as que têm site, que são as que servem para trabalhar
  lista.sort((a, b) => (b.site ? 1 : 0) - (a.site ? 1 : 0));
  return lista.slice(0, alvo);
}

module.exports.cemEmpresas = cemEmpresas;
module.exports.ZONAS_BASE = ZONAS_BASE;
