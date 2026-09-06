// Envia ao lead, pelo GHL, o link do relatório «3 clientes de sonho» e regista a tag.
// Chamado pela página quando a análise termina. Env: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) return res.status(403).json({ ok: false, error: 'origem não autorizada' });
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const id = String(b.id || ''); if (!/^resp_[a-z0-9]+$/i.test(id)) return res.status(400).json({ ok: false, error: 'id inválido' });
  const nomes = Array.isArray(b.nomes) ? b.nomes.map(x => String(x || '').trim()).filter(Boolean).slice(0, 3) : [];
  const link = `https://oferta.vloom.pt/3clientes/relatorio/?id=${encodeURIComponent(id)}`;
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  try {
    let contactId = b.contactId;
    if (!contactId && b.email) {
      const q = await fetch(`${GHL}/contacts/?locationId=${locationId}&query=${encodeURIComponent(b.email)}&limit=1`, { headers }).then(r => r.json()).catch(() => null);
      contactId = q?.contacts?.[0]?.id;
    }
    if (!contactId) return res.status(200).json({ ok: false, error: 'sem contacto' });
    await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['3clientes-relatorio'] }) }).catch(() => {});
    await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: `Relatório 3 clientes de sonho: ${link}` }) }).catch(() => {});
    const nome = esc(b.nome || '').split(' ')[0];
    const html = `<p>${nome ? 'Olá ' + nome + ',' : 'Olá,'}</p>
<p>O relatório sobre ${nomes.length ? '<b>' + nomes.map(esc).join('</b>, <b>') + '</b>' : 'as três empresas que nos deu'} está pronto. Tem lá o perfil comum, as empresas com o mesmo perfil, por onde começar, quem decide lá dentro e por onde se chega a cada uma.</p>
<p><a href="${link}" style="display:inline-block;background:#8d489b;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:6px">Abrir o relatório</a></p>
<p style="color:#666;font-size:13px">É um primeiro passe automático, com fontes públicas. Na reunião confirmamos tudo à mão, empresa a empresa, e mostramos o caminho até elas. Se quiser marcar já: <a href="https://oferta.vloom.pt/3clientes/obrigado/">escolha o dia e a hora</a>.</p>
<p>Tiago Severino<br>Vloom</p>`;
    const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers,
      body: JSON.stringify({ type: 'Email', contactId, subject: `O seu relatório: ${nomes.length ? nomes.join(', ') : '3 clientes de sonho'}`, html }) });
    return res.status(200).json({ ok: r.ok, status: r.status, link });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
};
