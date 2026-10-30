import * as THREE from '../vendor/three/build/three.module.min.js?v=45891da-mvu89vzw';
import { CARS, STOPS, BAY_Z, BAY_GAP, bayX, SHOWROOM_X, usd } from './stops.js?v=45891da-mvu89vzw';

// The dealership lot at night: a front display row of parking stalls, each holding the REAL car cut out
// of its own listing photo (tools/cutout_cars.py; never a drawn car), tall LED pole lights with light
// pools, pennant strings, a landscaped curb with palmettos, the entrance gate and the showroom.
const ACCENT = new THREE.Color('#ff6a1a');
const LED = new THREE.Color('#e9f1ff');
const FONT = (w, px, fam = 'Space Grotesk') => `${w} ${px}px "${fam}"`;
const CAR_H = { 'Atlas': 1.95, 'Atlas Cross Sport': 1.9, 'Tiguan': 1.8, 'Jetta': 1.62 };
const POLE_Z = BAY_Z - 4.6;

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
const radial = (inner, outer) => canvasTex(256, 256, (g) => {
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, inner); r.addColorStop(1, outer);
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
});

function asphalt() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#10151e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = 16 + Math.random() * 26;
      g.fillStyle = `rgba(${v},${v + 3},${v + 9},${0.35 + Math.random() * 0.4})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
    }
  });
}

// Light cone: additive, fades toward the floor and the rim. Inputs clamped: pow(0, x) is NaN on D3D
// and the bloom blur spreads NaN into black squares.
function hazeMaterial(color, k = 0.12) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: color }, uK: { value: k } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uColor; uniform float uK; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float rim = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 1e-3, 1.), 1.6); float a = clamp(uK * rim * pow(clamp(vUv.y, 1e-3, 1.), 1.4), 0., 1.); gl_FragColor = vec4(uColor * a, a); }',
  });
}

function savingsTag(car) {
  return canvasTex(1024, 420, (g, w) => {
    g.textAlign = 'center';
    g.fillStyle = '#ffb347'; g.font = FONT(500, 44, 'JetBrains Mono'); g.fillText('S A V E', w / 2, 56);
    g.fillStyle = '#ffffff'; g.font = FONT(700, 190); g.fillText(usd(car.total), w / 2, 232);
    g.fillStyle = '#ff6a1a'; g.font = FONT(500, 44, 'JetBrains Mono'); g.fillText('O F F   M S R P', w / 2, 300);
    g.fillStyle = '#d3dceb'; g.font = FONT(600, 46); g.fillText(`${car.year} ${car.model} ${car.trim}`.toUpperCase(), w / 2, 384);
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

function buildStall(i, car, cutTex, shadowTex, poolTex) {
  const x = bayX(i);
  const g = new THREE.Group();
  g.position.set(x, 0, BAY_Z);

  const H = CAR_H[car.model] || 1.85;
  const W = H * (cutTex.image.width / cutTex.image.height);
  const carMat = new THREE.MeshBasicMaterial({ map: cutTex, transparent: true, alphaTest: 0.3, toneMapped: false, color: 0xb9bdc8 });
  const carMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), carMat);
  carMesh.position.y = H / 2;
  carMesh.userData.stop = i + 1;
  carMesh.renderOrder = 2;
  g.add(carMesh);

  // wet-asphalt reflection (the ground is slightly see-through) and a soft contact shadow
  const refl = new THREE.Mesh(carMesh.geometry, new THREE.MeshBasicMaterial({ map: cutTex, transparent: true, alphaTest: 0.3, toneMapped: false, color: 0x3a3f4c }));
  refl.scale.y = -1;
  refl.position.y = -H / 2;
  g.add(refl);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.02, 3.2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0.1);
  g.add(shadow);
  // the stall's own light pool
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(BAY_GAP * 1.6, 10), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.015, 0.4);
  g.add(pool);

  const tagMat = new THREE.MeshBasicMaterial({ map: savingsTag(car), transparent: true, toneMapped: false, depthWrite: false, opacity: 0.4 });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.48), tagMat);
  tag.position.set(0, H + 1.25, 0.1);
  g.add(tag);
  const underline = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.035, 0.03), glow(ACCENT, 2));
  underline.position.set(0, H + 0.42, 0.1);
  g.add(underline);

  return { group: g, car: carMesh, carMat, poolMat: pool.material, tag, tagMat, underline, x, H, baseTagY: tag.position.y };
}

// Stall lines, curb stops and the landscaped island behind the row.
function buildRowFurniture(scene, metal, concrete) {
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xdfe5ee, transparent: true, opacity: 0.55 });
  const first = bayX(0) - BAY_GAP / 2, last = bayX(CARS.length - 1) + BAY_GAP / 2;
  for (let x = first; x <= last + 0.01; x += BAY_GAP) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 6.2), lineMat);
    l.rotation.x = -Math.PI / 2;
    l.position.set(x, 0.012, BAY_Z + 0.2);
    scene.add(l);
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(last - first, 0.13), lineMat);
  back.rotation.x = -Math.PI / 2;
  back.position.set((first + last) / 2, 0.012, BAY_Z - 2.9);
  scene.add(back);

  const len = last - first + 30;
  const curb = new THREE.Mesh(new THREE.BoxGeometry(len, 0.2, 3.2), concrete);
  curb.position.set((first + last) / 2, 0.1, POLE_Z);
  scene.add(curb);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(len - 0.4, 0.06, 2.8), new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 1 }));
  bed.position.set(curb.position.x, 0.22, POLE_Z);
  scene.add(bed);

  const shrubGeo = new THREE.IcosahedronGeometry(0.6, 1);
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x0f2414, roughness: 0.9, flatShading: true });
  const n = Math.floor(len / 1.25);
  const shrubs = new THREE.InstancedMesh(shrubGeo, shrubMat, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let k = 0; k < n; k++) {
    const sc = 0.7 + Math.random() * 0.5;
    p.set(curb.position.x - len / 2 + 0.8 + k * 1.25, 0.45 * sc, POLE_Z + (Math.random() - 0.5) * 1.2);
    s.set(sc * 1.2, sc * 0.75, sc);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * 6);
    shrubs.setMatrixAt(k, m.compose(p, q, s));
  }
  scene.add(shrubs);

  // palmettos along the island (it's Columbia, SC)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2d22, roughness: 1 });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x12301a, roughness: 0.85, side: THREE.DoubleSide, flatShading: true });
  const frondGeo = new THREE.ConeGeometry(0.42, 2.6, 4, 1);
  frondGeo.translate(0, 1.3, 0);
  for (let x = first + BAY_GAP * 1.5; x < last; x += BAY_GAP * 3) {
    const tree = new THREE.Group();
    tree.position.set(x, 0.2, POLE_Z - 0.4);
    const h = 5.2 + Math.random() * 1.6;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, h, 7), trunkMat);
    trunk.position.y = h / 2;
    tree.add(trunk);
    for (let f = 0; f < 9; f++) {
      const fr = new THREE.Mesh(frondGeo, frondMat);
      fr.position.y = h;
      fr.rotation.set(0, (f / 9) * Math.PI * 2, 1.15 + Math.random() * 0.35, 'YXZ');
      fr.scale.set(1, 1, 0.18);
      tree.add(fr);
    }
    scene.add(tree);
  }
}

// Tall LED area lights: square pole, twin shoebox heads, haze cones and pools on the asphalt.
function buildPoles(scene, metal, poolTex) {
  const xs = [];
  for (let x = bayX(0) - BAY_GAP / 2; x <= bayX(CARS.length - 1) + BAY_GAP / 2 + 0.01; x += BAY_GAP * 2) xs.push([x, POLE_Z]);
  for (let x = 28; x < SHOWROOM_X - 10; x += 34) xs.push([x, 15]);   // far side of the road
  const haze = hazeMaterial(LED.clone().multiplyScalar(0.85), 0.1);
  const headMat = glow(LED, 3.2);
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const tops = [];
  xs.forEach(([x, z], k) => {
    const pole = new THREE.Group();
    pole.position.set(x, 0, z);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9.6, 0.2), metal);
    mast.position.y = 4.8 + 0.2;
    pole.add(mast);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0x5e636d, roughness: 0.9 }));
    base.position.y = 0.3;
    pole.add(base);
    [-1, 1].forEach((side) => {
      const dir = z < 0 ? 1 : -1;   // heads lean over the lot
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.4), metal);
      arm.position.set(side * 0.55, 9.75, dir * 0.6);
      arm.rotation.y = side * 0.5;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.95), metal);
      head.position.set(side * 0.95, 9.72, dir * 1.15);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.8), headMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(side * 0.95, 9.63, dir * 1.15);
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 4.6, 9.6, 28, 1, true), haze);
      cone.position.set(side * 0.95 + side * 1.0, 4.85, dir * 2.2);
      cone.rotation.z = -side * 0.2;
      cone.rotation.x = dir * 0.22;
      pole.add(arm, head, lens, cone);
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(17, 17), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.014, z < 0 ? 4 : -4);
    pole.add(pool);
    scene.add(pole);
    if (z < 0) tops.push(new THREE.Vector3(x, 9.3, z));
  });
  return tops;
}

// Dealer pennant strings between the pole tops; they flutter.
function buildPennants(scene, tops) {
  const colors = ['#d7263d', '#f2f2f2', '#1f6feb', '#ff6a1a'].map((c) => new THREE.Color(c).multiplyScalar(0.8));
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.2, 0, 0, 0.2, 0, 0, 0, -0.55, 0], 3));
  tri.computeVertexNormals();
  const per = 16;
  const count = (tops.length - 1) * per;
  const flags = new THREE.InstancedMesh(tri, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), count);
  const base = [];
  const linePts = [];
  for (let k = 0; k < tops.length - 1; k++) {
    const a = tops[k], b = tops[k + 1];
    for (let j = 0; j <= 24; j++) {
      const t = j / 24;
      linePts.push(new THREE.Vector3().lerpVectors(a, b, t).setY(a.y - Math.sin(t * Math.PI) * 1.1));
    }
    for (let j = 0; j < per; j++) {
      const t = (j + 0.5) / per;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y = a.y - Math.sin(t * Math.PI) * 1.1;
      base.push(p);
      flags.setColorAt(base.length - 1, colors[(base.length - 1) % colors.length]);
    }
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePts), new THREE.LineBasicMaterial({ color: 0x8a93a5 }));
  scene.add(flags, line);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  return (time) => {
    base.forEach((p, i) => {
      e.set(Math.sin(time * 2.4 + i * 0.9) * 0.45, 0, 0);
      flags.setMatrixAt(i, m.compose(p, q.setFromEuler(e), one));
    });
    flags.instanceMatrix.needsUpdate = true;
  };
}

function buildGate(scene, metal) {
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
      grd.addColorStop(0, `rgba(255,236,210,${0.95 * v})`); grd.addColorStop(1, `rgba(170,200,255,${0.6 * v})`);
      c.fillStyle = grd; c.fillRect(x * 128 + 8, y * 256 + 10, 112, 236);
    }
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(30, 9, 12), [metal, metal, metal, metal, new THREE.MeshBasicMaterial({ map: windows, toneMapped: false, color: 0xcfcfcf }), metal]);
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
  // light spilling out of the showroom onto the lot
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(34, 14), new THREE.MeshBasicMaterial({ map: radial('rgba(255,236,210,.35)', 'rgba(255,236,210,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0, 0.016, 9);
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
  g.add(glass, fascia, led, name, spill, board);
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
  const n = 2200;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = -20 + Math.random() * (SHOWROOM_X + 40);
    pos[i * 3 + 1] = Math.random() * 10;
    pos[i * 3 + 2] = -16 + Math.random() * 34;
    seed[i] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ map: radial('rgba(235,242,255,1)', 'rgba(235,242,255,0)'), size: 0.07, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
  scene.add(new THREE.Points(geo, mat));
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
  scene.fog = new THREE.FogExp2('#070b14', 0.0095);
  scene.add(new THREE.HemisphereLight(0xb4ccff, 0x1a1e28, 1.25));

  const loader = new THREE.TextureLoader(manager);
  const load = (url) => new Promise((res) => loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, () => res(null)));
  const [cutouts, joeyTex] = await Promise.all([Promise.all(CARS.map((c) => load(c.cutout))), load('img/joey.jpg')]);

  const metal = new THREE.MeshStandardMaterial({ color: 0x434955, metalness: 0.5, roughness: 0.45 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0x6f747e, roughness: 0.95 });
  const shadowTex = radial('rgba(0,0,0,.78)', 'rgba(0,0,0,0)');
  const poolTex = radial('rgba(225,236,255,.55)', 'rgba(225,236,255,0)');
  const stallPoolTex = radial('rgba(244,248,255,.5)', 'rgba(244,248,255,0)');

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SHOWROOM_X + 400, 320), new THREE.MeshStandardMaterial({
    map: asphalt(), color: 0xbcc4d4, roughness: 0.32, metalness: 0.3, transparent: true, opacity: 0.86,
  }));
  ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
  ground.material.map.repeat.set(140, 40);
  ground.rotation.x = -Math.PI / 2;
  ground.position.x = SHOWROOM_X / 2;
  scene.add(ground);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(SHOWROOM_X + 400, 8), new THREE.MeshStandardMaterial({ color: 0x07090e, roughness: 0.6, transparent: true, opacity: 0.55 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(SHOWROOM_X / 2, 0.006, 8);
  scene.add(road);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffc56b, transparent: true, opacity: 0.45 });
  for (let x = -40; x < SHOWROOM_X + 60; x += 7) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.14), dashMat);
    d.rotation.x = -Math.PI / 2;
    d.position.set(x, 0.01, 8);
    scene.add(d);
  }

  const stalls = CARS.map((car, i) => {
    const s = buildStall(i, car, cutouts[i], shadowTex, stallPoolTex);
    scene.add(s.group);
    return s;
  });
  buildRowFurniture(scene, metal, concrete);
  const tops = buildPoles(scene, metal, poolTex);
  const flutter = buildPennants(scene, tops);
  buildGate(scene, metal);
  buildShowroom(scene, metal, joeyTex);
  buildSky(scene);
  const dust = isLow ? () => {} : buildDust(scene);

  // A bright key light follows the active stall.
  const key = new THREE.SpotLight(0xf2f6ff, 2600, 40, 0.85, 0.8, 1.5);
  key.position.set(bayX(0) + 2, 9.5, BAY_Z + 5);
  scene.add(key, key.target);

  const white = new THREE.Color(1, 1, 1), dim = new THREE.Color(0x8f949f);
  const c = new THREE.Color();
  let kx = bayX(0);
  return {
    stalls,
    picks: stalls.map((s) => s.car),
    hotspot: (i, out) => out.set(stalls[i].x + 1.6, stalls[i].baseTagY + 0.55, BAY_Z),
    update(dt, time, p, stopIdx, activeK) {
      dust(time);
      flutter(time);
      const s = STOPS[stopIdx];
      kx += (s.anchor[0] - kx) * Math.min(1, dt * 2.5);
      key.position.set(kx + 2, 9.5, BAY_Z + 5);
      key.target.position.set(kx, 0, BAY_Z);
      const k = Math.min(1, dt * 4);
      stalls.forEach((st, i) => {
        const on = s.car && s.index === i ? activeK : 0;
        st.tag.position.y = st.baseTagY + Math.sin(time * 1.3 + i) * 0.06;
        st.tagMat.opacity += ((0.32 + 0.68 * on) - st.tagMat.opacity) * k;
        st.underline.visible = on > 0.5;
        st.carMat.color.lerp(c.copy(dim).lerp(white, on), k);
        st.poolMat.opacity += ((0.45 + 0.55 * on) - st.poolMat.opacity) * k;
      });
    },
  };
}
