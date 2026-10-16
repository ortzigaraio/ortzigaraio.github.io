/* ==========================================================================
   SECCIONES NUEVAS: ACHIEVEMENTS (#certs), LIVE DEMO (#demo), TERMINAL (#terminal)
   + PF.roll(scope): cifras que pasan por valores aleatorios y se resuelven.
   + PF.search(q):   BM25 en el navegador sobre el contenido del portfolio.
   Todo se ejecuta en el navegador, sin servidor ni modelos externos.
   ========================================================================== */
(function () {
  const PF = window.PF;
  if (!PF) return;
  const C = PF.config, P = C.projects, owner = C.owner;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad2 = (n) => String(n).padStart(2, "0");
  const head = (word, kicker, hint, count) => `
    <header class="sec-head">
      <p class="label sec-kicker"><span>${kicker}</span><span>${hint}</span></p>
      <h2 class="sec-word display" aria-label="${esc(word)}"><span aria-hidden="true">${word}</span>${count ? `<sup class="sec-count" aria-hidden="true">${count}</sup>` : ""}</h2>
    </header>`;

  /* ======================================================================
     CIFRAS QUE SE RESUELVEN
     ====================================================================== */
  PF.roll = function (scope) {
    if (PF.reducedMotion) return;
    (scope || document).querySelectorAll("[data-roll]").forEach((el) => {
      if (el.__roll) return; el.__roll = true;
      const text = el.textContent, t0 = performance.now(), dur = 700 + text.length * 70;
      (function step(now) {
        const k = Math.min(1, (now - t0) / dur);
        let out = "", seen = 0, total = (text.match(/\d/g) || []).length;
        for (const ch of text) {
          if (/\d/.test(ch)) { out += seen < k * total * 1.2 ? ch : String((Math.random() * 10) | 0); seen++; } else out += ch;
        }
        el.textContent = out;
        if (k < 1) requestAnimationFrame(step); else el.textContent = text;
      })(t0);
    });
  };
  function armRoll() {
    if (PF.reducedMotion || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); PF.roll(e.target.parentNode); } }), { threshold: 0.5 });
    document.querySelectorAll("main [data-roll]").forEach((el) => io.observe(el));
  }

  /* ======================================================================
     BM25 sobre el contenido del portfolio
     ====================================================================== */
  const STOP = new Set("a an the of to in on for and or is are was were be been it its this that these those with as at by from do does did i you he she we they me my your what which who how when where why can could should would will about into than then so if not no tell show give project projects use uses used".split(" "));
  const tok = (s) => (String(s).toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w)).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));

  const chunks = [];
  P.forEach((p) => {
    chunks.push({ pid: p.id, title: p.title, kind: "project", text: p.title + ". " + p.summary });
    chunks.push({ pid: p.id, title: p.title + " · problem", kind: "project", text: p.problem });
    chunks.push({ pid: p.id, title: p.title + " · solution", kind: "project", text: p.solution });
    chunks.push({ pid: p.id, title: p.title + " · stack", kind: "project", text: p.title + " stack: " + p.stack.join(", ") + ". " + p.metrics.map((m) => m[0] + " " + m[1]).join(", ") });
  });
  (owner.bio || []).forEach((b, i) => chunks.push({ title: "About me · " + (i + 1), kind: "bio", text: b }));
  (C.skills || []).forEach((g) => chunks.push({ title: "Skills · " + g.group, kind: "skill", text: g.group + ": " + g.items.map((i) => i[0]).join(", ") }));
  (C.certs || []).forEach((c) => chunks.push({ title: c.title + " · " + c.issuer, kind: "cert", text: c.title + " " + c.kind + " on " + c.issuer + ". " + c.note }));
  const docs = chunks.map((c) => ({ c, t: tok(c.text + " " + c.title) }));
  const N = docs.length, avg = docs.reduce((s, d) => s + d.t.length, 0) / N, df = {};
  docs.forEach((d) => new Set(d.t).forEach((w) => (df[w] = (df[w] || 0) + 1)));
  PF.search = function (q, k) {
    const qt = Array.from(new Set(tok(q))), out = [];
    docs.forEach((d) => {
      const tf = {}; d.t.forEach((w) => (tf[w] = (tf[w] || 0) + 1));
      let s = 0; const hit = [];
      qt.forEach((w) => {
        if (!tf[w]) return;
        const idf = Math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5));
        s += idf * (tf[w] * 2.2) / (tf[w] + 1.2 * (0.25 + 0.75 * d.t.length / avg)); hit.push(w);
      });
      if (s > 0) out.push({ c: d.c, score: s, hit });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, k || 3);
  };
  const highlight = (text, words) => {
    if (!words.length) return esc(text);
    return esc(text).replace(/[A-Za-z0-9]+/g, (m) => { const t = tok(m)[0]; return t && words.includes(t) ? "<mark>" + m + "</mark>" : m; });
  };

  /* ======================================================================
     ACHIEVEMENTS
     ====================================================================== */
  const certsRoot = document.getElementById("certs");
  if (certsRoot) {
    const certs = C.certs || [];
    const using = (name) => P.filter((p) => p.stack.some((s) => s.toLowerCase().includes(name.toLowerCase())));
    certsRoot.innerHTML = head("ACHIEVEMENTS", "04 — Learning", "Certificates and courses", "(" + pad2(certs.length) + ")") + `
      <ul class="ct-grid">${certs.map((c, i) => {
        const u = using(c.title);
        return `<li class="ct-card">
          <p class="label ct-top"><span>${pad2(i + 1)}</span><span>${esc(c.issuer)} · ${esc(c.kind)}</span></p>
          <h3 class="ct-title display">${esc(c.title)}</h3>
          <p class="ct-note">${esc(c.note)}</p>
          <p class="label ct-use">${u.length ? "Used in " + u.map((p) => esc(p.title)).join(" · ") : "Next: apply it in a project"}</p>
        </li>`;
      }).join("")}</ul>`;
  }

  /* ======================================================================
     LIVE DEMO — router Naive Bayes + recuperación BM25
     ====================================================================== */
  const TRAIN = {
    DOCS: ["what does article 14 say about maternity leave", "summarise the collective agreement", "what does the law say about data protection", "which clause covers termination", "explain the regulation on working hours", "where is the definition of private security services", "what are the obligations of the employer in the statute", "quote the paragraph about overtime", "what is the purpose of the law", "which document mentions cybersecurity", "read the contract and tell me the notice period", "what does the constitution guarantee"],
    DATA: ["how many vacation days does adrian have left", "who is the hr manager", "list employees in the madrid office", "what is the average salary by department", "how many people joined in 2025", "show the headcount per team", "who has the most overtime hours", "total number of open positions", "what is maria start date", "count the employees older than 40", "which employee earns the most", "sum of sick days this month"],
    CHAT: ["hello", "hi there", "thanks a lot", "good morning", "who are you", "what can you do", "how are you", "goodbye", "help me", "thank you", "nice to meet you", "tell me a joke"]
  };
  const ROUTE = {
    DOCS: ["RAG route", "Hybrid search (BM25 + vectors), cross-encoder re-ranking, then the LLM answers with the retrieved passages."],
    DATA: ["DATA route", "The question is about records: the real project runs a Pandas query on a CSV instead of searching documents."],
    CHAT: ["Direct answer", "No retrieval needed: the assistant answers from the conversation."]
  };
  const nb = (function () {
    const classes = Object.keys(TRAIN), cnt = {}, tot = {}, vocab = new Set();
    classes.forEach((c) => { cnt[c] = {}; tot[c] = 0; TRAIN[c].forEach((s) => tok(s + " ").concat(s.toLowerCase().match(/[a-z0-9]+/g) || []).forEach((w) => { cnt[c][w] = (cnt[c][w] || 0) + 1; tot[c]++; vocab.add(w); })); });
    const V = vocab.size;
    const lp = (c, w) => Math.log(((cnt[c][w] || 0) + 1) / (tot[c] + V));
    return {
      classify(q) {
        const ws = (q.toLowerCase().match(/[a-z0-9]+/g) || []);
        const score = {}; classes.forEach((c) => { score[c] = Math.log(1 / classes.length); ws.forEach((w) => { score[c] += lp(c, w); }); });
        const m = Math.max.apply(null, classes.map((c) => score[c])), ex = classes.map((c) => Math.exp(score[c] - m)), z = ex.reduce((a, b) => a + b, 0);
        const prob = {}; classes.forEach((c, i) => (prob[c] = ex[i] / z));
        const best = classes.slice().sort((a, b) => prob[b] - prob[a])[0];
        const why = ws.map((w) => ({ w, d: lp(best, w) - Math.max.apply(null, classes.filter((c) => c !== best).map((c) => lp(c, w))) })).filter((o) => o.d > 0.35).map((o) => o.w);
        return { prob, best, why, n: TRAIN.DOCS.length + TRAIN.DATA.length + TRAIN.CHAT.length };
      }
    };
  })();

  const demoRoot = document.getElementById("demo");
  if (demoRoot) {
    const EX = ["What does article 14 say about maternity leave?", "How many vacation days does Adrian have left?", "Thanks, who are you?", "Which project uses n8n and Supabase?"];
    demoRoot.innerHTML = head("LIVE DEMO", "05 — Runs in your browser", "Intent router + retrieval", "") + `
      <div class="dm">
        <form class="dm-in" onsubmit="return false">
          <label class="label" for="dm-q">Ask something</label>
          <input id="dm-q" type="text" autocomplete="off" spellcheck="false" value="${esc(EX[0])}">
          <div class="dm-ex">${EX.map((e) => `<button type="button" class="dm-chip" data-q="${esc(e)}">${esc(e)}</button>`).join("")}</div>
        </form>
        <div class="dm-out" aria-live="polite">
          <div class="dm-col">
            <p class="label">1 · Intent router (Naive Bayes, ${nb.classify("x").n} training sentences)</p>
            <div class="dm-bars"></div>
            <p class="dm-route"></p>
          </div>
          <div class="dm-col">
            <p class="label">2 · Retrieval (BM25 over this portfolio, ${N} passages)</p>
            <ol class="dm-hits"></ol>
          </div>
        </div>
        <p class="dm-note">Both steps run on your device: no server and no model download. The real RAG BOE project routes with an LLM and re-ranks with a cross-encoder; this is the same idea in miniature.</p>
      </div>`;
    const q = demoRoot.querySelector("#dm-q"), bars = demoRoot.querySelector(".dm-bars"), routeEl = demoRoot.querySelector(".dm-route"), hitsEl = demoRoot.querySelector(".dm-hits");
    function run() {
      const text = q.value.trim();
      if (!text) { bars.innerHTML = ""; routeEl.textContent = "Type a question."; hitsEl.innerHTML = ""; return; }
      const r = nb.classify(text);
      bars.innerHTML = Object.keys(r.prob).sort((a, b) => r.prob[b] - r.prob[a]).map((c) => `<div class="dm-bar${c === r.best ? " is-best" : ""}"><span class="label">${c}</span><i style="--w:${(r.prob[c] * 100).toFixed(1)}%"></i><b>${(r.prob[c] * 100).toFixed(0)}%</b></div>`).join("");
      const rt = ROUTE[r.best];
      routeEl.innerHTML = `<strong>${rt[0]}</strong> — ${rt[1]}${r.why.length ? `<br><span class="label">Decisive words: ${r.why.map(esc).join(", ")}</span>` : ""}`;
      const hits = PF.search(text, 3);
      hitsEl.innerHTML = hits.length ? hits.map((h) => `<li><p class="label"><span>${esc(h.c.title)}</span><span>score ${h.score.toFixed(2)}</span></p><p>${highlight(h.c.text.length > 190 ? h.c.text.slice(0, 187) + "…" : h.c.text, h.hit)}</p></li>`).join("") : "<li><p class=\"label\">No passage matches these words.</p></li>";
    }
    q.addEventListener("input", run);
    demoRoot.querySelectorAll(".dm-chip").forEach((b) => b.addEventListener("click", () => { q.value = b.dataset.q; run(); }));
    run();
  }

  /* ======================================================================
     TERMINAL
     ====================================================================== */
  const termRoot = document.getElementById("terminal");
  if (termRoot) {
    termRoot.innerHTML = head("TERMINAL", "06 — Ask me anything", "Type help", "") + `
      <div class="tm" role="region" aria-label="Interactive terminal">
        <div class="tm-out" aria-live="polite"></div>
        <form class="tm-form" autocomplete="off"><label class="tm-p" for="tm-in">visitor@ortzi:~$</label><input id="tm-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false"></form>
      </div>`;
    const out = termRoot.querySelector(".tm-out"), form = termRoot.querySelector(".tm-form"), inp = termRoot.querySelector("#tm-in");
    const hist = []; let hi = 0;
    const line = (html, cls) => { const d = document.createElement("div"); d.className = "tm-l" + (cls ? " " + cls : ""); d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; return d; };
    const find = (s) => { s = String(s || "").toLowerCase(); return P.find((p) => p.id === s || p.title.toLowerCase() === s) || P.find((p) => p.id.includes(s) || p.title.toLowerCase().includes(s)); };
    const plink = (p) => `<a href="#" class="tm-a" data-open="${esc(p.id)}">${esc(p.title)}</a>`;
    const go = (sel) => { const el = document.querySelector(sel); if (el) PF.scrollTo(el); };
    const CMDS = {
      help() { line(["help", "about", "whoami", "projects", "open &lt;project&gt;", "skills [group]", "stack", "certs", "contact", "github", "ask &lt;question&gt;", "goto &lt;work|about|demo|contact&gt;", "theme &lt;dark|light&gt;", "effect &lt;ascii|braille|dither|halftone|led|raw&gt;", "intro &lt;orb|barrel&gt;", "clear"].map((c) => "  " + c).join("<br>")); },
      about() { (owner.bio || []).forEach((b) => line(esc(b))); },
      whoami() { line(esc(owner.name) + " — " + esc(owner.role) + " · " + esc(owner.location)); },
      ls() { CMDS.projects(); },
      projects() { P.forEach((p, i) => line(pad2(i + 1) + "  " + plink(p) + "  <span class=\"tm-d\">" + p.year + " · " + esc(p.role) + "</span>")); line("<span class=\"tm-d\">open &lt;name&gt; shows the details.</span>"); },
      open(a) { const p = find(a); if (!p) return line("No project matches “" + esc(a || "") + "”. Try <b>projects</b>.", "tm-e"); line("Opening " + esc(p.title) + "…"); PF.detail && PF.detail.open(p.id, null); },
      skills(a) { const gs = (C.skills || []).filter((g) => !a || g.group.toLowerCase().includes(a.toLowerCase())); if (!gs.length) return line("No skill group matches.", "tm-e"); gs.forEach((g) => line("<b>" + esc(g.group) + "</b><br>" + g.items.map((i) => "  " + esc(i[0]).padEnd(22, " ") + "●".repeat(i[1]) + "○".repeat(5 - i[1])).join("<br>"))); },
      stack() { const c = {}; P.forEach((p) => p.stack.forEach((s) => (c[s] = (c[s] || 0) + 1))); line(Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 18).map((s) => esc(s) + (c[s] > 1 ? " ×" + c[s] : "")).join(" · ")); },
      certs() { (C.certs || []).forEach((c) => line(esc(c.title) + "  <span class=\"tm-d\">" + esc(c.issuer) + " · " + esc(c.kind) + "</span>")); },
      contact() { line("email   <a class=\"tm-a\" href=\"mailto:" + esc(owner.email) + "\">" + esc(owner.email) + "</a><br>github  <a class=\"tm-a\" href=\"" + esc(owner.github) + "\" target=\"_blank\" rel=\"noopener\">" + esc(owner.github.replace(/^https?:\/\//, "")) + "</a>"); },
      github() { line("<a class=\"tm-a\" href=\"" + esc(owner.github) + "\" target=\"_blank\" rel=\"noopener\">" + esc(owner.github) + "</a>"); },
      ask(a) {
        if (!a) return line("Usage: ask &lt;question&gt;, e.g. <b>ask which project uses n8n</b>", "tm-e");
        const r = PF.search(a, 2); if (!r.length) return line("Nothing in this portfolio matches that. Try other words.", "tm-e");
        r.forEach((h) => line("<span class=\"tm-d\">" + esc(h.c.title) + " · " + h.score.toFixed(2) + "</span><br>" + highlight(h.c.text, h.hit)));
        const pid = r[0].c.pid; if (pid) { const p = find(pid); line("<span class=\"tm-d\">open it:</span> " + plink(p)); }
      },
      goto(a) { const m = { work: "#work-index", gallery: "#gallery", about: "#about", achievements: "#certs", certs: "#certs", demo: "#demo", terminal: "#terminal", contact: "#contact", top: "#top" }[String(a || "").toLowerCase()]; if (!m) return line("goto &lt;work|gallery|about|certs|demo|contact|top&gt;", "tm-e"); go(m); line("Scrolling to " + esc(a) + "…"); },
      theme(a) { if (a !== "dark" && a !== "light") return line("theme &lt;dark|light&gt;", "tm-e"); PF.set("theme", a); line("Theme: " + a); },
      effect(a) { if (!C.effects[a]) return line("effect &lt;" + Object.keys(C.effects).join("|") + "&gt;", "tm-e"); PF.set("effect", a); line("Effect: " + a); },
      intro(a) { if (a !== "orb" && a !== "barrel") return line("intro &lt;orb|barrel&gt;", "tm-e"); PF.set("hero", a); line("Intro: " + a + ". Scroll to the top to see it."); },
      clear() { out.innerHTML = ""; },
      sudo() { line("Nice try. This account has no sudo, only curiosity.", "tm-e"); },
      barrel() { CMDS.intro("barrel"); }
    };
    const run = (raw) => {
      line("<span class=\"tm-p\">visitor@ortzi:~$</span> " + esc(raw), "tm-cmd");
      const m = raw.trim().match(/^(\S+)\s*(.*)$/); if (!m) return;
      const fn = CMDS[m[1].toLowerCase()];
      if (!fn) { line("command not found: " + esc(m[1]) + ". Type <b>help</b>.", "tm-e"); return; }
      fn(m[2].trim());
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); const v = inp.value; if (!v.trim()) return; hist.push(v); hi = hist.length; run(v); inp.value = ""; });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); if (hi > 0) inp.value = hist[--hi]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); inp.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ""); }
      else if (e.key === "Tab") {
        e.preventDefault(); const v = inp.value, parts = v.split(/\s+/);
        if (parts.length === 1) { const c = Object.keys(CMDS).filter((k) => k.startsWith(parts[0].toLowerCase())); if (c.length === 1) inp.value = c[0] + " "; }
        else if (/^open$/i.test(parts[0])) { const c = P.filter((p) => p.id.startsWith(parts[1].toLowerCase())); if (c.length === 1) inp.value = "open " + c[0].id; }
      }
    });
    out.addEventListener("click", (e) => { const a = e.target.closest("[data-open]"); if (a) { e.preventDefault(); PF.detail && PF.detail.open(a.dataset.open, a); } });
    termRoot.querySelector(".tm").addEventListener("click", (e) => { if (!e.target.closest("a")) inp.focus({ preventScroll: true }); });
    line("Welcome. Type <b>help</b> to see the commands, or try <b>ask which project uses n8n</b>.", "tm-d");
  }

  if (document.readyState === "complete") armRoll(); else window.addEventListener("load", armRoll);
})();
