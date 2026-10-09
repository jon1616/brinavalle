'use strict';
/* =====================================================================
 *  CICLO 51 — rifinitura: la Conca col touch e col gamepad.   T51.suite()  (con ?test)
 *  Mentre Lio suona, le direzioni sono note: in diagonale la levetta ne suonava due insieme.
 * ===================================================================== */
const T51 = {
  /* un gamepad finto con la levetta inclinata (ax, ay) */
  pad(ax, ay, song) {
    const gp0 = navigator.getGamepads, song0 = Game.song;
    const fake = { buttons: [], axes: [ax, ay] };
    try {
      navigator.getGamepads = () => [fake];
      Game.song = song ? { buf: [], t: 0 } : null;
      Input.virt = new Set(); Input.pressed.clear(); Input.poll();
      return [...Input.pressed].filter(a => ['up', 'down', 'left', 'right'].includes(a)).sort().join('+');
    } finally { navigator.getGamepads = gp0; Game.song = song0; Input.virt = new Set(); Input.pressed.clear(); }
  },
  /* la levetta touch vera, con eventi del puntatore, spinta in direzione (dx, dy) */
  stick(dx, dy, song) {
    const root = document.getElementById('touch'), stick = document.getElementById('stick'), spc = stick.setPointerCapture, wasHidden = root.hidden, wasTouch = document.body.classList.contains('touchmode'), song0 = Game.song;
    try {
      root.hidden = false; document.body.classList.add('touchmode');
      stick.setPointerCapture = () => {};   // un puntatore sintetico non si può «catturare»: il browser lancerebbe un errore prima della levetta
      Game.song = song ? { buf: [], t: 0 } : null;
      const r = stick.getBoundingClientRect(), m = r.width / 2;
      if (!m) return 'levetta senza dimensioni';
      const at = (x, y, type) => stick.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: r.left + m + x, clientY: r.top + m + y, bubbles: true }));
      at(dx * m * 0.8, dy * m * 0.8, 'pointerdown');
      const dirs = [...Input.touch].filter(a => ['up', 'down', 'left', 'right'].includes(a)).sort().join('+');
      at(0, 0, 'pointerup');
      return dirs;
    } finally { stick.setPointerCapture = spc; Input.touch.clear(); root.hidden = wasHidden; if (!wasTouch) document.body.classList.remove('touchmode'); Game.song = song0; }
  },
  suite() {
    const res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Gamepad: in diagonale si cammina in 8 direzioni, ma col canto la levetta dà UNA nota (l\'asse dominante)', () => {
      const walk = T51.pad(0.8, -0.75, false), a = T51.pad(0.8, -0.75, true), b = T51.pad(0.6, -0.9, true), c = T51.pad(0, 0.9, true);
      return walk === 'right+up' && a === 'right' && b === 'up' && c === 'down' ? true : [walk, a, b, c].join(' / ');
    });
    check('Touch: la levetta vera (eventi del puntatore) in diagonale cammina in 8 direzioni, ma col canto dà UNA nota', () => {
      const walk = T51.stick(0.7, -0.7, false), a = T51.stick(0.75, -0.65, true), b = T51.stick(-0.6, 0.8, true), c = T51.stick(-1, 0, true);
      return walk === 'right+up' && a === 'right' && b === 'down' && c === 'left' ? true : [walk, a, b, c].join(' / ');
    });
    Game.state = 'title';
    console.table(res);
    return res;
  },
};
window.T51 = T51;
