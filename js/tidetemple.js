'use strict';
/* =====================================================================
 *  TIDETEMPLE — Ciclo 37 (Agente A, seconda manche): CAPITOLO V, parte
 *  seconda: «IL TEMPIO DELLE MAREE».
 *  Il mare si è ritirato e ha scoperto Coralia (Ciclo 36). Nel Tempio delle
 *  Maree si è svegliata la MADRE DELLE ACQUE, offesa tre volte: il Canto
 *  dimenticato, Umbra, la stella. Mareva l'aveva detto: «non portarle la
 *  spada, portale il Canto».
 *  · Nuovo oggetto: la CONCA DEI CORALIANI (tasto X): Lio si ferma e suona;
 *    le frecce sono quattro note (▲ ▶ ▼ ◀). Il mondo non si ferma.
 *    Le melodie si imparano dai MURALI del Tempio:
 *      Marea Bassa  ▼ ◀ ▼     l'acqua del Tempio si ritira
 *      Marea Alta   ▲ ▶ ▲     l'acqua sale (e le passerelle galleggiano)
 *      Risveglio    ◀ ▲ ▶ ▼   le statue dei Coraliani si fanno da parte
 *  · 7 sale (prefisso w:, mappa «TEMPIO»):
 *      w:1,2 Atrio delle Onde        (ingresso; le onde lunghe; due statue davanti alla porta nord)
 *      w:0,2 Sala della Conca        (la Conca; murale della Marea Bassa)
 *      w:2,2 Le Vasche               (con la marea bassa: murale del Risveglio)
 *      w:1,1 Galleria delle Passerelle (con la marea alta le passerelle galleggiano)
 *      w:0,1 Sala del Canto Alto     (murale della Marea Alta; onde)
 *      w:2,1 Sala dei Coraliani      (quattro statue: un Cuore di Cristallo)
 *      w:1,0 Il Cuore del Mare       (la MADRE DELLE ACQUE: un duello di canto)
 *  Flag: wIn, items.conch, song:bassa / song:alta / song:risveglio, s.wLvl,
 *        awake:<id>, wAwake, wMother, ch5Done.
 * ===================================================================== */
const NOTE_KEYS = ['up', 'right', 'down', 'left'];
const NOTE_GLYPH = ['▲', '▶', '▼', '◀'];
const NOTE_COL = ['#ffe070', '#70e0ff', '#ff90b0', '#a0ff90'];
const SONGS = {
  bassa: { name: 'Marea Bassa', seq: [2, 3, 2] },
  alta: { name: 'Marea Alta', seq: [0, 1, 0] },
  risveglio: { name: 'Canto del Risveglio', seq: [3, 0, 1, 2] },
};
const inTemple = g => !!g.roomId && (g.roomId.startsWith('w:') || !!(g.room && g.room.temple));   // Ciclo 39: anche le stanze di altri dungeon con «temple»
const wLvl = g => g.s.wLvl || 'high';
const PHRASE_LEN = [3, 4, 4, 5, 6];
const NOTE_T = () => [44, 34, 26][Opts.diff];        // la Madre canta una nota ogni NOTE_T frame
const LISTEN_T = () => [720, 540, 420][Opts.diff];   // tempo per rispondere

ITEMS.conch = { name: 'Conca dei Coraliani', text: () => 'Hai trovato la CONCA DEI CORALIANI! Premi ' + bombKey() + ' e Lio si ferma a suonare: le FRECCE sono quattro note. Le melodie del Tempio sono scritte sui murali. Premi ancora ' + bombKey() + ' per smettere.' };
INVENTORY.push(['conch', 'Conca']);
EQUIPS.push('conch');
ICON.conch = spriteFromRows([
  '....oooo..',
  '..oopppo..',
  '.opwwwppo.',
  'opwppwwpo.',
  'opwpwpwpo.',
  'opwppwppo.',
  '.opwwwwpo.',
  '..oopppoo.',
  '....oo.o..',
  '.......oo.',
], { o: '#1a1420', p: '#f0b0c0', w: '#fff0e8' });

/* ------------------------------ stanze ------------------------------ */
Object.assign(ROOMS, {
  'w:1,2': {
    name: 'Tempio - Atrio delle Onde', ground: 'dungeon', music: 'temple', temple: true, waves: { period: 820, speed: 1.6 },
    tiles: [
      'WWWWWWWJJWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPWPPPPPPPPWPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPWPPPPWPPPPW',
      'PPPPPPPPPPPPPPPP',
      'WPPWPPPPPPPPWPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPWPPWPPPPPW',
      'WPPPPPPUUPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    warps: { '7,9': { to: 's:1,2', x: 7, y: 4, dir: 1 }, '8,9': { to: 's:1,2', x: 7, y: 4, dir: 1 } },
    statues: [{ id: 'atrio_o', x: 7, y: 1, to: [5, 1] }, { id: 'atrio_e', x: 8, y: 1, to: [10, 1] }],   // davanti alla porta nord: risvegliate si spostano ai lati
    signs: { '3,2': ['Inciso sul pilastro: «QUANDO IL MARE BRONTOLA, METTITI DIETRO LA PIETRA».'] },
    onEnter: g => {
      const f = g.s.flags;
      if (f.wIn) return;
      f.wIn = true;
      g.say([
        "Dentro il Tempio l'aria è umida e salata. Da qualche parte, lontano, il mare respira: a ogni respiro, un'onda attraversa le sale.",
        'Davanti alla porta nord, due statue di Coraliani con le conchiglie alle labbra. Dormono in piedi, come sentinelle stanche.',
        'Ti torna in mente Mareva: «Non portarle la spada. Portale il Canto».',
      ]);
    },
  },
  'w:0,2': {
    name: 'Tempio - Sala della Conca', ground: 'dungeon', music: 'temple', temple: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WP~~~~~~~~~~~~PW',
      'WP~PPPPPPPPPP~PW',
      'WP~PPPPPPPPPP~PW',
      'WP~PPPPPPPPPPPPP',
      'WP~PPPPPPPPPP~PW',
      'WP~PPPPPPPPPP~PW',
      'WP~~~~~~~~~~~~PW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    chests: [{ id: 'w_conch', x: 7, y: 5, item: 'conch' }],
    enemies: [{ type: 'crab', x: 4, y: 4 }, { type: 'crab', x: 10, y: 6 }],
    signs: { '7,0': g => mural(g, 'bassa', 'Un murale di Coraliani che suonano conchiglie davanti al mare. Sotto, tre segni in fila:') },
    onEnter: g => {
      if (g.s.flags.wConchSeen) return;
      g.s.flags.wConchSeen = true;
      g.say(["Su un isolotto, in mezzo a un canale d'acqua, uno scrigno coperto di conchiglie. Sul muro a nord, un grande murale."]);
    },
  },
  'w:2,2': {
    name: 'Tempio - Le Vasche', ground: 'dungeon', music: 'temple', temple: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
      'WWW~~~~~~~~~~WWW',
      'WWW~~~~~~~~~~~WW',
      'WPP~~~~~~~~~~~PW',
      'PPP~~~~~~~~~~~PW',
      'WPP~~~~~~~~~~~PW',
      'WWW~~~~~~~~~~~WW',
      'WWW~~~~~~~~~~WWW',
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
    ],
    // con la marea bassa si scoprono le passerelle di pietra intorno alla vasca profonda (che resta piena)
    wt: [[3, 4], [4, 4], [5, 4], [3, 5], [4, 5], [5, 5], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 6],
      [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3],
      [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [13, 4], [13, 5], [13, 6], [12, 4], [12, 5], [12, 6]],
    chests: [{ id: 'w_vasche', x: 14, y: 6, item: 'gems', n: 60 }],
    signs: { '15,5': g => mural(g, 'risveglio', 'Un murale: un Coraliano suona davanti a una statua, e la statua apre gli occhi. Sotto, quattro segni:') },
    onEnter: g => {
      if (g.s.flags.wPoolSeen) return;
      g.s.flags.wPoolSeen = true;
      g.say(["Vasche colme d'acqua scura. Dall'altra parte, su una piattaforma, un altro murale. L'acqua è troppo alta per passare." + (g.s.items.conch ? '' : ' Forse con qualcosa per... cantare al mare?')]);
    },
  },
  'w:1,1': {
    name: 'Tempio - Galleria delle Passerelle', ground: 'dungeon', music: 'temple', temple: true,
    tiles: [
      'WWWWWWWPPWWWWWWW',
      'W______PP______W',
      'W______PP______W',
      'W______________W',
      'W______________W',
      'PPP__________PPP',
      'WPP__________PPW',
      'WPP__________PPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
    wf: [[7, 3], [8, 3], [7, 4], [8, 4], [7, 5], [8, 5], [7, 6], [8, 6], [7, 7], [8, 7]],
    onEnter: g => {
      if (g.s.flags.wGallerySeen) return;
      g.s.flags.wGallerySeen = true;
      g.say(["Una galleria sopra il vuoto. Sul fondo, giù nel buio, una passerella di legno giace incagliata. " + (wLvl(g) === 'high' ? 'Galleggia sull\'acqua, verso la porta nord.' : 'Se l\'acqua salisse, forse tornerebbe a galla.')]);
    },
  },
  'w:0,1': {
    name: 'Tempio - Sala del Canto Alto', ground: 'dungeon', music: 'temple', temple: true, waves: { period: 700, speed: 1.8 },
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPWPPWPPWPPWPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPP',
      'WPPWPPWPPWPPWPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    enemies: [{ type: 'crab', x: 5, y: 2 }, { type: 'jelly', x: 10, y: 8 }],
    signs: { '1,1': g => mural(g, 'alta', 'Un murale: il mare che sale, e sopra le onde una barca che naviga verso il tempio. Sotto, tre segni:') },
  },
  'w:2,1': {
    name: 'Tempio - Sala dei Coraliani', ground: 'dungeon', music: 'temple', temple: true,
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'PPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWWWWWWWWWW',
    ],
    statues: [{ id: 'cor_1', x: 11, y: 3, to: [11, 1] }, { id: 'cor_2', x: 13, y: 4, to: [14, 2] }, { id: 'cor_3', x: 13, y: 6, to: [14, 8] }, { id: 'cor_4', x: 11, y: 7, to: [11, 9] }],
    chests: [{ id: 'w_cuore', x: 12, y: 5, item: 'container', cond: g => ['cor_1', 'cor_2', 'cor_3', 'cor_4'].every(id => g.s.flags['awake:' + id]) }],
    onEnter: g => {
      if (g.s.flags.wCoralSeen) return;
      g.s.flags.wCoralSeen = true;
      g.say(['Quattro statue di Coraliani fanno cerchio intorno a qualcosa. Hanno gli occhi chiusi, e le conchiglie alle labbra.']);
    },
  },
  'w:1,0': {
    name: 'Tempio - Il Cuore del Mare', ground: 'dungeon', temple: true, waves: { period: 760, speed: 1.8 },
    get music() { return Game.s && Game.s.flags.wMother ? 'temple' : 'boss2'; },
    tiles: [
      'WWWWWWWWWWWWWWWW',
      'W~~~~~~~~~~~~~~W',
      'W~~~~~~~~~~~~~~W',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPWPPWPPWPPWPPW',
      'WPPPPPPPPPPPPPPW',
      'WPPPPPPPPPPPPPPW',
      'WWWWWWWPPWWWWWWW',
    ],
  },
});
// la porta nord dell'Atrio: si apre quando le due statue si fanno da parte
ROOMS['w:1,2'].dyn = [{ x: 7, y: 0, ch: 'P', cond: g => !!g.s.flags.wAwake }, { x: 8, y: 0, ch: 'P', cond: g => !!g.s.flags.wAwake }];

function mural(g, id, intro) {
  const S = SONGS[id], first = !g.s.flags['song:' + id];
  g.s.flags['song:' + id] = true;
  const notes = S.seq.map(n => NOTE_GLYPH[n]).join(' ');
  return [intro, '«' + S.name + '»:   ' + notes, ...(first ? [g2 => { Sound.sfx('secret'); g2.saveGame(); return ['Hai imparato il ' + (id === 'risveglio' ? '' : 'canto della ') + S.name.toUpperCase() + '! ' + (g2.s.items.conch ? 'Suonalo con la Conca: ' + bombKey() + ', poi le frecce.' : 'Ti servirà qualcosa con cui suonarlo.')]; }] : [])];
}

/* ------------------------------ le statue dei Coraliani ------------------------------ */
class CoralStatue extends Entity {
  constructor(def, awake) { super((awake ? def.to[0] : def.x) * TS, (awake ? def.to[1] : def.y) * TS); this.def = def; this.solid = true; this.hb = { x: 1, y: 2, w: 14, h: 13 }; this.move = null; this.awake = awake; this.t = 0; }
  wake(g) {
    if (this.awake) return;
    this.awake = true; g.s.flags['awake:' + this.def.id] = true;
    this.move = { x0: this.x, y0: this.y, x1: this.def.to[0] * TS, y1: this.def.to[1] * TS, t: 0 };
    Sound.sfx('stomp');
  }
  update(g) {
    this.t++;
    if (this.move) { const m = this.move, k = Math.min(1, ++m.t / 40); this.x = m.x0 + (m.x1 - m.x0) * k; this.y = m.y0 + (m.y1 - m.y0) * k; if (k >= 1) this.move = null; }
  }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y), on = this.awake;
    drawShadow(c, X + 8, Y + 15, 12);
    c.fillStyle = '#1a1420'; c.fillRect(X + 3, Y - 4, 10, 19);
    c.fillStyle = on ? '#8ad0c0' : '#7a8a88'; c.fillRect(X + 4, Y - 3, 8, 17);   // pietra di corallo: si colora quando si sveglia
    c.fillStyle = on ? '#b8f0e0' : '#9aaaa8'; c.fillRect(X + 5, Y - 3, 2, 15);
    c.fillStyle = on ? '#ffe8a0' : '#4a5a58'; c.fillRect(X + 5, Y, 2, 1); c.fillRect(X + 9, Y, 2, 1);   // gli occhi
    c.fillStyle = '#f0b0c0'; c.fillRect(X + 9, Y + 3, 4, 3); c.fillStyle = '#fff0e8'; c.fillRect(X + 10, Y + 4, 2, 1);   // la conchiglia alle labbra
  }
}

/* ------------------------------ LA MADRE DELLE ACQUE ------------------------------ */
class Madre extends Entity {
  constructor(g) {
    super(128 - 30, 4);
    this.hb = { x: 0, y: 0, w: 60, h: 36 }; this.solid = true;
    this.title = 'MADRE DELLE ACQUE'; this.maxHp = PHRASE_LEN.length; this.hp = this.maxHp;
    this.state = 'intro'; this.timer = 60; this.t = 0; this.calm = 0;
    this.phrases = PHRASE_LEN.map(n => { const out = []; let last = -1; for (let i = 0; i < n; i++) { let v; do { v = (Math.random() * 4) | 0; } while (v === last); out.push(v); last = v; } return out; });
    this.shown = []; this.heard = 0; this.fails = 0;
  }
  get sortY() { return -5; }
  get phrase() { return this.phrases[this.calm]; }
  hurt(g) { if (!this.clink) { this.clink = 30; Sound.sfx('splash'); g.particles.push(new Particle(g.player.cx(), g.player.cy() - 16, 0, -0.6, 24, '#a8e0ff', 2, 0)); if (!g.dialog && !this.toldSword) { this.toldSword = true; g.say(['La lama attraversa l\'acqua come se non ci fosse niente. Mareva aveva ragione: la spada, qui, non serve.']); } } }
  listen(n) {   // una nota suonata da Lio
    if (this.state !== 'listen') return;
    if (n !== this.phrase[this.heard]) { this.fail(Game); return; }
    if (++this.heard >= this.phrase.length) this.success(Game);
  }
  success(g) {
    this.calm++; this.hp = this.maxHp - this.calm; this.heard = 0; Sound.sfx('secret'); g.song = null;
    const lines = [
      ['Madre delle Acque: ...Una nota giusta. Da quanto tempo nessuno cantava per me.'],
      ['Madre delle Acque: Coralia mi cantava ogni sera, e io tenevo le onde lontane dalle sue case. Poi arrivò la luce di Vesper, e si dimenticarono di me.'],
      ['Madre delle Acque: Il cielo si prese la loro voce. Io mi presi la loro città. Era giusto così, pensavo.'],
      ['Madre delle Acque: E quando la stella cadde nel mio fondo, la tenni. Che il cielo perdesse qualcosa, per una volta. Umbra la teneva stretta per me.'],
    ];
    if (this.calm >= this.maxHp) { this.state = 'peace'; this.timer = 40; return; }
    g.say(lines[this.calm - 1]);
    this.state = 'pause'; this.timer = 70;
  }
  fail(g) {
    this.heard = 0; this.fails++; g.song = null; Sound.sfx('roar'); g.shake = 10;
    const W = g.room.waves, travel = Math.ceil((PLAY_H + 40) / W.speed);
    g.waveT = Math.floor(g.waveT / W.period) * W.period + W.period - travel - WAVE_WARN;   // l'onda parte subito (con il suo brontolio)
    g.waveHit = -1;
    this.state = 'wrath'; this.timer = WAVE_WARN + travel + 30;
    if (!g.dialog) g.say([this.fails === 1 ? 'Madre delle Acque: NO. Non è il mio canto. Il mare non ascolta chi stona.' : 'La Madre delle Acque si gonfia: un\'onda si alza dal fondo della sala.']);
  }
  update(g) {
    this.t++; if (this.clink > 0) this.clink--;
    switch (this.state) {
      case 'intro': if (!g.dialog && --this.timer <= 0) this.startSing(g); break;
      case 'sing': {
        const k = Math.floor(this.timer / NOTE_T());
        if (this.timer % NOTE_T() === 0 && k < this.phrase.length) { this.shown.push({ n: this.phrase[k], t: 0 }); Sound.sfx('note' + this.phrase[k]); }
        this.timer++;
        if (k >= this.phrase.length + 1) { this.state = 'listen'; this.timer = LISTEN_T(); this.heard = 0; if (!g.s.flags.wDuelTip) { g.s.flags.wDuelTip = true; g.say(['Ora tocca a te: suona con la Conca (' + bombKey() + ', poi le frecce) la stessa frase, nota per nota. E attento alle onde: suona al riparo.']); } }
        break;
      }
      case 'listen': if (!g.dialog && --this.timer <= 0) this.fail(g); break;
      case 'wrath': case 'pause': if (!g.dialog && --this.timer <= 0) this.startSing(g); break;
      case 'peace': if (!g.dialog && --this.timer <= 0) { this.state = 'done'; madrePeace(g, this); } break;
    }
    for (const s of this.shown) s.t++;
    this.shown = this.shown.filter(s => s.t < 120);
  }
  startSing(g) { this.state = 'sing'; this.timer = 0; this.shown = []; this.heard = 0; }
  draw(c, g) {
    const t = this.t, cx = 128, k = this.calm / this.maxHp, X = this.x;
    const deep = k < 0.5 ? '#1a3a6a' : '#2a6a8a', mid = k < 0.5 ? '#2a5a9a' : '#4aa0b8', light = k < 0.5 ? '#6aa0d8' : '#a0e8e0';
    // il corpo d'acqua che sale dal bacino: contorno scuro, poi l'acqua, chiara in alto e profonda in basso
    const body = r => 16 + r * 1.1 + Math.sin(t * 0.06 + r * 0.35) * 2;
    for (let r = 0; r < 40; r++) { const w = body(r); c.fillStyle = '#0a1420'; c.fillRect(Math.round(cx - w / 2) - 1, 6 + r, Math.round(w) + 2, 1); }
    for (let r = 0; r < 40; r++) { const w = body(r); c.fillStyle = r < 6 ? light : r < 22 ? mid : deep; c.fillRect(Math.round(cx - w / 2), 6 + r, Math.round(w), 1); if (r % 4 === 1) { c.fillStyle = light; c.fillRect(Math.round(cx - w / 2 + 2 + Math.sin(t * 0.1 + r) * 2), 6 + r, 3, 1); } }
    // le braccia che si alzano dall'acqua, e le mani
    const lift = this.state === 'sing' ? 4 : this.state === 'wrath' ? 7 : 1;
    for (const sd of [-1, 1]) for (let i2 = 0; i2 < 14; i2++) { const x = cx + sd * (16 + i2 * 1.4), y = 30 - i2 * (0.9 + lift * 0.08) + Math.sin(t * 0.08 + i2 * 0.4) * 1.5; c.fillStyle = '#0a1420'; c.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 4); c.fillStyle = i2 > 11 ? light : mid; c.fillRect(Math.round(x) - 1, Math.round(y), 3, 2); }
    // la cresta di schiuma e i capelli d'onda
    for (let i2 = 0; i2 < 22; i2++) { const s2 = Math.sin(t * 0.05 + i2 * 0.5) * 3; c.fillStyle = i2 % 3 ? '#e8f8ff' : light; c.fillRect(Math.round(cx - 12 - i2 * 0.9 + s2), 2 + i2 * 1.6, 3, 2); c.fillRect(Math.round(cx + 9 + i2 * 0.9 - s2), 2 + i2 * 1.6, 3, 2); }
    for (let i2 = -10; i2 <= 10; i2 += 2) { c.fillStyle = '#ffffff'; c.fillRect(cx + i2, 1 + Math.round(Math.abs(Math.sin(t * 0.1 + i2)) * 2), 2, 2); }
    // il volto e l'OCCHIO (uno solo, enorme)
    c.fillStyle = '#0a1420'; c.fillRect(cx - 9, 4, 18, 15);
    c.fillStyle = k < 0.5 ? '#b8d8f0' : '#d8f4f0'; c.fillRect(cx - 8, 5, 16, 13);
    const open = this.state !== 'intro' || this.timer < 40, angry = k < 0.5 && this.state === 'wrath';
    if (open) { c.fillStyle = '#ffffff'; c.fillRect(cx - 6, 8, 12, 6); c.fillStyle = angry ? '#c02a3a' : k < 0.5 ? '#1a6a5a' : '#2aa08a'; c.fillRect(cx - 3, 8, 6, 6); c.fillStyle = '#0a1a20'; c.fillRect(cx - 1, 9, 2, 4); c.fillStyle = '#ffffff'; c.fillRect(cx + 1, 9, 1, 1); }
    else { c.fillStyle = deep; c.fillRect(cx - 6, 11, 12, 1); }
    if (this.state === 'sing') { c.fillStyle = 'rgba(255,240,200,0.8)'; c.fillRect(cx - 2, 15, 4, 2); }
    // le note cantate: salgono e svaniscono
    this.shown.forEach((s, i) => { const x = cx - 40 + i * 16, y = 46 - Math.min(10, s.t * 0.3); drawNote(c, x, y, s.n, Math.max(0, 1 - s.t / 120)); });
    // in ascolto: la frase da ripetere, e quante note hai già indovinato
    if (this.state === 'listen') {
      const n = this.phrase.length, x0 = cx - n * 8;
      for (let i = 0; i < n; i++) { c.fillStyle = i < this.heard ? NOTE_COL[this.phrase[i]] : 'rgba(255,255,255,0.35)'; c.fillRect(x0 + i * 16 + 6, 50, 4, 4); }
      const w = Math.round(80 * this.timer / LISTEN_T()); c.fillStyle = 'rgba(160,224,255,0.6)'; c.fillRect(cx - 40, 57, w, 2);
    }
  }
}
function drawNote(c, x, y, n, a) {   // una freccia colorata: la nota
  c.globalAlpha = a; c.fillStyle = '#1a1420'; c.fillRect(x - 5, y - 5, 11, 11);
  c.fillStyle = NOTE_COL[n];
  const pts = { 0: [[0, -3], [-1, -2], [0, -2], [1, -2], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [-1, 1], [0, 1], [1, 1], [-1, 2], [0, 2], [1, 2]] }[0];
  for (const [px, py] of pts) { const [rx, ry] = n === 0 ? [px, py] : n === 2 ? [px, -py] : n === 1 ? [-py, px] : [py, px]; c.fillRect(x + rx, y + ry, 1, 1); }
  c.globalAlpha = 1;
}

function madrePeace(g, m) {
  const f = g.s.flags;
  f.wMother = true; g.boss = null;
  if (typeof bestMark === 'function') bestMark(g, m, true);
  for (const [x, y] of [[7, 10], [8, 10]]) g.tiles[y][x] = 'P';
  g.redrawBg();
  g.pickups.push(new Pickup(128, 70, 'container'));
  Sound.music('temple'); g.saveGame();
  g.say([
    'La Madre delle Acque tace. Il suo occhio, enorme, ti guarda senza rabbia. Per la prima volta, ascolta.',
    "Madre delle Acque: Mi hai cantato il Canto intero, piccolo cantore. Ma la stella... la stella resta una ferita. Il cielo me l'ha tolta, di nuovo.",
    'Fai vibrare il Diapason: la nota di Vesper, la voce del cielo. La lasci risuonare sopra il Canto della Marea, finché le due voci non si intrecciano.',
    g2 => { Sound.sfx('ring'); Sound.sfx('fairy'); g2.shake = 6; },
    'Madre delle Acque: ...Fratello. Allora anche tu sai cantare per me. Non me l\'avevi mai detto.',
    'Madre delle Acque: Va bene. Il cielo e il mare faranno pace. Il mare tornerà gentile, e Coralia dormirà sotto le onde come sotto una coperta.',
    'Madre delle Acque: Ma voi, a terra, ricordatevi di cantare. Una volta all\'anno, almeno. Il mare ha bisogno di sentirsi ricordato.',
    "Lontano, al largo, l'Onda Grande si scioglie in schiuma. Piano piano, il mare torna a coprire Coralia.",
    g2 => { g2.s.flags.seaCalm = true; g2.saveGame(); g2.ch5CardIn = 60; },
  ]);
}

/* ------------------------------ installazione ------------------------------ */
(function installTideTemple() {
  const G = Game;

  /* il livello dell'acqua del Tempio: wt = acqua con la marea alta (pietra con la bassa); wf = passerelle (galleggiano con la marea alta) */
  function applyWater(g) {
    const def = g.room; if (!def || !def.temple) return;
    const high = wLvl(g) === 'high', floor = floorOf(def.ground), p = g.player;
    const pb = p && p.box(), onIt = (x, y) => pb && overlap(pb, { x: x * TS, y: y * TS, w: TS, h: TS });
    let changed = false; g.waterPending = false;
    const set = (x, y, ch) => { if (g.tiles[y][x] !== ch) { if (onIt(x, y) && ch !== floor) { g.waterPending = true; return; } g.tiles[y][x] = ch; changed = true; } };   // mai acqua o vuoto sotto i piedi di Lio
    for (const [x, y] of def.wt || []) set(x, y, high ? '~' : floor);
    for (const [x, y] of def.wf || []) set(x, y, high ? floor : '_');
    if (changed) { g.redrawBg(); if (window.rebuildAnimTiles) rebuildAnimTiles(g); }
  }
  window.applyWater = applyWater;

  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.call(this, id);
    this.song = null; this.songListener = null;
    const def = ROOMS[id]; if (!def || !def.temple) return;
    applyWater(this);
    for (const s of def.statues || []) this.entities.push(new CoralStatue(s, !!this.s.flags['awake:' + s.id]));
    if (id === 'w:1,0' && !this.s.flags.wMother) {
      this.boss = new Madre(this); this.entities.push(this.boss);
      for (const [x, y] of [[7, 10], [8, 10]]) this.tiles[y][x] = 'W';
      this.redrawBg();
    }
  };

  /* la Conca: X per suonare, X per smettere; le frecce sono le note */
  const useItem = G.useItem;
  G.useItem = function () {
    if (this.equipped() !== 'conch') return useItem.call(this);
    if (this.song) { this.song = null; Sound.sfx('select'); return; }
    this.song = { buf: [], t: 0 }; Sound.sfx('select');
  };
  function playNote(g, n) {
    Sound.sfx('note' + n);
    const S = g.song; S.buf.push(n); if (S.buf.length > 8) S.buf.shift(); S.flash = 12; S.last = n;
    if (g.boss instanceof Madre && g.boss.state === 'listen') { g.boss.listen(n); return; }
    for (const id in SONGS) {
      if (!g.s.flags['song:' + id]) continue;
      const seq = SONGS[id].seq;
      if (S.buf.length >= seq.length && seq.every((v, i) => S.buf[S.buf.length - seq.length + i] === v)) { S.done = { id, t: 40 }; return; }
    }
  }
  function performSong(g, id) {
    g.song = null;
    const name = SONGS[id].name;
    g.banner = { text: name, t: 90 }; Sound.sfx('fairy');
    if (!inTemple(g)) { g.say(['La Conca risuona, e da qualche parte il mare risponde con un brontolio lontano. Ma qui non succede niente.']); return; }
    if (id === 'bassa' || id === 'alta') {
      const want = id === 'bassa' ? 'low' : 'high';
      if (wLvl(g) === want) { g.say([id === 'bassa' ? 'L\'acqua del Tempio è già bassa.' : 'L\'acqua del Tempio è già alta.']); return; }
      g.s.wLvl = want; g.shake = 10; Sound.sfx('splash'); applyWater(g); g.saveGame();
      g.say([id === 'bassa' ? 'Il Tempio trema. Da tutte le sale l\'acqua si ritira, gorgogliando, e scopre la pietra.' : 'Il Tempio trema. L\'acqua sale da sotto il pavimento e riempie i canali e le vasche.']);
      return;
    }
    if (id === 'risveglio') {
      const st = g.entities.filter(e => e instanceof CoralStatue && !e.awake);
      if (!st.length) { g.say(['Il canto risuona tra le pareti. Nessuno, qui, sta dormendo.']); return; }
      st.forEach(s => s.wake(g));
      const f = g.s.flags;
      if (g.roomId === 'w:1,2') { f.wAwake = true; g.say(['Le due statue aprono gli occhi, abbassano le conchiglie... e si spostano di lato, con un rumore di pietra. La porta nord è libera.']); g.loadRoomTiles = 1; }
      else g.say(['Le statue aprono gli occhi e si voltano verso di te. Lentamente, si fanno da parte.']);
      g.spawnChests(); g.saveGame();
    }
  }

  /* mentre suona, Lio non si muove e non colpisce: le frecce sono note */
  const pUpdate = Player.prototype.update;
  Player.prototype.update = function (g) {
    if (!g.song) return pUpdate.call(this, g);
    const held = Input.held, hit = Input.hit, block = ['up', 'down', 'left', 'right', 'action'];
    Input.held = a => block.includes(a) ? false : held.call(Input, a);
    Input.hit = a => block.includes(a) ? false : hit.call(Input, a);
    try { return pUpdate.call(this, g); } finally { Input.held = held; Input.hit = hit; }
  };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    if (this.song && this.state === 'play' && !this.dialog) {
      const S = this.song; S.t++; if (S.flash > 0) S.flash--;
      if (S.done) { if (--S.done.t <= 0) { const id = S.done.id; S.done = null; performSong(this, id); } }
      else { NOTE_KEYS.forEach((k, n) => { if (Input.hit(k)) playNote(this, n); }); if (Input.hit('action') || Input.hit('start')) { this.song = null; } }
      if (this.player && (this.player.hurtT > 60)) this.song = null;   // un colpo interrompe il canto
    }
    updatePlay.call(this);
    if (this.waterPending && this.state === 'play') applyWater(this);
    if (this.loadRoomTiles && !this.dialog) { this.loadRoomTiles = 0; const p = this.player, x = p.x, y = p.y; this.loadRoom(this.roomId); p.x = x; p.y = y; }
  };

  /* il cartello di fine Capitolo V */
  const update = G.update;
  G.update = function () {
    if (this.state === 'chapter5') {
      this.t++; this.ch5T++;
      if (this.ch5T > 120 && (Input.hit('action') || Input.hit('start'))) {
        this.state = 'play'; this.s.flags.ch5Done = true; this.saveGame(); Sound.sfx('select');
        this.startWarp({ to: 'm:1,1', x: 7, y: 7, dir: 0 }, 'Z');   // di nuovo a Porto Corallo, con il mare tornato al suo posto
      }
      return;
    }
    update.call(this);
    if (this.ch5CardIn > 0 && this.state === 'play' && !this.dialog && --this.ch5CardIn === 0) { this.state = 'chapter5'; this.ch5T = 0; Sound.sfx('victory'); }
  };
  const render = G.render;
  G.render = function () {
    render.call(this);
    if (this.state === 'chapter5') {
      const t = this.ch5T, a = Math.min(0.75, t / 60), ta = Math.max(0, Math.min(1, (t - 30) / 40));
      sctx.fillStyle = 'rgba(4,14,28,' + a + ')'; sctx.fillRect(0, 0, GW * SCALE, GH * SCALE);
      if (ta <= 0) return;
      txt('CAPITOLO V', 128, 46, { align: 'center', size: 11, color: '#c8bcd8', alpha: ta });
      txt('La Città Sommersa', 128, 63, { align: 'center', size: 12, font: TITLE_FONT, color: '#ffd870', alpha: ta });
      txt('— completato —', 128, 84, { align: 'center', size: 11, color: '#f4ecdc', alpha: ta });
      txt('Il cielo e il mare hanno fatto pace, e il mare è tornato gentile.', 128, 104, { align: 'center', size: 10, color: '#f4ecdc', alpha: ta, maxW: 236 });
      txt('Ma sotto Brinavalle, quella notte, la terra ha cominciato a tremare...', 128, 116, { align: 'center', size: 10, color: '#a8c8f8', alpha: ta, maxW: 236 });
      txt('Tempo ' + fmtTime(this.s.time) + ' · Cuori ' + this.s.maxHp / 2, 128, 136, { align: 'center', size: 9, color: '#c8bcd8', alpha: ta });
      if (t > 120) txt('Premi ' + actKey(true) + ' per continuare', 128, 158, { align: 'center', size: 9, color: '#a898c0', alpha: 0.6 + Math.sin(t * 0.08) * 0.3 });
      return;
    }
    if (this.song && this.state === 'play') {   // il pentagramma della Conca, sopra il testo del gioco
      const S = this.song, y0 = (HUD_H + 132) * SCALE;
      sctx.fillStyle = 'rgba(8,10,24,0.82)'; sctx.fillRect(40 * SCALE, y0, 176 * SCALE, 38 * SCALE);
      txt('Conca: frecce = note  ·  ' + (isTouch() ? '⇄' : 'X') + ': smetti', 128, HUD_H + 133, { size: 9, align: 'center', color: '#c8bcd8' });
      S.buf.forEach((n, i) => txt(NOTE_GLYPH[n], 72 + i * 16, HUD_H + 144, { size: 12, align: 'center', color: NOTE_COL[n], alpha: i === S.buf.length - 1 && S.flash > 0 ? 1 : 0.85 }));
      const known = Object.keys(SONGS).filter(id => this.s.flags['song:' + id]);
      txt(known.length ? known.map(id => SONGS[id].name + ' ' + SONGS[id].seq.map(n => NOTE_GLYPH[n]).join('')).join('   ') : 'Non conosci ancora nessuna melodia.', 128, HUD_H + 159, { size: 8, align: 'center', color: '#a8e0d0', maxW: 172 });
    }
  };

  /* l'acqua del Tempio, quando è bassa, lascia segni umidi; la Madre ha il suo bacino */
  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    const def = this.room; if (!def || !def.temple) return;
    if (wLvl(this) === 'low') for (const [x, y] of def.wt || []) { c.fillStyle = 'rgba(40,80,110,0.25)'; c.fillRect(x * TS, y * TS, TS, TS); c.fillStyle = 'rgba(160,220,255,0.25)'; c.fillRect(x * TS + ((this.t >> 3) + x * 5) % 14, y * TS + 6, 2, 1); }
    for (const [x, y] of def.wf || []) if (this.tiles[y][x] !== '_') { c.fillStyle = '#7a5a3a'; c.fillRect(x * TS + 1, y * TS + 2, TS - 2, TS - 4); c.fillStyle = '#9a7a4a'; c.fillRect(x * TS + 1, y * TS + 3, TS - 2, 2); c.fillStyle = '#5a3a1a'; c.fillRect(x * TS + 7, y * TS + 2, 1, TS - 4); }   // le passerelle di legno
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#a8d0d8'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore();
    if (this.song) { const p = this.player; for (let i = 0; i < 3; i++) { const a = this.t * 0.08 + i * 2.1; c.fillStyle = NOTE_COL[(this.song.last || 0)]; c.fillRect(Math.round(p.cx() + Math.cos(a) * 12), Math.round(p.cy() - 14 + Math.sin(a) * 4), 2, 2); } }
  };

  /* mappa */
  const mp = G.mapPrefix;
  G.mapPrefix = function () { return this.roomId.startsWith('w:') ? 'w:' : mp.call(this); };

  /* dopo la pace */
  const add = (room, id, fn) => { const n = (ROOMS[room] && ROOMS[room].npcs || []).find(x => x.id === id); if (n) { const t0 = n.talk; n.talk = function (g) { return fn(g) || t0.call(this, g); }; } };
  add('i:capitaneria', 'marisa', g => g.s.flags.wMother && !g.s.flags.marisaSea ? (g.s.flags.marisaSea = true, ['Marisa: Il mare è tornato, ma gentile: le onde arrivano piano, come se chiedessero il permesso. Stasera al porto si canta. Tutti quanti, anche i pescatori stonati.']) : null);
  add('i:osteria', 'lina', g => g.s.flags.wMother && !g.s.flags.linaSea ? (g.s.flags.linaSea = true, ['Lina: La Madre delle Acque... Mia nonna la chiamava così. Dicevano che bastava una canzone, una volta all\'anno. Ce ne siamo dimenticati per secoli.', 'Lina: Non succederà più. Ho già insegnato il Canto ai bambini del porto.']) : null);

  /* diario, obiettivo, Segnavia */
  if (window.CHAPTERS5) CHAPTERS5.push(
    { name: 'Il Tempio delle Maree', done: g => !!g.s.flags.wIn },
    { name: 'La Conca dei Coraliani', done: g => !!g.s.items.conch },
    { name: 'Il Canto della Marea', done: g => !!g.s.flags.wMother },
  );
  const wGoal = g => {
    const f = g.s.flags, it = g.s.items;
    if (!f.templeOpen || !ROOMS[TEMPLE_ROOM]) return null;
    if (f.wMother) return 'none';
    if (!f.wIn) return 'w:1,2';
    if (!it.conch || !f['song:bassa']) return 'w:0,2';
    if (!f['song:risveglio']) return 'w:2,2';
    if (!f.wAwake) return 'w:1,2';
    if (!f['song:alta']) return 'w:0,1';
    return 'w:1,0';
  };
  const co = currentObjective;
  currentObjective = function (g) {
    const goal = wGoal(g), f = g.s.flags, it = g.s.items;
    if (!goal) return co(g);
    if (goal === 'none') return f.ch5Done ? 'Il cielo e il mare hanno fatto pace. Ma la terra, sotto Brinavalle, trema...' : 'La Madre delle Acque ha ascoltato il Canto.';
    if (!f.wIn) return co(g);
    if (!it.conch) return 'Nella sala a ovest dell\'Atrio, su un isolotto, c\'è uno scrigno coperto di conchiglie.';
    if (!f['song:bassa']) return 'Leggi il murale della Sala della Conca: insegna una melodia.';
    if (!f['song:risveglio']) return 'Nelle Vasche, a est dell\'Atrio, l\'acqua è troppo alta. Suona la Marea Bassa (' + bombKey() + ', poi ▼ ◀ ▼).';
    if (!f.wAwake) return 'Torna nell\'Atrio e suona il Canto del Risveglio davanti alle statue della porta nord.';
    if (!f['song:alta']) return 'Le passerelle della Galleria sono sul fondo. A ovest, nella Sala del Canto Alto, un murale insegna a far salire l\'acqua.';   // Ciclo 43: accorciato (in pausa se ne vedono 4 righe; T43.sagaCheck)
    return wLvl(g) === 'high' ? 'Le passerelle galleggiano: attraversa la Galleria e sali al Cuore del Mare. Porta il Canto, non la spada.' : 'Suona la Marea Alta (▲ ▶ ▲) per far galleggiare le passerelle della Galleria, poi sali al Cuore del Mare.';
  };
  window.currentObjective = currentObjective;
  if (typeof objectiveRoom === 'function') {
    const or0 = objectiveRoom, oc0 = objectiveChest;
    objectiveRoom = function (g) { const t = wGoal(g); return t === 'none' ? null : t || or0(g); };
    window.objectiveRoom = objectiveRoom;
    objectiveChest = function (g) { return g.roomId === 'w:0,2' && !g.s.items.conch ? 'conch' : oc0(g); };
  }

  if (typeof BESTIARY !== 'undefined') {
    let pic = null;
    BESTIARY.push({ k: 'madre', name: 'Madre delle Acque', boss: true, seenIsEnough: true,
      spr: () => pic || (pic = (() => { const cv = makeCanvas(64, 48), m = new Madre(Game); m.state = 'pause'; const x = cv.getContext('2d'); x.translate(-96, 0); try { m.draw(x, Game); } catch (e) {} return cv; })()),
      lore: 'Lo spirito del mare. Coralia le cantava ogni sera; dimenticata, si prese la città. Il cielo è suo fratello geloso.',
      weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ 'Ascolta la sua frase e ripetila con la Conca, al riparo dalle onde.' });
    const bk = bestKey;
    bestKey = function (e) { return e instanceof Madre ? 'madre' : bk(e); };
  }
  if (typeof MEDALS !== 'undefined') MEDALS.push(
    { id: 'pacemare', name: 'Cielo e mare', desc: 'Riporta la pace tra il cielo e il mare.', icon: 'heart', tier: 2, got: g => !!g.s.flags.wMother },   // (l'id «canto» è già la medaglia del portone, Ciclo 36)
    { id: 'coraliani', name: 'Cantore di Coralia', desc: 'Impara le tre melodie del Tempio.', icon: 'gem5', tier: 0, got: g => Object.keys(SONGS).every(id => g.s.flags['song:' + id]) });
  Object.assign(window, { CoralStatue, Madre, SONGS, applyWater, wLvl, playNote, performSong });
})();
