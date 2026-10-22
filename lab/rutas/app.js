/* Página de rutas: editar el mapa, animar la búsqueda paso a paso y comparar A*, Dijkstra y voraz */
(function () {
  function $(id) { return document.getElementById(id); }
  var COLS = 33, ROWS = 19, N = COLS * ROWS, NAMES = { astar: 'A*', dijkstra: 'Dijkstra', greedy: t('Voraz') };
  var INFO = {
    astar: '<b>A*</b> explora primero lo que menos suma <b>g + h</b>: lo recorrido más lo que falta. Exacto y eficiente.',
    dijkstra: '<b>Dijkstra</b> explora primero lo más cercano a A (solo <b>g</b>). Siempre da el mejor camino, pero mira hacia todos lados.',
    greedy: '<b>Voraz</b> va hacia lo que parece más cerca de B (solo <b>h</b>). Muy rápida, pero no garantiza el mejor camino.'
  };
  var st = { cells: new Uint8Array(N), a: 2 * COLS + 2, b: 14 * COLS + 29, algo: 'astar', tool: 1, diag: false, speed: 4,
    res: null, shown: 0, playing: false, drag: null, painting: false };

  /* ---------- mapas ---------- */
  var seed = 1;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function setMap(kind) {
    var c = st.cells, x, y;
    c.fill(0);
    if (kind === 'ejemplo') {
      for (y = 1; y < 16; y++) if (y !== 6 && y !== 7) c[y * COLS + 11] = 1;
      for (y = 3; y < ROWS; y++) if (y !== 12) c[y * COLS + 21] = 1;
      for (x = 3; x < 11; x++) c[10 * COLS + x] = 1;
      for (x = 22; x < 30; x++) c[8 * COLS + x] = 1;
      for (y = 5; y < 9; y++) for (x = 12; x < 21; x++) c[y * COLS + x] = 2;
      for (y = 11; y < 16; y++) for (x = 13; x < 18; x++) c[y * COLS + x] = 2;
      st.a = 2 * COLS + 2; st.b = 14 * COLS + 29;
    } else if (kind === 'laberinto') {
      seed = Math.floor(Math.random() * 1e6) + 1; st.cells = c = Paths.maze(COLS, ROWS, rnd);
      st.a = COLS + 1; st.b = (ROWS - 2) * COLS + COLS - 2;
    } else if (kind === 'azar') {
      seed = Math.floor(Math.random() * 1e6) + 1;
      for (var i = 0; i < N; i++) { var v = rnd(); c[i] = v < 0.24 ? 1 : v < 0.32 ? 2 : 0; }
    }
    st.cells[st.a] = 0; st.cells[st.b] = 0; st.map = kind;
    recompute(true);
  }

  /* ---------- búsqueda ---------- */
  var all = {};
  function recompute(fromStart) {
    ['astar', 'dijkstra', 'greedy'].forEach(function (a) { all[a] = Paths.solve(st.cells, COLS, ROWS, st.a, st.b, a, st.diag); });
    st.res = all[st.algo];
    st.shown = fromStart ? 0 : st.res.steps;
    table(); draw();
  }
  function play() {
    if (st.shown >= st.res.steps) st.shown = 0;
    st.playing = true; $('run').textContent = t('❚❚ Pausar'); tick();
  }
  function pause() { st.playing = false; $('run').textContent = t('▶ Buscar'); }
  function tick() {
    if (!st.playing) return;
    st.shown = Math.min(st.res.steps, st.shown + st.speed);
    draw();
    if (st.shown >= st.res.steps) { pause(); return; }
    requestAnimationFrame(tick);
  }

  /* ---------- dibujo ---------- */
  var cv = $('map'), ctx = cv.getContext('2d'), CELL = 1;
  function fit() {
    var dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = Math.round(W * ROWS / COLS);
    cv.style.height = H + 'px';
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); CELL = W / COLS;
  }
  function rect(i, pad) { return [(i % COLS) * CELL + pad, ((i / COLS) | 0) * CELL + pad, CELL - 2 * pad, CELL - 2 * pad]; }
  function draw() {
    fit();
    var r = st.res, k = st.shown, i, q, W = COLS * CELL, H = ROWS * CELL;
    ctx.fillStyle = '#2f2450'; ctx.fillRect(0, 0, W, H);
    for (i = 0; i < N; i++) if (st.cells[i] === 2) { q = rect(i, 0); ctx.fillStyle = '#8a5a32'; ctx.fillRect(q[0], q[1], q[2], q[3]); ctx.fillStyle = '#6b4428'; ctx.fillRect(q[0] + CELL * 0.2, q[1] + CELL * 0.55, CELL * 0.25, CELL * 0.15); }
    // exploradas (más claras las primeras) y frontera
    for (i = 0; i < N; i++) {
      var sh = r.shut[i], se = r.seen[i];
      if (sh >= 0 && sh < k) { q = rect(i, 1); ctx.fillStyle = 'rgba(106,166,240,' + (0.3 + 0.35 * sh / Math.max(1, r.steps)) + ')'; ctx.fillRect(q[0], q[1], q[2], q[3]); }
      else if (se >= 0 && se <= k && i !== st.a) { q = rect(i, 3); ctx.strokeStyle = '#f2c66d'; ctx.lineWidth = 2; ctx.strokeRect(q[0], q[1], q[2], q[3]); }   // frontera: recuadro
    }
    // casilla que se está mirando ahora
    if (k > 0 && k <= r.order.length && k < r.steps) { q = rect(r.order[k - 1], 1); ctx.strokeStyle = '#f3eedc'; ctx.lineWidth = 2; ctx.strokeRect(q[0], q[1], q[2], q[3]); }
    // muros con un poco de relieve
    for (i = 0; i < N; i++) if (st.cells[i] === 1) {
      q = rect(i, 0); ctx.fillStyle = '#0b0716'; ctx.fillRect(q[0], q[1], q[2] + 0.5, q[3] + 0.5);
      ctx.fillStyle = '#2a1f4f'; ctx.fillRect(q[0], q[1], q[2] + 0.5, Math.max(2, CELL * 0.15));
    }
    // rejilla
    ctx.strokeStyle = 'rgba(165,159,192,.10)'; ctx.lineWidth = 1; ctx.beginPath();
    for (i = 1; i < COLS; i++) { ctx.moveTo(Math.round(i * CELL) + 0.5, 0); ctx.lineTo(Math.round(i * CELL) + 0.5, H); }
    for (i = 1; i < ROWS; i++) { ctx.moveTo(0, Math.round(i * CELL) + 0.5); ctx.lineTo(W, Math.round(i * CELL) + 0.5); }
    ctx.stroke();
    // camino, al terminar
    if (r.found && k >= r.steps) {
      ctx.strokeStyle = '#7cc59a'; ctx.lineWidth = Math.max(3, CELL * 0.28); ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath();
      r.path.forEach(function (c, j) { var x = (c % COLS + 0.5) * CELL, y = (((c / COLS) | 0) + 0.5) * CELL; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    // A y B
    [[st.a, 'A', '#3f9a68'], [st.b, 'B', '#f2a03b']].forEach(function (m) {
      q = rect(m[0], 1); ctx.fillStyle = '#120b1c'; ctx.fillRect(q[0], q[1], q[2], q[3]);
      ctx.fillStyle = m[2]; ctx.fillRect(q[0] + 2, q[1] + 2, q[2] - 4, q[3] - 4);
      ctx.fillStyle = '#120b1c'; ctx.font = Math.round(CELL * 0.75) + 'px "Jersey 20", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m[1], q[0] + q[2] / 2, q[1] + q[3] / 2 + 1);
    });
    $('explored').textContent = Math.min(k, r.steps);
    hint();
  }

  /* ---------- tabla y pistas ---------- */
  function fmt(v) { var s = (Math.round(v * 10) / 10).toString(); return Number.isFinite(v) ? (LANG === 'en' ? s : s.replace('.', ',')) : t('sin ruta'); }
  function table() {
    var free = 0; for (var i = 0; i < N; i++) if (st.cells[i] !== 1) free++;
    $('rows').innerHTML = ['astar', 'dijkstra', 'greedy'].map(function (a) {
      var r = all[a], pct = r.steps / free * 100;
      return '<tr' + (a === st.algo ? ' class="sel"' : '') + '><td>' + NAMES[a] + '</td><td><span class="meter"><i style="width:' + pct.toFixed(1) + '%"></i></span>' + r.steps + '</td><td>' + fmt(r.cost) + '</td></tr>';
    }).join('');
  }
  function hint() {
    var a = all.astar, d = all.dijkstra, g = all.greedy, h;
    if (!d.found) h = t('No hay forma de llegar de A a B: quita algún muro.');
    else if (st.shown < st.res.steps) h = t('Buscando… en cada paso saca de la frontera la casilla más prometedora (según {0}), la marca como explorada y añade sus vecinas.', st.algo === 'astar' ? 'g + h' : st.algo === 'dijkstra' ? 'g' : 'h');
    else {
      h = t('A* ha explorado {0} casillas y Dijkstra {1}, para el mismo coste ({2}).', a.steps, d.steps, fmt(a.cost));
      if (g.found && g.cost > a.cost + 1e-6) h += t(' La voraz solo ha mirado {0}, pero su camino cuesta {1}: más rápida, peor ruta.', g.steps, fmt(g.cost));
      else if (g.found) h += t(st.map === 'laberinto' ? ' La voraz ha acertado esta vez con solo {0} casillas, pero no siempre pasa: prueba otro laberinto.' : ' La voraz ha acertado esta vez con solo {0} casillas, pero no siempre pasa: prueba un laberinto.', g.steps);
    }
    if ($('hint').innerHTML !== h) $('hint').innerHTML = h;
  }

  /* ---------- ratón: pintar, arrastrar A/B y mirar números ---------- */
  function cellAt(e) {
    var r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * COLS), y = Math.floor((e.clientY - r.top) / r.height * ROWS);
    return x < 0 || y < 0 || x >= COLS || y >= ROWS ? -1 : y * COLS + x;
  }
  function paint(i) {
    if (i < 0 || i === st.a || i === st.b || st.cells[i] === st.tool) return false;
    st.cells[i] = st.tool; return true;
  }
  cv.addEventListener('pointerdown', function (e) {
    var i = cellAt(e); if (i < 0) return;
    cv.setPointerCapture(e.pointerId); pause();
    if (i === st.a) st.drag = 'a'; else if (i === st.b) st.drag = 'b';
    else { st.painting = true; if (paint(i)) recompute(false); }
  });
  cv.addEventListener('pointermove', function (e) {
    var i = cellAt(e);
    if (st.drag && i >= 0 && st.cells[i] !== 1 && i !== st.a && i !== st.b) { st[st.drag] = i; recompute(false); }
    else if (st.painting && paint(i)) recompute(false);
    probe(i);
  });
  cv.addEventListener('pointerup', function () { st.drag = null; st.painting = false; });
  cv.addEventListener('pointerleave', function () { probe(-1); });
  function probe(i) {
    var r = st.res, p = $('probe');
    if (i < 0) { p.textContent = t('Pasa el ratón por una casilla explorada para ver sus números.'); return; }
    var x = i % COLS, y = (i / COLS) | 0, what = t(st.cells[i] === 1 ? 'muro' : st.cells[i] === 2 ? 'barro' : 'suelo');
    if (r.shut[i] >= 0 && r.shut[i] < st.shown) p.innerHTML = t('Casilla ({0}, {1}), {2}:', x, y, what) + ' <b>g = ' + fmt(r.g[i]) + '</b> ' + t('(recorrido)') + ' · <b>h = ' + fmt(r.h[i]) + '</b> ' + t('(falta)') + ' · <b>f = ' + fmt(r.g[i] + r.h[i]) + '</b>';
    else p.textContent = t('Casilla ({0}, {1}), {2}', x, y, what) + (st.cells[i] === 1 ? '' : t(': todavía sin explorar.'));
  }

  /* ---------- controles ---------- */
  function seg(group, v) { document.querySelectorAll('[data-group="' + group + '"] button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === String(v))); }); }
  document.querySelectorAll('[data-group] button').forEach(function (b) {
    b.addEventListener('click', function () {
      var g = b.parentElement.dataset.group, v = b.dataset.v;
      if (g === 'algo') { st.algo = v; st.res = all[v]; st.shown = 0; $('algoinfo').innerHTML = t(INFO[v]); table(); play(); }
      if (g === 'tool') st.tool = +v;
      if (g === 'speed') st.speed = +v;
      if (g === 'map') { pause(); setMap(v); play(); }
      seg(g, g === 'map' ? null : v);
    });
  });
  $('diag').addEventListener('change', function (e) { st.diag = e.target.checked; recompute(true); play(); });
  $('run').onclick = function () { if (st.playing) pause(); else play(); };
  $('step').onclick = function () { pause(); if (st.shown >= st.res.steps) st.shown = 0; st.shown++; draw(); };
  $('instant').onclick = function () { pause(); st.shown = st.res.steps; draw(); };
  window.addEventListener('resize', draw);
  $('mud').textContent = Paths.MUD;

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
  seg('algo', st.algo); seg('tool', st.tool); seg('speed', st.speed); $('algoinfo').innerHTML = t(INFO[st.algo]);
  setMap('ejemplo');
  if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) play(); else { st.shown = st.res.steps; draw(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
