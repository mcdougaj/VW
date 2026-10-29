import * as THREE from '../vendor/three/build/three.module.min.js';
import { CARS, STOPS, BAY_Z, bayX, SHOWROOM_X, usd } from './stops.js';

// The night lot: wet asphalt, a road, one display bay per car (its REAL listing photo on a lit
// panel, never a drawn car), light poles with haze cones, an entrance gate and the showroom.
const ACCENT = new THREE.Color('#ff6a1a');
const SODIUM = new THREE.Color('#ffb45a');
const FONT = (w, px, fam = 'Space Grotesk') => `${w} ${px}px "${fam}"`;

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const glow = (color, k = 1) => new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(k), toneMapped: false });

function asphalt() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#0d121b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = 14 + Math.random() * 22;
      g.fillStyle = `rgba(${v},${v + 3},${v + 9},${0.35 + Math.random() * 0.4})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
    }
  });
}

// Light cone: additive, fades toward the floor and the rim.
function hazeMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: color }, uK: { value: 0.16 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uK; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float rim = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 1e-3, 1.), 1.6); float a = clamp(uK * rim * pow(clamp(vUv.y, 1e-3, 1.), 1.4), 0., 1.); gl_FragColor = vec4(uColor * a, a); }',
  });
}

function savingsTag(car) {
  return canvasTex(1024, 360, (g, w, h) => {
    g.textAlign = 'center';
    g.fillStyle = '#ffb347'; g.font = FONT(500, 46, 'JetBrains Mono'); g.fillText('S A V E', w / 2, 62);
    g.fillStyle = '#ffffff'; g.font = FONT(700, 196); g.fillText(usd(car.total), w / 2, 248);
    g.fillStyle = '#ff6a1a'; g.font = FONT(500, 46, 'JetBrains Mono'); g.fillText('O F F   M S R P', w / 2, 330);
  });
}

function namePlate(car, n) {
  return canvasTex(1600, 96, (g, w, h) => {
    g.fillStyle = '#0a0f18'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff6a1a'; g.fillRect(0, 0, 10, h);
    g.textBaseline = 'middle';
    g.fillStyle = '#ff6a1a'; g.font = FONT(700, 44, 'JetBrains Mono'); g.fillText(String(n).padStart(2, '0'), 40, h / 2);
    g.fillStyle = '#eef3fa'; g.font = FONT(600, 50); g.fillText(`${car.year} ${car.model} ${car.trim}`.toUpperCase(), 130, h / 2 + 2);
    g.textAlign = 'right'; g.fillStyle = '#a4b3c7'; g.font = FONT(500, 34, 'JetBrains Mono'); g.fillText(`STOCK ${car.stock}`, w - 36, h / 2);
  });
}

function signTex(lines, w = 2048, h = 360) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = '#070b13'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ff6a1a'; g.lineWidth = 8; g.strokeRect(12, 12, w - 24, h - 24);
    g.textAlign = 'center';
    lines.forEach(([text, font, color, y]) => { g.font = font; g.fillStyle = color; g.fillText(text, w / 2, y); });
  });
}

function buildBay(i, car, tex, metal, haze) {
  const x = bayX(i);
  const bay = new THREE.Group();
  bay.position.set(x, 0, BAY_Z);
  bay.rotation.y = -0.06;

  const W = 8, H = 6, CY = 4.1;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.5, 3), metal);
  plinth.position.y = 0.25;
  bay.add(plinth);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 0.55), new THREE.MeshBasicMaterial({ map: namePlate(car, i + 1), toneMapped: false, color: 0xcccccc }));
  plate.position.set(0, 0.26, 1.51);
  bay.add(plate);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.05, 0.06), glow(ACCENT, 2.2));
  sill.position.set(0, 0.52, 1.5);
  bay.add(sill);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, H + 0.5, 0.3), metal);
  frame.position.set(0, CY, -0.2);
  bay.add(frame);
  [-2.6, 2.6].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, CY - H / 2, 0.22), metal);
    leg.position.set(lx, (CY - H / 2) / 2 + 0.25, -0.2);
    bay.add(leg);
  });

  const photoMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xd2d2d2 });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(W, H), photoMat);
  photo.position.set(0, CY, -0.04);
  photo.userData.stop = i + 1;
  bay.add(photo);

  const ledMat = glow(ACCENT, 1.6);
  const leds = new THREE.Group();
  [[0, H / 2 + 0.08, W + 0.3, 0.07], [0, -H / 2 - 0.08, W + 0.3, 0.07], [-W / 2 - 0.08, 0, 0.07, H + 0.3], [W / 2 + 0.08, 0, 0.07, H + 0.3]].forEach(([lx, ly, lw, lh]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(lw, lh, 0.05), ledMat);
    m.position.set(lx, CY + ly, 0);
    leds.add(m);
  });
  bay.add(leds);

  // reflection in the wet asphalt (the ground is slightly see-through)
  const mirror = new THREE.Group();
  mirror.scale.y = -1;
  const rPhoto = new THREE.Mesh(photo.geometry, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0x4a4a4a }));
  rPhoto.position.copy(photo.position);
  mirror.add(rPhoto, leds.clone());
  bay.add(mirror);

  const tagMat = new THREE.MeshBasicMaterial({ map: savingsTag(car), transparent: true, toneMapped: false, depthWrite: false });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.83), tagMat);
  tag.position.set(0, CY + H / 2 + 1.55, 0.2);
  bay.add(tag);

  // light pole + haze cone
  const pole = new THREE.Group();
  pole.position.set(6.2, 0, 2.2);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 9, 10), metal);
  mast.position.y = 4.5;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), metal);
  arm.position.set(-1.0, 9, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.5), glow(SODIUM, 2.4));
  head.position.set(-1.9, 8.92, 0);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 3.4, 8.8, 32, 1, true), haze);
  cone.position.set(-1.9, 4.5, 0);
  pole.add(mast, arm, head, cone);
  bay.add(pole);

  // parking stall lines on the ground in front of the bay
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x8792a6, transparent: true, opacity: 0.35 });
  [-4.6, 4.6].forEach((lx) => {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 5.5), lineMat);
    l.rotation.x = -Math.PI / 2;
    l.position.set(lx, 0.012, 5);
    bay.add(l);
  });

  return { bay, photo, tag, ledMat, x, baseTagY: tag.position.y };
}

function buildGate(scene, metal, haze) {
  const g = new THREE.Group();
  g.position.set(12, 0, 2.5);
  [-6.8, 6.8].forEach((z) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 9, 0.9), metal);
    p.position.set(0, 4.5, z);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 8.4, 0.06), glow(ACCENT, 2.2));
    strip.position.set(-0.48, 4.5, z);
    g.add(p, strip);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 2.55), new THREE.MeshBasicMaterial({
    toneMapped: false, color: 0xdddddd,
    map: signTex([['ASK FOR JOEY', FONT(700, 170), '#ffffff', 210], [`${CARS.length} NEW VOLKSWAGENS · DRIVE THE LOT`, FONT(500, 64, 'JetBrains Mono'), '#ff6a1a', 310]]),
  }));
  sign.rotation.y = -Math.PI / 2;
  sign.position.set(-0.5, 8.6, 0);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.9, 14.6), metal);
  beam.position.set(0, 8.6, 0);
  g.add(beam, sign);
  scene.add(g);
}

function buildShowroom(scene, metal, joeyTex) {
  const g = new THREE.Group();
  g.position.set(SHOWROOM_X, 0, -14);
  const windows = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#0a111d'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < 8; x++) for (let y = 0; y < 2; y++) {
      const v = 0.55 + Math.random() * 0.45;
      const grd = c.createLinearGradient(0, y * 256, 0, y * 256 + 240);
      grd.addColorStop(0, `rgba(255,220,170,${0.9 * v})`); grd.addColorStop(1, `rgba(140,180,255,${0.5 * v})`);
      c.fillStyle = grd; c.fillRect(x * 128 + 8, y * 256 + 10, 112, 236);
    }
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(30, 9, 12), [metal, metal, metal, metal, new THREE.MeshBasicMaterial({ map: windows, toneMapped: false, color: 0xbfbfbf }), metal]);
  glass.position.y = 4.5;
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(31, 1.6, 12.6), metal);
  fascia.position.y = 9.6;
  const led = new THREE.Mesh(new THREE.BoxGeometry(31, 0.08, 0.08), glow(ACCENT, 2.4));
  led.position.set(0, 8.8, 6.32);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(22, 1.3), new THREE.MeshBasicMaterial({
    toneMapped: false, transparent: true,
    map: canvasTex(2048, 120, (c, w, h) => { c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#eef3fa'; c.font = FONT(600, 78); c.fillText('MIDLANDS VOLKSWAGEN OF COLUMBIA', w / 2, h / 2); }),
  }));
  name.position.set(0, 9.6, 6.32);
  // Joey's board beside the door
  const board = new THREE.Group();
  board.position.set(-19, 0, 4);
  board.rotation.y = 0.35;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), new THREE.MeshBasicMaterial({ map: joeyTex, toneMapped: false, color: 0xdddddd }));
  face.position.y = 5.6;
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.5), new THREE.MeshBasicMaterial({
    toneMapped: false, map: signTex([['ASK FOR JOEY', FONT(700, 150), '#ffffff', 175], ['803-404-5150', FONT(500, 80, 'JetBrains Mono'), '#ff6a1a', 290]], 1024, 340),
  }));
  cap.position.y = 2.25;
  const back = new THREE.Mesh(new THREE.BoxGeometry(5.6, 7.2, 0.25), metal);
  back.position.set(0, 4.4, -0.15);
  const ring = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.07, 0.05), glow(ACCENT, 2.2));
  ring.position.set(0, 8.08, 0.02);
  board.add(back, face, cap, ring);
  g.add(glass, fascia, led, name, board);
  scene.add(g);
}

function buildSky(scene) {
  const tex = canvasTex(2048, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(5,8,15,0)'); grd.addColorStop(0.62, 'rgba(40,52,84,.55)'); grd.addColorStop(1, 'rgba(255,150,80,.32)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#04060b';
    let y = h * 0.72;
    g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) { y = Math.max(h * 0.5, Math.min(h * 0.86, y + (Math.random() - 0.5) * 26)); g.lineTo(x, y - Math.random() * 18); }
    g.lineTo(w, h); g.fill();
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.x = 3;
  const horizon = new THREE.Mesh(new THREE.PlaneGeometry(900, 70), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  horizon.position.set(SHOWROOM_X / 2, 22, -110);
  scene.add(horizon);

  const stars = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 900; i++) pts.push((Math.random() - 0.3) * 900, 40 + Math.random() * 160, -140 - Math.random() * 120);
  stars.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0x9fb3d9, size: 1.3, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7 })));
}

function buildDust(scene) {
  const n = 2600;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = -20 + Math.random() * (SHOWROOM_X + 40);
    pos[i * 3 + 1] = Math.random() * 10;
    pos[i * 3 + 2] = -14 + Math.random() * 26;
    seed[i] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,220,180,1)'); r.addColorStop(1, 'rgba(255,220,180,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const mat = new THREE.PointsMaterial({ map: dot, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd7b0 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return (time) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < n; i++) {
      a[i * 3 + 1] += 0.004 + seed[i] * 0.004;
      a[i * 3] += Math.sin(time * 0.3 + seed[i] * 40) * 0.004;
      if (a[i * 3 + 1] > 10) a[i * 3 + 1] = 0;
    }
    geo.attributes.position.needsUpdate = true;
  };
}

export async function buildLot({ scene, manager, isLow }) {
  scene.background = new THREE.Color('#05080f');
  scene.fog = new THREE.FogExp2('#05080f', 0.0105);
  scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x0a0c12, 0.55));

  const loader = new THREE.TextureLoader(manager);
  const load = (url) => new Promise((res) => loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));
  const [heroes, joeyTex] = await Promise.all([Promise.all(CARS.map((c) => load(c.photos[c.hero]))), load('img/joey.jpg')]);

  const metal = new THREE.MeshStandardMaterial({ color: 0x1b2232, metalness: 0.55, roughness: 0.4 });
  const haze = hazeMaterial(SODIUM.clone().multiplyScalar(0.9));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SHOWROOM_X + 400, 320), new THREE.MeshStandardMaterial({
    map: asphalt(), color: 0x9aa3b4, roughness: 0.38, metalness: 0.25, transparent: true, opacity: 0.86,
  }));
  ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
  ground.material.map.repeat.set(140, 40);
  ground.rotation.x = -Math.PI / 2;
  ground.position.x = SHOWROOM_X / 2;
  scene.add(ground);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(SHOWROOM_X + 400, 8), new THREE.MeshStandardMaterial({ color: 0x07090e, roughness: 0.6, transparent: true, opacity: 0.55 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(SHOWROOM_X / 2, 0.006, 4);
  scene.add(road);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffc56b, transparent: true, opacity: 0.45 });
  for (let x = -40; x < SHOWROOM_X + 60; x += 7) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.14), dashMat);
    d.rotation.x = -Math.PI / 2;
    d.position.set(x, 0.01, 4);
    scene.add(d);
  }

  const bays = CARS.map((car, i) => {
    const b = buildBay(i, car, heroes[i], metal, haze);
    scene.add(b.bay);
    return b;
  });
  buildGate(scene, metal, haze);
  buildShowroom(scene, metal, joeyTex);
  buildSky(scene);
  const dust = isLow ? () => {} : buildDust(scene);

  // A warm key light and an accent light follow the active bay.
  const key = new THREE.SpotLight(0xffd2a0, 900, 40, 0.62, 0.65, 1.7);
  key.position.set(bayX(0) + 3, 11, 4);
  scene.add(key, key.target);
  const accent = new THREE.PointLight(ACCENT, 0, 16, 1.6);
  scene.add(accent);

  const picks = bays.map((b) => b.photo);
  let kx = bayX(0);
  return {
    bays, picks,
    update(dt, time, p, stopIdx, activeK) {
      dust(time);
      const s = STOPS[stopIdx];
      const tx = s.anchor[0];
      kx += (tx - kx) * Math.min(1, dt * 2.5);
      key.position.set(kx + 3, 11, 4);
      key.target.position.set(kx, 0, BAY_Z + 2);
      accent.position.set(kx, 1.4, BAY_Z + 3.2);
      accent.intensity = s.car ? 30 * activeK : 0;
      bays.forEach((b, i) => {
        const on = s.car && s.index === i;
        b.tag.position.y = b.baseTagY + Math.sin(time * 1.3 + i) * 0.12;
        b.ledMat.color.copy(ACCENT).multiplyScalar(on ? 2.6 + Math.sin(time * 3) * 0.4 : 1.2);
      });
    },
  };
}
