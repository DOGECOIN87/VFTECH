/**
 * VFTech application adaptations of React Bits AnimatedContent, Magnet and
 * SpotlightCard (David Haz), and Magic UI BorderBeam, discovered through 21st.dev.
 * Upstream sources, modifications and licenses: docs/motion-tools.md and licenses/.
 * No React runtime, external services or background animation loop are required.
 */
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const REVEALS = '.page-head-grid>div>*, .sect-aside>*, .ledger>div, .sits>.sit, .tier, .steps>li, .frame .cell, .closing-grid>div, .vfs-intro, .vfs-section-head, .vfs-card, .vfs-price, .vfs-callout, .vfs-project, .rx-service, .rx-support, .ld-stat, .cx-stat, .pl-summary, .mn-article>section';
const FINE = '(hover:hover) and (pointer:fine)';
gsap.registerPlugin(ScrollTrigger);

export function install(profile) {
  const root = document.documentElement;
  const seen = new WeakSet();
  let enabled = false, context = null, cleanups = [], lenis = null, ticking = false, settled = 0, frames = 0;
  const targets = [...document.querySelectorAll(REVEALS)].filter(el =>
    !el.closest('.hero, [hidden], .pl-board, .ld-projects, .vfg-panel') &&
    !el.parentElement.closest(REVEALS));
  const distance = Math.max(0, Math.min(36, Number(profile.distance) || 16));
  const duration = Math.max(.2, Math.min(.8, Number(profile.duration) || .55));
  const stagger = Math.max(0, Math.min(.07, Number(profile.stagger) || .03));
  const fine = matchMedia(FINE);
  function listen(el, event, handler, options) {
    el.addEventListener(event, handler, options);
    cleanups.push(() => el.removeEventListener(event, handler, options));
  }
  function clearTicker() {
    if (ticking) gsap.ticker.remove(updateLenis);
    ticking = false;
  }
  function updateLenis(time) {
    if (!lenis) { clearTicker(); return; }
    frames++;
    lenis.raf(time * 1000);
    settled = lenis.isScrolling ? 0 : settled + 1;
    if (settled >= 3) clearTicker();
  }
  function wake() {
    settled = 0;
    if (!ticking) { ticking = true; gsap.ticker.add(updateLenis); }
  }
  function mountScrolling() {
    if (!fine.matches || innerWidth < 900) return;
    lenis = new Lenis({lerp:.14, smoothWheel:true, syncTouch:false, autoRaf:false,
      anchors:false, allowNestedScroll:true, stopInertiaOnNavigate:true,
      prevent:node => Boolean(node.closest('input,textarea,select,[role=dialog],.vfg-panel,.design-switch,.sc-panel,.table-wrap,.vfs-table-wrap'))});
    lenis.on('virtual-scroll', wake);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
    function interrupt(event) {
      if (event.type === 'keydown' && !['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) return;
      if (lenis && lenis.isScrolling) lenis.scrollTo(scrollY,{immediate:true,force:true});
    }
    listen(document,'keydown',interrupt);
    listen(document,'pointerdown',interrupt,{passive:true});
    listen(document,'focusin',interrupt);
    cleanups.push(() => { clearTicker(); lenis?.destroy(); lenis = null; });
  }
  function mountReveals() {
    const pending = targets.filter(el => !seen.has(el) && el.getBoundingClientRect().top >= innerHeight*.94);
    const triggers = new Map();
    const compact = innerWidth < 768;
    function finish(el) {
      seen.add(el); el.dataset.vfReveal = 'shown';
      gsap.killTweensOf(el); gsap.set(el,{clearProps:'opacity,transform'});
      triggers.get(el)?.kill(); triggers.delete(el);
    }
    // React Bits AnimatedContent's axis/distance/timeline pattern, on existing DOM.
    gsap.set(pending,{y:compact ? Math.min(distance,12) : distance,opacity:0});
    pending.forEach(el => {
      el.dataset.vfReveal = 'pending';
      const trigger = ScrollTrigger.create({trigger:el,start:'top 94%',once:true,
        onEnter:() => {
          if (seen.has(el)) return;
          seen.add(el); el.dataset.vfReveal = 'revealing';
          const index = Math.max(0,[...el.parentElement.children].indexOf(el));
          gsap.to(el,{y:0,opacity:1,duration:compact ? Math.min(duration,.45) : duration,
            delay:Math.min(index,3)*stagger,ease:'power3.out',overwrite:'auto',
            onComplete:() => finish(el)});
        }});
      triggers.set(el,trigger);
    });
    function showFocused(event) {
      const el = event.target.closest?.('[data-vf-reveal]');
      if (el && el.dataset.vfReveal !== 'shown') finish(el);
    }
    listen(document,'focusin',showFocused);
    cleanups.push(() => { pending.forEach(finish); triggers.forEach(t => t.kill()); });
    ScrollTrigger.refresh();
  }
  function mountCards() {
    if (!fine.matches) return;
    const selectors = profile.beam ? '.vfs-card, .cx-panel, .flowfig' : '.vfs-card, .vfs-project';
    document.querySelectorAll(selectors).forEach(el => {
      if (el.closest('[hidden]')) return;
      el.classList.add('vf-card-effects');
      const layer = document.createElement('span');
      layer.className = profile.beam ? 'vf-border-beam' : 'vf-spotlight';
      layer.setAttribute('aria-hidden','true');
      if (profile.beam) layer.append(document.createElement('i'));
      el.append(layer);
      // React Bits SpotlightCard: local pointer/focus position and a bounded light.
      function paint(x,y) {
        el.style.setProperty('--vf-light-x',x+'px');
        el.style.setProperty('--vf-light-y',y+'px');
        el.classList.add('vf-card-active');
      }
      function move(e) { const r=el.getBoundingClientRect();paint(e.clientX-r.left,e.clientY-r.top); }
      function focus(e) {
        if (!e.target.matches(':focus-visible')) return;
        const r=el.getBoundingClientRect();paint(r.width/2,r.height/2);
      }
      function leave() { if (!el.contains(document.activeElement)) el.classList.remove('vf-card-active'); }
      listen(el,'pointermove',move,{passive:true}); listen(el,'pointerleave',leave);
      listen(el,'focusin',focus); listen(el,'focusout',e => { if (!el.contains(e.relatedTarget)) el.classList.remove('vf-card-active'); });
      cleanups.push(() => { layer.remove();el.classList.remove('vf-card-effects','vf-card-active');el.style.removeProperty('--vf-light-x');el.style.removeProperty('--vf-light-y'); });
    });
  }
  function mountMagnets() {
    if (!fine.matches || !profile.magnet) return;
    document.querySelectorAll('.hero .cta, .closing .cta, .vfs-actions .vfs-link').forEach(el => {
      const icon = el.querySelector('svg');
      if (!icon) return;
      const x = gsap.quickTo(icon,'x',{duration:.22,ease:'power3.out'});
      const y = gsap.quickTo(icon,'y',{duration:.22,ease:'power3.out'});
      // React Bits Magnet's distance/strength calculation, moving only the icon
      // so the link's hit area and typography never shift or wrap.
      listen(el,'pointermove',e => {
        const r=el.getBoundingClientRect(),limit=Number(profile.magnet);
        x(gsap.utils.clamp(-limit,limit,(e.clientX-r.left-r.width/2)/14));
        y(gsap.utils.clamp(-limit,limit,(e.clientY-r.top-r.height/2)/14));
      },{passive:true});
      listen(el,'pointerleave',() => { x(0);y(0); });
    });
  }
  function stop() {
    cleanups.splice(0).reverse().forEach(fn => fn());
    context?.revert(); context = null;
    targets.forEach(el => { seen.add(el);el.dataset.vfReveal='shown'; });
    clearTicker();
  }
  function setEnabled(on) {
    if (enabled === on) return;
    enabled = on;
    if (!on) { stop(); return; }
    try {
      context = gsap.context(() => {});
      context.add(() => { mountScrolling();mountReveals();mountCards();mountMagnets(); });
    } catch (error) { stop();enabled=false;root.dataset.vfMotionState='unavailable';throw error; }
  }
  window.addEventListener('pagehide',() => setEnabled(false));
  return {setEnabled,refresh:() => ScrollTrigger.refresh(),
    diagnostics:() => ({enabled,design:profile.name,lenis:Boolean(lenis),tickerActive:ticking,lenisFrames:frames,
      pending:document.querySelectorAll('[data-vf-reveal="pending"]').length,tools:['GSAP 3.15.0','Lenis 1.3.26','React Bits','21st.dev / Magic UI']})};
}
