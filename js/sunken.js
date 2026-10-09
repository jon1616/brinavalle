'use strict';
/* =====================================================================
 *  SUNKEN — Ciclo 17 (Agente A, seconda manche): il SANTUARIO SOMMERSO.
 *  Terzo dungeon, opzionale, sotto il Lago Specchio (mappa 'l:').
 *   · ingresso: un masso incrinato sull'isola del lago (bombe) -> scala
 *   · dentro serve l'ARPIONE per raggiungere le SQUAME D'ARGENTO, che
 *     danno una meccanica nuova: NUOTARE (l'acqua '~' diventa attraversabile,
 *     più lentamente, senza spada né oggetti)
 *   · col nuoto si prende la chiavetta e si affronta LA SERPE DI VETRO:
 *     riemerge da un punto del bordo della vasca (bolle di preavviso), sputa
 *     sfere d'acqua; colpita di spada si rituffa, AGGANCIATA con l'arpione
 *     viene trascinata a riva e resta lì, vulnerabile.
 *   · fuori: due segreti raggiungibili solo a nuoto (Lago Specchio, Radura).
 *  Nuovi nemici: Medusa (fluttua sopra l'acqua). Nuova musica: 'temple'.
 * ===================================================================== */

/* ------------------------------ oggetti ------------------------------ */
ITEMS.swim = { name: "Squame d'Argento", text: () => "Hai trovato le SQUAME D'ARGENTO! Ora puoi NUOTARE: entra in acqua come se fosse terra. In acqua non si usano spada e oggetti." };
{   // inventario della pausa: l'Amo d'Oro (oggetto di missione, poi restituito) lascia il posto alle Squame
  const i = INVENTORY.findIndex(e => e[0] === 'hook');
  if (i >= 0) INVENTORY.splice(i, 1);
  INVENTORY.push(['swim', 'Squame']);
}
ICON.swim = spriteFromRows([
  '..oooo..',
  '.owllwo.',
  'owlwwlwo',
  'olwllwlo',
  'owlwwlwo',
  '.olwwlo.',
  '..owwo..',
  '...oo...',
], { o: '#0a2a2a', w: '#e0fff8', l: '#6ad0c8' });

/* ------------------------------ stanze ------------------------------ */
Object.assign(ROOMS, {
  'l:1,2': {
    name: 'Santuario Sommerso - Vestibolo', ground: 'dungeon', music: 'temple', sunken: true,
    tiles: [
      'WWWWWWWPPWWWWWWW',
      'W~~~~~PPPP~~~~~W',
      'W~~~~~PPPP~~~~~W',
      'W~~YPPPPPPPPY~~W',
      'WPPPPPPPPPPPPPPW',
      'WPP~~~PPPP~~~PPW',
      'WPP~~~PPPP~~~PPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPUUPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    warps: { '7,9': { to: 'o:0,2', x: 8, y: 5, dir: 0 }, '8,9': { to: 'o:0,2', x: 8, y: 5, dir: 0 } },
    enemies: [{ type: 'jelly', x: 2, y: 1 }, { type: 'jelly', x: 13, y: 1 }],
    onEnter: g => {
      if (g.s.flags.sunkenEntered) return;
      g.s.flags.sunkenEntered = true;
      g.say([
        "Sotto l'isola si apre un santuario dimenticato. L'acqua gocciola dalle volte e la luce trema sulle pareti...",
        "Un'iscrizione consumata: «Chi indossa le squame del lago cammina dove gli altri annegano».",
      ]);
    },
  },
  'l:1,1': {
    name: 'Santuario Sommerso - Sala delle Vasche', ground: 'dungeon', music: 'temple', sunken: true,
    tiles: [
      'WWWWWWWLLWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPY~~~~~~~~~~YPW',
      'WPP~~~~~~~~~~PPW',
      'WPP~~~PPPP~~~PPW',
      'PPP~~~PPPP~~~PPP',
      'WPP~~~PPPP~~~PPW',
      'WPP~~~~~~~~~~PPW',
      'WPY~~~~~~~~~~YPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    chests: [{ id: 'c_l_hub', x: 8, y: 5, item: 'gems', n: 20 }],
    enemies: [{ type: 'jelly', x: 4, y: 3 }, { type: 'jelly', x: 11, y: 7 }, { type: 'slimeBlue', x: 13, y: 9 }],
  },
  'l:0,1': {
    name: 'Santuario Sommerso - Sala delle Squame', ground: 'dungeon', music: 'temple', sunken: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPW~~~WPPPPW',
      'WPPPPPW~~~WPPPPW',
      'WPPPPP~~~~~PPPPW',
      'WPPPPP~~~~~PPPPW',
      'WPPPhP~~~~~PPPPP',
      'WPPPPP~~~~~PPPPW',
      'WPPPPP~~~~~PPPPW',
      'WPPPPPW~~~WPPPPW',
      'WPPPPPW~~~WPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'c_swim', x: 2, y: 2, item: 'swim' }],
    enemies: [{ type: 'jelly', x: 8, y: 2 }, { type: 'jelly', x: 8, y: 8 }],
    onEnter: g => {
      if (g.s.flags.scalesHint) return;
      g.s.flags.scalesHint = true;
      g.say([g.s.items.hookshot
        ? "Oltre l'acqua, accanto a un palo con l'anello d'oro, riposa un forziere. Mettiti di fronte al palo, dall'altra parte..."
        : "Oltre l'acqua riposa un forziere. Un palo con l'anello d'oro... ma per ora non hai nulla per agganciarlo."]);
    },
  },
  'l:2,1': {
    name: 'Santuario Sommerso - Sala della Chiave', ground: 'dungeon', music: 'temple', sunken: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'W~~~~~~~~~~~~~~W',
      'W~~~~~~~~~~~~~~W',
      'W~~~~~~~~PPP~~~W',
      'W~~~~~~~~PPP~~~W',
      'PPP~~~~~~PPP~~~W',
      'W~~~~~~~~~~~~~~W',
      'W~~~~~~~~~~~~~~W',
      'W~~~~~~~~~~~~~~W',
      'W~~~~~~~~~~~~~~W',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'c_l_key', x: 10, y: 4, item: 'key' }],
    enemies: [{ type: 'jelly', x: 6, y: 2 }, { type: 'jelly', x: 12, y: 8 }, { type: 'jelly', x: 5, y: 8 }],
    onEnter: g => {
      if (g.s.flags.keyPoolHint || g.s.items.swim) return;
      g.s.flags.keyPoolHint = true;
      g.say(["Una sala allagata. Su un isolotto, laggiù, luccica un forziere... ma l'acqua è profonda."]);
    },
  },
  'l:1,0': {
    name: 'Santuario Sommerso - Pozzo della Serpe', ground: 'dungeon', music: 'temple', sunken: true,
    boss: 'serpent', bossFlag: 'serpent', afterMusic: 'temple',
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPY~~~~~~~~~~YPW',
      'WPP~~~~~~~~~~PPW',
      'WPP~~~~~~~~~~PPW',
      'WPP~~~~~~~~~~PPW',
      'WPP~~~~~~~~~~PPW',
      'WPY~~~~~~~~~~YPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    onEnter: g => {
      const f = g.s.flags;
      if (f.serpent) return;
      if (!f.serpentIntro) {
        f.serpentIntro = true;
        g.say([
          "L'acqua della vasca ribolle... Una forma lunga e trasparente scivola sotto la superficie.",
          'È la SERPE DI VETRO, custode del santuario! Quando riemerge, agganciala: a riva sarà indifesa.',
        ]);
      }
    },
  },
});

/* Lago Specchio: masso incrinato sull'isola (ingresso), isolotto raggiungibile solo a nuoto */
(function patchOverworld() {
  const lake = ROOMS['o:0,2'];
  const set = (room, x, y, ch) => { const r = room.tiles[y]; room.tiles[y] = r.slice(0, x) + ch + r.slice(x + 1); };
  set(lake, 8, 4, 'Q');
  // lo slime dell'isola nasceva a 23 px dall'uscita del santuario (T15.entries): spostato sulla riva sud-ovest
  const sl = (lake.enemies || []).find(e => e.x === 7 && e.y === 4);
  if (sl) { sl.x = 2; sl.y = 9; }
  set(lake, 11, 7, '.');
  lake.warps = Object.assign({}, lake.warps, { '8,4': { to: 'l:1,2', x: 7, y: 8, dir: 1 } });
  lake.dyn = (lake.dyn || []).concat([{ x: 8, y: 4, ch: 'Z', cond: g => g.s.flags['bomb:o:0,2:8,4'] }]);
  lake.chests = (lake.chests || []).concat([{ id: 'c_lakeswim', x: 11, y: 7, item: 'gems', n: 40 }]);
  const radura = ROOMS['o:2,0'];
  set(radura, 7, 3, '.');
  radura.chests = (radura.chests || []).concat([{ id: 'c_pond', x: 7, y: 3, item: 'gems', n: 50 }]);
  // Pino: un indizio sul santuario, finché la roccia non è saltata
  const pino = (lake.npcs || []).find(n => n.id === 'pino');
  if (pino) {
    const talk = pino.talk;
    pino.talk = g => (g.s.items.bombs && !g.s.flags['bomb:o:0,2:8,4'] && (g.t >> 8) % 2 === 0)
      ? ["Pino: Mio nonno giurava che sotto la nostra isola dorme un santuario. Vedi quella roccia piena di crepe, sull'isola? Lui diceva che \"suona vuota\"..."].concat(talk(g))
      : talk(g);
  }
})();

/* ----------------------------- grafica ----------------------------- */
function makeSerpentHead(f) {
  const P = painter(24, 24);
  for (let y = 1; y < 24; y++) for (let x = 0; x < 24; x++) {
    const half = y < 11 ? 8.5 - Math.max(0, 4 - y) * 0.9 : 8.5 - (y - 11) * 0.55;   // testa larga in alto, muso a punta in basso
    const dx = Math.abs(x - 11.5);
    if (half <= 0 || dx > half) continue;
    const edge = dx > half - 1.2 || y === 1;
    let col = edge ? '#0a2a2a' : (x < 12 ? '#5ad0c8' : '#3aa8a0');
    if (!edge && y < 7) col = '#a8f0e8';
    if (!edge && y > 6 && ((x + y * 2) % 6 === 0)) col = '#2a8a8a';   // scaglie a rombi
    P.p(x, y, col);
  }
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) P.r(11.5 + s * (9 + k * 0.3) - (s < 0 ? 1 : 0), 3 + k * 2, 2, 2, k % 2 ? '#8af0e0' : '#2a8a8a');   // creste
  for (const ex of [6, 15]) { P.r(ex, 8, 3, 3, '#0a2a2a'); P.r(ex, 8, 2, 2, '#ffd040'); P.p(ex + 1, 8, '#0a2a2a'); }
  P.p(9, 3, '#ffffff'); P.p(10, 2, '#ffffff');
  P.p(10, 17, '#0a2a2a'); P.p(13, 17, '#0a2a2a');   // narici
  if (f) { P.r(10, 20, 4, 2, '#0a1418'); P.p(11, 22, '#e04060'); P.p(12, 22, '#e04060'); P.p(10, 23, '#e04060'); P.p(13, 23, '#e04060'); }   // lingua biforcuta
  return P.c;
}
SPR.serpent = [makeSerpentHead(0), makeSerpentHead(1)];

/* ------------------------------ nemici ------------------------------ */
class Jelly extends Enemy {   // medusa: fluttua sopra l'acqua e scatta a impulsi
  constructor(x, y) {
    super(x, y);
    this.hp = 2; this.hb = { x: 3, y: 3, w: 10, h: 10 }; this.vx = 0; this.vy = 0; this.ph = Math.random() * 6;
  }
  mopts() { return { edgeSolid: true, noTiles: true, self: this }; }
  update(g) {
    if (this.baseUpdate()) { this.touchPlayer(g); return; }
    this.ph += 0.06;
    const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1, push = Math.max(0, Math.sin(this.ph));
    if (d < 96) { this.vx += dx / d * 0.03 * push; this.vy += dy / d * 0.03 * push; }
    this.vx *= 0.95; this.vy *= 0.95;
    this.x = Math.max(12, Math.min(PLAY_W - 28, this.x + this.vx));
    this.y = Math.max(10, Math.min(PLAY_H - 28, this.y + this.vy + Math.sin(this.ph * 0.5) * 0.08));
    this.touchPlayer(g);
  }
  draw(c) {
    const x = Math.round(this.x), y = Math.round(this.y + Math.sin(this.ph) * 1.5), sq = Math.max(0, Math.sin(this.ph)) > 0.6 ? 1 : 0;
    const white = this.flash > 0 && (this.flash >> 1) % 2 === 0;
    drawShadow(c, x + 8, y + 18, 8);
    c.globalAlpha = 0.85;
    const rows = [[5, 6], [3, 10], [2, 12], [2, 12], [2, 12], [3, 10]];
    rows.forEach(([ox, w], i) => {
      c.fillStyle = '#2a1a4a'; c.fillRect(x + ox - 1, y + 2 + i - sq, w + 2, 1);
      c.fillStyle = white ? '#ffffff' : (i < 2 ? '#ffd0f0' : '#d090e8'); c.fillRect(x + ox, y + 2 + i - sq, w, 1);
    });
    c.fillStyle = '#ffffff'; c.fillRect(x + 5, y + 3 - sq, 2, 1);
    c.fillStyle = white ? '#ffffff' : '#c080e0';
    for (let k = 0; k < 4; k++) { const tx = x + 4 + k * 3, wig = Math.round(Math.sin(this.ph * 2 + k) * 1); c.fillRect(tx + wig, y + 8, 1, 4 + (k % 2)); }
    c.globalAlpha = 1;
  }
}

class WaterOrb {   // sfera d'acqua sputata dalla Serpe (la spada la dissolve)
  constructor(x, y, vx, vy) { Object.assign(this, { x, y, vx, vy, w: 6, h: 6, t: 0, dead: false, kind: 'orb' }); }
  box() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  update(g) {
    this.t++; this.x += this.vx; this.y += this.vy;
    const b = this.box();
    if (this.t > 18 && boxHitsSolid(b, { edgeSolid: true, overWater: true })) { this.dead = true; g.spark(this.x + 3, this.y + 3); return; }
    if (overlap(b, g.player.box())) { g.player.hurt(g, 1, this.x, this.y); this.dead = true; }
  }
  draw(c) {
    const x = Math.round(this.x), y = Math.round(this.y);
    c.fillStyle = '#0a2a3a'; c.fillRect(x + 1, y, 4, 6); c.fillRect(x, y + 1, 6, 4);
    c.fillStyle = (this.t >> 2) % 2 ? '#8ad8f8' : '#5ab8e8'; c.fillRect(x + 1, y + 1, 4, 4);
    c.fillStyle = '#ffffff'; c.fillRect(x + 1, y + 1, 2, 1);
  }
}

class Serpent extends Enemy {   // LA SERPE DI VETRO
  constructor() {
    super(-99, -99);
    this.hp = this.maxHp = 12; this.dmg = 2; this.title = 'SERPE DI VETRO';   // tarata col bot (T17.duel)
    this.hb = { x: 4, y: 4, w: 16, h: 16 };
    this.state = 'intro'; this.timer = 70; this.hidden = true; this.spot = null; this.spots = null; this.yank = null;
  }
  get enraged() { return this.hp <= 5; }
  get sortY() { return this.y + 22; }
  box() { return this.hidden ? { x: -999, y: -999, w: 0, h: 0 } : { x: this.x + this.hb.x, y: this.y + this.hb.y, w: this.hb.w, h: this.hb.h }; }
  computeSpots() {
    const out = [];
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
      if (tileAt(tx, ty) !== '~') continue;
      const land = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const t = tileAt(tx + dx, ty + dy); return t !== null && t !== '~' && !TILE_SOLID.has(t); });
      if (land) out.push([tx, ty]);
    }
    return out;
  }
  placeAt([tx, ty]) { this.x = tx * TS + 8 - 12; this.y = ty * TS + 8 - 18; }
  pickSpot(g) {
    const p = g.player, near = this.spots.filter(([tx, ty]) => { const d = Math.hypot(tx * TS + 8 - p.cx(), ty * TS + 8 - p.cy()); return d > 30 && d < 80; });   // vicino: deve restare il tempo di allinearsi
    const pool = near.length ? near : this.spots;
    this.spot = pool[Math.random() * pool.length | 0];
  }
  dive() { this.state = 'dive'; this.timer = 18; Sound.sfx('dive'); }
  spit(g) {
    const p = g.player, n = this.enraged ? 3 : 1;
    const a0 = Math.atan2(p.cy() - (this.y + 16), p.cx() - (this.x + 12));
    for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.38; g.projectiles.push(new WaterOrb(this.x + 9, this.y + 16, Math.cos(a) * 1.5, Math.sin(a) * 1.5)); }
    Sound.sfx('orb');
  }
  update(g) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0) this.inv--;
    if (!this.spots) this.spots = this.computeSpots();
    switch (this.state) {
      case 'intro': if (--this.timer <= 0) { this.state = 'under'; this.timer = 40; } return;
      case 'under':
        this.hidden = true;
        if (this.t % 9 === 0) { const s = this.spots[Math.random() * this.spots.length | 0]; g.particles.push(new Particle(s[0] * TS + 4 + Math.random() * 8, s[1] * TS + 10, 0, -0.3, 24, '#c8f8ff', 1, 0)); }
        if (--this.timer <= 0) { this.pickSpot(g); this.state = 'rise'; this.timer = this.enraged ? 32 : 46; }
        return;
      case 'rise':
        if (this.t % 3 === 0) g.particles.push(new Particle(this.spot[0] * TS + 3 + Math.random() * 10, this.spot[1] * TS + 12, (Math.random() - 0.5) * 0.4, -0.5, 18, '#e0fcff', 1, 0));
        if (--this.timer <= 0) { this.placeAt(this.spot); this.hidden = false; this.state = 'up'; this.timer = this.enraged ? 110 : 140; Sound.sfx('surface'); g.puff(this.x + 12, this.y + 20, '#c8f8ff'); }
        return;
      case 'up':
        if (this.timer === 104 || this.timer === 64 || (this.enraged && this.timer === 28)) this.spit(g);
        if (--this.timer <= 0) this.dive();
        break;
      case 'yank': {
        const k = Math.min(1, ++this.yank.t / 16);
        this.x = this.yank.x0 + (this.yank.x1 - this.yank.x0) * k; this.y = this.yank.y0 + (this.yank.y1 - this.yank.y0) * k;
        if (k >= 1) { this.state = 'beached'; this.timer = 170; this.beachHits = 0; g.shake = 8; Sound.sfx('stomp'); }
        return;
      }
      case 'beached':
        if (this.t % 12 === 0) g.particles.push(new Particle(this.x + 4 + Math.random() * 16, this.y + 6, 0, -0.3, 18, '#fff080', 1, 0));
        if (--this.timer <= 0) { this.state = 'slither'; this.timer = 0; this.yank = { t: 0, x0: this.x, y0: this.y, x1: this.spot[0] * TS - 4, y1: this.spot[1] * TS - 10 }; }
        return;
      case 'slither': {
        const k = Math.min(1, ++this.yank.t / 22);
        this.x = this.yank.x0 + (this.yank.x1 - this.yank.x0) * k; this.y = this.yank.y0 + (this.yank.y1 - this.yank.y0) * k;
        if (k >= 1) this.dive();
        return;
      }
      case 'dive':
        if (--this.timer <= 0) { this.hidden = true; this.state = 'under'; this.timer = this.enraged ? 36 : 60 + (Math.random() * 30 | 0); }
        return;
      case 'dying':
        if (this.t % 5 === 0) { g.puff(this.x + Math.random() * 24, this.y + Math.random() * 24, Math.random() < 0.5 ? '#c8f8ff' : '#8af0e0'); Sound.sfx('shatter'); g.shake = 4; }
        if (--this.timer <= 0) { this.dead = true; g.onBossDefeated(this); }
        return;
    }
    this.touchPlayer(g);
  }
  /* agganciata con l'arpione mentre è fuori: trascinata sulla riva più vicina al giocatore */
  hookHit(g) {
    if (this.state !== 'up') { Sound.sfx('clank'); return; }
    const p = g.player, [sx, sy] = this.spot;
    let best = null, bd = 1e9;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tx = sx + dx, ty = sy + dy, t = tileAt(tx, ty);
      if (t === null || t === '~' || TILE_SOLID.has(t)) continue;
      const d = Math.hypot(tx * TS + 8 - p.cx(), ty * TS + 8 - p.cy());
      if (d < bd) { bd = d; best = [tx, ty]; }
    }
    if (!best) return;
    this.state = 'yank'; this.yank = { t: 0, x0: this.x, y0: this.y, x1: best[0] * TS + 8 - 12, y1: best[1] * TS + 8 - 14 };
    Sound.sfx('hookhit'); Sound.sfx('surface'); g.shake = 6;
    if (g.stopFor) g.stopFor(6);
    for (const q of g.projectiles) if (q instanceof WaterOrb) q.dead = true;
  }
  bombHit(g) { if (this.state === 'up' || this.state === 'beached') { this.inv = 0; this.hurt(g, 2); } }
  hurt(g, d) {
    if (this.hidden || this.inv > 0 || !['up', 'beached', 'yank', 'slither'].includes(this.state)) return;
    this.hp -= d; this.flash = 14; this.inv = 20; g.shake = 3; Sound.sfx('bossHit');
    if (g.stopFor) g.stopFor(this.hp <= 0 ? 10 : 5);
    if (g.impact) g.impact(this.x + 12, this.y + 12, this.hp <= 0);
    if (this.hp <= 0) {
      this.hp = 0; this.state = 'dying'; this.timer = 120; Sound.sfx('roar'); Sound.music(null);
      for (const p of g.projectiles) p.dead = true;
      for (const e of g.entities) if (e.enemy && e !== this && !e.dead) e.die(g);
      return;
    }
    if (this.state === 'up') this.dive();   // colpita di spada mentre è in acqua: si rituffa
    else if (this.state === 'beached' && ++this.beachHits >= 3) this.timer = 1;   // al terzo colpo si divincola e torna in acqua
  }
  draw(c, g) {
    if (this.state === 'rise') {   // preavviso: cerchi sull'acqua
      const cx = this.spot[0] * TS + 8, cy = this.spot[1] * TS + 10, k = 1 - this.timer / 46;
      c.strokeStyle = 'rgba(220,250,255,' + (0.3 + k * 0.5) + ')'; c.lineWidth = 1;
      for (const r of [3, 6, 9]) { c.beginPath(); c.ellipse(cx, cy, r * (0.6 + k * 0.6), r * 0.4 * (0.6 + k * 0.6), 0, 0, Math.PI * 2); c.stroke(); }
      return;
    }
    if (this.hidden || (this.state === 'dying' && (this.t >> 2) % 2)) return;
    const onLand = this.state === 'beached' || this.state === 'yank' || this.state === 'slither';
    const bob = onLand ? (this.t >> 3) % 2 : Math.round(Math.sin(this.t * 0.12) * 1.5);
    let sink = 0;
    if (this.state === 'dive') sink = (18 - this.timer) * 1.2;
    // collo: segmenti che scendono nell'acqua
    if (this.spot) {
      const bx = this.spot[0] * TS + 8, by = this.spot[1] * TS + 12, hx = this.x + 12, hy = this.y + 18 + sink;
      for (let i = 4; i >= 1; i--) {
        const k = i / 5, sx = bx + (hx - bx) * k, sy = by + (hy - by) * k + Math.sin(this.t * 0.15 + i) * 1;
        c.fillStyle = '#0a2a2a'; c.fillRect(Math.round(sx) - 4, Math.round(sy) - 3, 8, 7);
        c.fillStyle = i % 2 ? '#5ad0c8' : '#3aa8a0'; c.fillRect(Math.round(sx) - 3, Math.round(sy) - 2, 6, 5);
      }
      if (!onLand) { c.strokeStyle = 'rgba(220,250,255,0.6)'; c.beginPath(); c.ellipse(bx, by + 2, 8, 3, 0, 0, Math.PI * 2); c.stroke(); }
    }
    if (onLand) drawShadow(c, this.x + 12, this.y + 23, 18);
    const img = SPR.serpent[this.state === 'up' && this.timer % 32 > 22 ? 1 : 0];
    c.save();
    if (sink) { c.beginPath(); c.rect(this.x - 4, this.y - 10, 32, 30 - sink * 0.2); c.clip(); }
    c.drawImage(this.img(img), Math.round(this.x), Math.round(this.y + bob + sink));
    c.restore();
    if (this.state === 'beached') for (let i = 0; i < 3; i++) {
      const a = this.t * 0.12 + i * 2.1;
      c.fillStyle = '#fff080'; c.fillRect(Math.round(this.x + 12 + Math.cos(a) * 9), Math.round(this.y + 1 + Math.sin(a) * 3), 2, 2);
    }
  }
}

/* ------------------------- agganci al motore ------------------------- */
(function installSunken() {
  const G = Game;
  // nuovi nemici
  const mk = makeEnemy;
  makeEnemy = function (def) { return def.type === 'jelly' ? new Jelly(def.x * TS, def.y * TS) : mk(def); };
  // anche le meduse rispettano la tregua d'ingresso (Ciclo 15)
  { const upd = Jelly.prototype.update; Jelly.prototype.update = function (g) { if (g.entryGrace > 0 && !g.rush) { this.t++; return; } return upd.call(this, g); }; }

  // il masso dell'isola: appena salta, compare la scala
  const crumble = G.crumble;
  G.crumble = function (tx, ty) {
    const r = crumble.call(this, tx, ty);
    if (this.roomId === 'o:0,2' && this.s.flags['bomb:o:0,2:8,4'] && this.tiles[4][8] !== 'Z') {
      this.tiles[4][8] = 'Z'; this.redrawBg();
      this.say(["Sotto il masso si apre una scala che scende... sotto il lago!"]);
    }
    return r;
  };

  // la Serpe sconfitta: niente cristallo, niente Ortensio, ma un cuore e la gloria
  const onBossDefeated = G.onBossDefeated;
  G.onBossDefeated = function (boss) {
    if (!(boss instanceof Serpent)) return onBossDefeated.call(this, boss);
    this.s.flags.serpent = true;
    for (const [x, y] of this.room.bossDoors || [[7, 10], [8, 10]]) this.tiles[y][x] = 'P';
    this.redrawBg();
    this.boss = null;
    this.pickups.push(new Pickup(7 * TS + 8, 8 * TS + 8, 'container'));
    Sound.sfx('secret'); this.pickMusic();
    this.saveGame();
    this.say(['La Serpe di Vetro si frantuma in mille scaglie lucenti, che si sciolgono nell\'acqua come neve al sole.',
      "Il santuario torna silenzioso. Sulla riva della vasca è rimasto un CUORE DI CRISTALLO."]);
  };

  // nuoto: l'acqua diventa attraversabile, più lenta, senza spada né oggetti
  const swimming = p => Game.s.items.swim && tileAt(Math.floor(p.cx() / TS), Math.floor(p.cy() / TS)) === '~';
  Player.prototype.isSwimming = function () { return !!swimming(this); };
  const pUpdate = Player.prototype.update;
  Player.prototype.update = function (g) {
    this.mopts.overWater = !!g.s.items.swim;
    const swim = swimming(this);
    if (swim) {
      if (Input.hit('action')) { Input.pressed.delete('action'); g.tryInteract(); }
      Input.pressed.delete('item'); this.charge = 0;
    }
    const x0 = this.x, y0 = this.y;
    pUpdate.call(this, g);
    if (swim && !this.hook && Math.abs(this.kbx) + Math.abs(this.kby) < 0.2) {
      this.x = x0 + (this.x - x0) * 0.62; this.y = y0 + (this.y - y0) * 0.62;
      if (this.moving && g.t % 22 === 0) { Sound.sfx('swim'); g.particles.push(new Ring(this.cx(), this.cy(), 2, 8, 18, '#d8f4ff')); }
    }
    if (swim !== this.wasSwimming) { if (swim) { Sound.sfx('splash'); g.puff(this.cx(), this.cy(), '#c8f0ff'); } this.wasSwimming = swim; }
  };
  const afterPull = Player.prototype.afterPull;
  Player.prototype.afterPull = function (g) { if (g.s.items.swim) { if (this.overPit()) return this.startFall(g, false); return; } return afterPull.call(this, g); };
  const pDraw = Player.prototype.draw;
  Player.prototype.draw = function (c, g) {
    if (!swimming(this) || this.fallT > 0 || g.itemGet) return pDraw.call(this, c, g);
    const x = Math.round(this.x), y = Math.round(this.y), bob = (g.t >> 4) % 2;
    c.save(); c.beginPath(); c.rect(x - 8, y - 12, 32, 24 + bob); c.clip();   // si vedono testa e sciarpa
    const sy = this.y; this.y += 2 + bob;
    try { pDraw.call(this, c, g); } finally { this.y = sy; c.restore(); }
    c.fillStyle = 'rgba(220,245,255,0.75)';
    c.fillRect(x + 1, y + 11 + bob, 14, 1); c.fillRect(x - 1, y + 12 + bob, 3, 1); c.fillRect(x + 14, y + 12 + bob, 3, 1);
  };

  // atmosfera del santuario: luce acquatica e bolle
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!this.room.sunken) return;
    c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(60,200,210,0.45)'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore();
    c.fillStyle = 'rgba(200,255,250,0.05)';
    for (let i = 0; i < 6; i++) { const x = ((this.t * 0.3 + i * 47) % (PLAY_W + 60)) - 30; c.fillRect(Math.round(x), 0, 10, PLAY_H); }
  };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state === 'play' && this.room && this.room.sunken && this.t % 14 === 0) {
      const w = this.animTiles.filter(a => a[2] === '~');
      if (w.length) { const [tx, ty] = w[Math.random() * w.length | 0]; this.particles.push(new Particle(tx * TS + 2 + Math.random() * 12, ty * TS + 12, 0, -0.35, 34, 'rgba(220,250,255,0.8)', 1, 0)); }
    }
  };

  // diario e albo d'oro
  if (typeof SIDE_QUESTS !== 'undefined') {
    SIDE_QUESTS.push({ name: 'Il Santuario Sommerso', seen: g => g.s.items.bombs && g.visited.has('o:0,2'), done: g => g.s.flags.serpent,
      hint: "Pino dice che sotto l'isola del Lago Specchio dorme un santuario, e che una roccia lì \"suona vuota\"..." });
    SIDE_QUESTS.push({ name: 'Acque profonde', seen: g => g.s.items.swim, done: g => g.s.flags['chest:c_lakeswim'] && g.s.flags['chest:c_pond'],
      prog: g => [g.s.flags['chest:c_lakeswim'], g.s.flags['chest:c_pond']].filter(Boolean).length + '/2',
      hint: 'Ora che sai nuotare, guarda bene gli specchi d\'acqua della valle: c\'è chi ci nasconde tesori.' });
  }
  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'serpe', name: 'Signore del lago', desc: 'Sconfiggi la Serpe di Vetro nel Santuario Sommerso.', icon: 'swim', tier: 1, got: g => g.s.flags.serpent });
})();
