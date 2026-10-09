'use strict';
/* =====================================================================
 *  WEATHER — Ciclo 22 (Agente B, seconda manche): il cielo cambia il gioco.
 *  · PESCA E METEO: con la pioggia trote e carpe risalgono verso riva
 *    (si prendono anche con lanci corti); col temporale perfino il Luccio
 *    si avvicina. Di NOTTE il Luccio Lunare abbocca molto più spesso (al
 *    largo). Pino lo dice nel diario; la scena di pesca mostra pioggia e
 *    notte, e un avviso all'inizio dice "cosa morde oggi".
 *  · I FUOCHI FATUI: dopo la vittoria, di notte, nella Foresta Antica tre
 *    lucine azzurre aspettano Lio. Avvicinandosi fuggono di qualche passo
 *    nel labirinto: seguendole si arriva al BIVACCO DEL PADRE di Lio, con
 *    la sua ultima pagina di diario e un dono. Teodoro ha qualcosa da dire.
 *  Nessuna nuova specie: cambiano solo le probabilità (FISH resta com'è).
 * ===================================================================== */
const BIVOUAC = { room: 'o:0,0', x: 1, y: 6 };   // vicolo cieco a ovest del labirinto

/* peso di una specie in una zona di lancio (0 vicino, 1 medio, 2 lontano), dati cielo e ora */
function fishW(g, sp, zone) {
  let w = sp.w[zone];
  const night = Sky.night(Sky.phase(g)) > 0.5, wet = Sky.rain > 0.4;
  if (sp.id === 'luccio') {
    if (night) w = zone === 2 ? w * 4 : zone === 1 ? 0.12 : 0;
    if (wet && Sky.storm && zone === 1) w += 0.1;
  }
  if (wet && zone < 2) {   // la pioggia porta il cibo a riva, e i pesci grossi lo seguono
    if (sp.id === 'trota') w += zone === 0 ? 1.2 : 0.8;
    if (sp.id === 'carpa') w += zone === 0 ? 0.5 : 0.8;
  }
  return w;
}
/* la frase "cosa morde oggi" (null se il tempo è normale) */
function fishMood(g) {
  const night = Sky.night(Sky.phase(g)) > 0.5, wet = Sky.rain > 0.4;
  if (night && wet) return 'Notte e pioggia: oggi abbocca di tutto!';
  if (night) return 'Di notte il Luccio Lunare caccia al largo...';
  if (wet && Sky.storm) return 'Temporale! I pesci grossi vengono a riva.';
  if (wet) return 'Piove: trote e carpe vengono a riva!';
  return null;
}

/* percorso a tappe nel labirinto, dalla posizione di Lio al bivacco (BFS sulle tessere libere) */
function wispPath(g, fx, fy) {
  const free = (x, y) => x >= 0 && y >= 0 && x < RW && y < RH && g.tiles[y][x] === '.';
  const key = (x, y) => y * RW + x, prev = new Map([[key(fx, fy), -1]]), q = [[fx, fy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === BIVOUAC.x && y === BIVOUAC.y) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (free(nx, ny) && !prev.has(key(nx, ny))) { prev.set(key(nx, ny), key(x, y)); q.push([nx, ny]); }
    }
  }
  let k = key(BIVOUAC.x, BIVOUAC.y);
  if (!prev.has(k)) return [[BIVOUAC.x, BIVOUAC.y]];
  const path = [];
  for (; k !== -1; k = prev.get(k)) path.unshift([k % RW, (k / RW) | 0]);
  return path;
}

const Wisps = {
  on: false, list: [], path: [], stop: 0,
  reset() { this.on = false; this.list = []; this.path = []; this.stop = 0; },
};

(function installWeather() {
  const G = Game;
  const isNight = g => Sky.night(Sky.phase(g)) > 0.5;
  const ptile = p => [Math.floor((p.x + 8) / TS), Math.floor((p.y + 14) / TS)];
  const wispsWanted = g => g.roomId === BIVOUAC.room && g.s.flags.victory && !g.s.flags.bivouac && isNight(g) && !g.rush;

  /* ---------------- la pesca ---------------- */
  G.pickSpecies = function (zone) {
    const ws = FISH.map(sp => fishW(this, sp, zone)), tot = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < FISH.length; i++) { r -= ws[i]; if (r <= 0) return FISH[i]; }
    return FISH[0];
  };
  const startFishing = G.startFishing;
  G.startFishing = function () {
    const r = startFishing.apply(this, arguments);
    const m = fishMood(this);
    if (m) this.fishMsg(m, 200, '#b8d8ff');
    return r;
  };
  /* la scena di pesca: cielo notturno e pioggia, come fuori */
  const drawFishing = G.drawFishing;
  G.drawFishing = function (c) {
    drawFishing.call(this, c);
    if (!FEEL.on) return;
    const n = Sky.night(Sky.phase(this)), t = this.t;
    if (n > 0) {
      c.fillStyle = 'rgba(8,12,40,' + (0.5 * n) + ')'; c.fillRect(0, 0, GW, GH);
      c.globalAlpha = n; c.fillStyle = '#f4f0d8';   // il riflesso della luna
      for (let i = 0; i < 6; i++) c.fillRect(200 - i + ((t >> 4) + i) % 3, 70 + i * 4, 6 + (i % 2) * 4, 1);
      c.globalAlpha = 1;
    }
    if (Sky.rain > 0.05) {
      const k = Math.round(60 * Sky.rain);
      c.fillStyle = 'rgba(190,210,240,0.55)';
      for (let i = 0; i < k; i++) {
        const x = (i * 53 + t * 3) % (GW + 20) - 10, y = (i * 97 + t * 6) % GH;
        c.fillRect(x, y, 1, 4);
        if (i % 4 === 0) c.fillRect((i * 31 + t) % GW, (i * 17) % 150, 2, 1);   // cerchi sull'acqua
      }
    }
  };
  /* Pino lo sa: una riga in più nel diario di pesca */
  if (typeof fishLogLines === 'function') {
    const fl = fishLogLines;
    fishLogLines = function (g) {
      const out = fl.apply(this, arguments);
      if (!g.s.flags.weatherTip) {
        g.s.flags.weatherTip = true;
        out.push('Pino: E ascolta il cielo! Con la pioggia i pesci grossi vengono a riva' +
          (g.s.flags.victory ? ', e di notte il Luccio Lunare esce a caccia.' : '. E dicono che di notte... ma qui è sempre crepuscolo.'));
      }
      return out;
    };
  }

  /* ---------------- i fuochi fatui ---------------- */
  const loadRoom = G.loadRoom;
  G.loadRoom = function () { Wisps.reset(); return loadRoom.apply(this, arguments); };

  function spawn(g) {
    const [px, py] = ptile(g.player);
    const path = wispPath(g, px, py);
    Wisps.path = path; Wisps.on = true;
    // le tre lucine aspettano a 3 passi di distanza l'una dall'altra, la prima non troppo addosso a Lio
    Wisps.stop = Math.min(path.length - 1, 3);
    Wisps.list = [0, 1, 2].map(i => {
      const s = path[Math.min(path.length - 1, Wisps.stop + i * 2)];
      return { x: s[0] * TS + 8, y: s[1] * TS + 8, ph: i * 2.1 };
    });
  }

  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    if (this.state !== 'play' || this.dialog || !this.player) return;
    if (!Wisps.on) { if (wispsWanted(this)) spawn(this); return; }
    if (!wispsWanted(this)) { Wisps.reset(); return; }   // è sorta l'alba: svaniscono
    const P = Wisps.path, last = P.length - 1;
    // le lucine scivolano verso le loro tappe
    Wisps.list.forEach((w, i) => {
      const s = P[Math.min(last, Wisps.stop + i * 2)], tx = s[0] * TS + 8, ty = s[1] * TS + 8;
      w.x += (tx - w.x) * 0.06; w.y += (ty - w.y) * 0.06;
    });
    const lead = Wisps.list[0], px = this.player.x + 8, py = this.player.y + 12;
    const s0 = P[Wisps.stop], settled = Math.hypot(lead.x - s0[0] * TS - 8, lead.y - s0[1] * TS - 8) < 4;   // riparte solo dopo essersi posata
    if (settled && Math.hypot(lead.x - px, lead.y - py) < 22) {
      if (Wisps.stop < last) { Wisps.stop = Math.min(last, Wisps.stop + 4); Sound.sfx('fairy'); }
      else if (Math.hypot(lead.x - px, lead.y - py) < 12) foundBivouac(this);
    }
  };

  function foundBivouac(g) {
    g.s.flags.bivouac = true; Wisps.reset();
    Sound.sfx('secret');
    g.say([
      'Le lucine si posano su un cerchio di pietre annerite, e si spengono. Qualcuno, non molto tempo fa, ha acceso un fuoco qui.',
      'Sotto una pietra piatta, avvolto nella tela cerata: un taccuino. Sulla copertina, un nome che conosci bene.',
      '«Ultima notte nella Foresta. I fuochi fatui mi hanno portato fin qui: non conducono ai tesori, ma a chi li cerca.»',
      '«Se un giorno Lio leggerà queste righe: la valle è tornata a respirare? Allora ho fatto bene a partire. Torno presto.»',
      ...g.giveItem('gems', 50),
      'Hai trovato il BIVACCO DI TUO PADRE. Teodoro dovrebbe saperlo.',
    ]);
    g.saveGame();
  }

  /* disegno: lucine sopra il buio della notte; le braci del bivacco una volta trovato */
  const drawSky = G.drawSky;
  G.drawSky = function (c) {
    drawSky.call(this, c);
    if (this.roomId === BIVOUAC.room && this.s.flags.bivouac) drawBivouac(c, BIVOUAC.x * TS, BIVOUAC.y * TS, this.t);
    if (!Wisps.on) return;
    for (const w of Wisps.list) {
      const t = this.t * 0.07 + w.ph, x = Math.round(w.x + Math.sin(t) * 3), y = Math.round(w.y + Math.cos(t * 1.3) * 2);
      const a = 0.6 + Math.sin(t * 2.3) * 0.25;
      c.globalAlpha = a * 0.35; c.fillStyle = '#5ab8ff'; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill();
      c.globalAlpha = a; c.fillStyle = '#a8e0ff'; c.fillRect(x - 1, y - 1, 3, 3);
      c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 1);
      c.globalAlpha = 1;
    }
  };
  function drawBivouac(c, X, Y, t) {
    c.fillStyle = '#4a4050';   // cerchio di pietre
    for (const [dx, dy] of [[3, 8], [6, 5], [10, 5], [13, 8], [10, 11], [6, 11]]) c.fillRect(X + dx - 1, Y + dy - 1, 3, 2);
    c.fillStyle = '#2a1a14'; c.fillRect(X + 6, Y + 7, 5, 3);
    c.fillStyle = (t >> 4) % 3 ? '#c84a20' : '#f08a30'; c.fillRect(X + 7, Y + 8, 1, 1); c.fillRect(X + 9, Y + 7, 1, 1);
  }

  /* Teodoro riconosce il taccuino */
  const elder = ((ROOMS['i:elder'] && ROOMS['i:elder'].npcs) || []).find(n => n.id === 'teodoro');
  if (elder) {
    const talk = elder.talk;
    elder.talk = function (g) {
      if (g.s.flags.bivouac && !g.s.flags.bivouacTold) {
        return [
          'Teodoro: Questo taccuino... è la scrittura di tuo padre. L\'hai trovato seguendo i fuochi fatui?',
          'Teodoro: Partì la mattina dopo il furto, dicendo che le lucine della Foresta sapevano la strada per la fonte del male. Non lo vedemmo più tornare.',
          'Teodoro: Ma ha scritto «torno presto». E tu, intanto, hai fatto quello che sperava lui. Tienilo stretto, Lio.',
          g2 => { g2.s.flags.bivouacTold = true; g2.saveGame(); },
        ];
      }
      return talk.call(this, g);
    };
  }

  /* la bussola sente il bivacco, ma solo di notte (di giorno non c'è nulla da seguire) */
  const ch = compassHas;
  compassHas = function (g, id) {
    if (id === BIVOUAC.room && g.s.flags.victory && !g.s.flags.bivouac && isNight(g)) return true;
    return ch(g, id);
  };

  if (typeof SIDE_QUESTS !== 'undefined') SIDE_QUESTS.push({ name: 'I fuochi fatui',
    seen: g => g.s.flags.victory && g.visited.has(BIVOUAC.room),
    done: g => g.s.flags.bivouacTold,
    hint: 'Di notte, nella Foresta Antica, qualcosa brilla tra gli alberi. Seguilo, e racconta a Teodoro cosa hai trovato.' });
})();
