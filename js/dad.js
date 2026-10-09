'use strict';
/* =====================================================================
 *  DAD — Ciclo 24 (Agente B, seconda manche): «una mattina al lago».
 *  Il padre di Lio (Ciclo 23) aveva promesso: «Una di queste mattine
 *  andiamo al lago insieme». Ora lo fa davvero:
 *  · DI MATTINA il padre non è davanti alla casa di Teodoro ma al Lago
 *    Specchio, con la sua canna. Il resto del giorno è al villaggio (e la
 *    prima volta ti invita: «domattina ti aspetto al lago»).
 *  · LA GARA DI PESCA: tre lanci a testa, vince il pesce più grosso.
 *    Il padre pesca accanto a Lio nella scena di pesca (si vede, e si
 *    vede cosa prende); i suoi lanci sono simulati con le stesse specie
 *    e lo stesso meteo di Lio (fishW del Ciclo 22), a distanza media.
 *    Per batterlo bisogna lanciare lontano, o pescare col maltempo.
 *    Prima vittoria: 40 gemme e la medaglia «Tale padre, tale figlio».
 *  · I BULBI delle radici (Ciclo 23) ora suonano: do, mi, sol, do — la
 *    nota dice quanti bulbi sono chiusi insieme in quel momento.
 * ===================================================================== */
const DUEL_CASTS = 3;
const DAD_SPOT = { x: 186, y: 150 };   // il padre, sulla riva a destra del pontile (schermo di pesca)
const DAD_BOB = { x: 210, y: 92 };

/* è mattina? (dopo la vittoria: dall'alba a metà pomeriggio) */
function dadMorning(g) { const p = Sky.phase(g); return p >= 0 && p < 0.45; }

/* un lancio del padre: prende qualcosa più spesso a difficoltà alta, sempre a media distanza */
function dadCast(g) {
  if (Math.random() > [0.55, 0.7, 0.8][Opts.diff]) return null;
  const sp = g.pickSpecies(1);
  return { sp, cm: Math.round(sp.min + Math.random() * (sp.max - sp.min)) };
}

(function installDad() {
  const G = Game;

  /* ---------------- dove sta il padre ---------------- */
  const F0 = FATHER_NPC, cond0 = F0.cond, talk0 = F0.talk;
  // finché non ti ha invitato resta a casa (anche se lo liberi di mattina, torna al villaggio con te)
  const atLake = g => dadMorning(g) && !!g.s.flags.dadInvite;
  F0.cond = g => cond0(g) && !atLake(g);
  F0.talk = function (g) {
    const f = g.s.flags;
    if (f.fatherHello && !f.dadInvite) {   // dalla seconda chiacchierata: l'invito
      f.dadInvite = true;
      return ['Papà: Senti, Lio: domattina ti aspetto al Lago Specchio, da Pino. Porto la mia vecchia canna. Facciamo una gara?'];
    }
    return talk0.call(this, g);
  };

  const lake = ROOMS['o:0,2'];
  const DAD_LAKE = { id: 'padre_lago', sprite: 'father', x: 10, y: 1, cond: g => cond0(g) && atLake(g), talk: g => {
    const f = g.s.flags;
    if (!f.hookReturned) return [
      'Papà: Il lago al mattino... quanto mi era mancato.',
      'Papà: Per la gara ti serve una canna. Pino presta la sua solo a chi lo aiuta: ha perso un amo d\'oro nella Foresta Antica.',
    ];
    const intro = f.dadDuels ? (f.dadWins ? 'Papà: La rivincita? Stavolta non mi batti!' : 'Papà: Un\'altra gara? Il vecchio è ancora in forma!')
      : 'Papà: Te l\'avevo promesso: una mattina al lago! Tre lanci a testa: vince il pesce più grosso.';
    return [{ text: intro, choices: [
      { label: 'Gara!', fn: g2 => { startDuel(g2); return []; } },
      { label: 'Due chiacchiere', fn: () => [
        'Papà: Io lancio a metà lago: è lì che stanno trote e persici. Ma i pesci grossi... quelli stanno al largo.',
        'Papà: E con la pioggia vengono a riva. Il cielo è il miglior compagno di un pescatore.',
      ] },
      { label: 'Dopo', fn: () => ['Papà: Il lago non scappa. Io nemmeno, ormai.'] },
    ] }];
  } };
  lake.npcs.push(DAD_LAKE);
  window.DAD_LAKE = DAD_LAKE;

  /* ---------------- la gara ---------------- */
  function startDuel(g) {
    g.startFishing();
    g.fsh.duel = { left: DUEL_CASTS, me: null, dad: null, dadMsg: null, dadDip: 0, over: 0 };
    g.fishMsg('Gara col papà: ' + DUEL_CASTS + ' lanci a testa!', 150, '#ffd870');
  }
  /* un lancio di Lio è finito (pesce preso, scappato o lenza ritirata): lancia anche il padre */
  function duelCast(g, mine) {
    const D = g.fsh && g.fsh.duel;
    if (!D || D.left <= 0) return;
    D.left--;
    if (mine && (!D.me || mine.cm > D.me.cm)) D.me = mine;
    const his = dadCast(g);
    if (his) {
      if (!D.dad || his.cm > D.dad.cm) D.dad = his;
      D.dadMsg = { text: his.sp.name + ' ' + his.cm + ' cm', t: 150 }; D.dadDip = 30;
      g.fsh.ripples.push({ x: DAD_BOB.x, y: DAD_BOB.y, t: 0 });
    } else D.dadMsg = { text: 'niente...', t: 110 };
    if (D.left === 0) D.over = 1;
  }

  const fishReset = G.fishReset;
  G.fishReset = function (msg) {
    const F = this.fsh, cast = F && F.duel && F.bob;
    const r = fishReset.call(this, msg);
    if (cast) duelCast(this, null);
    return r;
  };
  const fishCaught = G.fishCaught;
  G.fishCaught = function () {
    const F = this.fsh, fi = F.fish, mine = F.duel && fi ? { sp: fi.sp, cm: Math.round(fi.size) } : null;
    const r = fishCaught.call(this);
    if (mine) duelCast(this, mine);
    return r;
  };

  const updateFishing = G.updateFishing;
  G.updateFishing = function () {
    const D = this.fsh && this.fsh.duel;
    if (D) {
      if (D.dadMsg && --D.dadMsg.t <= 0) D.dadMsg = null;
      if (D.dadDip > 0) D.dadDip--;
      // finiti i lanci: si chiude quando Lio ha visto il suo ultimo pesce (o subito, se è scappato)
      if (D.over && this.fsh.phase === 'aim') {   // niente più lanci: un attimo di pausa e il verdetto
        const F = this.fsh; F.t++; if (F.msg && --F.msg.t <= 0) F.msg = null;
        if (++D.over > 50) endDuel(this);
        return;
      }
    }
    updateFishing.call(this);
  };

  const endFishing = G.endFishing;
  G.endFishing = function () {
    const D = this.fsh && this.fsh.duel;
    const r = endFishing.apply(this, arguments);
    if (D && !D.over) this.say(['Papà: Già stanco? La finiamo un\'altra mattina, campione.']);
    return r;
  };

  function endDuel(g) {
    const D = g.fsh.duel, f = g.s.flags;
    g.fsh.duel = null;
    g.endFishing();
    f.dadDuels = (f.dadDuels || 0) + 1;
    const me = D.me ? D.me.cm : 0, dad = D.dad ? D.dad.cm : 0;
    const res = 'Papà: ' + (D.me ? 'Il tuo: ' + D.me.sp.name + ', ' + me + ' cm. ' : 'Tu non hai preso niente. ') +
      (D.dad ? 'Il mio: ' + D.dad.sp.name + ', ' + dad + ' cm.' : 'E io nemmeno!');
    const lines = [res];
    if (me > dad) {
      const first = !f.dadWins;
      f.dadWins = (f.dadWins || 0) + 1;
      Sound.sfx('victory');
      if (first) lines.push(
        'Papà: ...Mi hai battuto! Pino aveva ragione: sei un vero pescatore.',
        'Papà: Quando eri piccolo ti insegnavo a tenere la canna dritta. Ora sei tu a insegnare a me.',
        ...g.giveItem('gems', 40));
      else lines.push('Papà: Di nuovo! Tieni, una piccola scommessa è una scommessa.', ...g.giveItem('gems', 10));
    } else if (me === dad) lines.push('Papà: Pari! Allora vinciamo tutti e due. Pino, segna sul diario!');
    else lines.push('Papà: Ah-ah! Stavolta vince il vecchio.',
      me ? 'Papà: Lancia più lontano: i pesci grossi stanno al largo. E se piove... vengono loro da te.' : 'Papà: Ricordati: tira quando il galleggiante va giù del tutto, non al primo assaggio.');
    g.say(lines);
    g.saveGame();   // Ciclo 54: DOPO say, così il salvataggio vede (e dà subito) le gemme della scommessa ancora in coda (resume.js)
  }

  /* ---------------- disegno: il padre sulla riva, la sua lenza, il punteggio ---------------- */
  const drawFishing = G.drawFishing;
  G.drawFishing = function (c) {
    drawFishing.call(this, c);
    const D = this.fsh && this.fsh.duel;
    if (!D) return;
    const t = this.t, dip = D.dadDip > 0 ? 3 : Math.round(Math.sin(t * 0.08));
    const tx = DAD_SPOT.x + 11, ty = DAD_SPOT.y - 22;   // punta della canna
    c.fillStyle = '#6a4a2a'; for (let i = 0; i < 16; i++) c.fillRect(DAD_SPOT.x + 4 + Math.round(i * 7 / 16), DAD_SPOT.y - 6 - i, 1, 1);   // la canna
    c.strokeStyle = 'rgba(240,240,240,0.55)'; c.lineWidth = 1;   // la lenza
    c.beginPath(); c.moveTo(tx + 0.5, ty + 0.5); c.lineTo(DAD_BOB.x + 0.5, DAD_BOB.y + dip + 0.5); c.stroke();
    c.fillStyle = '#e83838'; c.fillRect(DAD_BOB.x - 1, DAD_BOB.y + dip - 1, 3, 2);   // il galleggiante
    c.fillStyle = '#f4f0e8'; c.fillRect(DAD_BOB.x - 1, DAD_BOB.y + dip + 1, 3, 1);
    c.drawImage(SPR.people.father.up[0], DAD_SPOT.x - 8, DAD_SPOT.y - 8);
  };
  const drawFishingText = G.drawFishingText;
  G.drawFishingText = function () {
    drawFishingText.call(this);
    const D = this.fsh && this.fsh.duel;
    if (!D) return;
    txt('Lanci: ' + D.left + '   Tu: ' + (D.me ? D.me.cm + ' cm' : '—') + '   Papà: ' + (D.dad ? D.dad.cm + ' cm' : '—'), 250, 13,
      { size: 10, align: 'right', color: '#ffd870', maxW: 150 });
    if (D.dadMsg) txt(D.dadMsg.text, DAD_SPOT.x - 6, DAD_SPOT.y - 36, { size: 9, align: 'center', color: '#f4ecdc', alpha: Math.min(1, D.dadMsg.t / 20), maxW: 120 });
  };

  /* ---------------- i bulbi suonano ---------------- */
  if (typeof Bulb !== 'undefined') {
    const close = Bulb.prototype.close;
    Bulb.prototype.close = function (g) {
      const was = this.closed > 0 || this.withered;
      close.call(this, g);
      if (was || !this.closed) return;
      const n = g.entities.filter(e => e instanceof Bulb && e.closed > 0).length;
      Sound.sfx('bulb' + Math.min(4, Math.max(1, n)));
    };
  }

  /* ---------------- diario e medaglie ---------------- */
  if (typeof SIDE_QUESTS !== 'undefined') SIDE_QUESTS.push({ name: 'Una mattina al lago',
    seen: g => g.s.flags.dadInvite || (g.s.flags.fatherFreed && g.visited.has('o:0,2') && dadMorning(g)), done: g => g.s.flags.dadWins,
    hint: 'Di mattina tuo padre pesca al Lago Specchio. Battilo nella gara: il pesce più grosso vince.' });
  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'gara', name: 'Tale padre, tale figlio', desc: 'Batti tuo padre nella gara di pesca.', icon: 'hook', tier: 1, got: g => !!g.s.flags.dadWins });
})();
