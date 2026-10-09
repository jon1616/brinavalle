'use strict';
/* =====================================================================
 *  HEARTEARTH — Ciclo 39 (Agente A, seconda manche): CAPITOLO VI, parte
 *  seconda: «IL CUORE DELLA TERRA».
 *  Le tre Pietre del Battito hanno aperto la porta della Sala delle Radici
 *  (Ciclo 38). Laggiù batte il cuore della TERRA, la sorella più piccola:
 *  regge tutti sulle spalle e nessuno ha mai cantato per lei. Quando ha
 *  sentito il cielo e il mare cantare insieme, ha pianto; e piangendo, ha tremato.
 *  · Il dungeon riusa TUTTI gli strumenti della saga: le sue sale prendono in
 *    prestito le regole degli altri dungeon con i flag di stanza
 *    (obs: le ore della Meridiana · abyss: il buio e il Lume · temple: l'acqua e la Conca).
 *  · Quattro ECO DEL CANTO (le voci di chi ha cantato prima di lei) aprono la
 *    Camera del Battito. Dentro, il duello finale è un DUELLO A RITMO: la
 *    Conca suona il Canto della Terra (▼ ◀ ▲ ▶) SUL BATTITO del suo cuore.
 *    Fuori tempo o nota sbagliata: la terra sussulta e dal soffitto cade un masso.
 *  · 7 sale (prefisso g:, mappa «CUORE»):
 *      g:1,2 La Soglia              (arrivo dalla Sala delle Radici)
 *      g:0,2 Il Geode del Cielo     (sei cristalli: il Diapason li fa cantare)   → Eco del Cielo
 *      g:2,2 Le Ore Sepolte         (porte e ponti delle ore: la Meridiana)      → Eco delle Ore
 *      g:1,1 La Camera del Battito  (l'altare delle quattro Eco; la porta nord)
 *      g:0,1 Le Radici Buie         (buio, vetro, un muro d'ombra: il Lume)      → Eco della Luce
 *      g:2,1 La Vena Sotterranea    (l'acqua dei Coraliani: la Conca)            → Eco del Mare
 *      g:1,0 Il Cuore               (LA TERRA: il duello a ritmo)
 *  Flag: gIn, gGeode, chest:g_eco_cielo / g_eco_ore / g_eco_luce / g_eco_mare,
 *        gHeart, gPerfect (nessun errore nel duello), ch6Done, ch6Home.
 * ===================================================================== */
const ECHOES = [
  { id: 'g_eco_cielo', short: 'il Geode', room: 'g:0,2', name: 'il Geode del Cielo', voice: 'È la voce del CIELO: la nota che il Diapason ha imparato da Vesper.' },
  { id: 'g_eco_ore', short: 'le Ore Sepolte', room: 'g:2,2', name: 'le Ore Sepolte', voice: 'È la voce delle ORE: il tempo che il cielo e la terra si dividono da sempre.' },
  { id: 'g_eco_luce', short: 'le Radici Buie', room: 'g:0,1', name: 'le Radici Buie', voice: 'È la voce della LUCE: Vespero, la stella, che dal fondo della Fossa vide le radici.' },
  { id: 'g_eco_mare', short: 'la Vena', room: 'g:2,1', name: 'la Vena Sotterranea', voice: 'È la voce del MARE: il Canto dei Coraliani, sceso fin quaggiù per le vene della roccia.' },
];
const echoCount = g => ECHOES.filter(e => g.s.flags['chest:' + e.id]).length;
const TERRA_SEQ = [2, 3, 0, 1];   // ▼ ◀ ▲ ▶ : il Canto della Terra
const TERRA_ROUNDS = [   // il battito: prima zoppica, poi si fa regolare (frame tra un colpo e l'altro; finestra ± frame a Normale)
  { gaps: [72, 46, 84, 52], win: 14 },
  { gaps: [62, 50, 68, 54], win: 10 },
  { gaps: [52], win: 7 },
];
const TERRA_NEED = 8;   // note a tempo per round (un errore ne toglie una)
const terraWin = r => Math.round(TERRA_ROUNDS[r].win * [1.4, 1, 0.8][Opts.diff]);
const LANE_Y = 66, LANE_V = 1.1;   // la corsia delle note sotto il Cuore; velocità (px/frame)
const GEODE = [[3, 3], [7, 3], [11, 3], [3, 7], [7, 7], [11, 7]];   // i sei cristalli (2 righe × 3)
const GEODE_START = [false, true, false, false, true, false];   // si risolve (per esempio) facendo cantare il primo e il terzo della riga in alto

ITEMS.eco = { name: 'Eco del Canto', text: () => { const e = ECHOES.find(x => x.room === Game.roomId); return 'Hai trovato un\'ECO DEL CANTO! Ti risuona tra le mani come una conchiglia. ' + (e ? e.voice : '') + ' (' + echoCount(Game) + '/4)'; } };
ICON.eco = spriteFromRows([
  '..oooooo..',
  '.oyyyyyyo.',
  'oyyoooyyyo',
  'oyo...oyyo',
  'oyo.oo.oyo',
  'oyo.oyo.yo',
  'oyyo..oyyo',
  '.oyyooyyo.',
  '..oyyyyo..',
  '...oooo...',
], { o: '#1a1420', y: '#f0c870' });

/* ------------------------------ stanze ------------------------------ */
Object.assign(ROOMS, {
  'g:1,2': {
    name: 'Cuore - La Soglia', ground: 'earth', music: 'cave',
    tiles: [
      'KKKKKKK..KKKKKKK',
      'K..............K',
      'K.T..........T.K',
      'K..............K',
      'K....,....,....K',
      '................',
      'K..............K',
      'K..T........T..K',
      'K..............K',
      'K......UU......K',
      'KKKKKKKKKKKKKKKK',
    ],
    warps: { '7,9': { to: 'k:1,2', x: 7, y: 4, dir: 0 }, '8,9': { to: 'k:1,2', x: 7, y: 4, dir: 0 } },
    enemies: [{ type: 'bat', x: 3, y: 3 }, { type: 'bat', x: 12, y: 6 }],
    signs: { '2,0': ['Inciso nella roccia calda: «QUATTRO VENE, QUATTRO VOCI. IL CIELO A OVEST, LE ORE A EST. LA LUCE E IL MARE PIÙ SU. CHI LE PORTA TUTTE, ENTRI».'] },
    onEnter: g => {
      const f = g.s.flags;
      if (f.gIn) return;
      f.gIn = true;
      g.say([
        'Oltre la porta delle Radici la roccia è calda come pane appena sfornato. Le pareti si accendono di rosso, piano, a ogni battito.',
        'TUM... TUM-TUM... ... TUM. Il battito viene da nord. Ed è più storto che mai.',
        'Una voce piccola, da bambina, rimbomba da tutte le parti: «Chi c\'è? Anche tu sei venuto a dirmi di stare ferma?»',
      ]);
    },
  },
  'g:0,2': {
    name: 'Cuore - Il Geode del Cielo', ground: 'earth', music: 'cave',
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K..............K',
      'K..............K',
      'K..............K',
      'K..............K',
      'K...............',
      'K..............K',
      'K..............K',
      'K..............K',
      'K..............K',
      'KKKKKKKKKKKKKKKK',
    ],
    chests: [{ id: 'g_eco_cielo', x: 1, y: 5, item: 'eco', cond: g => !!g.s.flags.gGeode }],
    enemies: [{ type: 'bat', x: 13, y: 2 }],
    signs: { '1,0': ['Inciso sopra i cristalli: «IL CIELO HA INSEGNATO A CANTARE ALLE PIETRE. FALLE CANTARE TUTTE INSIEME». Ogni cristallo, quando canta, sveglia o fa tacere i suoi vicini.'] },
    onEnter: g => {
      if (g.s.flags.gGeodeSeen || g.s.flags.gGeode) return;
      g.s.flags.gGeodeSeen = true;
      g.say(['Un geode grande come una chiesa: sei cristalli alti come te, alcuni accesi, altri spenti. Quando il battito rimbomba, vibrano tutti... ma non cantano.' + (g.s.items.diapason ? ' Il Diapason, nella bisaccia, freme.' : '')]);
    },
  },
  'g:2,2': {
    name: 'Cuore - Le Ore Sepolte', ground: 'earth', music: 'cave', obs: true,
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K......K..___..K',
      'K......K..___..K',
      'K.T....K..___..K',
      'K......K..___..K',
      '.......J..___KKK',
      'K......K..___..K',
      'K.T....K..___..K',
      'K......K..___..K',
      'K......K..___..K',
      'KKKKKKKKKKKKKKKK',
    ],
    gates: [VG([[7, 5]], g => obsTime(g) === 'night', 'moon')],
    bridges: [{ tiles: [[10, 2], [11, 2], [12, 2]], when: 'day' }, { tiles: [[10, 8], [11, 8], [12, 8]], when: 'dusk' }],
    chests: [{ id: 'g_eco_ore', x: 14, y: 1, item: 'eco' }, { id: 'g_ore_gemme', x: 14, y: 9, item: 'gems', n: 50 }],
    enemies: [{ type: 'astrino', x: 4, y: 3 }],
    signs: { '1,0': ['Una meridiana di pietra scolpita nel soffitto, dove il sole non è mai arrivato. Sotto: «LE ORE DEL CIELO SCENDONO FIN QUAGGIÙ, MA SOLO CON CHI LE PORTA».'] },
    onEnter: g => {
      if (g.s.flags.gOreSeen) return;
      g.s.flags.gOreSeen = true;
      g.say(['Una porta con una luna incisa, e oltre una voragine. Sul bordo, i segni di due ponti: uno col sole, uno col tramonto.' + (g.s.items.sundial ? ' La Meridiana di Vesper, in tasca, ticchetta.' : '')]);
    },
  },
  'g:1,1': {
    name: 'Cuore - La Camera del Battito', ground: 'earth', music: 'temple',
    tiles: [
      'KKKKKKKJJKKKKKKK',
      'K..............K',
      'K..T........T..K',
      'K..............K',
      'K......KK......K',
      '................',
      'K..............K',
      'K..T........T..K',
      'K..............K',
      'K..............K',
      'KKKKKKK..KKKKKKK',
    ],
    signs: { '7,4': g => altar(g), '8,4': g => altar(g) },
    onEnter: g => {
      if (g.s.flags.gHubSeen) return;
      g.s.flags.gHubSeen = true;
      g.say(['Al centro della sala, un altare di pietra con quattro incavi a forma di orecchio. Dietro, a nord, una porta chiusa che pulsa di rosso.', 'Da dietro la porta: TUM... TUM-TUM... e un singhiozzo.']);
    },
  },
  'g:0,1': {
    name: 'Cuore - Le Radici Buie', ground: 'earth', music: 'cave', abyss: true,
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K.T..K..______.K',
      'K....K..______.K',
      'K....K..______.K',
      'K....K..______.K',
      'K.......______..',
      'K....K..______.K',
      'K....K..______.K',
      'K.T..K..______.K',
      'K....K..______.K',
      'KKKKKKKKKKKKKKKK',
    ],
    glass: [[8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5]],
    shadows: [{ id: 'g_radici', x: 5, y: 5, w: 1, h: 1 }],
    chests: [{ id: 'g_eco_luce', x: 2, y: 5, item: 'eco' }],
    enemies: [{ type: 'ombra', x: 6, y: 2 }, { type: 'ombra', x: 14, y: 8 }],
    signs: { '14,0': ['Le radici qui sono così fitte che il buio si tocca. Tra le radici, una scritta che brilla appena: «SOTTO IL MARE, SOTTO LE ROCCE, C\'È CHI REGGE TUTTO. NESSUNO LE PORTA MAI LUCE».'] },
    onEnter: g => {
      if (g.s.flags.gRootsSeen) return;
      g.s.flags.gRootsSeen = true;
      g.say(['Buio pesto, come nella Fossa. Davanti a te, nella voragine, c\'è qualcosa che luccica appena: vetro di stella.' + (g.s.items.starlamp ? ' Il Lume, in mano, si scalda.' : '')]);
    },
  },
  'g:2,1': {
    name: 'Cuore - La Vena Sotterranea', ground: 'earth', music: 'cave', temple: true,
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K...~~~K..___..K',
      'K...~~~K..___..K',
      'K.T.~~~K..___..K',
      'K...~~~K..___.KK',
      '....~~~...___..K',
      'K...~~~K..___.KK',
      'K.T.~~~K..___..K',
      'K...~~~K..___..K',
      'K...~~~K..___..K',
      'KKKKKKKKKKKKKKKK',
    ],
    wt: [4, 5, 6].flatMap(x => [1, 2, 3, 4, 5, 6, 7, 8, 9].map(y => [x, y])),
    wf: [[10, 5], [11, 5], [12, 5]],
    statues: [{ id: 'g_vena', x: 13, y: 5, to: [13, 2] }],
    chests: [{ id: 'g_eco_mare', x: 14, y: 5, item: 'eco', cond: g => !!g.s.flags['awake:g_vena'] }],
    enemies: [{ type: 'bat', x: 9, y: 8 }],
    signs: { '1,0': ['Inciso con la scrittura dei Coraliani: «ANCHE NOI SCENDEVAMO QUI, A CANTARE PER LA PICCOLA. POI CI SIAMO DIMENTICATI LA STRADA».'] },
    onEnter: g => {
      if (g.s.flags.gVenaSeen) return;
      g.s.flags.gVenaSeen = true;
      g.say(['Una vena d\'acqua salata scorre nella roccia: è il mare, arrivato fin quaggiù. Oltre la voragine, una statua di Coraliano dorme davanti a una nicchia.']);
    },
  },
  'g:1,0': {
    name: 'Cuore - Il Cuore', ground: 'earth',
    get music() { return Game.s && Game.s.flags.gHeart ? 'temple' : 'boss2'; },
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K..............K',
      'K..............K',
      'K..............K',
      'K..............K',
      'K..............K',
      'K..T........T..K',
      'K..............K',
      'K..............K',
      'K..............K',
      'KKKKKKK..KKKKKKK',
    ],
    onEnter: g => {
      const f = g.s.flags;
      if (f.gHeart || f.gHeartSeen) return;
      f.gHeartSeen = true;
      g.say([
        'Una sala rotonda, calda come un forno. Incastonato nella roccia, un CUORE di pietra grande come una casa. Lo attraversano crepe profonde.',
        'Una voce di bambina riempie la sala: «Vai via! Tutti mi dicono di stare ferma, stare zitta, reggere tutto. Ma io non ci riesco più!»',
        'Le quattro Eco ti si scaldano tra le mani. Ti torna in mente l\'altare: «Sul battito, non prima e non dopo».',
        'Suona la Conca (' + bombKey() + '): quando una nota arriva nel cerchio, premi la sua freccia a tempo col battito. Una nota sbagliata, o fuori tempo, fa tremare la terra: guarda le ombre!',
      ]);
    },
  },
});
// la porta nord della Camera del Battito: si apre con le quattro Eco
ROOMS['g:1,1'].dyn = [{ x: 7, y: 0, ch: '.', cond: g => echoCount(g) === 4 }, { x: 8, y: 0, ch: '.', cond: g => echoCount(g) === 4 }];

function altar(g) {
  const n = echoCount(g);
  if (n < 4) return ['Un altare con quattro incavi a forma di orecchio. Inciso sopra: «QUATTRO VOCI HANNO CANTATO PER TUTTI. NESSUNA PER ME». (' + n + '/4)', 'Mancano: ' + ECHOES.filter(e => !g.s.flags['chest:' + e.id]).map(e => e.name).join(', ') + '.'];
  return ['Le quattro Eco risuonano insieme, una per incavo. Sull\'altare, tra le crepe, compare il CANTO DELLA TERRA:', '«' + TERRA_SEQ.map(n => NOTE_GLYPH[n]).join(' ') + '» — e sotto: «SUL BATTITO, NON PRIMA E NON DOPO».'];
}

/* ------------------------------ i cristalli del Geode ------------------------------ */
class GeodeCrystal extends Entity {
  constructor(i) { super(GEODE[i][0] * TS, GEODE[i][1] * TS); this.i = i; this.solid = true; this.hb = { x: 2, y: 2, w: 12, h: 13 }; this.flash = 0; this.t = 0; }
  onRing(g) { geodeRing(g, this.i); }
  update() { this.t++; if (this.flash > 0) this.flash--; }
  draw(c, g) {
    const X = Math.round(this.x), Y = Math.round(this.y), on = g.geode && g.geode[this.i];
    drawShadow(c, X + 8, Y + 15, 12);
    if (on) { c.fillStyle = 'rgba(168,232,255,' + (0.18 + Math.sin(this.t * 0.08 + this.i) * 0.06) + ')'; c.beginPath(); c.arc(X + 8, Y + 4, 14, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#1a1420'; c.fillRect(X + 4, Y - 6, 8, 21); c.fillRect(X + 2, Y - 2, 12, 15);
    c.fillStyle = on ? '#7ad0f8' : '#4a5470'; c.fillRect(X + 5, Y - 5, 6, 19); c.fillRect(X + 3, Y - 1, 10, 13);
    c.fillStyle = on ? '#e0f8ff' : '#6a7490'; c.fillRect(X + 5, Y - 5, 2, 17); c.fillRect(X + 9, Y - 1, 1, 10);
    if (this.flash) { c.fillStyle = 'rgba(255,255,255,' + this.flash / 20 + ')'; c.fillRect(X + 3, Y - 5, 10, 18); }
  }
}
function geodeRing(g, i) {
  const f = g.s.flags; if (f.gGeode || !g.geode) return;
  const r = Math.floor(i / 3), col = i % 3;
  for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const rr = r + dr, cc = col + dc; if (rr < 0 || rr > 1 || cc < 0 || cc > 2) continue;
    const k = rr * 3 + cc; g.geode[k] = !g.geode[k];
    const e = g.entities.find(x => x instanceof GeodeCrystal && x.i === k); if (e) e.flash = 20;
  }
  Sound.sfx(g.geode[i] ? 'bellHi' : 'bellLo');
  if (g.geode.every(Boolean)) {
    f.gGeode = true; Sound.sfx('secret'); g.spawnChests(); g.saveGame();
    g.say(['I sei cristalli cantano insieme: è la nota di Vesper, la voce del cielo, rimasta prigioniera nella pietra per secoli. Nel silenzio che segue, a ovest, si apre uno scrigno.']);
  }
}

/* ------------------------------ LA TERRA: il Cuore ------------------------------ */
class Terra extends Entity {
  constructor() {
    super(128 - 32, 2);
    this.hb = { x: 0, y: 0, w: 64, h: 54 }; this.solid = true;
    this.title = 'IL CUORE DELLA TERRA'; this.maxHp = TERRA_ROUNDS.length * TERRA_NEED; this.hp = this.maxHp;
    this.state = 'intro'; this.timer = 50; this.t = 0; this.round = 0; this.prog = 0; this.errors = 0;
    this.beats = []; this.clock = 0; this.pulse = 0; this.fx = []; this.idx = 0; this.next = 0;
  }
  get sortY() { return -5; }
  hurt(g) {
    if (this.clink) return;
    this.clink = 30; Sound.sfx('clank');
    if (!g.dialog && !this.toldSword) { this.toldSword = true; g.say(['La spada rimbalza sulla pietra calda. Non è un nemico, questo: è qualcuno che piange.']); }
  }
  startRound() { this.state = 'beat'; this.clock = 0; this.beats = []; this.idx = 0; this.next = 90; this.fill(); }
  fill() {
    const R = TERRA_ROUNDS[this.round];
    while (this.beats.filter(b => !b.res).length < 8) { this.beats.push({ t: this.next, n: TERRA_SEQ[this.idx % 4], res: null }); this.next += R.gaps[this.idx % R.gaps.length]; this.idx++; }
  }
  play(g, n) {   // una nota suonata da Lio
    if (this.state !== 'beat') return;
    const w = terraWin(this.round);
    let best = null;
    for (const b of this.beats) if (!b.res && Math.abs(this.clock - b.t) <= w && (!best || Math.abs(this.clock - b.t) < Math.abs(this.clock - best.t))) best = b;
    if (best && best.n === n) {
      best.res = 'hit'; this.prog++; this.fx.push({ k: 'hit', t: 0 });
      this.hp = this.maxHp - (this.round * TERRA_NEED + this.prog);
      if (this.prog >= TERRA_NEED) this.roundDone(g);
      return;
    }
    if (best) best.res = 'miss';
    this.errors++; if (this.prog > 0) this.prog--;
    this.hp = this.maxHp - (this.round * TERRA_NEED + this.prog);
    this.fx.push({ k: 'miss', t: 0 }); Sound.sfx('bump'); g.shake = Math.max(g.shake, 6);
    const p = g.player, tx = Math.floor(p.cx() / TS), ty = Math.floor((p.y + 12) / TS);
    if (g.rocks.length < 2) g.rocks.push({ x: tx * TS + 8, y: ty * TS + 8, t: ROCK_T });   // la terra sussulta: un masso proprio lì
    if (!g.s.flags.gMissTip) { g.s.flags.gMissTip = true; g.banner = { text: 'Fuori tempo! Un masso: spostati!', t: 100 }; }
  }
  roundDone(g) {
    this.round++; this.prog = 0; g.song = null; Sound.sfx('secret');
    if (this.round >= TERRA_ROUNDS.length) { this.state = 'peace'; this.timer = 50; return; }
    this.state = 'between'; this.quaked = false;
    g.say([
      ['La Terra: ...Sei ancora qui? Quando tremo, tutti scappano.',
        'Il Diapason, nella bisaccia, vibra da solo: la nota di Vesper, la voce del cielo. «Sorellina... sei tu? Non sapevamo che ci ascoltassi».',
        'La Terra: Fratello?! ...No! È troppo tardi! — e la sala trema. Attento ai massi!'],
      ['La Conca si scalda e canta da sola: è la voce della Madre delle Acque. «Piccola mia. Il mare ti ha sempre sentita, sotto di sé. Canta con noi».',
        'La Terra: Il battito... sta tornando? Non smettere adesso! Ancora, sul battito! — la sala trema di nuovo.'],
    ][this.round - 1]);
  }
  update(g) {
    this.t++; if (this.pulse > 0) this.pulse--; if (this.clink > 0) this.clink--;
    for (const x of this.fx) x.t++;
    this.fx = this.fx.filter(x => x.t < 24);
    switch (this.state) {
      case 'intro': if (!g.dialog && --this.timer <= 0) this.startRound(); break;
      case 'beat': {
        if (g.dialog) break;
        this.clock++;
        const w = terraWin(this.round);
        for (const b of this.beats) { if (b.t === this.clock) { this.pulse = 8; Sound.sfx('push'); } if (!b.res && this.clock > b.t + w) b.res = 'skip'; }
        this.beats = this.beats.filter(b => this.clock - b.t < 140);
        this.fill();
        break;
      }
      case 'between':   // finito il dialogo, la sala trema (i massi del Ciclo 38), poi il battito riprende
        if (g.dialog) break;
        if (!this.quaked) { this.quaked = true; g.shake = 30; Sound.sfx('stomp'); g.quakeDrop(); this.timer = ROCK_T + 3 * 6 + 50; }
        else if (--this.timer <= 0) this.startRound();
        break;
      case 'peace': if (!g.dialog && --this.timer <= 0) { this.state = 'done'; terraPeace(g, this); } break;
    }
    if (this.state !== 'beat' && this.t % 70 === 0) this.pulse = 6;
  }
  draw(c) {
    const t = this.t, cx = 128, cy = 28, done = this.state === 'done' || this.state === 'peace', k = done ? 1 : this.round / TERRA_ROUNDS.length;
    const s = 25 + this.pulse * 0.5;
    const heart = (sz, col) => {
      c.fillStyle = col; c.beginPath();
      c.arc(cx - sz * 0.5, cy - sz * 0.25, sz * 0.55, 0, Math.PI * 2); c.arc(cx + sz * 0.5, cy - sz * 0.25, sz * 0.55, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(cx - sz * 1.03, cy - sz * 0.1); c.lineTo(cx + sz * 1.03, cy - sz * 0.1); c.lineTo(cx, cy + sz * 1.05); c.closePath(); c.fill();
    };
    // il bagliore del battito, poi il cuore di pietra: contorno, roccia, vene
    c.fillStyle = 'rgba(255,90,90,' + (0.08 + this.pulse * 0.03) + ')'; c.beginPath(); c.arc(cx, cy + 4, 40 + this.pulse, 0, Math.PI * 2); c.fill();
    heart(s + 2, '#1a1014');
    heart(s, done ? '#9a6a5a' : '#7a5448');
    heart(s - 5, done ? '#b07a62' : '#8e6252');
    const vein = this.pulse > 0 ? '#ff6a6a' : done ? '#e86a6a' : '#b03a40';
    c.fillStyle = vein;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.4; for (let r = 4; r < s * 0.8; r += 2) c.fillRect(Math.round(cx + Math.cos(a + r * 0.04) * r), Math.round(cy + 2 + Math.sin(a + r * 0.04) * r * 0.8), 1, 1); }
    // le crepe: una si richiude a ogni round
    c.fillStyle = '#1a1014';
    const cracks = done ? 0 : TERRA_ROUNDS.length - this.round;
    for (let i = 0; i < cracks; i++) { let [x, y] = [[cx - 19, cy - 16], [cx + 15, cy - 16], [cx - 1, cy + 11]][i]; for (let j = 0; j < 6; j++) { c.fillRect(x, y, 1, 3); x += (j % 2 ? 1 : -1); y += 3; } }   // lontane dal volto
    // il volto della sorella piccola: occhi chiusi e una lacrima; alla fine, aperti
    c.fillStyle = '#2a1414';
    if (done) { c.fillRect(cx - 9, cy - 2, 4, 4); c.fillRect(cx + 5, cy - 2, 4, 4); c.fillStyle = '#ffe0a0'; c.fillRect(cx - 8, cy - 2, 1, 1); c.fillRect(cx + 6, cy - 2, 1, 1); c.fillStyle = '#2a1414'; c.fillRect(cx - 3, cy + 6, 6, 1); c.fillRect(cx - 4, cy + 5, 1, 1); c.fillRect(cx + 3, cy + 5, 1, 1); }
    else { for (const ex of [cx - 11, cx + 5]) { c.fillRect(ex, cy, 6, 1); c.fillRect(ex, cy - 1, 1, 1); c.fillRect(ex + 5, cy - 1, 1, 1); } c.fillStyle = '#a8d8ff'; c.fillRect(cx - 9, cy + 2 + ((t >> 3) % 7), 2, 2); c.fillStyle = '#2a1414'; c.fillRect(cx - 3, cy + 7, 6, 1); c.fillRect(cx - 4, cy + 8, 1, 1); c.fillRect(cx + 3, cy + 8, 1, 1); }   // occhi chiusi, una lacrima, la bocca all'ingiù
    if (k > 0 && !done) { c.fillStyle = 'rgba(255,220,160,' + 0.15 * k + ')'; c.beginPath(); c.arc(cx, cy, s * 0.6, 0, Math.PI * 2); c.fill(); }
    // la corsia delle note: arrivano da destra verso il cerchio, sul battito
    if (this.state === 'beat') {
      const w = terraWin(this.round);
      c.fillStyle = 'rgba(10,6,12,0.55)'; c.fillRect(40, LANE_Y - 8, 200, 16);
      c.fillStyle = 'rgba(255,220,140,0.18)'; c.fillRect(Math.round(cx - w * LANE_V), LANE_Y - 8, Math.round(2 * w * LANE_V), 16);
      c.strokeStyle = this.pulse > 0 ? '#ffffff' : '#ffd870'; c.lineWidth = 1; c.beginPath(); c.arc(cx, LANE_Y, 7 + (this.pulse > 4 ? 1 : 0), 0, Math.PI * 2); c.stroke();
      for (const b of this.beats) {
        if (b.res === 'hit' || b.res === 'miss') continue;
        const dt = b.t - this.clock, x = cx + dt * LANE_V;
        if (x > 236 || x < 44) continue;
        drawNote(c, Math.round(x), LANE_Y, b.n, b.res === 'skip' ? 0.3 : 1);
      }
      for (let i = 0; i < TERRA_NEED; i++) { c.fillStyle = i < this.prog ? '#ff8a8a' : 'rgba(255,255,255,0.25)'; c.fillRect(cx - TERRA_NEED * 4 + i * 8 + 2, LANE_Y + 11, 4, 4); }
      for (const x of this.fx) {
        const a = 1 - x.t / 24;
        if (x.k === 'hit') { c.strokeStyle = 'rgba(160,255,160,' + a + ')'; c.beginPath(); c.arc(cx, LANE_Y, 8 + x.t, 0, Math.PI * 2); c.stroke(); }
        else { c.fillStyle = 'rgba(255,80,80,' + a + ')'; for (let j = -5; j <= 5; j++) { c.fillRect(cx + j, LANE_Y + j, 2, 2); c.fillRect(cx + j, LANE_Y - j, 2, 2); } }
      }
    }
  }
}

function terraPeace(g, T) {
  const f = g.s.flags;
  f.gHeart = true; if (!T.errors) f.gPerfect = true;
  g.boss = null; g.song = null; g.rocks = [];
  if (typeof bestMark === 'function') bestMark(g, T, true);
  for (const [x, y] of [[7, 10], [8, 10]]) g.tiles[y][x] = '.';
  g.redrawBg();
  g.pickups.push(new Pickup(128, 96, 'container'));
  Sound.music('temple'); g.saveGame();
  g.say([
    'TUM... TUM... TUM. Il Cuore della Terra batte piano, regolare, insieme alla Conca. Le crepe sulla pietra si richiudono una dopo l\'altra.',
    'La Terra: ...Così. Così si fa. Nessuno me l\'aveva mai insegnato.',
    'La Terra: Io reggo tutto: i monti, i fiumi, le case, le radici, perfino il mare. Sto ferma da sempre, perché se mi muovo cade tutto.',
    'La Terra: Il cielo ha le stelle che cantano per lui. Il mare aveva Coralia. Io avevo il silenzio. Quando li ho sentiti cantare insieme, mi sono messa a piangere. E piangendo... ho tremato.',
    g2 => { Sound.sfx('ring'); Sound.sfx('fairy'); g2.shake = 6; },
    'Il Diapason vibra, e la Conca risponde. Il cielo e il mare cantano, e questa volta la loro canzone scende fin quaggiù.',
    'Il cielo: «Anche per te, piccola. Perdonaci: eri così silenziosa che pensavamo non avessi bisogno di niente».',
    'Il mare: «Ti abbiamo sempre sentita sotto di noi. Ma non ti abbiamo mai detto grazie».',
    'La Terra: ...Allora tornerò a stare ferma. Ma adesso so che sotto ogni passo, se si ascolta bene, c\'è una canzone. La mia.',
    'Per la prima volta da quando esiste il mondo, il cielo, il mare e la terra cantano insieme.',
    g2 => { g2.ch6CardIn = 60; g2.saveGame(); },
  ]);
}

/* ------------------------------ installazione ------------------------------ */
(function installHeartEarth() {
  const G = Game;

  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.call(this, id);
    if (id === 'g:0,2') {
      this.geode = this.s.flags.gGeode ? GEODE.map(() => true) : GEODE_START.slice();
      GEODE.forEach((_, i) => this.entities.push(new GeodeCrystal(i)));
    }
    if (id === 'g:1,0' && !this.s.flags.gHeart) {
      this.boss = new Terra(); this.entities.push(this.boss);
      for (const [x, y] of [[7, 10], [8, 10]]) this.tiles[y][x] = 'K';
      this.redrawBg();
    }
  };

  /* la spada contro chi non è un nemico (la Madre delle Acque, il Cuore della Terra): la spada colpisce solo i nemici,
     quindi la battuta della Madre («la lama attraversa l'acqua», Ciclo 37) giocando non usciva MAI: la chiamava solo il test */
  const swordHits = Player.prototype.swordHits;
  Player.prototype.swordHits = function (g) {
    swordHits.call(this, g);
    const b = g.boss;
    if (b && !b.enemy && b.hurt && (b instanceof Terra || (window.Madre && b instanceof Madre)) && ATK - this.attackT <= ATK - 3 && overlap(this.swordBox(), b.box())) b.hurt(g);
  };

  /* la Conca nel duello: le note vanno al Cuore (e non cercano le melodie del Tempio) */
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    const T = this.boss instanceof Terra ? this.boss : null;
    let hits = [];
    if (T && this.song && this.state === 'play' && !this.dialog && !this.song.done) {
      hits = NOTE_KEYS.map((k, n) => Input.hit(k) ? n : -1).filter(n => n >= 0);
      for (const n of hits) {
        Sound.sfx('note' + n);
        const S = this.song; if (!S) break;
        S.buf.push(n); if (S.buf.length > 8) S.buf.shift(); S.flash = 12; S.last = n;
        T.play(this, n);
      }
    }
    if (hits.length) { const hit = Input.hit; Input.hit = a => NOTE_KEYS.includes(a) ? false : hit.call(Input, a); try { updatePlay.call(this); } finally { Input.hit = hit; } }
    else updatePlay.call(this);
    // i massi del Ciclo 38 quaggiù: le scosse di Bruna si fermano con le Pietre del Battito, ma il Cuore può ancora sussultare
    if (this.roomId && this.roomId.startsWith('g:') && this.s.flags.rootsDoor && this.state === 'play' && !this.dialog && this.rocks && this.rocks.length) {
      for (const r of this.rocks) {
        if (--r.t !== 0) continue;
        Sound.sfx('crumble'); this.puff(r.x, r.y, '#8a7a72');
        const p = this.player, box = { x: r.x - 7, y: r.y - 7, w: 14, h: 14 };
        if (p && overlap(box, p.box())) p.hurt(this, 1, p.cx(), p.cy() - 20);
      }
      this.rocks = this.rocks.filter(r => r.t > 0);
    }
    if (this.echoNote && !this.dialog && this.state === 'play') { this.echoNote = false; this.say(['Le quattro Eco si chiamano tra loro, come campane lontane. Nella Camera del Battito, la porta nord si è aperta.']); }
    // il ritorno a Brinavalle dopo il Capitolo VI
    const f = this.s.flags;
    if (this.state === 'play' && !this.dialog && this.roomId === 'o:1,2' && f.ch6Done && !f.ch6Home && this.player) {
      f.ch6Home = true; this.saveGame();
      this.say([
        'Brinavalle è in festa. Dalla fenditura della piazza sale gente con il viso sporco di terra: Bruna, Ferro, tutta Fondogrotta. Per la prima volta in duecento anni, i minatori vedono il cielo.',
        'Pietruccio guarda in su a bocca aperta: «È VERO! Il soffitto è azzurro... e non finisce mai!»',
        'Lontano, a Pietrabianca, le campane della Torre suonano da sole. Dalla costa arriva un\'onda piccola e gentile. E sotto i piedi, piano, la terra batte a tempo.',
        'Quella sera tutta la valle canta. Ma a mezzanotte un vento freddo, che nessuno aveva mai sentito, scende dalle montagne e spegne tutte le lanterne della piazza.',
        'Nel buio, una voce sottile come un fischio: «Tre fratelli, dite? Nessuno si è mai ricordato che eravamo QUATTRO».',
      ]);
    }
  };
  const applyItem = G.applyItem;
  G.applyItem = function (kind, n) {
    applyItem.call(this, kind, n);
    if (kind === 'eco' && echoCount(this) >= 4) this.echoNote = true;
  };

  /* il cartello di fine Capitolo VI */
  const update = G.update;
  G.update = function () {
    if (this.state === 'chapter6') {
      this.t++; this.ch6T++;
      if (this.ch6T > 120 && (Input.hit('action') || Input.hit('start'))) {
        this.state = 'play'; this.s.flags.ch6Done = true; this.saveGame(); Sound.sfx('select');
        this.startWarp({ to: 'o:1,2', x: 8, y: 9, dir: 0 }, 'Z');   // su, fino alla piazza di Brinavalle
      }
      return;
    }
    update.call(this);
    if (this.ch6CardIn > 0 && this.state === 'play' && !this.dialog && --this.ch6CardIn === 0) { this.state = 'chapter6'; this.ch6T = 0; Sound.sfx('victory'); }
  };
  const render = G.render;
  G.render = function () {
    render.call(this);
    if (this.song && this.state === 'play' && this.boss instanceof Terra) {   // nel duello il pentagramma ricorda il Canto della Terra (al posto delle melodie del Tempio)
      sctx.fillStyle = 'rgba(8,10,24,0.95)'; sctx.fillRect(42 * SCALE, (HUD_H + 151) * SCALE, 172 * SCALE, 15 * SCALE);
      txt('Canto della Terra ' + TERRA_SEQ.map(n => NOTE_GLYPH[n]).join('') + ' · sul battito', 128, HUD_H + 159, { size: 8, align: 'center', color: '#ffb0a0', maxW: 172 });
    }
    if (this.state !== 'chapter6') return;
    const t = this.ch6T, a = Math.min(0.75, t / 60), ta = Math.max(0, Math.min(1, (t - 30) / 40));
    sctx.fillStyle = 'rgba(24,10,8,' + a + ')'; sctx.fillRect(0, 0, GW * SCALE, GH * SCALE);
    if (ta <= 0) return;
    txt('CAPITOLO VI', 128, 46, { align: 'center', size: 11, color: '#c8bcd8', alpha: ta });
    txt('Il Battito della Terra', 128, 63, { align: 'center', size: 12, font: TITLE_FONT, color: '#ffd870', alpha: ta });
    txt('— completato —', 128, 84, { align: 'center', size: 11, color: '#f4ecdc', alpha: ta });
    txt('Il cielo, il mare e la terra hanno cantato insieme, per la prima volta.', 128, 104, { align: 'center', size: 10, color: '#f4ecdc', alpha: ta, maxW: 236 });
    txt('Ma sopra le montagne, qualcuno che nessuno aveva invitato li ha sentiti...', 128, 116, { align: 'center', size: 10, color: '#a8c8f8', alpha: ta, maxW: 236 });
    txt('Tempo ' + fmtTime(this.s.time) + ' · Cuori ' + this.s.maxHp / 2, 128, 136, { align: 'center', size: 9, color: '#c8bcd8', alpha: ta });
    if (t > 120) txt('Premi ' + actKey(true) + ' per continuare', 128, 158, { align: 'center', size: 9, color: '#a898c0', alpha: 0.6 + Math.sin(t * 0.08) * 0.3 });
  };

  /* il rosso del battito nelle sale; l'altare con le Eco */
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!this.roomId || !this.roomId.startsWith('g:')) return;
    const f = this.s.flags, beat = f.gHeart ? (this.t % 60) < 6 : (this.t % 90) < 6 || ((this.t % 90) > 20 && (this.t % 90) < 25);
    c.fillStyle = 'rgba(255,60,50,' + (beat ? 0.08 : 0.03) + ')'; c.fillRect(0, 0, PLAY_W, PLAY_H);
    if (this.roomId === 'g:1,1') {   // i quattro incavi dell'altare
      ECHOES.forEach((e, i) => {
        const x = 7 * TS + 2 + i * 7, y = 4 * TS + 6, on = f['chest:' + e.id];
        c.fillStyle = '#1a1014'; c.fillRect(x, y, 5, 5);
        if (on) { c.fillStyle = (this.t >> 4) % 4 === i ? '#fff0b0' : '#f0c870'; c.fillRect(x + 1, y + 1, 3, 3); }
      });
    }
  };

  /* mappa */
  const mp = G.mapPrefix;
  G.mapPrefix = function () { return this.roomId.startsWith('g:') ? 'g:' : mp.call(this); };

  /* dialoghi dopo il Cuore */
  const add = (room, id, fn) => { const n = (ROOMS[room] && ROOMS[room].npcs || []).find(x => x.id === id); if (n) { const t0 = n.talk; n.talk = function (g) { return fn(g) || t0.call(this, g); }; } };
  add('k:1,1', 'bruna', g => g.s.flags.gHeart ? ['Bruna: Senti? Il battito è regolare e caldo... e ogni tanto canticchia. Duecento anni quaggiù, e non l\'avevamo mai sentita cantare. Grazie, ragazzo di sopra.'] : null);
  add('k:1,1', 'ferro', g => g.s.flags.gHeart && !g.s.flags.ferroSong ? (g.s.flags.ferroSong = true, ['Ferro: Da quando sei tornato dal Cuore, il martello mi cade in mano a tempo. Tum, tum, tum. Ho fatto più chiodi oggi che in tutto l\'anno.']) : null);

  /* diario, obiettivo, Segnavia */
  if (window.CHAPTERS6) CHAPTERS6.push(
    { name: 'Il Cuore della Terra', done: g => !!g.s.flags.gIn },
    { name: 'Le quattro Eco del Canto', done: g => echoCount(g) === 4 },
    { name: 'Il Canto della Terra', done: g => !!g.s.flags.gHeart },
  );
  const gGoal = g => {
    const f = g.s.flags;
    if (f.gHeart) return 'none';
    if (!f.gIn || !f.rootsDoor) return null;
    const miss = ECHOES.find(e => !f['chest:' + e.id]);
    return miss ? miss.room : 'g:1,0';
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const goal = gGoal(g), f = g.s.flags;
    if (!goal) return co(g);
    if (goal === 'none') return f.ch6Done ? 'Il cielo, il mare e la terra cantano insieme. Ma un vento freddo è sceso dalle montagne: «eravamo QUATTRO»...' : 'Il Cuore della Terra batte a tempo.';
    const n = echoCount(g);
    if (n < 4) return 'Eco del Canto (' + n + '/4). Mancano: ' + ECHOES.filter(e => !f['chest:' + e.id]).map(e => e.short).join(', ') + '.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    return 'La Camera del Battito è aperta: sali al Cuore e suona il Canto della Terra (▼◀▲▶) sul battito.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
  };
  window.currentObjective = currentObjective;
  const or0 = objectiveRoom, oc0 = objectiveChest;
  objectiveRoom = function (g) { const t = gGoal(g); return t === 'none' ? null : t || or0(g); };
  window.objectiveRoom = objectiveRoom;
  objectiveChest = function (g) { return ECHOES.some(e => e.room === g.roomId && !g.s.flags['chest:' + e.id]) ? 'eco' : oc0(g); };

  if (typeof BESTIARY !== 'undefined') {
    let pic = null;
    BESTIARY.push({ k: 'terra', name: 'Cuore della Terra', boss: true, seenIsEnough: true,
      spr: () => pic || (pic = (() => { const cv = makeCanvas(64, 56), T = new Terra(); T.state = 'done'; const x = cv.getContext('2d'); x.translate(-96, 0); try { T.draw(x); } catch (e) {} return cv; })()),
      lore: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'La sorella più piccola del cielo e del mare. Regge tutto; nessuno cantava per lei, e piangendo ha tremato.',
      weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Non si combatte: si accompagna. Il Canto della Terra (▼◀▲▶), sul battito.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Terra ? 'terra' : bk(e); };
  }
  if (typeof MEDALS !== 'undefined') MEDALS.push(
    { id: 'tresorelle', name: 'Tre fratelli', desc: 'Fai cantare insieme il cielo, il mare e la terra.', icon: 'heartstone', tier: 2, got: g => !!g.s.flags.gHeart },
    { id: 'atempo', name: 'A tempo', desc: 'Accompagna il Cuore senza una nota stonata.', icon: 'conch', tier: 1, got: g => !!g.s.flags.gPerfect });
  Object.assign(window, { Terra, GeodeCrystal, ECHOES, echoCount, TERRA_SEQ, TERRA_ROUNDS, TERRA_NEED, terraWin, GEODE, GEODE_START, geodeRing });
})();
