'use strict';
/* =====================================================================
 *  CICLO 35 — test della Fossa senza fondo.   T35.suite()  (con ?test)
 *  T35.duel({ diff })  il bot affronta Umbra con input veri (Lume compreso) -> { vinta, frame, vita }
 *  T35.climb()         il bot attraversa la Fossa dall'ingresso al Cuore dell'Abisso
 * ===================================================================== */
const T35 = {
  post() {
    T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true, diapason: true });
    Object.assign(Game.s.flags, { victory: true, boss: true, ch3Done: true, ch4Call: true, coastIn: true, marisaHello: true, ugoHello: true,
      'chest:m_shard_faro': true, 'chest:m_shard_spiaggia': true, 'chest:m_shard_secche': true, farolit: true, craterOpen: true });
    Game.s.bombs = 10;
  },
  /* lancia il Lume (se è in mano) verso dir, oppure lo richiama */
  lume(dir) {
    Game.s.equip = 'starlamp';
    if (dir !== undefined) R.faceTo(...dir);
    for (let i = 0; i < 6; i++) {
      const L = lumeOf(Game), before = L && L.state;
      Input.pressed.add('item'); R.frame([]);
      const now = lumeOf(Game) && lumeOf(Game).state;
      if (now !== before) break; R.wait(8);
    }
    for (let i = 0; i < 40 && lumeOf(Game) && (lumeOf(Game).state === 'fly' || lumeOf(Game).state === 'back'); i++) R.frame([]);
  },
  recall() { const L = lumeOf(Game); if (L && L.state !== 'held') T35.lume(); },
  duelStep() {
    const g = Game, p = g.player, b = g.boss, keys = [], L = lumeOf(g);
    const go = (x, y) => { const dx = x - p.cx(), dy = y - p.cy(); if (Math.abs(dx) > 3) keys.push(dx > 0 ? 'right' : 'left'); if (Math.abs(dy) > 3) keys.push(dy > 0 ? 'down' : 'up'); };
    g.s.equip = 'starlamp';
    // un vortice vicino: vai al punto più lontano da tutti i vortici aperti (prima oscillava sul bordo del vortice)
    const pend0 = b ? b.tents.filter(tn => tn.t > 0) : [];
    const hot = pend0.some(tn => Math.hypot(tn.x - p.cx(), tn.y - p.cy()) < 16 && tn.t < 30);   // sta per esplodere proprio qui
    const chance = b && b.state === 'idle' && !b.guarding && lumeOf(g) && lumeOf(g).state === 'held';   // occhi gialli e Lume in mano: è il momento di lanciare
    if (pend0.some(tn => Math.hypot(tn.x - p.cx(), tn.y - p.cy()) < 30) && (hot || !chance)) {
      let best = null, bd = -1;
      for (const [sx, sy] of [[128, 130], [72, 130], [184, 130], [72, 96], [184, 96], [128, 150], [40, 150], [216, 150]]) { const d = Math.min(...pend0.map(tn => Math.hypot(tn.x - sx, tn.y - sy))); if (d > bd) { bd = d; best = [sx, sy]; } }
      go(best[0], best[1]); return keys;
    }
    if (b && b.state === 'blind') {
      const tx = b.headX(), ty = b.headY() + 26;
      const sb = { x: p.x + 1, y: p.y - 8, w: 14, h: 13 };   // la spada verso l'alto
      if (overlap(sb, b.box()) || Math.hypot(tx - p.cx(), ty - p.cy()) < 6) { p.dir = 1; if (!p.attackT) Input.pressed.add('action'); return keys; }
      go(tx, ty); return keys;
    }
    if (b && b.state === 'idle' && L && L.state === 'held' && !b.guarding) {
      const tx = b.headX(), ty = b.headY() + 46;
      if (Math.hypot(tx - p.cx(), ty - p.cy()) < 5) { p.dir = 1; Input.pressed.add('item'); return keys; }
      go(tx, ty); return keys;
    }
    if (L && L.state === 'placed' && b && b.state === 'idle' && (L.ink > 0 || Math.hypot(L.x - b.headX(), L.y - b.headY()) >= LUME_R)) { Input.pressed.add('item'); return keys; }   // lancio sbagliato: richiamalo
    // in attesa: il punto più lontano dai vortici ancora aperti (prima tornava proprio dentro il vortice che aveva appena schivato)
    const pend = b ? b.tents.filter(tn => tn.t > 0) : [];
    const spots = [[128, 130], [72, 130], [184, 130], [72, 96], [184, 96], [128, 150]];
    let best = spots[0], bd = -1;
    for (const [sx, sy] of spots) { const d = pend.length ? Math.min(...pend.map(tn => Math.hypot(tn.x - sx, tn.y - sy))) : 99; if (d > bd + 0.1) { bd = d; best = [sx, sy]; } if (!pend.length) break; }
    go(best[0], best[1]); return keys;
  },
  duel(o) {
    o = Object.assign({ diff: 1, god: false, max: 12000 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = o.god;
    try {
      T35.post(); Object.assign(Game.s.flags, { fIn: true, 'chest:f_pearl_vetro': true, 'chest:f_pearl_marea': true, 'chest:f_pearl_ombra': true });
      Game.s.items.starlamp = true; Game.s.items.potion = false; Game.s.maxHp = Game.s.hp = 14;
      T.tp('f:1,0', 7, 8); T.skip();
      let f = 0;
      for (; f < o.max && !Game.s.flags.fUmbra && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); continue; }
        const keys = T35.duelStep();
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (R.god) Game.s.hp = Game.s.maxHp;
      }
      return { vinta: !!Game.s.flags.fUmbra, frame: f, vita: Game.s.hp + '/' + Game.s.maxHp };
    } finally { Opts.diff = keep; R.god = god; T.skip(); Game.state = 'title'; Game.ch4CardIn = 0; }
  },
  waitLowTide() { for (let i = 0; i < TIDE_T * 2 && !(Game.tideLow() && Game.tideT % TIDE_T < 30); i++) R.frame([]); },
  climb() {
    const log = [], step = s => log.push(s);
    T35.post(); T.tp('m:2,2', 7, 5); T.skip();
    R.walkTo(7, 5); T.run(['up'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1); T.skip();
    if (Game.roomId !== 'f:1,2') return 'ingresso: ' + Game.roomId;
    step('discesa');
    R.walkTo(1, 5); R.pushThrough('left', 'f:0,2'); T.skip();
    R.walkTo(2, 5); R.walkTo(7, 5); R.faceTo(1, 0); Input.pressed.add('action'); T.run([], 5); T.skip();
    if (!Game.s.items.starlamp) return 'lume non preso (' + log.join(' → ') + ') ' + T.where();
    step('lume');
    R.walkTo(14, 5); R.pushThrough('right', 'f:1,2'); T.skip();
    R.walkTo(14, 5); R.pushThrough('right', 'f:2,2'); T.skip();
    R.walkTo(2, 5); T35.lume([1, 0]); R.walkTo(6, 5); T35.recall();
    T35.lume([0, -1]); R.walkTo(6, 2); R.walkTo(8, 2); T35.recall(); T35.lume([1, 0]); R.walkTo(12, 2);
    R.faceTo(1, 0); Input.pressed.add('action'); T.run([], 5); T.skip();
    if (!Game.s.flags['chest:f_pearl_vetro']) return 'perla del vetro (' + log.join(' → ') + ') ' + T.where();
    // il ritorno, un lancio alla volta: un solo lancio da (12,2) non arriva a illuminare (6,2)
    T35.recall(); T35.lume([-1, 0]); R.walkTo(8, 2); T35.recall(); T35.lume([-1, 0]); R.walkTo(6, 2); T35.recall(); T35.lume([0, 1]); R.walkTo(6, 5); T35.recall(); T35.lume([-1, 0]); R.walkTo(2, 5); T35.recall();
    R.walkTo(1, 5); R.pushThrough('left', 'f:1,2'); T.skip();
    step('vetro');
    R.walkTo(7, 3); T35.lume([0, -1]); T.run([], 40);
    if (!Game.s.flags['shadow:f_discesa']) return 'muro della discesa (' + log.join(' → ') + ')';
    T35.recall(); R.walkTo(7, 1); R.pushThrough('up', 'f:1,1'); T.skip();
    step('foresta');
    R.walkTo(1, 5); R.pushThrough('left', 'f:0,1'); T.skip();
    R.walkTo(14, 5); T35.waitLowTide(); R.walkTo(3, 5); R.faceTo(-1, 0); Input.pressed.add('action'); T.run([], 5); T.skip();
    if (!Game.s.flags['chest:f_pearl_marea']) return 'perla della marea (' + log.join(' → ') + ') ' + T.where();
    T35.waitLowTide(); R.walkTo(14, 5); R.pushThrough('right', 'f:1,1'); T.skip();
    step('marea');
    R.walkTo(14, 5); R.pushThrough('right', 'f:2,1'); T.skip();
    for (const wx of [4, 8, 12]) { R.walkTo(wx - 2, 5); T35.lume([1, 0]); T.run([], 40); T35.recall(); }
    if (!['f_lab1', 'f_lab2', 'f_lab3'].every(id => Game.s.flags['shadow:' + id])) return 'muri del labirinto (' + log.join(' → ') + ')';
    R.walkTo(13, 5); R.faceTo(1, 0); Input.pressed.add('action'); T.run([], 5); T.skip();
    if (!Game.s.flags['chest:f_pearl_ombra']) return "perla dell'ombra (" + log.join(' → ') + ') ' + T.where();
    T.skip(); R.walkTo(1, 5); R.pushThrough('left', 'f:1,1'); T.skip();
    step('ombra');
    R.walkTo(7, 1); R.pushThrough('up', 'f:1,0'); T.skip();
    if (Game.roomId !== 'f:1,0' || !Game.boss) return 'cuore non raggiunto: ' + Game.roomId;
    step('cuore');
    return log.join(' → ');
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check('Il cratere porta nella Discesa; la scala riporta sull\'isola', () => {
      T35.post(); T.tp('m:2,2', 7, 5); if (Game.tiles[4][7] !== 'Z') return 'cratere chiuso';
      R.walkTo(7, 5); T.run(['up'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (Game.roomId !== 'f:1,2' || !Game.dialog) return 'ingresso: ' + Game.roomId;
      T.skip(); T.run(['down'], 60); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      return Game.roomId === 'm:2,2' ? true : 'uscita: ' + Game.roomId;
    });
    check('Il Lume: si lancia fino a 3 caselle, si ferma ai muri, torna in mano; fuori dalla Fossa non si lancia', () => {
      T35.post(); Game.s.items.starlamp = true; T.tp('f:1,2', 7, 5); T.skip();
      const L = lumeOf(Game); if (!L || L.state !== 'held') return 'non in mano';
      const x0 = Game.player.cx(); T35.lume([1, 0]); if (L.state !== 'placed' || Math.abs(L.x - (x0 + LUME_THROW)) > 6) return 'lancio: ' + L.state + ' ' + Math.round(L.x - x0);
      T35.lume(); if (L.state !== 'held') return 'non torna';
      Game.player.x = 1 * TS; T35.lume([-1, 0]); if (L.x < 0) return 'oltre il muro';
      T35.recall(); T.tp('m:1,1', 7, 6); Game.s.equip = 'starlamp'; Input.pressed.add('item'); T.run([], 3);
      return !lumeOf(Game) && Game.banner && /luce/.test(Game.banner.text) ? true : 'fuori si lancia';
    });
    check('Ponte di vetro: esiste solo alla luce; chi mette il piede su vetro al buio cade', () => {
      T35.post(); Game.s.items.starlamp = true; T.tp('f:2,2', 2, 5); T.skip();
      if (Game.tiles[5][3] !== '_') return 'vetro visibile al buio';
      T35.lume([1, 0]); if (Game.tiles[5][3] !== 'P' || Game.tiles[5][6] !== 'P') return 'vetro non acceso';
      T35.recall(); if (Game.tiles[5][4] !== '_') return 'resta acceso senza luce';
      const hp = Game.s.hp; T.run(['right'], 40); return Game.player.fallT > 0 || Game.s.hp < hp ? true : 'non cade';
    });
    check("Muro d'ombra: il Lume lanciato lo dissolve, per sempre", () => {
      T35.post(); Game.s.items.starlamp = true; T.tp('f:1,2', 7, 3); T.skip();
      if (!Game.entities.some(e => e instanceof ShadowWall)) return 'muro assente';
      T35.lume([0, -1]); T.run([], 40); if (!Game.s.flags['shadow:f_discesa']) return 'non dissolto';
      T.tp('f:1,2', 7, 3); return Game.entities.some(e => e instanceof ShadowWall) ? 'ricompare' : true;
    });
    check("Ombra: al buio la spada la attraversa; alla luce si rannicchia e cade in due colpi", () => {
      T35.post(); Game.s.items.starlamp = true; T.tp('f:1,1', 7, 8); T.skip(); T.noEnemies();
      const o = makeEnemy({ type: 'ombra', x: 7, y: 3 }); Game.entities.push(o); T.run([], 2);
      o.hurt(Game, 2, 0); if (o.hp !== 2) return 'colpita al buio';
      const L = lumeOf(Game); L.state = 'placed'; L.x = o.cx(); L.y = o.cy(); T.run([], 2);
      if (!o.lit) return 'non illuminata'; const x0 = o.x; T.run([], 20); if (o.x !== x0) return 'si muove alla luce';
      o.inv = 0; o.hurt(Game, 1, 0); o.inv = 0; o.hurt(Game, 1, 0);
      return o.dead ? true : 'viva';
    });
    check('Grotta della Marea: la perla si raggiunge a piedi solo con la marea bassa', () => {
      T35.post(); Game.s.items.starlamp = true; T.tp('f:0,1', 14, 5); T.skip(); T.noEnemies();
      Game.tideT = TIDE_LOW + 30; T.run([], 2); if (R.path([3, 5])) return 'percorso a marea alta';
      Game.tideT = 0; T.run([], 2); if (!R.path([3, 5])) return 'nessun percorso a marea bassa';
      R.walkTo(3, 5); R.faceTo(-1, 0); Input.pressed.add('action'); T.run([], 5); T.skip();
      return Game.s.flags['chest:f_pearl_marea'] ? true : 'perla non presa ' + T.where();
    });
    check('Tre perle aprono la Porta delle Perle, con un avviso', () => {
      T35.post(); Game.s.items.starlamp = true; T.tp('f:1,1', 7, 8); T.skip();
      if (Game.tiles[0][7] !== 'J') return 'porta aperta senza perle';
      Object.assign(Game.s.flags, { 'chest:f_pearl_vetro': true, 'chest:f_pearl_marea': true, 'chest:f_pearl_ombra': true });
      Game.applyItem('pearl'); T.run([], 3);   // come quando si apre il terzo forziere
      const note = Game.dialog && /porta rotonda/.test(Game.dialog.entry.text + JSON.stringify(Game.dialog.queue)); T.skip();
      T.tp('f:1,1', 7, 8); return note && Game.tiles[0][7] === 'P' ? true : 'avviso ' + note + ' porta ' + Game.tiles[0][7];
    });
    check('Umbra: il Lume vicino agli occhi la acceca; accecata prende tre colpi, poi scaccia la luce', () => {
      T35.post(); Game.s.items.starlamp = true; Game.s.flags.fIn = true; T.tp('f:1,0', 7, 8); T.skip(); T.run([], 100);
      const b = Game.boss; if (!b || b.state !== 'idle') return 'stato ' + (b && b.state);
      b.hurt(Game); if (b.hp !== b.maxHp) return 'colpita senza luce';
      const L = lumeOf(Game); b.t = 150; b.calm = 0; L.state = 'placed'; L.x = b.headX(); L.y = b.headY() + 20; T.run([], 2);   // occhi gialli
      if (b.state !== 'blind') return 'non accecata';
      b.state = 'idle'; b.t = 10; L.state = 'placed'; L.x = b.headX(); L.y = b.headY() + 20; T.run([], 2);   // occhi rossi: scaccia la luce
      if (b.state === 'blind' || L.state !== 'back') return 'con gli occhi rossi si acceca lo stesso';
      for (let i = 0; i < 40 && L.state !== 'held'; i++) T.run([], 1);
      b.t = 150; L.state = 'placed'; L.x = b.headX(); L.y = b.headY() + 20; T.run([], 2); if (b.state !== 'blind') return 'non riaccecata';
      for (let i = 0; i < 3; i++) { b.inv = 0; b.hurt(Game); }
      return b.hp === b.maxHp - 3 && b.state === 'idle' && L.state === 'back' ? true : 'hp ' + b.hp + ' ' + b.state + ' lume ' + L.state;
    });
    check('Sconfitta: porte, cuore, Bestiario, Vespero torna in cielo, cartello del Capitolo IV, ritorno sull\'isola', () => {
      T35.post(); Game.s.items.starlamp = true; Object.assign(Game.s.flags, { fIn: true, 'chest:f_pearl_vetro': true, 'chest:f_pearl_marea': true, 'chest:f_pearl_ombra': true });
      T.tp('f:1,0', 7, 8); T.skip(); T.run([], 100);
      const b = Game.boss; b.state = 'blind'; b.timer = 100; b.hp = 1; b.inv = 0; b.hurt(Game);
      for (let i = 0; i < 220 && !Game.s.flags.fUmbra; i++) T.run([], 1);
      if (!Game.s.flags.fUmbra) return 'non sconfitta';
      if (Game.tiles[10][7] !== 'P' || !Game.pickups.some(p => p.kind === 'container') || !(Game.s.bestiary || {}).umbra) return 'porte/cuore/bestiario';
      if (!/Vespero/.test(JSON.stringify(Game.dialog && Game.dialog.queue))) return 'Vespero non parla';
      T.skip(); if (!Game.s.flags.starFreed) return 'stella non liberata';
      for (let i = 0; i < 120 && Game.state !== 'chapter4'; i++) T.run([], 1);
      if (Game.state !== 'chapter4') return 'niente cartello';
      T.run([], 130); Input.pressed.add('action'); T.run([], 2); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (!Game.s.flags.ch4Done || Game.roomId !== 'm:2,2') return 'cartello/ritorno: ' + Game.roomId;
      if (CHAPTERS4.length > 9) return 'diario oltre 9';
      return CHAPTERS4.every(c => c.done(Game)) ? true : 'capitoli: ' + CHAPTERS4.filter(c => !c.done(Game)).map(c => c.name);
    });
    check('Obiettivo e Segnavia seguono la Fossa', () => {
      T35.post(); const seq = [[{}, 'f:1,2'], [{ fIn: true }, 'f:0,2'], [{ _l: true }, 'f:2,2'], [{ 'chest:f_pearl_vetro': true }, 'f:0,1'], [{ 'chest:f_pearl_marea': true }, 'f:2,1'], [{ 'chest:f_pearl_ombra': true }, 'f:1,0'], [{ starFreed: true }, null]];
      for (const [fl, want] of seq) {
        if (fl._l) Game.s.items.starlamp = true; else Object.assign(Game.s.flags, fl);
        const r = objectiveRoom(Game); if (r !== want) return 'atteso ' + want + ', trovato ' + r;
        if (!currentObjective(Game)) return 'obiettivo vuoto';
      }
      return true;
    });
    check('Il bot attraversa la Fossa con input veri, dal cratere al Cuore dell\'Abisso', () => {
      const r = T35.climb(); T35.climbLog = r; return /cuore$/.test(r) ? true : r;
    });
    check('Tutte le sale si disegnano senza errori; mappa FOSSA; inventario al massimo 10 voci', () => {
      T35.post(); Game.s.items.starlamp = true;
      for (const id of Object.keys(ROOMS).filter(i => i.startsWith('f:'))) { T.tp(id, 7, 8); T.skip(); for (let i = 0; i < 10; i++) { Game.update(); Game.render(); Input.endFrame(); } T.skip(); }
      Game.state = 'pause'; Game.pausePage = 0; Game.render(); const pre = Game.mapPrefix(); Game.state = 'play';
      const inv = INVENTORY.filter(([k]) => !(k === 'bigkey' && Game.s.flags.boss)).length;
      return pre === 'f:' && inv <= 12 ? true : 'mappa ' + pre + ' inventario ' + inv;   // Ciclo 37: fino a 12 voci (6 colonne)
    });
    R.god = false;
    check('Duello onesto (niente vita infinita): il bot batte Umbra almeno una volta su 3 a Normale', () => {
      const r = []; for (let i = 0; i < 3; i++) { const x = T35.duel({ diff: 1 }); r.push(x); if (x.vinta) { T35.duelLog = JSON.stringify(r); return true; } }
      return JSON.stringify(r);
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.boss = null; Game.ch4CardIn = 0;
    console.table(res);
    return res;
  },
};
window.T35 = T35;
