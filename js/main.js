/**
 * Soluciones Informáticas del Altiplano
 * Reloj, estado del nav y barra de progreso, menú móvil, preselección de servicio y formulario.
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var WA_NUMBER = '51951847320';

  // ── Reloj de Juliaca (UTC-5) ──
  function initClock() {
    var el = $('clock');
    if (!el) return;
    var fmt = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false });
    function tick() { el.textContent = fmt.format(new Date()) + ' Juliaca'; }
    tick();
    setInterval(tick, 10000);
  }

  // ── Scroll: fondo del nav y barra de progreso (un solo listener, 1 lectura por frame) ──
  function initScroll() {
    var nav = $('nav'), bar = $('progress');
    var max = 1, queued = false;
    function measure() { max = Math.max(1, document.documentElement.scrollHeight - innerHeight); }
    function update() {
      queued = false;
      if (nav) nav.classList.toggle('is-stuck', scrollY > 60);
      if (bar) bar.style.transform = 'scaleX(' + Math.min(1, scrollY / max) + ')';
    }
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', function () { measure(); update(); });
    addEventListener('load', measure);
    measure(); update();
  }

  // ── Menú móvil ──
  function initMobile() {
    var burger = $('burger'), menu = $('mobileMenu');
    if (!burger || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('open', open);
      menu.inert = !open;
      burger.classList.toggle('active', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) menu.querySelector('a').focus(); else if (menu.contains(document.activeElement)) burger.focus();
    }

    burger.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false); });
  }

  // ── Botones "Solicitar cotización" preseleccionan el servicio ──
  function initServiceLinks() {
    var select = $('fservice');
    if (!select) return;
    document.querySelectorAll('.card__link').forEach(function (link) {
      link.addEventListener('click', function () {
        var wanted = (link.dataset.service || '').toLowerCase();
        for (var i = 0; i < select.options.length; i++) {
          if (select.options[i].text.toLowerCase().indexOf(wanted) !== -1) { select.selectedIndex = i; break; }
        }
      });
    });
  }

  // ── Formulario: valida y prepara el mensaje para WhatsApp ──
  function initForm() {
    var form = $('contactForm'), status = $('formStatus');
    if (!form || !status) return;

    var f = { name: $('fname'), company: $('fcompany'), phone: $('fphone'), email: $('femail'), service: $('fservice'), msg: $('fmsg') };
    var rules = [
      [f.name,    function (v) { return v.length >= 3; },                          'err-name',    'Ingrese un nombre válido.'],
      [f.phone,   function (v) { return /^[+\d\s-]{7,15}$/.test(v); },             'err-phone',   'Ingrese un teléfono válido.'],
      [f.email,   function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },   'err-email',   'Ingrese un correo válido.'],
      [f.service, function (v) { return v !== ''; },                               'err-service', 'Seleccione un servicio.'],
      [f.msg,     function (v) { return v.length >= 10; },                         'err-msg',     'Describa su proyecto (mín. 10 caracteres).']
    ];
    rules.forEach(function (r) { r[0].setAttribute('aria-describedby', r[2]); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      var firstInvalid = null;
      rules.forEach(function (r) {
        var ok = r[1](r[0].value.trim());
        $(r[2]).textContent = ok ? '' : r[3];
        r[0].setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstInvalid) firstInvalid = r[0];
      });

      if (firstInvalid) {
        status.className = 'form-status error';
        status.textContent = 'Revise los campos marcados.';
        firstInvalid.focus();
        return;
      }

      var text =
        '*REQUERIMIENTO — SOLUCIONES INFORMÁTICAS DEL ALTIPLANO*\n' +
        '────────────────────────\n' +
        '*Contacto:* ' + f.name.value.trim() + '\n' +
        '*Empresa:* ' + (f.company.value.trim() || 'No especificada') + '\n' +
        '*Teléfono:* ' + f.phone.value.trim() + '\n' +
        '*Correo:* ' + f.email.value.trim() + '\n' +
        '*Servicio:* ' + f.service.value + '\n' +
        '*Detalle:*\n' + f.msg.value.trim() + '\n' +
        '────────────────────────\n' +
        '_Portal corporativo · Juliaca, 3,824 m s. n. m._';

      var link = document.createElement('a');
      link.className = 'btn btn--light';
      link.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Continuar a WhatsApp ↗';

      status.className = 'form-status success';
      var strong = document.createElement('strong');
      strong.textContent = 'Requerimiento validado.';
      status.append(strong, ' Se preparó el mensaje.', document.createElement('br'), link);
      f.msg.value = '';
    });
  }

  initClock();
  initScroll();
  initMobile();
  initServiceLinks();
  initForm();
})();
