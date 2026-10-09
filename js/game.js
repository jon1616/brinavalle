'use strict';
// Ciclo 47 (Agente A): prima dei due punti c'è il nome di chi parla, ma solo se è un nome: niente virgole, e non le parole della narrazione
// (prima un cartello «Inciso: «...»» mostrava l'etichetta «Inciso» come se fosse un personaggio; così «Da dietro la porta», «Ora tocca a te», «Il Vento, piano»...)
// Ciclo 48 (Agente B): anche «È la voce del CIELO: ...» e «Mancano: ...» (Cuore della Terra). Il test T48 tiene l'elenco di tutte le etichette
// che compaiono nei testi: un'etichetta nuova lo fa fallire, così chi la scrive decide se è un personaggio o narrazione.
const NOT_SPEAKER = /,|^(Inciso|Incisa|Cartello|Scritto|Da|Ora|Un|Una|Uno|Sul|Sulla|Sullo|Sui|Sono|Spostati|Seconda|Torna|Ha|Le conchiglie|La lente|Mancano)\b|^È /;
/* =====================================================================
 *  GAME — motore: input, loop a 60 FPS fissi, stati di gioco, stanze,
 *  transizioni, dialoghi, HUD, menu, salvataggio (localStorage).
 *  Rendering a doppio livello:
 *   1) `buf` 256x192 pixel-art, poi scalato (nearest) su #screen;
 *   2) i testi vengono disegnati direttamente su #screen ad alta
 *      risoluzione, così restano nitidi a qualunque scala.
 * ===================================================================== */
const SAVE_KEY = 'brinavalle_save_v1';
// Ciclo 8: ripiego sans-serif. Misurato: con "Courier New" (largo il 50% in più di VT323) offline 45 testi diversi
// andavano compressi fino al 29%; con Segoe UI / Arial uno solo, del 3%.
let UI_FONT = '"VT323", "Segoe UI", Arial, sans-serif';        // let: tests/audit.js simula il caso offline
let TITLE_FONT = '"Press Start 2P", "Courier New", monospace';
/* VT323 è un font a pixel dai glifi piccoli: se non è disponibile, il ripiego sans-serif si disegna un po' più piccolo */
let VT_OK = false;
/* rilevamento per misura (document.fonts.check è inaffidabile con i sottoinsiemi di Google Fonts):
 * se "VT323" e il monospace generico danno la stessa larghezza, VT323 non c'è */
function checkFonts() {
  const m = makeCanvas(4, 4).getContext('2d'), probe = 'mmmmmwwwwwlliiAB';
  m.font = '40px "VT323", monospace'; const a = m.measureText(probe).width;
  m.font = '40px monospace'; const b = m.measureText(probe).width;
  VT_OK = Math.abs(a - b) > 2;
  return VT_OK;
}
checkFonts();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkFonts);
{ let n = 0; const iv = setInterval(() => { if (checkFonts() || ++n > 40) clearInterval(iv); }, 250); }   // il font può arrivare dopo
function uiSize(size, font) { return font || VT_OK ? size : size * 0.86; }

/* ------------------------------ INPUT ------------------------------ */
const Input = {
  down: new Set(), pressed: new Set(), pad: new Set(), touch: new Set(), virt: new Set(),
  map: {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    Space: 'action', KeyZ: 'action', KeyJ: 'action', KeyE: 'action',
    KeyX: 'item', KeyK: 'item', KeyC: 'item', ShiftLeft: 'item', ShiftRight: 'item',
    Enter: 'start', Escape: 'start', KeyP: 'start', KeyM: 'mute',
    KeyQ: 'swap', Tab: 'swap', KeyV: 'swap',
  },
  /* gamepad e comandi touch confluiscono in `virt`: un'azione nuova genera un "pressed" */
  poll() {
    const now = new Set();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const b = i => gp.buttons[i] && gp.buttons[i].pressed;
      if (b(0)) now.add('action');
      if (b(1) || b(2)) now.add('item');
      if (b(3) || b(4) || b(5)) now.add('swap');
      if (b(9) || b(8)) now.add('start');
      const song = typeof Game !== 'undefined' && Game.song, ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, hx = Math.abs(ax) >= Math.abs(ay);   // Ciclo 51: col canto, solo l'asse dominante (come la levetta touch)
      if (b(12) || (ay < -0.45 && !(song && hx))) now.add('up');
      if (b(13) || (ay > 0.45 && !(song && hx))) now.add('down');
      if (b(14) || (ax < -0.45 && !(song && !hx))) now.add('left');
      if (b(15) || (ax > 0.45 && !(song && !hx))) now.add('right');
    }
    for (const a of this.touch) now.add(a);
    for (const a of now) if (!this.virt.has(a) && !this.down.has(a)) { this.pressed.add(a); Sound.init(); }
    this.virt = now;
  },
  init() {
    addEventListener('keydown', e => {
      const a = this.map[e.code];
      Sound.init();
      if (!a) return;
      e.preventDefault();
      if (!this.down.has(a)) this.pressed.add(a);
      this.down.add(a);
    });
    addEventListener('keyup', e => { const a = this.map[e.code]; if (a) this.down.delete(a); });
    addEventListener('blur', () => { this.down.clear(); this.touch.clear(); });
    addEventListener('pointerdown', () => Sound.init());
    this.initTouch();
  },
  /* comandi touch: levetta virtuale a sinistra, pulsanti A/B a destra */
  initTouch() {
    const root = document.getElementById('touch');
    if (!root) return;
    const show = () => { if (!root.hidden) return; root.hidden = false; document.body.classList.add('touchmode'); resize(); };
    addEventListener('touchstart', show, { passive: true });
    if (matchMedia('(pointer: coarse)').matches) show();
    root.querySelectorAll('[data-a]').forEach(b => {
      const a = b.dataset.a;
      const on = e => { e.preventDefault(); Sound.init(); this.touch.add(a); b.classList.add('on'); };
      const off = e => { e.preventDefault(); this.touch.delete(a); b.classList.remove('on'); };
      b.addEventListener('pointerdown', on);
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, off);
      b.addEventListener('contextmenu', e => e.preventDefault());
    });
    const stick = document.getElementById('stick'), knob = document.getElementById('knob');
    const dirs = ['up', 'down', 'left', 'right'];
    let pid = null;
    const upd = e => {
      const r = stick.getBoundingClientRect(), m = r.width / 2;
      const dx = e.clientX - (r.left + m), dy = e.clientY - (r.top + m), d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, (m * 0.6) / d);
      knob.style.transform = 'translate(' + (dx * k) + 'px,' + (dy * k) + 'px)';
      dirs.forEach(a => this.touch.delete(a));
      if (d < m * 0.22) return;
      const c = dx / d, s = dy / d;   // 8 direzioni
      // Ciclo 51: mentre Lio suona la Conca le direzioni sono NOTE: in diagonale se ne suonavano due insieme. Allora solo l'asse dominante
      if (typeof Game !== 'undefined' && Game.song) { if (Math.abs(c) >= Math.abs(s)) this.touch.add(c > 0 ? 'right' : 'left'); else this.touch.add(s > 0 ? 'down' : 'up'); return; }
      if (c > 0.38) this.touch.add('right'); if (c < -0.38) this.touch.add('left');
      if (s > 0.38) this.touch.add('down'); if (s < -0.38) this.touch.add('up');
    };
    stick.addEventListener('pointerdown', e => { e.preventDefault(); Sound.init(); pid = e.pointerId; stick.setPointerCapture(pid); upd(e); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === pid) upd(e); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; dirs.forEach(a => this.touch.delete(a)); knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  },
  held(a) { return this.down.has(a) || this.virt.has(a); },
  hit(a) { return this.pressed.has(a); },
  endFrame() { this.pressed.clear(); },
};

/* ------------------------------ CANVAS ------------------------------ */
const screenCanvas = document.getElementById('screen');
const sctx = screenCanvas.getContext('2d');
const buf = makeCanvas(GW, GH), bctx = buf.getContext('2d');
const mctx = makeCanvas(4, 4).getContext('2d');   // solo per misurare il testo
let SCALE = 3;
function resize() {
  const touch = document.body.classList.contains('touchmode'), portrait = innerHeight > innerWidth;
  const fit = Math.min(innerWidth / GW, (innerHeight - (touch && portrait ? 210 : 0)) / GH);
  // scala intera per pixel perfetti; sugli schermi piccoli meglio una scala frazionaria che un gioco minuscolo
  SCALE = fit >= 2 ? Math.floor(fit) : Math.max(1, Math.floor(fit * 4) / 4);
  screenCanvas.width = GW * SCALE; screenCanvas.height = GH * SCALE;
  sctx.imageSmoothingEnabled = false;
}
function txt(str, gx, gy, o) {
  o = o || {};
  const s = SCALE, size = uiSize(o.size || 11, o.font) * s;
  sctx.font = size + 'px ' + (o.font || UI_FONT);
  sctx.textAlign = o.align || 'left'; sctx.textBaseline = 'top';
  if (o.alpha !== undefined) sctx.globalAlpha = o.alpha;
  // Ciclo 8: larghezza massima = spazio rimasto sullo schermo. Con VT323 non cambia nulla; se il font non è
  // (ancora) caricato, offline o con Google Fonts bloccato, il ripiego "Courier New" è largo il 50% in più:
  // invece di uscire dallo schermo il testo viene compresso.
  const al = o.align || 'left';
  const room = o.maxW || (al === 'center' ? 2 * Math.min(gx, GW - gx) - 2 : al === 'right' ? gx - 1 : GW - gx - 1);
  const mw = Math.max(8, room) * s;
  if (o.shadow !== false) { sctx.fillStyle = o.shadowColor || '#000'; sctx.fillText(str, Math.round(gx * s) + s, Math.round(gy * s) + s, mw); }
  sctx.fillStyle = o.color || '#fff';
  sctx.fillText(str, Math.round(gx * s), Math.round(gy * s), mw);
  sctx.globalAlpha = 1;
}
function wrap(text, maxW, size, font) {
  mctx.font = uiSize(size || 11, font) + 'px ' + (font || UI_FONT);
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (mctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
/* Ciclo 8: miniatura 23x16 di uno sfondo di stanza (per la mappa della pausa) */
function makeThumb(src) {
  const c = makeCanvas(23, 16), x = c.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, 23, 16);
  return c;
}
/* Ciclo 14: "Nella puntata precedente..." quando si riprende una partita dopo almeno 5 minuti.
 * Usa i capitoli e le missioni del Diario (js/journal.js, Ciclo 13) se ci sono. */
const RECAP_AWAY_MS = 5 * 60 * 1000;
function recapLines(g, sv) {
  if (!sv || !sv.flags || !sv.flags.intro) return [];
  if (sv.savedAt && Date.now() - sv.savedAt < RECAP_AWAY_MS) return [];
  const out = [];
  if (typeof CHAPTERS !== 'undefined') {
    const done = CHAPTERS.filter(ch => { try { return !!ch.done(g); } catch (e) { return false; } });
    const last = done[done.length - 1];
    out.push('Diario: Nella puntata precedente... ' + (last ? 'capitoli completati ' + done.length + ' su ' + CHAPTERS.length + ', l’ultimo: «' + last.name + '».' : 'la tua avventura era appena cominciata.'));
  }
  out.push('Diario: ' + currentObjective(g));
  if (typeof g.knownQuests === 'function') {
    const open = g.knownQuests().filter(q => { try { return !q.done(g); } catch (e) { return false; } });
    if (open.length) out.push('Diario: Missioni secondarie in sospeso: ' + open.length + '. Le trovi nel Diario (' + (isTouch() ? '⇄' : 'Q') + ' nel menu di pausa).');
  }
  return out;
}
function isTouch() { return document.body.classList.contains('touchmode'); }
/* Ciclo 10: nomi dei tasti secondo il dispositivo (tastiera, touch o gamepad) */
function usingPad() { try { return Array.from(navigator.getGamepads ? navigator.getGamepads() : []).some(Boolean); } catch (e) { return false; } }
function bombKey() { return isTouch() || usingPad() ? 'il pulsante B' : 'il tasto X'; }
function actKey(short) { return isTouch() || usingPad() ? 'A' : short ? 'SPAZIO' : 'SPAZIO (o Z)'; }
function moveKeys() { return isTouch() ? 'la levetta' : usingPad() ? 'la croce o la levetta' : 'FRECCE o WASD'; }
function menuKey() { return isTouch() ? 'MENU' : usingPad() ? 'START' : 'INVIO'; }
function fmtTime(sec) { sec = sec | 0; const m = (sec / 60) | 0, s = sec % 60; return (m >= 60 ? ((m / 60) | 0) + 'h ' + (m % 60) + 'm' : m + ':' + String(s).padStart(2, '0')); }
function neighborId(id, dx, dy) {
  const m = /^([odclrntavmfswkghq]):(\d+),(\d+)$/.exec(id);   // l: = Santuario Sommerso (Ciclo 17), r: = Radici del Trono (Ciclo 23), n: = il Nord (Ciclo 30), t: = Torre del Silenzio, a: = Dune d'Ambra (Ciclo 32), v: = Osservatorio di Vesper
  if (!m) return null;
  const nid = m[1] + ':' + (+m[2] + dx) + ',' + (+m[3] + dy);
  return ROOMS[nid] ? nid : null;
}
function newState() {
  return { hp: 6, maxHp: 6, gems: 0, keys: 0, bombs: 0, maxBombs: 10, items: {}, flags: {}, room: START.room, x: START.x * TS, y: START.y * TS - 6, visited: [], deaths: 0, time: 0 };
}
/* tutti i forzieri del gioco (per il contatore "Tesori") */
function allChests() { const out = []; for (const id in ROOMS) for (const c of ROOMS[id].chests || []) out.push(c.id); return out; }
/* ---------------- Ciclo 4: opzioni (globali, non legate al salvataggio) ---------------- */
const OPTS_KEY = 'brinavalle_opts';
const Opts = Object.assign({ music: 4, sfx: 4, diff: 1, text: 0, fx: 1, way: 1 }, (() => { try { return JSON.parse(localStorage.getItem(OPTS_KEY)) || {}; } catch (e) { return {}; } })());
const DIFF_NAMES = ['Facile', 'Normale', 'Eroe'], TEXT_NAMES = ['Normale', 'Veloce', 'Istantaneo'];
function saveOpts() {
  try { localStorage.setItem(OPTS_KEY, JSON.stringify(Opts)); } catch (e) {}
  Sound.setLevels(Opts.music, Opts.sfx);
  if (typeof FEEL !== 'undefined') FEEL.on = Opts.fx !== 0;   // Ciclo 6: effetti visivi del Ciclo 5 (js/feel.js)
}
/* danno subito dal giocatore secondo la difficoltà (in mezzi cuori) */
function diffDamage(d) { return Opts.diff === 0 ? Math.max(1, d - 1) : Opts.diff === 2 ? d * 2 : d; }
function seedCount(g) { return SEED_IDS.filter(id => g.s.flags['seed:' + id]).length; }
function readSave() { try { const j = localStorage.getItem(SAVE_KEY); return j ? JSON.parse(j) : null; } catch (e) { return null; } }

/* =============================== GAME =============================== */
const Game = {
  state: 'title', t: 0, s: newState(),
  roomId: null, room: null, tiles: null, bg: null, animTiles: [],
  entities: [], projectiles: [], pickups: [], particles: [], player: null, boss: null,
  dialog: null, itemGet: null, shake: 0, banner: null, fade: null, scroll: null,
  visited: new Set(), lastName: '', menuIdx: 0, flies: [], endT: 0,

  /* ---------------------------- avvio partita ---------------------------- */
  newGame() {
    this.startFrom(newState(), false);
    Sound.sfx('start');
  },
  startFrom(sv, fullHp) {
    const base = newState();
    this.s = Object.assign(base, sv);
    this.s.items = Object.assign({}, sv.items); this.s.flags = Object.assign({}, sv.flags);
    if (fullHp || this.s.hp <= 0) this.s.hp = this.s.maxHp;
    this.visited = new Set(this.s.visited || []);
    this.player = new Player(this.s.x, this.s.y);
    this.dialog = null; this.itemGet = null; this.lastName = ''; this.shake = 0;
    this.loadRoom(this.s.room);
    this.state = 'fade'; this.fade = { dir: -1, t: 0, after: true };
  },
  saveGame() {
    if (!this.player || !this.roomId) return;
    this.s.room = this.roomId; this.s.x = this.player.x; this.s.y = this.player.y;
    this.s.visited = [...this.visited];
    this.s.savedAt = Date.now();   // Ciclo 14: per il riepilogo "Nella puntata precedente" al Continua
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch (e) {}
  },

  /* ------------------------------- stanze ------------------------------- */
  loadRoom(id) {
    const def = ROOMS[id];
    if (!def) throw new Error('Stanza inesistente: ' + id);
    this.roomId = id; this.room = def;
    this.tiles = def.tiles.map(r => r.split(''));
    const f = this.s.flags, floor = floorOf(def.ground);
    for (const d of def.dyn || []) if (d.cond(this)) this.tiles[d.y][d.x] = d.ch;   // tile che cambiano con la storia
    for (const sh of def.shutters || []) if (f[sh.flag]) for (const [x, y] of sh.tiles) this.tiles[y][x] = floor;
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
      const t = this.tiles[ty][tx], k = id + ':' + tx + ',' + ty;
      if (t === 'V' && f['cut:' + k]) this.tiles[ty][tx] = floor;
      if ((t === 'L' || t === 'G') && f['open:' + k]) this.tiles[ty][tx] = 'P';
      if (t === 'Q' && f['bomb:' + k]) this.tiles[ty][tx] = floor;
    }
    this.entities = []; this.projectiles = []; this.pickups = []; this.particles = [];
    for (const n of def.npcs || []) if (!n.cond || n.cond(this)) this.entities.push(new NPC(n));
    for (const c of def.chests || []) if (!c.cond || c.cond(this)) this.entities.push(new Chest(c));
    for (const sd of def.seeds || []) if (!f['seed:' + sd.id] && (!sd.needLantern || this.s.items.lantern)) this.entities.push(new Seed(sd));
    if (this.player) this.player.safe = null;
    if (def.blocks) {   // blocchi spingibili: a enigma risolto stanno sulle piastre
      const plates = this.platePositions();
      def.blocks.forEach(([x, y], i) => {
        const pos = def.puzzleFlag && f[def.puzzleFlag] && plates[i] ? plates[i] : [x, y];
        this.entities.push(new Block(pos[0], pos[1]));
      });
    }
    if (!(def.clearFlag && f[def.clearFlag])) for (const e of def.enemies || []) this.entities.push(makeEnemy(e));
    this.boss = null;
    if (def.boss) {
      const bflag = def.bossFlag || 'boss';
      if (!f[bflag]) {
        this.boss = def.boss === 'golem' ? new Golem(7 * TS, 1.5 * TS) : def.boss === 'serpent' ? new Serpent() : new ThornKing(7 * TS, 1.5 * TS);
        this.entities.push(this.boss);
        for (const [x, y] of def.bossDoors || [[7, 10], [8, 10]]) this.tiles[y][x] = 'W';
      } else if (def.boss === true && !this.s.items.crystal) this.entities.push(new Crystal(7 * TS + 10, 4 * TS));   // solo nel Trono dei Rovi
    }
    this.animTiles = [];
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) if (this.tiles[ty][tx] === '~' || this.tiles[ty][tx] === 'Y') this.animTiles.push([tx, ty, this.tiles[ty][tx]]);
    this.redrawBg();
    this.visited.add(id);
    this.pickMusic();
    this.snow = [];
    if (def.ground === 'ice') for (let i = 0; i < 26; i++) this.snow.push({ x: Math.random() * PLAY_W, y: Math.random() * PLAY_H, v: 0.15 + Math.random() * 0.3, ph: Math.random() * 6 });
    if (id.startsWith('o:') && this.flies.length === 0) {
      for (let i = 0; i < 10; i++) this.flies.push({ x: Math.random() * PLAY_W, y: Math.random() * PLAY_H, vx: 0, vy: 0, ph: Math.random() * 6 });
    }
  },
  redrawBg() {
    // Ciclo 10: nella stessa stanza (cespuglio tagliato, esplosione, porta aperta) si ridisegna sulla STESSA tela.
    // Una tela nuova a ogni modifica costava fino a ~47 ms al primo disegno (misurato: massi distrutti nei Campi).
    // Cambiando stanza serve invece una tela nuova: lo scorrimento disegna insieme la vecchia e la nuova.
    const same = this.bg && this.bgRoom === this.roomId;
    this.bg = renderRoomBg(this.tiles, this.room.ground, strHash(this.roomId), same ? this.bg : null);
    this.bgRoom = this.roomId;
    // Ciclo 10: la miniatura per la mappa si genera solo quando si apre la pausa. Generarla qui, da una tela appena
    // dipinta, costava ~27 ms (misurato): uno scatto a ogni cespuglio tagliato, esplosione o porta aperta.
    (this.bgs || (this.bgs = {}))[this.roomId] = this.bg;
    if (this.thumbs) delete this.thumbs[this.roomId];
  },
  /* miniatura di una stanza visitata: dall'ultimo sfondo visto in questa sessione, altrimenti ridisegnata dalla mappa */
  thumbOf(id) {
    const th = this.thumbs || (this.thumbs = {});
    if (!th[id]) {
      const src = this.bgs && this.bgs[id];
      th[id] = makeThumb(src || (d => renderRoomBg(d.tiles.map(r => r.split('')), d.ground, strHash(id)))(ROOMS[id]));
    }
    return th[id];
  },
  pickMusic() {
    const id = this.roomId, def = this.room, f = this.s.flags;
    let m = def.music || (id.startsWith('d:') ? 'dungeon' : id.startsWith('c:') ? 'cave' : id.startsWith('i:') ? 'village' : 'overworld');
    if (f.victory && id.startsWith('o:')) m = 'village';
    if (def.boss) m = f[def.bossFlag || 'boss'] ? (def.afterMusic || null) : 'boss';
    Sound.music(m);
  },
  afterEnter() {
    const def = this.room;
    if (this.player) this.entry = { x: this.player.x, y: this.player.y };   // punto di rientro dopo una caduta
    if (def.name !== this.lastName) { this.banner = { text: def.name, t: 150 }; this.lastName = def.name; }
    this.saveGame();
    // Ciclo 30 (prova a mano, Agente B): il salvataggio avveniva PRIMA di onEnter, così i flag dei testi d'ingresso
    // (es. caveEntered) non venivano salvati e, dopo una caduta, il «Continua» ripeteva il testo a ogni tentativo.
    const nf = Object.keys(this.s.flags).length;
    if (def.onEnter) def.onEnter(this);
    if (Object.keys(this.s.flags).length !== nf) this.saveGame();
    if (this.pendingRecap) { const r = this.pendingRecap; this.pendingRecap = null; if (r.length) this.say(r); }
  },
  startWarp(w, tile) {
    this.state = 'fade'; this.fade = { dir: 1, t: 0, w };
    Sound.sfx(tile === 'Z' || tile === 'U' || tile === 'C' ? 'stairs' : 'door');
  },
  startScroll(dir, nid) {
    const p = this.player, from = this.bg, ox = p.x, oy = p.y;
    this.loadRoom(nid);
    const nx = dir[0] ? ox - dir[0] * PLAY_W + dir[0] * 12 : ox;
    const ny = dir[1] ? oy - dir[1] * PLAY_H + dir[1] * 14 : oy;
    this.scroll = { dir, t: 0, dur: dir[0] ? 52 : 40, from, ox, oy, nx, ny };
    p.x = nx; p.y = ny; p.attackT = 0; p.kbx = p.kby = 0;
    this.state = 'scroll';
  },
  checkWarps() {
    const p = this.player, tx = Math.floor(p.cx() / TS), ty = Math.floor(p.cy() / TS);
    const t = tileAt(tx, ty);
    // Ciclo 29 (prova a mano): se è un colpo a spingere Lio su una porta o una scala, non si cambia stanza
    // (all'ingresso della Grotta uno slime ti ributtava fuori). Il passaggio torna attivo appena Lio ne esce.
    if (t && TILE_WARP.has(t) && (p.warpHold || Math.abs(p.kbx) + Math.abs(p.kby) > 0.15)) { p.warpHold = true; return; }
    p.warpHold = false;
    if (t && TILE_WARP.has(t)) {
      const w = this.room.warps && this.room.warps[tx + ',' + ty];
      if (w) this.startWarp(w, t);
    }
  },
  checkEdges() {
    const p = this.player, cx = p.cx(), cy = p.cy();
    let dir = null;
    if (cx < 0) dir = [-1, 0]; else if (cx >= PLAY_W) dir = [1, 0];
    else if (cy < 0) dir = [0, -1]; else if (cy >= PLAY_H) dir = [0, 1];
    if (!dir) return;
    // Ciclo 30 (prova a mano, Agente B): come per le scale (Ciclo 29), un colpo non deve buttarti nella stanza accanto.
    // Nella Grotta un pipistrello mi ha spinto oltre il bordo sud, nella sala di prima, coi nemici di nuovo tutti lì.
    const knocked = Math.abs(p.kbx) + Math.abs(p.kby) > 0.15;
    const nid = knocked ? null : neighborId(this.roomId, dir[0], dir[1]);
    if (!nid) {   // nessuna stanza da quella parte (o spinto da un colpo): resta dentro
      p.x = Math.max(-p.hb.x - p.hb.w / 2 + 1, Math.min(PLAY_W - p.hb.x - p.hb.w / 2 - 1, p.x));
      p.y = Math.max(-p.hb.y - p.hb.h / 2 + 1, Math.min(PLAY_H - p.hb.y - p.hb.h / 2 - 1, p.y));
      return;
    }
    this.startScroll(dir, nid);
  },
  checkClear() {
    const def = this.room;
    if (!def.clearFlag || this.s.flags[def.clearFlag] || !(def.enemies || []).length) return;
    if (this.entities.some(e => e.enemy && !e.dead && !e.ignoreClear)) return;
    this.s.flags[def.clearFlag] = true;
    Sound.sfx('secret');
    this.openShutters(def.clearFlag);
    if (def.onClear) def.onClear(this);
    this.spawnChests();
    this.saveGame();
  },
  /* fa comparire i forzieri della stanza che ora soddisfano la loro condizione */
  spawnChests() {
    for (const c of this.room.chests || []) {
      if ((c.cond && !c.cond(this)) || this.entities.some(e => e instanceof Chest && e.def === c)) continue;
      const ch = new Chest(c);
      this.entities.push(ch); this.puff(c.x * TS + 8, c.y * TS + 8, '#fff0a0');
      const p = this.player;   // non far comparire il forziere addosso al giocatore: spostalo sotto
      for (let k = 0; k < 48 && overlap(p.box(), ch.box()); k++) p.y += 1;
    }
  },

  /* ------------------------ enigmi del Ciclo 2 ------------------------ */
  platePositions() {
    const out = [];
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) if (this.room.tiles[ty][tx] === '^') out.push([tx, ty]);
    return out;
  },
  checkPlates() {
    const def = this.room, f = this.s.flags;
    if (!def.puzzleFlag || f[def.puzzleFlag]) return;
    const blocks = this.entities.filter(e => e instanceof Block && !e.mv);
    const plates = this.platePositions();
    const covered = plates.filter(([x, y]) => blocks.some(b => b.tx === x && b.ty === y)).length;
    if (covered > (this.platesDown || 0)) Sound.sfx('plate');
    this.platesDown = covered;
    if (covered < plates.length) return;
    f[def.puzzleFlag] = true;
    Sound.sfx('secret');
    this.openShutters(def.puzzleFlag);
    this.saveGame();
  },
  /* apre (nella stanza corrente) le saracinesche legate a un flag */
  openShutters(flag) {
    let any = false;
    for (const sh of this.room.shutters || []) {
      if (sh.flag !== flag) continue;
      for (const [x, y] of sh.tiles) { this.tiles[y][x] = floorOf(this.room.ground); this.puff(x * TS + 8, y * TS + 8, '#c8c8d8'); any = true; }
    }
    if (any) { this.redrawBg(); Sound.sfx('shutter'); this.shake = 6; }
  },

  /* ------------------------------- bombe ------------------------------- */
  /* ---------------- Ciclo 3: oggetti equipaggiabili ---------------- */
  equipped() {
    const own = EQUIPS.filter(k => this.s.items[k]);
    if (!own.length) return null;
    if (!own.includes(this.s.equip)) this.s.equip = own[0];
    return this.s.equip;
  },
  swapItem(quiet) {
    const own = EQUIPS.filter(k => this.s.items[k]);
    if (own.length < 2) return;
    const i = own.indexOf(this.equipped());
    this.s.equip = own[(i + 1) % own.length];
    Sound.sfx('swap');
    if (!quiet) this.banner = { text: ITEMS[this.s.equip].name, t: 70 };
  },
  useItem() {
    if (this.equipped() === 'hookshot') {
      const p = this.player;
      if (!p.hook) { p.hook = new Hook(p); p.attackT = 0; p.slide = null; }
      return;
    }
    const s = this.s, p = this.player;
    if (!s.items.bombs) return;
    if (s.bombs <= 0) { if (p.msgCd === 0) { p.msgCd = 200; Sound.sfx('bump'); this.banner = { text: 'Niente bombe!', t: 90 }; } return; }
    if (this.entities.filter(e => e.bomb && !e.dead).length >= 2) return;
    const v = DIRS[p.dir];
    let bx = p.cx() + v.x * 10, by = p.cy() + v.y * 10 - 1;
    if (boxHitsSolid({ x: bx - 4, y: by - 4, w: 8, h: 8 }, {})) { bx = p.cx(); by = p.cy() - 1; }
    s.bombs--;
    this.entities.push(new Bomb(bx, by));
    Sound.sfx('bomb');
  },
  explode(x, y) {
    Sound.sfx('boom'); this.shake = 12;
    this.particles.push(new Blast(x, y));
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2, v = 0.6 + Math.random() * 2.2;
      this.particles.push(new Particle(x, y, Math.cos(a) * v, Math.sin(a) * v - 0.5, 26 + Math.random() * 20, ['#ffd040', '#ff7020', '#5a5050', '#8a8080'][i % 4], 2, 0.03));
    }
    for (const e of this.entities) {
      if (!e.enemy || e.dead) continue;
      const dx = e.cx() - x, dy = e.cy() - y;
      if (Math.hypot(dx, dy) > BLAST_R + Math.min(e.hb.w, e.hb.h) / 2) continue;
      if (e.bombHit) e.bombHit(this);
      else { e.inv = 0; e.hurt(this, 2, Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0)); }
    }
    const p = this.player;
    if (Math.hypot(p.cx() - x, p.cy() - y) < BLAST_R - 4) p.hurt(this, 1, x, y);
    for (const b of this.entities) if (b.bomb && !b.dead && Math.hypot(b.cx() - x, b.cy() - y) < BLAST_R) b.t = Math.max(b.t, BOMB_FUSE - 8);   // reazione a catena
    // tile colpiti
    let changed = false;
    const floor = floorOf(this.room.ground);
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) {
      if (Math.hypot(tx * TS + 8 - x, ty * TS + 8 - y) > BLAST_R + 6) continue;
      const t = this.tiles[ty][tx];
      if (t === 'B' || t === 'V') { this.cutTile(tx, ty); }
      else if (t === 'Q') { this.crumble(tx, ty); changed = true; }
      else if (t === 'r' && this.room.ground !== 'ice') {
        this.tiles[ty][tx] = floor; changed = true;
        for (let i = 0; i < 8; i++) this.particles.push(new Particle(tx * TS + 8, ty * TS + 8, (Math.random() - 0.5) * 2.5, -Math.random() * 2.5, 30, i % 2 ? '#8a8a92' : '#b5b5bd', 2, 0.14));
        this.dropLoot(tx * TS + 8, ty * TS + 8, 0.6);
      }
    }
    if (changed) this.redrawBg();
  },
  /* una crepa colpita crolla insieme a tutte le crepe adiacenti (permanente) */
  crumble(tx, ty) {
    const floor = floorOf(this.room.ground), stack = [[tx, ty]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (tileAt(x, y) !== 'Q') continue;
      this.tiles[y][x] = floor;
      this.s.flags['bomb:' + this.roomId + ':' + x + ',' + y] = true;
      for (let i = 0; i < 10; i++) this.particles.push(new Particle(x * TS + 8, y * TS + 8, (Math.random() - 0.5) * 3, -Math.random() * 3, 34, ['#6a6070', '#9a90a0', '#3a3240'][i % 3], 2, 0.15));
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    Sound.sfx('crumble'); Sound.sfx('secret');
    this.saveGame();
  },

  /* ------------------------------ dialoghi ------------------------------ */
  say(entries, onClose) {
    if (this.dialog) {
      this.dialog.queue.push(...entries);
      if (onClose) { const prev = this.dialog.onClose; this.dialog.onClose = () => { if (prev) prev(); onClose(); }; }
      return;
    }
    this.dialog = { queue: entries.slice(), onClose: onClose || null };
    this.nextEntry();
  },
  nextEntry() {
    const d = this.dialog;
    this.itemGet = null;
    while (d.queue.length) {
      let e = d.queue.shift();
      if (typeof e === 'function') { const r = e(this); if (Array.isArray(r)) d.queue.unshift(...r); continue; }
      if (typeof e === 'string') e = { text: e };
      const m0 = /^([A-ZÀ-Ý?][^:]{0,18}):\s(.*)$/s.exec(e.text), m = m0 && !NOT_SPEAKER.test(m0[1]) ? m0 : null;   // Ciclo 47: «Inciso: ...», «Da dietro la porta: ...» non sono personaggi
      d.entry = e; d.speaker = m ? m[1] : null;
      const body = m ? m[2] : e.text;
      const lines = wrap(body, 226, 11);
      d.pages = []; for (let i = 0; i < lines.length; i += 4) d.pages.push(lines.slice(i, i + 4));
      d.pageIdx = 0; d.shown = 0; d.choiceIdx = 0;
      if (e.itemGet) { this.itemGet = e.itemGet; Sound.sfx('item'); }
      return;
    }
    const cb = d.onClose;
    this.dialog = null; this.itemGet = null;
    if (cb) cb();
  },
  updateDialog() {
    const d = this.dialog, page = d.pages[d.pageIdx];
    const total = page.join('').length;
    if (d.shown < total) {
      const before = d.shown | 0;
      d.shown += (Input.held('action') ? 2.5 : 1) * [1, 2.2, 999][Opts.text];
      if ((d.shown | 0) !== before && before % 3 === 0) Sound.sfx('blip');
      if (Input.hit('action') && d.shown > 3) d.shown = total;
      return;
    }
    const last = d.pageIdx === d.pages.length - 1;
    if (last && d.entry.choices) {
      const n = d.entry.choices.length;
      if (Input.hit('up')) { d.choiceIdx = (d.choiceIdx + n - 1) % n; Sound.sfx('select'); }
      if (Input.hit('down')) { d.choiceIdx = (d.choiceIdx + 1) % n; Sound.sfx('select'); }
      if (Input.hit('action')) {
        const c = d.entry.choices[d.choiceIdx];
        Sound.sfx('select');
        const r = c.fn ? c.fn(this) : null;
        if (Array.isArray(r)) d.queue.unshift(...r);
        this.nextEntry();
      }
      return;
    }
    if (Input.hit('action')) {
      if (!last) { d.pageIdx++; d.shown = 0; } else this.nextEntry();
    }
  },

  /* ------------------------- oggetti e interazioni ------------------------- */
  giveItem(kind, n) {
    const it = ITEMS[kind];
    return [g => g.applyItem(kind, n), { text: typeof it.text === 'function' ? it.text(n) : it.text, itemGet: kind }];
  },
  applyItem(kind, n) {
    const s = this.s;
    if (kind === 'gems') s.gems = Math.min(999, s.gems + (n || 1));
    else if (kind === 'key') s.keys++;
    else if (kind === 'container') { s.maxHp = Math.min(20, s.maxHp + 2); s.hp = s.maxHp; }
    else if (kind === 'bombs') { s.items.bombs = true; s.bombs = s.maxBombs; }
    else if (kind === 'bombpack') s.bombs = Math.min(s.maxBombs, s.bombs + (n || 5));
    else if (kind === 'bigbag') { s.items.bigbag = true; s.maxBombs = 20; s.bombs = s.maxBombs; }
    else if (kind === 'hookshot') { s.items.hookshot = true; s.equip = 'hookshot'; }
    else s.items[kind] = true;
    this.saveGame();
  },
  collect(p) {
    const s = this.s;
    if (p.kind === 'gem') { s.gems = Math.min(999, s.gems + 1); Sound.sfx('gem'); }
    else if (p.kind === 'gem5') { s.gems = Math.min(999, s.gems + 5); Sound.sfx('gem'); }
    else if (p.kind === 'heart') { s.hp = Math.min(s.maxHp, s.hp + 2); Sound.sfx('heart'); }
    else if (p.kind === 'bomb') { s.bombs = Math.min(s.maxBombs, s.bombs + 2); Sound.sfx('gem'); }
    else if (p.kind === 'container') this.say(this.giveItem('container'));
  },
  collectSeed(def) {
    const f = this.s.flags;
    f['seed:' + def.id] = true;
    const n = seedCount(this);
    Sound.sfx('fairy');
    const lines = [{ text: 'Hai trovato un SEME DELL\'ALBA! (' + n + '/' + SEED_IDS.length + ') È tiepido e brilla di una luce dorata.', itemGet: 'seed' }];
    if (n === 1) lines.push(f.victory
      ? 'Ortensio, il vecchio giardiniere, saprà certo cosa farne. Lo trovi davanti alle Rovine.'
      : 'Sembra un seme antico, legato al Cuore di Vesper... Ce ne saranno altri sparsi per la valle.');
    else if (n === SEED_IDS.length) lines.push(f.victory ? 'Li hai trovati tutti! Portali a Ortensio, davanti alle Rovine.' : 'Li hai trovati tutti! Chissà chi saprà farli germogliare...');
    this.saveGame();
    this.say(lines);
  },
  collectCrystal() {
    this.s.items.crystal = true;
    const extra = [];
    if (this.pickups.some(p => p.kind === 'container' && !p.dead)) {   // non perdere il cuore lasciato dal boss
      this.pickups.forEach(p => { if (p.kind === 'container') p.dead = true; });
      extra.push(...this.giveItem('container'));
    }
    this.saveGame();
    this.say(extra.concat([
      { text: ITEMS.crystal.text, itemGet: 'crystal' },
      'Il cristallo pulsa di una luce calda e dorata...',
      'Lontano, oltre le Rovine, il cielo comincia a schiarirsi.',
    ]), () => this.startEnding());
  },
  dropLoot(x, y, chance) {
    if (Math.random() > (chance === undefined ? 0.55 : chance)) return;
    if (tileAt(Math.floor(x / TS), Math.floor(y / TS)) === '_') return;   // finirebbe nell'abisso
    const s = this.s;
    let k = (s.hp < s.maxHp && Math.random() < [0.5, 0.35, 0.18][Opts.diff]) ? 'heart' : (Math.random() < 0.12 ? 'gem5' : 'gem');
    if (k !== 'heart' && s.items.bombs && s.bombs < s.maxBombs && Math.random() < (s.bombs < 3 ? 0.4 : 0.18)) k = 'bomb';
    this.pickups.push(new Pickup(x, y, k));
  },
  puff(x, y, col) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, v = 0.5 + Math.random() * 1.5;
      this.particles.push(new Particle(x, y, Math.cos(a) * v, Math.sin(a) * v, 20 + Math.random() * 15, col || (i % 2 ? '#ffffff' : '#c8c0e0'), 2, 0));
    }
  },
  spark(x, y) {
    for (let i = 0; i < 6; i++) this.particles.push(new Particle(x, y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 12, '#fff8c0', 1, 0));
  },
  cutTile(tx, ty) {
    const t = this.tiles[ty][tx];
    this.tiles[ty][tx] = floorOf(this.room.ground);
    if (t === 'V') {
      this.s.flags['cut:' + this.roomId + ':' + tx + ',' + ty] = true;
      if (this.room.onCutRovi) this.room.onCutRovi(this, tx, ty);
    }
    this.redrawBg();
    Sound.sfx('cut');
    const cx = tx * TS + 8, cy = ty * TS + 8;
    const cols = t === 'B' ? ['#3c8c34', '#5fb24e', '#1f4d1c'] : ['#7f4a82', '#f08ac0', '#5a2f5e'];
    for (let i = 0; i < 12; i++) this.particles.push(new Particle(cx + (Math.random() - 0.5) * 10, cy + (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 2, -Math.random() * 2, 30, cols[i % 3], 2, 0.12));
    if (t === 'B') this.dropLoot(cx, cy, 0.35);
  },
  tryUnlock(tx, ty, kind) {
    const p = this.player;
    if (p.msgCd > 0) return;
    if (kind === 'key') {
      if (this.s.keys <= 0) { p.msgCd = 200; this.say(['La porta è chiusa a chiave. Da qualche parte in queste rovine ci sarà una chiave...']); return; }
      this.s.keys--;
    } else if (!this.s.items.bigkey) {
      p.msgCd = 200; this.say(['Una grande porta avvolta da una corona di spine. Serve una chiave speciale.']); return;
    }
    const ch = this.tiles[ty][tx];
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (this.tiles[y][x] === ch) {
      this.tiles[y][x] = 'P';
      this.s.flags['open:' + this.roomId + ':' + x + ',' + y] = true;
      this.puff(x * TS + 8, y * TS + 8, '#e8c050');
    }
    this.redrawBg(); Sound.sfx('unlock'); this.shake = 4;
    this.saveGame();
  },
  tryInteract() {
    const p = this.player, v = DIRS[p.dir];
    const px = p.cx() + v.x * 10, py = p.cy() + v.y * 10 - 2;
    const pb = { x: px - 3, y: py - 3, w: 6, h: 6 };
    for (const e of this.entities) {
      if (e.dead) continue;
      if (e instanceof NPC && overlap(pb, e.box())) { this.say(e.talk(this)); return true; }
      if (e instanceof Chest && !e.opened && overlap(pb, e.box())) return e.open(this);
    }
    const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
    const sign = this.room.signs && this.room.signs[tx + ',' + ty];
    if (sign) { this.say(typeof sign === 'function' ? sign(this) : sign); return true; }
    if (tileAt(tx, ty) === 'c') {   // parlare oltre il bancone
      const pb2 = { x: pb.x + v.x * 16, y: pb.y + v.y * 16, w: 6, h: 6 };
      for (const e of this.entities) if (e instanceof NPC && overlap(pb2, e.box())) { this.say(e.talk(this)); return true; }
    }
    return false;
  },
  onPlayerDeath() {
    if (this.s.items.potion) {
      this.s.items.potion = false; this.s.hp = this.s.maxHp;
      this.player.hurtT = 120;
      Sound.sfx('heart'); this.puff(this.player.cx(), this.player.cy(), '#ff70b0');
      this.say(['La POZIONE ROSSA si spezza e ti rianima con il suo calore!']);
      return;
    }
    this.state = 'gameover'; this.menuIdx = 0; this.goT = 0;
    Sound.music(null); Sound.sfx('die');
    const sv = readSave();
    if (sv) { sv.deaths = (sv.deaths || 0) + 1; sv.time = this.s.time; try { localStorage.setItem(SAVE_KEY, JSON.stringify(sv)); } catch (e) {} }
  },
  onBossDefeated(boss) {
    this.s.flags[this.room.bossFlag || 'boss'] = true;
    for (const [x, y] of this.room.bossDoors || [[7, 10], [8, 10]]) this.tiles[y][x] = 'P';
    this.redrawBg();
    this.boss = null;
    this.pickups.push(new Pickup(boss.cx(), boss.cy() + 6, 'container'));
    if (boss instanceof Golem) {   // il golem non custodisce il cristallo: compare il forziere della stanza
      this.spawnChests();
      Sound.sfx('secret'); this.pickMusic();
      this.saveGame();
      return;
    }
    this.entities.push(new Crystal(7 * TS + 10, 4 * TS));
    Sound.sfx('secret'); Sound.music(null);
    this.saveGame();
    // Ciclo 3: il Re dei Rovi torna a essere il vecchio giardiniere Ortensio
    const npc = new NPC(Object.assign({}, GARDENER_BOSS, { x: Math.round(boss.cx() / TS - 0.5), y: Math.min(7, Math.round(boss.cy() / TS)) }));
    // Ciclo 4: mai sopra il cristallo (a volte compariva proprio lì e lo copriva)
    const cb = { x: 7 * TS + 10 - 10, y: 4 * TS - 10, w: 32, h: 36 };
    if (boxHitsSolid(npc.box(), {}) || overlap(npc.box(), this.player.box()) || overlap(npc.box(), cb)) { npc.x = 4 * TS; npc.y = 5 * TS - 4; }
    this.entities.push(npc); this.puff(npc.cx(), npc.cy(), '#ffe8a0');
    this.say(GARDENER_REDEMPTION);
  },
  startEnding() {
    this.state = 'ending'; this.endT = 0;
    Sound.music('village'); Sound.sfx('victory');
  },
  finishEnding() {
    this.s.flags.victory = true;
    this.player = new Player(7 * TS, 6 * TS - 6); this.player.dir = 0;
    this.lastName = '';
    this.loadRoom('o:1,2');
    this.state = 'fade'; this.fade = { dir: -1, t: 0, after: true };
    this.saveGame();
  },

  /* ------------------------------- UPDATE ------------------------------- */
  update() {
    this.t++;
    if (Input.hit('mute')) Sound.toggleMute();
    switch (this.state) {
      case 'title': return this.updateTitle();
      case 'play': return this.updatePlay();
      case 'scroll': return this.updateScroll();
      case 'fade': return this.updateFade();
      case 'options': return this.updateOptions();
      case 'guide': return this.updateGuide();
      case 'fishing': return this.updateFishing();
      case 'epilogue': return this.updateEpilogue();
      case 'prologue': return this.updatePrologue();
      case 'pause':
        if (Input.hit('item')) { this.openOptions('pause'); return; }
        if (Input.hit('start') || Input.hit('action')) { this.state = 'play'; Sound.sfx('select'); }
        else if (Input.hit('left') || Input.hit('right') || Input.hit('up') || Input.hit('down') || Input.hit('swap')) this.swapItem(true);
        return;
      case 'gameover': return this.updateGameOver();
      case 'ending':
        this.endT++;
        if ((Input.hit('action') || Input.hit('start')) && this.endT >= ENDING_DONE) this.finishEnding();
        return;
    }
  },
  titleItems() { return readSave() ? ['Continua', 'Nuova partita', 'Opzioni'] : ['Nuova partita', 'Opzioni']; },
  updateTitle() {
    if (this.newConfirm) return this.updateNewConfirm();   // Ciclo 12: conferma prima di sovrascrivere
    const items = this.titleItems(), n = items.length;
    if (this.menuIdx >= n) this.menuIdx = 0;
    if (Input.hit('up')) { this.menuIdx = (this.menuIdx + n - 1) % n; Sound.sfx('select'); }
    if (Input.hit('down')) { this.menuIdx = (this.menuIdx + 1) % n; Sound.sfx('select'); }
    if (Input.hit('action') || Input.hit('start')) {
      const it = items[this.menuIdx];
      if (it === 'Continua') {
        const sv = readSave();
        this.startFrom(sv, false); Sound.sfx('start');
        this.pendingRecap = recapLines(this, sv);   // Ciclo 14: mostrato dopo la dissolvenza (afterEnter)
      }
      else if (it === 'Opzioni') this.openOptions('title');
      else if (readSave()) { this.newConfirm = { idx: 1 }; Sound.sfx('select'); }   // c'è un salvataggio: chiedi prima (default: No)
      else { Sound.sfx('start'); this.startPrologue(); }   // nuova partita: prima il prologo (js/story.js)
    }
  },
  /* Ciclo 12: "Nuova partita" con un salvataggio esistente chiede conferma (prima lo sovrascriveva senza avvisare) */
  updateNewConfirm() {
    const c = this.newConfirm;
    if (Input.hit('up') || Input.hit('down') || Input.hit('left') || Input.hit('right')) { c.idx ^= 1; Sound.sfx('select'); }
    if (Input.hit('start') || Input.hit('item')) { this.newConfirm = null; Sound.sfx('select'); return; }
    if (Input.hit('action')) {
      this.newConfirm = null;
      if (c.idx === 0) { Sound.sfx('start'); this.startPrologue(); } else Sound.sfx('select');
    }
  },
  drawNewConfirmText() {
    const c = this.newConfirm, sv = readSave(), s = SCALE;
    if (!c || !sv) return;
    const bx = 30, by = 62, bw = 196, bh = 76;
    sctx.fillStyle = 'rgba(8,4,16,0.85)'; sctx.fillRect(0, 0, GW * s, GH * s);
    sctx.fillStyle = '#e8d8b0'; sctx.fillRect((bx - 1) * s, (by - 1) * s, (bw + 2) * s, (bh + 2) * s);
    sctx.fillStyle = '#1c1430'; sctx.fillRect(bx * s, by * s, bw * s, bh * s);
    const ch = allChests().filter(id => sv.flags && sv.flags['chest:' + id]).length;
    txt('Iniziare una nuova partita?', 128, by + 6, { size: 13, align: 'center', color: '#ffd870' });
    txt('Il salvataggio attuale andrà perso:', 128, by + 21, { size: 10, align: 'center', color: '#d8c8e8' });
    txt((ROOMS[sv.room] ? ROOMS[sv.room].name : '?') + ' · ' + fmtTime(sv.time) + ' · tesori ' + ch + '/' + allChests().length, 128, by + 31, { size: 10, align: 'center', color: '#ffb0a0' });
    txt("(le medaglie dell'Albo d'oro restano)", 128, by + 41, { size: 9, align: 'center', color: '#b0a0d0' });
    ['Sì, ricomincia', 'No, torna indietro'].forEach((l, i) => {
      const sel = i === c.idx;
      txt((sel ? '▶ ' : '  ') + l, [82, 172][i], by + 56, { size: 11, align: 'center', color: sel ? (i ? '#a0ffb0' : '#ff9a9a') : '#c8bcd8', maxW: [78, 100][i] });
    });
  },

  /* ------------------------ Ciclo 4: menu opzioni ------------------------ */
  /* Ciclo 12: le righe del menu sono una lista (prima indici fissi). Dalla pausa compare anche "Salva ed esci". */
  optRows() {
    return ['music', 'sfx', 'diff', 'text', 'fx', 'way', 'guide'].concat(this.optFrom === 'pause' && !this.rush ? ['quit'] : [], ['back']);
  },
  openOptions(from) { this.optFrom = from; this.optIdx = 0; this.state = 'options'; Sound.sfx('select'); },
  updateOptions() {
    const rows = this.optRows(), N = rows.length, row = rows[this.optIdx];
    if (Input.hit('up')) { this.optIdx = (this.optIdx + N - 1) % N; Sound.sfx('select'); }
    if (Input.hit('down')) { this.optIdx = (this.optIdx + 1) % N; Sound.sfx('select'); }
    const dx = Input.hit('left') ? -1 : Input.hit('right') ? 1 : 0;
    const back = () => { saveOpts(); this.state = this.optFrom; Sound.sfx('select'); };
    if (Input.hit('start') || Input.hit('item') || (Input.hit('action') && row === 'back')) return back();
    if (Input.hit('action') && row === 'guide') { this.guidePage = 0; this.state = 'guide'; Sound.sfx('select'); return; }
    if (Input.hit('action') && row === 'quit') {   // salva ed esci al titolo
      saveOpts(); this.saveGame(); this.dialog = null; this.state = 'title'; this.menuIdx = 0;
      Sound.music('title'); Sound.sfx('select'); return;
    }
    if (Input.hit('action')) { this.changeOpt(1, true); return; }
    if (dx) this.changeOpt(dx, false);
  },
  changeOpt(dx, wrapAround) {
    const k = this.optRows()[this.optIdx];
    if (!['music', 'sfx', 'diff', 'text', 'fx', 'way'].includes(k)) return;
    const max = k === 'music' || k === 'sfx' ? 5 : k === 'fx' ? 1 : 2;   // way (Ciclo 27): No / Se ti perdi / Sempre
    let v = Opts[k] + dx;
    if (wrapAround) v = v > max ? 0 : v; else v = Math.max(0, Math.min(max, v));
    Opts[k] = v; saveOpts();
    Sound.sfx(k === 'sfx' ? 'gem' : 'select');
  },
  drawOptions(c) {
    if (this.optFrom === 'title') this.drawTitle(c);
    c.fillStyle = 'rgba(10,6,20,0.9)'; c.fillRect(0, 0, GW, GH);
    c.fillStyle = '#e8d8b0'; c.fillRect(27, 27, 202, 138); c.fillStyle = '#1c1430'; c.fillRect(28, 28, 200, 136);
    const bar = (y, v) => { for (let i = 0; i < 5; i++) { c.fillStyle = i < v ? '#ffd870' : '#3a2f4a'; c.fillRect(150 + i * 13, y, 10, 7); } };
    bar(OPT_Y0 + 4, Opts.music); bar(OPT_Y0 + OPT_DY + 4, Opts.sfx);
  },
  drawOptionsText() {
    txt('OPZIONI', 128, 10, { align: 'center', size: 9, font: TITLE_FONT, color: '#ffd870' });
    const lab = { music: 'Musica', sfx: 'Effetti', diff: 'Difficoltà', text: 'Testo', fx: 'Effetti visivi', way: 'Segnavia', guide: 'Comandi e consigli', quit: 'Salva ed esci al titolo', back: 'Indietro' };
    const val = { diff: '◀ ' + DIFF_NAMES[Opts.diff] + ' ▶', text: '◀ ' + TEXT_NAMES[Opts.text] + ' ▶', fx: '◀ ' + (Opts.fx ? 'Sì' : 'No') + ' ▶', way: '◀ ' + ['No', 'Se ti perdi', 'Sempre'][Opts.way] + ' ▶' };
    const rows = this.optRows();
    rows.forEach((k, i) => {
      const sel = i === this.optIdx, y = OPT_Y0 + i * OPT_DY;
      txt((sel ? '▶ ' : '  ') + lab[k], 40, y, { size: 12, color: sel ? '#ffd870' : k === 'quit' ? '#ffb0a0' : '#d8c8e8' });
      if (val[k]) txt(val[k], 182, y, { size: 12, align: 'center', color: sel ? '#ffffff' : '#c8bcd8' });
    });
    const help = {
      music: 'Volume della musica.', sfx: 'Volume degli effetti sonori.',
      diff: ['Facile: i colpi forti tolgono solo mezzo cuore, più cuori dai nemici.', "Normale: l'avventura come è stata pensata.", 'Eroe: ogni colpo fa il doppio dei danni. Per veri eroi!'][Opts.diff],
      text: 'Velocità con cui compaiono i dialoghi.', fx: 'Fermo sui colpi, lampi, polvere, foglie e farfalle. "No" per un gioco più asciutto.',
      way: ['Nessuna freccia: la strada la cerchi tu.', 'Una freccia dorata indica la strada, ma solo se resti a lungo sullo stesso obiettivo.', 'Una freccia dorata indica sempre la strada verso il prossimo obiettivo.'][Opts.way],
      guide: 'Tutti i comandi per tastiera, gamepad e touch, e qualche consiglio senza spoiler.',
      quit: 'Salva la partita in questo punto e torna allo schermo del titolo.', back: 'Le opzioni si salvano da sole.',
    }[rows[this.optIdx]];
    wrap(help, 190, 10).slice(0, 2).forEach((l, i) => txt(l, 128, 142 + i * 9, { size: 10, align: 'center', color: '#a898c0' }));
    txt('Frecce: scegli e cambia · ' + (isTouch() ? 'B / MENU' : 'X / Invio') + ': indietro', 128, 172, { size: 10, align: 'center', color: '#a898c8' });
  },

  /* ------------------ Ciclo 12: guida "Comandi e consigli" ------------------ */
  updateGuide() {
    if (Input.hit('left') || Input.hit('right')) { this.guidePage ^= 1; Sound.sfx('select'); }
    if (Input.hit('action') || Input.hit('start') || Input.hit('item')) { this.state = 'options'; Sound.sfx('select'); }
  },
  drawGuideText() {
    const s = SCALE, pg = this.guidePage || 0;
    sctx.fillStyle = 'rgba(10,6,20,0.94)'; sctx.fillRect(0, 0, GW * s, GH * s);
    sctx.fillStyle = '#e8d8b0'; sctx.fillRect(9 * s, 21 * s, 238 * s, 146 * s);
    sctx.fillStyle = '#1c1430'; sctx.fillRect(10 * s, 22 * s, 236 * s, 144 * s);
    txt(pg ? 'CONSIGLI' : 'COMANDI', 128, 8, { align: 'center', size: 9, font: TITLE_FONT, color: '#ffd870' });
    txt((pg + 1) + '/2', 240, 9, { align: 'right', size: 10, color: '#b0a0d0' });
    if (pg === 0) {
      const dev = isTouch() ? 2 : usingPad() ? 1 : 0;
      txt('Stai usando: ' + ['la tastiera', 'un gamepad', 'il touch'][dev], 128, 26, { align: 'center', size: 10, color: '#a0ffb0' });
      const R = [
        ['Muoversi', 'Frecce o WASD', 'Croce o levetta', 'Levetta'],
        ['Parla, apri, colpisci', 'Spazio o Z', 'A', 'A'],
        ['Colpo rotante', 'tieni e rilascia Spazio', 'tieni e rilascia A', 'tieni e rilascia A'],
        ["Usa l'oggetto", 'X (o K, C, Shift)', 'B', 'B'],
        ['Cambia oggetto', 'Q (o Tab, V)', 'Y o dorsali', '⇄'],
        ['Pausa, mappa, obiettivo', 'Invio (o Esc, P)', 'Start', 'MENU'],
        ['Opzioni (dalla pausa)', 'X', 'B', 'B'],
        ['Diario (dalla pausa)', 'Q', 'Y o dorsali', '⇄'],
        ['Audio sì / no', 'M', '-', '-'],
      ];
      R.forEach((r, i) => {
        const y = 40 + i * 13.5;
        txt(r[0], 18, y, { size: 11, color: '#f4ecdc', maxW: 104 });
        txt(r[1 + dev], 238, y, { size: 11, align: 'right', color: '#ffd870', maxW: 112 });
      });
    } else {
      const tips = [
        "In pausa trovi l'obiettivo e la mappa; con Q il Diario, con le missioni scoperte.",
        "Parla con tutti: i dialoghi cambiano man mano che l'avventura va avanti.",
        "Cespugli e massi nascondono gemme e cuori. Le crepe nei muri, qualcos'altro...",
        "Il gioco si salva da solo a ogni stanza: se cadi, riprendi dall'ultima.",
        "Troppo difficile, o non sai dove andare? In Opzioni c'è \"Facile\", e il Segnavia.",
        'Dopo il finale la valle ha ancora segreti, un lago, medaglie da vincere e una sfida.',
      ];
      let y = 27;
      for (const t of tips) {
        const ls = wrap('• ' + t, 222, 11);
        ls.forEach((l, k) => txt(l, 18, y + k * 9.5, { size: 11, color: '#f4ecdc' }));
        y += ls.length * 9.5 + 4;
      }
      this.guideBottom = y;   // per il test: deve restare dentro il riquadro (fino a y = 166)
    }
    txt('←/→ pagina · ' + (isTouch() ? 'A / MENU' : 'Spazio / Invio') + ': indietro', 128, 172, { size: 10, align: 'center', color: '#a898c8' });
  },
  updatePlay() {
    if (this.banner && --this.banner.t <= 0) this.banner = null;
    if (this.dialog) { this.updateDialog(); return; }
    if (Input.hit('start')) { this.state = 'pause'; Sound.sfx('select'); return; }
    this.s.time += 1 / 60;
    if (this.shake > 0) this.shake--;
    this.player.update(this);
    if (this.state !== 'play') return;
    for (const e of this.entities) if (!e.dead) e.update(this);
    for (const p of this.projectiles) p.update(this);
    for (const p of this.pickups) p.update(this);
    for (const p of this.particles) p.update();
    this.entities = this.entities.filter(e => !e.dead);
    this.projectiles = this.projectiles.filter(e => !e.dead);
    this.pickups = this.pickups.filter(e => !e.dead);
    this.particles = this.particles.filter(e => !e.dead);
    if (this.roomId.startsWith('o:')) for (const f of this.flies) {
      f.ph += 0.05; f.vx += (Math.random() - 0.5) * 0.06; f.vy += (Math.random() - 0.5) * 0.06;
      f.vx *= 0.97; f.vy *= 0.97; f.x = (f.x + f.vx + PLAY_W) % PLAY_W; f.y = (f.y + f.vy + PLAY_H) % PLAY_H;
    }
    for (const f of this.snow || []) { f.ph += 0.03; f.y += f.v; f.x += Math.sin(f.ph) * 0.2; if (f.y > PLAY_H) { f.y = -2; f.x = Math.random() * PLAY_W; } }
    if (this.state !== 'play' || this.dialog) return;
    this.checkClear();
    this.checkWarps();
    if (this.state === 'play') this.checkEdges();
  },
  updateScroll() {
    const sc = this.scroll, p = this.player;
    sc.t++; p.moving = true; p.anim += 0.14;
    if (sc.t >= sc.dur) {
      // se il giocatore è finito dentro un tile solido (es. porta del boss che si richiude), spingilo dentro la stanza
      for (let k = 0; k < 40 && boxHitsSolid(p.box(), p.mopts); k++) { p.x += sc.dir[0]; p.y += sc.dir[1]; }
      this.scroll = null; this.state = 'play'; this.afterEnter();
    }
  },
  updateFade() {
    const f = this.fade;
    f.t++;
    if (f.dir === 1 && f.t >= 16) {
      this.loadRoom(f.w.to);
      this.player.x = f.w.x * TS; this.player.y = f.w.y * TS - 6;
      this.player.attackT = 0; this.player.kbx = this.player.kby = 0;
      this.player.dir = f.w.dir !== undefined ? f.w.dir : (f.w.to.startsWith('i:') || f.w.to.startsWith('d:') || f.w.to.startsWith('c:') ? 1 : 0);
      this.fade = { dir: -1, t: 0, after: true };
    } else if (f.dir === -1 && f.t >= 16) {
      this.fade = null; this.state = 'play';
      if (f.after) this.afterEnter();
    }
  },
  updateGameOver() {
    this.goT++;
    if (this.goT < 60) return;
    if (Input.hit('up') || Input.hit('down')) { this.menuIdx ^= 1; Sound.sfx('select'); }
    if (Input.hit('action') || Input.hit('start')) {
      Sound.sfx('select');
      if (this.menuIdx === 0) { const sv = readSave(); if (sv) this.startFrom(sv, true); else this.newGame(); }
      else { this.state = 'title'; this.menuIdx = 0; Sound.music('title'); }
    }
  },

  /* ------------------------------- RENDER ------------------------------- */
  render() {
    const c = bctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#000'; c.fillRect(0, 0, GW, GH);
    if (this.state === 'title') this.drawTitle(c);
    else if (this.state === 'ending') this.drawEnding(c);
    else if (this.state === 'prologue') this.drawPrologue(c);
    else if (this.state === 'fishing') this.drawFishing(c);
    else if (this.state === 'epilogue') this.drawEpilogue(c);
    else if ((this.state === 'options' || this.state === 'guide') && this.optFrom === 'title') this.drawOptions(c);
    else {
      c.save();
      const sx = this.shake ? (Math.random() * 4 - 2) | 0 : 0, sy = this.shake ? (Math.random() * 4 - 2) | 0 : 0;
      c.translate(sx, HUD_H + sy);
      c.beginPath(); c.rect(0, 0, PLAY_W, PLAY_H); c.clip();
      if (this.state === 'scroll') this.drawScroll(c); else this.drawWorld(c);
      if (this.fade) { c.fillStyle = 'rgba(0,0,0,' + Math.min(1, this.fade.dir === 1 ? this.fade.t / 16 : 1 - this.fade.t / 16) + ')'; c.fillRect(0, 0, PLAY_W, PLAY_H); }
      c.restore();
      this.drawHUD(c);
      if (this.state === 'pause') this.drawPause(c);
      if (this.state === 'options' || this.state === 'guide') this.drawOptions(c);
      if (this.state === 'gameover') { c.fillStyle = 'rgba(40,0,10,' + Math.min(0.85, this.goT / 60) + ')'; c.fillRect(0, 0, GW, GH); }
    }
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(buf, 0, 0, GW * SCALE, GH * SCALE);
    // ---- livello testo ad alta risoluzione ----
    if (this.state === 'title') return this.drawTitleText();
    if (this.state === 'ending') return this.drawEndingText();
    if (this.state === 'prologue') return this.drawPrologueText();
    if (this.state === 'fishing') return this.drawFishingText();
    if (this.state === 'epilogue') return this.drawEpilogueText();
    if (this.state === 'options') return this.drawOptionsText();
    if (this.state === 'guide') return this.drawGuideText();
    if (this.state !== 'pause') this.drawHUDText();
    if (this.boss && this.boss.state !== 'intro' && this.boss.state !== 'dying' && this.state === 'play') txt(this.boss.title || 'RE DEI ROVI', 128, HUD_H + 158, { align: 'center', size: 10, color: this.boss instanceof Golem ? '#b0e8ff' : '#ffb0d8' });
    if (this.banner && !this.dialog) {
      const a = Math.min(1, this.banner.t / 30, (150 - this.banner.t) / 15);
      sctx.globalAlpha = a * 0.75; sctx.fillStyle = '#0a0612';
      mctx.font = '12px ' + UI_FONT;   // Ciclo 8: il riquadro si adatta al nome (alcune stanze della Grotta uscivano dai 160 px)
      const bw = Math.min(GW - 8, Math.max(160, Math.ceil(mctx.measureText(this.banner.text).width) + 18));
      sctx.fillRect((128 - bw / 2) * SCALE, (HUD_H + 8) * SCALE, bw * SCALE, 16 * SCALE);
      sctx.globalAlpha = 1;
      txt(this.banner.text, 128, HUD_H + 10, { align: 'center', size: 12, color: '#f0e0b0', alpha: a });
    }
    if (this.dialog) this.drawDialog();
    if (this.state === 'pause') this.drawPauseText();
    if (this.state === 'gameover') this.drawGameOverText();
  },
  drawWorld(c) {
    c.drawImage(this.bg, 0, 0);
    this.drawAnimTiles(c);
    this.drawDecor(c);
    for (const p of this.pickups) p.draw(c, this);
    const list = this.entities.filter(e => !e.dead);
    if (this.player) list.push(this.player);
    list.sort((a, b) => a.sortY - b.sortY);
    for (const e of list) e.draw(c, this);
    for (const p of this.projectiles) p.draw(c, this);
    for (const p of this.particles) p.draw(c);
    if (this.room.ground === 'ice') this.drawFrost(c);
    if (this.room.dark) this.drawDark(c);
    if (this.roomId.startsWith('o:')) this.drawSky(c);
    if (this.boss && this.boss.state !== 'intro' && this.boss.state !== 'dying') {
      const r = Math.max(0, this.boss.hp / this.boss.maxHp);
      c.fillStyle = '#0a0612'; c.fillRect(63, 167, 130, 6);
      c.fillStyle = '#3a1a2a'; c.fillRect(64, 168, 128, 4);
      const ice = this.boss instanceof Golem;
      c.fillStyle = ice ? '#4aa8e8' : '#e04a8a'; c.fillRect(64, 168, Math.round(128 * r), 4);
      c.fillStyle = ice ? '#c0ecff' : '#ff9ad0'; c.fillRect(64, 168, Math.round(128 * r), 1);
    }
  },
  drawAnimTiles(c) {
    const f = (this.t >> 4) % 3, seed = strHash(this.roomId);
    for (const [tx, ty, ch] of this.animTiles) {
      const x = tx * TS, y = ty * TS;
      if (ch === '~') {
        c.drawImage(tileCanvas('~', hash2(tx, ty, seed) % 4, f, this.room.ground), x, y);
        const isW = (a, b) => { const t = tileAt(a, b); return t === '~' || t === null; };
        c.fillStyle = '#24477a';
        if (!isW(tx, ty - 1)) c.fillRect(x, y, 16, 3);
        c.fillStyle = (this.t >> 5) % 2 ? '#b8dcf8' : '#9cc8f0';
        if (!isW(tx - 1, ty)) c.fillRect(x, y, 1, 16);
        if (!isW(tx + 1, ty)) c.fillRect(x + 15, y, 1, 16);
        if (!isW(tx, ty + 1)) c.fillRect(x, y + 15, 16, 1);
      } else if (ch === 'Y') drawFlame(c, x + 8, y + 6, this.t + tx * 7);
    }
  },
  drawDecor(c) {
    for (const d of this.room.decor || []) {
      if (d.hideIfItem && this.s.items[d.hideIfItem]) continue;
      if (d.hideIfFlag && this.s.flags[d.hideIfFlag]) continue;
      if (d.showIfFlag && !this.s.flags[d.showIfFlag]) continue;
      if (d.glow) {   // Ciclo 4: alone dorato e petali che cadono (Albero dell'Alba)
        const cx = d.x * TS + 8, cy = d.y * TS + 12;
        c.fillStyle = 'rgba(255,220,120,' + (0.14 + Math.sin(this.t * 0.04) * 0.05) + ')';
        c.beginPath(); c.arc(cx, cy, 22, 0, Math.PI * 2); c.fill();
        if (this.t % 14 === 0) this.particles.push(new Particle(cx - 12 + Math.random() * 24, cy - 8 + Math.random() * 10, (Math.random() - 0.5) * 0.4, 0.25, 70, Math.random() < 0.5 ? '#ffb0d0' : '#ffe878', 1, 0));
      }
      if (d.icon) { const ic = ICON[d.icon]; c.drawImage(ic, Math.round(d.x * TS + 8 - (ic.width >> 1)), d.y * TS + 1); }
      if (d.beam) {
        const a = 0.18 + Math.sin(this.t * 0.05) * 0.06;
        const gr = c.createLinearGradient(0, 0, 0, d.y * TS + 14);
        gr.addColorStop(0, 'rgba(200,230,255,0)'); gr.addColorStop(1, 'rgba(200,230,255,' + a + ')');
        c.fillStyle = gr; c.fillRect(d.x * TS - 2, 0, 20, d.y * TS + 14);
        if (this.t % 8 === 0) this.particles.push(new Particle(d.x * TS + Math.random() * 16, d.y * TS + 12, 0, -0.35, 50, '#e0f0ff', 1, 0));
      }
    }
  },
  drawFrost(c) {   // grotta di ghiaccio: velo azzurro e fiocchi che cadono
    c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(150,200,255,0.35)'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore();
    for (const f of this.snow || []) {
      c.fillStyle = 'rgba(230,245,255,' + (0.45 + Math.sin(f.ph * 3) * 0.3) + ')';
      c.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
    }
  },
  drawDark(c) {
    const d = this.darkCanvas || (this.darkCanvas = makeCanvas(PLAY_W, PLAY_H));
    const x = d.getContext('2d');
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, PLAY_W, PLAY_H);
    x.fillStyle = 'rgba(4,2,10,0.95)'; x.fillRect(0, 0, PLAY_W, PLAY_H);
    x.globalCompositeOperation = 'destination-out';
    const lights = [[this.player.cx(), this.player.cy() - 3, (this.s.items.lantern ? 74 : 22) + Math.sin(this.t * 0.12) * 1.5]];
    for (const [tx, ty, ch] of this.animTiles) if (ch === 'Y') lights.push([tx * TS + 8, ty * TS + 4, 38 + Math.sin(this.t * 0.2 + tx) * 2]);
    for (const p of this.projectiles) lights.push([p.x + 2, p.y + 2, 10]);
    for (const p of this.particles) if (p instanceof Blast) lights.push([p.x, p.y, 70]);
    for (const e of this.entities) if (e.bomb) lights.push([e.cx() + 3, e.cy() - 6, 14]);
    for (const e of this.entities) if (e instanceof Seed) lights.push([e.x + 8, e.y + 8, 16 + Math.sin(this.t * 0.1) * 2]);
    for (const [lx, ly, lr] of lights) {
      const gr = x.createRadialGradient(lx, ly, lr * 0.3, lx, ly, lr);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(lx, ly, lr, 0, Math.PI * 2); x.fill();
    }
    c.drawImage(d, 0, 0);
    if (this.s.items.lantern) {
      c.fillStyle = 'rgba(255,190,110,0.07)';
      c.beginPath(); c.arc(this.player.cx(), this.player.cy() - 3, 60, 0, Math.PI * 2); c.fill();
    }
  },
  drawSky(c) {
    if (!this.s.flags.victory) {
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#c4a2d8'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore();
      for (const f of this.flies) {
        const a = 0.5 + Math.sin(f.ph * 2) * 0.5;
        c.fillStyle = 'rgba(230,255,140,' + (a * 0.25) + ')'; c.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 3, 3);
        c.fillStyle = 'rgba(240,255,170,' + a + ')'; c.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
      }
    } else {
      c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(255,236,190,0.5)'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore();
    }
  },
  drawScroll(c) {
    const sc = this.scroll, e = sc.t / sc.dur, [dx, dy] = sc.dir;
    const offX = e * PLAY_W * dx, offY = e * PLAY_H * dy;
    c.drawImage(sc.from, -offX, -offY);
    c.drawImage(this.bg, dx * PLAY_W - offX, dy * PLAY_H - offY);
    const p = this.player, sx = p.x, sy = p.y;
    p.x = sc.ox + (sc.nx + dx * PLAY_W - sc.ox) * e - offX;
    p.y = sc.oy + (sc.ny + dy * PLAY_H - sc.oy) * e - offY;
    p.draw(c, this);
    p.x = sx; p.y = sy;
    if (this.roomId.startsWith('o:') && !this.s.flags.victory) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#c4a2d8'; c.fillRect(0, 0, PLAY_W, PLAY_H); c.restore(); }
  },
  drawHUD(c) {
    c.fillStyle = '#140f1c'; c.fillRect(0, 0, GW, HUD_H);
    c.fillStyle = '#3a2f4a'; c.fillRect(0, HUD_H - 1, GW, 1);
    const s = this.s, n = s.maxHp / 2;
    for (let i = 0; i < n; i++) {
      const left = s.hp - i * 2;
      const ic = left >= 2 ? ICON.heart : left === 1 ? ICON.heartHalf : ICON.heartEmpty;
      const two = n > 8, x = 4 + (i % 8) * 8, y = two ? (i < 8 ? 1 : 8) : 4;
      const pulse = s.hp <= 2 && left > 0 && (this.t >> 4) % 2 ? -1 : 0;
      c.drawImage(ic, x, y + pulse);
    }
    c.drawImage(ICON.gem, 74, 4);
    c.drawImage(ICON.key, 110, 3);
    const eq = this.equipped();   // casella dell'oggetto equipaggiato (tasto X)
    if (eq) {
      c.fillStyle = '#e8d8b0'; c.fillRect(133, 1, 16, 14); c.fillStyle = '#2c2244'; c.fillRect(134, 2, 14, 12);
      const ic = ICON[eq]; c.drawImage(ic, 141 - (ic.width >> 1), 8 - (ic.height >> 1));
    }
    const order = ['sword', 'lantern', 'potion', 'bigkey', 'hook'];
    let x = 248;
    for (let i = order.length - 1; i >= 0; i--) {
      const k = order[i]; if (!s.items[k]) continue;
      const ic = ICON[k === 'sword' && s.items.dawnsword ? 'dawnsword' : k]; x -= ic.width + 4;
      c.drawImage(ic, x, Math.round((HUD_H - ic.height) / 2));
    }
  },
  drawHUDText() {
    txt(String(this.s.gems).padStart(3, '0'), 83, 2, { size: 12, color: '#c8ffd0' });
    txt('x' + this.s.keys, 119, 2, { size: 12, color: '#ffe8a0' });
    if (this.equipped() === 'bombs') txt(String(this.s.bombs).padStart(2, '0'), 151, 2, { size: 12, color: this.s.bombs ? '#d0d0ff' : '#ff8080' });
    if (EQUIPS.filter(k => this.s.items[k]).length > 1) txt(isTouch() ? '⇄' : 'Q⇄', this.equipped() === 'bombs' ? 164 : 151, 3, { size: 9, color: '#b0a0d0' });
    if (Sound.muted) txt('muto', 177, 3, { size: 9, color: '#8a7a9a' });
  },
  drawDialog() {
    const d = this.dialog, page = d.pages[d.pageIdx];
    const top = this.player && this.player.y + HUD_H > 112;
    const by = top ? HUD_H + 4 : GH - 58, bx = 8, bw = 240, bh = 54, s = SCALE;
    sctx.fillStyle = '#e8d8b0'; sctx.fillRect((bx - 1) * s, (by - 1) * s, (bw + 2) * s, (bh + 2) * s);
    sctx.fillStyle = '#4a3a6a'; sctx.fillRect(bx * s, by * s, bw * s, bh * s);
    sctx.fillStyle = 'rgba(16,10,28,0.96)'; sctx.fillRect((bx + 1) * s, (by + 1) * s, (bw - 2) * s, (bh - 2) * s);
    if (d.speaker) {
      mctx.font = '11px ' + UI_FONT;
      const w = Math.ceil(mctx.measureText(d.speaker).width) + 10, ty = top ? by + bh + 1 : by - 12;
      sctx.fillStyle = '#e8d8b0'; sctx.fillRect((bx + 6) * s, ty * s, w * s, 12 * s);
      sctx.fillStyle = '#2a1a3a'; sctx.fillRect((bx + 7) * s, (ty + 1) * s, (w - 2) * s, 10 * s);
      txt(d.speaker, bx + 11, ty, { size: 11, color: '#ffd870' });
    }
    let left = d.shown | 0;
    for (let i = 0; i < page.length; i++) {
      const l = page[i], show = l.slice(0, Math.max(0, left));
      left -= l.length;
      txt(show, bx + 7, by + 4 + i * 12, { size: 11, color: '#f4ecdc' });
    }
    const total = page.join('').length, done = d.shown >= total;
    const last = d.pageIdx === d.pages.length - 1;
    if (done && !(last && d.entry.choices) && (this.t >> 4) % 2) txt('▼', bx + bw - 10, by + bh - 12, { size: 10, color: '#ffd870' });
    if (done && last && d.entry.choices) {
      const ch = d.entry.choices, cw = 132, chh = ch.length * 12 + 6;
      const cx = bx + bw - cw, cy = top ? by + bh + 4 : by - chh - 4;
      sctx.fillStyle = '#e8d8b0'; sctx.fillRect((cx - 1) * s, (cy - 1) * s, (cw + 2) * s, (chh + 2) * s);
      sctx.fillStyle = 'rgba(16,10,28,0.97)'; sctx.fillRect(cx * s, cy * s, cw * s, chh * s);
      ch.forEach((o, i) => {
        const sel = i === d.choiceIdx;
        txt((sel ? '▶ ' : '  ') + o.label, cx + 5, cy + 3 + i * 12, { size: 11, color: sel ? '#ffd870' : '#c8bcd8', maxW: cw - 8 });
      });
    }
  },
  drawPause(c) {
    c.fillStyle = 'rgba(10,6,20,0.88)'; c.fillRect(0, 0, GW, GH);
    // riquadri
    const box = (x, y, w, h) => { c.fillStyle = '#e8d8b0'; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = '#1c1430'; c.fillRect(x, y, w, h); };
    box(8, 22, 150, 52); box(8, 82, 150, 76); box(166, 22, 82, 136);
    // inventario
    const inv0 = INVENTORY.filter(([k]) => !(k === 'bigkey' && this.s.flags.boss)), inv = inv0.length > 10 ? inv0.filter(([k]) => this.s.items[k]) : inv0;   // Ciclo 35: vinto il Re dei Rovi la Chiave del Re non serve più; con più di 10 voci solo gli oggetti posseduti
    const eq = this.equipped();
    inv.forEach(([k], i) => {
      const cols = inv.length > 10 ? 6 : inv.length > 8 ? 5 : 4, x = (cols === 6 ? 12 : cols === 5 ? 13 : 16) + (i % cols) * (cols === 6 ? 24 : cols === 5 ? 29 : 36), y = 100 + ((i / cols) | 0) * 26;   // Ciclo 31: 5 colonne con 9+ oggetti; Ciclo 37: 6 con 11+
      if (k === eq && (this.t >> 4) % 2) { c.fillStyle = '#ffd870'; c.fillRect(x - 3, y - 3, 16, 18); }
      c.fillStyle = '#2c2244'; c.fillRect(x - 2, y - 2, 14, 16);
      if (this.s.items[k]) { const ic = ICON[k === 'sword' && this.s.items.dawnsword ? 'dawnsword' : k]; c.drawImage(ic, x + 5 - (ic.width >> 1), y + 6 - (ic.height >> 1)); }
    });
    // mappa (valle, rovine o grotta)
    const pre = this.mapPrefix();
    const cur = this.roomId.startsWith('i:') ? null : this.roomId;
    const seenCol = { 'o:': '#4f8a3a', 'd:': '#5a5078', 'c:': '#4a7aa8', 'l:': '#3a8a8a', 'r:': '#7a4a3a', 'n:': '#a8b8cc', 't:': '#6a6a88', 'a:': '#c8a060', 'v:': '#8a6a3a', 'm:': '#4a9ab8' , 's:': '#a89878' , 'k:': '#7e6250', 'g:': '#a04a3a' , 'h:': '#a8c8e8', 'q:': '#9aa0c8' }[pre] || '#5a5078';
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
      const id = pre + gx + ',' + gy;
      if (!ROOMS[id]) continue;
      const compass = this.s.items.compass && typeof compassHas === 'function';   // Ciclo 18: Bussola dei Segreti (js/trade.js)
      if (ROOMS[id].secret && !this.visited.has(id) && !compass) continue;   // le stanze segrete compaiono solo dopo averle scoperte
      const x = 170 + gx * 25, y = 40 + gy * 18;   // Ciclo 8: miniature vere delle stanze (23x16)
      const seen = this.visited.has(id);
      c.fillStyle = '#0a0612'; c.fillRect(x - 1, y - 1, 25, 18);
      if (seen) c.drawImage(this.thumbOf(id), x, y);
      else { c.fillStyle = '#2c2244'; c.fillRect(x, y, 23, 16); c.fillStyle = seenCol; c.globalAlpha = 0.25; c.fillRect(x, y, 23, 16); c.globalAlpha = 1; }
      const r = ROOMS[id];
      if (r.boss && (pre === 'c:' || this.s.items.bigkey) && !this.s.flags[r.bossFlag || 'boss']) {
        c.fillStyle = '#0a0612'; c.fillRect(x + 9, y + 5, 5, 5);
        c.fillStyle = pre === 'c:' ? '#80d0ff' : '#e04a8a'; c.fillRect(x + 10, y + 6, 3, 3);
      }
      const closed = (r.chests || []).some(ch => !this.s.flags['chest:' + ch.id] && (!ch.cond || ch.cond(this)));
      if (seen && closed) { c.fillStyle = '#0a0612'; c.fillRect(x + 18, y + 1, 4, 4); c.fillStyle = '#ffd040'; c.fillRect(x + 19, y + 2, 2, 2); }
      if (compass && compassHas(this, id)) drawCompassStar(c, x + 4, y + 4, this.t + gx * 5 + gy * 3);
      if (id === cur) {   // stanza attuale: cornice che lampeggia + Lio
        if ((this.t >> 4) % 2) { c.fillStyle = '#ffd870'; c.fillRect(x - 1, y - 1, 25, 1); c.fillRect(x - 1, y + 16, 25, 1); c.fillRect(x - 1, y - 1, 1, 18); c.fillRect(x + 23, y - 1, 1, 18); }
        const px = x + Math.round(this.player.cx() / PLAY_W * 23), py = y + Math.round(this.player.cy() / PLAY_H * 16);
        c.fillStyle = '#0a0612'; c.fillRect(px - 2, py - 2, 4, 4); c.fillStyle = '#ff5050'; c.fillRect(px - 1, py - 1, 2, 2);
      }
    }
  },
  mapPrefix() {
    if (this.roomId.startsWith('d:')) return 'd:';
    if (this.roomId.startsWith('c:')) return 'c:';
    if (this.roomId.startsWith('l:')) return 'l:';
    if (this.roomId.startsWith('r:')) return 'r:';
    if (this.roomId.startsWith('t:')) return 't:';   // Ciclo 31: la Torre del Silenzio
    if (this.roomId.startsWith('n:') || /^i:(campanile|locanda)$/.test(this.roomId)) return 'n:';
    if (this.roomId.startsWith('a:') || /^i:(tenda|mappe)$/.test(this.roomId)) return 'a:';
    if (this.roomId.startsWith('m:') || /^i:(capitaneria|osteria|faro)$/.test(this.roomId)) return 'm:';
    if (this.roomId.startsWith('s:')) return 's:';   // Ciclo 36: il fondale scoperto
    if (this.roomId.startsWith('k:')) return 'k:';   // Ciclo 38: le gallerie sotto Brinavalle
    if (this.roomId.startsWith('h:') || this.roomId === 'i:mulino') return 'h:';   // Ciclo 40: le Terre del Vento   // Ciclo 34: la Costa (e le sue case)   // Ciclo 32: le Dune d'Ambra (e le tende)   // Ciclo 30: il Nord (e le sue case)
    return 'o:';
  },
  drawPauseText() {
    txt('PAUSA', 128, 5, { align: 'center', size: 9, font: TITLE_FONT, color: '#ffd870' });
    txt('OBIETTIVO', 14, 24, { size: 11, color: '#ffd870' });
    wrap(currentObjective(this), 138, 11).slice(0, 4).forEach((l, i) => txt(l, 14, 35 + i * 9.5, { size: 11, color: '#f4ecdc' }));
    txt('INVENTARIO', 14, 84, { size: 11, color: '#ffd870' });
    if (EQUIPS.filter(k => this.s.items[k]).length > 1) txt('frecce: cambia oggetto X', 152, 85, { size: 9, align: 'right', color: '#a898c0' });
    const inv0 = INVENTORY.filter(([k]) => !(k === 'bigkey' && this.s.flags.boss)), inv = inv0.length > 10 ? inv0.filter(([k]) => this.s.items[k]) : inv0;   // Ciclo 35: vinto il Re dei Rovi la Chiave del Re non serve più; con più di 10 voci solo gli oggetti posseduti
    inv.forEach(([k, name], i) => {
      const cols = inv.length > 10 ? 6 : inv.length > 8 ? 5 : 4, x = (cols === 6 ? 12 : cols === 5 ? 13 : 16) + (i % cols) * (cols === 6 ? 24 : cols === 5 ? 29 : 36), y = 100 + ((i / cols) | 0) * 26;   // Ciclo 31: 5 colonne con 9+ oggetti; Ciclo 37: 6 con 11+
      const label = cols === 5 && k === 'bigkey' ? 'Chiave' : name;   // a 5 colonne «Chiave Re» non ci sta (32 px su 29)
      if (cols < 6) txt(this.s.items[k] ? label : '---', x + 5, y + 14, { size: 9, align: 'center', color: this.s.items[k] ? '#f4ecdc' : '#8070a0', maxW: cols === 5 ? 29 : 36 });
    });
    if (inv.length > 10 && this.equipped()) txt(ITEMS[this.equipped()].name, 83, 145, { size: 10, align: 'center', color: '#ffd870', maxW: 140 });   // Ciclo 37: a 6 colonne, il nome dell'oggetto in mano
    txt({ 'o:': 'VALLE', 'd:': 'ROVINE', 'c:': 'GROTTA', 'l:': 'SANTUARIO', 'r:': 'RADICI', 'n:': 'NORD', 't:': 'TORRE', 'a:': 'AMBRA', 'v:': 'OSSERVATORIO', 'm:': 'COSTA' , 's:': 'FONDALE', 'w:': 'TEMPIO' , 'k:': 'GALLERIE', 'g:': 'CUORE' , 'h:': 'CIELO', 'q:': 'PALAZZO' }[this.mapPrefix()] || '', 207, 26, { size: 11, align: 'center', color: '#ffd870' });
    const ch = allChests(), open = ch.filter(id => this.s.flags['chest:' + id]).length;
    const stats = [
      ['Cuori ' + this.s.hp / 2 + '/' + this.s.maxHp / 2, '#ffb0b8'], ['Gemme ' + this.s.gems, '#c8ffd0'],
      ['Bombe ' + (this.s.items.bombs ? this.s.bombs + '/' + this.s.maxBombs : '-'), '#d0d0ff'], ['Tesori ' + open + '/' + ch.length, '#ffe8a0'],
      ['Semi ' + seedCount(this) + '/' + SEED_IDS.length, '#ffd060'], ['Tempo ' + fmtTime(this.s.time), '#c8bcd8'],
      ['Cadute ' + (this.s.deaths || 0) + ' · ' + DIFF_NAMES[Opts.diff], '#c8bcd8'],
    ];
    stats.forEach(([l, col], i) => txt(l, 172, 97 + i * 8.6, { size: 10, color: col }));
    const tch = isTouch();
    txt((tch ? 'A' : 'Spazio/Z') + ': azione · tienilo premuto e rilascia: colpo rotante', 128, 163, { size: 10, align: 'center', color: '#a898c0' });
    txt(tch ? 'B: oggetto/opzioni · ⇄: cambia · MENU: pausa' : 'X: oggetto · Q: cambia · in pausa X: OPZIONI', 128, 174, { size: 10, align: 'center', color: '#a898c8' });
  },
  drawGameOverText() {
    if (this.goT < 20) return;
    txt('SEI CADUTO...', 128, 60, { align: 'center', size: 12, font: TITLE_FONT, color: '#ff8080' });
    if (this.goT < 60) return;
    ['Riprova dall\'ultima stanza', 'Torna al titolo'].forEach((l, i) => {
      const sel = i === this.menuIdx;
      txt((sel ? '▶ ' : '  ') + l, 128, 100 + i * 16, { align: 'center', size: 13, color: sel ? '#ffd870' : '#c8bcd8' });
    });
  },

  /* ------------------------------ titolo/finale ------------------------------ */
  drawLandscape(c, t, dawn, sunAt) {   // sunAt (Ciclo 29): altezza del sole imposta, per farlo tramontare nel prologo
    // dawn: 0 = crepuscolo eterno, 1 = alba piena
    const g = c.createLinearGradient(0, 0, 0, GH);
    if (dawn < 0.5 && dawn <= 0) { g.addColorStop(0, '#1a1036'); g.addColorStop(0.45, '#5a2a6a'); g.addColorStop(0.75, '#c85a5a'); g.addColorStop(1, '#f0a050'); }
    else { g.addColorStop(0, '#5ab0f0'); g.addColorStop(0.5, '#a8d8f8'); g.addColorStop(0.8, '#ffd8a0'); g.addColorStop(1, '#ffb070'); }
    c.fillStyle = g; c.fillRect(0, 0, GW, GH);
    if (dawn <= 0) {
      for (let i = 0; i < 40; i++) {
        const x = (i * 97) % GW, y = (i * 53) % 90, tw = Math.sin(t * 0.05 + i) > 0.6;
        c.fillStyle = tw ? '#ffffff' : 'rgba(255,255,255,0.45)'; c.fillRect(x, y, 1, 1);
      }
    }
    // sole
    const sunY = sunAt !== undefined ? sunAt : dawn <= 0 ? 132 : 132 - Math.min(1, dawn) * 70;
    c.fillStyle = dawn <= 0 ? 'rgba(255,170,90,0.35)' : 'rgba(255,240,180,0.45)';
    c.beginPath(); c.arc(170, sunY, 30, 0, Math.PI * 2); c.fill();
    c.fillStyle = dawn <= 0 ? '#f08a48' : '#fff0b0';
    c.beginPath(); c.arc(170, sunY, 18, 0, Math.PI * 2); c.fill();
    // montagne
    const ridge = (base, amp, freq, col, seed) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, GH);
      for (let x = 0; x <= GW; x += 4) c.lineTo(x, base - Math.abs(Math.sin(x * freq + seed)) * amp - Math.sin(x * freq * 3.1 + seed) * amp * 0.25);
      c.lineTo(GW, GH); c.fill();
    };
    ridge(128, 40, 0.018, dawn > 0 ? '#7a6aa8' : '#3a2050', 1);
    ridge(146, 26, 0.03, dawn > 0 ? '#5a7a8a' : '#28143a', 4);
    // rovine sulla collina
    c.fillStyle = dawn > 0 ? '#3a4a5a' : '#1a0c26';
    c.fillRect(30, 118, 6, 30); c.fillRect(44, 112, 6, 36); c.fillRect(58, 122, 6, 26); c.fillRect(28, 112, 38, 5);
    ridge(162, 10, 0.05, dawn > 0 ? '#3a6a3a' : '#140a1e', 7);
    // alberi in primo piano
    c.fillStyle = dawn > 0 ? '#24502a' : '#0c0614';
    for (let x = -6; x < GW; x += 22) {
      const h = 20 + ((x * 13) % 14);
      c.beginPath(); c.moveTo(x, GH); c.lineTo(x + 9, GH - h - 18); c.lineTo(x + 18, GH); c.fill();
    }
  },
  drawTitle(c) {
    this.drawLandscape(c, this.t, 0);
    // l'eroe sulla roccia
    c.fillStyle = '#0c0614'; c.fillRect(196, 160, 40, 32); c.fillRect(200, 156, 30, 6);
    c.drawImage(SPR.hero.up[0], 206, 124, 32, 32);
    for (let i = 0; i < 12; i++) {
      const x = (i * 71 + Math.sin(this.t * 0.01 + i) * 20 + this.t * 0.1) % GW, y = 120 + Math.sin(this.t * 0.02 + i * 3) * 30 + i * 3;
      const a = 0.5 + Math.sin(this.t * 0.07 + i) * 0.5;
      c.fillStyle = 'rgba(240,255,170,' + a + ')'; c.fillRect(x | 0, y | 0, 1, 1);
    }
  },
  drawTitleText() {
    const bob = Math.sin(this.t * 0.04) * 2;
    txt('BRINAVALLE', 128, 34 + bob, { align: 'center', size: 18, font: TITLE_FONT, color: '#ffd870', shadowColor: '#5a1a3a' });
    if (this.newConfirm) { this.drawNewConfirmText(); return; }   // Ciclo 16: prima del sottotitolo, che sbucava dal riquadro
    txt('Il Cuore di Vesper', 128, 60, { align: 'center', size: 16, color: '#f8e8ff', shadowColor: '#3a1050' });
    const items = this.titleItems(), sv = readSave();
    // Ciclo 16: pannello scuro dietro il menu (sul rosso del tramonto le voci non selezionate avevano contrasto ~3)
    sctx.fillStyle = 'rgba(10,6,20,0.55)';
    sctx.fillRect(92 * SCALE, 83 * SCALE, 122 * SCALE, (14 * items.length + (sv ? 14 : 4)) * SCALE);
    items.forEach((l, i) => {
      const sel = i === this.menuIdx;
      txt((sel ? '▶ ' : '  ') + l, 100, 86 + i * 14, { size: 14, color: sel ? '#ffd870' : '#d8c8e8' });
    });
    if (sv) {
      const star = sv.flags && sv.flags.garden ? '  ★' : '';
      txt('(' + (ROOMS[sv.room] ? ROOMS[sv.room].name : '') + ' · ' + fmtTime(sv.time) + ')' + star, 100, 86 + 14 * items.length + 2, { size: 10, color: '#a898c0' });
    }
    txt(isTouch() ? 'Levetta · A azione · B oggetto · ⇄ cambia' : 'Frecce muovi · Spazio azione · X oggetto · Q cambia', 128, 180, { align: 'center', size: 10, color: '#d8c8e8' });
  },
  drawEnding(c) {
    const dawn = Math.min(1.2, this.endT / 400);
    if (this.endT < 40) { this.drawLandscape(c, this.t, 0); c.fillStyle = 'rgba(255,255,255,' + this.endT / 40 + ')'; c.fillRect(0, 0, GW, GH); return; }
    this.drawLandscape(c, this.t, Math.max(0.01, dawn));
    if (this.endT < 100) { c.fillStyle = 'rgba(255,255,255,' + (1 - (this.endT - 40) / 60) + ')'; c.fillRect(0, 0, GW, GH); }
    c.fillStyle = 'rgba(20,10,40,0.6)'; c.fillRect(0, 0, GW, GH);   // Ciclo 16: velo più scuro, il testo era a contrasto ~2
  },
  drawEndingText() {
    if (this.endT < 100) return;
    const s = this.s;
    const lines = ENDING_LINES.map(l => l.replace('{time}', fmtTime(s.time)).replace('{gems}', s.gems).replace('{deaths}', s.deaths || 0)
      .replace('{chests}', allChests().filter(id => s.flags['chest:' + id]).length + '/' + allChests().length)
      .replace('{seeds}', seedCount(this) + '/' + SEED_IDS.length));
    const y0 = Math.max(ENDING_STOP, GH + 10 - (this.endT - 100) * ENDING_SPEED);
    lines.forEach((l, i) => {
      const y = y0 + i * 10.5;
      if (y < -12 || y > GH) return;
      const big = l.startsWith('~');
      txt(l, 128, y, { align: 'center', size: big ? 14 : 11, color: big ? '#ffd870' : '#ffffff', shadowColor: '#2a1040' });
    });
    if (this.endT >= ENDING_DONE && (this.t >> 5) % 2) txt('Premi ' + actKey(true) + ' per tornare a Brinavalle', 128, 178, { align: 'center', size: 11, color: '#ffe8a0', shadowColor: '#2a1040' });
  },
};

const OPT_Y0 = 34, OPT_DY = 12;   // Ciclo 27: una riga in più (Segnavia)   // Ciclo 12: posizione delle righe del menu opzioni
const INVENTORY = [['sword', 'Spada'], ['bombs', 'Bombe'], ['hookshot', 'Arpione'], ['lantern', 'Lanterna'], ['potion', 'Pozione'], ['bigkey', 'Chiave Re'], ['hook', "Amo d'Oro"]];
const EQUIPS = ['bombs', 'hookshot'];   // oggetti usabili con il tasto X (si cambiano con Q)
const ENDING_LINES = [
  'Il Cuore di Vesper tornò a splendere',
  'sulla cima delle Rovine.',
  '',
  'Dopo tre lunghe lune di crepuscolo,',
  'il sole sorse di nuovo su Brinavalle.',
  '',
  'I rovi appassirono e la valle',
  'si risvegliò in un mattino dorato.',
  '',
  'Il vecchio Ortensio, libero dalle spine,',
  'tornò a curare i giardini del tempio.',
  '',
  'E il nome di Lio fu cantato',
  'per molte, molte generazioni.',
  '',
  '~ FINE ~',
  '',
  'Tempo: {time}   Gemme: {gems}   Cadute: {deaths}',
  'Tesori trovati: {chests}   Semi dell\'Alba: {seeds}',
  'Grazie per aver giocato!',
];
const ENDING_SPEED = 0.25, ENDING_STOP = Math.min(12, 164 - (ENDING_LINES.length - 1) * 10.5);   // scorre finché l'ultima riga è visibile
const ENDING_DONE = 100 + (GH + 10 - ENDING_STOP) / ENDING_SPEED;

/* ------------------------------ BOOT ------------------------------ */
(function boot() {
  buildGfx();
  buildGfx4();
  Sound.setLevels(Opts.music, Opts.sfx);
  resize();
  addEventListener('resize', resize);
  Input.init();
  Sound.music('title');
  let last = 0, acc = 0;
  const STEP = 1000 / 60;
  function frame(ts) {
    if (!last) last = ts;
    acc += Math.min(100, ts - last); last = ts;
    while (acc >= STEP) {
      Input.poll();
      try { Game.update(); } catch (err) { console.error(err); }
      Input.endFrame();
      acc -= STEP;
    }
    try { Game.render(); } catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.Game = Game;   // utile per il debug da console
})();
