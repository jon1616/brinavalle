'use strict';
/* =====================================================================
 *  PARTITA ONESTA (Ciclo 7) — si carica con ?test
 *    T7.run({ diff: 1, n: 3 })   il bot del percorso critico SENZA vita infinita:
 *        combatte davvero ogni stanza "sconfiggi tutti", il Golem e il Re dei Rovi,
 *        si difende mentre cammina; se viene sconfitto fa "Riprova" (cuori pieni,
 *        una caduta in più) come un giocatore. Riporta cadute, tempo e cuori.
 *    T7.table(n)                 le tre difficoltà
 *    T7.suite()                  test dell'Albo d'oro (medaglie e record)
 * ===================================================================== */
const T7 = {
  run(o) {
    o = Object.assign({ diff: 1, n: 1 }, o);
    const keepDiff = Opts.diff, out = [];
    try {
      for (let i = 0; i < o.n; i++) {
        Opts.diff = o.diff; R.god = false;
        const r = R.run();
        out.push({ ok: r.ok, cadute: R.revives, minuti: (R.frames / 3600).toFixed(1), cuoriMax: Game.s.maxHp / 2, errore: r.errore || '', log: r.log });
      }
    } finally { R.god = true; Opts.diff = keepDiff; Game.state = 'title'; }
    return out;
  },
  table(n) {
    const rows = [];
    for (const diff of [0, 1, 2]) {
      const r = T7.run({ diff, n: n || 3 });
      rows.push({
        difficolta: DIFF_NAMES[diff], completate: r.filter(x => x.ok).length + '/' + r.length,
        caduteMedie: (r.reduce((a, x) => a + x.cadute, 0) / r.length).toFixed(1),
        caduteMin: Math.min(...r.map(x => x.cadute)), caduteMax: Math.max(...r.map(x => x.cadute)),
        minutiDiGioco: (r.reduce((a, x) => a + +x.minuti, 0) / r.length).toFixed(1),
        errori: r.filter(x => !x.ok).map(x => x.errore).join(' | '),
      });
    }
    console.table(rows);
    return rows;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    const reset = () => { Medals.data = { got: {}, wins: 0, best: null }; Game.medalQueue = []; Game.medalToast = null; };
    check("Albo d'oro: in modalità test non scrive nel localStorage", () => {
      const before = localStorage.getItem(MEDALS_KEY);
      reset(); T.fresh({}); T.tp('o:1,2', 7, 6); Game.s.items.sword = true; T.run([], 40);
      return Medals.has('spada') && localStorage.getItem(MEDALS_KEY) === before ? true : 'scritto o non assegnato';
    });
    check('Medaglia ottenuta: notifica in gioco, una volta sola', () => {
      reset(); T.fresh({}); T.tp('o:1,2', 7, 6); Game.s.items.sword = true; T.run([], 40);
      if (!Game.medalToast || Game.medalToast.m.id !== 'spada') return 'nessuna notifica';
      T.run([], 260); Game.s.items.sword = true; T.run([], 60);
      return !Game.medalToast && Game.medalQueue.length === 0 ? true : 'notifica ripetuta';
    });
    check('Turbine: 3 nemici con un fendente rotante', () => {
      reset(); T.fresh({ sword: true }); T.tp('d:1,2', 7, 5); T.noEnemies();
      for (const [dx, dy] of [[-18, 0], [18, 0], [0, 16]]) { const s = new Slime(Game.player.x + dx, Game.player.y + dy); s.hp = 1; s.timer = 999; Game.entities.push(s); }
      Game.player.dir = 1;   // il primo fendente va verso l'alto, dove non c'è nessuno
      Input.pressed.add('action'); T.run(['action'], 1); T.run(['action'], ATK + CHARGE_T + 4); T.run([], 40);
      return Medals.has('turbine') ? true : 'combo ' + Game.spinCombo;
    });
    check('Vittoria: record (vittorie, miglior tempo) e medaglie di fine gioco', () => {
      reset(); T.fresh({ sword: true }); Game.s.time = 30 * 60; Game.s.deaths = 0; Game.s.minDiff = 2;
      const d = Opts.diff; Opts.diff = 2;
      try { Game.finishEnding(); T.run([], 40); } finally { Opts.diff = d; }
      const ok = Medals.data.wins === 1 && Medals.data.best === 1800 && ['alba', 'veloce', 'intatto', 'eroe'].every(id => Medals.has(id));
      return ok ? true : JSON.stringify(Medals.data);
    });
    check('Eroe non assegnata se si è giocato anche a Normale', () => {
      reset(); T.fresh({ sword: true }); Game.s.minDiff = 1; Game.s.time = 99 * 60; Game.s.deaths = 3;
      Game.finishEnding(); T.run([], 40);
      return Medals.has('alba') && !Medals.has('eroe') && !Medals.has('veloce') && !Medals.has('intatto') ? true : JSON.stringify(Object.keys(Medals.data.got));
    });
    check("Titolo: voce Albo d'oro, apertura e ritorno", () => {
      Game.state = 'title'; const it = Game.titleItems(); Game.menuIdx = it.indexOf("Albo d'oro");
      if (Game.menuIdx < 0) return 'voce assente';
      Input.pressed.add('action'); Game.update(); Input.endFrame(); if (Game.state !== 'medals') return Game.state;
      Game.render(); Input.pressed.add('down'); Game.update(); Input.endFrame(); Game.render();
      Input.pressed.add('start'); Game.update(); Input.endFrame();
      return Game.state === 'title' ? true : Game.state;
    });
    reset();
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T7 = T7;
