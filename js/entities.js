'use strict';
/* =====================================================================
 *  ENTITIES — fisica a tile, giocatore, nemici, boss, NPC, forzieri,
 *  oggetti raccoglibili, proiettili e particelle.
 *  Convenzione: (x,y) = angolo in alto a sinistra dello sprite 16x16,
 *  in pixel relativi all'area di gioco (0..256 x 0..176).
 *  hb = hitbox relativa a (x,y).
 * ===================================================================== */
const DIRS = [
  { x: 0, y: 1, name: 'down' }, { x: 0, y: -1, name: 'up' },
  { x: -1, y: 0, name: 'left' }, { x: 1, y: 0, name: 'right' },
];
const ATK = 15; // durata del fendente in frame

function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function tileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= RW || ty >= RH) return null;
  return Game.tiles[ty][tx];
}
/* Ritorna il primo ostacolo trovato dalla box, o null.
 * opts: edgeSolid (bordo stanza solido), warpSolid (i warp bloccano),
 *       noTiles (ignora i tile: creature volanti), entities (blocca su NPC/forzieri), self */
function boxHitsSolid(b, opts) {
  opts = opts || {};
  if (opts.edgeSolid && (b.x < 0 || b.y < 0 || b.x + b.w > PLAY_W || b.y + b.h > PLAY_H)) return { edge: true };
  if (!opts.noTiles) {
    const x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - 0.01) / TS);
    const y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - 0.01) / TS);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = tileAt(tx, ty);
      if (t === null) continue;
      if (opts.overWater && t === '~') continue;            // Ciclo 3: tirati dall'arpione si sorvola l'acqua
      if (TILE_SOLID.has(t) || (opts.warpSolid && TILE_WARP.has(t)) || (opts.pitSolid && t === '_')) return { t, tx, ty };
    }
  }
  if (opts.entities) {
    for (const e of Game.entities) {
      if (e.solid && !e.dead && e !== opts.self && overlap(b, e.box())) return { e };
    }
  }
  return null;
}
function moveEntity(e, dx, dy, opts) {
  let hit = null;
  if (dx) {
    const steps = Math.ceil(Math.abs(dx)), sx = dx / steps;
    for (let i = 0; i < steps; i++) {
      e.x += sx;
      const h = boxHitsSolid(e.box(), opts);
      if (h) { e.x -= sx; hit = h; break; }
    }
  }
  if (dy) {
    const steps = Math.ceil(Math.abs(dy)), sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      e.y += sy;
      const h = boxHitsSolid(e.box(), opts);
      if (h) { e.y -= sy; hit = h; break; }
    }
  }
  return hit;
}
function drawShadow(c, cx, cy, w) {
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.fillRect(Math.round(cx - w / 2) + 1, Math.round(cy) - 1, w - 2, 1);
  c.fillRect(Math.round(cx - w / 2), Math.round(cy), w, 2);
  c.fillRect(Math.round(cx - w / 2) + 1, Math.round(cy) + 2, w - 2, 1);
}

class Entity {
  constructor(x, y) { this.x = x; this.y = y; this.hb = { x: 2, y: 2, w: 12, h: 12 }; this.dead = false; this.solid = false; }
  box() { return { x: this.x + this.hb.x, y: this.y + this.hb.y, w: this.hb.w, h: this.hb.h }; }
  cx() { return this.x + this.hb.x + this.hb.w / 2; }
  cy() { return this.y + this.hb.y + this.hb.h / 2; }
  get sortY() { return this.y + this.hb.y + this.hb.h; }
  update() {}
  draw() {}
}

/* ------------------------------- GIOCATORE ------------------------------- */
class Player extends Entity {
  constructor(x, y) {
    super(x, y);
    this.hb = { x: 3, y: 8, w: 10, h: 8 };
    this.dir = 0; this.anim = 0; this.moving = false;
    this.attackT = 0; this.hurtT = 0; this.kbx = 0; this.kby = 0; this.msgCd = 0;
    this.charge = 0; this.spinT = 0; this.spinHit = null; this.slide = null; this.pushT = 0; this.pushing = null;
    this.mopts = { entities: true, self: this };
    this.pullOpts = { entities: true, overWater: true, self: this };   // tirati dall'arpione
    this.hook = null; this.fallT = 0;
  }
  onIce() { return tileAt(Math.floor(this.cx() / TS), Math.floor(this.cy() / TS)) === 'q'; }
  update(g) {
    if (this.fallT > 0) { this.updateFall(g); return; }
    if (this.hurtT > 0) this.hurtT--;
    if (this.msgCd > 0) this.msgCd--;
    if (Math.abs(this.kbx) + Math.abs(this.kby) > 0.15) {
      moveEntity(this, this.kbx, this.kby, this.mopts);
      this.kbx *= 0.78; this.kby *= 0.78; this.slide = null;
    } else { this.kbx = this.kby = 0; }
    if (this.hook) {   // Ciclo 3: arpione in azione, il giocatore resta fermo
      const hk = this.hook;
      hk.update(g);   // può terminare con una caduta (startFall azzera this.hook)
      if (!hk.dead) return;
      if (this.hook === hk) this.hook = null;
      if (this.fallT > 0) return;
    }
    if (this.overPit()) { this.startFall(g, false); return; }
    this.markSafe();
    if (Input.hit('swap')) g.swapItem();
    if (this.spinT > 0) { this.spinT--; this.spinHits(g); return; }
    if (this.attackT > 0) {
      this.attackT--; this.swordHits(g);
      if (this.attackT === 0 && Input.held('action')) this.charge = 1;   // tieni premuto: carica il fendente rotante
      return;
    }
    if (this.charge > 0) {
      if (Input.held('action')) { if (++this.charge === CHARGE_T) Sound.sfx('charge'); }
      else {
        const full = this.charge >= CHARGE_T;
        this.charge = 0;
        if (full) { this.spinT = SPIN_T; this.spinHit = new Set(); this.slide = null; Sound.sfx('spin'); this.spinHits(g); return; }
      }
    }
    if (Input.hit('item') && !this.charge) g.useItem();

    // --- ghiaccio: una volta lanciato, scivoli finché non urti qualcosa ---
    if (this.slide) {
      if (!this.onIce()) this.slide = null;
      else {
        const h = moveEntity(this, this.slide.x * 2, this.slide.y * 2, this.mopts);
        this.moving = false; this.anim = 0;
        if (h) { this.slide = null; this.onBump(g, h); }
        if (Input.hit('action') && !this.charge && g.s.items.sword) { this.attackT = ATK; Sound.sfx('sword'); this.swordHits(g); }
        return;
      }
    }

    if (Input.hit('action') && !this.charge) {
      if (g.tryInteract()) return;
      if (g.s.items.sword) { this.attackT = ATK; Sound.sfx('sword'); this.swordHits(g); return; }
    }
    let ix = 0, iy = 0;
    if (Input.held('left')) ix--;
    if (Input.held('right')) ix++;
    if (Input.held('up')) iy--;
    if (Input.held('down')) iy++;
    this.moving = !!(ix || iy);
    if (!this.moving) { this.anim = 0; this.pushT = 0; return; }
    const cur = DIRS[this.dir];
    if (!this.charge && !((ix && cur.x === ix) || (iy && cur.y === iy))) this.dir = ix ? (ix < 0 ? 2 : 3) : (iy > 0 ? 0 : 1);
    if (this.onIce() && !this.charge) { this.startSlide(g, ix, iy); return; }
    const sp = ((ix && iy) ? 1.3 * 0.72 : 1.3) * (this.charge ? 0.55 : 1);
    this.pushing = null;
    const hx = ix ? moveEntity(this, ix * sp, 0, this.mopts) : null;
    if (hx) { this.onBump(g, hx); if (!iy && !hx.e) this.nudge(ix, 0); }
    const hy = iy ? moveEntity(this, 0, iy * sp, this.mopts) : null;
    if (hy) { this.onBump(g, hy); if (!ix && !hy.e) this.nudge(0, iy); }
    if (this.pushing && !(ix && iy)) {
      if (++this.pushT > 12) { this.pushT = 0; this.pushing.tryPush(g, this.dir); }
    } else this.pushT = 0;
    this.anim += 0.14;
  }
  /* inizia una scivolata sul ghiaccio: allinea il giocatore alla riga/colonna di tile */
  startSlide(g, ix, iy) {
    const horiz = ix && (!iy || DIRS[this.dir].x !== 0);
    const v = horiz ? { x: ix, y: 0 } : { x: 0, y: iy };
    this.dir = horiz ? (ix < 0 ? 2 : 3) : (iy > 0 ? 0 : 1);
    const ox = this.x, oy = this.y;
    if (horiz) this.y = Math.floor(this.cy() / TS) * TS + 8 - this.hb.y - this.hb.h / 2;
    else this.x = Math.floor(this.cx() / TS) * TS + 8 - this.hb.x - this.hb.w / 2;
    if (boxHitsSolid(this.box(), this.mopts)) { this.x = ox; this.y = oy; }
    const h = moveEntity(this, v.x * 2, v.y * 2, this.mopts);
    if (h) { this.onBump(g, h); return; }
    this.slide = v; this.moving = false;
    Sound.sfx('slide');
  }
  /* Aiuto agli angoli: se sbatti di poco contro uno spigolo, scivoli dentro il varco */
  nudge(ix, iy) {
    for (let k = 1; k <= 7; k++) for (const s of [-1, 1]) {
      const b = this.box();
      b.x += ix + (iy ? s * k : 0); b.y += iy + (ix ? s * k : 0);
      if (!boxHitsSolid(b, this.mopts)) { moveEntity(this, iy ? s : 0, ix ? s : 0, this.mopts); return; }
    }
  }
  onBump(g, h) {
    if (h.e && h.e.pushable) {   // spingi solo se sei ben allineato al blocco
      const v = DIRS[this.dir], b = h.e;
      const off = v.x ? Math.abs(this.cy() - (b.y + 8)) : Math.abs(this.cx() - (b.x + 8));
      const toward = v.x ? Math.sign(b.x + 8 - this.cx()) === v.x : Math.sign(b.y + 8 - this.cy()) === v.y;
      if (off < 7 && toward) this.pushing = b;
      return;
    }
    if (!h.t) return;
    if (h.t === 'L') g.tryUnlock(h.tx, h.ty, 'key');
    else if (h.t === 'G') g.tryUnlock(h.tx, h.ty, 'bigkey');
    else if (h.t === 'V' && !g.s.items.sword && this.msgCd === 0) {
      this.msgCd = 240;
      g.say(['Rovi fitti e spinosi. Ti servirebbe una lama per tagliarli...']);
    } else if (h.t === 'Q' && this.msgCd === 0 && !this.slide) {
      this.msgCd = 300;
      g.say([g.s.items.bombs ? 'È incrinato... Una BOMBA (' + bombKey() + ') lo farebbe saltare!' : 'Una superficie piena di crepe. Sembra fragile... ma la spada non basta.']);
    }
  }
  swordBox() {
    const x = this.x, y = this.y;
    switch (this.dir) {
      case 0: return { x: x + 1, y: y + 13, w: 14, h: 13 };
      case 1: return { x: x + 1, y: y - 8, w: 14, h: 13 };
      case 2: return { x: x - 11, y: y + 4, w: 14, h: 11 };
      default: return { x: x + 13, y: y + 4, w: 14, h: 11 };
    }
  }
  swordHits(g) {
    const t = ATK - this.attackT;
    if (t > ATK - 3) return;
    const sb = this.swordBox();
    const dmg = g.s.items.dawnsword ? 2 : 1;
    for (const e of g.entities) if (e.enemy && !e.dead && overlap(sb, e.box())) e.hurt(g, dmg, this.dir);
    this.hitProjectiles(g, sb);
    this.cutTiles(g, sb);
  }
  hitProjectiles(g, sb) {
    for (const p of g.projectiles) {
      if (p.dead || p.noCut || p.reflected || !overlap(sb, p.box())) continue;
      if (p.kind === 'ice') p.reflect(g);
      else { p.dead = true; g.spark(p.x + 2, p.y + 2); Sound.sfx('bump'); }
    }
  }
  cutTiles(g, sb) {
    const x0 = Math.floor(sb.x / TS), x1 = Math.floor((sb.x + sb.w - 1) / TS);
    const y0 = Math.floor(sb.y / TS), y1 = Math.floor((sb.y + sb.h - 1) / TS);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const tl = tileAt(tx, ty);
      if (tl === 'B' || tl === 'V') g.cutTile(tx, ty);
    }
  }
  /* fendente rotante: colpisce tutto intorno, 2 danni, una volta per nemico */
  spinHits(g) {
    const cx = this.cx(), cy = this.cy() - 2;
    const sb = { x: cx - 22, y: cy - 20, w: 44, h: 40 };
    for (const e of g.entities) {
      if (!e.enemy || e.dead || this.spinHit.has(e) || !overlap(sb, e.box())) continue;
      this.spinHit.add(e);
      const dx = e.cx() - cx, dy = e.cy() - cy;
      e.inv = 0;
      e.hurt(g, g.s.items.dawnsword ? 3 : 2, Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0));
    }
    this.hitProjectiles(g, sb);
    if (this.spinT === SPIN_T - 6) this.cutTiles(g, { x: cx - 18, y: cy - 16, w: 36, h: 32 });
  }
  hurt(g, dmg, sx, sy) {
    if (this.hurtT > 0 || g.dialog || g.state !== 'play' || this.fallT > 0) return;
    if (this.hook) { if (this.hook.state === 'pull') return; this.hook.dead = true; this.hook = null; }
    g.s.hp = Math.max(0, g.s.hp - diffDamage(dmg));
    this.hurtT = 70;
    const dx = this.cx() - sx, dy = this.cy() - sy, d = Math.hypot(dx, dy) || 1;
    this.kbx = dx / d * 3.5; this.kby = dy / d * 3.5;
    this.attackT = 0; this.charge = 0; this.slide = null;
    Sound.sfx('hurt'); g.shake = 6;
    if (g.s.hp <= 0) g.onPlayerDeath();
  }
  /* Ciclo 4: ricorda l'ultima posizione "sicura" (lontana almeno 4 px da abissi e acqua) */
  markSafe() {
    if (this.kbx || this.kby || this.slide || this.hurtT > 50) return;
    const b = this.box();
    for (let ty = Math.floor((b.y - 4) / TS); ty <= Math.floor((b.y + b.h + 3) / TS); ty++)
      for (let tx = Math.floor((b.x - 4) / TS); tx <= Math.floor((b.x + b.w + 3) / TS); tx++) {
        const t = tileAt(tx, ty);
        if (t === '_' || t === '~') return;
      }
    this.safe = { x: this.x, y: this.y };
  }
  /* ---------- Ciclo 3: abissi e cadute ---------- */
  overPit() { return tileAt(Math.floor(this.cx() / TS), Math.floor(this.cy() / TS)) === '_'; }
  startFall(g, water) {
    this.fallT = 40; this.fallWater = !!water;
    this.attackT = 0; this.charge = 0; this.spinT = 0; this.slide = null; this.kbx = this.kby = 0;
    if (this.hook) { this.hook.dead = true; this.hook = null; }
    Sound.sfx(water ? 'splash' : 'fall');
    if (water) for (let i = 0; i < 14; i++) g.particles.push(new Particle(this.cx(), this.cy() - 2, (Math.random() - 0.5) * 2.5, -Math.random() * 2.5, 26, i % 2 ? '#e0f0ff' : '#6c9fd8', 2, 0.12));
  }
  updateFall(g) {
    if (--this.fallT > 0) return;
    const e = this.safe || g.entry || { x: this.x, y: this.y };   // Ciclo 4: si riparte dall'ultimo punto sicuro
    this.x = e.x; this.y = e.y; this.hurtT = 60;
    g.s.hp = Math.max(0, g.s.hp - diffDamage(1));
    Sound.sfx('hurt');
    if (g.s.hp <= 0) g.onPlayerDeath();
  }
  /* fine della trazione: se sei finito sull'abisso o nell'acqua, ci cadi */
  afterPull(g) {
    if (this.overPit()) return this.startFall(g, false);
    const b = this.box();
    for (let ty = Math.floor(b.y / TS); ty <= Math.floor((b.y + b.h - 0.01) / TS); ty++)
      for (let tx = Math.floor(b.x / TS); tx <= Math.floor((b.x + b.w - 0.01) / TS); tx++)
        if (tileAt(tx, ty) === '~') return this.startFall(g, true);
  }
  draw(c, g) {
    if (this.fallT > 0) {   // caduta: l'eroe rimpicciolisce e sparisce
      const k = this.fallT / 40;
      if (this.fallWater) {
        c.strokeStyle = 'rgba(220,240,255,' + k + ')'; c.lineWidth = 1;
        c.beginPath(); c.ellipse(this.cx(), this.cy(), 10 - k * 6, 4 - k * 2, 0, 0, Math.PI * 2); c.stroke();
        return;
      }
      const s = Math.max(2, Math.round(16 * k));
      c.drawImage(SPR.hero[DIRS[this.dir].name][0], Math.round(this.cx() - s / 2), Math.round(this.cy() - s * 0.75), s, s);
      return;
    }
    if (this.hook) this.hook.draw(c, g);
    if (this.hurtT > 0 && (this.hurtT >> 2) % 2 === 0 && !g.itemGet) return;
    const x = Math.round(this.x), y = Math.round(this.y);
    drawShadow(c, x + 8, y + 15, 10);
    if (g.itemGet) {
      c.drawImage(SPR.hero.down[0], x, y);
      const ic = ICON[g.itemGet] || ICON.gem;
      const s = ic.width <= 8 ? 2 : 1;
      c.drawImage(ic, x + 8 - ic.width * s / 2, y - ic.height * s - 1, ic.width * s, ic.height * s);
      return;
    }
    if (this.spinT > 0) {   // fendente rotante: l'eroe gira su se stesso
      const k = 1 - this.spinT / SPIN_T, a = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][this.dir] + k * Math.PI * 2;
      const fd = [3, 0, 2, 1][((k * 4) | 0) % 4];
      const hx = x + 8, hy = y + 10;
      c.fillStyle = 'rgba(200,235,255,0.35)';
      for (let i = 0; i < 18; i++) { const aa = a - i * 0.25; c.fillRect(Math.round(hx + Math.cos(aa) * 16), Math.round(hy + Math.sin(aa) * 15), 3, 3); }
      const behind = Math.sin(a) < 0;
      if (behind) this.drawBlade(c, hx, hy, a);
      c.drawImage(SPR.hero[DIRS[fd].name][0], x, y);
      if (!behind) this.drawBlade(c, hx, hy, a);
      return;
    }
    const d = DIRS[this.dir].name;
    const frame = this.attackT > 0 ? 0 : (this.moving ? (this.anim | 0) % 4 : 0);
    const spr = SPR.hero[d][frame];
    const swordBehind = (this.attackT > 0 || this.charge > 0) && this.dir === 1;
    if (swordBehind) this.drawSword(c, x, y);
    c.drawImage(spr, x, y);
    if ((this.attackT > 0 || this.charge > 0) && !swordBehind) this.drawSword(c, x, y);
  }
  drawSword(c, x, y) {
    const base = [Math.PI / 2, -Math.PI / 2, Math.PI, 0][this.dir];
    const hx = x + 8 + DIRS[this.dir].x * 3, hy = y + 10 + DIRS[this.dir].y * 2;
    if (this.charge > 0) {   // spada tesa in avanti mentre si carica
      this.drawBlade(c, hx, hy, base);
      if (this.charge >= CHARGE_T && (this.charge >> 2) % 2) {
        const tx = hx + Math.cos(base) * 13, ty = hy + Math.sin(base) * 13;
        c.fillStyle = '#ffffff'; c.fillRect(Math.round(tx) - 2, Math.round(ty), 5, 1); c.fillRect(Math.round(tx), Math.round(ty) - 2, 1, 5);
      }
      return;
    }
    const p = 1 - this.attackT / ATK;
    const e = 1 - Math.pow(1 - Math.min(1, p * 1.6), 3);
    const side = (this.dir === 0 || this.dir === 2) ? 1 : -1;
    const a = base + side * (1.3 - 1.7 * e);
    // scia del fendente
    c.fillStyle = 'rgba(220,240,255,0.45)';
    for (let k = 1; k < 6; k++) {
      const aa = base + side * (1.3 - 1.7 * Math.max(0, e - k * 0.09));
      c.fillRect(Math.round(hx + Math.cos(aa) * 12), Math.round(hy + Math.sin(aa) * 12), 2, 2);
    }
    this.drawBlade(c, hx, hy, a);
  }
  drawBlade(c, hx, hy, a) {
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 0; i < 14; i++) {
      const px = Math.round(hx + ca * i), py = Math.round(hy + sa * i);
      if (i < 3) { c.fillStyle = '#7a4a24'; c.fillRect(px, py, 1, 1); }
      else if (i === 3) { c.fillStyle = '#e8c050'; c.fillRect(px - 1, py - 1, 3, 3); }
      else { c.fillStyle = '#1a1420'; c.fillRect(px, py, 2, 2); c.fillStyle = i > 11 ? '#ffffff' : (Game.s.items.dawnsword ? '#ffd870' : '#bfe0ff'); c.fillRect(px, py, 1, 1); }
    }
  }
}

/* -------------------------------- NEMICI -------------------------------- */
class Enemy extends Entity {
  constructor(x, y) {
    super(x, y);
    this.enemy = true; this.hp = 2; this.dmg = 1;
    this.flash = 0; this.inv = 0; this.kbx = 0; this.kby = 0;
    this.t = Math.random() * 60 | 0; this.timer = 30;
  }
  mopts() { return { warpSolid: true, edgeSolid: true, entities: true, pitSolid: true, self: this }; }
  hurt(g, d, dir) {
    if (this.inv > 0) return;
    this.stunT = 0;
    this.hp -= d; this.flash = 12; this.inv = 14;
    const v = DIRS[dir]; this.kbx = v.x * 3.2; this.kby = v.y * 3.2;
    Sound.sfx('hit');
    if (this.hp <= 0) this.die(g);
  }
  die(g) { this.dead = true; g.puff(this.cx(), this.cy()); Sound.sfx('kill'); g.dropLoot(this.cx(), this.cy()); }
  /* ritorna true se il nemico è in contraccolpo (stordito) */
  baseUpdate() {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0) this.inv--;
    if (this.stunT > 0) { this.stunT--; return true; }   // stordito dall'arpione
    if (Math.abs(this.kbx) + Math.abs(this.kby) > 0.3) {
      moveEntity(this, this.kbx, this.kby, this.mopts());
      this.kbx *= 0.75; this.kby *= 0.75;
      return true;
    }
    this.kbx = this.kby = 0;
    return false;
  }
  touchPlayer(g) { if (overlap(this.box(), g.player.box())) g.player.hurt(g, this.dmg, this.cx(), this.cy()); }
  img(spr) { return this.flash > 0 && (this.flash >> 1) % 2 === 0 ? whiteOf(spr) : spr; }
}

class Slime extends Enemy {
  constructor(x, y, blue) {   // blue: true = slime blu, 'ice' = slime di ghiaccio
    super(x, y);
    this.ice = blue === 'ice';
    this.blue = !!blue; this.hp = blue ? 3 : 2; this.speed = this.ice ? 0.7 : blue ? 0.8 : 0.5;
    this.hb = { x: 2, y: 6, w: 12, h: 9 }; this.state = 0; this.vx = 0; this.vy = 0;
  }
  update(g) {
    if (this.baseUpdate()) { this.touchPlayer(g); return; }
    if (--this.timer <= 0) {
      if (this.state === 0) {
        this.state = 1; this.timer = 30 + (Math.random() * 50 | 0);
        let d = DIRS[Math.random() * 4 | 0];
        if (this.blue && Math.random() < 0.6) {
          const dx = g.player.cx() - this.cx(), dy = g.player.cy() - this.cy();
          d = Math.abs(dx) > Math.abs(dy) ? DIRS[dx < 0 ? 2 : 3] : DIRS[dy < 0 ? 1 : 0];
        }
        this.vx = d.x * this.speed; this.vy = d.y * this.speed;
      } else { this.state = 0; this.timer = 20 + (Math.random() * 40 | 0); this.vx = this.vy = 0; }
    }
    if (this.state === 1 && moveEntity(this, this.vx, this.vy, this.mopts())) { this.vx *= -1; this.vy *= -1; }
    this.touchPlayer(g);
  }
  draw(c) {
    const sq = this.state === 1 ? Math.sin(this.t * 0.3) : Math.sin(this.t * 0.08) * 0.4;
    const w = Math.round(16 + sq * 2), h = Math.round(16 - sq * 2);
    drawShadow(c, this.x + 8, this.y + 14, 12);
    c.drawImage(this.img(this.ice ? SPR.slimeIce : this.blue ? SPR.slimeBlue : SPR.slime), Math.round(this.x + (16 - w) / 2), Math.round(this.y + 16 - h), w, h);
  }
}

class Bat extends Enemy {
  constructor(x, y, ice) {
    super(x, y);
    this.ice = !!ice; this.maxSp = ice ? 1.7 : 1.35;
    this.hp = ice ? 2 : 1; this.hb = { x: 3, y: 5, w: 10, h: 7 };
    this.rest = 40 + (Math.random() * 60 | 0); this.vx = 0; this.vy = 0; this.tx = x; this.ty = y;
  }
  mopts() { return { edgeSolid: true, noTiles: true, self: this }; }
  pickTarget(g) {
    const p = g.player;
    this.tx = p.x + (Math.random() - 0.5) * 70; this.ty = p.y + (Math.random() - 0.5) * 70;
    this.timer = 60 + (Math.random() * 50 | 0);
  }
  update(g) {
    if (this.baseUpdate()) { this.touchPlayer(g); return; }
    if (this.rest > 0) { if (--this.rest === 0) this.pickTarget(g); }
    else {
      this.timer--;
      const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy) || 1;
      this.vx += dx / d * 0.09; this.vy += dy / d * 0.09;
      const sp = Math.hypot(this.vx, this.vy);
      if (sp > this.maxSp) { this.vx *= this.maxSp / sp; this.vy *= this.maxSp / sp; }
      this.x = Math.max(12, Math.min(PLAY_W - 28, this.x + this.vx));
      this.y = Math.max(8, Math.min(PLAY_H - 28, this.y + this.vy));
      if (this.timer <= 0 || d < 6) {
        if (Math.random() < 0.3) { this.rest = 40 + (Math.random() * 60 | 0); this.vx = this.vy = 0; }
        else this.pickTarget(g);
      }
    }
    this.touchPlayer(g);
  }
  draw(c) {
    const f = this.rest > 0 ? 1 : (this.t >> 3) & 1;
    const bob = this.rest > 0 ? 0 : Math.sin(this.t * 0.2) * 2;
    drawShadow(c, this.x + 8, this.y + 18, 8);
    c.drawImage(this.img((this.ice ? SPR.batIce : SPR.bat)[f]), Math.round(this.x), Math.round(this.y + bob));
  }
}

class Plant extends Enemy {   // pianta sputa-semi: immobile, spara verso il giocatore
  constructor(x, y) {
    super(x, y);
    this.hp = 2; this.hb = { x: 2, y: 3, w: 12, h: 12 }; this.timer = 60 + (Math.random() * 60 | 0);
  }
  hurt(g, d, dir) { super.hurt(g, d, dir); this.kbx = this.kby = 0; }
  update(g) {
    this.baseUpdate();
    if (--this.timer <= 0) {
      const p = g.player;
      const dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1;
      if (d < 150) { g.projectiles.push(new Projectile(this.cx() - 2, this.cy() - 4, dx / d * 1.6, dy / d * 1.6, 'seed')); Sound.sfx('shoot'); }
      this.timer = 100 + (Math.random() * 50 | 0);
    }
    this.touchPlayer(g);
  }
  draw(c) { c.drawImage(this.img(SPR.plant[this.timer < 18 ? 1 : 0]), Math.round(this.x), Math.round(this.y)); }
}

class Skeleton extends Enemy {   // armatura vivente
  constructor(x, y) {
    super(x, y);
    this.hp = 4; this.dmg = 2; this.dir = 0; this.anim = 0;
    this.hb = { x: 3, y: 6, w: 10, h: 10 };
  }
  hurt(g, d, dir) { super.hurt(g, d, dir); this.kbx *= 1.3; this.kby *= 1.3; }
  update(g) {
    if (this.baseUpdate()) { this.touchPlayer(g); return; }
    const p = g.player;
    const dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy);
    const chase = d < 95;
    if (--this.timer <= 0) {
      if (chase) { this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); this.timer = 22; }
      else { this.dir = Math.random() * 4 | 0; this.timer = 40 + (Math.random() * 40 | 0); }
    }
    const v = DIRS[this.dir], sp = chase ? 0.75 : 0.45;
    if (moveEntity(this, v.x * sp, v.y * sp, this.mopts())) { this.dir = Math.random() * 4 | 0; this.timer = 20; }
    this.anim += 0.1;
    this.touchPlayer(g);
  }
  draw(c) {
    const spr = SPR.people.skeleton[DIRS[this.dir].name][(this.anim | 0) % 4];
    drawShadow(c, this.x + 8, this.y + 15, 10);
    c.drawImage(this.img(spr), Math.round(this.x), Math.round(this.y));
    // piccolo scudo arrugginito
    const sx = Math.round(this.x) + (this.dir === 2 ? 1 : this.dir === 3 ? 11 : 11), sy = Math.round(this.y) + 9;
    if (this.dir !== 1) { c.fillStyle = '#5a5a62'; c.fillRect(sx, sy, 4, 5); c.fillStyle = '#9a6a3a'; c.fillRect(sx + 1, sy + 1, 2, 3); }
  }
}

class Boss extends Enemy {   // IL RE DEI ROVI
  constructor(x, y) {
    super(x, y);
    this.hp = this.maxHp = 20; this.dmg = 2;
    this.hb = { x: 5, y: 8, w: 22, h: 20 };
    this.state = 'intro'; this.timer = 70; this.vx = 0; this.vy = 0; this.tx = x; this.ty = y; this.wave = 0;
  }
  get sortY() { return this.y + 28; }
  mopts() { return { edgeSolid: true, self: this }; }
  get enraged() { return this.hp <= this.maxHp / 2; }
  pickTarget() { this.tx = 24 + Math.random() * 176; this.ty = 20 + Math.random() * 90; }
  ring(n, off) {
    for (let i = 0; i < n; i++) {
      const a = off + i / n * Math.PI * 2;
      Game.projectiles.push(new Projectile(this.cx() - 3, this.cy() - 3, Math.cos(a) * 1.35, Math.sin(a) * 1.35, 'thorn'));
    }
    Sound.sfx('shoot');
  }
  update(g) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0) this.inv--;
    if (this.wave > 0 && --this.wave === 0) this.ring(12, Math.PI / 12);
    switch (this.state) {
      case 'intro':
        if (--this.timer <= 0) { this.state = 'move'; this.timer = 80; this.pickTarget(); Sound.sfx('roar'); }
        return;
      case 'move': {
        const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy) || 1, sp = this.enraged ? 1.25 : 0.9;
        if (d > 2) moveEntity(this, dx / d * sp, dy / d * sp, this.mopts());
        if (--this.timer <= 0 || d <= 2) {
          const r = Math.random();
          const minions = g.entities.filter(e => e.enemy && !e.dead && e !== this).length;
          if (this.enraged && r < 0.22 && minions < 3) { this.state = 'summon'; this.timer = 40; }
          else if (r < 0.6) { this.state = 'ring'; this.timer = 45; }
          else { this.state = 'dashPrep'; this.timer = 40; }
        }
        break;
      }
      case 'ring':
        if (--this.timer <= 0) {
          this.ring(this.enraged ? 14 : 10, Math.random());
          if (this.enraged) this.wave = 22;
          this.state = 'move'; this.timer = 70; this.pickTarget();
        }
        break;
      case 'dashPrep': {
        const dx = g.player.cx() - this.cx(), dy = g.player.cy() - this.cy(), d = Math.hypot(dx, dy) || 1;
        const sp = this.enraged ? 3.6 : 3;
        this.vx = dx / d * sp; this.vy = dy / d * sp;
        if (--this.timer <= 0) { this.state = 'dash'; this.timer = 70; Sound.sfx('roar'); }
        break;
      }
      case 'dash':
        if (moveEntity(this, this.vx, this.vy, this.mopts()) || --this.timer <= 0) {
          g.shake = 12; Sound.sfx('explode'); this.state = 'stun'; this.timer = 55;
          for (let i = 0; i < 8; i++) g.particles.push(new Particle(this.cx(), this.cy() + 8, (Math.random() - 0.5) * 3, -Math.random() * 2, 30, '#8a8a92', 2, 0.1));
        }
        break;
      case 'stun':
        if (--this.timer <= 0) { this.state = 'move'; this.timer = 70; this.pickTarget(); }
        break;
      case 'summon':
        if (--this.timer <= 0) {
          for (const [ox, oy] of [[-20, 10], [28, 10]]) {
            const s = new Slime(Math.max(16, Math.min(224, this.x + ox)), Math.max(16, Math.min(144, this.y + oy)), true);
            if (!boxHitsSolid(s.box(), s.mopts())) { g.entities.push(s); g.puff(s.cx(), s.cy()); }
          }
          this.state = 'move'; this.timer = 60; this.pickTarget();
        }
        break;
      case 'dying':
        if (this.t % 5 === 0) { g.puff(this.x + Math.random() * 32, this.y + Math.random() * 32, '#f08ac0'); Sound.sfx('explode'); g.shake = 4; }
        if (--this.timer <= 0) { this.dead = true; g.onBossDefeated(this); }
        return;
    }
    this.touchPlayer(g);
  }
  hurt(g, d) {
    if (this.inv > 0 || this.state === 'dying' || this.state === 'intro') return;
    this.hp -= (this.state === 'stun' ? 2 : 1) * d;
    this.flash = 14; this.inv = 18; g.shake = 3;
    Sound.sfx('bossHit');
    if (this.hp <= 0) {
      this.hp = 0; this.state = 'dying'; this.timer = 110; Sound.sfx('roar');
      for (const p of g.projectiles) p.dead = true;
      for (const e of g.entities) if (e.enemy && e !== this && !e.dead) e.die(g);
    }
  }
  draw(c, g) {
    let ox = 0;
    if (this.state === 'dashPrep' || this.state === 'ring') ox = (this.t >> 1) % 2 ? 1 : -1;
    if (this.state === 'dying' && (this.t >> 2) % 2) return;
    drawShadow(c, this.x + 16, this.y + 29, 24);
    const f = (this.t >> 4) & 1;
    let img = this.img(SPR.boss[f]);
    if (this.state === 'stun') { c.globalAlpha = 0.85; }
    c.drawImage(img, Math.round(this.x + ox), Math.round(this.y + Math.sin(this.t * 0.07) * 1.5));
    c.globalAlpha = 1;
    if (this.state === 'stun') {
      for (let i = 0; i < 3; i++) {
        const a = this.t * 0.12 + i * 2.1;
        c.fillStyle = '#fff080'; c.fillRect(Math.round(this.x + 16 + Math.cos(a) * 10), Math.round(this.y + 2 + Math.sin(a) * 3), 2, 2);
      }
    }
  }
}

function makeEnemy(def) {
  const x = def.x * TS, y = def.y * TS;
  switch (def.type) {
    case 'slime': return new Slime(x, y, false);
    case 'slimeBlue': return new Slime(x, y, true);
    case 'bat': return new Bat(x, y);
    case 'plant': return new Plant(x, y);
    case 'skeleton': return new Skeleton(x, y);
    case 'slimeIce': return new Slime(x, y, 'ice');
    case 'batIce': return new Bat(x, y, true);
    case 'blade': return new BladeTrap(x, y);
    default: throw new Error('Nemico sconosciuto: ' + def.type);
  }
}

/* ------------------------------ NPC & OGGETTI ------------------------------ */
class NPC extends Entity {
  constructor(def) {
    super(def.x * TS, def.y * TS - 4);
    this.def = def; this.solid = true; this.hb = { x: 2, y: 6, w: 12, h: 10 };
    this.dir = 0; this.t = Math.random() * 200 | 0;
    this.hx = this.x; this.hy = this.y; this.walk = null; this.anim = 0;   // Ciclo 4: NPC che passeggiano
  }
  update(g) {
    this.t++;
    if (this.def.wander && !g.dialog) { this.wander(g); return; }
    if (!g.dialog && !this.def.static && this.t % 200 === 0) this.dir = [0, 0, 2, 3][Math.random() * 4 | 0];
  }
  /* passeggia attorno al punto di partenza (raggio def.wander tile), senza mai finire addosso al giocatore */
  wander(g) {
    if (!this.walk) {
      if (this.t % 90 === 0 && Math.random() < 0.6) {
        const d = DIRS[Math.random() * 4 | 0], n = 8 + (Math.random() * 28 | 0);
        this.walk = { d, n }; this.dir = DIRS.indexOf(d);
      }
      this.anim = 0;
      return;
    }
    const w = this.walk, r = this.def.wander * TS;
    const nx = this.x + w.d.x * 0.5, ny = this.y + w.d.y * 0.5;
    const nb = { x: nx + this.hb.x, y: ny + this.hb.y, w: this.hb.w, h: this.hb.h };
    const pb = g.player.box(), near = { x: pb.x - 3, y: pb.y - 3, w: pb.w + 6, h: pb.h + 6 };
    const away = Math.abs(nx - this.hx) > r || Math.abs(ny - this.hy) > r;
    if (away || overlap(nb, near) || boxHitsSolid(nb, { edgeSolid: true, warpSolid: true, entities: true, self: this })) { this.walk = null; return; }
    this.x = nx; this.y = ny; this.anim += 0.08;
    if (--w.n <= 0) this.walk = null;
  }
  talk(g) {
    const dx = g.player.cx() - this.cx(), dy = g.player.cy() - this.cy();
    if (!this.def.static) this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    return this.def.talk(g);
  }
  draw(c) {
    if (this.def.sprite === 'fairy') { drawFairy(c, this.x + 8, this.y + 6 + Math.sin(this.t * 0.05) * 3, this.t); return; }
    const set = SPR.people[this.def.sprite];
    drawShadow(c, this.x + 8, this.y + 15, 10);
    const fr = this.walk ? (this.anim | 0) % 4 : 0;
    c.drawImage(set[DIRS[this.dir].name][fr], Math.round(this.x), Math.round(this.y));
  }
}

class Chest extends Entity {
  constructor(def) { super(def.x * TS, def.y * TS); this.def = def; this.solid = true; this.hb = { x: 1, y: 2, w: 14, h: 11 }; }
  get opened() { return !!Game.s.flags['chest:' + this.def.id]; }
  open(g) {
    if (this.opened) return false;
    g.s.flags['chest:' + this.def.id] = true;
    Sound.sfx('chest');
    g.say(g.giveItem(this.def.item, this.def.n));
    return true;
  }
  draw(c) { c.drawImage(SPR.chest[this.opened ? 1 : 0], this.x, this.y); }
}

class Crystal extends Entity {   // il Cuore di Vesper
  constructor(x, y) { super(x, y); this.hb = { x: 0, y: 0, w: 12, h: 16 }; this.t = 0; }
  update(g) {
    this.t++;
    if (this.t % 6 === 0) g.particles.push(new Particle(this.x + Math.random() * 12, this.y + Math.random() * 16, 0, -0.4, 40, '#ffd8f4', 1, 0));
    if (this.t > 40 && overlap(this.box(), g.player.box())) { this.dead = true; g.collectCrystal(); }
  }
  draw(c) {
    const by = Math.sin(this.t * 0.06) * 2;
    c.fillStyle = 'rgba(255,200,240,0.18)';
    c.beginPath(); c.arc(this.x + 6, this.y + 8 + by, 13 + Math.sin(this.t * 0.1) * 2, 0, Math.PI * 2); c.fill();
    drawShadow(c, this.x + 6, this.y + 22, 8);
    c.drawImage(SPR.crystal, Math.round(this.x), Math.round(this.y + by));
  }
}

class Pickup {
  constructor(x, y, kind) {
    this.x = x; this.y = y; this.kind = kind; this.z = 0; this.vz = 1.6; this.dead = false;
    this.life = kind === 'container' ? Infinity : 540;
  }
  box() { return { x: this.x - 5, y: this.y - 5, w: 10, h: 10 }; }
  update(g) {
    if (this.dead) return;   // già raccolto (es. dall'arpione in questo stesso frame)
    this.vz -= 0.12; this.z += this.vz;
    if (this.z <= 0) { this.z = 0; this.vz = 0; }
    if (--this.life <= 0) this.dead = true;
    if (this.z < 4 && overlap(this.box(), g.player.box())) { this.dead = true; g.collect(this); }
  }
  draw(c, g) {
    if (this.life < 120 && (this.life >> 2) % 2) return;
    const ic = this.kind === 'heart' ? ICON.heart : this.kind === 'gem5' ? ICON.gem5 : this.kind === 'container' ? ICON.container : this.kind === 'bomb' ? ICON.bombs : ICON.gem;
    const s = this.kind === 'container' ? 2 : 1;
    drawShadow(c, this.x, this.y + 4, 6);
    const fl = this.kind === 'gem' || this.kind === 'gem5' ? ((g.t >> 3) % 4 === 0 ? -1 : 0) : 0;
    c.drawImage(ic, Math.round(this.x - ic.width * s / 2), Math.round(this.y - ic.height * s / 2 - this.z + fl), ic.width * s, ic.height * s);
  }
}

class Projectile {
  constructor(x, y, vx, vy, kind) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.kind = kind; this.t = 0; this.dead = false;
    this.w = this.h = kind === 'thorn' ? 6 : kind === 'ice' ? 9 : 5; this.dmg = kind === 'ice' ? 2 : 1;
  }
  reflect(g) {   // masso di ghiaccio respinto con la spada: torna verso il golem
    const b = g.boss;
    this.reflected = true; this.t = 0;
    const tx = b ? b.cx() : this.x - this.vx * 10, ty = b ? b.cy() : this.y - this.vy * 10;
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
    this.vx = dx / d * 3.2; this.vy = dy / d * 3.2;
    Sound.sfx('reflect'); g.spark(this.x + 4, this.y + 4);
  }
  box() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  update(g) {
    this.t++; this.x += this.vx; this.y += this.vy;
    const b = this.box();
    if (b.x < -8 || b.y < -8 || b.x > PLAY_W + 8 || b.y > PLAY_H + 8) this.dead = true;
    else if (this.kind === 'seed' && boxHitsSolid(b, {})) { this.dead = true; g.spark(this.x + 2, this.y + 2); }
    else if (this.kind === 'thorn' && boxHitsSolid(b, { edgeSolid: true }) && this.t > 30) { this.dead = true; g.spark(this.x + 3, this.y + 3); }
    else if (this.kind === 'ice' && boxHitsSolid(b, { edgeSolid: true }) && this.t > 8) { this.dead = true; this.shatter(g); }
    if (this.dead) return;
    if (this.reflected) {
      if (g.boss && !g.boss.dead && overlap(b, g.boss.box())) {
        if (g.boss.volley && g.boss.volley(g, this)) return;   // Ciclo 6: il Golem furioso può rimandarlo
        this.dead = true; this.shatter(g); if (g.boss.stagger) g.boss.stagger(g);
      }
      return;
    }
    if (overlap(b, g.player.box())) { g.player.hurt(g, this.dmg, this.x, this.y); this.dead = true; if (this.kind === 'ice') this.shatter(g); }
  }
  shatter(g) {
    Sound.sfx('shatter');
    for (let i = 0; i < 10; i++) g.particles.push(new Particle(this.x + 4, this.y + 4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 22, i % 2 ? '#e0f6ff' : '#8ad0f4', 2, 0.05));
  }
  draw(c) {
    const x = Math.round(this.x), y = Math.round(this.y);
    if (this.kind === 'ice') {
      c.fillStyle = 'rgba(0,10,30,0.25)'; c.fillRect(x + 1, y + 10, 8, 2);
      c.fillStyle = '#0e1a2a'; c.fillRect(x + 1, y, 7, 9); c.fillRect(x, y + 1, 9, 7);
      c.fillStyle = this.reflected ? '#fff4b0' : '#9ad8f8'; c.fillRect(x + 1, y + 1, 7, 7);
      c.fillStyle = '#ffffff'; c.fillRect(x + 2, y + 2, 2, 2);
      c.fillStyle = this.reflected ? '#e8b040' : '#5aa4d8'; c.fillRect(x + 5, y + 5, 3, 3);
      return;
    }
    if (this.kind === 'seed') {
      c.fillStyle = '#1a1420'; c.fillRect(x, y + 1, 5, 3); c.fillRect(x + 1, y, 3, 5);
      c.fillStyle = '#8a5a2c'; c.fillRect(x + 1, y + 1, 3, 3); c.fillStyle = '#c89a5c'; c.fillRect(x + 1, y + 1, 1, 1);
    } else {
      c.fillStyle = '#3a0a24'; c.fillRect(x + 2, y, 2, 6); c.fillRect(x, y + 2, 6, 2);
      c.fillStyle = (this.t >> 2) % 2 ? '#ff9ad0' : '#f05aa0'; c.fillRect(x + 2, y + 1, 2, 4); c.fillRect(x + 1, y + 2, 4, 2);
    }
  }
}

class Particle {
  constructor(x, y, vx, vy, life, color, size, grav) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = this.max = life;
    this.color = color; this.size = size || 1; this.grav = grav || 0; this.dead = false;
  }
  update() { this.x += this.vx; this.y += this.vy; this.vy += this.grav; if (--this.life <= 0) this.dead = true; }
  draw(c) { c.globalAlpha = Math.min(1, this.life / (this.max * 0.5)); c.fillStyle = this.color; c.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size); c.globalAlpha = 1; }
}
