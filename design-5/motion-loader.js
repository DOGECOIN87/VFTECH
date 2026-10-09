/* Optional, local enhancement. The page and guide work if this module cannot load. */
(function () {
  'use strict';
  var script = document.currentScript || document.querySelector('script[data-vf-motion-suite]');
  if (!script || window.VFTechMotionLoader) return;
  var options;
  try { options = JSON.parse(script.dataset.motionOptions); } catch (_) { return; }
  var directory = new URL('.', script.src);
  var rootURL = /\/design-\d+\/$/.test(directory.pathname) ? new URL('../', directory) : directory;
  var moduleURL = new URL('assets/motion-suite.js', rootURL);
  moduleURL.search = new URL(script.src).search;
  var root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var api = null, loading = null, failed = false;
  function state() {
    if (reduce.matches) return 'reduced';
    if (navigator.connection && navigator.connection.saveData) return 'data-saver';
    if (root.classList.contains('motion-paused')) return 'paused';
    if (document.hidden) return 'hidden';
    return 'active';
  }
  function sync() {
    var next = state();
    root.dataset.vfMotionState = failed ? 'unavailable' : next;
    if (api) { api.setEnabled(next === 'active'); return; }
    if (next !== 'active' || loading || failed) return;
    root.dataset.vfMotionState = 'loading';
    loading = import(moduleURL.href).then(function (module) {
      api = module.install(options);
      window.VFTechMotion = api;
      sync();
    }).catch(function () { failed = true; root.dataset.vfMotionState = 'unavailable'; });
  }
  var observer = new MutationObserver(function (records) {
    if (records.some(function (r) { return r.attributeName === 'class'; })) sync();
  });
  observer.observe(root, {attributes:true, attributeFilter:['class']});
  reduce.addEventListener('change', sync);
  document.addEventListener('vftech:motion-change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  navigator.connection && navigator.connection.addEventListener('change', sync);
  window.VFTechMotionLoader = {sync:sync};
  sync();
})();
