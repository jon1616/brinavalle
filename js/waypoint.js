'use strict';
/* =====================================================================
 *  WAYPOINT — Ciclo 27 (Agente A, seconda manche): il SEGNAVIA.
 *  Il gioco diceva COSA fare (l'obiettivo in pausa), ma non DOVE andare:
 *  tra valle, Rovine e Grotta è facile perdersi, soprattutto la prima volta.
 *  · Una freccia dorata indica l'uscita giusta verso l'obiettivo: sul bordo
 *    dello schermo (passaggio) o sopra la porta/scala (passaggio con warp).
 *    Nella stanza dell'obiettivo indica il forziere che serve.
 *  · Opzione «Segnavia»: No / Se ti perdi (predefinita: la freccia compare
 *    solo dopo WAY_LOST secondi sullo stesso obiettivo) / Sempre.
 *  · In pausa, sulla mappa, un «!» segna la stanza verso cui andare (se
 *    l'opzione non è «No»).
 *  Il percorso è una ricerca in ampiezza sul grafo delle stanze (bordi
 *    aperti e warp visibili, con i `dyn` della storia applicati).
 * ===================================================================== */
const WAY_LOST = 150;   // secondi di gioco sullo stesso obiettivo prima che la freccia compaia (con «Se ti perdi»)
const WAY_DOORS = new Set([...'LGJVQB']);   // ostacoli che si aprono (porte, saracinesche, rovi, crepe, cespugli): il percorso ci passa

function chestRoomOf(item) { for (const id in ROOMS) if ((ROOMS[id].chests || []).some(c => c.item === item)) return id; return null; }

/* la stanza dell'obiettivo attuale (null = nessuna meta precisa) */
function objectiveRoom(g) {
  const f = g.s.flags, it = g.s.items;
  if (f.victory) return !f.garden && !f.seedQuest ? 'o:1,0' : null;   // Ortensio, davanti alle Rovine
  if (!f.intro) return 'i:elder';
  if (!it.sword) return 'i:shrine';
  if (!f.collapse && !f.enteredDungeon) return 'o:1,0';
  if (!it.bombs && !f.enteredDungeon) return chestRoomOf('bombs');
  if (!f.enteredDungeon) return 'o:1,0';
  if (!it.hookshot && !it.bigkey) return chestRoomOf('hookshot');
  if (!it.bigkey) return chestRoomOf('bigkey');
  return 'd:1,0';
}
/* il forziere da indicare nella stanza dell'obiettivo */
function objectiveChest(g) {
  const f = g.s.flags, it = g.s.items;
  if (f.victory || !f.enteredDungeon && it.bombs) return null;
  const want = !it.bombs && !f.enteredDungeon ? 'bombs' : !it.hookshot && !it.bigkey ? 'hookshot' : !it.bigkey ? 'bigkey' : null;
  return want;
}

/* le tessere di una stanza "adesso" (la stanza attuale è viva; le altre con i dyn della storia) */
function wayTiles(g, id) {
  if (id === g.roomId) return g.tiles;
  const def = ROOMS[id], t = def.tiles.map(r => r.split(''));
  for (const d of def.dyn || []) { try { if (d.cond(g)) t[d.y][d.x] = d.ch; } catch (e) {} }
  return t;
}
const wayOpen = ch => ch && (!TILE_SOLID.has(ch) || WAY_DOORS.has(ch));
function wayExits(g, id) {
  const def = ROOMS[id]; if (!def) return [];
  const t = wayTiles(g, id), out = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nid = neighborId(id, dx, dy); if (!nid) continue;
    const cells = [];
    if (dx) { const x = dx > 0 ? RW - 1 : 0; for (let y = 0; y < RH; y++) if (wayOpen(t[y][x])) cells.push([x, y]); }
    else { const y = dy > 0 ? RH - 1 : 0; for (let x = 0; x < RW; x++) if (wayOpen(t[y][x])) cells.push([x, y]); }
    if (cells.length) out.push({ to: nid, edge: [dx, dy], cells });
  }
  for (const k in def.warps || {}) {
    const [x, y] = k.split(',').map(Number);
    if (TILE_WARP.has(t[y][x])) out.push({ to: def.warps[k].to, warp: [x, y] });
  }
  return out;
}
/* il prossimo passo verso la meta: { exits: [...] } con tutte le uscite della stanza che portano alla stanza successiva */
function wayPath(g, from, goal) {
  if (!goal || from === goal) return null;
  const prev = new Map([[from, null]]), q = [from];
  while (q.length) {
    const id = q.shift();
    if (id === goal) break;
    for (const e of wayExits(g, id)) if (ROOMS[e.to] && !prev.has(e.to)) { prev.set(e.to, id); q.push(e.to); }
  }
  if (!prev.has(goal)) return null;
  const path = [goal]; while (prev.get(path[0]) !== null) path.unshift(prev.get(path[0]));
  return path;   // [from, ..., goal]
}

(function installWaypoint() {
  const G = Game;
  G.wayT = 0; G.wayObj = '';
  const wayOn = g => Opts.way === 2 || (Opts.way === 1 && g.wayT > WAY_LOST * 60);
  G.wayVisible = function () { return Opts.way > 0 && wayOn(this) && !this.rush && this.state === 'play' && !this.dialog; };

  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state !== 'play' || this.dialog || this.rush) return;
    const o = currentObjective(this);
    if (o !== this.wayObj) { this.wayObj = o; this.wayT = 0; this.wayNoted = false; }
    const was = wayOn(this);
    this.wayT++;
    if (Opts.way === 1 && !was && wayOn(this) && objectiveRoom(this) && !this.wayNoted) {
      this.wayNoted = true; this.banner = { text: 'Serve una mano? Segui la freccia dorata', t: 150 }; Sound.sfx('fairy');
    }
  };
  const newGame = G.newGame;
  G.newGame = function () { this.wayT = 0; this.wayObj = ''; return newGame.apply(this, arguments); };

  /* dove puntare nella stanza attuale: [{ x, y, dir }] in pixel del campo di gioco (dir: verso cui punta la freccia) */
  G.wayTargets = function () {
    const goal = objectiveRoom(this);
    if (!goal) return [];
    if (this.roomId === goal) {
      const want = objectiveChest(this);
      const ch = want && this.entities.find(e => e instanceof Chest && e.def.item === want && !e.opened);
      return ch ? [{ x: ch.x + 8, y: ch.y - 6, dir: 0 }] : [];
    }
    const path = wayPath(this, this.roomId, goal);
    if (!path) return [];
    const next = path[1], p = this.player, out = [];
    for (const e of wayExits(this, this.roomId)) {
      if (e.to !== next) continue;
      if (e.warp) { out.push({ x: e.warp[0] * TS + 8, y: e.warp[1] * TS - 4, dir: 0, d: Math.hypot(e.warp[0] * TS + 8 - p.cx(), e.warp[1] * TS + 8 - p.cy()) }); continue; }
      // il varco del bordo: il gruppo di tessere aperte più vicino a Lio, al suo centro
      const groups = []; let cur = null;
      for (const c of e.cells) { const k = e.edge[0] ? c[1] : c[0]; if (cur && k === cur.last + 1) { cur.cells.push(c); cur.last = k; } else { cur = { cells: [c], last: k }; groups.push(cur); } }
      for (const gr of groups) {
        const m = gr.cells[(gr.cells.length - 1) >> 1], m2 = gr.cells[gr.cells.length >> 1];
        let x = (m[0] + m2[0]) / 2 * TS + 8, y = (m[1] + m2[1]) / 2 * TS + 8;
        const [dx, dy] = e.edge;
        if (dx) x = dx > 0 ? PLAY_W - 9 : 9; else y = dy > 0 ? PLAY_H - 9 : 9;
        out.push({ x, y, dir: dy > 0 ? 0 : dy < 0 ? 1 : dx < 0 ? 2 : 3, d: Math.hypot(x - p.cx(), y - p.cy()) });
      }
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, 1);
  };

  function drawArrow(c, x, y, dir, t) {
    const b = Math.round(Math.sin(t * 0.12) * 2), v = DIRS[dir];
    const X = Math.round(x + v.x * b), Y = Math.round(y + v.y * b);
    // una punta di freccia 7x4, ruotata secondo dir, con bordo scuro
    const pts = [[0, 3], [-1, 2], [0, 2], [1, 2], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [-1, -1], [0, -1], [1, -1], [-1, -2], [0, -2], [1, -2]];
    const rot = ([a, d]) => dir === 0 ? [a, d] : dir === 1 ? [a, -d] : dir === 2 ? [-d, a] : [d, a];
    c.fillStyle = '#1a1020';
    for (const p of pts) { const [px, py] = rot(p); c.fillRect(X + px - 1, Y + py - 1, 3, 3); }
    c.fillStyle = '#ffc840'; for (const p of pts) { const [px, py] = rot(p); c.fillRect(X + px, Y + py, 1, 1); }
    c.fillStyle = '#fff2b0'; for (const p of [[0, 0], [0, -1], [0, -2]]) { const [px, py] = rot(p); c.fillRect(X + px, Y + py, 1, 1); }   // riflesso lungo l'asse
  }

  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!this.wayVisible()) return;
    for (const w of this.wayTargets()) drawArrow(c, w.x, w.y, w.dir, this.t);
  };

  /* in pausa: «!» sulla mappa, sulla stanza verso cui andare (o sull'ultima della zona lungo il percorso) */
  const drawPause = G.drawPause;
  G.drawPause = function (c) {
    drawPause.call(this, c);
    if (Opts.way === 0 || this.pausePage || this.rush) return;
    const goal = objectiveRoom(this); if (!goal) return;
    const path = wayPath(this, this.roomId, goal) || [this.roomId === goal ? goal : null];
    const pre = this.mapPrefix(), mark = [...path].reverse().find(id => id && id.startsWith(pre));
    if (!mark) return;
    const m = /:(\d+),(\d+)$/.exec(mark); if (!m) return;
    const x = 170 + +m[1] * 25, y = 40 + +m[2] * 18;
    if ((this.t >> 4) % 2) return;
    c.fillStyle = '#1a1020'; c.fillRect(x + 8, y + 3, 7, 11);
    c.fillStyle = '#ffc840'; c.fillRect(x + 10, y + 4, 3, 6); c.fillRect(x + 10, y + 11, 3, 2);
  };
  window.wayPath = wayPath; window.wayExits = wayExits; window.objectiveRoom = objectiveRoom;
})();
