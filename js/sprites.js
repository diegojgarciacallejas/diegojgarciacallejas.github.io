/* Sprites en pixel art: cada letra es un color de SPR_PAL. Edita aquí el muñeco. */
var SPR_PAL = {
  // Diego (16x38): pelo, piel, ojos, traje
  h: '#281c18', H: '#4a3026', f: '#6b5040', K: '#281c18', s: '#f8bb7f', S: '#cf7e47', w: '#f7f3ef', k: '#151519',
  o: '#17161e', j: '#2c2a39', J: '#201f2b', t: '#ba272b', T: '#8e1a2a', Z: '#66606e',
  // iconos del menú
  g: '#3f9a68', G: '#2a6a49', L: '#ece9de', D: '#2d2150', u: '#7aa7ee', v: '#6f5fb0', R: '#d7566a', y: '#f0b429'
};
var SPRITES = {
  diego: ["......hhhhhhh...", "...hhhhhHhHHHh..", "..hhhHHHhHHHHHh.", ".hhHHHhHHhHhhHh.", ".hHHhhhhhhhhhhh.", ".hhhhHsssssssHh.", ".hHHHsssssssss..", "..ffsKKKssKKKs..", "..ffswkwsswkws..", ".ssfswkwsswkwss.", ".sSsssssssssss..", ".sSsssssssssss..", "..ssssswwwwsss..", "....sssssssss...", "......SSSSS.....", "....ojwsswjo....", "..oojjwTTwjjoo..", ".ojJjjwttwjjojo.", ".ojjojwttwjJLjo.", ".ojJjJwttwjjLjo.", ".ojojJjttjJjojo.", "ojjojjjTTjjjojjo", "ojjoJjjJjjjJojjo", "ojjoJJjJZjjJojjo", "oJJoJjjJjjjJoJJo", "owwoJjjJjjjJowwo", "Sssoooooooooosss", "SssoJJJoJJJJosss", ".sSojjjJoJjjoSs.", "...ojjjo.JJjo...", "...ojjJo.oJjo...", "...ojjJo.oJjo...", "...ojJo..oJjo...", "...ojJo..oJjo...", "...ojJo..oJjo...", "...oooo..oooo...", "..ZZJJo..oJJZZ..", "..ooJJo..oJJooo."],
  doc: [".oooooooooo.", "ouuuuuuuuuuo", "oLLLLLLLLLLo", "oLvvvvvvLLLo", "oLLLLLLLLLLo", "oLvvvvvvvLLo", "oLLLLLLLLLLo", "oLvvvvvvLLLo", "oLLLLLLLLLRo", "oLvvvvvLLLRo", "oLLLLLLLLyyo", "oLLLLLLLLyyo", "oooooooooooo"],
  pc: ["oooooooooooooooo", "oDDDDDDDDDDDDDDo", "oDuuuuuuuuuuuuDo", "oDuLLLLLuuuuuuDo", "oDuuuuuuuuuuuuDo", "oDuLLLLLLLLuuuDo", "oDuuuuuuuuuuuuDo", "oDuuuuuuuuuuuuDo", "oDDDDDDDDDDDDDDo", "oooooooooooooooo", "......oDDo......", "......oDDo......", "...ovvvvvvvvo...", "...oooooooooo..."],
  lab: ["ooooooooooo.....", "okkkkkkkkko.....", "okLLLLLLkko.....", "okkkkkLLkko..g..", "okkkkLLkkko..g..", "okkkLLkkkko..g..", "okkkLLkkkko..g..", "okkLLkkkkko..gg.", "okkLLkkkkko.ggg.", "okkkkkkkkkoggggg", "ooooooooooo.....", "...........LLLLL"],
};
/* Convierte un sprite en textura de Phaser (1 carácter = 1 píxel) */
function makeTexture(scene, key, rows, pal) {
  pal = pal || SPR_PAL;
  if (scene.textures.exists(key)) return key;
  var w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0), h = rows.length;
  var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  var ctx = cv.getContext('2d');
  rows.forEach(function (r, y) { for (var x = 0; x < r.length; x++) { var c = pal[r[x]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); } } });
  scene.textures.addCanvas(key, cv);
  return key;
}

/* ---- Animación del muñeco ----
   DIEGO_FRAMES.down / up / side = [quieto, paso A, quieto, paso B].
   «down» es el sprite de arriba; «up» (de espaldas) y los pasos se generan a partir de él;
   «side» mira a la derecha (la izquierda es el mismo dibujo en espejo). */
var DIEGO_SIDE = ["......hhhhhh....", "....hhhhHhHHh...", "...hhhHHHhHHHh..", "..hhHHhHHhHhhHh.", "..hHHhhhhhhhhhh.", "..hhhhhhhhHsssh.", "..hHhhhhhsssssh.", "..hhhhhfsssKKs..", "..hhhhffsssswks.", "..hhhsfssssswkss", "...hhsSssssssss.", "....hsSssssssss.", ".....ssssssswws.", "......sssssss...", "......SSSS......",
  ".....ojjjwso....", "....ojjjjwTo....", "....ojjjjwto....", "....ojjojjto....", "....ojjojjto....", "....ojjojjjo....", "....oJjojjjo....", "....oJjojjjo....", "....oJjojjJo....", "....oJjojjJo....", "....oJwwojJo....", "....oSssoooo....", "....oSssJJJo....", ".....oooJjjo....",
  ".....ojjjjo.....", ".....ojJjjo.....", ".....ojJjjo.....", ".....ojJjjo.....", ".....ojJjjo.....", ".....ojJjjo.....", ".....oooooo.....", ".....oJJJZZZ....", ".....ooooooo...."];
// piernas de perfil dando un paso (filas 29-37): pierna de atrás a la izquierda, la de delante a la derecha
var DIEGO_STRIDE = [".....ojjjjo.....", ".....oJjjjjo....", "....oJJoojjo....", "....oJJo.ojjo...", "...oJJo..ojjo...", "...oJJo...ojjo..", "..oooo....oooo..", ".oJJZo....ojjZZ.", ".ooooo....ooooo."];

var DIEGO_FRAMES = (function () {
  function grid(rows) { return rows.map(function (r) { return r.split(''); }); }
  function text(g) { return g.map(function (r) { return r.join(''); }); }
  // desplaza el bloque (columnas x0..x1, filas y0..y1) dy filas; el hueco que deja queda vacío
  function shift(g, x0, x1, y0, y1, dy) {
    var src = g.map(function (r) { return r.slice(); });
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) g[y][x] = '.';
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) if (src[y][x] !== '.' && g[y + dy]) g[y + dy][x] = src[y][x];
    return g;
  }
  // un paso de frente/espaldas: sube un pie y balancea los brazos al revés
  function step(rows, left) {
    var g = grid(rows), legX = left ? [0, 7] : [8, 15], up = left ? [0, 2] : [13, 15], dn = left ? [13, 15] : [0, 2];
    shift(g, legX[0], legX[1], 30, 37, -1);                    // pie levantado
    shift(g, up[0], up[1], 25, 28, -1);                        // mano que sube
    shift(g, dn[0], dn[1], 25, 28, 1);                         // mano que baja: la manga se alarga
    for (var x = dn[0]; x <= dn[1]; x++) g[25][x] = g[24][x];
    return text(g);
  }
  // de espaldas: la cara se cubre de pelo y la camisa y la corbata pasan a ser chaqueta
  var back = SPRITES.diego.map(function (r, y) {
    if (y >= 5 && y <= 12) return ["", "", "", "", "", ".hhHhhHhhHhhHHh.", ".hHHhHHhHHhHHh..", "..hHhhHhhHhhHh..", ".shhHhhHhhHhhhs.", ".sShhhhhhhhhhSs.", ".sShhhhhhhhhhh..", "..hhhhhhhhhhhh..", "...hhhhhhhhhh..."][y];
    if (y >= 15 && y <= 25) return r.replace(/[wtTLZ]/g, 'j').replace(y === 15 ? /s/g : /^$/, 'j');
    return r;
  });
  function stride(far, near) {
    return DIEGO_SIDE.slice(0, 29).concat(DIEGO_STRIDE.map(function (r) {
      return r.replace(/[jJ]/g, function (c, x) { return x < 8 ? (c === 'J' ? far : far === 'J' ? 'J' : 'j') : near; });
    }));
  }
  return {
    down: [SPRITES.diego, step(SPRITES.diego, true), SPRITES.diego, step(SPRITES.diego, false)],
    up: [back, step(back, true), back, step(back, false)],
    side: [DIEGO_SIDE, stride('J', 'j'), DIEGO_SIDE, stride('j', 'J')]
  };
})();

/* Robot acompañante con la chispa de Claude en el visor (dos fotogramas: la chispa centellea) */
var BUDDY = {
  a: ["......a......", "......o......", "..ooooooooo..", ".occccccccCo.", ".ocvavavavCo.", ".ocvvaaavvCo.", ".ocvaaAaavCo.", ".ocvvaaavvCo.", ".ocvavavavCo.", ".occcccccCCo.", "..ooooooooo..", "...occccCo...", "..oocAAACoo..", "..oocccCCoo..", "....occCo....", "....ooooo....", ".....AaA....."],
  b: ["......A......", "......o......", "..ooooooooo..", ".occccccccCo.", ".ocvvvvvvvCo.", ".ocvvvavvvCo.", ".ocvvaAavvCo.", ".ocvvvavvvCo.", ".ocvvvvvvvCo.", ".occcccccCCo.", "..ooooooooo..", "...occccCo...", "..oocAAACoo..", "..oocccCCoo..", "....occCo....", "....ooooo....", "......a......"],
  pal: { o: '#2b1d2e', c: '#f4efe6', C: '#cfc4b3', v: '#1b2033', a: '#d97757', A: '#f0a585' }
};
/* Bocadillo con exclamación que sale encima de los objetos con los que se puede interactuar */
var EXCL = {
  rows: [".ooooooo.", "owwwwwwwo", "owwwrwwwo", "owwwrwwwo", "owwwrwwwo", "owwwrwwwo", "owwwwwwwo", "owwwrwwwo", "owwwwwwwo", ".oowwwoo.", "...owo...", "....o...."],
  pal: { o: '#2b1d2e', w: '#fffaf0', r: '#d9665a' }
};
