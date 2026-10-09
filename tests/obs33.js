'use strict';
/* =====================================================================
 *  CICLO 33 — test dell'Osservatorio di Vesper.   T33.suite()  (con ?test)
 *  T33.duel({ diff })  il bot affronta l'Armilla con input veri (Meridiana compresa) -> { vinta, frame, vita }
 *  T33.climb()         il bot attraversa l'Osservatorio dall'ingresso alla Cupola
 * ===================================================================== */
const T33 = {
  post() {
    T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true, diapason: true });
    Object.assign(Game.s.flags, { victory: true, ch2Done: true, ch3Call: true, amberIn: true, nadiraHello: true, lensesSet: true, observatoryOpen: true,
      'chest:a_lens_rovine': true, 'chest:a_lens_oasi': true, 'chest:a_lens_stella': true });
    Game.s.obsTime = 'dusk'; Game.s.bombs = 10;
  },
  dial() { Game.s.equip = 'sundial'; Game.player.dialCd = 0; Input.pressed.add('item'); R.frame([]); R.wait(4); },
  // Ciclo 35: riprova finché l'ora non è quella giusta (una pressione può andare persa: dialogo, colpo, fendente in corso)
  setTime(t) { for (let i = 0; i < 12 && obsTime(Game) !== t; i++) { if (Game.dialog) T.skip(); const before = obsTime(Game); T33.dial(); if (obsTime(Game) === before) R.wait(12); } return obsTime(Game) === t; },
  duelStep(st) {
    const g = Game, p = g.player, b = g.boss, keys = [], time = obsTime(g);
    const go = (x, y) => { const dx = x - p.cx(), dy = y - p.cy(); if (Math.abs(dx) > 3) keys.push(dx > 0 ? 'right' : 'left'); if (Math.abs(dy) > 3) keys.push(dy > 0 ? 'down' : 'up'); };
    g.s.equip = 'sundial';
    const canDial = !(p.dialCd > 0) && !p.attackT;
    // una stella cadente su di me: scappa
    const fall = b && b.falls.find(f => Math.hypot(f.x - p.cx(), f.y - p.cy()) < 18);
    if (fall) { go(p.cx() + (p.cx() < 128 ? 30 : -30), p.cy()); return keys; }
    if (b && b.shut > 0 && time === 'night' && canDial) { Input.pressed.add('item'); return keys; }   // anelli chiusi: torna al giorno e respira
    if (b && b.shut <= 0 && time !== 'night' && canDial) { Input.pressed.add('item'); return keys; }   // verso la notte
    if (b && b.vulnerable) {
      const d = Math.hypot(b.cx() - p.cx(), b.cy() - p.cy());
      if (d < 22) { const dx = b.cx() - p.cx(), dy = b.cy() - p.cy(); p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); if (!p.attackT) Input.pressed.add('action'); return keys; }
      go(b.cx(), b.cy() + 18); return keys;
    }
    go(128, 140); return keys;
  },
  duel(o) {
    o = Object.assign({ diff: 1, god: false, max: 12000 }, o);
    const keep = Opts.diff, god = R.god; Opts.diff = o.diff; R.god = o.god;
    try {
      T33.post(); Game.s.items.sundial = true; Game.s.flags.vCupola = true; Game.s.items.potion = false; Game.s.maxHp = Game.s.hp = 14;
      T.tp('v:1,0', 7, 8); T.skip();
      let f = 0; const st = {};
      for (; f < o.max && !Game.s.flags.vArmilla && Game.state !== 'gameover'; f++) {
        if (Game.dialog) { T.skip(); continue; }
        const keys = T33.duelStep(st);
        Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
        if (R.god) Game.s.hp = Game.s.maxHp;
      }
      return { vinta: !!Game.s.flags.vArmilla, frame: f, vita: Game.s.hp + '/' + Game.s.maxHp };
    } finally { Opts.diff = keep; R.god = god; T.skip(); Game.state = 'title'; }
  },
  climb() {
    const log = [], step = s => log.push(s);
    T33.post(); T.tp('a:1,2', 7, 5); T.skip();
    R.walkTo(7, 6); T.run(['down'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1); T.skip();
    if (Game.roomId !== 'v:1,2') return 'ingresso: ' + Game.roomId;
    step('ore');
    R.walkTo(1, 5); R.pushThrough('left', 'v:0,2'); T.skip();
    for (let i = 0; i < 3000 && Game.entities.some(e => e.enemy && !e.dead); i++) { const foes = Game.entities.filter(e => e.enemy && !e.dead); R.frame(R.fightStep(foes)); }
    T.run([], 30); R.walkTo(7, 6); R.faceTo(0, -1); Input.pressed.add('action'); T.run([], 5); T.skip();
    if (!Game.s.items.sundial) return 'meridiana non presa (' + log.join(' → ') + ')';
    step('meridiana');
    R.walkTo(14, 5); R.pushThrough('right', 'v:1,2');
    if (!T33.setTime('night')) return 'notte impossibile';
    R.walkTo(14, 5); R.pushThrough('right', 'v:2,2'); T.skip();
    if (!T33.setTime('night')) return 'notte persa nel Ponte';   // Ciclo 37: una volta, dopo una regressione completa, qui era tornato il tramonto (causa non trovata)
    // Ciclo 41: «nessun percorso verso 6,5» (raro, solo dopo una regressione completa): se il ponte è ingombro si aspetta un momento, si rimette la notte e si riprova
    for (let k = 0; k < 3; k++) { try { R.walkTo(6, 5); break; } catch (e) { if (k === 2) throw new Error(e.message + ' [' + obsTime(Game) + ' ' + Game.tiles[5].join('') + ' astrini ' + Game.entities.filter(x => x instanceof Astrino && !x.dead).map(x => Math.round(x.cx()) + ',' + Math.round(x.cy())).join(';') + ']'); R.wait(60); T33.setTime('night'); } }
    if (!T33.setTime('dusk')) return 'tramonto impossibile'; R.walkTo(10, 5); R.faceTo(1, 0); Input.pressed.add('action'); T.run([], 5); T.skip();
    if (!Game.s.items.vlens) return 'lente non presa (' + log.join(' → ') + ') ' + T.where();
    // Ciclo 41: al ritorno sul ponte del tramonto un Astrino può sbalzare il bot nel vuoto; ricompare all'ingresso (2,5), già dal lato dell'uscita: va bene così
    try { R.walkTo(6, 5); } catch (e) { if (R.cell()[0] > 2) throw e; }
    T33.setTime('night'); R.walkTo(1, 5); R.pushThrough('left', 'v:1,2');
    step('lente');
    T33.setTime('day'); R.walkTo(7, 1); R.pushThrough('up', 'v:1,1'); T.skip();
    T33.setTime('night');
    for (const [x, y] of STAR_ORDER) { R.walkTo(x, y); T.run([], 4); T.skip(); }
    if (!Game.s.flags.vStars) return 'costellazione non risolta (' + log.join(' → ') + ')';
    step('stelle');
    R.walkTo(7, 1); R.pushThrough('up', 'v:1,0'); T.skip();
    if (Game.roomId !== 'v:1,0' || !Game.boss) return 'cupola non raggiunta: ' + Game.roomId;
    step('cupola');
    return log.join(' → ');
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check("Il portone dell'Altopiano porta nella Sala delle Ore; la scala riporta fuori", () => {
      T33.post(); T.tp('a:1,2', 7, 5); if (Game.tiles[7][7] !== 'Z') return 'portone chiuso';
      R.walkTo(7, 6); T.run(['down'], 30); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (Game.roomId !== 'v:1,2' || !Game.dialog) return 'ingresso: ' + Game.roomId;
      T.skip(); T.run(['down'], 60); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      return Game.roomId === 'a:1,2' ? true : 'uscita: ' + Game.roomId;
    });
    check('La Meridiana: dopo gli Astrini; fa girare le ore solo dentro l\'Osservatorio', () => {
      T33.post(); T.tp('v:0,2', 7, 6); T.skip();
      if (Game.entities.some(e => e instanceof Chest)) return 'forziere già visibile';
      for (const e of Game.entities.filter(e => e.enemy)) { e.hp = 1; e.inv = 0; e.hurt(Game, 5, 0); }
      T.run([], 40); const ch = Game.entities.find(e => e instanceof Chest && e.def.item === 'sundial'); if (!ch) return 'forziere non comparso';
      ch.open(Game); T.skip();
      if (Game.equipped() !== 'sundial') return 'non in mano';
      T33.dial(); if (obsTime(Game) !== 'night') return 'tramonto → ' + obsTime(Game);
      T33.dial(); if (obsTime(Game) !== 'day') return 'notte → ' + obsTime(Game);
      T.tp('a:1,2', 7, 5); T33.dial(); return obsTime(Game) === 'day' && Game.banner && /cielo/.test(Game.banner.text) ? true : 'fuori gira: ' + obsTime(Game);
    });
    check('Astrino: di giorno è pietra (niente danni, niente colpi); al tramonto due colpi lo abbattono', () => {
      T33.post(); Game.s.obsTime = 'day'; T.tp('v:2,1', 7, 5); T.skip(); T.noEnemies();
      const a = makeEnemy({ type: 'astrino', x: 7, y: 3 }); Game.entities.push(a);
      a.hurt(Game, 1, 0); if (a.hp !== 2) return 'colpito di giorno';
      const x0 = a.x; T.run([], 30); if (a.x !== x0) return 'si muove di giorno';
      Game.s.obsTime = 'dusk'; a.inv = 0; a.hurt(Game, 1, 0); a.inv = 0; a.hurt(Game, 1, 0);
      return a.dead ? true : 'vivo';
    });
    check('Sala delle Ore: porta del sole aperta solo a mezzogiorno, della luna solo di notte', () => {
      T33.post(); Game.s.items.sundial = true; T.tp('v:1,2', 7, 5); T.skip();
      const st = () => (Game.tiles[0][7] === 'J' ? 'N-chiusa' : 'N-aperta') + ' ' + (Game.tiles[5][15] === 'J' ? 'E-chiusa' : 'E-aperta');
      const out = [obsTime(Game) + ':' + st()]; T33.dial(); out.push(obsTime(Game) + ':' + st()); T33.dial(); out.push(obsTime(Game) + ':' + st());
      return out.join(' | ') === 'dusk:N-chiusa E-chiusa | night:N-chiusa E-aperta | day:N-aperta E-chiusa' ? true : out.join(' | ');
    });
    check('Ponte delle Stelle: di notte fino a metà, al tramonto fino al forziere; chi resta sul ponte che sparisce cade', () => {
      T33.post(); Game.s.items.sundial = true; T.tp('v:2,2', 1, 5); T.skip(); T.noEnemies();
      if (!T33.setTime('night')) return 'notte impossibile: ' + obsTime(Game) + ' ' + T.where(); R.walkTo(6, 5); if (R.cell().join(',') !== '6,5') return 'isola di mezzo non raggiunta';
      if (!T33.setTime('dusk')) return 'tramonto impossibile'; R.walkTo(10, 5); R.faceTo(1, 0); Input.pressed.add('action'); T.run([], 5); T.skip();
      if (!Game.s.items.vlens) return 'lente non presa';
      R.walkTo(8, 5); const hp = Game.s.hp; T33.setTime('night'); T.run([], 80);
      return Game.s.hp < hp || Game.player.fallT ? true : 'non è caduto';
    });
    check('Galleria: le stelle si contano solo di notte; l\'ordine sbagliato non vale; quello giusto apre la porta a stella', () => {
      T33.post(); Game.s.items.sundial = true; Game.s.obsTime = 'day'; T.tp('v:1,1', 7, 8); T.skip();
      for (const [x, y] of STAR_ORDER) { R.walkTo(x, y); T.run([], 4); }
      if (Game.s.flags.vStars) return 'aperta di giorno';
      T33.setTime('night'); R.walkTo(STAR_ORDER[1][0], STAR_ORDER[1][1]); T.run([], 4);   // la seconda stella per prima: non vale
      if ((Game.starSeq || []).length) return 'ordine sbagliato accettato';
      for (const [x, y] of STAR_ORDER) { R.walkTo(x, y); T.run([], 4); T.skip(); }
      return Game.s.flags.vStars && Game.tiles[0][7] !== 'J' ? true : 'porta: ' + Game.tiles[0][7];
    });
    check('Una porta non si chiude mai addosso a Lio: resta aperta finché non si sposta', () => {
      T33.post(); Game.s.items.sundial = true; Game.s.obsTime = 'night'; T.tp('v:1,2', 14, 5); T.skip();
      Game.player.x = 15 * TS - 3; Game.player.y = 5 * TS - 6; T.run([], 2);
      T33.setTime('day'); if (Game.tiles[5][15] === 'J') return 'chiusa addosso a Lio';
      R.walkTo(12, 5); T.run([], 3); return Game.tiles[5][15] === 'J' ? true : 'non si richiude dopo';
    });
    check('Biblioteca: dietro la porta del tramonto; le tre pagine aprono lo scrigno', () => {
      T33.post(); Game.s.items.sundial = true; T.tp('v:1,1', 7, 5); T.skip();
      if (Game.tiles[5][0] === 'J') return 'porta del tramonto chiusa al tramonto';
      T.tp('v:0,1', 13, 5); T.skip();
      for (const [x, y] of [[3, 3], [12, 3], [12, 7]]) Game.say(ROOMS['v:0,1'].signs[x + ',' + y](Game)), T.skip();
      T.run([], 3); T.skip();
      return pagesRead(Game) === 3 && Game.entities.some(e => e instanceof Chest && e.def.id === 'v_diary') ? true : 'pagine ' + pagesRead(Game);
    });
    check("L'Armilla: invulnerabile di giorno e al tramonto; di notte il nucleo si apre; tre colpi e si richiude", () => {
      T33.post(); Game.s.items.sundial = true; Game.s.flags.vCupola = true; Game.s.obsTime = 'day'; T.tp('v:1,0', 7, 8); T.skip(); T.run([], 100);
      const b = Game.boss; b.hurt(Game); if (b.hp !== b.maxHp) return 'ferita di giorno';
      Game.s.obsTime = 'night'; T.run([], 80); if (!b.vulnerable) return 'non si apre di notte: ' + b.open.toFixed(2);
      for (let i = 0; i < 3; i++) { b.inv = 0; b.hurt(Game); }
      if (b.hp !== b.maxHp - 3 || !(b.shut > 0)) return 'hp ' + b.hp + ' shut ' + b.shut;
      T.run([], 30); return !b.vulnerable ? true : 'resta aperta';
    });
    check('Sconfitta: porte, cuore, Bestiario; senza lente Vesper indica il telescopio; con la lente ritrova la voce e il Capitolo III si chiude', () => {
      T33.post(); Game.s.items.sundial = true; Object.assign(Game.s.flags, { vCupola: true, vIn: true, vStars: true }); Game.s.obsTime = 'night'; T.tp('v:1,0', 7, 8); T.skip(); T.run([], 90);
      const b = Game.boss; b.hp = 1; b.inv = 0; b.open = 1; b.shut = 0; b.hurt(Game);
      for (let i = 0; i < 200 && !Game.s.flags.vArmilla; i++) T.run([], 1);
      if (!Game.s.flags.vArmilla) return 'non sconfitta';
      if (Game.tiles[10][7] !== 'P' || !Game.pickups.some(p => p.kind === 'container') || !(Game.s.bestiary || {}).armilla) return 'porte/cuore/bestiario';
      T.skip();
      const ves = Game.entities.find(e => e.def && e.def.id === 'vesper');
      const a = ves.def.talk(Game); if (!a.some(l => typeof l === 'string' && /lente/.test(l))) return 'senza lente: ' + JSON.stringify(a).slice(0, 80);
      Game.s.items.vlens = true; Game.say(ves.def.talk(Game)); T.skip();
      if (!Game.s.flags.vesperVoice) return 'nessuna voce';
      for (let i = 0; i < 120 && Game.state !== 'chapter3'; i++) T.run([], 1);
      if (Game.state !== 'chapter3') return 'niente cartello del Capitolo III';
      T.run([], 130); Input.pressed.add('action'); T.run([], 2);
      if (!Game.s.flags.ch3Done || Game.state !== 'play') return 'cartello non chiuso';
      if (CHAPTERS3.length > 9) return 'diario oltre 9: ' + CHAPTERS3.length;
      return CHAPTERS3.every(c => c.done(Game)) ? true : 'capitoli: ' + CHAPTERS3.filter(c => !c.done(Game)).map(c => c.name);
    });
    check('Obiettivo e Segnavia seguono l\'Osservatorio', () => {
      T33.post(); const seq = [[{}, 'v:1,2'], [{ vIn: true }, 'v:0,2'], [{ _s: true }, 'v:2,2'], [{ _l: true }, 'v:1,1'], [{ vStars: true }, 'v:1,0'], [{ vArmilla: true }, 'v:1,0'], [{ vesperVoice: true }, null]];
      for (const [fl, want] of seq) {
        if (fl._s) Game.s.items.sundial = true; else if (fl._l) Game.s.items.vlens = true; else Object.assign(Game.s.flags, fl);
        const r = objectiveRoom(Game); if (r !== want) return 'atteso ' + want + ', trovato ' + r;
        if (!currentObjective(Game)) return 'obiettivo vuoto';
      }
      return true;
    });
    check("Il bot attraversa l'Osservatorio con input veri, dall'ingresso alla Cupola", () => {
      const r = T33.climb(); T33.climbLog = r; return /cupola$/.test(r) ? true : r;
    });
    check('Tutte le sale, a tutte le ore, si disegnano senza errori; mappa OSSERVATORIO; inventario a 10', () => {
      T33.post(); Game.s.items.sundial = true;
      for (const t of OBS_TIMES) for (const id of Object.keys(ROOMS).filter(i => i.startsWith('v:'))) { Game.s.obsTime = t; T.tp(id, 7, 8); T.skip(); for (let i = 0; i < 8; i++) { Game.update(); Game.render(); Input.endFrame(); } T.skip(); }
      Game.state = 'pause'; Game.pausePage = 0; Game.render(); const pre = Game.mapPrefix(); Game.state = 'play';
      const inv0 = INVENTORY.filter(([k]) => !(k === 'bigkey' && Game.s.flags.boss)), shown = (inv0.length > 10 ? inv0.filter(([k]) => Game.s.items[k]) : inv0).length;   // Ciclo 35: come lo disegna la pausa
      return pre === 'v:' && shown <= 10 ? true : 'mappa ' + pre + ' inventario ' + shown;
    });
    R.god = false;
    check("Duello onesto (niente vita infinita): il bot batte l'Armilla almeno una volta su 3 a Normale", () => {
      const r = []; for (let i = 0; i < 3; i++) { const x = T33.duel({ diff: 1 }); r.push(x); if (x.vinta) { T33.duelLog = JSON.stringify(r); return true; } }
      return JSON.stringify(r);
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.boss = null;
    console.table(res);
    return res;
  },
};
window.T33 = T33;
