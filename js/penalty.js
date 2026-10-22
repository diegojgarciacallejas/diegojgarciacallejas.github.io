/* Minijuego de penaltis (se entra por la portería del patio).
   Una mira recorre la portería: un toque fija la dirección y otro la altura, y Diego chuta.
   El portero se lanza a un lado (o se queda); las escuadras no las alcanza. Cinco tiros.
   Arte de 320 x 180 ampliado x3, como el patio. */
var PEN = {
  shots: 5,
  goal: { x0: 67, x1: 253, top: 48, line: 112 },     // hueco de la portería (dentro de los postes)
  spot: [160, 156],                                   // punto de penalti
  aimX: [46, 274], aimY: [30, 112],                   // por dónde se mueve la mira (se puede apuntar fuera)
  period: 1500,                                       // ms que tarda la mira en ir y volver
  keeper: { x: 160, scale: 6 },
  lights: [[22, 6], [296, 6]]                         // torres de focos (x, y de los focos)
};

var KEEPER_ROWS = ['......hhhh......', '.....hhhhhh.....', '.....hhhhhh.....', '.....hskksh.....', '.....hssssh.....', '......ssss......', '.......ss.......',
  '...jjjjjjjjjj...', '..jjjjjjjjjjjj..', '.jjjJjjjjjjJjjj.', 'gjj.jjjjjjjj.jjg', 'gg..jjjjjjjj..gg', 'gg..jjjjjjjj..gg', '....jjjjjjjj....',
  '....JJJJJJJJ....', '....nnnnnnnn....', '....nnnnnnnn....', '....nnn..nnn....', '....sss..sss....', '....www..www....', '....www..www....',
  '....www..www....', '....www..www....', '....ooo..ooo....', '...oooo..oooo...'];

/* night: sin sol (de noche se ponen luna, estrellas y la luz de los focos encima) */
function drawPenaltyField(ctx, night) {
  var p = yardPaint(ctx), R = p.R, disc = p.disc, W = 320, g = PEN.goal, x, y, k;
  // cielo, montañas y un seto detrás de la portería
  R(0, 0, W, 14, '#6fbcf0'); R(0, 14, W, 14, '#8fcdf5'); R(0, 28, W, 14, '#b3defa');
  if (!night) { disc(40, 14, 8, '#fff2b0'); disc(40, 14, 5, '#ffe36e'); }
  p.ridge([[0, 30], [50, 20], [96, 32], [140, 18], [190, 30], [236, 16], [280, 28], [320, 22]], 44, '#a7bdd6', 24, '#94accb');
  R(0, 40, W, 16, '#4f9a5a');
  for (x = 0; x < W; x += 6) disc(x + 3, 41, 4, x % 12 ? '#4f9a5a' : '#3a7845');
  // torres de focos a los lados
  PEN.lights.forEach(function (l) {
    R(l[0], l[1] + 6, 2, 56 - l[1], '#5b6178'); R(l[0] + 2, l[1] + 6, 1, 56 - l[1], '#454a5e');
    R(l[0] - 6, l[1], 14, 7, '#3a3f52'); for (var b = 0; b < 3; b++) R(l[0] - 5 + b * 4, l[1] + 1, 3, 4, '#e8eef6');
  });
  // césped con franjas horizontales (más anchas cerca)
  R(0, 56, W, 124, '#7cc47c');
  for (y = 56, k = 0; y < 180; k++) { var h = 6 + k * 3; if (k % 2) R(0, y, W, h, '#73bb74'); y += h; }
  // áreas: la grande en perspectiva, el punto de penalti
  ctx.fillStyle = '#f3f6ee';
  R(0, g.line, W, 1, '#f3f6ee');
  for (y = g.line; y <= 130; y++) { var t = (y - g.line) / 18; ctx.fillRect(Math.round(100 - t * 10), y, 1, 1); ctx.fillRect(Math.round(220 + t * 10), y, 1, 1); }
  R(90, 130, 141, 1, '#f3f6ee');
  for (y = g.line; y <= 172; y++) { var u = (y - g.line) / 60; ctx.fillRect(Math.round(28 - u * 28), y, 1, 1); ctx.fillRect(Math.round(292 + u * 28), y, 1, 1); }
  disc(PEN.spot[0], PEN.spot[1] + 1, 2, '#f3f6ee');
  // portería: fondo de la red, red, postes y larguero
  R(g.x0, g.top, g.x1 - g.x0, g.line - g.top, 'rgba(40,70,40,.18)');
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (x = g.x0 + 3; x < g.x1; x += 5) ctx.fillRect(x, g.top + 4, 1, g.line - g.top - 4);
  for (y = g.top + 6; y < g.line; y += 5) ctx.fillRect(g.x0, y, g.x1 - g.x0, 1);
  R(g.x0 - 4, g.top - 4, 4, g.line - g.top + 4, '#ffffff'); R(g.x0 - 1, g.top, 1, g.line - g.top, '#d9e2ea');
  R(g.x1, g.top - 4, 4, g.line - g.top + 4, '#ffffff'); R(g.x1 + 3, g.top, 1, g.line - g.top, '#d9e2ea');
  R(g.x0 - 4, g.top - 4, g.x1 - g.x0 + 8, 4, '#ffffff'); R(g.x0 - 4, g.top - 1, g.x1 - g.x0 + 8, 1, '#d9e2ea');
  R(g.x0 - 4, g.line, 4, 2, 'rgba(0,0,0,.15)'); R(g.x1, g.line, 4, 2, 'rgba(0,0,0,.15)');
}

var Penalty = new Phaser.Class({
  Extends: Phaser.Scene, initialize: function () { Phaser.Scene.call(this, 'Penalty'); },
  init: function (d) { this.fromYard = !!(d && d.fromYard); },
  create: function () {
    STAGE = { OX: 0, OY: 0, S: 3, k: 1.5 };
    fitCamera(this);
    var self = this, S = 3, W = CFG.W;
    ensureYardTextures(this);
    var ph = dayPhase(), night = ph === 'night', key = night ? 'pen_field_n' : 'pen_field';
    if (!this.textures.exists(key)) { var c = roomCanvas(320, 180); drawPenaltyField(c.getContext('2d'), night); this.textures.addCanvas(key, c); }
    makeTexture(this, 'keeper', KEEPER_ROWS, { h: '#3a2a20', s: '#f2c18e', k: '#2b1d2e', j: '#f2a93b', J: '#c9822a', g: '#f2e14e', n: '#2b2f4a', w: '#f2a93b', o: '#2b1d2e' });
    DIEGO_FRAMES.up.forEach(function (rows, i) { makeTexture(self, 'diego_up' + i, rows); });
    this.add.image(0, 0, key).setOrigin(0).setScale(S);
    // de noche: oscuro, estrellas, luna y los focos encendidos iluminando el campo; al atardecer, tono cálido
    if (ph !== 'day') this.add.rectangle(0, 0, W, CFG.H, night ? 0x0b1030 : 0xd0603a, night ? 0.6 : 0.16).setOrigin(0).setDepth(35);
    if (night) {
      var sky = this.add.graphics().setDepth(36);
      for (var st = 0; st < 30; st++) sky.fillStyle(0xfffbe0, 0.4 + (st % 3) * 0.2).fillRect(((st * 97) % 320) * S, ((st * 41) % 26) * S, S, S);
      sky.fillStyle(0xf4f1dc, 1).fillCircle(100 * S, 14 * S, 5 * S);
      var self2 = this;
      PEN.lights.forEach(function (l) {
        glow(self2, (l[0] + 1) * S, (l[1] + 3) * S, 26 * S, 0xf4f8ff, 0.9).setDepth(36);   // los focos
        glow(self2, (l[0] < 160 ? 110 : 210) * S, 100 * S, 120 * S, 0xe8f0ff, 0.28).setDepth(36);   // la luz sobre el campo
      });
    }

    var g = PEN.goal;
    this.keeper = this.add.image(PEN.keeper.x * S, g.line * S, 'keeper').setOrigin(0.5, 1).setScale(PEN.keeper.scale).setDepth(5);
    this.ballShadow = this.add.ellipse(0, 0, 40, 10, 0x1e3c1e, 0.3).setDepth(6);
    this.ball = this.add.image(0, 0, 'ball').setOrigin(0.5, 1).setDepth(20);
    this.diego = this.add.image(0, 0, 'diego_up0').setOrigin(0.5, 1).setScale(5).setDepth(30);
    // la mira: un cuadrado pixelado con cruz
    this.aim = this.add.graphics().setDepth(40);
    this.aim.lineStyle(S, 0xd9665a, 1).strokeRect(-6 * S, -6 * S, 12 * S, 12 * S);
    this.aim.fillStyle(0xd9665a, 1).fillRect(-S / 2, -3 * S, S, 6 * S).fillRect(-3 * S, -S / 2, 6 * S, S);
    this.guide = this.add.graphics().setDepth(39);

    // marcador de arriba, mensaje del centro y ayuda de abajo
    this.dots = [];
    for (var i = 0; i < PEN.shots; i++) this.dots.push(this.add.rectangle(W / 2 + (i - (PEN.shots - 1) / 2) * 34, 22, 22, 22, 0x120c22).setStrokeStyle(3, 0xf3eedc).setDepth(50));
    this.big = T(this, W / 2, 210, '', 64, CFG.c.white, { fontStyle: '700', stroke: '#1a5a40', strokeThickness: 8 }).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.help = T(this, W / 2, CFG.H - 16, '', 17, CFG.c.cream, { fontFamily: CFG.fontUi, backgroundColor: '#120c22', padding: { x: 10, y: 4 } }).setOrigin(0.5, 1).setDepth(60);

    // volver al patio con el ratón o el dedo (en el móvil no hay Esc)
    var back = T(this, 14, 12, t('← Patio'), 18, CFG.c.cream, { fontFamily: CFG.fontUi, backgroundColor: '#120c22', padding: { x: 10, y: 6 } })
      .setDepth(70).setInteractive({ useHandCursor: true });
    back.on('pointerdown', function (p, x, y, ev) { ev.stopPropagation(); self.leave(); });
    var act = function (p, over) { if (!over || over.indexOf(back) < 0) self.press(); };
    this.input.on('pointerdown', act);
    this.input.keyboard.on('keydown', function (e) {
      if (e.repeat) return;
      if (e.code === 'Escape') self.leave();
      else if (/^(Space|Enter|NumpadEnter|KeyE)$/.test(e.code)) act();
    });
    this.reset(true);
    this.cameras.main.fadeIn(250, 15, 10, 30);
  },

  /* empezar una tanda nueva (all) o preparar el siguiente tiro */
  reset: function (all) {
    var S = 3;
    if (all) { this.n = 0; this.score = 0; this.dots.forEach(function (d) { d.setFillStyle(0x120c22); }); }
    this.phase = 'x'; this.t0 = this.time.now; this.ax = 160; this.ay = 80;
    this.ball.setPosition(PEN.spot[0] * S, PEN.spot[1] * S).setScale(6).setAngle(0);
    this.ballShadow.setPosition(PEN.spot[0] * S, PEN.spot[1] * S).setScale(1);
    this.diego.setPosition(PEN.spot[0] * S - 70, 180 * S + 40).setTexture('diego_up0');
    this.tweens.killTweensOf(this.keeper);
    this.keeper.setAngle(0).setY(PEN.goal.line * S).setX((PEN.keeper.x - 3) * S);
    this.tweens.add({ targets: this.keeper, x: (PEN.keeper.x + 3) * S, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });   // se balancea bajo palos
    this.aim.setVisible(true);
    this.help.setText(MOBILE.touch ? t('Tiro {0} de {1}  ·  Toca para fijar la DIRECCIÓN', this.n + 1, PEN.shots) : t('Tiro {0} de {1}  ·  Espacio, Enter o clic: fija la DIRECCIÓN  ·  Esc: volver al patio', this.n + 1, PEN.shots));
  },

  press: function () {
    if (this.phase === 'x') { this.phase = 'y'; this.t0 = this.time.now; this.help.setText(t(MOBILE.touch ? 'Ahora toca para fijar la ALTURA' : 'Ahora fija la ALTURA  ·  Espacio, Enter o clic')); }
    else if (this.phase === 'y') this.shoot();
    else if (this.phase === 'end') this.reset(true);
  },

  shoot: function () {
    var self = this, S = 3, g = PEN.goal, tx = this.ax, ty = this.ay;
    this.phase = 'fly'; this.aim.setVisible(false); this.guide.clear();
    this.time.delayedCall(360, function () { Sound.play('kick'); });
    this.help.setText('');
    // Diego coge carrerilla y chuta
    var frames = 0, run = this.time.addEvent({ delay: 90, repeat: 3, callback: function () { self.diego.setTexture('diego_up' + (++frames % 4)); } });
    this.tweens.add({ targets: this.diego, x: PEN.spot[0] * S - 24, y: 180 * S + 10, duration: 360, ease: 'Quad.in' });
    this.time.delayedCall(370, function () {
      // el portero elige: izquierda, centro o derecha
      var r = Math.random(), side = r < 0.4 ? -1 : r < 0.6 ? 0 : 1, kx = PEN.keeper.x;
      self.tweens.killTweensOf(self.keeper);
      if (side) self.tweens.add({ targets: self.keeper, x: (kx + side * 62) * S, y: (g.line - 8) * S, angle: side * 75, duration: 420, ease: 'Quad.out' });
      else self.tweens.add({ targets: self.keeper, y: (g.line - 10) * S, duration: 220, yoyo: true, ease: 'Quad.out' });
      // ¿dónde acaba? fuera, palo, parada o gol
      var out = tx < g.x0 - 4 || tx > g.x1 + 4 || ty < g.top - 4;
      var post = !out && (tx < g.x0 + 2 || tx > g.x1 - 2 || ty < g.top + 2);
      var reach = side === 0 ? Math.abs(tx - kx) < 30 && ty > g.top + 4
        : (side < 0 ? tx < kx - 6 && tx > kx - 100 : tx > kx + 6 && tx < kx + 100) && ty > g.top + 18;
      var res = out ? 'out' : post ? 'post' : reach ? 'save' : 'goal';
      var ex = res === 'save' ? kx + side * 40 : tx, ey = res === 'save' ? g.line - 18 : ty;
      self.tweens.add({ targets: self.ball, x: ex * S, y: ey * S, scale: 2.4, angle: 540, duration: 480, ease: 'Quad.out' });
      self.tweens.add({ targets: self.ballShadow, x: ex * S, y: Math.min(g.line, ey + 20) * S, scale: 0.4, duration: 480 });
      self.time.delayedCall(500, function () {
        if (res === 'save') self.tweens.add({ targets: self.ball, x: (ex + side * 30 - 10) * S, y: (g.line + 30) * S, scale: 3.5, duration: 400, ease: 'Quad.out' });
        if (res === 'post') self.tweens.add({ targets: self.ball, x: (tx < 160 ? tx - 30 : tx + 30) * S, y: (g.line + 25) * S, scale: 3.4, duration: 450, ease: 'Quad.out' });
        self.result(res);
      });
    });
  },

  result: function (res) {
    var self = this, scored = res === 'goal';
    if (scored) { this.score++; Logros.unlock('gol'); }
    Sound.play(scored ? 'goal' : 'miss');
    this.dots[this.n].setFillStyle(scored ? 0x3f9a68 : 0xd9665a);
    this.n++;
    var txt = t({ goal: '¡GOOOL!', save: '¡PARADA!', out: '¡FUERA!', post: '¡AL PALO!' }[res]);
    this.big.setText(txt).setStroke(scored ? '#1a5a40' : '#7a2a2a', 8).setScale(0.3).setAlpha(1);
    this.tweens.add({ targets: this.big, scale: 1, duration: 360, ease: 'Back.out' });
    this.time.delayedCall(1500, function () {
      if (self.n < PEN.shots) { self.tweens.add({ targets: self.big, alpha: 0, duration: 250 }); self.reset(false); return; }
      // fin de la tanda
      self.phase = 'end';
      if (self.score === PEN.shots) Logros.unlock('pleno');
      var msg = self.score === PEN.shots ? t('¡Pleno! Esto en el Bernabéu se canta') : t('Has marcado {0} de {1}', self.score, PEN.shots);
      self.tweens.killTweensOf(self.big);
      self.big.setText(msg).setStroke('#2a1f4f', 8).setScale(0.6).setAlpha(1);
      self.tweens.add({ targets: self.big, scale: 0.75, duration: 300, ease: 'Back.out' });
      self.help.setText(t(MOBILE.touch ? 'Toca para otra tanda' : 'Espacio, Enter o clic: otra tanda  ·  Esc: volver al patio'));
    });
  },

  leave: function () {
    var self = this;
    this.cameras.main.fadeOut(220, 15, 10, 30);
    this.time.delayedCall(230, function () { if (self.fromYard) Nav.back(); else Nav.go('Yard', { spawn: 'goal' }); });
  },

  update: function (time) {
    var S = 3, u;
    // la mira va y viene: primero en horizontal, luego en vertical
    if (this.phase === 'x' || this.phase === 'y') {
      u = (1 - Math.cos((time - this.t0) / PEN.period * Math.PI * 2)) / 2;
      if (this.phase === 'x') this.ax = PEN.aimX[0] + u * (PEN.aimX[1] - PEN.aimX[0]);
      else this.ay = PEN.aimY[1] - u * (PEN.aimY[1] - PEN.aimY[0]);
      this.aim.setPosition(Math.round(this.ax) * S, Math.round(this.ay) * S);
      // línea de puntos del balón a la mira
      var g = this.guide; g.clear(); g.fillStyle(0xffffff, 0.6);
      for (var k = 1; k < 12; k++) g.fillRect((PEN.spot[0] + (this.ax - PEN.spot[0]) * k / 12) * S - 2, (PEN.spot[1] - 8 + (this.ay - PEN.spot[1] + 8) * k / 12) * S - 2, 4, 4);
    }
  }
});
