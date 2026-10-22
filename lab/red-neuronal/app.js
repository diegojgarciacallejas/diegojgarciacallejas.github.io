/* Banco de pruebas de la red neuronal: controles, dibujo de la red, salida, curva de pérdida, pistas y retos */
(function () {
  function $(id) { return document.getElementById(id); }
  var BLUE = [106, 166, 240], ORANGE = [242, 160, 59], BG = [36, 26, 61];
  var ACT_INFO = {
    relu: '<b>ReLU</b>: deja pasar lo positivo tal cual y convierte lo negativo en 0. Sencilla y rápida: es la más usada hoy.',
    tanh: '<b>tanh</b>: una «S» que va de −1 a 1, suave y centrada en el 0. Funciona muy bien en redes pequeñas como esta.',
    sigmoid: '<b>Sigmoide</b>: una «S» de 0 a 1, como una probabilidad. Aprende más despacio porque sus pendientes son pequeñas.',
    linear: '<b>Lineal</b>: no dobla nada. Pongas las capas que pongas, la red solo podrá separar con una línea recta.'
  };
  var MAX_LAYERS = 4, MAX_NEURONS = 8, N_POINTS = 240, N_TRAIN = 170;

  var st = {
    ds: 'circulos', noise: 0.1, feats: { x: true, y: true }, layers: [4, 4], act: 'tanh', lr: 0.03, l2: 0,
    seed: 7, speed: 4, running: true, epoch: 0, hist: { tr: [], te: [], stride: 1 }, mine: [], brush: null,
    train: [], test: [], net: null, last: null, hover: null
  };

  /* ---------- datos y entrenamiento ---------- */
  function featList() { return Object.keys(NN.FEATURES).filter(function (k) { return st.feats[k]; }); }
  function vec(x, y) { return featList().map(function (k) { return NN.FEATURES[k].f(x, y); }); }

  function regen() {
    var r = NN.rng(st.seed * 31 + st.ds.length * 7 + Math.round(st.noise * 100));
    var all = NN.DATASETS[st.ds](N_POINTS, st.noise, r);
    for (var i = all.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = all[i]; all[i] = all[j]; all[j] = t; }
    st.train = all.slice(0, N_TRAIN).concat(st.mine); st.test = all.slice(N_TRAIN);
  }
  function reset() {
    st.net = new NN.MLP([featList().length].concat(st.layers, [1]), st.act, st.seed);
    st.epoch = 0; st.hist = { tr: [], te: [], stride: 1 };
    measure(); drawAll();
  }
  function measure() { st.last = { tr: st.net.evaluate(st.train, vec), te: st.net.evaluate(st.test, vec) }; }
  function epoch() {
    var idx = st.train.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    for (var b = 0; b < idx.length; b += 16) {
      var X = [], Y = [];
      for (var k = b; k < Math.min(b + 16, idx.length); k++) { var p = st.train[idx[k]]; X.push(vec(p[0], p[1])); Y.push(p[2]); }
      st.net.trainBatch(X, Y, st.lr, st.l2);
    }
    st.epoch++;
    measure();
    // la curva guarda como mucho 600 puntos: cuando se llena, se queda con uno de cada dos
    if (st.epoch % st.hist.stride === 0) { st.hist.tr.push(st.last.tr.loss); st.hist.te.push(st.last.te.loss); }
    if (st.hist.tr.length > 600) {
      st.hist.tr = st.hist.tr.filter(function (_, i) { return i % 2 === 0; }); st.hist.te = st.hist.te.filter(function (_, i) { return i % 2 === 0; }); st.hist.stride *= 2;
    }
  }

  /* ---------- colores ---------- */
  // t entre 0 (naranja) y 1 (azul); conf: cuánto se aleja de la duda (0,5) → más color, menos fondo
  function heatColor(t, strong) {
    var c = t >= 0.5 ? BLUE : ORANGE, a = (strong ? 0.35 : 0.18) + (strong ? 0.6 : 0.62) * Math.abs(t - 0.5) * 2;
    return [BG[0] + (c[0] - BG[0]) * a, BG[1] + (c[1] - BG[1]) * a, BG[2] + (c[2] - BG[2]) * a];
  }
  function css(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; }

  /* ---------- salida: lo que dice la red en cada punto, la frontera y los datos encima ----------
     Se calcula en una rejilla de (N + 1) x (N + 1) puntos y se dibuja suavizada; la frontera (donde la red
     duda, p = 0,5) se traza con «marching squares» sobre la misma rejilla. */
  var out = $('out'), octx = out.getContext('2d'), N = 60, heat = document.createElement('canvas');
  heat.width = heat.height = N + 1;
  var hctx = heat.getContext('2d'), grid = new Float32Array((N + 1) * (N + 1));
  function sizeOut() {
    var dpr = window.devicePixelRatio || 1, w = out.clientWidth || 300;
    if (out.width !== Math.round(w * dpr)) { out.width = out.height = Math.round(w * dpr); }
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return w;
  }
  function drawOut() {
    var S = sizeOut(), img = hctx.createImageData(N + 1, N + 1), x, y, k;
    for (y = 0; y <= N; y++) for (x = 0; x <= N; x++) {
      var p = st.net.predict(vec(x / N * 2 - 1, y / N * 2 - 1)), c = heatColor(p, true), o = (y * (N + 1) + x) * 4;
      grid[y * (N + 1) + x] = p;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
    hctx.putImageData(img, 0, 0);
    // cada píxel de la rejilla es un punto de muestra: se estira medio píxel por cada lado para que caigan en su sitio
    var cell = S / N;
    octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
    octx.drawImage(heat, -cell / 2, -cell / 2, S + cell, S + cell);
    // frontera
    octx.strokeStyle = 'rgba(243,238,220,.85)'; octx.lineWidth = 2; octx.lineJoin = 'round'; octx.beginPath();
    function v(ix, iy) { return grid[iy * (N + 1) + ix] - 0.5; }
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      var c4 = [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]], pts = [];
      for (k = 0; k < 4; k++) {
        var a = c4[k], b = c4[(k + 1) % 4], va = v(a[0], a[1]), vb = v(b[0], b[1]);
        if ((va < 0) !== (vb < 0)) { var t = va / (va - vb); pts.push([(a[0] + (b[0] - a[0]) * t) * cell, (a[1] + (b[1] - a[1]) * t) * cell]); }
      }
      for (k = 0; k + 1 < pts.length; k += 2) { octx.moveTo(pts[k][0], pts[k][1]); octx.lineTo(pts[k + 1][0], pts[k + 1][1]); }
    }
    octx.stroke();
    // datos: entrenamiento rellenos, prueba huecos, los añadidos a mano con un aro
    function pt(p, hollow) {
      var px = (p[0] + 1) / 2 * S, py = (p[1] + 1) / 2 * S, c = p[2] ? BLUE : ORANGE;
      octx.beginPath(); octx.arc(px, py, hollow ? 3.6 : 4, 0, Math.PI * 2);
      if (hollow) { octx.fillStyle = css(BG); octx.fill(); octx.lineWidth = 2; octx.strokeStyle = css(c); octx.stroke(); }
      else { octx.fillStyle = css(c); octx.fill(); octx.lineWidth = 1.2; octx.strokeStyle = '#120b1c'; octx.stroke(); }
      if (p[3]) { octx.beginPath(); octx.arc(px, py, 7, 0, Math.PI * 2); octx.lineWidth = 1.5; octx.strokeStyle = '#f3eedc'; octx.stroke(); }
    }
    st.test.forEach(function (p) { pt(p, true); });
    st.train.forEach(function (p) { pt(p, false); });
  }
  function probeAt(e) {
    var r = out.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1;
    return [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
  }
  out.addEventListener('mousemove', function (e) {
    var q = probeAt(e), p = st.net.predict(vec(q[0], q[1])), blue = p >= 0.5;
    $('probe').innerHTML = t('En ({0} ; {1}) la red dice:', fmt(q[0], 2), fmt(q[1], 2)) + ' <b style="color:' + (blue ? 'var(--blue)' : 'var(--orange)') + '">' +
      Math.round((blue ? p : 1 - p) * 100) + ' % ' + t(blue ? 'azul' : 'naranja') + '</b>' + (Math.abs(p - 0.5) < 0.1 ? t(' (duda: está en la frontera)') : '');
  });
  out.addEventListener('mouseleave', function () { $('probe').textContent = t('Pasa el ratón por el plano para ver qué dice la red en cada punto.'); });
  out.addEventListener('click', function (e) {
    if (st.brush === null) return;
    var q = probeAt(e), p = [q[0], q[1], st.brush, 1];
    st.mine.push(p); st.train.push(p); measure(); drawAll();
  });

  /* ---------- la red dibujada: cada neurona con su mapa y los pesos como líneas ---------- */
  var net = $('net'), nctx = net.getContext('2d'), G = 16, nodes = [];
  var mapCanvas = document.createElement('canvas'); mapCanvas.width = mapCanvas.height = G;
  var mctx = mapCanvas.getContext('2d');
  function sizeNet() {
    var dpr = window.devicePixelRatio || 1, w = net.clientWidth, h = net.clientHeight;
    if (net.width !== Math.round(w * dpr)) { net.width = Math.round(w * dpr); net.height = Math.round(h * dpr); }
    nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [w, h];
  }
  function drawNet() {
    var wh = sizeNet(), W = wh[0], H = wh[1], sizes = st.net.sizes, L = st.net.L, l, j, i;
    nctx.clearRect(0, 0, W, H);
    // mapas: la salida de cada neurona en una rejilla G x G del plano
    var maps = sizes.map(function (n) { var a = []; for (var k = 0; k < n; k++) a.push(new Float32Array(G * G)); return a; });
    for (var gy = 0; gy < G; gy++) for (var gx = 0; gx < G; gx++) {
      var A = st.net.forward(vec((gx + 0.5) / G * 2 - 1, (gy + 0.5) / G * 2 - 1));
      for (l = 0; l <= L; l++) for (j = 0; j < sizes[l]; j++) maps[l][j][gy * G + gx] = A[l][j];
    }
    // posiciones
    var NS = 34, gap = 12, cols = sizes.length, left = 64, right = 30, top = 34;
    nodes = [];
    var colX = function (c) { return left + (W - left - right - NS) * (cols === 1 ? 0 : c / (cols - 1)); };
    for (l = 0; l < cols; l++) {
      var n = sizes[l], hh = n * NS + (n - 1) * gap, y0 = top + (H - top - 10 - hh) / 2;
      for (j = 0; j < n; j++) nodes.push({ l: l, j: j, x: colX(l), y: y0 + j * (NS + gap) });
    }
    function node(l, j) { return nodes.filter(function (o) { return o.l === l && o.j === j; })[0]; }
    // pesos
    for (l = 0; l < L; l++) {
      var nin = sizes[l];
      for (j = 0; j < sizes[l + 1]; j++) for (i = 0; i < nin; i++) {
        var w = st.net.W[l][j * nin + i], a = node(l, i), b = node(l + 1, j), mag = Math.abs(w);
        nctx.strokeStyle = css(w > 0 ? BLUE : ORANGE, Math.min(0.9, 0.12 + mag * 0.35));
        nctx.lineWidth = Math.min(6, 0.6 + mag * 1.4);
        nctx.beginPath(); nctx.moveTo(a.x + NS, a.y + NS / 2);
        nctx.bezierCurveTo(a.x + NS + 30, a.y + NS / 2, b.x - 30, b.y + NS / 2, b.x, b.y + NS / 2); nctx.stroke();
      }
    }
    // neuronas (su mapa, suavizado)
    nctx.imageSmoothingEnabled = true; nctx.imageSmoothingQuality = 'high';
    nodes.forEach(function (o) {
      var m = maps[o.l][o.j], img = mctx.createImageData(G, G), isOut = o.l === L;
      for (var k = 0; k < G * G; k++) {
        var v = m[k], t = isOut ? v : 0.5 + 0.5 * Math.tanh(v * 1.5), c = heatColor(t, true);
        img.data[k * 4] = c[0]; img.data[k * 4 + 1] = c[1]; img.data[k * 4 + 2] = c[2]; img.data[k * 4 + 3] = 255;
      }
      mctx.putImageData(img, 0, 0);
      var hot = st.hover && st.hover.l === o.l && st.hover.j === o.j;
      nctx.fillStyle = hot ? '#f3eedc' : '#120b1c'; nctx.fillRect(o.x - 3, o.y - 3, NS + 6, NS + 6);
      nctx.drawImage(mapCanvas, o.x, o.y, NS, NS);
    });
    // rótulos
    nctx.font = '17px "Jersey 20", monospace'; nctx.fillStyle = '#a59fc0'; nctx.textAlign = 'center';
    for (l = 0; l < cols; l++) {
      var label = l === 0 ? t('Entradas') : l === L ? t('Salida') : t('Capa {0}', l);
      nctx.fillText(label, colX(l) + NS / 2, 18);
    }
    nctx.textAlign = 'right'; nctx.fillStyle = '#f3eedc';
    featList().forEach(function (k, j) { var o = node(0, j); nctx.fillText(t(NN.FEATURES[k].label), o.x - 8, o.y + NS / 2 + 6); });
  }
  net.addEventListener('mousemove', function (e) {
    var r = net.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    var hit = nodes.filter(function (o) { return x >= o.x - 3 && x <= o.x + 37 && y >= o.y - 3 && y <= o.y + 37; })[0] || null;
    if ((hit && st.hover && hit.l === st.hover.l && hit.j === st.hover.j) || (!hit && !st.hover)) return;
    st.hover = hit; caption(); drawNet();
  });
  net.addEventListener('mouseleave', function () { st.hover = null; caption(); drawNet(); });
  function caption() {
    var h = st.hover, L = st.net.L, c = $('netcap');
    if (!h) { c.innerHTML = t('Cada cuadrado es una neurona y dentro se ve a qué zona del plano responde (azul: valor alto, naranja: bajo). Las líneas son los pesos: azul si suman, naranja si restan; más gruesa, más fuerza. Pasa el ratón por una neurona.'); return; }
    if (h.l === 0) { var k = featList()[h.j], fl = t(NN.FEATURES[k].label); c.innerHTML = t('<b>Entrada «{0}»</b>: el valor de {0} en cada punto del plano. Es lo único que la red sabe de cada punto.', fl); return; }
    var bias = st.net.B[h.l - 1][h.j];
    if (h.l === L) { c.innerHTML = t('<b>Salida</b>: la probabilidad de que un punto sea azul (sesgo {0}). Es la misma imagen que la salida grande de la derecha.', fmt(bias, 2)); return; }
    c.innerHTML = t('<b>Capa {0}, neurona {1}</b> (sesgo {2}): se activa en la zona azul de su cuadrado.', h.l, h.j + 1, fmt(bias, 2)) + ' ' +
      t(h.l === 1 ? 'Las de la primera capa solo pueden partir el plano con formas sencillas…' : '…y las de capas más profundas combinan esas formas en otras más complicadas.');
  }

  /* ---------- curva de pérdida ---------- */
  var lossC = $('loss'), lctx = lossC.getContext('2d');
  function drawLoss() {
    var dpr = window.devicePixelRatio || 1, W = lossC.clientWidth, H = lossC.clientHeight;
    if (lossC.width !== Math.round(W * dpr)) { lossC.width = Math.round(W * dpr); lossC.height = Math.round(H * dpr); }
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0); lctx.clearRect(0, 0, W, H);
    var pl = 34, pr = 6, pt = 8, pb = 8, LO = Math.log10(0.003), HI = Math.log10(1.5);
    function Y(v) { return pt + (1 - (Math.log10(Math.min(1.5, Math.max(0.003, v))) - LO) / (HI - LO)) * (H - pt - pb); }
    lctx.font = '13px "Jersey 20", monospace'; lctx.textAlign = 'right';
    [0.01, 0.1, 1].forEach(function (g) {
      var y = Math.round(Y(g)) + 0.5; lctx.strokeStyle = '#4b3677'; lctx.lineWidth = 1;
      lctx.beginPath(); lctx.moveTo(pl, y); lctx.lineTo(W - pr, y); lctx.stroke();
      lctx.fillStyle = '#a59fc0'; lctx.fillText(LANG === 'en' ? String(g) : String(g).replace('.', ','), pl - 5, y + 4);
    });
    function line(arr, col) {
      if (arr.length < 2) return;
      var n = Math.max(arr.length, 60);
      lctx.beginPath(); lctx.strokeStyle = col; lctx.lineWidth = 2;
      arr.forEach(function (v, i) { var x = pl + i / (n - 1) * (W - pl - pr), y = Y(v); i ? lctx.lineTo(x, y) : lctx.moveTo(x, y); });
      lctx.stroke();
    }
    line(st.hist.te, '#e88aa0'); line(st.hist.tr, '#7cc59a');
  }

  /* ---------- cifras y pistas ---------- */
  function fmt(v, d) { var s = Math.abs(v).toFixed(d); return (v < 0 && +s ? '−' : '') + (LANG === 'en' ? s : s.replace('.', ',')); }
  function stats() {
    var l = st.last;
    $('epoch').textContent = st.epoch;
    $('ltr').textContent = fmt(l.tr.loss, 3); $('lte').textContent = fmt(l.te.loss, 3);
    $('acc').textContent = Math.round(l.te.acc * 100) + ' %';
  }
  function hint() {
    var e = st.epoch, l = st.last, te = st.hist.te, tr = st.hist.tr, h;
    var onlyXY = featList().every(function (k) { return k === 'x' || k === 'y'; });
    var linearNet = st.act === 'linear' || st.layers.length === 0;
    var bestTe = te.length ? Math.min.apply(null, te) : 1;
    var recent = tr.slice(-12), mean = recent.reduce(function (a, b) { return a + b; }, 0) / (recent.length || 1);
    var jumpy = recent.length > 8 && recent.some(function (v) { return Math.abs(v - mean) > mean * 0.35; });
    if (e === 0) h = t('Los pesos empiezan al azar: la red todavía no sabe nada. Dale a <b>▶ Entrenar</b>.');
    else if (l.te.acc >= 0.97) h = t('¡Lo tiene! Acierta el {0} % de los puntos de prueba, que no ha visto nunca.', Math.round(l.te.acc * 100)) + (st.l2 ? t(' La regularización mantiene los pesos pequeños y la frontera suave.') : '');
    else if (st.lr >= 0.3 && jumpy) h = t('La pérdida da saltos: con una tasa de aprendizaje tan alta, cada paso se pasa de largo. Prueba a bajarla.');
    else if (e > 200 && te.length > 30 && l.te.loss > bestTe * 1.3 && l.tr.acc - l.te.acc > 0.1 && l.tr.acc > 0.9) h = t('<b>Sobreajuste</b>: la pérdida de entrenamiento sigue bajando pero la de prueba sube. Está memorizando. Prueba menos neuronas o regularización L2.');
    else if (e > 80 && l.te.acc < 0.9 && linearNet && onlyXY && st.ds !== 'gauss') h = t('Esta red solo puede trazar <b>una recta</b>, y estos datos no se separan con una recta. Añade capas con activación no lineal, o entradas como x² e y².');
    else if (st.lr <= 0.003 && e > 100 && l.te.acc < 0.9) h = t('Va muy despacio: con una tasa de aprendizaje tan pequeña, cada paso es diminuto. Súbela un poco.');
    else if (e > 400 && l.te.acc < 0.85) h = t('Le está costando: prueba más neuronas, otra capa, otra activación o entradas extra.');
    else h = t('Entrenando: en cada época ve todos los puntos de entrenamiento y ajusta un poco cada peso para equivocarse menos.');
    if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
  }
  function drawAll() { drawOut(); drawNet(); drawLoss(); stats(); hint(); }

  /* ---------- bucle ---------- */
  var raf = 0;
  function loop() {
    raf = 0;
    if (!st.running) return;
    for (var i = 0; i < st.speed; i++) epoch();
    drawAll();
    raf = requestAnimationFrame(loop);
  }
  function setRunning(on) {
    st.running = on; $('play').textContent = t(on ? '❚❚ Pausar' : '▶ Entrenar');
    if (on && !raf) raf = requestAnimationFrame(loop);
  }

  /* ---------- controles ---------- */
  function seg(group, value) {
    document.querySelectorAll('[data-group="' + group + '"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === String(value === null ? '' : value))); });
  }
  function drawAct() {
    var c = $('actplot'), dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight, x = c.getContext('2d'), f = NN.ACTS[st.act].f;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    function Y(v) { return H / 2 - Math.max(-1.6, Math.min(1.6, v)) / 1.6 * (H / 2 - 6); }
    x.fillStyle = '#4b3677'; x.fillRect(0, Math.round(H / 2), W, 1); x.fillRect(Math.round(W / 2), 0, 1, H);
    x.fillStyle = '#7cc59a';
    for (var px = 0; px < W; px += 3) { var z = (px / W * 2 - 1) * 3; x.fillRect(px, Math.round(Y(f(z))) - 1, 3, 3); }
    $('actinfo').innerHTML = t(ACT_INFO[st.act]);
  }
  function drawLayers() {
    var box = $('layers'); box.innerHTML = '';
    if (!st.layers.length) box.innerHTML = '<div class="dim" style="font-size:14px">Sin capas ocultas: las entradas van directas a la salida.</div>';
    st.layers.forEach(function (n, i) {
      var row = document.createElement('div'); row.className = 'layer';
      row.innerHTML = '<span>' + t(n === 1 ? 'Capa {0}: {1} neurona' : 'Capa {0}: {1} neuronas', i + 1, n) + '</span>';
      var minus = document.createElement('button'), plus = document.createElement('button');
      minus.className = plus.className = 'mini'; minus.type = plus.type = 'button';
      minus.textContent = '−'; plus.textContent = '+'; minus.setAttribute('aria-label', t('Quitar neurona de la capa {0}', i + 1)); plus.setAttribute('aria-label', t('Añadir neurona a la capa {0}', i + 1));
      minus.disabled = n <= 1; plus.disabled = n >= MAX_NEURONS;
      minus.onclick = function () { st.layers[i]--; drawLayers(); reset(); };
      plus.onclick = function () { st.layers[i]++; drawLayers(); reset(); };
      row.append(minus, plus); box.append(row);
    });
    $('add-layer').disabled = st.layers.length >= MAX_LAYERS; $('del-layer').disabled = !st.layers.length;
  }
  function drawFeats() {
    var box = $('feats'); box.innerHTML = '';
    Object.keys(NN.FEATURES).forEach(function (k) {
      var lab = document.createElement('label'); lab.className = 'chip';
      lab.innerHTML = '<input type="checkbox"' + (st.feats[k] ? ' checked' : '') + '> ' + t(NN.FEATURES[k].label);
      lab.querySelector('input').onchange = function (e) {
        st.feats[k] = e.target.checked;
        if (!featList().length) { st.feats.x = true; drawFeats(); }       // al menos una entrada
        reset();
      };
      box.append(lab);
    });
  }
  function syncUI() {
    seg('ds', st.ds); seg('act', st.act); seg('speed', st.speed); seg('brush', st.brush);
    $('noise').value = st.noise; $('noise-v').textContent = fmt(st.noise, 2);
    $('lr').value = String(st.lr); $('l2').value = String(st.l2);
    drawFeats(); drawLayers(); drawAct();
  }
  document.querySelectorAll('[data-group] button').forEach(function (b) {
    b.addEventListener('click', function () {
      var g = b.parentElement.dataset.group, v = b.dataset.v;
      if (g === 'ds') { st.ds = v; st.mine = []; regen(); reset(); }
      if (g === 'act') { st.act = v; drawAct(); reset(); }
      if (g === 'speed') st.speed = +v;
      if (g === 'brush') st.brush = v === '' ? null : +v;
      seg(g, g === 'brush' ? st.brush : g === 'speed' ? st.speed : v);
    });
  });
  $('noise').addEventListener('input', function (e) { st.noise = +e.target.value; $('noise-v').textContent = fmt(st.noise, 2); regen(); reset(); });
  $('lr').addEventListener('change', function (e) { st.lr = +e.target.value; });        // se aplica sin reiniciar: se ve el efecto al momento
  $('l2').addEventListener('change', function (e) { st.l2 = +e.target.value; });
  $('add-layer').onclick = function () { st.layers.push(4); drawLayers(); reset(); };
  $('del-layer').onclick = function () { st.layers.pop(); drawLayers(); reset(); };
  $('play').onclick = function () { setRunning(!st.running); };
  $('step').onclick = function () { setRunning(false); epoch(); drawAll(); };
  $('reset').onclick = function () { st.seed = Math.floor(Math.random() * 1e6); reset(); };
  $('clear-mine').onclick = function () { st.mine = []; regen(); measure(); drawAll(); };
  window.addEventListener('resize', function () { drawOut(); drawNet(); drawLoss(); drawAct(); });
  // dentro del juego, los enlaces a otras páginas del laboratorio sustituyen esta (no suman pasos al historial)
  if (window.parent !== window) document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (a && a.id !== 'back' && a.target !== '_blank' && a.origin === location.origin) { e.preventDefault(); location.replace(a.href); }
  });
  // dentro del juego, Esc cierra el visor
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && window.parent !== window) parent.postMessage('viewer:close', location.origin); });
  // volver: al juego si se vino de él; si no, al menú
  $('back').addEventListener('click', function (e) {
    if (window.parent !== window) { e.preventDefault(); parent.postMessage('viewer:close', location.origin); return; }   // dentro del juego
    if (document.referrer && document.referrer.indexOf(location.origin) === 0 && history.length > 1) { e.preventDefault(); history.back(); }
  });

  /* ---------- retos ---------- */
  var CHALLENGES = [
    { t: 'Una recta no basta', d: 'Círculos con una red sin capas ocultas. ¿Por qué no lo consigue? Pista: activa las entradas x² e y² y vuelve a entrenar.',
      cfg: { ds: 'circulos', feats: ['x', 'y'], layers: [], act: 'tanh', lr: 0.03, l2: 0, noise: 0.1 } },
    { t: 'El clásico XOR', d: 'Los azules están en dos esquinas opuestas. Con una neurona es imposible: ¿cuántas hacen falta como mínimo?',
      cfg: { ds: 'xor', feats: ['x', 'y'], layers: [1], act: 'tanh', lr: 0.03, l2: 0, noise: 0.05 } },
    { t: 'Capas lineales', d: 'Tres capas de seis neuronas… con activación lineal. Sigue trazando una recta. Cambia a ReLU o tanh y compara.',
      cfg: { ds: 'circulos', feats: ['x', 'y'], layers: [6, 6, 6], act: 'linear', lr: 0.03, l2: 0, noise: 0.1 } },
    { t: 'La espiral', d: 'El reto difícil: con solo x e y hacen falta varias capas y paciencia. Prueba después a darle sen x y sen y.',
      cfg: { ds: 'espiral', feats: ['x', 'y'], layers: [8, 8, 6], act: 'tanh', lr: 0.03, l2: 0, noise: 0.05 } },
    { t: 'Sobreajuste a propósito', d: 'Datos muy ruidosos y una red enorme: mira cómo la pérdida de prueba acaba subiendo. Luego pon regularización L2 de 0,01.',
      cfg: { ds: 'gauss', feats: ['x', 'y', 'x2', 'y2', 'xy', 'sinx', 'siny'], layers: [8, 8, 8], act: 'relu', lr: 0.03, l2: 0, noise: 0.6 } },
    { t: 'Demasiado rápido', d: 'Tasa de aprendizaje 1: en cada paso se pasa de largo y la pérdida no se asienta. Bájala a 0,03 sin reiniciar y mira qué pasa.',
      cfg: { ds: 'lunas', feats: ['x', 'y'], layers: [6, 4], act: 'relu', lr: 1, l2: 0, noise: 0.1 } }
  ];
  CHALLENGES.forEach(function (ch, i) {
    var card = document.createElement('div'); card.className = 'card challenge';
    card.innerHTML = '<h3>' + (i + 1) + '. ' + t(ch.t) + '</h3><p>' + t(ch.d) + '</p>';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn go'; b.textContent = t('Cargar reto');
    b.onclick = function () {
      var c = ch.cfg;
      st.ds = c.ds; st.layers = c.layers.slice(); st.act = c.act; st.lr = c.lr; st.l2 = c.l2; st.noise = c.noise; st.mine = [];
      st.feats = {}; c.feats.forEach(function (k) { st.feats[k] = true; });
      syncUI(); regen(); reset(); setRunning(true);
      document.querySelector('.play').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    card.append(b); $('challenges').append(card);
  });

  /* ---------- arranque ---------- */
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  syncUI(); regen(); reset();
  setRunning(!reduced);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { drawNet(); drawLoss(); });
})();
