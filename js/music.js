/* ==========================================================================
   MÚSICA — motor del reproductor "OG Radio".
   4 pistas sintetizadas con WebAudio (sin archivos) + pistas de archivo
   opcionales si existe PORTFOLIO.music = [{title, artist, src}].
   API pública (window.PF.music):
     play() pause() toggle() next() prev() select(i)
     tracks   -> [{title, artist, style, bpm, kind}]
     current  -> índice de la pista activa      playing -> boolean
     volume   -> 0..1 (get/set)
     elapsed()/duration() -> segundos (duration null en pistas infinitas)
     levels(n) -> n valores 0..1 del analizador (visualizador)
     on(evt, fn) -> 'state' {playing} · 'track' {index, track}; devuelve off()
   El AudioContext se crea en el primer play() (requiere gesto del usuario).
   ========================================================================== */
(function () {
  const PF = window.PF;
  const AC = window.AudioContext || window.webkitAudioContext;
  const LOOKAHEAD = 0.12;      // segundos de audio programados por adelantado
  const TICK_MS = 25;          // intervalo del programador
  const VOL_KEY = "pf-music-vol";

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const up = (m, lo) => { while (m < lo) m += 12; return m; };
  function rngOf(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Motor: contexto, bus maestro y recursos compartidos ---------- */
  let ctx = null, master = null, comp = null, analyser = null, noiseBuf = null, irBuf = null;
  let audioEl = null, mediaSrc = null, freqData = null;

  let volume = 0.7;
  try { const v = parseFloat(localStorage.getItem(VOL_KEY)); if (v >= 0 && v <= 1) volume = v; } catch (e) {}
  const volGain = () => volume * volume * 0.9;

  function ensureCtx() {
    if (ctx) return ctx;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = volGain();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4;
    comp.attack.value = 0.004; comp.release.value = 0.2;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.72;
    analyser.minDecibels = -85; analyser.maxDecibels = -22;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    master.connect(comp); comp.connect(analyser); analyser.connect(ctx.destination);

    // Ruido blanco de 2 s (cajas, hats, viento)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    // Respuesta de impulso para la reverb: ruido estéreo con caída exponencial
    const len = Math.floor(ctx.sampleRate * 2.6);
    irBuf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = irBuf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = Math.pow(1 - i / len, 3.2);
        lp += (Math.random() * 2 - 1 - lp) * 0.55;   // suaviza los agudos
        d[i] = lp * k;
      }
    }
    return ctx;
  }

  /* ---------- Sesión sintética: bus por pista con reverb y delay ---------- */
  function openSession(tr, startN) {
    const c = ctx;
    const sd = 60 / tr.bpm / 4;           // duración de una semicorchea
    const S = { ctx: c, tr, n: startN, sd, rng: rngOf(tr.seed + startN * 7), srcs: new Set(), timer: 0, t0: 0 };
    S.bus = c.createGain();
    S.bus.gain.setValueAtTime(0.0001, c.currentTime);
    S.bus.gain.linearRampToValueAtTime(1, c.currentTime + 0.06);
    S.lp = c.createBiquadFilter(); S.lp.type = "lowpass"; S.lp.frequency.value = tr.lp || 18000;
    S.bus.connect(S.lp); S.lp.connect(master);

    S.revIn = c.createGain();
    const conv = c.createConvolver(); conv.buffer = irBuf;
    const revOut = c.createGain(); revOut.gain.value = 0.9;
    S.revIn.connect(conv); conv.connect(revOut); revOut.connect(S.bus);

    S.dlyIn = c.createGain();
    const dly = c.createDelay(2); dly.delayTime.value = sd * 3;      // corchea con puntillo
    const fb = c.createGain(); fb.gain.value = 0.36;
    const dlp = c.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 2600;
    const dlyOut = c.createGain(); dlyOut.gain.value = 0.8;
    S.dlyIn.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(dlyOut); dlyOut.connect(S.bus);

    S.keep = [S.bus, S.lp, S.revIn, conv, revOut, S.dlyIn, dly, fb, dlp, dlyOut];
    return S;
  }

  function closeSession(S) {
    if (!S) return;
    clearInterval(S.timer);
    const c = S.ctx, now = c.currentTime;
    try { S.bus.gain.cancelScheduledValues(now); S.bus.gain.setTargetAtTime(0, now, 0.025); } catch (e) {}
    setTimeout(() => {
      S.srcs.forEach((o) => { try { o.stop(); } catch (e) {} });
      S.srcs.clear();
      S.keep.forEach((n) => { try { n.disconnect(); } catch (e) {} });
    }, 260);
  }

  /* ---------- Voces ---------- */
  function reg(S, node) { S.srcs.add(node); node.onended = () => S.srcs.delete(node); return node; }

  // Conecta un nodo al bus con panorama y envíos opcionales a reverb / delay.
  function route(S, node, o) {
    let out = node;
    if (o.pan && S.ctx.createStereoPanner) {
      const p = S.ctx.createStereoPanner(); p.pan.value = o.pan; out.connect(p); out = p;
    }
    out.connect(S.bus);
    if (o.rev) { const g = S.ctx.createGain(); g.gain.value = o.rev; out.connect(g); g.connect(S.revIn); }
    if (o.dly) { const g = S.ctx.createGain(); g.gain.value = o.dly; out.connect(g); g.connect(S.dlyIn); }
  }

  /* Voz tonal genérica: varias frecuencias x varias desafinaciones -> filtro -> envolvente. */
  function tone(S, o) {
    const c = S.ctx, t = o.t;
    const a = Math.min(o.a == null ? 0.005 : o.a, o.dur * 0.5);
    const rel = o.r == null ? 0.08 : o.r;
    const end = t + o.dur + rel;
    const dets = o.det || [0];
    const count = o.freqs.length * dets.length;
    const og = c.createGain(); og.gain.value = o.vol / Math.sqrt(count);
    const f = c.createBiquadFilter();
    f.type = o.ft || "lowpass"; f.Q.value = o.q || 0.7;
    f.frequency.setValueAtTime(o.c0 || 3000, t);
    if (o.c1) f.frequency.exponentialRampToValueAtTime(o.c1, t + (o.cd || o.dur));
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + a);
    let hold = 1;
    if (o.sus != null && o.sus < 1) {
      hold = Math.max(o.sus, 0.0001);
      g.gain.exponentialRampToValueAtTime(hold, t + a + Math.min(o.d || o.dur * 0.5, o.dur - a));
    }
    g.gain.setValueAtTime(hold, t + o.dur);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.freqs.forEach((fr) => dets.forEach((dt) => {
      const osc = reg(S, c.createOscillator());
      osc.type = o.type || "sawtooth";
      osc.frequency.value = fr; osc.detune.value = dt;
      osc.connect(og);
      osc.start(t); osc.stop(end + 0.05);
    }));
    og.connect(f); f.connect(g);
    route(S, g, o);
  }

  /* Golpe de ruido filtrado (cajas, hats, viento). */
  function noise(S, o) {
    const c = S.ctx, t = o.t;
    const src = reg(S, c.createBufferSource());
    src.buffer = noiseBuf; src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.ft || "highpass"; f.Q.value = o.q || 0.7;
    f.frequency.setValueAtTime(o.f, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    const g = c.createGain();
    if (o.a) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(o.vol, t + o.a);
    } else {
      g.gain.setValueAtTime(o.vol, t);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g);
    src.start(t, S.rng() * 1.5); src.stop(t + o.dur + 0.05);
    route(S, g, o);
  }

  function kick(S, t, vel, o) {
    o = o || {};
    const c = S.ctx, len = o.len || 0.34;
    const osc = reg(S, c.createOscillator());
    osc.type = "sine";
    osc.frequency.setValueAtTime(o.punch || 150, t);
    osc.frequency.exponentialRampToValueAtTime(o.base || 46, t + 0.11);
    const g = c.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    osc.connect(g); osc.start(t); osc.stop(t + len + 0.03);
    route(S, g, {});
    noise(S, { t, dur: 0.012, f: 2500, vol: vel * 0.18 });
  }
  function snare(S, t, vel, o) {
    o = o || {};
    noise(S, { t, dur: 0.17, ft: "bandpass", f: 1900, q: 0.8, vol: vel * 0.6, rev: o.rev || 0.15 });
    tone(S, { t, freqs: [o.tone || 185], type: "triangle", vol: vel * 0.35, dur: 0.07, r: 0.05, c0: 1200, a: 0.001 });
  }
  function clap(S, t, vel, rev) {
    [0, 0.012, 0.025].forEach((d) => noise(S, { t: t + d, dur: 0.02, ft: "bandpass", f: 1300, q: 1.2, vol: vel * 0.7 }));
    noise(S, { t: t + 0.03, dur: 0.2, ft: "bandpass", f: 1250, q: 1.1, vol: vel * 0.5, rev: rev || 0.25 });
  }
  function hat(S, t, vel, open, pan) {
    noise(S, { t, dur: open ? 0.2 : 0.045, f: open ? 6500 : 7800, vol: vel, pan: pan || 0 });
  }
  // Campana FM: portadora senoidal + modulador inarmónico que decae.
  function bell(S, t, f, vol, pan) {
    const c = S.ctx;
    const car = reg(S, c.createOscillator()), mod = reg(S, c.createOscillator());
    car.type = "sine"; mod.type = "sine";
    car.frequency.value = f; mod.frequency.value = f * 3.5;
    const mg = c.createGain();
    mg.gain.setValueAtTime(f * 2.2, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.08, t + 2.6);
    mod.connect(mg); mg.connect(car.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
    car.connect(g);
    car.start(t); mod.start(t); car.stop(t + 4.7); mod.stop(t + 4.7);
    route(S, g, { pan, rev: 0.9, dly: 0.3 });
  }

  /* ---------- Las cuatro pistas ---------- */
  const SYNTH = [
    {
      title: "Bore", style: "lo-fi", bpm: 82, swing: 0.17, seed: 11, lp: 6200,
      // Dm9 · Bbmaj7 · Gm9 · A7b9
      chords: [{ r: 38, q: [0, 3, 7, 10, 14] }, { r: 34, q: [0, 4, 7, 11, 14] }, { r: 43, q: [0, 3, 7, 10, 14] }, { r: 45, q: [0, 4, 7, 10, 13] }],
      step(S, n, t, sd) {
        const s = n % 16, bar = (n / 16) | 0, ch = this.chords[bar % 4], rng = S.rng;
        if (s === 0) kick(S, t, 0.9, { punch: 130, base: 48, len: 0.4 });
        if (s === 7) kick(S, t, 0.5, { punch: 120, base: 48, len: 0.3 });
        if (s === 10) kick(S, t, 0.7, { punch: 125, base: 48, len: 0.34 });
        if (s === 4 || s === 12) snare(S, t, 0.55, { tone: 170, rev: 0.25 });
        if (rng() > 0.12) hat(S, t, [0.1, 0.04, 0.07, 0.04][s % 4], false, (rng() - 0.5) * 0.3);
        if (rng() < 0.3) noise(S, { t, dur: 0.006, f: 2500, vol: 0.02 + rng() * 0.03 });   // crujido de vinilo
        if (s === 0) {
          tone(S, { t, freqs: [ch.r], type: "triangle", vol: 0.34, dur: sd * 6, r: 0.12, c0: 500, a: 0.01 });
          tone(S, { t, freqs: ch.q.map((i) => up(ch.r, 52) + i), type: "sawtooth", det: [-9, 0, 9], vol: 0.09,
            dur: sd * 16, a: 0.5, r: 1.2, c0: 700, rev: 0.5 });
        }
        if (s === 10) tone(S, { t, freqs: [ch.r], type: "triangle", vol: 0.3, dur: sd * 3, r: 0.1, c0: 450, a: 0.01 });
        if (s === 0 || (s === 10 && rng() < 0.7)) {
          tone(S, { t, freqs: ch.q.slice(0, 4).map((i) => up(ch.r, 57) + i), type: "triangle", det: [-6, 6],
            vol: s === 0 ? 0.13 : 0.08, dur: sd * 3, r: 0.25, c0: 2200, c1: 600, cd: 0.5, sus: 0.4, d: 0.4, rev: 0.35 });
        }
        if (bar % 2 === 1 && (s === 2 || s === 8 || s === 13) && rng() < 0.55) {
          tone(S, { t, freqs: [mtof(up(ch.r, 72) + ch.q[(rng() * ch.q.length) | 0])], type: "sine", vol: 0.09,
            dur: sd * 2, r: 0.3, c0: 3000, a: 0.004, rev: 0.5, dly: 0.35, pan: (rng() - 0.5) * 0.6 });
        }
      }
    },
    {
      title: "Twist 1:10", style: "minimal techno", bpm: 118, swing: 0, seed: 23, lp: 16000,
      // Am · Am · F · G
      chords: [{ r: 33, q: [0, 3, 7, 10] }, { r: 33, q: [0, 3, 7, 10] }, { r: 29, q: [0, 4, 7, 11] }, { r: 31, q: [0, 4, 7, 10] }],
      step(S, n, t, sd) {
        const s = n % 16, bar = (n / 16) | 0, ch = this.chords[bar % 4], rng = S.rng;
        if (s % 4 === 0) kick(S, t, 0.95, { punch: 165, base: 42, len: 0.28 });
        if (s === 4 || s === 12) clap(S, t, 0.4, 0.2);
        if (s % 4 === 2) hat(S, t, 0.2, true);
        if (s % 2 === 1) hat(S, t, s % 4 === 3 ? 0.1 : 0.06, false, s % 4 === 3 ? 0.2 : -0.2);
        if (s === 15 && rng() < 0.3) clap(S, t, 0.15, 0.3);
        // Bajo rodante en los contratiempos, con filtro que respira
        if (s % 4 !== 0) {
          const note = ch.r + (s === 7 || s === 11 ? 12 : 0) + (bar % 4 === 3 && s === 14 ? 7 : 0);
          const cut = 220 + 380 * (0.5 + 0.5 * Math.sin((n / 128) * Math.PI * 2));
          tone(S, { t, freqs: [mtof(note)], type: "sawtooth", vol: 0.24, dur: sd * 0.85, r: 0.02,
            c0: cut * 2.2, c1: cut * 0.6, cd: 0.09, q: 4, a: 0.002 });
        }
        if (bar % 4 >= 1 && (s === 3 || s === 10)) {
          tone(S, { t, freqs: ch.q.map((i) => mtof(up(ch.r, 57) + i)), type: "sawtooth", det: [-8, 8], vol: 0.12,
            dur: sd * 1.2, r: 0.1, c0: 3000, c1: 700, cd: 0.18, q: 2, dly: 0.55, rev: 0.2, pan: s === 3 ? -0.3 : 0.3 });
        }
        if (s === 0 && bar % 2 === 0) {
          tone(S, { t, freqs: ch.q.map((i) => mtof(up(ch.r, 45) + i)), type: "sawtooth", det: [-10, 10], vol: 0.07,
            dur: sd * 32, a: 1.5, r: 1.5, c0: 700, rev: 0.4 });
        }
      }
    },
    {
      title: "Tides", style: "balearic house", bpm: 108, swing: 0.06, seed: 37, lp: 17000,
      // Fmaj7 · Dm7 · Bbmaj7 · Cadd9
      chords: [{ r: 41, q: [0, 4, 7, 11] }, { r: 38, q: [0, 3, 7, 10] }, { r: 34, q: [0, 4, 7, 11] }, { r: 36, q: [0, 4, 7, 14] }],
      step(S, n, t, sd) {
        const s = n % 16, bar = (n / 16) | 0, ch = this.chords[bar % 4], rng = S.rng;
        if (s % 4 === 0) kick(S, t, 0.8, { punch: 140, base: 50, len: 0.3 });
        if (s === 4 || s === 12) clap(S, t, 0.35, 0.3);
        if (s % 4 === 2) hat(S, t, 0.16, true);
        hat(S, t, [0.05, 0.09, 0.06, 0.1][s % 4], false, Math.sin(n * 0.7) * 0.3);
        // Bajo con rebote en contratiempo (raíz / octava)
        if (s === 2 || s === 10) tone(S, { t, freqs: [mtof(ch.r)], type: "sawtooth", vol: 0.24, dur: sd * 1.6, r: 0.05, c0: 700, c1: 260, cd: 0.2, a: 0.004 });
        if (s === 6 || s === 14) tone(S, { t, freqs: [mtof(ch.r + 12)], type: "sawtooth", vol: 0.2, dur: sd * 1.4, r: 0.05, c0: 900, c1: 300, cd: 0.2, a: 0.004 });
        if (s === 3 && rng() < 0.35) tone(S, { t, freqs: [mtof(ch.r + 7)], type: "triangle", vol: 0.18, dur: sd, r: 0.05, c0: 600, a: 0.004 });
        if (s === 0) {
          tone(S, { t, freqs: ch.q.map((i) => mtof(up(ch.r, 53) + i)), type: "sawtooth", det: [-10, 10], vol: 0.09,
            dur: sd * 16, a: 0.3, r: 0.8, c0: 1400, rev: 0.5 });
        }
        // Arpegio brillante de semicorcheas sobre dos octavas del acorde
        const base = up(ch.r, 60), notes = ch.q.map((i) => base + i).concat(ch.q.map((i) => base + 12 + i));
        const seq = [0, 2, 4, 2, 1, 3, 5, 3, 2, 4, 6, 4, 3, 5, 7, 5];
        if (rng() > 0.1) {
          const sweep = 0.5 + 0.5 * Math.sin(n / 90);
          tone(S, { t, freqs: [mtof(notes[seq[s]])], type: "sawtooth", vol: s % 4 === 0 ? 0.11 : 0.075,
            dur: sd * 0.9, r: 0.05, c0: 1800 + 2600 * sweep, c1: 500, cd: 0.12, a: 0.003, dly: 0.5, rev: 0.25, pan: Math.sin(n * 0.5) * 0.3 });
        }
      }
    },
    {
      title: "Rifling", style: "ambient", bpm: 64, swing: 0, seed: 53, lp: 14000,
      // Em9 · Cmaj7 · Am9 · Dsus2 (cambia cada 2 compases)
      chords: [{ r: 40, q: [0, 3, 7, 14] }, { r: 36, q: [0, 4, 7, 11] }, { r: 33, q: [0, 3, 7, 10] }, { r: 38, q: [0, 2, 7, 12] }],
      step(S, n, t, sd) {
        const rng = S.rng, ch = this.chords[((n / 32) | 0) % 4];
        if (n % 32 === 0 || n === S.startN) {
          const len = sd * 32;
          tone(S, { t, freqs: [mtof(ch.r), mtof(ch.r + 7)], type: "sine", vol: 0.24, dur: len, a: 3, r: 3.5, c0: 500 });
          tone(S, { t, freqs: [mtof(ch.r + 12)], type: "sawtooth", vol: 0.1, dur: len, a: 3, r: 3.5, c0: 200, c1: 600 });
          tone(S, { t, freqs: ch.q.map((i) => mtof(up(ch.r, 55) + i)), type: "sawtooth", det: [-12, 0, 12], vol: 0.1,
            dur: len, a: 3, r: 4, c0: 500, c1: 1400, rev: 0.8 });
          tone(S, { t, freqs: [mtof(up(ch.r, 79) + ch.q[1])], type: "sine", vol: 0.04, dur: len, a: 3, r: 4, c0: 5000, rev: 0.9, pan: (rng() - 0.5) * 0.8 });
          noise(S, { t, dur: 8, a: 3.5, ft: "bandpass", f: 900, f1: 400, q: 2.5, vol: 0.09, rev: 0.6, pan: (rng() - 0.5) * 0.8 });
        }
        // Campanas FM sueltas sobre la pentatónica de Mi menor
        if (n % 4 === 0 && rng() < 0.3) {
          const pent = [0, 3, 5, 7, 10];
          const m = 64 + pent[(rng() * 5) | 0] + 12 * ((rng() * 2) | 0);
          bell(S, t, mtof(m), 0.07 + rng() * 0.06, (rng() - 0.5) * 1.2);
        }
      }
    }
  ];

  /* ---------- Lista de pistas (sintéticas + de archivo) ---------- */
  const tracks = SYNTH.map((s) => ({ title: s.title, artist: "OG Radio", style: s.style + " · " + s.bpm + " bpm", bpm: s.bpm, kind: "synth" }));
  const files = Array.isArray(PF.config.music) ? PF.config.music : [];
  files.forEach((f) => {
    if (f && f.src) tracks.push({ title: f.title || "Untitled", artist: f.artist || "OG Radio", style: "file", kind: "file", src: f.src });
  });

  /* ---------- Estado y API ---------- */
  const listeners = {};
  const on = (evt, fn) => {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return () => { listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn); };
  };
  const emit = (evt, data) => (listeners[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } });

  let current = Math.max(0, Math.min(tracks.length - 1, parseInt(PF.state.music, 10) || 0));
  let playing = false;
  let S = null;        // sesión sintética activa
  let pos = 0;         // segundos reproducidos antes de la última pausa (pistas sintéticas)

  function scheduler() {
    if (!S || !ctx) return;
    const tr = SYNTH[current];
    const sd = S.sd;
    while (S.next < ctx.currentTime + LOOKAHEAD) {
      const n = S.n;
      const t = S.next + (n % 2 ? (tr.swing || 0) * sd : 0);
      try { tr.step(S, n, t, sd); } catch (e) { console.error(e); }
      S.next += sd;
      S.n++;
    }
  }

  function startSynth() {
    const tr = SYNTH[current];
    const startN = Math.floor(pos / (60 / tr.bpm / 4));
    S = openSession(tr, startN);
    S.startN = startN;
    pos = startN * S.sd;
    S.t0 = ctx.currentTime;
    S.next = ctx.currentTime + 0.06;
    scheduler();
    S.timer = setInterval(scheduler, TICK_MS);
  }

  function stopSynth() {
    if (!S) return;
    pos += ctx.currentTime - S.t0;
    closeSession(S);
    S = null;
  }

  function ensureAudioEl() {
    if (audioEl) return audioEl;
    audioEl = new Audio();
    audioEl.crossOrigin = "anonymous";
    audioEl.preload = "none";
    audioEl.addEventListener("ended", () => api.next());
    audioEl.addEventListener("error", () => { if (playing) { playing = false; emit("state", { playing }); } });
    try { mediaSrc = ctx.createMediaElementSource(audioEl); mediaSrc.connect(master); } catch (e) { /* ya conectado */ }
    return audioEl;
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator) || !window.MediaMetadata) return;
    try {
      const tr = tracks[current];
      navigator.mediaSession.metadata = new MediaMetadata({ title: tr.title, artist: tr.artist, album: "OG Radio" });
      navigator.mediaSession.setActionHandler("play", () => api.play());
      navigator.mediaSession.setActionHandler("pause", () => api.pause());
      navigator.mediaSession.setActionHandler("nexttrack", () => api.next());
      navigator.mediaSession.setActionHandler("previoustrack", () => api.prev());
    } catch (e) { /* no soportado */ }
  }

  const api = (PF.music = {
    tracks,
    get current() { return current; },
    get playing() { return playing; },
    get volume() { return volume; },
    set volume(v) {
      volume = Math.max(0, Math.min(1, +v || 0));
      try { localStorage.setItem(VOL_KEY, String(volume)); } catch (e) {}
      if (master) master.gain.setTargetAtTime(volGain(), ctx.currentTime, 0.02);
    },
    on,

    play() {
      if (playing) return true;
      if (!ensureCtx()) return false;
      if (ctx.state === "suspended") ctx.resume();
      const tr = tracks[current];
      if (tr.kind === "synth") {
        startSynth();
      } else {
        const a = ensureAudioEl();
        if (a.getAttribute("data-src") !== tr.src) { a.src = tr.src; a.setAttribute("data-src", tr.src); }
        const p = a.play();
        if (p && p.catch) p.catch(() => { if (playing) { playing = false; emit("state", { playing }); } });
      }
      playing = true;
      updateMediaSession();
      emit("state", { playing });
      return true;
    },

    pause() {
      if (!playing) return;
      playing = false;
      if (tracks[current].kind === "synth") stopSynth();
      else if (audioEl) audioEl.pause();
      emit("state", { playing });
    },

    toggle() { playing ? api.pause() : api.play(); },

    select(i) {
      const n = tracks.length;
      i = ((Math.round(i) % n) + n) % n;
      const was = playing;
      if (was) {
        if (tracks[current].kind === "synth") stopSynth();
        else if (audioEl) audioEl.pause();
        playing = false;
      }
      current = i;
      pos = 0;
      if (audioEl && tracks[i].kind === "file") { try { audioEl.currentTime = 0; } catch (e) {} }
      PF.set("music", i);
      emit("track", { index: i, track: tracks[i] });
      if (was) api.play(); else emit("state", { playing });
    },

    next() { api.select(current + 1); },
    prev() {
      // Con más de 3 s reproducidos, "anterior" reinicia la pista
      if (api.elapsed() > 3) api.select(current); else api.select(current - 1);
    },

    elapsed() {
      const tr = tracks[current];
      if (tr.kind === "file") return audioEl ? audioEl.currentTime || 0 : 0;
      return pos + (S && ctx ? ctx.currentTime - S.t0 : 0);
    },
    duration() {
      const tr = tracks[current];
      if (tr.kind === "file" && audioEl && isFinite(audioEl.duration)) return audioEl.duration;
      return null;
    },

    // n bandas (escala logarítmica) normalizadas 0..1 para el visualizador
    levels(n) {
      const out = new Array(n).fill(0);
      if (!analyser) return out;
      analyser.getByteFrequencyData(freqData);
      const lo = 1, hi = Math.min(freqData.length - 1, 150);
      for (let i = 0; i < n; i++) {
        const a = lo * Math.pow(hi / lo, i / n), b = lo * Math.pow(hi / lo, (i + 1) / n);
        const from = Math.floor(a), to = Math.max(from + 1, Math.ceil(b));
        let m = 0;
        for (let k = from; k < to; k++) if (freqData[k] > m) m = freqData[k];
        out[i] = Math.min(1, (m / 255) * (0.8 + 0.6 * (i / n)));
      }
      return out;
    }
  });

  // Si el estado cambia desde fuera (p. ej. "Restablecer"), sincroniza la pista.
  PF.on("change", (e) => {
    if ((e.key === "music" || e.key === "*") && e.state.music !== current) {
      const i = Math.max(0, Math.min(tracks.length - 1, parseInt(e.state.music, 10) || 0));
      if (i !== current) api.select(i);
    }
  });
})();
