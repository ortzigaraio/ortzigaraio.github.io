/* ==========================================================================
   GALERÍA 3D — la cámara avanza por un túnel de imágenes al hacer scroll.
   Inspirada en unbelievablycrap.com/gallery: campo de color saturado, imágenes
   a distintas profundidades que se acercan, parallax con el cursor y clic para
   abrir. Cada proyecto aporta sus capturas reales y escenas temáticas.
   ========================================================================== */
(function () {
  const PF = window.PF;
  const host = document.getElementById("g3");
  if (!PF || !host || !PF.covers) return;
  const C = PF.config, projects = C.projects;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const pad2 = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function mulberry(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const narrow = () => window.innerWidth < 700;

  host.innerHTML = `
    <div class="g3-stage">
      <canvas class="g3-bg" aria-hidden="true"></canvas>
      <ul class="g3-list" aria-label="Proyectos">
        ${projects.map((p, i) => `<li><button type="button" class="g3-li" data-p="${esc(p.id)}"><span class="label">${pad2(i + 1)}</span> ${esc(p.title)}</button></li>`).join("")}
      </ul>
      <div class="g3-world" role="list"></div>
      <p class="g3-hint label"><span class="g3-count">00 / 00</span><span>Desliza para avanzar · Clic para abrir</span></p>
    </div>`;
  const stage = host.querySelector(".g3-stage"), world = host.querySelector(".g3-world");
  const bg = host.querySelector(".g3-bg"), countEl = host.querySelector(".g3-count");
  const liBtns = Array.from(host.querySelectorAll(".g3-li"));

  /* ---------- Fondo: manchas de ruido (como el camuflaje del campo de color) ---------- */
  function drawBg() {
    const w = 240, h = 150; bg.width = w; bg.height = h;
    const g = bg.getContext("2d"), img = g.createImageData(w, h), rr = mulberry(77);
    const grid = []; const gw = 9, gh = 6;
    for (let i = 0; i <= gw * gh + gw; i++) grid.push(rr());
    const val = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, s = (t) => t * t * (3 - 2 * t); const a = grid[(yi * (gw + 1) + xi) % grid.length], b = grid[(yi * (gw + 1) + xi + 1) % grid.length], c = grid[((yi + 1) * (gw + 1) + xi) % grid.length], d = grid[((yi + 1) * (gw + 1) + xi + 1) % grid.length]; return (a + (b - a) * s(fx)) + ((c + (d - c) * s(fx)) - (a + (b - a) * s(fx))) * s(fy); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = val((x / w) * gw, (y / h) * gh) * 0.65 + val((x / w) * gw * 2.3, (y / h) * gh * 2.3) * 0.35;
      const a = n > 0.62 ? 0.22 : n > 0.5 ? 0.11 : 0;
      const i = (y * w + x) * 4; img.data[i] = 0; img.data[i + 1] = 0; img.data[i + 2] = 20; img.data[i + 3] = a * 255;
    }
    g.putImageData(img, 0, 0);
  }
  drawBg();

  /* ---------- Tarjetas ---------- */
  let items = [], total = 0;
  const F = 900;
  function build() {
    world.innerHTML = ""; items = [];
    const rng = mulberry(4242);
    // Imágenes por proyecto: capturas reales + escenas temáticas.
    const per = projects.map((p) => {
      const list = [];
      (p.shots || []).forEach((s, k) => { if (s) list.push({ id: p.id + "~s" + k, cover: s, real: true }); });
      const n = Math.max(PF.scenes ? PF.scenes.count(p.id) : 0, 2);
      for (let k = 0; k < n; k++) list.push({ id: p.id + "-" + k, cover: null });
      if (p.cover) list.unshift({ id: p.id + "~c", cover: p.cover, real: true });
      return list.slice(0, narrow() ? 3 : 4);
    });
    // Intercala proyectos para que ninguno se agrupe.
    const order = []; const maxN = Math.max(...per.map((l) => l.length));
    for (let k = 0; k < maxN; k++) projects.forEach((p, i) => { if (per[i][k]) order.push({ p, it: per[i][k], k }); });
    total = order.length;
    const asp = [1.5, 1.33, 1.78, 0.8, 1.25];
    const base = narrow() ? 190 : 270;
    order.forEach((o, i) => {
      const ar = asp[Math.floor(rng() * asp.length)], w = Math.round(base * (0.75 + rng() * 0.5)), h = Math.round(w / ar);
      const el = document.createElement("button");
      el.type = "button"; el.className = "g3-card"; el.setAttribute("role", "listitem"); el.dataset.p = o.p.id;
      el.style.width = w + "px"; el.style.height = h + "px";
      el.setAttribute("aria-label", o.p.title + ". Abrir el proyecto");
      el.innerHTML = '<canvas></canvas><span class="g3-lab label">' + pad2(projects.indexOf(o.p) + 1) + " · " + esc(o.p.title) + "</span>";
      world.appendChild(el);
      el.addEventListener("click", () => PF.detail && PF.detail.open(o.p.id, el));
      el.addEventListener("pointerenter", () => setActive(o.p.id));
      el.addEventListener("pointerleave", () => setActive(null));
      el.addEventListener("focus", () => setActive(o.p.id));
      el.addEventListener("blur", () => setActive(null));
      PF.covers.track(el.querySelector("canvas"), { id: o.it.id, cover: o.it.cover, plain: true }, w, h);
      const t = i / total;
      items.push({
        el, pid: o.p.id, w, h, z: i * (narrow() ? 230 : 250),
        x: Math.sin(i * 1.7) * 0.34 + (rng() - 0.5) * 0.3, y: Math.cos(i * 1.3 + 0.8) * 0.26 + (rng() - 0.5) * 0.2,
        rot: (rng() - 0.5) * 5, ph: rng() * 6.28
      });
    });
  }
  let active = null;
  function setActive(pid) {
    active = pid;
    liBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.p === pid));
    stage.classList.toggle("has-active", !!pid);
  }
  liBtns.forEach((b) => {
    b.addEventListener("pointerenter", () => setActive(b.dataset.p));
    b.addEventListener("pointerleave", () => setActive(null));
    b.addEventListener("focus", () => setActive(b.dataset.p));
    b.addEventListener("blur", () => setActive(null));
    b.addEventListener("click", () => {
      const it = items.find((x) => x.pid === b.dataset.p);
      if (it) { const r = host.getBoundingClientRect(), span = host.offsetHeight - innerHeight; const prog = clamp((it.z - 150) / Math.max(1, zRange())); PF.scrollTo(window.scrollY + r.top + prog * span); }
    });
  });
  const zRange = () => Math.max(1, (items.length ? items[items.length - 1].z : 1));

  /* ---------- Bucle ---------- */
  let target = 0, prog = 0, visible = false, W = 0, H = 0;
  if (window.ScrollTrigger) ScrollTrigger.create({ trigger: host, start: "top top", end: "bottom bottom", onUpdate: (s) => { target = s.progress; } });
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { rootMargin: "200px" }).observe(host);
  else visible = true;

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || !items.length) return;
    prog += (target - prog) * (PF.reducedMotion ? 1 : 0.1);
    if (PF.field) PF.field.boost = -0.45;   // fondo de caracteres más tenue en la galería
    const time = PF.reducedMotion ? 0 : now / 1000, m = PF.mouse;
    W = stage.clientWidth; H = stage.clientHeight;
    const camZ = prog * (zRange() - 100) - 120 + (PF.reducedMotion ? 0 : Math.sin(time * 0.3) * 8);
    const camX = m.x * 0.12 * W, camY = m.y * 0.1 * H;
    let nearest = 0, nd = 1e9;
    items.forEach((it, i) => {
      const d = it.z - camZ;
      const vis = d > 60 && d < 3600;
      if (!vis) { if (it.on) { it.el.style.visibility = "hidden"; it.on = false; } return; }
      if (!it.on) { it.el.style.visibility = "visible"; it.on = true; }
      const s = F / (d + F * 0.62);
      const px = (it.x * W * 0.9 - camX * 0.9) * s + (Math.sin(time * 0.5 + it.ph) * 6) * s;
      const py = (it.y * H * 0.9 - camY * 0.9) * s + (Math.cos(time * 0.4 + it.ph) * 6) * s;
      let a = smooth(3600, 2400, d) * smooth(60, 380, d);
      if (active && it.pid !== active) a *= 0.22;
      it.el.style.opacity = a.toFixed(3);
      it.el.style.transform = "translate3d(" + px.toFixed(1) + "px," + py.toFixed(1) + "px,0) translate(-50%,-50%) scale(" + s.toFixed(3) + ") rotate(" + (it.rot * smooth(2400, 0, d)).toFixed(2) + "deg)";
      it.el.style.zIndex = String(Math.round(5000 - d));
      it.el.style.pointerEvents = a > 0.5 && s > 0.3 ? "auto" : "none";
      if (d > 120 && d < nd) { nd = d; nearest = i; }
    });
    bg.style.transform = "translate3d(" + (-m.x * 18).toFixed(1) + "px," + (-m.y * 12).toFixed(1) + "px,0) scale(1.08)";
    countEl.textContent = pad2(nearest + 1) + " / " + pad2(total);
  }

  PF.on("theme", () => {});
  window.addEventListener("load", () => { if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 250); });
  let lastNarrow = narrow();
  window.addEventListener("resize", () => { if (narrow() !== lastNarrow) { lastNarrow = narrow(); build(); } });

  const start = () => { build(); requestAnimationFrame(frame); };
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);
  PF.gallery3d = { progress: () => prog };
})();
