'use strict';
/* =====================================================================
 *  TEST DEL CICLO 52 (Agente B) — RIFINITURA: ogni casa ha una porta, ogni dialogo una pagina piena.
 *  · Guardando i villaggi delle regioni, a Ventaria la casa di chi russa era l'unica casa del gioco
 *    senza porta (un blocco di muro con un cartello). Ora ha una porta CHIUSA (tessera 'd': si vede,
 *    ha la sbarra, è muro). Il test cerca in tutte le stanze le case (tessere H) senza porta.
 *  · Impaginazione: il riquadro mostra 4 righe per pagina. Una battuta di 5 righe lascerebbe una
 *    seconda pagina con una riga sola (un tasto in più per mezza frase). Oggi non succede mai: il test
 *    lo tiene così per i testi futuri.
 *  T52.suite()  (con ?test; asincrona perché legge gli script)
 * ===================================================================== */
const T52 = {
  /* le case senza porta: blocchi di tessere H che non toccano una 'D' (porta) o una 'd' (porta chiusa) */
  doorless() {
    const out = [];
    for (const [id, def] of Object.entries(ROOMS)) {
      const t = def.tiles; if (!Array.isArray(t)) continue;
      const seen = new Set();
      for (let y = 0; y < t.length; y++) for (let x = 0; x < t[y].length; x++) {
        if (t[y][x] !== 'H' || seen.has(x + ',' + y)) continue;
        const st = [[x, y]]; seen.add(x + ',' + y); let door = false;
        while (st.length) {
          const [a, b] = st.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const X = a + dx, Y = b + dy, ch = t[Y] && t[Y][X];
            if (ch === 'D' || ch === 'd') door = true;
            if (ch === 'H' && !seen.has(X + ',' + Y)) { seen.add(X + ',' + Y); st.push([X, Y]); }
          }
        }
        if (!door) out.push(id + ' (' + x + ',' + y + ')');
      }
    }
    return out;
  },
  /* tutte le frasi degli script del gioco, con il numero di righe nel riquadro del dialogo */
  async pages() {
    const out = [];
    for (const src of [...document.scripts].map(s => s.src).filter(s => /\/js\//.test(s))) {
      const code = await (await fetch(src)).text(), file = src.split('/').pop().split('?')[0];
      const re = /(['"`])((?:\\.|(?!\1).)*)\1/g; let m;
      while ((m = re.exec(code))) {
        const s = m[2].replace(/\\'/g, "'");
        if (s.length < 40 || !/[a-zà-ù]+ [a-zà-ù]+ [a-zà-ù]+/.test(s)) continue;
        const k = /^([A-ZÀ-Ý?][^:]{0,18}):\s(.*)$/s.exec(s), body = k && !NOT_SPEAKER.test(k[1]) ? k[2] : s;
        out.push({ file, s, n: wrap(body, 226, 11).length });
      }
    }
    return out;
  },
  async suite() {
    const res = [];
    const check = async (name, fn) => { try { const r = await fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    await check('Ogni casa del gioco ha una porta (anche solo chiusa)', () => {
      const bad = T52.doorless(); return bad.length ? 'case senza porta: ' + bad.join(', ') : true;
    });
    await check('Ventaria: la porta chiusa è muro (Lio non ci entra e non cambia stanza) e il suo cartello si legge', () => {
      T.fresh({ sword: true }); Game.s.flags.ventariaSeen = true;
      Game.loadRoom('h:1,1'); Game.state = 'play'; Game.dialog = null;
      if (Game.tiles[3][11] !== 'd' || !TILE_SOLID.has('d') || TILE_WARP.has('d')) return 'la tessera (11,3) non è una porta chiusa';
      const p = Game.player; p.x = 11 * TS; p.y = 4 * TS + 2; p.dir = 1;
      for (let i = 0; i < 40; i++) { Input.down.clear(); Input.down.add('up'); Game.update(); Input.endFrame(); }
      Input.down.clear();
      if (Game.roomId !== 'h:1,1' || Game.state !== 'play') return 'Lio è passato dalla porta chiusa: ' + Game.roomId + ' ' + Game.state;
      if (p.y < 3 * TS + 8) return 'Lio è entrato nel muro (y=' + p.y + ')';
      Input.pressed.add('action'); Game.update(); Input.endFrame();
      const txt = Game.dialog && Game.dialog.entry && Game.dialog.entry.text;
      Game.dialog = null; Game.state = 'title';
      return txt && /porta è sbarrata/.test(txt) ? true : 'il cartello della porta non si legge (' + txt + ')';
    });
    await check('Nessun dialogo lascia una seconda pagina con una riga sola (5, 9, 13... righe)', async () => {
      const bad = (await T52.pages()).filter(x => x.n > 1 && x.n % 4 === 1).map(x => x.file + ': «' + x.s.slice(0, 50) + '...» ' + x.n + ' righe');
      return bad.length ? bad.slice(0, 5).join(' | ') : true;
    });
    console.table(res);
    return res;
  },
};
window.T52 = T52;
