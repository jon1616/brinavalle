'use strict';
/* =====================================================================
 *  RESUME — Ciclo 53 (Agente A, RIFINITURA): niente si perde se il gioco si chiude
 *  nel momento sbagliato.
 *  1) I CARTELLI DEI CAPITOLI. I finali dei Capitoli III-VII salvano subito il loro
 *     flag (vesperVoice, starFreed/fUmbra, wMother, gHeart, qWind), ma il cartello
 *     «Capitolo ... completato», che imposta chNDone, arriva solo dopo un lungo dialogo.
 *     Chi chiudeva il gioco in quel momento, al rientro, restava BLOCCATO: niente
 *     cartello, obiettivo fermo, Segnavia muto, capitolo dopo che non partiva mai.
 *     Ora, se il finale è compiuto e il cartello non è stato visto, il cartello riappare.
 *  2) I CUORI DI CRISTALLO DEI BOSS. Tutti i boss lasciano un cuore per terra: chi
 *     usciva (dalla sala o dal gioco) prima di raccoglierlo lo perdeva per sempre.
 *     Ora ogni cuore lasciato per terra è annotato nel salvataggio (pendCont:<stanza>)
 *     e, finché non lo prendi, al rientro nella sala riappare dov'era.
 * ===================================================================== */
const PENDING_CARDS = [
  // Ciclo 54 (Agente B): anche il Capitolo II. Il padre salva fatherRemembers alla PRIMA battuta del suo ricordo, e il
  // cartello (amber.js) nasceva solo nel passaggio «prima no, ora sì»: chiudendo il gioco a metà, quel passaggio non tornava
  // più. Niente cartello, ch2Done mai vero, obiettivo «Goditi la valle» e i Capitoli III-VIII non partivano.
  { done: 'ch2Done', card: 'chapterCardIn', got: f => !!f.fatherRemembers },
  { done: 'ch3Done', card: 'ch3CardIn', got: f => !!f.vesperVoice },
  { done: 'ch4Done', card: 'ch4CardIn', got: f => !!(f.starFreed || f.fUmbra), fix: f => { f.starFreed = true; } },   // Umbra vinta ma la stella non ancora risalita
  { done: 'ch5Done', card: 'ch5CardIn', got: f => !!f.wMother, fix: f => { f.seaCalm = true; } },
  { done: 'ch6Done', card: 'ch6CardIn', got: f => !!f.gHeart },
  { done: 'ch7Done', card: 'ch7CardIn', got: f => !!f.qWind },
];

(function installResume() {
  const G = Game;
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state !== 'play' || this.dialog || !this.s) return;
    const f = this.s.flags;
    // un cartello in arrivo per un capitolo già chiuso (o per un finale che in questa partita non c'è: «Nuova partita» subito dopo un finale) non deve comparire
    for (const c of PENDING_CARDS) if (this[c.card] > 0 && (f[c.done] || !c.got(f))) this[c.card] = 0;
    // un cartello alla volta, e mai mentre un altro è in arrivo
    if (PENDING_CARDS.some(c => this[c.card] > 0)) return;
    for (const c of PENDING_CARDS) {
      if (!c.got(f) || f[c.done]) continue;
      if (c.fix) c.fix(f);
      this[c.card] = 60; this.saveGame();
      return;
    }
  };

  /* i cuori di cristallo per terra */
  const reg = g => {
    for (const p of g.pickups || []) {
      if (p.kind !== 'container' || p.pendKey) continue;
      p.pendKey = 'pendCont:' + g.roomId;
      g.s.flags[p.pendKey] = [Math.round(p.x), Math.round(p.y)];
      g.saveGame();
    }
  };
  const update = G.update;
  G.update = function () { update.call(this); if (this.state === 'play' && this.pickups && this.pickups.length) reg(this); };
  const applyItem = G.applyItem;
  G.applyItem = function (kind, n) {
    if (kind === 'container' && this.s.flags['pendCont:' + this.roomId]) delete this.s.flags['pendCont:' + this.roomId];   // preso: non riappare più
    applyItem.call(this, kind, n);
  };
  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.apply(this, arguments);
    const at = this.s && this.s.flags['pendCont:' + id];
    if (at && !(this.pickups || []).some(p => p.kind === 'container')) {
      const p = new Pickup(at[0], at[1], 'container'); p.pendKey = 'pendCont:' + id;
      this.pickups.push(p);
    }
  };
  /* 3) Ciclo 54 (Agente B): I DONI DENTRO UN DIALOGO. Molti finali salvano a metà dialogo (campane, Faro, Tempio, Radici,
   *    Aquilone, gara col padre...) e il dono («Hai ricevuto 50 gemme») arriva qualche battuta DOPO: chi chiudeva il gioco
   *    in mezzo ritrovava il flag salvato e il dono perso per sempre. Ora, se si salva con un dialogo aperto, i doni
   *    ancora in coda vengono dati subito (una volta sola); il loro testo compare comunque al suo turno. */
  const giveItem = G.giveItem;
  G.giveItem = function (kind, n) {
    const out = giveItem.call(this, kind, n), ap = out[0];
    if (typeof ap === 'function') { const w = g => { if (!w.done) { w.done = true; ap(g); } }; w.give = kind; out[0] = w; }
    return out;
  };
  const saveGame = G.saveGame;
  G.saveGame = function () {
    const q = this.dialog && this.dialog.queue;
    if (q) for (const e of q) if (typeof e === 'function' && e.give && !e.done) e(this);
    return saveGame.apply(this, arguments);
  };

  Object.assign(window, { PENDING_CARDS });
})();
