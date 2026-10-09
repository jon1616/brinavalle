'use strict';
/* =====================================================================
 *  TEST DEL CICLO 16 (Agente B) — passaggi tra le stanze e contrasto dei testi.
 *  Si carica con index.html?test. Da console:
 *    T16.edges()     ogni varco nel bordo di una stanza combacia con la stanza accanto?
 *    T16.warps()     ogni porta / scala / ingresso porta su terreno calpestabile?
 *    T16.contrast()  contrasto di ogni testo con lo sfondo che ha davvero dietro
 *    T16.suite()
 * ===================================================================== */
const T16 = {
  // varchi "a pagamento": solidi all'inizio ma apribili (saracinesche, porte, crepe, rovi, cespugli)
  GATES: new Set([...'JLGQVB']),
  walk(ch) { return ch !== undefined && ch !== null && !TILE_SOLID.has(ch) && ch !== '~' && ch !== '_'; },
  permaSolid(ch) { return ch === undefined || ch === null || ((TILE_SOLID.has(ch) || ch === '~' || ch === '_') && !T16.GATES.has(ch)); },
  /* tile della stanza come le vede il giocatore (dyn, saracinesche, crepe e rovi) in uno stato di flag */
  tilesOf(id, flags) {
    const keep = Game.s; T.fresh({}); Object.assign(Game.s.flags, flags || {});
    Game.loadRoom(id); const t = Game.tiles.map(r => r.slice());
    Game.s = keep; return t;
  },
  edges() {
    const issues = [], dirs = [[1, 0, 'est'], [-1, 0, 'ovest'], [0, 1, 'sud'], [0, -1, 'nord']];
    for (const id of Object.keys(ROOMS)) {
      if (!/^[odclrnt]:/.test(id)) continue;   // l: = Santuario Sommerso (Ciclo 17)
      const A = ROOMS[id].tiles;
      for (const [dx, dy, name] of dirs) {
        const nid = neighborId(id, dx, dy);
        const B = nid && ROOMS[nid].tiles;
        const n = dx ? RH : RW;
        for (let k = 0; k < n; k++) {
          const a = dx ? A[k][dx > 0 ? RW - 1 : 0] : A[dy > 0 ? RH - 1 : 0][k];
          if (!T16.walk(a) && !T16.GATES.has(a)) continue;   // nessun varco qui
          if (!B) { issues.push({ stanza: id, lato: name, pos: k, problema: 'varco verso il nulla (' + a + ')' }); continue; }
          const b = dx ? B[k][dx > 0 ? 0 : RW - 1] : B[dy > 0 ? 0 : RH - 1][k];
          if (T16.permaSolid(b)) issues.push({ stanza: id, lato: name, pos: k, problema: 'di là c\'è "' + b + '" in ' + nid });
        }
      }
    }
    return issues;
  },
  warps() {
    const issues = [];
    for (const id of Object.keys(ROOMS)) {
      const ws = ROOMS[id].warps || {};
      for (const k in ws) {
        const w = ws[k];
        if (!ROOMS[w.to]) { issues.push({ da: id + ' ' + k, problema: 'stanza inesistente ' + w.to }); continue; }
        // la destinazione deve essere calpestabile, non un altro warp, e il giocatore non deve finire dentro un solido
        const t = ROOMS[w.to].tiles[w.y][w.x];
        // un ostacolo che si apre per sempre (crepa, rovi, porta, saracinesca) va bene; un cespuglio ricresce: no
        if (!T16.walk(t) && !(T16.GATES.has(t) && t !== 'B')) { issues.push({ da: id + ' ' + k, a: w.to + ' ' + w.x + ',' + w.y, problema: 'arrivo su "' + t + '"' }); continue; }
        if (TILE_WARP.has(t)) issues.push({ da: id + ' ' + k, a: w.to + ' ' + w.x + ',' + w.y, problema: 'arrivo su un altro passaggio' });
        T.fresh({ sword: true }); T.tp(w.to, w.x, w.y);
        if (T16.GATES.has(Game.tiles[w.y][w.x]) && t !== 'B') { Game.tiles[w.y][w.x] = floorOf(Game.room.ground); }   // già aperto quando ci arrivi
        const h = boxHitsSolid(Game.player.box(), Game.player.mopts);
        if (h) issues.push({ da: id + ' ' + k, a: w.to + ' ' + w.x + ',' + w.y, problema: 'giocatore dentro un ostacolo (' + (h.t || 'entità') + ')' });
      }
    }
    return issues;
  },
  /* luminanza relativa (WCAG) di un colore [r,g,b] 0..255 */
  lum(c) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); },
  ratio(a, b) { const x = T16.lum(a), y = T16.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); },
  hex(h) { h = String(h || '#fff').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); },
  /* sfondo reale sotto un punto (coordinate di gioco): livello dei testi composto sopra la pixel art */
  bgAt(gx, gy) {
    const s = SCALE, X = Math.max(0, Math.min(GW - 1, gx | 0)), Y = Math.max(0, Math.min(GH - 1, gy | 0));
    const t = sctx.getImageData(Math.floor(X * s), Math.floor(Y * s), 1, 1).data, p = bctx.getImageData(X, Y, 1, 1).data, a = t[3] / 255;
    return [0, 1, 2].map(i => t[i] * a + p[i] * (1 - a));
  },
  /* contrasto di ogni testo: misura lo sfondo prima che il testo venga disegnato, in 8 punti del suo riquadro, e tiene il più chiaro/scuro peggiore */
  contrast(min) {
    min = min || 3;
    const found = new Map(), orig = window.txt;
    window.txt = function (str, gx, gy, o) {
      o = o || {};
      const S = String(str);
      if (S.trim() && (o.alpha === undefined || o.alpha > 0.9)) {
        const size = o.size || 11;
        mctx.font = size + 'px ' + (o.font || UI_FONT);
        const w = Math.min(mctx.measureText(S).width, GW), al = o.align || 'left';
        const x0 = al === 'center' ? gx - w / 2 : al === 'right' ? gx - w : gx;
        const col = T16.hex(o.color);
        let worst = 99;
        for (let i = 0; i < 4; i++) for (const fy of [0.25, 0.75]) {
          const r = T16.ratio(col, T16.bgAt(x0 + w * (i + 0.5) / 4, gy + size * fy));
          if (r < worst) worst = r;
        }
        const key = S.slice(0, 50) + '|' + o.color;
        if (worst < min && (!found.has(key) || found.get(key).contrasto > worst)) found.set(key, { testo: S.slice(0, 50), colore: o.color || '#fff', contrasto: +worst.toFixed(2) });
      }
      return orig.apply(this, arguments);
    };
    try { A.texts(); } finally { window.txt = orig; }
    const out = [...found.values()].sort((x, y) => x.contrasto - y.contrasto);
    console.table(out);
    return out;
  },
  /* testi SOVRAPPOSTI nello stesso frame (l'audit delle larghezze guarda una riga alla volta e non li vede).
   * Per ogni render raccoglie il riquadro di ogni testo e segnala le coppie che si accavallano di più di 1 px. */
  overlaps() {
    const issues = new Map(), origTxt = window.txt, origRender = Game.render;
    let boxes = null;
    window.txt = function (str, gx, gy, o) {
      o = o || {};
      const S = String(str);
      if (boxes && S.trim() && (o.alpha === undefined || o.alpha > 0.3)) {
        const size = o.size || 11;
        mctx.font = size + 'px ' + (o.font || UI_FONT);
        const room = o.maxW || GW, w = Math.min(mctx.measureText(S).width, room), al = o.align || 'left';
        const x0 = al === 'center' ? gx - w / 2 : al === 'right' ? gx - w : gx;
        const lead = S.match(/^\s*/)[0].length * size * 0.45;   // spazi iniziali (es. "  voce" nei menu)
        boxes.push({ s: S.slice(0, 40), x0: x0 + lead, x1: x0 + w, y0: gy + size * 0.1, y1: gy + size * 0.85 });
      }
      return origTxt.apply(this, arguments);
    };
    Game.render = function () {
      boxes = [];
      const r = origRender.apply(this, arguments);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ox > 1 && oy > 1 && a.s !== b.s) {
          const k = this.state + ' | ' + a.s + ' / ' + b.s;
          if (!issues.has(k)) issues.set(k, { stato: this.state, a: a.s, b: b.s, px: Math.round(ox) + 'x' + Math.round(oy) });
        }
      }
      boxes = null;
      return r;
    };
    try { A.texts(); } finally { window.txt = origTxt; Game.render = origRender; }
    const out = [...issues.values()];
    console.table(out);
    return out;
  },
  suite() {
    const bak = localStorage.getItem(SAVE_KEY), res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Varchi tra stanze: ogni apertura combacia con la stanza accanto', () => { const r = T16.edges(); return r.length ? r.length + ': ' + JSON.stringify(r.slice(0, 3)) : true; });
    check('Porte, scale e ingressi: si arriva sempre su terreno calpestabile', () => { const r = T16.warps(); return r.length ? r.length + ': ' + JSON.stringify(r.slice(0, 3)) : true; });
    check('Atrio ↔ Cripta (crepa fatta saltare): mai dentro un muro, andata e ritorno', () => {
      T.fresh({ sword: true, lantern: true }); Game.applyItem('bombs'); Object.assign(Game.s.flags, { enteredDungeon: true, cryptFound: true });
      T.tp('d:1,2', 2, 6); T.noEnemies(); Game.player.dir = 2; T.press('item', 1); T.run(['right'], 25); T.run([], 100); T.skip();
      if (Game.tiles[6][0] === 'Q') return 'crepa ancora intera';
      Game.player.x = 2 * TS; Game.player.y = 6 * TS - 6; T.noEnemies();
      let inside = 0;
      const go = (k, n) => { for (let i = 0; i < n; i++) { T.run([k], 1); if (Game.dialog) T.skip(); if (Game.state === 'play' && boxHitsSolid(Game.player.box(), Game.player.mopts)) inside++; } };
      go('left', 120); const a = Game.roomId; T.noEnemies(); go('right', 160); const b = Game.roomId;
      return a === 'd:0,2' && b === 'd:1,2' && !inside ? true : a + ' → ' + b + ', frame dentro un solido: ' + inside;
    });
    check('Contrasto: nessun testo sotto 3:1 rispetto allo sfondo reale', () => { const r = T16.contrast(3); return r.length ? r.length + ': ' + r.slice(0, 4).map(x => x.contrasto + ' ' + x.testo).join(' | ') : true; });
    check('Testi sovrapposti nello stesso frame: nessuno', () => { const r = T16.overlaps(); return r.length ? r.length + ': ' + r.slice(0, 3).map(x => x.stato + ' ' + x.a + ' / ' + x.b).join(' | ') : true; });
    check('Albo d\'oro: con l\'ultima medaglia selezionata la griglia non tocca descrizione e piè di pagina', () => {
      const ys = [], o = window.txt;
      window.txt = function (str, gx, gy) { if (/\? \? \?|^[A-Z]/.test(String(str)) && gx < 200 && gy > 20) ys.push(gy); return o.apply(this, arguments); };
      try { Game.state = 'medals'; Game.medalIdx = MEDALS.length - 1; Game.render(); } finally { window.txt = o; Game.state = 'title'; }
      const grid = ys.filter(y => y < 160);
      return Math.max(...grid) <= 23 + (MEDAL_ROWS - 1) * 19 + 3 ? true : 'righe fino a y=' + Math.max(...grid);
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null; Game.newConfirm = null;
    console.table(res);
    return res;
  },
};
window.T16 = T16;
