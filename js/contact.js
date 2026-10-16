/* ==========================================================================
   CONTACTO + FOOTER — secciones #contact y #footer
   No hay backend: por defecto el formulario prepara un correo (mailto) y nunca
   dice "enviado". Si rellenas FORM_ENDPOINT, el envío se hace por fetch.
   ========================================================================== */
const FORM_ENDPOINT = null; // p. ej. "https://formspree.io/f/xxxxxxx"

(function () {
  const PF = window.PF;
  const root = document.getElementById("contact");
  if (!PF || !root) return;
  const owner = PF.config.owner;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MAXMSG = 1500, MINMSG = 20;
  const animate = () => !PF.reducedMotion && !!window.gsap;

  const field = (id, label, type, extra) => `
    <div class="f" data-field="${id}">
      <div class="f-box">
        ${type === "textarea"
          ? `<textarea id="f-${id}" name="${id}" rows="4" placeholder=" " maxlength="${MAXMSG}" aria-describedby="err-${id}" ${extra || ""}></textarea>`
          : `<input id="f-${id}" name="${id}" type="${type}" placeholder=" " aria-describedby="err-${id}" ${extra || ""}>`}
        <label for="f-${id}">${label}</label>
        <span class="f-line" aria-hidden="true"></span>
      </div>
      <p class="f-err" id="err-${id}" aria-live="polite"></p>
      ${type === "textarea" ? `<p class="f-count label" aria-hidden="true"><span data-count>0</span> / ${MAXMSG}</p>` : ""}
    </div>`;

  root.innerHTML = `
    <div class="contact">
      <header class="sec-head">
        <p class="label sec-kicker"><span>04 — Let’s talk</span><span>Reply within a day or two</span></p>
        <h2 class="sec-word display" aria-label="Contact"><span aria-hidden="true">CONTACT</span><sup class="sec-count" aria-hidden="true">(→)</sup></h2>
      </header>

      <div class="ct-grid">
        <div class="ct-mail">
          <p class="label">Direct email</p>
          <p class="ct-email"><span class="ct-email-text" id="ct-email">${esc(owner.email)}</span></p>
          <button type="button" class="btn ct-copy" data-copy="email"><span class="ct-copy-label">Copy</span></button>
          <p class="label ct-note" aria-live="polite" id="ct-copy-note"></p>
        </div>

        <div class="ct-formwrap">
          <form class="cform" novalidate aria-label="Contact form">
            ${field("name", "Name", "text", 'autocomplete="name" required')}
            ${field("email", "Email", "email", 'autocomplete="email" required inputmode="email"')}
            ${field("subject", "Subject (optional)", "text")}
            ${field("message", "Message", "textarea", "required")}
            <div class="cform-foot">
              <button type="submit" class="btn btn-send"><span class="btn-label">Prepare message</span><span class="btn-arrow" aria-hidden="true">→</span></button>
              <p class="label cform-status" role="status" aria-live="polite"></p>
            </div>
          </form>
          <div class="cresult" hidden></div>
        </div>
      </div>
    </div>`;

  /* ---------- Copiar correo ---------- */
  const note = root.querySelector("#ct-copy-note");
  const emailEl = root.querySelector("#ct-email");
  function selectText(el) {
    const r = document.createRange(); r.selectNodeContents(el);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function flashCopied(btn, ok) {
    const l = btn.querySelector(".ct-copy-label") || btn;
    const old = btn.dataset.label || l.textContent;
    btn.dataset.label = old;
    l.textContent = ok ? "Copied" : "Select it and copy";
    btn.classList.toggle("is-ok", ok);
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { l.textContent = old; btn.classList.remove("is-ok"); }, 2200);
  }
  function copy(text, btn, target) {
    const fallback = () => {
      let ok = false;
      if (target) selectText(target);
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      flashCopied(btn, ok);
      note.textContent = ok ? "Copied to clipboard." : "Could not copy automatically: the text is selected, press Ctrl+C.";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        flashCopied(btn, true); note.textContent = "Copied to clipboard.";
      }, fallback);
    } else fallback();
  }
  root.querySelector('[data-copy="email"]').addEventListener("click", (e) => copy(owner.email, e.currentTarget, emailEl));

  /* ---------- Validación ---------- */
  const form = root.querySelector(".cform");
  const result = root.querySelector(".cresult");
  const status = root.querySelector(".cform-status");
  const inputs = { name: form.name, email: form.email, subject: form.subject, message: form.message };
  const RULES = {
    name: (v) => (v.trim().length < 2 ? "Enter your name" : ""),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "That email does not look valid: the @ or the domain is missing"),
    subject: () => "",
    message: (v) => (v.trim().length < MINMSG ? "Tell me a bit more (minimum " + MINMSG + " characters)" : "")
  };
  function validate(key, silent) {
    const el = inputs[key], msg = RULES[key](el.value), box = el.closest(".f"), err = box.querySelector(".f-err");
    if (!silent) {
      err.textContent = msg;
      box.classList.toggle("is-invalid", !!msg);
      if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
      if (msg && animate()) gsap.fromTo(err, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    }
    return !msg;
  }
  const btn = form.querySelector(".btn-send"), btnLabel = btn.querySelector(".btn-label");
  Object.keys(inputs).forEach((k) => {
    const el = inputs[k];
    el.addEventListener("blur", (e) => { if (k !== "subject" && e.relatedTarget !== btn) validate(k); });
    el.addEventListener("input", () => {
      if (el.closest(".f").classList.contains("is-invalid")) validate(k);
      if (k === "message") form.querySelector("[data-count]").textContent = el.value.length;
    });
  });

  /* ---------- Envío ---------- */
  const mailto = (d) => {
    const body = "From: " + d.name + " <" + d.email + ">\n\n" + d.message;
    return "mailto:" + owner.email + "?subject=" + encodeURIComponent(d.subject || "Message from the portfolio") + "&body=" + encodeURIComponent(body);
  };
  const data = () => ({ name: inputs.name.value.trim(), email: inputs.email.value.trim(), subject: inputs.subject.value.trim(), message: inputs.message.value.trim() });

  function showResult(kind, d, errorText) {
    const sent = kind === "sent";
    const text = (d.subject ? "Subject: " + d.subject + "\n" : "") + "From: " + d.name + " <" + d.email + ">\n\n" + d.message;
    result.innerHTML = `
      <p class="label">${sent ? "Status · sent via the form service" : "Status · awaiting your confirmation"}</p>
      <h3 class="display cr-title" tabindex="-1">${sent ? "Message sent" : kind === "error" ? "Could not send" : "Your message is ready"}</h3>
      <p class="cr-text">${sent
        ? "Thanks, " + esc(d.name) + ". I will reply to " + esc(d.email) + "."
        : (kind === "error" ? esc(errorText) + " " : "") + "This site has no server of its own, so the message has not been sent yet. Open it in your email app, or copy it and send it to <strong>" + esc(owner.email) + "</strong>."}</p>
      ${sent ? "" : `<div class="cr-actions">
        <a class="btn" href="${esc(mailto(d))}">Open in your email app <span aria-hidden="true">↗</span></a>
        <button type="button" class="btn" data-copy="msg"><span class="ct-copy-label">Copy message</span></button>
        <button type="button" class="cr-edit" data-edit>Edit message</button>
      </div>
      <label class="label" for="cr-msg">Message text</label>
      <textarea id="cr-msg" class="cr-msg" readonly rows="7">${esc(text)}</textarea>`}`;
    form.hidden = true; result.hidden = false;
    const t = result.querySelector(".cr-title");
    if (animate()) gsap.from(result.children, { opacity: 0, y: 20, duration: 0.6, stagger: 0.07, ease: "power3.out", clearProps: "all" });
    if (t) t.focus({ preventScroll: true });
    const cm = result.querySelector('[data-copy="msg"]');
    if (cm) cm.addEventListener("click", () => copy(text, cm, result.querySelector("#cr-msg")));
    const ed = result.querySelector("[data-edit]");
    if (ed) ed.addEventListener("click", () => { result.hidden = true; form.hidden = false; inputs.message.focus(); });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const keys = Object.keys(inputs);
    const bad = keys.filter((k) => !validate(k));
    if (bad.length) {
      status.textContent = bad.length === 1 ? "Check 1 field." : "Check " + bad.length + " fields.";
      inputs[bad[0]].focus();
      return;
    }
    status.textContent = "";
    const d = data();
    btn.disabled = true; btn.classList.add("is-busy"); btnLabel.textContent = "Preparing…";
    const done = (kind, errText) => {
      btn.disabled = false; btn.classList.remove("is-busy"); btnLabel.textContent = "Prepare message";
      showResult(kind, d, errText);
    };
    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) })
        .then((r) => (r.ok ? done("sent") : done("error", "The service responded with error " + r.status + ".")))
        .catch(() => done("error", "Could not reach the form service."));
    } else {
      setTimeout(() => done("ready"), PF.reducedMotion ? 0 : 700);
    }
  });

  /* ---------- Movimiento de la sección ---------- */
  if (window.gsap && !PF.reducedMotion) {
    root.querySelectorAll(".sec-word").forEach((w) => {
      gsap.fromTo(w, { clipPath: "inset(-10% 50% -10% 50%)" }, {
        clipPath: "inset(-10% -3% -10% -3%)", ease: "none",
        scrollTrigger: { trigger: w, start: "top 98%", end: "top 60%", scrub: true }
      });
    });
    gsap.from(root.querySelectorAll(".ct-mail > *, .f"), {
      opacity: 0, y: 28, duration: 0.8, ease: "power3.out", stagger: 0.08,
      scrollTrigger: { trigger: root.querySelector(".ct-grid"), start: "top 85%", once: true }
    });
  }

  /* ======================================================================
     FOOTER
     ====================================================================== */
  const foot = document.getElementById("footer");
  if (foot) {
    foot.innerHTML = `
      <div class="foot">
        <p>© ${new Date().getFullYear()} ${esc(owner.name)}</p>
        <p>Typefaces: Stamp RSPK Three · JetBrains Mono</p>
        <p>Built with Three.js, GSAP and Lenis</p>
        <p><a href="${esc(owner.github)}" target="_blank" rel="noopener">GitHub ↗</a></p>
        <p><button type="button" class="foot-top">Back to top ↑</button></p>
      </div>`;
    foot.querySelector(".foot-top").addEventListener("click", () => PF.scrollTo(0));
  }
})();
