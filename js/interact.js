/* Objetos con los que se puede interactuar (coordenadas del arte del cuarto).
   at: dónde se coloca el muñeco para usarlo (also: otros sitios desde los que también se puede usar;
   area: la base de un mueble del suelo, para usarlo desde cualquier lado si se está pegado a ella) · mark: dónde sale la exclamación · rect: zona donde hacer clic.
   Lo que dice cada objeto está en CFG.objects (config.js), con el mismo id. */
var INTERACT_R = 20;   // a cuántos píxeles de arte tiene que estar el muñeco para que salga la exclamación (o el «r» del objeto)
var WALL_R = 14;       // lo colgado en la pared (cuadros, ventana, reloj…): solo con el muñeco pegado a ella
var AREA_PAD = 6;      // con «area», la exclamación sale a menos de INTERACT_R - AREA_PAD píxeles del borde del mueble
var ROOM_OBJECTS = [
  { id: 'estanteria', rect: [26, 16, 36, 64],  at: [44, 88],   mark: [44, 13], area: [24, 70, 40, 12] },
  { id: 'foto',       rect: [70, 14, 30, 20],  at: [80, 90],   mark: [85, 13], r: WALL_R },
  { id: 'escritorio', rect: [68, 36, 52, 47],  at: [100, 90],  mark: [92, 37], area: [66, 70, 54, 15] },
  { id: 'papelera',   rect: [55, 80, 11, 15],  at: [60, 100],  mark: [60, 79], area: [55, 80, 11, 14] },
  { id: 'ventana',    rect: [112, 8, 72, 44],  at: [148, 84],  mark: [148, 12], r: WALL_R },
  { id: 'grafico',    rect: [186, 14, 20, 26], at: [196, 84],  mark: [196, 13], r: WALL_R },
  { id: 'redneuronal', rect: [212, 16, 24, 20], at: [222, 84], mark: [224, 15], r: WALL_R },
  // el reloj y la bandera están juntos: al acercarse sale una sola exclamación («pared») y se elige uno;
  // con clic se va directo a cada uno (clickOnly: no sacan exclamación propia)
  { id: 'pared',                               at: [232, 86],  mark: [251, 34], r: WALL_R, choices: ['reloj', 'bandera'] },
  { id: 'reloj',      rect: [242, 15, 18, 20], at: [232, 86],  mark: [251, 15], clickOnly: true },
  { id: 'bandera',    rect: [240, 37, 20, 14], at: [232, 86],  mark: [250, 37], clickOnly: true },
  { id: 'mesilla',    rect: [244, 60, 20, 42], at: [256, 108], mark: [256, 62], area: [244, 70, 21, 31] },
  { id: 'cuaderno',   rect: [219, 123, 15, 12], at: [227, 118], mark: [226, 125], r: 8 },   // solo justo detrás de la cama
  { id: 'tortuga',    rect: [232, 126, 16, 12], at: [240, 118], mark: [240, 127], r: 9 },   // Manuelita, junto a la almohada
  // la cama: al acercarse se elige entre Manuelita y el cuaderno (que también se pueden usar directamente)
  { id: 'cama',       rect: [212, 107, 53, 49], at: [204, 133], mark: [238, 121], area: [212, 135, 53, 21], also: [[216, 112], [252, 112]], choices: ['tortuga', 'cuaderno'] },
  { id: 'servidor',   rect: [24, 186, 42, 30], at: [72, 208],  mark: [45, 188], area: [24, 204, 42, 14] },
  { id: 'robot',      rect: [32, 99, 16, 26],  at: [57, 114],  mark: [40, 98], area: [30, 100, 20, 26] },
  { id: 'puf',        rect: [32, 132, 34, 22], at: [76, 146],  mark: [49, 132], area: [30, 132, 38, 22] },
  { id: 'conejo',     rect: [118, 146, 34, 16], at: [128, 170], mark: [128, 146], area: [121, 150, 30, 10] },
  { id: 'piezas',     rect: [174, 154, 21, 17], at: [184, 176], mark: [184, 155], area: [174, 154, 21, 17] },
  { id: 'pecera',     rect: [196, 182, 40, 34], at: [217, 196], mark: [217, 183], area: [196, 200, 42, 18] },
  { id: 'chicles',    rect: [94, 186, 16, 28], at: [116, 208], mark: [102, 186], area: [94, 204, 16, 9] },
  { id: 'cactus',     rect: [243, 188, 18, 28], at: [252, 186], mark: [251, 190], area: [243, 190, 18, 26] },
  // objeto oculto (item): una moneda en el suelo, entre la cama y el cactus
  { id: 'peseta', item: 'peseta', rect: [236, 164, 8, 8], at: [240, 171], mark: [240, 163], r: 8 }
];
function reach(o) { return o.r || INTERACT_R; }

function Interact(scene, player, objects) {
  var self = this, S = STAGE.S;
  this.s = scene; this.p = player; this.list = objects || ROOM_OBJECTS; this.active = null; this.pending = null; this.t = 0;
  makeTexture(scene, 'excl', EXCL.rows, EXCL.pal);
  this.mark = scene.add.image(0, 0, 'excl').setOrigin(0.5, 1).setScale(STAGE.k * 1.9).setDepth(950).setVisible(false)
    .setInteractive({ useHandCursor: true });
  this.mark.on('pointerdown', function () { self.use(self.active); });
}

/* objetos ocultos (los de la lista con «item», ver logros.js): se pintan pequeños en el suelo, en «at», con un
   destello de vez en cuando; al usarlos se guardan y desaparecen. Los ya encontrados ni se pintan. */
var ITEM_ART = {
  peseta:  { rows: ['.yy.', 'yYyy', 'yyYy', '.yy.'], pal: { y: '#f2c66d', Y: '#c9982e' } },
  tenis:   { rows: ['.gg.', 'gwgg', 'ggwg', '.gg.'], pal: { g: '#d4e157', w: '#f4f8e0' } },
  bellota: { rows: ['.nn.', 'nNNn', '.oo.', '.oo.'], pal: { n: '#6b4a2a', N: '#8a5a32', o: '#c9982e' } }
};
function hiddenItems(scene, list) {
  var found = Logros.found();
  list.filter(function (o) { return o.item; }).forEach(function (o) {
    o.off = !!found[o.item];
    if (o.off) return;
    var a = ITEM_ART[o.item], key = 'item_' + o.item, p = roomXY(o.at[0], o.at[1]);
    makeTexture(scene, key, a.rows, a.pal);
    o.sprite = scene.add.image(p[0], p[1], key).setOrigin(0.5, 1).setScale(STAGE.S).setDepth(10 + o.at[1] - 1);
    scene.tweens.add({ targets: o.sprite, alpha: 0.45, duration: 500, yoyo: true, repeat: -1, repeatDelay: 2200 });
  });
}

Interact.prototype.dist = function (o) {
  // con «area» solo cuenta lo cerca que se está de la base (y los puntos «also»): «at» es solo adonde se va al hacer clic,
  // y si contara, su círculo se saldría de la franja alrededor del mueble y la exclamación saldría desde lejos
  var p = this.p, pts = o.area ? (o.also || []) : [o.at].concat(o.also || []);
  var d = Math.min.apply(null, pts.map(function (a) { return Math.hypot(p.x - a[0], p.y - a[1]); }).concat(Infinity));
  if (o.area) {                                                       // pegado a la base del mueble, por cualquier lado
    var a = o.area, dx = Math.max(a[0] - p.x, 0, p.x - (a[0] + a[2])), dy = Math.max(a[1] - p.y, 0, p.y - (a[1] + a[3]));
    d = Math.min(d, Math.hypot(dx, dy) + AREA_PAD);
  }
  return d;
};

/* objeto bajo un punto de pantalla (si hay varios, el más pequeño) */
Interact.prototype.objectAt = function (sx, sy) {
  var x = (sx - STAGE.OX) / STAGE.S, y = (sy - STAGE.OY) / STAGE.S, best = null;
  this.list.forEach(function (o) {
    var r = o.rect;
    if (r && !o.off && x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3] && (!best || r[2] * r[3] < best.rect[2] * best.rect[3])) best = o;
  });
  return best;
};

/* clic en un objeto: si está cerca se usa; si no, el muñeco va andando y lo usa al llegar */
Interact.prototype.goTo = function (o) {
  if (this.dist(o) <= reach(o)) { this.use(o); return; }
  var p = roomXY(o.at[0], o.at[1]);
  this.p.walkTo(p[0], p[1]);
  this.pending = this.p.path ? o : null;
};

Interact.prototype.use = function (o) {
  if (!o || this.s.busy()) return;
  // mirar hacia el objeto (su centro; los grupos sin zona de clic, hacia su exclamación)
  var p = this.p, r = o.rect || [o.mark[0], o.mark[1], 0, 0], cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2, dx = o.at[0] - p.x, dy = cy - p.y;
  if (Math.abs(dx) > Math.abs(dy)) { p.dir = 'side'; p.flip = cx < p.x; }
  else { p.dir = dy < 0 ? 'up' : 'down'; p.flip = false; }
  p.stopPath(); p.place();
  var info = CFG.objects[o.id] || { text: '…' }, scene = this.s;
  scene.events.emit('interact', o.id);                               // la escena puede reaccionar (p. ej. el conejo salta)
  if (o.choices) {                                                    // varios objetos juntos: elegir cuál
    var self = this, opts = o.choices.map(function (id) { return self.list.filter(function (x) { return x.id === id; })[0]; });
    scene.dlg.show([{ name: 'Diego', text: info.text, choices: opts.map(function (x) { var c = CFG.objects[x.id]; return (c.short || c.name).toUpperCase(); }) }], function (ok, i) {
      if (ok) scene.time.delayedCall(1, function () { self.use(opts[i]); });   // después de que el diálogo suelte la tecla
    });
    return;
  }
  if (o.item) {                                                       // un objeto oculto: se guarda y desaparece
    Logros.find(o.item); o.off = true; if (o.sprite) o.sprite.destroy();
    scene.dlg.show([{ name: 'Diego', text: info.text }]);
    return;
  }
  if (info.action === 'water') {                                      // el cactus: ¿regarlo?
    scene.dlg.show([{ name: 'Diego', text: info.text, choices: [t('REGAR'), t('DEJARLO')] }], function (ok, i) {
      if (ok && i === 0) scene.time.delayedCall(1, function () { scene.water(); });
    });
    return;
  }
  if (info.action === 'clock') { this.s.clock.show(); return; }     // el reloj abre su propio panel
  if (info.action === 'penalty') { this.s.penalties(); return; }    // la portería del patio abre el minijuego
  if (info.action === 'swing') { this.s.ride(); return; }           // montarse en el columpio
  if (info.action === 'talk') { this.s.talk(); return; }            // la gente de la acera (yard.js)
  if (info.url && info.desktopOnly && MOBILE.touch) {                 // DiegOS en el móvil: se puede, pero mejor en ordenador
    scene.dlg.show([{ name: 'Diego', text: t('DiegOS está pensado para ordenador: ventanas, terminal… En el móvil se usa tocando los comandos subrayados. ¿Lo abro igualmente?'), choices: [t('ABRIR'), t('DEJARLO')] }],
      function (ok, i) { if (ok && i === 0) Viewer.open(info.url, info.name); });
    return;
  }
  if (info.url) {                                                     // lleva a otra página (el cuaderno → expediente)
    this.s.dlg.show([{ name: 'Diego', text: info.text }], function (ok) { if (ok) Viewer.open(info.url, info.name); });
    return;
  }
  if (info.action === 'weather') {                                    // la ventana: el tiempo que hace ahora en Madrid
    madridWeather(function (msg) { if (scene.sys.isActive() && !scene.busy()) scene.dlg.show([{ name: 'Diego', text: msg }]); });   // si aún se sigue en la escena
    return;
  }
  if (info.lines) {                                                   // varias frases seguidas
    this.s.dlg.show(info.lines.map(function (t) { return { name: info.who || 'Diego', text: t, voice: info.voice }; }));
    return;
  }
  // quién habla (por defecto Diego) y, si hay varias frases, una al azar
  var text = info.texts ? info.texts[Math.floor(Math.random() * info.texts.length)] : info.text;
  this.s.dlg.show([{ name: info.who || 'Diego', text: text, portrait: info.portrait, portraitScale: info.portraitScale, voice: info.voice }], function () {});
};

Interact.prototype.update = function (dt, locked) {
  var self = this, p = this.p, best = null, bd = Infinity;
  this.t += dt / 1000;
  if (this.pending && !p.path) {                    // ha llegado (o se ha parado) camino de un objeto
    var o = this.pending; this.pending = null;
    if (!locked && this.dist(o) <= reach(o)) this.use(o);
  }
  if (!locked) this.list.forEach(function (o) { if (o.clickOnly || o.off) return; var d = self.dist(o); if (d > reach(o)) return; if (o.first) d -= 1000; if (d < bd) { bd = d; best = o; } });   // «first»: gana a lo demás si está a mano
  this.active = best;
  if (!best) { this.shownFor = null; this.mark.setVisible(false); return; }
  // si la exclamación caería sobre el muñeco (p. ej. detrás de la pecera), va encima de su cabeza y le sigue.
  // Se decide al aparecer y no cambia mientras siga el mismo objeto, para que no salte de un sitio a otro
  var head = 38 * STAGE.k / STAGE.S + 3;                                 // alto del muñeco en píxeles de arte
  if (best !== this.shownFor) {
    this.shownFor = best; Sound.play('mark');
    this.onHead = Math.abs(best.mark[0] - p.x) < 12 * stageRatio() && best.mark[1] > p.y - head && best.mark[1] < p.y + 4;
  }
  var pos = this.onHead ? roomXY(p.x, p.y - head) : roomXY(best.mark[0], best.mark[1]), hop = Math.floor(this.t * 4) % 2 ? 0 : STAGE.k * 1.25;
  this.mark.setVisible(true).setPosition(Math.round(pos[0]), Math.round(pos[1] - hop));
};
