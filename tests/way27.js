'use strict';
/* =====================================================================
 *  CICLO 27 — test del Segnavia.   T27.suite()  (con ?test)
 *  T27.follow(max) : un bot che NON conosce la mappa e segue solo la freccia, stanza dopo stanza.
 * ===================================================================== */
const T27 = {
  STAGES: [
    { name: 'spada', items: {}, flags: {}, goal: 'i:shrine' },
    { name: 'rovi delle Rovine', items: { sword: true }, flags: {}, goal: 'o:1,0' },
    { name: 'bombe nella Grotta', items: { sword: true }, flags: { collapse: true }, goal: 'c:1,0' },
    { name: 'ritorno alle Rovine', items: { sword: true, bombs: true }, flags: { collapse: true }, goal: 'o:1,0' },
    // Ciclo 28 (Agente B): da qui una chiave in tasca. Senza, la porta chiusa dell'Atrio blocca il percorso e il Segnavia
    // porta prima alla chiave (waykeys.js, provato in T28): questi test controllano le mete delle tappe e i collegamenti.
    { name: 'arpione', items: { sword: true, bombs: true }, flags: { collapse: true, enteredDungeon: true }, keys: 1, goal: 'd:2,1' },
    { name: 'Chiave del Re', items: { sword: true, bombs: true, hookshot: true }, flags: { collapse: true, enteredDungeon: true }, keys: 1, goal: 'd:2,0' },
    { name: 'Re dei Rovi', items: { sword: true, bombs: true, hookshot: true, bigkey: true }, flags: { collapse: true, enteredDungeon: true }, keys: 1, goal: 'd:1,0' },
  ],
  stage(st) { T.fresh(st.items); Object.assign(Game.s.flags, st.flags); if (Game.s.items.bombs) Game.s.bombs = 10; Game.s.keys = st.keys || 0; },
  /* segue la freccia: verso il bordo indicato (e oltre) o fino alla porta/scala indicata */
  follow(goal, max) {
    const seen = [Game.roomId];
    for (let hop = 0; hop < (max || 12) && Game.roomId !== goal; hop++) {
      T.skip();
      const w = Game.wayTargets()[0]; if (!w) return 'nessuna freccia in ' + Game.roomId;
      const room = Game.roomId, tx = Math.max(0, Math.min(RW - 1, Math.floor(w.x / TS))), ty = Math.max(0, Math.min(RH - 1, Math.floor((w.y + (w.dir === 0 && w.y < PLAY_H - 12 ? 12 : 0)) / TS)));
      try { R.walkTo(tx, ty, 2500); } catch (e) { return 'bloccato in ' + room + ' verso ' + tx + ',' + ty + ': ' + e.message.slice(0, 80); }
      const key = ['down', 'up', 'left', 'right'][w.dir];
      for (let i = 0; i < 120 && Game.roomId === room; i++) { R.frame(Game.tiles[ty] && TILE_WARP.has(Game.tiles[ty][tx]) ? [] : [key]); if (Game.dialog) T.skip(); }
      for (let i = 0; i < 80 && Game.state !== 'play'; i++) R.frame([]);
      if (Game.roomId === room) return 'non è uscito da ' + room;
      seen.push(Game.roomId);
    }
    return Game.roomId === goal ? true : 'arrivato in ' + Game.roomId + ' (' + seen.join(' → ') + ')';
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), way = Opts.way, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check('Opzione Segnavia: «Se ti perdi» di serie; nel menu passa da No a Sempre', () => {
      const x = new XMLHttpRequest(); x.open('GET', 'js/game.js?nocache=' + Date.now(), false); x.send();   // il valore di serie, dal sorgente
      if (!/const Opts = Object\.assign\(\{[^}]*way: 1 \}/.test(x.responseText)) return 'valore di serie diverso da «Se ti perdi»';
      Game.openOptions('title'); Game.optIdx = Game.optRows().indexOf('way'); Opts.way = 0;
      Game.changeOpt(1, false); Game.changeOpt(1, false); Game.changeOpt(1, false);
      const ok = Opts.way === 2; Game.state = 'title'; return ok ? true : 'valore ' + Opts.way;
    });
    check('Ogni tappa della storia ha la sua meta, e dalla piazza c\'è sempre un percorso', () => {
      for (const st of T27.STAGES) {
        T27.stage(st); T.tp('o:1,2', 7, 6);
        if (objectiveRoom(Game) !== st.goal) return st.name + ': meta ' + objectiveRoom(Game);
        const p = wayPath(Game, 'o:1,2', st.goal); if (!p) return st.name + ': nessun percorso';
      }
      return true;
    });
    check('Da ogni stanza della valle e delle Rovine si arriva alla meta della tappa', () => {
      const bad = [];
      for (const st of T27.STAGES) { T27.stage(st);
        for (const id of Object.keys(ROOMS).filter(i => /^[od]:/.test(i) && !ROOMS[i].secret)) if (id !== st.goal && !wayPath(Game, id, st.goal)) bad.push(st.name + '@' + id);
      }
      return bad.length ? bad.slice(0, 6).join(', ') : true;
    });
    Opts.way = 2;
    check('Bot che segue solo la freccia: dalla casa di Teodoro al Santuario della spada', () => {
      T27.stage(T27.STAGES[0]); T.tp('i:elder', 7, 7); return T27.follow('i:shrine');
    });
    check('Bot che segue solo la freccia: dal Santuario alle Rovine, con la spada', () => {
      T27.stage(T27.STAGES[1]); T.tp('i:shrine', 7, 7); return T27.follow('o:1,0');
    });
    check('Bot che segue solo la freccia: dalle Rovine (crollate) alla Grotta di Brina', () => {
      T27.stage(T27.STAGES[2]); T.tp('o:1,0', 7, 8); const r = T27.follow('c:1,2', 8);
      return r === true || Game.roomId.startsWith('c:') ? true : r;
    });
    check('Nella stanza della meta la freccia indica il forziere giusto', () => {
      T27.stage(T27.STAGES[4]); Game.s.flags['cleared:d:2,1'] = true; T.tp('d:2,1', 7, 8);
      const w = Game.wayTargets()[0], ch = Game.entities.find(e => e instanceof Chest && e.def.item === 'hookshot');
      return w && ch && Math.abs(w.x - (ch.x + 8)) < 2 && w.y < ch.y ? true : JSON.stringify(w);
    });
    check('«Se ti perdi»: nessuna freccia per ' + WAY_LOST + ' s, poi la freccia e un avviso (una volta); cambiando obiettivo si riparte', () => {
      Opts.way = 1; T27.stage(T27.STAGES[1]); T.tp('o:1,2', 7, 6); T.run([], 2);
      if (Game.wayVisible()) return 'visibile subito';
      Game.wayT = WAY_LOST * 60 - 2; T.run([], 3);
      if (!Game.wayVisible()) return 'non compare';
      if (!Game.banner || !/freccia/.test(Game.banner.text)) return 'manca l\'avviso';
      Game.banner = null; T.run([], 3); if (Game.banner) return 'avviso ripetuto';
      Game.s.flags.collapse = true; T.run([], 2);
      return !Game.wayVisible() ? true : 'non riparte col nuovo obiettivo';
    });
    check('«No»: mai freccia né «!»; mai durante i dialoghi né nella Sfida dei Guardiani', () => {
      Opts.way = 0; T27.stage(T27.STAGES[1]); T.tp('o:1,2', 7, 6); Game.wayT = 1e6; T.run([], 2);
      if (Game.wayVisible()) return 'visibile con «No»';
      Opts.way = 2; Game.say(['prova']); if (Game.wayVisible()) return 'visibile nel dialogo'; T.skip();
      Game.rush = {}; const v = Game.wayVisible(); Game.rush = null;
      return v ? 'visibile nella Sfida' : true;
    });
    check('In pausa il «!» sulla mappa segna la stanza giusta', () => {
      Opts.way = 2; T27.stage(T27.STAGES[0]); T.tp('o:1,2', 7, 6); Game.state = 'pause'; Game.pausePage = 0; Game.t = 32; Game.render();
      const x = 170 + 0 * 25, y = 40 + 1 * 18, d = bctx.getImageData(x + 11, y + 5, 1, 1).data;   // o:0,1, verso il Santuario
      Game.state = 'play';
      return d[0] === 0xff && d[1] === 0xc8 && d[2] === 0x40 ? true : 'pixel ' + [...d].slice(0, 3);
    });
    check('Freccia disegnata in tutte le stanze, a ogni tappa, senza errori; menu opzioni con 9 righe', () => {
      Opts.way = 2;
      for (const st of T27.STAGES) { T27.stage(st); for (const id of Object.keys(ROOMS)) { T.tp(id, 7, 6); Game.wayT = 1e6; Game.render(); } }
      Game.openOptions('pause'); Game.render(); const n = Game.optRows().length; Game.state = 'title';
      return n === 9 ? true : 'righe ' + n;
    });
    R.god = god; Opts.way = way; saveOpts();
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T27 = T27;
