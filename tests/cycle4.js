'use strict';
/* =====================================================================
 *  TEST DEL CICLO 4 (Agente B) — si carica con  index.html?test
 *  Da console:  T4.suite()   (usa gli strumenti di tests/harness.js: T.tp, T.run, T.go, T.press, T.skip)
 *  Tutti i semi vengono raccolti con le meccaniche vere (spada, bombe, scivolate, arpione, lanterna).
 * ===================================================================== */
const T4 = {
  /* scivola sul ghiaccio in una direzione e aspetta che il giocatore si fermi */
  slide(dir) {
    const p0 = Game.player, x0 = p0.x, y0 = p0.y;   // tieni premuto finché la scivolata non parte
    for (let i = 0; i < 30 && !Game.player.slide; i++) T.run([dir], 1);
    if (!Game.player.slide && Game.player.x === x0 && Game.player.y === y0) return 'bloccato';
    for (let i = 0; i < 200 && Game.player.slide; i++) T.run([], 1);
    T.run([], 4);
    const p = Game.player;
    return Math.floor(p.cx() / TS) + ',' + Math.floor(p.cy() / TS);
  },
  face(d) { Game.player.dir = { down: 0, up: 1, left: 2, right: 3 }[d]; },
  has(id) { return !!Game.s.flags['seed:' + id]; },

  suite() {
    const bak = localStorage.getItem(SAVE_KEY), bakOpts = Object.assign({}, Opts);
    const res = [];
    const check = (name, fn) => {
      try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); }
      catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); }
    };
    Opts.diff = 1;

    check('Seme del Bosco: taglia le spine e raccoglilo', () => {
      T.fresh({ sword: true }); T.tp('o:2,1', 10, 1); T.noEnemies();
      T4.face('right'); T.press('action', 20);
      if (Game.tiles[1][11] !== '.') return 'spine non tagliate: ' + Game.tiles[1][11];
      T.go('x', 12 * TS + 8); T.skip();
      return T4.has('bosco') ? true : 'seme non raccolto: ' + T.where();
    });
    check('Seme della Foresta: bomba sul masso incrinato', () => {
      T.fresh({ sword: true }); Game.applyItem('bombs'); T.tp('o:0,0', 11, 1); T.noEnemies();
      T4.face('right'); T.press('item', 1); T.run(['left'], 20); T.run([], 110); T.skip();
      if (Game.tiles[1][12] === 'Q') return 'masso ancora intero';
      T.go('x', 13 * TS + 8); T.skip();
      return T4.has('foresta') ? true : 'seme non raccolto: ' + T.where();
    });
    check('Seme del Ghiaccio: 6 scivolate fino all\'angolo (1,8)', () => {
      T.fresh({ sword: true }); T.tp('c:0,1', 14, 5); T.skip();
      T.run(['down'], 14);
      const steps = ['left', 'down', 'right', 'up', 'left', 'down'].map(d => T4.slide(d));
      T.skip();
      return T4.has('ghiaccio') ? true : 'percorso: ' + steps.join(' > ');
    });
    check('Seme dell\'Abisso: arpione su e arpione giù', () => {
      T.fresh({ sword: true, hookshot: true }); Game.s.flags.abyssHint = true;
      T.tp('d:2,0', 11, 8); T.noEnemies(); Game.player.x = 11 * TS;
      T4.face('up'); T.press('item', 45); T.skip();
      if (!T4.has('abisso')) return 'seme non raccolto: ' + T.where();
      T4.face('down'); T.press('item', 45);
      const p = Game.player;
      return Math.floor(p.cy() / TS) === 8 && T.tile() === 'P' && !p.fallT ? true : 'ritorno fallito: ' + T.where();
    });
    check('Seme della Cripta: invisibile senza lanterna, si raccoglie con la lanterna', () => {
      T.fresh({ sword: true }); T.tp('d:0,2', 12, 9); T.noEnemies();
      if (Game.entities.some(e => e instanceof Seed)) return 'il seme compare senza lanterna';
      Game.s.items.lantern = true; T.tp('d:0,2', 12, 9); T.noEnemies(); Game.s.flags.cryptFound = true;
      T.go('x', 13 * TS + 8); T.skip();
      return T4.has('cripta') ? true : 'seme non raccolto: ' + T.where();
    });
    check('Ortensio: missione, piantagione, giardino fiorito e Spada dell\'Alba', () => {
      T.fresh({ sword: true }); Game.s.flags.victory = true; Game.s.flags.boss = true; Game.s.items.crystal = true;
      T.tp('o:1,0', 4, 8); T.noEnemies();
      T4.face('up'); T.press('action', 2); T.skip();
      if (!Game.s.flags.seedQuest) return 'missione non avviata: ' + T.where();
      if (Game.s.flags.garden) return 'giardino piantato senza semi';
      SEED_IDS.forEach(id => { Game.s.flags['seed:' + id] = true; });
      T4.face('up'); T.press('action', 2); T.skip();
      if (!Game.s.flags.garden || !Game.s.items.dawnsword) return 'giardino/spada mancanti';
      const flowers = GARDEN_FLOWERS.filter(([x, y]) => Game.tiles[y][x] === 'F').length;
      T.tp('o:1,0', 7, 6);
      const after = GARDEN_FLOWERS.filter(([x, y]) => Game.tiles[y][x] === 'F').length;
      return flowers === GARDEN_FLOWERS.length && after === flowers ? true : 'fiori: ' + flowers + ' / dopo il rientro ' + after;
    });
    check('Spada dell\'Alba: 2 danni a colpo', () => {
      T.fresh({ sword: true, dawnsword: true }); T.tp('o:2,2', 6, 7); T.noEnemies();
      const sl = new Slime(Game.player.x, Game.player.y + 14, false); sl.timer = 9999; sl.hp = 3; Game.entities.push(sl);
      T4.face('down'); T.press('action', 3);
      return sl.hp === 1 ? true : 'PV slime: ' + sl.hp;
    });
    check('Caduta: si riparte dall\'ultimo punto sicuro, non dall\'ingresso', () => {
      T.fresh({ sword: true }); T.tp('d:2,0', 7, 9); T.noEnemies();
      T.go('x', 13 * TS + 8); T.run([], 5);
      const sx = Game.player.cx();
      T.run(['up'], 40); T.run([], 60);
      const p = Game.player;
      return Math.abs(p.cx() - sx) < 8 && !p.fallT && T.tile() !== '_' ? true : 'ripartito da ' + T.where() + ' invece che vicino a x=' + Math.round(sx);
    });
    check('Difficoltà: Facile riduce i colpi forti, Eroe raddoppia', () => {
      const r = [];
      for (const d of [0, 1, 2]) { Opts.diff = d; r.push(diffDamage(2), diffDamage(1)); }
      Opts.diff = 1;
      return r.join(',') === '1,1,2,1,4,2' ? true : r.join(',');
    });
    check('Menu opzioni: volume, difficoltà, uscita', () => {
      Game.state = 'title'; Game.menuIdx = 0; Opts.music = 4; Opts.diff = 1;
      const items = Game.titleItems(); Game.menuIdx = items.indexOf('Opzioni');
      T.press('action', 1);
      if (Game.state !== 'options') return 'menu non aperto: ' + Game.state;
      T.press('left', 1);                                   // musica 4 -> 3
      T.press('down', 1); T.press('down', 1); T.press('right', 1);   // difficoltà -> Eroe
      const ok = Opts.music === 3 && Opts.diff === 2;
      T.press('start', 1);
      Opts.music = 4; Opts.diff = 1; saveOpts();
      return ok && Game.state === 'title' ? true : 'musica=' + Opts.music + ' diff=' + Opts.diff + ' stato=' + Game.state;
    });
    check('Prologo: parte da "Nuova partita", si salta e inizia la partita', () => {
      Game.state = 'title'; const items = Game.titleItems(); Game.menuIdx = items.indexOf('Nuova partita');
      T.press('action', 1);
      if (Game.newConfirm) { T.press('left', 1); T.press('action', 1); }   // Ciclo 12: con un salvataggio chiede conferma
      if (Game.state !== 'prologue') return 'prologo non avviato: ' + Game.state;
      T.run([], 300); Game.render();
      T.press('start', 1); T.run([], 40);
      return Game.state === 'play' || Game.dialog ? true : 'stato ' + Game.state;
    });
    check('Prologo completo senza salti, con render a ogni frame', () => {
      Game.startPrologue();
      for (let i = 0; i < PRO_END + 10 && Game.state === 'prologue'; i++) { T.run([], 1); if (i % 7 === 0) Game.render(); }
      return Game.state !== 'prologue' ? true : 'ancora nel prologo';
    });
    check('NPC che passeggiano: mai addosso al giocatore, mai fuori dal raggio', () => {
      T.fresh({ sword: true }); T.tp('o:1,2', 10, 8);
      const nina = Game.entities.find(e => e.def && e.def.id === 'nina');
      for (let i = 0; i < 3000; i++) {
        const k = ['up', 'down', 'left', 'right'][(i / 37 | 0) % 4];
        T.run(Math.random() < 0.5 ? [k] : [], 1);
        if (Game.roomId !== 'o:1,2') T.tp('o:1,2', 10, 8);
        if (overlap(nina.box(), Game.player.box())) return 'Nina addosso al giocatore al frame ' + i;
        if (Math.abs(nina.x - nina.hx) > 2 * TS + 1 || Math.abs(nina.y - nina.hy) > 2 * TS + 1) return 'Nina troppo lontana';
      }
      return true;
    });

    Object.assign(Opts, bakOpts); saveOpts();
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
