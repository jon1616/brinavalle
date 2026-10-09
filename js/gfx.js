'use strict';
/* =====================================================================
 *  GFX — pixel art 100% procedurale: tile dipinte via codice e sprite
 *  descritti come stringhe di caratteri + palette. Nessuna immagine esterna.
 * ===================================================================== */
const TS = 16, RW = 16, RH = 11;            // tile 16px, stanza 16x11 tile
const GW = 256, GH = 192, HUD_H = 16;        // risoluzione interna
const PLAY_W = RW * TS, PLAY_H = RH * TS;    // 256 x 176

function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function painter(w, h) {
  w = w || 16; h = h || 16;
  const c = makeCanvas(w, h), x = c.getContext('2d');
  return {
    c, x,
    p(px, py, col) { px |= 0; py |= 0; if (px < 0 || py < 0 || px >= w || py >= h) return; x.fillStyle = col; x.fillRect(px, py, 1, 1); },
    r(px, py, pw, ph, col) { x.fillStyle = col; x.fillRect(px, py, pw, ph); },
  };
}
function spriteFromRows(rows, pal) {
  const h = rows.length, w = rows[0].length;
  const c = makeCanvas(w, h), x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const col = pal[rows[j][i]];
    if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
  }
  return c;
}
function mirrorCanvas(src) {
  const c = makeCanvas(src.width, src.height), x = c.getContext('2d');
  x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
  return c;
}
const _tintCache = new WeakMap();
function whiteOf(src) {   // silhouette bianca per il "flash" quando si viene colpiti
  let c = _tintCache.get(src);
  if (c) return c;
  c = makeCanvas(src.width, src.height);
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  _tintCache.set(src, c);
  return c;
}

/* ============================ TILE ============================
 * Legenda caratteri (vedi anche HANDOFF.md):
 *  .  erba        ,  erba alta     F  fiori        :  sentiero
 *  T  albero*     ~  acqua*        =  ponte        B  cespuglio* (tagliabile)
 *  V  rovi* (tagliabili SOLO con la spada, taglio permanente)
 *  R  tetto*      H  muro casa*    D  porta (warp) S  cartello*
 *  r  masso*      A  statua*       Z  scala giù (warp)
 *  M  tetto santuario*  N  muro di pietra*  O  porta di pietra (warp)
 *  P  pavimento rovine  W  muro dungeon*    Y  braciere*  b  blocco*
 *  L  porta chiusa a chiave*  G  porta del boss*  U  scala su (warp)
 *  w  pavimento legno   I  muro interno*    E  uscita (warp)
 *  t  tavolo*  k  libreria*  c  bancone*  j  vaso*  X  vuoto*  p  pavimento pietra
 *  --- aggiunte del Ciclo 2 ---
 *  q  ghiaccio (si scivola!)   x  cristalli di ghiaccio*   ^  piastra a pressione
 *  J  saracinesca* (si apre con un flag, vedi `shutters` in world.js)
 *  Q  crepa*: masso incrinato (all'aperto) o parete incrinata (al chiuso). Si distrugge con le BOMBE
 *  K  parete rocciosa*         C  ingresso di grotta (warp)
 *  Nota: P, W, b, L, Z, U, x, ^ cambiano aspetto se la stanza ha ground:'ice' (Grotta di Brina).
 *  (* = solido)
 */
const TILE_SOLID = new Set([...'T~BVRHSrAMNWYbLGIktcjXxJQK']);
const TILE_WARP = new Set([...'DZUEOC']);
const CASTS_SHADOW = new Set([...'WNHIkbLGXrRJK']);
/* carattere di pavimento "nudo" per ogni terreno (usato quando qualcosa viene distrutto) */
function floorOf(ground) { return ground === 'dungeon' || ground === 'ice' ? 'P' : ground === 'wood' ? 'w' : ground === 'stone' ? 'p' : '.'; }

const Ground = {
  grass(P, r) {
    P.r(0, 0, 16, 16, '#5a9c3d');
    for (let i = 0; i < 16; i++) P.p(r() * 16, r() * 16, '#4f8c35');
    for (let i = 0; i < 7; i++) { const x = r() * 16 | 0, y = 1 + (r() * 15 | 0); P.p(x, y, '#72bd50'); P.p(x, y - 1, '#72bd50'); }
  },
  dungeon(P, r) {
    P.r(0, 0, 16, 16, '#4a4560');
    P.r(1, 1, 6, 1, '#57516f'); P.r(9, 1, 6, 1, '#57516f'); P.r(1, 9, 6, 1, '#57516f'); P.r(9, 9, 6, 1, '#57516f');
    P.r(0, 0, 16, 1, '#38334c'); P.r(0, 8, 16, 1, '#38334c'); P.r(0, 0, 1, 16, '#38334c'); P.r(8, 0, 1, 16, '#38334c');
    for (let i = 0; i < 6; i++) P.p(r() * 16, r() * 16, '#403b55');
    if (r() < 0.3) { let x = 2 + r() * 10, y = 2 + r() * 10; for (let k = 0; k < 5; k++) { P.p(x, y, '#2e2a40'); x += r() < 0.5 ? 1 : 0; y += 1; } }
  },
  wood(P, r) {
    P.r(0, 0, 16, 16, '#a0703e');
    for (let y = 0; y < 16; y += 4) { P.r(0, y, 16, 1, '#b0804a'); P.r(0, y + 3, 16, 1, '#7c5228'); P.r(r() * 16 | 0, y, 1, 3, '#7c5228'); }
    for (let i = 0; i < 5; i++) P.p(r() * 16, r() * 16, '#8a5e30');
  },
  ice(P, r) {
    P.r(0, 0, 16, 16, '#5d7391');
    P.r(1, 1, 6, 1, '#6d86a6'); P.r(9, 1, 6, 1, '#6d86a6'); P.r(1, 9, 6, 1, '#6d86a6'); P.r(9, 9, 6, 1, '#6d86a6');
    P.r(0, 0, 16, 1, '#475a76'); P.r(0, 8, 16, 1, '#475a76'); P.r(0, 0, 1, 16, '#475a76'); P.r(8, 0, 1, 16, '#475a76');
    for (let i = 0; i < 6; i++) P.p(r() * 16, r() * 16, '#526886');
    if (r() < 0.35) { const x = 1 + r() * 13 | 0, y = 1 + r() * 13 | 0; P.p(x, y, '#c8ecff'); }
  },
  stone(P, r) {
    P.r(0, 0, 16, 16, '#6e6c84');
    P.r(0, 0, 16, 1, '#5a5870'); P.r(0, 0, 1, 16, '#5a5870'); P.r(1, 1, 14, 1, '#82809a');
    for (let i = 0; i < 8; i++) P.p(r() * 16, r() * 16, '#636179');
  },
};
function groundPaint(P, r, g) { (Ground[g] || Ground.grass)(P, r); }
function dfloor(P, r, e) { (e && e.ground === 'ice' ? Ground.ice : Ground.dungeon)(P, r); }
function blob(P, cx, cy, rad, fn) {  // riempie un cerchio chiamando fn(x,y,d)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d < rad) fn(x, y, d);
  }
}

const TilePaint = {
  '.': (P, r) => Ground.grass(P, r),
  ',': (P, r) => {
    Ground.grass(P, r);
    for (let k = 0; k < 3; k++) {
      const x = 3 + (r() * 10 | 0), y = 6 + (r() * 8 | 0), c = '#3c7428';
      P.p(x, y, c); P.p(x - 1, y - 1, c); P.p(x + 1, y - 1, c); P.p(x - 2, y - 2, c); P.p(x + 2, y - 2, c); P.p(x, y - 2, c); P.p(x, y - 3, '#72bd50');
    }
  },
  'F': (P, r, e) => {
    Ground.grass(P, r);
    const cols = [['#f4f0e0', '#f0d040'], ['#f08ab0', '#fff0a0'], ['#a0b8f8', '#ffffff']][e.v % 3];
    for (let k = 0; k < 3; k++) {
      const x = 2 + (r() * 12 | 0), y = 2 + (r() * 11 | 0);
      P.p(x, y + 2, '#3c7428');
      P.p(x, y - 1, cols[0]); P.p(x, y + 1, cols[0]); P.p(x - 1, y, cols[0]); P.p(x + 1, y, cols[0]); P.p(x, y, cols[1]);
    }
  },
  ':': (P, r) => {
    P.r(0, 0, 16, 16, '#c9a66b');
    for (let i = 0; i < 18; i++) P.p(r() * 16, r() * 16, '#b8945a');
    for (let i = 0; i < 8; i++) P.p(r() * 16, r() * 16, '#dcbd85');
    for (let i = 0; i < 2; i++) { const x = r() * 14 | 0, y = r() * 14 | 0; P.r(x, y, 2, 2, '#9a7a48'); P.p(x, y, '#e0c898'); }
  },
  'T': (P, r) => {
    Ground.grass(P, r);
    P.r(3, 13, 10, 3, '#3f7a2b');
    P.r(6, 10, 4, 6, '#6b4423'); P.r(6, 10, 1, 6, '#4a2e16'); P.r(9, 10, 1, 6, '#8a5a30');
    for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, (y - 6.5) * 1.05);
      if (d < 7.6) {
        let col;
        if (d > 6.6) col = '#1c4019';
        else {
          const l = Math.hypot(x - 5, y - 4);
          col = l < 2.5 ? '#6cc055' : l < 5 ? '#45943a' : '#2f6e2a';
          if (r() < 0.12) col = '#24561f';
        }
        P.p(x, y, col);
      }
    }
  },
  '~': (P, r, e) => {
    P.r(0, 0, 16, 16, '#3b6fb0');
    for (let i = 0; i < 6; i++) P.p(r() * 16, r() * 16, '#2f5d99');
    const off = e.f * 3;
    for (const y of [3, 8, 13]) for (let k = 0; k < 2; k++) {
      const x = (k * 8 + off + y * 2) % 16;
      P.r(x, y, 3, 1, '#6c9fd8'); P.p(x + 1, y - 1, '#8cb8e8');
    }
    if (e.f === 1) P.p(r() * 16, r() * 16, '#e0f0ff');
  },
  '=': (P) => {
    P.r(0, 0, 16, 16, '#a87a44');
    for (let x = 0; x < 16; x += 4) { P.r(x, 0, 1, 16, '#7a5428'); P.r(x + 1, 0, 1, 16, '#bc8e56'); }
    P.r(0, 0, 16, 2, '#5e3d1c'); P.r(0, 14, 16, 2, '#5e3d1c');
    for (let x = 2; x < 16; x += 4) { P.p(x, 3, '#4a2e16'); P.p(x, 12, '#4a2e16'); }
  },
  'B': (P, r) => {
    Ground.grass(P, r);
    P.r(2, 12, 12, 3, '#3f7a2b');
    blob(P, 7.5, 7.5, 7.2, (x, y, d) => {
      let col = d > 6.2 ? '#1f4d1c' : (((x * 3 + y * 5) % 7 === 0) ? '#5fb24e' : '#3c8c34');
      if (y < 6 && d < 5 && r() < 0.3) col = '#6cc055';
      if (d <= 6.2 && r() < 0.08) col = '#2a6a26';
      P.p(x, y, col);
    });
  },
  'V': (P, r) => {
    P.r(0, 0, 16, 16, '#3a2a3a');
    for (let i = 0; i < 10; i++) P.p(r() * 16, r() * 16, '#2a1c2c');
    for (let k = 0; k < 6; k++) {
      let x = r() * 16, y = r() * 16, a = r() * 6.28;
      for (let s = 0; s < 16; s++) {
        P.p(x, y, '#5a2f5e'); P.p(x + 1, y, '#7f4a82');
        if (r() < 0.22) P.p(x + (r() < 0.5 ? -1 : 2), y, '#f08ac0');
        a += (r() - 0.5) * 1.2; x = (x + Math.cos(a) + 16) % 16; y = (y + Math.sin(a) + 16) % 16;
      }
    }
  },
  'R': (P) => {
    P.r(0, 0, 16, 16, '#b5473a');
    for (let y = 0; y < 16; y += 4) {
      P.r(0, y, 16, 1, '#c95a4c'); P.r(0, y + 3, 16, 1, '#7e2a22');
      const o = (y / 4) % 2 ? 4 : 0;
      for (let x = o; x < 16; x += 8) P.r(x, y, 1, 3, '#8e352b');
    }
  },
  'H': (P, r, e) => {
    P.r(0, 0, 16, 16, '#e3d2a4');
    for (let i = 0; i < 8; i++) P.p(r() * 16, r() * 16, '#d4c090');
    P.r(0, 0, 16, 2, '#7a5230'); P.r(0, 14, 16, 2, '#8a6a48');
    if (e.v % 2 === 0) {
      P.r(4, 4, 8, 7, '#5a3a20'); P.r(5, 5, 6, 5, '#f0b850'); P.r(5, 5, 6, 1, '#ffe090');
      P.r(7, 5, 1, 5, '#5a3a20'); P.r(5, 7, 6, 1, '#5a3a20');
    } else { P.r(0, 2, 2, 12, '#7a5230'); P.r(14, 2, 2, 12, '#7a5230'); }
  },
  'D': (P, r) => {
    P.r(0, 0, 16, 16, '#e3d2a4'); P.r(0, 0, 16, 2, '#7a5230');
    P.r(3, 3, 10, 13, '#3f2410'); P.r(4, 4, 8, 12, '#7a4a24');
    for (const x of [6, 8, 10]) P.r(x, 4, 1, 12, '#5e3818');
    P.p(10, 10, '#e8c050'); P.r(5, 15, 6, 1, '#2a180a');
  },
  'O': (P, r) => {
    TilePaint.N(P, r);
    P.r(3, 2, 10, 14, '#2a2838'); P.r(4, 3, 8, 13, '#141220');
    P.r(4, 3, 8, 1, '#3a3850'); P.p(5, 4, '#6a6888'); P.p(10, 4, '#6a6888');
  },
  'S': (P, r) => {
    Ground.grass(P, r);
    P.r(7, 9, 2, 7, '#5e3d1c');
    P.r(2, 2, 12, 8, '#5e3d1c'); P.r(3, 3, 10, 6, '#c8995a');
    P.r(4, 4, 8, 1, '#8a6438'); P.r(4, 6, 6, 1, '#8a6438');
  },
  'r': (P, r, e) => {
    groundPaint(P, r, e.ground);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x - 7.5) / 7.2, (y - 8.5) / 6.4);
      if (d < 1) {
        let col = d > 0.86 ? '#3e3e46' : (y < 7 && x < 9 ? '#b5b5bd' : (y > 11 ? '#65656d' : '#8a8a92'));
        if (r() < 0.06) col = '#74747c';
        P.p(x, y, col);
      }
    }
    P.p(9, 7, '#56565e'); P.p(10, 8, '#56565e'); P.p(10, 9, '#56565e');
  },
  'A': (P, r, e) => {
    groundPaint(P, r, e.ground);
    P.r(2, 12, 12, 4, '#4d4a5a'); P.r(3, 12, 10, 1, '#8d8a9a');
    P.r(5, 6, 6, 6, '#8d8a9a'); P.r(9, 6, 2, 6, '#6d6a7a'); P.r(4, 7, 1, 4, '#7d7a8a'); P.r(11, 7, 1, 4, '#5d5a6a');
    blob(P, 8, 3.5, 2.6, (x, y) => P.p(x, y, x > 8 ? '#7d7a8a' : '#a8a6b6'));
    P.r(3, 4, 1, 8, '#9a98a8'); P.p(3, 3, '#c8c8d8');
  },
  'Z': (P, r, e) => {
    dfloor(P, r, e);
    P.r(1, 1, 14, 14, '#120c18');
    const cols = ['#5a5470', '#48425c', '#363048', '#26203a'];
    for (let i = 0; i < 4; i++) P.r(2, 2 + i * 3, 12, 2, cols[i]);
    P.r(1, 1, 14, 1, '#1e1a2c');
  },
  'U': (P, r, e) => {
    dfloor(P, r, e);
    P.r(1, 1, 14, 14, '#26203a');
    const cols = ['#a8a0c8', '#8a82aa', '#6c648c', '#4e466e'];
    for (let i = 0; i < 4; i++) P.r(2, 2 + i * 3, 12, 2, cols[i]);
  },
  'M': (P) => {
    P.r(0, 0, 16, 16, '#3d4a6b');
    for (let y = 0; y < 16; y += 4) {
      P.r(0, y, 16, 1, '#56668f'); P.r(0, y + 3, 16, 1, '#2a3350');
      const o = (y / 4) % 2 ? 0 : 4;
      for (let x = o; x < 16; x += 8) P.r(x, y, 1, 3, '#2a3350');
    }
  },
  'N': (P, r) => {
    P.r(0, 0, 16, 16, '#8d8a9a');
    for (let y = 0; y < 16; y += 4) {
      P.r(0, y + 1, 16, 1, '#a6a3b4'); P.r(0, y, 16, 1, '#5d5a6a');
      const o = (y / 4) % 2 ? 0 : 4;
      for (let x = o; x < 16; x += 8) P.r(x, y, 1, 4, '#5d5a6a');
    }
    for (let i = 0; i < 6; i++) P.p(r() * 16, r() * 16, '#7a7788');
    if (r() < 0.4) { const x = r() * 12 | 0; P.r(x, 2 + (r() * 10 | 0), 3, 1, '#5f8a4a'); }
  },
  'P': (P, r, e) => dfloor(P, r, e),
  'p': (P, r) => Ground.stone(P, r),
  'W': (P, r, e) => {
    if (e && e.ground === 'ice') {   // roccia ghiacciata della grotta
      P.r(0, 0, 16, 16, '#2a3a56');
      for (let k = 0; k < 5; k++) {
        const x = r() * 14 | 0, y = r() * 14 | 0, w = 3 + (r() * 5 | 0), h = 2 + (r() * 3 | 0);
        P.r(x, y, w, h, '#36496a'); P.r(x, y, w, 1, '#4a6288');
      }
      for (let i = 0; i < 5; i++) P.p(r() * 16, r() * 16, '#1c2840');
      if (r() < 0.5) { const x = 2 + r() * 11 | 0, y = 2 + r() * 10 | 0; P.p(x, y, '#bfefff'); P.p(x + 1, y + 1, '#7ac8f0'); }
      return;
    }
    P.r(0, 0, 16, 16, '#2e2a40');
    for (let y = 0; y < 16; y += 4) {
      P.r(0, y + 1, 16, 1, '#3c3854'); P.r(0, y, 16, 1, '#1e1a2c');
      const o = (y / 4) % 2 ? 0 : 4;
      for (let x = o; x < 16; x += 8) P.r(x, y, 1, 4, '#1e1a2c');
    }
    for (let i = 0; i < 4; i++) P.p(r() * 16, r() * 16, '#26223a');
  },
  'Y': (P, r, e) => {
    groundPaint(P, r, e.ground === 'stone' ? 'stone' : 'dungeon');
    P.r(4, 14, 8, 2, 'rgba(0,0,0,0.35)');
    P.r(7, 9, 2, 5, '#3a3a44'); P.r(5, 13, 6, 1, '#3a3a44');
    P.r(3, 6, 10, 3, '#4a4a56'); P.r(3, 6, 10, 1, '#7a7a8a'); P.r(4, 9, 8, 1, '#2a2a34');
  },
  'b': (P, r, e) => {
    dfloor(P, r, e);
    const ice = e && e.ground === 'ice';
    P.r(0, 1, 16, 15, '#1e1a2c'); P.r(1, 1, 14, 13, ice ? '#6a8ab0' : '#6b6585');
    P.r(1, 1, 14, 2, ice ? '#9cc4e8' : '#8c86a8'); P.r(1, 12, 14, 2, ice ? '#46628a' : '#4a4560'); P.r(13, 1, 2, 13, ice ? '#56769c' : '#575170');
    P.p(4, 6, '#57516f'); P.p(10, 8, '#57516f');
  },
  'L': (P, r, e) => {
    TilePaint.W(P, r, e);
    P.r(2, 1, 12, 15, '#1a1420'); P.r(3, 2, 10, 14, '#6a5038');
    P.r(3, 5, 10, 2, '#9a9aaa'); P.r(3, 11, 10, 2, '#9a9aaa');
    P.r(7, 7, 2, 3, '#1a1420'); P.p(6, 8, '#e8c050'); P.p(9, 8, '#e8c050');
  },
  'G': (P, r) => {
    TilePaint.W(P, r);
    P.r(1, 1, 14, 15, '#1a1420'); P.r(2, 2, 12, 14, '#7a1f2a'); P.r(2, 2, 12, 1, '#a83040');
    P.r(2, 2, 1, 14, '#d8a840'); P.r(13, 2, 1, 14, '#d8a840');
    P.r(5, 6, 6, 3, '#d8a840'); P.p(5, 5, '#d8a840'); P.p(8, 4, '#d8a840'); P.p(7, 5, '#d8a840'); P.p(8, 5, '#d8a840'); P.p(10, 5, '#d8a840');
    P.p(7, 7, '#e04050'); P.p(8, 7, '#e04050');
    P.r(7, 11, 2, 3, '#1a1420');
  },
  'w': (P, r) => Ground.wood(P, r),
  'I': (P, r) => {
    P.r(0, 0, 16, 16, '#6a4428');
    for (let x = 0; x < 16; x += 4) { P.r(x, 0, 1, 16, '#52331c'); P.r(x + 1, 0, 1, 16, '#7a5232'); }
    P.r(0, 0, 16, 2, '#3a2412'); P.r(0, 13, 16, 3, '#4a2e16');
  },
  'E': (P, r) => {
    Ground.wood(P, r);
    P.r(1, 2, 14, 13, '#7a2a2a'); P.r(2, 3, 12, 11, '#9a3a3a'); P.r(3, 4, 10, 9, '#7a2a2a');
    P.r(6, 7, 4, 3, '#c8a050');
  },
  't': (P, r) => {
    Ground.wood(P, r);
    P.r(2, 13, 2, 3, '#4a2e16'); P.r(12, 13, 2, 3, '#4a2e16');
    P.r(0, 2, 16, 11, '#3a2412'); P.r(1, 3, 14, 9, '#8a5a2c'); P.r(1, 3, 14, 2, '#b07a40');
    P.r(5, 5, 4, 3, '#e8e0c8'); P.r(10, 6, 2, 2, '#c84a3a');
  },
  'k': (P, r) => {
    P.r(0, 0, 16, 16, '#4a2e16'); P.r(1, 1, 14, 14, '#2a1a0c');
    const bc = ['#b04040', '#4060b0', '#40a050', '#c8a040', '#8050a0', '#d07030'];
    for (const sy of [1, 6, 11]) {
      let x = 1;
      while (x < 15) { const w = 1 + (r() * 2 | 0), h = 3 + (r() * 2 | 0); P.r(x, sy + (4 - h), w, h, bc[r() * bc.length | 0]); x += w + (r() < 0.2 ? 1 : 0); }
      P.r(0, sy + 4, 16, 1, '#6a4428');
    }
  },
  'c': (P, r) => {
    Ground.wood(P, r);
    P.r(0, 3, 16, 12, '#4a2810'); P.r(0, 4, 16, 10, '#7a4a24'); P.r(0, 4, 16, 3, '#a8703a');
    for (let x = 3; x < 16; x += 5) P.r(x, 8, 1, 6, '#5e3818');
  },
  'j': (P, r, e) => {
    groundPaint(P, r, e.ground);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x - 7.5) / 6, (y - 9.5) / 6);
      if (d < 1) P.p(x, y, d > 0.82 ? '#3a1e10' : (x < 7 && y < 9 ? '#d08a50' : '#b06a3a'));
    }
    P.r(5, 2, 6, 3, '#3a1e10'); P.r(6, 3, 4, 1, '#1a0c06');
  },
  'X': (P) => P.r(0, 0, 16, 16, '#0a0710'),

  /* ------------------------- tile del Ciclo 2 ------------------------- */
  'q': (P, r) => {   // ghiaccio liscio: chiaro, con riflessi diagonali
    P.r(0, 0, 16, 16, '#9fd0ec');
    for (let i = 0; i < 10; i++) P.p(r() * 16, r() * 16, '#8cc2e2');
    for (let k = -16; k < 16; k += 9) for (let i = 0; i < 16; i++) { const x = i + k; if (x >= 0 && x < 16 && (i + k) % 3) P.p(x, 15 - i, '#c4e8fa'); }
    P.r(0, 0, 16, 1, '#b8e2f6'); P.r(0, 15, 16, 1, '#7aaed0');
    if (r() < 0.5) { const x = 2 + r() * 10 | 0, y = 2 + r() * 10 | 0; P.p(x, y, '#ffffff'); P.p(x + 1, y, '#e8f8ff'); }
    if (r() < 0.4) { let x = r() * 16, y = r() * 16; for (let k = 0; k < 5; k++) { P.p(x, y, '#7ab0d4'); x += r() < 0.5 ? 1 : -1; y += 1; } }
  },
  'x': (P, r, e) => {   // ciuffo di cristalli di ghiaccio
    if (e && e.ground === 'ice') dfloor(P, r, e); else groundPaint(P, r, e && e.ground);
    P.r(3, 13, 11, 2, 'rgba(0,0,0,0.3)');
    const shard = (x, w, h, c1, c2) => { for (let y = 0; y < h; y++) { const ww = Math.max(1, Math.round(w * (y + 1) / h)); P.r(x - (ww >> 1), 14 - h + y, ww, 1, y < 2 ? '#ffffff' : (y % 2 ? c1 : c2)); } };
    shard(5, 4, 9, '#6ab8e8', '#8ad0f4'); shard(11, 4, 8, '#5aa4d8', '#7ac4ee'); shard(8, 5, 13, '#8ad8ff', '#b0e8ff');
    P.r(8, 3, 1, 8, '#e8faff');
  },
  '^': (P, r, e) => {   // piastra a pressione
    dfloor(P, r, e);
    P.r(2, 2, 12, 12, '#1a1420'); P.r(3, 3, 10, 10, '#8a7a4a'); P.r(3, 3, 10, 1, '#c8b070'); P.r(3, 12, 10, 1, '#5a4a2a');
    P.r(6, 6, 4, 4, '#a89058'); P.p(7, 7, '#e8d898');
  },
  'J': (P, r, e) => {   // saracinesca
    TilePaint.W(P, r, e);
    P.r(1, 0, 14, 16, '#14101c');
    for (let x = 2; x < 15; x += 3) { P.r(x, 0, 2, 16, '#6a6a7a'); P.r(x, 0, 1, 16, '#9a9aac'); }
    P.r(1, 4, 14, 2, '#4a4a5a'); P.r(1, 11, 14, 2, '#4a4a5a');
    P.p(3, 14, '#c8c8d8'); P.p(12, 14, '#c8c8d8');
  },
  'Q': (P, r, e) => {   // crepa: masso incrinato (all'aperto) o parete incrinata (al chiuso)
    const g = e && e.ground;
    if (g === 'ice' || g === 'dungeon') TilePaint.W(P, r, e);
    else {
      groundPaint(P, r, g);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const d = Math.hypot((x - 7.5) / 7.6, (y - 8.5) / 7);
        if (d < 1) P.p(x, y, d > 0.86 ? '#3a3238' : (y < 7 && x < 9 ? '#a8a0a0' : (y > 11 ? '#5e5658' : '#807878')));
      }
    }
    const cc = g === 'ice' ? '#0c1424' : '#120c14', hl = g === 'ice' ? '#9ad0f0' : g === 'dungeon' ? '#8a84a8' : '#d8d0d0';
    let x = 7, y = 1;
    for (let k = 0; k < 14; k++) {
      P.p(x - 1, y, hl); P.p(x, y, cc); P.p(x + 1, y, cc); P.p(x + 2, y, '#000000'); y++; x += [-1, 0, 1, 0, 1][(k * 7 + 3) % 5];
      if (k === 4) for (let j = 1; j < 6; j++) { P.p(x - j, y + (j >> 1), cc); P.p(x - j, y + (j >> 1) - 1, hl); }
      if (k === 9) for (let j = 1; j < 5; j++) { P.p(x + 1 + j, y - (j >> 1), cc); P.p(x + 1 + j, y - (j >> 1) - 1, hl); }
    }
    P.r(3, 13, 3, 2, cc); P.r(11, 2, 2, 2, cc);
  },
  'K': (P, r) => {   // parete rocciosa (all'aperto)
    P.r(0, 0, 16, 16, '#6a5e58');
    for (let k = 0; k < 6; k++) {
      const x = r() * 13 | 0, y = r() * 13 | 0, w = 3 + (r() * 6 | 0), h = 2 + (r() * 4 | 0);
      P.r(x, y, w, h, '#7e726a'); P.r(x, y, w, 1, '#9a8e84'); P.r(x, y + h, w, 1, '#4a403c');
    }
    for (let i = 0; i < 8; i++) P.p(r() * 16, r() * 16, '#564c48');
    if (r() < 0.5) { const x = r() * 12 | 0; P.r(x, 0, 4, 1, '#5f8a4a'); P.p(x + 1, 1, '#4f7a3a'); }
  },
  'C': (P, r) => {   // ingresso di una grotta
    TilePaint.K(P, r);
    for (let y = 2; y < 16; y++) for (let x = 1; x < 15; x++) {
      const d = Math.hypot((x - 7.5) / 6.4, (y - 16) / 13.5);
      if (d < 1) P.p(x, y, d > 0.86 ? '#2a2420' : (d > 0.66 ? '#120e10' : '#050306'));
    }
    P.p(5, 6, '#bfefff'); P.p(10, 7, '#9ad8f8'); P.p(4, 3, '#9ad8f8');
  },
};

const _tileCache = new Map();
function tileCanvas(ch, v, f, ground) {
  const key = ch + '|' + v + '|' + f + '|' + ground;
  let c = _tileCache.get(key);
  if (c) return c;
  const P = painter(16, 16);
  const fn = TilePaint[ch];
  const r = mulberry32(v * 7919 + ch.charCodeAt(0) * 131 + 17);
  if (fn) fn(P, r, { v, f, ground });
  else P.r(0, 0, 16, 16, '#ff00ff');
  _tileCache.set(key, P.c);
  return P.c;
}
function renderRoomBg(tiles, ground, seed, target) {   // target: tela da riusare (Ciclo 10, vedi Game.redrawBg)
  const c = target || makeCanvas(PLAY_W, PLAY_H), x = c.getContext('2d');
  if (target) x.clearRect(0, 0, PLAY_W, PLAY_H);
  for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    const ch = tiles[ty][tx];
    x.drawImage(tileCanvas(ch, hash2(tx, ty, seed) % 4, 0, ground), tx * TS, ty * TS);
  }
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let ty = 1; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
    const ch = tiles[ty][tx], up = tiles[ty - 1][tx];
    if (!TILE_SOLID.has(ch) && ch !== '_' && CASTS_SHADOW.has(up)) x.fillRect(tx * TS, ty * TS, TS, 3);
  }
  if (typeof drawPitEdges === 'function') drawPitEdges(x, tiles);   // Ciclo 3 (gfx3.js)
  return c;
}
function drawFlame(c, x, y, t) {
  const fl = Math.sin(t * 0.31) + Math.sin(t * 0.53 + 1);
  c.fillStyle = '#e03a18'; c.fillRect(x - 3, y - 4, 6, 4);
  c.fillStyle = '#f89820'; c.fillRect(x - 2, y - 6 - (fl > 0 ? 1 : 0), 4, 6);
  c.fillStyle = '#fff080'; c.fillRect(x - 1, y - 4 - (fl > 0.6 ? 1 : 0), 2, 3);
  if (fl > 1.2) { c.fillStyle = '#f89820'; c.fillRect(x + (t % 3) - 1, y - 9, 1, 1); }
}

/* =========================== SPRITE =========================== */
const HUM_BASE = [
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhsssshho...',
  '...ohsessesho...',
  '...oossssssoo...',
  '....oxxxxxxo....',
  '...occxxxxcco...',
  '..osccccccccso..',
  '..osdccccccdso..',
  '...odddxxdddo...',
  '....oppppppo....',
  '....oppooppo....',
  '....obboobbo....',
  '................',
];
function withRows(base, map) { const r = base.slice(); for (const k in map) r[k] = map[k]; return r; }
const LEGS_B = { 13: '....obbooppo....', 14: '.....oo.obbo....' };
const HUM = {
  downA: HUM_BASE,
  downB: withRows(HUM_BASE, LEGS_B),
  upA: withRows(HUM_BASE, { 4: '...ohhhhhhhho...', 5: '...ohhhhhhhho...', 6: '...oohhhhhhoo...', 8: '...occcxxccco...' }),
  sideA: withRows(HUM_BASE, {
    4: '...ohhhhhssso...', 5: '...ohhhhsseso...', 6: '...oohhhsssso...', 7: '..xxoxxxxxxo....',
    8: '....occxxcco....', 9: '....occccsco....', 10: '....odcccsdo....', 11: '....oddxxddo....',
  }),
};
HUM.upB = withRows(HUM.upA, LEGS_B);
HUM.sideB = withRows(HUM.sideA, { 13: '.....opppo......', 14: '.....obbbo......' });
const BEARD = { 6: '...oohhhhhhoo...', 7: '....ohhhhhho....', 8: '...occhhhhcco...' };

const HUM_PAL_BASE = { o: '#1a1420', e: '#1a1420' };
const PEOPLE = {
  hero:      { h: '#7a4a2a', s: '#f2c8a0', x: '#d83a3a', c: '#3a6ec8', d: '#2a4e94', p: '#5a4030', b: '#3a2418' },
  elder:     { h: '#e8e8f0', s: '#e8b890', x: '#8a5ab8', c: '#6a3a98', d: '#4a2a70', p: '#4a2a70', b: '#3a2418', beard: true },
  merchant:  { h: '#3a2a1a', s: '#d8a070', x: '#e8c050', c: '#3a8a4a', d: '#2a6a38', p: '#6a4a2a', b: '#3a2418' },
  fisherman: { h: '#c86a2a', s: '#f0c098', x: '#e8e0c8', c: '#d8b040', d: '#a07a28', p: '#3a4a6a', b: '#2a2a2a' },
  hermit:    { h: '#9a9aa0', s: '#d8b088', x: '#5a7a3a', c: '#7a6a4a', d: '#5a4a32', p: '#5a4a32', b: '#3a2a1a', beard: true },
  kid:       { h: '#e8c050', s: '#f8d0b0', x: '#40a0a0', c: '#e87a3a', d: '#b85a22', p: '#3a5a8a', b: '#3a2418' },
  woman:     { h: '#5a2a1a', s: '#f0c0a0', x: '#f0f0e0', c: '#b04a6a', d: '#80304a', p: '#80304a', b: '#3a2418' },
  skeleton:  { h: '#dcdcc8', s: '#dcdcc8', e: '#d02020', x: '#6a6a6a', c: '#c0c0ac', d: '#7a7a6a', p: '#a8a898', b: '#5a5a52', o: '#2a2420' },
};
function buildHumanoid(pal) {
  const P = Object.assign({}, HUM_PAL_BASE, pal);
  const mk = rows => spriteFromRows(pal.beard ? withRows(rows, BEARD) : rows, P);
  const dA = mk(HUM.downA), dB = mk(HUM.downB), uA = spriteFromRows(HUM.upA, P), uB = spriteFromRows(HUM.upB, P);
  const sA = spriteFromRows(HUM.sideA, P), sB = spriteFromRows(HUM.sideB, P);
  const lA = mirrorCanvas(sA), lB = mirrorCanvas(sB);
  return { down: [dA, dB, dA, mirrorCanvas(dB)], up: [uA, uB, uA, mirrorCanvas(uB)], right: [sA, sB, sA, sB], left: [lA, lB, lA, lB] };
}

const SLIME_ROWS = [
  '................', '................', '................', '................', '................',
  '......oooo......',
  '....oollggoo....',
  '...olllgggggo...',
  '..olwlgggggggo..',
  '..oggggggggggo..',
  '.ogggeggggegggo.',
  '.oggggggggggggo.',
  '.odggggggggggdo.',
  '..oddddddddddo..',
  '...oooooooooo...',
  '................',
];
const BAT_A = [
  '................', '................', '................', '................',
  '.o............o.',
  '.oo..........oo.',
  '.owo..o..o..owo.',
  '.owwo.oooo.owwo.',
  '.owwwoqqqqowwwo.',
  '..owwoqrrqowwo..',
  '....ooqqqqoo....',
  '......oqqo......',
  '.......oo.......',
  '................', '................', '................',
];
const BAT_B = [
  '................', '................', '................', '................', '................', '................',
  '......o..o......',
  '......oooo......',
  '....ooqqqqoo....',
  '..oowoqrrqowoo..',
  '.owwwoqqqqowwwo.',
  '.oww..oqqo..wwo.',
  '.oo....oo....oo.',
  '................', '................', '................',
];
const PLANT_ROWS = [
  '................', '................',
  '......oooo......',
  '.....orrrro.....',
  '....orrrrrro....',
  '...orrkkkkrro...',
  '...orkkkkkkro...',
  '...orrkkkkrro...',
  '....orrrrrro....',
  '.....orrrro.....',
  '..oo..oggo..oo..',
  '.ollo.oggo.ollo.',
  '.olllooggoolllo.',
  '..ollllggllllo..',
  '...oooooooooo...',
  '................',
];
const CHEST_CLOSED = [
  '................', '................',
  '..oooooooooooo..',
  '.ollllllllllllo.',
  '.ollllllllllllo.',
  '.oddddyyyyddddo.',
  '.ooooooyyoooooo.',
  '.obbbbbykybbbbo.',
  '.obbbbbyyybbbbo.',
  '.obbbbbbbbbbbbo.',
  '.oddddddddddddo.',
  '.oyddddddddddyo.',
  '..oooooooooooo..',
  '................', '................', '................',
];
const CHEST_OPEN = withRows(CHEST_CLOSED, {
  0: '..oooooooooooo..', 1: '.oddddddddddddo.', 2: '.oddddddddddddo.', 3: '.oooooooooooooo.',
  4: '.okkkkkkkkkkkko.', 5: '.okkkkkkkkkkkko.',
});

/* --- Icone (HUD e oggetti raccolti) --- */
const ICON_ROWS = {
  heart: ['.oo.oo.', 'owrorro', 'owrrrro', 'orrrrro', '.orrro.', '..oro..', '...o...'],
  gem: ['..ooo..', '.owggo.', 'owgggdo', 'ogggddo', '.ogddo.', '..odo..', '...o...'],
  key: ['..ooo...', '.oyyyo..', '.oy.yo..', '.oyyyo..', '..oyo...', '..oyo...', '..oyyo..', '..oyo...', '..oyyo..', '...oo...'],
  bigkey: ['.oooooo.', 'oyyrryyo', 'oyo..oyo', 'oyyrryyo', '.oooyyo.', '...oyyo.', '...oyyoo', '...oyyyo', '...oyyo.', '...oyyoo', '...oyyyo', '...oooo.'],
  sword: ['...oo...', '..owlo..', '..owlo..', '..owlo..', '..owlo..', '..owlo..', 'oooyyooo', 'oyyyyyyo', '..obbo..', '..oyyo..', '...oo...'],
  lantern: ['...oo...', '..o..o..', '.oooooo.', '.oyffyo.', '.oyffyo.', '.oyffyo.', '.oooooo.', '..oyyo..', '..oooo..'],
  potion: ['..oooo..', '..obbo..', '...oo...', '..owpo..', '.owpppo.', 'opwppppo', 'oppppppo', '.oppppo.', '..oooo..'],
  hook: ['...oo...', '..oyyo..', '...oyo..', '....oyo.', '....oyo.', '.o..oyo.', 'oyo.oyo.', 'oyyooyo.', '.oyyyo..', '..ooo...'],
  bombs: ['.....f.', '....fo.', '...oo..', '.oooo..', 'obbwbo.', 'obwbbbo', 'obbbbbo', 'obbbbbo', '.obbbo.', '..ooo..'],
  bigbag: ['..oooo..', '.oyyyyo.', '..oyyo..', '.obbbbo.', 'obbwbbbo', 'obwbbbbo', 'obbbbbbo', 'obbbbbbo', '.obbbbo.', '..oooo..'],
};
const ICON_PAL = {
  heart: { o: '#2a0a14', r: '#e83850', w: '#ffb0b8' },
  heartEmpty: { o: '#2a0a14', r: '#4a3442', w: '#5a4452' },
  container: { o: '#3a0a24', r: '#ff70b0', w: '#ffffff' },
  gem: { o: '#0a2a14', w: '#d0ffd8', g: '#40d070', d: '#20904a' },
  gem5: { o: '#0a142a', w: '#d8e8ff', g: '#4890ff', d: '#2050c0' },
  key: { o: '#2a1a00', y: '#f0c840' },
  bigkey: { o: '#2a1a00', y: '#f0a030', r: '#e03040' },
  sword: { o: '#1a1420', w: '#ffffff', l: '#a8d0f0', y: '#e8c050', b: '#7a4a24' },
  lantern: { o: '#1a1420', y: '#c08a30', f: '#fff0a0' },
  potion: { o: '#1a1420', b: '#8a5a2c', w: '#ffffff', p: '#e04a8a' },
  hook: { o: '#2a1a00', y: '#f0c840' },
  bombs: { o: '#0a0814', b: '#3a3a5a', w: '#a8a8d0', f: '#ffb040' },
  bigbag: { o: '#2a1a0a', y: '#e8c050', b: '#8a5a2c', w: '#c89a5c' },
};

const SPR = {}, ICON = {};
function makeBossFrame(f) {
  const P = painter(32, 32);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 14; i++) {
      const x = 16 + side * (9 + i * 0.55), y = 20 + Math.sin(i * 0.6 + f * 1.6) * 3 + i * 0.35;
      P.r(x | 0, y | 0, 2, 2, '#1e3a1c');
      if (i % 3 === 0) P.p(x + side * 2, y - 1, '#f08ac0');
    }
  }
  for (let y = 6; y < 32; y++) for (let x = 0; x < 32; x++) {
    const dx = (x - 15.5) / 11, dy = (y - 19) / 10, d = dx * dx + dy * dy;
    if (d <= 1) {
      let col = d > 0.78 ? '#120f18' : (y < 14 ? '#4f7a3a' : (((x * 7 + y * 3) % 9) === 0 ? '#24401f' : '#33582c'));
      if (d > 0.78 && (x + y + f) % 5 === 0) col = '#f08ac0';
      P.p(x, y, col);
    }
  }
  for (const [ax, ay] of [[4, 12], [27, 12], [6, 27], [25, 27], [16, 30]]) { P.p(ax, ay, '#f08ac0'); P.p(ax, ay - 1, '#c05a90'); }
  P.r(9, 8, 14, 2, '#d8a840'); P.r(9, 9, 14, 1, '#a07820');
  for (const s of [9, 12, 16, 20, 23]) {
    const hgt = s === 16 ? 6 : 4;
    for (let h = 0; h < hgt; h++) P.r(s - (h < 2 ? 1 : 0), 7 - h, h < 2 ? 2 : 1, 1, '#e8c050');
  }
  P.p(16, 4, '#e83850'); P.p(16, 8, '#e83850');
  const glow = f ? '#ffe070' : '#ff9030';
  P.r(10, 15, 5, 3, '#050308'); P.r(18, 15, 5, 3, '#050308');
  P.r(11, 16, 2, 1, glow); P.r(19, 16, 2, 1, glow);
  for (let x = 11; x <= 21; x++) { P.p(x, 23 + (x % 2), '#0a0810'); if (x % 2 === 0) P.p(x, 22 + f, '#e8e0c8'); }
  return P.c;
}
function makeCrystal() {
  const P = painter(12, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 12; x++) {
    const d = Math.abs(x - 5.5) / 6 + Math.abs(y - 7.5) / 8;
    if (d <= 1) P.p(x, y, d > 0.82 ? '#5a1a4a' : (x < 6 ? (y < 8 ? '#ffd8f4' : '#f080c0') : (y < 8 ? '#f8a8dc' : '#c04090')));
  }
  P.p(3, 5, '#fff'); P.p(4, 4, '#fff'); P.p(4, 6, '#fff');
  return P.c;
}
function buildGfx() {
  SPR.people = {};
  for (const k in PEOPLE) SPR.people[k] = buildHumanoid(PEOPLE[k]);
  SPR.hero = SPR.people.hero;
  const slimePal = { o: '#0e2a10', g: '#4cc04a', l: '#9cf08a', w: '#ffffff', e: '#0e2a10', d: '#2a8a30' };
  const slimeBlue = { o: '#0a1430', g: '#4a7af0', l: '#9cc0ff', w: '#ffffff', e: '#0a1430', d: '#2a4ab0' };
  SPR.slime = spriteFromRows(SLIME_ROWS, slimePal);
  SPR.slimeBlue = spriteFromRows(SLIME_ROWS, slimeBlue);
  const batPal = { o: '#120a18', w: '#5a3a7a', q: '#3a2450', r: '#ff4040' };
  SPR.bat = [spriteFromRows(BAT_A, batPal), spriteFromRows(BAT_B, batPal)];
  const plantPal = { o: '#1a0a14', r: '#d84a6a', k: '#3a0a1a', g: '#3a8a30', l: '#4cb040' };
  SPR.plant = [spriteFromRows(PLANT_ROWS, plantPal),
    spriteFromRows(withRows(PLANT_ROWS, { 4: '....orkkkkro....', 8: '....orkkkkro....' }), plantPal)];
  const chestPal = { o: '#1a1420', l: '#b0783c', d: '#6a4220', b: '#8a5a2c', y: '#e8c050', k: '#1a1420' };
  SPR.chest = [spriteFromRows(CHEST_CLOSED, chestPal), spriteFromRows(CHEST_OPEN, chestPal)];
  SPR.boss = [makeBossFrame(0), makeBossFrame(1)];
  SPR.crystal = makeCrystal();

  ICON.heart = spriteFromRows(ICON_ROWS.heart, ICON_PAL.heart);
  ICON.heartEmpty = spriteFromRows(ICON_ROWS.heart, ICON_PAL.heartEmpty);
  const hh = makeCanvas(7, 7), hx = hh.getContext('2d');
  hx.drawImage(ICON.heartEmpty, 0, 0); hx.save(); hx.beginPath(); hx.rect(0, 0, 4, 7); hx.clip(); hx.drawImage(ICON.heart, 0, 0); hx.restore();
  ICON.heartHalf = hh;
  ICON.container = spriteFromRows(ICON_ROWS.heart, ICON_PAL.container);
  ICON.gem = spriteFromRows(ICON_ROWS.gem, ICON_PAL.gem);
  ICON.gem5 = spriteFromRows(ICON_ROWS.gem, ICON_PAL.gem5);
  for (const k of ['key', 'bigkey', 'sword', 'lantern', 'potion', 'hook', 'bombs', 'bigbag']) ICON[k] = spriteFromRows(ICON_ROWS[k], ICON_PAL[k]);
  ICON.bomb = ICON.bombs;
  buildGfx2();   // sprite del Ciclo 2 (js/gfx2.js)
  buildGfx3();   // sprite del Ciclo 3 (js/gfx3.js)
  ICON.gems = ICON.gem5;
  ICON.crystal = SPR.crystal;
}
