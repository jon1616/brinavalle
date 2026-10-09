'use strict';
/* =====================================================================
 *  FEEL — Ciclo 5 (Agente A): "sensazione di gioco" e mondo vivo.
 *  Non riscrive il motore: avvolge (wrap) metodi esistenti.
 *   · hit-stop: il mondo si ferma 3-6 frame quando un colpo va a segno
 *     (i tasti premuti nel frattempo NON vanno persi)
 *   · anelli d'impatto, scoppio alla morte dei nemici, lampi per i grandi momenti
 *   · cuori dell'HUD che "scoppiano" quando li perdi, battito a vita bassa
 *   · polvere dei passi, erba alta che nasconde i piedi e fruscia
 *   · raggi di luce quando ottieni un oggetto
 *   · ambiente: foglie, pesci che saltano, pulviscolo nei sotterranei,
 *     e dopo la vittoria farfalle e stormi di uccelli
 *  Tutti gli effetti vivono in Game.particles (update()/draw(c)/dead).
 *  Disattivabile in un colpo solo: FEEL.on = false.
 * ===================================================================== */
const FEEL = { on: true };
const FOREST_ROOMS = new Set(['o:0,0', 'o:2,1', 'o:0,1', 'o:2,0']);

/* ------------------------------ effetti ------------------------------ */
class Ring {   // anello che si allarga e svanisce
  constructor(x, y, r0, r1, life, col, w) { Object.assign(this, { x, y, r0, r1, life, col, w: w || 1, t: 0, dead: false }); }
  update() { if (++this.t >= this.life) this.dead = true; }
  draw(c) {
    const k = this.t / this.life;
    c.globalAlpha = 1 - k; c.strokeStyle = this.col; c.lineWidth = this.w;
    c.beginPath(); c.arc(this.x, this.y, this.r0 + (this.r1 - this.r0) * k, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }
}
class Twinkle {   // stellina a croce
  constructor(x, y, vx, vy, life, col) { Object.assign(this, { x, y, vx, vy, life, max: life, col, dead: false }); }
  update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.92; this.vy *= 0.92; if (--this.life <= 0) this.dead = true; }
  draw(c) {
    const s = this.life > this.max / 2 ? 2 : 1, x = Math.round(this.x), y = Math.round(this.y);
    c.globalAlpha = Math.min(1, this.life / (this.max * 0.6)); c.fillStyle = this.col;
    c.fillRect(x - s, y, s * 2 + 1, 1); c.fillRect(x, y - s, 1, s * 2 + 1);
    c.globalAlpha = 1;
  }
}
class Dust {   // sbuffo di polvere dei passi
  constructor(x, y, col) { Object.assign(this, { x, y, col, t: 0, life: 18, dead: false, vx: (Math.random() - 0.5) * 0.3 }); }
  update() { this.x += this.vx; this.y -= 0.12; if (++this.t >= this.life) this.dead = true; }
  draw(c) {
    const k = this.t / this.life, r = 1 + k * 2.5;
    c.globalAlpha = 0.55 * (1 - k); c.fillStyle = this.col;
    c.fillRect(Math.round(this.x - r), Math.round(this.y - r / 2), Math.round(r * 2), Math.max(1, Math.round(r)));
    c.globalAlpha = 1;
  }
}
class Leaf {
  constructor(x, y, col) { Object.assign(this, { x, y, col, ph: Math.random() * 6, life: 420, dead: false }); }
  update() { this.ph += 0.05; this.y += 0.28; this.x += Math.sin(this.ph) * 0.45; if (--this.life <= 0 || this.y > PLAY_H + 4) this.dead = true; }
  draw(c) {
    c.globalAlpha = Math.min(1, this.life / 60); c.fillStyle = this.col;
    const flip = Math.sin(this.ph * 2) > 0;
    c.fillRect(Math.round(this.x), Math.round(this.y), flip ? 2 : 1, flip ? 1 : 2);
    c.globalAlpha = 1;
  }
}
class Mote {   // pulviscolo nei sotterranei
  constructor() { Object.assign(this, { x: 16 + Math.random() * 224, y: 16 + Math.random() * 144, ph: Math.random() * 6, life: 300, dead: false }); }
  update() { this.ph += 0.02; this.x += Math.sin(this.ph) * 0.12; this.y -= 0.05; if (--this.life <= 0) this.dead = true; }
  draw(c) { c.fillStyle = 'rgba(220,210,255,' + (0.35 * Math.sin(Math.PI * this.life / 300)) + ')'; c.fillRect(Math.round(this.x), Math.round(this.y), 1, 1); }
}
class Fish {   // un pesce che salta fuori dall'acqua
  constructor(tx, ty) {
    Object.assign(this, { x0: tx * TS + 4 + Math.random() * 8, y0: ty * TS + 10, dir: Math.random() < 0.5 ? -1 : 1, t: 0, life: 34, dead: false, col: Math.random() < 0.5 ? '#f0a040' : '#c8d8e8' });
    Game.particles.push(new Ring(this.x0, this.y0, 1, 5, 18, '#d8f0ff'));
  }
  update() {
    if (++this.t >= this.life) {
      this.dead = true; Game.particles.push(new Ring(this.x0 + this.dir * 10, this.y0, 1, 6, 20, '#d8f0ff'));
      if (Math.random() < 0.5) Sound.sfx('plop');
    }
  }
  draw(c) {
    const k = this.t / this.life, x = Math.round(this.x0 + this.dir * 10 * k), y = Math.round(this.y0 - Math.sin(k * Math.PI) * 9);
    c.fillStyle = '#1a1420'; c.fillRect(x - 2, y - 1, 5, 3);
    c.fillStyle = this.col; c.fillRect(x - 1, y, 3, 1); c.fillRect(x - this.dir * 2, y - 1, 1, 1);
  }
}
class Butterfly {
  constructor() {
    Object.assign(this, { x: 20 + Math.random() * 216, y: 20 + Math.random() * 130, vx: 0, vy: 0, ph: Math.random() * 6, life: 900, dead: false,
      col: ['#ffe878', '#ffb0d8', '#b0d8ff', '#ffffff'][Math.random() * 4 | 0] });
  }
  update() {
    this.ph += 0.35; this.vx += (Math.random() - 0.5) * 0.12; this.vy += (Math.random() - 0.5) * 0.12;
    this.vx *= 0.95; this.vy *= 0.95; this.x += this.vx; this.y += this.vy + Math.sin(this.ph * 0.3) * 0.2;
    if (this.x < 8 || this.x > PLAY_W - 8) this.vx *= -1;
    if (this.y < 8 || this.y > PLAY_H - 8) this.vy *= -1;
    if (--this.life <= 0) this.dead = true;
  }
  draw(c) {
    const x = Math.round(this.x), y = Math.round(this.y), open = Math.sin(this.ph) > 0;
    c.globalAlpha = Math.min(1, this.life / 60);
    c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(x - 1, y + 6, 3, 1);
    c.fillStyle = this.col;
    if (open) { c.fillRect(x - 2, y - 1, 2, 2); c.fillRect(x + 1, y - 1, 2, 2); } else { c.fillRect(x - 1, y - 2, 1, 2); c.fillRect(x + 1, y - 2, 1, 2); }
    c.fillStyle = '#3a2a2a'; c.fillRect(x, y - 1, 1, 2);
    c.globalAlpha = 1;
  }
}
class BirdShadows {   // l'ombra di uno stormo che attraversa la stanza
  constructor() {
    const left = Math.random() < 0.5;
    Object.assign(this, { x: left ? -30 : PLAY_W + 30, y: 20 + Math.random() * 120, vx: left ? 1.1 : -1.1, vy: (Math.random() - 0.5) * 0.4, t: 0, dead: false });
    Sound.sfx('chirp');
  }
  update() { this.t++; this.x += this.vx; this.y += this.vy; if (this.x < -50 || this.x > PLAY_W + 50) this.dead = true; }
  draw(c) {
    c.fillStyle = 'rgba(20,10,30,0.22)';
    for (const [ox, oy] of [[0, 0], [-9, -6], [-9, 6], [-17, -2]]) {
      const x = Math.round(this.x + ox * Math.sign(this.vx)), y = Math.round(this.y + oy), up = ((this.t >> 3) + ox) % 2;
      c.fillRect(x - 3, y - (up ? 1 : 0), 3, 1); c.fillRect(x + 1, y - (up ? 1 : 0), 3, 1); c.fillRect(x, y, 1, 1);
    }
  }
}

/* --------------------------- agganci al motore --------------------------- */
(function installFeel() {
  const G = Game;
  G.hitStop = 0; G.feelFlash = null; G.heldKeys = new Set(); G.heartPops = [];

  G.impact = function (x, y, big) {
    if (!FEEL.on) return;
    this.particles.push(new Ring(x, y, 2, big ? 18 : 10, big ? 18 : 12, '#ffffff', big ? 2 : 1));
    for (let i = 0; i < (big ? 8 : 4); i++) {
      const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * (big ? 2.5 : 1.6);
      this.particles.push(new Twinkle(x, y, Math.cos(a) * v, Math.sin(a) * v, 14 + (Math.random() * 8 | 0), i % 2 ? '#ffffff' : '#fff0a0'));
    }
  };
  G.stopFor = function (n) { if (FEEL.on) this.hitStop = Math.max(this.hitStop, n); };
  G.flashScreen = function (col, n) { if (FEEL.on) this.feelFlash = { col, t: n, max: n }; };

  /* --- update: hit-stop (con i tasti conservati), cuori, battito, ambiente --- */
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    if (this.hitStop > 0 && !this.dialog && this.state === 'play') {
      this.hitStop--;
      for (const k of Input.pressed) this.heldKeys.add(k);
      if (this.feelFlash && --this.feelFlash.t <= 0) this.feelFlash = null;
      return;
    }
    if (this.heldKeys.size) { for (const k of this.heldKeys) Input.pressed.add(k); this.heldKeys.clear(); }
    updatePlay.call(this);
    if (this.feelFlash && --this.feelFlash.t <= 0) this.feelFlash = null;
    for (const h of this.heartPops) h.t++;
    this.heartPops = this.heartPops.filter(h => h.t < 22);
    if (this.state !== 'play' || this.dialog || !FEEL.on) return;
    if (this.s.hp > 0 && this.s.hp <= 2 && this.t % 72 === 0) Sound.sfx('lowhp');
    this.ambience();
  };

  G.ambience = function () {
    const id = this.roomId, t = this.t, P = this.particles, f = this.s.flags;
    if (P.length > 180) return;
    const count = cls => P.reduce((n, p) => n + (p instanceof cls ? 1 : 0), 0);
    if (id.startsWith('o:')) {
      if (FOREST_ROOMS.has(id) && t % 45 === 0) P.push(new Leaf(Math.random() * PLAY_W, -2, f.victory ? ['#5fb24e', '#e8a040', '#c8d048'][t % 3] : ['#3c7428', '#8a5a8a', '#5a8a3a'][t % 3]));
      if (f.victory) {
        if (t % 30 === 0 && count(Butterfly) < (id === 'o:1,2' || id === 'o:1,0' ? 4 : 2)) P.push(new Butterfly());
        if (t % 1100 === 600) P.push(new BirdShadows());
      }
    }
    if (t % 170 === 0 && Math.random() < 0.55) {
      const water = this.animTiles.filter(a => a[2] === '~' && tileAt(a[0], a[1] - 1) === '~');
      if (water.length) { const w = water[Math.random() * water.length | 0]; P.push(new Fish(w[0], w[1])); }
    }
    if ((id.startsWith('d:') || id.startsWith('i:shrine')) && !this.room.dark && t % 35 === 0 && count(Mote) < 14) P.push(new Mote());
  };

  /* --- cambio stanza / nuova partita: niente fermi o lampi residui --- */
  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) { this.hitStop = 0; this.feelFlash = null; this.heldKeys.clear(); return loadRoom.call(this, id); };

  /* --- lampo sopra il mondo (dentro l'area di gioco) --- */
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    const fl = this.feelFlash;
    if (fl) { c.globalAlpha = 0.6 * fl.t / fl.max; c.fillStyle = fl.col; c.fillRect(0, 0, PLAY_W, PLAY_H); c.globalAlpha = 1; }
  };

  /* --- cuori dell'HUD che scoppiano quando li perdi --- */
  const drawHUD = G.drawHUD;
  G.drawHUD = function (c) {
    drawHUD.call(this, c);
    const n = this.s.maxHp / 2;
    for (const h of this.heartPops) {
      if (h.i >= n) continue;
      const x = 4 + (h.i % 8) * 8 + 3, y = (n > 8 ? (h.i < 8 ? 1 : 8) : 4) + 3, k = h.t / 22;
      c.globalAlpha = 1 - k; c.fillStyle = '#ffffff';
      c.fillRect(x - 1 - Math.round(k * 4), y, 3 + Math.round(k * 8), 1); c.fillRect(x, y - 1 - Math.round(k * 4), 1, 3 + Math.round(k * 8));
      if (h.t < 6) c.fillRect(x - 3, y - 3, 7, 7);
      c.globalAlpha = 1;
    }
  };

  /* --- colpi: hit-stop + anello d'impatto (tutte le classi che hanno un proprio hurt) --- */
  const wrapHurt = (cls, stop) => {
    if (!cls || !Object.prototype.hasOwnProperty.call(cls.prototype, 'hurt')) return;
    const orig = cls.prototype.hurt;
    cls.prototype.hurt = function (g, ...rest) {
      const hp0 = this.hp, st0 = this.state;
      const r = orig.call(this, g, ...rest);
      if (this.hp < hp0) {
        g.stopFor(this.hp <= 0 ? stop + 2 : stop);
        g.impact(this.cx(), this.cy(), this.hp <= 0 || stop > 4);
      }
      if (this.state === 'dying' && st0 !== 'dying') { g.flashScreen('#ffffff', 16); g.stopFor(10); }
      return r;
    };
  };
  wrapHurt(Enemy, 3); wrapHurt(Boss, 5);   // Plant e Skeleton passano da Enemy (super.hurt)
  wrapHurt(ThornKing, 5); wrapHurt(Golem, 5);

  const enemyDie = Enemy.prototype.die;
  Enemy.prototype.die = function (g) {
    enemyDie.call(this, g);
    if (!FEEL.on) return;
    g.particles.push(new Ring(this.cx(), this.cy(), 3, 15, 16, '#ffffff', 2));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.particles.push(new Twinkle(this.cx(), this.cy(), Math.cos(a) * 2, Math.sin(a) * 2, 16, '#fff8d0')); }
  };
  if (ThornKing.prototype.startTransform) {
    const st = ThornKing.prototype.startTransform;
    ThornKing.prototype.startTransform = function (g) { st.call(this, g); g.flashScreen('#ff9ad0', 24); g.stopFor(12); };
  }
  if (ThornKing.prototype.rip) {
    const rip = ThornKing.prototype.rip;
    ThornKing.prototype.rip = function (g) { rip.call(this, g); g.flashScreen('#ffffff', 10); g.stopFor(8); g.impact(this.cx(), this.cy(), true); };
  }
  if (Golem.prototype.stagger) {
    const stg = Golem.prototype.stagger;
    Golem.prototype.stagger = function (g) { const r = stg.call(this, g); if (r) { g.flashScreen('#c0ecff', 10); g.stopFor(8); g.impact(this.cx(), this.cy(), true); } return r; };
  }

  /* --- il giocatore: colpito, passi, erba alta, raggi dell'oggetto --- */
  const pHurt = Player.prototype.hurt;
  Player.prototype.hurt = function (g, ...rest) {
    const hp0 = g.s.hp;
    const r = pHurt.call(this, g, ...rest);
    if (g.s.hp < hp0) {
      g.stopFor(5); g.flashScreen('#ff2040', 10);
      for (let i = Math.floor(g.s.hp / 2); i < Math.ceil(hp0 / 2); i++) g.heartPops.push({ i, t: 0 });   // cuori che scoppiano nell'HUD
    }
    return r;
  };
  const DUST = { ':': '#e0c890', '.': '#a8d890', ',': '#88c070', 'F': '#a8d890', 'P': '#9a94b8', 'p': '#b0aec8', 'w': '#c8a070', '=': '#c8a070' };
  const pUpdate = Player.prototype.update;
  Player.prototype.update = function (g) {
    const x0 = this.x, y0 = this.y;
    pUpdate.call(this, g);
    if (!FEEL.on || this.fallT > 0 || this.slide || this.hook) return;
    const moved = Math.abs(this.x - x0) + Math.abs(this.y - y0) > 0.5;
    if (!moved) return;
    this.stepT = (this.stepT || 0) + 1;
    const t = tileAt(Math.floor(this.cx() / TS), Math.floor(this.cy() / TS));
    if (this.stepT % 13 === 0 && DUST[t] && g.room.ground !== 'ice') g.particles.push(new Dust(this.cx() + (this.stepT % 26 ? -3 : 3), this.y + 15, DUST[t]));
    if (t === ',' && this.stepT % 9 === 0)
      for (let i = 0; i < 2; i++) g.particles.push(new Particle(this.cx() + (Math.random() - 0.5) * 8, this.y + 12, (Math.random() - 0.5) * 0.8, -0.6 - Math.random() * 0.6, 14, i ? '#72bd50' : '#3c7428', 1, 0.08));
  };
  const pDraw = Player.prototype.draw;
  Player.prototype.draw = function (c, g) {
    if (g.itemGet && FEEL.on && !this.fallT) {   // raggi di luce dietro l'oggetto ottenuto
      const cx = Math.round(this.x) + 8, cy = Math.round(this.y) - 8;
      c.save(); c.translate(cx, cy); c.rotate(g.t * 0.02);
      c.fillStyle = 'rgba(255,240,170,0.28)';
      for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(0, 0); c.lineTo(-3, -26); c.lineTo(3, -26); c.closePath(); c.fill(); }
      c.restore();
      c.fillStyle = 'rgba(255,250,210,0.25)'; c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fill();
    }
    pDraw.call(this, c, g);
    // erba alta: copre i piedi
    if (FEEL.on && !this.fallT && !g.itemGet) {
      const t = tileAt(Math.floor(this.cx() / TS), Math.floor(this.cy() / TS));
      if (t === ',') {
        const x = Math.round(this.x), y = Math.round(this.y) + 12, sway = (g.t >> 4) % 2;
        for (let i = 0; i < 6; i++) {
          const bx = x + 2 + i * 2, h = 2 + ((i * 7) % 3);
          c.fillStyle = i % 2 ? '#3c7428' : '#4f8c35'; c.fillRect(bx + (i % 3 === sway ? 1 : 0), y + 4 - h, 1, h);
          c.fillStyle = '#72bd50'; c.fillRect(bx + (i % 3 === sway ? 1 : 0), y + 4 - h, 1, 1);
        }
      }
    }
  };
})();
