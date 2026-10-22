/* Al entrar, el cuarto se monta pieza a pieza como si fuera de LEGO.
   La imagen fija del cuarto se corta en ladrillos (al tresbolillo, como un muro) y cada uno lleva sus
   tetones del color de la pieza. Caen en su sitio fila a fila, de abajo arriba; al final aparece lo animado.
   Cualquier tecla o clic se salta la animación. */
var BUILD = {
  on: true,        // false para entrar sin animación
  bw: 16, bh: 8,   // tamaño del ladrillo en píxeles de arte
  drop: 34,        // desde cuánto más arriba cae cada ladrillo (píxeles de arte)
  total: 2300,     // duración de todo el montaje (ms)
  fall: 300        // lo que tarda en caer cada ladrillo (ms)
};

/* textura con los tetones de todos los ladrillos: 2 px por encima de cada uno, con el color de su borde de arriba */
function buildStuds(scene) {
  if (scene.textures.exists('lego_studs')) return;
  var src = scene.textures.get('room_full').getSourceImage(), W = ROOM.W, H = ROOM.H;
  var px = src.getContext('2d').getImageData(0, 0, W, H).data;
  var c = roomCanvas(W, H + 2), ctx = c.getContext('2d');
  function col(x, y, k) {
    var o = (Math.min(H - 1, y) * W + Math.min(W - 1, x)) * 4;
    return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(Math.min(255, px[o + i] * k + (k > 1 ? 18 : 0))); }) + ')';
  }
  eachBrick(function (x, y, w) {
    for (var sx = 1; sx + 2 <= w; sx += 4) {                       // un tetón de 2 px cada 4
      ctx.fillStyle = col(x + sx, y, 1.18); ctx.fillRect(x + sx, y, 2, 1);        // luz arriba
      ctx.fillStyle = col(x + sx, y, 0.92); ctx.fillRect(x + sx, y + 1, 2, 1);    // cuerpo
    }
  });
  scene.textures.addCanvas('lego_studs', c);
}

/* recorre los ladrillos: fila a fila, las impares desplazadas medio ladrillo */
function eachBrick(fn) {
  var bw = BUILD.bw, bh = BUILD.bh, rows = Math.ceil(ROOM.H / bh);
  for (var r = 0; r < rows; r++) {
    var y = r * bh, h = Math.min(bh, ROOM.H - y), x = r % 2 ? -bw / 2 : 0;
    for (; x < ROOM.W; x += bw) {
      var x0 = Math.max(0, x), w = Math.min(x + bw, ROOM.W) - x0;
      fn(x0, y, w, h, r, rows);
    }
  }
}

/* monta el cuarto; onDone se llama al terminar (o al saltarlo) */
function buildRoom(scene, onDone) {
  // los ladrillos se recortan de una textura aparte: si se añadieran recortes a 'room_base', Phaser
  // cambiaría su fotograma por defecto y la próxima vez el fondo del cuarto saldría como un solo ladrillo
  // (room_full: el fondo con los muebles que van en capas aparte, para que también se monten)
  if (!scene.textures.exists('lego_room')) scene.textures.addCanvas('lego_room', scene.textures.get('room_full').getSourceImage());
  var S = ROOM.SCALE, tex = scene.textures.get('lego_room'), studs, pieces = [], finished = false;
  buildStuds(scene); studs = scene.textures.get('lego_studs');
  // mientras se monta, solo se ve el fondo: lo demás se esconde y luego se devuelve como estaba
  var hidden = scene.children.list.filter(function (o) { return o.visible && o !== scene.bg && !o.keepDuringBuild; });
  hidden.forEach(function (o) { o.setVisible(false); });

  var n = 0;
  eachBrick(function (x, y, w, h, r, rows) {
    var key = 'b' + x + '_' + y;
    if (!tex.has(key)) tex.add(key, 0, x, y, w, h);
    if (!studs.has(key)) studs.add(key, 0, x, y, w, 2);
    // las filas de arriba se dibujan encima: así cada ladrillo tapa los tetones del de debajo
    var p = roomXY(x, y), d = 1 + (rows - r) * 0.01 + n++ * 0.00001;
    var brick = scene.add.image(p[0], p[1], 'lego_room', key).setOrigin(0).setScale(S).setDepth(d);
    var stud = scene.add.image(p[0], p[1] - 2 * S, 'lego_studs', key).setOrigin(0).setScale(S).setDepth(d + 0.005);
    var parts = [brick, stud];
    pieces.push(brick, stud);
    // de abajo arriba; en cada fila de izquierda a derecha con un poco de azar
    var order = (rows - 1 - r) / rows, delay = order * (BUILD.total - BUILD.fall - 200) + (x / ROOM.W) * 160 + Math.random() * 90;
    parts.forEach(function (o) { o.y -= BUILD.drop * S; o.setAlpha(0); });
    scene.tweens.add({
      targets: parts, delay: delay, duration: BUILD.fall,
      y: '+=' + BUILD.drop * S, ease: 'Quad.in',
      alpha: { value: 1, duration: BUILD.fall * 0.4, ease: 'Linear' },
      onComplete: function () { scene.tweens.add({ targets: brick, y: brick.y + S, duration: 50, yoyo: true }); Sound.play('brick'); }  // «clic» al encajar
    });
  });

  function finish() {
    if (finished) return; finished = true;
    scene.input.keyboard.off('keydown', finish); scene.input.off('pointerdown', finish);
    scene.tweens.killTweensOf(pieces);
    pieces.forEach(function (o) { o.destroy(); });
    hidden.forEach(function (o) { o.setVisible(true); });
    // el cuarto ya montado: lo animado aparece con un pequeño salto
    [scene.player.spr, scene.buddy.spr].forEach(function (o) {
      var sc = o.scaleX; o.setScale(0);
      scene.tweens.add({ targets: o, scale: sc, duration: 260, ease: 'Back.out' });
    });
    onDone();
  }
  scene.time.delayedCall(BUILD.total + 120, finish);
  // saltar con cualquier tecla o clic (un instante después de entrar, para no saltarlo sin querer)
  scene.time.delayedCall(250, function () {
    if (finished) return;
    scene.input.keyboard.on('keydown', finish); scene.input.on('pointerdown', finish);
  });
}
