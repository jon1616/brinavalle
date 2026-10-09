'use strict';
/* =====================================================================
 *  TEST DEL CICLO 40 (Agente B) — Capitolo VII «Il Fratello Vento» (regione h:):
 *  il mulinello, le correnti d'aria, il Refolo, le code d'aquilone, il Grande Aquilone.   T40.suite()
 * ===================================================================== */
const T40 = {
  SKY: ['h:1,2', 'h:1,1', 'h:0,1', 'h:2,1', 'h:1,0'],
  post(extra) {
    T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true });
    Object.assign(Game.s.flags, { intro: true, victory: true, boss: true, hookReturned: true, fatherFreed: true, fatherHome: true, fatherGift: true, fatherHello: true,
      partyOn: true, partyToast: true, partyDone: true, northCall: true, northArrived: true, northBells: true, towerIn: true, towerLady: true, ladyTold: true,
      fatherRemembers: true, ch2Done: true, ch3Call: true, observatoryOpen: true, vesperVoice: true, ch3Done: true,
      ch4Call: true, coastIn: true, marisaHello: true, farolit: true, craterOpen: true, starFreed: true, ch4Done: true,
      ch5Call: true, seaIn: true, templeOpen: true, wMother: true, ch5Done: true,
      ch6Call: true, earthIn: true, rootsDoor: true, gHeart: true, ch6Done: true, ch6Home: true }, extra || {});
    Game.s.bombs = 10; Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * 0.1;
  },
  text() { const d = Game.dialog; return d ? [d.entry && d.entry.text, ...d.queue.map(e => typeof e === 'string' ? e : e && e.text)].filter(Boolean).join(' | ') : ''; },
  npc(id) { return Game.entities.find(e => e.def && e.def.id === id); },
  at(tx, ty) { Game.player.x = tx * TS; Game.player.y = ty * TS - 6; Game.player.kbx = Game.player.kby = 0; Game.player.fallT = 0; },
  /* porta la stanza all'inizio di una raffica, nella direzione numero i */
  gust(i) { const W = Game.room.wind; Game.windT = W.period * (i || 0) + W.period - W.gustLen; },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, sfx = Sound.sfx, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } finally { Sound.sfx = sfx; } };
    check('Le Terre del Vento sono ben formate; i bordi sono vuoto o varchi che combaciano', () => {
      const bad = [];
      for (const id of [...T40.SKY, 'i:mulino']) { const t = ROOMS[id].tiles; if (t.length !== RH || t.some(r => r.length !== RW)) bad.push(id + ' misure'); }
      for (const id of T40.SKY) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nid = neighborId(id, dx, dy), a = ROOMS[id].tiles;
        for (let k = 0; k < (dx ? RH : RW); k++) {
          const x = dx ? (dx > 0 ? RW - 1 : 0) : k, y = dx ? k : (dy > 0 ? RH - 1 : 0), ch = a[y][x];
          if (TILE_SOLID.has(ch) || TILE_WARP.has(ch) || ch === '_') continue;   // il vuoto ai bordi è una voragine, non un varco
          if (!nid) { bad.push(id + ' varco verso il nulla @' + x + ',' + y); continue; }
          const b = ROOMS[nid].tiles, nx = dx ? (dx > 0 ? 0 : RW - 1) : k, ny = dx ? k : (dy > 0 ? 0 : RH - 1);
          if (TILE_SOLID.has(b[ny][nx]) || b[ny][nx] === '_') bad.push(id + '→' + nid + ' @' + k);
        }
      }
      return bad.length ? bad.slice(0, 5).join(' | ') : true;
    });
    check('Teodoro apre il Capitolo VII solo dopo il VI; il mulinello in piazza porta sopra le nuvole e riporta giù', () => {
      T40.post({ ch6Home: false }); T.tp('i:elder', 7, 7); const el = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
      if (/MULINELLO/.test(el.talk(Game).join(' '))) return 'capitolo VII aperto troppo presto';
      Game.s.flags.ch6Home = true; Game.say(el.talk(Game)); const t = T40.text(); T.skip();
      T.tp('o:1,2', 6, 7); T.noEnemies(); Game.dialog = null; const wh = Game.tiles[6][6] === '@';
      Game.player.dir = 1; T.run(['up'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1); T.skip(); const up = Game.roomId;
      T.noEnemies(); T40.at(7, 7); T.run(['down'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1);
      return /QUATTRO|Quattro/.test(t) && Game.s.flags.ch7Call && wh && up === 'h:1,2' && Game.roomId === 'o:1,2' ? true : [wh, up, Game.roomId, t.slice(0, 40)].join(' / ');
    });
    check('Ogni luogo delle Terre del Vento è raggiungibile dal villaggio (grafo del Segnavia)', () => {
      T40.post({ ch7Call: true }); T.tp('o:1,2', 7, 6);
      const miss = [...T40.SKY, 'i:mulino'].filter(id => !wayPath(Game, 'o:1,2', id));
      return miss.length ? miss.join(', ') : true;
    });
    check('Ponte dei Refoli: la raffica butta giù dal ponte chi non è al riparo; vicino al palo no; sulle isole non soffia', () => {
      T40.post({ ch7Call: true }); T.tp('h:0,1', 13, 5); Game.dialog = null; T.noEnemies(); R.god = true;
      T40.at(5, 5); T40.gust(0); const hp0 = Game.s.hp; let fell = false; for (let i = 0; i < 60; i++) { T.run([], 1); if (Game.player.fallT) fell = true; }
      T.run([], 60); T40.at(7, 5); T40.gust(0); const x0 = Game.player.x, y0 = Game.player.y; T.run([], 40); const safe = Game.player.y === y0 && !Game.player.fallT;
      T40.at(2, 5); T40.gust(0); const y1 = Game.player.y; T.run([], 40); const island = Game.player.y === y1;
      R.god = god;
      return fell && safe && island ? true : 'caduto ' + fell + ' riparo ' + safe + ' isola ' + island;
    });
    check('Gola dei Sibili: controvento si avanza; la raffica spinge nel buco; dietro la roccia si resta fermi', () => {
      T40.post({ ch7Call: true }); T.tp('h:2,1', 1, 5); Game.dialog = null; T.noEnemies(); R.god = true;
      T40.at(2, 5); Game.windT = 5; const x0 = Game.player.x; T.run(['right'], 40); const forward = Game.player.x > x0 + 20;
      T40.at(9, 5); T40.gust(0); let fell = false; for (let i = 0; i < 60; i++) { T.run([], 1); if (Game.player.fallT) fell = true; }
      T.run([], 60); const stayed = Game.roomId === 'h:2,1';   // dopo la caduta la raffica continua, ma non ti butta fuori dalla stanza
      T40.at(9, 4); T40.gust(0); const x1 = Game.player.x; T.run([], 40); const held = Game.player.x === x1;
      R.god = god;
      return forward && fell && stayed && held ? true : 'avanti ' + forward + ' nel buco ' + fell + ' resta ' + stayed + ' (' + Game.roomId + ') riparo ' + held;
    });
    check('Picco: una raffica (1,1) si contrasta camminando controvento (Lio va a 1,3)', () => {
      T40.post({ ch7Call: true }); T.tp('h:1,0', 7, 6); Game.dialog = null; T.noEnemies();
      T40.at(7, 6); T40.gust(0); const x0 = Game.player.x; T.run(['left'], 40);   // raffica verso est, Lio cammina verso ovest
      return Game.player.x <= x0 ? true : 'spinto di ' + (Game.player.x - x0).toFixed(1) + ' px';
    });
    check('Prima della raffica: il fischio (suono), un avviso la prima volta, la scritta in alto', () => {
      T40.post({ ch7Call: true }); T.tp('h:0,1', 13, 5); Game.dialog = null; Game.banner = null;
      const heard = []; Sound.sfx = n => heard.push(n); const W = Game.room.wind;
      Game.windT = W.period - W.gustLen - GUST_WARN - 1; T.run([], 3);
      let hud = null; const t0 = window.txt; window.txt = function (s) { if (/Fischio|RAFFICA|Vento/.test(s)) hud = s; return t0.apply(this, arguments); };
      try { Game.render(); } finally { window.txt = t0; }
      return heard.includes('whine') && Game.banner && /raffica/i.test(Game.banner.text) && /Fischio/.test(hud) ? true : 'suoni ' + heard.join(',') + ' avviso ' + (Game.banner && Game.banner.text) + ' scritta ' + hud;
    });
    check('Refolo: si gonfia, poi soffia via Lio (anche sul vuoto vola); ha la sua scheda', () => {
      T40.post({ ch7Call: true }); T.tp('h:1,2', 7, 5); T.noEnemies(); Game.dialog = null; R.god = true;
      const r = new Refolo(4 * TS, 5 * TS - 4); r.st = 1; Game.entities.push(r); const x0 = Game.player.x;
      let puffed = false, blew = false; for (let i = 0; i < 80; i++) { T.run([], 1); if (r.state === 'puff') puffed = true; if (r.state === 'blow') blew = true; }
      R.god = god;
      return puffed && blew && Game.player.x > x0 + 10 && bestKey(r) === 'refolo' && r.mopts().noTiles ? true : 'gonfio ' + puffed + ' soffio ' + blew + ' spinto ' + (Game.player.x - x0).toFixed(1);
    });
    check('Aliseo: racconta del quarto fratello; con tre code costruisce il Grande Aquilone (+30 gemme)', () => {
      T40.post({ ch7Call: true }); T.tp('i:mulino', 7, 7); const al = T40.npc('aliseo');
      Game.say(al.def.talk(Game)); const hello = T40.text(); T.skip();
      for (const t of WIND_TAILS) Game.s.flags['chest:' + t.id] = true; const g0 = Game.s.gems;
      Game.say(al.def.talk(Game)); T.skip();
      return /IL VENTO/.test(hello) && Game.s.flags.bigKite && Game.s.gems - g0 === 30 ? true : [hello.slice(0, 40), Game.s.flags.bigKite, Game.s.gems - g0].join(' / ');
    });
    check('Il palo del Picco: senza aquilone niente; col Grande Aquilone il Vento si mostra (+50 gemme, medaglia); portone solo col prossimo capitolo', () => {
      const palace = ROOMS[PALACE_ROOM]; delete ROOMS[PALACE_ROOM];   // Ciclo 41: il Palazzo esiste; per il caso «senza prossimo capitolo» lo si toglie per un attimo (come per T38)
      T40.post({ ch7Call: true }); T.tp('h:1,0', 7, 6); Game.dialog = null;
      const a = kitePole(Game).join(' '); Game.s.flags.bigKite = true; const g0 = Game.s.gems;
      Game.say(kitePole(Game)); const t = T40.text(); T.skip();
      const sealed = Game.tiles[2][7] === 'J' && !Game.room.warps['7,2'];
      if (palace) ROOMS[PALACE_ROOM] = palace;
      const had = ROOMS[PALACE_ROOM]; if (!had) ROOMS[PALACE_ROOM] = { name: 'prova', ground: 'dungeon', tiles: ROOMS['r:1,2'].tiles.slice() };
      T.tp('h:1,0', 7, 6); Game.dialog = null; const open = Game.tiles[2][7] === 'Z' && Game.room.warps['7,2'].to === PALACE_ROOM;
      if (!had) delete ROOMS[PALACE_ROOM];
      const m = MEDALS.find(x => x.id === 'aquilone');
      return !/Vento:/.test(a) && /Mi vedi/.test(t) && Game.s.flags.windSeen && Game.s.gems - g0 === 50 && m.got(Game) && sealed && open ? true : [Game.s.flags.windSeen, Game.s.gems - g0, sealed, open].join(' / ');
    });
    check('Picco: la terza coda compare sconfitti i Refoli', () => {
      T40.post({ ch7Call: true }); T.tp('h:1,0', 7, 6); Game.dialog = null;
      const a = Game.entities.some(e => e instanceof Chest && e.def.id === 'h_tail_picco');
      for (const e of Game.entities) if (e.enemy) e.dead = true; T.run([], 10);
      return !a && Game.entities.some(e => e instanceof Chest && e.def.id === 'h_tail_picco') ? true : 'prima ' + a;
    });
    check('Obiettivo e Segnavia seguono il Capitolo VII', () => {
      T40.post(); T.tp('o:1,2', 7, 6); const out = [objectiveRoom(Game)];
      const step = x => { Object.assign(Game.s.flags, x); out.push(objectiveRoom(Game)); };
      step({ ch7Call: true }); step({ windIn: true }); step({ aliseoHello: true }); step({ 'chest:h_tail_ponte': true }); step({ 'chest:h_tail_gola': true }); step({ 'chest:h_tail_picco': true }); step({ bigKite: true });
      return out.join(',') === 'i:elder,h:1,2,i:mulino,h:0,1,h:2,1,h:1,0,i:mulino,h:1,0' && /Picco/.test(currentObjective(Game)) ? true : out.join(',') + ' / ' + currentObjective(Game);
    });
    check('Diario: la pagina del Capitolo VII; gli altri elenchi intatti; nessun id di medaglia ripetuto', () => {
      T40.post({ ch7Call: true }); T.tp('h:1,1', 7, 6); Game.dialog = null;
      const lists = [CHAPTERS, CHAPTERS2, CHAPTERS3, CHAPTERS4, CHAPTERS5, CHAPTERS6], keep = lists.map(l => l.map(c => c.name).join('|')).join('#');
      let seen = null; const t0 = window.txt; window.txt = function (s) { if (/Il quarto fratello/.test(s)) seen = s; return t0.apply(this, arguments); };
      try { Game.state = 'pause'; Game.pausePage = 1; Game.render(); } finally { window.txt = t0; Game.state = 'title'; }
      const same = lists.map(l => l.map(c => c.name).join('|')).join('#') === keep;
      const ids = MEDALS.map(m => m.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      return seen && same && !dup.length ? true : 'visto ' + seen + ' intatti ' + same + ' doppi ' + dup;
    });
    check('Tutte le Terre del Vento si disegnano (calma, fischio, raffica; mulino; aquilone); mappa «CIELO»', () => {
      T40.post({ ch7Call: true, bigKite: true, windSeen: true });
      for (const id of [...T40.SKY, 'i:mulino']) { T.tp(id, 7, 6); Game.dialog = null; const W = Game.room.wind;
        if (W) for (const k of [5, W.period - W.gustLen - 10, W.period - 5]) { Game.windT = k; Game.render(); } else Game.render(); Game.visited.add(id); }
      T.tp('h:1,1', 7, 6); Game.dialog = null; Game.state = 'pause'; Game.pausePage = 0; Game.render(); const pre = Game.mapPrefix(); Game.state = 'title';
      return pre === 'h:' ? true : pre;
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T40 = T40;
