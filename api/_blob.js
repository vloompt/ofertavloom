// Guarda-tudo do funil «3 clientes de sonho», por cima do Vercel Blob (REST, sem dependências).
// pendentes/<respId>.json  = análise a correr, com o lead a quem entregar
// r/<token>.json           = relatório terminado, é este o link que vai no email
const BASE = 'https://blob.vercel-storage.com';
const H = () => ({ authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`, 'x-api-version': '7' });

const escrever = async (caminho, dados) => {
  const r = await fetch(`${BASE}/${caminho}`, {
    method: 'PUT',
    headers: { ...H(), 'x-content-type': 'application/json', 'x-add-random-suffix': '0', 'x-cache-control-max-age': '31536000' },
    body: JSON.stringify(dados)
  });
  return r.ok ? r.json() : null;
};

const listar = async (prefixo, limite = 200) => {
  const r = await fetch(`${BASE}?prefix=${encodeURIComponent(prefixo)}&limit=${limite}`, { headers: H() });
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  return j?.blobs || [];
};

const ler = async url => {
  const r = await fetch(url, { cache: 'no-store' });
  return r.ok ? r.json().catch(() => null) : null;
};

const apagar = async url => {
  await fetch(`${BASE}/delete`, { method: 'POST', headers: { ...H(), 'content-type': 'application/json' }, body: JSON.stringify({ urls: [url] }) }).catch(() => {});
};

// token curto e impossível de adivinhar para o link do relatório
const token = () => {
  const a = 'abcdefghijkmnopqrstuvwxyz23456789';
  let s = ''; for (let i = 0; i < 22; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
};

module.exports = { escrever, listar, ler, apagar, token, temStore: () => !!process.env.BLOB_READ_WRITE_TOKEN };
