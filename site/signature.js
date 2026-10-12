/* Design 1 (Drafting) signature details.
   · Measurement call-outs: hovering or focusing a card draws its dimensions around it, like a sheet annotation. */
(function () {
  var root = document.documentElement;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- call-outs: width along the top, height down the right, in the page's own pixels ---- */
  if (fine) {
    document.querySelectorAll('.frame .cell, .tier, .prepared dl > div').forEach(function (el) {
      var dim = document.createElement('span');
      dim.className = 'd1-dim';
      dim.setAttribute('aria-hidden', 'true');
      dim.innerHTML = '<i class="d1-dim-w"></i><i class="d1-dim-h"></i>';
      el.appendChild(dim);
      var show = function () {
        var r = el.getBoundingClientRect();
        dim.firstChild.setAttribute('data-v', Math.round(r.width));
        dim.lastChild.setAttribute('data-v', Math.round(r.height));
        el.classList.add('d1-measured');
      };
      var hide = function () { el.classList.remove('d1-measured'); };
      el.addEventListener('mouseenter', show);
      el.addEventListener('mouseleave', hide);
      el.addEventListener('focusin', show);
      el.addEventListener('focusout', hide);
    });
  }

})();
