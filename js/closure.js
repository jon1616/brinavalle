'use strict';
/* =====================================================================
 *  CLOSURE — Ciclo 42 (Agente B): la saga si chiude qui.
 *  Dal Ciclo 42 l'utente ha chiesto di smettere di espandere il gioco e di
 *  rifinire quello che c'è. Il Capitolo VII finiva con un aggancio («il vento
 *  porta la canzone oltre le montagne a est... e laggiù qualcuno risponde»):
 *  non apriamo un Capitolo VIII, ma chiudiamo con garbo.
 *  · Dopo il ritorno in piazza (ch7Home), il padre parla una volta di quella
 *    voce, e di una lanterna lasciata accesa alla finestra, verso est.
 *  · L'obiettivo, da lì in poi, dice che l'avventura è conclusa.
 *  Flag: lanternEast.
 * ===================================================================== */
(function installClosure() {
  if (typeof FATHER_NPC !== 'undefined') {
    const ft = FATHER_NPC.talk;
    FATHER_NPC.talk = function (g) {
      const f = g.s.flags;
      if (f.ch7Home && !f.lanternEast) return [
        'Papà: L\'hai sentita anche tu, vero? Quella voce, da est. Ha cantato la canzone fino in fondo... anche l\'ultima strofa, quella che sapeva solo lei.',
        'Papà: Non so chi sia, Lio. Non so nemmeno se voglio saperlo, stanotte. So solo che la canzone di tua madre adesso è dappertutto: nel vento, nel mare, nella terra, nel cielo.',
        'Papà: Un giorno, forse, passeremo quelle montagne insieme, tu e io. Ma non stasera.',
        'Papà: Stasera mettiamo una lanterna accesa sulla finestra, quella che guarda a est. Se qualcuno, laggiù, conosce la canzone... saprà trovare la strada di casa.',
        g2 => { g2.s.flags.lanternEast = true; g2.saveGame(); },
      ];
      return ft.call(this, g);
    };
  }
  const co = currentObjective;
  currentObjective = function (g) {
    const f = g.s.flags;
    if (f.ch7Home && !f.lanternEast) return 'La canzone di tua madre è arrivata oltre le montagne, e qualcuno ha risposto. Parla con tuo padre, in piazza.';
    if (f.lanternEast) return 'La tua avventura è compiuta. Una lanterna resta accesa alla finestra, verso est. La valle è tua: esplorala!';
    return co(g);
  };
  window.currentObjective = currentObjective;
  if (typeof objectiveRoom === 'function') {
    const or0 = objectiveRoom;
    objectiveRoom = function (g) { const f = g.s.flags; if (f.ch7Home && !f.lanternEast) return 'o:1,2'; if (f.lanternEast) return null; return or0(g); };
    window.objectiveRoom = objectiveRoom;
  }
  if (window.CHAPTERS7 && CHAPTERS7.length < 9) CHAPTERS7.push({ name: 'Una lanterna verso est', done: g => !!g.s.flags.lanternEast });
})();
