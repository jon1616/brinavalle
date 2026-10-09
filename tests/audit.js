'use strict';
/* =====================================================================
 *  AUDIT (Ciclo 8, Agente B) — controlli di qualità "da giocatore", automatici.
 *  Si carica con index.html?test. Da console:
 *    A.texts()   ogni testo disegnato in ogni stato del gioco: esce dallo schermo?
 *                + nomi delle stanze nel riquadro del banner, voci dei menu a scelta,
 *                + tutti i dialoghi degli NPC in 6 fasi della storia (pagine troppe?)
 *    A.audio()   (async) misura volume medio e picchi di ogni effetto e di ogni musica
 *                renderizzandoli in un OfflineAudioContext (vedi Sound.measure in audio.js)
 * ===================================================================== */
/* scontri armonici VOLUTI (Ciclo 14, controllati a mano): traccia:voci@passo
 *  dungeon  Mi sopra Fa  = accordo di Fa con settima maggiore, colore "misterioso"
 *  boss2    Re sopra Mib = nota di passaggio in una scala discendente, si risolve subito
 *  boss     Do sopra Si  = dominante con nona minore, il classico suono "da cattivo" della minore armonica */
const HARMONY_OK = ['dungeon:0-1@20', 'boss2:0-1@18', 'boss:0-1@24'];
const A = {
  /* opt.fallback: simula il caso OFFLINE (Google Fonts non disponibile): tutto in "Courier New".
   * Ogni testo è confrontato con lo spazio che ha davvero (schermo o riquadro, come calcola txt()):
   *  - modalità normale: segnala i testi che non ci stanno (verrebbero compressi);
   *  - modalità offline: piccole compressioni sono accettabili; segnala solo quelle oltre il 28% (k > 1.4). */
  texts(opt) {
    opt = opt || {};
    const bak = localStorage.getItem(SAVE_KEY), issues = [], seen = new Set(), fonts = [UI_FONT, TITLE_FONT];
    let ctx = '', squeezed = 0;
    const FB = opt.fallback === true ? '"Segoe UI", Arial, sans-serif' : opt.fallback;   // A.texts({ fallback: true }) o un font a scelta
    const vt = VT_OK;
    if (opt.fallback) { UI_FONT = FB; TITLE_FONT = '"Courier New", monospace'; VT_OK = false; }
    const orig = window.txt;
    window.txt = function (str, gx, gy, o) {
      o = o || {};
      mctx.font = uiSize(o.size || 11, o.font) + 'px ' + (o.font === undefined ? UI_FONT : (opt.fallback ? TITLE_FONT : o.font));
      const w = mctx.measureText(String(str)).width, al = o.align || 'left';
      const room = o.maxW || (al === 'center' ? 2 * Math.min(gx, GW - gx) - 2 : al === 'right' ? gx - 1 : GW - gx - 1);
      const k = w / Math.max(8, room);
      if (k > 1.001 && String(str).trim()) {
        squeezed++;
        const key = ctx + '|' + str;
        if ((!opt.fallback || k > 1.4) && !seen.has(key)) { seen.add(key); issues.push({ dove: ctx, testo: String(str).slice(0, 70), compressione: Math.round((1 - 1 / k) * 100) + '%' }); }
      }
      return orig.apply(this, arguments);
    };
    const shot = (label, fn) => { ctx = label; try { if (fn) fn(); Game.render(); } catch (e) { issues.push({ dove: label, testo: 'ECCEZIONE ' + e.message }); } };
    Game.newConfirm = null;
    try {
      // --- titolo, opzioni, albo, prologo
      localStorage.removeItem(SAVE_KEY); Game.state = 'title'; shot('titolo senza salvataggio');
      T.fresh({ sword: true }); Game.saveGame(); Game.state = 'title'; shot('titolo con salvataggio');
      for (let i = 0; i < 6; i++) shot('opzioni riga ' + i, () => { Game.state = 'options'; Game.optFrom = 'title'; Game.optIdx = i; });
      for (const d of [0, 1, 2]) shot('opzioni difficoltà ' + d, () => { Game.optIdx = 2; Opts.diff = d; });
      Opts.diff = 1;
      if (Game.drawMedals) MEDALS.forEach((m, i) => shot('albo d\'oro: ' + m.id, () => { Game.state = 'medals'; Game.medalIdx = i; }));
      for (let t = 0; t < PRO_END; t += 40) shot('prologo t=' + t, () => { Game.state = 'prologue'; Game.proT = t; });
      // --- in gioco: HUD, banner, pausa in ogni stanza (con e senza oggetti)
      const full = { sword: true, bombs: true, hookshot: true, lantern: true, potion: true, bigkey: true, hook: true };
      for (const items of [{}, full]) for (const id of Object.keys(ROOMS)) {
        T.fresh(items); if (items.bombs) Game.s.bombs = 20;
        shot('pausa ' + id + (items.sword ? ' (tutto)' : ''), () => { T.tp(id, 7, 5); Game.state = 'pause'; });
      }
      shot('pausa: opzioni', () => { Game.openOptions('pause'); });
      // Ciclo 20: il Bestiario (terza pagina della pausa), vuoto e completo, ogni scheda
      if (typeof BESTIARY !== 'undefined') for (const full of [false, true]) {
        T.fresh({}); T.tp('o:1,2', 7, 6);
        Game.s.bestiary = {}; if (full) for (const B of BESTIARY) Game.s.bestiary[B.k] = { s: 1, n: 5 };
        for (let i = 0; i < BESTIARY.length; i++) shot('bestiario ' + (full ? 'completo' : 'vuoto') + ' ' + BESTIARY[i].k, () => { Game.state = 'pause'; Game.pausePage = 2; Game.bestIdx = i; });
        Game.pausePage = 0;
      }
      for (let i = 0; i < 8; i++) shot('pausa: opzioni riga ' + i, () => { Game.state = 'options'; Game.optFrom = 'pause'; Game.optIdx = i; });
      // Ciclo 12: guida (2 pagine, 3 dispositivi) e conferma della nuova partita
      for (const dev of ['tastiera', 'touch']) for (const pg of [0, 1]) shot('guida ' + dev + ' p' + pg, () => {
        if (dev === 'touch') document.body.classList.add('touchmode');
        Game.state = 'guide'; Game.optFrom = 'pause'; Game.guidePage = pg;
      });
      document.body.classList.remove('touchmode');
      T.fresh({ sword: true }); Game.s.time = 3600 * 3; Game.saveGame();
      for (const k of [0, 1]) shot('conferma nuova partita ' + k, () => { Game.state = 'title'; Game.newConfirm = { idx: k }; });
      Game.newConfirm = null;
      // Ciclo 13 (Agente A): diario in 3 fasi con ogni missione selezionata, e la Sfida dei Guardiani (HUD e schermate finali)
      if (typeof SIDE_QUESTS !== 'undefined') {
        const fases = [['diario inizio', {}, {}],
          ['diario metà', { sword: true, bombs: true, hookshot: true }, { intro: true, collapse: true, enteredDungeon: true, golem: true, hookReturned: true }],
          ['diario finale', { sword: true, bombs: true, hookshot: true, tunic: true }, { intro: true, victory: true, boss: true, golem: true, hookReturned: true, garden: true }]];
        for (const [nm, it, fl] of fases) {
          T.fresh(it); Object.assign(Game.s.flags, fl); Game.visited.add('o:0,2'); T.tp('o:1,2', 7, 6);
          const n = Math.max(1, Game.knownQuests().length);
          for (let q = 0; q < n; q++) shot(nm + ' missione ' + q, () => { Game.state = 'pause'; Game.pausePage = 1; Game.questIdx = q; });
          Game.pausePage = 0;
        }
      }
      if (Game.startRush) {
        const keepMedals = Medals.data; Medals.data = { got: {}, wins: 1, best: null };
        Game.startRush(); shot('sfida: cronometro', () => { Game.state = 'play'; });
        for (const won of [true, false]) shot('sfida: fine ' + (won ? 'vinta' : 'persa'), () => { Game.rush.round = 2; Game.rush.t = 9000; Game.endRush(won); Game.rushEndT = 100; });
        Game.rush = null; Game.state = 'title'; Medals.data = keepMedals;
      }
      // --- banner dei nomi delle stanze: devono stare nel riquadro di 160 px
      mctx.font = '12px ' + UI_FONT;
      for (const id of Object.keys(ROOMS)) {
        const w = mctx.measureText(ROOMS[id].name).width;
        if (w + 18 > GW - 8) issues.push({ dove: 'banner', testo: ROOMS[id].name, da: Math.round(128 - w / 2), a: Math.round(128 + w / 2) });   // il riquadro ora si adatta
      }
      // --- pesca, epilogo, finale, game over
      T.fresh({}); T.tp('o:0,2', 12, 3); Game.startFishing();
      for (const ph of ['aim', 'wait', 'bite', 'reel']) shot('pesca ' + ph, () => { Game.fsh.phase = ph; Game.fsh.charging = ph === 'aim'; });
      for (const m of ['Troppo presto! Era solo un assaggio...', 'Il filo si è spezzato! Lascia quando si dimena.', 'Qui non abbocca più niente. Lancia altrove!', 'Troppo tardi! Si è mangiato l\'esca...', 'È scappato... Non lasciarlo allontanare troppo!', 'Abboccato! Tieni premuto per tirare!'])
        shot('pesca messaggio', () => { Game.fishMsg(m, 50); });
      for (const sp of FISH) shot('pesca scheda ' + sp.id, () => { Game.fsh.phase = 'caught'; Game.fsh.card = { sp, cm: sp.max, rec: true, first: true, gems: 99 }; Game.s.fishLog[sp.id] = sp.max; });
      Game.endFishing(); Game.dialog = null;
      Game.s.flags.victory = true; Game.s.time = 3600 * 2.5;
      for (let t = 0; t < EPI_DONE + 40; t += 30) shot('epilogo t=' + t, () => { Game.state = 'epilogue'; Game.epT = t; });
      for (let t = 0; t < ENDING_DONE + 40; t += 40) shot('finale t=' + t, () => { Game.state = 'ending'; Game.endT = t; });
      shot('game over', () => { Game.state = 'gameover'; Game.goT = 80; });
      // --- dialoghi: ogni NPC, ogni cartello, in 6 fasi della storia
      const phases = [
        ['inizio', {}, {}],
        ['spada', { intro: true }, { sword: true }],
        ['crollo', { intro: true, collapse: true }, { sword: true }],
        ['bombe', { intro: true, collapse: true, caveEntered: true, golem: true }, { sword: true, bombs: true }],
        ['rovine', { intro: true, enteredDungeon: true, hermitGift: true, hookReturned: true }, { sword: true, bombs: true, hookshot: true }],
        ['vittoria', { intro: true, enteredDungeon: true, victory: true, boss: true, hermitGift: true, hookReturned: true, fairyGift: true }, { sword: true, bombs: true, hookshot: true, crystal: true }],
      ];
      for (const [ph, flags, items] of phases) {
        for (const id of Object.keys(ROOMS)) {
          const def = ROOMS[id];
          const lists = [];
          for (const n of def.npcs || []) lists.push(['NPC ' + n.id, n]);
          for (const k in def.signs || {}) lists.push(['cartello ' + id + ' ' + k, def.signs[k]]);
          for (const [who, src] of lists) {
            T.fresh(items); Object.assign(Game.s.flags, flags); if (items.bombs) Game.s.bombs = 5;
            T.tp(id, 7, 5);
            let entries;
            try { entries = typeof src === 'function' ? src(Game) : Array.isArray(src) ? src : src.talk(Game); }
            catch (e) { issues.push({ dove: ph + ' ' + who, testo: 'ECCEZIONE ' + e.message }); continue; }
            A.checkEntries(entries, ph + ' ' + who, issues, 0);
          }
        }
      }
    } finally {
      window.txt = orig; [UI_FONT, TITLE_FONT] = fonts; VT_OK = vt; A.squeezed = squeezed;
      if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
      Game.state = 'title'; Game.menuIdx = 0; Game.dialog = null;
    }
    console.table(issues);
    return issues;
  },
  /* voci di dialogo: pagine (max 3 per voce, oltre è un muro di testo) e voci di menu (riquadro 132px) */
  checkEntries(entries, where, issues, depth) {
    if (!Array.isArray(entries) || depth > 3) return;
    for (let e of entries) {
      if (typeof e === 'function') continue;   // le funzioni hanno effetti: non le eseguiamo qui
      if (typeof e === 'string') e = { text: e };
      const m = /^([A-ZÀ-Ý?][^:]{0,18}):\s(.*)$/s.exec(e.text), body = m ? m[2] : e.text;
      const pages = Math.ceil(wrap(body, 226, 11).length / 4);
      if (pages > 2) issues.push({ dove: where, testo: '(' + pages + ' pagine) ' + body.slice(0, 60) });
      for (const c of e.choices || []) {
        mctx.font = '11px ' + UI_FONT;
        const w = mctx.measureText('▶ ' + c.label).width;
        if (w > 124) issues.push({ dove: where + ' (menu)', testo: c.label, da: 0, a: Math.round(w) });
      }
    }
  },

  async audio() {
    const out = [];
    for (const n of Sound.sfxNames()) out.push(Object.assign({ suono: n }, await Sound.measure('sfx', n)));
    for (const n of Sound.trackNames()) out.push(Object.assign({ suono: 'musica: ' + n }, await Sound.measure('music', n)));
    console.table(out);
    return out;
  },

  /* Ciclo 14: ARMONIA delle musiche, una misura di "suona stonato?" per musiche che nessuno ha mai ascoltato.
   * Per ogni traccia, passo per passo, le note che suonano insieme nelle varie voci:
   *  - scontri di 2a minore / 7a maggiore che durano almeno un quarto (2 passi): i passaggi di una croma sono normali;
   *  - note fuori dalla tonalità (maggiore o minore armonica/naturale, la più adatta);
   *  - salti oltre l'ottava tra l'ultima e la prima nota di una voce (si sentirebbe uno "scatto" a ogni ripresa).
   * HARMONY_OK elenca gli scontri voluti, verificati a mano (vedi HANDOFF, Ciclo 14). */
  harmony() {
    const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
    const midi = n => { const m = /^([A-G][#b]?)(\d)$/.exec(n); return m ? (+m[2] + 1) * 12 + SEMI[m[1]] : null; };
    const gcd = (a, b) => b ? gcd(b, a % b) : a, lcm = (a, b) => a / gcd(a, b) * b;
    const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10, 11];
    const out = [];
    for (const [name, tr] of Object.entries(Sound.tracks())) {
      const voices = tr.voices.filter(v => !v.drum).map(v => {
        const toks = v.notes.split(/\s+/).filter(t => t && t !== '|'), seq = []; let cur = null;
        for (const t of toks) { if (t === '.') cur = null; else if (t !== '-') cur = midi(t); seq.push(cur); }
        return seq;
      });
      const L = voices.reduce((a, v) => lcm(a, v.length), 1), clashes = [], hist = new Array(12).fill(0), seams = [];
      for (let a = 0; a < voices.length; a++) {
        voices[a].forEach(m => { if (m !== null) hist[m % 12]++; });
        const ons = voices[a].filter((m, i) => m !== null && m !== voices[a][i - 1]);
        if (ons.length > 1 && Math.abs(ons[0] - ons[ons.length - 1]) > 12) seams.push('voce ' + a);
        for (let b = a + 1; b < voices.length; b++) {
          let run = 0, start = 0, iv = -1;
          for (let s = 0; s <= L; s++) {
            const x = s < L ? voices[a][s % voices[a].length] : null, y = s < L ? voices[b][s % voices[b].length] : null;
            const c = x !== null && y !== null ? Math.abs(x - y) % 12 : -1, bad = c === 1 || c === 11;
            if (bad && run && c === iv) run++;
            else { if (run >= 2) clashes.push(name + ':' + a + '-' + b + '@' + start); run = bad ? 1 : 0; start = s; iv = c; }
          }
        }
      }
      let best = 0;
      for (let r = 0; r < 12; r++) for (const sc of [MAJ, MIN]) best = Math.max(best, sc.reduce((t, x) => t + hist[(r + x) % 12], 0));
      const tot = hist.reduce((p, q) => p + q, 0);
      out.push({ traccia: name, inTonalita: Math.round(best / tot * 100), scontri: clashes.filter(c => !HARMONY_OK.includes(c)), scontriVoluti: clashes.filter(c => HARMONY_OK.includes(c)).length, salti: seams });
    }
    console.table(out);
    return out;
  },

  /* test permanenti del Ciclo 8 (async per via dell'audio): await A.suite() */
  async suite() {
    const res = [], bak = localStorage.getItem(SAVE_KEY);
    const check = async (name, fn) => { try { const r = await fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    await check('Font: VT323 rilevato quando è caricato', () => checkFonts() ? true : 'VT_OK falso con il font caricato');
    await check('Testi: nessuno esce dal suo spazio (online)', () => { const r = A.texts(); return r.length ? r.length + ': ' + r.slice(0, 3).map(x => x.testo).join(' | ') : true; });
    await check('Testi: offline (ripiego sans) nessuna compressione oltre il 28%', () => { const r = A.texts({ fallback: true }); return r.length ? r.length + ': ' + r.slice(0, 3).map(x => x.testo).join(' | ') : true; });
    // controllo dell'audit stesso: col vecchio ripiego Courier deve trovare testi schiacciati (non è un controllo "cieco")
    await check('Audit non cieco: col vecchio ripiego Courier trova testi schiacciati', () => { const r = A.texts({ fallback: '"Courier New", monospace' }); return r.length > 0 ? true : 'nessuno trovato'; });
    await check('Banner: il riquadro si allarga per i nomi lunghi', () => {
      T.fresh({}); T.tp('c:0,0', 7, 5); Game.banner = { text: ROOMS['c:0,0'].name, t: 100 };
      const calls = [], f = sctx.fillRect; sctx.fillRect = function (x, y, w, h) { calls.push(w / SCALE); return f.apply(this, arguments); };
      try { Game.render(); } finally { sctx.fillRect = f; }
      return calls.some(w => w > 165 && w < GW) ? true : 'larghezze: ' + calls.slice(0, 6).map(Math.round).join(',');
    });
    await check('Mappa: miniature vere delle stanze visitate', () => {
      T.fresh({}); Game.visited.add('o:0,2'); T.tp('o:1,2', 7, 6); Game.state = 'pause'; Game.render();
      const th = Game.thumbOf('o:0,2'); Game.state = 'title';
      return th && th.width === 23 && th.height === 16 ? true : 'miniatura mancante';
    });
    await check('Musica: nessuno scontro prolungato non voluto, tutto in tonalità, nessun salto alla ripresa', () => {
      const bad = A.harmony().filter(r => r.scontri.length || r.inTonalita < 97 || r.salti.length);
      return bad.length ? bad.map(r => r.traccia + ' ' + r.scontri.join(',') + ' ' + r.inTonalita + '% ' + r.salti.join(',')).join(' | ') : true;
    });
    await check('Audio: misura offline funzionante', async () => { const m = await Sound.measure('sfx', 'sword'); return m.picco > 0 && m.rmsDb > -60 ? true : JSON.stringify(m); });
    await check('Audio: musiche entro 2,5 dB tra loro', async () => {
      const v = []; for (const n of Sound.trackNames()) v.push((await Sound.measure('music', n)).rmsDb);
      const d = Math.max(...v) - Math.min(...v); return d <= 2.5 ? true : 'differenza ' + d.toFixed(1) + ' dB';
    });
    await check('Audio: i suoni-premio stanno sopra la media delle musiche', async () => {
      const v = []; for (const n of Sound.trackNames()) v.push((await Sound.measure('music', n)).rmsDb);
      const avg = v.reduce((a, b) => a + b, 0) / v.length, low = [];
      for (const n of ['secret', 'chest', 'victory', 'medal', 'item']) { const m = await Sound.measure('sfx', n); if (m.rmsDb < avg) low.push(n + ' ' + m.rmsDb); }
      return low.length ? 'sotto la musica (' + avg.toFixed(1) + '): ' + low.join(', ') : true;
    });
    if (bak) localStorage.setItem(SAVE_KEY, bak); else localStorage.removeItem(SAVE_KEY);
    Game.state = 'title'; Game.menuIdx = 0;
    console.table(res);
    return res;
  },
};
window.A = A;
