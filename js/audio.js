'use strict';
/* =====================================================================
 *  AUDIO — effetti sonori e musica chiptune sintetizzati con WebAudio.
 *  Nessun file audio esterno. API:  Sound.init()  Sound.sfx(nome)
 *  Sound.music(nomeTraccia|null)  Sound.toggleMute()
 * ===================================================================== */
const Sound = (() => {
  let ac = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null, trackBus = null;
  /* Ciclo 8: correzioni del mix, misurate offline con Sound.measure (vedi tests/audit.js e HANDOFF) */
  const SFX_GAIN = {
    // ricompense più squillanti della musica (prima erano 1-2 dB SOTTO la media delle musiche)
    secret: 1.6, chest: 1.5, victory: 1.6, medal: 1.5, fairy: 1.4, gem: 1.25,
    // segnali importanti quasi inudibili (-41..-45 dB)
    charge: 1.6, plop: 1.8, push: 1.7, hookshot: 1.5, reel: 1.5,
    // troppo forti rispetto agli altri effetti (le radici si ripetono di continuo nella fase 2)
    roots: 0.63, boom: 0.75, stomp: 0.75,
  };
  const TRACK_GAIN = { tower: 1.5, festa: 1.1, temple: 1.15, village: 1.26, cave: 1.2, title: 1.12, dungeon: 1.12, boss: 0.88, boss2: 0.86 };   // musiche entro ~1,5 dB
  let lvMusic = 4, lvSfx = 4;   // Ciclo 4: volumi separati (0..5, 4 = valore originale)
  let muted = false;
  try { muted = localStorage.getItem('brinavalle_mute') === '1'; } catch (e) {}

  const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(n) {
    const m = /^([A-G][#b]?)(\d)$/.exec(n);
    if (!m) return 0;
    const midi = (parseInt(m[2], 10) + 1) * 12 + SEMI[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Richiesta del giudice: nelle pagine di test (?test, ?hand) il gioco resta muto. Per sentire: aggiungi &sound.
  // L'audit dei suoni (measure) usa un OfflineAudioContext a parte, che non suona: continua a funzionare.
  const SILENT = /[?&](test|hand)(&|=|$)/.test(location.search) && !/[?&]sound(&|=|$)/.test(location.search);
  function init() {
    if (SILENT) return;
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.55;
    // Ciclo 8: limitatore sul master, così esplosioni + musica + effetti insieme non distorcono
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -8; lim.knee.value = 6; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
    master.connect(lim); lim.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = 0.55 * lvMusic / 4; musicBus.connect(master);
    trackBus = ac.createGain(); trackBus.gain.value = 1; trackBus.connect(musicBus);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.75 * lvSfx / 4; sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(tick, 25);
    if (pending !== undefined) { const p = pending; pending = undefined; current = null; music(p); }
  }

  function tone(type, f, t0, dur, vol, bus, f2) {
    if (!f) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, ff, bus, type) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = ff;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t0); s.stop(t0 + dur + 0.02);
  }
  function seq(notes, step, type, vol, t0) {
    notes.forEach((n, i) => { if (n) tone(type, freq(n), t0 + i * step, step * 1.6, vol); });
  }

  const SFX = {
    sword: t => { noise(t, 0.12, 0.35, 3000); tone('square', 880, t, 0.07, 0.05, null, 330); },
    hit: t => { tone('square', 260, t, 0.1, 0.15, null, 90); noise(t, 0.08, 0.3, 1500); },
    kill: t => { tone('square', 700, t, 0.18, 0.12, null, 120); noise(t + 0.05, 0.25, 0.3, 700); },
    hurt: t => { tone('sawtooth', 320, t, 0.3, 0.18, null, 70); },
    gem: t => { tone('square', 1318, t, 0.07, 0.08); tone('square', 1976, t + 0.06, 0.14, 0.08); },
    heart: t => { tone('triangle', 880, t, 0.1, 0.25); tone('triangle', 1318, t + 0.08, 0.18, 0.25); },
    cut: t => { noise(t, 0.16, 0.35, 4500, null, 'highpass'); },
    chest: t => seq(['C5', 'E5', 'G5', 'C6'], 0.07, 'square', 0.09, t),
    item: t => {
      seq(['G4', 'C5', 'E5', 'G5'], 0.09, 'square', 0.09, t);
      tone('square', freq('C6'), t + 0.36, 0.7, 0.09);
      tone('triangle', freq('C4'), t + 0.36, 0.7, 0.22);
    },
    secret: t => seq(['E5', 'G5', 'B5', 'E6', 'D6', 'B5', 'G6'], 0.08, 'square', 0.08, t),
    unlock: t => { tone('square', 300, t, 0.06, 0.15); tone('square', 600, t + 0.08, 0.12, 0.15); noise(t, 0.1, 0.2, 2000); },
    blip: t => tone('square', 660, t, 0.025, 0.03),
    select: t => tone('square', 990, t, 0.06, 0.08),
    bump: t => tone('square', 110, t, 0.07, 0.1),
    shoot: t => tone('square', 420, t, 0.09, 0.06, null, 900),
    roar: t => { tone('sawtooth', 110, t, 0.9, 0.22, null, 40); noise(t, 0.9, 0.3, 400); },
    bossHit: t => { tone('square', 180, t, 0.15, 0.2, null, 60); noise(t, 0.1, 0.4, 900); },
    explode: t => { noise(t, 0.5, 0.5, 600, null, 'lowpass'); tone('square', 140, t, 0.4, 0.15, null, 30); },
    stairs: t => seq(['G4', 'E4', 'C4', 'A3'], 0.07, 'triangle', 0.25, t),
    door: t => seq(['C4', 'G4'], 0.06, 'triangle', 0.25, t),
    die: t => seq(['A4', 'G4', 'E4', 'C4', 'A3'], 0.16, 'square', 0.1, t),
    victory: t => seq(['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'], 0.12, 'square', 0.09, t),
    start: t => seq(['C5', 'G5', 'C6'], 0.08, 'square', 0.09, t),
    // --- Ciclo 2 ---
    bomb: t => { tone('square', 520, t, 0.05, 0.08); tone('square', 260, t + 0.05, 0.08, 0.08); },
    fuse: t => noise(t, 0.04, 0.06, 5000, null, 'highpass'),
    boom: t => { noise(t, 0.7, 0.7, 500, null, 'lowpass'); tone('sine', 90, t, 0.6, 0.5, null, 25); tone('square', 160, t, 0.25, 0.12, null, 40); },
    crumble: t => { noise(t, 0.6, 0.5, 300, null, 'lowpass'); noise(t + 0.1, 0.4, 0.3, 1200); },
    clank: t => { tone('square', 1400, t, 0.06, 0.08, null, 900); tone('triangle', 2100, t, 0.12, 0.1); },
    charge: t => { tone('square', 1046, t, 0.06, 0.06); tone('square', 1568, t + 0.06, 0.1, 0.06); },
    spin: t => { noise(t, 0.3, 0.35, 2500); tone('square', 440, t, 0.3, 0.06, null, 1760); },
    push: t => noise(t, 0.12, 0.18, 300, null, 'lowpass'),
    plate: t => { tone('square', 200, t, 0.08, 0.12); tone('square', 300, t + 0.07, 0.1, 0.1); },
    shutter: t => { for (let i = 0; i < 5; i++) tone('square', 140 + i * 30, t + i * 0.06, 0.05, 0.1); noise(t, 0.35, 0.2, 800); },
    icethrow: t => { tone('triangle', 700, t, 0.2, 0.15, null, 300); noise(t, 0.15, 0.15, 6000, null, 'highpass'); },
    reflect: t => { tone('square', 600, t, 0.08, 0.1, null, 1800); tone('triangle', 1800, t + 0.05, 0.15, 0.12); },
    shatter: t => { noise(t, 0.35, 0.4, 7000, null, 'highpass'); tone('triangle', 2400, t, 0.2, 0.1, null, 1200); },
    stomp: t => { tone('sine', 70, t, 0.4, 0.5, null, 30); noise(t, 0.3, 0.4, 250, null, 'lowpass'); },
    fairy: t => seq(['E6', 'G#6', 'B6', 'E7', 'B6', 'G#6', 'E7'], 0.06, 'triangle', 0.12, t),
    slide: t => noise(t, 0.12, 0.08, 7000, null, 'highpass'),
    freeze: t => seq(['B6', 'G6', 'E6'], 0.05, 'triangle', 0.1, t),
    // --- Ciclo 6: pesca ---
    cast: t => { noise(t, 0.25, 0.12, 3000, null, 'highpass'); tone('triangle', 500, t, 0.25, 0.08, null, 900); },
    plop: t => { tone('sine', 520, t, 0.12, 0.25, null, 140); noise(t, 0.1, 0.12, 1200); },
    snap: t => { tone('square', 1800, t, 0.05, 0.12, null, 300); noise(t, 0.08, 0.3, 4000, null, 'highpass'); },
    // --- Ciclo 3 ---
    hookshot: t => { for (let i = 0; i < 5; i++) tone('square', 1500 - i * 120, t + i * 0.035, 0.03, 0.05); noise(t, 0.18, 0.12, 6000, null, 'highpass'); },
    hookhit: t => { tone('square', 900, t, 0.05, 0.1, null, 500); tone('triangle', 260, t, 0.12, 0.25, null, 120); noise(t, 0.06, 0.25, 2500); },
    reel: t => { for (let i = 0; i < 4; i++) tone('square', 700 + i * 90, t + i * 0.04, 0.03, 0.04); },
    fall: t => { tone('square', 900, t, 0.7, 0.08, null, 90); tone('triangle', 450, t, 0.7, 0.12, null, 45); },
    splash: t => { noise(t, 0.4, 0.45, 900, null, 'lowpass'); noise(t + 0.05, 0.25, 0.2, 3000); },
    rip: t => { noise(t, 0.35, 0.5, 2200); tone('sawtooth', 220, t, 0.4, 0.2, null, 60); tone('square', 1200, t, 0.1, 0.08, null, 400); },
    roots: t => { noise(t, 0.5, 0.35, 220, null, 'lowpass'); tone('sine', 60, t, 0.5, 0.35, null, 35); },
    erupt: t => { noise(t, 0.25, 0.4, 1600); tone('square', 300, t, 0.15, 0.1, null, 900); },
    swap: t => { tone('square', 660, t, 0.04, 0.07); tone('square', 990, t + 0.04, 0.05, 0.07); },
    transform: t => { tone('sawtooth', 70, t, 1.6, 0.25, null, 140); noise(t, 1.6, 0.3, 350, null, 'lowpass'); seq(['E4', 'D#4', 'D4', 'C#4', 'C4'], 0.25, 'square', 0.06, t); },
    // --- Ciclo 5 (sensazioni) ---
    lowhp: t => { tone('square', 880, t, 0.05, 0.035); tone('square', 660, t + 0.09, 0.06, 0.03); },
    chirp: t => { tone('sine', 2600, t, 0.05, 0.03, null, 3400); tone('sine', 2900, t + 0.08, 0.05, 0.025, null, 3800); },
    plop: t => { tone('sine', 500, t, 0.09, 0.05, null, 1200); noise(t + 0.02, 0.12, 0.05, 2500); },
    medal: t => { seq(['E5', 'G5', 'C6', 'E6'], 0.07, 'square', 0.08, t); tone('triangle', 1568, t + 0.3, 0.5, 0.12); tone('triangle', 2093, t + 0.36, 0.5, 0.08); },
    swim: t => { noise(t, 0.18, 0.12, 900, null, 'lowpass'); tone('sine', 300, t, 0.12, 0.04, null, 500); },
    dive: t => { noise(t, 0.5, 0.35, 700, null, 'lowpass'); tone('sine', 220, t, 0.4, 0.12, null, 80); },
    surface: t => { noise(t, 0.35, 0.3, 1400); tone('sine', 120, t, 0.3, 0.15, null, 360); },
    orb: t => { tone('sine', 600, t, 0.12, 0.08, null, 1200); noise(t, 0.08, 0.08, 4000, null, 'highpass'); },
    yip: t => { tone('square', 1300, t, 0.05, 0.05, null, 1900); tone('square', 1500, t + 0.09, 0.06, 0.05, null, 2100); },
    whine: t => { tone('triangle', 1400, t, 0.35, 0.06, null, 900); },
    rain: t => { noise(t, 0.5, 0.05, 6000, null, 'highpass'); noise(t + 0.1, 0.4, 0.04, 2500); },
    thunder: t => { noise(t, 1.8, 0.45, 160, null, 'lowpass'); noise(t + 0.15, 1.2, 0.25, 420, null, 'lowpass'); tone('sine', 55, t, 1.4, 0.2, null, 30); },
    pop: t => { tone('square', 1200, t, 0.05, 0.05, null, 300); noise(t, 0.08, 0.15, 3000); },
    // --- Ciclo 24 (Agente B): un bulbo che si chiude suona una nota; più bulbi chiusi insieme, più la nota sale (do-mi-sol-do) ---
    // Ciclo 37 (Agente A): le quattro note della Conca dei Coraliani (su, destra, giù, sinistra)
    note0: t => { tone('triangle', freq('G5'), t, 0.5, 0.14); tone('sine', freq('G6'), t, 0.2, 0.03); },
    note1: t => { tone('triangle', freq('E5'), t, 0.5, 0.14); tone('sine', freq('E6'), t, 0.2, 0.03); },
    note2: t => { tone('triangle', freq('C5'), t, 0.5, 0.15); tone('sine', freq('C6'), t, 0.2, 0.03); },
    note3: t => { tone('triangle', freq('A4'), t, 0.5, 0.15); tone('sine', freq('A5'), t, 0.2, 0.035); },
    // Ciclo 31 (Agente A): la Torre del Silenzio
    ring: t => { tone('sine', freq('G6'), t, 0.9, 0.12); tone('sine', freq('G7'), t, 0.35, 0.035); tone('triangle', freq('G5'), t + 0.01, 0.6, 0.05); },
    hush: t => { noise(t, 0.7, 0.06, 900, null, 'lowpass'); tone('sine', freq('D5'), t, 0.6, 0.05, null, freq('D4')); },
    bellHi: t => { tone('sine', freq('E6'), t, 0.8, 0.12); tone('sine', freq('E7'), t, 0.25, 0.03); },
    bellMid: t => { tone('sine', freq('B5'), t, 0.9, 0.13); tone('sine', freq('B6'), t, 0.25, 0.03); },
    bellLo: t => { tone('sine', freq('E5'), t, 1.0, 0.14); tone('sine', freq('E6'), t, 0.3, 0.035); },
    choir: t => { tone('triangle', freq('A4'), t, 0.9, 0.08); tone('triangle', freq('E5'), t + 0.05, 0.85, 0.06); tone('triangle', freq('A5'), t + 0.1, 0.8, 0.04); },
    bulb1: t => { tone('triangle', freq('C5'), t, 0.16, 0.2); tone('square', freq('C6'), t + 0.02, 0.06, 0.035); },
    bulb2: t => { tone('triangle', freq('E5'), t, 0.16, 0.2); tone('square', freq('E6'), t + 0.02, 0.06, 0.035); },
    bulb3: t => { tone('triangle', freq('G5'), t, 0.16, 0.2); tone('square', freq('G6'), t + 0.02, 0.06, 0.035); },
    bulb4: t => { tone('triangle', freq('C6'), t, 0.3, 0.2); tone('square', freq('C7'), t + 0.02, 0.1, 0.035); },
  };
  function sfx(name) {
    if (!ac || muted) return;
    playSfx(name, ac.currentTime + 0.005);
  }
  /* suona un effetto attraverso un guadagno dedicato (SFX_GAIN) */
  function playSfx(name, t) {
    const f = SFX[name];
    if (!f) return;
    const k = SFX_GAIN[name];
    if (k === undefined || k === 1) { f(t); return; }
    const bus = sfxBus, g = ac.createGain();
    g.gain.value = k; g.connect(bus);
    sfxBus = g;
    try { f(t); } finally { sfxBus = bus; }
  }

  /* ---------- Musica: tracker minimale ----------
   * Ogni voce è una stringa di "step" (crome). Nota = "A4", "-" = prolunga
   * la nota precedente, "." = pausa, "|" ignorato (solo leggibilità).
   * Le voci drum usano k (cassa) s (rullante) h (charleston). */
  const TRACKS = {
    title: { bpm: 92, voices: [
      { type: 'triangle', vol: 0.16, notes: 'A4 C5 E5 A5 E5 C5 A4 C5 | G4 B4 D5 G5 D5 B4 G4 B4 | F4 A4 C5 F5 C5 A4 F4 A4 | E4 G#4 B4 E5 B4 G#4 E4 G#4' },
      { type: 'triangle', vol: 0.22, notes: 'A2 - - - - - - - | G2 - - - - - - - | F2 - - - - - - - | E2 - - - - - - -' },
      { type: 'square', vol: 0.035, notes: 'A5 - - - - - - - | B5 - - - - - - - | C6 - - - - - - - | B5 - - - G#5 - - -' },
    ] },
    overworld: { bpm: 132, voices: [
      { type: 'square', vol: 0.06, notes: 'D5 - A4 - D5 E5 F5 - | E5 - C5 - A4 - - - | D5 - A4 - D5 E5 F5 G5 | A5 - G5 F5 E5 - - - | F5 - E5 - D5 - C5 - | D5 - - - A4 - - - | Bb4 - C5 - D5 - E5 - | D5 - - - - - - -' },
      { type: 'triangle', vol: 0.22, notes: 'D3 - - - D3 - A2 - | C3 - - - C3 - G2 - | D3 - - - D3 - A2 - | F3 - - - E3 - C3 - | Bb2 - - - Bb2 - F2 - | D3 - - - A2 - - - | G2 - - - A2 - - - | D3 - - - D3 - - -' },
      { drum: true, notes: 'k . h . s . h . | k . h . s . h h' },
    ] },
    village: { bpm: 104, voices: [
      { type: 'triangle', vol: 0.17, notes: 'E5 - G5 - C6 - B5 A5 | G5 - - - E5 - - - | F5 - A5 - G5 - E5 C5 | D5 - - - - - - - | E5 - G5 - C6 - D6 C6 | B5 - - - G5 - - - | A5 - G5 - F5 - D5 - | C5 - - - - - - -' },
      { type: 'triangle', vol: 0.16, notes: 'C3 - G3 - C3 - G3 - | E3 - G3 - E3 - G3 - | F3 - A3 - F3 - A3 - | G3 - B3 - G3 - B3 - | C3 - G3 - C3 - G3 - | E3 - G3 - E3 - G3 - | F3 - A3 - G3 - B3 - | C3 - G3 - C3 - - -' },
      { drum: true, notes: '. . h . . . h . ' },
    ] },
    dungeon: { bpm: 84, voices: [
      { type: 'square', vol: 0.045, notes: 'A4 - - - C5 - - - | B4 - - - G#4 - - - | A4 - - - E5 - - - | D5 - C5 - B4 - - - | A4 - - - C5 - - - | B4 - - - E4 - - - | F4 - - - E4 - - - | A4 - - - - - - -' },
      { type: 'triangle', vol: 0.25, notes: 'A2 - - - A2 - - - | E2 - - - E2 - - - | F2 - - - F2 - - - | G2 - - - E2 - - - | A2 - - - A2 - - - | E2 - - - E2 - - - | D2 - - - E2 - - - | A2 - - - A2 - - -' },
      { drum: true, notes: 'k . . . . . . . | . . . . h . . .' },
    ] },
    cave: { bpm: 80, voices: [
      { type: 'triangle', vol: 0.13, notes: 'E5 B5 G5 B5 E5 B5 G5 B5 | D5 A5 F#5 A5 D5 A5 F#5 A5 | C5 G5 E5 G5 C5 G5 E5 G5 | B4 F#5 D#5 F#5 B4 F#5 D#5 F#5' },
      { type: 'triangle', vol: 0.22, notes: 'E2 - - - - - - - | D2 - - - - - - - | C2 - - - - - - - | B1 - - - B1 - - -' },
      { type: 'square', vol: 0.028, notes: 'B5 - - - - - E6 - | F#6 - - - - - - - | G6 - - - E6 - - - | D#6 - - - - - - - | B5 - - - - - G6 - | A6 - - - F#6 - - - | G6 - - - - - E6 - | F#6 - - - D#6 - - -' },
      { drum: true, notes: '. . . . h . . . | . . . . . . h .' },
    ] },
    // Ciclo 17 (Agente A): il Santuario Sommerso, re minore, lento e "liquido"
    temple: { bpm: 76, voices: [
      { type: 'triangle', vol: 0.15, notes: 'D5 - F5 - A5 - G5 - | F5 - E5 - D5 - - - | C5 - E5 - G5 - F5 - | E5 - - - A4 - - - | D5 - F5 - A5 - C6 - | Bb5 - A5 - G5 - - - | F5 - E5 - D5 - C5 - | D5 - - - - - - -' },
      { type: 'triangle', vol: 0.2, notes: 'D3 - - - A2 - - - | Bb2 - - - F2 - - - | C3 - - - G2 - - - | A2 - - - A2 - - - | D3 - - - A2 - - - | G2 - - - D3 - - - | Bb2 - - - A2 - - - | D3 - - - D3 - - -' },
      { drum: true, notes: 'k . . . h . . . | . . h . . . . .' },
    ] },
    tower: { bpm: 66, voices: [   // Ciclo 31 (Agente A): la Torre del Silenzio, un carillon che si interrompe
      { type: 'triangle', vol: 0.12, notes: 'D5 - - F5 - - A5 - | F5 - - D5 - - - - | F5 - - C5 - - A4 - | - - - - - - - - | A4 - - D5 - - F5 - | - - E5 - - - - - | D5 - - F5 - - D5 - | - - - - - - - -' },
      { type: 'triangle', vol: 0.16, notes: 'D3 - - - - - - - | Bb2 - - - - - - - | F2 - - - - - - - | A2 - - - - - - - | D3 - - - - - - - | G2 - - - - - - - | Bb2 - - - - - - - | A2 - - - - - - -' },
    ] },
    festa: { bpm: 138, voices: [   // Ciclo 25 (Agente A): la festa del ritorno, una giga in Sol maggiore
      { type: 'square', vol: 0.05, notes: 'G5 - B5 D6 B5 G5 A5 B5 | C6 - A5 - F#5 - D5 - | G5 - B5 D6 E6 D6 B5 G5 | A5 - D5 - G5 - - - | E5 - G5 B5 G5 E5 F#5 G5 | A5 - F#5 - D5 - - - | G5 A5 B5 C6 D6 - B5 G5 | A5 - F#5 - G5 - - -' },
      { type: 'triangle', vol: 0.22, notes: 'G2 - D3 - G2 - D3 - | C3 - G2 - D3 - A2 - | G2 - D3 - C3 - G2 - | D3 - A2 - G2 - D3 - | E2 - B2 - E2 - B2 - | D3 - A2 - D3 - A2 - | G2 - D3 - C3 - E3 - | D3 - A2 - G2 - - -' },
      { type: 'triangle', vol: 0.07, notes: 'B4 - D5 - B4 - D5 - | C5 - E5 - A4 - F#4 - | B4 - D5 - C5 - E5 - | F#4 - A4 - B4 - - - | G4 - B4 - G4 - B4 - | F#4 - A4 - F#4 - A4 - | B4 - D5 - E5 - G5 - | F#4 - C5 - B4 - - -' },
      { drum: true, notes: 'k . h . s . h . | k . h k s . h h' },
    ] },
    boss2: { bpm: 168, voices: [
      { type: 'square', vol: 0.055, notes: 'G5 G5 Bb5 G5 C6 Bb5 G5 F5 | G5 G5 Bb5 G5 D6 C6 Bb5 A5 | Eb6 - D6 - C6 - Bb5 - | A5 - F#5 - D5 - - -' },
      { type: 'triangle', vol: 0.26, notes: 'G2 G3 G2 G3 G2 G3 G2 G3 | G2 G3 G2 G3 G2 G3 G2 G3 | Eb2 Eb3 Eb2 Eb3 C2 C3 C2 C3 | D2 D3 D2 D3 D2 D3 D2 D3' },
      { type: 'square', vol: 0.025, notes: 'D6 G6 Bb6 G6 D6 G6 Bb6 G6 | D6 G6 Bb6 G6 D6 G6 Bb6 G6 | Eb6 G6 Bb6 G6 C6 Eb6 G6 Eb6 | D6 F#6 A6 F#6 D6 F#6 A6 F#6' },
      { drum: true, notes: 'k h s h k k s s' },
    ] },
    boss: { bpm: 150, voices: [
      { type: 'square', vol: 0.055, notes: 'E5 E5 G5 E5 A5 G5 E5 D5 | E5 E5 G5 E5 B5 A5 G5 F#5 | E5 E5 G5 E5 A5 G5 E5 D5 | C5 - D5 - B4 - - -' },
      { type: 'triangle', vol: 0.25, notes: 'E2 E3 E2 E3 E2 E3 E2 E3 | E2 E3 E2 E3 E2 E3 E2 E3 | C2 C3 C2 C3 C2 C3 C2 C3 | B1 B2 B1 B2 B1 B2 B1 B2' },
      { drum: true, notes: 'k h s h k k s h' },
    ] },
  };
  const parsed = {};
  function parseVoice(str) {
    const toks = str.split(/\s+/).filter(t => t && t !== '|');
    const ev = new Array(toks.length).fill(null);
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      if (tk === '-' || tk === '.') continue;
      let len = 1;
      while (i + len < toks.length && toks[i + len] === '-') len++;
      ev[i] = { tk, f: freq(tk), len };
    }
    return ev;
  }
  function getTrack(n) {
    if (!parsed[n]) {
      const t = TRACKS[n];
      parsed[n] = { bpm: t.bpm, voices: t.voices.map(v => Object.assign({}, v, { ev: parseVoice(v.notes) })) };
    }
    return parsed[n];
  }
  function drum(tk, t) {
    if (tk === 'k') tone('sine', 150, t, 0.14, 0.45, trackBus, 40);
    else if (tk === 's') noise(t, 0.1, 0.18, 1800, trackBus);
    else if (tk === 'h') noise(t, 0.03, 0.08, 8000, trackBus, 'highpass');
  }

  let current = null, step = 0, nextT = 0, pending;
  function music(name) {
    if (!ac) { pending = name; return; }
    if (name === current) return;
    current = name || null; step = 0; nextT = ac.currentTime + 0.08;
    if (trackBus) trackBus.gain.value = TRACK_GAIN[current] || 1;
  }
  function tick() {
    if (!ac || !current) return;
    const tr = getTrack(current);
    const sd = 60 / tr.bpm / 2;
    if (nextT < ac.currentTime - 0.2) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.15) {
      for (const v of tr.voices) {
        const e = v.ev[step % v.ev.length];
        if (!e) continue;
        if (v.drum) drum(e.tk, nextT);
        else tone(v.type, e.f, nextT, e.len * sd * 0.95, v.vol, trackBus);
      }
      step++; nextT += sd;
    }
  }

  /* ---------- Ciclo 8: misura OFFLINE (per tests/audit.js) ----------
   * Renderizza un effetto (o 16 s di una musica) in un OfflineAudioContext con
   * la stessa catena di guadagni del gioco, e ne misura picco e volume medio (RMS
   * sulla parte che suona). Serve a bilanciare il mix senza poterlo ascoltare. */
  async function measure(kind, name) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return { errore: 'OfflineAudioContext non disponibile' };
    const sr = 22050, dur = kind === 'sfx' ? 3 : 16, off = new OAC(1, Math.ceil(sr * dur), sr);
    const save = [ac, musicBus, sfxBus, noiseBuf, trackBus];
    try {
      ac = off;
      const out = off.createGain(); out.gain.value = 0.55; out.connect(off.destination);
      musicBus = off.createGain(); musicBus.gain.value = 0.55; musicBus.connect(out);
      sfxBus = off.createGain(); sfxBus.gain.value = 0.75; sfxBus.connect(out);
      trackBus = off.createGain(); trackBus.gain.value = TRACK_GAIN[name] || 1; trackBus.connect(musicBus);
      noiseBuf = off.createBuffer(1, sr, sr);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (kind === 'sfx') playSfx(name, 0.01);
      else {
        const tr = getTrack(name), sd = 60 / tr.bpm / 2;
        for (let st = 0, t = 0.01; t < dur - 0.5; st++, t += sd) for (const v of tr.voices) {
          const e = v.ev[st % v.ev.length]; if (!e) continue;
          if (v.drum) drum(e.tk, t); else tone(v.type, e.f, t, e.len * sd * 0.95, v.vol, trackBus);
        }
      }
    } finally { [ac, musicBus, sfxBus, noiseBuf, trackBus] = save; }
    const buf = await off.startRendering(), x = buf.getChannelData(0);
    let peak = 0, a = -1, b = -1;
    for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (v > peak) peak = v; if (v > 0.003) { if (a < 0) a = i; b = i; } }
    let sum = 0; for (let i = Math.max(0, a); i <= b; i++) sum += x[i] * x[i];
    const rms = a < 0 ? 0 : Math.sqrt(sum / (b - a + 1));
    return { picco: +peak.toFixed(3), rmsDb: a < 0 ? -99 : +(20 * Math.log10(rms)).toFixed(1), durata: +((b - a) / sr).toFixed(2) };
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('brinavalle_mute', muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : 0.55;
    return muted;
  }

  function setLevels(m, s) {
    lvMusic = m; lvSfx = s;
    if (musicBus) { musicBus.gain.value = 0.55 * m / 4; sfxBus.gain.value = 0.75 * s / 4; }
  }

  return { init, sfx, music, toggleMute, setLevels, measure, tracks: () => JSON.parse(JSON.stringify(TRACKS)), sfxNames: () => Object.keys(SFX), trackNames: () => Object.keys(TRACKS), SFX_GAIN, TRACK_GAIN, get muted() { return muted; } };
})();
