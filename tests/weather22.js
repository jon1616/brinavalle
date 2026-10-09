'use strict';
/* =====================================================================
 *  TEST DEL CICLO 22 (Agente B) — il meteo cambia la pesca; i fuochi fatui.
 *  Si carica con index.html?test. Da console:  T22.suite()
 * ===================================================================== */
const T22 = {
  night(g) { g.s.flags.victory = true; g.s.dayStart = (g.s.time || 0) - DAY_LEN * 0.75; },
  day(g) { g.s.flags.victory = true; g.s.dayStart = (g.s.time || 0) - DAY_LEN * 0.2; },
  share(zone, id, n) { let k = 0; for (let i = 0; i < n; i++) if (Game.pickSpecies(zone).id === id) k++; return k / n; },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), fx = FEEL.on, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Tempo sereno: le probabilità di pesca restano quelle di sempre', () => {
      T.fresh({}); Sky.reset();
      const bad = [];
      for (const z of [0, 1, 2]) for (const sp of FISH) if (fishW(Game, sp, z) !== sp.w[z]) bad.push(sp.id + '@' + z);
      return bad.length ? bad.join(',') : true;
    });
    check('Di notte il Luccio Lunare abbocca circa 4 volte più spesso al largo, mai a riva', () => {
      T.fresh({}); Sky.reset(); T22.day(Game); const d = T22.share(2, 'luccio', 6000);
      T22.night(Game); const n = T22.share(2, 'luccio', 6000), near = T22.share(0, 'luccio', 2000);
      return n > d * 2.5 && near === 0 ? true : 'giorno ' + d.toFixed(3) + ' notte ' + n.toFixed(3) + ' riva ' + near;
    });
    check('Con la pioggia trote e carpe si prendono anche coi lanci corti', () => {
      T.fresh({}); Sky.reset(); const dry = T22.share(0, 'trota', 4000) + T22.share(0, 'carpa', 4000);
      Sky.rain = 1; Sky.target = 1; const wet = T22.share(0, 'trota', 4000) + T22.share(0, 'carpa', 4000);
      Sky.reset(); return wet > dry * 3 && wet > 0.15 ? true : 'asciutto ' + dry.toFixed(3) + ' pioggia ' + wet.toFixed(3);
    });
    check('Prima della vittoria la notte non esiste: niente Luccio extra', () => {
      T.fresh({}); Sky.reset(); Game.s.dayStart = -DAY_LEN * 0.75;
      return fishW(Game, FISH.find(s => s.id === 'luccio'), 2) === 0.32 ? true : 'peso alterato';
    });
    check('All\'inizio della pesca un avviso dice cosa morde (solo se il tempo non è normale)', () => {
      T.fresh({}); Sky.reset(); Game.startFishing(); const a = Game.fsh.msg; Game.endFishing(); Game.dialog = null;
      Sky.rain = 1; Game.startFishing(); const b = Game.fsh.msg; Game.endFishing(); Game.dialog = null; Sky.reset();
      return !a && b && /Piove/.test(b.text) ? true : JSON.stringify([a, b]);
    });
    check('Scena di pesca disegnata di notte, con pioggia e temporale, senza errori e diversa dal sereno', () => {
      T.fresh({}); FEEL.on = true; Sky.reset(); Game.startFishing();
      const px = () => { Game.render(); const d = bctx.getImageData(0, 0, GW, GH).data; let s = 0; for (let i = 0; i < d.length; i += 16) s += d[i] + d[i + 2]; return s; };
      const clear = px(); T22.night(Game); Sky.rain = 1; Sky.storm = true; const dark = px();
      Game.endFishing(); Game.dialog = null; Sky.reset();
      return dark < clear ? true : 'sereno ' + clear + ' notte ' + dark;
    });
    check('Di giorno nella Foresta Antica non ci sono fuochi fatui; di notte sì', () => {
      T.fresh({ sword: true }); T22.day(Game); T.tp('o:0,0', 1, 9); T.noEnemies(); T.run([], 5);
      const day = Wisps.on; T22.night(Game); T.run([], 5);
      return !day && Wisps.on && Wisps.list.length === 3 ? true : 'giorno ' + day + ' notte ' + Wisps.on;
    });
    check('Seguendo le lucine si arriva al bivacco: taccuino, 50 gemme, una volta sola', () => {
      T.fresh({ sword: true }); T22.night(Game); T.tp('o:0,0', 14, 9); T.noEnemies(); T.run([], 3);
      const g0 = Game.s.gems; let steps = 0;
      // si cammina lungo il percorso delle lucine, tappa dopo tappa
      for (let guard = 0; guard < 60 && !Game.s.flags.bivouac; guard++) {
        const w = Wisps.list[0]; if (!w) break;
        Game.player.x = Math.round(w.x) - 8; Game.player.y = Math.round(w.y) - 12; T.run([], 40); steps++;
      }
      if (!Game.s.flags.bivouac) return 'bivacco non trovato (tappe ' + steps + ')';
      T.skip(); const got = Game.s.gems - g0;
      T.run([], 5); return got === 50 && !Wisps.on && steps > 2 ? true : 'gemme ' + got + ' lucine ' + Wisps.on + ' tappe ' + steps;
    });
    check('Il percorso delle lucine è fatto di tessere libere e collegate', () => {
      T.fresh({}); T.tp('o:0,0', 14, 9);
      const p = wispPath(Game, 14, 9), last = p[p.length - 1];
      for (let i = 1; i < p.length; i++) if (Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]) !== 1 || Game.tiles[p[i][1]][p[i][0]] !== '.') return 'salto a ' + p[i];
      return last[0] === BIVOUAC.x && last[1] === BIVOUAC.y && p.length > 10 ? true : 'arrivo ' + last + ' lunghezza ' + p.length;
    });
    check('Teodoro riconosce il taccuino (una volta) e la missione si completa', () => {
      T.fresh({}); Object.assign(Game.s.flags, { victory: true, bivouac: true }); Game.visited.add('o:0,0');
      const t = ROOMS['i:elder'].npcs.find(n => n.id === 'teodoro');
      const a = t.talk(Game); a.forEach(l => typeof l === 'function' && l(Game));
      const b = t.talk(Game), q = SIDE_QUESTS.find(x => x.name === 'I fuochi fatui');
      return /taccuino/.test(a[0]) && !/taccuino/.test(String(b[0])) && q.done(Game) ? true : String(b[0]);
    });
    check('La bussola sente il bivacco solo di notte', () => {
      T.fresh({}); T22.day(Game); const d = compassHas(Game, 'o:0,0'); T22.night(Game); const n = compassHas(Game, 'o:0,0');
      Game.s.flags['chest:c_hook'] = true; Game.s.flags['seed:foresta'] = true; const d2 = (T22.day(Game), compassHas(Game, 'o:0,0'));
      return n && !d2 ? true : 'giorno ' + d + '/' + d2 + ' notte ' + n;
    });
    check('Pino dà il consiglio sul tempo nel diario di pesca, una volta', () => {
      T.fresh({}); const a = fishLogLines(Game).join(' '), b = fishLogLines(Game).join(' ');
      return /cielo/.test(a) && !/cielo/.test(b) ? true : a;
    });
    FEEL.on = fx; Sky.reset();
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.pausePage = 0;
    console.table(res);
    return res;
  },
};
window.T22 = T22;
