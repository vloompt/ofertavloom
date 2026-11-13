/**
 * Simulador Vloom — oferta.vloom.pt/simulador/
 * Base: o plugin vloom-simulator 2.5.5 do marketing.vloom.pt (mesmas perguntas e mesmo envio).
 * Novo (12/11/2026): passo com orçamento + prazo, e 3 caminhos à saída:
 *   sistema       → calendário do Sistema Vloom (+500k com orçamento)
 *   chave-na-mao  → página do Sistema Vloom Chave na Mão com calendário
 *   nutricao      → página de obrigado, sem reunião
 * Quem decide o caminho é o /api/simulador/ (a regra vive num só sítio).
 * Com ?ensaio=1 no endereço não cria contacto nem envia emails: só mostra o caminho.
 */
(function () {
  'use strict';

  var root = document.getElementById('vloom-sim-root');
  if (!root) return;

  var $ = function (id) { return document.getElementById(id); };
  var step1 = $('vloom-step-1'), stepQ = $('vloom-step-q'), step2 = $('vloom-step-2');
  var slider = $('vloom-leads-slider'), leadsVal = $('vloom-leads-val'), leadsHid = $('vloom-leads');
  var selAtv = $('vloom-atividade'), selFat = $('vloom-faturamento');
  var selOrc = $('vloom-orcamento'), selPrz = $('vloom-prazo');
  var submitBtn = $('vloom-submit-btn');
  var params = new URLSearchParams(location.search);
  var ensaio = params.get('ensaio') === '1';

  /* ── Slider ── */
  function updateSlider() {
    var v = parseInt(slider.value, 10);
    leadsVal.textContent = v.toLocaleString('pt-PT');
    leadsHid.value = v;
    var pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = 'linear-gradient(to right,#8d489b ' + pct + '%,#EAECF0 ' + pct + '%)';
  }
  slider.addEventListener('input', updateSlider);
  updateSlider();

  [[selAtv, 'err-atividade'], [selFat, 'err-faturamento'], [selOrc, 'err-orcamento'], [selPrz, 'err-prazo']].forEach(function (p) {
    p[0].addEventListener('change', function () { hideErr(p[1]); p[0].classList.remove('vloom-input-error'); });
  });

  function mostra(passo) {
    [step1, stepQ, step2].forEach(function (s) { s.style.display = (s === passo) ? 'block' : 'none'; });
    passo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function exige(sel, err) {
    if (sel.value) return true;
    showErr(err); sel.classList.add('vloom-input-error'); return false;
  }

  /* ── Passo 1 → passo das 2 perguntas ── */
  $('vloom-next-btn').addEventListener('click', function () {
    var a = exige(selAtv, 'err-atividade'), b = exige(selFat, 'err-faturamento');
    if (a && b) mostra(stepQ);
  });
  $('vloom-back-q').addEventListener('click', function () { mostra(step1); });

  /* ── Passo das 2 perguntas → nome + email ── */
  $('vloom-next-q').addEventListener('click', function () {
    var a = exige(selOrc, 'err-orcamento'), b = exige(selPrz, 'err-prazo');
    if (a && b) mostra(step2);
  });
  $('vloom-back-btn').addEventListener('click', function () { mostra(stepQ); });

  /* ── Envio ── */
  submitBtn.addEventListener('click', function () {
    var nome = $('vloom-nome').value.trim();
    var email = $('vloom-email').value.trim();
    var valid = true;
    if (!nome) { showErr('err-nome'); $('vloom-nome').classList.add('vloom-input-error'); valid = false; }
    else { hideErr('err-nome'); $('vloom-nome').classList.remove('vloom-input-error'); }
    if (!email || !isValidEmail(email)) { showErr('err-email'); $('vloom-email').classList.add('vloom-input-error'); valid = false; }
    else { hideErr('err-email'); $('vloom-email').classList.remove('vloom-input-error'); }
    if (!valid) return;

    submitBtn.disabled = true;
    $('vloom-btn-label').textContent = 'A enviar…';
    $('vloom-spinner').style.display = 'block';
    hideErr('err-global');

    var corpo = {
      nome: nome, email: email,
      atividade: selAtv.value, faturamento: selFat.value, leads_mes: leadsHid.value,
      orcamento: selOrc.value, prazo: selPrz.value,
      ensaio: ensaio
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].forEach(function (k) {
      if (params.get(k)) corpo[k] = params.get(k);
    });

    fetch('/api/simulador/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.ok) throw new Error(data.erro || 'erro');
      if (ensaio) { mostraEnsaio(data); return; }
      try {  // Meta: Lead (pixel + CAPI, mesmo eventID para deduplicar)
        if (window.fbq && window.vloomFb) {
          var eid = window.vloomFb.id();
          window.fbq('track', 'Lead', { content_name: 'Simulador Vloom', caminho: data.caminho || '' }, { eventID: eid });
          window.vloomFb.capi({ eventName: 'Lead', eventId: eid, email: email, firstName: nome, contentName: 'Simulador Vloom' });
        }
      } catch (e) {}
      if (data.redirect) { setTimeout(function () { window.location.href = data.redirect; }, 400); return; }
      else showSuccess(nome);
    })
    .catch(function () {
      failSubmit('Ocorreu um erro. Por favor tente novamente.');
    });
  });

  /* ── Helpers ── */
  function mostraEnsaio(d) {
    var nomes = { 'sistema': 'Sistema Vloom (calendário +500k)', 'chave-na-mao': 'Sistema Vloom Chave na Mão', 'nutricao': 'Obrigado + nutrição, sem reunião' };
    root.innerHTML =
      '<div class="vloom-success">' +
        '<div class="vloom-success-check">✓</div>' +
        '<h2>Ensaio: ' + escapeHtml(nomes[d.caminho] || d.caminho) + '</h2>' +
        '<p>' + escapeHtml(d.porque || '') + '</p>' +
        '<p>Nada foi enviado: não se criou contacto nem saiu email.</p>' +
        '<p><a href="' + d.redirect + '" style="font-weight:700;color:#8d489b">Abrir a página de destino →</a></p>' +
      '</div>';
  }
  function showSuccess(nome) {
    root.innerHTML =
      '<div class="vloom-success"><div class="vloom-success-check">✓</div><h2>Resultado a caminho!</h2>' +
      '<p>Obrigado, ' + escapeHtml(nome) + '. Enviámos a sua estimativa de investimento para o seu email. Verifique também a pasta de spam.</p></div>';
  }
  function failSubmit(msg) {
    var g = $('err-global'); g.textContent = msg; g.style.display = 'block';
    submitBtn.disabled = false;
    $('vloom-btn-label').textContent = 'Receber resultado';
    $('vloom-spinner').style.display = 'none';
  }
  function showErr(id) { var el = $(id); if (el) el.classList.add('visible'); }
  function hideErr(id) { var el = $(id); if (el) el.classList.remove('visible'); }
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
})();
