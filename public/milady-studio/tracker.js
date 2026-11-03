import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/postprocessing/OutputPass.js';
import { VRMLoaderPlugin, VRMUtils } from 'https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@2.1.2/lib/three-vrm.module.min.js';

const studioRoot = document.getElementById('studio-root');
if (!studioRoot) throw new Error('Pockit Milady Studio root was not found');

const params = new URLSearchParams(location.search);
const DEMO = params.get('demo') === '1';
const UI0 = params.get('ui') === '0'; // no controls at all (OBS browser sources)
const MOUTH_SENS = parseFloat(params.get('mouthsens') || '1');  // e.g. ?mouthsens=1.3 for more sensitive mouth
const status = t => document.getElementById('status').textContent = t;

// ---------- persisted UI ----------
const ui = {};
for (const id of ['mirror', 'arms', 'camMouth', 'micMouth', 'flipPitch', 'flipYaw', 'flipRoll',
                  'fxSparkle', 'fxHeart', 'fxRainbow', 'fxScan', 'fxFish']) {
  const el = document.getElementById(id);
  const saved = localStorage.getItem('trk_' + id);
  if (saved !== null) el.checked = saved === '1';
  el.addEventListener('change', () => localStorage.setItem('trk_' + id, el.checked ? '1' : '0'));
  ui[id] = el;
}
// ---------- background: solid colors or an uploaded image ----------
const bgSel = document.getElementById('bg');
const bgFile = document.getElementById('bgFile');
let bgImage = localStorage.getItem('trk_bgimg') || null;
bgSel.value = params.get('bg') || localStorage.getItem('trk_bg') || 'transparent';
if (!bgSel.value || (bgSel.value === 'image' && !bgImage)) bgSel.value = 'transparent'; // unknown saved/URL value → transparent

// Keep the backdrop beside this module so it works at any page path.
const SMILEY_BG = new URL('./smiley.jpg', import.meta.url).href;
const smileyImg = new Image();
smileyImg.src = SMILEY_BG;

function applyBg() {
  const v = bgSel.value;
  studioRoot.className =
    'pockit-milady-studio ' + (
    (v === 'image' || v === 'smiley') ? 'bgimg' :
    v === 'transparent' ? (UI0 ? '' : 'checker') : v);
  studioRoot.style.backgroundImage =
    v === 'smiley' ? `url(${SMILEY_BG})` :
    (v === 'image' && bgImage) ? `url(${bgImage})` : '';
}
function setBg(v) {
  bgSel.value = v;
  localStorage.setItem('trk_bg', v);
  applyBg();
}
bgSel.addEventListener('change', () => {
  if (bgSel.value === 'image' && !bgImage) { bgFile.click(); return; } // applied once a file is picked
  setBg(bgSel.value);
});

// image intake: file picker, or just drag & drop a picture onto the window.
// Downscaled to ≤1920px and saved (as jpeg) so it survives restarts.
function setBgImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const img = new Image();
  img.onload = () => {
    const k = Math.min(1, 1920 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    bgImage = c.toDataURL('image/jpeg', 0.85);
    try { localStorage.setItem('trk_bgimg', bgImage); }
    catch (e) { console.warn('bg image too big to persist (applied for this session):', e); }
    URL.revokeObjectURL(img.src);
    setBg('image');
    status('bg image set — drop a new picture or right-click 🖼 BG to change');
  };
  img.src = URL.createObjectURL(file);
}
bgFile.addEventListener('change', () => { setBgImage(bgFile.files[0]); bgFile.value = ''; });
bgFile.addEventListener('cancel', () => { if (bgSel.value === 'image' && !bgImage) setBg('transparent'); });
document.getElementById('bgPick').addEventListener('click', () => bgFile.click());
addEventListener('dragover', e => e.preventDefault());
addEventListener('drop', e => { e.preventDefault(); setBgImage(e.dataTransfer.files?.[0]); });
applyBg();

// current Pockit token id ('' = default local avatar); assigned at load
let miladyId = '';

// big friendly buttons are the default UI; ?panel=1 swaps in the advanced
// settings panel instead, ?ui=0 hides every control (for OBS browser sources)
const BIG = !UI0 && params.get('panel') !== '1' && params.get('big') !== '0';
// the panel ships hidden in the HTML (it used to flash on slow networks
// while the module imports loaded); only ?panel=1 mode starts with it open
if (!BIG && !UI0) document.getElementById('ui').classList.remove('hidden');
const bigbar = document.getElementById('bigbar');
let bigbarToggle = () => {};
if (BIG) {
  document.getElementById('ui').classList.add('hidden');
  bigbar.classList.remove('hidden');
  const btnM = bigbar.querySelector('[data-act=mirror]');
  const sync = () => {
    btnM.classList.toggle('on', ui.mirror.checked);
  };
  btnM.addEventListener('click', () => {
    ui.mirror.checked = !ui.mirror.checked;
    ui.mirror.dispatchEvent(new Event('change'));
    sync();
  });
  bigbar.querySelector('[data-act=rezero]').addEventListener('click', () =>
    document.getElementById('rezero').click());
  bigbar.querySelector('[data-act=milady]').addEventListener('click', () => openMiladyDlg());
  bigbar.querySelector('[data-act=settings]').addEventListener('click', () =>
    document.getElementById('ui').classList.toggle('hidden'));
  // FX button cycles presets: off → ✨ → 💕 → 🌈 → 📺 → 🐟 → everything → off
  const FX_PRESETS = [
    [], ['fxSparkle'], ['fxHeart'], ['fxRainbow'], ['fxScan'], ['fxFish'],
    ['fxSparkle', 'fxHeart', 'fxRainbow', 'fxScan', 'fxFish'],
  ];
  bigbar.querySelector('[data-act=fx]').addEventListener('click', () => {
    const ids = ['fxSparkle', 'fxHeart', 'fxRainbow', 'fxScan', 'fxFish'];
    const cur = FX_PRESETS.findIndex(p =>
      ids.every(id => p.includes(id) === ui[id].checked));
    const next = FX_PRESETS[(cur + 1) % FX_PRESETS.length];
    for (const id of ids) {
      ui[id].checked = next.includes(id);
      ui[id].dispatchEvent(new Event('change'));
    }
  });
  // Background cycles green → white → black → image → transparent; landing
  // on "image" with nothing uploaded opens the file picker instead
  const BG_CYCLE = ['green', 'white', 'black', 'smiley', 'image', 'transparent'];
  const btnBg = bigbar.querySelector('[data-act=bg]');
  btnBg.addEventListener('click', () => {
    const next = BG_CYCLE[(BG_CYCLE.indexOf(bgSel.value) + 1) % BG_CYCLE.length];
    if (next === 'image' && !bgImage) { bgFile.click(); return; }
    setBg(next);
  });
  // right-click = pick/change the background image at any time (drag & drop
  // works too). Touch has neither, so a long-press (≥500ms, released without
  // sliding) opens the picker instead; Android fires contextmenu on long-press
  // already, so a flag keeps the two paths from opening it twice per gesture.
  let bgPicked = false, bgHoldT = 0, bgHoldXY = null;
  btnBg.addEventListener('contextmenu', e => { e.preventDefault(); bgPicked = true; bgFile.click(); });
  btnBg.addEventListener('touchstart', e => {
    bgPicked = false;
    bgHoldT = performance.now();
    bgHoldXY = [e.touches[0].clientX, e.touches[0].clientY];
  }, { passive: true });
  btnBg.addEventListener('touchmove', e => {
    if (bgHoldXY && Math.hypot(e.touches[0].clientX - bgHoldXY[0],
                               e.touches[0].clientY - bgHoldXY[1]) > 12) bgHoldXY = null;
  }, { passive: true });
  btnBg.addEventListener('touchend', e => {
    if (bgHoldXY && performance.now() - bgHoldT >= 500) {
      e.preventDefault(); // swallow the click that would cycle the background
      if (!bgPicked) { bgPicked = true; bgFile.click(); }
    }
    bgHoldXY = null;
  });
  sync();
  // hide button <-> peek dot
  const peek = document.getElementById('peek');
  const setHidden = h => {
    bigbar.classList.toggle('hidden', h);
    peek.classList.toggle('hidden', !h);
  };
  bigbar.querySelector('[data-act=hide]').addEventListener('click', () => setHidden(true));
  peek.addEventListener('click', () => setHidden(false));
  bigbarToggle = () => setHidden(!bigbar.classList.contains('hidden'));
  // buttons fade out when the mouse is idle, come back on any mouse move
  let fadeTimer;
  const wake = () => {
    bigbar.classList.remove('faded');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => bigbar.classList.add('faded'), 3000);
  };
  addEventListener('pointermove', wake);
  addEventListener('pointerdown', wake); // touch screens have no mousemove
  wake();
}
// keep the fixed chrome inside the VISIBLE screen: URL-bar collapse, the
// on-screen keyboard, and any residual page zoom all shrink/offset the visual
// viewport while position:fixed stays glued to the layout viewport. The CSS
// position rules add these --vv* insets (0 on desktop / when nothing shifted).
if (window.visualViewport && !UI0) {
  const vv = window.visualViewport;
  const pin = () => {
    const r = document.documentElement.style;
    r.setProperty('--vvt', Math.max(0, vv.offsetTop) + 'px');
    r.setProperty('--vvl', Math.max(0, vv.offsetLeft) + 'px');
    r.setProperty('--vvb', Math.max(0, innerHeight - vv.height - vv.offsetTop) + 'px');
    r.setProperty('--vvr', Math.max(0, innerWidth - vv.width - vv.offsetLeft) + 'px');
  };
  vv.addEventListener('resize', pin);
  vv.addEventListener('scroll', pin);
  pin();
}
// ---------- click sounds ----------
// RemiliaNET-style interface audio (wiki.remilia.org/RemiliaNET): generative
// sound effects on a pentatonic scale, no audio files. Every button press
// plucks a random note (plus a quiet octave shimmer). The AudioContext is
// created lazily inside the first click — the gesture autoplay policies want.
let sfxCtx = null;
const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // C major pentatonic, two octaves
function blip() {
  try {
    sfxCtx ??= new AudioContext();
    if (sfxCtx.state === 'suspended') sfxCtx.resume();
    const t = sfxCtx.currentTime;
    const f = PENTA[Math.floor(Math.random() * PENTA.length)];
    for (const [mult, vol, type] of [[1, 0.10, 'triangle'], [2, 0.03, 'sine']]) {
      const osc = sfxCtx.createOscillator();
      const gain = sfxCtx.createGain();
      osc.type = type;
      osc.frequency.value = f * mult;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain).connect(sfxCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch (e) { /* no WebAudio: buttons just stay silent */ }
}
// capture phase: sounds play even for buttons whose handlers stop propagation
if (!UI0) addEventListener('click', e => { if (e.target.closest?.('button')) blip(); }, true);

const uiPanel = document.getElementById('ui');
// ✕ returns to the bottom buttons (also un-hides them for ?panel=1 users)
document.getElementById('uiClose').addEventListener('click', () => {
  uiPanel.classList.add('hidden');
  if (BIG) bigbar.classList.remove('hidden');
});
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key.toLowerCase() === 'h') {
    // H closes the settings panel if it's open, else toggles the buttons
    if (BIG && uiPanel.classList.contains('hidden')) bigbarToggle();
    else uiPanel.classList.toggle('hidden');
  }
});

// phones run two neural nets + 3D on a battery: detect once (touch + small
// screen) and trade a little sharpness/pose latency for heat. Desktop keeps
// full quality — OBS captures are unaffected.
const MOBILE = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820;

// ---------- three.js scene ----------
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2)); // 3x phone screens don't need 3x GPU load
renderer.setClearColor(0x000000, 0);
studioRoot.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 20);
camera.position.set(0, 0.95, 1.35);
camera.lookAt(0, 0.92, 0);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff, 1.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(0.5, 1.5, 2);
scene.add(sun);

// ---------- fx (all optional, all cheap) ----------
// sparkles/hearts: one Points cloud each (≤40 sprites, canvas textures, no
// extra draw passes). rainbow: CSS hue-rotate on the canvas. scanlines: a
// static CSS overlay. Nothing runs unless its toggle is on.
function makeSprite(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const sparkleTex = makeSprite(ctx => {
  // 4-point star
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.quadraticCurveTo(34, 30, 60, 32);
  ctx.quadraticCurveTo(34, 34, 32, 60);
  ctx.quadraticCurveTo(30, 34, 4, 32);
  ctx.quadraticCurveTo(30, 30, 32, 4);
  ctx.fill();
});
const heartTex = makeSprite(ctx => {
  ctx.fillStyle = '#ff86b3';
  ctx.beginPath();
  ctx.moveTo(32, 56);
  ctx.bezierCurveTo(6, 36, 4, 18, 18, 12);
  ctx.bezierCurveTo(27, 8, 32, 16, 32, 22);
  ctx.bezierCurveTo(32, 16, 37, 8, 46, 12);
  ctx.bezierCurveTo(60, 18, 58, 36, 32, 56);
  ctx.fill();
});
function makeParticles(tex, count, size, speed) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 1.1;
    pos[i * 3 + 1] = Math.random() * 1.6;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({
    map: tex, size, transparent: true, depthWrite: false, sizeAttenuation: true,
  });
  const p = new THREE.Points(g, m);
  p.visible = false;
  p.frustumCulled = false;
  scene.add(p);
  p.userData.speed = speed;
  return p;
}
const fxSparkles = makeParticles(sparkleTex, 40, 0.05, 0.10);
const fxHearts = makeParticles(heartTex, 22, 0.06, 0.14);
function updateParticles(p, dt, t) {
  if (!p.visible) return;
  const a = p.geometry.attributes.position;
  for (let i = 0; i < a.count; i++) {
    let y = a.getY(i) + dt * p.userData.speed * (0.6 + (i % 5) * 0.25);
    if (y > 1.7) y = 0;
    a.setY(i, y);
    a.setX(i, a.getX(i) + Math.sin(t * 1.3 + i * 1.7) * dt * 0.03);
  }
  a.needsUpdate = true;
  p.material.opacity = 0.7 + 0.3 * Math.sin(t * 3 + (p === fxHearts ? 2 : 0));
}
// fisheye: a bulge-distortion post pass. The composer only renders when the
// toggle is on; otherwise the plain renderer path runs, exactly as before.
const FisheyeShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.5 },
    aspect: { value: innerWidth / Math.max(1, innerHeight) },
  },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float strength; uniform float aspect;
    varying vec2 vUv;
    void main() {
      vec2 p = vUv - 0.5;
      p.x *= aspect;
      float rmax = length(vec2(0.5 * aspect, 0.5));
      float r = length(p);
      vec2 q = r > 1e-5 ? p * pow(r / rmax, strength) : p; // corners stay anchored, center bulges
      q.x /= aspect;
      gl_FragColor = texture2D(tDiffuse, q + 0.5);
    }`,
};
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const fisheyePass = new ShaderPass(FisheyeShader);
composer.addPass(fisheyePass);
composer.addPass(new OutputPass());
let fisheyeOn = false;
addEventListener('resize', () => {
  composer.setSize(innerWidth, innerHeight);
  fisheyePass.uniforms.aspect.value = innerWidth / Math.max(1, innerHeight);
  applyCamera(); // re-fit the framing to the new aspect
});

const FX_IDS = ['fxSparkle', 'fxHeart', 'fxRainbow', 'fxScan', 'fxFish'];
function applyFx() {
  fxSparkles.visible = ui.fxSparkle.checked;
  fxHearts.visible = ui.fxHeart.checked;
  renderer.domElement.classList.toggle('rainbow', ui.fxRainbow.checked);
  document.getElementById('scan').style.display = ui.fxScan.checked ? 'block' : 'none';
  fisheyeOn = ui.fxFish.checked;
  if (BIG) bigbar.querySelector('[data-act=fx]')?.classList.toggle('on', FX_IDS.some(id => ui[id].checked));
}
for (const id of FX_IDS) ui[id].addEventListener('change', applyFx);
applyFx();

// ---------- avatar loading ----------
// Pockit Milady #1 is the default; any Pockit Milady in the 1111-piece
// collection can be hot-swapped in by token id from the VRM CDN.
const DEFAULT_MILADY_ID = '1';
const pockitUrl = id => `https://prnth.com/Pockit/web/${id}.vrm`;
const avatarUrl = id => pockitUrl(id || DEFAULT_MILADY_ID);
let vrm = null, headBone = null, neckBone = null, spineBone = null, expr = null;
let torsoBones = []; // [bone, weight] pairs: spine → chest → upperChest, weights normalized
let mouthTex = null; // canvas-mouth fallback: {mats, frames[closed,small,big], cur}
const arms = { left: null, right: null };
const loader = new GLTFLoader();
loader.register(p => new VRMLoaderPlugin(p));

// arms: relaxed idle pose (T-pose dropped to the sides) + optional webcam
// pose tracking. Each arm is either "tracked" (follows shoulder/elbow/wrist
// landmarks) or idle (relaxed pose with subtle sway).
function setupArms() {
  for (const side of ['left', 'right']) {
    const sign = side === 'left' ? 1 : -1;
    const a = {
      sign,
      upper: vrm.humanoid.getNormalizedBoneNode(side + 'UpperArm'),
      lower: vrm.humanoid.getNormalizedBoneNode(side + 'LowerArm'),
      hand: vrm.humanoid.getNormalizedBoneNode(side + 'Hand'),
      tracked: false,
      tUpper: new THREE.Quaternion(),
      tLower: new THREE.Quaternion(),
    };
    if (a.upper) a.upper.rotation.z = 1.15 * sign;
    if (a.lower) a.lower.rotation.z = 0.25 * sign;
    if (a.hand) a.hand.rotation.z = 0.10 * sign;
    arms[side] = a;
  }
}

// Pockit models ship with no mouth blendshapes (their only morph is Blink),
// but the mouth is a dedicated little textured quad (material "Mouth", a
// black smile stroke on a transparent ~150×60 image). So: paint open-mouth
// frames in the same ink style onto copies of that texture, centered on the
// existing smile's pixels, and flap the mouth by swapping material.map.
function setupCanvasMouth() {
  const mats = [];
  vrm.scene.traverse(o => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (m.name === 'Mouth' && m.map?.image && !mats.includes(m)) mats.push(m);
    }
  });
  if (!mats.length) { console.warn('no mouth blendshapes and no "Mouth" material — mouth will be static'); return; }
  const src = mats[0].map, img = src.image;
  const w = img.width, h = img.height;
  const probe = document.createElement('canvas');
  probe.width = w; probe.height = h;
  const pctx = probe.getContext('2d');
  pctx.drawImage(img, 0, 0);
  const data = pctx.getImageData(0, 0, w, h).data;
  let minX = w, maxX = 0, minY = h, maxY = 0, n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > 60 && data[i] + data[i + 1] + data[i + 2] < 380) { // dark ink
        n++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  const cx = n ? (minX + maxX) / 2 : w / 2;
  const cy = n ? (minY + maxY) / 2 : h / 2;
  const inkW = n ? maxX - minX : w * 0.4;
  const frames = [src];
  for (const big of [0, 1]) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.clearRect(minX - 4, minY - 4, maxX - minX + 8, maxY - minY + 8);
    const rw = inkW * (big ? 0.55 : 0.34), rh = rw * (big ? 0.6 : 0.45);
    const myc = Math.min(cy + rh * 0.3, h - rh - 1);
    const mouth = new Path2D();
    mouth.ellipse(cx, myc, rw, rh, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill(mouth);
    if (big) {
      ctx.save();
      ctx.clip(mouth);
      ctx.fillStyle = '#c97a7a';
      ctx.beginPath();
      ctx.ellipse(cx, myc + rh * 0.75, rw * 0.62, rh * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.flipY = src.flipY;
    t.colorSpace = src.colorSpace;
    t.wrapS = src.wrapS; t.wrapT = src.wrapT;
    t.magFilter = src.magFilter; t.minFilter = src.minFilter;
    t.generateMipmaps = src.generateMipmaps;
    frames.push(t);
  }
  mouthTex = { mats, frames, cur: src };
}

// A few % of Pockit accessories (hats — e.g. #104/#516/#1058) ship skinned
// 100% to the HIPS bone while sitting at head height: an asset bug that
// leaves the hat floating in place when the head turns. Detect (head-level
// bbox + zero head-bone weight) and rebind every vertex to the head joint —
// at load the scene is still in bind pose, so the swap is visually lossless
// and the hat simply starts following the head like the properly-built ones.
function fixStuckAccessories() {
  const headRaw = vrm.humanoid.getRawBoneNode('head');
  if (!headRaw) return;
  vrm.scene.updateMatrixWorld(true);
  const skinned = [];
  vrm.scene.traverse(o => { if (o.isSkinnedMesh) skinned.push(o); });
  let bodyTop = 0;
  for (const o of skinned) {
    o.geometry.computeBoundingBox();
    bodyTop = Math.max(bodyTop, o.geometry.boundingBox.max.y);
  }
  for (const o of skinned) {
    if (o.geometry.boundingBox.min.y < bodyTop * 0.7) continue; // not head-level
    const idx = o.geometry.getAttribute('skinIndex');
    const wt = o.geometry.getAttribute('skinWeight');
    if (!idx || !wt) continue;
    const headSet = new Set(); // this skin's joints that are head or inside it
    o.skeleton.bones.forEach((b, i) => {
      for (let p = b; p; p = p.parent) if (p === headRaw) { headSet.add(i); break; }
    });
    let usesHead = false;
    for (let v = 0; v < idx.count && !usesHead; v++)
      for (let c = 0; c < 4; c++)
        if (wt.getComponent(v, c) > 0.01 && headSet.has(idx.getComponent(v, c))) { usesHead = true; break; }
    if (usesHead) continue;
    let hi = o.skeleton.bones.indexOf(headRaw);
    if (hi < 0) { // head isn't among this skin's joints — extend a copy
      hi = o.skeleton.bones.length;
      o.bind(new THREE.Skeleton(
        [...o.skeleton.bones, headRaw],
        [...o.skeleton.boneInverses, headRaw.matrixWorld.clone().invert()],
      ), o.bindMatrix);
    }
    for (let v = 0; v < idx.count; v++) {
      idx.setXYZW(v, hi, 0, 0, 0);
      wt.setXYZW(v, 1, 0, 0, 0);
    }
    idx.needsUpdate = true;
    wt.needsUpdate = true;
    console.log('rebound stuck accessory to head bone:', o.name || o.uuid);
  }
}

// A second Pockit asset bug (e.g. #518's halo): a hat-slot accessory baked
// ~0.5m too low, so it circles the neck. Correctly-built tokens all put the
// "Hatmodel" mesh in a band just above the head joint (+0.07..+0.39 local,
// measured across the collection). Headwear lying ENTIRELY below the joint is
// always misplaced — lift its center into that band. Hair and glasses straddle
// the joint, so this rule can't touch them.
function fixMisplacedHats() {
  const headRaw = vrm.humanoid.getRawBoneNode('head');
  if (!headRaw) return;
  vrm.scene.updateMatrixWorld(true);
  const headPos = new THREE.Vector3();
  headRaw.getWorldPosition(headPos);
  vrm.scene.traverse(o => {
    if (o.name !== 'Hatmodel') return;
    const box = new THREE.Box3().setFromObject(o);
    if (box.isEmpty() || box.max.y >= headPos.y) return; // straddles/above the joint: placed fine
    o.position.y += headPos.y + 0.22 - (box.min.y + box.max.y) / 2;
    console.log('lifted misplaced hat accessory into the hat band');
  });
}

// camera: auto-framed on the face whatever the avatar's height, with mouse
// wheel zoom from full body (zoomed out) to face close-up (zoomed in)
let camH = 1.15, camS = 1;
let camZoom = parseFloat(localStorage.getItem('trk_zoom'));
if (!isFinite(camZoom)) camZoom = 1;

function applyCamera() {
  const t = Math.min(1, Math.max(0, (camZoom - 0.5) / 0.5)); // 0 = body, 1 = face
  const lookY = camH * 0.55 * (1 - t) + (camH - 0.23 * camS) * t;
  // vertical FOV is fixed, so narrow (portrait) windows would crop the arms —
  // pull the camera back until the body's width fits again
  const fit = Math.max(1, 0.7 / Math.max(0.1, camera.aspect || 1)); // || 1: hidden windows report 0×0 → NaN aspect
  camera.position.set(0, lookY + 0.03 * camS, 1.35 * camS * fit / camZoom);
  camera.lookAt(0, lookY, 0);
}

function frameCamera() {
  vrm.scene.updateMatrixWorld(true);
  camH = new THREE.Box3().setFromObject(vrm.scene).max.y;
  camS = camH / 1.15;
  applyCamera();
  for (const p of [fxSparkles, fxHearts]) {
    p.scale.setScalar(camS);
    p.material.size = 0.05 * camS;
  }
}

function setZoom(z) {
  camZoom = Math.min(2.5, Math.max(0.45, z));
  localStorage.setItem('trk_zoom', camZoom);
  applyCamera();
}
addEventListener('wheel', e => setZoom(camZoom * Math.exp(-e.deltaY * 0.0012)), { passive: true });
// touch: two-finger pinch zooms over the same range as the wheel. Handlers
// are non-passive and preventDefault (plus touch-action:none on the canvas),
// otherwise the browser claims the gesture as page zoom and fights the camera
let pinchD = 0;
const touchDist = e => Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                                  e.touches[0].clientY - e.touches[1].clientY);
addEventListener('touchstart', e => {
  if (e.touches.length === 2) { pinchD = touchDist(e); e.preventDefault(); }
}, { passive: false });
addEventListener('touchmove', e => {
  if (e.touches.length === 2 && pinchD > 0) {
    e.preventDefault();
    const d = touchDist(e);
    setZoom(camZoom * d / pinchD);
    pinchD = d;
  }
}, { passive: false });
addEventListener('touchend', e => { if (e.touches.length < 2) pinchD = 0; });
addEventListener('touchcancel', () => { pinchD = 0; });
// iOS Safari also surfaces pinches as gesture* events — swallow those too
for (const ev of ['gesturestart', 'gesturechange', 'gestureend'])
  addEventListener(ev, e => e.preventDefault());

async function loadAvatar(url) {
  const gltf = await loader.loadAsync(url);
  const next = gltf.userData.vrm;
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.rotateVRM0(next);
  if (vrm) { scene.remove(vrm.scene); VRMUtils.deepDispose(vrm.scene); }
  vrm = next;
  scene.add(vrm.scene);
  headBone = vrm.humanoid.getNormalizedBoneNode('head');
  neckBone = vrm.humanoid.getNormalizedBoneNode('neck');
  spineBone = vrm.humanoid.getNormalizedBoneNode('spine');
  // torso rotation is spread up the spine chain; missing bones just hand
  // their share to the ones that exist
  torsoBones = [];
  {
    const want = [['spine', 0.45], ['chest', 0.35], ['upperChest', 0.20]];
    const have = want.filter(([n]) => vrm.humanoid.getNormalizedBoneNode(n));
    const total = have.reduce((s, [, w]) => s + w, 0) || 1;
    torsoBones = have.map(([n, w]) => [vrm.humanoid.getNormalizedBoneNode(n), w / total]);
  }
  expr = vrm.expressionManager;
  console.log('expressions:', expr ? expr.expressions.map(e => e.expressionName) : []);
  // mouth: use blendshapes when the model actually binds them, else fall
  // back to repainting the mouth texture (Pockit models)
  mouthTex = null;
  const groups = gltf.parser.json.extensions?.VRM?.blendShapeMaster?.blendShapeGroups || [];
  const aGroup = groups.find(g => g.presetName === 'a');
  if (!aGroup || !(aGroup.binds || []).length) setupCanvasMouth();
  fixStuckAccessories(); // must run while still in bind pose, before setupArms poses the rig
  fixMisplacedHats();
  setupArms();
  frameCamera();
}

// camStatus = last persistent message from the tracking pipeline, so the
// status line can be restored after a transient "loading milady…" message
let camStatus = 'loading…';
const setCam = t => { camStatus = t; status(t); };

async function loadMilady(id) {
  id = String(id ?? '').trim().toLowerCase();
  if (!/^\d*$/.test(id)) { status('milady # must be a number'); return; }
  id = id || DEFAULT_MILADY_ID;
  status(`loading milady #${id}…`);
  try {
    await loadAvatar(avatarUrl(id));
    miladyId = id;
    localStorage.setItem('trk_milady', id);
    document.getElementById('milady').value = id;
    status(camStatus);
  } catch (e) {
    console.warn('avatar load failed:', e);
    status(`milady #${id} failed to load — keeping current avatar`);
  }
}
const randomMiladyId = () => String(1 + Math.floor(Math.random() * 1111)); // tokens are 1–1111
document.getElementById('loadMilady').addEventListener('click', () =>
  loadMilady(document.getElementById('milady').value));
document.getElementById('randMilady').addEventListener('click', () => loadMilady(randomMiladyId()));
document.getElementById('milady').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadMilady(e.target.value);
});

// milady picker dialog (used by the big-button mode)
const miladyDlg = document.getElementById('miladyDlg');
const dlgId = document.getElementById('dlgId');
// ⌨ flips the milady # inputs between the number pad (default) and the full
// keyboard; mobile keyboards only re-read inputmode on focus, hence blur+focus
let kbText = false;
const kbInputs = [document.getElementById('milady'), dlgId];
function toggleKb(focusEl) {
  kbText = !kbText;
  for (const el of kbInputs) el.inputMode = kbText ? 'text' : 'numeric';
  if (focusEl) { focusEl.blur(); focusEl.focus(); }
}
document.getElementById('kbMilady').addEventListener('click', e => { e.preventDefault(); toggleKb(document.getElementById('milady')); });
document.getElementById('dlgKb').addEventListener('click', () => toggleKb(dlgId));
function openMiladyDlg() {
  dlgId.value = miladyId;
  miladyDlg.classList.remove('hidden');
  dlgId.focus();
  dlgId.select();
}
const closeMiladyDlg = () => miladyDlg.classList.add('hidden');
document.getElementById('dlgLoad').addEventListener('click', () => { closeMiladyDlg(); loadMilady(dlgId.value); });
document.getElementById('dlgRandom').addEventListener('click', () => { closeMiladyDlg(); loadMilady(randomMiladyId()); });
document.getElementById('dlgCancel').addEventListener('click', closeMiladyDlg);
dlgId.addEventListener('keydown', e => {
  if (e.key === 'Enter') { closeMiladyDlg(); loadMilady(dlgId.value); }
  if (e.key === 'Escape') closeMiladyDlg();
});
miladyDlg.addEventListener('click', e => { if (e.target === miladyDlg) closeMiladyDlg(); });

// initial avatar: ?milady= URL param > last saved choice > Pockit Milady #1
{
  const initId = (params.get('milady') ?? localStorage.getItem('trk_milady') ?? '').trim().toLowerCase();
  miladyId = /^\d+$/.test(initId) ? initId : DEFAULT_MILADY_ID;
  document.getElementById('milady').value = miladyId;
  try {
    await loadAvatar(avatarUrl(miladyId));
  } catch (e) {
    console.warn('initial avatar load failed, falling back to default:', e);
    miladyId = DEFAULT_MILADY_ID;
    document.getElementById('milady').value = miladyId;
    await loadAvatar(avatarUrl(miladyId));
  }
  setCam('avatar loaded' + (DEMO ? ' (demo mode)' : ''));
}
// ---------- arm solver ----------
// Callers pass points in visual space: +X = avatar's left (viewer's right),
// +Y up, +Z toward camera. The normalized rig's frame is rotated 180° about Y
// relative to that (this VRM0 model's rig faces -Z; same reason the head code
// negates pitch), so directions get x/z-flipped into rig space, where the
// left arm's rest direction is -X and the right arm's is +X.
// setFromUnitVectors gives the minimal rotation from rest onto the target.
const REST_DIR = { left: new THREE.Vector3(-1, 0, 0), right: new THREE.Vector3(1, 0, 0) };
const ARM_CHAIN = ['hips', 'spine', 'chest', 'upperChest'];
const sQP = new THREE.Quaternion(), sQI = new THREE.Quaternion();
const sV1 = new THREE.Vector3(), sV2 = new THREE.Vector3();

function armParentQuat(side, out) {
  out.identity();
  for (const name of [...ARM_CHAIN, side + 'Shoulder']) {
    const b = vrm.humanoid.getNormalizedBoneNode(name);
    if (b) out.multiply(b.quaternion);
  }
  return out;
}

// S/E/W: shoulder, elbow, wrist points in avatar space. Writes the arm's
// target quaternions; returns false if the pose is degenerate.
function solveArm(side, S, E, W) {
  const a = arms[side];
  if (!a.upper || !a.lower) return false;
  const dU = sV1.copy(E).sub(S);
  const dL = sV2.copy(W).sub(E);
  if (dU.lengthSq() < 1e-6 || dL.lengthSq() < 1e-6) return false;
  dU.x *= -1; dU.z *= -1; // visual space → rig space
  dL.x *= -1; dL.z *= -1;
  const qP = armParentQuat(side, sQP);
  dU.normalize().applyQuaternion(sQI.copy(qP).invert());
  a.tUpper.setFromUnitVectors(REST_DIR[side], dU);
  qP.multiply(a.tUpper); // lower arm's parent frame
  dL.normalize().applyQuaternion(sQI.copy(qP).invert());
  a.tLower.setFromUnitVectors(REST_DIR[side], dL);
  return true;
}

// ---------- face + pose tracking (MediaPipe) ----------
let landmarker = null, poseLandmarker = null, video = null, faceSeen = false, lastFaceT = 0, lastPoseT = 0;
const neutral = new THREE.Quaternion();
let neutralSet = false;
const qRaw = new THREE.Quaternion(), qRel = new THREE.Quaternion(), qTarget = new THREE.Quaternion();
const qHeadTmp = new THREE.Quaternion(), qNeckTmp = new THREE.Quaternion();
const qTorsoTmp = new THREE.Quaternion(), qCompTmp = new THREE.Quaternion(), eTorsoTmp = new THREE.Euler();
const mat = new THREE.Matrix4();
let trackBlink = 0, trackJaw = 0, trackFunnel = 0;

// leaning: the face matrix's translation (camera space, ~cm) is the head's
// actual position — deltas from the re-zeroable neutral drive whole-body
// sway plus a forward-lean torso pitch for when the hips aren't in frame
// (the usual desk framing), so the body moves with you instead of sitting
// bolted in place. 🎯 Fix Head re-zeros position and rotation together.
const neutralPos = new THREE.Vector3(), facePosTmp = new THREE.Vector3();
const leanTgt = { x: 0, y: 0, z: 0 }; // visual-space meters
const leanCur = { x: 0, y: 0, z: 0 };
let leanPitch = 0;
const LEAN_GAIN = { x: 0.9, y: 0.5, z: 0.7, pitch: 2.0 };
const LEAN_MAX = { x: 0.25, y: 0.10, z: 0.30 };

if (!DEMO) {
  try {
    status('loading tracker…');
    const { FilesetResolver, FaceLandmarker, PoseLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    const fileset = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: 'VIDEO',
      numFaces: 1,
    });
    try {
      poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
    } catch (e) {
      console.warn('pose tracker unavailable (face-only mode):', e);
      poseLandmarker = null;
    }
    status('requesting camera…');
    video = document.getElementById('cam');
    // facingMode:'user' — without it some Android phones open the rear camera
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
    await video.play();
    setCam(poseLandmarker ? 'tracking (face + arms)' : 'tracking (face only)');
  } catch (e) {
    console.warn('camera/tracker unavailable:', e);
    setCam('no camera — idle mode (' + (e.name || e.message || e) + ')');
    landmarker = null;
  }
}

document.getElementById('rezero').addEventListener('click', () => { neutralSet = false; });

function getBlend(shapes, name) {
  const c = shapes.categories.find(c => c.categoryName === name);
  return c ? c.score : 0;
}

function pollFace(now) {
  if (!landmarker || !video || video.readyState < 2) return;
  const res = landmarker.detectForVideo(video, now);
  if (res.facialTransformationMatrixes?.length && res.faceBlendshapes?.length) {
    faceSeen = true; lastFaceT = now;
    mat.fromArray(res.facialTransformationMatrixes[0].data);
    qRaw.setFromRotationMatrix(mat);
    facePosTmp.setFromMatrixPosition(mat); // +x image-right, +y up, z rises toward 0 as you lean in
    if (!neutralSet) { neutral.copy(qRaw); neutralPos.copy(facePosTmp); neutralSet = true; }
    const ds = ui.mirror.checked ? -1 : 1; // same side convention as the arms
    leanTgt.x = clampA(ds * (facePosTmp.x - neutralPos.x) / 100 * LEAN_GAIN.x, LEAN_MAX.x);
    leanTgt.y = clampA((facePosTmp.y - neutralPos.y) / 100 * LEAN_GAIN.y, LEAN_MAX.y);
    const closer = (facePosTmp.z - neutralPos.z) / 100; // meters leaned toward the camera
    leanTgt.z = clampA(closer * LEAN_GAIN.z, LEAN_MAX.z);
    leanPitch = clampA(closer * LEAN_GAIN.pitch, TORSO_MAX.pitch);
    qRel.copy(neutral).invert().multiply(qRaw);
    // decompose to euler for per-axis flips
    const e = new THREE.Euler().setFromQuaternion(qRel, 'YXZ');
    // pitch is negated by default: MediaPipe's up is the opposite of the rig's
    let px = -e.x, py = e.y, pz = e.z;
    if (ui.mirror.checked) { py = -py; pz = -pz; }
    if (ui.flipPitch.checked) px = -px;
    if (ui.flipYaw.checked) py = -py;
    if (ui.flipRoll.checked) pz = -pz;
    qTarget.setFromEuler(new THREE.Euler(px, py, pz, 'YXZ'));

    const s = res.faceBlendshapes[0];
    trackBlink = (getBlend(s, 'eyeBlinkLeft') + getBlend(s, 'eyeBlinkRight')) / 2;
    trackJaw = getBlend(s, 'jawOpen');
    trackFunnel = getBlend(s, 'mouthFunnel');
  } else if (now - lastFaceT > 1200) {
    faceSeen = false;
  }
}

// MediaPipe pose landmark indices (shoulder / elbow / wrist), per person side
const POSE_LM = { left: [11, 13, 15], right: [12, 14, 16] };
const pV = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const pTmp = new THREE.Vector3();

// anti-choppiness: speed-adaptive landmark smoothing (heavy when still so
// jitter dies, light when moving fast so waves stay snappy), visibility
// hysteresis + a short hold so arms don't flap between tracked and idle,
// and duplicate webcam frames are skipped instead of re-solved.
// OFF at 0.45: half-occluded wrists (hands on a desk) used to keep "tracking"
// noisy guesses — a stable idle pose reads better than shaky tracking
const ARM_VIS_ON = 0.55, ARM_VIS_OFF = 0.45, ARM_HOLD_MS = 600;
const armSmooth = {
  left: { S: new THREE.Vector3(), E: new THREE.Vector3(), W: new THREE.Vector3(), has: false, seenT: 0 },
  right: { S: new THREE.Vector3(), E: new THREE.Vector3(), W: new THREE.Vector3(), has: false, seenT: 0 },
};
let lastVideoTime = -1;

// torso: the shoulder line (landmarks 11/12) drives twist (yaw) and side
// lean (roll); hips→shoulders (23/24) drives forward lean (pitch) when the
// hips are actually in frame. Angles are computed in avatar visual space and
// converted to rig space on application (same 180°-Y-flipped rig frame as
// the arm solver: pitch and roll flip sign, yaw survives).
const TORSO_GAIN = { yaw: 0.9, roll: 0.9, pitch: 0.7 };
const TORSO_MAX = { yaw: 0.6, roll: 0.35, pitch: 0.35 };
const torsoTgt = { yaw: 0, roll: 0, pitch: 0 };
const torsoCur = { yaw: 0, roll: 0, pitch: 0 };
const torsoRig = { x: 0, y: 0, z: 0 }; // rig-space euler actually applied this frame
let torsoTracked = false, torsoSeenT = 0, torsoDbg = false;
const tSL = new THREE.Vector3(), tSR = new THREE.Vector3();
const tS = new THREE.Vector3(), tSC = new THREE.Vector3(), tHC = new THREE.Vector3();
const clampA = (v, m) => Math.min(m, Math.max(-m, v));

function smoothPt(cur, target, dtp, conf = 1) {
  // displacement-based response, NOT velocity-based: landmark jitter reads as
  // high "speed" and would let itself through a velocity gate (hands resting
  // on a desk visibly shook). Inside the ~2cm noise band the point barely
  // moves at all; past it, response ramps up fast so waves stay crisp.
  // conf (from landmark visibility) scales the whole response: marginally
  // visible wrists get sluggish tracking instead of twitchy guesses.
  const d = pTmp.copy(target).sub(cur).length();
  const rate = (2.5 + (d < 0.015 ? 0 : Math.min(33.5, (d - 0.015) * 320))) * conf;
  cur.lerp(target, 1 - Math.exp(-rate * dtp));
}

function pollPose(now) {
  if (arms.left.dbgLock || arms.right.dbgLock) return;
  if (!poseLandmarker || !video || video.readyState < 2 || !ui.arms.checked) {
    arms.left.tracked = arms.right.tracked = false;
    armSmooth.left.has = armSmooth.right.has = false;
    torsoTracked = false;
    return;
  }
  if (now - lastPoseT > 1500) {
    arms.left.tracked = arms.right.tracked = false;
    armSmooth.left.has = armSmooth.right.has = false;
    torsoTracked = false;
  }
  if (video.currentTime === lastVideoTime) return; // no new webcam frame yet
  const dtp = Math.min(0.1, Math.max(1e-3, video.currentTime - lastVideoTime));
  lastVideoTime = video.currentTime;
  const res = poseLandmarker.detectForVideo(video, now);
  const wl = res.worldLandmarks?.[0];
  const nl = res.landmarks?.[0];
  if (!wl) return; // stale-pose fallback above handles long droughts
  lastPoseT = now;
  const mirror = ui.mirror.checked;
  // world landmarks are meters, hip-centered: x = image-right, y = down,
  // z = away from camera. Avatar space: +X = avatar's left, +Y up, +Z toward
  // camera. Mirror mode drives the avatar's opposite arm and flips x, so the
  // avatar moves like your reflection.
  const xs = mirror ? -1 : 1;
  for (const personSide of ['left', 'right']) {
    const avatarSide = mirror ? (personSide === 'left' ? 'right' : 'left') : personSide;
    const a = arms[avatarSide], sm = armSmooth[avatarSide];
    const [iS, iE, iW] = POSE_LM[personSide];
    const vis = Math.min(
      wl[iS].visibility ?? nl?.[iS]?.visibility ?? 1,
      wl[iE].visibility ?? nl?.[iE]?.visibility ?? 1,
      wl[iW].visibility ?? nl?.[iW]?.visibility ?? 1,
    );
    if (vis >= (a.tracked ? ARM_VIS_OFF : ARM_VIS_ON)) {
      sm.seenT = now;
      pV[0].set(xs * wl[iS].x, -wl[iS].y, -wl[iS].z);
      pV[1].set(xs * wl[iE].x, -wl[iE].y, -wl[iE].z);
      pV[2].set(xs * wl[iW].x, -wl[iW].y, -wl[iW].z);
      if (!sm.has) {
        sm.S.copy(pV[0]); sm.E.copy(pV[1]); sm.W.copy(pV[2]);
        sm.has = true;
      } else {
        const conf = Math.min(1, Math.max(0.15, (vis - 0.4) / 0.4));
        smoothPt(sm.S, pV[0], dtp, conf);
        smoothPt(sm.E, pV[1], dtp, conf);
        smoothPt(sm.W, pV[2], dtp, conf);
      }
      a.tracked = solveArm(avatarSide, sm.S, sm.E, sm.W);
    } else if (a.tracked && now - sm.seenT < ARM_HOLD_MS) {
      // brief dropout: hold the last pose instead of snapping to idle
    } else {
      a.tracked = false;
      sm.has = false;
    }
  }

  // torso targets from the same pose result
  if (!torsoDbg) {
    const tv = i => wl[i].visibility ?? nl?.[i]?.visibility ?? 1;
    const visSh = Math.min(tv(11), tv(12));
    if (visSh >= (torsoTracked ? ARM_VIS_OFF : ARM_VIS_ON)) {
      torsoTracked = true;
      torsoSeenT = now;
      tSL.set(xs * wl[11].x, -wl[11].y, -wl[11].z);
      tSR.set(xs * wl[12].x, -wl[12].y, -wl[12].z);
      // under mirror the person's right shoulder acts as the avatar's left,
      // same swap as the arms
      const al = mirror ? tSR : tSL, ar = mirror ? tSL : tSR;
      tS.copy(al).sub(ar); // avatar-left shoulder minus avatar-right shoulder
      const horiz = Math.hypot(tS.x, tS.z);
      if (horiz > 1e-4) {
        torsoTgt.yaw = clampA(Math.atan2(-tS.z, tS.x) * TORSO_GAIN.yaw, TORSO_MAX.yaw);
        torsoTgt.roll = clampA(Math.atan2(tS.y, horiz) * TORSO_GAIN.roll, TORSO_MAX.roll);
      }
      const visHip = Math.min(tv(23), tv(24));
      if (visHip >= 0.5) {
        tHC.set(xs * (wl[23].x + wl[24].x) / 2, -(wl[23].y + wl[24].y) / 2, -(wl[23].z + wl[24].z) / 2);
        tSC.copy(tSL).add(tSR).multiplyScalar(0.5).sub(tHC); // hips → shoulders
        if (tSC.y > 1e-3) torsoTgt.pitch = clampA(Math.atan2(tSC.z, tSC.y) * TORSO_GAIN.pitch, TORSO_MAX.pitch);
      } else {
        // hips out of frame (desk framing): forward lean comes from the face
        // distance instead of the hips→shoulders vector
        torsoTgt.pitch = faceSeen ? leanPitch : torsoTgt.pitch * 0.98;
      }
    } else if (torsoTracked && now - torsoSeenT < ARM_HOLD_MS) {
      // brief dropout: hold the last pose instead of snapping upright
    } else {
      torsoTracked = false;
    }
  }
}

// ---------- microphone (shared by "mic mouth" and the recorder) ----------
// The stream is requested lazily, always from a click, so the browser's
// permission prompt appears in response to the user's own action.
let analyser = null, micData = null, micPeak = 0.02, micStream = null;
async function getMicStream() {
  if (!micStream) micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return micStream;
}
async function ensureMic() {
  if (DEMO || analyser) return;
  try {
    const stream = await getMicStream();
    const ctx = new AudioContext();
    const srcNode = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    srcNode.connect(analyser);
    micData = new Float32Array(analyser.fftSize);
    addEventListener('click', () => ctx.resume(), { once: true });
  } catch (e) {
    console.warn('mic unavailable:', e);
    ui.micMouth.checked = false;
    // surface WHY, instead of silently unchecking the box
    status(e.name === 'NotAllowedError'
      ? 'mic blocked — click the padlock by the address bar and allow the microphone'
      : 'no microphone found (' + (e.name || e.message || e) + ')');
  }
}
if (ui.micMouth.checked) ensureMic();
ui.micMouth.addEventListener('change', () => { if (ui.micMouth.checked) ensureMic(); });
function micLevel() {
  if (!analyser) return 0;
  analyser.getFloatTimeDomainData(micData);
  let sum = 0;
  for (let i = 0; i < micData.length; i++) sum += micData[i] * micData[i];
  const rms = Math.sqrt(sum / micData.length);
  micPeak = Math.max(rms, micPeak * 0.999, 0.02); // slow auto-gain
  return Math.min(1, rms / micPeak);
}

// ---------- voice fx (lite) ----------
// off / deep / robot / cute — changes the voice in ⏺ recordings. Deep/cute
// pitch-shift through a tiny granular AudioWorklet (two crossfading read
// heads on a delay line); robot is a ring modulator; cute adds a 6Hz warble.
// The mouth tracker keeps the raw mic. Casual disguise, not privacy-grade —
// a real voice privacy tool is a later project.
const voiceSel = document.getElementById('voice');
voiceSel.value = localStorage.getItem('trk_voice') || 'off';
if (![...voiceSel.options].some(o => o.value === voiceSel.value)) voiceSel.value = 'off';
voiceSel.addEventListener('change', () => localStorage.setItem('trk_voice', voiceSel.value));

const PITCH_WORKLET = "registerProcessor('pitchshift', class extends AudioWorkletProcessor {" +
  "static get parameterDescriptors() { return [{ name: 'ratio', defaultValue: 1, minValue: 0.5, maxValue: 2 }]; }" +
  "constructor() { super(); this.N = 16384; this.buf = new Float32Array(this.N); this.w = 0; this.phase = 0; this.G = 3200; }" +
  "process(inputs, outputs, params) {" +
  "  const inp = inputs[0], out = outputs[0];" +
  "  if (!inp.length || !out.length) return true;" +
  "  const x = inp[0], ratio = params.ratio[0], N = this.N, G = this.G;" +
  "  for (let i = 0; i < x.length; i++) {" +
  "    this.buf[this.w] = x[i];" +
  "    this.phase = (((this.phase + 1 - ratio) % G) + G) % G;" + // read-head drift: delay shrinks for pitch-up, grows for pitch-down
  "    const p1 = this.phase, p2 = (p1 + G / 2) % G;" +
  "    const f1 = 1 - Math.abs(p1 / G * 2 - 1);" + // triangle crossfade masks the delay-line wraps
  "    const s = this.buf[(this.w - 1 - Math.floor(p1) + N) % N] * f1" +
  "            + this.buf[(this.w - 1 - Math.floor(p2) + N) % N] * (1 - f1);" +
  "    for (const ch of out) if (ch) ch[i] = s;" +
  "    this.w = (this.w + 1) % N;" +
  "  }" +
  "  return true;" +
  "}});";
const VOICE_RATIO = { deep: 0.78, cute: 1.32 };
let vfxCtx = null, vfxLive = null;

function cleanupVoice() {
  if (!vfxLive) return;
  for (const o of vfxLive.oscs) { try { o.stop(); } catch {} }
  for (const n of vfxLive.nodes) { try { n.disconnect(); } catch {} }
  vfxLive = null;
  vfxCtx?.suspend();
}

// raw mic stream in → audio tracks for the recorder (processed, or raw when
// the effect is off or WebAudio fails — never block the recording itself)
async function voiceTracks(rawStream) {
  const mode = voiceSel.value;
  if (mode === 'off' || !rawStream.getAudioTracks().length) return rawStream.getAudioTracks();
  try {
    if (!vfxCtx) {
      vfxCtx = new AudioContext();
      await vfxCtx.audioWorklet.addModule(
        URL.createObjectURL(new Blob([PITCH_WORKLET], { type: 'text/javascript' })));
    }
    cleanupVoice();
    vfxCtx.resume();
    const nodes = [], oscs = [];
    let node = vfxCtx.createMediaStreamSource(rawStream);
    nodes.push(node);
    if (VOICE_RATIO[mode]) {
      const ps = new AudioWorkletNode(vfxCtx, 'pitchshift');
      ps.parameters.get('ratio').value = VOICE_RATIO[mode];
      node.connect(ps); nodes.push(ps); node = ps;
    }
    if (mode === 'robot') {
      // ring mod: out = in × (0.25 + 0.75·sin 42Hz) — dry floor keeps it intelligible
      const ring = vfxCtx.createGain(); ring.gain.value = 0.25;
      const osc = vfxCtx.createOscillator(); osc.frequency.value = 42;
      const depth = vfxCtx.createGain(); depth.gain.value = 0.75;
      osc.connect(depth).connect(ring.gain); osc.start();
      node.connect(ring); nodes.push(ring, depth); oscs.push(osc); node = ring;
    }
    if (mode === 'cute') {
      // gentle 6Hz tremolo on top of the pitch-up
      const trem = vfxCtx.createGain(); trem.gain.value = 0.85;
      const lfo = vfxCtx.createOscillator(); lfo.frequency.value = 6;
      const depth = vfxCtx.createGain(); depth.gain.value = 0.15;
      lfo.connect(depth).connect(trem.gain); lfo.start();
      node.connect(trem); nodes.push(trem, depth); oscs.push(lfo); node = trem;
    }
    const dest = vfxCtx.createMediaStreamDestination();
    node.connect(dest); nodes.push(dest);
    vfxLive = { nodes, oscs };
    return dest.stream.getAudioTracks();
  } catch (e) {
    console.warn('voice fx unavailable, recording the raw mic:', e);
    return rawStream.getAudioTracks();
  }
}
window.__vfx = voiceTracks; // debug: feed a synthetic stream through the chain

// ---------- recording (avatar + background → .webm download) ----------
// Composites the WebGL canvas over the current background on a 2D canvas and
// records that with MediaRecorder. Only costs anything while recording.
let recorder = null, recCanvas = null, recCtx = null, recBgImg = null, recChunks = [], recTimer = 0;
const REC_MAX_MS = 120_000; // auto-stop safety cap
const REC_COLORS = { green: '#00ff00', magenta: '#ff00ff', white: '#ffffff', black: '#000000' };

function recDraw() {
  const src = renderer.domElement;
  if (!src.width || !src.height) return;
  if (recCanvas.width !== src.width || recCanvas.height !== src.height) {
    recCanvas.width = src.width;
    recCanvas.height = src.height;
  }
  const cw = recCanvas.width, ch = recCanvas.height;
  recCtx.clearRect(0, 0, cw, ch);
  const bgi = bgSel.value === 'smiley' ? smileyImg : (bgSel.value === 'image' ? recBgImg : null);
  if (bgi?.complete && bgi.naturalWidth) {
    const k = Math.max(cw / bgi.naturalWidth, ch / bgi.naturalHeight); // cover
    const dw = bgi.naturalWidth * k, dh = bgi.naturalHeight * k;
    recCtx.drawImage(bgi, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  } else if (REC_COLORS[bgSel.value]) {
    recCtx.fillStyle = REC_COLORS[bgSel.value];
    recCtx.fillRect(0, 0, cw, ch);
  } // transparent bg records as-is (shows black in most players)
  recCtx.drawImage(src, 0, 0);
}

function updateRecUi() {
  const on = !!recorder;
  const pb = document.getElementById('recordBtn');
  pb.textContent = on ? '■ stop' : '● record';
  pb.classList.toggle('rec', on);
  const bb = bigbar.querySelector('[data-act=record]');
  bb.textContent = on ? '⏹ Stop' : '⏺ Record';
  bb.classList.toggle('rec', on);
}

async function toggleRecord() {
  if (recorder) { recorder.stop(); return; }
  // grab the mic so clips have voice; this click is the user gesture that
  // triggers the permission prompt if it wasn't granted yet. Declining (or
  // having no mic) just records silent video.
  let audio = [];
  let micHint = '';
  if (!DEMO) {
    try { audio = await voiceTracks(await getMicStream()); }
    catch (e) {
      console.warn('recording without mic:', e);
      if (e.name === 'NotAllowedError') micHint = ' — mic blocked; allow it via the padlock by the address bar';
    }
  }
  // mp4 first — it plays everywhere (phones, Windows, messaging apps); webm
  // only as a fallback for browsers that can't record mp4
  const mimes = audio.length
    ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4',
       'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    : ['video/mp4;codecs=avc1.42E01E', 'video/mp4',
       'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mime = mimes.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
  if (!mime) { status('recording not supported in this browser'); return; }
  const recExt = mime.includes('mp4') ? 'mp4' : 'webm';
  const recType = mime.split(';')[0];
  recCanvas = document.createElement('canvas');
  recCanvas.width = renderer.domElement.width || 2;
  recCanvas.height = renderer.domElement.height || 2;
  recCtx = recCanvas.getContext('2d');
  recBgImg = null;
  if (bgSel.value === 'image' && bgImage) { recBgImg = new Image(); recBgImg.src = bgImage; }
  recChunks = [];
  const stream = new MediaStream([...recCanvas.captureStream(30).getVideoTracks(), ...audio]);
  recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  recorder.ondataavailable = e => { if (e.data.size) recChunks.push(e.data); };
  recorder.onstop = () => {
    clearTimeout(recTimer);
    cleanupVoice();
    const blob = new Blob(recChunks, { type: recType });
    recChunks = [];
    recorder = null;
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const a = document.createElement('a');
    a.download = `milady-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${recExt}`;
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    status(camStatus);
    updateRecUi();
  };
  recorder.start(250);
  recTimer = setTimeout(() => recorder?.stop(), REC_MAX_MS);
  status(audio.length
    ? `recording (mic on${voiceSel.value !== 'off' ? ', ' + voiceSel.value + ' voice' : ''})… 2 min max`
    : `recording (no mic${micHint})… 2 min max`);
  updateRecUi();
}
document.getElementById('recordBtn').addEventListener('click', toggleRecord);
bigbar.querySelector('[data-act=record]').addEventListener('click', toggleRecord);

// ---------- animation loop ----------
const qIdentity = new THREE.Quaternion();
const qArmTmp = new THREE.Quaternion(), eArmTmp = new THREE.Euler();
const demoS = new THREE.Vector3(), demoE = new THREE.Vector3(), demoW = new THREE.Vector3();
const clamp01 = v => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
let curBlink = 0, curAa = 0, curIh = 0;
let autoBlinkT = 0;
// mouth state machine: patches are on/off, so decide crisply instead of blending
let jawFloor = 0.05, mouthState = 0, lastSwitch = 0; // 0 closed, 1 small, 2 big
const clock = new THREE.Clock();
window.__mouthDbg = () => JSON.stringify({ mouthState, jawFloor: +jawFloor.toFixed(3), curAa: +curAa.toFixed(2), curIh: +curIh.toFixed(2) });

function frame() {
  requestAnimationFrame(frame);
  tick(clock.getDelta(), clock.elapsedTime, performance.now());
}

let poseFrameFlip = false;
function tick(dt, t, now) {

  pollFace(now);
  // phones: pose every other frame (face stays full-rate — mouth/blink sync
  // is what people notice; arms at 30Hz are indistinguishable after smoothing)
  poseFrameFlip = !poseFrameFlip;
  if (!MOBILE || poseFrameFlip) pollPose(now);

  let targetBlink = 0, jaw = 0;
  if (DEMO) {
    targetBlink = (Math.sin(t * 2.1) > 0.92) ? 1 : 0;
    jaw = clamp01(Math.sin(t * 3.0) * 0.5 + 0.35);
    qTarget.setFromEuler(new THREE.Euler(Math.sin(t * 0.9) * 0.12, Math.sin(t * 0.6) * 0.3, Math.sin(t * 0.4) * 0.06));
    // wave the left arm to exercise the arm solver; right arm stays idle
    demoS.set(0.13, 0.99, 0);
    demoE.set(0.34, 1.08 + 0.04 * Math.sin(t * 3), 0.06);
    demoW.set(0.30 + 0.06 * Math.sin(t * 3), 1.30, 0.12 + 0.05 * Math.cos(t * 3));
    if (!arms.left.dbgLock) arms.left.tracked = ui.arms.checked && solveArm('left', demoS, demoE, demoW);
    // slow torso sway/twist to exercise the torso path too
    if (!torsoDbg) {
      torsoTracked = true;
      torsoTgt.yaw = Math.sin(t * 0.5) * 0.3;
      torsoTgt.roll = Math.sin(t * 0.8) * 0.12;
      torsoTgt.pitch = Math.sin(t * 0.35) * 0.15;
    }
    // gentle whole-body drift to exercise the lean path
    leanTgt.x = Math.sin(t * 0.5) * 0.10;
    leanTgt.y = Math.sin(t * 1.7) * 0.015;
    leanTgt.z = Math.sin(t * 0.33) * 0.12;
  } else if (faceSeen) {
    // generous threshold: partial blink scores still count as a blink
    targetBlink = clamp01((trackBlink - 0.25) * 3.0);
    if (ui.camMouth.checked) {
      // auto-calibrate: jawFloor tracks YOUR closed-mouth baseline
      jawFloor = Math.min(trackJaw, jawFloor + dt * 0.015);
      // funnel catches rounded vowels ("oo"/"oh") where the jaw barely drops
      jaw = clamp01(((trackJaw - jawFloor) + 0.35 * trackFunnel) * 1.9 * MOUTH_SENS);
    }
  } else {
    // idle: auto blink every ~4s, head returns to neutral
    autoBlinkT += dt;
    if (autoBlinkT > 4) { autoBlinkT = -0.15; }
    targetBlink = autoBlinkT < 0 ? 1 : 0;
    qTarget.identity();
  }
  if (!DEMO && ui.micMouth.checked) {
    jaw = Math.max(jaw, micLevel() * 0.9);
  }

  // mouth: closed / small / big with hysteresis + short hold, so it flaps
  // decisively instead of flickering at the thresholds
  let ms = mouthState;
  if (ms === 0) { if (jaw > 0.45) ms = 2; else if (jaw > 0.12) ms = 1; }
  else if (ms === 1) { if (jaw > 0.50) ms = 2; else if (jaw < 0.07) ms = 0; }
  else { if (jaw < 0.32) ms = (jaw < 0.07) ? 0 : 1; }
  if (ms !== mouthState && now - lastSwitch > 60) { mouthState = ms; lastSwitch = now; }
  const aaT = mouthState === 2 ? 1 : 0;
  const ihT = mouthState === 1 ? 1 : 0;

  // fast attack, slower release. The patch morphs only become visible above
  // ~0.87 weight, so the attack must outrun a real blink (~100-150ms) or
  // blinks get silently swallowed.
  curBlink = lerp(curBlink, targetBlink, Math.min(1, dt * (targetBlink > curBlink ? 45 : 22)));
  curAa = lerp(curAa, aaT, Math.min(1, dt * (aaT > curAa ? 32 : 16)));
  curIh = lerp(curIh, ihT, Math.min(1, dt * (ihT > curIh ? 32 : 16)));

  if (expr) {
    expr.setValue('blink', curBlink);
    expr.setValue('aa', curAa);
    expr.setValue('ih', curIh);
  }
  if (mouthTex) {
    // canvas-mouth models: swap the mouth texture by state (crisp, like the
    // patch morphs on the default model)
    const f = mouthTex.frames[mouthState] || mouthTex.frames[0];
    if (mouthTex.cur !== f) {
      mouthTex.cur = f;
      for (const m of mouthTex.mats) m.map = f;
    }
  }

  // torso: tracked twist/lean eased in (and eased back out when the pose is
  // lost), spread up the spine chain, breathing sway layered on the spine.
  // Visual→rig conversion: pitch and roll flip sign, yaw doesn't.
  {
    const tracked = torsoTracked || torsoDbg;
    const k = 1 - Math.exp(-dt * 8);
    torsoCur.yaw += ((tracked ? torsoTgt.yaw : 0) - torsoCur.yaw) * k;
    torsoCur.roll += ((tracked ? torsoTgt.roll : 0) - torsoCur.roll) * k;
    // no pose tracking (arms off / pose model missing): the face-lean pitch
    // still keeps forward/back leaning alive
    const pitchTgt = tracked ? torsoTgt.pitch : (faceSeen ? leanPitch : 0);
    torsoCur.pitch += (pitchTgt - torsoCur.pitch) * k;
    torsoRig.x = -torsoCur.pitch; torsoRig.y = torsoCur.yaw; torsoRig.z = -torsoCur.roll;
    for (const [bone, w] of torsoBones) {
      bone.rotation.set(torsoRig.x * w, torsoRig.y * w, torsoRig.z * w, 'YXZ');
    }
    if (spineBone) {
      spineBone.rotation.x += Math.sin(t * 1.3) * 0.012;
      spineBone.rotation.z += Math.sin(t * 0.7) * 0.008;
    }
  }
  // head: 70% head, 30% neck — with the torso rotation subtracted first,
  // since the head bones inherit it and the face target is absolute (the
  // camera already sees your head move with your body)
  if (headBone) {
    qTorsoTmp.setFromEuler(eTorsoTmp.set(torsoRig.x, torsoRig.y, torsoRig.z, 'YXZ'));
    qCompTmp.copy(qTorsoTmp).invert().multiply(qTarget);
    qHeadTmp.identity().slerp(qCompTmp, 0.7);
    qNeckTmp.identity().slerp(qCompTmp, 0.3);
    headBone.quaternion.slerp(qHeadTmp, Math.min(1, dt * 14));
    neckBone?.quaternion.slerp(qNeckTmp, Math.min(1, dt * 10));
  }
  // arms: tracked → follow webcam pose; untracked → relaxed idle with sway
  for (const side of ['left', 'right']) {
    const a = arms[side];
    if (!a || !a.upper || !a.lower) continue;
    if (a.tracked) {
      // angular displacement gate: sub-degree target wobble drifts instead of
      // snapping, so residual solver noise never reaches the mesh
      const ang = Math.max(a.upper.quaternion.angleTo(a.tUpper),
                           a.lower.quaternion.angleTo(a.tLower));
      const k = Math.min(1, dt * (2.5 + Math.min(12, Math.max(0, ang - 0.02) * 300)));
      a.upper.quaternion.slerp(a.tUpper, k);
      a.lower.quaternion.slerp(a.tLower, k);
      // hand stays aligned with the forearm (no finger/wrist articulation)
      if (a.hand) a.hand.quaternion.slerp(qIdentity, k);
    } else {
      const k = Math.min(1, dt * 6);
      const sway = Math.sin(t * 1.1) * 0.02 * a.sign;
      a.upper.quaternion.slerp(qArmTmp.setFromEuler(eArmTmp.set(0, 0, 1.15 * a.sign + sway)), k);
      a.lower.quaternion.slerp(qArmTmp.setFromEuler(eArmTmp.set(0, 0, 0.25 * a.sign)), k);
      if (a.hand) a.hand.quaternion.slerp(qArmTmp.setFromEuler(eArmTmp.set(0, 0, 0.10 * a.sign)), k);
    }
  }

  // whole-body sway from the head's tracked position. The applied offset is
  // hard-capped to a fraction of the VISIBLE frame at the camera's current
  // distance/aspect — whatever the zoom, the avatar can never drift off
  // screen; it just leans against the edge of its allowance.
  {
    const on = DEMO || faceSeen;
    const kl = 1 - Math.exp(-dt * 6);
    leanCur.x += ((on ? leanTgt.x : 0) - leanCur.x) * kl;
    leanCur.y += ((on ? leanTgt.y : 0) - leanCur.y) * kl;
    leanCur.z += ((on ? leanTgt.z : 0) - leanCur.z) * kl;
    const dist = Math.max(0.2, camera.position.z);
    const halfH = Math.tan(THREE.MathUtils.degToRad(15)) * dist; // fov is 30
    const halfW = halfH * Math.max(0.3, camera.aspect || 1);
    vrm.scene.position.set(
      clampA(leanCur.x * camS, Math.min(LEAN_MAX.x * camS, 0.25 * halfW)),
      clampA(leanCur.y * camS, Math.min(LEAN_MAX.y * camS, 0.18 * halfH)),
      clampA(leanCur.z * camS, Math.min(LEAN_MAX.z * camS, 0.25 * dist)));
  }

  updateParticles(fxSparkles, dt, t);
  updateParticles(fxHearts, dt, t);

  vrm.update(dt);
  if (fisheyeOn) composer.render();
  else renderer.render(scene, camera);
  if (recorder) recDraw();
}
frame();

// guard: if loaded while hidden (0x0), fix size once real dimensions appear
const sizeGuard = setInterval(() => {
  if (innerWidth > 0 && renderer.domElement.width === 0) {
    dispatchEvent(new Event('resize'));
  } else if (renderer.domElement.width > 0) {
    clearInterval(sizeGuard);
  }
}, 500);

// debug: feed the arm solver synthetic avatar-space points (arrays [x,y,z])
window.__setArm = (side, S, E, W) => {
  arms[side].dbgLock = true;
  arms[side].tracked = solveArm(side,
    new THREE.Vector3(...S), new THREE.Vector3(...E), new THREE.Vector3(...W));
  return arms[side].tracked;
};

// debug: force torso angles (visual-space radians); __clearTorso() releases
window.__setTorso = (pitch = 0, yaw = 0, roll = 0) => {
  torsoDbg = true;
  torsoTgt.pitch = pitch; torsoTgt.yaw = yaw; torsoTgt.roll = roll;
};
window.__clearTorso = () => { torsoDbg = false; };

// debug: force a canvas size (hidden windows report innerWidth 0)
window.__resize = (w = 640, h = 800) => {
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  fisheyePass.uniforms.aspect.value = w / h;
  applyCamera();
};

// debug: step the animation manually (rAF doesn't fire in hidden windows)
let dbgT = 0, dbgNow = 0;
window.__tick = (steps = 1, dt = 1 / 60) => {
  for (let i = 0; i < steps; i++) { dbgT += dt; dbgNow += dt * 1000; tick(dt, dbgT, dbgNow); }
};

// debug: world-space bone heights on the raw (posed) skeleton
window.__bones = () => {
  vrm.scene.updateMatrixWorld(true);
  const p = {};
  for (const n of ['head', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand', 'hips']) {
    const b = vrm.humanoid.getRawBoneNode(n);
    if (b) {
      const v = new THREE.Vector3();
      b.getWorldPosition(v);
      p[n] = [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
    }
  }
  return JSON.stringify(p);
};

// debug: access to live objects for console exploration
window.__debug = { get vrm() { return vrm; }, get scene() { return scene; }, get mouthTex() { return mouthTex; }, renderer, camera, THREE };

// debug: count pixels that differ between two expression sets
window.__diff = (exprA, exprB) => {
  const gl = renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const grab = (set) => {
    if (expr) for (const n of ['aa', 'ih', 'blink']) expr.setValue(n, set[n] || 0);
    vrm.update(1 / 60);
    renderer.render(scene, camera);
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  };
  const a = grab(exprA), b = grab(exprB);
  let n = 0, minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 12) {
      n++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return JSON.stringify({ size: [w, h], diffPx: n, bboxFlippedY: n ? [minX, minY, maxX, maxY] : null });
};

// debug: render a frame now and report where opaque pixels are
window.__snap = (exprSet) => {
  if (exprSet && expr) {
    for (const [k, v] of Object.entries(exprSet)) expr.setValue(k, v);
    vrm.update(1 / 60);
  }
  renderer.render(scene, camera);
  const gl = renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  let minX = w, maxX = 0, minY = h, maxY = 0, n = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (px[(y * w + x) * 4 + 3] > 10) {
        n++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  // average color of the central 10% region (remember: readPixels y is flipped)
  let r = 0, g = 0, b = 0, m = 0;
  for (let y = Math.floor(h * 0.45); y < h * 0.55; y += 2) {
    for (let x = Math.floor(w * 0.45); x < w * 0.55; x += 2) {
      const i = (y * w + x) * 4;
      if (px[i + 3] > 10) { r += px[i]; g += px[i + 1]; b += px[i + 2]; m++; }
    }
  }
  return JSON.stringify({
    size: [w, h], coveragePct: Math.round(400 * n / (w * h)),
    bboxPctFlippedY: [Math.round(100 * minX / w), Math.round(100 * minY / h), Math.round(100 * maxX / w), Math.round(100 * maxY / h)],
    centerAvgRGB: m ? [Math.round(r / m), Math.round(g / m), Math.round(b / m)] : null,
  });
};
