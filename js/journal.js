'use strict';
/* =====================================================================
 *  JOURNAL — Ciclo 13 (Agente A): il DIARIO DELL'AVVENTURA.
 *  Una seconda pagina del menu di pausa (tasto Q / ⇄ / Y):
 *   · a sinistra i capitoli della storia (fatti ✓, quello in corso ▶, i futuri ???)
 *   · a destra le missioni secondarie GIÀ SCOPERTE, con avanzamento e un
 *     indizio senza spoiler per quella selezionata (frecce su/giù).
 *  Nessuna missione nuova: il diario raccoglie quelle che il gioco ha già,
 *  sparse in 12 cicli di lavoro, perché nessuna resti invisibile.
 *  Per aggiungerne una: una riga in SIDE_QUESTS con seen/done/hint (e prog facoltativo).
 * ===================================================================== */
const CHAPTERS = [
  { name: 'Il risveglio', done: g => g.s.flags.intro },
  { name: 'La Spada di Brina', done: g => g.s.items.sword },
  { name: 'Il crollo', done: g => g.s.flags.collapse || g.s.flags.enteredDungeon },
  { name: 'La Grotta di Brina', done: g => g.s.items.bombs },
  { name: 'Nelle Rovine', done: g => g.s.flags.enteredDungeon },
  { name: "L'Arpione di Vesper", done: g => g.s.items.hookshot },
  { name: 'La Chiave del Re', done: g => g.s.items.bigkey },
  { name: 'Il Re dei Rovi', done: g => g.s.flags.boss },
  { name: "L'alba ritorna", done: g => g.s.flags.victory },
];
const fishCaught = g => (typeof FISH !== 'undefined' && g.s.fishLog) ? FISH.filter(f => g.s.fishLog[f.id]).length : 0;
const SIDE_QUESTS = [
  { name: "L'Amo d'Oro", seen: g => g.visited.has('o:0,2'), done: g => g.s.flags.hookReturned,
    hint: "Pino, al Lago Specchio, ha perso il suo amo nei ruscelli della Foresta Antica, oltre le Rovine." },
  { name: 'La fonte nascosta', seen: g => g.s.items.bombs || g.visited.has('i:fairy'), done: g => g.s.flags.fairyGift,
    hint: "L'eremita Silvano sa di una sorgente segreta, nella sua radura, dietro un masso incrinato." },
  { name: 'Il rifugio dei minatori', seen: g => g.s.flags.golem, done: g => g.s.flags.minersFound,
    hint: "Nell'Antro del Golem una parete suona vuota. Le bombe aprono più porte di quanto sembri." },
  { name: 'La cripta dimenticata', seen: g => g.s.flags.enteredDungeon && g.s.items.bombs, done: g => g.s.flags.cryptFound,
    hint: "Già nell'Atrio delle Rovine una parete è piena di crepe..." },
  { name: "L'isolotto del lago", seen: g => g.s.items.hookshot, done: g => g.s.flags['chest:c_islet'],
    hint: "Un forziere su un isolotto del Lago Specchio. Pino dice che dall'isola grande basterebbe un arpione." },
  { name: 'Il Crepaccio Gelato', seen: g => g.s.items.hookshot && g.s.flags.golem, done: g => g.s.items.tunic,
    hint: "Dietro l'Antro del Golem si apre un crepaccio. Scivola fino all'unico gradino sul vuoto, poi... l'arpione." },
  { name: "I Semi dell'Alba", seen: g => g.s.flags.victory || (typeof seedCount === 'function' && seedCount(g) > 0), done: g => g.s.flags.garden,
    prog: g => seedCount(g) + '/' + SEED_IDS.length,
    hint: "Ortensio, davanti alle Rovine, vuole far rifiorire il giardino del tempio. Chiedigli un indizio." },
  { name: 'Il pescatore', seen: g => g.s.flags.hookReturned, done: g => fishCaught(g) >= 5,
    prog: g => fishCaught(g) + '/5',
    hint: "Pino ora ti presta la canna. Al largo, si dice, nuota il leggendario Luccio Lunare." },
  { name: 'La Sfida dei Guardiani', seen: g => g.s.flags.victory, done: () => Medals.data.rushBest > 0,
    hint: "Dal titolo, dopo il finale: tre guardiani di fila, contro il tempo." },
];

(function installJournal() {
  const G = Game;
  G.pausePage = 0; G.questIdx = 0;
  // Ciclo 57: la lista mostra QUEST_ROWS voci alla volta e scorre con la selezione (con 19 missioni le voci uscivano dal riquadro, fin sotto lo schermo)
  const QUEST_ROWS = 9;
  G.questTop = function (n) { return Math.max(0, Math.min((this.questIdx || 0) - 4, n - QUEST_ROWS)); };
  G.knownQuests = function () { return SIDE_QUESTS.filter(q => { try { return !!q.seen(this); } catch (e) { return false; } }); };

  const update = G.update;
  G.update = function () {
    if (this.state === 'pause' && !this.rush) {
      if (Input.hit('swap')) { this.pausePage ^= 1; this.questIdx = 0; Sound.sfx('select'); return; }
      if (this.pausePage === 1) {
        const n = this.knownQuests().length;
        if (n && Input.hit('down')) { this.questIdx = (this.questIdx + 1) % n; Sound.sfx('select'); return; }
        if (n && Input.hit('up')) { this.questIdx = (this.questIdx + n - 1) % n; Sound.sfx('select'); return; }
        if (Input.hit('left') || Input.hit('right')) return;   // sul diario le frecce non cambiano l'oggetto
      }
    }
    if (this.state !== 'pause') this.pausePage = 0;
    return update.call(this);
  };

  const drawPause = G.drawPause;
  G.drawPause = function (c) {
    if (this.pausePage !== 1 || this.rush) return drawPause.call(this, c);
    c.fillStyle = 'rgba(10,6,20,0.92)'; c.fillRect(0, 0, GW, GH);
    const box = (x, y, w, h) => { c.fillStyle = '#e8d8b0'; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = '#1c1430'; c.fillRect(x, y, w, h); };
    box(8, 22, 104, 112); box(118, 22, 130, 112); box(8, 139, 240, 32);
    const qs = this.knownQuests();
    if (qs.length) { c.fillStyle = 'rgba(255,216,112,0.16)'; c.fillRect(120, 35 + (this.questIdx - this.questTop(qs.length)) * 10.5, 126, 10); }
  };
  const drawPauseText = G.drawPauseText;
  G.drawPauseText = function () {
    if (this.pausePage !== 1 || this.rush) {
      drawPauseText.call(this);
      if (!this.rush) txt((isTouch() ? '⇄' : 'Q') + ': diario', 248, 5, { size: 10, align: 'right', color: '#a898c0' });
      return;
    }
    txt('DIARIO', 128, 5, { align: 'center', size: 9, font: TITLE_FONT, color: '#ffd870' });
    txt((isTouch() ? '⇄' : 'Q') + ': bestiario', 248, 5, { size: 10, align: 'right', color: '#a898c0' });   // Ciclo 20: poi viene il Bestiario (js/bestiary.js)
    txt('LA STORIA', 14, 24, { size: 11, color: '#ffd870' });
    let current = false;
    CHAPTERS.forEach((ch, i) => {
      const d = !!ch.done(this), cur = !d && !current;
      if (cur) current = true;
      const label = d ? '✓ ' + ch.name : cur ? '▶ ' + ch.name : '· ? ? ?';
      txt(label, 13, 35 + i * 10.5, { size: 10, color: d ? '#c8ffd0' : cur ? '#ffd870' : '#8070a0', maxW: 96 });
    });
    const qs = this.knownQuests();
    txt('MISSIONI SECONDARIE  ' + qs.filter(q => q.done(this)).length + '/' + qs.length, 124, 24, { size: 11, color: '#ffd870', maxW: 122 });
    if (!qs.length) txt('Ancora nessuna... esplora la valle!', 124, 37, { size: 10, color: '#b0a0d0', maxW: 122 });
    const top = this.questTop(qs.length);
    qs.slice(top, top + QUEST_ROWS).forEach((q, k) => {
      const i = top + k, d = !!q.done(this), sel = i === this.questIdx;
      txt((d ? '✓ ' : '· ') + q.name + (q.prog && !d ? '  ' + q.prog(this) : ''), 124, 35 + k * 10.5, { size: 10, color: d ? '#c8ffd0' : sel ? '#ffffff' : '#c8bcd8', maxW: 114 });
    });
    if (top > 0) txt('▲', 243, 34, { size: 9, align: 'right', color: '#ffd870' });   // ce ne sono altre sopra
    if (top + QUEST_ROWS < qs.length) txt('▼', 243, 122, { size: 9, align: 'right', color: '#ffd870' });   // e sotto
    const q = qs[this.questIdx];
    if (q) wrap(q.done(this) ? 'Completata! ' + q.hint : q.hint, 232, 10).slice(0, 3).forEach((l, i) => txt(l, 14, 140 + i * 10, { size: 10, color: '#e8dcc8', maxW: 232 }));
    txt('Frecce su/giù: scegli una missione · Invio: riprendi', 128, 173, { size: 10, align: 'center', color: '#a898c8' });
    txt('Le missioni compaiono qui man mano che le scopri.', 128, 182, { size: 9, align: 'center', color: '#9888b8' });
  };
})();
