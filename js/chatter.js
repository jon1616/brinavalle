'use strict';
/* =====================================================================
 *  CHATTER — Ciclo 45 (Agente A, RIFINITURA): «le voci della valle».
 *  Dopo il primo atto Nina, Marta, Pino, Bortolo, Ortensio, Silvano e la Fata
 *  dicevano sempre le stesse battute per sei capitoli («Guarda il cielo! Prima
 *  arancione, poi azzurro!» anche dopo il terremoto e il palazzo del vento).
 *  Qui ognuno, a ogni nuova tappa della saga, ha UNA novità da raccontare:
 *  la dice la prima volta che gli parli, poi torna alle sue battute di sempre
 *  (il negozio di Bortolo, la pesca di Pino, la catena dei doni restano uguali).
 *  Flag: chat:<id>:<tappa>.
 * ===================================================================== */
const CHAT_STAGES = ['victory', 'partyDone', 'northCall', 'ch2Done', 'ch3Call', 'ch3Done', 'ch4Call', 'ch4Done', 'ch5Call', 'ch5Done', 'ch6Call', 'ch6Done', 'ch7Call', 'ch7Done'];
const chatStage = g => { let st = null; for (const k of CHAT_STAGES) if (g.s.flags[k]) st = k; return st; };
const CHATTER = {
  nina: {
    partyDone: 'Nina: Alla festa ho ballato con tuo papà! Pesta i piedi, ma non dirglielo.',
    northCall: 'Nina: Una nebbia che ruba i ricordi? Io me li scrivo tutti su un quaderno, così non me li ruba nessuno!',
    ch2Done: 'Nina: Quando tira vento da nord si sentono le campane di Pietrabianca. Ho contato: tre campane, tre note!',
    ch3Done: 'Nina: Ho sentito il Cuore cantare! Ho provato a cantare con lui, ma ha smesso. Forse ero stonata.',
    ch4Done: 'Nina: Una stella caduta nel mare, e tu l\'hai rimessa in cielo! Da grande faccio l\'esploratrice e vado a vedere il Faro.',
    ch5Done: 'Nina: Adesso il mare canta? Allora gli canto la canzone delle oche. È l\'unica che so.',
    ch6Call: 'Nina: La piazza si è spaccata in due! La mamma non vuole che mi avvicini, ma io ho guardato giù lo stesso. Là sotto fa caldo!',
    ch6Done: 'Nina: Pietruccio è il mio nuovo amico! Viene da sotto terra e non aveva mai visto una nuvola. Gli sto insegnando i loro nomi.',
    ch7Done: 'Nina: Il vento ha una faccia! L\'ho vista, sull\'aquilone. Mi ha fatto l\'occhiolino. Giuro.',
  },
  marta: {
    partyDone: 'Marta: Che festa! Sono avanzate tre torte. Se passi da casa, una è tua.',
    northCall: 'Marta: Ho una sorella a Pietrabianca. Se vedi una donna col grembiule rosso, dille che le voglio bene. Nebbia o non nebbia.',
    ch2Done: 'Marta: Mia sorella mi ha scritto! Si ricorda di nuovo il mio compleanno. Grazie, Lio.',
    ch3Done: 'Marta: La sera, dal giardino del tempio, si sente cantare. Le galline fanno più uova: giuro.',
    ch5Done: 'Marta: Ho imparato il Canto della Marea da una signora del porto. Lo canto mentre impasto: il pane lievita meglio.',
    ch6Call: 'Marta: Col terremoto mi è caduto mezzo servizio di piatti. Ma i piatti si ricomprano, le persone no: stai attento, laggiù.',
    ch6Done: 'Marta: I minatori di Fondogrotta sono venuti a cena da me. Mangiano come lupi e ridono come bambini. Brava gente.',
    ch7Done: 'Marta: Quella canzone, l\'altra sera... la cantava sempre tua madre, sai? Sotto la mia finestra, tornando dalla collina. Mi mancava.',
  },
  pino: {
    partyDone: 'Pino: Alla festa ho raccontato quattro volte la storia del Luccio Lunare. Alla quarta era lungo come una barca.',
    ch2Done: 'Pino: Con la nebbia via, stamattina il lago era uno specchio. Ho visto il fondo, e il fondo ha visto me.',
    ch4Done: 'Pino: Dicono che sulla costa la marea sale in un battito di ciglia. Qui nel lago, invece, l\'acqua è pigra come me.',
    ch5Done: 'Pino: Da quando il mare ha fatto pace, le trote del lago saltano più in alto. Saranno parenti?',
    ch6Done: 'Pino: Il terremoto ha smosso il fondo del lago: sono venuti a galla tre stivali e una pentola. Nemmeno un pesce.',
    ch7Done: 'Pino: Il vento adesso mi gonfia la vela ogni volta che serve. Credo di stargli simpatico, anche se canto stonato.',
  },
  bortolo: {
    partyDone: 'Bortolo: Alla festa ho venduto tutte le lanterne! Ne ho ordinate altre: il buio non torna, ma non si sa mai.',
    ch2Done: 'Bortolo: A Pietrabianca fanno un formaggio che non aveva più nome: la nebbia se l\'era preso. Adesso si chiama di nuovo «Bianco del Valico».',
    ch4Done: 'Bortolo: Mi sono arrivate conchiglie da Porto Corallo! Bellissime, e nessuno le compra. Ne vuoi una? No? Lo sapevo.',
    ch6Done: 'Bortolo: I minatori di Fondogrotta mi hanno comprato tutte le candele. Dicono che la luce di quassù, all\'inizio, fa male agli occhi.',
    ch7Done: 'Bortolo: Da quando il vento è nostro amico, nessuno compra più lanterne: si riaccendono da sole! Mi manderà in rovina.',
  },
  ortensio: {
    partyDone: 'Ortensio: Ho piantato una fila di fiori davanti a casa vostra, per tuo padre. Non dirgli che sono stato io.',
    ch3Done: 'Ortensio: Ora che il Cuore canta, l\'Albero dell\'Alba fa un fiore nuovo ogni sera. Ne ho contati sette.',
    ch5Done: 'Ortensio: Per sbaglio ho annaffiato il giardino con l\'acqua del mare. Le rose sono diventate azzurre. Il mare fa pace in modi strani.',
    ch6Done: 'Ortensio: Le radici dell\'Albero dell\'Alba scendono fino al cuore della terra. Adesso, quando poto, lo sento battere.',
    ch7Done: 'Ortensio: Il vento porta i semi del giardino per tutta la valle. Fra un anno Brinavalle sarà un giardino solo.',
  },
  silvano: {
    ch2Done: 'Silvano: La nebbia rubava i ricordi. A me, per fortuna, ne ha lasciato uno: il sapore della torta di Marta.',
    ch4Done: 'Silvano: Di notte guardo Vespero dalla mia radura. È tornata al suo posto, ma brilla un po\' di più. Sembra contenta.',
    ch6Done: 'Silvano: Vivo da eremita da quarant\'anni e non sapevo che sotto la valle ci fosse un villaggio intero. Ho dei vicini! Che imbarazzo.',
    ch7Done: 'Silvano: Ieri il vento mi ha riportato il cappello che mio nonno perse sessant\'anni fa. Quel vento non butta via niente.',
  },
  fairy: {
    ch5Done: 'Fata: Il mare ha cantato fin quassù, sai? Per un attimo la mia fonte ha fatto le onde.',
    ch7Done: 'Fata: Una volta ero sola. Adesso il cielo, il mare, la terra e il vento si parlano... e io parlo con tutti loro. Che chiacchiere!',
  },
};

(function installChatter() {
  for (const def of Object.values(ROOMS)) for (const n of def.npcs || []) {
    const lines = CHATTER[n.id]; if (!lines) continue;
    const t0 = n.talk;
    n.talk = function (g) {
      const st = chatStage(g), line = st && lines[st], key = 'chat:' + n.id + ':' + st;
      const orig = t0.call(this, g) || [];
      if (!line || g.s.flags[key]) return orig;
      // se le battute di sempre sono solo frasi, la novità le sostituisce (prima si sentiva la novità e subito dopo «Guarda il cielo!»);
      // se contengono altro (il negozio, la pesca, un dono), la novità viene prima e il resto resta com'è
      const plain = orig.every(x => typeof x === 'string');
      return [g2 => { g2.s.flags[key] = true; }, line, ...(plain ? [] : orig)];
    };
  }
  Object.assign(window, { CHATTER, CHAT_STAGES, chatStage });
})();
