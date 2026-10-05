/* VFTech extras, shared by every design: the renting-vs-owning calculator, the tier finder,
   and the sticky "Book a free conversation" bar on phones. Each piece only runs if its markup is on the page. */
(function () {
  var root = document.documentElement;
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var num = function (el) { var v = parseFloat(el && el.value); return isFinite(v) && v > 0 ? v : 0; };

  /* ---- renting vs owning ---- */
  var calc = document.getElementById('cost-calc');
  if (calc) {
    var f = calc.elements;
    var hostingField = calc.querySelector('[data-when-self]');
    var barRent = calc.querySelector('.x-bar-rent span'), barOwn = calc.querySelector('.x-bar-own span');
    var update = function () {
      var years = parseInt(f.years.value, 10) || 3;
      var months = years * 12;
      var rentMonthly = num(f.platform) + num(f.apps);
      var self = f.keep.value === 'self';
      var keepMonthly = self ? num(f.hosting) : parseFloat(f.keep.value);
      var rebuild = parseFloat(f.tier.value);
      var rent = rentMonthly * months, own = rebuild + keepMonthly * months;
      hostingField.hidden = !self;
      document.getElementById('calc-years-out').textContent = years + (years === 1 ? ' year' : ' years');
      document.getElementById('calc-rent').textContent = money(rent);
      document.getElementById('calc-own').textContent = money(own);
      var max = Math.max(rent, own, 1);
      barRent.style.setProperty('--v', (rent / max).toFixed(3));
      barOwn.style.setProperty('--v', (own / max).toFixed(3));
      var span = years === 1 ? 'Over a year' : 'Over ' + years + ' years';
      var verdict;
      if (rent > own) {
        // the month the rebuild has paid for itself in saved rent
        var saving = rentMonthly - keepMonthly;
        var month = saving > 0 ? Math.ceil(rebuild / saving) : 0;
        verdict = span + ', owning costs ' + money(rent - own) + ' less' + (month ? ', and pays for itself in month ' + month + '.' : '.');
      } else if (own > rent) {
        verdict = span + ', owning costs ' + money(own - rent) + ' more, and you keep everything: the code, the accounts and the data.';
      } else {
        verdict = span + ', the two cost the same, and owning leaves you with everything.';
      }
      document.getElementById('calc-verdict').textContent = verdict;
    };
    calc.addEventListener('input', update);
    calc.addEventListener('change', update);
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    update();
  }

  /* ---- tier finder (tiers, prices and descriptions exactly as the Website rebuilds page states them) ---- */
  var finder = document.getElementById('tier-finder-form');
  if (finder) {
    var TIERS = {
      launch:   ['Launch', '$3,500 fixed', '1–3 pages, forms, mobile, analytics, hosting set up in your name.'],
      business: ['Business', '$7,500 – $14,000', '5–15 pages, content management, forms with routing, local search foundation.'],
      multi:    ['Multi-location', '$16,000 – $30,000', '20–150+ pages generated from a data-driven system, per-location search, galleries.'],
      migrate:  ['Platform migration', '$18,000 – $35,000', 'Full exit from a vendor-controlled platform at any scale, lead routing rebuilt and tested, monitored cutover.'],
      app:      ['Custom application', 'From $30,000, quoted', 'Portals, accounts, payments, dashboards, integrations.']
    };
    var pick = function () {
      var v = function (name) { var el = finder.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; };
      var kind = v('kind');
      finder.querySelectorAll('[data-for-kind]').forEach(function (q) {
        q.hidden = q.getAttribute('data-for-kind').split(' ').indexOf(kind) < 0;
      });
      var key;
      if (kind === 'app') key = 'app';
      else if (v('exit') === 'yes') key = 'migrate';
      else if (kind === 'many' || v('pages') === 'lots') key = 'multi';
      else key = v('pages') === 'some' ? 'business' : 'launch';
      var t = TIERS[key];
      document.getElementById('finder-name').textContent = t[0];
      document.getElementById('finder-price').textContent = t[1];
      document.getElementById('finder-desc').textContent = t[2];
    };
    finder.addEventListener('change', pick);
    finder.addEventListener('submit', function (e) { e.preventDefault(); });
    pick();
  }

  /* ---- phones: a booking bar that appears once the hero's own button has scrolled away ---- */
  var onContact = /contact\.html$/.test(location.pathname) || !!document.getElementById('book-form');
  if (!onContact && window.matchMedia) {
    var phone = matchMedia('(max-width: 760px)');
    var bar = document.createElement('div');
    bar.className = 'x-bookbar';
    bar.innerHTML = '<a href="contact.html">Book a free conversation <span aria-hidden="true">→</span></a><small>30 minutes · Free</small>';
    bar.hidden = true;
    document.body.appendChild(bar);
    // hide it again near the page's own closing call to action and the footer, where it would only repeat them
    var firstCta = document.querySelector('main .cta, main .rx-button');
    var endZone = document.querySelector('.closing, .rx-closing, .site-foot');
    var queued = false;
    var sync = function () {
      queued = false;
      var past = firstCta ? firstCta.getBoundingClientRect().bottom < 0 : window.scrollY > window.innerHeight * 0.8;
      var atEnd = endZone ? endZone.getBoundingClientRect().top < window.innerHeight : false;
      var show = phone.matches && past && !atEnd;
      if (bar.hidden === show) {
        bar.hidden = !show;
        root.classList.toggle('has-bookbar', show);
      }
    };
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(sync); } }, { passive: true });
    if (phone.addEventListener) phone.addEventListener('change', sync);
    sync();
  }
})();
