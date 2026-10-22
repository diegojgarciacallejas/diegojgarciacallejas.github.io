/* Red convolucional para reconocer dígitos, en JavaScript puro (sin librerías).
   Arquitectura: conv 3x3 (8 filtros) + ReLU → max-pool 2x2 → conv 3x3 (16 filtros) + ReLU → max-pool 2x2 → densa (10) → softmax.
   Los pesos se entrenaron con PyTorch sobre MNIST y están en model.js (los mismos que la web clásica). */
var CNN = (function () {
  var M = window.CNN_MODEL;
  function flat(a) { return Float32Array.from(a.flat(Infinity)); }
  var W1 = flat(M.c1w), B1 = flat(M.c1b), W2 = flat(M.c2w), B2 = flat(M.c2b), WF = flat(M.fcw), BF = flat(M.fcb);

  /* convolución 3x3 con relleno (la salida mide lo mismo que la entrada) seguida de ReLU */
  function conv3(inp, Cin, H, W, w, b, Cout) {
    var out = new Float32Array(Cout * H * W);
    for (var o = 0; o < Cout; o++) for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var s = b[o];
      for (var c = 0; c < Cin; c++) {
        var wb = (o * Cin + c) * 9, ib = c * H * W;
        for (var ky = 0; ky < 3; ky++) {
          var yy = y + ky - 1; if (yy < 0 || yy >= H) continue;
          for (var kx = 0; kx < 3; kx++) {
            var xx = x + kx - 1; if (xx < 0 || xx >= W) continue;
            s += inp[ib + yy * W + xx] * w[wb + ky * 3 + kx];
          }
        }
      }
      out[o * H * W + y * W + x] = s > 0 ? s : 0;
    }
    return out;
  }
  /* max-pool 2x2: de cada cuadrado de 4 píxeles se queda el mayor (la imagen se reduce a la mitad) */
  function pool2(inp, C, H, W) {
    var h = H >> 1, w = W >> 1, out = new Float32Array(C * h * w);
    for (var c = 0; c < C; c++) for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = c * H * W + 2 * y * W + 2 * x;
      out[c * h * w + y * w + x] = Math.max(inp[i], inp[i + 1], inp[i + W], inp[i + W + 1]);
    }
    return out;
  }
  /* img: Float32Array(784) con valores entre 0 y 1. Devuelve lo que sale de cada capa y las probabilidades */
  function forward(img) {
    var a1 = conv3(img, 1, 28, 28, W1, B1, 8), p1 = pool2(a1, 8, 28, 28);
    var a2 = conv3(p1, 8, 14, 14, W2, B2, 16), p2 = pool2(a2, 16, 14, 14);
    var logits = new Float32Array(10), mx = -1e9, k, i;
    for (k = 0; k < 10; k++) { var s = BF[k]; for (i = 0; i < 784; i++) s += WF[k * 784 + i] * p2[i]; logits[k] = s; if (s > mx) mx = s; }
    var probs = new Float32Array(10), sum = 0;
    for (k = 0; k < 10; k++) { probs[k] = Math.exp(logits[k] - mx); sum += probs[k]; }
    for (k = 0; k < 10; k++) probs[k] /= sum;
    return { input: img, a1: a1, p1: p1, a2: a2, p2: p2, logits: logits, probs: probs };
  }

  /* El dibujo (trazos con alfa sobre fondo transparente) → imagen 28x28 al estilo MNIST:
     recorta el trazo, lo escala a 20 px por su lado mayor y lo centra por su centro de masas. */
  function preprocess(canvas) {
    var S = canvas.width, ctx = canvas.getContext('2d', { willReadFrequently: true }), d = ctx.getImageData(0, 0, S, S).data;
    var x0 = S, y0 = S, x1 = -1, y1 = -1, x, y;
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 24) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return null;
    var bw = x1 - x0 + 1, bh = y1 - y0 + 1, sc = 20 / Math.max(bw, bh);
    var tw = Math.max(1, Math.round(bw * sc)), th = Math.max(1, Math.round(bh * sc));
    var t = document.createElement('canvas'); t.width = t.height = 28;
    var tc = t.getContext('2d', { willReadFrequently: true });
    tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
    tc.drawImage(canvas, x0, y0, bw, bh, Math.round((28 - tw) / 2), Math.round((28 - th) / 2), tw, th);
    var id = tc.getImageData(0, 0, 28, 28).data, m = 0, cx = 0, cy = 0;
    for (y = 0; y < 28; y++) for (x = 0; x < 28; x++) { var a = id[(y * 28 + x) * 4 + 3]; m += a; cx += a * x; cy += a * y; }
    cx /= m; cy /= m;
    var sx = Math.round(13.5 - cx), sy = Math.round(13.5 - cy), out = new Float32Array(784);
    for (y = 0; y < 28; y++) for (x = 0; x < 28; x++) {
      var nx = x + sx, ny = y + sy;
      if (nx >= 0 && nx <= 27 && ny >= 0 && ny <= 27) out[ny * 28 + nx] = id[(y * 28 + x) * 4 + 3] / 255;
    }
    return out;
  }
  function fromBytes(arr) { var o = new Float32Array(784); for (var i = 0; i < 784; i++) o[i] = arr[i] / 255; return o; }

  /* los 8 filtros de la primera capa (3x3), para enseñarlos */
  function filters1() { var f = []; for (var o = 0; o < 8; o++) f.push(W1.slice(o * 9, o * 9 + 9)); return f; }

  return { forward: forward, preprocess: preprocess, fromBytes: fromBytes, filters1: filters1, report: window.TRAIN_REPORT };
})();
