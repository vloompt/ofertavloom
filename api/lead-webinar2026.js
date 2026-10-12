// Registo no webinar (edição em curso: api/_webinar.js).
// Contacto no GHL com a etiqueta da edição e a do segmento (a resposta do passo 1), e nota com a resposta.
// O email de confirmação já não é escrito aqui: a etiqueta «webinar-inscrito» dispara o workflow
// «🎥 Webinar · Inscrição confirmada» do GHL, que é onde o texto vive.
// Sem oportunidade no pipeline: um webinar traz centenas de registos e não são candidaturas.
// Env: GHL_PIT, GHL_LOCATION_VLOOM, GHL_AVISO_WEBINAR2026
const loja = require('./_blob.js');
const { enviarTelegram } = require('./_telegram.js');
const { EDICAO, ETIQUETAS, disparar } = require('./_webinar.js');
const GHL = 'https://services.leadconnectorhq.com';
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const AVISO_INTERNO = process.env.GHL_AVISO_WEBINAR2026 || 'marketing@vloom.pt';
// cópia para o Tiago (o contacto dele tem «não incomodar» no email, por isso vai em cópia, como no funil 100 Clientes Ideais)
const AVISO_CC = (process.env.GHL_AVISO_CC_WEBINAR2026 || 'tiagoseverino@vloom.pt').split(',').map(x => x.trim()).filter(Boolean);
const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

async function telegram(texto) {
  await enviarTelegram(texto); // com o banner da Vloom por cima (api/_telegram.js)
}

// segmento a partir da resposta do micro-compromisso
function segmento(r) {
  const t = String(r || '').toLowerCase();
  if (t.includes('quantas leads')) return 'webinar-falha-numeros';
  if (t.includes('não viram reuniões')) return 'webinar-falha-conversao';
  if (t.includes('não fecho')) return 'webinar-falha-comercial';
  if (t.includes('volume')) return 'webinar-falha-volume';
  if (t.includes('gravação')) return ETIQUETAS.querGravacao;
  if (t.includes('ao vivo')) return `webinar-${EDICAO.id}-quer-ao-vivo`;
  return '';
}

module.exports = async function handler(req, res) {
  const o = req.headers.origin || '';
  if (o && ORIGENS_OK.some(h => o.includes(h))) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.GHL_PIT, locationId = process.env.GHL_LOCATION_VLOOM;
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.empresa_site) return res.status(200).json({ ok: true, bot: true });
  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });

  const nome = (b.nome || '').trim();
  const email = (b.email || '').trim();
  const phone = (b.telefone || b.phone || '').trim();
  const resposta = (b.resposta || '').trim();
  if (!email) return res.status(400).json({ ok: false, error: 'sem email' });

  const headers = { Authorization: `Bearer ${token}`, Version: '2021-07-28', 'Content-Type': 'application/json' };

  // passo 2 da página de obrigado: só grava o telemóvel para os lembretes por SMS (sem emails)
  if (b.acao === 'telefone') {
    const num = String(phone).replace(/[^0-9]/g, '').replace(/^00351|^351/, '');
    if (!/^9[1236]\d{7}$/.test(num)) return res.status(400).json({ ok: false, error: 'telemóvel inválido' });
    try {
      const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify({ locationId, email, phone: '+351' + num }) });
      const data = await up.json();
      const contactId = data?.contact?.id || data?.id;
      if (!up.ok || !contactId) return res.status(200).json({ ok: false });
      // a conta não permite contactos duplicados: se o telemóvel já pertence a outro contacto, o GHL ignora-o
      // sem erro. Nesse caso o SMS vai para o contacto dono desse telemóvel.
      const lido = await fetch(`${GHL}/contacts/${contactId}`, { headers }).then(r => r.json()).catch(() => null);
      let alvo = contactId, via = 'registo';
      if (!lido?.contact?.phone) {
        const dup = await fetch(`${GHL}/contacts/search/duplicate?locationId=${locationId}&number=${encodeURIComponent('+351' + num)}`, { headers }).then(r => r.json()).catch(() => null);
        if (dup?.contact?.id && dup.contact.id !== contactId) {
          // o telemóvel já pertence a outro contacto: não ativar SMS nesse contacto alheio, só deixar nota nos dois
          await fetch(`${GHL}/contacts/${dup.contact.id}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: `Pediu lembrete do webinar de ${EDICAO.curta} por SMS. Registou-se com o email ${email}.` }) }).catch(() => {});
          await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: 'telemóvel pertence a outro contacto, SMS não ativado' }) }).catch(() => {});
          return res.status(200).json({ ok: false, error: 'telemóvel já associado a outro contacto' });
        } else return res.status(200).json({ ok: false, error: 'telemóvel não gravado' });
      }
      await fetch(`${GHL}/contacts/${alvo}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: [ETIQUETAS.sms] }) }).catch(() => {});
      return res.status(200).json({ ok: true, contactId: alvo, via });
    } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
  }

  try {
    const corpo = { locationId, email, source: `Webinar ${EDICAO.curta} ${EDICAO.id.slice(0, 4)}` };
    if (nome) corpo.firstName = nome;
    if (phone) corpo.phone = phone;
    const up = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify(corpo) });
    const data = await up.json();
    const contactId = data?.contact?.id || data?.id;
    if (!up.ok || !contactId) return res.status(200).json({ ok: false, ghl: data });

    // Selo de emergência: mais de 30 registos numa hora é fora do normal (robô de spam). O contacto continua
    // a ser criado, mas sem email ao lead nem aviso interno — só a tag, para o Tiago confirmar antes.
    let suspeito = false;
    if (loja.temStore()) {
      const hora = new Date().toISOString().slice(0, 13).replace(/[-T:]/g, '');
      await loja.escrever(`rl/webinar-${hora}/${contactId}-${Date.now()}.json`, { em: Date.now() }).catch(() => null);
      const nestaHora = await loja.listar(`rl/webinar-${hora}/`, 200);
      if (nestaHora.length > 30) {
        suspeito = true;
        const jaAvisado = await loja.listar(`rl/webinar-alerta-${hora}.json`, 1);
        if (!jaAvisado.length) {
          await loja.escrever(`rl/webinar-alerta-${hora}.json`, { hora, em: Date.now() }).catch(() => null);
          await telegram(`⚠️ <b>Webinar: mais de 30 registos na última hora</b>\nA marcar como suspeito (sem email ao lead nem aviso interno). Confirme antes.`);
        }
      }
    }

    // já inscrito? é repetição: a confirmação volta a sair (pode não ter chegado à primeira), o aviso interno não
    const jaTinha = await fetch(`${GHL}/contacts/${contactId}`, { headers }).then(r => r.json()).catch(() => null);
    const repetido = (jaTinha?.contact?.tags || []).includes(ETIQUETAS.registo);

    const tags = [ETIQUETAS.registo];
    const seg = segmento(resposta);
    if (seg) tags.push(seg);
    if (suspeito) tags.push(ETIQUETAS.suspeito);
    await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags }) }).catch(() => {});

    const nota = [repetido ? `Registo REPETIDO no webinar de ${EDICAO.curta} (já estava inscrito; aviso interno não repetido).` : `Registo no webinar de ${EDICAO.curta}.`,
      resposta ? `Onde diz que a aquisição falha: ${resposta}` : '',
      phone ? 'Deixou telemóvel para o lembrete por SMS.' : 'Sem telemóvel.',
      b.page ? `Página: ${b.page}` : ''].filter(Boolean).join('\n');
    await fetch(`${GHL}/contacts/${contactId}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: nota }) }).catch(() => {});

    // confirmação: a etiqueta dispara o workflow «🎥 Webinar · Inscrição confirmada» do GHL (suspeito: nem esta nem o aviso interno).
    // Em registo repetido volta a sair, porque pode não ter chegado à primeira.
    let mail = null;
    if (!suspeito) try {
      const st = await disparar(GHL, headers, contactId, ETIQUETAS.inscrito);
      mail = { status: st, via: 'ghl-workflow' };
      if (!(st >= 200 && st < 300)) mail.erro = 'etiqueta não entrou (' + st + ')';
    } catch (_) {}

    // aviso interno por email: só no primeiro registo de cada pessoa
    let aviso = repetido ? { saltado: 'registo repetido' } : null;
    if (!suspeito && !repetido) try {
      const upT = await fetch(`${GHL}/contacts/upsert`, {
        method: 'POST', headers, body: JSON.stringify({ locationId, email: AVISO_INTERNO, firstName: 'Vloom Marketing' }),
      }).then(r => r.json()).catch(() => null);
      const tId = upT?.contact?.id || upT?.id;
      if (tId) {
        const html = `<p><b>Registo novo · Webinar ${EDICAO.curta}</b></p>
<p>Nome: ${esc(nome) || '—'}<br>Email: ${esc(email) || '—'}<br>Telefone: ${esc(phone) || '—'}</p>
${resposta ? `<p>Onde diz que a aquisição falha: ${esc(resposta)}</p>` : ''}
${mail && mail.erro ? `<p style="color:#B3261E"><b>⚠️ A confirmação pode não ter saído:</b> ${esc(mail.erro)}.</p>` : ''}`;
        const envio = await fetch(`${GHL}/conversations/messages`, {
          method: 'POST', headers,
          body: JSON.stringify({ type: 'Email', contactId: tId, emailCc: AVISO_CC, subject: `Registo webinar: ${nome || email}`, html }),
        });
        aviso = { para: AVISO_INTERNO, cc: AVISO_CC, status: envio.status };
      }
    } catch (_) {}

    return res.status(200).json({ ok: true, contactId, repetido, mail, aviso });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
};
