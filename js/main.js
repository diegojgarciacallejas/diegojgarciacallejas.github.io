/* Arranque, tamaño y nitidez.
   El juego se diseña en un lienzo lógico de 960x540 (CFG.W x CFG.H), pero se dibuja a la
   resolución real de la pantalla: la cámara amplía el mundo (VIEW.z) y los textos se rasterizan
   a esa misma escala, así las letras salen nítidas y el pixel art sigue en bloques limpios. */
var VIEW = { z: 1, cssW: CFG.W, cssH: CFG.H, crop: null };

/* Móvil: con el móvil en vertical solo se juega en el cuarto, recortado y ampliado (sin menú: la portada lleva
   directa al cuarto, y desde sus objetos se llega al expediente, DiegOS y el laboratorio). En horizontal se ve todo.
   Las demás pantallas en vertical se ven enteras pero pequeñas, con un aviso para girar el móvil. */
var MOBILE = {
  touch: !!(window.matchMedia && matchMedia('(pointer: coarse)').matches),
  portrait: function () { return window.innerHeight > window.innerWidth; },
  roomOnly: function () { return this.touch && this.portrait(); }
};
var FULL_VIEW = { x: 0, y: 0, w: CFG.W, h: CFG.H }, ROOM_VIEW = { x: 180, y: 26, w: 600, h: 514 };   // el cuarto y su barra de abajo
function wantedView() { return MOBILE.roomOnly() && window.Nav && Nav.current === 'Room' ? ROOM_VIEW : FULL_VIEW; }
VIEW.crop = FULL_VIEW;
// con pantalla táctil, los textos de ayuda hablan de tocar, no de teclas
if (MOBILE.touch) {
  CFG.controls = t('Toca el suelo para andar  ·  toca un objeto para usarlo');
  CFG.controlsNear = t('{name}: tócalo o toca la «!»');
  CFG.controlsYard = t('Toca para andar  ·  habla con la gente desde la valla');
  CFG.controlsSwing = t('¡A columpiarse!  ·  toca para bajarte');
}

// todo texto nuevo se crea a la resolución de la pantalla
(function () {
  var orig = Phaser.GameObjects.GameObjectFactory.prototype.text;
  Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, txt, style) {
    var t = orig.call(this, x, y, txt, style);
    t.setResolution(VIEW.z);
    return t;
  };
})();

// cada escena llama a fitCamera(this) al crearse
function fitCamera(scene) {
  var want = wantedView();
  if (want !== VIEW.crop && VIEW.relayout) { VIEW.crop = want; VIEW.relayout(); }   // cambia el recorte: otro tamaño de lienzo
  var c = VIEW.crop;
  scene.cameras.main.setZoom(VIEW.z).centerOn(c.x + c.w / 2, c.y + c.h / 2);
}
function eachText(list, fn) {
  list.forEach(function (o) {
    if (o.type === 'Text') fn(o);
    if (o.list) eachText(o.list, fn);
  });
}

(function () {
  /* Zoom del navegador: solo cuenta como zoom un cambio de devicePixelRatio justo después de
     usar Ctrl (Ctrl +, Ctrl -, Ctrl 0, Ctrl + rueda). Otros cambios (otra pantalla, un panel
     con otra densidad) recalibran la base, así el juego siempre cabe en la ventana. */
  var baseDpr = window.devicePixelRatio || 1, lastDpr = baseDpr, ctrlAt = -1e9, el = document.getElementById('game');
  window.addEventListener('keydown', function (e) { if (e.ctrlKey || e.metaKey) ctrlAt = Date.now(); }, true);
  window.addEventListener('wheel', function (e) { if (e.ctrlKey) ctrlAt = Date.now(); }, { capture: true, passive: true });

  function measure() {
    var dpr = window.devicePixelRatio || 1;
    if (dpr !== lastDpr && Date.now() - ctrlAt > 1500) baseDpr *= dpr / lastDpr;
    lastDpr = dpr;
    var z = Math.max(0.25, Math.min(5, dpr / baseDpr));
    var c = VIEW.crop, k = Math.min(window.innerWidth * z / c.w, window.innerHeight * z / c.h);
    VIEW.cssW = Math.floor(c.w * k); VIEW.cssH = Math.floor(c.h * k);
    VIEW.pxW = Math.round(VIEW.cssW * dpr); VIEW.pxH = Math.round(VIEW.cssH * dpr);
    VIEW.z = VIEW.pxW / c.w;
  }
  function place() {
    el.style.width = VIEW.cssW + 'px'; el.style.height = VIEW.cssH + 'px';
    el.style.marginTop = Math.max(0, Math.floor((window.innerHeight - VIEW.cssH) / 2)) + 'px';
    document.body.classList.toggle('zoomed', VIEW.cssW > window.innerWidth + 1 || VIEW.cssH > window.innerHeight + 1);
    var cv = window.game && game.canvas;
    if (cv) { cv.style.width = VIEW.cssW + 'px'; cv.style.height = VIEW.cssH + 'px'; }
  }
  function layout() {
    measure(); place();
    if (!window.game || !game.scale) return;
    game.scale.resize(VIEW.pxW, VIEW.pxH);
    place(); game.scale.refresh();
    game.scene.getScenes(true).forEach(function (sc) {
      fitCamera(sc);
      eachText(sc.children.list, function (t) { t.setResolution(VIEW.z); });
    });
  }
  VIEW.relayout = layout;
  // al girar el móvil: si cambia el recorte estando en el cuarto, se rehace el cuarto (para recolocar el diálogo)
  var rt = 0, hint = document.createElement('div');
  hint.id = 'rotate'; hint.textContent = t('↻ Gira el móvil para ver mejor esta parte'); hint.hidden = true; document.body.append(hint);
  function onResize() {
    var before = VIEW.crop, want = wantedView();
    VIEW.crop = want; layout();
    if (want !== before && window.Nav && Nav.current === 'Room') Nav.start('Room', { mode: 'full', from: 'yard' });
    updateHint();
  }
  function updateHint() { hint.hidden = !(MOBILE.touch && MOBILE.portrait() && window.Nav && Nav.current && Nav.current !== 'Room' && Nav.current !== 'Title'); }
  VIEW.updateHint = updateHint;
  VIEW.onResize = onResize;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(onResize, 120); });
  measure(); place();

  function start() {
    window.game = new Phaser.Game({
      type: Phaser.AUTO, parent: 'game', width: VIEW.pxW, height: VIEW.pxH, backgroundColor: '#0f0a1e',
      pixelArt: true, roundPixels: true,
      // no bloquear la rueda: así Ctrl+rueda y el pellizco del touchpad hacen zoom
      input: { mouse: { preventDefaultWheel: false } },
      scale: { mode: Phaser.Scale.NONE },
      scene: [Title, Menu, Room, Yard, Penalty]
    });
    place();
    game.events.once('ready', function () { place(); game.scale.refresh(); Nav.watch(game); });
    // si se entra con #menu o #full, abrir esa pantalla directamente
    Nav.seed();
    var t = Nav.fromHash();
    if (t[0] !== 'Title') game.events.once('ready', function () { Nav.start(t[0], t[1]); });
  }
  var wait = setTimeout(start, 1500), done = false;
  function go() { if (done) return; done = true; clearTimeout(wait); start(); }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 28px "Pixelify Sans"'), document.fonts.load('400 28px "Pixelify Sans"'),
      document.fonts.load('400 18px "Jersey 20"')]).then(go, go);
  } else go();
})();
