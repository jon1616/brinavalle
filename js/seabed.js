'use strict';
/* =====================================================================
 *  SEABED — Ciclo 36 (Agente B, seconda manche): CAPITOLO V, «LA CITTÀ SOMMERSA».
 *  Il Capitolo IV finiva così: «laggiù, nel fondo che non ha fondo, qualcosa
 *  ha aperto un occhio...», e nonna Lina: «il mare non dimentica mai uno sgarbo».
 *  · Il giorno dopo, a Porto Corallo, il MARE SI È RITIRATO: dove c'erano le
 *    Secche ora c'è sabbia bagnata fino all'orizzonte, e laggiù, torri.
 *    È CORALIA, la città da cui discendono gli abitanti di Porto Corallo, che
 *    il mare inghiottì secoli fa.
 *  · MAREVA, una tartaruga di seicento anni, ricorda: Coralia aveva un patto
 *    col mare. Ogni luna piena la città suonava il CANTO DELLA MAREA con tre
 *    CONCHIGLIE, e il mare era gentile. Arrivata la luce di Vesper, la gente
 *    smise di cantare: lo sgarbo. Il mare si prese la città.
 *    Ora il mare (la MADRE DELLE ACQUE, l'occhio nell'abisso) è offeso di
 *    nuovo: Umbra era il suo cane da guardia, e Vespero gli è stata tolta.
 *    Si ritira per raccogliere le forze e lanciare L'ONDA GRANDE sulla costa.
 *    Solo il Canto, suonato nel TEMPIO DELLE MAREE, può fare pace.
 *  · Nuova regione «s:» (il FONDALE), 6 luoghi:
 *      s:1,0 Fondale Scoperto      (scala di scogli dalle Secche)
 *      s:1,1 Coralia               (la piazza sommersa; Mareva)
 *      s:0,1 Relitto della Sirena  (Guscetto, il figlio di Mareva, intrappolato)
 *      s:2,1 Campo delle Onde      (una conchiglia; ONDE LUNGHE fortissime)
 *      s:2,2 Torre Inclinata       (una conchiglia dietro una crepa: bombe)
 *      s:1,2 Tempio delle Maree    (il portone: le tre conchiglie lo aprono)
 *  · MECCANICA NUOVA, LE ONDE LUNGHE: dal mare aperto (sud) arriva ogni tanto
 *    un'onda che attraversa la stanza. Chi non ha uno scoglio (o un muro) subito
 *    a SUD, a fargli da riparo, viene colpito e spinto indietro. Un brontolio e
 *    la schiuma sul bordo la annunciano.
 *  · Il portone del Tempio porta al prossimo capitolo: prefisso w:, 'w:1,2'.
 *  Flag: ch5Call, seaIn, marevaHello, babyFound, conchMareva,
 *        chest:s_conch_onde / s_conch_torre, templeOpen.
 * ===================================================================== */
const TEMPLE_ROOM = 'w:1,2';
const WAVE_WARN = 100;   // frame di preavviso
const conchCount = g => (g.s.flags['chest:s_conch_onde'] ? 1 : 0) + (g.s.flags['chest:s_conch_torre'] ? 1 : 0) + (g.s.flags.conchMareva ? 1 : 0);

ITEMS.conch = { name: 'Conchiglia del Canto', text: () => 'Hai trovato una CONCHIGLIA DEL CANTO! Se la avvicini all\'orecchio senti il mare... e, sotto, una melodia antica. (' + conchCount(Game) + '/3)' };

/* ------------------------------ arte ------------------------------ */
(function seabedArt() {
  const mk = (rows, pal) => spriteFromRows(rows, Object.assign({ o: '#1a1420' }, pal));
  ICON.conch = mk(['....oo.', '..oowwo', '.owwppo', 'owwpwpo', 'owpwwo.', '.owwo..', '..oo...'], { w: '#f8e8d8', p: '#f0a0b0' });
  Ground.seabed = (P, r) => {
    P.r(0, 0, 16, 16, '#b8a888');
    for (let i = 0; i < 14; i++) P.p(r() * 16, r() * 16, '#a89878');
    for (let i = 0; i < 4; i++) P.p(r() * 16, r() * 16, '#d0c4a8');
    if (r() < 0.3) { const x = 2 + (r() * 10 | 0), y = 3 + (r() * 9 | 0); P.r(x, y, 3, 2, '#7a9ab0'); P.p(x + 1, y, '#a8c8e0'); }   // una pozza d'acqua
  };
  const dot = TilePaint['.'], tuft = TilePaint[','], tree = TilePaint['T'];
  TilePaint['.'] = (P, r, e) => e && e.ground === 'seabed' ? Ground.seabed(P, r) : dot(P, r, e);
  TilePaint[','] = (P, r, e) => {   // alghe arenate
    if (!e || e.ground !== 'seabed') return tuft(P, r, e);
    Ground.seabed(P, r);
    for (let k = 0; k < 3; k++) { const x = 2 + (r() * 11 | 0); for (let y = 6; y < 15; y++) P.p(x + Math.round(Math.sin(y * 0.8 + k) * 1), y, y < 9 ? '#5a8a4a' : '#3a6a3a'); }
  };
  TilePaint['T'] = (P, r, e) => {   // sul fondale: corallo
    if (!e || e.ground !== 'seabed') return tree(P, r, e);
    Ground.seabed(P, r);
    const col = ['#e86a5a', '#f09a4a', '#d85a9a'][e.v % 3], dk = ['#a83a3a', '#b86a2a', '#983a6a'][e.v % 3];
    P.r(6, 10, 4, 6, dk);
    const branch = (x, y, dx, n) => { for (let i = 0; i < n; i++) { P.r(x + dx * i, y - i * 2, 2, 3, i === n - 1 ? col : dk); P.p(x + dx * i, y - i * 2, col); } };
    branch(7, 10, 0, 5); branch(5, 9, -1, 3); branch(10, 9, 1, 3); branch(4, 6, -1, 2); branch(11, 6, 1, 2);
    P.p(7, 1, '#ffffff'); P.p(3, 3, '#ffe0e0');
  };
  TilePaint['g'] = (P) => {   // fasciame del relitto
    P.r(0, 0, 16, 16, '#3a2414');
    for (let y = 0; y < 16; y += 4) { P.r(0, y, 16, 3, '#5a3a22'); P.r(0, y, 16, 1, '#7a5232'); }
    P.p(3, 2, '#2a1a0a'); P.p(12, 6, '#2a1a0a'); P.p(7, 10, '#2a1a0a');
    P.r(0, 14, 16, 2, '#4a6a5a');   // alghe sul fondo dello scafo
  };
  TILE_SOLID.add('g');
  // la tartaruga Mareva e il piccolo Guscetto (NPC: stesse immagini in tutte le direzioni)
  const turtle = (big) => {
    const cv = makeCanvas(16, 16), c = cv.getContext('2d'), R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    if (big) {
      R(1, 6, 14, 8, '#1a1420'); R(2, 7, 12, 6, '#4a7a4a'); R(3, 7, 10, 2, '#6a9a5a');
      for (const [x, y] of [[4, 9], [8, 9], [6, 11], [10, 11]]) R(x, y, 2, 2, '#3a5a3a');
      R(12, 4, 4, 5, '#1a1420'); R(13, 5, 2, 3, '#8aa86a'); R(14, 5, 1, 1, '#1a1420');
      R(2, 13, 3, 3, '#1a1420'); R(11, 13, 3, 3, '#1a1420'); R(3, 13, 1, 2, '#8aa86a'); R(12, 13, 1, 2, '#8aa86a');
      R(5, 5, 2, 2, '#f0e8d0');   // una conchiglia sul guscio
    } else {
      R(4, 9, 8, 5, '#1a1420'); R(5, 10, 6, 3, '#6aaa5a'); R(6, 10, 4, 1, '#8aca6a');
      R(11, 8, 3, 3, '#1a1420'); R(12, 9, 1, 1, '#aacc8a'); R(5, 13, 2, 2, '#1a1420'); R(9, 13, 2, 2, '#1a1420');
    }
    return cv;
  };
  for (const [k, big] of [['mareva', true], ['guscetto', false]]) { const im = turtle(big), set = [im, im, im, im]; SPR.people[k] = { down: set, up: set, left: set, right: set }; }
})();

/* --------------------------------- le stanze --------------------------------- */
const WAVES_SOFT = { period: 840, speed: 1.6 }, WAVES_STRONG = { period: 560, speed: 2.2 };
Object.assign(ROOMS, {
  's:1,0': {
    name: 'Fondale Scoperto', ground: 'seabed', music: 'overworld',
    tiles: [
      'TTTTTTTUTTTTTTTT',
      'T,.....:.....,.T',
      'T..T...:...T...T',
      'T......:.......T',
      'T.r....:....r..T',
      'T......:.......T',
      'T..,...:..,....T',
      'T.T....:....T..T',
      'T....r.:.r.....T',
      'T,.....:......,T',
      'TTTTTTT..TTTTTTT',
    ],
    warps: { '7,0': { to: 'm:1,2', x: 7, y: 8, dir: 1 } },
    waves: WAVES_SOFT,
    enemies: [{ type: 'crab', x: 11, y: 6 }],
    onEnter: g => {
      if (g.s.flags.seaIn) return;
      g.s.flags.seaIn = true;
      g.say([
        'Scendi dagli scogli sul fondo del mare. Il fondo del mare! Sabbia bagnata, alghe, pesci che boccheggiano nelle pozze...',
        'Da sud arriva un brontolio. Ogni tanto il mare lontano rimanda un\'ONDA LUNGA che corre sulla sabbia: quando senti il brontolio, mettiti al riparo dietro uno scoglio.',
      ]);
    },
  },
  's:1,1': {
    name: 'Coralia', ground: 'seabed', music: 'temple',
    tiles: [
      'NNNNNNN..NNNNNNN',
      'N.....,..,.....N',
      'N.A..........A.N',
      'N....NN..NN....N',
      'N....N....N....N',
      '.....N....N.....',
      'N....NN..NN....N',
      'N.A..........A.N',
      'N.....,..,.....N',
      'N..............N',
      'NNNNNNN..NNNNNNN',
    ],
    npcs: [
      { id: 'mareva', sprite: 'mareva', x: 7, y: 4, static: true, talk: g => marevaTalk(g) },
      { id: 'guscetto_casa', sprite: 'guscetto', x: 9, y: 5, static: true, cond: g => !!g.s.flags.babyFound, talk: () => ['Guscetto si stringe alla mamma e ti guarda con occhietti lucidi. Poi, piano piano, ti fa un inchino col guscio.'] },
    ],
    signs: { '2,2': ['Una statua corrosa dal sale: una donna che suona una conchiglia. Sul basamento: «AL MARE, IL CANTO. ALLA CITTÀ, LA PACE».'], '13,2': ['Una statua senza testa. Le alghe le fanno da capelli.'] },
    onEnter: g => {
      if (g.s.flags.coraliaSeen) return;
      g.s.flags.coraliaSeen = true;
      g.say(['Mura coperte di conchiglie, statue mangiate dal sale, una piazza invasa dalle alghe: CORALIA, la città che il mare si è preso.', 'Al centro della piazza, immobile come uno scoglio, qualcosa respira lento. È... una tartaruga. Enorme.']);
    },
  },
  's:0,1': {
    name: 'Relitto della Sirena', ground: 'seabed', music: 'cave',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T,.............T',
      'T..ggggggggg...T',
      'T..gwwwwwwgg...T',
      'T..gwwwwwVwg...T',
      'T..gwwwwwwgg....',
      'T..ggggwgggg...T',
      'T......:.......T',
      'T.T....:...T...T',
      'T,.....:......,T',
      'TTTTTTTTTTTTTTTT',
    ],
    npcs: [{ id: 'guscetto', sprite: 'guscetto', x: 10, y: 4, static: true, cond: g => !g.s.flags.babyFound, talk: g => [
      'Una tartarughina piange nell\'angolo dello scafo. Quando ti vede, smette di colpo.',
      '???: Sei... venuto a prendermi? Io sono Guscetto. La mamma mi aspetta a Coralia, ma l\'onda mi ha portato qui e le alghe mi hanno chiuso dentro...',
      'Guscetto: Grazie! Grazie! Corro dalla mamma. Cioè... vado piano dalla mamma, io non so correre.',
      g2 => { g2.s.flags.babyFound = true; g2.entities = g2.entities.filter(e => !(e.def && e.def.id === 'guscetto')); g2.saveGame(); Sound.sfx('fairy'); },
    ] }],
    enemies: [{ type: 'crab', x: 5, y: 8 }, { type: 'crab', x: 12, y: 7 }],
    signs: { '3,6': ['Sul fasciame, lettere sbiadite: «SIRENA — Porto Corallo». Una barca dei pescatori, persa chissà quando.'] },
  },
  's:2,1': {
    name: 'Campo delle Onde', ground: 'seabed', music: 'overworld',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T..............T',
      'T..r....r...r..T',
      'T.....r....r...T',
      'T..r.......r...T',
      '.....r...r.....T',
      'T.r.....r....r.T',
      'T....r.....r...T',
      'T..r....r......T',
      'T......r...r...T',
      'TTTTTTT..TTTTTTT',
    ],
    waves: WAVES_STRONG,
    chests: [{ id: 's_conch_onde', x: 7, y: 1, item: 'conch' }],
    enemies: [{ type: 'crab', x: 10, y: 3 }],
  },
  's:2,2': {
    name: 'Torre Inclinata', ground: 'seabed', music: 'cave',
    tiles: [
      'TTTTTTT..TTTTTTT',
      'T......,.......T',
      'T.NNNNN....r...T',
      'T.N...N........T',
      'T.N...N...r....T',
      'T.NNQNN........T',
      'T.......r....,.T',
      'T..r.......r...T',
      'T.....,........T',
      'T..............T',
      'TTTTTTTTTTTTTTTT',
    ],
    waves: WAVES_SOFT,
    chests: [{ id: 's_conch_torre', x: 4, y: 3, item: 'conch' }],
    enemies: [{ type: 'crab', x: 11, y: 8 }, { type: 'skeleton', x: 12, y: 4 }],
    signs: { '2,6': ['La torre di guardia di Coralia, piegata dal mare come un fuscello. La porta è crollata: resta una parete incrinata.'] },
  },
  's:1,2': {
    name: 'Tempio delle Maree', ground: 'seabed', music: 'temple',
    tiles: [
      'NNNNNNN..NNNNNNN',
      'N..............N',
      'N..A........A..N',
      'N..............N',
      'N......::......N',
      'N..NNNN::NNNN..N',
      'N..NNNNJJNNNN..N',
      'N..NNNNNNNNNN..N',
      'N..NNNNNNNNNN..N',
      'N..............N',
      'NNNNNNNNNNNNNNNN',
    ],
    signs: { '7,6': g => templeDoor(g), '8,6': g => templeDoor(g), '3,2': ['Sul basamento: «TRE VOCI DAL MARE: LA CONCHIGLIA DELL\'ONDA, LA CONCHIGLIA DELLA TORRE, LA CONCHIGLIA DEL CUSTODE».'] },
    onEnter: g => {
      if (g.s.flags.templeSeen) return;
      g.s.flags.templeSeen = true;
      g.say(['Il TEMPIO DELLE MAREE. Sul portone, tre incavi a forma di conchiglia. Dall\'interno viene un rumore lontano... come il respiro di qualcosa di immenso.']);
    },
  },
});

/* ------------------------------ dialoghi ------------------------------ */
function marevaTalk(g) {
  const f = g.s.flags;
  if (f.templeOpen) return ['Mareva: Il portone è aperto. Dentro c\'è lei, la Madre delle Acque. Non portarle la spada, ragazzo: portale il Canto.'];
  if (!f.marevaHello) return [
    'Mareva: ...Un bambino della terra. Non ne vedevo da trecento anni. Sono Mareva. Ero già vecchia quando Coralia era viva.',
    'Mareva: Coralia aveva un patto col mare. Ogni luna piena, nel Tempio delle Maree, la città suonava il CANTO DELLA MAREA con tre conchiglie. E il mare era gentile.',
    'Mareva: Poi arrivò la luce di Vesper. La gente non aveva più paura del buio, né bisogno del mare. Smise di cantare. Questo fu lo sgarbo.',
    'Mareva: Una notte il mare si prese la città. I pochi che si salvarono fondarono Porto Corallo, più in alto, e dimenticarono tutto.',
    'Mareva: Ora la MADRE DELLE ACQUE si è svegliata. Umbra era il suo cane da guardia, e la stella era nel suo fondo: tu le hai tolto entrambi.',
    'Mareva: Si ritira per raccogliere le forze. Quando tornerà, sarà L\'ONDA GRANDE: Porto Corallo, la costa, forse la tua valle.',
    'Mareva: Solo il Canto può fare pace. Servono le tre CONCHIGLIE DEL CANTO: una nel CAMPO DELLE ONDE, a est; una nella TORRE INCLINATA, a sud-est. La terza... la custodisco io.',
    'Mareva: Ma prima... ti prego. Il mio piccolo, Guscetto, è stato trascinato via dall\'ultima onda. Verso il RELITTO, a ovest. Riportamelo, e la conchiglia è tua.',
    g2 => { g2.s.flags.marevaHello = true; g2.saveGame(); },
  ];
  if (f.babyFound && !f.conchMareva) return [
    'Mareva: Guscetto! Il mio guscetto... Grazie, bambino della terra. Una madre non dimentica.',
    'Mareva: Questa conchiglia l\'ho tenuta sotto il guscio per trecento anni. È la CONCHIGLIA DEL CUSTODE: la più antica delle tre.',
    g2 => { g2.s.flags.conchMareva = true; Sound.sfx('chest'); },
    ...g.giveItem('conch'),
  ];
  const n = conchCount(g);
  if (n === 3) return ['Mareva: Hai le tre voci. Va\' al TEMPIO DELLE MAREE, a sud, e mettile nel portone. E quando sarai davanti a lei... canta, non combattere.'];
  return ['Mareva: ' + (f.babyFound ? '' : 'Guscetto è al Relitto, a ovest. ') + 'Le conchiglie: ' + n + ' su 3. Quando senti il mare brontolare, ripàrati dietro uno scoglio: le onde lunghe non perdonano.'];
}
function templeDoor(g) {
  const f = g.s.flags, n = conchCount(g);
  if (f.templeOpen) return ROOMS[TEMPLE_ROOM] ? ['Il portone è aperto. Dall\'interno sale un respiro lento e salato.'] : ['Il portone è aperto, e dall\'interno sale un respiro lento e salato... Il prossimo capitolo comincia qui.'];
  if (n < 3) return ['Tre incavi a forma di conchiglia. ' + (n ? 'Ne riempi ' + n + ', ma senza tutte e tre il portone non si muove. (' + n + '/3)' : 'Servono le tre Conchiglie del Canto.')];
  return [
    'Posi le tre conchiglie negli incavi. Per un attimo non succede niente.',
    'Poi il vento entra nelle conchiglie e le fa SUONARE: tre note lunghe e basse, che si intrecciano in una melodia antica. Il Canto della Marea.',
    g2 => { g2.s.flags.templeOpen = true; g2.shake = 14; Sound.sfx('secret'); Sound.sfx('victory'); g2.saveGame(); if (ROOMS[TEMPLE_ROOM]) g2.loadRoom(g2.roomId); },
    'Lontano, verso sud, il mare smette di brontolare. E il portone del Tempio delle Maree si apre, lentamente, come una conchiglia.',
    ...g.giveItem('gems', 50),
  ];
}

/* ---------------------------------- logica ---------------------------------- */
(function installSeabed() {
  const G = Game;

  /* ---------- l'inizio del Capitolo V: il mare si è ritirato ---------- */
  const cap = ROOMS['i:capitaneria'].npcs.find(n => n.id === 'marisa');
  if (cap) {
    const mt = cap.talk;
    cap.talk = function (g) {
      const f = g.s.flags;
      if (f.ch4Done && !f.ch5Call) return [
        'Marisa: Lio! Sei qui! Stamattina ci siamo svegliati e... il mare non c\'era più.',
        'Marisa: Si è ritirato oltre le Secche, fin dove arriva lo sguardo. Le barche sono rimaste in secco come pesci spiaggiati.',
        'Marisa: E laggiù, sul fondo scoperto, ci sono delle TORRI. Mura, statue... Nonna Lina dice che è CORALIA, la città dei nostri antenati, quella che il mare si prese.',
        'Marisa: Lina dice anche un\'altra cosa: che quando il mare si ritira così, è perché prende la rincorsa. Ho paura, Lio.',
        'Marisa: Dalle Secche ora si scende sul fondale: c\'è una scala di scogli che prima era sott\'acqua. Va\' a vedere. Ma torna, mi raccomando.',
        g2 => { g2.s.flags.ch5Call = true; g2.saveGame(); },
      ];
      if (f.templeOpen && !f.marisaTemple) { f.marisaTemple = true; return ['Marisa: Il mare ha smesso di brontolare! Da quando hai suonato quelle conchiglie, la notte è silenziosa. Che cosa hai fatto, laggiù?']; }
      return mt.call(this, g);
    };
  }
  const lina = ROOMS['i:osteria'].npcs.find(n => n.id === 'lina');
  if (lina) {
    const lt = lina.talk;
    lina.talk = function (g) {
      const f = g.s.flags;
      if (f.ch5Call && !f.linaCoralia) { f.linaCoralia = true; return ['Lina: Coralia... mia nonna me ne parlava. Diceva che, tanto tempo fa, i nostri antenati suonavano le conchiglie al mare, ogni luna piena. Poi smisero. Il mare non dimentica uno sgarbo, te l\'avevo detto.']; }
      return lt.call(this, g);
    };
  }
  /* il mare non c'è più: le Secche restano a secco, e una scala di scogli scende sul fondale */
  const tl = G.tideLow;
  G.tideLow = function () { return (this.s.flags.ch5Call && this.roomId && this.roomId.startsWith('m:')) || tl.call(this); };
  const tw = G.tideWarn;
  G.tideWarn = function () { return !(this.s.flags.ch5Call && this.roomId && this.roomId.startsWith('m:')) && tw.call(this); };
  const secche = ROOMS['m:1,2'];
  secche.dyn = (secche.dyn || []).concat([{ x: 7, y: 9, ch: 'U', cond: g => !!g.s.flags.ch5Call }]);
  secche.warps = Object.assign({}, secche.warps, { '7,9': { to: 's:1,0', x: 7, y: 1, dir: 0 } });

  /* ---------- il portone del Tempio ---------- */
  const tem = ROOMS['s:1,2'];
  tem.dyn = [{ x: 7, y: 6, ch: 'Z', cond: g => !!g.s.flags.templeOpen && !!ROOMS[TEMPLE_ROOM] }, { x: 8, y: 6, ch: 'P', cond: g => !!g.s.flags.templeOpen && !!ROOMS[TEMPLE_ROOM] }];
  Object.defineProperty(tem, 'warps', { get: () => ROOMS[TEMPLE_ROOM] ? { '7,6': { to: TEMPLE_ROOM, x: 7, y: 8, dir: 1 } } : {}, configurable: true });

  /* ---------- le onde lunghe ---------- */
  G.waveT = 0;
  // fase dell'onda nella stanza: null (calma), 'warn' (brontolio) o la y del fronte (che sale da sud a nord)
  G.waveFront = function () {
    const W = this.room && this.room.waves; if (!W) return null;
    const travel = Math.ceil((PLAY_H + 40) / W.speed), k = this.waveT % W.period, start = W.period - travel;
    if (k >= start) return PLAY_H + 20 - (k - start) * W.speed;
    if (k >= start - WAVE_WARN) return 'warn';
    return null;
  };
  /* al riparo: uno scoglio, un muro o un corallo subito a sud di Lio (tra lui e il mare) */
  G.waveShelter = function () {
    const p = this.player, tx = Math.floor(p.cx() / TS), ty = Math.floor((p.y + 12) / TS);
    const below = this.tiles[ty + 1] && this.tiles[ty + 1][tx];
    return !!below && TILE_SOLID.has(below) && below !== '~';
  };
  const loadRoom = G.loadRoom;
  G.loadRoom = function () { const r = loadRoom.apply(this, arguments); this.waveT = 0; this.waveHit = -1; return r; };   // entrando, il mare ti lascia un po' di respiro
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state !== 'play' || !this.room || !this.room.waves || this.dialog) return;
    this.waveT++;
    const fr = this.waveFront(), W = this.room.waves, id = Math.floor(this.waveT / W.period);
    if (fr === 'warn' && this.waveT % W.period === W.period - Math.ceil((PLAY_H + 40) / W.speed) - WAVE_WARN + 1) { Sound.sfx('roots'); if (!this.s.flags.waveTip) { this.s.flags.waveTip = true; this.banner = { text: 'Arriva un\'onda! Riparati dietro uno scoglio!', t: 120 }; } }
    if (typeof fr !== 'number' || !this.player) return;
    const p = this.player;
    if (this.waveHit !== id && Math.abs(fr - (p.y + 12)) < W.speed + 2) {
      this.waveHit = id;
      if (!this.waveShelter() && !p.fallT) { p.hurtT = 0; p.hurt(this, 1, p.cx(), p.cy() + 24); Sound.sfx('splash'); }
    }
  };
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!this.room || !this.room.waves) return;
    const fr = this.waveFront(), t = this.t;
    if (fr === 'warn') {   // schiuma sul bordo sud: sta arrivando
      c.fillStyle = 'rgba(255,255,255,' + (0.4 + Math.sin(t * 0.4) * 0.3) + ')';
      for (let x = 0; x < PLAY_W; x += 6) c.fillRect(x + ((t >> 1) % 6), PLAY_H - 4 + Math.round(Math.sin(x * 0.3 + t * 0.2) * 2), 4, 2);
    } else if (typeof fr === 'number') {
      const y = Math.round(fr);
      c.fillStyle = 'rgba(90,150,200,0.55)'; c.fillRect(0, y, PLAY_W, 18);
      c.fillStyle = 'rgba(120,180,230,0.25)'; c.fillRect(0, y + 18, PLAY_W, 26);
      c.fillStyle = '#ffffff';
      for (let x = 0; x < PLAY_W; x += 3) c.fillRect(x, y + Math.round(Math.sin(x * 0.25 + t * 0.3) * 2), 3, 2);
    }
    if (this.roomId === 's:1,2') {   // le conchiglie nel portone
      const f = this.s.flags, n = f.templeOpen ? 3 : 0;
      for (let i = 0; i < 3; i++) {
        const x = 8 * TS + (i - 1) * 24, y = 6 * TS + (i === 1 ? -3 : 6);
        c.fillStyle = '#2a2a3a'; c.fillRect(x - 3, y - 3, 7, 7);
        if (i < n) { c.fillStyle = '#f8e8d8'; c.fillRect(x - 2, y - 2, 5, 5); c.fillStyle = '#f0a0b0'; c.fillRect(x - 1, y - 1, 2, 2); }
      }
    }
  };

  /* ---------- diario (Capitolo V), obiettivi, Segnavia, mappa ---------- */
  window.CHAPTERS5 = [
    { name: 'Capitolo IV: completato', done: () => true },
    { name: 'Il mare si ritira', done: g => !!g.s.flags.ch5Call },
    { name: 'Coralia', done: g => !!g.s.flags.marevaHello },
    { name: 'Guscetto', done: g => !!g.s.flags.babyFound },
    { name: 'Le Conchiglie del Canto', done: g => conchCount(g) === 3 },
    { name: 'Il Tempio delle Maree', done: g => !!g.s.flags.templeOpen },
  ];
  if (window.CHAPTERS4) {
    const dpt = G.drawPauseText;
    G.drawPauseText = function () {
      if (!this.s.flags.ch5Call || this.pausePage !== 1) return dpt.apply(this, arguments);
      const keep = CHAPTERS4.splice(0, CHAPTERS4.length, ...CHAPTERS5.slice(0, 9));
      try { return dpt.apply(this, arguments); } finally { CHAPTERS4.splice(0, CHAPTERS4.length, ...keep); }
    };
  }
  const goal5 = g => {
    const f = g.s.flags;
    if (!f.ch5Call) return null;
    if (!f.seaIn) return 's:1,0';
    if (!f.marevaHello) return 's:1,1';
    if (!f.babyFound) return 's:0,1';
    if (!f.conchMareva) return 's:1,1';
    if (!f['chest:s_conch_onde']) return 's:2,1';
    if (!f['chest:s_conch_torre']) return 's:2,2';
    return ROOMS[TEMPLE_ROOM] || !f.templeOpen ? 's:1,2' : null;
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const f = g.s.flags;
    if (f.ch4Done && !f.ch5Call) return 'Il mare ha un conto in sospeso. Torna a Porto Corallo: Marisa ti cerca in capitaneria.';
    if (!f.ch5Call) return co(g);
    if (!f.seaIn) return 'Il mare si è ritirato! Dalle Secche di Corallo una scala di scogli scende sul fondale.';
    if (!f.marevaHello) return 'Raggiungi le rovine di Coralia, sul fondale. Qualcuno, nella piazza, respira piano.';
    if (!f.babyFound) return 'Ritrova Guscetto, il piccolo di Mareva, al Relitto della Sirena, a ovest di Coralia.';
    if (!f.conchMareva) return 'Guscetto è salvo! Torna da Mareva, a Coralia.';
    const n = conchCount(g);
    if (n < 3) return 'Ritrova le Conchiglie del Canto (' + n + '/3): Campo delle Onde (a est) e Torre Inclinata (a sud-est). Attento alle onde lunghe!';
    if (!f.templeOpen) return 'Hai le tre conchiglie! Portale al Tempio delle Maree, a sud di Coralia.';
    return ROOMS[TEMPLE_ROOM] ? 'Il Tempio delle Maree è aperto. Entra, e porta alla Madre delle Acque il Canto (non la spada).' : 'Il Tempio delle Maree si è aperto... (il prossimo capitolo comincia lì)';
  };
  window.currentObjective = currentObjective;
  const or0 = objectiveRoom, oc0 = objectiveChest;
  objectiveRoom = function (g) { const f = g.s.flags; if (f.ch4Done && !f.ch5Call) return 'i:capitaneria'; if (!f.ch5Call) return or0(g); return goal5(g); };
  window.objectiveRoom = objectiveRoom;
  objectiveChest = function (g) { return g.s.flags.ch5Call && (g.roomId === 's:2,1' || g.roomId === 's:2,2') ? 'conch' : oc0(g); };

  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'canto', name: 'Il Canto della Marea', desc: 'Apri il Tempio con le tre conchiglie.', icon: 'conch', tier: 1, got: g => !!g.s.flags.templeOpen });
})();
