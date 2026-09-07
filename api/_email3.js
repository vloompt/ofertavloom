// Manda ao lead, pelo GHL, o link do relatório «3 clientes de sonho». Usado pelo cron e pelo endpoint manual.
const GHL = 'https://services.leadconnectorhq.com';
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

module.exports = async function enviarRelatorio({ link, email, nome, nomes, contactId }) {
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return { ok: false, error: 'sem credenciais' };
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  if (!contactId && email) {
    const q = await fetch(`${GHL}/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}&limit=1`, { headers }).then(r => r.json()).catch(() => null);
    contactId = q?.contacts?.[0]?.id;
  }
  if (!contactId) return { ok: false, error: 'sem contacto' };
  const lista = (nomes || []).map(esc);
  await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['3clientes-relatorio'] }) }).catch(() => {});
  await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: `Relatório 3 clientes de sonho: ${link}` }) }).catch(() => {});
  const primeiro = esc(nome || '').split(' ')[0];
  const html = `<p>${primeiro ? 'Olá ' + primeiro + ',' : 'Olá,'}</p>
<p>O relatório sobre ${lista.length ? '<b>' + lista.join('</b>, <b>') + '</b>' : 'as três empresas que nos deu'} está pronto. Tem lá o perfil comum, as empresas com o mesmo perfil, por onde começar, quem decide lá dentro e por onde se chega a cada uma.</p>
<p><a href="${link}" style="display:inline-block;background:#8d489b;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:6px">Abrir o relatório</a></p>
<p style="color:#666;font-size:13px">É um primeiro passe automático, com fontes públicas. Na reunião confirmamos tudo à mão, empresa a empresa, e mostramos o caminho até elas. Se quiser marcar já: <a href="https://oferta.vloom.pt/3clientes/obrigado/">escolha o dia e a hora</a>.</p>
<p>Tiago Severino<br>Vloom</p>`;
  const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers,
    body: JSON.stringify({ type: 'Email', contactId, subject: `O seu relatório: ${lista.length ? (nomes || []).join(', ') : '3 clientes de sonho'}`, html }) });
  return { ok: r.ok, status: r.status };
};
