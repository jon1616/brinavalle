'use strict';
/* =====================================================================
 *  TEST DEL CICLO 12 (Agente B) — accoglienza e sicurezza.
 *  Si carica con index.html?test. Da console:  T12.suite()
 *  Conferma della nuova partita, "Salva ed esci", guida "Comandi e consigli".
 * ===================================================================== */
const T12 = {
  /* seleziona una voce del titolo e premi Azione */
  pickTitle(label) {
    Game.state = 'title'; Game.newConfirm = null;
    Game.menuIdx = Game.titleItems().indexOf(label);
    if (Game.menuIdx < 0) throw new Error('voce assente: ' + label);
    T.press('action', 1);
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    const makeSave = () => { T.fresh({ sword: true }); Game.s.time = 1234; Game.s.flags['chest:c_lake'] = true; T.tp('o:0,2', 7, 9); Game.saveGame(); return localStorage.getItem(SAVE_KEY); };

    check('Nuova partita con un salvataggio: chiede conferma, "No" è il default e non tocca nulla', () => {
      const sv = makeSave(); T12.pickTitle('Nuova partita');
      if (!Game.newConfirm || Game.state !== 'title') return 'nessuna conferma (stato ' + Game.state + ')';
      if (Game.newConfirm.idx !== 1) return 'il default non è "No"';
      T.press('action', 5);
      return Game.state === 'title' && !Game.newConfirm && localStorage.getItem(SAVE_KEY) === sv ? true : 'salvataggio cambiato o stato ' + Game.state;
    });
    check('Conferma: "Sì" avvia il prologo', () => {
      makeSave(); T12.pickTitle('Nuova partita');
      T.press('left', 1); T.press('action', 1);
      return Game.state === 'prologue' ? true : 'stato ' + Game.state;
    });
    check('Conferma: Invio annulla', () => {
      makeSave(); T12.pickTitle('Nuova partita'); T.press('start', 1);
      return Game.state === 'title' && !Game.newConfirm ? true : 'stato ' + Game.state;
    });
    check('Nuova partita senza salvataggio: niente conferma, subito il prologo', () => {
      localStorage.removeItem(SAVE_KEY); T12.pickTitle('Nuova partita');
      return Game.state === 'prologue' ? true : 'stato ' + Game.state;
    });
    check('Opzioni dalla pausa: "Salva ed esci" salva la stanza attuale e torna al titolo', () => {
      T.fresh({ sword: true }); T.tp('o:2,2', 7, 6); Game.state = 'pause';
      T.press('item', 1);
      if (Game.state !== 'options') return 'opzioni non aperte';
      const rows = Game.optRows(); Game.optIdx = rows.indexOf('quit');
      if (Game.optIdx < 0) return 'riga assente: ' + rows.join(',');
      T.press('action', 1);
      const sv = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      return Game.state === 'title' && sv.room === 'o:2,2' ? true : 'stato ' + Game.state + ' stanza salvata ' + sv.room;
    });
    check('"Salva ed esci" non c\'è dal titolo né durante la Sfida dei Guardiani', () => {
      Game.optFrom = 'title'; const a = Game.optRows().includes('quit');
      Game.optFrom = 'pause'; const keep = Game.rush; Game.rush = { round: 0 }; const b = Game.optRows().includes('quit'); Game.rush = keep;
      return !a && !b ? true : 'titolo ' + a + ' sfida ' + b;
    });
    check('Guida: si apre dalle Opzioni, cambia pagina e torna indietro', () => {
      Game.state = 'title'; Game.openOptions('title'); Game.optIdx = Game.optRows().indexOf('guide');
      T.press('action', 1); if (Game.state !== 'guide') return 'guida non aperta';
      T.press('right', 1); if (Game.guidePage !== 1) return 'pagina non cambiata';
      Game.render(); T.press('action', 1);
      return Game.state === 'options' ? true : 'stato ' + Game.state;
    });
    check('Guida: i consigli restano dentro il riquadro (tastiera e touch)', () => {
      T.fresh({}); T.tp('o:1,2', 7, 6); Game.state = 'guide'; Game.optFrom = 'pause'; Game.guidePage = 1;
      Game.render(); const a = Game.guideBottom;
      document.body.classList.add('touchmode'); Game.render(); const b = Game.guideBottom; document.body.classList.remove('touchmode'); resize();
      return a <= 166 && b <= 166 ? true : 'fondo ' + a + ' / ' + b;
    });
    check('Guida dal titolo senza partita caricata: nessun errore', () => {
      const r = Game.room; Game.room = null; Game.state = 'guide'; Game.optFrom = 'title'; Game.guidePage = 0;
      try { Game.render(); } finally { Game.room = r; }
      return true;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.newConfirm = null; Game.dialog = null;
    console.table(res);
    return res;
  },
};
window.T12 = T12;
