(function () {
  'use strict';
  var C = window.HH_CONFIG || {};
  var MIN = 60000, DAY = 86400000;

  /* ---------- Próximo webinar (cada CYCLE_DAYS días) ---------- */
  function nextWebinar(now) {
    var anchor = new Date(C.WEBINAR_ANCHOR).getTime();
    var dur = (C.DURATION_MIN || 60) * MIN;
    var cycle = (C.CYCLE_DAYS || 15) * DAY;
    if (now < anchor + dur) return anchor;
    return anchor + (Math.floor((now - anchor - dur) / cycle) + 1) * cycle;
  }
  function fmtFecha(ts) {
    var d = new Date(ts);
    var dia = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' });
    var hora = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Bogota' });
    return dia.charAt(0).toUpperCase() + dia.slice(1) + ' · ' + hora + ' (hora Colombia)';
  }
  function gcalDate(ts) { return new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

  var target = nextWebinar(Date.now());
  var el = {
    fecha: document.getElementById('webinarFecha'),
    final: document.getElementById('finalFecha'),
    count: document.getElementById('countdown')
  };
  function paintFecha() {
    var t = fmtFecha(target);
    if (el.fecha) el.fecha.textContent = t;
    if (el.final) el.final.textContent = t + '.';
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var left = target - Date.now();
    if (left <= -(C.DURATION_MIN || 60) * MIN) { target = nextWebinar(Date.now()); paintFecha(); left = target - Date.now(); }
    if (left < 0) left = 0;
    var s = Math.floor(left / 1000);
    var v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
    for (var k in v) {
      var n = el.count && el.count.querySelector('[data-u="' + k + '"]');
      if (n) n.textContent = pad(v[k]);
    }
  }
  paintFecha(); tick(); setInterval(tick, 1000);

  /* ---------- Variante de titular (prueba A/B) y modo vista previa ----------
     Enlace del anuncio: ?v=a o ?v=b  ·  Vista previa de pendientes: ?preview=1 */
  var params = new URLSearchParams(location.search);
  var variant = (params.get('v') || '').toLowerCase();
  try { if (variant !== 'a' && variant !== 'b') variant = sessionStorage.getItem('hh_v') || 'a'; sessionStorage.setItem('hh_v', variant); } catch (e) { if (variant !== 'b') variant = 'a'; }
  var h1 = document.getElementById('h1');
  if (h1 && h1.getAttribute('data-' + variant)) h1.textContent = h1.getAttribute('data-' + variant);
  var preview = params.get('preview') === '1';
  if (preview) document.documentElement.classList.add('preview');

  /* ---------- Video (se activa con VIDEO_YOUTUBE_ID) ---------- */
  var vid = document.getElementById('video'), play = document.getElementById('videoPlay');
  if (vid) {
    if (C.VIDEO_ASPECT) vid.style.setProperty('--video-ratio', C.VIDEO_ASPECT);
    if (C.VIDEO_YOUTUBE_ID || preview) vid.hidden = false;
    if (play && C.VIDEO_YOUTUBE_ID) {
      vid.classList.add('has-video');
      play.addEventListener('click', function () {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(C.VIDEO_YOUTUBE_ID) + '?autoplay=1&rel=0&modestbranding=1';
        f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = 'Video de Elking Aspricha';
        play.replaceWith(f);
        track('ViewContent', { content_name: 'Video webinar', content_category: variant });
      });
    }
  }

  /* ---------- Atribución de pauta (UTM + fbclid + cookies de Meta) ---------- */
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'cid', 'fbclid'];
  function readCookie(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; }
  function attribution() {
    var out = {}, q = new URLSearchParams(location.search), saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('hh_attr') || '{}'); } catch (e) {}
    KEYS.forEach(function (k) { var v = q.get(k); if (v) saved[k] = v.trim(); });
    try { sessionStorage.setItem('hh_attr', JSON.stringify(saved)); } catch (e) {}
    KEYS.forEach(function (k) { out[k] = saved[k] || null; });
    out.fbp = readCookie('_fbp') || null;
    out.fbc = readCookie('_fbc') || (saved.fbclid ? 'fb.1.' + Date.now() + '.' + saved.fbclid : null);
    out.landing_url = location.origin + location.pathname;
    return out;
  }
  attribution();

  /* ---------- Meta Pixel (solo si hay ID) ---------- */
  function track(ev, data, id) {
    if (typeof window.fbq === 'function') window.fbq('track', ev, data || {}, id ? { eventID: id } : undefined);
  }
  if (C.META_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', C.META_PIXEL_ID);
    window.fbq('track', 'PageView');
    window.fbq('trackCustom', 'LandingVariant', { variante: variant });
  }

  /* ---------- Formularios ---------- */
  function setErr(form, msg) { var p = form.querySelector('.form-err'); p.textContent = msg; p.hidden = !msg; }
  function mark(node, bad) { if (node) node.classList.toggle('bad', !!bad); }

  function validate(form) {
    var f = form.elements, bad = null;
    ['nombre', 'correo', 'telefono'].forEach(function (n) { mark(f[n], false); });
    var nombre = f.nombre.value.trim();
    var correo = f.correo.value.trim();
    var tel = f.telefono.value.replace(/\D/g, '');
    if (nombre.length < 3) { mark(f.nombre, true); bad = bad || 'Escribe tu nombre completo.'; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) { mark(f.correo, true); bad = bad || 'Revisa tu correo electrónico.'; }
    if (tel.length < 7 || tel.length > 12) { mark(f.telefono, true); bad = bad || 'Revisa tu número de WhatsApp.'; }
    if (!f.perfil.value) bad = bad || 'Elige si eres emprendedor o empresario.';
    if (!f.consentimiento.checked) bad = bad || 'Debes autorizar el tratamiento de datos para continuar.';
    return bad;
  }

  function save(payload) {
    if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) return Promise.resolve({ demo: true });
    return fetch(C.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + (C.SUPABASE_TABLE || 'leads_webinar'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY, Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return {}; });
  }

  function onSubmit(ev) {
    ev.preventDefault();
    var form = ev.currentTarget, btn = form.querySelector('button[type=submit]');
    var msg = validate(form);
    setErr(form, msg || '');
    if (msg) return;

    var f = form.elements, eventId = 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    var payload = {
      nombre: f.nombre.value.trim(),
      correo: f.correo.value.trim().toLowerCase(),
      whatsapp: '+' + f.pais.value + f.telefono.value.replace(/\D/g, ''),
      perfil: f.perfil.value,
      webinar_fecha: new Date(target).toISOString(),
      consentimiento_datos: true,
      variante_titular: variant,
      event_id: eventId
    };
    var a = attribution(); for (var k in a) payload[k] = a[k];

    btn.disabled = true;
    var txt = btn.querySelector('.btn-txt'), old = txt.textContent; txt.textContent = 'Reservando…';
    save(payload).then(function (res) {
      track('Lead', { content_name: 'Webinar Seamos Rentables', status: payload.perfil, content_category: variant }, eventId);
      track('CompleteRegistration', { content_name: 'Webinar Seamos Rentables' }, eventId + '_cr');
      var card = form.closest('.card');
      form.hidden = true;
      var ok = card.querySelector('.ok'); ok.hidden = false;
      ok.querySelector('.ok-when').textContent = fmtFecha(target);
      if (res.demo) ok.querySelector('.demo').hidden = false;
      var cal = ok.querySelector('#addCal');
      if (cal) cal.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(C.WEBINAR_TITLE || 'Webinar') +
        '&dates=' + gcalDate(target) + '/' + gcalDate(target + (C.DURATION_MIN || 60) * MIN) +
        '&details=' + encodeURIComponent('El enlace de acceso llega por correo y WhatsApp.');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function () {
      setErr(form, 'No pudimos guardar tu registro. Intenta de nuevo en un momento.');
      btn.disabled = false; txt.textContent = old;
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.reg-form'), function (f) { f.addEventListener('submit', onSubmit); });

  /* ---------- Barra fija móvil ---------- */
  var sticky = document.getElementById('sticky');
  var forms = ['registro', 'registro2'].map(function (i) { return document.getElementById(i); }).filter(Boolean);
  if (sticky && 'IntersectionObserver' in window) {
    var vis = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      var any = forms.some(function (n) { return vis[n.id]; });
      sticky.classList.toggle('show', !any);
      sticky.setAttribute('aria-hidden', any ? 'true' : 'false');
    }, { threshold: 0.5 });
    forms.forEach(function (n) { io.observe(n); });
  }

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
