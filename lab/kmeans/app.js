/* Página de K-Means: animar asignar / mover, zonas de cada grupo, inercia y método del codo */
(function () {
  function $(id) { return document.getElementById(id); }
  // colores de las bolas de la máquina de chicles
  var COLS = ['#d9665a', '#6aa6f0', '#f2c14e', '#7cc59a', '#ef8fa8', '#9b6fd1', '#f2a03b', '#5fc9c9'];
  var RGB = COLS.map(function (h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; });
  var INIT_INFO = {
    azar: 'Elige K puntos al azar como centros. Si caen juntos, el resultado puede ser malo: pulsa «Nuevos centros» varias veces y compara.',
    pp: '<b>K-Means++</b> elige el primer centro al azar y los siguientes, preferiblemente lejos de los ya elegidos. Suele empezar mucho mejor.'
  };
  var st = { ds: 'nubes', k: 4, how: 'pp', seed: 3, pts: [], cent: [], lab: null, trails: [], iter: 0, phase: 'assign', done: false, playing: false, elbow: [] };

  function load() {
    st.pts = KM.DATASETS[st.ds](KM.rng(st.seed * 13 + st.ds.length));
    elbow(); restart();
  }
  function restart() {
    var r = KM.rng(st.seed + st.k * 101 + (st.how === 'pp' ? 7 : 0));
    st.cent = KM.init(st.pts, st.k, st.how === 'pp' ? 'pp' : 'azar', r);
    st.lab = new Int32Array(st.pts.length).fill(-1);
    st.trails = st.cent.map(function (c) { return [c.slice()]; });
    st.iter = 0; st.phase = 'assign'; st.done = false;
    draw();
  }
  /* un paso: asignar o mover, alternando */
  function step() {
    if (st.done) return;
    if (st.phase === 'assign') {
      var changed = KM.assign(st.pts, st.cent, st.lab);
      st.iter++;
      if (!changed && st.iter > 1) { st.done = true; pause(); }
      st.phase = 'update'; st.lastChanged = changed;
    } else {
      KM.update(st.pts, st.cent, st.lab);
      st.cent.forEach(function (c, j) { st.trails[j].push(c.slice()); });
      st.phase = 'assign';
    }
    draw();
  }
  var timer = 0;
  function play() { if (st.done) restart(); st.playing = true; $('run').textContent = t('❚❚ Pausar'); loop(); }
  function pause() { st.playing = false; $('run').textContent = t('▶ Agrupar'); clearTimeout(timer); }
  function loop() { if (!st.playing) return; step(); if (st.playing) timer = setTimeout(loop, 520); }

  /* ---------- dibujo ---------- */
  var cv = $('plane'), ctx = cv.getContext('2d'), S = 1, zone = document.createElement('canvas'), Z = 90;
  zone.width = zone.height = Z;
  function fit() {
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth;
    if (cv.width !== Math.round(w * dpr)) { cv.width = cv.height = Math.round(w * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); S = w;
  }
  function X(v) { return (v + 1) / 2 * S; }
  function draw() {
    fit();
    ctx.fillStyle = '#241a3d'; ctx.fillRect(0, 0, S, S);
    // zonas: a qué centro está más cerca cada sitio del plano (en cuanto hay grupos)
    if (st.iter > 0) {
      var zc = zone.getContext('2d'), im = zc.createImageData(Z, Z);
      for (var y = 0; y < Z; y++) for (var x = 0; x < Z; x++) {
        var px = (x + 0.5) / Z * 2 - 1, py = (y + 0.5) / Z * 2 - 1, best = 0, bd = Infinity;
        for (var j = 0; j < st.cent.length; j++) { var dx = px - st.cent[j][0], dy = py - st.cent[j][1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = j; } }
        var c = RGB[best % RGB.length], o = (y * Z + x) * 4, a = 0.2;
        im.data[o] = 36 + (c[0] - 36) * a; im.data[o + 1] = 26 + (c[1] - 26) * a; im.data[o + 2] = 61 + (c[2] - 61) * a; im.data[o + 3] = 255;
      }
      zc.putImageData(im, 0, 0);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(zone, 0, 0, S, S);
    }
    // rastro de cada centro
    st.trails.forEach(function (tr, j) {
      if (tr.length < 2) return;
      ctx.strokeStyle = COLS[j % COLS.length]; ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath();
      tr.forEach(function (p, i) { i ? ctx.lineTo(X(p[0]), X(p[1])) : ctx.moveTo(X(p[0]), X(p[1])); }); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    });
    // puntos (grises hasta que se asignan)
    st.pts.forEach(function (p, i) {
      ctx.beginPath(); ctx.arc(X(p[0]), X(p[1]), 4, 0, Math.PI * 2);
      ctx.fillStyle = st.lab[i] >= 0 ? COLS[st.lab[i] % COLS.length] : '#a59fc0'; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#120b1c'; ctx.stroke();
    });
    // centros: bolas de chicle grandes con brillo
    st.cent.forEach(function (c, j) {
      var x = X(c[0]), y = X(c[1]);
      ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fillStyle = '#120b1c'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 8.5, 0, Math.PI * 2); ctx.fillStyle = COLS[j % COLS.length]; ctx.fill();
      ctx.beginPath(); ctx.arc(x - 3, y - 3, 2.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
    });
    info();
  }
  function info() {
    var assigned = st.lab[0] >= 0, I = assigned ? KM.inertia(st.pts, st.cent, st.lab) : null;
    $('iter').textContent = st.iter;
    $('inertia').textContent = I === null ? '–' : tnum(I, 2);
    $('kshow').textContent = st.k;
    $('phase').innerHTML = st.done ? t('<b>Terminado:</b> ningún punto ha cambiado de grupo.')
      : st.iter === 0 ? t(st.how === 'pp' ? 'Los centros empiezan con K-Means++. Dale a <b>Agrupar</b> o a <b>Un paso</b>.' : 'Los centros empiezan al azar. Dale a <b>Agrupar</b> o a <b>Un paso</b>.')
        : st.phase === 'update' ? t('Paso 1 · <b>asignar</b>: cada punto se va con su centro más cercano') + (st.lastChanged ? t(' ({0} han cambiado)', st.lastChanged) : '') + '.'
          : t('Paso 2 · <b>mover</b>: cada centro va al punto medio de su grupo.');
    var counts = st.cent.map(function () { return 0; }); if (assigned) for (var i = 0; i < st.lab.length; i++) counts[st.lab[i]]++;
    $('groups').innerHTML = st.cent.map(function (_, j) { return '<span style="background:' + COLS[j % COLS.length] + '">' + (assigned ? counts[j] : '·') + '</span>'; }).join('');
    drawElbow(); hint();
  }
  function hint() {
    var h;
    if (st.ds === 'anillos' && st.done) h = 'K-Means ha partido el anillo en trozos: solo sabe hacer grupos redondos alrededor de un centro. Para formas así hacen falta otros métodos (como DBSCAN).';
    else if (st.ds === 'alargadas' && st.done) h = 'Con nubes alargadas, los grupos redondos de K-Means se quedan cortos y mezclan trozos de varias. Mira las zonas de color.';
    else if (st.ds === 'distintas' && st.done) h = 'Con grupos de tamaños tan distintos, K-Means tiende a partir el grande en varios trozos y juntar los pequeños.';
    else if (st.ds === 'azar' && st.done) h = 'Aquí no hay grupos de verdad, pero K-Means siempre encuentra K: cuidado con creerse cualquier agrupación.';
    else if (st.done && st.ds === 'nubes') h = st.k === 4 ? '¡Perfecto! Cuatro nubes, cuatro grupos. Fíjate en el codo de la gráfica: está justo en K = 4.' : 'Ha terminado, pero hay 4 nubes. ¿Qué pasa con K = {0}? Prueba K = 4 y mira el codo.';
    else if (st.done) h = 'Ha terminado. Prueba otro K o «Nuevos centros» para ver si el resultado cambia.';
    else h = 'Cada ronda tiene dos pasos: asignar los puntos y mover los centros. Mira cómo los centros van dejando un rastro hasta quedarse quietos.';
    h = t(h, st.k);
    if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
  }

  /* ---------- método del codo ---------- */
  var KS = [1, 2, 3, 4, 5, 6, 7, 8], ec = $('elbow'), ex = ec.getContext('2d'), ePts = [];
  function elbow() { st.elbow = KS.map(function (k) { return KM.run(st.pts, k, 'pp', 11, 3); }); }
  function drawElbow() {
    var dpr = window.devicePixelRatio || 1, W = ec.clientWidth, H = ec.clientHeight;
    if (ec.width !== Math.round(W * dpr)) { ec.width = Math.round(W * dpr); ec.height = Math.round(H * dpr); }
    ex.setTransform(dpr, 0, 0, dpr, 0, 0); ex.clearRect(0, 0, W, H);
    var ml = 12, mr = 12, mt = 12, mb = 24, mx = Math.max.apply(null, st.elbow) || 1;
    ex.font = '15px "Jersey 20", monospace'; ex.textAlign = 'center'; ex.fillStyle = '#a59fc0';
    ePts = KS.map(function (k, i) { return [ml + i / (KS.length - 1) * (W - ml - mr), mt + (1 - st.elbow[i] / mx) * (H - mt - mb)]; });
    ex.strokeStyle = '#9c8ad6'; ex.lineWidth = 2; ex.beginPath();
    ePts.forEach(function (p, i) { i ? ex.lineTo(p[0], p[1]) : ex.moveTo(p[0], p[1]); }); ex.stroke();
    ePts.forEach(function (p, i) {
      var sel = KS[i] === st.k;
      ex.fillStyle = sel ? '#f2c66d' : '#f3eedc'; ex.fillRect(p[0] - (sel ? 5 : 3), p[1] - (sel ? 5 : 3), sel ? 10 : 6, sel ? 10 : 6);
      ex.fillStyle = sel ? '#f2c66d' : '#a59fc0'; ex.fillText(KS[i], p[0], H - 6);
    });
  }
  ec.addEventListener('click', function (e) {
    var r = ec.getBoundingClientRect(), x = e.clientX - r.left, best = 0;
    ePts.forEach(function (p, i) { if (Math.abs(p[0] - x) < Math.abs(ePts[best][0] - x)) best = i; });
    st.k = KS[best]; seg('k', st.k); pause(); restart(); play();
  });

  /* ---------- controles ---------- */
  function seg(group, v) { document.querySelectorAll('[data-group="' + group + '"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === String(v))); }); }
  document.querySelectorAll('[data-group] button').forEach(function (b) {
    b.addEventListener('click', function () {
      var g = b.parentElement.dataset.group, v = b.dataset.v;
      pause();
      if (g === 'ds') { st.ds = v; load(); }
      if (g === 'k') { st.k = +v; restart(); }
      if (g === 'init') { st.how = v; $('initinfo').innerHTML = t(INIT_INFO[v]); restart(); }
      seg(g, v); play();
    });
  });
  cv.addEventListener('click', function (e) {
    var r = cv.getBoundingClientRect();
    st.pts.push([(e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1]);
    var lab = new Int32Array(st.pts.length).fill(-1); lab.set(st.lab); st.lab = lab;
    if (st.lab[0] >= 0) KM.assign(st.pts, st.cent, st.lab);
    st.done = false; elbow(); draw();
  });
  $('run').onclick = function () { if (st.playing) pause(); else play(); };
  $('step').onclick = function () { pause(); step(); };
  $('reset').onclick = function () { pause(); st.seed = Math.floor(Math.random() * 1e6); restart(); };
  window.addEventListener('resize', draw);

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

  /* ---------- arranque ---------- */
  seg('ds', st.ds); seg('k', st.k); seg('init', st.how); $('initinfo').innerHTML = t(INIT_INFO[st.how]);
  load();
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) play();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
