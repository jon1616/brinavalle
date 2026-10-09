'use strict';
/* =====================================================================
 *  MEDALS — Ciclo 7 (Agente A): l'ALBO D'ORO.
 *  14 medaglie e i record, salvati in localStorage ('brinavalle_medals'),
 *  GLOBALI: restano anche se ricominci una nuova partita.
 *  · voce "Albo d'oro" nel titolo (schermata con tutte le medaglie e i record)
 *  · notifica in gioco quando ne ottieni una (con fanfara)
 *  Per aggiungere una medaglia: una riga in MEDALS con una funzione `got(g)`.
 * ===================================================================== */
const MEDALS_KEY = 'brinavalle_medals';
const MEDALS = [
  { id: 'spada', name: 'La lama di brina', desc: 'Ottieni la Spada di Brina.', icon: 'sword', tier: 0, got: g => g.s.items.sword },
  { id: 'golem', name: 'Domatore di ghiaccio', desc: 'Sconfiggi il Golem di Brina.', icon: 'bombs', tier: 0, got: g => g.s.flags.golem },
  { id: 'abisso', name: 'Funambolo', desc: "Attraversa l'Abisso e prendi la Chiave del Re.", icon: 'hookshot', tier: 0, got: g => g.s.items.bigkey },
  { id: 'alba', name: "L'alba ritorna", desc: 'Sconfiggi il Re dei Rovi e salva Brinavalle.', icon: 'crystal', tier: 1, got: g => g.s.flags.victory },
  { id: 'fata', name: 'Amica della fata', desc: 'Trova la fonte nascosta della Fata della Brina.', icon: 'container', tier: 0, got: g => g.s.flags.fairyGift },
  { id: 'turbine', name: 'Turbine', desc: 'Sconfiggi 3 nemici con un solo fendente rotante.', icon: 'sword', tier: 1, got: g => (g.spinCombo || 0) >= 3 },
  { id: 'tesori', name: 'Collezionista', desc: 'Apri tutti i forzieri della valle.', icon: 'key', tier: 1, got: g => allChests().every(id => g.s.flags['chest:' + id]) },
  { id: 'cuori', name: "Cuore d'acciaio", desc: 'Raggiungi 9 cuori.', icon: 'heart', tier: 1, got: g => g.s.maxHp >= 18 },
  { id: 'giardino', name: 'Pollice verde', desc: "Fai fiorire il giardino con i 5 Semi dell'Alba.", icon: 'seed', tier: 1, got: g => g.s.flags.garden },
  { id: 'luccio', name: 'Leggenda del lago', desc: 'Pesca il Luccio Lunare.', icon: 'hook', tier: 1, got: g => g.s.fishLog && g.s.fishLog.luccio },
  { id: 'pesca', name: 'Pescatore provetto', desc: 'Pesca tutte e 5 le specie del lago.', icon: 'gem5', tier: 1, got: g => g.s.fishLog && typeof FISH !== 'undefined' && FISH.every(f => g.s.fishLog[f.id]) },
  { id: 'veloce', name: 'Come il vento', desc: 'Salva Brinavalle in meno di 40 minuti.', icon: 'lantern', tier: 2, got: g => g.s.flags.victory && g.s.winTime !== undefined && g.s.winTime < 40 * 60 },
  { id: 'intatto', name: 'Senza una caduta', desc: 'Salva Brinavalle senza mai essere sconfitto.', icon: 'potion', tier: 2, got: g => g.s.flags.victory && g.s.winDeaths === 0 },
  { id: 'eroe', name: 'Vero eroe', desc: 'Salva Brinavalle giocando sempre a difficoltà Eroe.', icon: 'bigkey', tier: 2, got: g => g.s.flags.victory && g.s.winMinDiff === 2 },
];
const TIER_COL = [['#c8885a', '#f0b888', '#7a4a2a'], ['#c8c8d8', '#ffffff', '#6a6a7a'], ['#e8b830', '#fff0a0', '#8a6a10']];   // bronzo, argento, oro

const Medals = {
  data: /[?&]test(&|=|$)/.test(location.search) ? { got: {}, wins: 0, best: null } : (() => { try { return Object.assign({ got: {}, wins: 0, best: null }, JSON.parse(localStorage.getItem(MEDALS_KEY)) || {}); } catch (e) { return { got: {}, wins: 0, best: null }; } })(),
  testMode: /[?&]test(&|=|$)/.test(location.search),   // con ?test i bot non toccano l'Albo d'oro vero
  save() { if (this.testMode) return; try { localStorage.setItem(MEDALS_KEY, JSON.stringify(this.data)); } catch (e) {} },
  has(id) { return !!this.data.got[id]; },
  count() { return MEDALS.filter(m => this.has(m.id)).length; },
  award(g, m) {
    if (this.has(m.id)) return;
    this.data.got[m.id] = Date.now(); this.save();
    g.medalQueue.push(m);
    Sound.sfx('medal');
  },
  check(g) {
    if (!g.s) return;
    for (const m of MEDALS) { if (this.has(m.id)) continue; let ok = false; try { ok = !!m.got(g); } catch (e) {} if (ok) this.award(g, m); }
  },
};

const _medalCache = new Map();
const MEDAL_ROWS = 7;   // righe visibili nell'Albo d'oro (Ciclo 16)
function medalImage(m, locked) {
  const key = m.id + (locked ? '?' : '');
  if (_medalCache.has(key)) return _medalCache.get(key);
  const c = makeCanvas(18, 22), x = c.getContext('2d'), col = locked ? ['#3a3050', '#4a4060', '#1a1428'] : TIER_COL[m.tier];
  // nastrino
  x.fillStyle = locked ? '#2a2238' : ['#8a2a3a', '#2a4a8a', '#2a6a3a'][m.tier];
  x.fillRect(4, 0, 4, 7); x.fillRect(10, 0, 4, 7);
  x.fillStyle = locked ? '#3a3050' : ['#c84a5a', '#4a7ac8', '#4aa85a'][m.tier];
  x.fillRect(5, 0, 2, 6); x.fillRect(11, 0, 2, 6);
  // disco
  for (let y = 0; y < 16; y++) for (let i = 0; i < 18; i++) {
    const d = Math.hypot(i - 8.5, y - 7.5);
    if (d < 8) { x.fillStyle = d > 7 ? col[2] : (i + y < 13 ? col[1] : col[0]); x.fillRect(i, y + 5, 1, 1); }
  }
  if (!locked) {
    const ic = ICON[m.icon];
    if (ic) { const s = Math.min(1, 11 / Math.max(ic.width, ic.height)); x.drawImage(ic, Math.round(9 - ic.width * s / 2), Math.round(13 - ic.height * s / 2), Math.round(ic.width * s), Math.round(ic.height * s)); }
  } else { x.fillStyle = '#6a6080'; x.fillRect(8, 9, 2, 5); x.fillRect(8, 15, 2, 2); x.fillRect(6, 8, 6, 2); x.fillRect(10, 9, 2, 3); }
  _medalCache.set(key, c);
  return c;
}

(function installMedals() {
  const G = Game;
  G.medalQueue = []; G.medalToast = null; G.spinCombo = 0;

  /* --- voce nel titolo --- */
  const titleItems = G.titleItems;
  G.titleItems = function () { const it = titleItems.call(this); const i = it.indexOf('Opzioni'); it.splice(i < 0 ? it.length : i, 0, "Albo d'oro"); return it; };
  const updateTitle = G.updateTitle;
  G.updateTitle = function () {
    const items = this.titleItems();
    if ((Input.hit('action') || Input.hit('start')) && items[this.menuIdx] === "Albo d'oro") {
      this.state = 'medals'; this.medalIdx = 0; Sound.sfx('select'); return;
    }
    return updateTitle.call(this);
  };

  /* --- stato 'medals' --- */
  const update = G.update;
  G.update = function () {
    if (this.state !== 'medals') return update.call(this);
    this.t++;
    const n = MEDALS.length;
    if (Input.hit('down')) { this.medalIdx = (this.medalIdx + 2) % n; Sound.sfx('select'); }
    if (Input.hit('up')) { this.medalIdx = (this.medalIdx + n - 2) % n; Sound.sfx('select'); }
    if (Input.hit('left') || Input.hit('right')) { this.medalIdx ^= 1; Sound.sfx('select'); }
    if (Input.hit('start') || Input.hit('action') || Input.hit('item')) { this.state = 'title'; Sound.sfx('select'); }
  };

  /* --- controlli durante il gioco + record alla vittoria --- */
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (!this.s) return;
    this.s.minDiff = Math.min(this.s.minDiff === undefined ? Opts.diff : this.s.minDiff, Opts.diff);
    if (this.t % 30 === 0) Medals.check(this);
    if (!this.medalToast && this.medalQueue.length && !this.dialog) this.medalToast = { m: this.medalQueue.shift(), t: 0 };
    if (this.medalToast && ++this.medalToast.t > 200) this.medalToast = null;
  };
  const newGame = G.newGame;
  G.newGame = function () { const r = newGame.call(this); this.s.minDiff = Opts.diff; this.spinCombo = 0; return r; };
  const finishEnding = G.finishEnding;
  G.finishEnding = function () {
    const s = this.s;
    if (s.winTime === undefined) {   // la prima vittoria di questa partita
      s.winTime = s.time; s.winDeaths = s.deaths || 0; s.winMinDiff = s.minDiff === undefined ? Opts.diff : Math.min(s.minDiff, Opts.diff);
      Medals.data.wins = (Medals.data.wins || 0) + 1;
      if (Medals.data.best === null || s.time < Medals.data.best) Medals.data.best = Math.round(s.time);
      Medals.save();
    }
    const r = finishEnding.call(this);
    Medals.check(this);
    return r;
  };
  /* fendente rotante: conta i nemici sconfitti dallo stesso giro */
  const die = Enemy.prototype.die;
  Enemy.prototype.die = function (g) {
    die.call(this, g);
    const p = g.player;
    if (p && p.spinT > 0) {
      if (g.spinId !== p.spinHit) { g.spinId = p.spinHit; g.spinCount = 0; }
      g.spinCount++;
      g.spinCombo = Math.max(g.spinCombo || 0, g.spinCount);
    }
  };

  /* --- disegno: schermata dell'Albo e notifica in gioco --- */
  const render = G.render;
  G.render = function () {
    if (this.state === 'medals') return this.drawMedals();
    render.call(this);
    const tt = this.medalToast;
    if (tt && !this.dialog && this.state === 'play') {
      const k = Math.min(1, tt.t / 12, (200 - tt.t) / 16), s = SCALE, w = 132, h = 26, x = GW - w - 4, y = GH - h - 4 + (1 - k) * 30;
      sctx.globalAlpha = k;
      sctx.fillStyle = '#e8d8b0'; sctx.fillRect((x - 1) * s, (y - 1) * s, (w + 2) * s, (h + 2) * s);
      sctx.fillStyle = 'rgba(20,12,34,0.96)'; sctx.fillRect(x * s, y * s, w * s, h * s);
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(medalImage(tt.m, false), (x + 4) * s, (y + 2) * s, 18 * s, 22 * s);
      txt('MEDAGLIA!', x + 26, y + 2, { size: 10, color: '#ffd870', alpha: k });
      txt(tt.m.name, x + 26, y + 12, { size: 11, color: '#ffffff', alpha: k });
      sctx.globalAlpha = 1;
    }
  };
  /* prima riga visibile della griglia: la selezione resta sempre dentro le MEDAL_ROWS righe visibili */
  G.medalTop = function () {
    const rowsTot = Math.ceil(MEDALS.length / 2), sel = (this.medalIdx || 0) >> 1;
    return Math.max(0, Math.min(rowsTot - MEDAL_ROWS, sel - 3));
  };
  G.drawMedals = function () {
    const c = bctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    this.drawLandscape(c, this.t, Medals.count() >= MEDALS.length ? 1.2 : 0);
    c.fillStyle = 'rgba(12,8,22,0.82)'; c.fillRect(0, 0, GW, GH);
    // Ciclo 16 (Agente B): con 17 medaglie la 8a e la 9a riga finivano sopra la descrizione e il piè di pagina.
    // Ora restano 7 righe visibili (lo spazio originale) e la griglia scorre con la selezione.
    const top = this.medalTop();
    MEDALS.forEach((m, i) => {
      const col = i % 2, row = (i >> 1) - top, x = 10 + col * 122, y = 23 + row * 19, sel = i === this.medalIdx;
      if (row < 0 || row >= MEDAL_ROWS) return;
      if (sel) { c.fillStyle = 'rgba(255,216,112,0.18)'; c.fillRect(x - 2, y - 1, 120, 20); }
      c.drawImage(medalImage(m, !Medals.has(m.id)), x, y - 2);
    });
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(buf, 0, 0, GW * SCALE, GH * SCALE);
    txt("ALBO D'ORO", 128, 5, { align: 'center', size: 10, font: TITLE_FONT, color: '#ffd870' });
    txt(Medals.count() + '/' + MEDALS.length, 246, 6, { align: 'right', size: 11, color: '#c8bcd8' });
    const rowsTot = Math.ceil(MEDALS.length / 2);
    if (top > 0) txt('▲', 128, 16, { align: 'center', size: 8, color: '#ffd870' });
    if (top + MEDAL_ROWS < rowsTot) txt('▼ altre medaglie', 128, 154, { align: 'center', size: 9, color: '#ffd870' });
    MEDALS.forEach((m, i) => {
      const col = i % 2, row = (i >> 1) - top, x = 10 + col * 122, y = 23 + row * 19, got = Medals.has(m.id);
      if (row < 0 || row >= MEDAL_ROWS) return;
      txt(got ? m.name : '? ? ?', x + 21, y + 3, { size: 11, color: got ? (i === this.medalIdx ? '#ffd870' : '#f4ecdc') : '#9a8ac0', maxW: 98 });   // Ciclo 8: resta nella sua colonna anche col font di ripiego
    });
    const m = MEDALS[this.medalIdx], d = Medals.data;
    txt(m.desc + (Medals.has(m.id) ? '  ✓' : ''), 128, 165, { align: 'center', size: 11, color: Medals.has(m.id) ? '#c8ffd0' : '#d8c8e8' });
    txt('Vittorie: ' + (d.wins || 0) + '   ·   Miglior tempo: ' + (d.best === null || d.best === undefined ? '--' : fmtTime(d.best)) + '   ·   Invio: indietro', 128, 178, { align: 'center', size: 10, color: '#b0a0d0' });
  };
})();
