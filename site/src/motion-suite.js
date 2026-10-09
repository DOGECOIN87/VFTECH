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
  let seen = new WeakSet(), seenCards = new WeakSet(), introPlayed = false;
  const homeRoot = document.querySelector('main[data-vf-home-motion]');
  const home = homeRoot && profile.home;
  const intro = home ? [...homeRoot.querySelectorAll(home.intro)] : [];
  let enabled = false, context = null, cleanups = [], lenis = null, ticking = false, settled = 0, frames = 0;
  const revealSelectors = home ? home.reveal : REVEALS;
  const targets = [...document.querySelectorAll(revealSelectors)].filter(el =>
    !el.closest('[hidden], dialog, .chrome-stage, .hero-backdrop, .vfg-panel') &&
    (home || !el.closest('.hero, .pl-board, .ld-projects')) &&
    !el.parentElement.closest(revealSelectors) &&
    !intro.some(item => item === el || item.contains(el)));
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
  function mountIntro() {
    if (!home || introPlayed) return;
    introPlayed = true;
    const visible = intro.filter(el => el.getClientRects().length && el.getBoundingClientRect().bottom > 0);
    const travel = innerWidth < 768 ? Math.min(home.distance,20) : home.distance;
    visible.forEach(el => { el.dataset.vfIntro = 'revealing'; });
    function finish(el) {
      gsap.killTweensOf(el);gsap.set(el,{clearProps:'opacity,transform'});
      el.dataset.vfIntro = 'shown';
    }
    visible.forEach((el,index) => gsap.fromTo(el,{y:travel,opacity:0},{
      y:0,opacity:1,duration:home.duration,delay:Math.min(index,4)*.08,
      ease:'power3.out',overwrite:'auto',onComplete:() => finish(el)}));
    listen(document,'focusin',event => {
      const el=event.target.closest?.('[data-vf-intro]');
      if(el && el.dataset.vfIntro !== 'shown')finish(el);
    });
    cleanups.push(() => visible.forEach(finish));
  }
  function mountReveals() {
    const fresh = targets.filter(el => !seen.has(el) && el.getClientRects().length);
    const pending = fresh.filter(el => el.getBoundingClientRect().top >= innerHeight*.94);
    const initial = home ? fresh.filter(el => !pending.includes(el) && el.getBoundingClientRect().bottom > 0) : [];
    const triggers = new Map();
    const compact = innerWidth < 768;
    function finish(el) {
      seen.add(el); el.dataset.vfReveal = 'shown';
      gsap.killTweensOf(el); gsap.set(el,{clearProps:'opacity,transform'});
      triggers.get(el)?.kill(); triggers.delete(el);
    }
    // React Bits AnimatedContent's axis/distance/timeline pattern, on existing DOM.
    const travel = home ? (home.panelDistance ?? home.distance) : distance;
    const time = home ? home.duration : duration;
    const movement = compact ? Math.min(travel,20) : travel;
    function enter(el,index=0) {
      if(seen.has(el))return;
      seen.add(el);el.dataset.vfReveal='revealing';
      gsap.to(el,{y:0,opacity:1,duration:home ? time : compact ? Math.min(time,.45) : time,
        delay:Math.min(index,3)*stagger,ease:'power3.out',overwrite:'auto',onComplete:()=>finish(el)});
    }
    gsap.set([...pending,...initial],{y:movement,opacity:0});
    initial.forEach((el,index)=>enter(el,index));
    pending.forEach(el => {
      el.dataset.vfReveal = 'pending';
      const trigger = ScrollTrigger.create({trigger:el,start:'top 94%',once:true,
        onEnter:() => {
          if (seen.has(el)) return;
          const index = Math.max(0,[...el.parentElement.children].indexOf(el));
          enter(el,index);
        }});
      triggers.set(el,trigger);
    });
    function showFocused(event) {
      const el = event.target.closest?.('[data-vf-reveal]');
      if (el && el.dataset.vfReveal !== 'shown') finish(el);
    }
    listen(document,'focusin',showFocused);
    cleanups.push(() => { [...pending,...initial].forEach(finish); triggers.forEach(t => t.kill()); });
    ScrollTrigger.refresh();
  }
  function mountCards() {
    if (!fine.matches && !home) return;
    const selectors = home ? home.cards : profile.beam ? '.vfs-card, .cx-panel, .flowfig' : '.vfs-card, .vfs-project';
    document.querySelectorAll(selectors).forEach(el => {
      if (el.closest('[hidden],dialog') || el.parentElement.closest(selectors)) return;
      el.classList.add('vf-card-effects');
      const layer = document.createElement('span');
      layer.className = profile.beam ? 'vf-border-beam' : 'vf-spotlight';
      layer.setAttribute('aria-hidden','true');
      if (profile.beam) layer.append(document.createElement('i'));
      const glow = document.createElement('span');
      glow.className='vf-spotlight-glow';glow.setAttribute('aria-hidden','true');
      el.append(glow);
      el.append(layer);
      el.style.setProperty('--vf-beam-radius',getComputedStyle(el).borderTopLeftRadius);
      let timer = 0;
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
      function pulse() {
        clearTimeout(timer);
        const r=el.getBoundingClientRect();paint(r.width/2,r.height/2);
        timer=setTimeout(()=>{if(!el.matches(':hover') || !fine.matches)leave();},profile.beam?2500:1600);
      }
      if(fine.matches){listen(el,'pointermove',move,{passive:true});listen(el,'pointerleave',leave);}
      else listen(el,'pointerdown',pulse,{passive:true});
      listen(el,'focusin',focus); listen(el,'focusout',e => { if (!el.contains(e.relatedTarget)) el.classList.remove('vf-card-active'); });
      // A finite viewport effect makes the actual home cards visible on touch.
      // Hover remains an enhancement; no touch-scrolling or control input is intercepted.
      if(home && (!fine.matches || profile.beam) && !seenCards.has(el)){
        const observer=new IntersectionObserver(entries=>{
          if(entries.some(entry=>entry.isIntersecting)){
            seenCards.add(el);pulse();observer.disconnect();
          }
        },{threshold:.12});
        observer.observe(el);cleanups.push(()=>observer.disconnect());
      }
      cleanups.push(() => { clearTimeout(timer);glow.remove();layer.remove();el.classList.remove('vf-card-effects','vf-card-active');el.style.removeProperty('--vf-light-x');el.style.removeProperty('--vf-light-y');el.style.removeProperty('--vf-beam-radius'); });
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
      context.add(() => { mountScrolling();mountIntro();mountReveals();mountCards();mountMagnets(); });
    } catch (error) { stop();enabled=false;root.dataset.vfMotionState='unavailable';throw error; }
  }
  window.addEventListener('pagehide',() => setEnabled(false));
  function replay() {
    if(!enabled || !home)return false;
    setEnabled(false);
    window.scrollTo({top:0,behavior:'instant'});
    homeRoot.focus({preventScroll:true});
    seen=new WeakSet();seenCards=new WeakSet();introPlayed=false;
    setEnabled(true);return true;
  }
  return {setEnabled,refresh:() => ScrollTrigger.refresh(),
    replay,
    diagnostics:() => ({enabled,design:profile.name,lenis:Boolean(lenis),tickerActive:ticking,lenisFrames:frames,
      home:Boolean(home),introTargets:intro.length,homeTargets:home ? targets.length : 0,
      pending:document.querySelectorAll('[data-vf-reveal="pending"]').length,tools:['GSAP 3.15.0','Lenis 1.3.26','React Bits','21st.dev / Magic UI']})};
}
