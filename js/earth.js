'use strict';
/* =====================================================================
 *  EARTH — Ciclo 38 (Agente B, seconda manche): CAPITOLO VI, «IL BATTITO DELLA TERRA».
 *  Il Capitolo V finiva così: «ma sotto Brinavalle, quella notte, la terra ha
 *  cominciato a tremare...». Il cielo (la stella) e il mare (la Madre delle
 *  Acque) hanno fatto pace e hanno cantato insieme. Ma c'è una terza sorella:
 *  LA TERRA, la più piccola, quella che porta tutti sulle spalle e per cui
 *  nessuno ha mai cantato. Ha sentito gli altri due, e ha pianto: da tre giorni
 *  il suo cuore batte storto, e la valle trema.
 *  · Tornando a Brinavalle, un terremoto apre una FENDITURA nella piazza.
 *  · Sotto c'è FONDOGROTTA: i discendenti dei minatori rimasti sottoterra dopo
 *    un crollo di duecento anni fa. Vivono al ritmo del cuore della Terra.
 *  · Nuova regione «k:» (le GALLERIE), 6 luoghi:
 *      k:1,0 La Fenditura          (arrivo, sotto la piazza)
 *      k:1,1 Fondogrotta           (Bruna, Ferro, Pietruccio)
 *      k:0,1 Miniera dei Cristalli (BUIA: una pietra in fondo al labirinto)
 *      k:2,1 Fiume Sotterraneo     (una pietra oltre il fiume: arpione)
 *      k:2,2 Galleria delle Talpe  (una pietra: sconfiggi le talpe corazzate)
 *      k:1,2 Sala delle Radici     (il portone verso il Cuore della Terra)
 *  · MECCANICA NUOVA, I TERREMOTI: nelle gallerie, ogni tanto la terra trema e
 *    dal soffitto cadono MASSI. Prima compare la loro OMBRA: spostati.
 *  · Tre PIETRE DEL BATTITO, scolpite dai vecchi minatori per tenere il ritmo,
 *    rimesse nella Sala delle Radici aprono la via verso il cuore: il prossimo
 *    capitolo, prefisso g:, prima sala 'g:1,2'.
 *  · Nuovo nemico: la TALPA CORAZZATA (scava sotto terra, sbuca dove sei).
 *  Flag: ch6Call, earthIn, brunaHello, chest:k_stone_miniera / k_stone_fiume /
 *        k_stone_talpe, rootsDoor (le pietre al loro posto: la via è aperta).
 * ===================================================================== */
const HEART_ROOM = 'g:1,2';
const EARTH_STONES = [
  { id: 'k_stone_miniera', room: 'k:0,1', where: 'la Miniera dei Cristalli' },
  { id: 'k_stone_fiume', room: 'k:2,1', where: 'il Fiume Sotterraneo' },
  { id: 'k_stone_talpe', room: 'k:2,2', where: 'la Galleria delle Talpe' },
];
const stoneCount = g => EARTH_STONES.filter(s => g.s.flags['chest:' + s.id]).length;
const QUAKE_WARN = 60, ROCK_T = 48;   // frame di tremito prima dei massi; frame dell'ombra prima che il masso tocchi terra

ITEMS.heartstone = { name: 'Pietra del Battito', text: () => 'Hai trovato una PIETRA DEL BATTITO! Ha un cuore inciso sopra, e se la tieni stretta... batte. (' + stoneCount(Game) + '/3)' };
PEOPLE.bruna = { h: '#5a3a2a', s: '#d8a880', x: '#c8a040', c: '#6a5a3a', d: '#4a3a24', p: '#3a2a1a', b: '#2a1a10' };
PEOPLE.ferro = { h: '#2a2a2a', s: '#c89070', x: '#8a8a8a', c: '#5a4a3a', d: '#3a2e22', p: '#2a2a2a', b: '#1a1010', beard: true };
for (const k of ['bruna', 'ferro']) SPR.people[k] = buildHumanoid(PEOPLE[k]);

/* ------------------------------ arte: terra, stalagmiti, funghi ------------------------------ */
(function earthArt() {
  const mk = (rows, pal) => spriteFromRows(rows, Object.assign({ o: '#1a1420' }, pal));
  ICON.heartstone = mk(['.ooooo.', 'ossssso', 'osrsrso', 'osrrrso', 'ossrsso', 'ossssso', '.ooooo.'], { s: '#8a8098', r: '#e04a5a' });
  Ground.earth = (P, r) => {
    P.r(0, 0, 16, 16, '#6a5040');
    for (let i = 0; i < 14; i++) P.p(r() * 16, r() * 16, '#5a4234');
    for (let i = 0; i < 5; i++) P.p(r() * 16, r() * 16, '#7e6250');
    if (r() < 0.2) { const x = 2 + (r() * 11 | 0), y = 2 + (r() * 11 | 0); P.p(x, y, '#a8d8ff'); }   // un cristallino
  };
  const dot = TilePaint['.'], tuft = TilePaint[','], tree = TilePaint['T'];
  TilePaint['.'] = (P, r, e) => e && e.ground === 'earth' ? Ground.earth(P, r) : dot(P, r, e);
  TilePaint[','] = (P, r, e) => {   // funghetti luminosi
    if (!e || e.ground !== 'earth') return tuft(P, r, e);
    Ground.earth(P, r);
    for (let k = 0; k < 3; k++) { const x = 2 + (r() * 11 | 0), y = 6 + (r() * 7 | 0); P.r(x, y, 1, 3, '#d8d0c0'); P.r(x - 1, y - 1, 3, 2, k % 2 ? '#80e0c0' : '#c0a0f0'); }
  };
  TilePaint['T'] = (P, r, e) => {   // sottoterra: una stalagmite
    if (!e || e.ground !== 'earth') return tree(P, r, e);
    Ground.earth(P, r);
    P.r(3, 13, 10, 3, '#4a3428');
    for (let y = 1; y < 15; y++) { const w = Math.round(1 + (y / 14) * 9), x0 = 8 - (w >> 1); P.r(x0, y, w, 1, '#8a7a72'); P.p(x0, y, '#5a4a44'); P.p(x0 + w - 1, y, '#a89890'); }
    P.p(8, 1, '#c8b8b0');
  };
})();

/* --------------------------------- le stanze --------------------------------- */
const QUAKE = { period: 660 };
Object.assign(ROOMS, {
  'k:1,0': {
    name: 'La Fenditura', ground: 'earth', music: 'cave',
    tiles: [
      'KKKKKKKUKKKKKKKK',
      'K.,....:.....,.K',
      'K..T...:...T...K',
      'K......:.......K',
      'K.T....:....T..K',
      'K......:.......K',
      'K..,...:..,....K',
      'K.T....:....T..K',
      'K......:.......K',
      'K,.....:......,K',
      'KKKKKKK..KKKKKKK',
    ],
    warps: { '7,0': { to: 'o:1,2', x: 8, y: 9, dir: 0 } },
    quake: QUAKE,
    enemies: [{ type: 'bat', x: 3, y: 6 }, { type: 'bat', x: 12, y: 3 }],
    onEnter: g => {
      if (g.s.flags.earthIn) return;
      g.s.flags.earthIn = true;
      g.say([
        'Scendi nella fenditura. Sotto la piazza di Brinavalle c\'è... un\'altra valle: gallerie, radici che pendono dal soffitto, funghi che brillano.',
        'Il pavimento vibra. Lontano, lentissimo, si sente un tonfo. Poi un altro. Come un cuore enorme... che sbaglia il ritmo.',
        'Quando la terra trema, dal soffitto cade qualcosa. Guarda per terra: un\'ombra che si allarga è un masso in arrivo.',
      ]);
    },
  },
  'k:1,1': {
    name: 'Fondogrotta', ground: 'earth', music: 'village',
    tiles: [
      'KKKKKKK..KKKKKKK',
      'K.NNNN.::.NNNN.K',
      'K.NNNN.::.NNNN.K',
      'K......::......K',
      'K..Y...::...Y..K',
      '::::::::::::::::',
      'K......::......K',
      'K..Y...::...Y..K',
      'K.NNNN.::.NNNN.K',
      'K.NNNN.::.NNNN.K',
      'KKKKKKK..KKKKKKK',
    ],
    npcs: [
      { id: 'bruna', sprite: 'bruna', x: 5, y: 3, talk: g => brunaTalk(g) },
      { id: 'ferro', sprite: 'ferro', x: 10, y: 6, talk: g => ferroTalk(g) },
      { id: 'pietruccio', sprite: 'kid', x: 9, y: 3, talk: g => {
        const f = g.s.flags, L = [
          'Pietruccio: Tu vieni da SOPRA? È vero che lassù il soffitto è azzurro e non finisce mai? Io non ci credo.',
          'Pietruccio: Le talpe corazzate scavano sotto i piedi. Quando vedi la terra che si gonfia, scappa! Poi, quando escono, picchiale.',
          'Pietruccio: Nella Miniera dei Cristalli è buio pesto. Il nonno ci andava con la lanterna, io ho paura.',
          'Pietruccio: Il fiume sotterraneo non si attraversa a nuoto: ti porta via. I minatori usavano i pali, e una corda col gancio.',
        ];
        return [L[(f.pieIdx = ((f.pieIdx || 0) + 1) % L.length)]];
      } },
    ],
    signs: { '3,2': ['Una casa scavata nella roccia. Sulla porta, un cuore inciso e una data: «ANNO DEL CROLLO».'], '12,2': ['La fucina di Ferro. Fa caldo come d\'estate, lassù.'] },
    onEnter: g => {
      if (g.s.flags.fondoSeen) return;
      g.s.flags.fondoSeen = true;
      g.say(['Case scavate nella roccia, bracieri accesi, gente con il viso sporco di terra che ti guarda a bocca aperta: un villaggio, sottoterra. FONDOGROTTA.']);
    },
  },
  'k:0,1': {
    name: 'Miniera dei Cristalli', ground: 'earth', music: 'cave', dark: true,
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K......K.....T.K',
      'K.K.KK.K.KKK.K.K',
      'K.K..K...K...K.K',
      'K.KK.KKK.K.KKK.K',
      'K....K.....K....',
      'K.KKKK.KKK.K.K.K',
      'K....K...K...K.K',
      'K.KK.K.K.KKK.K.K',
      'K....T.K.......K',
      'KKKKKKKKKKKKKKKK',
    ],
    quake: QUAKE,
    chests: [{ id: 'k_stone_miniera', x: 1, y: 1, item: 'heartstone' }],
    enemies: [{ type: 'bat', x: 8, y: 7 }],
    signs: { '14,6': ['Un cartello dei minatori, scritto col carbone: «Senza lanterna non si entra. E se entri lo stesso, tieni la mano sul muro di sinistra».'] },
  },
  'k:2,1': {
    name: 'Fiume Sotterraneo', ground: 'earth', music: 'cave',
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K.....~~~~KKKKKK',
      'K.....~~~~...KKK',
      'K.....~~~~....KK',
      'K.....~~~~.h..KK',
      '......~~~~.....K',
      'K...h.~~~~.....K',
      'K.....~~~~....KK',
      'K.....~~~~...KKK',
      'K.....~~~~KKKKKK',
      'KKKKKKKKKKKKKKKK',
    ],
    quake: QUAKE,
    chests: [{ id: 'k_stone_fiume', x: 13, y: 4, item: 'heartstone' }],   // oltre il fiume: arpione dalla riva (5,4) al palo (11,4); ritorno da (10,6) al palo (4,6)
    enemies: [{ type: 'slime', x: 2, y: 8 }],
    signs: { '1,4': ['Inciso sulla roccia: «Il fiume non perdona chi nuota. Il palo non tradisce chi lo aggancia».'] },
  },
  'k:2,2': {
    name: 'Galleria delle Talpe', ground: 'earth', music: 'dungeon',
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K..............K',
      'K..,.......,...K',
      'K......T.......K',
      'K..............K',
      '...............K',
      'K......T.......K',
      'K..,.......,...K',
      'K..............K',
      'K..............K',
      'KKKKKKKKKKKKKKKK',
    ],
    clearFlag: 'cleared:k:2,2',
    chests: [{ id: 'k_stone_talpe', x: 13, y: 2, item: 'heartstone', cond: g => !!g.s.flags['cleared:k:2,2'] }],
    enemies: [{ type: 'mole', x: 6, y: 3 }, { type: 'mole', x: 11, y: 6 }, { type: 'mole', x: 8, y: 8 }],
    onEnter: g => {
      if (g.s.flags['cleared:k:2,2'] || g.s.flags.molesSeen) return;
      g.s.flags.molesSeen = true;
      g.say(['Il pavimento della galleria è tutto un su e giù di cumuli di terra. Qualcosa, là sotto, si muove.']);
    },
  },
  'k:1,2': {
    name: 'Sala delle Radici', ground: 'earth', music: 'temple',
    tiles: [
      'KKKKKKK..KKKKKKK',
      'K..............K',
      'K..T........T..K',
      'K..............K',
      'K......::......K',
      'K..KKKK::KKKK...',
      'K..KKKKJJKKKK..K',
      'K..KKKKKKKKKK..K',
      'K..............K',
      'K..............K',
      'KKKKKKKKKKKKKKKK',
    ],
    quake: QUAKE,
    signs: { '7,6': g => rootsDoor(g), '8,6': g => rootsDoor(g), '3,2': ['Radici grosse come tronchi scendono dal soffitto e si infilano nella roccia, verso il basso. Tutte nella stessa direzione: verso il cuore.'] },
    onEnter: g => {
      if (g.s.flags.rootsHallSeen) return;
      g.s.flags.rootsHallSeen = true;
      g.say(['Le radici di tutti gli alberi della valle finiscono qui, e si intrecciano attorno a una porta di pietra con tre incavi.', 'Da dietro la porta viene il battito: TUM... TUM-TUM... TUM. Irregolare, affannato. Come qualcuno che piange.']);
    },
  },
});

/* ------------------------------ dialoghi ------------------------------ */
function brunaTalk(g) {
  const f = g.s.flags;
  if (f.rootsDoor) return ['Bruna: Senti? Il battito è tornato regolare. TUM... TUM... Ma laggiù, oltre la porta, lei ti aspetta. Portale qualcosa che nessuno le ha mai dato.'];
  if (!f.brunaHello) return [
    'Bruna: Uno di sopra! Erano duecento anni che nessuno di sopra scendeva fin qui. Io sono Bruna. Questa è Fondogrotta.',
    'Bruna: I nostri antenati erano minatori di Brinavalle. Un crollo li chiuse quaggiù, e invece di morire trovarono il caldo, l\'acqua... e LEI.',
    'Bruna: La Terra ha un cuore, ragazzo. Batte da sempre, lento, e noi viviamo al suo ritmo. Da tre giorni batte storto: TUM, TUM-TUM, silenzio. E la valle trema.',
    'Bruna: Sai perché? Lei è la sorella più piccola. Il cielo ha le stelle, il mare ha le maree e i canti. Lei porta tutti sulle spalle, e nessuno ha mai cantato per lei.',
    'Bruna: Tre notti fa il cielo e il mare hanno cantato insieme. Lei li ha sentiti. E ha pianto.',
    'Bruna: I nostri antenati scolpirono tre PIETRE DEL BATTITO per tenere il ritmo nella Sala delle Radici. I terremoti le hanno sparpagliate: una nella MINIERA DEI CRISTALLI (a ovest, è buia), una oltre il FIUME SOTTERRANEO (a est), una nella GALLERIA DELLE TALPE.',
    'Bruna: Rimettile nella Sala delle Radici, a sud. Il cuore si calmerà... e la porta si aprirà.',
    g2 => { g2.s.flags.brunaHello = true; g2.saveGame(); },
  ];
  const n = stoneCount(g), miss = EARTH_STONES.filter(s => !f['chest:' + s.id]);
  return [n === 3 ? 'Bruna: Tutte e tre! Portale alla Sala delle Radici, a sud. Presto: ogni scossa è più forte.' : 'Bruna: Pietre del Battito: ' + n + ' su 3. Mancano ' + miss.map(s => s.where).join(', ') + '.'];
}
function ferroTalk(g) {
  const f = g.s.flags;
  const L = [
    'Ferro: Sono il fabbro. Con questi terremoti mi cadono i martelli in testa. Due volte, oggi.',
    'Ferro: Le talpe corazzate: la loro corazza si apre solo quando sbucano fuori. Allora colpisci, prima che si rituffino.',
    'Ferro: Nella miniera serve la LANTERNA. Se non ce l\'hai, Bortolo lassù ne vendeva. O ci vai a tentoni, come mio nonno. Lui ci ha lasciato un dito.',
    'Ferro: Quando senti il pavimento ronzare, guarda per terra. L\'ombra del masso arriva sempre un attimo prima del masso.',
  ];
  return [L[(f.ferroIdx = ((f.ferroIdx || 0) + 1) % L.length)]];
}
function rootsDoor(g) {
  const f = g.s.flags, n = stoneCount(g);
  if (f.rootsDoor) return ROOMS[HEART_ROOM] ? ['La porta di pietra è aperta. Dal fondo sale il battito, regolare e caldo.'] : ['La porta di pietra è aperta, e dal fondo sale il battito, finalmente regolare... Il prossimo capitolo comincia laggiù.'];
  if (n < 3) return ['Tre incavi rotondi nella porta. ' + (n ? 'Ne riempi ' + n + ', ma la porta non si muove. (' + n + '/3)' : 'Servono tre pietre.')];
  return [
    'Posi le tre Pietre del Battito negli incavi. Si accendono di rosso, una dopo l\'altra: TUM... TUM... TUM.',
    'Il battito dietro la porta esita, poi le segue. TUM... TUM... TUM. Regolare. Il pavimento smette di tremare.',
    g2 => { g2.s.flags.rootsDoor = true; g2.shake = 16; Sound.sfx('stomp'); Sound.sfx('secret'); g2.saveGame(); if (ROOMS[HEART_ROOM]) g2.loadRoom(g2.roomId); },
    'La porta di pietra si apre con un sospiro di polvere. Le radici di tutta la valle scendono là dentro, verso il CUORE DELLA TERRA.',
    ...g.giveItem('gems', 50),
  ];
}

/* ------------------------------ la Talpa corazzata ------------------------------ */
class Mole extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.hp = 2; this.dmg = 1; this.hb = { x: 2, y: 5, w: 12, h: 10 };
    this.state = 'under'; this.st = 60 + (Math.random() * 60 | 0);
  }
  update(g) {
    if (this.state === 'up' && this.baseUpdate()) { this.touchPlayer(g); return; }
    this.t++; if (this.flash > 0) this.flash--; if (this.inv > 0) this.inv--;
    const p = g.player;
    if (this.state === 'under') {   // scava verso Lio (invulnerabile, innocua)
      const dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1;
      moveEntity(this, dx / d * 0.7, dy / d * 0.7, { warpSolid: true, edgeSolid: true, pitSolid: true, self: this });
      if (--this.st <= 0 || d < 10) { this.state = 'mound'; this.st = 40; Sound.sfx('push'); }
    } else if (this.state === 'mound') {   // il cumulo trema: sta per uscire
      if (--this.st <= 0) { this.state = 'up'; this.st = 70; g.puff(this.cx(), this.cy() + 4, '#7e6250'); Sound.sfx('crumble'); this.touchPlayer(g); }
    } else if (this.state === 'up') {   // fuori: vulnerabile
      this.touchPlayer(g);
      if (--this.st <= 0) { this.state = 'under'; this.st = 70 + (Math.random() * 50 | 0); g.puff(this.cx(), this.cy() + 4, '#5a4234'); }
    }
  }
  hurt(g, d, dir) { if (this.state !== 'up') { Sound.sfx('clank'); return; } super.hurt(g, d, dir); }
  touchPlayer(g) { if (this.state === 'up') super.touchPlayer(g); }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y), t = this.t;
    const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(X + a, Y + b, w, h); };
    if (this.state !== 'up') {   // cumulo di terra (che trema prima di uscire)
      const j = this.state === 'mound' ? Math.round(Math.sin(t * 1.3)) : 0;
      R(3 + j, 10, 10, 4, '#3a2a20'); R(4 + j, 9, 8, 3, '#7e6250'); R(6 + j, 8, 4, 2, '#8e7260'); if (this.state === 'mound') { R(5, 7, 1, 1, '#a89080'); R(10, 7, 1, 1, '#a89080'); }
      return;
    }
    drawShadow(c, X + 8, Y + 14, 12);
    const white = this.flash > 0 && (this.flash >> 1) % 2 === 0, B = white ? '#ffffff' : '#6a6070', L = white ? '#ffffff' : '#9a90a8';
    R(3, 10, 10, 4, '#3a2a20');
    R(3, 3, 10, 9, '#1a1420'); R(4, 4, 8, 7, B); R(5, 4, 6, 1, L); R(4, 7, 8, 1, '#4a4258'); R(4, 9, 8, 1, '#4a4258');   // corazza a bande
    R(6, 9, 4, 3, '#f0a0a0'); R(7, 11, 2, 1, '#ffffff');   // muso
    R(5, 6, 1, 1, '#ffffff'); R(10, 6, 1, 1, '#ffffff');   // occhietti
    R(2, 10, 2, 2, '#e8d0c0'); R(12, 10, 2, 2, '#e8d0c0');  // zampe da scavo
  }
}

/* ---------------------------------- logica ---------------------------------- */
(function installEarth() {
  const G = Game;
  const mk0 = makeEnemy;
  makeEnemy = function (def) { return def.type === 'mole' ? new Mole(def.x * TS, def.y * TS) : mk0(def); };
  window.Mole = Mole;
  if (typeof BESTIARY !== 'undefined') {
    let pic = null;
    BESTIARY.push({ k: 'mole', name: 'Talpa corazzata',
      spr: () => pic || (pic = (() => { const cv = makeCanvas(16, 16), m = new Mole(0, 0); m.state = 'up'; m.t = 0; m.draw(cv.getContext('2d')); return cv; })()),
      lore: 'Vive nelle gallerie sotto Brinavalle. Scava verso di te sotto terra e sbuca proprio dove sei.',
      weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Sotto terra è intoccabile: quando esce, colpiscila prima che si rituffi.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Mole ? 'mole' : bk(e); };
  }

  /* ---------- l'inizio del Capitolo VI: il terremoto in piazza ---------- */
  const village = ROOMS['o:1,2'];
  village.dyn = (village.dyn || []).concat([{ x: 8, y: 8, ch: 'Z', cond: g => !!g.s.flags.ch6Call }]);
  village.warps = Object.assign({}, village.warps, { '8,8': { to: 'k:1,0', x: 7, y: 1, dir: 0 } });
  const elder = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
  if (elder) {
    const et = elder.talk;
    elder.talk = function (g) {
      const f = g.s.flags;
      if (f.ch6Call && !f.elderEarth) { f.elderEarth = true; return [
        'Teodoro: Il cielo, il mare... e la terra. I vecchi libri dicevano che erano tre fratelli. Della terra parlavano poco: «la sorella che regge le altre due».',
        'Teodoro: Se ora trema, Lio, forse è perché nessuno si è mai ricordato di lei. Scendi in quella fenditura. E ascolta, prima di colpire.',
      ]; }
      return et.call(this, g);
    };
  }
  const updatePlay0 = G.updatePlay;
  G.updatePlay = function () {
    updatePlay0.call(this);
    const f = this.s.flags;
    if (this.state === 'play' && !this.dialog && this.roomId === 'o:1,2' && f.ch5Done && !f.ch6Call && this.player) {
      f.ch6Call = true; this.shake = 30; Sound.sfx('stomp'); Sound.sfx('crumble');
      this.tiles[8][8] = 'Z'; this.redrawBg(); this.saveGame();
      this.say([
        'La terra TREMA! Le case scricchiolano, le galline scappano, Bortolo esce di corsa dalla bottega con una pentola in testa.',
        'Al centro della piazza il terreno si spacca: una FENDITURA, con dei gradini di roccia che scendono nel buio.',
        'Dal fondo sale un suono sordo: TUM... TUM-TUM... silenzio... TUM. Come un cuore che non trova più il suo ritmo.',
      ]);
    }
  };

  /* ---------- la porta della Sala delle Radici ---------- */
  const hall = ROOMS['k:1,2'];
  hall.dyn = [{ x: 7, y: 6, ch: 'Z', cond: g => !!g.s.flags.rootsDoor && !!ROOMS[HEART_ROOM] }, { x: 8, y: 6, ch: 'P', cond: g => !!g.s.flags.rootsDoor && !!ROOMS[HEART_ROOM] }];
  Object.defineProperty(hall, 'warps', { get: () => ROOMS[HEART_ROOM] ? { '7,6': { to: HEART_ROOM, x: 7, y: 8, dir: 1 } } : {}, configurable: true });

  /* ---------- i terremoti ---------- */
  G.quakeT = 0; G.rocks = [];
  const loadRoom = G.loadRoom;
  G.loadRoom = function () { const r = loadRoom.apply(this, arguments); this.quakeT = 0; this.rocks = []; return r; };
  // i massi cadono vicino a Lio (uno proprio su di lui), solo su tessere libere
  G.quakeDrop = function () {
    const p = this.player, cx = Math.floor(p.cx() / TS), cy = Math.floor((p.y + 12) / TS), spots = [[cx, cy]];
    for (let i = 0; i < 30 && spots.length < 4; i++) {
      const x = cx + ((Math.random() * 7) | 0) - 3, y = cy + ((Math.random() * 7) | 0) - 3;
      if (x < 1 || y < 1 || x > RW - 2 || y > RH - 2 || spots.some(s => s[0] === x && s[1] === y)) continue;
      const ch = this.tiles[y][x]; if (TILE_SOLID.has(ch) || TILE_WARP.has(ch) || ch === '~' || ch === '_') continue;
      spots.push([x, y]);
    }
    this.rocks = spots.map(([x, y], i) => ({ x: x * TS + 8, y: y * TS + 8, t: ROCK_T + i * 6 }));
  };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    const Q = this.room && this.room.quake, f = this.s.flags;
    if (this.state !== 'play' || !Q || this.dialog || f.rootsDoor) return;   // con le pietre al loro posto la terra si calma
    this.quakeT++;
    const k = this.quakeT % Q.period;
    if (k === Q.period - QUAKE_WARN) { this.shake = Math.max(this.shake, QUAKE_WARN); Sound.sfx('stomp'); if (!f.quakeTip) { f.quakeTip = true; this.banner = { text: 'La terra trema! Guarda le ombre per terra!', t: 120 }; } }
    if (k === 0 && this.quakeT > 0) this.quakeDrop();
    for (const r of this.rocks) {
      if (--r.t !== 0) continue;
      Sound.sfx('crumble'); this.puff(r.x, r.y, '#8a7a72');
      const p = this.player, box = { x: r.x - 7, y: r.y - 7, w: 14, h: 14 };
      if (p && overlap(box, p.box())) p.hurt(this, 1, p.cx(), p.cy() - 20);
    }
    this.rocks = this.rocks.filter(r => r.t > 0);
  };
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    for (const r of this.rocks || []) {
      const k = 1 - r.t / ROCK_T;   // l'ombra si allarga; negli ultimi frame il masso scende
      c.globalAlpha = 0.25 + k * 0.35; c.fillStyle = '#000000';
      c.beginPath(); c.ellipse(r.x, r.y + 3, 3 + k * 5, 2 + k * 3, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      if (r.t < 14) { const y = r.y - r.t * 6; c.fillStyle = '#1a1420'; c.fillRect(r.x - 5, y - 5, 10, 10); c.fillStyle = '#8a7a72'; c.fillRect(r.x - 4, y - 4, 8, 8); c.fillStyle = '#a89890'; c.fillRect(r.x - 4, y - 4, 8, 2); }
    }
    if (this.roomId === 'k:1,1') {   // Ciclo 44 (rifinitura): le case di Fondogrotta hanno porte e finestre accese (prima erano blocchi muti)
      const lit = (this.t >> 5) % 7 ? '#ffd070' : '#ffe8a0';
      for (const [x0, yFace, up] of [[2, 2, false], [10, 2, false], [2, 8, true], [10, 8, true]]) {
        const X = x0 * TS, Y = yFace * TS;
        const dy = up ? 1 : 6;   // la faccia verso la strada
        c.fillStyle = '#1a1420'; c.fillRect(X + 26, Y + dy - 1, 12, 11); c.fillStyle = '#6a4a2a'; c.fillRect(X + 27, Y + dy, 10, 10); c.fillStyle = '#8a6a3a'; c.fillRect(X + 31, Y + dy, 1, 10); c.fillStyle = '#e8c050'; c.fillRect(X + 34, Y + dy + 5, 1, 1);
        for (const wx of [6, 48]) { c.fillStyle = '#1a1420'; c.fillRect(X + wx - 1, Y + dy + 1, 9, 7); c.fillStyle = lit; c.fillRect(X + wx, Y + dy + 2, 7, 5); c.fillStyle = '#6a4a2a'; c.fillRect(X + wx + 3, Y + dy + 2, 1, 5); }
      }
    }
    if (this.roomId === 'k:1,2') {   // le pietre nella porta
      const n = this.s.flags.rootsDoor ? 3 : 0;
      for (let i = 0; i < 3; i++) {
        const x = 8 * TS + (i - 1) * 24, y = 6 * TS + (i === 1 ? -3 : 6);
        c.fillStyle = '#2a1a14'; c.fillRect(x - 3, y - 3, 7, 7);
        if (i < n) { c.fillStyle = (this.t >> 4) % 3 === i ? '#ff6a7a' : '#c83a4a'; c.fillRect(x - 2, y - 2, 5, 5); }
      }
    }
  };

  /* ---------- diario (Capitolo VI), obiettivi, Segnavia ---------- */
  window.CHAPTERS6 = [
    { name: 'Capitolo V: completato', done: () => true },
    { name: 'La terra trema', done: g => !!g.s.flags.ch6Call },
    { name: 'Fondogrotta', done: g => !!g.s.flags.brunaHello },
    { name: 'Le Pietre del Battito', done: g => stoneCount(g) === 3 },
    { name: 'La Sala delle Radici', done: g => !!g.s.flags.rootsDoor },
  ];
  if (window.CHAPTERS5) {
    const dpt = G.drawPauseText;
    G.drawPauseText = function () {
      if (!this.s.flags.ch6Call || this.pausePage !== 1) return dpt.apply(this, arguments);
      const keep = CHAPTERS5.splice(0, CHAPTERS5.length, ...CHAPTERS6.slice(0, 9));
      try { return dpt.apply(this, arguments); } finally { CHAPTERS5.splice(0, CHAPTERS5.length, ...keep); }
    };
  }
  const goal6 = g => {
    const f = g.s.flags;
    if (!f.ch6Call) return null;
    if (!f.earthIn) return 'k:1,0';
    if (!f.brunaHello) return 'k:1,1';
    const miss = EARTH_STONES.find(s => !f['chest:' + s.id]);
    if (miss) return miss.room;
    return ROOMS[HEART_ROOM] || !f.rootsDoor ? 'k:1,2' : null;
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const f = g.s.flags;
    if (f.ch5Done && !f.ch6Call) return 'Il cielo e il mare hanno fatto pace. Torna a Brinavalle: la terra, sotto la valle, trema...';
    if (!f.ch6Call) return co(g);
    if (!f.earthIn) return 'Scendi nella fenditura che si è aperta nella piazza di Brinavalle.';
    if (!f.brunaHello) return 'Sotto la valle c\'è un villaggio: Fondogrotta. Parla con Bruna.';
    const n = stoneCount(g);
    if (n < 3) return 'Ritrova le tre Pietre del Battito (' + n + '/3): Miniera, Fiume, Galleria delle Talpe.';
    if (!f.rootsDoor) return 'Porta le tre pietre alla Sala delle Radici, a sud di Fondogrotta.';
    return ROOMS[HEART_ROOM] ? 'La porta delle Radici è aperta: scendi verso il Cuore della Terra.' : 'La porta delle Radici si è aperta... (il prossimo capitolo comincia laggiù)';
  };
  window.currentObjective = currentObjective;
  const or0 = objectiveRoom, oc0 = objectiveChest;
  objectiveRoom = function (g) { const f = g.s.flags; if (f.ch5Done && !f.ch6Call) return 'o:1,2'; if (!f.ch6Call) return or0(g); return goal6(g); };
  window.objectiveRoom = objectiveRoom;
  objectiveChest = function (g) { return g.s.flags.ch6Call && EARTH_STONES.some(s => s.room === g.roomId && !g.s.flags['chest:' + s.id]) ? 'heartstone' : oc0(g); };

  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'battito', name: 'Il battito della terra', desc: 'Rimetti in ritmo il cuore della terra.', icon: 'heartstone', tier: 1, got: g => !!g.s.flags.rootsDoor });
})();
