'use strict';
/* =====================================================================
 *  DUELLO COL GOLEM (Ciclo 6, Agente B) — stesso spirito di tests/duel.js:
 *  un bot che combatte DAVVERO (niente vita infinita) contro il Golem di Brina.
 *    T6.golem({ hearts: 3, diff: 1, n: 8 })   T6.golemTable()
 *  Il bot: scappa dalle ombre delle stalattiti, si mette sulla traiettoria del
 *  masso e lo respinge con la spada, colpisce il Golem stordito, tiene le distanze.
 *  Giocatore "discreto", non perfetto: i numeri sono INDICATIVI.
 * ===================================================================== */
const T6 = {
  golemStep(st) {
    const g = Game, p = g.player, b = g.boss;
    if (!b || b.dead) return [];
    const pcx = p.cx(), pcy = p.cy();
    // 1) stalattiti: esci dall'ombra
    for (const q of g.projectiles) {
      if (!(q instanceof Icicle) || q.t < 0 || q.t >= q.fall) continue;
      const dx = pcx - q.x, dy = pcy - q.y;
      if (Math.hypot(dx, dy) < 16) {
        const [tx, ty] = T5.clampPt(pcx + (dx || 1) * 4, pcy + (dy || 1) * 4);
        return T5.keysToward(p, tx, ty, 1);
      }
    }
    // 2) masso in arrivo: affrontalo e respingilo
    const ball = g.projectiles.find(q => q.kind === 'ice' && !q.reflected && !q.dead);
    if (ball) {
      const dx = ball.x + 4 - pcx, dy = ball.y + 4 - pcy, d = Math.hypot(dx, dy);
      if (d < 26) {
        p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
        if (p.attackT === 0) Input.pressed.add('action');
        return [];
      }
      return [];   // aspetta fermo: il masso punta già verso di te
    }
    const dist = Math.hypot(b.cx() - pcx, b.cy() - pcy);
    // 3) golem stordito: avvicinati e colpisci
    if (b.state === 'stun' && b.timer > 12) {
      const [tx, ty] = T5.clampPt(b.cx(), b.cy() + 24);
      if (Math.hypot(tx - pcx, ty - pcy) < 8 && p.attackT === 0) { p.dir = 1; Input.pressed.add('action'); return []; }
      return T5.keysToward(p, tx, ty);
    }
    // 4) altrimenti tieni le distanze (il contatto toglie un cuore intero)
    if (dist < 64) {
      const ax = pcx - b.cx(), ay = pcy - b.cy(), d = dist || 1;
      const [tx, ty] = T5.clampPt(pcx + ax / d * 30, pcy + ay / d * 30);
      const k = T5.keysToward(p, tx, ty);
      return k.length ? k : T5.keysToward(p, 128, 100);
    }
    return [];
  },
  golemOne(hearts, diff) {
    Opts.diff = diff;
    T.fresh({ sword: true });
    Game.s.maxHp = Game.s.hp = hearts * 2;
    Object.assign(Game.s.flags, { golemIntro: true, caveEntered: true });
    T.tp('c:1,0', 7, 8); T.skip();
    const st = {};
    let f = 0, taken = 0, prev = Game.s.hp, volleys = 0;
    for (; f < 9000; f++) {
      if (Game.dialog) T.skip();
      if (Game.s.hp < prev) taken += prev - Game.s.hp;
      prev = Game.s.hp;
      if (Game.projectiles.some(q => q.volleyed && !q.counted && (q.counted = true))) volleys++;
      if (Game.state === 'gameover' || Game.s.flags.golem) break;
      const keys = Game.state === 'play' ? T6.golemStep(st) : [];
      Input.down.clear(); keys.forEach(k => Input.down.add(k));
      Game.update(); Input.endFrame();
    }
    return { win: !!Game.s.flags.golem, lost: taken, sec: Math.round(f / 60), volleys };
  },
  golem(o) {
    o = Object.assign({ hearts: 3, diff: 1, n: 8 }, o);
    const saveOpt = Opts.diff, bak = localStorage.getItem(SAVE_KEY), out = [];
    try { for (let i = 0; i < o.n; i++) out.push(T6.golemOne(o.hearts, o.diff)); }
    finally { Opts.diff = saveOpt; if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY); Game.state = 'title'; }
    const wins = out.filter(r => r.win);
    return {
      cuori: o.hearts, difficolta: DIFF_NAMES[o.diff], vittorie: wins.length + '/' + o.n,
      mezziCuoriPersiInMedia: (out.reduce((a, r) => a + r.lost, 0) / o.n).toFixed(1),
      rimbalziDelGolem: out.reduce((a, r) => a + r.volleys, 0),
      durataMediaVittorie: wins.length ? Math.round(wins.reduce((a, r) => a + r.sec, 0) / wins.length) + ' s' : '-',
    };
  },
  golemTable(n) {
    const rows = [];
    for (const diff of [0, 1, 2]) for (const hearts of [3, 4]) rows.push(T6.golem({ hearts, diff, n: n || 8 }));
    console.table(rows);
    return rows;
  },
};
window.T6 = T6;

/* ---------------- pescatore automatico + test del Ciclo 6 ---------------- */
T6.fishOnce = function (power, maxFrames) {   // lancia, aspetta, ferra, recupera con giudizio
  const F = () => Game.fsh;
  Game.startFishing(); T.run([], 2);
  const p = Math.max(0.05, Math.min(1, power));
  let guard = 0;
  while (F().power < p - 0.03 && guard++ < 200) { Input.down.clear(); Input.down.add('action'); Game.update(); Input.endFrame(); }
  Input.down.clear(); Game.update(); Input.endFrame();
  for (let i = 0; i < (maxFrames || 3000); i++) {
    const f = F(); if (!f) break;
    let keys = [];
    if (f.phase === 'bite') Input.pressed.add('action');
    else if (f.phase === 'reel') { const fi = f.fish; if (fi && fi.surge === 0 && !fi.warn && fi.T < 72) keys = ['action']; }
    else if (f.phase === 'caught' || (f.phase === 'aim' && i > 40)) break;
    Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame();
  }
  return F() ? F().phase : 'uscito';
};
T6.suite = function () {
  const bak = localStorage.getItem(SAVE_KEY), bakOpts = Object.assign({}, Opts), res = [];
  const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
  Opts.diff = 1;
  check('Pino: menu "Pescare" apre la pesca, Invio torna al lago', () => {
    T.fresh({ sword: true }); Game.s.flags.hookReturned = true; T.tp('o:0,2', 12, 3); T.noEnemies();
    Game.player.dir = 1; T.press('action', 2);
    for (let i = 0; i < 300 && Game.dialog && !(Game.dialog.entry.choices && Game.dialog.shown >= Game.dialog.pages[Game.dialog.pageIdx].join('').length); i++) T.run([], 1);
    if (!Game.dialog || !Game.dialog.entry.choices) return 'menu di Pino non trovato';
    T.press('action', 3);
    if (Game.state !== 'fishing') return 'stato ' + Game.state;
    T.press('start', 2);
    return Game.state === 'play' && Game.roomId === 'o:0,2' ? true : 'stato ' + Game.state;
  });
  check('Pesca: lancio, abboccata, recupero, pesce nel diario e gemme', () => {
    T.fresh({}); T.tp('o:0,2', 12, 3); T.noEnemies(); Game.s.flags.hookReturned = true;
    const g0 = Game.s.gems;
    let caught = 0;
    for (let k = 0; k < 6 && !caught; k++) { const ph = T6.fishOnce(0.4); if (ph === 'caught') caught++; }
    const log = Game.s.fishLog || {};
    Game.endFishing();
    return caught && Object.keys(log).length && Game.s.gems > g0 ? true : 'pescati ' + caught + ' diario ' + JSON.stringify(log);
  });
  check('Pesca: tirare durante un assaggio fa scappare il pesce', () => {
    T.fresh({}); T.tp('o:0,2', 12, 3); Game.startFishing(); const F = Game.fsh;
    F.needRelease = false; F.phase = 'fly'; F.t = 29; F.target = { x: 128, y: 70 }; F.zone = 1; T.run([], 2);
    const b = F.shadows[0]; F.biter = b; b.x = F.bob.x; b.y = F.bob.y; F.nibbles = 2;
    const n0 = F.shadows.length; T.press('action', 1);
    const ok = F.shadows.length === n0 - 1 && F.msg && /presto/.test(F.msg.text);
    Game.endFishing(); return ok ? true : 'pesci ' + n0 + '→' + F.shadows.length;
  });
  check('Pesca: tenere sempre premuto spezza il filo', () => {
    T.fresh({}); T.tp('o:0,2', 12, 3); Game.startFishing(); const F = Game.fsh;
    F.needRelease = false;
    F.fish = { sp: FISH[3], size: 60, D: 100, D0: 100, T: 20, surge: 0, warn: 0, calm: 5 }; F.ux = 0; F.uy = -1; F.phase = 'reel';
    T.run(['action'], 150);
    const ok = F.phase === 'aim' && F.msg && /spezzato/.test(F.msg.text);
    Game.endFishing(); return ok ? true : 'fase ' + F.phase;
  });
  check('Luccio Lunare: Pino regala un Cuore di Cristallo (una volta sola)', () => {
    T.fresh({}); T.tp('o:0,2', 12, 3); Game.startFishing(); Game.s.fishLog.luccio = 110;
    const m0 = Game.s.maxHp; Game.endFishing(); T.skip();
    const once = Game.s.maxHp; Game.startFishing(); Game.endFishing(); T.skip();
    return once === m0 + 2 && Game.s.maxHp === once ? true : m0 + '→' + once + '→' + Game.s.maxHp;
  });
  check('Golem: massimo 3 colpi per stordimento, poi si scrolla', () => {
    T.fresh({ sword: true }); Object.assign(Game.s.flags, { golemIntro: true }); T.tp('c:1,0', 7, 8); T.skip();
    const b = Game.boss; T.run([], 90); b.stagger(Game);
    for (let i = 0; i < 6; i++) { b.inv = 0; b.hurt(Game, 1); }
    return b.hp === 6 && b.state === 'walk' ? true : 'PV ' + b.hp + ' stato ' + b.state;
  });
  check('Golem furioso: può rimandare il masso, che va respinto di nuovo', () => {
    T.fresh({ sword: true }); Object.assign(Game.s.flags, { golemIntro: true }); T.tp('c:1,0', 7, 8); T.skip();
    const b = Game.boss; T.run([], 90); b.hp = 3; b.state = 'walk';
    const r = Math.random; Math.random = () => 0;   // forza il rimando
    const ball = new Projectile(b.cx() - 4, b.cy() - 4, 0, 0, 'ice'); ball.reflected = true; Game.projectiles.push(ball);
    try { T.run([], 1); } finally { Math.random = r; }
    if (!ball.volleyed || ball.reflected || ball.dead) return 'nessun rimando';
    ball.reflected = true; ball.x = b.cx() - 4; ball.y = b.cy() - 4; T.run([], 1);
    return b.state === 'stun' ? true : 'stato dopo la seconda respinta: ' + b.state;
  });
  check('Epilogo: parte dopo la piantagione, scorre e torna al gioco', () => {
    T.fresh({ sword: true }); Object.assign(Game.s.flags, { victory: true, boss: true, seedQuest: true });
    SEED_IDS.forEach(id => { Game.s.flags['seed:' + id] = true; });
    T.tp('o:1,0', 4, 8); T.noEnemies(); Game.player.dir = 1; T.press('action', 2);
    for (let i = 0; i < 400 && Game.state === 'play'; i++) { Input.pressed.add('action'); Game.update(); Input.endFrame(); T.run([], 2); }
    if (Game.state !== 'epilogue') return 'epilogo non partito: ' + Game.state;
    for (let i = 0; i < EPI_DONE + 60 && Game.state === 'epilogue'; i++) { T.run([], 1); if (i % 11 === 0) Game.render(); }
    T.press('action', 30);
    return Game.state === 'play' && Game.s.flags.garden ? true : 'stato ' + Game.state;
  });
  check('Opzioni: "Effetti visivi No" spegne FEEL', () => {
    Opts.fx = 0; saveOpts(); const off = FEEL.on === false;
    Opts.fx = 1; saveOpts(); return off && FEEL.on === true ? true : 'FEEL.on non segue l\'opzione';
  });
  check('Stress: 3000 frame di input casuale nella pesca', () => {
    T.fresh({}); T.tp('o:0,2', 12, 3); Game.startFishing();
    const ks = ['left', 'right', 'action', 'up'];
    for (let i = 0; i < 3000; i++) { T.run(Math.random() < 0.6 ? [ks[Math.random() * 4 | 0]] : [], 1); if (i % 13 === 0) Game.render(); if (Game.state !== 'fishing') Game.startFishing(); }
    Game.endFishing(); T.skip(); return true;
  });
  Object.assign(Opts, bakOpts); saveOpts();
  if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
  Game.state = 'title'; Game.menuIdx = 0;
  console.table(res);
  return res;
};
