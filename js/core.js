/* ==========================================================================
   NÚCLEO — estado global, temas, tipografías, scroll (Lenis + ScrollTrigger)
   API pública (window.PF):
     PF.config            -> window.PORTFOLIO
     PF.state             -> ajustes actuales (ver PORTFOLIO.defaults)
     PF.set(key, value)   -> cambia un ajuste, lo guarda y emite 'change'
     PF.on(evt, fn)       -> eventos: 'change' {key,value,state}, 'theme' {colors}
     PF.colors()          -> {bg, fg, muted, line, accent} del tema activo
     PF.lenis             -> instancia de Lenis (o null con reduced-motion)
     PF.scrollTo(target)  -> scroll suave a selector/elemento/número
     PF.lockScroll(bool)  -> bloquea/desbloquea el scroll (modales)
     PF.reducedMotion     -> boolean
   ========================================================================== */
(function () {
  const PF = (window.PF = window.PF || {});
  const C = (PF.config = window.PORTFOLIO);
  const KEY = "pf-settings-v2";
  const root = document.documentElement;

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { saved = {}; }
  const state = (PF.state = Object.assign({}, C.defaults, saved));
  // Descarta valores guardados que ya no existen en la configuración.
  if (!C.palettes[state.palette]) state.palette = C.defaults.palette;
  if (!C.fonts[state.font]) state.font = C.defaults.font;
  if (!C.effects[state.effect]) state.effect = C.defaults.effect;
  if (state.hero !== "orb" && state.hero !== "barrel") state.hero = C.defaults.hero;
  if (!C.barrelBackgrounds[state.barrelBg]) state.barrelBg = C.defaults.barrelBg;

  const listeners = {};
  PF.on = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); };
  PF.emit = (evt, data) => { (listeners[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };

  PF.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  PF.colors = () => C.palettes[state.palette][state.theme === "light" ? "light" : "dark"];

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  PF.hexToRgb = hexToRgb;

  function applyTheme() {
    const c = PF.colors();
    root.dataset.theme = state.theme === "light" ? "light" : "dark";
    root.style.setProperty("--bg", c.bg);
    root.style.setProperty("--fg", c.fg);
    root.style.setProperty("--muted", c.muted);
    root.style.setProperty("--line", c.line);
    root.style.setProperty("--accent", c.accent);
    root.style.setProperty("--fg-rgb", hexToRgb(c.fg).join(","));
    root.style.setProperty("--bg-rgb", hexToRgb(c.bg).join(","));
    root.style.setProperty("--accent-rgb", hexToRgb(c.accent).join(","));
    const f = C.fonts[state.font];
    root.style.setProperty("--font-display", f.display);
    root.style.setProperty("--font-mono", f.mono);
    root.style.setProperty("--display-stretch", f.displayStretch || "100%");
    root.dataset.font = state.font;
    root.dataset.effect = state.effect;
    root.dataset.hero = state.hero;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", c.bg);
    PF.emit("theme", { colors: c, state });
  }
  PF.applyTheme = applyTheme;

  PF.set = (key, value) => {
    if (state[key] === value) return;
    state[key] = value;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* almacenamiento no disponible */ }
    if (["theme", "palette", "font", "effect", "hero"].includes(key)) applyTheme();
    PF.emit("change", { key, value, state });
  };

  PF.reset = () => {
    Object.keys(C.defaults).forEach((k) => (state[k] = C.defaults[k]));
    try { localStorage.removeItem(KEY); } catch (e) {}
    applyTheme();
    PF.emit("change", { key: "*", value: null, state });
  };

  applyTheme();

  /* ---------- Scroll suave ---------- */
  PF.lenis = null;
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (!PF.reducedMotion && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
    PF.lenis = lenis;
    if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    if (window.gsap) {
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* Velocidad de scroll normalizada (px/frame), útil para skew en la galería. */
  PF.velocity = () => (PF.lenis ? PF.lenis.velocity : 0);

  PF.scrollTo = (target, opts = {}) => {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (PF.lenis) PF.lenis.scrollTo(el, Object.assign({ duration: 1.6 }, opts));
    else if (typeof el === "number") window.scrollTo({ top: el });
    else if (el) el.scrollIntoView({ behavior: PF.reducedMotion ? "auto" : "smooth" });
  };

  PF.lockScroll = (lock) => {
    if (PF.lenis) lock ? PF.lenis.stop() : PF.lenis.start();
    document.body.classList.toggle("is-locked", !!lock);
  };

  /* Ratón normalizado [-1, 1], suavizado, compartido por todas las escenas. */
  const mouse = (PF.mouse = { x: 0, y: 0, tx: 0, ty: 0 });
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  (function tick() {
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    requestAnimationFrame(tick);
  })();

  /* Tamaño de celda en px CSS para el efecto activo. */
  PF.cellSize = () => {
    const base = C.effects[state.effect].cell;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600 ? 0.85 : 1;
    return Math.max(4, base * state.density * small);
  };
})();
