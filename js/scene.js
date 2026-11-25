/* Aerox ERP — hero WebGL scene: Earth, orbit, satellite, ground terminal, live link.
   Scroll progress (0..1 through the pinned hero) moves the camera from orbit to ground. */
(async () => {
const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');

const canvas = document.getElementById('scene');
const hero = document.querySelector('.hero-pin');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);

/* ---------- Earth ---------- */
const sunDir = new THREE.Vector3(-0.6, 0.55, 0.7).normalize();
const noiseGLSL = `
  float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
  float fbm(vec3 p){ float v=0.0; float a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
`;
const earthMat = new THREE.ShaderMaterial({
  uniforms: { uSun: { value: sunDir }, uTime: { value: 0 }, uSite: { value: new THREE.Vector3() } },
  vertexShader: `
    varying vec3 vN; varying vec3 vP; varying vec3 vW;
    void main(){ vP = position; vN = normalize(normalMatrix*normal);
      vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz;
      gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `
    uniform vec3 uSun; uniform vec3 uSite; varying vec3 vN; varying vec3 vP; varying vec3 vW;
    ${noiseGLSL}
    void main(){
      vec3 p = normalize(vP);
      float n = fbm(p*2.2 + 3.1);
      float land = smoothstep(0.5, 0.53, n);
      float lat = asin(p.y); float lon = atan(p.z, p.x);
      float gLat = abs(fract(lat*57.2958/15.0 + 0.5) - 0.5);
      float gLon = abs(fract(lon*57.2958/15.0 + 0.5) - 0.5) * cos(lat);
      float grid = 1.0 - smoothstep(0.0, 0.025, min(gLat, gLon));
      // land drawn as a dot matrix (1.25 degree cells)
      float cellDeg = 1.25;
      vec2 g = vec2(lon, lat) * 57.2958 / cellDeg;
      vec2 cid = floor(g);
      vec2 cf = fract(g) - 0.5;
      vec3 cp = vec3(cos((cid.y+.5)*cellDeg/57.2958)*cos((cid.x+.5)*cellDeg/57.2958), sin((cid.y+.5)*cellDeg/57.2958), cos((cid.y+.5)*cellDeg/57.2958)*sin((cid.x+.5)*cellDeg/57.2958));
      float siteLand = smoothstep(0.972, 0.982, dot(cp, uSite) + 0.03*fbm(cp*9.0));
      float cellLand = max(step(0.515, fbm(cp*2.2 + 3.1)), siteLand);
      float dotR = length(cf * vec2(max(cos(lat), 0.2), 1.0));
      float dots = cellLand * (1.0 - smoothstep(0.16, 0.26, dotR));
      vec3 col = vec3(0.016,0.035,0.055);
      col += land * vec3(0.02,0.04,0.05);
      vec3 N = normalize(vN);
      vec3 L = normalize((viewMatrix*vec4(uSun,0.0)).xyz);
      float d = dot(N, L);
      float day = smoothstep(-0.2, 0.7, d);
      col += dots * mix(vec3(0.10,0.30,0.34), vec3(0.42,0.78,0.82), day);
      // city lights on the night side, amber
      float c = dots * step(0.9, hash(cp*91.0)) * smoothstep(0.15, -0.3, d);
      col += c * vec3(0.95,0.66,0.33) * 0.9;
      col += grid * vec3(0.24,0.84,0.88) * 0.07;
      float rim = pow(1.0 - max(dot(N, vec3(0,0,1)), 0.0), 4.0);
      col += rim * vec3(0.20,0.55,0.85) * 0.6;
      gl_FragColor = vec4(col, 1.0);
    }`
});
const earth = new THREE.Group();
scene.add(earth);
const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), earthMat);
earth.add(globe);

const atmo = new THREE.Mesh(
  new THREE.SphereGeometry(1.1, 96, 96),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vN; void main(){ float i = pow(0.7 - dot(vN, vec3(0,0,1.0)), 4.0); gl_FragColor = vec4(0.25,0.6,0.95,1.0)*i*0.9; }`
  })
);
earth.add(atmo);

/* ---------- ground terminal (fixed on the globe) ---------- */
const latLon = (lat, lon, r = 1) => {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};
const siteLocal = latLon(30, 69, 1.002); // Pakistan
const faceY = Math.atan2(-siteLocal.x, siteLocal.z); // globe Y rotation that turns the site toward +Z
earthMat.uniforms.uSite.value.copy(siteLocal).normalize();
const terminal = new THREE.Group();
terminal.position.copy(siteLocal);
terminal.lookAt(siteLocal.clone().multiplyScalar(2));
globe.add(terminal);
const dot = new THREE.Mesh(new THREE.CircleGeometry(0.012, 24), new THREE.MeshBasicMaterial({ color: 0xF3A953 }));
terminal.add(dot);
const pulse = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.026, 48), new THREE.MeshBasicMaterial({ color: 0xF3A953, transparent: true, side: THREE.DoubleSide }));
terminal.add(pulse);

/* ---------- orbit + satellite ---------- */
const orbit = new THREE.Group();
orbit.rotation.set(0.95, 0.2, -0.35);
scene.add(orbit);
const R = 1.42;
const ringPts = [];
for (let i = 0; i <= 256; i++) { const a = i / 256 * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)); }
const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts),
  new THREE.LineDashedMaterial({ color: 0x3DD6E0, dashSize: 0.02, gapSize: 0.03, transparent: true, opacity: 0.35 }));
ring.computeLineDistances();
orbit.add(ring);

const sat = new THREE.Group();
const metal = new THREE.MeshStandardMaterial({ color: 0xB9C3CA, metalness: 0.35, roughness: 0.45 });
const panelTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#0d2436'; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = 'rgba(61,214,224,.55)'; g.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
  for (let y = 0; y <= 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const panelMat = new THREE.MeshStandardMaterial({ map: panelTex, metalness: 0.4, roughness: 0.5, emissive: 0x06202c, emissiveIntensity: 0.8 });
const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.07), metal);
sat.add(body);
[-1, 1].forEach(s => {
  const p = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.003, 0.045), panelMat);
  p.position.x = s * 0.085; sat.add(p);
});
// SAR array: 8x8 patch face pointing at Earth
const array = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0x3DD6E0, wireframe: true, transparent: true, opacity: 0.8 }));
array.position.y = -0.03; array.rotation.x = Math.PI / 2;
sat.add(array);
sat.scale.setScalar(2.2);
orbit.add(sat);

scene.add(new THREE.AmbientLight(0x8899aa, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.copy(sunDir).multiplyScalar(10);
scene.add(sun);

/* ---------- link beam between terminal and satellite ---------- */
const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({ color: 0x3DD6E0, transparent: true, opacity: 0 }));
scene.add(beam);
const packet = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
scene.add(packet);

/* ---------- stars ---------- */
{
  const n = 2200, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 40);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe8ee, size: 0.08, sizeAttenuation: true, transparent: true, opacity: 0.7 })));
}

/* ---------- HUD labels projected from 3D ---------- */
const hudSat = document.getElementById('hudSat');
const hudGs = document.getElementById('hudGs');
const place = (el, v, visible) => {
  if (!el) return;
  const p = v.clone().project(camera);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  el.style.transform = `translate(${(p.x * .5 + .5) * w}px, ${(-p.y * .5 + .5) * h}px)`;
  el.style.opacity = visible && p.z < 1 ? 1 : 0;
};

/* ---------- layout + scroll ---------- */
let progress = 0, mx = 0, my = 0, tmx = 0, tmy = 0, mobile = false;
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  mobile = w < 760;
}
addEventListener('resize', resize);
resize();

function readScroll() {
  const r = hero.getBoundingClientRect();
  const span = hero.offsetHeight - innerHeight;
  progress = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
}
addEventListener('scroll', readScroll, { passive: true });
readScroll();
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - .5; tmy = e.clientY / innerHeight - .5; }, { passive: true });

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), siteWorld = new THREE.Vector3();

/* render only while the hero is on screen */
let visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

const clock = new THREE.Clock();
let t = 0;
function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!reduce) t += dt;
  const p = ease(progress);
  mx = lerp(mx, tmx, 0.05); my = lerp(my, tmy, 0.05);

  // Earth: slow drift at rest; while scrolling, the ground site turns to face us and rises to the horizon
  globe.rotation.y = faceY + (1 - p) * (-1.1 + t * 0.025);
  earth.rotation.x = -0.35 * p;
  earthMat.uniforms.uTime.value = t;

  // camera: wide orbital view -> low over the horizon, looking up at the pass
  const rest = mobile
    ? { ex: 0, ey: -1.55, cz: 7.2, lx: 0, ly: -0.75 }
    : { ex: 1.35, ey: -0.5, cz: 6.4, lx: 0.45, ly: -0.15 };
  earth.position.set(lerp(rest.ex, 0.15, p), lerp(rest.ey, -1.35, p), 0);
  orbit.position.copy(earth.position);
  camera.position.set(mx * 0.3, lerp(0.1, -0.1, p) - my * 0.2, lerp(rest.cz, mobile ? 3.6 : 3.0, p));
  camera.lookAt(lerp(rest.lx, 0.2, p), lerp(rest.ly, -0.45, p), lerp(0, 0.4, p));

  // satellite: free orbit at rest, settles into a pass above the ground site as you scroll
  const a = t * 0.16 + 1.4;
  tmpB.set(Math.cos(a) * R, 0, Math.sin(a) * R);
  orbit.updateMatrixWorld();
  const orbitWorld = orbit.localToWorld(tmpB.clone());
  terminal.getWorldPosition(siteWorld);
  const siteUp = siteWorld.clone().sub(earth.position).normalize();
  const passWorld = siteWorld.clone().addScaledVector(siteUp, 0.5).add(tmpA.set(0.38 + Math.sin(t * 0.3) * 0.05, 0.08, 0));
  const satWorld = orbitWorld.lerp(passWorld, THREE.MathUtils.smoothstep(p, 0.25, 0.85));
  sat.position.copy(orbit.worldToLocal(satWorld.clone()));
  sat.scale.setScalar(lerp(2.2, 1.5, p));
  sat.lookAt(earth.position);
  sat.rotateX(-Math.PI / 2);

  // link: active when both ends can see each other over the horizon
  sat.getWorldPosition(tmpA);
  const up = siteWorld.clone().sub(earth.position).normalize();
  const toSat = tmpA.clone().sub(siteWorld).normalize();
  const elev = up.dot(toSat);
  const link = THREE.MathUtils.smoothstep(elev, 0.05, 0.3) * (0.35 + 0.65 * p);
  beamGeo.setFromPoints([siteWorld, tmpA]);
  beam.material.opacity = link * 0.9;
  const k = (t * 0.8) % 1;
  packet.position.lerpVectors(tmpA, siteWorld, k);
  packet.material.opacity = link;

  const s = 1 + ((t * 0.9) % 1) * 2.2;
  pulse.scale.setScalar(s);
  pulse.material.opacity = 1 - (s - 1) / 2.2;

  ring.material.opacity = 0.35 - p * 0.15;
  place(hudSat, tmpA, p > 0.3);
  place(hudGs, siteWorld, p > 0.3 && up.dot(tmpB.copy(camera.position).sub(siteWorld).normalize()) > 0.05);

  renderer.render(scene, camera);
}
document.documentElement.classList.add('webgl');
frame();
})().catch(() => document.documentElement.classList.add('no-webgl'));
