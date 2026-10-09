'use strict';
/* =====================================================================
 *  CICLO 55 — rifinitura: i doni «pigri».   await T55.suite()  (con ?test)
 *  Il Ciclo 54 (Agente B) dà i doni ancora in coda quando si salva a metà dialogo: ma un dono scritto come
 *  «g => g.giveItem(...)» nasce solo quando il dialogo ci arriva, e il salvataggio non lo vede.
 * ===================================================================== */
const T55 = {
  /* fa avanzare il dialogo una battuta alla volta finché cond() non è vera */
  advanceUntil(cond, max) { for (let i = 0; i < (max || 200) && Game.dialog && !cond(); i++) { Input.pressed.add('action'); Game.update(); Input.endFrame(); for (let k = 0; k < 3; k++) Game.update(); } return cond(); },
  async suite() {
    const bak = localStorage.getItem(SAVE_KEY), md = Medals.data, res = [];
    const check = async (name, fn) => { try { const r = await fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    await check('Ortensio pianta il giardino (e salva): chi chiude il gioco subito dopo ha già la Spada dell\'Alba', () => {
      T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true });
      Object.assign(Game.s.flags, { intro: true, victory: true, boss: true, seedQuest: true }); for (const id of SEED_IDS) Game.s.flags['seed:' + id] = true;
      T.tp('o:1,0', 7, 7); T.skip(); Game.dialog = null; Game.say(GARDEN_TALK_OF(Game));
      if (!T55.advanceUntil(() => Game.s.flags.garden)) return 'il giardino non viene piantato';
      const sv = readSave();   // «chiudere il gioco»: si legge il salvataggio così com'è, senza salvare di nuovo
      T.skip(); Game.state = 'title';
      return sv && sv.flags.garden && sv.items.dawnsword ? true : 'salvataggio: giardino ' + (sv && sv.flags.garden) + ' spada ' + (sv && sv.items.dawnsword);
    });
    await check('Nessuno script ha più doni «pigri» (g => g.giveItem(...)) che il salvataggio non vede', async () => {
      const bad = [];
      for (const src of [...document.scripts].map(s => s.src).filter(s => /\/js\//.test(s) && !/resume\.js/.test(s))) {
        const t = await (await fetch(src)).text(); const m = t.match(/=>\s*\w+\.giveItem\(/g);
        if (m) bad.push(src.split('/').pop().split('?')[0] + ' ×' + m.length);
      }
      return bad.length ? bad.join(', ') : true;
    });
    await check('Il cuore di Pino per l\'amo d\'oro arriva una volta sola', () => {
      T.fresh({ sword: true, hookshot: true }); Object.assign(Game.s.flags, { intro: true }); Game.s.items.hook = true; Game.s.flags['chest:c_islet'] = true;
      T.tp('o:0,2', 11, 3); T.noEnemies(); const n = ROOMS['o:0,2'].npcs.find(x => x.id === 'pino'), hp0 = Game.s.maxHp;
      Game.say(n.talk(Game)); T.skip(); const hp1 = Game.s.maxHp;
      Game.say(n.talk(Game)); T.skip(); Game.state = 'title';
      return hp1 === hp0 + 2 && Game.s.maxHp === hp1 && Game.s.flags.hookReturned ? true : [hp0, hp1, Game.s.maxHp].join(' → ');
    });
    Medals.data = md;
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null;
    console.table(res);
    return res;
  },
};
/* il dialogo del giardiniere (o:1,0 o d:1,0) */
function GARDEN_TALK_OF(g) { for (const id of ['o:1,0', 'd:1,0']) { const n = (ROOMS[id].npcs || []).find(x => x.id === 'ortensio'); if (n) return n.talk(g); } return []; }
window.T55 = T55;
