/* VFTech hero schematic: the construction drawing behind the mark is drawn live, and always level.
   · The lattice is drawn as real lines (in place of the pattern fill), each growing outward from the
     line's point nearest the mark, in a wave that spreads from the mark to the edges.
   · A glowing pen tip rides the end of the outline as it draws (synced to the CSS mark-draw stroke).
   · The dimension lines draw, then their figures type in.
   · The framing (lattice, construction lines, dimensions, nodes) eases out to a slightly larger size.
     Only the framing scales, so the outline stays registered with the 3D mark it turns into.
   Nothing rotates. Paused motion shows the finished drawing at once. Without JS, the SVG is unchanged. */
(function () {
  var root = document.documentElement;
  var svg = document.querySelector('.hero-drawing');
  if (!svg || !svg.animate) return;
  var NS = 'http://www.w3.org/2000/svg';
  var sketch = svg.querySelector('.hero-sketch');
  var lattice = svg.querySelector('.schematic-lattice');
  var latRect = lattice && lattice.querySelector('rect');
  var construct = svg.querySelector('.construct');
  var dims = svg.querySelector('.schematic-dimensions');
  var nodes = svg.querySelector('.schematic-nodes');
  var paused = function () { return root.classList.contains('motion-paused'); };
  var withIntro = root.classList.contains('hero-intro-pending') && !paused();
  var T0 = withIntro ? 1.0 : 0.15;            // seconds: the intro's rays meet the corners at 1.25 s
  var EASE = 'cubic-bezier(.16,.84,.3,1)';
  var anims = [];
  function run(el, frames, opts) { var a = el.animate(frames, opts); anims.push(a); if (paused()) a.finish(); return a; }

  /* ---- framing groups: one behind the outline, one in front, so the drawing keeps its layer order ---- */
  function frameGroup(children, before) {
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'schematic-frame');
    svg.insertBefore(g, before);
    children.forEach(function (c) { if (c) g.appendChild(c); });
    return g;
  }
  var back = frameGroup([lattice, construct], sketch);
  var front = frameGroup([dims, nodes], sketch ? sketch.nextSibling : null);

  /* ---- the lattice as lines: side 125, rows 108.253, 60° diagonals, inside the viewBox ---- */
  var C = { x: 500, y: 380 };                  // the mark's optical centre, in drawing units
  var X0 = -190, X1 = 1190, Y0 = -250, Y1 = 1050, R3 = Math.sqrt(3), ROW = 108.253, SIDE = 125;
  function clipLine(x1, y1, x2, y2) {          // clip a long segment to the viewBox (Liang–Barsky)
    var dx = x2 - x1, dy = y2 - y1, t0 = 0, t1 = 1;
    var p = [-dx, dx, -dy, dy], q = [x1 - X0, X1 - x1, y1 - Y0, Y1 - y1];
    for (var i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return null; continue; }
      var r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
      else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
  }
  var lines = [];
  for (var y = Math.ceil(Y0 / ROW) * ROW; y <= Y1; y += ROW) lines.push(clipLine(X0, y, X1, y));
  var H = Y1 - Y0;
  for (var k = Math.floor((X0 - H / R3) / SIDE); k * SIDE <= X1 + H / R3; k++) {
    var x0 = k * SIDE;                         // both diagonals pass through (k·125, 0)
    lines.push(clipLine(x0 + (Y0) / R3, Y0, x0 + (Y1) / R3, Y1));
    lines.push(clipLine(x0 - (Y0) / R3, Y0, x0 - (Y1) / R3, Y1));
  }
  if (lattice && latRect) {
    var lg = document.createElementNS(NS, 'g');
    lg.setAttribute('class', 'lat lat-live');
    lg.setAttribute('mask', 'url(#latmask)');
    lg.setAttribute('opacity', '.6');
    var maxD = Math.hypot(X1 - C.x, Y1 - C.y);
    lines.forEach(function (l) {
      if (!l) return;
      // the point on the line nearest the mark's centre; the line grows outward from there both ways
      var vx = l[2] - l[0], vy = l[3] - l[1], len2 = vx * vx + vy * vy;
      var t = Math.max(0, Math.min(1, ((C.x - l[0]) * vx + (C.y - l[1]) * vy) / len2));
      var mx = l[0] + t * vx, my = l[1] + t * vy;
      var dist = Math.hypot(mx - C.x, my - C.y) / maxD;
      [[l[0], l[1]], [l[2], l[3]]].forEach(function (end) {
        if (Math.hypot(end[0] - mx, end[1] - my) < 1) return;
        var p = document.createElementNS(NS, 'line');
        p.setAttribute('x1', mx); p.setAttribute('y1', my); p.setAttribute('x2', end[0]); p.setAttribute('y2', end[1]);
        p.setAttribute('pathLength', '1');
        p.style.strokeDasharray = '1';
        lg.appendChild(p);
        run(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
          { duration: 900 + 500 * dist, delay: (T0 + 0.9 * dist) * 1000, easing: EASE, fill: 'both' });
      });
    });
    latRect.style.display = 'none';
    lattice.appendChild(lg);
  }

  /* ---- the framing eases out to a little larger, level the whole time ---- */
  [back, front].forEach(function (g) {
    g.style.transformBox = 'view-box';
    g.style.transformOrigin = C.x + 'px ' + C.y + 'px';
    run(g, [{ transform: 'scale(.9)' }, { transform: 'scale(1.06)' }],
      { duration: 2800, delay: T0 * 1000, easing: EASE, fill: 'both' });
  });

  /* ---- dimensions: the lines draw, then the figures type in ---- */
  if (dims) {
    var tDim = T0 + 1.0;
    dims.querySelectorAll('.dline').forEach(function (d, i) {
      d.setAttribute('pathLength', '1');
      d.style.strokeDasharray = '1';
      run(d, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: (tDim + i * 0.15) * 1000, easing: EASE, fill: 'both' });
    });
    dims.querySelectorAll('.dtext').forEach(function (txt, i) {
      var full = txt.textContent;
      if (paused()) return;
      txt.textContent = '';
      var n = 0, start = (tDim + 0.5 + i * 0.2) * 1000;
      setTimeout(function type() {
        if (paused()) { txt.textContent = full; return; }
        txt.textContent = full.slice(0, ++n);
        if (n < full.length) setTimeout(type, 70);
      }, start);
    });
  }

  /* ---- the pen: a glowing tip that rides the end of the outline while it draws ---- */
  if (sketch && sketch.getTotalLength) {
    var pen = document.createElementNS(NS, 'circle');
    pen.setAttribute('class', 'schematic-pen');
    pen.setAttribute('r', '10');
    pen.style.opacity = '0';
    svg.appendChild(pen);
    var total = sketch.getTotalLength(), born = performance.now();
    (function follow(now) {
      var off = parseFloat(getComputedStyle(sketch).strokeDashoffset);
      var drawing = !paused() && off > 0.002 && off < 0.998;
      if (drawing) {
        var pt = sketch.getPointAtLength((1 - off) * total);
        pen.setAttribute('cx', pt.x); pen.setAttribute('cy', pt.y);
      }
      pen.style.opacity = drawing ? '1' : '0';
      // keep following until the outline is finished (or give up after 8 s)
      if (now - born < 8000 && !(off <= 0.002 && now - born > 3000)) requestAnimationFrame(follow);
      else pen.remove();
    })(born);
  }

  document.addEventListener('vftech:motion-change', function () {
    if (paused()) anims.forEach(function (a) { a.finish(); });
  });
})();
