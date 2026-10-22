/* La terminal de DiegOS: una consola tipo Linux sobre el sistema de archivos de apps.js.
   Todo lo que se escribe se pinta como texto (textContent), nunca como HTML.
   Los nombres que lista ls se pueden pulsar: abren la carpeta, la aplicación o el archivo. */
function Terminal(box, os, win) {
  var self = this;
  this.os = os; this.win = win; this.cwd = HOME; this.hist = []; this.hpos = 0; this.started = Date.now();
  box.classList.add('term');
  // la salida no la traduce el traductor automático de la página (lo que escribes se queda como está): la traduce print()
  this.out = document.createElement('div'); this.out.className = 'tout'; this.out.setAttribute('data-no-i18n', '');
  var line = document.createElement('label'); line.className = 'tline';
  this.prompt = document.createElement('span'); this.prompt.className = 'tprompt';
  this.input = document.createElement('input'); this.input.className = 'tin';
  this.input.setAttribute('autocomplete', 'off'); this.input.setAttribute('autocapitalize', 'off'); this.input.setAttribute('spellcheck', 'false');
  this.input.setAttribute('aria-label', t('Orden de la terminal'));
  line.append(this.prompt, this.input); box.append(this.out, line);
  this.box = box;
  box.addEventListener('mouseup', function () { if (!String(window.getSelection())) self.input.focus(); });
  this.input.addEventListener('keydown', function (e) { self.key(e); });
  this.setPrompt();
  this.print([{ t: 'DiegOS 1.0', c: 'tg' }, ' · dsh, la consola de Diego']);
  this.print([{ t: 'help', c: 'tc', run: 'help' }, ' para ver los comandos · ', { t: 'ls', c: 'tc', run: 'ls' }, ' para ver qué hay · ',
    { t: 'neofetch', c: 'tc', run: 'neofetch' }, ' para conocerme']);
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches)
    this.print('Sin teclado: toca los comandos subrayados (help, ls, las carpetas…). DiegOS se disfruta más en un ordenador.', 'tdim');
  this.print('');
}

/* una línea de salida: texto, o lista de trozos { t, c (clase), run (orden al pulsar), raw } .
   Los mensajes se traducen (t, en i18n.js); lo que viene de ti o de los archivos va «raw» y se queda tal cual */
function trTerm(s) { var k = String(s).trim(); if (!k) return s; var r = t(k); return r === k ? s : String(s).replace(k, r); }
Terminal.prototype.print = function (parts, cls, raw) {
  var self = this, d = document.createElement('div');
  if (cls) d.className = cls;
  [].concat(parts).forEach(function (p) {
    if (typeof p === 'string') { d.append(raw ? p : trTerm(p)); return; }
    var s = document.createElement(p.run ? 'button' : 'span');
    s.textContent = raw || p.raw ? p.t : trTerm(p.t); if (p.c) s.className = p.c;
    if (p.run) { s.type = 'button'; s.classList.add('trun'); s.addEventListener('click', function () { self.exec(p.run, true); }); }
    d.append(s);
  });
  this.out.append(d);
  // no guardar líneas sin fin
  while (this.out.childNodes.length > 600) this.out.firstChild.remove();
  this.box.scrollTop = this.box.scrollHeight;
};
Terminal.prototype.setPrompt = function () { this.prompt.textContent = 'diego@diegos:' + FSX.pretty(this.cwd) + '$ '; };

Terminal.prototype.key = function (e) {
  var v = this.input.value;
  if (e.key === 'Enter') { e.preventDefault(); this.input.value = ''; this.exec(v); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
    if (!this.hist.length) return;
    this.hpos = Math.max(0, Math.min(this.hist.length, this.hpos + (e.key === 'ArrowUp' ? -1 : 1)));
    this.input.value = this.hist[this.hpos] || '';
  }
  else if (e.key === 'Tab') { e.preventDefault(); this.complete(); }
  else if (e.key === 'Escape' && v) { e.preventDefault(); e.stopPropagation(); this.input.value = ''; }   // Esc con algo escrito: borrarlo
  else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); this.out.textContent = ''; }
  else if (e.key === 'c' && e.ctrlKey && !String(window.getSelection())) { e.preventDefault(); this.print(this.prompt.textContent + v + '^C', null, true); this.input.value = ''; }
};

/* Tab: completa la orden (primera palabra) o el nombre de un archivo */
Terminal.prototype.complete = function () {
  var v = this.input.value, words = v.split(' '), last = words[words.length - 1], opts;
  if (words.length === 1) opts = COMMAND_NAMES.concat(Object.keys(APPS), Object.keys(ALIASES)).filter(function (c) { return c.indexOf(last) === 0; });
  else {
    var slash = last.lastIndexOf('/'), dirPart = slash >= 0 ? last.slice(0, slash + 1) : '', base = last.slice(slash + 1);
    var dir = FSX.get(FSX.resolve(this.cwd, dirPart || '.'));
    opts = dir && dir.type === 'dir' ? Object.keys(dir.kids).filter(function (n) { return n.indexOf(base) === 0 && (base[0] === '.' || n[0] !== '.'); })
      .map(function (n) { return dirPart + n + (dir.kids[n].type === 'dir' ? '/' : ''); }) : [];
  }
  opts = opts.filter(function (o, i) { return opts.indexOf(o) === i; });
  if (opts.length === 1) { words[words.length - 1] = opts[0] + (/\/$/.test(opts[0]) ? '' : ' '); this.input.value = words.join(' '); }
  else if (opts.length > 1) {
    this.print(this.prompt.textContent + v, null, true);
    this.print(opts.join('   '), 'tdim', true);
    // lo que tienen todas en común
    var pre = opts.reduce(function (a, b) { var i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); });
    if (pre.length > last.length) { words[words.length - 1] = pre; this.input.value = words.join(' '); }
  }
};

/* separar en palabras (con comillas) */
function termWords(s) {
  var out = [], m, re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  while ((m = re.exec(s))) out.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
  return out;
}
/* solo las claves propias (que «constructor» o «__proto__» no cuenten como órdenes) */
function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
var ALIASES = { cv: 'open expediente', lab: 'open laboratorio', ll: 'ls -l', la: 'ls -a', dir: 'ls', cls: 'clear' };

Terminal.prototype.exec = function (line, echo) {
  var self = this;
  line = String(line).slice(0, 500);
  if (line.trim()) Logros.unlock('terminal');
  this.print([{ t: this.prompt.textContent, c: 'tp' }, line], null, true);
  if (line.trim()) { this.hist.push(line); if (this.hist.length > 100) this.hist.shift(); }
  this.hpos = this.hist.length;
  // varias órdenes: a; b  ·  a && b
  line.split(/;|&&/).forEach(function (part) { if (part.trim()) self.run(part.trim()); });
  this.setPrompt();
  if (echo) this.input.focus();
};

Terminal.prototype.run = function (line) {
  var w = termWords(line), cmd = w[0], args = w.slice(1);
  if (own(ALIASES, cmd)) { w = termWords(ALIASES[cmd]).concat(args); cmd = w[0]; args = w.slice(1); }
  // echo con > o >>: escribir en un archivo
  var red = args.indexOf('>') >= 0 ? '>' : args.indexOf('>>') >= 0 ? '>>' : null;
  if (cmd === 'echo' && red) { var k = args.indexOf(red); return this.write(args[k + 1], args.slice(0, k).join(' '), red === '>>'); }
  if (own(CMDS, cmd)) return CMDS[cmd].call(this, args);
  // ./algo.app o el nombre de una aplicación: abrirla
  if (cmd.indexOf('./') === 0 || cmd.indexOf('/') >= 0) return CMDS.open.call(this, [cmd]);
  var id = cmd.replace(/\.app$/, '');
  if (own(APPS, id)) { this.os.launch(id); this.print('Abriendo ' + APPS[id].title + '…', 'tdim'); return; }
  this.print('dsh: orden no encontrada: ' + cmd + '. Prueba con help.', 'terr');
};

/* el nodo de una ruta, o un error ya escrito */
Terminal.prototype.node = function (p, cmd) {
  var abs = FSX.resolve(this.cwd, p), n = FSX.get(abs);
  if (!n) this.print(cmd + ': ' + p + ': no existe ese archivo o directorio', 'terr');
  return n ? { abs: abs, n: n } : null;
};
/* cómo se ve un nombre en ls (y qué pasa al pulsarlo) */
Terminal.prototype.entry = function (name, n, abs) {
  var q = /\s/.test(abs) ? '"' + abs + '"' : abs;
  if (n.type === 'dir') return { t: name + '/', c: 'tdir', run: 'cd ' + q + ' && ls', raw: true };
  if (n.type === 'app') return { t: name, c: 'tapp', run: 'open ' + q, raw: true };
  if (n.type === 'link') return { t: name, c: 'tlink', run: 'open ' + q, raw: true };
  if (n.type === 'bin') return { t: name, c: 'tbin', run: 'man ' + name, raw: true };
  return { t: name, c: 'tfile', run: 'cat ' + q, raw: true };
};
Terminal.prototype.write = function (p, text, append) {
  if (!p) return this.print('dsh: falta el nombre del archivo', 'terr');
  var abs = FSX.resolve(this.cwd, p), dir = FSX.get(FSX.parent(abs)), name = FSX.name(abs), n = dir && dir.type === 'dir' && own(dir.kids, name) && dir.kids[name];
  if (!dir || dir.type !== 'dir') return this.print('dsh: ' + p + ': no existe ese directorio', 'terr');
  if (n && n.type !== 'file') return this.print('dsh: ' + p + ': no es un archivo de texto', 'terr');
  if (!n && !FSX.okName(name)) return this.print('dsh: nombre no válido: ' + name, 'terr');
  if (n && n.locked) return this.print('dsh: ' + p + ': permiso denegado', 'terr');
  if (!n) n = dir.kids[name] = fsFile('', { mine: true });
  n.text = (append && n.text ? n.text + '\n' : '') + text;
};

function fmtSize(n) { return n.type === 'dir' ? 4096 : n.type === 'file' ? (n.text || '').length : n.type === 'link' ? n.url.length : 8192; }

var CMDS = {
  help: function () {
    var self = this;
    this.print('Comandos de DiegOS (pulsa uno para probarlo):', 'tg');
    [['ls [-a] [-l] [ruta]', 'lista lo que hay', 'ls'], ['cd <ruta>', 'entra en una carpeta (cd .. sube, cd sola vuelve a casa)', 'cd proyectos'],
      ['pwd', 'dice dónde estás', 'pwd'], ['cat <archivo>', 'enseña un archivo de texto', 'cat ~/documentos/sobre-mi.txt'],
      ['open <app|archivo>', 'abre una aplicación, una carpeta o un enlace', 'open expediente'], ['apps', 'las aplicaciones que hay', 'apps'],
      ['tree', 'el árbol de carpetas', 'tree'], ['calc <cuenta>', 'hace cuentas (sin nada, abre la Calculadora)', 'calc (2+3)*4^2'], ['neofetch', 'quién soy, en versión terminal', 'neofetch'],
      ['tiempo', 'el tiempo que hace ahora en Madrid', 'tiempo'], ['date', 'la fecha y la hora de Madrid', 'date'],
      ['nano <archivo>', 'lo abre en Notas para escribir', 'nano ~/tmp.txt'], ['touch, mkdir, rm, echo', 'crear y borrar (solo lo tuyo, y solo en esta visita)', 'man touch'],
      ['history, clear, whoami, uname, man, exit', 'lo de siempre', 'whoami']
    ].forEach(function (c) { self.print([{ t: c[0], c: 'tc', run: c[2] }, '  ' + c[1]]); });
    this.print('Tab completa nombres · ↑ ↓ repiten órdenes · Esc cierra la ventana.', 'tdim');
  },
  ls: function (args) {
    var self = this, all = args.indexOf('-a') >= 0 || args.indexOf('-la') >= 0 || args.indexOf('-al') >= 0,
      long = args.indexOf('-l') >= 0 || args.indexOf('-la') >= 0 || args.indexOf('-al') >= 0;
    var paths = args.filter(function (a) { return a[0] !== '-'; });
    (paths.length ? paths : ['.']).forEach(function (p) {
      var r = self.node(p, 'ls'); if (!r) return;
      if (r.n.type !== 'dir') { self.print([self.entry(FSX.name(r.abs), r.n, r.abs)]); return; }
      if (paths.length > 1) self.print(p + ':', 'tdim', true);
      var names = Object.keys(r.n.kids).filter(function (n) { return all || n[0] !== '.'; }).sort(function (a, b) {
        var da = r.n.kids[a].type === 'dir', db = r.n.kids[b].type === 'dir'; return da !== db ? (da ? -1 : 1) : a.localeCompare(b);
      });
      if (!names.length) { self.print('(vacío)', 'tdim'); return; }
      if (all && names.some(function (n) { return n[0] === '.'; })) Logros.unlock('oculto');
      if (long) {
        names.forEach(function (n) {
          var k = r.n.kids[n], mode = k.type === 'dir' ? 'drwxr-xr-x' : k.type === 'app' || k.type === 'bin' ? '-rwxr-xr-x' : k.locked ? '-rw-------' : '-rw-r--r--';
          self.print([mode + '  diego  ' + String(fmtSize(k)).padStart(6) + '  ', self.entry(n, k, FSX.resolve(r.abs, n))]);
        });
      } else {
        var parts = [];
        names.forEach(function (n, i) { if (i) parts.push('   '); parts.push(self.entry(n, r.n.kids[n], FSX.resolve(r.abs, n))); });
        self.print(parts);
      }
    });
  },
  cd: function (args) {
    var r = this.node(args[0] || '~', 'cd'); if (!r) return;
    if (r.n.type !== 'dir') return this.print('cd: ' + args[0] + ': no es un directorio', 'terr');
    this.cwd = r.abs;
  },
  pwd: function () { this.print(this.cwd, null, true); },
  cat: function (args) {
    var self = this;
    if (!args.length) return this.print('cat: falta el archivo (prueba: cat ~/documentos/sobre-mi.txt)', 'terr');
    args.forEach(function (p) {
      var r = self.node(p, 'cat'); if (!r) return;
      if (r.n.type === 'dir') return self.print('cat: ' + p + ': es un directorio (prueba ls ' + p + ')', 'terr');
      if (r.n.locked) return self.print('cat: ' + p + ': permiso denegado. Buen intento.', 'terr');
      if (FSX.name(r.abs)[0] === '.') Logros.unlock('oculto');
      if (r.n.item) Logros.find(r.n.item);
      if (r.n.type === 'app') return self.print([p + ' es una aplicación. Para abrirla: ', { t: 'open ' + p, c: 'tc', run: 'open ' + p }]);
      if (r.n.type === 'bin') return self.print(p + ': binario. Para saber qué hace: man ' + FSX.name(r.abs), 'tdim');
      if (r.n.type === 'link') return self.print([r.n.text + ' ', { t: r.n.url, c: 'tlink', run: 'open ' + p }], null, true);
      (r.n.text || '').split('\n').forEach(function (l) { self.print(l || ' ', null, true); });
    });
  },
  open: function (args) {
    var self = this;
    if (!args.length) return this.print('open: ¿qué abro? Prueba open expediente o apps.', 'terr');
    args.forEach(function (p) {
      var id = p.replace(/^\.\//, '').replace(/\.app$/, '');
      if (own(APPS, id) && !FSX.get(FSX.resolve(self.cwd, p))) { self.os.launch(id); self.print('Abriendo ' + APPS[id].title + '…', 'tdim'); return; }
      var r = self.node(p, 'open'); if (!r) return;
      self.os.openPath(r.abs);
      self.print('Abriendo ' + FSX.name(r.abs) + '…', 'tdim');
    });
  },
  apps: function () {
    var self = this;
    Object.keys(APPS).forEach(function (id) { self.print([{ t: id.padEnd(13), c: 'tapp', run: 'open ' + id }, ' ' + APPS[id].desc]); });
  },
  tree: function (args) {
    var self = this, r = this.node(args[0] || '.', 'tree'); if (!r) return;
    var dirs = 0, files = 0;
    this.print([{ t: FSX.pretty(r.abs), c: 'tdir' }]);
    (function walk(n, abs, pre) {
      var names = Object.keys(n.kids).filter(function (k) { return k[0] !== '.'; });
      names.forEach(function (k, i) {
        var last = i === names.length - 1, kid = n.kids[k];
        self.print([pre + (last ? '└── ' : '├── '), self.entry(k, kid, FSX.resolve(abs, k))]);
        if (kid.type === 'dir') { dirs++; walk(kid, FSX.resolve(abs, k), pre + (last ? '    ' : '│   ')); } else files++;
      });
    })(r.n, r.abs, '');
    this.print(dirs + ' directorios, ' + files + ' archivos', 'tdim');
  },
  neofetch: function () {
    var self = this, up = Math.round((Date.now() - this.started) / 60000);
    var logo = ['  ██████╗  ', '  ██╔══██╗ ', '  ██║  ██║ ', '  ██║  ██║ ', '  ██████╔╝ ', '  ╚═════╝  ', '           ', '           ', '           '];
    var info = [
      [{ t: 'diego', c: 'tg' }, '@', { t: 'diegos', c: 'tg' }],
      ['-------------'],
      [{ t: 'Nombre: ', c: 'ty' }, CV.name],
      [{ t: 'Estudia: ', c: 'ty' }, CV[CVL].role],
      [{ t: 'Vive en: ', c: 'ty' }, CV[CVL].place],
      [{ t: 'Sabe: ', c: 'ty' }, cvGroup(0).join(', ')],
      [{ t: 'Idiomas: ', c: 'ty' }, cvGroup(2).join(', ')],
      [{ t: 'SO: ', c: 'ty' }, 'DiegOS 1.0 (retro) · Shell: dsh'],
      [{ t: 'Encendido: ', c: 'ty' }, up < 1 ? 'menos de un minuto' : up + ' min']
    ];
    info.forEach(function (l, i) { self.print([{ t: logo[i] || '           ', c: 'tg' }].concat(l)); });
  },
  tiempo: function () {
    var self = this;
    if (typeof madridWeather !== 'function') return this.print('tiempo: no disponible', 'terr');
    this.print('Mirando por la ventana…', 'tdim');
    madridWeather(function (msg) { self.print(msg, null, true); });   // ya viene traducido
  },
  date: function () {
    var d = new Date().toLocaleString(LANG === 'en' ? 'en-GB' : 'es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.print(t('{0} (hora de Madrid)', d), null, true);
  },
  echo: function (args) { this.print(args.join(' '), null, true); },
  whoami: function () { this.print('diego'); },
  hostname: function () { this.print('diegos'); },
  uname: function (args) { this.print(args[0] === '-a' ? 'DiegOS diegos 1.0.0-retro #1 SMP JavaScript pixel x86_64 GNU/Diego' : 'DiegOS'); },
  history: function () { var self = this; this.hist.forEach(function (h, i) { self.print(String(i + 1).padStart(4) + '  ' + h, null, true); }); },
  clear: function () { this.out.textContent = ''; },
  alias: function () { var self = this; Object.keys(ALIASES).forEach(function (a) { self.print('alias ' + a + "='" + ALIASES[a] + "'", null, true); }); },
  man: function (args) {
    var M = {
      ls: 'ls [-a] [-l] [ruta]: lista una carpeta. -a enseña los ocultos (los que empiezan por punto), -l da detalles.',
      cd: 'cd <ruta>: cambia de carpeta. «..» es la de arriba, «~» tu casa (/home/diego) y «/» la raíz.',
      cat: 'cat <archivo>: escribe el contenido de un archivo de texto.', less: 'less <archivo>: aquí, igual que cat.',
      open: 'open <nombre>: abre una aplicación (open digitos), una carpeta en Archivos, un texto en Notas o un enlace en otra pestaña.',
      'xdg-open': 'xdg-open: igual que open.', apps: 'apps: la lista de aplicaciones.', tree: 'tree [ruta]: el árbol de carpetas.',
      neofetch: 'neofetch: un resumen de quién soy.', tiempo: 'tiempo: el tiempo en Madrid ahora mismo (Open-Meteo).',
      date: 'date: la fecha y la hora de Madrid.', touch: 'touch <archivo>: crea un archivo vacío (dura hasta cerrar la página).',
      mkdir: 'mkdir <carpeta>: crea una carpeta (dura hasta cerrar la página).', rm: 'rm <archivo>: borra lo que hayas creado tú. Lo demás no se toca.',
      nano: 'nano <archivo>: lo abre en Notas para escribir.', echo: 'echo <texto> [> archivo]: escribe el texto, o lo guarda en un archivo (>> lo añade al final).',
      pwd: 'pwd: dónde estás.', clear: 'clear: limpia la pantalla (también Ctrl+L).', history: 'history: las órdenes que has escrito.',
      whoami: 'whoami: quién eres aquí.', hostname: 'hostname: cómo se llama este ordenador.', uname: 'uname [-a]: qué sistema es.',
      exit: 'exit: cierra esta terminal.', sudo: 'sudo: aquí no hace falta.', python: 'python: el intérprete no está, pero el laboratorio sí.',
      alias: 'alias: los atajos (cv, lab, ll…).', calc: 'calc <cuenta>: hace la cuenta (+ - * / ^ %, paréntesis, pi, sqrt, sin, cos, log, ln). Sin nada, abre la Calculadora.', help: 'help: la lista de comandos.', man: 'man <orden>: para qué sirve una orden.'
    };
    if (!args[0]) return this.print('man: ¿de qué orden? Por ejemplo: man ls', 'terr');
    this.print(own(M, args[0]) ? M[args[0]] : 'No hay manual para ' + args[0] + '.', own(M, args[0]) ? '' : 'terr');
  },
  touch: function (args) {
    var self = this;
    if (!args.length) return this.print('touch: falta el nombre', 'terr');
    args.forEach(function (p) { if (!FSX.get(FSX.resolve(self.cwd, p))) self.write(p, ''); });
  },
  mkdir: function (args) {
    var self = this;
    if (!args.length) return this.print('mkdir: falta el nombre', 'terr');
    args.forEach(function (p) {
      var abs = FSX.resolve(self.cwd, p), dir = FSX.get(FSX.parent(abs)), name = FSX.name(abs);
      if (!dir || dir.type !== 'dir') return self.print('mkdir: ' + p + ': no existe el directorio de arriba', 'terr');
      if (own(dir.kids, name)) return self.print('mkdir: ' + p + ': ya existe', 'terr');
      if (!FSX.okName(name)) return self.print('mkdir: nombre no válido: ' + name, 'terr');
      dir.kids[name] = Object.assign(fsDir(), { mine: true });
    });
  },
  rm: function (args) {
    var self = this, files = args.filter(function (a) { return a[0] !== '-'; });
    if (args.join(' ').indexOf('-rf') >= 0 && (files.indexOf('/') >= 0 || files.indexOf('~') >= 0 || files.indexOf('*') >= 0))
      return this.print('¿Borrar mi portfolio entero? Ni hablar. Ha costado mucho hacerlo.', 'terr');
    if (!files.length) return this.print('rm: falta el archivo', 'terr');
    files.forEach(function (p) {
      var r = self.node(p, 'rm'); if (!r) return;
      if (!r.n.mine) return self.print('rm: ' + p + ': mejor no, forma parte del portfolio', 'terr');
      if (r.n.type === 'dir' && Object.keys(r.n.kids).length && args.indexOf('-r') < 0 && args.indexOf('-rf') < 0) return self.print('rm: ' + p + ': no está vacía (usa rm -r)', 'terr');
      if (self.cwd === r.abs || self.cwd.indexOf(r.abs + '/') === 0) self.cwd = FSX.parent(r.abs);
      delete FSX.get(FSX.parent(r.abs)).kids[FSX.name(r.abs)];
    });
  },
  nano: function (args) {
    if (!args[0]) { this.os.launch('notas'); return; }
    var abs = FSX.resolve(this.cwd, args[0]);
    if (!FSX.get(abs)) { this.write(args[0], ''); if (!FSX.get(abs)) return; }
    if (FSX.get(abs).type !== 'file') return this.print('nano: ' + args[0] + ': no es un archivo de texto', 'terr');
    this.os.openPath(abs);
  },
  sudo: function (args) {
    Logros.unlock('sudo');
    if (args[0] === 'rm') return CMDS.rm.call(this, args.slice(1));
    this.print('diego no está en el archivo sudoers. Este incidente será reportado… a Patricio, el conejo.', 'terr');
  },
  calc: function (args) {
    if (!args.length) { this.os.launch('calculadora'); return; }
    try { this.print(calcFmt(calcEval(args.join(' '))), 'tg', true); } catch (e) { this.print('calc: ' + e.message, 'terr', true); }
  },
  python: function () { this.print('Python no está instalado en DiegOS, pero mis modelos sí: prueba open laboratorio.', 'tdim'); },
  exit: function () { this.os.close(this.win); }
};
CMDS.less = CMDS.more = CMDS.cat;
CMDS['xdg-open'] = CMDS.open;
CMDS.python3 = CMDS.python;
CMDS.vim = CMDS.vi = CMDS.notas = CMDS.nano;
