'use strict';
/* =====================================================================
 *  GFX2 — sprite aggiunti nel Ciclo 2 (Grotta di Brina):
 *  Golem di Brina, lame di ghiaccio, slime/pipistrelli di ghiaccio,
 *  blocchi spingibili, bombe, fata. Tutto procedurale come in gfx.js.
 * ===================================================================== */

function makeGolemFrame(f, cracked) {
  const P = painter(32, 32);
  const body = cracked ? ['#5a7a9a', '#3e5a7a', '#86a8c8'] : ['#7ab0d8', '#4f84b0', '#c0e4fa'];
  // gambe
  for (const lx of [9, 19]) {
    const ly = 25 + (f && lx === 9 ? -1 : 0) + (!f && lx === 19 ? -1 : 0);
    P.r(lx - 1, ly - 1, 6, 7, '#101828'); P.r(lx, ly, 4, 5, body[1]); P.r(lx, ly, 4, 1, body[2]);
  }
  // busto (ellisse squadrata di blocchi di ghiaccio)
  for (let y = 6; y < 27; y++) for (let x = 3; x < 29; x++) {
    const dx = (x - 15.5) / 12.5, dy = (y - 16) / 10.5, d = Math.pow(Math.abs(dx), 2.6) + Math.pow(Math.abs(dy), 2.6);
    if (d <= 1) {
      let col = d > 0.72 ? '#101828' : (y < 11 ? body[2] : ((x + (y >> 2)) % 7 === 0 || y % 6 === 0 ? body[1] : body[0]));
      P.p(x, y, col);
    }
  }
  // braccia massicce
  for (const s of [-1, 1]) {
    const ax = s < 0 ? 0 : 26, ay = 13 + (f ? (s < 0 ? 1 : -1) : 0);
    P.r(ax, ay, 6, 11, '#101828'); P.r(ax + 1, ay + 1, 4, 9, body[0]); P.r(ax + 1, ay + 1, 4, 2, body[2]);
    P.r(ax + 1, ay + 8, 4, 2, body[1]);
  }
  // cristalli sulle spalle
  for (const [sx, h] of [[8, 5], [11, 7], [21, 6], [24, 4]]) {
    for (let k = 0; k < h; k++) P.r(sx - (k > 1 ? 1 : 0), 8 - k, k > 1 ? 2 : 1, 1, k === h - 1 ? '#ffffff' : '#a8e0ff');
  }
  // occhi
  const eye = cracked ? '#ff6a8a' : (f ? '#e8ffff' : '#7af0ff');
  P.r(10, 12, 4, 3, '#06080e'); P.r(18, 12, 4, 3, '#06080e');
  P.r(11, 13, 2, 1, eye); P.r(19, 13, 2, 1, eye);
  // nucleo nel petto
  if (cracked) {
    P.r(13, 17, 6, 6, '#2a0a18'); P.r(14, 18, 4, 4, '#ff4a7a'); P.r(15, 18, 2, 2, '#ffd0e0');
    for (const [x, y] of [[12, 16], [11, 15], [19, 23], [20, 24], [12, 23], [20, 16], [21, 15], [10, 24]]) P.p(x, y, '#101828');
  } else {
    P.r(13, 17, 6, 6, '#16304a'); P.r(14, 18, 4, 4, '#3a8ac8'); P.p(15, 19, '#a8e8ff');
  }
  return P.c;
}

function makeBladeTrap(f) {
  const P = painter(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 7.5, dy = y - 7.5, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy);
    const spike = 4.2 + Math.max(0, Math.cos(a * 4 + f * 0.4)) * 3.6;
    if (d < spike) P.p(x, y, d > spike - 1.2 ? '#0e1a2a' : (dy < -1 && dx < 1 ? '#e0f6ff' : (d < 3 ? '#5a7a9a' : '#9ad0f0')));
  }
  P.r(5, 6, 6, 4, '#0e1a2a'); P.r(6, 7, 4, 2, f ? '#ff5050' : '#c02838'); P.p(7, 7, '#ffd0d0');
  return P.c;
}

function makeBlockSprite() {   // blocco spingibile: pietra scolpita con runa e frecce
  const P = painter(16, 16);
  P.r(0, 1, 16, 15, '#141020'); P.r(1, 1, 14, 13, '#7a8aa8'); P.r(1, 1, 14, 2, '#a8b8d4'); P.r(1, 12, 14, 2, '#4e5a76'); P.r(13, 3, 2, 9, '#5e6a88');
  P.r(3, 4, 10, 7, '#6a7a98'); P.r(3, 4, 10, 1, '#5a6886');
  // runa: quattro frecce verso l'esterno
  const c = '#c8e8ff';
  P.p(8, 5, c); P.r(7, 6, 3, 1, c); P.p(8, 9, c); P.r(7, 8, 3, 1, c);
  P.p(4, 7, c); P.r(5, 6, 1, 3, c); P.p(12, 7, c); P.r(11, 6, 1, 3, c);
  P.p(2, 2, '#e8f4ff');
  return P.c;
}

function makeBombSprite(lit) {
  const P = painter(12, 13);
  for (let y = 0; y < 13; y++) for (let x = 0; x < 12; x++) {
    const d = Math.hypot(x - 5.5, y - 7.5);
    if (d < 5.3) P.p(x, y, d > 4.4 ? '#06040c' : (x < 5 && y < 7 ? '#5a5a88' : '#2e2e4a'));
  }
  P.p(3, 5, '#c8c8f0'); P.p(4, 4, '#a8a8d8');
  P.r(5, 1, 2, 2, '#4a4a5a'); P.p(7, 0, '#8a6a4a');
  if (lit) { P.p(8, 0, '#fff080'); P.p(7, 0, '#ffb040'); }
  return P.c;
}

function buildGfx2() {
  SPR.golem = [makeGolemFrame(0, false), makeGolemFrame(1, false)];
  SPR.golemCracked = [makeGolemFrame(0, true), makeGolemFrame(1, true)];
  SPR.blade = [makeBladeTrap(0), makeBladeTrap(1)];
  SPR.block = makeBlockSprite();
  SPR.bomb = [makeBombSprite(false), makeBombSprite(true)];
  SPR.slimeIce = spriteFromRows(SLIME_ROWS, { o: '#0a1a2a', g: '#b8e8ff', l: '#ffffff', w: '#ffffff', e: '#0a1a2a', d: '#6ab0e0' });
  const icePal = { o: '#0a1424', w: '#5a9ac8', q: '#2a5a8a', r: '#c8f8ff' };
  SPR.batIce = [spriteFromRows(BAT_A, icePal), spriteFromRows(BAT_B, icePal)];
  ICON.bombpack = ICON.bombs;
}

/* piccola fata luminosa, disegnata al volo (x,y = centro) */
function drawFairy(c, x, y, t) {
  const fl = (t >> 2) % 2;
  c.fillStyle = 'rgba(255,200,240,0.18)'; c.beginPath(); c.arc(x, y, 11 + Math.sin(t * 0.1) * 2, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,230,250,0.35)'; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
  // ali
  c.fillStyle = 'rgba(210,240,255,0.85)';
  const w = fl ? 5 : 3;
  c.fillRect(x - 2 - w, y - 4, w, 4); c.fillRect(x + 2, y - 4, w, 4);
  c.fillRect(x - 1 - w, y, w - 1, 3); c.fillRect(x + 2, y, w - 1, 3);
  // corpo
  c.fillStyle = '#ffb0e0'; c.fillRect(x - 1, y - 2, 3, 5);
  c.fillStyle = '#fff4e0'; c.fillRect(x - 1, y - 5, 3, 3);
  c.fillStyle = '#ffffff'; c.fillRect(x, y - 4, 1, 1);
}
