import * as THREE from 'three';

// Exact contours from logo/vftech-icon.svg. Its white app-icon background is not a mesh.
const contours = [
  [[177,278.72],[334.5,278.72],[541.5,637.26],[541.5,278.72],[1077,278.72],[1027.64,364.22],[627,364.22],[627,1058.15]],
  [[703.5,440.72],[983.47,440.72],[703.5,925.64],[703.5,611.72],[807.83,611.72],[852,535.22],[703.5,535.22]]
];
const stage = document.querySelector('[data-chrome-hero]');
if (stage) initChrome(stage);

function initChrome(stage) {
  let renderer;
  let envTarget;
  let scene;
  const canvas = stage.querySelector('canvas');
  const figure = stage.closest('figure');
  // the light the mark throws on the floor (index.html .hero-pool) widens as its face turns to camera
  const pool = stage.closest('.hero--studio')?.querySelector('.hero-pool');
  const root = document.documentElement;
  const dark = matchMedia('(prefers-color-scheme: dark)');
  let failed = false;
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = root.classList.contains('motion-paused') ? 3.2 : 0;
  // The hero intro (hero-intro.js) runs light along the borders to the triangle's corners first; the
  // mark starts drawing when they meet. A failsafe releases it if the intro never signals.
  let introHold = root.classList.contains('hero-intro-pending') && !root.classList.contains('motion-paused');
  const releaseIntro = () => { introHold = false; };
  document.addEventListener('vftech:intro-arrived', releaseIntro, {once: true});
  setTimeout(releaseIntro, 3000);
  let lastDraw = -Infinity;
  let disposed = false;

  function fallback() {
    failed = true;
    cancelAnimationFrame(frame);
    frame = 0;
    figure.classList.remove('chrome-ready', 'chrome-solid');
    figure.classList.add('chrome-fallback');
    stage.style.removeProperty('--chrome-opacity');
    stage.style.removeProperty('--sketch-opacity');
    canvas.hidden = true;
  }

  try {
    renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'low-power'});
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    scene = new THREE.Scene();

    // Procedural studio: broad softboxes, narrow reflection strips, and dark gaps.
    // All reflections are local. No external HDR, image, font or model is needed by this scene.
    const studio = new THREE.Scene();
    studio.add(new THREE.Mesh(new THREE.BoxGeometry(24,24,24), new THREE.MeshBasicMaterial({color:0x6e5a4c, side:THREE.BackSide})));
    function card(width, height, color, x, y, z) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(width,height), new THREE.MeshBasicMaterial({color, side:THREE.DoubleSide}));
      panel.material.color.multiplyScalar(color === 0xffffff ? 3 : 1);
      panel.position.set(x,y,z);
      panel.lookAt(0,0,0);
      studio.add(panel);
    }
    card(24,1.5,0xffffff,0,1.5,7);
    card(24,1.5,0xffffff,7,1.5,0);
    card(24,1.5,0xffffff,-7,1.5,0);
    card(14,1.2,0x080a0d,0,-0.3,7);
    card(24,1.5,0xffffff,0,1.5,-7);
    card(14,1.2,0x080a0d,0,-0.3,-7);
    card(5,10,0xffffff,-5,2,6);
    card(1.2,12,0xffffff,4,1,5);
    card(8,2.5,0xffffff,0,6,2);
    card(4,8,0xf2c9a8,6,-2,-5);
    card(2,10,0xffffff,-5,1,-6);
    card(10,1,0x9a7a62,0,-5,4);
    const pmrem = new THREE.PMREMGenerator(renderer);
    envTarget = pmrem.fromScene(studio, 0.025);
    scene.environment = envTarget.texture;
    pmrem.dispose();
    studio.traverse(obj => { obj.geometry?.dispose(); obj.material?.dispose(); });

    const chrome = new THREE.MeshStandardMaterial({color:0xf2a07a, metalness:1, roughness:0.09, envMapIntensity:1.65});
    const logo = new THREE.Group();
    for (const points of contours) {
      const shape = new THREE.Shape();
      points.forEach(([x,y], i) => shape[i ? 'lineTo' : 'moveTo']((x-627)/270, (668.435-y)/270));
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, {depth:0.24, bevelEnabled:true, bevelThickness:0.025, bevelSize:0.018, bevelSegments:3, steps:1, curveSegments:1});
      geometry.translate(0,0,-0.12);
      // A very slight crowned polish across the broad faces gives the chrome
      // continuous studio reflections without changing any contour vertices.
      const normals = geometry.getAttribute('normal');
      const positions = geometry.getAttribute('position');
      const normal = new THREE.Vector3();
      for (let i=0; i<normals.count; i++) {
        const z = normals.getZ(i);
        if (Math.abs(z) > 0.99) {
          normal.set(positions.getX(i)*0.14, positions.getY(i)*0.10, z).normalize();
          normals.setXYZ(i, normal.x, normal.y, normal.z);
        }
      }
      logo.add(new THREE.Mesh(geometry, chrome));
    }
    // Pivot at the bounding-box center. Both pieces rotate as one registered mark.
    logo.position.y = -0.11;
    // The mark leans toward the pointer (hero-depth.js eases it into stage.vftechTilt), on top of its spin.
    const tilt = new THREE.Group();
    tilt.add(logo);
    scene.add(tilt);
    const camera = new THREE.OrthographicCamera(-2.30,2.30,2.1667,-2.1667,0.1,30);
    camera.position.set(0,0,8);
    camera.lookAt(0,0,0);

    function updateTheme() {
      // A stage can declare its own backdrop (the studio hero is dark in both page themes).
      const backdrop = stage.dataset.backdrop;
      const isDark = backdrop === 'dark' || (backdrop !== 'light' && (root.dataset.theme === 'dark' || (!root.dataset.theme && dark.matches)));
      renderer.toneMappingExposure = isDark ? 1.15 : 0.95;
      chrome.envMapIntensity = isDark ? 1.65 : 1.25;
      if (!failed && !disposed) render();
    }
    function render() {
      if (failed || disposed) return;
      // Draw -> extrude -> polish. The front starts aligned with the SVG beneath it.
      const growth = THREE.MathUtils.smoothstep(elapsed, 1.2, 3.2);
      const reveal = THREE.MathUtils.smoothstep(elapsed, 1.25, 2.5);
      const rotationTime = Math.max(0, elapsed-3.2);
      // Negative yaw is clockwise when viewed from above the vertical axis.
      logo.rotation.y = -(rotationTime * Math.PI*2 / 8);
      logo.rotation.x = 0.06*growth;
      logo.scale.z = 0.02+0.98*growth;
      const lean = stage.vftechTilt;
      tilt.rotation.x = lean ? lean.y*0.16 : 0;
      tilt.rotation.y = lean ? lean.x*0.24 : 0;
      if (pool) pool.style.setProperty('--mark-turn', Math.abs(Math.cos(logo.rotation.y)).toFixed(3));
      stage.style.setProperty('--chrome-opacity', String(reveal));
      stage.style.setProperty('--sketch-opacity', String(1-reveal));
      figure.classList.toggle('chrome-solid', reveal === 1);
      renderer.render(scene,camera);
    }
    function resize() {
      if (failed || disposed) return;
      const {width,height} = stage.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width,height,false);
      const halfWidth = 2.30;
      const halfHeight = halfWidth * height/width;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      render();
    }
    function running() {
      return visible && !document.hidden && !root.classList.contains('motion-paused') && !failed && !disposed;
    }
    function tick(now) {
      frame = 0;
      if (!running()) { lastTime=0; return; }
      if (lastTime && !introHold) elapsed += Math.min((now-lastTime)/1000, 0.1);
      lastTime = now;
      if (now-lastDraw >= 1000/30) { render(); lastDraw=now; }
      frame = requestAnimationFrame(tick);
    }
    function syncMotion() {
      if (running()) {
        if (!frame) { lastTime=0; frame=requestAnimationFrame(tick); }
      } else {
        cancelAnimationFrame(frame);
        frame=0;
        lastTime=0;
        render();
      }
    }
    resize();
    updateTheme();
    figure.classList.add('chrome-ready');
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); });
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(stage);
    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(root,{attributes:true,attributeFilter:['data-theme']});
    const viewObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      figure.classList.toggle('hero-in-view', visible);
      syncMotion();
    },{threshold:0.05});
    viewObserver.observe(stage);
    document.addEventListener('visibilitychange', syncMotion);
    document.addEventListener('vftech:motion-change', syncMotion);
    dark.addEventListener('change', updateTheme);
    window.addEventListener('pagehide', event => {
      if (event.persisted) return; // Keep the scene intact for back/forward-cache restoration.
      disposed=true;
      cancelAnimationFrame(frame);
      sizeObserver.disconnect(); themeObserver.disconnect(); viewObserver.disconnect();
      document.removeEventListener('visibilitychange', syncMotion);
      document.removeEventListener('vftech:motion-change', syncMotion);
      dark.removeEventListener('change', updateTheme);
      scene.traverse(obj => obj.geometry?.dispose());
      chrome.dispose(); envTarget.dispose(); renderer.dispose();
    });
  } catch (error) {
    fallback();
    scene?.traverse(obj => { obj.geometry?.dispose(); obj.material?.dispose(); });
    envTarget?.dispose();
    renderer?.dispose();
    console.warn('VFTech: using the SVG logo fallback.', error.message);
  }
}
