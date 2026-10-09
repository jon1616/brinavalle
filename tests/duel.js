'use strict';
/* =====================================================================
 *  DUELLO (Ciclo 5) — un bot che combatte DAVVERO (niente vita infinita)
 *  contro il Re dei Rovi, per stimare la difficoltà. Si carica con ?test.
 *    T5.duel({ hearts: 4, diff: 1, n: 10 })  ->  vittorie, cuori persi, durata
 *    T5.table()                               ->  tabella completa (3 difficoltà x 2 dotazioni di cuori)
 *  Il bot: esce dalle righe/colonne delle radici, schiva le spine che arrivano,
 *  colpisce e si allontana (mordi e fuggi), allinea l'arpione sulla corazza.
 *  È un giocatore "discreto", non perfetto: i numeri sono INDICATIVI.
 * ===================================================================== */
const T5 = {
  keysToward(p, x, y, dead) {
    const k = [], d = dead || 2;
    if (p.cx() < x - d) k.push('right'); else if (p.cx() > x + d) k.push('left');
    if (p.cy() < y - d) k.push('down'); else if (p.cy() > y + d) k.push('up');
    return k;
  },
  clampPt(x, y) { return [Math.max(26, Math.min(PLAY_W - 26, x)), Math.max(30, Math.min(PLAY_H - 22, y))]; },
  face(p, b) {
    const dx = b.cx() - p.cx(), dy = b.cy() - p.cy();
    p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
  },
  step(st) {
    const g = Game, p = g.player, b = g.boss;
    if (!b || b.dead) return [];
    const pb = p.box();
    // 1) radici: se la mia riga/colonna sta per eruttare, esci
    for (const r of g.projectiles) {
      if (!(r instanceof RootLine) || r.t >= r.warn + r.active) continue;
      const rb = r.box(), grow = { x: rb.x - 4, y: rb.y - 4, w: rb.w + 8, h: rb.h + 8 };
      if (!overlap(grow, pb)) continue;
      if (r.axis === 'row') { const up = rb.y > 40; return up ? ['up'] : ['down']; }
      const left = rb.x > 40; return left ? ['left'] : ['right'];
    }
    // 2) spine in arrivo: scansati di lato
    let threat = null, td = 40;
    for (const q of g.projectiles) {
      if (q instanceof RootLine || !q.vx && !q.vy) continue;
      const dx = p.cx() - (q.x + 3), dy = p.cy() - (q.y + 3), d = Math.hypot(dx, dy);
      if (d < td && dx * q.vx + dy * q.vy > 0) { td = d; threat = { q, dx, dy }; }
    }
    if (threat) {
      const { q, dx, dy } = threat, s = Math.sign(dx * q.vy - dy * q.vx) || 1;
      const px = -q.vy * s, py = q.vx * s;
      const [tx, ty] = T5.clampPt(p.cx() + px * 30, p.cy() + py * 30);
      return T5.keysToward(p, tx, ty, 1);
    }
    const dist = Math.hypot(b.cx() - p.cx(), b.cy() - p.cy());
    const busy = ['intro', 'transform', 'dying', 'regrow'].includes(b.state);
    // 3) fase 2 corazzata: allinea l'arpione
    if (b.phase === 2 && b.armored && !busy) {
      g.s.equip = 'hookshot';
      const below = b.cy() < 110;
      const [tx, ty] = T5.clampPt(b.cx(), b.cy() + (below ? 62 : -62));
      if (Math.abs(p.cx() - b.cx()) < 5 && Math.abs(dist - 62) < 30 && !p.hook) {
        T5.face(p, b); Input.pressed.add('item'); return [];
      }
      return T5.keysToward(p, tx, ty);
    }
    // 3b) carica in arrivo: spostati di lato rispetto alla linea boss->giocatore
    if (b.state === 'dashPrep' || b.state === 'dash') {
      const ax = p.cx() - b.cx(), ay = p.cy() - b.cy(), d = dist || 1;
      let [tx, ty] = T5.clampPt(p.cx() - ay / d * 40, p.cy() + ax / d * 40);
      if (Math.hypot(tx - p.cx(), ty - p.cy()) < 20) [tx, ty] = T5.clampPt(p.cx() + ay / d * 40, p.cy() - ax / d * 40);
      return T5.keysToward(p, tx, ty);
    }
    // 4) vulnerabile E fermo: mordi e fuggi (un giocatore prudente non insegue un boss che si muove)
    const still = b.state === 'stun' || b.state === 'summon' || b.state === 'bare' || (b.state === 'ring' && b.timer > 18);
    const open = (b.phase === 1 ? !busy : b.state === 'bare') && still;
    if (open && st.retreat <= 0) {
      const horiz = Math.abs(b.cx() - p.cx()) > Math.abs(b.cy() - p.cy());
      const [tx, ty] = horiz ? T5.clampPt(b.cx() + (p.cx() < b.cx() ? -22 : 22), b.cy() + 4) : T5.clampPt(b.cx(), b.cy() + (p.cy() < b.cy() ? -20 : 20));
      if (Math.hypot(tx - p.cx(), ty - p.cy()) < 8 && p.attackT === 0) {
        T5.face(p, b); Input.pressed.add('action'); st.retreat = b.state === 'bare' || b.state === 'stun' ? 6 : 26; return [];
      }
      return T5.keysToward(p, tx, ty);
    }
    if (st.retreat > 0) st.retreat--;
    // 5) altrimenti tieni le distanze
    if (dist < 60) {
      const ax = p.cx() - b.cx(), ay = p.cy() - b.cy(), d = dist || 1;
      const [tx, ty] = T5.clampPt(p.cx() + ax / d * 30, p.cy() + ay / d * 30);
      const k = T5.keysToward(p, tx, ty);
      return k.length ? k : T5.keysToward(p, 128, 120);
    }
    return [];
  },
  /* un singolo duello */
  one(hearts, diff) {
    Opts.diff = diff;
    T.fresh({ sword: true, hookshot: true, bigkey: true });
    Game.s.maxHp = Game.s.hp = hearts * 2;
    Game.s.flags.bossIntro = true; Game.s.flags.phase2Seen = true;
    T.tp('d:1,0', 7, 8); T.skip();
    const st = { retreat: 0 };
    let f = 0;
    for (; f < 9000; f++) {
      if (Game.dialog) T.skip();
      if (Game.state === 'gameover') break;
      if (Game.s.flags.boss) break;
      const keys = Game.state === 'play' ? T5.step(st) : [];
      Input.down.clear(); keys.forEach(k => Input.down.add(k));
      Game.update(); Input.endFrame();
    }
    const b = Game.boss;
    return { win: !!Game.s.flags.boss, lost: hearts * 2 - Game.s.hp, sec: Math.round(f / 60), phase: b ? b.phase : 2, bossHp: b ? b.hp : 0 };
  },
  duel(o) {
    o = Object.assign({ hearts: 4, diff: 1, n: 10 }, o);
    const saveOpt = Opts.diff, bak = localStorage.getItem(SAVE_KEY), out = [];
    try { for (let i = 0; i < o.n; i++) out.push(T5.one(o.hearts, o.diff)); }
    finally { Opts.diff = saveOpt; if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY); Game.state = 'title'; }
    const wins = out.filter(r => r.win);
    return {
      cuori: o.hearts, difficolta: DIFF_NAMES[o.diff], vittorie: wins.length + '/' + o.n,
      mezziCuoriPersiInMedia: (out.reduce((a, r) => a + r.lost, 0) / o.n).toFixed(1),
      durataMediaVittorie: wins.length ? Math.round(wins.reduce((a, r) => a + r.sec, 0) / wins.length) + ' s' : '-',
      sconfitteInFase2: out.filter(r => !r.win && r.phase === 2).length,
    };
  },
  table(n) {
    const rows = [];
    for (const diff of [0, 1, 2]) for (const hearts of [4, 7]) rows.push(T5.duel({ hearts, diff, n: n || 8 }));
    console.table(rows);
    return rows;
  },
};
/* test automatici delle novità del Ciclo 5 */
T5.suite = function () {
  const bak = localStorage.getItem(SAVE_KEY), res = [];
  const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
  check('Hit-stop: un colpo ferma il mondo per qualche frame', () => {
    T.fresh({ sword: true }); T.tp('d:1,2', 7, 8); T.noEnemies();
    const sl = new Slime(7 * TS, 6 * TS); sl.timer = 9999; Game.entities.push(sl);
    sl.hurt(Game, 1, 1); if (!(Game.hitStop > 0)) return 'nessun fermo';
    const x = sl.x; T.run([], 1); return sl.x === x ? true : 'il mondo non si è fermato';
  });
  check('Hit-stop: il tasto premuto durante il fermo non va perso', () => {
    T.fresh({ sword: true }); T.tp('d:1,2', 7, 8); T.noEnemies(); Game.hitStop = 4;
    Input.pressed.add('action'); Game.update(); Input.endFrame();
    T.run([], 6); return Game.player.attackT > 0 || Game.player.charge > 0 ? true : 'fendente perso';
  });
  check('Hit-stop azzerato cambiando stanza', () => {
    T.fresh({}); Game.hitStop = 30; T.tp('o:1,2', 7, 6); return Game.hitStop === 0 ? true : Game.hitStop;
  });
  check("Cuore che scoppia nell'HUD quando lo perdi", () => {
    T.fresh({}); T.tp('o:2,2', 7, 5); T.noEnemies(); Game.s.hp = 6; Game.s.maxHp = 6;
    Game.player.hurt(Game, 2, Game.player.cx() + 10, Game.player.cy()); T.run([], 1);
    return Game.heartPops.some(h => h.i === 2) ? true : JSON.stringify(Game.heartPops);
  });
  check('Ambiente: foglie nella foresta, pesci al lago, farfalle dopo la vittoria', () => {
    T.fresh({}); T.tp('o:0,0', 13, 5); T.noEnemies(); T.run([], 400);
    if (!Game.particles.some(p => p instanceof Leaf)) return 'niente foglie';
    let fish = false; T.tp('o:0,2', 13, 5); T.noEnemies();
    for (let i = 0; i < 2000 && !fish; i++) { T.run([], 1); fish = Game.particles.some(p => p instanceof Fish); }
    if (!fish) return 'niente pesci';
    Game.s.flags.victory = true; T.tp('o:1,2', 7, 6); T.run([], 200);
    return Game.particles.some(p => p instanceof Butterfly) ? true : 'niente farfalle';
  });
  check('Boss: 16 PV in fase 1, 12 in fase 2, due cuori durante la trasformazione', () => {
    T.fresh({ sword: true, hookshot: true }); Game.s.flags.bossIntro = true; Game.s.flags.phase2Seen = true;
    T.tp('d:1,0', 7, 8); T.skip(); const b = Game.boss;
    if (b.maxHp !== 16) return 'fase 1: ' + b.maxHp;
    T.run([], 100); b.hp = 1; b.inv = 0; b.hurt(Game, 1);
    for (let i = 0; i < 250 && b.phase !== 2; i++) T.run([], 1);
    T.skip();
    return b.maxHp === 12 && Game.pickups.filter(p => p.kind === 'heart').length === 2 ? true : 'fase 2: ' + b.maxHp + ' cuori: ' + Game.pickups.length;
  });
  check('FEEL.on = false spegne gli effetti senza errori', () => {
    FEEL.on = false;
    try { T.fresh({ sword: true }); T.tp('o:0,0', 13, 5); T.run(['left'], 300); return Game.particles.some(p => p instanceof Leaf || p instanceof Dust) ? 'effetti ancora attivi' : true; }
    finally { FEEL.on = true; }
  });
  if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
  Game.state = 'title'; Game.menuIdx = 0;
  console.table(res);
  return res;
};
window.T5 = T5;
