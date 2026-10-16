/* ==========================================================================
   DETALLES DE INTERFAZ
   1. Cursor con retícula de visión por computador: cuatro esquinas que siguen
      al puntero y se ajustan al elemento clicable bajo él, con su etiqueta.
   2. Títulos que se descifran: las palabras grandes de sección entran como
      caracteres aleatorios que se resuelven de izquierda a derecha.
   ========================================================================== */
(function () {
  const PF = window.PF;
  if (!PF) return;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ---------- 1. Retícula ---------- */
  if (fine.matches && !PF.reducedMotion) {
    const rt = document.createElement("div");
    rt.className = "rt"; rt.setAttribute("aria-hidden", "true");
    rt.innerHTML = "<i></i><i></i><i></i><i></i><b></b><span></span>";
    document.body.appendChild(rt);
    const tag = rt.querySelector("span");
    const HOT = "a, button, [role='button'], summary, label, select, .g3-card, .dk-card.is-link, .idx-row, .g3-li";
    const cur = { x: -100, y: -100, w: 26, h: 26 }, tgt = { x: -100, y: -100, w: 26, h: 26 };
    let hot = null, press = 0, seen = false;
    const labelOf = (el) => {
      const t = (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").replace(/\s+/g, " ").trim();
      const kind = el.matches("a") ? "link" : el.matches("input,textarea,select") ? "field" : "open";
      return kind + " · " + (t.length > 26 ? t.slice(0, 25) + "…" : t || kind);
    };
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      if (!seen) { seen = true; document.documentElement.classList.add("has-reticle"); cur.x = e.clientX; cur.y = e.clientY; }
      rt.classList.add("is-on");
      const el = e.target.closest && e.target.closest(HOT);
      if (el !== hot) { hot = el; tag.textContent = el ? labelOf(el) : ""; rt.classList.toggle("is-hot", !!el); }
      tgt.x = e.clientX; tgt.y = e.clientY;
    }, { passive: true });
    document.addEventListener("pointerleave", () => rt.classList.remove("is-on"));
    window.addEventListener("pointerdown", () => { press = 1; });
    (function loop() {
      requestAnimationFrame(loop);
      let cx = tgt.x, cy = tgt.y, w = 26, h = 26;
      if (hot && hot.isConnected) { const r = hot.getBoundingClientRect(); if (r.width > 0) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; w = r.width + 10; h = r.height + 10; } }
      press *= 0.88;
      w += press * 8; h += press * 8;
      const k = hot ? 0.3 : 0.5;
      cur.x += (cx - cur.x) * k; cur.y += (cy - cur.y) * k; cur.w += (w - cur.w) * 0.3; cur.h += (h - cur.h) * 0.3;
      rt.style.width = cur.w.toFixed(1) + "px"; rt.style.height = cur.h.toFixed(1) + "px";
      rt.style.transform = "translate3d(" + (cur.x - cur.w / 2).toFixed(1) + "px," + (cur.y - cur.h / 2).toFixed(1) + "px,0)";
    })();
  }

  /* ---------- 2. Títulos que se descifran ---------- */
  const CH = "0d9P8s#%@XZ";
  function scramble(el) {
    if (el.__sc) return; el.__sc = true;
    const text = el.textContent, n = text.length, t0 = performance.now(), dur = 650 + n * 40;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur), done = Math.floor(k * n * 1.15);
      let out = "";
      for (let i = 0; i < n; i++) out += i < done || text[i] === " " ? text[i] : CH[(Math.random() * CH.length) | 0];
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step); else el.textContent = text;
    })(t0);
  }
  function arm() {
    if (PF.reducedMotion || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); scramble(e.target); } }), { threshold: 0.4 });
    document.querySelectorAll(".sec-word > span").forEach((el) => io.observe(el));
  }
  if (document.readyState === "complete") arm(); else window.addEventListener("load", arm);
})();
