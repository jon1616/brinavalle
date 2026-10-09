'use strict';
/* =====================================================================
 *  ENTITIES2 — entità aggiunte nel Ciclo 2:
 *  Bomb (+ Blast, l'esplosione), Block (blocco spingibile), BladeTrap
 *  (lama di ghiaccio invulnerabile), Golem (mini-boss della Grotta),
 *  Icicle (stalattite che cade). Le varianti di ghiaccio di slime e
 *  pipistrelli sono in entities.js (parametri delle classi esistenti).
 * ===================================================================== */
const CHARGE_T = 42;   // frame di carica per il fendente rotante
const SPIN_T = 24;     // durata del fendente rotante
const BOMB_FUSE = 105; // miccia delle bombe
const BLAST_R = 26;    // raggio dell'esplosione (pixel)

/* -------------------------------- BOMBA -------------------------------- */
class Bomb extends Entity {
  constructor(cx, cy) {
    super(cx - 8, cy - 8);
    this.hb = { x: 3, y: 4, w: 10, h: 10 }; this.t = 0; this.bomb = true;
  }
  update(g) {
    this.t++;
    if (this.t % 12 === 0) Sound.sfx('fuse');
    if (this.t % 3 === 0) g.particles.push(new Particle(this.x + 11 + Math.random() * 2, this.y + 2, (Math.random() - 0.5) * 0.4, -0.5, 14, Math.random() < 0.5 ? '#ffd040' : '#ff7020', 1, 0));
    if (this.t >= BOMB_FUSE) { this.dead = true; g.explode(this.cx(), this.cy()); }
  }
  draw(c) {
    const late = this.t > BOMB_FUSE - 40;
    const pulse = late ? Math.sin(this.t * 0.9) * 0.5 + 0.5 : 0;
    drawShadow(c, this.x + 8, this.y + 14, 9);
    const img = SPR.bomb[(this.t >> 2) % 2];
    const w = 12 + Math.round(pulse * 2), h = 13 + Math.round(pulse * 2);
    c.drawImage(late && (this.t >> 2) % 2 ? whiteOf(img) : img, Math.round(this.x + 8 - w / 2), Math.round(this.y + 14 - h), w, h);
  }
}

/* l'esplosione è un "effetto" che vive nella lista delle particelle */
class Blast {
  constructor(x, y) { this.x = x; this.y = y; this.t = 0; this.dead = false; }
  update() { if (++this.t > 26) this.dead = true; }
  draw(c) {
    const t = this.t, r = Math.min(BLAST_R + 2, 6 + t * 3.2);
    c.save();
    if (t < 5) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(this.x, this.y, r, 0, Math.PI * 2); c.fill(); }
    else {
      c.globalAlpha = Math.max(0, 1 - (t - 5) / 21);
      c.fillStyle = '#ff9a30'; c.beginPath(); c.arc(this.x, this.y, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffe070'; c.beginPath(); c.arc(this.x, this.y, r * 0.62, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fffbe0'; c.beginPath(); c.arc(this.x, this.y, r * 0.3, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
}

/* --------------------------- BLOCCO SPINGIBILE --------------------------- */
class Block extends Entity {
  constructor(tx, ty) {
    super(tx * TS, ty * TS);
    this.hb = { x: 0, y: 0, w: 16, h: 16 }; this.solid = true; this.pushable = true; this.mv = null;
  }
  get tx() { return Math.round(this.x / TS); }
  get ty() { return Math.round(this.y / TS); }
  tryPush(g, dir) {
    if (this.mv) return false;
    const v = DIRS[dir], nx = this.tx + v.x, ny = this.ty + v.y;
    if (nx < 1 || ny < 1 || nx > RW - 2 || ny > RH - 2) return false;
    const t = tileAt(nx, ny);
    if (t === null || TILE_SOLID.has(t) || TILE_WARP.has(t)) return false;
    const dest = { x: nx * TS + 1, y: ny * TS + 1, w: 14, h: 14 };
    if (g.entities.some(e => e !== this && !e.dead && (e.solid || e.bomb) && overlap(dest, e.box()))) return false;
    this.mv = { dx: v.x, dy: v.y, t: 16 };
    Sound.sfx('push');
    return true;
  }
  update(g) {
    if (!this.mv) return;
    this.x += this.mv.dx; this.y += this.mv.dy;
    if (this.mv.t % 4 === 0) g.particles.push(new Particle(this.x + 8 - this.mv.dx * 8 + (Math.random() - 0.5) * 10, this.y + 14, 0, -0.2, 14, '#c8d8e8', 1, 0));
    if (--this.mv.t <= 0) { this.mv = null; g.checkPlates(); }
  }
  draw(c) { c.drawImage(SPR.block, Math.round(this.x), Math.round(this.y)); }
}

/* ---------------------- LAMA DI GHIACCIO (invulnerabile) ---------------------- */
class BladeTrap extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.hp = 99; this.ignoreClear = true; this.hb = { x: 2, y: 2, w: 12, h: 12 };
    this.hx = x; this.hy = y; this.state = 'idle'; this.cd = 0; this.clankCd = 0; this.vx = 0; this.vy = 0;
  }
  hurt(g) {
    if (this.clankCd > 0) return;
    this.clankCd = 12; Sound.sfx('clank'); g.spark(this.cx(), this.cy());
  }
  update(g) {
    this.t++;
    if (this.clankCd > 0) this.clankCd--;
    const p = g.player;
    if (this.state === 'idle') {
      if (this.cd > 0) this.cd--;
      else {
        const dx = p.cx() - this.cx(), dy = p.cy() - this.cy();
        if (Math.abs(dy) < 9 && Math.abs(dx) < 200) { this.state = 'go'; this.vx = Math.sign(dx) * 3.1; this.vy = 0; }
        else if (Math.abs(dx) < 9 && Math.abs(dy) < 200) { this.state = 'go'; this.vx = 0; this.vy = Math.sign(dy) * 3.1; }
      }
    } else if (this.state === 'go') {
      if (moveEntity(this, this.vx, this.vy, { edgeSolid: true, self: this, entities: true })) {
        this.state = 'back'; Sound.sfx('clank'); g.spark(this.cx() + Math.sign(this.vx) * 7, this.cy() + Math.sign(this.vy) * 7);
      }
    } else {
      const dx = this.hx - this.x, dy = this.hy - this.y, d = Math.hypot(dx, dy);
      if (d < 1) { this.x = this.hx; this.y = this.hy; this.state = 'idle'; this.cd = 40; }
      else { this.x += dx / d * Math.min(d, 0.9); this.y += dy / d * Math.min(d, 0.9); }
    }
    this.touchPlayer(g);
  }
  draw(c) {
    drawShadow(c, this.x + 8, this.y + 14, 10);
    c.drawImage(SPR.blade[this.state === 'go' ? (this.t >> 1) % 2 : 0], Math.round(this.x), Math.round(this.y));
  }
}

/* ------------------------- STALATTITE CHE CADE ------------------------- */
class Icicle {
  constructor(x, y, delay) { this.x = x; this.y = y; this.t = -(delay || 0); this.fall = 62; this.dead = false; this.noCut = true; }
  box() { return { x: this.x - 6, y: this.y - 5, w: 12, h: 10 }; }
  update(g) {
    this.t++;
    if (this.t === this.fall) {
      Sound.sfx('shatter');
      for (let i = 0; i < 10; i++) g.particles.push(new Particle(this.x, this.y - 2, (Math.random() - 0.5) * 2.4, -Math.random() * 2, 24, i % 2 ? '#e0f6ff' : '#8ad0f4', 2, 0.15));
      if (overlap(this.box(), g.player.box())) g.player.hurt(g, 1, this.x, this.y - 8);
    }
    if (this.t > this.fall + 2) this.dead = true;
  }
  draw(c) {
    if (this.t < 0) return;
    const k = Math.min(1, this.t / this.fall);
    c.fillStyle = 'rgba(0,10,30,' + (0.15 + k * 0.35) + ')';
    c.beginPath(); c.ellipse(this.x, this.y + 2, 3 + k * 4, 1.5 + k * 2, 0, 0, Math.PI * 2); c.fill();
    const left = this.fall - this.t;
    if (left < 22) {
      const iy = Math.round(this.y - left * 7);
      c.fillStyle = '#0e1a2a'; c.fillRect(this.x - 3, iy - 13, 6, 10); c.fillRect(this.x - 2, iy - 3, 4, 3);
      c.fillStyle = '#9ad8f8'; c.fillRect(this.x - 2, iy - 12, 4, 9); c.fillRect(this.x - 1, iy - 3, 2, 3);
      c.fillStyle = '#ffffff'; c.fillRect(this.x - 1, iy - 12, 1, 6);
    }
  }
}

/* --------------------------- GOLEM DI BRINA --------------------------- */
class Golem extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.hp = this.maxHp = 9; this.dmg = 2; this.title = 'GOLEM DI BRINA';
    this.hb = { x: 4, y: 8, w: 24, h: 22 };
    this.state = 'intro'; this.timer = 80; this.anim = 0; this.extraThrow = 0;
  }
  get sortY() { return this.y + 30; }
  get enraged() { return this.hp <= 4; }
  mopts() { return { edgeSolid: true, self: this }; }
  throwBall(g) {
    const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1;
    const sp = this.enraged ? 1.9 : 1.6;
    const pr = new Projectile(this.cx() - 4, this.cy() - 8, dx / d * sp, dy / d * sp, 'ice');
    g.projectiles.push(pr);
    Sound.sfx('icethrow');
  }
  update(g) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0) this.inv--;
    if (this.extraThrow > 0 && --this.extraThrow === 0) this.throwBall(g);
    switch (this.state) {
      case 'intro':
        if (--this.timer <= 0) { this.state = 'walk'; this.timer = 90; Sound.sfx('roar'); }
        return;
      case 'walk': {
        const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1;
        const sp = this.enraged ? 0.72 : 0.55;   // Ciclo 6: un filo più deciso (misurato col bot di tests/duel6.js)
        if (d > 20) moveEntity(this, dx / d * sp, dy / d * sp, this.mopts());
        this.anim += 0.06;
        if (--this.timer <= 0) {
          if (Math.random() < 0.58) { this.state = 'throwPrep'; this.timer = 42; }
          else { this.state = 'stompPrep'; this.timer = 36; }
        }
        break;
      }
      case 'throwPrep':
        if (--this.timer <= 0) {
          this.throwBall(g);
          if (this.enraged) this.extraThrow = 34;
          this.state = 'walk'; this.timer = this.enraged ? 100 : 85;
        }
        break;
      case 'stompPrep':
        if (--this.timer <= 0) {
          Sound.sfx('stomp'); g.shake = 12;
          const n = this.enraged ? 6 : 4;
          for (let i = 0; i < n; i++) g.projectiles.push(new Icicle(24 + Math.random() * 208, 24 + Math.random() * 128, i * 6));
          g.projectiles.push(new Icicle(g.player.cx(), g.player.cy() + 2, 0));
          this.state = 'walk'; this.timer = 80;
        }
        break;
      case 'stun':
        if (this.t % 9 === 0) g.particles.push(new Particle(this.x + 6 + Math.random() * 20, this.y + 10 + Math.random() * 14, 0, -0.3, 20, '#ff9ab8', 1, 0));
        if (--this.timer <= 0) {
          this.state = 'walk'; this.timer = 60; Sound.sfx('freeze');
          g.puff(this.cx(), this.cy(), '#c0e8ff');
        }
        return;   // stordito: non fa danno al contatto
      case 'dying':
        if (this.t % 6 === 0) { g.puff(this.x + Math.random() * 32, this.y + Math.random() * 32, '#c0e8ff'); Sound.sfx('shatter'); g.shake = 4; }
        if (--this.timer <= 0) { this.dead = true; g.onBossDefeated(this); }
        return;
    }
    if (this.calm > 0) { this.calm--; return; }   // appena scrollato il gelo: niente danno al contatto
    this.touchPlayer(g);
  }
  /* colpito dal proprio masso di ghiaccio respinto, o da una bomba: l'armatura si incrina */
  stagger(g) {
    if (this.state === 'stun' || this.state === 'dying' || this.state === 'intro') return false;
    this.state = 'stun'; this.timer = 170; this.flash = 10; this.extraThrow = 0; this.stunHits = 0;
    g.shake = 8; Sound.sfx('shatter'); Sound.sfx('bossHit');
    for (let i = 0; i < 18; i++) g.particles.push(new Particle(this.cx(), this.cy(), (Math.random() - 0.5) * 3.5, -Math.random() * 3, 30, i % 2 ? '#e0f6ff' : '#7ac0e8', 2, 0.15));
    for (const p of g.projectiles) if (p instanceof Icicle) p.dead = true;
    return true;
  }
  bombHit(g) { if (!this.stagger(g) && this.state === 'stun') this.hurt(g, 2); }
  /* Ciclo 6: "tennis di ghiaccio" — da furioso può rimandarti il masso, più veloce: va respinto una seconda volta */
  volley(g, ball) {
    if (!this.enraged || ball.volleyed || this.state === 'stun' || this.state === 'dying' || Math.random() > 0.6) return false;
    ball.volleyed = true; ball.reflected = false; ball.t = 0;
    const p = g.player, dx = p.cx() - ball.x, dy = p.cy() - ball.y, d = Math.hypot(dx, dy) || 1;
    ball.vx = dx / d * 2.4; ball.vy = dy / d * 2.4;
    this.flash = 6; Sound.sfx('reflect'); g.spark(ball.x + 4, ball.y + 4);
    if (!g.s.flags.volleyHint) { g.s.flags.volleyHint = true; g.banner = { text: 'Il Golem rimanda il masso!', t: 100 }; }
    return true;
  }
  hurt(g, d) {
    if (this.state === 'dying' || this.state === 'intro') return;
    if (this.state !== 'stun') {   // armatura intatta: la spada rimbalza
      if (this.inv > 0) return;
      this.inv = 14; Sound.sfx('clank'); g.spark(this.cx(), this.cy() - 4);
      return;
    }
    if (this.inv > 0) return;
    this.hp -= d; this.flash = 14; this.inv = 22; g.shake = 3;
    // Ciclo 6: al massimo 3 colpi per stordimento, poi si scrolla di dosso il gelo (servono 3 respinte vere)
    if (this.hp > 0 && ++this.stunHits >= 3) {
      this.state = 'walk'; this.timer = 70; this.inv = 30; this.calm = 50; Sound.sfx('freeze');
      g.puff(this.cx(), this.cy(), '#c0e8ff'); g.shake = 6;
      const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), dd = Math.hypot(dx, dy) || 1;
      p.kbx = dx / dd * 3; p.kby = dy / dd * 3;   // lo scrollone ti spinge indietro, senza danno
    }
    Sound.sfx('bossHit');
    if (this.hp <= 0) {
      this.hp = 0; this.state = 'dying'; this.timer = 110; Sound.sfx('roar');
      for (const p of g.projectiles) p.dead = true;
      for (const e of g.entities) if (e.enemy && e !== this && !e.dead) e.die(g);
    }
  }
  draw(c) {
    if (this.state === 'dying' && (this.t >> 2) % 2) return;
    let ox = 0, oy = 0;
    if (this.state === 'throwPrep' || this.state === 'stompPrep') ox = (this.t >> 1) % 2 ? 1 : -1;
    if (this.state === 'stompPrep') oy = -Math.min(6, (36 - this.timer) / 4);
    drawShadow(c, this.x + 16, this.y + 30, 26);
    const f = this.state === 'walk' ? (this.anim | 0) % 2 : 0;
    const set = this.state === 'stun' ? SPR.golemCracked : SPR.golem;
    c.drawImage(this.img(set[f]), Math.round(this.x + ox), Math.round(this.y + oy));
    if (this.state === 'throwPrep') {   // masso che si forma tra le mani
      const k = 1 - this.timer / 42;
      c.fillStyle = '#e0f6ff'; c.beginPath(); c.arc(this.x + 16, this.y + 2, 2 + k * 4, 0, Math.PI * 2); c.fill();
    }
    if (this.state === 'stun') {
      for (let i = 0; i < 3; i++) {
        const a = this.t * 0.12 + i * 2.1;
        c.fillStyle = '#fff080'; c.fillRect(Math.round(this.x + 16 + Math.cos(a) * 10), Math.round(this.y + 3 + Math.sin(a) * 3), 2, 2);
      }
    }
  }
}
