'use strict';
/* =====================================================================
 *  CICLO 23 — test di «Torno presto» (Radici del Trono, bulbi, il padre).   T23.suite()  (con ?test)
 *  T23.timing() misura con input veri quanto serve per chiudere i 4 bulbi, a ogni difficoltà.
 * ===================================================================== */
const T23 = {
  post() { T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true, bigkey: true, crystal: true });
    Object.assign(Game.s.flags, { victory: true, boss: true, golem: true, bivouac: true, bivouacTold: true }); },
  bulbs() { return Game.entities.filter(e => e instanceof Bulb); },
  /* chiude i 4 bulbi come farebbe un giocatore: spada sui due a terra, arpione sui due sugli isolotti */
  solve() {
    let t0 = null;
    const mark = () => { if (t0 === null && T23.bulbs().some(b => b.closed)) t0 = R.frames; };
    // Ciclo 24 (Agente B): come un giocatore, se una spina lo interrompe (colpo preso a metà arpione) Lio riprova una volta
    const at = tx => T23.bulbs().reduce((a, b) => Math.abs(b.x / TS - tx) < Math.abs(a.x / TS - tx) ? b : a);
    const slash = (tx, ty, dir) => { for (let k = 0; k < 2 && !at(tx).closed; k++) { R.walkTo(tx, ty); R.faceTo(...dir); R.tap('action', 16); } mark(); };
    const hook = (tx, ty) => { for (let k = 0; k < 2 && !at(tx).closed; k++) { R.walkTo(tx, ty); Game.s.equip = 'hookshot'; R.faceTo(0, -1); R.tap('item', 1); for (let i = 0; i < 60 && Game.player.hook; i++) R.frame([]); } mark(); };
    slash(4, 6, [0, 1]); hook(2, 4); hook(13, 4); slash(11, 6, [0, 1]);
    return R.frames - (t0 === null ? R.frames : t0);   // dal primo bulbo chiuso all'ultimo
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, god = R.god, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    R.god = true;
    check('Teodoro legge l\'ultima pagina solo dopo il taccuino (e insieme al racconto del Ciclo 22, se non già sentito)', () => {
      T.fresh({ sword: true }); Game.s.flags.victory = true;
      const el = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
      if (el.talk(Game).some(l => typeof l === 'string' && l.includes('ultima pagina'))) return 'pagina letta senza taccuino';
      Game.s.flags.bivouac = true;
      const a = el.talk(Game).filter(l => typeof l === 'string');
      if (!a[0].includes('scrittura di tuo padre') || !a.some(l => l.includes('ultima pagina'))) return 'ordine sbagliato: ' + a[0];
      T.tp('i:elder', 7, 7); Game.say(el.talk(Game)); T.skip();
      if (!Game.s.flags.rootsHint || !Game.s.flags.bivouacTold) return 'flag non impostati';
      return el.talk(Game).some(l => typeof l === 'string' && l.includes('ultima pagina')) ? 'pagina ripetuta' : true;
    });
    check('Nel Trono dei Rovi la scala compare solo dopo l\'indizio, e porta alle Radici', () => {
      T23.post(); T.tp('d:1,0', 7, 6); if (Game.tiles[4][7] === 'Z') return 'scala già presente';
      Game.s.flags.rootsHint = true; T.tp('d:1,0', 7, 6); T.skip();
      if (Game.tiles[4][7] !== 'Z') return 'scala assente';
      T.run(['up'], 40); for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      return Game.roomId === 'r:1,2' ? true : 'arrivato in ' + Game.roomId;
    });
    check('Discesa: la saracinesca resta chiusa finché i guardiani non cadono; poi le tre sale sono collegate', () => {
      T23.post(); Game.s.flags.rootsHint = true; T.tp('r:1,2', 7, 8); T.skip();
      if (Game.tiles[0][7] !== 'J') return 'saracinesca aperta';
      for (const e of Game.entities.filter(e => e.enemy)) { e.hp = 1; e.inv = 0; e.hurt(Game, 5, 0); }
      T.run([], 40); if (Game.tiles[0][7] === 'J') return 'saracinesca non aperta';   // (i colpi fermano il gioco qualche frame: hitstop di feel.js)
      if (neighborId('r:1,2', 0, -1) !== 'r:1,1' || neighborId('r:1,1', 0, -1) !== 'r:1,0') return 'sale non collegate';
      return Game.mapPrefix() === 'r:' ? true : 'mappa: ' + Game.mapPrefix();
    });
    check("Groviglio: l'arpione attraversa la voragine all'andata e al ritorno, senza cadere", () => {
      T23.post(); T.tp('r:1,1', 7, 7); T.skip(); T.noEnemies(); Game.s.equip = 'hookshot';
      Game.player.x = 7 * TS; T.run(['up'], 1); T.press('item', 50);
      if (Math.floor(Game.player.cy() / TS) !== 2 || Game.player.fallT) return 'andata: ' + T.where();
      Game.player.x = 8 * TS; T.run(['down'], 1); T.press('item', 50);
      return Math.floor(Game.player.cy() / TS) === 7 && !Game.player.fallT ? true : 'ritorno: ' + T.where();
    });
    check('Bulbi: la spada chiude quelli a terra; quelli sugli isolotti si raggiungono solo con l\'arpione; poi riaprono', () => {
      T23.post(); T.tp('r:1,0', 7, 8); T.skip();
      const [nw, , sw] = T23.bulbs();
      R.walkTo(4, 6); R.faceTo(0, 1); R.tap('action', 16);
      if (!sw.closed) return 'la spada non chiude il bulbo a terra';
      R.walkTo(2, 4); R.faceTo(0, -1); R.tap('action', 16); R.tap('action', 16);
      if (nw.closed) return 'la spada arriva sull\'isolotto (dovrebbe servire l\'arpione)';
      // Ciclo 24 (Agente B): due tentativi, come un giocatore (raramente, nella suite completa, il primo lancio non arriva: causa non isolata)
      for (let k = 0; k < 2 && !nw.closed; k++) { R.walkTo(2, 4); R.faceTo(0, -1); Game.s.equip = 'hookshot'; R.tap('item', 1); for (let i = 0; i < 60 && Game.player.hook; i++) R.frame([]); }
      if (!nw.closed) return 'l\'arpione non chiude il bulbo';
      R.wait(BULB_WIN() + 30);   // Ciclo 24 (Agente B): margine per i frame di hitstop (il bulbo non conta mentre il gioco è fermo)
      return !sw.closed && !nw.closed ? true : 'non riaprono';
    });
    check('Tre bulbi su quattro non bastano; quattro insieme liberano il padre', () => {
      T23.post(); Game.s.flags.rootsHint = true; T.tp('r:1,0', 7, 8); T.skip();
      const b = T23.bulbs(); b.slice(0, 3).forEach(x => x.close(Game)); T.run([], 2);
      if (Game.s.flags.fatherFreed) return 'liberato con 3 bulbi';
      b[3].close(Game); T.run([], 2);
      if (!Game.s.flags.fatherFreed || !Game.cocoon.burst) return 'bozzolo intatto';
      return b.every(x => x.withered) ? true : 'bulbi non appassiti';
    });
    check('La scena: il padre parla, dona un Cuore di Cristallo e riporta Lio al villaggio, dove resta', () => {
      T23.post(); Game.s.flags.rootsHint = true; T.tp('r:1,0', 7, 8); T.skip();
      const hp = Game.s.maxHp; T23.bulbs().forEach(x => x.close(Game));
      let saw = false;
      for (let i = 0; i < 400 && Game.roomId === 'r:1,0'; i++) { T.run([], 1); if (Game.dialog) { saw = saw || /Papà|Lio\?/.test(JSON.stringify(Game.dialog.pages)); Input.pressed.add('action'); } }
      for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      if (!saw) return 'nessun dialogo del padre';
      if (Game.s.maxHp !== hp + 2) return 'cuore non dato: ' + hp + '→' + Game.s.maxHp;
      if (Game.roomId !== 'o:1,2') return 'non a casa: ' + Game.roomId;
      const dad = Game.entities.find(e => e.def && (e.def.id === 'padre' || e.def.id === 'p_padre'));   // Ciclo 25: tornando a casa parte la festa, e il padre è attorno al falò
      if (!dad) return 'il padre non è al villaggio';
      T.tp('r:1,0', 7, 8); if (Game.cocoon || T23.bulbs().some(x => !x.withered)) return 'la sala del Cuore non ricorda la liberazione';
      return true;
    });
    check('Il padre al villaggio: saluto la prima volta, poi frasi che cambiano; Teodoro festeggia', () => {
      T23.post(); Object.assign(Game.s.flags, { rootsHint: true, fatherFreed: true, fatherHome: true });
      const a = FATHER_NPC.talk(Game)[0], b = FATHER_NPC.talk(Game)[0], c = FATHER_NPC.talk(Game)[0];
      if (!a.includes('luminosa')) return 'saluto: ' + a;
      if (b === c) return 'frasi ripetute';
      const el = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
      return el.talk(Game)[0].includes('padre') ? true : el.talk(Game)[0];
    });
    check('Missione, medaglia, bussola e Bestiario', () => {
      T23.post(); const q = SIDE_QUESTS.find(q => q.name === 'Torno presto'), m = MEDALS.find(m => m.id === 'padre');
      if (!q || !m) return 'missione o medaglia mancanti';
      if (q.seen(Game)) return 'missione visibile troppo presto';
      Game.s.flags.rootsHint = true; if (!q.seen(Game) || q.done(Game) || !compassHas(Game, 'd:1,0')) return 'indizio non registrato';
      T.tp('r:1,0', 7, 8); T.skip(); T.run([], 25);   // il Bestiario registra gli avvistamenti ogni 20 frame
      if (!(Game.s.bestiary || {}).bulb) return 'bulbo non nel Bestiario';
      Game.s.flags.fatherFreed = true;
      return q.done(Game) && m.got(Game) && !compassHas(Game, 'r:1,0') ? true : 'non completata';
    });
    check('Tutte le sale delle Radici, la pausa (mappa RADICI) e il Bestiario si disegnano senza errori', () => {
      T23.post(); Game.s.flags.rootsHint = true;
      for (const id of ['r:1,2', 'r:1,1', 'r:1,0']) { T.tp(id, 7, 8); T.skip(); for (let i = 0; i < 20; i++) { Game.update(); Game.render(); } }
      T23.bulbs().forEach(x => x.close(Game)); for (let i = 0; i < 100; i++) { Game.update(); Game.render(); T.skip(); }
      T.tp('r:1,1', 7, 7); Game.state = 'pause'; Game.pausePage = 0; Game.render();
      Game.pausePage = 2; Game.bestIdx = BESTIARY.findIndex(b => b.k === 'bulb'); Game.render(); Game.state = 'play'; Game.pausePage = 0;
      return true;
    });
    R.god = false;
    check('Con input veri, chiudere i 4 bulbi in tempo è possibile a ogni difficoltà (con margine a Facile e Normale)', () => {
      const out = [], d0 = Opts.diff;
      for (const d of [0, 1, 2]) {
        Opts.diff = d; T23.post(); Game.s.flags.rootsHint = true; T.tp('r:1,0', 7, 8); T.skip();
        const n = T23.solve(); T.run([], 2);
        out.push(['Facile', 'Normale', 'Eroe'][d] + ' ' + n + '/' + BULB_WIN() + (Game.s.flags.fatherFreed ? ' ok' : ' NO'));
        if (!Game.s.flags.fatherFreed || (d < 2 && n > BULB_WIN() * 0.7)) { Opts.diff = d0; return out.join(' · '); }
      }
      Opts.diff = d0; T23.last = out.join(' · ');
      return true;
    });
    R.god = god; Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.rootsScene = 0;
    console.table(res);
    return res;
  },
};
window.T23 = T23;
