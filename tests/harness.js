'use strict';
/* =====================================================================
 *  HARNESS DI TEST (Ciclo 3) — si carica solo aprendo  index.html?test
 *  Input simulato frame per frame, deterministico, senza requestAnimationFrame.
 *  Da console:
 *    T.tp('d:2,0', 7, 8)       teletrasporto (tile)       T.run(['up'], 30)  tieni tasti N frame
 *    T.press('item', 40)       premi un tasto e avanza     T.skip()           chiudi i dialoghi
 *    T.go('x', 120)            cammina fino a quella coordinata (centro dei piedi, pixel)
 *    T.suite()                 esegue tutti i test del Ciclo 3 e stampa una tabella
 *  ATTENZIONE: i test modificano/azzerano il salvataggio; T.suite() lo ripristina alla fine.
 * ===================================================================== */
const T = {
  tp(id, x, y) {
    Game.dialog = null; Game.itemGet = null; Game.state = 'play'; Game.fade = null; Game.lastName = '';
    Game.loadRoom(id); Game.player.x = x * TS; Game.player.y = y * TS - 6; Game.banner = null;
    Game.player.hook = null; Game.player.fallT = 0;
    Game.entry = { x: Game.player.x, y: Game.player.y };
    return id;
  },
  run(keys, frames) {
    for (let i = 0; i < frames; i++) { Input.down.clear(); keys.forEach(k => Input.down.add(k)); Game.update(); Input.endFrame(); }
    Input.down.clear();
    return T.where();
  },
  press(k, after) { Input.pressed.add(k); return T.run([], after || 1); },
  skip() { let n = 0; while (Game.dialog && n < 300) { Input.pressed.add('action'); Game.update(); Input.endFrame(); for (let i = 0; i < 3; i++) Game.update(); n++; } return n; },
  go(axis, target, max) {
    const start = Game.roomId;
    for (let i = 0; i < (max || 500); i++) {
      const p = Game.player, c = axis === 'x' ? p.cx() : p.cy();
      if (Math.abs(c - target) < 1.2 || Game.roomId !== start || Game.dialog || p.fallT) break;
      Input.down.clear(); Input.down.add(axis === 'x' ? (c < target ? 'right' : 'left') : (c < target ? 'down' : 'up'));
      Game.update(); Input.endFrame();
    }
    Input.down.clear();
    for (let i = 0; i < 80 && Game.state !== 'play'; i++) Game.update();
    return T.where();
  },
  tile() { const p = Game.player; return tileAt(Math.floor(p.cx() / TS), Math.floor(p.cy() / TS)); },
  where() { const p = Game.player; return Game.roomId + ' (' + Math.round(p.cx()) + ',' + Math.round(p.cy()) + ') hp=' + Game.s.hp + (Game.dialog ? ' [dialogo]' : '') + (p.fallT ? ' [cade]' : ''); },
  noEnemies() { Game.entities = Game.entities.filter(e => !e.enemy); },
  fresh(items) {
    Game.newGame(); T.run([], 30); T.skip();
    Game.s.flags.intro = true;
    Object.assign(Game.s.items, items || {});
    Game.s.hp = Game.s.maxHp = 12;
  },

  suite() {
    const bak = localStorage.getItem(SAVE_KEY);
    const res = [];
    const check = (name, fn) => {
      try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); }
      catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); }
    };
    check('Abisso: riva sud -> isolotto -> sponda ovest -> forziere -> ritorno', () => {
      T.fresh({ sword: true, hookshot: true }); Game.s.flags.abyssHint = true;
      T.tp('d:2,0', 7, 8); T.noEnemies(); Game.player.x = 7 * TS;
      T.run(['up'], 1); T.press('item', 35);
      if (T.tile() !== 'P' || Math.floor(Game.player.cy() / TS) !== 5) return 'isolotto non raggiunto: ' + T.where();
      T.go('x', 6 * TS + 8); Game.player.dir = 2; T.press('item', 45);
      if (Math.floor(Game.player.cx() / TS) !== 2) return 'sponda ovest non raggiunta: ' + T.where();
      T.go('y', 2 * TS + 8); T.go('x', 8 * TS + 8); Game.player.dir = 1; T.press('action', 5); T.skip();
      if (!Game.s.items.bigkey) return 'chiave non presa';
      T.go('x', 13 * TS + 8); Game.player.dir = 0; T.press('item', 50);
      return Math.floor(Game.player.cy() / TS) === 8 && T.tile() === 'P' ? true : 'ritorno fallito: ' + T.where();
    });
    check('Caduta nell\'abisso: -mezzo cuore e ritorno al punto di ingresso', () => {
      T.fresh({ sword: true }); T.tp('d:2,0', 4, 8); T.noEnemies();
      const hp = Game.s.hp; T.run(['up'], 30); T.run([], 50);
      return Game.s.hp === hp - 1 && Math.round(Game.player.y) === 8 * TS - 6 ? true : T.where();
    });
    check('I nemici di terra non entrano nell\'abisso', () => {
      T.fresh({ sword: true }); T.tp('d:2,0', 7, 8);
      const sk = Game.entities.find(e => e instanceof Skeleton);
      for (let i = 0; i < 1500; i++) { Game.player.hurtT = 5; Game.s.hp = 12; T.run([], 1); if (tileAt(Math.floor(sk.cx() / TS), Math.floor(sk.cy() / TS)) === '_') return 'scheletro sopra l\'abisso'; }
      return true;
    });
    check('Lago: isolotto segreto (arpione) e Cuore di Cristallo', () => {
      T.fresh({ sword: true, hookshot: true }); T.tp('o:0,2', 5, 5); T.noEnemies(); Game.player.x = 5 * TS; Game.player.dir = 1;
      T.press('item', 40);
      if (Math.floor(Game.player.cy() / TS) !== 2) return 'isolotto non raggiunto ' + T.where();
      const mx = Game.s.maxHp; Game.player.dir = 2; T.press('action', 5); T.skip();
      if (Game.s.maxHp !== mx + 2) return 'cuore non ottenuto';
      Game.player.dir = 0; T.press('item', 45);
      return Math.floor(Game.player.cy() / TS) === 5 ? true : 'ritorno fallito ' + T.where();
    });
    check('Trazione che finisce in acqua = tuffo e ritorno, senza errori', () => {
      T.fresh({ sword: true, hookshot: true }); T.tp('o:0,2', 5, 9); T.noEnemies(); Game.player.x = 5 * TS; Game.player.dir = 1;
      const hp = Game.s.hp; T.press('item', 70);
      return Game.s.hp === hp - 1 && Math.floor(Game.player.cy() / TS) === 9 ? true : T.where();
    });
    check('Arpione: stordisce uno scheletro, uccide un pipistrello, recupera una gemma', () => {
      T.fresh({ sword: true, hookshot: true }); T.tp('d:1,2', 7, 8); T.noEnemies();   // stanza senza "sconfiggi tutti"
      const sk = new Skeleton(7 * TS, 3 * TS); Game.entities.push(sk); Game.player.dir = 1;
      T.press('item', 20);
      if (!(sk.stunT > 0)) return 'scheletro non stordito';
      for (let i = 0; i < 60 && Game.player.hook; i++) T.run([], 1);   // (Ciclo 15) aspetta che l'arpione sia rientrato
      T.noEnemies(); const bat = new Bat(7 * TS, 4 * TS); bat.rest = 999; Game.entities.push(bat);
      T.press('item', 25); if (!bat.dead) return 'pipistrello vivo';
      Game.pickups = [new Pickup(7 * TS + 8, 3 * TS, 'gem')]; Game.pickups[0].vz = 0; const gems = Game.s.gems;
      T.press('item', 40);
      return Game.s.gems === gems + 1 ? true : 'gemma non recuperata';
    });
    check('Sala delle Armature: ripulita -> Arpione + saracinesca nord aperta', () => {
      T.fresh({ sword: true }); T.tp('d:2,1', 7, 8);
      for (const e of Game.entities) if (e.enemy) { e.hp = 1; e.inv = 0; e.hurt(Game, 1, 0); }
      T.run([], 20);   // (Ciclo 5: l'hit-stop ritarda di qualche frame)
      const ch = Game.entities.find(e => e instanceof Chest);
      if (!ch || ch.def.item !== 'hookshot') return 'forziere arpione assente';
      return Game.tiles[0][7] === 'P' && Game.tiles[0][8] === 'P' ? true : 'saracinesca chiusa';
    });
    check('Boss: fase 1 -> trasformazione -> corazza (spada rimbalza) -> arpione -> vulnerabile -> redenzione', () => {
      T.fresh({ sword: true, hookshot: true, bigkey: true }); Game.s.flags.bossIntro = true;
      T.tp('d:1,0', 7, 8); T.skip();
      const b = Game.boss; if (!(b instanceof ThornKing)) return 'boss sbagliato';
      T.run([], 100); b.hp = 1; b.inv = 0; b.hurt(Game, 1);
      for (let i = 0; i < 200 && !Game.dialog; i++) T.run([], 1);
      T.skip();
      if (b.phase !== 2 || !b.armored) return 'niente fase 2';
      b.inv = 0; b.hurt(Game, 1); if (b.hp !== b.maxHp) return 'la spada ha ferito la corazza';
      b.state = 'move'; b.timer = 999; b.tx = b.x = 7 * TS; b.ty = b.y = 24; Game.projectiles = [];
      Game.player.x = 7 * TS + 8; Game.player.y = 7 * TS; Game.player.dir = 1; T.press('item', 25);
      if (b.state !== 'bare') return 'arpione non ha strappato la corazza (' + b.state + ')';
      b.inv = 0; b.hurt(Game, 1); if (b.hp !== b.maxHp - 1) return 'nessun danno da scoperto';
      b.hp = 1; b.inv = 0; b.hurt(Game, 1);
      for (let i = 0; i < 220 && !Game.dialog; i++) T.run([], 1);
      const ok = Game.s.flags.boss && Game.entities.some(e => e instanceof Crystal) && Game.entities.some(e => e.def && e.def.id === 'ortensio');
      T.skip();
      return ok ? true : 'cristallo/Ortensio mancanti';
    });
    check('Boss fase 2: una bomba strappa la corazza (alternativa)', () => {
      T.fresh({ sword: true, bombs: true }); Game.s.bombs = 5; Game.s.flags.bossIntro = true; Game.s.flags.phase2Seen = true;
      T.tp('d:1,0', 7, 8); T.skip();
      const b = Game.boss; b.phase = 2; b.hp = b.maxHp = 14; b.armored = true; b.state = 'move'; b.timer = 999;
      Game.explode(b.cx(), b.cy());
      return b.state === 'bare' ? true : b.state;
    });
    check('Cambio oggetto (Q) tra bombe e arpione', () => {
      T.fresh({ sword: true, bombs: true, hookshot: true }); Game.s.equip = 'bombs'; T.tp('o:1,2', 7, 6);
      T.press('swap', 2); const a = Game.equipped(); T.press('swap', 2); const b = Game.equipped();
      return a === 'hookshot' && b === 'bombs' ? true : a + '/' + b;
    });
    check('Stress: 1200 frame di input casuale in ogni stanza, nessuna eccezione', () => {
      T.fresh({ sword: true, bombs: true, hookshot: true, lantern: true }); Game.s.bombs = 20;
      const keys = ['up', 'down', 'left', 'right', 'action', 'item', 'swap'];
      for (const id of Object.keys(ROOMS)) {
        T.tp(id, 7, id.startsWith('i:') ? 7 : 5);
        for (let i = 0; i < 1200; i++) {
          Game.s.hp = 12; Game.dialog = null; if (Game.state !== 'play') { Game.state = 'play'; Game.fade = null; Game.scroll = null; }
          if (i % 9 === 0) Input.pressed.add(keys[(Math.random() * keys.length) | 0]);
          Input.down.clear(); Input.down.add(keys[(i >> 5) % 4]);
          Game.update(); Game.render(); Input.endFrame();
          if (Game.roomId !== id) T.tp(id, 7, id.startsWith('i:') ? 7 : 5);
        }
      }
      return true;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.T = T;
console.log('Harness di test caricato: T.suite() esegue i test del Ciclo 3.');
