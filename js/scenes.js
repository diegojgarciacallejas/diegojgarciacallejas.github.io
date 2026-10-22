/* Navegación: cada pantalla tiene su #hash, así el botón Atrás del navegador
   vuelve del cuarto al menú y del menú a la pantalla de inicio. */
var Nav = {
  hashes: { Title: '', Menu: '#menu', Room: '#', Yard: '#patio', Penalty: '#penaltis' },
  go: function (key, data) {
    var h = key === 'Room' ? '#' + ((data && data.mode) || 'full') : this.hashes[key];
    if (location.hash !== h) history.pushState({ key: key, data: data || null }, '', h || location.pathname);
    this.start(key, data);
  },
  // una sola vez hasta que llegue el popstate: si dos cosas piden «atrás» a la vez, no se retrocede dos pantallas
  back: function () {
    var self = this; if (this.backing) return;
    this.backing = true; setTimeout(function () { self.backing = false; }, 1000);
    history.back();
  },
  /* parar una escena: ya mismo si se puede; si Phaser está en mitad de un fotograma (p. ej. la propia escena pidió
     cambiar de pantalla), al terminarlo, para no destruirla mientras aún se está actualizando */
  stop: function (g, sc) { if (g.scene.isProcessing) sc.scene.stop(); else g.scene.stop(sc.scene.key); },
  /* Si se entra directamente con #menu o #full (un enlace, o al recargar), el historial no tiene
     las pantallas anteriores y «Atrás» saldría de la web. Se rehacen: inicio → menú → cuarto.
     Si la entrada ya es nuestra (history.state lleva datos), las anteriores ya existen y no se toca. */
  seed: function () {
    var t = this.fromHash(), h = location.hash;
    if (t[0] === 'Title' && h && !history.state) history.replaceState(null, '', location.pathname + location.search);   // quitar un #hash que no es nuestro
    if (t[0] === 'Title' || history.state) return;
    history.replaceState({ key: 'Title', data: null }, '', location.pathname + location.search);
    // cada pantalla, con las que tiene «detrás»: menú → cuarto → patio → penaltis
    var chain = ['Menu', 'Room', 'Yard', 'Penalty'], upto = chain.indexOf(t[0]);
    var data = { Menu: null, Room: upto > 1 ? { mode: 'full', from: 'yard' } : t[1], Yard: { fromRoom: true, spawn: upto > 2 ? 'goal' : null }, Penalty: { fromYard: true } };
    for (var i = 0; i <= upto; i++) history.pushState({ key: chain[i], data: data[chain[i]] }, '', chain[i] === 'Room' ? '#' + ((data.Room && data.Room.mode) || 'full') : this.hashes[chain[i]]);
  },
  start: function (key, data) {
    var g = window.game; if (!g) return;
    this.current = key;
    // parar las demás, también las que aún se están abriendo (cargando o creándose): si se cambia de pantalla
    // justo entonces y solo se parasen las que ya corren, acabarían dos escenas a la vez
    g.scene.scenes.forEach(function (sc) {
      var st = sc.sys.settings.status;
      if (sc.scene.key !== key && st >= Phaser.Scenes.START && st <= Phaser.Scenes.SLEEPING) Nav.stop(g, sc);
    });
    g.scene.start(key, data || {});
    g.scene.getScene(key).sys.bornAt = performance.now();
    if (VIEW.updateHint) VIEW.updateHint();
  },
  /* por si acaso: tras cada fotograma, la única escena en marcha es la última a la que se fue */
  watch: function (g) {
    var self = this;
    g.events.on('poststep', function () {
      if (self.current) g.scene.getScenes(true).forEach(function (sc) { if (sc.scene.key !== self.current) self.stop(g, sc); });
    });
  },
  fromHash: function () {
    var h = location.hash.replace('#', '');
    if (!h) return ['Title'];
    if (h === 'menu') return ['Menu'];
    if (h === 'patio') return ['Yard'];
    if (h === 'penaltis') return ['Penalty'];
    if (/^(full|os|cv|lab)$/.test(h)) return ['Room', { mode: h }];
    return ['Title'];                                                       // un #hash que no es nuestro: a la portada
  }
};
// Atrás / Adelante: si la entrada es nuestra, trae sus datos (p. ej. que se vuelve al cuarto desde el patio)
window.addEventListener('popstate', function (e) {
  var st = e.state, t = Nav.fromHash();
  Nav.backing = false;
  if (Viewer.isOpen()) { Viewer.hide(); return; }                          // «Atrás» con un proyecto abierto: solo se cierra
  if (st && st.viewer) return;                                             // «Adelante» hacia un proyecto ya cerrado: nada
  if (st && st.key === t[0]) Nav.start(st.key, st.data); else Nav.start(t[0], t[1]);
});

/* Una pulsación es de la pantalla en la que se hizo. Al cambiar de escena, Phaser aún podía entregar la misma tecla
   a la nueva: el Esc que sacaba del cuarto llegaba también al menú y volvía otra vez atrás (hasta salir de la web).
   Cada escena ignora las teclas pulsadas antes de abrirse (bornAt lo pone Nav.start), y solo la escena
   actual recibe teclas (la anterior puede seguir viva hasta el final del fotograma). */
(function () {
  var KP = Phaser.Input.Keyboard.KeyboardPlugin.prototype, emit = KP.emit;
  KP.emit = function (name, ev) {
    var born = this.scene && this.scene.sys.bornAt;
    if (born && ev && typeof ev.timeStamp === 'number' && ev.timeStamp < born) return false;
    if (Nav.current && this.scene && this.scene.sys.settings.key !== Nav.current) return false;   // la que se está cerrando, ya no
    return emit.apply(this, arguments);
  };
})();

/* Luz suave: un halo blanco difuminado que se tiñe del color de cada lámpara (se suma a lo de debajo).
   (x, y) en pantalla, r = radio en píxeles de pantalla */
function glow(scene, x, y, r, color, alpha) {
  if (!scene.textures.exists('glow')) {
    var c = roomCanvas(64, 64), ctx = c.getContext('2d'), g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); scene.textures.addCanvas('glow', c);
  }
  return scene.add.image(x, y, 'glow').setScale(r / 32).setTint(color).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(601);
}

/* ---- Salidas de una escena: WALK.exits dice dónde están y CFG.exits qué hacen ----
   Al acercarse sale un cartel; al cruzarla se va a otra escena o página (si tiene texto, antes se pregunta). */
function exitTags(scene) {
  return (WALK.exits || []).map(function (e) {
    var p = roomXY(e.tag[0], e.tag[1]);
    return T(scene, p[0], p[1], CFG.exits[e.id].label, 16, CFG.c.cream, { fontFamily: CFG.fontUi, backgroundColor: '#120c22', padding: { x: 6, y: 2 } })
      .setOrigin(e.align, 1).setDepth(900).setAlpha(0);
  });
}
function exitsUpdate(scene, busy) {
  var pl = scene.player;
  function inside(b) { return pl.x >= b[0] && pl.x < b[0] + b[2] && pl.y >= b[1] && pl.y < b[1] + b[3]; }
  if (scene.leaving && !walkExit(pl.x, pl.y)) scene.leaving = false;
  WALK.exits.forEach(function (e, i) {
    scene.exitTags[i].setAlpha(!busy && inside(e.near) ? 1 : 0);
    if (!scene.leaving && !busy && inside(e.hit)) leaveBy(scene, e);
  });
}
function leaveBy(scene, e) {
  var c = CFG.exits[e.id], pl = scene.player;
  scene.leaving = true; pl.stopPath();
  function go() {
    Sound.play(c.url ? 'ok' : 'door');
    if (c.url) { pl.path = [e.inside.slice()]; Viewer.open(c.url, c.title || c.label); return; }   // al cerrar, vuelve a entrar al cuarto
    scene.cameras.main.fadeOut(220, 15, 10, 30);
    scene.time.delayedCall(230, function () {
      if (c.to === 'Menu') Nav.back();                                      // el cuarto siempre viene del menú
      else if (c.to === 'Yard') {                                           // al volver, aparecer junto a esta puerta
        history.replaceState({ key: 'Room', data: { mode: 'full', from: 'yard' } }, '', location.hash);
        Nav.go('Yard', { fromRoom: true });
      } else if (c.to === 'Room') {
        if (scene.fromRoom) Nav.back(); else Nav.go('Room', { mode: 'full', from: 'yard' });
      }
    });
  }
  if (c.text) scene.dlg.show([{ name: 'Diego', text: c.text }], function (ok) { if (ok) go(); else pl.path = [e.inside.slice()]; });
  else go();
}

/* Escenas: Title -> Menu -> Room. La sala de la fase 1 es un marcador de posición. */
function T(s, x, y, txt, size, color, extra) {
  return s.add.text(x, y, txt, Object.assign({ fontFamily: CFG.font, fontSize: size + 'px', color: color || CFG.c.cream }, extra || {}));
}

/* fondo: sala oscura con desenfoque falso (capas de rectángulos + velo) */
function roomBackdrop(s, veil) {
  // el cuarto de verdad, desenfocado y oscurecido, detrás del título y del menú
  var W = CFG.W, H = CFG.H;
  ensureRoomTextures(s);
  s.add.rectangle(0, 0, W, H, 0x120b1c).setOrigin(0);
  var img = s.add.image(ROOM.OX, ROOM.OY, 'room_still').setOrigin(0).setScale(ROOM.SCALE);
  if (img.preFX) img.preFX.addBlur(1, 2, 2, 1.4, 0xffffff, 6);
  var g = s.add.graphics();
  g.fillStyle(0x120b1c, veil).fillRect(0, 0, W, H);
  g.fillStyle(0x000000, 0.18); for (var y = 0; y < H; y += 4) g.fillRect(0, y, W, 2); // líneas de pantalla
  return g;
}

/* Título 2D con profundidad: silueta negra + extrusión a rayas (verde oscuro / negro) + cara con borde negro */
function titleLine(s, parts, y, size) {
  var base = { fontFamily: CFG.font, fontSize: size + 'px', fontStyle: '700' };
  var meas = parts.map(function (p) { var t = s.add.text(0, 0, p.t, base); var w = t.width; t.destroy(); return w; });
  var total = meas.reduce(function (a, b) { return a + b; }, 0), x = CFG.W / 2 - total / 2, D = 6, k, d, i;
  var pos = []; parts.forEach(function (p, i) { pos.push(x); x += meas[i]; });
  function put(px, py, p, style) { return s.add.text(px, py, p.t, Object.assign({}, base, style)).setOrigin(0, 0.5); }
  // 1) silueta negra de toda la extrusión
  for (d = 0; d <= D; d += 2) parts.forEach(function (p, i) { put(pos[i] + d, y + d, p, { color: '#000', stroke: '#000', strokeThickness: 8 }); });
  // 2) extrusión a rayas, de lo más profundo a lo más cercano
  for (d = D; d >= 1; d--) parts.forEach(function (p, i) { put(pos[i] + d, y + d, p, { color: p.deep || CFG.c.greenDark }); });
  // 3) cara
  parts.forEach(function (p, i) { put(pos[i], y, p, { color: p.fill, stroke: '#000', strokeThickness: 5 }); });
}

/* Iconos en pixel art (c crema, d oscuro, b azul, l azul claro, g verde, k negro) */
var ICONS = {
  mail: ['..cccccccc..', 'ccddccccddcc', 'ccccdccdcccc', 'cccccddccccc', 'cccccccccccc', 'cccccccccggc', 'ccccccccgggg', 'cccccccccggc'],
  linkedin: ['.bbbbbbbbbbbb.', 'bllllllllllllb', 'bbccbbbbbbbbbb', 'bbccbbbbbbbbbb', 'bbbbbbbbbbbbbb', 'bbccbbcccccbbb', 'bbccbbcccccbbb', 'bbccbbccbbccbb', 'bbccbbccbbccbb', 'bbccbbccbbccbb', 'bbccbbccbbccbb', 'bbccbbccbbccbb', 'bbbbbbbbbbbbbb', '.bbbbbbbbbbbb.'],
  github: ['..cc....cc.', '..cc....cc.', '.cccccccccc', '.cccccccccc', '.ccggccggcc', '.ccggccggcc', '.cccccccccc', '.ccccccccc.', 'cccccccccc.', '....cccc...', '....cccc...']
};
var ICOL = { c: 0xece9de, d: 0x1d1233, b: 0x4f78bd, l: 0x86a9e6, g: 0x3f9a68 };
function drawPixels(g, rows, cx, cy, sz) {
  var w = rows[0].length * sz, h = rows.length * sz, x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
  rows.forEach(function (r, j) { for (var i = 0; i < r.length; i++) if (ICOL[r[i]] !== undefined) { g.fillStyle(ICOL[r[i]], 1); g.fillRect(x0 + i * sz, y0 + j * sz, sz, sz); } });
}
/* caja con bisel pixel: borde morado, luz arriba-izquierda, sombra abajo */
function bevelBox(g, x, y, sz, edge) {
  g.clear();
  g.fillStyle(0x000000, 1).fillRect(x + 4, y + 4, sz, sz);            // sombra sólida
  g.fillStyle(edge, 1).fillRect(x, y, sz, sz);                         // borde
  g.fillStyle(0x1d1233, 1).fillRect(x + 3, y + 3, sz - 6, sz - 6);     // fondo
  g.fillStyle(0x2c1f4d, 1).fillRect(x + 3, y + 3, sz - 6, 2);          // brillo arriba
}
function socialIcons(s, y) {
  var n = CFG.links.length, gap = 16, size = 46, x0 = Math.round(CFG.W / 2 - (n * size + (n - 1) * gap) / 2);
  CFG.links.forEach(function (l, i) {
    var x = x0 + i * (size + gap), bg = s.add.graphics(); bevelBox(bg, x, y, size, 0x4b3677);
    var ico = s.add.graphics(); drawPixels(ico, ICONS[l.icon], x + size / 2, y + size / 2, 2);
    var hit = s.add.zone(x, y, size, size).setOrigin(0).setInteractive({ useHandCursor: true });
    var tip = s.add.text(x + size / 2, y + size + 10, l.label, { fontFamily: CFG.fontUi, fontSize: '13px', color: CFG.c.dim, fontStyle: '500' }).setOrigin(0.5, 0).setAlpha(0);
    hit.on('pointerover', function () { bevelBox(bg, x, y - 2, size, 0x3f9a68); ico.y = -2; tip.setAlpha(1); });
    hit.on('pointerout', function () { bevelBox(bg, x, y, size, 0x4b3677); ico.y = 0; tip.setAlpha(0); });
    hit.on('pointerdown', function (p, lx, ly, ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (l.mailto) window.location.href = 'mailto:' + l.mailto.join(String.fromCharCode(64));
      else window.open(l.url, '_blank', 'noopener');
    });
  });
}

var Title = new Phaser.Class({
  Extends: Phaser.Scene, initialize: function () { Phaser.Scene.call(this, 'Title'); },
  create: function () {
    fitCamera(this);
    if (Nav.fromHash()[0] !== 'Title') { this.scene.stop(); return; } // se entró con #menu o #full
    var W = CFG.W, H = CFG.H, self = this, c = CFG.c;
    roomBackdrop(this, 0.55);
    titleLine(this, [{ t: t('Portfolio'), fill: c.white, deep: c.greenDark }], 100, 76);
    titleLine(this, [{ t: CFG.name, fill: c.white2, deep: c.greenDark }, { t: '.exe', fill: c.green, deep: c.greenDeep }], 186, 76);
    var hint = T(this, W / 2, 272, t(MOBILE.touch ? 'Toca la pantalla para empezar' : 'Pulsa cualquier tecla para iniciar'), 21, c.white).setOrigin(0.5);
    var on = true;
    this.time.addEvent({ delay: 650, loop: true, callback: function () { on = !on; hint.setColor(on ? c.white : c.gray); } });
    socialIcons(this, 330);
    T(this, W / 2, H - 22, t('Diseñado y programado por Diego José García Callejas  ·  2026'), 14, CFG.c.dim, { fontFamily: CFG.fontUi, fontStyle: '500' }).setOrigin(0.5).setLetterSpacing(1);
    // avanzar con cualquier tecla, salvo las de zoom/sistema (Ctrl, Alt, Shift, Meta, F-teclas) y Esc
    var gone = false;
    // en el móvil en vertical no hay menú: directos al cuarto
    var go = function () { if (gone) return; gone = true; Sound.play('ok'); if (MOBILE.roomOnly()) Nav.go('Room', { mode: 'full' }); else Nav.go('Menu'); };
    this.input.keyboard.on('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(Control|Shift|Alt|Meta|OS|F\d+|Tab|Escape)/.test(e.key)) return;
      go();
    });
    this.input.on('pointerdown', function (p, over) { if (!over.length) go(); });
  }
});

var Menu = new Phaser.Class({
  Extends: Phaser.Scene, initialize: function () { Phaser.Scene.call(this, 'Menu'); },
  create: function () {
    fitCamera(this);
    var W = CFG.W, H = CFG.H, self = this, n = CFG.menu.length, c = CFG.c;
    roomBackdrop(this, 0.72);
    titleLine(this, [{ t: t('Elige tu aventura'), fill: c.white, deep: c.greenDark }], 70, 44);
    this.sel = 0; this.items = [];
    var colW = 220, cy = 235;
    this.frame = this.add.graphics();
    this.arrow = this.add.graphics();
    CFG.menu.forEach(function (m, i) {
      var x = Math.round(W / 2 + (i - (n - 1) / 2) * colW);
      var key = makeTexture(self, 'spr_' + m.icon, SPRITES[m.icon]);
      var img = self.add.image(x, cy - 20, key).setScale(m.icon === 'diego' ? 3 : 4).setOrigin(0.5);
      var label = T(self, x, cy + 52, m.label, 25, c.white, { fontStyle: '700', align: 'center' }).setOrigin(0.5);
      var hint = T(self, x, cy + 80, m.hint, 15, CFG.c.dim, { fontFamily: CFG.fontUi, fontStyle: '500', align: 'center', wordWrap: { width: colW - 40 } }).setOrigin(0.5, 0).setAlpha(0);
      var zone = self.add.zone(x - colW / 2 + 8, cy - 110, colW - 16, 260).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', function () { self.pick(i); });
      zone.on('pointerdown', function () { self.pick(i); self.go(); });
      self.items.push({ x: x, img: img, label: label, hint: hint, base: img.y });
    });
    T(this, W / 2, H - 22, t('Diseñado y programado por Diego José García Callejas  ·  2026'), 14, CFG.c.dim, { fontFamily: CFG.fontUi, fontStyle: '500' }).setOrigin(0.5).setLetterSpacing(1);
    this.pick(0);
    this.tweens.add({ targets: this.arrow, y: 5, duration: 450, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });
    this.input.keyboard.on('keydown', function (e) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') self.pick((self.sel + n - 1) % n);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') self.pick((self.sel + 1) % n);
      else if (e.code === 'Enter' || e.code === 'Space') self.go();
      else if (e.code === 'Escape' && !e.repeat) Nav.back();     // vuelve al título
    });
  },
  pick: function (i) {
    if (this.bob) { this.bob.stop(); this.items[this.sel].img.y = this.items[this.sel].base; if (this.sel !== i) Sound.play('select'); }
    this.sel = i;
    var it = this.items[i], c = CFG.c, colW = 220, cy = 235;
    this.items.forEach(function (o, k) { o.label.setColor(k === i ? c.green : c.white); o.hint.setAlpha(k === i ? 1 : 0); });
    var f = this.frame; f.clear();
    var x = it.x - colW / 2 + 12, y = cy - 112, w = colW - 24, h = 262;
    f.fillStyle(0x000000, 0.5).fillRect(x + 5, y + 5, w, h);
    f.fillStyle(0x4b3677, 1).fillRect(x, y, w, h);
    f.fillStyle(0x1a1130, 0.96).fillRect(x + 4, y + 4, w - 8, h - 8);
    var a = this.arrow; a.clear(); a.fillStyle(0x3f9a68, 1);
    for (var r = 0; r < 4; r++) a.fillRect(it.x - 8 + r * 2, y + 8 + r * 3, 16 - r * 4, 3);
    this.bob = this.tweens.add({ targets: it.img, y: it.base - 4, duration: 380, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
  },
  go: function () {
    var m = CFG.menu[this.sel];
    Sound.play('ok');
    if (m.url) { Viewer.open(m.url, m.label); return; }        // proyectos (expediente, laboratorio): en el visor
    Nav.go('Room', { mode: m.id });
  }
});

var Room = new Phaser.Class({
  Extends: Phaser.Scene, initialize: function () { Phaser.Scene.call(this, 'Room'); },
  init: function (d) { this.mode = d.mode; this.from = d.from; },
  preload: function () { this.load.image('photo_summit', 'img/cumbre.jpg'); },
  create: function () {
    WALK = WALK_ROOM; STAGE = STAGE_ROOM;
    // en el móvil en vertical no se sale al menú por la puerta de abajo
    WALK_ROOM.allExits = WALK_ROOM.allExits || WALK_ROOM.exits;
    WALK_ROOM.exits = WALK_ROOM.allExits.filter(function (e) { return !(MOBILE.roomOnly() && e.id === 'menu'); });
    fitCamera(this);
    var self = this, W = CFG.W, H = CFG.H, S = ROOM.SCALE;
    ensureRoomTextures(this);
    this.bg = this.add.rectangle(0, 0, W, H, 0x120b1c).setOrigin(0);
    this.add.image(ROOM.OX, ROOM.OY, 'room_base').setOrigin(0).setScale(S);

    // foto de la cumbre en el marco, reducida a 36x26 píxeles para que sea pixel art
    if (this.textures.exists('photo_summit') && !this.textures.exists('photo_px')) {
      var src = this.textures.get('photo_summit').getSourceImage(), c = roomCanvas(26, 16), x = c.getContext('2d');
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      var sw = src.width, sh = src.height, k = Math.max(26 / sw, 16 / sh);
      x.drawImage(src, (26 - sw * k) / 2, (16 - sh * k) / 2, sw * k, sh * k);
      this.textures.addCanvas('photo_px', c);
    }
    if (this.textures.exists('photo_px')) { var pp = roomXY(72, 16); this.add.image(pp[0], pp[1], 'photo_px').setOrigin(0).setScale(S); }

    // ventana animada
    this.win = this.textures.createCanvas('room_win_' + Date.now(), ROOM.WIN.w, ROOM.WIN.h);
    var wp = roomXY(ROOM.WIN.x, ROOM.WIN.y);
    this.add.image(wp[0], wp[1], this.win).setOrigin(0).setScale(S);
    this.winT = 0; this.drawWin(0);

    // capa con los objetos animados (pantalla, vapor, reloj, robot, servidor...)
    this.fx = this.textures.createCanvas('room_fx_' + Date.now(), ROOM.W, ROOM.H);
    this.add.image(ROOM.OX, ROOM.OY, this.fx).setOrigin(0).setScale(S);
    drawRoomFx(this.fx.getContext(), 0); this.fx.refresh();

    // muebles que tapan al muñeco cuando pasa por detrás: cada capa a la profundidad de su base (room.js)
    var PR = ROOM.PROPS;
    this.add.image(ROOM.OX, ROOM.OY, 'room_bed').setOrigin(0).setScale(S).setDepth(10 + PR.bed.foot);
    this.add.image(ROOM.OX, ROOM.OY, 'room_gum').setOrigin(0).setScale(S).setDepth(10 + PR.gum.foot);
    this.srv = this.textures.createCanvas('room_srv_' + Date.now(), ROOM.W, ROOM.H);
    this.add.image(ROOM.OX, ROOM.OY, this.srv).setOrigin(0).setScale(S).setDepth(10 + PR.server.foot);
    this.tank = this.textures.createCanvas('room_tank_' + Date.now(), ROOM.W, ROOM.H);
    this.add.image(ROOM.OX, ROOM.OY, this.tank).setOrigin(0).setScale(S).setDepth(10 + PR.tank.foot);
    this.drawProps(0);
    // detrás de la pecera, el muñeco se ve a través del agua: una copia azulada recortada al cristal
    var aq = ROOM.TANK, gp = roomXY(aq.x + 1, aq.y + 3), glass = this.make.graphics();
    glass.fillStyle(0xffffff).fillRect(gp[0], gp[1], (aq.w - 2) * S, 16 * S);
    this.ghost = this.add.image(0, 0, 'diego_down0').setOrigin(0.5, 1).setScale(S * 0.8).setAlpha(0.5).setTint(0xbdf0f8)
      .setDepth(10 + PR.tank.foot + 0.5).setVisible(false);
    this.ghost.setMask(glass.createGeometryMask());

    // rayo de sol que entra por la ventana y motas de polvo
    var beam = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setDepth(500);
    var poly = [[128, 48], [168, 48], [160, 170], [96, 170]].map(function (p) { var q = roomXY(p[0], p[1]); return new Phaser.Math.Vector2(q[0], q[1]); });
    beam.fillStyle(0xffe9a0, 0.10).fillPoints(poly, true);
    var inner = [[137, 48], [159, 48], [150, 166], [112, 166]].map(function (p) { var q = roomXY(p[0], p[1]); return new Phaser.Math.Vector2(q[0], q[1]); });
    beam.fillStyle(0xfff3c4, 0.07).fillPoints(inner, true);
    this.tweens.add({ targets: beam, alpha: 0.75, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.motes = [];
    for (var i = 0; i < 14; i++) {
      var m = this.add.rectangle(0, 0, S, S, 0xfff6d0, 0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(501);
      m.u = Math.random(); m.v = Math.random(); m.sp = 0.02 + Math.random() * 0.03; this.motes.push(m);
    }
    this.beam = beam;
    // flor del cactus (sale al regarlo) y la regadera
    makeTexture(this, 'cactus_flower', ['.p.p.', 'ppypp', '.ppp.', '..g..'], { p: '#ef6fa0', y: '#ffe36e', g: '#3a7845' });
    makeTexture(this, 'can', ['...oo......', '..o..o.....', '.oooooo...o', 'obbbbbboooo', 'obbbbbbo...', 'obbbbbbo...', '.oooooo....'], { o: '#2b1d2e', b: '#7aa7ee' });
    var fp = roomXY(251.5, 193);
    try { this.waterings = +sessionStorage.getItem('cactus-riegos') || 0; } catch (e) { this.waterings = 0; }
    this.flower = this.add.image(fp[0], fp[1], 'cactus_flower').setOrigin(0.5, 1).setScale(S).setDepth(10 + 212).setVisible(this.waterings > 0);

    // día y noche según la hora de Madrid (dayPhase, en clock.js): de noche el cuarto se oscurece y se
    // encienden la lámpara de la mesilla, las pantallas, los ventiladores del PC y los ojos del robot
    this.shade = this.add.rectangle(ROOM.OX, ROOM.OY, ROOM.W * S, ROOM.H * S, 0x0b1030, 0).setOrigin(0).setDepth(600);
    // [x, y (arte), color, radio (arte), intensidad]
    this.lights = [[ROOM.NIGHT.x + 7, ROOM.NIGHT.y - 4, 0xffcf80, 46, 0.75], [92, 46, 0x7fd0f0, 20, 0.5],
      [126, 70, 0xc070ff, 11, 0.5], [40, 108, 0x5ef0b0, 8, 0.45], [49, 138, 0x7fd0f0, 12, 0.45]].map(function (l) {
      var p = roomXY(l[0], l[1]);
      return glow(self, p[0], p[1], l[3] * S, l[2], l[4]);
    });
    var inside = this.make.graphics(); inside.fillStyle(0xffffff).fillRect(ROOM.OX + 22 * S, ROOM.OY + 12 * S, (ROOM.W - 44) * S, (ROOM.H - 26) * S);
    var clip = inside.createGeometryMask();
    this.lights.forEach(function (l) { l.setMask(clip); });                         // la luz no se sale de las paredes
    [this.shade].concat(this.lights).forEach(function (o) { o.keepDuringBuild = true; });   // también mientras se monta

    // Patricio, el conejo: va suelto por el cuarto y Diego choca con él (bunny.js); cuando le hablas se queda quieto
    this.bunny = new Bunny(this, 126, 162);
    WALK_ROOM.dynamic = [this.bunny];
    this.events.on('interact', function (id) {
      if (id === 'conejo') { self.bunny.greet(); Sound.play('hop'); }
      if (id === 'chicles' && (self.gum = (self.gum || 0) + 1) === 5) Logros.find('chicle');   // a la quinta, sale uno dorado
      // logros: las cosas del cuarto que se han mirado (sin contar los grupos, que solo preguntan cuál)
      var all = ROOM_OBJECTS.filter(function (o) { return !o.choices && !o.item; }).map(function (o) { return o.id; });
      if (all.indexOf(id) >= 0) {
        var seen = Logros.mark('cuarto', id);
        if (seen >= 10) Logros.unlock('curioso');
        if (all.every(function (k) { return Logros.seen('cuarto').indexOf(k) >= 0; })) Logros.unlock('todo');
      }
      var secret = { conejo: 'patricio', tortuga: 'manuelita', ventana: 'tiempo' }[id];
      if (secret) Logros.unlock(secret);
    });

    // Diego: camina con flechas / WASD o con clic en el suelo (ver player.js), y su robot le sigue (buddy.js)
    this.player = this.from === 'yard' ? new Player(this, 36, 168) : new Player(this, 160, 168);
    if (this.from === 'yard') { this.player.dir = 'side'; this.player.place(); }
    this.buddy = new Buddy(this, this.player);
    // objetos: exclamación al acercarse; se usan con Enter / E o con clic (interact.js)
    this.objs = new Interact(this, this.player, ROOM_OBJECTS);
    hiddenItems(this, ROOM_OBJECTS);
    this.input.on('pointerdown', function (p, over) {
      if (self.busy() || over.length) return;
      var o = self.objs.objectAt(p.worldX, p.worldY);
      if (o) self.objs.goTo(o); else { self.objs.pending = null; self.player.walkTo(p.worldX, p.worldY); }
    });
    // va antes que el diálogo: así el Enter que cierra un diálogo no abre otro, y el que abre uno no lo salta
    this.input.keyboard.on('keydown', function (e) {
      if (self.busy() || !self.objs.active || !/^(Enter|NumpadEnter|KeyE)$/.test(e.code)) return;
      var o = self.objs.active;
      self.time.delayedCall(1, function () { self.objs.use(o); });
    });
    // barra de controles abajo (se oculta mientras hay un diálogo)
    this.controls = T(this, W / 2, ROOM.OY + ROOM.H * S + (H - ROOM.OY - ROOM.H * S) / 2, CFG.controls, 15, CFG.c.dim, { fontFamily: CFG.fontUi })
      .setOrigin(0.5).setDepth(900);

    // puertas: patio a la izquierda, vestidor a la derecha y menú abajo (WALK_ROOM.exits y CFG.exits)
    this.exitTags = exitTags(this);

    // Esc vuelve al menú; se registra antes que el diálogo para que el Esc que cierra un diálogo no saque del cuarto
    this.input.keyboard.on('keydown', function (e) { if (e.code === 'Escape' && !e.repeat && !self.busy()) Nav.back(); });
    // presentación
    this.dlg = new Dialog(this);
    this.clock = new ClockPanel(this);
    var intro = function () {
      self.time.delayedCall(300, function () {
        // con #os, #cv o #lab se abre además esa página en el visor (como desde el menú)
        var m = CFG.menu.filter(function (x) { return x.id === self.mode && x.url; })[0];
        if (m) Viewer.open(m.url, m.label); else self.dlg.show(CFG.intro);
      });
    };
    this.setPhase(dayPhase());
    Logros.unlock('hola'); if (this.phase === 'night') Logros.unlock('noche');
    this.time.addEvent({ delay: 60000, loop: true, callback: function () { var ph = dayPhase(); if (ph !== self.phase) self.setPhase(ph); } });
    // al volver del patio no se monta otra vez ni se repite la presentación
    if (this.from === 'yard') this.cameras.main.fadeIn(250, 15, 10, 30);
    // el cuarto se monta como un LEGO y después empieza la presentación (build.js)
    else if (BUILD.on) { this.building = true; buildRoom(this, function () { self.building = false; intro(); }); }
    else intro();
  },
  /* hay un diálogo o un panel abierto: el muñeco no se mueve y las teclas son para eso */
  busy: function () { return this.building || this.dlg.open || (this.clock && this.clock.open); },
  /* regar el cactus: la regadera se inclina y caen gotas; la primera vez le sale una flor (dura toda la visita) */
  water: function () {
    var self = this, S = ROOM.SCALE, n = (this.waterings = (this.waterings || 0) + 1);
    Sound.play('water');
    if (n === 1) this.time.delayedCall(1500, function () { Logros.unlock('flor'); });
    if (n >= 3) Logros.unlock('ahogado');
    try { sessionStorage.setItem('cactus-riegos', n); } catch (e) { }
    var top = roomXY(251, 190), can = this.add.image(top[0] - 14 * S, top[1] - 16 * S, 'can').setScale(S).setDepth(900).setAlpha(0);
    this.tweens.add({ targets: can, alpha: 1, duration: 150 });
    this.tweens.add({ targets: can, angle: 32, delay: 150, duration: 300, ease: 'Quad.out' });
    for (var i = 0; i < 9; i++) (function (k) {
      var d = self.add.rectangle(top[0] - 2 * S + (k % 3) * S, top[1] - 12 * S, S, S * 2, 0x7fd0f0).setDepth(901).setAlpha(0);
      self.tweens.add({ targets: d, alpha: { from: 1, to: 0.6 }, y: top[1] - S, delay: 400 + k * 90, duration: 380, ease: 'Quad.in', onComplete: function () { d.destroy(); } });
    })(i);
    this.tweens.add({ targets: can, alpha: 0, angle: 0, delay: 1400, duration: 250, onComplete: function () { can.destroy(); } });
    this.time.delayedCall(1500, function () {
      if (n === 1) { self.flower.setVisible(true).setScale(0); self.tweens.add({ targets: self.flower, scale: S, duration: 350, ease: 'Back.out' }); }
      var say = t(n === 1 ? '¡Glu, glu! El cactus lo agradece: le ha salido una flor.'
        : n === 2 ? 'Ya está bien regado. Los cactus casi no necesitan agua.'
          : '¡Que lo vas a ahogar! A un cactus le sobra con un riego al mes.');
      self.dlg.show([{ name: 'Diego', text: say }]);
    });
  },
  drawProps: function (t) {
    var c = this.srv.getContext(); c.clearRect(0, 0, ROOM.W, ROOM.H); drawServer(c, t); this.srv.refresh();
    c = this.tank.getContext(); c.clearRect(0, 0, ROOM.W, ROOM.H); drawTank(c, t); this.tank.refresh();
  },
  drawWin: function (t) {
    var ctx = this.win.getContext(); drawRoomWindow(ctx, t, this.phase); this.win.refresh();
  },
  /* 'day', 'dusk' o 'night': cielo de la ventana, luz del cuarto y lámparas */
  setPhase: function (ph) {
    var night = ph === 'night', dusk = ph === 'dusk';
    this.phase = ph;
    this.shade.setFillStyle(night ? 0x0b1030 : 0xd0603a, night ? 0.5 : dusk ? 0.14 : 0);
    this.lights.forEach(function (l, i) { l.setVisible(night || (dusk && i === 0)); });   // al atardecer, solo la lámpara
    this.beam.setVisible(!night);
    this.motes.forEach(function (m) { m.setVisible(!night); });
    this.drawWin(this.winT || 0);
  },
  update: function (time, dt) {
    this.winT += dt / 1000;
    if (Math.floor(this.winT * 10) !== this._wf) { this._wf = Math.floor(this.winT * 10); this.drawWin(this.winT); drawRoomFx(this.fx.getContext(), this.winT); this.fx.refresh(); this.drawProps(this.winT); }
    var busy = this.busy();
    this.player.update(dt, busy);
    this.buddy.update(dt);
    // Patricio se mueve; su exclamación y su zona de clic le siguen
    var bn = this.bunny, bo = this.bunnyObj || (this.bunnyObj = ROOM_OBJECTS.filter(function (o) { return o.id === 'conejo'; })[0]);
    bn.update(dt, busy);
    bo.area = bn.box(); bo.rect = [bn.x - 9, bn.y - 14, 18, 15]; bo.mark = [bn.x, bn.y - 13]; bo.at = [bn.x, bn.y + 8];
    var pl = this.player, aq = ROOM.TANK, sp = pl.spr;
    var behind = pl.y < ROOM.PROPS.tank.foot && pl.y > aq.y - 4 && Math.abs(pl.x - (aq.x + aq.w / 2)) < aq.w / 2 + 8;
    this.ghost.setVisible(behind && sp.visible);
    if (behind) this.ghost.setTexture(sp.texture.key).setFlipX(sp.flipX).setPosition(sp.x, sp.y).setScale(sp.scaleX);
    this.objs.update(dt, busy);
    this.controls.setVisible(!busy);
    // junto a un objeto, la barra dice cuál es y cómo usarlo
    var near = this.objs.active, info = near && CFG.objects[near.id], bar = info ? CFG.controlsNear.replace('{name}', info.name) : CFG.controls;
    if (this.controls.text !== bar) this.controls.setText(bar).setColor(info ? CFG.c.cream : CFG.c.dim);
    exitsUpdate(this, busy);
    var S = ROOM.SCALE;
    this.motes.forEach(function (m) {
      m.v -= m.sp * dt / 1000; if (m.v < 0) { m.v = 1; m.u = Math.random(); }
      var y = 52 + m.v * 112, x0 = 128 + (96 - 128) * (y - 48) / 122, x1 = 168 + (160 - 168) * (y - 48) / 122;
      var x = x0 + (x1 - x0) * m.u + Math.sin(time / 900 + m.u * 9) * 3;
      var p = roomXY(Math.round(x), Math.round(y)); m.setPosition(p[0], p[1]); m.setAlpha(0.35 + 0.4 * Math.sin(time / 500 + m.u * 20));
    });
  }
});
