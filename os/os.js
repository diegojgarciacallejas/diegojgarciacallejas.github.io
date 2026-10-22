/* DiegOS: el escritorio. Ventanas que se arrastran, minimizan, maximizan y cambian de tamaño,
   barra de tareas con menú de inicio y reloj, y las aplicaciones pequeñas (Archivos, Notas, Contacto).
   Las páginas de la web (expediente, laboratorio, piezas) se abren dentro de una ventana. */
var OS = (function () {
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var desk = $('desk'), tasks = $('tasks'), wins = [], z = 10, count = 0, active = null;
  function small() { return desk.clientWidth < 720; }

  /* ---- ventanas ---- */
  function open(id, arg) {
    var A = APPS[id]; if (!A) return null;
    if (!A.multi) { var same = wins.filter(function (w) { return w.app === id; })[0]; if (same) { show(same); return same; } }
    var w = { app: id, el: el('section', 'win'), task: el('button', 'task') };
    var bar = el('header', 'wbar'), ico = el('img'), title = el('span', 'wtitle', A.title), btns = el('div', 'wbtns');
    ico.src = iconURL(A.icon, A.swap); ico.alt = '';
    [['min', '–', 'Minimizar'], ['max', '□', 'Maximizar'], ['close', '✕', 'Cerrar']].forEach(function (b) {
      var x = el('button', 'wb ' + b[0], b[1]); x.type = 'button'; x.title = b[2]; x.setAttribute('aria-label', b[2]);
      x.addEventListener('click', function (e) { e.stopPropagation(); ({ min: minimize, max: maximize, close: close })[b[0]](w); });
      btns.append(x);
    });
    bar.append(ico, title, btns);
    var body = el('div', 'wbody');
    w.el.append(bar, body); w.el.setAttribute('role', 'dialog'); w.el.setAttribute('aria-label', A.title);
    w.title = title;
    // tamaño y sitio: en cascada, sin salirse del escritorio
    var dw = desk.clientWidth, dh = desk.clientHeight, ww = Math.min(A.w, dw - 24), wh = Math.min(A.h, dh - 24);
    var off = (count++ % 6) * 28;
    w.el.style.width = ww + 'px'; w.el.style.height = wh + 'px';
    w.el.style.left = Math.max(8, Math.min(dw - ww - 8, (dw - ww) / 2 - 80 + off)) + 'px';
    w.el.style.top = Math.max(8, Math.min(dh - wh - 8, (dh - wh) / 2 - 60 + off)) + 'px';
    if (small()) w.el.classList.add('max');
    desk.append(w.el); wins.push(w);
    // contenido
    if (A.kind === 'frame') {
      var f = el('iframe'); f.title = A.title; f.src = A.url; body.append(f); w.frame = f;
    } else if (A.kind === 'term') { w.term = new Terminal(body, api, w); }
    else if (A.kind === 'files') files(w, body, arg || HOME);
    else if (A.kind === 'text') notes(w, body, arg);
    else if (A.kind === 'contact') contact(body);
    else if (A.kind === 'calc') calculator(w, body);
    else if (A.kind === 'settings') settings(body);
    // barra de tareas
    var ti = el('img'); ti.src = ico.src; ti.alt = ''; w.task.type = 'button'; w.task.append(ti, el('span', null, A.title));
    w.task.addEventListener('click', function () { if (active === w && !w.el.hidden) minimize(w); else show(w); });
    tasks.append(w.task);
    drag(w, bar);
    bar.addEventListener('dblclick', function (e) { if (!e.target.closest('.wb')) maximize(w); });
    w.el.addEventListener('pointerdown', function () { focus(w); });
    focus(w);
    if (w.term) setTimeout(function () { w.term.input.focus(); }, 30);
    return w;
  }
  function focus(w) {
    if (active === w) return;
    active = w; w.el.style.zIndex = ++z;
    wins.forEach(function (x) { x.el.classList.toggle('on', x === w); x.task.classList.toggle('on', x === w); });
  }
  function show(w) { w.el.hidden = false; focus(w); if (w.term) w.term.input.focus(); else if (w.frame) w.frame.focus(); }
  function minimize(w) { w.el.hidden = true; w.task.classList.remove('on'); if (active === w) { active = null; topmost(); } }
  function maximize(w) { w.el.classList.toggle('max'); }
  function close(w) {
    w.el.remove(); w.task.remove(); wins = wins.filter(function (x) { return x !== w; });
    if (active === w) { active = null; topmost(); }
  }
  // al cerrar o minimizar, pasa al frente la siguiente ventana visible
  function topmost() {
    var vis = wins.filter(function (x) { return !x.el.hidden; }).sort(function (a, b) { return b.el.style.zIndex - a.el.style.zIndex; });
    if (vis[0]) show(vis[0]);
  }
  // arrastrar por la barra de título (los marcos no se tragan el ratón mientras tanto)
  function drag(w, bar) {
    var sx, sy, ox, oy, on = false;
    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.wb') || w.el.classList.contains('max') || e.button !== 0) return;
      on = true; sx = e.clientX; sy = e.clientY; ox = w.el.offsetLeft; oy = w.el.offsetTop;
      bar.setPointerCapture(e.pointerId); document.body.classList.add('dragging');
    });
    bar.addEventListener('pointermove', function (e) {
      if (!on) return;
      var x = ox + e.clientX - sx, y = oy + e.clientY - sy;
      w.el.style.left = Math.max(-w.el.offsetWidth + 80, Math.min(desk.clientWidth - 80, x)) + 'px';
      w.el.style.top = Math.max(0, Math.min(desk.clientHeight - 32, y)) + 'px';
    });
    function stop() { on = false; document.body.classList.remove('dragging'); }
    bar.addEventListener('pointerup', stop); bar.addEventListener('pointercancel', stop);
  }

  /* ---- abrir lo que hay en una ruta: carpeta → Archivos, app → la app, texto → Notas, enlace → otra pestaña ---- */
  function openPath(abs) {
    var n = FSX.get(abs); if (!n) return;
    if (n.type === 'dir') open('archivos', abs);
    else if (n.type === 'app') open(n.app);
    else if (n.type === 'link') window.open(n.url, '_blank', 'noopener');
    else if (n.type === 'file' && !n.locked) open('notas', abs);
  }

  /* ---- Archivos ---- */
  function files(w, body, start) {
    var cwd = start, top = el('div', 'ftop'), up = el('button', 'btn', '↑ Arriba'), path = el('span', 'fpath'), grid = el('div', 'fgrid');
    up.type = 'button'; top.append(up, path); body.append(top, grid); body.classList.add('files');
    up.addEventListener('click', function () { go(FSX.parent(cwd)); });
    function go(abs) {
      var d = FSX.get(abs); if (!d || d.type !== 'dir') return;
      cwd = abs; path.textContent = FSX.pretty(abs); w.title.textContent = t('Archivos — {0}', FSX.name(abs)); grid.textContent = '';
      Object.keys(d.kids).filter(function (k) { return k[0] !== '.'; }).sort(function (a, b) {
        var da = d.kids[a].type === 'dir', db = d.kids[b].type === 'dir'; return da !== db ? (da ? -1 : 1) : a.localeCompare(b);
      }).forEach(function (k) {
        var n = d.kids[k], it = el('button', 'icon'), im = el('img'), A = n.type === 'app' && APPS[n.app];
        im.src = n.type === 'dir' ? iconURL(k === 'papelera' ? 'trash' : 'folder') : A ? iconURL(A.icon, A.swap) : n.type === 'link' ? iconURL('link') : iconURL('doc', APPS.notas.swap);
        im.alt = ''; it.type = 'button'; it.append(im, el('span', null, k)); it.title = n.type === 'link' ? n.url : '';
        it.addEventListener('dblclick', function () { var a = FSX.resolve(cwd, k); if (n.type === 'dir') go(a); else openPath(a); });
        it.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); it.dispatchEvent(new MouseEvent('dblclick')); } });
        if (touch) it.addEventListener('click', function () { it.dispatchEvent(new MouseEvent('dblclick')); });
        grid.append(it);
      });
      if (!grid.childNodes.length) grid.append(el('p', 'dim', 'Carpeta vacía.'));
    }
    go(start);
  }

  /* ---- Notas: un archivo de texto (lo que se escribe se guarda en él mientras dure la visita) ---- */
  function notes(w, body, abs) {
    var n = abs && FSX.get(abs), ta = el('textarea', 'note');
    ta.spellcheck = false; ta.value = n ? n.text : ''; ta.setAttribute('aria-label', 'Texto');
    if (n && !n.mine) ta.placeholder = '';
    if (!n) ta.placeholder = 'Escribe lo que quieras. (Para guardarlo como archivo: nano nombre.txt en la terminal)';
    w.title.textContent = t('Notas — {0}', abs ? FSX.name(abs) : t('sin título'));
    ta.addEventListener('input', function () { if (n) n.text = ta.value; });
    body.append(ta); body.classList.add('notes');
    setTimeout(function () { ta.focus(); ta.setSelectionRange(0, 0); ta.scrollTop = 0; }, 30);
  }

  /* ---- Contacto ---- */
  function contact(body) {
    body.classList.add('contact');
    var mail = CV.email.join('@');
    body.append(el('h2', null, 'Hablemos'), el('p', 'dim', 'Estoy en Madrid. Escríbeme o mira mi código:'));
    [['Correo', 'mailto:' + mail, mail], ['GitHub', CV.github, CV.github.replace('https://', '')], ['LinkedIn', CV.linkedin, CV.linkedin.replace('https://www.', '')]].forEach(function (c) {
      var row = el('p'), a = el('a', null, c[2]); a.href = c[1];
      if (/^https:/.test(c[1])) { a.target = '_blank'; a.rel = 'noopener'; } else a.target = '_top';   // el correo, desde la ventana principal
      row.append(el('b', null, t(c[0]) + ': '), a); body.append(row);
    });
  }

  /* ---- Calculadora (las cuentas, con calcEval de apps.js) ---- */
  function calculator(w, body) {
    body.classList.add('calc');
    var screen = el('div', 'cscreen'), expr = el('div', 'cexpr', ''), out = el('div', 'cout', '0'), keys = el('div', 'ckeys'), text = '', shown = false;
    screen.append(expr, out); body.append(screen, keys);
    function show() {
      expr.textContent = text || ' ';
      if (!text) { out.textContent = '0'; out.classList.remove('err'); return; }
      try { out.textContent = '= ' + calcFmt(calcEval(text)); out.classList.remove('err'); } catch (e) { out.textContent = '…'; }
    }
    function press(k) {
      if (k === 'C') text = '';
      else if (k === '⌫') text = text.slice(0, -1);
      else if (k === '=') {
        try { var v = calcFmt(calcEval(text)); expr.textContent = text + ' ='; text = v.replace(',', '.'); out.textContent = v; out.classList.remove('err'); shown = true; return; }
        catch (e) { out.textContent = e.message; out.classList.add('err'); return; }
      }
      else { if (shown && /[0-9.π√(]/.test(k)) text = ''; text += k === '√' ? '√(' : k; }
      shown = false; show();
    }
    ['C', '(', ')', '⌫', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '%', '+', '√', '^', 'π', '='].forEach(function (k) {
      var b = el('button', 'ckey' + (/[÷×−+^%=]/.test(k) ? ' op' : '') + (k === '=' ? ' eq' : '') + (k === 'C' ? ' clr' : ''), k); b.type = 'button';
      b.addEventListener('click', function () { press(k); });
      keys.append(b);
    });
    // también con el teclado, cuando la ventana está delante
    w.el.tabIndex = -1;
    w.el.addEventListener('keydown', function (e) {
      var map = { '*': '×', '/': '÷', '-': '−', Enter: '=', '=': '=', Backspace: '⌫', Delete: 'C', ',': '.' }, k = map[e.key] || e.key;
      if (/^[0-9.()+^%π]$/.test(k) || ['×', '÷', '−', '=', '⌫', 'C'].indexOf(k) >= 0) { e.preventDefault(); press(k); }
    });
    setTimeout(function () { w.el.focus(); }, 30);
  }

  /* ---- Ajustes: se guardan en este navegador (diegos-ajustes) ---- */
  var SET_DEF = { fondo: 'noche', terminal: 'verde', letra: 'normal', arranque: 'si' };
  var SET_OPTS = {
    fondo: [['noche', 'Noche'], ['atardecer', 'Atardecer'], ['bosque', 'Bosque'], ['clasico', 'Clásico']],
    terminal: [['verde', 'Verde'], ['ambar', 'Ámbar'], ['hielo', 'Hielo']],
    letra: [['normal', 'Normal'], ['grande', 'Grande']],
    arranque: [['si', 'Sí'], ['no', 'No']]
  };
  function loadSettings() {
    var s = Object.assign({}, SET_DEF);
    try {
      var saved = JSON.parse(localStorage.getItem('diegos-ajustes') || '{}');
      Object.keys(SET_DEF).forEach(function (k) { if (saved && SET_OPTS[k].some(function (o) { return o[0] === saved[k]; })) s[k] = saved[k]; });
    } catch (e) { }
    return s;
  }
  var prefs = loadSettings();
  function applySettings() {
    var b = document.body;
    b.className = b.className.replace(/\b(wp|tt|tf)-\S+/g, '').trim();
    b.classList.add('wp-' + prefs.fondo, 'tt-' + prefs.terminal, 'tf-' + prefs.letra);
    try { localStorage.setItem('diegos-ajustes', JSON.stringify(prefs)); } catch (e) { }
  }
  applySettings();
  function settings(body) {
    body.classList.add('settings');
    var LABELS = { fondo: 'Fondo del escritorio', terminal: 'Colores de la terminal', letra: 'Letra de la terminal', arranque: 'Animación de arranque' };
    Object.keys(SET_OPTS).forEach(function (k) {
      var row = el('div', 'srow'), seg = el('div', 'sseg');
      row.append(el('h3', null, LABELS[k]), seg);
      SET_OPTS[k].forEach(function (o) {
        var b = el('button', 'btn', o[1]); b.type = 'button'; b.setAttribute('aria-pressed', String(prefs[k] === o[0]));
        b.addEventListener('click', function () {
          prefs[k] = o[0]; applySettings();
          seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        });
        seg.append(b);
      });
      body.append(row);
    });
    // borrar lo que la web guarda en este navegador (pide confirmación con un segundo clic)
    var wipe = el('button', 'btn danger', 'Borrar mis datos de la web'), sure = false; wipe.type = 'button';
    var note = el('p', 'dim', 'Progreso de las piezas, logros, idioma del expediente y estos ajustes. Solo se guardan en tu navegador.');
    wipe.addEventListener('click', function () {
      if (!sure) { sure = true; wipe.textContent = '¿Seguro? Pulsa otra vez'; setTimeout(function () { sure = false; wipe.textContent = 'Borrar mis datos de la web'; }, 4000); return; }
      try {
        ['piezas3d-hechas', 'piezas-hechas', 'cv-lang', 'diegos-ajustes', 'logros', 'diego-sonido', 'diego-musica'].forEach(function (k) { localStorage.removeItem(k); });
        sessionStorage.clear();
      } catch (e) { }
      prefs = Object.assign({}, SET_DEF); applySettings();
      wipe.textContent = 'Borrado ✓'; sure = false;
      body.querySelectorAll('.sseg').forEach(function (seg, i) { var k = Object.keys(SET_OPTS)[i]; seg.querySelectorAll('button').forEach(function (x, j) { x.setAttribute('aria-pressed', String(SET_OPTS[k][j][0] === prefs[k])); }); });
    });
    var about = el('p', 'dim', t('DiegOS 1.0 (retro) · hecho a mano en JavaScript, sin librerías, por {0}.', CV.name));
    body.append(el('div', 'srow', null), wipe, note, about);
  }

  /* ---- escritorio, menú de inicio y reloj ---- */
  var touch = window.matchMedia && matchMedia('(hover: none)').matches;
  function iconButton(label, img, act) {
    var b = el('button', 'icon'), im = el('img'); im.src = img; im.alt = ''; b.type = 'button';
    b.append(im, el('span', null, label));
    b.addEventListener('dblclick', act);
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); act(); } });
    if (touch) b.addEventListener('click', act);   // en pantallas táctiles, con un toque
    return b;
  }
  var icons = $('icons');
  DESKTOP.forEach(function (d) {
    if (typeof d === 'string') icons.append(iconButton(APPS[d].title, iconURL(APPS[d].icon, APPS[d].swap), function () { open(d); }));
    else icons.append(iconButton(d.title, iconURL(d.icon), function () { open('archivos', d.dir); }));
  });
  var menu = $('menu'), startBtn = $('start');
  function toggleMenu(on) { menu.hidden = on === undefined ? !menu.hidden : !on; startBtn.setAttribute('aria-expanded', String(!menu.hidden)); }
  Object.keys(APPS).forEach(function (id) {
    var b = el('button', 'mitem'), im = el('img'); im.src = iconURL(APPS[id].icon, APPS[id].swap); im.alt = ''; b.type = 'button';
    b.append(im, el('span', null, APPS[id].title));
    b.addEventListener('click', function () { toggleMenu(false); open(id); });
    $('mapps').append(b);
  });
  var off = el('button', 'mitem off'), offIm = el('img'); offIm.src = iconURL('off'); offIm.alt = ''; off.type = 'button';
  off.append(offIm, el('span', null, 'Apagar (volver al juego)')); off.addEventListener('click', shutdown); menu.append(off);
  startBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
  document.addEventListener('pointerdown', function (e) { if (!menu.hidden && !e.target.closest('#menu, #start')) toggleMenu(false); });
  function tick() { $('clock').textContent = new Date().toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }); }
  tick(); setInterval(tick, 10000);

  /* salir: dentro del juego cierra el visor; si se entró directamente, va al menú del juego */
  function shutdown() {
    if (window.parent !== window) parent.postMessage('viewer:close', location.origin);
    else location.href = '../#menu';
  }
  // Esc: cierra la ventana de delante; sin ventanas (o con el menú abierto), apaga
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (!menu.hidden) { toggleMenu(false); return; }
    var vis = wins.filter(function (x) { return !x.el.hidden; });
    if (active && !active.el.hidden) close(active); else if (vis.length) close(vis[vis.length - 1]); else shutdown();
  });
  // una página de dentro (expediente, laboratorio…) pide cerrarse: se cierra su ventana
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || e.data !== 'viewer:close') return;
    var w = wins.filter(function (x) { return x.frame && x.frame.contentWindow === e.source; })[0];
    if (w) close(w);
  });
  // al pulsar dentro de un marco, su ventana pasa al frente
  window.addEventListener('blur', function () {
    setTimeout(function () {
      var a = document.activeElement, w = a && a.tagName === 'IFRAME' && wins.filter(function (x) { return x.frame === a; })[0];
      if (w) focus(w);
    }, 0);
  });

  var api = { launch: open, open: open, openPath: openPath, close: close, bootAnim: function () { return prefs.arranque === 'si'; } };
  return api;
})();

/* arranque: unas líneas de «boot» (solo la primera vez en la visita) y la terminal abierta */
(function () {
  var boot = document.getElementById('boot'), lines = ['DiegOS 1.0 (retro) — arrancando…', '[ OK ] Montando /home/diego',
    '[ OK ] Cargando el laboratorio de IA', '[ OK ] Despertando a la terminal', '[ OK ] Escritorio listo'];
  var seen = false; try { seen = sessionStorage.getItem('diegos-boot') === '1'; sessionStorage.setItem('diegos-boot', '1'); } catch (e) { }
  function done() { if (!boot.parentNode) return; boot.remove(); OS.open('terminal'); }
  if (seen || !OS.bootAnim()) { done(); return; }
  boot.hidden = false;
  lines.forEach(function (l, i) {
    setTimeout(function () { if (!boot.parentNode) return; var d = document.createElement('div'); d.textContent = l; if (i) d.className = 'ok'; boot.append(d); }, 140 * i);
  });
  setTimeout(done, 140 * lines.length + 350);
  document.addEventListener('keydown', function skip() { document.removeEventListener('keydown', skip); done(); });
  boot.addEventListener('click', done);
})();
