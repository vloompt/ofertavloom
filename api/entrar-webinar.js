// oferta.vloom.pt/webinar2026/entrar/ -> sala Zoom do webinar (link curto para os SMS)
module.exports = function handler(req, res) {
  const zoom = process.env.ZOOM_LINK_WEBINAR2026;
  res.setHeader('Cache-Control', 'no-store');
  if (!zoom) { res.statusCode = 302; res.setHeader('Location', 'https://oferta.vloom.pt/webinar2026/obrigado/'); return res.end(); }
  res.statusCode = 302; res.setHeader('Location', zoom); res.end();
};
