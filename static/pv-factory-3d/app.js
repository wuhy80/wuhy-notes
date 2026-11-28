import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/postprocessing/OutputPass.js';
import { RoomEnvironment } from './vendor/environments/RoomEnvironment.js';

/* =========================================================
   光伏组件无人自动化制造车间 · 3D 产线可视化
   纯程序化建模（Three.js），无外部模型文件
   ========================================================= */

const FLOOR_Y = 0;
const BELT_Y = 0.56;
const LINE_X0 = -54, LINE_X1 = 54;

/* ---------------- 工位定义 ---------------- */
const STATIONS = [
  { id: 'ST-10', name: '玻璃上料 / 清洗', en: 'GLASS LOAD & CLEAN', x: -46, type: 'load',     cycle: 42 },
  { id: 'ST-20', name: '电池片串焊',      en: 'CELL STRINGER',      x: -34, type: 'stringer', cycle: 38 },
  { id: 'ST-30', name: '排版 / 叠层',     en: 'LAYUP & BUSSING',    x: -22, type: 'layup',    cycle: 40 },
  { id: 'ST-40', name: '层压固化',        en: 'LAMINATOR',          x: -8,  type: 'lami',     cycle: 55, hold: true },
  { id: 'ST-50', name: '修边 / 装框打胶', en: 'FRAMING & SEALING',  x: 6,   type: 'frame',    cycle: 44 },
  { id: 'ST-60', name: '接线盒焊接',      en: 'JUNCTION BOX',       x: 18,  type: 'jbox',     cycle: 36 },
  { id: 'ST-70', name: 'EL / IV 测试',    en: 'EL & IV TEST',       x: 30,  type: 'test',     cycle: 46 },
  { id: 'ST-80', name: '分选 / 包装',     en: 'SORTING & PACKING',  x: 44,  type: 'pack',     cycle: 40 },
];

const STATUS = {
  run:  { color: 0x35e0c8, label: '运行' },
  idle: { color: 0xffb020, label: '待机' },
  warn: { color: 0xff4d5e, label: '报警' },
  stop: { color: 0x4a5766, label: '停机' },
};

/* ---------------- 基础工具 ---------------- */
const rand = (a, b) => a + Math.random() * (b - a);

const M = {
  steel:    new THREE.MeshStandardMaterial({ color: 0x546270, metalness: 0.88, roughness: 0.3 }),
  steelLt:  new THREE.MeshStandardMaterial({ color: 0x96a4b4, metalness: 0.78, roughness: 0.26 }),
  body:     new THREE.MeshStandardMaterial({ color: 0x3d4a56, metalness: 0.45, roughness: 0.56 }),
  bodyLt:   new THREE.MeshStandardMaterial({ color: 0x5a6875, metalness: 0.4, roughness: 0.5 }),
  white:    new THREE.MeshStandardMaterial({ color: 0xc8d6e3, metalness: 0.28, roughness: 0.36 }),
  dark:     new THREE.MeshStandardMaterial({ color: 0x111821, metalness: 0.4, roughness: 0.8 }),
  rubber:   new THREE.MeshStandardMaterial({ color: 0x0d1319, metalness: 0.1, roughness: 0.95 }),
  glass:    new THREE.MeshStandardMaterial({
              color: 0x8fd0ea, metalness: 0.1, roughness: 0.06,
              transparent: true, opacity: 0.26, side: THREE.DoubleSide }),
};

function glowMat(color, intensity = 2.4) {
  return new THREE.MeshStandardMaterial({
    color: 0x000000, emissive: color, emissiveIntensity: intensity,
    metalness: 0, roughness: 1,
  });
}
const hdrMat = (color, intensity = 1) => new THREE.MeshStandardMaterial({
  color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 1, metalness: 0,
});

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(r, h, mat, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function glowStrip(w, h, d, color, intensity) {
  const m = box(w, h, d, glowMat(color, intensity));
  m.castShadow = false;
  return m;
}

/* ---------------- 程序化贴图 ---------------- */
function panelTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  g.fillStyle = '#0a1120'; g.fillRect(0, 0, 512, 320);
  const cols = 12, rows = 8, pad = 5;
  const cw = (512 - pad * (cols + 1)) / cols;
  const ch = (320 - pad * (rows + 1)) / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = pad + x * (cw + pad), py = pad + y * (ch + pad);
      const grd = g.createLinearGradient(px, py, px + cw, py + ch);
      grd.addColorStop(0, '#1d3f73');
      grd.addColorStop(0.45, '#2a5a9e');
      grd.addColorStop(1, '#16305a');
      g.fillStyle = grd;
      g.fillRect(px, py, cw, ch);
      g.strokeStyle = 'rgba(160,205,255,.22)';
      g.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        g.beginPath(); g.moveTo(px, py + ch * i / 3); g.lineTo(px + cw, py + ch * i / 3); g.stroke();
      }
    }
  }
  g.strokeStyle = '#cfdcea'; g.lineWidth = 7;
  g.strokeRect(3.5, 3.5, 505, 313);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function floorTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#0d141c'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(70,140,175,.26)'; g.lineWidth = 1;
  for (let i = 0; i <= 256; i += 32) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
  }
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = `rgba(130,180,210,${Math.random() * 0.04})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14, 8);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function beltTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#0c131a'; g.fillRect(0, 0, 128, 64);
  g.fillStyle = 'rgba(130,175,205,.16)';
  for (let i = 0; i < 128; i += 32) g.fillRect(i, 0, 12, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(48, 1);
  return t;
}

function screenTexture(lines, accent = '#35e0c8', fontSize = 34) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#05101a'; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = 'rgba(53,224,200,.35)'; g.lineWidth = 4;
  g.strokeRect(6, 6, 500, 244);
  g.font = `bold ${fontSize}px Consolas, "Microsoft YaHei", monospace`;
  g.fillStyle = accent;
  g.textBaseline = 'top';
  lines.forEach((t, i) => g.fillText(t, 26, 30 + i * (fontSize * 1.5)));
  g.fillStyle = 'rgba(53,224,200,.10)';
  for (let y = 0; y < 256; y += 4) g.fillRect(0, y, 512, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- 场景 ---------------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080d);
scene.fog = new THREE.FogExp2(0x05080d, 0.0028);

const camera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, 0.1, 600);
camera.position.set(40, 24, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('app').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-4, 2.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 12;
controls.maxDistance = 190;
controls.maxPolarAngle = Math.PI * 0.495;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.28;

/* ---------------- 后期：泛光 ---------------- */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.48, 0.95);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------------- 环境反射（金属材质必需，否则发黑） ---------------- */
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.22;
  pmrem.dispose();
}

/* ---------------- 灯光 ---------------- */
scene.add(new THREE.HemisphereLight(0xa8dcff, 0x16202b, 1.0));

const key = new THREE.DirectionalLight(0xe8f4ff, 2.6);
key.position.set(46, 62, 34);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -72;
key.shadow.camera.right = 72;
key.shadow.camera.top = 46;
key.shadow.camera.bottom = -46;
key.shadow.camera.near = 1;
key.shadow.camera.far = 220;
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.035;
scene.add(key);

const fill = new THREE.DirectionalLight(0x6cc0e6, 0.8);
fill.position.set(-52, 34, -46);
scene.add(fill);

const warm = new THREE.DirectionalLight(0xffce8a, 0.45);
warm.position.set(10, 18, 40);
scene.add(warm);

// 产线两端的补光，避免端部工位落进黑影
for (const x of [-46, 44]) {
  const p = new THREE.PointLight(0x9fdcff, 90, 46, 2);
  p.position.set(x, 7.5, 1);
  scene.add(p);
}

// 相机同向补光：让朝向镜头的那一面不死黑
const front = new THREE.DirectionalLight(0x86c3e8, 0.55);
front.position.set(24, 22, 60);
scene.add(front);

/* ---------------- 地面 ---------------- */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(168, 84),
  new THREE.MeshStandardMaterial({
    map: floorTexture(), color: 0x1f2a36, roughness: 0.8, metalness: 0.28,
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = FLOOR_Y;
floor.receiveShadow = true;
scene.add(floor);

/* 车间边界光带 */
(() => {
  const pts = [
    new THREE.Vector3(-78, 0.02, -38), new THREE.Vector3(78, 0.02, -38),
    new THREE.Vector3(78, 0.02, 38), new THREE.Vector3(-78, 0.02, 38),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints([...pts, pts[0]]);
  scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x1f6f80 })));
})();

/* ---------------- 屋顶桁架 + 吊灯 ---------------- */
for (let x = LINE_X0; x <= LINE_X1 + 4; x += 13) {
  scene.add(box(0.26, 0.26, 62, M.steel, x, 12.6, 0));
  scene.add(box(0.16, 0.16, 62, M.steel, x, 11.9, 0));
  scene.add(box(3.4, 0.07, 0.42, hdrMat(0xdff3ff, 2.2), x, 11.7, 0));
}
for (const z of [-31, 31]) {
  scene.add(box(112, 0.3, 0.3, M.steel, 0, 12.6, z));
}

/* ---------------- 输送线 ---------------- */
const beltTex = beltTexture();
const beltGroup = new THREE.Group();
{
  const deck = box(108, 0.14, 1.62, new THREE.MeshStandardMaterial({
    map: beltTex, color: 0x3a4753, roughness: 0.9, metalness: 0.2,
  }), 0, 0.5, 0);
  beltGroup.add(deck);

  for (const z of [-0.86, 0.86]) {
    beltGroup.add(glowStrip(108, 0.05, 0.05, 0x2fb8c8, 0.75).translateY(BELT_Y).translateZ(z));
    beltGroup.add(box(108, 0.1, 0.08, M.steel, 0, 0.44, z));
  }
  for (let x = LINE_X0 + 2; x <= LINE_X1; x += 4.4) {
    beltGroup.add(box(0.1, 0.42, 0.1, M.steel, x, 0.21, -0.7));
    beltGroup.add(box(0.1, 0.42, 0.1, M.steel, x, 0.21, 0.7));
  }
  const rollerGeo = new THREE.CylinderGeometry(0.055, 0.055, 1.5, 8);
  rollerGeo.rotateX(Math.PI / 2);
  const count = Math.floor(108 / 0.62);
  const rollers = new THREE.InstancedMesh(rollerGeo, M.steelLt, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    dummy.position.set(LINE_X0 + i * 0.62, 0.575, 0);
    dummy.updateMatrix();
    rollers.setMatrixAt(i, dummy.matrix);
  }
  rollers.castShadow = false;
  rollers.receiveShadow = true;
  beltGroup.add(rollers);
}
scene.add(beltGroup);

/* ---------------- 组件（在制品） ---------------- */
const panelTex = panelTexture();
const panelMat = new THREE.MeshStandardMaterial({
  map: panelTex, color: 0xffffff, metalness: 0.35, roughness: 0.35,
  emissive: 0x123a6e, emissiveIntensity: 0.65,
});
function makePanel() {
  const g = new THREE.Group();
  g.add(box(1.72, 0.038, 1.06, panelMat, 0, 0, 0));
  return g;
}

const panels = [];
const PANEL_COUNT = 13;
for (let i = 0; i < PANEL_COUNT; i++) {
  const p = makePanel();
  p.position.set(LINE_X0 + 4 + i * 8, BELT_Y, 0);
  p.userData = {
    x: p.position.x, passedLami: p.position.x > -2, hold: 0, speed: 2.4,
    sn: 'PV26' + String(1200 + i).padStart(5, '0'),
  };
  scene.add(p);
  panels.push(p);
}

/* ---------------- 工位建模 ---------------- */
const stationGroups = new Map();

function pad(x, color) {
  const g = new THREE.Group();
  g.position.set(x, 0, 0);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 5.4),
    new THREE.MeshBasicMaterial({ color: 0x123142, transparent: true, opacity: 0.42, depthWrite: false })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.012;
  g.add(plane);

  const pts = [
    new THREE.Vector3(-4.2, 0, -2.7), new THREE.Vector3(4.2, 0, -2.7),
    new THREE.Vector3(4.2, 0, 2.7), new THREE.Vector3(-4.2, 0, 2.7),
  ];
  const geo = new THREE.BufferGeometry().setFromPoints([...pts, pts[0]]);
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const loop = new THREE.Line(geo, lineMat);
  loop.position.y = 0.02;
  g.add(loop);

  const cornerMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
  for (const [cx, cz] of [[-4.2, -2.7], [4.2, -2.7], [4.2, 2.7], [-4.2, 2.7]]) {
    const sx = Math.sign(cx), sz = Math.sign(cz);
    const cg = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(cx - sx * 0.7, 0, cz), new THREE.Vector3(cx, 0, cz),
      new THREE.Vector3(cx, 0, cz - sz * 0.7),
    ]);
    const l = new THREE.Line(cg, cornerMat);
    l.position.y = 0.021;
    g.add(l);
  }
  g.userData.lineMat = lineMat;
  return g;
}

function robotArm(color) {
  const g = new THREE.Group();
  g.add(cyl(0.42, 0.34, M.body, 0, 0.17, 0, 18));
  g.add(cyl(0.3, 0.22, M.steelLt, 0, 0.44, 0, 18));

  const axis = new THREE.Group();
  axis.position.y = 0.52;
  axis.add(cyl(0.2, 1.35, M.bodyLt, 0, 0.66, 0, 12));
  g.add(axis);

  const elbow = new THREE.Group();
  elbow.position.y = 1.34;
  elbow.rotation.z = Math.PI / 2;
  elbow.add(cyl(0.16, 1.25, M.bodyLt, 0, 0, 0, 12));
  const fore = new THREE.Group();
  fore.position.x = 0.62;
  fore.add(box(0.9, 0.16, 0.22, M.bodyLt, 0.42, 0, 0));
  fore.add(box(0.24, 0.12, 0.34, glowMat(color, 1.6), 0.9, 0, 0));
  elbow.add(fore);
  axis.add(elbow);

  g.userData.axis = axis;
  g.userData.elbow = elbow;
  g.userData.phase = Math.random() * Math.PI * 2;
  return g;
}

function buildLoad(g) {
  g.add(box(5.2, 2.4, 3.4, M.body, -0.6, 1.22, 0));
  g.add(box(5.24, 0.14, 3.44, M.steelLt, -0.6, 2.44, 0));
  g.add(glowStrip(4.4, 0.05, 0.05, 0x35e0c8, 1.8).translateY(2.5).translateZ(-1.72));
  g.add(box(3.4, 0.9, 0.04, M.glass, -0.6, 1.55, -1.72));
  for (let i = 0; i < 5; i++) {
    g.add(box(2.1, 0.05, 1.5, M.glass, -4.0 + i * 0.02, 0.1 + i * 0.09, 2.6 - i * 0.06));
  }
  g.add(box(0.14, 1.0, 1.7, M.steel, -4.6, 0.5, 2.2));
  const arm = robotArm(0x35e0c8);
  arm.position.set(1.9, 0, 1.9);
  g.add(arm);
  g.userData.arm = arm;
}

function buildStringer(g) {
  g.add(box(6.6, 1.15, 2.9, M.body, 0, 0.58, 0));
  g.add(box(6.7, 0.12, 3.0, M.steelLt, 0, 1.2, 0));
  for (let i = 0; i < 4; i++) {
    g.add(glowStrip(1.2, 0.06, 0.12, 0xff5a3c, 2.6).translateX(-2.3 + i * 1.55).translateY(1.32));
  }
  for (const x of [-1.7, 1.7]) {
    g.add(box(2.4, 1.1, 2.2, M.bodyLt, x, 1.9, 0));
    g.add(glowStrip(1.9, 0.05, 0.05, 0x35e0c8, 1.8).translateX(x).translateY(1.36).translateZ(-1.12));
    g.add(box(0.5, 0.5, 0.02, M.glass, x, 1.95, -1.12));
  }
  for (const z of [-1.6, 1.6]) {
    const reel = cyl(0.42, 0.16, M.steelLt, -3.9, 1.5, z, 20);
    reel.rotation.x = Math.PI / 2;
    g.add(reel);
  }
  g.add(box(8.0, 0.3, 0.2, M.steel, 0, 2.6, -1.5));
  g.add(box(0.2, 2.6, 0.2, M.steel, -4.0, 1.3, -1.5));
  g.add(box(0.2, 2.6, 0.2, M.steel, 4.0, 1.3, -1.5));
}

function buildLayup(g) {
  g.add(box(5.4, 0.9, 2.6, M.body, 0, 0.45, 0));
  g.add(box(5.5, 0.1, 2.7, M.steelLt, 0, 0.94, 0));
  const a1 = robotArm(0x63b3ed); a1.position.set(-1.5, 0.9, -1.9); a1.scale.setScalar(0.82); g.add(a1);
  const a2 = robotArm(0x63b3ed); a2.position.set(1.5, 0.9, 1.9); a2.scale.setScalar(0.82); g.add(a2);
  g.userData.arms = [a1, a2];
  const roll = cyl(0.5, 1.9, new THREE.MeshStandardMaterial({ color: 0x9fd0e8, metalness: 0.2, roughness: 0.5 }), -3.3, 1.2, 0, 20);
  roll.rotation.x = Math.PI / 2;
  g.add(roll);
  g.add(box(0.2, 1.6, 0.2, M.steel, -4.1, 0.8, -1.1));
  g.add(box(0.2, 1.6, 0.2, M.steel, -4.1, 0.8, 1.1));
  g.add(box(8.4, 0.24, 0.24, M.steel, 0, 3.1, -2.0));
  g.add(box(8.4, 0.24, 0.24, M.steel, 0, 3.1, 2.0));
  g.add(box(0.2, 3.1, 0.2, M.steel, -4.2, 1.55, -2.0));
  g.add(box(0.2, 3.1, 0.2, M.steel, 4.2, 1.55, -2.0));
}

function buildLami(g) {
  g.add(box(7.2, 2.3, 4.4, M.white, 0, 1.15, 0));
  g.add(box(7.3, 0.16, 4.5, M.steelLt, 0, 2.36, 0));
  g.add(box(6.6, 0.26, 3.9, M.steel, 0, 2.72, 0));
  for (const [x, z] of [[-2.9, -1.7], [2.9, -1.7], [-2.9, 1.7], [2.9, 1.7]]) {
    g.add(cyl(0.19, 0.72, M.steelLt, x, 3.2, z, 14));
    g.add(cyl(0.27, 0.1, M.steel, x, 3.6, z, 14));
  }
  g.add(box(5.2, 0.95, 0.05, M.glass, 0, 1.62, -2.22));
  g.add(glowStrip(5.0, 0.75, 0.06, 0xffb020, 0.5).translateY(1.62).translateZ(-2.16));
  g.add(glowStrip(7.0, 0.06, 0.06, 0xffb020, 1.6).translateY(2.5).translateZ(-2.24));
  for (const x of [-3.6, 3.6]) {
    g.add(cyl(0.13, 2.2, M.steel, x, 3.3, -1.9, 10));
    g.add(cyl(0.13, 1.2, M.steel, x, 4.2, -2.5, 10).rotateZ(Math.PI / 2));
  }
  g.add(box(1.4, 0.5, 0.06, M.dark, 2.4, 1.0, -2.25));
  g.add(glowStrip(1.1, 0.28, 0.02, 0x35e0c8, 1.2).translateX(2.4).translateY(1.0).translateZ(-2.28));
}

function buildFrame(g) {
  g.add(box(6.0, 0.5, 2.8, M.body, 0, 0.25, 0));
  g.add(box(6.1, 0.1, 2.9, M.steelLt, 0, 0.53, 0));
  for (const [x, z] of [[-2.9, -1.4], [2.9, -1.4], [-2.9, 1.4], [2.9, 1.4]]) {
    g.add(box(0.16, 2.9, 0.16, M.steel, x, 1.45, z));
  }
  g.add(box(6.2, 0.18, 0.18, M.steel, 0, 2.9, -1.4));
  g.add(box(6.2, 0.18, 0.18, M.steel, 0, 2.9, 1.4));
  for (const x of [-1.1, 1.1]) {
    const head = new THREE.Group();
    head.position.set(x, 2.55, 0);
    head.add(box(0.3, 0.9, 0.3, M.bodyLt, 0, 0, 0));
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 10), M.steelLt);
    nozzle.position.y = -0.6;
    head.add(nozzle);
    head.add(glowStrip(0.16, 0.05, 0.16, 0xffb020, 2.2).translateY(-0.74));
    g.add(head);
  }
  const wheel = cyl(0.22, 0.1, M.steelLt, 3.4, 1.35, 0.9, 14);
  wheel.rotation.z = Math.PI / 2;
  g.add(wheel);
  g.userData.wheel = wheel;
  g.add(glowStrip(6.2, 0.05, 0.05, 0x35e0c8, 1.6).translateY(0.56).translateZ(-1.45));
}

function buildJbox(g) {
  g.add(box(4.6, 1.5, 2.6, M.body, 0, 0.75, 0));
  g.add(box(4.7, 0.12, 2.7, M.steelLt, 0, 1.56, 0));
  g.add(box(2.2, 1.0, 1.9, M.bodyLt, 0, 2.1, 0));
  g.add(glowStrip(1.8, 0.06, 0.06, 0x35e0c8, 2.0).translateY(1.62).translateZ(-0.98));
  g.add(box(1.5, 0.4, 0.02, M.glass, 0, 2.1, -0.97));
  for (let i = 0; i < 3; i++) {
    g.add(box(0.5, 0.12, 0.4, M.dark, -2.6, 0.9 + i * 0.14, 1.6));
  }
  g.add(box(3.2, 0.2, 0.2, M.steel, 0, 3.0, -1.3));
  g.add(box(0.16, 3.0, 0.16, M.steel, -1.6, 1.5, -1.3));
  g.add(box(0.16, 3.0, 0.16, M.steel, 1.6, 1.5, -1.3));
}

function buildTest(g) {
  for (const x of [-2.4, 2.4]) {
    g.add(box(0.2, 3.3, 0.2, M.steel, x, 1.65, -1.9));
    g.add(box(0.2, 3.3, 0.2, M.steel, x, 1.65, 1.9));
    g.add(box(0.24, 0.24, 4.0, M.steel, x, 3.3, 0));
  }
  const bar = box(4.9, 0.16, 0.34, hdrMat(0x35e0c8, 1.4), 0, 3.0, 0);
  g.add(bar);
  g.userData.bar = bar;
  g.add(box(6.4, 0.35, 3.0, M.body, 0, 0.17, 0));
  for (const [z, txt, col] of [[-2.9, ['EL  IMAGE', 'NG 0.02%'], '#35e0c8'], [2.9, ['IV  12.42 A', 'Pmax 552 W'], '#63b3ed']]) {
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.0),
      new THREE.MeshBasicMaterial({ map: screenTexture(txt, col, 30) })
    );
    scr.position.set(z < 0 ? -2.0 : 2.0, 2.0, z);
    scr.rotation.y = z < 0 ? 0 : Math.PI;
    g.add(scr);
    g.add(box(2.1, 1.1, 0.06, M.dark, z < 0 ? -2.0 : 2.0, 2.0, z + (z < 0 ? -0.05 : 0.05)));
  }
  g.add(glowStrip(6.4, 0.05, 0.05, 0x35e0c8, 1.8).translateY(0.36).translateZ(-1.52));
}

function buildPack(g) {
  for (const dx of [-2.2, 2.2]) {
    const rack = new THREE.Group();
    rack.position.x = dx;
    for (const z of [-1.5, 1.5]) {
      rack.add(box(0.12, 3.0, 0.12, M.steelLt, 0, 1.5, z));
    }
    for (const y of [0.6, 1.6, 2.6]) {
      rack.add(box(2.6, 0.1, 3.2, M.steel, 0, y, 0));
      for (let i = 0; i < 4; i++) {
        rack.add(box(2.3, 0.04, 0.62, panelMat, 0, y + 0.07, -1.1 + i * 0.72));
      }
    }
    g.add(rack);
  }
  g.add(box(3.0, 1.8, 2.2, M.body, 0, 0.9, -3.4));
  g.add(glowStrip(2.6, 0.06, 0.06, 0x35e0c8, 1.8).translateY(1.86).translateZ(-4.5));
  g.add(box(1.6, 0.6, 0.7, M.dark, 0, 0.3, -4.6));
}

function buildStation(st) {
  const g = new THREE.Group();
  g.position.set(st.x, 0, 0);
  const p = pad(st.x, STATUS.run.color);
  scene.add(p);
  g.userData.pad = p;

  switch (st.type) {
    case 'load': buildLoad(g); break;
    case 'stringer': buildStringer(g); break;
    case 'layup': buildLayup(g); break;
    case 'lami': buildLami(g); break;
    case 'frame': buildFrame(g); break;
    case 'jbox': buildJbox(g); break;
    case 'test': buildTest(g); break;
    case 'pack': buildPack(g); break;
  }

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 0.78),
    new THREE.MeshBasicMaterial({
      map: screenTexture([st.id + '  ' + st.name], '#9fe8ff', 26),
      transparent: true, opacity: 0.95, side: THREE.DoubleSide,
    })
  );
  label.position.set(0, 4.15, -2.9);
  g.add(label);

  g.traverse((o) => { if (o.isMesh) o.userData.stationId = st.id; });
  p.traverse((o) => { if (o.isMesh || o.isLine) o.userData.stationId = st.id; });

  scene.add(g);
  stationGroups.set(st.id, g);
  return g;
}

STATIONS.forEach((st) => {
  st.status = 'run';
  st.wip = (Math.random() * 6) | 0;
  st.temp = rand(34, 46);
  st.okRate = rand(97.4, 99.6);
  buildStation(st);
});

/* ---------------- AGV ---------------- */
const agvs = [];
function makeAGV(color) {
  const g = new THREE.Group();
  g.add(box(1.5, 0.34, 2.4, M.bodyLt, 0, 0.28, 0));
  g.add(box(1.6, 0.06, 2.5, M.steelLt, 0, 0.48, 0));
  for (const [x, z] of [[-0.65, -0.8], [0.65, -0.8], [-0.65, 0.8], [0.65, 0.8]]) {
    const w = cyl(0.16, 0.12, M.rubber, x, 0.16, z, 12);
    w.rotation.z = Math.PI / 2;
    g.add(w);
  }
  const blink = glowStrip(0.14, 0.09, 0.14, color, 3.0);
  blink.position.set(0, 0.56, 1.0);
  g.add(blink);
  g.add(glowStrip(1.3, 0.05, 0.05, color, 1.6).translateY(0.1).translateZ(-1.22));
  g.add(box(1.3, 0.1, 2.0, M.steel, 0, 0.58, 0));
  g.userData.blink = blink;
  return g;
}
for (let i = 0; i < 3; i++) {
  const a = makeAGV(0xffb020);
  a.position.set(-30 + i * 34, 0, i % 2 ? 9.4 : -9.4);
  a.userData.dir = i % 2 ? -1 : 1;
  a.userData.lane = i % 2 ? 9.4 : -9.4;
  a.userData.phase = i * 1.7;
  scene.add(a);
  agvs.push(a);
}

/* ---------------- 缓存区 / 料架 ---------------- */
for (let i = 0; i < 3; i++) {
  const x = -20 + i * 18;
  const rack = new THREE.Group();
  rack.position.set(x, 0, -13);
  for (const dx of [-1.6, 1.6]) {
    for (const dz of [-1.0, 1.0]) rack.add(box(0.12, 2.6, 0.12, M.steel, dx, 1.3, dz));
  }
  for (const y of [0.5, 1.3, 2.1]) {
    rack.add(box(3.4, 0.08, 2.2, M.steel, 0, y, 0));
    rack.add(box(3.0, 0.05, 0.55, panelMat, 0, y + 0.07, -0.6));
  }
  rack.add(glowStrip(3.4, 0.04, 0.04, 0x2fb8c8, 1.2).translateY(2.62));
  scene.add(rack);
}

/* ---------------- 悬浮尘埃粒子 ---------------- */
let dustPoints = null;
(() => {
  const n = 420;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = rand(-70, 70);
    pos[i * 3 + 1] = rand(0.4, 11);
    pos[i * 3 + 2] = rand(-26, 26);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x8fd4ff, size: 0.09, transparent: true, opacity: 0.42,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  dustPoints = pts;
})();

/* =========================================================
   HUD
   ========================================================= */
const stats = { prod: 1284, yield: 98.62, oee: 86.4, run: 94.2, wip: panels.length };

const els = {
  clock: document.getElementById('clock'),
  shift: document.getElementById('shift'),
  prod: document.getElementById('k-prod'),
  yield: document.getElementById('k-yield'),
  oee: document.getElementById('k-oee'),
  run: document.getElementById('k-run'),
  wip: document.getElementById('k-wip'),
  runCount: document.getElementById('run-count'),
  stationList: document.getElementById('station-list'),
  eventList: document.getElementById('event-list'),
  tip: document.getElementById('tip'),
  detail: document.getElementById('detail'),
  dName: document.getElementById('d-name'),
  dCode: document.getElementById('d-code'),
  dBody: document.getElementById('d-body'),
};

STATIONS.forEach((st) => {
  const li = document.createElement('li');
  li.dataset.id = st.id;
  li.innerHTML = `
    <i class="dot run"></i>
    <div class="nm">${st.name}<small>${st.id} · ${st.en}</small></div>
    <div class="ct">${st.cycle}s</div>`;
  li.addEventListener('click', () => selectStation(st.id, true));
  els.stationList.appendChild(li);
  st.el = li;
  st.dot = li.querySelector('.dot');
});

function logEvent(text, level = 'info') {
  const li = document.createElement('li');
  if (level !== 'info') li.className = 'lv-' + level;
  const d = new Date();
  li.innerHTML = `<time>${d.toTimeString().slice(0, 8)}</time><span>${text}</span>`;
  els.eventList.appendChild(li);
  while (els.eventList.children.length > 5) els.eventList.firstChild.remove();
}

function setStationStatus(st, status) {
  st.status = status;
  const c = STATUS[status].color;
  st.dot.className = 'dot ' + status;
  const padGroup = stationGroups.get(st.id) && stationGroups.get(st.id).userData.pad;
  if (padGroup && padGroup.userData.lineMat) padGroup.userData.lineMat.color.setHex(c);
  updateRunCount();
}
function updateRunCount() {
  const running = STATIONS.filter((s) => s.status === 'run').length;
  els.runCount.textContent = `${running} / ${STATIONS.length} 运行`;
}

/* 详情卡 */
let selectedId = null;
function selectStation(id, focus) {
  const st = STATIONS.find((s) => s.id === id);
  if (!st) return;
  selectedId = id;
  STATIONS.forEach((s) => s.el.classList.toggle('sel', s.id === id));

  els.dName.textContent = st.name;
  els.dCode.textContent = `${st.id} · ${st.en}`;
  const cls = st.status === 'warn' ? 'bad' : st.status === 'idle' ? 'warn' : 'ok';
  els.dBody.innerHTML = `
    <dt>运行状态</dt><dd class="${cls}">${STATUS[st.status].label}</dd>
    <dt>标准节拍</dt><dd>${st.cycle} s</dd>
    <dt>实际节拍</dt><dd>${(st.cycle * rand(0.97, 1.06)).toFixed(1)} s</dd>
    <dt>在制 WIP</dt><dd>${st.wip} 块</dd>
    <dt>工位良率</dt><dd>${st.okRate.toFixed(2)} %</dd>
    <dt>腔体温度</dt><dd>${st.temp.toFixed(1)} ℃</dd>
    <dt>设备编号</dt><dd>${st.id}-A01</dd>`;
  els.detail.classList.add('show');

  if (focus) focusCamera(st.x);
}

/* 相机：手动聚焦 / 巡游 */
let camGoal = null;
let tourOn = false, tourT = 0;

function focusCamera(x) {
  setTour(false);
  camGoal = {
    pos: new THREE.Vector3(x + 11, 11.5, 18),
    target: new THREE.Vector3(x, 2.2, 0),
    t: 0,
  };
}
function resetCamera() {
  camGoal = { pos: new THREE.Vector3(40, 24, 40), target: new THREE.Vector3(-4, 2.5, 0), t: 0 };
}
const cruiseBtn = document.querySelector('[data-act="cruise"]');
function setTour(v) {
  tourOn = v;
  if (v) { camGoal = null; tourT = 0; }
  cruiseBtn.classList.toggle('on', tourOn);
}

document.querySelectorAll('.toolbar button').forEach((b) => {
  b.addEventListener('click', () => {
    const act = b.dataset.act;
    if (act === 'cruise') {
      setTour(!tourOn);
    } else if (act === 'top') {
      setTour(false);
      camGoal = { pos: new THREE.Vector3(2, 104, 52), target: new THREE.Vector3(0, 0, 0), t: 0 };
    } else if (act === 'reset') {
      setTour(false);
      resetCamera();
    }
  });
});
/* 一旦手动拖动/缩放，就退出巡游 */
controls.addEventListener('start', () => { if (tourOn) setTour(false); });
document.getElementById('detail-close').addEventListener('click', () => {
  els.detail.classList.remove('show');
  selectedId = null;
  STATIONS.forEach((s) => s.el.classList.remove('sel'));
});

/* =========================================================
   拾取交互
   ========================================================= */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredId = null;

function stationOf(obj) {
  let o = obj;
  while (o) {
    if (o.userData && o.userData.stationId) return o.userData.stationId;
    o = o.parent;
  }
  return null;
}

function pickAt(clientX, clientY) {
  pointer.x = (clientX / innerWidth) * 2 - 1;
  pointer.y = -(clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const targets = [];
  stationGroups.forEach((g) => targets.push(g));
  STATIONS.forEach((st) => { const p = stationGroups.get(st.id).userData.pad; if (p) targets.push(p); });
  const hits = raycaster.intersectObjects(targets, true);
  for (const h of hits) {
    const id = stationOf(h.object);
    if (id) return id;
  }
  return null;
}

renderer.domElement.style.cursor = 'grab';
renderer.domElement.addEventListener('pointermove', (e) => {
  const id = pickAt(e.clientX, e.clientY);
  if (id !== hoveredId) {
    hoveredId = id;
    els.tip.classList.toggle('show', !!id);
    renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
  }
  if (id) {
    const st = STATIONS.find((s) => s.id === id);
    els.tip.style.left = e.clientX + 'px';
    els.tip.style.top = e.clientY + 'px';
    els.tip.textContent = `${st.id} · ${st.name} · ${STATUS[st.status].label}`;
  }
});
renderer.domElement.addEventListener('pointerleave', () => {
  hoveredId = null; els.tip.classList.remove('show');
});
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const id = pickAt(e.clientX, e.clientY);
  if (id) selectStation(id, false);
});

/* =========================================================
   动画
   ========================================================= */
const clock = new THREE.Clock();
let simT = 0, kpiT = 0, eventT = 0, evtStage = 0;

const EVENT_POOL = [
  { t: 'ST-40 层压 真空度 -0.098 MPa 达标，保压中', lv: 'info' },
  { t: 'ST-20 串焊 焊带张力 0.42 N 正常', lv: 'info' },
  { t: 'MES 下发工单 WO-20261112-07，计划 320 块', lv: 'info' },
  { t: 'ST-70 EL 抽检 0 缺陷，一次通过', lv: 'info' },
  { t: 'AGV-02 满料返程，路径已重新规划', lv: 'info' },
  { t: 'ST-50 打胶量偏差 0.8%，已自动补偿', lv: 'warn' },
  { t: 'ST-30 排版视觉定位重试 1 次，已恢复', lv: 'warn' },
  { t: 'ST-60 烙铁温度波动 ±6℃，进入自整定', lv: 'warn' },
];

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  simT += dt;

  /* ---- 组件流动 ---- */
  const lamiX = STATIONS[3].x;
  for (const p of panels) {
    const u = p.userData;
    if (u.hold > 0) {
      u.hold -= dt;
    } else {
      u.x += u.speed * dt;
      if (!u.passedLami && u.x >= lamiX - 3.0) {
        u.hold = rand(3.5, 6.5);
        u.passedLami = true;
      }
      if (u.x > LINE_X1 + 3) {
        u.x = LINE_X0 - 2;
        u.passedLami = false;
        u.hold = 0;
        stats.prod++;
        u.sn = 'PV26' + String(1200 + (stats.prod % 9000)).padStart(5, '0');
        if (Math.random() < 0.14) logEvent(`${u.sn} 下线入库 · EL/IV 合格`, 'info');
      }
    }
    p.position.x = u.x;
    p.position.y = BELT_Y + Math.sin(simT * 6 + u.x) * 0.004;
  }
  stats.wip = panels.length;

  /* ---- 传送带纹路 ---- */
  beltTex.offset.x -= dt * 0.28;

  /* ---- AGV ---- */
  for (const a of agvs) {
    a.position.x += a.userData.dir * dt * 3.4;
    if (a.position.x > 62) { a.position.x = 62; a.userData.dir = -1; }
    if (a.position.x < -62) { a.position.x = -62; a.userData.dir = 1; }
    a.rotation.y = a.userData.dir > 0 ? 0 : Math.PI;
    const blink = 0.5 + 0.5 * Math.sin(simT * 7 + a.userData.phase);
    a.userData.blink.material.emissiveIntensity = 1.2 + blink * 3.2;
  }

  /* ---- 机械臂 / 扫描 / 刀轮 ---- */
  for (const st of STATIONS) {
    const g = stationGroups.get(st.id);
    if (!g) continue;
    const speed = st.status === 'stop' ? 0 : st.status === 'idle' ? 0.25 : 1;
    const arms = g.userData.arms || (g.userData.arm ? [g.userData.arm] : []);
    arms.forEach((arm, i) => {
      arm.userData.axis.rotation.y = Math.sin(simT * 0.75 * speed + arm.userData.phase + i) * 1.05;
      arm.userData.elbow.rotation.z = Math.PI / 2 + Math.sin(simT * 0.95 * speed + arm.userData.phase + i) * 0.42;
    });
    if (g.userData.bar) {
      g.userData.bar.position.z = Math.sin(simT * 1.5 * speed) * 1.5;
      g.userData.bar.material.emissiveIntensity = 1.0 + Math.sin(simT * 6) * 0.6;
    }
    if (g.userData.wheel) g.userData.wheel.rotation.y += dt * 6 * speed;

    const padLM = g.userData.pad.userData.lineMat;
    if (padLM && (st.status === 'run' || st.status === 'warn')) {
      padLM.opacity = 0.55 + 0.4 * Math.sin(simT * (st.status === 'warn' ? 6 : 1.8) + st.x);
    }
  }

  /* ---- 尘埃 ---- */
  if (dustPoints) {
    const arr = dustPoints.geometry.attributes.position.array;
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += dt * 0.12;
      if (arr[i] > 11) arr[i] = 0.4;
    }
    dustPoints.geometry.attributes.position.needsUpdate = true;
  }

  /* ---- 相机：巡游 / 聚焦缓动 ---- */
  if (tourOn) {
    tourT += dt;
    const cycle = 54;
    const p = (tourT % cycle) / cycle;
    const back = p < 0.5 ? p * 2 : (1 - p) * 2;
    const x = THREE.MathUtils.lerp(-42, 42, back);
    const k = 1 - Math.pow(0.0016, dt);
    const goalPos = new THREE.Vector3(
      x + 17,
      13.5 + Math.sin(tourT * 0.5) * 1.8,
      24.5
    );
    camera.position.lerp(goalPos, k);
    controls.target.lerp(new THREE.Vector3(x, 2.8, 0), k);
  } else if (camGoal) {
    camGoal.t = Math.min(1, camGoal.t + dt * 1.6);
    const k = 1 - Math.pow(1 - camGoal.t, 3);
    camera.position.lerp(camGoal.pos, k * 0.16);
    controls.target.lerp(camGoal.target, k * 0.16);
    if (camGoal.t >= 1 && camera.position.distanceTo(camGoal.pos) < 0.5) camGoal = null;
  }

  /* ---- HUD ---- */
  kpiT += dt;
  if (kpiT > 0.5) {
    kpiT = 0;
    stats.yield = THREE.MathUtils.clamp(stats.yield + rand(-0.03, 0.035), 97.4, 99.3);
    stats.oee = THREE.MathUtils.clamp(stats.oee + rand(-0.12, 0.12), 82, 91);
    stats.run = THREE.MathUtils.clamp(stats.run + rand(-0.1, 0.1), 90, 98);
    els.prod.textContent = stats.prod;
    els.yield.textContent = stats.yield.toFixed(2);
    els.oee.textContent = stats.oee.toFixed(1);
    els.run.textContent = stats.run.toFixed(1);
    els.wip.textContent = stats.wip;

    for (const st of STATIONS) {
      st.wip = Math.max(0, st.wip + ((Math.random() < 0.4) ? (Math.random() < 0.5 ? 1 : -1) : 0));
      st.temp = THREE.MathUtils.clamp(st.temp + rand(-0.4, 0.4), 30, 62);
      st.el.querySelector('.ct').textContent = Math.round(st.cycle * rand(0.98, 1.05)) + 's';
      if (selectedId === st.id) selectStation(st.id, false);
    }
  }

  /* ---- 时钟 ---- */
  const d = new Date();
  els.clock.textContent = d.toTimeString().slice(0, 8);
  els.shift.textContent = (d.getHours() >= 8 && d.getHours() < 20) ? '白班 08:00 — 20:00' : '夜班 20:00 — 08:00';

  /* ---- 事件流 ---- */
  eventT += dt;
  if (eventT > 5.5) {
    eventT = 0;
    const e = EVENT_POOL[evtStage++ % EVENT_POOL.length];
    logEvent(e.t, e.lv);
  }

  controls.update();
  composer.render();
}

/* ---------------- resize ---------------- */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.resolution.set(innerWidth, innerHeight);
});

/* ---------------- 启动 ---------------- */
logEvent('系统就绪：8 个工位在线，MES 已连接', 'info');
updateRunCount();
animate();

// 演示：6 秒后触发一次工位报警与恢复
setTimeout(() => {
  const st = STATIONS[1];
  setStationStatus(st, 'warn');
  logEvent('ST-20 串焊 焊带偏移 0.12mm，自动纠偏中', 'err');
  setTimeout(() => {
    setStationStatus(st, 'run');
    logEvent('ST-20 串焊 纠偏完成，恢复正常节拍', 'info');
  }, 7000);
}, 6000);
