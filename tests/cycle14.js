'use strict';
/* =====================================================================
 *  TEST DEL CICLO 14 (Agente B) — "Nella puntata precedente" e guida col Diario.
 *  Si carica con index.html?test. Da console:  T14.suite()
 *  (l'analisi armonica delle musiche è in tests/audit.js: A.harmony(), dentro await A.suite())
 * ===================================================================== */
const T14 = {
  /* salva una partita "di qualche minuto fa" e preme Continua; ritorna le voci del dialogo mostrato */
  continueAfter(msAgo, flags) {
    T.fresh({ sword: true }); Object.assign(Game.s.flags, flags || { intro: true }); T.tp('o:1,1', 7, 6); Game.saveGame();
    const sv = JSON.parse(localStorage.getItem(SAVE_KEY)); sv.savedAt = Date.now() - msAgo; localStorage.setItem(SAVE_KEY, JSON.stringify(sv));
    Game.state = 'title'; Game.newConfirm = null; Game.menuIdx = Game.titleItems().indexOf('Continua');
    T.press('action', 1);
    for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
    const seen = [];
    for (let n = 0; n < 80 && Game.dialog; n++) {
      const d = Game.dialog, t = (d.speaker ? d.speaker + ': ' : '') + d.pages.map(p => p.join(' ')).join(' ');
      if (seen[seen.length - 1] !== t) seen.push(t);
      Input.pressed.add('action'); Game.update(); Input.endFrame(); T.run([], 3);
    }
    return seen;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Il salvataggio registra quando è stato fatto', () => {
      T.fresh({}); T.tp('o:1,2', 7, 6); Game.saveGame();
      const sv = JSON.parse(localStorage.getItem(SAVE_KEY)); return Math.abs(Date.now() - sv.savedAt) < 5000 ? true : 'savedAt ' + sv.savedAt;
    });
    check('Continua dopo 10 minuti: riepilogo con capitoli e obiettivo', () => {
      const s = T14.continueAfter(10 * 60 * 1000);
      return s.some(l => /puntata precedente/.test(l)) && s.some(l => /Diario: /.test(l) && /Crollo|rovi|Rovine|Spada|bombe/i.test(l)) ? true : JSON.stringify(s);
    });
    check('Continua dopo 1 minuto: nessun riepilogo (chi ricarica la pagina non viene disturbato)', () => {
      const s = T14.continueAfter(60 * 1000);
      return s.some(l => /puntata precedente/.test(l)) ? JSON.stringify(s) : true;
    });
    check('Salvataggi vecchi senza data: il riepilogo c\'è (prima volta col Ciclo 14)', () => {
      T.fresh({ sword: true }); Game.s.flags.intro = true; T.tp('o:1,1', 7, 6); Game.saveGame();
      const sv = JSON.parse(localStorage.getItem(SAVE_KEY)); delete sv.savedAt;
      return recapLines(Game, sv).length >= 2 ? true : 'nessuna voce';
    });
    check('Partita appena iniziata (intro non vista): nessun riepilogo', () => recapLines(Game, { flags: {}, savedAt: 0 }).length === 0 ? true : 'riepilogo mostrato');
    check('Riepilogo: segnala le missioni secondarie in sospeso', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { intro: true }); Game.visited.add('o:0,2');
      const l = recapLines(Game, { flags: { intro: true }, savedAt: 0 });
      return l.some(x => /in sospeso: \d/.test(x)) ? true : JSON.stringify(l);
    });
    check('Guida: la riga del Diario c\'è e i comandi restano nel riquadro', () => {
      T.fresh({}); T.tp('o:1,2', 7, 6); Game.state = 'guide'; Game.optFrom = 'pause'; Game.guidePage = 0;
      const seen = []; const orig = window.txt;
      window.txt = function (str, gx, gy) { seen.push([String(str), gy]); return orig.apply(this, arguments); };
      try { Game.render(); } finally { window.txt = orig; }
      const diary = seen.find(x => /Diario/.test(x[0])), maxY = Math.max(...seen.filter(x => x[1] < 168).map(x => x[1]));
      return diary && maxY <= 156 ? true : 'diario ' + !!diary + ' ultima riga y=' + maxY;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pendingRecap = null;
    console.table(res);
    return res;
  },
};
window.T14 = T14;
