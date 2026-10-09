'use strict';
/* =====================================================================
 *  PARTY — Ciclo 25 (Agente A, seconda manche): «LA FESTA DEL RITORNO».
 *  Il padre di Lio è tornato (Ciclo 23) e ha portato Lio al lago
 *  (Ciclo 24). Mancava una cosa: la valle che festeggia.
 *  · Quando Lio e il padre rientrano a Brinavalle è già sera: in piazza si
 *    accende un FALÒ, tra le case pendono le LANTERNE, e tutti gli abitanti
 *    della valle (anche chi vive lontano: Pino, Silvano, Ortensio) ballano
 *    intorno al fuoco. Musica nuova: una giga ('festa' in audio.js).
 *  · Ognuno ha qualcosa da dire. Parlando col padre arriva il BRINDISI,
 *    poi i FUOCHI D'ARTIFICIO e il cartello «FINE» della storia di Lio.
 *    Poi si continua a giocare: la notte aspetta il brindisi, e all'alba
 *    la festa finisce.
 *  Si appoggia a sky.js (notte, Sky.lightHooks per la luce del fuoco).
 * ===================================================================== */
const FIRE = { x: 7.5 * TS, y: 6 * TS };   // il falò, in mezzo alla piazza (angolo in alto a sinistra)
function partyOn(g) { const f = g.s.flags; return !!f.partyOn && !f.partyDone; }

class Bonfire extends Entity {
  constructor() { super(FIRE.x, FIRE.y); this.solid = true; this.hb = { x: 1, y: 6, w: 14, h: 9 }; this.t = 0; }
  update(g) {
    this.t++;
    if (this.t % 5 === 0 && FEEL.on) g.particles.push(new Particle(this.x + 5 + Math.random() * 6, this.y + 2, (Math.random() - 0.5) * 0.3, -0.5 - Math.random() * 0.4, 30 + Math.random() * 20 | 0, Math.random() < 0.5 ? '#ffb040' : '#ffe080', 1, 0));
  }
  draw(c) {
    const X = Math.round(this.x), Y = Math.round(this.y), t = this.t;
    drawShadow(c, X + 8, Y + 14, 14);
    c.fillStyle = 'rgba(255,170,60,' + (0.18 + Math.sin(t * 0.3) * 0.05) + ')'; c.beginPath(); c.arc(X + 8, Y + 9, 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a3a1e'; c.fillRect(X + 1, Y + 11, 14, 3); c.fillRect(X + 3, Y + 9, 10, 2);   // ceppi incrociati
    c.fillStyle = '#3a2412'; c.fillRect(X + 2, Y + 13, 12, 1);
    for (let i = 0; i < 5; i++) {   // fiamme a lingue
      const h = 5 + ((Math.sin(t * 0.25 + i * 1.7) + 1) * 3 | 0), x = X + 3 + i * 2;
      c.fillStyle = '#e8501a'; c.fillRect(x, Y + 11 - h, 2, h);
      c.fillStyle = '#ffb030'; c.fillRect(x, Y + 12 - h + 2, 2, Math.max(1, h - 3));
      if (i % 2) { c.fillStyle = '#fff2b0'; c.fillRect(x, Y + 10 - (h >> 1), 1, 2); }
    }
  }
}

/* gli invitati, in cerchio attorno al fuoco */
const GUESTS = [
  { id: 'p_teodoro', sprite: 'elder', x: 6, y: 5, lines: g => [
    'Teodoro: Tre lune di crepuscolo... e stanotte la valle festeggia sotto le stelle. Chi l\'avrebbe detto, eh, Lio?',
    'Teodoro: Tuo padre ti aspetta vicino al fuoco. Credo che abbia qualcosa da dire a tutti.'] },
  { id: 'p_padre', sprite: 'father', x: 9, y: 5, toast: true },
  { id: 'p_bortolo', sprite: 'merchant', x: 4, y: 6, lines: () => ['Bortolo: Stasera la bottega è chiusa! Le lanterne però le ho appese io. Offre la casa!'] },
  { id: 'p_pino', sprite: 'fisherman', x: 11, y: 6, lines: g => [g.s.flags.dadWins
    ? 'Pino: Ho saputo che hai battuto tuo padre alla gara! Lui dice che il lago era dalla tua parte. Io dico che hai talento.'
    : 'Pino: Ho portato il pesce più grosso che avevo, per la griglia. Non dirlo a tuo padre: il suo era più grosso!'] },
  { id: 'p_nina', sprite: 'kid', x: 6, y: 8, lines: g => [g.s.flags.foxFreed
    ? 'Nina: Balliamo! Guarda Cocca: salta più in alto di tutti!'
    : 'Nina: Balliamo! Dai, Lio, fai un giro intorno al fuoco!'] },
  { id: 'p_marta', sprite: 'woman', x: 9, y: 8, lines: () => ['Marta: Le lanterne, le stelle, il fuoco... Non avrei mai pensato di essere felice di vedere di nuovo la notte.'] },
  { id: 'p_silvano', sprite: 'hermit', x: 11, y: 8, lines: () => ['Silvano: Sono sceso dal bosco solo per stasera. ...Va bene, forse resto anche domani.'] },
  { id: 'p_ortensio', sprite: 'gardener', x: 3, y: 8, lines: () => ['Ortensio: Non so se merito di stare qui. Ma Teodoro ha insistito... e il fuoco scalda anche chi ha sbagliato.'] },
].map(d => Object.assign({ static: true, dance: true, cond: partyOn, talk: g => d.toast ? toastTalk(g) : d.lines(g) }, d));

function toastTalk(g) {
  if (g.s.flags.partyToast) return ['Papà: Questa sì che è una festa. Domattina, se vuoi, si va al lago. Ma con calma!'];
  return [
    'Papà: Un attimo di silenzio, per favore! ...Grazie a tutti.',
    'Papà: Tre lune fa sono sceso sotto le Rovine per salvare la valle. E invece è stata la valle, con mio figlio, a salvare me.',
    'Teodoro: Alla salute di Lio, il ragazzo che ha riportato l\'alba!',
    'Tutti: ALLA SALUTE DI LIO!',
    g2 => { g2.s.flags.partyToast = true; g2.saveGame(); g2.fireworks = 600; g2.finaleIn = 150; Sound.sfx('victory'); },
  ];
}

(function installParty() {
  const G = Game, village = ROOMS['o:1,2'];
  for (const d of GUESTS) village.npcs.push(d);
  // durante la festa gli abitanti "di tutti i giorni" della piazza sono attorno al fuoco
  for (const n of village.npcs) if (!n.dance) { const c0 = n.cond; n.cond = g => !partyOn(g) && (!c0 || c0(g)); }
  window.GUESTS = GUESTS;

  /* il ballo: gli invitati saltellano (a turno) e guardano il fuoco */
  const npcDraw = NPC.prototype.draw, npcUpdate = NPC.prototype.update;
  NPC.prototype.update = function (g) {
    npcUpdate.call(this, g);
    if (this.def.dance && !g.dialog) {
      const dx = FIRE.x + 8 - this.cx(), dy = FIRE.y + 8 - this.cy();
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    }
  };
  NPC.prototype.draw = function (c) {
    if (!this.def.dance) return npcDraw.call(this, c);
    const i = GUESTS.indexOf(this.def), hop = Math.max(0, Math.sin(Game.t * 0.12 - i * 0.8)) * 3;
    const y = this.y; this.y -= hop; npcDraw.call(this, c); this.y = y;
  };

  const loadRoom = G.loadRoom;
  G.loadRoom = function (id) {
    loadRoom.call(this, id);
    if (id === 'o:1,2' && partyOn(this)) this.entities.push(new Bonfire());
  };

  /* si torna a casa col padre: è sera, e la festa comincia */
  const afterEnter = G.afterEnter;
  G.afterEnter = function () {
    const f = this.s.flags;
    if (this.roomId === 'o:1,2' && f.fatherHome && !f.partyOn) {
      f.partyOn = true;
      this.s.dayStart = this.s.time - DAY_LEN * 0.64;   // è già notte
      this.loadRoom('o:1,2'); this.player.x = 4 * TS; this.player.y = 4 * TS - 6;
      afterEnter.call(this);
      this.say([
        'Quando Lio e suo padre arrivano al villaggio, il sole è già tramontato. Ma stanotte Brinavalle non dorme...',
        'Teodoro: Eccoli! Sono tornati! Presto, accendete il fuoco: stanotte si fa festa!',
      ]);
      return;
    }
    return afterEnter.call(this);
  };

  const pickMusic = G.pickMusic;
  G.pickMusic = function () {
    if (this.roomId === 'o:1,2' && partyOn(this)) return Sound.music('festa');
    return pickMusic.call(this);
  };

  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    const f = this.s.flags;
    if (!partyOn(this)) return;
    const p = Sky.phase(this);
    if (!f.partyToast && p > 0.84) this.s.dayStart += 1 / 60;   // la notte aspetta il brindisi
    if (f.partyToast && Sky.night(p) === 0 && !this.fireworks) {   // l'alba: la festa è finita
      f.partyDone = true; this.saveGame();
      if (this.roomId === 'o:1,2') { this.entities = this.entities.filter(e => !(e instanceof Bonfire) && !(e.def && e.def.dance)); this.loadRoom('o:1,2'); this.pickMusic(); }
    }
    if (this.finaleIn > 0 && !this.dialog && --this.finaleIn === 0) { this.state = 'finale'; this.finT = 0; }
  };

  /* fuochi d'artificio: razzi che salgono e si aprono a stella */
  const fw = [];
  function updateFireworks(g) {
    if (g.fireworks > 0) {
      g.fireworks--;
      if (g.fireworks % 28 === 0) {
        const col = ['#ff6a8a', '#ffe060', '#80e0ff', '#b0ff90', '#e0a0ff'][Math.random() * 5 | 0];
        fw.push({ x: 40 + Math.random() * 176, y: PLAY_H, vx: (Math.random() - 0.5) * 0.4, vy: -2.6 - Math.random() * 0.6, rocket: true, col, life: 50 + Math.random() * 15 | 0 });
        Sound.sfx('shoot');
      }
    }
    for (const f of fw) {
      f.x += f.vx; f.y += f.vy; f.life--;
      if (f.rocket) { f.vy += 0.025; if (f.life <= 0) { f.dead = true; Sound.sfx('pop'); for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, s = 1.1 + Math.random() * 0.7; fw.push({ x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col: f.col, life: 40 + Math.random() * 10 | 0 }); } } }
      else { f.vy += 0.02; f.vx *= 0.98; if (f.life <= 0) f.dead = true; }
    }
    for (let i = fw.length - 1; i >= 0; i--) if (fw[i].dead) fw.splice(i, 1);
  }
  window.PartyFW = fw;

  const update = G.update;
  G.update = function () {
    if (this.state === 'finale') {
      this.t++; this.finT++;
      if (this.finT > 150 && (Input.hit('action') || Input.hit('start'))) { this.state = 'play'; Sound.sfx('select'); }
    } else update.call(this);
    if (this.state === 'play' || this.state === 'finale') updateFireworks(this);
  };

  /* lanterne, luci del fuoco, fuochi d'artificio */
  Sky.lightHooks.push(g => g.roomId === 'o:1,2' && partyOn(g) ? [[FIRE.x + 8, FIRE.y + 8, 74, 1], ...LANTERNS.map(([x, y]) => [x, y, 12, 0.6])] : []);
  const LANTERNS = [];
  for (let i = 0; i <= 12; i++) { const x = 24 + i * 17.3, sag = Math.sin(i / 12 * Math.PI) * 6; LANTERNS.push([Math.round(x), Math.round(52 + sag)]); }
  const drawSky = G.drawSky;
  G.drawSky = function (c) {
    drawSky.call(this, c);
    if (this.roomId === 'o:1,2' && partyOn(this)) {
      c.fillStyle = '#2a2018';   // il filo delle lanterne, da casa a casa
      for (let x = 24; x <= 232; x++) { const y = 52 + Math.sin((x - 24) / 208 * Math.PI) * 6 - 3; c.fillRect(x, Math.round(y), 1, 1); }
      LANTERNS.forEach(([x, y], i) => {
        const col = ['#ff7a5a', '#ffd060', '#7ad0ff', '#b0f080'][i % 4], on = (Math.sin(this.t * 0.05 + i) + 1) / 2;
        c.fillStyle = col; c.globalAlpha = 0.25 + on * 0.15; c.fillRect(x - 3, y - 2, 7, 7); c.globalAlpha = 1;
        c.fillRect(x - 1, y - 1, 3, 4); c.fillStyle = '#fff6d0'; c.fillRect(x, y, 1, 1);
      });
      if (this.s.flags.fairyGift) drawFairy(c, FIRE.x + 8 + Math.cos(this.t * 0.03) * 30, FIRE.y - 6 + Math.sin(this.t * 0.05) * 6, this.t);
    }
    for (const f of fw) { c.fillStyle = f.col; c.globalAlpha = f.rocket ? 1 : Math.min(1, f.life / 20); c.fillRect(Math.round(f.x), Math.round(f.y), f.rocket ? 1 : 2, f.rocket ? 3 : 2); }
    c.globalAlpha = 1;
  };

  /* il cartello «FINE»: il villaggio in festa resta sullo sfondo */
  const render = G.render;
  G.render = function () {
    render.call(this);
    if (this.state !== 'finale') return;
    const t = this.finT, a = Math.min(0.62, t / 90);
    sctx.fillStyle = 'rgba(8,6,20,' + a + ')'; sctx.fillRect(0, 0, GW * SCALE, GH * SCALE);
    const ta = Math.max(0, Math.min(1, (t - 40) / 50));
    if (ta <= 0) return;
    txt('FINE', 128, 62, { align: 'center', size: 20, font: TITLE_FONT, color: '#ffd870', alpha: ta });
    txt('La storia di Lio finisce qui,', 128, 92, { align: 'center', size: 11, color: '#f4ecdc', alpha: ta });
    txt('ma Brinavalle resta tua: continua a esplorarla.', 128, 104, { align: 'center', size: 11, color: '#f4ecdc', alpha: ta });
    const s = this.s, stat = 'Tempo ' + fmtTime(s.time) + ' · Cuori ' + s.maxHp / 2 + ' · Medaglie ' + MEDALS.filter(m => Medals.data.got[m.id]).length + '/' + MEDALS.length;
    txt(stat, 128, 124, { align: 'center', size: 9, color: '#c8bcd8', alpha: ta });
    if (t > 150) txt('Premi ' + actKey(true) + ' per continuare la festa', 128, 150, { align: 'center', size: 9, color: '#a898c0', alpha: 0.6 + Math.sin(t * 0.08) * 0.3 });
  };

  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'festa', name: 'La festa del ritorno', desc: 'Brinda con tutta la valle al ritorno di tuo padre.', icon: 'crystal', tier: 1, got: g => g.s.flags.partyToast });
})();
