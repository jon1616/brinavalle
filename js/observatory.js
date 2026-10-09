'use strict';
/* =====================================================================
 *  OBSERVATORY — Ciclo 33 (Agente A, seconda manche): CAPITOLO III, parte
 *  seconda: «L'OSSERVATORIO DI VESPER».
 *  Le tre lenti e il raggio della stella della sera (Ciclo 32) aprono il
 *  portone. Dentro, il tempo è fermo: è l'ora in cui Vesper diede la sua
 *  voce alla stella. Con la MERIDIANA DI VESPER (tasto X) le ore girano:
 *  GIORNO → TRAMONTO → NOTTE. Ogni ora cambia le sale:
 *    · porte del SOLE (aperte di giorno), della LUNA (di notte), del TRAMONTO
 *    · PONTI DI STELLE sulle voragini (di notte) e PONTI D'AMBRA (al tramonto)
 *    · gli ASTRINI: pietra di giorno, lenti al tramonto, rapidi di notte
 *  · 7 sale (prefisso v:, mappa «OSSERVATORIO»):
 *      v:1,2 Sala delle Ore          (ingresso; porta del sole a nord, della luna a est)
 *      v:0,2 Sala della Meridiana    (la Meridiana)
 *      v:2,2 Ponte delle Stelle      (notte e tramonto: la Lente del telescopio)
 *      v:1,1 Galleria delle Costellazioni (cinque stelle da calpestare in ordine, di notte)
 *      v:0,1 Biblioteca di Vesper    (dietro la porta del tramonto: il suo diario)
 *      v:2,1 Sala dei Guardiani      (guardiani di bronzo: un Cuore di Cristallo)
 *      v:1,0 La Cupola               (l'ARMILLA, custode di Vesper; poi Vesper)
 *  · Il finale: la lente nel telescopio, la nota del Diapason (la nota di Elva
 *    era la nota di Vesper) e Vesper ritrova la VOCE. Il Cuore canta.
 *  Flag: vIn, items.sundial, s.obsTime, cleared:v:0,2, vLens, vStars,
 *        vpage1..3, cleared:v:2,1, vArmilla, vesperVoice, ch3Done.
 * ===================================================================== */
const OBS_TIMES = ['day', 'dusk', 'night'];
const OBS_NAMES = { day: 'Mezzogiorno', dusk: 'Tramonto', night: 'Notte' };
const obsTime = g => g.s.obsTime || 'dusk';   // entrando, è l'ora in cui il portone si è aperto
const inObs = g => !!g.roomId && (g.roomId.startsWith('v:') || !!(g.room && g.room.obs));   // Ciclo 39: anche le stanze di altri dungeon con «obs»
const STAR_ORDER = [[12, 2], [4, 8], [3, 2], [11, 8], [7, 4]];   // la costellazione: 1, 2, 3, 4, 5 punte di luce

/* ------------------------------ oggetto, sprite ------------------------------ */
ITEMS.sundial = { name: 'Meridiana di Vesper', text: () => 'Hai trovato la MERIDIANA DI VESPER! Dentro l\'Osservatorio, premi ' + bombKey() + ' per far girare le ore: mezzogiorno, tramonto, notte. Cambi oggetto con ' + (isTouch() ? 'il pulsante ⇄' : 'il tasto Q') + '.' };
ITEMS.vlens = { name: 'Lente del Telescopio', text: () => 'Hai trovato la LENTE DEL TELESCOPIO! È grande come un piatto, e dentro trema una stella.' };
INVENTORY.push(['sundial', 'Meridiana']);
EQUIPS.push('sundial');
ICON.sundial = spriteFromRows([
  '...oooo...',
  '..oyyyyo..',
  '.oyywyyyo.',
  'oyyywyyyyo',
  'oyyywyyyyo',
  'oyyyowwwyo',
  'oyyyyyyyyo',
  '.oyyyyyyo.',
  '..oyyyyo..',
  '...oooo...',
], { o: '#1a1420', y: '#e8c050', w: '#5a3a1a' });
PEOPLE.vesper = { h: '#e8e8f0', s: '#e0b890', x: '#e8c050', c: '#2a3a7a', d: '#1a2a5a', p: '#1a2a5a', b: '#2a1a10', beard: true };
SPR.people.vesper = buildHumanoid(PEOPLE.vesper);

/* ------------------------------ stanze ------------------------------ */
const VG = (tiles, open, kind) => ({ tiles, open, kind });   // un varco che si apre a certe ore (o con una condizione)
Object.assign(ROOMS, {
  'v:1,2': {
    name: 'Osservatorio - Sala delle Ore', ground: 'dungeon', music: 'temple', obs: true,
    tiles: [
      'WWWWWWWJJWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPJ',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPUUPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    warps: { '7,9': { to: 'a:1,2', x: 7, y: 5, dir: 1 }, '8,9': { to: 'a:1,2', x: 7, y: 5, dir: 1 } },
    gates: [VG([[7, 0], [8, 0]], g => obsTime(g) === 'day', 'sun'), VG([[15, 5]], g => obsTime(g) === 'night', 'moon')],
    signs: { '4,8': ['Inciso nel bronzo: «Il sole apre le porte del giorno, la luna quelle della notte. Chi possiede le ore possiede l\'Osservatorio».'] },
    onEnter: g => {
      const f = g.s.flags;
      if (f.vIn) return;
      f.vIn = true;
      g.say([
        "Dentro l'Osservatorio l'aria è immobile, color ambra. Al centro della sala, una grande meridiana segna sempre la stessa ora: il tramonto.",
        "Le porte hanno disegni diversi: un sole, una luna. Nessuna maniglia. Qui dentro, sembra, decidono le ore.",
      ]);
    },
  },
  'v:0,2': {
    name: 'Osservatorio - Sala della Meridiana', ground: 'dungeon', music: 'temple', obs: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPP',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    clearFlag: 'cleared:v:0,2',
    enemies: [{ type: 'astrino', x: 3, y: 2 }, { type: 'astrino', x: 12, y: 3 }, { type: 'astrino', x: 4, y: 8 }, { type: 'astrino', x: 11, y: 8 }],
    chests: [{ id: 'v_sundial', x: 7, y: 5, item: 'sundial', cond: g => g.s.flags['cleared:v:0,2'] }],
    onEnter: g => {
      if (g.s.flags['cleared:v:0,2'] || g.s.flags.vSundialSeen) return;
      g.s.flags.vSundialSeen = true;
      g.say(['Piccole stelle cadute dal soffitto si staccano dal pavimento e prendono a girarti intorno. Al centro della sala, un piedistallo vuoto aspetta.']);
    },
  },
  'v:2,2': {
    name: 'Osservatorio - Ponte delle Stelle', ground: 'dungeon', music: 'temple', obs: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'W______________W',
      'W______________W',
      'W______________W',
      'WPP____________W',
      'PPP___P___PP___W',
      'WPP____________W',
      'W______________W',
      'W______________W',
      'W______________W',
      'WWWWWWWWWWWWWWWW',
    ],
    bridges: [{ tiles: [[3, 5], [4, 5], [5, 5]], when: 'night' }, { tiles: [[7, 5], [8, 5], [9, 5]], when: 'dusk' }],
    chests: [{ id: 'v_lens', x: 11, y: 5, item: 'vlens' }],
    enemies: [{ type: 'astrino', x: 8, y: 2 }],
    onEnter: g => {
      if (g.s.flags.vBridgeSeen) return;
      g.s.flags.vBridgeSeen = true;
      g.say(["Una voragine senza fondo. Laggiù, su un'isola, c'è un forziere. Nel vuoto si intravedono due ponti fantasma: uno fatto di stelle, l'altro d'ambra."]);
    },
  },
  'v:1,1': {
    name: 'Osservatorio - Galleria delle Costellazioni', ground: 'dungeon', music: 'temple', obs: true,
    tiles: [
      'WWWWWWWJJWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'JPPPPPPPPPPPPPPP',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    gates: [VG([[7, 0], [8, 0]], g => !!g.s.flags.vStars, 'stars'), VG([[0, 5]], g => obsTime(g) === 'dusk', 'dusk')],
    signs: { '7,8': ['Sul pavimento, un mosaico di stelle: «Contale come le contava Vesper: una, due, tre, quattro, cinque. Ma solo quando è notte».'] },
    onEnter: g => {
      if (g.s.flags.vStars || g.s.flags.vGallerySeen) return;
      g.s.flags.vGallerySeen = true;
      g.say(['Una galleria lunghissima, con il soffitto dipinto di costellazioni. Una porta a nord ha la forma di una stella a cinque punte.']);
    },
  },
  'v:0,1': {
    name: 'Osservatorio - Biblioteca di Vesper', ground: 'wood', music: 'temple', obs: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WkkkkkkWWkkkkkkW',
      'WwwwwwwwwwwwwwwW',
      'WwwkwwwwwwwwkwwW',
      'WwwwwwwwwwwwwwwW',
      'Wwwwwwwwwwwwwwww',
      'WwwwwwwwwwwwwwwW',
      'WwwkwwwwwwwwkwwW',
      'WwwwwwwwwwwwwwwW',
      'WkkkkkkkkkkkkkkW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'v_diary', x: 7, y: 2, item: 'gems', n: 100, cond: g => pagesRead(g) >= 3 }],
    signs: {
      '3,3': g => readPage(g, 1, ['Il diario di Vesper, prima pagina: «Ogni sera la stella mi guarda. Ogni sera le canto la stessa canzone. Elva dice che la canto meglio di lei, ma non è vero».']),
      '12,3': g => readPage(g, 2, ['Seconda pagina: «Le notti della valle sono lunghe e fredde. Se la mia stella mi aiutasse, potrei fare una luce che scaldi tutti. Ma ogni dono chiede un dono».']),
      '12,7': g => readPage(g, 3, ['Ultima pagina, la scrittura che trema: «Le ho dato la mia voce. Il Cuore splende sulla valle. Elva non mi guarda più. Non posso nemmeno chiamarla per dirle che mi dispiace».']),
    },
    onEnter: g => {
      if (g.s.flags.vLibrarySeen) return;
      g.s.flags.vLibrarySeen = true;
      g.say(['Una biblioteca fermata al tramonto. Tre leggii reggono pagine scritte a mano, con la stessa grafia minuta e ordinata.']);
    },
  },
  'v:2,1': {
    name: 'Osservatorio - Sala dei Guardiani', ground: 'dungeon', music: 'temple', obs: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    clearFlag: 'cleared:v:2,1',
    enemies: [{ type: 'skeleton', x: 4, y: 3 }, { type: 'skeleton', x: 11, y: 3 }, { type: 'astrino', x: 7, y: 8 }, { type: 'astrino', x: 12, y: 7 }],
    chests: [{ id: 'v_heart', x: 7, y: 5, item: 'container', cond: g => g.s.flags['cleared:v:2,1'] }],
  },
  'v:1,0': {
    name: 'Osservatorio - La Cupola', ground: 'dungeon', obs: true,
    get music() { return Game.s && Game.s.flags.vArmilla ? 'temple' : 'boss'; },
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    npcs: [{ id: 'vesper', sprite: 'vesper', x: 8, y: 2.2, static: true, talk: g => vesperTalk(g) }],
  },
});
function pagesRead(g) { return [1, 2, 3].filter(n => g.s.flags['vpage' + n]).length; }
function readPage(g, n, lines) {
  const first = !g.s.flags['vpage' + n];
  g.s.flags['vpage' + n] = true;
  const out = [...lines];
  if (first && pagesRead(g) >= 3) out.push(g2 => { g2.spawnChests(); Sound.sfx('secret'); return ['Hai letto tutto il diario. Sotto l\'ultimo leggio scatta un piccolo scomparto: dentro c\'è uno scrigno.']; });
  return out;
}

/* ------------------------------ l'Astrino ------------------------------ */
class Astrino extends Enemy {
  constructor(x, y) { super(x, y); this.hp = 2; this.dmg = 1; this.hb = { x: 3, y: 3, w: 10, h: 10 }; this.ph = Math.random() * 6; this.shot = 60 + (Math.random() * 60 | 0); this.clinkCd = 0; }
  mopts() { return { warpSolid: true, edgeSolid: true, entities: false, pitSolid: false, self: this }; }
  get stone() { return obsTime(Game) === 'day'; }
  hurt(g, d, dir) {
    if (this.stone) { if (this.clinkCd <= 0) { this.clinkCd = 20; Sound.sfx('clank'); g.spark(this.cx(), this.cy()); } return; }
    super.hurt(g, d, dir);
  }
  bombHit(g) { if (!this.stone) { this.inv = 0; this.hurt(g, 2, 0); } }
  hookHit(g) { if (!this.stone) { this.stunT = 60; this.flash = 6; Sound.sfx('hookhit'); } }
  update(g) {
    if (this.clinkCd > 0) this.clinkCd--;
    this.ph += 0.08;
    if (this.stone) { this.t++; return; }   // di giorno è pietra: ferma, innocua, invulnerabile
    if (this.baseUpdate()) return;
    if (g.entryGrace > 0) return;
    const night = obsTime(g) === 'night', p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1, sp = night ? 0.62 : 0.32;
    moveEntity(this, dx / d * sp + Math.cos(this.ph) * 0.3, dy / d * sp + Math.sin(this.ph) * 0.3, this.mopts());
    if (night && --this.shot <= 0) { this.shot = 130; if (d < 150) { g.projectiles.push(new StarShard(this.cx(), this.cy(), dx / d * 1.4, dy / d * 1.4)); Sound.sfx('shoot'); } }
    this.touchPlayer(g);
  }
  draw(c) {
    const X = Math.round(this.x) + 8, Y = Math.round(this.y + (this.stone ? 0 : Math.sin(this.ph) * 1.5)) + 8, t = obsTime(Game);
    const col = t === 'day' ? '#8a8478' : t === 'dusk' ? '#f0a050' : '#e8f0ff', core = t === 'day' ? '#6a6458' : t === 'dusk' ? '#ffe0a0' : '#ffffff';
    if (t === 'night') { c.fillStyle = 'rgba(200,220,255,0.25)'; c.beginPath(); c.arc(X, Y, 8, 0, Math.PI * 2); c.fill(); }
    const white = this.flash > 0 && (this.flash >> 1) % 2 === 0, rot = t === 'day' ? 0 : this.ph * 0.6;
    for (let i = 0; i < 5; i++) {   // cinque punte
      const a = rot + i / 5 * Math.PI * 2 - Math.PI / 2;
      c.fillStyle = '#1a1420'; c.fillRect(Math.round(X + Math.cos(a) * 5) - 1, Math.round(Y + Math.sin(a) * 5) - 1, 3, 3);
      c.fillStyle = white ? '#ffffff' : col; c.fillRect(Math.round(X + Math.cos(a) * 5), Math.round(Y + Math.sin(a) * 5), 1, 1); c.fillRect(Math.round(X + Math.cos(a) * 3), Math.round(Y + Math.sin(a) * 3), 2, 2);
    }
    c.fillStyle = '#1a1420'; c.fillRect(X - 3, Y - 3, 6, 6); c.fillStyle = white ? '#ffffff' : col; c.fillRect(X - 2, Y - 2, 4, 4); c.fillStyle = core; c.fillRect(X - 1, Y - 1, 2, 2);
  }
}
class StarShard {
  constructor(x, y, vx, vy) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.t = 0; this.dead = false; this.kind = 'star'; this.dmg = 1; this.w = this.h = 5; }
  box() { return { x: this.x - 2, y: this.y - 2, w: 5, h: 5 }; }
  update(g) {
    this.t++; this.x += this.vx; this.y += this.vy;
    if (this.t > 200 || this.x < -8 || this.y < -8 || this.x > PLAY_W + 8 || this.y > PLAY_H + 8) { this.dead = true; return; }
    if (this.t > 6 && boxHitsSolid(this.box(), { edgeSolid: true })) { this.dead = true; g.spark(this.x, this.y); return; }
    if (overlap(this.box(), g.player.box())) { g.player.hurt(g, this.dmg, this.x, this.y); this.dead = true; }
  }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y), on = (this.t >> 2) % 2;
    c.fillStyle = 'rgba(200,220,255,0.35)'; c.fillRect(X - 3, Y - 3, 7, 7);
    c.fillStyle = '#ffffff'; c.fillRect(X - 1, Y, 3, 1); c.fillRect(X, Y - 1, 1, 3);
    if (on) { c.fillStyle = '#a8c8ff'; c.fillRect(X - 2, Y - 2, 1, 1); c.fillRect(X + 2, Y + 2, 1, 1); }
  }
}

/* ------------------------------ le stelle della costellazione ------------------------------ */
class StarMark extends Entity {
  constructor(i, x, y) { super(x * TS, y * TS); this.i = i; this.hb = { x: 3, y: 3, w: 10, h: 10 }; this.t = 0; }
  get sortY() { return -1; }   // sul pavimento
  update(g) {
    this.t++;
    if (g.s.flags.vStars || obsTime(g) !== 'night') return;
    const on = overlap(this.box(), g.player.box());
    if (on && !this.was) {
      const seq = g.starSeq || (g.starSeq = []);
      if (seq.includes(this.i)) { this.was = on; return; }
      if (this.i !== seq.length) {   // stella sbagliata: la costellazione si spegne
        g.starSeq = []; Sound.sfx('hush'); g.starFail = 40;
      } else {
        seq.push(this.i); Sound.sfx(['bellHi', 'bellMid', 'bellLo', 'bellMid', 'bellHi'][this.i] || 'gem');
        if (seq.length === STAR_ORDER.length) {
          g.s.flags.vStars = true; g.saveGame(); Sound.sfx('secret'); g.shake = 8;
          applyObsTime(g);
          g.say(['Le cinque stelle si accendono insieme e disegnano una figura sul pavimento: un uomo che guarda in alto. La porta a forma di stella, a nord, si apre.']);
        }
      }
    }
    this.was = on;
  }
  draw(c, g) {
    const night = obsTime(g) === 'night', lit = g.s.flags.vStars || (g.starSeq || []).includes(this.i);
    const X = this.x + 8, Y = this.y + 8;
    if (!night && !g.s.flags.vStars) { c.fillStyle = 'rgba(120,110,90,0.35)'; c.fillRect(X - 1, Y - 1, 3, 3); return; }   // di giorno: solo un segno nel mosaico
    c.fillStyle = lit ? 'rgba(255,240,180,0.35)' : 'rgba(180,200,255,0.25)'; c.beginPath(); c.arc(X, Y, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = lit ? '#fff2b0' : '#c8d8ff'; c.fillRect(X - 2, Y - 2, 4, 4); c.fillStyle = '#ffffff'; c.fillRect(X - 1, Y - 1, 2, 2);
    for (let k = 0; k <= this.i; k++) {   // le punte di luce: una, due, tre, quattro, cinque
      const a = k / (this.i + 1) * Math.PI * 2 + this.t * 0.02;
      c.fillStyle = lit ? '#ffe8a0' : '#a8c0ff'; c.fillRect(Math.round(X + Math.cos(a) * 6), Math.round(Y + Math.sin(a) * 6), 1, 1);
    }
    if (g.starFail > 0 && (g.starFail >> 2) % 2) { c.fillStyle = 'rgba(90,80,120,0.6)'; c.fillRect(X - 4, Y - 4, 8, 8); }
  }
}

/* ------------------------------ il telescopio ------------------------------ */
class Telescope extends Entity {
  constructor() { super(4 * TS, TS); this.solid = true; this.hb = { x: 2, y: 2, w: 60, h: 14 }; this.t = 0; }
  update() { this.t++; }
  draw(c, g) {
    const X = this.x, Y = this.y;
    c.fillStyle = '#1a1420'; c.fillRect(X + 4, Y + 3, 58, 12);
    c.fillStyle = '#8a6a3a'; c.fillRect(X + 5, Y + 4, 56, 10);   // il tubo, di ottone
    c.fillStyle = '#c8a050'; c.fillRect(X + 5, Y + 5, 56, 2);
    c.fillStyle = '#5a4020'; for (const k of [14, 30, 46]) c.fillRect(X + k, Y + 4, 2, 10);
    const lens = g.s.flags.vLensSet;
    c.fillStyle = lens ? '#c8e0ff' : '#2a2030'; c.fillRect(X + 58, Y + 5, 4, 8);   // l'oculare: vuoto, o con la lente
    if (lens && (this.t >> 3) % 3) { c.fillStyle = '#ffffff'; c.fillRect(X + 59, Y + 7, 1, 1); }
  }
}

/* ------------------------------ L'ARMILLA, custode della Cupola ------------------------------ */
class Armilla extends Enemy {
  constructor() {
    super(128 - 14, 60);
    this.hp = this.maxHp = 12; this.dmg = 1; this.title = "ARMILLA DI VESPER";
    this.hb = { x: 6, y: 6, w: 16, h: 16 }; this.state = 'intro'; this.timer = 70; this.open = 0; this.shut = 0; this.hits = 0;
    this.cool = 90; this.falls = []; this.ignoreClear = true; this.clink = 0;
  }
  get phase2() { return this.hp <= 6; }
  get vulnerable() { return this.open > 0.8 && this.state === 'turn'; }
  get sortY() { return this.y + 28; }
  hurt(g) {
    if (this.state !== 'turn' || this.inv > 0) return;
    if (!this.vulnerable) { if (this.clink <= 0) { this.clink = 20; Sound.sfx('clank'); g.spark(this.cx(), this.cy()); } return; }
    this.hp -= 1; this.flash = 12; this.inv = 18; g.shake = 4; Sound.sfx('bossHit');
    if (g.stopFor) g.stopFor(this.hp <= 0 ? 10 : 5);
    if (g.impact) g.impact(this.cx(), this.cy(), this.hp <= 0);
    if (this.hp <= 0) {
      this.state = 'dying'; this.timer = 140; Sound.sfx('roar'); Sound.music(null);
      for (const p of g.projectiles) p.dead = true;
      for (const e of g.entities) if (e.enemy && e !== this && !e.dead) e.die(g);
      return;
    }
    if (++this.hits >= 3) { this.hits = 0; this.shut = 200; Sound.sfx('shutter'); g.shake = 8; }   // al terzo colpo gli anelli si richiudono di scatto
  }
  bombHit(g) { if (this.vulnerable) { this.inv = 0; this.hurt(g); } }
  update(g) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0) this.inv--;
    if (this.clink > 0) this.clink--;
    if (this.state === 'intro') { if (--this.timer <= 0) this.state = 'turn'; return; }
    if (this.state === 'dying') {
      if (this.t % 5 === 0) g.particles.push(new Particle(this.cx() + (Math.random() - 0.5) * 24, this.cy() + (Math.random() - 0.5) * 24, (Math.random() - 0.5), -0.8, 36, Math.random() < 0.5 ? '#e8c050' : '#c8d8ff', 2, 0.02));
      if (--this.timer <= 0) { this.dead = true; armillaDefeated(g, this); }
      return;
    }
    const time = obsTime(g), p = g.player;
    if (this.shut > 0) this.shut--;
    const target = time === 'night' && this.shut <= 0 ? 1 : 0;
    this.open += (target - this.open) * 0.06;
    // si muove su una figura di Lissajous; di giorno scivola piano verso Lio
    const tx = 128 - 14 + Math.sin(this.t * (this.phase2 ? 0.014 : 0.011)) * 64, ty = 64 + Math.sin(this.t * 0.017) * 22;
    if (time === 'day') { const dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1; this.x += dx / d * 0.35; this.y += dy / d * 0.35; this.y = Math.max(16, Math.min(120, this.y)); }
    else { this.x += (tx - this.x) * 0.03; this.y += (ty - this.y) * 0.03; }
    if (--this.cool <= 0) {
      if (time === 'night') {   // pioggia di schegge a raggiera
        const n = this.phase2 ? 12 : 8; this.cool = this.phase2 ? 85 : 110;
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + this.t * 0.01; g.projectiles.push(new StarShard(this.cx(), this.cy(), Math.cos(a) * 1.25, Math.sin(a) * 1.25)); }
        Sound.sfx('shoot');
        if (this.phase2) this.falls.push({ x: p.cx(), y: p.cy(), t: 70 });   // e una stella cadente dove sei
      } else if (time === 'dusk') {
        this.cool = 140;
        for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.projectiles.push(new StarShard(this.cx(), this.cy(), Math.cos(a) * 1.0, Math.sin(a) * 1.0)); }
        Sound.sfx('shoot');
      } else this.cool = 60;
    }
    for (const f of this.falls) if (--f.t === 0) {
      g.shake = 6; Sound.sfx('boom'); for (let i = 0; i < 10; i++) g.particles.push(new Particle(f.x, f.y, (Math.random() - 0.5) * 2, -Math.random() * 2, 24, '#ffe8a0', 2, 0.1));
      if (Math.hypot(p.cx() - f.x, p.cy() - f.y) < 14) p.hurt(g, 1, f.x, f.y - 8);
    }
    this.falls = this.falls.filter(f => f.t > 0);
    this.touchPlayer(g);
  }
  draw(c, g) {
    if (this.state === 'dying' && (this.t >> 2) % 2) return;
    const cx = Math.round(this.x + 14), cy = Math.round(this.y + 14), t = this.t, o = this.open;
    for (const f of this.falls) {   // il bersaglio della stella cadente
      const k = 1 - f.t / 70; c.strokeStyle = 'rgba(255,232,160,' + (0.3 + k * 0.6) + ')'; c.lineWidth = 1;
      c.beginPath(); c.arc(f.x, f.y, 14 - k * 6, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#ffffff'; c.fillRect(Math.round(f.x) - 1, Math.round(f.y - 60 * (1 - k)) - 1, 2, 4);
    }
    drawShadow(c, cx, cy + 22, 18);
    c.fillStyle = 'rgba(232,192,80,0.12)'; c.beginPath(); c.arc(cx, cy, 20, 0, Math.PI * 2); c.fill();
    // gli anelli: chiusi stretti sul nucleo, aperti di notte
    const rings = [[18, 6, 0.012], [16, 10, -0.017], [14, 14, 0.022]];
    rings.forEach(([r, w, sp], i) => {
      const a = t * sp + i, rr = r - (1 - o) * (i * 2), ry = Math.max(2, w * (0.4 + o * 0.6));
      c.strokeStyle = '#1a1420'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy, rr, ry, a, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = this.flash > 0 && (this.flash >> 1) % 2 === 0 ? '#ffffff' : i === 1 ? '#c8a050' : '#e8c050'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, cy, rr, ry, a, 0, Math.PI * 2); c.stroke();
    });
    // il nucleo: chiuso (bronzo) o aperto (una piccola stella viva)
    const k = Math.min(1, o);
    c.fillStyle = '#1a1420'; c.beginPath(); c.arc(cx, cy, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = k > 0.8 ? '#ffffff' : '#8a6a3a'; c.beginPath(); c.arc(cx, cy, 6, 0, Math.PI * 2); c.fill();
    if (k > 0.2) { c.fillStyle = 'rgba(200,220,255,' + (k * 0.8) + ')'; c.beginPath(); c.arc(cx, cy, 4 + Math.sin(t * 0.3), 0, Math.PI * 2); c.fill(); }
    if (this.shut > 0) { c.fillStyle = '#5a4020'; c.fillRect(cx - 7, cy - 1, 14, 2); c.fillRect(cx - 1, cy - 7, 2, 14); }
  }
}

function armillaDefeated(g, b) {
  const f = g.s.flags;
  f.vArmilla = true;
  if (typeof bestMark === 'function') bestMark(g, b, true);
  g.boss = null;
  for (const [x, y] of [[7, 10], [8, 10]]) g.tiles[y][x] = 'P';
  g.redrawBg();
  g.pickups.push(new Pickup(b.cx(), b.cy() + 6, 'container'));
  Sound.sfx('secret'); Sound.music('temple'); g.saveGame();
  g.say(['Gli anelli della sfera si fermano e cadono a terra, uno dopo l\'altro, con un suono di campane rotte.',
    'Dietro, davanti al grande telescopio, siede un uomo vecchissimo, avvolto in un mantello trapunto di stelle. Ti guarda. Le labbra si muovono, ma non esce alcuna voce.']);
}

/* Vesper: muto finché non torna la voce */
function vesperTalk(g) {
  const f = g.s.flags;
  if (!f.vArmilla) return ['Il vecchio non si muove. Tra te e lui, la sfera di bronzo gira e gira.'];
  if (f.vesperVoice) return [{ text: 'Vesper: La mia stella conosce tutte le strade della valle. Vuoi che ti riporti a Brinavalle?', choices: [
    { label: 'Sì, a casa', fn: g2 => { g2.startWarp({ to: 'o:1,2', x: 7, y: 6, dir: 0 }, 'Z'); return []; } },
    { label: 'Resto ancora', fn: () => ['Vesper: Allora guarda il cielo con me. Non ho più fretta: ho una voce, adesso.'] },
  ] }];
  if (!g.s.items.vlens) return ['Vesper indica il telescopio: l\'oculare è vuoto. Poi indica la porta, e fa il gesto di una cosa rotonda che brilla.',
    '(Manca la lente del telescopio. Forse è dove le stelle fanno da ponte.)'];
  return vesperScene(g);
}
function vesperScene(g) {
  const f = g.s.flags;
  g.s.obsTime = 'night'; applyObsTime(g);
  return [
    'Monti la Lente del Telescopio nell\'oculare. Vesper accosta l\'occhio e trema: nel cannocchiale, enorme e vicinissima, brilla la stella della sera.',
    g2 => { g2.s.flags.vLensSet = true; },
    'Il Diapason d\'Argento vibra da solo nella tua mano. Elva lo aveva detto: la tua nota è la stessa di Vesper.',
    'Fai suonare il Diapason. La stella risponde: un filo di luce scende dal cielo, attraversa la cupola e tocca la gola del vecchio.',
    g2 => { g2.vesperGlow = 200; Sound.sfx('ring'); Sound.sfx('fairy'); },
    'Vesper: ...Io... io parlo. Dopo tutti questi secoli... io parlo.',
    'Vesper: Ho dato la mia voce alla mia stella perché il Cuore facesse luce sulla valle. Credevo che una luce valesse più di una voce.',
    'Gli racconti della Torre, del silenzio, della nebbia. E del messaggio.',
    'Vesper: «Digli che Elva ha ascoltato»... Per tutto questo tempo, nel silenzio, lei ha ascoltato. E io non potevo nemmeno chiamarla.',
    'Vesper: Allora canterò. Per lei, per la valle, e per il ragazzo che mi ha riportato la voce.',
    'Vesper canta. Non è una canzone che conosci, eppure ti sembra di conoscerla da sempre.',
    'Lontano, nel giardino di Brinavalle, il Cuore di Vesper risponde. Canta anche lui, per la prima volta, e tutta la valle si ferma ad ascoltare.',
    g2 => { g2.s.flags.vesperVoice = true; g2.saveGame(); g2.ch3CardIn = 60; },
  ];
}

/* le porte e i ponti seguono l'ora */
function applyObsTime(g) {
  const def = g.room; if (!def || !def.obs) return;
  const t = obsTime(g), floor = floorOf(def.ground);
  let changed = false;
  const set = (x, y, ch) => { if (g.tiles[y][x] !== ch) { g.tiles[y][x] = ch; changed = true; } };
  // una porta non si chiude mai addosso a Lio: resta aperta finché non si sposta (il bot ci era rimasto murato dentro)
  const pb = g.player && g.player.box(), onIt = (x, y) => pb && overlap(pb, { x: x * TS, y: y * TS, w: TS, h: TS });
  g.obsPending = false;
  for (const gt of def.gates || []) for (const [x, y] of gt.tiles) {
    if (!gt.open(g) && onIt(x, y)) { g.obsPending = true; continue; }
    set(x, y, gt.open(g) ? floor : 'J');
  }
  for (const br of def.bridges || []) for (const [x, y] of br.tiles) set(x, y, br.when === t ? floor : '_');
  if (changed) g.redrawBg();
}

/* ------------------------------ installazione ------------------------------ */
(function installObservatory() {
  const G = Game;
  const mk = makeEnemy;
  makeEnemy = function (def) { return def.type === 'astrino' ? new Astrino(def.x * TS, def.y * TS) : mk(def); };

  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.call(this, id);
    const def = ROOMS[id]; if (!def || !def.obs) return;
    applyObsTime(this);
    if (id === 'v:1,1') { this.starSeq = []; STAR_ORDER.forEach(([x, y], i) => this.entities.push(new StarMark(i, x, y))); }
    if (id === 'v:1,0') {
      this.entities.push(new Telescope());
      if (!this.s.flags.vArmilla) {
        this.boss = new Armilla(); this.entities.push(this.boss);
        for (const [x, y] of [[7, 10], [8, 10]]) this.tiles[y][x] = 'W';
        this.redrawBg();
      }
    }
  };

  /* la Meridiana: X fa girare le ore (solo dentro l'Osservatorio) */
  const useItem = G.useItem;
  G.useItem = function () {
    if (this.equipped() !== 'sundial') return useItem.call(this);
    const p = this.player;
    if ((p.dialCd || 0) > 0) return;
    if (!inObs(this)) { p.dialCd = 40; Sound.sfx('bump'); this.banner = { text: 'Qui fuori le ore sono del cielo', t: 90 }; return; }
    p.dialCd = 60;
    const t = OBS_TIMES[(OBS_TIMES.indexOf(obsTime(this)) + 1) % OBS_TIMES.length];
    this.s.obsTime = t; this.obsFlash = 24;
    applyObsTime(this);
    Sound.sfx(t === 'night' ? 'bellLo' : t === 'dusk' ? 'bellMid' : 'bellHi');
    this.banner = { text: OBS_NAMES[t], t: 80 };
  };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    if (this.player && this.player.dialCd > 0) this.player.dialCd--;
    if (this.obsFlash > 0) this.obsFlash--;
    if (this.vesperGlow > 0) this.vesperGlow--;
    if (this.starFail > 0) this.starFail--;
    updatePlay.call(this);
    if (this.obsPending && this.state === 'play') applyObsTime(this);
  };
  const applyItem = G.applyItem;
  G.applyItem = function (kind, n) {
    applyItem.call(this, kind, n);
    if (kind === 'sundial') { this.s.equip = 'sundial'; this.saveGame(); }
  };

  /* entrando nella Cupola */
  const afterEnter = G.afterEnter;
  G.afterEnter = function () {
    const r = afterEnter.apply(this, arguments);
    const f = this.s.flags;
    if (this.roomId === 'v:1,0' && !f.vArmilla && !f.vCupola) {
      f.vCupola = true;
      this.say(['Sotto la cupola, una grande sfera di anelli di bronzo gira su se stessa, a mezz\'aria. Dietro di lei, nel buio, qualcuno siede davanti a un telescopio.',
        'La sfera si volta verso di te. Al centro, chiuso tra gli anelli, pulsa un nucleo di luce: si apre soltanto quando è notte.']);
    }
    return r;
  };

  /* il cartello di fine Capitolo III */
  const update = G.update;
  G.update = function () {
    if (this.state === 'chapter3') {
      this.t++; this.ch3T++;
      if (this.ch3T > 120 && (Input.hit('action') || Input.hit('start'))) { this.state = 'play'; this.s.flags.ch3Done = true; this.saveGame(); Sound.sfx('select'); }
      return;
    }
    update.call(this);
    if (this.ch3CardIn > 0 && this.state === 'play' && !this.dialog && --this.ch3CardIn === 0) { this.state = 'chapter3'; this.ch3T = 0; Sound.sfx('victory'); }
  };
  const render = G.render;
  G.render = function () {
    render.call(this);
    if (this.state !== 'chapter3') return;
    const t = this.ch3T, a = Math.min(0.75, t / 60), ta = Math.max(0, Math.min(1, (t - 30) / 40));
    sctx.fillStyle = 'rgba(8,6,24,' + a + ')'; sctx.fillRect(0, 0, GW * SCALE, GH * SCALE);
    if (ta <= 0) return;
    txt('CAPITOLO III', 128, 46, { align: 'center', size: 11, color: '#c8bcd8', alpha: ta });
    txt('Il Canto di Vesper', 128, 63, { align: 'center', size: 12, font: TITLE_FONT, color: '#ffd870', alpha: ta });
    txt('— completato —', 128, 84, { align: 'center', size: 11, color: '#f4ecdc', alpha: ta });
    txt('Vesper ha ritrovato la voce, e il Cuore canta.', 128, 104, { align: 'center', size: 10, color: '#f4ecdc', alpha: ta, maxW: 232 });
    txt('Ma quella notte, in cielo, una stella mancava all\'appello...', 128, 116, { align: 'center', size: 10, color: '#a8c8f8', alpha: ta, maxW: 232 });
    txt('Tempo ' + fmtTime(this.s.time) + ' · Cuori ' + this.s.maxHp / 2, 128, 136, { align: 'center', size: 9, color: '#c8bcd8', alpha: ta });
    if (t > 120) txt('Premi ' + actKey(true) + ' per continuare', 128, 158, { align: 'center', size: 9, color: '#a898c0', alpha: 0.6 + Math.sin(t * 0.08) * 0.3 });
  };

  /* l'aria dell'Osservatorio cambia con l'ora; la meridiana e le porte disegnate */
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    const def = this.room;
    if (!def || !def.obs) return;
    const t = obsTime(this);
    // i ponti fantasma (si intravedono sempre) e quelli veri
    for (const br of def.bridges || []) for (const [x, y] of br.tiles) {
      const on = br.when === t, X = x * TS, Y = y * TS, star = br.when === 'night';
      if (on) {
        c.fillStyle = star ? 'rgba(40,50,110,0.85)' : 'rgba(150,80,30,0.8)'; c.fillRect(X, Y + 2, TS, TS - 4);
        for (let i = 0; i < 5; i++) { c.fillStyle = star ? (i % 2 ? '#ffffff' : '#a8c8ff') : (i % 2 ? '#ffe0a0' : '#f0a050'); c.fillRect(X + ((i * 7 + (this.t >> 3)) % 15), Y + 3 + ((i * 5) % 10), 1, 1); }
      } else { c.fillStyle = star ? 'rgba(168,200,255,0.18)' : 'rgba(240,160,80,0.18)'; for (let k = 0; k < TS; k += 4) c.fillRect(X + k, Y + 7, 2, 2); }
    }
    // le porte: un emblema sopra (chiuse) o sul pavimento (aperte)
    for (const gt of def.gates || []) for (const [x, y] of gt.tiles) {
      const X = x * TS + 8, Y = y * TS + 8, open = gt.open(this);
      c.globalAlpha = open ? 0.35 : 1;
      if (gt.kind === 'sun') { c.fillStyle = '#e8c050'; c.beginPath(); c.arc(X, Y, 4, 0, Math.PI * 2); c.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.fillRect(Math.round(X + Math.cos(a) * 6), Math.round(Y + Math.sin(a) * 6), 1, 1); } }
      else if (gt.kind === 'moon') { c.fillStyle = '#d8e0f8'; c.beginPath(); c.arc(X, Y, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = '#4a4060'; c.beginPath(); c.arc(X + 2, Y - 1, 4, 0, Math.PI * 2); c.fill(); }
      else if (gt.kind === 'dusk') { c.fillStyle = '#f07a40'; c.beginPath(); c.arc(X, Y + 2, 5, Math.PI, 0); c.fill(); c.fillRect(X - 6, Y + 2, 12, 1); }
      else { c.fillStyle = '#fff2b0'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; c.fillRect(Math.round(X + Math.cos(a) * 5) - 1, Math.round(Y + Math.sin(a) * 5) - 1, 2, 2); } c.fillRect(X - 2, Y - 2, 4, 4); }
      c.globalAlpha = 1;
    }
    if (this.roomId === 'v:1,2') {   // la grande meridiana sul pavimento
      const X = 128, Y = 88;
      c.strokeStyle = 'rgba(232,192,80,0.6)'; c.lineWidth = 1; c.beginPath(); c.arc(X, Y, 22, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = 'rgba(232,192,80,0.7)'; c.fillRect(Math.round(X + Math.cos(a) * 19), Math.round(Y + Math.sin(a) * 19), 1, 1); }
      const ang = { day: -Math.PI / 2, dusk: 0.3, night: Math.PI / 2 + 0.6 }[t];
      c.strokeStyle = '#5a3a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + Math.cos(ang) * 17, Y + Math.sin(ang) * 17); c.stroke();
    }
    if (FEEL.on) {   // la luce dell'ora
      if (t === 'day') { c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(255,240,200,0.45)'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore();
        for (const bx of [40, 128, 216]) { c.fillStyle = 'rgba(255,244,210,0.07)'; c.fillRect(bx - 10, 0, 20, PLAY_H); } }
      else if (t === 'dusk') { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#f0b080'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore(); }
      else { c.fillStyle = 'rgba(10,14,44,0.45)'; c.fillRect(0, 0, PLAY_W, PLAY_H);
        for (let i = 0; i < 24; i++) { const x = (i * 83) % PLAY_W, y = (i * 47) % 40; c.fillStyle = Math.sin(this.t * 0.05 + i) > 0.5 ? '#ffffff' : 'rgba(200,220,255,0.5)'; c.fillRect(x, y, 1, 1); } }
    }
    if (this.obsFlash > 0) { c.fillStyle = 'rgba(255,240,200,' + (this.obsFlash / 24 * 0.5) + ')'; c.fillRect(0, 0, PLAY_W, PLAY_H); }
    if (this.vesperGlow > 0 && this.roomId === 'v:1,0') {   // il filo di luce dalla stella
      const k = Math.min(1, this.vesperGlow / 60); c.fillStyle = 'rgba(255,244,200,' + (0.5 * k) + ')'; c.fillRect(124, 0, 8, 26);
      c.fillStyle = 'rgba(255,255,255,' + k + ')'; c.fillRect(127, 0, 2, 26);
    }
  };

  /* mappa */
  const mp = G.mapPrefix;
  G.mapPrefix = function () { return this.roomId.startsWith('v:') ? 'v:' : mp.call(this); };

  /* dopo il Canto: la valle risponde */
  const elder = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
  if (elder) { const t0 = elder.talk; elder.talk = function (g) {
    const f = g.s.flags;
    if (f.vesperVoice && !f.elderSong) { f.elderSong = true; g.saveGame(); return [
      'Teodoro: Lio! L\'hai sentito anche tu? Il Cuore ha cantato per un\'ora intera, stanotte. Ortensio piangeva come un bambino.',
      'Teodoro: Vesper... ha ritrovato la voce? Allora le leggende erano vere, tutte quante. Mio nonno non ci avrebbe creduto.',
    ]; }
    return t0.call(this, g);
  }; }
  if (typeof FATHER_NPC !== 'undefined') { const t0 = FATHER_NPC.talk; FATHER_NPC.talk = function (g) {
    const f = g.s.flags;
    if (f.vesperVoice && !f.dadSong) { f.dadSong = true; g.saveGame(); return ['Papà: Il canto del Cuore si sentiva fin dal lago. Tua madre diceva sempre che la valle, un tempo, cantava. Adesso ci credo.']; }
    return t0.call(this, g);
  }; }

  /* diario, obiettivo, Segnavia */
  if (window.CHAPTERS3) CHAPTERS3.push(
    { name: "L'Osservatorio di Vesper", done: g => !!g.s.flags.vIn },
    { name: 'La Meridiana', done: g => !!g.s.items.sundial },
    { name: 'La voce di Vesper', done: g => !!g.s.flags.vesperVoice },
  );
  const obsGoal = g => {
    const f = g.s.flags, it = g.s.items;
    if (!f.observatoryOpen || !ROOMS[VESPER_ROOM]) return null;
    if (f.vesperVoice) return 'none';
    if (!f.vIn) return 'v:1,2';
    if (!it.sundial) return 'v:0,2';
    if (!it.vlens) return 'v:2,2';
    if (!f.vStars) return 'v:1,1';
    return 'v:1,0';
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const goal = obsGoal(g), f = g.s.flags, it = g.s.items;
    if (!goal) return co(g);
    if (goal === 'none') return f.ch3Done ? 'Il Cuore canta, e Vesper ha di nuovo una voce. Goditi la valle... e tieni d\'occhio il cielo.' : 'Vesper ha ritrovato la voce, e il Cuore canta.';
    if (!f.vIn) return co(g);
    if (!it.sundial) return "Nell'Osservatorio le porte obbediscono alle ore. Cerca qualcosa che le faccia girare: prova la sala a ovest.";
    if (!it.vlens) return 'La Meridiana cambia l\'ora. A est, la porta della luna si apre di notte: oltre il ponte di stelle c\'è una lente.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    if (!f.vStars) return 'La porta del sole, a nord, si apre a mezzogiorno. Nella Galleria, di notte, conta le stelle come Vesper.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    if (!f.vArmilla) return 'La porta a forma di stella è aperta: sali alla Cupola. Il nucleo della sfera si apre solo di notte.';
    return 'Monta la lente nel telescopio: parla con Vesper.';
  };
  window.currentObjective = currentObjective;
  if (typeof objectiveRoom === 'function') {
    const or0 = objectiveRoom, oc0 = objectiveChest;
    objectiveRoom = function (g) { const t = obsGoal(g); return t === 'none' ? null : t || or0(g); };
    window.objectiveRoom = objectiveRoom;
    objectiveChest = function (g) { return g.roomId === 'v:0,2' && !g.s.items.sundial ? 'sundial' : g.roomId === 'v:2,2' && !g.s.items.vlens ? 'vlens' : oc0(g); };
  }

  /* Bestiario, missione, medaglie */
  if (typeof BESTIARY !== 'undefined') {
    const pic = (mk2) => { let cv = null; return () => cv || (cv = (() => { const c2 = makeCanvas(32, 32), e = mk2(); e.x = 2; e.y = 2; e.t = 0; try { e.draw(c2.getContext('2d'), Game); } catch (err) {} return c2; })()); };
    BESTIARY.push(
      { k: 'astrino', name: 'Astrino', spr: pic(() => new Astrino(6, 6)),
        lore: "Stelle cadute dal soffitto dell'Osservatorio. Di giorno dormono come sassi; di notte si ricordano di essere stelle.",
        weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Di giorno sono pietra. Al tramonto sono lenti: bastano due colpi.' },
      { k: 'armilla', name: "L'Armilla", boss: true, spr: pic(() => { const a = new Armilla(); a.x = 2; a.y = 2; a.open = 1; return a; }),
        lore: 'La sfera armillare costruita da Vesper per seguire la sua stella. Da secoli fa la guardia al suo padrone muto.',
        weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Il nucleo si apre di notte: tre colpi, poi torna al giorno e respira.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Astrino ? 'astrino' : e instanceof Armilla ? 'armilla' : bk(e); };
  }
  if (typeof SIDE_QUESTS !== 'undefined') SIDE_QUESTS.push({ name: 'Il diario di Vesper',
    seen: g => g.visited.has('v:0,1'), done: g => pagesRead(g) >= 3, prog: g => pagesRead(g) + '/3',
    hint: 'Nella biblioteca dell\'Osservatorio, dietro la porta del tramonto, tre leggii custodiscono le pagine di Vesper.' });
  if (typeof MEDALS !== 'undefined') MEDALS.push(
    { id: 'vesper', name: 'La voce di Vesper', desc: 'Riporta la voce a Vesper: il Cuore canta.', icon: 'lens', tier: 2, got: g => !!g.s.flags.vesperVoice },
    { id: 'diario', name: 'Lettore di stelle', desc: 'Leggi tutto il diario di Vesper.', icon: 'key', tier: 0, got: g => pagesRead(g) >= 3 });
  Object.assign(window, { Astrino, Armilla, StarShard, StarMark, Telescope, applyObsTime, obsTime, pagesRead, STAR_ORDER });
})();
