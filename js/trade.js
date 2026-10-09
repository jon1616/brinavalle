'use strict';
/* =====================================================================
 *  TRADE — Ciclo 18 (Agente B): LA CATENA DEI DONI.
 *  Una sequenza di scambi tra gli abitanti della valle (classica delle
 *  avventure alla Zelda): Marta → Silvano → Pino → Bortolo → Teodoro.
 *  Ogni dono porta una piccola storia; alla fine Lio riceve la
 *  BUSSOLA DEI SEGRETI, che sulla mappa della pausa segna ✦ le stanze
 *  dove c'è ancora qualcosa da trovare (anche quelle segrete).
 *  Epilogo della catena: Silvano e Pino fanno pace e si ritrovano al lago.
 *  Non riscrive i dialoghi: AVVOLGE la funzione talk degli NPC esistenti.
 *  Stato: g.s.flags.trade = numero di doni consegnati (0..5).
 * ===================================================================== */
const TRADE_STEPS = [
  { npc: 'marta', room: 'o:1,2', give: 'torta', ready: g => g.s.items.sword, lines: [
    "Marta: Lio! Ho sfornato una torta di mirtilli per Silvano, l'eremita della radura. Ogni inverno gliene portavo una...",
    'Marta: Ma con i mostri in giro non oso più uscire dal villaggio. Gliela porteresti tu? La radura è a nord-est, oltre il Bosco dei Rovi.',
  ] },
  { npc: 'silvano', room: 'o:2,0', give: 'lettera', then: true, lines: [
    'Silvano: Questo profumo... è la torta di Marta! Allora non si è dimenticata di questo vecchio brontolone.',
    "Silvano: Senti, ragazzo. Trent'anni fa ho litigato con Pino, il pescatore, per una sciocchezza. Da allora non ci siamo più parlati.",
    'Silvano: Ho scritto questa lettera mille volte, e mille volte non l’ho spedita. Portagliela tu: io non ne ho il coraggio.',
  ] },
  { npc: 'pino', room: 'o:0,2', give: 'perla', then: true, lines: [
    "Pino: Una lettera di Silvano? Dopo trent'anni?",
    'Pino legge in silenzio. Poi si asciuga gli occhi con la manica.',
    'Pino: Quel vecchio testardo... Litigammo per chi avesse pescato la perla più bella. Lui me la lasciò per ripicca, e non l’ho mai voluta.',
    'Pino: Portala a Bortolo: lui sa lavorare le cose preziose. E di’ a Silvano che lo aspetto al lago.',
  ] },
  { npc: 'bortolo', room: 'i:shop', give: 'ago', then: true, lines: [
    'Bortolo: Per tutte le gemme! Una perla del Lago Specchio, e che perla!',
    "Bortolo: Non la vendo, no: ne farò un ago. L'ago di una bussola che non segna il nord... ma ciò che è nascosto.",
    "Bortolo: Il quadrante però ce l'ha Teodoro: era di tuo padre. Portagli l'ago, saprà lui cosa fare.",
  ] },
  { npc: 'teodoro', room: 'i:elder', give: 'compass', lines: [
    "Teodoro: Un ago di perla? Allora Bortolo si è ricordato della bussola di tuo padre.",
    'Teodoro: Tuo padre esplorava ogni angolo della valle con questa. Diceva che i segreti hanno un richiamo, se sai ascoltarlo.',
    "Teodoro monta l'ago sul vecchio quadrante d'ottone. L'ago trema, poi gira lentamente...",
  ] },
];
const TRADE_HINTS = [
  'Marta, al villaggio, ha bisogno di un favore.',
  "Porta la torta di Marta all'eremita Silvano, nella radura a nord-est.",
  'Porta la lettera di Silvano a Pino, al Lago Specchio.',
  'Porta la perla di Pino a Bortolo, nella sua bottega.',
  "Porta l'ago di perla a Teodoro, nella sua casa.",
  'Fatto! La Bussola dei Segreti segna ✦ sulla mappa della pausa dove resta qualcosa da trovare.',
];

Object.assign(ITEMS, {
  torta: { name: 'Torta di mirtilli', text: 'Hai ricevuto la TORTA DI MIRTILLI di Marta. È ancora tiepida!' },
  lettera: { name: 'Lettera sigillata', text: 'Hai ricevuto una LETTERA SIGILLATA di Silvano, per Pino il pescatore.' },
  perla: { name: 'Perla del lago', text: 'Hai ricevuto la PERLA DEL LAGO di Pino. Bortolo saprà cosa farne.' },
  ago: { name: 'Ago di perla', text: "Hai ricevuto un AGO DI PERLA, sottile come un raggio di luna. Il quadrante ce l'ha Teodoro." },
  compass: { name: 'Bussola dei Segreti', text: 'Hai ottenuto la BUSSOLA DEI SEGRETI! Nel menu di pausa la mappa segna ✦ dove resta ancora qualcosa da trovare, anche nelle stanze segrete.' },
});

/* --- icone (stile di gfx.js: righe di caratteri + tavolozza) --- */
(function tradeIcons() {
  const mk = (rows, pal) => spriteFromRows(rows, Object.assign({ o: '#1a1420' }, pal));
  ICON.torta = mk(['..ooo..', '.oyyyo.', 'oyryryo', 'oyyyyyo', 'obbbbbo', '.ooooo.'], { y: '#e8b060', r: '#5a3a9a', b: '#a06a30' });
  ICON.lettera = mk(['oooooooo', 'owwwwwwo', 'oowwwwoo', 'owowwowo', 'owwrrwwo', 'owwwwwwo', 'oooooooo'], { w: '#f4ecdc', r: '#c83040' });
  ICON.perla = mk(['..ooo..', '.owwwo.', 'owwwpwo', 'owpppwo', '.opppo.', '..ooo..'], { w: '#ffffff', p: '#d8d0f0' });
  ICON.ago = mk(['......o', '.....ow', '....owo', '...owo.', '..owo..', '.owo...', 'owo....', 'oo.....'], { w: '#e8e8ff' });
  ICON.compass = mk(['..ooo..', '.oyyyo.', 'oywrwyo', 'oywowyo', 'oywbwyo', '.oyyyo.', '..ooo..'], { y: '#d8a840', w: '#f4ecdc', r: '#e83850', b: '#3a5ac8' });
})();

/* --- la bussola: cosa resta da trovare in una stanza --- */
function compassHas(g, id) {
  const def = ROOMS[id], f = g.s.flags;
  if (!def) return false;
  if (def.secret && !g.visited.has(id)) return true;
  if ((def.chests || []).some(c => !f['chest:' + c.id])) return true;
  if ((def.seeds || []).some(sd => !f['seed:' + sd.id])) return true;
  return false;
}
/* stelletta dorata che pulsa (coordinate pixel del buffer) */
function drawCompassStar(c, x, y, t) {
  const on = (t >> 3) % 4 !== 0;
  c.fillStyle = '#0a0612'; c.fillRect(x - 2, y - 2, 5, 5);
  c.fillStyle = on ? '#fff0a0' : '#c8a040';
  c.fillRect(x, y - 2, 1, 5); c.fillRect(x - 2, y, 5, 1);
  c.fillStyle = on ? '#c8a040' : '#8a6a20';   // punte diagonali: una scintilla, non un "+"
  c.fillRect(x - 1, y - 1, 1, 1); c.fillRect(x + 1, y - 1, 1, 1); c.fillRect(x - 1, y + 1, 1, 1); c.fillRect(x + 1, y + 1, 1, 1);
  if (on) { c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 1); }
}

(function installTrade() {
  const G = Game;
  const step = g => g.s.flags.trade || 0;
  const findNpc = (room, id) => ((ROOMS[room] && ROOMS[room].npcs) || []).find(n => n.id === id);

  /* avvolge il dialogo degli NPC della catena: al loro turno parlano del dono, altrimenti come sempre */
  TRADE_STEPS.forEach((st, k) => {
    const n = findNpc(st.room, st.npc);
    if (!n) return;
    const talk = n.talk;
    n.talk = function (g) {
      if (step(g) === k && (!st.ready || st.ready(g))) {
        const prev = k > 0 ? TRADE_STEPS[k - 1].give : null;
        return st.lines.concat([
          g2 => { if (prev) g2.s.items[prev] = false; g2.s.flags.trade = k + 1; },
          ...g.giveItem(st.give),   // Ciclo 55 (Agente A): dono creato subito, così resume.js lo dà anche se si salva prima del suo turno
          ...(k === TRADE_STEPS.length - 1 ? ["Teodoro: Ecco. Ora è tua, Lio. Che ti mostri tutto ciò che la valle nasconde ancora."] : []),
          // poi il dialogo di sempre (il dono di benvenuto di Silvano, il menu di pesca di Pino, la bottega di Bortolo)
          ...(st.then ? [g2 => talk.call(this, g2)] : []),
        ]);
      }
      return talk.call(this, g);
    };
  });

  /* Silvano e Pino fanno pace: a catena finita Silvano lascia la radura e pesca con Pino al lago */
  const silv = findNpc('o:2,0', 'silvano');
  if (silv) {
    const cond0 = silv.cond;
    silv.cond = g => step(g) < 5 && (!cond0 || cond0(g));
    const lake = ROOMS['o:0,2'];
    lake.npcs = lake.npcs || [];
    lake.npcs.push({ id: 'silvano_lago', sprite: 'hermit', x: 13, y: 3, cond: g => step(g) >= 5, talk: g => {
      const n = (g.s.flags.silvanoLake = (g.s.flags.silvanoLake || 0) + 1);
      const usual = silv.talk(g);   // i suoi consigli di sempre (e il dono, se non l'aveva ancora dato)
      if (n === 1) return [
        "Silvano: Lio! Pino e io abbiamo fatto pace. Trent'anni buttati per una perla... che alla fine è diventata la tua bussola.",
        'Silvano: Ora pesco qui con lui, ogni mattina. Il lago è più bello in due.',
      ].concat(usual);
      return usual;
    } });
  }

  /* la bussola "vibra" entrando in una stanza che nasconde ancora qualcosa (una volta per stanza a sessione) */
  const afterEnter = G.afterEnter;
  G.compassFelt = new Set();
  G.afterEnter = function () {
    const r = afterEnter.apply(this, arguments);
    if (this.s.items.compass && !this.rush && compassHas(this, this.roomId) && !this.compassFelt.has(this.roomId) && !this.dialog) {
      this.compassFelt.add(this.roomId);
      this.banner = { text: '✦ La bussola vibra: qui c’è ancora qualcosa', t: 120 };
      Sound.sfx('fairy');
    }
    return r;
  };

  /* Diario e Albo d'oro */
  if (typeof SIDE_QUESTS !== 'undefined') SIDE_QUESTS.push({
    name: 'La catena dei doni', seen: g => step(g) >= 1, done: g => !!g.s.items.compass,
    prog: g => step(g) + '/5',
    get hint() { return TRADE_HINTS[Math.min(5, step(Game))]; },
  });
  if (typeof MEDALS !== 'undefined') MEDALS.push({ id: 'bussola', name: 'Il viandante', desc: 'Completa la catena dei doni fino alla Bussola.', icon: 'compass', tier: 0, got: g => g.s.items.compass });
})();
