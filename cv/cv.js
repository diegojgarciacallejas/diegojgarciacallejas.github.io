/* Pinta el expediente a partir de CV (cv-data.js) en el idioma elegido */
(function () {
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function $(id) { return document.getElementById(id); }

  // avatar: el busto del muñeco del juego, píxel a píxel
  (function () {
    var cv = $('avatar'), ctx = cv.getContext('2d'), rows = SPRITES.diego.slice(0, 22);
    rows.forEach(function (r, y) { for (var x = 0; x < r.length; x++) { var c = SPR_PAL[r[x]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); } } });
  })();

  // volver: al juego si se vino de él; si se entró directamente, al menú
  function back(e) {
    e.preventDefault();
    if (window.parent !== window) { parent.postMessage('viewer:close', location.origin); return; }   // dentro del juego: cerrar el visor
    var fromGame = document.referrer && document.referrer.indexOf(location.origin) === 0 && history.length > 1;
    if (fromGame) history.back(); else location.href = '../#menu';
  }
  function button(label, kind, href, onClick) {
    var a = el('a', 'btn ' + (kind || ''), label); a.href = href || '#';
    if (/^https?:/.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener'; }
    if (onClick) a.addEventListener('click', onClick);
    return a;
  }

  function render(lang) {
    var L = CV[lang], mail = CV.email.join('@');
    document.documentElement.lang = lang;
    document.title = (lang === 'es' ? 'Expediente' : 'Resume') + ' · ' + CV.name;
    $('name').textContent = CV.name;
    $('role').textContent = L.role;
    var contact = $('contact'); contact.textContent = '';
    var m = el('a', null, mail); m.href = 'mailto:' + mail; m.target = '_top';   // dentro de un marco, el correo lo abre la ventana principal
    contact.append(m, ' · ' + L.place);

    var act = $('actions'); act.textContent = '';
    act.append(button('← ' + L.ui.back, 'go', '../#menu', back));
    if (CV.pdf[lang]) { var d = button(L.ui.pdf, 'primary', CV.pdf[lang]); d.setAttribute('download', ''); act.append(d); }
    act.append(button(L.ui.print, '', '#', function (e) { e.preventDefault(); window.print(); }),
      button('GitHub', '', CV.github), button('LinkedIn', '', CV.linkedin));

    var body = $('body'); body.textContent = '';
    body.append(el('div', 'rule'));
    L.sections.forEach(function (s) {
      var sec = el('section'); sec.append(el('h2', null, s.title));
      if (s.intro) sec.append(el('p', 'intro', s.intro));
      (s.entries || []).forEach(function (e) {
        var box = el('div', 'entry');
        if (e.date) box.append(el('div', 'date', e.date));
        var h = el('h3', null, e.title);
        if (e.org) h.append(el('span', 'org', ' — ' + e.org));
        box.append(h);
        if (e.bullets) { var ul = el('ul'); e.bullets.forEach(function (b) { ul.append(el('li', null, b)); }); box.append(ul); }
        if (e.tags) box.append(tags(e.tags));
        sec.append(box);
      });
      (s.groups || []).forEach(function (g) { var d = el('div', 'group'); d.append(el('h3', null, g.name), tags(g.tags)); sec.append(d); });
      (s.text || []).forEach(function (t) { sec.append(el('p', null, t)); });
      body.append(sec);
    });
    $('foot').textContent = '© ' + new Date().getFullYear() + ' ' + CV.name + ' · ' + L.ui.made;
    document.querySelectorAll('#lang button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === lang); });
    I18N.set(lang);   // el idioma elegido aquí vale para toda la web
  }
  function tags(list) { var t = el('div', 'tags'); list.forEach(function (x) { t.append(el('span', 'tag', x)); }); return t; }

  document.querySelectorAll('#lang button').forEach(function (b) { b.addEventListener('click', function () { render(b.dataset.lang); }); });
  // idioma: el de la web (i18n.js: ?lang=en, el último elegido o el del navegador)
  render(LANG);
  // Esc vuelve, como en el juego
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') back(e); });
})();
