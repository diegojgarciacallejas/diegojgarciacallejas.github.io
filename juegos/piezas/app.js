/* Piezas 3D: copiar un modelo con piezas de construcción sobre una placa de 8 x 8, girando la vista.
   Es la única parte en 3D de la web (Three.js, en lib/). Coordenadas en piezas: x (izquierda → derecha),
   z (fondo → delante), y (altura). Una pieza se pone encima de otra (o de la placa) o pegada a un lado. */
import * as THREE from '../../lib/three.module.min.js';

function $(id) { return document.getElementById(id); }
var N = 8, MAXH = 10, BH = 1.2, GAP = 0.04;            // placa, altura máxima, alto de una pieza y hueco entre piezas
var COLORS = { r: '#d9665a', o: '#f2a03b', y: '#f2c14e', g: '#4f9a5a', G: '#7cc59a', b: '#4f8fd9', n: '#8a5a32', w: '#f4efe6', k: '#2b2f3a', s: '#9aa3bd', p: '#ef8fa8' };
var SIZES = { '1x1': [1, 1], '1x2': [2, 1], '1x3': [3, 1], '1x4': [4, 1], '2x2': [2, 2], '2x3': [3, 2] };
// modelos: capas de abajo arriba; cada capa son filas (del fondo hacia delante) y cada letra un color de COLORS («.» vacío)
var MODELS = [
  { name: 'Bandera de Extremadura', layers: [['kkkkkk'], ['wwwwww'], ['gggggg']] },
  { name: 'Coche', layers: [['k..k', 'k..k'], ['rrrr', 'rrry'], ['.bb.', '.bb.']] },
  { name: 'Seta', layers: [['...', '.w.', '...'], ['...', '.w.', '...'], ['rrr', 'rrr', 'rrr'], ['.r.', 'rwr', '.r.']] },
  { name: 'Cactus', layers: [['ooo', 'ooo', 'ooo'], ['...', '.G.', '...'], ['...', 'GGG', '...'], ['...', 'GGG', '...'], ['...', '.G.', '...'], ['...', '.p.', '...']] },
  { name: 'Cerezo', layers: [['...', '.n.', '...'], ['...', '.n.', '...'], ['GrG', 'GGG', 'GrG'], ['.G.', 'GGG', '.G.'], ['...', '.G.', '...']] },
  { name: 'Portería', layers: [['s...s', 'w...w'], ['s...s', 'w...w'], ['sssss', 'wwwww']] },
  { name: 'Robot', layers: [['.s.s.', '.s.s.'], ['.www.', '.www.'], ['swwws', 'swwws'], ['.www.', '.kwk.'], ['.....', '..o..']] },
  { name: 'Patricio, el conejo', layers: [['www', 'www', 'www'], ['.w.', 'www', 'kpk'], ['...', 'w.w', '...'], ['...', 'p.p', '...']] },
  { name: 'Manuelita, la tortuga', layers: [['G.G', '...', 'G.G', '...'], ['ggg', 'ggg', 'ggg', '.G.'], ['.g.', 'gGg', '.g.', '...']] },
  { name: 'Pirámide', layers: [['yyyyy', 'yyyyy', 'yyyyy', 'yyyyy', 'yyyyy'], ['.....', '.yyy.', '.yyy.', '.yyy.', '.....'], ['.....', '.....', '..o..', '.....', '.....']] },
  // las Cuatro Torres de Madrid
  { name: 'Cuatro Torres', layers: [['s.b.w.k', 's.b.w.k'], ['s.b.w.k', 's.b.w.k'], ['s.b.w.k', 's.b.w.k'], ['s.b.w.k', 's.b.w.k'], ['s.b.w.k', 's.b.w.k'], ['..b.w..', '..b.w..']] },
  { name: 'Casa', layers: [['yyyy', 'y..y', 'y..y', 'yy.y'], ['yyyy', 'b..b', 'y..y', 'yy.y'], ['rrrr', 'rrrr', 'rrrr', 'rrrr'], ['....', '.rr.', '.rr.', '....']] },
  // el puente romano de Mérida: pilares, arcos y pretil
  { name: 'Puente romano', layers: [['s..s..s', 's..s..s'], ['s..s..s', 's..s..s'], ['sssssss', 'sssssss'], ['s.s.s.s', 's.s.s.s']] },
  { name: 'Cohete', layers: [['r.r', '.w.', 'r.r'], ['.w.', 'www', '.w.'], ['.w.', 'www', '.b.'], ['.w.', 'www', '.w.'], ['...', '.r.', '...']] },
  { name: 'Castillo', layers: [
    ['ssssss', 's....s', 's....s', 's....s', 's....s', 'ss..ss'],
    ['ssssss', 's....s', 's....s', 's....s', 's....s', 'ssssss'],
    ['s.ss.s', '......', 's....s', 's....s', '......', 's.ss.s'],
    ['r.....', '......', '......', '......', '......', '......']] }
];
I18N.deep(MODELS);   // los nombres, en inglés si toca
// los cubos del modelo: [{x, y, z, c}]
function voxels(m) {
  var out = [];
  m.layers.forEach(function (rows, y) { rows.forEach(function (row, z) { for (var x = 0; x < row.length; x++) if (row[x] !== '.') out.push({ x: x, y: y, z: z, c: row[x] }); }); });
  return out;
}

var st = { level: 0, color: 'k', size: '1x4', rot: false, eraser: false, pieces: [], undo: [], ghost: false, done: {}, hover: null, won: false };
// modelos ya hechos (nº de modelo → piezas usadas); si lo guardado no tiene esa forma, se ignora
try {
  var saved = JSON.parse(localStorage.getItem('piezas3d-hechas') || '{}');
  if (saved && typeof saved === 'object' && !Array.isArray(saved))
    Object.keys(saved).forEach(function (k) { if (/^\d+$/.test(k) && +k < MODELS.length && typeof saved[k] === 'number' && saved[k] > 0) st.done[k] = saved[k]; });
} catch (e) { }

/* ---- 3D: escena, luces, placa ---- */
function renderer(canvas) {
  var r = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}
function lights(scene) {
  scene.add(new THREE.HemisphereLight(0xe6ecff, 0x2a1d40, 2.2));
  var sun = new THREE.DirectionalLight(0xfff4e0, 2.6); sun.position.set(6, 14, 9); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); var c = sun.shadow.camera; c.left = c.bottom = -9; c.right = c.top = 9; c.near = 1; c.far = 40;
  scene.add(sun);
}
var mats = {};
function mat(c, ghost) {
  var k = c + (ghost || '');
  if (!mats[k]) mats[k] = new THREE.MeshLambertMaterial(ghost ? { color: ghost === 'bad' ? 0xe0453a : COLORS[c], transparent: true, opacity: 0.55, depthWrite: false } : { color: COLORS[c] });
  return mats[k];
}
var STUD = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), boxes = {};
function box(w, d) { var k = w + 'x' + d; return boxes[k] || (boxes[k] = new THREE.BoxGeometry(w - GAP, BH - GAP, d - GAP)); }
/* una pieza de w x d con sus botones encima; posición en piezas (x, y, z = esquina) */
function brickMesh(p, material) {
  var g = new THREE.Group(), body = new THREE.Mesh(box(p.w, p.d), material);
  body.castShadow = body.receiveShadow = !material.transparent; g.add(body);
  for (var i = 0; i < p.w; i++) for (var j = 0; j < p.d; j++) {
    var s = new THREE.Mesh(STUD, material); s.position.set(i - (p.w - 1) / 2, BH / 2 + 0.1, j - (p.d - 1) / 2); s.castShadow = !material.transparent; g.add(s);
  }
  g.position.set(p.x + p.w / 2 - N / 2, p.y * BH + BH / 2, p.z + p.d / 2 - N / 2);
  g.userData.body = body;
  return g;
}

var board = $('board'), R = renderer(board), scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 100);
scene.background = new THREE.Color('#241a3d');
lights(scene);
var plate = new THREE.Mesh(new THREE.BoxGeometry(N + 0.4, 0.4, N + 0.4), new THREE.MeshLambertMaterial({ color: '#3f9a68' }));
plate.position.y = -0.2; plate.receiveShadow = true; scene.add(plate);
var studs = new THREE.InstancedMesh(STUD, new THREE.MeshLambertMaterial({ color: '#4fae78' }), N * N), m4 = new THREE.Matrix4();
for (var i = 0; i < N * N; i++) { m4.makeTranslation(i % N + 0.5 - N / 2, 0.1, Math.floor(i / N) + 0.5 - N / 2); studs.setMatrixAt(i, m4); }
studs.receiveShadow = true; scene.add(studs);
var built = new THREE.Group(), silhouette = new THREE.Group(); scene.add(built, silhouette);
var preview = null;

/* ---- cámara que gira alrededor de la figura ---- */
var view = { theta: 0.65, phi: 0.95, r: 15, goal: 0.65 };
function placeCam(c, v, ty) {
  c.position.set(v.r * Math.sin(v.phi) * Math.sin(v.theta), ty + v.r * Math.cos(v.phi), v.r * Math.sin(v.phi) * Math.cos(v.theta));
  c.lookAt(0, ty, 0);
}

/* ---- el estado: qué casillas ocupa cada pieza ---- */
function cells(p) { var out = []; for (var i = 0; i < p.w; i++) for (var j = 0; j < p.d; j++) out.push([p.x + i, p.y, p.z + j]); return out; }
function occupancy() { var o = {}; st.pieces.forEach(function (p) { cells(p).forEach(function (c) { o[c.join()] = p; }); }); return o; }
function fits(p) {
  var o = occupancy();
  return cells(p).every(function (c) { return c[0] >= 0 && c[0] < N && c[2] >= 0 && c[2] < N && c[1] >= 0 && c[1] < MAXH && !o[c.join()]; });
}
function dims() { var d = SIZES[st.size]; return st.rot ? [d[1], d[0]] : d; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function add(p, record) {
  p.mesh = brickMesh(p, mat(p.c)); p.mesh.userData.body.userData.piece = p;
  built.add(p.mesh); st.pieces.push(p);
  if (record !== false) st.undo.push({ add: p });
  changed();
}
function remove(p, record) {
  built.remove(p.mesh); st.pieces = st.pieces.filter(function (x) { return x !== p; });
  if (record !== false) st.undo.push({ del: p });
  changed();
}

/* ---- ratón: dónde caería la pieza ---- */
var ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
function pick(e) {
  var r = board.getBoundingClientRect();
  mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mouse, cam);
  var hits = ray.intersectObjects([plate].concat(st.pieces.map(function (p) { return p.mesh.userData.body; })), false);
  var h = hits[0]; if (!h) return null;
  var n = h.face.normal.clone().round(), piece = h.object.userData.piece || null;
  if (!piece) {                                                          // la placa: solo por arriba
    if (n.y < 0.5) return null;
    return { piece: null, n: n, t: { x: Math.floor(h.point.x + N / 2), y: 0, z: Math.floor(h.point.z + N / 2) } };
  }
  var q = h.point.clone().addScaledVector(n, -0.01);                      // el cubo pulsado y el de al lado de esa cara
  return { piece: piece, n: n, t: { x: Math.floor(q.x + N / 2) + n.x, y: Math.floor(q.y / BH) + n.y, z: Math.floor(q.z + N / 2) + n.z } };
}
/* la pieza elegida colocada junto a esa cara: encima, centrada; al lado, hacia fuera */
function placement(hit) {
  var d = dims(), w = d[0], dd = d[1], t = hit.t, n = hit.n;
  var x0 = n.x > 0 ? t.x : n.x < 0 ? t.x - w + 1 : t.x - Math.floor((w - 1) / 2);
  var z0 = n.z > 0 ? t.z : n.z < 0 ? t.z - dd + 1 : t.z - Math.floor((dd - 1) / 2);
  if (n.y !== 0) { x0 = clamp(x0, 0, N - w); z0 = clamp(z0, 0, N - dd); }   // encima: que no se salga de la placa
  var p = { x: x0, y: t.y, z: z0, w: w, d: dd, c: st.color };
  p.ok = fits(p);
  return p;
}
function hover(e) {
  if (preview) { scene.remove(preview); preview = null; }
  st.pieces.forEach(function (p) { p.mesh.userData.body.material = mat(p.c); });
  st.hover = null;
  var hit = e && pick(e); if (!hit) { board.style.cursor = 'grab'; return; }
  if (st.eraser) {
    if (hit.piece) { hit.piece.mesh.userData.body.material = mat(hit.piece.c, 'bad'); st.hover = { del: hit.piece }; }
    board.style.cursor = hit.piece ? 'pointer' : 'grab'; return;
  }
  var p = placement(hit);
  preview = brickMesh(p, mat(p.c, p.ok ? 'ok' : 'bad')); scene.add(preview);
  st.hover = { add: p, piece: hit.piece }; board.style.cursor = p.ok ? 'crosshair' : 'not-allowed';
}

/* ---- arrastrar gira, clic pone, clic derecho quita, rueda o pellizco acercan ---- */
var drag = null, pointers = {}, lastMove = null;
board.addEventListener('contextmenu', function (e) { e.preventDefault(); });
board.addEventListener('pointerdown', function (e) {
  board.setPointerCapture(e.pointerId); pointers[e.pointerId] = [e.clientX, e.clientY];
  drag = { x: e.clientX, y: e.clientY, moved: false, button: e.button, th: view.goal, ph: view.phi };
});
board.addEventListener('pointermove', function (e) {
  lastMove = e;
  if (pointers[e.pointerId]) {
    var ids = Object.keys(pointers);
    if (ids.length === 2) {                                                // dos dedos: zoom
      var a = pointers[ids[0]], b = pointers[ids[1]], before = Math.hypot(a[0] - b[0], a[1] - b[1]);
      pointers[e.pointerId] = [e.clientX, e.clientY]; a = pointers[ids[0]]; b = pointers[ids[1]];
      view.r = clamp(view.r * before / Math.max(1, Math.hypot(a[0] - b[0], a[1] - b[1])), 9, 30); if (drag) drag.moved = true; return;
    }
    pointers[e.pointerId] = [e.clientX, e.clientY];
  }
  if (drag) {
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 5) { drag.moved = true; hover(null); board.style.cursor = 'grabbing'; }
    if (drag.moved) { view.goal = view.theta = drag.th - dx * 0.008; view.phi = clamp(drag.ph - dy * 0.008, 0.25, 1.45); }
    return;
  }
  hover(e);
});
function up(e) {
  delete pointers[e.pointerId];
  if (!drag) return;
  var d = drag; drag = null;
  hover(e);
  if (d.moved) return;
  if (d.button === 2 || st.eraser) { var hit = pick(e); if (hit && hit.piece) remove(hit.piece); }
  else if (st.hover && st.hover.add && st.hover.add.ok) { var p = st.hover.add; add({ x: p.x, y: p.y, z: p.z, w: p.w, d: p.d, c: p.c }); }
  hover(e);
}
board.addEventListener('pointerup', up);
board.addEventListener('pointercancel', function (e) { delete pointers[e.pointerId]; drag = null; });
board.addEventListener('pointerleave', function () { if (!drag) hover(null); });
board.addEventListener('wheel', function (e) { e.preventDefault(); view.r = clamp(view.r * (e.deltaY > 0 ? 1.1 : 0.9), 9, 30); }, { passive: false });
function turn(k) { view.goal += k * Math.PI / 4; }

/* ---- vista previa del modelo: los cubos girando despacio ---- */
var mcan = $('model'), MR = renderer(mcan), mscene = new THREE.Scene(), mcam = new THREE.PerspectiveCamera(34, 1, 0.1, 100), mgroup = new THREE.Group();
mscene.background = new THREE.Color('#1a1130'); lights(mscene); mscene.add(mgroup);
var mview = { theta: 0.6, phi: 1.0, r: 14 };
function showModel() {
  var m = MODELS[st.level], vs = voxels(m), w = m.layers[0][0].length, d = m.layers[0].length, h = m.layers.length;
  mgroup.clear(); silhouette.clear();
  var has = {}; vs.forEach(function (v) { has[[v.x, v.y, v.z].join()] = true; });
  vs.forEach(function (v) {
    // en la vista previa, cada cubo es una pieza de 1 x 1 (con botón solo si no tiene nada encima)
    var b = brickMesh({ x: v.x - w / 2 + N / 2, y: v.y, z: v.z - d / 2 + N / 2, w: 1, d: 1 }, mat(v.c));
    if (has[[v.x, v.y + 1, v.z].join()]) b.children.slice(1).forEach(function (s) { s.visible = false; });
    mgroup.add(b);
  });
  mview.r = 6 + Math.max(w, d, h * BH) * 1.6;
  mgroup.position.y = -h * BH / 2;
  // silueta en la placa (centrada): cajas transparentes con aristas
  var ox = Math.floor((N - w) / 2), oz = Math.floor((N - d) / 2), edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, BH, 1));
  vs.forEach(function (v) {
    var c = new THREE.Mesh(new THREE.BoxGeometry(0.98, BH - 0.02, 0.98), new THREE.MeshBasicMaterial({ color: COLORS[v.c], transparent: true, opacity: 0.18, depthWrite: false }));
    var l = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: COLORS[v.c], transparent: true, opacity: 0.6 }));
    [c, l].forEach(function (o) { o.position.set(ox + v.x + 0.5 - N / 2, v.y * BH + BH / 2, oz + v.z + 0.5 - N / 2); silhouette.add(o); });
  });
  silhouette.visible = st.ghost;
  $('mname').textContent = t('{0} · {1} cubos', m.name, vs.length);
}

/* ---- ¿se parece? Da igual dónde se monte en la placa y hacia dónde mire ---- */
function score() {
  var m = MODELS[st.level], target = voxels(m), mine = [], o = occupancy();
  Object.keys(o).forEach(function (k) { var c = k.split(',').map(Number); mine.push({ x: c[0], y: c[1], z: c[2], c: o[k].c }); });
  if (!mine.length) return { hit: 0, extra: 0, total: target.length };
  function norm(list) {
    var mx = Math.min.apply(null, list.map(function (v) { return v.x; })), mz = Math.min.apply(null, list.map(function (v) { return v.z; })), map = {};
    list.forEach(function (v) { map[[v.x - mx, v.y, v.z - mz].join()] = v.c; });
    return map;
  }
  var me = norm(mine), best = null;
  for (var q = 0; q < 4; q++) {                                           // el modelo girado 0, 90, 180 y 270 grados
    var rot = target.map(function (v) { var x = v.x, z = v.z; for (var k = 0; k < q; k++) { var t = x; x = -z; z = t; } return { x: x, y: v.y, z: z, c: v.c }; });
    var tm = norm(rot), hit = 0, extra = 0;
    Object.keys(tm).forEach(function (k) { if (me[k] === tm[k]) hit++; });
    Object.keys(me).forEach(function (k) { if (me[k] !== tm[k]) extra++; });
    if (!best || hit - extra > best.hit - best.extra) best = { hit: hit, extra: extra, total: target.length };
  }
  return best;
}
function changed() {
  var s = score(), pct = Math.max(0, Math.round((s.hit - s.extra) / s.total * 100));
  $('match').style.width = pct + '%';
  $('used').textContent = st.pieces.length;
  $('matchtxt').textContent = !st.pieces.length ? t('Pon la primera pieza en la placa. Puedes construir donde quieras y mirando hacia donde quieras.')
    : t('Coinciden {0} de {1} cubos', s.hit, s.total) + (s.extra ? t(' · sobran o cambian de color {0}', s.extra) : '') + ' · ' + pct + ' %';
  var won = s.hit === s.total && !s.extra;
  if (won && !st.won) {
    st.done[st.level] = Math.min(st.done[st.level] || 999, st.pieces.length);
    try { localStorage.setItem('piezas3d-hechas', JSON.stringify(st.done)); } catch (e) { }
    $('donetxt').textContent = t(st.pieces.length === 1 ? 'Lo has montado con {0} pieza. Gira la vista para verlo bien.' : 'Lo has montado con {0} piezas. Gira la vista para verlo bien.', st.pieces.length);
    $('done').hidden = false; levels();
    Logros.unlock('pieza'); if (Object.keys(st.done).length === MODELS.length) Logros.unlock('maestro');
  }
  st.won = won;
}

/* ---- controles ---- */
function seg(group, v) {
  document.querySelectorAll('[data-group="' + group + '"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === v)); });
}
function setColor(c) { st.color = c; st.eraser = false; $('eraser').setAttribute('aria-pressed', 'false'); swatches(); }
function swatches() {
  var box = $('colors'); box.textContent = '';
  Object.keys(COLORS).forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.style.background = COLORS[k]; b.setAttribute('aria-label', 'Color ' + k);
    b.setAttribute('aria-pressed', String(k === st.color && !st.eraser)); b.addEventListener('click', function () { setColor(k); });
    box.append(b);
  });
}
function levels() {
  var box = $('levels'); box.textContent = '';
  MODELS.forEach(function (m, i) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = (i + 1) + '. ' + m.name;
    b.setAttribute('aria-pressed', String(i === st.level)); if (st.done[i]) b.className = 'ok';
    b.addEventListener('click', function () { load(i); });
    box.append(b);
  });
}
function clearAll() { st.pieces.slice().forEach(function (p) { built.remove(p.mesh); }); st.pieces = []; st.undo = []; }
function load(i) {
  st.level = i; st.won = false; clearAll(); $('done').hidden = true;
  setColor(voxels(MODELS[i])[0].c); levels(); showModel(); changed();
}
document.querySelectorAll('[data-group="size"] button').forEach(function (b) { b.addEventListener('click', function () { st.size = b.dataset.v; seg('size', st.size); }); });
$('rotate').addEventListener('click', function () { st.rot = !st.rot; });
$('eraser').addEventListener('click', function () { st.eraser = !st.eraser; $('eraser').setAttribute('aria-pressed', String(st.eraser)); swatches(); });
function undo() {
  var a = st.undo.pop(); if (!a) return;
  if (a.add) remove(a.add, false); else add(a.del, false);
}
$('undo').addEventListener('click', undo);
$('clear').addEventListener('click', function () { clearAll(); changed(); });
$('ghost').addEventListener('change', function () { st.ghost = this.checked; silhouette.visible = st.ghost; });
$('left').addEventListener('click', function () { turn(-1); });
$('right').addEventListener('click', function () { turn(1); });
$('next').addEventListener('click', function () { load((st.level + 1) % MODELS.length); });
document.addEventListener('keydown', function (e) {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'r' || e.key === 'R') st.rot = !st.rot;
  else if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') turn(-1);
  else if (e.key === 'e' || e.key === 'E' || e.key === 'ArrowRight') turn(1);
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  else if (e.key === 'Escape' && window.parent !== window) parent.postMessage('viewer:close', location.origin);
  else return;
  if (lastMove) hover(lastMove);                                          // la pieza girada, al momento
});
// volver: al juego si se vino de él
$('back').addEventListener('click', function (e) {
  if (window.parent !== window) { e.preventDefault(); parent.postMessage('viewer:close', location.origin); }
});

/* ---- tamaño y dibujo ---- */
function fit(r, c, canvas) {
  var w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * r.getPixelRatio()) || canvas.height !== Math.round(h * r.getPixelRatio())) { r.setSize(w, h, false); c.aspect = w / h; c.updateProjectionMatrix(); }
}
var last = performance.now();
function frame(now) {
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  view.theta += (view.goal - view.theta) * Math.min(1, dt * 10);          // los giros de 45° van suaves
  fit(R, cam, board); placeCam(cam, view, 0.9); R.render(scene, cam);
  mview.theta += dt * 0.5; fit(MR, mcam, mcan); placeCam(mcam, mview, 0); MR.render(mscene, mcam);
  requestAnimationFrame(frame);
}
seg('size', st.size); load(0); requestAnimationFrame(frame);
