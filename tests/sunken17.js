'use strict';
/* =====================================================================
 *  CICLO 17 — test del Santuario Sommerso (nuoto, Serpe di Vetro).
 *    T17.suite()          test della stanza per stanza, con input simulati
 *    T17.duel({diff,n})   bot che combatte la Serpe senza vita infinita
 * ===================================================================== */
const T17 = {
  cell: () => [Math.floor(Game.player.cx() / TS), Math.floor(Game.player.cy() / TS)],
  /* il bot del duello: schiva le sfere, si mette sulla riva accanto alla testa, arpione; poi spada */
  step(st) {
    const g = Game, p = g.player, b = g.boss;
    if (!b || b.dead) return [];
    const dk = R.dodge(); if (dk && b.state !== 'beached') return R.safeKeys(dk).filter(k => true);
    if (b.state === 'beached' || b.state === 'yank') {
      g.s.equip = 'hookshot';
      const hx = b.x + 12, hy = b.y + 12, dx = hx - p.cx(), dy = hy - p.cy();
      const horiz = Math.abs(dx) > Math.abs(dy);
      const tx = horiz ? hx - Math.sign(dx) * 17 : hx, ty = horiz ? hy + 2 : hy - Math.sign(dy) * 17;
      if (Math.hypot(tx - p.cx(), ty - p.cy()) < 6 && p.attackT === 0) {
        p.dir = horiz ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); Input.pressed.add('action'); return [];
      }
      return T5.keysToward(p, tx, ty);
    }
    if (b.state === 'up' && b.spot) {
      // come un giocatore: una casella di terra sulla stessa riga o colonna della testa, con la linea libera
      const [sx, sy] = b.spot;
      let best = null, bd = 1e9;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= 6; k++) {
        const tx = sx + dx * k, ty = sy + dy * k, t = tileAt(tx, ty);
        if (t === null || TILE_SOLID.has(t)) break;
        if (t === '~') continue;
        const d = Math.hypot(tx * TS + 8 - p.cx(), ty * TS + 8 - p.cy());
        if (d < bd) { bd = d; best = [tx, ty, dx, dy]; }
      }
      if (best) {
        const tx = best[0] * TS + 8, ty = best[1] * TS + 8;
        if (Math.hypot(tx - p.cx(), ty - p.cy()) < 3 && !p.hook) {
          g.s.equip = 'hookshot'; p.dir = best[2] ? (best[2] > 0 ? 2 : 3) : (best[3] > 0 ? 1 : 0); Input.pressed.add('item'); return [];
        }
        return R.safeKeys(T5.keysToward(p, tx, ty, 1));
      }
    }
    return [];
  },
  one(hearts, diff) {
    const keep = Opts.diff; Opts.diff = diff;
    try {
      T.fresh({ sword: true, hookshot: true, swim: true, bombs: true });
      Game.s.maxHp = Game.s.hp = hearts * 2; Game.s.flags.serpentIntro = true;
      T.tp('l:1,0', 7, 9); T.skip();
      let f = 0;
      for (; f < 12000 && !Game.s.flags.serpent && Game.state !== 'gameover'; f++) {
        if (Game.dialog) T.skip();
        const keys = Game.state === 'play' ? T17.step({}) : [];
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
      }
      return { win: !!Game.s.flags.serpent, sec: Math.round(f / 60), lost: hearts * 2 - Game.s.hp };
    } finally { Opts.diff = keep; }
  },
  duel(o) {
    o = Object.assign({ hearts: 6, diff: 1, n: 6 }, o);
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    try { for (let i = 0; i < o.n; i++) res.push(T17.one(o.hearts, o.diff)); }
    finally { if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY); Game.state = 'title'; }
    const w = res.filter(r => r.win);
    return { cuori: o.hearts, difficolta: DIFF_NAMES[o.diff], vittorie: w.length + '/' + o.n, durataMedia: w.length ? Math.round(w.reduce((a, r) => a + r.sec, 0) / w.length) + ' s' : '-', mezziCuoriPersi: (res.reduce((a, r) => a + r.lost, 0) / o.n).toFixed(1) };
  },

  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check("Ingresso: bomba sul masso dell'isola -> scala -> Santuario, e la scala resta", () => {
      T.fresh({ sword: true, bombs: true }); Game.s.bombs = 5; T.tp('o:0,2', 8, 5); T.noEnemies();
      if (Game.tiles[4][8] !== 'Q') return 'niente masso';
      Game.explode(8 * TS + 8, 4 * TS + 12); T.skip();
      if (Game.tiles[4][8] !== 'Z') return 'scala non comparsa: ' + Game.tiles[4][8];
      T.tp('o:0,2', 8, 5); if (Game.tiles[4][8] !== 'Z') return 'scala sparita al rientro';
      R.pushThrough('up', 'l:1,2'); T.skip();
      if (Game.roomId !== 'l:1,2') return 'non entrato';
      R.warp(7, 9, 'o:0,2');
      return Game.roomId === 'o:0,2' && T17.cell().join(',') === '8,5' ? true : 'uscita: ' + Game.roomId + ' ' + T17.cell();
    });
    check('Sala delle Squame: senza arpione il forziere è irraggiungibile', () => {
      T.fresh({ sword: true, bombs: true }); T.tp('l:0,1', 14, 5); T.noEnemies();
      return R.path([3, 2]) === null ? true : 'raggiungibile a piedi!';
    });
    check("Sala delle Squame: arpione al palo -> forziere -> SQUAME; poi si torna a nuoto", () => {
      T.fresh({ sword: true, bombs: true, hookshot: true }); Game.s.flags.scalesHint = true; T.tp('l:0,1', 14, 5); T.noEnemies();
      R.walkTo(11, 5); Game.s.equip = 'hookshot'; Game.player.dir = 2; R.tap('item', 2);
      for (let i = 0; i < 120 && Game.player.hook; i++) R.frame([]);   // la trazione è lunga ~100 px
      if (T17.cell().join(',') !== '5,5') return 'atterrato in ' + T17.cell();
      R.openChestAt(2, 2); T.skip();
      if (!Game.s.items.swim) return 'niente squame';
      for (let i = 0; i < 400 && T17.cell()[0] < 11; i++) R.frame(['right']);
      return T17.cell()[0] >= 11 && Game.s.hp === Game.s.maxHp ? true : 'ritorno a nuoto fallito: ' + T17.cell() + ' hp ' + Game.s.hp;
    });
    check('Nuoto: in acqua si va più piano, niente spada né oggetti, nessun tuffo mortale', () => {
      T.fresh({ sword: true, bombs: true, swim: true }); Game.s.bombs = 5; T.tp('l:1,2', 1, 8); T.noEnemies();
      const x0 = Game.player.x; T.run(['right'], 20); const land = Game.player.x - x0;   // a terra, nel Vestibolo
      T.tp('l:2,1', 2, 5); T.noEnemies(); T.run(['right'], 30);
      if (!Game.player.isSwimming()) return 'non sta nuotando';
      const x1 = Game.player.x; T.run(['right'], 20); const water = Game.player.x - x1;
      Input.pressed.add('action'); T.run([], 1); const att = Game.player.attackT;
      Input.pressed.add('item'); T.run([], 1); const bombs = Game.entities.filter(e => e.bomb).length;
      return water < land * 0.8 && att === 0 && bombs === 0 && !Game.player.fallT ? true : 'terra ' + land.toFixed(1) + ' acqua ' + water.toFixed(1) + ' att ' + att + ' bombe ' + bombs;
    });
    check('Sala della Chiave: senza nuoto nessuna strada (neanche con l\'arpione), a nuoto sì', () => {
      T.fresh({ sword: true, hookshot: true }); T.tp('l:2,1', 2, 5); T.noEnemies();
      if (R.path([10, 5]) !== null) return 'raggiungibile a piedi';
      Game.player.dir = 3; Game.s.equip = 'hookshot'; R.tap('item', 60);
      if (T17.cell()[0] > 2) return "l'arpione porta all'isolotto";
      T.fresh({ sword: true, swim: true }); Game.s.flags.keyPoolHint = true; T.tp('l:2,1', 2, 5); T.noEnemies();
      for (let i = 0; i < 300 && T17.cell()[0] < 9; i++) R.frame(['right']);
      R.openChestAt(10, 4); T.skip();
      return Game.s.keys === 1 ? true : 'chiavi: ' + Game.s.keys;
    });
    check('Porta del Pozzo: si apre con la chiavetta; la Serpe è lì e le porte si chiudono', () => {
      T.fresh({ sword: true, hookshot: true, swim: true }); Game.s.keys = 1; Game.s.flags.serpentIntro = true; T.tp('l:1,1', 7, 2); T.noEnemies();
      R.pushThrough('up', 'l:1,0'); T.skip();
      if (Game.roomId !== 'l:1,0' || !(Game.boss instanceof Serpent)) return 'niente serpe';
      return Game.tiles[10][7] === 'W' && Game.s.keys === 0 ? true : 'porte aperte o chiave non usata';
    });
    check('Serpe: spada mentre è in acqua = si rituffa; arpione = trascinata a riva e indifesa; sconfitta = cuore, niente cristallo', () => {
      T.fresh({ sword: true, hookshot: true, swim: true }); Game.s.flags.serpentIntro = true; T.tp('l:1,0', 2, 4); T.skip();
      const b = Game.boss; T.run([], 5); b.spots = b.computeSpots();
      b.spot = [3, 4]; b.placeAt(b.spot); b.hidden = false; b.state = 'up'; b.timer = 200;
      b.inv = 0; b.hurt(Game, 1); if (b.state !== 'dive' || b.hp !== b.maxHp - 1) return 'spada: ' + b.state + ' ' + b.hp;
      b.placeAt(b.spot); b.hidden = false; b.state = 'up'; b.timer = 200; Game.projectiles = [];
      Game.player.x = 2 * TS - 3 + 3; Game.player.y = 4 * TS - 6; Game.player.dir = 3; Game.s.equip = 'hookshot';
      T.press('item', 30);
      if (b.state !== 'beached') return 'arpione: ' + b.state;
      if (Math.floor((b.x + 12) / TS) !== 2) return 'non a riva: ' + Math.floor((b.x + 12) / TS);
      b.hp = 1; b.inv = 0; b.hurt(Game, 1);
      for (let i = 0; i < 200 && !Game.s.flags.serpent; i++) { T.run([], 1); T.skip(); }
      const ok = Game.s.flags.serpent && Game.pickups.some(p => p.kind === 'container') && !Game.entities.some(e => e instanceof Crystal || (e.def && e.def.id === 'ortensio')) && Game.tiles[10][7] === 'P';
      return ok ? true : 'dopo la sconfitta qualcosa non va';
    });
    check('Segreti a nuoto: isolotto del Lago Specchio e laghetto della Radura', () => {
      T.fresh({ sword: true, swim: true }); T.tp('o:0,2', 13, 7); T.noEnemies();
      for (let i = 0, px = -1; i < 200 && Game.player.x !== px; i++) { px = Game.player.x; R.frame(['left']); }   // nuota fino al forziere
      Game.player.dir = 2; R.tap('action', 5); T.skip();
      if (!Game.s.flags['chest:c_lakeswim']) return 'isolotto del lago';
      T.tp('o:2,0', 4, 3); T.noEnemies();
      for (let i = 0, px = -1; i < 200 && Game.player.x !== px; i++) { px = Game.player.x; R.frame(['right']); }
      Game.player.dir = 3; R.tap('action', 5); T.skip();
      return Game.s.flags['chest:c_pond'] ? true : 'laghetto della radura: ' + T17.cell();
    });
    check("Diario e Albo d'oro conoscono il Santuario", () => {
      Medals.data = { got: {}, wins: 0, best: null };
      T.fresh({ bombs: true }); Game.visited.add('o:0,2'); Game.s.flags.serpent = true; T.tp('o:1,2', 7, 6); T.run([], 40);
      return Game.knownQuests().some(q => q.name === 'Il Santuario Sommerso') && Medals.has('serpe') ? true : 'manca qualcosa';
    });
    check('Stress: 1500 frame di input casuale in ogni stanza del Santuario, con il nuoto', () => {
      T.fresh({ sword: true, bombs: true, hookshot: true, swim: true }); Game.s.bombs = 20;
      const keys = ['up', 'down', 'left', 'right', 'action', 'item', 'swap'];
      for (const id of Object.keys(ROOMS).filter(i => i.startsWith('l:'))) {
        T.tp(id, 7, 8);
        for (let i = 0; i < 1500; i++) {
          Game.s.hp = Game.s.maxHp; Game.dialog = null; if (Game.state !== 'play') { Game.state = 'play'; Game.fade = null; Game.scroll = null; }
          if (i % 9 === 0) Input.pressed.add(keys[(Math.random() * keys.length) | 0]);
          Input.down.clear(); Input.down.add(keys[(i >> 5) % 4]); Game.update(); Game.render(); Input.endFrame();
          if (Game.roomId !== id) T.tp(id, 7, 8);
        }
      }
      return true;
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T17 = T17;
