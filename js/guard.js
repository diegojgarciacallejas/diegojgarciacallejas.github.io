/* Va el primero en cada página.
   Dentro del visor del juego (un marco de esta misma web) marca la página como «embedded» y esconde su
   botón de volver. Si otra web la mete en un marco (para engañar con clics encima, «clickjacking»),
   la página no se enseña y se intenta abrir fuera del marco. */
(function () {
  if (window.top === window.self) return;
  var ours = false;
  try { ours = window.parent.location.origin === location.origin; } catch (e) { }   // otro origen: ni se puede leer
  if (ours) {
    document.documentElement.classList.add('embedded');
    // dentro del visor, un pellizco ampliaría el juego entero (con su barra de «Volver») y costaría deshacerlo
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) { document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false }); });
    return;
  }
  document.documentElement.style.display = 'none';
  try { window.top.location = location.href; } catch (e) { }
})();
