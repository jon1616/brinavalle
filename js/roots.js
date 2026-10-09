'use strict';
/* =====================================================================
 *  ROOTS — Ciclo 23 (Agente A, seconda manche): «TORNO PRESTO».
 *  Il filo lasciato dal Ciclo 22 (il taccuino del padre di Lio, trovato
 *  seguendo i fuochi fatui) porta a una storia che si chiude:
 *  · Teodoro rilegge l'ultima pagina: «il male ha radici più profonde del trono».
 *  · Nel Trono dei Rovi si apre una scala: le RADICI DEL TRONO (r:), tre sale.
 *      r:1,2 Discesa      — arena: la saracinesca si apre sconfitti i guardiani
 *      r:1,1 Groviglio    — un abisso da attraversare con l'arpione (andata e ritorno)
 *      r:1,0 Cuore        — quattro BULBI tengono chiuso un bozzolo di spine:
 *                           colpito, un bulbo si chiude per pochi secondi.
 *                           Vanno chiusi TUTTI INSIEME (due solo con l'arpione).
 *  · Nel bozzolo dorme il padre di Lio. Poi si torna a casa, insieme.
 *  Tutto è dopo la vittoria: la storia principale non cambia.
 * ===================================================================== */
PEOPLE.father = { h: '#5a3a22', s: '#e8b890', x: '#c8a040', c: '#4a6a8a', d: '#34506a', p: '#4a3a2a', b: '#2a1a10', beard: true };
SPR.people.father = buildHumanoid(PEOPLE.father);

const BULB_WIN = () => [600, 480, 360][Opts.diff];   // frame in cui un bulbo resta chiuso (Facile, Normale, Eroe)

/* ------------------------------ stanze ------------------------------ */
Object.assign(ROOMS, {
  'r:1,2': {
    name: 'Radici del Trono - Discesa', ground: 'dungeon', music: 'dungeon',
    tiles: [
      'WWWWWWWJJWWWWWWW',
      'WVPPPPPPPPPPPPVW',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'WVPPPPPUUPPPPPVW',
      'WWWWWWWWWWWWWWWW',
    ],
    warps: { '7,9': { to: 'd:1,0', x: 7, y: 5, dir: 0 }, '8,9': { to: 'd:1,0', x: 7, y: 5, dir: 0 } },
    clearFlag: 'cleared:r:1,2',
    shutters: [{ tiles: [[7, 0], [8, 0]], flag: 'cleared:r:1,2' }],
    enemies: [{ type: 'skeleton', x: 4, y: 2 }, { type: 'skeleton', x: 11, y: 2 }, { type: 'plant', x: 2, y: 5 }, { type: 'plant', x: 13, y: 5 }],
    onEnter: g => {
      if (g.s.flags.rootsIn) return;
      g.s.flags.rootsIn = true;
      g.say([
        "Sotto il trono, l'aria è umida e sa di terra. Radici grosse come tronchi strisciano sulle pareti.",
        'Le vecchie armature del tempio sono scese fin quaggiù. Montano ancora la guardia...',
      ]);
    },
  },
  'r:1,1': {
    name: 'Radici del Trono - Groviglio', ground: 'dungeon', music: 'dungeon',
    tiles: [
      'WWWWWWWPPWWWWWWW',
      'WVPPPPPhPPPPPPVW',
      'WPPPPPPPPPPPPPPW',
      'W______________W',
      'W______________W',
      'W______________W',
      'W______________W',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPhPPPPPPW',
      'WVPPPPPPPPPPPPVW',
      'WWWWWWWPPWWWWWWW',
    ],
    enemies: [{ type: 'bat', x: 4, y: 4 }, { type: 'bat', x: 11, y: 5 }],
    onEnter: g => {
      if (g.s.flags.rootsPit) return;
      g.s.flags.rootsPit = true;
      g.say(['Le radici hanno scavato una voragine. Dall\'altra parte, un anello di ferro piantato nella roccia...']);
    },
  },
  'r:1,0': {
    name: 'Radici del Trono - Cuore', ground: 'dungeon',
    get music() { return Game.s && Game.s.flags.fatherFreed ? 'temple' : 'boss'; },
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'W______PP______W',
      'W_P____PP____P_W',
      'W______PP______W',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    onEnter: g => {
      const f = g.s.flags;
      if (f.fatherFreed || f.rootsHeart) return;
      f.rootsHeart = true;
      g.say([
        'In fondo alla sala, un bozzolo di spine pulsa piano, come un cuore. Dentro... una sagoma umana.',
        'Quattro bulbi rossi lo nutrono. Colpito, un bulbo si chiude, ma solo per poco: bisogna chiuderli tutti insieme.',
      ]);
    },
  },
});

/* ------------------------------ bulbo delle radici ------------------------------ */
class Bulb extends Enemy {
  constructor(tx, ty) {
    super(tx * TS, ty * TS);
    this.solid = true; this.ignoreClear = true; this.hp = 99;
    this.hb = { x: 2, y: 2, w: 12, h: 12 };
    this.closed = 0; this.withered = false; this.shootT = 90 + (Math.random() * 90 | 0);
  }
  close(g) {
    if (this.withered) return;
    if (!this.closed) { Sound.sfx('hit'); g.puff(this.cx(), this.cy(), '#d04a6a'); }
    this.closed = BULB_WIN(); this.flash = 10;
  }
  hurt(g) { if (this.inv > 0) return; this.inv = 14; this.close(g); }
  hookHit(g) { Sound.sfx('hookhit'); this.close(g); }
  bombHit(g) { this.close(g); }
  update(g) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0) this.inv--;
    if (this.withered) return;
    if (this.closed > 0) {
      if (--this.closed === 0) { Sound.sfx('shutter'); g.puff(this.cx(), this.cy(), '#ff8aa0'); }
      return;
    }
    if (--this.shootT <= 0) {   // da aperto, sputa una spina verso Lio
      this.shootT = 150 + (Math.random() * 60 | 0);
      const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1;
      if (d < 130 && !g.dialog) { g.projectiles.push(new Projectile(this.cx() - 3, this.cy() - 3, dx / d * 1.3, dy / d * 1.3, 'thorn')); Sound.sfx('shoot'); }
    }
  }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y), cx = X + 8, cy = Y + 8;
    // radici che lo legano al pavimento
    c.fillStyle = '#3a2418'; c.fillRect(X + 1, Y + 13, 14, 2); c.fillRect(X + 3, Y + 11, 2, 3); c.fillRect(X + 11, Y + 11, 2, 3);
    if (this.withered) {
      c.fillStyle = '#4a3a30'; c.fillRect(X + 5, Y + 8, 6, 5); c.fillStyle = '#2a2018'; c.fillRect(X + 6, Y + 6, 4, 3);
      return;
    }
    const white = this.flash > 0 && (this.flash >> 1) % 2 === 0;
    if (this.closed) {   // bocciolo chiuso, e un anello che si consuma: quanto resta
      c.fillStyle = white ? '#fff' : '#5a2a3a'; c.fillRect(X + 5, Y + 4, 6, 9); c.fillRect(X + 4, Y + 6, 8, 5);
      c.fillStyle = '#7a3a4a'; c.fillRect(X + 6, Y + 5, 2, 6);
      c.fillStyle = '#3a6a2a'; c.fillRect(X + 4, Y + 10, 3, 3); c.fillRect(X + 9, Y + 10, 3, 3);
      const k = this.closed / BULB_WIN(), n = Math.ceil(k * 12);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + i / 12 * Math.PI * 2;
        c.fillStyle = k < 0.3 && (this.t >> 3) % 2 ? '#ff6060' : '#ffe0a0';
        c.fillRect(Math.round(cx + Math.cos(a) * 9) - 1, Math.round(cy + Math.sin(a) * 9) - 1, 2, 2);
      }
      return;
    }
    const pulse = Math.sin(this.t * 0.12) > 0 ? 1 : 0;
    c.fillStyle = white ? '#fff' : '#3a6a2a';   // petali
    c.fillRect(X + 1, Y + 6, 4, 4); c.fillRect(X + 11, Y + 6, 4, 4); c.fillRect(X + 6, Y + 1, 4, 3);
    c.fillStyle = white ? '#fff' : '#b02a4a'; c.fillRect(X + 4 - pulse, Y + 4 - pulse, 8 + pulse * 2, 9 + pulse * 2);
    c.fillStyle = '#e04a6a'; c.fillRect(X + 5, Y + 5, 6, 3);
    c.fillStyle = '#ffd0a0'; c.fillRect(X + 7, Y + 8, 2, 2);   // il cuore del bulbo
    c.fillStyle = '#1a0a10'; c.fillRect(X + 6, Y + 11, 4, 1);
  }
}

/* ------------------------------ il bozzolo di spine ------------------------------ */
class Cocoon extends Entity {
  constructor() { super(7 * TS, 1 * TS); this.solid = true; this.hb = { x: 2, y: 0, w: 28, h: 30 }; this.t = 0; this.burst = 0; }
  update(g) { this.t++; if (this.burst > 0 && ++this.burst > 72) this.dead = true; }
  draw(c) {
    const X = this.x, Y = this.y, t = this.t;
    if (this.burst > 70) return;
    const k = this.burst ? 1 - this.burst / 70 : 1, beat = !this.burst && (t % 70 < 6) ? 1 : 0;
    // la sagoma addormentata, dentro
    c.globalAlpha = 0.55 * k; c.drawImage(SPR.people.father.down[0], X + 8, Y + 6); c.globalAlpha = 1;
    // spine intrecciate
    for (let i = 0; i < 44; i++) {
      const ring = i % 2, a = i / 44 * Math.PI * 2 + (ring ? t * 0.004 : -t * 0.003), r = (ring ? 11 : 14) + (i % 3) + beat + (1 - k) * 20;
      const x = Math.round(X + 16 + Math.cos(a) * r * 0.85), y = Math.round(Y + 15 + Math.sin(a) * r);
      c.globalAlpha = k;
      c.fillStyle = i % 4 ? '#4a2a1a' : '#6a3a24'; c.fillRect(x - 2, y - 1, 4, 3);
      c.fillStyle = '#d0b090'; c.fillRect(x + (i % 2 ? 2 : -2), y - 2, 1, 1);
    }
    c.globalAlpha = 1;
  }
}

/* ------------------------------ logica della sala del Cuore ------------------------------ */
(function installRoots() {
  const G = Game;
  const BULBS = [[2, 2], [13, 2], [4, 7], [11, 7]];

  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.call(this, id);
    this.cocoon = null;
    this.rootsScene = 0;   // Ciclo 24 (Agente B): la scena in sospeso non deve "seguire" Lio in un'altra stanza o in un'altra partita
    if (id !== 'r:1,0') return;
    const freed = this.s.flags.fatherFreed;
    if (freed && !this.s.flags.fatherHome) this.rootsScene = 30;   // liberato ma la scena non è finita: si ripete (e il Cuore di Cristallo non va perso)
    for (const [x, y] of BULBS) { const b = new Bulb(x, y); b.withered = !!freed; this.entities.push(b); }
    if (!freed) { this.cocoon = new Cocoon(); this.entities.push(this.cocoon); }
  };

  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.roomId !== 'r:1,0' || this.s.flags.fatherFreed || !this.cocoon || this.cocoon.burst) return;
    const bulbs = this.entities.filter(e => e instanceof Bulb);
    if (bulbs.length && bulbs.every(b => b.closed > 0)) freeFather(this, bulbs);
  };

  function freeFather(g, bulbs) {
    for (const b of bulbs) { b.withered = true; b.closed = 0; g.puff(b.cx(), b.cy(), '#6a4a3a'); }
    g.projectiles = [];
    g.cocoon.burst = 1; g.shake = 14; Sound.sfx('roar');
    g.s.flags.fatherFreed = true; g.saveGame();
    Sound.music('temple');
    g.rootsScene = 90;   // il bozzolo si sfalda, poi parla
  }

  const update = G.update;
  G.update = function () {
    update.call(this);
    if (this.rootsScene > 0 && this.state === 'play' && --this.rootsScene === 0) fatherScene(this);
  };

  function fatherScene(g) {
    const dad = new NPC(Object.assign({}, FATHER_NPC, { x: 7.5, y: 3 }));
    dad.def = FATHER_NPC; g.entities.push(dad); g.puff(dad.cx(), dad.cy(), '#ffe0a0');
    Sound.sfx('secret');
    const fox = g.entities.find(e => typeof Fox !== 'undefined' && e instanceof Fox);
    g.say([
      'Le radici si ritirano con un lungo sospiro. Dal bozzolo scivola fuori un uomo, pallido ma vivo.',
      '???: ...Lio? Sei davvero tu? Quanto sei cresciuto...',
      'Papà: Sono sceso quaggiù la notte in cui il Cuore fu rubato. Volevo strappare il male alla radice... e la radice ha preso me.',
      'Papà: Ho dormito tre lune tra le spine. Sentivo solo un battito lontano. Poi, di colpo, la luce. Sei stato tu, vero?',
      ...(fox ? ['Cocca annusa le mani dell\'uomo e scodinzola. Ha già deciso che è della famiglia.'] : []),
      "Papà: Avevo scritto «torno presto». Ci ho messo un po'... Prendi questo: l'ho tenuto stretto per tutto il tempo.",
      ...(g.s.flags.fatherGift ? [] : [g2 => { g2.s.flags.fatherGift = true; }, ...g.giveItem('container')]),   // una volta sola, anche se la scena si ripete
      'Papà: Conosco un passaggio che risale verso il villaggio. Andiamo a casa, Lio. Insieme.',
    ], () => {
      g.startWarp({ to: 'o:1,2', x: 4, y: 4, dir: 0 }, 'Z');
      g.s.flags.fatherHome = true;
    });
  }

  /* il padre, a casa: davanti alla casa di Teodoro */
  const FATHER_NPC = { id: 'padre', sprite: 'father', x: 5, y: 4, static: true, cond: g => g.s.flags.fatherFreed, talk: g => {
    const f = g.s.flags, it = g.s.items;
    if (!f.fatherHello) {
      f.fatherHello = true;
      return [
        'Papà: Brinavalle è proprio come la ricordavo. Anzi, no: è più luminosa.',
        'Papà: Teodoro mi ha raccontato tutto. La spada, le Rovine, il Re dei Rovi... Sono fiero di te, Lio.',
      ];
    }
    const lines = [
      it.compass ? "Papà: La mia vecchia bussola! Bortolo ha fatto un bel lavoro con quell'ago." : 'Papà: Un tempo avevo una bussola che sentiva i segreti. Chissà che fine ha fatto...',
      'Papà: Di notte, le finestre accese del villaggio... non sai quanto mi sono mancate.',
      f.foxFreed ? 'Papà: Quel volpacchiotto non ti perde di vista un attimo. Hai scelto bene il tuo compagno.' : 'Papà: Riposati un po\', ora. L\'avventura può aspettare fino a domattina.',
      g.s.fishLog && Object.keys(g.s.fishLog).length ? 'Papà: Pino dice che sei diventato un bravo pescatore. Una di queste mattine andiamo al lago insieme.' : 'Papà: Quando piove, al lago i pesci grossi vengono a riva. Me lo insegnò Pino, tanti anni fa.',
    ];
    f.fatherIdx = ((f.fatherIdx || 0) + 1) % lines.length;
    return [lines[f.fatherIdx]];
  } };
  ROOMS['o:1,2'].npcs.push(FATHER_NPC);
  window.FATHER_NPC = FATHER_NPC;

  /* il Trono dei Rovi: la scala verso le radici */
  const throne = ROOMS['d:1,0'];
  throne.dyn = (throne.dyn || []).concat([{ x: 7, y: 4, ch: 'Z', cond: g => g.s.flags.rootsHint }]);
  throne.warps = Object.assign({}, throne.warps, { '7,4': { to: 'r:1,2', x: 7, y: 8, dir: 1 } });
  const thEnter = throne.onEnter;
  throne.onEnter = g => {
    if (g.s.flags.rootsHint && !g.s.flags.rootsStair) {
      g.s.flags.rootsStair = true;
      g.say(['Dove sedeva il Re dei Rovi, le radici si sono ritirate. Al loro posto, una scala scende nel buio.']);
      return;
    }
    return thEnter(g);
  };

  /* Teodoro: l'ultima pagina del taccuino; e poi, il ritorno */
  const elder = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
  const talk = elder.talk;
  elder.talk = function (g) {
    const f = g.s.flags;
    if (f.fatherFreed) return f.fatherHome ? [
      'Teodoro: Tuo padre è a casa! Tre lune ad aspettarlo... e l\'hai riportato tu.',
      'Teodoro: Ora Brinavalle ha di nuovo tutta la sua luce, Lio.',
    ] : talk.call(this, g);
    if (f.bivouac && !f.rootsHint) {
      const before = f.bivouacTold ? [] : talk.call(this, g);
      return [...before,
        "Teodoro: Aspetta, Lio. C'è un'ultima pagina. Un disegno: il trono delle Rovine... e, sotto, radici.",
        'Teodoro: «Il male ha radici più profonde del trono. Scendo a tagliarle.» ...Non ha scritto altro.',
        'Teodoro: Le radici del trono. Se c\'è anche solo una possibilità... Va\', Lio. Ma torna, mi raccomando.',
        g2 => { g2.s.flags.rootsHint = true; g2.saveGame(); },
      ];
    }
    return talk.call(this, g);
  };

  /* la bussola sente il bozzolo finché il padre non è libero */
  const ch = compassHas;
  compassHas = function (g, id) {
    if (g.s.flags.rootsHint && !g.s.flags.fatherFreed && (id === 'd:1,0' || id === 'r:1,0')) return true;
    return ch(g, id);
  };

  /* Bestiario: il bulbo delle radici */
  if (typeof BESTIARY !== 'undefined') {
    let pic = null;
    BESTIARY.push({ k: 'bulb', name: 'Bulbo delle radici', seenIsEnough: true,
      spr: () => pic || (pic = (() => { const cv = makeCanvas(16, 16), b = new Bulb(0, 0); b.t = 0; b.draw(cv.getContext('2d')); return cv; })()),
      lore: 'Cuori rossi delle radici del trono. Nutrivano il bozzolo di spine dove dormiva il padre di Lio.',
      weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ "Colpito si chiude, poi riapre. Chiudili tutti insieme: ai lontani arriva l'arpione." });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Bulb ? 'bulb' : bk(e); };
  }
  if (typeof SIDE_QUESTS !== 'undefined') SIDE_QUESTS.push({ name: 'Torno presto',
    seen: g => g.s.flags.rootsHint, done: g => g.s.flags.fatherFreed,
    hint: "L'ultima pagina del taccuino parla di radici più profonde del trono. Scendi sotto il Trono dei Rovi." });
  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'padre', name: 'Torno presto', desc: 'Riporta a casa il padre di Lio.', icon: 'heart', tier: 2, got: g => g.s.flags.fatherFreed });
})();
