'use strict';
/* =====================================================================
 *  CICLO 57 — rifinitura: il Diario e il Bestiario dopo sette capitoli.   T57.suite()  (con ?test)
 * ===================================================================== */
const T57 = {
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Diario: con tutte le missioni scoperte la lista scorre e resta nel suo riquadro; la missione scelta è sempre visibile', () => {
      const keep = SIDE_QUESTS.map(q => q.seen);
      try {
        T.fresh({ sword: true }); SIDE_QUESTS.forEach(q => { q.seen = () => true; }); T.tp('o:1,2', 7, 7); T.skip();
        Game.state = 'pause'; Game.pausePage = 1; const n = Game.knownQuests().length, bad = [];
        for (let i = 0; i < n; i++) {
          Game.questIdx = i; const calls = [], f = window.txt;
          window.txt = function (s, x, y) { calls.push([s, x, y]); return f.apply(this, arguments); };
          try { Game.render(); } finally { window.txt = f; }
          const rows = calls.filter(([s, x]) => x === 124 && /^(✓|·) /.test(s));
          if (rows.some(([, , y]) => y > 129)) bad.push(i + ': riga fuori dal riquadro');
          if (!rows.some(([s]) => s.includes(Game.knownQuests()[i].name))) bad.push(i + ': scelta non visibile');
        }
        return n > 9 && !bad.length ? true : 'missioni ' + n + ' · ' + bad.slice(0, 4).join(' | ');
      } finally { SIDE_QUESTS.forEach((q, i) => { q.seen = keep[i]; }); Game.state = 'title'; }
    });
    check('Bestiario: ogni descrizione sta nelle sue 4 righe e ogni punto debole nelle sue 3 (prima 16 voci erano tagliate a metà frase)', () => {
      const bad = [];
      for (const B of BESTIARY) {
        if (wrap(B.lore || '', 124, 10).length > 4) bad.push(B.k + ' descrizione');
        if (wrap(B.weak || '', 124, 10).length > 3) bad.push(B.k + ' punto debole');
      }
      return bad.length ? bad.join(', ') : true;
    });
    check('Diario: i suggerimenti delle missioni (anche «Completata!») stanno nelle loro 3 righe', () => {
      T.fresh({ sword: true }); const bad = [];
      for (const q of SIDE_QUESTS) for (const pre of ['', 'Completata! ']) { const h = pre + (typeof q.hint === 'function' ? q.hint(Game) : q.hint); if (wrap(h, 232, 10).length > 3) bad.push(q.name + (pre ? ' (completata)' : '')); }
      Game.state = 'title';
      return bad.length ? bad.join(', ') : true;
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.pausePage = 0; Game.questIdx = 0;
    console.table(res);
    return res;
  },
};
window.T57 = T57;
