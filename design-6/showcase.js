/* Lumen (design 6): the live product window on the home page. Four tabs of working demos with made-up sample
   data: a dashboard that updates as you watch, charts you can re-range, a live order table you can sort and
   filter, and a customer account you can sign in to. Nothing here is a real customer, order or payment.
   Charts follow one system: one y-axis per chart (visits and leads are separate small multiples), thin marks,
   hairline grids, a crosshair or per-bar tooltip that is also reachable from the keyboard, and a table view.
   Live updates stop while motion is paused, the window is off screen, or the browser tab is hidden. */
(function () {
  var win = document.querySelector('[data-showcase]');
  if (!win) return;
  var root = document.documentElement;
  var NS = 'http://www.w3.org/2000/svg';
  var seed = 1009;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function $(sel) { return win.querySelector(sel); }
  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  // clean axis ticks: a 1-2-5 step, and a top that is a whole number of steps
  function scale(v, n) {
    var raw = v / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    var step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
    return { step: step, max: Math.ceil(v / step) * step };
  }
  // a column with a 4px rounded data end and a square foot on the baseline
  function colPath(x, y, w, base) {
    var r = Math.min(4, w / 2, (base - y) / 2);
    if (base - y < 0.5) return '';
    return 'M' + x + ' ' + base + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + base + 'Z';
  }

  /* ---------- tabs: WAI-ARIA tabs, arrow keys move between them ---------- */
  var tabs = [].slice.call(win.querySelectorAll('[role="tab"]'));
  var active = 'sc-tab-dash';
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    active = tab.id;
    if (focus) tab.focus();
    if (active === 'sc-tab-chart') drawCharts();
    if (active === 'sc-tab-dash') drawDash();
    if (active === 'sc-tab-data') drawRows();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, j = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      select(tabs[j], true);
    });
  });

  /* ---------- dashboard: three stat tiles and one area chart ---------- */
  var visitors = 1284, leads = 37, conv = 2.9;
  var halfHours = [];                                  // visitors per half hour, 48 points = 24 hours
  for (var i = 0; i < 48; i++) halfHours.push(Math.round(22 + 16 * Math.sin((i - 14) / 7.6) + rnd() * 9 + (i > 30 ? (i - 30) * 0.8 : 0)));
  var sparks = { visitors: [], leads: [], conv: [] };    // 12-point trends
  for (i = 0; i < 12; i++) { sparks.visitors.push(30 + rnd() * 30 + i * 3); sparks.leads.push(2 + rnd() * 4); sparks.conv.push(2.5 + rnd() * 0.8); }
  var hotArea = -1;

  function drawSpark(key) {
    var svg = $('svg[data-spark="' + key + '"]'), vals = sparks[key];
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = hi - lo || 1, pts = [];
    vals.forEach(function (v, k) { pts.push([3 + k / (vals.length - 1) * 94, 24 - (v - lo) / span * 20]); });
    el('polyline', { points: pts.map(function (p) { return p.join(','); }).join(' '), class: 'sp-line' }, svg);
    var last = pts[pts.length - 1];
    el('circle', { cx: last[0], cy: last[1], r: 2.6, class: 'sp-end' }, svg);
  }
  function drawArea() {
    var svg = $('.lm-area-svg');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 600, H = 380, L = 34, R = 8, T = 10, B = 26, n = halfHours.length;
    var sc = scale(Math.max.apply(null, halfHours) * 1.05, 4), max = sc.max;
    var x = function (k) { return L + k / (n - 1) * (W - L - R); }, y = function (v) { return T + (H - T - B) * (1 - v / max); };
    for (var gv = 0; gv <= max + 1e-9; gv += sc.step) {
      var gy = y(gv);
      el('line', { x1: L, x2: W - R, y1: gy, y2: gy, class: 'grid' }, svg);
      el('text', { x: L - 6, y: gy + 4, 'text-anchor': 'end', class: 'tick' }, svg, fmt(gv));
    }
    [['24h ago', 0], ['12h ago', 24], ['Now', n - 1]].forEach(function (t) {
      el('text', { x: x(t[1]), y: H - 6, 'text-anchor': t[1] === 0 ? 'start' : t[1] === n - 1 ? 'end' : 'middle', class: 'tick' }, svg, t[0]);
    });
    var line = halfHours.map(function (v, k) { return (k ? 'L' : 'M') + x(k).toFixed(1) + ' ' + y(v).toFixed(1); }).join('');
    el('path', { d: line + 'L' + x(n - 1) + ' ' + y(0) + 'L' + x(0) + ' ' + y(0) + 'Z', class: 'area' }, svg);
    el('path', { d: line, class: 'line' }, svg);
    if (hotArea >= 0) {
      el('line', { x1: x(hotArea), x2: x(hotArea), y1: T, y2: H - B, class: 'cross' }, svg);
      el('circle', { cx: x(hotArea), cy: y(halfHours[hotArea]), r: 4, class: 'dot' }, svg);
    }
    el('circle', { cx: x(n - 1), cy: y(halfHours[n - 1]), r: 4, class: 'dot' }, svg);
    var tip = $('.lm-area-box .lm-tip');
    if (hotArea >= 0) {
      var mins = (n - 1 - hotArea) * 30;
      tip.textContent = '';
      tip.appendChild(h('strong', null, fmt(halfHours[hotArea]) + ' visitors'));
      tip.appendChild(h('span', null, mins ? (mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60 ? '30m ' : '') : mins + 'm ') + 'ago' : 'Now'));
      tip.style.left = (x(hotArea) / W * 100).toFixed(2) + '%';
      tip.hidden = false;
    } else tip.hidden = true;
  }
  function drawDash() {
    $('[data-kpi="visitors"]').textContent = fmt(visitors);
    $('[data-kpi="leads"]').textContent = fmt(leads);
    $('[data-kpi="conv"]').textContent = conv.toFixed(1) + '%';
    Object.keys(sparks).forEach(drawSpark);
    drawArea();
  }
  var areaBox = $('.lm-area-box');
  function areaIndex(e) {
    var r = areaBox.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width * 600;
    return Math.max(0, Math.min(halfHours.length - 1, Math.round((fx - 34) / (558 / (halfHours.length - 1)))));
  }
  areaBox.addEventListener('pointermove', function (e) { var k = areaIndex(e); if (k !== hotArea) { hotArea = k; drawArea(); } });
  areaBox.addEventListener('pointerleave', function () { hotArea = -1; drawArea(); });
  areaBox.addEventListener('blur', function () { hotArea = -1; drawArea(); });
  areaBox.addEventListener('keydown', function (e) {
    var n = halfHours.length;
    if (e.key === 'ArrowRight') hotArea = hotArea < 0 ? n - 1 : Math.min(n - 1, hotArea + 1);
    else if (e.key === 'ArrowLeft') hotArea = hotArea < 0 ? n - 1 : Math.max(0, hotArea - 1);
    else return;
    e.preventDefault(); drawArea();
  });

  var NAMES = ['Avery Brooks', 'Sam Okafor', 'Priya Nair', 'Diego Morales', 'Hannah Lee', 'Marcus Webb', 'Lena Fischer', 'Tom Alvarez', 'Grace Kim', 'Noah Bennett', 'Ivy Chen', 'Omar Haddad'];
  var SOURCES = ['Contact form', 'Phone call', 'Site chat', 'Referral'];
  var NEEDS = ['Website rebuild', 'AI integration', 'Advisory', 'Support plan', 'Platform migration'];
  var feed = [], now = Date.now();
  for (i = 0; i < 5; i++) feed.push({ who: pick(NAMES), src: pick(SOURCES), need: pick(NEEDS), t: now - (i * 7 + 3) * 60000 - rnd() * 60000 });
  function ago(t) { var m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m + ' min ago'; }
  function drawFeed(fresh) {
    var ol = $('[data-feed]');
    ol.textContent = '';
    feed.forEach(function (f, k) {
      var li = h('li', fresh && k === 0 ? 'is-new' : null);
      li.appendChild(h('span', 'lm-avatar', f.who.split(' ').map(function (w) { return w[0]; }).join(''))).setAttribute('aria-hidden', 'true');
      var t = h('span'); t.appendChild(h('b', null, f.who)); t.appendChild(h('small', null, f.need + ' · ' + f.src)); li.appendChild(t);
      li.appendChild(h('time', null, ago(f.t)));
      ol.appendChild(li);
    });
  }

  /* ---------- charts: visits and leads as small multiples, one range filter above both ---------- */
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  function makeRange(n, base, swing) {
    var out = [];
    for (var k = 0; k < n; k++) {
      var v = base + swing * Math.sin(k / (n / 4)) + rnd() * swing * 0.8 + k * (base / n) * 0.4;
      out.push({ visits: Math.round(v), leads: Math.round(v * (0.024 + rnd() * 0.012)) });
    }
    return out;
  }
  var ranges = { 7: makeRange(7, 1100, 260), 30: makeRange(30, 1050, 300), 12: makeRange(12, 31000, 6000) };
  var range = '7', hot = -1;
  function label(k, long) {
    if (range === '7') return DAYS[k];
    if (range === '12') return MONTHS[k];
    return long ? 'Day ' + (k + 1) : String(k + 1);
  }
  var CW = 640, CL = 46, CR = 8, CT = 18, CB = 24;
  function drawMult(key) {
    var svg = $('[data-mult="' + key + '"]'), data = ranges[range], n = data.length, H = 128;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var vals = data.map(function (d) { return d[key]; });
    var sc = scale(Math.max.apply(null, vals) * 1.08, 2), max = sc.max;
    var slot = (CW - CL - CR) / n, bw = Math.min(24, slot - 6);
    var y = function (v) { return CT + (H - CT - CB) * (1 - v / max); }, base = y(0);
    for (var gv = 0; gv <= max + 1e-9; gv += sc.step) {
      var gy = y(gv);
      el('line', { x1: CL, x2: CW - CR, y1: gy, y2: gy, class: 'grid' }, svg);
      el('text', { x: CL - 6, y: gy + 4, 'text-anchor': 'end', class: 'tick' }, svg, gv >= 10000 ? fmt(gv / 1000) + 'k' : fmt(gv));
    }
    var peak = vals.indexOf(Math.max.apply(null, vals));
    vals.forEach(function (v, k) {
      var cx = CL + slot * k + slot / 2;
      if (k === hot) el('rect', { x: CL + slot * k, y: CT - 6, width: slot, height: base - CT + 6, class: 'band' }, svg);
      el('path', { d: colPath(+(cx - bw / 2).toFixed(1), +y(v).toFixed(1), +bw.toFixed(1), +base.toFixed(1)), class: 'col' + (k === hot ? ' hot' : '') }, svg);
      if (key === 'leads' && (range !== '30' || k % 5 === 0 || k === n - 1)) el('text', { x: cx, y: H - 6, 'text-anchor': 'middle', class: 'tick' }, svg, label(k));
    });
    // one selective direct label: the peak
    var px = CL + slot * peak + slot / 2;
    el('text', { x: px, y: y(vals[peak]) - 6, 'text-anchor': 'middle', class: 'peak' }, svg, vals[peak] >= 10000 ? (vals[peak] / 1000).toFixed(1) + 'k' : fmt(vals[peak]));
  }
  function drawCharts() {
    var data = ranges[range];
    drawMult('visits'); drawMult('leads');
    var tip = $('.lm-tip-card');
    if (hot >= 0 && data[hot]) {
      tip.textContent = '';
      tip.appendChild(h('p', 'tt-h', label(hot, true)));
      [['visits', 'Visits'], ['leads', 'Leads']].forEach(function (s) {
        var row = h('p', 'tt-r'); row.appendChild(h('i', 'k k-' + s[0])); row.appendChild(h('strong', null, fmt(data[hot][s[0]]))); row.appendChild(h('span', null, s[1])); tip.appendChild(row);
      });
      var slot = (CW - CL - CR) / data.length;
      tip.style.left = ((CL + slot * hot + slot / 2) / CW * 100).toFixed(2) + '%';
      tip.hidden = false;
    } else tip.hidden = true;
    var tv = data.reduce(function (s, d) { return s + d.visits; }, 0), tl = data.reduce(function (s, d) { return s + d.leads; }, 0);
    $('[data-chart-sum]').textContent = (range === '12' ? 'Last 12 months' : 'Last ' + range + ' days') + ': ' + fmt(tv) + ' visits and ' + fmt(tl) + ' leads. Sample data.';
    var tb = $('[data-chart-rows]');
    tb.textContent = '';
    data.forEach(function (d, k) {
      var tr = h('tr'); tr.appendChild(h('td', null, label(k, true))); tr.appendChild(h('td', 'num', fmt(d.visits))); tr.appendChild(h('td', 'num', fmt(d.leads))); tb.appendChild(tr);
    });
  }
  win.querySelectorAll('[data-range]').forEach(function (b) {
    b.addEventListener('click', function () {
      range = b.getAttribute('data-range'); hot = -1;
      win.querySelectorAll('[data-range]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      drawCharts();
    });
  });
  var mult = $('.lm-multiples');
  mult.addEventListener('pointermove', function (e) {
    var svg = $('[data-mult="visits"]'), r = svg.getBoundingClientRect(), n = ranges[range].length;
    var fx = (e.clientX - r.left) / r.width * CW, k = Math.floor((fx - CL) / ((CW - CL - CR) / n));
    k = k >= 0 && k < n ? k : -1;
    if (k !== hot) { hot = k; drawCharts(); }
  });
  mult.addEventListener('pointerleave', function () { hot = -1; drawCharts(); });
  mult.addEventListener('blur', function () { hot = -1; drawCharts(); });
  mult.addEventListener('keydown', function (e) {
    var n = ranges[range].length;
    if (e.key === 'ArrowRight') hot = hot < 0 ? 0 : Math.min(n - 1, hot + 1);
    else if (e.key === 'ArrowLeft') hot = hot < 0 ? n - 1 : Math.max(0, hot - 1);
    else return;
    e.preventDefault(); drawCharts();
  });

  /* ---------- live data: orders ---------- */
  var ITEMS = [['Website care, monthly', 750], ['Launch site deposit', 1166.67], ['Extra support hour', 150], ['Domain renewal', 24], ['Booking add-on', 480], ['Content migration', 900], ['Search tune-up', 360]];
  var STATUS = ['Paid', 'Paid', 'Paid', 'Pending', 'Refunded'];
  var orders = [], nextId = 2051;
  function newOrder() { var it = pick(ITEMS); return { id: nextId++, who: pick(NAMES), item: it[0], amt: it[1], status: pick(STATUS), fresh: true }; }
  for (i = 0; i < 9; i++) { var o = newOrder(); o.fresh = false; orders.unshift(o); }
  var sortKey = 'id', sortDir = -1, filter = '';
  function drawRows() {
    var rows = orders.filter(function (o) { return !filter || (o.who + ' ' + o.item).toLowerCase().indexOf(filter) >= 0; });
    rows.sort(function (a, b) { return (a[sortKey] > b[sortKey] ? 1 : a[sortKey] < b[sortKey] ? -1 : 0) * sortDir; });
    var tb = $('[data-rows]');
    tb.textContent = '';
    rows.forEach(function (o) {
      var tr = h('tr', o.fresh ? 'is-new' : null);
      tr.appendChild(h('td', null, '#' + o.id)); tr.appendChild(h('td', null, o.who)); tr.appendChild(h('td', null, o.item)); tr.appendChild(h('td', 'num', money(o.amt)));
      var td = h('td'); td.appendChild(h('span', 'lm-pill ' + (o.status === 'Paid' ? 'ok' : o.status === 'Pending' ? 'wait' : 'off'), o.status)); tr.appendChild(td);
      tb.appendChild(tr);
    });
    if (!rows.length) { var tr = h('tr'), td = h('td', 'lm-empty', 'No orders match “' + filter + '”.'); td.colSpan = 5; tr.appendChild(td); tb.appendChild(tr); }
    $('[data-count]').textContent = rows.length + ' of ' + orders.length + ' orders';
    orders.forEach(function (o) { o.fresh = false; });
    win.querySelectorAll('[data-sort]').forEach(function (b) {
      b.parentNode.setAttribute('aria-sort', b.getAttribute('data-sort') === sortKey ? (sortDir > 0 ? 'ascending' : 'descending') : 'none');
    });
  }
  win.querySelectorAll('[data-sort]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-sort');
      sortDir = k === sortKey ? -sortDir : (k === 'amt' || k === 'id' ? -1 : 1);
      sortKey = k; drawRows();
    });
  });
  $('[data-filter]').addEventListener('input', function (e) { filter = e.target.value.trim().toLowerCase(); drawRows(); });

  /* ---------- customer account ---------- */
  var signin = $('[data-signin]'), account = $('[data-account]');
  signin.addEventListener('submit', function (e) {
    e.preventDefault(); signin.hidden = true; account.hidden = false;
    var t = account.querySelector('h3'); t.setAttribute('tabindex', '-1'); t.focus();
  });
  $('[data-signout]').addEventListener('click', function () { account.hidden = true; signin.hidden = false; signin.querySelector('button').focus(); });
  $('[data-pay]').addEventListener('click', function (e) {
    var cell = e.target.parentNode;
    cell.textContent = '';
    cell.appendChild(h('span', 'lm-pill ok', 'Paid'));
    $('[data-pay-note]').textContent = 'Marked paid in the demo. No payment was taken.';
  });

  /* ---------- the live loop ---------- */
  var visible = false, timer = 0, tick = 0;
  function running() { return visible && !document.hidden && !root.classList.contains('motion-paused'); }
  function step() {
    tick++;
    visitors += Math.round(2 + rnd() * 9);
    halfHours.push(Math.max(6, Math.round(halfHours[halfHours.length - 1] + (rnd() - 0.47) * 8))); halfHours.shift();
    sparks.visitors.push(sparks.visitors[11] + (rnd() - 0.4) * 8); sparks.visitors.shift();
    if (tick % 3 === 0) {
      leads++;
      sparks.leads.push(Math.max(0, sparks.leads[11] + (rnd() - 0.4) * 2)); sparks.leads.shift();
      feed.unshift({ who: pick(NAMES), src: pick(SOURCES), need: pick(NEEDS), t: Date.now() }); feed.length = 5;
    }
    conv = Math.min(3.6, Math.max(2.3, conv + (rnd() - 0.5) * 0.12));
    sparks.conv.push(conv); sparks.conv.shift();
    if (active === 'sc-tab-dash') { drawDash(); drawFeed(tick % 3 === 0); }
    if (tick % 2 === 0) { orders.unshift(newOrder()); if (orders.length > 14) orders.pop(); if (active === 'sc-tab-data') drawRows(); }
  }
  function sync() {
    if (running() && !timer) timer = setInterval(step, 2400);
    else if (!running() && timer) { clearInterval(timer); timer = 0; }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { threshold: 0.1 }).observe(win);
  else visible = true;
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('vftech:motion-change', sync);

  drawDash(); drawFeed(false); drawRows(); drawCharts();
  sync();
})();
