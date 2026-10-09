/* Lumen (design 6) signature detail: glass cards catch the light. On devices with a mouse, a soft light
   follows the pointer around each card's edge, so the card nearest your hand reads as the one in focus. */
(function () {
  if (!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
  var root = document.documentElement;
  document.querySelectorAll('.lm-card, .lm-plan, .lm-checklist, .ledger, .tier, .cell, .callout, .lm-closing-card, .x-result, .x-answer, .form, .table-wrap').forEach(function (el) {
    el.classList.add('lm-glow');
    el.addEventListener('pointermove', function (e) {
      if (root.classList.contains('motion-paused')) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    });
  });
})();
