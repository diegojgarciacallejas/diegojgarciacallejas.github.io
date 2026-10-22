/* Mando en pantalla para el móvil, estilo Game Boy: una cruceta y el botón A.
   No toca el juego: pulsa las mismas teclas que el teclado (las flechas y Enter), así que sirve en todas
   las pantallas igual que ellas: andar, usar objetos, pasar diálogos, elegir en el menú, chutar penaltis…
   En vertical va debajo del cuarto (main.js le deja sitio); en horizontal, medio transparente en los lados. */
var PAD = (function () {
  if (!MOBILE.touch) return null;
  var CODES = { up: ['ArrowUp', 38], down: ['ArrowDown', 40], left: ['ArrowLeft', 37], right: ['ArrowRight', 39], a: ['Enter', 13] };
  var held = {};
  // una pulsación de teclado de verdad para Phaser (lee keyCode) y para nuestras escenas (leen code)
  function send(type, name) {
    var c = CODES[name], ev = new KeyboardEvent(type, { key: c[0], code: c[0], bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: function () { return c[1]; } });
    Object.defineProperty(ev, 'which', { get: function () { return c[1]; } });
    window.dispatchEvent(ev);
  }
  function press(name, on) {
    if (!!held[name] === on) return;
    held[name] = on; send(on ? 'keydown' : 'keyup', name);
    var b = box.querySelector('[data-k="' + name + '"]'); if (b) b.classList.toggle('on', on);
  }
  function releaseAll() { Object.keys(held).forEach(function (k) { press(k, false); }); }

  var box = document.createElement('div');
  box.id = 'pad'; box.setAttribute('aria-hidden', 'true');   // es un atajo táctil: el juego también se maneja tocando
  box.innerHTML = '<div class="dpad"><i data-k="up"></i><i data-k="left"></i><i class="mid"></i><i data-k="right"></i><i data-k="down"></i></div>' +
    '<button type="button" class="abtn" data-k="a">A</button>';
  document.body.append(box);
  var dpad = box.querySelector('.dpad'), abtn = box.querySelector('.abtn');

  // cruceta: la dirección según dónde esté el dedo respecto al centro (en las esquinas, en diagonal); se puede deslizar
  function aim(e) {
    var r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), dead = r.width * 0.12;
    var h = Math.abs(dx) > dead && Math.abs(dx) > Math.abs(dy) * 0.45, v = Math.abs(dy) > dead && Math.abs(dy) > Math.abs(dx) * 0.45;
    press('left', h && dx < 0); press('right', h && dx > 0); press('up', v && dy < 0); press('down', v && dy > 0);
  }
  var dragging = false;
  dpad.addEventListener('pointerdown', function (e) { e.preventDefault(); dragging = true; dpad.setPointerCapture(e.pointerId); aim(e); });
  dpad.addEventListener('pointermove', function (e) { if (dragging) aim(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
    dpad.addEventListener(t, function () { dragging = false; ['up', 'down', 'left', 'right'].forEach(function (k) { press(k, false); }); });
  });
  abtn.addEventListener('pointerdown', function (e) { e.preventDefault(); abtn.setPointerCapture(e.pointerId); press('a', true); });
  ['pointerup', 'pointercancel'].forEach(function (t) { abtn.addEventListener(t, function () { press('a', false); }); });
  box.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  // si la página pierde el foco con algo pulsado, que no se quede pulsado
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', function () { if (document.hidden) releaseAll(); });
  return { el: box, release: releaseAll };
})();
