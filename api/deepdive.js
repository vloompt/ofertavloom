// Recebe as respostas do Deep Dive (funil dentaria) e ENRIQUECE o contacto no GHL:
// tag + nota com as respostas. O cid do link = contact.id do GHL (o envio usa
// ?cid={{contact.id}}), por isso associamos a resposta a pessoa mesmo sem email.
// So grava no fim ('final') ou quando a pessoa larga a meio ('saiu').
// Envs (ja no projeto Vercel): GHL_PIT, GHL_LOCATION_VLOOM.
const GHL = 'https://services.leadconnectorhq.com';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];

function parseBody(raw) { try { return JSON.parse(raw || '{}'); } catch { return {}; } }

// CommonJS: sem package.json {"type":"module"}, a Vercel trata /api/*.js como CJS
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.GHL_PIT;
  const locationId = process.env.GHL_LOCATION_VLOOM;
  const b = typeof req.body === 'string' ? parseBody(req.body) : (req.body || {});

  // So aceita pedidos vindos das nossas paginas
  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) {
    return res.status(403).json({ ok: false, error: 'origem nao autorizada' });
  }
  if (!token) return res.status(200).json({ ok: false, skipped: 'sem PIT' });

  // Enriquecemos apenas em eventos terminais (fim ou abandono). Os passos
  // intermedios ('parcial'/'desafio') passam por aqui mas nao escrevem nada.
  const stage = String(b.stage || '');
  const terminal = stage === 'final' || stage === 'saiu';
  if (!terminal) return res.status(200).json({ ok: true, noted: false });

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };

  try {
    // Resolver contactId: via cid (contact.id do GHL) ou, em falta, upsert por email.
    let contactId = '';
    const cid = String(b.cid || '');
    if (cid && cid.indexOf('anon') !== 0 && cid.indexOf('@') < 0) {
      contactId = cid;
    } else if (b.email && locationId) {
      const corpo = { locationId, email: b.email };
      if (b.nome) corpo.firstName = b.nome;
      const up = await fetch(`${GHL}/contacts/upsert`, {
        method: 'POST', headers, body: JSON.stringify(corpo),
      });
      const data = await up.json().catch(() => ({}));
      contactId = data?.contact?.id || data?.id || '';
    }
    if (!contactId) return res.status(200).json({ ok: true, stored: false, reason: 'sem id/email' });

    const completo = stage === 'final';
    // Setor do funil (a pagina envia 'setor'); default 'dentaria' p/ retrocompat.
    const setor = (String(b.setor || 'dentaria').toLowerCase().replace(/[^a-z0-9]+/g, '')) || 'dentaria';
    // Tags aditivas (POST /contacts/{id}/tags acrescenta sem tocar nas existentes):
    // uma universal (engaged), uma por setor, e o estado de conclusao.
    const tags = ['respondeu-deep-dive', 'deep-dive-' + setor,
      completo ? 'deep-dive-completo' : 'deep-dive-incompleto'];
    await fetch(`${GHL}/contacts/${contactId}/tags`, {
      method: 'POST', headers, body: JSON.stringify({ tags }),
    }).catch(() => {});

    // "Foco" = campo 4 (tratamento na dentaria / tipo de formacao na formacao).
    // Nota com todas as respostas — visivel na ficha e fonte para o scoring/buckets
    // (reconstruo a folha por setor: tags 'respondeu-deep-dive' + 'deep-dive-<setor>').
    const nota = [
      `Deep Dive (${setor}) — ${completo ? 'COMPLETO' : 'saiu a meio'}:`,
      b.desafio ? `Desafio: ${b.desafio}` : '',
      `Dono/Assoc: ${b.propriedade || '—'} | Anos: ${b.tempo || '—'} | `
        + `Foco: ${b.tratamento || '—'} | Origem: ${b.origem || '—'} | `
        + `Faturacao: ${b.faturacao || '—'}`,
      b.telefone ? `Telefone: ${b.telefone}` : '',
    ].filter(Boolean).join('\n');
    await fetch(`${GHL}/contacts/${contactId}/notes`, {
      method: 'POST', headers, body: JSON.stringify({ body: nota }),
    }).catch(() => {});

    return res.status(200).json({ ok: true, stored: true, contactId, completo });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err) });
  }
};
