'use strict';
/* =====================================================================
 *  CICLO 39 — test del Cuore della Terra.   T39.suite()  (con ?test)
 *  T39.duel({ diff, jitter })  il bot accompagna il Cuore con input veri -> { vinta, frame, vita, errori }
 *  T39.climb()                 il bot attraversa il dungeon dalla Sala delle Radici al Cuore
 * ===================================================================== */
const T39 = {
  ROOMS: ['g:1,2', 'g:0,2', 'g:2,2', 'g:1,1', 'g:0,1', 'g:2,1', 'g:1,0'],
  post(extra) {
    T38.post(Object.assign({ ch6Call: true, earthIn: true, brunaHello: true, 'chest:k_stone_miniera': true, 'chest:k_stone_fiume': true, 'chest:k_stone_talpe': true, rootsDoor: true,
      'song:bassa': true, 'song:alta': true, 'song:risveglio': true }, extra || {}));
    Object.assign(Game.s.items, { diapason: true, sundial: true, starlamp: true, conch: true });
    Game.s.wLvl = 'high'; Game.s.obsTime = 'dusk';
  },
  echoes() { const o = {}; ECHOES.forEach(e => { o['chest:' + e.id] = true; }); return o; },
  play(seq) {   // la Conca, tasti veri (come T37.play)
    Game.s.equip = 'conch';
    if (!Game.song) { Input.pressed.add('item'); R.frame([]); }
    for (const n of seq) { Input.pressed.add(NOTE_KEYS[n]); R.frame([]); R.wait(6); }
    for (let i = 0; i < 60 && Game.song && Game.song.done; i++) R.frame([]);
    T.skip();
  },
  use(item) { if (Game.heldKeys) Game.heldKeys.clear(); Game.s.equip = item;   // (svuota i tasti tenuti dal fermo-colpo: un «azione» rimasto da T.skip chiudeva il dialogo appena aperto)
     Input.pressed.add('item'); R.frame([]); },
  /* registra le battute dette (con R.god, R.frame chiude da solo i dialoghi: Game.dialog non basta) */
  listen() { const said = [], say = Game.say; Game.say = function (l) { said.push(...l.filter(x => typeof x === 'string' || (x && x.text)).map(x => x.text || x)); return say.apply(this, arguments); }; return { said, stop: () => { Game.say = say; return said.join(' '); } }; },
  /* cammina fino alla casella, riprovando (walkTo esce subito se il gioco non è in «play», per esempio subito dopo uno scrigno) */
  go(x, y) { for (let k = 0; k < 4; k++) { R.walkTo(x, y); const [cx, cy] = R.cell(); if (cx === x && cy === y && Game.state === 'play') return; R.wait(10); T.skip(); } },
  /* il Lume: prima torna in mano (se era lanciato), poi si lancia verso dx */
  throwLume(dx) { for (let k = 0; k < 3 && lumeOf(Game) && lumeOf(Game).state !== 'held'; k++) { T39.use('starlamp'); R.wait(30); } R.faceTo(dx, 0); T39.use('starlamp'); R.wait(30); },
  /* apre uno scrigno o legge un cartello guardando in una direzione, riprovando come un giocatore */
  act(dir, ok) { const key = dir[0] > 0 ? 'right' : dir[0] < 0 ? 'left' : dir[1] > 0 ? 'down' : 'up'; for (let k = 0; k < 4 && !ok(); k++) { T.skip(); T.run([key], 6); R.faceTo(...dir); Input.pressed.add('action'); T.run([], 5); T.skip(); R.wait(6); } return ok(); },
  clearFoes() { for (let i = 0; i < 2500 && Game.entities.some(e => e.enemy && !e.dead); i++) { const foes = Game.entities.filter(e => e.enemy && !e.dead); R.frame(R.fightStep(foes)); } },
  /* il duello: il bot suona ogni nota quando arriva nel cerchio (con un piccolo errore umano: ± jitter frame) e scansa i massi */
  duel(o) {
    o = Object.assign({ diff: 1, god: false, max: 30000, jitter: 3 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = o.god;
    try {
      T39.post(T39.echoes()); Object.assign(Game.s.flags, { gIn: true }); Game.s.items.potion = false; Game.s.maxHp = Game.s.hp = 14;
      T.tp('g:1,0', 7, 7); T.skip();
      const b = Game.boss; let f = 0, hurt = 0, plan = new Map();
      for (; f < o.max && !Game.s.flags.gHeart && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); continue; }
        const p = Game.player, fx = p.cx(), fy = p.y + 12, keys = [];
        const threat = (Game.rocks || []).filter(r => Math.abs(r.x - fx) < 15 && Math.abs(r.y - fy) < 15);
        if (threat.length) {
          if (Game.song) Input.pressed.add('item');   // smette di suonare per scansarsi
          else {
            const [cx, cy] = [Math.floor(fx / TS), Math.floor(fy / TS)];
            let best = null, bd = -1;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) {
              const x = cx + dx, y = cy + dy; if (x < 1 || x > 14 || y < 4 || y > 9 || tileAt(x, y) !== '.') continue;
              const d = Math.min(...Game.rocks.map(r => Math.hypot(r.x - (x * TS + 8), r.y - (y * TS + 8))));
              if (d > bd) { bd = d; best = [x, y]; }
            }
            if (best) { const gx = best[0] * TS + 8, gy = best[1] * TS + 8; if (Math.abs(gx - fx) > 1) keys.push(gx > fx ? 'right' : 'left'); else if (Math.abs(gy - fy) > 1) keys.push(gy > fy ? 'down' : 'up'); }
          }
        } else if (b.state === 'beat') {
          if (!Game.song) { Game.s.equip = 'conch'; Input.pressed.add('item'); }
          else for (const x of b.beats) {
            if (x.res) continue;
            if (!plan.has(x)) plan.set(x, Math.round((Math.random() * 2 - 1) * o.jitter));
            if (b.clock === x.t + plan.get(x)) { Input.pressed.add(NOTE_KEYS[x.n]); break; }
          }
        }
        const hp0 = Game.s.hp;
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (Game.s.hp < hp0) hurt++;
        if (R.god) Game.s.hp = Game.s.maxHp;
      }
      return { vinta: !!Game.s.flags.gHeart, frame: f, vita: Game.s.hp + '/' + Game.s.maxHp, errori: b.errors, colpi: hurt, perfetto: !!Game.s.flags.gPerfect };
    } finally { Opts.diff = keep; R.god = god; T.skip(); if (Game.state !== 'chapter6') Game.state = 'title'; Game.state = 'title'; Game.ch6CardIn = 0; Game.song = null; Game.rocks = []; }
  },
  climb() {
    const log = [], step = s => log.push(s), god = R.god;
    R.god = true;
    try {
      T39.post(); T.tp('k:1,2', 7, 4); T.skip();
      T39.go(7, 5); T.run(['down'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1); T.skip();
      if (Game.roomId !== 'g:1,2') return 'ingresso: ' + Game.roomId;
      step('soglia');
      // il Geode: due cristalli fatti cantare col Diapason
      T39.go(1, 5); R.pushThrough('left', 'g:0,2'); T.skip();
      for (const x of [3, 11]) { R.walkTo(x, 4); R.faceTo(0, -1); T39.use('diapason'); R.wait(40); T.skip(); }
      if (!Game.s.flags.gGeode) return 'geode non risolto ' + JSON.stringify(Game.geode);
      T39.go(2, 5); if (!T39.act([-1, 0], () => Game.s.flags['chest:g_eco_cielo'])) return 'eco del cielo non presa ' + T.where();
      step('geode');
      // le Ore Sepolte: notte per la porta, giorno per il ponte
      T39.go(14, 5); R.pushThrough('right', 'g:1,2'); T39.go(14, 5); R.pushThrough('right', 'g:2,2'); T.skip();
      T39.clearFoes();   // Ciclo 41: l'Astrino, di notte, può sbalzare il bot giù dal bordo dei ponti (una volta su ~10 dopo una regressione completa)
      T39.go(3, 5);
      for (let k = 0; k < 4 && obsTime(Game) !== 'night'; k++) { T39.use('sundial'); R.wait(62); T.skip(); }
      if (Game.tiles[5][7] !== '.') return 'porta della luna chiusa (' + obsTime(Game) + ')';
      T39.go(9, 2);
      for (let k = 0; k < 4 && obsTime(Game) !== 'day'; k++) { T39.use('sundial'); R.wait(62); T.skip(); }
      if (Game.tiles[2][11] !== '.') return 'ponte del sole assente (' + obsTime(Game) + ')';
      T39.go(14, 2); if (!T39.act([0, -1], () => Game.s.flags['chest:g_eco_ore'])) return 'eco delle ore non presa ' + T.where();
      T39.go(9, 2);
      for (let k = 0; k < 4 && obsTime(Game) !== 'night'; k++) { T39.use('sundial'); R.wait(62); T.skip(); }
      step('ore');
      T39.go(1, 5); R.pushThrough('left', 'g:1,2'); T.skip();
      T39.go(7, 1); R.pushThrough('up', 'g:1,1'); T.skip();
      // le Radici Buie: il Lume due volte sul vetro, poi il muro d'ombra
      T39.go(1, 5); R.pushThrough('left', 'g:0,1'); T.skip();
      T39.go(14, 5); T39.throwLume(-1);
      T39.go(10, 5); T39.throwLume(-1);
      T39.go(6, 5);
      if (!Game.s.flags['shadow:g_radici']) T39.throwLume(-1);
      if (!Game.s.flags['shadow:g_radici']) return "muro d'ombra " + T.where();
      T39.go(3, 5); if (!T39.act([-1, 0], () => Game.s.flags['chest:g_eco_luce'])) return 'eco della luce non presa ' + T.where();
      step('radici');
      // la Vena: marea bassa, marea alta, risveglio
      // per tornare: il Lume davanti, sul vetro, due volte (come all'andata)
      T39.go(7, 5); T39.throwLume(1);
      T39.go(12, 5); T39.throwLume(1);
      T39.go(14, 5); R.pushThrough('right', 'g:1,1'); T39.go(14, 5); R.pushThrough('right', 'g:2,1'); T.skip();
      T39.clearFoes();   // un colpo interrompe il canto: prima si ripulisce la sala, poi si riprova se serve
      T39.go(2, 5); for (let k = 0; k < 3 && wLvl(Game) !== 'low'; k++) T39.play(SONGS.bassa.seq); if (wLvl(Game) !== 'low') return 'marea bassa';
      T39.go(8, 5); for (let k = 0; k < 3 && wLvl(Game) !== 'high'; k++) T39.play(SONGS.alta.seq); if (wLvl(Game) !== 'high') return 'marea alta';
      T39.go(12, 5); for (let k = 0; k < 3 && !Game.s.flags['awake:g_vena']; k++) { T39.play(SONGS.risveglio.seq); R.wait(60); T.skip(); }
      if (!Game.s.flags['awake:g_vena']) return 'statua non risvegliata';
      T39.go(13, 5); if (!T39.act([1, 0], () => Game.s.flags['chest:g_eco_mare'])) return 'eco del mare non presa ' + T.where();
      step('vena');
      T39.go(9, 5); for (let k = 0; k < 3 && wLvl(Game) !== 'low'; k++) T39.play(SONGS.bassa.seq); T39.go(1, 5); R.pushThrough('left', 'g:1,1'); T.skip();
      if (Game.tiles[0][7] !== '.') return 'porta della Camera chiusa con ' + echoCount(Game) + ' eco';
      T39.go(7, 1); R.pushThrough('up', 'g:1,0'); T.skip();
      if (Game.roomId !== 'g:1,0' || !(Game.boss instanceof Terra)) return 'cuore non raggiunto: ' + Game.roomId;
      step('cuore');
      return log.join(' → ');
    } catch (e) { return (log.join(' → ') || 'inizio') + ' ✗ ' + e.message; } finally { R.god = god; }
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, sfx = Sound.sfx, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } finally { Sound.sfx = sfx; } };
    R.god = true;
    check('Le sale del Cuore sono ben formate; i varchi sui bordi combaciano con le sale vicine', () => {
      const bad = [];
      for (const id of T39.ROOMS) {
        const t = ROOMS[id].tiles; if (t.length !== RH || t.some(r => r.length !== RW)) { bad.push(id + ' forma'); continue; }
        const [, a, b] = /^g:(\d+),(\d+)$/.exec(id).map(Number);
        const side = (tt, k) => k === 'N' ? tt[0] : k === 'S' ? tt[RH - 1] : tt.map(r => r[k === 'W' ? 0 : RW - 1]).join('');
        for (const [k, dx, dy, opp] of [['N', 0, -1, 'S'], ['S', 0, 1, 'N'], ['W', -1, 0, 'E'], ['E', 1, 0, 'W']]) {
          const nb = ROOMS['g:' + (a + dx) + ',' + (b + dy)], mine = side(t, k).replace(/[^.]/g, '#');
          if (!nb) { if (/\./.test(mine) && !(id === 'g:1,2' && k === 'S')) bad.push(id + ' ' + k + ' verso il nulla'); continue; }
          if (mine !== side(nb.tiles, opp).replace(/[^.]/g, '#') && !(id === 'g:1,1' && k === 'N') && !(id === 'g:1,0' && k === 'S')) bad.push(id + ' ' + k);
        }
      }
      return bad.length ? bad.join(', ') : true;
    });
    check('Dalla Sala delle Radici alla Soglia (porta aperta), e su per la scala di nuovo fuori', () => {
      T39.post(); T.tp('k:1,2', 7, 4); if (Game.tiles[6][7] !== 'Z') return 'porta chiusa';
      R.walkTo(7, 5); T.run(['down'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (Game.roomId !== 'g:1,2' || !Game.dialog || !Game.s.flags.gIn) return 'ingresso: ' + Game.roomId;
      T.skip(); T.noEnemies(); T.run(['down'], 60); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      return Game.roomId === 'k:1,2' && Game.tiles[Math.floor(Game.player.cy() / TS)][Math.floor(Game.player.cx() / TS)] !== 'Z' ? true : 'uscita: ' + T.where();
    });
    check('Il Geode: il Diapason fa cantare un cristallo e i suoi vicini; tutti accesi, compare l\'Eco del Cielo', () => {
      T39.post({ gIn: true }); T.tp('g:0,2', 3, 4); T.skip(); T.noEnemies();
      if (Game.geode.join() !== GEODE_START.join()) return 'stato iniziale ' + Game.geode;
      R.faceTo(0, -1); T39.use('diapason'); R.wait(40); T.skip();
      if (Game.geode.join() !== 'true,false,false,true,true,false') return 'dopo il primo: ' + Game.geode;
      if (Game.entities.some(e => e instanceof Chest && e.def.id === 'g_eco_cielo')) return 'scrigno troppo presto';
      const ear = T39.listen(); R.walkTo(11, 4); R.faceTo(0, -1); T39.use('diapason'); R.wait(40); const heard = ear.stop();
      if (!Game.s.flags.gGeode || !/sei cristalli cantano/.test(heard)) return 'non risolto: ' + Game.geode + ' / ' + heard.slice(0, 40);
      T.skip(); R.walkTo(2, 5);
      if (!T39.act([-1, 0], () => Game.s.flags['chest:g_eco_cielo'])) return 'eco non presa';
      T.tp('g:0,2', 7, 5); return Game.geode.every(Boolean) ? true : 'rientrando il geode si spegne';
    });
    check('Le Ore Sepolte: la Meridiana gira le ore quaggiù; la luna apre la porta, il sole e il tramonto fanno i due ponti', () => {
      T39.post({ gIn: true }); T.tp('g:2,2', 3, 5); T.skip(); T.noEnemies();
      const st = () => [obsTime(Game), Game.tiles[5][7], Game.tiles[2][11], Game.tiles[8][11]].join('');
      const out = [st()];
      for (let k = 0; k < 3; k++) { T39.use('sundial'); R.wait(62); T.skip(); out.push(st()); }
      return out.includes('night.__') && out.includes('dayJ._') && out.includes('duskJ_.') ? true : out.join(' ');
    });
    check('Le Radici Buie: buio; il Lume lanciato accende il vetro sulla voragine; il muro d\'ombra si dissolve', () => {
      T39.post({ gIn: true }); T.tp('g:0,1', 14, 5); T.skip(); T.noEnemies();
      if (Game.tiles[5][11] !== '_') return 'vetro acceso senza luce';
      R.faceTo(-1, 0); T39.use('starlamp'); R.wait(30);
      if (Game.tiles[5][11] !== '.') return 'il Lume non accende il vetro';
      Game.player.x = 7 * TS; Game.player.y = 5 * TS - 4; T39.use('starlamp'); R.wait(30); R.faceTo(-1, 0); T39.use('starlamp'); R.wait(40);
      return Game.s.flags['shadow:g_radici'] ? true : 'muro d\'ombra ancora lì';
    });
    check('La Vena: le maree del Tempio funzionano anche qui; il Risveglio sposta la statua e scopre l\'Eco del Mare', () => {
      T39.post({ gIn: true }); T.tp('g:2,1', 2, 5); T.skip(); T.noEnemies();
      if (Game.tiles[5][5] !== '~' || Game.tiles[5][11] !== '.') return 'acqua alta: ' + Game.tiles[5].join('');
      T39.play(SONGS.bassa.seq); if (Game.tiles[5][5] !== '.' || Game.tiles[5][11] !== '_') return 'marea bassa: ' + Game.tiles[5].join('');
      T39.play(SONGS.alta.seq); Game.player.x = 12 * TS; Game.player.y = 5 * TS - 4;
      if (Game.entities.some(e => e instanceof Chest && e.def.id === 'g_eco_mare')) return 'eco già visibile';
      T39.play(SONGS.risveglio.seq); R.wait(60); T.skip();
      const st = Game.entities.find(e => e instanceof CoralStatue);
      return Game.s.flags['awake:g_vena'] && st.y === 2 * TS && Game.entities.some(e => e instanceof Chest && e.def.id === 'g_eco_mare') ? true : 'statua ' + (st && st.y);
    });
    check('Fuori dalle sale «prestate» gli strumenti non fanno niente (Meridiana, Lume, maree)', () => {
      T39.post({ gIn: true }); T.tp('g:1,1', 7, 7); T.skip(); T.noEnemies();
      T39.use('sundial'); R.wait(5); const t0 = obsTime(Game);
      T39.use('starlamp'); R.wait(5); const lume = Game.entities.some(e => e instanceof Lume && e.state !== 'held');
      T39.play(SONGS.bassa.seq);
      return t0 === 'dusk' && !lume && wLvl(Game) === 'high' ? true : [t0, lume, wLvl(Game)].join();
    });
    check('La Camera del Battito: la porta nord si apre solo con quattro Eco; l\'altare insegna il Canto della Terra', () => {
      const e3 = T39.echoes(); delete e3['chest:g_eco_mare'];
      T39.post(Object.assign({ gIn: true }, e3)); T.tp('g:1,1', 7, 7); T.skip();
      if (Game.tiles[0][7] !== 'J') return 'aperta con 3';
      const a3 = altar(Game).join(' ');
      Game.s.flags['chest:g_eco_mare'] = true; T.tp('g:1,1', 7, 7); T.skip();
      const a4 = altar(Game).join(' ');
      return Game.tiles[0][7] === '.' && /3\/4/.test(a3) && /Vena/.test(a3) && a4.includes('▼ ◀ ▲ ▶') ? true : [Game.tiles[0][7], a3, a4].join(' | ');
    });
    check('Il duello: la nota giusta sul battito avanza; sbagliata o fuori tempo fa cadere un masso e toglie una nota; un battito saltato non punisce', () => {
      T39.post(Object.assign({ gIn: true, gHeartSeen: true }, T39.echoes())); T.tp('g:1,0', 7, 7); T.skip();
      const b = Game.boss; if (!(b instanceof Terra)) return 'niente Cuore';
      for (let i = 0; i < 80 && b.state !== 'beat'; i++) R.frame([]);
      Game.s.equip = 'conch'; Input.pressed.add('item'); R.frame([]);
      const at = (k) => { const x = b.beats.filter(y => !y.res)[0]; while (b.clock < x.t + k) R.frame([]); return x; };
      let x = at(0); Input.pressed.add(NOTE_KEYS[x.n]); R.frame([]);
      if (b.prog !== 1 || x.res !== 'hit') return 'nota giusta: ' + b.prog + ' ' + x.res;
      x = at(0); Input.pressed.add(NOTE_KEYS[(x.n + 1) % 4]); R.frame([]);
      if (b.prog !== 0 || x.res !== 'miss' || Game.rocks.length !== 1 || b.errors !== 1) return 'nota sbagliata: ' + [b.prog, x.res, Game.rocks.length, b.errors];
      Game.rocks = [];
      x = at(0); const skipW = terraWin(0) + 2; while (b.clock < x.t + skipW) R.frame([]);
      if (x.res !== 'skip' || b.errors !== 1 || Game.rocks.length) return 'battito saltato: ' + [x.res, b.errors, Game.rocks.length];
      x = b.beats.filter(y => !y.res)[0]; while (b.clock < x.t - terraWin(0) - 6) R.frame([]);
      Input.pressed.add(NOTE_KEYS[x.n]); R.frame([]);
      return b.errors === 2 && Game.rocks.length === 1 && !x.res ? true : 'fuori tempo: ' + [b.errors, Game.rocks.length, x.res];
    });
    check('La spada non ferisce il Cuore della Terra', () => {
      T39.post(Object.assign({ gIn: true, gHeartSeen: true }, T39.echoes())); T.tp('g:1,0', 7, 4); T.skip();
      const b = Game.boss, hp = b.hp; R.faceTo(0, -1); for (let i = 0; i < 4; i++) { R.tap('action', 30); T.skip(); }
      return b.hp === hp && b.toldSword ? true : 'hp ' + hp + '→' + b.hp + ' detto ' + !!b.toldSword;
    });
    check('Anche la Madre delle Acque si raggiunge con la spada: la sua battuta del Ciclo 37 ora esce giocando (prima la spada colpiva solo i nemici)', () => {
      T37.post(); T37.learnAll(); Game.s.flags.wIn = true; T.tp('w:1,0', 7, 3); T.skip();
      const b = Game.boss; if (!(b instanceof Madre)) return 'niente Madre';
      const ear = T39.listen(); R.faceTo(0, -1); R.tap('action', 30); const heard = ear.stop(); T.skip();
      return b.toldSword && /attraversa/.test(heard) && b.calm === 0 ? true : 'detto ' + !!b.toldSword + ' ' + heard.slice(0, 30);
    });
    check('La pace: tre round, la riconciliazione, il cartello, ch6Done, Brinavalle in festa (tessera libera), l\'aggancio; diario completo', () => {
      const r = T39.duel({ god: true }); if (!r.vinta) return 'duello ' + JSON.stringify(r);
      T39.post(Object.assign({ gIn: true, gHeartSeen: true }, T39.echoes())); T.tp('g:1,0', 7, 7); T.skip();
      const b = Game.boss; b.round = 2; b.prog = TERRA_NEED - 1; b.state = 'beat'; b.clock = 0; b.beats = []; b.fill();
      Game.s.equip = 'conch'; Input.pressed.add('item'); R.frame([]);
      const x = b.beats[0]; while (b.clock < x.t) R.frame([]); Input.pressed.add(NOTE_KEYS[x.n]); R.frame([]);
      for (let i = 0; i < 120 && !Game.s.flags.gHeart; i++) { R.frame([]); }
      const lines = []; for (let i = 0; i < 40 && Game.dialog; i++) { lines.pushT38.text(); T.skip(); }
      for (let i = 0; i < 90 && Game.state !== 'chapter6'; i++) R.frame([]);
      if (Game.state !== 'chapter6') return 'niente cartello: ' + Game.state + ' gHeart ' + Game.s.flags.gHeart;
      R.wait(130); const ear = T39.listen(); Input.pressed.add('action'); R.frame([]);
      for (let i = 0; i < 120 && (Game.state !== 'play' || Game.roomId !== 'o:1,2'); i++) R.frame([]);
      for (let i = 0; i < 5 && !Game.dialog; i++) R.frame([]);
      const p = Game.player, tile = Game.tiles[Math.floor(p.cy() / TS)][Math.floor(p.cx() / TS)];
      const all = ear.stop(); T.skip();
      const diary = CHAPTERS6.every(c => c.done(Game)) && CHAPTERS6.length <= 9;
      return Game.s.flags.ch6Done && Game.s.flags.ch6Home && Game.roomId === 'o:1,2' && !TILE_SOLID.has(tile) && !TILE_WARP.has(tile) && diary && !Game.boss && /QUATTRO/.test(all) && /vento/.test(currentObjective(Game))
        ? true : [Game.s.flags.ch6Done, Game.s.flags.ch6Home, Game.roomId, tile, diary, all.slice(0, 40), currentObjective(Game)].join(' / ');
    });
    check('Obiettivo e Segnavia: Soglia → quattro Eco → Cuore; ogni sala raggiungibile', () => {
      T39.post(); T.tp('k:1,2', 7, 4); const out = [objectiveRoom(Game)];
      const step = x => { Object.assign(Game.s.flags, x); out.push(objectiveRoom(Game)); };
      step({ gIn: true }); for (const e of ECHOES) step({ ['chest:' + e.id]: true }); step({ gHeart: true });
      const miss = T39.ROOMS.filter(id => !wayPath(Game, 'k:1,2', id));
      const want = 'k:1,2,g:0,2,g:2,2,g:0,1,g:2,1,g:1,0,';
      return out.join(',') === want && !miss.length && objectiveChest(Game) !== 'eco' ? true : out.join(',') + ' / irraggiungibili: ' + miss.join(' ');
    });
    check('Il bot attraversa il Cuore con input veri: soglia → geode → ore → radici → vena → cuore', () => {
      const r = T39.climb(); T39.climbLog = r; return /cuore$/.test(r) ? true : r;
    });
    check('Tutte le sale si disegnano (anche nel duello con la Conca aperta); mappa CUORE; diario ≤ 9 righe; nessun id di medaglia ripetuto', () => {
      T39.post(Object.assign({ gIn: true }, T39.echoes()));
      for (const id of T39.ROOMS) { T.tp(id, 7, 8); T.skip(); for (let i = 0; i < 200; i++) { Game.update(); Game.render(); Input.endFrame(); if (Game.dialog) T.skip(); if (i === 150) { Game.s.equip = 'conch'; Input.pressed.add('item'); } } Game.song = null; T.skip(); }
      const pre = Game.mapPrefix(); Game.state = 'chapter6'; Game.ch6T = 200; Game.render(); Game.state = 'play';
      const ids = MEDALS.map(m => m.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      return pre === 'g:' && CHAPTERS6.length <= 9 && !dup.length && BESTIARY.some(b => b.k === 'terra') ? true : [pre, CHAPTERS6.length, dup.join()].join(' / ');
    });
    R.god = false;
    check('Duello onesto (niente vita infinita): il bot accompagna il Cuore almeno una volta su 2 a Normale', () => {
      const r = []; for (let i = 0; i < 2; i++) { const x = T39.duel({ diff: 1 }); r.push(x); if (x.vinta) { T39.duelLog = JSON.stringify(r); return true; } }
      return JSON.stringify(r);
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.boss = null; Game.ch6CardIn = 0; Game.song = null; Game.rocks = [];
    console.table(res);
    return res;
  },
};
window.T39 = T39;
