/* Design 1 (Drafting) signature details.
   · Measurement call-outs: hovering or focusing a card draws its dimensions around it, like a sheet annotation.
   · Show construction: a toggle in the footer (or the G key) overlays the 60° lattice and dashes every
     block's outline, so the page shows the grid it was drawn on. */
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

  /* ---- show construction ---- */
  var meta = document.querySelector('.foot-meta');
  var KEY = 'vftech-construction';
  var on = false;
  try { on = sessionStorage.getItem(KEY) === 'on'; } catch (e) {}
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'motion-btn d1-construct-btn';
  var set = function (v) {
    on = v;
    root.classList.toggle('d1-construction', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Hide construction' : 'Show construction';
    try { sessionStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
  };
  btn.addEventListener('click', function () { set(!on); });
  if (meta) meta.appendChild(btn);
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key !== 'g' && e.key !== 'G') return;
    if (e.metaKey || e.ctrlKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
    set(!on);
  });
  set(on);
})();
