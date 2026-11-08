/**
 * Efectos con GSAP + ScrollTrigger. Mejora progresiva: sin GSAP o con "reducir movimiento",
 * el contenido queda visible y estático. La entrada del hero se hace en CSS (.fade-up).
 */
(function () {
  'use strict';

  var finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Foco de luz bajo el cursor (solo CSS vars; no requiere GSAP)
  document.querySelectorAll('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  if (!window.gsap || !window.ScrollTrigger || reduced) return;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var EASE = 'expo.out';
  var once = function (trigger, start) { return { trigger: trigger, start: start || 'top 85%', once: true }; };

  // ── Hero: bloques del rack y paralaje con el cursor ──
  gsap.from('.unit', { opacity: 0, duration: 1.1, stagger: 0.14, delay: 0.4, ease: EASE });
  gsap.from('.unit__bar i', { scaleX: 0, duration: 1.4, stagger: 0.14, delay: 1, ease: EASE });
  gsap.from('.hero__stats', { y: 30, opacity: 0, duration: 0.9, delay: 1, ease: EASE });

  var rack = document.getElementById('rack');
  if (rack && finePointer) {
    var rotY = gsap.quickTo(rack, 'rotationY', { duration: 0.8, ease: 'power3' });
    var rotX = gsap.quickTo(rack, 'rotationX', { duration: 0.8, ease: 'power3' });
    addEventListener('pointermove', function (e) {
      if (scrollY > innerHeight) return;
      rotY((e.clientX / innerWidth - 0.5) * 10);
      rotX(-(e.clientY / innerHeight - 0.5) * 8);
    }, { passive: true });
  }

  // ── Revelados al entrar en vista ──
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: EASE, scrollTrigger: once(el) });
  });

  ['.about-grid', '.metrics'].forEach(function (sel) {
    var wrap = document.querySelector(sel);
    if (!wrap) return;
    gsap.from(wrap.children, {
      y: 70, scale: 0.92, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.12,
      scrollTrigger: once(wrap, 'top 82%')
    });
  });

  // ── Contadores ──
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10), suffix = el.dataset.suffix || '';
    var state = { v: 0 };
    function render(v) {
      var n = v.toFixed(dec);
      el.textContent = (end >= 1000 ? Number(n).toLocaleString('en-US') : n) + suffix;
    }
    gsap.to(state, {
      v: end, duration: 2, ease: 'power2.out',
      scrollTrigger: once(el, 'top 92%'),
      onUpdate: function () { render(state.v); },
      onComplete: function () { render(end); }
    });
  });

  // ── Tarjetas apiladas: la anterior se encoge y se oscurece (sin transparencia) ──
  gsap.matchMedia().add('(min-width:701px) and (min-height:701px)', function () {
    var cards = gsap.utils.toArray('.card');
    cards.forEach(function (card, i) {
      if (!cards[i + 1]) return;
      gsap.to(card, {
        scale: 0.95, '--dim': 0.5, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top 75%', end: 'top 20%', scrub: true }
      });
    });
  });

  // ── Footer ──
  gsap.from('.site-footer__word', { yPercent: 30, opacity: 0, duration: 1.4, ease: EASE, scrollTrigger: once('.site-footer') });

  // ── Botones magnéticos (rect cacheado al entrar, no en cada movimiento) ──
  if (finePointer) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
      var qy = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
      var r;
      btn.addEventListener('pointerenter', function () { r = btn.getBoundingClientRect(); });
      btn.addEventListener('pointermove', function (e) {
        if (!r) return;
        qx((e.clientX - r.left - r.width / 2) * 0.25);
        qy((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', function () { qx(0); qy(0); });
    });
  }
})();
