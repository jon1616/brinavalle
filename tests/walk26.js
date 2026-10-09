'use strict';
/* =====================================================================
 *  TEST DEL CICLO 26 (Agente B) — «due passi con papà».   T26.suite()  (con ?test)
 * ===================================================================== */
const T26 = {
  /* dopo la festa, di pomeriggio, in piazza davanti al padre */
  setup(extra) {
    T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true });
    Object.assign(Game.s.flags, { victory: true, fatherFreed: true, fatherHome: true, fatherGift: true, fatherHello: true, dadInvite: true,
      partyOn: true, partyToast: true, partyDone: true }, extra || {});
    Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * 0.5;
    T.tp('o:1,2', 5, 6); T.noEnemies(); Game.dialog = null;
  },
  home() { return Game.entities.find(e => e.def === FATHER_NPC); },
  walker() { return Game.dadWalker && Game.entities.includes(Game.dadWalker) ? Game.dadWalker : null; },
  /* sceglie una voce dall'ultimo menu del padre */
  choose(lines, label) { const d = lines.find(l => l && l.choices); return d.choices.find(c => c.label === label).fn(Game); },
  start() { return T26.choose(FATHER_NPC.talk(Game), 'Andiamo!'); },
  text() { const d = Game.dialog; return d ? [d.entry && d.entry.text, ...d.queue.map(e => typeof e === 'string' ? e : e && e.text)].filter(Boolean).join(' | ') : ''; },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Prima della fine della festa il padre non propone la passeggiata; dopo sì', () => {
      T26.setup({ partyDone: false }); const a = FATHER_NPC.talk(Game).some(l => l && l.choices);
      T26.setup(); const b = FATHER_NPC.talk(Game).some(l => l && l.choices && /due passi/.test(l.text));
      return !a && b ? true : 'prima ' + a + ' dopo ' + b;
    });
    check('«Andiamo!»: il padre fermo sparisce e uno che cammina prende il suo posto', () => {
      T26.setup(); if (!T26.home()) return 'padre non in piazza';
      T26.start();
      return !T26.home() && T26.walker() && Game.s.flags.dadWalk ? true : 'fermo ' + !!T26.home() + ' cammina ' + !!T26.walker();
    });
    check('Segue Lio sulle sue orme e resta un passo indietro', () => {
      T26.setup(); T26.start(); Game.dadWalker.memoT = 0; Game.s.flags['memo:o:1,2'] = true;
      T.run(['right'], 70); T.run([], 60);
      const w = T26.walker(), d = Math.hypot(w.x - Game.player.x, w.y - Game.player.y);
      return d > 8 && d < 48 ? true : 'distanza ' + d.toFixed(1);
    });
    check('Viene con te nelle altre stanze all\'aperto e nelle case', () => {
      T26.setup(); T26.start(); T.tp('o:1,1', 7, 6); const a = !!T26.walker(); T.tp('i:elder', 7, 7); const b = !!T26.walker();
      return a && b ? true : 'aperto ' + a + ' casa ' + b;
    });
    check('Nei dungeon ti aspetta fuori (con un avviso), e uscendo è di nuovo con te', () => {
      T26.setup(); T26.start(); T.skip(); T.tp('d:1,2', 7, 8); T.noEnemies(); const inD = !!T26.walker(); T.run([], 70); const ban = Game.banner && /aspetto/.test(Game.banner.text);
      T.tp('o:1,0', 7, 6); const out = !!T26.walker();
      return !inD && ban && out ? true : 'nel dungeon ' + inD + ' avviso ' + ban + ' fuori ' + out;
    });
    check('In ogni luogo all\'aperto racconta un ricordo, una volta sola', () => {
      T26.setup(); T26.start(); T.skip();
      T.tp('o:2,2', 7, 6); T.noEnemies(); T.run([], 80); const t = T26.text(); T.skip();
      T.tp('o:1,2', 5, 6); T.tp('o:2,2', 7, 6); T.noEnemies(); T.run([], 80); const again = !!Game.dialog;
      return /scivolava/.test(t) && Game.s.flags['memo:o:2,2'] && !again ? true : 'ricordo «' + t + '» di nuovo ' + again;
    });
    check('Non interrompe: se Lio sta già parlando, il ricordo aspetta', () => {
      T26.setup(); T26.start(); T.skip(); T.tp('o:2,1', 7, 6); T.noEnemies();
      Game.say(['Un cartello qualsiasi.']); T.run([], 100);
      const first = T26.text(); T.skip(); T.run([], 80);
      return /cartello/.test(first) && /frutteto/.test(T26.text()) ? true : first + ' / ' + T26.text();
    });
    check('Tutti e 9 i ricordi: dono di 60 gemme e medaglia «Passo dopo passo»', () => {
      T26.setup(); T26.start(); T.skip();
      for (const id of DAD_MEM_IDS.slice(0, 8)) Game.s.flags['memo:' + id] = true;
      const g0 = Game.s.gems; T.tp('o:0,0', 14, 9); T.noEnemies(); T.run([], 80);
      const t = T26.text(); T.skip();
      const m = MEDALS.find(x => x.id === 'ricordi');
      return /bivacco/.test(t) && /giro di tutta la valle/.test(t) && Game.s.gems - g0 === 60 && m.got(Game) ? true : 'gemme ' + (Game.s.gems - g0) + ' · ' + t;
    });
    check('Parlandogli: continuare, e al lago di mattina anche la gara; «Torna a casa» lo rimette al suo posto', () => {
      T26.setup(); T26.start(); T.skip();
      const menu = () => { Game.player.x = Game.dadWalker.x; Game.player.y = Game.dadWalker.y - 14; Game.player.dir = 0; Game.tryInteract(); const d = Game.dialog && Game.dialog.entry; return d && d.choices ? d.choices.map(c => c.label).join(',') : 'nessun menu'; };
      const a = menu(); T.skip();
      Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * 0.1; Game.s.flags.hookReturned = true; T.tp('o:0,2', 9, 2); T.noEnemies(); Game.s.flags['memo:o:0,2'] = true; Game.dadWalker.memoT = 0;
      const b = menu(); T.skip();
      Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * 0.5; T.tp('o:1,2', 5, 6); Game.dadWalker.memoT = 0; Game.dialog = null;
      Game.player.x = Game.dadWalker.x; Game.player.y = Game.dadWalker.y - 14; Game.player.dir = 0;
      Game.tryInteract(); const d = Game.dialog.entry.choices.find(c => c.label === 'Torna a casa'); Game.dialog = null; Game.say(d.fn(Game)); T.skip();
      const back = !Game.s.flags.dadWalk && !T26.walker() && !!T26.home();
      return a === 'Continuiamo,Torna a casa' && b === 'Continuiamo,Gara di pesca,Torna a casa' && back ? true : a + ' / ' + b + ' / a casa ' + back;
    });
    check('Mentre passeggia non c\'è un secondo padre (né in piazza né al lago)', () => {
      T26.setup(); T26.start(); const a = FATHER_NPC.cond(Game);
      Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * 0.1; const b = DAD_LAKE.cond(Game);
      return !a && !b ? true : 'piazza ' + a + ' lago ' + b;
    });
    check('La passeggiata si salva: ricaricando, il padre è ancora con te', () => {
      T26.setup(); T26.start(); Game.saveGame(); const sv = JSON.parse(localStorage.getItem(SAVE_KEY));
      Game.entities = []; Game.dadWalker = null; T.tp('o:1,1', 7, 6);
      return sv.flags.dadWalk && T26.walker() ? true : 'salvato ' + sv.flags.dadWalk;
    });
    check('Il padre che cammina si disegna in ogni direzione, col fumetto, senza errori', () => {
      T26.setup(); T26.start(); const w = Game.dadWalker;
      for (let d = 0; d < 4; d++) for (const mv of [false, true]) { w.dir = d; w.moving = mv; w.memoT = 20; w.t = 8 * d; Game.render(); }
      return true;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Medals.data = md; Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0; Game.dadWalker = null;
    console.table(res);
    return res;
  },
};
window.T26 = T26;
