// Aviso interno no Telegram, SEMPRE com o banner da marca por cima (regra do Tiago: nenhuma
// mensagem chega sem cabeçalho). Na Vercel não há ficheiros locais do Mac, por isso o banner
// vai por URL (email/card-vloom.png, servido por este mesmo projeto).
// Legenda do Telegram ≤1024: cabe → uma mensagem; não cabe → banner e depois o texto.
// Se o banner falhar, vai só o texto: o aviso nunca se perde por causa da imagem. Nunca lança.
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
const CARTAO = 'https://oferta.vloom.pt/email/card-vloom.png';

async function chamar(bot, metodo, corpo) {
  const r = await fetch(`https://api.telegram.org/bot${bot}/${metodo}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: !!j.ok, status: r.status };
}

async function enviarTelegram(texto, { cartao = CARTAO } = {}) {
  const bot = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!bot || !chat) return null;
  const soTexto = () => chamar(bot, 'sendMessage', { chat_id: chat, text: texto, parse_mode: 'HTML', disable_web_page_preview: true });
  try {
    if (texto.length <= 1024) {
      const r = await chamar(bot, 'sendPhoto', { chat_id: chat, photo: cartao, caption: texto, parse_mode: 'HTML' });
      return r.ok ? r : await soTexto();
    }
    await chamar(bot, 'sendPhoto', { chat_id: chat, photo: cartao });
    return await soTexto();
  } catch (e) {
    try { return await soTexto(); } catch (e2) { return { ok: false, status: 'erro' }; }
  }
}

module.exports = { enviarTelegram };
