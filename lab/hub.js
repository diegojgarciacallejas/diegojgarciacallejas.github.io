/* Portada del laboratorio */
// volver: al juego si se vino de él
document.getElementById('back').addEventListener('click', function (e) {
  if (window.parent !== window) { e.preventDefault(); parent.postMessage('viewer:close', location.origin); return; }   // dentro del juego
  if (document.referrer && document.referrer.indexOf(location.origin) === 0 && history.length > 1) { e.preventDefault(); history.back(); }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && window.parent !== window) parent.postMessage('viewer:close', location.origin); });
// dentro del juego, los enlaces a otras páginas del laboratorio sustituyen esta (no suman pasos al historial)
if (window.parent !== window) document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a');
  if (a && a.id !== 'back' && a.target !== '_blank' && a.origin === location.origin) { e.preventDefault(); location.replace(a.href); }
});
