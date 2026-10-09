'use strict';
/* =====================================================================
 *  TEST DEL CICLO 48 (Agente B) — RIFINITURA: «chi parla», per sempre.
 *  Il Ciclo 47 (Agente A) ha tolto le etichette ai falsi personaggi con un elenco di
 *  parole di narrazione (NOT_SPEAKER). Limite dichiarato: una frase nuova come
 *  «Dietro il muro: ...» avrebbe di nuovo l'etichetta. Questo test legge TUTTI gli
 *  script del gioco, estrae ogni etichetta che il gioco mostrerebbe come «chi parla»
 *  e la confronta con due elenchi:
 *    · SPEAKERS   — i personaggi (e le voci) che parlano davvero;
 *    · NOT_DIALOG — testi con i due punti che non finiscono in un dialogo
 *                   (interfaccia, obiettivi, schede del Bestiario, messaggi della pesca...).
 *  Un'etichetta nuova fa fallire il test: chi la scrive decide se è un personaggio
 *  (aggiungila a SPEAKERS) o narrazione (aggiungi la parola a NOT_SPEAKER in game.js).
 *  T48.suite()  (con ?test)
 * ===================================================================== */
const T48 = {
  SPEAKERS: ['Teodoro', 'Papà', 'Pino', 'Bortolo', 'Nina', 'Marta', 'Silvano', 'Ortensio', 'Fata', 'Re dei Rovi', '???', 'Tutti', 'Suggerimento',
    'Berta', 'Tobi', 'Ilde', 'Rufo', 'Gualtiero', 'Elva', 'Lu', 'Nadira', 'Sesto', 'Orsa', 'Vesper', 'Vespero',
    'Pescatore', 'Lina', 'Marisa', 'Ugo', 'Guscetto', 'Mareva', 'Madre delle Acque', 'Pietruccio', 'Bruna', 'Ferro',
    'La Terra', 'Il cielo', 'Il mare', 'Zefira', 'Folata', 'Aliseo', 'Vento', 'Il Vento'],
  NOT_DIALOG: ['Esplora le Rovine', 'Abisso', 'Nemico sconosciuto', 'Diario', 'Stanza inesistente', 'Facile', 'Normale', 'Eroe', 'Nessuna freccia', 'Frecce',
    'Stai usando', 'Parla con tutti', 'B', 'X', 'A', 'Q', 'Tempo', 'Tesori trovati', 'Spazio', 'Parola chiave', 'Vittorie', 'Record', 'Frecce su/giù',
    'Non si distruggono', 'La spada rimbalza', 'Sconfitto', 'Notte e pioggia', 'Piove', 'Gara col papà', 'Il tuo', 'Il mio', 'Lanci', 'Eremita',
    'Capitolo I', 'Capitolo II', 'Capitolo III', 'Capitolo IV', 'Capitolo V', 'Capitolo VI', "L'eco è salita", 'Marea', 'Conca', 'Non si combatte'],
  /* tutte le etichette nei testi degli script del gioco (lettura sincrona: siamo in ?test) */
  labels() {
    const out = {};
    for (const src of [...document.scripts].map(s => s.src).filter(s => /\/js\//.test(s))) {
      const x = new XMLHttpRequest(); x.open('GET', src, false); x.send(); const code = x.responseText, file = src.split('/').pop().split('?')[0];
      const re = /(['"`])((?:\\.|(?!\1).)*)\1/g; let m;
      while ((m = re.exec(code))) {
        const s = m[2].replace(/\\'/g, "'"), k = /^([A-ZÀ-Ý?][^:]{0,18}):\s(.*)$/s.exec(s);
        if (!k || NOT_SPEAKER.test(k[1])) continue;
        (out[k[1]] = out[k[1]] || new Set()).add(file);
      }
    }
    return out;
  },
  suite() {
    const res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('Ogni etichetta «chi parla» nei testi è un personaggio noto o un testo che non è un dialogo (nessuna etichetta nuova non decisa)', () => {
      const L = T48.labels(), known = new Set([...T48.SPEAKERS, ...T48.NOT_DIALOG]);
      const unknown = Object.entries(L).filter(([k]) => !known.has(k)).map(([k, v]) => '«' + k + '» in ' + [...v].join(','));
      return unknown.length ? 'etichette da decidere: ' + unknown.slice(0, 6).join(' | ') : true;
    });
    check('Le frasi di narrazione trovate nel Ciclo 48 non hanno più l\'etichetta', () => {
      const bad = ['Le Secche sono scogli e banchi di sabbia.', 'È la voce del CIELO: la nota che il cielo canta.', 'Mancano: il Geode, la Vena.']
        .filter(s => { const k = /^([A-ZÀ-Ý?][^:]{0,18}):\s(.*)$/s.exec(s); return k && !NOT_SPEAKER.test(k[1]); });
      return bad.length ? bad.join(' | ') : true;
    });
    check('I personaggi veri (anche quelli delle regioni) hanno ancora l\'etichetta', () => {
      const bad = T48.SPEAKERS.filter(n => NOT_SPEAKER.test(n));
      return bad.length ? bad.join(', ') : true;
    });
    console.table(res);
    return res;
  },
};
window.T48 = T48;
