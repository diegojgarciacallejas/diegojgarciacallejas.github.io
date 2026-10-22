/* Visor: abre las páginas de los proyectos (expediente, laboratorio…) dentro de la propia web, encima del juego.
   Mientras está abierto el juego se pausa; al cerrarlo se vuelve exactamente donde se estaba.
   Se cierra con su botón, con Esc, con «Atrás» del navegador o desde la propia página (cv.js y lab).
   El marco se crea al abrir y se elimina al cerrar, y dentro los enlaces usan location.replace: así el
   historial solo gana una entrada (la del visor) y «Atrás» siempre lo cierra. */
var Viewer = (function () {
  var box, frame, titleEl, open = false, closing = false;
  function build() {
    box = document.createElement('div'); box.id = 'viewer'; box.hidden = true;
    box.innerHTML = '<div class="vbar"><span class="vtitle"></span><button type="button" class="vclose"></button></div>';
    box.querySelector('.vclose').textContent = t('✕ Volver al juego');
    document.body.appendChild(box);
    titleEl = box.querySelector('.vtitle');
    box.querySelector('.vclose').addEventListener('click', close);
  }
  function show(url, title) {
    if (!box) build();
    if (open) return;
    open = true;
    frame = document.createElement('iframe'); frame.title = title || t('Proyecto'); frame.src = url;   // src antes de insertarlo: no deja rastro en el historial
    box.appendChild(frame); titleEl.textContent = title || ''; box.hidden = false;
    // una entrada en el historial, para que «Atrás» cierre el visor en vez de salir de la escena
    history.pushState(Object.assign({}, history.state, { viewer: url }), '', location.hash || location.pathname);
    if (window.game) { game.input.keyboard.enabled = false; game.loop.sleep(); }
    setTimeout(function () { if (frame) frame.focus(); }, 50);
  }
  // el popstate de scenes.js llama a hide(); «closing» evita volver dos veces atrás (botón y Esc casi a la vez)
  function close() { if (open && !closing) { closing = true; history.back(); } }
  function hide() {
    if (!open) return;
    open = false; closing = false; box.hidden = true; if (frame) { frame.remove(); frame = null; }
    if (window.game) {
      game.loop.wake(); game.input.keyboard.enabled = true;
      game.scene.getScenes(true).forEach(function (s) { if (s.input && s.input.keyboard) s.input.keyboard.resetKeys(); });
    }
  }
  // la página de dentro pide cerrar (su botón «Volver al juego» o Esc)
  window.addEventListener('message', function (e) { if (e.origin === location.origin && e.data === 'viewer:close') close(); });
  window.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') close(); });
  return { open: show, close: close, hide: hide, isOpen: function () { return open; } };
})();
