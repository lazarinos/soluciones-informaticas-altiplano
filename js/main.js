/**
 * Soluciones Informáticas del Altiplano
 * Entrance choreography, live clock, form dispatch
 */

(function () {
  'use strict';

  // ── LIVE CLOCK (Juliaca / PET / UTC-5) ──
  function initClock() {
    const el = document.getElementById('clock');
    if (!el) return;

    function tick() {
      const now = new Date();
      try {
        el.textContent = new Intl.DateTimeFormat('es-PE', {
          timeZone: 'America/Lima',
          hour: '2-digit', minute: '2-digit',
          hour12: false
        }).format(now) + ' Juliaca';
      } catch {
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const pet = new Date(utc - 5 * 3600000);
        el.textContent = String(pet.getHours()).padStart(2, '0') + ':' +
          String(pet.getMinutes()).padStart(2, '0') + ' Juliaca';
      }
    }

    tick();
    setInterval(tick, 10000);
  }

  // ── NAV SCROLL STATE ──
  function initNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── MOBILE MENU ──
  function initMobile() {
    const burger = document.getElementById('burger');
    const menu = document.getElementById('mobileMenu');
    if (!burger || !menu) return;

    function toggle() {
      const isOpen = menu.classList.toggle('open');
      burger.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function close() {
      menu.classList.remove('open');
      burger.classList.remove('active');
      document.body.style.overflow = '';
    }

    burger.addEventListener('click', toggle);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // ── ENTRANCE CHOREOGRAPHY ──
  function initAnimations() {
    const elements = document.querySelectorAll('.anim-in');

    // Force rest state visible after 3s regardless (craft rule)
    const fallbackTimer = setTimeout(() => {
      elements.forEach(el => el.classList.add('is-in'));
    }, 3000);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || '0', 10) * 120;
          setTimeout(() => el.classList.add('is-in'), delay);
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }

  // ── SERVICE LINK PRE-FILL ──
  function initServiceLinks() {
    const select = document.getElementById('fservice');
    if (!select) return;

    document.querySelectorAll('.card__link').forEach(link => {
      link.addEventListener('click', function () {
        const service = this.dataset.service;
        if (!service) return;
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].text.toLowerCase().includes(service.toLowerCase())) {
            select.selectedIndex = i;
            break;
          }
        }
      });
    });
  }

  // ── CONTACT FORM ──
  function initForm() {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (!form || !status) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear errors
      document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
      status.className = 'form-status';
      status.textContent = '';

      const name = document.getElementById('fname');
      const company = document.getElementById('fcompany');
      const phone = document.getElementById('fphone');
      const email = document.getElementById('femail');
      const service = document.getElementById('fservice');
      const msg = document.getElementById('fmsg');

      let valid = true;

      if (!name.value.trim() || name.value.trim().length < 3) {
        document.getElementById('err-name').textContent = 'Ingrese un nombre válido.';
        valid = false;
      }

      if (!phone.value.trim() || !/^[+\d\s-]{7,15}$/.test(phone.value.trim())) {
        document.getElementById('err-phone').textContent = 'Ingrese un teléfono válido.';
        valid = false;
      }

      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        document.getElementById('err-email').textContent = 'Ingrese un correo válido.';
        valid = false;
      }

      if (!service.value) {
        document.getElementById('err-service').textContent = 'Seleccione un servicio.';
        valid = false;
      }

      if (!msg.value.trim() || msg.value.trim().length < 10) {
        document.getElementById('err-msg').textContent = 'Describa su proyecto (mín. 10 caracteres).';
        valid = false;
      }

      if (!valid) {
        status.className = 'form-status error';
        status.textContent = 'Revise los campos marcados.';
        return;
      }

      const waText =
`*REQUERIMIENTO — SOLUCIONES INFORMÁTICAS DEL ALTIPLANO*
────────────────────────
*Contacto:* ${name.value.trim()}
*Empresa:* ${company.value.trim() || 'No especificada'}
*Teléfono:* ${phone.value.trim()}
*Correo:* ${email.value.trim()}
*Servicio:* ${service.value}
*Detalle:*
${msg.value.trim()}
────────────────────────
_Portal corporativo · Juliaca, 3,824 m s. n. m._`;

      const waUrl = `https://wa.me/51951847320?text=${encodeURIComponent(waText)}`;

      status.className = 'form-status success';
      status.innerHTML = `
        <strong>Requerimiento validado.</strong> Se preparó la transmisión.<br><br>
        <a href="${waUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#fff;color:#0a0a0a;padding:10px 20px;border-radius:999px;font-size:14px;font-weight:500;">
          Continuar a WhatsApp ↗
        </a>
      `;

      msg.value = '';
    });
  }

  // ── INIT ──
  document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initNavScroll();
    initMobile();
    initServiceLinks();
    initForm();
  });
})();
// Nav: fondo al hacer scroll
(function(){var n=document.getElementById('nav');if(!n)return;function f(){n.classList.toggle('is-stuck',scrollY>60)}addEventListener('scroll',f,{passive:true});f();})();
