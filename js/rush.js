'use strict';
/* =====================================================================
 *  RUSH — Ciclo 9 (Agente A): la SFIDA DEI GUARDIANI.
 *  Modalità a tempo sbloccata dalla prima vittoria (voce nel titolo).
 *  Tre prove di fila nelle stanze vere, con una dotazione fissa:
 *    1) Sala delle Armature, rinforzata   2) Golem di Brina   3) Re dei Rovi (due fasi)
 *  Tra una prova e l'altra un piccolo ristoro. Cronometro, record e due
 *  medaglie nell'Albo d'oro. NON tocca mai il salvataggio della partita:
 *  lo stato della sfida vive solo in memoria (saveGame è disattivato).
 * ===================================================================== */
const RUSH_ROUNDS = [
  { room: 'd:2,1', name: 'Le Armature Viventi', flag: 'cleared:d:2,1', x: 7, y: 8,
    extra: [{ type: 'slimeBlue', x: 3, y: 6 }, { type: 'slimeBlue', x: 12, y: 6 }, { type: 'bat', x: 7, y: 2 }] },
  { room: 'c:1,0', name: 'Il Golem di Brina', flag: 'golem', x: 7, y: 8 },
  { room: 'd:1,0', name: 'Il Re dei Rovi', flag: 'boss', x: 7, y: 8 },
];
const RUSH_GOLD = 150;   // secondi per la medaglia d'oro: il bot ci mette ~1:16 a Normale (vedi HANDOFF.md)

MEDALS.push(
  { id: 'sfida', name: 'Custode dei Guardiani', desc: 'Supera la Sfida dei Guardiani (dopo il finale).', icon: 'bigkey', tier: 1, got: () => Medals.data.rushBest > 0 },
  { id: 'sfidaOro', name: 'Furia dei Guardiani', desc: 'Supera la Sfida dei Guardiani in meno di 2:30.', icon: 'sword', tier: 2, got: () => Medals.data.rushBest > 0 && Medals.data.rushBest < RUSH_GOLD },
);

(function installRush() {
  const G = Game;
  G.rush = null;

  G.rushUnlocked = function () {
    if ((Medals.data.wins || 0) > 0) return true;
    const sv = readSave(); return !!(sv && sv.flags && sv.flags.victory);
  };
  G.startRush = function () {
    const s = newState();
    Object.assign(s.items, { sword: true, bombs: true, hookshot: true, lantern: true });
    s.bombs = 10; s.maxHp = s.hp = 12; s.equip = 'bombs';
    Object.assign(s.flags, { intro: true, golemIntro: true, bossIntro: true, phase2Seen: true, armorHint: true, enteredDungeon: true, caveEntered: true });
    this.s = s; this.visited = new Set(); this.dialog = null; this.itemGet = null;
    this.rush = { round: -1, t: 0, next: 0, ended: false };
    this.rushWon = false;
    this.player = new Player(0, 0);
    this.nextRushRound();
    Sound.sfx('start');
  };
  G.nextRushRound = function () {
    const r = this.rush;
    r.round++;
    const R0 = RUSH_ROUNDS[r.round];
    if (r.round > 0) {   // ristoro tra le prove
      this.s.hp = Math.min(this.s.maxHp, this.s.hp + 4);
      this.s.bombs = Math.max(this.s.bombs, 6);
    }
    this.lastName = '';
    this.loadRoom(R0.room);
    for (const e of R0.extra || []) this.entities.push(makeEnemy(e));
    this.player.x = R0.x * TS; this.player.y = R0.y * TS - 6; this.player.dir = 1;
    this.player.hook = null; this.player.fallT = 0; this.player.kbx = this.player.kby = 0;
    this.entry = { x: this.player.x, y: this.player.y };
    this.state = 'fade'; this.fade = { dir: -1, t: 0, after: true };
    this.banner = { text: 'Prova ' + (r.round + 1) + '/3 · ' + R0.name, t: 150 };
    r.next = 0;
  };
  G.endRush = function (won) {
    const r = this.rush;
    r.ended = true; this.rushWon = won; this.rushTime = r.t / 60;
    if (won) {
      const best = Medals.data.rushBest;
      r.record = best === undefined || best === null || this.rushTime < best;
      if (r.record) { Medals.data.rushBest = Math.round(this.rushTime * 10) / 10; Medals.save(); }
      Medals.check(this);
      Sound.music('village'); Sound.sfx('victory');
    } else { Sound.music(null); Sound.sfx('die'); }
    this.state = 'rushEnd'; this.rushEndT = 0;
  };

  /* --- il salvataggio è spento durante la sfida --- */
  const saveGame = G.saveGame;
  G.saveGame = function () { if (this.rush) return; return saveGame.call(this); };

  /* --- niente uscite: si resta nell'arena --- */
  const checkEdges = G.checkEdges;
  G.checkEdges = function () {
    if (!this.rush) return checkEdges.call(this);
    const p = this.player;
    p.x = Math.max(-p.hb.x + 1, Math.min(PLAY_W - p.hb.x - p.hb.w - 1, p.x));
    p.y = Math.max(-p.hb.y + 1, Math.min(PLAY_H - p.hb.y - p.hb.h - 1, p.y));
  };
  const checkWarps = G.checkWarps;
  G.checkWarps = function () { if (!this.rush) return checkWarps.call(this); };

  /* --- boss sconfitti: niente cristallo/forzieri, solo la prova superata --- */
  const onBossDefeated = G.onBossDefeated;
  G.onBossDefeated = function (boss) {
    if (!this.rush) return onBossDefeated.call(this, boss);
    this.s.flags[this.room.bossFlag || 'boss'] = true;
    this.boss = null; Sound.sfx('secret');
    this.puff(boss.cx(), boss.cy(), '#ffe8a0');
  };
  const onPlayerDeath = G.onPlayerDeath;
  G.onPlayerDeath = function () {
    if (!this.rush) return onPlayerDeath.call(this);
    this.endRush(false);
  };

  /* --- aggiornamento: cronometro e passaggio di prova --- */
  const updatePlay = G.updatePlay;
  G.updatePlay = function () {
    updatePlay.call(this);
    const r = this.rush;
    if (!r || r.ended || this.state !== 'play') return;
    if (!this.dialog && !this.hitStop) r.t++;
    const R0 = RUSH_ROUNDS[r.round];
    if (this.s.flags[R0.flag] && !r.next) r.next = 1;
    if (r.next && ++r.next > 100) {
      if (r.round + 1 < RUSH_ROUNDS.length) this.nextRushRound();
      else this.endRush(true);
    }
  };
  const update = G.update;
  G.update = function () {
    if (this.state === 'rushEnd') {
      this.t++; this.rushEndT++;
      if (this.rushEndT > 60 && (Input.hit('action') || Input.hit('start'))) {
        this.rush = null; this.rushWon = false; this.state = 'title'; this.menuIdx = 0; this.s = newState(); this.player = null;
        Sound.music('title'); Sound.sfx('select');
      }
      return;
    }
    if (this.state === 'pause' && this.rush && Input.hit('swap')) {   // abbandona la sfida
      this.state = 'play'; this.endRush(false); this.rush.abandoned = true; return;
    }
    return update.call(this);
  };

  /* --- titolo --- */
  const titleItems = G.titleItems;
  G.titleItems = function () {
    const it = titleItems.call(this);
    if (this.rushUnlocked()) { const i = it.indexOf("Albo d'oro"); it.splice(i < 0 ? it.length : i, 0, 'Sfida dei Guardiani'); }
    return it;
  };
  const updateTitle = G.updateTitle;
  G.updateTitle = function () {
    const items = this.titleItems();
    if ((Input.hit('action') || Input.hit('start')) && items[this.menuIdx] === 'Sfida dei Guardiani') { this.startRush(); return; }
    return updateTitle.call(this);
  };

  /* --- disegno --- */
  const render = G.render;
  G.render = function () {
    if (this.state === 'rushEnd') return this.drawRushEnd();
    render.call(this);
    const r = this.rush;
    if (r && !r.ended && (this.state === 'play' || this.state === 'fade' || this.state === 'pause')) {
      const sec = r.t / 60;
      txt('Prova ' + (r.round + 1) + '/3', 250, HUD_H + 2, { align: 'right', size: 10, color: '#c8bcd8' });
      txt(fmtTime(sec) + '.' + Math.floor((sec % 1) * 10), 250, HUD_H + 11, { align: 'right', size: 12, color: sec < RUSH_GOLD ? '#ffe8a0' : '#ffffff' });
      if (this.state === 'pause') txt('Q: abbandona la sfida', 128, HUD_H + 2, { align: 'center', size: 10, color: '#ff9a9a' });
    }
  };
  G.drawRushEnd = function () {
    const c = bctx, r = this.rush, won = this.rushWon;
    c.setTransform(1, 0, 0, 1, 0, 0);
    this.drawLandscape(c, this.t, won ? 1.2 : 0);
    c.fillStyle = 'rgba(12,8,22,0.7)'; c.fillRect(0, 0, GW, GH);
    if (won) c.drawImage(medalImage(MEDALS.find(m => m.id === (this.rushTime < RUSH_GOLD ? 'sfidaOro' : 'sfida')), false), 119, 78);
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(buf, 0, 0, GW * SCALE, GH * SCALE);
    txt('SFIDA DEI GUARDIANI', 128, 22, { align: 'center', size: 9, font: TITLE_FONT, color: '#ffd870' });
    if (won) {
      txt('Tutti e tre i guardiani sconfitti!', 128, 46, { align: 'center', size: 13, color: '#ffffff' });
      txt('Tempo: ' + fmtTime(this.rushTime) + '.' + Math.floor((this.rushTime % 1) * 10), 128, 108, { align: 'center', size: 14, color: '#ffe8a0' });
      txt(r.record ? 'NUOVO RECORD!' : 'Record: ' + fmtTime(Medals.data.rushBest), 128, 124, { align: 'center', size: 12, color: r.record ? '#c8ffd0' : '#c8bcd8' });
      txt(this.rushTime < RUSH_GOLD ? 'Sotto i 2:30: Furia dei Guardiani!' : 'Sotto i 2:30 vale una medaglia d\'oro...', 128, 138, { align: 'center', size: 11, color: '#d8c8e8' });
    } else {
      txt(r.abandoned ? 'Sfida abbandonata.' : 'Sei caduto alla prova ' + (r.round + 1) + ' di 3.', 128, 60, { align: 'center', size: 13, color: '#ff9a9a' });
      txt(RUSH_ROUNDS[r.round].name, 128, 78, { align: 'center', size: 12, color: '#d8c8e8' });
      if (Medals.data.rushBest) txt('Record: ' + fmtTime(Medals.data.rushBest), 128, 100, { align: 'center', size: 11, color: '#c8bcd8' });
    }
    if (this.rushEndT > 60 && (this.t >> 5) % 2) txt('Premi ' + actKey(true) + ' per tornare al titolo', 128, 170, { align: 'center', size: 11, color: '#ffe8a0' });
  };
})();
