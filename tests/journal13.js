'use strict';
/* =====================================================================
 *  CICLO 13 — test del Diario dell'avventura.   T13.suite()  (con ?test)
 * ===================================================================== */
const T13 = {
  pause() { Input.pressed.add('start'); Game.update(); Input.endFrame(); },
  key(k) { Input.pressed.add(k); Game.update(); Input.endFrame(); },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    // Ciclo 20 (Agente B): dopo il diario c'è il Bestiario, quindi Q fa mappa → diario → bestiario → mappa
    check('Q in pausa apre il diario, poi il bestiario, poi torna alla mappa; uscendo dalla pausa si riparte dalla mappa', () => {
      T.fresh({ sword: true }); T.tp('o:1,2', 7, 6); T13.pause();
      T13.key('swap'); if (Game.pausePage !== 1) return 'diario non aperto';
      Game.render(); T13.key('swap'); if (Game.pausePage !== 2) return 'bestiario non aperto';
      Game.render(); T13.key('swap'); if (Game.pausePage !== 0) return 'non tornato alla mappa';
      T13.key('swap'); T13.key('start'); if (Game.state !== 'play') return 'pausa non chiusa';
      T13.pause(); return Game.pausePage === 0 ? true : 'pagina rimasta sul diario';
    });
    check("Sul diario le frecce scelgono la missione e NON cambiano l'oggetto", () => {
      T.fresh({ sword: true, bombs: true, hookshot: true }); Game.s.equip = 'bombs'; Game.s.flags.hookReturned = true; Game.visited.add('o:0,2');
      T.tp('o:1,2', 7, 6); T13.pause(); T13.key('swap');
      T13.key('down'); T13.key('right'); T13.key('left');
      if (Game.equipped() !== 'bombs') return 'oggetto cambiato sul diario';
      if (Game.questIdx !== 1) return 'selezione ' + Game.questIdx;
      T13.key('swap'); T13.key('swap'); T13.key('right');   // diario → bestiario → mappa
      return Game.equipped() === 'hookshot' ? true : 'sulla mappa le frecce non cambiano più oggetto';
    });
    check('Nella Sfida dei Guardiani Q in pausa abbandona ancora la sfida', () => {
      Medals.data = { got: {}, wins: 1, best: null };
      Game.startRush(); T.run([], 30); T13.pause(); Game.render(); T13.key('swap');
      const ok = Game.state === 'rushEnd' && Game.rush.abandoned;
      Game.rush = null; Game.state = 'title';
      return ok ? true : Game.state;
    });
    check('Capitoli: il primo non fatto è "in corso", dopo la vittoria sono tutti fatti', () => {
      T.fresh({}); Game.s.flags.intro = false;
      if (CHAPTERS.findIndex(c => !c.done(Game)) !== 0) return 'inizio sbagliato';
      Object.assign(Game.s.items, { sword: true, bombs: true, hookshot: true, bigkey: true });
      Object.assign(Game.s.flags, { intro: true, collapse: true, enteredDungeon: true, boss: true, victory: true });
      return CHAPTERS.every(c => c.done(Game)) ? true : 'capitolo non riconosciuto';
    });
    check('Missioni secondarie: compaiono solo quando le scopri', () => {
      T.fresh({}); Game.visited = new Set(['i:elder']);
      if (Game.knownQuests().length !== 0) return 'missioni visibili a inizio partita: ' + Game.knownQuests().map(q => q.name);
      Game.visited.add('o:0,2'); if (!Game.knownQuests().some(q => q.name === "L'Amo d'Oro")) return 'amo non scoperto';
      Game.s.flags.victory = true;
      const names = Game.knownQuests().map(q => q.name);
      return names.includes("I Semi dell'Alba") && names.includes('La Sfida dei Guardiani') ? true : names.join(',');
    });
    check('Avanzamento: semi e pesci contati, missione completata col ✓', () => {
      T.fresh({}); Game.s.flags.victory = true; Game.s.flags['seed:bosco'] = true; Game.s.flags.hookReturned = true;
      Game.s.fishLog = { alborella: 10, persico: 20 };
      const seeds = SIDE_QUESTS.find(q => q.name === "I Semi dell'Alba"), fish = SIDE_QUESTS.find(q => q.name === 'Il pescatore');
      if (seeds.prog(Game) !== '1/5' || fish.prog(Game) !== '2/5') return seeds.prog(Game) + ' ' + fish.prog(Game);
      Game.s.flags.garden = true; return seeds.done(Game) ? true : 'giardino non completato';
    });
    check('Il diario si disegna in tutte le fasi senza errori (inizio, metà, dopo il finale)', () => {
      const phases = [{}, { sword: true, bombs: true, hookshot: true }, { sword: true, bombs: true, hookshot: true, tunic: true }];
      for (const [i, it] of phases.entries()) {
        T.fresh(it); if (i === 2) Object.assign(Game.s.flags, { victory: true, golem: true, hookReturned: true });
        T.tp('o:1,2', 7, 6); T13.pause(); T13.key('swap');
        for (let k = 0; k < 10; k++) { T13.key('down'); Game.render(); }
        T13.key('start');
      }
      return true;
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.rush = null; Game.state = 'title'; Game.menuIdx = 0; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T13 = T13;
