// Candidatura da oferta "2 Semanas de Redes Grátis" (oferta.vloom.pt/redes-gratis).
// A LP manda DUAS vezes: fase "registo" (nome, empresa, email, telemóvel) e fase "candidatura"
// (respostas todas + resultado: aceite / recusado-faturacao / recusado-decisor / recusado-momento).
// Cria/atualiza o contacto no GHL da Vloom, deixa nota com as respostas e abre oportunidade no
// pipeline Venda só a quem é pré-aceite. Espelho do api/lead-10reunioes.js.
// Variáveis de ambiente no projeto Vercel: GHL_PIT, GHL_LOCATION_VLOOM
const GHL = 'https://services.leadconnectorhq.com';
const PIPELINE_VENDA = 'Un2h7k4hLMXrtz3t5MTe';
const STAGE_CHEGADA = '1938d5e5-3ff5-42b8-ade2-b06cc58b3bb6'; // "Chegada de Lead"
const ORIGENS_OK = ['oferta.vloom.pt', 'vloom.pt', 'vercel.app', 'surge.sh', 'localhost'];
const AVISO_INTERNO = process.env.GHL_AVISO_REDESGRATIS || 'marketing@vloom.pt';

const slug = s => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const esc = s => String(s || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

const ROTULO = {
  faturacao: 'Faturação anual',
  decisor: 'Quem decide o marketing',
  anuncios: 'Investimento mensal em anúncios',
  presenca: 'Instagram ou site',
  compromisso: 'Conversa de arranque de 30 minutos',
};

const RESULTADO = {
  aceite: 'PRÉ-ACEITE (foi para a marcação da conversa de arranque)',
  'recusado-faturacao': 'Fora de perfil pela faturação',
  'recusado-decisor': 'Quem respondeu não decide o marketing',
  'recusado-momento': 'Não quis a conversa de arranque agora',
};

async function ghlEmail(headers, contactId, subject, html) {
  try {
    const r = await fetch(`${GHL}/conversations/messages`, {
      method: 'POST', headers,
      body: JSON.stringify({ type: 'Email', contactId, subject, html }),
    });
    return { status: r.status };
  } catch (err) { return { erro: String(err) }; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const token = process.env.GHL_PIT;
  const locationId = process.env.GHL_LOCATION_VLOOM;
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  const origem = req.headers.origin || req.headers.referer || '';
  if (origem && !ORIGENS_OK.some(h => origem.includes(h))) {
    return res.status(403).json({ ok: false, error: 'origem não autorizada' });
  }
  const engodo = b.cx_ref || b.empresa_site;
  if (engodo) {
    console.warn('redes-gratis: descartado pela armadilha', { email: b.email || b.nome });
    return res.status(200).json({ ok: false, bot: true });
  }

  if (!token || !locationId) return res.status(200).json({ ok: false, skipped: 'sem credenciais' });

  const fase = b.fase === 'candidatura' ? 'candidatura' : 'registo';
  const nome = (b.firstName || b.nome || '').trim();
  const email = (b.email || '').trim();
  const phone = (b.phone || b.telemovel || b.telefone || '').trim();
  const empresa = (b.empresa || b.companyName || '').trim();
  if (!email && !phone) return res.status(400).json({ ok: false, error: 'sem contacto' });

  const resultado = (b.resultado || '').trim();
  const aceite = resultado === 'aceite';

  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid']
    .filter(k => b[k]).map(k => `${k}=${b[k]}`).join(' · ');

  const tags = ['redesgratis-candidatura', `redesgratis-${fase}`];
  if (resultado) tags.push('redesgratis-' + slug(resultado));
  if (b.utm_campaign) tags.push('camp-' + slug(b.utm_campaign));

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
  };

  try {
    const corpo = { locationId, source: b.source || '2 Semanas de Redes Grátis' };
    if (nome) corpo.firstName = nome;
    if (email) corpo.email = email;
    if (phone) corpo.phone = phone;
    if (empresa) corpo.companyName = empresa;

    const up = await fetch(`${GHL}/contacts/upsert`, {
      method: 'POST', headers, body: JSON.stringify(corpo),
    });
    const data = await up.json();
    const contactId = data?.contact?.id || data?.id;
    if (!up.ok || !contactId) return res.status(200).json({ ok: false, ghl: data });

    await fetch(`${GHL}/contacts/${contactId}/tags`, {
      method: 'POST', headers, body: JSON.stringify({ tags }),
    }).catch(() => {});

    // Nota só na fase final: na fase "registo" o contacto ainda não respondeu a nada de útil.
    if (fase === 'candidatura') {
      const respostas = Object.keys(ROTULO).filter(k => b[k]).map(k => `${ROTULO[k]}: ${b[k]}`);
      const nota = [
        'Candidatura a 2 Semanas de Redes Grátis (oferta.vloom.pt/redes-gratis).',
        `Resultado: ${RESULTADO[resultado] || resultado || 'sem resultado'}`,
        empresa ? `Empresa: ${empresa}` : '',
        ...respostas,
        utm ? `Campanha: ${utm}` : '',
        b.pagina ? `Página: ${b.pagina}` : '',
      ].filter(Boolean).join('\n');

      await fetch(`${GHL}/contacts/${contactId}/notes`, {
        method: 'POST', headers, body: JSON.stringify({ body: nota }),
      }).catch(() => {});
    }

    // Oportunidade só para quem é pré-aceite: o pipeline não se enche de quem ficou pelo caminho.
    if (aceite) {
      await fetch(`${GHL}/opportunities/upsert`, {
        method: 'POST', headers,
        body: JSON.stringify({
          locationId,
          pipelineId: PIPELINE_VENDA,
          pipelineStageId: process.env.GHL_STAGE_REDESGRATIS || STAGE_CHEGADA,
          contactId,
          name: `${nome || 'Lead'}${empresa ? ' · ' + empresa : ''} · Redes grátis`,
          status: 'open',
        }),
      }).catch(() => {});
    }

    // Aviso interno por email, só na candidatura fechada.
    let aviso = null;
    if (fase === 'candidatura') {
      try {
        const upT = await fetch(`${GHL}/contacts/upsert`, {
          method: 'POST', headers,
          body: JSON.stringify({ locationId, email: AVISO_INTERNO, firstName: 'Vloom Marketing' }),
        }).then(r => r.json()).catch(() => null);
        const tId = upT?.contact?.id || upT?.id;
        if (tId) {
          const linhas = Object.keys(ROTULO).filter(k => b[k])
            .map(k => `${esc(ROTULO[k])}: ${esc(b[k])}`).join('<br>');
          const html = `<p><b>Candidatura nova · 2 Semanas de Redes Grátis</b></p>
<p>Resultado: ${esc(RESULTADO[resultado] || resultado || 'sem resultado')}</p>
<p>Nome: ${esc(nome) || 'sem nome'}<br>Empresa: ${esc(empresa) || 'sem empresa'}<br>
Email: ${esc(email) || 'sem email'}<br>Telemóvel: ${esc(phone) || 'sem telemóvel'}</p>
${linhas ? `<p>${linhas}</p>` : ''}
${utm ? `<p>Campanha: ${esc(utm)}</p>` : ''}`;
          const envio = await ghlEmail(headers, tId, `Redes grátis · ${nome || email || phone}${aceite ? ' (pré-aceite)' : ''}`, html);
          aviso = { para: AVISO_INTERNO, ...envio };
        }
      } catch (_) {}
    }

    return res.status(200).json({ ok: true, contactId, fase, aceite, aviso });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err) });
  }
};
