'use strict';
/* =====================================================================
 *  TEST DEL CICLO 18 (Agente B) — la catena dei doni e la Bussola dei Segreti.
 *  Si carica con index.html?test. Da console:  T18.suite()
 *  Gli scambi avvengono parlando davvero con gli NPC (tryInteract), non chiamando funzioni.
 * ===================================================================== */
const T18 = {
  /* chiude i dialoghi; nei menu a scelta prende l'ultima voce ("Niente"), così non si pesca e non si compra */
  skipNo() {
    for (let n = 0; n < 300 && Game.dialog; n++) {
      const d = Game.dialog;
      if (d.entry.choices && d.pageIdx === d.pages.length - 1) { d.shown = 9999; d.choiceIdx = d.entry.choices.length - 1; }
      Input.pressed.add('action'); Game.update(); Input.endFrame(); T.run([], 3);
    }
    return !Game.dialog;
  },
  /* va accanto all'NPC (sotto, rivolto in su) e ci parla; ritorna tutte le battute viste */
  talkTo(room, id) {
    T.tp(room, 7, 7); T.noEnemies();
    const e = Game.entities.find(x => x.def && x.def.id === id);
    if (!e) throw new Error('NPC assente: ' + id + ' in ' + room);
    e.walk = null;
    const p = Game.player;
    p.x = e.x; p.y = e.y + (room === 'i:shop' ? 30 : 14); p.dir = 1;
    const seen = [];
    Input.pressed.add('action'); Game.update(); Input.endFrame();
    for (let n = 0; n < 300 && Game.dialog; n++) {
      const d = Game.dialog, t = (d.speaker ? d.speaker + ': ' : '') + d.pages.map(pg => pg.join(' ')).join(' ');
      if (seen[seen.length - 1] !== t) seen.push(t);
      if (d.entry.choices && d.pageIdx === d.pages.length - 1) { d.shown = 9999; d.choiceIdx = d.entry.choices.length - 1; }
      Input.pressed.add('action'); Game.update(); Input.endFrame(); T.run([], 3);
    }
    return seen;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Senza spada Marta non chiede nulla', () => {
      T.fresh({}); Game.s.flags.intro = true; T18.talkTo('o:1,2', 'marta');
      return !(Game.s.flags.trade) && !Game.s.items.torta ? true : 'catena partita troppo presto';
    });
    check('Catena completa parlando con gli NPC: torta → lettera → perla → ago → bussola', () => {
      T.fresh({ sword: true }); Game.s.flags.intro = true; Game.s.gems = 0;
      const log = [];
      for (const [room, id, item] of [['o:1,2', 'marta', 'torta'], ['o:2,0', 'silvano', 'lettera'], ['o:0,2', 'pino', 'perla'], ['i:shop', 'bortolo', 'ago'], ['i:elder', 'teodoro', 'compass']]) {
        T18.talkTo(room, id);
        log.push(id + '→' + item + ':' + !!Game.s.items[item]);
        if (!Game.s.items[item]) return 'fermo a ' + id + ' (' + log.join(', ') + ')';
      }
      const left = ['torta', 'lettera', 'perla', 'ago'].filter(k => Game.s.items[k]);
      return Game.s.flags.trade === 5 && !left.length ? true : 'trade ' + Game.s.flags.trade + ' doni rimasti ' + left.join(',');
    });
    check('Il dono di benvenuto di Silvano non si perde se la prima chiacchierata è lo scambio', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { intro: true, trade: 1 }); Game.s.items.torta = true; Game.s.gems = 0;
      T18.talkTo('o:2,0', 'silvano');
      return Game.s.flags.hermitGift && Game.s.gems >= 10 && Game.s.items.lettera ? true : 'dono ' + !!Game.s.flags.hermitGift + ' gemme ' + Game.s.gems;
    });
    check('Bortolo: dopo lo scambio apre comunque la bottega (menu a scelta)', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { intro: true, trade: 3 }); Game.s.items.perla = true;
      const seen = T18.talkTo('i:shop', 'bortolo');
      return Game.s.items.ago && seen.some(l => /Cosa ti porto/.test(l)) ? true : JSON.stringify(seen.slice(-2));
    });
    check('A catena finita Silvano lascia la radura e pesca con Pino al lago', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { intro: true, trade: 5, hermitGift: true }); Game.s.items.compass = true;
      T.tp('o:2,0', 7, 7); const inRadura = Game.entities.some(e => e.def && e.def.id === 'silvano');
      const seen = T18.talkTo('o:0,2', 'silvano_lago');
      return !inRadura && seen.some(l => /fatto pace/.test(l)) ? true : 'radura ' + inRadura + ' ' + JSON.stringify(seen);
    });
    check('Bussola: segna stanze con forzieri chiusi, semi e stanze segrete; non quelle vuote', () => {
      T.fresh({ sword: true });
      const a = compassHas(Game, 'o:0,2'), sec = compassHas(Game, 'c:0,0'), seed = compassHas(Game, 'o:2,1');
      Game.s.flags['chest:c_lake'] = Game.s.flags['chest:c_islet'] = true;
      ['c_lakeswim'].forEach(id => { Game.s.flags['chest:' + id] = true; });
      const empty = compassHas(Game, 'o:1,1');
      return a && sec && seed && !empty ? true : [a, sec, seed, empty].join(',');
    });
    check('Mappa della pausa: con la bussola compaiono le stanze segrete non visitate', () => {
      T.fresh({ sword: true }); Game.s.items.compass = true; T.tp('c:1,1', 7, 6); Game.state = 'pause';
      let star = 0; const o = window.drawCompassStar; window.drawCompassStar = function () { star++; return o.apply(this, arguments); };
      try { Game.render(); } finally { window.drawCompassStar = o; Game.state = 'title'; }
      return star >= 2 ? true : 'stelle disegnate: ' + star;
    });
    check('Entrando in una stanza con qualcosa da trovare la bussola vibra (una volta)', () => {
      T.fresh({ sword: true }); Game.s.items.compass = true; Game.compassFelt.clear();
      T.tp('o:1,1', 7, 6); Game.lastName = 'x'; T.tp('o:0,2', 7, 9); Game.afterEnter();
      const first = Game.banner && /bussola/.test(Game.banner.text);
      Game.banner = null; Game.afterEnter();
      const second = Game.banner && /bussola/.test(Game.banner.text);
      return first && !second ? true : 'prima ' + first + ' seconda ' + second;
    });
    check('Diario e Albo: missione con avanzamento e medaglia "Il viandante"', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { intro: true, trade: 2 });
      const q = Game.knownQuests().find(x => x.name === 'La catena dei doni');
      const m = MEDALS.find(x => x.id === 'bussola');
      return q && q.prog(Game) === '2/5' && /Pino/.test(q.hint) && m ? true : 'missione ' + !!q + ' medaglia ' + !!m;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null;
    console.table(res);
    return res;
  },
};
window.T18 = T18;
