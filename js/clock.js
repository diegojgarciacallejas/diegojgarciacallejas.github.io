/* Reloj: la hora de España (Europe/Madrid, con su horario de verano) y la del ordenador del visitante.
   spainTime() la usan las agujas del reloj de pared; ClockPanel es lo que se abre al interactuar con él. */
var CLOCK_TZ = 'Europe/Madrid';
var CLOCK_FMT = (function () {
  function f(o) { try { return new Intl.DateTimeFormat(LANG === 'en' ? 'en-GB' : 'es-ES', o); } catch (e) { return null; } }
  return {
    hms: f({ timeZone: CLOCK_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }),
    date: f({ timeZone: CLOCK_TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    zone: f({ timeZone: CLOCK_TZ, timeZoneName: 'shortOffset' }),
    local: f({ hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
  };
})();

/* dígitos en pixel art (5 x 7) para la hora del panel: se leen mejor que cualquier fuente a ese tamaño */
var CLOCK_DIGITS = {
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ':': ['...', '...', '.#.', '...', '.#.', '...', '...']
};
/* pinta un texto con CLOCK_DIGITS centrado en (cx, cy); px = tamaño de cada píxel */
function drawClockDigits(g, str, cx, cy, px, color, shadow) {
  var cols = 0;
  str.split('').forEach(function (ch, i) { cols += CLOCK_DIGITS[ch][0].length + (i ? 1 : 0); });
  var x = Math.round(cx - cols * px / 2), y = Math.round(cy - 7 * px / 2);
  g.clear();
  str.split('').forEach(function (ch) {
    var rows = CLOCK_DIGITS[ch];
    rows.forEach(function (r, j) {
      for (var i = 0; i < r.length; i++) if (r[i] === '#') {
        g.fillStyle(shadow, 1).fillRect(x + i * px + px / 2, y + j * px + px / 2, px, px);   // sombra
      }
    });
    rows.forEach(function (r, j) {
      for (var i = 0; i < r.length; i++) if (r[i] === '#') g.fillStyle(color, 1).fillRect(x + i * px, y + j * px, px, px);
    });
    x += (rows[0].length + 1) * px;
  });
}

/* hora de España como números { h, m, s }; si el navegador no sabe de zonas horarias, la del ordenador */
function spainTime(d) {
  d = d || new Date();
  if (!CLOCK_FMT.hms) return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
  var t = CLOCK_FMT.hms.format(d).split(':').map(Number);
  return { h: t[0], m: t[1], s: t[2] };
}

function ClockPanel(scene) {
  var s = this.scene = scene, W = CFG.W, self = this;
  var w = 420, h = 236, bx = (W - w) / 2, by = 132;
  this.timeY = by + 64;
  var c = this.box = s.add.container(0, 0).setDepth(1000).setVisible(false);
  // velo oscuro sobre el cuarto
  c.add(s.add.rectangle(0, 0, W, CFG.H, 0x0f0a1e, 0.55).setOrigin(0));
  // caja con el mismo estilo que el diálogo y pestaña con el título
  var b = s.add.graphics();
  b.fillStyle(0x000000, 0.45).fillRect(bx + 4, by + 4, w, h);
  b.fillStyle(0x9c8ad6, 1).fillRect(bx, by, w, h);
  b.fillStyle(0x120c22, 1).fillRect(bx + 3, by + 3, w - 6, h - 6);
  b.fillStyle(0x120c22, 1).fillRect(bx, by - 28, 96, 31);
  b.fillStyle(0x7aa7ee, 1).fillRect(bx + 3, by - 25, 90, 25);
  b.fillStyle(0xa9c6f5, 1).fillRect(bx + 3, by - 25, 90, 2);
  c.add(b);
  var ui = { fontFamily: CFG.fontUi };
  c.add(s.add.text(bx + 48, by - 12, t('Reloj'), Object.assign({ fontSize: '21px', color: '#120b1c' }, ui)).setOrigin(0.5));
  this.timeG = s.add.graphics(); this.shown = '';
  this.dateT = s.add.text(W / 2, by + 122, '', Object.assign({ fontSize: '21px', color: '#ecebdd' }, ui)).setOrigin(0.5);
  this.zoneT = s.add.text(W / 2, by + 150, '', Object.assign({ fontSize: '16px', color: CFG.c.dim }, ui)).setOrigin(0.5);
  this.pcT = s.add.text(W / 2, by + 180, '', Object.assign({ fontSize: '17px', color: CFG.c.blueTxt }, ui)).setOrigin(0.5);
  var hint = s.add.text(W / 2, by + h - 18, t('Enter, Esc o clic para cerrar'), Object.assign({ fontSize: '14px', color: CFG.c.gray }, ui)).setOrigin(0.5);
  c.add([this.timeG, this.dateT, this.zoneT, this.pcT, hint]);

  this.open = false;
  this.tick = s.time.addEvent({ delay: 250, loop: true, callback: function () { if (self.open) self.refresh(); } });
  s.input.keyboard.on('keydown', function (e) {
    if (self.open && /^(Enter|NumpadEnter|Escape|Space|KeyE)$/.test(e.code)) self.close();
  });
  // el clic que abre el panel no debe cerrarlo
  s.input.on('pointerdown', function () { if (self.open && s.time.now - self.openedAt > 200) self.close(); });
}

ClockPanel.prototype.show = function () {
  this.open = true; this.openedAt = this.scene.time.now;
  this.refresh(); this.box.setVisible(true);
};
ClockPanel.prototype.close = function () { this.open = false; this.box.setVisible(false); };

ClockPanel.prototype.refresh = function () {
  var d = new Date(), F = CLOCK_FMT, st = spainTime(d);
  function two(n) { return (n < 10 ? '0' : '') + n; }
  var es = two(st.h) + ':' + two(st.m) + ':' + two(st.s);
  if (es !== this.shown) { this.shown = es; drawClockDigits(this.timeG, es, CFG.W / 2, this.timeY, 6, 0xf3eedc, 0x4b3a82); }
  var date = F.date ? F.date.format(d) : d.toLocaleDateString('es-ES');
  this.dateT.setText(date.charAt(0).toUpperCase() + date.slice(1));
  var off = '';
  if (F.zone) { var p = F.zone.formatToParts(d).filter(function (x) { return x.type === 'timeZoneName'; })[0]; off = p ? ' · ' + p.value : ''; }
  this.zoneT.setText(t('Hora peninsular de España') + off);
  // la del ordenador del visitante, solo si es distinta
  var pc = F.local ? F.local.format(d) : d.toTimeString().slice(0, 8);
  var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { }
  this.pcT.setText(pc === es ? t('Tu ordenador marca la misma hora') : t('En tu ordenador') + (tz ? ' (' + tz.replace(/_/g, ' ') + ')' : '') + ': ' + pc);
};

/* ¿Es de día en Madrid? Amanecer y anochecer aproximados según la época del año (en hora local, con su horario
   de verano): en junio sale el sol hacia las 6:45 y se pone hacia las 21:50; en diciembre, 8:40 y 17:55.
   Devuelve 'day', 'dusk' (amanecer o atardecer) o 'night'. Para probar, ?hora=23 (o 7:30) en la dirección. */
function dayPhase() {
  var q = location.search.match(/[?&]hora=(\d{1,2})(?:[.:](\d{1,2}))?/), t = spainTime();
  var h = q ? +q[1] + (q[2] ? +q[2] / 60 : 0) : t.h + t.m / 60;
  var d = new Date(), doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  var w = Math.sin((doy - 80) / 365 * 2 * Math.PI), rise = 7.7 - 0.95 * w, set = 19.85 + 1.95 * w;
  if (h < rise - 0.5 || h > set + 0.6) return 'night';
  if (h < rise + 0.6 || h > set - 0.5) return 'dusk';
  return 'day';
}
