/* ==========================================================================
   INTRO "ESFERA" — scroll-scrubbing en tres tiempos
     1. Esfera tramada (estilo estarcido 1-bit) que crece hasta inundar la pantalla.
     2. La inundación se disuelve en un túnel de polvo radial.
     3. Una constelación de imágenes llega desde el centro y se asienta alrededor
        de una foto central, unida por líneas, con capas de visión por computador
        (cajas con confianza, puntos de interés, máscara de segmentación).
   La constelación es la entrada a la galería.
   Se activa con PF.state.hero === "orb". API: PF.hero2 = { progress() }
   ========================================================================== */
(function () {
  const PF = window.PF;
  const canvas = document.getElementById("orb");
  const deck = document.getElementById("deck");
  const fxCv = document.getElementById("deckfx");
  const hero = document.getElementById("hero");
  if (!canvas || !deck || !fxCv || !hero) return;
  const C = PF.config;

  /* ---------------- Utilidades ---------------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  function mulberry(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pad = (n, w) => String(Math.floor(n)).padStart(w, "0");
  const isOrb = () => PF.state.hero === "orb";

  /* ---------------- Esfera: shader ---------------- */
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" });
  } catch (e) { renderer = null; }

  const FRAG = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uA, uB, uZ, uTime, uCell, uDim;
    uniform vec3 uInk, uPaper;

    float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    void main(){
      vec2 cell = floor(gl_FragCoord.xy / uCell);
      vec2 uv = ((cell + 0.5) * uCell - 0.5 * uRes) / min(uRes.x, uRes.y);
      float r = length(uv);
      float ang = atan(uv.y, uv.x);

      // --- esfera
      float R = mix(0.30, 2.7, pow(uA, 2.0));
      float n = noise(uv * 7.0 + uTime * 0.04) * 0.55 + noise(uv * 19.0) * 0.25;
      float edge = R * (1.0 + 0.028 * (n - 0.4));
      float core = 1.0 - smoothstep(edge - 0.012, edge + 0.006, r);
      float rays = noise(vec2(ang * 22.0, r * 1.5)) * 0.55 + noise(vec2(ang * 80.0, 3.0)) * 0.45;
      float d = max(r - edge, 0.0);
      float halo = exp(-d * (8.5 / (0.30 + R * 0.45))) * (0.35 + 0.9 * rays);
      float spill = 1.0 + 0.55 * smoothstep(0.1, -0.7, uv.y) * exp(-d * 1.6);   // luz que cae hacia abajo
      float orb = core * (0.955 + 0.06 * n) + (1.0 - core) * clamp(halo * spill * 0.95, 0.0, 1.0);
      orb += 0.012;

      // --- túnel de polvo radial (tras la inundación)
      float dust = 0.0;
      for (int i = 0; i < 3; i++) {
        float k = float(i);
        float a2 = ang * (26.0 + k * 22.0);
        float rr = log(r + 0.03) * (5.0 + k * 3.0) - uZ * (0.9 + k * 0.55);
        float h = hash(vec2(floor(a2) + k * 7.0, floor(rr) + k * 31.0));
        float dash = smoothstep(0.0, 0.5, fract(rr)) * (1.0 - smoothstep(0.5, 1.0, fract(rr)));
        dust += step(0.991 - k * 0.001, h) * (0.4 + 0.6 * dash) * clamp(r * 3.0, 0.0, 1.0);
      }
      float hub = 0.30 * exp(-r * 4.5) * smoothstep(0.0, 0.5, uB);
      float tunnel = clamp(dust * 0.9 + hub, 0.0, 1.0) * (1.0 - 0.55 * uDim);

      float lum = mix(orb, tunnel, uB);
      float t = hash(cell + 11.7);
      float on = step(t, lum);
      // Tras la inundación el papel se vuelve transparente: se ve el campo de caracteres de fondo.
      float a = mix(1.0, on, uB);
      vec3 col = mix(uPaper, uInk, on);
      gl_FragColor = vec4(col * a, a);
    }
  `;
  const U = {
    uRes: { value: new THREE.Vector2(1, 1) }, uA: { value: 0 }, uB: { value: 0 }, uZ: { value: 0 }, uTime: { value: 0 }, uDim: { value: 0 },
    uCell: { value: 2 }, uInk: { value: new THREE.Color("#fff") }, uPaper: { value: new THREE.Color("#000") }
  };
  let scene, cam;
  if (renderer) {
    scene = new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }", fragmentShader: FRAG, uniforms: U, depthTest: false, depthWrite: false
    })));
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /* ---------------- Constelación: datos de las tarjetas ---------------- */
  const narrow = () => window.innerWidth < 700;
  const LABELS = ["dato", "modelo", "grafo", "señal", "gráfica", "flujo", "región", "objeto", "patrón", "nodo"];
  let cards = [], hub = null, W = 0, H = 0, dpr = 1;
  const stage = hero.querySelector(".hero-stage");
  const ctx = fxCv.getContext("2d");

  /* Imágenes de cada proyecto: capturas reales y esquemas propios (sin filtros). */
  function pool() {
    const per = C.projects.map((p) => {
      const list = [];
      (p.shots || []).forEach((sh, k) => { if (sh) list.push({ id: p.id + "~s" + k, cover: sh, kind: "captura", p }); });
      const n = Math.max(PF.scenes ? PF.scenes.count(p.id) : 0, 2);
      for (let k = 0; k < n; k++) list.push({ id: p.id + "-" + k, cover: null, kind: "esquema", p });
      return list.slice(0, 3);
    });
    const out = [];
    for (let k = 0; k < 3; k++) per.forEach((l) => { if (l[k]) out.push(l[k]); });
    return out;
  }
  /* Tarjetas de información del perfil. */
  function infoCards() {
    const o = C.owner, ghUser = String(o.github).replace(/^https?:\/\//, "");
    return [
      { tag: "perfil", k: "Perfil", v: o.role },
      { tag: "enfoque", k: "Enfoque", v: "RAG, agentes y memoria para IA con MCP" },
      { tag: "stack", k: "Stack", v: "Python · SQL · PyTorch · Supabase · n8n" },
      { tag: "lugar", k: "Ubicación", v: o.location + " · Euskadi, Araba, Bizkaia, Gipuzkoa" },
      { tag: "proyectos", k: "Proyectos", v: String(C.projects.length).padStart(2, "0") + " en este portfolio" },
      { tag: "github", k: "GitHub", v: ghUser + " ↗", href: o.github }
    ];
  }

  const hubDims = () => { const hw = Math.round(clamp(Math.min(W, H) * (narrow() ? 0.3 : 0.31), 120, 250)); return [hw, Math.round(hw * 1.2)]; };
  const hubR = () => { const d = hubDims(); return Math.hypot(d[0], d[1]) * 0.5 * 1.05; };
  /* Relajación: separa las tarjetas entre sí, del centro y de los bordes. */
  function relax(hr) {
    for (let it = 0; it < 80; it++) {
      for (let i = 0; i < cards.length; i++) {
        const a = cards[i], ra = Math.hypot(a.w, a.h) * 0.5 * a.sc * 0.82;
        const dc = Math.hypot(a.tx, a.ty) || 1, minC = hr + ra * 0.9;
        if (dc < minC) { a.tx *= minC / dc; a.ty *= minC / dc; }
        for (let j = i + 1; j < cards.length; j++) {
          const b = cards[j], rb = Math.hypot(b.w, b.h) * 0.5 * b.sc * 0.82;
          let dx = b.tx - a.tx, dy = b.ty - a.ty; const d = Math.hypot(dx, dy) || 1, need = ra + rb;
          if (d < need) { const k = (need - d) / 2 / d; dx *= k; dy *= k; a.tx -= dx; a.ty -= dy; b.tx += dx; b.ty += dy; }
        }
        const mx = W / 2 - (a.w * a.sc) / 2 - 10, my = H / 2 - (a.h * a.sc) / 2 - 44;
        a.tx = clamp(a.tx, -mx, mx); a.ty = clamp(a.ty, -my, my);
      }
    }
  }

  function build() {
    deck.querySelectorAll(".dk-card").forEach((n) => n.remove());
    cards = []; hub = null;
    W = stage.clientWidth || window.innerWidth; H = stage.clientHeight || window.innerHeight;
    const rng = mulberry(20261016);
    const nImg = narrow() ? 9 : 15, nInfo = narrow() ? 3 : 6;
    const base = clamp(Math.min(W, H) * 0.2, 80, 190);
    const asp = [1.5, 1.33, 1.78, 1.25, 0.9];
    const imgs = pool().slice(0, nImg), infos = infoCards().slice(0, nInfo);
    const list = [];
    for (let i = 0, a = 0, b = 0; a < imgs.length || b < infos.length; i++) {
      if (b < infos.length && (i % 3 === 2 || a >= imgs.length)) list.push({ info: infos[b++] });
      else if (a < imgs.length) list.push({ img: imgs[a++] });
    }
    const N = list.length;
    list.forEach((it, i) => {
      const isInfo = !!it.info;
      const ar = asp[Math.floor(rng() * asp.length)];
      const w = isInfo ? (narrow() ? 150 : 196) : Math.round(base * (0.8 + rng() * 0.5));
      const h = isInfo ? (narrow() ? 76 : 86) : Math.round(w / ar);
      const ang = i * 2.39996 + (rng() - 0.5) * 0.5;
      const rad = 0.45 + 0.55 * Math.sqrt((i + 0.5) / N);
      const tx = Math.cos(ang) * rad * W * 0.44, ty = Math.sin(ang) * rad * H * 0.42;
      const el = document.createElement("div");
      el.style.width = w + "px"; el.style.height = h + "px";
      let tag;
      if (isInfo) {
        el.className = "dk-card dk-info";
        const v = it.info.href ? '<a href="' + it.info.href + '" target="_blank" rel="noopener">' + it.info.v + "</a>" : "<b>" + it.info.v + "</b>";
        el.innerHTML = '<span class="label">' + it.info.k + "</span>" + v;
        tag = it.info.tag;
      } else {
        const pr = it.img.p;
        el.className = "dk-card is-link";
        el.innerHTML = '<canvas class="dk-img"></canvas><canvas class="dk-ov"></canvas>';
        el.tabIndex = -1; el.setAttribute("role", "button"); el.setAttribute("aria-label", "Abrir " + pr.title);
        el.addEventListener("click", () => PF.detail && PF.detail.open(pr.id, el));
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
        tag = pr.title.toLowerCase();
      }
      deck.appendChild(el);
      const o = {
        el, w, h, tx, ty, rad, sc: isInfo ? 0.95 + rng() * 0.15 : 0.8 + rng() * 0.4, rot: (rng() - 0.5) * (isInfo ? 3 : 8), spin: (rng() - 0.5) * 70,
        start: 0.42 * rad + rng() * 0.12, ph: rng() * 6.28, tag, title: isInfo ? "" : it.img.p.title, kind: isInfo ? "" : it.img.kind, info: isInfo,
        t: 0, e: 0, x: 0, y: 0, s: 1
      };
      cards.push(o);
      if (!isInfo && PF.covers) PF.covers.track(el.querySelector(".dk-img"), { id: it.img.id, cover: it.img.cover, plain: true }, w, h);
    });
    relax(hubR());
    // Tarjeta central (foto con segmentación).
    const [hw, hh] = hubDims();
    const hel = document.createElement("div");
    hel.className = "dk-card dk-hub"; hel.style.width = hw + "px"; hel.style.height = hh + "px";
    hel.setAttribute("aria-hidden", "true");
    hel.innerHTML = '<canvas class="dk-img"></canvas><canvas class="dk-ov"></canvas>';
    deck.appendChild(hel);
    hub = { el: hel, w: hw, h: hh, tx: 0, ty: 0, sc: 1, rot: 0, spin: 0, start: 0, ph: 1.3, t: 0, e: 0, x: 0, y: 0, s: 1, hub: true };
    const photo = C.owner.photo;
    if (photo && PF.covers) PF.covers.track(hel.querySelector(".dk-img"), { id: "hub", cover: photo, plain: true }, hw, hh);
    drawOverlays();
  }

  /* ---------------- Capas de visión por computador ---------------- */
  function setupOv(cv, w, h) { const d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(w * d); cv.height = Math.round(h * d); const g = cv.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h); return g; }

  function chip(g, x, y, text, col, fg) {
    g.font = "500 9px 'JetBrains Mono', ui-monospace, monospace";
    const tw = Math.ceil(g.measureText(text).width) + 8;
    g.fillStyle = col; g.fillRect(x, y - 12, tw, 12);
    g.fillStyle = fg; g.textBaseline = "middle"; g.fillText(text, x + 4, y - 5.5);
  }
  function brackets(g, x, y, w, h, l) {
    g.beginPath();
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => { g.moveTo(cx, cy + sy * l); g.lineTo(cx, cy); g.lineTo(cx + sx * l, cy); });
    g.stroke();
  }

  function drawOverlays() {
    const c = PF.colors();
    cards.forEach((o) => {
      if (o.info) return;
      const cv = o.el.querySelector(".dk-ov"), g = setupOv(cv, o.w, o.h);
      g.strokeStyle = "rgba(" + PF.hexToRgb(c.fg).join(",") + ",0.4)"; g.lineWidth = 1; g.strokeRect(0.5, 0.5, o.w - 1, o.h - 1);
      g.strokeStyle = "#fff"; g.lineWidth = 2; brackets(g, 3, 3, o.w - 6, o.h - 6, 7);
      chip(g, 0, o.h, o.title.toUpperCase() + " · " + o.kind, c.accent, "#fff");
    });
    if (hub) drawHubOverlay();
  }

  /* Segmentación del retrato: distancia de color al fondo (muestreado en el borde), suavizado y contorno. */
  let hubImg = null, hubMask = null;
  function loadHub() {
    if (!C.owner.photo || hubImg) return;
    hubImg = new Image();
    hubImg.onload = () => { hubMask = null; drawHubOverlay(); };
    hubImg.onerror = () => { hubImg = null; };
    hubImg.src = C.owner.photo;
  }
  function computeMask(w, h) {
    const k = Math.max(w / hubImg.naturalWidth, h / hubImg.naturalHeight);
    const dw = hubImg.naturalWidth * k, dh = hubImg.naturalHeight * k;
    const off = document.createElement("canvas"); off.width = w; off.height = h;
    const g = off.getContext("2d", { willReadFrequently: true });
    g.drawImage(hubImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
    let d;
    try { d = g.getImageData(0, 0, w, h).data; } catch (e) { return null; }
    const bg = [0, 0, 0]; let nb = 0;
    for (let x = 0; x < w; x += 3) for (let y = 0; y < 6; y++) { const i = (y * w + x) * 4; bg[0] += d[i]; bg[1] += d[i + 1]; bg[2] += d[i + 2]; nb++; }
    bg[0] /= nb; bg[1] /= nb; bg[2] /= nb;
    let m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (x > w * 0.86 && y > h * 0.88) continue;               // marca de agua de la esquina
      const i = (y * w + x) * 4;
      const dist = (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2])) / 3;
      m[y * w + x] = dist > 34 ? 1 : 0;
    }
    for (let pass = 0; pass < 2; pass++) {                       // filtro de mayoría 3x3
      const n2 = new Uint8Array(w * h);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        let s = 0; for (let j = -1; j <= 1; j++) for (let i2 = -1; i2 <= 1; i2++) s += m[(y + j) * w + x + i2];
        n2[y * w + x] = s >= 5 ? 1 : 0;
      }
      m = n2;
    }
    return { m, k, ox: (w - dw) / 2, oy: (h - dh) / 2 };
  }
  function drawHubOverlay() {
    if (!hub) return;
    const cv = hub.el.querySelector(".dk-ov"), w = hub.w, h = hub.h, c = PF.colors();
    const g = setupOv(cv, w, h);
    if (hubImg && hubImg.complete && hubImg.naturalWidth) {
      if (!hubMask || hubMask.w !== w) { hubMask = computeMask(w, h); if (hubMask) hubMask.w = w; }
      const mk = hubMask;
      if (mk) {
        const m = mk.m;
        g.fillStyle = "rgba(" + PF.hexToRgb(c.accent).join(",") + ",0.20)";
        for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (m[y * w + x] && ((x + y) & 7) === 0) g.fillRect(x, y, 2, 2);
        g.fillStyle = c.accent;
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          if (!m[y * w + x]) continue;
          if (!m[y * w + x - 1] || !m[y * w + x + 1] || !m[(y - 1) * w + x] || !m[(y + 1) * w + x]) g.fillRect(x, y, 1.4, 1.4);
        }
        // Puntos de referencia faciales (posiciones medidas sobre la foto original).
        const P = (ix, iy) => [mk.ox + ix * mk.k, mk.oy + iy * mk.k];
        const pts = [P(345, 368), P(437, 360), P(398, 410), P(372, 462), P(424, 462)];
        g.strokeStyle = c.fg; g.lineWidth = 1;
        pts.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.6, 0, 6.2832); g.stroke(); });
        g.setLineDash([2, 2]); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.setLineDash([]);
        const f0 = P(258, 250), f1 = P(495, 548);
        g.strokeStyle = c.fg; g.lineWidth = 1.2; g.strokeRect(f0[0], f0[1], f1[0] - f0[0], f1[1] - f0[1]);
        chip(g, f0[0], f0[1], "rostro", c.fg, c.bg);
      }
    }
    g.strokeStyle = c.accent; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
    chip(g, 0.75, h - 1, "ortzi garaio · máscara", c.accent, "#fff");
  }

  /* ---------------- Fondo (líneas de conexión) ---------------- */
  function sizeFx() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    fxCv.width = Math.round(W * dpr); fxCv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawLines(p, time) {
    ctx.clearRect(0, 0, W, H);
    const c = PF.colors(), cx = W / 2, cy = H / 2;
    const ink = "rgba(" + PF.hexToRgb(c.fg).join(",") + ",";
    ctx.lineWidth = 1; ctx.font = "9px 'JetBrains Mono', ui-monospace, monospace"; ctx.textBaseline = "middle";
    cards.forEach((o) => {
      const lt = smooth(0.62, 1, o.t);
      if (lt <= 0.01) return;
      // Ancla: borde de la tarjeta más cercano al centro.
      const hw = (o.w * o.s) / 2, hh = (o.h * o.s) / 2;
      const dx = cx - o.x, dy = cy - o.y, k = Math.min(hw / Math.max(Math.abs(dx), 1e-3), hh / Math.max(Math.abs(dy), 1e-3), 1);
      const ax = o.x + dx * k, ay = o.y + dy * k;
      const hs = hub ? (hub.h * hub.s) / 2 : 0, sx = cx, sy = cy + 0;
      const len = Math.hypot(ax - sx, ay - sy);
      const nx = -(ay - sy) / len, ny = (ax - sx) / len, bend = len * 0.18;
      const mx = (sx + ax) / 2 + nx * bend, my = (sy + ay) / 2 + ny * bend;
      ctx.strokeStyle = ink + (0.5 * lt) + ")";
      ctx.beginPath(); ctx.moveTo(sx, sy);
      const steps = 28, upto = Math.max(1, Math.round(steps * lt));
      for (let i = 1; i <= upto; i++) { const u = i / steps, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u; ctx.lineTo(a * sx + b * mx + d * ax, a * sy + b * my + d * ay); }
      ctx.stroke();
      if (lt > 0.95) {
        ctx.fillStyle = c.accent; ctx.fillRect(ax - 2.5, ay - 2.5, 5, 5);
        ctx.fillStyle = ink + "0.85)";
        const side = ax >= cx ? 1 : -1;
        ctx.textAlign = side > 0 ? "left" : "right";
        ctx.fillText(o.tag, ax + side * 8, ay + (ay >= cy ? 8 : -8));
      }
    });
  }

  /* ---------------- Bucle ---------------- */
  let target = 0, prog = 0, visible = true, last = 0;
  const t0 = performance.now();
  const hudEls = {};
  hero.querySelectorAll("[data-ohud]").forEach((el) => (hudEls[el.dataset.ohud] = el));

  if (window.ScrollTrigger) ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom bottom", onUpdate: (s) => { if (isOrb()) target = s.progress; } });
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(hero);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!isOrb() || !visible || document.hidden) return;
    const mv = Math.abs(target - prog) > 1e-4;
    prog += (target - prog) * (PF.reducedMotion ? 1 : 0.14);
    const p = prog, time = PF.reducedMotion ? 0 : (now - t0) / 1000;
    if (!mv && PF.reducedMotion && now - last < 500) return;
    last = now;

    const A = smooth(0, 0.25, p), B = smooth(0.17, 0.31, p);
    if (renderer) {
      U.uA.value = A; U.uB.value = B; U.uZ.value = p * 7 + time * 0.15; U.uTime.value = time; U.uDim.value = smooth(0.5, 1, clamp((p - 0.30) / 0.58));
      renderer.render(scene, cam);
    }
    document.documentElement.style.setProperty("--hero-p", p.toFixed(4));

    const pC = clamp((p - 0.30) / 0.58), m = PF.mouse;
    let arrived = 0;
    const place = (o, q0, q1) => {
      const lin = clamp((pC - q0) / (q1 - q0));
      const e = outCubic(lin);
      const q = 1 / (1 + (1 - e) * 7.5);
      const fl = PF.reducedMotion ? 0 : 1;
      const fx = Math.sin(time * 0.6 + o.ph) * 5 * e * fl, fy = Math.cos(time * 0.5 + o.ph * 1.3) * 5 * e * fl;
      const par = (o.sc || 1) * 16 * e;
      o.t = lin; o.e = e;
      o.s = (o.sc || 1) * q;
      o.x = o.tx * q + fx - m.x * par; o.y = o.ty * q + fy - m.y * par;
      const rot = o.rot * e + (1 - e) * o.spin;
      o.el.style.opacity = String(smooth(0, 0.18, lin));
      o.el.style.transform = "translate3d(" + o.x.toFixed(1) + "px," + o.y.toFixed(1) + "px,0) translate(-50%,-50%) scale(" + o.s.toFixed(3) + ") rotate(" + rot.toFixed(2) + "deg)";
      o.el.style.zIndex = String(Math.round(o.s * 100));
      if (lin > 0.96) arrived++;
    };
    if (hub) { place(hub, 0, 0.5); hub.el.style.zIndex = "300"; }
    cards.forEach((o) => place(o, o.start, o.start + 0.5));
    deck.classList.toggle("is-live", p > 0.86);
    deck.style.visibility = p > 0.26 ? "visible" : "hidden";
    drawLines(p, time);

    if (hudEls.scale) hudEls.scale.textContent = "×" + (A > 0.999 ? "∞" : (mix(0.30, 2.7, Math.pow(A, 2.0)) / 0.30).toFixed(1));
    if (hudEls.regions) hudEls.regions.textContent = pad(arrived, 2);
    if (hudEls.pct) hudEls.pct.textContent = pad(p * 100, 3) + "%";
    const bar = hero.querySelector('[data-hud="bar"]'); if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }
  const mix = (a, b, t) => a + (b - a) * t;

  /* ---------------- Tamaño y colores ---------------- */
  function resize() {
    if (renderer) {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      const w = stage.clientWidth || window.innerWidth, h = stage.clientHeight || window.innerHeight;
      renderer.setPixelRatio(d); renderer.setSize(w, h, false);
      U.uRes.value.set(Math.round(w * d), Math.round(h * d));
      U.uCell.value = Math.max(1.5, 2 * d * clamp(PF.state.density, 0.7, 1.6));
    }
    build(); sizeFx(); loadHub();
  }
  function colors() {
    const c = PF.colors();
    U.uInk.value.set(c.fg); U.uPaper.value.set(c.bg);
    drawOverlays();
  }
  PF.on("theme", () => { if (isOrb()) colors(); });
  PF.on("change", (e) => {
    if (e.key === "hero" || e.key === "*") { setTimeout(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 50); }
    if (e.key === "density") resize();
  });
  window.addEventListener("resize", () => { clearTimeout(resize._t); resize._t = setTimeout(() => { resize(); colors(); }, 160); });

  const start = () => { resize(); colors(); requestAnimationFrame(frame); };
  // Espera a "load": gallery.js (PF.covers) se carga después de este archivo.
  const whenReady = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start, start);
  if (document.readyState === "complete") whenReady(); else window.addEventListener("load", whenReady);

  PF.hero2 = { progress: () => prog };
})();
