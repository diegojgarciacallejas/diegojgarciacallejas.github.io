/* Sonido y música, sin archivos: todo se genera con Web Audio (ondas cuadradas, triangulares y ruido, como
   las consolas de antes). Sound.play('nombre') para un efecto; los botones de arriba (hud.js) los encienden
   y apagan. Se recuerda en este navegador: diego-sonido (por defecto sí) y diego-musica (por defecto también).
   Los navegadores no dejan sonar nada hasta que se pulsa algo, así que el audio arranca con el primer clic o tecla. */
var Sound = (function () {
  var ctx = null, out, sfx, mus, noiseBuf = null, timer = null, nextAt = 0, step = 0;
  function read(k, def) { try { var v = localStorage.getItem(k); return v === null ? def : v === '1'; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) { } }
  var on = read('diego-sonido', true), music = read('diego-musica', true);

  function ready() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC();
      out = ctx.createGain(); out.gain.value = 0.7; out.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(out);
      mus = ctx.createGain(); mus.gain.value = 0.55; mus.connect(out);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx.state !== 'closed';
  }
  // el primer gesto despierta el audio (y la música, si estaba encendida). En el móvil el navegador solo lo permite
  // al levantar el dedo (touchend, pointerup, click), no al tocar: por eso se intenta en todos y hasta que funcione
  function wake() {
    if (ctx && ctx.state === 'running' && (!music || timer)) return;
    if (ready() && music && !timer) startMusic();
  }
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(function (ev) { window.addEventListener(ev, wake, true); });
  document.addEventListener('visibilitychange', function () { if (ctx) { if (document.hidden) ctx.suspend(); else if (on || music) ctx.resume(); } });

  /* una nota: f (Hz), dur (s), forma, volumen, cuándo (s desde ahora), y a qué frecuencia desliza */
  function tone(f, dur, type, vol, at, slide, dest) {
    var t = ctx.currentTime + (at || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfx); o.start(t); o.stop(t + dur + 0.02);
  }
  /* ruido filtrado (pasos, chut, agua, gente) */
  function noise(dur, vol, freq, at, q) {
    var t = ctx.currentTime + (at || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfx); s.start(t); s.stop(t + dur + 0.02);
  }
  var FX = {
    blip: function (v) { tone(520 * (v || 1) + Math.random() * 40, 0.035, 'square', 0.025); },          // letras del diálogo (v: voz)
    mark: function () { tone(880, 0.06, 'triangle', 0.08); tone(1320, 0.08, 'triangle', 0.08, 0.06); }, // sale una «!»
    select: function () { tone(440, 0.04, 'square', 0.04); },
    ok: function () { tone(660, 0.05, 'square', 0.05); tone(990, 0.07, 'square', 0.05, 0.05); },
    step: function () { noise(0.035, 0.05, 700 + Math.random() * 300, 0, 2); },
    door: function () { noise(0.25, 0.06, 500, 0, 0.7); tone(330, 0.18, 'triangle', 0.06, 0, 160); },
    kick: function () { tone(160, 0.14, 'sine', 0.5, 0, 45); noise(0.06, 0.2, 2000); },
    goal: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, 'square', 0.06, i * 0.09); });
      noise(0.9, 0.08, 900, 0.1, 0.4);                                                                     // el público
    },
    miss: function () { tone(392, 0.16, 'square', 0.06); tone(262, 0.3, 'square', 0.06, 0.15); },
    water: function () { for (var i = 0; i < 4; i++) tone(1300 - i * 120, 0.07, 'sine', 0.08, 0.35 + i * 0.12, 600); },
    brick: function () { tone(1700 + Math.random() * 400, 0.025, 'square', 0.025); },
    hop: function () { tone(500, 0.12, 'triangle', 0.08, 0, 900); },
    logro: function () {
      [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.1, i * 0.08); });
      tone(2093, 0.4, 'sine', 0.04, 0.42);
    }
  };
  var GAP = { step: 0.12, brick: 0.04, blip: 0.03, mark: 0.15 }, last = {};
  function play(name, arg) {
    if (!on || !FX[name] || !ready()) return;
    var gap = GAP[name], now = ctx.currentTime;                       // los que se repiten mucho, con un mínimo entre uno y otro
    if (gap) { if (now - (last[name] || 0) < gap) return; last[name] = now; }
    try { FX[name](arg); } catch (e) { }
  }

  /* ---- música: un chiptune de videojuego (Do mayor, 132 BPM). Melodía con onda de pulso al 25 % (el sonido
     de las consolas de 8 bits), bajo, arpegios y batería. Dos partes (A y B) de 8 compases que se repiten. ---- */
  var BPM = 132, SIXT = 60 / BPM / 4, pulse = null;
  var CH = { C: [60, 64, 67], Am: [57, 60, 64], F: [53, 57, 60], G: [55, 59, 62], Em: [52, 55, 59] };
  var BARS = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'];
  // la melodía, en corcheas (8 por compás); -1 es silencio
  var MEL = [
    72, 76, 79, 76, 77, 76, 74, 72,  69, 72, 76, 72, 74, 72, 71, 69,  65, 69, 72, 77, 76, 74, 72, 74,  71, 74, 79, 77, 74, 71, 74, -1,
    72, 76, 79, 84, 83, 79, 76, 79,  81, 79, 76, 72, 74, 76, 72, 69,  77, 76, 74, 72, 74, 76, 77, 79,  79, -1, 77, -1, 74, -1, 71, -1,
    77, -1, 77, 79, 81, -1, 79, 77,  79, -1, 79, 81, 83, -1, 81, 79,  76, 79, 83, 79, 76, 79, 83, 86,  84, -1, 81, -1, 76, -1, 72, -1,
    77, 81, 84, 81, 77, 81, 84, 81,  79, 83, 86, 83, 79, 83, 86, 89,  88, -1, 84, -1, 79, -1, 76, -1,  72, -1, -1, -1, -1, -1, -1, -1
  ];
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function pulseWave() {                                               // onda de pulso al 25 % (serie de Fourier)
    if (pulse) return pulse;
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var k = 1; k < n; k++) im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * 0.25);
    return (pulse = ctx.createPeriodicWave(re, im));
  }
  function lead(f, dur, at) {
    var t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.setPeriodicWave(pulseWave()); o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.setValueAtTime(0.04, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mus); o.start(t); o.stop(t + dur + 0.02);
  }
  function drum(kind, at) {
    var t = ctx.currentTime + at;
    if (kind === 'kick') { tone(150, 0.12, 'sine', 0.22, at, 45, mus); return; }
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : 1800;
    var vol = kind === 'hat' ? 0.025 : 0.09, dur = kind === 'hat' ? 0.03 : 0.12;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(mus); s.start(t); s.stop(t + dur + 0.02);
  }
  function schedule() {
    while (nextAt < ctx.currentTime + 0.2) {
      var at = Math.max(0, nextAt - ctx.currentTime), bar = Math.floor(step / 16) % BARS.length, pos = step % 16, ch = CH[BARS[bar]];
      if (pos % 2 === 0) {
        var m = MEL[bar * 8 + pos / 2]; if (m > 0) lead(hz(m), SIXT * 1.8, at);                          // melodía
        tone(hz(ch[0] - 12 + (pos % 4 ? 12 : 0)), SIXT * 1.7, 'triangle', 0.07, at, 0, mus);            // bajo: fundamental y octava
        drum('hat', at);
      }
      tone(hz(ch[pos % 3] + 12), SIXT * 0.9, 'square', 0.012, at, 0, mus);                              // arpegio rápido, muy flojo
      if (pos === 0 || pos === 8) drum('kick', at);
      if (pos === 4 || pos === 12) drum('snare', at);
      nextAt += SIXT; step++;
    }
  }
  function startMusic() {
    if (!ready() || timer) return;
    nextAt = ctx.currentTime + 0.1; step = 0;
    timer = setInterval(schedule, 60);
  }
  function stopMusic() { clearInterval(timer); timer = null; }

  return {
    play: play,
    isOn: function () { return on; }, isMusic: function () { return music; },
    state: function () { return ctx ? ctx.state : 'sin audio'; },
    setOn: function (v) { on = !!v; save('diego-sonido', on); if (on) play('ok'); },
    setMusic: function (v) { music = !!v; save('diego-musica', music); if (music) startMusic(); else stopMusic(); }
  };
})();
