'use strict';
/* =====================================================================
 *  TEST DEL CICLO 30 (Agente B) — Capitolo II «La Nebbia Grigia» (regione n:)
 *  e le due correzioni trovate giocando a mano.   T30.suite()  (con ?test)
 * ===================================================================== */
const T30 = {
  NORTH: ['n:1,2', 'n:1,1', 'n:0,1', 'n:2,1', 'n:2,0', 'n:1,0'],
  /* dopo la festa, con tutto l'equipaggiamento del post-gioco */
  post(extra) {
    T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true });
    Object.assign(Game.s.flags, { intro: true, victory: true, boss: true, fatherFreed: true, fatherHome: true, fatherGift: true, fatherHello: true, partyOn: true, partyToast: true, partyDone: true }, extra || {});
    Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * 0.2; Game.s.bombs = 10;
  },
  text() { const d = Game.dialog; return d ? [d.entry && d.entry.text, ...d.queue.map(e => typeof e === 'string' ? e : e && e.text)].filter(Boolean).join(' | ') : ''; },
  npc(id) { return Game.entities.find(e => e.def && e.def.id === id); },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, way = Opts.way, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Le stanze del Nord sono ben formate (16x11) e i varchi combaciano tra stanze vicine', () => {
      const bad = [];
      for (const id of [...T30.NORTH, 'i:campanile', 'i:locanda']) { const t = ROOMS[id].tiles; if (t.length !== RH || t.some(r => r.length !== RW)) bad.push(id + ' misure'); }
      for (const id of T30.NORTH) for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const nid = neighborId(id, dx, dy); if (!nid) continue;
        const a = ROOMS[id].tiles, b = ROOMS[nid].tiles;
        for (let k = 0; k < (dx ? RH : RW); k++) {
          const ca = dx ? a[k][RW - 1] : a[RH - 1][k], cb = dx ? b[k][0] : b[0][k];
          if (TILE_SOLID.has(ca) !== TILE_SOLID.has(cb)) bad.push(id + '→' + nid + ' @' + k + ' ' + ca + '/' + cb);
        }
      }
      return bad.length ? bad.slice(0, 5).join(' | ') : true;
    });
    check('Ilde arriva solo dopo la festa; parlarle apre la scala del Valico nella Radura', () => {
      T30.post({ partyDone: false }); T.tp('o:1,2', 7, 6); const before = !!T30.npc('ilde');
      T30.post(); T.tp('o:1,2', 7, 6); const ilde = T30.npc('ilde'); if (before || !ilde) return 'Ilde prima ' + before + ' dopo ' + !!ilde;
      T.tp('o:2,0', 7, 6); const noStair = Game.tiles[1][5] !== 'U';
      T.tp('o:1,2', 7, 6); Game.say(ilde.def.talk(Game)); const t = T30.text(); T.skip();
      T.tp('o:2,0', 7, 6);
      return noStair && /PIETRABIANCA/.test(t) && Game.s.flags.northCall && Game.tiles[1][5] === 'U' ? true : 'scala ' + Game.tiles[1][5] + ' testo ' + t.slice(0, 60);
    });
    check('La scala porta al Valico, e dal Valico si torna alla Radura', () => {
      T30.post({ northCall: true }); T.tp('o:2,0', 5, 2); T.noEnemies(); Game.dialog = null;
      T.run(['up'], 40); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1); T.skip();
      const up = Game.roomId; T.noEnemies(); T.run(['down'], 40); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1);
      return up === 'n:1,2' && Game.roomId === 'o:2,0' ? true : up + ' → ' + Game.roomId;
    });
    check('Da Brinavalle ogni stanza del Nord è raggiungibile (grafo del Segnavia)', () => {
      T30.post({ northCall: true }); T.tp('o:1,2', 7, 6);
      const miss = [...T30.NORTH, 'i:campanile', 'i:locanda'].filter(id => !wayPath(Game, 'o:1,2', id));
      return miss.length ? miss.join(', ') : true;
    });
    check('Nebbia: nel Nord, finché le campane tacciono, lontano da Lio non si vede; con la lanterna si vede più in là; poi si dirada', () => {
      // si misura sopra i pini (scuri): Lio in (11,6), un pino a 64 px (15,6) e uno a 176 px (0,6)
      const shot = (extra, items) => { T30.post(Object.assign({ northCall: true }, extra)); Object.assign(Game.s.items, items || {}); T.tp('n:1,1', 11, 6); T.noEnemies(); Game.dialog = null; FEEL.on = true; Game.t = 0; Game.render();   // stesso frame: i banchi di nebbia si muovono
        const at = tx => { const d = bctx.getImageData(tx * TS + 8, HUD_H + 6 * TS + 6, 1, 1).data; return d[0] + d[1] + d[2]; };
        return { mid: at(15), far: at(0) }; };
      const fog = shot({}), lamp = shot({}, { lantern: true }), clear = shot({ northBells: true });
      const pale = v => v > 480;   // coperto dalla nebbia
      return pale(fog.far) && pale(fog.mid) && lamp.mid < fog.mid - 60 && pale(lamp.far) && !pale(clear.far) && !pale(clear.mid) ? true : JSON.stringify({ fog, lamp, clear });
    });
    check('Lago Grigio: con l\'arpione dalla riva si arriva all\'isola, si prende la campanella e si torna', () => {
      T30.post({ northCall: true, northArrived: true, bellmanHello: true }); R.god = true;
      T.tp('n:0,1', 12, 5); T.noEnemies(); Game.dialog = null; Game.s.equip = 'hookshot';
      R.faceTo(-1, 0); R.tap('item', 1); for (let i = 0; i < 90 && Game.player.hook; i++) R.frame([]);
      const onIsland = Math.floor(Game.player.cx() / TS) <= 8;
      R.walkTo(5, 4); R.faceTo(0, 1); R.tap('action', 2); T.skip(); const got = !!Game.s.flags['chest:n_bell_lago'];
      R.walkTo(7, 6); R.faceTo(1, 0); Game.s.equip = 'hookshot'; R.tap('item', 1); for (let i = 0; i < 90 && Game.player.hook; i++) R.frame([]);
      const back = Math.floor(Game.player.cx() / TS) >= 11;
      return onIsland && got && back ? true : 'isola ' + onIsland + ' campanella ' + got + ' ritorno ' + back + ' @' + T.where();
    });
    check('Pineta: la campanella è chiusa dietro la roccia incrinata (serve una bomba)', () => {
      T30.post({ northCall: true }); T.tp('n:2,1', 1, 5); T.noEnemies();
      const reach = () => !!Game.wayTrail && (() => { const prev = new Set(['1,5']), q = [[1, 5]];
        while (q.length) { const [x, y] = q.shift(); if (x === 14 && y === 2) return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || prev.has(k) || TILE_SOLID.has(Game.tiles[ny][nx])) continue; prev.add(k); q.push([nx, ny]); } }
        return false; })();
      const a = reach(); Game.s.flags['bomb:n:2,1:14,3'] = true; T.tp('n:2,1', 1, 5); const b = reach();
      return !a && b ? true : 'prima ' + a + ' dopo ' + b;
    });
    check('Cima del Vento: la campanella compare solo sconfitti tutti i guardiani', () => {
      T30.post({ northCall: true }); T.tp('n:2,0', 7, 8); Game.dialog = null;
      const has = () => Game.entities.some(e => e instanceof Chest && e.def.id === 'n_bell_cima');
      const a = has(); for (const e of Game.entities) if (e.enemy) e.dead = true; T.run([], 10);
      return !a && has() && Game.s.flags['cleared:n:2,0'] ? true : 'prima ' + a + ' dopo ' + has();
    });
    check('Gualtiero: spiega, appende le campanelle una alla volta; con tre le campane suonano (+50 gemme, medaglia)', () => {
      T30.post({ northCall: true, northArrived: true }); T.tp('i:campanile', 7, 7); const gu = T30.npc('gualtiero');
      Game.say(gu.def.talk(Game)); const hello = T30.text(); T.skip();
      Game.s.flags['chest:n_bell_lago'] = true; Game.say(gu.def.talk(Game)); const one = T30.text(); T.skip();
      Game.s.flags['chest:n_bell_pineta'] = true; Game.s.flags['chest:n_bell_cima'] = true; const g0 = Game.s.gems;
      Game.say(gu.def.talk(Game)); const all = T30.text(); T.skip();
      const m = MEDALS.find(x => x.id === 'campane');
      return /SIGNORA DELLE NEBBIE/.test(hello) && /1\/3/.test(one) && /3\/3/.test(all) && Game.s.flags.northBells && Game.s.gems - g0 === 50 && m.got(Game) ? true
        : [hello.slice(0, 40), one.slice(0, 60), all.slice(0, 60), Game.s.flags.northBells, Game.s.gems - g0].join(' / ');
    });
    check('Il portone della Torre: chiuso (nemmeno la Chiave Grande lo apre); con le campane porta dentro appena la Torre esiste', () => {
      T30.post({ northCall: true }); T.tp('n:1,0', 7, 5); Game.dialog = null;
      const sealed = Game.tiles[2][7] === 'J';
      // Ciclo 31 (Agente A): ora la Torre esiste; il caso «senza Torre» si prova togliendola per un attimo
      const tw0 = ROOMS[TOWER_ROOM]; delete ROOMS[TOWER_ROOM];
      Game.s.flags.northBells = true; T.tp('n:1,0', 7, 5); Game.dialog = null; const stillNoTower = Game.tiles[2][7] === 'J';
      if (tw0) ROOMS[TOWER_ROOM] = tw0;
      const had = ROOMS[TOWER_ROOM]; if (!had) ROOMS[TOWER_ROOM] = { name: 'prova', ground: 'dungeon', tiles: ROOMS['r:1,2'].tiles.slice() };
      T.tp('n:1,0', 7, 5); Game.dialog = null; const open = Game.tiles[2][7] === 'Z' && Game.room.warps['7,2'].to === TOWER_ROOM;
      if (!had) delete ROOMS[TOWER_ROOM];
      return sealed && stillNoTower && open ? true : 'sigillato ' + sealed + ' senza Torre ' + stillNoTower + ' aperto ' + open;
    });
    check('Obiettivo e Segnavia seguono il capitolo: villaggio → campanile → campanelle → campanile', () => {
      T30.post(); T.tp('o:1,2', 7, 6); const out = [];
      const step = extra => { Object.assign(Game.s.flags, extra); out.push(objectiveRoom(Game)); };
      step({ northCall: true }); step({ northArrived: true }); step({ bellmanHello: true }); step({ 'chest:n_bell_lago': true }); step({ 'chest:n_bell_pineta': true }); step({ 'chest:n_bell_cima': true });
      const o = currentObjective(Game);
      return out.join(',') === 'n:1,1,i:campanile,n:0,1,n:2,1,n:2,0,i:campanile' && /Gualtiero/.test(o) ? true : out.join(',') + ' / ' + o;
    });
    check('Locanda: la zuppa di Rufo ridà tutti i cuori per 5 gemme', () => {
      T30.post({ northCall: true }); Game.s.gems = 20; Game.s.hp = 2; T.tp('i:locanda', 7, 7);
      const ru = T30.npc('rufo'), menu = ru.def.talk(Game)[0], z = menu.choices[0].fn(Game);
      Game.say(z); T.skip();
      return Game.s.hp === Game.s.maxHp && Game.s.gems === 15 ? true : 'cuori ' + Game.s.hp + ' gemme ' + Game.s.gems;
    });
    check('Tutte le stanze del Nord si disegnano (nebbia, neve, mappa in pausa «NORD») senza errori', () => {
      T30.post({ northCall: true });
      for (const id of [...T30.NORTH, 'i:campanile', 'i:locanda']) { T.tp(id, 7, 6); Game.dialog = null; Game.render(); Game.visited.add(id); }
      T.tp('n:1,1', 7, 6); Game.dialog = null; Game.state = 'pause'; Game.pausePage = 0; Game.render();
      const lab = Game.mapPrefix(); Game.state = 'title';
      return lab === 'n:' ? true : lab;
    });
    /* --- le due correzioni trovate giocando a mano (Ciclo 30) --- */
    check('Correzione: un colpo vicino al bordo non butta Lio nella stanza accanto (4 lati); poi camminando si esce', () => {
      const bad = [];
      for (const [room, x, y, sx, sy, key] of [['c:1,1', 7 * 16, PLAY_H - 16, 8, -10, 'down'], ['o:1,1', 7 * 16, PLAY_H - 16, 8, -10, 'down'], ['o:1,1', 2, 5 * 16, 18, 8, 'left'], ['o:1,1', 7 * 16, -4, 8, 22, 'up']]) {
        T.fresh({ sword: true }); T.tp(room, 7, 5); T.noEnemies(); const p = Game.player; p.x = x; p.y = y; p.hurtT = 0;
        p.hurt(Game, 1, p.cx() + sx - 8, p.cy() + sy); T.run([], 40);
        if (Game.roomId !== room) { bad.push(room + ' ' + key + ': spinto in ' + Game.roomId); continue; }
        T.run([key], 60); if (Game.roomId === room) bad.push(room + ' ' + key + ': non si esce più');
      }
      return bad.length ? bad.join(' | ') : true;
    });
    check('Correzione: i flag dei testi d\'ingresso si salvano (il «Continua» non ripete il testo della Grotta)', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { intro: true }); T.tp('o:2,2', 12, 4);
      Game.startWarp(ROOMS['o:2,2'].warps['12,2'], 'C'); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1);
      const shown = !!Game.dialog; T.skip();
      const sv = JSON.parse(localStorage.getItem(SAVE_KEY));
      return shown && sv.flags.caveEntered ? true : 'testo ' + shown + ' salvato ' + sv.flags.caveEntered;
    });
    R.god = god; Opts.way = way; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T30 = T30;
