'use strict';
/* =====================================================================
 *  TOWER — Ciclo 31 (Agente A, seconda manche): CAPITOLO II, parte seconda:
 *  «LA TORRE DEL SILENZIO».
 *  Le campane di Pietrabianca (Ciclo 30) hanno aperto il portone. Dentro, il
 *  suono non esiste: è il regno della SIGNORA DELLE NEBBIE, che diede i semi
 *  delle spine al Re dei Rovi e che con la nebbia ruba i ricordi.
 *  Teodoro l'aveva detto: «cerca il suono, è l'unica cosa che teme».
 *  · Nuovo oggetto: il DIAPASON D'ARGENTO (tasto X, si cambia con Q): un'onda
 *    sonora che fa suonare ciò che tace — veli di nebbia, campane mute,
 *    statue del coro, nemici velati, la Signora stessa.
 *  · 7 sale (prefisso t:, mappa «TORRE»):
 *      piano terra   t:1,2 Atrio del Silenzio   (il velo grande verso l'alto)
 *                    t:0,2 Sala delle Armature  (il Diapason)
 *                    t:2,2 Sala dell'Eco        (tre campane mute, in un ordine)
 *      primo piano   t:1,1 Galleria delle Voci  (i Velati; il sigillo del Coro)
 *                    t:0,1 Archivio dei Ricordi (quattro ricordi rubati in gabbie di nebbia)
 *                    t:2,1 Sala del Coro        (quattro statue da far cantare insieme)
 *      in cima       t:1,0 Trono del Silenzio   (la Signora delle Nebbie)
 *  · Nuovo nemico: il VELATO (la spada lo attraversa finché il Diapason non lo scuote).
 *  · Sconfitta la Signora, i ricordi rubati tornano a casa: anche quelli del padre di Lio.
 *  Flag: towerIn, items.diapason, towerEcho, veil:t_atrio, towerChoir, mem:1..4,
 *        towerLady, ladyTold, fatherRemembers.
 * ===================================================================== */
const WAVE_R = 38;                              // raggio massimo dell'onda del Diapason
const CHOIR_WIN = () => [720, 570, 450][Opts.diff];   // il bot ci mette ~345 frame: un umano va più piano   // quanto canta una statua del coro (frame)
const ECHO_ORDER = ['hi', 'lo', 'mid'];         // «prima la voce più acuta, poi la più grave, infine quella di mezzo»
const towerOn = g => !!g.s.flags.northBells;
const SING_WIN = () => [80, 56, 40][Opts.diff];   // quanto canta la Signora dopo la picchiata: l'unico momento in cui la nota la ferisce

/* ------------------------------ oggetto e icona ------------------------------ */
ITEMS.diapason = { name: "Diapason d'Argento", text: () => "Hai trovato il DIAPASON D'ARGENTO! Premi " + bombKey() + ' per farlo vibrare: la sua nota fa suonare ciò che tace e squarcia i veli di nebbia. Cambi oggetto con ' + (isTouch() ? 'il pulsante ⇄' : 'il tasto Q') + '.' };
INVENTORY.push(['diapason', 'Diapason']);
EQUIPS.push('diapason');
ICON.diapason = spriteFromRows([
  '..o....o..',
  '.owo..owo.',
  '.owo..owo.',
  '.owo..owo.',
  '.owo..owo.',
  '.owwooowo.',
  '..owwwwo..',
  '...owwo...',
  '....ow....',
  '....ow....',
  '...oddo...',
  '...oooo...',
], { o: '#1a1420', w: '#e8eef8', d: '#8a90a8' });
PEOPLE.lady = { h: '#c8ccd8', s: '#e8e4ee', x: '#9aa0b8', c: '#6a6e8a', d: '#4a4e66', p: '#4a4e66', b: '#2a2a3a' };
SPR.people.lady = buildHumanoid(PEOPLE.lady);

/* ------------------------------ stanze ------------------------------ */
Object.assign(ROOMS, {
  't:1,2': {
    name: 'Torre - Atrio del Silenzio', ground: 'dungeon', music: 'tower', tower: true,
    tiles: [
      'WWWWWWWPPWWWWWWW',
      'WbPPPPPPPPPPPPbW',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPP',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'WbPPPPPUUPPPPPbW',
      'WWWWWWWWWWWWWWWW',
    ],
    warps: { '7,9': { to: 'n:1,0', x: 7, y: 3, dir: 0 }, '8,9': { to: 'n:1,0', x: 7, y: 3, dir: 0 } },
    veils: [{ id: 't_atrio', x: 7, y: 0, w: 2, h: 1, needs: g => !!g.s.flags.towerEcho,
      no: ["Il velo trema appena, poi si richiude. La nota da sola non basta: servirebbe un'eco che la renda più forte."] }],
    signs: { '4,8': ['Una lapide consumata: «Elva cantava per Vesper, e la valle ascoltava. Poi Vesper scelse la luce, ed Elva scelse il silenzio.»'] },
    onEnter: g => {
      const f = g.s.flags;
      if (f.towerIn) return;
      f.towerIn = true;
      g.say([
        "Il portone si chiude alle tue spalle senza un rumore. Dentro la Torre non c'è un suono: né il vento, né i tuoi passi, né il tuo respiro.",
        'Davanti a te, la scala che sale è velata da una nebbia densa come lana. Le sale ai lati tacciono.',
        "Ti torna in mente Teodoro: «Cerca il suono, Lio. È l'unica cosa che teme».",
      ]);
    },
  },
  't:0,2': {
    name: 'Torre - Sala delle Armature', ground: 'dungeon', music: 'tower', tower: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPbbPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPP',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    clearFlag: 'cleared:t:0,2',
    enemies: [{ type: 'skeleton', x: 4, y: 3 }, { type: 'skeleton', x: 11, y: 3 }, { type: 'skeleton', x: 7, y: 8 }],
    chests: [{ id: 't_diapason', x: 7, y: 4, item: 'diapason', cond: g => g.s.flags['cleared:t:0,2'] }],
    onEnter: g => {
      if (g.s.flags['cleared:t:0,2'] || g.s.flags.towerArmor) return;
      g.s.flags.towerArmor = true;
      g.say(['Tre armature senza voce montano la guardia a un piedistallo vuoto. Si voltano verso di te, in silenzio.']);
    },
  },
  't:2,2': {
    name: "Torre - Sala dell'Eco", ground: 'dungeon', music: 'tower', tower: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    signs: { '7,8': ['Inciso sul pavimento: «Prima la voce più acuta, poi la più grave, infine quella di mezzo. Allora l\'eco salirà.»'] },
    onEnter: g => {
      if (g.s.flags.towerEcho || g.s.flags.towerEchoSeen) return;
      g.s.flags.towerEchoSeen = true;
      g.say(['Tre campane d\'argento pendono dal soffitto: una piccola, una grande, una media. Non oscillano. Non suonano.']);
    },
  },
  't:1,1': {
    name: 'Torre - Galleria delle Voci', ground: 'dungeon', music: 'tower', tower: true,
    tiles: [
      'WWWWWWWPPWWWWWWW',
      'WbPPPPPPPPPPPPbW',
      'WPPPPPPPPPPPPPPW',
      'WPPPYPPPPPPYPPPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPP',
      'WPPPPPPPPPPPPPPW',
      'WPPPYPPPPPPYPPPW',
      'WPPPPPPPPPPPPPPW',
      'WbPPPPPPPPPPPPbW',
      'WWWWWWWPPWWWWWWW',
    ],
    enemies: [{ type: 'velato', x: 3, y: 2 }, { type: 'velato', x: 12, y: 2 }, { type: 'velato', x: 7, y: 4 }],
    veils: [{ id: 't_coro_sigillo', x: 7, y: 0, w: 2, h: 1, seal: true, needs: g => !!g.s.flags.towerChoir,
      no: ['Su questo velo è inciso un coro di volti con la bocca cucita. Finché il coro tace, nessuna nota lo attraversa.'] }],
    onEnter: g => {
      if (g.s.flags.towerVoices) return;
      g.s.flags.towerVoices = true;
      g.say(['Figure incappucciate scivolano nell\'aria, trasparenti come fiato sul vetro. La spada le attraverserebbe senza toccarle...']);
    },
  },
  't:0,1': {
    name: 'Torre - Archivio dei Ricordi', ground: 'dungeon', music: 'tower', tower: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPP____PPPP_PPW',
      'WPPP_PP_PPPP_PPW',
      'WPPP____PPPPPPPW',
      'WPPPPPPPPPPPPPPP',
      'WPP____PPP___PPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 't_memories', x: 8, y: 8, item: 'container', cond: g => memCount(g) >= 4 }],
    enemies: [{ type: 'velato', x: 11, y: 8 }],
    onEnter: g => {
      if (g.s.flags.towerArchive) return;
      g.s.flags.towerArchive = true;
      g.say(['Piccole luci tremano dentro gabbie di nebbia, come lucciole in un barattolo. Ognuna sussurra qualcosa che nessuno può sentire.',
        'Sono RICORDI: quelli che la nebbia ha rubato alla gente del Nord.']);
    },
  },
  't:2,1': {
    name: 'Torre - Sala del Coro', ground: 'dungeon', music: 'tower', tower: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPYYPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPYYPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    enemies: [{ type: 'velato', x: 7, y: 5 }],
    onEnter: g => {
      if (g.s.flags.towerChoir || g.s.flags.towerChoirSeen) return;
      g.s.flags.towerChoirSeen = true;
      g.say(['Quattro statue di cantori, la bocca aperta su un canto che non esce. Se cantassero tutte insieme, forse...']);
    },
  },
  't:1,0': {
    name: 'Torre - Trono del Silenzio', ground: 'dungeon', tower: true,
    get music() { return Game.s && Game.s.flags.towerLady ? 'tower' : 'boss2'; },
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
  },
});

/* i ricordi dell'Archivio: dove sono e cosa raccontano */
const MEMORIES = [
  { n: 1, x: 5, y: 3, text: [
    "Il ricordo vola fino a te e si apre come un fiore. Una voce d'uomo, ruvida: «Mi chiamo Anselmo. Le mie pecore sono Neve e Bigia, e la mia casa è l'ultima prima del Valico».",
    'È il nome di uno dei pastori tornati senza ricordi. Da qualche parte, a Pietrabianca, un uomo si ferma e sorride senza sapere perché.'] },
  { n: 2, x: 10, y: 3, text: [
    'Una ninna nanna, cantata piano da una nonna. Non ne senti la musica, ma ne senti il calore.',
    'Il ricordo si scioglie nell\'aria e vola verso nord-ovest, verso una casa con il camino acceso.'] },
  { n: 3, x: 3, y: 8, text: [
    'Una sala piena di luce. Una donna dai capelli d\'argento canta davanti a un cristallo rosa. Un uomo con una corona di luce le dice: «Canta ancora, Elva».',
    'Elva... la Signora delle Nebbie, quando ancora aveva una voce. Questo ricordo non è stato rubato a nessuno: è suo.'] },
  { n: 4, x: 13, y: 8, text: [
    'Un bambino ride, in alto, sulle spalle di suo padre. Il Lago Specchio brilla al mattino. «Più in alto, papà! Più in alto!»',
    'Il cuore ti salta in gola. Quel bambino sei tu. È il ricordo che la nebbia aveva rubato a tuo padre.'] },
];
function memCount(g) { return MEMORIES.filter(m => g.s.flags['mem:' + m.n]).length; }

/* ------------------------------ l'onda del Diapason ------------------------------ */
class Wave extends Entity {
  constructor(x, y) { super(x, y); this.r = 4; this.t = 0; this.hit = new Set(); this.hb = { x: 0, y: 0, w: 0, h: 0 }; }
  get sortY() { return 999; }
  box() { return { x: -999, y: -999, w: 0, h: 0 }; }
  update(g) {
    this.t++; this.r = Math.min(WAVE_R, 4 + this.t * 2.2);
    for (const e of g.entities) {
      if (e === this || e.dead || !e.onRing || this.hit.has(e)) continue;
      const d = Math.hypot(e.cx() - this.x, e.cy() - this.y) - (e.ringR || 8);
      if (d <= this.r) { this.hit.add(e); e.onRing(g, this); }
    }
    for (const p of g.projectiles) if (p instanceof FogOrb && !p.dead && Math.hypot(p.x - this.x, p.y - this.y) <= this.r + 4) { p.dead = true; g.puff(p.x, p.y, '#c8ccd8'); }
    if (this.t > 26) this.dead = true;
  }
  draw(c) {
    const a = Math.max(0, 1 - this.t / 26);
    c.strokeStyle = 'rgba(235,242,255,' + (0.85 * a) + ')'; c.lineWidth = 2;
    c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(160,190,255,' + (0.5 * a) + ')'; c.lineWidth = 1;
    c.beginPath(); c.arc(this.x, this.y, Math.max(1, this.r - 5), 0, Math.PI * 2); c.stroke();
  }
}

/* ------------------------------ veli di nebbia ------------------------------ */
class FogVeil extends Entity {
  constructor(def) {
    super(def.x * TS, def.y * TS); this.def = def; this.solid = true;
    this.hb = { x: 0, y: 0, w: def.w * TS, h: def.h * TS }; this.ringR = Math.max(def.w, def.h) * 8; this.fade = 0; this.shiver = 0; this.t = 0;
  }
  onRing(g) {
    if (this.fade) return;
    if (this.def.needs && !this.def.needs(g)) {
      this.shiver = 24; Sound.sfx('bump');
      if (!g.dialog && this.def.no) g.say(this.def.no);
      return;
    }
    this.fade = 1; Sound.sfx('hush'); g.s.flags['veil:' + this.def.id] = true; g.saveGame();
  }
  update(g) {
    this.t++; if (this.shiver > 0) this.shiver--;
    if (this.def.seal && this.def.needs(g) && !this.fade) { this.fade = 1; g.s.flags['veil:' + this.def.id] = true; }
    if (this.fade && ++this.fade > 34) this.dead = true;
  }
  draw(c) {
    const X = this.x, Y = this.y, W = this.hb.w, H = this.hb.h, a = this.fade ? 1 - this.fade / 34 : 1, sh = this.shiver ? Math.sin(this.t * 1.3) * 2 : 0;
    c.fillStyle = 'rgba(190,196,214,' + (0.82 * a) + ')'; c.fillRect(X, Y, W, H);
    for (let i = 0; i < W * H / 18; i++) {   // fiocchi di nebbia che turbinano
      const px = (i * 37 + this.t * (0.3 + (i % 3) * 0.2)) % W, py = (i * 23 + Math.sin(this.t * 0.04 + i) * 3 + H) % H;
      c.fillStyle = i % 2 ? 'rgba(240,244,255,' + (0.7 * a) + ')' : 'rgba(120,126,150,' + (0.5 * a) + ')';
      c.fillRect(Math.round(X + px + sh), Math.round(Y + py), 2, 2);
    }
    if (this.def.seal && a > 0.5) {   // il sigillo del coro: volti con la bocca cucita
      for (const ox of [W / 2 - 9, W / 2 + 3]) { c.fillStyle = '#6a6e8a'; c.fillRect(X + ox, Y + 4, 6, 7); c.fillStyle = '#2a2a3a'; c.fillRect(X + ox + 1, Y + 6, 1, 1); c.fillRect(X + ox + 4, Y + 6, 1, 1); c.fillRect(X + ox + 1, Y + 9, 4, 1); }
    }
  }
}

/* ------------------------------ le campane mute (Sala dell'Eco) ------------------------------ */
class MuteBell extends Entity {
  constructor(x, y, size) { super(x * TS, y * TS); this.size = size; this.solid = true; this.hb = { x: 2, y: 2, w: 12, h: 12 }; this.swing = 0; this.t = 0; }
  onRing(g) {
    if (g.s.flags.towerEcho) return;
    this.swing = 60; Sound.sfx({ hi: 'bellHi', mid: 'bellMid', lo: 'bellLo' }[this.size]);
    const seq = g.echoSeq || (g.echoSeq = []);
    seq.push(this.size);
    if (seq.some((s, i) => s !== ECHO_ORDER[i])) {
      g.echoSeq = []; g.echoFail = 50;
      return;
    }
    if (seq.length === ECHO_ORDER.length) {
      g.s.flags.towerEcho = true; g.echoSeq = []; g.saveGame();
      Sound.sfx('secret'); g.shake = 10;
      g.say(['Le tre campane cominciano a suonare da sole, una dopo l\'altra, sempre più forte. L\'eco sale per le scale e per i muri...',
        'Da qualche parte, verso l\'atrio, la nebbia trema.']);
    }
  }
  update(g) { this.t++; if (this.swing > 0) this.swing--; if (g.echoFail > 0 && g.roomId === 't:2,2') g.echoFail--; }
  draw(c, g) {
    const s = { hi: 0.65, mid: 0.85, lo: 1.1 }[this.size], cx = this.x + 8, top = this.y - 2;
    const ang = this.swing ? Math.sin(this.swing * 0.35) * this.swing / 60 * 0.5 : 0;
    c.fillStyle = '#3a3a4a'; c.fillRect(cx - 1, top - 6, 2, 6);   // corda
    c.save(); c.translate(cx, top); c.rotate(ang);
    const W = 14 * s, h = Math.round(14 * s);
    const lit = g.s.flags.towerEcho || this.swing > 0;
    for (let r = 0; r < h; r++) {   // la sagoma: stretta in cima, svasata in fondo
      const k = r / (h - 1), w = Math.round(W * (0.42 + 0.48 * Math.pow(k, 1.6)) + (r >= h - 2 ? 2 : 0));
      c.fillStyle = '#1a1420'; c.fillRect(-Math.ceil(w / 2) - 1, r, w + 2, 1);
      c.fillStyle = r >= h - 2 ? '#6a6e8a' : lit ? '#f0f4ff' : '#9aa0b8'; c.fillRect(-Math.ceil(w / 2), r, w, 1);
      if (r > 1 && r < h - 2) { c.fillStyle = lit ? '#ffffff' : '#c8ccd8'; c.fillRect(-Math.ceil(w / 2) + 1, r, 1, 1); }
    }
    c.fillStyle = '#1a1420'; c.fillRect(-1, -2, 3, 2);   // l'anello in cima
    c.fillStyle = '#4a4e66'; c.fillRect(-1, h - 1, 2, 3); c.fillStyle = lit ? '#ffe8a0' : '#2a2a3a'; c.fillRect(-1, h + 1, 2, 2);   // il batacchio
    c.restore();
    if (g.echoFail > 0 && (g.echoFail >> 2) % 2) { c.fillStyle = 'rgba(120,120,150,0.6)'; c.fillRect(this.x + 2, this.y + 14, 12, 1); }
  }
}

/* ------------------------------ le statue del coro ------------------------------ */
class ChoirStatue extends Entity {
  constructor(x, y) { super(x * TS, y * TS); this.solid = true; this.hb = { x: 1, y: 2, w: 14, h: 13 }; this.sing = 0; this.t = 0; }
  onRing(g) {
    if (g.s.flags.towerChoir) return;
    this.sing = CHOIR_WIN(); Sound.sfx('choir');
    const st = g.entities.filter(e => e instanceof ChoirStatue);
    if (st.length && st.every(s => s.sing > 0)) {
      g.s.flags.towerChoir = true; g.saveGame(); Sound.sfx('secret'); g.shake = 12;
      g.say(['Le quattro statue cantano insieme. Non è un suono che si sente con le orecchie: lo senti nel petto, nelle ossa, nella pietra.',
        'Nella Galleria delle Voci, il sigillo dei volti cuciti si scioglie.']);
    }
  }
  update(g) { this.t++; if (this.sing > 0 && !g.s.flags.towerChoir) this.sing--; }
  draw(c, g) {
    const X = this.x, Y = this.y, on = g.s.flags.towerChoir || this.sing > 0;
    drawShadow(c, X + 8, Y + 15, 12);
    c.fillStyle = '#4a4e66'; c.fillRect(X + 3, Y + 11, 10, 4);   // piedistallo
    c.fillStyle = on ? '#d8dcf0' : '#8a8ea8'; c.fillRect(X + 4, Y - 2, 8, 13); c.fillRect(X + 5, Y - 6, 6, 5);   // corpo e testa
    c.fillStyle = on ? '#ffe8a0' : '#2a2a3a'; c.fillRect(X + 7, Y - 3, 2, 2);   // la bocca: buia o luminosa
    if (on && !g.s.flags.towerChoir) {   // quanto manca: tre tacche che si spengono
      const k = this.sing / CHOIR_WIN();
      for (let i = 0; i < 3; i++) { c.fillStyle = k > i / 3 ? '#ffe8a0' : '#4a4e66'; c.fillRect(X + 3 + i * 4, Y + 16, 3, 1); }
    }
    if (on && (this.t >> 4) % 2) { c.fillStyle = '#ffe8a0'; c.fillRect(X + 11, Y - 9 - ((this.t >> 3) % 3), 1, 3); c.fillRect(X + 12, Y - 9 - ((this.t >> 3) % 3), 2, 1); }
  }
}

/* ------------------------------ i ricordi in gabbia ------------------------------ */
class MemoryOrb extends Entity {
  constructor(m) { super(m.x * TS, m.y * TS); this.m = m; this.caged = true; this.solid = false; this.hb = { x: 2, y: 2, w: 12, h: 12 }; this.ringR = 10; this.t = Math.random() * 60 | 0; this.flyT = 0; }
  onRing(g) { if (!this.caged) return; this.caged = false; Sound.sfx('hush'); Sound.sfx('fairy'); }
  update(g) {
    this.t++;
    if (this.caged) return;
    const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - 6 - this.cy(), d = Math.hypot(dx, dy);
    if (d > 6) { this.x += dx / d * 1.6; this.y += dy / d * 1.6; return; }
    if (g.dialog || g.state !== 'play') return;
    this.dead = true; g.s.flags['mem:' + this.m.n] = true; g.saveGame();
    const n = memCount(g);
    g.say([...this.m.text, ...(n >= 4 ? ['Tutti e quattro i ricordi sono liberi. In mezzo alla sala, dove prima c\'era solo nebbia, compare un forziere.'] : ['(Ricordi liberati: ' + n + '/4)'])],
      () => { if (n >= 4) { g.spawnChests(); Sound.sfx('secret'); } });
  }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y + Math.sin(this.t * 0.08) * 2);
    c.fillStyle = 'rgba(255,240,190,0.25)'; c.beginPath(); c.arc(X + 8, Y + 8, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff6d0'; c.fillRect(X + 6, Y + 6, 4, 4); c.fillStyle = '#ffffff'; c.fillRect(X + 7, Y + 7, 1, 1);
    if (this.caged) {
      c.fillStyle = 'rgba(180,186,206,0.7)';
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + this.t * 0.03; c.fillRect(Math.round(X + 8 + Math.cos(a) * 7) - 1, Math.round(Y + 8 + Math.sin(a) * 7) - 1, 3, 3); }
    }
  }
}

/* ------------------------------ il Velato ------------------------------ */
class Velato extends Enemy {
  constructor(x, y) { super(x, y); this.hp = 2; this.dmg = 1; this.hb = { x: 3, y: 3, w: 10, h: 11 }; this.rung = 0; this.clinkCd = 0; this.ph = Math.random() * 6; }
  get veiled() { return this.rung <= 0; }
  mopts() { return { warpSolid: true, edgeSolid: true, entities: false, pitSolid: false, self: this }; }
  onRing(g) { this.rung = 200; this.flash = 8; this.stunT = 45; Sound.sfx('hookhit'); }
  hurt(g, d, dir) {
    if (this.veiled) {   // la spada passa attraverso
      if (this.clinkCd <= 0) { this.clinkCd = 24; g.particles.push(new Particle(this.cx(), this.cy(), 0, -0.4, 20, '#c8ccd8', 2, 0)); }
      return;
    }
    super.hurt(g, d, dir);
  }
  hookHit(g) { if (!this.veiled) { this.stunT = 60; this.flash = 6; Sound.sfx('hookhit'); } }
  bombHit(g) { if (!this.veiled) { this.inv = 0; this.hurt(g, 2, 0); } }
  update(g) {
    if (this.clinkCd > 0) this.clinkCd--;
    if (this.rung > 0) this.rung--;
    this.ph += 0.06;
    if (this.baseUpdate()) return;
    if (g.entryGrace > 0) return;
    const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1, sp = this.veiled ? 0.42 : 0.3;
    if (d > 4) moveEntity(this, dx / d * sp, dy / d * sp + Math.sin(this.ph) * 0.15, this.mopts());
    this.touchPlayer(g);
  }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y + Math.sin(this.ph) * 1.5);
    c.save(); c.globalAlpha = this.veiled ? 0.45 + Math.sin(this.ph * 2) * 0.1 : 1;
    if (this.flash > 0 && (this.flash >> 1) % 2 === 0) c.globalAlpha = 1;
    const cloak = this.veiled ? '#b8bcd0' : '#7a7e9a';
    c.fillStyle = '#1a1420'; c.fillRect(X + 3, Y + 1, 10, 13); c.fillRect(X + 2, Y + 6, 12, 7);
    c.fillStyle = cloak; c.fillRect(X + 4, Y + 2, 8, 11); c.fillRect(X + 3, Y + 7, 10, 5);
    c.fillStyle = '#2a2a3a'; c.fillRect(X + 5, Y + 4, 6, 4);   // il cappuccio, buio
    c.fillStyle = this.veiled ? '#e8ecff' : '#ffe8a0'; c.fillRect(X + 6, Y + 5, 1, 1); c.fillRect(X + 9, Y + 5, 1, 1);
    for (let i = 0; i < 4; i++) { c.fillStyle = cloak; c.fillRect(X + 3 + i * 3, Y + 12 + ((i + (this.t >> 3)) % 2), 2, 2); }   // orlo sfilacciato
    c.restore();
  }
}

/* ------------------------------ le sfere di nebbia ------------------------------ */
class FogOrb {
  constructor(x, y, vx, vy) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.t = 0; this.dead = false; this.kind = 'fog'; this.dmg = 1; this.w = this.h = 6; }
  box() { return { x: this.x - 3, y: this.y - 3, w: 6, h: 6 }; }
  update(g) {
    this.t++;
    const p = g.player, dx = p.cx() - this.x, dy = p.cy() - this.y, d = Math.hypot(dx, dy) || 1;
    if (this.t < 140) { this.vx += dx / d * 0.03; this.vy += dy / d * 0.03; }   // segue Lio, poi si spegne
    const sp = Math.hypot(this.vx, this.vy); if (sp > 1.1) { this.vx *= 1.1 / sp; this.vy *= 1.1 / sp; }
    this.x += this.vx; this.y += this.vy;
    if (this.t > 220 || this.x < -8 || this.y < -8 || this.x > PLAY_W + 8 || this.y > PLAY_H + 8) { this.dead = true; return; }
    if (overlap(this.box(), p.box())) { p.hurt(g, this.dmg, this.x, this.y); this.dead = true; }
  }
  draw(c) {
    const a = this.t > 190 ? (220 - this.t) / 30 : 1;
    c.fillStyle = 'rgba(200,204,222,' + (0.35 * a) + ')'; c.beginPath(); c.arc(this.x, this.y, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(236,240,255,' + (0.85 * a) + ')'; c.fillRect(Math.round(this.x) - 2, Math.round(this.y) - 2, 4, 4);
    c.fillStyle = 'rgba(120,124,150,' + a + ')'; c.fillRect(Math.round(this.x + Math.cos(this.t * 0.3) * 3), Math.round(this.y + Math.sin(this.t * 0.3) * 3), 1, 1);
  }
}

/* ------------------------------ LA SIGNORA DELLE NEBBIE ------------------------------ */
class Lady extends Enemy {
  constructor() {
    super(7 * TS + 4, 2 * TS);
    this.hp = this.maxHp = 15; this.dmg = 1; this.title = 'SIGNORA DELLE NEBBIE';   // tarata col bot (T31.table)
    this.hb = { x: 2, y: 2, w: 16, h: 20 }; this.ringR = 12;
    this.state = 'intro'; this.timer = 80; this.ang = -Math.PI / 2; this.cast = 120; this.swoopIn = 200; this.hits = 0;
    this.decoys = []; this.tgt = null; this.ignoreClear = true;
  }
  get phase2() { return this.hp <= 7; }
  get sortY() { return this.y + 24; }
  home() { return { x: 128 - 10 + Math.cos(this.ang) * 70, y: 46 + Math.sin(this.ang) * 16 }; }
  makeDecoys() { this.decoys = this.phase2 ? [{ off: 2.1, alive: true }, { off: -2.1, alive: true }] : []; }
  decoyPos(dc) {
    if (dc.sw) return { x: dc.sw.x, y: dc.sw.y };
    return { x: 128 - 10 + Math.cos(this.ang + dc.off) * 70, y: 46 + Math.sin(this.ang + dc.off) * 16 };
  }
  onRing(g) {
    if (!['float', 'swoop', 'rise', 'sing'].includes(this.state)) return;
    if (this.state !== 'sing') {   // il velo inghiotte la nota... e lei non gradisce
      this.absorb = 20; Sound.sfx('hush');
      if (this.state === 'float' && this.swoopIn > 30) this.swoopIn = 30;
      return;
    }
    this.state = 'stunned'; this.timer = 120; this.hits = 0; this.flash = 12;
    Sound.sfx('shatter'); Sound.sfx('ring'); g.shake = 8; if (g.stopFor) g.stopFor(8);
    for (const p of g.projectiles) if (p instanceof FogOrb) p.dead = true;
    for (const dc of this.decoys) dc.alive = false;
  }
  hurt(g, d) {
    if (this.state !== 'stunned' || this.inv > 0) {
      if (this.state !== 'stunned' && this.state !== 'dying' && !this.clink) { this.clink = 30; g.particles.push(new Particle(this.cx(), this.cy(), 0, -0.5, 24, '#c8ccd8', 2, 0)); }
      return;
    }
    this.hp -= 1; this.flash = 12; this.inv = 16; g.shake = 4; Sound.sfx('bossHit');
    if (g.stopFor) g.stopFor(this.hp <= 0 ? 10 : 5);
    if (g.impact) g.impact(this.cx(), this.cy(), this.hp <= 0);
    if (this.hp <= 0) {
      this.hp = 0; this.state = 'dying'; this.timer = 150; Sound.sfx('roar'); Sound.music(null);
      for (const p of g.projectiles) p.dead = true;
      for (const e of g.entities) if (e.enemy && e !== this && !e.dead) e.die(g);
      return;
    }
    if (++this.hits >= 3) this.timer = Math.min(this.timer, 12);   // al terzo colpo si rialza
  }
  bombHit(g) { if (this.state === 'stunned') { this.inv = 0; this.hurt(g, 2); } }
  hookHit(g) { /* il velo inghiotte l'arpione */ }
  update(g) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.inv > 0) this.inv--;
    if (this.clink > 0) this.clink--;
    const p = g.player;
    switch (this.state) {
      case 'intro':
        if (--this.timer <= 0) { this.state = 'float'; this.makeDecoys(); }
        return;
      case 'float': {
        this.ang += this.phase2 ? 0.022 : 0.016;
        const h = this.home(); this.x += (h.x - this.x) * 0.08; this.y += (h.y - this.y) * 0.08;
        if (--this.cast <= 0) {
          this.cast = this.phase2 ? 120 : 160; Sound.sfx('hush');
          const n = this.phase2 ? 3 : 2;
          for (let i = 0; i < n; i++) { const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.6; g.projectiles.push(new FogOrb(this.cx(), this.cy() + 6, Math.cos(a) * 0.8, Math.sin(a) * 0.8)); }
        }
        if (this.t % 420 === 0 && g.entities.filter(e => e instanceof Velato && !e.dead).length < (this.phase2 ? 2 : 1)) {
          const s = makeEnemy({ type: 'velato', x: Math.random() < 0.5 ? 2 : 13, y: 8 }); g.entities.push(s); g.puff(s.cx(), s.cy(), '#c8ccd8');
        }
        if (--this.swoopIn <= 0) {
          this.state = 'swoop'; this.timer = 70; this.tgt = { x: p.cx() - 10, y: p.cy() - 14 }; Sound.sfx('hush');
          for (const dc of this.decoys) if (dc.alive) { const q = this.decoyPos(dc); dc.sw = { x: q.x, y: q.y, tx: p.cx() - 10 + (Math.random() - 0.5) * 40, ty: p.cy() - 14 + (Math.random() - 0.5) * 20 }; }
        }
        break;
      }
      case 'swoop': {
        const sp = this.phase2 ? 2.3 : 1.9, dx = this.tgt.x - this.x, dy = this.tgt.y - this.y, d = Math.hypot(dx, dy);
        if (d > sp) { this.x += dx / d * sp; this.y += dy / d * sp; }
        for (const dc of this.decoys) if (dc.alive && dc.sw) { const ex = dc.sw.tx - dc.sw.x, ey = dc.sw.ty - dc.sw.y, ed = Math.hypot(ex, ey); if (ed > sp) { dc.sw.x += ex / ed * sp; dc.sw.y += ey / ed * sp; } }
        if (--this.timer <= 0 || d <= sp) { this.state = 'sing'; this.timer = SING_WIN(); Sound.sfx('choir'); }
        break;
      }
      case 'sing':   // si ferma e canta (in silenzio): è l'unico momento in cui il velo si può spezzare
        this.y += Math.sin(this.t * 0.2) * 0.2;
        if (--this.timer <= 0) { this.state = 'rise'; this.timer = 50; }
        break;
      case 'rise': {
        const h = this.home(); this.x += (h.x - this.x) * 0.06; this.y += (h.y - this.y) * 0.06;
        for (const dc of this.decoys) if (dc.sw) { const q = { x: 128 - 10 + Math.cos(this.ang + dc.off) * 70, y: 46 + Math.sin(this.ang + dc.off) * 16 }; dc.sw.x += (q.x - dc.sw.x) * 0.06; dc.sw.y += (q.y - dc.sw.y) * 0.06; }
        if (--this.timer <= 0) { this.state = 'float'; this.swoopIn = this.phase2 ? 130 : 170; for (const dc of this.decoys) dc.sw = null; }
        break;
      }
      case 'stunned':
        if (--this.timer <= 0) { this.state = 'rise'; this.timer = 50; this.makeDecoys(); Sound.sfx('hush'); }
        return;
      case 'dying':
        if (this.t % 6 === 0) g.particles.push(new Particle(this.cx() + (Math.random() - 0.5) * 20, this.cy() + (Math.random() - 0.5) * 20, 0, -0.6, 40, Math.random() < 0.5 ? '#fff6d0' : '#d8dcf0', 2, 0));
        if (--this.timer <= 0) { this.dead = true; ladyDefeated(g, this); }
        return;
    }
    // le copie: l'onda le scioglie; toccano Lio come lei
    for (const w of g.entities) if (w instanceof Wave) for (const dc of this.decoys) {
      if (!dc.alive) continue; const q = this.decoyPos(dc);
      if (Math.hypot(q.x + 10 - w.x, q.y + 12 - w.y) - 10 <= w.r) { dc.alive = false; g.puff(q.x + 10, q.y + 12, '#c8ccd8'); Sound.sfx('hush'); }
    }
    if (this.absorb > 0) this.absorb--;
    if (this.state === 'swoop' || this.state === 'sing') {
      if (overlap(this.box(), p.box())) p.hurt(g, this.dmg, this.cx(), this.cy());
      for (const dc of this.decoys) if (dc.alive) { const q = this.decoyPos(dc); if (overlap({ x: q.x + 4, y: q.y + 4, w: 12, h: 16 }, p.box())) p.hurt(g, 1, q.x + 10, q.y + 12); }
    }
  }
  drawFigure(c, X, Y, alpha, stunned, real) {
    c.save(); c.globalAlpha = alpha;
    const t = this.t, cx = X + 10, sway = Math.sin(t * 0.05) * 1.5;
    const robe = stunned ? '#8a8ea8' : '#d4d8e8', fold = stunned ? '#6a6e8a' : '#a8aec6', edge = '#2a2a3a';
    // la veste: si allarga verso il basso e sfuma in nebbia
    for (let r = 0; r < 22; r++) {
      const w = 6 + r * 0.75 + Math.sin(t * 0.08 + r * 0.5) * (r > 14 ? 1 : 0), y = Y + 8 + r;
      c.globalAlpha = alpha * (r > 16 ? 1 - (r - 16) / 7 : 1);
      c.fillStyle = edge; c.fillRect(Math.round(cx - w / 2) - 1, y, Math.round(w) + 2, 1);
      c.fillStyle = robe; c.fillRect(Math.round(cx - w / 2), y, Math.round(w), 1);
      c.fillStyle = fold; c.fillRect(Math.round(cx - 1 + Math.sin(r * 0.4) * 2), y, 1, 1); c.fillRect(Math.round(cx + w / 4), y, 1, 1);
    }
    c.globalAlpha = alpha;
    // le maniche larghe, come ali
    const arm = stunned ? 6 : Math.sin(t * 0.06) * 2;
    c.fillStyle = edge; c.fillRect(cx - 10, Y + 10 + arm, 5, 8); c.fillRect(cx + 5, Y + 10 - arm, 5, 8);
    c.fillStyle = robe; c.fillRect(cx - 9, Y + 11 + arm, 4, 6); c.fillRect(cx + 5, Y + 11 - arm, 4, 6);
    // capelli d'argento lunghissimi, mossi da un vento che non c'è
    c.fillStyle = '#f2f4fa';
    c.fillRect(cx - 4, Y, 8, 3);
    for (let i = 0; i < 16; i++) { const s = Math.sin(t * 0.06 + i * 0.35) * (i / 8); c.fillRect(Math.round(cx - 5 - s + sway), Y + 2 + i, 2, 1); c.fillRect(Math.round(cx + 3 + s + sway), Y + 2 + i, 2, 1); }
    // il volto
    c.fillStyle = edge; c.fillRect(cx - 3, Y + 1, 6, 8);
    c.fillStyle = '#ece8f2'; c.fillRect(cx - 2, Y + 2, 4, 6);
    c.fillStyle = stunned ? '#5a3a5a' : '#4a4a6a'; c.fillRect(cx - 2, Y + 4, 1, 1); c.fillRect(cx + 1, Y + 4, 1, 1);
    c.fillStyle = stunned ? '#a05a6a' : '#9aa0b8'; c.fillRect(cx - 1, Y + 6, 2, stunned ? 2 : 1);   // la bocca: chiusa; poi, a terra, un grido muto
    c.fillStyle = '#c8ccd8'; c.fillRect(cx - 3, Y - 1, 6, 1);   // il diadema: solo quello della Signora vera scintilla (le copie no)
    if (real && (t >> 3) % 3) { c.fillStyle = '#fff6c0'; c.fillRect(cx, Y - 3, 1, 2); c.fillRect(cx - 1, Y - 2, 3, 1); }
    // il velo: nebbia trasparente dai bordi morbidi
    if (!stunned) {
      const gr = c.createRadialGradient(cx, Y + 12, 3, cx, Y + 12, 17);
      gr.addColorStop(0, 'rgba(225,230,246,0.10)'); gr.addColorStop(0.7, 'rgba(210,216,236,0.32)'); gr.addColorStop(1, 'rgba(210,216,236,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(cx, Y + 12, 15, 18, 0, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 6; i++) { const a = t * 0.03 + i; c.fillStyle = 'rgba(240,244,255,0.6)'; c.fillRect(Math.round(cx + Math.cos(a) * 13), Math.round(Y + 12 + Math.sin(a) * 16), 1, 1); }
    }
    c.restore();
  }
  draw(c, g) {
    if (this.state === 'dying' && (this.t >> 2) % 2) return;
    const X = Math.round(this.x), Y = Math.round(this.y + (this.state === 'stunned' ? 6 : Math.sin(this.t * 0.07) * 2));
    drawShadow(c, X + 10, Y + 26, this.state === 'stunned' ? 16 : 10);
    for (const dc of this.decoys) if (dc.alive && this.state !== 'stunned') { const q = this.decoyPos(dc); this.drawFigure(c, Math.round(q.x), Math.round(q.y + Math.sin(this.t * 0.07 + dc.off) * 2), 0.8, false); }
    this.drawFigure(c, X, Y, this.state === 'intro' ? Math.min(1, (80 - this.timer) / 60) : 1, this.state === 'stunned', true);
    if (this.state === 'sing') {   // il canto muto: cerchi che si allargano dalla bocca (è il momento!)
      const k = (this.t % 20) / 20;
      c.strokeStyle = 'rgba(255,240,190,' + (0.8 * (1 - k)) + ')'; c.lineWidth = 1;
      c.beginPath(); c.arc(X + 10, Y + 7, 4 + k * 12, 0, Math.PI * 2); c.stroke();
    }
    if (this.absorb > 0) { c.strokeStyle = 'rgba(200,206,228,' + (this.absorb / 20) + ')'; c.lineWidth = 2; c.beginPath(); c.ellipse(X + 10, Y + 12, 16, 19, 0, 0, Math.PI * 2); c.stroke(); }
    if (this.flash > 0 && (this.flash >> 1) % 2 === 0) { c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(X + 3, Y, 14, 24); }
  }
}

function ladyDefeated(g, lady) {
  const f = g.s.flags;
  f.towerLady = true;
  if (typeof bestMark === 'function') bestMark(g, lady, true);
  g.boss = null;
  for (const [x, y] of [[7, 10], [8, 10]]) g.tiles[y][x] = 'P';
  g.redrawBg();
  g.pickups.push(new Pickup(lady.cx(), lady.cy() + 6, 'container'));
  for (let i = 0; i < 40; i++) g.particles.push(new Particle(lady.cx(), lady.cy(), (Math.random() - 0.5) * 3, -Math.random() * 2.5, 60, Math.random() < 0.5 ? '#fff6d0' : '#ffe8a0', 2, 0));
  Sound.sfx('secret'); Sound.music('tower'); g.saveGame();
  g.say([
    'La Signora delle Nebbie si inginocchia. Il velo le scivola dalle spalle come acqua, e sotto c\'è soltanto una donna stanca, con i capelli d\'argento.',
    'Elva: ...La tua nota. Era la stessa di Vesper. Lui cantava così, prima di scegliere la luce del Cuore e dimenticarsi di me.',
    'Elva: Ho dato al giardiniere i semi delle spine perché spegnesse quella luce. Ho rubato i ricordi perché nessuno ricordasse più com\'era il suono. Credevo che il silenzio facesse meno male.',
    'Elva: Non è così. Il silenzio è solo più freddo.',
    'Dal suo petto si alzano centinaia di piccole luci: i ricordi rubati. Volano fuori dalla Torre, verso Pietrabianca, verso la valle, verso chi li aveva perduti.',
    "Elva: Riportali a casa, ragazzo. E se un giorno il Cuore di Vesper canterà di nuovo... diglielo, che Elva ha ascoltato.",
    'La figura si dissolve in una nebbia leggera e luminosa. Per la prima volta, nella Torre, senti il vento.',
    g2 => { g2.s.flags.towerSilenceBroken = true; g2.saveGame(); },
  ]);
}

/* ------------------------------ installazione ------------------------------ */
(function installTower() {
  const G = Game;

  const mk = makeEnemy;
  makeEnemy = function (def) { return def.type === 'velato' ? new Velato(def.x * TS, def.y * TS) : mk(def); };

  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.call(this, id);
    const def = ROOMS[id], f = this.s.flags;
    if (!def || !def.tower) return;
    for (const v of def.veils || []) if (!f['veil:' + v.id] && !(v.seal && v.needs(this))) this.entities.push(new FogVeil(v));
    if (id === 't:2,2') { this.echoSeq = []; for (const [x, y, s] of [[4, 3, 'mid'], [8, 3, 'lo'], [12, 3, 'hi']]) this.entities.push(new MuteBell(x, y, s)); }
    if (id === 't:2,1') for (const [x, y] of [[3, 2], [12, 2], [3, 8], [12, 8]]) this.entities.push(new ChoirStatue(x, y));
    if (id === 't:0,1') for (const m of MEMORIES) if (!f['mem:' + m.n]) this.entities.push(new MemoryOrb(m));
    if (id === 't:1,0' && !f.towerLady) {
      this.boss = new Lady(); this.entities.push(this.boss);
      for (const [x, y] of [[7, 10], [8, 10]]) this.tiles[y][x] = 'W';
      this.redrawBg();
    }
  };

  /* il Diapason: X fa vibrare la nota */
  const useItem = G.useItem;
  G.useItem = function () {
    if (this.equipped() !== 'diapason') return useItem.call(this);
    const p = this.player;
    if ((p.ringCd || 0) > 0) return;
    p.ringCd = 34;
    const v = DIRS[p.dir];
    this.entities.push(new Wave(p.cx() + v.x * 4, p.cy() - 4 + v.y * 4));
    Sound.sfx('ring');
  };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    if (this.player && this.player.ringCd > 0) this.player.ringCd--;
    updatePlay.call(this);
  };
  const applyItem = G.applyItem;
  G.applyItem = function (kind, n) {
    applyItem.call(this, kind, n);
    if (kind === 'diapason') { this.s.equip = 'diapason'; this.saveGame(); }
  };

  /* entrando nella sala del trono */
  const afterEnter = G.afterEnter;
  G.afterEnter = function () {
    const r = afterEnter.apply(this, arguments);
    const f = this.s.flags;
    if (this.roomId === 't:1,0' && !f.towerLady && !f.ladyIntro) {
      f.ladyIntro = true;
      this.say([
        'In cima alla Torre, una donna avvolta in un velo di nebbia canta. Le labbra si muovono, ma non esce alcun suono.',
        '???: ...Un bambino con una nota d\'argento. Sei venuto a riportare il rumore nel mio regno?',
        'Signora delle Nebbie: Le tue campane, le tue risate, i tuoi ricordi... tutto rumore. Lascia che la nebbia ti insegni la pace del silenzio.',
        'Il velo la protegge da ogni lama e inghiotte ogni suono. Ma quando si ferma a cantare, anche lei deve aprirlo un poco...',
      ]);
    }
    return r;
  };

  /* la Torre: aria grigia e immobile */
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!this.room || !this.room.tower || !FEEL.on) return;
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = this.s.flags.towerSilenceBroken ? '#d8dcea' : '#b8bccf'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore();
    for (let i = 0; i < 14; i++) {   // nebbia bassa che scorre piano
      const x = ((i * 41 + this.t * 0.15 * (1 + i % 3)) % (PLAY_W + 40)) - 20, y = (i * 29) % PLAY_H;
      c.fillStyle = 'rgba(220,224,240,0.06)'; c.fillRect(Math.round(x), y, 30, 6);
    }
  };

  /* dopo la Torre: Pietrabianca e la valle ricordano */
  const say = (room, id, fn) => { const n = (ROOMS[room] && ROOMS[room].npcs || []).find(x => x.id === id); if (n) { const t0 = n.talk; n.talk = function (g) { const r = fn(g); return r || t0.call(this, g); }; } };
  say('i:campanile', 'gualtiero', g => {
    const f = g.s.flags; if (!f.towerLady) return null;
    if (!f.ladyTold) { f.ladyTold = true; g.saveGame(); return [
      'Gualtiero: Lio! Stamattina Anselmo, il pastore, è entrato in chiesa e ha detto il suo nome. Il SUO nome! Lo aveva dimenticato da tre lune!',
      'Gualtiero: E le campane... suonano da sole, piano, come se qualcuno le ascoltasse da molto lontano.',
      'Gualtiero: Elva, dici? Le nonne raccontavano di una cantante che viveva sulla Torre, al tempo di Vesper. Pensavamo fosse una favola.',
      'Gualtiero: Torna a casa, ragazzo. Qualcuno, a Brinavalle, avrà dei ricordi da restituirti.',
    ]; }
    return ['Gualtiero: Ogni rintocco, adesso, lo suono anche per lei. Mi sembra giusto.'];
  });
  if (typeof FATHER_NPC !== 'undefined') {
    const t0 = FATHER_NPC.talk;
    FATHER_NPC.talk = function (g) {
      const f = g.s.flags;
      if (f.towerLady && !f.fatherRemembers) {
        f.fatherRemembers = true; g.saveGame();
        return [
          'Papà: Lio... stanotte ho sognato. No, non era un sogno: era un ricordo che tornava.',
          'Papà: Tu, piccolo così, sulle mie spalle al Lago Specchio. Gridavi «più in alto, papà!». Nelle radici avevo perso anche questo... il tuo viso da bambino.',
          'Papà: Ora ce l\'ho di nuovo. Non so cosa tu abbia fatto lassù al Nord, ma... grazie, figlio mio.',
        ];
      }
      return t0.call(this, g);
    };
  }

  /* diario, obiettivo, Segnavia */
  if (window.CHAPTERS2) CHAPTERS2.push(
    { name: 'La Torre del Silenzio', done: g => !!g.s.flags.towerIn },
    { name: "Il Diapason d'Argento", done: g => !!g.s.items.diapason },
    { name: 'La Signora delle Nebbie', done: g => !!g.s.flags.towerLady },
    { name: 'I ricordi ritrovati', done: g => !!g.s.flags.fatherRemembers },
  );
  const towerGoal = g => {
    const f = g.s.flags, it = g.s.items;
    if (!towerOn(g) || !ROOMS[TOWER_ROOM]) return null;
    if (f.fatherRemembers) return 'none';
    if (f.towerLady) return f.ladyTold ? 'o:1,2' : 'i:campanile';
    if (!f.towerIn) return 't:1,2';
    if (!it.diapason) return 't:0,2';
    if (!f.towerEcho) return 't:2,2';
    if (!f['veil:t_atrio']) return 't:1,2';
    if (!f.towerChoir) return 't:2,1';
    return 't:1,0';
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const goal = towerGoal(g), f = g.s.flags, it = g.s.items;
    if (!goal) return co(g);
    if (goal === 'none') return 'La nebbia se n\'è andata e i ricordi sono tornati a casa. Goditi la valle.';   // Ciclo 42 (Agente B): accorciato, era di 5 righe e in pausa se ne vedono 4
    if (f.towerLady) return f.ladyTold ? 'Torna a Brinavalle: tuo padre ha qualcosa da dirti.' : 'La Signora delle Nebbie non c\'è più. Torna a Pietrabianca da Gualtiero.';
    if (!f.towerIn) return co(g);
    if (!it.diapason) return 'Nella Torre non c\'è un suono. Cerca qualcosa che possa farne uno: prova la sala a ovest dell\'atrio.';
    if (!f.towerEcho) return 'Il velo dell\'atrio è troppo spesso. Nella Sala dell\'Eco, a est, tre campane aspettano la nota giusta.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    if (!f['veil:t_atrio']) return "L'eco è salita: torna nell'atrio e fai vibrare il Diapason davanti al velo della scala.";
    if (!f.towerChoir) return 'Un sigillo chiude la scala. Nella Sala del Coro, a est della Galleria, quattro statue aspettano di cantare.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    return 'Il sigillo si è sciolto. Sali in cima alla Torre: la Signora delle Nebbie ti aspetta.';
  };
  window.currentObjective = currentObjective;
  if (typeof objectiveRoom === 'function') {
    const or0 = objectiveRoom, oc0 = objectiveChest;
    objectiveRoom = function (g) { const t = towerGoal(g); return t === 'none' ? null : t || or0(g); };
    window.objectiveRoom = objectiveRoom;
    objectiveChest = function (g) { return g.roomId === 't:0,2' && !g.s.items.diapason ? 'diapason' : oc0(g); };
  }

  /* Bestiario */
  if (typeof BESTIARY !== 'undefined') {
    const pic = (mk2) => { let cv = null; return () => cv || (cv = (() => { const c2 = makeCanvas(24, 28), e = mk2(); e.x = 2; e.y = 2; e.t = 0; try { e.draw(c2.getContext('2d'), Game); } catch (err) {} return c2; })()); };
    BESTIARY.push(
      { k: 'velato', name: 'Velato', spr: pic(() => new Velato(0, 0)),
        lore: 'Servitori della Torre del Silenzio, fatti di fiato e di nebbia. Non parlano, non respirano, non fanno rumore.',
        weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ "La spada li attraversa. Il Diapason li rende solidi: allora bastano due colpi." },
      { k: 'lady', name: 'La Signora', boss: true, spr: pic(() => { const l = new Lady(); l.state = 'float'; return l; }),
        lore: "Elva, la cantante di Vesper. Quando lui scelse la luce del Cuore, lei scelse il silenzio, e ne fece un regno.",
        weak: 'Schiva la picchiata. Poi, mentre canta, suona il Diapason da vicino: cadrà per tre colpi.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Velato ? 'velato' : e instanceof Lady ? 'lady' : bk(e); };
  }
  if (typeof SIDE_QUESTS !== 'undefined') SIDE_QUESTS.push({ name: "L'Archivio dei Ricordi",
    seen: g => g.visited.has('t:0,1'), done: g => memCount(g) >= 4,
    prog: g => memCount(g) + '/4',
    hint: 'Nella Torre, quattro ricordi rubati tremano in gabbie di nebbia. Una nota li libera, anche da lontano.' });
  if (typeof MEDALS !== 'undefined') MEDALS.push(
    { id: 'torre', name: 'La voce ritrovata', desc: 'Sconfiggi la Signora delle Nebbie.', icon: 'bell', tier: 1, got: g => !!g.s.flags.towerLady },
    { id: 'archivio', name: 'Custode dei ricordi',   /* Ciclo 37: l'id «ricordi» era già della medaglia di walk.js (Ciclo 26) */ desc: "Libera i quattro ricordi dell'Archivio.", icon: 'heart', tier: 0, got: g => memCount(g) >= 4 });
  window.Velato = Velato; window.Lady = Lady; window.Wave = Wave; window.FogVeil = FogVeil; window.MuteBell = MuteBell; window.ChoirStatue = ChoirStatue; window.MemoryOrb = MemoryOrb; window.FogOrb = FogOrb; window.MEMORIES = MEMORIES; window.memCount = memCount;
})();
