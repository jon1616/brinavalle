'use strict';
/* =====================================================================
 *  CHATTER2 — Ciclo 46 (Agente B, RIFINITURA): «le voci delle regioni».
 *  Il Ciclo 45 (Agente A) ha rimesso al passo i personaggi della valle. Lo stesso
 *  difetto c'era nelle MIE regioni: Berta, Nadira, Marisa, Mareva, Bruna, Aliseo...
 *  dopo il loro capitolo restavano ferme, come se la storia non fosse andata avanti.
 *  Qui ognuno ha una novità per le tappe successive alla sua (stesso meccanismo di
 *  chatter.js: la dice una volta, poi tornano le battute di sempre; menu, doni e
 *  servizi restano). Flag: chat:<id>:<tappa>.
 * ===================================================================== */
const CHATTER2 = {
  berta: {
    ch4Done: 'Berta: Da Porto Corallo è arrivato un carico di pesce salato. Dicono che il Faro l\'hai riacceso tu. C\'è qualcosa che non sai fare?',
    ch6Done: 'Berta: Il terremoto si è sentito fin quassù: la neve è scivolata giù da tutti i tetti insieme. Tobi era felicissimo.',
    ch7Done: 'Berta: Ieri il vento ha suonato le nostre campane da solo. Una melodia che non conoscevamo... Gualtiero si è commosso.',
  },
  tobi: {
    ch3Done: 'Tobi: Ho fatto un pupazzo di neve e l\'ho chiamato Lio. Ha la spada di legno!',
    ch6Done: 'Tobi: Quando la terra tremava, sotto la neve si sentiva un tum-tum. Come un cuore! Adesso non si sente più.',
    ch7Done: 'Tobi: Folata, da Ventaria, mi ha mandato un aquilone col vento! È atterrato sul campanile. Gualtiero non era contento.',
  },
  rufo: {
    ch5Done: 'Rufo: Da oggi c\'è anche la zuppa di pesce! Il mare ha fatto pace, dicono, e i pescatori di Porto Corallo ci mandano il meglio.',
    ch7Done: 'Rufo: Il vento entra dal camino e sembra canticchiare. Ai clienti piace. Lo lascio entrare.',
  },
  ilde_n: {
    ch4Done: 'Ilde: Corro tra Pietrabianca e Brinavalle due volte a settimana. Ogni volta qualcuno mi chiede di te.',
    ch7Done: 'Ilde: Adesso porto lettere da tutta la valle: dal deserto, dal mare, perfino da sotto terra. Le tue avventure fanno girare il mondo.',
  },
  nadira: {
    ch4Done: 'Nadira: Le carovane dicono che una stella è tornata in cielo. Stanotte le abbiamo contate: ci sono tutte.',
    ch6Done: 'Nadira: Le dune hanno tremato per tre giorni, poi si sono calmate. La sabbia sa ascoltare, come noi.',
    ch7Done: 'Nadira: Il vento del deserto è cambiato: porta voci da lontano. Ieri, in mezzo alle dune, ho sentito il mare.',
  },
  orsa: {
    ch4Done: 'Orsa: Vespero è tornata al suo posto. L\'ho vista sorgere stanotte, più luminosa di prima. Grazie, ragazzo.',
    ch7Done: 'Orsa: Il cielo, il mare, la terra, il vento... e in mezzo, la tua valle. Vesper sarebbe fiero. Anzi: lo è.',
  },
  sesto: {
    ch5Done: 'Sesto: Devo rifare tutte le mappe! Una città intera è spuntata dal mare, e nessuno me l\'aveva detto.',
    ch7Done: 'Sesto: Adesso mi servirebbe una mappa del cielo. Isole di nuvole, dici? Prendo il carboncino.',
  },
  lu: {
    ch6Done: 'Lu: Durante il terremoto gli scorpioni si sono nascosti tutti. Anche io, sotto il carro.',
  },
  ugo: {
    ch5Done: 'Ugo: Il mare è tornato gentile. La lente canticchia due note, adesso: la sua e quella delle conchiglie.',
    ch7Done: 'Ugo: Stanotte il vento è salito fin quassù e ha fatto girare la luce del faro da solo. Lo lascio fare: è più bravo di me.',
  },
  pescatore: {
    ch5Done: 'Pescatore: Le barche escono di nuovo, e le reti tornano piene. Il mare ha deciso di volerci bene.',
  },
  marisa: {
    ch6Done: 'Marisa: La terra ha tremato anche qui, ma il mare è rimasto calmo. Credo che si siano parlati.',
    ch7Done: 'Marisa: Il vento porta le nostre vele più lontano che mai. Pino dice che è merito tuo, e io dico che ha ragione.',
  },
  mareva: {
    ch6Done: 'Mareva: Il cuore della terra ha battuto fin quaggiù, nel fondo del mare. Seicento anni, e non l\'avevo mai sentita così felice.',
    ch7Done: 'Mareva: Il vento mi ha portato una canzone che non sentivo da tanto. La cantava una donna sulla collina... tua madre, vero?',
  },
  bruna: {
    ch7Done: 'Bruna: Il vento è sceso fin quaggiù, nelle gallerie, e ha spento e riacceso tutti i bracieri, uno per uno. Come un saluto.',
  },
  ferro: {
    ch7Done: 'Ferro: Mi è caduta una girandola dal cielo! L\'ho appesa sulla fucina: gira col calore del fuoco.',
  },
  pietruccio: {
    ch7Done: 'Pietruccio: Ho visto il cielo! Nina mi ha portato su. È azzurro e non finisce mai. Avevi ragione tu.',
  },
  aliseo: {
    ch7Done: 'Aliseo: Il nostro vecchio amico adesso sorride a tutti. Le pale del mulino girano a tempo di canzone.',
  },
  zefira: {
    ch7Done: 'Zefira: Sto cucendo un aquilone per ogni villaggio della tua storia: Pietrabianca, Porto Corallo, Fondogrotta... e Brinavalle, il più grande.',
  },
  folata: {
    ch7Done: 'Folata: Ho mandato un aquilone giù a Pietrabianca! Il vento ha detto che lo portava lui. Speriamo.',
  },
};

(function installChatter2() {
  if (typeof chatStage !== 'function') return;
  for (const def of Object.values(ROOMS)) for (const n of def.npcs || []) {
    const lines = CHATTER2[n.id]; if (!lines) continue;
    const t0 = n.talk;
    n.talk = function (g) {
      const st = chatStage(g), line = st && lines[st], key = 'chat:' + n.id + ':' + st;
      const before = JSON.stringify(g.s.flags);
      const orig = t0.call(this, g) || [];
      if (!line || g.s.flags[key]) return orig;
      // come in chatter.js: solo frasi → la novità le sostituisce; altrimenti viene prima. In più: se le battute di sempre
      // hanno appena fatto scattare un flag (una battuta «una volta sola», es. Marisa e Ugo dopo la Fossa), NON si sostituiscono,
      // se no quella battuta andrebbe persa per sempre (l'ha trovato T46)
      const plain = orig.every(x => typeof x === 'string') && JSON.stringify(g.s.flags) === before;
      return [g2 => { g2.s.flags[key] = true; }, line, ...(plain ? [] : orig)];
    };
  }
  window.CHATTER2 = CHATTER2;   // separato da CHATTER: i test del Ciclo 45 percorrono quello, con i loro personaggi
})();
