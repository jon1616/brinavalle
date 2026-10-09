'use strict';
/* =====================================================================
 *  CICLO 45 — rifinitura: le voci della valle (js/chatter.js).   T45.suite()  (con ?test)
 * ===================================================================== */
const T45 = {
  /* il testo che un personaggio dice adesso (senza eseguire i doni: solo le frasi) */
  says(id) {
    for (const [rid, def] of Object.entries(ROOMS)) {
      const n = (def.npcs || []).find(x => x.id === id); if (!n) continue;
      const out = n.talk(Game) || [];
      return out.map(x => typeof x === 'string' ? x : x && x.text ? x.text : typeof x === 'function' ? '#fn' : '#obj');
    }
    return null;
  },
  /* esegue le funzioni del dialogo (come farebbe il gioco), così i flag «già sentito» si impostano */
  talk(id) { const lines = []; for (const def of Object.values(ROOMS)) { const n = (def.npcs || []).find(x => x.id === id); if (!n) continue; for (const x of n.talk(Game) || []) { if (typeof x === 'function') { try { x(Game); } catch (e) {} } else if (typeof x === 'string') lines.push(x); } return lines; } return null; },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Lungo tutta la saga ogni personaggio della valle racconta la novità della tappa una volta sola, poi torna alle battute di sempre', () => {
      T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true }); const bad = []; let heard = 0;
      for (const st of T42.STEPS) {
        Object.assign(Game.s.flags, st); const stage = chatStage(Game);
        for (const [id, lines] of Object.entries(CHATTER)) {
          const want = stage && lines[stage]; if (!want || Game.s.flags['chat:' + id + ':' + stage]) continue;
          const first = T45.talk(id); if (!first) { bad.push(id + ' non trovato'); continue; }
          if (!first.includes(want)) bad.push(id + '@' + stage + ': novità non detta');
          const second = T45.talk(id); if (second.includes(want)) bad.push(id + '@' + stage + ': ripetuta');
          heard++;
        }
      }
      Game.state = 'title';
      return bad.length ? bad.slice(0, 6).join(' | ') : heard === Object.values(CHATTER).reduce((a, l) => a + Object.keys(l).length, 0) ? true : 'novità sentite ' + heard;   // tutte, nessuna irraggiungibile
    });
    check('Dopo il Capitolo VII nessuno dice più le battute del primo atto insieme alla novità', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, T42.STEPS.reduce((a, b) => Object.assign(a, b), {}));
      const nina = T45.says('nina').join(' '), marta = T45.says('marta').join(' ');
      return !/Prima arancione/.test(nina) && /occhiolino/.test(nina) && /tua madre/.test(marta) ? true : nina.slice(0, 60) + ' / ' + marta.slice(0, 60);
    });
    check('Il negozio di Bortolo e la pesca di Pino restano dopo la novità', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, T42.STEPS.reduce((a, b) => Object.assign(a, b), {}));
      Game.s.flags.hookReturned = true;   // la canna di Pino (Ciclo 6)
      const b = T45.says('bortolo'), p = T45.says('pino');
      return b.length > 1 && b.some(x => /Benvenuto/.test(x)) && p.some(x => /la mia canna/.test(x)) ? true : JSON.stringify([b, p]).slice(0, 160);
    });
    check('Le novità si dicono anche col dialogo vero, e stanno nelle pagine', () => {
      T.fresh({ sword: true }); Object.assign(Game.s.flags, { victory: true, partyDone: true, northCall: true, ch2Done: true });
      T.tp('o:1,2', 9, 8); const n = ROOMS['o:1,2'].npcs.find(x => x.id === 'nina'); Game.say(n.talk(Game));
      const d = Game.dialog, ok = d && /campane/.test(d.entry.text) && d.pages.every(pg => pg.length <= 4);
      T.skip(); const again = n.talk(Game).join(' ');
      return ok && Game.s.flags['chat:nina:ch2Done'] && !/campane/.test(again) ? true : [!!d, d && d.entry.text, again.slice(0, 40)].join(' / ');
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null;
    console.table(res);
    return res;
  },
};
window.T45 = T45;
