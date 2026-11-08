/**
 * Fondo en dos modos (canvas 2D):
 *  1) HERO: bloques metálicos isométricos 3D flotando sobre agua (ondas, reflejo, vaivén) + red neuronal.
 *  2) RESTO: líneas de contorno suaves, tipo olas, sin elementos que compitan con el contenido.
 * El paso entre modos depende del scroll.
 */
(function () {
  'use strict';
  var cv = document.getElementById('bg');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, DPR = 1, TW = 92, TH = 46;
  var mx = -999, my = -999, tx = -999, ty = -999, sy = 0;
  var B = '120,170,235';                    // azul frío, poco saturado
  var ripples = [], lastDrop = 0, lastMove = 0;

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    TW = W < 700 ? 64 : (W > 1500 ? 104 : 88); TH = TW / 2;
  }
  addEventListener('resize', resize); resize();
  addEventListener('pointermove', function (e) {
    tx = e.clientX; ty = e.clientY;
    var now = performance.now();
    if (now - lastMove > 260 && scrollY < innerHeight * 0.8) { lastMove = now; ripples.push({ x: e.clientX, y: e.clientY, r: 0, a: .5 }); }
  }, { passive: true });
  addEventListener('scroll', function () { sy = scrollY; }, { passive: true });

  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
  function smooth(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }

  // ── Red neuronal ──
  var layers = [3, 5, 6, 5, 3], net = { nodes: [], edges: [] }, pulses = [], lastP = 0;
  (function build() {
    var li = [];
    layers.forEach(function (n, l) {
      li[l] = [];
      for (var i = 0; i < n; i++) { net.nodes.push({ l: l, i: i, n: n, ph: Math.random() * 6 }); li[l].push(net.nodes.length - 1); }
    });
    for (var l = 0; l < layers.length - 1; l++)
      li[l].forEach(function (a) { li[l + 1].forEach(function (b) { if (Math.random() < 0.75) net.edges.push([a, b]); }); });
  })();
  function np(nd, ox, oy, w, h) { return [ox + (nd.l / (layers.length - 1)) * w, oy + ((nd.i + 0.5) / nd.n) * h]; }

  // ── Bloque isométrico ──
  function poly(pts, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fill();
  }

  function drawBlocks(t, alpha) {
    var hw = TW * 0.5 * 0.86, hh = TH * 0.5 * 0.86;        // medio tamaño con separación
    var period = TH * 2, off = (sy * 0.2) % period, shift = Math.floor(sy * 0.2 / period) * 2;
    var rows = Math.ceil(H / (TH / 2)) + 4, cols = Math.ceil(W / TW) + 2;

    // Ondas de agua que se expanden (elipses por perspectiva)
    if (!reduced && t - lastDrop > 2.2) { lastDrop = t; ripples.push({ x: Math.random() * W, y: H * (0.3 + Math.random() * 0.6), r: 0, a: .35 }); }
    for (var i = ripples.length - 1; i >= 0; i--) {
      var rp = ripples[i]; rp.r += 1.4; rp.a *= 0.985;
      if (rp.a < 0.01) { ripples.splice(i, 1); continue; }
    }

    // Pasada 1: agua bajo cada bloque (halo + reflejo)
    for (var j = -2; j < rows; j++) {
      for (var k = -1; k < cols; k++) {
        var cx = k * TW + ((j & 1) ? TW / 2 : 0), cy = j * (TH / 2) - off;
        var hs = hash(k, j + shift);
        var ph = Math.sin(cx * 0.006 + cy * 0.011 - t * 0.7) * 0.5 + 0.5;
        var dx = cx - mx, dy = (cy - my) * 2, near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 300);
        var lit = Math.min(1, Math.pow(ph, 4) * 0.55 + near * near);
        var h = 14 + hs * 10 + lit * 22;
        var bob = Math.sin(t * 1.1 + hs * 12) * 2.2;
        // halo del contacto con el agua
        ctx.fillStyle = 'rgba(' + B + ',' + (0.05 + lit * 0.07) + ')';
        ctx.beginPath(); ctx.ellipse(cx, cy + 2, hw * 1.12, hh * 1.12, 0, 0, 7); ctx.fill();
        // reflejo de la cara superior (espejo bajo la base)
        ctx.fillStyle = 'rgba(150,185,235,' + (0.045 + lit * 0.06) + ')';
        ctx.beginPath();
        ctx.moveTo(cx, cy + h - bob + hh * 0.2); ctx.lineTo(cx + hw, cy + h - bob + hh * 1.2);
        ctx.lineTo(cx, cy + h - bob + hh * 2.2); ctx.lineTo(cx - hw, cy + h - bob + hh * 1.2); ctx.closePath(); ctx.fill();
      }
    }

    // Ondas
    ctx.lineWidth = 1;
    ripples.forEach(function (rp) {
      ctx.strokeStyle = 'rgba(170,205,250,' + rp.a * 0.5 + ')';
      ctx.beginPath(); ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.5, 0, 0, 7); ctx.stroke();
    });

    // Pasada 2: bloques, de atrás hacia delante
    for (var j2 = -2; j2 < rows; j2++) {
      for (var k2 = -1; k2 < cols; k2++) {
        var x = k2 * TW + ((j2 & 1) ? TW / 2 : 0), y = j2 * (TH / 2) - off;
        var s = hash(k2, j2 + shift);
        var p = Math.sin(x * 0.006 + y * 0.011 - t * 0.7) * 0.5 + 0.5;
        var ddx = x - mx, ddy = (y - my) * 2, nr = Math.max(0, 1 - Math.sqrt(ddx * ddx + ddy * ddy) / 300);
        var lt = Math.min(1, Math.pow(p, 4) * 0.55 + nr * nr);
        var hgt = 14 + s * 10 + lt * 22;
        var yy = y + Math.sin(t * 1.1 + s * 12) * 2.2;                 // vaivén sobre el agua
        var L = 24 + s * 6 + lt * 16;                                  // luminosidad de la tapa
        var sat = 10 + lt * 8;
        var top = 'hsl(214 ' + sat + '% ' + L + '%)';
        var left = 'hsl(216 ' + (sat - 2) + '% ' + (L * 0.58) + '%)';
        var right = 'hsl(220 ' + (sat - 2) + '% ' + (L * 0.38) + '%)';
        // cara izquierda y derecha
        poly([x - hw, yy - hgt, x, yy + hh - hgt, x, yy + hh, x - hw, yy], left);
        poly([x + hw, yy - hgt, x, yy + hh - hgt, x, yy + hh, x + hw, yy], right);
        // tapa
        poly([x, yy - hh - hgt, x + hw, yy - hgt, x, yy + hh - hgt, x - hw, yy - hgt], top);
        // brillo metálico: aristas delanteras de la tapa
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(215,230,250,' + (0.16 + lt * 0.32) + ')';
        ctx.beginPath(); ctx.moveTo(x - hw, yy - hgt); ctx.lineTo(x, yy + hh - hgt); ctx.lineTo(x + hw, yy - hgt); ctx.stroke();
        // línea de flotación (donde toca el agua)
        ctx.strokeStyle = 'rgba(150,190,240,' + (0.1 + lt * 0.2) + ')';
        ctx.beginPath(); ctx.moveTo(x - hw, yy); ctx.lineTo(x, yy + hh); ctx.lineTo(x + hw, yy); ctx.stroke();
        if (lt > 0.55) { ctx.fillStyle = 'rgba(' + B + ',' + (lt - 0.4) * 0.9 + ')'; ctx.fillRect(x - 1.5, yy - hgt - 1, 3, 3); }
      }
    }
  }

  function drawNet(t) {
    if (W < 900) return;
    var nw = Math.min(W * 0.38, 560), nh = Math.min(H * 0.56, 420);
    var ox = W - nw - Math.max(24, W * 0.06), oy = H * 0.5 - nh / 2 - sy * 0.1;
    ctx.lineWidth = 1;
    net.edges.forEach(function (e) {
      var a = np(net.nodes[e[0]], ox, oy, nw, nh), b = np(net.nodes[e[1]], ox, oy, nw, nh);
      ctx.strokeStyle = 'rgba(200,215,235,.12)';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    });
    if (!reduced && t - lastP > 0.12 && pulses.length < 20) {
      lastP = t; pulses.push({ e: net.edges[(Math.random() * net.edges.length) | 0], p: 0, v: 0.4 + Math.random() * 0.5 });
    }
    for (var i = pulses.length - 1; i >= 0; i--) {
      var pu = pulses[i]; pu.p += pu.v * 0.016;
      if (pu.p >= 1) { pulses.splice(i, 1); continue; }
      var a2 = np(net.nodes[pu.e[0]], ox, oy, nw, nh), b2 = np(net.nodes[pu.e[1]], ox, oy, nw, nh);
      var px = a2[0] + (b2[0] - a2[0]) * pu.p, py = a2[1] + (b2[1] - a2[1]) * pu.p;
      var gr = ctx.createRadialGradient(px, py, 0, px, py, 12);
      gr.addColorStop(0, 'rgba(' + B + ',.85)'); gr.addColorStop(1, 'rgba(' + B + ',0)');
      ctx.fillStyle = gr; ctx.fillRect(px - 12, py - 12, 24, 24);
    }
    net.nodes.forEach(function (nd) {
      var p = np(nd, ox, oy, nw, nh), k = Math.sin(t * 1.4 + nd.ph) * 0.5 + 0.5;
      ctx.fillStyle = '#0a0d13'; ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(210,222,240,' + (0.3 + k * 0.35) + ')'; ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(' + B + ',' + (0.35 + k * 0.5) + ')'; ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 7); ctx.fill();
    });
  }

  // Modo calmo: líneas de contorno que ondulan suavemente
  function drawContours(t, alpha) {
    ctx.lineWidth = 1;
    var gap = 34, n = Math.ceil(H / gap) + 4, off = (sy * 0.12) % gap;
    for (var i = 0; i < n; i++) {
      var base = i * gap - off - gap;
      ctx.strokeStyle = 'rgba(' + (i % 5 === 0 ? '170,195,230,' + 0.1 : '150,175,210,' + 0.05) + ')';
      ctx.beginPath();
      for (var x = -20; x <= W + 20; x += 28) {
        var y = base + Math.sin(x * 0.004 + t * 0.35 + i * 0.4) * 14 + Math.sin(x * 0.011 - t * 0.22 + i * 0.9) * 5;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    var g = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, Math.max(W, H) * 0.6);
    g.addColorStop(0, 'rgba(' + B + ',.07)'); g.addColorStop(1, 'rgba(' + B + ',0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function frame(ms) {
    var t = ms / 1000;
    mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
    var hero = 1 - smooth(H * 0.25, H * 0.9, sy);          // 1 en el hero → 0 después
    ctx.globalAlpha = 1;
    // agua base
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1018'); bg.addColorStop(1, '#070a0f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    if (hero > 0.01) { ctx.globalAlpha = hero; drawBlocks(t); drawNet(t); ctx.globalAlpha = 1; }
    if (hero < 0.99) { ctx.globalAlpha = 1 - hero; drawContours(t); ctx.globalAlpha = 1; }

    // protege el texto (izquierda) y oscurece bordes
    var lg = ctx.createLinearGradient(0, 0, W * 0.75, 0);
    lg.addColorStop(0, 'rgba(8,10,15,' + (0.82 * hero) + ')'); lg.addColorStop(1, 'rgba(8,10,15,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    var base = Math.min(W, H);
    var g = ctx.createRadialGradient(W * 0.5, H * 0.5, base * 0.25, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    g.addColorStop(0, 'rgba(8,10,15,0)'); g.addColorStop(1, 'rgba(8,10,15,.8)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    if (!reduced && !document.hidden) requestAnimationFrame(frame);
  }
  if (reduced) frame(0); else requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduced) requestAnimationFrame(frame); });
})();
