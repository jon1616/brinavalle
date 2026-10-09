'use strict';
/* =====================================================================
 *  CICLO 31 — test della Torre del Silenzio.   T31.suite()  (con ?test)
 *  T31.duel({ diff, god })  il bot affronta la Signora delle Nebbie con input veri -> { vinta, frame, vita }
 *  T31.climb()              il bot sale tutta la Torre dall'ingresso (Diapason, Eco, velo, Coro, Signora)
 * ===================================================================== */
const T31 = {
  post() {
    T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true, bigkey: true, crystal: true });
    Object.assign(Game.s.flags, { victory: true, boss: true, partyDone: true, northCall: true, northArrived: true, bellmanHello: true, northBells: true,
      'chest:n_bell_lago': true, 'chest:n_bell_pineta': true, 'chest:n_bell_cima': true });
    Game.s.bombs = 10;
  },
  ring() { Game.s.equip = 'diapason'; Input.pressed.add('item'); R.frame([]); R.wait(20); },
  near(e) { const p = Game.player; return Math.hypot(e.cx() - p.cx(), e.cy() - p.cy()); },
  /* un passo del bot da duello: ritorna i tasti da tenere premuti in questo frame */
  duelStep() {
    const g = Game, p = g.player, b = g.boss, keys = [];
    const go = (x, y) => { const dx = x - p.cx(), dy = y - p.cy(); if (Math.abs(dx) > 3) keys.push(dx > 0 ? 'right' : 'left'); if (Math.abs(dy) > 3) keys.push(dy > 0 ? 'down' : 'up'); };
    const face = (e) => { const dx = e.cx() - p.cx(), dy = e.cy() - p.cy(); p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); };
    const canRing = !(p.ringCd > 0) && !p.attackT;
    g.s.equip = 'diapason';
    if (b && b.state === 'stunned') {
      if (T31.near(b) < 20) { face(b); if (!p.attackT) Input.pressed.add('action'); return keys; }
      go(b.cx(), b.cy() + 10); return keys;
    }
    // sfere di nebbia vicine: una nota le spazza via
    if (canRing && g.projectiles.some(q => q instanceof FogOrb && Math.hypot(q.x - p.cx(), q.y - p.cy()) < 30)) { Input.pressed.add('item'); return keys; }
    if (b && b.state === 'sing') {   // canta: avvicinati quel che basta e suona
      if (T31.near(b) < 42) { if (canRing) Input.pressed.add('item'); return keys; }
      go(b.cx(), b.cy() + 22); return keys;
    }
    if (b && b.state === 'swoop') {   // schiva di lato rispetto alla sua traiettoria
      const dx = p.cx() - b.cx(), dy = p.cy() - b.cy();
      if (Math.abs(dx) > Math.abs(dy)) keys.push(p.cy() < 96 ? 'down' : 'up'); else keys.push(p.cx() < 128 ? 'right' : 'left');
      return keys;
    }
    const vel = g.entities.filter(e => e instanceof Velato && !e.dead).sort((a, c) => T31.near(a) - T31.near(c))[0];
    if (vel) {
      if (!vel.veiled && T31.near(vel) < 22) { face(vel); if (!p.attackT) Input.pressed.add('action'); return keys; }
      if (vel.veiled && T31.near(vel) < 34 && canRing) { Input.pressed.add('item'); return keys; }
      if (!vel.veiled) { go(vel.cx(), vel.cy()); return keys; }
    }
    go(128, 118);   // posizione d'attesa: in mezzo alla sala, in basso
    return keys;
  },
  duel(o) {
    o = Object.assign({ diff: 1, god: false, max: 9000 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = o.god;
    try {
      T31.post(); Game.s.items.diapason = true; Game.s.flags.ladyIntro = true; Game.s.items.potion = false;
      Game.s.maxHp = Game.s.hp = 12;
      T.tp('t:1,0', 7, 8); T.skip();
      let f = 0;
      for (; f < o.max && !Game.s.flags.towerLady && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); continue; }
        const keys = T31.duelStep();
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (R.god) Game.s.hp = Game.s.maxHp;
      }
      return { vinta: !!Game.s.flags.towerLady, frame: f, vita: Game.s.hp + '/' + Game.s.maxHp };
    } finally { Opts.diff = keep; R.god = god; T.skip(); Game.state = 'title'; }
  },
  table(n) {
    const rows = [];
    for (const diff of [0, 1, 2]) { const r = []; for (let i = 0; i < (n || 4); i++) r.push(T31.duel({ diff })); rows.push({ difficolta: DIFF_NAMES[diff], vinte: r.filter(x => x.vinta).length + '/' + r.length, secondi: r.filter(x => x.vinta).map(x => (x.frame / 60).toFixed(0)).join(',') }); }
    console.table(rows); return rows;
  },
  /* sale tutta la Torre con input veri (vita infinita: qui si verifica il percorso, il boss lo misura duel) */
  climb() {
    const log = [], step = (s) => log.push(s);
    T31.post(); T.tp('n:1,0', 7, 4); T.skip();
    R.walkTo(7, 3); T.run(['up'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1); T.skip();
    if (Game.roomId !== 't:1,2') return 'ingresso: ' + Game.roomId;
    step('atrio');
    // a ovest: le armature e il Diapason
    R.walkTo(1, 5); R.pushThrough('left', 't:0,2'); T.skip();
    for (let i = 0; i < 2500 && Game.entities.some(e => e.enemy && !e.dead); i++) { const foes = Game.entities.filter(e => e.enemy && !e.dead); R.frame(R.fightStep(foes)); }
    T.run([], 30); R.walkTo(7, 5); R.faceTo(0, -1); Input.pressed.add('action'); T.run([], 5); T.skip();
    if (!Game.s.items.diapason) return 'diapason non preso (' + log.join(' → ') + ')';
    step('diapason');
    // a est: l'Eco (acuta, grave, di mezzo)
    R.walkTo(14, 5); R.pushThrough('right', 't:1,2'); R.walkTo(14, 5); R.pushThrough('right', 't:2,2'); T.skip();
    for (const tx of [12, 8, 4]) { R.walkTo(tx, 5); R.faceTo(0, -1); T31.ring(); T.skip(); }
    if (!Game.s.flags.towerEcho) return 'eco non risolta (' + log.join(' → ') + ')';
    step('eco');
    // l'atrio: il velo grande
    R.walkTo(1, 5); R.pushThrough('left', 't:1,2'); R.walkTo(7, 2); R.faceTo(0, -1); T31.ring(); T.run([], 40);
    if (!Game.s.flags['veil:t_atrio']) return 'velo non sciolto (' + log.join(' → ') + ')';
    step('velo');
    R.walkTo(7, 1); R.pushThrough('up', 't:1,1'); T.skip();
    // la galleria: a est il Coro
    R.walkTo(14, 5); R.pushThrough('right', 't:2,1'); T.skip();
    for (let k = 0; k < 3 && !Game.s.flags.towerChoir; k++) for (const [tx, ty] of [[4, 3], [11, 3], [11, 7], [4, 7]]) { R.walkTo(tx, ty); T31.ring(); T.skip(); }
    if (!Game.s.flags.towerChoir) return 'coro non risolto (' + log.join(' → ') + ')';
    step('coro');
    R.walkTo(1, 5); R.pushThrough('left', 't:1,1'); R.walkTo(7, 1); R.pushThrough('up', 't:1,0'); T.skip();
    if (Game.roomId !== 't:1,0' || !Game.boss) return 'trono non raggiunto: ' + Game.roomId;
    step('trono');
    return log.join(' → ');
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check('Il portone si apre con le campane e porta nell\'Atrio; si esce dalla scala', () => {
      T31.post(); Game.s.flags.northBells = false; T.tp('n:1,0', 7, 4); if (Game.tiles[2][7] === 'Z') return 'aperto senza campane';
      Game.s.flags.northBells = true; T.tp('n:1,0', 7, 4); if (Game.tiles[2][7] !== 'Z') return 'portone chiuso';
      R.walkTo(7, 3); T.run(['up'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (Game.roomId !== 't:1,2' || !Game.dialog || !/Teodoro/.test(JSON.stringify(Game.dialog.queue) + JSON.stringify(Game.dialog.pages))) return 'ingresso: ' + Game.roomId;
      T.skip(); T.run(['down'], 60); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      return Game.roomId === 'n:1,0' ? true : 'uscita: ' + Game.roomId;
    });
    check('Il Diapason: forziere solo a sala ripulita; preso, è l\'oggetto in mano e fa un\'onda', () => {
      T31.post(); T.tp('t:0,2', 7, 6); T.skip();
      if (Game.entities.some(e => e instanceof Chest)) return 'forziere già visibile';
      for (const e of Game.entities.filter(e => e.enemy)) { e.hp = 1; e.inv = 0; e.hurt(Game, 5, 0); }
      T.run([], 40); const ch = Game.entities.find(e => e instanceof Chest && e.def.item === 'diapason'); if (!ch) return 'forziere non comparso';
      ch.open(Game); T.skip();
      if (!Game.s.items.diapason || Game.equipped() !== 'diapason') return 'non in mano: ' + Game.equipped();
      Input.pressed.add('item'); T.run([], 2);
      return Game.entities.some(e => e instanceof Wave) ? true : 'nessuna onda';
    });
    check('Velato: la spada lo attraversa; dopo la nota due colpi lo abbattono', () => {
      T31.post(); Game.s.items.diapason = true; T.tp('t:1,1', 7, 8); T.skip(); T.noEnemies();
      const v = makeEnemy({ type: 'velato', x: 7, y: 6 }); Game.entities.push(v); const p = Game.player;
      v.x = p.x; v.y = p.y - 14; v.hurt(Game, 2, 1); if (v.hp !== 2) return 'colpito da velato';
      T31.ring(); if (v.veiled) return 'la nota non lo scuote';
      v.inv = 0; v.hurt(Game, 1, 1); v.inv = 0; v.hurt(Game, 1, 1);
      return v.dead ? true : 'vivo con hp ' + v.hp;
    });
    check("Sala dell'Eco: l'ordine sbagliato non vale; acuta, grave, di mezzo apre l'eco", () => {
      T31.post(); Game.s.items.diapason = true; T.tp('t:2,2', 7, 6); T.skip();
      for (const tx of [4, 8, 12]) { R.walkTo(tx, 5); R.faceTo(0, -1); T31.ring(); T.skip(); }
      if (Game.s.flags.towerEcho) return 'aperta con l\'ordine sbagliato';
      for (const tx of [12, 8, 4]) { R.walkTo(tx, 5); R.faceTo(0, -1); T31.ring(); T.skip(); }
      return Game.s.flags.towerEcho ? true : 'ordine giusto non riconosciuto';
    });
    check("Il velo dell'Atrio resiste senza l'eco, cede con l'eco, e resta sciolto", () => {
      T31.post(); Game.s.items.diapason = true; T.tp('t:1,2', 7, 3); T.skip();
      R.walkTo(7, 2); R.faceTo(0, -1); T31.ring(); T.skip(); T.run([], 40);
      if (Game.s.flags['veil:t_atrio']) return 'sciolto senza eco';
      Game.s.flags.towerEcho = true; T31.ring(); T.run([], 40);
      if (!Game.s.flags['veil:t_atrio']) return 'non sciolto con l\'eco';
      T.tp('t:1,2', 7, 3); return Game.entities.some(e => e instanceof FogVeil) ? 'ricompare' : true;
    });
    check('Sala del Coro: con input veri le 4 statue cantano insieme a ogni difficoltà; poi il sigillo non c\'è più', () => {
      const out = [], d0 = Opts.diff;
      for (const d of [0, 1, 2]) {
        Opts.diff = d; T31.post(); Game.s.items.diapason = true; T.tp('t:2,1', 4, 3); T.skip(); T.noEnemies();
        const t0 = R.frames;
        for (const [tx, ty] of [[4, 3], [11, 3], [11, 7], [4, 7]]) { R.walkTo(tx, ty); T31.ring(); T.skip(); }
        out.push(DIFF_NAMES[d] + ' ' + (R.frames - t0) + '/' + CHOIR_WIN() + (Game.s.flags.towerChoir ? ' ok' : ' NO'));
        if (!Game.s.flags.towerChoir) { Opts.diff = d0; return out.join(' · '); }
      }
      Opts.diff = d0; T31.choirLog = out.join(' · ');
      T.tp('t:1,1', 7, 3); return Game.entities.some(e => e instanceof FogVeil) ? 'sigillo ancora lì' : true;
    });
    check("Archivio: una nota libera il ricordo anche oltre la voragine; quattro ricordi aprono il forziere", () => {
      T31.post(); Game.s.items.diapason = true; T.tp('t:0,1', 8, 5); T.skip(); T.noEnemies();
      R.walkTo(5, 5); R.faceTo(0, -1);
      const orb = Game.entities.find(e => e instanceof MemoryOrb && e.m.n === 1);   // preso prima: liberato, vola da Lio e sparisce
      T31.ring(); if (!orb || orb.caged) return 'il ricordo dell\'isola resta in gabbia';
      for (let i = 0; i < 200 && !Game.s.flags['mem:1']; i++) { T.run([], 1); T.skip(); }
      if (!Game.s.flags['mem:1']) return 'il ricordo non arriva';
      for (const m of MEMORIES.slice(1)) { const o = Game.entities.find(e => e instanceof MemoryOrb && e.m.n === m.n); o.onRing(Game); }
      for (let i = 0; i < 400 && memCount(Game) < 4; i++) { T.run([], 1); T.skip(); }
      T.run([], 5); T.skip();
      if (memCount(Game) < 4) return 'ricordi ' + memCount(Game);
      return Game.entities.some(e => e instanceof Chest && e.def.id === 't_memories') ? true : 'niente forziere';
    });
    check('La Signora: il velo la protegge; la nota da vicino la abbatte; tre colpi e si rialza; nella seconda fase le copie svaniscono alla nota', () => {
      T31.post(); Game.s.items.diapason = true; Game.s.flags.ladyIntro = true; T.tp('t:1,0', 7, 8); T.skip(); T.run([], 100);
      const b = Game.boss; if (!b || b.state !== 'float') return 'stato ' + (b && b.state);
      b.hurt(Game, 1); if (b.hp !== b.maxHp) return 'ferita col velo';
      const p = Game.player; b.x = p.x - 2; b.y = p.y - 30; T31.ring();
      if (b.state === 'stunned') return 'la nota la abbatte anche mentre fluttua (deve inghiottirla)';
      b.state = 'sing'; b.timer = 60; b.x = p.x - 2; b.y = p.y - 30; p.ringCd = 0; T31.ring();
      if (b.state !== 'stunned') return 'la nota durante il canto non la abbatte: ' + b.state;
      for (let i = 0; i < 3; i++) { b.inv = 0; b.hurt(Game, 1); }
      if (b.hp !== b.maxHp - 3) return 'hp ' + b.hp;
      T.run([], 20); if (b.state === 'stunned') return 'non si rialza dopo tre colpi';
      b.hp = 7; T.run([], 80); b.makeDecoys(); b.state = 'float';
      const dc = b.decoys[0]; const q = b.decoyPos(dc); p.x = q.x + 4; p.y = q.y + 30; Game.s.equip = 'diapason'; Input.pressed.add('item'); T.run([], 25);
      return !dc.alive ? true : 'la copia resiste alla nota';
    });
    check('Sconfitta: porte aperte, cuore, Bestiario, ricordi; poi Gualtiero e il padre ricordano; diario completo', () => {
      T31.post(); Game.s.items.diapason = true; Object.assign(Game.s.flags, { ladyIntro: true, towerIn: true }); T.tp('t:1,0', 7, 8); T.skip(); T.run([], 90);
      const b = Game.boss; b.state = 'stunned'; b.timer = 150; b.hp = 1; b.inv = 0; b.hurt(Game, 1);
      for (let i = 0; i < 200 && !Game.s.flags.towerLady; i++) T.run([], 1);
      if (!Game.s.flags.towerLady) return 'non sconfitta';
      if (Game.tiles[10][7] !== 'P') return 'porta chiusa';
      if (!Game.pickups.some(p => p.kind === 'container')) return 'niente cuore';
      if (!(Game.s.bestiary || {}).lady) return 'non nel Bestiario';
      if (!Game.dialog || !/Elva/.test(JSON.stringify(Game.dialog.queue) + JSON.stringify(Game.dialog.pages))) return 'niente dialogo di Elva';
      T.skip();
      const gu = ROOMS['i:campanile'].npcs.find(n => n.id === 'gualtiero').talk(Game);
      if (!gu.some(l => /Anselmo/.test(l))) return 'Gualtiero non sa';
      Object.assign(Game.s.flags, { fatherFreed: true, fatherHome: true, fatherHello: true });
      const pa = FATHER_NPC.talk(Game); if (!pa.some(l => /spalle/.test(l))) return 'il padre non ricorda: ' + pa[0];
      if (CHAPTERS2.length > 9) return 'diario oltre 9 righe: ' + CHAPTERS2.length;
      return CHAPTERS2.every(ch => ch.done(Game)) ? true : 'capitoli: ' + CHAPTERS2.filter(ch => !ch.done(Game)).map(c => c.name);
    });
    check('Obiettivo e Segnavia seguono la Torre passo per passo', () => {
      T31.post(); const steps = [];
      const seq = [[{}, 't:1,2'], [{ towerIn: true }, 't:0,2'], [{ _dia: true }, 't:2,2'], [{ towerEcho: true }, 't:1,2'], [{ 'veil:t_atrio': true }, 't:2,1'], [{ towerChoir: true }, 't:1,0'], [{ towerLady: true }, 'i:campanile'], [{ ladyTold: true }, 'o:1,2'], [{ fatherRemembers: true }, null]];
      for (const [fl, want] of seq) {
        if (fl._dia) Game.s.items.diapason = true; else Object.assign(Game.s.flags, fl);
        const r = objectiveRoom(Game); steps.push(r);
        if (r !== want) return 'atteso ' + want + ', trovato ' + r + ' (' + steps.join(',') + ')';
        if (!currentObjective(Game)) return 'obiettivo vuoto';
      }
      return true;
    });
    check('Il bot sale tutta la Torre con input veri, dall\'ingresso al trono', () => {
      const r = T31.climb(); T31.climbLog = r;
      return /trono$/.test(r) ? true : r;
    });
    check('Tutte le sale si disegnano senza errori (anche la pausa con la mappa TORRE e l\'inventario a 9 voci)', () => {
      T31.post(); Game.s.items.diapason = true;
      for (const id of Object.keys(ROOMS).filter(i => i.startsWith('t:'))) { T.tp(id, 7, 8); T.skip(); for (let i = 0; i < 20; i++) { Game.update(); Game.render(); Input.endFrame(); } T.skip(); }
      Game.state = 'pause'; Game.pausePage = 0; Game.render(); const pre = Game.mapPrefix(); Game.pausePage = 1; Game.render(); Game.state = 'play'; Game.pausePage = 0;
      return pre === 't:' ? true : 'mappa ' + pre;
    });
    R.god = false;
    check('Duello onesto (niente vita infinita): il bot batte la Signora almeno una volta su 3 a Normale', () => {
      const r = []; for (let i = 0; i < 3; i++) { const x = T31.duel({ diff: 1 }); r.push(x); if (x.vinta) { T31.duelLog = JSON.stringify(r); return true; } }
      return JSON.stringify(r);
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.boss = null;
    console.table(res);
    return res;
  },
};
window.T31 = T31;
