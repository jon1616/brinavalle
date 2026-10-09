'use strict';
/* =====================================================================
 *  TEST DEL CICLO 34 (Agente B) — Capitolo IV «La Stella Caduta» (regione m:, la Costa):
 *  la barca di Pino, la marea, le schegge, il Faro, il cratere, il granchio.   T34.suite()  (con ?test)
 * ===================================================================== */
const T34 = {
  COAST: ['m:1,0', 'm:1,1', 'm:0,1', 'm:2,1', 'm:1,2', 'm:2,2'],
  post(extra) {
    T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true });
    Object.assign(Game.s.flags, { intro: true, victory: true, boss: true, hookReturned: true, fatherFreed: true, fatherHome: true, fatherGift: true, fatherHello: true,
      partyOn: true, partyToast: true, partyDone: true, northCall: true, northArrived: true, northBells: true, towerIn: true, towerLady: true, ladyTold: true,
      fatherRemembers: true, ch2Done: true, ch3Call: true, observatoryOpen: true, vesperVoice: true, ch3Done: true }, extra || {});
    Game.s.bombs = 10; T34.at(0.1);
  },
  at(p) { Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * p; },
  low(on) { Game.tideT = on ? 10 : TIDE_LOW + 10; applyTide(Game); },
  text() { const d = Game.dialog; return d ? [d.entry && d.entry.text, ...d.queue.map(e => typeof e === 'string' ? e : e && e.text)].filter(Boolean).join(' | ') : ''; },
  npc(id) { return Game.entities.find(e => e.def && e.def.id === id); },
  chest(id) { return Game.entities.find(e => e instanceof Chest && e.def.id === id); },
  reach(from, to) {   // BFS sulle tessere vive della stanza
    const prev = new Set([from.join()]), q = [from];
    while (q.length) { const [x, y] = q.shift(); if (x === to[0] && y === to[1]) return true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || prev.has(k) || TILE_SOLID.has(Game.tiles[ny][nx])) continue; prev.add(k); q.push([nx, ny]); } }
    return false;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Le stanze della Costa sono ben formate; nessun varco verso il nulla; i varchi combaciano (lingue di sabbia comprese)', () => {
      const bad = [], open = (id, x, y) => { const d = ROOMS[id], ch = d.tiles[y][x]; return (d.tide || []).some(([a, b]) => a === x && b === y) || !TILE_SOLID.has(ch); };
      for (const id of [...T34.COAST, 'i:capitaneria', 'i:osteria', 'i:faro']) { const t = ROOMS[id].tiles; if (t.length !== RH || t.some(r => r.length !== RW)) bad.push(id + ' misure'); }
      for (const id of T34.COAST) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nid = neighborId(id, dx, dy);
        for (let k = 0; k < (dx ? RH : RW); k++) {
          const x = dx ? (dx > 0 ? RW - 1 : 0) : k, y = dx ? k : (dy > 0 ? RH - 1 : 0);
          if (!open(id, x, y) || TILE_WARP.has(ROOMS[id].tiles[y][x])) continue;
          if (!nid) { bad.push(id + ' varco verso il nulla @' + x + ',' + y); continue; }
          const nx = dx ? (dx > 0 ? 0 : RW - 1) : k, ny = dx ? k : (dy > 0 ? 0 : RH - 1);
          if (!open(nid, nx, ny)) bad.push(id + '→' + nid + ' @' + k);
        }
      }
      return bad.length ? bad.slice(0, 5).join(' | ') : true;
    });
    check('Pino apre il Capitolo IV solo dopo il III; la sua barca porta al mare e riporta al lago', () => {
      T34.post({ ch3Done: false }); T.tp('o:0,2', 12, 3); const pino = T34.npc('pino');
      const early = pino.def.talk(Game).join(' '); if (/MARISA/.test(early)) return 'capitolo IV aperto troppo presto';
      Game.s.flags.ch3Done = true; Game.say(pino.def.talk(Game)); const t = T34.text(); T.skip();
      T.tp('o:0,2', 6, 9); T.noEnemies(); Game.dialog = null; const boat = Game.tiles[8][6] === 'z';
      T.run(['up'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1); T.skip(); const there = Game.roomId;
      T.noEnemies(); Game.player.dir = 1; T.run(['up'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1);
      return /MARISA/.test(t) && Game.s.flags.ch4Call && boat && there === 'm:1,0' && Game.roomId === 'o:0,2' ? true : [boat, there, Game.roomId, t.slice(0, 40)].join(' / ');
    });
    check('Ogni luogo della Costa è raggiungibile dal villaggio (grafo del Segnavia, con le lingue di sabbia)', () => {
      T34.post({ ch4Call: true }); T.tp('o:1,2', 7, 6);
      const miss = [...T34.COAST, 'i:capitaneria', 'i:osteria', 'i:faro'].filter(id => !wayPath(Game, 'o:1,2', id));
      T.tp('m:1,2', 7, 1); const live = Game.tiles.map(r => r.join('')).join('');   // il Segnavia non tocca le tessere vive
      wayPath(Game, 'm:1,2', 'm:2,2'); const still = Game.tiles.map(r => r.join('')).join('') === live;
      return miss.length || !still ? miss.join(', ') + (still ? '' : ' (tessere vive modificate!)') : true;
    });
    check('La marea: a marea bassa le lingue di sabbia sono sabbia, a marea alta acqua; e cambia da sola col tempo', () => {
      T34.post({ ch4Call: true }); T.tp('m:1,2', 7, 1); T.noEnemies(); Game.dialog = null;
      T34.low(true); const lowSand = Game.tiles[3][7] === '.' && Game.tiles[5][15] === '.';
      T34.low(false); const highWater = Game.tiles[3][7] === '~';
      Game.tideT = TIDE_T - 2; T.run([], 5); const backLow = Game.tideLow() && Game.tiles[3][7] === '.';
      Game.render(); const px = bctx.getImageData(7 * TS + 8, HUD_H + 3 * TS + 8, 1, 1).data;   // si VEDE la sabbia (non l'acqua animata rimasta dall'ingresso)
      const sandy = px[0] > 180 && px[2] < 190;
      return lowSand && highWater && backLow && sandy ? true : 'bassa ' + lowSand + ' alta ' + highWater + ' ciclo ' + backLow + ' pixel ' + [...px].slice(0, 3);
    });
    check('Chi resta sulla sabbia quando l\'acqua torna viene travolto (perde un mezzo cuore); chi nuota no', () => {
      T34.post({ ch4Call: true }); T.tp('m:1,2', 7, 1); T.noEnemies(); Game.dialog = null;
      T34.low(true); Game.player.x = 7 * TS; Game.player.y = 4 * TS - 6; Game.player.safe = { x: 7 * TS, y: 2 * TS - 6 };
      const hp0 = Game.s.hp; T34.low(false); for (let i = 0; i < 60; i++) T.run([], 1);
      const swept = Game.s.hp === hp0 - 1 && Math.floor(Game.player.cy() / TS) <= 2;
      Game.s.items.swim = true; T34.low(true); Game.player.x = 7 * TS; Game.player.y = 4 * TS - 6; const hp1 = Game.s.hp; T34.low(false); T.run([], 30);
      return swept && Game.s.hp === hp1 ? true : 'travolto ' + swept + ' (hp ' + hp0 + '→' + Game.s.hp + ')';
    });
    check('Secche: la scheggia si raggiunge solo a marea bassa', () => {
      T34.post({ ch4Call: true }); T.tp('m:1,2', 7, 1); Game.dialog = null;
      T34.low(false); const high = T34.reach([7, 2], [3, 6]); T34.low(true); const low = T34.reach([7, 2], [3, 6]);
      return !high && low ? true : 'alta ' + high + ' bassa ' + low;
    });
    check('Scogliera: con l\'arpione vero dalla riva all\'isolotto, la scheggia, e ritorno', () => {
      T34.post({ ch4Call: true, marisaHello: true }); R.god = true; T.tp('m:0,1', 6, 3); T.noEnemies(); Game.dialog = null; Game.s.equip = 'hookshot';
      R.faceTo(1, 0); R.tap('item', 1); for (let i = 0; i < 90 && Game.player.hook; i++) R.frame([]);
      const on = Math.floor(Game.player.cx() / TS) >= 11;
      R.walkTo(12, 2); R.faceTo(1, 0); R.tap('action', 2); T.skip(); const got = !!Game.s.flags['chest:m_shard_faro'];
      R.walkTo(11, 2); R.faceTo(-1, 0); Game.s.equip = 'hookshot'; R.tap('item', 1); for (let i = 0; i < 90 && Game.player.hook; i++) R.frame([]);
      const back = Math.floor(Game.player.cx() / TS) <= 7; R.god = god;
      return on && got && back ? true : 'isolotto ' + on + ' scheggia ' + got + ' ritorno ' + back + ' @' + T.where();
    });
    check('Spiaggia: la scheggia compare solo sconfitti tutti i granchi', () => {
      T34.post({ ch4Call: true }); T.tp('m:2,1', 1, 5); Game.dialog = null;
      const a = !!T34.chest('m_shard_spiaggia'); for (const e of Game.entities) if (e.enemy) e.dead = true; T.run([], 10);
      return !a && T34.chest('m_shard_spiaggia') ? true : 'prima ' + a;
    });
    check('Marisa e Ugo: con tre schegge il Faro si riaccende (+50 gemme, medaglia)', () => {
      T34.post({ ch4Call: true }); T.tp('i:capitaneria', 7, 7); Game.say(T34.npc('marisa').def.talk(Game)); const ma = T34.text(); T.skip();
      T.tp('i:faro', 7, 7); const ugo = T34.npc('ugo'); Game.say(ugo.def.talk(Game)); T.skip();
      Game.say(ugo.def.talk(Game)); const one = T34.text(); T.skip();
      for (const s of COAST_SHARDS) Game.s.flags['chest:' + s.id] = true; const g0 = Game.s.gems;
      Game.say(ugo.def.talk(Game)); const lit = T34.text(); T.skip();
      const m = MEDALS.find(x => x.id === 'faro');
      return /SCOGLIERA/.test(ma) && /tre/.test(one) && /BRILLA DI NUOVO/.test(lit) && Game.s.flags.farolit && Game.s.gems - g0 === 50 && m.got(Game) ? true : [ma.slice(0, 30), one.slice(0, 40), Game.s.flags.farolit, Game.s.gems - g0].join(' / ');
    });
    check('Il cratere: si apre solo di notte e col Faro acceso; il passaggio esiste solo col prossimo capitolo', () => {
      const fo0 = ROOMS[STAR_ROOM]; delete ROOMS[STAR_ROOM];   /* Ciclo 35 (Agente A): ora la Fossa esiste; il caso «senza» si prova togliendola per un attimo */ T34.post({ ch4Call: true, farolit: false }); T34.at(0.74); T.tp('m:2,2', 1, 5); T.noEnemies(); Game.dialog = null; T.run([], 3);
      const noFaro = !Game.s.flags.craterOpen; Game.s.flags.farolit = true; T34.at(0.2); T.run([], 3); const day = !Game.s.flags.craterOpen;
      T34.at(0.74); T.run([], 3); const night = !!Game.s.flags.craterOpen; T.skip();
      const sealed = Game.tiles[4][7] !== 'Z' && !Game.room.warps['7,4']; if (fo0) ROOMS[STAR_ROOM] = fo0;
      const had = ROOMS[STAR_ROOM]; if (!had) ROOMS[STAR_ROOM] = { name: 'prova', ground: 'dungeon', tiles: ROOMS['r:1,2'].tiles.slice() };
      T.tp('m:2,2', 1, 5); Game.dialog = null; const open = Game.tiles[4][7] === 'Z' && Game.room.warps['7,4'].to === STAR_ROOM;
      if (!had) delete ROOMS[STAR_ROOM];
      return noFaro && day && night && sealed && open ? true : [noFaro, day, night, sealed, open].join(' / ');
    });
    check('Granchio: scatta di lato verso Lio e pizzica con la chela (oltre il guscio)', () => {
      T34.post({ ch4Call: true }); T.tp('m:2,1', 3, 5); T.noEnemies(); Game.dialog = null;
      const c = new Crab(8 * TS, 5 * TS - 4); c.st = 1; Game.entities.push(c); const x0 = c.x;
      let ran = false; for (let i = 0; i < 40; i++) { T.run([], 1); if (c.state === 'run') ran = true; }
      const moved = c.x < x0;
      Game.player.x = c.x + 18; Game.player.y = c.y; Game.player.hurtT = 0; const hp0 = Game.s.hp; c.state = 'wait'; c.st = 99; c.snap = 0; T.run([], 3);
      return ran && moved && Game.s.hp < hp0 && bestKey(c) === 'crab' ? true : 'scatto ' + ran + ' verso Lio ' + moved + ' pizzico ' + (hp0 - Game.s.hp);
    });
    check('Obiettivo e Segnavia seguono il Capitolo IV', () => {
      T34.post(); T.tp('o:1,2', 7, 6); const out = [objectiveRoom(Game)];
      const step = x => { Object.assign(Game.s.flags, x); out.push(objectiveRoom(Game)); };
      step({ ch4Call: true }); step({ coastIn: true }); step({ marisaHello: true }); step({ 'chest:m_shard_faro': true }); step({ 'chest:m_shard_spiaggia': true }); step({ 'chest:m_shard_secche': true }); step({ farolit: true });
      return out.join(',') === 'o:0,2,m:1,0,i:capitaneria,m:0,1,m:2,1,m:1,2,i:faro,m:2,2' && /NOTTE/.test(currentObjective(Game)) ? true : out.join(',') + ' / ' + currentObjective(Game);
    });
    check('Diario: la pagina del Capitolo IV; gli altri elenchi restano intatti', () => {
      T34.post({ ch4Call: true }); T.tp('m:1,1', 7, 6); Game.dialog = null;
      const keep = [CHAPTERS, CHAPTERS2, CHAPTERS3].map(l => l.map(c => c.name).join('|'));
      let seen = null; const t0 = window.txt; window.txt = function (s) { if (/Una stella manca/.test(s)) seen = s; return t0.apply(this, arguments); };
      try { Game.state = 'pause'; Game.pausePage = 1; Game.render(); } finally { window.txt = t0; Game.state = 'title'; }
      const same = [CHAPTERS, CHAPTERS2, CHAPTERS3].map(l => l.map(c => c.name).join('|')).join('#') === keep.join('#');
      return seen && same ? true : 'visto ' + seen + ' intatti ' + same;
    });
    check('Tutte le stanze della Costa si disegnano (giorno e notte, faro spento e acceso, marea alta e bassa); mappa «COSTA»', () => {
      T34.post({ ch4Call: true });
      for (const lit of [false, true]) for (const p of [0.2, 0.74]) { Game.s.flags.farolit = lit; T34.at(p);
        for (const id of [...T34.COAST, 'i:capitaneria', 'i:osteria', 'i:faro']) { T.tp(id, 7, 6); Game.dialog = null; for (const lo of [true, false]) { if (Game.room.tide) T34.low(lo); Game.render(); } Game.visited.add(id); } }
      T.tp('m:1,1', 7, 6); Game.dialog = null; Game.state = 'pause'; Game.pausePage = 0; Game.render(); const pre = Game.mapPrefix(); Game.state = 'title';
      return pre === 'm:' ? true : pre;
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T34 = T34;
