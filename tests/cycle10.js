'use strict';
/* =====================================================================
 *  TEST DEL CICLO 10 (Agente B) — prestazioni e primi minuti di gioco.
 *  Si carica con index.html?test. Da console:  T10.suite()   T10.bench()
 *  Le misure di tempo forzano l'esecuzione dei comandi grafici leggendo un pixel
 *  (getImageData), altrimenti si misurerebbe solo l'accodamento.
 * ===================================================================== */
const T10 = {
  ms(fn, n) {
    const a = [];
    for (let i = 0; i < n; i++) { const t = performance.now(); fn(); sctx.getImageData(0, 0, 1, 1); a.push(performance.now() - t); }
    a.sort((x, y) => x - y);
    return { avg: a.reduce((p, c) => p + c, 0) / n, med: a[n >> 1], p95: a[Math.floor(n * 0.95)], max: a[n - 1] };
  },
  /* banco di prova: costo medio / 95° percentile di update+render nelle scene più pesanti (a scala 3) */
  bench() {
    const sc = SCALE; SCALE = 3; screenCanvas.width = GW * 3; screenCanvas.height = GH * 3;
    const rows = [];
    const scene = (name, setup, keys) => {
      setup();
      for (let i = 0; i < 60; i++) { Game.update(); Game.render(); }   // riscaldamento (JIT, cache dei tile)
      let k = 0;
      const r = T10.ms(() => { Input.down.clear(); keys(k++).forEach(x => Input.down.add(x)); if (Game.s.hp < 4) Game.s.hp = Game.s.maxHp; Game.update(); Input.endFrame(); Game.render(); }, 240);
      rows.push({ scena: name, mediaMs: +r.avg.toFixed(2), p95Ms: +r.p95.toFixed(2), maxMs: +r.max.toFixed(1) });
    };
    const walk = i => [['left', 'right', 'up', 'down'][(i / 40 | 0) % 4]];
    scene('villaggio all\'alba', () => { T.fresh({ sword: true }); Game.s.flags.victory = true; T.tp('o:1,2', 7, 6); }, walk);
    scene('foresta al crepuscolo', () => { T.fresh({ sword: true }); T.tp('o:0,0', 13, 5); }, walk);
    scene('cripta buia + lanterna', () => { T.fresh({ sword: true, lantern: true }); T.tp('d:0,2', 12, 5); }, walk);
    scene('grotta + bombe', () => { T.fresh({ sword: true }); Game.applyItem('bombs'); T.tp('c:2,1', 4, 5); }, i => i % 60 === 0 ? ['item'] : walk(i));
    scene('Re dei Rovi, fase 2', () => {
      T.fresh({ sword: true, hookshot: true }); Game.s.maxHp = Game.s.hp = 40; Object.assign(Game.s.flags, { bossIntro: true, phase2Seen: true });
      T.tp('d:1,0', 7, 8); T.skip(); T.run([], 100); const b = Game.boss; b.hp = 1; b.inv = 0; b.hurt(Game, 1); T.run([], 220); T.skip();
    }, () => T5.step({ retreat: 0 }));
    SCALE = sc; resize();
    console.table(rows);
    return rows;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Ridisegno nella stessa stanza: stessa tela, niente miniatura', () => {
      T.fresh({ sword: true }); T.tp('o:2,2', 7, 6); const c0 = Game.bg; Game.thumbs = {};
      Game.cutTile(3, 1); Game.redrawBg();
      return Game.bg === c0 && !Game.thumbs['o:2,2'] ? true : 'tela nuova o miniatura generata subito';
    });
    check('Cambio stanza: tela nuova (lo scorrimento usa la vecchia e la nuova)', () => {
      T.fresh({}); T.tp('o:1,2', 7, 6); const c0 = Game.bg; T.tp('o:1,1', 7, 6);
      return Game.bg !== c0 ? true : 'stessa tela tra due stanze';
    });
    check('Miniatura generata alla pausa, aggiornata dopo un taglio', () => {
      T.fresh({ sword: true }); T.tp('o:2,2', 7, 6); const a = Game.thumbOf('o:2,2');
      Game.cutTile(3, 1); const b = Game.thumbOf('o:2,2');
      return a !== b && b.width === 23 ? true : 'miniatura non rigenerata';
    });
    // mediana dopo riscaldamento: la media, a fine regressione, è falsata da pause del garbage collector
    check('Prestazioni: ridisegno + disegno della stanza, mediana sotto gli 8 ms (era ~27 ms solo il ridisegno)', () => {
      T.fresh({ sword: true }); T.tp('c:2,1', 4, 5);
      for (let i = 0; i < 10; i++) { Game.redrawBg(); Game.render(); }
      const r = T10.ms(() => { Game.redrawBg(); Game.render(); }, 30);
      return r.med < 8 ? true : 'mediana ' + r.med.toFixed(1) + ' ms (media ' + r.avg.toFixed(1) + ')';
    });
    check('Intro di Teodoro: col prologo visto non ripete la storia', () => {
      T.fresh({}); Game.s.flags.intro = false; Game.s.flags.sawPrologue = true; Game.dialog = null;
      ROOMS['i:elder'].onEnter(Game);
      const first = Game.dialog && Game.dialog.pages[0].join(' ');
      Game.dialog = null;
      return /sognato/.test(first) ? true : 'prima battuta: ' + first;
    });
    check('Intro di Teodoro: senza prologo racconta tutto', () => {
      T.fresh({}); Game.s.flags.intro = false; Game.s.flags.sawPrologue = false; Game.dialog = null;
      ROOMS['i:elder'].onEnter(Game);
      const n = Game.dialog.queue.length; Game.dialog = null;
      return n >= 6 ? true : 'voci rimaste: ' + n;
    });
    check('Prologo visto fino al furto → flag sawPrologue', () => {
      Game.startPrologue(); Game.proT = PRO_STEAL + 5; Game.endPrologue();
      const a = Game.s.flags.sawPrologue === true;
      Game.startPrologue(); Game.proT = 30; Game.endPrologue();
      return a && !Game.s.flags.sawPrologue ? true : 'flag sbagliato';
    });
    check('Nomi dei tasti: tastiera / touch', () => {
      const kb = [actKey(), moveKeys(), menuKey(), bombKey()].join('|');
      document.body.classList.add('touchmode');
      const tc = [actKey(), moveKeys(), menuKey(), bombKey()].join('|');
      document.body.classList.remove('touchmode'); resize();
      return /SPAZIO/.test(kb) && /FRECCE/.test(kb) && tc === 'A|la levetta|MENU|il pulsante B' ? true : kb + ' / ' + tc;
    });
    check('Testo della spada secondo il dispositivo', () => {
      const kb = ITEMS.sword.text(); document.body.classList.add('touchmode'); const tc = ITEMS.sword.text(); document.body.classList.remove('touchmode'); resize();
      return /SPAZIO/.test(kb) && /Premi A /.test(tc) ? true : kb + ' / ' + tc;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null;
    console.table(res);
    return res;
  },
};
window.T10 = T10;
