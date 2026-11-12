// Simulador Vloom (oferta.vloom.pt/simulador/) — decide o caminho de cada lead e faz o envio.
//
// Base: o plugin vloom-simulator do marketing.vloom.pt continua a fazer o que sempre fez
// (calcula e envia o email com a estimativa, cria o contacto no GHL com as tags
// «+=500k-simulador-lead» / «(-) 500k simulador-lead» e dispara as nutrições). Esta função
// passa-lhe os dados tal e qual o formulário do WordPress passava, e por cima:
//   1. junta as 2 perguntas novas (orçamento + prazo) como tags no GHL;
//   2. escolhe um de 3 caminhos (pedido do Tiago, 12/11/2026):
//      sistema      → +500k com orçamento ≥1.000 €/mês e começo em ≤3 meses → calendário do Sistema Vloom
//      chave-na-mao → 100k–500k (ou +500k com 500–1.000 €/mês), orçamento ≥500 €/mês, começo em ≤3 meses
//      nutricao     → o resto (abaixo de 100k, sem orçamento, ou sem pressa) → sem reunião
// Com { ensaio: true } não toca no WordPress nem no GHL: só devolve o caminho.
// Variáveis de ambiente no projeto Vercel: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const WP_AJAX = 'https://marketing.vloom.pt/wp-admin/admin-ajax.php';
const ORIGENS_OK = ['oferta.vloom.pt', 'vercel.app', 'localhost'];

const FATURACAO = ['menos de 100K', '100-500K', '500-1M', '1-5M', '5-10M', 'mais de 10M'];
const MAIS_500K = ['500-1M', '1-5M', '5-10M', 'mais de 10M'];
const ORCAMENTO = ['nao-sei', 'ate-500', '500-1000', '1000-3000', '3000-mais'];
const PRAZO = ['este-mes', '3-meses', 'mais-3-meses', 'pesquisar'];

const DESTINO = {
  sistema: 'https://marketing.vloom.pt/simulador-calendario-reuniao/',
  'chave-na-mao': 'https://oferta.vloom.pt/simulador/chave-na-mao/',
  // abaixo de 100k vão para onde sempre foram (página dos websites 297 €)
  'nutricao-100k': 'https://marketing.vloom.pt/simulador-thankyou-conheca-a-vloom/',
};

function caminho(fat, orc, prz) {
  const comPressa = prz === 'este-mes' || prz === '3-meses';
  const mais500 = MAIS_500K.includes(fat);
  if (fat === 'menos de 100K') return ['nutricao', 'Fatura menos de 100 mil € por ano.'];
  if (!comPressa) return ['nutricao', 'Não quer começar nos próximos 3 meses.'];
  if (mais500 && (orc === '1000-3000' || orc === '3000-mais'))
    return ['sistema', 'Fatura mais de 500 mil €, tem pelo menos 1.000 €/mês para anúncios e quer começar em breve.'];
  if (orc === '500-1000' || orc === '1000-3000' || orc === '3000-mais')
    return ['chave-na-mao', mais500
      ? 'Fatura mais de 500 mil €, mas o orçamento para anúncios é de 500 a 1.000 €/mês.'
      : 'Fatura entre 100 e 500 mil €, tem pelo menos 500 €/mês para anúncios e quer começar em breve.'];
  return ['nutricao', 'Ainda não sabe o orçamento, ou tem menos de 500 €/mês para anúncios.'];
}

// O mesmo envio que o simulator.js do plugin fazia: nonce fresco + vloom_sim_submit.
async function enviaWordPress(b) {
  const UA = 'Mozilla/5.0 (oferta.vloom.pt simulador)';
  const n = await fetch(`${WP_AJAX}?action=vloom_sim_get_nonce&ts=${Date.now()}`, { headers: { 'User-Agent': UA } })
    .then(r => r.json()).catch(() => null);
  const nonce = n && n.success && n.data && n.data.nonce;
  if (!nonce) return { ok: false, erro: 'sem nonce do WordPress' };
  const corpo = new URLSearchParams({
    action: 'vloom_sim_submit', nonce,
    nome: b.nome, email: b.email, atividade: b.atividade, faturamento: b.faturamento, leads_mes: String(b.leads_mes),
  });
  const r = await fetch(WP_AJAX, {
    method: 'POST', body: corpo,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
  });
  const j = await r.json().catch(() => null);
  if (!j || !j.success) return { ok: false, erro: (j && j.data && j.data.message) || `WordPress ${r.status}` };
  return { ok: true, redirect: j.data && j.data.redirect };
}

// Regra imperativa do Tiago (03/11/2026): ofertas nunca chegam a clientes nem a derivados de clientes.
// Os excluídos têm a etiqueta «oferta-3k-excluir» (ou «clientes vloom»): esses nunca vão para o Chave na Mão.
async function eCliente(email) {
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return false;
  const r = await fetch(`${GHL}/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}`, Version: '2021-07-28' },
  }).catch(() => null);
  const j = r && r.ok ? await r.json().catch(() => null) : null;
  const tags = ((j && j.contact && j.contact.tags) || []).map(t => String(t).toLowerCase());
  return tags.includes('oferta-3k-excluir') || tags.includes('clientes vloom');
}

async function tagsGHL(email, tags) {
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return { ok: false, skipped: 'sem credenciais' };
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  // Só email + tags: o nome e o resto já foram gravados pelo plugin e não se apagam.
  const r = await fetch(`${GHL}/contacts/upsert`, {
    method: 'POST', headers, body: JSON.stringify({ locationId, email, tags }),
  });
  return { ok: r.ok, status: r.status };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) return res.status(403).json({ ok: false, erro: 'origem' });

  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const nome = String(b.nome || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, erro: 'nome ou email' });
  if (!FATURACAO.includes(b.faturamento) || !ORCAMENTO.includes(b.orcamento) || !PRAZO.includes(b.prazo))
    return res.status(400).json({ ok: false, erro: 'respostas inválidas' });

  let [cam, porque] = caminho(b.faturamento, b.orcamento, b.prazo);
  if (cam === 'chave-na-mao' && !b.ensaio && await eCliente(email).catch(() => false)) {
    [cam, porque] = ['nutricao', 'Já é cliente (ou derivado de cliente): não recebe a oferta Chave na Mão.'];
  }
  const destino = cam === 'nutricao'
    ? (b.faturamento === 'menos de 100K' ? DESTINO['nutricao-100k'] : null) // null = mensagem na própria página
    : DESTINO[cam];

  if (b.ensaio) return res.status(200).json({ ok: true, ensaio: true, caminho: cam, porque, redirect: destino || 'https://oferta.vloom.pt/simulador/' });

  const wp = await enviaWordPress({ nome, email, atividade: String(b.atividade || 'Outro'), faturamento: b.faturamento, leads_mes: parseInt(b.leads_mes, 10) || 50 });
  if (!wp.ok) {
    console.error('simulador: WordPress falhou', wp.erro, email);
    return res.status(502).json({ ok: false, erro: 'envio' });
  }

  const tags = ['simulador-vercel', `sim-caminho-${cam}`, `sim-orcamento-${b.orcamento}`, `sim-prazo-${b.prazo}`];
  const ghl = await tagsGHL(email, tags).catch(e => ({ ok: false, erro: String(e) }));
  if (!ghl.ok) console.error('simulador: tags GHL falharam', ghl, email);

  // +500k com orçamento segue o destino que o WordPress devolveu (é o calendário de sempre).
  const redirect = cam === 'sistema' ? (wp.redirect || DESTINO.sistema) : destino;
  return res.status(200).json({ ok: true, caminho: cam, redirect });
};
