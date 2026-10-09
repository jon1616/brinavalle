'use strict';
/* =====================================================================
 *  CICLO 29 — strumenti per GIOCARE A MANO dalla console, sulla pagina normale.
 *  Si carica con  index.html?hand  (salvataggi e medaglie VERI: puliscili alla fine con H.clean()).
 *  I tasti sono eventi keydown/keyup veri, tenuti premuti per un tempo reale.
 *    H.drive()           fa girare il gioco a 60 fps con un timer (serve se il pannello del browser è nascosto:
 *                        lì requestAnimationFrame è sospeso e il gioco resta fermo)
 *    await H.hold('ArrowUp', 500)          tieni premuto un tasto (codici KeyboardEvent.code)
 *    await H.seq([['ArrowUp', 300], ['Space', 80]])
 *    await H.goTo('x', 120)                cammina fino a quella coordinata (≈ 75 px al secondo)
 *    await H.talk()      legge e chiude il dialogo aperto, una pagina alla volta (ritorna il testo)
 *    await H.fight(40)   si avvicina al nemico più vicino e colpisce (tattica grezza: muori spesso!)
 *    H.st()              stanza, vita, posizione, dialogo, nemici
 *    H.hurt              registro dei colpi subiti (stanza, vita prima→dopo, chi)
 *    H.clean()           ferma il timer e cancella salvataggio e medaglie scritte dalla prova
 * ===================================================================== */
const H = {
  hurt: [],
  hold(code, ms) { return new Promise(r => { dispatchEvent(new KeyboardEvent('keydown', { code })); setTimeout(() => { dispatchEvent(new KeyboardEvent('keyup', { code })); setTimeout(r, 60); }, ms); }); },
  async seq(steps) { for (const [c, ms] of steps) await H.hold(c, ms); return H.st(); },
  async goTo(axis, v) {
    const p = Game.player, c = axis === 'x' ? p.cx() : p.cy(), d = v - c;
    if (Math.abs(d) >= 2) await H.hold(axis === 'x' ? (d > 0 ? 'ArrowRight' : 'ArrowLeft') : (d > 0 ? 'ArrowDown' : 'ArrowUp'), Math.round(Math.abs(d) / 75 * 1000));
    return H.st();
  },
  async talk() {
    const seen = [];
    for (let i = 0; i < 30 && Game.dialog; i++) { const d = Game.dialog; seen.push((d.speaker ? d.speaker + ': ' : '') + (d.pages[d.pageIdx] || []).join(' ')); await H.hold('Space', 60); await new Promise(r => setTimeout(r, 650)); }
    return [...new Set(seen)].join('\n');
  },
  async fight(max) {
    for (let i = 0; i < (max || 40); i++) {
      const p = Game.player, foes = Game.entities.filter(e => e.enemy && !e.dead && !e.ignoreClear && !(e instanceof BladeTrap));
      if (!foes.length || Game.state !== 'play') return 'fine';
      if (Game.dialog) { await H.hold('Space', 60); continue; }
      foes.sort((a, b) => Math.hypot(a.cx() - p.cx(), a.cy() - p.cy()) - Math.hypot(b.cx() - p.cx(), b.cy() - p.cy()));
      const f = foes[0], dx = f.cx() - p.cx(), dy = f.cy() - p.cy();
      const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
      if (Math.hypot(dx, dy) < 22) { await H.hold(k, 40); await H.hold('Space', 60); await new Promise(r => setTimeout(r, 200)); }
      else await H.hold(k, 160);
    }
    return 'passi finiti';
  },
  st() {
    const p = Game.player;
    if (!p || Game.state === 'title' || Game.state === 'prologue') return Game.state;
    return Game.state + ' ' + Game.roomId + ' hp ' + Game.s.hp + ' p ' + Math.round(p.cx()) + ',' + Math.round(p.cy()) + (Game.dialog ? ' DLG ' + (Game.dialog.pages[Game.dialog.pageIdx] || []).join(' ') : '') +
      ' nemici ' + Game.entities.filter(e => e.enemy && !e.dead).map(e => e.constructor.name + '@' + Math.round(e.cx()) + ',' + Math.round(e.cy())).join(' ');
  },
  drive() {
    if (H.timer) return 'già attivo';
    H.timer = setInterval(() => { Input.poll(); try { Game.update(); } catch (e) { console.error(e); } Input.endFrame(); }, 1000 / 60);
    H.timerR = setInterval(() => { try { Game.render(); } catch (e) {} }, 100);
    return 'il gioco gira a 60 fps col timer (non usarlo se il pannello è visibile: andrebbe al doppio)';
  },
  clean() {
    clearInterval(H.timer); clearInterval(H.timerR); H.timer = null;
    localStorage.removeItem(SAVE_KEY); localStorage.removeItem('brinavalle_medals');
    return Object.keys(localStorage);
  },
};
(function () {
  const h = Player.prototype.hurt;
  Player.prototype.hurt = function (g, dmg, sx, sy) {
    const before = g.s.hp, r = h.apply(this, arguments);
    if (g.s.hp !== before) H.hurt.push({ room: g.roomId, hp: before + '→' + g.s.hp, chi: g.entities.filter(e => e.enemy && Math.hypot(e.cx() - sx, e.cy() - sy) < 6).map(e => e.constructor.name).join(',') || 'proiettile/altro' });
    return r;
  };
})();
window.H = H;
