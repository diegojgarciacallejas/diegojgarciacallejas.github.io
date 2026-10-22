/* Logros: se consiguen en cualquier parte de la web (el juego, DiegOS, el laboratorio, las piezas…) y se guardan
   juntos en este navegador (localStorage «logros»). Logros.unlock('id') lo da; Logros.mark('grupo', 'cosa')
   apunta cosas vistas (para «mira 10 cosas») y devuelve cuántas van. El aviso sale siempre en la ventana de
   arriba del todo (si se consigue dentro del visor, se ve encima del juego). Los secretos no dicen qué son. */
var LOGROS = [
  { id: 'hola', name: 'Hola, mundo', desc: 'Entra en mi cuarto.' },
  { id: 'curioso', name: 'Curioso', desc: 'Mira 10 cosas distintas del cuarto.' },
  { id: 'todo', name: 'Lo he visto todo', desc: 'Mira todas las cosas del cuarto.' },
  { id: 'expediente', name: 'Lector', desc: 'Lee mi expediente.' },
  { id: 'patio', name: 'Al aire libre', desc: 'Sal al patio.' },
  { id: 'vecinos', name: 'Vecino del año', desc: 'Habla con 5 personas distintas de la calle.' },
  { id: 'gol', name: 'Pichichi', desc: 'Marca un gol en los penaltis.' },
  { id: 'pleno', name: 'Cinco de cinco', desc: 'Marca los 5 penaltis de una tanda.' },
  { id: 'lab', name: 'Científico', desc: 'Abre un proyecto del laboratorio de IA.' },
  { id: 'lab4', name: 'Laboratorio completo', desc: 'Abre los 4 proyectos del laboratorio.' },
  { id: 'terminal', name: 'Hacker', desc: 'Escribe una orden en la terminal de DiegOS.' },
  { id: 'pieza', name: 'Constructor', desc: 'Termina un modelo de piezas.' },
  { id: 'maestro', name: 'Maestro constructor', desc: 'Termina todos los modelos de piezas.' },
  { id: 'coleccion', name: 'Coleccionista', desc: 'Encuentra los 5 objetos ocultos.' },
  // secretos
  { id: 'patricio', name: 'Sniff, sniff', desc: 'Habla con Patricio.', secret: true, hint: 'Alguien de orejas largas tiene algo que decir.' },
  { id: 'manuelita', name: 'Manuelita, te quiero', desc: 'Lee la etiqueta de Manuelita.', secret: true, hint: 'En la cama hay algo blandito.' },
  { id: 'flor', name: 'Mano verde', desc: 'Haz que florezca el cactus.', secret: true, hint: 'A algunas plantas les vendría bien un poco de agua.' },
  { id: 'ahogado', name: 'Demasiada agua', desc: 'Riega el cactus tres veces.', secret: true, hint: 'Hay cosas que no conviene repetir…' },
  { id: 'columpio', name: '¡Más alto!', desc: 'Súbete al columpio.', secret: true, hint: 'Algo cuelga de un árbol.' },
  { id: 'tiempo', name: 'Meteorólogo', desc: 'Mira qué tiempo hace en Madrid.', secret: true, hint: 'Asómate.' },
  { id: 'noche', name: 'Noctámbulo', desc: 'Entra en mi cuarto de noche (hora de Madrid).', secret: true, hint: 'Vuelve cuando haya luna.' },
  { id: 'sudo', name: 'Permiso denegado', desc: 'Intenta ser administrador en DiegOS.', secret: true, hint: 'En la terminal hay una palabra mágica que no funciona.' },
  { id: 'oculto', name: 'Ojos de búho', desc: 'Encuentra el archivo oculto de DiegOS.', secret: true, hint: 'No todo lo que hay en una carpeta se ve a la primera.' },
  { id: 'platino', name: 'Platino', desc: 'Consigue todos los demás logros.', secret: true, hint: 'El último de todos.' }
];

// objetos escondidos por la web (cuarto, patio, DiegOS…): al encontrarlos salen en el panel de logros
var OBJETOS = [
  { id: 'peseta', name: 'Peseta antigua' },
  { id: 'chicle', name: 'Chicle dorado' },
  { id: 'tenis', name: 'Pelota de tenis' },
  { id: 'bellota', name: 'Bellota' },
  { id: 'pendrive', name: 'Pendrive perdido' }
];
I18N.deep(LOGROS); I18N.deep(OBJETOS);   // en inglés

var Logros = (function () {
  var KEY = 'logros', queue = [], showing = false;
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function find(id) { return LOGROS.filter(function (l) { return l.id === id; })[0]; }
  /* lo guardado: { u: {id: fecha}, s: {grupo: {cosa: 1}}, f: {objeto: fecha} }; si no tiene esa forma, se ignora */
  function item(id) { return OBJETOS.filter(function (o) { return o.id === id; })[0]; }
  function load() {
    var d = { u: {}, s: {}, f: {} };
    try {
      var x = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (x && typeof x.u === 'object' && x.u) Object.keys(x.u).forEach(function (k) { if (find(k) && typeof x.u[k] === 'number') d.u[k] = x.u[k]; });
      if (x && typeof x.f === 'object' && x.f) Object.keys(x.f).forEach(function (k) { if (item(k) && typeof x.f[k] === 'number') d.f[k] = x.f[k]; });
      if (x && typeof x.s === 'object' && x.s) Object.keys(x.s).forEach(function (g) {
        if (!/^\w{1,20}$/.test(g) || own(Object.prototype, g) || !x.s[g] || typeof x.s[g] !== 'object') return;
        d.s[g] = {}; Object.keys(x.s[g]).slice(0, 200).forEach(function (k) { if (k.length <= 40 && !own(Object.prototype, k)) d.s[g][k] = 1; });
      });
    } catch (e) { }
    return d;
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } }

  function unlock(id) {
    if (!find(id)) return false;
    var d = load(); if (d.u[id]) return false;
    d.u[id] = Date.now(); save(d);
    announce(id);
    // el último: todos los demás
    if (id !== 'platino' && LOGROS.every(function (l) { return l.id === 'platino' || d.u[l.id]; })) unlock('platino');
    return true;
  }
  function mark(group, key) {
    var d = load(); key = String(key).slice(0, 40);
    if (own(Object.prototype, key)) return 0;
    d.s[group] = d.s[group] || {}; d.s[group][key] = 1; save(d);
    return Object.keys(d.s[group]).length;
  }
  /* un objeto oculto encontrado (devuelve true si es nuevo) */
  function findItem(id) {
    if (!item(id)) return false;
    var d = load(); if (d.f[id]) return false;
    d.f[id] = Date.now(); save(d);
    announce(id, 'item');
    if (OBJETOS.every(function (o) { return d.f[o.id]; })) unlock('coleccion');
    return true;
  }
  function found() { return load().f; }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) { } }
  function seen(group) { return Object.keys(load().s[group] || {}); }
  function has(id) { return !!load().u[id]; }
  function got() { return load().u; }

  /* ---- el aviso: en la ventana de arriba del todo, uno detrás de otro ---- */
  function announce(id, kind) {
    var host = window;
    try { if (window.top !== window && window.top.Logros) host = window.top; } catch (e) { }
    host.Logros.toast(id, kind);
  }
  function toast(id, kind) { queue.push([id, kind]); if (!showing) next(); }
  function next() {
    var q = queue.shift(); if (!q) { showing = false; return; }
    showing = true; style();
    var id = q[0], isItem = q[1] === 'item', l = isItem ? { name: item(id).name, desc: t('Lo verás en el panel de logros.') } : find(id), box = document.createElement('div'), img = document.createElement('img'), txt = document.createElement('div');
    box.className = 'logro-toast'; box.setAttribute('role', 'status');
    img.src = icon(isItem ? 'gem' : 'trophy'); img.alt = '';
    var small = document.createElement('small'), b = document.createElement('b'), p = document.createElement('span');
    small.textContent = t(isItem ? '¡Objeto oculto encontrado!' : '¡Logro conseguido!'); b.textContent = l.name; p.textContent = l.desc;
    txt.append(small, b, p); box.append(img, txt); document.body.append(box);
    if (window.Sound) Sound.play('logro');
    setTimeout(function () { box.classList.add('in'); }, 20);
    setTimeout(function () { box.classList.remove('in'); setTimeout(function () { box.remove(); next(); }, 350); }, 3800);
  }
  var styled = false;
  function style() {
    if (styled) return; styled = true;
    var s = document.createElement('style');
    s.textContent = '.logro-toast{position:fixed;left:50%;top:14px;z-index:40;display:flex;gap:12px;align-items:center;max-width:min(420px,calc(100% - 32px));' +
      'padding:10px 16px 10px 12px;background:#120c22;border:3px solid #f2c66d;box-shadow:5px 5px 0 rgba(0,0,0,.5);color:#f3eedc;' +
      'transform:translate(-50%,-140%);transition:transform .3s ease;font:500 14px/1.3 "Hanken Grotesk",system-ui,sans-serif;pointer-events:none}' +
      '.logro-toast.in{transform:translate(-50%,0)}.logro-toast img{width:40px;height:40px;image-rendering:pixelated;flex:none}' +
      '.logro-toast small{display:block;font:400 15px/1 "Jersey 20",monospace;letter-spacing:1px;color:#f2c66d;text-transform:uppercase}' +
      '.logro-toast b{display:block;font:700 18px/1.2 "Pixelify Sans",monospace}.logro-toast span{color:#a59fc0}';
    document.head.append(s);
  }

  /* ---- iconos de píxel (10 x 10) para el aviso, los botones de arriba y el panel ---- */
  var ICONS = {
    trophy: ['..yyyyyy..', 'yyyyyyyyyy', 'y.yyyyyy.y', 'y.yyyyyy.y', '.yyyyyyyy.', '...yyyy...', '....yy....', '....yy....', '...YYYY...', '..YYYYYY..'],
    sound: ['..........', '....w.....', '...ww..w..', 'wwwww...w.', 'wwwww.w.w.', 'wwwww.w.w.', 'wwwww...w.', '...ww..w..', '....w.....', '..........'],
    music: ['....wwwwww', '....wwwwww', '....w....w', '....w....w', '....w....w', '....w....w', '..www..www', '.wwww.wwww', '..ww...ww.', '..........'],
    gem: ['..........', '...GGGG...', '..GgggGG..', '.GgwgggGG.', 'GgwggggGGG', '.GgggggGG.', '..GgggGG..', '...GggG...', '....GG....', '..........'],
    lock: ['...ssss...', '..s....s..', '..s....s..', '.SSSSSSSS.', '.SSSkkSSS.', '.SSSkkSSS.', '.SSSSSSSS.', '.SSSSSSSS.', '..........', '..........']
  };
  var PAL = { y: '#f2c66d', Y: '#c9982e', w: '#f3eedc', s: '#9c8ad6', S: '#5a4a8a', k: '#120b1c', g: '#7cc59a', G: '#3f9a68' }, cache = {};
  function icon(name) {
    if (cache[name]) return cache[name];
    var c = document.createElement('canvas'), x = c.getContext('2d'); c.width = c.height = 10;
    ICONS[name].forEach(function (r, y) { for (var i = 0; i < 10; i++) if (PAL[r[i]]) { x.fillStyle = PAL[r[i]]; x.fillRect(i, y, 1, 1); } });
    return (cache[name] = c.toDataURL());
  }

  return { list: LOGROS, items: OBJETOS, unlock: unlock, mark: mark, seen: seen, has: has, got: got, find: findItem, found: found, reset: reset, toast: toast, icon: icon };
})();

/* abrir el expediente o un proyecto del laboratorio cuenta, se abra desde el juego, desde DiegOS o directamente */
(function () {
  var path = location.pathname, m = path.match(/\/lab\/(red-neuronal|digitos|rutas|kmeans)\//);
  if (m) { Logros.unlock('lab'); if (Logros.mark('lab', m[1]) >= 4) Logros.unlock('lab4'); }
  if (/\/cv\/(index\.html)?$/.test(path)) Logros.unlock('expediente');
})();
