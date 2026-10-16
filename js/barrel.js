/* ==========================================================================
   CAÑÓN ESTRIADO — escena procedural + post-procesado (Three.js r128)
   Pase 1: shader de escena a baja resolución (render target)
           · ánima con 6 estrías dextrógiras resuelta analíticamente
           · cara de la boca del cañón con anillos de mecanizado
           · bala (ojiva parabólica + cuerpo + culote) por raymarching SDF
           · salida: R = luminancia, G = material (0 vacío, 1 acero, 2 bala, 3 salida)
   Pase 2: shader de estilo a resolución completa
           · ASCII (atlas de glifos), Braille 2x4, Dithering Bayer 8x8,
             Halftone a 45°, Matriz LED, Sin filtro
   API: PF.barrel = { progress(), canvas, render() }
   ========================================================================== */
(function () {
  const PF = window.PF;
  const canvas = document.getElementById("barrel");
  if (!canvas || !window.THREE) return;

  const L = 40.0;      // longitud del ánima (unidades = radio del ánima)
  const PITCH = 5.5;
  const CAM0 = -12.0;  // cámara inicial: más lejos = cañón más pequeño en pantalla   // avance por vuelta completa de la estría
  const MODES = { raw: 0, ascii: 1, braille: 2, dither: 3, halftone: 4, led: 5 };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  } catch (e) {
    document.documentElement.classList.add("no-webgl");
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = true;

  const quad = new THREE.PlaneGeometry(2, 2);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  /* ---------------- Pase 1: escena ---------------- */
  const SCENE_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2 uRes;
    uniform float uTime, uSpin, uBulletZ, uBullet, uExit, uBulletRot;
    uniform vec3 uCam;
    uniform vec2 uLook;
    uniform float uFov;
    uniform mat3 uTilt;
    #define TAU 6.28318531
    const float LEN = ${L.toFixed(1)};
    const float R = 1.0;
    const float RO = 2.75;
    const float NG = 6.0;
    const float PITCH = ${PITCH.toFixed(1)};
    const float GDEPTH = 0.05;
    const float RB = 0.74;
    const float LN = 1.15;
    const float LB = 0.95;
    const float LT = 0.32;

    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    // Perfil de estría: 1 en el campo (land), 0 en el fondo de la estría (groove).
    // Fase constante a lo largo de la hélice: a = -TAU * z / PITCH + cte  (dextrógira)
    float land(float a, float z){
      float f = fract(NG * ((a + uSpin) / TAU + z / PITCH));
      return smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.74, 0.79, f));
    }

    // Radio de la bala en z local (0 = punta, crece hacia el culote).
    float profile(float z){
      if (z < LN) { float u = 1.0 - z / LN; return RB * (1.0 - u * u); }
      if (z < LN + LB) return RB;
      return RB * (1.0 - 0.2 * (z - LN - LB) / LT);
    }
    float sdBullet(vec3 q){
      float r = length(q.xy);
      float d = r - profile(clamp(q.z, 0.0, LN + LB + LT));
      float caps = max(-q.z, q.z - (LN + LB + LT));
      return max(d * 0.6, caps);   // 0.6 = 1/Lipschitz del perfil
    }
    vec3 bulletNormal(vec3 q){
      const vec2 k = vec2(1.0, -1.0); const float e = 0.0015;
      return normalize(k.xyy * sdBullet(q + k.xyy * e) + k.yyx * sdBullet(q + k.yyx * e) +
                       k.yxy * sdBullet(q + k.yxy * e) + k.xxx * sdBullet(q + k.xxx * e));
    }
    float marchBullet(vec3 ro, vec3 rd, float tmax){
      vec3 c = vec3(0.0, 0.0, uBulletZ + 1.2);
      vec3 oc = ro - c; float b = dot(oc, rd); float h = b * b - (dot(oc, oc) - 1.6 * 1.6);
      if (h < 0.0) return -1.0;
      h = sqrt(h);
      float t = max(-b - h, 0.0), t1 = min(-b + h, tmax);
      for (int i = 0; i < 80; i++) {
        if (t > t1) break;
        float d = sdBullet(uTilt * (ro + rd * t - vec3(0.0, 0.0, uBulletZ + 1.2)) + vec3(0.0, 0.0, 1.2));
        if (d < 0.0008 + 0.0012 * t) return t;
        t += d;
      }
      return -1.0;
    }

    void main(){
      vec2 p = vUv * 2.0 - 1.0;
      float asp = uRes.x / uRes.y;
      if (asp > 1.0) p.x *= asp; else p.y /= asp;
      vec3 ro = uCam;
      vec3 rd = normalize(vec3(p * uFov + uLook, 1.0));
      vec3 lightPos = uCam + vec3(0.22, 0.32, -0.25);

      float lum = 0.0, mat = 0.0, tHit = 1e5;
      vec3 pos = vec3(0.0);
      int surf = 0;
      bool inBore = ro.z >= 0.0;

      if (!inBore) {
        float t0 = -ro.z / rd.z;
        vec3 q = ro + rd * t0;
        float r = length(q.xy);
        if (r > RO) { surf = 0; }
        else if (r > R) { surf = 1; tHit = t0; pos = q; }
        else inBore = true;
      }
      if (inBore) {
        vec2 o = ro.xy, d = rd.xy;
        float A = dot(d, d), B = 2.0 * dot(o, d), Cc = dot(o, o) - R * R;
        float t = 1e5;
        if (A > 1e-7) t = (-B + sqrt(max(B * B - 4.0 * A * Cc, 0.0))) / (2.0 * A);
        vec3 q = ro + rd * t;
        if (t > 1e4 || q.z > LEN) { surf = 3; tHit = (LEN - ro.z) / rd.z; pos = ro + rd * tHit; }
        else { surf = 2; tHit = t; pos = q; }
      }

      vec3 V = normalize(uCam - pos);
      if (surf == 1) {
        // Cara de la boca: plano z = 0 con chaflán interior y anillos de torno.
        float r = length(pos.xy);
        float bevel = 1.0 - smoothstep(R, R + 0.16, r);
        vec3 nn = normalize(vec3(-pos.xy / r * bevel * 0.9, -1.0));
        vec3 Ld = lightPos - pos; float dist = length(Ld); Ld /= dist;
        float diff = max(dot(nn, Ld), 0.0);
        float spec = pow(max(dot(reflect(-Ld, nn), V), 0.0), 30.0);
        float rings = 0.82 + 0.18 * sin(r * 95.0 + noise(pos.xy * 6.0) * 2.0);
        float edge = smoothstep(RO, RO - 0.05, r);
        lum = (diff * 0.55 * rings + spec * 0.5 + bevel * 0.25) * edge / (1.0 + 0.01 * dist * dist);
        mat = 1.0;
      } else if (surf == 2) {
        // Ánima estriada: normal perturbada por la derivada del perfil (ángulo y z).
        float a = atan(pos.y, pos.x);
        float h = land(a, pos.z);
        const float e = 0.012;
        float dha = (land(a + e, pos.z) - land(a - e, pos.z)) / (2.0 * e);
        float dhz = (land(a, pos.z + e) - land(a, pos.z - e)) / (2.0 * e);
        vec3 nr = vec3(-pos.xy / R, 0.0);
        vec3 ta = vec3(-pos.y, pos.x, 0.0) / R;
        vec3 nn = normalize(nr - GDEPTH * (dha / R) * ta - GDEPTH * dhz * vec3(0.0, 0.0, 1.0));
        vec3 Ld = lightPos - pos; float dist = length(Ld); Ld /= dist;
        float diff = max(dot(nn, Ld), 0.0);
        float spec = pow(max(dot(reflect(-Ld, nn), V), 0.0), 14.0);
        float fog = exp(-dist * 0.075);
        float occ = mix(0.12, 1.0, h);
        float flank = clamp(abs(dha) / 24.0, 0.0, 1.0);          // flancos de la estría
        float tex = 0.72 + 0.28 * noise(vec2(a * 34.0, pos.z * 1.3));
        lum = (diff * 1.15 * occ * tex + spec * 1.1 * h + flank * diff * 0.9) * fog * 1.25;
        // Luz que entra por el otro extremo cuando el túnel se abre.
        lum += uExit * exp(-(LEN - pos.z) * 0.32) * (0.25 + 0.75 * h) * 1.1;
        mat = 1.0;
      } else if (surf == 3) {
        float rr = length(pos.xy);
        lum = uExit * (1.25 - 0.25 * rr);
        mat = 3.0;
      }

      if (uBullet > 0.5) {
        float tb = marchBullet(ro, rd, tHit);
        if (tb > 0.0) {
          vec3 bp = ro + rd * tb;
          vec3 q = uTilt * (bp - vec3(0.0, 0.0, uBulletZ + 1.2)) + vec3(0.0, 0.0, 1.2);
          vec3 nn = bulletNormal(q) * uTilt;   // vuelve al espacio del mundo (transpuesta)
          vec3 Ld = normalize(uCam + vec3(1.1, 1.3, 0.2) - bp) * length(lightPos - bp); float dist = length(Ld); Ld /= dist;
          vec3 Vb = normalize(uCam - bp);
          float diff = max(dot(nn, Ld), 0.0);
          float spec = pow(max(dot(reflect(-Ld, nn), Vb), 0.0), 40.0);
          float ang = atan(q.y, q.x) + uBulletRot;
          float swirl = 0.8 + 0.2 * sin(NG * ang + q.z * 5.0);
          float marks = q.z > LN ? 0.7 + 0.3 * smoothstep(0.45, 0.55, fract(NG * ang / TAU)) : 1.0;
          float cannel = 1.0 - 0.55 * (1.0 - smoothstep(0.0, 0.05, abs(q.z - (LN + 0.38))));
          float att = 1.0 / (1.0 + 0.006 * dist * dist);
          lum = (0.12 + diff * 0.95 * swirl * marks * cannel + spec * 1.3) * att * 1.1;
          lum += uExit * exp(-max(LEN - bp.z, 0.0) * 0.25) * 0.6;
          mat = 2.0;
        }
      }

      lum = 1.0 - exp(-1.45 * max(lum, 0.0));
      gl_FragColor = vec4(lum, mat / 3.0, 0.0, 1.0);
    }
  `;

  /* ---------------- Pase 2: estilo ---------------- */
  const POST_FRAG = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uScene, uGlyph;
    uniform vec2 uRes;
    uniform float uCell, uMode, uGlyphN, uFlood, uVoidAlpha;
    uniform vec3 uInk, uPaper, uVoid, uAccent;
    ${PF.fx.GLSL_BAYER}

    vec4 S(vec2 px){ return texture2D(uScene, clamp(px / uRes, 0.0, 1.0)); }
    float matOf(vec4 s){ return floor(s.g * 3.0 + 0.5); }
    vec3 inkFor(float m){ return (m > 1.5 && m < 2.5) ? uAccent : uInk; }
    vec3 baseFor(float m){ return m < 0.5 ? uVoid : uPaper; }

    void main(){
      vec2 px = vUv * uRes;
      vec3 col; float m;
      if (uMode < 0.5) {                      // sin filtro
        vec4 s = S(px); m = matOf(s);
        col = mix(baseFor(m), inkFor(m), s.r);
      } else if (uMode < 1.5) {               // ASCII
        vec2 cs = vec2(uCell * 0.62, uCell);
        vec2 id = floor(px / cs);
        vec4 s = S((id + 0.5) * cs); m = matOf(s);
        float gi = floor(clamp(s.r * 1.06, 0.0, 0.999) * uGlyphN);
        vec2 lc = fract(px / cs);
        float g = texture2D(uGlyph, vec2((gi + lc.x) / uGlyphN, lc.y)).r;
        col = mix(baseFor(m), inkFor(m), g * (0.5 + 0.5 * s.r));
      } else if (uMode < 2.5) {               // Braille 2x4
        vec2 cs = vec2(uCell * 0.6, uCell);
        vec2 id = floor(px / cs);
        vec2 lc = px - id * cs;
        float ix = lc.x < cs.x * 0.5 ? 0.0 : 1.0;
        float iy = clamp(floor(lc.y / (cs.y * 0.25)), 0.0, 3.0);
        vec2 dc = id * cs + vec2(cs.x * (0.3 + 0.4 * ix), cs.y * (0.16 + 0.225 * iy));
        vec4 s = S(dc); m = matOf(s);
        float on = step(bayer4(vec2(id.x * 2.0 + ix, id.y * 4.0 + iy)) + 0.02, s.r * 1.05);
        float r = uCell * 0.085;
        float dotv = 1.0 - smoothstep(r - 0.8, r + 0.8, length(px - dc));
        float off = m > 0.5 ? 0.08 : 0.0;
        col = mix(baseFor(m), inkFor(m), dotv * (on * 0.95 + (1.0 - on) * off));
      } else if (uMode < 3.5) {               // Dithering Bayer 8x8
        float b = max(1.0, floor(uCell / 5.0 + 0.5));
        vec2 q = floor(px / b);
        vec4 s = S((q + 0.5) * b); m = matOf(s);
        float on = step(bayer8(q) + 0.004, s.r * 1.04);
        col = mix(baseFor(m), inkFor(m), on);
      } else if (uMode < 4.5) {               // Halftone a 45°
        const float ca = 0.70710678;
        mat2 rot = mat2(ca, -ca, ca, ca);
        mat2 irot = mat2(ca, ca, -ca, ca);
        vec2 rp = rot * px;
        vec2 cr = (floor(rp / uCell) + 0.5) * uCell;
        vec4 s = S(irot * cr); m = matOf(s);
        float rad = sqrt(s.r) * uCell * 0.62;
        float dotv = 1.0 - smoothstep(rad - 0.9, rad + 0.9, length(rp - cr));
        col = mix(baseFor(m), inkFor(m), dotv);
      } else {                                // Matriz LED
        vec2 c = (floor(px / uCell) + 0.5) * uCell;
        vec4 s = S(c); m = matOf(s);
        float q = floor(s.r * 5.0 + 0.5) / 5.0;
        float d = length(px - c);
        float r = uCell * 0.36;
        float led = 1.0 - smoothstep(r - 0.9, r + 0.9, d);
        float glow = exp(-d * d / (uCell * uCell * 0.35)) * q * 0.3;
        float off = m > 0.5 ? 0.07 : 0.03;
        col = mix(baseFor(m), inkFor(m), clamp(led * (off + (1.0 - off) * q) + glow, 0.0, 1.0));
      }
      float a = m < 0.5 ? uVoidAlpha : 1.0;
      col = mix(col, uPaper, uFlood);
      a = mix(a, 1.0, uFlood);
      gl_FragColor = vec4(col * a, a);
    }
  `;

  const sceneU = {
    uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uSpin: { value: 0 },
    uBulletZ: { value: -3 }, uBullet: { value: 1 }, uExit: { value: 0 }, uBulletRot: { value: 0 },
    uFov: { value: 0.52 }, uTilt: { value: new THREE.Matrix3() }, uCam: { value: new THREE.Vector3(0, 0, -12) }, uLook: { value: new THREE.Vector2(0, 0) }
  };
  const postU = {
    uScene: { value: null }, uGlyph: { value: null }, uRes: { value: new THREE.Vector2(1, 1) },
    uCell: { value: 12 }, uMode: { value: 1 }, uGlyphN: { value: 1 }, uFlood: { value: 0 }, uVoidAlpha: { value: 1 },
    uInk: { value: new THREE.Color() }, uPaper: { value: new THREE.Color() },
    uVoid: { value: new THREE.Color() }, uAccent: { value: new THREE.Color() }
  };
  const sceneMesh = new THREE.Mesh(quad, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: SCENE_FRAG, uniforms: sceneU, depthTest: false, depthWrite: false }));
  const postMesh = new THREE.Mesh(quad, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: POST_FRAG, uniforms: postU, depthTest: false, depthWrite: false, transparent: true }));
  const sceneA = new THREE.Scene(); sceneA.add(sceneMesh);
  const sceneB = new THREE.Scene(); sceneB.add(postMesh);

  let rt = null;
  function makeAtlas() {
    const a = PF.fx.atlas(PF.fx.ASCII_RAMP, { sort: true, cw: 40, ch: 64 });
    const tex = new THREE.CanvasTexture(a.canvas);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    if (postU.uGlyph.value) postU.uGlyph.value.dispose();
    postU.uGlyph.value = tex;
    postU.uGlyphN.value = a.count;
  }

  function sampleRatio(mode, cellPx) {
    switch (mode) {
      case "ascii": return 2 / (cellPx * 0.62);
      case "braille": return 1.5 / (cellPx * 0.225);
      case "dither": return 1 / Math.max(1, Math.round(cellPx / 5));
      case "halftone": return 2 / cellPx;
      case "led": return 2 / cellPx;
      default: return 0.5;
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    const W = Math.round(w * dpr), H = Math.round(h * dpr);
    const cellPx = PF.cellSize() * dpr;
    const k = Math.min(1, sampleRatio(PF.state.effect, cellPx));
    const rw = Math.max(32, Math.round(W * k)), rh = Math.max(32, Math.round(H * k));
    if (!rt) rt = new THREE.WebGLRenderTarget(rw, rh, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false });
    else rt.setSize(rw, rh);
    sceneU.uRes.value.set(rw, rh);
    postU.uRes.value.set(W, H);
    postU.uCell.value = cellPx;
    postU.uMode.value = MODES[PF.state.effect] ?? 1;
    postU.uScene.value = rt.texture;
    dirty = true;
  }

  function applyColors() {
    const c = PF.colors();
    postU.uInk.value.set(c.fg);
    postU.uPaper.value.set(c.bg);
    postU.uAccent.value.set(c.accent);
    const bgMode = PF.state.barrelBg;
    postU.uVoid.value.set(bgMode === "black" ? "#000000" : bgMode === "accent" ? c.accent : c.bg);
    postU.uVoidAlpha.value = bgMode === "field" ? 0 : 1;
    sceneU.uBullet.value = PF.state.bullet ? 1 : 0;
    document.documentElement.dataset.barrelBg = bgMode;
    dirty = true;
  }

  /* ---------------- Scroll, HUD y bucle ---------------- */
  let target = 0, prog = 0, visible = true, dirty = true, t0 = performance.now();
  const hud = {};
  document.querySelectorAll("[data-hud]").forEach((el) => (hud[el.dataset.hud] = el));
  const hero = document.getElementById("hero");

  if (window.ScrollTrigger && hero) {
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom bottom", onUpdate: (s) => { target = s.progress; } });
  }
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) dirty = true; }, { rootMargin: "100px" }).observe(hero);
  }

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const pad = (n, w) => String(Math.floor(n)).padStart(w, "0");

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || PF.state.hero !== "barrel") return;
    const moving = Math.abs(target - prog) > 1e-4;
    prog += (target - prog) * (PF.reducedMotion ? 1 : 0.14);
    const time = PF.reducedMotion ? 0 : (now - t0) / 1000;
    if (PF.reducedMotion && !moving && !dirty) return;

    const p = prog;
    const camZ = CAM0 + (L - 0.35 - CAM0) * Math.pow(p, 1.12);
    const m = PF.mouse;
    const inside = camZ > 0 ? 0.35 : 1;
    sceneU.uCam.value.set(-m.x * 0.35 * inside, m.y * 0.35 * inside, camZ);
    sceneU.uLook.value.set(m.x * 0.05, -m.y * 0.05);
    sceneU.uFov.value = 0.52 - 0.2 * smooth(-1.5, 4.0, camZ);
    const bz = camZ + 3.2 + 10.0 * p * p;
    sceneU.uBulletZ.value = bz;
    // Ligera inclinación + cabeceo de la bala para que se lea en 3D.
    const tx = 0.22 + Math.sin(time * 0.9) * 0.05 + m.y * 0.1, ty = -0.16 + Math.cos(time * 0.7) * 0.05 + m.x * 0.1;
    const cx = Math.cos(tx), sx = Math.sin(tx), cy = Math.cos(ty), sy = Math.sin(ty);
    sceneU.uTilt.value.set(cy, sx * sy, cx * sy, 0, cx, -sx, -sy, sx * cy, cx * cy);
    const spin = time * 0.12 + p * 5.0;
    sceneU.uSpin.value = spin;
    const rot = (Math.max(bz, 0) / PITCH) * Math.PI * 2 + spin + (bz < 0 ? time * 0.6 : 0);
    sceneU.uBulletRot.value = rot;
    sceneU.uExit.value = smooth(0.58, 0.97, p);
    sceneU.uTime.value = time;
    postU.uFlood.value = smooth(0.94, 1.0, p);

    renderer.setRenderTarget(rt);
    renderer.render(sceneA, cam);
    renderer.setRenderTarget(null);
    renderer.render(sceneB, cam);
    dirty = false;

    if (hud.depth) hud.depth.textContent = pad(Math.max(0, camZ) * 15.24, 3) + " mm";
    if (hud.rot) hud.rot.textContent = pad(((rot * 180) / Math.PI) % 100000, 5) + "°";
    if (hud.pct) hud.pct.textContent = pad(p * 100, 3) + "%";
    if (hud.bar) hud.bar.style.transform = `scaleX(${p.toFixed(4)})`;
    document.documentElement.style.setProperty("--hero-p", p.toFixed(4));
  }

  PF.on("theme", applyColors);
  PF.on("change", (e) => {
    if (["effect", "density", "*"].includes(e.key)) resize();
    applyColors();
  });
  window.addEventListener("resize", () => { clearTimeout(resize._t); resize._t = setTimeout(resize, 120); });

  const start = () => { makeAtlas(); resize(); applyColors(); requestAnimationFrame(frame); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start, start);

  PF.barrel = { progress: () => prog, canvas, render: () => (dirty = true) };
})();
