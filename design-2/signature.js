/* Design 2 (Kiln) signature details.
   · Glaze: quote cards, ledger tiles and service cards catch a warm glow where the pointer is, with a soft lift.
   · Quote band: the four client quotes from "Who this is for" rotate in a band above that section
     (a decorative echo; the quotes themselves stay in the section for every reader). */
(function () {
  var root = document.documentElement;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (fine) {
    document.querySelectorAll('.sit, .ledger > div, .frame .cell, .tier, .prepared').forEach(function (el) {
      el.classList.add('k-glaze');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--gx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--gy', (e.clientY - r.top).toFixed(0) + 'px');
      });
    });
  }

  var quotes = [].map.call(document.querySelectorAll('.sits .sit blockquote'), function (q) { return q.textContent.trim(); });
  var who = document.querySelector('.sits') && document.querySelector('.sits').closest('section');
  if (quotes.length > 1 && who) {
    var band = document.createElement('div');
    band.className = 'k-quotes';
    band.setAttribute('aria-hidden', 'true');
    band.innerHTML = '<div class="wrap"><p class="k-quote"></p><span class="k-dots">' + quotes.map(function () { return '<i></i>'; }).join('') + '</span></div>';
    who.parentNode.insertBefore(band, who);
    var line = band.querySelector('.k-quote'), dots = band.querySelectorAll('.k-dots i'), i = 0, timer = 0;
    var show = function (n) {
      i = (n + quotes.length) % quotes.length;
      line.classList.remove('k-in'); void line.offsetWidth;
      line.textContent = quotes[i];
      line.classList.add('k-in');
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    };
    var tick = function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!root.classList.contains('motion-paused') && !document.hidden && !band.matches(':hover')) show(i + 1);
        tick();
      }, 5200);
    };
    show(0); tick();
  }
})();
