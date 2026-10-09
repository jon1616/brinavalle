'use strict';
/* =====================================================================
 *  CICLO 25 — test della festa del ritorno.   T25.suite()  (con ?test)
 * ===================================================================== */
const T25 = {
  post() {
    T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true, bigkey: true, crystal: true });
    Object.assign(Game.s.flags, { victory: true, boss: true, bivouac: true, bivouacTold: true, rootsHint: true, fatherFreed: true, fatherGift: true });
  },
  /* il ritorno a casa col padre, come alla fine della scena delle Radici */
  comeHome() {
    T25.post(); T.tp('r:1,0', 7, 8); Game.rootsScene = 0; T.skip();
    Game.s.flags.fatherHome = true; Game.startWarp({ to: 'o:1,2', x: 4, y: 4, dir: 0 }, 'Z');
    for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
  },
  frames(n) { for (let i = 0; i < n; i++) { Game.update(); Input.endFrame(); } },
  guests() { return Game.entities.filter(e => e.def && e.def.dance); },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, fx = FEEL.on, mus = Sound.music, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    let lastMusic = null; Sound.music = function (m) { lastMusic = m; return mus.apply(this, arguments); };
    check('Senza il padre a casa nessuna festa', () => {
      T25.post(); Game.s.flags.fatherFreed = false; T.tp('o:1,1', 7, 6); Game.startWarp({ to: 'o:1,2', x: 4, y: 4, dir: 0 }, 'door');
      for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      return !Game.s.flags.partyOn && !T25.guests().length ? true : 'festa partita';
    });
    check('Tornando a casa col padre: è notte, si accende il falò, otto invitati, musica della festa', () => {
      lastMusic = null; T25.comeHome();
      if (!Game.s.flags.partyOn) return 'festa non partita';
      if (!Game.dialog || !/sole è già tramontato/.test(JSON.stringify(Game.dialog.pages))) return 'manca il racconto';
      if (Sky.night(Sky.phase(Game)) !== 1) return 'non è notte: fase ' + Sky.phase(Game).toFixed(2);
      if (!Game.entities.some(e => e instanceof Bonfire)) return 'niente falò';
      if (T25.guests().length !== 8) return 'invitati: ' + T25.guests().length;
      if (lastMusic !== 'festa') return 'musica: ' + lastMusic;
      const plain = Game.entities.filter(e => e.def && ['nina', 'marta', 'padre'].includes(e.def.id));
      return plain.length ? 'doppioni in piazza: ' + plain.map(e => e.def.id) : true;
    });
    check('Ogni invitato ha qualcosa da dire, e tutti guardano il fuoco', () => {
      T25.comeHome(); T.skip(); T25.frames(5);
      for (const n of T25.guests()) {
        const l = n.def.talk(Game);
        if (!l.length || typeof l[0] !== 'string') return 'muto: ' + n.def.id;
        const dx = FIRE.x + 8 - n.cx(), dy = FIRE.y + 8 - n.cy(), want = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
        if (n.dir !== want) return n.def.id + ' non guarda il fuoco';
      }
      return true;
    });
    check('La notte aspetta il brindisi', () => {
      T25.comeHome(); T.skip(); Game.s.dayStart = Game.s.time - DAY_LEN * 0.84;
      T25.frames(600);
      return Sky.phase(Game) < 0.86 ? true : 'la notte è passata: ' + Sky.phase(Game).toFixed(3);
    });
    check('Il brindisi: fuochi d\'artificio, poi il cartello FINE; si torna a giocare', () => {
      T25.comeHome(); T.skip();
      const dad = T25.guests().find(n => n.def.toast);
      Game.say(dad.talk(Game)); T.skip();
      if (!Game.s.flags.partyToast || !(Game.fireworks > 0)) return 'brindisi non registrato';
      let fwMax = 0;
      for (let i = 0; i < 200 && Game.state !== 'finale'; i++) { T25.frames(1); fwMax = Math.max(fwMax, PartyFW.length); }
      if (Game.state !== 'finale') return 'cartello non comparso';
      if (!fwMax) return 'nessun fuoco d\'artificio';
      for (let i = 0; i < 20; i++) { T25.frames(1); Game.render(); }
      Input.pressed.add('action'); T25.frames(1); if (Game.state !== 'finale') return 'il cartello si chiude troppo presto';
      T25.frames(160); Game.render(); Input.pressed.add('action'); T25.frames(1);
      if (Game.state !== 'play') return 'non si torna a giocare';
      return dad.talk(Game)[0].includes('festa') ? true : 'il padre ripete il brindisi';
    });
    check('All\'alba la festa finisce: via falò e invitati, tornano gli abitanti di sempre; non ricomincia', () => {
      T25.comeHome(); T.skip(); Game.s.flags.partyToast = true; Game.fireworks = 0;
      Game.s.dayStart = Game.s.time - DAY_LEN * 0.97; T25.frames(3);
      if (!Game.s.flags.partyDone) return 'festa non finita';
      if (Game.entities.some(e => e instanceof Bonfire) || T25.guests().length) return 'falò o invitati ancora in piazza';
      if (!Game.entities.some(e => e.def && e.def.id === 'nina')) return 'Nina non è tornata';
      T.tp('o:1,1', 7, 6); Game.startWarp({ to: 'o:1,2', x: 7, y: 9, dir: 1 }, 'door');
      for (let i = 0; i < 60 && Game.state !== 'play'; i++) T.run([], 1);
      return !Game.entities.some(e => e instanceof Bonfire) && !Game.dialog ? true : 'la festa ricomincia';
    });
    check('Medaglia «La festa del ritorno»', () => {
      const m = MEDALS.find(m => m.id === 'festa'); if (!m) return 'manca';
      T25.post(); if (m.got(Game)) return 'già presa'; Game.s.flags.partyToast = true; return m.got(Game) ? true : 'non presa';
    });
    check('Si disegna senza errori (anche senza effetti visivi), e costa poco', () => {
      T25.comeHome(); T.skip(); Game.fireworks = 300;
      FEEL.on = false; for (let i = 0; i < 30; i++) { T25.frames(1); Game.render(); } FEEL.on = true;
      const t0 = performance.now(); for (let i = 0; i < 300; i++) { T25.frames(1); Game.render(); }
      const ms = (performance.now() - t0) / 300;
      return ms < 5 ? true : ms.toFixed(2) + ' ms per frame';
    });
    Sound.music = mus; FEEL.on = fx; Medals.data = md; Game.fireworks = 0; Game.finaleIn = 0; PartyFW.length = 0;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T25 = T25;
