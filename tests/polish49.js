'use strict';
/* =====================================================================
 *  CICLO 49 — rifinitura: rilettura dei testi e coerenza della trama.   T49.suite()  (con ?test)
 *  Ogni regola è un fatto della storia che un testo aveva sbagliato (e che non deve tornare).
 * ===================================================================== */
const T49 = {
  RULES: [
    { why: 'il padre è partito TRE LUNE prima dell\'inizio (Teodoro: «Tre lune ad aspettarlo»), non «tanti anni fa»', bad: /Torno presto, Lio[^\n]{0,80}tanti anni fa/ },
    { why: 'Silvano vive nella Radura dell\'Eremita, non in una grotta', bad: /Silvano:[^'\n]*(mia grotta|in una grotta)/ },
    { why: 'Vesper da giovane non è «un vecchio»', bad: /Un vecchio che conta[^\n]{0,80}giovane/ },
    { why: 'Lio è un ragazzo: «Bravo», non «Brava»', bad: /Brava, la mia canzone/ },
    { why: 'italiano: «lasciar tornare la stella», non «lasciare la stella tornare»', bad: /lasciare la stella tornare/ },
    { why: 'un murale INSEGNA la melodia, non fa salire l\'acqua da solo', bad: /un murale fa salire/ },
    // Ciclo 50 (Agente B): la stessa rilettura sulle regioni dell'Agente B
    { why: 'il padre partì LA MATTINA DOPO il furto (windpalace: «la mattina in cui partì per le Radici»), non «una notte così» né correndo quella notte stessa', bad: /Partì proprio una notte così|La notte del furto[^\n]{0,60}Corsi qui/ },
    { why: 'il bivacco del padre ha tre lune, non è di «tanto tempo fa»', bad: /Qualcuno, tanto tempo fa, ha acceso un fuoco/ },
    { why: 'Lio pesca da bambino (walk: il primo pesce): il padre non gli insegnava la canna «tre lune fa»', bad: /Tre lune fa ti insegnavo/ },
    { why: 'il crollo di Fondogrotta è di duecento anni fa: furono gli ANTENATI, non i «nonni», a restare chiusi quaggiù', bad: /Bruna: I nostri nonni (erano|scolpirono)/ },
    { why: 'Coralia è sprofondata più di trecento anni fa (Mareva): non la ricordano i nonni della nonna di Lina', bad: /i suoi nonni suonavano le conchiglie/ },
  ],
  async scan() {
    const files = [...document.scripts].map(s => s.src).filter(s => /\/js\//.test(s)), bad = [];
    for (const f of files) { const t = await (await fetch(f)).text(); for (const r of T49.RULES) if (r.bad.test(t)) bad.push(f.split('/').pop().split('?')[0] + ': ' + r.why); }
    return bad;
  },
  async suite() {
    const res = [];
    try { const bad = await T49.scan(); res.push({ test: 'I fatti della storia corretti nel Ciclo 49 restano giusti in tutti gli script', ok: !bad.length, info: bad.join(' | ') }); }
    catch (e) { res.push({ test: 'I fatti della storia corretti nel Ciclo 49 restano giusti in tutti gli script', ok: false, info: 'ECCEZIONE: ' + e.message }); }
    console.table(res);
    return res;
  },
};
window.T49 = T49;
