'use strict';
/* =====================================================================
 *  CICLO 37 — test del Tempio delle Maree.   T37.suite()  (con ?test)
 *  T37.duel({ diff })  il bot sostiene il duello di canto con input veri -> { vinta, frame, vita, errori }
 *  T37.climb()         il bot attraversa il Tempio dall'ingresso al Cuore del Mare
 * ===================================================================== */
const T37 = {
  post() {
    T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true, diapason: true });
    Object.assign(Game.s.flags, { victory: true, boss: true, ch4Done: true, ch5Call: true, seaIn: true, marevaHello: true, babyFound: true, conchMareva: true,
      'chest:s_conch_onde': true, 'chest:s_conch_torre': true, templeOpen: true });
    Game.s.wLvl = 'high'; Game.s.bombs = 10;
  },
  /* suona una sequenza di note con la Conca, tasti veri */
  play(seq, gap) {
    Game.s.equip = 'conch';
    if (!Game.song) { Input.pressed.add('item'); R.frame([]); }
    for (const n of seq) { Input.pressed.add(NOTE_KEYS[n]); R.frame([]); R.wait(gap || 6); }
    for (let i = 0; i < 60 && Game.song && Game.song.done; i++) R.frame([]);
    T.skip();
  },
  /* legge un murale guardando in una direzione; riprova se la pressione va persa (fermo dopo un colpo, dialogo appena chiuso) */
  // prima qualche passo contro il muro, come farebbe chiunque: fermo «al centro» della casella il bot a volte restava un decimo di pixel troppo indietro per arrivare al murale
  read(dir, flag) { const key = dir[0] > 0 ? 'right' : dir[0] < 0 ? 'left' : dir[1] > 0 ? 'down' : 'up'; for (let k = 0; k < 4 && !Game.s.flags[flag]; k++) { T.skip(); T.run([key], 8); R.faceTo(...dir); Input.pressed.add('action'); T.run([], 4); T.skip(); R.wait(6); } return !!Game.s.flags[flag]; },
  learnAll() { Object.assign(Game.s.flags, { 'song:bassa': true, 'song:alta': true, 'song:risveglio': true }); Game.s.items.conch = true; },
  duel(o) {
    o = Object.assign({ diff: 1, god: false, max: 20000 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = o.god;
    try {
      T37.post(); T37.learnAll(); Object.assign(Game.s.flags, { wIn: true }); Game.s.items.potion = false; Game.s.maxHp = Game.s.hp = 14;
      T.tp('w:1,0', 6, 6); T.skip();
      let f = 0, errors = 0; const b = Game.boss;
      for (; f < o.max && !Game.s.flags.wMother && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); continue; }
        const p = Game.player, keys = [];
        // al riparo: sopra il pilastro in (6,7)
        const dx = 6 * TS + 8 - p.cx(), dy = 6 * TS + 8 - p.cy();
        if (Math.abs(dx) > 2) keys.push(dx > 0 ? 'right' : 'left'); else if (Math.abs(dy) > 2) keys.push(dy > 0 ? 'down' : 'up');
        if (b.state === 'listen' && !keys.length) {
          Game.s.equip = 'conch';
          if (!Game.song) Input.pressed.add('item');
          else if (f % 10 === 0) Input.pressed.add(NOTE_KEYS[b.phrase[b.heard]]);
        }
        const before = b.fails;
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (b.fails > before) errors++;
        if (R.god) Game.s.hp = Game.s.maxHp;
      }
      return { vinta: !!Game.s.flags.wMother, frame: f, vita: Game.s.hp + '/' + Game.s.maxHp, errori: errors };
    } finally { Opts.diff = keep; R.god = god; T.skip(); Game.state = 'title'; Game.ch5CardIn = 0; Game.song = null; }
  },
  climb() {
    const log = [], step = s => log.push(s);
    T37.post(); T.tp('s:1,2', 7, 4); T.skip();
    R.walkTo(7, 5); T.run(['down'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1); T.skip();
    if (Game.roomId !== 'w:1,2') return 'ingresso: ' + Game.roomId;
    step('atrio');
    R.walkTo(1, 5); R.pushThrough('left', 'w:0,2'); T.skip();
    for (let i = 0; i < 2500 && Game.entities.some(e => e.enemy && !e.dead); i++) { const foes = Game.entities.filter(e => e.enemy && !e.dead); R.frame(R.fightStep(foes)); }
    // Ciclo 39: come per i murali, qualche passo contro lo scrigno prima di aprirlo, e si riprova se la pressione va persa
    for (let k = 0; k < 4 && !Game.s.items.conch; k++) { R.walkTo(7, 4); T.run(['down'], 6); R.faceTo(0, 1); Input.pressed.add('action'); T.run([], 5); T.skip(); }
    if (!Game.s.items.conch) return 'conca non presa (' + log.join(' → ') + ') ' + T.where();
    R.walkTo(7, 1); T37.read([0, -1], 'song:bassa');
    if (!Game.s.flags['song:bassa']) return 'murale della marea bassa';
    step('conca');
    R.walkTo(14, 5); R.pushThrough('right', 'w:1,2'); R.walkTo(14, 5); R.pushThrough('right', 'w:2,2'); T.skip();
    R.walkTo(1, 5); T37.play(SONGS.bassa.seq);
    if (wLvl(Game) !== 'low') return 'marea bassa non suonata';
    R.walkTo(14, 5); T37.read([1, 0], 'song:risveglio');
    if (!Game.s.flags['song:risveglio']) return 'murale del risveglio ' + T.where();
    step('vasche');
    R.walkTo(1, 5); R.pushThrough('left', 'w:1,2'); T.skip();
    R.walkTo(7, 2); T37.play(SONGS.risveglio.seq); T.run([], 80); T.skip();
    if (!Game.s.flags.wAwake || Game.tiles[0][7] === 'J') return 'statue non risvegliate';
    step('risveglio');
    R.walkTo(7, 1); R.pushThrough('up', 'w:1,1'); T.skip();
    R.walkTo(1, 5); R.pushThrough('left', 'w:0,1'); T.skip();
    for (let i = 0; i < 2500 && Game.entities.some(e => e.enemy && !e.dead); i++) { const foes = Game.entities.filter(e => e.enemy && !e.dead); R.frame(R.fightStep(foes)); }   // prima si ripulisce la sala
    R.walkTo(1, 2); T37.read([0, -1], 'song:alta');
    if (!Game.s.flags['song:alta']) return 'murale della marea alta ' + T.where();
    for (let k = 0; k < 4 && wLvl(Game) !== 'high'; k++) { R.walkTo(3, 2); T37.play(SONGS.alta.seq); }   // un'onda o un colpo interrompono il canto: si riprova (al riparo del pilastro in (3,3))
    if (wLvl(Game) !== 'high') return 'marea alta non suonata';
    step('canto alto');
    for (let k = 0; k < 3 && Game.roomId !== 'w:1,1'; k++) { try { R.walkTo(14, 5); R.pushThrough('right', 'w:1,1'); } catch (e) { if (k === 2) throw e; R.wait(30); } }   // Ciclo 41: un'onda può spostare il bot dalla riga del varco: si riprova
    T.skip();
    R.walkTo(7, 1); R.pushThrough('up', 'w:1,0'); T.skip();
    if (Game.roomId !== 'w:1,0' || !Game.boss) return 'cuore del mare non raggiunto: ' + Game.roomId;
    step('cuore');
    return log.join(' → ');
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check("Il portone di Coralia porta nell'Atrio; la scala riporta fuori", () => {
      T37.post(); T.tp('s:1,2', 7, 4); if (Game.tiles[6][7] !== 'Z') return 'portone chiuso';
      R.walkTo(7, 5); T.run(['down'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (Game.roomId !== 'w:1,2' || !Game.dialog) return 'ingresso: ' + Game.roomId;
      T.skip(); T.run(['down'], 60); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      return Game.roomId === 's:1,2' ? true : 'uscita: ' + Game.roomId;
    });
    check('La Conca: si suona con X, Lio si ferma, le frecce sono note; X smette', () => {
      T37.post(); Game.s.items.conch = true; Game.s.equip = 'conch'; T.tp('w:0,1', 7, 5); T.skip(); T.noEnemies();
      Input.pressed.add('item'); T.run([], 2); if (!Game.song) return 'non suona';
      const x0 = Game.player.x; T.run(['right'], 20); if (Game.player.x !== x0) return 'si muove mentre suona';
      Input.pressed.add('right'); T.run([], 2); if (Game.song.buf.join() !== '1') return 'nota non suonata: ' + Game.song.buf;
      Input.pressed.add('item'); T.run([], 2); return Game.song ? 'non smette' : true;
    });
    check('Le melodie si imparano dai murali; una melodia non imparata non fa niente', () => {
      T37.post(); Game.s.items.conch = true; T.tp('w:2,2', 1, 5); T.skip();
      T37.play(SONGS.bassa.seq); if (wLvl(Game) !== 'high') return 'funziona senza averla imparata';
      Game.say(ROOMS['w:0,2'].signs['7,0'](Game)); T.skip(); if (!Game.s.flags['song:bassa']) return 'murale non insegna';
      T37.play(SONGS.bassa.seq); return wLvl(Game) === 'low' ? true : 'imparata ma non funziona';
    });
    check('Marea Bassa: le Vasche si scoprono; Marea Alta: tornano piene e le passerelle galleggiano; mai acqua sotto i piedi', () => {
      T37.post(); T37.learnAll(); T.tp('w:2,2', 1, 5); T.skip();
      T37.play(SONGS.bassa.seq); if (Game.tiles[5][4] === '~') return 'vasche ancora piene';
      R.walkTo(4, 5); T37.play(SONGS.alta.seq); if (Game.tiles[5][4] === '~') return 'acqua sotto i piedi di Lio';
      if (Game.tiles[5][5] !== '~') return 'le vasche non si riempiono';
      // Lio è rimasto su un isolotto (la sua casella è asciutta, intorno è acqua): niente vicolo cieco, basta suonare di nuovo la Marea Bassa
      T37.play(SONGS.bassa.seq); R.walkTo(1, 5); T37.play(SONGS.alta.seq); T.run([], 3); if (Game.tiles[5][4] !== '~') return 'la casella non si riempie dopo';
      T.tp('w:1,1', 7, 8); T.skip(); return Game.tiles[5][7] !== '_' ? true : 'passerelle sul fondo con la marea alta';
    });
    check('Canto del Risveglio: le statue dell\'Atrio si spostano e la porta nord si apre; fuori dal Tempio i canti non fanno niente', () => {
      T37.post(); T37.learnAll(); T.tp('w:1,2', 7, 3); T.skip();
      if (Game.tiles[0][7] !== 'J') return 'porta aperta da sola';
      T37.play(SONGS.risveglio.seq); T.run([], 60); T.skip();
      if (!Game.s.flags.wAwake || Game.tiles[0][7] === 'J') return 'porta chiusa';
      const st = Game.entities.filter(e => e instanceof CoralStatue); if (st.some(s => Math.abs(s.x / TS - s.def.to[0]) > 0.1)) return 'statue ferme';
      T.tp('s:1,1', 7, 6); const lv = wLvl(Game); T37.play(SONGS.bassa.seq); return wLvl(Game) === lv ? true : 'fuori dal Tempio cambia la marea';
    });
    check('Sala dei Coraliani: risvegliate le quattro statue compare un Cuore di Cristallo', () => {
      T37.post(); T37.learnAll(); T.tp('w:2,1', 8, 5); T.skip();
      if (Game.entities.some(e => e instanceof Chest)) return 'forziere già visibile';
      T37.play(SONGS.risveglio.seq); T.run([], 60); T.skip();
      return Game.entities.some(e => e instanceof Chest && e.def.item === 'container') ? true : 'nessun forziere';
    });
    check('La Madre: la spada non serve; una nota sbagliata scatena un\'onda; la frase giusta la calma', () => {
      T37.post(); T37.learnAll(); Game.s.flags.wIn = true; T.tp('w:1,0', 6, 6); T.skip();
      const b = Game.boss; if (!(b instanceof Madre)) return 'niente Madre';
      b.hurt(Game); T.skip(); if (b.calm !== 0) return 'la spada la calma';
      for (let i = 0; i < 400 && b.state !== 'listen'; i++) { T.run([], 1); T.skip(); }
      if (b.state !== 'listen') return 'non arriva all\'ascolto: ' + b.state;
      const wrong = (b.phrase[0] + 1) % 4; T37.play([wrong]);
      if (b.state !== 'wrath' || b.fails !== 1) return 'nota sbagliata senza conseguenze: ' + b.state;
      if (Game.waveFront() !== 'warn') return 'nessuna onda';
      for (let i = 0; i < 900 && b.state !== 'listen'; i++) { T.run([], 1); T.skip(); }
      T37.play(b.phrase); T.skip();
      return b.calm === 1 ? true : 'calma ' + b.calm + ' stato ' + b.state;
    });
    check('Pace: cinque frasi, il Diapason, l\'Onda Grande si scioglie; cartello del Capitolo V e ritorno a Porto Corallo', () => {
      T37.post(); T37.learnAll(); Object.assign(Game.s.flags, { wIn: true }); T.tp('w:1,0', 6, 6); T.skip();
      const b = Game.boss;
      for (let k = 0; k < 5; k++) { for (let i = 0; i < 900 && b.state !== 'listen' && b.state !== 'peace' && b.state !== 'done'; i++) { T.run([], 1); T.skip(); } if (b.state === 'listen') T37.play(b.phrase); T.skip(); }
      for (let i = 0; i < 200 && !Game.s.flags.wMother; i++) { T.run([], 1); }
      if (!Game.s.flags.wMother) return 'nessuna pace: calma ' + b.calm + ' ' + b.state;
      if (Game.tiles[10][7] !== 'P' || !Game.pickups.some(p => p.kind === 'container')) return 'porte/cuore';
      if (!/Fratello/.test(JSON.stringify(Game.dialog && Game.dialog.queue))) return 'niente riconciliazione';
      T.skip(); if (!Game.s.flags.seaCalm) return 'mare non calmo';
      for (let i = 0; i < 120 && Game.state !== 'chapter5'; i++) T.run([], 1);
      if (Game.state !== 'chapter5') return 'niente cartello';
      T.run([], 130); Input.pressed.add('action'); T.run([], 2); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (!Game.s.flags.ch5Done || Game.roomId !== 'm:1,1') return 'ritorno: ' + Game.roomId;
      if (TILE_SOLID.has(T.tile())) return 'Lio è dentro un muro a Porto Corallo';
      if (CHAPTERS5.length > 9) return 'diario oltre 9';
      return CHAPTERS5.every(c => c.done(Game)) ? true : 'capitoli: ' + CHAPTERS5.filter(c => !c.done(Game)).map(c => c.name);
    });
    check('Un colpo interrompe il canto', () => {
      T37.post(); Game.s.items.conch = true; Game.s.equip = 'conch'; T.tp('w:0,1', 7, 5); T.skip(); T.noEnemies();
      Input.pressed.add('item'); T.run([], 2); Game.player.hurt(Game, 1, Game.player.cx() + 10, Game.player.cy()); T.run([], 2);
      return Game.song ? 'continua a suonare' : true;
    });
    check("Albo d'oro: nessun id di medaglia ripetuto (io avevo usato «canto», già della medaglia del portone)", () => {
      const seen = new Set(), dup = []; for (const m of MEDALS) { if (seen.has(m.id)) dup.push(m.id); seen.add(m.id); }
      return dup.length ? 'ripetuti: ' + dup.join(',') : true;
    });
    check('Obiettivo e Segnavia seguono il Tempio', () => {
      T37.post(); const seq = [[{}, 'w:1,2'], [{ wIn: true }, 'w:0,2'], [{ _c: true, 'song:bassa': true }, 'w:2,2'], [{ 'song:risveglio': true }, 'w:1,2'], [{ wAwake: true }, 'w:0,1'], [{ 'song:alta': true }, 'w:1,0'], [{ wMother: true }, null]];
      for (const [fl, want] of seq) {
        if (fl._c) { Game.s.items.conch = true; delete fl._c; } Object.assign(Game.s.flags, fl);
        const r = objectiveRoom(Game); if (r !== want) return 'atteso ' + want + ', trovato ' + r;
        if (!currentObjective(Game)) return 'obiettivo vuoto';
      }
      return true;
    });
    check("Il bot attraversa il Tempio con input veri, dall'Atrio al Cuore del Mare", () => {
      const r = T37.climb(); T37.climbLog = r; return /cuore$/.test(r) ? true : r;
    });
    check('Tutte le sale si disegnano (anche con la Conca aperta); mappa TEMPIO; inventario a 6 colonne col nome in mano', () => {
      T37.post(); T37.learnAll(); Object.assign(Game.s.items, { sundial: true, starlamp: true, tunic: true, swim: true, potion: true }); Game.s.equip = 'conch';
      for (const id of Object.keys(ROOMS).filter(i => i.startsWith('w:'))) { T.tp(id, 7, 8); T.skip(); Input.pressed.add('item'); for (let i = 0; i < 10; i++) { Game.update(); Game.render(); Input.endFrame(); } Game.song = null; T.skip(); }
      Game.state = 'pause'; Game.pausePage = 0; const calls = [], f = window.txt; window.txt = function (s) { calls.push(s); return f.apply(this, arguments); }; try { Game.render(); } finally { window.txt = f; }
      const pre = Game.mapPrefix(); Game.state = 'play';
      return pre === 'w:' && calls.includes(ITEMS.conch.name) ? true : 'mappa ' + pre + ' nome in mano ' + calls.includes(ITEMS.conch.name);
    });
    R.god = false;
    check('Duello di canto onesto (niente vita infinita): il bot calma la Madre almeno una volta su 2 a Normale', () => {
      const r = []; for (let i = 0; i < 2; i++) { const x = T37.duel({ diff: 1 }); r.push(x); if (x.vinta) { T37.duelLog = JSON.stringify(r); return true; } }
      return JSON.stringify(r);
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.boss = null; Game.ch5CardIn = 0; Game.song = null;
    console.table(res);
    return res;
  },
};
window.T37 = T37;
