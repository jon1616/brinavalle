'use strict';
/* =====================================================================
 *  BESTIARY — Ciclo 20 (Agente B): il BESTIARIO, terza pagina della pausa
 *  (Q: mappa → diario → bestiario → mappa).
 *  Ogni creatura della valle ha una scheda con il suo sprite vero, quante
 *  volte l'hai sconfitta e una nota che la lega alla storia. Il PUNTO
 *  DEBOLE si sblocca sconfiggendola (3 volte le creature comuni, al primo
 *  incontro i guardiani: è lì che serve un aiuto).
 *  Stato nel salvataggio: g.s.bestiary = { chiave: { s: visto, n: sconfitte } }.
 * ===================================================================== */
const BESTIARY = [
  { k: 'slime', name: 'Slime verde', spr: () => SPR.slime,
    lore: 'Gelatine dei prati di Brinavalle. Da quando è calato il crepuscolo sono diventate irrequiete.',
    weak: 'Due colpi di spada. Saltellano a caso: aspetta che si fermino.' },
  { k: 'slimeBlue', name: 'Slime blu', spr: () => SPR.slimeBlue,
    lore: 'Cugini più svegli dei verdi: nelle Rovine hanno imparato a inseguire chi passa.',
    weak: 'Tre colpi. Il contraccolpo li ferma: colpisci, arretra, colpisci.' },
  { k: 'bat', name: 'Pipistrello', spr: () => SPR.bat[0],
    lore: 'Abitano i soffitti delle Rovine. Volano a scatti, poi si posano a riposare.',
    weak: 'Basta un colpo. Quando si posano sono fermi: è il momento.' },
  { k: 'plant', name: 'Pianta sputasemi', spr: () => SPR.plant[0],
    lore: 'Fiori del Bosco dei Rovi, avvelenati dalle spine del Re. Sputano semi duri come sassi.',
    weak: 'Il fendente dissolve i semi in volo. Avvicinati di lato, mai in linea.' },
  { k: 'skeleton', name: 'Armatura vivente', spr: () => SPR.people.skeleton.down[0],
    lore: 'Armature dei custodi del tempio, rianimate dal crepuscolo. Lente, ma colpiscono forte.',
    weak: 'Il colpo rotante le prende anche in due. Dopo un colpo arretrano: insisti.' },
  { k: 'slimeIce', name: 'Slime di ghiaccio', spr: () => SPR.slimeIce,
    lore: 'Vivono nella Grotta di Brina: il gelo li ha resi robusti e testardi.',
    weak: 'Tre colpi, oppure una bomba per un gruppo intero.' },
  { k: 'batIce', name: 'Pipistrello gelido', spr: () => SPR.batIce[0],
    lore: 'Più veloci dei cugini delle Rovine: si nutrono di brina e non stanno mai fermi.',
    weak: "Due colpi. L'arpione li stordisce anche in volo." },
  { k: 'blade', name: 'Lama di ghiaccio', spr: () => SPR.blade[0], seenIsEnough: true,
    lore: "Trappole dei vecchi minatori, rimaste a guardia della grotta. Nessuno le ha mai fermate.",
    weak: 'Non si distruggono: scattano solo quando sei sulla loro riga o colonna. Passa di lato.' },
  { k: 'jelly', name: 'Medusa', spr: () => portrait('jelly'),
    lore: 'Nate nelle vasche del Santuario Sommerso, brillano di una luce tutta loro.',
    weak: 'Scattano a impulsi verso di te: colpiscile tra uno scatto e l’altro.' },
  { k: 'golem', name: 'Golem di Brina', boss: true, spr: () => SPR.golem[0],
    lore: 'Il guardiano della miniera, scolpito nel ghiaccio eterno dai primi minatori della valle.',
    weak: 'La spada rimbalza: rimandagli i suoi massi di ghiaccio. Da furioso li rimanda anche lui.' },
  { k: 'serpent', name: 'Serpe di Vetro', boss: true, spr: () => SPR.serpent[0],
    lore: "Custode del Santuario Sommerso, trasparente come l'acqua del lago.",
    weak: "Quando riemerge, agganciala con l'arpione: a riva è vulnerabile, per tre colpi." },
  { k: 'king', name: 'Re dei Rovi', boss: true, spr: () => SPR.boss[0],
    lore: "Era Ortensio, il giardiniere del tempio. L'invidia per la luce lo ha coperto di spine.",
    weak: /* Ciclo 57: accorciato, nel Bestiario entrava tagliato */ "Stordito dopo la carica è vulnerabile. Poi l'arpione gli strappa la corazza." },
];

/* chiave del bestiario di un'entità nemica (null = non catalogata) */
function bestKey(e) {
  if (typeof ThornKing !== 'undefined' && e instanceof ThornKing) return 'king';
  if (typeof Golem !== 'undefined' && e instanceof Golem) return 'golem';
  if (typeof Serpent !== 'undefined' && e instanceof Serpent) return 'serpent';
  if (typeof Jelly !== 'undefined' && e instanceof Jelly) return 'jelly';
  if (e instanceof BladeTrap) return 'blade';
  if (e instanceof Slime) return e.ice ? 'slimeIce' : e.blue ? 'slimeBlue' : 'slime';
  if (e instanceof Bat) return e.ice ? 'batIce' : 'bat';
  if (e instanceof Plant) return 'plant';
  if (e instanceof Skeleton) return 'skeleton';
  return null;
}
/* ritratto disegnato dall'entità vera (per le creature senza uno sprite unico, come la medusa) */
const _portraits = {};
function portrait(k) {
  if (_portraits[k]) return _portraits[k];
  const c = makeCanvas(16, 16), x = c.getContext('2d');
  try { const e = new Jelly(0, 0); e.t = 0; e.draw(x, Game); } catch (err) { x.fillStyle = '#80c0e8'; x.fillRect(4, 4, 8, 8); }
  return (_portraits[k] = c);
}
const BEST_VIS = 12;
function bestTop(g) {   // Ciclo 31: prima riga visibile della lista, che segue la selezione
  let top = g.bestTop || 0;
  if (g.bestIdx < top) top = g.bestIdx;
  if (g.bestIdx >= top + BEST_VIS) top = g.bestIdx - BEST_VIS + 1;
  return (g.bestTop = Math.max(0, Math.min(top, Math.max(0, BESTIARY.length - BEST_VIS))));
}
function bestEntry(g, k) { const b = g.s.bestiary || {}; return b[k] || { s: 0, n: 0 }; }
function bestDone(g, B) { const e = bestEntry(g, B.k); return B.seenIsEnough ? !!e.s : e.n > 0; }
function bestWeak(g, B) { const e = bestEntry(g, B.k); return B.seenIsEnough || B.boss ? !!e.s : e.n >= 3; }
function bestMark(g, e, defeated) {
  const k = bestKey(e);
  if (!k || !g.s) return;
  const b = g.s.bestiary || (g.s.bestiary = {}), r = b[k] || (b[k] = { s: 0, n: 0 });
  r.s = 1;
  if (defeated) r.n++;
}

(function installBestiary() {
  const G = Game;
  G.bestIdx = 0;

  /* visti: ogni 20 frame di gioco si annotano i nemici presenti nella stanza */
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    const r = updatePlay.apply(this, arguments);
    if (this.state === 'play' && this.t % 20 === 0) for (const e of this.entities) if (e.enemy && !e.dead) bestMark(this, e, false);
    return r;
  };
  /* sconfitti: creature comuni (die) e guardiani (onBossDefeated) */
  const die = Enemy.prototype.die;
  Enemy.prototype.die = function (g) { bestMark(g || Game, this, true); return die.apply(this, arguments); };
  const onBossDefeated = G.onBossDefeated;
  G.onBossDefeated = function (boss) { bestMark(this, boss, true); return onBossDefeated.apply(this, arguments); };

  /* pagina 3 della pausa: Q passa mappa → diario → bestiario → mappa */
  const update = G.update;
  G.update = function () {
    if (this.state === 'pause' && !this.rush) {
      if (Input.hit('swap') && this.pausePage === 1) { this.pausePage = 2; Sound.sfx('select'); return; }
      if (Input.hit('swap') && this.pausePage === 2) { this.pausePage = 0; Sound.sfx('select'); return; }
      if (this.pausePage === 2) {
        const n = BESTIARY.length;
        if (Input.hit('down')) { this.bestIdx = (this.bestIdx + 1) % n; Sound.sfx('select'); return; }
        if (Input.hit('up')) { this.bestIdx = (this.bestIdx + n - 1) % n; Sound.sfx('select'); return; }
        if (Input.hit('left') || Input.hit('right')) return;   // sul bestiario le frecce non cambiano l'oggetto
      }
    }
    return update.apply(this, arguments);
  };

  const drawPause = G.drawPause;
  G.drawPause = function (c) {
    if (this.pausePage !== 2 || this.rush) return drawPause.apply(this, arguments);
    c.fillStyle = 'rgba(10,6,20,0.92)'; c.fillRect(0, 0, GW, GH);
    const box = (x, y, w, h) => { c.fillStyle = '#e8d8b0'; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = '#1c1430'; c.fillRect(x, y, w, h); };
    box(8, 22, 100, 144); box(114, 22, 134, 144);
    const top = bestTop(this);   // Ciclo 31 (Agente A): con più di 12 creature la lista scorre
    c.fillStyle = 'rgba(255,216,112,0.16)'; c.fillRect(10, 25 + (this.bestIdx - top) * 11.5, 96, 11);
    // ritratto: lo sprite vero, ingrandito ×2 se è piccolo; sagoma se non l'hai ancora sconfitto
    const B = BESTIARY[this.bestIdx], e = bestEntry(this, B.k);
    if (e.s) {
      const img = B.spr(), big = img.width > 20, s = big ? 1 : 2, w = img.width * s, h = img.height * s;
      const x = 181 - w / 2, y = 30 + (34 - h) / 2;
      c.fillStyle = 'rgba(255,240,200,0.06)'; c.beginPath(); c.arc(181, 47, 19, 0, Math.PI * 2); c.fill();
      c.drawImage(bestDone(this, B) ? img : silhouetteOf(img, '#4a3a6a'), Math.round(x), Math.round(y), w, h);
    }
  };
  const drawPauseText = G.drawPauseText;
  G.drawPauseText = function () {
    if (this.pausePage !== 2 || this.rush) return drawPauseText.apply(this, arguments);
    const done = BESTIARY.filter(B => bestDone(this, B)).length;
    txt('BESTIARIO', 128, 5, { align: 'center', size: 9, font: TITLE_FONT, color: '#ffd870' });
    txt((isTouch() ? '⇄' : 'Q') + ': mappa', 248, 5, { size: 10, align: 'right', color: '#a898c0' });
    txt(done + '/' + BESTIARY.length, 8, 6, { size: 10, color: '#c8bcd8' });
    const top = bestTop(this);
    if (top > 0) txt('▲', 104, 23, { size: 8, align: 'right', color: '#a898c0' });
    if (top + BEST_VIS < BESTIARY.length) txt('▼', 104, 159, { size: 8, align: 'right', color: '#a898c0' });
    BESTIARY.forEach((B, i) => {
      if (i < top || i >= top + BEST_VIS) return;
      const e = bestEntry(this, B.k), d = bestDone(this, B), sel = i === this.bestIdx;
      const label = d ? B.name : e.s ? B.name : '? ? ?';
      txt((d ? '✓ ' : e.s ? '· ' : '  ') + label, 12, 25 + (i - top) * 11.5, { size: 10, color: d ? (sel ? '#ffffff' : '#c8ffd0') : e.s ? (sel ? '#ffffff' : '#c8bcd8') : (sel ? '#c8bcd8' : '#8070a0'), maxW: 92 });
    });
    const B = BESTIARY[this.bestIdx], e = bestEntry(this, B.k);
    if (!e.s) {
      txt('Non l’hai ancora incontrato.', 181, 60, { size: 10, align: 'center', color: '#b0a0d0', maxW: 128 });
    } else {
      txt(B.name + (B.boss ? ' · guardiano' : ''), 181, 65, { size: 11, align: 'center', color: '#ffd870', maxW: 128 });
      txt(B.seenIsEnough ? 'Non si può sconfiggere' : 'Sconfitto: ' + e.n + (e.n === 1 ? ' volta' : ' volte'), 181, 75, { size: 9, align: 'center', color: '#c8bcd8', maxW: 128 });
      const lore = bestDone(this, B) ? B.lore : 'Sconfiggilo per saperne di più.';
      wrap(lore, 124, 10).slice(0, 4).forEach((l, i) => txt(l, 119, 86 + i * 9, { size: 10, color: '#f4ecdc', maxW: 126 }));
      txt('PUNTO DEBOLE', 119, 124, { size: 10, color: '#ffb0a0' });
      const weak = bestWeak(this, B) ? B.weak : (B.boss ? '' : 'Sconfiggilo 3 volte per scoprirlo.');
      wrap(weak, 124, 10).slice(0, 3).forEach((l, i) => txt(l, 119, 133 + i * 9, { size: 10, color: bestWeak(this, B) ? '#ffe0c8' : '#b0a0d0', maxW: 126 }));
    }
    txt('Frecce su/giù: scegli una creatura · Invio: riprendi', 128, 173, { size: 10, align: 'center', color: '#a898c8' });
  };

  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'bestiario', name: 'Naturalista', desc: 'Completa tutte le schede del Bestiario.', icon: 'gem5', tier: 1,
    got: g => BESTIARY.every(B => bestDone(g, B)) });
})();
