'use strict';
/* =====================================================================
 *  WALK — Ciclo 26 (Agente B, seconda manche): «due passi con papà».
 *  Finita la festa del ritorno (Ciclo 25), al padre si può chiedere di
 *  fare DUE PASSI: allora segue Lio per la valle, come Cocca (sulle sue
 *  orme, un passo più indietro), all'aperto e nelle case. Nei dungeon
 *  no: «ti aspetto qui fuori», e uscendo te lo ritrovi accanto.
 *  · In ognuno dei 9 luoghi all'aperto il padre si ferma e racconta un
 *    RICORDO (di Lio bambino, della valle prima del furto del Cuore...).
 *    Il diario conta i ricordi; tutti e 9: un dono e una medaglia.
 *  · Parlandogli: continuare, la gara di pesca (al lago, di mattina),
 *    o rimandarlo a casa. Non combatte e non intralcia.
 * ===================================================================== */
const DAD_MEMORIES = {
  'o:1,2': ['Papà: Qui davanti a casa hai fatto i tuoi primi passi. Sei caduto sette volte, e non hai pianto nemmeno una.'],
  'o:0,2': ['Papà: Il tuo primo pesce fu un\'alborella grande come un dito. La liberasti tu: «è ancora piccola», dicesti.'],
  'o:2,2': ['Papà: D\'inverno questi campi brillano come vetro. Facevamo a gara a chi scivolava più lontano. Vincevi sempre tu... più o meno.'],
  'o:0,1': ['Papà: Da ragazzo provai anch\'io a prendere la spada del Santuario. Non si mosse di un pelo. Aspettava te.'],
  'o:1,1': ['Papà: Al Crocevia ti dicevo: nel dubbio, segui il sole. Tu sceglievi la strada con più farfalle.'],
  'o:2,1': ['Papà: Il Bosco dei Rovi un tempo era un frutteto: le more più dolci della valle. Torneranno, vedrai.'],
  'o:2,0': ['Papà: In questa radura Silvano mi insegnò a leggere le stelle. Diceva che ogni stella è un viandante che ha trovato casa.'],
  'o:1,0': ['Papà: La notte del furto vidi una luce rossa salire dalle Rovine. La mattina dopo scesi qui sotto... e il resto lo sai. Sei arrivato tu, al momento giusto.'],
  'o:0,0': ['Papà: Il mio vecchio bivacco. I fuochi fatui non portano ai tesori, ma a chi li cerca: avevo ragione, no?'],
};
const DAD_MEM_IDS = Object.keys(DAD_MEMORIES);
const dadMemCount = g => DAD_MEM_IDS.filter(id => g.s.flags['memo:' + id]).length;

class DadWalker extends Entity {
  constructor() { super(0, 0); this.hb = { x: 2, y: 6, w: 12, h: 10 }; this.dir = 0; this.t = 0; this.trail = []; this.moving = false; this.memoT = 0; }
  get sortY() { return this.y + 15; }
  placeNear(p) {
    const v = DIRS[p.dir];
    this.x = p.x - v.x * 20; this.y = p.y - v.y * 18;
    const out = this.x < 0 || this.y < -4 || this.x > PLAY_W - 16 || this.y > PLAY_H - 16;   // entrando dal bordo: non fuori dallo schermo
    if (out || boxHitsSolid(this.box(), {})) { this.x = p.x; this.y = p.y; }
    this.trail = []; this.dir = p.dir;
  }
  update(g) {
    const p = g.player;
    this.t++;
    this.trail.push([p.x, p.y]);
    if (this.trail.length > 60) this.trail.shift();
    let tx = this.x, ty = this.y;
    // un passo più indietro di Cocca (che segue a 14 frame): con lei in fila, ancora un po' più in là, per non calpestarla
    const fox = g.fox && g.entities.includes(g.fox), lag = fox ? 36 : 24, near = fox ? 36 : 24;
    if (Math.hypot(p.x - this.x, p.y - this.y) > near || p.moving) { const tr = this.trail[Math.max(0, this.trail.length - lag)]; if (tr) { tx = tr[0]; ty = tr[1]; } }
    const dx = tx - this.x, dy = ty - this.y, dist = Math.hypot(dx, dy), sp = dist > 40 ? 2 : 1.3;
    if (dist > 1.2 && !g.dialog) {
      this.x += dx / dist * Math.min(sp, dist); this.y += dy / dist * Math.min(sp, dist); this.moving = true;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    } else {
      this.moving = false;
      if (!g.dialog) { const ax = p.cx() - this.cx(), ay = p.cy() - this.cy(); if (Math.hypot(ax, ay) < 40) this.dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? 2 : 3) : (ay < 0 ? 1 : 0); }
    }
    if (Math.hypot(p.x - this.x, p.y - this.y) > 150) this.placeNear(p);   // perso di vista: ti raggiunge
  }
  draw(c) {
    const set = SPR.people.father, fr = this.moving ? (this.t >> 3) % 4 : 0, x = Math.round(this.x), y = Math.round(this.y);
    drawShadow(c, x + 8, y + 15, 10);
    c.drawImage(set[DIRS[this.dir].name][fr], x, y);
    if (this.memoT > 0 && (this.t >> 3) % 2 === 0) {   // "…": sta per raccontare qualcosa
      c.fillStyle = '#2a3040'; c.fillRect(x + 4, y - 9, 9, 6);
      c.fillStyle = '#ffffff'; c.fillRect(x + 5, y - 7, 1, 1); c.fillRect(x + 8, y - 7, 1, 1); c.fillRect(x + 11, y - 7, 1, 1);
    }
  }
}

(function installWalk() {
  const G = Game;
  G.dadWalker = null;
  const walking = g => !!g.s.flags.dadWalk && !g.rush;
  const allowed = id => /^[oi]:/.test(id);   // all'aperto e nelle case; nei dungeon aspetta fuori
  const here = g => g.dadWalker && g.entities.includes(g.dadWalker);

  /* finché passeggia con Lio, non è al suo solito posto (né al lago) */
  for (const N of [FATHER_NPC, typeof DAD_LAKE !== 'undefined' ? DAD_LAKE : null]) {
    if (!N) continue;
    const c0 = N.cond; N.cond = g => !g.s.flags.dadWalk && (!c0 || c0(g));
  }
  /* l'invito: dopo la festa, nel suo solito dialogo c'è una domanda in più */
  const talk0 = FATHER_NPC.talk;
  FATHER_NPC.talk = function (g) {
    const out = talk0.call(this, g);
    if (!g.s.flags.partyDone) return out;
    return out.concat([{ text: 'Papà: Ti va di fare due passi per la valle? Ho tante cose da raccontarti.', choices: [
      { label: 'Andiamo!', fn: g2 => { startWalk(g2); return [dadMemCount(g2) ? 'Papà: Riprendiamo da dove eravamo rimasti.' : 'Papà: Fai strada tu. Io ti vengo dietro, come Cocca.']; } },
      { label: 'Riposiamo a casa', fn: () => [{ text: 'Papà: Una pausa? Accendo il fuoco. Fino a quando dormiamo?', choices: restChoices('Ti addormenti davanti al camino, con il papà che russa piano... e ti svegli riposato.', 'Niente', 'Papà: Allora restiamo svegli.') }] },   // Ciclo 56: la gara è solo di mattina
      { label: 'Un\'altra volta', fn: () => ['Papà: Quando vuoi. Io sono qui.'] },
    ] }]);
  };

  function startWalk(g) {
    g.s.flags.dadWalk = true;
    if (!g.dadWalker) g.dadWalker = new DadWalker();
    const w = g.dadWalker, home = g.entities.find(e => e.def === FATHER_NPC);
    if (home) { w.x = home.x; w.y = home.y; } else w.placeNear(g.player);
    w.trail = []; w.memoT = 0;
    g.entities = g.entities.filter(e => e.def !== FATHER_NPC);   // il padre "fermo" diventa quello che cammina
    if (!here(g)) g.entities.push(w);
    queueMemory(g);
  }
  function stopWalk(g) {
    g.s.flags.dadWalk = false;
    const w = g.dadWalker;
    g.entities = g.entities.filter(e => e !== w);
    if (g.roomId === 'o:1,2' && FATHER_NPC.cond(g)) {   // in piazza torna subito al suo posto
      const n = new NPC(Object.assign({}, FATHER_NPC)); n.def = FATHER_NPC; g.entities.push(n);
    }
  }
  function queueMemory(g) {
    const w = g.dadWalker;
    if (w && DAD_MEMORIES[g.roomId] && !g.s.flags['memo:' + g.roomId]) w.memoT = 70;
  }

  /* in ogni stanza: è con te (o ti aspetta fuori dal dungeon) */
  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    const r = loadRoom.call(this, id);
    if (walking(this) && allowed(id)) {
      if (!this.dadWalker) this.dadWalker = new DadWalker();
      const w = this.dadWalker; w.memoT = 0;
      if (this.player) w.placeNear(this.player);
      this.entities.push(w);
      queueMemory(this);
    }
    this.dadRoomT = 0;
    return r;
  };
  const afterEnter = G.afterEnter;
  G.afterEnter = function () {
    const r = afterEnter.apply(this, arguments);
    if (here(this) && this.player) this.dadWalker.placeNear(this.player);
    return r;
  };

  /* il ricordo arriva dopo un attimo, quando non c'è altro da dire */
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    if (here(this) && (!walking(this) || this.state === 'fishing')) this.entities = this.entities.filter(e => e !== this.dadWalker);
    updatePlay.call(this);
    // entrando in un dungeon: dopo un attimo (finito il nome della stanza) l'avviso che ti aspetta fuori
    if (walking(this) && this.state === 'play') {
      this.dadRoomT = (this.dadRoomT || 0) + 1;
      if (allowed(this.roomId)) this.dadWaitSaid = false;
      else if (!this.dadWaitSaid && this.dadRoomT > 60 && !this.banner && !this.dialog) { this.dadWaitSaid = true; this.banner = { text: 'Papà: «Ti aspetto qui fuori!»', t: 120 }; }
    }
    const w = this.dadWalker;
    if (!here(this) || this.state !== 'play' || this.dialog || !(w.memoT > 0)) return;
    if (--w.memoT > 0) return;
    const id = this.roomId, lines = DAD_MEMORIES[id];
    if (!lines || this.s.flags['memo:' + id]) return;
    this.s.flags['memo:' + id] = true;
    const n = dadMemCount(this), extra = [];
    if (n === DAD_MEM_IDS.length && !this.s.flags.dadMemAll) {
      extra.push(
        g => { g.s.flags.dadMemAll = true; },
        'Papà: Abbiamo fatto il giro di tutta la valle, Lio. Ogni posto ha un pezzo della nostra storia... e adesso anche della tua.',
        'Papà: Tieni: i miei risparmi di esploratore. Spendili da Bortolo... o in esche, se vuoi battermi di nuovo al lago.',
        ...this.giveItem('gems', 60),
      );
    }
    Sound.sfx('chirp');
    this.say([...lines, ...extra]);
    this.saveGame();
  };

  /* parlargli mentre passeggia */
  const tryInteract = G.tryInteract;
  G.tryInteract = function () {
    const w = this.dadWalker, p = this.player;
    if (here(this)) {
      const v = DIRS[p.dir], pb = { x: p.cx() + v.x * 12 - 4, y: p.cy() + v.y * 12 - 6, w: 8, h: 8 };
      if (overlap(pb, w.box())) { this.say(walkTalk(this)); return true; }
    }
    return tryInteract.call(this);
  };
  function walkTalk(g) {
    const n = dadMemCount(g), choices = [{ label: 'Continuiamo', fn: () => ['Papà: Fai strada!'] }];
    const lake = typeof DAD_LAKE !== 'undefined' && g.roomId === 'o:0,2' && dadMorning(g) && g.s.flags.hookReturned;
    if (lake) choices.push({ label: 'Gara di pesca', fn: g2 => DAD_LAKE.talk(g2) });
    choices.push({ label: 'Torna a casa', fn: g2 => { stopWalk(g2); return ['Papà: Va bene. Ti aspetto a casa, campione.']; } });
    const say = n < DAD_MEM_IDS.length ? 'Papà: Che bella giornata per camminare. (Ricordi raccontati: ' + n + '/' + DAD_MEM_IDS.length + ')'
      : 'Papà: Ormai la valle te l\'ho raccontata tutta. Ma camminare insieme è bello lo stesso.';
    return [{ text: say, choices }];
  }

  if (typeof SIDE_QUESTS !== 'undefined') SIDE_QUESTS.push({ name: 'Due passi con papà',
    seen: g => g.s.flags.partyDone, done: g => g.s.flags.dadMemAll, prog: g => dadMemCount(g) + '/' + DAD_MEM_IDS.length,
    hint: 'Chiedi a tuo padre di fare due passi: in ogni luogo della valle ha un ricordo da raccontarti.' });
  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'ricordi', name: 'Passo dopo passo', desc: 'Ascolta tutti i ricordi di tuo padre.', icon: 'compass', tier: 1, got: g => !!g.s.flags.dadMemAll });
})();
