'use strict';
/* =====================================================================
 *  COAST — Ciclo 34 (Agente B, seconda manche): CAPITOLO IV, «LA STELLA CADUTA».
 *  Il Capitolo III finiva così: «quella notte, in cielo, una stella mancava
 *  all'appello». Era VESPERO, la stella di Vesper: è scesa a ridargli la voce
 *  e, sfinita, è precipitata in mare davanti a una costa che Lio non ha mai visto.
 *  · Pino ha notizie dalla cugina MARISA, capitana del porto di PORTO CORALLO:
 *    il FARO si è spento, il mare brilla di notte, i pescatori non escono più.
 *    La barca di Pino, sulla riva sud del Lago Specchio, scende il fiume fino al mare.
 *  · Nuova regione «m:» (la COSTA), 6 luoghi + 3 interni:
 *      m:1,0 Foce del Fiume        (arrivo in barca)
 *      m:1,1 Porto Corallo         (Marisa in capitaneria, nonna Lina all'osteria)
 *      m:0,1 Scogliera del Faro    (il faro spento, Ugo il guardiano; una scheggia oltre l'acqua: arpione)
 *      m:2,1 Spiaggia delle Conchiglie (granchi: sconfiggili tutti per la scheggia)
 *      m:1,2 Secche di Corallo     (LA MAREA: lingue di sabbia che emergono e spariscono)
 *      m:2,2 Isola della Stella    (il cratere; di notte, col faro acceso, la via verso il nucleo)
 *  · MECCANICA NUOVA, LA MAREA: sulla costa l'acqua sale e scende ogni ~18 s.
 *    A marea bassa emergono le lingue di sabbia; chi ci resta sopra quando
 *    l'acqua torna viene travolto (a meno che sappia nuotare). Prima che l'acqua
 *    torni, la schiuma avvisa.
 *  · Tre SCHEGGE DI STELLA riaccendono il Faro (la sua lente era vetro di stella).
 *    Di notte il suo raggio rivela, nel cratere dell'isola, la discesa verso il
 *    nucleo della stella: il prossimo capitolo, prefisso f:, prima sala 'f:1,2'.
 *  · Nuovo nemico: il GRANCHIO (scatta di lato verso di te e pizzica).
 *  Flag: ch4Call, coastIn, marisaHello, chest:m_shard_faro / m_shard_spiaggia /
 *        m_shard_secche, farolit, craterOpen.
 * ===================================================================== */
const COAST_SHARDS = [
  { id: 'm_shard_faro', room: 'm:0,1', where: 'la Scogliera del Faro' },
  { id: 'm_shard_spiaggia', room: 'm:2,1', where: 'la Spiaggia delle Conchiglie' },
  { id: 'm_shard_secche', room: 'm:1,2', where: 'le Secche di Corallo' },
];
const shardCount = g => COAST_SHARDS.filter(s => g.s.flags['chest:' + s.id]).length;
const STAR_ROOM = 'f:1,2';    // la prima sala verso il nucleo della stella (il prossimo capitolo)
const TIDE_T = 1080, TIDE_LOW = 420, TIDE_WARN = 120;   // ciclo della marea (frame): 7 s bassa, 2 s di avviso

ITEMS.shard = { name: 'Scheggia di Stella', text: () => 'Hai trovato una SCHEGGIA DI STELLA! È tiepida e pulsa piano, come un cuore addormentato. (' + shardCount(Game) + '/3) Ugo, il guardiano del Faro, saprà cosa farne.' };
PEOPLE.marisa = { h: '#3a2a1a', s: '#d8a070', x: '#f0f0f0', c: '#2a5a9a', d: '#1a3a6a', p: '#3a3a4a', b: '#2a1a10' };
PEOPLE.ugo = { h: '#c8c8c8', s: '#e0b088', x: '#e8e0d0', c: '#3a4a5a', d: '#2a3440', p: '#3a3a4a', b: '#2a1a10', beard: true };
PEOPLE.lina = { h: '#e8e8f0', s: '#f0c0a0', x: '#f0e0c0', c: '#a05a3a', d: '#7a3a2a', p: '#4a3a2a', b: '#2a1a10' };
for (const k of ['marisa', 'ugo', 'lina']) SPR.people[k] = buildHumanoid(PEOPLE[k]);

/* ------------------------------ arte: spiaggia, palme, barca ------------------------------ */
(function coastArt() {
  const mk = (rows, pal) => spriteFromRows(rows, Object.assign({ o: '#1a1420' }, pal));
  ICON.shard = mk(['...o...', '..owo..', '.owyyo.', 'owyyywo', '.oyyyo.', '..oyo..', '...o...'], { w: '#ffffff', y: '#fff0a0' });
  Ground.beach = (P, r) => {
    P.r(0, 0, 16, 16, '#ecd9a4');
    for (let i = 0; i < 12; i++) P.p(r() * 16, r() * 16, '#dcc690');
    for (let i = 0; i < 4; i++) P.p(r() * 16, r() * 16, '#fff2c8');
    if (r() < 0.25) { const x = 2 + (r() * 11 | 0), y = 2 + (r() * 11 | 0); P.p(x, y, '#f0a0a0'); P.p(x + 1, y, '#f8c8c0'); }   // una conchiglia
  };
  const dot = TilePaint['.'], tuft = TilePaint[','], tree = TilePaint['T'];
  TilePaint['.'] = (P, r, e) => e && e.ground === 'beach' ? Ground.beach(P, r) : dot(P, r, e);
  TilePaint[','] = (P, r, e) => {
    if (!e || e.ground !== 'beach') return tuft(P, r, e);
    Ground.beach(P, r);
    for (let k = 0; k < 3; k++) { const x = 3 + (r() * 10 | 0), y = 6 + (r() * 8 | 0); P.p(x, y, '#6a9a4a'); P.p(x - 1, y - 2, '#6a9a4a'); P.p(x + 1, y - 2, '#8aba5a'); P.p(x, y - 3, '#8aba5a'); }   // erba di duna
  };
  TilePaint['T'] = (P, r, e) => {   // sulla costa: una palma
    if (!e || e.ground !== 'beach') return tree(P, r, e);
    Ground.beach(P, r);
    P.r(3, 14, 10, 2, '#d0bc88');
    for (let y = 6; y < 15; y++) { const x = 7 + Math.round(Math.sin(y * 0.35) * 1.2); P.r(x, y, 2, 1, y % 2 ? '#8a5a2a' : '#a8743a'); }
    const leaf = (cx, cy, dx, dy) => { for (let i = 0; i < 6; i++) { P.p(Math.round(cx + dx * i), Math.round(cy + dy * i + i * i * 0.08), i > 3 ? '#3a8a3a' : '#2a6a2a'); P.p(Math.round(cx + dx * i), Math.round(cy + dy * i + i * i * 0.08) + 1, '#1e4a20'); } };
    leaf(8, 5, 1.1, -0.4); leaf(8, 5, -1.1, -0.4); leaf(8, 5, 1, 0.5); leaf(8, 5, -1, 0.5); leaf(8, 5, 0.3, -0.9);
    P.r(7, 5, 3, 2, '#5a3a1a'); P.p(8, 6, '#7a5a2a');   // noci di cocco
  };
  // la barca di Pino (z): un passaggio sull'acqua
  TilePaint['z'] = (P, r, e) => {
    TilePaint['~'](P, r, { v: e.v, f: 0, ground: e.ground });
    P.r(2, 6, 12, 6, '#5a3418'); P.r(3, 6, 10, 1, '#a8743a'); P.r(1, 7, 1, 3, '#5a3418'); P.r(14, 7, 1, 3, '#5a3418');
    P.r(4, 8, 8, 2, '#7a4a22'); P.r(7, 1, 1, 6, '#3a2410'); P.r(8, 2, 4, 4, '#f0e8d0'); P.r(8, 2, 1, 4, '#d8d0b8');
  };
  TILE_WARP.add('z');
})();

/* --------------------------------- le stanze --------------------------------- */
const tideMap = rows => ({ tiles: rows.map(r => r.replace(/%/g, '~')), tide: rows.flatMap((r, y) => [...r].map((c, x) => c === '%' ? [x, y] : null).filter(Boolean)) });
const SECCHE = tideMap([
  '~~~~~~~..~~~~~~~',
  '~~~~~~~..~~~~~~~',
  '~~~~~~....~~~~~~',
  '~~~~~~~%%~~~~~~~',
  '~~~~~~~%%~~~~~~~',
  '~~...~~%%~~~%%%%',
  '~~...%%....%%~~~',
  '~~...~~....~~~~~',
  '~~~~~~~....~~~~~',
  '~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~',
]);
Object.assign(ROOMS, {
  'm:1,0': {
    name: 'Foce del Fiume', ground: 'beach', music: 'overworld',
    tiles: [
      'TTTTTT~~~~TTTTTT',
      'T....,~~~~.....T',
      'T.....~z~~..,..T',
      'T......=.......T',
      'T..T...:....T..T',
      'T......:.......T',
      'T.,....:....,..T',
      'T..T...:...T...T',
      'T......:.......T',
      'T,.....:.....,.T',
      'TTTTTTT..TTTTTTT',
    ],
    warps: { '7,2': { to: 'o:0,2', x: 6, y: 9, dir: 0 } },
    enemies: [{ type: 'crab', x: 3, y: 6 }],
    onEnter: g => {
      if (g.s.flags.coastIn) return;
      g.s.flags.coastIn = true;
      g.say([
        'La barca di Pino scivola giù per il fiume, tra canne e salici... finché l\'acqua si allarga, sa di sale, e davanti a te c\'è il MARE.',
        'Non l\'avevi mai visto. È enorme, e respira: l\'acqua avanza e si ritira sulla sabbia, come un animale addormentato.',
        'Più a sud, tra le palme, si vedono i tetti di un villaggio di pescatori.',
      ]);
    },
  },
  'm:1,1': {
    name: 'Porto Corallo', ground: 'beach', music: 'village',
    tiles: [
      'TTTTTTT..TTTTTTT',
      'T.RRRR.::.RRRR.T',
      'T.HHHH.::.HHHH.T',
      'T.HDHH.::.HHDH.T',
      'T...:..::...:..T',
      '::::::::::::::::',
      'T......::......T',
      'T..r...::...r..T',
      'T......::......T',
      '~~~~~~~..~~~~~~~',
      '~~~~~~~..~~~~~~~',
    ],
    warps: { '3,3': { to: 'i:capitaneria', x: 7, y: 8 }, '12,3': { to: 'i:osteria', x: 7, y: 8 } },
    npcs: [
      { id: 'pescatore', sprite: 'fisherman', x: 5, y: 7, talk: g => {
        const f = g.s.flags, L = [
          'Pescatore: Da quando la stella è caduta, di notte il mare brilla come se ci fosse una luna sott\'acqua. Nessuno esce più con le barche.',
          'Pescatore: Le SECCHE, a sud: a marea bassa ci si cammina sopra. Ma quando l\'acqua torna, torna in fretta. Guarda la schiuma!',
          'Pescatore: I granchi della spiaggia sono diventati matti. Scattano di lato, poi pizzicano. Colpiscili quando si fermano.',
          f.farolit ? 'Pescatore: Il Faro è tornato! Stanotte esco in barca, finalmente.' : 'Pescatore: Il Faro spento... sessant\'anni che lo vedo acceso, e ora niente. Ugo non mangia più.',
        ];
        return [L[(f.fishIdx = ((f.fishIdx || 0) + 1) % L.length)]];
      } },
    ],
    signs: { '4,3': ['La capitaneria del porto. «Marisa, capitana. Bussare forte: il mare fa rumore».'], '11,3': ['«OSTERIA DELLA NONNA». Zuppa di pesce, pane caldo, e chiacchiere a volontà.'] },
    onEnter: g => {
      if (g.s.flags.portoSeen) return;
      g.s.flags.portoSeen = true;
      g.say(['Reti stese al sole, barche tirate in secco, gabbiani che litigano: PORTO CORALLO. Ma le barche, nota, sono tutte a riva.']);
    },
  },
  'm:0,1': {
    name: 'Scogliera del Faro', ground: 'beach', music: 'temple',
    tiles: [
      'KKKKKKKKKKKKKKKK',
      'K....KK~~~~~~~~K',
      'K..NNNh.~~~...~K',
      'K..NNN.~~~~.h.~K',
      'K..NNN....~~~~~K',
      'K..NDN..:......:',
      'K.......:......K',
      'K..,.....:.....K',
      'K.......~~~~~~~K',
      'KK.,..K~~~~~~~~K',
      'KKKKKKKKKKKKKKKK',
    ],
    warps: { '4,5': { to: 'i:faro', x: 7, y: 8 } },
    chests: [{ id: 'm_shard_faro', x: 13, y: 2, item: 'shard' }],   // sull'isolotto: arpione dalla riva (6,3) al palo (12,3); ritorno dal palo (6,2)
    enemies: [{ type: 'crab', x: 11, y: 7 }],
    signs: { '6,9': ['Su uno scoglio, a vernice: «Ai pescatori: il palo sull\'isolotto regge un arpione. Il Faro ringrazia».'] },
  },
  'm:2,1': {
    name: 'Spiaggia delle Conchiglie', ground: 'beach', music: 'overworld',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T,......,.....,T',
      'T...T.......T..T',
      'T..............T',
      'T.....,....,...T',
      '...............T',
      'T..T........T..T',
      'T......,.......T',
      '~~~~~.......~~~~',
      '~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~',
    ],
    clearFlag: 'cleared:m:2,1',
    chests: [{ id: 'm_shard_spiaggia', x: 8, y: 3, item: 'shard', cond: g => !!g.s.flags['cleared:m:2,1'] }],
    enemies: [{ type: 'crab', x: 4, y: 4 }, { type: 'crab', x: 11, y: 4 }, { type: 'crab', x: 6, y: 7 }, { type: 'crab', x: 10, y: 7 }],
    onEnter: g => {
      if (g.s.flags['cleared:m:2,1'] || g.s.flags.beachSeen) return;
      g.s.flags.beachSeen = true;
      g.say(['Sulla sabbia, tra le conchiglie, qualcosa luccica... ma i granchi gli fanno la guardia, e non sembrano di buon umore.']);
    },
  },
  'm:1,2': {
    name: 'Secche di Corallo', ground: 'beach', music: 'overworld',
    tiles: SECCHE.tiles, tide: SECCHE.tide,
    chests: [{ id: 'm_shard_secche', x: 2, y: 6, item: 'shard' }],
    onEnter: g => {
      if (g.s.flags.seccheSeen) return;
      g.s.flags.seccheSeen = true;
      g.say(['Le Secche sono scogli e banchi di sabbia in mezzo al mare. Quando la marea scende, tra uno scoglio e l\'altro affiorano lingue di sabbia.', 'Quando la schiuma comincia a ribollire sulla sabbia, l\'acqua sta per tornare. Non farti trovare in mezzo!']);
    },
  },
  'm:2,2': {
    name: 'Isola della Stella', ground: 'beach', music: 'temple',
    tiles: [
      '~~~~~~~~~~~~~~~~',
      '~~~~~......~~~~~',
      '~~~..T.....T.~~~',
      '~~.....rr.....~~',
      '~~...r.JJ.r...~~',
      '...............~',
      '~~...r....r...~~',
      '~~.....rr.....~~',
      '~~~..T.....T.~~~',
      '~~~~~......~~~~~',
      '~~~~~~~~~~~~~~~~',
    ],
    signs: { '7,4': g => craterTalk(g), '8,4': g => craterTalk(g) },
    onEnter: g => {
      if (g.s.flags.islandSeen) return;
      g.s.flags.islandSeen = true;
      g.say(['Al centro dell\'isola, un cratere fumante. Il fondo è sigillato da una crosta d\'acqua nera che non si muove, come vetro.', 'Lì sotto, lontano lontano, pulsa una luce. È la stella. Ed è ancora viva.']);
    },
  },
  'i:capitaneria': {
    name: 'La capitaneria', ground: 'wood', music: 'village',
    tiles: ['XXXXXXXXXXXXXXXX', 'XXXIIIIIIIIIIXXX', 'XXXIkkIIIIkkIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwtwwwwwwIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwwwwwwwjIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIIIIEEIIIIXXX', 'XXXXXXXXXXXXXXXX'],
    warps: { '7,9': { to: 'm:1,1', x: 3, y: 4 }, '8,9': { to: 'm:1,1', x: 3, y: 4 } },
    npcs: [{ id: 'marisa', sprite: 'marisa', x: 8, y: 4, talk: g => marisaTalk(g) }],
  },
  'i:osteria': {
    name: "L'osteria della nonna", ground: 'wood', music: 'village',
    tiles: ['XXXXXXXXXXXXXXXX', 'XXXIIIIIIIIIIXXX', 'XXXIkkIIIIkkIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwtwwwwtwIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIIIIEEIIIIXXX', 'XXXXXXXXXXXXXXXX'],
    warps: { '7,9': { to: 'm:1,1', x: 12, y: 4 }, '8,9': { to: 'm:1,1', x: 12, y: 4 } },
    npcs: [{ id: 'lina', sprite: 'lina', x: 8, y: 3, talk: g => [{ text: 'Lina: Un bimbo nuovo! Siediti, siediti. Una scodella di zuppa di pesce? Rimette al mondo anche un marinaio annegato. 5 gemme.', choices: [
      { label: 'Zuppa - 5 gemme', fn: g2 => g2.s.hp >= g2.s.maxHp ? ['Lina: Sei già rosso come un gambero! Torna quando avrai fame.']
        : [g3 => { if (g3.s.gems >= 5) g3.s.gems -= 5; g3.s.hp = g3.s.maxHp; Sound.sfx('heart'); }, g2.s.gems >= 5 ? 'Lina: Ecco, bollente. Soffiaci sopra!' : 'Lina: Niente gemme? Mangia lo stesso, poi mi racconti del tuo viaggio.'] },
      { label: 'Racconti', fn: g2 => [linaTale(g2)] },
      { label: 'Una branda', fn: () => [{ text: 'Lina: Di sopra c\'è una branda per i marinai. Fino a quando vuoi dormire?', choices: restChoices('Ti addormenti cullato dal rumore del mare... e ti svegli riposato.', 'Niente', 'Lina: La branda è lì, quando vuoi.') }] },   // Ciclo 56
      { label: 'Niente', fn: () => ['Lina: La pentola è sempre sul fuoco.'] },
    ] }] }],
  },
  'i:faro': {
    name: 'Il Faro', ground: 'stone', music: 'temple',
    tiles: ['XXXXXXXXXXXXXXXX', 'XXXXXIIIIIIXXXXX', 'XXXXXIppppIXXXXX', 'XXXXIIppppIIXXXX', 'XXXXIppppppIXXXX', 'XXXXIppppppIXXXX', 'XXXXIppppppIXXXX', 'XXXXIppppppIXXXX', 'XXXXIppppppIXXXX', 'XXXXIIIEEIIIXXXX', 'XXXXXXXXXXXXXXXX'],
    warps: { '7,9': { to: 'm:0,1', x: 4, y: 6 }, '8,9': { to: 'm:0,1', x: 4, y: 6 } },
    npcs: [{ id: 'ugo', sprite: 'ugo', x: 8, y: 3, talk: g => ugoTalk(g) }],
  },
});

/* ------------------------------ dialoghi ------------------------------ */
function marisaTalk(g) {
  const f = g.s.flags;
  if (f.farolit) return ['Marisa: Il Faro è acceso e le barche escono di nuovo. Porto Corallo ti deve molto, Lio.', f.craterOpen ? 'Marisa: E il cratere dell\'isola si è aperto... Laggiù il mare è più profondo di qualsiasi rete. Sii prudente.' : 'Marisa: Di notte guarda verso l\'Isola della Stella, a sud-est: il raggio del Faro ci si posa sopra, come se indicasse qualcosa.'];
  if (!f.marisaHello) return [
    'Marisa: Tu devi essere Lio! Pino mi ha scritto di te. Sono Marisa, capitana di questo porto... di un porto senza barche, ormai.',
    'Marisa: Tre notti fa una stella è caduta in mare, laggiù, sull\'Isola della Stella. Si è spezzata: alcune schegge sono volate fin sulla costa.',
    'Marisa: E quella stessa notte il FARO si è spento. La sua lente era fatta di vetro di stella: dicono che si sia spenta per lutto.',
    'Marisa: Ugo, il guardiano, dice che con le schegge la lente si potrebbe riaccendere. Ne abbiamo viste tre: una sulla SCOGLIERA del Faro, una sulla SPIAGGIA delle Conchiglie, una sulle SECCHE.',
    'Marisa: Le Secche si attraversano solo a marea bassa. Il mare qui sale e scende in fretta: guarda la schiuma, e non restare in mezzo.',
    g2 => { g2.s.flags.marisaHello = true; },
  ];
  const miss = COAST_SHARDS.filter(s => !f['chest:' + s.id]);
  return [miss.length ? 'Marisa: Ti mancano ' + miss.length + ' schegge: ' + miss.map(s => s.where).join(', ') + '. Poi portale a Ugo, al Faro.' : 'Marisa: Hai tutte e tre le schegge! Corri da Ugo, al Faro, sulla scogliera a ovest.'];
}
function linaTale(g) {
  const T = [
    'Lina: Quando ero bambina, mia nonna diceva che le stelle cadute non muoiono: dormono in fondo al mare, finché qualcuno non le riporta su.',
    'Lina: Il mare e il cielo sono fratelli gelosi. Il cielo ha le stelle, il mare ha solo il loro riflesso. Per questo le onde cercano sempre di afferrarle.',
    'Lina: Ugo ha acceso quel faro ogni sera per quarant\'anni. Una volta mi ha detto che la lente, di notte, canticchiava. Pensavo fosse matto. Adesso non so.',
    'Lina: Sotto l\'Isola della Stella, dicono, c\'è una fossa così profonda che il sole non ci è mai arrivato. La chiamano la FOSSA SENZA FONDO.',
  ];
  return T[(g.s.flags.linaIdx = ((g.s.flags.linaIdx || 0) + 1) % T.length)];
}
function ugoTalk(g) {
  const f = g.s.flags, n = shardCount(g);
  if (f.farolit) return ['Ugo: Senti come canticchia la lente? È la voce della stella. È debole, ma c\'è.', 'Ugo: Ogni notte il raggio va a posarsi sull\'Isola della Stella. Lei è laggiù, ragazzo, e ci chiama.'];
  if (!f.ugoHello) return [
    'Ugo: ...Un ragazzo? Nel mio faro? Ah, tu sei quello che ha riacceso il Cuore di Vesper. Le notizie arrivano anche quaggiù.',
    'Ugo: Guarda lassù: la lente. Vetro di stella, soffiato dal mio bisnonno con una scheggia di una stella cadente. Ha brillato per cent\'anni.',
    'Ugo: Quando Vespero è caduta, la lente si è spenta. Come se avesse sentito morire una sorella.',
    'Ugo: Portami le schegge della stella: con il loro vetro la lente tornerà a brillare. E forse, con la sua luce, ritroveremo anche la stella.',
    g2 => { g2.s.flags.ugoHello = true; },
  ];
  if (n < 3) return ['Ugo: ' + (n ? 'Ne hai ' + n + '. ' : '') + 'Me ne servono tre. ' + COAST_SHARDS.filter(s => !f['chest:' + s.id]).map(s => s.where).join(', ') + '.'];
  return [
    'Ugo: Tutte e tre! Dammele... piano, piano. Sono calde come pane appena sfornato.',
    'Sali con Ugo in cima al faro. Lui incastra le schegge nella lente, una alla volta, poi soffia via la polvere.',
    g2 => { g2.s.flags.farolit = true; g2.shake = 10; Sound.sfx('secret'); Sound.sfx('victory'); g2.saveGame(); },
    'La lente si accende: prima un barlume, poi una luce bianca e calda che spazza il mare. IL FARO DI PORTO CORALLO BRILLA DI NUOVO.',
    'Ugo: Guarda il raggio, Lio... si ferma da solo, laggiù, sull\'ISOLA DELLA STELLA. La lente sa dov\'è sua sorella.',
    'Ugo: Di notte la sua luce è più forte. Vai all\'isola quando è buio: le Secche, a marea bassa, portano fin lì.',
    ...g.giveItem('gems', 50),
  ];
}
function craterTalk(g) {
  const f = g.s.flags;
  if (f.craterOpen) return ROOMS[STAR_ROOM] ? ['La crosta nera si è aperta: una scala di corallo scende nel buio, verso la luce della stella.'] : ['La crosta nera si è aperta, e una scala di corallo scende nel buio... Il prossimo capitolo comincia laggiù.'];
  if (!f.farolit) return ['Una crosta d\'acqua nera, dura come vetro, sigilla il cratere. Sotto, lontanissima, pulsa una luce. Da solo non riesci a scalfirla.'];
  return ['La crosta nera sigilla ancora il cratere. Il raggio del Faro, di giorno, è troppo debole per arrivare fin qui. Torna DI NOTTE (all\'osteria di Lina puoi dormire fino a sera).'];
}

/* ------------------------------ il Granchio ------------------------------ */
class Crab extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.hp = 3; this.dmg = 1; this.hb = { x: 1, y: 6, w: 14, h: 9 };
    this.state = 'wait'; this.st = 30 + (Math.random() * 30 | 0); this.vx = 0; this.vy = 0; this.snap = 0;
  }
  update(g) {
    if (this.baseUpdate()) { this.touchPlayer(g); return; }
    const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy();
    if (this.snap > 0) this.snap--;
    if (this.state === 'wait') {
      if (--this.st <= 0) {   // uno scatto di lato verso Lio (o su e giù, se è già in colonna)
        const side = Math.abs(dx) > 10 || Math.random() < 0.3;
        this.vx = side ? Math.sign(dx || 1) * 2 : 0; this.vy = side ? 0 : Math.sign(dy || 1) * 1.2;
        this.state = 'run'; this.st = 14 + (Math.random() * 12 | 0);
      }
      if (Math.hypot(dx, dy) < 22 && !this.snap) { this.snap = 50; Sound.sfx('swap'); }   // pizzica
    } else if (this.state === 'run') {
      if (moveEntity(this, this.vx, this.vy, this.mopts()) || --this.st <= 0) { this.state = 'wait'; this.st = 30 + (Math.random() * 30 | 0); }
    }
    this.touchPlayer(g);
    if (this.snap > 34) {   // la chela arriva un po' più in là del corpo
      const reach = { x: this.x - 8, y: this.y + 3, w: 32, h: 13 };
      if (overlap(reach, p.box())) p.hurt(g, this.dmg, this.cx(), this.cy());
    }
  }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y), t = this.t, run = this.state === 'run';
    drawShadow(c, X + 8, Y + 14, 13);
    const white = this.flash > 0 && (this.flash >> 1) % 2 === 0, B = white ? '#ffffff' : '#d84a3a', L = white ? '#ffffff' : '#f08060', K = '#3a1010';
    const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(X + a, Y + b, w, h); };
    const leg = (t >> (run ? 1 : 3)) % 2, up = this.snap > 34 ? -3 : 0;
    for (const lx of [2, 4, 11, 13]) R(lx, 12 + (lx < 8 ? leg : 1 - leg), 1, 2, K);
    R(2, 6, 12, 7, K); R(3, 7, 10, 5, B); R(4, 7, 8, 1, L);                // guscio
    R(0, 4 + up, 4, 4, K); R(1, 5 + up, 2, 2, L); R(12, 4 + up, 4, 4, K); R(13, 5 + up, 2, 2, L);   // chele
    R(5, 4, 1, 3, K); R(10, 4, 1, 3, K); R(5, 3, 1, 1, '#ffffff'); R(10, 3, 1, 1, '#ffffff');      // occhi sugli steli
  }
}

/* ---------------------------------- logica ---------------------------------- */
(function installCoast() {
  const G = Game;
  const coastIds = new Set(['i:capitaneria', 'i:osteria', 'i:faro']);
  const coast = id => id && (id.startsWith('m:') || coastIds.has(id));

  const mk0 = makeEnemy;
  makeEnemy = function (def) { return def.type === 'crab' ? new Crab(def.x * TS, def.y * TS) : mk0(def); };
  window.Crab = Crab;
  if (typeof BESTIARY !== 'undefined') {
    let pic = null;
    BESTIARY.push({ k: 'crab', name: 'Granchio di scoglio',
      spr: () => pic || (pic = (() => { const cv = makeCanvas(16, 16), s = new Crab(0, 0); s.t = 0; s.draw(cv.getContext('2d')); return cv; })()),
      lore: 'Da quando la stella è caduta, i granchi della costa sono diventati nervosi. Scattano di lato e pizzicano con le chele.',
      weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Dopo ogni scatto si ferma: colpiscilo allora. La chela arriva lontano.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Crab ? 'crab' : bk(e); };
  }

  /* ---------- l'inizio del Capitolo IV: Pino e la sua barca ---------- */
  const lake = ROOMS['o:0,2'];
  const pino = lake.npcs.find(n => n.id === 'pino');
  if (pino) {
    const pt = pino.talk;
    pino.talk = function (g) {
      const f = g.s.flags;
      if (f.ch3Done && !f.ch4Call) return [
        'Pino: Lio! Meno male che sei passato. Mi è arrivata una lettera da mia cugina MARISA, giù a PORTO CORALLO, sulla costa.',
        'Pino: Tre notti fa una stella è caduta in mare, davanti al loro porto. Da allora il Faro è spento, il mare brilla di notte e i pescatori non escono più.',
        'Pino: Tre notti fa... proprio quando il Cuore ha ricominciato a cantare. La vecchia Orsa del deserto direbbe che non è un caso.',
        'Pino: Il fiume che esce dal lago scende dritto fino al mare. Prendi la mia BARCA: è legata sulla riva sud. Salta su, e lasciati portare.',
        g2 => { g2.s.flags.ch4Call = true; g2.saveGame(); },
      ];
      return pt.call(this, g);
    };
  }
  lake.dyn = (lake.dyn || []).concat([{ x: 6, y: 8, ch: 'z', cond: g => !!g.s.flags.ch4Call }]);
  lake.warps = Object.assign({}, lake.warps, { '6,8': { to: 'm:1,0', x: 7, y: 3, dir: 0 } });
  const elder = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
  if (elder) {
    const et = elder.talk;
    elder.talk = function (g) {
      const f = g.s.flags;
      if (f.ch3Done && !f.ch4Call && !f.elderStar) { f.elderStar = true; return ['Teodoro: Una stella in meno, dici? Vespero... la stella di Vesper. Forse è scesa a ridargli la voce, e ora non riesce a tornare.', 'Teodoro: Pino, al lago, ha ricevuto notizie dalla costa. Va\' a sentire.']; }
      if (f.farolit && !f.elderFaro) { f.elderFaro = true; return ['Teodoro: Il Faro di Porto Corallo? Ne parlavano i miei nonni. Se si è riacceso, la stella non è perduta.']; }
      return et.call(this, g);
    };
  }

  /* ---------- il cratere: di notte, col faro acceso, si apre ---------- */
  const isl = ROOMS['m:2,2'];
  isl.dyn = [{ x: 7, y: 4, ch: 'Z', cond: g => !!g.s.flags.craterOpen && !!ROOMS[STAR_ROOM] }, { x: 8, y: 4, ch: 'P', cond: g => !!g.s.flags.craterOpen && !!ROOMS[STAR_ROOM] }];
  Object.defineProperty(isl, 'warps', { get: () => ROOMS[STAR_ROOM] ? { '7,4': { to: STAR_ROOM, x: 7, y: 8, dir: 1 } } : {}, configurable: true });

  /* ---------- il Segnavia: le lingue di sabbia contano come attraversabili (a marea bassa lo sono) ---------- */
  if (typeof wayTiles === 'function') {
    const wt0 = wayTiles;
    wayTiles = function (g, id) {
      const t = wt0(g, id), def = ROOMS[id];
      if (!def || !def.tide) return t;
      const copy = t.map(r => r.slice()), floor = floorOf(def.ground);   // una copia: le tessere vive non si toccano
      for (const [x, y] of def.tide) copy[y][x] = floor;
      return copy;
    };
  }

  /* ---------- la marea ---------- */
  G.tideT = 0;
  G.tideLow = function () { return this.tideT % TIDE_T < TIDE_LOW; };
  G.tideWarn = function () { const k = this.tideT % TIDE_T; return k >= TIDE_LOW - TIDE_WARN && k < TIDE_LOW; };
  function applyTide(g) {
    const def = g.room; if (!def.tide) return;
    const low = g.tideLow(), floor = floorOf(def.ground);
    for (const [x, y] of def.tide) g.tiles[y][x] = low ? floor : '~';
    rebuildAnimTiles(g); g.redrawBg();
    g.tideWasLow = low;
    if (low) return;
    const p = g.player;   // l'acqua torna: chi è rimasto sulla sabbia viene travolto (chi nuota, no)
    if (!p || g.s.items.swim || p.fallT > 0) return;
    const tx = Math.floor(p.cx() / TS), ty = Math.floor(p.cy() / TS);
    if (g.tiles[ty] && g.tiles[ty][tx] === '~') { p.startFall(g, true); g.banner = { text: 'La marea ti ha travolto!', t: 90 }; }
  }
  window.applyTide = applyTide;
  /* l'acqua animata si disegna da un elenco fatto all'ingresso nella stanza (game.js): se le tessere cambiano, va rifatto */
  function rebuildAnimTiles(g) {
    g.animTiles = [];
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) { const ch = g.tiles[ty][tx]; if (ch === '~' || ch === 'Y') g.animTiles.push([tx, ty, ch]); }
  }
  window.rebuildAnimTiles = rebuildAnimTiles;
  const loadRoom = G.loadRoom;
  G.loadRoom = function () {
    const r = loadRoom.apply(this, arguments);
    if (this.room && this.room.tide) applyTide(this);
    return r;
  };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state !== 'play' || !coast(this.roomId)) return;
    if (!this.dialog) this.tideT++;
    if (this.room.tide && this.tideLow() !== this.tideWasLow) { applyTide(this); if (this.tideLow()) Sound.sfx('splash'); }
    // il cratere: di notte, col Faro acceso
    const f = this.s.flags;
    if (this.roomId === 'm:2,2' && f.farolit && !f.craterOpen && Sky.night(Sky.phase(this)) > 0.5 && !this.dialog) {
      f.craterOpen = true; this.shake = 12; Sound.sfx('secret'); this.saveGame();
      if (ROOMS[STAR_ROOM]) this.loadRoom(this.roomId);
      this.say([
        'Nel buio, il raggio del Faro attraversa il mare e si posa sul cratere. La crosta nera trema... e si spacca come ghiaccio di primavera.',
        'Sotto, una scala di corallo scende a spirale verso il fondo. Laggiù, lontanissima, la luce della stella batte come un cuore stanco.',
        'Ti sembra di sentire una voce sottile, senza parole: la stessa nota che canticchiava la lente del Faro.',
      ]);
    }
  };
  /* disegno: schiuma della marea, il faro (spento o acceso) col suo raggio, la notte sulla costa */
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!this.roomId.startsWith('m:')) return;
    const t = this.t, f = this.s.flags;
    if (this.room.tide && (this.tideWarn() || !this.tideLow())) {   // schiuma: avviso prima che torni l'acqua; onde sulle secche a marea alta
      const warn = this.tideWarn();
      for (const [x, y] of this.room.tide) {
        c.fillStyle = warn ? 'rgba(255,255,255,' + (0.35 + Math.sin(t * 0.4 + x + y) * 0.25) + ')' : 'rgba(220,240,255,0.25)';
        for (let i = 0; i < (warn ? 4 : 2); i++) c.fillRect(x * TS + ((t * 0.7 + i * 5 + y * 3) % 14), y * TS + 3 + i * 3, 3, 1);
      }
    }
    if (this.roomId === 'm:0,1') drawLighthouse(c, 4 * TS + 8, 5 * TS, !!f.farolit, t);
    const r = Sky.rain; Sky.rain = 0; try { this.drawSky(c); } finally { Sky.rain = r; }
    if (f.farolit && Sky.night(Sky.phase(this)) > 0.3) {   // il raggio del faro, di notte, spazza il cielo
      const a = Math.sin(t * 0.02) * 0.6 - 0.4;
      c.save(); c.globalAlpha = 0.2; c.fillStyle = '#fff6c8';
      const ox = this.roomId === 'm:0,1' ? 4 * TS + 8 : -40, oy = this.roomId === 'm:0,1' ? 1 * TS : -20;
      c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a - 0.12) * 400, oy + Math.sin(a - 0.12) * 400 + 200); c.lineTo(ox + Math.cos(a + 0.12) * 400, oy + Math.sin(a + 0.12) * 400 + 200); c.fill();
      c.restore();
    }
    if (this.roomId === 'm:0,1' && f.farolit) {   // la lente accesa brilla anche nel buio (disegnata sopra la notte)
      const cx = 4 * TS + 8, top = 4;
      c.globalAlpha = 0.35 + Math.sin(t * 0.1) * 0.1; c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(cx, top + 5, 16, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1; c.fillStyle = (t >> 3) % 2 ? '#fff8d0' : '#ffe890'; c.fillRect(cx - 4, top + 2, 8, 7);
    }
    if (this.roomId === 'm:2,2' && !f.craterOpen) {   // la luce della stella sotto la crosta
      const a = 0.25 + Math.sin(t * 0.06) * 0.15;
      c.globalAlpha = a; c.fillStyle = '#a8d8ff'; c.fillRect(7 * TS + 2, 4 * TS + 4, 28, 8); c.globalAlpha = 1;
    }
  };
  function drawLighthouse(c, cx, base, lit, t) {   // la torre bianca e rossa, alta sopra le tessere della base
    const top = 4;
    for (let y = top + 14; y < base; y++) {
      const w = Math.round(14 + (y - top) * 0.12), red = Math.floor((y - top) / 10) % 2 === 1;
      c.fillStyle = '#1a1420'; c.fillRect(cx - (w >> 1) - 1, y, w + 2, 1);
      c.fillStyle = red ? '#c83a3a' : '#f0ece0'; c.fillRect(cx - (w >> 1), y, w, 1);
      c.fillStyle = red ? '#e05a4a' : '#ffffff'; c.fillRect(cx - (w >> 1) + 2, y, 2, 1);
    }
    c.fillStyle = '#1a1420'; c.fillRect(cx - 10, top + 10, 20, 5); c.fillStyle = '#4a4a5a'; c.fillRect(cx - 9, top + 11, 18, 3);   // ballatoio
    c.fillStyle = '#1a1420'; c.fillRect(cx - 7, top, 14, 11); c.fillStyle = '#3a3a4a'; c.fillRect(cx - 6, top + 1, 12, 9);
    c.fillStyle = lit ? ((t >> 3) % 2 ? '#fff8d0' : '#ffe890') : '#5a6a7a'; c.fillRect(cx - 4, top + 2, 8, 7);   // la lente
    if (lit) { c.globalAlpha = 0.3; c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(cx, top + 5, 14, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
    c.fillStyle = '#1a1420'; c.fillRect(cx - 5, top - 3, 10, 3); c.fillStyle = '#c83a3a'; c.fillRect(cx - 4, top - 2, 8, 2);   // il tetto
  }
  /* la marea scritta in alto a destra, sulla costa */
  const drawHUDText = G.drawHUDText;
  G.drawHUDText = function () {
    drawHUDText.apply(this, arguments);
    if (this.state !== 'play' || !this.room || !this.room.tide) return;
    const low = this.tideLow(), warn = this.tideWarn();
    txt(low ? (warn ? 'Marea: SALE!' : 'Marea: bassa') : 'Marea: alta', 250, HUD_H + 3, { size: 9, align: 'right', color: warn ? '#ffb0a0' : low ? '#c8ffd0' : '#a8c8f8' });
  };

  /* ---------- diario (pagina del Capitolo IV), obiettivi, Segnavia ---------- */
  window.CHAPTERS4 = [
    { name: 'Capitolo III: completato', done: () => true },
    { name: 'Una stella manca', done: g => !!g.s.flags.ch4Call },
    { name: 'Porto Corallo', done: g => !!g.s.flags.marisaHello },
    { name: 'Le Schegge di Stella', done: g => shardCount(g) === 3 },
    { name: 'Il Faro si riaccende', done: g => !!g.s.flags.farolit },
    { name: "Il cratere dell'isola", done: g => !!g.s.flags.craterOpen },
  ];
  if (typeof CHAPTERS !== 'undefined' && window.CHAPTERS3) {
    const dpt = G.drawPauseText;
    G.drawPauseText = function () {
      if (!this.s.flags.ch4Call || this.pausePage !== 1) return dpt.apply(this, arguments);
      const keep = CHAPTERS3.splice(0, CHAPTERS3.length, ...CHAPTERS4.slice(0, 9));
      try { return dpt.apply(this, arguments); } finally { CHAPTERS3.splice(0, CHAPTERS3.length, ...keep); }
    };
  }
  const goal4 = g => {
    const f = g.s.flags;
    if (!f.ch4Call) return null;
    if (!f.coastIn) return 'm:1,0';
    if (!f.marisaHello) return 'i:capitaneria';
    const miss = COAST_SHARDS.find(s => !f['chest:' + s.id]);
    if (miss) return miss.room;
    if (!f.farolit) return 'i:faro';
    if (!f.craterOpen) return 'm:2,2';
    return ROOMS[STAR_ROOM] ? 'm:2,2' : null;
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const f = g.s.flags;
    if (f.ch3Done && !f.ch4Call) return 'Una stella manca dal cielo. Pino, al Lago Specchio, ha ricevuto notizie dalla costa: va\' a sentire.';
    if (!f.ch4Call) return co(g);
    if (!f.coastIn) return 'Sali sulla barca di Pino, sulla riva sud del Lago Specchio: il fiume ti porterà al mare.';
    if (!f.marisaHello) return 'Raggiungi Porto Corallo e parla con Marisa, la capitana del porto, in capitaneria.';
    const n = shardCount(g);
    if (n < 3) return 'Ritrova le tre Schegge di Stella (' + n + '/3): Scogliera, Spiaggia, Secche (a marea bassa).';
    if (!f.farolit) return 'Porta le schegge a Ugo, il guardiano del Faro, sulla scogliera a ovest di Porto Corallo.';
    if (!f.craterOpen) return "Il Faro brilla di nuovo. Raggiungi l'Isola della Stella DI NOTTE (dalle Secche, a marea bassa).";
    return ROOMS[STAR_ROOM] ? "Il cratere si è aperto: scendi verso il nucleo della stella." : "Il cratere si è aperto... (il prossimo capitolo comincia laggiù)";
  };
  window.currentObjective = currentObjective;
  const or0 = objectiveRoom, oc0 = objectiveChest;
  objectiveRoom = function (g) { const f = g.s.flags; if (f.ch3Done && !f.ch4Call) return 'o:0,2'; if (!f.ch4Call) return or0(g); return goal4(g); };
  window.objectiveRoom = objectiveRoom;
  objectiveChest = function (g) { return g.s.flags.ch4Call && COAST_SHARDS.some(s => s.room === g.roomId && !g.s.flags['chest:' + s.id]) ? 'shard' : oc0(g); };

  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'faro', name: 'Il guardiano del Faro', desc: 'Riaccendi il Faro di Porto Corallo.', icon: 'shard', tier: 1, got: g => !!g.s.flags.farolit });
})();
