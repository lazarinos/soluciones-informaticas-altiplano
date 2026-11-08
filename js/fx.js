/**
 * FX — GSAP + ScrollTrigger. Mejora progresiva: sin GSAP, el contenido queda visible.
 */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // Foco de luz bajo el cursor (no requiere GSAP)
  document.querySelectorAll('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Barra de progreso de scroll
  var bar = document.getElementById('progress');
  function progress() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
  }
  addEventListener('scroll', progress, { passive: true });
  progress();

  if (!window.gsap || reduced) return;
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  var E = 'expo.out';

  // ── Hero: titular por líneas enmascaradas + bloques del rack ──
  var tl = gsap.timeline({ defaults: { ease: E } });
  tl.from('.nav__pill', { y: -30, opacity: 0, duration: 0.9 })
    .from('.unit', {
      x: 120, y: -40, rotateY: -35, opacity: 0, duration: 1.2, stagger: 0.14, ease: 'back.out(1.4)'
    }, 0.4)
    .from('.unit__bar i', { scaleX: 0, duration: 1.4, stagger: 0.14 }, 1)
    .from('.hero__stats', { y: 30, opacity: 0, duration: 0.9 }, 1);

  // Rack: flotación + paralaje con el cursor
  gsap.utils.toArray('.unit').forEach(function (u, i) {
    gsap.to(u, { y: '+=6', duration: 2.6 + i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 });
  });
  var rack = document.getElementById('rack');
  if (rack && fine) {
    var rx = gsap.quickTo(rack, 'rotationY', { duration: 0.8, ease: 'power3' });
    var ry = gsap.quickTo(rack, 'rotationX', { duration: 0.8, ease: 'power3' });
    addEventListener('pointermove', function (e) {
      rx((e.clientX / innerWidth - 0.5) * 10);
      ry(-(e.clientY / innerHeight - 0.5) * 8);
    });
  }

  if (!window.ScrollTrigger) return;
  var ST = { start: 'top 85%', once: true };

  // Reveals al entrar en vista
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    if (el.closest('.hero')) return;
    gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: E, scrollTrigger: Object.assign({ trigger: el }, ST) });
  });

  // Bloques en cascada (mosaico que se ensambla)
  ['.about-grid', '.metrics'].forEach(function (sel) {
    var wrap = document.querySelector(sel);
    if (!wrap) return;
    gsap.from(wrap.querySelectorAll('[data-stagger]'), {
      y: 70, scale: 0.92, opacity: 0, rotateX: -12, duration: 1.1, ease: E, stagger: 0.12,
      scrollTrigger: { trigger: wrap, start: 'top 82%', once: true }
    });
  });

  // Contadores
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.dec || '0', 10);
    var suffix = el.dataset.suffix || '';
    var o = { v: 0 };
    function fmt(v) {
      var s = v.toFixed(dec);
      return (end >= 1000 ? Number(s).toLocaleString('en-US') : s) + suffix;
    }
    gsap.to(o, {
      v: end, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: function () { el.textContent = fmt(o.v); },
      onComplete: function () { el.textContent = fmt(end); }
    });
  });

  // Tarjetas apiladas: la anterior se encoge y se oscurece al llegar la siguiente
  if (innerWidth > 700) {
    var cards = gsap.utils.toArray('.card');
    cards.forEach(function (card, i) {
      var next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.95, filter: 'brightness(0.5)', ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 75%', end: 'top 20%', scrub: true }
      });
    });
  }

  // Marquee reacciona a la velocidad de scroll
  var track = document.querySelector('.marquee__track');
  if (track) {
    window.ScrollTrigger.create({
      onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 400, 6);
        track.style.animationDuration = Math.max(10, 38 - v * 4) + 's';
      }
    });
  }

  // Footer: palabra gigante sube al aparecer
  gsap.from('.site-footer__word', {
    yPercent: 30, opacity: 0, duration: 1.4, ease: E,
    scrollTrigger: { trigger: '.site-footer', start: 'top 85%', once: true }
  });

  // Botones magnéticos
  if (fine) {
    document.querySelectorAll('.magnetic').forEach(function (b) {
      var qx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' });
      var qy = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.25);
        qy((e.clientY - r.top - r.height / 2) * 0.35);
      });
      b.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  }
})();
