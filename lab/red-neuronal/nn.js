/* Red neuronal desde cero, sin librerías: un perceptrón multicapa que separa puntos en dos clases.
   Capas ocultas con la activación elegida, salida sigmoide (probabilidad de ser azul), pérdida de
   entropía cruzada, entrenamiento por lotes con Adam y regularización L2 opcional.
   Basada en la red de la primera versión de la web. */
var NN = (function () {
  // números aleatorios con semilla (para poder repetir un experimento) y ruido gaussiano
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ---- funciones de activación: f(z) y su derivada escrita en función de la salida a = f(z) ---- */
  var ACTS = {
    relu:    { f: function (z) { return z > 0 ? z : 0; }, df: function (a) { return a > 0 ? 1 : 0; } },
    tanh:    { f: Math.tanh, df: function (a) { return 1 - a * a; } },
    sigmoid: { f: function (z) { return 1 / (1 + Math.exp(-z)); }, df: function (a) { return a * (1 - a); } },
    linear:  { f: function (z) { return z; }, df: function () { return 1; } }
  };

  /* ---- conjuntos de datos: puntos [x, y, clase] en el cuadrado [-1, 1] ---- */
  var DATASETS = {
    circulos: function (n, noise, r) {
      var p = [];
      for (var i = 0; i < n; i++) {
        var c = i % 2, rad = c ? r() * 0.38 : 0.62 + r() * 0.3, a = r() * Math.PI * 2;
        p.push([rad * Math.cos(a) + gauss(r) * noise * 0.3, rad * Math.sin(a) + gauss(r) * noise * 0.3, c]);
      }
      return p;
    },
    xor: function (n, noise, r) {
      var p = [];
      for (var i = 0; i < n; i++) {
        var x = (r() * 2 - 1) * 0.9, y = (r() * 2 - 1) * 0.9;
        p.push([x + gauss(r) * noise * 0.25, y + gauss(r) * noise * 0.25, x * y > 0 ? 1 : 0]);
      }
      return p;
    },
    gauss: function (n, noise, r) {
      var p = [];
      for (var i = 0; i < n; i++) {
        var c = i % 2, m = c ? 0.42 : -0.42, s = 0.18 + noise * 0.5;
        p.push([m + gauss(r) * s, m + gauss(r) * s, c]);
      }
      return p;
    },
    lunas: function (n, noise, r) {
      var p = [];
      for (var i = 0; i < n; i++) {
        var c = i % 2, t = r() * Math.PI, x, y;
        if (c) { x = (Math.cos(t) - 0.5) * 0.6; y = (Math.sin(t) - 0.25) * 0.8; }
        else { x = (1 - Math.cos(t) - 0.5) * 0.6; y = (0.25 - Math.sin(t)) * 0.8; }
        p.push([x + gauss(r) * noise * 0.3, y + gauss(r) * noise * 0.3, c]);
      }
      return p;
    },
    espiral: function (n, noise, r) {
      var p = [], half = n / 2;
      for (var c = 0; c < 2; c++) for (var i = 0; i < half; i++) {
        var t = i / half, rad = 0.08 + t * 0.85, ang = t * 3.2 * Math.PI + c * Math.PI;
        p.push([rad * Math.cos(ang) + gauss(r) * noise * 0.2, rad * Math.sin(ang) + gauss(r) * noise * 0.2, c]);
      }
      return p;
    }
  };

  /* ---- entradas que puede recibir la red, calculadas a partir de (x, y) ---- */
  var FEATURES = {
    x:    { label: 'x',     f: function (x, y) { return x; } },
    y:    { label: 'y',     f: function (x, y) { return y; } },
    x2:   { label: 'x²',    f: function (x, y) { return x * x; } },
    y2:   { label: 'y²',    f: function (x, y) { return y * y; } },
    xy:   { label: 'x·y',   f: function (x, y) { return x * y; } },
    sinx: { label: 'sen x', f: function (x, y) { return Math.sin(Math.PI * x); } },
    siny: { label: 'sen y', f: function (x, y) { return Math.sin(Math.PI * y); } }
  };

  /* ---- la red: sizes = [entradas, capa oculta 1, ..., 1 salida] ---- */
  function MLP(sizes, act, seed) {
    var r = rng(seed);
    this.sizes = sizes; this.act = ACTS[act]; this.L = sizes.length - 1; this.t = 0;
    this.W = []; this.B = []; this.mW = []; this.vW = []; this.mB = []; this.vB = [];
    for (var l = 0; l < this.L; l++) {
      var nin = sizes[l], nout = sizes[l + 1], w = new Float64Array(nin * nout);
      // pesos iniciales al azar, con la escala adecuada para que la señal no se apague ni se dispare
      var lim = act === 'relu' ? Math.sqrt(6 / nin) : Math.sqrt(6 / (nin + nout));
      for (var i = 0; i < w.length; i++) w[i] = (r() * 2 - 1) * lim;
      this.W.push(w); this.B.push(new Float64Array(nout).fill(act === 'relu' ? 0.05 : 0));
      this.mW.push(new Float64Array(w.length)); this.vW.push(new Float64Array(w.length));
      this.mB.push(new Float64Array(nout)); this.vB.push(new Float64Array(nout));
    }
  }
  /* propagación hacia delante: devuelve la salida de cada capa (la primera es la entrada) */
  MLP.prototype.forward = function (x) {
    var A = [x], L = this.L, f = this.act.f;
    for (var l = 0; l < L; l++) {
      var nin = this.sizes[l], nout = this.sizes[l + 1], w = this.W[l], b = this.B[l], a = A[l], o = new Float64Array(nout);
      for (var j = 0; j < nout; j++) {
        var s = b[j];
        for (var i = 0; i < nin; i++) s += w[j * nin + i] * a[i];
        o[j] = l === L - 1 ? 1 / (1 + Math.exp(-s)) : f(s);
      }
      A.push(o);
    }
    return A;
  };
  MLP.prototype.predict = function (x) { var A = this.forward(x); return A[this.L][0]; };
  /* un paso de entrenamiento con un lote: retropropagación del error y actualización con Adam */
  MLP.prototype.trainBatch = function (X, Y, lr, l2) {
    var L = this.L, gW = [], gB = [], l, n = X.length, df = this.act.df;
    for (l = 0; l < L; l++) { gW.push(new Float64Array(this.W[l].length)); gB.push(new Float64Array(this.B[l].length)); }
    for (var k = 0; k < n; k++) {
      var A = this.forward(X[k]), delta = [A[L][0] - Y[k]];       // con sigmoide + entropía cruzada, el error es p - y
      for (l = L - 1; l >= 0; l--) {
        var nin = this.sizes[l], nout = this.sizes[l + 1], a = A[l], w = this.W[l], prev = l > 0 ? new Float64Array(nin) : null;
        for (var j = 0; j < nout; j++) {
          var d = delta[j]; gB[l][j] += d;
          for (var i = 0; i < nin; i++) { gW[l][j * nin + i] += d * a[i]; if (prev) prev[i] += w[j * nin + i] * d; }
        }
        if (prev) { for (var q = 0; q < nin; q++) prev[q] *= df(a[q]); delta = prev; }
      }
    }
    this.t++;
    var b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
    for (l = 0; l < L; l++) {
      var W = this.W[l], B = this.B[l];
      for (var u = 0; u < W.length; u++) {
        var g = gW[l][u] / n + (l2 || 0) * W[u];
        this.mW[l][u] = b1 * this.mW[l][u] + (1 - b1) * g; this.vW[l][u] = b2 * this.vW[l][u] + (1 - b2) * g * g;
        W[u] -= lr * (this.mW[l][u] / c1) / (Math.sqrt(this.vW[l][u] / c2) + 1e-8);
      }
      for (var v = 0; v < B.length; v++) {
        var gb = gB[l][v] / n;
        this.mB[l][v] = b1 * this.mB[l][v] + (1 - b1) * gb; this.vB[l][v] = b2 * this.vB[l][v] + (1 - b2) * gb * gb;
        B[v] -= lr * (this.mB[l][v] / c1) / (Math.sqrt(this.vB[l][v] / c2) + 1e-8);
      }
    }
  };
  /* pérdida (entropía cruzada) y precisión sobre un conjunto; vec convierte (x, y) en las entradas */
  MLP.prototype.evaluate = function (set, vec) {
    var s = 0, ok = 0;
    for (var i = 0; i < set.length; i++) {
      var p = Math.min(1 - 1e-7, Math.max(1e-7, this.predict(vec(set[i][0], set[i][1]))));
      s += -(set[i][2] * Math.log(p) + (1 - set[i][2]) * Math.log(1 - p));
      if ((p > 0.5 ? 1 : 0) === set[i][2]) ok++;
    }
    return { loss: set.length ? s / set.length : 0, acc: set.length ? ok / set.length : 0 };
  };

  return { rng: rng, ACTS: ACTS, DATASETS: DATASETS, FEATURES: FEATURES, MLP: MLP };
})();
