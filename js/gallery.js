/* ==========================================================================
   GALERÍA + ÍNDICE — sección #work
   - PF.covers: portadas procedurales (escala de grises -> PF.fx.stylize)
       PF.covers.draw(project, canvas, w, h)   dibuja una portada en el canvas
       PF.covers.track(canvas, project[, w, h]) dibuja y la regenera al cambiar ajustes
       PF.covers.redrawAll(force)
   - #gallery: portadas flotando en perspectiva (skew por velocidad, parallax)
   - #work-index: filas editoriales con miniatura que sigue al cursor
   ========================================================================== */
(function () {
  const PF = window.PF;
  const root = document.getElementById("work");
  if (!PF || !root) return;
  const projects = PF.config.projects;
  const pad2 = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ======================================================================
     PORTADAS PROCEDURALES
     ====================================================================== */
  const TAU = Math.PI * 2;
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const gr = (v) => { v = clamp(v | 0, 0, 255); return "rgb(" + v + "," + v + "," + v + ")"; };
  const gauss = (r) => (r() + r() + r() - 1.5) * 2;
  const line = (g, x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const dot = (g, x, y, rad) => { g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); };

  /* 0 · nube de puntos con ejes y recta de regresión */
  function sceneScatter(g, w, h, r, u) {
    const m = Math.min(w, h) * 0.09;
    g.lineWidth = 2 * u; g.strokeStyle = gr(34);
    for (let i = 1; i < 5; i++) {
      line(g, m + ((w - 2 * m) * i) / 5, m, m + ((w - 2 * m) * i) / 5, h - m);
      line(g, m, m + ((h - 2 * m) * i) / 5, w - m, m + ((h - 2 * m) * i) / 5);
    }
    g.lineWidth = 3 * u; g.strokeStyle = gr(190);
    g.beginPath(); g.moveTo(m, m); g.lineTo(m, h - m); g.lineTo(w - m, h - m); g.stroke();
    const tones = [255, 185, 115];
    let best = null;
    for (let c = 0; c < 3; c++) {
      const cx = m + (0.22 + 0.56 * r()) * (w - 2 * m), cy = m + (0.22 + 0.56 * r()) * (h - 2 * m);
      const sx = (0.06 + 0.06 * r()) * w, sy = (0.06 + 0.06 * r()) * h;
      if (c === 0) best = { cx, cy, sx, sy };
      for (let i = 0; i < 70; i++) {
        const x = clamp(cx + gauss(r) * sx, m + 6 * u, w - m - 6 * u), y = clamp(cy + gauss(r) * sy, m + 6 * u, h - m - 6 * u);
        g.fillStyle = gr(tones[c] - r() * 30);
        dot(g, x, y, (2.2 + 2.6 * r()) * u);
      }
    }
    g.strokeStyle = gr(235); g.lineWidth = 3 * u; g.setLineDash([10 * u, 8 * u]);
    line(g, m, h - m - (h - 2 * m) * (0.15 + 0.2 * r()), w - m, m + (h - 2 * m) * (0.15 + 0.25 * r()));
    g.setLineDash([]);
    g.lineWidth = 2.5 * u; g.strokeStyle = gr(255);
    g.beginPath(); g.ellipse(best.cx, best.cy, best.sx * 2.2, best.sy * 2.2, 0, 0, TAU); g.stroke();
  }

  /* 1 · red de nodos con hubs */
  function sceneGraph(g, w, h, r, u) {
    const m = Math.min(w, h) * 0.1, minD = Math.min(w, h) * 0.15, pts = [];
    for (let t = 0; pts.length < 20 && t < 600; t++) {
      const x = m + r() * (w - 2 * m), y = m + r() * (h - 2 * m);
      if (pts.every((p) => Math.hypot(p.x - x, p.y - y) > minD)) pts.push({ x, y, d: 0 });
    }
    const edges = [], seen = new Set();
    const add = (a, b) => { const k = a < b ? a + "-" + b : b + "-" + a; if (a === b || seen.has(k)) return; seen.add(k); edges.push([a, b]); pts[a].d++; pts[b].d++; };
    pts.forEach((p, i) => {
      pts.map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) })).filter((o) => o.j !== i).sort((a, b) => a.d - b.d).slice(0, 2).forEach((o) => add(i, o.j));
    });
    for (let k = 0; k < 4; k++) add((r() * pts.length) | 0, (r() * pts.length) | 0);
    g.lineWidth = 2.2 * u; g.strokeStyle = gr(120);
    edges.forEach(([a, b]) => line(g, pts[a].x, pts[a].y, pts[b].x, pts[b].y));
    pts.forEach((p) => {
      const rad = (3.5 + p.d * 2) * u;
      g.fillStyle = gr(130 + p.d * 28); dot(g, p.x, p.y, rad);
      if (p.d >= 4) { g.strokeStyle = gr(255); g.lineWidth = 2.5 * u; g.beginPath(); g.arc(p.x, p.y, rad + 6 * u, 0, TAU); g.stroke(); }
    });
  }

  /* 2 · serie temporal con bandas de incertidumbre */
  function sceneSeries(g, w, h, r, u) {
    const m = Math.min(w, h) * 0.09, n = 48, split = Math.floor(n * 0.66), iw = w - 2 * m, ih = h - 2 * m;
    g.lineWidth = 2 * u; g.strokeStyle = gr(32);
    for (let i = 0; i <= 5; i++) line(g, m, m + (ih * i) / 5, w - m, m + (ih * i) / 5);
    const mk = (amp, ph) => { const a = []; let v = 0.5; for (let i = 0; i < n; i++) { v += (r() - 0.5) * amp + Math.sin(i / 6 + ph) * 0.012; v = clamp(v, 0.12, 0.88); a.push(v); } return a; };
    const main = mk(0.1, r() * 6), side = mk(0.08, r() * 6);
    const X = (i) => m + (iw * i) / (n - 1), Y = (v) => m + ih * (1 - v);
    const band = (k, tone) => {
      g.fillStyle = gr(tone); g.beginPath();
      for (let i = split; i < n; i++) g.lineTo(X(i), Y(main[i]) - ih * k * (0.02 + 0.13 * ((i - split) / (n - split))));
      for (let i = n - 1; i >= split; i--) g.lineTo(X(i), Y(main[i]) + ih * k * (0.02 + 0.13 * ((i - split) / (n - split))));
      g.closePath(); g.fill();
    };
    band(1, 62); band(0.5, 105);
    g.strokeStyle = gr(125); g.lineWidth = 2 * u; g.beginPath();
    side.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)))); g.stroke();
    g.strokeStyle = gr(255); g.lineWidth = 3.6 * u; g.beginPath();
    for (let i = 0; i <= split; i++) (i ? g.lineTo(X(i), Y(main[i])) : g.moveTo(X(i), Y(main[i])));
    g.stroke();
    g.setLineDash([9 * u, 7 * u]); g.beginPath();
    for (let i = split; i < n; i++) (i > split ? g.lineTo(X(i), Y(main[i])) : g.moveTo(X(i), Y(main[i])));
    g.stroke();
    g.strokeStyle = gr(170); g.lineWidth = 2.2 * u; line(g, X(split), m, X(split), h - m); g.setLineDash([]);
    g.fillStyle = gr(255); dot(g, X(split), Y(main[split]), 6 * u);
  }

  /* 3 · histograma con curva ajustada */
  function sceneHist(g, w, h, r, u) {
    const m = Math.min(w, h) * 0.09, n = 20 + ((r() * 5) | 0), iw = w - 2 * m, ih = h - 2 * m;
    const c = n * (0.4 + 0.2 * r()), sd = n * (0.13 + 0.07 * r()), bw = iw / n;
    for (let i = 0; i < n; i++) {
      const hi = clamp(Math.exp(-Math.pow(i - c, 2) / (2 * sd * sd)) * 0.86 + r() * 0.1, 0.03, 0.97);
      g.fillStyle = gr(80 + 165 * hi); g.fillRect(m + i * bw + u, h - m - ih * hi, bw - 2 * u, ih * hi);
    }
    g.strokeStyle = gr(255); g.lineWidth = 3.4 * u; g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = m + (iw * i) / 60, hi = Math.exp(-Math.pow((i / 60) * n - c, 2) / (2 * sd * sd)) * 0.9;
      i ? g.lineTo(x, h - m - ih * hi) : g.moveTo(x, h - m - ih * hi);
    }
    g.stroke();
    g.lineWidth = 2.4 * u; g.strokeStyle = gr(200); g.setLineDash([9 * u, 7 * u]);
    line(g, m + (c + 0.5) * bw, m, m + (c + 0.5) * bw, h - m); g.setLineDash([]);
    g.lineWidth = 3 * u; g.strokeStyle = gr(190); line(g, m, h - m, w - m, h - m);
  }

  /* 4 · mapa de calor de una matriz */
  function sceneHeat(g, w, h, r, u) {
    const m = Math.min(w, h) * 0.08, cols = 9, cw = (w - 2 * m) / cols, rows = Math.max(5, Math.round((h - 2 * m) / cw)), ch = (h - 2 * m) / rows;
    const lat = (n) => Array.from({ length: n }, () => [gauss(r), gauss(r), gauss(r)]);
    const A = lat(rows), B = lat(cols);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const d = A[i][0] * B[j][0] + A[i][1] * B[j][1] + A[i][2] * B[j][2];
      const v = 0.5 + 0.5 * Math.tanh(d * 0.9);
      g.fillStyle = gr(22 + 233 * v); g.fillRect(m + j * cw + 1.5 * u, m + i * ch + 1.5 * u, cw - 3 * u, ch - 3 * u);
    }
  }

  /* 5 · ondas concéntricas con interferencia */
  function sceneWaves(g, w, h, r, u) {
    const diag = Math.hypot(w, h);
    g.globalCompositeOperation = "lighter"; g.lineWidth = 3 * u;
    for (let k = 0; k < 3; k++) {
      const cx = w * (0.15 + 0.7 * r()), cy = h * (0.15 + 0.7 * r()), step = (13 + k * 5) * u;
      for (let rad = step; rad < diag; rad += step) {
        g.strokeStyle = gr(64 + 110 * (1 - rad / diag)); g.beginPath(); g.arc(cx, cy, rad, 0, TAU); g.stroke();
      }
      g.fillStyle = gr(200); dot(g, cx, cy, 5 * u);
    }
    g.globalCompositeOperation = "source-over";
  }

  const SCENES = [sceneScatter, sceneGraph, sceneSeries, sceneHist, sceneHeat, sceneWaves];

  /* El tipo de escena depende del índice del proyecto (y de la captura si es "id-n"). */
  function sceneFor(id) {
    const themed = PF.scenes && PF.scenes.get(id);
    if (themed) return themed;
    let pi = projects.findIndex((p) => id === p.id);
    let shot = -1;
    if (pi < 0) {
      pi = projects.findIndex((p) => id.indexOf(p.id + "-") === 0);
      if (pi >= 0) shot = parseInt(id.slice(projects[pi].id.length + 1), 10) || 0;
    }
    if (pi < 0) return SCENES[hash(id) % SCENES.length];
    return SCENES[(pi + (shot >= 0 ? 2 * (shot + 1) + 1 : 0)) % SCENES.length];
  }

  /* ---------- Portadas con imagen real ---------- */
  const imgs = new Map();
  function grayImage(rec, g, w, h, keepColor) {
    const img = rec.img, k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    if (keepColor) return;
    const d = g.getImageData(0, 0, w, h), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const v = a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114; a[i] = a[i + 1] = a[i + 2] = v; }
    g.putImageData(d, 0, 0);
  }

  /* ---------- API ---------- */
  const covers = (PF.covers = {});
  const entries = new Set();
  let timer = 0;

  covers.draw = function (project, canvas, w, h) {
    w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h));
    let s = Math.min(window.devicePixelRatio || 1, 2);
    while (s > 1 && w * h * s * s > 2.4e6) s -= 0.25;
    s = Math.max(1, s);
    const src = document.createElement("canvas");
    src.width = Math.round(w * s); src.height = Math.round(h * s);
    const g = src.getContext("2d", { willReadFrequently: true });
    g.fillStyle = "#000"; g.fillRect(0, 0, src.width, src.height);
    let done = false;
    if (project.cover) {
      let rec = imgs.get(project.cover);
      if (!rec) {
        rec = { ok: false, img: new Image() };
        imgs.set(project.cover, rec);
        rec.img.crossOrigin = "anonymous";
        rec.img.onload = () => { rec.ok = true; covers.redrawAll(true); };
        rec.img.onerror = () => { rec.failed = true; };
        rec.img.src = project.cover;
      }
      if (rec.ok) {
        try { grayImage(rec, g, src.width, src.height, project.plain); done = true; } catch (e) { rec.ok = false; rec.failed = true; }
      }
    }
    if (!done) {
      const r = rng(hash(project.id)), u = Math.max(1, Math.min(w, h) / 320);
      g.save(); g.scale(s, s);
      sceneFor(project.id)(g, w, h, r, u);
      g.restore();
    }
    if (project.plain) { canvas.width = src.width; canvas.height = src.height; canvas.getContext("2d").drawImage(src, 0, 0); return; }
    const c = PF.colors();
    if (PF.fx && PF.fx.stylize) {
      PF.fx.stylize(src, canvas, { mode: PF.state.effect, cell: 8 * PF.state.density * s, ink: c.fg, paper: c.bg, accent: c.accent });
    } else {
      canvas.width = src.width; canvas.height = src.height;
      canvas.getContext("2d").drawImage(src, 0, 0);
    }
  };

  function paint(e, force) {
    if (!e.canvas.isConnected) { entries.delete(e); return; }
    const w = e.canvas.clientWidth || e.w, h = e.canvas.clientHeight || e.h;
    if (!w || !h) return;
    if (!force && w === e.w && h === e.h && e.done) return;
    e.w = w; e.h = h; e.done = true;
    try { covers.draw(e.project, e.canvas, w, h); } catch (err) { console.error(err); }
  }
  covers.track = function (canvas, project, w, h) {
    const e = { canvas, project, w: w || 0, h: h || 0, done: false };
    entries.add(e);
    paint(e, true);
    return () => entries.delete(e);
  };
  covers.redrawAll = function (force) {
    const list = Array.from(entries);
    let k = 0;
    (function next() {
      const e = list[k++];
      if (!e) return;
      paint(e, force);
      requestAnimationFrame(next);
    })();
  };
  const schedule = (force) => { clearTimeout(timer); timer = setTimeout(() => covers.redrawAll(force), 140); };
  PF.on("change", (d) => { if (["effect", "density", "palette", "theme", "*"].includes(d.key)) schedule(true); });
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; schedule(false); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { delete PF.fx._ramp; schedule(true); });

  /* ======================================================================
     MARCADO
     ====================================================================== */
  const total = projects.length;
  const LAYOUT = [
    { s: 2, n: 5, ar: "4 / 5", mt: 0, z: 60 },
    { s: 8, n: 4, ar: "1 / 1", mt: 20, z: -50 },
    { s: 1, n: 4, ar: "1 / 1", mt: 4, z: -30 },
    { s: 7, n: 5, ar: "5 / 4", mt: 14, z: 70 },
    { s: 3, n: 5, ar: "4 / 5", mt: 6, z: 20 },
    { s: 7, n: 4, ar: "3 / 4", mt: 24, z: -70 }
  ];

  const head = (id, word, kicker, hint) => `
    <header class="sec-head">
      <p class="label sec-kicker"><span>${kicker}</span><span>${hint}</span></p>
      <h2 class="sec-word display" id="${id}" aria-label="${word === "GALLERY" ? "Galería de proyectos" : "Índice de proyectos"}"><span aria-hidden="true">${word}</span><sup class="sec-count" aria-hidden="true">(${pad2(total)})</sup></h2>
    </header>`;

  const cards = projects.map((p, i) => {
    const L = LAYOUT[i % LAYOUT.length];
    const cm = i % 2 === 0 ? "1 / span 9" : "4 / span 9";
    return `
      <div class="gal-card" role="listitem" data-id="${esc(p.id)}" style="--c:${L.s} / span ${L.n};--cm:${cm};--r:${Math.floor(i / 2) + 1};--mt:${L.mt}vh;--ar:${L.ar}">
        <div class="gal-in" data-z="${L.z}">
          <button type="button" class="gal-link" data-id="${esc(p.id)}" aria-label="${esc(p.title)}, ${p.year}. Abrir el proyecto">
            <span class="gal-cover"><canvas class="gal-canvas" aria-hidden="true"></canvas><span class="gal-num label">${pad2(i + 1)}</span></span>
            <span class="gal-meta">
              <span class="gal-title display">${esc(p.title)}</span>
              <span class="gal-row label"><span>${p.year}</span><span>${esc(p.role)}</span></span>
              <span class="gal-tags">${p.stack.slice(0, 2).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</span>
            </span>
          </button>
        </div>
      </div>`;
  }).join("");

  const rows = projects.map((p, i) => `
      <li>
        <button type="button" class="idx-row" data-id="${esc(p.id)}" data-i="${i}" aria-label="${esc(p.title)}, ${p.year}. Abrir el proyecto">
          <span class="idx-num label">${pad2(i + 1)}</span>
          <span class="idx-title display">${esc(p.title)}</span>
          <span class="idx-year label">${p.year}</span>
          <span class="idx-role">${esc(p.role)}</span>
          <span class="idx-stack label">${esc(p.stack.slice(0, 3).join(" · "))}${p.stack.length > 3 ? " +" + (p.stack.length - 3) : ""}</span>
        </button>
      </li>`).join("");

  root.innerHTML = `
    <div id="gallery" class="gal">
      ${head("gallery-title", "GALLERY", "01 — Selección de proyectos", "Haz clic en una portada")}
      <div class="g3" id="g3"></div>
    </div>
    <div id="work-index" class="idx">
      ${head("index-title", "WORK", "02 — Índice", "Lista completa")}
      <ul class="idx-list" aria-labelledby="index-title">${rows}</ul>
      <div class="idx-thumb" aria-hidden="true"></div>
    </div>`;

  const open = (id, el) => { if (PF.detail) PF.detail.open(id, el); };
  root.addEventListener("click", (e) => {
    const b = e.target.closest(".gal-link, .idx-row");
    if (b) open(b.dataset.id, b);
  });

  /* Portadas de la galería y miniaturas del índice */
  const byId = (id) => projects.find((p) => p.id === id);
  root.querySelectorAll(".gal-card").forEach((c) => PF.covers.track(c.querySelector("canvas"), byId(c.dataset.id)));
  const thumb = root.querySelector(".idx-thumb");
  const thumbCv = projects.map((p) => {
    const cv = document.createElement("canvas");
    cv.hidden = true; thumb.appendChild(cv);
    return cv;
  });
  let thumbsReady = false;
  const ensureThumbs = () => {
    if (thumbsReady) return; thumbsReady = true;
    thumbCv.forEach((cv, i) => { cv.hidden = false; PF.covers.track(cv, projects[i], 220, 275); cv.hidden = i !== 0; });
  };

  /* ======================================================================
     MOVIMIENTO
     ====================================================================== */
  const anim = !PF.reducedMotion && window.gsap;
  const stage = root.querySelector(".gal-stage");
  const gallery = root.querySelector("#gallery");
  const cardEls = Array.from(root.querySelectorAll(".gal-card"));
  const inEls = cardEls.map((c) => c.querySelector(".gal-in"));
  const mobile = () => window.innerWidth <= 720;

  if (window.gsap) {
    inEls.forEach((el) => { gsap.set(el, { z: (parseFloat(el.dataset.z) || 0) * (mobile() ? 0.5 : 1) }); });
  }

  if (anim) {
    /* Apertura del túnel: la palabra gigante se abre desde el centro al entrar. */
    root.querySelectorAll(".sec-word").forEach((w) => {
      gsap.fromTo(w, { clipPath: "inset(-10% 50% -10% 50%)" }, {
        clipPath: "inset(-10% -3% -10% -3%)", ease: "none",
        scrollTrigger: { trigger: w, start: "top 98%", end: "top 55%", scrub: true }
      });
    });
    /* Entrada de cada tarjeta (el estado en reposo es visible). */
    cardEls.forEach((c) => {
      const st = { trigger: c, start: "top 92%", once: true };
      gsap.from(c, { y: 60, duration: 1.1, ease: "power3.out", scrollTrigger: st });
      gsap.from(c.querySelector(".gal-link"), { opacity: 0, duration: 1, ease: "power2.out", scrollTrigger: st });
    });

    /* Skew por velocidad + parallax con el cursor (solo con puntero fino). */
    const useMouse = () => fine.matches;
    const opt = { duration: 0.6, ease: "power3" };
    const rx = stage ? gsap.quickTo(stage, "rotationX", opt) : () => {}, ry = stage ? gsap.quickTo(stage, "rotationY", opt) : () => {};
    const qs = inEls.map((el) => ({
      skew: gsap.quickTo(el, "skewY", { duration: 0.45, ease: "power3" }),
      sy: gsap.quickTo(el, "scaleY", { duration: 0.45, ease: "power3" }),
      x: gsap.quickTo(el, "x", opt), y: gsap.quickTo(el, "y", opt),
      z: parseFloat(el.dataset.z) || 0
    }));
    let active = false;
    ScrollTrigger.create({ trigger: gallery, start: "top bottom", end: "bottom top", onToggle: (self) => { active = self.isActive; } });
    gsap.ticker.add(() => {
      if (!active) return;
      const v = PF.velocity();
      const pm = useMouse();
      const sk = pm ? clamp(v * 0.12, -6, 6) : 0;
      const st = pm ? 1 + Math.min(Math.abs(v) * 0.0009, 0.05) : 1;
      const mx = PF.mouse.x, my = PF.mouse.y;
      if (pm) { ry(mx * 4); rx(-my * 4); }
      qs.forEach((q) => {
        q.skew(sk); q.sy(st);
        if (pm) { q.x(-mx * q.z * 0.18); q.y(-my * q.z * 0.12); }
      });
    });
  }

  /* ---------- Miniatura que sigue al cursor en el índice ---------- */
  const idxRows = Array.from(root.querySelectorAll(".idx-row"));
  const tw = 220, th = 275;
  let tqx, tqy, shown = false;
  if (window.gsap) {
    gsap.set(thumb, { opacity: 0, scale: 0.92 });
    tqx = gsap.quickTo(thumb, "x", { duration: 0.5, ease: "power3" });
    tqy = gsap.quickTo(thumb, "y", { duration: 0.5, ease: "power3" });
  }
  const place = (cx, cy, snap) => {
    const x = clamp(cx + 28, 8, window.innerWidth - tw - 24), y = clamp(cy - th / 2, 8, window.innerHeight - th - 8);
    if (!window.gsap) { thumb.style.transform = `translate(${x}px,${y}px)`; return; }
    if (snap) gsap.set(thumb, { x, y });
    else { tqx(x); tqy(y); }
  };
  const showThumb = (i, cx, cy) => {
    ensureThumbs();
    thumbCv.forEach((cv, k) => { cv.hidden = k !== i; });
    place(cx, cy, !shown);
    if (!shown) { shown = true; window.gsap ? gsap.to(thumb, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out", overwrite: "auto" }) : (thumb.style.opacity = 1); }
  };
  const hideThumb = () => {
    if (!shown) return; shown = false;
    window.gsap ? gsap.to(thumb, { opacity: 0, scale: 0.92, duration: 0.2, overwrite: "auto" }) : (thumb.style.opacity = 0);
  };
  idxRows.forEach((row, i) => {
    row.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && fine.matches) showThumb(i, e.clientX, e.clientY); });
    row.addEventListener("pointermove", (e) => { if (shown && e.pointerType === "mouse") place(e.clientX, e.clientY); });
    row.addEventListener("pointerleave", hideThumb);
    row.addEventListener("focus", () => {
      if (!fine.matches || !row.matches(":focus-visible")) return;
      const r = row.getBoundingClientRect();
      showThumb(i, r.right - 340, r.top + r.height / 2);
    });
    row.addEventListener("blur", hideThumb);
    row.addEventListener("click", hideThumb);
  });
  window.addEventListener("scroll", () => { if (shown && !fine.matches) hideThumb(); }, { passive: true });

  /* Con las fuentes y el layout definitivos, recalcula los ScrollTriggers. */
  window.addEventListener("load", () => { if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 200); });
})();
