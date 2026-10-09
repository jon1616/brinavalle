'use strict';
/* =====================================================================
 *  GFX4 — grafica del Ciclo 4 (Agente B): Semi dell'Alba, Spada dell'Alba,
 *  Albero dell'Alba (il giardino di Ortensio), sagome per il prologo.
 * ===================================================================== */
ICON_ROWS.seed = ['...o...', '..ogo..', '.oglgo.', '..ogo..', '.oyyyo.', 'oywyyyo', 'oyyyydo', '.oyddo.', '..ooo..'];
ICON_PAL.seed = { o: '#3a2000', g: '#5fc04a', l: '#b8f090', y: '#f8c840', w: '#fff8d0', d: '#c88a20' };
ICON_ROWS.dawnsword = ICON_ROWS.sword;
ICON_PAL.dawnsword = { o: '#3a1a00', w: '#ffffff', l: '#ffd870', y: '#ff9a40', b: '#7a4a24' };

function makeDawnTree() {   // Albero dell'Alba: chioma dorata in fiore (32x32)
  const P = painter(32, 32);
  P.r(9, 29, 14, 3, 'rgba(0,0,0,0.25)');
  P.r(14, 18, 5, 13, '#5a3418'); P.r(15, 18, 3, 13, '#7a4a24'); P.r(16, 19, 1, 11, '#9a6a3a');
  P.r(11, 29, 4, 2, '#5a3418'); P.r(18, 29, 4, 2, '#5a3418');   // radici
  const blobs = [[16, 11, 10], [9, 14, 6.5], [23, 14, 6.5], [12, 7, 6], [21, 7, 6]];
  for (let y = 0; y < 26; y++) for (let x = 0; x < 32; x++) {
    let inside = false, edge = false;
    for (const [bx, by, r] of blobs) { const d = Math.hypot(x - bx, y - by); if (d < r) { inside = true; if (d > r - 1.2) edge = true; } }
    if (!inside) continue;
    const lit = Math.hypot(x - 12, y - 6) < 8;
    P.p(x, y, edge ? '#9a6410' : lit ? ((x * 3 + y) % 5 ? '#ffe878' : '#fff8d0') : ((x * 7 + y * 3) % 6 ? '#f0b830' : '#d8901c'));
  }
  for (const [x, y] of [[8, 12], [14, 5], [24, 11], [19, 16], [11, 18], [26, 15], [17, 9], [6, 15], [22, 5]]) {
    P.p(x, y, '#ff7ab0'); P.p(x + 1, y, '#ffd0e0'); P.p(x, y + 1, '#ff9ac8');
  }
  return P.c;
}

/* sagoma scura di uno sprite (per le scene del prologo) */
const _silCache = new WeakMap();
function silhouetteOf(src, col) {
  let c = _silCache.get(src);
  if (c) return c;
  c = makeCanvas(src.width, src.height);
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in';
  x.fillStyle = col || '#140a1e'; x.fillRect(0, 0, c.width, c.height);
  _silCache.set(src, c);
  return c;
}

function buildGfx4() {
  ICON.seed = spriteFromRows(ICON_ROWS.seed, ICON_PAL.seed);
  ICON.dawnsword = spriteFromRows(ICON_ROWS.dawnsword, ICON_PAL.dawnsword);
  ICON.dawnTree = makeDawnTree();
}
