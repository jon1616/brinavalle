'use strict';
/* =====================================================================
 *  CICLO 11 — test: schermo a due livelli, Crepaccio Gelato, Tunica di Brina.
 *  T11.suite()   (si carica con ?test)
 * ===================================================================== */
const T11 = {
  /* tutte le posizioni raggiungibili scivolando, dalla cella data */
  reach(start) {
    const k = c => c[0] + ',' + c[1], seen = new Map([[k(start), start]]), q = [start];
    while (q.length) {
      const c = q.shift();
      for (let d = 0; d < 4; d++) { const n = R.slideSim(c[0], c[1], d); if (!seen.has(k(n))) { seen.set(k(n), n); q.push(n); } }
    }
    return [...seen.values()];
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Schermo a due livelli: la pixel art è visibile e il render costa poco', () => {
      if (!window.DISPLAY_LAYERED || buf.parentNode.id !== 'stage') return 'livelli assenti';
      T.fresh({ sword: true }); T.tp('c:2,1', 4, 5);
      for (let i = 0; i < 10; i++) Game.render();
      const r = T10.ms(() => Game.render(), 30);
      return r.med < 4 ? true : 'render ' + r.med.toFixed(1) + ' ms';
    });
    check('Crepaccio: soluzione minima di 5 scivolate fino al gradino (7,4)', () => {
      T.fresh({ sword: true, hookshot: true }); Game.s.flags.chasmHint = true; T.tp('c:2,0', 1, 5); T.noEnemies();
      const mv = R.solveIce([[7, 4]]);
      return mv && mv.length === 5 ? true : 'mosse: ' + (mv ? mv.map(d => DIRS[d].name) : 'nessuna');
    });
    check('Crepaccio: da ogni posizione sul ghiaccio si può tornare all\'ingresso (niente blocchi)', () => {
      T.fresh({}); T.tp('c:2,0', 1, 5); T.noEnemies();
      const all = T11.reach([1, 5]);
      for (const c of all) { const back = T11.reach(c); if (!back.some(b => b[0] === 1 && b[1] === 5)) return 'bloccato in ' + c; }
      return all.length > 10 ? true : 'poche posizioni: ' + all.length;
    });
    check('Golem sconfitto: si apre il varco a est e resta aperto', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { golemIntro: true, caveEntered: true });
      T.tp('c:1,0', 7, 8); T.skip();
      if (Game.tiles[5][15] !== 'J') return 'varco già aperto';
      const gol = Game.boss; gol.state = 'walk'; gol.stagger(Game); gol.hp = 1; gol.inv = 0; gol.hurt(Game, 1);
      for (let i = 0; i < 300 && !Game.s.flags.golem; i++) T.run([], 1);
      if (Game.tiles[5][15] === 'J') return 'varco chiuso dopo il golem';
      T.tp('c:1,0', 7, 8);
      return Game.tiles[5][15] !== 'J' ? true : 'richiuso al rientro';
    });
    check('Percorso vero: varco -> 5 scivolate -> arpione -> Tunica -> uscita a sud nella Sala delle Lame', () => {
      T.fresh({ sword: true, hookshot: true }); Object.assign(Game.s.flags, { golem: true, golemIntro: true, chasmHint: true });
      T.tp('c:1,0', 14, 5); T.noEnemies();
      R.god = true;
      R.pushThrough('right', 'c:2,0'); T.noEnemies();
      R.walkTo(1, 5);
      R.doSlides(R.solveIce([[7, 4]]));
      if (R.cell().join(',') !== '7,4') return 'gradino mancato: ' + R.cell();
      Game.s.equip = 'hookshot'; Game.player.dir = 3; R.tap('item', 40);
      if (R.cell().join(',') !== '11,4') return 'arpione: ' + R.cell();
      R.openChestAt(13, 2); T.skip();
      if (!Game.s.items.tunic) return 'niente tunica';
      if (Game.tiles[10][12] === 'J') return 'uscita sud chiusa';
      R.exit('S', 'c:2,1');
      return Game.roomId === 'c:2,1' && Game.tiles[0][12] !== 'J' ? true : Game.roomId;
    });
    check('Tunica: i colpi da 1 cuore ne tolgono mezzo (Normale ed Eroe)', () => {
      T.fresh({}); const d = Opts.diff;
      try {
        Opts.diff = 1; const a = diffDamage(2), a1 = diffDamage(1);
        Game.s.items.tunic = true; const b = diffDamage(2), b1 = diffDamage(1);
        Opts.diff = 2; const c = diffDamage(2);
        return a === 2 && a1 === 1 && b === 1 && b1 === 1 && c === 2 ? true : [a, a1, b, b1, c].join(',');
      } finally { Opts.diff = d; }
    });
    check("Tunica: l'eroe cambia colori, e lo sprite di base torna com'era", () => {
      T.fresh({ sword: true }); T.tp('o:1,2', 7, 6); Game.s.items.tunic = true;
      let used = null; const orig = bctx.drawImage;
      bctx.drawImage = function (img, ...r) { if (SPR.people.heroFrost.down.includes(img)) used = true; return orig.call(this, img, ...r); };
      try { Game.render(); } finally { bctx.drawImage = orig; }
      return used && SPR.hero === SPR.people.hero ? true : 'used=' + used;
    });
    check("Medaglia 'Veste di ghiaccio' e voce nell'inventario", () => {
      Medals.data = { got: {}, wins: 0, best: null };
      T.fresh({}); T.tp('o:1,2', 7, 6); Game.s.items.tunic = true; T.run([], 40);
      return Medals.has('tunica') && INVENTORY.some(i => i[0] === 'tunic') ? true : 'medaglia o inventario mancanti';
    });
    Medals.data = md; R.god = true;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T11 = T11;
