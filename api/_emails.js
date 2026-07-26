// Templates de email do funil Sites 297 — usados pela função /api/lead.

const BRAND = {
  navy: '#141034',
  ember: '#FF7A3D',
  ember2: '#FFB25E',
  ink: '#232048',
  paper: '#F7F6FB',
  tel: '914 310 656',
  site: 'https://oferta.vloom.pt/website/',
};

// Email para o LEAD — confirmação calorosa + próximo passo (marcar chamada)
function emailLead({ firstName }) {
  const nome = (firstName || '').split(' ')[0] || 'Olá';
  const subject = `${nome}, recebemos o seu pedido — vamos falar? ✅`;
  const html = `<!doctype html><html><body style="margin:0;background:${BRAND.paper};font-family:'Helvetica Neue',Arial,sans-serif;color:${BRAND.ink}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 12px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(20,16,52,.08)">
        <tr><td style="background:${BRAND.navy};padding:36px 40px 30px">
          <p style="margin:0;color:${BRAND.ember2};font-size:12px;letter-spacing:.22em;text-transform:uppercase;font-weight:700">Vloom · Pedido recebido</p>
          <h1 style="margin:12px 0 0;color:#fff;font-size:26px;line-height:1.25;font-weight:800">Recebemos o seu pedido, ${nome}.</h1>
        </td></tr>
        <tr><td style="padding:34px 40px 8px">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7">Obrigado pelo interesse no <b>site com marketing dentro</b>. Está tudo registado do nosso lado.</p>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7">O próximo passo é uma conversa curta e franca, de <b>15 minutos</b>: conhecemos o seu negócio e a sua zona, e mostramos-lhe como ficaria o seu site — <b>sem compromisso e sem "marketês"</b>.</p>
          <table cellpadding="0" cellspacing="0" style="margin:26px 0"><tr><td style="border-radius:40px;background:linear-gradient(120deg,${BRAND.ember},${BRAND.ember2})">
            <a href="${BRAND.site}obrigado.html" style="display:inline-block;padding:16px 34px;color:${BRAND.navy};font-weight:800;font-size:16px;text-decoration:none;border-radius:40px">Escolher a minha hora →</a>
          </td></tr></table>
          <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#55527a">Prefere que sejamos nós a ligar? Sem problema — ligamos-lhe nas próximas horas úteis a partir do <b>${BRAND.tel}</b>. Guarde o número para saber que somos nós.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 36px">
          <div style="border-top:1px solid #eceaf3;padding-top:20px">
            <p style="margin:0;font-size:13px;color:#8b88a6">Vloom — Agência de Marketing · Palácio Sottomayor, Av. Fontes Pereira de Melo 16, Lisboa</p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
  return { subject, html };
}

// Email INTERNO para o Tiago — todos os dados do lead
function emailInterno({ firstName, email, phone, setor, utm, page }) {
  const subject = `🔔 Novo lead Sites 297 — ${firstName || 'sem nome'} (${setor || 'setor?'})`;
  const linha = (k, v) => v ? `<tr><td style="padding:8px 0;color:#8b88a6;font-size:13px;width:130px">${k}</td><td style="padding:8px 0;font-size:15px;font-weight:600;color:${BRAND.ink}">${v}</td></tr>` : '';
  const html = `<!doctype html><html><body style="margin:0;background:${BRAND.paper};font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #eceaf3">
      <tr><td style="background:${BRAND.navy};padding:24px 30px">
        <h1 style="margin:0;color:#fff;font-size:19px;font-weight:800">Novo lead — Sites 297€</h1>
        <p style="margin:6px 0 0;color:${BRAND.ember2};font-size:13px">Entrou pela LP e já está no GHL (tag site297 + oportunidade 297€).</p>
      </td></tr>
      <tr><td style="padding:22px 30px 28px">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${linha('Nome', firstName)}
          ${linha('Telefone', phone ? `<a href="tel:${phone}" style="color:${BRAND.ink}">${phone}</a>` : '')}
          ${linha('Email', email ? `<a href="mailto:${email}" style="color:${BRAND.ink}">${email}</a>` : '')}
          ${linha('Setor', setor)}
          ${linha('Campanha', utm)}
          ${linha('Página', page)}
        </table>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  return { subject, html };
}

module.exports = { emailLead, emailInterno };
