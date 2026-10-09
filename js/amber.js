'use strict';
/* =====================================================================
 *  AMBER — Ciclo 32 (Agente B, seconda manche):
 *  · FINE DEL CAPITOLO II: quando il padre ritrova il suo ricordo (Ciclo 31),
 *    un cartello «Capitolo II — completato» chiude la Nebbia Grigia.
 *  · CAPITOLO III, «IL CANTO DI VESPER». Elva ha chiesto di dire a Vesper
 *    «che ha ascoltato». Teodoro racconta: il Cuore, nel giardino, ha
 *    cantato una nota sola. Vesper, il primo custode della valle, salì
 *    sull'Altopiano d'Ambra, dove la stella della sera (Vespero) è più
 *    vicina, e versò la sua voce nel Cuore per farne luce. Il suo
 *    OSSERVATORIO è ancora lassù, chiuso da secoli.
 *  · Nuova regione «a:» (le DUNE D'AMBRA), oltre una gola a est dei Campi:
 *      a:0,1 Gola del Vento          (l'ingresso, tra le rocce)
 *      a:1,1 Carovana delle Dune     (Nadira, Sesto, Lu; due tende)
 *      a:2,1 Mare di Dune            (una stella caduta: si vede SOLO DI NOTTE)
 *      a:1,0 Rovine del Sole         (una lente dietro una crepa: bombe)
 *      a:2,0 Oasi del Miraggio       (l'oasi è vera SOLO A MEZZOGIORNO)
 *      a:1,2 Altopiano di Vesper     (l'Osservatorio; la vecchia Orsa)
 *    Le tre LENTI DELL'OSSERVATORIO vanno messe nel portone; al TRAMONTO la
 *    stella della sera ci brilla attraverso e il portone si apre (il dungeon
 *    dell'Osservatorio, prefisso v:, è il prossimo capitolo: 'v:1,2').
 *    Nella tenda di Nadira si può RIPOSARE fino all'ora che serve.
 *  · Nuovo nemico: lo SCORPIONE D'AMBRA (carica in linea retta; sbatte e resta stordito).
 *  Flag: ch2Done, ch3Call, amberIn, chest:a_lens_rovine / a_lens_oasi /
 *        a_lens_stella, lensesSet, observatoryOpen.
 * ===================================================================== */
const AMBER_LENSES = [
  { id: 'a_lens_rovine', room: 'a:1,0', where: 'le Rovine del Sole' },
  { id: 'a_lens_oasi', room: 'a:2,0', where: "l'Oasi del Miraggio" },
  { id: 'a_lens_stella', room: 'a:2,1', where: 'il Mare di Dune' },
];
const lensCount = g => AMBER_LENSES.filter(l => g.s.flags['chest:' + l.id]).length;
const VESPER_ROOM = 'v:1,2';   // la prima sala dell'Osservatorio (la costruisce il prossimo capitolo)
/* le ore del deserto (dopo la vittoria il giorno scorre: Sky.phase 0..1) */
const isNoon = g => { const p = Sky.phase(g); return p >= 0.16 && p < 0.38; };
const isNightA = g => Sky.night(Sky.phase(g)) > 0.5;
const isDusk = g => { const p = Sky.phase(g); return p >= 0.47 && p < 0.6; };
const REST_AT = [['Al mattino', 0.05], ['A mezzogiorno', 0.26], ['Al tramonto', 0.5], ['A notte fonda', 0.74]];

ITEMS.lens = { name: "Lente dell'Osservatorio", text: () => "Hai trovato una LENTE DELL'OSSERVATORIO! Il vetro è caldo, e dentro brilla un puntino, come una stella lontana. (" + lensCount(Game) + '/3)' };
PEOPLE.nadira = { h: '#2a1a12', s: '#c88a5a', x: '#e8c070', c: '#c0503a', d: '#8a3a2a', p: '#5a3a2a', b: '#2a1a10' };
PEOPLE.sesto = { h: '#6a4a2a', s: '#e0b088', x: '#5a8ab0', c: '#d8c8a0', d: '#a89870', p: '#4a3a2a', b: '#2a1a10', beard: true };
PEOPLE.orsa = { h: '#f0f0f8', s: '#d8a880', x: '#3a3a7a', c: '#2a2a5a', d: '#1a1a40', p: '#2a2a3a', b: '#1a1020' };
for (const k of ['nadira', 'sesto', 'orsa']) SPR.people[k] = buildHumanoid(PEOPLE[k]);

/* ------------------------------ arte: sabbia, cactus, tende ------------------------------ */
(function amberArt() {
  const mk = (rows, pal) => spriteFromRows(rows, Object.assign({ o: '#1a1420' }, pal));
  ICON.lens = mk(['..ooo..', '.owwwo.', 'owwsbwo', 'owsbbwo', 'owwbwwo', '.owwwo.', '..ooo..'], { w: '#f8f0d0', s: '#ffffff', b: '#a8c8f8' });
  Ground.sand = (P, r) => {
    P.r(0, 0, 16, 16, '#e0bc78');
    for (let i = 0; i < 12; i++) P.p(r() * 16, r() * 16, '#d0a868');
    for (let i = 0; i < 5; i++) P.p(r() * 16, r() * 16, '#f0d498');
    if (r() < 0.5) { const y = 3 + (r() * 10 | 0); for (let x = 2; x < 13; x++) P.p(x, y + Math.round(Math.sin(x * 0.7) * 0.8), '#c89a58'); }   // un'increspatura di duna
  };
  const dot = TilePaint['.'], tuft = TilePaint[','], tree = TilePaint['T'];
  TilePaint['.'] = (P, r, e) => e && e.ground === 'sand' ? Ground.sand(P, r) : dot(P, r, e);
  TilePaint[','] = (P, r, e) => {
    if (!e || e.ground !== 'sand') return tuft(P, r, e);
    Ground.sand(P, r);
    for (let k = 0; k < 2; k++) { const x = 3 + (r() * 10 | 0), y = 7 + (r() * 6 | 0); P.p(x, y, '#8a7a3a'); P.p(x - 1, y - 1, '#8a7a3a'); P.p(x + 1, y - 2, '#a89a4a'); }   // ciuffi secchi
  };
  TilePaint['T'] = (P, r, e) => {   // nel deserto: un cactus
    if (!e || e.ground !== 'sand') return tree(P, r, e);
    Ground.sand(P, r);
    P.r(4, 14, 9, 2, '#c09858');
    P.r(6, 2, 4, 13, '#1e4a28'); P.r(7, 2, 2, 13, '#3a8a46'); P.r(7, 3, 1, 11, '#5aaa5a');
    P.r(2, 6, 4, 3, '#1e4a28'); P.r(2, 3, 3, 4, '#1e4a28'); P.r(3, 4, 1, 4, '#3a8a46');
    P.r(10, 8, 4, 3, '#1e4a28'); P.r(11, 5, 3, 4, '#1e4a28'); P.r(12, 6, 1, 4, '#3a8a46');
    for (const [x, y] of [[6, 4], [9, 7], [6, 10], [9, 12], [2, 4], [13, 6]]) P.p(x, y, '#f0e8c0');   // spine
    if (r() < 0.4) { P.p(7, 1, '#f080a0'); P.p(8, 1, '#f8b0c0'); }   // un fiore
  };
  // la tenda della carovana (m) e il suo ingresso (e, un passaggio)
  TilePaint['m'] = (P, r, e) => {
    Ground.sand(P, r);
    P.r(0, 0, 16, 16, '#b8503a'); for (let x = 0; x < 16; x += 4) P.r(x, 0, 2, 16, '#d8704a');
    P.r(0, 15, 16, 1, '#6a2a1a'); P.r(0, 0, 16, 1, '#e89060');
  };
  TilePaint['e'] = (P, r, e) => {
    P.r(0, 0, 16, 16, '#b8503a'); for (let x = 0; x < 16; x += 4) P.r(x, 0, 2, 16, '#d8704a');
    P.r(4, 3, 8, 13, '#2a1410'); P.r(5, 4, 6, 12, '#4a2418'); P.r(7, 3, 2, 13, '#e89060');
  };
  TILE_SOLID.add('m'); TILE_WARP.add('e');
})();

/* --------------------------------- le stanze --------------------------------- */
Object.assign(ROOMS, {
  'a:0,1': {
    name: 'Gola del Vento', ground: 'sand', music: 'overworld',
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'KK....KK..KKK..K',
      'K..T.......K...K',
      'K.....KK.......K',
      'K..KK....T..KK.K',
      'C..............:',
      'K.T...KK....T..K',
      'K.......K......K',
      'KK..T......KK..K',
      'KKK....KK.....KK',
      'KKKKKKKKKKKKKKKK',
    ],
    warps: { '0,5': { to: 'o:2,2', x: 14, y: 4, dir: 2 } },
    enemies: [{ type: 'scorpion', x: 8, y: 2 }, { type: 'scorpion', x: 10, y: 8 }],
    onEnter: g => {
      if (g.s.flags.amberIn) return;
      g.s.flags.amberIn = true;
      g.say([
        'Oltre la gola, il verde della valle finisce di colpo. Davanti a te, dune color ambra fino all\'orizzonte.',
        'Il vento porta un odore di spezie e un tintinnio di campanelli: da qualche parte, a est, c\'è un accampamento.',
      ]);
    },
  },
  'a:1,1': {
    name: 'Carovana delle Dune', ground: 'sand', music: 'village',
    tiles: [
      'TTTTTTT..TTTTTTT',
      'T.mmmm.::.mmmm.T',
      'T.mmmm.::.mmmm.T',
      'T.mmem.::.memm.T',
      'T......::......T',
      '::::::::::::::::',
      'T..,...::...,..T',
      'T...r..::..r...T',
      'T......::......T',
      'T,.....::.....,T',
      'TTTTTTT..TTTTTTT',
    ],
    warps: { '4,3': { to: 'i:tenda', x: 7, y: 8 }, '11,3': { to: 'i:mappe', x: 7, y: 8 } },
    npcs: [
      { id: 'lu', sprite: 'kid', x: 10, y: 8, talk: g => {
        const f = g.s.flags, L = [
          'Lu: Gli SCORPIONI D\'AMBRA caricano dritti come frecce! Spostati di lato: sbattono contro le rocce e restano storditi. Allora colpisci!',
          'Lu: Mia nonna dice che l\'Oasi del Miraggio è vera solo quando il sole è a picco. Le altre ore è sabbia e basta.',
          'Lu: Una notte è caduta una stella nel Mare di Dune! L\'ho vista io! Ma di giorno non la trova nessuno.',
          'Lu: Ti piacciono i cactus? A me no. Pungono.',
        ];
        return [L[(f.luIdx = ((f.luIdx || 0) + 1) % L.length)]];
      } },
      { id: 'mercante', sprite: 'merchant', x: 5, y: 6, talk: () => ['Un mercante della carovana ti sorride: «Sale, spezie, storie! Ma per oggi, solo storie: le altre merci le ha già comprate Bortolo.»'] },
    ],
    signs: { '3,1': ['La tenda di Nadira, la capocarovana. Dentro si sente profumo di tè alla menta.'], '12,1': ['La tenda delle mappe. Un cartello: «Sesto, cartografo. Non toccare i rotoli».'] },
    onEnter: g => {
      if (g.s.flags.caravanSeen) return;
      g.s.flags.caravanSeen = true;
      g.say(['Tende rosse, tappeti stesi sulla sabbia, cammelli che sonnecchiano: la CAROVANA DELLE DUNE.']);
    },
  },
  'a:2,1': {
    name: 'Mare di Dune', ground: 'sand', music: 'overworld',
    tiles: [
      'TTTTTTT..TTTTTTT',
      'T......,.......T',
      'T..T.......T...T',
      'T.....,........T',
      'T.T.......T..,.T',
      '...............T',
      'T....T.........T',
      'T.,.......T....T',
      'T...T.........,T',
      'T........,.....T',
      'TTTTTTTTTTTTTTTT',
    ],
    chests: [{ id: 'a_lens_stella', x: 12, y: 3, item: 'lens', cond: g => isNightA(g) }],
    enemies: [{ type: 'scorpion', x: 4, y: 3 }, { type: 'scorpion', x: 9, y: 7 }, { type: 'scorpion', x: 13, y: 8 }],
  },
  'a:1,0': {
    name: 'Rovine del Sole', ground: 'sand', music: 'temple',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T.NNNN....NNNN.T',
      'T.N..N....N..N.T',
      'T.N..N....NQNN.T',
      'T.NNNN.........T',
      'T..............:',
      'T....Y....Y....T',
      'T..,......,....T',
      'T.....r..r.....T',
      'T..............T',
      'TTTTTTT..TTTTTTT',
    ],
    chests: [{ id: 'a_lens_rovine', x: 12, y: 2, item: 'lens' }],
    enemies: [{ type: 'scorpion', x: 3, y: 7 }, { type: 'skeleton', x: 12, y: 7 }],
    signs: { '5,6': ['Sul pilastro, un sole inciso con dodici raggi. Sotto: «Il giorno guarda, la notte ascolta, la sera ricorda».'] },
  },
  'a:2,0': {
    name: 'Oasi del Miraggio', ground: 'sand', music: 'overworld',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T......,.......T',
      'T..T........T..T',
      'T..............T',
      'T..............T',
      '...............T',
      'T..............T',
      'T..............T',
      'T..T........T..T',
      'T......,.......T',
      'TTTTTTT..TTTTTTT',
    ],
    // a mezzogiorno il miraggio è vero: uno stagno con un'isola e un ponticello
    dyn: (() => {
      const out = [], noon = g => isNoon(g);
      const W = ['~~~~~~~~', '~~....~~', '~~....~~', '~~....~~', '~~~==~~~'];
      W.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch !== '.') out.push({ x: 4 + dx, y: 3 + dy, ch, cond: noon }); }));
      return out;
    })(),
    chests: [{ id: 'a_lens_oasi', x: 7, y: 5, item: 'lens', cond: g => isNoon(g) }],
  },
  'a:1,2': {
    name: 'Altopiano di Vesper', ground: 'sand', music: 'temple',
    tiles: [
      'TTTTTTT..TTTTTTT',
      'T,.............T',
      'T....r....r....T',
      'T..............T',
      'T..Y........Y..T',
      'T......::......T',
      'T..NNNN::NNNN..T',
      'T..NNNNJJNNNN..T',
      'T..NNNNNNNNNN..T',
      'T..NNNNNNNNNN..T',
      'TTTTTTTTTTTTTTTT',
    ],
    npcs: [{ id: 'orsa', sprite: 'orsa', x: 12, y: 3, talk: g => orsaTalk(g) }],
    signs: { '7,7': g => doorTalk(g), '8,7': g => doorTalk(g), '3,4': ['Sul pilastro: «Qui Vesper guardava la sua stella. Qui la sua stella guardava lui».'] },
    onEnter: g => {
      if (g.s.flags.plateauSeen) return;
      g.s.flags.plateauSeen = true;
      g.say(['In cima all\'altopiano, una cupola di pietra chiara: l\'OSSERVATORIO DI VESPER.', 'Sopra il portone, tre incavi rotondi e vuoti, come occhi chiusi.']);
    },
  },
  'i:tenda': {
    name: 'La tenda di Nadira', ground: 'wood', music: 'village',
    tiles: [
      'XXXXXXXXXXXXXXXX',
      'XXXIIIIIIIIIIXXX',
      'XXXIkkIIIIkkIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwtwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwjIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIIIIEEIIIIXXX',
      'XXXXXXXXXXXXXXXX',
    ],
    warps: { '7,9': { to: 'a:1,1', x: 4, y: 4 }, '8,9': { to: 'a:1,1', x: 4, y: 4 } },
    npcs: [{ id: 'nadira', sprite: 'nadira', x: 8, y: 4, talk: g => nadiraTalk(g) }],
  },
  'i:mappe': {
    name: 'La tenda delle mappe', ground: 'wood', music: 'village',
    tiles: [
      'XXXXXXXXXXXXXXXX',
      'XXXIIIIIIIIIIXXX',
      'XXXIkkIIIIkkIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwtwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIIIIEEIIIIXXX',
      'XXXXXXXXXXXXXXXX',
    ],
    warps: { '7,9': { to: 'a:1,1', x: 11, y: 4 }, '8,9': { to: 'a:1,1', x: 11, y: 4 } },
    npcs: [{ id: 'sesto', sprite: 'sesto', x: 6, y: 3, talk: g => sestoTalk(g) }],
  },
});

/* ------------------------------ dialoghi ------------------------------ */
/* Ciclo 56 (rifinitura): il riposo fino a un'ora scelta, prima solo nella tenda di Nadira. Ora anche all'osteria di Lina
 * (l'Isola della Stella si apre solo DI NOTTE), alla locanda di Rufo e col padre nella valle (la gara è solo DI MATTINA, i fuochi
 * fatui e il Luccio solo DI NOTTE). Un giorno dura 6 minuti: senza riposo si aspettavano fino a 4 minuti veri senza fare niente. */
function restChoices(sleep, no, noText) {
  return REST_AT.map(([label, p]) => ({ label, fn: g2 => {
    g2.s.dayStart = (g2.s.time || 0) - DAY_LEN * p; g2.s.hp = g2.s.maxHp; g2.saveGame(); Sound.sfx('heart');
    return [sleep + ' ' + label.replace('A notte fonda', 'È notte fonda').replace('Al mattino', 'È mattino').replace('A mezzogiorno', 'È mezzogiorno').replace('Al tramonto', 'È il tramonto') + '.'];
  } })).concat([{ label: no, fn: () => [noText] }]);
}
window.restChoices = restChoices;

function nadiraTalk(g) {
  const f = g.s.flags;
  const rest = { text: 'Nadira: Vuoi riposare nella mia tenda? Il deserto cambia volto con le ore.', choices: restChoices('Chiudi gli occhi sui cuscini... e ti svegli riposato.', 'No, grazie', 'Nadira: Il tè resta caldo per te.') };
  if (!f.nadiraHello) return [
    'Nadira: Benvenuto alla Carovana delle Dune, straniero. Sono Nadira: portiamo sale e storie da un\'oasi all\'altra.',
    'Nadira: L\'Osservatorio di Vesper? Sì, è a sud, sull\'Altopiano. Nessuno ci entra da secoli: la porta si apre solo quando la stella della sera la guarda negli occhi.',
    'Nadira: Tre occhi di vetro, le LENTI, che il vento ha disperso. Sesto, il nostro cartografo, sa dove sono finite. La sua è la tenda a est.',
    'Nadira: E se ti serve aspettare un\'ora precisa, la mia tenda è tua: qui si riposa fino al momento giusto.',
    g2 => { g2.s.flags.nadiraHello = true; },
    rest,
  ];
  return [rest];
}
function sestoTalk(g) {
  const f = g.s.flags, n = lensCount(g);
  if (n === 3) return ['Sesto: Tutte e tre! Allora va\' all\'Altopiano e mettile nel portone. Ma ricorda: la stella della sera si vede solo AL TRAMONTO.'];
  const miss = AMBER_LENSES.filter(l => !f['chest:' + l.id]);
  const tips = {
    a_lens_rovine: 'una è nelle ROVINE DEL SOLE, a nord, dietro una parete incrinata. Lì serve qualcosa di esplosivo',
    a_lens_oasi: 'una è nell\'OASI DEL MIRAGGIO, a nord-est: l\'oasi è vera solo A MEZZOGIORNO, e la lente è sull\'isola',
    a_lens_stella: 'una è caduta dal cielo nel MARE DI DUNE, a est: brilla solo DI NOTTE, quando il buio la fa vedere',
  };
  return [
    ...(f.sestoHello ? [] : ['Sesto: Un esploratore! Non toccare i rotoli... ecco, bravo. Le lenti dell\'Osservatorio? Le ho segnate tutte sulla mia mappa.', g2 => { g2.s.flags.sestoHello = true; }]),
    'Sesto: Te ne mancano ' + miss.length + ': ' + miss.map(l => tips[l.id]).join('; ') + '.',
  ];
}
function orsaTalk(g) {
  const f = g.s.flags;
  if (f.observatoryOpen) return ['Orsa: L\'hai visto anche tu, il raggio. Dopo tanti secoli... Vesper ti aspetta, ragazzo. Portagli il tuo messaggio.'];
  if (!f.orsaHello) return [
    'Orsa: Ah, un visitatore. Io guardo le stelle da quassù da settant\'anni. Mi chiamano Orsa, come la costellazione.',
    'Orsa: Vesper non era un dio, sai. Era un uomo che guardava il cielo. Quando la notte sulla valle non finiva mai, salì qui e chiese aiuto alla sua stella.',
    'Orsa: La stella gli rispose. E lui le diede la sua voce: la versò in un cristallo, e il cristallo diventò luce. Il Cuore di Vesper.',
    'Orsa: Dicono che da allora lui non abbia più cantato. Né più parlato. Che aspetti, lassù, qualcuno che gli porti indietro una voce.',
    g2 => { g2.s.flags.orsaHello = true; },
  ];
  if (f.lensesSet) return ['Orsa: Le lenti sono al loro posto. Ora aspetta il TRAMONTO: quando la stella della sera si accende, guarda il portone.'];
  return ['Orsa: Il portone ha tre occhi vuoti. Riempili con le lenti, e al tramonto la stella guarderà dentro.'];
}
function doorTalk(g) {
  const f = g.s.flags, n = lensCount(g);
  if (f.observatoryOpen) return ROOMS[VESPER_ROOM] ? ['Il portone è aperto. Dall\'interno sale una luce color ambra.'] : ['Il portone è socchiuso, e dall\'interno viene una luce color ambra... Il prossimo capitolo comincia qui.'];
  if (f.lensesSet) return isDusk(g) ? ['La stella della sera brilla attraverso le lenti...'] : ['Le tre lenti sono al loro posto, ma il cielo non è ancora quello giusto. La stella della sera si accende al TRAMONTO.'];
  if (n < 3) return ['Tre incavi rotondi sopra il portone. ' + (n ? 'Provi a posare le tue lenti, ma senza tutte e tre il vetro non resta. (' + n + '/3)' : 'Sembrano fatti per tre grandi lenti di vetro.')];
  return ['Posi le tre lenti negli incavi, una alla volta. Il vetro si scalda e si incastra con un piccolo tintinnio.', g2 => { g2.s.flags.lensesSet = true; Sound.sfx('secret'); g2.saveGame(); },
    ...(isDusk(g) ? [] : ['Ora serve la stella della sera: torna al TRAMONTO (nella tenda di Nadira puoi riposare fino a quell\'ora).'])];
}

/* ------------------------------ lo Scorpione d'ambra ------------------------------ */
class Scorpion extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.hp = 3; this.dmg = 1; this.hb = { x: 2, y: 5, w: 12, h: 9 };
    this.state = 'walk'; this.vx = 0; this.vy = 0; this.dir = 0; this.st = 40;
  }
  update(g) {
    if (this.baseUpdate()) { this.touchPlayer(g); return; }
    const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy();
    if (this.state === 'walk') {
      if (--this.st <= 0) { const d = DIRS[Math.random() * 4 | 0]; this.dir = DIRS.indexOf(d); this.vx = d.x * 0.45; this.vy = d.y * 0.45; this.st = 40 + (Math.random() * 50 | 0); }
      if (moveEntity(this, this.vx, this.vy, this.mopts())) { this.vx *= -1; this.vy *= -1; }
      // allineato con Lio, non troppo lontano: si prepara a caricare
      if (Math.hypot(dx, dy) < 120 && (Math.abs(dx) < 7 || Math.abs(dy) < 7) && this.t > 30) {
        this.dir = Math.abs(dx) < 7 ? (dy < 0 ? 1 : 0) : (dx < 0 ? 2 : 3); this.state = 'aim'; this.st = 22;
      }
    } else if (this.state === 'aim') {
      if (--this.st <= 0) { const v = DIRS[this.dir]; this.vx = v.x * 3; this.vy = v.y * 3; this.state = 'charge'; this.st = 70; Sound.sfx('shoot'); }
    } else if (this.state === 'charge') {
      if (moveEntity(this, this.vx, this.vy, this.mopts()) || --this.st <= 0) { this.state = 'dazed'; this.st = 75; g.shake = Math.max(g.shake, 2); g.puff(this.cx(), this.cy(), '#e0c080'); Sound.sfx('bump'); }
    } else if (this.state === 'dazed') {
      if (--this.st <= 0) { this.state = 'walk'; this.st = 20; this.t = 0; }
    }
    this.touchPlayer(g);
  }
  hurt(g, d, dir) { super.hurt(g, this.state === 'dazed' ? d * 2 : d, dir); }   // stordito: colpi doppi
  draw(c) {
    const X = Math.round(this.x + (this.state === 'aim' ? Math.sin(this.t * 1.7) : 0)), Y = Math.round(this.y), flip = this.dir === 2, up = this.dir === 1;
    drawShadow(c, X + 8, Y + 14, 12);
    const white = this.flash > 0 && (this.flash >> 1) % 2 === 0, B = white ? '#ffffff' : '#c8782a', L = white ? '#ffffff' : '#f0a848', K = '#3a1a0a';
    c.save(); c.translate(X + 8, Y + 8); if (flip) c.scale(-1, 1); if (up) c.scale(1, -1);
    const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a, b, w, h); };
    const leg = (this.t >> 3) % 2;
    R(-6, 0, 12, 6, K); R(-5, 1, 10, 4, B); R(-4, 1, 8, 1, L);                   // corpo
    for (const lx of [-4, -1, 2]) { R(lx, 5 + leg, 1, 2, K); R(lx + 1, -1 - leg, 1, 2, K); }   // zampe
    R(5, 0, 4, 2, K); R(6, -2, 3, 3, K); R(7, -1, 2, 1, L);                     // chela davanti
    const tail = this.state === 'aim' || this.state === 'charge' ? -2 : 0;      // coda alzata quando carica
    R(-9, -1 + tail, 4, 3, K); R(-8, -4 + tail, 3, 4, K); R(-7, -6 + tail, 4, 3, K); R(-6, -5 + tail, 2, 1, L); R(-4, -6 + tail, 2, 2, '#f8e0a0');
    R(2, 1, 1, 1, '#1a0a00'); R(4, 1, 1, 1, '#1a0a00');
    if (this.state === 'dazed') { const a = this.t * 0.2; R(Math.round(Math.cos(a) * 5) - 1, -8, 2, 2, '#fff0a0'); R(Math.round(Math.cos(a + 3) * 5) - 1, -8, 2, 2, '#fff0a0'); }
    c.restore();
  }
}

/* ---------------------------------- logica ---------------------------------- */
(function installAmber() {
  const G = Game;
  const amber = id => id && (id.startsWith('a:') || id === 'i:tenda' || id === 'i:mappe');

  /* il nuovo nemico */
  const mk0 = makeEnemy;
  makeEnemy = function (def) { return def.type === 'scorpion' ? new Scorpion(def.x * TS, def.y * TS) : mk0(def); };
  window.Scorpion = Scorpion;
  if (typeof BESTIARY !== 'undefined') {
    let pic = null;
    BESTIARY.push({ k: 'scorpion', name: "Scorpione d'ambra",
      spr: () => pic || (pic = (() => { const cv = makeCanvas(16, 16), s = new Scorpion(0, 0); s.t = 0; s.dir = 3; s.draw(cv.getContext('2d')); return cv; })()),
      lore: 'Vive nelle Dune d\'Ambra. Quando ti vede allineato alza la coda e carica dritto come una freccia.',
      weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Se lo schivi di lato sbatte sulle rocce e, stordito, prende colpi doppi.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Scorpion ? 'scorpion' : bk(e); };
  }

  /* ---------- fine del Capitolo II: un cartello, dopo il ricordo del padre ---------- */
  if (typeof FATHER_NPC !== 'undefined') {
    const ft = FATHER_NPC.talk;
    FATHER_NPC.talk = function (g) {
      const before = !!g.s.flags.fatherRemembers, out = ft.call(this, g);
      if (!before && g.s.flags.fatherRemembers && !g.s.flags.ch2Done) out.push(g2 => { g2.chapterCardIn = 45; });
      if (g.s.flags.ch3Call && !g.s.flags.dadAmber) { g.s.flags.dadAmber = true; return ['Papà: Le Dune d\'Ambra! Da ragazzo sognavo di seguire una carovana. Se incontri Nadira, dille che il figlio del ghiacciaio la saluta.']; }
      return out;
    };
  }
  const update = G.update;
  G.update = function () {
    if (this.state === 'chapter') {
      this.t++; this.chT++;
      if (this.chT > 120 && (Input.hit('action') || Input.hit('start'))) { this.state = 'play'; this.s.flags.ch2Done = true; this.saveGame(); Sound.sfx('select'); }
      return;
    }
    update.call(this);
    if (this.chapterCardIn > 0 && this.state === 'play' && !this.dialog && --this.chapterCardIn === 0) { this.state = 'chapter'; this.chT = 0; Sound.sfx('victory'); }
  };
  const render = G.render;
  G.render = function () {
    render.call(this);
    if (this.state !== 'chapter') return;
    const t = this.chT, a = Math.min(0.75, t / 60), ta = Math.max(0, Math.min(1, (t - 30) / 40));
    sctx.fillStyle = 'rgba(8,6,20,' + a + ')'; sctx.fillRect(0, 0, GW * SCALE, GH * SCALE);
    if (ta <= 0) return;
    txt('CAPITOLO II', 128, 46, { align: 'center', size: 11, color: '#c8bcd8', alpha: ta });
    txt('La Nebbia Grigia', 128, 62, { align: 'center', size: 18, font: TITLE_FONT, color: '#ffd870', alpha: ta });
    txt('— completato —', 128, 84, { align: 'center', size: 11, color: '#f4ecdc', alpha: ta });
    txt('Le campane suonano, i ricordi sono tornati a casa.', 128, 104, { align: 'center', size: 10, color: '#f4ecdc', alpha: ta, maxW: 232 });
    txt('Ma il Cuore di Vesper, stanotte, ha cantato una nota...', 128, 116, { align: 'center', size: 10, color: '#a8c8f8', alpha: ta, maxW: 232 });
    txt('Tempo ' + fmtTime(this.s.time) + ' · Cuori ' + this.s.maxHp / 2, 128, 136, { align: 'center', size: 9, color: '#c8bcd8', alpha: ta });
    if (t > 120) txt('Premi ' + actKey(true) + ' per continuare', 128, 158, { align: 'center', size: 9, color: '#a898c0', alpha: 0.6 + Math.sin(t * 0.08) * 0.3 });
  };

  /* ---------- l'inizio del Capitolo III: Teodoro ---------- */
  const elder = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
  if (elder) {
    const et = elder.talk;
    elder.talk = function (g) {
      const f = g.s.flags;
      if (f.ch2Done && !f.ch3Call) return [
        'Teodoro: Lio, ascolta. Stanotte Ortensio è corso qui: il Cuore di Vesper, nel giardino, ha CANTATO. Una nota sola, poi più niente.',
        'Teodoro: Mi hai raccontato di Elva, e del suo messaggio per Vesper. Credo che il Cuore stia cercando la voce che gli manca.',
        'Teodoro: La leggenda dice che Vesper salì sull\'ALTOPIANO D\'AMBRA, oltre le dune a est, dove la stella della sera è più vicina. Là versò la sua voce nel Cuore.',
        'Teodoro: Il suo OSSERVATORIO è ancora lassù. Nei Campi di Brina, a est, una gola tra le rocce porta al deserto: i carovanieri la chiamano Gola del Vento.',
        'Teodoro: Porta a Vesper il messaggio di Elva, ragazzo. Forse è quello che il Cuore aspetta da secoli.',
        g2 => { g2.s.flags.ch3Call = true; g2.saveGame(); },
      ];
      if (f.observatoryOpen && !f.elderObs) { f.elderObs = true; return ['Teodoro: L\'Osservatorio si è aperto? Allora la leggenda era vera... Va\', Lio. Ma torna a raccontarmi tutto.']; }
      return et.call(this, g);
    };
  }

  /* ---------- la gola nei Campi di Brina ---------- */
  const campi = ROOMS['o:2,2'];
  campi.dyn = (campi.dyn || []).concat([{ x: 15, y: 4, ch: 'C', cond: g => !!g.s.flags.ch3Call }]);
  campi.warps = Object.assign({}, campi.warps, { '15,4': { to: 'a:0,1', x: 1, y: 5, dir: 3 } });

  /* ---------- l'Osservatorio: il portone ---------- */
  const alt = ROOMS['a:1,2'];
  alt.dyn = [{ x: 7, y: 7, ch: 'Z', cond: g => !!g.s.flags.observatoryOpen && !!ROOMS[VESPER_ROOM] }, { x: 8, y: 7, ch: 'P', cond: g => !!g.s.flags.observatoryOpen && !!ROOMS[VESPER_ROOM] }];
  Object.defineProperty(alt, 'warps', { get: () => ROOMS[VESPER_ROOM] ? { '7,7': { to: VESPER_ROOM, x: 7, y: 8, dir: 1 } } : {}, configurable: true });

  /* ---------- le ore cambiano le stanze: oasi a mezzogiorno, stella di notte, raggio al tramonto ---------- */
  const bucket = g => (isNoon(g) ? 'N' : '') + (isNightA(g) ? 'S' : '') + (isDusk(g) ? 'D' : '');
  function refreshTimed(g) {
    const def = g.room;
    g.tiles = def.tiles.map(r => r.split(''));
    for (const d of def.dyn || []) if (d.cond(g)) g.tiles[d.y][d.x] = d.ch;
    const floor = floorOf(def.ground), f = g.s.flags;
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) if (g.tiles[ty][tx] === 'Q' && f['bomb:' + g.roomId + ':' + tx + ',' + ty]) g.tiles[ty][tx] = floor;
    g.entities = g.entities.filter(e => !(e instanceof Chest) || e.opened || !e.def.cond || e.def.cond(g));
    g.spawnChests();
    // Ciclo 34: anche l'acqua animata (elenco fatto all'ingresso) va rifatta, se no l'oasi sparita resta "dipinta" d'acqua
    g.animTiles = []; for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) { const ch = g.tiles[ty][tx]; if (ch === '~' || ch === 'Y') g.animTiles.push([tx, ty, ch]); }
    g.redrawBg();
    const p = g.player;   // se il miraggio diventa acqua sotto i piedi, Lio torna a riva
    if (p && boxHitsSolid(p.box(), {})) { p.x = 7 * TS; p.y = 9 * TS - 6; }
  }
  const loadRoom = G.loadRoom;
  G.loadRoom = function () { const r = loadRoom.apply(this, arguments); this.amberBucket = this.roomId.startsWith('a:') ? bucket(this) : null; return r; };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state !== 'play' || !this.roomId.startsWith('a:')) return;
    const b = bucket(this);
    if (this.amberBucket != null && b !== this.amberBucket && (this.roomId === 'a:2,0' || this.roomId === 'a:2,1')) refreshTimed(this);
    this.amberBucket = b;
    // il raggio della stella: al tramonto, con le lenti, il portone si apre
    const f = this.s.flags;
    if (this.roomId === 'a:1,2' && f.lensesSet && !f.observatoryOpen && isDusk(this) && !this.dialog) {
      f.observatoryOpen = true; this.beamT = 160; this.shake = 10; Sound.sfx('secret'); Sound.sfx('fairy');
      if (ROOMS[VESPER_ROOM]) { this.loadRoom(this.roomId); }
      this.say([
        'Il cielo diventa d\'ambra, e sopra l\'altopiano si accende una stella: VESPERO, la stella della sera.',
        'Un raggio sottile scende dal cielo, attraversa le tre lenti una dopo l\'altra... e il portone dell\'Osservatorio si apre, senza un rumore.',
        'Ti torna in mente la voce di Elva: «dillo a Vesper, che ho ascoltato». Ora sai dove portare il messaggio.',
      ]);
      this.saveGame();
    }
    if (this.beamT > 0) this.beamT--;
  };
  // il cielo del deserto: il giorno e la notte (sky.js li disegna solo nella valle), senza pioggia
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!this.roomId.startsWith('a:')) return;
    const r = Sky.rain; Sky.rain = 0; try { this.drawSky(c); } finally { Sky.rain = r; }
    const t = this.t;
    if (this.roomId === 'a:1,1') {   // Ciclo 44 (rifinitura): le tende avevano solo righe; ora hanno il tetto a punta, il palo e la bandierina
      for (const x0 of [2, 10]) {
        const X = x0 * TS, Y = TS, w = 4 * TS, cx = X + w / 2, t = this.t;
        c.fillStyle = '#1a1420'; c.beginPath(); c.moveTo(cx, Y - 10); c.lineTo(X - 2, Y + 14); c.lineTo(X + w + 2, Y + 14); c.closePath(); c.fill();
        c.fillStyle = '#c8603e'; c.beginPath(); c.moveTo(cx, Y - 8); c.lineTo(X, Y + 13); c.lineTo(X + w, Y + 13); c.closePath(); c.fill();
        c.fillStyle = '#e88a5a'; c.beginPath(); c.moveTo(cx, Y - 8); c.lineTo(cx - 10, Y + 13); c.lineTo(cx - 4, Y + 13); c.closePath(); c.fill();
        c.fillStyle = '#9a4030'; c.beginPath(); c.moveTo(cx, Y - 8); c.lineTo(cx + 12, Y + 13); c.lineTo(cx + 20, Y + 13); c.closePath(); c.fill();
        c.fillStyle = '#5a3a1a'; c.fillRect(cx - 1, Y - 16, 2, 9);
        c.fillStyle = x0 === 2 ? '#f8d048' : '#5ac8e8'; c.fillRect(cx + 1, Y - 16 + ((t >> 4) % 2), 6, 3);
      }
    }
    if (this.roomId === 'a:2,1' && isNightA(this) && !this.s.flags['chest:a_lens_stella']) {   // la stella caduta brilla nel buio
      const x = 12 * TS + 8, y = 3 * TS + 6, a = 0.5 + Math.sin(t * 0.1) * 0.3;
      c.globalAlpha = a * 0.5; c.fillStyle = '#a8c8ff'; c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(x - 1, y - 4, 2, 8); c.fillRect(x - 4, y - 1, 8, 2);
    }
    if (this.roomId === 'a:1,2') {
      const f = this.s.flags;
      for (let i = 0; i < 3; i++) {   // le lenti negli incavi, sopra il portone
        const x = 8 * TS + (i - 1) * 24, y = 7 * TS + (i === 1 ? -3 : 6);   // ai lati del portone e, al centro, come chiave di volta
        c.fillStyle = '#3a2a1a'; c.fillRect(x - 3, y - 3, 7, 7);
        if (f.lensesSet) { c.fillStyle = (t >> 4) % 3 === i ? '#ffffff' : '#a8c8f8'; c.fillRect(x - 2, y - 2, 5, 5); }
      }
      if (this.beamT > 0 || (f.observatoryOpen && isDusk(this))) {   // il raggio della stella
        const a = this.beamT > 0 ? Math.min(1, this.beamT / 40) : 0.35;
        c.globalAlpha = a * 0.55; c.fillStyle = '#fff0b0'; c.fillRect(7 * TS + 4, 0, 24, 7 * TS + 8); c.globalAlpha = a; c.fillStyle = '#ffffff'; c.fillRect(7 * TS + 14, 0, 4, 7 * TS + 8); c.globalAlpha = 1;
      }
    }
  };

  /* ---------- diario (pagina del Capitolo III), obiettivi, Segnavia ---------- */
  window.CHAPTERS3 = [
    { name: 'Capitolo II: completato', done: () => true },
    { name: 'Il Cuore ha cantato', done: g => !!g.s.flags.ch3Call },
    { name: "Le Dune d'Ambra", done: g => !!g.s.flags.amberIn },
    { name: 'La Carovana', done: g => !!g.s.flags.nadiraHello },
    { name: "Le Lenti dell'Osservatorio", done: g => lensCount(g) === 3 },
    { name: 'La stella della sera', done: g => !!g.s.flags.observatoryOpen },
  ];
  if (typeof CHAPTERS !== 'undefined') {
    const dpt = G.drawPauseText;
    G.drawPauseText = function () {
      if (!this.s.flags.ch3Call || this.pausePage !== 1) return dpt.apply(this, arguments);
      // la pagina del Capitolo II (north.js) sostituisce CHAPTERS con CHAPTERS2: qui, per un momento, CHAPTERS2 diventa il Capitolo III
      const keep = CHAPTERS2.splice(0, CHAPTERS2.length, ...CHAPTERS3.slice(0, 9));
      try { return dpt.apply(this, arguments); } finally { CHAPTERS2.splice(0, CHAPTERS2.length, ...keep); }
    };
  }
  const goal3 = g => {
    const f = g.s.flags;
    if (!f.ch3Call) return null;
    if (!f.amberIn) return 'a:0,1';
    if (!f.nadiraHello) return 'i:tenda';
    const miss = AMBER_LENSES.find(l => !f['chest:' + l.id]);
    if (miss) return miss.room;
    if (!f.observatoryOpen) return 'a:1,2';
    return ROOMS[VESPER_ROOM] ? 'a:1,2' : null;
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const f = g.s.flags;
    if (f.ch2Done && !f.ch3Call) return 'Il Capitolo II è concluso. Teodoro ha qualcosa da raccontarti: passa a trovarlo.';
    if (!f.ch3Call) return co(g);
    if (!f.amberIn) return "Raggiungi le Dune d'Ambra: una gola tra le rocce, a est dei Campi di Brina, porta al deserto.";
    if (!f.nadiraHello) return 'Cerca la Carovana delle Dune e parla con Nadira, la capocarovana, nella sua tenda.';
    const n = lensCount(g);
    if (n < 3) return "Ritrova le tre Lenti (" + n + "/3): chiedi a Sesto, il cartografo. Alcune si vedono solo a certe ore.";
    if (!f.lensesSet) return "Hai le tre lenti! Portale al portone dell'Osservatorio, sull'Altopiano di Vesper.";
    if (!f.observatoryOpen) return "Le lenti sono al loro posto. Torna all'Osservatorio al TRAMONTO (puoi riposare nella tenda di Nadira).";
    return ROOMS[VESPER_ROOM] ? "L'Osservatorio è aperto. Entra e porta a Vesper il messaggio di Elva." : "L'Osservatorio si è aperto al tramonto... (il prossimo capitolo comincia lì)";
  };
  window.currentObjective = currentObjective;
  const or0 = objectiveRoom, oc0 = objectiveChest;
  objectiveRoom = function (g) { const f = g.s.flags; if (f.ch2Done && !f.ch3Call) return 'i:elder'; if (!f.ch3Call) return or0(g); return goal3(g); };
  window.objectiveRoom = objectiveRoom;
  objectiveChest = function (g) { return g.s.flags.ch3Call && AMBER_LENSES.some(l => l.room === g.roomId && !g.s.flags['chest:' + l.id]) ? 'lens' : oc0(g); };

  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'vespero', name: 'La stella della sera', desc: "Apri l'Osservatorio di Vesper al tramonto.", icon: 'lens', tier: 1, got: g => !!g.s.flags.observatoryOpen });
})();
