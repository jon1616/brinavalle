'use strict';
/* =====================================================================
 *  TEST DEL CICLO 44 (Agente B) — RIFINITURA: le mie meccaniche ambientali
 *  provate da un «giocatore umano» (come T43 per i finali di Agente A):
 *  reagisce con 250 ms di ritardo (15 frame, ±4), cammina da tessera a tessera,
 *  aspetta prudente quando sente l'avviso. Si misura quanto spesso viene colpito.
 *    T44.suite()      — i controlli (soglie di equità)
 *    T44.table(n)     — n prove per scenario, a ogni difficoltà, con i numeri
 * ===================================================================== */
const T44 = {
  react() { return 15 + ((Math.random() * 9) | 0) - 4; },
  hits: 0, falls: 0,
  watch() {   // conta colpi e cadute
    T44.hits = 0; T44.falls = 0;
    const h0 = Player.prototype.hurt, f0 = Player.prototype.startFall;
    Player.prototype.hurt = function (g) { const b = g.s.hp; const r = h0.apply(this, arguments); if (g.s.hp < b) T44.hits++; return r; };
    Player.prototype.startFall = function () { T44.falls++; return f0.apply(this, arguments); };
    return () => { Player.prototype.hurt = h0; Player.prototype.startFall = f0; };
  },
  frame(keys) { Input.down.clear(); for (const k of keys || []) Input.down.add(k); Game.update(); Input.endFrame(); if (Game.dialog) T.skip(); if (Game.state === 'gameover') { Game.state = 'play'; Game.s.hp = Game.s.maxHp; } },
  wait(n) { for (let i = 0; i < n; i++) T44.frame([]); },
  cell() { const p = Game.player; return [Math.floor(p.cx() / TS), Math.floor((p.y + 12) / TS)]; },
  /* un passo verso la tessera (tx,ty) su un cammino che evita muri e voragini; true = arrivato */
  step(tx, ty) {
    const p = Game.player, [cx, cy] = T44.cell(), gx = tx * TS + 8, gy = ty * TS + 8;
    if (cx === tx && cy === ty && Math.abs(p.cx() - gx) < 3 && Math.abs(p.y + 12 - gy) < 3) { T44.frame([]); return true; }
    const free = (x, y) => { const ch = Game.tiles[y] && Game.tiles[y][x]; return ch && ch !== '_' && ch !== '~' && (!TILE_SOLID.has(ch) || ch === '='); };
    const K = (x, y) => y * RW + x, prev = new Map([[K(cx, cy), -1]]), q = [[cx, cy]];
    while (q.length) { const [x, y] = q.shift(); if (x === tx && y === ty) break; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || prev.has(K(nx, ny)) || !free(nx, ny)) continue; prev.set(K(nx, ny), K(x, y)); q.push([nx, ny]); } }
    let nx = tx, ny = ty;
    if (prev.has(K(tx, ty))) { let k = K(tx, ty); while (prev.get(k) !== K(cx, cy) && prev.get(k) !== -1) k = prev.get(k); nx = k % RW; ny = (k / RW) | 0; }
    if (cx === tx && cy === ty) { nx = tx; ny = ty; }
    const tgx = nx * TS + 8, tgy = ny * TS + 8, keys = [];
    if (Math.abs(p.cx() - tgx) > 2) keys.push(p.cx() < tgx ? 'right' : 'left');
    else if (Math.abs(p.y + 12 - tgy) > 2) keys.push(p.y + 12 < tgy ? 'down' : 'up');
    T44.frame(keys); return false;
  },
  go(tx, ty, max) { for (let i = 0; i < (max || 400); i++) if (T44.step(tx, ty)) return true; return false; },
  setup(room, x, y, extra) {
    T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true });
    Object.assign(Game.s.flags, { victory: true, intro: true }, extra || {});
    Game.s.maxHp = 20; Game.s.hp = 20; T.tp(room, x, y); T.noEnemies(); Game.dialog = null;
  },

  /* ---- gli scenari: ognuno ritorna { ok, hits, falls } ---- */
  ponte() {   // Ponte dei Refoli: dall'isola est all'isola ovest, fermandosi al palo
    T44.setup('h:0,1', 13, 5, { ch7Call: true }); Game.windT = (Math.random() * 300) | 0; const stop = T44.watch();
    try {
      const calmAgain = () => { while (Game.windNow().gust || Game.windNow().warn) T44.frame([]); T44.wait(T44.react()); };
      while (!Game.windNow().gust) T44.frame([]); calmAgain();                  // aspetta la fine di una raffica
      T44.go(7, 5);                                                                // corre al palo
      while (!Game.windNow().gust) T44.frame([]); calmAgain();                    // aspetta lì la raffica dopo
      const ok = T44.go(2, 5);
      return { ok: ok && T44.falls === 0, hits: T44.hits, falls: T44.falls };
    } finally { stop(); }
  },
  gola() {   // Gola dei Sibili: da ovest alla coda d'aquilone in fondo, di riparo in riparo
    T44.setup('h:2,1', 1, 5, { ch7Call: true }); Game.windT = 0;   // entrando il vento riparte da zero (come nel gioco) const stop = T44.watch();
    try {
      const shelter = [[2, 4], [9, 4], [12, 4], [14, 5]];
      for (const [x, y] of shelter) {
        // parte solo appena finita una raffica (o subito, la prima volta se è calmo)
        if (Game.windNow().gust || Game.windNow().warn) { while (Game.windNow().gust || Game.windNow().warn) T44.frame([]); T44.wait(T44.react()); }
        let t = 0; while (!T44.step(x, y) && t++ < 400) {
          const w = Game.windNow();   // se fischia a metà strada e il riparo è lontano, si ferma dov'è (prudente)
          if (w.warn && t > 10) { T44.wait(T44.react()); if (!Game.windShelter()) { while (!T44.step(...T44.cell())) {} } while (Game.windNow().gust || Game.windNow().warn) T44.frame([]); }
        }
      }
      return { ok: T44.falls === 0, hits: T44.hits, falls: T44.falls };
    } finally { stop(); }
  },
  terremoto() {   // Fenditura: 6 terremoti; quando l'ombra è sotto i piedi, dopo la reazione si sposta
    T44.setup('k:1,0', 7, 5, { ch6Call: true }); const stop = T44.watch();
    try {
      for (let q = 0; q < 6; q++) {
        Game.quakeT = QUAKE.period - 1; T44.frame([]);
        T44.wait(T44.react());
        const [cx, cy] = T44.cell(), danger = (x, y) => Game.rocks.some(r => Math.floor(r.x / TS) === x && Math.floor(r.y / TS) === y);
        const opts = [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2]].map(([dx, dy]) => [cx + dx, cy + dy]).filter(([x, y]) => x > 0 && y > 0 && x < RW - 1 && y < RH - 1 && !TILE_SOLID.has(Game.tiles[y][x]) && !danger(x, y));
        if (danger(cx, cy) && opts.length) T44.go(...opts[0], 40);
        T44.wait(60);
      }
      return { ok: T44.hits <= 1, hits: T44.hits, falls: T44.falls };
    } finally { stop(); }
  },
  onde() {   // Campo delle Onde: dal varco sud alla conchiglia in cima, di scoglio in scoglio (riparo = scoglio subito a SUD)
    T44.setup('s:2,1', 8, 9, { ch5Call: true }); Game.waveT = 0; const stop = T44.watch();   // entrando, il conteggio riparte da zero (come nel gioco)
    try {
      const isShelter = (x, y) => { const ch = Game.tiles[y] && Game.tiles[y][x], s = Game.tiles[y + 1] && Game.tiles[y + 1][x]; return ch && !TILE_SOLID.has(ch) && s && TILE_SOLID.has(s); };
      const nearest = () => { const [cx, cy] = T44.cell(); let best = null, bd = 99; for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) if (isShelter(x, y)) { const d = Math.abs(x - cx) + Math.abs(y - cy); if (d < bd) { bd = d; best = [x, y]; } } return bd <= 3 ? best : null; };
      const spots = [[8, 5], [11, 2], [7, 1]];
      for (const [x, y] of spots) {
        let t = 0, ducked = false;
        while (t++ < 600) {
          const fr = Game.waveFront();
          if (fr === 'warn' && !ducked) {   // fischio: dopo la reazione corre al riparo più vicino, se c'è
            T44.wait(T44.react()); ducked = true; const s = Game.waveShelter() ? null : nearest(); if (s) T44.go(s[0], s[1], 60);
            while (Game.waveFront() !== null) T44.frame([]); T44.wait(T44.react()); continue;
          }
          if (fr === null) ducked = false;
          if (T44.step(x, y)) break;
        }
      }
      return { ok: T44.hits <= 1, hits: T44.hits, falls: T44.falls };
    } finally { stop(); }
  },
  marea() {   // Secche: dalla riva alla scheggia sull'isolotto ovest e ritorno, a marea bassa
    T44.setup('m:1,2', 7, 1, { ch4Call: true }); Game.tideT = (Math.random() * TIDE_T) | 0; applyTide(Game); const stop = T44.watch();
    try {
      const lowStart = () => { while (Game.tideLow()) T44.frame([]); while (!Game.tideLow()) T44.frame([]); T44.wait(T44.react()); };
      lowStart(); T44.go(4, 6, 300);                // all'isolotto ovest
      lowStart(); const ok = T44.go(8, 2, 300);    // e ritorno a riva
      return { ok: ok && T44.falls === 0, hits: T44.hits, falls: T44.falls };
    } finally { stop(); }
  },
  table(n) {
    const out = [], d0 = Opts.diff;
    for (const sc of ['ponte', 'gola', 'terremoto', 'onde', 'marea']) for (const d of [0, 1, 2]) {
      Opts.diff = d; let ok = 0, hits = 0, falls = 0;
      for (let i = 0; i < (n || 5); i++) { const r = T44[sc](); if (r.ok) ok++; hits += r.hits; falls += r.falls; }
      out.push({ scenario: sc, difficolta: DIFF_NAMES[d], riuscite: ok + '/' + (n || 5), colpiMedi: (hits / (n || 5)).toFixed(1), caduteMedie: (falls / (n || 5)).toFixed(1) });
    }
    Opts.diff = d0; Game.state = 'title'; console.table(out); return out;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    const many = (sc, n, need) => { let ok = 0; const det = []; for (let i = 0; i < n; i++) { const r = T44[sc](); if (r.ok) ok++; det.push(r.hits + '/' + r.falls); } return ok >= need ? true : ok + '/' + n + ' (colpi/cadute: ' + det.join(' ') + ')'; };
    check('Ponte dei Refoli: un giocatore prudente (palo, 250 ms) attraversa senza cadere', () => many('ponte', 4, 4));
    check('Gola dei Sibili: di riparo in riparo arriva in fondo senza cadere nel buco', () => many('gola', 4, 4));
    check('Terremoti: chi si sposta quando vede l\'ombra sotto di sé non viene quasi mai colpito', () => many('terremoto', 4, 4));
    check('Onde lunghe: di scoglio in scoglio, al massimo un colpo', () => many('onde', 4, 4));
    check('Marea: aspettando la marea bassa, all\'isolotto e ritorno senza essere travolti', () => many('marea', 4, 4));
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T44 = T44;
