'use strict';
/* =====================================================================
 *  TEST DEL CICLO 20 (Agente B) — il Bestiario.
 *  Si carica con index.html?test. Da console:  T20.suite()
 * ===================================================================== */
const T20 = {
  fill(g, all) { g.s.bestiary = {}; for (const B of BESTIARY) g.s.bestiary[B.k] = { s: 1, n: all ? 5 : 0 }; },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Uno slime sconfitto con la spada finisce nel Bestiario', () => {
      T.fresh({ sword: true }); T.tp('o:2,2', 6, 7); T.noEnemies();
      const sl = new Slime(Game.player.x, Game.player.y + 14, false); sl.timer = 9999; sl.hp = 1; Game.entities.push(sl);
      Game.player.dir = 0; T.press('action', 20);
      const e = bestEntry(Game, 'slime');
      return sl.dead && e.s && e.n === 1 ? true : 'morto ' + sl.dead + ' scheda ' + JSON.stringify(e);
    });
    check('Le creature presenti nella stanza risultano "viste"', () => {
      T.fresh({ sword: true }); T.tp('d:1,2', 7, 8); T.run([], 45);
      return bestEntry(Game, 'bat').s ? true : JSON.stringify(Game.s.bestiary);
    });
    check('Varianti riconosciute: slime blu / di ghiaccio, pipistrello di ghiaccio, lama, medusa', () => {
      const keys = [new Slime(0, 0, true), new Slime(0, 0, 'ice'), new Bat(0, 0, true), new BladeTrap(0, 0), new Jelly(0, 0)].map(bestKey);
      return keys.join(',') === 'slimeBlue,slimeIce,batIce,blade,jelly' ? true : keys.join(',');
    });
    check('Guardiano sconfitto (Golem) annotato; punto debole visibile già al primo incontro', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { golemIntro: true }); T.tp('c:1,0', 7, 8); T.skip(); T.run([], 30);
      const seenWeak = bestWeak(Game, BESTIARY.find(B => B.k === 'golem'));
      T.run([], 90);   // fine dell'intro (80 frame): prima il Golem ignora i colpi
      const b = Game.boss; b.hp = 1; b.stagger(Game); b.inv = 0; b.hurt(Game, 1);
      for (let i = 0; i < 200 && !Game.s.flags.golem; i++) T.run([], 1);
      return seenWeak && bestEntry(Game, 'golem').n === 1 ? true : 'debole ' + seenWeak + ' n ' + bestEntry(Game, 'golem').n;
    });
    check('Creatura comune: punto debole solo dopo 3 sconfitte', () => {
      T.fresh({}); const B = BESTIARY.find(x => x.k === 'plant');
      Game.s.bestiary = { plant: { s: 1, n: 2 } }; const a = bestWeak(Game, B);
      Game.s.bestiary.plant.n = 3; const b = bestWeak(Game, B);
      return !a && b ? true : a + ' / ' + b;
    });
    check('Pausa: Q passa mappa → diario → bestiario → mappa; le frecce scelgono la scheda, non l\'oggetto', () => {
      T.fresh({ sword: true, bombs: true, hookshot: true }); T.tp('o:1,2', 7, 6); Game.state = 'pause'; Game.pausePage = 0;
      const eq0 = Game.equipped(), seq = [];
      for (let i = 0; i < 3; i++) { T.press('swap', 1); seq.push(Game.pausePage); }
      Game.pausePage = 2; Game.bestIdx = 0; T.press('down', 1); T.press('right', 1);
      const ok = seq.join('') === '120' && Game.bestIdx === 1 && Game.equipped() === eq0;
      Game.state = 'title';
      return ok ? true : 'pagine ' + seq.join('') + ' idx ' + Game.bestIdx + ' oggetto ' + eq0 + '→' + Game.equipped();
    });
    check('Bestiario disegnato vuoto, a metà e completo, su ogni scheda, senza errori', () => {
      T.fresh({}); T.tp('o:1,2', 7, 6); Game.state = 'pause'; Game.pausePage = 2;
      for (const mode of ['vuoto', 'visto', 'pieno']) {
        if (mode === 'vuoto') Game.s.bestiary = {}; else T20.fill(Game, mode === 'pieno');
        for (let i = 0; i < BESTIARY.length; i++) { Game.bestIdx = i; Game.render(); }
      }
      Game.state = 'title'; return true;
    });
    check('Medaglia "Naturalista" solo con tutte le schede complete', () => {
      T.fresh({}); const m = MEDALS.find(x => x.id === 'bestiario');
      T20.fill(Game, false); const a = m.got(Game); T20.fill(Game, true); const b = m.got(Game);
      return m && !a && b ? true : a + ' / ' + b;
    });
    check('Cocca (correzione del Ciclo 20): il fiuto si rinnova a ogni visita, anche dopo averlo già usato', () => {
      const sniff = () => { T.tp('o:1,0', 7, 7); T.noEnemies(); for (let i = 0; i < 90 && Game.fox.state !== 'hint'; i++) T.run([], 1); return Game.fox.state === 'hint'; };
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { foxFreed: true, collapse: true });
      const a = sniff(); T.tp('o:1,1', 7, 6); const b = sniff();
      return a && b ? true : 'prima visita ' + a + ', seconda ' + b;
    });
    check('Il Bestiario si salva con la partita', () => {
      T.fresh({}); T.tp('o:1,2', 7, 6); Game.s.bestiary = { slime: { s: 1, n: 7 } }; Game.saveGame();
      const sv = JSON.parse(localStorage.getItem(SAVE_KEY)); return sv.bestiary && sv.bestiary.slime.n === 7 ? true : JSON.stringify(sv.bestiary);
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T20 = T20;
