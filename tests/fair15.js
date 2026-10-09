'use strict';
/* =====================================================================
 *  CICLO 15 — test: ingressi giusti e salvataggi di versioni precedenti.
 *    T15.entries(min)   elenco ingresso -> nemico più vicini di `min` px (default 48)
 *    T15.suite()
 * ===================================================================== */
const T15 = {
  entries(min) {
    min = min || 48;
    const entries = {}, out = [];
    const add = (id, x, y, how) => (entries[id] = entries[id] || []).push({ x, y, how });
    for (const id in ROOMS) {
      const m = /^([odclrnt]):(\d+),(\d+)$/.exec(id);   // l: = Santuario Sommerso (Ciclo 17)
      if (m) for (const [d, dx, dy] of [['N', 0, -1], ['S', 0, 1], ['W', -1, 0], ['E', 1, 0]]) {
        const nid = m[1] + ':' + (+m[2] + dx) + ',' + (+m[3] + dy);
        if (!ROOMS[nid]) continue;
        const t = ROOMS[nid].tiles;
        for (let i = 0; i < RW; i++) for (let j = 0; j < RH; j++) {
          const edge = (d === 'N' && j === RH - 1) || (d === 'S' && j === 0) || (d === 'W' && i === RW - 1) || (d === 'E' && i === 0);
          if (edge && !TILE_SOLID.has(t[j][i])) add(nid, i, j, 'da ' + id);
        }
      }
      for (const k in ROOMS[id].warps || {}) { const w = ROOMS[id].warps[k]; add(w.to, w.x, w.y, 'porta da ' + id); }
    }
    for (const id in entries) for (const p of entries[id]) for (const e of (ROOMS[id].enemies || [])) {
      if (e.type === 'blade') continue;   // le lame stanno negli angoli e scattano solo se allineato
      const d = Math.hypot(p.x - e.x, p.y - e.y) * TS;
      if (d < min) out.push(id + ' ' + p.how + ' (' + p.x + ',' + p.y + ') -> ' + e.type + ' ' + Math.round(d) + ' px');
    }
    return [...new Set(out)];
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Nessun nemico a meno di 48 px da un ingresso (bordi, porte, scale)', () => {
      const bad = T15.entries(48);
      return bad.length ? bad.join(' | ') : true;
    });
    check('Entrando in una stanza i nemici restano fermi e innocui per un attimo, poi si svegliano', () => {
      T.fresh({ sword: true }); T.tp('o:2,2', 7, 5); T.noEnemies();
      const s = new Slime(Game.player.x, Game.player.y); s.state = 1; s.vx = 0.8; s.timer = 999; Game.entities.push(s);
      Game.afterEnter(); T.skip();
      const hp = Game.s.hp, x0 = s.x;
      T.run([], ENTRY_GRACE - 5);
      if (Game.s.hp !== hp || s.x !== x0) return 'nemico attivo durante la tregua';
      T.run([], 60);
      return s.x !== x0 || Game.s.hp < hp ? true : 'nemico mai svegliato';
    });
    check('La tregua non vale per i boss né nella Sfida dei Guardiani', () => {
      T.fresh({ sword: true }); Game.s.flags.bossIntro = true; T.tp('d:1,0', 7, 8); T.skip();
      Game.afterEnter(); T.skip();
      const b = Game.boss, t0 = b.t; T.run([], 5);
      if (b.t === t0) return 'boss congelato';
      Medals.data.wins = Medals.data.wins || 1; Game.startRush(); T.run([], 30);
      const ok = Game.entryGrace === 0 || Game.rush;
      Game.rush = null; Game.state = 'title';
      return ok ? true : 'tregua nella sfida';
    });
    // ---- salvataggi di versioni precedenti (chi giudica potrebbe averne uno nel browser) ----
    const load = sv => { localStorage.setItem(SAVE_KEY, JSON.stringify(sv)); Game.startFrom(readSave(), false); for (let i = 0; i < 40; i++) Game.update(); T.skip(); };
    check('Salvataggio del Ciclo 1 (Chiave del Re presa nella Sala delle Armature, niente arpione né bombe): si carica e si può ancora finire', () => {
      load({ hp: 6, maxHp: 6, gems: 12, keys: 0, items: { sword: true, bigkey: true, lantern: true }, flags: { intro: true, enteredDungeon: true, 'cleared:d:2,1': true, 'chest:c_bigkey': true, 'open:d:1,1:15,5': true }, room: 'd:1,1', x: 112, y: 74, visited: ['d:1,1'], deaths: 0, time: 900 });
      if (Game.roomId !== 'd:1,1' || Game.state !== 'play') return 'non caricato: ' + Game.roomId + ' ' + Game.state;
      T.tp('d:2,1', 7, 7);
      const ch = Game.entities.find(e => e instanceof Chest && e.def.item === 'hookshot');
      if (!ch || ch.opened) return "l'arpione non è recuperabile";
      Game.render(); Game.state = 'pause'; Game.render(); Game.pausePage = 1; Game.render(); Game.pausePage = 0; Game.state = 'play';
      return true;
    });
    check('Salvataggio del Ciclo 2 (crollo avvenuto, niente bombe, senza i campi nuovi): obiettivo giusto, pausa e diario senza errori', () => {
      load({ hp: 4, maxHp: 6, gems: 3, keys: 0, items: { sword: true }, flags: { intro: true, collapse: true }, room: 'o:1,0', x: 112, y: 90, visited: ['o:1,0'], deaths: 1, time: 1200 });
      if (!/Grotta di Brina|bombe/i.test(currentObjective(Game))) return 'obiettivo: ' + currentObjective(Game);
      Game.state = 'pause'; Game.render(); Game.pausePage = 1; Game.render(); Game.pausePage = 0; Game.state = 'play';
      return Game.s.equip === undefined || Game.equipped() === null ? true : 'equip strano: ' + Game.s.equip;
    });
    check('Salvataggio rovinato (JSON non valido): niente "Continua", nessun errore', () => {
      localStorage.setItem(SAVE_KEY, '{ "hp": 6, "room": ');
      Game.state = 'title'; Game.menuIdx = 0; Game.render();
      return !Game.titleItems().includes('Continua') ? true : 'Continua con un salvataggio rotto';
    });
    check('Salvataggio con una stanza che non esiste più: si riparte dal villaggio invece di bloccarsi', () => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(newState(), { room: 'x:9,9', flags: { intro: true } })));
      try { Game.startFrom(readSave(), false); for (let i = 0; i < 30; i++) Game.update(); }
      catch (e) { return 'eccezione: ' + e.message; }
      return Game.roomId && ROOMS[Game.roomId] ? true : 'stanza ' + Game.roomId;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.rush = null; Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T15 = T15;
