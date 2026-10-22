/* Cuadro de diálogo con retrato, nombre, texto letra a letra y botones Continuar / Saltar.
   Uso: new Dialog(scene).show([{ name, text }, ...], function onEnd(completado) {})
   Cada línea puede llevar su retrato: portrait (clave de textura) y portraitScale; si no, sale Diego.
   Con choices: ['UNO', 'OTRO'] los dos botones pasan a ser esas opciones y onEnd recibe (true, índice elegido).
   Teclado: Enter/Espacio/E pulsa el botón marcado, ← → cambia de botón, Esc salta.
   Si un texto no cabe en DIALOG_ROWS líneas, se parte solo en varias páginas (así nunca pasa por debajo de los botones). */
var DIALOG_ROWS = 3;
function Dialog(scene) {
  var s = this.scene = scene, W = CFG.W, H = CFG.H, F = CFG.font, self = this;
  // la caja va abajo, a la derecha del retrato; en el móvil (cuarto recortado) se encoge al recorte
  var C = VIEW.crop, bottom = C.y + C.h, narrow = C.w < W;
  var bx = narrow ? C.x + 128 : 330, by = bottom - 163, bw = narrow ? C.w - 138 : 560, bh = 147;   // caben 3 líneas encima de los botones
  var c = this.box = s.add.container(0, 0).setDepth(1000).setVisible(false);
  var g = s.add.graphics();

  // fondo del retrato: triángulo azul
  g.fillStyle(0x7aa7ee, 1).fillTriangle(bx - 126, bottom - 16, bx - 126, bottom - 150, bx, bottom - 16);
  c.add(g);
  // retrato: busto del muñeco ampliado
  var bust = makeTexture(s, 'diego_bust', SPRITES.diego.slice(0, 22));
  this.bust = s.add.image(bx - 60, bottom - 16, bust).setOrigin(0.5, 1).setScale(5);
  c.add(this.bust);

  // caja
  var b = s.add.graphics();
  b.fillStyle(0x000000, 0.45).fillRect(bx + 4, by + 4, bw, bh);
  b.fillStyle(0x9c8ad6, 1).fillRect(bx, by, bw, bh);
  b.fillStyle(0x120c22, 1).fillRect(bx + 3, by + 3, bw - 6, bh - 6);
  // pestaña con el nombre
  b.fillStyle(0x120c22, 1).fillRect(bx, by - 28, 96, 31);
  b.fillStyle(0x7aa7ee, 1).fillRect(bx + 3, by - 25, 90, 25);
  b.fillStyle(0xa9c6f5, 1).fillRect(bx + 3, by - 25, 90, 2);
  c.add(b);
  this.nameT = s.add.text(bx + 48, by - 12, '', { fontFamily: CFG.fontUi, fontSize: '21px', color: '#120b1c' }).setOrigin(0.5);
  this.textT = s.add.text(bx + 18, by + 16, '', { fontFamily: CFG.fontUi, fontSize: '19px', color: '#ecebdd', wordWrap: { width: bw - 36 }, lineSpacing: 4 });
  c.add([this.nameT, this.textT]);

  // botones
  this.btns = [
    this._button(bx + bw - 236, by + bh - 42, 120, t('CONTINUAR'), 'primary', function () { if (self.choosing) self._pick(0); else self.next(); }),
    this._button(bx + bw - 102, by + bh - 42, 86, t('SALTAR'), 'ghost', function () { if (self.choosing) self._pick(1); else self.cancel(); })
  ];
  this.btns.forEach(function (bt) { c.add([bt.ring, bt.g, bt.t, bt.z]); });
  this.focus = 0; this._paintFocus();

  this.open = false; this.lines = []; this.i = 0; this.done = true; this.timer = null;
  s.input.keyboard.on('keydown', function (e) {
    if (!self.open) return;
    if (e.code === 'Escape') self.cancel();
    else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { self.focus = 1 - self.focus; self._paintFocus(); }
    else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') { if (!self.done) self.next(); else self.btns[self.focus].act(); }
  });
  // tocar el texto también avanza (móvil)
  var tz = s.add.zone(bx, by, bw, bh - 48).setOrigin(0).setInteractive();
  tz.on('pointerdown', function () { if (self.open) self.next(); });
  c.add(tz);
}
/* Botones pixel: borde oscuro de 3 px, luz arriba-izquierda y sombra abajo-derecha por dentro.
   El marcado (teclado o ratón encima) lleva un marco ámbar alrededor. */
var BTN = {
  primary: { fill: 0x86b0ea, dark: 0x5b84c9 },
  ghost:   { fill: 0xb9b0d6, dark: 0x8d7bb5 }
};
Dialog.prototype._button = function (x, y, w, label, kind, act) {
  var s = this.scene, h = 30, self = this, st = BTN[kind], INK = 0x120b1c;
  var ring = s.add.graphics(), g = s.add.graphics();
  var bt = { ring: ring, g: g, x: x, y: y, w: w, h: h, act: function () { Sound.play('select'); act(); }, hot: false, down: false };
  bt.paint = function () {
    var o = bt.down ? 1 : 0, X = x + o, Y = y + o, b = 3, k = 3; g.clear();
    g.fillStyle(INK, 1).fillRect(X, Y, w, h);                                   // borde
    g.fillStyle(st.fill, 1).fillRect(X + b, Y + b, w - 2 * b, h - 2 * b);       // cara
    if (bt.down) {
      g.fillStyle(st.dark, 1).fillRect(X + b, Y + b, w - 2 * b, k).fillRect(X + b, Y + b, k, h - 2 * b);
    } else {
      g.fillStyle(0xffffff, 0.5).fillRect(X + b, Y + b, w - 2 * b - k, k).fillRect(X + b, Y + b, k, h - 2 * b - k); // luz
      g.fillStyle(st.dark, 1).fillRect(X + b, Y + h - b - k, w - 2 * b, k).fillRect(X + w - b - k, Y + b, k, h - 2 * b); // sombra
    }
    g.setAlpha(bt.hot ? 1 : 0.96);
    t.x = x + w / 2 + o; t.y = y + h / 2 + o;
  };
  var t = s.add.text(x + w / 2, y + h / 2, label, { fontFamily: CFG.fontUi, fontSize: '17px', color: '#120b1c' }).setOrigin(0.5).setLetterSpacing(1.2);
  bt.t = t;
  var z = s.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
  bt.z = z;
  z.on('pointerover', function () { self.focus = self.btns.indexOf(bt); self._paintFocus(); });
  z.on('pointerdown', function () { bt.down = true; bt.paint(); });
  z.on('pointerup', function () { bt.down = false; bt.paint(); bt.act(); });
  z.on('pointerout', function () { bt.down = false; bt.paint(); });
  bt.paint();
  return bt;
};
Dialog.prototype._paintFocus = function () {
  var self = this;
  this.btns.forEach(function (bt, i) {
    bt.hot = i === self.focus; bt.paint();
    bt.ring.clear();
    if (bt.hot) {
      bt.ring.fillStyle(0xf2c66d, 1).fillRect(bt.x - 7, bt.y - 7, bt.w + 14, bt.h + 14);
      bt.ring.fillStyle(0x120b1c, 1).fillRect(bt.x - 4, bt.y - 4, bt.w + 8, bt.h + 8);
    }
  });
};
Dialog.prototype.show = function (lines, onEnd) {
  // partir en páginas lo que no quepa (las opciones, si las hay, van en la última)
  var self = this, pages = [];
  lines.forEach(function (l) {
    var rows = self.textT.getWrappedText(l.text);
    if (rows.length <= DIALOG_ROWS) { pages.push(l); return; }
    for (var i = 0; i < rows.length; i += DIALOG_ROWS) {
      var last = i + DIALOG_ROWS >= rows.length;
      pages.push(Object.assign({}, l, { text: rows.slice(i, i + DIALOG_ROWS).join('\n'), choices: last ? l.choices : undefined }));
    }
  });
  this.lines = pages; this.i = 0; this.onEnd = onEnd || function () {}; this.open = true; this.box.setVisible(true);
  this.focus = 0; this._paintFocus(); this._line();
};
Dialog.prototype._line = function () {
  var l = this.lines[this.i], self = this, n = 0;
  this.nameT.setText(l.name); this.textT.setText(''); this.done = false;
  this.bust.setTexture(l.portrait || 'diego_bust').setScale(l.portraitScale || 5);
  if (this.timer) this.timer.remove();
  this.choosing = !!l.choices;
  this.btns[0].t.setText(l.choices ? l.choices[0] : t(this.i === this.lines.length - 1 ? '¡VAMOS!' : 'CONTINUAR'));
  this.btns[1].t.setText(l.choices ? l.choices[1] : t('SALTAR'));
  this.timer = this.scene.time.addEvent({ delay: 26, repeat: l.text.length - 1, callback: function () {
    n++; self.textT.setText(l.text.slice(0, n)); if (n >= l.text.length) self.done = true;
    if (n % 2 && l.text[n - 1] !== ' ') Sound.play('blip', l.voice);   // cada uno con su voz (más aguda o más grave)
  } });
};
Dialog.prototype.next = function () {
  if (!this.open) return;
  if (!this.done) { this.timer.remove(); this.textT.setText(this.lines[this.i].text); this.done = true; return; }
  if (this.choosing) return;                                  // una pregunta: hay que elegir una opción (o Esc)
  if (this.i < this.lines.length - 1) { this.i++; this._line(); } else this._close(true);
};
Dialog.prototype.cancel = function () { if (this.open) this._close(false); };
Dialog.prototype._pick = function (i) {
  if (!this.done) { this.next(); return; }                 // primero termina de escribirse la pregunta
  this._close(true, i);
};
Dialog.prototype._close = function (ok, picked) {
  this.open = false; this.box.setVisible(false); if (this.timer) this.timer.remove(); this.onEnd(ok, picked);
};
