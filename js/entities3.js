'use strict';
/* =====================================================================
 *  ENTITIES3 — Ciclo 3 (Agente A):
 *   Hook       l'Arpione di Vesper: si aggancia ai pali `h` e ai forzieri
 *              (ti tira oltre abissi e acqua), stordisce i nemici, recupera
 *              gli oggetti a distanza, strappa la corazza al Re dei Rovi.
 *   RootLine   radici spinate che eruttano lungo una riga/colonna (boss).
 *   ThornKing  il Re dei Rovi con la SECONDA FASE (Forma Spinata).
 * ===================================================================== */
const HOOK_MAX = 124, HOOK_SPD = 5, PULL_SPD = 4;

class Hook {
  constructor(p) {
    this.dir = p.dir; this.v = DIRS[p.dir];
    this.len = 6; this.state = 'out'; this.dead = false; this.grab = null; this.anchor = null; this.t = 0;
    Sound.sfx('hookshot');
  }
  origin(p) { return { x: p.cx() + this.v.x * 4, y: p.cy() - 3 + this.v.y * 3 }; }
  head(p) { const o = this.origin(p); return { x: o.x + this.v.x * this.len, y: o.y + this.v.y * this.len }; }
  update(g) {
    const p = g.player;
    this.t++;
    if (this.state === 'out') {
      for (let s = 0; s < HOOK_SPD && this.state === 'out'; s++) { this.len++; this.probe(g, p); }
      if (this.state === 'out' && this.len >= HOOK_MAX) this.state = 'back';
    } else if (this.state === 'back') {
      this.len -= 6;
      if (this.grab) { const h = this.head(p); this.grab.x = h.x; this.grab.y = h.y; this.grab.z = 0; }
      if (this.len <= 4) {
        this.dead = true;
        if (this.grab && !this.grab.dead) { this.grab.dead = true; g.collect(this.grab); }
      }
    } else if (this.state === 'pull') {
      if (this.t % 7 === 0) Sound.sfx('reel');
      const hit = moveEntity(p, this.v.x * PULL_SPD, this.v.y * PULL_SPD, p.pullOpts);
      const o = this.origin(p);
      this.len = Math.abs((this.anchor.x - o.x) * this.v.x + (this.anchor.y - o.y) * this.v.y);
      if (hit || this.len <= 6 || this.t > 90) { this.dead = true; p.afterPull(g); }
    }
  }
  /* controlla cosa tocca la punta dell'arpione */
  probe(g, p) {
    const h = this.head(p), hb = { x: h.x - 2, y: h.y - 2, w: 4, h: 4 };
    for (const e of g.entities) {
      if (e.dead) continue;
      if (e.enemy && overlap(hb, e.box())) {
        if (e.hookHit) e.hookHit(g, this);
        else this.stunEnemy(g, e);
        this.state = 'back'; return;
      }
      if (e instanceof Chest && overlap(hb, e.box())) { this.anchorAt(g, h); return; }
      if ((e.solid || e.bomb) && overlap(hb, e.box())) { this.clank(g, h); return; }
    }
    for (const pk of g.pickups) if (!pk.dead && overlap(hb, pk.box())) { this.grab = pk; this.state = 'back'; Sound.sfx('hookhit'); return; }
    const t = tileAt(Math.floor(h.x / TS), Math.floor(h.y / TS));
    if (t === null) { this.state = 'back'; return; }
    if (t === 'h') { this.anchorAt(g, h); return; }
    if (TILE_SOLID.has(t) && t !== '~') this.clank(g, h);
  }
  clank(g, h) { Sound.sfx('clank'); g.spark(h.x, h.y); this.state = 'back'; }
  anchorAt(g, h) { this.state = 'pull'; this.anchor = { x: h.x, y: h.y }; Sound.sfx('hookhit'); g.spark(h.x, h.y); }
  stunEnemy(g, e) {
    Sound.sfx('hookhit');
    if (e instanceof BladeTrap || e instanceof Golem) { e.hurt(g); return; }
    if (e.hp <= 1) { e.inv = 0; e.hurt(g, 1, this.dir); return; }
    e.stunT = 110; e.flash = 8;
  }
  draw(c, g) {
    const p = g.player, o = this.origin(p);
    const h = this.state === 'pull' ? this.anchor : this.head(p);
    const dx = h.x - o.x, dy = h.y - o.y, d = Math.hypot(dx, dy);
    for (let i = 0; i < d; i += 3) {
      const x = Math.round(o.x + dx * i / d), y = Math.round(o.y + dy * i / d);
      c.fillStyle = '#1a1420'; c.fillRect(x - 1, y - 1, 3, 3);
      c.fillStyle = (i / 3 | 0) % 2 ? '#d8d8e8' : '#8a8aa0'; c.fillRect(x, y, 1, 1);
    }
    // punta ad artiglio dorato
    const hx = Math.round(h.x), hy = Math.round(h.y), v = this.v;
    c.fillStyle = '#1a1420'; c.fillRect(hx - 3, hy - 3, 7, 7);
    c.fillStyle = '#f0c848'; c.fillRect(hx - 2, hy - 2, 5, 5);
    c.fillStyle = '#fff0a0'; c.fillRect(hx - 1, hy - 1, 2, 2);
    c.fillStyle = '#b08a28';
    if (v.x) { c.fillRect(hx + v.x * 3, hy - 3, 1, 2); c.fillRect(hx + v.x * 3, hy + 2, 1, 2); }
    else { c.fillRect(hx - 3, hy + v.y * 3, 2, 1); c.fillRect(hx + 2, hy + v.y * 3, 2, 1); }
  }
}

/* ------------------- RADICI CHE ERUTTANO DAL PAVIMENTO ------------------- */
class RootLine {
  constructor(axis, idx, delay) {
    this.axis = axis; this.idx = idx; this.t = -(delay || 0);
    this.warn = 58; this.active = 34; this.noCut = true; this.dead = false; this.x = 0; this.y = 0;
  }
  box() { return this.axis === 'row' ? { x: 16, y: this.idx * TS + 3, w: PLAY_W - 32, h: 10 } : { x: this.idx * TS + 3, y: 16, w: 10, h: PLAY_H - 32 }; }
  update(g) {
    this.t++;
    if (this.t === 1) Sound.sfx('roots');
    if (this.t === this.warn) { Sound.sfx('erupt'); g.shake = Math.max(g.shake, 6); }
    if (this.t >= this.warn && this.t < this.warn + this.active) {
      const b = this.box(), p = g.player;
      if (overlap(b, p.box())) {
        const sx = this.axis === 'row' ? p.cx() : b.x + 5, sy = this.axis === 'row' ? b.y + 5 : p.cy();
        p.hurt(g, 1, sx, sy);
      }
    }
    if (this.t >= this.warn + this.active) this.dead = true;
  }
  draw(c) {
    if (this.t <= 0) return;
    const b = this.box(), horiz = this.axis === 'row', len = horiz ? b.w : b.h;
    if (this.t < this.warn) {   // preavviso: crepe che pulsano
      const a = 0.25 + (this.t / this.warn) * 0.55 * (0.6 + 0.4 * Math.sin(this.t * 0.6));
      c.fillStyle = 'rgba(20,6,24,' + a + ')';
      if (horiz) c.fillRect(b.x, b.y + 3, b.w, 4); else c.fillRect(b.x + 3, b.y, 4, b.h);
      c.fillStyle = 'rgba(240,138,192,' + a * 0.8 + ')';
      for (let i = 0; i < len; i += 7) {
        const j = ((i * 13) % 5) - 2;
        if (horiz) c.fillRect(b.x + i, b.y + 5 + j, 3, 1); else c.fillRect(b.x + 5 + j, b.y + i, 1, 3);
      }
      return;
    }
    const k = this.t - this.warn, hgt = Math.min(1, k / 5) * Math.min(1, (this.active - k) / 8);
    for (let i = 0; i < len; i += 8) {
      const h = Math.round((6 + ((i * 7) % 4)) * hgt);
      if (h <= 0) continue;
      const bx = horiz ? b.x + i : b.x + 2, by = horiz ? b.y + 9 : b.y + i + 6;
      c.fillStyle = '#1a0c1e';
      c.fillRect(bx + 1, by - h - 1, 5, h + 2);
      c.fillStyle = '#3f6a32'; c.fillRect(bx + 2, by - h, 3, h);
      c.fillStyle = '#ff6ab0'; c.fillRect(bx + 3, by - h - 1, 1, 2);
    }
  }
}

/* ----------------------- IL RE DEI ROVI (2 fasi) ----------------------- */
class ThornKing extends Boss {
  constructor(x, y) {
    super(x, y); this.phase = 1; this.armored = false; this.cast = 0;
    this.hp = this.maxHp = 16;   // Ciclo 5: era 20 quando la fase 1 era l'unica (bilanciamento misurato col bot di tests/duel.js)
  }
  get title() { return this.phase === 2 ? 'RE DEI ROVI · FORMA SPINATA' : 'RE DEI ROVI'; }
  get enraged() { return this.phase === 2 ? this.hp <= 7 : this.hp <= this.maxHp / 2; }
  update(g) {
    if (this.phase === 1 && this.state !== 'transform') { super.update(g); return; }
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0 && this.state !== 'transform') this.inv--;
    switch (this.state) {
      case 'transform':
        if (this.t % 4 === 0) {
          const a = Math.random() * Math.PI * 2;
          g.particles.push(new Particle(this.cx() + Math.cos(a) * 24, this.cy() + Math.sin(a) * 24, -Math.cos(a) * 1.2, -Math.sin(a) * 1.2, 22, Math.random() < 0.5 ? '#f08ac0' : '#3f6a32', 2, 0));
        }
        if (this.timer % 30 === 0) g.shake = 6;
        if (--this.timer <= 0) {
          this.phase = 2; this.hp = this.maxHp = 12; this.armored = true; this.inv = 0;
          // Ciclo 5: una tregua a metà scontro, le spine cadute lasciano due cuori
          for (const [ox, oy] of [[-40, 30], [40, 30]]) g.pickups.push(new Pickup(Math.max(24, Math.min(232, this.cx() + ox)), Math.max(30, Math.min(150, this.cy() + oy)), 'heart'));
          this.state = 'move'; this.timer = 70; this.pickTarget();
          Sound.music('boss2'); Sound.sfx('roar');
          g.say(g.s.flags.phase2Seen ? ['Re dei Rovi: Le mie spine ricrescono sempre!'] : [
            'Re dei Rovi: Credi di avermi vinto?! Il crepuscolo mi ha donato una nuova pelle!',
            'Una corazza di spine ricopre il Re: la lama della spada non può scalfirla...',
            "Forse l'ARPIONE potrebbe agganciarla e strappargliela di dosso!",
          ]);
          g.s.flags.phase2Seen = true;
        }
        return;
      case 'move': {
        const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy) || 1, sp = this.enraged ? 1.1 : 0.8;
        if (d > 2) moveEntity(this, dx / d * sp, dy / d * sp, this.mopts());
        if (--this.timer <= 0 || d <= 2) {
          const r = Math.random(), minions = g.entities.filter(e => e.enemy && !e.dead && e !== this).length;
          if (this.enraged && r < 0.2 && minions < 2) { this.state = 'summon'; this.timer = 40; }
          else if (r < 0.55) { this.state = 'roots'; this.timer = 100; this.cast = 0; }
          else { this.state = 'ring'; this.timer = 40; }
        }
        break;
      }
      case 'roots':
        if (this.cast === 0) {
          this.cast = 1;
          const p = g.player, prow = Math.max(1, Math.min(RH - 2, Math.floor(p.cy() / TS))), pcol = Math.max(1, Math.min(RW - 2, Math.floor(p.cx() / TS)));
          const lines = [Math.random() < 0.5 ? ['row', prow] : ['col', pcol]];
          const n = this.enraged ? 3 : 2;
          while (lines.length < n) {
            const ax = Math.random() < 0.5 ? 'row' : 'col', idx = ax === 'row' ? 2 + (Math.random() * 7 | 0) : 2 + (Math.random() * 12 | 0);
            if (!lines.some(l => l[0] === ax && Math.abs(l[1] - idx) < 2)) lines.push([ax, idx]);
          }
          lines.forEach((l, i) => g.projectiles.push(new RootLine(l[0], l[1], i * 14)));
        }
        if (--this.timer <= 0) { this.state = 'move'; this.timer = 50; this.pickTarget(); }
        break;
      case 'ring':
        if (--this.timer <= 0) {
          this.ring(this.enraged ? 16 : 12, Math.random());
          if (this.enraged) this.wave = 18;
          this.state = 'move'; this.timer = 70; this.pickTarget();
        }
        break;
      case 'summon':
        if (--this.timer <= 0) {
          for (const [ox, oy] of [[-22, 12], [30, 12]]) {
            const s = new Skeleton(Math.max(16, Math.min(224, this.x + ox)), Math.max(16, Math.min(144, this.y + oy)));
            s.hp = 2;
            if (!boxHitsSolid(s.box(), s.mopts())) { g.entities.push(s); g.puff(s.cx(), s.cy(), '#f08ac0'); }
          }
          this.state = 'move'; this.timer = 60; this.pickTarget();
        }
        break;
      case 'bare':   // corazza strappata: stordito e vulnerabile
        if (this.t % 10 === 0) g.particles.push(new Particle(this.x + 6 + Math.random() * 20, this.y + 8 + Math.random() * 16, 0, -0.3, 20, '#ffd0e8', 1, 0));
        if (--this.timer <= 0) { this.state = 'regrow'; this.timer = 36; Sound.sfx('roots'); }
        return;
      case 'regrow':
        if (--this.timer <= 0) { this.armored = true; this.state = 'move'; this.timer = 40; this.pickTarget(); Sound.sfx('roar'); }
        return;
      case 'dying':
        if (this.t % 5 === 0) { g.puff(this.x + Math.random() * 32, this.y + Math.random() * 32, Math.random() < 0.5 ? '#f08ac0' : '#ffe8a0'); Sound.sfx('explode'); g.shake = 4; }
        if (--this.timer <= 0) { this.dead = true; g.onBossDefeated(this); }
        return;
    }
    if (this.wave > 0 && --this.wave === 0) this.ring(12, Math.PI / 12);
    this.touchPlayer(g);
  }
  startTransform(g) {
    this.hp = 0; this.state = 'transform'; this.timer = 150; this.inv = 999; this.flash = 20; this.wave = 0;
    for (const p of g.projectiles) p.dead = true;
    for (const e of g.entities) if (e.enemy && e !== this && !e.dead) e.die(g);
    Sound.music(null); Sound.sfx('transform');
  }
  rip(g) {
    this.armored = false; this.state = 'bare'; this.timer = 165; this.inv = 0; this.flash = 12;
    g.shake = 10; Sound.sfx('rip'); Sound.sfx('bossHit');
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 2.5;
      g.particles.push(new Particle(this.cx(), this.cy(), Math.cos(a) * v, Math.sin(a) * v - 1, 34, i % 3 ? '#3f6a32' : '#ff6ab0', 2, 0.12));
    }
  }
  hookHit(g) {
    if (this.phase === 2) {
      if (this.armored && ['move', 'roots', 'ring', 'summon'].includes(this.state)) this.rip(g);
      else { Sound.sfx('clank'); }
    } else if (this.state === 'move' || this.state === 'ring') {   // fase 1: l'arpione lo blocca per un attimo
      this.state = 'stun'; this.timer = 45; Sound.sfx('hookhit');
    }
  }
  bombHit(g) {
    if (this.phase === 2 && this.armored) { if (this.state !== 'transform' && this.state !== 'dying') this.rip(g); }
    else { this.inv = 0; this.hurt(g, 2); }
  }
  hurt(g, d) {
    if (this.state === 'transform' || this.state === 'dying' || this.state === 'intro') return;
    if (this.phase === 1) {
      if (this.inv > 0) return;
      this.hp -= (this.state === 'stun' ? 2 : 1) * d;
      this.flash = 14; this.inv = 18; g.shake = 3; Sound.sfx('bossHit');
      if (this.hp <= 0) this.startTransform(g);
      return;
    }
    if (this.inv > 0) return;
    if (this.armored) {   // la spada rimbalza sulle spine
      this.inv = 14; Sound.sfx('clank'); g.spark(this.cx(), this.cy() - 4);
      return;
    }
    this.hp -= d; this.flash = 14; this.inv = 20; g.shake = 3; Sound.sfx('bossHit');
    if (this.hp <= 0) {
      this.hp = 0; this.state = 'dying'; this.timer = 150; Sound.sfx('roar'); Sound.music(null);
      for (const p of g.projectiles) p.dead = true;
      for (const e of g.entities) if (e.enemy && e !== this && !e.dead) e.die(g);
    }
  }
  draw(c, g) {
    if (this.phase === 1 && this.state !== 'transform') { super.draw(c, g); return; }
    if (this.state === 'dying' && (this.t >> 2) % 2) return;
    let ox = 0, oy = Math.sin(this.t * 0.07) * 1.5;
    if (this.state === 'transform' || this.state === 'ring' || this.state === 'roots') ox = (this.t >> 1) % 2 ? 1 : -1;
    if (this.state === 'bare') oy = 3;
    drawShadow(c, this.x + 16, this.y + 29, 24);
    const f = (this.t >> 4) & 1;
    let img = this.armored || (this.state === 'transform' && (this.t >> 3) % 2) ? SPR.bossArmor[f] : SPR.boss[f];
    if (this.state === 'regrow' && (this.t >> 2) % 2) img = SPR.bossArmor[f];
    c.drawImage(this.img(img), Math.round(this.x + ox), Math.round(this.y + oy));
    if (this.state === 'bare') {
      for (let i = 0; i < 3; i++) {
        const a = this.t * 0.12 + i * 2.1;
        c.fillStyle = '#fff080'; c.fillRect(Math.round(this.x + 16 + Math.cos(a) * 10), Math.round(this.y + 4 + Math.sin(a) * 3), 2, 2);
      }
    }
  }
}
