/* K-Means desde cero: agrupa puntos en K grupos sin saber de antemano cuáles van juntos.
   Repite dos pasos hasta que nada cambia: asignar cada punto a su centro más cercano y mover cada centro
   a la media de sus puntos. Inicio al azar o con K-Means++ (centros separados entre sí). */
var KM = (function () {
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function d2(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return dx * dx + dy * dy; }

  /* ---- conjuntos de datos: puntos [x, y] en [-1, 1] ---- */
  var DATASETS = {
    nubes: function (r) {                                   // 4 nubes redondas: el caso ideal
      var c = [[-0.5, -0.45], [0.5, -0.5], [-0.45, 0.5], [0.5, 0.45]], p = [];
      for (var i = 0; i < 240; i++) { var m = c[i % 4]; p.push([m[0] + gauss(r) * 0.15, m[1] + gauss(r) * 0.15]); }
      return p;
    },
    distintas: function (r) {                               // nubes de tamaños muy distintos
      var c = [[-0.45, -0.3, 0.28, 150], [0.55, -0.55, 0.08, 40], [0.45, 0.55, 0.1, 50]], p = [];
      c.forEach(function (m) { for (var i = 0; i < m[3]; i++) p.push([m[0] + gauss(r) * m[2], m[1] + gauss(r) * m[2]]); });
      return p;
    },
    alargadas: function (r) {                               // nubes estiradas en diagonal
      var p = [];
      [[-0.45, 0.35], [0.1, -0.1], [0.55, -0.5]].forEach(function (m) {
        for (var i = 0; i < 80; i++) { var a = gauss(r) * 0.45, b = gauss(r) * 0.06; p.push([m[0] + a * 0.8 + b, m[1] + a * 0.45 - b]); }
      });
      return p;
    },
    anillos: function (r) {                                 // un anillo alrededor de una nube: K-Means no puede
      var p = [];
      for (var i = 0; i < 90; i++) p.push([gauss(r) * 0.14, gauss(r) * 0.14]);
      for (i = 0; i < 170; i++) { var a = r() * Math.PI * 2, rad = 0.72 + gauss(r) * 0.05; p.push([rad * Math.cos(a), rad * Math.sin(a)]); }
      return p;
    },
    azar: function (r) { var p = []; for (var i = 0; i < 220; i++) p.push([r() * 1.9 - 0.95, r() * 1.9 - 0.95]); return p; }
  };

  /* centros iniciales: al azar (puntos cualesquiera) o K-Means++ (cada nuevo centro, probablemente lejos de los anteriores) */
  function init(pts, k, how, r) {
    var c = [];
    if (how === 'azar') {
      var idx = pts.map(function (_, i) { return i; });
      for (var i = 0; i < k && idx.length; i++) c.push(pts[idx.splice(Math.floor(r() * idx.length), 1)[0]].slice());
      return c;
    }
    c.push(pts[Math.floor(r() * pts.length)].slice());
    while (c.length < k) {
      var ds = pts.map(function (p) { return Math.min.apply(null, c.map(function (q) { return d2(p, q); })); });
      var tot = ds.reduce(function (a, b) { return a + b; }, 0), t = r() * tot, j = 0;
      while (j < pts.length - 1 && (t -= ds[j]) > 0) j++;
      c.push(pts[j].slice());
    }
    return c;
  }
  /* paso 1: cada punto, al centro más cercano. Devuelve cuántos han cambiado de grupo */
  function assign(pts, cent, lab) {
    var changed = 0;
    for (var i = 0; i < pts.length; i++) {
      var best = 0, bd = Infinity;
      for (var j = 0; j < cent.length; j++) { var d = d2(pts[i], cent[j]); if (d < bd) { bd = d; best = j; } }
      if (lab[i] !== best) { lab[i] = best; changed++; }
    }
    return changed;
  }
  /* paso 2: cada centro, a la media de sus puntos. Devuelve cuánto se ha movido el que más */
  function update(pts, cent, lab) {
    var sx = cent.map(function () { return 0; }), sy = sx.slice(), n = sx.slice(), moved = 0;
    for (var i = 0; i < pts.length; i++) { sx[lab[i]] += pts[i][0]; sy[lab[i]] += pts[i][1]; n[lab[i]]++; }
    for (var j = 0; j < cent.length; j++) if (n[j]) {
      var nx = sx[j] / n[j], ny = sy[j] / n[j];
      moved = Math.max(moved, Math.hypot(nx - cent[j][0], ny - cent[j][1]));
      cent[j] = [nx, ny];
    }
    return moved;
  }
  /* inercia: suma de distancias al cuadrado de cada punto a su centro (cuanto menor, grupos más apretados) */
  function inertia(pts, cent, lab) { var s = 0; for (var i = 0; i < pts.length; i++) s += d2(pts[i], cent[lab[i]]); return s; }
  /* K-Means completo (para el método del codo): el mejor de varios intentos */
  function run(pts, k, how, seed, tries) {
    var best = Infinity;
    for (var t = 0; t < (tries || 3); t++) {
      var r = rng(seed + t * 977), cent = init(pts, k, how, r), lab = new Int32Array(pts.length).fill(-1);
      for (var it = 0; it < 100; it++) { var ch = assign(pts, cent, lab); update(pts, cent, lab); if (!ch) break; }
      best = Math.min(best, inertia(pts, cent, lab));
    }
    return best;
  }
  return { rng: rng, DATASETS: DATASETS, init: init, assign: assign, update: update, inertia: inertia, run: run };
})();
