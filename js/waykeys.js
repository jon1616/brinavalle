'use strict';
/* =====================================================================
 *  WAYKEYS — Ciclo 28 (Agente B, seconda manche): il Segnavia (Ciclo 27)
 *  impara due cose.
 *  · LE CHIAVI. Prima le porte chiuse contavano sempre come "apribili":
 *    nell'Atrio delle Rovine, senza chiavi, la freccia indicava la porta
 *    chiusa a est, mentre la chiave è nel forziere della stanza a ovest
 *    (lo stesso nella Grotta). Ora una porta 'L' senza chiavi, o la grande
 *    porta 'G' senza la Chiave Grande, è chiusa per il percorso; se così
 *    la meta non si raggiunge, la freccia porta al forziere della chiave
 *    più vicino (e, nella sua stanza, lo indica).
 *  · IL CAMMINO NELLA STANZA. La freccia diceva l'uscita, non come
 *    arrivarci (labirinti, rovi, isolotti). Se Lio resta fermo un attimo
 *    con la freccia visibile, compare un SENTIERO DI BRINA: puntini dorati
 *    dalla sua posizione all'uscita giusta. Muovendosi svanisce.
 * ===================================================================== */
const TRAIL_IDLE = 75;   // frame da fermo prima che compaia il sentiero

/* una porta che adesso, per Lio, non si apre */
function wayLocked(g, id, x, y, ch) {
  if (ch !== 'L' && ch !== 'G') return false;
  if (g.s.flags['open:' + id + ':' + x + ',' + y]) return false;
  return ch === 'L' ? g.s.keys <= 0 : !g.s.items.bigkey;
}
/* il forziere-chiave ancora chiuso da raggiungere: prima quelli nella zona della meta (le chiavi valgono
 * ovunque, ma andando alle Rovine non ha senso tornare nella Grotta), poi il più vicino */
function wayKeyRoom(g, goal) {
  const zone = goal ? goal.split(':')[0] : '';
  let best = null, bl = 1e9;
  for (const id in ROOMS) for (const c of ROOMS[id].chests || []) {
    if (c.item !== 'key' || g.s.flags['chest:' + c.id] || (c.cond && !c.cond(g))) continue;
    const L = id === g.roomId ? 1 : (wayPath(g, g.roomId, id) || []).length;
    if (!L) continue;
    const score = L + (id.split(':')[0] === zone ? 0 : 100);
    if (score < bl) { bl = score; best = id; }
  }
  return best;
}

(function installWayKeys() {
  const G = Game;

  /* il grafo delle stanze: un varco fatto solo di porte chiuse non si attraversa */
  const exits0 = wayExits;
  wayExits = function (g, id) {
    const t = wayTiles(g, id);
    return exits0(g, id).filter(e => !e.cells || !e.cells.every(([x, y]) => wayLocked(g, id, x, y, t[y][x])));
  };
  window.wayExits = wayExits;

  /* la meta: se è chiusa dietro una porta, prima la chiave */
  const room0 = objectiveRoom, chest0 = objectiveChest;
  // ricordata per frame: freccia, sentiero e mappa la chiedono più volte nello stesso frame
  let memo = { k: '', v: null };
  objectiveRoom = function (g) {
    const k = g.t + '|' + g.roomId + '|' + g.s.keys + '|' + !!g.s.items.bigkey + '|' + Object.keys(g.s.flags).length + '|' + currentObjective(g);
    if (memo.k === k) return memo.v;
    const goal = room0(g);
    const v = !goal || goal === g.roomId || wayPath(g, g.roomId, goal) ? goal : (wayKeyRoom(g, goal) || goal);
    memo = { k, v };
    return v;
  };
  window.objectiveRoom = objectiveRoom;
  objectiveChest = function (g) {
    const goal = room0(g);
    if (goal && goal !== g.roomId && objectiveRoom(g) === g.roomId) return 'key';   // deviazione per la chiave
    return chest0(g);
  };

  /* ---------------- il sentiero di brina ---------------- */
  const walkable = ch => ch && ch !== '_' && (!TILE_SOLID.has(ch) || TILE_WARP.has(ch) || WAY_DOORS.has(ch));
  let cache = { key: '', path: null };
  /* cammino tessera per tessera dalla posizione di Lio alla freccia (null se non c'è) */
  // anche i bersagli della freccia, una volta per frame
  const targets0 = G.wayTargets;
  let tmemo = { k: '', v: [] };
  G.wayTargets = function () {
    const p = this.player, k = this.t + '|' + this.roomId + '|' + (p ? Math.round(p.x) + ',' + Math.round(p.y) : '') + '|' + this.s.keys + '|' + Object.keys(this.s.flags).length + '|' + objectiveRoom(this);
    if (tmemo.k !== k) tmemo = { k, v: targets0.call(this) };
    return tmemo.v;
  };
  G.wayTrail = function () {
    const w = this.wayTargets()[0], p = this.player;
    if (!w || !p) return null;
    const sx = Math.floor(p.cx() / TS), sy = Math.floor((p.y + 12) / TS);
    let gx = Math.max(0, Math.min(RW - 1, Math.floor(w.x / TS))), gy = Math.max(0, Math.min(RH - 1, Math.floor(w.y / TS)));
    // i forzieri sono entità solide su tessere di pavimento: per il sentiero sono ostacoli
    const boxes = new Set(this.entities.filter(e => e instanceof Chest).map(e => Math.floor((e.x + 8) / TS) + ',' + Math.floor((e.y + 8) / TS)));
    const free = (x, y) => walkable(this.tiles[y] && this.tiles[y][x]) && !boxes.has(x + ',' + y);
    if (w.dir === 0 && !free(gx, gy)) gy = Math.min(RH - 1, gy + 1);   // sopra un forziere o una porta: la tessera sotto
    const key = this.roomId + ':' + sx + ',' + sy + '>' + gx + ',' + gy + ':' + boxes.size;
    if (cache.key === key) return cache.path;
    const K = (x, y) => y * RW + x, prev = new Map([[K(sx, sy), -1]]), q = [[sx, sy]];
    let found = false;
    while (q.length) {
      const [x, y] = q.shift();
      if (Math.abs(x - gx) + Math.abs(y - gy) <= (free(gx, gy) ? 0 : 1)) { gx = x; gy = y; found = true; break; }   // un ostacolo: ci si ferma accanto
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= RW || ny >= RH || prev.has(K(nx, ny)) || !free(nx, ny)) continue;
        prev.set(K(nx, ny), K(x, y)); q.push([nx, ny]);
      }
    }
    let path = null;
    if (found) { path = []; for (let k = K(gx, gy); k !== -1; k = prev.get(k)) path.unshift([k % RW, (k / RW) | 0]); }
    cache = { key, path };
    return path;
  };

  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    const p = this.player;
    if (!p) return;
    const still = this.state === 'play' && !this.dialog && !p.moving && !p.hook && !p.atk;
    this.trailIdle = still ? (this.trailIdle || 0) + 1 : 0;
  };

  const drawWorld = G.drawWorld;
  G.drawWorld = function (c) {
    drawWorld.call(this, c);
    if (!this.wayVisible() || (this.trailIdle || 0) < TRAIL_IDLE) return;
    const path = this.wayTrail();
    if (!path || path.length < 3) return;
    const a = Math.min(1, (this.trailIdle - TRAIL_IDLE) / 30), t = this.t;
    // nelle stanze buie il sentiero si vede solo dentro la luce di Lio (come in drawDark): il buio resta un enigma
    const lit = this.room.dark ? (this.s.items.lantern ? 72 : 22) : 1e9, pcx = this.player.cx(), pcy = this.player.cy() - 3;
    for (let i = 1; i < path.length - 1; i++) {
      const [x, y] = path[i], wave = (Math.sin(t * 0.15 - i * 0.8) + 1) / 2;   // un'onda che corre verso la meta
      const X = x * TS + 7, Y = y * TS + 7;
      if (Math.hypot(X + 1 - pcx, Y + 1 - pcy) > lit) continue;
      c.globalAlpha = a * (0.35 + wave * 0.5);
      c.fillStyle = '#1a1020'; c.fillRect(X - 1, Y - 1, 4, 4);
      c.fillStyle = wave > 0.7 ? '#fff2b0' : '#ffc840'; c.fillRect(X, Y, 2, 2);
    }
    c.globalAlpha = 1;
  };
})();
