/* DiegOS: las aplicaciones, sus iconos de píxel y el sistema de archivos que recorre la terminal.
   Los textos del expediente salen de cv/cv-data.js (CV), así que solo hay que mantenerlos allí. */

/* ---- iconos: 12 x 12, cada letra es un color de ICON_PAL («.» transparente) ---- */
var ICON_PAL = {
  k: '#120b1c', d: '#1f1638', g: '#7cc59a', G: '#3f9a68', w: '#f3eedc', b: '#9c8ad6', y: '#f2c66d', Y: '#c9982e',
  r: '#d9665a', R: '#a8463c', s: '#a59fc0', S: '#6f6890', B: '#3c72b8', o: '#f2a03b'
};
var ICON_ROWS = {
  terminal: ['kkkkkkkkkkkk', 'kddddddddddk', 'kdgddddddddk', 'kddgdddddddk', 'kdddgddddddk', 'kddgdddddddk', 'kdgddggggddk',
    'kddddddddddk', 'kkkkkkkkkkkk', '....kkkk....', '..kkkkkkkk..', '............'],
  doc: ['.kkkkkkk....', '.kwwwwwkk...', '.kwwwwwkwk..', '.kwwwwwkkkk.', '.kwbbbbbbwk.', '.kwwwwwwwwk.', '.kwbbbbbbwk.',
    '.kwwwwwwwwk.', '.kwbbbbwwwk.', '.kwwwwwwwwk.', '.kkkkkkkkkk.', '............'],
  folder: ['............', '.kkkkk......', 'kyyyyykkkkk.', 'kyyyyyyyyyyk', 'kYYYYYYYYYYk', 'kyyyyyyyyyyk', 'kyyyyyyyyyyk',
    'kyyyyyyyyyyk', 'kyyyyyyyyyyk', 'kkkkkkkkkkkk', '............', '............'],
  lab: ['....kkkk....', '....kwwk....', '....kwwk....', '....kwwk....', '...kwwwwk...', '..kwwwwwwk..', '..kggggggk..',
    '.kggGggggGk.', '.kgggggGggk.', 'kggGgggggggk', 'kkkkkkkkkkkk', '............'],
  blocks: ['..r..r......', '.rrrrrr.....', '.rrrrrr.....', '.RRRRRR.....', '...b..b..b..', '..bbbbbbbbb.', '..bbbbbbbbb.',
    '..SSSSSSSSS.', '.y..y.......', 'yyyyyy......', 'yyyyyy......', 'YYYYYY......'],
  mail: ['............', '............', 'kkkkkkkkkkkk', 'kwkwwwwwwkwk', 'kwwkwwwwkwwk', 'kwwwkwwkwwwk', 'kwwwwkkwwwwk',
    'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '............', '............'],
  trash: ['....kkkk....', 'kkkkkkkkkkkk', '.kssssssssk.', '.ksSsSsSssk.', '.ksSsSsSssk.', '.ksSsSsSssk.', '.ksSsSsSssk.',
    '.ksSsSsSssk.', '.ksssssssk..', '..kkkkkkkk..', '............', '............'],
  link: ['............', '...kkkkkk...', '..kBBBBBBk..', '.kBBwBBwBBk.', '.kBwwBBwwBk.', '.kBBBBBBBBk.', '.kwwwwwwwwk.',
    '.kBBBBBBBBk.', '.kBwwBBwwBk.', '..kBBBBBBk..', '...kkkkkk...', '............'],
  calc: ['.kkkkkkkkkk.', '.kSSSSSSSSk.', '.kSggggggSk.', '.kSSSSSSSSk.', '.kSwSwSwSSk.', '.kSSSSSSSSk.', '.kSwSwSwSSk.',
    '.kSSSSSSSSk.', '.kSwSwSoSSk.', '.kSSSSSSSSk.', '.kkkkkkkkkk.', '............'],
  gear: ['.....kk.....', '..kk.ss.kk..', '..kssssssk..', '...ssSSss...', '.kssS..Sssk.', 'kssS....Sssk', 'kssS....Sssk',
    '.kssS..Sssk.', '...ssSSss...', '..kssssssk..', '..kk.ss.kk..', '.....kk.....'],
  off: ['.....kk.....', '..kk.rr.kk..', '.krk.rr.krk.', 'krk..rr..krk', 'kr...rr...rk', 'kr...kk...rk', 'kr........rk',
    'krk......krk', '.krkk..kkrk.', '..krrrrrrk..', '...kkkkkk...', '............']
};
var iconCache = {};
/* el icono como imagen (data URL); «swap» cambia colores (p. ej. el líquido del matraz de cada proyecto) */
function iconURL(name, swap) {
  var key = name + JSON.stringify(swap || {});
  if (iconCache[key]) return iconCache[key];
  var rows = ICON_ROWS[name] || ICON_ROWS.doc, c = document.createElement('canvas'), ctx = c.getContext('2d'), pal = Object.assign({}, ICON_PAL, swap);
  c.width = 12; c.height = 12;
  rows.forEach(function (r, y) { for (var x = 0; x < 12; x++) { var col = pal[r[x]]; if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); } } });
  return (iconCache[key] = c.toDataURL());
}

/* ---- aplicaciones ----
   kind: frame (otra página de la web en la ventana) · term · files · text · contact */
var APPS = {
  terminal:     { title: 'Terminal', icon: 'terminal', kind: 'term', w: 700, h: 440, multi: true, desc: 'La consola de DiegOS: ls, cd, cat, open…' },
  archivos:     { title: 'Archivos', icon: 'folder', kind: 'files', w: 620, h: 430, multi: true, desc: 'Explorar las carpetas' },
  notas:        { title: 'Notas', icon: 'doc', swap: { w: '#fff6cf', b: '#c9982e' }, kind: 'text', w: 580, h: 460, multi: true, desc: 'Leer y escribir archivos de texto' },
  expediente:   { title: 'Expediente', icon: 'doc', kind: 'frame', url: '../cv/', w: 940, h: 660, desc: 'Mi currículum' },
  contacto:     { title: 'Contacto', icon: 'mail', kind: 'contact', w: 460, h: 320, desc: 'Correo, GitHub y LinkedIn' },
  calculadora:  { title: 'Calculadora', icon: 'calc', kind: 'calc', w: 330, h: 470, desc: 'Sumar, restar… y raíces, potencias y π' },
  ajustes:      { title: 'Ajustes', icon: 'gear', kind: 'settings', w: 520, h: 520, desc: 'Fondo, colores de la terminal y más' },
  piezas:       { title: 'Piezas', icon: 'blocks', kind: 'frame', url: '../juegos/piezas/', w: 1000, h: 700, desc: 'Copiar modelos en 3D pieza a pieza' },
  laboratorio:  { title: 'Laboratorio IA', icon: 'lab', kind: 'frame', url: '../lab/', w: 1000, h: 700, desc: 'Todos los proyectos de IA' },
  'red-neuronal': { title: 'Red neuronal', icon: 'lab', swap: { g: '#6aa6f0', G: '#3c72b8' }, kind: 'frame', url: '../lab/red-neuronal/', w: 1100, h: 720,
    desc: 'Una red que aprende a separar dos clases de puntos' },
  digitos:      { title: 'Dígitos (CNN)', icon: 'lab', swap: { g: '#f2a03b', G: '#c9782e' }, kind: 'frame', url: '../lab/digitos/', w: 1100, h: 720,
    desc: 'Dibuja un número y una red convolucional lo reconoce' },
  rutas:        { title: 'Rutas (A*)', icon: 'lab', swap: { g: '#9c8ad6', G: '#6f5aa8' }, kind: 'frame', url: '../lab/rutas/', w: 1100, h: 720,
    desc: 'A*, Dijkstra y la búsqueda voraz, paso a paso' },
  kmeans:       { title: 'K-Means', icon: 'lab', swap: { g: '#ef8fa8', G: '#c0607a' }, kind: 'frame', url: '../lab/kmeans/', w: 1100, h: 720,
    desc: 'Agrupar puntos sin etiquetas y el método del codo' }
};
// en el escritorio, en este orden
// en inglés (los nombres de las carpetas y archivos se quedan en español: es el ordenador de Diego)
I18N.deep(APPS);
var DESKTOP = ['terminal', 'archivos', 'expediente', 'laboratorio', 'piezas', 'calculadora', 'contacto', 'ajustes', { dir: '/home/diego/papelera', title: t('Papelera'), icon: 'trash' }];

/* ---- sistema de archivos (en memoria: lo que se cree o se edite dura hasta cerrar la página) ---- */
function fsDir(kids) { return { type: 'dir', kids: kids || {} }; }
function fsFile(text, extra) { return Object.assign({ type: 'file', text: text }, extra); }
function fsApp(id) { return { type: 'app', app: id }; }
function fsLink(url, text) { return { type: 'link', url: url, text: text }; }

/* el expediente en texto plano, a partir de cv-data.js */
function cvText(lang) {
  var L = CV[lang], out = [CV.name.toUpperCase(), L.role, L.place + ' · ' + CV.email.join('@'), ''];
  L.sections.forEach(function (s) {
    out.push('== ' + s.title.toUpperCase() + ' ==');
    if (s.intro) out.push(s.intro);
    (s.entries || []).forEach(function (e) {
      out.push('* ' + (e.date ? e.date + ' · ' : '') + e.title + (e.org ? ' — ' + e.org : ''));
      (e.bullets || []).forEach(function (b) { out.push('    - ' + b); });
      if (e.tags) out.push('    [' + e.tags.join(', ') + ']');
    });
    (s.groups || []).forEach(function (g) { out.push('* ' + g.name + ': ' + g.tags.join(', ')); });
    (s.text || []).forEach(function (t) { out.push(t); });
    out.push('');
  });
  return out.join('\n');
}
/* las etiquetas de un grupo de habilidades del CV, por su posición (0 técnicas, 1 personales, 2 idiomas), en el idioma de la página */
var CVL = LANG === 'en' ? 'en' : 'es';
function cvGroup(i) {
  var g = null;
  CV[CVL].sections.forEach(function (s) { if (s.groups) g = s.groups[i]; });
  return g ? g.tags : [];
}

var HOME = '/home/diego';
var GH = 'https://github.com/diegojgarciacallejas/';
var COMMAND_NAMES = ['alias', 'apps', 'calc', 'cat', 'cd', 'clear', 'date', 'echo', 'exit', 'help', 'history', 'hostname', 'less', 'ls', 'man', 'mkdir',
  'nano', 'neofetch', 'open', 'pwd', 'python', 'rm', 'sudo', 'tiempo', 'touch', 'tree', 'uname', 'whoami', 'xdg-open'];

var FS = fsDir({
  bin: fsDir(COMMAND_NAMES.reduce(function (o, n) { o[n] = { type: 'bin' }; return o; }, {})),
  etc: fsDir({
    hostname: fsFile('diegos'),
    'os-release': fsFile('NAME="DiegOS"\nVERSION="1.0 (retro)"\nID=diegos\nPRETTY_NAME="DiegOS 1.0"\nHOME_URL="../"'),
    motd: fsFile(t('Bienvenido a DiegOS. Escribe help para ver los comandos.')),
    shadow: fsFile('', { locked: true })
  }),
  home: fsDir({
    diego: fsDir({
      '.bashrc': fsFile(t('# ~/.bashrc de DiegOS\nalias cv=\'open expediente\'\nalias lab=\'open laboratorio\'\nexport EDITOR=notas\n\n# Si estás leyendo esto, eres de los que miran los archivos ocultos. Bien hecho.')),
      aplicaciones: fsDir({
        'terminal.app': fsApp('terminal'), 'archivos.app': fsApp('archivos'), 'notas.app': fsApp('notas'),
        'expediente.app': fsApp('expediente'), 'contacto.app': fsApp('contacto'), 'piezas.app': fsApp('piezas'),
        'calculadora.app': fsApp('calculadora'), 'ajustes.app': fsApp('ajustes')
      }),
      proyectos: fsDir({
        'LEEME.txt': fsFile(t([
          'PROYECTOS',
          '',
          'Aquí, para probarlos (open <nombre>):',
          '  laboratorio.app    todos los proyectos de IA juntos',
          '  red-neuronal.app   ' + 'una red que aprende a separar dos clases de puntos; cambia capas, neuronas y activaciones',
          '  digitos.app        dibuja un número y una red convolucional adivina cuál es',
          '  rutas.app          A*, Dijkstra y la búsqueda voraz encontrando el camino más corto',
          '  kmeans.app         agrupar puntos sin etiquetas, paso a paso, con el método del codo',
          '',
          'En github/ están los repositorios de mis proyectos de la carrera (open abre GitHub).'
        ].join('\n'))),
        'laboratorio.app': fsApp('laboratorio'), 'red-neuronal.app': fsApp('red-neuronal'), 'digitos.app': fsApp('digitos'),
        'rutas.app': fsApp('rutas'), 'kmeans.app': fsApp('kmeans'),
        github: fsDir({
          'mercado-coches.url': fsLink(GH + 'car-market-web-scraping-analysis', t('Web scraping de anuncios de coches en 4 mercados europeos: limpieza, análisis comparativo y visualización.')),
          'lanzamientos-mlb.url': fsLink(GH + 'mlb-pitch-type-classification', t('Clasificación supervisada de tipos de lanzamiento con datos de Statcast (KNN, regresión logística, árbol, SVM).')),
          'clustering-sociodemografico.url': fsLink(GH + 'sociodemographic-clustering-analysis', t('Clustering de variables sociodemográficas: KMeans, jerárquico, DBSCAN y GMM.')),
          'subte-buenos-aires.url': fsLink(GH + 'buenos-aires-subway-route-optimizer', t('Optimizador de rutas del Subte de Buenos Aires con búsqueda heurística (equipo de seis personas).'))
        })
      }),
      documentos: fsDir({
        'sobre-mi.txt': fsFile(t([
          'Hola, soy {0}.',
          '{1}.',
          'Soy de Extremadura y vivo en Madrid.',
          '',
          'Este portfolio es un juego, hecho a mano píxel a píxel. Desde DiegOS puedes abrirlo todo:',
          '  ~/proyectos      el laboratorio de IA y mis repositorios',
          '  ~/aplicaciones   mi expediente, el juego de piezas, el contacto…',
          '',
          'Prueba en la terminal:  cd proyectos   ls   open digitos'
        ].join('\n'), CV.name, CV[CVL].role)),
        'expediente.txt': fsFile(cvText(CVL)),
        'resume-en.txt': fsFile(cvText('en')),
        'contacto.txt': fsFile(t('Correo:   ') + CV.email.join('@') + '\nGitHub:   ' + CV.github + '\nLinkedIn: ' + CV.linkedin)
      }),
      papelera: fsDir({
        'modelo_v1_final_DEFINITIVO.ipynb': fsFile(t('Este cuaderno daba una precisión del 12 %.\nDe los errores también se aprende. Por eso sigue aquí.')),
        'todo.txt': fsFile(t('- dormir\n- (pendiente)'))
      })
    })
  }),
  // un objeto oculto: solo se ve con ls -a /tmp
  tmp: fsDir({ '.pendrive_perdido.txt': fsFile(t('Un pendrive olvidado. Dentro solo hay una carpeta: «backup_portfolio_v0». Mejor no abrirla: ahí está la primera versión de esta web.'), { item: 'pendrive' }) })
});

/* rutas: normalizar, buscar y nombrar */
var FSX = {
  resolve: function (cwd, p) {
    if (!p || p === '~') return HOME;
    if (p.indexOf('~/') === 0) p = HOME + p.slice(1);
    var parts = (p[0] === '/' ? p : cwd + '/' + p).split('/'), out = [];
    parts.forEach(function (x) { if (!x || x === '.') return; if (x === '..') out.pop(); else out.push(x); });
    return '/' + out.join('/');
  },
  get: function (abs) {
    var n = FS, parts = abs.split('/').filter(Boolean);
    for (var i = 0; i < parts.length; i++) { if (!n || n.type !== 'dir' || !Object.prototype.hasOwnProperty.call(n.kids, parts[i])) return null; n = n.kids[parts[i]]; }
    return n;
  },
  name: function (abs) { return abs.split('/').filter(Boolean).pop() || '/'; },
  parent: function (abs) { return FSX.resolve(abs, '..'); },
  pretty: function (abs) { return abs === HOME ? '~' : abs.indexOf(HOME + '/') === 0 ? '~' + abs.slice(HOME.length) : abs; },
  // nombres no válidos para crear archivos (sin barras ni nombres especiales)
  okName: function (n) { return /^[\w.\-áéíóúñÁÉÍÓÚÑ]{1,40}$/.test(n) && n !== '.' && n !== '..' && !/^(__proto__|constructor|prototype)$/.test(n); }
};

/* ---- cuentas: un analizador propio (nada de eval). Entiende + − × ÷ ^ %, paréntesis, π, e y
   sqrt/raiz, sin, cos, tan, log (base 10), ln y abs. Devuelve un número o lanza un error con el motivo. */
function calcEval(src) {
  var s = String(src).replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').replace(/√/g, 'sqrt').toLowerCase(), i = 0;
  if (!s) throw new Error(t('escribe una cuenta'));
  if (s.length > 200) throw new Error(t('demasiado larga'));
  var open = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
  if (open > 0) s += new Array(open + 1).join(')');                  // como las calculadoras: se cierran solos
  var FN = { sqrt: Math.sqrt, raiz: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log, abs: Math.abs };
  function expr() { var v = term(); while (s[i] === '+' || s[i] === '-') { var o = s[i++], r = term(); v = o === '+' ? v + r : v - r; } return v; }
  function term() {
    var v = unary();
    while (s[i] === '*' || s[i] === '/') {
      var o = s[i++], r = unary();
      if (o === '/' && r === 0) throw new Error(t('no se puede dividir entre 0'));
      v = o === '*' ? v * r : v / r;
    }
    return v;
  }
  // el signo va después de la potencia: -3^2 = -(3^2) = -9
  function unary() { if (s[i] === '-') { i++; return -unary(); } if (s[i] === '+') { i++; return unary(); } return power(); }
  function power() { var v = post(atom()); if (s[i] === '^') { i++; return Math.pow(v, unary()); } return v; }
  function post(v) { while (s[i] === '%') { i++; v /= 100; } return v; }      // 50% = 0,5
  function atom() {
    var rest = s.slice(i), m;
    if (s[i] === '(') { i++; var v = expr(); if (s[i++] !== ')') throw new Error(t('falta un paréntesis')); return v; }
    if ((m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(rest))) { i += m[0].length; return parseFloat(m[0]); }
    if ((m = /^(π|pi)/.exec(rest))) { i += m[0].length; return Math.PI; }
    if ((m = /^(sqrt|raiz|sin|cos|tan|log|ln|abs)/.exec(rest))) { i += m[1].length; return FN[m[1]](post(atom())); }   // √9 o sqrt(9)
    if (s[i] === 'e' && !/^[a-z]/.test(rest.slice(1))) { i++; return Math.E; }
    throw new Error(i < s.length ? t('no entiendo «{0}»', s.slice(i, i + 6)) : t('falta algo al final'));
  }
  var v = expr();
  if (i < s.length) throw new Error(t('no entiendo «{0}»', s.slice(i, i + 6)));
  if (!isFinite(v)) throw new Error(t(isNaN(v) ? 'no tiene solución' : 'el número es demasiado grande'));
  return parseFloat(v.toPrecision(12));
}
function calcFmt(v) { return LANG === 'en' ? String(v) : String(v).replace('.', ','); }   // 2,5 en español; 2.5 en inglés
