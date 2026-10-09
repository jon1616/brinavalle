'use strict';
/* =====================================================================
 *  TEST DEL CICLO 38 (Agente B) — Capitolo VI «Il Battito della Terra» (regione k:):
 *  la fenditura, Fondogrotta, i terremoti, le pietre, la talpa, la Sala delle Radici.   T38.suite()
 * ===================================================================== */
const T38 = {
  EARTH: ['k:1,0', 'k:1,1', 'k:0,1', 'k:2,1', 'k:2,2', 'k:1,2'],
  post(extra) {
    T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true });
    Object.assign(Game.s.flags, { intro: true, victory: true, boss: true, hookReturned: true, fatherFreed: true, fatherHome: true, fatherGift: true, fatherHello: true,
      partyOn: true, partyToast: true, partyDone: true, northCall: true, northArrived: true, northBells: true, towerIn: true, towerLady: true, ladyTold: true,
      fatherRemembers: true, ch2Done: true, ch3Call: true, observatoryOpen: true, vesperVoice: true, ch3Done: true,
      ch4Call: true, coastIn: true, marisaHello: true, farolit: true, craterOpen: true, starFreed: true, ch4Done: true,
      ch5Call: true, seaIn: true, templeOpen: true, wMother: true, ch5Done: true }, extra || {});
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
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, sfx = Sound.sfx, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } finally { Sound.sfx = sfx; } };
    check('Le Gallerie sono ben formate; nessun varco verso il nulla; i varchi combaciano', () => {
      const bad = [];
      for (const id of T38.EARTH) { const t = ROOMS[id].tiles; if (t.length !== RH || t.some(r => r.length !== RW)) bad.push(id + ' misure'); }
      for (const id of T38.EARTH) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
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
    check('Tornando a Brinavalle dopo il Capitolo V: il terremoto apre la fenditura (solo allora); si scende e si risale', () => {
      T38.post({ ch5Done: false }); T.tp('o:1,2', 7, 6); Game.dialog = null; T.run([], 3); const early = Game.s.flags.ch6Call || Game.tiles[8][8] === 'Z';
      T38.post(); T.tp('o:1,2', 7, 6); Game.dialog = null; T.run([], 3); const t = T38.text(); T.skip();
      const crack = Game.s.flags.ch6Call && Game.tiles[8][8] === 'Z';
      Game.player.x = 8 * TS; Game.player.y = 7 * TS - 6; T.noEnemies(); T.run(['down'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1); T.skip(); const down = Game.roomId;
      T.noEnemies(); T.run(['up'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1);
      return !early && /FENDITURA/.test(t) && crack && down === 'k:1,0' && Game.roomId === 'o:1,2' ? true : [early, crack, down, Game.roomId, t.slice(0, 30)].join(' / ');
    });
    check('Ogni luogo delle Gallerie è raggiungibile dal villaggio (grafo del Segnavia)', () => {
      T38.post({ ch6Call: true }); T.tp('o:1,2', 7, 6);
      const miss = T38.EARTH.filter(id => !wayPath(Game, 'o:1,2', id));
      return miss.length ? miss.join(', ') : true;
    });
    check('Terremoto: tremito (suono, avviso), poi i massi: uno cade proprio su Lio; se resta lì perde mezzo cuore, se si sposta no', () => {
      T38.post({ ch6Call: true }); T.tp('k:1,0', 7, 5); T.noEnemies(); Game.dialog = null; Game.banner = null;
      const heard = []; Sound.sfx = n => heard.push(n);
      Game.quakeT = QUAKE.period - QUAKE_WARN - 1; T.run([], 2);
      const warn = heard.includes('stomp') && Game.shake > 0 && Game.banner && /trema/.test(Game.banner.text);
      Game.quakeT = QUAKE.period - 1; Game.player.hurtT = 0; const hp0 = Game.s.hp; T.run([], 1);
      const onMe = Game.rocks.some(r => Math.floor(r.x / TS) === Math.floor(Game.player.cx() / TS));
      T.run([], ROCK_T + 30); const hit = Game.s.hp < hp0;
      Game.quakeT = QUAKE.period - 1; Game.player.hurtT = 0; const hp1 = Game.s.hp; T.run([], 1);
      T.run(['right'], 30); T.run([], ROCK_T); const dodged = Game.s.hp === hp1 || Game.rocks.length === 0 && Game.s.hp >= hp1 - 1;
      return warn && onMe && hit && dodged ? true : 'avviso ' + warn + ' su di me ' + onMe + ' colpito ' + hit + ' schivato ' + dodged + ' (' + hp1 + '→' + Game.s.hp + ')';
    });
    check('Con le pietre al loro posto la terra si calma: niente più massi', () => {
      T38.post({ ch6Call: true, rootsDoor: true }); T.tp('k:1,0', 7, 5); T.noEnemies(); Game.dialog = null;
      Game.quakeT = QUAKE.period - 2; T.run([], 5); return Game.rocks.length === 0 ? true : 'massi ' + Game.rocks.length;
    });
    check('Bruna racconta della sorella più piccola e delle tre pietre', () => {
      T38.post({ ch6Call: true }); T.tp('k:1,1', 7, 5); Game.dialog = null; Game.say(T38.npc('bruna').def.talk(Game)); const t = T38.text(); T.skip();
      return /sorella più piccola/.test(t) && /PIETRE DEL BATTITO/.test(t) && Game.s.flags.brunaHello ? true : t.slice(0, 80);
    });
    check('Miniera dei Cristalli: buia, e la pietra si raggiunge dal fondo del labirinto', () => {
      T38.post({ ch6Call: true }); T.tp('k:0,1', 14, 5); Game.dialog = null;
      return Game.room.dark && T38.reach([15, 5], [1, 2]) ? true : 'buia ' + Game.room.dark + ' raggiungibile ' + T38.reach([15, 5], [1, 2]);
    });
    check('Fiume Sotterraneo: con l\'arpione vero di là dal fiume, la pietra, e ritorno', () => {
      T38.post({ ch6Call: true, brunaHello: true }); R.god = true; T.tp('k:2,1', 5, 4); T.noEnemies(); Game.dialog = null; Game.s.equip = 'hookshot'; Game.quakeT = -100000;
      const before = T38.reach([5, 4], [12, 4]);
      R.faceTo(1, 0); R.tap('item', 1); for (let i = 0; i < 90 && Game.player.hook; i++) R.frame([]);
      const over = Math.floor(Game.player.cx() / TS) >= 10;
      R.walkTo(12, 4); R.faceTo(1, 0); R.tap('action', 2); T.skip(); const got = !!Game.s.flags['chest:k_stone_fiume'];
      R.walkTo(10, 6); R.faceTo(-1, 0); Game.s.equip = 'hookshot'; R.tap('item', 1); for (let i = 0; i < 90 && Game.player.hook; i++) R.frame([]);
      const back = Math.floor(Game.player.cx() / TS) <= 5; R.god = god;
      return !before && over && got && back ? true : 'a piedi ' + before + ' di là ' + over + ' pietra ' + got + ' ritorno ' + back + ' @' + T.where();
    });
    check('Talpa corazzata: sotto terra è intoccabile, sbuca vicino a Lio, fuori si colpisce; la pietra arriva sconfitte tutte', () => {
      T38.post({ ch6Call: true }); T.tp('k:2,2', 2, 5); Game.dialog = null;
      const m = Game.entities.find(e => e instanceof Mole); if (!m) return 'nessuna talpa';
      m.inv = 0; const hp0 = m.hp; m.hurt(Game, 1, 3); const immune = m.hp === hp0;
      Game.entities = Game.entities.filter(e => !(e instanceof Mole) || e === m); m.x = Game.player.x + 40; m.y = Game.player.y; m.state = 'under'; m.st = 200;
      let surfaced = false, near = 99; for (let i = 0; i < 200 && !surfaced; i++) { T.run([], 1); if (m.state === 'up') { surfaced = true; near = Math.hypot(m.cx() - Game.player.cx(), m.cy() - Game.player.cy()); } }
      m.inv = 0; m.hurt(Game, 1, 3); const hitUp = m.hp < hp0;
      m.dead = true; T.run([], 10); const stone = Game.entities.some(e => e instanceof Chest && e.def.id === 'k_stone_talpe');
      return immune && surfaced && near < 24 && hitUp && stone && bestKey(m) === 'mole' ? true : [immune, surfaced, near.toFixed(1), hitUp, stone].join(' / ');
    });
    check('La porta delle Radici: senza tre pietre no; con tre il battito si calma (+50 gemme, medaglia); passaggio solo col prossimo capitolo', () => {
      const heart = ROOMS[HEART_ROOM]; delete ROOMS[HEART_ROOM];   // Ciclo 39: il Cuore della Terra esiste; per il caso «senza prossimo capitolo» lo si toglie per un attimo (come per T30, T32, T34, T36)
      T38.post({ ch6Call: true, 'chest:k_stone_miniera': true, 'chest:k_stone_fiume': true }); T.tp('k:1,2', 7, 4); Game.dialog = null;
      Game.say(rootsDoor(Game)); const two = T38.text(); T.skip();
      Game.s.flags['chest:k_stone_talpe'] = true; const g0 = Game.s.gems; Game.say(rootsDoor(Game)); const t = T38.text(); T.skip();
      const sealed = Game.tiles[6][7] === 'J' && !Game.room.warps['7,6'];
      if (heart) ROOMS[HEART_ROOM] = heart;
      const had = ROOMS[HEART_ROOM]; if (!had) ROOMS[HEART_ROOM] = { name: 'prova', ground: 'dungeon', tiles: ROOMS['r:1,2'].tiles.slice() };
      T.tp('k:1,2', 7, 4); Game.dialog = null; const open = Game.tiles[6][7] === 'Z' && Game.room.warps['7,6'].to === HEART_ROOM;
      if (!had) delete ROOMS[HEART_ROOM];
      const md2 = MEDALS.find(x => x.id === 'battito');
      return /2\/3/.test(two) && /Regolare/.test(t) && Game.s.flags.rootsDoor && Game.s.gems - g0 === 50 && md2.got(Game) && sealed && open ? true : [two.slice(0, 30), Game.s.flags.rootsDoor, Game.s.gems - g0, sealed, open].join(' / ');
    });
    check('Obiettivo e Segnavia seguono il Capitolo VI', () => {
      T38.post(); Game.s.flags.ch6Call = false; T.tp('i:elder', 7, 7); const out = [objectiveRoom(Game)];
      const step = x => { Object.assign(Game.s.flags, x); out.push(objectiveRoom(Game)); };
      step({ ch6Call: true }); step({ earthIn: true }); step({ brunaHello: true }); step({ 'chest:k_stone_miniera': true }); step({ 'chest:k_stone_fiume': true }); step({ 'chest:k_stone_talpe': true });
      return out.join(',') === 'o:1,2,k:1,0,k:1,1,k:0,1,k:2,1,k:2,2,k:1,2' && /Sala delle Radici/.test(currentObjective(Game)) ? true : out.join(',') + ' / ' + currentObjective(Game);
    });
    check('Diario: la pagina del Capitolo VI; gli altri elenchi restano intatti; nessun id di medaglia ripetuto', () => {
      T38.post({ ch6Call: true }); T.tp('k:1,1', 7, 5); Game.dialog = null;
      const keep = [CHAPTERS, CHAPTERS2, CHAPTERS3, CHAPTERS4, CHAPTERS5].map(l => l.map(c => c.name).join('|')).join('#');
      let seen = null; const t0 = window.txt; window.txt = function (s) { if (/La terra trema/.test(s)) seen = s; return t0.apply(this, arguments); };
      try { Game.state = 'pause'; Game.pausePage = 1; Game.render(); } finally { window.txt = t0; Game.state = 'title'; }
      const same = [CHAPTERS, CHAPTERS2, CHAPTERS3, CHAPTERS4, CHAPTERS5].map(l => l.map(c => c.name).join('|')).join('#') === keep;
      const ids = MEDALS.map(m => m.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      return seen && same && !dup.length ? true : 'visto ' + seen + ' intatti ' + same + ' doppi ' + dup;
    });
    check('Tutte le Gallerie si disegnano (calma, tremito, massi in caduta); mappa «GALLERIE»', () => {
      T38.post({ ch6Call: true });
      for (const id of T38.EARTH) { T.tp(id, 7, 4); Game.dialog = null; Game.render(); if (Game.room.quake) { Game.quakeT = QUAKE.period - 1; T.run([], 1); Game.render(); T.run([], ROCK_T - 8); Game.render(); } Game.visited.add(id); }
      T.tp('k:1,1', 7, 5); Game.dialog = null; Game.state = 'pause'; Game.pausePage = 0; Game.render(); const pre = Game.mapPrefix(); Game.state = 'title';
      return pre === 'k:' ? true : pre;
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T38 = T38;
