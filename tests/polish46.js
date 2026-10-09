'use strict';
/* =====================================================================
 *  TEST DEL CICLO 46 (Agente B) — RIFINITURA: le voci delle regioni (CHATTER2).
 *  T46.suite()  (con ?test)
 * ===================================================================== */
const T46 = {
  npcs() { const out = []; for (const [rid, def] of Object.entries(ROOMS)) for (const n of def.npcs || []) if (CHATTER2[n.id]) out.push([rid, n]); return out; },
  /* stato della saga fino alla tappa indicata (compresa) */
  upTo(stage) {
    T.fresh({ sword: true, bombs: true, hookshot: true, bigkey: true, lantern: true });
    for (const st of T42.STEPS) { Object.assign(Game.s.flags, st); if (st[stage]) break; }
  },
  text(lines) { return lines.map(l => typeof l === 'string' ? l : l && l.text ? l.text : '').join(' | '); },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Ogni personaggio delle mie regioni dice ogni sua novità, una volta sola', () => {
      const bad = []; let n = 0;
      for (const [rid, npc] of T46.npcs()) for (const [stage, line] of Object.entries(CHATTER2[npc.id])) {
        T46.upTo(stage); n++;
        if (chatStage(Game) !== stage) { bad.push(npc.id + '@' + stage + ' (tappa ' + chatStage(Game) + ')'); continue; }
        const a = npc.talk(Game); a.forEach(l => typeof l === 'function' && l(Game));
        const b = npc.talk(Game);
        if (!a.includes(line)) bad.push(npc.id + '@' + stage + ': non detta');
        else if (b.includes(line)) bad.push(npc.id + '@' + stage + ': ripetuta');
      }
      Game.state = 'title';
      return bad.length ? bad.slice(0, 5).join(' | ') + ' (su ' + n + ')' : (n >= 30 ? true : 'solo ' + n + ' novità');
    });
    check('Menu e servizi restano: il riposo di Nadira, la zuppa di Rufo, dopo la novità', () => {
      const bad = [];
      for (const [id, stage, label] of [['nadira', 'ch7Done', 'Al tramonto'], ['rufo', 'ch7Done', 'Zuppa']]) {
        T46.upTo(stage); const npc = T46.npcs().find(([r, n]) => n.id === id)[1];
        const a = npc.talk(Game), menu = a.find(l => l && l.choices);
        if (!menu || !menu.choices.some(c => c.label.startsWith(label))) bad.push(id + ': menu perso');
      }
      Game.state = 'title';
      return bad.length ? bad.join(' | ') : true;
    });
    check('Nessuna battuta «una volta sola» va persa: se le battute di sempre cambiano qualcosa, si dicono anche loro', () => {
      const bad = [];
      for (const [rid, npc] of T46.npcs()) for (const stage of Object.keys(CHATTER2[npc.id])) {
        T46.upTo(stage); const before = JSON.stringify(Game.s.flags); const out = npc.talk(Game);
        const b = JSON.parse(before), a = Game.s.flags, diff = Object.keys(a).filter(k => a[k] !== b[k]);
        const kept = out.filter(l => typeof l === 'string').length >= 2;   // la novità + almeno una battuta di sempre
        if (diff.length && !kept) bad.push(npc.id + '@' + stage + ': ' + diff.join(',') + ' scattato ma la battuta è stata sostituita');
      }
      Game.state = 'title';
      return bad.length ? bad.slice(0, 5).join(' | ') : true;
    });
    check('Ogni novità sta in una pagina di dialogo (4 righe)', () => {
      const bad = [];
      for (const [id, lines] of Object.entries(CHATTER2)) for (const [stage, line] of Object.entries(lines)) {
        const m = /^([A-ZÀ-Ý?][^:]{0,18}):\s(.*)$/s.exec(line), body = m ? m[2] : line;
        const n = wrap(body, 226, 11).length; if (n > 4) bad.push(id + '@' + stage + ' ' + n + ' righe');
      }
      return bad.length ? bad.join(' | ') : true;
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T46 = T46;
