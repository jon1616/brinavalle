'use strict';
/* =====================================================================
 *  TEST DEL CICLO 36 (Agente B) — Capitolo V «La Città Sommersa» (regione s:):
 *  il mare ritirato, le onde lunghe, Guscetto, le conchiglie, il Tempio.   T36.suite()  (con ?test)
 * ===================================================================== */
const T36 = {
  SEA: ['s:1,0', 's:1,1', 's:0,1', 's:2,1', 's:2,2', 's:1,2'],
  post(extra) {
    T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true });
    Object.assign(Game.s.flags, { intro: true, victory: true, boss: true, hookReturned: true, fatherFreed: true, fatherHome: true, fatherGift: true, fatherHello: true,
      partyOn: true, partyToast: true, partyDone: true, northCall: true, northArrived: true, northBells: true, towerIn: true, towerLady: true, ladyTold: true,
      fatherRemembers: true, ch2Done: true, ch3Call: true, observatoryOpen: true, vesperVoice: true, ch3Done: true,
      ch4Call: true, coastIn: true, marisaHello: true, farolit: true, craterOpen: true, starFreed: true, ch4Done: true }, extra || {});
    Game.s.bombs = 10; Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * 0.1;
  },
  text() { const d = Game.dialog; return d ? [d.entry && d.entry.text, ...d.queue.map(e => typeof e === 'string' ? e : e && e.text)].filter(Boolean).join(' | ') : ''; },
  npc(id) { return Game.entities.find(e => e.def && e.def.id === id); },
  reach(from, to) {
    const prev = new Set([from.join()]), q = [from];
    while (q.length) { const [x, y] = q.shift(); if (x === to[0] && y === to[1]) return true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || prev.has(k) || TILE_SOLID.has(Game.tiles[ny][nx])) continue; prev.add(k); q.push([nx, ny]); } }
    return false;
  },
  /* porta il fronte dell'onda a poco sotto i piedi di Lio */
  waveAt() {
    const W = Game.room.waves, travel = Math.ceil((PLAY_H + 40) / W.speed), feet = Game.player.y + 12;
    const k = Math.floor((PLAY_H + 20 - feet - 8) / W.speed);
    Game.waveT = W.period - travel + k; Game.waveHit = -1;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, sfx = Sound.sfx, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } finally { Sound.sfx = sfx; } };
    check('Le stanze del Fondale sono ben formate; nessun varco verso il nulla; i varchi combaciano', () => {
      const bad = [];
      for (const id of T36.SEA) { const t = ROOMS[id].tiles; if (t.length !== RH || t.some(r => r.length !== RW)) bad.push(id + ' misure'); }
      for (const id of T36.SEA) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nid = neighborId(id, dx, dy), a = ROOMS[id].tiles;
        for (let k = 0; k < (dx ? RH : RW); k++) {
          const x = dx ? (dx > 0 ? RW - 1 : 0) : k, y = dx ? k : (dy > 0 ? RH - 1 : 0), ch = a[y][x];
          if (TILE_SOLID.has(ch) || TILE_WARP.has(ch)) continue;
          if (!nid) { bad.push(id + ' varco verso il nulla @' + x + ',' + y); continue; }
          const b = ROOMS[nid].tiles, nx = dx ? (dx > 0 ? 0 : RW - 1) : k, ny = dx ? k : (dy > 0 ? 0 : RH - 1);
          if (TILE_SOLID.has(b[ny][nx])) bad.push(id + '→' + nid + ' @' + k);
        }
      }
      return bad.length ? bad.slice(0, 5).join(' | ') : true;
    });
    check('Marisa apre il Capitolo V solo dopo il IV; le Secche restano a secco; la scala scende sul fondale e risale', () => {
      T36.post({ ch4Done: false }); T.tp('i:capitaneria', 7, 7); const ma = T36.npc('marisa');
      if (/CORALIA/.test(ma.def.talk(Game).join(' '))) return 'capitolo V aperto troppo presto';
      Game.s.flags.ch4Done = true; Game.say(ma.def.talk(Game)); const t = T36.text(); T.skip();
      T.tp('m:1,2', 7, 1); T.noEnemies(); Game.dialog = null; Game.tideT = TIDE_LOW + 50; T.run([], 3);
      const dry = Game.tideLow() && Game.tiles[3][7] === '.' && Game.tiles[9][7] === 'U';
      Game.player.x = 7 * TS; Game.player.y = 8 * TS - 6; T.run(['down'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1); T.skip(); const down = Game.roomId;
      T.noEnemies(); Game.waveT = 0; T.run(['up'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1);
      return /CORALIA/.test(t) && Game.s.flags.ch5Call && dry && down === 's:1,0' && Game.roomId === 'm:1,2' ? true : [dry, down, Game.roomId, t.slice(0, 40)].join(' / ');
    });
    check('Ogni luogo del Fondale è raggiungibile dal villaggio (grafo del Segnavia)', () => {
      T36.post({ ch5Call: true }); T.tp('o:1,2', 7, 6);
      const miss = T36.SEA.filter(id => !wayPath(Game, 'o:1,2', id));
      return miss.length ? miss.join(', ') : true;
    });
    check('Onda lunga: senza riparo colpisce e spinge verso nord; con uno scoglio subito a sud, niente', () => {
      T36.post({ ch5Call: true }); T.tp('s:2,1', 1, 1); T.noEnemies(); Game.dialog = null;
      Game.player.x = 1 * TS; Game.player.y = 4 * TS - 6; Game.player.hurtT = 0; const hp0 = Game.s.hp, y0 = Game.player.y;
      T36.waveAt(); for (let i = 0; i < 20; i++) T.run([], 1);
      const hit = Game.s.hp === hp0 - 1 && Game.player.y < y0;
      T.run([], 80); Game.player.x = 3 * TS; Game.player.y = 1 * TS - 6; Game.player.hurtT = 0; Game.player.kbx = Game.player.kby = 0;
      const sheltered = Game.waveShelter(), hp1 = Game.s.hp;
      T36.waveAt(); for (let i = 0; i < 20; i++) T.run([], 1);
      return hit && sheltered && Game.s.hp === hp1 ? true : 'colpito ' + hit + ' riparo ' + sheltered + ' hp ' + hp1 + '→' + Game.s.hp;
    });
    check('Prima dell\'onda: brontolio (suono) e schiuma; la prima volta un avviso', () => {
      T36.post({ ch5Call: true }); T.tp('s:1,0', 7, 1); T.noEnemies(); Game.dialog = null; Game.banner = null;
      const heard = []; Sound.sfx = n => heard.push(n);
      const W = Game.room.waves, travel = Math.ceil((PLAY_H + 40) / W.speed); Game.waveT = W.period - travel - WAVE_WARN - 1;
      T.run([], 3); const warn = Game.waveFront() === 'warn'; Game.render();
      return warn && heard.includes('roots') && Game.banner && /onda/i.test(Game.banner.text) ? true : 'warn ' + warn + ' suoni ' + heard.join(',') + ' avviso ' + (Game.banner && Game.banner.text);
    });
    check('Relitto: Guscetto è chiuso dalle alghe; tagliate, lo salvi e torna dalla mamma a Coralia', () => {
      T36.post({ ch5Call: true, marevaHello: true }); T.tp('s:0,1', 7, 7); T.noEnemies(); Game.dialog = null;
      const a = T36.reach([7, 7], [9, 4]); Game.s.flags['cut:s:0,1:9,4'] = true; T.tp('s:0,1', 7, 7); T.noEnemies(); Game.dialog = null; const b = T36.reach([7, 7], [9, 4]);
      const gu = T36.npc('guscetto'); Game.say(gu.def.talk(Game)); T.skip();
      T.tp('s:1,1', 7, 8); Game.dialog = null; const home = !!T36.npc('guscetto_casa');
      return !a && b && Game.s.flags.babyFound && home ? true : 'prima ' + a + ' dopo ' + b + ' salvo ' + Game.s.flags.babyFound + ' a casa ' + home;
    });
    check('Mareva: racconta il patto; dopo Guscetto dà la Conchiglia del Custode', () => {
      T36.post({ ch5Call: true }); T.tp('s:1,1', 7, 8); Game.dialog = null; const mv = T36.npc('mareva');
      Game.say(mv.def.talk(Game)); const hello = T36.text(); T.skip();
      const noBaby = mv.def.talk(Game).join(' ');
      Game.s.flags.babyFound = true; Game.say(mv.def.talk(Game)); T.skip();
      return /CANTO DELLA MAREA/.test(hello) && !/CUSTODE/.test(noBaby) && Game.s.flags.conchMareva && conchCount(Game) === 1 ? true : [hello.slice(0, 40), Game.s.flags.conchMareva, conchCount(Game)].join(' / ');
    });
    check('Torre Inclinata: la conchiglia è chiusa dietro la crepa (serve una bomba)', () => {
      T36.post({ ch5Call: true }); T.tp('s:2,2', 7, 8); T.noEnemies();
      const a = T36.reach([7, 8], [4, 4]); Game.s.flags['bomb:s:2,2:4,5'] = true; T.tp('s:2,2', 7, 8); const b = T36.reach([7, 8], [4, 4]);
      return !a && b ? true : 'prima ' + a + ' dopo ' + b;
    });
    check('Il portone del Tempio: senza tre conchiglie no; con tre suona il Canto (+50 gemme, medaglia); passaggio solo col prossimo capitolo', () => {
      const tm0 = ROOMS[TEMPLE_ROOM]; delete ROOMS[TEMPLE_ROOM];   /* Ciclo 37 (Agente A): ora il Tempio esiste; il caso «senza» si prova togliendolo per un attimo */ T36.post({ ch5Call: true, conchMareva: true, 'chest:s_conch_onde': true }); T.tp('s:1,2', 7, 4); Game.dialog = null;
      Game.say(templeDoor(Game)); const two = T36.text(); T.skip();
      Game.s.flags['chest:s_conch_torre'] = true; const g0 = Game.s.gems; Game.say(templeDoor(Game)); const song = T36.text(); T.skip();
      const sealed = Game.tiles[6][7] === 'J' && !Game.room.warps['7,6']; if (tm0) ROOMS[TEMPLE_ROOM] = tm0;
      const had = ROOMS[TEMPLE_ROOM]; if (!had) ROOMS[TEMPLE_ROOM] = { name: 'prova', ground: 'dungeon', tiles: ROOMS['r:1,2'].tiles.slice() };
      T.tp('s:1,2', 7, 4); Game.dialog = null; const open = Game.tiles[6][7] === 'Z' && Game.room.warps['7,6'].to === TEMPLE_ROOM;
      if (!had) delete ROOMS[TEMPLE_ROOM];
      const m = MEDALS.find(x => x.id === 'canto');
      return /2\/3/.test(two) && /Canto della Marea/.test(song) && Game.s.flags.templeOpen && Game.s.gems - g0 === 50 && m.got(Game) && sealed && open ? true : [two.slice(0, 30), Game.s.flags.templeOpen, Game.s.gems - g0, sealed, open].join(' / ');
    });
    check('Obiettivo e Segnavia seguono il Capitolo V', () => {
      T36.post(); T.tp('o:1,2', 7, 6); const out = [objectiveRoom(Game)];
      const step = x => { Object.assign(Game.s.flags, x); out.push(objectiveRoom(Game)); };
      step({ ch5Call: true }); step({ seaIn: true }); step({ marevaHello: true }); step({ babyFound: true }); step({ conchMareva: true }); step({ 'chest:s_conch_onde': true }); step({ 'chest:s_conch_torre': true });
      return out.join(',') === 'i:capitaneria,s:1,0,s:1,1,s:0,1,s:1,1,s:2,1,s:2,2,s:1,2' && /Tempio/.test(currentObjective(Game)) ? true : out.join(',') + ' / ' + currentObjective(Game);
    });
    check('Diario: la pagina del Capitolo V; gli altri elenchi restano intatti', () => {
      T36.post({ ch5Call: true }); T.tp('s:1,1', 7, 8); Game.dialog = null;
      const keep = [CHAPTERS, CHAPTERS2, CHAPTERS3, CHAPTERS4].map(l => l.map(c => c.name).join('|')).join('#');
      let seen = null; const t0 = window.txt; window.txt = function (s) { if (/Il mare si ritira/.test(s)) seen = s; return t0.apply(this, arguments); };
      try { Game.state = 'pause'; Game.pausePage = 1; Game.render(); } finally { window.txt = t0; Game.state = 'title'; }
      const same = [CHAPTERS, CHAPTERS2, CHAPTERS3, CHAPTERS4].map(l => l.map(c => c.name).join('|')).join('#') === keep;
      return seen && same ? true : 'visto ' + seen + ' intatti ' + same;
    });
    check('Tutte le stanze del Fondale si disegnano (calma, brontolio, onda in arrivo); mappa «FONDALE»', () => {
      T36.post({ ch5Call: true, templeOpen: true });
      for (const id of T36.SEA) { T.tp(id, 7, 4); Game.dialog = null;
        const W = Game.room.waves; if (W) { const travel = Math.ceil((PLAY_H + 40) / W.speed); for (const k of [0, W.period - travel - 50, W.period - travel + 40]) { Game.waveT = k; Game.render(); } } else Game.render();
        Game.visited.add(id); }
      T.tp('s:1,1', 7, 8); Game.dialog = null; Game.state = 'pause'; Game.pausePage = 0; Game.render(); const pre = Game.mapPrefix(); Game.state = 'title';
      return pre === 's:' ? true : pre;
    });
    check('Correzione all\'epilogo: i petali non scendono mai sotto la riga «Premi SPAZIO» (y 138)', () => {
      T.fresh({}); Game.epParts = []; let maxY = 0;
      for (let i = 0; i < 900; i++) { Game.t++; Game.drawEpilogue(bctx); for (const p of Game.epParts || []) maxY = Math.max(maxY, p.y); }
      Game.epParts = []; Game.state = 'title';
      return maxY < 134 ? true : 'petalo a y ' + maxY.toFixed(1);
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T36 = T36;
