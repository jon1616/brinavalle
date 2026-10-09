'use strict';
/* =====================================================================
 *  TEST DEL CICLO 28 (Agente B) — il Segnavia e le chiavi; il sentiero di brina.
 *  T28.suite()  (con ?test)
 * ===================================================================== */
const T28 = {
  /* nel primo dungeon, appena entrati, senza chiavi */
  atrium(keys) {
    T.fresh({ sword: true, bombs: true }); Object.assign(Game.s.flags, { intro: true, collapse: true, enteredDungeon: true });
    Game.s.keys = keys || 0; T.tp('d:1,1', 7, 8); T.noEnemies(); Game.dialog = null;
  },
  /* segue SOLO la freccia (come il bot del Ciclo 27): cammina verso il bersaglio, per stanze, fino alla meta */
  follow(maxRooms) {
    const seen = [Game.roomId];
    for (let r = 0; r < maxRooms; r++) {
      const w = Game.wayTargets()[0];
      if (!w) break;
      if (Game.roomId === objectiveRoom(Game)) break;
      const id = Game.roomId;
      for (let i = 0; i < 900 && Game.roomId === id; i++) {
        const path = Game.wayTrail(), p = Game.player;
        const step = path && path[1] ? path[1] : [Math.floor(w.x / TS), Math.floor(w.y / TS)];
        const tx = step[0] * TS + 8, ty = step[1] * TS + 8, dx = tx - p.cx(), dy = ty - (p.y + 12);
        let keys = [];
        if (Math.abs(dx) > 2) keys.push(dx < 0 ? 'left' : 'right');
        if (Math.abs(dy) > 2) keys.push(dy < 0 ? 'up' : 'down');
        if (!path || path.length <= 1 || !keys.length) keys = [['down', 'up', 'left', 'right'][w.dir]];   // arrivato sul varco: oltre il bordo
        T.run(keys, 1); if (Game.dialog) T.skip();
        if (Game.state !== 'play') T.run([], 40);
      }
      T.run([], 40);   // fine dello scorrimento
      seen.push(Game.roomId);
    }
    return seen;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, way = Opts.way, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    Opts.way = 2;
    check('Atrio senza chiavi: la freccia NON indica più la porta chiusa a est, ma la stanza della chiave a ovest', () => {
      T28.atrium(0); const w = Game.wayTargets()[0];
      return objectiveRoom(Game) === 'd:0,1' && w && w.dir === 2 ? true : 'meta ' + objectiveRoom(Game) + ' freccia ' + JSON.stringify(w);
    });
    check('Dalla piazza, verso le Rovine: la chiave delle Rovine, non quella (più vicina) della Grotta', () => {
      T.fresh({ sword: true, bombs: true }); Object.assign(Game.s.flags, { intro: true, collapse: true, enteredDungeon: true }); Game.s.keys = 0; T.tp('o:1,2', 7, 6);
      const near = wayPath(Game, 'o:1,2', 'c:0,1').length <= wayPath(Game, 'o:1,2', 'd:0,1').length;
      return objectiveRoom(Game) === 'd:0,1' ? true : 'meta ' + objectiveRoom(Game) + ' (Grotta più vicina: ' + near + ')';
    });
    check('Nella stanza della chiave la freccia indica il forziere della chiave', () => {
      T28.atrium(0); T.tp('d:0,1', 7, 6); T.noEnemies();
      const w = Game.wayTargets()[0], ch = Game.entities.find(e => e instanceof Chest && e.def.item === 'key');
      return w && ch && Math.abs(w.x - (ch.x + 8)) < 1 && w.y < ch.y ? true : JSON.stringify(w);
    });
    check('Con una chiave in tasca la freccia torna alla porta est (come prima)', () => {
      T28.atrium(1); const w = Game.wayTargets()[0];
      return objectiveRoom(Game) === 'd:2,1' && w && w.dir === 3 ? true : 'meta ' + objectiveRoom(Game) + ' ' + JSON.stringify(w);
    });
    check('Porta già aperta: conta come aperta anche senza chiavi', () => {
      T28.atrium(0); for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (ROOMS['d:1,1'].tiles[y][x] === 'L') Game.s.flags['open:d:1,1:' + x + ',' + y] = true;
      T.tp('d:1,1', 7, 8); return objectiveRoom(Game) === 'd:2,1' ? true : objectiveRoom(Game);
    });
    check('Grotta senza chiavi: stessa cosa (porta est chiusa, chiave a ovest)', () => {
      T.fresh({ sword: true, bombs: true, hookshot: true }); Object.assign(Game.s.flags, { intro: true, collapse: true, enteredDungeon: true });
      Game.s.keys = 0; Game.s.flags['chest:c_key1'] = true;
      const goal0 = Game.s.items.bigkey; T.tp('c:1,1', 7, 8); T.noEnemies();
      // (nella Grotta c'è anche un giro lungo, da nord: basta che il percorso non attraversi la porta chiusa a est)
      const p = wayPath(Game, 'c:1,1', 'c:2,1'), direct = wayExits(Game, 'c:1,1').some(e => e.to === 'c:2,1');
      Game.s.keys = 1; const withKey = wayExits(Game, 'c:1,1').some(e => e.to === 'c:2,1');
      return !direct && withKey && (!p || p[1] !== 'c:2,1') ? true : 'diretto ' + direct + ' con chiave ' + withKey + ' percorso ' + JSON.stringify(p);
    });
    check('Senza Chiave Grande il percorso non passa dalla grande porta', () => {
      T.fresh({ sword: true }); let found = null;
      for (const id in ROOMS) { const t = ROOMS[id].tiles; for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (t[y][x] === 'G') found = found || [id, x, y]; }
      if (!found) return 'nessuna porta G';
      const [id, x, y] = found, a = wayLocked(Game, id, x, y, 'G'); Game.s.items.bigkey = true; const b = wayLocked(Game, id, x, y, 'G');
      return a && !b ? true : a + ' / ' + b;
    });
    check('Un bot che segue SOLO la freccia (e il sentiero) dall\'Atrio prende la chiave e poi passa la porta', () => {
      T28.atrium(0); R.god = true;
      const rooms = T28.follow(4);
      // nella stanza della chiave: apre il forziere indicato
      const ch = Game.entities.find(e => e instanceof Chest && e.def.item === 'key');
      if (Game.roomId !== 'd:0,1' || !ch) { R.god = false; return 'arrivato in ' + Game.roomId + ' (' + rooms.join('→') + ')'; }
      // il sentiero finisce accanto al forziere (qui: sopra, perché sotto c'è il muro): ci si va, e ci si gira verso di lui
      T.run([], 40);   // fine dello scorrimento tra le stanze
      const tr = Game.wayTrail(), end = tr[tr.length - 1]; R.walkTo(end[0], end[1]);
      const cx = Math.floor((ch.x + 8) / TS), cy = Math.floor((ch.y + 8) / TS); R.faceTo(Math.sign(cx - end[0]), Math.sign(cy - end[1])); R.tap('action', 2); T.skip();
      if (Game.s.keys !== 1) { R.god = false; return 'chiave non presa'; }
      const back = T28.follow(3); R.god = false;
      return back.includes('d:2,1') ? true : 'dopo la chiave: ' + back.join('→');
    });
    check('Sentiero di brina: compare solo da fermi (dopo un attimo), con la freccia visibile, e porta all\'uscita giusta', () => {
      T28.atrium(0); T.run([], 10); const early = Game.trailIdle >= TRAIL_IDLE;
      T.run([], TRAIL_IDLE); const path = Game.wayTrail(), last = path && path[path.length - 1];
      const late = Game.trailIdle >= TRAIL_IDLE;
      T.run(['left'], 2); const moving = Game.trailIdle;
      return !early && late && last && last[0] === 0 && moving === 0 ? true : 'presto ' + early + ' tardi ' + late + ' fine ' + last + ' muovendo ' + moving;
    });
    check('Sentiero: solo tessere percorribili e contigue; mai nelle voragini', () => {
      const bad = [];
      for (const [id, x, y] of [['d:1,1', 7, 8], ['o:0,0', 14, 9], ['o:1,2', 7, 6]]) {
        T.fresh({ sword: true }); Object.assign(Game.s.flags, { intro: true }); T.tp(id, x, y);
        const p = Game.wayTrail(); if (!p) continue;
        for (let i = 1; i < p.length; i++) {
          const [a, b] = p[i], ch = Game.tiles[b][a];
          if (Math.abs(a - p[i - 1][0]) + Math.abs(b - p[i - 1][1]) !== 1) bad.push(id + ' salto ' + a + ',' + b);
          if (ch === '_' || (TILE_SOLID.has(ch) && !TILE_WARP.has(ch) && !WAY_DOORS.has(ch))) bad.push(id + ' ' + ch + '@' + a + ',' + b);
        }
      }
      return bad.length ? bad.slice(0, 4).join(' | ') : true;
    });
    check('Sentiero disegnato senza errori; con «Segnavia: No» niente sentiero né freccia', () => {
      T28.atrium(0); T.run([], TRAIL_IDLE + 40); Game.render();
      Opts.way = 0; const vis = Game.wayVisible(); Game.render(); Opts.way = 2;
      return !vis ? true : 'visibile con l\'opzione spenta';
    });
    check('Costo: obiettivo + percorso + sentiero sotto 1 ms per frame', () => {
      T28.atrium(0); T.run([], TRAIL_IDLE + 5);
      const t0 = performance.now(); for (let i = 0; i < 200; i++) { objectiveRoom(Game); Game.wayTargets(); Game.wayTrail(); objectiveChest(Game); }
      const ms = (performance.now() - t0) / 200;
      return ms < 1 ? true : ms.toFixed(3) + ' ms';
    });
    Opts.way = way; R.god = god; Medals.data = md;   // R.god di serie è true: lasciarlo a false rallentava T.route()
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T28 = T28;
