'use strict';
/* =====================================================================
 *  TEST DEL CICLO 24 (Agente B) — «una mattina al lago»: la gara di pesca
 *  col padre, e i bulbi che suonano.   T24.suite()  (con ?test)
 * ===================================================================== */
const T24 = {
  setup(morning, extra) {
    T.fresh({ sword: true });
    Object.assign(Game.s.flags, { victory: true, fatherFreed: true, fatherHome: true, fatherHello: true, hookReturned: true }, extra || {});
    Game.s.dayStart = (Game.s.time || 0) - DAY_LEN * (morning ? 0.1 : 0.7);
  },
  /* inizia la gara come un giocatore: parla col padre al lago e sceglie "Gara!" */
  start() {
    const d = DAD_LAKE.talk(Game).find(l => l && l.choices);
    d.choices.find(c => c.label === 'Gara!').fn(Game);
  },
  /* un lancio di Lio: cm = pesce preso, 0 = lenza ritirata */
  cast(cm, id) {
    const F = Game.fsh;
    if (cm) { F.fish = { sp: FISH.find(s => s.id === (id || 'carpa')), size: cm, D: 10 }; F.phase = 'reel'; Game.fishCaught(); F.phase = 'aim'; F.card = null; }
    else { F.phase = 'wait'; F.bob = { x: 100, y: 60, dip: 0 }; Game.fishReset(null); }
  },
  frames(n) { for (let i = 0; i < n && Game.state === 'fishing'; i++) { Game.update(); Input.endFrame(); } },
  /* gara completa con il padre "truccato": restituisce le righe del verdetto */
  duel(mine, his) {
    const old = dadCast; let k = 0;
    dadCast = () => { const cm = his[k++]; return cm ? { sp: FISH.find(s => s.id === 'persico'), cm } : null; };
    try { T24.start(); for (const cm of mine) T24.cast(cm); T24.frames(80); } finally { dadCast = old; }
    const q = Game.dialog ? [Game.dialog.entry && Game.dialog.entry.text, ...Game.dialog.queue.map(e => typeof e === 'string' ? e : e && e.text)] : [];
    return q.filter(Boolean).join(' | ');
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, sfx = Sound.sfx, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } finally { Sound.sfx = sfx; } };
    check('Il padre: al villaggio finché non ti invita; poi di mattina al lago e il resto del giorno al villaggio', () => {
      T24.setup(true); const a = [FATHER_NPC.cond(Game), DAD_LAKE.cond(Game)];
      Game.s.flags.dadInvite = true; const b = [FATHER_NPC.cond(Game), DAD_LAKE.cond(Game)];
      T24.setup(false, { dadInvite: true }); const c = [FATHER_NPC.cond(Game), DAD_LAKE.cond(Game)];
      return '' + a + b + c === 'true,falsefalse,truetrue,false' ? true : JSON.stringify([a, b, c]);
    });
    check('L\'invito arriva alla seconda chiacchierata, senza coprire il primo saluto', () => {
      T24.setup(false, { fatherHello: false });
      const t1 = FATHER_NPC.talk(Game).join(' '), t2 = FATHER_NPC.talk(Game).join(' '), t3 = FATHER_NPC.talk(Game).join(' ');
      return /fiero/.test(t1) && /domattina/.test(t2) && !/domattina/.test(t3) ? true : [t1, t2, t3].join(' / ');
    });
    check('Senza la canna di Pino il padre spiega come averla (niente gara)', () => {
      T24.setup(true, { dadInvite: true, hookReturned: false });
      const t = DAD_LAKE.talk(Game);
      return t.every(l => typeof l === 'string') && /amo d'oro/.test(t.join(' ')) ? true : JSON.stringify(t);
    });
    check('Gara vinta: tre lanci, verdetto, 40 gemme, medaglia «Tale padre, tale figlio»', () => {
      T24.setup(true, { dadInvite: true }); T.tp('o:0,2', 9, 2); const g0 = Game.s.gems;
      const v = T24.duel([0, 60, 0], [20, 0, 25]); T.skip();
      const won = Game.s.gems - g0 - (FISH.find(s => s.id === 'carpa').gems + Math.round(60 / 72 * 8));   // meno le gemme del pesce
      const m = MEDALS.find(x => x.id === 'gara');
      return /60 cm/.test(v) && /25 cm/.test(v) && /battuto/.test(v) && won === 40 && Game.s.flags.dadWins === 1 && m.got(Game) && Game.state === 'play'
        ? true : 'verdetto: ' + v + ' · gemme ' + won + ' · stato ' + Game.state;
    });
    check('Seconda vittoria: solo 10 gemme', () => {
      T24.setup(true, { dadInvite: true, dadWins: 1, dadDuels: 1 }); T.tp('o:0,2', 9, 2);
      const v = T24.duel([40, 0, 0], [0, 0, 0]); return /Di nuovo/.test(v) && Game.s.flags.dadWins === 2 ? true : v;
    });
    check('Gara persa: il padre dà un consiglio; nessuna vittoria registrata', () => {
      T24.setup(true, { dadInvite: true }); T.tp('o:0,2', 9, 2);
      const v = T24.duel([0, 30, 0], [50, 0, 0]);
      return /vince il vecchio/.test(v) && /largo/.test(v) && !Game.s.flags.dadWins && Game.s.flags.dadDuels === 1 ? true : v;
    });
    check('Finiti i tre lanci non si può lanciare ancora: subito il verdetto', () => {
      T24.setup(true, { dadInvite: true }); T.tp('o:0,2', 9, 2);
      const old = dadCast; dadCast = () => null;
      T24.start(); T24.cast(0); T24.cast(0); T24.cast(0);
      let cast = false;
      for (let i = 0; i < 80 && Game.state === 'fishing'; i++) { Input.down.add('action'); Game.update(); Input.endFrame(); if (Game.fsh && (Game.fsh.charging || Game.fsh.phase !== 'aim')) cast = true; }
      Input.down.clear(); dadCast = old;
      return !cast && Game.state !== 'fishing' && Game.s.flags.dadDuels === 1 ? true : 'lancio ' + cast + ' stato ' + Game.state;
    });
    check('Uscire a metà gara: il padre la rimanda, la gara non conta', () => {
      T24.setup(true, { dadInvite: true }); T.tp('o:0,2', 9, 2);
      T24.start(); T24.cast(0); Game.endFishing();
      const t = [Game.dialog && Game.dialog.entry && Game.dialog.entry.text, ...(Game.dialog ? Game.dialog.queue : [])].filter(x => typeof x === 'string').join(' ');
      return /un'altra mattina/.test(t) && !Game.s.flags.dadDuels ? true : t;
    });
    check('Il padre prende qualcosa più spesso a difficoltà alta (circa 55% / 70% / 80%)', () => {
      T24.setup(true); const d0 = Opts.diff, out = [];
      for (const d of [0, 1, 2]) { Opts.diff = d; let k = 0; for (let i = 0; i < 3000; i++) if (dadCast(Game)) k++; out.push(k / 3000); }
      Opts.diff = d0;
      return Math.abs(out[0] - 0.55) < 0.04 && Math.abs(out[1] - 0.7) < 0.04 && Math.abs(out[2] - 0.8) < 0.04 ? true : out.map(x => x.toFixed(3)).join(' ');
    });
    check('Scena di gara disegnata (padre, lenza, punteggio) senza errori, diversa dalla pesca normale', () => {
      T24.setup(true, { dadInvite: true }); T.tp('o:0,2', 9, 2); FEEL.on = true; Sky.reset();
      const px = () => { Game.render(); const d = bctx.getImageData(DAD_SPOT.x - 16, DAD_SPOT.y - 20, 40, 36).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * 3 + d[i + 1] * 5 + d[i + 2] * 7; return s; };
      Game.startFishing(); Game.fsh.t = 0; const plain = px(); Game.endFishing(); Game.dialog = null;
      T24.start(); Game.fsh.duel.dadMsg = { text: 'Carpa Dorata 71 cm', t: 50 }; const duel = px();
      Game.fsh.duel = null; Game.endFishing(); Game.dialog = null;
      return plain !== duel ? true : 'il padre non si vede';
    });
    check('I bulbi suonano do-mi-sol-do: la nota dice quanti sono chiusi insieme; un bulbo già chiuso non risuona', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { victory: true, rootsHint: true, rootsHeart: true }); T.tp('r:1,0', 7, 8); Game.dialog = null;
      const heard = []; Sound.sfx = n => { if (/^bulb/.test(n)) heard.push(n); };
      const bs = Game.entities.filter(e => e instanceof Bulb);
      bs[0].close(Game); bs[0].close(Game); bs[1].close(Game); bs[2].close(Game);
      bs[0].closed = 0; bs[0].close(Game);   // riaperto e richiuso: ora sono 3
      bs[3].close(Game);
      return heard.join(',') === 'bulb1,bulb2,bulb3,bulb3,bulb4' ? true : heard.join(',');
    });
    check('Missione «Una mattina al lago» nel diario: vista dopo l\'invito, completata con la prima vittoria', () => {
      T24.setup(false); const q = SIDE_QUESTS.find(x => x.name === 'Una mattina al lago');
      const a = !!q.seen(Game); Game.s.flags.dadInvite = true; const b = !!q.seen(Game) && !q.done(Game); Game.s.flags.dadWins = 1;
      return !a && b && q.done(Game) ? true : a + ' ' + b;
    });
    check('Correzione al Ciclo 23: la scena del padre in sospeso non segue Lio in una nuova partita; se interrotta si ripete, col dono una volta sola', () => {
      T.fresh({ sword: true }); Game.rootsScene = 40;   // come se il padre fosse appena stato liberato in un'altra partita
      T.tp('o:1,2', 7, 6); T.run([], 60);
      if (Game.dialog || Game.entities.some(e => e.def && e.def.id === 'padre')) return 'la scena è partita nella partita sbagliata';
      Object.assign(Game.s.flags, { victory: true, fatherFreed: true, rootsHeart: true }); const hp0 = Game.s.maxHp;
      T.tp('r:1,0', 7, 8); T.run([], 40);
      const a = Game.dialog && /Lio\?/.test(Game.dialog.entry.text + Game.dialog.queue.join(' '));
      Game.dialog = null; Game.rootsScene = 0; T.tp('r:1,0', 7, 8); T.run([], 40);   // interrotta prima della fine: si ripete
      const b = !!Game.dialog; T.skip(); T.run([], 60);
      return a && b && Game.s.maxHp === hp0 + 2 && Game.s.flags.fatherHome ? true : 'scena ' + a + '/' + b + ' cuori +' + (Game.s.maxHp - hp0) + ' casa ' + Game.s.flags.fatherHome;
    });
    Sound.sfx = sfx; Sky.reset(); Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0; Game.fsh = null;
    console.table(res);
    return res;
  },
};
window.T24 = T24;
