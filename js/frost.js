'use strict';
/* =====================================================================
 *  FROST — Ciclo 11 (Agente A): il CREPACCIO GELATO e la TUNICA DI BRINA.
 *  Una stanza segreta della Grotta che unisce le meccaniche di due atti:
 *  si entra dall'Antro del Golem (saracinesca che si apre quando il Golem
 *  cade), si SCIVOLA sul ghiaccio fino all'unico gradino affacciato sul
 *  vuoto, e da lì si attraversa l'abisso con l'ARPIONE (atto III): un
 *  ritorno in stile Zelda. Premio: la Tunica di Brina (i colpi da 1 cuore
 *  ne tolgono mezzo; anche l'aspetto dell'eroe cambia).
 *  Soluzione (5 scivolate): destra, giù, sinistra, su, destra -> arpione a est.
 * ===================================================================== */
ITEMS.tunic = { name: 'Tunica di Brina', text: 'Hai trovato la TUNICA DI BRINA! Tessuta col ghiaccio eterno della grotta: i colpi più forti ti feriscono la metà.' };
INVENTORY.push(['tunic', 'Tunica']);

ROOMS['c:2,0'] = {
  name: 'Grotta di Brina - Crepaccio Gelato', ground: 'ice', secret: true,
  tiles: [
    'WWWWWWWWWWWWWWWW',
    'WqqqqqxW___PPPPW',
    'WqqqqqqW___PPPPW',
    'WqxqqqqW___PPPPW',
    'WqqqqqqP___PhPPW',
    'PPqqqqqW___PPPPW',
    'WqqqqxqW___PPPPW',
    'WqqqqqqW___PPPPW',
    'WqqqqqqW___PPPPW',
    'WxqqqqqW___PPPPW',
    'WWWWWWWWWWWWJWWW',
  ],
  shutters: [{ tiles: [[12, 10]], flag: 'chest:c_tunic' }],
  chests: [{ id: 'c_tunic', x: 13, y: 2, item: 'tunic' }],
  enemies: [{ type: 'batIce', x: 12, y: 7 }, { type: 'batIce', x: 9, y: 3 }],
  onEnter: g => {
    if (g.s.flags.chasmHint) return;
    g.s.flags.chasmHint = true;
    g.say([
      "Un crepaccio gelato! Oltre il vuoto, su una piattaforma, luccica un forziere.",
      g.s.items.hookshot
        ? "C'è un solo gradino affacciato sull'abisso, proprio davanti al palo con l'anello d'oro. Arrivarci scivolando... non sarà facile."
        : 'Senza un modo per attraversare il vuoto, per ora non si va da nessuna parte. Meglio tornare più avanti...',
    ]);
  },
};

/* Antro del Golem: varco a est che si apre con la sua sconfitta */
(function () {
  const r = ROOMS['c:1,0'], row = r.tiles[5];
  r.tiles[5] = row.slice(0, 15) + 'J';
  r.shutters = (r.shutters || []).concat([{ tiles: [[15, 5]], flag: 'golem' }]);
  // Sala delle Lame: saracinesca a nord (12,0) che si apre quando hai la Tunica, per tornare indietro
  const b = ROOMS['c:2,1'], top = b.tiles[0];
  b.tiles[0] = top.slice(0, 12) + 'J' + top.slice(13);
  b.shutters = (b.shutters || []).concat([{ tiles: [[12, 0]], flag: 'chest:c_tunic' }]);
})();

/* l'eroe con la Tunica: tunica azzurro ghiaccio, sciarpa rossa di sempre */
SPR.people.heroFrost = buildHumanoid(Object.assign({}, PEOPLE.hero, { c: '#d8f0ff', d: '#8ab8e0', p: '#6a7a9a' }));
ICON.tunic = spriteFromRows([
  '.oo..oo.',
  'owwoowwo',
  'owwwwwwo',
  '.owwwwo.',
  '.owbbwo.',
  '.owwwwo.',
  '.owwwwo.',
  '.oooooo.',
], { o: '#1a1420', w: '#d8f0ff', b: '#8ab8e0' });

MEDALS.push({ id: 'tunica', name: 'Veste di ghiaccio', desc: 'Trova la Tunica di Brina nel Crepaccio Gelato.', icon: 'tunic', tier: 0, got: g => g.s.items.tunic });

(function installFrost() {
  const G = Game;
  /* un indizio dell'eremita, finché la Tunica non è stata trovata */
  const silvano = ROOMS['o:2,0'].npcs.find(n => n.id === 'silvano');
  if (silvano) {
    const talk = silvano.talk;
    silvano.talk = g => (g.s.items.hookshot && g.s.flags.golem && !g.s.items.tunic && (g.t >> 8) % 2 === 0)
      ? ["Silvano: Dietro l'antro del Golem si apre un crepaccio gelato. I minatori ci nascondevano una tunica tessuta col ghiaccio eterno... ma senza un arpione nessuno l'ha mai raggiunta."]
      : talk(g);
  }
  /* la Tunica dimezza i colpi forti (dopo la difficoltà) */
  const baseDamage = diffDamage;
  diffDamage = function (d) {
    let r = baseDamage(d);
    if (G.s && G.s.items && G.s.items.tunic && r >= 2) r = Math.ceil(r / 2);
    return r;
  };
  /* ottenere la Tunica apre la saracinesca verso la Sala delle Lame */
  const applyItem = G.applyItem;
  G.applyItem = function (kind, n) {
    const r = applyItem.call(this, kind, n);
    if (kind === 'tunic') { this.s.flags['chest:c_tunic'] = true; this.openShutters('chest:c_tunic'); }
    return r;
  };
  /* sconfitto il Golem, si apre il varco a est */
  const onBossDefeated = G.onBossDefeated;
  G.onBossDefeated = function (boss) {
    const r = onBossDefeated.call(this, boss);
    if (boss instanceof Golem && !this.rush) this.openShutters('golem');
    return r;
  };
  /* l'aspetto dell'eroe con la Tunica */
  const draw = Player.prototype.draw;
  Player.prototype.draw = function (c, g) {
    if (!g.s.items.tunic) return draw.call(this, c, g);
    const base = SPR.hero; SPR.hero = SPR.people.heroFrost;
    try { return draw.call(this, c, g); } finally { SPR.hero = base; }
  };
})();
