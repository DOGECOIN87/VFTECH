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

  /* ---- footer pattern: a pause control for the drifting monograms (WCAG 2.2.2) ---- */
  var foot = document.querySelector('.site-foot');
  var motionBtn = document.querySelector('.motion-btn');
  function setPaused(paused) {
    if (!foot || !motionBtn) return;
    foot.classList.toggle('paused', paused);
    motionBtn.textContent = paused ? 'Resume motion' : 'Pause motion';
  }
  if (foot && motionBtn) {
    var saved = null;
    try { saved = localStorage.getItem('vftech-pattern'); } catch (e) {}
    setPaused(saved === 'paused');
    motionBtn.addEventListener('click', function () {
      var paused = !foot.classList.contains('paused');
      setPaused(paused);
      try { localStorage.setItem('vftech-pattern', paused ? 'paused' : 'moving'); } catch (e) {}
    });
  }

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
})();
