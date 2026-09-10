// Envia a lista do funil «100 Clientes Ideais», de minuto a minuto, e vigia a entrega.
// ATENÇÃO: o Vercel Blob serve o conteúdo por CDN com cache, por isso um ficheiro reescrito pode ser lido
// na versão antiga. Todo o estado (trinco, tentativas, entrega confirmada, alerta já enviado) vive em
// marcadores que se confirmam pela LISTAGEM (sem cache), e o conteúdo de cada ficheiro escreve-se uma vez só.
// Foi assim que a mesma lista saiu duas vezes a um lead a 10/09/2026.
const loja = require('./_blob.js');
const { construirLista, enviarLista, estadoEmail, alertar } = require('./_lista100.js');
const MIN = 60 * 1000, TRINCO = 4 * MIN, MINIMO = 30, MAX_TENTATIVAS = 3;
const BOM = s => ['delivered', 'opened', 'clicked'].includes(s);
const ghl = id => `https://app.gohighlevel.com/v2/location/${process.env.GHL_LOCATION_VLOOM}/contacts/detail/${id}`;
const nomeDe = b => b.pathname.split('/').pop().replace(/\.json$/, '');
const conjunto = async prefixo => new Set((await loja.listar(prefixo, 1000)).map(b => b.pathname));
const marca = (caminho, dados = {}) => loja.escrever(caminho, { ...dados, em: Date.now() });

async function vigiarEntregas(relatorio) {
  const [feitos, verif, alertas] = await Promise.all([loja.listar('feitos100/', 200), conjunto('verif100/'), conjunto('alerta100/')]);
  for (const b of feitos) {
    const id = nomeDe(b);
    if (verif.has(`verif100/${id}.json`)) continue;
    const f = await loja.ler(b.url);
    if (!f || !f.msgId) continue;
    const idade = Date.now() - (f.criado || 0);
    if (idade < 3 * MIN || idade > 48 * 60 * MIN) continue;
    const lista = await estadoEmail(f.msgId), primeiro = f.email1Id ? await estadoEmail(f.email1Id) : null;
    const quem = [`Lead: ${f.nome || 'sem nome'} · ${f.email}`, `Contacto: ${ghl(f.contactId)}`, `Lista: ${f.link}`];
    if (lista?.status === 'failed' || primeiro?.status === 'failed') {
      const q = lista?.status === 'failed' ? 'o email da LISTA' : 'o 1.º email (confirmação)';
      relatorio.push({ alerta: 'falhou', email: f.email, a: await alertar({ titulo: `Falhou a entrega de ${q}`, linhas: [...quem, `Erro: ${(lista?.erro || primeiro?.erro || '').slice(0, 120)}`] }) });
      await marca(`verif100/${id}.json`, { resultado: 'falhou', lista: lista?.status, primeiro: primeiro?.status });
    } else if (BOM(lista?.status)) {
      await marca(`verif100/${id}.json`, { resultado: 'entregue', lista: lista.status, primeiro: primeiro?.status || null });
      relatorio.push({ entregue: f.email });
    } else if (idade > 60 * MIN && !alertas.has(`alerta100/${id}-sem.json`)) {
      relatorio.push({ alerta: 'sem confirmação', email: f.email, a: await alertar({ titulo: 'Email da lista sem confirmação de entrega há mais de 1 hora', linhas: [...quem, `Estado: ${lista?.status || 'desconhecido'}`] }) });
      await marca(`alerta100/${id}-sem.json`);
    }
  }
}

module.exports = async function handler(req, res) {
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.authorization !== `Bearer ${segredo}`) return res.status(401).json({ ok: false });
  if (!loja.temStore()) return res.status(200).json({ ok: false, error: 'sem store' });
  const relatorio = [];
  try { await vigiarEntregas(relatorio); } catch (e) { relatorio.push({ erroVigia: String(e && e.message || e).slice(0, 100) }); }

  const [pendentes, feitos, alertas] = await Promise.all([loja.listar('pendentes100/', 50), conjunto('feitos100/'), conjunto('alerta100/')]);
  // Uma lista por contacto. O id é <contactId>-<hora do pedido>: se o mesmo contacto tem vários pedidos
  // em fila, fica o mais antigo; se já lhe saiu uma lista nos últimos 30 minutos, os outros apagam-se.
  // Sem isto, três pedidos seguidos davam três listas (corridas sobrepostas, 10/09/2026).
  const contactoDe = id => id.slice(0, id.lastIndexOf('-')), horaDe = id => Number(id.split('-').pop()) || 0;
  const primeiro = {};
  for (const b of pendentes) { const id = nomeDe(b), c = contactoDe(id); if (!primeiro[c] || horaDe(id) < horaDe(primeiro[c])) primeiro[c] = id; }
  const jaRecebeu = c => [...feitos].some(f => f.startsWith(`feitos100/${c}-`) && Date.now() - horaDe(f.replace(/\.json$/, '')) < 30 * MIN);
  for (const b of pendentes) {
    const id = nomeDe(b);
    if (feitos.has(`feitos100/${id}.json`)) { await loja.apagar(b.url); continue; }
    const cont = contactoDe(id);
    if (primeiro[cont] !== id || jaRecebeu(cont)) { await loja.apagar(b.url); relatorio.push({ repetido: id }); continue; }
    const p = await loja.ler(b.url);
    if (!p || !p.id) { await loja.apagar(b.url); continue; }
    const tent = await loja.listar(`trinco100/${id}/`, 20);
    const ultima = tent.reduce((m, t) => Math.max(m, Date.parse(t.uploadedAt) || 0), 0);
    // pedido parado há mais de 15 minutos: alerta uma vez
    if (Date.now() - (p.criado || 0) > 15 * MIN && !alertas.has(`alerta100/${id}-parado.json`)) {
      relatorio.push({ alerta: 'parado', a: await alertar({ titulo: 'Pedido de lista parado há mais de 15 minutos', linhas: [`Lead: ${p.nome || 'sem nome'} · ${p.email}`, `Contacto: ${ghl(p.contactId)}`, `Tentativas: ${tent.length}`] }) });
      await marca(`alerta100/${id}-parado.json`);
    }
    if (ultima && Date.now() - ultima < TRINCO) continue; // outra corrida está a tratar deste pedido
    if (tent.length >= MAX_TENTATIVAS) {
      if (!alertas.has(`alerta100/${id}-vazia.json`)) {
        relatorio.push({ alerta: 'desistiu', a: await alertar({ titulo: 'Não foi possível montar a lista ao fim de 3 tentativas', linhas: [`Lead: ${p.nome || 'sem nome'} · ${p.email}`, `Contacto: ${ghl(p.contactId)}`, `Perfil: ${(p.perfil?.setores || []).join(', ')} · ${(p.perfil?.zonas || []).join(', ')}`] }) });
        await marca(`alerta100/${id}-vazia.json`);
      }
      await loja.escrever(`falhados100/${id}.json`, { ...p, motivo: 'sem lista ao fim de 3 tentativas' }); await loja.apagar(b.url);
      continue;
    }
    const n = tent.length + 1;
    await marca(`trinco100/${id}/${Date.now()}.json`, { tentativa: n });
    try {
      const lista = await construirLista({ setores: p.perfil?.setores, zonas: p.perfil?.zonas, alvo: 100, segundos: 150 });
      // lista curta quase sempre é o servidor dos dados abertos ocupado: tenta de novo antes de enviar
      if (lista.length < MINIMO && n < MAX_TENTATIVAS) return res.status(200).json({ ok: true, id, estado: `lista curta (${lista.length}), tenta de novo`, relatorio });
      // nunca se manda uma lista com menos de 10 empresas (saiu uma com 1 a 10/09/2026): à 3.ª tentativa
      // a corrida seguinte desiste e avisa o Tiago, que decide
      if (lista.length < 10) return res.status(200).json({ ok: false, id, estado: `lista com ${lista.length}, não se envia`, relatorio });
      // última verificação antes de enviar: se entretanto outra corrida já entregou, não se manda outra vez
      if ((await loja.listar(`feitos100/${id}.json`, 2)).length) return res.status(200).json({ ok: true, id, estado: 'já enviado por outra corrida', relatorio });
      const t = loja.token();
      await loja.escrever(`r100/${t}.json`, { token: t, lista, perfil: p.perfil, nome: p.nome || '', quantas: p.quantas || null, criado: Date.now() });
      const link = `https://oferta.vloom.pt/100clientesideais/lista/?r=${t}`;
      const envio = await enviarLista({ contactId: p.contactId, email: p.email, nome: p.nome, n: lista.length, top: lista.slice(0, 10), link });
      await loja.escrever(`feitos100/${id}.json`, { token: t, link, n: lista.length, email: p.email, nome: p.nome, contactId: envio.contactId || p.contactId,
        msgId: envio.msgId, email1Id: p.email1Id || null, envio: { ok: envio.ok, status: envio.status }, criado: Date.now() });
      await loja.apagar(b.url);
      if (!envio.ok) relatorio.push({ alerta: 'envio', a: await alertar({ titulo: 'O GHL recusou o envio do email da lista', linhas: [`Lead: ${p.nome || 'sem nome'} · ${p.email}`, `Contacto: ${ghl(p.contactId)}`, `Lista: ${link}`, `Estado: ${envio.status || envio.error}`] }) });
      return res.status(200).json({ ok: true, id, estado: 'enviado', n: lista.length, link, envio, relatorio });
    } catch (e) {
      return res.status(200).json({ ok: false, id, tentativa: n, erro: String(e && e.message || e).slice(0, 120), relatorio });
    }
  }
  return res.status(200).json({ ok: true, pendentes: pendentes.length, estado: 'nada a fazer', relatorio });
};
