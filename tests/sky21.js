'use strict';
/* =====================================================================
 *  CICLO 21 — test del cielo (pioggia, temporale, giorno e notte).   T21.suite()  (con ?test)
 * ===================================================================== */
const T21 = {
  frames(n) { for (let i = 0; i < n; i++) { Game.update(); Input.endFrame(); } },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), fx = FEEL.on, res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Nei primi 3 minuti non piove mai', () => {
      T.fresh({ sword: true }); Sky.reset(); T.tp('o:1,2', 7, 6); Game.s.time = 0;
      for (let k = 0; k < 40; k++) { Sky.next = 1; T21.frames(1); if (Sky.target > 0) return 'pioggia a ' + Game.s.time.toFixed(1) + 's'; }
      return true;
    });
    check('Dopo 3 minuti la pioggia arriva, cresce piano e poi smette', () => {
      T.fresh({ sword: true }); Sky.reset(); T.tp('o:1,2', 7, 6); Game.s.time = 300;
      let tries = 0; while (Sky.target === 0 && tries++ < 200) { Sky.next = 1; T21.frames(1); }
      if (Sky.target === 0) return 'mai pioggia in 200 estrazioni';
      if (Sky.rain > 0.01) return 'la pioggia non è graduale';
      T21.frames(400); if (Sky.rain < 0.4) return 'intensità ' + Sky.rain.toFixed(2);
      Sky.next = 1; T21.frames(1); if (Sky.target !== 0) return 'non smette';
      T21.frames(400); return Sky.rain === 0 ? true : 'resta ' + Sky.rain.toFixed(2);
    });
    check('La pioggia si disegna solo all\'aperto e con gli effetti attivi', () => {
      T.fresh({ sword: true }); Sky.reset(); Sky.rain = 1; Sky.target = 1; T.tp('o:1,2', 7, 6); FEEL.on = true;
      const px = () => { Game.render(); const d = bctx.getImageData(0, HUD_H, PLAY_W, PLAY_H).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s; };
      const wet = px(); Sky.rain = 0; const dry = px();
      if (Math.abs(wet - dry) < 1000) return 'la pioggia non cambia la scena';
      Sky.rain = 1; FEEL.on = false; const off = px(); FEEL.on = true;
      if (off !== dry) return 'con gli effetti spenti la pioggia si vede ancora';
      T.tp('i:elder', 7, 7); const inA = px(); Sky.rain = 0; const inB = px();
      return inA === inB ? true : 'piove dentro casa';
    });
    check('Temporale: lampo e poi il tuono, con un attimo di ritardo', () => {
      T.fresh({ sword: true }); Sky.reset(); T.tp('o:1,2', 7, 6);
      Sky.rain = 1; Sky.target = 1; Sky.storm = true; Sky.next = 99999;
      const r = Math.random; Math.random = () => 0.001; T21.frames(1); Math.random = r;
      if (Sky.flash <= 0 || Sky.thunderIn <= 0) return 'nessun lampo';
      const wait = Sky.thunderIn; T21.frames(wait - 1); if (Game.shake > 0) return 'tuono troppo presto';
      T21.frames(1); return Game.shake > 0 && Sky.thunderIn === 0 ? true : 'tuono mancato';
    });
    check('Prima della vittoria: crepuscolo eterno, niente giorno e notte', () => {
      T.fresh({ sword: true }); Game.s.time = 250; return Sky.phase(Game) === -1 && Sky.night(Sky.phase(Game)) === 0 ? true : 'fase ' + Sky.phase(Game);
    });
    check('Dopo la vittoria il giorno parte dal mattino e attraversa tramonto, notte, alba', () => {
      T.fresh({ sword: true }); Game.s.flags.victory = true; Game.s.time = 1000; T.tp('o:1,2', 7, 6); T21.frames(1);
      if (Game.s.dayStart == null) return 'dayStart non fissato';
      const at = sec => { Game.s.time = Game.s.dayStart + sec; return Sky.phase(Game); };
      if (Sky.night(at(10)) !== 0 || Sky.dusk(at(10)) !== 0) return 'il primo istante non è giorno pieno';
      if (Sky.dusk(at(DAY_LEN * 0.53)) < 0.9) return 'niente tramonto';
      if (Sky.night(at(DAY_LEN * 0.75)) !== 1) return 'niente notte';
      if (Sky.dusk(at(DAY_LEN * 0.965)) < 0.9) return 'niente alba';
      return Sky.night(at(DAY_LEN + 10)) === 0 ? true : 'il giorno non ricomincia';
    });
    check('Di notte la scena è più buia, ma intorno a Lio resta luce', () => {
      T.fresh({ sword: true }); Game.s.flags.victory = true; T.tp('o:1,2', 7, 6); T21.frames(1);
      const lum = (x0, y0) => { const d = bctx.getImageData(x0, y0 + HUD_H, 8, 8).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s; };
      const p = Game.player, cx = Math.round(p.cx()) - 4, cy = Math.round(p.cy()) - 8, fx0 = cx > 128 ? 8 : PLAY_W - 16;
      Game.s.time = Game.s.dayStart + 10; Game.render(); const dayFar = lum(fx0, 8), dayNear = lum(cx, cy);
      Game.s.time = Game.s.dayStart + DAY_LEN * 0.75; Game.render(); const nightFar = lum(fx0, 8), nightNear = lum(cx, cy);
      if (nightFar > dayFar * 0.6) return 'notte poco buia: ' + (nightFar / dayFar).toFixed(2);
      return nightNear / dayNear > nightFar / dayFar + 0.15 ? true : 'nessuna luce intorno a Lio';
    });
    check('Notte nel villaggio: alcune finestre sono accese (sempre le stesse)', () => {
      T.fresh({ sword: true }); Game.s.flags.victory = true; T.tp('o:1,2', 7, 6); T21.frames(1);
      let houses = 0; for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (Game.tiles[y][x] === 'H') houses++;
      if (!houses) return 'nessuna casa nella stanza di partenza';
      Game.s.time = Game.s.dayStart + DAY_LEN * 0.75; Game.render();
      const wins = Sky.windowsOf(Game), all = [];
      for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (Game.tiles[y][x] === 'H' && Game.bg.getContext('2d').getImageData(x * TS + 6, y * TS + 8, 1, 1).data[2] === 0x50) all.push(x + ',' + y);
      if (!wins.length || wins.length >= all.length) return 'accese ' + wins.length + ' su ' + all.length + ' (ne servono alcune, non tutte)';
      for (const [x, y] of wins) {
        const d = bctx.getImageData(x * TS + 6, y * TS + 8 + HUD_H, 1, 1).data, far = bctx.getImageData(x * TS + 1, y * TS + 1 + HUD_H, 1, 1).data;
        if (!(d[0] > 200 && d[0] > d[2] + 80)) return 'vetro non acceso in ' + x + ',' + y + ': ' + [...d].slice(0, 3);
      }
      return true;
    });
    check('Tutte le stanze esterne si disegnano con pioggia, temporale e notte, senza errori', () => {
      T.fresh({ sword: true }); Game.s.flags.victory = true; T21.frames(1);
      Sky.rain = 1; Sky.storm = true; Sky.flash = 5;
      for (const id of Object.keys(ROOMS).filter(k => k.startsWith('o:'))) for (const f of [0.3, 0.53, 0.75, 0.965]) {
        T.tp(id, 7, 6); Game.s.time = Game.s.dayStart + DAY_LEN * f; Game.render();
      }
      return true;
    });
    check('Costo: 600 frame di pioggia forte e notte restano sotto 4 ms per frame', () => {
      T.fresh({ sword: true }); Game.s.flags.victory = true; T.tp('o:1,2', 7, 6); T21.frames(1);
      Sky.rain = 1; Sky.target = 1; Sky.next = 99999; Game.s.dayStart = Game.s.time - DAY_LEN * 0.75;
      const t0 = performance.now(); for (let i = 0; i < 600; i++) { Game.update(); Game.render(); Input.endFrame(); }
      const ms = (performance.now() - t0) / 600;
      return ms < 4 ? true : ms.toFixed(2) + ' ms';
    });
    FEEL.on = fx; Sky.reset();
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T21 = T21;
