/* El patio: jardín con huerto extremeño, cerezo con columpio y portería, una calle con gente y coches, y Madrid al fondo.
   Ocupa toda la pantalla: 320 x 180 píxeles de arte ampliados x3 (más cerca que el cuarto, para que
   el patio no parezca enorme al lado de la casa). Se llega por la puerta izquierda del cuarto. */
var YARD = {
  W: 320, H: 180,
  tree: { foot: 128 },                                   // y de la base de lo que tapa al muñeco
  goal: { x0: 100, x1: 135, top: 92, foot: 114 },        // portería (a la izquierda, junto al cerezo): entre postes y larguero
  swing: { x: 54, y: 101 },                              // de dónde cuelga el columpio
  lanes: [{ y: 64, dir: -1 }, { y: 72, dir: 1 }],        // carriles: y de las ruedas y sentido
  cross: { x0: 150, x1: 170 },                           // paso de cebra
  stop: { right: 148, left: 172 },                       // dónde paran los coches que van a la derecha (su morro) y a la izquierda
  // los dos semáforos: x e y de la caja de luces (5 x 10 píxeles) y la y donde está el suelo de su poste; el de enfrente queda en la acera de enfrente
  heads: [{ x: 143, y: 51, base: 78, depth: 5 }, { x: 173, y: 35, base: 55, depth: 2.6 }],
  light: [['green', 11000], ['amber', 2200], ['red', 6500]],   // el ciclo: verde, ámbar, rojo (pasa la gente)
  walks: [{ y: 55, scale: 2 }, { y: 78, scale: 3 }],     // aceras: y de los pies y tamaño (la de enfrente, más lejos)
  lamps: [40, 120, 200, 280]                             // farolas de nuestra acera (x)
};
var STAGE_YARD = { OX: 0, OY: 0, S: 3, k: 1.5 };        // personajes algo más pequeños que en el cuarto

var WALK_YARD = {
  speed: 46, stride: 5, feet: [7, 3], cell: 4,
  floor: [6, 92, 298, 166],
  grid: [0, 320],
  passes: [[290, 121, 30, 22]],                          // la puerta lateral de la casa (a la derecha)
  exits: [{ id: 'casa', hit: [311, 112, 9, 40], near: [272, 108, 48, 48], tag: [318, 106], align: 1, inside: [284, 132] }],
  blocks: [
    [27, 122, 14, 7],     // tronco del árbol
    [45, 117, 18, 8],     // columpio
    [150, 146, 106, 22],  // huerto
    [246, 142, 5, 4],     // poste del cartelito del huerto
    [97, 108, 6, 7],      // poste izquierdo
    [133, 108, 6, 7],     // poste derecho
    [114, 123, 9, 6],     // balón
    [282, 106, 10, 8],    // maceta junto a la puerta
    [282, 150, 10, 8]     // maceta junto a la puerta
  ]
};

/* objetos del patio (como ROOM_OBJECTS); nombres y textos en CFG.objects. La portería abre el minijuego */
var YARD_OBJECTS = [
  { id: 'porteria', rect: [96, 86, 46, 46],  at: [118, 140], mark: [118, 88], area: [96, 104, 46, 24] },   // area: los postes y el balón
  { id: 'columpio', rect: [12, 80, 54, 48],   at: [74, 124],  mark: [54, 98], area: [27, 117, 36, 12] },
  { id: 'huerto',   rect: [148, 144, 110, 26], at: [200, 140], mark: [203, 146], area: [150, 146, 106, 22] },
  { id: 'ciudad',   rect: [0, 8, 320, 46],    at: [160, 98],  mark: [160, 80], r: WALL_R },
  // objetos ocultos (logros.js): una pelota entre los setos y una bellota bajo el cerezo
  { id: 'tenis',    item: 'tenis',   rect: [10, 158, 8, 8],  at: [14, 164], mark: [14, 157], r: 8 },
  { id: 'bellota',  item: 'bellota', rect: [16, 121, 8, 8],  at: [20, 127], mark: [20, 120], r: 8 },
  // quien pase por nuestra acera: sigue a la persona más cercana a Diego (Yard.pickNeighbour); «off» si no hay nadie
  { id: 'vecino',   rect: [0, 0, 0, 0],       at: [0, 0],     mark: [0, 0], area: [0, 0, 0, 0], off: true, first: true }
];

/* ---- dibujo ---- */
function yardPaint(ctx) {
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function disc(cx, cy, r, c) { for (var dy = -r; dy <= r; dy++) { var w = Math.floor(Math.sqrt(r * r - dy * dy)); R(cx - w, cy + dy, 2 * w + 1, 1, c); } }
  // cordillera: por cada columna, altura interpolada entre picos; nieve por encima de «snow»
  function ridge(peaks, bottom, col, snow, shade) {
    for (var x = 0; x < YARD.W; x++) {
      for (var k = 0; k < peaks.length - 1 && peaks[k + 1][0] < x; k++);
      var a = peaks[k], b = peaks[Math.min(k + 1, peaks.length - 1)], u = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
      var y = Math.round(a[1] + (b[1] - a[1]) * u);
      R(x, y, 1, bottom - y, (shade && b[1] > a[1]) ? shade : col);              // la ladera que baja, en sombra
      if (snow && y < snow) R(x, y, 1, Math.min(snow - y, 4), '#f4f8fc');
    }
  }
  return { R: R, disc: disc, ridge: ridge };
}

/* night: sin sol (la luna y las luces van en capas aparte). Apunta las ventanas en YARD.windows para encenderlas de noche */
/* el cielo según la hora de Madrid (los mismos colores que la ventana del cuarto): de día, azul con el sol alto;
   al atardecer, de morado a naranja con el sol bajo junto a las montañas; de noche, sin sol (la luna va encima) */
var SKY_BANDS = { day: ['#6fbcf0', '#8fcdf5', '#b3defa', '#d2edfb'], dusk: ['#5d63ad', '#9c7ab4', '#e88a7a', '#f6c27a'] };
var SUN = { day: { y: 16, c: ['#fff2b0', '#ffe36e', '#fff6c4'] }, dusk: { y: 27, c: ['#ffc58a', '#ff9a5a', '#ffd9a8'] } };   // al atardecer, medio sol asoma sobre la sierra
function paintSky(p, phase, sunX, bottom, sunY) {
  var b = SKY_BANDS[phase === 'dusk' ? 'dusk' : 'day'], h = bottom / 4;
  b.forEach(function (c, i) { p.R(0, Math.round(i * h), YARD.W, Math.ceil(h) + 1, c); });
  var s = SUN[phase];
  var y = sunY != null && phase === 'dusk' ? sunY : s && s.y;
  if (s) { p.disc(sunX, y, 10, s.c[0]); p.disc(sunX, y, 7, s.c[1]); p.disc(sunX - 1, y - 1, 4, s.c[2]); }
}
function drawYardBase(ctx, phase) {
  var p = yardPaint(ctx), R = p.R, disc = p.disc, W = YARD.W, x, y, k;
  if (phase === true) phase = 'night';
  YARD.windows = [];
  paintSky(p, phase || 'day', 286, 54);
  // montañas con nieve
  p.ridge([[0, 34], [30, 24], [62, 16], [92, 28], [120, 14], [150, 26], [184, 12], [214, 24], [246, 18], [280, 30], [320, 22]], 52, '#a7bdd6', 21, '#94accb');
  p.ridge([[0, 40], [44, 30], [80, 38], [118, 28], [160, 40], [200, 30], [240, 38], [282, 26], [320, 34]], 52, '#7393b6', 31, '#6582a6');
  // Madrid al fondo: las Cuatro Torres, las torres KIO inclinadas, una grúa y bloques de pisos delante
  [[204, 8, 40, '#9fb6c9', 'arco'], [216, 8, 42, '#7d97ad', 'jardin'], [228, 8, 41, '#b9c9d6', 'anillo'], [240, 9, 37, '#8aa3b8', 'antena']].forEach(function (t) {
    var tx = t[0], tw = t[1], top = 52 - t[2];
    R(tx, top, tw, t[2], t[3]); R(tx + tw - 2, top, 2, t[2], 'rgba(0,0,0,.12)');
    for (y = top + 2; y < 52; y += 3) { R(tx, y, tw - 2, 1, 'rgba(255,255,255,.2)'); YARD.windows.push([tx, y, tw - 2, 1]); }   // plantas
    if (t[4] === 'arco') { R(tx + 1, top - 2, tw - 2, 2, t[3]); R(tx + 2, top - 3, tw - 4, 1, t[3]); }
    if (t[4] === 'jardin') { R(tx, top - 4, tw, 4, '#d6e6f0'); R(tx + 1, top - 3, tw - 2, 1, '#6cbf7a'); }
    if (t[4] === 'anillo') R(tx - 1, top + 1, tw + 2, 2, '#4a5468');
    if (t[4] === 'antena') R(tx + 4, top - 4, 1, 4, '#4a5468');
  });
  for (k = 0; k < 28; k++) {                                                               // torres KIO, una hacia la otra
    var sh = Math.round(k * 0.32), ky = 51 - k, glass = k % 4 ? '#7d8fa3' : '#a9b8c8';
    R(106 + sh, ky, 9, 1, glass); R(140 - sh, ky, 9, 1, glass);
    R(114 + sh, ky, 1, 1, 'rgba(0,0,0,.15)'); R(148 - sh, ky, 1, 1, 'rgba(0,0,0,.15)');
  }
  R(125, 20, 1, 32, '#f2c14e'); R(113, 20, 28, 1, '#f2c14e'); R(122, 21, 7, 1, '#f2c14e'); R(136, 21, 1, 6, '#4a5468');   // grúa
  [[0, 16, 14, '#d9a98a'], [18, 12, 10, '#e6d3b0'], [32, 20, 17, '#eeeae0'], [54, 14, 12, '#c98a6a'], [70, 18, 20, '#e6d3b0'],
    [90, 13, 13, '#d9a98a'], [150, 14, 12, '#eeeae0'], [166, 18, 16, '#c98a6a'], [186, 12, 11, '#e6d3b0'], [254, 14, 15, '#d9a98a'],
    [270, 14, 12, '#eeeae0'], [286, 16, 18, '#c98a6a'], [304, 16, 13, '#e6d3b0']].forEach(function (b, i) {
    var bx = b[0], bw = b[1], top = 52 - b[2];
    R(bx, top, bw, b[2], b[3]); R(bx, top, bw, 1, 'rgba(0,0,0,.15)'); R(bx + bw - 2, top, 2, b[2], 'rgba(0,0,0,.08)');
    for (y = top + 2; y < 50; y += 3) for (x = bx + 1; x < bx + bw - 2; x += 3) { R(x, y, 2, 2, (x * 3 + y + i) % 11 ? '#5f7491' : '#ffe9a8'); YARD.windows.push([x, y, 2, 2]); }
    if (i % 3 === 0) R(bx + 3, top - 3, 1, 3, '#4a5468');                                // antenas
  });
  for (x = 0; x < W; x += 9) disc(x + 4, 51, 3, x % 18 ? '#5f9e5c' : '#4f8a4c');            // árboles de la calle
  // acera de enfrente, carretera y nuestra acera
  R(0, 52, W, 4, '#d6cfc2'); R(0, 55, W, 1, '#a89f90');
  R(0, 56, W, 16, '#545a68'); R(0, 56, W, 1, '#464b57');
  for (x = 3; x < W; x += 18) R(x, 63, 9, 1, '#f3eedc');
  // paso de cebra con sus líneas de parada y los postes de los semáforos (las luces se pintan aparte: cambian)
  for (x = YARD.cross.x0 + 1; x < YARD.cross.x1; x += 4) R(x, 57, 3, 14, '#ece7d9');
  R(YARD.stop.right, 64, 1, 8, '#f3eedc'); R(YARD.stop.left, 56, 1, 8, '#f3eedc');
  YARD.heads.forEach(function (h) { R(h.x + 2, h.y + 10, 1, h.base - h.y - 10, '#4a5468'); R(h.x + 1, h.base - 1, 3, 1, '#4a5468'); });
  R(0, 72, W, 1, '#a89f90'); R(0, 73, W, 6, '#d6cfc2');
  for (x = 0; x < W; x += 12) R(x, 73, 1, 6, '#c4bcae');
  // farolas en nuestra acera
  YARD.lamps.forEach(function (lx) { R(lx, 60, 1, 18, '#4a5468'); R(lx - 2, 59, 5, 2, '#4a5468'); R(lx - 1, 61, 3, 1, '#ffe9a8'); R(lx - 1, 77, 3, 1, '#4a5468'); });
  // valla blanca
  R(0, 79, W, 9, '#7cc47c');
  R(0, 81, W, 1, '#d9cdb6'); R(0, 85, W, 1, '#d9cdb6');
  for (x = 1; x < W; x += 5) { R(x, 79, 3, 8, '#fffaf0'); R(x + 1, 78, 1, 1, '#fffaf0'); R(x + 2, 80, 1, 7, '#e2d8c6'); }
  R(0, 87, W, 1, 'rgba(0,0,0,.12)');
  // césped con franjas y matas
  R(0, 88, W, 75, '#7cc47c');
  for (x = 0; x < W; x += 40) R(x, 88, 20, 75, '#73bb74');
  for (k = 0; k < 70; k++) {
    x = (k * 97) % W; y = 92 + (k * 53) % 66;
    if (k % 5) { R(x, y, 1, 2, '#5aa05e'); R(x + 2, y + 1, 1, 1, '#5aa05e'); }
    else R(x, y, 1, 1, ['#fffaf0', '#f2c14e', '#ef8fa8'][k % 3]);
  }
  // sombras del árbol, la portería y el balón
  ctx.fillStyle = 'rgba(30,60,30,.18)';
  for (y = 0; y < 6; y++) { var w2 = Math.round(22 * Math.sqrt(1 - Math.pow((y - 2.5) / 3, 2))); ctx.fillRect(34 - w2, 124 + y, w2 * 2, 1); }
  R(98, 114, 41, 2, 'rgba(0,0,0,.12)'); R(115, 128, 8, 1, 'rgba(0,0,0,.2)');
  // huerto extremeño junto a la casa: una fila de flores, otra de tomateras y otra de pimientos
  var hx = 150, hy = 146;
  R(hx, hy, 106, 22, '#8f6440'); R(hx + 2, hy + 2, 102, 18, '#6b4428');
  for (k = 0; k < 17; k++) {                                                                // flores
    var fx = hx + 5 + k * 6, fc = ['#d9665a', '#f2c14e', '#fffaf0', '#ef8fa8', '#9b6fd1'][k % 5];
    R(fx, hy + 4, 1, 3, '#3a7845'); R(fx - 1, hy + 2, 3, 2, fc); R(fx, hy + 1, 1, 1, fc);
  }
  for (k = 0; k < 8; k++) {                                                                 // tomateras con su caña
    var tx = hx + 8 + k * 12;
    R(tx + 2, hy + 6, 1, 8, '#c9a46a'); disc(tx + 2, hy + 10, 3, '#4f9a5a'); R(tx, hy + 8, 2, 1, '#3a7845');
    R(tx, hy + 10, 2, 2, '#e04a3a'); R(tx + 3, hy + 8, 2, 2, '#e04a3a'); R(tx + 3, hy + 12, 2, 2, '#f0a030');
  }
  for (k = 0; k < 13; k++) {                                                                // pimientos (los del pimentón de la Vera)
    var px = hx + 6 + k * 8;
    disc(px, hy + 16, 2, '#4f9a5a'); R(px - 2, hy + 17, 1, 3, k % 3 ? '#d23c2c' : '#3f9a3a'); R(px + 2, hy + 17, 1, 3, '#d23c2c');
  }
  R(hx + 98, hy - 6, 1, 8, '#8f6440'); R(hx + 94, hy - 8, 10, 4, '#e6cfa3'); R(hx + 95, hy - 7, 8, 1, '#3f9a68');   // cartelito
  // patio de losas delante de la puerta lateral y macetas
  for (y = 110; y < 152; y += 6) for (x = 254 + ((y / 6) % 2) * 4; x < 298; x += 8) { R(x, y, 8, 6, '#b8ad99'); R(x + 1, y + 1, 6, 4, '#d8cfbd'); }
  [[282, 104], [282, 148]].forEach(function (m) {
    R(m[0], m[1] + 3, 10, 7, '#c96b3c'); R(m[0] - 1, m[1] + 2, 12, 2, '#a25330');
    disc(m[0] + 5, m[1], 4, '#4f9a5a'); R(m[0] + 3, m[1] - 2, 2, 2, '#d9665a'); R(m[0] + 6, m[1], 2, 2, '#f2c14e');
  });
  // seto con flores que cierra el jardín por abajo
  R(0, 168, W, 12, '#3a7845');
  for (x = 0; x < W; x += 8) disc(x + 4, 169, 5, x % 16 ? '#4f9a5a' : '#46905a');
  for (x = 5; x < W; x += 13) R(x, 166 + (x % 3), 2, 2, ['#ef8fa8', '#fffaf0', '#f2c14e'][x % 3]);
  // la casa, a la derecha: su pared lateral con ventanas y la puerta abierta (por aquí se vuelve al cuarto)
  R(298, 84, 22, 96, '#8f6440'); R(300, 84, 20, 96, '#e6cfa3');
  for (y = 88; y < 180; y += 4) R(300, y, 20, 1, '#d9bf90');
  [[90, 22], [152, 22]].forEach(function (v) {
    R(302, v[0] - 1, 16, v[1] + 2, '#fdf8ee'); R(303, v[0], 14, v[1], '#7fc6ea'); R(303, v[0] + v[1] / 2 - 1, 14, 2, '#fdf8ee'); R(303, v[0], 3, v[1], '#a9defb');
  });
  R(298, 118, 22, 28, '#5a3d28'); R(300, 121, 20, 22, '#c99560');
  for (x = 305; x < 320; x += 5) R(x, 121, 1, 22, '#a87642');
  R(316, 121, 4, 22, 'rgba(40,20,40,.35)');
  R(290, 123, 7, 18, '#7aa7ee'); R(291, 125, 5, 14, '#5b84c9');                             // felpudo
}

/* de noche: casi todas las ventanas de Madrid encendidas (las torres, por plantas sueltas) */
function drawYardLights(ctx) {
  YARD.windows.forEach(function (v, i) {
    var lit = v[3] === 1 ? (i * 7) % 5 < 2 : (i * 13) % 10 < 7;
    if (!lit) return;
    ctx.fillStyle = v[3] === 1 ? '#cfe0ff' : (i % 4 ? '#ffd98a' : '#ffe9c0');
    ctx.fillRect(v[0], v[1], v[2], v[3]);
  });
}
/* cerezo (como los del Jerte) con la rama del columpio: tapa al muñeco si pasa por detrás */
function drawYardTree(ctx) {
  var p = yardPaint(ctx), R = p.R, disc = p.disc;
  R(29, 100, 9, 28, '#8a5a32'); R(34, 100, 4, 28, '#6b4428'); R(26, 126, 15, 2, '#6b4428');
  R(36, 100, 26, 3, '#8a5a32'); R(36, 102, 26, 1, '#6b4428');                               // rama del columpio
  disc(33, 86, 18, '#3a7845'); disc(20, 94, 11, '#3a7845'); disc(48, 92, 12, '#3a7845');
  disc(30, 81, 12, '#4f9a5a'); disc(18, 91, 7, '#4f9a5a'); disc(46, 88, 8, '#4f9a5a');
  disc(26, 76, 5, '#6cbf7a'); disc(16, 88, 3, '#6cbf7a'); disc(44, 84, 4, '#6cbf7a');
  [[22, 88], [38, 78], [50, 94], [28, 96], [14, 84], [42, 70]].forEach(function (a) {                    // cerezas, por parejas
    R(a[0], a[1] - 2, 1, 2, '#3a5a2a'); R(a[0] + 2, a[1] - 2, 1, 2, '#3a5a2a');
    R(a[0] - 1, a[1], 2, 2, '#b3192b'); R(a[0] + 2, a[1], 2, 2, '#b3192b');
  });
}
/* portería: red, postes y larguero */
function drawYardGoal(ctx) {
  var R = yardPaint(ctx).R, g = YARD.goal, x, y;
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  for (x = g.x0 + 2; x < g.x1; x += 3) ctx.fillRect(x, g.top + 3, 1, g.foot - g.top - 3);
  for (y = g.top + 5; y < g.foot; y += 3) ctx.fillRect(g.x0, y, g.x1 - g.x0, 1);
  R(g.x0 - 3, g.top, 3, g.foot - g.top, '#ffffff'); R(g.x0 - 1, g.top, 1, g.foot - g.top, '#d9e2ea');
  R(g.x1, g.top, 3, g.foot - g.top, '#ffffff'); R(g.x1 + 2, g.top, 1, g.foot - g.top, '#d9e2ea');
  R(g.x0 - 3, g.top, g.x1 - g.x0 + 6, 3, '#ffffff'); R(g.x0 - 3, g.top + 2, g.x1 - g.x0 + 6, 1, '#d9e2ea');
}

/* coches de perfil (mirando a la derecha); cada color, su paleta */
var CLOUD_ROWS = ['....wwww........', '..wwwwwwww.www..', '.wwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', '.ssssssssssssss.'];
var BALL_ROWS = ['..oooo..', '.owwkwo.', 'owwkkkwo', 'owwwkwwo', 'okwwwwko', 'okkwwkko', '.owwwwo.', '..oooo..'];

/* gente que pasea (de perfil, mirando a la derecha; dos fotogramas: a = paso, b = piernas juntas).
   h pelo, s piel, k ojo, t ropa, T manga, p pantalón, o zapatos, c bastón */
var WALKERS = {
  adult: {
    head: ['..hhhh..', '.hhhhhh.', '.hhhsks.', '.hhsssss', '..ssss..', '..tttt..', '.ttTttt.', '.ttTttt.', '.ttTttt.', '..tstt..'],
    a: ['..pppp..', '..pppp..', '.pp..pp.', '.pp..pp.', 'pp....pp', 'oo....oo'],
    b: ['..pppp..', '..pppp..', '..pppp..', '..pp.p..', '..pp.p..', '..ooooo.'],
    speed: [13, 18]
  },
  kid: {
    head: ['..hhhh..', '.hhhhhh.', '.hhhsks.', '.hhsssss', '..ssss..', '..tttt..', '.ttTttt.', '..tstt..'],
    a: ['..pppp..', '.pp..pp.', 'oo....oo'],
    b: ['..pppp..', '..pp.p..', '..ooooo.'],
    speed: [18, 24]
  },
  elder: {
    head: ['...hhhh..', '..hhhhhh.', '..hhhsks.', '..hhsssss', '...ssss..', '..ttttt..', '.ttTtttt.', '.ttTtttt.', '.ttTtttt.', '..ttttsc.'],
    a: ['..pppp.c.', '..pppp.c.', '.pp..pp.c', '.pp..pp.c', 'pp....ppc', 'oo....ooc'],
    b: ['..pppp.c.', '..pppp.c.', '..pppp..c', '..pp.p..c', '..pp.p..c', '..ooooo.c'],
    speed: [7, 10]
  }
};
var WALKER_LOOKS = [
  { h: '#3a2a20', s: '#f2c18e', t: '#d9665a', T: '#b04a40', p: '#3c4a6b', o: '#2b1d2e' },
  { h: '#d9a441', s: '#f8d0a8', t: '#4f8fd9', T: '#3c72b8', p: '#5a4a3a', o: '#2b1d2e' },
  { h: '#1b1b22', s: '#a8714a', t: '#f2c14e', T: '#c9982e', p: '#2e3350', o: '#2b1d2e' },
  { h: '#7a3a20', s: '#f2c18e', t: '#6cbf7a', T: '#4f9a5a', p: '#3c4a6b', o: '#5a3d28' },
  { h: '#5a3d28', s: '#d99a6c', t: '#9b6fd1', T: '#7a52ad', p: '#2b2f4a', o: '#2b1d2e' }
];
var ELDER_HAIR = ['#e8e4dc', '#c9c4bb', '#b0aba3'];

function ensureYardTextures(scene) {
  var tx = scene.textures;
  function canvas(fn) { var c = roomCanvas(YARD.W, YARD.H); fn(c.getContext('2d')); return c; }
  if (!tx.exists('yard_base')) {
    tx.addCanvas('yard_base_n', canvas(function (c) { drawYardBase(c, 'night'); }));
    tx.addCanvas('yard_base_d', canvas(function (c) { drawYardBase(c, 'dusk'); }));
    tx.addCanvas('yard_base', canvas(function (c) { drawYardBase(c, 'day'); }));
    tx.addCanvas('yard_lights', canvas(drawYardLights));
    tx.addCanvas('yard_tree', canvas(drawYardTree));
    tx.addCanvas('yard_goal', canvas(drawYardGoal));
  }
  // coches: cada modelo (cars.js) en cada color; los que no cambian de color (taxi, policía, autobús), una sola vez
  CAR_MODELS.forEach(function (m) {
    (m.kind === 'fixed' ? [null] : CAR_BODY).forEach(function (b, i) {
      var pal = Object.assign({}, CAR_PAL, m.pal || {}); if (b) { pal.c = b[0]; pal.C = b[1]; }
      makeTexture(scene, 'car_' + m.id + '_' + i, m.rows, pal);
    });
  });
  makeTexture(scene, 'cloud', CLOUD_ROWS, { w: '#ffffff', s: '#e3f2fc' });
  makeTexture(scene, 'ball', BALL_ROWS, { o: '#2b1d2e', w: '#fffaf0', k: '#2b1d2e' });
  // gente: cada tipo con cada aspecto (los abuelos con canas)
  Object.keys(WALKERS).forEach(function (kind) {
    WALKER_LOOKS.forEach(function (look, i) {
      var pal = Object.assign({ k: '#2b1d2e', c: '#8a5a32' }, look);
      if (kind === 'elder') pal.h = ELDER_HAIR[i % ELDER_HAIR.length];
      ['a', 'b'].forEach(function (f) { makeTexture(scene, 'walk_' + kind + i + f, WALKERS[kind].head.concat(WALKERS[kind][f]), pal); });
    });
  });
  // Diego sentado en el columpio: el sprite de frente con las piernas dobladas
  makeTexture(scene, 'diego_sit', SPRITES.diego.slice(0, 29).concat(['...ojjjo.ojjjo..', '...ojjjo.ojjjo..', '...oZZo...oZZo..']));
}

var Yard = new Phaser.Class({
  Extends: Phaser.Scene, initialize: function () { Phaser.Scene.call(this, 'Yard'); },
  init: function (d) { this.fromRoom = !!(d && d.fromRoom); this.spawn = d && d.spawn; this.at = d && d.at; },
  create: function () {
    WALK = WALK_YARD; STAGE = STAGE_YARD;
    fitCamera(this);
    var self = this, S = STAGE.S;
    ensureYardTextures(this);
    // de día, al atardecer o de noche según la hora de Madrid (dayPhase, en clock.js)
    var ph = this.phase = dayPhase(), night = ph === 'night';
    this.add.image(0, 0, { day: 'yard_base', dusk: 'yard_base_d', night: 'yard_base_n' }[ph]).setOrigin(0).setScale(S);
    // el sol brilla un poco (de día) y las nubes cruzan despacio
    if (!night) {
      var sunGlow = this.add.circle(286 * S, SUN[ph].y * S, 16 * S, ph === 'dusk' ? 0xff9a50 : 0xfff2b0, 0.25).setBlendMode(Phaser.BlendModes.ADD).setDepth(1);
      this.tweens.add({ targets: sunGlow, alpha: 0.08, scale: 1.15, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.clouds = [[20, 4, 0.9], [120, 12, 0.6], [200, 2, 0.75], [270, 20, 0.5]].map(function (c) {
      var im = self.add.image(c[0] * S, c[1] * S, 'cloud').setOrigin(0).setScale(S).setDepth(1).setAlpha(night ? 0.25 : 1);
      if (ph === 'dusk') im.setTint(0xffc8b0);   // nubes con la luz del atardecer
      im.sp = c[2]; return im;
    });
    // noche: todo más oscuro y, por encima, estrellas, luna, ventanas encendidas y farolas
    if (ph !== 'day') this.add.rectangle(0, 0, CFG.W, CFG.H, night ? 0x0b1030 : 0xd0603a, night ? 0.55 : 0.18).setOrigin(0).setDepth(600);
    if (night) {
      var stars = this.add.graphics().setDepth(601);
      for (var st = 0; st < 40; st++) stars.fillStyle(st % 3 ? 0xfffbe0 : 0xcfe0ff, 0.5 + (st % 4) * 0.15).fillRect(((st * 89) % 320) * S, ((st * 37) % 30) * S, S, S);
      this.tweens.add({ targets: stars, alpha: 0.6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      var moon = this.add.graphics().setDepth(601);
      moon.fillStyle(0xf4f1dc, 1).fillCircle(286 * S, 16 * S, 7 * S).fillStyle(0xd9d4b8, 1).fillCircle(283 * S, 14 * S, 1.5 * S).fillCircle(289 * S, 19 * S, S);
      glow(this, 286 * S, 16 * S, 22 * S, 0xf4f1dc, 0.35);
      this.add.image(0, 0, 'yard_lights').setOrigin(0).setScale(S).setDepth(601);
      YARD.lamps.forEach(function (lx) {
        glow(self, (lx + 0.5) * S, 61 * S, 9 * S, 0xffd98a, 0.8);                  // la bombilla
        glow(self, (lx + 0.5) * S, 76 * S, 14 * S, 0xffd98a, 0.35).setScale(14 * S / 32, 4 * S / 32);   // luz en la acera
      });
    }
    this.calm = night ? 3 : 1;                                                      // de noche, menos coches y menos gente
    // coches y gente: cada carril y cada acera sacan a alguien de vez en cuando
    this.cars = []; this.nextCar = [500, 1600];
    this.makeLights(night || ph === 'dusk');
    this.walkers = []; this.nextWalker = [300, 1200]; this.talkTo = null; this.said = [];
    this.neighbour = YARD_OBJECTS.filter(function (o) { return o.id === 'vecino'; })[0]; this.neighbour.off = true;
    for (var i = 0; i < (night ? 1 : 3); i++) this.spawnWalker(i % 2, Math.random() * YARD.W);
    // árbol con columpio (y un niño columpiándose) y la portería con su balón
    this.add.image(0, 0, 'yard_tree').setOrigin(0).setScale(S).setDepth(10 + YARD.tree.foot);
    var sw = YARD.swing, ropes = this.add.graphics();
    ropes.fillStyle(0xe2d8c6, 1).fillRect(-5 * S, 0, S, 20 * S).fillRect(4 * S, 0, S, 20 * S);
    ropes.fillStyle(0x8a5a32, 1).fillRect(-7 * S, 20 * S, 14 * S, 2 * S);
    this.rider = this.add.image(0, 21 * S, 'diego_sit').setOrigin(0.5, 1).setScale(STAGE.k).setVisible(false);
    this.swing = this.add.container(sw.x * S, sw.y * S, [ropes, this.rider]).setDepth(10 + 124);
    this.sway(0.04, 1800);                                                          // vacío, se mueve un poco con el aire
    this.add.image(0, 0, 'yard_goal').setOrigin(0).setScale(S).setDepth(10 + YARD.goal.foot);
    this.add.image(118.5 * S, 128 * S, 'ball').setOrigin(0.5, 1).setScale(S).setDepth(10 + 128);

    // Diego sale por la puerta lateral de la casa, mirando al jardín (o aparece junto a la portería al volver del minijuego)
    var start = this.at || (this.spawn === 'goal' ? [118, 140] : [288, 132]);
    this.player = new Player(this, start[0], start[1]);
    if (this.spawn === 'goal') this.player.dir = 'up'; else { this.player.dir = 'side'; this.player.flip = true; }
    this.player.place();
    this.buddy = new Buddy(this, this.player);
    this.objs = new Interact(this, this.player, YARD_OBJECTS);
    hiddenItems(this, YARD_OBJECTS);
    this.input.on('pointerdown', function (p, over) {
      if (self.riding) { if (self.time.now - self.rideAt > 200) self.getOff(); return; }
      if (self.busy() || over.length) return;
      // clic en alguien de la acera: se para a esperar mientras Diego se acerca a la valla
      var w = self.walkerAt(p.worldX, p.worldY);
      if (w) { w.hold = self.time.now + 7000; self.talkTo = w; self.pickNeighbour(); self.objs.goTo(self.neighbour); return; }
      var o = self.objs.objectAt(p.worldX, p.worldY);
      if (o) self.objs.goTo(o); else { self.objs.pending = null; self.player.walkTo(p.worldX, p.worldY); }
    });
    this.input.keyboard.on('keydown', function (e) {
      // en el columpio: Enter, Esc, Espacio o una flecha para bajarse
      if (self.riding) { if (!e.repeat && /^(Enter|NumpadEnter|Escape|Space|KeyE|Arrow\w+|Key[WASD])$/.test(e.code)) self.getOff(); return; }
      if (self.busy()) return;
      if (e.code === 'Escape' && !e.repeat) leaveBy(self, WALK.exits[0]);          // Esc: volver a casa
      else if (self.objs.active && /^(Enter|NumpadEnter|KeyE)$/.test(e.code)) {
        var o = self.objs.active; self.time.delayedCall(1, function () { self.objs.use(o); });
      }
    });
    this.exitTags = exitTags(this);
    this.controls = T(this, CFG.W / 2, CFG.H - 8, CFG.controlsYard, 15, CFG.c.cream, { fontFamily: CFG.fontUi, backgroundColor: '#120c22', padding: { x: 10, y: 4 } })
      .setOrigin(0.5, 1).setDepth(900).setAlpha(0.9);   // abajo, como en el cuarto (arriba están los botones de sonido y logros)
    this.dlg = new Dialog(this);
    this.cameras.main.fadeIn(250, 15, 10, 30);
    Logros.unlock('patio');
    // cada minuto, ¿ha cambiado la hora del día (día, atardecer, noche)? Entonces se vuelve a pintar el patio, con Diego donde estaba
    this.time.addEvent({ delay: 60000, loop: true, callback: function () {
      if (dayPhase() !== self.phase && !self.busy()) self.scene.restart({ fromRoom: self.fromRoom, at: [self.player.x, self.player.y] });
    } });
  },
  busy: function () { return this.dlg.open || this.riding; },

  /* columpio: vaivén de ancho «amp» (radianes) */
  sway: function (amp, ms) {
    if (this.swayTw) this.swayTw.stop();
    this.swing.rotation = -amp;
    this.swayTw = this.tweens.add({ targets: this.swing, rotation: amp, duration: ms, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  },
  /* montarse: Diego se sienta y se columpia; bajarse: vuelve al lado del columpio */
  ride: function () {
    var pl = this.player;
    this.riding = true; this.rideAt = this.time.now; Logros.unlock('columpio');
    pl.stopPath(); pl.spr.setVisible(false); pl.shadow.setVisible(false);
    this.rider.setVisible(true); this.sway(0.5, 1300);
  },
  getOff: function () {
    var pl = this.player, at = YARD_OBJECTS.filter(function (o) { return o.id === 'columpio'; })[0].at;
    this.riding = false; this.rider.setVisible(false); this.sway(0.04, 1800);
    pl.x = at[0]; pl.y = at[1]; pl.dir = 'side'; pl.flip = true;
    pl.spr.setVisible(true); pl.shadow.setVisible(true); pl.place();
  },

  /* la portería abre el minijuego de penaltis; al volver, Diego aparece junto a ella */
  penalties: function () {
    var self = this;
    this.cameras.main.fadeOut(220, 15, 10, 30);
    this.time.delayedCall(230, function () {
      history.replaceState({ key: 'Yard', data: { fromRoom: self.fromRoom, spawn: 'goal' } }, '', location.hash);
      Nav.go('Penalty', { fromYard: true });
    });
  },

  /* la gente de nuestra acera: el objeto «vecino» se pone delante de la valla, a la altura de quien esté más cerca de
     Diego (o de quien se ha parado a hablar o a esperarle) */
  pickNeighbour: function () {
    var pl = this.player, o = this.neighbour, m = this.talkTo, now = this.time.now;
    if (!(m && m.active && (m.talking || now < m.hold))) {
      m = null;
      this.walkers.forEach(function (w) {
        var cx = w.ax + 4;
        if (w.side === 1 && cx > 8 && cx < 292 && Math.abs(cx - pl.x) < 24 && (!m || Math.abs(cx - pl.x) < Math.abs(m.ax + 4 - pl.x))) m = w;
      });
      this.talkTo = m;
    }
    o.off = !m;
    if (!m) return;
    var cx = Math.round(m.ax + 4), top = YARD.walks[1].y - m.h;
    o.name = m.name; o.area = [cx - 5, 88, 10, 4]; o.at = [cx, 97]; o.mark = [cx, top - 2]; o.rect = [Math.round(m.ax), top, 9, m.h];
  },
  /* ¿hay alguien de nuestra acera en ese punto de la pantalla? */
  walkerAt: function (sx, sy) {
    var x = sx / STAGE.S, y = sy / STAGE.S, foot = YARD.walks[1].y;
    // si se cruzan dos, la que esté más cerca del clic
    return this.walkers.filter(function (w) { return w.side === 1 && x >= w.ax - 1 && x <= w.ax + 10 && y >= foot - w.h - 2 && y <= foot + 1; })
      .sort(function (a, b) { return Math.abs(a.ax + 4.5 - x) - Math.abs(b.ax + 4.5 - x); })[0] || null;
  },
  /* hablar con quien pasa: se para, se gira y dice una frase al azar según sea niño, adulto o mayor (people.js) */
  talk: function () {
    var self = this, m = this.talkTo; if (!m || !m.active) return;
    var pool = PEOPLE.lines[m.kind].concat(this.phase === 'night' ? PEOPLE.night[m.kind] || [] : []);
    var fresh = pool.filter(function (l) { return self.said.indexOf(l) < 0; });   // sin repetir las últimas
    var line = fresh[Math.floor(Math.random() * fresh.length)] || pool[0];
    this.said.push(line); if (this.said.length > Math.min(8, pool.length - 1)) this.said.shift();
    var face = { name: m.name, portrait: m.key + 'b', portraitScale: m.kind === 'kid' ? 6 : 5, voice: { kid: 1.5, adult: 1.1, elder: 0.8 }[m.kind] };
    if (Logros.mark('vecinos', m.name) >= 5) Logros.unlock('vecinos');
    var seq = [].concat(line).map(function (t) { return t.indexOf('D:') === 0 ? { name: 'Diego', text: t.slice(2).trim() } : Object.assign({ text: t }, face); });
    m.talking = true;
    this.dlg.show(seq, function () { m.talking = false; m.hold = self.time.now + 600; });   // se despide y sigue su camino
  },

  /* ---- coches: cada uno mira al de delante (y al semáforo) y frena o acelera; nunca se tocan ---- */
  carFront: function (c) { return c.dir > 0 ? c.ax + c.len : -c.ax; },        // el morro, en «metros» de su carril (siempre crecen hacia delante)
  carRear: function (c) { return this.carFront(c) - c.len; },
  /* un modelo al azar (los habituales salen más) */
  pickModel: function () {
    var total = CAR_MODELS.reduce(function (a, m) { return a + m.weight; }, 0), r = Math.random() * total, k = 0;
    for (var i = 0; i < CAR_MODELS.length; i++) { k += CAR_MODELS[i].weight; if (r < k) return CAR_MODELS[i]; }
    return CAR_MODELS[0];
  },
  /* sale un coche por un extremo, si hay sitio; devuelve si salió */
  spawnCar: function (lane) {
    var L = YARD.lanes[lane], S = STAGE.S, m = this.pickModel(), len = m.rows[0].length, self = this;
    var variant = m.kind === 'fixed' ? 0 : Math.floor(Math.random() * CAR_BODY.length);
    var x = L.dir > 0 ? -len - 2 : YARD.W + 4, v0 = m.speed[0] + Math.random() * (m.speed[1] - m.speed[0]);
    var front = L.dir > 0 ? x + len : -x;
    if (this.cars.some(function (c) { return c.dir === L.dir && self.carRear(c) < front + 12; })) return false;   // el anterior aún está en la entrada
    var im = this.add.image(x * S, L.y * S, 'car_' + m.id + '_' + variant).setOrigin(0, 1).setScale(S).setFlipX(L.dir < 0).setDepth(3 + lane);
    im.ax = x; im.v0 = v0; im.v = v0 * 0.6; im.dir = L.dir; im.len = len; im.lane = lane; im.committed = false;
    if (this.phase === 'night') im.light = glow(this, 0, (L.y - 4) * S, 9 * S, 0xfff2b0, 0.7).setScale(9 * S / 32, 3 * S / 32);   // faros
    this.cars.push(im);
    return true;
  },
  /* un coche: su velocidad deseada, bajada por el de delante y por el semáforo; frena fuerte y acelera despacio */
  driveCar: function (c, dt) {
    var self = this, vt = c.v0, front = this.carFront(c), lead = null, best = Infinity, state = this.lightState;
    this.cars.forEach(function (o) {
      if (o === c || o.dir !== c.dir) return;
      var r = self.carRear(o);
      if (r > self.carRear(c) + 0.1 && r < best) { best = r; lead = o; }
    });
    if (lead) vt = Math.min(vt, Math.max(0, lead.v + (best - front - 6) * 2));   // a 6 píxeles va como el de delante; más cerca, frena hasta parar
    if (state === 'green') c.committed = false;
    else if (!c.committed) {                                                       // ámbar o rojo, y aún no ha cruzado la línea
      var stopAt = c.dir > 0 ? YARD.stop.right : -YARD.stop.left, dist = stopAt - front;
      if (dist > -0.5) {
        var canStop = dist > c.v * c.v / (2 * 90) + 3;                             // con el ámbar: si no le da tiempo a parar, pasa
        if (state === 'amber' && !canStop) c.committed = true;
        else if (state === 'red' && dist < c.v * c.v / 400) c.committed = true;    // en rojo, solo si ya no puede parar de ninguna manera
        else vt = Math.min(vt, Math.max(0, dist * 2.5 - 1.5));
      }
    }
    var dv = vt - c.v, sec = dt / 1000;
    c.v = Math.max(0, c.v + Math.max(-220 * sec, Math.min(60 * sec, dv)));
    c.ax += c.dir * c.v * sec;
    if (lead && this.carRear(lead) - this.carFront(c) < 1) {                       // por si acaso: nunca se tocan
      var f = this.carRear(lead) - 1;
      c.ax = c.dir > 0 ? f - c.len : -f; c.v = Math.min(c.v, lead.v);
    }
  },
  /* el semáforo: dos postes, uno a cada lado de la calle; el mismo color en los dos (pasa la gente por el paso de cebra) */
  makeLights: function (glows) {
    var S = STAGE.S, self = this;
    this.lightT = Math.random() * YARD.light.reduce(function (a, p) { return a + p[1]; }, 0); this.lightState = '';
    this.heads = YARD.heads.map(function (h) {
      return { g: self.add.graphics().setDepth(h.depth), glow: glows ? glow(self, (h.x + 2.5) * S, (h.y + 5) * S, 9 * S, 0xffffff, 0.8).setVisible(false) : null, h: h };
    });
  },
  setLight: function (state) {
    var S = STAGE.S, LAMPS = { red: ['#ff4d3d', '#4a1d1d', 0xff4d3d], amber: ['#ffc83d', '#4a3a14', 0xffc83d], green: ['#4dff7a', '#14401f', 0x4dff7a] };
    this.lightState = state;
    this.heads.forEach(function (o) {
      var g = o.g, h = o.h; g.clear();
      g.fillStyle(0x1b1b22, 1).fillRect(h.x * S, h.y * S, 5 * S, 10 * S);
      ['red', 'amber', 'green'].forEach(function (k, i) {
        g.fillStyle(parseInt((k === state ? LAMPS[k][0] : LAMPS[k][1]).slice(1), 16), 1).fillRect((h.x + 1) * S, (h.y + 1 + i * 3) * S, 3 * S, 2 * S);
      });
      if (o.glow) o.glow.setTint(LAMPS[state][2]).setY((h.y + 2 + ['red', 'amber', 'green'].indexOf(state) * 3) * S).setVisible(true);
    });
  },
  /* alguien paseando por una acera (0 = la de enfrente, más pequeña; 1 = la nuestra); x: dónde aparece */
  spawnWalker: function (side, x) {
    var W = YARD.walks[side], S = STAGE.S, r = Math.random(), kind = r < 0.45 ? 'adult' : r < 0.75 ? 'kid' : 'elder';
    if (this.phase === 'night' && kind === 'kid') kind = 'adult';                   // de noche no hay niños por la calle
    var look = Math.floor(Math.random() * WALKER_LOOKS.length), dir = Math.random() < 0.5 ? 1 : -1, sp = WALKERS[kind].speed;
    if (x === undefined) x = dir > 0 ? -10 : YARD.W + 2;
    var im = this.add.image(x * S, W.y * S, 'walk_' + kind + look + 'a').setOrigin(0, 1).setScale(W.scale).setFlipX(dir < 0).setDepth(side ? 6 : 2);
    im.ax = x; im.v = dir * (sp[0] + Math.random() * (sp[1] - sp[0])) * (side ? 1 : 0.7); im.key = 'walk_' + kind + look; im.t = Math.random();
    var names = PEOPLE.names[kind];
    im.side = side; im.kind = kind; im.h = WALKERS[kind].head.length + WALKERS[kind].a.length; im.name = names[Math.floor(Math.random() * names.length)];
    this.walkers.push(im);
  },

  update: function (time, dt) {
    var self = this, S = STAGE.S, busy = this.busy();
    this.player.update(dt, busy);
    this.buddy.update(dt);
    this.pickNeighbour();
    this.objs.update(dt, busy);
    exitsUpdate(this, busy);
    var near = this.objs.active, info = near && CFG.objects[near.id];
    var bar = this.riding ? CFG.controlsSwing : info ? CFG.controlsNear.replace('{name}', near.name || info.name) : CFG.controlsYard;
    if (this.controls.text !== bar) this.controls.setText(bar);
    this.controls.setVisible(!this.dlg.open);
    this.clouds.forEach(function (c) { c.x += c.sp * S * dt / 1000 * 3; if (c.x > YARD.W * S) c.x = -20 * S; });
    // coches
    // semáforo: cambia solo, verde → ámbar → rojo
    var cycle = YARD.light.reduce(function (n, p) { return n + p[1]; }, 0), pos = (this.lightT += dt) % cycle, st = YARD.light[0][0];
    for (var li = 0, acc = 0; li < YARD.light.length; li++) { acc += YARD.light[li][1]; if (pos < acc) { st = YARD.light[li][0]; break; } }
    if (st !== this.lightState) this.setLight(st);
    this.nextCar = this.nextCar.map(function (w, lane) { w -= dt; if (w <= 0) { w = self.spawnCar(lane) ? (1600 + Math.random() * 2800) * self.calm : 400; } return w; });
    this.cars.forEach(function (c) { self.driveCar(c, dt); });
    this.cars = this.cars.filter(function (c) {
      c.x = Math.round(c.ax) * S;
      if (c.light) c.light.x = (c.dir > 0 ? c.ax + c.len + 4 : c.ax - 4) * S;
      if (c.ax < -c.len - 12 || c.ax > YARD.W + 12) { if (c.light) c.light.destroy(); c.destroy(); return false; }
      return true;
    });
    // gente paseando, con su paso
    this.nextWalker = this.nextWalker.map(function (w, side) { w -= dt; if (w <= 0) { self.spawnWalker(side); w = (2500 + Math.random() * 4000) * self.calm; } return w; });
    this.walkers = this.walkers.filter(function (m) {
      if (m.talking || time < m.hold) { m.setTexture(m.key + 'b').setFlipX(self.player.x < m.ax + 4); return true; }   // parado, mirando a Diego
      m.setFlipX(m.v < 0);
      m.ax += m.v * dt / 1000; m.t += dt / 1000 * Math.abs(m.v) / 6; m.x = Math.round(m.ax * S);
      m.setTexture(m.key + (Math.floor(m.t) % 2 ? 'a' : 'b'));
      if (m.ax < -14 || m.ax > YARD.W + 6) { m.destroy(); return false; }
      return true;
    });
  }
});
