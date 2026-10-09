'use strict';
/* =====================================================================
 *  TEST DEL CICLO 42 (Agente B) — RIFINITURA: la saga dall'inizio alla fine.
 *  T42.suite()  (con ?test)
 * ===================================================================== */
const T42 = {
  /* le tappe della saga, in ordine: a ogni passo si aggiungono questi flag */
  STEPS: [
    { intro: true }, { collapse: true }, { caveEntered: true }, { enteredDungeon: true }, { boss: true }, { victory: true },
    { seedQuest: true }, { garden: true }, { fatherFreed: true }, { fatherHome: true }, { partyOn: true }, { partyToast: true }, { partyDone: true },
    { northCall: true }, { northArrived: true }, { bellmanHello: true }, { 'chest:n_bell_lago': true }, { 'chest:n_bell_pineta': true, 'chest:n_bell_cima': true }, { northBells: true },
    { towerIn: true }, { towerLady: true }, { ladyTold: true }, { fatherRemembers: true }, { ch2Done: true },
    { ch3Call: true }, { amberIn: true }, { nadiraHello: true }, { 'chest:a_lens_rovine': true }, { 'chest:a_lens_oasi': true, 'chest:a_lens_stella': true }, { lensesSet: true }, { observatoryOpen: true }, { vIn: true }, { vesperVoice: true }, { ch3Done: true },
    { ch4Call: true }, { coastIn: true }, { marisaHello: true }, { 'chest:m_shard_faro': true }, { 'chest:m_shard_spiaggia': true, 'chest:m_shard_secche': true }, { farolit: true }, { craterOpen: true }, { starFreed: true }, { ch4Done: true },
    { ch5Call: true }, { seaIn: true }, { marevaHello: true }, { babyFound: true }, { conchMareva: true }, { 'chest:s_conch_onde': true, 'chest:s_conch_torre': true }, { templeOpen: true }, { wMother: true }, { ch5Done: true },
    { ch6Call: true }, { earthIn: true }, { brunaHello: true }, { 'chest:k_stone_miniera': true }, { 'chest:k_stone_fiume': true, 'chest:k_stone_talpe': true }, { rootsDoor: true }, { gHeart: true }, { ch6Done: true }, { ch6Home: true },
    { ch7Call: true }, { windIn: true }, { aliseoHello: true }, { 'chest:h_tail_ponte': true }, { 'chest:h_tail_gola': true, 'chest:h_tail_picco': true }, { bigKite: true }, { windSeen: true }, { qWind: true }, { ch7Done: true }, { ch7Home: true }, { lanternEast: true },
  ],
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Tutta la saga, tappa per tappa: l\'obiettivo sta nelle 4 righe della pausa e la meta del Segnavia è raggiungibile', () => {
      T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true }); const bad = [];
      for (const st of T42.STEPS) {
        Object.assign(Game.s.flags, st); T.tp('o:1,2', 7, 6); Game.dialog = null;
        const o = currentObjective(Game), lines = wrap(o, 138, 11).length, room = objectiveRoom(Game);
        if (!o) bad.push(Object.keys(st)[0] + ': obiettivo vuoto');
        if (lines > 4) bad.push(Object.keys(st)[0] + ': ' + lines + ' righe («' + o.slice(0, 40) + '…»)');
        if (room && room !== Game.roomId && !wayPath(Game, 'o:1,2', room)) bad.push(Object.keys(st)[0] + ': meta ' + room + ' irraggiungibile');
      }
      Game.state = 'title';
      return bad.length ? bad.slice(0, 6).join(' | ') : true;
    });
    check('Ogni pagina del diario ha al massimo 9 capitoli (oltre si sovrappongono)', () => {
      const lists = { CHAPTERS, CHAPTERS2: window.CHAPTERS2, CHAPTERS3: window.CHAPTERS3, CHAPTERS4: window.CHAPTERS4, CHAPTERS5: window.CHAPTERS5, CHAPTERS6: window.CHAPTERS6, CHAPTERS7: window.CHAPTERS7 };
      const bad = Object.entries(lists).filter(([k, l]) => !l || l.length > 9).map(([k, l]) => k + ' ' + (l ? l.length : 'mancante'));
      return bad.length ? bad.join(', ') : true;
    });
    check('La chiusura: dopo il ritorno il padre parla una volta della lanterna verso est; poi l\'avventura è compiuta', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, T42.STEPS.slice(0, -1).reduce((a, b) => Object.assign(a, b), {}));
      T.tp('o:1,2', 7, 6); Game.dialog = null;
      const o1 = currentObjective(Game), a = FATHER_NPC.talk(Game).filter(l => typeof l === 'string').join(' ');
      Game.say(FATHER_NPC.talk(Game)); T.skip(); const o2 = currentObjective(Game), b = FATHER_NPC.talk(Game).join(' ');
      return /padre/.test(o1) && /lanterna/.test(a) && Game.s.flags.lanternEast && /compiuta/.test(o2) && !/lanterna accesa sulla finestra/.test(b) && objectiveRoom(Game) === null ? true : [o1.slice(0, 30), a.slice(0, 30), o2.slice(0, 30), b.slice(0, 30)].join(' / ');
    });
    check('Il suolo di nuvola non somiglia più alla neve (tinta diversa, misurata sui pixel)', () => {
      const avg = ground => { const cv = tileCanvas('.', 1, 0, ground), d = cv.getContext('2d').getImageData(0, 0, 16, 16).data; let rr = 0, bb = 0; for (let i = 0; i < d.length; i += 4) { rr += d[i]; bb += d[i + 2]; } return [rr / 256, bb / 256]; };
      const [sr, sb] = avg('snow'), [cr, cb] = avg('cloud');
      return (cb - cr) - (sb - sr) > 8 || Math.abs(cr - sr) > 10 ? true : 'neve ' + [sr, sb].map(x => x.toFixed(0)) + ' nuvola ' + [cr, cb].map(x => x.toFixed(0));
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T42 = T42;
