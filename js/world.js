'use strict';
/* =====================================================================
 *  WORLD — tutti i contenuti del gioco, data-driven.
 *  ID stanza:  'o:x,y' = mondo esterno (griglia), 'd:x,y' = dungeon,
 *              'i:nome' = interni (stanza singola, si esce con i warp).
 *  Stanze adiacenti nella stessa mappa ('o' o 'd') sono collegate in
 *  automatico: basta lasciare un varco nel bordo di tile solidi.
 *  Coordinate di NPC/nemici/forzieri/warp in TILE (0..15, 0..10).
 *
 *  Le funzioni di dialogo ricevono `g` (l'oggetto Game) e restituiscono
 *  un array di "voci": stringhe, oggetti {text, choices:[{label, fn}]},
 *  oppure funzioni (eseguite in silenzio; se ritornano un array, le sue
 *  voci vengono inserite subito dopo).
 * ===================================================================== */

const ITEMS = {
  sword:     { name: 'Spada di Brina', text: () => 'Hai trovato la SPADA DI BRINA! Premi ' + actKey() + ' per colpire. Taglia cespugli e rovi spinosi.' },
  lantern:   { name: 'Lanterna', text: 'Hai ottenuto la LANTERNA! Le stanze buie ora saranno molto meno spaventose.' },
  potion:    { name: 'Pozione Rossa', text: 'Hai ottenuto una POZIONE ROSSA! Se cadi in battaglia, ti rianimerà automaticamente.' },
  key:       { name: 'Chiavetta', text: 'Hai trovato una CHIAVETTA! Apre una porta chiusa a chiave qui vicino.' },
  bigkey:    { name: 'Chiave del Re', text: 'Hai trovato la CHIAVE DEL RE! Apre la grande porta spinata della Sala Centrale.' },
  hook:      { name: "Amo d'Oro", text: "Hai trovato l'AMO D'ORO! Qualcuno al Lago Specchio lo starà cercando..." },
  container: { name: 'Cuore di Cristallo', text: 'Hai ottenuto un CUORE DI CRISTALLO! La tua salute massima aumenta di un cuore.' },
  gems:      { name: 'Gemme', text: n => 'Hai trovato ' + n + ' GEMME!' },
  crystal:   { name: 'Cuore di Vesper', text: 'Hai recuperato il CUORE DI VESPER, il cristallo dell\'alba!' },
  // --- Ciclo 2 ---
  bombs:     { name: 'Bombe di Brina', text: () => 'Hai trovato le BOMBE DI BRINA! Premi ' + bombKey() + ' per posarne una: fanno saltare massi e pareti incrinate. Allontanati in fretta!' },
  bombpack:  { name: 'Bombe', text: n => 'Hai ottenuto ' + n + ' BOMBE!' },
  bigbag:    { name: 'Grande Borsa', text: 'Hai trovato la GRANDE BORSA DEI MINATORI! Ora puoi portare fino a 20 bombe.' },
  // --- Ciclo 3 ---
  hookshot:  { name: 'Arpione di Vesper', text: () => "Hai trovato l'ARPIONE DI VESPER! Premi " + bombKey() + " per lanciarlo: si aggancia ai pali con l'anello d'oro e ai forzieri, e ti trascina oltre abissi e acqua. Stordisce i nemici e recupera gli oggetti lontani. Cambi oggetto con " + (isTouch() ? 'il pulsante ⇄' : 'il tasto Q') + '.' },
};

ITEMS.seed = { name: "Seme dell'Alba", text: "Hai trovato un SEME DELL'ALBA!" };
ITEMS.dawnsword = { name: "Spada dell'Alba", text: "La Spada di Brina si è trasformata nella SPADA DELL'ALBA! La sua lama dorata infligge il doppio dei danni." };

/* ---------------- Ciclo 4: i Semi dell'Alba (missione di Ortensio) ----------------
 * Cinque semi nascosti nella valle, ognuno richiede un'abilità diversa.
 * Si possono raccogliere in qualsiasi momento; Ortensio li pianta dopo la vittoria. */
const SEED_IDS = ['bosco', 'foresta', 'ghiaccio', 'abisso', 'cripta'];
const SEED_HINTS = {
  bosco: "Uno l'ho nascosto io stesso nel Bosco dei Rovi, dietro un intrico di spine, in alto a destra.",
  foresta: 'Uno è finito nella Foresta Antica, in un angolo chiuso da un masso incrinato.',
  ghiaccio: 'Uno è rimasto intrappolato sul Lago Ghiacciato della grotta, in un angolo dove si arriva solo scivolando con astuzia.',
  abisso: "Uno è caduto su uno spuntone in mezzo all'Abisso delle Rovine. Ci vuole l'Arpione, e anche per tornare indietro.",
  cripta: 'Uno brilla nel buio della Cripta Nascosta... ma si mostra soltanto alla luce di una lanterna.',
};
/* fiori che sbocciano davanti alle Rovine quando il giardino è piantato */
const GARDEN_FLOWERS = [[1, 6], [2, 6], [13, 6], [14, 6], [1, 7], [5, 7], [10, 7], [1, 8], [4, 8], [11, 8], [14, 8], [3, 9], [12, 9], [4, 5], [11, 5]];

function plantGarden(g) {
  const f = g.s.flags;
  f.garden = true;
  for (const [x, y] of GARDEN_FLOWERS) if (g.roomId === 'o:1,0') g.tiles[y][x] = 'F';
  if (g.roomId === 'o:1,0') {
    g.redrawBg(); g.shake = 6;
    for (const [x, y] of GARDEN_FLOWERS) g.puff(x * TS + 8, y * TS + 8, '#ffe070');
  }
  Sound.sfx('victory');
  g.saveGame();
}

/* Ciclo 3: il Re dei Rovi sconfitto torna a essere Ortensio, il giardiniere del tempio.
 * Ciclo 4: dopo la vittoria affida a Lio la ricerca dei Semi dell'Alba. */
const GARDENER_TALK = g => {
  const f = g.s.flags, n = seedCount(g), N = SEED_IDS.length;
  if (!f.victory) return ['Ortensio: Il Cuore di Vesper è lì, ragazzo. Riportalo alla luce: io ho già fatto abbastanza danni.'];
  if (f.garden) return [
    "Ortensio: Guarda come splende l'Albero dell'Alba! Il giardino del tempio non è mai stato così bello.",
    'Ortensio: Questa volta lo coltiverò per tutti, non solo per me. Grazie di tutto, Lio.',
  ];
  const out = [];
  if (!f.seedQuest) {
    out.push(
      'Ortensio: Guarda come crescono i fiori, ora che il sole è tornato... ma il giardino del tempio resta spoglio.',
      "Ortensio: Quando ho rubato il Cuore di Vesper, i suoi cinque SEMI DELL'ALBA si sono sparsi per la valle.",
      'Ortensio: Se tu me li riportassi, potrei piantarli qui, davanti alle Rovine. Sarebbe il mio modo di chiedere scusa alla valle.',
      g => { g.s.flags.seedQuest = true; },
    );
  }
  if (n >= N) return out.concat([
    'Ortensio: Ma... li hai trovati tutti e cinque! Dammeli, presto, prima che il sole scenda!',
    g => plantGarden(g),
    "I semi affondano nella terra... e in un istante il giardino del tempio esplode di fiori dorati! Al centro, sboccia l'ALBERO DELL'ALBA.",
    "Ortensio: Ah! Non vedevo una cosa così bella da... da prima del crepuscolo. Tieni, ragazzo: l'albero ha qualcosa per te.",
    "Un raggio dorato scende dall'albero e avvolge la tua spada...",
    ...g.giveItem('dawnsword'),   // Ciclo 55: dono creato subito (non «pigro» dentro una funzione), così resume.js lo dà anche se si salva prima del suo turno (plantGarden, qui sopra, salva: la spada si perdeva)
    "Ortensio: La luce dell'alba ora vive nella tua lama. Che illumini sempre il tuo cammino.",
    g => {   // Ciclo 6: a dialogo chiuso parte l'epilogo (js/story.js)
      const d = g.dialog, prev = d.onClose;
      d.onClose = () => { if (prev) prev(); g.startEpilogue(); };
    },
  ]);
  const missing = SEED_IDS.find(id => !f['seed:' + id]);
  return out.concat([
    n ? 'Ortensio: Hai già ' + n + ' semi su ' + N + '! Ne mancano ' + (N - n) + '.' : 'Ortensio: Non hai ancora nessun seme? Non scoraggiarti.',
    'Ortensio: ' + SEED_HINTS[missing],
  ]);
};
const GARDENER_BOSS = { id: 'ortensio', sprite: 'gardener', x: 7, y: 5, talk: GARDENER_TALK };
const GARDENER_REDEMPTION = [
  "Le spine si sbriciolano una dopo l'altra... Al posto del Re dei Rovi, a terra, c'è un vecchio dalla barba bianca.",
  "Ortensio: Io... dove sono? Ricordo soltanto il buio... e l'invidia.",
  "Ortensio: Ero Ortensio, il giardiniere del tempio. Volevo che il mio giardino fosse l'unica luce della valle...",
  'Ortensio: Così ho rubato il Cuore di Vesper. E il crepuscolo, piano piano, mi ha divorato.',
  "Ortensio: Mi hai liberato, ragazzo. Prendi il cristallo e riporta l'alba a Brinavalle. Te ne prego.",
];

/* Il crollo delle Rovine: quando Lio taglia i rovi, il Re dei Rovi sigilla la scala */
const RUBBLE = [[6, 4], [7, 4], [8, 4], [9, 4]];
function collapseRovine(g) {
  const f = g.s.flags;
  if (f.collapse || f.enteredDungeon) return;
  f.collapse = true;
  for (const [x, y] of RUBBLE) {
    g.tiles[y][x] = 'Q';
    for (let i = 0; i < 10; i++) g.particles.push(new Particle(x * TS + Math.random() * 16, y * TS - 30 + Math.random() * 20, (Math.random() - 0.5) * 0.6, 2 + Math.random() * 2, 18, i % 2 ? '#8a8a92' : '#5a5060', 2, 0.1));
  }
  g.redrawBg(); g.shake = 40; Sound.sfx('crumble'); Sound.sfx('roar');
  g.saveGame();
  g.say([
    'Un boato squarcia il silenzio! Enormi massi precipitano davanti alla scala delle Rovine!',
    'Re dei Rovi: Ah ah ah! Credevi che bastasse una spada? Il mio trono ora è sigillato per sempre!',
    'Le macerie bloccano la scala. La spada non basterà: servirebbe qualcosa di esplosivo...',
    "Forse l'eremita Silvano, nella radura qui a est, sa cosa fare.",
  ]);
}

/* Obiettivo mostrato nel menu di pausa */
function currentObjective(g) {
  const f = g.s.flags, it = g.s.items;
  let o;
  if (f.victory) o = 'Brinavalle è salva! Esplora la valle.';
  else if (!f.intro) o = "Parla con l'Anziano Teodoro.";
  else if (!it.sword) o = 'Recupera la Spada di Brina nel Santuario, a nord-ovest del villaggio.';
  else if (!f.collapse && !f.enteredDungeon) o = 'Taglia i rovi che sigillano le Rovine di Vesper, a nord del Crocevia.';
  else if (!it.bombs && !f.enteredDungeon) o = f.caveEntered
    ? 'Esplora la Grotta di Brina e trova le bombe dei minatori.'
    : "Un crollo ha sepolto l'ingresso delle Rovine! Cerca delle bombe nella Grotta di Brina, nei Campi a est del villaggio.";
  else if (!f.enteredDungeon) o = 'Torna alle Rovine e fai saltare le macerie con una bomba (' + bombKey() + ').';
  else if (!it.hookshot && !it.bigkey) o = 'Esplora le Rovine: la Sala delle Armature, a est della Sala Centrale, custodisce un tesoro.';
  else if (!it.bigkey) o = "Usa l'Arpione per attraversare l'Abisso, a nord della Sala delle Armature, e trova la Chiave del Re.";
  else if (!f.boss) o = 'Apri la porta spinata e sconfiggi il Re dei Rovi.';
  else o = 'Recupera il Cuore di Vesper!';
  if (it.hook && !f.hookReturned) o += "  (Riporta l'Amo d'Oro a Pino, al lago.)";
  // Ciclo 42 (rifinitura, Agente B): testi più corti. In pausa l'obiettivo ha 4 righe, e qui se ne arrivava a 6 (le ultime si perdevano)
  if (f.victory && it.hookshot && !f['chest:c_islet']) o += '  (Un isolotto del lago nasconde un tesoro.)';
  if (f.victory && !f.garden) o = f.seedQuest
    ? "Trova i Semi dell'Alba (" + seedCount(g) + '/' + SEED_IDS.length + ") e portali a Ortensio, davanti alle Rovine." + (o.includes('isolotto') ? '  (Un isolotto del lago nasconde un tesoro.)' : '')
    : o + '  (Ortensio ti cerca, davanti alle Rovine.)';
  if (f.garden) o = "Il giardino dell'alba è fiorito. Brinavalle è salva: goditi la valle!";
  return o;
}

function shopMenu(g) {
  return [{
    text: 'Bortolo: Hai ' + g.s.gems + ' gemme. Cosa ti porto?',
    choices: [
      { label: g.s.items.lantern ? 'Lanterna  (venduta)' : 'Lanterna  - 25 gemme', fn: g => buy(g, 'lantern', 25) },
      { label: 'Pozione   - 10 gemme', fn: g => buy(g, 'potion', 10) },
      { label: 'Bombe x5  - 10 gemme', fn: g => buyBombs(g) },
      { label: 'Niente, grazie', fn: () => ['Bortolo: Torna quando vuoi, la bottega è sempre aperta!'] },
    ],
  }];
}
function buyBombs(g) {
  const s = g.s;
  if (!s.items.bombs) return [
    'Bortolo: Bombe? Il Re dei Rovi ha fatto sparire tutta la polvere nera della valle...',
    'Bortolo: Però i vecchi minatori ne tenevano una scorta nella GROTTA DI BRINA, nei Campi qui a est. Se trovi la loro borsa, io ti procuro le ricariche!',
  ];
  if (s.bombs >= s.maxBombs) return ['Bortolo: La tua borsa è già piena zeppa di bombe!'];
  if (s.gems < 10) return ['Bortolo: Mi spiace, non hai abbastanza gemme.'];
  s.gems -= 10;
  return g.giveItem('bombpack', 5).concat(['Bortolo: Maneggiale con cura, mi raccomando!']);
}
function buy(g, item, price) {
  if (item === 'lantern' && g.s.items.lantern) return ['Bortolo: Ne avevo una sola, ed è già tua!'];
  if (item === 'potion' && g.s.items.potion) return ['Bortolo: Puoi portare una sola pozione alla volta, ragazzo.'];
  if (g.s.gems < price) return ['Bortolo: Mi spiace, non hai abbastanza gemme. Taglia qualche cespuglio, là fuori!'];
  g.s.gems -= price;
  return g.giveItem(item).concat(['Bortolo: Grazie! Buona fortuna, Lio.']);
}

const ROOMS = {
  /* ------------------------------ MONDO ESTERNO ------------------------------ */
  'o:1,2': {
    name: 'Brinavalle', ground: 'grass', music: 'village',
    tiles: [
      'TTTTTTT::TTTTTTT',
      'T.RRRR.::.RRRR.T',
      'T.HHHH.::.HHHH.T',
      'T.HDHH.::.HHDH.T',
      '...:...::...:...',
      '::::::::::::::::',
      '..F....::....F..',
      'T,...A.::.S...,T',
      'T.F.........F..T',
      'T..,..FF..F..,.T',
      'TTTTTTTTTTTTTTTT',
    ],
    warps: { '3,3': { to: 'i:elder', x: 7, y: 8 }, '12,3': { to: 'i:shop', x: 7, y: 8 } },
    signs: {
      '10,7': ['Cartello: BRINAVALLE.  Ovest: Lago Specchio.  Est: Campi di Brina.  Nord: Crocevia.'],
      '5,7': ['Statua di Vesper, custode dell\'alba. Ai suoi piedi qualcuno ha lasciato dei fiori freschi.'],
    },
    npcs: [
      { id: 'nina', sprite: 'kid', x: 11, y: 8, wander: 2, talk: g => {
        if (g.s.flags.victory) return ['Nina: Guarda il cielo! Prima arancione, poi azzurro! Sei un vero eroe!'];
        if (g.s.flags.collapse && !g.s.items.bombs) return ['Nina: Papà lavorava nella Grotta di Brina! Dice che laggiù il ghiaccio è così liscio che, se prendi la rincorsa, non ti fermi più finché non sbatti contro qualcosa!'];
        if (g.s.items.sword) return ['Nina: Una spada vera! Prova a tagliare i cespugli: a volte nascondono gemme e cuori!'];
        return ['Nina: Lo sai che sull\'isola del Lago Specchio c\'è un forziere? Papà dice che è pieno di gemme!'];
      } },
      { id: 'marta', sprite: 'woman', x: 4, y: 6, wander: 1.5, talk: g => {
        if (g.s.flags.victory) return ['Marta: Che meraviglia sentire di nuovo il calore del sole sulla pelle!'];
        if (g.s.items.bombs) return ['Marta: Bombe?! Per carità, non farle scoppiare vicino alle case!', 'Marta: ...Però se tieni premuto il pulsante della spada, dicono che gli eroi sappiano fare un colpo rotante. Quello sì che è elegante!'];
        if (g.s.items.sword) return ['Marta: Se sei ferito, cerca i cuori nell\'erba. E ricorda: una Pozione di Bortolo può salvarti la vita!'];
        return ['Marta: Da quando è calato il crepuscolo, i mostri escono dai boschi. Fai attenzione là fuori, Lio.'];
      } },
    ],
  },
  'o:0,2': {
    name: 'Lago Specchio', ground: 'grass',
    tiles: [
      'TTTTTTT::TTTTTTT',
      'T,..~h.::.....,T',
      'T..~..~~~~~~...T',
      'T.~~~~~~~~~~~..T',
      'T.~~~....~~~~...',
      'T.~~~....=====::',
      'T.~~~h...~~~~...',
      'T.~~~~~~~~~~~..T',
      'T..~~~~~~~~~.F.T',
      'T,....F....,...T',
      'TTTTTTTTTTTTTTTT',
    ],
    chests: [{ id: 'c_lake', x: 6, y: 5, item: 'gems', n: 15 }, { id: 'c_islet', x: 4, y: 2, item: 'container' }],
    enemies: [{ type: 'slime', x: 7, y: 4 }, { type: 'slime', x: 12, y: 9 }],
    npcs: [
      { id: 'pino', sprite: 'fisherman', x: 12, y: 2, talk: g => {
        const s = g.s;
        const islet = "Pino: Quell'arpione luccica come il mio amo! Vedi l'isolotto lassù, col palo? Dall'isola grande, con quello, ci arriveresti in un lampo.";
        if (s.flags.hookReturned) return [   // Ciclo 6: la pesca (js/fishing.js)
          ...(s.items.hookshot && !s.flags['chest:c_islet'] ? [islet] : []),
          { text: 'Pino: Oggi i pesci abboccano che è una meraviglia! Vuoi provare con la mia canna?', choices: [
            { label: 'Pescare', fn: g => { g.startFishing(); return []; } },
            { label: 'Diario di pesca', fn: g => fishLogLines(g) },
            { label: 'Niente, grazie', fn: () => ['Pino: Il lago non scappa. Torna quando vuoi!'] },
          ] },
        ];
        if (s.items.hookshot && !s.flags['chest:c_islet']) return [islet];
        if (s.items.hook) return [
          "Pino: Ma quello... è il mio AMO D'ORO! L'hai trovato davvero!",
          g => { g.s.items.hook = false; g.s.flags.hookReturned = true; },
          'Pino: Tieni, anni fa ho pescato questo cristallo a forma di cuore. A te servirà più che a me.',
          ...g.giveItem('container'),   // Ciclo 55: dono creato subito (non «pigro» dentro una funzione), così resume.js lo dà anche se si salva prima del suo turno
          "Pino: E da oggi, quando vuoi, ti presto la mia canna. Dicono che al largo nuoti il leggendario LUCCIO LUNARE...",
        ];
        return [
          "Pino: Ahimè! Ho perso il mio AMO D'ORO mentre pescavo nei ruscelli della Foresta Antica.",
          'Pino: La foresta è lontana, a ovest delle Rovine. Se lo trovi, ti darò qualcosa di prezioso!',
        ];
      } },
    ],
  },
  'o:2,2': {
    name: 'Campi di Brina', ground: 'grass',
    tiles: [
      'TTTTTTT::TTTTTTT',
      'T..B...::.KKKKKT',
      'T.BB.,..:.KKCKKT',
      'T.B...F.:..rBr.T',
      '........:...:..T',
      ':::::::::::::..T',
      '......,.....,..T',
      'T..BB.....r....T',
      'T.F.B...rr..BB.T',
      'T....,......B,.T',
      'TTTTTTTTTTTTTTTT',
    ],
    warps: { '12,2': { to: 'c:1,2', x: 7, y: 8 } },
    enemies: [{ type: 'slime', x: 5, y: 6 }, { type: 'slime', x: 10, y: 3 }, { type: 'slime', x: 12, y: 6 }],
  },
  'o:0,1': {
    name: 'Santuario della Brina', ground: 'grass',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T..,.MMMMMM..,.T',
      'T....NNNNNN....T',
      'T....NNONNN....T',
      'T.A....::....A..',
      'T.....:::.......',
      'T,....:.........',
      'T..F..:..,..F..T',
      'TT....:.....,.TT',
      'TTT...::.....TTT',
      'TTTTTTT::TTTTTTT',
    ],
    warps: { '7,3': { to: 'i:shrine', x: 7, y: 8 } },
    signs: {
      '2,4': ['Una statua consumata dal tempo. Sul piedistallo: «Qui riposa la lama che non teme le spine».'],
      '13,4': ['Una statua consumata dal tempo. Sul piedistallo: «Qui riposa la lama che non teme le spine».'],
    },
  },
  'o:1,1': {
    name: 'Crocevia', ground: 'grass',
    tiles: [
      'TTTTTTT::TTTTTTT',
      'T..,...::...B..T',
      'T.rr...::.....,T',
      'T.r....::..F...T',
      '.......::.S.....',
      '::::::::::::::::',
      '.......::.......',
      'T..F...::...rr.T',
      'T.,....::....r.T',
      'T....B.::.,....T',
      'TTTTTTT::TTTTTTT',
    ],
    signs: { '10,4': ['Cartello: Nord: Rovine di Vesper.  Est: Bosco dei Rovi.  Ovest: Santuario.  Sud: Brinavalle.'] },
    enemies: [{ type: 'slime', x: 4, y: 7 }, { type: 'slime', x: 11, y: 2 }, { type: 'slime', x: 12, y: 8 }],
  },
  'o:2,1': {
    name: 'Bosco dei Rovi', ground: 'grass',
    tiles: [
      'TTTTTTT::TTTTTTT',
      'TTT....::..V.TTT',
      'TT..V..VV..,V.TT',
      'T..TT.....TT...T',
      '....T..V..T....T',
      '::..VV...V.....T',
      '....T.....T..,.T',
      'T..TT..V..TT...T',
      'TT.....VV....TTT',
      'TTT....::....TTT',
      'TTTTTTT::TTTTTTT',
    ],
    enemies: [{ type: 'plant', x: 11, y: 2 }, { type: 'plant', x: 12, y: 6 }, { type: 'plant', x: 2, y: 7 }, { type: 'slime', x: 8, y: 6 }],
    seeds: [{ id: 'bosco', x: 12, y: 1 }],
  },
  'o:2,0': {
    name: "Radura dell'Eremita", ground: 'grass',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'TTT,....F...KKKT',
      'TT....~~~...KCKT',
      'T....~~~~~..rQrT',
      '......~~~......T',
      '::.............T',
      '....F......rr..T',
      'T......,....r..T',
      'TT..F......F..TT',
      'TTT....::....TTT',
      'TTTTTTT::TTTTTTT',
    ],
    warps: { '13,2': { to: 'i:fairy', x: 7, y: 8 } },
    npcs: [
      { id: 'silvano', sprite: 'hermit', x: 10, y: 5, talk: g => {
        const f = g.s.flags, it = g.s.items;
        if (f.victory) return ['Silvano: Il giardiniere ha finalmente trovato pace. E la valle ha ritrovato la sua luce. Ben fatto.'];
        const cave = [
          'Silvano: Ho sentito il boato fin qui! Il Re ha fatto crollare l\'ingresso delle Rovine, eh?',
          'Silvano: Un tempo i minatori cavavano il ghiaccio nella GROTTA DI BRINA, nei Campi a est del villaggio. Per aprirsi la strada usavano le bombe.',
          'Silvano: Se ne è rimasta qualcuna, è laggiù. Ma attento: si dice che un GOLEM di ghiaccio custodisca la miniera.',
          'Silvano: La sua corazza è dura come la roccia... ma il ghiaccio, si sa, teme soltanto altro ghiaccio.',
        ];
        if (!f.hermitGift) return [
          'Silvano: Un visitatore! Non ne vedevo da anni.',
          "Silvano: Il Re dei Rovi un tempo era il giardiniere del tempio di Vesper. L'invidia per la luce lo ha trasformato.",
          'Silvano: Nelle Rovine c\'è una porta sigillata da una corona di spine. La sua chiave è custodita dalle armature viventi.',
          'Silvano: Prendi queste gemme. A un vecchio eremita non servono a nulla.',
          g => { g.s.flags.hermitGift = true; },
          ...g.giveItem('gems', 10),   // Ciclo 55: dono creato subito (non «pigro» dentro una funzione), così resume.js lo dà anche se si salva prima del suo turno
          g => (g.s.flags.collapse && !g.s.items.bombs ? cave : []),
        ];
        if (f.collapse && !it.bombs) return cave;
        if (it.bombs && !f['bomb:o:2,0:13,3']) return ['Silvano: Bombe! Bene. Vedi quel masso incrinato lassù, contro la roccia? Dietro c\'è una sorgente... ma non dirlo a nessuno.'];
        const tips = [
          'Silvano: Le stanze buie delle Rovine nascondono tesori. Senza una lanterna vedrai ben poco.',
          'Silvano: Il Re dei Rovi scaglia spine in cerchio. Quando si ferma a tremare, allontanati!',
          'Silvano: Quando il Re si lancia contro di te, spostati di lato: sbatterà contro il muro e resterà stordito.',
          "Silvano: La Foresta Antica, a ovest delle Rovine, è un vero labirinto. Abbi pazienza.",
          'Silvano: Tieni premuto il pulsante della spada e poi rilascialo: il fendente rotante colpisce tutto ciò che ti circonda.',
          'Silvano: Le pareti incrinate nascondono spesso passaggi segreti. Anche nelle Rovine, chissà...',
          "Silvano: Hai mai visto un seme che brilla? I SEMI DELL'ALBA venivano dal giardino del tempio. Se ne trovi, conservali.",
          'Silvano: Le spine si strappano, non si tagliano. Ricordatelo, se mai il Re dovesse indossarne una corazza.',
        ];
        if (it.hookshot && !f.boss) return ["Silvano: Un arpione! Le spine del Re si strappano, non si tagliano: aggancialo e tira con tutte le tue forze."];
        return [tips[(g.t / 60 | 0) % tips.length]];
      } },
    ],
  },
  'o:1,0': {
    name: 'Rovine di Vesper', ground: 'grass',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T.,NNNNNNNNNN,.T',
      'T..NYPPPPPPYN..T',
      'T..NPPPZPPPPN..T',
      '...NNNPPPPNNN...',
      '......VVVV......',
      '...A..:..:..A...',
      'T.....:..:.....T',
      'T.,...:..:...,.T',
      'T.....:..:.....T',
      'TTTTTTT::TTTTTTT',
    ],
    warps: { '7,3': { to: 'd:1,2', x: 7, y: 8 } },
    dyn: RUBBLE.map(([x, y]) => ({ x, y, ch: 'Q', cond: g => g.s.flags.collapse && !g.s.flags.enteredDungeon && !g.s.flags['bomb:o:1,0:' + x + ',' + y] }))
      .concat(GARDEN_FLOWERS.map(([x, y]) => ({ x, y, ch: 'F', cond: g => g.s.flags.garden }))),
    onCutRovi: g => collapseRovine(g),
    onEnter: g => {   // salvataggi vecchi: rovi già tagliati ma crollo mai avvenuto
      const f = g.s.flags;
      if (!f.collapse && !f.enteredDungeon && g.s.items.sword && [6, 7, 8, 9].some(x => f['cut:o:1,0:' + x + ',5'])) collapseRovine(g);
    },
    signs: {
      '3,6': ['Un\'iscrizione antica: «Solo la brina spezza le spine».'],
      '12,6': ['Un\'iscrizione antica: «Il giardiniere custodisce l\'alba nel suo trono di rovi».'],
    },
    enemies: [{ type: 'slime', x: 2, y: 8 }, { type: 'slime', x: 13, y: 8 }],
    npcs: [Object.assign({}, GARDENER_BOSS, { x: 4, y: 7, cond: g => g.s.flags.victory })],
    decor: [{ icon: 'dawnTree', x: 7.5, y: 7, showIfFlag: 'garden', glow: true }],
  },
  'o:0,0': {
    name: 'Foresta Antica', ground: 'grass',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T..T....T...Q.TT',
      'T.TT.TT.T.TTTT.T',
      'T....T....T....T',
      'TTT.TT.TT.T.TT..',
      'T...T...T...T...',
      'T.T.T.T.TTT.T...',
      'T.T...T.....T..T',
      'T.TTTTTTT.TTTT.T',
      'T..........B...T',
      'TTTTTTTTTTTTTTTT',
    ],
    chests: [{ id: 'c_hook', x: 1, y: 1, item: 'hook' }],
    seeds: [{ id: 'foresta', x: 13, y: 1 }],
    enemies: [{ type: 'slime', x: 6, y: 3 }, { type: 'slime', x: 11, y: 7 }, { type: 'slime', x: 3, y: 9 }],
  },

  /* --------------------------------- INTERNI --------------------------------- */
  'i:elder': {
    name: "Casa dell'Anziano", ground: 'wood', music: 'village',
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
    warps: { '7,9': { to: 'o:1,2', x: 3, y: 4 }, '8,9': { to: 'o:1,2', x: 3, y: 4 } },
    npcs: [
      { id: 'teodoro', sprite: 'elder', x: 8, y: 4, talk: g => {
        const f = g.s.flags, it = g.s.items;
        if (f.victory) return ['Teodoro: Il sole è tornato! Brinavalle non dimenticherà mai il tuo coraggio, Lio.'];
        if (!it.sword) return ['Teodoro: Il Santuario della Brina si trova a nord-ovest del villaggio. Là riposa la spada.', 'Teodoro: E passa da Bortolo, qui accanto: vende oggetti utili.'];
        if (f.collapse && !it.bombs && !f.enteredDungeon) return [
          'Teodoro: Un crollo alle Rovine? È opera del Re dei Rovi, ne sono certo.',
          'Teodoro: Nella GROTTA DI BRINA, nei Campi a est del villaggio, i minatori custodivano le loro bombe. Trovale, e nessuna roccia potrà fermarti.',
        ];
        if (!f.enteredDungeon) return ['Teodoro: La Spada di Brina ti ha scelto! Ora i rovi non potranno fermarti.', 'Teodoro: Le Rovine di Vesper sono a nord, oltre il Crocevia.'];
        return ['Teodoro: Le Rovine sono antiche e piene di insidie. Se trovi una stanza buia, una lanterna ti sarà preziosa.'];
      } },
    ],
    onEnter: g => {
      if (g.s.flags.intro) return;
      // Ciclo 10: chi ha visto il furto nel prologo non se lo sente raccontare due volte
      const story = g.s.flags.sawPrologue ? [
        'Teodoro: Lio... finalmente sei sveglio. Hai sognato di nuovo il cristallo e il giardiniere, vero?',
        'Teodoro: Purtroppo non era un sogno. Il RE DEI ROVI tiene il CUORE DI VESPER nelle Rovine, a nord, e da tre lune il sole non sorge più.',
      ] : [
        'Teodoro: Lio... finalmente sei sveglio. Vieni, ascoltami bene.',
        'Teodoro: Da tre lune il sole non sorge più su Brinavalle. Viviamo in un crepuscolo senza fine.',
        "Teodoro: Il Re dei Rovi ha rubato il CUORE DI VESPER, il cristallo che richiama l'alba, e lo ha nascosto nelle Rovine a nord.",
      ];
      g.say([
        ...story,
        'Teodoro: Io sono troppo vecchio per affrontarlo... ma tu hai il coraggio di tuo padre.',
        'Teodoro: Nel Santuario a nord-ovest riposa la SPADA DI BRINA. Solo con essa potrai tagliare i rovi che sigillano le Rovine.',
        'Teodoro: Prima di partire, passa dalla bottega di Bortolo qui accanto. E che la luce ti accompagni.',
        g => { g.s.flags.intro = true; },
        () => ['Suggerimento: muoviti con ' + moveKeys() + ', interagisci con ' + actKey() + ', apri il menu con ' + menuKey() + '.'],
      ]);
    },
  },
  'i:shop': {
    name: 'Bottega di Bortolo', ground: 'wood', music: 'village',
    tiles: [
      'XXXXXXXXXXXXXXXX',
      'XXXIIIIIIIIIIXXX',
      'XXXIkkIkkIkkIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIccccccwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIjwwwwwwjIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIIIIEEIIIIXXX',
      'XXXXXXXXXXXXXXXX',
    ],
    warps: { '7,9': { to: 'o:1,2', x: 12, y: 4 }, '8,9': { to: 'o:1,2', x: 12, y: 4 } },
    decor: [{ icon: 'lantern', x: 7, y: 4, hideIfItem: 'lantern' }, { icon: 'potion', x: 8, y: 4 }],
    npcs: [
      { id: 'bortolo', sprite: 'merchant', x: 6, y: 3, static: true, talk: g => ['Bortolo: Benvenuto nella mia bottega, Lio!', shopMenu] },
    ],
  },
  'i:shrine': {
    name: 'Santuario', ground: 'stone', music: 'title',
    tiles: [
      'XXXXXXXXXXXXXXXX',
      'XXNNNNNNNNNNNNXX',
      'XXNNNNNNNNNNNNXX',
      'XXNYppppppppYNXX',
      'XXNppppppppppNXX',
      'XXNppppppppppNXX',
      'XXNppAppppAppNXX',
      'XXNppppppppppNXX',
      'XXNYppppppppYNXX',
      'XXNNNNNEENNNNNXX',
      'XXXXXXXXXXXXXXXX',
    ],
    warps: { '7,9': { to: 'o:0,1', x: 7, y: 4 }, '8,9': { to: 'o:0,1', x: 7, y: 4 } },
    chests: [{ id: 'c_sword', x: 7, y: 4, item: 'sword' }],
    decor: [{ beam: true, x: 7, y: 4, hideIfFlag: 'chest:c_sword' }],
    signs: {
      '5,6': ['Una statua del guardiano. Sembra vegliare sul forziere.'],
      '10,6': ['Una statua del guardiano. Sembra vegliare sul forziere.'],
    },
  },

  /* ---------------------------- DUNGEON: ROVINE ---------------------------- */
  'd:1,2': {
    name: 'Rovine - Atrio', ground: 'dungeon',
    tiles: [
      'WWWWWWWPPWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPbPPPPbPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'QPPPPbPPPPbPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPUUPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    warps: { '7,9': { to: 'o:1,0', x: 7, y: 4 }, '8,9': { to: 'o:1,0', x: 7, y: 4 } },
    chests: [{ id: 'c_d_gems', x: 13, y: 1, item: 'gems', n: 5 }],
    enemies: [{ type: 'bat', x: 4, y: 4 }, { type: 'bat', x: 11, y: 6 }],
    onEnter: g => {
      if (g.s.flags.enteredDungeon) return;
      g.s.flags.enteredDungeon = true;
      g.say(["Un'aria gelida sale dalle profondità. Le Rovine di Vesper ti attendono..."]);
    },
  },
  'd:1,1': {
    name: 'Rovine - Sala Centrale', ground: 'dungeon',
    tiles: [
      'WWWWWWWGGWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPbbPPPPPPPPbbPW',
      'WPbPPPPPPPPPPbPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPL',
      'WPPPPPPPPPPPPPPW',
      'WPbPPPPPPPPPPbPW',
      'WPbbPPPPPPPPbbPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    enemies: [{ type: 'slimeBlue', x: 4, y: 5 }, { type: 'slimeBlue', x: 11, y: 5 }, { type: 'slimeBlue', x: 7, y: 8 }, { type: 'bat', x: 7, y: 3 }],
  },
  'd:0,1': {
    name: 'Rovine - Sala Buia', ground: 'dungeon', dark: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPbPPPPPPPPW',
      'WPbbPPbPPbbbbPPW',
      'WPPbPPPPPPPPbPPW',
      'WbPbbbbbPPbPbPPW',
      'WPPPPPPbPPbPPPPP',
      'WPbbbPPbPPbbbbPW',
      'WPPPbPPPPPPPPbPW',
      'WbPPbPbbbbbPPbPW',
      'WPPPPPbPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'c_key1', x: 1, y: 9, item: 'key' }],
    enemies: [{ type: 'bat', x: 8, y: 3 }, { type: 'bat', x: 5, y: 7 }, { type: 'bat', x: 12, y: 7 }],
  },
  'd:2,1': {
    name: 'Rovine - Sala delle Armature', ground: 'dungeon',
    tiles: [
      'WWWWWWWJJWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPbPPPPPPbPPPW',
      'PPPPPPPPPPPPPPPW',
      'WPPPbPPPPPPbPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    clearFlag: 'cleared:d:2,1',
    chests: [{ id: 'c_hookshot', x: 7, y: 5, item: 'hookshot', cond: g => g.s.flags['cleared:d:2,1'] }],
    shutters: [{ tiles: [[7, 0], [8, 0]], flag: 'cleared:d:2,1' }],
    enemies: [{ type: 'skeleton', x: 4, y: 3 }, { type: 'skeleton', x: 11, y: 3 }, { type: 'skeleton', x: 7, y: 8 }],
    onEnter: g => {
      if (g.s.flags['cleared:d:2,1'] || g.s.flags.armorHint) return;
      g.s.flags.armorHint = true;
      g.say(['Le armature si animano con un cigolio sinistro! Sconfiggile tutte: forse sbloccheranno la saracinesca a nord.']);
    },
  },
  'd:1,0': {
    name: 'Trono dei Rovi', ground: 'dungeon', boss: true,
    npcs: [Object.assign({}, GARDENER_BOSS, { x: 4, y: 5, cond: g => g.s.flags.boss && !g.s.flags.victory })],
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WVPPPPPPPPPPPPVW',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'WVPPPPPPPPPPPPVW',
      'WWWWWWWPPWWWWWWW',
    ],
    onEnter: g => {
      if (g.s.flags.boss) return;
      if (!g.s.flags.bossIntro) {
        g.s.flags.bossIntro = true;
        g.say([
          '???: Chi osa disturbare il mio crepuscolo eterno?',
          'Re dei Rovi: Il Cuore di Vesper è MIO! Senza l\'alba, i miei rovi copriranno ogni cosa!',
          'Re dei Rovi: Sarai concime per il mio giardino, piccolo eroe!',
        ]);
      } else g.say(['Re dei Rovi: Ancora tu? Le mie spine non hanno dimenticato il tuo sapore!']);
    },
  },
};

/* ============================ CICLO 2: nuove stanze ============================ */
Object.assign(ROOMS, {
  /* ----------------------------- interni segreti ----------------------------- */
  'i:fairy': {
    name: 'Fonte della Fata', ground: 'stone', music: 'title',
    tiles: [
      'XXXXXXXXXXXXXXXX',
      'XXNNNNNNNNNNNNXX',
      'XXNpp~~~~~~ppNXX',
      'XXNp~~~~~~~~pNXX',
      'XXNp~~~~~~~~pNXX',
      'XXNpp~~~~~~ppNXX',
      'XXNppppppppppNXX',
      'XXNYppppppppYNXX',
      'XXNppppppppppNXX',
      'XXNNNNNEENNNNNXX',
      'XXXXXXXXXXXXXXXX',
    ],
    warps: { '7,9': { to: 'o:2,0', x: 13, y: 3, dir: 0 }, '8,9': { to: 'o:2,0', x: 13, y: 3, dir: 0 } },
    npcs: [
      { id: 'fairy', sprite: 'fairy', x: 7, y: 5, static: true, talk: g => {
        const heal = g => {
          g.s.hp = g.s.maxHp; if (g.s.items.bombs) g.s.bombs = g.s.maxBombs;
          Sound.sfx('fairy'); g.puff(g.player.cx(), g.player.cy(), '#ffb0e0');
        };
        if (!g.s.flags.fairyGift) return [
          'Fata: Oh! Qualcuno ha trovato la mia fonte nascosta... e con un bel botto!',
          'Fata: Sono la Fata della Brina. Da quando il crepuscolo è calato, nessuno veniva più a trovarmi.',
          'Fata: Hai un cuore coraggioso, piccolo eroe. Lascia che lo renda ancora più grande.',
          g => { g.s.flags.fairyGift = true; },
          ...g.giveItem('container'),   // Ciclo 55: dono creato subito (non «pigro» dentro una funzione), così resume.js lo dà anche se si salva prima del suo turno
          heal,
          'Fata: Torna da me ogni volta che vorrai: le acque della fonte guariscono ogni ferita e riempiono la tua borsa di bombe.',
        ];
        if (g.s.flags.victory) return [heal, 'Fata: La luce è tornata, e con lei le farfalle. Grazie, Lio.'];
        return [heal, 'Fata: Ecco, le acque della fonte ti hanno ristorato. Vai, e che la brina ti protegga!'];
      } },
    ],
  },

  /* ------------------------- ROVINE: cripta segreta ------------------------- */
  'd:0,2': {
    name: 'Rovine - Cripta Nascosta', ground: 'dungeon', dark: true, secret: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPbPPPPPPbPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPP',   // Ciclo 16: varco sulla riga 6, come la crepa nell'Atrio (prima era sulla 5: si attraversava un muro)
      'WPPPbPPPPPPbPPPW',
      'WPYPPPPPPPPPPYPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'c_crypt', x: 2, y: 5, item: 'gems', n: 30 }],
    seeds: [{ id: 'cripta', x: 13, y: 9, needLantern: true }],
    enemies: [{ type: 'skeleton', x: 6, y: 5 }, { type: 'bat', x: 4, y: 2 }, { type: 'bat', x: 10, y: 8 }],
    onEnter: g => {
      if (g.s.flags.cryptFound) return;
      g.s.flags.cryptFound = true; Sound.sfx('secret');
      g.say(['Una cripta dimenticata, nascosta dietro la parete incrinata! Qualcosa si muove nel buio...']);
    },
  },

  /* ------------------------- GROTTA DI BRINA (dungeon 2) ------------------------- */
  'c:1,2': {
    name: 'Grotta di Brina - Ingresso', ground: 'ice',
    tiles: [
      'WWWWWWWPPWWWWWWW',
      'WxPPPPPPPPPPPPxW',
      'WPPPPPPPPPPPPPPW',
      'WPPqqqPPPPqqqPPW',
      'WPPqqqPPPPqqqPPW',
      'WPPPPPPxxPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPYPPPPPPPPPPYPW',
      'WxPPPPPPPPPPPPxW',
      'WPPPPPPUUPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    warps: { '7,9': { to: 'o:2,2', x: 12, y: 4, dir: 0 }, '8,9': { to: 'o:2,2', x: 12, y: 4, dir: 0 } },
    enemies: [{ type: 'slimeIce', x: 4, y: 6 }, { type: 'slimeIce', x: 11, y: 6 }, { type: 'batIce', x: 7, y: 3 }],
    onEnter: g => {
      if (g.s.flags.caveEntered) return;
      g.s.flags.caveEntered = true;
      g.say([
        "Un gelo pungente ti entra nelle ossa: è la GROTTA DI BRINA, l'antica miniera di ghiaccio di Brinavalle.",
        'Attento al ghiaccio! Una volta lanciato, scivolerai finché non urti qualcosa.',
      ]);
    },
  },
  'c:1,1': {
    name: 'Grotta di Brina - Sala dei Blocchi', ground: 'ice',
    tiles: [
      'WWWWWWWJJWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPxPPPPPPPPPPxPW',
      'WPPPPYPPPPYPPPPW',
      'WPPPPPPPPPPPPPPW',
      'JPPPPPPPPPPPPPPL',
      'WPPPPPPPPPPPPPPW',
      'WPPbbPPPPPPbbPPW',
      'WPP^bPPPPPPb^PPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    blocks: [[2, 4], [13, 4]],
    puzzleFlag: 'solved:c:1,1',
    shutters: [{ tiles: [[0, 5]], flag: 'solved:c:1,1' }, { tiles: [[7, 0], [8, 0]], flag: 'cleared:c:2,1' }],
    enemies: [{ type: 'batIce', x: 7, y: 6 }],
    onEnter: g => {
      if (g.s.flags.blocksHint) return;
      g.s.flags.blocksHint = true;
      g.say([
        'Due piastre nel pavimento... e due blocchi di pietra con delle frecce incise. Forse si possono spingere.',
        'Suggerimento: se un blocco si incastra, esci e rientra nella stanza: tornerà al suo posto.',
      ]);
    },
  },
  'c:0,1': {
    name: 'Grotta di Brina - Lago Ghiacciato', ground: 'ice',
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPxqqqqqqqqqqxW',
      'WPPqqqqqxqqqqqqW',
      'WxqqqqqqqqqqqxqW',
      'WqqqqxqqqqqqqqqW',
      'WqqqqqqqqqxqqqPP',
      'WqqxqqqqqqqqqqPW',
      'WqqqqqqqxqqqqqqW',
      'WqqqqqqqqqqqxqqW',
      'WxqqqqxqqqqqqqqW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'c_cavekey', x: 1, y: 1, item: 'key' }],
    seeds: [{ id: 'ghiaccio', x: 1, y: 8 }],   // raggiungibile solo fermandosi lì (7 mosse, verificato col risolutore)
    onEnter: g => {
      if (g.s.flags.lakeHint) return;
      g.s.flags.lakeHint = true;
      g.say(['Un lago completamente ghiacciato. Su un isolotto, laggiù in fondo, luccica un forziere...']);
    },
  },
  'c:2,1': {
    name: 'Grotta di Brina - Sala delle Lame', ground: 'ice',
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPxPPPPPPPPPPxPW',
      'WPPPPPPqqPPPPPPW',
      'WPPPPPqqqqPPPPPW',
      'PPPPPPqqqqPPPPPW',
      'WPPPPPqqqqPPPPPW',
      'WPPPPPPqqPPPPPPW',
      'WPxPPPPPPPPPPxPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    clearFlag: 'cleared:c:2,1',
    chests: [{ id: 'c_cave_gems', x: 13, y: 5, item: 'gems', n: 15, cond: g => g.s.flags['cleared:c:2,1'] }],
    enemies: [
      { type: 'blade', x: 1, y: 1 }, { type: 'blade', x: 14, y: 9 },
      { type: 'slimeIce', x: 4, y: 3 }, { type: 'slimeIce', x: 11, y: 3 }, { type: 'slimeIce', x: 11, y: 7 },
      { type: 'batIce', x: 7, y: 2 }, { type: 'batIce', x: 8, y: 8 },
    ],
    onClear: g => g.say(['Un clangore metallico rimbomba nella grotta... Da qualche parte, una saracinesca si è sollevata!']),
    onEnter: g => {
      if (g.s.flags['cleared:c:2,1'] || g.s.flags.bladeHint) return;
      g.s.flags.bladeHint = true;
      g.say(['Lame di ghiaccio negli angoli! Scattano appena ti allineano: nemmeno la spada può scalfirle.']);
    },
  },
  'c:1,0': {
    name: 'Grotta di Brina - Antro del Golem', ground: 'ice', boss: 'golem', bossFlag: 'golem', afterMusic: 'cave',
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WxPPPPPPPPPPPPxW',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'QPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'WxPPPPPPPPPPPPxW',
      'WWWWWWWPPWWWWWWW',
    ],
    chests: [{ id: 'c_bombs', x: 7, y: 3, item: 'bombs', cond: g => g.s.flags.golem }],
    onEnter: g => {
      const f = g.s.flags;
      if (f.golem) return;
      if (!f.golemIntro) {
        f.golemIntro = true;
        g.say([
          "Il pavimento trema... Un enorme GOLEM DI BRINA si stacca dalla parete di ghiaccio!",
          'La sua corazza sembra impenetrabile. Ricorda le parole di Silvano: il ghiaccio teme soltanto altro ghiaccio...',
        ]);
      } else g.say(['Il Golem di Brina si ricompone, pezzo dopo pezzo...']);
    },
  },
  'c:0,0': {
    name: 'Grotta di Brina - Rifugio dei Minatori', ground: 'ice', secret: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WxPPPPPPPPPPPPxW',
      'WPPYPPPPPPPPYPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPbPPPPbPPPPW',
      'WPPPPPPPPPPPPPPP',
      'WPPPPbPPPPbPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPYPPPPPPPPYPPW',
      'WxPPPPPPPPPPPPxW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'c_bigbag', x: 7, y: 3, item: 'bigbag' }, { id: 'c_miners', x: 7, y: 7, item: 'gems', n: 25 }],
    signs: {
      '5,4': ['Inciso nella pietra: «Squadra dei minatori di Brinavalle. Chi trova la nostra borsa ne faccia buon uso.»'],
      '10,4': ['Inciso nella pietra: «Il golem custodisce la miniera. Non sfidarlo a colpi di spada: rispediscigli i suoi massi!»'],
    },
    onEnter: g => {
      if (g.s.flags.minersFound) return;
      g.s.flags.minersFound = true; Sound.sfx('secret');
      g.say(['Un rifugio segreto dei minatori, rimasto sigillato per anni!']);
    },
  },
});

/* ============================ CICLO 3: nuove stanze ============================ */
Object.assign(ROOMS, {
  /* L'Abisso: si attraversa solo con l'Arpione.
   * Percorso: riva sud -> (su) palo dell'isolotto -> (sinistra) palo della sponda ovest
   * -> a piedi fino alla sponda nord e al forziere. Ritorno: dalla sponda nord, colonna 13, (giù) al palo sud. */
  'd:2,0': {
    name: "Rovine - L'Abisso", ground: 'dungeon',
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPYPPPPPPYPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPP____________W',
      'WPP___PhP______W',
      'WhP___PPP__h___W',
      'W_____PPP__P___W',
      'W______________W',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPhPhPW',
      'WWWWWWWPPWWWWWWW',
    ],
    chests: [{ id: 'c_bigkey', x: 8, y: 1, item: 'bigkey' }],
    seeds: [{ id: 'abisso', x: 11, y: 6 }],
    enemies: [{ type: 'bat', x: 10, y: 5 }, { type: 'bat', x: 4, y: 7 }, { type: 'skeleton', x: 3, y: 8 }],
    onEnter: g => {
      if (g.s.flags.abyssHint) return;
      g.s.flags.abyssHint = true;
      g.say([
        "Un baratro senza fondo divide la sala. Sull'altra sponda, un forziere dorato...",
        g.s.items.hookshot
          ? "Quei pali con l'anello d'oro sono fatti apposta per l'Arpione! Mettiti di fronte a un palo e premi " + bombKey() + '.'
          : 'Senza un modo per volare oltre il vuoto, non si va da nessuna parte.',
      ]);
    },
  },
});

/* Per comodità: posizione di partenza di una nuova partita */
const START = { room: 'i:elder', x: 7, y: 6 };
