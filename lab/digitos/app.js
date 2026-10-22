/* Página de dígitos: pizarra, predicción en directo, lo que ve cada filtro y el informe de entrenamiento */
(function () {
  function $(id) { return document.getElementById(id); }
  var REP = CNN.report, BLUE = [106, 166, 240], ORANGE = [242, 160, 59];
  function dec(v, d) { var s = v.toFixed(d); return LANG === 'en' ? s : s.replace('.', ','); }
  var LOC = LANG === 'en' ? 'en-GB' : 'es-ES';

  /* ---------- pizarra ---------- */
  var pad = $('pad'), pctx = pad.getContext('2d', { willReadFrequently: true }), drawing = false, last = null, dirty = false;
  (function grid() {                                                     // cuadrícula de 28 x 28 de fondo
    var g = $('grid').getContext('2d'); g.strokeStyle = 'rgba(165,159,192,.12)'; g.lineWidth = 1;
    for (var i = 1; i < 28; i++) { var p = Math.round(i * 10) + 0.5; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 280); g.moveTo(0, p); g.lineTo(280, p); g.stroke(); }
  })();
  function at(e) { var r = pad.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * pad.width, (e.clientY - r.top) / r.height * pad.height]; }
  function stroke(a, b) {
    pctx.strokeStyle = '#f3eedc'; pctx.lineWidth = 19; pctx.lineCap = pctx.lineJoin = 'round';
    pctx.beginPath(); pctx.moveTo(a[0], a[1]); pctx.lineTo(b[0], b[1]); pctx.stroke();
  }
  pad.addEventListener('pointerdown', function (e) {
    drawing = true; pad.setPointerCapture(e.pointerId); last = at(e); stroke(last, [last[0] + 0.1, last[1]]);
    $('padHint').style.opacity = 0; dirty = true; schedule();
  });
  pad.addEventListener('pointermove', function (e) { if (!drawing) return; var p = at(e); stroke(last, p); last = p; dirty = true; schedule(); });
  pad.addEventListener('pointerup', function () { drawing = false; schedule(); });
  pad.addEventListener('pointercancel', function () { drawing = false; });
  $('clear').addEventListener('click', function () { pctx.clearRect(0, 0, 280, 280); $('padHint').style.opacity = 1; show(null); });

  // se predice como mucho cada 60 ms mientras se dibuja
  var timer = 0;
  function schedule() { if (timer) return; timer = setTimeout(function () { timer = 0; if (dirty) { dirty = false; show(CNN.preprocess(pad)); } }, 60); }

  /* ejemplos de MNIST */
  REP.samples.slice().sort(function (a, b) { return a.label - b.label; }).forEach(function (s) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = s.label; b.setAttribute('aria-label', t('Cargar un ejemplo del {0}', s.label));
    b.onclick = function () {
      var t = document.createElement('canvas'); t.width = t.height = 28;
      var tc = t.getContext('2d'), im = tc.createImageData(28, 28);
      for (var k = 0; k < 784; k++) { im.data[k * 4] = 243; im.data[k * 4 + 1] = 238; im.data[k * 4 + 2] = 220; im.data[k * 4 + 3] = s.img[k]; }
      tc.putImageData(im, 0, 0);
      pctx.clearRect(0, 0, 280, 280); pctx.imageSmoothingEnabled = true; pctx.imageSmoothingQuality = 'high'; pctx.drawImage(t, 0, 0, 280, 280);
      $('padHint').style.opacity = 0; show(CNN.fromBytes(s.img));
    };
    $('samples').append(b);
  });

  /* ---------- resultado ---------- */
  var bars = [];
  for (var d = 0; d < 10; d++) {
    var row = document.createElement('div'); row.className = 'bar';
    row.innerHTML = '<span>' + d + '</span><div class="track"><div class="fill" style="width:0"></div></div><span class="pct">–</span>';
    $('bars').append(row); bars.push(row);
  }
  function paint(cv, data, off, W, H, max) {                              // un mapa en escala de crema sobre negro
    var c = cv.getContext('2d'), im = c.createImageData(W, H);
    for (var i = 0; i < W * H; i++) {
      var v = Math.min(1, data[off + i] / (max || 1)), o = i * 4;
      im.data[o] = 243 * v; im.data[o + 1] = 238 * v; im.data[o + 2] = 220 * v; im.data[o + 3] = 255;
    }
    c.putImageData(im, 0, 0);
  }
  function show(img) {
    if (!img) {
      $('big').textContent = '?'; $('verdict').textContent = t('Todavía no hay nada dibujado.');
      bars.forEach(function (r) { r.className = 'bar'; r.querySelector('.fill').style.width = 0; r.querySelector('.pct').textContent = '–'; });
      $('seen').getContext('2d').clearRect(0, 0, 28, 28); inside(null); return;
    }
    var o = CNN.forward(img), best = 0;
    for (var k = 1; k < 10; k++) if (o.probs[k] > o.probs[best]) best = k;
    var p = o.probs[best];
    $('big').textContent = best;
    $('verdict').innerHTML = '<b>' + t('{0} % seguro', Math.round(p * 100)) + '</b><br>' +
      (p > 0.9 ? t('Lo tiene bastante claro.') : p > 0.6 ? t('Cree que es un {0}, aunque duda un poco.', best) : t('Duda mucho: prueba a dibujarlo más claro o más grande.'));
    bars.forEach(function (r, k) {
      r.className = 'bar' + (k === best ? ' top' : '');
      r.querySelector('.fill').style.width = (o.probs[k] * 100).toFixed(1) + '%';
      r.querySelector('.pct').textContent = (o.probs[k] < 0.005 ? '0' : dec(o.probs[k] * 100, o.probs[k] < 0.1 ? 1 : 0)) + ' %';
    });
    paint($('seen'), img, 0, 28, 28, 1);
    inside(o);
  }

  /* ---------- por dentro: filtros y mapas ---------- */
  var k1 = [], m1 = [], m2 = [];
  CNN.filters1().forEach(function (f, i) {
    var box = document.createElement('div'); box.className = 'fmap';
    var kc = document.createElement('canvas'); kc.width = kc.height = 3; kc.className = 'k';
    var mc = document.createElement('canvas'); mc.width = mc.height = 28; mc.className = 'm';
    var mx = Math.max.apply(null, Array.from(f).map(Math.abs)), c = kc.getContext('2d'), im = c.createImageData(3, 3);
    for (var j = 0; j < 9; j++) {                                          // pesos: azul positivo, naranja negativo
      var v = f[j] / mx, col = v >= 0 ? BLUE : ORANGE, a = Math.abs(v), o = j * 4;
      im.data[o] = 26 + (col[0] - 26) * a; im.data[o + 1] = 17 + (col[1] - 17) * a; im.data[o + 2] = 48 + (col[2] - 48) * a; im.data[o + 3] = 255;
    }
    c.putImageData(im, 0, 0);
    var pair = document.createElement('div'); pair.className = 'pair'; pair.append(kc, mc);
    var lab = document.createElement('span'); lab.textContent = t('Filtro {0}', i + 1);
    box.append(pair, lab); $('layer1').append(box); m1.push(mc);
  });
  for (var q = 0; q < 16; q++) { var c2 = document.createElement('canvas'); c2.width = c2.height = 14; c2.title = t('Filtro {0} de la capa 2', q + 1); $('layer2').append(c2); m2.push(c2); }
  function inside(o) {
    if (!o) { m1.concat(m2).forEach(function (c) { c.getContext('2d').clearRect(0, 0, c.width, c.height); }); return; }
    var mx1 = Math.max.apply(null, o.a1) || 1, mx2 = Math.max.apply(null, o.a2) || 1;
    m1.forEach(function (c, k) { paint(c, o.a1, k * 784, 28, 28, mx1); });
    m2.forEach(function (c, k) { paint(c, o.a2, k * 196, 14, 14, mx2); });
  }

  /* ---------- cómo aprendió ---------- */
  $('repcap').textContent = t('Se entrenó con {0} imágenes de MNIST (dígitos escritos a mano) durante {1} épocas, con pequeños giros y desplazamientos para que aguante dibujos hechos con el ratón. Tiene {2} parámetros y acierta el {3} % de {4} imágenes que nunca vio.',
    REP.n_train.toLocaleString(LOC), REP.epochs, REP.n_params.toLocaleString(LOC), dec(REP.test_acc * 100, 1), REP.n_test.toLocaleString(LOC));
  function fit(cv) {
    var dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return [c, W, H];
  }
  function curves() {
    var f = fit($('curves')), c = f[0], W = f[1], H = f[2], ml = 34, mb = 22, mt = 10, mr = 10;
    var tr = REP.history.train_loss, te = REP.history.test_loss, n = tr.length, mx = Math.ceil(Math.max.apply(null, tr.concat(te)) * 10) / 10;
    c.font = '14px "Jersey 20", monospace'; c.fillStyle = '#a59fc0'; c.strokeStyle = '#4b3677'; c.lineWidth = 1;
    for (var g = 0; g <= 4; g++) {
      var y = Math.round(mt + (H - mt - mb) * g / 4) + 0.5; c.beginPath(); c.moveTo(ml, y); c.lineTo(W - mr, y); c.stroke();
      c.textAlign = 'right'; c.fillText(dec(mx * (1 - g / 4), 1), ml - 6, y + 4);
    }
    c.textAlign = 'center';
    [1, Math.round(n / 3), Math.round(2 * n / 3), n].forEach(function (e) { c.fillText(e, ml + (e - 1) / (n - 1) * (W - ml - mr), H - 6); });
    function line(arr, col) {
      c.beginPath(); c.strokeStyle = col; c.lineWidth = 2;
      arr.forEach(function (v, i) { var x = ml + i / (n - 1) * (W - ml - mr), yy = mt + (1 - v / mx) * (H - mt - mb); i ? c.lineTo(x, yy) : c.moveTo(x, yy); });
      c.stroke();
    }
    line(te, '#e88aa0'); line(tr, '#7cc59a');
  }
  function confusion() {
    var f = fit($('conf')), c = f[0], S = f[1], off = 20, cell = (S - off) / 10;
    c.font = '14px "Jersey 20", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (var r = 0; r < 10; r++) {
      var tot = REP.confusion[r].reduce(function (a, b) { return a + b; }, 0);
      c.fillStyle = '#a59fc0'; c.fillText(r, off + r * cell + cell / 2, 9); c.fillText(r, 9, off + r * cell + cell / 2);
      for (var k = 0; k < 10; k++) {
        var v = REP.confusion[r][k], x = off + k * cell, y = off + r * cell, ok = r === k;
        c.fillStyle = '#1a1130'; c.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        if (!v) continue;
        var col = ok ? [124, 197, 154] : ORANGE, a = ok ? 0.25 + 0.7 * v / tot : 0.4 + 0.6 * Math.min(1, v / 3);
        c.fillStyle = 'rgba(' + col.join(',') + ',' + a + ')'; c.fillRect(x + 1, y + 1, cell - 2, cell - 2);
        c.fillStyle = '#120b1c'; c.fillText(v, x + cell / 2, y + cell / 2 + 1);
      }
    }
  }
  REP.fails.forEach(function (fl) {
    var fig = document.createElement('figure'), cv = document.createElement('canvas'); cv.width = cv.height = 28;
    paint(cv, Float32Array.from(fl.img, function (v) { return v / 255; }), 0, 28, 28, 1);
    var cap = document.createElement('figcaption'); cap.innerHTML = t('era un <b>{0}</b><br>dijo <b>{1}</b>', fl.true, fl.pred);
    fig.append(cv, cap); $('fails').append(fig);
  });
  function report() { curves(); confusion(); }
  report();
  window.addEventListener('resize', report);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(report);

  // para empezar, un ejemplo cargado
  var seven = $('samples').querySelectorAll('button')[7]; if (seven) seven.click();

  /* ---------- volver ---------- */
  $('back').addEventListener('click', function (e) {
    if (window.parent !== window) { e.preventDefault(); parent.postMessage('viewer:close', location.origin); return; }
    if (document.referrer && document.referrer.indexOf(location.origin) === 0 && history.length > 1) { e.preventDefault(); history.back(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && window.parent !== window) parent.postMessage('viewer:close', location.origin); });
  if (window.parent !== window) document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (a && a.id !== 'back' && a.target !== '_blank' && a.origin === location.origin) { e.preventDefault(); location.replace(a.href); }
  });
})();
