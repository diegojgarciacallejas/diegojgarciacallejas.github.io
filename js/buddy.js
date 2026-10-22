/* Robot acompañante: flota detrás del muñeco y lo sigue con un poco de retraso.
   Vuela, así que no choca con los muebles; solo se queda dentro del cuarto. */
var BUDDY_CFG = {
  follow: 3.2,   // rapidez con la que alcanza su sitio (más = más pegado)
  height: 14,    // a cuántos píxeles de arte flota sobre el suelo
  gap: 15        // distancia al muñeco
};

function Buddy(scene, player) {
  this.s = scene; this.p = player; this.x = player.x + BUDDY_CFG.gap * stageRatio(); this.y = player.y - 4; this.t = 0;
  makeTexture(scene, 'buddy_a', BUDDY.a, BUDDY.pal); makeTexture(scene, 'buddy_b', BUDDY.b, BUDDY.pal);
  this.shadow = scene.add.ellipse(0, 0, 14 * STAGE.k / 1.6, 4 * STAGE.k / 1.6, 0x5a3a22, 0.25);
  this.spr = scene.add.image(0, 0, 'buddy_a').setOrigin(0.5, 1).setScale(STAGE.k);
}

Buddy.prototype.update = function (dt) {
  var p = this.p, r = stageRatio(), g = BUDDY_CFG.gap * r, tx, ty;
  this.t += dt / 1000;
  // su sitio: a la espalda del muñeco según hacia dónde mira
  if (p.dir === 'side') { tx = p.x + (p.flip ? g : -g); ty = p.y - 3 * r; }
  else if (p.dir === 'up') { tx = p.x + g * 0.8; ty = p.y + 8 * r; }
  else { tx = p.x + g; ty = p.y - 8 * r; }
  tx = Math.max(WALK.floor[0] + 6, Math.min(WALK.floor[2] - 6, tx));
  ty = Math.max(WALK.floor[1] + 4, Math.min(WALK.floor[3], ty));
  var k = 1 - Math.exp(-BUDDY_CFG.follow * dt / 1000);
  this.x += (tx - this.x) * k; this.y += (ty - this.y) * k;

  var S = STAGE.S, pos = roomXY(this.x, this.y), bob = Math.sin(this.t * 3) * 2;
  this.spr.setTexture(Math.floor(this.t * 2.5) % 3 ? 'buddy_a' : 'buddy_b')
    .setFlipX(tx < this.x - 1)
    .setPosition(Math.round(pos[0]), Math.round(pos[1] - (BUDDY_CFG.height + bob) * r * S)).setDepth(10 + this.y);
  this.shadow.setPosition(Math.round(pos[0]), Math.round(pos[1])).setDepth(9 + this.y).setScale(1 - bob * 0.06);
};
