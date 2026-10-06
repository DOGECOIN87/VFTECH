/* Design 4 (Phosphor) signature details.
   · Command line: press "/" (or Ctrl/Cmd+K, or the ">_" button in the header) and type where you want to go:
     book, pricing, plans, calc, tiers, faq, process, about, theme, design 3, help… Arrow keys pick, Enter runs.
   · Boot sequence: the first page of each visit powers on like a console for about a second.
     Any key or click skips it; it never shows when motion is paused or reduced. */
(function () {
  var root = document.documentElement;

  /* ---- commands ---- */
  var go = function (href) { return function () { location.href = href; }; };
  var click = function (sel) { return function () { var el = document.querySelector(sel); if (el) el.click(); }; };
  var CMDS = [
    ['book',     'Book the free 30-minute conversation', go('contact.html')],
    ['home',     'The home page',                        go('index.html')],
    ['rebuilds', 'Website rebuilds',                     go('websites.html')],
    ['pricing',  'The five rebuild tiers and prices',    go('websites.html#tier-finder')],
    ['plans',    'Monthly plans',                        go('websites.html#plans')],
    ['calc',     'What renting costs you, next to owning', go('websites.html#cost')],
    ['tiers',    'Which tier fits? Three questions',     go('websites.html#tier-finder')],
    ['ai',       'AI integration',                       go('ai.html')],
    ['advisory', 'Advisory and fractional leadership',   go('advisory.html')],
    ['process',  'How we work: the seven steps',         go('process.html')],
    ['about',    'About Kevin and the firm',             go('about.html')],
    ['faq',      'Questions people ask before the call', go('index.html#faq')],
    ['theme',    'Switch light and dark',                click('.theme-btn')],
    ['motion',   'Pause or resume motion',               click('.motion-btn')],
    ['design 1', 'Open this page in design 1, Drafting', click('.ds-seg > :nth-child(1)')],
    ['design 2', 'Open this page in design 2, Kiln',     click('.ds-seg > :nth-child(2)')],
    ['design 3', 'Open this page in design 3, Signal',   click('.ds-seg > :nth-child(3)')],
    ['design 5', 'Open this page in design 5, Orbit',    click('.ds-seg > :nth-child(5)')],
    ['help',     'List every command',                   null]
  ];

  var dlg = document.createElement('div');
  dlg.className = 'p-cmd';
  dlg.hidden = true;
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  dlg.setAttribute('aria-label', 'Command line');
  dlg.innerHTML =
    '<div class="p-cmd-box">' +
      '<label class="p-cmd-line"><span aria-hidden="true">vftech@console:~$</span>' +
      '<input type="text" autocomplete="off" spellcheck="false" aria-label="Command" aria-controls="p-cmd-list" aria-autocomplete="list"></label>' +
      '<ul class="p-cmd-list" id="p-cmd-list" role="listbox"></ul>' +
      '<p class="p-cmd-msg" aria-live="polite">Type a command, or <b>help</b>. <span>↑↓ pick · Enter run · Esc close</span></p>' +
    '</div>';
  document.body.appendChild(dlg);
  var input = dlg.querySelector('input'), list = dlg.querySelector('.p-cmd-list'), msg = dlg.querySelector('.p-cmd-msg');
  var shown = [], sel = 0, opener = null;

  var render = function () {
    var q = input.value.trim().toLowerCase();
    shown = CMDS.filter(function (c) { return !q || c[0].indexOf(q) === 0 || c[1].toLowerCase().indexOf(q) >= 0; });
    if (q === 'help') shown = CMDS.slice();
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.map(function (c, i) {
      return '<li role="option" id="p-opt-' + i + '" aria-selected="' + (i === sel) + '"><b>' + c[0] + '</b><span>' + c[1] + '</span></li>';
    }).join('');
    input.setAttribute('aria-activedescendant', shown.length ? 'p-opt-' + sel : '');
    msg.innerHTML = shown.length ? 'Type a command, or <b>help</b>. <span>↑↓ pick · Enter run · Esc close</span>'
                                 : 'command not found: <b>' + q.replace(/[<&]/g, '') + '</b>. Type <b>help</b> for the list.';
  };
  var open = function (from) {
    opener = from || document.activeElement;
    dlg.hidden = false; root.classList.add('p-cmd-open');
    input.value = ''; sel = 0; render(); input.focus();
  };
  var close = function () {
    dlg.hidden = true; root.classList.remove('p-cmd-open');
    if (opener && opener.focus) opener.focus();
  };
  var run = function (c) {
    if (!c) return;
    if (!c[2]) { input.value = 'help'; render(); return; }
    close(); c[2]();
  };
  input.addEventListener('input', function () { sel = 0; render(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { sel = (sel + 1) % Math.max(1, shown.length); render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = (sel - 1 + shown.length) % Math.max(1, shown.length); render(); e.preventDefault(); }
    else if (e.key === 'Enter') {
      var q = input.value.trim().toLowerCase();
      run(CMDS.filter(function (c) { return c[0] === q; })[0] || shown[sel]); e.preventDefault();
    }
    else if (e.key === 'Escape') { close(); e.preventDefault(); }
    else if (e.key === 'Tab') { e.preventDefault(); }   // focus stays in the dialog while it is open
  });
  list.addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    run(shown[[].indexOf.call(list.children, li)]);
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

  // the header button
  var head = document.querySelector('.head-inner');
  var themeBtn = head && head.querySelector('.theme-btn');
  if (head) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'icon-btn p-cmd-btn';
    b.setAttribute('aria-label', 'Open the command line (press / )');
    b.innerHTML = '<span aria-hidden="true">&gt;_</span>';
    b.addEventListener('click', function () { open(b); });
    head.insertBefore(b, themeBtn || null);
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (!dlg.hidden) return;
    if ((e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) || ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K'))) {
      e.preventDefault(); open();
    }
  });

  /* ---- boot sequence ---- */
  var seen = false;
  try { seen = sessionStorage.getItem('vftech-booted') === '1'; sessionStorage.setItem('vftech-booted', '1'); } catch (e) { seen = true; }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!seen && !reduce && !root.classList.contains('motion-paused')) {
    var lines = ['VFTECH CONSOLE', 'mounting  ~/your-systems', 'code ........... yours', 'accounts ....... yours',
                 'data ........... yours', 'docs ........... yours', 'ready.'];
    var boot = document.createElement('div');
    boot.className = 'p-boot';
    boot.setAttribute('aria-hidden', 'true');
    boot.innerHTML = '<pre></pre>';
    document.body.appendChild(boot);
    var pre = boot.firstChild, i = 0, done = false;
    var finish = function () {
      if (done) return; done = true;
      boot.classList.add('p-boot-off');
      setTimeout(function () { boot.remove(); }, 450);
      document.removeEventListener('keydown', finish, true);
    };
    (function type() {
      if (done) return;
      if (i < lines.length) { pre.textContent += (i ? '\n' : '') + lines[i++]; setTimeout(type, i === 1 ? 260 : 120); }
      else setTimeout(finish, 260);
    })();
    boot.addEventListener('click', finish);
    document.addEventListener('keydown', finish, true);
  }
})();
