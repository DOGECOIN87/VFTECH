/* VFTech, shared behaviour: theme toggle, menu, copy buttons, contact form.
   Each page also carries a one-line inline script in <head> that applies a saved theme before paint. */
(function () {
  var root = document.documentElement;
  var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };

  /* ---- theme ---- */
  function current() { return root.getAttribute('data-theme') || (mqDark.matches ? 'dark' : 'light'); }
  var themeBtn = document.querySelector('.theme-btn');
  function labelTheme() {
    if (!themeBtn) return;
    var dark = current() === 'dark';
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (themeBtn) {
    labelTheme();
    themeBtn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('vftech-theme', next); } catch (e) {}
      labelTheme();
    });
    if (mqDark.addEventListener) mqDark.addEventListener('change', labelTheme);
  }

  /* ---- menu (under 1100px) ---- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      /* the nav comes before this button in the source, so move focus into it; otherwise Tab lands on the page underneath the open menu */
      var first = open && nav.querySelector('a');
      if (first) first.focus();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (menuBtn.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
    document.addEventListener('focusin', function (e) { /* tabbing out of the open menu closes it */
      if (menuBtn.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
  }

  /* ---- copy to clipboard, falling back to selecting the text ---- */
  function selectText(el) {
    try { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
  }
  function copyFrom(el, btn, idle) {
    var text = el.value !== undefined && el.tagName !== 'CODE' ? el.value : el.textContent;
    function say(t) { btn.textContent = t; setTimeout(function () { btn.textContent = idle; }, 2200); }
    function fallback() { selectText(el); say('Selected: press Ctrl+C'); }
    try {
      navigator.clipboard.writeText(text).then(function () { say('Copied'); }, fallback);
    } catch (e) { fallback(); }
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var idle = btn.textContent;
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-copy'));
      if (el) copyFrom(el, btn, idle);
    });
  });

  /* ---- shared motion: chrome hero, schematic figures and footer pattern ---- */
  var foot = document.querySelector('.site-foot');
  var motionButtons = document.querySelectorAll('.motion-btn, [data-motion-control]');
  root.classList.add('motion-controls-ready');
  function setPaused(paused) {
    root.classList.toggle('motion-paused', paused);
    if (foot) foot.classList.toggle('paused', paused);
    motionButtons.forEach(function (btn) {
      if (btn.hasAttribute('data-motion-icon')) {
        // icon toggle: a constant name, with the state carried by aria-pressed and the icon
        btn.setAttribute('aria-pressed', String(paused));
        btn.title = paused ? 'Resume motion' : 'Pause motion';
      } else {
        // text button: the label itself says what the next click does
        btn.textContent = paused ? 'Resume motion' : 'Pause motion';
        btn.removeAttribute('aria-pressed');
      }
    });
    document.dispatchEvent(new CustomEvent('vftech:motion-change'));
  }
  // A pause lasts for this visit only, so motion is back on the next one. (The old permanent
  // preference is cleared, so nobody stays stuck on a pause made while testing.)
  var savedMotion = null;
  try { localStorage.removeItem('vftech-pattern'); savedMotion = sessionStorage.getItem('vftech-motion'); } catch (e) {}
  setPaused(savedMotion === 'paused');
  motionButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var paused = !root.classList.contains('motion-paused');
      setPaused(paused);
      try { sessionStorage.setItem('vftech-motion', paused ? 'paused' : 'moving'); } catch (e) {}
    });
  });

  // Reveal the technical drawings when they enter the viewport. Content stays
  // fully visible without JS, and each diagram is animated only while in view.
  if ('IntersectionObserver' in window) {
    var diagrams = document.querySelectorAll('.hero-figure, .flowfig');
    var drawingObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('drawing-in-view', entry.isIntersecting);
        if (entry.isIntersecting) entry.target.classList.add('drawing-revealed');
      });
    }, { threshold: 0.12 });
    diagrams.forEach(function (diagram) {
      diagram.classList.add('drawing-motion');
      drawingObserver.observe(diagram);
    });
  }
  /* ---- scroll reveal: sheet content rises into place as it enters the viewport ----
     Rows of a list reveal one by one; otherwise each block reveals whole. Items entering together are
     staggered in reading order. Nothing is hidden until this runs, so content never depends on it. */
  if ('IntersectionObserver' in window) {
    var ROWS = '.ledger > div, .sits > .sit, .tier, .steps > li, .decl li, .frame .cell, .tours > *, .parts > *';
    var BLOCKS = '.page-head-grid > div > *, .page-head-grid > :not(div), .sect-aside > *, .sect-grid > :not(.sect-aside) > *, .closing-grid > *, .tblock, .foot-meta';
    var revealEls = [];
    document.querySelectorAll(ROWS).forEach(function (el) { if (!el.closest('.hero')) revealEls.push(el); });
    document.querySelectorAll(BLOCKS).forEach(function (el) {
      if (el.closest('.hero') || el.matches(ROWS) || el.querySelector(ROWS) || el.parentElement.closest(ROWS)) return;
      revealEls.push(el);
    });
    var revealObserver = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      batch.forEach(function (el, i) {
        el.style.setProperty('--rd', Math.min(i, 7) * 0.075 + 's');
        el.classList.add('in');
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { el.classList.add('reveal'); revealObserver.observe(el); });

    // the heavy rule over each list or table draws across from the left
    var ruleObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ruleObserver.unobserve(e.target); } });
    }, { threshold: 0.05 });
    document.querySelectorAll('.ledger, .sits, .tiers, .steps, .toc ul, .table-wrap').forEach(function (el) {
      el.classList.add('rule-draw'); ruleObserver.observe(el);
    });
    root.classList.add('reveal-ready');
  }

  /* ---- header: a soft shadow lifts it off the sheet once the page scrolls ---- */
  var head = document.querySelector('.site-head');
  if (head) {
    var syncHead = function () { head.classList.toggle('scrolled', window.scrollY > 4); };
    window.addEventListener('scroll', syncHead, { passive: true });
    syncHead();
  }

  /* ---- studio hero: aim the key light at the 3D mark, wherever the layout puts it ---- */
  var studio = document.querySelector('.hero--studio');
  var stage = studio && studio.querySelector('.chrome-stage');
  if (studio && stage) {
    var aimLight = function () {
      var h = studio.getBoundingClientRect(), s = stage.getBoundingClientRect();
      if (!s.width) return;
      studio.style.setProperty('--mark-x', (s.left - h.left + s.width / 2).toFixed(1) + 'px');
      studio.style.setProperty('--mark-y', (s.top - h.top + s.height * 0.48).toFixed(1) + 'px');  // the mark's optical centre
      studio.style.setProperty('--mark-w', s.width.toFixed(1) + 'px');
    };
    aimLight();
    if ('ResizeObserver' in window) { var aim = new ResizeObserver(aimLight); aim.observe(studio); aim.observe(stage); }
    else window.addEventListener('resize', aimLight);
  }

  function syncPageVisibility() { root.classList.toggle('page-hidden', document.hidden); }
  document.addEventListener('visibilitychange', syncPageVisibility);
  syncPageVisibility();

  /* ---- contact form: not connected to delivery yet, so compose the request and offer to copy it ---- */
  var form = document.getElementById('book-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var fd = new FormData(form);
      var lines = [
        'Request: free 30-minute conversation',
        'Name: ' + (fd.get('name') || ''),
        'Business: ' + (fd.get('business') || '—'),
        'Email: ' + (fd.get('email') || ''),
        'Phone: ' + (fd.get('phone') || '—'),
        'Topic: ' + (fd.getAll('topic').join(', ') || '—'),
        'Best times: ' + (fd.get('times') || '—'),
        '',
        "What's broken:",
        fd.get('message') || ''
      ];
      var out = document.getElementById('form-out');
      var pre = document.getElementById('form-text');
      pre.textContent = lines.join('\n');
      out.hidden = false;
      out.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      var focusTarget = document.getElementById('form-out-title');
      if (focusTarget) focusTarget.focus();
    });
  }

  /* ---- design switcher: the same page in the other design (published side by side) ---- */
  (function () {
    var file = location.pathname.split('/').pop() || 'index.html';
    var bar = document.createElement('nav');
    bar.className = 'design-switch';
    bar.setAttribute('aria-label', 'Site design');
    bar.innerHTML = '<span class="ds-label">Design</span>' +
      '<a href="' + file + '" aria-current="page">1 · Drafting</a>' +
      '<a href="../' + file + '">2 · Kiln</a>';
    document.body.appendChild(bar);
  })();
})();
