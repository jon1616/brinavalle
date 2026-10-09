'use strict';
/* =====================================================================
 *  NORTH — Ciclo 30 (Agente B, seconda manche): CAPITOLO II, «LA NEBBIA GRIGIA».
 *  Dopo la festa del ritorno, a Brinavalle arriva ILDE, staffetta di
 *  PIETRABIANCA, il villaggio oltre il Valico: da tre lune una Nebbia Grigia
 *  scende dalla TORRE DEL SILENZIO, e le tre CAMPANELLE D'ARGENTO, che coi
 *  loro rintocchi la tenevano lontana, sono sparite in una notte.
 *  · Nuova regione «n:» (il Nord), 6 stanze innevate e nebbiose + 2 interni:
 *      n:1,2 Valico delle Nebbie   (dalla Radura dell'Eremita, scala a nord)
 *      n:1,1 Pietrabianca          (villaggio: campanile e locanda)
 *      n:0,1 Lago Grigio           (campanella su un'isola: arpione o nuoto)
 *      n:2,1 Pineta Ghiacciata     (campanella dietro una roccia incrinata: bombe)
 *      n:2,0 Cima del Vento        (campanella al guardiano: sconfiggi tutti)
 *      n:1,0 Soglia della Torre    (il portone della Torre del Silenzio)
 *  · LA NEBBIA: finché le campane tacciono, nel Nord si vede solo intorno a
 *    Lio (più lontano con la lanterna). Riportate le tre campanelle al
 *    campanaro GUALTIERO, le campane suonano: la nebbia si dirada e il
 *    portone della Torre si apre (il dungeon della Torre, prefisso t:, è il
 *    prossimo capitolo: il portone porta a 't:1,2' appena esiste).
 *  Flag: northCall (sentita Ilde), northArrived, chest:n_bell_lago /
 *  n_bell_pineta / n_bell_cima, northBells (campane suonate).
 * ===================================================================== */
const NORTH_BELLS = [
  { id: 'n_bell_lago', room: 'n:0,1', where: 'il Lago Grigio' },
  { id: 'n_bell_pineta', room: 'n:2,1', where: 'la Pineta Ghiacciata' },
  { id: 'n_bell_cima', room: 'n:2,0', where: 'la Cima del Vento' },
];
const bellCount = g => NORTH_BELLS.filter(b => g.s.flags['chest:' + b.id]).length;
const TOWER_ROOM = 't:1,2';   // il primo piano della Torre (lo costruisce il prossimo capitolo)

ITEMS.bell = { name: "Campanella d'Argento", text: () => "Hai trovato una CAMPANELLA D'ARGENTO! Tintinna appena, come se avesse freddo. (" + bellCount(Game) + '/3) Portala a Gualtiero, a Pietrabianca.' };
PEOPLE.ilde = { h: '#c8d8e8', s: '#f0c8a8', x: '#5a8ab8', c: '#4a6a9a', d: '#34507a', p: '#3a3a4a', b: '#2a1a10' };
PEOPLE.berta = { h: '#7a3a2a', s: '#e8b890', x: '#e8d8a0', c: '#7a5a9a', d: '#5a3a7a', p: '#4a3a2a', b: '#2a1a10' };
PEOPLE.bellman = { h: '#d8d8e0', s: '#e0b088', x: '#a0a0b0', c: '#5a5a6a', d: '#3a3a4a', p: '#3a3a4a', b: '#2a1a10', beard: true };
for (const k of ['ilde', 'berta', 'bellman']) SPR.people[k] = buildHumanoid(PEOPLE[k]);

(function northArt() {
  const mk = (rows, pal) => spriteFromRows(rows, Object.assign({ o: '#1a1420' }, pal));
  ICON.bell = mk(['...o...', '..ooo..', '.owwwo.', '.owwso.', '.owwso.', 'owwwwso', 'ooooooo', '...o...'], { w: '#f4f4ff', s: '#a8a8c8' });
  // il terreno di neve, e la neve su erba, ciuffi e pini (solo dove la stanza è 'snow')
  Ground.snow = (P, r) => {
    P.r(0, 0, 16, 16, '#dde6f0');
    for (let i = 0; i < 14; i++) P.p(r() * 16, r() * 16, '#c8d4e4');
    for (let i = 0; i < 5; i++) P.p(r() * 16, r() * 16, '#ffffff');
  };
  const grassOnly = TilePaint['.'];
  TilePaint['.'] = (P, r, e) => e && e.ground === 'snow' ? Ground.snow(P, r) : grassOnly(P, r, e);
  const tuft = TilePaint[','];
  TilePaint[','] = (P, r, e) => {
    if (!e || e.ground !== 'snow') return tuft(P, r, e);
    Ground.snow(P, r);
    for (let k = 0; k < 3; k++) { const x = 3 + (r() * 10 | 0), y = 6 + (r() * 8 | 0); P.p(x, y, '#7a8a6a'); P.p(x - 1, y - 1, '#7a8a6a'); P.p(x + 1, y - 1, '#7a8a6a'); P.p(x, y - 2, '#9aaa8a'); }
  };
  const tree = TilePaint['T'];
  TilePaint['T'] = (P, r, e) => {   // pino innevato: stessa chioma, terreno di neve e un cappuccio bianco
    if (!e || e.ground !== 'snow') return tree(P, r, e);
    Ground.snow(P, r);
    P.r(3, 13, 10, 3, '#b4c0d2');
    P.r(6, 10, 4, 6, '#6b4423'); P.r(6, 10, 1, 6, '#4a2e16'); P.r(9, 10, 1, 6, '#8a5a30');
    for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, (y - 6.5) * 1.05);
      if (d < 7.6) P.p(x, y, d > 6.6 ? '#173a2a' : r() < 0.12 ? '#1e4a34' : Math.hypot(x - 5, y - 4) < 5 ? '#3a7a52' : '#2a5e40');
    }
    for (let x = 2; x < 14; x++) { const top = Math.round(1 + Math.abs(x - 7.5) * 0.7); for (let y = top; y < top + 2 + (r() < 0.4 ? 1 : 0); y++) if (Math.hypot(x - 7.5, (y - 6.5) * 1.05) < 7.4) P.p(x, y, y === top ? '#ffffff' : '#e4ecf6'); }
  };
})();

/* --------------------------------- le stanze --------------------------------- */
Object.assign(ROOMS, {
  'n:1,2': {
    name: 'Valico delle Nebbie', ground: 'snow', music: 'cave',
    tiles: [
      'TTTTTTT..TTTTTTT',
      'TT,....::....,TT',
      'T...KK.::.KK...T',
      'T..KKK.::.KKK..T',
      'T.....r::r.....T',
      'T,.....::......T',
      'T..KK..::..KK.,T',
      'T..K...::...K..T',
      'T.,....::....,.T',
      'T......Z.......T',
      'TTTTTTTTTTTTTTTT',
    ],
    warps: { '7,9': { to: 'o:2,0', x: 5, y: 2, dir: 0 } },
    enemies: [{ type: 'batIce', x: 4, y: 4 }, { type: 'batIce', x: 11, y: 5 }, { type: 'slimeIce', x: 2, y: 5 }],
    signs: { '6,4': ['«PIETRABIANCA ↑». Sotto, inciso più piccolo: «Chi ha perso la strada, ascolti le campane».'] },
    onEnter: g => {
      if (g.s.flags.northPass) return;
      g.s.flags.northPass = true;
      g.say([
        'Il sentiero sale tra le rocce, e l\'aria si fa bianca. Non è neve: è NEBBIA, fitta come latte.',
        'Riesci a vedere solo pochi passi davanti a te. Da qualche parte, lassù, dovrebbe esserci Pietrabianca.',
      ]);
    },
  },
  'n:1,1': {
    name: 'Pietrabianca', ground: 'snow', music: 'village',
    tiles: [
      'TTTTTTT..TTTTTTT',
      'T.RRRR.::.RRRR.T',
      'T.HHHH.::.HHHH.T',
      'T.HDHH.::.HHDH.T',
      'T...:..::...:..T',
      '::::::::::::::::',
      'T.,....::....,.T',
      'T..A...::...A..T',
      'T......::......T',
      'T,.....::.....,T',
      'TTTTTTT..TTTTTTT',
    ],
    warps: { '3,3': { to: 'i:campanile', x: 7, y: 8 }, '12,3': { to: 'i:locanda', x: 7, y: 8 } },
    signs: { '4,3': ['Il campanile di Pietrabianca. La porta cigola: dentro si sente qualcuno che sospira.'], '11,3': ['«LOCANDA DEL FOCOLARE». Zuppa calda, letti caldi, chiacchiere calde.'] },
    npcs: [
      { id: 'berta', sprite: 'berta', x: 5, y: 6, talk: g => {
        const f = g.s.flags, n = bellCount(g);
        if (f.northBells) return ['Berta: Senti come suonano! Pietrabianca respira di nuovo. Sei il benvenuto qui, Lio, finché vorrai.', 'Berta: Ma la Torre... quel portone aperto non mi piace. Se entri, torna da noi.'];
        if (!f.bertaHello) return [
          'Berta: Un viaggiatore, con questa nebbia? Sei... il ragazzo di Brinavalle! Ilde ce l\'ha fatta, allora.',
          'Berta: Sono Berta, la sindaca. Da quando le campanelle sono sparite, chi esce dal villaggio non trova più la via del ritorno.',
          'Berta: Due pastori sono tornati dopo tre giorni, e non ricordavano nemmeno il proprio nome. La nebbia non ti perde soltanto: ti SVUOTA.',
          'Berta: Gualtiero, il campanaro, sa dove sono finite. Lo trovi nel campanile, la casa a ovest.',
          g2 => { g2.s.flags.bertaHello = true; },
        ];
        return ['Berta: Le campanelle: ' + n + ' su 3. Gualtiero conta i minuti. Coraggio.'];
      } },
      { id: 'tobi', sprite: 'kid', x: 10, y: 8, talk: g => {
        const f = g.s.flags;
        if (f.northBells) return ['Tobi: Ora che le campane suonano, la mamma mi lascia uscire di nuovo! Facciamo a palle di neve?'];
        const lines = [
          'Tobi: Io le ho viste, le ombre! Volavano verso il lago, verso la pineta e su, su, verso la cima. Ognuna con una campanella.',
          'Tobi: Al Lago Grigio c\'è un\'isola con un palo, come quelli dei pescatori. Ma il ghiaccio è sottile: nessuno ci va più.',
          'Tobi: Nella pineta c\'è una roccia spaccata. Il nonno dice che i minatori le facevano saltare con le BOMBE.',
          'Tobi: Sulla Cima del Vento ci sono le armature che marciano da sole. Brr.',
        ];
        return [lines[(f.tobiIdx = ((f.tobiIdx || 0) + 1) % lines.length)]];
      } },
      { id: 'ilde_n', sprite: 'ilde', x: 8, y: 4, cond: g => g.s.flags.northArrived, talk: g => g.s.flags.northBells
        ? ['Ilde: Ce l\'abbiamo fatta, Lio. Domani riprendo le mie corse: porterò a Brinavalle la notizia, e una campanella in regalo per Teodoro.']
        : ['Ilde: Ce l\'ho fatta a tornare, seguendo la tua scia. Ora tocca alle campanelle: Gualtiero ti dirà tutto.'] },
    ],
    onEnter: g => {
      if (g.s.flags.northArrived) return;
      g.s.flags.northArrived = true;
      g.say(['Tra la nebbia spuntano tetti bianchi e un campanile muto: PIETRABIANCA.', 'Le finestre sono chiuse, le strade deserte. Solo una donna, davanti alle case, scruta la nebbia come se aspettasse qualcuno.']);
    },
  },
  'n:0,1': {
    name: 'Lago Grigio', ground: 'snow', music: 'cave',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'T,....TTT.....,T',
      'T..~~~~~~~~~~..T',
      'T.~~~~~~~~~~~..T',
      'T.~~~...~~~~...T',
      'T.~~~.h.~~~~...:',
      'T.~~~...~~~~.h.T',
      'T.~~~~~~~~~~~..T',
      'T..~~~~~~~~~...T',
      'T,.....,.......T',
      'TTTTTTTTTTTTTTTT',
    ],
    chests: [{ id: 'n_bell_lago', x: 5, y: 5, item: 'bell' }],
    enemies: [{ type: 'slimeIce', x: 3, y: 9 }, { type: 'batIce', x: 13, y: 2 }],
    signs: { '15,8': ['Sul cartello, quasi cancellato dal gelo: «Pescatori: usate i pali per raggiungere l\'isola».'] },
  },
  'n:2,1': {
    name: 'Pineta Ghiacciata', ground: 'snow', music: 'cave',
    tiles: [
      'TTTTTTT..TTTTTTT',
      'T...T...:...TT.T',
      'T.T.T.TT:TT.T..T',
      'T.T...T.:....TQT',
      'T.TTT.T.:.TT...T',
      '........:......T',   // Ciclo 31 (Agente A): a est non c'è nessuna stanza (T16 vedeva un varco verso il nulla)
      'T.TT.TTT:TTT.T.T',
      'T..T.....,...T.T',
      'T.TT.TT.TTT.TT.T',
      'T,....T.......,T',
      'TTTTTTTTTTTTTTTT',
    ],
    chests: [{ id: 'n_bell_pineta', x: 14, y: 1, item: 'bell' }],
    enemies: [{ type: 'skeleton', x: 8, y: 7 }, { type: 'slimeIce', x: 3, y: 1 }, { type: 'slimeIce', x: 12, y: 9 }],
  },
  'n:2,0': {
    name: 'Cima del Vento', ground: 'snow', music: 'dungeon',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'TKKKKK....KKKKKT',
      'TKK..........KKT',
      'TK..r......r..KT',
      'T..............T',
      'T.....KK.......T',
      'T..............T',
      'TK..r......r..KT',
      'TKK..........KKT',
      'TKKKKKK..KKKKKKT',
      'TTTTTTT..TTTTTTT',
    ],
    clearFlag: 'cleared:n:2,0',
    chests: [{ id: 'n_bell_cima', x: 7, y: 2, item: 'bell', cond: g => g.s.flags['cleared:n:2,0'] }],
    enemies: [{ type: 'skeleton', x: 4, y: 5 }, { type: 'skeleton', x: 11, y: 5 }, { type: 'batIce', x: 7, y: 3 }, { type: 'batIce', x: 8, y: 7 }],
    onEnter: g => {
      if (g.s.flags['cleared:n:2,0'] || g.s.flags.northCima) return;
      g.s.flags.northCima = true;
      g.say(['Il vento urla tra le rocce. In mezzo alla nebbia, armature vuote montano la guardia a qualcosa che tintinna...']);
    },
  },
  'n:1,0': {
    name: 'Soglia della Torre', ground: 'snow', music: 'temple',
    tiles: [
      'TTTTTTTTTTTTTTTT',
      'TKKKNNNNNNNNKKKT',
      'TKKKNYPJJPYNKKKT',
      'TKK.NNNPPNNN.KKT',
      'T...r..::..r...T',
      'T,.....::.....,T',
      'T..A...::...A..T',
      'T......::......T',
      'T.,....::....,.T',
      'T......::......T',
      'TTTTTTT..TTTTTTT',
    ],
    signs: { '4,4': ['Sulla pietra, una scritta antica: «Qui il suono finisce. Qui comincia il Silenzio».'] },
    onEnter: g => {
      const f = g.s.flags;
      if (f.northBells && !f.towerSeen) {
        f.towerSeen = true;
        g.say(['Senza la nebbia la vedi tutta: la TORRE DEL SILENZIO, nera e altissima, senza finestre.', 'Il portone, sigillato da un gelo nero, si è socchiuso all\'ultimo rintocco. Dall\'interno non viene alcun suono. Nemmeno il vento.']);
      } else if (!f.northBells && !f.towerFog) {
        f.towerFog = true;
        g.say(['Una sagoma enorme si alza nella nebbia: una torre. Il portone è sigillato da un gelo nero che brucia le dita.', 'Più ti avvicini, più i rumori svaniscono. Perfino i tuoi passi non fanno più rumore.']);
      }
    },
  },
  'i:campanile': {
    name: 'Il campanile di Pietrabianca', ground: 'wood', music: 'village',
    tiles: [
      'XXXXXXXXXXXXXXXX',
      'XXXIIIIIIIIIIXXX',
      'XXXIkkIIIIkkIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwjIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIIIIEEIIIIXXX',
      'XXXXXXXXXXXXXXXX',
    ],
    warps: { '7,9': { to: 'n:1,1', x: 3, y: 4 }, '8,9': { to: 'n:1,1', x: 3, y: 4 } },
    npcs: [{ id: 'gualtiero', sprite: 'bellman', x: 8, y: 4, talk: g => gualtieroTalk(g) }],
  },
  'i:locanda': {
    name: 'Locanda del Focolare', ground: 'wood', music: 'village',
    tiles: [
      'XXXXXXXXXXXXXXXX',
      'XXXIIIIIIIIIIXXX',
      'XXXIkkIIIIkkIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwtwwwwtwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIwwwwwwwwIXXX',
      'XXXIIIIEEIIIIXXX',
      'XXXXXXXXXXXXXXXX',
    ],
    warps: { '7,9': { to: 'n:1,1', x: 12, y: 4 }, '8,9': { to: 'n:1,1', x: 12, y: 4 } },
    npcs: [{ id: 'rufo', sprite: 'merchant', x: 8, y: 3, talk: g => [{ text: 'Rufo: Benvenuto alla Locanda del Focolare! Una scodella di zuppa di rape ti rimette in piedi: 5 gemme.', choices: [
      { label: 'Zuppa - 5 gemme', fn: g2 => {
        if (g2.s.hp >= g2.s.maxHp) return ['Rufo: Sei già in forma! Torna quando la nebbia ti avrà morso un po\'.'];
        if (g2.s.gems < 5) return ['Rufo: Niente gemme, niente zuppa... e va bene, per stavolta offre la casa. Ma non dirlo a Berta!', g3 => { g3.s.hp = g3.s.maxHp; Sound.sfx('heart'); }];
        return [g3 => { g3.s.gems -= 5; g3.s.hp = g3.s.maxHp; Sound.sfx('heart'); }, 'Rufo: Ecco! Bollente. Senti come ritornano le forze?'];
      } },
      { label: 'Notizie', fn: g2 => [ruffoRumor(g2)] },
      { label: 'Una stanza', fn: () => [{ text: 'Rufo: La stanza sopra il focolare è la più calda del Nord. Quando ti sveglio?', choices: restChoices('Sprofondi sotto tre coperte di lana... e ti svegli riposato.', 'Niente', 'Rufo: La stanza resta calda.') }] },   // Ciclo 56
      { label: 'Niente', fn: () => ['Rufo: Il focolare resta acceso. Torna quando vuoi.'] },
    ] }] }],
  },
});

function ruffoRumor(g) {
  const f = g.s.flags;
  if (f.northBells) return 'Rufo: Dicono che nella Torre ci siano sale piene di campane che non suonano, e una voce che canta senza fare rumore. Io resto qui, al caldo.';
  const r = [
    'Rufo: La Signora delle Nebbie? Le nonne raccontano che un tempo cantava per Vesper. Poi Vesper scelse la luce del Cuore, e lei scelse il silenzio.',
    'Rufo: La nebbia si mangia i ricordi, dicono. I due pastori tornati dalla Cima non sapevano più come si chiamavano le loro capre.',
    'Rufo: Con una lanterna nella nebbia si vede un po\' più lontano. Bortolo, a Brinavalle, ne vendeva di ottime.',
    'Rufo: Gualtiero non dorme da quando le campanelle sono sparite. Ogni notte sale in cima e guarda il buio.',
  ];
  return r[(f.rufoIdx = ((f.rufoIdx || 0) + 1) % r.length)];
}

function gualtieroTalk(g) {
  const f = g.s.flags, n = bellCount(g), hung = f.bellsHung || 0;
  if (f.northBells) return [
    'Gualtiero: Le senti? Tre voci d\'argento, di nuovo insieme. Non le avevo mai sentite così belle.',
    'Gualtiero: La Torre ha aperto il portone. È un invito, Lio... o una trappola. Lei ti sta aspettando.',
  ];
  if (!f.bellmanHello) return [
    'Gualtiero: Chi... ah, sei tu, il ragazzo di Brinavalle. Ilde mi ha detto che hai sconfitto il Re dei Rovi.',
    'Gualtiero: Allora ascolta. Le nostre campane hanno tre campanelle d\'argento che le fanno cantare. Una notte, tre ombre le hanno strappate via.',
    'Gualtiero: Una è volata verso IL LAGO GRIGIO, a ovest. Una verso LA PINETA GHIACCIATA, a est. L\'ultima su, verso LA CIMA DEL VENTO, oltre la pineta.',
    'Gualtiero: Le ombre servono la SIGNORA DELLE NEBBIE, che vive nella Torre del Silenzio, a nord del villaggio.',
    'Gualtiero: Fu lei a dare al vostro Re dei Rovi i semi delle spine, lo sapevi? Le radici sotto il trono venivano da quassù.',
    'Gualtiero: Riportami le campanelle, e Pietrabianca tornerà a cantare.',
    g2 => { g2.s.flags.bellmanHello = true; },
    ...(n ? [g2 => gualtieroTalk(g2)] : []),
  ];
  if (n > hung) {
    const out = ['Gualtiero: ' + (n - hung === 1 ? 'Una campanella!' : 'Le campanelle!') + ' Sento già il loro freddo argento cantare... Le appendo subito. (' + n + '/3)', g2 => { g2.s.flags.bellsHung = n; Sound.sfx('chest'); }];
    if (n === 3) out.push(
      'Gualtiero: Tutte e tre. Tieniti forte, ragazzo: salgo a suonare.',
      g2 => { ringBells(g2); },
      'DONG... DONG... DONG... I rintocchi rotolano giù per la valle, e la nebbia si ritira come un\'onda.',
      'Gualtiero: Guarda fuori! Il villaggio, i boschi, la Cima... si vede tutto! E là in fondo, a nord... il portone della Torre si è aperto.',
      ...g.giveItem('gems', 50),
    );
    else out.push('Gualtiero: Ne mancano ' + (3 - n) + '. ' + NORTH_BELLS.filter(b => !f['chest:' + b.id]).map(b => b.where).join(' e ') + ', ricordi?');
    return out;
  }
  return ['Gualtiero: Mancano ancora ' + (3 - n) + ' campanelle: ' + NORTH_BELLS.filter(b => !f['chest:' + b.id]).map(b => b.where).join(', ') + '.'];
}
function ringBells(g) {
  g.s.flags.northBells = true; g.shake = 18; Sound.sfx('secret'); Sound.sfx('victory'); g.saveGame();
}

/* ---------------------------------- logica ---------------------------------- */
(function installNorth() {
  const G = Game;
  const north = id => id && id.startsWith('n:');

  /* la Radura dell'Eremita: dopo l'appello di Ilde, una scala tra le rocce sale verso nord */
  const radura = ROOMS['o:2,0'];
  radura.dyn = (radura.dyn || []).concat([{ x: 5, y: 1, ch: 'U', cond: g => !!g.s.flags.northCall }]);
  radura.warps = Object.assign({}, radura.warps, { '5,1': { to: 'n:1,2', x: 7, y: 8, dir: 1 } });
  const silv = radura.npcs.find(n => n.id === 'silvano');
  if (silv) {
    const t0 = silv.talk;
    silv.talk = function (g) {
      const f = g.s.flags;
      if (f.northCall && !f.northArrived) return ['Silvano: Pietrabianca? Il vecchio sentiero del Valico parte da qui: ho spostato i massi che lo chiudevano. Vedi la scala tra le rocce, a nord-ovest?', 'Silvano: Lassù la nebbia è viva, ragazzo. Se hai una lanterna, portala.'];
      return t0.call(this, g);
    };
  }

  /* Ilde a Brinavalle: arriva dopo la festa, stremata, e chiede aiuto */
  ROOMS['o:1,2'].npcs.push({ id: 'ilde', sprite: 'ilde', x: 13, y: 6, cond: g => g.s.flags.partyDone && !g.s.flags.northArrived, talk: g => {
    const f = g.s.flags;
    if (f.northCall) return ['Ilde: Il Valico parte dalla Radura dell\'Eremita, a nord-est. Io ti seguo appena mi reggo in piedi. Corri, Lio!'];
    return [
      'Ilde: Sei tu... Lio? Quello che ha sconfitto il Re dei Rovi? Allora non ho camminato invano.',
      'Ilde: Mi chiamo Ilde, faccio la staffetta per PIETRABIANCA, il villaggio oltre il Valico, a nord. Ho corso due giorni nella nebbia.',
      'Ilde: Da tre lune una NEBBIA GRIGIA scende dalla Torre del Silenzio. Chi ci si perde torna senza ricordi... se torna.',
      'Ilde: Le nostre campane la tenevano lontana. Ma le tre CAMPANELLE D\'ARGENTO sono sparite in una notte, rubate dalle ombre.',
      'Ilde: Tre lune... proprio quando qui vi hanno rubato il Cuore di Vesper. Non può essere un caso.',
      'Ilde: Il vecchio sentiero del Valico parte dalla RADURA DELL\'EREMITA. Ti prego, vieni a Pietrabianca!',
      g2 => { g2.s.flags.northCall = true; g2.saveGame(); },
    ];
  } });

  /* il padre e Teodoro reagiscono (una volta) */
  if (typeof FATHER_NPC !== 'undefined') {
    const ft = FATHER_NPC.talk;
    FATHER_NPC.talk = function (g) {
      const f = g.s.flags;
      if (f.northCall && !f.dadNorth) { f.dadNorth = true; return ['Papà: Pietrabianca! Ci andavo da ragazzo, con tuo nonno, a vendere il ghiaccio della miniera. Gente dura, ma buona.', 'Papà: Una nebbia che ruba i ricordi... nel bozzolo di spine non ricordavo più il tuo viso, Lio. Forse era la stessa magia. Stai attento.']; }
      return ft.call(this, g);
    };
  }
  const elder = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
  if (elder) {
    const et = elder.talk;
    elder.talk = function (g) {
      const f = g.s.flags;
      if (f.northCall && !f.elderNorth) { f.elderNorth = true; return ['Teodoro: La Signora delle Nebbie... credevo fosse una favola per spaventare i bambini.', 'Teodoro: I vecchi libri dicono che un tempo cantava per Vesper, prima che il Cuore portasse la luce. Se è tornata, Lio, cerca il suono: è l\'unica cosa che teme.']; }
      if (f.northBells && !f.elderBells) { f.elderBells = true; return ['Teodoro: Le campane di Pietrabianca si sentono fin qui, quando il vento soffia da nord. Hai fatto un miracolo, ragazzo.']; }
      return et.call(this, g);
    };
  }

  /* il portone della Torre: si apre con le campane; porta dentro appena il dungeon della Torre esiste */
  const sog = ROOMS['n:1,0'];
  // il portone è una saracinesca di gelo nero (J): si apre solo con le campane, non con chiavi
  sog.dyn = [{ x: 7, y: 2, ch: 'Z', cond: g => !!g.s.flags.northBells && !!ROOMS[TOWER_ROOM] }, { x: 8, y: 2, ch: 'P', cond: g => !!g.s.flags.northBells && !!ROOMS[TOWER_ROOM] }];
  // il passaggio esiste solo quando la Torre esiste (le verifiche dei warp non devono trovare una stanza mancante)
  Object.defineProperty(sog, 'warps', { get: () => ROOMS[TOWER_ROOM] ? { '7,2': { to: TOWER_ROOM, x: 7, y: 8, dir: 1 } } : {}, configurable: true });

  /* ---------------- la nebbia ---------------- */
  const flakes = Array.from({ length: 40 }, (_, i) => ({ x: (i * 53) % PLAY_W, y: (i * 37) % PLAY_H, v: 0.2 + (i % 5) * 0.08, ph: i * 0.7 }));
  let fogCanvas = null;
  G.northFog = function () { return north(this.roomId) && !this.s.flags.northBells; };
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!north(this.roomId)) return;
    const t = this.t;
    // neve che cade
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (const f of flakes) { const x = (f.x + Math.sin(t * 0.02 + f.ph) * 6 + PLAY_W) % PLAY_W, y = (f.y + t * f.v) % PLAY_H; c.fillRect(Math.round(x), Math.round(y), 1 + (f.v > 0.4 ? 1 : 0), 1); }
    if (!this.player) return;
    const fog = this.northFog();
    const n = fogCanvas || (fogCanvas = makeCanvas(PLAY_W, PLAY_H)), x = n.getContext('2d');
    x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, PLAY_W, PLAY_H);
    x.fillStyle = fog ? 'rgba(200,206,216,0.93)' : 'rgba(220,226,236,0.12)'; x.fillRect(0, 0, PLAY_W, PLAY_H);
    if (fog) {
      // banchi di nebbia che scorrono
      x.fillStyle = 'rgba(235,240,246,0.5)';
      for (let i = 0; i < 6; i++) { const bx = ((i * 70 + t * (0.15 + i * 0.03)) % (PLAY_W + 120)) - 60, by = 20 + i * 28; x.beginPath(); x.ellipse(bx, by, 50, 12, 0, 0, Math.PI * 2); x.fill(); }
      // intorno a Lio si vede (più lontano con la lanterna)
      const R = this.s.items.lantern ? 78 : 56, px = this.player.cx(), py = this.player.cy() - 3;
      x.globalCompositeOperation = 'destination-out';
      const gr = x.createRadialGradient(px, py, R * 0.35, px, py, R);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(px, py, R, 0, Math.PI * 2); x.fill();
    }
    c.drawImage(n, 0, 0);
  };

  /* ---------------- diario, obiettivi, Segnavia ---------------- */
  /* il diario: il Capitolo II ha una pagina sua (l'elenco del primo atto è già pieno: 9 righe).
   * Quando comincia, al posto dei capitoli del primo atto si vedono quelli del secondo. CHAPTERS2 è aperto:
   * il prossimo capitolo (la Torre) ci aggiunge le sue righe. */
  window.CHAPTERS2 = [
    { name: 'Capitolo I: completato', done: () => true },
    { name: 'La staffetta del Nord', done: g => !!g.s.flags.northCall },
    { name: 'Pietrabianca', done: g => !!g.s.flags.northArrived },
    { name: "Le Campanelle d'Argento", done: g => bellCount(g) === 3 },
    { name: 'Le campane suonano', done: g => !!g.s.flags.northBells },
  ];
  if (typeof CHAPTERS !== 'undefined') {
    const dpt = G.drawPauseText;
    G.drawPauseText = function () {
      if (!this.s.flags.northCall || this.pausePage !== 1) return dpt.apply(this, arguments);
      const keep = CHAPTERS.splice(0, CHAPTERS.length, ...CHAPTERS2.slice(0, 9));
      try { return dpt.apply(this, arguments); } finally { CHAPTERS.splice(0, CHAPTERS.length, ...keep); }
    };
  }
  const co = currentObjective;
  currentObjective = function (g) {
    const f = g.s.flags;
    if (!f.partyDone) return co(g);
    if (!f.northCall) return co(g) + '  (In piazza c\'è una forestiera stremata: parlale.)';
    if (!f.northArrived) return 'Raggiungi Pietrabianca: il sentiero del Valico parte dalla Radura dell\'Eremita, a nord-est del Crocevia.';
    if (!f.bellmanHello) return 'Pietrabianca è avvolta dalla nebbia. Parla con il campanaro Gualtiero, nel campanile.';
    if (bellCount(g) < 3) return 'Ritrova le tre Campanelle d\'Argento (' + bellCount(g) + '/3): Lago Grigio, Pineta Ghiacciata, Cima del Vento.';
    if (!f.northBells) return 'Hai tutte le campanelle! Riportale a Gualtiero, nel campanile di Pietrabianca.';
    return ROOMS[TOWER_ROOM] ? 'Le campane suonano e la nebbia si è diradata. Entra nella Torre del Silenzio, a nord di Pietrabianca.'
      : 'Le campane suonano e la nebbia si è diradata. Il portone della Torre del Silenzio si è socchiuso... (il prossimo capitolo comincia lì)';
  };
  window.currentObjective = currentObjective;
  if (typeof objectiveRoom === 'function') {
    const or0 = objectiveRoom, oc0 = objectiveChest;
    const northGoal = g => {
      const f = g.s.flags;
      if (!f.partyDone || !f.northCall) return null;
      if (!f.northArrived) return 'n:1,1';
      if (!f.bellmanHello) return 'i:campanile';
      const miss = NORTH_BELLS.find(b => !f['chest:' + b.id]);
      if (miss) return miss.room;
      if (!f.northBells) return 'i:campanile';
      return ROOMS[TOWER_ROOM] ? 'n:1,0' : null;
    };
    objectiveRoom = function (g) { const n = northGoal(g); return n !== null || g.s.flags.northCall ? n : or0(g); };
    window.objectiveRoom = objectiveRoom;
    objectiveChest = function (g) { return g.s.flags.northCall && NORTH_BELLS.some(b => b.room === g.roomId && !g.s.flags['chest:' + b.id]) ? 'bell' : oc0(g); };
  }

  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'campane', name: 'Le campane del Nord', desc: 'Riporta le tre Campanelle d\'Argento a Pietrabianca.', icon: 'bell', tier: 1, got: g => !!g.s.flags.northBells });
})();
