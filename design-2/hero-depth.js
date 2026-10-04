/* VFTech hero depth: the studio reads as a space, not a flat backdrop.
   · Parallax. The pointer (on devices with a fine pointer) and the scroll position move each layer by
     an amount set by its distance from the viewer: the lattice floor and light far back, the chrome
     mark in the middle, the type in front. Values are eased here and handed to CSS as --px / --py
     (pointer, −1 → 1) and --sy (how far the hero has scrolled away, 0 → 1); the chrome mark reads the
     same eased pointer from stage.vftechTilt and tilts toward it in 3D (chrome-hero.js).
   · Dust in the key light. Motes on three depth planes drift up through the beam: far ones small and
     sharp, near ones larger, softer and faster under parallax. Each is lit by its distance from the mark.
   Everything stops offscreen, in a hidden tab and when motion is paused. */
(function () {
  var root = document.documentElement;
  var hero = document.querySelector('.hero--studio');
  if (!hero || !window.requestAnimationFrame) return;
  var stage = hero.querySelector('.chrome-stage');
  var canvas = hero.querySelector('.hero-dust');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var introPending = root.classList.contains('hero-intro-pending') && !root.classList.contains('motion-paused');

  /* ---- eased inputs ---- */
  var target = { x: 0, y: 0 }, cur = { x: 0, y: 0, s: 0 }, written = { x: 9, y: 9, s: 9 };
  function scrollProgress() {
    var r = hero.getBoundingClientRect();
    return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
  }
  if (finePointer) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      wake();
    });
    hero.addEventListener('pointerleave', function () { target.x = 0; target.y = 0; wake(); });
  }
  window.addEventListener('scroll', wake, { passive: true });

  function writeVars() {
    if (Math.abs(cur.x - written.x) > 0.0005) { hero.style.setProperty('--px', cur.x.toFixed(4)); written.x = cur.x; }
    if (Math.abs(cur.y - written.y) > 0.0005) { hero.style.setProperty('--py', cur.y.toFixed(4)); written.y = cur.y; }
    if (Math.abs(cur.s - written.s) > 0.0005) { hero.style.setProperty('--sy', cur.s.toFixed(4)); written.s = cur.s; }
    if (stage) stage.vftechTilt = { x: cur.x, y: cur.y };
  }

  /* ---- dust ---- */
  var W = 0, H = 0, dpr = 1, motes = [], sprite = null, light = { x: 0, y: 0, r: 300 };
  function makeSprite() {
    var c = document.createElement('canvas'), n = 64; c.width = c.height = n;
    var g = c.getContext('2d'), grad = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    grad.addColorStop(0, 'rgba(255,238,220,1)');
    grad.addColorStop(0.35, 'rgba(255,164,104,.55)');
    grad.addColorStop(1, 'rgba(255,128,64,0)');
    g.fillStyle = grad; g.fillRect(0, 0, n, n);
    return c;
  }
  function rand(seed) { var x = Math.sin(seed * 9301.17 + 49297.3) * 233280.7; return x - Math.floor(x); }
  function measure() {
    if (!canvas) return;
    var r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    var cs = getComputedStyle(hero);
    light.x = parseFloat(cs.getPropertyValue('--mark-x')) || W * 0.76;
    light.y = parseFloat(cs.getPropertyValue('--mark-y')) || H * 0.46;
    light.r = (parseFloat(cs.getPropertyValue('--mark-w')) || 540) * 0.62;
    var count = Math.round(Math.max(28, Math.min(84, (W * H) / 15000)));
    if (motes.length !== count) {
      motes = [];
      for (var i = 0; i < count; i++) {
        var z = Math.pow(rand(i + 1), 1.6);                       // most motes are far away
        motes.push({
          x: rand(i + 101), y: rand(i + 211), z: z,
          r: 0.7 + z * 3.4,
          v: 0.010 + z * 0.026,                                  // rise speed, in hero heights per second
          ph: rand(i + 307) * Math.PI * 2, sw: 4 + rand(i + 401) * 10,
          tw: 0.6 + rand(i + 503) * 1.4
        });
      }
    }
  }

  var clock = 0;
  function drawDust(fade) {
    if (!ctx || !W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!sprite) sprite = makeSprite();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i], depth = 4 + m.z * 30;
      var y = ((m.y - clock * m.v) % 1 + 1) % 1;
      var px = m.x * (W + 80) - 40 + Math.sin(clock * 0.35 * m.tw + m.ph) * m.sw - cur.x * depth;
      var py = y * (H + 80) - 40 - cur.y * depth * 0.7 + cur.s * H * 0.22 * m.z;
      var dx = px - light.x, dy = py - light.y;
      var lit = Math.exp(-(dx * dx + dy * dy) / (2 * light.r * light.r));
      var twinkle = 0.75 + 0.25 * Math.sin(clock * m.tw * 1.7 + m.ph * 3);
      var a = (0.07 + 0.3 * (1 - m.z * 0.4)) * (0.16 + 0.84 * lit) * twinkle * fade;
      if (a < 0.01) continue;
      var size = m.r * (m.z > 0.6 ? 5.2 : 3.6);                 // near motes are out of focus: larger, softer
      ctx.globalAlpha = Math.min(1, a * (m.z > 0.6 ? 0.8 : 1.4));
      ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---- loop ---- */
  var raf = 0, last = 0, lastDust = 0, visible = true, born = 0;
  function paused() { return root.classList.contains('motion-paused'); }
  function wake() { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0;
    var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    if (!born) born = now;
    var still = paused();
    var tx = still ? 0 : target.x, ty = still ? 0 : target.y, ts = still ? 0 : scrollProgress();
    var k = 1 - Math.exp(-dt * 4.2);                              // critically damped feel, frame-rate independent
    cur.x += (tx - cur.x) * k; cur.y += (ty - cur.y) * k; cur.s += (ts - cur.s) * Math.min(1, k * 2.2);
    writeVars();
    var settled = Math.abs(tx - cur.x) < 0.001 && Math.abs(ty - cur.y) < 0.001 && Math.abs(ts - cur.s) < 0.001;
    // the dust waits for the intro's rays to meet, then fades up with the mark
    var age = (now - born) / 1000, fade = introPending ? Math.max(0, Math.min(1, (age - 1.3) / 1.6)) : 1;
    if (canvas && (now - lastDust >= 1000 / 30 || dt === 0)) {
      if (!still) clock += (now - lastDust) / 1000 > 0.2 ? 1 / 30 : (now - lastDust) / 1000;
      drawDust(fade);
      lastDust = now;
    }
    if (visible && !document.hidden && (!still || !settled) && (canvas || !settled)) raf = requestAnimationFrame(frame);
  }

  measure();
  if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); wake(); }).observe(hero);
  else window.addEventListener('resize', function () { measure(); wake(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; }
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', wake);
  document.addEventListener('vftech:motion-change', wake);
  root.classList.add('hero-depth-ready');
  wake();
})();
