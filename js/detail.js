/* ==========================================================================
   DETALLE DE PROYECTO — overlay #detail con transición FLIP
   API: PF.detail.open(projectId, sourceEl) · PF.detail.close()
        PF.detail.isOpen() · PF.detail.current()
   ========================================================================== */
(function () {
  const PF = window.PF;
  const host = document.getElementById("detail");
  if (!PF || !host) return;
  const projects = PF.config.projects;
  const pad2 = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const animate = () => !PF.reducedMotion && !!window.gsap;

  host.setAttribute("role", "dialog");
  host.setAttribute("aria-modal", "true");
  host.setAttribute("aria-labelledby", "detail-title");
  host.setAttribute("data-lenis-prevent", "");
  host.tabIndex = -1;

  let idx = -1, source = null, busy = false, lastFocus = null, scrollY0 = 0, untracks = [], flyEl = null;
  const outside = () => [document.getElementById("top"), document.getElementById("footer")].filter(Boolean);

  /* ---------- Marcado ---------- */
  function markup(p, i) {
    const n = projects.length;
    const shots = p.shots || [];
    const shotHtml = shots.map((s, k) => `
        <figure class="dt-shot">
          <div class="dt-shot-img">${s ? `<img src="${esc(s)}" alt="Screenshot ${k + 1} of ${esc(p.title)}" loading="lazy">` : `<canvas data-shot="${k}" role="img" aria-label="Illustrative screenshot ${k + 1} of ${esc(p.title)}"></canvas>`}</div>
          <figcaption class="label">Screenshot ${pad2(k + 1)} / ${pad2(shots.length)}</figcaption>
        </figure>`).join("");
    const prev = projects[(i - 1 + n) % n], next = projects[(i + 1) % n];
    return `
      <div class="dt-bar">
        <button type="button" class="dt-back" data-act="close"><span aria-hidden="true">←</span> Back to gallery</button>
        <span class="label">Project ${pad2(i + 1)} / ${pad2(n)}</span>
      </div>
      <article class="dt-page">
        <header class="dt-head" data-in>
          <h2 class="display dt-title" id="detail-title" tabindex="-1">${esc(p.title)}</h2>
          <dl class="dt-meta">
            <div><dt class="label">Year</dt><dd>${p.year}</dd></div>
            <div><dt class="label">Role</dt><dd>${esc(p.role)}</dd></div>
            <div><dt class="label">Stack</dt><dd>${esc(p.stack.join(" · "))}</dd></div>
          </dl>
        </header>
        <figure class="dt-cover"><canvas role="img" aria-label="Cover of ${esc(p.title)}"></canvas></figure>
        <p class="dt-summary" data-in>${esc(p.summary)}</p>
        <section class="dt-problem" data-in><h3 class="label">01 — Problem</h3><p>${esc(p.problem)}</p></section>
        <section class="dt-solution" data-in><h3 class="label">02 — Technical solution</h3><p>${esc(p.solution)}</p></section>
        <section class="dt-metrics" data-in aria-label="Metrics">
          <h3 class="label">03 — Metrics</h3>
          <dl>${(p.metrics || []).map((m) => `<div><dt class="label">${esc(m[0])}</dt><dd data-roll>${esc(m[1])}</dd></div>`).join("")}</dl>
        </section>
        <section class="dt-stack" data-in>
          <h3 class="label">04 — Stack</h3>
          <ul class="chips">${p.stack.map((t) => `<li class="chip">${esc(t)}</li>`).join("")}</ul>
        </section>
        ${shots.length ? `<section class="dt-shots" data-in>
          <h3 class="label">05 — Screenshots</h3>
          <div class="dt-strip" tabindex="0" role="region" aria-label="Screenshots of ${esc(p.title)} (horizontal scroll)">${shotHtml}</div>
        </section>` : ""}
        <div class="dt-links" data-in>
          <a class="btn" href="${esc(p.repo)}" target="_blank" rel="noopener">Repository on GitHub ↗</a>
          ${p.live ? `<a class="btn" href="${esc(p.live)}" target="_blank" rel="noopener">View live ↗</a>` : `<button type="button" class="btn" disabled>No public demo</button>`}
        </div>
        <nav class="dt-nav" data-in aria-label="Other projects">
          <button type="button" data-act="prev"><span class="label">← Previous · ${pad2(((i - 1 + n) % n) + 1)}</span><span class="display">${esc(prev.title)}</span></button>
          <button type="button" data-act="next"><span class="label">Next · ${pad2(((i + 1) % n) + 1)} →</span><span class="display">${esc(next.title)}</span></button>
        </nav>
      </article>`;
  }

  function untrackAll() { untracks.forEach((f) => f()); untracks = []; }

  /* Pinta portada y capturas (el overlay ya debe tener layout). */
  function paintCanvases(p) {
    const cv = host.querySelector(".dt-cover canvas");
    untracks.push(PF.covers.track(cv, p));
    host.querySelectorAll("canvas[data-shot]").forEach((c) => {
      const k = +c.dataset.shot;
      untracks.push(PF.covers.track(c, { id: p.id + "-" + k, cover: null }));
    });
  }

  function render(i) {
    idx = i;
    host.innerHTML = markup(projects[i], i);
  }

  /* ---------- Geometría para el FLIP ---------- */
  const visibleRect = (r) => !!r && r.width > 4 && r.height > 4 && r.top + r.height > 0 && r.top < window.innerHeight && r.left + r.width > 0 && r.left < window.innerWidth;
  function sourceRect(el) {
    if (!el || !el.isConnected) return null;
    const c = el.querySelector(".gal-cover") || el;
    const r = c.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }
  function findSource(id) {
    return document.querySelector('#gallery .gal-link[data-id="' + id + '"]') || (source && source.isConnected ? source : null);
  }
  function makeFly(canvas, r, p) {
    const el = document.createElement("div");
    el.className = "dt-fly";
    el.setAttribute("aria-hidden", "true");
    const c = document.createElement("canvas");
    if (canvas && canvas.width) {
      c.width = canvas.width; c.height = canvas.height;
      c.getContext("2d").drawImage(canvas, 0, 0);
    } else {
      PF.covers.draw(p, c, Math.max(r.width, 200), Math.max(r.height, 250));
    }
    el.appendChild(c);
    Object.assign(el.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    document.body.appendChild(el);
    flyEl = el;
    return el;
  }
  const dropFly = () => { if (flyEl) { flyEl.remove(); flyEl = null; } };

  /* ---------- Abrir ---------- */
  function open(id, srcEl) {
    if (idx >= 0 || busy) return;
    const i = projects.findIndex((p) => p.id === id);
    if (i < 0) return;
    const p = projects[i];
    busy = true;
    lastFocus = srcEl || document.activeElement;
    source = srcEl || null;
    scrollY0 = window.scrollY;

    /* Medidas del origen antes de bloquear el scroll. */
    const from = sourceRect(srcEl);
    const srcCanvas = srcEl && srcEl.querySelector("canvas");
    const doFly = animate() && visibleRect(from);
    const fly = doFly ? makeFly(srcCanvas, from, p) : null;

    render(i);
    PF.lockScroll(true);
    outside().forEach((el) => el.setAttribute("inert", ""));
    host.hidden = false;
    host.scrollTop = 0;
    paintCanvases(p);
    setTimeout(() => PF.roll && PF.roll(host), 450);
    const cover = host.querySelector(".dt-cover");
    const to = cover.getBoundingClientRect();
    const ins = host.querySelectorAll("[data-in], .dt-bar");

    const finish = () => {
      busy = false;
      host.style.overflowY = "";
      const t = host.querySelector(".dt-back");
      if (t) t.focus({ preventScroll: true });
    };

    if (!fly) {
      finish();
      return;
    }
    host.style.overflowY = "hidden";
    gsap.set(ins, { opacity: 0, y: 28 });
    gsap.set(cover, { opacity: 0 });
    gsap.fromTo(host, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
    const tl = gsap.timeline({ onComplete: () => { finish(); } });
    tl.to(fly, { left: to.left, top: to.top, width: to.width, height: to.height, duration: 0.95, ease: "expo.inOut" }, 0);
    tl.to(ins, { opacity: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.07, clearProps: "transform" }, 0.5);
    tl.to(cover, { opacity: 1, duration: 0.35, ease: "none" }, 0.9);
    tl.to(fly, { opacity: 0, duration: 0.35, ease: "none", onComplete: dropFly }, 0.95);
  }

  /* ---------- Cerrar ---------- */
  function cleanup() {
    untrackAll();
    dropFly();
    host.hidden = true;
    host.innerHTML = "";
    host.style.opacity = ""; host.style.overflowY = "";
    outside().forEach((el) => el.removeAttribute("inert"));
    idx = -1;
    /* Garantiza que el usuario vuelve exactamente al mismo punto. */
    if (Math.abs(window.scrollY - scrollY0) > 1) {
      if (PF.lenis) PF.lenis.scrollTo(scrollY0, { immediate: true, force: true });
      else window.scrollTo(0, scrollY0);
    }
    const back = source && source.isConnected ? source : lastFocus;
    if (back && back.focus) back.focus({ preventScroll: true });
    busy = false;
  }

  function close() {
    if (idx < 0 || busy) return;
    busy = true;
    const p = projects[idx];
    PF.lockScroll(false);
    const src = findSource(p.id);
    if (src) source = src;
    const to = sourceRect(src);
    const cover = host.querySelector(".dt-cover");
    const from = cover.getBoundingClientRect();
    const doFly = animate() && visibleRect(from) && visibleRect(to);
    if (!animate()) { cleanup(); return; }
    host.style.overflowY = "hidden";
    const ins = host.querySelectorAll("[data-in], .dt-bar");
    if (!doFly) {
      gsap.to(host, { opacity: 0, duration: 0.3, ease: "power2.in", onComplete: cleanup });
      return;
    }
    const fly = makeFly(host.querySelector(".dt-cover canvas"), from, p);
    gsap.set(cover, { opacity: 0 });
    const tl = gsap.timeline({ onComplete: cleanup });
    tl.to(ins, { opacity: 0, y: -16, duration: 0.3, ease: "power2.in", stagger: { each: 0.03, from: "end" } }, 0);
    tl.to(fly, { left: to.left, top: to.top, width: to.width, height: to.height, duration: 0.8, ease: "expo.inOut" }, 0.1);
    tl.to(host, { opacity: 0, duration: 0.4, ease: "power2.in" }, 0.5);
    tl.to(fly, { opacity: 0, duration: 0.25, ease: "none" }, 0.9);
  }

  /* ---------- Anterior / siguiente ---------- */
  function go(dir) {
    if (idx < 0 || busy) return;
    const n = projects.length, ni = (idx + dir + n) % n;
    const swap = () => {
      untrackAll();
      render(ni);
      host.scrollTop = 0;
      paintCanvases(projects[ni]);
      const t = host.querySelector(".dt-title");
      if (animate()) {
        const els = host.querySelectorAll("[data-in], .dt-cover");
        gsap.from(els, { opacity: 0, y: 28, duration: 0.7, ease: "power3.out", stagger: 0.06, clearProps: "all", onComplete: () => { busy = false; } });
      } else busy = false;
      if (t) t.focus({ preventScroll: true });
    };
    busy = true;
    if (animate()) gsap.to(host.querySelector(".dt-page"), { opacity: 0, y: -14, duration: 0.25, ease: "power2.in", onComplete: swap });
    else swap();
  }

  /* ---------- Eventos ---------- */
  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const a = b.dataset.act;
    if (a === "close") close();
    else if (a === "prev") go(-1);
    else if (a === "next") go(1);
  });

  document.addEventListener("keydown", (e) => {
    if (idx < 0) return;
    if (e.key === "Escape" && !e.defaultPrevented) { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const f = Array.from(host.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
    if (!f.length) { e.preventDefault(); host.focus(); return; }
    const first = f[0], last = f[f.length - 1], act = document.activeElement;
    if (!host.contains(act)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
  });

  PF.detail = {
    open,
    close,
    isOpen: () => idx >= 0,
    current: () => (idx >= 0 ? projects[idx].id : null)
  };
})();
