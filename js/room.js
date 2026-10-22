/* La habitación en pixel art (384 x 240 píxeles de arte, se dibuja ampliada x2).
   Todo se pinta con rectángulos: cambia colores en ROOM_PAL y posiciones en las funciones. */
var ROOM = { W: 288, H: 232, SCALE: 2, WALL: 70 };

/* (288 x 232 píxeles de arte, ampliado x2) */
var ROOM_PAL = {
  frame: '#2b1d2e', frame2: '#3d2a40',
  wall: '#f4e4c6', wallStripe: '#eedbb7', wains: '#e3c291', wainsDark: '#caa171', base: '#8f6440',
  side: '#e6cfa3', sideDark: '#d2b685',
  floor: '#e2ae72', floorLight: '#ebbd84', floorLine: '#c48f56', floorDark: '#b98451',
  frameW: '#fdf8ee', frameShade: '#d9cdb6', sky1: '#6cc0f3', sky2: '#a9defb', sky3: '#d2f0ff',
  sun: '#ffe36e', sunCore: '#fff6c4', cloud: '#ffffff', cloudShade: '#dff1ff',
  curtain: '#86c493', curtainDark: '#62a173',
  wood: '#b67d49', woodDark: '#8a5a32', woodLight: '#cf9a62',
  books: ['#d9665a', '#4f8fd9', '#f2c14e', '#6cbf7a', '#9b6fd1', '#e8874a', '#5fb7c9', '#ef8fa8'],
  bedFrame: '#9a6a40', bedDark: '#7a5030', sheet: '#fffaf0', sheetShade: '#e9dfcc', blanket: '#4f8fd9', blanketDark: '#3c72b8', blanketLight: '#7fb0ea',
  rug: '#d8664f', rugDark: '#b4503e', rugTrim: '#f2c14e',
  green: '#4f9a5a', greenDark: '#3a7845', greenLight: '#74bd78', pot: '#c96b3c', potDark: '#a25330',
  screen: '#253049', screenOn: '#7fd0f0', metal: '#5b6178', ink: '#2b1d2e', paper: '#fffaf0'
};

function roomCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/* dibuja el fondo fijo (todo menos la ventana animada, el conejo y la luz) */
function drawRoomBase(ctx) {
  var P = ROOM_PAL, W = ROOM.W, H = ROOM.H, WALL = ROOM.WALL;
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  var L = 22, Rt = W - 22, T = 12, B = H - 14;           // interior: x 22..266, y 12..218

  // marco exterior oscuro y muros gruesos (como una maqueta vista desde arriba)
  R(0, 0, W, H, P.frame);
  R(4, 4, W - 8, H - 8, P.frame2);
  R(12, 10, W - 24, H - 20, '#4a3248');                   // canto superior de los muros
  // pared del fondo con rayas suaves
  R(L, T, Rt - L, WALL - T, P.wall);
  for (var x = L + 3; x < Rt; x += 10) R(x, T, 3, WALL - T - 16, P.wallStripe);
  // zócalo
  R(L, WALL - 16, Rt - L, 12, P.wains); R(L, WALL - 16, Rt - L, 2, P.wainsDark);
  for (x = L; x < Rt; x += 20) R(x, WALL - 14, 2, 10, P.wainsDark);
  R(L, WALL - 4, Rt - L, 4, P.base);
  // suelo de tablas
  R(L, WALL, Rt - L, B - WALL, P.floor);
  for (var y = WALL, row = 0; y < B; y += 10, row++) {
    R(L, y, Rt - L, 1, P.floorLine); R(L, y + 1, Rt - L, 1, P.floorLight);
    for (x = L + (row % 3) * 16; x < Rt; x += 48) R(x, y + 1, 1, 9, P.floorLine);
  }
  ctx.fillStyle = 'rgba(80,50,30,.10)'; ctx.fillRect(L, WALL, Rt - L, 4);
  // muros laterales con sombra interior
  R(12, 10, L - 12, H - 20, '#5a3d55'); R(Rt, 10, W - 12 - Rt, H - 20, '#5a3d55');
  R(L - 2, T, 2, B - T, '#3b2838'); R(Rt, T, 2, B - T, '#3b2838');
  // aberturas laterales: pasillo a la izquierda, vestidor a la derecha
  drawSideDoor(ctx, 'left'); drawSideDoor(ctx, 'right');
  // muro inferior con la puerta
  R(12, B, W - 24, H - 10 - B, '#5a3d55'); R(L, B, Rt - L, 2, '#3b2838');
  var dx0 = W / 2 - 14;
  R(dx0, B, 28, H - 10 - B + 6, P.floor); R(dx0, B, 2, H - B, '#3b2838'); R(dx0 + 26, B, 2, H - B, '#3b2838');
  R(dx0 + 4, B - 9, 20, 7, '#7aa7ee'); R(dx0 + 6, B - 7, 16, 3, '#5b84c9');          // felpudo

  // ---- estantería (izquierda)
  var sx = 26, sy = 16, sw = 36, sh = 64;
  R(sx, sy, sw, sh, P.woodDark); R(sx + 2, sy + 2, sw - 4, sh - 4, P.wood);
  for (var s = 0; s < 3; s++) {
    var by = sy + 4 + s * 20;
    R(sx + 4, by, sw - 8, 16, '#6b4428');
    var bx = sx + 5, i = 0;
    while (bx < sx + sw - 6) {
      var bw = 2 + ((s * 7 + i * 3) % 2), bh = 9 + ((s + i) % 3) * 2;
      if (s === 1 && i === 3) { // pequeña construcción de ladrillos
        R(bx, by + 9, 8, 7, '#d9665a'); R(bx + 1, by + 8, 2, 1, '#d9665a'); R(bx + 5, by + 8, 2, 1, '#d9665a');
        R(bx + 2, by + 4, 5, 5, '#f2c14e'); R(bx + 3, by + 3, 2, 1, '#f2c14e');
        bx += 10; i++; continue;
      }
      if (bx + bw > sx + sw - 5) break;
      R(bx, by + 16 - bh, bw, bh, P.books[(s * 3 + i) % P.books.length]);
      R(bx, by + 16 - bh, bw, 1, 'rgba(255,255,255,.35)');
      bx += bw + (i % 4 === 3 ? 1 : 0); i++;
    }
    R(sx + 2, by + 16, sw - 4, 3, P.woodDark);
  }

  // ---- foto de la cumbre (la imagen la pone la escena) y pósters
  R(70, 14, 30, 20, P.ink); R(72, 16, 26, 16, '#ffd9a0');
  R(186, 14, 20, 26, P.ink); R(188, 16, 16, 22, P.paper);               // gráfico de barras
  R(190, 32, 2, 4, '#4f8fd9'); R(193, 28, 2, 8, '#6cbf7a'); R(196, 24, 2, 12, '#f2c14e'); R(199, 20, 2, 16, '#d9665a'); R(189, 36, 14, 1, P.ink);
  R(212, 16, 24, 20, P.ink); R(214, 18, 20, 16, '#2c3b62');             // red neuronal
  var nodes = [[217, 21], [217, 26], [217, 31], [224, 23], [224, 29], [231, 26]];
  ctx.fillStyle = 'rgba(169,222,251,.55)';
  [[0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4], [3, 5], [4, 5]].forEach(function (e) {
    var a = nodes[e[0]], b = nodes[e[1]], n = 7;
    for (var k = 0; k <= n; k++) ctx.fillRect(Math.round(a[0] + (b[0] - a[0]) * k / n), Math.round(a[1] + (b[1] - a[1]) * k / n), 1, 1);
  });
  nodes.forEach(function (p, k) { R(p[0] - 1, p[1] - 1, 2, 2, k === 5 ? '#f2c14e' : '#a9defb'); });

  // ---- escritorio con ordenador
  var dx = 68, dy = 56;
  R(dx, dy, 50, 5, P.woodLight); R(dx, dy + 5, 50, 2, P.woodDark);
  R(dx + 2, dy + 7, 3, 20, P.woodDark); R(dx + 45, dy + 7, 3, 20, P.woodDark);
  R(dx + 30, dy + 7, 16, 11, P.wood); R(dx + 32, dy + 12, 12, 1, P.woodDark); R(dx + 37, dy + 9, 2, 2, P.rugTrim);
  R(dx + 12, dy - 18, 24, 16, P.ink); R(dx + 14, dy - 16, 20, 12, P.screen);
  R(dx + 16, dy - 14, 9, 1, P.screenOn); R(dx + 16, dy - 11, 14, 1, '#6cbf7a'); R(dx + 16, dy - 8, 7, 1, '#f2c14e');
  R(dx + 22, dy - 2, 4, 2, P.metal); R(dx + 18, dy, 12, 1, P.metal);
  R(dx + 14, dy + 1, 16, 2, '#e8e2d6'); R(dx + 38, dy - 3, 4, 4, '#d9665a');
  R(dx + 4, dy - 3, 5, 3, P.pot); R(dx + 5, dy - 9, 3, 6, P.green); R(dx + 3, dy - 7, 2, 3, P.green); R(dx + 8, dy - 6, 2, 2, P.green);
  R(dx + 16, dy + 14, 14, 3, '#4a5a8a'); R(dx + 18, dy + 8, 10, 6, '#5d6fa3'); R(dx + 22, dy + 17, 2, 6, P.metal); R(dx + 17, dy + 23, 12, 2, P.metal);

  // ---- ventana (el cristal animado lo pinta la escena)
  var wx = ROOM.WIN.x, wy = ROOM.WIN.y, ww = ROOM.WIN.w, wh = ROOM.WIN.h;
  R(wx - 3, wy - 3, ww + 6, wh + 6, P.frameW); R(wx - 3, wy + wh + 1, ww + 6, 2, P.frameShade);
  R(wx - 6, wy + wh + 3, ww + 12, 3, P.frameW); R(wx - 6, wy + wh + 6, ww + 12, 1, P.frameShade);
  R(wx - 14, wy - 6, 9, wh + 14, P.curtain); R(wx - 14, wy - 6, 2, wh + 14, P.curtainDark); R(wx - 8, wy - 6, 1, wh + 14, P.curtainDark);
  R(wx + ww + 5, wy - 6, 9, wh + 14, P.curtain); R(wx + ww + 12, wy - 6, 2, wh + 14, P.curtainDark); R(wx + ww + 7, wy - 6, 1, wh + 14, P.curtainDark);
  R(wx - 16, wy - 8, ww + 32, 2, P.woodDark);

  // cactus alto junto a la ventana
  var cx = 172, cy = 60;
  R(cx, cy + 8, 9, 7, P.pot); R(cx - 1, cy + 7, 11, 2, P.potDark);
  R(cx + 2, cy - 8, 5, 16, P.green); R(cx + 3, cy - 8, 1, 16, P.greenLight); R(cx + 6, cy - 7, 1, 14, P.greenDark);
  R(cx - 1, cy - 3, 3, 2, P.green); R(cx - 1, cy - 6, 2, 4, P.green); R(cx + 7, cy - 1, 3, 2, P.green); R(cx + 8, cy - 5, 2, 5, P.green);
  R(cx + 4, cy - 10, 2, 2, '#ef8fa8');

  // sombras de la cama, la pecera y el servidor (los muebles van en capas aparte: drawBed, drawTank, drawServer)
  R(ROOM.BED.x + 2, ROOM.BED.y + 30, 44, 3, 'rgba(80,50,30,.18)');
  R(ROOM.TANK.x - 1, ROOM.TANK.y + 30, ROOM.TANK.w + 2, 3, 'rgba(80,50,30,.18)');
  R(ROOM.SERVER.x + 1, ROOM.SERVER.y + 26, ROOM.SERVER.w, 3, 'rgba(0,0,0,.2)');
  R(ROOM.GUM.x, ROOM.GUM.y + 21, 15, 2, 'rgba(80,50,30,.2)');
  // mesilla de lado, como la cama: tapa vista desde arriba, el lateral liso hacia nosotros
  // y los cajones mirando a la cama (la franja estrecha de la izquierda, como el piecero)
  var nx = ROOM.NIGHT.x, ny = ROOM.NIGHT.y;                                                   // esquina de arriba de la tapa
  R(nx - 2, ny + 27, 17, 3, 'rgba(80,50,30,.18)');                                           // sombra en el suelo
  R(nx, ny, 14, 14, P.woodDark); R(nx + 1, ny + 1, 12, 12, P.woodLight); R(nx + 1, ny + 1, 12, 1, '#e2b47e'); // tapa
  R(nx, ny + 14, 14, 12, P.woodDark); R(nx + 1, ny + 14, 12, 11, P.wood); R(nx + 1, ny + 14, 12, 1, P.bedDark); // lateral
  R(nx + 4, ny + 17, 1, 6, P.woodDark); R(nx + 9, ny + 17, 1, 6, P.woodDark);                // vetas
  R(nx - 3, ny + 2, 3, 23, P.woodDark);                                                     // frente con los cajones
  R(nx - 2, ny + 3, 2, 10, P.wood); R(nx - 2, ny + 14, 2, 10, P.wood);
  R(nx - 4, ny + 7, 1, 2, P.rugTrim); R(nx - 4, ny + 18, 1, 2, P.rugTrim);                   // tiradores
  R(nx, ny + 26, 2, 2, P.bedDark); R(nx + 12, ny + 26, 2, 2, P.bedDark);                     // patas
  // lámpara y un libro encima
  R(nx + 5, ny + 5, 4, 2, P.metal); R(nx + 6, ny - 1, 1, 6, P.metal);
  R(nx + 3, ny - 7, 8, 1, '#fff6d6'); R(nx + 2, ny - 6, 10, 5, '#ffe9a8'); R(nx + 2, ny - 1, 10, 1, '#e8c878');
  R(nx + 2, ny + 9, 5, 3, '#4f8fd9'); R(nx + 2, ny + 9, 5, 1, '#7fb0ea');

  // ---- alfombra
  var rx = 92, ry = 118, rw = 104, rh = 56;
  R(rx, ry, rw, rh, P.rugTrim); R(rx + 2, ry + 2, rw - 4, rh - 4, P.rug);
  for (var t = 0; t < 7; t++) { R(rx + 8 + t * 14, ry + 7, 4, 4, P.rugDark); R(rx + 8 + t * 14, ry + rh - 11, 4, 4, P.rugDark); }
  R(rx + 8, ry + 18, rw - 16, 1, P.rugTrim); R(rx + 8, ry + rh - 19, rw - 16, 1, P.rugTrim);
  for (t = 0; t < 27; t++) { R(rx - 2, ry + 1 + t * 2, 2, 1, P.rugTrim); R(rx + rw, ry + 1 + t * 2, 2, 1, P.rugTrim); }

  // cactus redondo (abajo a la derecha)
  var kx = 246, ky = 196;
  R(kx, ky + 8, 11, 8, P.pot); R(kx - 1, ky + 7, 13, 2, P.potDark);
  R(kx + 2, ky - 1, 7, 9, P.green); R(kx + 1, ky + 1, 9, 6, P.green); R(kx + 3, ky - 1, 1, 9, P.greenLight); R(kx + 7, ky, 1, 7, P.greenDark);
  R(kx + 4, ky - 4, 3, 3, '#f2c14e');
  drawRoomDecor(ctx);
}
ROOM.WIN = { x: 128, y: 16, w: 40, h: 30 };
ROOM.NIGHT = { x: 249, y: 72 };                       // mesilla de lado, junto al cabecero
ROOM.BED = { x: 215, y: 123 };                        // cama (esquina de arriba del colchón, lado de los pies)
ROOM.SERVER = { x: 26, y: 188, w: 38 };               // servidor tumbado (abajo a la izquierda)
ROOM.BRICKS = { x: 176, y: 156 };
ROOM.NOTE = { x: 221, y: 126 };
ROOM.GUM = { x: 95, y: 190 };
ROOM.TURTLE = { x: 236, y: 128 };                     // Manuelita, la tortuga de peluche (encima de la cama)                         // máquina de chicles (K-Means)                       // cuaderno encima de la cama
ROOM.TANK = { x: 200, y: 184, w: 34 };                // pecera (el mueble va debajo)
ROOM.DOORS = { y: 156, h: 24 };                       // hueco de las puertas laterales (las dos a la misma altura)

/* ---- Muebles que pueden tapar al muñeco cuando pasa por detrás ----
   Cada uno se pinta en su propia capa (lienzo del tamaño del cuarto, transparente) y la escena la pone
   a la profundidad de su base: si los pies del muñeco quedan más arriba, el mueble se dibuja delante. */
ROOM.PROPS = {
  bed: { foot: 155 },      // y de la base de cada mueble (la profundidad)
  gum: { foot: 212 },
  server: { foot: 216 },
  tank: { foot: 215 }
};
function drawBed(ctx) {
  var P = ROOM_PAL;
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  // ---- cama contra la pared derecha, a media altura: cabecero a la derecha y los pies hacia el centro
  var bx0 = ROOM.BED.x, by0 = ROOM.BED.y;                                                   // esquina de arriba del colchón (lado de los pies)
  R(bx0 + 44, by0 - 14, 5, 44, P.bedDark); R(bx0 + 45, by0 - 13, 3, 42, P.bedFrame);          // cabecero alto
  R(bx0 + 44, by0 - 15, 5, 2, P.woodLight);
  R(bx0, by0 - 3, 3, 33, P.bedDark); R(bx0 + 1, by0 - 2, 1, 31, P.bedFrame);                  // piecero bajo
  R(bx0 + 3, by0, 41, 18, P.sheet);                                                           // colchón (cara de arriba)
  R(bx0 + 32, by0 + 2, 11, 12, P.paper); R(bx0 + 32, by0 + 12, 11, 2, P.sheetShade);           // almohada
  R(bx0 + 31, by0 + 2, 1, 12, P.sheetShade);
  R(bx0 + 3, by0, 27, 18, P.blanket); R(bx0 + 27, by0, 3, 18, P.blanketLight);               // manta doblada
  for (var k2 = 0; k2 < 3; k2++) R(bx0 + 7 + k2 * 7, by0, 2, 18, P.blanketDark);
  R(bx0 + 3, by0 + 18, 27, 7, P.blanketDark); R(bx0 + 30, by0 + 18, 14, 7, P.sheetShade);     // cara frontal (profundidad)
  R(bx0 + 3, by0 + 24, 27, 1, '#2e5a94');
  R(bx0 + 3, by0 + 25, 41, 4, P.bedFrame); R(bx0 + 3, by0 + 25, 41, 1, P.woodLight);          // larguero
  R(bx0 + 3, by0 + 29, 3, 3, P.bedDark); R(bx0 + 40, by0 + 29, 3, 3, P.bedDark);              // patas
  // Manuelita: tortuga de peluche junto a la almohada, con su etiqueta en la pata
  var tx = ROOM.TURTLE.x, ty = ROOM.TURTLE.y;
  R(tx - 1, ty + 5, 12, 2, 'rgba(20,30,60,.3)');                                            // sombra sobre la manta
  R(tx + 2, ty, 6, 1, '#3f9a68'); R(tx + 1, ty + 1, 8, 3, '#3f9a68'); R(tx + 2, ty + 4, 6, 1, '#2f7a52');   // caparazón
  [[3, 1], [5, 2], [7, 1], [3, 3], [6, 3]].forEach(function (d) { R(tx + d[0], ty + d[1], 1, 1, '#7cc59a'); });
  R(tx - 2, ty + 1, 3, 3, '#a8d08a'); R(tx - 2, ty + 2, 1, 1, '#2b1d2e');                     // cabeza y ojo
  R(tx + 1, ty + 5, 2, 1, '#a8d08a'); R(tx + 6, ty + 5, 2, 1, '#a8d08a'); R(tx + 9, ty + 2, 1, 1, '#a8d08a');   // patas y cola
  R(tx + 7, ty + 6, 2, 2, '#fffaf0'); R(tx + 7, ty + 6, 1, 1, '#ef6fa0');                      // etiqueta con un corazón
  // cuaderno encima de la manta (es el expediente: lleva a cv/)
  var qx = ROOM.NOTE.x, qy = ROOM.NOTE.y;
  R(qx + 1, qy + 1, 10, 8, 'rgba(20,30,60,.35)');                                           // sombra sobre la manta
  R(qx, qy, 10, 8, '#fffaf0'); R(qx, qy, 9, 7, '#3f9a68');                                   // hojas y tapa
  R(qx, qy, 2, 7, '#1a5a40'); R(qx + 2, qy, 7, 1, '#6cbf7a');                               // lomo y brillo
  R(qx + 6, qy, 1, 7, '#f2c14e');                                                           // goma
  R(qx + 3, qy + 2, 2, 2, '#f3eedc');                                                       // etiqueta
  R(qx + 11, qy + 1, 1, 7, '#f2c14e'); R(qx + 11, qy + 8, 1, 1, '#2b1d2e');                 // lápiz
}
function drawServer(ctx, t) {
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  // servidor de entrenamiento tumbado de lado (abajo a la izquierda): tapa con rejillas y frente con tres bahías
  var vx = ROOM.SERVER.x, vy = ROOM.SERVER.y, vw = ROOM.SERVER.w;
  R(vx, vy, vw, 7, '#3a4160'); R(vx + 1, vy + 1, vw - 2, 5, '#4a5276');                      // tapa
  for (var i = 0; i < 7; i++) R(vx + 4 + i * 4, vy + 2, 2, 3, '#2e3350');                   // rejillas
  R(vx, vy + 7, vw, 18, '#1d2133'); R(vx + 1, vy + 8, vw - 2, 16, '#272c44');                // frente
  for (i = 0; i < 3; i++) { R(vx + 3, vy + 10 + i * 5, vw - 14, 3, '#141826'); R(vx + 4, vy + 11 + i * 5, 8, 1, '#3a4160'); }
  R(vx + 2, vy + 25, 4, 2, '#141826'); R(vx + vw - 6, vy + 25, 4, 2, '#141826');           // patas
  // lucecitas de actividad
  for (i = 0; i < 3; i++) for (var j2 = 0; j2 < 3; j2++) {
    var on = Math.sin(t * (3 + i + j2 * 1.7) + i * 2.1 + j2) > 0.2;
    R(vx + vw - 9 + j2 * 2, vy + 11 + i * 5, 1, 2, on ? (j2 === 2 ? '#f2c14e' : '#5ef0b0') : '#18301f');
  }
}
/* máquina de chicles: globo de cristal con bolas de colores (es el K-Means: agrupar por colores) */
function drawGumball(ctx) {
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  var gx = ROOM.GUM.x, gy = ROOM.GUM.y;
  R(gx + 4, gy - 1, 6, 2, '#a84a40'); R(gx + 5, gy - 2, 4, 1, '#d9665a');                    // tapa
  R(gx + 2, gy + 1, 10, 10, '#2b1d2e'); R(gx + 1, gy + 2, 12, 8, '#2b1d2e');                  // globo
  R(gx + 3, gy + 1, 8, 10, '#d8eef8'); R(gx + 2, gy + 2, 10, 8, '#d8eef8');
  var cols = ['#d9665a', '#6aa6f0', '#f2c14e', '#7cc59a', '#ef8fa8', '#9b6fd1'];
  [[3, 6], [5, 7], [7, 6], [9, 7], [4, 8], [6, 9], [8, 8], [10, 9], [3, 9], [5, 4], [7, 4], [9, 5], [6, 2], [4, 3]].forEach(function (b, i) {
    R(gx + b[0], gy + b[1], 2, 2, cols[i % cols.length]);
  });
  R(gx + 3, gy + 2, 1, 3, 'rgba(255,255,255,.8)');                                          // brillo del cristal
  R(gx + 2, gy + 11, 10, 9, '#a84a40'); R(gx + 3, gy + 11, 8, 8, '#d9665a'); R(gx + 3, gy + 11, 2, 8, '#f08a7a');   // cuerpo
  R(gx + 5, gy + 13, 4, 2, '#c9cfe0'); R(gx + 6, gy + 13, 2, 1, '#5b6178');                  // ranura de la moneda
  R(gx + 6, gy + 16, 3, 2, '#2b1d2e');                                                      // salida
  R(gx + 1, gy + 20, 12, 2, '#a84a40'); R(gx + 1, gy + 20, 12, 1, '#d9665a');                // pie
}
/* pecera: el mueble, el agua, los peces y las burbujas (t en segundos) */
function drawTank(ctx, t) {
  var P = ROOM_PAL, aq = ROOM.TANK;
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  // mueble bajo, marco, tapa con luz y grava
  R(aq.x - 2, aq.y + 20, aq.w + 4, 11, P.woodDark); R(aq.x - 1, aq.y + 21, aq.w + 2, 9, P.wood); // mueble
  R(aq.x - 1, aq.y + 21, aq.w + 2, 1, P.woodLight); R(aq.x + 4, aq.y + 24, 4, 1, P.woodDark); R(aq.x + aq.w - 8, aq.y + 24, 4, 1, P.woodDark);
  R(aq.x, aq.y, aq.w, 20, '#2b3d5a');                                                        // marco
  R(aq.x, aq.y, aq.w, 3, '#3d5378'); R(aq.x + 2, aq.y, aq.w - 4, 1, '#5a74a0');            // tapa con luz
  R(aq.x + 1, aq.y + 3, aq.w - 2, 2, '#9fe3f0');                                            // superficie del agua
  R(aq.x + 1, aq.y + 16, aq.w - 2, 3, '#e2c38a'); R(aq.x + 1, aq.y + 18, aq.w - 2, 1, '#c9a46a'); // grava
  R(aq.x + 24, aq.y + 14, 5, 3, '#8a8f9e'); R(aq.x + 25, aq.y + 13, 3, 1, '#a3aac2');       // piedra
  // agua con ondas, tres peces que van y vienen y burbujas
  var wx0 = aq.x + 1, ww2 = aq.w - 2;
  R(wx0, aq.y + 5, ww2, 11, '#4fa8c8'); R(wx0, aq.y + 5, ww2, 3, '#6cc4dc');
  R(wx0 + Math.floor(t * 4) % ww2, aq.y + 5, 3, 1, '#bdf0f8');
  [[3, 4, 2], [8, 7, 3]].forEach(function (pl, j) {                                     // plantas que se mecen
    for (var q = 0; q < pl[1]; q++) R(wx0 + pl[0] + j * 20 + Math.round(Math.sin(t * 2 + q * 0.7 + j) * 0.6), aq.y + 15 - q, 1, 1, q % 2 ? '#3a7845' : '#6cbf7a');
  });
  [['#ff8a3d', 0.55, 6, 0], ['#f2c14e', 0.8, 9, 2], ['#ef8fa8', 0.4, 12, 4]].forEach(function (f) {
    var u = (Math.sin(t * f[1] + f[3]) + 1) / 2, dir = Math.cos(t * f[1] + f[3]) > 0 ? 1 : -1;
    var fx = Math.round(wx0 + 3 + u * (ww2 - 9)), fy = aq.y + f[2] + Math.round(Math.sin(t * 2 + f[3]));
    R(fx, fy, 4, 2, f[0]); R(dir > 0 ? fx - 1 : fx + 4, fy, 1, 2, f[0]);                 // cuerpo y cola
    R(dir > 0 ? fx + 3 : fx, fy, 1, 1, P.ink);                                            // ojo
  });
  for (var k = 0; k < 4; k++) {
    var bp = (t * 0.6 + k / 4) % 1;
    R(aq.x + 28 + (k % 2), Math.round(aq.y + 14 - bp * 9), 1, 1, '#dff7fc');
  }
  R(aq.x + 2, aq.y + 5, 1, 11, 'rgba(255,255,255,.3)');                                   // reflejo del cristal
}
/* el cuarto entero quieto (fondo + muebles), para el montaje LEGO; con ventana, para los fondos desenfocados */
function drawRoomAll(ctx, t, withWindow) {
  drawRoomBase(ctx); drawBed(ctx); drawGumball(ctx); drawServer(ctx, t); drawTank(ctx, t);
  if (withWindow) { ctx.save(); ctx.translate(ROOM.WIN.x, ROOM.WIN.y); drawRoomWindow(ctx, t); ctx.restore(); }
}

/* Hueco en el muro lateral con el suelo de la habitación de al lado asomando.
   Izquierda: pasillo de madera más oscura. Derecha: vestidor con moqueta. */
function drawSideDoor(ctx, side) {
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  var y = ROOM.DOORS.y, h = ROOM.DOORS.h, left = side === 'left', x0 = left ? 0 : ROOM.W - 22, k;
  if (left) {
    R(x0, y, 22, h, '#c99560');
    for (k = 0; k < h; k += 8) { R(x0, y + k, 22, 1, '#a87642'); R(x0 + (k % 16 ? 6 : 14), y + k + 1, 1, 7, '#a87642'); }
  } else {
    R(x0, y, 22, h, '#b7a2d4');
    for (k = 2; k < h; k += 4) R(x0, y + k, 22, 1, '#a690c6');
  }
  // penumbra hacia el fondo de la otra habitación
  ctx.fillStyle = 'rgba(40,20,40,.45)'; ctx.fillRect(left ? 0 : ROOM.W - 5, y, 5, h);
  ctx.fillStyle = 'rgba(40,20,40,.22)'; ctx.fillRect(left ? 5 : ROOM.W - 10, y, 5, h);
  // marco de madera y umbral
  var fx = left ? 10 : ROOM.W - 22;
  R(fx, y - 3, 12, 3, '#8f6440'); R(fx, y - 3, 12, 1, '#b67d49');
  R(fx, y + h, 12, 3, '#8f6440'); R(fx, y + h + 2, 12, 1, '#6b4428');
  R(left ? 20 : ROOM.W - 22, y, 2, h, '#a87642');
  // puerta abierta, pegada al muro de la otra habitación
  R(left ? 2 : ROOM.W - 4, y - 1, 2, h + 2, '#7a5030');
}


/* cristal de la ventana: cielo, sol y nubes que se mueven (t en segundos) */
/* phase: 'day', 'dusk' o 'night' (dayPhase, en clock.js); sin ella, de día */
var WINDOW_SKY = {
  day:   { sky: ['#6cc0f3', '#a9defb', '#d2f0ff'], cloud: '#ffffff', cloudShade: '#dff1ff', hill: '#9ad48a', hill2: '#7cbf6f' },
  dusk:  { sky: ['#6a6fb8', '#e88a7a', '#f6c27a'], cloud: '#f6d0c0', cloudShade: '#e8a8a0', hill: '#6a9a5a', hill2: '#55804a' },
  night: { sky: ['#141a3a', '#1d2550', '#2a3366'], cloud: '#3a4370', cloudShade: '#2e3660', hill: '#2e5a3a', hill2: '#244a30' }
};
function drawRoomWindow(ctx, t, phase) {
  var P = ROOM_PAL, w = ROOM.WIN.w, h = ROOM.WIN.h, K = WINDOW_SKY[phase || 'day'];
  function R(x, y, ww, hh, c) { ctx.fillStyle = c; ctx.fillRect(x, y, ww, hh); }
  R(0, 0, w, h, K.sky[0]); R(0, 9, w, 11, K.sky[1]); R(0, 20, w, h - 20, K.sky[2]);
  if (phase === 'night') {
    // estrellas que titilan y luna creciente
    [[4, 3], [12, 8], [20, 2], [33, 13], [7, 15], [25, 11], [37, 4], [16, 18]].forEach(function (s, k) {
      if (Math.sin(t * 2 + k * 1.7) > -0.6) R(s[0], s[1], 1, 1, k % 3 ? '#fffbe0' : '#cfe0ff');
    });
    R(28, 3, 6, 7, '#f4f1dc'); R(27, 4, 8, 5, '#f4f1dc'); R(30, 3, 5, 6, K.sky[0]); R(31, 4, 4, 4, K.sky[0]);
  } else if (phase === 'dusk') {
    R(28, 15, 7, 6, '#ff9a50'); R(27, 16, 9, 4, '#ff9a50'); R(29, 16, 5, 4, '#ffd27a');            // sol bajo
  } else {
    R(28, 4, 7, 7, P.sun); R(27, 5, 9, 5, P.sun); R(29, 3, 5, 9, P.sun); R(29, 5, 5, 5, P.sunCore);
  }
  // nubes
  [[0, 7, 1], [24, 17, 0.6], [50, 11, 0.8]].forEach(function (c) {
    var x = Math.round(((c[0] + t * 3 * c[2]) % (w + 30)) - 22), y = c[1];
    R(x, y, 13, 4, K.cloud); R(x + 3, y - 2, 7, 2, K.cloud); R(x + 1, y + 4, 11, 1, K.cloudShade);
  });
  // colinas lejanas
  R(0, h - 5, w, 5, K.hill); R(0, h - 7, 14, 2, K.hill); R(22, h - 8, 13, 3, K.hill); R(0, h - 2, w, 2, K.hill2);
  // travesaños
  R(w / 2 - 1, 0, 3, h, P.frameW); R(0, h / 2 - 1, w, 3, P.frameW);
  R(0, 0, w, 1, 'rgba(20,40,70,.25)');
}

/* conejo (16 x 12): dos fotogramas para que mueva las orejas y la nariz */
var BUNNY = {
  a: ["...o.o..........", "..opopo.........", "..opopo.........", "..owwwo.........", ".owwwwwo........", "owkwwwwwooooo...", "owwwwwwwwwwwwo..", "onwwwwwwwwwwwwo.", ".owwwwwwwwwwsswo", "..owwwwwwwwwsso.", "..owsswwwwwswo..", "...ooo...oooo..."],
  b: ["....o.o.........", "...opopo........", "..opopo.........", "..owwwo.........", ".owwwwwo........", "owkwwwwwooooo...", "owwwwwwwwwwwwo..", "owwwwwwwwwwwwwo.", ".owwwwwwwwwwsswo", "..owwwwwwwwwsso.", "..owsswwwwwswo..", "...ooo...oooo..."],
  pal: { o: '#5a4a52', w: '#f6f1e8', s: '#dcd3c5', p: '#f3a7a7', k: '#2b1d2e', n: '#ef8fa8' }
};

/* Texturas del cuarto (se crean una vez y las comparten todas las escenas) */
function ensureRoomTextures(scene) {
  var tx = scene.textures;
  if (!tx.exists('room_base')) {
    var c = roomCanvas(ROOM.W, ROOM.H), ctx = c.getContext('2d');
    drawRoomBase(ctx);
    // copia estática con la ventana pintada, para los fondos desenfocados
    tx.addCanvas('room_base', c);
    var c2 = roomCanvas(ROOM.W, ROOM.H), x2 = c2.getContext('2d');
    drawRoomAll(x2, 1, true);
    var c3 = roomCanvas(ROOM.W, ROOM.H); drawRoomFx(c3.getContext('2d'), 1); x2.drawImage(c3, 0, 0);
    tx.addCanvas('room_still', c2);
    // la cama no se mueve: su capa se pinta una vez
    var cb = roomCanvas(ROOM.W, ROOM.H); drawBed(cb.getContext('2d')); tx.addCanvas('room_bed', cb);
    var cg = roomCanvas(ROOM.W, ROOM.H); drawGumball(cg.getContext('2d')); tx.addCanvas('room_gum', cg);
    var cf = roomCanvas(ROOM.W, ROOM.H); drawRoomAll(cf.getContext('2d'), 0); tx.addCanvas('room_full', cf);
  }
  if (!tx.exists('bunny_a')) { makeTexture(scene, 'bunny_a', BUNNY.a, BUNNY.pal); makeTexture(scene, 'bunny_b', BUNNY.b, BUNNY.pal); }
}
/* posición del cuarto en el lienzo lógico de 960 x 540 */
ROOM.OX = (CFG.W - ROOM.W * ROOM.SCALE) / 2;
ROOM.OY = (CFG.H - ROOM.H * ROOM.SCALE) / 2;
/* escena en pantalla: dónde empieza su arte, a qué escala (S) y a qué escala van los personajes (k:
   píxeles de pantalla por píxel del sprite). Cada escena pone el suyo al crearse */
var STAGE_ROOM = { OX: ROOM.OX, OY: ROOM.OY, S: ROOM.SCALE, k: 1.6 };
var STAGE = STAGE_ROOM;
/* tamaño de los personajes respecto al cuarto (1 en el cuarto; menos si se ven más pequeños), en píxeles de arte */
function stageRatio() { return STAGE.k / STAGE.S / 0.8; }
/* de píxeles de arte a pantalla, en la escena actual */
function roomXY(ax, ay) { return [STAGE.OX + ax * STAGE.S, STAGE.OY + ay * STAGE.S]; }

/* ---- decoración extra (parte fija): IA, programación y cosas del día a día ---- */
function drawRoomDecor(ctx) {
  var P = ROOM_PAL;
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  // reloj de pared (las agujas se mueven en drawRoomFx)
  R(243, 17, 16, 16, P.ink); R(244, 16, 14, 18, P.ink); R(245, 18, 12, 14, P.paper); R(244, 19, 14, 12, P.paper);
  R(250, 18, 2, 1, P.ink); R(250, 31, 2, 1, P.ink); R(245, 24, 1, 2, P.ink); R(256, 24, 1, 2, P.ink);
  // juguete de zanahoria de Patricio, a su lado en la alfombra
  R(137, 159, 13, 1, 'rgba(0,0,0,.15)');
  R(139, 155, 8, 4, '#f08a2c'); R(137, 156, 2, 2, '#f08a2c'); R(136, 157, 1, 1, '#f08a2c'); R(140, 155, 6, 1, '#f6a65a');
  R(141, 157, 1, 1, '#c96a1c'); R(144, 156, 1, 1, '#c96a1c');
  R(147, 154, 2, 2, '#4f9a5a'); R(147, 158, 2, 2, '#4f9a5a'); R(148, 156, 3, 2, '#6cbf7a');
  // bandera de Extremadura bajo el reloj: verde, blanca y negra con el escudo, sujeta con chinchetas
  var fx = 241, fy = 38;
  R(fx + 1, fy + 1, 18, 12, 'rgba(60,40,20,.15)');
  R(fx, fy, 18, 4, '#0b7a3b'); R(fx, fy + 4, 18, 4, '#fbfbf6'); R(fx, fy + 8, 18, 4, '#1b1b1b');
  R(fx + 6, fy, 1, 12, 'rgba(0,0,0,.08)'); R(fx + 12, fy, 1, 12, 'rgba(255,255,255,.12)');    // pliegues
  R(fx + 7, fy + 3, 4, 6, '#c9a43a'); R(fx + 8, fy + 4, 2, 3, '#d9665a'); R(fx + 8, fy + 7, 2, 1, '#4f8fd9');   // escudo
  R(fx, fy, 1, 1, '#d9665a'); R(fx + 17, fy, 1, 1, '#d9665a');
  // pósits junto al escritorio
  R(104, 36, 7, 7, '#ffe47a'); R(105, 38, 5, 1, '#c9a43a'); R(105, 40, 4, 1, '#c9a43a');
  R(106, 45, 7, 7, '#ff9fb5'); R(107, 47, 4, 1, '#c96a80'); R(107, 49, 5, 1, '#c96a80');
  R(102, 25, 7, 7, '#9fe0c4'); R(103, 27, 5, 1, '#4f9a7a'); R(103, 29, 3, 1, '#4f9a7a');
  // patito de goma (para depurar código) en el escritorio
  R(111, 52, 5, 4, '#ffd23f'); R(114, 50, 3, 3, '#ffd23f'); R(117, 51, 2, 1, '#f08a2c'); R(115, 51, 1, 1, P.ink);
  // torre del PC con ventilador RGB, junto al escritorio
  R(120, 58, 12, 24, '#22263a'); R(121, 59, 10, 22, '#2e3350'); R(122, 60, 8, 2, '#4a5276');
  R(123, 63, 6, 6, '#141826'); R(123, 72, 6, 6, '#141826');
  // papelera con papeles arrugados
  R(56, 84, 9, 10, '#7a8199'); R(56, 84, 9, 1, '#a3aac2'); R(57, 82, 3, 3, P.paper); R(61, 81, 3, 3, '#e8e2d6');
  // robot de IA (bajo la estantería): ojos y antena en drawRoomFx
  R(33, 104, 14, 10, '#9aa3bd'); R(34, 105, 12, 8, '#b9c1d8'); R(36, 107, 8, 4, '#1b2033');      // cabeza y visor
  R(39, 100, 2, 4, '#7a8199');
  R(35, 114, 10, 9, '#9aa3bd'); R(36, 115, 8, 7, '#b9c1d8'); R(38, 117, 4, 2, '#4f8fd9');      // cuerpo
  R(32, 115, 3, 6, '#7a8199'); R(45, 115, 3, 6, '#7a8199'); R(36, 123, 3, 2, '#5b6178'); R(41, 123, 3, 2, '#5b6178');
  // puf con portátil
  R(34, 138, 30, 14, '#e8874a'); R(32, 141, 34, 10, '#e8874a'); R(34, 150, 30, 3, '#c46a32'); R(36, 139, 10, 2, '#f2a46a');
  R(41, 133, 16, 9, '#2b2f4a'); R(42, 134, 14, 7, '#16213a');                                    // pantalla del portátil
  R(39, 142, 20, 3, '#9aa3bd'); R(40, 142, 18, 1, '#c9cfe0');
  // piezas de construcción sueltas junto a la alfombra
  var lx = ROOM.BRICKS.x, ly = ROOM.BRICKS.y;
  R(lx, ly + 3, 8, 5, '#6cbf7a'); R(lx + 1, ly + 2, 2, 1, '#6cbf7a'); R(lx + 5, ly + 2, 2, 1, '#6cbf7a');
  R(lx + 6, ly + 8, 8, 5, '#4f8fd9'); R(lx + 7, ly + 7, 2, 1, '#4f8fd9'); R(lx + 11, ly + 7, 2, 1, '#4f8fd9');
  R(lx + 12, ly + 1, 5, 5, '#f2c14e'); R(lx + 13, ly, 2, 1, '#f2c14e');
  R(lx, ly + 8, 6, 1, 'rgba(0,0,0,.15)'); R(lx + 6, ly + 13, 8, 1, 'rgba(0,0,0,.15)');
}

/* búsqueda A* en la pantalla del portátil (14 x 7 píxeles): se calcula una vez */
var LAPTOP_SEARCH = (function () {
  var W = 14, H = 7, walls = [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6]], start = [1, 5], goal = [12, 1];
  var wall = {}; walls.forEach(function (w) { wall[w] = 1; });
  var g = {}, prev = {}, open = [[start, 0]], order = [], done = {};
  function h(c) { return Math.abs(c[0] - goal[0]) + Math.abs(c[1] - goal[1]); }
  g[start] = 0;
  while (open.length) {
    open.sort(function (a, b) { return a[1] - b[1]; });
    var cur = open.shift()[0];
    if (done[cur]) continue; done[cur] = 1; order.push(cur);
    if (cur[0] === goal[0] && cur[1] === goal[1]) break;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      var n = [cur[0] + d[0], cur[1] + d[1]];
      if (n[0] < 0 || n[1] < 0 || n[0] >= W || n[1] >= H || wall[n] || done[n]) return;
      if (g[n] === undefined || g[cur] + 1 < g[n]) { g[n] = g[cur] + 1; prev[n] = cur; open.push([n, g[n] + h(n)]); }
    });
  }
  var path = []; for (var c = goal; c; c = prev[c]) path.unshift(c);
  return { walls: walls, order: order, path: path, start: start, goal: goal };
})();

/* ---- capa animada: se redibuja varias veces por segundo (t en segundos) ---- */
function drawRoomFx(ctx, t) {
  var P = ROOM_PAL;
  ctx.clearRect(0, 0, ROOM.W, ROOM.H);
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  // monitor: código que se desplaza y cursor parpadeante
  var cols = ['#7fd0f0', '#6cbf7a', '#f2c14e', '#ef8fa8', '#c9cfe0'], off = Math.floor(t * 2.5);
  R(82, 40, 20, 12, P.screen);
  for (var i = 0; i < 5; i++) {
    var n = off + i, ind = (n * 7) % 3 * 2, len = 4 + (n * 13) % 11;
    R(83 + ind, 41 + i * 2, Math.min(len, 17 - ind), 1, cols[n % cols.length]);
  }
  if (Math.floor(t * 2) % 2) R(83, 51, 2, 1, '#ffffff');
  // vapor de la taza
  for (var k = 0; k < 3; k++) {
    var ph = (t * 0.9 + k / 3) % 1, sy = 52 - ph * 10, sx = 107 + Math.round(Math.sin(t * 3 + k * 2) * 1.2);
    ctx.globalAlpha = 0.55 * (1 - ph); R(sx, Math.round(sy), 1, 2, '#ffffff'); ctx.globalAlpha = 1;
  }
  // ventiladores RGB del PC
  var hue = (t * 90) % 360;
  [[124, 64], [124, 73]].forEach(function (f, j) {
    ctx.fillStyle = 'hsl(' + ((hue + j * 120) % 360) + ',85%,62%)';
    ctx.fillRect(f[0], f[1] - 1, 4, 1); ctx.fillRect(f[0], f[1] + 4, 4, 1); ctx.fillRect(f[0] - 1, f[1], 1, 4); ctx.fillRect(f[0] + 4, f[1], 1, 4);
    var a = Math.floor(t * 12 + j) % 2; R(f[0] + 1 + a, f[1] + 1, 2 - a, 2, '#2a2f45');
  });
  // reloj con la hora de España (ver clock.js)
  var d = spainTime(), hh = (d.h % 12 + d.m / 60) / 12 * Math.PI * 2, mm = d.m / 60 * Math.PI * 2;
  function hand(a, L, c) { for (var s = 0; s <= L; s += 0.5) R(Math.round(251 + Math.sin(a) * s), Math.round(25 - Math.cos(a) * s), 1, 1, c); }
  hand(mm, 5, P.ink); hand(hh, 3.2, '#d9665a'); R(250, 24, 2, 2, P.ink);
  // póster de la red neuronal: una señal recorre las capas
  var nodes = [[217, 21], [217, 26], [217, 31], [224, 23], [224, 29], [231, 26]], step = Math.floor(t * 3) % 3;
  var layer = [[0, 1, 2], [3, 4], [5]][step];
  layer.forEach(function (k) { R(nodes[k][0] - 1, nodes[k][1] - 1, 2, 2, '#ffffff'); });
  // robot: ojos que parpadean y antena
  var blink = (t % 3.2) < 0.15;
  if (!blink) { R(37, 108, 2, 2, '#5ef0b0'); R(41, 108, 2, 2, '#5ef0b0'); } else { R(37, 109, 2, 1, '#5ef0b0'); R(41, 109, 2, 1, '#5ef0b0'); }
  R(39, 99, 2, 2, Math.floor(t * 2) % 2 ? '#ff5d6c' : '#7a3340');
  // portátil del puf: una búsqueda A* en miniatura (se expande, encuentra el camino y vuelve a empezar)
  R(42, 134, 14, 7, '#16213a');
  var L = LAPTOP_SEARCH, shownCells = Math.floor((t * 7) % (L.order.length + 14));
  L.walls.forEach(function (w) { R(42 + w[0], 134 + w[1], 1, 1, '#05070f'); });
  for (var q = 0; q < Math.min(shownCells, L.order.length); q++) R(42 + L.order[q][0], 134 + L.order[q][1], 1, 1, '#2c5a9a');
  if (shownCells >= L.order.length) L.path.forEach(function (c) { R(42 + c[0], 134 + c[1], 1, 1, '#6cbf7a'); });
  R(42 + L.start[0], 134 + L.start[1], 1, 1, '#7cc59a'); R(42 + L.goal[0], 134 + L.goal[1], 1, 1, '#f2a03b');
  // lámpara de la mesilla: brillo suave
  ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t * 1.3); R(ROOM.NIGHT.x + 1, ROOM.NIGHT.y - 8, 12, 9, '#fff2b0'); ctx.globalAlpha = 1;

}
