/* VFTech logo motion (designs 6–10, the new vector logo). One choreography, drawn from the mark's geometry:
     1. the V rises out of its bottom point;
     2. one sweep runs right along the top line: it draws the F's top bar and carries on into the T's
        crossbar (the two share a line and parallel cuts), with a bright leading edge;
     3. the T's stem drops and the F's middle bar slides home on a spring;
     4. "ech" rises out of the baseline, letter by letter;
     5. a glint crosses the whole lockup at the angle of the logo's own cuts.
   Every frame is a pure function of time, frame(t): no state carries between frames, so the same code can be
   rendered frame-exact to video. The intro plays once per visit; hovering the logo replays the glint.
   Paused motion shows the finished logo. Markup: an inline lockup <svg data-logo-motion> whose six paths are,
   in order, V + top bar, F middle bar + stem, T, e, c, h (logo/vftech-vector-master.svg). */
(function () {
  var root = document.documentElement;
  var NS = 'http://www.w3.org/2000/svg';
  var INTRO = 1.95, GLINT = [1.3, 1.9];
  var KEY = 'vftech-logo-intro';
  var uid = 0;

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function outCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function outExpo(x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
  // a closed-form spring from 0 to 1 (underdamped): a pure function of time, it settles with a little weight
  function spring(t, w, z) {
    if (t <= 0) return 0;
    var wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function rig(svg) {
    if (svg.vftechLogo) return svg.vftechLogo;
    var p = svg.querySelectorAll('path');
    if (p.length !== 6) return null;
    var id = 'lgm' + (++uid), defs = el('defs', {}, null);
    svg.insertBefore(defs, svg.firstChild);
    // clip for the V and its top bar: the V rising from its point, and the bar sweeping right
    var cV = el('clipPath', { id: id + 'v', clipPathUnits: 'userSpaceOnUse' }, defs);
    var rRise = el('rect', { x: 40, width: 215 }, cV), rBar = el('rect', { x: 216, y: 55, height: 52 }, cV);
    // clip for the T: its crossbar continues the sweep, then its stem drops
    var cT = el('clipPath', { id: id + 't', clipPathUnits: 'userSpaceOnUse' }, defs);
    var rTop = el('rect', { x: 360, y: 55, height: 43.5 }, cT), rStem = el('rect', { x: 425, y: 97, width: 60 }, cT);
    // "ech" rises out of a slot whose floor is the baseline
    var cE = el('clipPath', { id: id + 'e', clipPathUnits: 'userSpaceOnUse' }, defs);
    el('rect', { x: 490, y: 30, width: 460, height: 223 }, cE);
    // the whole lockup, for the light that plays over it
    var cAll = el('clipPath', { id: id + 'a', clipPathUnits: 'userSpaceOnUse' }, defs);
    for (var i = 0; i < 6; i++) cAll.appendChild(p[i].cloneNode(true));
    var g = el('linearGradient', { id: id + 'g', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, g);
    el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.75 }, g);
    el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, g);

    // the glyphs keep their own transforms (font units), so each letter moves inside a wrapper group
    var letters = el('g', { 'clip-path': 'url(#' + id + 'e)' }, null), wrap = [];
    svg.insertBefore(letters, p[3]);
    for (var j = 3; j < 6; j++) { var w = el('g', {}, letters); w.appendChild(p[j]); wrap.push(w); }
    var light = el('g', { 'clip-path': 'url(#' + id + 'a)', 'pointer-events': 'none' }, svg);
    var pen = el('rect', { y: 55, width: 26, height: 52, fill: 'url(#' + id + 'g)' }, light);
    var glint = el('rect', { y: 20, width: 70, height: 260, fill: 'url(#' + id + 'g)', transform: '' }, light);
    p = [p[0], p[1], p[2], p[3], p[4], p[5]];
    return (svg.vftechLogo = { svg: svg, p: p, wrap: wrap, rRise: rRise, rBar: rBar, rTop: rTop, rStem: rStem, pen: pen, glint: glint, id: id });
  }

  function clipOn(r, on) {
    r.p[0].setAttribute('clip-path', on ? 'url(#' + r.id + 'v)' : '');
    r.p[2].setAttribute('clip-path', on ? 'url(#' + r.id + 't)' : '');
    if (!on) { r.p[0].removeAttribute('clip-path'); r.p[2].removeAttribute('clip-path'); }
  }

  // frame(t): every attribute below is computed from t alone
  function frame(r, t, glintOnly) {
    if (!glintOnly) {
      // 1. the V rises from its point (y 247) to the top line (y 63)
      var rise = outCubic(seg(t, 0, 0.45));
      var top = 250 - rise * 195;
      r.rRise.setAttribute('y', top.toFixed(2)); r.rRise.setAttribute('height', (252 - top).toFixed(2));
      // 2. one sweep from the V's right arm (x 216) to the end of the T's crossbar (x 545)
      var sx = 216 + outExpo(seg(t, 0.3, 0.8)) * 329;
      r.rBar.setAttribute('width', Math.max(0, Math.min(sx, 366) - 216).toFixed(2));
      r.rTop.setAttribute('width', Math.max(0, sx - 360).toFixed(2));
      var penOn = t > 0.3 && t < 0.86;
      r.pen.setAttribute('x', (sx - 20).toFixed(2));
      r.pen.setAttribute('opacity', penOn ? (0.9 * (1 - seg(t, 0.72, 0.86))).toFixed(3) : '0');
      // 3. the T's stem drops; the F's middle bar slides home on a spring
      var drop = outCubic(seg(t, 0.62, 0.95));
      r.rStem.setAttribute('height', (drop * 155).toFixed(2));
      var f = spring(t - 0.6, 16, 0.55);
      r.p[1].setAttribute('transform', 'translate(' + (-46 * (1 - f)).toFixed(2) + ' 0)');
      r.p[1].setAttribute('opacity', clamp((t - 0.6) / 0.12).toFixed(3));
      // 4. e, c, h rise out of the baseline, 70 ms apart
      for (var k = 0; k < 3; k++) {
        var s = spring(t - 0.82 - k * 0.07, 15, 0.6);
        r.wrap[k].setAttribute('transform', 'translate(0 ' + (215 * (1 - s)).toFixed(2) + ')');
      }
    }
    // 5. the glint, leaning at the cuts' angle, crosses from left to right
    var gt = glintOnly ? t : t - GLINT[0], gd = GLINT[1] - GLINT[0];
    var gx = 0 + outCubic(clamp(gt / gd)) * 1000;
    r.glint.setAttribute('x', (gx - 35).toFixed(2));
    r.glint.setAttribute('transform', 'skewX(-30)');
    r.glint.setAttribute('opacity', gt > 0 && gt < gd ? (0.55 * Math.sin(Math.PI * clamp(gt / gd))).toFixed(3) : '0');
  }

  function finish(r) {
    clipOn(r, false);
    r.p[1].removeAttribute('transform'); r.p[1].removeAttribute('opacity');
    for (var k = 0; k < 3; k++) r.wrap[k].removeAttribute('transform');
    r.pen.setAttribute('opacity', '0'); r.glint.setAttribute('opacity', '0');
    r.playing = false;
  }

  function play(r, glintOnly) {
    if (r.playing) return;
    r.playing = true;
    if (!glintOnly) clipOn(r, true);
    var dur = glintOnly ? GLINT[1] - GLINT[0] : INTRO, start = 0;
    frame(r, 0, glintOnly);
    root.classList.remove('logo-intro-pending');
    function tick(now) {
      if (!start) start = now;
      var t = (now - start) / 1000;
      if (root.classList.contains('motion-paused') || t >= dur) { finish(r); return; }
      frame(r, t, glintOnly);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var svgs = document.querySelectorAll('svg[data-logo-motion]');
  var paused = root.classList.contains('motion-paused');
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1'); } catch (e) {}
  svgs.forEach(function (svg) {
    var r = rig(svg);
    if (!r) return;
    if (!seen && !paused && svg.closest('.site-head')) play(r, false);
    var host = svg.closest('a') || svg;
    host.addEventListener('pointerenter', function () { if (!root.classList.contains('motion-paused')) play(r, true); });
    host.addEventListener('focus', function () { if (!root.classList.contains('motion-paused')) play(r, true); });
  });
  root.classList.remove('logo-intro-pending');
  window.vftechLogoFrame = function (svg, t) { var r = rig(svg); if (r) { clipOn(r, true); frame(r, t, false); } return r; };
})();
