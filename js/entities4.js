'use strict';
/* =====================================================================
 *  ENTITIES4 — Ciclo 4 (Agente B):
 *   Seed   un Seme dell'Alba: brilla, galleggia, si raccoglie toccandolo.
 *          Le posizioni sono in world.js (`seeds` delle stanze, SEED_HINTS).
 * ===================================================================== */
class Seed extends Entity {
  constructor(def) {
    super(def.x * TS, def.y * TS);
    this.def = def; this.hb = { x: 4, y: 4, w: 8, h: 8 }; this.t = Math.random() * 100 | 0;
  }
  get sortY() { return this.y + 12; }
  update(g) {
    this.t++;
    if (this.t % 9 === 0) g.particles.push(new Particle(this.x + 4 + Math.random() * 8, this.y + 6 + Math.random() * 6, 0, -0.35, 34, Math.random() < 0.5 ? '#fff0a0' : '#ffd060', 1, 0));
    const p = g.player;
    if (!p.fallT && !p.hook && overlap(this.box(), p.box())) { this.dead = true; g.collectSeed(this.def); }
  }
  draw(c) {
    const bob = Math.sin(this.t * 0.07) * 1.5, cx = this.x + 8, cy = this.y + 8 + bob;
    c.fillStyle = 'rgba(255,220,120,' + (0.16 + Math.sin(this.t * 0.1) * 0.06) + ')';
    c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fill();
    drawShadow(c, cx, this.y + 14, 6);
    const ic = ICON.seed;
    c.drawImage(ic, Math.round(cx - ic.width / 2), Math.round(cy - ic.height / 2));
    if ((this.t >> 3) % 6 === 0) { c.fillStyle = '#ffffff'; c.fillRect(Math.round(cx + 2), Math.round(cy - 4), 1, 1); }
  }
}
