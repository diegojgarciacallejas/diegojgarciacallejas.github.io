/* Búsqueda de caminos en una cuadrícula: A*, Dijkstra y búsqueda voraz (basado en la web clásica).
   Casillas: 0 libre, 1 muro, 2 barro (cuesta MUD). Guarda en qué paso se descubre y se cierra cada casilla,
   para poder repetir la búsqueda paso a paso. */
var Paths = (function () {
  var MUD = 5;

  /* montón binario: saca siempre el de menor prioridad (a igualdad, el más reciente, para que A* vaya «recto») */
  function Heap() { this.a = []; this.n = 0; }
  Heap.prototype.less = function (x, y) { return x[0] < y[0] || (x[0] === y[0] && x[2] > y[2]); };
  Heap.prototype.push = function (f, id) {
    var a = this.a; a.push([f, id, this.n++]); var i = a.length - 1;
    while (i > 0) { var p = (i - 1) >> 1; if (!this.less(a[i], a[p])) break; var t = a[p]; a[p] = a[i]; a[i] = t; i = p; }
  };
  Heap.prototype.pop = function () {
    var a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; var i = 0, n = a.length;
      for (;;) {
        var l = 2 * i + 1, r = l + 1, m = i;
        if (l < n && this.less(a[l], a[m])) m = l;
        if (r < n && this.less(a[r], a[m])) m = r;
        if (m === i) break; var t = a[m]; a[m] = a[i]; a[i] = t; i = m;
      }
    }
    return top;
  };

  /* heurística: lo que falta «a ojo» hasta la meta, sin mirar muros */
  function heur(dx, dy, diag) {
    dx = Math.abs(dx); dy = Math.abs(dy);
    return diag ? Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy) : dx + dy;
  }

  /* cells: Uint8Array(cols * rows). algo: 'astar' | 'dijkstra' | 'greedy' */
  function solve(cells, cols, rows, s, goal, algo, diag) {
    var N = cols * rows, g = new Float64Array(N).fill(Infinity), h = new Float64Array(N), prev = new Int32Array(N).fill(-1);
    var seen = new Int32Array(N).fill(-1), shut = new Int32Array(N).fill(-1), order = [];
    var gx = goal % cols, gy = (goal / cols) | 0, heap = new Heap(), step = 0, found = false;
    for (var i = 0; i < N; i++) h[i] = heur(i % cols - gx, ((i / cols) | 0) - gy, diag);
    function prio(i) { return algo === 'dijkstra' ? g[i] : algo === 'greedy' ? h[i] : g[i] + h[i]; }
    g[s] = 0; seen[s] = 0; heap.push(prio(s), s);
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (diag) dirs = dirs.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    var t0 = (window.performance || Date).now();
    while (heap.a.length) {
      var cur = heap.pop()[1];
      if (shut[cur] >= 0) continue;
      shut[cur] = step; order.push(cur);
      if (cur === goal) { found = true; break; }
      var x = cur % cols, y = (cur / cols) | 0;
      for (var k = 0; k < dirs.length; k++) {
        var nx = x + dirs[k][0], ny = y + dirs[k][1];
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        var n = ny * cols + nx;
        if (cells[n] === 1 || shut[n] >= 0) continue;
        if (dirs[k][0] && dirs[k][1] && (cells[y * cols + nx] === 1 || cells[ny * cols + x] === 1)) continue;   // sin cortar esquinas
        var cost = (cells[n] === 2 ? MUD : 1) * (dirs[k][0] && dirs[k][1] ? Math.SQRT2 : 1), ng = g[cur] + cost;
        if (algo === 'greedy' ? seen[n] < 0 : ng < g[n]) {
          g[n] = ng; prev[n] = cur;
          if (seen[n] < 0) seen[n] = step + 1;
          heap.push(prio(n), n);
        }
      }
      step++;
    }
    var path = [];
    if (found) for (var c = goal; c !== -1; c = prev[c]) path.unshift(c);
    return { order: order, path: path, cost: found ? g[goal] : Infinity, found: found, g: g, h: h, seen: seen, shut: shut,
      steps: order.length, ms: (window.performance || Date).now() - t0 };
  }

  /* laberinto con «backtracking» recursivo sobre las casillas impares, y luego se abren algunos huecos para que haya varios caminos */
  function maze(cols, rows, rnd) {
    var cells = new Uint8Array(cols * rows).fill(1), stack = [[1, 1]];
    cells[cols + 1] = 0;
    while (stack.length) {
      var c = stack[stack.length - 1], opts = [];
      [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(function (d) {
        var nx = c[0] + d[0], ny = c[1] + d[1];
        if (nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && cells[ny * cols + nx] === 1) opts.push(d);
      });
      if (!opts.length) { stack.pop(); continue; }
      var d = opts[Math.floor(rnd() * opts.length)];
      cells[(c[1] + d[1] / 2) * cols + c[0] + d[0] / 2] = 0; cells[(c[1] + d[1]) * cols + c[0] + d[0]] = 0;
      stack.push([c[0] + d[0], c[1] + d[1]]);
    }
    for (var i = 0; i < cols * rows; i++) {
      var x = i % cols, y = (i / cols) | 0;
      if (cells[i] === 1 && x > 0 && y > 0 && x < cols - 1 && y < rows - 1 && rnd() < 0.1) cells[i] = 0;
    }
    return cells;
  }

  return { solve: solve, maze: maze, MUD: MUD };
})();
