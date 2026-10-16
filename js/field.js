/* ==========================================================================
   CAMPO DE CARACTERES — fondo animado inspirado en Claude Code, en B/N.
   Rejilla de caracteres alfanuméricos muy tenues; un campo de ruido con
   deformación de dominio (domain warping) dibuja crestas que se desplazan
   despacio y encienden los caracteres a su paso. Sin interacción de clic.
   API: PF.field = { canvas, render() }
   ========================================================================== */
(function () {
  const PF = window.PF;
  const canvas = document.getElementById("field");
  if (!canvas || !window.THREE) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "low-power" });
  } catch (e) { canvas.remove(); return; }
  renderer.setClearColor(0x000000, 0);

  const FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2 uRes;
    uniform float uTime, uCell, uGlyphN, uAlpha;
    uniform vec3 uInk;
    uniform vec3 uC0, uC1;   // clic: x, y (px) y segundos desde el clic (<0 = ninguno)
    uniform sampler2D uGlyph;

    float hash(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
      return v;
    }

    float ringAt(vec3 c, vec2 p){
      if (c.z < 0.0) return 0.0;
      float R = c.z * uRes.y * 0.42, w = uCell * 1.8;
      float d = length(p - c.xy);
      return exp(-pow((d - R) / w, 2.0)) * exp(-c.z * 2.4) * 0.9;
    }
    void main(){
      vec2 px = vUv * uRes;
      vec2 cs = vec2(uCell * 0.6, uCell * 1.18);
      vec2 id = floor(px / cs);
      vec2 lc = fract(px / cs);
      vec2 p = (id + 0.5) * cs / uRes.y * 0.8;

      float t = uTime * 0.035;
      vec2 q = vec2(fbm(p * 1.1 + vec2(0.0, t)), fbm(p * 1.1 + vec2(5.2, -t * 0.8)));
      vec2 r = vec2(fbm(p * 1.4 + 2.2 * q + vec2(1.7, 9.2) + t), fbm(p * 1.4 + 2.2 * q + vec2(8.3, 2.8) - t));
      float f = fbm(p * 1.2 + 2.0 * r);
      float ridge = 1.0 - abs(f * 2.0 - 1.0);
      float band = pow(ridge, 4.6);
      float halo = pow(ridge, 2.0) * 0.22;

      float h = hash(id);
      float h2 = hash(id + 17.17);
      float rate = mix(0.05, 0.5, h) + band * 0.8;
      float ci = floor(hash(id + floor(uTime * rate + h * 13.0)) * uGlyphN);
      float g = texture2D(uGlyph, vec2((ci + lc.x) / uGlyphN, lc.y)).r;

      float blank = step(h2, 0.18 * (1.0 - band));
      float sparkle = step(0.997, hash(id + floor(uTime * 2.0))) * 0.5;
      float v = (0.035 + halo * 0.6 + 0.9 * band + sparkle * 0.6) * (1.0 - blank);
      v += (ringAt(uC0, px) + ringAt(uC1, px)) * (1.0 - 0.45 * blank);
      float a = clamp(g * v * uAlpha, 0.0, 1.0);
      gl_FragColor = vec4(uInk * a, a);
    }
  `;

  const U = {
    uC0: { value: new THREE.Vector3(0, 0, -1) }, uC1: { value: new THREE.Vector3(0, 0, -1) },
    uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uCell: { value: 13 },
    uGlyph: { value: null }, uGlyphN: { value: 1 }, uAlpha: { value: 1 }, uInk: { value: new THREE.Color("#fff") }
  };
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: FRAG, uniforms: U, transparent: true, depthTest: false, depthWrite: false
  })));
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  function atlas() {
    const a = PF.fx.atlas("d0d0d0P9s8d0P9X8d0s9", { cw: 24, ch: 40, weight: 600, scale: 0.8 });
    const tex = new THREE.CanvasTexture(a.canvas);
    tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    U.uGlyph.value = tex; U.uGlyphN.value = a.count;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    U.uRes.value.set(Math.round(w * dpr), Math.round(h * dpr));
    U.uCell.value = (w < 600 ? 11 : 12) * dpr;
    dirty = true;
  }

  function colors() {
    const c = PF.colors();
    U.uInk.value.set(c.fg);
    U.uAlpha.value = PF.state.theme === "light" ? 0.42 : 1.0;
    canvas.hidden = !PF.state.field;
    dirty = true;
  }

  let last = 0, dirty = true;
  const clicks = [{ v: U.uC0.value, t0: null }, { v: U.uC1.value, t0: null }];
  let slot = 0;
  const t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || canvas.hidden) return;
    if (PF.reducedMotion && !dirty && !clicks[0].t0 && !clicks[1].t0) return;
    if (now - last < 33) return; // ~30 fps es suficiente para un fondo
    last = now;
    U.uTime.value = PF.reducedMotion ? 12.0 : (now - t0) / 1000;
    for (let i = 0; i < 2; i++) { const c = clicks[i]; if (c.t0 !== null) { const dt = (now - c.t0) / 1000; if (dt > 2) { c.t0 = null; c.v.z = -1; } else c.v.z = dt; } }
    renderer.render(scene, cam);
    dirty = false;
  }

  PF.on("theme", colors);
  PF.on("change", colors);
  window.addEventListener("resize", () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 120); });
  const start = () => { atlas(); resize(); colors(); requestAnimationFrame(frame); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start, start);

  PF.field = {
    canvas, render: () => (dirty = true),
    /* Onda de caracteres: x, y en px CSS de la ventana. */
    ripple(x, y) {
      const d = Math.min(window.devicePixelRatio || 1, 1.5), c = clicks[slot]; slot = 1 - slot;
      c.v.set(x * d, U.uRes.value.y - y * d, 0); c.t0 = performance.now(); dirty = true;
    }
  };
})();
