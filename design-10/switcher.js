/* VFTech design switcher, shared by every design: one button, bottom left, that opens a menu of all the designs
   (the studio five and the SaaS five) with the light/dark toggle beside it. It replaces the bar site.js first builds,
   keeping that bar's theme button so the theme logic stays in one place. */
(function () {
  var old = document.querySelector('.design-switch');
  if (!old || old.classList.contains('ds-popup')) return;
  var root = document.documentElement;
  var theme = old.querySelector('.ds-theme');
  var cmp = old.querySelector('.ds-compare');
  var ROOT = cmp ? cmp.getAttribute('href').replace(/compare\.html$/, '') : '';
  var m = location.pathname.match(/\/design-(\d+)\//);
  var HERE = m ? parseInt(m[1], 10) : 3;
  var file = root.getAttribute('data-page') || location.pathname.split('/').pop();
  if (!/^[\w-]+\.html$/.test(file)) file = 'index.html';
  var page = file === 'index.html' ? '' : file;

  var GROUPS = [
    ['The studio five', [
      [1, 'Drafting', 'Blueprint lines on warm paper'],
      [2, 'Kiln', 'Warm clay and serif type'],
      [3, 'Signal', 'Loud grotesque on black'],
      [4, 'Phosphor', 'A terminal, with a command line'],
      [5, 'Mono', 'Soft light and rounded cards']
    ]],
    ['SaaS styles', [
      [6, 'Lumen', 'Midnight glow and bento features'],
      [7, 'Ledger', 'A dashboard shell: sidebar, stats, table'],
      [8, 'Console', 'A dark usage console'],
      [9, 'Pulse', 'Black panels, purple and lime'],
      [10, 'Mono', 'Black and white editorial']
    ]]
  ];
  var byN = {};
  GROUPS.forEach(function (g) { g[1].forEach(function (d) { byN[d[0]] = d; }); });
  function href(n) {
    if (n === 3) return (ROOT || './') + page;
    return ROOT + 'design-' + n + '/' + (page || 'index.html');
  }

  var bar = document.createElement('nav');
  bar.className = 'design-switch ds-popup';
  bar.setAttribute('aria-label', 'Design and theme');
  var here = byN[HERE] || [HERE, 'Design ' + HERE, ''];
  var html = '<button type="button" class="ds-trigger" aria-haspopup="true" aria-expanded="false" aria-controls="ds-menu">' +
    '<span class="ds-dot" aria-hidden="true"></span><span class="ds-cur"><b>' + HERE + '</b> ' + here[1] + '</span>' +
    '<span class="ds-count">of 10</span><i aria-hidden="true">▴</i></button>' +
    '<div class="ds-menu" id="ds-menu" role="menu" hidden>';
  GROUPS.forEach(function (g) {
    html += '<p class="ds-group">' + g[0] + '</p><ul>';
    g[1].forEach(function (d) {
      var inner = '<b>' + d[0] + '</b><span class="ds-t"><span class="ds-n">' + d[1] + '</span><span class="ds-d">' + d[2] + '</span></span>';
      html += '<li>' + (d[0] === HERE
        ? '<span class="ds-item" role="menuitem" aria-current="page">' + inner + '</span>'
        : '<a class="ds-item" role="menuitem" href="' + href(d[0]) + '" aria-label="Open this page in design ' + d[0] + ', ' + d[1] + '">' + inner + '</a>') + '</li>';
    });
    html += '</ul>';
  });
  html += '<a class="ds-all" role="menuitem" href="' + ROOT + 'compare.html">Compare all side by side <i aria-hidden="true">↗</i></a></div>';
  bar.innerHTML = html;
  if (theme) bar.appendChild(theme);
  old.parentNode.replaceChild(bar, old);

  var trigger = bar.querySelector('.ds-trigger'), menu = bar.querySelector('.ds-menu');
  function open(on) {
    menu.hidden = !on;
    trigger.setAttribute('aria-expanded', on ? 'true' : 'false');
    bar.classList.toggle('is-open', on);
    if (on) { var first = menu.querySelector('a.ds-item'); if (first) first.focus(); }
  }
  trigger.addEventListener('click', function () { open(menu.hidden); });
  document.addEventListener('click', function (e) { if (!menu.hidden && !bar.contains(e.target)) open(false); });
  bar.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { open(false); trigger.focus(); }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !menu.hidden) {
      var items = [].slice.call(menu.querySelectorAll('a'));
      var i = items.indexOf(document.activeElement);
      i = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
      items[i].focus(); e.preventDefault();
    }
  });
})();
