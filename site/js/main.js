import * as THREE from '../vendor/three/build/three.module.min.js';
import { STOPS, CARS, stopIndexAt, stopIndex, activity, clamp01 } from './stops.js';
import { createScroll } from './scroll.js';
import { buildLot } from './lot.js';
import { createPost } from './post.js';
import { buildChapters, buildCarousel, createDetail } from './ui.js';

const html = document.documentElement;
const params = new URLSearchParams(location.search);

// ---- camera path: every stop's local keys flattened into one spline over global progress
const KEYS = STOPS.flatMap((s) => s.cam.map(([t, pos, look]) => [s.start + t * (s.end - s.start), pos, look]));
const curve = (i) => new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[i])), false, 'centripetal');
const posCurve = curve(1), lookCurve = curve(2);
function cameraAt(p, outPos, outLook) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
  const t = clamp01((p - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]));
  const u = (i + t) / (KEYS.length - 1);
  posCurve.getPoint(u, outPos);
  lookCurve.getPoint(u, outLook);
}

function hasWebGL2() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

buildChapters();
const chapters = STOPS.map((s) => document.getElementById(s.id));
let scroll = null;

// Carousel and buttons go through here: a car id, +1/-1 for next/previous, or 'next'.
function go(target) {
  if (!scroll) {
    const node = document.getElementById(typeof target === 'string' && target !== 'next' ? target : 'lot');
    if (node) node.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (target === 'next' || target === 1) return scroll.step(1);
  if (target === -1) return scroll.step(-1);
  const i = stopIndex(target);
  if (i >= 0) scroll.jumpTo(STOPS[i].hold);
}
const markCar = buildCarousel(go);
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href').slice(1);
  if (scroll && (stopIndex(id) >= 0 || id === 'lot')) { e.preventDefault(); go(id === 'lot' ? CARS[0].id : id); }
}));

let detailK = 0, detailTarget = 0;
const detail = createDetail({
  onOpen: (car) => {
    detailTarget = 1;
    if (scroll) { scroll.locked = true; scroll.jumpTo(STOPS[stopIndex(car.id)].hold); }
    markCar(car.id);
  },
  onClose: () => { detailTarget = 0; if (scroll) scroll.locked = false; },
});

async function boot() {
  const isLow = innerWidth < 800 || (navigator.hardwareConcurrency || 4) <= 4;
  const canvas = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.3, 900);

  const fill = document.getElementById('loader-fill');
  const count = document.getElementById('loader-count');
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, done, total) => { fill.style.transform = `scaleX(${done / total})`; count.textContent = `${done} / ${total}`; };
  await Promise.race([Promise.all([document.fonts.load('600 40px "Space Grotesk"'), document.fonts.load('700 40px "Space Grotesk"'), document.fonts.load('500 20px "JetBrains Mono"'), document.fonts.load('700 20px "JetBrains Mono"')]), new Promise((r) => setTimeout(r, 2500))]);

  const lot = await buildLot({ scene, manager, isLow });
  const fromHash = location.hash.replace(/^#(detail-)?/, '');
  const startIdx = Math.max(0, stopIndex(fromHash));
  scroll = createScroll(STOPS[startIdx].hold);
  const post = createPost(renderer, scene, camera, isLow);

  const portrait = () => innerWidth / innerHeight < 0.9;
  function applyView(k) {
    const w = innerWidth, h = innerHeight;
    // keep the bay clear of the copy: right of centre on wide screens (left when the panel is open), above it on phones
    if (portrait()) camera.setViewOffset(w, h, 0, h * (0.24 - 0.24 * k), w, h);
    else camera.setViewOffset(w, h, -w * (0.15 - 0.38 * k), 0, w, h);
    camera.updateProjectionMatrix();
  }
  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isLow ? 1.25 : 1.75));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.fov = portrait() ? 64 : 40;
    camera.aspect = innerWidth / innerHeight;
    applyView(detailK);
    post.setSize();
  }
  addEventListener('resize', resize);
  resize();

  // hotspot: a "+" pinned to the active bay's panel, opens the car's detail
  const hotspots = document.getElementById('hotspots');
  const hot = document.createElement('button');
  hot.type = 'button';
  hot.className = 'hotspot';
  hot.append(document.createElement('i'), document.createElement('span'));
  hotspots.append(hot);
  hot.addEventListener('click', () => { const s = STOPS[stopIndexAt(scroll.value)]; if (s.car) detail.open(s.car.id); });

  // tap/click a panel to open it; hover shows its name
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickLabel = document.getElementById('pick-label');
  const pickAt = (x, y) => {
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(lot.picks, false)[0];
    return hit && hit.distance < 60 ? STOPS[hit.object.userData.stop] : null;
  };
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
    const s = pickAt(e.clientX, e.clientY);
    if (s) detail.open(s.car.id);
  });
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX / innerWidth - 0.5;
    pointer.y = e.clientY / innerHeight - 0.5;
    const s = e.target === canvas ? pickAt(e.clientX, e.clientY) : null;
    document.body.classList.toggle('can-pick', !!s);
    pickLabel.classList.toggle('show', !!s);
    if (s) { pickLabel.textContent = `${s.car.model} ${s.car.trim}`; pickLabel.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 12}px)`; }
  }, { passive: true });

  const hud = document.getElementById('hud-label');
  const hudFill = document.getElementById('hud-fill');
  const pos = new THREE.Vector3(), look = new THREE.Vector3(), right = new THREE.Vector3(), fwd = new THREE.Vector3(), v = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  let last = performance.now(), time = 0, raf = 0, lastIdx = -1;

  function step(dt, draw) {
    time += dt;
    scroll.update(dt);
    const p = scroll.value;
    detailK += (detailTarget - detailK) * Math.min(1, dt * 4);
    if (Math.abs(detailK - detailTarget) < 1e-3) detailK = detailTarget;
    applyView(detailK);

    cameraAt(p, pos, look);
    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 2.5);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 2.5);
    fwd.copy(look).sub(pos).normalize();
    right.crossVectors(fwd, UP).normalize();
    camera.position.copy(pos).addScaledVector(right, pointer.sx * 0.9);
    camera.position.y += -pointer.sy * 0.4 + Math.sin(time * 0.5) * 0.04;
    camera.lookAt(look);
    camera.updateMatrixWorld();

    const idx = stopIndexAt(p);
    const a = activity(idx, p);
    lot.update(dt, time, p, idx, a);

    chapters.forEach((ch, i) => {
      const k = i === idx ? a * (1 - detailK) : 0;
      ch.style.opacity = k.toFixed(3);
      ch.style.visibility = k > 0.01 ? 'visible' : 'hidden';
      ch.style.transform = `translateY(${(1 - k) * 18}px)`;
      ch.classList.toggle('is-active', k > 0.5);
    });
    if (idx !== lastIdx) {
      lastIdx = idx;
      const s = STOPS[idx];
      hud.textContent = s.car ? `${String(s.index + 1).padStart(2, '0')} OF ${CARS.length} / ${s.label}` : s.label;
      markCar(s.car ? s.car.id : null);
      history.replaceState(null, '', `#${s.id}`);
    }
    hudFill.style.transform = `scaleX(${p})`;

    // hotspot at the panel's top-right corner
    const s = STOPS[idx];
    const hk = s.car ? a * (1 - detailK) : 0;
    if (hk > 0.02) {
      lot.hotspot(s.index, v).project(camera);
      hot.style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px)`;
      hot.lastChild.textContent = s.car.video ? 'Video & highlights' : 'Photos & highlights';
    }
    hot.style.opacity = hk.toFixed(3);
    hot.style.visibility = hk > 0.02 ? 'visible' : 'hidden';

    if (draw) {
      if (params.has('nopost')) renderer.render(scene, camera);
      else post.render(dt, time, Math.abs(scroll.velocity));
    }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt, true);
  }
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  cameraAt(scroll.value, pos, look);
  camera.position.copy(pos);
  camera.lookAt(look);
  await renderer.compileAsync(scene, camera);
  document.getElementById('loader').classList.add('done');
  document.body.classList.add('ready');
  raf = requestAnimationFrame(frame);
  if (location.hash.startsWith('#detail-')) detail.open(fromHash);

  if (params.has('debug')) {
    window.__lot = {
      scroll, detail, STOPS, scene,
      snap(p, frames = 1) {
        if (p != null) scroll.jumpTo(p, true);
        for (let i = 0; i < frames; i++) step(1 / 30, i === frames - 1);
        return canvas.toDataURL('image/jpeg', 0.82);
      },
    };
  }
}

if (params.has('static') || matchMedia('(prefers-reduced-motion: reduce)').matches || !hasWebGL2()) {
  html.classList.add('static');
} else {
  boot().catch((err) => {
    console.error('3D lot unavailable, showing the static page:', err);
    html.classList.add('static');
  });
}
