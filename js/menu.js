/* ==========================================================================
   MENÚ — barra de escritorio, índice grande y ventanas retro (Radio, Laboratorio).
   API pública:
     PF.windows = { open(id), close(id), toggle(id), isOpen(id) }   ids: 'radio' | 'lab'
     PF.menu    = { openIndex(), closeIndex(), toggleIndex() }
   Atajos: I (índice) · T (tema) · L (laboratorio) · Espacio (reproducir/pausa)
   ========================================================================== */
(function () {
  const PF = window.PF;
  const C = PF.config;
  const host = document.getElementById("ui-menu");
  if (!host || !PF.music) return;
  const M = PF.music;
  const mobileMQ = window.matchMedia("(max-width: 640px)");
  const HINT_KEY = "pf-hint-v1";
  const WIN_KEY = "pf-win-v1";

  const ICON = {
    play: '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M2 1h3v10H2zM7 1h3v10H7z" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M1 1h2v10H1zM11 1v10L4 6z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M9 1h2v10H9zM1 1l7 5-7 5z" fill="currentColor"/></svg>'
  };

  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };
  const pad2 = (n) => String(n).padStart(2, "0");
  const mmss = (s) => { s = Math.max(0, Math.floor(s || 0)); return pad2(Math.floor(s / 60)) + ":" + pad2(s % 60); };
  const barH = () => { const b = host.querySelector(".mb"); return b ? b.offsetHeight : 30; };

  /* Scroll a una sección; si no existe el id preferido usa el de reserva. */
  function go(sel, fallback) {
    const el = document.querySelector(sel) || (fallback && document.querySelector(fallback));
    if (el) PF.scrollTo(el);
  }
  function detailOpen() { const d = document.getElementById("detail"); return !!(d && !d.hidden); }

  /* ======================================================================
     VENTANAS RETRO
     ====================================================================== */
  const W = {};
  const stack = [];
  let saved = {};
  try { saved = JSON.parse(lsGet(WIN_KEY) || "{}") || {}; } catch (e) { saved = {}; }

  function clampPos(w, x, y) {
    const ew = w.el.offsetWidth, mb = barH();
    return [
      Math.min(Math.max(0, x), Math.max(0, window.innerWidth - ew)),
      Math.min(Math.max(mb, y), Math.max(mb, window.innerHeight - 30))
    ];
  }
  function placeWin(w, x, y) {
    if (mobileMQ.matches) { w.el.style.left = w.el.style.top = ""; return; }
    const p = clampPos(w, x, y);
    w.el.style.left = p[0] + "px";
    w.el.style.top = p[1] + "px";
    w.pos = p;
  }
  function defaultPos(w) {
    const ew = w.el.offsetWidth, y = barH() + 18;
    if (w.id === "radio") return [window.innerWidth - ew - 24, y];
    return [window.innerWidth - 320 - ew - 48, y];
  }
  function bringFront(w) {
    const i = stack.indexOf(w.id);
    if (i >= 0) stack.splice(i, 1);
    stack.push(w.id);
    stack.forEach((id, k) => { W[id].el.style.zIndex = String(60 + k); W[id].el.classList.toggle("is-front", k === stack.length - 1); });
  }

  function defWindow(id, title, cls, build, onOpen, onClose) {
    const el = document.createElement("section");
    el.className = "win " + cls;
    el.id = "win-" + id;
    el.hidden = true;
    el.tabIndex = -1;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", title);
    el.innerHTML =
      '<div class="win-bar"><button type="button" class="win-close" aria-label="Cerrar ' + title + '"></button>' +
      '<span class="win-title">' + title + '</span></div><div class="win-body" data-lenis-prevent></div>';
    host.appendChild(el);
    const w = (W[id] = { id, el, title, build, onOpen, onClose, built: false, open: false, opener: null, pos: null, body: el.querySelector(".win-body") });

    el.addEventListener("pointerdown", () => bringFront(w), true);
    el.querySelector(".win-close").addEventListener("click", () => closeWin(id));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.stopPropagation(); closeWin(id); }
    });

    // Arrastre por la barra de título
    const bar = el.querySelector(".win-bar");
    let drag = null;
    bar.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || mobileMQ.matches || e.target.closest(".win-close")) return;
      const r = el.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
      bar.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
      e.preventDefault();
    });
    bar.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      placeWin(w, e.clientX - drag.dx, e.clientY - drag.dy);
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      el.classList.remove("is-dragging");
      if (w.pos) { saved[id] = w.pos; lsSet(WIN_KEY, JSON.stringify(saved)); }
    };
    bar.addEventListener("pointerup", end);
    bar.addEventListener("pointercancel", end);
    return w;
  }

  function openWin(id) {
    const w = W[id];
    if (!w) return;
    if (w.open) { bringFront(w); w.el.focus({ preventScroll: true }); return; }
    if (mobileMQ.matches) Object.keys(W).forEach((k) => { if (k !== id) closeWin(k, true); });   // una hoja inferior a la vez
    if (!w.built) { w.build(w.body, w); w.built = true; }
    w.opener = document.activeElement;
    w.el.hidden = false;
    w.open = true;
    const s = saved[id];
    const d = Array.isArray(s) && s.length === 2 ? s : defaultPos(w);
    placeWin(w, d[0], d[1]);
    bringFront(w);
    w.el.focus({ preventScroll: true });
    if (w.onOpen) w.onOpen(w);
    hideHint();
    refreshMenus();
  }
  function closeWin(id, silent) {
    const w = W[id];
    if (!w || !w.open) return;
    w.open = false;
    w.el.hidden = true;
    const i = stack.indexOf(id);
    if (i >= 0) stack.splice(i, 1);
    if (stack.length) bringFront(W[stack[stack.length - 1]]);
    if (w.onClose) w.onClose(w);
    if (!silent && w.opener && document.contains(w.opener) && w.opener.focus) w.opener.focus({ preventScroll: true });
    w.opener = null;
  }
  const toggleWin = (id) => (W[id] && W[id].open ? closeWin(id) : openWin(id));

  PF.windows = { open: openWin, close: closeWin, toggle: toggleWin, isOpen: (id) => !!(W[id] && W[id].open) };

  function reflowWindows() {
    Object.keys(W).forEach((id) => {
      const w = W[id];
      if (!w.open) return;
      if (mobileMQ.matches) { w.el.style.left = w.el.style.top = ""; return; }
      const p = w.pos || saved[id] || defaultPos(w);
      placeWin(w, p[0], p[1]);
    });
  }
  window.addEventListener("resize", reflowWindows);
  (mobileMQ.addEventListener ? mobileMQ.addEventListener.bind(mobileMQ, "change") : mobileMQ.addListener.bind(mobileMQ))(reflowWindows);

  /* ======================================================================
     VENTANA RADIO
     ====================================================================== */
  let visRaf = 0;
  const peaks = [];

  function buildRadio(body) {
    body.innerHTML =
      '<div class="rd">' +
        '<div class="rd-now" aria-live="polite">' +
          '<div class="rd-title display" data-rd="title"></div>' +
          '<div class="rd-meta label"><span data-rd="artist"></span><span class="rd-time" data-rd="time">00:00</span></div>' +
        '</div>' +
        '<canvas class="rd-vis" data-rd="vis" aria-hidden="true"></canvas>' +
        '<div class="rd-ctl">' +
          '<button type="button" class="rd-btn" data-rd="prev" aria-label="Pista anterior">' + ICON.prev + '</button>' +
          '<button type="button" class="rd-btn rd-play" data-rd="play" aria-label="Reproducir">' + ICON.play + '</button>' +
          '<button type="button" class="rd-btn" data-rd="next" aria-label="Pista siguiente">' + ICON.next + '</button>' +
          '<label class="rd-vol"><span class="visually-hidden">Volumen</span><input type="range" min="0" max="1" step="0.01" data-rd="vol"></label>' +
        '</div>' +
        '<ol class="rd-list" data-rd="list"></ol>' +
      '</div>';
    const q = (k) => body.querySelector('[data-rd="' + k + '"]');
    const list = q("list");
    M.tracks.forEach((t, i) => {
      const li = document.createElement("li");
      li.innerHTML = '<button type="button" class="rd-row"><span class="rd-n">' + pad2(i + 1) + '</span><span class="rd-t"></span><span class="rd-s"></span></button>';
      li.querySelector(".rd-t").textContent = t.title;
      li.querySelector(".rd-s").textContent = t.style;
      li.querySelector("button").addEventListener("click", () => { M.select(i); M.play(); });
      list.appendChild(li);
    });
    q("prev").addEventListener("click", () => M.prev());
    q("next").addEventListener("click", () => M.next());
    q("play").addEventListener("click", () => M.toggle());
    const vol = q("vol");
    vol.value = M.volume;
    vol.addEventListener("input", () => { M.volume = +vol.value; });
    syncRadio();
  }

  function syncRadio() {
    const w = W.radio;
    if (!w || !w.built) return;
    const q = (k) => w.body.querySelector('[data-rd="' + k + '"]');
    const t = M.tracks[M.current];
    q("title").textContent = t.title;
    q("artist").textContent = t.artist + " · " + t.style;
    const p = q("play");
    p.innerHTML = M.playing ? ICON.pause : ICON.play;
    p.setAttribute("aria-label", M.playing ? "Pausar" : "Reproducir");
    w.body.querySelectorAll(".rd-row").forEach((b, i) => {
      if (i === M.current) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    updateTime();
  }
  function updateTime() {
    const w = W.radio;
    if (!w || !w.built) return;
    const el = w.body.querySelector('[data-rd="time"]');
    const d = M.duration();
    const txt = mmss(M.elapsed()) + (d ? " / " + mmss(d) : "");
    if (el.textContent !== txt) el.textContent = txt;
  }

  /* Visualizador de matriz de puntos: columnas de LEDs redondos, picos en acento. */
  function drawVis() {
    const w = W.radio;
    const cv = w.body.querySelector('[data-rd="vis"]');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = cv.clientWidth, ch = cv.clientHeight;
    if (!cw || !ch) return;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cw, ch);
    const step = 6, r = 2;
    const cols = Math.max(4, Math.floor((cw - 8) / step)), rows = Math.max(3, Math.floor((ch - 8) / step));
    const ox = (cw - cols * step) / 2 + step / 2, oy = (ch - rows * step) / 2 + step / 2;
    const lv = M.levels(cols);
    const col = PF.colors();
    const dim = new Path2D(), lit = new Path2D(), pk = new Path2D();
    for (let i = 0; i < cols; i++) {
      peaks[i] = Math.max(lv[i], (peaks[i] || 0) - 0.014);
      const n = Math.round(lv[i] * rows), pr = Math.min(rows, Math.round(peaks[i] * rows));
      for (let j = 0; j < rows; j++) {
        const x = ox + i * step, y = oy + (rows - 1 - j) * step;
        const path = j === pr - 1 && pr > 0 && pr > n ? pk : j < n ? lit : dim;
        path.moveTo(x + r, y);
        path.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    g.fillStyle = col.fg; g.globalAlpha = 0.13; g.fill(dim);
    g.globalAlpha = 1; g.fill(lit);
    g.fillStyle = col.accent; g.fill(pk);
  }
  function visLoop() {
    visRaf = requestAnimationFrame(visLoop);
    drawVis();
    updateTime();
  }
  function startVis() { if (!visRaf) visLoop(); }
  function stopVis() { cancelAnimationFrame(visRaf); visRaf = 0; }

  defWindow("radio", "Radio", "win-radio", buildRadio, () => { syncRadio(); startVis(); }, stopVis);

  /* ======================================================================
     VENTANA LABORATORIO
     ====================================================================== */
  function buildLab(body) {
    const st = PF.state;
    const seg = (name, opts, cls) =>
      '<div class="seg ' + (cls || "") + '" style="--n:' + (cls === "seg-2x2" ? 2 : cls === "seg-3" ? 3 : opts.length) + '">' +
      opts.map((o) => '<label><input type="radio" name="' + name + '" value="' + o[0] + '"><span>' + o[1] + '</span></label>').join("") + "</div>";
    const pal = Object.keys(C.palettes).map((k) =>
      '<label class="sw"><input type="radio" name="lab-palette" value="' + k + '"><span class="sw-box" data-pal="' + k + '"><i></i></span><span class="sw-n">' + C.palettes[k].label + "</span></label>").join("");
    const fnt = Object.keys(C.fonts).map((k) => {
      const f = C.fonts[k];
      return '<label class="fnt"><input type="radio" name="lab-font" value="' + k + '"><span class="fnt-a" style="font-family:' + f.display + ";font-stretch:" + (f.displayStretch || "100%") + '">Aa</span><span class="fnt-n">' + f.label + "</span></label>";
    }).join("");

    body.innerHTML =
      '<form class="lab" onsubmit="return false">' +
        '<p class="lab-help">Cambia el cañón y la paleta en directo. Se guarda en este navegador.</p>' +
        '<div class="lab-pair">' +
          '<fieldset><legend class="label">Tema</legend>' + seg("lab-theme", [["dark", "Oscuro"], ["light", "Claro"]]) + "</fieldset>" +
          '<fieldset><legend class="label">Bala</legend>' + seg("lab-bullet", [["1", "Con"], ["0", "Sin"]]) + "</fieldset>" +
        "</div>" +
        '<fieldset><legend class="label">Paleta</legend><div class="sw-grid">' + pal + "</div></fieldset>" +
        '<fieldset><legend class="label">Tipografía</legend><div class="fnt-grid">' + fnt + "</div></fieldset>" +
        '<fieldset><legend class="label">Efecto del cañón</legend>' + seg("lab-effect", Object.keys(C.effects).map((k) => [k, C.effects[k].label]), "seg-3") + "</fieldset>" +
        '<div class="lab-pair">' +
          '<fieldset><legend class="label">Densidad</legend><div class="lab-row"><input type="range" id="lab-density" min="0.6" max="1.6" step="0.1" aria-label="Densidad"><output class="lab-out" for="lab-density"></output></div></fieldset>' +
          '<fieldset><legend class="label">Fondo animado</legend><label class="chk"><input type="checkbox" id="lab-field"><span class="chk-box" aria-hidden="true"></span><span class="chk-txt">Caracteres</span><span class="chk-state label" aria-hidden="true"></span></label></fieldset>' +
        "</div>" +
        '<fieldset><legend class="label">Fondo del cañón</legend>' + seg("lab-bg", Object.keys(C.barrelBackgrounds).map((k) => [k, C.barrelBackgrounds[k].label]), "seg-2x2") + "</fieldset>" +
        '<div class="lab-actions"><button type="button" class="win-btn" data-lab="intro">Ver la intro</button><button type="button" class="win-btn" data-lab="reset">Restablecer</button></div>' +
      "</form>";

    const on = (sel, fn) => body.querySelectorAll(sel).forEach((el) => el.addEventListener("change", fn));
    on('input[name="lab-theme"]', (e) => PF.set("theme", e.target.value));
    on('input[name="lab-palette"]', (e) => PF.set("palette", e.target.value));
    on('input[name="lab-font"]', (e) => PF.set("font", e.target.value));
    on('input[name="lab-effect"]', (e) => PF.set("effect", e.target.value));
    on('input[name="lab-bullet"]', (e) => PF.set("bullet", e.target.value === "1"));
    on('input[name="lab-bg"]', (e) => PF.set("barrelBg", e.target.value));
    on("#lab-field", (e) => PF.set("field", e.target.checked));
    const dens = body.querySelector("#lab-density");
    dens.addEventListener("input", () => { PF.set("density", Math.round(+dens.value * 10) / 10); syncLab(); });
    body.querySelector('[data-lab="intro"]').addEventListener("click", () => PF.scrollTo(0));
    body.querySelector('[data-lab="reset"]').addEventListener("click", () => PF.reset());
    syncLab();
  }

  function syncLab() {
    const w = W.lab;
    if (!w || !w.built) return;
    const st = PF.state, b = w.body;
    const setRadio = (name, val) => { b.querySelectorAll('input[name="' + name + '"]').forEach((i) => { i.checked = i.value === String(val); }); };
    setRadio("lab-theme", st.theme);
    setRadio("lab-palette", st.palette);
    setRadio("lab-font", st.font);
    setRadio("lab-effect", st.effect);
    setRadio("lab-bullet", st.bullet ? "1" : "0");
    setRadio("lab-bg", st.barrelBg);
    const f = b.querySelector("#lab-field");
    f.checked = !!st.field;
    b.querySelector(".chk-state").textContent = st.field ? "Sí" : "No";
    const d = b.querySelector("#lab-density");
    d.value = st.density;
    b.querySelector(".lab-out").textContent = Number(st.density).toFixed(1) + "×";
    // Muestras de paleta con los colores del tema activo
    const mode = st.theme === "light" ? "light" : "dark";
    b.querySelectorAll(".sw-box").forEach((box) => {
      const c = C.palettes[box.dataset.pal][mode];
      box.style.setProperty("--sw-bg", c.bg);
      box.style.setProperty("--sw-ac", c.accent);
    });
  }

  defWindow("lab", "Laboratorio", "win-lab", buildLab, () => syncLab());

  /* ======================================================================
     BARRA DE MENÚ
     ====================================================================== */
  const bar = document.createElement("header");
  bar.className = "mb";
  bar.innerHTML =
    '<div class="mb-left">' +
      '<button type="button" class="mb-logo" aria-label="Ortzi Garaio, ir al inicio">OG</button>' +
      '<ul class="mb-menus" role="menubar" aria-label="Menú principal"></ul>' +
      '<button type="button" class="mb-btn mb-compact" aria-haspopup="dialog">Menú</button>' +
    "</div>" +
    '<div class="mb-right">' +
      '<div class="mb-now">' +
        '<button type="button" class="mb-np-play" aria-label="Reproducir"></button>' +
        '<button type="button" class="mb-np-txt" aria-label="Mostrar reproductor"><span class="mb-marq"><span class="mb-marq-in"></span></span></button>' +
      "</div>" +
      '<button type="button" class="mb-theme"><span class="mb-theme-ico" aria-hidden="true">◐</span><span class="mb-theme-txt"></span></button>' +
      '<time class="mb-clock" title="Hora en Euskadi (Europe/Madrid)"></time>' +
    "</div>" +
    '<div class="mb-hint mb-hint-d" role="status" hidden></div>';
  host.appendChild(bar);

  const toggleTheme = () => PF.set("theme", PF.state.theme === "light" ? "dark" : "light");

  const defs = [
    { id: "indice", label: "Índice", items: [
      { label: "Work", act: () => go("#work-index", "#work") },
      { label: "Gallery", act: () => go("#gallery", "#work") },
      { label: "About", act: () => go("#about") },
      { label: "Contact", act: () => go("#contact") },
      "sep",
      { label: "Abrir índice grande", key: "I", act: () => openIndex() },
      { label: "Volver a la intro", act: () => PF.scrollTo(0) }
    ] },
    { id: "ver", label: "Ver", check: true, items: [
      { label: () => (PF.state.theme === "light" ? "Modo oscuro" : "Modo claro"), key: "T", act: toggleTheme },
      { label: "Laboratorio…", key: "L", act: () => openWin("lab") },
      "sep",
      { label: "Fondo animado", checked: () => !!PF.state.field, act: () => PF.set("field", !PF.state.field) },
      { label: "Con bala", checked: () => !!PF.state.bullet, act: () => PF.set("bullet", !PF.state.bullet) }
    ] },
    { id: "radio", label: "Radio", items: [
      { label: () => (M.playing ? "Pausa" : "Reproducir"), key: "Espacio", act: () => M.toggle() },
      { label: "Siguiente", act: () => M.next() },
      { label: "Anterior", act: () => M.prev() },
      "sep",
      { label: "Mostrar reproductor", act: () => openWin("radio") }
    ] }
  ];

  const menubar = bar.querySelector(".mb-menus");
  defs.forEach((m, mi) => {
    const li = document.createElement("li");
    li.className = "mb-li";
    li.setAttribute("role", "none");
    li.innerHTML = '<button type="button" class="mb-btn" role="menuitem" aria-haspopup="menu" aria-expanded="false" tabindex="' + (mi === 0 ? 0 : -1) + '" id="mb-' + m.id + '">' + m.label + "</button>" +
      '<ul class="mb-drop' + (m.check ? " has-chk" : "") + '" role="menu" aria-labelledby="mb-' + m.id + '" hidden></ul>';
    m.btn = li.querySelector(".mb-btn");
    m.drop = li.querySelector(".mb-drop");
    m.els = [];
    m.items.forEach((it) => {
      const row = document.createElement("li");
      if (it === "sep") { row.setAttribute("role", "separator"); m.drop.appendChild(row); return; }
      row.setAttribute("role", "none");
      const isCheck = typeof it.checked === "function";
      row.innerHTML = '<button type="button" class="mb-item" role="' + (isCheck ? "menuitemcheckbox" : "menuitem") + '" tabindex="-1">' +
        (m.check ? '<span class="mb-chk" aria-hidden="true"></span>' : "") +
        '<span class="mb-lbl"></span>' + (it.key ? '<kbd class="mb-key">' + it.key + "</kbd>" : "") + "</button>";
      it.el = row.querySelector("button");
      it.lbl = row.querySelector(".mb-lbl");
      it.chk = row.querySelector(".mb-chk");
      m.els.push(it.el);
      it.el.addEventListener("click", (e) => {
        const kb = e.detail === 0;
        closeMenu(false);
        it.act();
        if (kb && !document.querySelector(".bx.is-open") && !(W.lab && W.lab.open && it.label === "Laboratorio…")) m.btn.focus({ preventScroll: true });
        refreshMenus();
      });
      it.el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") it.el.focus({ preventScroll: true }); });
      m.drop.appendChild(row);
    });
    menubar.appendChild(li);
  });

  function refreshMenus() {
    defs.forEach((m) => m.items.forEach((it) => {
      if (it === "sep") return;
      if (typeof it.label === "function") it.lbl.textContent = it.label(); else if (!it.lbl.textContent) it.lbl.textContent = it.label;
      if (typeof it.checked === "function") {
        const on = it.checked();
        it.el.setAttribute("aria-checked", on ? "true" : "false");
        if (it.chk) it.chk.textContent = on ? "✓" : "";
      }
    }));
    const light = PF.state.theme === "light";
    const tb = bar.querySelector(".mb-theme");
    tb.querySelector(".mb-theme-txt").textContent = light ? "Claro" : "Oscuro";
    tb.setAttribute("aria-label", "Tema " + (light ? "claro" : "oscuro") + ". Cambiar a " + (light ? "oscuro" : "claro"));
  }

  /* Comportamiento de menú de escritorio */
  let openIdx = -1;
  function openMenu(i, focusFirst) {
    if (openIdx === i) return;
    closeMenu(false);
    openIdx = i;
    const m = defs[i];
    refreshMenus();
    m.btn.setAttribute("aria-expanded", "true");
    m.btn.classList.add("is-open");
    m.drop.hidden = false;
    hideHint();
    if (focusFirst && m.els[0]) m.els[0].focus({ preventScroll: true });
  }
  function closeMenu(refocus) {
    if (openIdx < 0) return;
    const m = defs[openIdx];
    openIdx = -1;
    m.btn.setAttribute("aria-expanded", "false");
    m.btn.classList.remove("is-open");
    m.drop.hidden = true;
    if (refocus) m.btn.focus({ preventScroll: true });
  }
  function setRoving(i) { defs.forEach((m, k) => { m.btn.tabIndex = k === i ? 0 : -1; }); }

  defs.forEach((m, i) => {
    m.btn.addEventListener("click", () => { openIdx === i ? closeMenu(false) : openMenu(i, false); setRoving(i); });
    m.btn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && openIdx >= 0 && openIdx !== i) openMenu(i, false); });
    m.btn.addEventListener("focus", () => setRoving(i));
  });

  menubar.addEventListener("keydown", (e) => {
    const k = e.key;
    const ti = defs.findIndex((m) => m.btn === e.target);
    const mi = ti >= 0 ? ti : defs.findIndex((m) => m.els.includes(e.target));
    if (mi < 0) return;
    const m = defs[mi];
    const items = m.els;
    const move = (dir) => {
      const ni = (mi + dir + defs.length) % defs.length;
      if (openIdx >= 0) { openMenu(ni, true); } else defs[ni].btn.focus();
    };
    if (k === "Escape") {
      if (openIdx >= 0) { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
    } else if (k === "ArrowRight") { e.preventDefault(); move(1); }
    else if (k === "ArrowLeft") { e.preventDefault(); move(-1); }
    else if (ti >= 0 && (k === "ArrowDown" || k === "Enter" || k === " ")) { e.preventDefault(); openIdx === ti ? items[0].focus() : openMenu(ti, true); }
    else if (ti >= 0 && k === "ArrowUp") { e.preventDefault(); openMenu(ti, false); items[items.length - 1].focus(); }
    else if (ti >= 0 && k === "Home") { e.preventDefault(); defs[0].btn.focus(); }
    else if (ti >= 0 && k === "End") { e.preventDefault(); defs[defs.length - 1].btn.focus(); }
    else if (ti < 0 && k === "ArrowDown") { e.preventDefault(); items[(items.indexOf(e.target) + 1) % items.length].focus(); }
    else if (ti < 0 && k === "ArrowUp") { e.preventDefault(); items[(items.indexOf(e.target) - 1 + items.length) % items.length].focus(); }
    else if (ti < 0 && k === "Home") { e.preventDefault(); items[0].focus(); }
    else if (ti < 0 && k === "End") { e.preventDefault(); items[items.length - 1].focus(); }
    else if (ti < 0 && k === "Tab") { closeMenu(false); }
  });

  document.addEventListener("pointerdown", (e) => {
    if (openIdx >= 0 && !e.target.closest(".mb-menus")) closeMenu(false);
  });
  window.addEventListener("blur", () => closeMenu(false));

  bar.querySelector(".mb-logo").addEventListener("click", () => { closeMenu(false); PF.scrollTo(0); });
  bar.querySelector(".mb-compact").addEventListener("click", () => openIndex());
  bar.querySelector(".mb-theme").addEventListener("click", toggleTheme);

  /* Ticker "sonando ahora" */
  const npPlay = bar.querySelector(".mb-np-play");
  const marq = bar.querySelector(".mb-marq-in");
  const now = bar.querySelector(".mb-now");
  npPlay.addEventListener("click", () => M.toggle());
  bar.querySelector(".mb-np-txt").addEventListener("click", () => toggleWin("radio"));
  function syncNow() {
    const t = M.tracks[M.current];
    const txt = t.title + " — " + t.artist;
    marq.innerHTML = "<span></span><span aria-hidden=\"true\"></span>";
    marq.children[0].textContent = txt;
    marq.children[1].textContent = txt;
    marq.style.setProperty("--marq-d", Math.max(8, txt.length * 0.55) + "s");
    now.classList.toggle("is-playing", M.playing);
    npPlay.innerHTML = M.playing ? ICON.pause : ICON.play;
    npPlay.setAttribute("aria-label", M.playing ? "Pausar" : "Reproducir");
    bar.querySelector(".mb-np-txt").setAttribute("aria-label", "Mostrar reproductor. Pista: " + txt);
  }
  M.on("state", () => { syncNow(); syncRadio(); refreshMenus(); });
  M.on("track", () => { syncNow(); syncRadio(); });

  /* Reloj en Europe/Madrid */
  const clock = bar.querySelector(".mb-clock");
  let fmt;
  try { fmt = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false }); } catch (e) { fmt = null; }
  function tickClock() {
    const d = new Date();
    const txt = fmt ? fmt.format(d) : pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    if (clock.textContent !== txt) { clock.textContent = txt; clock.setAttribute("datetime", d.toISOString()); }
  }
  tickClock();
  setInterval(tickClock, 15000);

  /* Aviso de primera visita */
  const hint = bar.querySelector(".mb-hint");
  let hintTimer = 0;
  function showHint() {
    if (lsGet(HINT_KEY)) return;
    lsSet(HINT_KEY, "1");
    const compact = mobileMQ.matches;
    const anchor = compact ? bar.querySelector(".mb-compact") : defs[1].btn;
    hint.textContent = compact ? "Prueba combinaciones en Menú → Laboratorio" : "Prueba combinaciones en Ver → Laboratorio";
    hint.hidden = false;
    const r = anchor.getBoundingClientRect();
    hint.style.left = Math.max(8, Math.min(r.left, window.innerWidth - hint.offsetWidth - 8)) + "px";
    hintTimer = setTimeout(hideHint, 6000);
  }
  function hideHint() { clearTimeout(hintTimer); hint.hidden = true; }
  hint.addEventListener("click", hideHint);
  setTimeout(showHint, 1600);

  /* ======================================================================
     ÍNDICE GRANDE
     ====================================================================== */
  const P = C.projects || [];
  const years = P.map((p) => p.year).filter(Boolean);
  const y0 = years.length ? Math.min.apply(null, years) : 0, y1 = years.length ? Math.max.apply(null, years) : 0;
  const yearRange = !years.length ? "" : y0 === y1 ? String(y0) : y0 + "–" + String(y1).slice(2);
  const skillCount = (C.skills || []).reduce((n, g) => n + g.items.length, 0);
  const words = [
    { word: "WORK", sup: "(" + pad2(P.length) + ")", sel: "#work-index", fb: "#work", href: "#work" },
    { word: "GALLERY", sup: yearRange, sel: "#gallery", fb: "#work", href: "#gallery" },
    { word: "ABOUT", sup: "(" + pad2(skillCount) + ")", sel: "#about", href: "#about" },
    { word: "CONTACT", sup: "@", sel: "#contact", href: "#contact" }
  ];
  const owner = C.owner || {};
  const gh = (owner.github || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

  const idx = document.createElement("div");
  idx.className = "bx";
  idx.hidden = true;
  idx.setAttribute("role", "dialog");
  idx.setAttribute("aria-modal", "true");
  idx.setAttribute("aria-label", "Índice");
  idx.setAttribute("data-lenis-prevent", "");
  idx.innerHTML =
    '<div class="bx-top"><span class="label">Índice</span><button type="button" class="bx-close">Cerrar <span aria-hidden="true">✕</span></button></div>' +
    '<nav class="bx-list" aria-label="Secciones">' +
      words.map((w) => '<div class="bx-row"><a class="bx-link" href="' + w.href + '"><span class="bx-word display">' + w.word + '</span><sup class="bx-sup" aria-hidden="true">' + w.sup + "</sup></a></div>").join("") +
    "</nav>" +
    '<div class="bx-foot label">' +
      (owner.email ? '<a href="mailto:' + owner.email + '">' + owner.email + "</a>" : "") +
      (owner.github ? '<a href="' + owner.github + '" target="_blank" rel="noopener">' + gh + "</a>" : "") +
      '<span class="bx-tools"><button type="button" data-tool="lab">Laboratorio</button><button type="button" data-tool="radio">Radio</button></span>' +
    "</div>";
  host.appendChild(idx);

  let idxOpen = false, idxFocus = null;
  const links = Array.from(idx.querySelectorAll(".bx-link"));
  links.forEach((a, i) => a.addEventListener("click", (e) => {
    e.preventDefault();
    closeIndex({ go: words[i] });
  }));
  idx.querySelector(".bx-close").addEventListener("click", () => closeIndex());
  idx.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.tool;
    closeIndex({ then: () => openWin(id) });
  }));
  idx.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.stopPropagation(); closeIndex(); return; }
    if (e.key !== "Tab") return;
    const f = Array.from(idx.querySelectorAll("a[href], button")).filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !idx.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* Ajusta el tamaño para que la palabra más ancha ocupe casi todo el ancho (y quepan las 4 en alto). */
  function fitIndex() {
    const cs = getComputedStyle(idx);
    const availW = idx.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    idx.style.setProperty("--bx-fs", "100px");
    let k = Infinity;
    let extra = 0;   // en móvil la anotación va encima de la palabra: ocupa alto, no ancho
    links.forEach((a) => {
      const col = getComputedStyle(a).flexDirection.indexOf("column") === 0;
      const w = a.querySelector(".bx-word").offsetWidth;
      const s = col ? 0 : a.querySelector(".bx-sup").offsetWidth + 12;
      if (col) extra = a.querySelector(".bx-sup").offsetHeight + 18;
      if (w) k = Math.min(k, (availW - s) / w);
    });
    let fs = isFinite(k) ? 100 * k : 100;
    const availH = idx.clientHeight - idx.querySelector(".bx-top").offsetHeight - idx.querySelector(".bx-foot").offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    fs = Math.min(fs, (availH - 4 * extra) / 3.7, 352);
    idx.style.setProperty("--bx-fs", Math.max(64, fs) + "px");
  }

  function openIndex() {
    if (idxOpen) return;
    idxOpen = true;
    closeMenu(false);
    hideHint();
    idxFocus = document.activeElement;
    idx.hidden = false;
    idx.style.opacity = "1";
    idx.classList.add("is-open");
    PF.lockScroll(true);
    fitIndex();
    idx.querySelector(".bx-close").focus({ preventScroll: true });
    if (window.gsap && !PF.reducedMotion) {
      gsap.killTweensOf(idx);
      gsap.fromTo(links, { yPercent: 105 }, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.07, clearProps: "transform" });
      gsap.fromTo(idx.querySelectorAll(".bx-sup, .bx-foot, .bx-top"), { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.25, stagger: 0.04, clearProps: "opacity" });
    }
  }
  function closeIndex(opts) {
    if (!idxOpen) return;
    opts = opts || {};
    idxOpen = false;
    idx.classList.remove("is-open");
    PF.lockScroll(false);
    const done = () => { idx.hidden = true; idx.style.opacity = ""; };
    if (window.gsap && !PF.reducedMotion) gsap.to(idx, { opacity: 0, duration: 0.28, ease: "power2.out", onComplete: done });
    else done();
    if (opts.go) requestAnimationFrame(() => go(opts.go.sel, opts.go.fb));
    else if (opts.then) opts.then();
    else if (idxFocus && document.contains(idxFocus) && idxFocus.focus) idxFocus.focus({ preventScroll: true });
    idxFocus = null;
  }
  const toggleIndex = () => (idxOpen ? closeIndex() : openIndex());
  window.addEventListener("resize", () => { if (idxOpen) fitIndex(); });
  PF.menu = { openIndex, closeIndex, toggleIndex };

  /* ======================================================================
     ATAJOS GLOBALES
     ====================================================================== */
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "t") { toggleTheme(); return; }
    if (k === "i") { if (!detailOpen() || idxOpen) { toggleIndex(); } return; }
    if (idxOpen || detailOpen()) return;
    if (k === "l") { toggleWin("lab"); return; }
    if (k === " " || k === "Spacebar") {
      if (t && t.closest && t.closest("button, a, summary, [role='menuitem'], [role='menuitemcheckbox']")) return;
      e.preventDefault();
      M.toggle();
    }
  });

  /* Estado inicial y sincronización con PF */
  PF.on("change", () => { refreshMenus(); syncLab(); });
  PF.on("theme", () => syncLab());
  refreshMenus();
  syncNow();
})();
