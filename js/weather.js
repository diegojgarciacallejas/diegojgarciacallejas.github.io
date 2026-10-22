/* El tiempo que hace ahora en Madrid (lo dice Diego al mirar por la ventana).
   Usa Open-Meteo, que es gratis y no pide clave. Guarda la respuesta 10 minutos;
   si no hay conexión, Diego dice algo genérico. */
var WEATHER = {
  url: 'https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=Europe%2FMadrid',
  cacheMs: 10 * 60 * 1000,
  timeoutMs: 4000,
  last: null, at: 0
};

/* código del tiempo (WMO) → cómo está el cielo, ya en frase */
function weatherSky(code) {
  if (code === 0) return 'el cielo está despejado';
  if (code <= 2) return 'hay algunas nubes';
  if (code === 3) return 'está nublado';
  if (code <= 48) return 'hay niebla';
  if (code <= 57) return 'está chispeando';
  if (code <= 67) return 'está lloviendo';
  if (code <= 77) return '¡está nevando!';
  if (code <= 82) return 'caen chaparrones';
  if (code <= 86) return 'nieva a ratos';
  return 'hay tormenta';
}

/* una frase sobre el tiempo de Madrid; cb(texto) */
function madridWeather(cb) {
  if (WEATHER.last && Date.now() - WEATHER.at < WEATHER.cacheMs) { cb(weatherSay(WEATHER.last)); return; }
  var done = false, timer = setTimeout(function () { finish(null); }, WEATHER.timeoutMs);
  function finish(cur) {
    if (done) return; done = true; clearTimeout(timer);
    if (cur) { WEATHER.last = cur; WEATHER.at = Date.now(); }
    cb(cur ? weatherSay(cur) : t('Desde aquí se ve Madrid, pero ahora mismo no consigo saber qué tiempo hace. Será cuestión de asomarse.'));
  }
  try {
    fetch(WEATHER.url).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { finish(d && weatherValid(d.current) ? d.current : null); }, function () { finish(null); });
  } catch (e) { finish(null); }
}

/* la respuesta trae lo que esperamos (números de verdad)? Si no, se trata como si no hubiera conexión */
function weatherValid(c) {
  return !!c && ['temperature_2m', 'weather_code', 'wind_speed_10m'].every(function (k) { return typeof c[k] === 'number' && isFinite(c[k]); });
}

function weatherSay(c) {
  var temp = Math.round(c.temperature_2m), sky = t(weatherSky(c.weather_code)), night = c.is_day === 0;
  var s = t('En Madrid ahora mismo estamos a {0} °C y {1}', temp, sky) + (night ? t('. Ya es de noche') : '') + '.';
  if (c.weather_code >= 51 && c.weather_code <= 99) s += t(' Buen día para quedarse dentro programando.');
  else if (temp >= 32) s += t(' Calor de Madrid: toca buscar la sombra.');
  else if (temp <= 6) s += t(' Hace frío de verdad: mejor abrigarse.');
  else if (c.wind_speed_10m >= 30) s += t(' Y sopla bastante aire.');
  else if (!night && c.weather_code <= 2) s += t(' Buen día para salir al patio.');
  return s;
}
