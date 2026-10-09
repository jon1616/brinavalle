'use strict';
/* =====================================================================
 *  TEST DEL CICLO 54 (Agente B) — RIFINITURA: niente si perde, anche nei capitoli dell'Agente B.
 *  Il Ciclo 53 (Agente A) ha sistemato i cartelli dei Capitoli III-VII e i cuori dei boss.
 *  La stessa domanda sui miei capitoli ha trovato:
 *   1) un BLOCCO nel Capitolo II: il padre salva fatherRemembers alla prima battuta del suo ricordo,
 *      il cartello nasceva solo alla fine. Chiudendo a metà, al «Continua» niente cartello, ch2Done mai
 *      vero, obiettivo «Goditi la valle» e la saga ferma per sempre. Ora il cartello riappare (resume.js).
 *   2) i DONI PERSI: campane, Faro, Tempio, Radici, Aquilone, gara col padre... salvano a metà dialogo e
 *      le gemme arrivano qualche battuta dopo. Ora un salvataggio con un dialogo aperto dà subito i doni
 *      ancora in coda (una volta sola), e il loro testo compare comunque.
 *  «Chiudere il gioco» qui vuol dire: leggere il salvataggio così com'è, SENZA salvare di nuovo.
 *  T54.suite()  (con ?test)
 * ===================================================================== */
const T54 = {
  disk() { return JSON.parse(localStorage.getItem(SAVE_KEY)); },
  /* chiude il gioco (nessun salvataggio in più) e fa «Continua» come un giocatore */
  quitAndContinue() { Game.state = 'title'; Game.dialog = null; Game.startFrom(readSave(), true); for (let i = 0; i < 200 && Game.state !== 'play'; i++) { Game.update(); Input.endFrame(); } },
  /* dialogo di un personaggio giocato fino a quando il flag è salvato; poi «chiudi il gioco»: quante gemme ha il salvataggio in più? */
  cut(room, flags, talk, until) {
    T.fresh({ sword: true }); Object.assign(Game.s.flags, flags); T.tp(room, 7, 7); Game.dialog = null; Game.saveGame();
    const g0 = T54.disk().gems;
    Game.say(talk(Game));
    for (let i = 0; i < 40 && Game.dialog && !T54.disk().flags[until]; i++) Game.nextEntry();
    const saved = T54.disk(); if (!saved.flags[until]) return 'il flag ' + until + ' non è stato salvato';
    let gotText = false; for (let i = 0; i < 40 && Game.dialog; i++) { if (Game.itemGet === 'gems') gotText = true; Game.nextEntry(); }
    return { cut: saved.gems - g0, end: Game.s.gems - g0, gotText };
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check('Capitolo II: chi chiude il gioco durante il ricordo del padre, al «Continua» vede il cartello e la storia riparte (Teodoro)', () => {
      T.fresh({ sword: true });
      const st = T42.STEPS, i = st.findIndex(s => 'towerLady' in s);
      Object.assign(Game.s.flags, st.slice(0, i + 1).reduce((a, b) => Object.assign(a, b), {}));
      for (const k of ['fatherRemembers', 'ch2Done', 'ch3Call']) delete Game.s.flags[k];
      T.tp('o:1,2', 7, 7); Game.dialog = null;
      Game.say(FATHER_NPC.talk(Game));   // prima battuta del ricordo: fatherRemembers è già salvato
      if (!T54.disk().flags.fatherRemembers) return 'fatherRemembers non salvato: il caso non si riproduce';
      T54.quitAndContinue();
      let card = false; for (let k = 0; k < 400 && !card; k++) { R.frame([]); if (Game.dialog) T.skip(); card = Game.state === 'chapter'; }
      if (!card) return 'niente cartello del Capitolo II (' + Game.state + ', obiettivo: ' + currentObjective(Game) + ')';
      R.wait(130); Input.pressed.add('action'); R.frame([]);
      for (let k = 0; k < 120 && Game.state !== 'play'; k++) R.frame([]);
      if (!Game.s.flags.ch2Done) return 'ch2Done non impostato';
      if (objectiveRoom(Game) !== 'i:elder') return 'l\'obiettivo non porta da Teodoro: ' + currentObjective(Game);
      let again = false; for (let k = 0; k < 200; k++) { R.frame([]); if (Game.dialog) T.skip(); if (/^chapter/.test(Game.state)) again = true; }
      return again ? 'il cartello ricompare' : true;
    });
    check('Faro e campane: chiudendo il gioco a metà del finale, le 50 gemme sono già nel salvataggio (e a fine dialogo non raddoppiano)', () => {
      const bad = [];
      const C = [
        ['Faro', 'm:0,1', { ugoHello: true, 'chest:m_shard_faro': true, 'chest:m_shard_spiaggia': true, 'chest:m_shard_secche': true }, ugoTalk, 'farolit'],
        ['Campane', 'n:1,1', { bellmanHello: true, 'chest:n_bell_lago': true, 'chest:n_bell_pineta': true, 'chest:n_bell_cima': true }, gualtieroTalk, 'northBells'],
      ];
      for (const [k, room, fl, talk, until] of C) {
        const r = T54.cut(room, fl, talk, until);
        if (typeof r === 'string') { bad.push(k + ': ' + r); continue; }
        if (r.cut !== 50) bad.push(k + ': nel salvataggio +' + r.cut + ' gemme invece di +50');
        if (r.end !== 50) bad.push(k + ': a fine dialogo +' + r.end + ' gemme invece di +50');
        if (!r.gotText) bad.push(k + ': il testo «Hai ricevuto...» non è comparso');
      }
      return bad.length ? bad.join(' | ') : true;
    });
    check('Un dono in coda si dà una volta sola, anche con più salvataggi nello stesso dialogo; senza salvataggi arriva al suo turno', () => {
      T.fresh({ sword: true }); T.tp('o:1,2', 7, 7); Game.dialog = null;
      const g0 = Game.s.gems;
      Game.say(['Uno.', g => g.saveGame(), 'Due.', g => g.saveGame(), ...Game.giveItem('gems', 7), 'Tre.']);
      for (let i = 0; i < 10 && Game.dialog; i++) Game.nextEntry();
      if (Game.s.gems - g0 !== 7) return 'con due salvataggi: +' + (Game.s.gems - g0) + ' invece di +7';
      const g1 = Game.s.gems; Game.say(['Uno.', ...Game.giveItem('gems', 3), 'Due.']);
      if (Game.s.gems !== g1) return 'senza salvataggi il dono è arrivato prima del suo turno';
      for (let i = 0; i < 10 && Game.dialog; i++) Game.nextEntry();
      return Game.s.gems - g1 === 3 ? true : 'senza salvataggi: +' + (Game.s.gems - g1) + ' invece di +3';
    });
    R.god = god; Medals.data = md; Game.dialog = null; Game.state = 'title';
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    console.table(res);
    return res;
  },
};
window.T54 = T54;
