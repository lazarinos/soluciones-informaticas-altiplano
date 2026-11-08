/**
 * Fondo animado (canvas 2D) en dos modos según el scroll:
 *  - HERO:  bloques metálicos isométricos flotando sobre agua + red neuronal.
 *  - RESTO: líneas de contorno suaves, que no compiten con el contenido.
 * Las capas estáticas (color base, sombra del texto, viñeta) viven en CSS (#bg y .veil).
 */
(function () {
  'use strict';

  var cv = document.getElementById('bg');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BLUE = '120,170,235';
  var LEVELS = 12;                       // niveles de brillo precalculados
  var W = 0, H = 0, DPR = 1, TW = 88, TH = 44;
  var mx = -999, my = -999, tx = -999, ty = -999, sy = 0;
  var cells = new Float32Array(0);       // por celda: lit, bob, alto, tono
  var cols = 0, rows = 0, running = false, lastFrame = 0;
  var ripples = [], nextDrop = 0, lastRipple = 0;

  // ── Utilidades ──
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(a, b, x) { x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x); }
  function hash(a, b) {
    var h = (a * 374761393 + b * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }
  function poly(x0, y0, x1, y1, x2, y2, x3, y3, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
    ctx.closePath(); ctx.fill();
  }

  // ── Tablas de color (se construyen una vez; evita crear strings por bloque y frame) ──
  var TOP = [], LEFT = [], RIGHT = [], EDGE = [];
  (function buildLUT() {
    for (var tone = 0; tone < 3; tone++) {
      TOP[tone] = []; LEFT[tone] = []; RIGHT[tone] = [];
      for (var i = 0; i < LEVELS; i++) {
        var lt = i / (LEVELS - 1), L = 24 + tone * 3 + lt * 16, S = 10 + lt * 8;
        TOP[tone][i] = 'hsl(214 ' + S + '% ' + L + '%)';
        LEFT[tone][i] = 'hsl(216 ' + (S - 2) + '% ' + L * 0.58 + '%)';
        RIGHT[tone][i] = 'hsl(220 ' + (S - 2) + '% ' + L * 0.38 + '%)';
      }
    }
    for (var e = 0; e < LEVELS; e++) EDGE[e] = 'rgba(215,230,250,' + (0.16 + e / (LEVELS - 1) * 0.32).toFixed(2) + ')';
  })();

  // ── Sprite del brillo de los pulsos (un solo gradiente, luego drawImage) ──
  var glow = document.createElement('canvas');
  glow.width = glow.height = 24;
  (function () {
    var g = glow.getContext('2d'), gr = g.createRadialGradient(12, 12, 0, 12, 12, 12);
    gr.addColorStop(0, 'rgba(' + BLUE + ',.9)'); gr.addColorStop(1, 'rgba(' + BLUE + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 24, 24);
  })();

  // ── Red neuronal ──
  var LAYERS = [3, 5, 6, 5, 3], nodes = [], edges = [], pulses = [], nextPulse = 0, nodePos = [];
  (function buildNet() {
    var byLayer = [];
    LAYERS.forEach(function (n, l) {
      byLayer[l] = [];
      for (var i = 0; i < n; i++) { nodes.push({ l: l, i: i, n: n, ph: Math.random() * 6 }); byLayer[l].push(nodes.length - 1); }
    });
    for (var l = 0; l < LAYERS.length - 1; l++)
      byLayer[l].forEach(function (a) { byLayer[l + 1].forEach(function (b) { if (Math.random() < 0.75) edges.push([a, b]); }); });
  })();

  // ── Tamaño ──
  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    TW = W < 700 ? 64 : (W > 1500 ? 104 : 88); TH = TW / 2;
    cols = Math.ceil(W / TW) + 2; rows = Math.ceil(H / (TH / 2)) + 3;
    cells = new Float32Array(cols * rows * 4);
    if (reduced) frame(0);
  }

  // ── Bloques ──
  function computeCells(t, off, shift) {
    var n = 0;
    for (var j = -1; j < rows - 1; j++) {
      for (var k = -1; k < cols - 1; k++, n += 4) {
        var cx = k * TW + ((j & 1) ? TW / 2 : 0), cy = j * (TH / 2) - off;
        var s = hash(k, j + shift);
        var wave = Math.sin(cx * 0.006 + cy * 0.011 - t * 0.7) * 0.5 + 0.5;
        wave *= wave; wave *= wave;
        var dx = cx - mx, dy = (cy - my) * 2, d = 1 - Math.sqrt(dx * dx + dy * dy) / 300;
        var near = d > 0 ? d * d : 0;
        var lit = Math.min(1, wave * 0.55 + near);
        cells[n] = lit;
        cells[n + 1] = Math.sin(t * 1.1 + s * 12) * 2.2;       // vaivén sobre el agua
        cells[n + 2] = 14 + s * 10 + lit * 22;                  // altura
        cells[n + 3] = (s * 3) | 0;                             // tono del metal
      }
    }
  }

  function drawBlocks(t) {
    var hw = TW * 0.43, hh = TH * 0.43;
    var period = TH * 2, off = (sy * 0.2) % period, shift = Math.floor(sy * 0.2 / period) * 2;

    if (!reduced && t > nextDrop) { nextDrop = t + 2.2; ripples.push({ x: Math.random() * W, y: H * (0.3 + Math.random() * 0.6), r: 0, a: 0.35 }); }
    computeCells(t, off, shift);

    // Agua bajo los bloques: halo y reflejo, un solo path por nivel de brillo
    for (var b = 0; b < 4; b++) {
      ctx.fillStyle = 'rgba(' + BLUE + ',' + (0.05 + b * 0.025).toFixed(3) + ')';
      ctx.beginPath();
      for (var j = -1, n = 0; j < rows - 1; j++) for (var k = -1; k < cols - 1; k++, n += 4) {
        if (Math.min(3, (cells[n] * 4) | 0) !== b) continue;
        var cx = k * TW + ((j & 1) ? TW / 2 : 0), cy = j * (TH / 2) - off + 2;
        ctx.moveTo(cx, cy - hh * 1.12); ctx.lineTo(cx + hw * 1.12, cy); ctx.lineTo(cx, cy + hh * 1.12); ctx.lineTo(cx - hw * 1.12, cy);
        ctx.closePath();
      }
      ctx.fill();

      ctx.fillStyle = 'rgba(150,185,235,' + (0.045 + b * 0.02).toFixed(3) + ')';
      ctx.beginPath();
      for (j = -1, n = 0; j < rows - 1; j++) for (k = -1; k < cols - 1; k++, n += 4) {
        if (Math.min(3, (cells[n] * 4) | 0) !== b) continue;
        cx = k * TW + ((j & 1) ? TW / 2 : 0); cy = j * (TH / 2) - off + cells[n + 2] - cells[n + 1];
        ctx.moveTo(cx, cy + hh * 0.2); ctx.lineTo(cx + hw, cy + hh * 1.2); ctx.lineTo(cx, cy + hh * 2.2); ctx.lineTo(cx - hw, cy + hh * 1.2);
        ctx.closePath();
      }
      ctx.fill();
    }

    // Ondas
    ctx.lineWidth = 1;
    for (var i = ripples.length - 1; i >= 0; i--) {
      var rp = ripples[i]; rp.r += 1.4; rp.a *= 0.985;
      if (rp.a < 0.01) { ripples.splice(i, 1); continue; }
      ctx.strokeStyle = 'rgba(170,205,250,' + (rp.a * 0.5).toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.5, 0, 0, 7); ctx.stroke();
    }

    // Bloques, de atrás hacia delante
    for (j = -1, n = 0; j < rows - 1; j++) {
      for (k = -1; k < cols - 1; k++, n += 4) {
        var x = k * TW + ((j & 1) ? TW / 2 : 0);
        if (x < -TW || x > W + TW) continue;
        var lit = cells[n], hgt = cells[n + 2], tone = cells[n + 3];
        var y = j * (TH / 2) - off + cells[n + 1];
        if (y < -hgt - TH || y > H + TH) continue;
        var lv = Math.round(lit * (LEVELS - 1));
        poly(x - hw, y - hgt, x, y + hh - hgt, x, y + hh, x - hw, y, LEFT[tone][lv]);
        poly(x + hw, y - hgt, x, y + hh - hgt, x, y + hh, x + hw, y, RIGHT[tone][lv]);
        poly(x, y - hh - hgt, x + hw, y - hgt, x, y + hh - hgt, x - hw, y - hgt, TOP[tone][lv]);
        ctx.strokeStyle = EDGE[lv];
        ctx.beginPath(); ctx.moveTo(x - hw, y - hgt); ctx.lineTo(x, y + hh - hgt); ctx.lineTo(x + hw, y - hgt); ctx.stroke();
        if (lit > 0.55) { ctx.fillStyle = 'rgba(' + BLUE + ',' + ((lit - 0.4) * 0.9).toFixed(2) + ')'; ctx.fillRect(x - 1.5, y - hgt - 1, 3, 3); }
      }
    }
  }

  function drawNet(t) {
    if (W < 900) return;
    var nw = Math.min(W * 0.38, 560), nh = Math.min(H * 0.56, 420);
    var ox = W - nw - Math.max(24, W * 0.06), oy = H * 0.5 - nh / 2 - sy * 0.1;
    var i, nd, p;
    for (i = 0; i < nodes.length; i++) {
      nd = nodes[i];
      nodePos[i] = [ox + (nd.l / (LAYERS.length - 1)) * nw, oy + ((nd.i + 0.5) / nd.n) * nh];
    }
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(200,215,235,.12)';
    ctx.beginPath();
    for (i = 0; i < edges.length; i++) {
      var a = nodePos[edges[i][0]], b = nodePos[edges[i][1]];
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();

    if (!reduced && t > nextPulse && pulses.length < 20) {
      nextPulse = t + 0.12;
      pulses.push({ e: edges[(Math.random() * edges.length) | 0], p: 0, v: 0.4 + Math.random() * 0.5 });
    }
    for (i = pulses.length - 1; i >= 0; i--) {
      var pu = pulses[i]; pu.p += pu.v * 0.016;
      if (pu.p >= 1) { pulses.splice(i, 1); continue; }
      var s0 = nodePos[pu.e[0]], s1 = nodePos[pu.e[1]];
      ctx.drawImage(glow, s0[0] + (s1[0] - s0[0]) * pu.p - 12, s0[1] + (s1[1] - s0[1]) * pu.p - 12);
    }
    for (i = 0; i < nodes.length; i++) {
      p = nodePos[i];
      var k = Math.sin(t * 1.4 + nodes[i].ph) * 0.5 + 0.5;
      ctx.fillStyle = '#0a0d13'; ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(210,222,240,' + (0.3 + k * 0.35).toFixed(2) + ')'; ctx.stroke();
      ctx.fillStyle = 'rgba(' + BLUE + ',' + (0.35 + k * 0.5).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 7); ctx.fill();
    }
  }

  function drawContours(t) {
    var gap = 34, count = Math.ceil(H / gap) + 4, off = (sy * 0.12) % gap;
    ctx.lineWidth = 1;
    for (var pass = 0; pass < 2; pass++) {          // un solo stroke por tipo de línea
      ctx.strokeStyle = pass ? 'rgba(170,195,230,.1)' : 'rgba(150,175,210,.05)';
      ctx.beginPath();
      for (var i = 0; i < count; i++) {
        if ((i % 5 === 0) !== !!pass) continue;
        var base = i * gap - off - gap;
        for (var x = -20; x <= W + 20; x += 40) {
          var y = base + Math.sin(x * 0.004 + t * 0.35 + i * 0.4) * 14 + Math.sin(x * 0.011 - t * 0.22 + i * 0.9) * 5;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }

  // ── Bucle ──
  function frame(ms) {
    running = false;
    var heroAmt = 1 - smooth(H * 0.25, H * 0.9, sy);          // 1 en el hero, 0 al bajar
    var calm = heroAmt < 0.5;
    if (!reduced && calm && ms - lastFrame < 33) { schedule(); return; }   // 30 fps en modo calmo
    lastFrame = ms;

    var t = ms / 1000;
    mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
    ctx.clearRect(0, 0, W, H);

    if (heroAmt > 0.04) { ctx.globalAlpha = heroAmt; drawBlocks(t); drawNet(t); }
    if (heroAmt < 0.96) { ctx.globalAlpha = 1 - heroAmt; drawContours(t); }
    ctx.globalAlpha = 1;
    if (!reduced) schedule();
  }
  function schedule() {
    if (running || document.hidden) return;
    running = true; requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  addEventListener('scroll', function () { sy = scrollY; }, { passive: true });
  addEventListener('pointermove', function (e) {
    tx = e.clientX; ty = e.clientY;
    var now = performance.now();
    if (now - lastRipple > 260 && sy < H * 0.8) { lastRipple = now; ripples.push({ x: tx, y: ty, r: 0, a: 0.5 }); }
  }, { passive: true });
  document.addEventListener('visibilitychange', schedule);

  resize();
  if (reduced) frame(0); else schedule();
})();
