'use strict';
/* =====================================================================
 *  CICLO 47 — rifinitura: chi parla nei dialoghi.   T47.suite()  (con ?test)
 *  Il gioco mostra come «nome di chi parla» quello che c'è prima dei due punti.
 *  Ma «Inciso: «...»», «Da dietro la porta: TUM...», «Il Vento, piano: «...»» non sono personaggi.
 * ===================================================================== */
const T47 = {
  SPEAKERS: ['Teodoro', 'Papà', 'Nina', 'Marta', 'Pino', 'Bortolo', 'Ortensio', 'Silvano', 'Fata', 'Madre delle Acque', 'Il Vento', 'La Terra', 'Il cielo', 'Il mare', 'Vesper', 'Elva', 'Marisa', 'Lina', 'Ugo', 'Mareva', 'Guscetto', 'Bruna', 'Ferro', 'Pietruccio', 'Aliseo', 'Zefira', 'Folata', 'Gualtiero', 'Berta', 'Tobi', 'Rufo', 'Ilde', 'Nadira', 'Orsa', 'Sesto', 'Lu', 'Pescatore', 'Re dei Rovi', 'Suggerimento', '???'],
  NARRATION: ['Inciso', 'Inciso nel bronzo', 'Inciso nella pietra', 'Inciso sul pilastro', 'Inciso sulla roccia', 'Cartello', 'Da dietro la porta', 'Ora tocca a te', 'Un murale', 'Sul basamento', 'Sul pilastro', 'Spostati di lato', 'Seconda pagina', 'Sono RICORDI', 'Sono tutti pieni', 'Torna a Brinavalle', 'La lente si accende', 'Le conchiglie', 'Ha deciso', 'Il Vento, piano'],
  speakerOf(text) { Game.dialog = null; Game.say([text]); const sp = Game.dialog && Game.dialog.speaker; Game.dialog = null; return sp; },
  suite() {
    const res = [];
    const check = (name, fn) => { try { const r = fn(); res.push({ test: name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { res.push({ test: name, ok: false, info: 'ECCEZIONE: ' + e.message }); } };
    check('I personaggi veri restano «chi parla» (etichetta col nome)', () => {
      const bad = T47.SPEAKERS.filter(n => T47.speakerOf(n + ': prova.') !== n);
      return bad.length ? bad.join(', ') : true;
    });
    check('Cartelli, incisioni e narrazione non mostrano più un falso nome («Inciso», «Da dietro la porta»...), e il testo resta intero', () => {
      const bad = T47.NARRATION.filter(n => { const sp = T47.speakerOf(n + ': prova.'); return sp; });
      Game.say(['Inciso: «LE NUVOLE»']); const whole = Game.dialog && Game.dialog.pages[0].join(' '); Game.dialog = null;
      return bad.length ? bad.join(', ') : /^Inciso: «LE NUVOLE»/.test(whole) ? true : 'testo: ' + whole;
    });
    check('Tutte le battute dei personaggi della valle e del finale hanno ancora il loro nome', () => {
      const lines = [...Object.values(CHATTER), ...(window.CHATTER2 ? Object.values(CHATTER2) : [])].flatMap(o => Object.values(o));
      const bad = lines.filter(t => /^[A-ZÀ-Ý][a-zà-ý]+( [a-zà-ý]+)*( [A-ZÀ-Ý][a-zà-ý]+)?: /.test(t) && !T47.speakerOf(t)).map(t => t.slice(0, 30));
      return bad.length ? bad.slice(0, 5).join(' | ') : true;
    });
    Game.state = 'title';
    console.table(res);
    return res;
  },
};
window.T47 = T47;
