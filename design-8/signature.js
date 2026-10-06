/* Design 5 (Console) signature detail: cards tilt a few degrees toward the pointer, with a light sheen that follows it. */
(function () {
  if (!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
  var root = document.documentElement;
  document.querySelectorAll('.rx-service, .rx-support, .x-answer, .x-result, .sit, .tier').forEach(function (el) {
    el.classList.add('o-tilt');
    el.addEventListener('pointermove', function (e) {
      if (root.classList.contains('motion-paused')) return;
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((x - 0.5) * 6).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - y) * 5).toFixed(2) + 'deg');
      el.style.setProperty('--sx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--sy2', (y * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', function () { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
  });
})();
