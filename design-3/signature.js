/* Design 3 (Signal) signature details.
   · Poster headings: section headings grow to full size as they rise to the middle of the screen,
     so each one lands on the grid like a poster being set.
   · Counting figures: prices and figures count up from zero the first time they come into view. */
(function () {
  var root = document.documentElement;
  var still = function () { return root.classList.contains('motion-paused'); };

  /* ---- headings ---- */
  var heads = [].slice.call(document.querySelectorAll('.sect h2, .closing h2'));
  heads.forEach(function (h) { h.classList.add('s-scale'); });
  var queued = false;
  var scale = function () {
    queued = false;
    var vh = window.innerHeight;
    heads.forEach(function (h) {
      var r = h.getBoundingClientRect();
      // 0 when the heading's top is at the bottom edge, 1 once it reaches 45% of the way up
      var t = still() ? 1 : Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.55)));
      h.style.setProperty('--k', (0.86 + 0.14 * t).toFixed(4));
    });
  };
  var request = function () { if (!queued) { queued = true; requestAnimationFrame(scale); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  document.addEventListener('vftech:motion-change', request);
  scale();

  /* ---- counting figures ---- */
  if (!('IntersectionObserver' in window)) return;
  var targets = document.querySelectorAll('.tier .price, .sched .price, .prepared dd strong, .rx-stats strong');
  var count = function (el) {
    var nodes = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) if (/\d/.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
    if (!nodes.length || still()) return;
    var finals = nodes.map(function (n) { return n.nodeValue; });
    var start = performance.now(), dur = 950;
    (function step(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      nodes.forEach(function (n, i) {
        n.nodeValue = p >= 1 ? finals[i] : finals[i].replace(/\d[\d,]*/g, function (m) {
          var v = Math.round(parseInt(m.replace(/,/g, ''), 10) * e);
          return m.indexOf(',') >= 0 ? v.toLocaleString('en-US') : String(v);
        });
      });
      if (p < 1) requestAnimationFrame(step);
    })(start);
  };
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); count(en.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  targets.forEach(function (t) { io.observe(t); });
})();
