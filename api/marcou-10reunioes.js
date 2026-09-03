// Marca no GHL quem chegou à página de "reunião marcada" do funil das 10 reuniões.
// A tag só é posta por quem ATERRA na página seguinte — é essa a prova de que marcou.
// Env vars: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const TAG_MARCOU = '10reunioes-marcou';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) {
    return res.status(403).json({ ok: false, error: 'origem não autorizada' });
  }

  const token = process.env.GHL_PIT;
  const locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });

  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const headers = {
    Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json',
  };

  try {
    // A página guarda o contactId da candidatura; se o tiver perdido, procura pelo email.
    let contactId = b.contactId;
    if (!contactId && b.email) {
      const q = await fetch(`${GHL}/contacts/?locationId=${locationId}&query=${encodeURIComponent(b.email)}&limit=1`, { headers })
        .then(r => r.json()).catch(() => null);
      contactId = q?.contacts?.[0]?.id;
    }
    if (!contactId) return res.status(200).json({ ok: false, error: 'sem contacto' });

    await fetch(`${GHL}/contacts/${contactId}/tags`, {
      method: 'POST', headers, body: JSON.stringify({ tags: [TAG_MARCOU] }),
    });
    return res.status(200).json({ ok: true, contactId, tag: TAG_MARCOU });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err) });
  }
};
