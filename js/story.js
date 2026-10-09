'use strict';
/* =====================================================================
 *  STORY — Ciclo 4 (Agente B): il PROLOGO animato che apre una nuova
 *  partita (dal menu del titolo). Racconta il furto del Cuore di Vesper.
 *  Invio salta tutto; Spazio passa alla frase successiva.
 *  Nota: Game.newGame() resta invariata (la usano i test).
 * ===================================================================== */
const PROLOGUE = [   // [inizio, fine, testo] in frame (60 fps)
  [40, 270, 'Un tempo, sulla collina delle Rovine, splendeva un cristallo: il CUORE DI VESPER.'],
  [270, 470, "Ogni mattina la sua luce richiamava l'alba su Brinavalle, e la valle viveva in pace."],
  [470, 720, "Ma il giardiniere del tempio, roso dall'invidia, voleva quella luce tutta per sé..."],
  [720, 980, 'Rubò il Cuore di Vesper. E il crepuscolo, avvolgendolo di spine, ne fece il RE DEI ROVI.'],
  [980, 1200, 'Da allora il sole non sorge più. Sono passate tre lune di crepuscolo eterno.'],
  [1200, 1430, "Nella casa dell'Anziano Teodoro, un ragazzo di nome Lio sta per svegliarsi..."],
];
const PRO_END = 1470, PRO_WALK = [480, 690], PRO_STEAL = 700, PRO_DUSK = [730, 960];

Object.assign(Game, {
  startPrologue() {
    this.state = 'prologue'; this.proT = 0; this.proFlash = 0;
    Sound.music('title');
  },
  updatePrologue() {
    this.proT++;
    const t = this.proT;
    if (t === PRO_STEAL) { Sound.sfx('secret'); this.proFlash = 30; }
    if (t === PRO_DUSK[0] + 30) Sound.sfx('roar');
    if (this.proFlash > 0) this.proFlash--;
    if (Input.hit('start') && t > 20) { this.endPrologue(); return; }
    if (Input.hit('action') && t > 20) {   // salta alla frase successiva
      const next = PROLOGUE.find(([a]) => a > t);
      this.proT = next ? next[0] : PRO_END - 30;
      Sound.sfx('select');
    }
    if (this.proT >= PRO_END) this.endPrologue();
  },
  endPrologue() {
    const saw = this.proT >= PRO_STEAL;   // ha visto almeno il furto del cristallo?
    this.newGame();
    this.s.flags.sawPrologue = saw;   // Teodoro non ripeterà la storia (world.js, i:elder)
  },

  drawPrologue(c) {
    const t = this.proT;
    const dusk = t < PRO_DUSK[0] ? 0 : Math.min(1, (t - PRO_DUSK[0]) / (PRO_DUSK[1] - PRO_DUSK[0]));
    // cielo: dal giorno al crepuscolo (dissolvenza incrociata)
    const sunY = 62 + dusk * 70;   // Ciclo 29: un solo sole che tramonta (prima, nella dissolvenza, se ne vedevano due)
    if (dusk < 1) this.drawLandscape(c, this.t, 1, sunY);
    if (dusk > 0) { c.save(); c.globalAlpha = dusk; this.drawLandscape(c, this.t, 0, sunY); c.restore(); }
    // il Cuore di Vesper sulla cima delle Rovine
    if (t < PRO_STEAL) {
      const by = Math.sin(this.t * 0.06) * 1.5;
      c.fillStyle = 'rgba(255,220,240,' + (0.25 + Math.sin(this.t * 0.08) * 0.08) + ')';
      c.beginPath(); c.arc(47, 102 + by, 14, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 8; i++) {   // raggi di luce
        const a = i / 8 * Math.PI * 2 + this.t * 0.01;
        c.fillStyle = 'rgba(255,240,200,0.35)';
        c.fillRect(Math.round(47 + Math.cos(a) * 20), Math.round(102 + by + Math.sin(a) * 20), 1, 1);
      }
      c.drawImage(SPR.crystal, 41, Math.round(94 + by));
    }
    // il giardiniere che arriva da destra, ruba il cristallo e diventa il Re dei Rovi
    if (t >= PRO_WALK[0]) {
      const k = Math.min(1, (t - PRO_WALK[0]) / (PRO_WALK[1] - PRO_WALK[0]));
      const x = Math.round(150 - k * 84), y = 116;
      if (t < PRO_DUSK[0] + 30) {
        const walking = t < PRO_WALK[1];
        const spr = SPR.people.gardener[walking ? 'left' : 'up'][walking ? (t >> 3) % 4 : 0];
        c.drawImage(silhouetteOf(spr, '#1a0c26'), x, y);
        if (t >= PRO_STEAL) c.drawImage(SPR.crystal, x + 2, y - 14, 12, 16);   // il cristallo rubato, sollevato
      } else {
        const g2 = Math.min(1, (t - PRO_DUSK[0] - 30) / 60), sz = Math.round(16 + g2 * 16);
        c.drawImage(silhouetteOf(SPR.boss[(t >> 4) & 1], '#12081a'), x + 8 - sz / 2, y + 16 - sz, sz, sz);
        if ((t >> 3) % 2) { c.fillStyle = '#ff9030'; c.fillRect(x + 8 - sz * 0.18, y + 16 - sz * 0.6, 2, 1); c.fillRect(x + 8 + sz * 0.1, y + 16 - sz * 0.6, 2, 1); }
      }
    }
    // rovi che crescono dal basso mentre cala il crepuscolo
    if (dusk > 0) {
      for (let i = 0; i < 13; i++) {
        const bx = i * 21 + 4, h = Math.round(dusk * (26 + ((i * 37) % 30)));
        for (let j = 0; j < h; j += 2) {
          const xx = bx + Math.round(Math.sin(j * 0.25 + i) * 3);
          c.fillStyle = '#1e0c22'; c.fillRect(xx, GH - j, 3, 2);
          if (j % 8 === 0) { c.fillStyle = '#c05a90'; c.fillRect(xx + (j % 16 ? 3 : -1), GH - j, 1, 1); }
        }
      }
    }
    if (this.proFlash > 0) { c.fillStyle = 'rgba(255,240,250,' + this.proFlash / 30 + ')'; c.fillRect(0, 0, GW, GH); }
    // fascia per il testo
    c.fillStyle = 'rgba(8,4,16,0.6)'; c.fillRect(0, 150, GW, 42);
    // dissolvenze di ingresso e uscita
    const fade = t < 40 ? 1 - t / 40 : t > PRO_END - 40 ? (t - (PRO_END - 40)) / 40 : 0;
    if (fade > 0) { c.fillStyle = 'rgba(0,0,0,' + fade + ')'; c.fillRect(0, 0, GW, GH); }
  },
  drawPrologueText() {
    const t = this.proT;
    const seg = PROLOGUE.find(([a, b]) => t >= a && t < b);
    if (seg) {
      const a = Math.max(0, Math.min(1, (t - seg[0]) / 25, (seg[1] - t) / 25));
      wrap(seg[2], 232, 12).slice(0, 2).forEach((l, i) => txt(l, 128, 155 + i * 12, { size: 12, align: 'center', color: '#f4ecdc', alpha: a, shadowColor: '#1a0c26' }));
    }
    if (t > 20 && t < PRO_END - 40) txt(isTouch() ? 'A: avanti · MENU: salta' : 'Spazio: avanti · Invio: salta', 250, 3, { size: 9, align: 'right', color: '#c8bcd8', alpha: 0.7 });
  },
});

/* =====================================================================
 *  EPILOGO — Ciclo 6 (Agente B): parte quando Ortensio pianta i cinque
 *  Semi dell'Alba. L'Albero dell'Alba sulla collina, tutti i personaggi
 *  in fila per l'inchino, e i titoli di coda "veri": come è nato il
 *  gioco, un ciclo alla volta. Spazio velocizza, alla fine torna al gioco.
 * ===================================================================== */
const EPILOGUE_LINES = [
  '~ EPILOGO ~', '',
  'Il giardino del tempio tornò a fiorire,',
  "e l'Albero dell'Alba vegliò sulla valle.",
  'Ortensio lo curò ogni giorno: questa volta, per tutti.', '',
  'Pino pescò ancora per molti anni,',
  'Nina diventò la miglior esploratrice della valle,',
  'e la Fata della Brina non fu più sola.', '',
  '~ BRINAVALLE ~', 'Il Cuore di Vesper', '',
  "Un'avventura scritta a quattro mani,",
  'un ciclo alla volta, da due agenti',
  'che si passavano la palla.', '',
  'Ciclo 1 · Agente A · la valle, la spada, il Re dei Rovi',
  'Ciclo 2 · Agente B · la Grotta di Brina e le bombe',
  "Ciclo 3 · Agente A · l'Arpione, l'Abisso, Ortensio",
  "Ciclo 4 · Agente B · prologo, opzioni, Semi dell'Alba",
  'Ciclo 5 · Agente A · sensazione di gioco, duelli misurati',
  'Ciclo 6 · Agente B · la pesca, il Golem, questo epilogo',
  "Ciclo 7 · Agente A · l'Albo d'oro, una partita senza trucchi",
  'Ciclo 8 · Agente B · testi, suoni e mappa rifiniti',
  'Ciclo 9 · Agente A · la Sfida dei Guardiani',
  'Ciclo 10 · Agente B · prestazioni e primi minuti',
  'Ciclo 11 · Agente A · il Crepaccio Gelato, schermo leggero',
  'Ciclo 12 · Agente B · guida, conferme, accoglienza',
  "Ciclo 13 · Agente A · il Diario dell'avventura",
  'Ciclo 14 · Agente B · musica verificata, riepilogo',
  'Ciclo 15 · Agente A · ingressi giusti, salvataggi robusti',
  'Ciclo 16 · Agente B · passaggi, contrasto, Albo rifinito', '',
  '~ SECONDA MANCHE ~',
  'Ciclo 17 · Agente A · il Santuario Sommerso',
  'Ciclo 18 · Agente B · la catena dei doni, la bussola',
  'Ciclo 19 · Agente A · Cocca, il volpacchiotto',
  'Ciclo 20 · Agente B · il Bestiario',
  'Ciclo 21 · Agente A · pioggia, temporali, giorno e notte',
  'Ciclo 22 · Agente B · la pesca col maltempo e i fuochi fatui',
  'Ciclo 23 · Agente A · le Radici del Trono: «torno presto»',
  'Ciclo 24 · Agente B · una mattina al lago, col papà',
  'Ciclo 25 · Agente A · la festa del ritorno',
  'Ciclo 26 · Agente B · due passi con papà',
  'Ciclo 27 · Agente A · il Segnavia',
  'Ciclo 28 · Agente B · il Segnavia conosce le chiavi',
  'Ciclo 29 · Agente A · una partita vera, a mano',
  'Ciclo 30 · Agente B · Capitolo II: la Nebbia Grigia',
  'Ciclo 31 · Agente A · la Torre del Silenzio',
  'Ciclo 32 · Agente B · Capitolo III: le Dune d’Ambra',
  'Ciclo 33 · Agente A · l’Osservatorio di Vesper',
  'Ciclo 34 · Agente B · Capitolo IV: la Stella Caduta',
  'Ciclo 35 · Agente A · la Fossa senza fondo',
  'Ciclo 36 · Agente B · Capitolo V: la Città Sommersa',
  'Ciclo 37 · Agente A · il Tempio delle Maree',
  'Ciclo 38 · Agente B · Capitolo VI: il Battito della Terra',
  'Ciclo 39 · Agente A · il Cuore della Terra',
  'Ciclo 40 · Agente B · Capitolo VII: il Fratello Vento',
  'Ciclo 41 · Agente A · il Palazzo del Vento',
  'Ciclo 42 · Agente B · rifinitura: la saga si chiude',
  'Ciclo 43 · Agente A · i finali alla prova, obiettivi rifiniti',
  'Ciclo 44 · Agente B · le prove ambientali, case e tende',
  'Ciclo 45 · Agente A · le voci della valle',
  'Ciclo 46 · Agente B · le voci delle regioni',
  'Ciclo 47 · Agente A · chi parla, e chi no',
  'Ciclo 48 · Agente B · ogni etichetta decisa',
  'Ciclo 49 · Agente A · rilettura e coerenza',
  'Ciclo 50 · Agente B · la stessa rilettura, nelle mie regioni',
  'Ciclo 51 · Agente A · la Conca col touch',
  'Ciclo 52 · Agente B · ogni casa ha la sua porta',
  'Ciclo 53 · Agente A · niente si perde',
  'Ciclo 54 · Agente B · niente si perde, anche nel Capitolo II',
  'Ciclo 55 · Agente A · nessun dono pigro',
  'Ciclo 56 · Agente B · nessuna attesa a vuoto',
  'Ciclo 57 · Agente A · il Diario e il Bestiario, per intero', '',
  'Parola chiave: AVVENTURA', '',
  'Tempo {time} · Tesori {chests} · Pesci {fish}/5',
  "Grazie per aver giocato fino all'ultimo fiore!",
];
const EPI_SPEED = 0.3, EPI_LH = 10.5;
const EPI_DONE = 60 + (130 + EPILOGUE_LINES.length * EPI_LH + 20) / EPI_SPEED;
const CURTAIN = ['elder', 'merchant', 'kid', 'hero', 'gardener', 'woman', 'fisherman', 'hermit'];

Object.assign(Game, {
  startEpilogue() {
    this.state = 'epilogue'; this.epT = 0;
    Sound.music('village'); Sound.sfx('victory');
  },
  updateEpilogue() {
    this.epT += Input.held('action') ? 4 : 1;
    if (this.epT >= EPI_DONE && (Input.hit('start') || (Input.hit('action') && this.epT > EPI_DONE + 30))) {
      this.state = 'fade'; this.fade = { dir: -1, t: 0, after: false };
      this.pickMusic();
    } else if (Input.hit('start') && this.epT < EPI_DONE) this.epT = EPI_DONE;
  },
  drawEpilogue(c) {
    const t = this.epT;
    this.drawLandscape(c, this.t, 1.2);
    // l'Albero dell'Alba sulla collina, al posto delle rovine buie
    const glow = 0.22 + Math.sin(this.t * 0.04) * 0.06;
    c.fillStyle = 'rgba(255,230,140,' + glow + ')'; c.beginPath(); c.arc(47, 96, 30, 0, Math.PI * 2); c.fill();
    c.drawImage(ICON.dawnTree, 31, 78);
    if (this.t % 9 === 0 && (this.epParts || (this.epParts = [])).length < 40) this.epParts.push({ x: 20 + Math.random() * 60, y: 80 + Math.random() * 20, vx: 0.2 + Math.random() * 0.4, vy: 0.25 + Math.random() * 0.2, c: Math.random() < 0.5 ? '#ffb0d0' : '#ffe878' });
    for (const p of this.epParts || []) { p.x += p.vx + Math.sin(this.t * 0.05 + p.y) * 0.2; p.y += p.vy; c.fillStyle = p.c; c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    if (this.epParts) this.epParts = this.epParts.filter(p => p.y < 132 && p.x < GW);   // Ciclo 36: i petali svaniscono prima della riga «Premi SPAZIO» (y 138): un petalo giallo sotto la scritta la rendeva illeggibile (T16, 1 volta su 4)
    // velo per leggere i titoli
    c.fillStyle = 'rgba(20,10,40,0.6)'; c.fillRect(0, 0, GW, 140);   // Ciclo 16: velo più scuro (contrasto dei titoli 1,6 → misurato col test T16)
    // l'inchino finale: tutti i personaggi in fila sull'erba
    c.fillStyle = '#3a6a3a'; c.fillRect(0, 150, GW, 42);
    c.fillStyle = '#4f8a3a'; for (let x = 0; x < GW; x += 5) c.fillRect(x, 150 + (x % 3), 2, 2);
    const cast = CURTAIN.concat(this.s.flags.fatherFreed ? ['father'] : []), gap = Math.min(26, 188 / (cast.length - 1));   // Ciclo 25: il padre di Lio all'inchino, se è tornato
    cast.forEach((k, i) => {
      const x = 24 + Math.round(i * gap), hop = Math.max(0, Math.sin(this.t * 0.08 - i * 0.7)) * 3;
      drawShadow(c, x + 8, 175, 10);
      c.drawImage(SPR.people[k].down[0], x, Math.round(160 - hop));
    });
    drawFairy(c, 236, 160 + Math.sin(this.t * 0.06) * 3, this.t);
    if (t < 50) { c.fillStyle = 'rgba(255,255,255,' + (1 - t / 50) + ')'; c.fillRect(0, 0, GW, GH); }
  },
  drawEpilogueText() {
    const t = this.epT, s = this.s, ch = allChests();
    const fish = FISH.filter(sp => (s.fishLog || {})[sp.id]).length;
    const y0 = 130 - (t - 60) * EPI_SPEED;
    EPILOGUE_LINES.forEach((l0, i) => {
      const y = y0 + i * EPI_LH;
      if (t < 60 || y < -12 || y > 136) return;
      const l = l0.replace('{time}', fmtTime(s.time)).replace('{chests}', ch.filter(id => s.flags['chest:' + id]).length + '/' + ch.length).replace('{fish}', fish);
      const big = l.startsWith('~'), cyc = l.startsWith('Ciclo');
      const a = Math.max(0, Math.min(1, (y + 8) / 24, (136 - y) / 14));
      txt(l, 128, y, { align: 'center', size: big ? 13 : cyc ? 10 : 11, color: big ? '#ffd870' : cyc ? '#d8e8ff' : '#ffffff', alpha: a, shadowColor: '#2a1040' });
    });
    if (t >= EPI_DONE && (this.t >> 5) % 2) txt('Premi ' + (isTouch() ? 'A' : 'SPAZIO') + ' per tornare a Brinavalle', 128, 138, { align: 'center', size: 11, color: '#ffe8a0', shadowColor: '#2a1040' });
    else if (t < EPI_DONE) txt((isTouch() ? 'A' : 'Spazio') + ': più veloce', 250, 182, { size: 9, align: 'right', color: '#e8f0d8', alpha: 0.8 });
  },
});
