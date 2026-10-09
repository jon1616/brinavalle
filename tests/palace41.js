'use strict';
/* =====================================================================
 *  CICLO 41 — test del Palazzo del Vento.   T41.suite()  (con ?test)
 *  T41.chase({ diff })  il bot gioca ad acchiapparello col Vento, input veri -> { vinta, frame, vita, copie }
 *  T41.climb()          il bot attraversa il palazzo dal Picco al Trono
 * ===================================================================== */
const T41 = {
  ROOMS: ['q:1,2', 'q:0,2', 'q:2,2', 'q:1,1', 'q:0,1', 'q:2,1', 'q:1,0'],
  post(extra) {
    T40.post(Object.assign({ ch7Call: true, windIn: true, aliseoHello: true, 'chest:h_tail_ponte': true, 'chest:h_tail_gola': true, 'chest:h_tail_picco': true, bigKite: true, windSeen: true,
      'song:bassa': true, 'song:alta': true, 'song:risveglio': true }, extra || {}));
    Object.assign(Game.s.items, { diapason: true, sundial: true, starlamp: true, conch: true });
    Game.s.qDir = undefined;
  },
  strofe() { const o = {}; STROFE.forEach(s => { o['chest:' + s.id] = true; }); return o; },
  /* registra le battute (con R.god, R.frame chiude da solo i dialoghi) */
  listen() { const said = [], say = Game.say; Game.say = function (l) { said.push(...l.filter(x => typeof x === 'string' || (x && x.text)).map(x => x.text || x)); return say.apply(this, arguments); }; return { said, stop: () => { Game.say = say; return said.join(' '); } }; },
  use(item) { if (Game.heldKeys) Game.heldKeys.clear(); Game.s.equip = item; Input.pressed.add('item'); R.frame([]); },
  blow(dx, dy, wait) { R.faceTo(dx, dy); T41.use('pinwheel'); R.wait(wait || 40); },
  go(x, y) { for (let k = 0; k < 4; k++) { R.walkTo(x, y); const [cx, cy] = R.cell(); if (cx === x && cy === y && Game.state === 'play') return; R.wait(10); T.skip(); } },
  act(dir, ok) { const key = dir[0] > 0 ? 'right' : dir[0] < 0 ? 'left' : dir[1] > 0 ? 'down' : 'up'; for (let k = 0; k < 5 && !ok(); k++) { T.skip(); T.run([key], 6); R.faceTo(...dir); Input.pressed.add('action'); T.run([], 5); T.skip(); R.wait(6); } return ok(); },
  /* acchiapparello: il bot insegue il mulinello con i nastri (quello vero, che si riconosce a vista) */
  chase(o) {
    o = Object.assign({ diff: 1, god: false, max: 20000 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = o.god;
    try {
      T41.post(T41.strofe()); Object.assign(Game.s.flags, { qIn: true, qThroneSeen: true }); Game.s.items.pinwheel = true; Game.s.items.potion = false; Game.s.maxHp = Game.s.hp = 14;
      T.tp('q:1,0', 7, 8); T.skip();
      const V = Game.boss; let f = 0, hurt = 0, pth = null, pthT = 0;
      for (; f < o.max && !Game.s.flags.qWind && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); continue; }
        const p = Game.player, keys = [];
        const real = V.state === 'play' && V.swirls.find(s => s.real && !s.dead);
        if (real) {
          const dx = real.cx() - p.cx(), dy = real.cy() - (p.cy()), d = Math.hypot(dx, dy);
          if (d < 28) { if (Math.abs(dx) > 2) keys.push(dx > 0 ? 'right' : 'left'); if (Math.abs(dy) > 2) keys.push(dy > 0 ? 'down' : 'up'); }
          else {
            if (!pth || --pthT <= 0) { pth = R.path([Math.floor(real.cx() / TS), Math.floor(real.cy() / TS)]); pthT = 12; }
            const nx = pth && pth[0];
            if (nx) { const [cx, cy] = R.cell(); if (nx[0] === cx && nx[1] === cy) pth.shift(); const n2 = pth[0] || nx, gx = n2[0] * TS + 8, gy = n2[1] * TS + 8; if (Math.abs(gx - p.cx()) > 2) keys.push(gx > p.cx() ? 'right' : 'left'); else if (Math.abs(gy - p.cy()) > 2) keys.push(gy > p.cy() ? 'down' : 'up'); }
          }
        }
        const hp0 = Game.s.hp;
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (Game.s.hp < hp0) hurt++;
        if (R.god) Game.s.hp = Game.s.maxHp;
      }
      return { vinta: !!Game.s.flags.qWind, frame: f, vita: Game.s.hp + '/' + Game.s.maxHp, colpi: hurt, copie: V.decoys };
    } finally { Opts.diff = keep; R.god = god; T.skip(); Game.state = 'title'; Game.ch7CardIn = 0; Game.song = null; }
  },
  climb() {
    const log = [], step = s => log.push(s), god = R.god;
    R.god = true;
    try {
      T41.post(); T.tp('h:1,0', 7, 4); T.skip(); T.noEnemies();
      T41.go(7, 3); T.run(['up'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1); T.skip();
      if (Game.roomId !== 'q:1,2') return 'ingresso: ' + T.where();
      step('atrio');
      // la Girandola, e la prima porta a banderuola
      T41.go(1, 5); R.pushThrough('left', 'q:0,2'); T.skip();
      T41.go(11, 3); if (!T41.act([0, -1], () => Game.s.items.pinwheel)) return 'girandola non presa ' + T.where();
      T41.go(9, 5); T41.blow(-1, 0); if (Game.tiles[5][7] !== '.') return 'porta a ovest chiusa';
      T41.go(3, 5); T41.act([-1, 0], () => Game.s.flags['chest:q_gemme']);
      step('girandola');
      T41.go(14, 5); R.pushThrough('right', 'q:1,2'); T41.go(14, 5); R.pushThrough('right', 'q:2,2'); T.skip();
      // le nuvolette: la nuvola si porta a ovest, poi giù, ci si sale e si va a est
      T41.go(3, 5); T41.blow(-1, 0); T41.blow(0, 1);
      if (!puffAt(Game, 4, 5)) return 'nuvola non arrivata: ' + JSON.stringify(Game.puffs.map(p => [p.x, p.y]));
      T41.go(4, 5); T41.blow(1, 0, 100);
      if (R.cell()[0] !== 13 || Game.roomId !== 'q:2,2') return 'viaggio in nuvola: ' + T.where();
      if (!T41.act([1, 0], () => Game.s.flags['chest:q_strofa_nuvole'])) return 'strofa delle nuvole ' + T.where();
      T41.go(13, 5); T41.blow(-1, 0, 110);
      R.pushThrough('left', 'q:1,2'); T.skip();
      step('nuvolette');
      T41.go(7, 1); R.pushThrough('up', 'q:1,1'); T.skip();
      T41.go(1, 5); R.pushThrough('left', 'q:0,1'); T.skip();
      // le banderuole: ovest (porta 1), nord (la nuvola nel pozzo), sud (porta 2)
      T41.go(12, 5); T41.blow(-1, 0); T41.go(8, 5); T41.blow(0, -1);
      if (!puffAt(Game, 7, 5)) return 'nuvola nel pozzo: ' + JSON.stringify(Game.puffs.map(p => [p.x, p.y]));
      T41.go(5, 5); T41.blow(0, 1); T41.go(2, 5);
      if (!T41.act([-1, 0], () => Game.s.flags['chest:q_strofa_porte'])) return 'strofa delle porte ' + T.where();
      T41.go(5, 5); T41.blow(0, -1); T41.go(8, 5); T41.blow(-1, 0); T41.go(14, 5); R.pushThrough('right', 'q:1,1'); T.skip();
      step('banderuole');
      T41.go(14, 5); R.pushThrough('right', 'q:2,1'); T.skip();
      T41.go(12, 5); T41.blow(1, 0); if (Game.tiles[5][13] !== '.') return 'porta controvento chiusa';
      T41.go(13, 5); if (!T41.act([1, 0], () => Game.s.flags['chest:q_strofa_raffiche'])) return 'strofa delle raffiche ' + T.where();
      T41.go(1, 5); R.pushThrough('left', 'q:1,1'); T.skip();
      step('raffiche');
      if (Game.tiles[0][7] !== '.') return 'porta del trono chiusa con ' + strofaCount(Game);
      T41.go(7, 1); R.pushThrough('up', 'q:1,0'); T.skip();
      if (Game.roomId !== 'q:1,0' || !(Game.boss instanceof Vento)) return 'trono non raggiunto ' + T.where();
      step('trono');
      return log.join(' → ');
    } catch (e) { return (log.join(' → ') || 'inizio') + ' ✗ ' + e.message; } finally { R.god = god; }
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, sfx = Sound.sfx, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } finally { Sound.sfx = sfx; } };
    R.god = true;
    check('Le sale del palazzo sono ben formate; i varchi sui bordi combaciano', () => {
      const bad = [];
      for (const id of T41.ROOMS) {
        const t = ROOMS[id].tiles; if (t.length !== RH || t.some(r => r.length !== RW)) { bad.push(id + ' forma'); continue; }
        const [, a, b] = /^q:(\d+),(\d+)$/.exec(id).map(Number);
        const side = (tt, k) => k === 'N' ? tt[0] : k === 'S' ? tt[RH - 1] : tt.map(r => r[k === 'W' ? 0 : RW - 1]).join('');
        for (const [k, dx, dy, opp] of [['N', 0, -1, 'S'], ['S', 0, 1, 'N'], ['W', -1, 0, 'E'], ['E', 1, 0, 'W']]) {
          const nb = ROOMS['q:' + (a + dx) + ',' + (b + dy)], mine = side(t, k).replace(/[^.]/g, '#');
          if (!nb) { if (/\./.test(mine)) bad.push(id + ' ' + k + ' verso il nulla'); continue; }
          if (mine !== side(nb.tiles, opp).replace(/[^.]/g, '#') && !(id === 'q:1,1' && k === 'N') && !(id === 'q:1,0' && k === 'S')) bad.push(id + ' ' + k);
        }
      }
      return bad.length ? bad.join(', ') : true;
    });
    check('Dal Picco al palazzo (portone di nuvola) e giù per la scala', () => {
      T41.post(); T.tp('h:1,0', 7, 4); T.noEnemies(); if (Game.tiles[2][7] !== 'Z') return 'portone chiuso';
      T41.go(7, 3); T.run(['up'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (Game.roomId !== 'q:1,2' || !Game.s.flags.qIn) return 'ingresso: ' + T.where();
      T.skip(); T.noEnemies(); T.run(['down'], 60); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      const p = Game.player, tl = Game.tiles[Math.floor(p.cy() / TS)][Math.floor(p.cx() / TS)];
      return Game.roomId === 'h:1,0' && tl !== 'Z' ? true : 'uscita: ' + T.where();
    });
    check('La Girandola: una folata dove guardi; la porta a banderuola si apre solo col vento giusto, e mai addosso a Lio', () => {
      T41.post({ qIn: true }); Game.s.items.pinwheel = true; T.tp('q:0,2', 9, 5); T.skip();
      if (Game.tiles[5][7] !== 'J') return 'porta aperta all\'inizio';
      T41.blow(0, -1); if (Game.tiles[5][7] !== 'J') return 'aperta col vento a nord';
      T41.blow(-1, 0); if (Game.tiles[5][7] !== '.' || qDir(Game) !== QD.W) return 'non si apre col vento a ovest';
      Game.player.x = 7 * TS; Game.player.y = 5 * TS - 4; T41.blow(0, 1);
      if (Game.tiles[5][7] !== '.') return 'si è chiusa addosso a Lio';
      Game.player.x = 9 * TS; R.wait(3); return Game.tiles[5][7] === 'J' ? true : 'non si richiude dopo';
    });
    check('Le nuvolette: scivolano col vento fino a un ostacolo; sopra il vuoto fanno da ponte; chi ci sta sopra viaggia con loro', () => {
      T41.post({ qIn: true }); Game.s.items.pinwheel = true; T.tp('q:2,2', 3, 5); T.skip();
      if (Game.tiles[1][8] !== '.' || Game.tiles[5][6] !== '_') return 'stato iniziale';
      T41.blow(-1, 0); if (!puffAt(Game, 4, 1) || Game.tiles[1][8] !== '_' || Game.tiles[1][4] !== '.') return 'a ovest: ' + JSON.stringify(Game.puffs);
      T41.blow(0, 1); if (!puffAt(Game, 4, 5)) return 'giù: ' + JSON.stringify(Game.puffs);
      T41.go(4, 5); const fall0 = Game.player.fallT;
      T41.blow(1, 0, 100); const [cx] = R.cell();
      return cx === 13 && !Game.player.fallT && !fall0 && puffAt(Game, 13, 5) && Game.tiles[5][4] === '_' ? true : 'viaggio: ' + T.where() + ' ' + JSON.stringify(Game.puffs);
    });
    check('La Sala delle Banderuole: ovest, nord, sud — e la strofa', () => {
      T41.post({ qIn: true }); Game.s.items.pinwheel = true; T.tp('q:0,1', 12, 5); T.skip(); T.noEnemies();
      T41.blow(-1, 0); T41.go(8, 5); T41.blow(0, -1); if (!puffAt(Game, 7, 5)) return 'nuvola';
      T41.go(5, 5); T41.blow(0, 1); if (Game.tiles[5][4] !== '.' || !puffAt(Game, 7, 9)) return 'porta sud / nuvola giù';
      T41.go(2, 5); return T41.act([-1, 0], () => Game.s.flags['chest:q_strofa_porte']) ? true : 'strofa ' + T.where();
    });
    check('La Galleria delle Raffiche: il vento del Ciclo 40 spinge anche qui; la porta in fondo si apre soffiando controvento', () => {
      T41.post({ qIn: true }); Game.s.items.pinwheel = true; T.tp('q:2,1', 10, 3); T.skip(); T.noEnemies();
      const W = Game.room.wind; Game.windT = W.period - W.gustLen + 1; const x0 = Game.player.x; T.run([], 20);
      if (!(Game.player.x < x0 - 10)) return 'la raffica non spinge: ' + x0 + '→' + Game.player.x;
      Game.windT = 0; T41.go(12, 5); T41.blow(1, 0);
      return Game.tiles[5][13] === '.' ? true : 'porta chiusa';
    });
    check('Fuori dal palazzo la Girandola non tocca porte e nuvole (e la direzione resta quella di prima)', () => {
      T41.post({ qIn: true }); Game.s.items.pinwheel = true; Game.s.qDir = QD.W; T.tp('o:1,2', 7, 7); T.skip(); T.noEnemies();
      T41.blow(0, 1); return qDir(Game) === QD.W ? true : 'cambiata fuori: ' + qDir(Game);
    });
    check('La Sala delle Voci: otto voci (medaglia); la porta del trono si apre solo con tre strofe', () => {
      const s2 = T41.strofe(); delete s2['chest:q_strofa_raffiche'];
      T41.post(Object.assign({ qIn: true }, s2)); T.tp('q:1,1', 7, 7); T.skip();
      if (Game.tiles[0][7] !== 'J') return 'aperta con 2';
      const d2 = throneDoor(Game).join(' ');
      const all = Object.keys(VOCI).map(k => ROOMS['q:1,1'].signs[k](Game).join(' ')).join(' ');
      const medal = MEDALS.find(m => m.id === 'vocivento').got(Game);
      Game.s.flags['chest:q_strofa_raffiche'] = true; T.tp('q:1,1', 7, 7); T.skip();
      return Game.tiles[0][7] === '.' && /2\/3/.test(d2) && /Raffiche/.test(d2) && medal && /Torno presto/.test(all) ? true : [Game.tiles[0][7], d2, medal].join(' | ');
    });
    check('Il Vento: una copia toccata si sfa (e spinge via Lio) senza contare; quello vero conta; la spada lo prende; la Girandola lo spinge', () => {
      T41.post(Object.assign({ qIn: true, qThroneSeen: true }, T41.strofe())); Game.s.items.pinwheel = true; T.tp('q:1,0', 7, 8); T.skip();
      const V = Game.boss; for (let i = 0; i < 80 && V.state !== 'play'; i++) R.frame([]);
      V.round = 1; V.start(Game); const fake = V.swirls.find(s => !s.real), real = V.swirls.find(s => s.real), p = Game.player;
      p.x = fake.x; p.y = fake.y - 4; const px = p.x; R.frame([]);
      if (!fake.dead || V.round !== 1 || V.decoys !== 1) return 'copia: ' + [fake.dead, V.round, V.decoys];
      real.x = 7 * TS; real.y = 5 * TS; real.pause = 999; p.x = 9 * TS; p.y = 5 * TS - 4; R.faceTo(-1, 0); T41.use('pinwheel');
      for (let i = 0; i < 16; i++) R.frame([]);
      if (!(real.x < 7 * TS - 20)) return 'la Girandola non lo spinge: ' + real.x;
      real.blown = null; p.x = real.x + 18; p.y = real.y - 6; R.faceTo(-1, 0); R.tap('action', 4);
      return V.round === 2 ? true : 'la spada non lo prende: round ' + V.round + ' ' + px;
    });
    check('Terzo round: il Vento lancia foglie che fanno male', () => {
      T41.post(Object.assign({ qIn: true, qThroneSeen: true }, T41.strofe())); T.tp('q:1,0', 7, 8); T.skip();
      const V = Game.boss; for (let i = 0; i < 80 && V.state !== 'play'; i++) R.frame([]);
      V.round = 2; V.start(Game); V.swirls.forEach(s => { s.pause = 9999; }); const real = V.swirls.find(s => s.real); real.x = 7 * TS; real.y = 2 * TS;
      const p = Game.player; p.x = 7 * TS; p.y = 8 * TS - 4; R.god = false; const hp = Game.s.hp;
      for (let i = 0; i < LEAF_T() + 120 && Game.s.hp === hp; i++) R.frame([]);
      R.god = true; return Game.s.hp < hp ? true : 'nessuna foglia ha colpito';
    });
    check('La pace: tre prese, la canzone restituita, il cartello, ch7Done, Brinavalle con le lanterne (tessera libera), l\'aggancio; la Canzone della Valle si suona', () => {
      const r = T41.chase({ god: true }); if (!r.vinta) return 'acchiapparello ' + JSON.stringify(r);
      T41.post(Object.assign({ qIn: true, qThroneSeen: true }, T41.strofe())); T.tp('q:1,0', 7, 8); T.skip();
      const V = Game.boss; for (let i = 0; i < 80 && V.state !== 'play'; i++) R.frame([]);
      V.round = 2; const ear = T41.listen(); V.tagged(Game, V.swirls.find(s => s.real) || new QSwirl(0, 0, true));
      for (let i = 0; i < 400 && Game.state !== 'chapter7'; i++) R.frame([]);
      if (Game.state !== 'chapter7') return 'niente cartello: ' + Game.state;
      R.wait(130); Input.pressed.add('action'); R.frame([]);
      for (let i = 0; i < 120 && (Game.state !== 'play' || Game.roomId !== 'o:1,2'); i++) R.frame([]);
      for (let i = 0; i < 5 && !Game.s.flags.ch7Home; i++) R.frame([]);
      const all = ear.stop(), p = Game.player, tl = Game.tiles[Math.floor(p.cy() / TS)][Math.floor(p.cx() / TS)];
      const diary = CHAPTERS7.every(c => c.done(Game)) && CHAPTERS7.length <= 9;
      const ok1 = Game.s.flags.ch7Done && Game.s.flags.ch7Home && Game.s.flags['song:valle'] && !TILE_SOLID.has(tl) && !TILE_WARP.has(tl) && diary && /tua madre/.test(all) && /stessa canzone/.test(all) && /oltre le montagne/.test(currentObjective(Game));
      if (!ok1) return [Game.s.flags.ch7Done, Game.s.flags.ch7Home, tl, diary, all.slice(0, 50), currentObjective(Game)].join(' / ');
      T.skip(); T.noEnemies(); const ear2 = T41.listen();
      Game.s.equip = 'conch'; Input.pressed.add('item'); R.frame([]); for (const n of SONGS.valle.seq) { Input.pressed.add(NOTE_KEYS[n]); R.frame([]); R.wait(6); } R.wait(60);
      const said = ear2.stop(); T.skip();
      return /padre/.test(said) && !/mare risponde/.test(said) ? true : 'canzone: ' + said.slice(0, 60);
    });
    check('Obiettivo e Segnavia: Girandola → tre strofe → Trono; ogni sala raggiungibile', () => {
      T41.post(); T.tp('h:1,0', 7, 4); const out = [objectiveRoom(Game)];
      const step = x => { if (x.pin) Game.s.items.pinwheel = true; else Object.assign(Game.s.flags, x); out.push(objectiveRoom(Game)); };
      step({ qIn: true }); step({ pin: 1 }); for (const s of STROFE) step({ ['chest:' + s.id]: true }); step({ qWind: true });
      const miss = T41.ROOMS.filter(id => !wayPath(Game, 'h:1,0', id));
      return out.join(',') === 'h:1,0,q:0,2,q:2,2,q:0,1,q:2,1,q:1,0,' && !miss.length ? true : out.join(',') + ' / irraggiungibili: ' + miss.join(' ');
    });
    check('Il bot attraversa il palazzo con input veri: atrio → girandola → nuvolette → banderuole → raffiche → trono', () => {
      const r = T41.climb(); T41.climbLog = r; return /trono$/.test(r) ? true : r;
    });
    check('Tutte le sale si disegnano (anche nell\'acchiapparello); mappa PALAZZO; diario ≤ 9 righe; nessun id di medaglia ripetuto', () => {
      T41.post(Object.assign({ qIn: true }, T41.strofe())); Game.s.items.pinwheel = true;
      for (const id of T41.ROOMS) { T.tp(id, 7, 8); T.skip(); for (let i = 0; i < 200; i++) { Game.update(); Game.render(); Input.endFrame(); if (Game.dialog) T.skip(); if (i === 150) { Game.s.equip = 'pinwheel'; Input.pressed.add('item'); } } T.skip(); }
      const pre = Game.mapPrefix(); Game.state = 'chapter7'; Game.ch7T = 200; Game.render(); Game.state = 'play';
      const ids = MEDALS.map(m => m.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      return pre === 'q:' && CHAPTERS7.length <= 9 && !dup.length && BESTIARY.some(b => b.k === 'vento') ? true : [pre, CHAPTERS7.length, dup.join()].join(' / ');
    });
    R.god = false;
    check('Acchiapparello onesto (niente vita infinita): il bot prende il Vento almeno una volta su 2 a Normale', () => {
      const r = []; for (let i = 0; i < 2; i++) { const x = T41.chase({ diff: 1 }); r.push(x); if (x.vinta) { T41.chaseLog = JSON.stringify(r); return true; } }
      return JSON.stringify(r);
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.boss = null; Game.ch7CardIn = 0; Game.song = null; Game.puffs = [];
    console.table(res);
    return res;
  },
};
window.T41 = T41;
