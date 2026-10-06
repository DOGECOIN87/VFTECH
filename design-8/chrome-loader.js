// Loads the 3D mark (assets/chrome-hero.js, about 500 KB) only when its stage is near the screen,
// so the renderer never competes with the page's first paint. Until then the SVG drawing stands in.
const stage = document.querySelector('[data-chrome-hero]');
if (stage) {
  const stamp = new URL(import.meta.url).search;            // carry the deploy's ?v= stamp to the renderer
  const load = () => import('./assets/chrome-hero.js' + stamp);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: '400px 0px' });
    io.observe(stage);
  } else {
    load();
  }
}
