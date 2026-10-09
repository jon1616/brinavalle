'use strict';
/* =====================================================================
 *  SFIDA DEI GUARDIANI — test e bot (Ciclo 9), si carica con ?test
 *    T9.play({ diff: 1 })     il bot gioca la sfida (niente vita infinita) -> { vinta, tempo, prova }
 *    T9.table(n)              n sfide per difficoltà
 *    T9.suite()               test della modalità
 * ===================================================================== */
const T9 = {
  play(o) {
    o = Object.assign({ diff: 1 }, o);
    const keep = Opts.diff; Opts.diff = o.diff;
    try {
      Game.startRush();
      const st = { retreat: 0 }, gst = {};
      for (let f = 0; f < 40000 && Game.state !== 'rushEnd'; f++) {
        if (Game.dialog) T.skip();
        let keys = [];
        if (Game.state === 'play' && !Game.dialog) {
          const r = Game.rush.round;
          if (r === 0) { const foes = Game.entities.filter(e => e.enemy && !e.dead && !e.ignoreClear); keys = foes.length ? R.fightStep(foes) : []; }
          else if (r === 1) keys = T6.golemStep(gst);
          else keys = T5.step(st);
        }
        Input.down.clear(); keys.forEach(k => Input.down.add(k));
        Game.update(); Input.endFrame();
      }
      return { vinta: Game.rushWon, tempo: +(Game.rushTime || 0).toFixed(1), prova: Game.rush ? Game.rush.round + 1 : 0 };
    } finally { Opts.diff = keep; Game.rush = null; Game.state = 'title'; }
  },
  table(n) {
    const rows = [];
    for (const diff of [0, 1, 2]) {
      const res = []; for (let i = 0; i < (n || 6); i++) res.push(T9.play({ diff }));
      const w = res.filter(r => r.vinta), times = w.map(r => r.tempo).sort((a, b) => a - b);
      rows.push({ difficolta: DIFF_NAMES[diff], vinte: w.length + '/' + res.length, tempoMediano: times.length ? fmtTime(times[times.length >> 1]) : '-',
        tempoMigliore: times.length ? fmtTime(times[0]) : '-', cadutoAllaProva: res.filter(r => !r.vinta).map(r => r.prova).join(',') });
    }
    console.table(rows);
    return rows;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    const md = Medals.data;
    check('Bloccata prima della vittoria, sbloccata dopo', () => {
      Medals.data = { got: {}, wins: 0, best: null }; localStorage.removeItem(SAVE_KEY);
      Game.state = 'title'; if (Game.titleItems().includes('Sfida dei Guardiani')) return 'visibile troppo presto';
      Medals.data.wins = 1; return Game.titleItems().includes('Sfida dei Guardiani') ? true : 'non sbloccata';
    });
    check('Avvio dal titolo, il salvataggio della partita resta intatto', () => {
      const fake = JSON.stringify(Object.assign(newState(), { gems: 77, room: 'o:1,2' }));
      localStorage.setItem(SAVE_KEY, fake);
      Game.state = 'title'; Game.menuIdx = Game.titleItems().indexOf('Sfida dei Guardiani');
      Input.pressed.add('action'); Game.update(); Input.endFrame();
      if (!Game.rush || Game.roomId !== 'd:2,1') return 'non avviata: ' + Game.state + ' ' + Game.roomId;
      T.run([], 60); Game.saveGame();
      const ok = localStorage.getItem(SAVE_KEY) === fake;
      Game.rush = null; Game.state = 'title';
      return ok ? true : 'salvataggio modificato';
    });
    check("Nell'arena non si esce (né dai bordi né dalle porte)", () => {
      Game.startRush(); T.run([], 30); T.noEnemies();
      Game.player.x = 0; Game.player.y = 5 * TS - 6; T.run(['left'], 60);
      const ok = Game.roomId === 'd:2,1' && Game.player.cx() > 0;
      Game.rush = null; Game.state = 'title';
      return ok ? true : Game.roomId + ' ' + Game.player.cx();
    });
    check('Prova superata -> la successiva, con ristoro', () => {
      Game.startRush(); T.run([], 30); Game.s.hp = 4;
      for (const e of Game.entities) if (e.enemy) { e.inv = 0; e.hp = 1; e.hurt(Game, 1, 0); }
      T.run([], 160);
      const ok = Game.rush.round === 1 && Game.roomId === 'c:1,0' && Game.s.hp === 8;
      Game.rush = null; Game.state = 'title';
      return ok ? true : 'round ' + Game.rush + ' ' + Game.roomId + ' hp ' + Game.s.hp;
    });
    check('Sconfitta -> schermata di fine sfida e ritorno al titolo', () => {
      Game.startRush(); T.run([], 30); Game.s.hp = 1; Game.player.hurtT = 0;
      Game.player.hurt(Game, 2, Game.player.cx() + 5, Game.player.cy());
      if (Game.state !== 'rushEnd' || Game.rushWon) return 'stato ' + Game.state;
      Game.render(); T.run([], 70); Input.pressed.add('action'); Game.update(); Input.endFrame();
      return Game.state === 'title' && !Game.rush ? true : Game.state;
    });
    check('Abbandono dalla pausa (Q)', () => {
      Game.startRush(); T.run([], 30); Input.pressed.add('start'); Game.update(); Input.endFrame();
      if (Game.state !== 'pause') return 'niente pausa';
      Game.render(); Input.pressed.add('swap'); Game.update(); Input.endFrame();
      const ok = Game.state === 'rushEnd' && Game.rush.abandoned;
      Game.rush = null; Game.state = 'title';
      return ok ? true : Game.state;
    });
    check('Vittoria: record, medaglie Custode (e Furia sotto i 2:30)', () => {
      Medals.data = { got: {}, wins: 1, best: null };
      Game.startRush(); Game.rush.round = 2; Game.rush.t = 120 * 60; Game.endRush(true);
      const a = Medals.has('sfida') && Medals.has('sfidaOro') && Medals.data.rushBest === 120;
      Game.render();
      Game.startRush(); Game.rush.round = 2; Game.rush.t = 300 * 60; Game.endRush(true);
      const b = Medals.data.rushBest === 120 && !Game.rush.record;
      Game.rush = null; Game.state = 'title';
      return a && b ? true : JSON.stringify(Medals.data);
    });
    // Ciclo 11: un solo tentativo falliva ~1 volta su 4 (il bot vince ~70-80% a Normale): ora almeno 1 vittoria su 3
    // Ciclo 27 (Agente A): rimisurato 14/20 = 70%, e le sconfitte sono tutte alla prova 3 (Re dei Rovi, bot T5.step).
    // Con 3 tentativi il falso allarme è 0,3^3 ≈ 2,7% (Agente B l'ha visto 2 volte): con 5 tentativi è ≈ 0,24%.
    check('Il bot completa la sfida a Normale (almeno 1 su 5 tentativi)', () => {
      const tries = [];
      for (let i = 0; i < 5; i++) { const r = T9.play({ diff: 1 }); tries.push(r); if (r.vinta) return true; }
      return JSON.stringify(tries);
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.rush = null; Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T9 = T9;
