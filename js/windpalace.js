'use strict';
/* =====================================================================
 *  WINDPALACE — Ciclo 41 (Agente A, seconda manche): CAPITOLO VII, parte
 *  seconda: «IL PALAZZO DEL VENTO».
 *  Il Grande Aquilone ha dato un volto al Vento (Ciclo 40), che si è scusato:
 *  «Sali al mio palazzo: ho tante cose da chiederti, e UNA DA RESTITUIRTI».
 *  · Il Vento porta via le voci che nessuno ascolta, per non farle perdere.
 *    Nel suo palazzo le tiene in bolle d'aria: la Sala delle Voci.
 *    La cosa da restituire è la CANZONE DELLA VALLE: la cantava la madre di Lio,
 *    sulla collina, la sera. Da quando lei non c'è più, nessuno l'ha più cantata.
 *  · Nuovo oggetto: la GIRANDOLA DEI VENTI (tasto X): Lio ci soffia dentro e
 *    manda una FOLATA dove guarda. Nel palazzo:
 *      - le PORTE A BANDERUOLA si aprono solo se l'ultima folata soffiava
 *        nella direzione della loro freccia;
 *      - le NUVOLETTE scivolano con la folata finché non trovano un ostacolo:
 *        sopra il vuoto fanno da ponte, e chi ci sta sopra viaggia con loro;
 *      - i Refoli e le nuvole del Vento vengono spinti via.
 *  · Tre STROFE della canzone aprono la Sala del Trono. Lì il Vento vuole
 *    GIOCARE: acchiapparello, tre volte (e poi con le sue copie, e le foglie).
 *  · 7 sale (prefisso q:, mappa «PALAZZO»):
 *      q:1,2 L'Atrio dei Venti        (arrivo dal Picco; raffiche di traverso)
 *      q:0,2 La Sala della Girandola  (la Girandola; la prima porta a banderuola)
 *      q:2,2 La Sala delle Nuvolette  (una nuvoletta da portare e cavalcare)    → Strofa
 *      q:1,1 La Sala delle Voci       (otto voci portate via dal vento; la porta del trono)
 *      q:0,1 La Sala delle Banderuole (due porte e un pozzo: l'ordine delle folate) → Strofa
 *      q:2,1 La Galleria delle Raffiche (le correnti del Ciclo 40, buchi, Refoli)  → Strofa
 *      q:1,0 Il Trono del Vento       (IL VENTO: acchiapparello)
 *  Flag: qIn, items.pinwheel, s.qDir, chest:q_strofa_nuvole / q_strofa_porte /
 *        q_strofa_raffiche, voce:<n>, qWind, song:valle, ch7Done, ch7Home.
 * ===================================================================== */
const STROFE = [
  { id: 'q_strofa_nuvole', short: 'le Nuvolette', room: 'q:2,2', name: 'la Sala delle Nuvolette' },
  { id: 'q_strofa_porte', short: 'le Banderuole', room: 'q:0,1', name: 'la Sala delle Banderuole' },
  { id: 'q_strofa_raffiche', short: 'le Raffiche', room: 'q:2,1', name: 'la Galleria delle Raffiche' },
];
const strofaCount = g => STROFE.filter(s => g.s.flags['chest:' + s.id]).length;
const QD = { S: 0, N: 1, W: 2, E: 3 };            // le direzioni come Player.dir
const QD_V = [[0, 1], [0, -1], [-1, 0], [1, 0]];   // e i loro vettori
const QD_ARROW = ['↓', '↑', '←', '→'];
const qDir = g => g.s.qDir === undefined ? QD.E : g.s.qDir;
const inPalace = g => !!(g.room && g.room.palace);
const PUFF_V = 2;          // px/frame di una nuvoletta che scivola
const SWIRL_SP = () => [[1.0, 1.15, 1.15], [1.15, 1.3, 1.3], [1.25, 1.4, 1.3]][Opts.diff];   // Ciclo 43: al terzo round non accelera più (la novità sono le foglie): con 1,45 a Normale il «giocatore umano» di T43 restava a lungo sotto le foglie, e a Eroe perdeva quasi sempre;   // velocità del Vento per round: quando scappa è veloce quanto Lio (1,3) o di più; si prende quando si ferma a ridere, in un angolo, o con la Girandola
const LEAF_T = () => [150, 120, 100][Opts.diff];   // ogni quanti frame il Vento lancia una foglia (round 3)
const LEAF_V = () => [1.1, 1.25, 1.4][Opts.diff];   // la velocità delle foglie (Lio cammina a 1,3)
const LEAF_WARN = 30;   // Ciclo 43: prima di lanciare, il mulinello vero si illumina per mezzo secondo (prima le foglie partivano senza preavviso: il «giocatore umano» di T43 perdeva 3 volte su 5 a Eroe)
SONGS.valle = { name: 'Canzone della Valle', seq: [0, 2, 1, 3, 1, 0] };   // ▲ ▼ ▶ ◀ ▶ ▲ — si impara solo alla fine (non contiene le melodie del Tempio: ▲▶▼◀▼▲ conteneva ▼◀▼, la Marea Bassa)

ITEMS.pinwheel = { name: 'Girandola dei Venti', text: () => 'Hai trovato la GIRANDOLA DEI VENTI! Premi ' + bombKey() + ' e Lio ci soffia dentro: una FOLATA parte dove stai guardando. Nel palazzo le porte e le nuvole le danno retta. Cambi oggetto con ' + (isTouch() ? 'il pulsante ⇄' : 'il tasto Q') + '.' };
ITEMS.strofa = { name: 'Strofa della Canzone', text: () => 'Hai trovato una STROFA DELLA CANZONE! Una bolla d\'aria tiepida: dentro, una voce di donna canta piano, dolcissima. Ti sembra di conoscerla da sempre. (' + strofaCount(Game) + '/3)' };
INVENTORY.push(['pinwheel', 'Girandola']);
EQUIPS.push('pinwheel');
ICON.pinwheel = spriteFromRows([
  '.oo...oo..',
  'orro.obbo.',
  'orrrobbbo.',
  '.orrobbo..',
  '...owo....',
  '..oyyoggo.',
  '.oyyyogggo',
  '.oyyo.oggo',
  '..oo.o.oo.',
  '.....o....',
], { o: '#1a1420', r: '#e84a5a', b: '#4a8ae8', y: '#f8d048', g: '#5ac86a', w: '#ffffff' });
ICON.strofa = spriteFromRows([
  '..oooo..',
  '.owwwwo.',
  'owwbbwwo',
  'owbwwwwo',
  'owwwbwwo',
  'owwbbwwo',
  '.owwwwo.',
  '..oooo..',
], { o: '#4a5a8a', w: '#eef4ff', b: '#e8a0c0' });

/* il terreno «palace»: pavimento e vuoto come le nuvole del Ciclo 40; i muri (tessera N) di marmo di nuvola */
(function palaceArt() {
  for (const ch of ['.', ',', '_', 'U']) { const f0 = TilePaint[ch]; if (f0) TilePaint[ch] = (P, r, e) => f0(P, r, e && e.ground === 'palace' ? Object.assign({}, e, { ground: 'cloud' }) : e); }
  const N0 = TilePaint['N'];
  TilePaint['N'] = (P, r, e) => {
    if (!e || e.ground !== 'palace') return N0(P, r, e);
    P.r(0, 0, 16, 16, '#c8cce8');
    for (let y = 0; y < 16; y += 8) { P.r(0, y, 16, 1, '#9aa0c8'); P.r(0, y + 1, 16, 1, '#e4e8fa'); P.r(y ? 4 : 11, y, 1, 8, '#9aa0c8'); }
    for (let i = 0; i < 3; i++) { const x = r() * 12 | 0, y = 2 + (r() * 12 | 0); P.r(x, y, 4, 1, '#ffffff'); P.r(x + 1, y - 1, 2, 1, '#ffffff'); }
  };
})();

/* ------------------------------ stanze ------------------------------ */
const QG = (tiles, dir) => ({ tiles, dir: QD[dir] });   // una porta a banderuola: aperta se l'ultima folata soffiava verso dir
Object.assign(ROOMS, {
  'q:1,2': {
    name: 'Palazzo - L\'Atrio dei Venti', ground: 'palace', music: 'temple', palace: true,
    tiles: [
      'NNNNNNN..NNNNNNN',
      'N..............N',
      'N..N........N..N',
      'N..............N',
      'N.....N..N.....N',
      '................',
      'N.....N..N.....N',
      'N..............N',
      'N..N........N..N',
      'N......UU......N',
      'NNNNNNNNNNNNNNNN',
    ],
    warps: { '7,9': { to: 'h:1,0', x: 7, y: 3, dir: 0 }, '8,9': { to: 'h:1,0', x: 7, y: 3, dir: 0 } },
    wind: { dirs: [[1, 0], [-1, 0]], base: 0, gust: 1.2, period: 340, gustLen: 70 },
    enemies: [{ type: 'refolo', x: 3, y: 5 }],
    signs: { '3,2': ['Inciso nel marmo di nuvola: «QUI ABITA CHI PORTA. PORTA LE NUVOLE, I SEMI, LE BARCHE, LE VOCI. E NESSUNO GLI HA MAI DETTO GRAZIE».'] },
    onEnter: g => {
      const f = g.s.flags;
      if (f.qIn) return;
      f.qIn = true;
      g.say([
        'Oltre il portone di nuvola c\'è un palazzo che si muove: le pareti respirano, le colonne ondeggiano come tende. Tutto qui è fatto d\'aria compatta.',
        'La voce del Vento arriva da ogni parte, allegra: «Sei venuto! Benvenuto a casa mia. Non c\'è mai venuto nessuno, sai? Nessuno sapeva dov\'era».',
        'Il Vento: «Ti ho promesso una cosa da restituirti. Ma prima... giochiamo? Trova le mie tre strofe, e vieni a prendermi nella sala del trono!»',
      ]);
    },
  },
  'q:0,2': {
    name: 'Palazzo - La Sala della Girandola', ground: 'palace', music: 'temple', palace: true,
    tiles: [
      'NNNNNNNNNNNNNNNN',
      'N......N.......N',
      'N......N.......N',
      'N......N.......N',
      'N......N.......N',
      'N......J........',
      'N......N.......N',
      'N......N.......N',
      'N......N.......N',
      'N......N.......N',
      'NNNNNNNNNNNNNNNN',
    ],
    wgates: [QG([[7, 5]], 'W')],
    chests: [{ id: 'q_pinwheel', x: 11, y: 2, item: 'pinwheel' }, { id: 'q_gemme', x: 2, y: 5, item: 'gems', n: 50 }],
    signs: { '9,0': ['Inciso sopra la porta: «LE PORTE DEL PALAZZO SONO BANDERUOLE: SI APRONO A CHI SA DA CHE PARTE SOFFIARE». Sulla porta, una freccia che punta a ovest.'] },
    onEnter: g => {
      if (g.s.flags.qGirSeen) return;
      g.s.flags.qGirSeen = true;
      g.say(['Uno scrigno legato con nastri colorati, e una porta con una grande freccia di ferro, girata verso ovest. Ferma, anche se l\'aria si muove.']);
    },
  },
  'q:2,2': {
    name: 'Palazzo - La Sala delle Nuvolette', ground: 'palace', music: 'temple', palace: true,
    tiles: [
      'NNNNNNNNNNNNNNNN',
      'NNNN_________NNN',
      'NNNN_________NNN',
      'NNNN_________NNN',
      'N..._________..N',
      '...._________..N',
      'N...N________..N',
      'NNNN_________NNN',
      'NNNN_________NNN',
      'NNNN_________NNN',
      'NNNNNNNNNNNNNNNN',
    ],
    puffs: [[8, 1]],
    chests: [{ id: 'q_strofa_nuvole', x: 14, y: 5, item: 'strofa' }],
    signs: { '1,3': ['Inciso: «LE NUVOLE VANNO DOVE LE SPINGI, E SI FERMANO SOLO CONTRO QUALCOSA. SALICI SOPRA: TI PORTANO». E più piccolo: «Se si perdono, esci e rientra: tornano a casa».'] },
    onEnter: g => {
      if (g.s.flags.qPuffSeen) return;
      g.s.flags.qPuffSeen = true;
      g.say(['Il pavimento finisce: sotto c\'è solo cielo. In alto, sopra il vuoto, una nuvoletta soffice dondola, come un cuscino dimenticato. Dall\'altra parte, uno scrigno.']);
    },
  },
  'q:1,1': {
    name: 'Palazzo - La Sala delle Voci', ground: 'palace', music: 'temple', palace: true,
    tiles: [
      'NNNNNNNJJNNNNNNN',
      'N..............N',
      'N..N........N..N',
      'N..............N',
      'N.....N..N.....N',
      '................',
      'N.....N..N.....N',
      'N..............N',
      'N..N........N..N',
      'N..............N',
      'NNNNNNN..NNNNNNN',
    ],
    onEnter: g => {
      if (g.s.flags.qVociSeen) return;
      g.s.flags.qVociSeen = true;
      g.say(['Una sala piena di bolle d\'aria che galleggiano attorno alle colonne. Dentro ogni bolla, una voce: parole dette tanto tempo fa, che nessuno ha ascoltato.', 'Il Vento, piano: «Le porto via io, le voci che nessuno ascolta. Non posso lasciarle cadere per terra. Si perderebbero».']);
    },
  },
  'q:0,1': {
    name: 'Palazzo - La Sala delle Banderuole', ground: 'palace', music: 'temple', palace: true,
    tiles: [
      'NNNNNNNNNNNNNNNN',
      'N...NNNNNNN....N',
      'N...NNNNNNN....N',
      'N...NNNNNNN....N',
      'N...NNNNNNN....N',
      'N...J.._..J.....',
      'N...NNN_NNN....N',
      'N...NNN_NNN....N',
      'N...NNN_NNN....N',
      'N...NNN_NNN....N',
      'NNNNNNNNNNNNNNNN',
    ],
    wgates: [QG([[10, 5]], 'W'), QG([[4, 5]], 'S')],
    puffs: [[7, 9]],
    chests: [{ id: 'q_strofa_porte', x: 1, y: 5, item: 'strofa' }],
    enemies: [{ type: 'refolo', x: 13, y: 2 }],
    signs: { '12,0': ['Inciso: «DUE PORTE, UN POZZO, UNA NUVOLA. OGNI FOLATA LE MUOVE TUTTE: PENSA PRIMA DI SOFFIARE».'] },
  },
  'q:2,1': {
    name: 'Palazzo - La Galleria delle Raffiche', ground: 'palace', music: 'temple', palace: true,
    tiles: [
      'NNNNNNNNNNNNNNNN',
      'N..............N',
      'N..N...._..N...N',
      'N.....__.......N',
      'N...N......._NNN',
      '.............J.N',
      'N..._...N....NNN',
      'N.......__.....N',
      'N..N.........N.N',
      'N..............N',
      'NNNNNNNNNNNNNNNN',
    ],
    wind: { dirs: [[-1, 0]], base: 0.3, gust: 1.6, period: 300, gustLen: 90 },
    wgates: [QG([[13, 5]], 'E')],
    chests: [{ id: 'q_strofa_raffiche', x: 14, y: 5, item: 'strofa' }],
    enemies: [{ type: 'refolo', x: 6, y: 2 }, { type: 'refolo', x: 10, y: 8 }],
    signs: { '1,0': ['Inciso: «CONTROVENTO SI CAMMINA PIANO. DIETRO LE COLONNE SI ASPETTA. E LA PORTA IN FONDO SI APRE SOLO A CHI SOFFIA CONTRO DI ME».'] },
  },
  'q:1,0': {
    name: 'Palazzo - Il Trono del Vento', ground: 'palace', palace: true,
    get music() { return Game.s && Game.s.flags.qWind ? 'temple' : 'boss2'; },
    tiles: [
      'NNNNNNNNNNNNNNNN',
      'N..............N',
      'N..............N',
      'N...N......N...N',
      'N..............N',
      'N..............N',
      'N..............N',
      'N...N......N...N',
      'N..............N',
      'N..............N',
      'NNNNNNN..NNNNNNN',
    ],
    onEnter: g => {
      const f = g.s.flags;
      if (f.qWind || f.qThroneSeen) return;
      f.qThroneSeen = true;
      g.say([
        'Una sala tonda e luminosa, aperta sul cielo. Al centro, un mulinello di foglie e di nastri colorati gira su se stesso, ridacchiando.',
        'Il Vento: «Eccoti! Le hai trovate tutte e tre, eh? Bravo! Ma la mia canzone non te la do così... prima prendimi! Tre volte!»',
        'Corrigli dietro e toccalo (anche con la spada). La Girandola (' + bombKey() + ') lo spinge via: usala per chiuderlo in un angolo.',
      ]);
    },
  },
});
// le voci della Sala delle Voci (cartelli sulle colonne)
const VOCI = {
  '3,2': 'Una bolla con la voce di un uomo, stanca ma decisa: «Torno presto, Lio. Promesso». È tuo padre, tre lune fa, la mattina in cui partì per le Radici.',   // Ciclo 49: era «tanti anni fa», ma il padre partì tre lune prima dell'inizio (Teodoro: «Tre lune ad aspettarlo»)
  '12,2': 'Una voce di donna, lontana, da una torre: «Vesper... se mi senti, sappi che io ascolto ancora». Il vento l\'ha tenuta per tutto il silenzio.',
  '6,4': 'Un coro di voci acquatiche, in una lingua che non conosci: il Canto della Marea, come lo cantavano i Coraliani. Stonato in un punto, come tutti i canti veri.',
  '9,4': 'Voci di uomini sotto terra, duecento anni fa: «Siamo vivi! C\'è acqua, c\'è caldo! Ditelo, lassù!». Nessuno, lassù, le aveva sentite.',
  '6,6': 'Una voce che conta, piano: «...tre, quattro, cinque stelle». È Vesper, da giovane, sulla torre del suo osservatorio.',
  '9,6': 'Un pescatore che canta stonatissimo, e ride da solo. È Pino, sulla barca, tanti anni fa. Il vento ha tenuto anche questa: non si butta via niente.',
  '3,8': 'Una risata di bambino piccolo, sul Lago Specchio. «Ancora, papà! Più in alto!». Sei tu.',
  '12,8': 'Una bolla vuota. Il Vento, sottovoce: «Questa è per la voce che mi darai tu. Quando vorrai».',
};
ROOMS['q:1,1'].signs = Object.assign({}, ...Object.entries(VOCI).map(([k, t], i) => ({ [k]: g => { g.s.flags['voce:' + i] = true; return [t]; } })),
  { '7,0': g => throneDoor(g), '8,0': g => throneDoor(g) });
ROOMS['q:1,1'].dyn = [{ x: 7, y: 0, ch: '.', cond: g => strofaCount(g) === 3 }, { x: 8, y: 0, ch: '.', cond: g => strofaCount(g) === 3 }];
function throneDoor(g) {
  const n = strofaCount(g);
  return n < 3 ? ['Una porta di vento compatto, con tre incavi a forma di nota. (' + n + '/3) Mancano: ' + STROFE.filter(s => !g.s.flags['chest:' + s.id]).map(s => s.name).join(', ') + '.'] : ['La porta si è aperta. Dalla sala del trono arriva una risata, e un fruscio di foglie.'];
}

/* ------------------------------ la folata ------------------------------ */
class QGust extends Entity {
  constructor(x, y, d) { super(x, y); this.d = d; this.t = 0; this.hb = { x: 0, y: 0, w: 0, h: 0 }; }
  get sortY() { return 998; }
  box() { return { x: -999, y: -999, w: 0, h: 0 }; }
  update() { if (++this.t > 26) this.dead = true; }
  draw(c) {
    const [vx, vy] = QD_V[this.d], a = 1 - this.t / 26;
    c.fillStyle = 'rgba(255,255,255,' + (0.8 * a) + ')';
    for (let i = 0; i < 7; i++) {
      const s = 6 + this.t * 3 + (i * 7) % 18, o = (i - 3) * 4;
      const x = this.x + vx * s + (vy ? o : 0), y = this.y + vy * s + (vx ? o : 0);
      c.fillRect(Math.round(x), Math.round(y), vx ? 6 : 1, vy ? 6 : 1);
    }
  }
}

/* ------------------------------ le nuvolette ------------------------------ */
// stato in g.puffs: { x, y (tessera), under (la tessera vera sotto), mv: { dx, dy, k, carry } }
function puffAt(g, x, y, skip) { return (g.puffs || []).find(p => p !== skip && ((p.x === x && p.y === y) || (p.mv && p.x + p.mv.dx === x && p.y + p.mv.dy === y))); }
function puffBlocked(g, P, x, y) {
  if (x < 0 || y < 0 || x >= RW || y >= RH) return true;
  const ch = g.tiles[y][x];
  if (TILE_SOLID.has(ch) || TILE_WARP.has(ch)) return true;
  if (puffAt(g, x, y, P)) return true;
  return g.entities.some(e => e instanceof Chest && Math.floor(e.cx() / TS) === x && Math.floor(e.cy() / TS) === y);
}
function puffStep(g, P, dx, dy) {   // comincia un passo (se può)
  const nx = P.x + dx, ny = P.y + dy;
  if (puffBlocked(g, P, nx, ny)) { P.mv = null; return false; }
  const pl = g.player, foot = pl && [Math.floor(pl.cx() / TS), Math.floor((pl.y + 12) / TS)];
  const carry = P.mv ? P.mv.carry : !!(foot && foot[0] === P.x && foot[1] === P.y);
  P.nextUnder = g.tiles[ny][nx];
  if (P.nextUnder === '_') { g.tiles[ny][nx] = '.'; g.redrawBg(); }   // la nuvola arriva: lì non si cade più
  P.mv = { dx, dy, k: 0, carry };
  return true;
}
function blowPuffs(g, d) {
  const [dx, dy] = QD_V[d];
  const order = (g.puffs || []).slice().sort((a, b) => (b.x * dx + b.y * dy) - (a.x * dx + a.y * dy));   // prima quelle davanti
  for (const P of order) if (!P.mv) puffStep(g, P, dx, dy);
}
function updatePuffs(g) {
  for (const P of g.puffs || []) {
    if (!P.mv) continue;
    const m = P.mv; m.k += PUFF_V;
    if (m.carry && g.player) { g.player.x += m.dx * PUFF_V; g.player.y += m.dy * PUFF_V; }
    if (m.k < TS) continue;
    // passo finito: la tessera lasciata torna com'era
    g.tiles[P.y][P.x] = P.under; P.x += m.dx; P.y += m.dy; P.under = P.nextUnder;
    g.redrawBg();
    const carry = m.carry; P.mv = null;
    if (!puffStep(g, P, m.dx, m.dy)) { if (carry) Sound.sfx('plop'); }
    else P.mv.carry = carry;
  }
}

/* ------------------------------ IL VENTO (acchiapparello) ------------------------------ */
class QSwirl extends Entity {   // il mulinello del Vento (o una sua copia)
  constructor(x, y, real) { super(x, y); this.real = real; this.hb = { x: 2, y: 2, w: 12, h: 12 }; this.t = (Math.random() * 100) | 0; this.vx = 0; this.vy = 0; this.pause = 0; this.next = 160 + (Math.random() * 120 | 0); this.blown = null; this.tx = x; this.ty = y; }
  update() {}   // si muove solo quando lo dice il Vento (Vento.update)
  move(g, sp) {
    if (this.dead) return;
    this.t++;
    if (this.blown) { const b = this.blown; moveEntity(this, b.vx, b.vy, { self: this, warpSolid: true, edgeSolid: true, pitSolid: true }); if (--b.t <= 0) this.blown = null; return; }
    if (this.pause > 0) { this.pause--; return; }
    if (--this.next <= 0) { this.pause = 34; this.next = 220 + (Math.random() * 120 | 0); return; }   // si ferma a ridere (di rado: è lì che si prende)
    const p = g.player, dx = this.cx() - p.cx(), dy = this.cy() - p.cy(), d = Math.hypot(dx, dy) || 1;
    let vx, vy;
    if (d < 60) {   // scappa: tra otto direzioni, quella libera che lo porta più lontano da Lio (prima scappava dritto e finiva subito in un angolo)
      let best = -1;
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4, cx = Math.cos(a), cy = Math.sin(a), lx = this.cx() + cx * 22, ly = this.cy() + cy * 22;
        const ch = g.tiles[Math.floor(ly / TS)] && g.tiles[Math.floor(ly / TS)][Math.floor(lx / TS)];
        if (!ch || TILE_SOLID.has(ch) || ch === '_' || lx < 18 || lx > PLAY_W - 18 || ly < 18 || ly > PLAY_H - 18) continue;
        const sc = Math.hypot(lx - p.cx(), ly - p.cy()) + (cx * this.vx + cy * this.vy) * 6;
        if (sc > best) { best = sc; vx = cx; vy = cy; }
      }
      if (best < 0) { vx = dx / d; vy = dy / d; }
      this.vx = vx; this.vy = vy;
    }
    else {
      if (Math.hypot(this.tx - this.x, this.ty - this.y) < 6 || this.t % 120 === 0) { this.tx = (2 + Math.random() * 12) * TS; this.ty = (2 + Math.random() * 7) * TS; }
      const ex = this.tx - this.x, ey = this.ty - this.y, e = Math.hypot(ex, ey) || 1; vx = ex / e; vy = ey / e;
    }
    const x0 = this.x, y0 = this.y;
    moveEntity(this, vx * sp, vy * sp, { self: this, warpSolid: true, edgeSolid: true, pitSolid: true });
    if (Math.abs(this.x - x0) + Math.abs(this.y - y0) < sp * 0.3) moveEntity(this, -vy * sp, vx * sp, { self: this, warpSolid: true, edgeSolid: true, pitSolid: true });   // contro un muro: scivola di lato
  }
  draw(c) {
    const X = this.cx(), Y = this.cy(), t = this.t;
    drawShadow(c, X, Y + 7, 10);
    for (let i = 0; i < 10; i++) { const a = t * 0.25 + i * 0.63, r = 3 + (i % 5) * 1.4; c.fillStyle = i % 2 ? '#ffffff' : '#c8d8ec'; c.fillRect(Math.round(X + Math.cos(a) * r) - 1, Math.round(Y - 2 + Math.sin(a) * r * 0.6 - i * 0.6), 2, 2); }
    for (let i = 0; i < 4; i++) { const a = -t * 0.18 + i * 1.6; c.fillStyle = ['#7ab070', '#c8a040', '#a8c060', '#d88a40'][i]; c.fillRect(Math.round(X + Math.cos(a) * 7), Math.round(Y - 3 + Math.sin(a) * 4), 2, 1); }   // foglie
    if (this.warn) { const k = this.warn / LEAF_WARN; c.strokeStyle = 'rgba(255,240,170,' + (0.4 + k * 0.6) + ')'; c.lineWidth = 1; c.beginPath(); c.arc(X, Y - 2, 14 - k * 7, 0, Math.PI * 2); c.stroke(); }   // sta per lanciare una foglia
    if (this.real) ['#e84a5a', '#f8d048', '#4a8ae8'].forEach((col, i) => { c.fillStyle = col; for (let k = 0; k < 4; k++) c.fillRect(Math.round(X - 4 + i * 4 + Math.sin(t * 0.2 + k + i) * 2), Math.round(Y + 4 + k * 2), 1, 2); });   // i nastri del Grande Aquilone
  }
}
class Vento extends Entity {
  constructor() {
    super(0, 0); this.hb = { x: 0, y: 0, w: 0, h: 0 };
    this.title = 'IL VENTO'; this.maxHp = 3; this.hp = 3; this.round = 0; this.state = 'intro'; this.timer = 40; this.t = 0; this.swirls = []; this.leaves = []; this.leafT = 0; this.decoys = 0;
  }
  get sortY() { return -5; }
  box() { return { x: -999, y: -999, w: 0, h: 0 }; }
  start(g) {
    this.state = 'play';
    const n = [0, 2, 3][this.round], spots = [[7, 4], [3, 2], [12, 2], [3, 8], [12, 8]];
    this.swirls.forEach(s => { s.dead = true; });
    this.swirls = [];
    const real = new QSwirl(spots[0][0] * TS, spots[0][1] * TS, true); this.swirls.push(real);
    for (let i = 0; i < n; i++) this.swirls.push(new QSwirl(spots[i + 1][0] * TS, spots[i + 1][1] * TS, false));
    this.swirls.forEach(s => g.entities.push(s));
    this.leafT = LEAF_T();
  }
  tagged(g, s) {
    const p = g.player;
    if (!s.real) {   // una copia: si sfa in una folata
      s.dead = true; this.swirls = this.swirls.filter(x => x !== s); this.decoys++;
      g.puff(s.cx(), s.cy(), '#ffffff'); Sound.sfx('hush');
      const dx = p.cx() - s.cx(), dy = p.cy() - s.cy(), d = Math.hypot(dx, dy) || 1;
      for (let i = 0; i < 6; i++) moveEntity(p, dx / d * 4, dy / d * 4, p.mopts);
      g.banner = { text: 'Ah-ah! Non ero io!', t: 70 };
      return;
    }
    this.round++; this.hp = this.maxHp - this.round; Sound.sfx('secret'); g.song = null;
    this.swirls.forEach(x => { x.dead = true; g.puff(x.cx(), x.cy(), '#ffffff'); }); this.swirls = []; this.leaves = [];
    if (this.round >= this.maxHp) { this.state = 'peace'; this.timer = 40; return; }
    this.state = 'talk';
    g.say([
      ['Il Vento ride, e la sala ride con lui: «Preso! Mi hai preso! Nessuno mi aveva mai preso. Nessuno ci aveva mai PROVATO».', 'Il Vento: «Adesso però mi nascondo meglio. Guarda bene: io sono quello con i nastri del tuo aquilone!»'],
      ['Il Vento: «Ancora! Ah, che bello. Da quanto non giocavo con qualcuno...»', 'Il Vento: «Ultima volta. Stavolta mi difendo: attento alle foglie!»'],
    ][this.round - 1]);
  }
  update(g) {
    this.t++;
    switch (this.state) {
      case 'intro': case 'talk': if (!g.dialog && --this.timer <= 0) this.start(g); if (this.state === 'talk' && !g.dialog) this.timer = Math.min(this.timer, 30); break;
      case 'play': {
        if (g.dialog) break;
        const p = g.player, sp = SWIRL_SP()[this.round];
        const pb = p.box(), near = { x: pb.x - 3, y: pb.y - 3, w: pb.w + 6, h: pb.h + 6 }, sb = p.attackT > 0 ? p.swordBox() : null;
        for (const s of this.swirls.slice()) {
          s.move(g, sp);
          if (overlap(near, s.box()) || (sb && overlap(sb, s.box()))) { this.tagged(g, s); if (this.state !== 'play') break; }
        }
        if (this.state !== 'play') break;
        if (this.round === 2) {   // le foglie
          const real = this.swirls.find(s => s.real);
          if (real) { --this.leafT; real.warn = this.leafT <= LEAF_WARN ? LEAF_WARN - this.leafT : 0; if (real.warn === 1) Sound.sfx('charge'); }
          if (real && this.leafT <= 0 && this.leaves.length >= 2) this.leafT = 20;   // al massimo due foglie in aria
          else if (real && this.leafT <= 0) { this.leafT = LEAF_T(); real.warn = 0; const dx = p.cx() - real.cx(), dy = p.cy() - real.cy(), d = Math.hypot(dx, dy) || 1; this.leaves.push({ x: real.cx(), y: real.cy(), vx: dx / d * LEAF_V(), vy: dy / d * LEAF_V(), t: 180 }); Sound.sfx('cut'); }
          for (const L of this.leaves) {
            L.x += L.vx; L.y += L.vy; L.t--;
            const tx = Math.floor(L.x / TS), ty = Math.floor(L.y / TS), ch = g.tiles[ty] && g.tiles[ty][tx];
            if (!ch || TILE_SOLID.has(ch)) L.t = 0;
            else if (overlap({ x: L.x - 3, y: L.y - 3, w: 6, h: 6 }, p.box())) { L.t = 0; p.hurt(g, 1, L.x, L.y); }
          }
          this.leaves = this.leaves.filter(L => L.t > 0);
        }
        break;
      }
      case 'peace': if (!g.dialog && --this.timer <= 0) { this.state = 'done'; ventoPeace(g, this); } break;
    }
  }
  draw(c) {   // il volto del Vento, appena accennato, in alto; le foglie
    const t = this.t, a = this.state === 'done' ? 0.8 : 0.45;
    c.fillStyle = 'rgba(90,120,180,' + a + ')';   // azzurro-grigio: bianco sul pavimento di nuvola non si vedeva
    for (let i = 0; i < 9; i++) c.fillRect(Math.round(100 + i * 7 + Math.sin(t * 0.05 + i) * 2), 22 + Math.round(Math.sin(t * 0.04 + i * 0.8) * 2), 5, 1);   // la fronte
    c.fillRect(110, 30, 8, 2); c.fillRect(138, 30, 8, 2);   // gli occhi
    for (let i = 0; i < 7; i++) c.fillRect(116 + i * 4, 40 + Math.round(Math.abs(i - 3) * -1 + 3), 3, 1);   // il sorriso
    for (const L of this.leaves) { const X = Math.round(L.x), Y = Math.round(L.y); drawShadow(c, X, Y + 6, 6); c.fillStyle = '#1a1420'; c.fillRect(X - 4, Y - 3, 8, 6); c.fillStyle = (L.t >> 2) % 2 ? '#7ab070' : '#c8a040'; c.fillRect(X - 3, Y - 2, 6, 4); c.fillStyle = '#4a6a3a'; c.fillRect(X - 3, Y, 6, 1); }   // più grandi e con l'ombra: si leggono meglio
  }
}

function ventoPeace(g, V) {
  const f = g.s.flags;
  f.qWind = true; f['song:valle'] = true; g.boss = null; g.song = null;
  if (typeof bestMark === 'function') bestMark(g, V, true);
  for (const [x, y] of [[7, 10], [8, 10]]) g.tiles[y][x] = '.';
  g.redrawBg();
  g.pickups.push(new Pickup(128, 96, 'container'));
  Sound.music('temple'); g.saveGame();
  g.say([
    'Il mulinello rallenta, si siede sul trono... e per un momento, tra le foglie e i nastri, vedi un viso: un ragazzo con i capelli spettinati, che ride senza fiato.',
    'Il Vento: «Grazie. È stata la giornata più bella della mia vita. E la mia vita è lunga quanto il mondo».',
    'Il Vento: «Adesso la cosa da restituirti». Una bolla d\'aria tiepida ti scende tra le mani: dentro ci sono le tre strofe, finalmente insieme.',
    'Il Vento: «Questa la cantava una donna, sulla collina sopra Brinavalle, la sera. Aveva un bambino in braccio, e il bambino rideva. Eri tu».',
    'Il Vento: «Quando lei non c\'è più stata, nessuno l\'ha più cantata. Tuo padre ci provava, ma gli si rompeva la voce. Allora l\'ho presa io, perché non si perdesse».',
    g2 => { Sound.sfx('fairy'); g2.banner = { text: 'Hai imparato la ' + SONGS.valle.name.toUpperCase() + '!', t: 150 }; },
    'È la CANZONE DELLA VALLE: ' + SONGS.valle.seq.map(n => NOTE_GLYPH[n]).join(' ') + '. Con la Conca, puoi cantarla dove vuoi.',
    'Il Vento: «E ora, una cosa che non ho mai fatto. Chiamo i miei fratelli». Fischia, e tutto il palazzo risponde.',
    g2 => { Sound.sfx('ring'); g2.shake = 8; },
    'Dal Diapason, la nota del cielo. Dalla Conca, il canto del mare. Dal fondo, lontanissimo, il battito della terra. E il vento li prende tutti e li porta giù, fino alla valle.',
    'Per la prima volta da quando esiste il mondo, i QUATTRO fratelli cantano insieme. E cantano la canzone di tua madre.',
    g2 => { g2.ch7CardIn = 60; g2.saveGame(); },
  ]);
}

/* ------------------------------ installazione ------------------------------ */
(function installWindPalace() {
  const G = Game;
  const applyGates = g => {
    const def = g.room; if (!def || !def.wgates) return;
    const pb = g.player && g.player.box(), onIt = (x, y) => pb && overlap(pb, { x: x * TS, y: y * TS, w: TS, h: TS });
    let changed = false; g.qGatePending = false;
    for (const gt of def.wgates) for (const [x, y] of gt.tiles) {
      const open = qDir(g) === gt.dir, ch = open ? '.' : 'J';
      if (!open && onIt(x, y)) { g.qGatePending = true; continue; }   // mai una porta che si chiude addosso a Lio
      if (g.tiles[y][x] !== ch) { g.tiles[y][x] = ch; changed = true; }
    }
    if (changed) g.redrawBg();
  };
  window.applyQGates = applyGates;

  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.call(this, id);
    this.puffs = [];
    const def = ROOMS[id]; if (!def || !def.palace) return;
    applyGates(this);
    for (const [x, y] of def.puffs || []) { const P = { x, y, under: this.tiles[y][x], mv: null }; if (P.under === '_') this.tiles[y][x] = '.'; this.puffs.push(P); }
    if (def.puffs) this.redrawBg();
    if (id === 'q:1,0' && !this.s.flags.qWind) {
      this.boss = new Vento(); this.entities.push(this.boss);
      for (const [x, y] of [[7, 10], [8, 10]]) this.tiles[y][x] = 'N';
      this.redrawBg();
    }
  };

  /* la Girandola: una folata dove guardi */
  const useItem = G.useItem;
  G.useItem = function () {
    if (this.equipped() !== 'pinwheel') return useItem.call(this);
    const p = this.player;
    if ((p.gustCd || 0) > 0) return;
    p.gustCd = 30;
    const d = p.dir, [vx, vy] = QD_V[d];
    this.entities.push(new QGust(p.cx() + vx * 6, p.cy() - 4 + vy * 6, d));
    Sound.sfx('spin');
    // spinge via chi è davanti (Refoli e mulinelli del Vento): un cono di 4 tessere
    for (const e of this.entities) {
      if (e.dead || e === p || !(e.enemy || e instanceof QSwirl)) continue;
      const dx = e.cx() - p.cx(), dy = e.cy() - p.cy(), along = dx * vx + dy * vy, side = Math.abs(dx * vy - dy * vx);
      if (along < 0 || along > 64 || side > 20) continue;
      if (e instanceof QSwirl) e.blown = { vx: vx * 3, vy: vy * 3, t: 14 };
      else for (let i = 0; i < 4; i++) moveEntity(e, vx * 5, vy * 5, { self: e, warpSolid: true, edgeSolid: true });
    }
    if (!inPalace(this)) { if (!this.qGustTip) { this.qGustTip = true; this.banner = { text: 'Una folata leggera', t: 60 }; } return; }
    this.s.qDir = d; this.banner = { text: 'Folata ' + QD_ARROW[d], t: 50 };
    applyGates(this); blowPuffs(this, d);
  };

  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    if (this.player && this.player.gustCd > 0) this.player.gustCd--;
    // la Canzone della Valle (con la Conca): la suona questo file, non il Tempio
    const S = this.song;
    if (S && S.done && S.done.id === 'valle' && S.done.t <= 1 && !this.dialog) { this.song = null; valleSong(this); }
    updatePlay.call(this);
    if (this.state !== 'play') return;
    if (this.puffs && this.puffs.length) updatePuffs(this);
    if (this.qGatePending) applyGates(this);
    if (this.qStrofaNote && !this.dialog) { this.qStrofaNote = false; this.say(['Le tre strofe si cercano tra loro e si mettono a cantare, ognuna un pezzo. Nella Sala delle Voci, la porta del trono si è aperta.']); }
    const f = this.s.flags;
    if (!this.dialog && this.roomId === 'o:1,2' && f.ch7Done && !f.ch7Home && this.player) {
      f.ch7Home = true; this.saveGame();
      this.say([
        'Quella sera il vento scende su Brinavalle, piano, e passa da una lanterna all\'altra. Una dopo l\'altra, si riaccendono tutte.',
        'Porta con sé una canzone. Nella piazza la gente si ferma: i vecchi la riconoscono per primi, e qualcuno comincia a cantarla sottovoce.',
        'Tuo padre esce di casa. Ascolta. Poi ti guarda, e ha gli occhi lucidi: «È la sua canzone. La canzone di tua madre. Dove... dove l\'hai trovata?»',
        'Gliela canti tu, con la Conca. Lui, questa volta, riesce a cantarla fino in fondo.',
        'E il vento la porta lontano, oltre le montagne a est, dove nessuno di Brinavalle è mai stato. E laggiù, per la prima volta... qualcuno risponde. Con la stessa canzone.',
      ]);
    }
  };
  function valleSong(g) {
    g.banner = { text: SONGS.valle.name, t: 90 }; Sound.sfx('fairy');
    const f = g.s.flags;
    g.say([g.roomId.startsWith('o:') ? 'La canzone corre per la valle. Da qualche parte, tuo padre smette di lavorare e si ferma ad ascoltare.' : f.ch7Home ? 'Il vento si alza, prende la canzone e la porta verso est, oltre le montagne.' : 'Il vento si alza e porta via la canzone, lontano.']);
  }
  const applyItem = G.applyItem;
  G.applyItem = function (kind, n) {
    applyItem.call(this, kind, n);
    if (kind === 'strofa' && strofaCount(this) >= 3) this.qStrofaNote = true;
    if (kind === 'pinwheel') { this.s.equip = 'pinwheel'; this.saveGame(); }
  };

  /* il cartello di fine Capitolo VII */
  const update = G.update;
  G.update = function () {
    if (this.state === 'chapter7') {
      this.t++; this.ch7T++;
      if (this.ch7T > 120 && (Input.hit('action') || Input.hit('start'))) {
        this.state = 'play'; this.s.flags.ch7Done = true; this.saveGame(); Sound.sfx('select');
        this.startWarp({ to: 'o:1,2', x: 6, y: 7, dir: 0 }, 'Z');   // giù col mulinello, fino in piazza
      }
      return;
    }
    update.call(this);
    if (this.ch7CardIn > 0 && this.state === 'play' && !this.dialog && --this.ch7CardIn === 0) { this.state = 'chapter7'; this.ch7T = 0; Sound.sfx('victory'); }
  };
  const render = G.render;
  G.render = function () {
    render.call(this);
    if (this.state !== 'chapter7') return;
    const t = this.ch7T, a = Math.min(0.75, t / 60), ta = Math.max(0, Math.min(1, (t - 30) / 40));
    sctx.fillStyle = 'rgba(14,22,44,' + a + ')'; sctx.fillRect(0, 0, GW * SCALE, GH * SCALE);
    if (ta <= 0) return;
    txt('CAPITOLO VII', 128, 46, { align: 'center', size: 11, color: '#c8bcd8', alpha: ta });
    txt('Il Fratello Vento', 128, 63, { align: 'center', size: 12, font: TITLE_FONT, color: '#ffd870', alpha: ta });
    txt('— completato —', 128, 84, { align: 'center', size: 11, color: '#f4ecdc', alpha: ta });
    txt('I quattro fratelli hanno cantato insieme la canzone di tua madre.', 128, 104, { align: 'center', size: 10, color: '#f4ecdc', alpha: ta, maxW: 236 });
    txt('E il vento l\'ha portata lontano, oltre le montagne a est...', 128, 116, { align: 'center', size: 10, color: '#a8c8f8', alpha: ta, maxW: 236 });
    txt('Tempo ' + fmtTime(this.s.time) + ' · Cuori ' + this.s.maxHp / 2, 128, 136, { align: 'center', size: 9, color: '#c8bcd8', alpha: ta });
    if (t > 120) txt('Premi ' + actKey(true) + ' per continuare', 128, 158, { align: 'center', size: 9, color: '#a898c0', alpha: 0.6 + Math.sin(t * 0.08) * 0.3 });
  };

  /* le nuvolette, le frecce delle porte, le bolle delle voci */
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    const def = this.room; if (!def || !def.palace) return;
    for (const P of this.puffs || []) {
      const k = P.mv ? P.mv.k : 0, X = P.x * TS + (P.mv ? P.mv.dx * k : 0), Y = P.y * TS + (P.mv ? P.mv.dy * k : 0), b = Math.sin(this.t * 0.08 + P.x) * 0.8;
      c.fillStyle = 'rgba(80,100,150,0.35)'; c.fillRect(X + 1, Y + 13, 14, 3);
      c.fillStyle = '#9aa8d0'; c.fillRect(X, Y + 3 + b, 16, 11); c.fillRect(X + 3, Y + b, 10, 15);
      c.fillStyle = '#ffffff'; c.fillRect(X + 1, Y + 4 + b, 14, 9); c.fillRect(X + 4, Y + 1 + b, 8, 13);
      c.fillStyle = '#e4ecfa'; c.fillRect(X + 2, Y + 10 + b, 12, 3);
    }
    for (const gt of def.wgates || []) for (const [x, y] of gt.tiles) {   // la freccia della banderuola
      const open = qDir(this) === gt.dir, X = x * TS + 8, Y = y * TS + 8, [vx, vy] = QD_V[gt.dir];
      c.globalAlpha = open ? 0.35 : 1; c.fillStyle = '#3a3a5a';
      for (let i = -5; i <= 5; i++) c.fillRect(Math.round(X + vx * i) - (vy ? 1 : 0), Math.round(Y + vy * i) - (vx ? 1 : 0), vy ? 2 : 1, vx ? 2 : 1);
      c.fillStyle = '#e8c050'; for (let i = 0; i < 4; i++) { const hx = X + vx * (5 - i), hy = Y + vy * (5 - i); c.fillRect(Math.round(hx - vy * i) - 1, Math.round(hy - vx * i) - 1, 2, 2); c.fillRect(Math.round(hx + vy * i) - 1, Math.round(hy + vx * i) - 1, 2, 2); }
      c.globalAlpha = 1;
    }
    if (this.roomId === 'q:1,1') Object.keys(VOCI).forEach((k, i) => {   // le bolle con le voci
      const [x, y] = k.split(',').map(Number), bx = x * TS + 8 + Math.sin(this.t * 0.03 + i) * 3, by = y * TS - 4 + Math.cos(this.t * 0.04 + i) * 2, heard = this.s.flags['voce:' + i];
      c.strokeStyle = heard ? 'rgba(255,230,160,0.9)' : 'rgba(255,255,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.arc(bx, by, 5, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(Math.round(bx) - 2, Math.round(by) - 3, 2, 1);
    });
    if (this.roomId === 'q:1,1') for (let i = 0; i < 3; i++) { const on = this.s.flags['chest:' + STROFE[i].id]; c.fillStyle = '#5a6090'; c.fillRect(7 * TS + 2 + i * 9, 3, 6, 8); if (on) { c.fillStyle = (this.t >> 4) % 3 === i ? '#ffe0f0' : '#e8a0c0'; c.fillRect(7 * TS + 3 + i * 9, 4, 4, 6); } }
  };
  /* la direzione dell'ultima folata, in alto a destra (nel palazzo, se non c'è già il vento del Ciclo 40) */
  const drawHUDText = G.drawHUDText;
  G.drawHUDText = function () {
    drawHUDText.apply(this, arguments);
    if (this.state !== 'play' || !inPalace(this) || (this.room && this.room.wind) || !this.s.items.pinwheel) return;
    txt('Folata ' + QD_ARROW[qDir(this)], 250, HUD_H + 3, { size: 9, align: 'right', color: '#c8dcf0' });
  };

  /* mappa */
  const mp = G.mapPrefix;
  G.mapPrefix = function () { return this.roomId.startsWith('q:') ? 'q:' : mp.call(this); };

  /* diario, obiettivo, Segnavia */
  if (window.CHAPTERS7) CHAPTERS7.push(
    { name: 'Il Palazzo del Vento', done: g => !!g.s.flags.qIn },
    { name: 'La canzone ritrovata', done: g => !!g.s.flags.qWind },
  );
  const qGoal = g => {
    const f = g.s.flags;
    if (f.qWind) return 'none';
    if (!f.qIn || !f.windSeen) return null;
    if (!g.s.items.pinwheel) return 'q:0,2';
    const miss = STROFE.find(s => !f['chest:' + s.id]);
    return miss ? miss.room : 'q:1,0';
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const goal = qGoal(g), f = g.s.flags;
    if (!goal) return co(g);
    if (goal === 'none') return f.ch7Done ? 'La canzone di tua madre è andata oltre le montagne a est... e qualcuno, laggiù, ha risposto.' : 'Il Vento ti ha restituito la canzone.';
    if (!g.s.items.pinwheel) return 'Nella sala a ovest dell\'Atrio, uno scrigno legato con nastri: dentro c\'è qualcosa per soffiare.';
    const n = strofaCount(g);
    if (n < 3) return 'Strofe della canzone (' + n + '/3). Mancano: ' + STROFE.filter(s => !f['chest:' + s.id]).map(s => s.short).join(', ') + '. La Girandola soffia dove guardi.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    return 'La porta del trono è aperta: sali dal Vento, e prendilo tre volte!';
  };
  window.currentObjective = currentObjective;
  const or0 = objectiveRoom, oc0 = objectiveChest;
  objectiveRoom = function (g) { const t = qGoal(g); return t === 'none' ? null : t || or0(g); };
  window.objectiveRoom = objectiveRoom;
  objectiveChest = function (g) { return g.roomId === 'q:0,2' && !g.s.items.pinwheel ? 'pinwheel' : STROFE.some(s => s.room === g.roomId && !g.s.flags['chest:' + s.id]) ? 'strofa' : oc0(g); };

  if (typeof BESTIARY !== 'undefined') {
    let pic = null;
    BESTIARY.push({ k: 'vento', name: 'Il Vento', boss: true, seenIsEnough: true,
      spr: () => pic || (pic = (() => { const cv = makeCanvas(16, 16), s = new QSwirl(0, 0, true); s.draw(cv.getContext('2d')); return cv; })()),
      lore: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Il quarto fratello, quello che porta. Non ha volto, e chi non ha volto si dimentica. Conserva le voci perdute.',
      weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Non si combatte: si gioca. Prendi quello coi nastri; la Girandola lo spinge.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Vento ? 'vento' : bk(e); };
  }
  if (typeof MEDALS !== 'undefined') MEDALS.push(
    { id: 'acchiappavento', name: 'Acchiappavento', desc: 'Prendi il Vento tre volte, nel suo palazzo.', icon: 'pinwheel', tier: 2, got: g => !!g.s.flags.qWind },
    { id: 'vocivento', name: 'Le voci del vento', desc: 'Ascolta tutte le voci nella Sala delle Voci.', icon: 'strofa', tier: 0, got: g => Object.keys(VOCI).every((_, i) => g.s.flags['voce:' + i]) });
  Object.assign(window, { Vento, QSwirl, QGust, STROFE, strofaCount, QD, QD_V, qDir, VOCI, blowPuffs, puffAt });
})();
