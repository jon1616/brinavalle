'use strict';
/* =====================================================================
 *  GFX3 — grafica aggiunta nel Ciclo 3 (Agente A):
 *   tile  _  abisso (ci si cade dentro; nemici di terra non lo attraversano)
 *   tile  h  palo d'aggancio* per l'Arpione (pietra nei dungeon, legno all'aperto)
 *   icona dell'Arpione, Re dei Rovi corazzato (fase 2), il giardiniere Ortensio.
 * ===================================================================== */
TILE_SOLID.add('h');
CASTS_SHADOW.add('h');
PEOPLE.gardener = { h: '#e0e0d8', s: '#e0b088', x: '#7ab048', c: '#4a7a3a', d: '#355a2a', p: '#6a5030', b: '#3a2418', beard: true };

TilePaint['_'] = (P, r) => {
  P.r(0, 0, 16, 16, '#06040a');
  for (let i = 0; i < 7; i++) P.p(r() * 16, 4 + r() * 12, '#130d1c');
  if (r() < 0.5) P.p(r() * 16, 6 + r() * 10, '#2a2040');   // un lontano luccichio
};
TilePaint['h'] = (P, r, e) => {
  const out = e.ground === 'grass';
  groundPaint(P, r, e.ground === 'ice' ? 'ice' : e.ground);
  P.r(3, 13, 10, 3, 'rgba(0,0,0,0.35)');
  if (out) {   // paletto di legno
    P.r(5, 2, 6, 13, '#2a180a'); P.r(6, 3, 4, 11, '#8a5a2c'); P.r(6, 3, 1, 11, '#a8743c'); P.r(9, 3, 1, 11, '#6a4220');
    P.r(5, 1, 6, 2, '#3a2412'); P.r(6, 1, 4, 1, '#b08048');
  } else {     // colonnina di pietra
    P.r(3, 3, 10, 12, '#1e1a2c'); P.r(4, 4, 8, 10, '#7a7590'); P.r(4, 4, 2, 10, '#9a95b0'); P.r(10, 4, 2, 10, '#5a5570');
    P.r(3, 1, 10, 3, '#1e1a2c'); P.r(4, 1, 8, 2, '#b0aac8');
  }
  // anello di ferro dorato
  for (const [x, y] of [[7, 6], [8, 6], [6, 7], [9, 7], [6, 8], [9, 8], [7, 9], [8, 9]]) P.p(x, y, '#f0c848');
  P.p(7, 7, '#1a1420'); P.p(8, 8, '#1a1420'); P.p(6, 6, '#8a6a20'); P.p(9, 9, '#8a6a20');
};

/* bordi dell'abisso: il pavimento finisce con un "gradino" visibile */
function drawPitEdges(x, tiles) {
  const pit = (tx, ty) => tx < 0 || ty < 0 || tx >= RW || ty >= RH || tiles[ty][tx] === '_';
  for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    if (tiles[ty][tx] !== '_') continue;
    const px = tx * TS, py = ty * TS;
    if (!pit(tx, ty - 1)) {
      x.fillStyle = '#2e2a40'; x.fillRect(px, py, 16, 5);
      x.fillStyle = '#4a4560'; x.fillRect(px, py, 16, 1);
      x.fillStyle = '#1e1a2c'; for (let k = 0; k < 16; k += 4) x.fillRect(px + k + (ty % 2) * 2, py + 1, 1, 4);
      x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(px, py + 5, 16, 3);
    }
    x.fillStyle = '#16121f';
    if (!pit(tx - 1, ty)) x.fillRect(px, py, 2, 16);
    if (!pit(tx + 1, ty)) x.fillRect(px + 14, py, 2, 16);
    if (!pit(tx, ty + 1)) { x.fillStyle = '#3a3550'; x.fillRect(px, py + 15, 16, 1); }
  }
}

/* icona costruita da una lista di pixel, con contorno automatico */
function outlinedIcon(w, h, pix, outline) {
  const P = painter(w, h), set = new Set(pix.map(([x, y]) => x + ',' + y));
  for (const [x, y] of pix) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = (x + dx) + ',' + (y + dy);
    if (!set.has(k)) P.p(x + dx, y + dy, outline || '#1a1420');
  }
  for (const [x, y, c] of pix) P.p(x, y, c);
  return P.c;
}
function makeHookshotIcon() {
  const g = '#f0c848', gd = '#b08a28', ch = '#c8c8d8', hd = '#7a4a24';
  const pix = [
    [1, 1, g], [2, 2, g], [3, 1, g], [4, 1, gd], [1, 3, gd], [3, 3, g], [2, 1, g], [1, 2, g],   // punta ad artiglio
    [4, 4, ch], [5, 5, '#8a8aa0'], [6, 6, ch],                                                    // catena
    [7, 7, hd], [8, 7, hd], [7, 8, hd], [8, 8, '#a86a34'], [9, 9, hd], [8, 9, hd], [9, 8, hd],     // impugnatura
  ];
  return outlinedIcon(11, 11, pix);
}

/* Re dei Rovi corazzato: stesso sprite, ricoperto di placche e aculei */
function makeArmoredBoss(src, f) {
  const c = makeCanvas(32, 32), x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(70,24,80,0.32)'; x.fillRect(0, 11, 32, 21);
  x.globalCompositeOperation = 'source-over';
  // placche
  for (const [px, py] of [[8, 19], [14, 21], [20, 19], [11, 26], [18, 26]]) {
    x.fillStyle = '#1a0c1e'; x.fillRect(px - 1, py - 1, 6, 4);
    x.fillStyle = '#5a2a5e'; x.fillRect(px, py, 4, 2);
    x.fillStyle = '#8a4a8e'; x.fillRect(px, py, 4, 1);
  }
  // aculei tutt'intorno
  for (let k = 0; k < 16; k++) {
    const a = k / 16 * Math.PI * 2 + f * 0.2, bx = 15.5 + Math.cos(a) * 11, by = 19 + Math.sin(a) * 10;
    if (by < 9) continue;
    for (let i = 0; i < 4; i++) {
      x.fillStyle = i === 3 ? '#ff6ab0' : '#2a1430';
      x.fillRect(Math.round(bx + Math.cos(a) * i), Math.round(by + Math.sin(a) * i), 1, 1);
    }
  }
  // occhi più minacciosi
  x.fillStyle = '#ff3060'; x.fillRect(11, 16, 2, 1); x.fillRect(19, 16, 2, 1);
  return c;
}

function buildGfx3() {
  ICON.hookshot = makeHookshotIcon();
  SPR.bossArmor = [makeArmoredBoss(SPR.boss[0], 0), makeArmoredBoss(SPR.boss[1], 1)];
}
