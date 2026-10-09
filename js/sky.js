'use strict';
/* =====================================================================
 *  SKY — Ciclo 21 (Agente A, seconda manche): il cielo della valle.
 *  · PIOGGIA: ogni tanto, all'aperto, arriva un acquazzone (gocce
 *    oblique, schizzi a terra, cielo più cupo, il suo rumore); a volte è
 *    un TEMPORALE, con lampi e tuono in ritardo. Mai nei primi 3 minuti.
 *  · GIORNO E NOTTE dopo la vittoria: il crepuscolo eterno è finito, e ora
 *    il tempo scorre (un giorno ogni 6 minuti di gioco): giorno, tramonto,
 *    notte (finestre accese, lucciole, luce intorno a Lio), alba.
 *  Si aggancia a Game.drawSky, che il motore chiama solo per il mondo esterno.
 *  Rispetta l'opzione "Effetti visivi" (FEEL.on).
 * ===================================================================== */
const DAY_LEN = 360;   // secondi di gioco per un giorno intero, dopo la vittoria

const Sky = {
  rain: 0, target: 0, next: 60 * 60, storm: false, flash: 0, thunderIn: 0, lightHooks: [],
  reset() { this.rain = 0; this.target = 0; this.next = 60 * 60; this.storm = false; this.flash = 0; this.thunderIn = 0; },
  /* fase del giorno 0..1 dopo la vittoria: 0 = mattina; tramonto ~0.5; notte 0.6-0.9; alba ~0.95 */
  phase(g) { return g.s.flags.victory ? ((((g.s.time || 0) - (g.s.dayStart || 0)) % DAY_LEN + DAY_LEN) % DAY_LEN) / DAY_LEN : -1; },
  /* quanto è "notte" (0..1) e quanto è "tramonto/alba" (0..1) */
  night(p) { if (p < 0) return 0; if (p < 0.55) return 0; if (p < 0.62) return (p - 0.55) / 0.07; if (p < 0.88) return 1; if (p < 0.96) return 1 - (p - 0.88) / 0.08; return 0; },
  dusk(p) { if (p < 0) return 0; const a = Math.max(0, 1 - Math.abs(p - 0.53) / 0.06), b = Math.max(0, 1 - Math.abs(p - 0.965) / 0.04); return Math.max(a, b); },
};

(function installSky() {
  const G = Game;
  const outdoors = g => g.roomId && g.roomId.startsWith('o:');

  const newGame = G.newGame;
  G.newGame = function () { Sky.reset(); return newGame.call(this); };

  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state !== 'play' || this.dialog || this.rush) return;
    if (this.s.flags.victory && this.s.dayStart == null) this.s.dayStart = this.s.time;   // il primo giorno comincia col mattino
    const S = Sky;
    if (--S.next <= 0) {
      if (S.target > 0) { S.target = 0; S.next = (120 + Math.random() * 120) * 60; }
      else if ((this.s.time || 0) > 180 && Math.random() < 0.4) {
        S.target = 0.45 + Math.random() * 0.55; S.storm = S.target > 0.85; S.next = (50 + Math.random() * 60) * 60;
      } else S.next = (60 + Math.random() * 90) * 60;
    }
    S.rain += Math.sign(S.target - S.rain) * Math.min(Math.abs(S.target - S.rain), 0.003);
    if (S.flash > 0) S.flash--;
    if (S.thunderIn > 0 && --S.thunderIn === 0 && outdoors(this)) { Sound.sfx('thunder'); this.shake = Math.max(this.shake, 6); }
    if (!outdoors(this) || !FEEL.on) return;
    if (S.rain > 0.25 && this.t % 24 === 0) Sound.sfx('rain');
    if (S.storm && S.rain > 0.7 && Math.random() < 0.0025 && !S.thunderIn) { S.flash = 10; S.thunderIn = 30 + (Math.random() * 50 | 0); }
  };

  let nightCanvas = null, winCache = { bg: null, id: '', list: [] };
  /* le finestre vere: tessere 'H' il cui vetro (#f0b850) è davvero disegnato nello sfondo; di notte se ne accendono circa due su tre */
  function windowsOf(g) {
    if (winCache.bg === g.bg && winCache.id === g.roomId) return winCache.list;
    const list = [], bx = g.bg.getContext('2d'), seed = strHash(g.roomId);
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
      if (g.tiles[ty][tx] !== 'H') continue;
      const d = bx.getImageData(tx * TS + 6, ty * TS + 8, 1, 1).data;
      if (d[0] === 0xf0 && d[1] === 0xb8 && d[2] === 0x50 && hash2(tx, ty, seed) % 3 !== 0) list.push([tx, ty]);
    }
    winCache = { bg: g.bg, id: g.roomId, list }; return list;
  }
  Sky.windowsOf = windowsOf;
  const drawSky = G.drawSky;
  G.drawSky = function (c) {
    drawSky.call(this, c);
    if (!FEEL.on) return;
    const t = this.t, p = Sky.phase(this);
    // --- giorno e notte (solo dopo la vittoria) ---
    const dusk = Sky.dusk(p), night = Sky.night(p);
    if (dusk > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = dusk * 0.55; c.fillStyle = '#f09060'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore(); }
    if (night > 0) {
      const n = nightCanvas || (nightCanvas = makeCanvas(PLAY_W, PLAY_H)), x = n.getContext('2d');
      x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, PLAY_W, PLAY_H);
      x.fillStyle = 'rgba(8,12,40,' + (0.7 * night) + ')'; x.fillRect(0, 0, PLAY_W, PLAY_H);
      x.globalCompositeOperation = 'destination-out';
      const lights = [[this.player.cx(), this.player.cy() - 3, 46, 1]], wins = windowsOf(this);
      for (const [tx, ty] of wins) lights.push([tx * TS + 8, ty * TS + 8, 16, 0.75]);
      for (const hook of Sky.lightHooks) for (const l of hook(this) || []) lights.push(l);   // Ciclo 25: luci di altri file (falò, lanterne)
      for (const [lx, ly, lr, la] of lights) {
        const gr = x.createRadialGradient(lx, ly, lr * 0.2, lx, ly, lr);
        gr.addColorStop(0, 'rgba(0,0,0,' + la + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = gr; x.beginPath(); x.arc(lx, ly, lr, 0, Math.PI * 2); x.fill();
      }
      c.drawImage(n, 0, 0);
      for (const [tx, ty] of wins) {   // vetri accesi, coi listelli ridisegnati sopra
        const X = tx * TS, Y = ty * TS;
        c.globalAlpha = night; c.fillStyle = '#ffd878'; c.fillRect(X + 5, Y + 5, 6, 5); c.fillStyle = '#fff2b8'; c.fillRect(X + 5, Y + 5, 6, 1);
        c.fillStyle = '#5a3a20'; c.fillRect(X + 7, Y + 5, 1, 5); c.fillRect(X + 5, Y + 7, 6, 1); c.globalAlpha = 1;
      }
      for (const f of this.flies) {
        const a = (0.5 + Math.sin(f.ph * 2) * 0.5) * night;
        c.fillStyle = 'rgba(230,255,140,' + (a * 0.3) + ')'; c.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 3, 3);
        c.fillStyle = 'rgba(240,255,170,' + a + ')'; c.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
      }
    }
    // --- pioggia ---
    const I = Sky.rain;
    if (I > 0.02) {
      c.fillStyle = 'rgba(18,24,44,' + (0.22 * I) + ')'; c.fillRect(0, 0, PLAY_W, PLAY_H);
      const n = Math.floor(120 * I);
      c.fillStyle = 'rgba(200,220,255,0.5)';
      for (let i = 0; i < n; i++) {
        const sp = 5 + (i % 3);
        const y = ((i * 61 + t * sp) % (PLAY_H + 24)) - 12, x = ((i * 97 + (i * 13) % 17 + t * 1.6 + y * 0.35) % (PLAY_W + 24)) - 12;
        c.fillRect(Math.round(x), Math.round(y), 1, 3); c.fillRect(Math.round(x) - 1, Math.round(y) + 3, 1, 2);
      }
      c.fillStyle = 'rgba(220,235,255,0.7)';
      for (let k = 0; k < Math.floor(14 * I); k++) {   // schizzi a terra
        const h = hash2(k, t >> 3, 77), sx = h % PLAY_W, sy = (h >> 9) % PLAY_H, ph = (t >> 1) % 4;
        if (ph < 3) { c.fillRect(sx - ph, sy - ph, 1, 1); c.fillRect(sx + ph, sy - ph, 1, 1); c.fillRect(sx, sy, 1, 1); }
      }
    }
    if (Sky.flash > 0) { c.fillStyle = 'rgba(235,240,255,' + (Sky.flash / 10 * 0.7) + ')'; c.fillRect(0, 0, PLAY_W, PLAY_H); }
  };
})();
