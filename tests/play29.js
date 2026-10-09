'use strict';
/* =====================================================================
 *  CICLO 29 — difetti trovati GIOCANDO A MANO (pagina normale, tasti veri).   T29.suite()  (con ?test)
 * ===================================================================== */
const T29 = {
  fox() { return Game.entities.find(e => typeof Fox !== 'undefined' && e instanceof Fox); },
  /* Lio rivolto in basso, Cocca seduta proprio davanti */
  foxInFront(tile) {
    T.fresh({ sword: true }); Game.s.flags.foxFreed = true; T.tp('o:1,1', 7, 3); T.noEnemies(); Game.projectiles = [];
    const p = Game.player; p.dir = 0; Game.foxPetUntil = 0;
    if (tile) Game.tiles[5][7] = tile;
    const f = T29.fox(); f.x = p.x; f.y = p.y + 14; f.state = 'sit';
    return f;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Cocca davanti e un rovo da tagliare: Azione taglia il rovo, non accarezza', () => {
      const f = T29.foxInFront(null); if (!f) return 'volpe assente';
      const sb = Game.player.swordBox(), tx = Math.floor((sb.x + sb.w / 2) / TS), ty = Math.floor((sb.y + sb.h - 1) / TS);
      Game.tiles[ty][tx] = 'V';
      Input.pressed.add('action'); T.run([], 20);
      if (Game.dialog) return 'carezza: ' + Game.dialog.pages[0][0];
      return Game.tiles[ty][tx] !== 'V' ? true : 'rovo intatto';
    });
    check('Cocca davanti e nulla da colpire: la carezza c\'è, poi per 3 s Azione è solo fendente', () => {
      T29.foxInFront(null);
      Input.pressed.add('action'); T.run([], 2);
      if (!Game.dialog) return 'nessuna carezza';
      T.skip(); T.run([], 5);
      Input.pressed.add('action'); T.run([], 2);
      if (Game.dialog) return 'carezza ripetuta subito (il fendente non parte)';
      if (!(Game.player.attackT > 0)) return 'nessun fendente';
      T.run([], 200); Input.pressed.add('action'); T.run([], 2);
      return Game.dialog ? true : 'dopo 3 s la carezza non torna';
    });
    check('Cocca davanti e un nemico vicino: Azione colpisce', () => {
      T29.foxInFront(null); const p = Game.player;
      const s = makeEnemy({ type: 'slime', x: 0, y: 0 }); s.x = p.x + 18; s.y = p.y + 16; Game.entities.push(s);
      Input.pressed.add('action'); T.run([], 2);
      return !Game.dialog && Game.player.attackT > 0 ? true : 'carezza invece del colpo';
    });
    check('Un colpo che spinge Lio su una scala non lo fa uscire; camminandoci sopra si esce', () => {
      T.fresh({ sword: true }); T.tp('c:1,2', 7, 8); T.noEnemies(); T.skip();
      const p = Game.player;
      p.hurt(Game, 1, p.cx(), p.cy() - 12); T.run([], 30);
      if (Game.roomId !== 'c:1,2' || Game.state !== 'play') return 'spinto fuori: ' + Game.roomId + ' ' + Game.state;
      if (!TILE_WARP.has(T.tile())) return 'il colpo non lo ha portato sulla scala (prova da rivedere): ' + T.where();
      T.run(['up'], 20); T.run(['down'], 40); for (let i = 0; i < 40 && Game.state !== 'play'; i++) T.run([], 1);
      return Game.roomId === 'o:2,2' ? true : 'camminando non si esce: ' + T.where();
    });
    check('Prologo: durante il tramonto c\'è un solo sole', () => {
      Game.startPrologue(); Game.proT = 845; Game.render();   // a metà dissolvenza
      // a metà dissolvenza il vecchio disegno mostrava due soli sbiaditi e separati (rosso mai sopra ~170);
      // ora c'è un solo tratto chiaro sulla colonna x = 170, con il nucleo pieno (rosso oltre 200)
      let runs = 0, inSun = false, core = 0;
      for (let y = 0; y < 150; y++) {
        const r = bctx.getImageData(170, y, 1, 1).data[0], sunny = r > 150;
        if (sunny && !inSun) runs++; inSun = sunny; core = Math.max(core, r);
      }
      Game.state = 'title';
      return runs === 1 && core > 200 ? true : 'tratti chiari: ' + runs + ', nucleo ' + core;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T29 = T29;
