/* ==========================================================================
   ESCENAS TEMÁTICAS — imágenes procedurales con sentido para cada proyecto
   (documento y tabla del BOE, chat de WhatsApp, setas detectadas, anuncios con
   descuento, mapa de Euskadi, radar de evaluación...). Se dibujan en escala de
   grises y gallery.js las pasa por PF.fx.stylize.

   PF.scenes.get(id) -> función (g, w, h, r, u) o null
     id = "<proyecto>"            primera escena del proyecto (portada)
     id = "<proyecto>-<n>"        escena n-ésima (capturas / galería 3D)
     id = "<proyecto>~<algo>"     el sufijo se ignora (variante de imagen real)
   ========================================================================== */
(function () {
  const PF = (window.PF = window.PF || {});
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const gr = (v) => { v = clamp(v | 0, 0, 255); return "rgb(" + v + "," + v + "," + v + ")"; };
  const line = (g, x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
  const dot = (g, x, y, rad) => { g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); };
  const rrect = (g, x, y, w, h, rad) => {
    rad = Math.min(rad, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + w, y, x + w, y + h, rad); g.arcTo(x + w, y + h, x, y + h, rad);
    g.arcTo(x, y + h, x, y, rad); g.arcTo(x, y, x + w, y, rad); g.closePath();
  };
  const mono = (g, px, wt) => { g.font = (wt || 600) + " " + Math.round(px) + "px 'JetBrains Mono', ui-monospace, monospace"; g.textBaseline = "middle"; };

  /* ---------- RAG BOE ---------- */
  function ragDoc(g, w, h, r, u) {
    const m = w * 0.1;
    g.fillStyle = gr(235); g.fillRect(m, m, w * 0.46, h * 0.055);
    mono(g, h * 0.04); g.fillStyle = gr(190); g.textAlign = "right"; g.fillText("§ " + (10 + Math.floor(r() * 80)), w - m, m + h * 0.027);
    g.textAlign = "left";
    for (let i = 0; i < 12; i++) { g.fillStyle = gr(80 + r() * 60); g.fillRect(m, m + h * 0.1 + i * h * 0.038, (w - 2 * m) * (0.55 + 0.45 * r()), h * 0.016); }
    const ty = h * 0.6, cols = 4, rows = 4, cw = (w - 2 * m) / cols, rh = h * 0.075;
    g.strokeStyle = gr(210); g.lineWidth = 2 * u;
    for (let i = 0; i <= rows; i++) line(g, m, ty + i * rh, w - m, ty + i * rh);
    for (let j = 0; j <= cols; j++) line(g, m + j * cw, ty, m + j * cw, ty + rows * rh);
    g.fillStyle = gr(255); g.fillRect(m + cw, ty + rh * 2, cw, rh);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { if (i === 2 && j === 1) continue; g.fillStyle = gr(110); g.fillRect(m + j * cw + cw * 0.15, ty + i * rh + rh * 0.4, cw * (0.3 + 0.4 * r()), rh * 0.2); }
  }
  function ragChunks(g, w, h, r, u) {
    const qx = w * 0.5, qy = h * 0.5;
    const cl = [[0.25, 0.28, 235], [0.76, 0.3, 160], [0.3, 0.74, 200], [0.74, 0.72, 120]];
    cl.forEach(([cx, cy, tone], k) => {
      for (let i = 0; i < 6; i++) {
        const x = cx * w + (r() - 0.5) * w * 0.28, y = cy * h + (r() - 0.5) * h * 0.24, bw = w * (0.1 + 0.08 * r()), bh = h * 0.05;
        g.fillStyle = gr(tone - r() * 40); g.fillRect(x - bw / 2, y - bh / 2, bw, bh);
        if (k === 0 && i < 3) { g.strokeStyle = gr(255); g.lineWidth = 2.4 * u; line(g, qx, qy, x, y); }
      }
    });
    g.strokeStyle = gr(255); g.lineWidth = 3 * u; g.beginPath(); g.arc(qx, qy, w * 0.07, 0, TAU); g.stroke();
    g.fillStyle = gr(255); dot(g, qx, qy, w * 0.025);
  }

  /* ---------- WhatsApp RAG ---------- */
  function waChat(g, w, h, r, u) {
    const m = w * 0.08; let y = m;
    for (let i = 0; i < 7 && y < h - m * 1.5; i++) {
      const me = i % 2 === 0, bw = w * (0.35 + 0.3 * r()), bh = h * (0.08 + 0.07 * r()), x = me ? w - m - bw : m;
      if (me) { g.fillStyle = gr(225); rrect(g, x, y, bw, bh, h * 0.03); g.fill(); g.fillStyle = gr(60); }
      else { g.strokeStyle = gr(200); g.lineWidth = 2.4 * u; rrect(g, x, y, bw, bh, h * 0.03); g.stroke(); g.fillStyle = gr(190); }
      const lines = Math.max(1, Math.round(bh / (h * 0.04)));
      for (let k = 0; k < lines; k++) g.fillRect(x + bw * 0.1, y + bh * 0.2 + k * h * 0.035, bw * (k === lines - 1 ? 0.4 : 0.75), h * 0.014);
      y += bh + h * 0.035;
    }
  }
  function waFlow(g, w, h, r, u) {
    const node = (x, y, s, tone) => { g.fillStyle = gr(tone); rrect(g, x - s, y - s * 0.6, s * 2, s * 1.2, s * 0.25); g.fill(); g.fillStyle = gr(30); dot(g, x - s * 0.55, y, s * 0.2); };
    const s = w * 0.07, ys = [0.2, 0.5, 0.8];
    g.strokeStyle = gr(190); g.lineWidth = 2.4 * u;
    const xs = [0.12, 0.32, 0.52, 0.74, 0.92];
    line(g, xs[0] * w, h * 0.5, xs[1] * w, h * 0.5); line(g, xs[1] * w, h * 0.5, xs[2] * w, h * 0.5);
    ys.forEach((yy) => { g.beginPath(); g.moveTo(xs[2] * w, h * 0.5); g.bezierCurveTo(xs[2] * w + w * 0.1, h * 0.5, xs[3] * w - w * 0.1, yy * h, xs[3] * w, yy * h); g.stroke(); line(g, xs[3] * w, yy * h, xs[4] * w, yy * h); });
    node(xs[0] * w, h * 0.5, s, 255); node(xs[1] * w, h * 0.5, s, 200);
    g.fillStyle = gr(255); g.beginPath(); g.moveTo(xs[2] * w, h * 0.5 - s); g.lineTo(xs[2] * w + s, h * 0.5); g.lineTo(xs[2] * w, h * 0.5 + s); g.lineTo(xs[2] * w - s, h * 0.5); g.closePath(); g.fill();
    ys.forEach((yy, i) => { node(xs[3] * w, yy * h, s * 0.8, 170 + i * 25); node(xs[4] * w - s * 0.2, yy * h, s * 0.6, 120); });
  }

  /* ---------- YOLO Mushrooms ---------- */
  function mush(g, x, y, s, tone, r) {
    g.fillStyle = gr(tone * 0.8); g.beginPath(); g.moveTo(x - s * 0.12, y); g.lineTo(x - s * 0.09, y + s * 0.55); g.lineTo(x + s * 0.09, y + s * 0.55); g.lineTo(x + s * 0.12, y); g.fill();
    g.fillStyle = gr(tone); g.beginPath(); g.ellipse(x, y, s * 0.5, s * 0.36, 0, Math.PI, TAU); g.fill();
    g.fillStyle = gr(tone * 0.45); g.beginPath(); g.ellipse(x, y, s * 0.5, s * 0.07, 0, 0, TAU); g.fill();
    g.fillStyle = gr(Math.min(255, tone + 30)); for (let i = 0; i < 4; i++) dot(g, x + (r() - 0.5) * s * 0.6, y - s * (0.08 + 0.2 * r()), s * 0.025);
  }
  function box(g, x0, y0, x1, y1, u, thick, label) {
    g.lineWidth = (thick ? 4 : 2.4) * u; g.strokeStyle = gr(255); g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = gr(255); g.fillRect(x0, y0 - 14 * u, Math.min(x1 - x0, 46 * u), 14 * u);
    if (label) { mono(g, 9 * u, 700); g.fillStyle = gr(20); g.textAlign = "left"; g.fillText(label, x0 + 3 * u, y0 - 6.5 * u); }
  }
  function yoloField(g, w, h, r, u) {
    g.fillStyle = gr(26); g.fillRect(0, h * 0.78, w, h * 0.22);
    const n = 5, bad = Math.floor(r() * n);
    for (let i = 0; i < n; i++) {
      const x = w * (0.14 + (i * 0.72) / (n - 1)) + (r() - 0.5) * w * 0.05, y = h * (0.5 + (r() - 0.5) * 0.14), s = w * (0.18 + r() * 0.1);
      mush(g, x, y, s, i === bad ? 255 : 150 + r() * 60, r);
      box(g, x - s * 0.55, y - s * 0.4, x + s * 0.55, y + s * 0.6, u, i === bad, (i === bad ? "deadly " : "edible ") + (0.88 + r() * 0.1).toFixed(2));
    }
  }
  function yoloMacro(g, w, h, r, u) {
    const cx = w * 0.5, cy = h * 0.42;
    for (let i = 14; i >= 1; i--) { g.strokeStyle = gr(60 + i * 12); g.lineWidth = 2 * u; g.beginPath(); g.ellipse(cx, cy, w * 0.04 * i, h * 0.026 * i, 0, 0, TAU); g.stroke(); }
    g.fillStyle = gr(210); g.beginPath(); g.moveTo(cx - w * 0.07, cy + h * 0.2); g.lineTo(cx - w * 0.05, h * 0.95); g.lineTo(cx + w * 0.05, h * 0.95); g.lineTo(cx + w * 0.07, cy + h * 0.2); g.fill();
    box(g, w * 0.1, h * 0.06, w * 0.9, h * 0.95, u, true, "Amanita " + (0.9 + r() * 0.09).toFixed(2));
  }

  /* ---------- Mapa (Horain / YOLO) ---------- */
  function mapScene(g, w, h, r, u) {
    const cx = w * 0.5, cy = h * 0.52, pts = [];
    for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU, rr = 0.34 + 0.12 * Math.sin(a * 3 + 1) + 0.06 * Math.cos(a * 5); pts.push([cx + Math.cos(a) * rr * w * 1.1, cy + Math.sin(a) * rr * h * 0.95]); }
    g.fillStyle = gr(48); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
    g.strokeStyle = gr(210); g.lineWidth = 3 * u; g.stroke();
    g.strokeStyle = gr(80); g.lineWidth = 1.5 * u;
    for (let i = 0; i < 9; i++) { const y = h * (0.15 + i * 0.09); line(g, w * 0.08, y, w * 0.92, y + (r() - 0.5) * h * 0.04); }
    for (let i = 0; i < 24; i++) {
      const a = r() * TAU, rr = Math.sqrt(r()) * 0.34, x = cx + Math.cos(a) * rr * w, y = cy + Math.sin(a) * rr * h * 0.85;
      g.fillStyle = gr(235); g.fillRect(x - 4 * u, y - 4 * u, 8 * u, 8 * u);
      if (i % 7 === 0) { g.strokeStyle = gr(255); g.lineWidth = 2 * u; g.beginPath(); g.arc(x, y, 14 * u, 0, TAU); g.stroke(); }
    }
  }

  /* ---------- Wallapop Bot ---------- */
  function wallaGrid(g, w, h, r, u) {
    const m = w * 0.07, cols = 3, rows = 2, gap = w * 0.03, cw = (w - 2 * m - gap * (cols - 1)) / cols, ch = (h - 2 * m - gap) / rows;
    const hot = Math.floor(r() * 6);
    for (let i = 0; i < 6; i++) {
      const x = m + (i % cols) * (cw + gap), y = m + Math.floor(i / cols) * (ch + gap);
      g.strokeStyle = gr(i === hot ? 255 : 120); g.lineWidth = (i === hot ? 4 : 2) * u; g.strokeRect(x, y, cw, ch);
      g.fillStyle = gr(70 + r() * 80); g.fillRect(x + cw * 0.08, y + ch * 0.08, cw * 0.84, ch * 0.52);
      g.fillStyle = gr(i === hot ? 255 : 170); g.fillRect(x + cw * 0.08, y + ch * 0.7, cw * 0.4, ch * 0.1);
      g.fillStyle = gr(110); g.fillRect(x + cw * 0.08, y + ch * 0.85, cw * 0.65, ch * 0.05);
      if (i === hot) { g.fillStyle = gr(255); dot(g, x + cw * 0.86, y + ch * 0.12, cw * 0.17); mono(g, cw * 0.15, 800); g.textAlign = "center"; g.fillStyle = gr(10); g.fillText("-32%", x + cw * 0.86, y + ch * 0.12); }
    }
  }
  function wallaHist(g, w, h, r, u) {
    const m = w * 0.1, n = 22, bw = (w - 2 * m) / n;
    for (let i = 0; i < n; i++) {
      const t = (i - n * 0.55) / (n * 0.2), v = Math.exp(-t * t) * (0.9 + 0.2 * r()), bh = v * (h - 2 * m) * 0.85;
      g.fillStyle = gr(i < n * 0.3 ? 255 : 140); g.fillRect(m + i * bw + 2 * u, h - m - bh, bw - 4 * u, bh);
    }
    g.strokeStyle = gr(255); g.lineWidth = 3 * u; g.setLineDash([10 * u, 7 * u]); line(g, m + n * 0.55 * bw, m, m + n * 0.55 * bw, h - m);
    g.setLineDash([]); line(g, m + n * 0.3 * bw, m, m + n * 0.3 * bw, h - m);
    g.beginPath(); g.moveTo(m, h - m); g.lineTo(w - m, h - m); g.stroke();
  }
  function wallaAlert(g, w, h, r, u) {
    const m = w * 0.09;
    for (let i = 0; i < 3; i++) {
      const y = m + i * h * 0.3, bh = h * 0.24, x = m + i * w * 0.03;
      g.strokeStyle = gr(i === 0 ? 255 : 150); g.lineWidth = (i === 0 ? 4 : 2.4) * u; rrect(g, x, y, w - 2 * m - w * 0.06, bh, h * 0.03); g.stroke();
      g.fillStyle = gr(i === 0 ? 255 : 150); dot(g, x + bh * 0.5, y + bh * 0.5, bh * 0.22);
      g.fillRect(x + bh * 0.95, y + bh * 0.28, (w - 2 * m) * 0.5, bh * 0.14); g.fillStyle = gr(100); g.fillRect(x + bh * 0.95, y + bh * 0.56, (w - 2 * m) * 0.36, bh * 0.1);
    }
  }

  /* ---------- Horain ---------- */
  function horainTimer(g, w, h, r, u) {
    const cx = w * 0.5, cy = h * 0.48, rad = Math.min(w, h) * 0.3;
    g.strokeStyle = gr(70); g.lineWidth = 12 * u; g.beginPath(); g.arc(cx, cy, rad, 0, TAU); g.stroke();
    g.strokeStyle = gr(255); g.beginPath(); g.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + TAU * 0.72); g.stroke();
    mono(g, rad * 0.5, 800); g.textAlign = "center"; g.fillStyle = gr(255); g.fillText("11:24", cx, cy);
    mono(g, h * 0.045, 600); g.fillStyle = gr(170); g.fillText("BOOKING · 15 MIN", cx, cy + rad * 1.55);
    for (let i = 0; i < 3; i++) { g.fillStyle = gr(90 + i * 40); g.fillRect(w * (0.1 + i * 0.3), h * 0.9, w * 0.24, h * 0.04); }
  }

  /* ---------- Dither ---------- */
  function ditherHalftone(g, w, h, r, u) {
    const s = Math.min(w, h) * 0.04, cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.42;
    for (let y = s / 2; y < h; y += s) for (let x = s / 2; x < w; x += s) {
      const d = Math.hypot(x - cx, y - cy) / R, k = d < 1 ? Math.sqrt(1 - d * d) : 0.08;
      g.fillStyle = gr(255); dot(g, x, y, s * 0.52 * clamp(k, 0, 1));
    }
  }
  function ditherType(g, w, h, r, u) {
    const rows = 14, fs = h / rows * 0.95, cols = Math.floor(w / (fs * 0.6)); mono(g, fs, 700); g.textAlign = "left";
    const ramp = " .:-=+*#%@";
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v = 0.5 + 0.5 * Math.sin(i * 0.3 + j * 0.15) * Math.cos(j * 0.4 - i * 0.05) + (r() - 0.5) * 0.15;
      g.fillStyle = gr(255); g.fillText(ramp[clamp(Math.floor(v * ramp.length), 0, ramp.length - 1)], i * fs * 0.6, (j + 0.5) * (h / rows));
    }
  }

  /* ---------- IA PDF Creator ---------- */
  function pdfRadar(g, w, h, r, u) {
    const cx = w * 0.5, cy = h * 0.5, R = Math.min(w, h) * 0.38, n = 7;
    g.strokeStyle = gr(90); g.lineWidth = 2 * u;
    for (let k = 1; k <= 4; k++) { g.beginPath(); for (let i = 0; i < n; i++) { const a = (i / n) * TAU - Math.PI / 2; g.lineTo(cx + Math.cos(a) * R * k / 4, cy + Math.sin(a) * R * k / 4); } g.closePath(); g.stroke(); }
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU - Math.PI / 2; line(g, cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R); }
    [[0.62, 140, false], [0.9, 255, true]].forEach(([base, tone, fill], idx) => {
      g.beginPath();
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU - Math.PI / 2, v = clamp(base - 0.35 * r() + (idx ? 0.05 : 0), 0.25, 1); g.lineTo(cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v); }
      g.closePath(); if (fill) { g.fillStyle = "rgba(255,255,255,0.35)"; g.fill(); } g.strokeStyle = gr(tone); g.lineWidth = 3.5 * u; g.stroke();
    });
  }
  function pdfReport(g, w, h, r, u) {
    const m = w * 0.1;
    g.fillStyle = gr(235); g.fillRect(m, m, w * 0.5, h * 0.06);
    g.fillStyle = gr(130); g.fillRect(m, m + h * 0.09, w * 0.3, h * 0.025);
    for (let i = 0; i < 6; i++) { const bw = (w - 2 * m) * (0.3 + 0.7 * r()); g.fillStyle = gr(i === 0 ? 255 : 150); g.fillRect(m, h * 0.3 + i * h * 0.07, bw, h * 0.04); g.fillStyle = gr(80); g.fillRect(m + bw + 6 * u, h * 0.3 + i * h * 0.07 + h * 0.012, 18 * u, h * 0.016); }
    for (let i = 0; i < 4; i++) { g.fillStyle = gr(90 + r() * 40); g.fillRect(m, h * 0.76 + i * h * 0.05, (w - 2 * m) * (0.6 + 0.4 * r()), h * 0.016); }
  }

  const LIST = {
    "rag-boe": [ragDoc, ragChunks],
    "whatsapp-rag": [waChat, waFlow],
    "yolo-mushrooms": [yoloField, yoloMacro, mapScene],
    "wallapop-bot": [wallaGrid, wallaHist, wallaAlert],
    "horain": [mapScene, horainTimer],
    "dither": [ditherHalftone, ditherType],
    "pdf-creator": [pdfRadar, pdfReport]
  };

  PF.scenes = {
    count: (pid) => (LIST[pid] || []).length,
    get(id) {
      id = String(id).split("~")[0];
      let pid = id, k = 0;
      if (!LIST[pid]) { const m = /^(.*)-(\d+)$/.exec(id); if (m && LIST[m[1]]) { pid = m[1]; k = parseInt(m[2], 10) || 0; } else return null; }
      const L = LIST[pid];
      return L[k % L.length];
    }
  };
})();
