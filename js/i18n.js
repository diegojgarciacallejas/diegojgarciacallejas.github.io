/* Idioma de la web: español o inglés. Se elige con ?lang=en, con el botón ES/EN (se recuerda en «lang» para
   toda la web) o, la primera vez, según el idioma del navegador.
   - t('texto {0}', a): la traducción de un texto del código (con huecos {0}, {1}… para números o nombres).
   - I18N.deep(obj): traduce todos los textos de un objeto de datos (CFG, PEOPLE, LOGROS…).
   - En las páginas HTML, lo que aparece en pantalla se traduce solo: los textos sueltos con el diccionario
     (js/lang-en.js) y los párrafos con formato desde su atributo data-en (escrito a mano en el HTML).
   El español es el original: con LANG = 'es' no se toca nada. */
var LANG = (function () {
  var q = (location.search.match(/[?&]lang=(es|en)\b/) || [])[1], saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) { }
  var l = q || (saved === 'es' || saved === 'en' ? saved : (/^es\b/i.test(navigator.language || 'es') ? 'es' : 'en'));
  if (q) try { localStorage.setItem('lang', q); } catch (e) { }
  document.documentElement.lang = l;
  return l;
})();
var EN = {}, EN_RX = [];   // el diccionario (lang-en.js): EN['texto'] = 'text'; EN_RX = [[/patrón/, 'reemplazo']]

function t(s) {
  var r = s, args = arguments;
  if (LANG === 'en' && typeof s === 'string') {
    if (Object.prototype.hasOwnProperty.call(EN, s)) r = EN[s];
    else for (var i = 0; i < EN_RX.length; i++) if (EN_RX[i][0].test(s)) { r = s.replace(EN_RX[i][0], EN_RX[i][1]); break; }
  }
  return args.length > 1 ? String(r).replace(/\{(\d+)\}/g, function (m, k) { return args[+k + 1] != null ? args[+k + 1] : m; }) : r;
}
/* un número con decimales, a la manera de cada idioma (0,5 en español; 0.5 en inglés) */
function tnum(v, dec) { var s = Number(v).toFixed(dec == null ? 2 : dec); return LANG === 'en' ? s : s.replace('.', ','); }

var I18N = (function () {
  function setLang(l) { try { localStorage.setItem('lang', l); } catch (e) { } }
  /* todos los textos de un objeto (recorriéndolo entero), si están en el diccionario */
  function deep(o, seen) {
    if (LANG !== 'en' || !o || typeof o !== 'object') return o;
    seen = seen || [];
    if (seen.indexOf(o) >= 0) return o; seen.push(o);
    Object.keys(o).forEach(function (k) {
      var v = o[k];
      if (typeof v === 'string') o[k] = t(v);
      else if (v && typeof v === 'object') deep(v, seen);
    });
    return o;
  }
  /* ---- páginas HTML: traducir lo que va apareciendo ---- */
  var done = typeof WeakSet === 'function' ? new WeakSet() : null, ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
  function text(n) {
    var v = n.nodeValue, k = v.trim(); if (!k) return;
    var r = t(k); if (r !== k) n.nodeValue = v.replace(k, r);
  }
  function el(e) {
    if (done && done.has(e)) return;
    var en = e.getAttribute('data-en');
    if (en != null) { if (done) done.add(e); e.innerHTML = en; return; }   // el párrafo entero, escrito a mano en el HTML
    ATTRS.forEach(function (a) { var v = e.getAttribute(a); if (v) { var r = t(v.trim()); if (r !== v.trim()) e.setAttribute(a, r); } });
    if (/^(SCRIPT|STYLE|TEXTAREA|CANVAS)$/.test(e.nodeName)) return;   // de estos, solo sus atributos (no lo que llevan dentro)
    for (var c = e.firstChild; c; c = c.nextSibling) walk(c);
  }
  function walk(n) {
    if (n.nodeType === 3) { if (!/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode && n.parentNode.nodeName)) text(n); }
    else if (n.nodeType === 1 && !(n.closest && n.closest('[data-no-i18n]'))) el(n);
  }
  function observe() {
    if (LANG !== 'en' || typeof MutationObserver !== 'function') return;
    var root = document.documentElement;
    walk(root);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') { if (!(m.target.parentNode && m.target.parentNode.closest && m.target.parentNode.closest('[data-no-i18n]'))) text(m.target); }
        else if (m.type === 'attributes') { var v = m.target.getAttribute(m.attributeName); if (v) { var r = t(v.trim()); if (r !== v.trim()) m.target.setAttribute(m.attributeName, r); } }
        else m.addedNodes.forEach(walk);
      });
    }).observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  return { set: setLang, deep: deep, observe: observe };
})();
