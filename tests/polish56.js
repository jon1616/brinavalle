'use strict';
/* =====================================================================
 *  TEST DEL CICLO 56 (Agente B) — RIFINITURA: nessuna attesa a vuoto.
 *  Un giorno dura 6 minuti. Alcune mete valgono solo a certe ore: l'Isola della Stella (DI NOTTE),
 *  la gara col padre (DI MATTINA), i fuochi fatui e il Luccio Lunare (DI NOTTE). Si poteva riposare
 *  fino a un'ora scelta solo nella tenda di Nadira, nel deserto: altrove si aspettavano fino a 4 minuti
 *  veri senza fare niente. Ora lo stesso riposo (restChoices, amber.js) c'è anche da Lina (Costa),
 *  da Rufo (Pietrabianca) e col padre («Riposiamo a casa», dopo la festa).
 *  T56.suite()  (con ?test)
 * ===================================================================== */
const T56 = {
  PLACES: [
    ['Lina', 'i:osteria', () => ROOMS['i:osteria'].npcs[0].talk(Game), 'Una branda'],
    ['Rufo', 'i:locanda', () => ROOMS['i:locanda'].npcs[0].talk(Game), 'Una stanza'],
    ['Papà', 'o:1,2', () => FATHER_NPC.talk(Game), 'Riposiamo a casa'],
  ],
  /* sceglie «label» nel menu (l'ultima voce con delle scelte), poi l'ora «hour» nel menu del riposo */
  rest(entries, label, hour) {
    const menu = [...entries].reverse().find(e => e && e.choices); if (!menu) return 'nessun menu';
    const c = menu.choices.find(x => x.label === label); if (!c) return 'manca la scelta «' + label + '»';
    const sub = c.fn(Game).find(e => e && e.choices); if (!sub) return 'nessun menu delle ore';
    const h = sub.choices.find(x => x.label === hour); if (!h) return 'manca l\'ora «' + hour + '»';
    return h.fn(Game);
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    const setup = room => { T.fresh({ sword: true }); Object.assign(Game.s.flags, { victory: true, partyDone: true }); Game.s.time = 1000; Game.s.dayStart = 1000; T.tp(room, 7, 7); Game.dialog = null; Game.s.hp = 2; };
    check('Lina, Rufo e il padre: si può dormire fino a notte fonda o fino al mattino, e ci si sveglia con tutti i cuori', () => {
      const bad = [];
      for (const [who, room, talk, label] of T56.PLACES) {
        setup(room);
        const r = T56.rest(talk(), label, 'A notte fonda');
        if (typeof r === 'string') { bad.push(who + ': ' + r); continue; }
        if (!(Sky.night(Sky.phase(Game)) > 0.5)) bad.push(who + ': dopo «A notte fonda» non è notte (fase ' + Sky.phase(Game).toFixed(2) + ')');
        if (Game.s.hp !== Game.s.maxHp) bad.push(who + ': i cuori non sono pieni');
        T56.rest(talk(), label, 'Al mattino');
        if (!dadMorning(Game)) bad.push(who + ': dopo «Al mattino» non è mattina');
      }
      return bad.length ? bad.join(' | ') : true;
    });
    check('Costa: dopo una notte da Lina, all\'Isola della Stella il raggio del Faro apre il cratere', () => {
      setup('i:osteria'); Game.s.flags.farolit = true;
      T56.rest(ROOMS['i:osteria'].npcs[0].talk(Game), 'Una branda', 'A notte fonda');
      T.tp('m:2,2', 7, 7); Game.dialog = null; Game.state = 'play';
      for (let i = 0; i < 30 && !Game.s.flags.craterOpen; i++) R.frame([]);
      return Game.s.flags.craterOpen ? true : 'il cratere resta chiuso (fase ' + Sky.phase(Game).toFixed(2) + ')';
    });
    check('Il cartello del cratere, di giorno, dice dove dormire; Nadira ha il suo riposo di sempre', () => {
      setup('m:2,2'); Game.s.flags.farolit = true;
      const t = craterTalk(Game).join(' ');
      if (!/osteria di Lina/.test(t)) return 'il cartello non nomina l\'osteria: ' + t.slice(0, 120);
      const menu = nadiraTalk(Game).find(e => e && e.choices);
      const ch = menu && menu.choices; if (!ch) return 'Nadira non offre il riposo';
      const labels = ch.map(c => c.label).join(',');
      return labels === 'Al mattino,A mezzogiorno,Al tramonto,A notte fonda,No, grazie' ? true : 'scelte di Nadira cambiate: ' + labels;
    });
    Medals.data = md; Game.dialog = null; Game.state = 'title';
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    console.table(res);
    return res;
  },
};
window.T56 = T56;
