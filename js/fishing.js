'use strict';
/* =====================================================================
 *  FISHING — Ciclo 6 (Agente B): la PESCA al Lago Specchio con Pino.
 *  Si sblocca dopo aver riportato l'Amo d'Oro: parla con Pino → "Pescare".
 *   1) MIRA: frecce sinistra/destra; tieni premuto Azione per caricare,
 *      rilascia per lanciare (più lontano = pesci più grossi).
 *   2) ATTESA: le ombre dei pesci si avvicinano; qualche assaggio
 *      (NON tirare!), poi il galleggiante affonda: premi Azione subito.
 *   3) RECUPERO: tieni premuto per tirare, lascia quando il pesce si
 *      dimena, o il filo si spezza (barra della tensione).
 *  5 specie, record in g.s.fishLog, gemme in premio; Pino regala un
 *  Cuore di Cristallo per il leggendario Luccio Lunare.
 *  Stato di gioco: 'fishing'. Invio esce e torna al lago.
 * ===================================================================== */
const FISH = [
  { id: 'alborella', name: 'Alborella', min: 8, max: 14, str: 0.3, gems: 1, w: [5, 2, 0.4], col: '#c8d8e8', fin: '#8aa0b8' },
  { id: 'persico', name: 'Pesce Persico', min: 15, max: 30, str: 0.5, gems: 3, w: [3, 3, 1], col: '#a8c068', fin: '#e07040' },
  { id: 'trota', name: 'Trota Brinata', min: 25, max: 48, str: 0.65, gems: 5, w: [0.4, 2.5, 2.5], col: '#d8e8ff', fin: '#ff9ab0' },
  { id: 'carpa', name: 'Carpa Dorata', min: 35, max: 72, str: 0.8, gems: 8, w: [0, 0.8, 2.4], col: '#f0c040', fin: '#c87a20' },
  { id: 'luccio', name: 'Luccio Lunare', min: 92, max: 124, str: 1, gems: 25, w: [0, 0, 0.32], col: '#9c8cf4', fin: '#4a3aa8', legend: true },
];
const ROD = { x: 128, y: 132 };   // punta della canna (coordinate dello schermo di pesca)

/* pesce disegnato di lato: corpo, coda, pinna, occhio */
function drawFishSide(c, cx, cy, len, sp, wig) {
  const h = len * 0.36, t = len * 0.3;
  c.fillStyle = '#0a1020';
  c.beginPath(); c.ellipse(cx, cy, len / 2 + 1, h / 2 + 1, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(cx - len / 2 + 2, cy); c.lineTo(cx - len / 2 - t, cy - h / 2 - 1 + wig); c.lineTo(cx - len / 2 - t, cy + h / 2 + 1 + wig); c.fill();
  c.fillStyle = sp.fin;
  c.beginPath(); c.moveTo(cx - len / 2 + 2, cy); c.lineTo(cx - len / 2 - t + 1, cy - h / 2 + wig); c.lineTo(cx - len / 2 - t + 1, cy + h / 2 + wig); c.fill();
  c.beginPath(); c.moveTo(cx - len * 0.1, cy - h / 2); c.lineTo(cx + len * 0.12, cy - h / 2 - h * 0.45); c.lineTo(cx + len * 0.2, cy - h / 2); c.fill();
  c.fillStyle = sp.col;
  c.beginPath(); c.ellipse(cx, cy, len / 2, h / 2, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(Math.round(cx - len * 0.3), Math.round(cy - h * 0.3), Math.round(len * 0.5), 1);
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(Math.round(cx - len * 0.35), Math.round(cy + h * 0.15), Math.round(len * 0.6), Math.max(1, Math.round(h * 0.2)));
  c.fillStyle = '#ffffff'; c.fillRect(Math.round(cx + len * 0.3), Math.round(cy - h * 0.18), 2, 2);
  c.fillStyle = '#0a1020'; c.fillRect(Math.round(cx + len * 0.3) + 1, Math.round(cy - h * 0.18) + 1, 1, 1);
  if (sp.legend) for (let i = 0; i < 4; i++) { c.fillStyle = '#ffffff'; c.fillRect(Math.round(cx - len * 0.25 + i * len * 0.15), Math.round(cy - h * 0.05), 1, 1); }
}

Object.assign(Game, {
  /* ------------------------------ avvio / uscita ------------------------------ */
  startFishing() {
    this.state = 'fishing';
    this.fsh = { phase: 'aim', t: 0, aim: 0, power: 0, pdir: 1, msg: null, shadows: [], ripples: [], catches: 0, needRelease: true };
    if (!this.s.fishLog) this.s.fishLog = {};
    Sound.music('village');
  },
  endFishing() {
    this.state = 'play'; this.fsh = null;
    this.pickMusic(); this.saveGame();
    const f = this.s.flags, log = this.s.fishLog || {};
    const lines = [];
    if (log.luccio && !f.lunarReward) {
      f.lunarReward = true;
      lines.push(
        'Pino: Per tutti i pesci del lago... hai preso il LUCCIO LUNARE! Mio nonno diceva che era solo una leggenda!',
        'Pino: Questo te lo sei proprio meritato. Lo tenevo da parte per un vero pescatore.',
        ...this.giveItem('container'),   // Ciclo 55 (Agente A): dono creato subito, così resume.js lo dà anche se si salva prima del suo turno
      );
    }
    if (FISH.every(sp => log[sp.id]) && !f.allFishReward) {
      f.allFishReward = true;
      lines.push('Pino: Tutte e cinque le specie del Lago Specchio! Sei ufficialmente un PESCATORE PROVETTO.', ...this.giveItem('gems', 50));   // Ciclo 55 (Agente A): dono creato subito, così resume.js lo dà anche se si salva prima del suo turno
    }
    if (lines.length) this.say(lines);
  },

  /* ------------------------------ logica ------------------------------ */
  fishMsg(text, t, col) { this.fsh.msg = { text, t: t || 90, col: col || '#ffe8a0' }; },
  pickSpecies(zone) {
    const tot = FISH.reduce((a, sp) => a + sp.w[zone], 0);
    let r = Math.random() * tot;
    for (const sp of FISH) { r -= sp.w[zone]; if (r <= 0) return sp; }
    return FISH[0];
  },
  updateFishing() {
    const F = this.fsh;
    F.t++;
    if (F.msg && --F.msg.t <= 0) F.msg = null;
    for (const r of F.ripples) r.t++;
    F.ripples = F.ripples.filter(r => r.t < 40);
    if (Input.hit('start')) { this.endFishing(); return; }
    const diffK = [0.75, 1, 1.25][Opts.diff];
    switch (F.phase) {
      case 'aim':
        if (F.needRelease) { if (!Input.held('action')) F.needRelease = false; break; }   // il tasto usato per scegliere "Pescare"
        if (Input.held('left')) F.aim = Math.max(-0.75, F.aim - 0.025);
        if (Input.held('right')) F.aim = Math.min(0.75, F.aim + 0.025);
        if (Input.held('action')) {   // carica: la barra va su e giù finché tieni premuto
          if (!F.charging) { F.charging = true; F.power = 0; F.pdir = 1; }
          F.power += F.pdir * 0.022;
          if (F.power >= 1) { F.power = 1; F.pdir = -1; } else if (F.power <= 0) { F.power = 0; F.pdir = 1; }
        } else if (F.charging) {
          F.charging = false;
          const L = 30 + F.power * 96;
          F.target = { x: Math.max(16, Math.min(240, ROD.x + Math.sin(F.aim) * L)), y: Math.max(16, ROD.y - Math.cos(F.aim) * L) };
          F.zone = L < 62 ? 0 : L < 98 ? 1 : 2;
          F.phase = 'fly'; F.t = 0; Sound.sfx('cast');
        }
        break;
      case 'fly':
        if (F.t >= 30) {
          F.bob = { x: F.target.x, y: F.target.y, dip: 0 };
          F.ripples.push({ x: F.bob.x, y: F.bob.y, t: 0 });
          Sound.sfx('plop');
          F.shadows = [];
          const n = 3 + (Math.random() * 3 | 0);
          for (let i = 0; i < n; i++) {
            const sp = this.pickSpecies(F.zone), a = Math.random() * Math.PI * 2, d = 28 + Math.random() * 40;
            F.shadows.push({ sp, size: sp.min + Math.random() * (sp.max - sp.min), x: F.bob.x + Math.cos(a) * d, y: Math.min(118, F.bob.y + Math.sin(a) * d), vx: 0, vy: 0, ph: Math.random() * 6 });
          }
          F.phase = 'wait'; F.t = 0; F.next = 50 + Math.random() * 120; F.biter = null;
        }
        break;
      case 'wait': {
        this.swimShadows(F);
        if (!F.biter && F.t > F.next && F.shadows.length) { F.biter = F.shadows[Math.random() * F.shadows.length | 0]; F.nibbles = 1 + (Math.random() * 3 | 0); F.nt = 0; }
        const b = F.biter;
        if (b) {
          const dx = F.bob.x - b.x, dy = F.bob.y - b.y, d = Math.hypot(dx, dy);
          if (d > 6) { b.x += dx / d * 0.45; b.y += dy / d * 0.45; b.ang = Math.atan2(dy, dx); }
          else if (++F.nt > 40 + Math.random() * 30) {
            F.nt = 0;
            if (F.nibbles > 0) { F.nibbles--; F.bob.dip = 8; Sound.sfx('blip'); F.ripples.push({ x: F.bob.x, y: F.bob.y, t: 20 }); }
            else { F.phase = 'bite'; F.t = 0; F.bob.dip = 99; Sound.sfx('plop'); Sound.sfx('select'); F.ripples.push({ x: F.bob.x, y: F.bob.y, t: 0 }); }
          }
        }
        if (F.bob.dip > 0 && F.bob.dip < 99) F.bob.dip--;
        if (Input.hit('action')) {
          if (b && Math.hypot(F.bob.x - b.x, F.bob.y - b.y) <= 6) {   // tirato durante un assaggio: il pesce scappa
            F.shadows = F.shadows.filter(s => s !== b); F.biter = null; F.next = F.t + 90;
            this.fishMsg('Troppo presto! Era solo un assaggio...', 90, '#ffb0a0'); Sound.sfx('bump');
            if (!F.shadows.length) this.fishReset('Qui non abbocca più niente. Lancia altrove!');
          } else this.fishReset(null);   // ritira la lenza
        }
        break;
      }
      case 'bite': {
        const win = [42, 30, 22][Opts.diff];
        if (Input.hit('action')) {
          const b = F.biter;
          F.fish = { sp: b.sp, size: b.size, D: Math.hypot(F.bob.x - ROD.x, F.bob.y - ROD.y), T: 20, surge: 0, warn: 0, calm: 60 + (Math.random() * 60 | 0) };
          F.fish.D0 = F.fish.D; F.ux = (F.bob.x - ROD.x) / F.fish.D; F.uy = (F.bob.y - ROD.y) / F.fish.D;
          F.shadows = F.shadows.filter(s => s !== b);
          F.phase = 'reel'; F.t = 0; Sound.sfx('hookhit');
          this.fishMsg('Abboccato! Tieni premuto per tirare!', 80);
        } else if (F.t > win) {
          this.fishReset('Troppo tardi! Si è mangiato l\'esca...');
        }
        break;
      }
      case 'reel': {
        const fi = F.fish, s = fi.sp.str;
        // calma → PREAVVISO (~1/4 di secondo: l'ombra trema, schizzo, filo che lampeggia) → si dimena
        if (fi.surge > 0) { if (--fi.surge <= 0) { fi.surge = 0; fi.calm = 50 + (Math.random() * 80 | 0); } }   // interi: niente dibattersi infinito
        else if (fi.warn > 0) { if (--fi.warn <= 0) { fi.warn = 0; fi.surge = 22 + (Math.random() * 26 * s | 0); } }
        else if (--fi.calm <= 0) { fi.warn = Math.round(20 - s * 12); Sound.sfx('splash'); F.ripples.push({ x: ROD.x + F.ux * fi.D, y: ROD.y + F.uy * fi.D, t: 0 }); }
        const surging = fi.surge > 0;
        if (Input.held('action')) {
          fi.D -= surging ? 0.12 : 0.62 - s * 0.18;
          fi.T += (surging ? 2.0 : 0.42) * (0.6 + s) * diffK;
          if (F.t % 6 === 0) Sound.sfx('reel');
        } else {
          fi.T -= 1.5;
          fi.D += s * (surging ? 0.55 : 0.12);
        }
        fi.T = Math.max(0, fi.T);
        if (surging && F.t % 5 === 0) F.ripples.push({ x: ROD.x + F.ux * fi.D + (Math.random() - 0.5) * 10, y: ROD.y + F.uy * fi.D, t: 18 });
        if (fi.T >= 100) { Sound.sfx('snap'); this.fishReset('Il filo si è spezzato! Lascia quando si dimena.'); }
        else if (fi.D > fi.D0 + 34) this.fishReset('È scappato... Non lasciarlo allontanare troppo!');
        else if (fi.D <= 14) this.fishCaught();
        break;
      }
      case 'caught':
        if (F.t > 30 && Input.hit('action')) { F.phase = 'aim'; F.t = 0; F.card = null; F.needRelease = true; }
        break;
    }
  },
  swimShadows(F) {
    for (const s of F.shadows) {
      if (s === F.biter) continue;
      s.ph += 0.03;
      s.vx += (Math.random() - 0.5) * 0.05; s.vy += (Math.random() - 0.5) * 0.05;
      s.vx *= 0.96; s.vy *= 0.96;
      s.x = Math.max(10, Math.min(246, s.x + s.vx)); s.y = Math.max(10, Math.min(118, s.y + s.vy));
      if (Math.abs(s.vx) + Math.abs(s.vy) > 0.05) s.ang = Math.atan2(s.vy, s.vx);
    }
  },
  fishReset(msg) {
    const F = this.fsh;
    F.phase = 'aim'; F.t = 0; F.bob = null; F.fish = null; F.biter = null; F.shadows = []; F.needRelease = true;
    if (msg) { this.fishMsg(msg, 130, '#ffb0a0'); Sound.sfx('bump'); }
  },
  fishCaught() {
    const F = this.fsh, fi = F.fish, log = this.s.fishLog;
    const cm = Math.round(fi.size), rec = !log[fi.sp.id] || cm > log[fi.sp.id], first = !log[fi.sp.id];
    if (rec) log[fi.sp.id] = cm;
    const gems = fi.sp.gems + Math.round(cm / fi.sp.max * fi.sp.gems);
    this.s.gems = Math.min(999, this.s.gems + gems);
    F.card = { sp: fi.sp, cm, rec, first, gems };
    F.phase = 'caught'; F.t = 0; F.fish = null; F.bob = null; F.catches++;
    Sound.sfx(fi.sp.legend ? 'victory' : 'item');
    this.saveGame();
  },

  /* ------------------------------ disegno ------------------------------ */
  drawFishing(c) {
    const F = this.fsh, t = this.t;
    // acqua: più scura lontano
    const gr = c.createLinearGradient(0, 0, 0, 150);
    gr.addColorStop(0, '#1c3260'); gr.addColorStop(1, '#3f78b8');
    c.fillStyle = gr; c.fillRect(0, 0, GW, GH);
    for (let i = 0; i < 26; i++) {   // riflessi
      const y = (i * 37) % 140 + 4, x = ((i * 71) + t * (0.15 + (i % 3) * 0.08)) % (GW + 30) - 15;
      c.fillStyle = 'rgba(160,200,240,' + (0.12 + (i % 4) * 0.05) + ')'; c.fillRect(Math.round(x), y, 6 + (i % 3) * 3, 1);
    }
    // ninfee e canne
    for (const [x, y, r] of [[30, 40, 7], [210, 28, 6], [228, 96, 8], [22, 104, 6], [180, 60, 5]]) {
      c.fillStyle = '#2e6a3a'; c.beginPath(); c.arc(x, y, r, 0.3, Math.PI * 2); c.lineTo(x, y); c.fill();
      c.fillStyle = '#4c9a50'; c.fillRect(x - 2, y - 2, 2, 1);
      if (r > 6) { c.fillStyle = '#f8b0d0'; c.fillRect(x + 1, y - 3, 3, 3); c.fillStyle = '#fff0f8'; c.fillRect(x + 2, y - 2, 1, 1); }
    }
    // ombre dei pesci
    for (const s of F.shadows) {
      const len = 5 + s.size / 124 * 18, a = s.ang || 0, wig = Math.sin(t * 0.3 + s.ph) * 1.2;
      c.save(); c.translate(s.x, s.y); c.rotate(a);
      c.fillStyle = s.sp.legend ? 'rgba(40,20,80,0.55)' : 'rgba(8,16,40,0.45)';
      c.beginPath(); c.ellipse(0, 0, len / 2, len / 5, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-len / 2, 0); c.lineTo(-len / 2 - len / 4, -len / 6 + wig); c.lineTo(-len / 2 - len / 4, len / 6 + wig); c.fill();
      c.restore();
    }
    // pesce all'amo che si dibatte
    if (F.fish) {
      const fx = ROD.x + F.ux * F.fish.D, fy = ROD.y + F.uy * F.fish.D, sg = F.fish.surge > 0 || F.fish.warn > 0;
      c.save(); c.translate(fx + (sg ? Math.sin(t * 0.9) * 3 : 0), fy); c.rotate(Math.atan2(-F.uy, -F.ux) + (sg ? Math.sin(t * 0.8) * 0.6 : Math.sin(t * 0.2) * 0.2));
      const len = 6 + F.fish.size / 124 * 20;
      c.fillStyle = 'rgba(8,16,40,0.6)'; c.beginPath(); c.ellipse(0, 0, len / 2, len / 5, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    // increspature
    for (const r of F.ripples) {
      c.strokeStyle = 'rgba(220,240,255,' + (1 - r.t / 40) * 0.8 + ')'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(r.x, r.y, 2 + r.t * 0.4, 1 + r.t * 0.18, 0, 0, Math.PI * 2); c.stroke();
    }
    // riva, pontile, Pino e Lio
    c.fillStyle = '#4a8a36'; c.fillRect(0, 150, GW, 42);
    c.fillStyle = '#3c7428'; for (let x = 0; x < GW; x += 6) c.fillRect(x, 150 + (x % 4), 3, 2);
    c.fillStyle = '#c9a66b'; c.fillRect(0, 168, GW, 6);
    c.fillStyle = '#6a4424'; c.fillRect(112, 128, 32, 46);
    c.fillStyle = '#a87a44'; for (let y = 128; y < 174; y += 5) c.fillRect(113, y, 30, 4);
    c.fillStyle = '#5e3d1c'; c.fillRect(113, 128, 2, 46); c.fillRect(141, 128, 2, 46);
    for (const [x, y] of [[18, 142], [26, 146], [236, 140], [244, 147]]) { c.fillStyle = '#5a8a3a'; c.fillRect(x, y - 12, 1, 12); c.fillStyle = '#7a5a2a'; c.fillRect(x - 1, y - 14, 3, 4); }
    c.drawImage(SPR.people.fisherman.up[0], 70, 140);
    c.strokeStyle = '#3a2a1a'; c.beginPath(); c.moveTo(80, 146); c.lineTo(66, 108); c.stroke();
    c.strokeStyle = 'rgba(230,230,240,0.5)'; c.beginPath(); c.moveTo(66, 108); c.lineTo(62, 92 + Math.sin(t * 0.05) * 2); c.stroke();
    c.drawImage(SPR.hero.up[0], 120, 132);
    // canna e lenza
    const tip = { x: ROD.x + Math.sin(F.aim) * 6, y: ROD.y - 10 };
    c.strokeStyle = '#5a3418'; c.lineWidth = 1; c.beginPath(); c.moveTo(128, 140); c.lineTo(tip.x, tip.y); c.stroke();
    let bx = null, by = null;
    if (F.phase === 'fly') { const k = F.t / 30; bx = tip.x + (F.target.x - tip.x) * k; by = tip.y + (F.target.y - tip.y) * k - Math.sin(k * Math.PI) * 30; }
    else if (F.bob) { bx = F.bob.x; by = F.bob.y; }
    else if (F.fish) { bx = ROD.x + F.ux * F.fish.D; by = ROD.y + F.uy * F.fish.D; }
    if (bx !== null) {
      const tens = F.fish ? Math.min(1, F.fish.T / 100) : 0;
      const warnF = F.fish && (F.fish.warn > 0 || F.fish.surge > 0);
      c.strokeStyle = (tens > 0.75 || warnF) && (t >> 2) % 2 ? '#ff8080' : 'rgba(235,235,245,0.75)';
      c.beginPath(); c.moveTo(tip.x, tip.y);
      if (F.fish) c.lineTo(bx, by); else c.quadraticCurveTo((tip.x + bx) / 2, Math.max(tip.y, by) + 6, bx, by);
      c.stroke();
      if (!F.fish) {   // galleggiante rosso e bianco
        const sunk = F.bob && F.bob.dip >= 99, dip = F.bob ? Math.min(3, F.bob.dip / 3) : 0;
        if (!sunk) {
          c.fillStyle = '#0a1020'; c.fillRect(Math.round(bx) - 2, Math.round(by + dip) - 3, 5, 6);
          c.fillStyle = '#e83850'; c.fillRect(Math.round(bx) - 1, Math.round(by + dip) - 2, 3, 2);
          c.fillStyle = '#ffffff'; c.fillRect(Math.round(bx) - 1, Math.round(by + dip), 3, 2);
        }
        if (F.phase === 'bite' && (t >> 2) % 2) { c.fillStyle = '#fff060'; c.fillRect(Math.round(bx) - 1, Math.round(by) - 16, 3, 8); c.fillRect(Math.round(bx) - 1, Math.round(by) - 6, 3, 2); }
      }
    }
    // mira e potenza
    if (F.phase === 'aim') {
      for (let i = 1; i <= 6; i++) {
        const L = 30 + (F.charging ? F.power : 0.5) * 96 * i / 6;
        c.fillStyle = 'rgba(255,240,180,' + (0.25 + i * 0.1) + ')';
        c.fillRect(Math.round(ROD.x + Math.sin(F.aim) * L), Math.round(ROD.y - Math.cos(F.aim) * L), 2, 2);
      }
      if (F.charging) {
        c.fillStyle = '#0a0612'; c.fillRect(150, 136, 8, 34);
        const h = Math.round(F.power * 32);
        c.fillStyle = F.power > 0.75 ? '#ff9040' : '#ffd870'; c.fillRect(151, 169 - h, 6, h);
      }
    }
    // tensione
    if (F.fish) {
      const k = Math.min(1, F.fish.T / 100);
      c.fillStyle = '#0a0612'; c.fillRect(236, 30, 12, 104);
      c.fillStyle = k > 0.75 ? '#ff4050' : k > 0.45 ? '#ffb040' : '#60d070'; c.fillRect(238, 132 - Math.round(k * 100), 8, Math.round(k * 100));
    }
    if (!this.s.flags.victory) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#d4b8e4'; c.fillRect(0, 0, GW, GH); c.restore(); }
    // scheda del pesce preso
    if (F.phase === 'caught' && F.card) {
      c.fillStyle = 'rgba(10,6,20,0.82)'; c.fillRect(0, 0, GW, GH);
      c.fillStyle = '#e8d8b0'; c.fillRect(47, 37, 162, 112); c.fillStyle = '#1c1430'; c.fillRect(48, 38, 160, 110);
      const len = 26 + F.card.cm / 124 * 54;
      if (F.card.sp.legend) { c.fillStyle = 'rgba(200,180,255,' + (0.25 + Math.sin(t * 0.08) * 0.1) + ')'; c.beginPath(); c.arc(128, 86, 44, 0, Math.PI * 2); c.fill(); }
      drawFishSide(c, 128 + len * 0.12, 84, len, F.card.sp, Math.sin(t * 0.25) * 2);
    }
  },
  drawFishingText() {
    const F = this.fsh, tch = isTouch(), A = tch ? 'A' : 'SPAZIO';
    txt('PESCA AL LAGO SPECCHIO', 6, 3, { size: 10, color: '#ffe8a0' });
    txt((tch ? 'MENU' : 'Invio') + ': esci', 232, 3, { size: 10, align: 'right', color: '#c8bcd8' });
    txt('Gemme ' + this.s.gems, 6, 13, { size: 10, color: '#c8ffd0' });
    const help = {
      aim: F.charging ? 'Rilascia per lanciare: più lontano, pesci più grossi!' : '←/→ mira · tieni premuto ' + A + ' per caricare',
      fly: '', wait: 'Gli assaggi fanno solo tremare: tira quando AFFONDA!',
      bite: 'ORA! Premi ' + A + '!', reel: 'Tieni premuto ' + A + ' per tirare · LASCIA se si dimena!',
      caught: A + ': lancia di nuovo',
    }[F.phase];
    if (help) txt(help, 128, 178, { size: 10, align: 'center', color: F.phase === 'bite' ? '#fff060' : '#f4ecdc' });
    if (F.fish) txt('tensione', 242, 136, { size: 9, align: 'center', color: '#c8bcd8' });
    if (F.msg) txt(F.msg.text, 128, 24, { size: 11, align: 'center', color: F.msg.col, alpha: Math.min(1, F.msg.t / 20) });
    if (F.phase === 'caught' && F.card) {
      const cd = F.card;
      txt(cd.sp.legend ? '★ ' + cd.sp.name.toUpperCase() + ' ★' : cd.sp.name, 128, 42, { size: 13, align: 'center', color: cd.sp.legend ? '#d8c8ff' : '#ffd870' });
      txt(cd.cm + ' cm', 128, 110, { size: 14, align: 'center', color: '#ffffff' });
      txt('+' + cd.gems + ' gemme' + (cd.first ? ' · nuova specie!' : cd.rec ? ' · NUOVO RECORD!' : ''), 128, 124, { size: 10, align: 'center', color: cd.rec ? '#a0ffb0' : '#c8bcd8' });
      txt('record: ' + this.s.fishLog[cd.sp.id] + ' cm', 128, 134, { size: 9, align: 'center', color: '#b0a0d0' });
    }
  },
});

/* diario di pesca (dal menu di Pino) */
function fishLogLines(g) {
  const log = g.s.fishLog || {};
  const known = FISH.map(sp => log[sp.id] ? sp.name + ': ' + log[sp.id] + ' cm' : '???').join(' · ');
  const n = FISH.filter(sp => log[sp.id]).length;
  return ['Pino: Vediamo il tuo diario... ' + known + '.',
    n < FISH.length ? 'Pino: Ti mancano ancora ' + (FISH.length - n) + ' specie. I pesci grossi stanno al largo: lancia lontano!' : 'Pino: Hai preso tutto quello che nuota in questo lago. Chapeau!'];
}

/* effetti visivi del Ciclo 5 secondo le Opzioni (feel.js è caricato prima di questo file) */
if (typeof FEEL !== 'undefined') FEEL.on = Opts.fx !== 0;
