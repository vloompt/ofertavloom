// EDIÇÃO EM CURSO do webinar: o único sítio do SITE onde a data vive.
// Os TEXTOS dos emails e SMS já não estão neste código: vivem no GHL, nos workflows «🎥 Webinar · …», e são
// disparados por etiquetas. A data e os links que esses textos mostram vêm dos valores personalizados do GHL
// (Webinar Data, Webinar Data Curta, Webinar Hora, Webinar Link Sala, Webinar Link Reuniao).
// Mudar de data ou adiar = correr ~/Claude/Vloom/webinar-estrutura/edicao.py (muda aqui, no GHL e nas páginas).
const EDICAO = {
  id: '2026-11',                    // entra nas etiquetas da edição: webinar-2026-11-registo, -sms, -quer-gravacao…
  inicio: '2026-11-11T21:00:00Z',   // 21h00 de Lisboa (em novembro Lisboa = UTC)
  curta: '11 de novembro',
  ativa: true,                     // false = entre edições (a data ainda não foi aprovada): o relógio fica parado
};
const E = (sufixo) => `webinar-${EDICAO.id}-${sufixo}`;
const ETIQUETAS = {
  registo: E('registo'), sms: E('sms'), querGravacao: E('quer-gravacao'), suspeito: E('suspeito'),
  // estas disparam os workflows do GHL e são iguais em todas as edições (tiram-se e voltam a pôr-se para redisparar)
  inscrito: 'webinar-inscrito',
  lembrete: { vespera: 'webinar-lembrete-vespera', hoje: 'webinar-lembrete-dia', hora: 'webinar-lembrete-1h' },
  smsLembrete: { vespera: 'webinar-sms-vespera', hora: 'webinar-sms-1h', abertura: 'webinar-sms-abrir' },
};
const T0 = Date.parse(EDICAO.inicio), H = 3600e3, M = 60e3;
// janelas relativas à hora do webinar (as mesmas da 1.ª edição, que estava às 21h00)
const JANELAS = {
  vespera: { de: T0 - 27 * H, ate: T0 - 23 * H, email: true, sms: true },      // véspera, 18h00–22h00
  hoje: { de: T0 - 9 * H, ate: T0 - 6 * H, email: true, sms: false },           // no dia, 12h00–15h00
  hora: { de: T0 - 60 * M, ate: T0 - 10 * M, email: true, sms: true },          // uma hora antes
  abertura: { de: T0 - 7 * M, ate: T0 + 10 * M, email: false, sms: true },      // sala aberta
};
// tira e volta a pôr a etiqueta: o gatilho «etiqueta adicionada» do GHL só dispara se ela não estiver lá
async function disparar(GHL, headers, contactId, etiqueta) {
  await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'DELETE', headers, body: JSON.stringify({ tags: [etiqueta] }) }).catch(() => null);
  const r = await fetch(`${GHL}/contacts/${contactId}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags: [etiqueta] }) }).catch(() => null);
  return r ? r.status : 0;
}
module.exports = { EDICAO, ETIQUETAS, JANELAS, disparar };
