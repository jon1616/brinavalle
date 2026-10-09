'use strict';
/* =====================================================================
 *  CICLO 43 — rifinitura: i finali provati con un «giocatore umano» simulato.   T43.suite()  (con ?test)
 *  Il bot dei cicli 37/39/41 era un giocatore perfetto (tempo esatto, percorso perfetto).
 *  Qui invece il bot:
 *    · REAGISCE IN RITARDO: vede le cose con REACT frame di ritardo (15 frame = 250 ms);
 *    · ha la MANO IMPRECISA: il tempo delle note è sfasato a caso, con deviazione SIGMA frame;
 *    · SBAGLIA ogni tanto una freccia (WRONG).
 *  T43.terra({ diff, sigma, wrong })  → { vinta, frame, errori, colpi, vita }
 *  T43.vento({ diff })                → { vinta, frame, copie, colpi, vita }
 *  T43.madre({ diff })                → { vinta, frame, errori, colpi, vita }
 *  T43.table()                        tutte e tre a ogni difficoltà, più volte (per l'HANDOFF)
 * ===================================================================== */
const T43 = {
  REACT: 15,
  gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
  /* il Cuore della Terra: suona sul battito (con imprecisione), si accorge dei massi con REACT frame di ritardo */
  terra(o) {
    o = Object.assign({ diff: 1, sigma: 4, wrong: 0.05, max: 40000 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = false;
    try {
      T39.post(Object.assign({ gIn: true, gHeartSeen: true }, T39.echoes())); Game.s.items.potion = false; Game.s.maxHp = Game.s.hp = 14;
      T.tp('g:1,0', 7, 7); T.skip();
      const b = Game.boss, plan = new Map(), seen = new Map(); let f = 0, hurt = 0, resumeAt = 0;
      for (; f < o.max && !Game.s.flags.gHeart && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); continue; }
        const p = Game.player, fx = p.cx(), fy = p.y + 12, keys = [];
        // i massi: l'ombra si nota solo dopo REACT frame
        for (const r of Game.rocks || []) if (!seen.has(r)) seen.set(r, f);
        const threat = (Game.rocks || []).filter(r => f - seen.get(r) >= T43.REACT && Math.abs(r.x - fx) < 15 && Math.abs(r.y - fy) < 15);
        if (threat.length) {
          resumeAt = f + 20 + T43.REACT;
          if (Game.song) Input.pressed.add('item');
          else {
            const [cx, cy] = [Math.floor(fx / TS), Math.floor(fy / TS)]; let best = null, bd = -1;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const x = cx + dx, y = cy + dy; if (x < 1 || x > 14 || y < 4 || y > 9 || tileAt(x, y) !== '.') continue;
              const d = Math.min(...Game.rocks.map(r => Math.hypot(r.x - (x * TS + 8), r.y - (y * TS + 8)))); if (d > bd) { bd = d; best = [x, y]; }
            }
            if (best) { const gx = best[0] * TS + 8, gy = best[1] * TS + 8; if (Math.abs(gx - fx) > 1) keys.push(gx > fx ? 'right' : 'left'); else if (Math.abs(gy - fy) > 1) keys.push(gy > fy ? 'down' : 'up'); }
          }
        } else if (b.state === 'beat' && f >= resumeAt) {
          if (!Game.song) { Game.s.equip = 'conch'; Input.pressed.add('item'); resumeAt = f + T43.REACT; }   // riprende a suonare (ci mette un attimo)
          else for (const x of b.beats) {
            if (x.res) continue;
            if (!plan.has(x)) plan.set(x, { off: Math.round(T43.gauss() * o.sigma), n: Math.random() < o.wrong ? (x.n + 1 + (Math.random() * 3 | 0)) % 4 : x.n });
            const pl = plan.get(x); if (b.clock === x.t + pl.off) { Input.pressed.add(NOTE_KEYS[pl.n]); break; }
            if (x.t + pl.off < b.clock) continue;
            break;
          }
        }
        const hp0 = Game.s.hp;
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (Game.s.hp < hp0) hurt++;
      }
      return { vinta: !!Game.s.flags.gHeart, frame: f, errori: b.errors, colpi: hurt, vita: Game.s.hp + '/' + Game.s.maxHp };
    } finally { Opts.diff = keep; R.god = god; T.skip(); Game.state = 'title'; Game.ch6CardIn = 0; Game.song = null; Game.rocks = []; }
  },
  /* il Vento: insegue la posizione vista REACT frame fa; ogni tanto scambia una copia per quello vero */
  vento(o) {
    o = Object.assign({ diff: 1, confuse: 0.3, dodge: true, max: 30000 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = false;
    try {
      T41.post(T41.strofe()); Object.assign(Game.s.flags, { qIn: true, qThroneSeen: true }); Game.s.items.pinwheel = true; Game.s.items.potion = false; Game.s.maxHp = Game.s.hp = 14;
      T.tp('q:1,0', 7, 8); T.skip();
      const V = Game.boss, hist = [], leafSeen = new Map(); let f = 0, hurt = 0, pth = null, pthT = 0, target = null, pickT = 0;
      for (; f < o.max && !Game.s.flags.qWind && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); target = null; continue; }
        const p = Game.player, keys = [];
        const live = V.state === 'play' ? V.swirls.filter(s => !s.dead) : [];
        if (!target || target.dead || --pickT <= 0) { target = live.find(s => s.real) || null; if (target && live.length > 1 && Math.random() < o.confuse) target = live.find(s => !s.real); pickT = 90; }   // a volte si sbaglia mulinello
        hist.push(target ? [target.cx(), target.cy()] : null); if (hist.length > T43.REACT) hist.shift();
        const seenAt = hist[0];
        // le foglie: una persona le vede arrivare (con REACT frame di ritardo) e fa un passo di lato
        for (const L of V.leaves || []) if (!leafSeen.has(L)) leafSeen.set(L, f);
        const leaf = o.dodge && (V.leaves || []).find(L => f - leafSeen.get(L) >= T43.REACT && Math.hypot(L.x - p.cx(), L.y - p.cy()) < 44 && (L.vx * (p.cx() - L.x) + L.vy * (p.cy() - L.y)) > 0);
        if (leaf) { const side = leaf.vx * (p.cy() - leaf.y) - leaf.vy * (p.cx() - leaf.x) >= 0 ? 1 : -1, sx = -leaf.vy * side, sy = leaf.vx * side; if (Math.abs(sx) > 0.3) keys.push(sx > 0 ? 'right' : 'left'); if (Math.abs(sy) > 0.3) keys.push(sy > 0 ? 'down' : 'up'); }
        else if (seenAt) {
          const dx = seenAt[0] - p.cx(), dy = seenAt[1] - p.cy(), d = Math.hypot(dx, dy);
          if (d < 28) { if (Math.abs(dx) > 2) keys.push(dx > 0 ? 'right' : 'left'); if (Math.abs(dy) > 2) keys.push(dy > 0 ? 'down' : 'up'); }
          else {
            if (!pth || --pthT <= 0) { pth = R.path([Math.floor(seenAt[0] / TS), Math.floor(seenAt[1] / TS)]); pthT = 12; }
            const nx = pth && pth[0];
            if (nx) { const [cx, cy] = R.cell(); if (nx[0] === cx && nx[1] === cy) pth.shift(); const n2 = pth[0] || nx, gx = n2[0] * TS + 8, gy = n2[1] * TS + 8; if (Math.abs(gx - p.cx()) > 2) keys.push(gx > p.cx() ? 'right' : 'left'); else if (Math.abs(gy - p.cy()) > 2) keys.push(gy > p.cy() ? 'down' : 'up'); }
          }
        }
        const hp0 = Game.s.hp;
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (Game.s.hp < hp0) hurt++;
      }
      return { vinta: !!Game.s.flags.qWind, frame: f, copie: V.decoys, colpi: hurt, vita: Game.s.hp + '/' + Game.s.maxHp };
    } finally { Opts.diff = keep; R.god = god; T.skip(); Game.state = 'title'; Game.ch7CardIn = 0; Game.song = null; }
  },
  /* la Madre delle Acque: ripete la frase con una nota ogni 20-35 frame (una persona che pensa), a volte sbaglia */
  madre(o) {
    o = Object.assign({ diff: 1, wrong: 0.04, max: 40000 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = false;
    try {
      T37.post(); T37.learnAll(); Object.assign(Game.s.flags, { wIn: true }); Game.s.items.potion = false; Game.s.maxHp = Game.s.hp = 14;
      T.tp('w:1,0', 6, 6); T.skip();
      const b = Game.boss; let f = 0, hurt = 0, nextAt = 0, startAt = -1;
      for (; f < o.max && !Game.s.flags.wMother && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); continue; }
        const p = Game.player, keys = [];
        const dx = 6 * TS + 8 - p.cx(), dy = 6 * TS + 8 - p.cy();
        if (Math.abs(dx) > 2) keys.push(dx > 0 ? 'right' : 'left'); else if (Math.abs(dy) > 2) keys.push(dy > 0 ? 'down' : 'up');
        if (b.state === 'listen' && !keys.length) {
          if (startAt < 0) startAt = f + T43.REACT;
          Game.s.equip = 'conch';
          if (f >= startAt) {
            if (!Game.song) { Input.pressed.add('item'); nextAt = f + T43.REACT; }
            else if (f >= nextAt) { const n = b.phrase[b.heard]; Input.pressed.add(NOTE_KEYS[Math.random() < o.wrong ? (n + 1) % 4 : n]); nextAt = f + 20 + (Math.random() * 15 | 0); }
          }
        } else if (b.state !== 'listen') startAt = -1;
        const hp0 = Game.s.hp;
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (Game.s.hp < hp0) hurt++;
      }
      return { vinta: !!Game.s.flags.wMother, frame: f, errori: b.fails, colpi: hurt, vita: Game.s.hp + '/' + Game.s.maxHp };
    } finally { Opts.diff = keep; R.god = god; T.skip(); Game.state = 'title'; Game.ch5CardIn = 0; Game.song = null; }
  },
/* Ciclo 43: le tappe di T42 più i passi DENTRO i miei sei dungeon (oggetti compresi: { _it: 'conch' }).
     T42 salta i passi interni, e l'obiettivo delle strofe del Palazzo era troncato in pausa («...la Galleria delle»). */
  INNER: {
    towerIn: [{ _it: 'diapason' }, { towerEcho: true }, { 'veil:t_atrio': true }, { towerChoir: true }],
    vIn: [{ _it: 'sundial' }, { _it: 'vlens' }, { vStars: true }, { vArmilla: true }],
    craterOpen: [{ fIn: true }, { _it: 'starlamp' }, { 'chest:f_pearl_vetro': true }, { 'chest:f_pearl_marea': true }, { 'chest:f_pearl_ombra': true }, { fUmbra: true }],
    templeOpen: [{ wIn: true }, { _it: 'conch' }, { 'song:bassa': true }, { 'song:risveglio': true }, { wAwake: true }, { 'song:alta': true }],
    rootsDoor: [{ gIn: true }, { 'chest:g_eco_cielo': true }, { 'chest:g_eco_ore': true }, { 'chest:g_eco_luce': true }, { 'chest:g_eco_mare': true }],
    windSeen: [{ qIn: true }, { _it: 'pinwheel' }, { 'chest:q_strofa_nuvole': true }, { 'chest:q_strofa_porte': true }, { 'chest:q_strofa_raffiche': true }],
  },
  steps() { const out = []; for (const st of T42.STEPS) { out.push(st); const k = Object.keys(st).find(x => T43.INNER[x]); if (k) out.push(...T43.INNER[k]); } return out; },
  sagaCheck() {
    T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true }); const bad = [];
    for (const st of T43.steps()) {
      if (st._it) Game.s.items[st._it] = true; else Object.assign(Game.s.flags, st);
      T.tp('o:1,2', 7, 6); Game.dialog = null;
      const o = currentObjective(Game), lines = wrap(o || '', 138, 11).length, room = objectiveRoom(Game), name = st._it ? 'oggetto ' + st._it : Object.keys(st)[0];
      if (!o) bad.push(name + ': obiettivo vuoto');
      if (lines > 4) bad.push(name + ': ' + lines + ' righe («' + o.slice(0, 50) + '…»)');
      if (room && room !== Game.roomId && !wayPath(Game, 'o:1,2', room)) bad.push(name + ': meta ' + room + ' irraggiungibile');
    }
    Game.state = 'title';
    return bad.length ? bad.join(' | ') : true;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Tutta la saga, anche DENTRO i dungeon (oggetti compresi): ogni obiettivo sta nelle 4 righe della pausa e ogni meta è raggiungibile', () => T43.sagaCheck());
    check('Il giocatore «umano» (reazione 250 ms, mano imprecisa) accompagna il Cuore della Terra a Normale', () => {
      const r = []; for (let i = 0; i < 2; i++) { const x = T43.terra({ diff: 1 }); r.push(x); if (x.vinta) return true; } return JSON.stringify(r);
    });
    check('Il giocatore «umano» (in ritardo, a volte insegue una copia, schiva le foglie) prende il Vento a Normale', () => {
      const r = []; for (let i = 0; i < 3; i++) { const x = T43.vento({ diff: 1 }); r.push(x); if (x.vinta) return true; } return JSON.stringify(r);
    });
    check('Il giocatore «umano» (pensa tra una nota e l\'altra, a volte stona) calma la Madre delle Acque a Normale', () => {
      const r = []; for (let i = 0; i < 2; i++) { const x = T43.madre({ diff: 1 }); r.push(x); if (x.vinta) return true; } return JSON.stringify(r);
    });
    check('Le foglie del Vento hanno un preavviso: il mulinello vero si illumina prima di ogni lancio', () => {
      R.god = true; T41.post(Object.assign({ qIn: true, qThroneSeen: true }, T41.strofe())); T.tp('q:1,0', 7, 8); T.skip();
      const V = Game.boss; for (let i = 0; i < 80 && V.state !== 'play'; i++) R.frame([]);
      V.round = 2; V.start(Game); V.swirls.forEach(s => { s.pause = 9999; }); const real = V.swirls.find(s => s.real);
      let warned = 0, thrown = 0;
      for (let i = 0; i < LEAF_T() + 10 && !thrown; i++) { R.frame([]); if (real.warn > 0) warned = Math.max(warned, real.warn); thrown = V.leaves.length; }
      R.god = god; return thrown && warned >= LEAF_WARN - 2 ? true : 'preavviso ' + warned + ' foglie ' + thrown;
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.boss = null; Game.song = null;
    console.table(res);
    return res;
  },
  table(n) {
    n = n || 4; const out = {};
    for (const [k, fn] of [['terra', T43.terra], ['vento', T43.vento], ['madre', T43.madre]]) for (const diff of [0, 1, 2]) {
      const rs = []; for (let i = 0; i < n; i++) rs.push(fn({ diff }));
      const v = rs.filter(r => r.vinta);
      out[k + ' ' + ['Facile', 'Normale', 'Eroe'][diff]] = v.length + '/' + n + ' vinte · ' + (v.length ? Math.round(v.reduce((a, r) => a + r.frame, 0) / v.length / 60) + ' s' : '-') + ' · colpi ' + rs.map(r => r.colpi).join(',') + (rs[0].errori !== undefined ? ' · errori ' + rs.map(r => r.errori).join(',') : ' · copie ' + rs.map(r => r.copie).join(','));
    }
    return out;
  },
};
window.T43 = T43;
