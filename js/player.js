/* El muñeco camina con flechas / WASD, o haciendo clic (o tocando) en el suelo,
   y entonces va solo hasta allí esquivando los muebles.
   Cada escena tiene su configuración (WALK_ROOM, WALK_YARD…) y al crearse la pone en WALK.
   Todo se calcula en píxeles de arte; roomXY lo pasa a pantalla según STAGE. */
var WALK_ROOM = {
  speed: 70,                  // píxeles de arte por segundo
  stride: 7,                  // cada cuántos píxeles recorridos cambia el fotograma del paso
  feet: [10, 4],              // caja de los pies (ancho, alto): es lo único que choca
  floor: [24, 78, 264, 216],  // zona pisable: x0, y0, x1, y1
  grid: [0, 288],             // franja en x donde se buscan caminos al hacer clic (incluye las puertas)
  cell: 4,                    // tamaño de la cuadrícula para buscar caminos
  // huecos por los que se puede salir del suelo (las puertas): los pies tienen que caber dentro
  passes: [[2, 157, 40, 22], [246, 157, 40, 22], [132, 200, 24, 31]],
  // salidas: al pisar «hit» se sale; en «near» aparece el cartel (en tag); los textos están en CFG.exits
  exits: [
    { id: 'pasillo',  hit: [0, 150, 14, 40],   near: [0, 150, 36, 40],    tag: [11, 151],  align: 0,   inside: [36, 168] },
    { id: 'vestidor', hit: [274, 150, 14, 40], near: [252, 150, 36, 40],  tag: [277, 151], align: 1,   inside: [252, 168] },
    { id: 'menu',     hit: [120, 226, 48, 10], near: [116, 206, 56, 30],  tag: [162, 228], align: 0,   inside: [144, 208] }
  ],
  // muebles que no se pueden pisar: [x, y, ancho, alto]. De la cama, la pecera y el servidor solo cuenta
  // la base: se puede pasar por detrás y el muñeco queda tapado (ver drawBed, drawTank y drawServer)
  blocks: [
    [24, 70, 40, 12],    // estantería
    [55, 80, 11, 14],    // papelera
    [66, 70, 54, 15],    // escritorio y silla
    [119, 70, 14, 13],   // torre del PC
    [170, 70, 12, 7],    // cactus alto
    [244, 70, 21, 31],   // mesilla
    [212, 135, 53, 21],  // cama (base)
    [30, 100, 20, 26],   // robot
    [30, 132, 38, 22],   // puf
    [135, 153, 15, 7],   // la zanahoria de juguete de Patricio (él va suelto: bunny.js)
    [174, 154, 21, 17],  // piezas de construcción
    [24, 204, 42, 14],   // servidor (base)
    [196, 200, 42, 18],  // pecera (base)
    [243, 190, 18, 26],  // cactus redondo
    [94, 204, 16, 9]     // máquina de chicles (base)
  ]
};
var WALK = WALK_ROOM;

/* ¿los pies en (x, y) chocan con algo? (x centro, y = suela) */
function walkBlocked(x, y) {
  var f = WALK.floor, w = WALK.feet[0], h = WALK.feet[1], l = x - w / 2, r = x + w / 2, t = y - h;
  function inside(b) { return l >= b[0] && r <= b[0] + b[2] && t >= b[1] && y <= b[1] + b[3]; }
  if ((l < f[0] || r > f[2] || t < f[1] || y > f[3]) && !(WALK.passes || []).some(inside)) return true;
  return WALK.blocks.some(function (b) { return l < b[0] + b[2] && r > b[0] && t < b[1] + b[3] && y > b[1]; });
}
/* ¿qué salida pisa el muñeco en (x, y)? */
function walkExit(x, y, key) {
  return (WALK.exits || []).filter(function (e) { var b = e[key || 'hit']; return x >= b[0] && x < b[0] + b[2] && y >= b[1] && y < b[1] + b[3]; })[0] || null;
}
/* ¿se puede ir en línea recta de a a b? */
function walkClear(ax, ay, bx, by) {
  var n = Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)));
  for (var k = 1; k <= n; k++) if (walkBlocked(ax + (bx - ax) * k / n, ay + (by - ay) * k / n)) return false;
  return true;
}

/* Camino con A* sobre la cuadrícula, luego se estira para que vaya en líneas rectas */
function walkPath(sx, sy, tx, ty) {
  // la cuadrícula cubre WALK.grid en x (con las puertas) y del suelo hasta lo más bajo de los huecos
  var C = WALK.cell, f = WALK.floor, band = WALK.grid, bottom = Math.max.apply(null, [f[3]].concat((WALK.passes || []).map(function (b) { return b[1] + b[3]; })));
  var cols = Math.floor((band[1] - band[0]) / C), rows = Math.floor((bottom - f[1]) / C);
  function cx(i) { return band[0] + i * C + C / 2; }
  function cy(j) { return f[1] + j * C + C / 2; }
  function free(i, j) { return i >= 0 && j >= 0 && i < cols && j < rows && !walkBlocked(cx(i), cy(j)); }
  function nearest(x, y) {
    var best = -1, bd = 1e9;
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var d = (cx(i) - x) * (cx(i) - x) + (cy(j) - y) * (cy(j) - y);
      if (d < bd && free(i, j)) { bd = d; best = j * cols + i; }
    }
    return best;
  }
  var goal = nearest(tx, ty), start = nearest(sx, sy);
  if (goal < 0 || start < 0) return null;
  // si se pincha encima de un mueble, se va al punto libre más cercano
  if (walkBlocked(tx, ty)) { tx = cx(goal % cols); ty = cy(Math.floor(goal / cols)); }

  var g = {}, from = {}, open = [start], closed = {}, gi = goal % cols, gj = Math.floor(goal / cols);
  function h(n) { var dx = Math.abs(n % cols - gi), dy = Math.abs(Math.floor(n / cols) - gj); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); }
  g[start] = 0;
  while (open.length) {
    var bi = 0;
    for (var k = 1; k < open.length; k++) if (g[open[k]] + h(open[k]) < g[open[bi]] + h(open[bi])) bi = k;
    var cur = open.splice(bi, 1)[0];
    if (cur === goal) break;
    closed[cur] = true;
    var i = cur % cols, j = Math.floor(cur / cols);
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      if (!dx && !dy || !free(i + dx, j + dy)) continue;
      if (dx && dy && (!free(i + dx, j) || !free(i, j + dy))) continue;   // sin cortar esquinas
      var n = (j + dy) * cols + i + dx, cost = g[cur] + (dx && dy ? 1.414 : 1);
      if (closed[n] || (n in g && g[n] <= cost)) continue;
      g[n] = cost; from[n] = cur;
      if (open.indexOf(n) < 0) open.push(n);
    }
  }
  if (!(goal in g)) return null;
  var pts = [[tx, ty]];
  for (var c = from[goal]; c !== undefined && c !== start; c = from[c]) pts.unshift([cx(c % cols), cy(Math.floor(c / cols))]);
  // estirar: desde cada punto, saltar al más lejano que se vea en línea recta
  var out = [], px = sx, py = sy, a = 0;
  while (a < pts.length) {
    var far = a;
    for (var b = pts.length - 1; b > a; b--) if (walkClear(px, py, pts[b][0], pts[b][1])) { far = b; break; }
    out.push(pts[far]); px = pts[far][0]; py = pts[far][1]; a = far + 1;
  }
  return out;
}

function Player(scene, x, y) {
  var self = this, S = STAGE.S;
  this.s = scene; this.x = x; this.y = y;
  this.dir = 'down'; this.flip = false; this.dist = 0; this.frame = 0; this.path = null; this.moving = false;
  ['down', 'up', 'side'].forEach(function (d) {
    DIEGO_FRAMES[d].forEach(function (rows, i) { makeTexture(scene, 'diego_' + d + i, rows); });
  });
  this.marker = scene.add.graphics().setAlpha(0).setDepth(5);
  this.shadow = scene.add.ellipse(0, 0, 22 * STAGE.k / 1.6, 7 * STAGE.k / 1.6, 0x5a3a22, 0.35);
  this.spr = scene.add.image(0, 0, 'diego_down0').setOrigin(0.5, 1).setScale(STAGE.k);
  this.keys = scene.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
  this.place();
}

/* ir andando hasta (x, y) en coordenadas de pantalla */
Player.prototype.walkTo = function (sx, sy) {
  var S = STAGE.S, tx = (sx - STAGE.OX) / S, ty = (sy - STAGE.OY) / S;
  this.path = walkPath(this.x, this.y, tx, ty);
  if (!this.path) return;
  var end = this.path[this.path.length - 1], p = roomXY(end[0], end[1]), m = this.marker;
  // marca en el suelo: un rombo pixelado que parpadea hasta llegar
  m.clear().fillStyle(0xffffff, 0.9);
  [[0, -3, 1, 1], [-1, -2, 3, 1], [-2, -1, 5, 1], [-1, 0, 3, 1], [0, 1, 1, 1]].forEach(function (r) { m.fillRect(r[0] * S, r[1] * S, r[2] * S, r[3] * S); });
  m.setPosition(p[0], p[1] - S); m.setAlpha(1);
  if (this.blink) this.blink.stop();
  this.blink = this.s.tweens.add({ targets: m, alpha: 0.3, duration: 260, yoyo: true, repeat: -1, ease: 'Stepped' });
};

Player.prototype.stopPath = function () {
  this.path = null;
  if (this.blink) { this.blink.stop(); this.blink = null; }
  this.marker.setAlpha(0);
};

/* intenta mover; si choca, resbala por el eje que esté libre. Devuelve lo recorrido */
Player.prototype.move = function (dx, dy) {
  var x0 = this.x, y0 = this.y;
  // también choca con lo que se mueve (WALK.dynamic: Patricio), y le da un empujón en la dirección del paso
  function free(x, y) {
    if (walkBlocked(x, y)) return false;
    var w = WALK.feet[0], h = WALK.feet[1], l = x - w / 2, t = y - h;
    var o = (WALK.dynamic || []).filter(function (d) { var b = d.box(); return l < b[0] + b[2] && l + w > b[0] && t < b[1] + b[3] && y > b[1]; })[0];
    if (o) { o.bump(dx, dy); return false; }
    return true;
  }
  if (free(this.x + dx, this.y + dy)) { this.x += dx; this.y += dy; return Math.hypot(dx, dy); }
  if (free(this.x + dx, this.y)) this.x += dx;
  if (free(this.x, this.y + dy)) this.y += dy;
  return Math.hypot(this.x - x0, this.y - y0);
};

Player.prototype.update = function (dt, locked) {
  var k = this.keys, vx = 0, vy = 0, step = WALK.speed * dt / 1000;
  if (!locked) {
    vx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    vy = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
  }
  if (vx || vy) this.stopPath();                     // el teclado manda sobre el clic
  else if (this.path && !locked) {
    var wp = this.path[0], ex = wp[0] - this.x, ey = wp[1] - this.y, d = Math.hypot(ex, ey);
    if (d <= step) { this.path.shift(); if (!this.path.length) this.stopPath(); }
    vx = ex / (d || 1); vy = ey / (d || 1);
    step = Math.min(step, d);
  }
  var len = Math.hypot(vx, vy), moved = 0;
  if (len) {
    moved = this.move(vx / len * step, vy / len * step);
    // mirar hacia donde se intenta ir (aunque choque)
    if (Math.abs(vx) > Math.abs(vy) + 0.01) { this.dir = 'side'; this.flip = vx < 0; }
    else { this.dir = vy < 0 ? 'up' : 'down'; this.flip = false; }
    // atascado unos cuantos fotogramas seguidos: se rinde
    this.stuck = moved < step * 0.2 ? (this.stuck || 0) + 1 : 0;
    if (this.path && this.stuck > 8) this.stopPath();
  }
  if (moved > 0.01) {
    if (!this.moving) this.dist = WALK.stride;       // el primer paso sale al instante
    this.moving = true; this.dist += moved;
  } else { this.moving = false; this.dist = 0; }
  var f = this.moving ? Math.floor(this.dist / WALK.stride) % 4 : 0;
  var stepped = f !== this.frame && (f === 1 || f === 3);
  this.frame = f;
  if (stepped) { this.puff(); Sound.play('step'); }
  this.place();
};

/* polvillo en los pies a cada paso */
Player.prototype.puff = function () {
  var S = STAGE.S * stageRatio(), p = roomXY(this.x, this.y), back = this.dir === 'side' ? (this.flip ? 4 : -4) : (this.frame === 1 ? 3 : -3);
  var d = this.s.add.rectangle(Math.round(p[0] + back * S), p[1] - S, S * 2, S, 0xf3dcb4, 0.8).setDepth(this.spr.depth - 0.5);
  this.s.tweens.add({ targets: d, alpha: 0, y: d.y - 3 * S, scaleX: 0.5, duration: 320, ease: 'Quad.out', onComplete: function () { d.destroy(); } });
};

Player.prototype.place = function () {
  var p = roomXY(this.x, this.y), x = Math.round(p[0]), y = Math.round(p[1]), depth = 10 + this.y;
  this.spr.setTexture('diego_' + this.dir + this.frame).setFlipX(this.flip).setPosition(x, y).setDepth(depth);
  this.shadow.setPosition(x, y).setDepth(depth - 1);
};
