'use strict';
/* =====================================================================
 *  ABYSS — Ciclo 35 (Agente A, seconda manche): CAPITOLO IV, parte seconda:
 *  «LA FOSSA SENZA FONDO».
 *  Il raggio del Faro ha aperto il cratere (Ciclo 34). Sotto l'isola c'è la
 *  Fossa senza fondo, dove il sole non è mai arrivato. Laggiù batte, «come un
 *  cuore stanco», il nucleo di VESPERO, la stella scesa a ridare la voce a Vesper.
 *  Il mare, geloso del cielo, non vuole lasciarla andare.
 *  · MECCANICA NUOVA, LA LUCE: le sale sono buie. Il LUME DI STELLA (tasto X)
 *    si LANCIA avanti, dove resta a illuminare; X di nuovo e torna in mano.
 *      - i PONTI DI VETRO sulle voragini esistono solo dove c'è luce;
 *      - i MURI D'OMBRA si dissolvono alla luce;
 *      - le OMBRE: nel buio veloci e intoccabili, alla luce si rannicchiano.
 *    In mano il Lume illumina solo il punto dove sta Lio.
 *  · 7 sale (prefisso f:, mappa «FOSSA»):
 *      f:1,2 La Discesa             (ingresso; il muro d'ombra verso nord)
 *      f:0,2 Il Relitto             (il Lume di Stella, nella nave del vecchio Faro)
 *      f:2,2 Il Ponte di Vetro      (perla)
 *      f:1,1 La Foresta d'Alghe     (Ombre; la Porta delle Perle)
 *      f:0,1 La Grotta della Marea  (perla; la marea del Ciclo 34)
 *      f:2,1 Il Labirinto d'Ombra   (perla dietro tre muri d'ombra)
 *      f:1,0 Il Cuore dell'Abisso   (UMBRA, la Piovra degli Abissi; poi Vespero)
 *  Flag: fIn, items.starlamp, chest:f_pearl_vetro / f_pearl_marea / f_pearl_ombra,
 *        shadow:<id>, fUmbra, starFreed, ch4Done.
 * ===================================================================== */
const LUME_R = 44, LUME_THROW = 48;
const TENT_WARN = () => [56, 44, 36][Opts.diff];   // preavviso dei tentacoli di Umbra (frame)
const FOSSA_PEARLS = [
  { id: 'f_pearl_vetro', room: 'f:2,2' }, { id: 'f_pearl_marea', room: 'f:0,1' }, { id: 'f_pearl_ombra', room: 'f:2,1' },
];
const pearlCount = g => FOSSA_PEARLS.filter(p => g.s.flags['chest:' + p.id]).length;
const inAbyss = g => !!g.roomId && (g.roomId.startsWith('f:') || !!(g.room && g.room.abyss));   // Ciclo 39: anche le stanze di altri dungeon con «abyss»

ITEMS.starlamp = { name: 'Lume di Stella', text: () => 'Hai trovato il LUME DI STELLA! Il vetro è lo stesso della lente del Faro. Premi ' + bombKey() + ' per lanciarlo: dove cade, illumina. Premi ancora e torna da te. Cambi oggetto con ' + (isTouch() ? 'il pulsante ⇄' : 'il tasto Q') + '.' };
ITEMS.pearl = { name: 'Perla di luce', text: () => 'Hai trovato una PERLA DI LUCE! È una lacrima della stella, ancora tiepida. (' + pearlCount(Game) + '/3)' };
INVENTORY.push(['starlamp', 'Lume']);
EQUIPS.push('starlamp');
ICON.starlamp = spriteFromRows([
  '...oooo...',
  '..owwwwo..',
  '.owbbbbwo.',
  '.obyyyybo.',
  '.obywwybo.',
  '.obyyyybo.',
  '.owbbbbwo.',
  '..owwwwo..',
  '...oddo...',
  '...oooo...',
], { o: '#1a1420', w: '#c8e0f0', b: '#6aa8d8', y: '#fff2b0', d: '#5a6a7a' });

/* ------------------------------ stanze ------------------------------ */
const G_ = '_';   // le tessere dei ponti di vetro sono voragini finché non c'è luce
Object.assign(ROOMS, {
  'f:1,2': {
    name: 'Fossa - La Discesa', ground: 'dungeon', music: 'cave', abyss: true,
    tiles: [
      'WWWWWWWPPWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPWPPPPPPWPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPWPPPPPPPPPPWPW',
      'PPPPPPPPPPPPPPPP',
      'WPWPPPPPPPPPPWPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPWPPPPPPWPPPW',
      'WPPPPPPUUPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    warps: { '7,9': { to: 'm:2,2', x: 7, y: 6, dir: 0 }, '8,9': { to: 'm:2,2', x: 7, y: 6, dir: 0 } },
    shadows: [{ id: 'f_discesa', x: 7, y: 0, w: 2, h: 1 }],
    onEnter: g => {
      if (g.s.flags.fIn) return;
      g.s.flags.fIn = true;
      g.say([
        'La scala di corallo finisce nel buio. Qui sotto il sole non è mai arrivato: vedi appena le tue mani.',
        'Da qualche parte, in fondo, qualcosa batte. Piano, lentamente. Come un cuore stanco.',
        'A nord, il passaggio è chiuso da un muro di buio così fitto che sembra solido.',
      ]);
    },
  },
  'f:0,2': {
    name: 'Fossa - Il Relitto', ground: 'dungeon', music: 'cave', abyss: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPWWWWWWWWWPPPW',
      'WPPWPPPPPPPWPPPW',
      'WPPWPPPPPPPWPPPW',
      'WPPPPPPPPPPWPPPP',
      'WPPWPPPPPPPWPPPW',
      'WPPWPPPPPPPWPPPW',
      'WPPWWWWWWWWWPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'f_lume', x: 8, y: 5, item: 'starlamp' }],
    enemies: [{ type: 'jelly', x: 6, y: 4 }, { type: 'jelly', x: 13, y: 2 }, { type: 'jelly', x: 13, y: 8 }],
    signs: { '3,1': ['Sulla prua consumata si legge ancora un nome: «LUCIA — Faro di Porto Corallo». Una nave del faro, affondata chissà quanto tempo fa.'] },
    onEnter: g => {
      if (g.s.flags.fWreck) return;
      g.s.flags.fWreck = true;
      g.say(['Lo scheletro di una nave, coricato sul fondo. Meduse luminose galleggiano tra le costole del legno: almeno loro fanno un po\' di luce.']);
    },
  },
  'f:2,2': {
    name: 'Fossa - Il Ponte di Vetro', ground: 'dungeon', music: 'cave', abyss: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'W__________PPP_W',
      'W__________PPP_W',
      'W__________PPP_W',
      'WPP____________W',
      'PPP____________W',
      'WPP____________W',
      'W______________W',
      'W______________W',
      'W______________W',
      'WWWWWWWWWWWWWWWW',
    ],
    glass: [[3, 5], [4, 5], [5, 5], [6, 5], [6, 4], [6, 3], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2]],
    chests: [{ id: 'f_pearl_vetro', x: 13, y: 2, item: 'pearl' }],
    onEnter: g => {
      if (g.s.flags.fGlassSeen) return;
      g.s.flags.fGlassSeen = true;
      g.say(['Una voragine. Laggiù, su un isolotto, una luce perlacea. Nel buio, a tratti, qualcosa luccica sopra il vuoto: vetro?' + (g.s.items.starlamp ? ' Forse, alla luce del Lume...' : '')]);
    },
  },
  'f:1,1': {
    name: "Fossa - La Foresta d'Alghe", ground: 'dungeon', music: 'cave', abyss: true,
    tiles: [
      'WWWWWWWJJWWWWWWW',
      'WPPVVPPPPPPVVPPW',
      'WPPVPPPPPPPPVPPW',
      'WPPPPPPPPPPPPPPW',
      'WVPPPPPPPPPPPPVW',
      'PPPPPPPPPPPPPPPP',
      'WVPPPPPPPPPPPPVW',
      'WPPPPPPPPPPPPPPW',
      'WPPVPPPPPPPPVPPW',
      'WPPVVPPPPPPVVPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    enemies: [{ type: 'ombra', x: 3, y: 3 }, { type: 'ombra', x: 12, y: 3 }, { type: 'ombra', x: 7, y: 2 }],
    signs: { '6,1': g => ['Sulla porta, tre incavi rotondi, come per tre perle. ' + (pearlCount(g) >= 3 ? 'Sono tutti pieni: la porta è aperta.' : 'Ne hai ' + pearlCount(g) + ' su 3.')] },
    onEnter: g => {
      if (g.s.flags.fForest) return;
      g.s.flags.fForest = true;
      g.say(['Alghe altissime ondeggiano senza vento. Tra le foglie, nel buio, si accendono coppie di occhi bianchi. Ti guardano.']);
    },
  },
  'f:0,1': Object.assign({
    name: 'Fossa - La Grotta della Marea', ground: 'beach', music: 'cave', abyss: true,
    chests: [{ id: 'f_pearl_marea', x: 2, y: 5, item: 'pearl' }],
    enemies: [{ type: 'ombra', x: 8, y: 2 }],
    onEnter: g => {
      if (g.s.flags.fTide) return;
      g.s.flags.fTide = true;
      g.say(['Anche qui sotto arriva la marea: l\'acqua sale e scende in una grotta lunghissima. A ovest, su una spiaggetta, brilla qualcosa.']);
    },
  }, tideMap([
    'WWWWWWWWWWWWWWWW',
    'W~~~~~~~~~~~~~~W',
    'W~~~~~~~~~~~~~~W',
    'W~~~~~~~~~~~~~~W',
    'W..~~~~~~~~~~~~W',
    'W..%%%%%%%%%%...',
    'W..~~~~~~~~~~~~W',
    'W~~~~~~~~~~~~~~W',
    'W~~~~~~~~~~~~~~W',
    'W~~~~~~~~~~~~~~W',
    'WWWWWWWWWWWWWWWW',
  ])),
  'f:2,1': {
    name: "Fossa - Il Labirinto d'Ombra", ground: 'dungeon', music: 'cave', abyss: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    shadows: [{ id: 'f_lab1', x: 4, y: 1, w: 1, h: 9 }, { id: 'f_lab2', x: 8, y: 1, w: 1, h: 9 }, { id: 'f_lab3', x: 12, y: 1, w: 1, h: 9 }],
    chests: [{ id: 'f_pearl_ombra', x: 14, y: 5, item: 'pearl' }],
    enemies: [{ type: 'ombra', x: 6, y: 2 }, { type: 'ombra', x: 10, y: 8 }],
  },
  'f:1,0': {
    name: "Fossa - Il Cuore dell'Abisso", ground: 'dungeon', abyss: true,
    get music() { return Game.s && Game.s.flags.fUmbra ? 'cave' : 'boss2'; },
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WWWWWPPPPPPWWWWW',
      'WWWPPPPPPPPPPWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
  },
});
// la Porta delle Perle (f:1,1, nord): si apre con tre perle
ROOMS['f:1,1'].dyn = [{ x: 7, y: 0, ch: 'P', cond: g => pearlCount(g) >= 3 }, { x: 8, y: 0, ch: 'P', cond: g => pearlCount(g) >= 3 }];

/* ------------------------------ la luce ------------------------------ */
function lumeOf(g) { return g.entities.find(e => e instanceof Lume) || null; }
function isLit(g, x, y) {
  const L = lumeOf(g);
  if (L && L.state === 'placed' && Math.hypot(L.x - x, L.y - y) <= LUME_R * (L.ink > 0 ? 0.35 : 1)) return true;
  if (g.s.items.starlamp && (!L || L.state === 'held')) { const p = g.player; if (Math.hypot(p.cx() - x, p.cy() - y) <= 14) return true; }
  return false;
}
class Lume extends Entity {   // il Lume di Stella, quando è fuori dalla mano
  constructor(g) { super(g.player.cx(), g.player.cy()); this.state = 'held'; this.hb = { x: -3, y: -3, w: 6, h: 6 }; this.t = 0; this.ink = 0; }
  get sortY() { return 998; }
  box() { return { x: -999, y: -999, w: 0, h: 0 }; }
  cx() { return this.x; } cy() { return this.y; }
  throwFrom(g) {
    const p = g.player, v = DIRS[p.dir];
    let x = p.cx(), y = p.cy() - 4;
    for (let d = 0; d < LUME_THROW; d += 4) {   // vola sopra voragini e acqua; si ferma ai muri (e ai muri d'ombra)
      const nx = x + v.x * 4, ny = y + v.y * 4, t = tileAt(Math.floor(nx / TS), Math.floor(ny / TS));
      if (t === null || (TILE_SOLID.has(t) && t !== '~')) break;
      if (g.entities.some(e => e instanceof ShadowWall && !e.fade && overlap({ x: nx - 2, y: ny - 2, w: 4, h: 4 }, e.box()))) { x = nx; y = ny; break; }
      x = nx; y = ny;
    }
    this.x = p.cx(); this.y = p.cy() - 4; this.tx = x; this.ty = y; this.state = 'fly'; Sound.sfx('swap');
  }
  update(g) {
    this.t++;
    if (this.ink > 0) this.ink--;
    const p = g.player;
    if (this.state === 'held') { this.x = p.cx(); this.y = p.cy() - 4; return; }
    if (this.state === 'fly') {
      const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
      if (d < 4) { this.x = this.tx; this.y = this.ty; this.state = 'placed'; Sound.sfx('fairy'); } else { this.x += dx / d * 4; this.y += dy / d * 4; }
      return;
    }
    if (this.state === 'back') {
      const dx = p.cx() - this.x, dy = p.cy() - 4 - this.y, d = Math.hypot(dx, dy);
      if (d < 5) { this.state = 'held'; Sound.sfx('select'); } else { this.x += dx / d * 5; this.y += dy / d * 5; }
    }
  }
  draw(c) {
    if (this.state === 'held') return;
    const X = Math.round(this.x), Y = Math.round(this.y + (this.state === 'placed' ? Math.sin(this.t * 0.08) * 1.5 : 0));
    c.fillStyle = 'rgba(255,244,190,0.35)'; c.beginPath(); c.arc(X, Y, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1420'; c.fillRect(X - 3, Y - 4, 6, 8);
    c.fillStyle = '#c8e0f0'; c.fillRect(X - 2, Y - 3, 4, 6);
    c.fillStyle = '#fff2b0'; c.fillRect(X - 1, Y - 2, 2, 4);
  }
}

/* i muri d'ombra */
class ShadowWall extends Entity {
  constructor(def) { super(def.x * TS, def.y * TS); this.def = def; this.solid = true; this.hb = { x: 0, y: 0, w: def.w * TS, h: def.h * TS }; this.fade = 0; this.t = 0; }
  update(g) {
    this.t++;
    if (this.fade) { if (++this.fade > 30) this.dead = true; return; }
    const b = this.box(), pts = [];
    for (let y = b.y + 8; y < b.y + b.h; y += 16) for (let x = b.x + 8; x < b.x + b.w; x += 16) pts.push([x, y]);
    if (pts.some(([x, y]) => isLit(g, x, y) || (g.s.items.starlamp && Math.hypot(g.player.cx() - x, g.player.cy() - y) < 22 && (!lumeOf(g) || lumeOf(g).state === 'held')))) {
      this.fade = 1; g.s.flags['shadow:' + this.def.id] = true; Sound.sfx('hush'); g.saveGame();
    }
  }
  draw(c) {
    const b = this.box(), a = this.fade ? 1 - this.fade / 30 : 1;
    c.fillStyle = 'rgba(2,2,8,' + (0.95 * a) + ')'; c.fillRect(b.x, b.y, b.w, b.h);
    for (let i = 0; i < b.w * b.h / 40; i++) {   // fumo nero che si muove
      const x = (i * 29 + this.t * 0.4) % b.w, y = (i * 17 + Math.sin(this.t * 0.03 + i) * 4 + b.h) % b.h;
      c.fillStyle = 'rgba(40,30,70,' + (0.6 * a) + ')'; c.fillRect(Math.round(b.x + x), Math.round(b.y + y), 3, 2);
    }
  }
}

/* l'Ombra */
class Ombra extends Enemy {
  constructor(x, y) { super(x, y); this.hp = 2; this.dmg = 1; this.hb = { x: 3, y: 3, w: 10, h: 11 }; this.ph = Math.random() * 6; this.clinkCd = 0; this.lit = false; }
  mopts() { return { warpSolid: true, edgeSolid: true, entities: false, pitSolid: false, self: this }; }
  hurt(g, d, dir) {
    if (!this.lit) { if (this.clinkCd <= 0) { this.clinkCd = 24; g.particles.push(new Particle(this.cx(), this.cy(), 0, -0.4, 18, '#3a3050', 2, 0)); } return; }
    super.hurt(g, d, dir);
  }
  bombHit(g) { this.inv = 0; super.hurt(g, 2, 0); }
  hookHit(g) { if (this.lit) { this.stunT = 60; Sound.sfx('hookhit'); } }
  update(g) {
    if (this.clinkCd > 0) this.clinkCd--;
    this.ph += 0.07;
    this.lit = isLit(g, this.cx(), this.cy());
    if (this.baseUpdate()) return;
    if (this.lit) { this.t++; return; }   // alla luce si rannicchia
    if (g.entryGrace > 0) return;
    const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1;
    moveEntity(this, dx / d * 0.62, dy / d * 0.62 + Math.sin(this.ph) * 0.2, this.mopts());
    this.touchPlayer(g);
  }
  draw(c) {
    if (!this.lit) return;   // nel buio se ne vedono solo gli occhi (li disegna la luce della Fossa)
    const X = Math.round(this.x), Y = Math.round(this.y) + 2, white = this.flash > 0 && (this.flash >> 1) % 2 === 0;
    c.fillStyle = '#1a1420'; c.fillRect(X + 2, Y + 3, 12, 10);
    c.fillStyle = white ? '#ffffff' : '#4a3a6a'; c.fillRect(X + 3, Y + 4, 10, 8);
    c.fillStyle = '#6a5a8a'; c.fillRect(X + 4, Y + 4, 8, 2);
    c.fillStyle = '#e8e0ff'; c.fillRect(X + 5, Y + 7, 2, 1); c.fillRect(X + 9, Y + 7, 2, 1);   // occhi socchiusi: ha paura
  }
  drawEyes(c) {
    const X = Math.round(this.x), Y = Math.round(this.y + Math.sin(this.ph) * 1.5);
    c.fillStyle = '#ffffff'; c.fillRect(X + 5, Y + 6, 2, 2); c.fillRect(X + 9, Y + 6, 2, 2);
    c.fillStyle = 'rgba(200,190,255,0.35)'; c.fillRect(X + 4, Y + 5, 8, 4);
  }
}

/* ------------------------------ UMBRA, la Piovra degli Abissi ------------------------------ */
class Umbra extends Enemy {
  constructor() {
    super(128 - 24, 18);
    this.hp = this.maxHp = 12; this.dmg = 1; this.title = 'UMBRA, PIOVRA DEGLI ABISSI';
    this.hb = { x: 8, y: 8, w: 32, h: 22 }; this.state = 'intro'; this.timer = 80; this.hits = 0;
    this.tents = []; this.next = 120; this.inkIn = 300; this.ignoreClear = true; this.clink = 0;
  }
  get phase2() { return this.hp <= 6; }
  get sortY() { return this.y + 34; }
  /* fa la guardia a intervalli (occhi rossi), e dopo i tre colpi resta furiosa per un po' */
  get guarding() { return this.calm > 0 || (this.t % (this.phase2 ? 200 : 220)) < (this.phase2 ? 110 : 100); }
  get drop() { return this.state === 'blind' ? 10 : 0; }   // accecata, abbassa la testa: è lì che la spada arriva
  box() { const d = this.drop; return { x: this.x + 8, y: this.y + 8 + d, w: 32, h: 22 + d }; }
  headX() { return this.x + 24; } headY() { return this.y + 22 + this.drop; }
  hurt(g) {
    if (this.state !== 'blind' || this.inv > 0) { if (this.state !== 'dying' && this.clink <= 0) { this.clink = 20; Sound.sfx('clank'); g.spark(this.headX(), this.headY()); } return; }
    this.hp -= 1; this.flash = 12; this.inv = 18; g.shake = 5; Sound.sfx('bossHit');
    if (g.stopFor) g.stopFor(this.hp <= 0 ? 10 : 5);
    if (g.impact) g.impact(this.headX(), this.headY(), this.hp <= 0);
    if (this.hp <= 0) {
      this.state = 'dying'; this.timer = 150; Sound.sfx('roar'); Sound.music(null);
      for (const p of g.projectiles) p.dead = true;
      for (const e of g.entities) if (e.enemy && e !== this && !e.dead) e.die(g);
      return;
    }
    if (++this.hits >= 3) this.rage(g);
  }
  bombHit(g) { if (this.state === 'blind') { this.inv = 0; this.hurt(g); } }
  rage(g) {   // si riprende, e scaccia la luce
    this.state = 'idle'; this.hits = 0; this.next = 40; this.calm = 180; g.shake = 10; Sound.sfx('roar');
    const L = lumeOf(g); if (L && L.state === 'placed') L.state = 'back';
  }
  update(g) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0) this.inv--;
    if (this.clink > 0) this.clink--;
    const p = g.player;
    if (this.state === 'intro') { if (--this.timer <= 0) this.state = 'idle'; return; }
    if (this.state === 'dying') {
      if (this.t % 5 === 0) g.particles.push(new Particle(this.headX() + (Math.random() - 0.5) * 40, this.headY() + (Math.random() - 0.5) * 20, 0, 0.4, 40, '#2a2040', 3, 0));
      if (--this.timer <= 0) { this.dead = true; umbraDefeated(g, this); }
      return;
    }
    if (this.calm > 0) this.calm--;
    const L = lumeOf(g);
    if (this.state === 'idle' && L && L.state === 'placed' && this.guarding && Math.hypot(L.x - this.headX(), L.y - this.headY()) < LUME_R) {   // occhi rossi: scaccia la luce, e risponde
      L.state = 'back'; Sound.sfx('splash'); g.shake = 6; this.tents.push({ x: p.cx(), y: p.cy(), t: TENT_WARN(), w: TENT_WARN(), up: 0 });
    }
    if (this.state === 'idle' && L && L.state === 'placed' && !this.guarding && !(L.ink > 0) && Math.hypot(L.x - this.headX(), L.y - this.headY()) < LUME_R) {
      this.state = 'blind'; this.timer = this.phase2 ? 130 : 160; this.hits = 0; Sound.sfx('shatter'); g.shake = 6;
      for (const t of this.tents) t.t = Math.min(t.t, 0);
    }
    if (this.state === 'blind') { if (--this.timer <= 0) this.rage(g); }
    // i tentacoli: prima un vortice dove sei, poi esce e sbatte
    if (this.state === 'idle' && --this.next <= 0) {
      this.next = this.phase2 ? 70 : 100;
      this.tents.push({ x: p.cx(), y: p.cy(), t: TENT_WARN(), w: TENT_WARN(), up: 0 });
      if (this.phase2 && Math.random() < 0.5) this.tents.push({ x: Math.max(24, Math.min(232, p.cx() + (Math.random() < 0.5 ? -40 : 40))), y: p.cy(), t: TENT_WARN() + 10, w: TENT_WARN() + 10, up: 0 });
    }
    for (const t of this.tents) {
      if (t.t > 0) { if (--t.t === 0) { t.up = 70; g.shake = 4; Sound.sfx('splash'); if (Math.hypot(p.cx() - t.x, p.cy() - t.y) < 13) p.hurt(g, 1, t.x, t.y); } }
      else if (t.up > 0) t.up--;
    }
    this.tents = this.tents.filter(t => t.t > 0 || t.up > 0);
    // l'inchiostro (seconda fase): soffoca la luce del Lume per un po'
    if (this.phase2 && this.state === 'idle' && --this.inkIn <= 0 && L && L.state === 'placed') { this.inkIn = 320; L.ink = 150; Sound.sfx('hush'); }
    if (overlap({ x: this.x + 6, y: this.y + 6, w: 36, h: 22 }, p.box())) p.hurt(g, this.dmg, this.headX(), this.headY());
  }
  draw(c, g) {
    if (this.state === 'dying' && (this.t >> 2) % 2) return;
    const X = Math.round(this.x), t = this.t, blind = this.state === 'blind';
    const Y0 = Math.round(this.y), Y = Y0 + this.drop;
    // i tentacoli
    for (const tn of this.tents) {
      if (tn.t > 0) { const k = 1 - tn.t / (tn.w || 50); c.strokeStyle = 'rgba(120,100,180,' + (0.3 + k * 0.5) + ')'; c.lineWidth = 1; c.beginPath(); c.ellipse(tn.x, tn.y + 4, 6 + k * 6, 3 + k * 2, 0, 0, Math.PI * 2); c.stroke(); }
      else { const h = Math.min(20, (70 - tn.up) * 4); for (let i = 0; i < h; i += 3) { const w = 6 - i / 5; c.fillStyle = i % 6 ? '#3a2a5a' : '#5a4a7a'; c.fillRect(Math.round(tn.x - w / 2 + Math.sin(t * 0.2 + i * 0.3) * 2), Math.round(tn.y + 4 - i), Math.max(2, Math.round(w)), 3); } }
    }
    // il corpo: una cupola scura e lucida, braccia attorno al nucleo
    c.fillStyle = '#0a0612'; c.beginPath(); c.ellipse(X + 24, Y + 18, 24, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = this.flash > 0 && (this.flash >> 1) % 2 === 0 ? '#ffffff' : '#2a1a3a'; c.beginPath(); c.ellipse(X + 24, Y + 17, 22, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4a3a6a'; c.beginPath(); c.ellipse(X + 18, Y + 10, 8, 4, -0.3, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 6; i++) {   // le braccia, che ondeggiano
      const a = Math.PI * 0.15 + i / 5 * Math.PI * 0.7, len = 18 + Math.sin(t * 0.05 + i) * 4;
      for (let s = 0; s < len; s += 3) { c.fillStyle = s % 6 ? '#2a1a3a' : '#3a2a5a'; c.fillRect(Math.round(X + 24 + Math.cos(a) * (16 + s) + Math.sin(t * 0.07 + s * 0.2) * 2), Math.round(Y + 18 + Math.sin(a) * (10 + s * 0.6)), 3, 3); }
    }
    // gli occhi: enormi e gialli, o chiusi e strizzati quando la luce la acceca
    for (const ex of [14, 30]) {
      if (blind) { c.fillStyle = '#e8d8a0'; c.fillRect(X + ex - 3, Y + 18, 7, 1); }
      else { c.fillStyle = this.guarding ? '#e84040' : '#e8c050'; c.fillRect(X + ex - 3, Y + 15, 7, 6); c.fillStyle = '#0a0612'; c.fillRect(X + ex, Y + 16, 2, 4); }   // rossi: fa la guardia
    }
  }
}

function umbraDefeated(g, b) {
  const f = g.s.flags;
  f.fUmbra = true;
  if (typeof bestMark === 'function') bestMark(g, b, true);
  g.boss = null;
  for (const [x, y] of [[7, 10], [8, 10]]) g.tiles[y][x] = 'P';
  g.redrawBg();
  g.pickups.push(new Pickup(b.headX(), b.headY() + 14, 'container'));
  Sound.sfx('secret'); g.saveGame();
  g.say([
    'Le braccia di Umbra si sciolgono in acqua nera e scivolano via, giù, ancora più giù, nel fondo che non ha fondo.',
    'Nel silenzio resta una luce sola: il nucleo della stella, grande come un pugno, che batte piano. Come un cuore stanco.',
    'Vespero: ...Bambino della nota d\'argento. Ti sento.',
    'Vespero: Sono scesa a ridare la voce al mio amico. E il mare, che da sempre invidia il cielo, mi ha afferrata. Senza luce, quaggiù, mi stavo spegnendo.',
    'Vespero: Il tuo Lume è fatto del mio vetro: è così che mi hai trovata. Ora fammi sentire la nota, e io ritroverò la strada.',
    'Fai vibrare il Diapason. La nota sale lungo la Fossa, su, fino al Faro di Porto Corallo, e il raggio del Faro scende a cercarla.',
    g2 => { g2.starRise = 240; Sound.sfx('ring'); Sound.sfx('fairy'); },
    'Il nucleo si alza, sempre più veloce, e sparisce verso l\'alto in una scia di luce.',
    'Quella notte, su tutta la costa, la gente esce di casa a guardare il cielo: la stella della sera è tornata al suo posto.',
    g2 => { g2.s.flags.starFreed = true; g2.saveGame(); g2.ch4CardIn = 60; },
  ]);
}

/* ------------------------------ installazione ------------------------------ */
(function installAbyss() {
  const G = Game;
  const mk = makeEnemy;
  makeEnemy = function (def) { return def.type === 'ombra' ? new Ombra(def.x * TS, def.y * TS) : mk(def); };

  const applyGlass = g => {
    const def = g.room; if (!def || !def.glass) return;
    const floor = floorOf(def.ground), L = lumeOf(g), held = !L || L.state === 'held', p = g.player;
    const pt = g.player ? [Math.floor(p.cx() / TS), Math.floor(p.cy() / TS)] : null;
    let changed = false;
    for (const [x, y] of def.glass) {
      // il Lume in mano tiene accesa la casella dove sei solo se era GIÀ accesa (prima la accendeva appena ci mettevi il piede: si attraversava senza lanciarlo)
      // la casella di vetro sotto i piedi di Lio non sparisce mai finché ci sta sopra (lanciare o richiamare il Lume da un ponte non fa cadere);
      // si cade solo mettendo il piede su vetro buio
      const on = (L && L.state === 'placed' && Math.hypot(L.x - (x * TS + 8), L.y - (y * TS + 8)) <= LUME_R * (L.ink > 0 ? 0.35 : 1)) || (pt && pt[0] === x && pt[1] === y && g.tiles[y][x] !== G_);   // solo il Lume LANCIATO accende il vetro
      const ch = on ? floor : G_;
      if (g.tiles[y][x] !== ch) { g.tiles[y][x] = ch; changed = true; }
    }
    if (changed) g.redrawBg();
  };
  window.applyGlass = applyGlass;

  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.call(this, id);
    const def = ROOMS[id]; if (!def || !def.abyss) return;
    if (this.s.items.starlamp) this.entities.push(new Lume(this));
    for (const s of def.shadows || []) if (!this.s.flags['shadow:' + s.id]) this.entities.push(new ShadowWall(s));
    applyGlass(this);
    if (id === 'f:1,0' && !this.s.flags.fUmbra) {
      this.boss = new Umbra(); this.entities.push(this.boss);
      for (const [x, y] of [[7, 10], [8, 10]]) this.tiles[y][x] = 'W';
      this.redrawBg();
    }
  };

  /* il Lume: X lo lancia; X di nuovo, torna */
  const useItem = G.useItem;
  G.useItem = function () {
    if (this.equipped() !== 'starlamp') return useItem.call(this);
    if (!inAbyss(this)) { Sound.sfx('bump'); this.banner = { text: 'Il Lume brilla piano: qui c\'è già abbastanza luce', t: 90 }; return; }
    const L = lumeOf(this) || (this.entities.push(new Lume(this)), lumeOf(this));
    if (L.state === 'held') L.throwFrom(this);
    else if (L.state === 'placed' || L.state === 'fly') L.state = 'back';
  };
  const applyItem = G.applyItem;
  G.applyItem = function (kind, n) {
    applyItem.call(this, kind, n);
    if (kind === 'starlamp') { this.s.equip = 'starlamp'; if (inAbyss(this) && !lumeOf(this)) this.entities.push(new Lume(this)); this.saveGame(); }
    if (kind === 'pearl' && pearlCount(this) >= 3) this.pearlNote = true;
  };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.room && this.room.glass && this.state === 'play') applyGlass(this);
    // la marea anche quaggiù (quella del Ciclo 34 scorre solo sulla Costa): stesso orologio, stesse regole
    if (this.state === 'play' && inAbyss(this) && this.room.tide && window.applyTide) {
      if (!this.dialog) this.tideT++;
      if (this.tideLow() !== this.tideWasLow) { applyTide(this); if (this.tideLow()) Sound.sfx('splash'); }
    }
    if (this.starRise > 0) this.starRise--;
    if (this.pearlNote && !this.dialog && this.state === 'play') { this.pearlNote = false; this.say(['Le tre perle si scaldano insieme, come se si chiamassero. Nella Foresta d\'Alghe, la porta rotonda si è aperta.']); }
  };

  /* il cartello di fine Capitolo IV */
  const update = G.update;
  G.update = function () {
    if (this.state === 'chapter4') {
      this.t++; this.ch4T++;
      if (this.ch4T > 120 && (Input.hit('action') || Input.hit('start'))) {
        this.state = 'play'; this.s.flags.ch4Done = true; this.saveGame(); Sound.sfx('select');
        this.startWarp({ to: 'm:2,2', x: 7, y: 6, dir: 0 }, 'Z');   // di nuovo sull'isola, sotto il cielo
      }
      return;
    }
    update.call(this);
    if (this.ch4CardIn > 0 && this.state === 'play' && !this.dialog && --this.ch4CardIn === 0) { this.state = 'chapter4'; this.ch4T = 0; Sound.sfx('victory'); }
  };
  const render = G.render;
  G.render = function () {
    render.call(this);
    if (this.state !== 'chapter4') return;
    const t = this.ch4T, a = Math.min(0.75, t / 60), ta = Math.max(0, Math.min(1, (t - 30) / 40));
    sctx.fillStyle = 'rgba(4,8,24,' + a + ')'; sctx.fillRect(0, 0, GW * SCALE, GH * SCALE);
    if (ta <= 0) return;
    txt('CAPITOLO IV', 128, 46, { align: 'center', size: 11, color: '#c8bcd8', alpha: ta });
    txt('La Stella Caduta', 128, 63, { align: 'center', size: 12, font: TITLE_FONT, color: '#ffd870', alpha: ta });
    txt('— completato —', 128, 84, { align: 'center', size: 11, color: '#f4ecdc', alpha: ta });
    txt('Vespero è tornata in cielo, e il Faro veglia sulla costa.', 128, 104, { align: 'center', size: 10, color: '#f4ecdc', alpha: ta, maxW: 232 });
    txt('Ma laggiù, nel fondo che non ha fondo, qualcosa ha aperto un occhio...', 128, 116, { align: 'center', size: 10, color: '#a8c8f8', alpha: ta, maxW: 236 });
    txt('Tempo ' + fmtTime(this.s.time) + ' · Cuori ' + this.s.maxHp / 2, 128, 136, { align: 'center', size: 9, color: '#c8bcd8', alpha: ta });
    if (t > 120) txt('Premi ' + actKey(true) + ' per continuare', 128, 158, { align: 'center', size: 9, color: '#a898c0', alpha: 0.6 + Math.sin(t * 0.08) * 0.3 });
  };

  /* il buio della Fossa: si vede solo dove c'è luce */
  let darkCv = null;
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    const def = this.room; if (!def || !def.abyss) return;
    // i ponti di vetro accesi: vetro azzurro sopra la voragine
    for (const [x, y] of def.glass || []) if (this.tiles[y][x] !== G_) { c.fillStyle = 'rgba(150,200,240,0.35)'; c.fillRect(x * TS + 1, y * TS + 1, TS - 2, TS - 2); c.fillStyle = 'rgba(230,245,255,0.6)'; c.fillRect(x * TS + 2, y * TS + 2, 5, 1); }
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#7aa0b0'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore();   // il colore del fondo marino
    const d = darkCv || (darkCv = makeCanvas(PLAY_W, PLAY_H)), x = d.getContext('2d');
    x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, PLAY_W, PLAY_H);
    x.fillStyle = this.s.flags.starFreed && this.roomId === 'f:1,0' ? 'rgba(2,6,16,0.6)' : 'rgba(2,6,16,0.93)'; x.fillRect(0, 0, PLAY_W, PLAY_H);
    x.globalCompositeOperation = 'destination-out';
    const hole = (hx, hy, r, a) => { const gr = x.createRadialGradient(hx, hy, r * 0.25, hx, hy, r); gr.addColorStop(0, 'rgba(0,0,0,' + a + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.beginPath(); x.arc(hx, hy, r, 0, Math.PI * 2); x.fill(); };
    const p = this.player, L = lumeOf(this);
    hole(p.cx(), p.cy() - 3, (this.s.items.lantern ? 30 : 24) + (L && L.state === 'held' ? 6 : 0), 1);
    if (L && L.state !== 'held') hole(L.x, L.y, L.ink > 0 ? 18 : LUME_R + 10, 1);
    for (const e of this.entities) {
      if (e instanceof Jelly && !e.dead) hole(e.cx(), e.cy(), 18, 0.8);
      if (e instanceof Chest && !e.opened && /pearl/.test(e.def.id || '')) hole(e.cx(), e.cy(), 16, 0.6);
    }
    if (this.roomId === 'f:1,0' && !this.s.flags.starFreed) hole(128, 22, 46, 0.9);   // il nucleo della stella, dietro Umbra
    c.drawImage(d, 0, 0);
    // sopra il buio: gli occhi delle Ombre e il nucleo
    for (const e of this.entities) if (e instanceof Ombra && !e.dead && !e.lit) e.drawEyes(c);
    if (def.tide && (this.tideWarn() || !this.tideLow())) {   // la schiuma si vede anche al buio: l'acqua sta tornando
      const warn = this.tideWarn();
      for (const [tx, ty] of def.tide) { c.fillStyle = warn ? 'rgba(255,255,255,' + (0.4 + Math.sin(this.t * 0.4 + tx) * 0.3) + ')' : 'rgba(180,220,255,0.25)'; for (let i = 0; i < (warn ? 3 : 1); i++) c.fillRect(tx * TS + ((this.t * 0.7 + i * 5 + ty * 3) % 14), ty * TS + 4 + i * 3, 3, 1); }
    }
    if (this.roomId === 'f:1,0' && !this.s.flags.starFreed) {
      const beat = (this.t % 90) < 8 ? 2 : 0;
      c.fillStyle = 'rgba(255,240,180,0.25)'; c.beginPath(); c.arc(128, 14, 10 + beat, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff6d0'; c.fillRect(125 - beat / 2, 11 - beat / 2, 6 + beat, 6 + beat); c.fillStyle = '#ffffff'; c.fillRect(127, 13, 2, 2);
    }
    if (this.starRise > 0) {   // la stella risale
      const k = 1 - this.starRise / 240, y = 40 - k * 80;
      c.fillStyle = 'rgba(255,244,200,' + (0.4 * (1 - k)) + ')'; c.fillRect(124, Math.max(0, y), 8, PLAY_H);
      c.fillStyle = '#ffffff'; c.fillRect(126, Math.round(y), 4, 4);
    }
    for (let i = 0; i < 10; i++) { const bx = (i * 53 + this.t * 0.2) % PLAY_W, by = PLAY_H - ((this.t * (0.3 + (i % 3) * 0.15) + i * 41) % PLAY_H); c.fillStyle = 'rgba(180,220,255,0.35)'; c.fillRect(Math.round(bx), Math.round(by), 1, 1); }   // bollicine
  };

  /* mappa e inventario */
  const mp = G.mapPrefix;
  G.mapPrefix = function () { return this.roomId.startsWith('f:') ? 'f:' : mp.call(this); };

  /* dopo la stella: la costa risponde */
  const add = (room, id, fn) => { const n = (ROOMS[room] && ROOMS[room].npcs || []).find(x => x.id === id); if (n) { const t0 = n.talk; n.talk = function (g) { return fn(g) || t0.call(this, g); }; } };
  add('i:capitaneria', 'marisa', g => g.s.flags.starFreed && !g.s.flags.marisaStar ? (g.s.flags.marisaStar = true, ['Marisa: Lio! Stanotte il mare non brillava più, e la stella era lassù, al suo posto. I pescatori sono già usciti. Porto Corallo ti deve tutto.']) : null);
  add('i:osteria', 'lina', g => g.s.flags.starFreed && !g.s.flags.linaStar ? (g.s.flags.linaStar = true, ['Lina: Te l\'avevo detto: il mare e il cielo sono fratelli gelosi. Ma stavolta il cielo ha avuto un amico in più.', 'Lina: Però stai attento, ragazzo. Il mare non dimentica mai uno sgarbo...']) : null);
  add('i:faro', 'ugo', g => g.s.flags.starFreed && !g.s.flags.ugoStar ? (g.s.flags.ugoStar = true, ['Ugo: La lente canta da sola, stanotte. La stessa nota di sempre, ma più forte. Credo che sia lei che ringrazia.']) : null);

  /* diario, obiettivo, Segnavia */
  if (window.CHAPTERS4) CHAPTERS4.push(
    { name: 'La Fossa senza fondo', done: g => !!g.s.flags.fIn },
    { name: 'Il Lume di Stella', done: g => !!g.s.items.starlamp },
    { name: 'La stella torna in cielo', done: g => !!g.s.flags.starFreed },
  );
  const fGoal = g => {
    const f = g.s.flags, it = g.s.items;
    if (!f.craterOpen || !ROOMS[STAR_ROOM]) return null;
    if (f.starFreed) return 'none';
    if (!f.fIn) return 'f:1,2';
    if (!it.starlamp) return 'f:0,2';
    const miss = FOSSA_PEARLS.find(p => !f['chest:' + p.id]); if (miss) return miss.room;
    return 'f:1,0';
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const goal = fGoal(g), f = g.s.flags, it = g.s.items;
    if (!goal) return co(g);
    if (goal === 'none') return f.ch4Done ? 'Vespero è tornata in cielo e il Faro veglia sulla costa. Goditi la valle... ma tieni d\'occhio il mare.' : 'Vespero sale in cielo.';
    if (!f.fIn) return co(g);
    if (!it.starlamp) return 'Buio pesto. A ovest della Discesa c\'è il relitto di una nave del Faro: forse a bordo c\'è ancora una luce.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    if (pearlCount(g) < 3) return 'Perle di luce (' + pearlCount(g) + '/3): oltre il ponte di vetro, nella grotta della marea, dietro i muri d\'ombra. Il Lume si lancia.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    return "La porta delle perle è aperta: scendi nel Cuore dell'Abisso, dove batte il nucleo della stella.";
  };
  window.currentObjective = currentObjective;
  if (typeof objectiveRoom === 'function') {
    const or0 = objectiveRoom, oc0 = objectiveChest;
    objectiveRoom = function (g) { const t = fGoal(g); return t === 'none' ? null : t || or0(g); };
    window.objectiveRoom = objectiveRoom;
    objectiveChest = function (g) { return g.roomId === 'f:0,2' && !g.s.items.starlamp ? 'starlamp' : FOSSA_PEARLS.some(p => p.room === g.roomId && !g.s.flags['chest:' + p.id]) ? 'pearl' : oc0(g); };
  }

  if (typeof BESTIARY !== 'undefined') {
    const pic = (mk2, w, h) => { let cv = null; return () => cv || (cv = (() => { const c2 = makeCanvas(w, h), e = mk2(); try { e.draw(c2.getContext('2d'), Game); } catch (err) {} return c2; })()); };
    BESTIARY.push(
      { k: 'ombra', name: 'Ombra', spr: pic(() => { const o = new Ombra(0, -2); o.lit = true; return o; }, 16, 16),
        lore: 'Abitano la Fossa senza fondo, dove il sole non è mai arrivato. Nel buio non hanno corpo: solo occhi.',
        weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Al buio sono intoccabili. Col Lume vicino si rannicchiano: due colpi.' },
      { k: 'umbra', name: 'Umbra', boss: true, spr: pic(() => { const u = new Umbra(); u.x = 0; u.y = 0; u.state = 'idle'; return u; }, 48, 40),
        lore: 'La Piovra degli Abissi: il mare geloso che non voleva lasciar tornare la stella in cielo.',
        weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Con gli occhi gialli, lanciale il Lume: abbassa la testa. Con quelli rossi scaccia la luce.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Ombra ? 'ombra' : e instanceof Umbra ? 'umbra' : bk(e); };
  }
  if (typeof MEDALS !== 'undefined') MEDALS.push(
    { id: 'stellacaduta', name: 'Vespero torna in cielo', desc: 'Libera il nucleo della stella dalla Fossa.', icon: 'crystal', tier: 2, got: g => !!g.s.flags.starFreed },
    { id: 'ombre', name: 'Senza paura del buio', desc: 'Sconfiggi 8 Ombre.', icon: 'lantern', tier: 0, got: g => ((g.s.bestiary || {}).ombra || {}).n >= 8 });
  Object.assign(window, { Lume, ShadowWall, Ombra, Umbra, isLit, lumeOf, pearlCount, FOSSA_PEARLS });
})();
