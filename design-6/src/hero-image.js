// Source of assets/hero/lumen-{dark,light}.{avif,webp}. Re-render:
//   node scripts/render-hero.mjs design-6/src/hero-image.js /tmp/lumen-dark.png 2400 1350 dark
//   python3 scripts/hero-post.py /tmp/lumen-dark.png design-6/assets/hero/lumen-dark 0.6 0.4   (light: bloom 0.3, vignette 0.25, light=1)
// Lumen hero image: a "data horizon". A field of glowing data columns recedes to a horizon placed on the
// golden section (61.8% down the frame); the tallest clusters stand on the left and right thirds so a centred
// headline sits over calm sky. Network arcs join column tops, and particles drift above the field.
import * as THREE from 'three';

const variant = new URLSearchParams(location.search).get('v') || 'dark';
const canvas = document.getElementById('c');
const W = canvas.width, H = canvas.height, ASPECT = W / H;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.autoClear = false;

const DARK = variant === 'dark';
const C = DARK ? {
  skyTop: [0.010, 0.016, 0.070], skyHor: [0.060, 0.070, 0.230], glow: [0.36, 0.30, 0.95], aur1: [0.30, 0.40, 1.0], aur2: [0.62, 0.40, 1.0],
  base: [0.015, 0.02, 0.08], mid: [0.20, 0.22, 0.72], top: [0.62, 0.50, 1.0], tip: [0.62, 0.92, 1.0], grid: [0.22, 0.28, 0.75], fog: [0.06, 0.07, 0.22],
  particle: [0.66, 0.72, 1.0], arc: [0.80, 0.70, 1.0], floor: [0.008, 0.012, 0.05]
} : {
  skyTop: [0.985, 0.982, 1.0], skyHor: [0.905, 0.895, 1.0], glow: [0.80, 0.74, 1.0], aur1: [0.62, 0.66, 1.0], aur2: [0.82, 0.66, 1.0],
  base: [0.80, 0.80, 0.98], mid: [0.52, 0.50, 0.96], top: [0.36, 0.30, 0.90], tip: [0.20, 0.55, 0.95], grid: [0.62, 0.62, 0.92], fog: [0.92, 0.91, 1.0],
  particle: [0.40, 0.36, 0.92], arc: [0.45, 0.36, 0.95], floor: [0.86, 0.85, 0.99]
};
const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);

// ---------- deterministic noise ----------
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => 0.55 * vnoise(x, y) + 0.3 * vnoise(x * 2.1, y * 2.1) + 0.15 * vnoise(x * 4.3, y * 4.3);

// ---------- camera: horizon on the golden section ----------
const FOV = 34, camY = 6.2, camZ = 34;
const camera = new THREE.PerspectiveCamera(FOV, ASPECT, 0.1, 600);
camera.position.set(0, camY, camZ);
const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const pitch = Math.atan((0.5 - 0.382) * 2 * tanHalf);          // raise the view so the horizon sits 38.2% up
camera.lookAt(0, camY + Math.tan(pitch) * 100, camZ - 100);
const tanHalfH = tanHalf * ASPECT;

// ---------- sky ----------
const skyScene = new THREE.Scene();
const skyCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
skyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  depthWrite: false,
  uniforms: { top: { value: v3(C.skyTop) }, hor: { value: v3(C.skyHor) }, glow: { value: v3(C.glow) }, a1: { value: v3(C.aur1) }, a2: { value: v3(C.aur2) },
    aspect: { value: ASPECT }, dark: { value: DARK ? 1 : 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `
    varying vec2 vUv; uniform vec3 top, hor, glow, a1, a2; uniform float aspect, dark;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    void main(){
      float y = vUv.y, horizon = 0.382;
      vec3 col = mix(hor, top, smoothstep(horizon, 1.0, y));
      // horizon glow, widest where the field meets the sky
      vec2 q = vec2((vUv.x - 0.5) * aspect, (y - horizon) * 3.2);
      col += glow * exp(-dot(q, q) * 1.6) * (dark > 0.5 ? 0.55 : 0.35);
      // two aurora ribbons, on the left and right thirds, leaving the centre of the sky calm
      for (int k = 0; k < 2; k++) {
        float side = k == 0 ? 0.24 : 0.78;
        float wave = 0.62 + 0.07 * sin(vUv.x * 7.0 + float(k) * 2.0) + 0.05 * n(vec2(vUv.x * 5.0, float(k) * 3.0));
        float band = exp(-pow((y - wave) * 9.0, 2.0)) * exp(-pow((vUv.x - side) * 3.0, 2.0));
        float streak = 0.55 + 0.45 * n(vec2(vUv.x * 60.0, y * 3.0));
        col += (k == 0 ? a1 : a2) * band * streak * (dark > 0.5 ? 0.28 : 0.16);
      }
      // stars, faint and few, only in the dark variant
      if (dark > 0.5) { vec2 g = floor(vUv * vec2(aspect * 260.0, 260.0)); float s = h(g); col += step(0.9972, s) * smoothstep(0.42, 0.9, y) * 0.55 * h(g + 3.1); }
      gl_FragColor = vec4(col, 1.0);
    }`
})));

// ---------- the field ----------
const scene = new THREE.Scene();
const SP = 1.6, X0 = -120, X1 = 120, Z0 = 12, Z1 = -300;
const box = new THREE.BoxGeometry(0.62, 1, 0.62);
box.translate(0, 0.5, 0);
const cols = [];
for (let z = Z0; z >= Z1; z -= SP) for (let x = X0; x <= X1; x += SP) {
  const depth = camZ - z;
  const u = x / (depth * tanHalfH);                         // horizontal screen position, -1 … 1
  if (Math.abs(u) > 1.25) continue;
  const third = Math.abs(u);
  // calm centre, rising toward the thirds and holding beyond them
  const env = 0.12 + 0.88 * THREE.MathUtils.smoothstep(third, 0.1, 0.36);
  const n = fbm(x * 0.045 + 3, z * 0.045);
  let hgt = Math.pow(n, 2.4) * 30 * env * Math.min(1.7, Math.max(0.12, (depth - 14) / 95));   // near columns stay short, so heights read evenly on screen
  if (hash(x, z) > 0.985) hgt *= 2.2;                       // the odd spike, like a reading out of range
  hgt = Math.max(0.12, Math.round(hgt / 0.4) * 0.4);         // quantised, like chart columns
  cols.push([x, z, hgt]);
}
const mesh = new THREE.InstancedMesh(box, new THREE.ShaderMaterial({
  uniforms: { base: { value: v3(C.base) }, mid: { value: v3(C.mid) }, top: { value: v3(C.top) }, tip: { value: v3(C.tip) }, fog: { value: v3(C.fog) },
    dark: { value: DARK ? 1 : 0 } },
  vertexShader: `
    attribute float aH; varying float vT; varying float vH; varying float vDist; varying vec3 vN;
    void main(){
      vT = position.y; vH = aH; vN = normal;
      vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vec4 mv = viewMatrix * wp; vDist = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 base, mid, top, tip, fog; uniform float dark;
    varying float vT; varying float vH; varying float vDist; varying vec3 vN;
    void main(){
      float k = clamp(vH / 16.0, 0.0, 1.0);
      // dark bodies that light up toward the top, like a column of data filling
      vec3 col = mix(base, mid, pow(vT, 1.6) * (0.35 + 0.65 * k));
      col = mix(col, top, smoothstep(0.78, 1.0, vT) * (0.25 + 0.75 * k));
      float face = vN.y > 0.5 ? 1.0 : (abs(vN.z) > 0.5 ? 0.95 : 0.6);
      col *= face;
      if (vN.y > 0.5) col = mix(col, tip, 0.08 + 0.8 * k);             // lit caps, brightest on the tall columns
      float near = smoothstep(16.0, 75.0, vDist);
      col = dark > 0.5 ? col * (0.3 + 0.7 * near) : mix(fog * 0.97, col, 0.25 + 0.75 * near);   // the foreground recedes: into shadow (dark) or haze (light)
      col += tip * smoothstep(0.965, 1.0, vT) * 0.5 * k;
      float f = 1.0 - exp(-pow(vDist / 210.0, 1.6));
      col = mix(col, fog, f);
      gl_FragColor = vec4(col, 1.0);
    }`
}), cols.length);
const m4 = new THREE.Matrix4(), aH = new Float32Array(cols.length);
cols.forEach(([x, z, h], i) => { m4.makeScale(1, h, 1).setPosition(x, 0, z); mesh.setMatrixAt(i, m4); aH[i] = h; });
box.setAttribute('aH', new THREE.InstancedBufferAttribute(aH, 1));
scene.add(mesh);

// ground grid, lines running between the columns and fading into the distance
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.ShaderMaterial({
  depthWrite: true,
  uniforms: { grid: { value: v3(C.grid) }, fog: { value: v3(C.fog) }, floor: { value: v3(C.floor) }, sp: { value: SP } },
  vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: `
    uniform vec3 grid, fog, floor; uniform float sp; varying vec3 vW; varying float vD;
    void main(){
      vec2 g = abs(fract((vW.xz) / sp + 0.5) - 0.5) / fwidth(vW.xz / sp);
      float line = 1.0 - min(min(g.x, g.y), 1.0);
      float fade = exp(-vD / 140.0);
      vec3 base = mix(floor, fog, 1.0 - exp(-pow(vD / 210.0, 1.6)));
      gl_FragColor = vec4(mix(base, grid, line * 0.55 * fade), 1.0);
    }`,
  extensions: { derivatives: true }
}));
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0.001;
scene.add(ground);

// network arcs between tall columns, on each side
const tall = cols.filter(c => c[2] > 5 && c[1] < -20 && c[1] > -170).sort((a, b) => b[2] - a[2]);
const pick = side => tall.filter(c => Math.sign(c[0]) === side).slice(0, 40);
const arcMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(...C.arc), transparent: true, opacity: DARK ? 0.75 : 0.6,
  blending: DARK ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false });
const nodeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(...C.tip), transparent: true, opacity: 0.95, blending: DARK ? THREE.AdditiveBlending : THREE.NormalBlending });
for (const side of [-1, 1]) {
  const ends = pick(side);
  for (let i = 0; i + 1 < ends.length && i < 14; i += 2) {
    const a = ends[i], b = ends[(i + 5) % ends.length];
    const A = new THREE.Vector3(a[0], a[2], a[1]), B = new THREE.Vector3(b[0], b[2], b[1]);
    const mid = A.clone().lerp(B, 0.5); mid.y += A.distanceTo(B) * 0.42 + 4;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.05, 6, false), arcMat));
    for (const p of [A, B]) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), nodeMat); s.position.copy(p); scene.add(s); }
  }
}

// drifting particles, denser low over the field
const N = 4200, pos = new Float32Array(N * 3), sz = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const z = 14 - Math.pow(rnd(), 0.7) * 260, depth = camZ - z;
  const u = (rnd() * 2 - 1) * 1.15;
  pos[i * 3] = u * depth * tanHalfH;
  pos[i * 3 + 1] = Math.pow(rnd(), 2.2) * 34;
  pos[i * 3 + 2] = z;
  sz[i] = 0.5 + rnd() * 1.6;
}
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
pg.setAttribute('aS', new THREE.BufferAttribute(sz, 1));
scene.add(new THREE.Points(pg, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: DARK ? THREE.AdditiveBlending : THREE.NormalBlending,
  uniforms: { col: { value: v3(C.particle) }, scale: { value: H / 2 / tanHalf } },
  vertexShader: 'attribute float aS; uniform float scale; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aS * scale * 0.06 / -mv.z; vA = clamp(1.0 - (-mv.z) / 260.0, 0.0, 1.0); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 col; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(col, a * vA * 0.8); }'
})));

renderer.setClearColor(0x000000, 1);
renderer.clear();
renderer.render(skyScene, skyCam);
renderer.clearDepth();
renderer.render(scene, camera);
window.__done = true;
