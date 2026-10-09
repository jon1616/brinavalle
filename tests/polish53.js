'use strict';
/* =====================================================================
 *  CICLO 53 — rifinitura: niente si perde se il gioco si chiude nel momento sbagliato.   T53.suite()  (con ?test)
 * ===================================================================== */
const T53 = {
  CASES: [
    { k: 'III', setup: () => { T33.post(); Object.assign(Game.s.flags, { vIn: true, vArmilla: true, vesperVoice: true }); }, room: 'v:1,0', done: 'ch3Done', state: 'chapter3' },
    { k: 'IV', setup: () => { T35.post ? T35.post() : T33.post(); Object.assign(Game.s.flags, { ch3Done: true, ch4Call: true, coastIn: true, farolit: true, craterOpen: true, fIn: true, fUmbra: true }); }, room: 'f:1,0', done: 'ch4Done', state: 'chapter4' },
    { k: 'V', setup: () => { T37.post(); Object.assign(Game.s.flags, { wIn: true, wMother: true }); }, room: 'w:1,0', done: 'ch5Done', state: 'chapter5' },
    { k: 'VI', setup: () => T39.post(Object.assign({ gIn: true, gHeart: true }, T39.echoes())), room: 'g:1,0', done: 'ch6Done', state: 'chapter6' },
    { k: 'VII', setup: () => T41.post(Object.assign({ qIn: true, qWind: true, 'song:valle': true }, T41.strofe())), room: 'q:1,0', done: 'ch7Done', state: 'chapter7' },
  ],
  /* salva, torna al titolo e fai «Continua» come un giocatore */
  reload() { Game.saveGame(); Game.state = 'title'; Game.dialog = null; Game.startFrom(readSave(), true); for (let i = 0; i < 200 && Game.state !== 'play'; i++) { Game.update(); Input.endFrame(); } },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check('Capitoli III-VII: chi chiude il gioco dopo il finale ma prima del cartello, al «Continua» rivede il cartello e la storia riparte', () => {
      const bad = [];
      for (const c of T53.CASES) {
        c.setup(); T.tp(c.room, 7, 7); Game.dialog = null; T53.reload();
        let seen = false; for (let i = 0; i < 400 && !seen; i++) { R.frame([]); if (Game.dialog) T.skip(); seen = Game.state === c.state; }
        if (!seen) { bad.push(c.k + ': niente cartello (' + Game.state + ')'); continue; }
        R.wait(130); Input.pressed.add('action'); R.frame([]);
        for (let i = 0; i < 120 && Game.state !== 'play'; i++) R.frame([]);
        if (!Game.s.flags[c.done]) bad.push(c.k + ': ' + c.done + ' non impostato');
        T.skip(); let again = false; for (let i = 0; i < 200; i++) { R.frame([]); if (Game.dialog) T.skip(); if (/^chapter/.test(Game.state)) again = true; }
        if (again) bad.push(c.k + ': il cartello ricompare');
      }
      return bad.length ? bad.join(' | ') : true;
    });
    check('Nel percorso normale il cartello compare una volta sola (Capitolo VI)', () => {
      T39.post(Object.assign({ gIn: true, gHeartSeen: true }, T39.echoes())); T.tp('g:1,0', 7, 7); T.skip();
      const b = Game.boss; b.round = 2; b.prog = TERRA_NEED - 1; b.state = 'beat'; b.clock = 0; b.beats = []; b.fill();
      Game.s.equip = 'conch'; Input.pressed.add('item'); R.frame([]);
      const x = b.beats[0]; while (b.clock < x.t) R.frame([]); Input.pressed.add(NOTE_KEYS[x.n]); R.frame([]);
      let cards = 0, prev = Game.state;
      for (let i = 0; i < 900; i++) { R.frame([]); if (Game.dialog) T.skip(); if (Game.state === 'chapter6' && prev !== 'chapter6') { cards++; R.wait(130); Input.pressed.add('action'); R.frame([]); } prev = Game.state; }
      return cards === 1 && Game.s.flags.ch6Done ? true : 'cartelli ' + cards + ' ch6Done ' + Game.s.flags.ch6Done;
    });
    check('Un cartello in arrivo si annulla se il capitolo è già chiuso o se il finale non c\'è (es. «Nuova partita» subito dopo)', () => {
      T37.post(); Object.assign(Game.s.flags, { wIn: true, wMother: true }); T.tp('w:1,0', 7, 7); Game.dialog = null; R.frame([]);
      const armed = Game.ch5CardIn > 0; Game.s.flags.ch5Done = true; R.frame([]); const off1 = Game.ch5CardIn === 0;
      Game.ch6CardIn = 30; T.fresh({ sword: true }); T.tp('o:1,2', 7, 7); Game.dialog = null; for (let i = 0; i < 40; i++) R.frame([]);
      return armed && off1 && Game.ch6CardIn === 0 && Game.state === 'play' ? true : [armed, off1, Game.ch6CardIn, Game.state].join(' / ');
    });
    check('Il cuore di cristallo di un boss resta finché non lo prendi: uscendo dalla sala e dopo un «Continua»', () => {
      T39.post(Object.assign({ gIn: true, gHeart: true, ch6Done: true }, T39.echoes())); T.tp('g:1,0', 7, 8); T.skip(); T.noEnemies();
      Game.pickups.push(new Pickup(128, 96, 'container')); R.frame([]);   // come lo lascia un boss
      if (!Game.s.flags['pendCont:g:1,0']) return 'non annotato';
      T.tp('g:1,1', 7, 7); T.tp('g:1,0', 7, 8); if (!Game.pickups.some(p => p.kind === 'container')) return 'perso uscendo dalla sala';
      T53.reload(); if (Game.roomId !== 'g:1,0' || !Game.pickups.some(p => p.kind === 'container')) return 'perso col Continua: ' + Game.roomId;
      const hp0 = Game.s.maxHp, p = Game.pickups.find(q => q.kind === 'container'); Game.player.x = p.x - 8; Game.player.y = p.y - 12;
      for (let i = 0; i < 20 && Game.s.maxHp === hp0; i++) { R.frame([]); if (Game.dialog) T.skip(); }
      if (Game.s.maxHp !== hp0 + 2) return 'non raccolto: ' + hp0 + '→' + Game.s.maxHp;
      T.tp('g:1,1', 7, 7); T.tp('g:1,0', 7, 8);
      return !Game.pickups.some(q => q.kind === 'container') && !Game.s.flags['pendCont:g:1,0'] ? true : 'ricompare dopo averlo preso';
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.boss = null; Game.dialog = null; for (const c of PENDING_CARDS) Game[c.card] = 0;
    console.table(res);
    return res;
  },
};
window.T53 = T53;
