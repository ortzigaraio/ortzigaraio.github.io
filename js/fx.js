/* ==========================================================================
   FX — utilidades compartidas de renderizado "digital":
     PF.fx.atlas(chars, opts)          -> atlas de glifos (canvas) ordenado por densidad
     PF.fx.GLSL_BAYER                  -> funciones bayer2/4/8 para shaders
     PF.fx.stylize(src, dst, opts)     -> versión CPU (Canvas 2D) de los 6 efectos,
                                          para portadas y miniaturas de la galería
   ========================================================================== */
(function () {
  const PF = (window.PF = window.PF || {});
  const fx = (PF.fx = {});

  /* Rampa de densidad para ASCII (se reordena midiendo la cobertura real). */
  fx.ASCII_RAMP = " .,:;-~=+*ixcoaeOX#%@";
  fx.ALNUM = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /**
   * Dibuja cada carácter en una fila de celdas blancas sobre negro.
   * Con sort=true mide los píxeles encendidos y ordena de menos a más denso.
   */
  fx.atlas = function (chars, opts = {}) {
    const cw = opts.cw || 48, ch = opts.ch || 80;
    const font = opts.font || "JetBrains Mono, ui-monospace, monospace";
    const weight = opts.weight || 500;
    let list = Array.from(chars);
    const c = document.createElement("canvas");
    c.width = cw * list.length; c.height = ch;
    const g = c.getContext("2d", { willReadFrequently: !!opts.sort });
    const draw = () => {
      g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
      g.font = `${weight} ${Math.round(ch * (opts.scale || 0.78))}px ${font}`;
      list.forEach((s, i) => g.fillText(s, i * cw + cw / 2, ch * 0.54));
    };
    draw();
    if (opts.sort) {
      const data = g.getImageData(0, 0, c.width, c.height).data;
      const cov = list.map((s, i) => {
        let sum = 0;
        for (let y = 0; y < ch; y += 2) for (let x = i * cw; x < (i + 1) * cw; x += 2) sum += data[(y * c.width + x) * 4];
        return { s, sum };
      });
      cov.sort((a, b) => a.sum - b.sum);
      list = cov.map((o) => o.s);
      draw();
    }
    return { canvas: c, chars: list, count: list.length };
  };

  fx.GLSL_BAYER = `
    float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
    float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
    float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }
  `;

  const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const bayer = (x, y) => BAYER4[(y & 3) * 4 + (x & 3)];

  /**
   * Aplica el efecto a un canvas en escala de grises (src) y lo pinta en dst.
   * opts: { mode, cell, ink, paper, accent }  (colores en CSS)
   */
  fx.stylize = function (src, dst, opts) {
    const mode = opts.mode || "ascii";
    const W = (dst.width = src.width), H = (dst.height = src.height);
    const g = dst.getContext("2d");
    const sg = src.getContext("2d", { willReadFrequently: true });
    const img = sg.getImageData(0, 0, W, H).data;
    const lum = (x, y) => {
      x = Math.max(0, Math.min(W - 1, x | 0)); y = Math.max(0, Math.min(H - 1, y | 0));
      const i = (y * W + x) * 4;
      return (img[i] * 0.299 + img[i + 1] * 0.587 + img[i + 2] * 0.114) / 255;
    };
    const cell = Math.max(3, opts.cell || 8);
    g.fillStyle = opts.paper; g.fillRect(0, 0, W, H);
    g.fillStyle = opts.ink;

    if (mode === "raw") {
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = "multiply"; g.fillStyle = opts.ink; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "source-over";
      return dst;
    }
    if (mode === "ascii") {
      const cw = cell * 0.62, chh = cell;
      const ramp = fx._ramp || (fx._ramp = fx.atlas(fx.ASCII_RAMP, { sort: true }).chars);
      g.font = `500 ${cell}px JetBrains Mono, ui-monospace, monospace`;
      g.textAlign = "center"; g.textBaseline = "middle";
      for (let y = 0; y < H; y += chh) for (let x = 0; x < W; x += cw) {
        const v = lum(x + cw / 2, y + chh / 2);
        const ch = ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))];
        if (ch !== " ") g.fillText(ch, x + cw / 2, y + chh / 2);
      }
      return dst;
    }
    if (mode === "braille") {
      const cw = cell * 0.6, chh = cell, r = cell * 0.075;
      for (let y = 0, cy = 0; y < H; y += chh, cy++) for (let x = 0, cx = 0; x < W; x += cw, cx++) {
        for (let iy = 0; iy < 4; iy++) for (let ix = 0; ix < 2; ix++) {
          const px = x + cw * (0.3 + 0.4 * ix), py = y + chh * (0.16 + 0.225 * iy);
          if (lum(px, py) > bayer(cx * 2 + ix, cy * 4 + iy)) { g.beginPath(); g.arc(px, py, r, 0, 6.2832); g.fill(); }
        }
      }
      return dst;
    }
    if (mode === "dither") {
      const b = Math.max(1, Math.round(cell / 5));
      for (let y = 0, by = 0; y < H; y += b, by++) for (let x = 0, bx = 0; x < W; x += b, bx++) {
        if (lum(x + b / 2, y + b / 2) > bayer(bx, by)) g.fillRect(x, y, b, b);
      }
      return dst;
    }
    if (mode === "halftone") {
      const s = cell, a = Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
      const diag = Math.hypot(W, H);
      for (let v = -diag; v < diag; v += s) for (let u = -diag; u < diag; u += s) {
        const x = W / 2 + u * ca - v * sa, y = H / 2 + u * sa + v * ca;
        if (x < -s || y < -s || x > W + s || y > H + s) continue;
        const rr = Math.sqrt(lum(x, y)) * s * 0.58;
        if (rr > 0.3) { g.beginPath(); g.arc(x, y, rr, 0, 6.2832); g.fill(); }
      }
      return dst;
    }
    if (mode === "led") {
      const s = cell, r = s * 0.36;
      for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
        const q = Math.round(lum(x + s / 2, y + s / 2) * 5) / 5;
        g.globalAlpha = 0.08 + 0.92 * q;
        g.beginPath(); g.arc(x + s / 2, y + s / 2, r, 0, 6.2832); g.fill();
      }
      g.globalAlpha = 1;
      return dst;
    }
    return dst;
  };
})();
