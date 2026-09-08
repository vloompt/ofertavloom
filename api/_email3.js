// O email que entrega o relatório «3 clientes de sonho». Feito em tabelas e estilos em linha,
// que é o que os clientes de email percebem, e na linha gráfica da Vloom.
const GHL = 'https://services.leadconnectorhq.com';
const LOGO = 'https://oferta.vloom.pt/email/logo-vloom-branco.png';
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

function corpo({ link, primeiro, nomes, numeros }) {
  const lista = (nomes || []).map(esc);
  const empresas = lista.length
    ? lista.map(n => `<span style="display:inline-block;background:#f1eef8;color:#3b2a63;font-size:14px;font-weight:600;padding:7px 14px;border-radius:999px;margin:0 6px 8px 0">${n}</span>`).join('')
    : '';
  const n = numeros || {};
  const celula = (v, t) => `<td align="center" style="padding:0 6px" width="33%">
      <div style="background:#ffffff;border:1px solid #e7e3f0;border-radius:12px;padding:16px 8px">
        <div style="font-size:26px;line-height:1;font-weight:700;color:#2c1e52;font-family:Helvetica,Arial,sans-serif">${v}</div>
        <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#7b769a;margin-top:6px;font-family:Helvetica,Arial,sans-serif">${t}</div>
      </div></td>`;

  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f4f2ee;font-family:Helvetica,Arial,sans-serif;color:#2c2a3d">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">As empresas com o mesmo perfil das três que nos indicou, com site, contactos e por onde começar.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee"><tr><td align="center" style="padding:28px 14px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 34px rgba(30,20,70,.10)">

    <tr><td style="background:#151030;padding:26px 32px">
      <img src="${LOGO}" width="112" alt="Vloom" style="display:block;border:0;width:112px;height:auto">
    </td></tr>

    <tr><td style="padding:34px 32px 6px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8d489b;font-weight:700">O seu relatório está pronto</p>
      <h1 style="margin:0;font-size:26px;line-height:1.25;color:#1d1640;font-weight:700">${primeiro ? esc(primeiro) + ', encontrámos' : 'Encontrámos'} o padrão por trás das suas três empresas.</h1>
    </td></tr>

    ${empresas ? `<tr><td style="padding:18px 32px 0">${empresas}</td></tr>` : ''}

    <tr><td style="padding:18px 32px 0">
      <p style="margin:0;font-size:16px;line-height:1.6;color:#4a4763">Partimos das três que nos indicou, tirámos delas o perfil comum e fomos procurar empresas iguais em Portugal. O relatório traz o site e os contactos de cada uma, quais atacaríamos primeiro e por que canal se chega até elas.</p>
    </td></tr>

    ${(n.semelhantes || n.prioritarias || n.criterios) ? `<tr><td style="padding:22px 26px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        ${celula(n.semelhantes || 0, 'Empresas parecidas')}
        ${celula(n.prioritarias || 0, 'Para começar')}
        ${celula(n.criterios || 0, 'Critérios do perfil')}
      </tr></table>
    </td></tr>` : ''}

    <tr><td align="center" style="padding:28px 32px 6px">
      <a href="${link}" style="display:inline-block;background:#8d489b;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 34px;border-radius:10px">Abrir o meu relatório</a>
      <p style="margin:12px 0 0;font-size:13px;color:#8b879f">O link é seu e fica sempre disponível. Dá para guardar em PDF.</p>
    </td></tr>

    <tr><td style="background:#151030;padding:22px 32px">
      <p style="margin:0 0 4px;font-size:14px;color:#ffffff;font-weight:700">Tiago Severino</p>
      <p style="margin:0;font-size:13px;color:#b9b4d4">Vloom · Agência de Marketing e Publicidade Digital</p>
      <p style="margin:10px 0 0;font-size:12px;color:#8983ab">Avenida Fontes Pereira de Melo 16, Lisboa · <a href="mailto:marketing@vloom.pt" style="color:#c9a9e6;text-decoration:none">marketing@vloom.pt</a></p>
    </td></tr>
  </table>

  <p style="margin:16px 0 0;font-size:11px;color:#9a96ad;max-width:600px">Recebe este email porque pediu a análise em oferta.vloom.pt. <a href="https://vloom.pt/politica-de-privacidade/" style="color:#9a96ad">Política de privacidade</a>.</p>
</td></tr></table>
</body></html>`;
}

module.exports = async function enviarRelatorio({ link, email, nome, nomes, contactId, resultado }) {
  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  if (!token || !locationId) return { ok: false, error: 'sem credenciais' };
  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };
  if (!contactId && email) {
    const q = await fetch(`${GHL}/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}&limit=1`, { headers }).then(r => r.json()).catch(() => null);
    contactId = q && q.contacts && q.contacts[0] && q.contacts[0].id;
  }
  if (!contactId) return { ok: false, error: 'sem contacto' };

  const numeros = resultado ? {
    semelhantes: (resultado.semelhantes || []).length,
    prioritarias: (resultado.prioritarias || []).length,
    criterios: ((resultado.perfil || {}).criterios || []).length,
  } : null;

  await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: ['3clientes-relatorio'] }) }).catch(() => {});
  await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: `Relatório 3 clientes de sonho: ${link}` }) }).catch(() => {});

  const primeiro = String(nome || '').trim().split(' ')[0];
  const html = corpo({ link, primeiro, nomes, numeros });
  const assunto = (nomes && nomes.length)
    ? `${primeiro ? primeiro + ', o' : 'O'} seu relatório: empresas como ${nomes[0]}`
    : 'O seu relatório de empresas está pronto';
  const r = await fetch(`${GHL}/conversations/messages`, { method: 'POST', headers,
    body: JSON.stringify({ type: 'Email', contactId, subject: assunto, html }) });
  return { ok: r.ok, status: r.status };
};
module.exports.corpo = corpo;
