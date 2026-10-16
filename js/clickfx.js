/* ==========================================================================
   EFECTOS DE CLIC sobre el fondo de caracteres.
   Clic en una zona libre de la página (no en enlaces, botones ni tarjetas):
     wave    onda de caracteres (la hace el shader de field.js + un anillo fino)
     detect  caja de detección que se ajusta al punto, con etiqueta y confianza
     burst   nube de puntos estarcidos que sale despedida y se asienta
     cross   mira con coordenadas y líneas que cruzan la pantalla
     mix     alterna los cuatro en cada clic
   Se elige en PF.state.click (Laboratorio → Efecto del clic).
   ========================================================================== */
(function () {
  const PF = window.PF;
  const cv = document.getElementById("clickfx");
  if (!PF || !cv) return;
  const g = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, fx = [], raf = 0, order = 0;
  const KINDS = ["wave", "detect", "burst", "cross"];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); window.addEventListener("resize", size);

  const interactive = "a, button, input, textarea, select, label, summary, [role='button'], [role='menu'], [role='dialog'], .win, .bx, #detail, .g3-card, .g3-li, .dk-card, .idx-row, .sk, .gal-link, canvas#barrel";
  function color(a) { return "rgba(" + PF.hexToRgb(PF.colors().fg).join(",") + "," + a + ")"; }

  /* ---- Efectos ---- */
  const DRAW = {
    wave(f, t) {
      // La onda la dibuja el fondo; aquí solo un anillo muy fino que se apaga rápido.
      const R = ease(t / 1.1) * Math.min(W, H) * 0.34;
      g.strokeStyle = color(0.16 * (1 - t / 1.1)); g.lineWidth = 1;
      g.beginPath(); g.arc(f.x, f.y, R, 0, 6.2832); g.stroke();
      return t < 1.1;
    },
    detect(f, t) {
      const k = ease(t / 0.35), a = t < 1.2 ? 1 : clamp(1 - (t - 1.2) / 0.5);
      const bw = f.bw * (1 + (1 - k) * 1.8), bh = f.bh * (1 + (1 - k) * 1.8), x = f.x - bw / 2, y = f.y - bh / 2, l = 9;
      g.strokeStyle = color(0.9 * a); g.lineWidth = 1.6;
      g.beginPath();
      [[x, y, 1, 1], [x + bw, y, -1, 1], [x, y + bh, 1, -1], [x + bw, y + bh, -1, -1]].forEach(([cx, cy, sx, sy]) => { g.moveTo(cx, cy + sy * l); g.lineTo(cx, cy); g.lineTo(cx + sx * l, cy); });
      g.stroke();
      g.strokeStyle = color(0.35 * a); g.lineWidth = 1; g.strokeRect(x, y, bw, bh);
      g.beginPath(); g.moveTo(f.x - 4, f.y); g.lineTo(f.x + 4, f.y); g.moveTo(f.x, f.y - 4); g.lineTo(f.x, f.y + 4); g.stroke();
      if (k > 0.8) {
        const text = "región " + f.conf; g.font = "500 10px 'JetBrains Mono', ui-monospace, monospace"; g.textBaseline = "middle";
        const tw = Math.ceil(g.measureText(text).width) + 10;
        g.fillStyle = color(0.92 * a); g.fillRect(x, y - 15, tw, 15);
        const bg = PF.colors().bg; g.fillStyle = bg; g.fillText(text, x + 5, y - 7.5);
      }
      return t < 1.7;
    },
    burst(f, t) {
      const a = clamp(1 - (t - 0.9) / 0.9);
      g.fillStyle = color(0.95 * a);
      f.p.forEach((p) => {
        const d = 1 - Math.exp(-p.drag * t), x = f.x + p.vx * d / p.drag, y = f.y + p.vy * d / p.drag;
        const s = p.s * (1 - 0.35 * clamp(t / 1.5));
        g.fillRect(Math.round(x), Math.round(y), s, s);
      });
      return t < 1.8;
    },
    cross(f, t) {
      const k = ease(t / 0.3), a = t < 1.0 ? 1 : clamp(1 - (t - 1.0) / 0.6);
      g.strokeStyle = color(0.55 * a); g.lineWidth = 1; g.setLineDash([2, 5]);
      g.beginPath();
      g.moveTo(f.x - f.x * k, f.y); g.lineTo(f.x + (W - f.x) * k, f.y);
      g.moveTo(f.x, f.y - f.y * k); g.lineTo(f.x, f.y + (H - f.y) * k);
      g.stroke(); g.setLineDash([]);
      g.strokeStyle = color(0.95 * a); g.lineWidth = 1.5;
      const r = 14 + (1 - k) * 18; g.beginPath(); g.arc(f.x, f.y, r, 0, 6.2832); g.stroke();
      g.beginPath(); g.moveTo(f.x - r - 6, f.y); g.lineTo(f.x - r + 6, f.y); g.moveTo(f.x + r - 6, f.y); g.lineTo(f.x + r + 6, f.y);
      g.moveTo(f.x, f.y - r - 6); g.lineTo(f.x, f.y - r + 6); g.moveTo(f.x, f.y + r - 6); g.lineTo(f.x, f.y + r + 6); g.stroke();
      g.font = "500 10px 'JetBrains Mono', ui-monospace, monospace"; g.textBaseline = "middle"; g.fillStyle = color(0.95 * a);
      const right = f.x < W - 130, bot = f.y < H - 40;
      g.textAlign = right ? "left" : "right";
      g.fillText("x:" + String(Math.round(f.x)).padStart(4, "0") + "  y:" + String(Math.round(f.y)).padStart(4, "0"), f.x + (right ? 1 : -1) * (r + 10), f.y + (bot ? 20 : -20));
      g.textAlign = "left";
      return t < 1.6;
    }
  };

  function spawn(kind, x, y) {
    const f = { kind, x, y, t0: performance.now() };
    if (kind === "detect") { f.bw = 92 + Math.random() * 70; f.bh = 58 + Math.random() * 46; f.conf = (0.9 + Math.random() * 0.09).toFixed(2); }
    if (kind === "burst") {
      f.p = Array.from({ length: 70 }, () => { const a = Math.random() * 6.2832, v = 60 + Math.random() * 420; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2.2 + Math.random() * 2.5, s: Math.random() < 0.7 ? 2 : 3 }; });
    }
    if (kind === "wave") PF.field && PF.field.ripple && PF.field.ripple(x, y);
    fx.push(f);
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function loop(now) {
    g.clearRect(0, 0, W, H);
    fx = fx.filter((f) => DRAW[f.kind](f, (now - f.t0) / 1000));
    raf = fx.length ? requestAnimationFrame(loop) : 0;
  }

  window.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || PF.reducedMotion) return;
    const mode = PF.state.click;
    if (mode === "off") return;
    if (e.target.closest && e.target.closest(interactive)) return;
    const kind = mode === "mix" ? KINDS[order++ % KINDS.length] : mode;
    spawn(kind, e.clientX, e.clientY);
  }, { passive: true });

  PF.clickfx = { spawn };
})();
