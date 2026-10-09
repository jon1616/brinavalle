'use strict';
/* =====================================================================
 *  FOX — Ciclo 19 (Agente A, seconda manche): COCCA, il volpacchiotto.
 *  Nei primi minuti, accanto al Santuario della Brina, un volpacchiotto
 *  bianco è intrappolato in un cerchio di rovi: con la spada appena presa
 *  lo liberi, e da quel momento ti SEGUE OVUNQUE (segue le tue orme, quindi
 *  non attraversa i muri), si siede quando ti fermi, si addormenta se aspetti.
 *  FIUTA I SEGRETI: quando sei vicino a una crepa da far saltare o a un Seme
 *  dell'Alba, corre lì, scodinzola e abbaia con un "!". Puoi accarezzarlo.
 *  Non combatte e non intralcia: niente collisioni, niente danni.
 * ===================================================================== */
const FOX_CAGE = [[3, 6], [2, 7], [4, 7], [3, 8]];

(function patchShrine() {
  const r = ROOMS['o:0,1'];
  for (const [x, y] of FOX_CAGE) r.tiles[y] = r.tiles[y].slice(0, x) + 'V' + r.tiles[y].slice(x + 1);
  r.tiles[7] = r.tiles[7].slice(0, 3) + '.' + r.tiles[7].slice(4);
})();

class Fox extends Entity {
  constructor() {
    super(0, 0);
    this.hb = { x: 3, y: 9, w: 10, h: 6 }; this.dir = 3; this.t = 0; this.trail = [];
    this.state = 'follow'; this.idle = 0; this.hint = null; this.hintT = 0; this.bubble = 0; this.hinted = new Set(); this.moving = false; this.caged = false;
  }
  get sortY() { return this.y + 15; }
  placeNear(p) {
    const v = DIRS[p.dir];
    this.x = p.x - v.x * 14; this.y = p.y - v.y * 10 + 2;
    if (boxHitsSolid(this.box(), {})) { this.x = p.x; this.y = p.y + 2; }
    this.trail = []; this.state = 'follow'; this.hint = null; this.idle = 0;
  }
  findHint(g) {
    const p = g.player, cands = [];
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
      if (tileAt(tx, ty) !== 'Q') continue;
      cands.push({ key: g.roomId + ':Q:' + tx + ',' + ty, x: tx * TS + 8, y: ty * TS + 8 });
    }
    for (const e of g.entities) if (typeof Seed !== 'undefined' && e instanceof Seed && !e.dead) cands.push({ key: g.roomId + ':seed:' + e.def.id, x: e.x + 8, y: e.y + 8 });
    let best = null, bd = 4.5 * TS;
    for (const c of cands) {
      if (this.hinted.has(c.key)) continue;
      const d = Math.hypot(c.x - p.cx(), c.y - p.cy());
      if (d < bd) { bd = d; best = c; }
    }
    if (!best) return;
    this.hinted.add(best.key);
    // una crepa fatta di più tile vicine (es. le macerie delle Rovine) è un solo segreto
    for (const c of cands) if (Math.hypot(c.x - best.x, c.y - best.y) <= 2.5 * TS) this.hinted.add(c.key);
    // si ferma accanto al segreto, dalla parte del giocatore
    const ax = best.x - p.cx(), ay = best.y - p.cy(), d = Math.hypot(ax, ay) || 1;
    this.hint = { x: best.x - ax / d * 14 - 8, y: best.y - ay / d * 14 - 12 };
    this.state = 'hint'; this.hintT = 170; this.bubble = 170;
    Sound.sfx('yip');
  }
  update(g) {
    const p = g.player;
    this.t++;
    if (this.caged) { if (this.t % 150 === 0 && Math.hypot(p.cx() - this.cx(), p.cy() - this.cy()) < 90) Sound.sfx('whine'); return; }
    if (this.bubble > 0) this.bubble--;
    this.trail.push([p.x, p.y]);
    if (this.trail.length > 40) this.trail.shift();
    if (this.state !== 'hint' && this.t % 40 === 0 && g.state === 'play') this.findHint(g);
    let tx = this.x, ty = this.y;
    if (this.state === 'hint') {
      tx = this.hint.x; ty = this.hint.y;
      if (--this.hintT <= 0) this.state = 'follow';
    } else {
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < 22 && !p.moving) this.idle++;
      else { this.idle = 0; const tr = this.trail[Math.max(0, this.trail.length - 14)]; if (tr) { tx = tr[0]; ty = tr[1] + 2; } }
    }
    const dx = tx - this.x, dy = ty - this.y, dist = Math.hypot(dx, dy);
    const sp = this.state === 'hint' ? 1.7 : dist > 40 ? 2.2 : 1.4;
    if (dist > 1.2) {
      this.x += dx / dist * Math.min(sp, dist); this.y += dy / dist * Math.min(sp, dist);
      this.moving = true; if (Math.abs(dx) > 0.4) this.dir = dx < 0 ? 2 : 3;
    } else this.moving = false;
    if (Math.hypot(p.x - this.x, p.y - this.y) > 150) this.placeNear(p);   // perso di vista: ti raggiunge
    if (this.idle > 600 && this.t % 40 === 0) g.particles.push(new Particle(this.x + 12, this.y + 4, 0.15, -0.3, 40, '#e8e8ff', 1, 0));
  }
  pet(g) {
    const f = g.s.flags, lines = f.victory
      ? ['Cocca rotola nell\'erba, felice di sentire il sole sulla pancia.', 'Cocca ti porta un rametto. Poi se lo riprende.']
      : ['Cocca scodinzola così forte che quasi cade.', 'Cocca ti annusa la mano, starnutisce e ti guarda come per dire: «Andiamo?»', 'Cocca ti lecca la punta delle dita. Ha un nasino gelido.', 'Cocca drizza le orecchie verso la valle. Fiuta qualcosa, laggiù?'];
    this.idle = 0; this.bubble = 0;
    for (let i = 0; i < 5; i++) g.particles.push(new Particle(this.x + 8 + (Math.random() - 0.5) * 8, this.y + 4, (Math.random() - 0.5) * 0.4, -0.6, 36, '#ff8ab0', 2, 0));
    Sound.sfx('yip');
    return [lines[(g.t >> 3) % lines.length]];
  }
  draw(c, g) {
    const sleep = this.idle > 600, sit = !this.moving && !sleep && this.state !== 'hint' || this.caged;
    const flip = this.dir === 2, x = Math.round(this.x), y = Math.round(this.y), t = this.t;
    drawShadow(c, x + 8, y + 15, 10);
    c.save();
    if (flip) { c.translate(x + 16, y); c.scale(-1, 1); } else c.translate(x, y);
    const O = '#2a3040', W = '#f4f8ff', S = '#c8d8f0', K = '#1a1420', P = '#f0a0b8';
    const R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a, b, w, h); };
    const wag = this.state === 'hint' || this.bubble > 0 ? ((t >> 2) % 2) : ((t >> 4) % 2);
    if (sleep) {   // raggomitolato
      R(2, 10, 12, 5, O); R(3, 11, 10, 3, W); R(3, 13, 10, 1, S); R(1, 11, 3, 3, O); R(1, 12, 3, 1, W); R(11, 9, 4, 3, O); R(12, 10, 2, 1, W); R(12, 8, 1, 1, O);
    } else if (sit) {   // seduto, coda che si muove
      R(1, 9 - wag, 4, 4, O); R(2, 10 - wag, 2, 2, W); R(1, 9 - wag, 1, 1, S);
      R(4, 8, 7, 7, O); R(5, 9, 5, 5, W); R(6, 13, 3, 1, S);
      R(8, 3, 7, 6, O); R(9, 4, 5, 4, W); R(14, 6, 1, 1, K); R(12, 5, 1, 1, K);
      R(9, 1, 2, 3, O); R(12, 1, 2, 3, O); R(10, 2, 1, 1, P); R(12, 2, 1, 1, P);
      R(6, 14, 1, 1, O); R(9, 14, 1, 1, O);
    } else {   // in cammino
      const f = (t >> 3) % 2;
      R(0, 7 + wag, 5, 4, O); R(1, 8 + wag, 3, 2, W); R(0, 8 + wag, 1, 1, S);
      R(3, 8, 9, 5, O); R(4, 9, 7, 3, W); R(5, 11, 5, 1, S);
      R(10, 4, 6, 6, O); R(11, 5, 4, 4, W); R(15, 7, 1, 1, K); R(13, 6, 1, 1, K);
      R(11, 2, 2, 3, O); R(14, 2, 2, 3, O); R(12, 3, 1, 1, P); R(14, 3, 1, 1, P);
      R(4, 13, 1, 2 - f, O); R(6, 13, 1, 1 + f, O); R(9, 13, 1, 2 - f, O); R(11, 13, 1, 1 + f, O);
    }
    c.restore();
    if (this.bubble > 0 && (this.bubble >> 3) % 2 === 0) {   // "!" quando fiuta qualcosa
      R(x + 6, y - 9, 5, 8, '#2a3040'); R(x + 7, y - 8, 3, 6, '#ffffff'); R(x + 8, y - 7, 1, 3, '#e04060'); R(x + 8, y - 3, 1, 1, '#e04060');
    }
    if (this.caged && (t >> 5) % 2) { R(x + 12, y - 2, 1, 1, '#a8d0ff'); }
  }
}

(function installFox() {
  const G = Game;
  G.fox = null;
  const foxOn = g => g.s.flags.foxFreed && !g.rush && g.state !== 'fishing';

  /* entrando in ogni stanza Cocca è con te (o, prima, nella sua gabbia di rovi) */
  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    const r = loadRoom.call(this, id);
    if (!this.fox) this.fox = new Fox();
    const fox = this.fox;
    fox.hinted.clear();   // Ciclo 20 (Agente B): "una volta per visita" — prima il set non si svuotava mai, nemmeno con una nuova partita
    if (this.s.flags.foxFreed && !this.rush) {
      fox.caged = false;
      if (this.player) fox.placeNear(this.player);
      this.entities.push(fox);
    } else if (id === 'o:0,1' && !this.rush) {
      fox.caged = true; fox.x = 3 * TS; fox.y = 7 * TS - 2; fox.dir = 3;
      this.entities.push(fox);
    }
    return r;
  };
  /* scorrimento tra stanze: Cocca arriva subito dietro di te */
  const afterEnter = G.afterEnter;
  G.afterEnter = function () { const r = afterEnter.call(this); if (this.fox && this.s.flags.foxFreed && this.player) this.fox.placeNear(this.player); return r; };

  /* liberarlo: basta tagliare uno dei rovi della gabbia */
  const cutTile = G.cutTile;
  G.cutTile = function (tx, ty) {
    const r = cutTile.call(this, tx, ty);
    if (this.roomId === 'o:0,1' && !this.s.flags.foxFreed && FOX_CAGE.some(([x, y]) => x === tx && y === ty)) {
      this.s.flags.foxFreed = true;
      const fox = this.fox; fox.caged = false; fox.trail = []; fox.bubble = 120;
      for (const [x, y] of FOX_CAGE) if (this.tiles[y][x] === 'V') {   // gli altri rovi della gabbia appassiscono
        this.tiles[y][x] = '.'; this.s.flags['cut:o:0,1:' + x + ',' + y] = true;
        for (let i = 0; i < 6; i++) this.particles.push(new Particle(x * TS + 8, y * TS + 8, (Math.random() - 0.5) * 1.6, -Math.random() * 1.4, 28, i % 2 ? '#7f4a82' : '#5a2f5e', 2, 0.1));
      }
      this.redrawBg();
      for (let i = 0; i < 10; i++) this.particles.push(new Particle(fox.x + 8, fox.y + 6, (Math.random() - 0.5) * 1.5, -Math.random() * 1.5, 40, '#ff8ab0', 2, 0.02));
      Sound.sfx('yip');
      this.say([
        'Il volpacchiotto bianco salta fuori dai rovi e ti gira intorno, scodinzolando come un matto!',
        'Ha deciso: da oggi ti seguirà ovunque. Ha il pelo candido come la brina... lo chiamerai COCCA.',
        'Suggerimento: Cocca ha un gran fiuto. Quando sente un segreto vicino corre lì e abbaia.',
      ]);
      this.saveGame();
    }
    return r;
  };
  /* parlargli / accarezzarlo */
  const tryInteract = G.tryInteract;
  G.tryInteract = function () {
    const fox = this.fox, p = this.player;
    if (fox && this.entities.includes(fox)) {
      const v = DIRS[p.dir], reach = fox.caged ? 24 : 10;   // in gabbia lo si raggiunge oltre i rovi
      const pb = { x: p.cx() + v.x * reach - 4, y: p.cy() + v.y * reach - 6, w: 8, h: 8 };
      if (overlap(pb, fox.box())) {
        if (fox.caged) {   // con la spada, Azione deve tagliare i rovi: la gabbia "parla" solo prima
          if (this.s.items.sword) return tryInteract.call(this);
          this.say(['Un volpacchiotto bianco è intrappolato in un cerchio di rovi... Ti servirebbe una lama per liberarlo.']); return true;
        }
        // Ciclo 29 (prova a mano): la carezza non deve mai rubare il fendente. Con Cocca seduta davanti
        // (bloccata dagli stessi rovi) Azione la accarezzava all'infinito e il rovo non si tagliava più.
        // Ora vince la spada se c'è qualcosa da colpire, e dopo una carezza Azione è solo fendente per 3 s.
        const cd = (this.foxPetUntil || 0) - this.t;   // frame di attesa rimasti (ignorati se il contatore è tornato indietro)
        if (this.s.items.sword && ((cd > 0 && cd <= 180) || swordHasWork(this))) return tryInteract.call(this);
        this.foxPetUntil = this.t + 180;
        this.say(fox.pet(this)); return true;
      }
    }
    return tryInteract.call(this);
  };
  /* c'è qualcosa da colpire davanti a Lio? (rovi, cespugli, nemici) */
  function swordHasWork(g) {
    const sb = g.player.swordBox();
    for (let ty = Math.floor(sb.y / TS); ty <= Math.floor((sb.y + sb.h - 1) / TS); ty++)
      for (let tx = Math.floor(sb.x / TS); tx <= Math.floor((sb.x + sb.w - 1) / TS); tx++) { const t = tileAt(tx, ty); if (t === 'V' || t === 'B') return true; }
    const near = { x: sb.x - 12, y: sb.y - 12, w: sb.w + 24, h: sb.h + 24 };
    return g.entities.some(e => e.enemy && !e.dead && overlap(near, e.box()));
  }
  window.swordHasWork = swordHasWork;
  /* nella Sfida dei Guardiani e durante la pesca non c'è */
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    if (this.fox && this.entities.includes(this.fox) && this.s.flags.foxFreed && !foxOn(this)) this.entities = this.entities.filter(e => e !== this.fox);
    return updatePlay.call(this);
  };

  if (typeof SIDE_QUESTS !== 'undefined') SIDE_QUESTS.unshift({ name: 'Un amico a quattro zampe', seen: g => g.visited.has('o:0,1'), done: g => g.s.flags.foxFreed,
    hint: 'Accanto al Santuario della Brina qualcosa guaisce in mezzo ai rovi...' });
  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'cocca', name: 'Amico fedele', desc: 'Libera Cocca, il volpacchiotto dei rovi.', icon: 'heart', tier: 0, got: g => g.s.flags.foxFreed });
})();
