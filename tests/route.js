'use strict';
/* =====================================================================
 *  BOT DEL PERCORSO CRITICO (Ciclo 3) — si carica con  index.html?test
 *  T.route()  gioca dalla NUOVA PARTITA ai TITOLI DI CODA con input reali
 *  (tasti simulati frame per frame), camminando con un pathfinding a tile.
 *
 *  Cosa è reale: movimento, porte, scorrimento tra stanze, warp, tagli con la
 *  spada, enigma dei blocchi (spinte vere), Lago Ghiacciato (scivolate vere,
 *  pianificate da un risolutore BFS), bombe sulle macerie, chiavi e porte,
 *  Arpione nell'Abisso, Arpione che strappa la corazza del boss.
 *  Semplificazioni DICHIARATE: vita infinita (il bot non schiva) e i
 *  combattimenti a "sconfiggi tutti" / Golem / boss risolti con danni diretti.
 *  Serve a dimostrare che il gioco è COMPLETABILE senza blocchi di progressione.
 * ===================================================================== */
const R = {
  log: [], frames: 0,
  god: true,      // Ciclo 7: con god=false il bot gioca SENZA vita infinita (vedi T7 in tests/honest.js)
  revives: 0,
  note(m) { R.log.push('[' + String(R.frames).padStart(6) + '] ' + Game.roomId + ': ' + m); },
  fail(m) { throw new Error(Game.roomId + ' ' + T.where() + ' — ' + m); },

  frame(keys) {
    Input.down.clear(); for (const k of keys || []) Input.down.add(k);
    Game.update(); Input.endFrame(); R.frames++;
    if (R.god) Game.s.hp = Game.s.maxHp;              // vita infinita (dichiarato)
    if (Game.dialog) T.skip();
    if (Game.state === 'gameover') {
      if (R.god) R.fail('game over');
      // come un giocatore che sceglie "Riprova": cuori pieni (qui sul posto) e una caduta in più
      R.revives++; Game.s.deaths = (Game.s.deaths || 0) + 1; R.note('SCONFITTO: riprova n. ' + R.revives);
      Game.state = 'play'; Game.s.hp = Game.s.maxHp; Game.player.hurtT = 120; Game.projectiles = [];
      if (R.revives > 40) R.fail('troppe sconfitte');
    }
  },
  wait(n) { for (let i = 0; i < n; i++) R.frame([]); },
  settle() { for (let i = 0; i < 200 && Game.state !== 'play'; i++) R.frame([]); if (Game.dialog) T.skip(); },
  tap(k, n) { Input.pressed.add(k); R.frame([]); R.wait(n || 0); },
  cell() { const p = Game.player; return [Math.floor(p.cx() / TS), Math.floor(p.cy() / TS)]; },
  blockedByEntity(tx, ty) {
    const r = { x: tx * TS + 2, y: ty * TS + 2, w: 12, h: 12 };
    return Game.entities.some(e => !e.dead && e.solid && overlap(r, e.box()));
  },
  cost(tx, ty, goal) {
    const t = tileAt(tx, ty);
    if (t === null) return Infinity;
    const isGoal = goal && tx === goal[0] && ty === goal[1];
    if ((t === 'B' || t === 'V') && Game.s.items.sword) return 4;   // si taglia
    if (TILE_SOLID.has(t) || t === '_' || t === 'q') return Infinity;
    if (TILE_WARP.has(t) && !isGoal) return Infinity;
    if (R.blockedByEntity(tx, ty)) return Infinity;
    return 1;
  },
  /* Dijkstra su griglia 16x11: ritorna la sequenza di celle fino a goal */
  path(goal) {
    const [sx, sy] = R.cell(), key = (x, y) => y * RW + x;
    const dist = new Map([[key(sx, sy), 0]]), prev = new Map(), open = [[0, sx, sy]];
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [d, x, y] = open.shift();
      if (x === goal[0] && y === goal[1]) break;
      if (d > dist.get(key(x, y))) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, c = R.cost(nx, ny, goal);
        if (c === Infinity) continue;
        const nd = d + c, k = key(nx, ny);
        if (nd < (dist.has(k) ? dist.get(k) : Infinity)) { dist.set(k, nd); prev.set(k, [x, y]); open.push([nd, nx, ny]); }
      }
    }
    if (!dist.has(key(goal[0], goal[1]))) return null;
    const out = []; let cur = goal;
    while (cur[0] !== sx || cur[1] !== sy) { out.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
    return out;
  },
  /* cammina verso il centro della cella (tx,ty) */
  diag() {   // stato utile quando il bot si blocca
    const p = Game.player;
    return JSON.stringify({ keys: [...Input.down], att: p.attackT, ch: p.charge, spin: p.spinT, slide: p.slide, hook: !!p.hook, kb: [p.kbx, p.kby], hurt: p.hurtT,
      path: (R.path([7, 8]) || []).slice(0, 3), near: Game.entities.filter(e => Math.hypot(e.cx() - p.cx(), e.cy() - p.cy()) < 30).map(e => e.constructor.name) });
  },
  /* se sei finito sul ghiaccio (spinto da un colpo), scivola fino al primo terreno normale */
  escapeIce() {
    if (!Game.player.onIce() || Game.player.slide) return;
    const [cx, cy] = R.cell();
    for (let d = 0; d < 4; d++) {
      const [ex, ey] = R.slideSim(cx, cy, d);
      if (tileAt(ex, ey) !== 'q' && (ex !== cx || ey !== cy)) { R.doSlides([d]); return; }
    }
  },
  walkTo(tx, ty, max) {
    const room = Game.roomId;
    R.escapeIce();
    let lastPos = '', still = 0;
    for (let i = 0; i < (max || 3000); i++) {
      if (Game.roomId !== room || Game.state !== 'play') return;
      const p = Game.player, [cx, cy] = R.cell();
      const gx = tx * TS + 8, gy = ty * TS + 8;
      if (cx === tx && cy === ty && Math.abs(p.cx() - gx) < 2.5 && Math.abs(p.cy() - gy) < 2.5) return;
      if (!R.god && R.defend()) continue;
      let nx = tx, ny = ty;
      if (cx !== tx || cy !== ty) {
        const pth = R.path([tx, ty]);
        if (!pth) R.fail('nessun percorso verso ' + tx + ',' + ty);
        [nx, ny] = pth[0];
        const t = tileAt(nx, ny);
        if (t === 'B' || t === 'V') { R.faceTo(nx - cx, ny - cy); R.tap('action', 16); continue; }
      }
      const tgx = nx * TS + 8, tgy = ny * TS + 8, keys = [];
      // prima allineati sull'asse perpendicolare, poi muoviti
      if (nx !== cx) { if (Math.abs(p.cy() - tgy) > 2) keys.push(p.cy() < tgy ? 'down' : 'up'); else keys.push(p.cx() < tgx ? 'right' : 'left'); }
      else if (ny !== cy) { if (Math.abs(p.cx() - tgx) > 2) keys.push(p.cx() < tgx ? 'right' : 'left'); else keys.push(p.cy() < tgy ? 'down' : 'up'); }
      else { if (Math.abs(p.cx() - tgx) >= 2.5) keys.push(p.cx() < tgx ? 'right' : 'left'); else keys.push(p.cy() < tgy ? 'down' : 'up'); }
      R.frame(keys);
      const pos = Math.round(p.x) + ',' + Math.round(p.y);
      if (pos === lastPos) { if (++still > 90) R.fail('bloccato verso ' + tx + ',' + ty + ' ' + R.diag()); } else { still = 0; lastPos = pos; }
    }
    R.fail('timeout verso ' + tx + ',' + ty);
  },
  faceTo(dx, dy) {
    const d = dy > 0 ? 0 : dy < 0 ? 1 : dx < 0 ? 2 : 3;
    Game.player.dir = d;   // (equivale a sfiorare la direzione senza spostarsi)
  },
  /* tieni premuto un tasto finché la stanza non cambia */
  pushThrough(key, toRoom, max) {
    for (let i = 0; i < (max || 240); i++) {
      if (Game.roomId === toRoom && Game.state === 'play') return R.settle();
      R.frame(Game.state === 'play' ? [key] : []);
    }
    if (Game.roomId !== toRoom) R.fail('non sono arrivato in ' + toRoom);
    R.settle();
  },
  /* esce dal bordo: dir = 'N','S','E','W' */
  exit(dir, toRoom) {
    R.escapeIce();
    const edge = [];
    for (let i = 0; i < RW; i++) for (let j = 0; j < RH; j++) {
      const onEdge = (dir === 'N' && j === 0) || (dir === 'S' && j === RH - 1) || (dir === 'W' && i === 0) || (dir === 'E' && i === RW - 1);
      if (onEdge && R.cost(i, j) < Infinity) edge.push([i, j]);
    }
    let best = null, bl = Infinity;
    for (const e of edge) { const p = R.path(e); if (p && p.length < bl) { bl = p.length; best = e; } }
    if (!best) R.fail('nessuna uscita ' + dir);
    R.walkTo(best[0], best[1]);
    R.pushThrough({ N: 'up', S: 'down', W: 'left', E: 'right' }[dir], toRoom);
    R.note('-> ' + toRoom);
  },
  warp(tx, ty, toRoom) {
    const p = R.path([tx, ty]);
    if (!p) R.fail('warp irraggiungibile');
    const before = p.length > 1 ? p[p.length - 2] : R.cell();
    R.walkTo(before[0], before[1]);
    const key = ty > before[1] ? 'down' : ty < before[1] ? 'up' : tx < before[0] ? 'left' : 'right';
    R.pushThrough(key, toRoom);
    R.note('-> ' + toRoom + ' (warp)');
  },
  openChestAt(tx, ty) {
    const opts = [[tx, ty + 1, 1], [tx - 1, ty, 3], [tx + 1, ty, 2], [tx, ty - 1, 0]];
    for (const [x, y, d] of opts) {
      if (R.cost(x, y) === Infinity || !R.path([x, y]) && !(R.cell()[0] === x && R.cell()[1] === y)) continue;
      R.walkTo(x, y); Game.player.dir = d; R.tap('action', 6);
      return;
    }
    R.fail('forziere irraggiungibile ' + tx + ',' + ty);
  },
  killAll() {   // semplificazione dichiarata (solo con god=true); senza vita infinita si combatte davvero
    if (!R.god) return R.fight();
    for (const e of Game.entities) if (e.enemy && !e.dead && !e.ignoreClear) { e.inv = 0; e.hp = 1; e.hurt(Game, 1, 0); }
    R.wait(10);
  },
  /* ---------------- Ciclo 7: combattimento vero ---------------- */
  safeKeys(keys) {   // non camminare mai dentro un abisso o in acqua
    const p = Game.player;
    return keys.filter(k => {
      const v = DIRS.find(d => d.name === k);
      const t = tileAt(Math.floor((p.cx() + v.x * 7) / TS), Math.floor((p.cy() + v.y * 7) / TS));
      return t !== '_' && t !== '~' && t !== 'q';   // niente abissi, acqua o ghiaccio in combattimento
    });
  },
  dodge() {
    const p = Game.player;
    let threat = null, td = 34;
    for (const q of Game.projectiles) {
      if (!q.vx && !q.vy) continue;
      const dx = p.cx() - (q.x + 3), dy = p.cy() - (q.y + 3), d = Math.hypot(dx, dy);
      if (d < td && dx * q.vx + dy * q.vy > 0) { td = d; threat = { q, dx, dy }; }
    }
    if (!threat) return null;
    const { q, dx, dy } = threat, sg = Math.sign(dx * q.vy - dy * q.vx) || 1;
    const [tx, ty] = T5.clampPt(p.cx() - q.vy * sg * 30, p.cy() + q.vx * sg * 30);
    return T5.keysToward(p, tx, ty, 1);
  },
  fightStep(foes) {
    const p = Game.player;
    const dk = R.dodge(); if (dk) return R.safeKeys(dk);
    for (const b of Game.entities) if (b instanceof BladeTrap && b.state === 'idle') {   // non allinearti alle lame
      if (Math.abs(b.cy() - p.cy()) < 10 && Math.abs(b.cx() - p.cx()) < 120) return R.safeKeys([p.cy() > 88 ? 'up' : 'down']);
      if (Math.abs(b.cx() - p.cx()) < 10 && Math.abs(b.cy() - p.cy()) < 120) return R.safeKeys([p.cx() > 128 ? 'left' : 'right']);
    }
    let e = null, ed = 1e9;
    for (const f of foes) { const d = Math.hypot(f.cx() - p.cx(), f.cy() - p.cy()); if (d < ed) { ed = d; e = f; } }
    const dx = e.cx() - p.cx(), dy = e.cy() - p.cy();
    if (ed < 21 && (Math.abs(dx) < 11 || Math.abs(dy) < 11)) {
      p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
      if (p.attackT === 0 && !p.charge) Input.pressed.add('action');
      return [];
    }
    const horiz = Math.abs(dx) > Math.abs(dy);
    const tx = horiz ? e.cx() - Math.sign(dx) * 15 : e.cx(), ty = horiz ? e.cy() : e.cy() - Math.sign(dy) * 15;
    return R.safeKeys(T5.keysToward(p, tx, ty));
  },
  fight(max) {
    const room = Game.roomId;
    for (let f = 0; f < (max || 5400); f++) {
      if (Game.roomId !== room) return;
      const foes = Game.entities.filter(e => e.enemy && !e.dead && !e.ignoreClear);
      if (!foes.length) { R.wait(20); return; }
      R.frame(Game.state === 'play' && !Game.dialog ? R.fightStep(foes) : []);
    }
    R.fail('combattimento troppo lungo');
  },
  /* mentre cammina: se un nemico è addosso, girati e colpisci */
  defend() {
    const p = Game.player;
    if (p.attackT > 0) return false;
    // Ciclo 9: non più di 5 fendenti difensivi ogni 150 frame (un pipistrello fermo e disallineato bloccava il bot)
    R.defends = (R.defends || []).filter(f => R.frames - f < 150);
    if (R.defends.length >= 5) return false;
    for (const e of Game.entities) {
      if (!e.enemy || e.dead || e.ignoreClear || e === Game.boss) continue;
      const dx = e.cx() - p.cx(), dy = e.cy() - p.cy();
      if (Math.hypot(dx, dy) < 20 && (Math.abs(dx) < 11 || Math.abs(dy) < 11)) {
        p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
        R.defends.push(R.frames); Input.pressed.add('action'); R.frame([]); return true;
      }
    }
    return false;
  },
  beatGolem() {
    const gol = Game.boss; if (!gol) R.fail('niente golem');
    if (R.god) {
      gol.state = 'walk'; gol.stagger(Game); gol.hp = 1; gol.inv = 0; gol.hurt(Game, 1);
      for (let i = 0; i < 200 && !Game.s.flags.golem; i++) R.frame([]);
    } else {
      const st = {};
      for (let i = 0; i < 12000 && !Game.s.flags.golem; i++) R.frame(Game.state === 'play' && !Game.dialog ? T6.golemStep(st) : []);
      if (!Game.s.flags.golem) R.fail('golem imbattuto');
      R.note('GOLEM sconfitto in combattimento vero');
    }
    R.settle(); R.wait(20);
    const heart = Game.pickups.find(pk => pk.kind === 'container');   // il Cuore di Cristallo lasciato dal golem
    if (heart && !R.god) { R.walkTo(Math.floor(heart.x / TS), Math.floor(heart.y / TS)); R.wait(10); }
  },
  beatBoss(b) {
    if (R.god) {
      R.wait(100); b.hp = 1; b.inv = 0; b.hurt(Game, 1);
      for (let i = 0; i < 220 && b.phase !== 2; i++) R.frame([]);
      R.settle(); R.note('fase 2: FORMA SPINATA');
      for (let tries = 0; tries < 30 && b.armored; tries++) {
        b.state = 'move'; b.timer = 999; b.tx = b.x; b.ty = b.y; Game.projectiles = [];
        R.walkTo(Math.round((b.cx() - 8) / TS), 8); Game.player.dir = 1; Game.s.equip = 'hookshot'; R.tap('item', 30);
      }
      if (b.armored) R.fail('arpione non ha strappato la corazza'); R.note('corazza STRAPPATA con l\'arpione');
      b.hp = 1; b.inv = 0; b.hurt(Game, 1);
      for (let i = 0; i < 260 && !Game.s.flags.boss; i++) R.frame([]);
    } else {
      const st = { retreat: 0 };
      for (let i = 0; i < 20000 && !Game.s.flags.boss; i++) R.frame(Game.state === 'play' && !Game.dialog ? T5.step(st) : []);
      if (!Game.s.flags.boss) R.fail('Re dei Rovi imbattuto');
      R.note('RE DEI ROVI sconfitto in combattimento vero (due fasi)');
    }
  },

  /* ----- Lago Ghiacciato: risolutore BFS sulle scivolate, poi esecuzione reale ----- */
  slideSim(x, y, d) {
    const v = DIRS[d];
    for (let k = 0; k < 40; k++) {
      const nx = x + v.x, ny = y + v.y, t = tileAt(nx, ny);
      if (t === null || TILE_SOLID.has(t) || R.blockedByEntity(nx, ny)) break;
      x = nx; y = ny;
      if (tileAt(x, y) !== 'q') break;
    }
    return [x, y];
  },
  solveIce(goals) {
    const start = R.cell(), k = c => c[0] + ',' + c[1], seen = new Map([[k(start), null]]), q = [start];
    while (q.length) {
      const c = q.shift();
      if (goals.some(g => g[0] === c[0] && g[1] === c[1])) {
        const moves = []; let cur = k(c);
        while (seen.get(cur)) { const [pk, d] = seen.get(cur); moves.unshift(d); cur = pk; }
        return moves;
      }
      for (let d = 0; d < 4; d++) {
        const n = R.slideSim(c[0], c[1], d);
        if (!seen.has(k(n))) { seen.set(k(n), [k(c), d]); q.push(n); }
      }
    }
    return null;
  },
  doSlides(moves) {
    for (const d of moves) {
      const key = DIRS[d].name, from = R.cell().join(',');
      // tieni premuto finché non hai cambiato cella E (se sei sul ghiaccio) la scivolata è partita
      for (let i = 0; i < 60 && (R.cell().join(',') === from || (Game.player.onIce() && !Game.player.slide)); i++) R.frame([key]);
      for (let i = 0; i < 200 && Game.player.slide; i++) R.frame([]);
      R.wait(4);
    }
  },
  /* spinge un blocco: stai dalla parte opposta e tieni premuto */
  push(block, d, times) {
    const v = DIRS[d];
    for (let n = 0; n < times; n++) {
      R.walkTo(block.tx - v.x, block.ty - v.y);
      const from = block.tx + ',' + block.ty;
      for (let tries = 0; tries < 3 && block.tx + ',' + block.ty === from; tries++) {
        R.walkTo(block.tx - v.x, block.ty - v.y);
        for (let i = 0; i < 80 && block.tx + ',' + block.ty === from; i++) R.frame([v.name]);
        for (let i = 0; i < 30 && block.mv; i++) R.frame([]);
      }
      if (block.tx + ',' + block.ty === from) R.fail('il blocco non si muove');
    }
  },

  run() {
    R.log = []; R.frames = 0; R.revives = 0;
    const bak = localStorage.getItem(SAVE_KEY);
    try {
      Game.newGame(); R.settle(); R.wait(5); T.skip();
      R.note('nuova partita');
      R.warp(7, 9, 'o:1,2');
      R.exit('N', 'o:1,1'); R.exit('W', 'o:0,1');
      R.warp(7, 3, 'i:shrine');
      R.openChestAt(7, 4);
      if (!Game.s.items.sword) R.fail('niente spada'); R.note('SPADA presa');
      R.warp(7, 9, 'o:0,1'); R.exit('E', 'o:1,1'); R.exit('N', 'o:1,0');
      R.walkTo(7, 6); Game.player.dir = 1; R.tap('action', 20); R.settle();
      if (!Game.s.flags.collapse) R.fail('nessun crollo'); R.note('rovi tagliati, CROLLO');

      // ---- Grotta di Brina ----
      R.exit('S', 'o:1,1'); R.exit('E', 'o:2,1'); R.exit('S', 'o:2,2');
      R.warp(12, 2, 'c:1,2');
      R.exit('N', 'c:1,1'); R.killAll();
      const blocks = Game.entities.filter(e => e instanceof Block).sort((a, b) => a.tx - b.tx);
      R.push(blocks[0], 0, 4); R.push(blocks[0], 3, 1);
      R.push(blocks[1], 0, 4); R.push(blocks[1], 2, 1);
      R.wait(20);
      if (!Game.s.flags['solved:c:1,1']) R.fail('enigma dei blocchi non risolto'); R.note('enigma dei BLOCCHI risolto');
      R.exit('W', 'c:0,1');
      let mv = R.solveIce([[2, 1], [1, 2], [2, 2]]);
      if (!mv) R.fail('lago irrisolvibile'); R.note('lago: ' + mv.length + ' scivolate');
      R.doSlides(mv);
      R.openChestAt(1, 1); if (Game.s.keys < 1) R.fail('niente chiavetta della grotta');
      mv = R.solveIce([[14, 5], [14, 6]]); if (!mv) R.fail('niente ritorno dal lago');
      R.doSlides(mv);
      R.exit('E', 'c:1,1');
      R.walkTo(14, 5); R.pushThrough('right', 'c:2,1'); R.note('porta chiusa aperta');
      R.killAll(); R.settle();
      if (!Game.s.flags['cleared:c:2,1']) R.fail('Sala delle Lame non ripulita');
      R.exit('W', 'c:1,1'); R.exit('N', 'c:1,0'); R.settle();
      R.beatGolem();
      R.openChestAt(7, 3); if (!Game.s.items.bombs) R.fail('niente bombe'); R.note('BOMBE prese');
      R.exit('S', 'c:1,1'); R.exit('S', 'c:1,2'); R.warp(7, 9, 'o:2,2');

      // ---- macerie ----
      R.exit('W', 'o:1,2'); R.exit('N', 'o:1,1'); R.exit('N', 'o:1,0');
      R.walkTo(7, 5); Game.player.dir = 1; Game.s.equip = 'bombs'; R.tap('item', 2);
      R.walkTo(7, 8); R.wait(130); R.settle();
      if (!RUBBLE.every(([x, y]) => Game.tiles[y][x] !== 'Q')) R.fail('macerie ancora lì'); R.note('MACERIE fatte saltare');
      R.warp(7, 3, 'd:1,2');

      // ---- Rovine ----
      R.exit('N', 'd:1,1'); R.exit('W', 'd:0,1');
      R.openChestAt(1, 9); if (Game.s.keys < 1) R.fail('niente chiavetta delle rovine');
      R.exit('E', 'd:1,1');
      R.walkTo(14, 5); R.pushThrough('right', 'd:2,1'); R.note('porta chiusa aperta');
      R.killAll(); R.settle(); R.wait(10);
      R.openChestAt(7, 5); if (!Game.s.items.hookshot) R.fail('niente arpione'); R.note('ARPIONE preso');
      R.exit('N', 'd:2,0');
      R.killAll();   // combattimento semplificato: niente pipistrelli che ci spingono nel vuoto
      R.walkTo(7, 8); Game.player.dir = 1; R.tap('item', 40);
      if (R.cell().join(',') !== '7,5') R.fail('isolotto mancato');
      R.walkTo(6, 5); Game.player.dir = 2; R.tap('item', 45);
      if (R.cell()[0] !== 2) R.fail('sponda ovest mancata');
      R.openChestAt(8, 1); if (!Game.s.items.bigkey) R.fail('niente Chiave del Re'); R.note('CHIAVE DEL RE presa');
      R.walkTo(13, 2); Game.player.dir = 0; R.tap('item', 50);
      if (R.cell()[1] !== 8) R.fail('ritorno dall\'abisso fallito');
      R.exit('S', 'd:2,1'); R.exit('W', 'd:1,1');
      R.walkTo(7, 1); R.pushThrough('up', 'd:1,0'); R.note('porta del boss aperta');

      // ---- Boss ----
      const b = Game.boss; if (!(b instanceof ThornKing)) R.fail('boss mancante');
      R.beatBoss(b);
      R.settle(); R.note('Re dei Rovi sconfitto, Ortensio redento');
      const cr = Game.entities.find(e => e instanceof Crystal);
      if (!cr) R.fail('niente cristallo');
      R.walkTo(Math.floor((cr.x + 6) / TS), Math.floor((cr.y + 10) / TS));
      for (let i = 0; i < 120 && Game.state === 'play'; i++) R.frame([]);
      if (Game.state !== 'ending') R.fail('niente finale');
      R.note('FINALE');
      for (let i = 0; i < ENDING_DONE + 20; i++) Game.update();
      Input.pressed.add('action'); Game.update(); Input.endFrame(); R.settle();
      if (!Game.s.flags.victory || Game.roomId !== 'o:1,2') R.fail('ritorno al villaggio fallito');
      R.note('VITTORIA: di nuovo a Brinavalle, all\'alba');
      return { ok: true, frames: R.frames, minuti: (R.frames / 3600).toFixed(1), log: R.log };
    } catch (e) {
      return { ok: false, errore: e.message, log: R.log };
    } finally {
      if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    }
  },
};
T.route = () => R.run();
window.R = R;
