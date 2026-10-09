'use strict';
/* =====================================================================
 *  TEST DEL CICLO 32 (Agente B) — fine del Capitolo II; Capitolo III
 *  «Il Canto di Vesper» (regione a:, le Dune d'Ambra).   T32.suite()  (con ?test)
 * ===================================================================== */
const T32 = {
  AMBER: ['a:0,1', 'a:1,1', 'a:2,1', 'a:1,0', 'a:2,0', 'a:1,2'],
  post(extra) {
    T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true });
    Object.assign(Game.s.flags, { intro: true, victory: true, boss: true, fatherFreed: true, fatherHome: true, fatherGift: true, fatherHello: true,
      partyOn: true, partyToast: true, partyDone: true, northCall: true, northArrived: true, northBells: true, towerIn: true, towerLady: true, ladyTold: true }, extra || {});
    Game.s.bombs = 10; T32.at(0.1);
  },
  at(p) { Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * p; },
  text() { const d = Game.dialog; return d ? [d.entry && d.entry.text, ...d.queue.map(e => typeof e === 'string' ? e : e && e.text)].filter(Boolean).join(' | ') : ''; },
  npc(id) { return Game.entities.find(e => e.def && e.def.id === id); },
  chest(id) { return Game.entities.find(e => e instanceof Chest && e.def.id === id); },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Le stanze delle Dune sono ben formate e i varchi combaciano', () => {
      const bad = [];
      for (const id of [...T32.AMBER, 'i:tenda', 'i:mappe']) { const t = ROOMS[id].tiles; if (t.length !== RH || t.some(r => r.length !== RW)) bad.push(id + ' misure'); }
      for (const id of T32.AMBER) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const a = ROOMS[id].tiles, nid = neighborId(id, dx, dy);
        for (let k = 0; k < (dx ? RH : RW); k++) {
          const ca = dx ? a[k][dx > 0 ? RW - 1 : 0] : a[dy > 0 ? RH - 1 : 0][k];
          if (TILE_SOLID.has(ca) || TILE_WARP.has(ca)) continue;
          if (!nid) { bad.push(id + ' varco verso il nulla @' + k); continue; }
          const b = ROOMS[nid].tiles, cb = dx ? b[k][dx > 0 ? 0 : RW - 1] : b[dy > 0 ? 0 : RH - 1][k];
          if (TILE_SOLID.has(cb)) bad.push(id + '→' + nid + ' @' + k);
        }
      }
      return bad.length ? bad.slice(0, 5).join(' | ') : true;
    });
    check('Fine del Capitolo II: dopo il ricordo del padre compare il cartello; chiuso, il capitolo è concluso', () => {
      T32.post({ fatherRemembers: false }); T.tp('o:1,2', 5, 6); Game.dialog = null;
      Game.say(FATHER_NPC.talk(Game)); T.skip(); T.run([], 60);
      const card = Game.state === 'chapter'; Game.render();
      for (let i = 0; i < 130; i++) { Game.update(); Input.endFrame(); }
      T.press('action', 2);
      return card && Game.state === 'play' && Game.s.flags.ch2Done ? true : 'cartello ' + card + ' stato ' + Game.state + ' fatto ' + Game.s.flags.ch2Done;
    });
    check('Teodoro apre il Capitolo III solo dopo il II; la gola compare nei Campi; andata e ritorno', () => {
      T32.post({ fatherRemembers: true }); const el = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
      const before = el.talk(Game).join(' '); if (/Altopiano/i.test(before)) return 'capitolo III aperto troppo presto';
      Game.s.flags.ch2Done = true; T.tp('i:elder', 7, 7); Game.say(el.talk(Game)); const t = T32.text(); T.skip();
      T.tp('o:2,2', 14, 4); T.noEnemies(); Game.dialog = null; const gorge = Game.tiles[4][15] === 'C';
      T.run(['right'], 30); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1); T.skip(); const there = Game.roomId;
      T.noEnemies(); T.run(['left'], 40); for (let i = 0; i < 80 && Game.state !== 'play'; i++) T.run([], 1);
      return /ALTOPIANO/.test(t) && Game.s.flags.ch3Call && gorge && there === 'a:0,1' && Game.roomId === 'o:2,2' ? true : [gorge, there, Game.roomId, t.slice(0, 50)].join(' / ');
    });
    check('Ogni luogo delle Dune è raggiungibile dal villaggio (grafo del Segnavia)', () => {
      T32.post({ fatherRemembers: true, ch2Done: true, ch3Call: true }); T.tp('o:1,2', 7, 6);
      const miss = [...T32.AMBER, 'i:tenda', 'i:mappe'].filter(id => !wayPath(Game, 'o:1,2', id));
      return miss.length ? miss.join(', ') : true;
    });
    check('Nella tenda di Nadira si riposa fino all\'ora scelta (e si recuperano i cuori)', () => {
      T32.post({ ch2Done: true, ch3Call: true, nadiraHello: true }); Game.s.hp = 2; T.tp('i:tenda', 7, 7);
      const menu = T32.npc('nadira').def.talk(Game).find(l => l && l.choices), out = [];
      for (const c of menu.choices.slice(0, 4)) { Game.say(c.fn(Game)); T.skip(); out.push((isNoon(Game) ? 'N' : '') + (isDusk(Game) ? 'D' : '') + (isNightA(Game) ? 'S' : '')); }
      return out.join(',') === ',N,D,S' && Game.s.hp === Game.s.maxHp ? true : out.join(',') + ' cuori ' + Game.s.hp;
    });
    check('Oasi del Miraggio: vera solo a mezzogiorno (acqua, isola, lente); e cambia anche restando nella stanza', () => {
      T32.post({ ch2Done: true, ch3Call: true }); T32.at(0.05); T.tp('a:2,0', 7, 9); T.noEnemies(); Game.dialog = null;
      const morning = Game.tiles[3][5] === '.' && !T32.chest('a_lens_oasi');
      T32.at(0.26); T.run([], 3);
      const noon = Game.tiles[3][5] === '~' && !!T32.chest('a_lens_oasi') && Game.tiles[7][7] === '=';
      T32.at(0.42); T.run([], 3);   // pomeriggio: il miraggio è finito, ma è ancora giorno (il pixel non è scurito dalla notte)
      const gone = Game.tiles[3][5] === '.' && !T32.chest('a_lens_oasi');
      Game.render(); const px = bctx.getImageData(5 * TS + 8, HUD_H + 3 * TS + 8, 1, 1).data; if (!(px[0] > 180 && px[2] < 190)) return 'acqua animata ancora dipinta dopo il miraggio: ' + [...px].slice(0, 3);   // Ciclo 34
      return morning && noon && gone ? true : 'mattino ' + morning + ' mezzogiorno ' + noon + ' sera ' + gone;
    });
    check('Mare di Dune: la stella caduta (lente) c\'è solo di notte', () => {
      T32.post({ ch2Done: true, ch3Call: true }); T32.at(0.3); T.tp('a:2,1', 2, 5); T.noEnemies(); Game.dialog = null;
      const day = !!T32.chest('a_lens_stella'); T32.at(0.74); T.run([], 3); const night = !!T32.chest('a_lens_stella');
      return !day && night ? true : 'giorno ' + day + ' notte ' + night;
    });
    check('Rovine del Sole: la lente è chiusa dietro la crepa (serve una bomba)', () => {
      T32.post({ ch3Call: true }); T.tp('a:1,0', 7, 9); T.noEnemies();
      const reach = () => { const prev = new Set(['7,9']), q = [[7, 9]]; while (q.length) { const [x, y] = q.shift(); if (x === 11 && y === 2) return true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || prev.has(k) || TILE_SOLID.has(Game.tiles[ny][nx])) continue; prev.add(k); q.push([nx, ny]); } } return false; };
      const a = reach(); Game.s.flags['bomb:a:1,0:11,3'] = true; T.tp('a:1,0', 7, 9); const b = reach();
      return !a && b ? true : 'prima ' + a + ' dopo ' + b;
    });
    check('Il portone: senza tre lenti niente; con tre si posano; al tramonto il raggio lo apre (non a mezzogiorno)', () => {
      T32.post({ ch2Done: true, ch3Call: true, 'chest:a_lens_rovine': true, 'chest:a_lens_oasi': true }); T32.at(0.26); T.tp('a:1,2', 7, 5); T.noEnemies(); Game.dialog = null;
      Game.say(doorTalk(Game)); const two = T32.text(); T.skip();
      Game.s.flags['chest:a_lens_stella'] = true; Game.say(doorTalk(Game)); T.skip();
      T.run([], 30); const noonOpen = !!Game.s.flags.observatoryOpen;
      T32.at(0.5); T.run([], 3); const t = T32.text(); T.skip();
      return /2\/3/.test(two) && Game.s.flags.lensesSet && !noonOpen && Game.s.flags.observatoryOpen && /VESPERO/.test(t) ? true : [two.slice(0, 40), Game.s.flags.lensesSet, noonOpen, Game.s.flags.observatoryOpen].join(' / ');
    });
    check('Il passaggio nell\'Osservatorio esiste solo quando l\'Osservatorio esiste', () => {
      // Ciclo 33 (Agente A): ora l'Osservatorio esiste; il caso «senza» si prova togliendolo per un attimo
      const ob0 = ROOMS[VESPER_ROOM]; delete ROOMS[VESPER_ROOM];
      T32.post({ ch3Call: true, lensesSet: true, observatoryOpen: true }); T.tp('a:1,2', 7, 5); Game.dialog = null;
      const a = Game.tiles[7][7] === 'J' && !Game.room.warps['7,7'];
      if (ob0) ROOMS[VESPER_ROOM] = ob0;
      const had = ROOMS[VESPER_ROOM]; if (!had) ROOMS[VESPER_ROOM] = { name: 'prova', ground: 'dungeon', tiles: ROOMS['r:1,2'].tiles.slice() };
      T.tp('a:1,2', 7, 5); Game.dialog = null; const b = Game.tiles[7][7] === 'Z' && Game.room.warps['7,7'].to === VESPER_ROOM;
      if (!had) delete ROOMS[VESPER_ROOM];
      return a && b ? true : 'senza ' + a + ' con ' + b;
    });
    check('Scorpione d\'ambra: allineato carica, sbatte e resta stordito; stordito prende colpi doppi', () => {
      T32.post({ ch3Call: true }); T.tp('a:2,1', 2, 5); T.noEnemies(); Game.dialog = null; R.god = true;
      const s = new Scorpion(8 * TS, 5 * TS - 4); s.t = 40; Game.entities.push(s);
      let saw = new Set(); for (let i = 0; i < 160 && s.state !== 'dazed'; i++) { T.run([], 1); saw.add(s.state); }
      const dazed = s.state === 'dazed', hp0 = s.hp; s.inv = 0; s.hurt(Game, 1, 3);
      R.god = god;
      return saw.has('aim') && saw.has('charge') && dazed && hp0 - s.hp === 2 && bestKey(s) === 'scorpion' ? true : [...saw].join(',') + ' stordito ' + dazed + ' danno ' + (hp0 - s.hp);
    });
    check('Obiettivo e Segnavia seguono il Capitolo III', () => {
      T32.post({ fatherRemembers: true, ch2Done: true }); T.tp('o:1,2', 7, 6); const out = [objectiveRoom(Game)];
      const step = x => { Object.assign(Game.s.flags, x); out.push(objectiveRoom(Game)); };
      step({ ch3Call: true }); step({ amberIn: true }); step({ nadiraHello: true }); step({ 'chest:a_lens_rovine': true }); step({ 'chest:a_lens_oasi': true }); step({ 'chest:a_lens_stella': true });
      const o = currentObjective(Game);
      return out.join(',') === 'i:elder,a:0,1,i:tenda,a:1,0,a:2,0,a:2,1,a:1,2' && /lenti/.test(o) ? true : out.join(',') + ' / ' + o;
    });
    check('Diario: la pagina del Capitolo III; i capitoli del primo e del secondo atto restano intatti', () => {
      T32.post({ ch2Done: true, ch3Call: true, amberIn: true }); T.tp('a:1,1', 7, 6); Game.dialog = null;
      const c1 = CHAPTERS.map(c => c.name).join('|'), c2 = CHAPTERS2.map(c => c.name).join('|');
      let seen = null; const t0 = window.txt; window.txt = function (s) { if (/Dune d'Ambra/.test(s)) seen = s; return t0.apply(this, arguments); };
      try { Game.state = 'pause'; Game.pausePage = 1; Game.render(); } finally { window.txt = t0; Game.state = 'title'; }
      return seen && CHAPTERS.map(c => c.name).join('|') === c1 && CHAPTERS2.map(c => c.name).join('|') === c2 ? true : 'visto ' + seen;
    });
    check('Tutte le stanze delle Dune si disegnano di giorno, al tramonto e di notte; mappa «AMBRA»', () => {
      T32.post({ ch3Call: true, lensesSet: true });
      for (const p of [0.1, 0.26, 0.5, 0.74]) { T32.at(p); for (const id of [...T32.AMBER, 'i:tenda', 'i:mappe']) { T.tp(id, 7, 6); Game.dialog = null; Game.render(); Game.visited.add(id); } }
      T.tp('a:1,1', 7, 6); Game.dialog = null; Game.state = 'pause'; Game.pausePage = 0; Game.render(); const pre = Game.mapPrefix(); Game.state = 'title';
      return pre === 'a:' ? true : pre;
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T32 = T32;
