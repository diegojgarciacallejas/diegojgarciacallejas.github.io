/* Botones de arriba a la derecha: sonido, música y logros. El de logros abre un panel con todos:
   los conseguidos, los que faltan y los secretos (solo con una pista). Mientras el panel está abierto,
   el juego no recibe teclas. */
var HUD = (function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var bar = el('div'), panel = null;
  bar.id = 'hud';
  function button(icon, label, pressed, act) {
    var b = el('button'), im = el('img'); im.alt = '';
    b.type = 'button'; b.title = t(label); b.setAttribute('aria-label', t(label));
    if (icon) { im.src = Logros.icon(icon); b.append(im); }
    if (pressed !== null) b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', function () { act(b); b.blur(); });   // sin foco: Enter y Espacio siguen siendo del juego
    bar.append(b);
    return b;
  }
  button('sound', 'Sonido', Sound.isOn(), function (b) { Sound.setOn(!Sound.isOn()); b.setAttribute('aria-pressed', String(Sound.isOn())); });
  button('music', 'Música', Sound.isMusic(), function (b) { Sound.setMusic(!Sound.isMusic()); b.setAttribute('aria-pressed', String(Sound.isMusic())); });
  // idioma: el otro, y se recarga la página (todo se vuelve a pintar ya traducido)
  var lang = button(null, 'Idioma', null, function () { I18N.set(LANG === 'en' ? 'es' : 'en'); location.reload(); });
  lang.textContent = LANG === 'en' ? 'ES' : 'EN'; lang.classList.add('hlang'); lang.title = LANG === 'en' ? 'Ver en español' : 'View in English';
  var trophy = button('trophy', 'Logros', null, function () { open(); });
  var count = el('span', 'hcount'); trophy.append(count);
  function refresh() { var n = Object.keys(Logros.got()).length; count.textContent = n + '/' + LOGROS.length; }
  document.body.append(bar); refresh();
  // al conseguir uno (aquí o dentro del visor), se actualiza el contador
  var toast = Logros.toast; Logros.toast = function (id, kind) { toast(id, kind); refresh(); if (panel) fill(); };

  function keys(on) {
    if (!window.game) return;
    game.input.keyboard.enabled = on;
    if (on) game.scene.getScenes(true).forEach(function (s) { if (s.input && s.input.keyboard) s.input.keyboard.resetKeys(); });
  }
  function open() {
    if (panel) return;
    Sound.play('ok');
    panel = el('div', 'lpanel'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Logros');
    var box = el('div', 'lbox'), head = el('div', 'lhead'), close = el('button', 'lclose', 'Cerrar');
    close.type = 'button';
    head.append(el('h2', 'ltitle'), close);
    box.append(head, el('ul', 'lgrid'), el('h3', 'litems'), el('div', 'lchips'), el('button', 'lreset', 'Reiniciar progreso'));
    panel.append(box); document.body.append(panel);
    close.addEventListener('click', shut);
    panel.addEventListener('click', function (e) { if (e.target === panel) shut(); });
    // reiniciar: con un segundo clic para confirmar
    var reset = box.querySelector('.lreset'), sure = false; reset.type = 'button';
    reset.addEventListener('click', function () {
      if (!sure) { sure = true; reset.textContent = '¿Seguro? Se borran todos. Pulsa otra vez'; setTimeout(function () { sure = false; if (panel) reset.textContent = 'Reiniciar progreso'; }, 4000); return; }
      Logros.reset(); sure = false; reset.textContent = 'Reiniciar progreso'; fill(); refresh();
    });
    fill(); keys(false); close.focus();
  }
  /* las tarjetas: conseguidos en dorado; los que faltan, con candado y «???» (los secretos, solo con su pista) */
  function fill() {
    var got = Logros.got(), found = Logros.found(), grid = panel.querySelector('.lgrid'), chips = panel.querySelector('.lchips');
    panel.querySelector('.ltitle').textContent = t('Logros {0}/{1}', Object.keys(got).length, LOGROS.length);
    grid.textContent = '';
    LOGROS.forEach(function (l) {
      var ok = !!got[l.id], li = el('li', ok ? 'got' : ''), im = el('img'), tx = el('div');
      im.src = Logros.icon(ok ? 'trophy' : 'lock'); im.alt = '';
      tx.append(el('b', null, ok ? l.name : '???'), el('span', null, ok || !l.secret ? l.desc : t('Secreto. Pista: {0}', l.hint)));
      li.append(im, tx); grid.append(li);
    });
    var n = Logros.items.filter(function (o) { return found[o.id]; }).length;
    panel.querySelector('.litems').textContent = t('Objetos ocultos {0}/{1}', n, Logros.items.length);
    chips.textContent = '';
    Logros.items.forEach(function (o) {
      var c = el('span', found[o.id] ? 'chip got' : 'chip', found[o.id] ? o.name : '?');
      if (!found[o.id]) c.title = 'Aún sin encontrar';
      chips.append(c);
    });
  }
  function shut() { if (!panel) return; panel.remove(); panel = null; keys(true); }
  window.addEventListener('keydown', function (e) { if (panel && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); shut(); } }, true);
  return { open: open, close: shut, isOpen: function () { return !!panel; } };
})();
