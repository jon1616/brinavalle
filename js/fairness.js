'use strict';
/* =====================================================================
 *  FAIRNESS — Ciclo 15 (Agente A): ingressi giusti.
 *  Un controllo automatico (tests/fair15.js -> T15.entries()) misura, per
 *  ogni stanza, la distanza tra ogni punto d'ingresso (bordi aperti, porte,
 *  scale) e ogni nemico. Ne ha trovati 8 sotto i 48 px: entravi e uno slime
 *  ti era già addosso, o una pianta ti sparava subito.
 *  1) Dati: quei nemici sono spostati ad almeno ~56 px dagli ingressi.
 *  2) Regola: appena entri in una stanza, i nemici comuni restano fermi e
 *     innocui per ENTRY_GRACE frame (si "svegliano"): vale anche per le
 *     stanze che qualcuno aggiungerà in futuro. Boss e lame non cambiano.
 * ===================================================================== */
const ENTRY_GRACE = 40;   // ~2/3 di secondo

(function moveEnemies() {
  const moves = [
    ['d:1,1', 7, 8, 7, 6],     // slime blu a 2 tile dalla porta dell'Atrio
    ['o:2,2', 10, 3, 5, 3],    // slime a 36 px dall'uscita della Grotta
    ['o:2,2', 12, 6, 10, 8],   // slime a 32 px dall'uscita della Grotta
    ['o:2,1', 2, 7, 3, 8],     // pianta a 36 px dall'ingresso ovest del Bosco
    ['o:1,0', 2, 8, 3, 9],     // slime a 45 px dall'ingresso ovest delle Rovine
    ['o:1,0', 13, 8, 12, 9],   // slime a 45 px dall'ingresso est delle Rovine
  ];
  for (const [id, x, y, nx, ny] of moves) {
    const e = (ROOMS[id].enemies || []).find(q => q.x === x && q.y === y);
    if (e) { e.x = nx; e.y = ny; }
  }
})();

(function installGrace() {
  const G = Game;
  /* salvataggio che punta a una stanza che non esiste più (rinominata in un ciclo futuro?): riparti dal villaggio */
  const startFrom = G.startFrom;
  G.startFrom = function (sv, fullHp) {
    if (sv && !ROOMS[sv.room]) {
      sv = Object.assign({}, sv, sv.flags && sv.flags.intro ? { room: 'o:1,2', x: 7 * TS, y: 6 * TS - 6 } : { room: START.room, x: START.x * TS, y: START.y * TS - 6 });
    }
    return startFrom.call(this, sv, fullHp);
  };
  G.entryGrace = 0;
  const afterEnter = G.afterEnter;
  G.afterEnter = function () { this.entryGrace = ENTRY_GRACE; return afterEnter.call(this); };
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    if (this.entryGrace > 0 && this.state === 'play' && !this.dialog && !this.hitStop) this.entryGrace--;
    return updatePlay.call(this);
  };
  // i nemici comuni (non i boss: hanno già la loro entrata in scena)
  for (const cls of [Slime, Bat, Plant, Skeleton]) {
    const upd = cls.prototype.update;
    cls.prototype.update = function (g) {
      if (g.entryGrace > 0 && !g.rush) { this.t++; return; }
      return upd.call(this, g);
    };
  }
})();
