/* ==========================================================================
   SOBRE MÍ + HARD SKILLS — sección #about
   Panel técnico con LEDs, filtros por grupo y proyectos que usan cada skill.
   ========================================================================== */
(function () {
  const PF = window.PF;
  const root = document.getElementById("about");
  if (!PF || !root) return;
  const C = PF.config, owner = C.owner, projects = C.projects, groups = C.skills;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad2 = (n) => String(n).padStart(2, "0");
  const MAX = 5;

  /* Proyectos que usan una skill: coincidencia por inclusión (sin mayúsculas).
     Los nombres de 1-2 letras (R) exigen coincidencia exacta para no dar falsos positivos. */
  function usedIn(name) {
    const parts = name.toLowerCase().split("/").map((s) => s.trim()).filter(Boolean);
    return projects.filter((p) => p.stack.some((t) => {
      const st = t.toLowerCase();
      return parts.some((q) => (q.length <= 2 ? st === q : st.includes(q)));
    }));
  }

  const leds = (lv) => Array.from({ length: MAX }, (_, k) => `<i class="led${k < lv ? " is-on" : ""}"></i>`).join("");
  const rowsHtml = groups.map((gr, gi) => `
      <div class="sk-group" data-group="${gi}">
        <p class="label sk-group-name"><span>${esc(gr.group)}</span><span>${pad2(gr.items.length)}</span></p>
        ${gr.items.map(([name, lv]) => `
          <button type="button" class="sk-row" data-name="${esc(name)}" data-level="${lv}" aria-label="${esc(name)}, level ${lv} of ${MAX}">
            <span class="sk-name">${esc(name)}</span>
            <span class="sk-leds" aria-hidden="true">${leds(lv)}</span>
            <span class="sk-lv label" aria-hidden="true">${lv}/${MAX}</span>
          </button>`).join("")}
      </div>`).join("");

  const ghUser = (owner.github.replace(/\/+$/, "").split("/").pop()) || owner.github;

  root.innerHTML = `
    <div class="about">
      <header class="sec-head">
        <p class="label sec-kicker"><span>03 — Profile</span><span>${esc(owner.role)}</span></p>
        <h2 class="sec-word display" aria-label="About me"><span aria-hidden="true">ABOUT</span><sup class="sec-count" aria-hidden="true">(${pad2(groups.length)})</sup></h2>
      </header>

      <div class="ab-grid">
        <div class="ab-side">
          ${owner.photo ? `<figure class="ab-photo" hidden><canvas role="img" aria-label="Portrait of ${esc(owner.name)}"></canvas></figure>` : ""}
        <dl class="ab-facts">
          <div><dt class="label">Name</dt><dd>${esc(owner.name)}</dd></div>
          <div><dt class="label">Role</dt><dd>${esc(owner.role)}</dd></div>
          <div><dt class="label">Location</dt><dd>${esc(owner.location)}</dd></div>
        </dl>
        </div>
        <div class="ab-bio">${owner.bio.map((t) => `<p>${esc(t)}</p>`).join("")}</div>
      </div>

      <div class="sk" aria-labelledby="sk-title">
        <div class="sk-bar">
          <h3 class="label" id="sk-title">Hard skills · level matrix</h3>
          <div class="sk-filters" role="group" aria-label="Filter by group">
            <button type="button" class="sk-tab" data-filter="all" aria-pressed="true">All</button>
            ${groups.map((gr, gi) => `<button type="button" class="sk-tab" data-filter="${gi}" aria-pressed="false">${esc(gr.group)}</button>`).join("")}
          </div>
        </div>
        <div class="sk-body">
          <div class="sk-list">${rowsHtml}</div>
          <aside class="sk-read" aria-live="polite" aria-label="Skill usage across projects">
            <p class="label">Readout</p>
            <div class="sk-read-body"><p class="sk-hint">Hover, focus or tap a skill to see which published projects use it.</p></div>
          </aside>
        </div>
        <p class="label sk-legend"><span><i class="led is-on"></i> level reached</span><span><i class="led"></i> still to reach</span><span>scale 0–${MAX}</span></p>
      </div>

      <a class="gh-block" href="${esc(owner.github)}" target="_blank" rel="noopener" aria-label="GitHub of ${esc(owner.name)} (opens in a new tab)">
        <span class="label">Open source · repositories</span>
        <span class="gh-word display">GitHub ↗</span>
        <span class="gh-user">@${esc(ghUser)}</span>
      </a>
    </div>`;

  /* ---------- Retrato estilizado con el efecto activo ---------- */
  (function portrait() {
    const fig = root.querySelector(".ab-photo");
    if (!fig || !PF.fx) return;
    const cv = fig.querySelector("canvas"), img = new Image();
    let ready = false, lastW = 0;
    const CROP = 0.72; // cabeza y hombros: deja fuera la esquina inferior derecha
    function paint() {
      if (!ready) return;
      const w = Math.round(cv.clientWidth), h = Math.round(cv.clientHeight);
      if (!w || !h) return;
      lastW = w;
      let s = Math.min(window.devicePixelRatio || 1, 2);
      while (s > 1 && w * h * s * s > 2.4e6) s -= 0.25;
      const src = document.createElement("canvas");
      src.width = Math.round(w * s); src.height = Math.round(h * s);
      const g = src.getContext("2d", { willReadFrequently: true });
      const sw = img.naturalWidth, sh = img.naturalHeight * CROP, k = Math.max(src.width / sw, src.height / sh);
      const dw = sw * k, dh = img.naturalHeight * k;
      g.fillStyle = "#fff"; g.fillRect(0, 0, src.width, src.height);
      g.drawImage(img, (src.width - dw) / 2, 0, dw, dh);
      const light = PF.state.theme === "light";
      try {
        const d = g.getImageData(0, 0, src.width, src.height), a = d.data;
        for (let i = 0; i < a.length; i += 4) {
          /* Se separa al sujeto del fondo claro (oscuridad o color de piel) y se respeta la luz natural en cada tema. */
          const L = (a[i] * 0.299 + a[i + 1] * 0.587 + a[i + 2] * 0.114) / 255, sat = (Math.max(a[i], a[i + 1], a[i + 2]) - Math.min(a[i], a[i + 1], a[i + 2])) / 255;
          const m = Math.max(0, Math.min(1, Math.max((1 - L - 0.15) / 0.08, (sat - 0.06) / 0.08)));
          const l = Math.max(0, Math.min(1, (L - 0.05) / 0.75));
          a[i] = a[i + 1] = a[i + 2] = m * (0.2 + 0.8 * (light ? 1 - l : l)) * 255;
        }
        g.putImageData(d, 0, 0);
        const c = PF.colors();
        PF.fx.stylize(src, cv, { mode: PF.state.effect, cell: 6 * PF.state.density * s, ink: c.fg, paper: c.bg, accent: c.accent });
      } catch (e) { fig.hidden = true; }
    }
    let t = 0;
    const later = () => { clearTimeout(t); t = setTimeout(paint, 140); };
    img.onload = () => { ready = true; fig.hidden = false; paint(); };
    img.onerror = () => { fig.hidden = true; };
    img.src = owner.photo;
    PF.on("change", (d) => { if (["effect", "density", "palette", "theme", "*"].includes(d.key)) later(); });
    window.addEventListener("resize", () => { if (Math.abs(cv.clientWidth - lastW) > 2) later(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  })();

  /* ---------- Lectura lateral ---------- */
  const readBody = root.querySelector(".sk-read-body");
  const rows = Array.from(root.querySelectorAll(".sk-row"));
  const show = (row) => {
    rows.forEach((r) => r.classList.toggle("is-active", r === row));
    const name = row.dataset.name, lv = row.dataset.level, list = usedIn(name);
    readBody.innerHTML = `
      <p class="sk-read-name display">${esc(name)}</p>
      <p class="label">Level ${lv} of ${MAX}</p>
      ${list.length
        ? `<p class="sk-count">${list.length} ${list.length === 1 ? "project uses it" : "projects use it"}</p>
           <ul class="sk-used">${list.map((p) => `<li><button type="button" class="sk-proj" data-id="${esc(p.id)}">${esc(p.title)} <span class="label">${p.year}</span></button></li>`).join("")}</ul>`
        : `<p class="sk-count">No published project yet</p>`}`;
  };
  rows.forEach((row) => {
    /* Con táctil solo el clic: si no, el panel cambia de altura antes del clic y el toque cae en otro elemento. */
    row.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(row); });
    row.addEventListener("focus", () => { if (row.matches(":focus-visible")) show(row); });
    row.addEventListener("click", () => show(row));
  });
  readBody.addEventListener("click", (e) => {
    const b = e.target.closest(".sk-proj");
    if (b && PF.detail) {
      const card = document.querySelector('#gallery .gal-link[data-id="' + b.dataset.id + '"]');
      PF.detail.open(b.dataset.id, card || b);
    }
  });

  /* ---------- Filtros ---------- */
  const tabs = Array.from(root.querySelectorAll(".sk-tab"));
  const groupEls = Array.from(root.querySelectorAll(".sk-group"));
  tabs.forEach((t) => t.addEventListener("click", () => {
    const f = t.dataset.filter;
    tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
    groupEls.forEach((g) => { g.hidden = !(f === "all" || g.dataset.group === f); });
    root.querySelector(".sk").classList.toggle("is-filtered", f !== "all");
    if (window.gsap && !PF.reducedMotion) {
      gsap.from(groupEls.filter((g) => !g.hidden), { opacity: 0, y: 10, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "all" });
      lightUp(groupEls.filter((g) => !g.hidden));
    }
  }));

  /* ---------- Encendido de LEDs ---------- */
  function lightUp(scope) {
    const on = [];
    scope.forEach((g) => g.querySelectorAll(".led.is-on").forEach((l) => on.push(l)));
    gsap.fromTo(on, { opacity: 0.15, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.012, clearProps: "opacity,transform" });
  }
  if (window.gsap && !PF.reducedMotion) {
    root.querySelectorAll(".sec-word").forEach((w) => {
      gsap.fromTo(w, { clipPath: "inset(-10% 50% -10% 50%)" }, {
        clipPath: "inset(-10% -3% -10% -3%)", ease: "none",
        scrollTrigger: { trigger: w, start: "top 98%", end: "top 60%", scrub: true }
      });
    });
    ScrollTrigger.create({ trigger: root.querySelector(".sk-list"), start: "top 82%", once: true, onEnter: () => lightUp(groupEls) });
    gsap.from(root.querySelectorAll(".ab-bio p, .ab-facts > div"), {
      opacity: 0, y: 28, duration: 0.9, ease: "power3.out", stagger: 0.1,
      scrollTrigger: { trigger: root.querySelector(".ab-grid"), start: "top 85%", once: true }
    });
  }
})();
