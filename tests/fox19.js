'use strict';
/* =====================================================================
 *  CICLO 19 — test di Cocca, il volpacchiotto.   T19.suite()  (con ?test)
 * ===================================================================== */
const T19 = {
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    const dist = () => Math.hypot(Game.fox.cx() - Game.player.cx(), Game.fox.cy() - Game.player.cy());
    R.god = true;
    check('Prima: Cocca è nella gabbia di rovi accanto al Santuario; senza spada serve una lama', () => {
      T.fresh({}); T.tp('o:0,1', 5, 7); T.noEnemies(); T.run([], 5);
      if (!Game.fox || !Game.fox.caged || !Game.entities.includes(Game.fox)) return 'niente gabbia';
      Game.player.x = 4 * TS + 10; Game.player.y = 7 * TS - 6; Game.player.dir = 2;
      Input.pressed.add('action'); T.run([], 2);
      const t = Game.dialog && Game.dialog.entry.text; T.skip();
      return /lama/.test(t || '') ? true : 'dialogo: ' + t;
    });
    check('Liberato con un fendente: segue il giocatore, la gabbia sparisce e resta sparita', () => {
      T.fresh({ sword: true }); T.tp('o:0,1', 5, 7); T.noEnemies();
      Game.player.x = 4 * TS + 10; Game.player.y = 7 * TS - 6; Game.player.dir = 2;
      Input.pressed.add('action'); T.run([], 5); T.skip();
      if (!Game.s.flags.foxFreed) return 'non liberato';
      if (FOX_CAGE.some(([x, y]) => Game.tiles[y][x] === 'V')) return 'rovi rimasti';
      T.tp('o:0,1', 7, 5); return FOX_CAGE.every(([x, y]) => Game.tiles[y][x] !== 'V') && !Game.fox.caged ? true : 'gabbia ricomparsa';
    });
    check('Ti segue tra le stanze (scorrimento e porte) e non resta mai indietro', () => {
      T.fresh({ sword: true }); Game.s.flags.foxFreed = true; T.tp('o:1,2', 7, 6); T.noEnemies();
      if (!Game.entities.includes(Game.fox)) return 'non c\'è';
      R.exit('N', 'o:1,1'); T.run([], 30);
      if (!Game.entities.includes(Game.fox) || dist() > 40) return 'dopo lo scorrimento: ' + dist().toFixed(0);
      T.run(['right'], 80); T.run([], 60);
      if (dist() > 32) return 'rimasto indietro: ' + dist().toFixed(0);
      T.tp('o:1,2', 3, 5); R.warp(3, 3, 'i:elder'); T.run([], 20);
      return Game.entities.includes(Game.fox) && dist() < 40 ? true : 'dopo la porta: ' + dist().toFixed(0);
    });
    check('Non intralcia: il giocatore gli passa attraverso, l\'arpione e la spada lo ignorano', () => {
      T.fresh({ sword: true, hookshot: true }); Game.s.flags.foxFreed = true; T.tp('o:1,2', 7, 6); T.noEnemies(); T.run([], 5);
      Game.fox.x = Game.player.x + 14; Game.fox.y = Game.player.y; Game.fox.trail = [];
      const x0 = Game.player.x; T.run(['right'], 20);
      if (Game.player.x - x0 < 20) return 'bloccato dal volpacchiotto';
      Game.fox.x = Game.player.x + 16; Game.player.dir = 3; Input.pressed.add('action'); T.run([], 16);
      Game.s.equip = 'hookshot'; Input.pressed.add('item'); T.run([], 40);
      return !Game.fox.dead && Game.entities.includes(Game.fox) ? true : 'colpito';
    });
    check('Fiuto: vicino alle macerie delle Rovine corre lì e abbaia', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { foxFreed: true, collapse: true }); T.tp('o:1,0', 7, 7); T.noEnemies();
      for (let i = 0; i < 90 && Game.fox.state !== 'hint'; i++) T.run([], 1);
      if (Game.fox.state !== 'hint' || !(Game.fox.bubble > 0)) return 'non ha fiutato';
      T.run([], 80);
      const ty = Math.floor((Game.fox.y + 12) / TS);
      return ty >= 4 && ty <= 6 ? true : 'non è andato alle macerie: riga ' + ty;
    });
    check('Fiuto: un segreto già segnalato non viene ripetuto nella stessa stanza', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { foxFreed: true, collapse: true }); T.tp('o:1,0', 7, 7); T.noEnemies();
      for (let i = 0; i < 300; i++) T.run([], 1);
      let again = 0; for (let i = 0; i < 300; i++) { T.run([], 1); if (Game.fox.state === 'hint') again++; }
      return again === 0 ? true : 'ripete il fiuto';
    });
    check('Si siede e poi si addormenta se aspetti; accarezzarlo risponde', () => {
      T.fresh({ sword: true }); Game.s.flags.foxFreed = true; T.tp('o:1,2', 7, 6); T.noEnemies(); T.run([], 700);
      if (Game.fox.idle <= 600) return 'non dorme: idle ' + Game.fox.idle;
      Game.render();
      Game.fox.x = Game.player.x + 12; Game.fox.y = Game.player.y + 2; Game.player.dir = 3;
      Input.pressed.add('action'); T.run([], 2);
      const t = Game.dialog && Game.dialog.entry.text; T.skip();
      return /Cocca/.test(t || '') && Game.fox.idle < 600 ? true : 'carezza: ' + t;
    });
    check('Assente nella Sfida dei Guardiani', () => {
      Medals.data = { got: {}, wins: 1, best: null };
      T.fresh({ sword: true }); Game.s.flags.foxFreed = true;
      Game.startRush(); T.run([], 30);
      const ok = !Game.entities.includes(Game.fox);
      Game.rush = null; Game.state = 'title';
      return ok ? true : 'presente nella sfida';
    });
    check("Diario e Albo d'oro", () => {
      Medals.data = { got: {}, wins: 0, best: null };
      T.fresh({}); Game.visited.add('o:0,1'); Game.s.flags.foxFreed = true; T.tp('o:1,2', 7, 6); T.run([], 40);
      return Game.knownQuests().some(q => q.name === 'Un amico a quattro zampe' && q.done(Game)) && Medals.has('cocca') ? true : 'manca';
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T19 = T19;
