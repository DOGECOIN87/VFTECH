/* VFTech hero intro: three rays of light travel along the hero's borders, turn at 60° and meet at the
   corners of the mark's triangle while faint lattice triangles sweep in behind them and lock onto the
   lattice behind the 3D mark. The typography then rises in reading order (pure CSS, see styles.css, so
   the text appears on schedule even if this script never runs).
   Timeline (seconds):  rays 0.10 → 1.25 · triangles 0.15 → 1.20, fading 1.40 → 2.50 · meet 1.25 */
(function () {
  var root = document.documentElement;
  var hero = document.querySelector('.hero--studio');
  var canvas = hero && hero.querySelector('.hero-intro');
  var drawing = hero && hero.querySelector('.hero-drawing');
  if (!hero || !canvas || !drawing || !canvas.getContext) return;
  if (!root.classList.contains('hero-intro-pending') || root.classList.contains('motion-paused')) { canvas.remove(); return; }

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var R3 = Math.sqrt(3);
  var T_RAYS = [0.10, 1.25], T_MEET = 1.25, T_FADE = [1.40, 2.50], T_END = 2.7;
  var css = getComputedStyle(hero);
  var LIGHT = (css.getPropertyValue('--blueline') || '#FFFFFF').trim();

  // ---- geometry, measured once from the live layout ----
  var hr = hero.getBoundingClientRect(), W = hr.width, H = hr.height;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  var dr = drawing.getBoundingClientRect();
  var s = Math.min(dr.width / 1380, dr.height / 1300);                 // the drawing's viewBox is -190 -250 1380 1300
  var ox = dr.left - hr.left + (dr.width - 1380 * s) / 2 + 190 * s;
  var oy = dr.top - hr.top + (dr.height - 1300 * s) / 2 + 250 * s;
  function P(x, y) { return [ox + x * s, oy + y * s]; }               // drawing units → hero pixels
  var TL = P(0, 0), TR = P(1000, 0), BV = P(500, 866.03), C = P(500, 288.68);

  // the lattice behind the mark: side 125 units, rows 108.25 units, odd rows offset by half a side
  var L = 125 * s, RH = L * R3 / 2, cells = [];
  function rnd(i, j) { var x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); }
  for (var j = Math.floor(-oy / RH) - 1; j * RH + oy < H + RH; j++) {
    var y0 = oy + j * RH, y1 = y0 + RH, off0 = (((j % 2) + 2) % 2) * L / 2, off1 = (((j + 1) % 2 + 2) % 2) * L / 2;
    for (var i = Math.floor((-ox - L) / L) - 1; ox + i * L < W + L; i++) {
      var a = ox + off0 + i * L, b = ox + off1 + i * L;               // a: top-row point, b: bottom-row point
      // down-pointing (two on top) and up-pointing (two on the bottom)
      [[[a, y0], [a + L, y0], [b + (off1 > off0 ? 0 : L), y1]], [[b, y1], [b + L, y1], [a + (off0 > off1 ? 0 : L), y0]]]
        .forEach(function (tri, k) {
          var cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
          if (cx < -L || cx > W + L || cy < -L || cy > H + L) return;
          // the wave runs in from the nearest side edge toward the mark
          var f = cx < C[0] ? cx / Math.max(1, C[0]) : (W - cx) / Math.max(1, W - C[0]);
          f = Math.max(0, Math.min(1, f));
          var r = rnd(i * 2 + k, j);
          // faint far out, strongest where the wave converges on the mark
          var near = Math.max(0, 1 - Math.hypot(cx - C[0], cy - C[1]) / Math.max(W, H) * 1.6);
          cells.push({ p: tri, t: 0.15 + 0.92 * f + (r - 0.5) * 0.16, fill: r > 0.86, k: 0.5 + 0.5 * near });
        });
    }
  }

  // ---- three rays: along a border, then up or down a 60° construction line to a corner ----
  function path(points) {
    var segs = [], total = 0;
    for (var k = 1; k < points.length; k++) {
      var dx = points[k][0] - points[k - 1][0], dy = points[k][1] - points[k - 1][1], len = Math.hypot(dx, dy);
      segs.push({ a: points[k - 1], b: points[k], len: len, from: total }); total += len;
    }
    return { segs: segs, len: total, end: points[points.length - 1] };
  }
  function at(pt, d) {
    d = Math.max(0, Math.min(pt.len, d));
    for (var k = 0; k < pt.segs.length; k++) {
      var g = pt.segs[k];
      if (d <= g.from + g.len || k === pt.segs.length - 1) { var u = g.len ? (d - g.from) / g.len : 0; return [g.a[0] + (g.b[0] - g.a[0]) * u, g.a[1] + (g.b[1] - g.a[1]) * u]; }
    }
  }
  var e = 0.5; // half a pixel in, so the light sits on the border line
  // to TL, down-right at 60°: meets the top border at x = TL.x − TL.y/√3, otherwise run down the left edge
  var xa = TL[0] - (TL[1] - e) / R3;
  var rayA = path(xa >= 0 ? [[0, e], [xa, e], TL] : [[e, 0], [e, TL[1] - R3 * (TL[0] - e)], TL]);
  // to TR, down-left at 60°, from the right
  var xc = TR[0] + (TR[1] - e) / R3;
  var rayC = path(xc <= W ? [[W, e], [xc, e], TR] : [[W - e, 0], [W - e, TR[1] - R3 * (W - e - TR[0])], TR]);
  // to the bottom vertex, up-right at 60° from the bottom border
  var xb = BV[0] - (H - e - BV[1]) / R3;
  var rayB = path(xb >= 0 ? [[0, H - e], [xb, H - e], BV] : [[e, H], [e, BV[1] + R3 * (BV[0] - e)], BV]);
  var rays = [rayA, rayB, rayC];
  var TAIL = Math.max(120, Math.min(260, W * 0.18));

  function ease(x) { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function lerp(a, b, u) { return a + (b - a) * u; }

  function drawCells(t) {
    var fade = 1 - ease((t - T_FADE[0]) / (T_FADE[1] - T_FADE[0]));
    if (fade <= 0) return;
    ctx.lineWidth = 1;
    for (var k = 0; k < cells.length; k++) {
      var c = cells[k], u = t - c.t;
      if (u <= 0) continue;
      // a brief glint on arrival, settling to a faint line
      var a = u < 0.22 ? lerp(0, 0.26, u / 0.22) : lerp(0.26, 0.075, Math.min(1, (u - 0.22) / 0.55));
      a *= fade * c.k;
      if (a < 0.004) continue;
      ctx.beginPath(); ctx.moveTo(c.p[0][0], c.p[0][1]); ctx.lineTo(c.p[1][0], c.p[1][1]); ctx.lineTo(c.p[2][0], c.p[2][1]); ctx.closePath();
      ctx.globalAlpha = a; ctx.stroke();
      if (c.fill) { ctx.globalAlpha = a * 0.22; ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  function drawRay(ray, t) {
    var u = (t - T_RAYS[0]) / (T_RAYS[1] - T_RAYS[0]);
    if (u <= 0) return;
    var head = ray.len * (1 - Math.pow(1 - Math.min(1, u), 2.4));   // enters fast, settles into the corner
    var tail = u < 1 ? TAIL : TAIL * Math.max(0, 1 - (t - T_RAYS[1]) / 0.3);  // the tail is drawn into the corner
    // the faint trace the ray leaves along the border
    var trace = 0.22 * (1 - Math.max(0, Math.min(1, (t - 1.3) / 0.9)));
    if (trace > 0) {
      ctx.globalAlpha = trace; ctx.lineWidth = 1; ctx.beginPath();
      var p0 = at(ray, 0); ctx.moveTo(p0[0], p0[1]);
      for (var d = 8; d < head; d += 8) { var q = at(ray, d); ctx.lineTo(q[0], q[1]); }
      var ph = at(ray, head); ctx.lineTo(ph[0], ph[1]); ctx.stroke();
    }
    if (tail <= 0.5) return;
    // the light itself: a glowing streak, brightest at the head
    var steps = 18;
    for (var n = 0; n < steps; n++) {
      var d0 = head - tail * (1 - n / steps), d1 = head - tail * (1 - (n + 1) / steps);
      if (d1 < 0) continue;
      var pa = at(ray, Math.max(0, d0)), pb = at(ray, d1), w = (n + 1) / steps;
      ctx.globalAlpha = w * w; ctx.lineWidth = 1.2 + 2.2 * w;
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    }
    if (u < 1) {
      var hp = at(ray, head);
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(hp[0], hp[1], 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawMeet(t) {
    var u = (t - T_MEET) / 0.7;
    if (u < 0 || u > 1) return;
    [TL, TR, BV].forEach(function (v) {
      var r = 4 + 26 * ease(u);
      var g = ctx.createRadialGradient(v[0], v[1], 0, v[0], v[1], r);
      g.addColorStop(0, LIGHT); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.75 * (1 - u); ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(v[0], v[1], r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = LIGHT; ctx.globalAlpha = 1;
  }

  var t = 0, last = 0, met = false, raf = 0;
  function frame(now) {
    if (last) t += Math.min((now - last) / 1000, 0.05);   // background tabs don't skip ahead
    last = now;
    if (root.classList.contains('motion-paused')) t = T_END; // pausing ends the intro at once
    if (!met && t >= T_MEET) { met = true; root.dataset.introMet = '1'; document.dispatchEvent(new CustomEvent('vftech:intro-arrived')); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (t >= T_END) { if (!met) { met = true; root.dataset.introMet = '1'; document.dispatchEvent(new CustomEvent('vftech:intro-arrived')); } canvas.remove(); return; }
    ctx.strokeStyle = LIGHT; ctx.fillStyle = LIGHT; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    drawCells(t);
    ctx.shadowColor = LIGHT; ctx.shadowBlur = 18;
    rays.forEach(function (r) { drawRay(r, t); });
    rays.forEach(function (r) { drawRay(r, t); });   // a second pass deepens the glow
    ctx.shadowBlur = 0;
    drawMeet(t);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  // a layout change mid-intro would misalign the lattice, so finish early instead
  window.addEventListener('resize', function () { t = Math.max(t, T_END); }, { once: true });
})();
