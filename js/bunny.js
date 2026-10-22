/* Patricio, el conejo: va a su aire por el cuarto dando saltitos, choca con los muebles y con Diego.
   Si Diego se le echa encima, sale despedido de un salto; a veces vuelve junto a su zanahoria.
   Se mueve con velocidad y rozamiento, y los choques se resuelven eje a eje (rebota un poco). */
var BUNNY_CFG = {
  feet: [12, 4],          // caja de los pies (ancho, alto) en píxeles de arte
  hop: 0.32,              // lo que dura un salto (s)
  height: 4,              // lo alto que salta (píxeles de arte)
  speed: [28, 48],        // velocidad de un salto suyo (px/s)
  push: 80,               // velocidad cuando Diego le empuja
  every: [1400, 3600],    // cada cuánto se le ocurre saltar (ms)
  friction: 3.5,
  carrot: [143, 160]      // su zanahoria de juguete: a veces vuelve a ella
};

function Bunny(scene, x, y) {
  var S = ROOM.SCALE;
  this.s = scene; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.z = 0; this.hopT = 0;
  this.flip = false; this.next = 1500; this.still = 0;
  this.shadow = scene.add.ellipse(0, 0, 13 * S, 3 * S, 0x5a3a22, 0.25);
  this.spr = scene.add.image(0, 0, 'bunny_a').setOrigin(0.5, 1).setScale(S);
  this.place();
}
/* caja de sus pies [x, y, ancho, alto] (para que Diego choque con él) */
Bunny.prototype.box = function () { var w = BUNNY_CFG.feet[0], h = BUNNY_CFG.feet[1]; return [this.x - w / 2, this.y - h, w, h]; };
/* ¿chocaría en (x, y)? Con los muebles, con las paredes (no sale por las puertas) y con Diego */
Bunny.prototype.blocked = function (x, y) {
  var w = BUNNY_CFG.feet[0], h = BUNNY_CFG.feet[1], l = x - w / 2, r = x + w / 2, t = y - h, f = WALK.floor;
  if (l < f[0] || r > f[2] || t < f[1] || y > f[3]) return true;
  if (WALK.blocks.some(function (b) { return l < b[0] + b[2] && r > b[0] && t < b[1] + b[3] && y > b[1]; })) return true;
  var p = this.s.player, pw = WALK.feet[0], ph = WALK.feet[1];
  return p && l < p.x + pw / 2 && r > p.x - pw / 2 && t < p.y && y > p.y - ph;
};
/* salto en una dirección (ángulo en radianes) a cierta velocidad */
Bunny.prototype.jump = function (ang, sp) { this.vx = Math.cos(ang) * sp; this.vy = Math.sin(ang) * sp; this.hopT = BUNNY_CFG.hop; };
/* Diego le empuja moviéndose en (dx, dy): sale de un salto en esa dirección */
Bunny.prototype.bump = function (dx, dy) {
  if (this.hopT > 0) return;
  this.jump(Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6, BUNNY_CFG.push);
  this.next = 1800 + Math.random() * 1500;
};
/* cuando le hablas: se queda quieto un momento y da un saltito en el sitio */
Bunny.prototype.greet = function () { this.vx = this.vy = 0; this.hopT = BUNNY_CFG.hop; this.still = 2500; };

Bunny.prototype.update = function (dt, frozen) {
  var s = dt / 1000, C = BUNNY_CFG;
  this.still = Math.max(0, this.still - dt);
  if (!frozen && !this.still) {
    this.next -= dt;
    if (this.next <= 0 && this.hopT <= 0) {
      var ang, toCarrot = Math.random() < 0.25 && Math.hypot(C.carrot[0] - this.x, C.carrot[1] - this.y) > 14;
      ang = toCarrot ? Math.atan2(C.carrot[1] - this.y, C.carrot[0] - this.x) : Math.random() * Math.PI * 2;
      this.jump(ang, C.speed[0] + Math.random() * (C.speed[1] - C.speed[0]));
      this.next = C.every[0] + Math.random() * (C.every[1] - C.every[0]);
    }
  }
  // movimiento con rozamiento; si choca en un eje, rebota un poco en ese eje
  var nx = this.x + this.vx * s, ny = this.y + this.vy * s;
  if (this.blocked(nx, this.y)) this.vx *= -0.4; else this.x = nx;
  if (this.blocked(this.x, ny)) this.vy *= -0.4; else this.y = ny;
  var f = Math.exp(-C.friction * s); this.vx *= f; this.vy *= f;
  if (Math.abs(this.vx) < 1 && Math.abs(this.vy) < 1 && this.hopT <= 0) this.vx = this.vy = 0;
  // altura del salto
  if (this.hopT > 0) { this.hopT = Math.max(0, this.hopT - s); this.z = Math.sin(Math.PI * (1 - this.hopT / C.hop)) * C.height; }
  else this.z = 0;
  if (Math.abs(this.vx) > 3) this.flip = this.vx > 0;            // el dibujo mira a la izquierda
  this.place();
};
Bunny.prototype.place = function () {
  var S = ROOM.SCALE, p = roomXY(this.x, this.y), x = Math.round(p[0]), y = Math.round(p[1]);
  this.spr.setTexture(this.z > 1 ? 'bunny_b' : 'bunny_a').setFlipX(this.flip).setPosition(x, Math.round(y - this.z * S)).setDepth(10 + this.y);
  this.shadow.setPosition(x, y).setDepth(9 + this.y).setScale(1 - this.z * 0.08);
};
