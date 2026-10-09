'use strict';
/* =====================================================================
 *  WIND — Ciclo 40 (Agente B, seconda manche): CAPITOLO VII, «IL FRATELLO VENTO».
 *  Il Capitolo VI finiva con un vento freddo che spegne le lanterne e una voce:
 *  «Tre fratelli, dite? Nessuno si è mai ricordato che eravamo QUATTRO».
 *  · È il VENTO: porta il canto del mare alla riva, il profumo della terra, le
 *    nuvole del cielo, le voci di tutti... ma nessuno lo conta, perché NON SI VEDE.
 *    Non è cattivo: è dispettoso e offeso. Ha spento le lanterne per farsi notare.
 *  · In piazza, a Brinavalle, compare un MULINELLO: chi ci entra viene sollevato
 *    sopra le nuvole, nelle TERRE DEL VENTO (regione «h:»):
 *      h:1,2 Prato delle Nuvole      (arrivo; il mulinello riporta giù)
 *      h:1,1 Ventaria                (il villaggio dei mugnai: Aliseo, Zefira, Folata)
 *      h:0,1 Ponte dei Refoli        (un ponte sul vuoto, raffiche di traverso)
 *      h:2,1 Gola dei Sibili         (vento contrario, raffiche, e buchi nel pavimento)
 *      h:1,0 Picco dei Quattro Venti (i Refoli; il palo del Grande Aquilone; il portone)
 *    più la casa-mulino di Aliseo (i:mulino).
 *  · MECCANICA NUOVA, LE CORRENTI D'ARIA: in alcune isole il vento spinge Lio
 *    (sempre un po', molto durante le RAFFICHE, annunciate da un fischio e dalle
 *    righe del vento che si infittiscono). Sul vuoto, una raffica ti butta giù.
 *    Una tessera solida subito CONTROVENTO fa da riparo.
 *  · Il Vento vuole essere VISTO. A Ventaria si fanno aquiloni proprio per questo:
 *    tre CODE D'AQUILONE portate a mastro Aliseo diventano il GRANDE AQUILONE;
 *    fatto volare sul Picco, il Vento si mostra, e apre il suo palazzo: il
 *    prossimo capitolo, prefisso q:, prima sala 'q:1,2'.
 *  · Nuovo nemico: il REFOLO (uno spiritello d'aria che si gonfia e ti soffia via).
 *  Flag: ch7Call, windIn, aliseoHello, chest:h_tail_ponte / h_tail_gola /
 *        h_tail_picco, bigKite, windSeen.
 * ===================================================================== */
const PALACE_ROOM = 'q:1,2';
const WIND_TAILS = [
  { id: 'h_tail_ponte', room: 'h:0,1', where: 'il Ponte dei Refoli' },
  { id: 'h_tail_gola', room: 'h:2,1', where: 'la Gola dei Sibili' },
  { id: 'h_tail_picco', room: 'h:1,0', where: 'il Picco dei Quattro Venti' },
];
const tailCount = g => WIND_TAILS.filter(t => g.s.flags['chest:' + t.id]).length;
const GUST_WARN = 50;

ITEMS.kitetail = { name: "Coda d'aquilone", text: () => "Hai trovato una CODA D'AQUILONE! Nastri colorati che si agitano anche quando l'aria è ferma. (" + tailCount(Game) + '/3) Portala a mastro Aliseo, a Ventaria.' };
PEOPLE.aliseo = { h: '#e8e8e8', s: '#e0b088', x: '#d8c8a0', c: '#8a6a4a', d: '#6a4a2a', p: '#4a3a2a', b: '#2a1a10', beard: true };
PEOPLE.zefira = { h: '#c87a3a', s: '#f0c8a0', x: '#a8d8f0', c: '#5aa8c8', d: '#3a7a98', p: '#3a3a4a', b: '#2a1a10' };
for (const k of ['aliseo', 'zefira']) SPR.people[k] = buildHumanoid(PEOPLE[k]);

/* ------------------------------ arte: nuvole, cielo sotto, pali con girandola, mulinello ------------------------------ */
(function windArt() {
  const mk = (rows, pal) => spriteFromRows(rows, Object.assign({ o: '#1a1420' }, pal));
  ICON.kitetail = mk(['o......', 'oro....', '.oyo...', '..obo..', '...oro.', '....oyo', '.....oo'], { r: '#e84a5a', y: '#f8d048', b: '#4a8ae8' });
  // Ciclo 42 (rifinitura): prima era quasi identico alla neve del Nord. Ora è bianco rosato, a sbuffi tondi con l'ombra lilla
  Ground.cloud = (P, r) => {
    P.r(0, 0, 16, 16, '#f1eaf4');
    for (let k = 0; k < 2; k++) {   // due sbuffi: luce in alto, ombra lilla in basso
      const cx = 4 + (r() * 8 | 0), cy = 4 + (r() * 8 | 0), rad = 3 + (r() * 2 | 0);
      for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
        const d = Math.hypot(x, y); if (d > rad) continue;
        P.p(cx + x, cy + y, y > rad * 0.35 ? '#dccbe2' : y < -rad * 0.35 ? '#fffbff' : '#f6f0f8');
      }
    }
    for (let i = 0; i < 4; i++) P.p(r() * 16, r() * 16, '#e2d4e8');
  };
  const dot = TilePaint['.'], tuft = TilePaint[','], tree = TilePaint['T'], pit = TilePaint['_'];
  TilePaint['.'] = (P, r, e) => e && e.ground === 'cloud' ? Ground.cloud(P, r) : dot(P, r, e);
  TilePaint[','] = (P, r, e) => {   // fiorellini d'alta quota
    if (!e || e.ground !== 'cloud') return tuft(P, r, e);
    Ground.cloud(P, r);
    for (let k = 0; k < 3; k++) { const x = 3 + (r() * 10 | 0), y = 5 + (r() * 8 | 0); P.p(x, y + 1, '#7ab070'); P.p(x, y, k % 2 ? '#a8c8ff' : '#f8b0d0'); }
  };
  TilePaint['T'] = (P, r, e) => {   // lassù: un palo con la girandola
    if (!e || e.ground !== 'cloud') return tree(P, r, e);
    Ground.cloud(P, r);
    P.r(5, 14, 6, 2, '#cfd8ea'); P.r(7, 5, 2, 10, '#6a4a2a'); P.r(7, 5, 1, 10, '#8a6a3a');
    const cols = ['#e84a5a', '#f8d048', '#4a8ae8', '#5ac86a'];
    [[8, 1], [11, 4], [8, 7], [5, 4]].forEach(([x, y], i) => { P.r(x - 1, y - 1, 3, 3, cols[i]); P.p(x, y, '#ffffff'); });
    P.r(7, 3, 2, 2, '#3a2a1a');
  };
  TilePaint['_'] = (P, r, e) => {   // sotto le isole: il cielo, e nuvole lontane
    if (!e || e.ground !== 'cloud') return pit(P, r, e);
    P.r(0, 0, 16, 16, '#7aa8d8');
    for (let i = 0; i < 6; i++) P.p(r() * 16, r() * 16, '#8ab8e8');
    if (r() < 0.4) { const x = r() * 10 | 0, y = 4 + (r() * 8 | 0); P.r(x, y, 6, 2, '#c8dcf0'); P.r(x + 1, y - 1, 3, 1, '#c8dcf0'); }
  };
  TilePaint['@'] = (P, r, e) => {   // il mulinello (un passaggio)
    (e && e.ground === 'cloud' ? Ground.cloud : Ground.grass)(P, r);
    for (let i = 0; i < 5; i++) { const w = 12 - i * 2, y = 2 + i * 3; P.r(8 - (w >> 1) + (i % 2 ? 1 : -1), y, w, 2, i % 2 ? '#d8e4f4' : '#a8bcd8'); }
  };
  TILE_WARP.add('@');
  // Ciclo 52 (rifinitura): una porta CHIUSA, che si vede ma non si apre (la sbarra la distingue dalle porte vere).
  // A Ventaria la casa di chi russa era l'unica casa del gioco senza porta: un blocco di muro con un cartello sopra.
  TilePaint['d'] = (P, r, e) => { TilePaint['D'](P, r, e); P.r(2, 8, 12, 3, '#3f2410'); P.r(3, 9, 10, 1, '#d8a860'); };
  TILE_SOLID.add('d');
})();

/* --------------------------------- le stanze --------------------------------- */
const WIND_PONTE = { dirs: [[0, 1], [0, -1]], base: 0, gust: 1.6, period: 300, gustLen: 100, only: '=' };   // soffia nel canale tra le isole: solo sul ponte
const WIND_GOLA = { dirs: [[-1, 0]], base: 0.45, gust: 1.5, period: 280, gustLen: 90 };
const WIND_PICCO = { dirs: [[1, 0], [0, 1], [-1, 0], [0, -1]], base: 0, gust: 1.1, period: 360, gustLen: 80 };
Object.assign(ROOMS, {
  'h:1,2': {
    name: 'Prato delle Nuvole', ground: 'cloud', music: 'title',
    tiles: [
      '_______.._______',
      '__............__',
      '_..T........T.._',
      '_.............._',
      '_......,......._',
      '_.............._',
      '_...T......T..._',
      '_.............._',
      '__.....@......__',
      '___..........___',
      '________________',
    ],
    warps: { '7,8': { to: 'o:1,2', x: 6, y: 7, dir: 0 } },
    enemies: [{ type: 'refolo', x: 12, y: 3 }],
    onEnter: g => {
      if (g.s.flags.windIn) return;
      g.s.flags.windIn = true;
      g.say([
        'Il mulinello ti solleva come una foglia, su, su, oltre i tetti, oltre le nuvole... e ti posa dolcemente su un prato bianco e soffice.',
        'Sei SOPRA LE NUVOLE. Isole di nebbia compatta galleggiano nel cielo, legate da ponti di corda. Sotto, molto sotto, si vede la valle.',
        'A nord, girandole colorate girano senza sosta: un villaggio. E il vento qui non smette mai di parlare.',
      ]);
    },
  },
  'h:1,1': {
    name: 'Ventaria', ground: 'cloud', music: 'village',
    tiles: [
      '_______.._______',
      '_.RRRR.::.RRRR._',
      '_.HHHH.::.HHHH._',
      '_.HDHH.::.HdHH._',
      '_......::......_',
      '::::::::::::::::',
      '_......::......_',
      '_..T...::...T.._',
      '_......::......_',
      '__.....::.....__',
      '_______.._______',
    ],
    warps: { '3,3': { to: 'i:mulino', x: 7, y: 8 } },
    npcs: [
      { id: 'zefira', sprite: 'zefira', x: 11, y: 6, talk: g => {
        const f = g.s.flags;
        if (f.bigKite) return ['Zefira: Il Grande Aquilone è pronto! L\'ho cucito con i fili più forti di Ventaria. Portalo sul Picco, a nord, e lascia fare al vento.'];
        return ['Zefira: Io cucio gli aquiloni. Da noi si dice che un aquilone è un modo per DISEGNARE il vento: finché vola, lo vedi.', 'Zefira: Le code d\'aquilone più belle se le è prese il vento stesso, una notte di raffiche. Ponte dei Refoli, Gola dei Sibili, il Picco... Le ha sparse per farsi inseguire, ne sono sicura.'];
      } },
      { id: 'folata', sprite: 'kid', x: 5, y: 8, talk: g => {
        const f = g.s.flags, L = [
          'Folata: Sul ponte, quando senti il FISCHIO, fermati vicino a un palo! Il palo ti ripara, il vuoto no.',
          'Folata: Nella Gola il vento soffia contro. Si cammina lo stesso, ma durante le raffiche nasconditi dietro le rocce, se no ti riporta indietro... o giù nei buchi.',
          'Folata: I Refoli sono spiritelli d\'aria. Quando si gonfiano come palloncini, stanno per soffiare. Allontanati dal bordo!',
          'Folata: Io da grande voglio fare l\'aquilone. Cioè, il costruttore di aquiloni. Anzi no, l\'aquilone.',
        ];
        return [L[(f.folIdx = ((f.folIdx || 0) + 1) % L.length)]];
      } },
    ],
    signs: { '4,3': ['Il mulino di mastro Aliseo. Le pale girano anche quando non c\'è vento: dice che è il vento che gira loro.'], '11,3': ['La porta è sbarrata. Dentro, qualcuno russa come un temporale: a Ventaria si dorme anche col vento.'] },
    onEnter: g => {
      if (g.s.flags.ventariaSeen) return;
      g.s.flags.ventariaSeen = true;
      g.say(['Case leggere, girandole su ogni tetto, un mulino che macina nuvole: VENTARIA. Gli abitanti camminano piegati in avanti, come chi è abituato a stare controvento.']);
    },
  },
  'h:0,1': {
    name: 'Ponte dei Refoli', ground: 'cloud', music: 'overworld',
    tiles: [
      '________________',
      '________________',
      '________________',
      '_...________..._',
      '_...___T____..._',
      '_...========....',
      '_...___T____..._',
      '_...________..._',
      '________________',
      '________________',
      '________________',
    ],
    wind: WIND_PONTE,
    chests: [{ id: 'h_tail_ponte', x: 2, y: 3, item: 'kitetail' }],
    signs: { '7,4': ['Un palo piantato nel mezzo del ponte, con una girandola che gira come impazzita. Stringendoti a lui, il vento quasi non si sente.'] },
  },
  'h:2,1': {
    name: 'Gola dei Sibili', ground: 'cloud', music: 'overworld',
    tiles: [
      '________________',
      '________________',
      '________________',
      '________________',
      '_..r......r..r._',
      '........_......_',
      '_..r......r..r._',
      '________________',
      '________________',
      '________________',
      '________________',
    ],
    wind: WIND_GOLA,
    chests: [{ id: 'h_tail_gola', x: 14, y: 5, item: 'kitetail' }],
  },
  'h:1,0': {
    name: 'Picco dei Quattro Venti', ground: 'cloud', music: 'temple',
    tiles: [
      '________________',
      '_____NNNNNN_____',
      '_____NNJJNN_____',
      '____........____',
      '___..T....T..___',
      '__............__',
      '__....,.......__',
      '___..........___',
      '____........____',
      '______....______',
      '_______.._______',
    ],
    wind: WIND_PICCO,
    clearFlag: 'cleared:h:1,0',
    chests: [{ id: 'h_tail_picco', x: 11, y: 3, item: 'kitetail', cond: g => !!g.s.flags['cleared:h:1,0'] }],
    enemies: [{ type: 'refolo', x: 4, y: 5 }, { type: 'refolo', x: 11, y: 6 }],
    signs: { '7,2': g => palaceDoor(g), '8,2': g => palaceDoor(g), '7,5': g => kitePole(g), '8,5': g => kitePole(g) },
    onEnter: g => {
      if (g.s.flags.piccoSeen) return;
      g.s.flags.piccoSeen = true;
      g.say(['La cima più alta delle Terre del Vento. Qui i venti arrivano da tutte e quattro le direzioni, a turno. Davanti a te, un portone di nuvola compatta, senza maniglie.', 'Al centro dello spiazzo, un palo con un anello di ferro: per legarci qualcosa... un aquilone?']);
    },
  },
  'i:mulino': {
    name: 'Il mulino di Aliseo', ground: 'wood', music: 'village',
    tiles: ['XXXXXXXXXXXXXXXX', 'XXXIIIIIIIIIIXXX', 'XXXIkkIIIIkkIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwtwwwwwwIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwwwwwwwjIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIwwwwwwwwIXXX', 'XXXIIIIEEIIIIXXX', 'XXXXXXXXXXXXXXXX'],
    warps: { '7,9': { to: 'h:1,1', x: 3, y: 4 }, '8,9': { to: 'h:1,1', x: 3, y: 4 } },
    npcs: [{ id: 'aliseo', sprite: 'aliseo', x: 8, y: 4, talk: g => aliseoTalk(g) }],
  },
});

/* ------------------------------ dialoghi ------------------------------ */
function aliseoTalk(g) {
  const f = g.s.flags, n = tailCount(g);
  if (f.windSeen) return ['Aliseo: L\'hai visto, eh? Il nostro vecchio amico. Ottant\'anni che macino nuvole al suo ritmo, e oggi è la prima volta che mi ha sorriso.'];
  if (f.bigKite) return ['Aliseo: Il Grande Aquilone è pronto. Portalo sul PICCO DEI QUATTRO VENTI, legalo al palo e lascia fare al vento.'];
  if (!f.aliseoHello) return [
    'Aliseo: Un ragazzo di laggiù! È salito col mulinello, vero? Allora il vento ti ha scelto. Io sono Aliseo, il mugnaio di Ventaria.',
    'Aliseo: Noi qui viviamo col vento. Lui gira le nostre pale, porta le nostre voci, asciuga i nostri panni. È nostro amico... il più vecchio di tutti.',
    'Aliseo: Il cielo, il mare, la terra. Tutti li conoscono, tutti li cantano. Ma il quarto fratello, IL VENTO, non lo conta nessuno: non si vede, e quello che non si vede si dimentica.',
    'Aliseo: L\'altra notte ha sentito i suoi fratelli fare pace, cantare insieme... e nessuno ha pensato a lui. Così ha spento le lanterne della tua valle. Un dispetto, per farsi ricordare.',
    'Aliseo: Noi di Ventaria facciamo aquiloni proprio per questo: un aquilone in volo è il vento che si mostra. Con un aquilone abbastanza grande... potremmo VEDERLO, finalmente.',
    'Aliseo: Ma il dispettoso ci ha rubato le tre CODE più belle. Ponte dei Refoli, a ovest; Gola dei Sibili, a est; e su, sul Picco. Riportamele, e costruisco il GRANDE AQUILONE.',
    g2 => { g2.s.flags.aliseoHello = true; g2.saveGame(); },
  ];
  if (n < 3) return ['Aliseo: Code d\'aquilone: ' + n + ' su 3. ' + WIND_TAILS.filter(t => !f['chest:' + t.id]).map(t => t.where).join(', ') + '. Attento alle raffiche!'];
  return [
    'Aliseo: Tutte e tre! Fammi vedere... Rosso, oro, azzurro. Sì, sì, sì.',
    'Aliseo lavora per ore: stecche di canna leggera, tela di nuvola cucita da Zefira, e in fondo le tre code, lunghe come fiumi.',
    g2 => { g2.s.flags.bigKite = true; Sound.sfx('secret'); g2.saveGame(); },
    'Aliseo: Ecco il GRANDE AQUILONE. Portalo sul Picco dei Quattro Venti, legalo al palo... e quando il vento lo prenderà, guarda bene.',
    ...g.giveItem('gems', 30),
  ];
}
function kitePole(g) {
  const f = g.s.flags;
  if (f.windSeen) return ['Il Grande Aquilone danza alto nel cielo, legato al palo. Ogni tanto si inclina verso di te, come per salutarti.'];
  if (!f.bigKite) return ['Un palo con un anello di ferro, consumato dalle corde. Qui, una volta, si legavano gli aquiloni più grandi.'];
  return [
    'Leghi il Grande Aquilone al palo. Per un attimo non succede niente... poi le quattro correnti si fermano tutte insieme.',
    'Un soffio solo, lunghissimo, prende l\'aquilone e lo porta su, su, fino alle nuvole più alte. Le code disegnano nel cielo una forma: due occhi, una bocca, i capelli spettinati.',
    'IL VENTO. Per la prima volta, qualcuno lo vede.',
    'Vento: ...Mi vedi? Mi VEDI davvero? Quanti secoli... Cielo, mare, terra: tutti hanno un volto, tutti hanno un canto. Io porto i loro canti in giro per il mondo, e nessuno si gira mai.',
    'Vento: Ho spento le vostre lanterne. Lo so. Era... un modo per dire «ci sono anch\'io». Scusa.',
    'Vento: Sali al mio palazzo, piccolo uomo. Ti aspetto lassù. Ho tante cose da chiederti... e una da restituirti.',
    g2 => { g2.s.flags.windSeen = true; g2.shake = 10; Sound.sfx('secret'); Sound.sfx('fairy'); g2.saveGame(); if (ROOMS[PALACE_ROOM]) g2.loadRoom(g2.roomId); },
    ...g.giveItem('gems', 50),
  ];
}
function palaceDoor(g) {
  const f = g.s.flags;
  if (f.windSeen) return ROOMS[PALACE_ROOM] ? ['Il portone di nuvola si è aperto in due, come una tenda.'] : ['Il portone di nuvola si è aperto in due, come una tenda... Il prossimo capitolo comincia lassù.'];
  return ['Un portone di nuvola compatta, senza maniglie né serrature. Ci appoggi la mano: è come spingere il cuscino più morbido del mondo, e non si muove di un millimetro.'];
}

/* ------------------------------ il Refolo ------------------------------ */
class Refolo extends Enemy {
  constructor(x, y) {
    super(x, y);
    this.hp = 2; this.dmg = 1; this.hb = { x: 2, y: 3, w: 12, h: 10 };
    this.state = 'drift'; this.st = 90 + (Math.random() * 60 | 0); this.blowDir = [1, 0];
  }
  mopts() { return { edgeSolid: true, noTiles: true, self: this }; }   // vola anche sul vuoto
  update(g) {
    if (this.baseUpdate()) { this.touchPlayer(g); return; }
    const p = g.player, dx = p.cx() - this.cx(), dy = p.cy() - this.cy(), d = Math.hypot(dx, dy) || 1;
    if (this.state === 'drift') {
      if (d > 36) moveEntity(this, dx / d * 0.5, dy / d * 0.5 + Math.sin(this.t * 0.05) * 0.3, this.mopts());
      if (--this.st <= 0 && d < 90) { this.state = 'puff'; this.st = 34; this.blowDir = [dx / d, dy / d]; Sound.sfx('whine'); }
    } else if (this.state === 'puff') {   // si gonfia: sta per soffiare
      if (--this.st <= 0) { this.state = 'blow'; this.st = 22; Sound.sfx('spin'); }
    } else if (this.state === 'blow') {   // soffia: Lio viene spinto via (se è davanti al soffio)
      const ahead = (dx * this.blowDir[0] + dy * this.blowDir[1]) > 0;
      if (ahead && d < 110 && !p.fallT) moveEntity(p, this.blowDir[0] * 2.4, this.blowDir[1] * 2.4, p.mopts);
      if (--this.st <= 0) { this.state = 'drift'; this.st = 120 + (Math.random() * 60 | 0); }
    }
    this.touchPlayer(g);
  }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y + Math.sin(this.t * 0.08) * 2), t = this.t;
    const s = this.state === 'puff' ? 1 + (34 - this.st) / 34 * 0.5 : this.state === 'blow' ? 0.85 : 1;
    const white = this.flash > 0 && (this.flash >> 1) % 2 === 0;
    c.save(); c.translate(X + 8, Y + 8); c.scale(s, s);
    c.fillStyle = '#1a1420'; c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = white ? '#ffffff' : '#e8f0fa'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c8d8ea'; c.fillRect(-4, 2, 8, 2);
    c.fillStyle = '#1a1420'; c.fillRect(-3, -2, 2, 2); c.fillRect(1, -2, 2, 2);   // occhietti
    if (this.state === 'blow') { c.fillRect(-1, 1, 3, 3); } else c.fillRect(-1, 2, 2, 1);
    c.restore();
    if (this.state === 'blow') {   // il soffio
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 5; i++) { const k = ((t * 3 + i * 9) % 40); c.fillRect(Math.round(X + 8 + this.blowDir[0] * (10 + k)), Math.round(Y + 8 + this.blowDir[1] * (10 + k) + (i - 2) * 3), 4, 1); }
    }
  }
}

/* ---------------------------------- logica ---------------------------------- */
(function installWind() {
  const G = Game;
  const mk0 = makeEnemy;
  makeEnemy = function (def) { return def.type === 'refolo' ? new Refolo(def.x * TS, def.y * TS) : mk0(def); };
  window.Refolo = Refolo;
  if (typeof BESTIARY !== 'undefined') {
    let pic = null;
    BESTIARY.push({ k: 'refolo', name: 'Refolo',
      spr: () => pic || (pic = (() => { const cv = makeCanvas(16, 16), m = new Refolo(0, 0); m.t = 0; m.draw(cv.getContext('2d')); return cv; })()),
      lore: 'Uno spiritello d\'aria, figlio dei capricci del Vento. Vola anche sul vuoto, e si diverte a soffiare via chi passa.',
      weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Quando si gonfia sta per soffiare: via dal bordo. Due colpi lo sciolgono.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Refolo ? 'refolo' : bk(e); };
  }

  /* ---------- l'inizio del Capitolo VII: il mulinello in piazza ---------- */
  const village = ROOMS['o:1,2'];
  village.dyn = (village.dyn || []).concat([{ x: 6, y: 6, ch: '@', cond: g => !!g.s.flags.ch7Call }]);
  village.warps = Object.assign({}, village.warps, { '6,6': { to: 'h:1,2', x: 7, y: 7, dir: 1 } });
  const elder = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
  if (elder) {
    const et = elder.talk;
    elder.talk = function (g) {
      const f = g.s.flags;
      if (f.ch6Home && !f.ch7Call) return [
        'Teodoro: Le lanterne spente, quella voce... Lio, ho riletto i libri più vecchi, quelli che nessuno apre più.',
        'Teodoro: «Quattro furono i figli del Principio: il Cielo che guarda, il Mare che canta, la Terra che regge... e il Vento, che porta. Ma il Vento non ha volto, e chi non ha volto si dimentica».',
        'Teodoro: Stanotte, in piazza, è comparso un MULINELLO. Non si muove, gira su se stesso come se aspettasse qualcuno. Credo che aspetti te.',
        g2 => { g2.s.flags.ch7Call = true; g2.saveGame(); },
      ];
      if (f.windSeen && !f.elderWind) { f.elderWind = true; return ['Teodoro: Le lanterne si sono riaccese da sole, stanotte. E un aquilone enorme si vedeva dalle finestre, altissimo sopra le nuvole. Sei stato tu, vero?']; }
      return et.call(this, g);
    };
  }

  /* ---------- il portone del palazzo ---------- */
  const picco = ROOMS['h:1,0'];
  picco.dyn = [{ x: 7, y: 2, ch: 'Z', cond: g => !!g.s.flags.windSeen && !!ROOMS[PALACE_ROOM] }, { x: 8, y: 2, ch: 'P', cond: g => !!g.s.flags.windSeen && !!ROOMS[PALACE_ROOM] }];
  Object.defineProperty(picco, 'warps', { get: () => ROOMS[PALACE_ROOM] ? { '7,2': { to: PALACE_ROOM, x: 7, y: 8, dir: 1 } } : {}, configurable: true });

  /* ---------- le correnti d'aria ---------- */
  G.windT = 0;
  // la corrente di questo momento: { dx, dy, force, gust, warn }
  G.windNow = function () {
    const W = this.room && this.room.wind; if (!W) return null;
    const k = this.windT % W.period, n = Math.floor(this.windT / W.period), d = W.dirs[n % W.dirs.length];
    const gust = k >= W.period - W.gustLen, warn = !gust && k >= W.period - W.gustLen - GUST_WARN;
    return { dx: d[0], dy: d[1], force: gust ? W.gust : W.base, gust, warn };
  };
  /* al riparo: una tessera solida subito controvento (da dove arriva il vento) */
  G.windShelter = function () {
    const w = this.windNow(), p = this.player; if (!w || !p) return false;
    const tx = Math.floor(p.cx() / TS), ty = Math.floor((p.y + 12) / TS), ch = this.tiles[ty - w.dy] && this.tiles[ty - w.dy][tx - w.dx];
    return !!ch && TILE_SOLID.has(ch);
  };
  const loadRoom = G.loadRoom;
  G.loadRoom = function () { const r = loadRoom.apply(this, arguments); this.windT = 0; return r; };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state !== 'play' || !this.room || !this.room.wind || this.dialog || this.s.flags.windSeen && this.roomId === 'h:1,0') return;
    this.windT++;
    const w = this.windNow(), p = this.player;
    if (w.warn && this.windT % this.room.wind.period === this.room.wind.period - this.room.wind.gustLen - GUST_WARN + 1) {
      Sound.sfx('whine');
      if (!this.s.flags.windTip) { this.s.flags.windTip = true; this.banner = { text: 'Un fischio: arriva una raffica! Riparati dietro un palo o una roccia!', t: 120 }; }
    }
    if (!p || p.fallT || p.hook || !w.force || this.windShelter()) return;
    const W = this.room.wind;
    if (W.only) { const ch = this.tiles[Math.floor((p.y + 12) / TS)] && this.tiles[Math.floor((p.y + 12) / TS)][Math.floor(p.cx() / TS)]; if (ch !== W.only) return; }
    moveEntity(p, w.dx * w.force, w.dy * w.force, p.mopts);
    // il vento non ti porta fuori dalla stanza (come i colpi, Ciclo 30): ci esci solo se sei tu a camminare verso quel bordo
    const m = 3, cx = p.cx(), cy = p.cy();
    if (w.dx < 0 && cx < m && !Input.held('left')) p.x += m - cx;
    if (w.dx > 0 && cx > PLAY_W - m && !Input.held('right')) p.x -= cx - (PLAY_W - m);
    if (w.dy < 0 && cy < m && !Input.held('up')) p.y += m - cy;
    if (w.dy > 0 && cy > PLAY_H - m && !Input.held('down')) p.y -= cy - (PLAY_H - m);
  };
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    const t = this.t;
    if (this.roomId === 'h:1,1') {   // le pale del mulino di Aliseo, sopra la casa
      const cx = 3.5 * TS + 8, cy = 1 * TS + 2, a = t * 0.04;
      c.strokeStyle = '#1a1420'; c.lineWidth = 3;
      for (let i = 0; i < 4; i++) { const b = a + i * Math.PI / 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(b) * 22, cy + Math.sin(b) * 22); c.stroke(); }
      c.strokeStyle = '#f0e8d0'; c.lineWidth = 1;
      for (let i = 0; i < 4; i++) { const b = a + i * Math.PI / 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(b) * 21, cy + Math.sin(b) * 21); c.stroke(); }
      c.fillStyle = '#6a4a2a'; c.fillRect(cx - 2, cy - 2, 4, 4);
    }
    if (this.roomId === 'h:1,0' && this.s.flags.windSeen) {   // il Grande Aquilone, e il volto del Vento disegnato dalle code
      const kx = 8 * TS + Math.sin(t * 0.03) * 20, ky = 12 + Math.cos(t * 0.04) * 4;
      c.strokeStyle = 'rgba(40,30,20,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(8 * TS, 5 * TS + 8); c.lineTo(kx, ky + 10); c.stroke();
      c.fillStyle = '#1a1420'; c.beginPath(); c.moveTo(kx, ky - 9); c.lineTo(kx + 8, ky); c.lineTo(kx, ky + 10); c.lineTo(kx - 8, ky); c.closePath(); c.fill();
      c.fillStyle = '#e84a5a'; c.beginPath(); c.moveTo(kx, ky - 7); c.lineTo(kx + 6, ky); c.lineTo(kx, ky + 8); c.lineTo(kx - 6, ky); c.closePath(); c.fill();
      c.fillStyle = '#f8d048'; c.fillRect(kx - 1, ky - 6, 2, 13);
      ['#e84a5a', '#f8d048', '#4a8ae8'].forEach((col, i) => { c.fillStyle = col; for (let k = 0; k < 6; k++) c.fillRect(Math.round(kx - 8 + i * 8 + Math.sin(t * 0.1 + k + i) * 3), Math.round(ky + 12 + k * 4), 2, 2); });
    }
    const w = this.windNow && this.windNow();
    if (!w) return;
    // le righe del vento: poche quando è calmo, fitte e veloci nelle raffiche
    const n = w.gust ? 26 : w.warn ? 12 : w.force ? 8 : 4, sp = w.gust ? 5 : 2;
    c.fillStyle = w.gust ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)';
    for (let i = 0; i < n; i++) {
      const L = w.gust ? 14 : 8, a = (i * 97) % PLAY_W, b = (i * 53) % PLAY_H, s = (t * sp + i * 31) % (PLAY_W + PLAY_H);
      if (w.dx) c.fillRect(Math.round(((w.dx > 0 ? s : -s) + a + PLAY_W * 2) % PLAY_W), b, L, 1);
      else c.fillRect(a, Math.round(((w.dy > 0 ? s : -s) + b + PLAY_H * 2) % PLAY_H), 1, L);
    }
  };
  const drawHUDText = G.drawHUDText;
  G.drawHUDText = function () {
    drawHUDText.apply(this, arguments);
    if (this.state !== 'play' || !this.room || !this.room.wind) return;
    const w = this.windNow(), arrow = w.dx > 0 ? '→' : w.dx < 0 ? '←' : w.dy > 0 ? '↓' : '↑';
    txt(w.gust ? 'RAFFICA ' + arrow : w.warn ? 'Fischio... ' + arrow : 'Vento ' + arrow, 250, HUD_H + 3, { size: 9, align: 'right', color: w.gust ? '#ffb0a0' : w.warn ? '#ffe8a0' : '#c8dcf0' });
  };

  /* ---------- diario (Capitolo VII), obiettivi, Segnavia ---------- */
  window.CHAPTERS7 = [
    { name: 'Capitolo VI: completato', done: () => true },
    { name: 'Il quarto fratello', done: g => !!g.s.flags.ch7Call },
    { name: 'Sopra le nuvole', done: g => !!g.s.flags.windIn },
    { name: 'Ventaria', done: g => !!g.s.flags.aliseoHello },
    { name: "Le code d'aquilone", done: g => tailCount(g) === 3 },
    { name: 'Il Grande Aquilone', done: g => !!g.s.flags.bigKite },
    { name: 'Il volto del Vento', done: g => !!g.s.flags.windSeen },
  ];
  if (window.CHAPTERS6) {
    const dpt = G.drawPauseText;
    G.drawPauseText = function () {
      if (!this.s.flags.ch7Call || this.pausePage !== 1) return dpt.apply(this, arguments);
      const keep = CHAPTERS6.splice(0, CHAPTERS6.length, ...CHAPTERS7.slice(0, 9));
      try { return dpt.apply(this, arguments); } finally { CHAPTERS6.splice(0, CHAPTERS6.length, ...keep); }
    };
  }
  const goal7 = g => {
    const f = g.s.flags;
    if (!f.ch7Call) return null;
    if (!f.windIn) return 'h:1,2';
    if (!f.aliseoHello) return 'i:mulino';
    const miss = WIND_TAILS.find(t => !f['chest:' + t.id]);
    if (miss) return miss.room;
    if (!f.bigKite) return 'i:mulino';
    return ROOMS[PALACE_ROOM] || !f.windSeen ? 'h:1,0' : null;
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const f = g.s.flags;
    if (f.ch6Home && !f.ch7Call) return 'Un vento freddo ha spento le lanterne: «eravamo QUATTRO». Parla con Teodoro.';
    if (!f.ch7Call) return co(g);
    if (!f.windIn) return 'Entra nel mulinello comparso nella piazza di Brinavalle.';
    if (!f.aliseoHello) return 'Sopra le nuvole c\'è Ventaria. Cerca mastro Aliseo, nel suo mulino.';
    const n = tailCount(g);
    if (n < 3) return "Ritrova le tre code d'aquilone (" + n + '/3): Ponte dei Refoli, Gola dei Sibili, Picco dei Quattro Venti. Attento alle raffiche!';
    if (!f.bigKite) return "Porta le code d'aquilone a mastro Aliseo, nel mulino di Ventaria.";
    if (!f.windSeen) return 'Porta il Grande Aquilone sul Picco dei Quattro Venti e legalo al palo.';
    return ROOMS[PALACE_ROOM] ? 'Il Vento ti aspetta nel suo palazzo, oltre il portone di nuvola.' : 'Il portone di nuvola si è aperto... (il prossimo capitolo comincia lassù)';
  };
  window.currentObjective = currentObjective;
  const or0 = objectiveRoom, oc0 = objectiveChest;
  objectiveRoom = function (g) { const f = g.s.flags; if (f.ch6Home && !f.ch7Call) return 'i:elder'; if (!f.ch7Call) return or0(g); return goal7(g); };
  window.objectiveRoom = objectiveRoom;
  objectiveChest = function (g) { return g.s.flags.ch7Call && WIND_TAILS.some(t => t.room === g.roomId && !g.s.flags['chest:' + t.id]) ? 'kitetail' : oc0(g); };

  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'aquilone', name: 'Il volto del Vento', desc: 'Fai volare il Grande Aquilone sul Picco.', icon: 'kitetail', tier: 1, got: g => !!g.s.flags.windSeen });
})();
