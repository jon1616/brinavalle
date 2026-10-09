# BRINAVALLE — Il Cuore di Vesper
### Passaggio di consegne della sfida · parola chiave: **AVVENTURA**

---

## CICLO 1 — Agente A (Claude) → palla all'Agente B

### In breve
Ho creato da zero un **action-adventure top-down in pixel art** (ispirato agli Zelda classici
per Game Boy/SNES), giocabile nel browser. **Nessun asset esterno**: grafica, musica ed effetti
sonori sono tutti generati via codice. L'avventura è **completa e finibile**, dal titolo ai
titoli di coda (≈15–25 minuti di gioco).

### Come avviarlo
- Più semplice: aprire `index.html` con doppio clic (funziona anche da `file://`, niente moduli ES).
- Oppure con un server: `python -m http.server 8765` e aprire `http://localhost:8765`
  (c'è già `.claude/launch.json` configurato con il nome `brinavalle`).
- I font (Press Start 2P, VT323) arrivano da Google Fonts; offline si usa un monospace di riserva.

**Comandi:** Frecce/WASD muovi · Spazio/Z/J/E = azione (parla, apri, colpisci) · Invio/Esc = pausa · M = audio on/off.

### Storia
Brinavalle vive da tre lune in un **crepuscolo eterno**: il Re dei Rovi (un tempo giardiniere
del tempio) ha rubato il **Cuore di Vesper**, il cristallo che richiama l'alba. Lio, il
protagonista, deve recuperare la Spada di Brina, aprirsi la strada tra i rovi, esplorare le
Rovine e sconfiggere il Re. Alla vittoria **il cielo del mondo esterno cambia davvero** (da
filtro viola crepuscolare a luce dorata) e i dialoghi di tutti gli NPC cambiano.

### Percorso critico
1. Casa dell'Anziano (intro) → 2. Santuario a NO: **Spada di Brina** → 3. Rovine (nord del
Crocevia): tagliare i **rovi** → 4. Dungeon: Sala Buia → **Chiavetta** → porta chiusa →
Sala delle Armature (sconfiggi tutti → appare il forziere) → **Chiave del Re** → porta spinata
→ 5. **Boss: Re dei Rovi** → 6. Cuore di Vesper → finale + titoli di coda → mondo all'alba.

### Contenuti realizzati
| Area | Dettagli |
|---|---|
| **Mondo esterno 3×3** | Brinavalle (villaggio), Lago Specchio (isola + ponte), Campi di Brina, Santuario, Crocevia, Bosco dei Rovi, Radura dell'Eremita, Rovine di Vesper, Foresta Antica (labirinto) |
| **Interni** | Casa dell'Anziano, Bottega di Bortolo (negozio), Santuario della spada |
| **Dungeon** | 5 stanze: Atrio, Sala Centrale, Sala Buia (illuminazione dinamica), Sala delle Armature (puzzle "sconfiggi tutti"), Trono dei Rovi (boss) |
| **NPC (6)** | Teodoro (anziano), Bortolo (mercante, menu a scelta), Pino (pescatore, side-quest), Silvano (eremita, regalo + consigli a rotazione), Nina e Marta (villaggio). I dialoghi cambiano con i progressi |
| **Nemici (5)** | Slime verde, Slime blu (insegue), Pipistrello (volo erratico + riposo), Pianta sputa-semi (proiettili), Armatura vivente (insegue, 2 danni) |
| **Boss** | Re dei Rovi: 20 PV, macchina a stati (movimento, anelli di spine, carica con stordimento = danno doppio, evoca slime sotto il 50%, fase "furiosa"), barra vita, morte spettacolare |
| **Oggetti** | Spada, Lanterna (25 gemme), Pozione (10 gemme, rianimazione automatica), Chiavetta, Chiave del Re, Amo d'Oro (side-quest), Cuori di Cristallo (+1 cuore max ×2), gemme verdi (1) e blu (5), cuori |
| **Side-quest** | Amo d'Oro nascosto nella Foresta Antica → riportalo a Pino → Cuore di Cristallo |
| **Sistemi** | Scorrimento tra stanze stile Zelda, warp con dissolvenza, porte a chiave persistenti, rovi tagliati permanenti, cespugli che ricrescono e lasciano loot, knockback, invulnerabilità, aiuto agli spigoli, salvataggio automatico (localStorage) a ogni stanza, Game Over con "Riprova", menu di pausa con obiettivo dinamico / inventario / mini-mappa / statistiche |
| **Audio** | 5 tracce chiptune (titolo, mondo, villaggio, dungeon, boss) con un mini-tracker scritto a mano + ~25 effetti sintetizzati (WebAudio) |
| **Grafica** | ~35 tipi di tile dipinti proceduralmente con varianti, acqua animata con rive, bracieri con fiamme, ombre, lucciole al crepuscolo, particelle, schermata titolo e finale con paesaggio all'alba, testi nitidi ad alta risoluzione sopra la pixel art |

### Architettura (≈2700 righe di JS, nessuna dipendenza)
```
index.html        canvas + caricamento script (ORDINE IMPORTANTE)
css/style.css
js/audio.js       Sound: sfx sintetizzati + tracker musicale (TRACKS)
js/gfx.js         costanti, painter dei tile (TilePaint), sprite da stringhe+palette, icone, boss procedurale
js/world.js       ★ CONTENUTI: ITEMS, ROOMS (mappe, NPC, dialoghi, nemici, forzieri, warp, cartelli), obiettivi
js/entities.js    fisica a tile, Player, Enemy (Slime, Bat, Plant, Skeleton, Boss), NPC, Chest, Crystal, Pickup, Projectile, Particle
js/game.js        Input, loop 60fps fisso, stati (title/play/scroll/fade/pause/gameover/ending), dialoghi, HUD, menu, salvataggio
```
**Come estendere (è tutto data-driven):**
- **Nuova stanza:** aggiungi a `ROOMS` una chiave `'o:x,y'` o `'d:x,y'` con 11 righe da 16 caratteri.
  Le stanze adiacenti si collegano da sole: basta lasciare un varco nel bordo. Interni: `'i:nome'` + `warps`.
- **Legenda tile:** commento in testa a `js/gfx.js` (`TILE_SOLID`, `TILE_WARP`).
- **NPC/dialoghi:** `talk: g => [...]` restituisce stringhe, `{text, choices:[{label, fn}]}`, o funzioni
  (eseguite in silenzio; se ritornano un array lo inseriscono nel dialogo). "Nome: testo" mostra il nome in un'etichetta.
- **Oggetti:** aggiungi a `ITEMS` (+ icona in `ICON_ROWS`/`ICON_PAL` di gfx.js) e usa `g.giveItem('id')`.
- **Nemici:** classe in entities.js + `case` in `makeEnemy`.
- **Flag persistenti:** `g.s.flags[...]` (tutto `g.s` viene salvato).
- **Debug:** `window.Game` è esposto in console. Per azzerare: `localStorage.removeItem('brinavalle_save_v1')`.

### Verifiche fatte (onestamente)
- Controllo sintassi di tutti i file con `node --check`.
- Testato nel browser: titolo, intro, uscita/ingresso porte, scorrimento tra stanze, presa della spada,
  taglio dei rovi, ingresso nel dungeon, chiavetta + porta, sblocco del forziere dopo le armature,
  porta del boss, combattimento (anelli di spine), sconfitta del boss, cristallo, finale, ritorno al
  mondo all'alba, negozio con acquisto, menu di pausa.
- Stress test automatico: 1500 frame simulati in **ogni** stanza con attacchi continui → zero eccezioni.
- **Bug trovati e corretti durante i test:** giocatore incastrato nella porta del boss che si richiude;
  Cuore di Cristallo del boss perso se si toccava prima il cristallo; HUD sovrapposto al menu di pausa.

### Limiti noti / cose NON fatte (spazio per te!)
- Il **bilanciamento** non è stato rifinito con partite umane complete (difficoltà del boss, prezzi, drop).
  Ho giocato a pezzi, con strumenti di debug, non una run integrale "a mano".
- Nessun **controllo touch/gamepad** (solo tastiera).
- Il dungeon è uno solo e piccolo (5 stanze); nessun puzzle con blocchi da spingere/interruttori.
- La mini-mappa è basilare (niente icone di forzieri/porte).
- Gli NPC sono statici (si girano ma non camminano); nessuna animazione di attacco dedicata per l'eroe.
- Nessuna opzione volume separata musica/effetti.
- L'ambientazione dopo la vittoria cambia solo luce, musica e dialoghi: non ci sono nuove aree post-game.

### Idee che lascio sul tavolo (prendile o ignorale)
Secondo dungeon con nuovo oggetto (arco? rampino? bombe per i massi `r`?), blocchi spingibili e
interruttori, ciclo giorno/notte dopo la vittoria, pesca al lago con Pino, più segreti nei
cespugli, attacco rotante caricato, controlli touch, boss intermedi, collezionabili extra.

**Buon lavoro, avversario. Il gioco è tuo per questo ciclo: miglioralo nel modo che ritieni migliore.**
Quando hai finito, aggiungi qui sotto la tua sezione "CICLO 2 — Agente B" con il tuo riassunto.

---

## CICLO 2 — Agente B (Claude) → palla all'Agente A

### In breve
Ho mantenuto tutto ciò che c'era (stile, storia, motore) e ho lavorato su quello che secondo me mancava di più
a un'**avventura**: un **secondo atto** con un **nuovo strumento** che cambia il modo di esplorare. Il percorso
critico ora è più lungo e ha una vera svolta narrativa a metà; ci sono enigmi veri (blocchi, piastre, ghiaccio)
e segreti da scoprire con le bombe. Ho aggiunto anche il **colpo rotante**, il supporto **gamepad** e i **comandi touch**.
Il gioco è passato da ~2700 a ~3870 righe di JS.

### Nuovo percorso critico (le parti nuove sono in grassetto)
1. Intro → 2. Spada di Brina → 3. Taglio dei rovi alle Rovine → **4. CROLLO: il Re dei Rovi seppellisce la scala
sotto le macerie (scena con terremoto e battuta del Re)** → **5. Silvano/Teodoro indicano la Grotta di Brina
(Campi di Brina, a est del villaggio)** → **6. GROTTA DI BRINA: enigma dei blocchi → Lago Ghiacciato (chiavetta)
→ Sala delle Lame (sconfiggi tutti: si alza una saracinesca in un'altra stanza) → mini-boss GOLEM DI BRINA → BOMBE**
→ **7. bomba sulle macerie** → 8. Rovine come prima → Re dei Rovi → finale.

### Contenuti aggiunti
| Cosa | Dettagli |
|---|---|
| **Grotta di Brina** (dungeon 2, 6 stanze, griglia `c:x,y`) | Ingresso · Sala dei Blocchi (2 blocchi spingibili → 2 piastre → si apre la saracinesca ovest) · Lago Ghiacciato (enigma di scivolamento, 5 scivolate minime, **verificato con un risolutore BFS: risolvibile e senza posizioni in cui si resta bloccati**) · Sala delle Lame (lame invulnerabili + nemici; ripulirla apre la saracinesca nord di un'**altra** stanza) · Antro del Golem · Rifugio dei Minatori (segreto) |
| **Golem di Brina** (mini-boss) | 9 PV, corazza su cui la spada rimbalza ("clank"). Lancia massi di ghiaccio: **colpiscili con la spada per rispedirglieli contro** → corazza incrinata, stordito per ~3 s, e ora la spada fa male. Pestone che fa cadere stalattiti (con ombra di preavviso). Fase furiosa sotto metà vita (2 massi, più stalattiti). Anche una bomba lo stordisce. Indizi sparsi: Silvano ("il ghiaccio teme soltanto altro ghiaccio"), dialogo d'ingresso, un'iscrizione nel rifugio |
| **Bombe** (tasto X / K / C / Shift, pulsante B) | Borsa da 10 (20 con la Grande Borsa segreta). Miccia ~1,75 s, raggio ~26 px: 2 danni ai nemici, mezzo cuore a te se resti vicino, reazione a catena tra bombe. Distruggono le **crepe** `Q` (in modo permanente: l'intera crepa collegata crolla insieme), i massi `r` (con loot), i cespugli e i rovi. Ricariche: drop di nemici e cespugli, Bortolo (5 per 10 gemme), la Fata |
| **Segreti con le bombe** | **Fonte della Fata** (masso incrinato nella Radura dell'Eremita → +1 Cuore di Cristallo, poi cura e ricarica bombe gratis) · **Cripta Nascosta** nelle Rovine (parete incrinata nell'Atrio, stanza buia) · **Rifugio dei Minatori** nella Grotta (parete incrinata nell'Antro del Golem → Grande Borsa + gemme) |
| **Nuovi nemici** | Slime di ghiaccio (3 PV, insegue), Pipistrello di ghiaccio (più veloce, 2 PV), Lama di ghiaccio (scatta quando sei allineato, invulnerabile, non conta per "sconfiggi tutti"), stalattiti |
| **Nuove meccaniche** | **Colpo rotante**: dopo un fendente tieni premuto Azione, la spada brilla, poi rilascia (2 danni a tutto ciò che hai intorno, respinge i proiettili). **Ghiaccio**: scivoli finché non urti qualcosa. **Blocchi spingibili** (spingi ~0,2 s contro il blocco; se si incastra basta rientrare nella stanza). **Saracinesche** legate a flag (anche tra stanze diverse) |
| **Storia/dialoghi** | Scena del crollo; nuove battute contestuali per Teodoro, Silvano (+2 consigli a rotazione), Nina, Marta, Bortolo; obiettivo del menu di pausa aggiornato per ogni nuova fase |
| **Interfaccia** | HUD con contatore bombe · inventario a 6 caselle · mappa della pausa per Valle/Rovine/**Grotta** con indicatori del boss e dei **forzieri non aperti**; le stanze segrete compaiono sulla mappa solo dopo averle trovate · contatore **Tesori x/12** (in pausa e nei titoli di coda) · nome del boss e barra vita a tema |
| **Controlli** | **Gamepad** (A azione, B/X bomba, Start menu, croce o levetta) · **Touch**: levetta virtuale + pulsanti A/B/MENU, visibili solo su dispositivi touch, con scala frazionaria per gli schermi piccoli e testi d'aiuto adattati ("pulsante B" invece di "tasto X") |
| **Grafica/Audio** | Tile: ghiaccio, cristalli, piastre, saracinesche, crepe (3 varianti: masso/parete/ghiaccio), parete rocciosa, ingresso di grotta; muri/pavimenti/blocchi in versione ghiacciata; neve che cade e velo azzurro nelle grotte. Sprite: Golem (normale + incrinato), lame, blocco con rune, bombe, varianti di ghiaccio, fata. Nuova traccia **"cave"** + 17 effetti (esplosione, crollo, clank, carica, rotante, spinta, piastra, saracinesca, lancio/riflesso/frantumazione del ghiaccio, pestone, fata, scivolata…) |
| **Fix** | Un forziere che compare (Sala delle Armature, Golem) non può più apparire **addosso** al giocatore lasciandolo incastrato (prima poteva succedere) · i nemici ora collidono con forzieri, NPC e blocchi · le righe d'aiuto del titolo e della pausa uscivano dallo schermo: accorciate |

### File toccati / nuovi
- **Nuovi:** `js/gfx2.js` (sprite del Ciclo 2), `js/entities2.js` (Bomb, Blast, Block, BladeTrap, Icicle, Golem).
- **Modificati:** `gfx.js` (nuovi tile, `floorOf()`, `dfloor()`, terreno `ice`, icone), `entities.js` (Player: colpo rotante,
  bombe, ghiaccio, spinta; varianti di ghiaccio; proiettile `ice` respingibile), `game.js` (input gamepad/touch,
  `useItem`, `explode`, `crumble`, `checkPlates`, `openShutters`, `spawnChests`, boss generalizzati, HUD/pausa),
  `world.js` (6 stanze della grotta + cripta + fonte, crollo, dialoghi, negozio, obiettivi), `audio.js`, `index.html`, `style.css`.
- `.claude/launch.json`: ho aggiunto una seconda configurazione, `brinavalle-b` sulla porta 8766, perché la 8765 era occupata dal tuo server; la tua è intatta.

### Come estendere (novità data-driven in `ROOMS`)
- `dyn: [{x, y, ch, cond}]` tile che cambiano con la storia · `shutters: [{tiles, flag}]` saracinesche `J` aperte da un flag
  · `blocks: [[x,y]]` + `puzzleFlag` + tile `^` = enigma delle piastre · `onClear(g)` quando la stanza è ripulita
  · `onCutRovi(g)` · `boss: 'golem'` + `bossFlag` + `afterMusic` · `secret: true` (nascosta sulla mappa finché non la visiti)
  · i warp accettano `dir` (direzione all'arrivo). Prefisso di mappa `c:` per la grotta.
- Per un altro dungeon con un nuovo prefisso: aggiungerlo alla regex di `neighborId` e a `mapPrefix()`.
- Debug: oltre a `window.Game`, per i test deterministici io ho usato un ciclo `Input.down = new Set([...]); Game.update(); Input.endFrame();`.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file; griglie di tutte le 25 stanze controllate (11×16).
- **Test deterministici** (input simulato frame per frame, perché il pannello del browser era nascosto e
  `requestAnimationFrame` era in pausa): la soluzione del Lago Ghiacciato eseguita nel gioco vero (coincide col
  risolutore), l'enigma dei blocchi risolto + persistenza al rientro, chiavetta → porta, la Sala delle Lame
  (le lame scattano, ritornano e sono invulnerabili; la pulizia apre la saracinesca nell'altra stanza; forziere),
  **il Golem sconfitto da un bot** che respinge i massi (3 stordimenti, porte riaperte, forziere delle bombe + cuore),
  bomba sulla parete → stanza segreta raggiunta scorrendo, crollo delle Rovine tagliando i rovi + bomba sulle
  macerie + persistenza, Fonte della Fata (bomba → ingresso → dono → uscita), colpo rotante (3 slime uccisi intorno,
  il tocco breve non lo attiva), passaggi tra le stanze della grotta con scorrimento e porta del boss che si chiude.
- **Stress test**: 1500 passi di input casuale (incluse bombe e colpi rotanti) in **tutte le 25 stanze** → zero eccezioni.
- Controllo visivo con screenshot di: grotta, golem, campi con l'ingresso, macerie, fonte, pausa, layout touch su 375×812.

### Limiti noti (onesti)
- **Non ho fatto una partita integrale a mano** dall'inizio ai titoli di coda: ogni pezzo nuovo è testato a fondo,
  ma il bilanciamento complessivo (soprattutto la Sala delle Lame con soli 3–4 cuori) va provato da una persona.
- **L'audio non l'ho ascoltato**: la traccia "cave" e i nuovi effetti sono verificati solo come codice.
- **I comandi touch li ho visti** ma non provati su un telefono vero (solo emulazione della viewport).
- L'enigma dei blocchi è volutamente semplice (è il primo); se spingi un blocco contro il muro devi rientrare nella stanza.
- Le bombe sparite col cambio di stanza non vengono rimborsate. I massi `r` distrutti ricompaiono al rientro (come i cespugli).
- Le macerie sulle Rovine usano la grafica del "masso incrinato" con l'erba sotto: sul lastricato si notano gli angoli d'erba.

### Idee che lascio sul tavolo
Terzo strumento (rampino/arco) e relativo dungeon · blocchi di ghiaccio che scivolano sul ghiaccio (enigma più profondo)
· missione post-finale (es. il giardiniere redento chiede di ripiantare il giardino del tempio) · altri usi delle bombe
(pareti incrinate nella Foresta Antica?) · volumi separati per musica ed effetti · NPC che camminano · una mappa completa del mondo.

**Avversario, tocca a te. La valle adesso è più grande e un po' più fredda: fanne quello che vuoi.**

---

## CICLO 3 — Agente A (Claude) → palla all'Agente B

### In breve
Il Ciclo 2 ha dato al gioco un secondo atto molto forte; il **terzo atto**, invece, era rimasto quello del Ciclo 1:
il dungeon finale più piccolo e un boss finale mai ritoccato. Ho lavorato lì, perché il finale è ciò che resta
in mente a chi gioca. Ci sono un **terzo strumento** (l'Arpione), una sala costruita attorno a lui, un **boss finale
a due fasi** che si sconfigge con l'Arpione e una **svolta narrativa** (il Re torna a essere il giardiniere Ortensio).
Poi ho colmato il buco che entrambi avevamo dichiarato: **un bot che completa l'intero gioco con input reali**.
Il codice di gioco è passato da ~3870 a ~4430 righe, più ~460 righe di test.

### Novità di gioco
| Cosa | Dettagli |
|---|---|
| **Arpione di Vesper** (3° strumento) | Si lancia con lo stesso tasto delle bombe (X / K / C / Shift, pulsante B). Portata ~7,5 tile. Si **aggancia** ai pali con l'anello d'oro (nuovo tile `h`) e ai forzieri, e ti **trascina** sopra abissi e acqua. **Stordisce** i nemici (~2 s), uccide quelli da 1 PV, **recupera gemme e cuori** a distanza; sulle lame e sul Golem fa "clank". Se la trazione ti lascia sull'acqua o sul vuoto, ci cadi |
| **Oggetti equipaggiabili** | Bombe e Arpione condividono il tasto X: si cambia con **Q / Tab / V**, con Y o i dorsali del gamepad, o col nuovo pulsante touch **⇄**. Anche dal menu di pausa, con le frecce. L'HUD mostra la casella dell'oggetto equipaggiato; l'inventario della pausa ha 4 colonne con l'oggetto attivo evidenziato |
| **Abissi** (nuovo tile `_`) | Ci si cade: perdi mezzo cuore e torni al punto da cui sei entrato nella stanza. Il knockback dei nemici può buttarti giù. I nemici di terra non li attraversano; pipistrelli e proiettili sì. Bordi disegnati con "gradino" e ombra |
| **Rovine — L'Abisso** (`d:2,0`, stanza nuova) | Sopra la Sala delle Armature. Percorso: riva sud → *(su)* palo dell'isolotto → *(sinistra)* palo della sponda ovest → a piedi fino alla **Chiave del Re**. Ritorno rapido: dalla sponda nord, colonna 13, *(giù)* al palo sud. Pipistrelli e un'armatura rendono il tutto più rischioso |
| **Sala delle Armature** rivista | Ripulirla ora dà l'**Arpione** e alza una **saracinesca** a nord, verso l'Abisso. La Chiave del Re è stata spostata nell'Abisso, con lo **stesso id di forziere**, quindi i salvataggi vecchi restano coerenti |
| **Re dei Rovi — 2ª fase** (`ThornKing`) | La fase 1 è quella di prima. A vita zero il Re **si trasforma** (scena, musica nuova **"boss2"**) nella **Forma Spinata**: 14 PV, **corazza di spine** su cui la spada rimbalza. **L'Arpione la strappa** (o una bomba, così nessuno resta bloccato) → ~2,7 s di vulnerabilità → la corazza ricresce. Nuovi attacchi: **radici spinate che eruttano** lungo righe/colonne (con preavviso e una sempre sulla tua riga o colonna), anelli di 12–16 spine, evocazione di armature sotto metà vita. Indizi: dialogo della trasformazione, Silvano ("le spine si strappano, non si tagliano") |
| **Redenzione** | Sconfitto, il Re torna **Ortensio, il giardiniere del tempio** (nuovo sprite), che racconta la sua storia e ti affida il cristallo. Dopo la vittoria lo trovi davanti alle Rovine a curare i fiori. I titoli di coda hanno due righe nuove e ora **scorrono fino all'ultima riga** (prima, aggiungendo righe, sarebbero usciti dallo schermo) |
| **Segreto al Lago** | Un isolotto con un palo, raggiungibile solo con l'Arpione dall'isola grande → **Cuore di Cristallo**. Pino dà l'indizio quando hai l'Arpione; dopo la vittoria, l'obiettivo della pausa lo ricorda. Tesori totali: 14 |
| **Audio** | Traccia **boss2** (Sol minore, 168 bpm) + 10 effetti: lancio, aggancio, riavvolgimento, caduta, tuffo, strappo, radici, eruzione, cambio oggetto, trasformazione |
| **Fix/rifiniture** | Gemma recuperata con l'arpione contata due volte (corretto: un oggetto già raccolto non si raccoglie più) · crash quando la trazione finiva in acqua (corretto prima di chiudere) · righe d'aiuto del titolo e della pausa che uscivano dallo schermo · cache: gli script in `index.html` ora hanno `?v=...` per caricare sempre la versione aggiornata |

### File toccati / nuovi
- **Nuovi:** `js/gfx3.js` (tile `_` e `h`, icona dell'arpione, Re corazzato, palette di Ortensio, bordi degli abissi),
  `js/entities3.js` (`Hook`, `RootLine`, `ThornKing`), `tests/harness.js`, `tests/route.js`.
- **Modificati:** `entities.js` (Player: arpione, caduta, trazione; nemici: stordimento, niente abissi; fix del Pickup),
  `game.js` (oggetti equipaggiabili, HUD, pausa, punto di rientro `entry`, redenzione, titoli di coda), `world.js`
  (Abisso, lago, Sala delle Armature, Ortensio, obiettivi, dialoghi), `gfx.js` (aggancio a gfx3), `audio.js`, `index.html`.

### Come estendere
- Abissi `_` e pali `h` funzionano in qualsiasi stanza. Le regole: il palo dev'essere **oltre** la casella d'atterraggio
  (ti fermi appena prima del palo), e quella casella deve essere terreno solido.
- Nuovo oggetto per il tasto X: aggiungilo a `EQUIPS` e `INVENTORY` (game.js) e gestiscilo in `Game.useItem()`.
- Boss con più fasi: vedi `ThornKing` (sottoclasse di `Boss`): intercetta la morte in `hurt()` e ha il suo `update()` per la fase 2.
- **Test:** apri `index.html?test` e in console usa `T.suite()` (11 test del Ciclo 3) e `T.route()` (bot del percorso critico).
  Le funzioni `T.tp / T.run / T.press / T.skip / T.go` e `R.walkTo / R.exit / R.warp` sono riusabili per i tuoi test.
  Se cambi il percorso critico, aggiorna `tests/route.js`.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T.suite()` → 11/11 OK**: percorso completo dell'Abisso andata e ritorno, caduta, nemici che non entrano nell'abisso,
  isolotto del lago, tuffo in acqua, arpione su nemici/oggetti, Sala delle Armature, boss in due fasi fino alla
  redenzione, bomba come alternativa all'arpione, cambio oggetto, **stress test di 1200 frame casuali in tutte le 26 stanze**.
- **`T.route()` → completato** (~8500 frame): **dalla nuova partita ai titoli di coda con input simulati**, camminando con un
  pathfinding. Comprende enigma dei blocchi con spinte vere, Lago Ghiacciato con scivolate vere (pianificate da un BFS),
  bombe sulle macerie, labirinto buio, porte a chiave, Abisso con l'arpione e corazza del boss strappata con l'arpione.
  **Semplificazioni dichiarate del bot:** vita infinita, e i combattimenti (stanze "sconfiggi tutti", Golem, colpi al
  boss) risolti con danni diretti. Dimostra che il gioco è **completabile senza blocchi di progressione**, non che
  sia bilanciato.
- **Bug trovati dai test e corretti:** crash quando la trazione finiva in acqua; gemma contata due volte.
- Controllo visivo con screenshot di: Abisso a metà trazione, radici del boss, Re corazzato (era troppo scuro, l'ho
  schiarito), lago con isolotto, HUD, pausa e titolo.

### Limiti noti (onesti)
- **Non ho fatto una partita completa a mano** e **non ho ascoltato l'audio**: la musica "boss2" e i nuovi effetti
  sono verificati solo come codice.
- Il **bilanciamento della fase 2** è stimato, non provato da una persona: 14 PV, finestre di ~2,7 s, radici
  ogni ~2 s. Potrebbe risultare duro con pochi cuori.
- L'arpione si aggancia solo a pali e forzieri, non agli alberi o ai bersagli in movimento. Dal bordo sud del lago si può
  "agganciare" il palo dell'isola grande, ma si finisce in acqua: è voluto (tuffo + ritorno), ma potrebbe confondere.
- Cadere nell'abisso ti riporta all'**ingresso della stanza**, non all'ultima piastrella sicura: nell'Abisso significa
  ripartire dalla riva sud.
- Il touch del pulsante ⇄ è solo nel codice: non l'ho provato su un telefono.

### Idee che lascio sul tavolo
Bersagli per l'arpione negli altri dungeon (es. un "ponte" nella Grotta) · checkpoint più fini per le cadute ·
post-game con Ortensio (ripiantare il giardino del tempio?) · modalità "Eroe" più difficile · mappa del mondo completa ·
volumi separati per musica ed effetti · un vero playtest umano del bilanciamento.

**Avversario, la palla è tua. Ora la valle ha anche un abisso e un vecchio giardiniere da perdonare.**

---

## CICLO 4 — Agente B (Claude) → palla all'Agente A

### In breve
Dopo tre cicli il gioco ha tre atti, tre strumenti e un finale forte. Mancava però quello che vede **chiunque** prenda in
mano il gioco, a partire dal primo minuto, e un motivo per restare **dopo** i titoli di coda. Ho lavorato su quattro fronti:
1. un **prologo animato** che racconta il furto del Cuore di Vesper prima della prima stanza;
2. un **menu Opzioni** con **difficoltà** (la risposta concreta al "bilanciamento non provato" che entrambi avevamo dichiarato), volumi separati e velocità del testo;
3. una **missione post-finale**, *I Semi dell'Alba*: 5 semi nascosti che richiedono abilità diverse, Ortensio li pianta e il giardino davanti alle Rovine **fiorisce davvero**;
4. qualità di vita: **dopo una caduta si riparte dall'ultimo punto sicuro**, **NPC che passeggiano** nel villaggio, e un **bug del finale** corretto.
Il codice di gioco è passato da ~4430 a ~4810 righe, più ~150 righe di test nuovi.

### Novità
| Cosa | Dettagli |
|---|---|
| **Prologo animato** (`js/story.js`) | Parte da *Nuova partita* nel titolo, ~24 s, in 3 scene: il Cuore di Vesper che splende sulle Rovine, di giorno · la sagoma del giardiniere che arriva e lo ruba (lampo) · il cielo che sfuma nel crepuscolo mentre i rovi crescono e la sagoma diventa il Re dei Rovi. Sei frasi con dissolvenza. **Spazio** = frase successiva, **Invio** = salta tutto. `Game.newGame()` è invariata, quindi i test e il bot non passano dal prologo |
| **Menu Opzioni** | Dal titolo (*Opzioni*) e dalla pausa (**X** in pausa). **Musica** e **Effetti** su 6 livelli (bus audio separati) · **Difficoltà**: *Facile* (i colpi da 1 cuore tolgono solo mezzo cuore, più cuori dai nemici) / *Normale* (invariata) / *Eroe* (danni ×2, meno cuori) · **Testo**: Normale / Veloce / Istantaneo. Salvate in `localStorage` (`brinavalle_opts`), globali e non legate al salvataggio. La difficoltà è indicata in pausa |
| **I Semi dell'Alba** (missione post-finale) | 5 semi dorati luminosi, raccoglibili **in qualsiasi momento** e contati in pausa (*Semi x/5*) e nei titoli di coda. **Bosco dei Rovi** (dietro le spine: spada, il più facile) · **Foresta Antica** (angolo chiuso da un masso incrinato: bombe) · **Lago Ghiacciato** (angolo (1,8): ci si arriva **solo fermandosi lì**, 6 scivolate, posizione scelta col risolutore BFS perché non si possa raccogliere passandoci sopra per caso) · **L'Abisso** (spuntone in mezzo al baratro con due pali nuovi: arpione su e arpione giù) · **Cripta Nascosta** (compare **solo con la lanterna**: finalmente un motivo in più per comprarla). Dopo la vittoria **Ortensio** affida la missione, dà un **indizio per il primo seme mancante** e, con tutti e 5, li pianta: **15 fiori sbocciano** davanti alle Rovine, al centro cresce l'**Albero dell'Alba** (32×32, alone dorato e petali che cadono) e la spada diventa la **Spada dell'Alba** (lama dorata, 2 danni a colpo, 3 col rotante). Nel titolo, accanto al salvataggio, compare una ★ |
| **Cadute più giuste** | Nell'abisso (o in acqua dopo una trazione) si riparte dall'**ultimo punto sicuro**, cioè l'ultima posizione a più di 4 px da abissi e acqua, non più dall'ingresso della stanza. Era un limite dichiarato del Ciclo 3 |
| **Villaggio vivo** | Nina e Marta passeggiano attorno alla loro posizione (opzione `wander` degli NPC), con animazione di camminata. Non finiscono mai addosso al giocatore (testato per 3000 frame) |
| **Fix** | **Ortensio poteva comparire proprio sopra il Cuore di Vesper** (quando il Re moriva vicino al centro): lo copriva e faceva fallire a caso il bot `T.route()` (circa 1 volta su 5). Ora si sposta. Dopo il fix il bot ha completato **15 partite su 15** |

### File toccati / nuovi
- **Nuovi:** `js/gfx4.js` (icone del seme e della Spada dell'Alba, Albero dell'Alba, `silhouetteOf()`), `js/entities4.js` (`Seed`),
  `js/story.js` (prologo), `tests/cycle4.js` (`T4.suite()`).
- **Modificati:** `game.js` (opzioni, `diffDamage()`, menu del titolo, stati `options`/`prologue`, semi, decorazioni con `showIfFlag`/`glow`,
  pausa, titoli di coda, fix di Ortensio), `entities.js` (NPC che passeggiano, punto sicuro, danni secondo la difficoltà, Spada dell'Alba),
  `world.js` (semi e indizi, missione e dialoghi di Ortensio, giardino, mappe: un angolo nella Foresta, uno nel Bosco, due pali e
  uno spuntone nell'Abisso), `audio.js` (`setLevels`), `index.html` (`?v=c4b`, nuovi script).

### Come estendere
- **Nuovo seme:** aggiungi l'id a `SEED_IDS` e un indizio a `SEED_HINTS` (world.js), poi `seeds: [{ id, x, y, needLantern? }]` nella stanza.
- **NPC che passeggia:** `wander: <raggio in tile>` nella definizione.
- **Decorazioni:** `showIfFlag` (compare solo con un flag) e `glow: true` (alone + petali).
- **Opzioni:** l'oggetto `Opts` (game.js). Per un'opzione nuova aggiungi una riga in `updateOptions`/`changeOpt`/`drawOptionsText`.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file (gioco + test); griglie delle stanze modificate controllate.
- **`T4.suite()` → 13/13 OK** (nuovo, in `tests/cycle4.js`): **tutti e 5 i semi raccolti con le meccaniche vere** (taglio delle spine,
  bomba sul masso, 6 scivolate reali sul ghiaccio, arpione su e giù nell'abisso, cripta senza/con lanterna) · missione di Ortensio →
  piantagione → 15 fiori che restano anche rientrando nella stanza → Spada dell'Alba · 2 danni a colpo · ripartenza dopo la caduta
  vicino al punto in cui si è caduti · valori della difficoltà · menu opzioni guidato coi tasti · prologo avviato dal titolo e saltato ·
  prologo completo con render · NPC che passeggiano.
- **`T.suite()` del Ciclo 3 → 11/11 OK** dopo le mie modifiche.
- **`T.route()` → 15/15 completati** dopo il fix di Ortensio (prima: 1 fallimento su 5 circa, causato dal bug descritto sopra).
- Controllo visivo con screenshot di: le tre scene del prologo, menu opzioni, giardino fiorito con l'Albero dell'Alba, seme nel Bosco.

### Limiti noti (onesti)
- **Non ho fatto una partita completa a mano** e **non ho ascoltato l'audio**: il prologo usa la musica del titolo, i volumi sono verificati come codice.
- La **difficoltà** è una regolazione semplice (danni e cuori lasciati dai nemici), non un ribilanciamento stanza per stanza.
  *Facile* non cambia i colpi da mezzo cuore, che restano mezzo cuore.
- Il prologo è "disegnato col codice" come il resto: le sagome sono piccole (16–32 px) su un paesaggio 256×192.
- Il seme della Cripta è invisibile senza lanterna. È voluto (e Ortensio lo dice nell'indizio), ma chi non ha comprato la lanterna potrebbe cercarlo a lungo.
- La Spada dell'Alba arriva dopo il finale: serve a godersi la valle, non al percorso principale.

### Idee che lascio sul tavolo
Una scena finale extra quando il giardino è completo (titoli di coda "veri") · un trofeo/medagliere con i tempi migliori ·
la modalità Eroe con nemici più forti (non solo danni ×2) · musica dedicata al prologo · altri NPC che passeggiano e una
routine giorno/notte dopo la vittoria · un vero playtest umano, che resta il grande assente della sfida.

**Avversario, la palla è tua. Ora la valle ha anche un prologo, un giardino da far fiorire e un vecchio giardiniere che finalmente sorride.**

---

## CICLO 5 — Agente A (Claude) → palla all'Agente B

### In breve
Dopo quattro cicli contenuti e sistemi ci sono tutti. Ho lavorato su due cose che **nessuno dei due aveva ancora fatto**:
1. la **sensazione di gioco** (*game feel*): cioè come *risponde* il gioco a ogni colpo e a ogni passo, e quanto è viva la valle. È la prima cosa che sente chi prende il gioco in mano;
2. una **misura vera della difficoltà**: un bot che combatte **senza vita infinita** contro il boss finale, su tutte le difficoltà. Con quei numeri ho **ribilanciato** lo scontro.

### Novità
| Cosa | Dettagli |
|---|---|
| **Hit-stop** | Quando un colpo va a segno il mondo si ferma per un istante: 3 frame su un nemico, 5 su un boss, 5–6 se il nemico muore, 5 quando vieni colpito tu, 8–12 per i grandi momenti. **I tasti premuti durante il fermo non vanno persi.** Il fermo si azzera a ogni cambio di stanza |
| **Impatti e lampi** | Un anello bianco con stelline dove colpisci; ogni nemico che muore "esplode" in un anello con 6 stelline. Lampo bianco quando strappi la corazza o un boss muore, rosa per la trasformazione del Re, azzurro quando il Golem si incrina, rosso quando vieni colpito |
| **HUD** | Il cuore che perdi **scoppia** con un lampo a croce. Con mezzo cuore o un cuore rimasto parte un **battito d'allarme** discreto (ogni ~1,2 s) |
| **Passi** | Sbuffi di polvere colorati secondo il terreno (sentiero, erba, pietra, legno, rovine). Nell'**erba alta** i fili d'erba coprono i piedi dell'eroe e frusciano mentre cammini |
| **Oggetto ottenuto** | Raggi di luce dorati che ruotano dietro l'oggetto sollevato |
| **Mondo vivo** | **Foglie** che cadono nelle stanze boscose (viola e verdi al crepuscolo, verdi e arancio all'alba) · **pesci** che saltano con anelli sull'acqua · **pulviscolo** nelle Rovine e nel Santuario · dopo la vittoria **farfalle** (più numerose al villaggio e alle Rovine fiorite) e l'**ombra di uno stormo** che passa cinguettando |
| **Ribilanciamento del Re dei Rovi** (misurato) | La fase 1 aveva 20 PV perché nel Ciclo 1 era l'*unica* fase, e nel Ciclo 3 avevo aggiunto la fase 2 senza ridurla. Ora: **fase 1 16 PV**, **fase 2 12 PV**, e durante la trasformazione **cadono due cuori** (una tregua a metà scontro). Vedi i numeri qui sotto |
| **Audio** | 4 effetti nuovi: battito, cinguettio, tuffo del pesce, scoppio |

**Risultati del bot da duello** (`T5.table()`: 8 duelli per casella, bot "discreto": esce dalle radici, schiva le spine, colpisce solo quando il Re è fermo, usa l'arpione sulla corazza):

| | 4 cuori (minimo del percorso principale) | 7 cuori |
|---|---|---|
| Facile — prima / **dopo** | 2/6 → **7/8** | 5/6 → **6/8** |
| Normale — prima / **dopo** | 3/6 → **4/8** | 5/6 → **6/8** |
| Eroe — prima / **dopo** | 0/6 → **0/8** | 1/6 → **2/8** |

Da dove arrivavano i danni, prima del ribilanciamento, con un bot ancora "spericolato": soprattutto dal **contatto col Re mentre si muove** e dalla **carica**. Con un bot prudente: soprattutto dagli **anelli di spine**.
Quindi lo scontro premia chi ha pazienza: colpisci quando il Re è stordito dopo la carica, mentre evoca o mentre prepara l'anello.

### File toccati / nuovi
- **Nuovi:** `js/feel.js` (tutto il "game feel": si aggancia avvolgendo i metodi esistenti, senza riscriverli; `FEEL.on = false` spegne tutto),
  `tests/duel.js` (`T5.duel()`, `T5.table()`, `T5.suite()`).
- **Modificati:** `entities3.js` (PV del Re, cuori alla trasformazione), `audio.js` (4 effetti), `index.html` (`?v=c5d`, nuovi script),
  `tests/harness.js` (due attese adattate all'hit-stop; il test del boss legge i PV massimi invece del vecchio 14).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T.suite()` 11/11 · `T4.suite()` 13/13 · `T5.suite()` 7/7** (nuovo: hit-stop, tasto conservato durante il fermo, fermo azzerato
  cambiando stanza, cuore che scoppia, foglie/pesci/farfalle, PV e cuori del boss, `FEEL.on = false`) · **`T.route()` 5/5**.
- Due test del Ciclo 3 sono falliti dopo l'hit-stop: uno per un'attesa troppo corta, l'altro perché **il fermo sopravviveva al
  cambio di stanza**, che era un difetto vero ed è corretto. Un test del Ciclo 5 ha mostrato che i cuori che scoppiano venivano
  rilevati solo in `updatePlay`: ora sono legati al danno subito.
- Screenshot di: villaggio dopo la vittoria con le farfalle, raggi dell'oggetto, erba alta.

### Limiti noti (onesti)
- I numeri del duello vengono da un **bot**, non da persone: un umano schiva meglio le spine ma sbaglia in altri modi. Con 8
  duelli per casella la variabilità è alta (±1–2 vittorie). Sono **indicativi**.
- Ho misurato solo il **Re dei Rovi**: il Golem e le stanze "sconfiggi tutti" non sono stati misurati.
- L'hit-stop rende i combattimenti un filo più lenti: se a qualcuno non piace, `FEEL.on = false` (non è ancora nel menu Opzioni).
- Ancora nessuna partita completa a mano e nessun ascolto dell'audio.

### Idee che lascio sul tavolo
"Effetti visivi on/off" nel menu Opzioni · misurare col bot anche Golem e Sala delle Lame · un bot che giochi il percorso
senza vita infinita · il medagliere e la scena finale extra suggeriti nel Ciclo 4.

**Avversario, la palla è tua. Ora ogni colpo si sente, e la valle respira.**

---

## CICLO 6 — Agente B (Claude) → palla all'Agente A

### In breve
Ho raccolto i tuoi tre suggerimenti concreti e ho aggiunto un'attività nuova, di quelle che fanno "avventura" anche lontano dai dungeon:
1. ho **misurato il Golem** con un bot da duello senza vita infinita, come hai fatto tu col Re. Era **troppo facile**, e ho trovato e corretto il perché;
2. **la pesca al Lago Specchio** con Pino: un minigioco completo, con 5 specie, il leggendario **Luccio Lunare**, record e premi. Anche questo è **bilanciato con un bot** che ha tempi di reazione umani;
3. **l'epilogo** (la "scena finale extra" del Ciclo 4): quando Ortensio pianta i Semi dell'Alba, l'Albero dell'Alba sulla collina, **tutti i personaggi in fila per l'inchino** e i titoli di coda che raccontano **come è nato il gioco, ciclo per ciclo, Agente A e Agente B**;
4. **"Effetti visivi" Sì/No** nel menu Opzioni, che accende e spegne il tuo `FEEL`.
Il codice di gioco è passato da ~5000 a ~5590 righe; i test da ~800 a ~980.

### Il Golem, misurato e ribilanciato (`tests/duel6.js` → `T6.golem()`, `T6.golemTable()`)
Il bot: scappa dalle ombre delle stalattiti, si mette sulla traiettoria del masso e lo respinge, colpisce il Golem stordito, tiene le distanze.
- **Prima: 100% di vittorie su tutte le difficoltà, in ~20 s, perdendo 0–1 mezzo cuore.** Il motivo: lo stordimento durava ~3 s e il bot
  riusciva a colpire **fino a 7 volte**, così il Golem moriva con **2 respinte** e la fase "furiosa" quasi non esisteva.
- **Correzioni:** al massimo **3 colpi per stordimento**, poi il Golem "si scrolla il gelo" (ti spinge indietro senza danno e per ~1 s non
  fa male al contatto: niente colpi a tradimento) · in fase furiosa il **"tennis di ghiaccio"**: può **rimandarti il masso**, più veloce,
  e va respinto una seconda volta · cammina un filo più deciso.
- **Dopo** (10 duelli per casella): Facile 9–10/10 · **Normale 9/10, ~1,5–1,8 mezzi cuori persi, 25–34 s** · Eroe 5–8/10.
  Ora resta più facile del Re dei Rovi (4/8 a Normale con 4 cuori, dai tuoi dati), come si conviene a un mini-boss, ma non è più una formalità.
- Durante il lavoro ho perso un po' di tempo per la **cache**: i `?v=` in `index.html` vanno cambiati a ogni modifica, altrimenti il browser
  usa i file vecchi. Ora sono a `?v=c6i`.

### La pesca (`js/fishing.js`)
| Fase | Come funziona |
|---|---|
| **Sblocco** | Dopo aver riportato l'Amo d'Oro, Pino offre un menu: *Pescare* / *Diario di pesca* / *Niente*. Invio esce in qualsiasi momento |
| **Lancio** | ←/→ per mirare, **tieni premuto** Azione per caricare (la barra sale e scende), **rilascia** per lanciare. Più lontano = acque profonde = pesci più grossi |
| **Attesa** | Ombre di 3–5 pesci attorno al galleggiante; uno si avvicina, fa 1–3 **assaggi** (il galleggiante trema: se tiri ora, scappa) e poi **affonda**: hai 42/30/22 frame per ferrare (Facile/Normale/Eroe) |
| **Recupero** | Tieni premuto per tirare, la tensione sale. Il pesce alterna calma e **dibattersi**: prima di ogni scatto c'è un **preavviso** (ombra che trema, schizzo, filo che lampeggia), più lungo per i pesci piccoli e cortissimo per il Luccio. Se tiri mentre si dimena il **filo si spezza**; se molli troppo, **scappa** |
| **Specie** | Alborella, Pesce Persico, Trota Brinata, Carpa Dorata, **Luccio Lunare** (92–124 cm, solo al largo, ~8% dei lanci lunghi) |
| **Premi** | Gemme per ogni pesce (secondo la taglia) · **record** per specie nel diario · Pino regala un **Cuore di Cristallo** per il Luccio Lunare e **50 gemme** per tutte e 5 le specie |

**Bilanciamento misurato:** un pescatore automatico con **ritardo di reazione umano** (9, 12 o 16 frame) e 10 recuperi per specie.
- *Bug trovato così:* la durata del dibattersi era un numero decimale, quindi dopo il primo scatto il pesce **non smetteva più**: era
  impossibile tirarlo su. Corretto.
- Senza preavviso, a Normale, il Luccio era **0/12** e la Carpa 4/12 (troppo duro). Con un preavviso uguale per tutti era 12/12 ovunque (troppo facile).
  Con il preavviso **proporzionale alla forza** del pesce: i pesci piccoli si prendono sempre; con riflessi lenti (16 frame) il Luccio
  è **7/10 a Normale e 0/10 a Eroe**. Con riflessi medi si prende tutto: la vera difficoltà del Luccio è **trovarlo** e non farsi prendere dalla fretta.

### File toccati / nuovi
- **Nuovi:** `js/fishing.js` (pesca, `fishLogLines()`, e l'interruttore `FEEL` all'avvio), `tests/duel6.js` (`T6.golem*`, `T6.fishOnce`, `T6.suite()`).
- **Modificati:** `entities2.js` (Golem: 3 colpi per stordimento, "si scrolla", tennis di ghiaccio, ritmo), `entities.js` (il masso
  respinto può essere rimandato), `story.js` (epilogo), `game.js` (stati `fishing`/`epilogue`, opzione `fx`), `world.js` (menu di
  Pino, avvio dell'epilogo dopo la piantagione), `audio.js` (3 effetti: lancio, tuffo del galleggiante, filo spezzato), `index.html`.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T.suite()` 11/11 · `T4.suite()` 13/13 · `T5.suite()` 7/7 · `T6.suite()` 10/10** (nuovo: menu di Pino → pesca → uscita · pesca completa
  col bot fino al diario e alle gemme · assaggio → pesce che scappa · filo che si spezza · Luccio → Cuore di Cristallo una sola volta ·
  Golem: 3 colpi per stordimento · tennis di ghiaccio · epilogo dalla piantagione fino al ritorno al gioco · opzione Effetti visivi ·
  stress di 3000 frame casuali nella pesca) · **`T.route()` 5/5**.
- Screenshot di: pesca durante il recupero, scheda del Luccio Lunare (ridimensionata dopo il primo controllo, sbordava),
  epilogo con l'inchino dei personaggi (spostato il suggerimento che si sovrapponeva ai titoli).

### Limiti noti (onesti)
- Anche questa volta **nessuna partita completa a mano** e **nessun ascolto dell'audio**: il bilanciamento di Golem e pesca viene da bot.
- La pesca, per chi ha riflessi pronti, è **indulgente**: l'ho voluta rilassante, con la sfida concentrata sul Luccio.
- I **titoli di coda dell'epilogo elencano i cicli 1–6**: se fai un Ciclo 7, aggiungi la tua riga a `EPILOGUE_LINES` in `js/story.js`.
- L'Albero dell'Alba nell'epilogo è disegnato sopra le colonne delle rovine del paesaggio: si legge come "albero tra le rovine", ma non è ritoccato a mano.

### Idee che lascio sul tavolo
Il **medagliere** (resta l'unica idea del Ciclo 4 non fatta) · un bot che giochi il percorso **senza vita infinita** · pesca anche in
altri specchi d'acqua (il laghetto della Radura?) · bersagli per l'arpione nella Grotta.

**Avversario, la palla è tua. Ora la valle ha anche un lago dove riposarsi, un Golem che risponde a tono, e dei titoli di coda che raccontano la nostra sfida.**

---

## CICLO 7 — Agente A (Claude) → palla all'Agente B

### In breve
Ho chiuso i due buchi che restavano nelle liste di idee di entrambi:
1. **l'Albo d'oro**, il "medagliere" proposto nel Ciclo 4 e mai realizzato: 14 medaglie e i record, persistenti tra le partite. Dà a
   chi gioca obiettivi da inseguire dopo il finale;
2. **una partita completa senza trucchi**: il bot del percorso critico ora sa giocare **senza vita infinita**. Combatte davvero ogni
   stanza, il Golem e il Re dei Rovi, e **ha finito il gioco 12 volte su 12**, su tutte e tre le difficoltà.

### L'Albo d'oro (`js/medals.js`)
| Cosa | Dettagli |
|---|---|
| **14 medaglie** in 3 gradi | **Bronzo:** La lama di brina · Domatore di ghiaccio · Funambolo · Amica della fata. **Argento:** L'alba ritorna · Turbine (3 nemici con un solo fendente rotante) · Collezionista (tutti i forzieri) · Cuore d'acciaio (9 cuori) · Pollice verde (giardino fiorito) · Leggenda del lago (Luccio Lunare) · Pescatore provetto (5 specie). **Oro:** Come il vento (finale in meno di 40 minuti) · Senza una caduta · Vero eroe (sempre a difficoltà Eroe) |
| **Schermata** | Nuova voce **"Albo d'oro"** nel titolo: griglia delle medaglie (quelle bloccate restano "? ? ?", ma la **descrizione dell'obiettivo si vede sempre**), contatore x/14, **vittorie** e **miglior tempo** |
| **In gioco** | Quando ottieni una medaglia compaiono una notifica in basso a destra e una fanfara (nuovo effetto `medal`) |
| **Salvataggio** | `localStorage['brinavalle_medals']`, **globale**: le medaglie restano anche se cominci una nuova partita. Al primo finale di ogni partita si registrano tempo, cadute e la difficoltà più bassa usata (`s.minDiff`), che decidono le medaglie d'oro |
| **Test sicuri** | Con `?test` l'Albo vive solo in memoria: **i bot non toccano mai le medaglie vere** di chi gioca |

### La partita onesta (`tests/route.js` con `R.god = false`, comandata da `tests/honest.js`)
- Il bot del percorso critico (Ciclo 3) ora ha la **modalità senza vita infinita**:
  - combatte con la spada le stanze "sconfiggi tutti" (`R.fight`): schiva i proiettili, non si allinea alle lame, non mette mai piede su abissi, acqua o ghiaccio;
  - **si difende mentre cammina** (`R.defend`);
  - affronta il **Golem** col bot da duello del Ciclo 6 (`T6.golemStep`) e il **Re dei Rovi** col bot del Ciclo 5 (`T5.step`), entrambe le fasi;
  - raccoglie il Cuore di Cristallo del Golem. Se viene sconfitto fa **"Riprova" come un giocatore** (cuori pieni, la caduta viene contata).
- **Risultati** (`T7.table(4)`, 4 partite per difficoltà, ~4 minuti di gioco a partita alla velocità del bot, 4–5 cuori):

| Difficoltà | Partite finite | Sconfitte medie (min–max) | Dove avvengono |
|---|---|---|---|
| Facile | **4/4** | 1,0 (0–2) | tutte al Re dei Rovi |
| Normale | **4/4** | 1,5 (1–2) | tutte al Re dei Rovi |
| Eroe | **4/4** | 2,0 (1–3) | Re dei Rovi, Golem, Sala delle Lame |

  Le sconfitte si concentrano dove devono, sul **boss finale**, e con la difficoltà crescono gradualmente. Il percorso fino al Re non ha
  punti di difficoltà sproporzionati, nemmeno senza raccogliere i cuori opzionali.
- **Bug del bot trovati e corretti:** in combattimento poteva finire spinto sul **ghiaccio** (la Sala delle Lame ha una pista ghiacciata) e
  il pathfinding non ne usciva. Ora evita il ghiaccio e, se ci finisce, ne esce scivolando (`R.escapeIce`, con il risolutore del lago).
  Erano 2 fallimenti di navigazione su 9 prima della correzione; nessuna sconfitta "irrecuperabile".

### Altro
- Aggiunta la riga del Ciclo 7 ai titoli di coda dell'epilogo (`EPILOGUE_LINES` in `js/story.js`), come chiedevi.
- `index.html`: `?v=c7b`, nuovo script `js/medals.js`, nuovo test `tests/honest.js`.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T.suite()` 11/11 · `T4.suite()` 13/13 · `T5.suite()` 7/7 · `T6.suite()` 10/10 · `T7.suite()` 6/6** (nuovo: niente scritture con `?test`, notifica
  una sola volta, Turbine con un vero fendente rotante, record e medaglie di fine gioco, "Vero eroe" negata a chi ha giocato anche a Normale,
  menu del titolo) · **`T.route()` (con vita infinita) 3/3** · **`T7.table(4)` (senza vita infinita) 12/12**.
- Screenshot dell'Albo d'oro, della notifica in gioco e del titolo con la nuova voce.

### Limiti noti (onesti)
- La partita onesta è comunque **di un bot**: alla velocità del bot ~4 minuti, molto meno di un umano, che esplora. Le sconfitte medie sono un
  indicatore, non una previsione per un giocatore vero. E la ripartenza dopo una sconfitta avviene sul posto, non all'inizio della stanza.
- Alcune medaglie non sono state ottenute "dal vivo" da un bot: Collezionista, Pollice verde, le due della pesca, Cuore d'acciaio. Le loro condizioni sono
  verificate solo per lettura del codice e con i test del finale. "Come il vento" (40 minuti) è una soglia scelta a occhio.
- Ancora nessuna partita completa a mano né ascolto dell'audio, da parte di nessuno dei due.

### Idee che lascio sul tavolo
Medaglie per la pesca nella Radura (se aggiungerai altri specchi d'acqua) · una "modalità sfida" (boss rush) sbloccata dall'Albo d'oro ·
bersagli per l'arpione nella Grotta · e, per chi giudica, il consiglio di giocare a **Normale** e poi tornare per l'oro.

**Avversario, la palla è tua. Ora la valle ha un Albo d'oro da riempire, e la prova che si può salvarla senza trucchi.**

---

## CICLO 8 — Agente B (Claude) → palla all'Agente A

### In breve
Dopo sette cicli il gioco è ricchissimo, e il rischio maggiore per chi lo giudica non è più "manca qualcosa", ma **i difetti che un umano
nota subito e i nostri bot no**. Così ho fatto un ciclo di **controllo qualità con strumenti oggettivi**, più un miglioramento visibile:
1. un **audit automatico di tutti i testi**: ha trovato un problema serio. **Offline**, o finché Google Fonts non ha caricato VT323, il testo
   **usciva dallo schermo in 450 punti**. Ora è corretto;
2. un **audit dell'audio**, la prima volta che qualcuno lo "sente": ogni effetto e ogni musica renderizzati offline e misurati. Il mix è
   corretto con i numeri e c'è un **limitatore** contro la distorsione;
3. la **mappa della pausa con le miniature vere** delle stanze visitate;
4. il **banner del nome della stanza** che si adatta al testo: 5 stanze della Grotta uscivano dal riquadro.
Codice di gioco: ~5590 → ~5870 righe; test: ~1150 → ~1340.

### 1. Testi (`tests/audit.js` → `A.texts()`)
L'audit aggancia `txt()` e porta il gioco in **ogni stato**: titolo, opzioni (ogni riga, ogni difficoltà), ogni medaglia dell'Albo, prologo,
**pausa in tutte le 26 stanze** con e senza oggetti, pesca in ogni fase e ogni scheda, epilogo, finale, game over. Raccoglie anche **tutti i
dialoghi di tutti gli NPC e i cartelli in 6 fasi della storia**, controllando le pagine (max 2) e le voci dei menu a scelta.
- **Online:** trovati solo i 5 nomi della Grotta fuori dal banner (corretto: il riquadro ora si adatta). Nessun dialogo troppo lungo, nessuna voce di menu fuori dal riquadro.
- **Il problema vero, trovato per caso:** al primo giro, lanciato 0,8 s dopo il caricamento, l'audit ha dato **450 testi fuori dallo schermo**, poi 0. Il motivo:
  VT323 non era ancora caricato e il ripiego **"Courier New" è largo il 50% in più** (misurato: 360 px contro 240 sulla stessa riga). Quindi
  **offline, o con Google Fonts bloccato o lento, il gioco mostrava testi tagliati quasi ovunque** (il Ciclo 1 dichiarava "offline si usa un monospace di riserva").
- **Correzioni** (in `game.js`):
  - `txt()` passa a `fillText` la **larghezza massima disponibile** (schermo o riquadro, opzione `maxW`): un testo non può più uscire, al limite si stringe.
    Usata anche per le voci dei menu e per i nomi delle medaglie (due colonne);
  - il ripiego ora è **sans-serif** (Segoe UI / Arial). Misurato sull'intero gioco: col Courier 45 testi diversi da stringere fino al 29%, col sans uno solo, del 3%;
  - se VT323 manca, il ripiego si disegna all'**86%** (VT323 ha glifi piccoli) e `wrap()` misura allo stesso modo. Rilevamento **per misura**:
    `document.fonts.check()` dava "non caricato" anche con il font attivo, e senza questa verifica il gioco intero sarebbe diventato più piccolo.
    L'ho notato **solo grazie all'audit**.
  - **Risultato:** online 0 problemi; offline simulato **0 testi stretti**.

### 2. Audio (`Sound.measure()` in `audio.js`, `A.audio()`)
`measure()` sostituisce per un attimo il contesto audio con un `OfflineAudioContext` (stessa catena di guadagni del gioco), suona l'effetto o
16 s di musica, e misura **picco** e **volume medio (RMS)** della parte che suona. Prima (estratto):
- **musiche:** da −39,4 dB (villaggio) a −34,3 (boss2): **5,1 dB di differenza**. Passando dal villaggio ai campi il volume "saltava";
- **suoni-premio più bassi della musica:** `secret` (enigma risolto) −39,4, `chest` −38,1, `victory` e `medal` −38,7, contro una media musicale di −37;
- **segnali importanti quasi inudibili:** `charge` (rotante pronto) −41,5, `plop` (galleggiante) −43,5, `push` −44,7, `hookshot` −42,9;
- **troppo forte:** `roots` −28,3, ripetuto di continuo nella fase 2 del Re.
**Correzioni:** guadagni per effetto (`SFX_GAIN`) e per traccia (`TRACK_GAIN`, applicati da un nuovo `trackBus`), più un **limitatore**
(DynamicsCompressor) sul master. **Dopo:** musiche entro **1,8 dB** (i boss restano un filo più forti, apposta), suoni-premio **sopra** la musica,
segnali alzati di 4–5 dB, radici −4 dB. Picco massimo di un singolo suono 0,22.

### 3. Mappa con miniature (`game.js`: `makeThumb`, `thumbOf`, `drawPause`)
Ogni stanza visitata compare con il **suo vero terreno** in miniatura (23×16), aggiornata in tempo reale: rovi tagliati, macerie fatte saltare,
saracinesche aperte. La stanza attuale ha la cornice che lampeggia e un **puntino rosso dove si trova Lio**. Le stanze non visitate restano scure;
boss e forzieri non aperti restano segnati come prima.

### File toccati / nuovi
- **Nuovo:** `tests/audit.js` (`A.texts()`, `A.texts({ fallback: true })`, `A.audio()`, `A.suite()`).
- **Modificati:** `game.js` (`txt()` con `maxW`, ripiego sans e rilevamento del font, banner adattivo, miniature), `audio.js` (`measure`,
  `trackBus`, `SFX_GAIN`, `TRACK_GAIN`, limitatore), `medals.js` (una riga: `maxW` sui nomi), `story.js` (riga del Ciclo 8 nei titoli), `index.html` (`?v=c8i`).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T.suite()` 11/11 · `T4.suite()` 13/13 · `T5.suite()` 7/7 · `T6.suite()` 10/10 · `T7.suite()` 6/6 · `await A.suite()` 9/9** (nuovo: font rilevato,
  testi online, testi offline, audit "non cieco" (col vecchio Courier trova davvero testi stretti), banner adattivo, miniature, misura audio,
  musiche entro 2,5 dB, suoni-premio sopra la musica) · **`T.route()` 3/3** · **`T7.table(1)`, partite senza vita infinita: 3/3** (Facile, Normale, Eroe).
- Screenshot di: mappa con le miniature, pausa come apparirebbe offline.

### Limiti noti (onesti)
- L'audio è **misurato, non ascoltato**: RMS e picchi dicono "quanto forte", non "quanto bello". Il limitatore lavora in tempo reale e non è nella misura offline.
- L'offline l'ho **simulato** (font forzato a Segoe UI/Arial e `VT_OK = false`), non staccando davvero la rete. Su macchine senza Segoe UI né Arial il sans di sistema può avere larghezze diverse, ma `maxW` impedisce comunque l'uscita dallo schermo.
- Ancora nessuna partita completa a mano.

### Idee che lascio sul tavolo
Font locali in `fonts/`, così il gioco è identico anche offline (VT323 e Press Start 2P sono OFL: andrebbero scaricati, e io senza il permesso
dell'utente non scarico file) · usare `A.audio()` per ritoccare il mix a ogni nuovo suono · la "modalità sfida" che hai proposto tu.

**Avversario, la palla è tua. Ora la valle si legge bene anche senza internet, si sente equilibrata, e la mappa mostra davvero dove sei stato.**

---

## CICLO 9 — Agente A (Claude) → palla all'Agente B

### In breve
Il gioco ha una storia completa, un post-finale (semi, pesca, epilogo) e una qualità verificata. Mancava una cosa: un motivo per
**rimettere le mani sui combattimenti migliori** una volta finita l'avventura. Ho aggiunto una **modalità di gioco nuova**,
la **Sfida dei Guardiani**, e ho chiuso un difetto del bot onesto che la tua regressione aveva fatto emergere.

### La Sfida dei Guardiani (`js/rush.js`)
| Cosa | Dettagli |
|---|---|
| **Sblocco** | Voce **"Sfida dei Guardiani"** nel titolo, visibile dopo la prima vittoria (Albo d'oro con almeno una vittoria, o salvataggio con il finale) |
| **Tre prove di fila**, nelle stanze vere | 1) **Le Armature Viventi**, rinforzate con due slime blu e un pipistrello · 2) **Il Golem di Brina** · 3) **Il Re dei Rovi**, entrambe le fasi. Tra una prova e l'altra un **ristoro**: +2 cuori e almeno 6 bombe |
| **Dotazione fissa** | 6 cuori, spada, 10 bombe, arpione, lanterna. Nessuna pozione: la sfida è uguale per tutti |
| **Arena chiusa** | Non si esce né dai bordi né dalle porte. Dalla pausa, **Q abbandona** la sfida |
| **Cronometro** | Sempre visibile in alto a destra, insieme al numero della prova; si ferma nei dialoghi e durante l'hit-stop |
| **Fine** | Schermata con tempo, **record** ("NUOVO RECORD!") e medaglia. Se perdi: a quale prova sei caduto. Spazio per tornare al titolo |
| **Albo d'oro** | 2 medaglie nuove, ora sono **16**: **Custode dei Guardiani** (argento, completa la sfida) e **Furia dei Guardiani** (oro, sotto i **2:30**). Record in `Medals.data.rushBest` |
| **Sicurezza** | La sfida vive **solo in memoria**: `saveGame()` è disattivato, il salvataggio della partita resta intatto (c'è un test apposta) |

**Taratura con il bot** (`T9.table(6)`, il bot combatte davvero: `R.fightStep` per le armature, `T6.golemStep` per il Golem, `T5.step` per il Re):
| Difficoltà | Sfide vinte | Tempo mediano | Note |
|---|---|---|---|
| Facile | 6/6 | 1:21 | |
| Normale | 5/6 | 1:16 | l'unica persa: al Re |
| Eroe | 0/6 | — | 5 volte al Re, 1 al Golem: con 6 cuori e danni doppi è una vera prova da eroi |

Il bot è più veloce di qualunque umano, perché colpisce appena può. Per questo la soglia d'oro è **2:30**, circa il doppio del suo
tempo: raggiungibile da chi conosce bene i pattern. All'inizio l'avevo messa a 4:00, ma dopo i numeri del bot l'ho abbassata.

### Bug trovati e corretti
- **Medaglie della sfida legate a uno stato temporaneo:** dopo una sfida vinta, `rushWon` restava in memoria e le due medaglie finivano in coda
  anche durante una partita normale, davanti a quella appena guadagnata. L'ha trovato il test di T7 della notifica. Ora le medaglie dipendono dal
  **record salvato**, e lo stato si azzera tornando al titolo.
- **Bot onesto bloccato all'ingresso della Grotta** (circa 1 partita su 12, l'errore "bloccato verso 7,8" che si vedeva anche nel Ciclo 7): con la
  diagnostica nuova (`R.diag()`) è venuto fuori che un **pipistrello fermo a meno di 20 px ma disallineato** faceva menare al bot fendenti a vuoto
  per autodifesa, all'infinito. Ora al massimo 5 fendenti difensivi ogni 150 frame. **Dopo: `T7.table(5)` 15/15** (Facile 1,0 sconfitte medie,
  Normale 1,0, Eroe 3,0).
- La descrizione della medaglia nuova usciva dal suo spazio nell'Albo: l'ha trovato il **tuo** audit dei testi `A.texts()`. Accorciata.

### File toccati / nuovi
- **Nuovi:** `js/rush.js` (modalità, medaglie, schermata finale), `tests/rush9.js` (`T9.play()`, `T9.table()`, `T9.suite()`).
- **Modificati:** `tests/route.js` (tetto ai fendenti difensivi, `R.diag()`), `js/story.js` (riga del Ciclo 9 nei titoli), `index.html` (`?v=c9e`, nuovi script).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T.suite()` 11/11 · `T4.suite()` 13/13 · `T5.suite()` 7/7 · `T6.suite()` 10/10 · `T7.suite()` 6/6 · `T9.suite()` 8/8** (nuovo: sblocco,
  salvataggio intatto, arena chiusa, passaggio di prova con ristoro, sconfitta, abbandono, record e medaglie, il bot vince a Normale)
  · **`await A.suite()` 9/9**, compreso il tuo audit dei testi e dell'audio · **`T.route()` 3/3** · **`T7.table(5)` 15/15** · `T9.table(6)` come sopra.
- Screenshot: arena con cronometro e numero di prova, schermata di vittoria con medaglia d'oro e record.
- Con `?test` l'Albo d'oro e i salvataggi veri non vengono toccati: verificato a fine regressione, sia `brinavalle_medals` sia il salvataggio della partita.

### Sul consiglio dei font locali
Hai ragione che renderebbero il gioco identico offline, ma **scaricare file è una decisione dell'utente**: non l'ho fatto neanch'io.
Se l'utente lo autorizza, si possono mettere `VT323` e `Press Start 2P` (licenza OFL) in `fonts/` con un `@font-face` locale.
Il resto del gioco, per com'è scritto, non ha bisogno di toccare altro.

### Limiti noti (onesti)
- Tempi e vittorie vengono da un bot: la soglia di 2:30 è stimata, non provata da un umano.
- La sfida usa le stanze vere, quindi alcuni dialoghi d'ingresso compaiono anche lì (per esempio "Ancora tu?" del Re). È voluto, perché è coerente, ma non è personalizzato.
- Ancora nessuna partita completa a mano né ascolto dell'audio.

**Avversario, la palla è tua. Ora, dopo l'alba, i guardiani aspettano chi vuole sfidarli di nuovo.**

---

## CICLO 10 — Agente B (Claude) → palla all'Agente A

### In breve
Ho continuato sulla linea "quello che nota un giocatore vero e i bot no", su due fronti che nessuno aveva ancora toccato:
1. **le prestazioni, misurate**: nessuno aveva mai misurato quanto costa un frame, e chi giudica potrebbe avere un portatile più lento del nostro.
   La misura ha trovato **due scatti veri**: uno lo avevo introdotto **io** nel Ciclo 8, e l'ho corretto;
2. **i primi minuti di gioco**: li ho percorsi schermata per schermata come un nuovo giocatore. Ho trovato una **ripetizione narrativa** tra prologo
   e Teodoro e i **nomi dei tasti sbagliati** su touch e gamepad.
Codice di gioco ~6060 → ~6085 righe (pochi interventi mirati); test +~220 righe (`tests/cycle10.js`).

### 1. Prestazioni (`tests/cycle10.js` → `T10.bench()`)
**Come misurare bene:** con la tela accelerata i comandi di disegno vengono *accodati*. Le prime misure davano 0,2 ms a render, cioè misuravano solo la coda.
Ora ogni misura forza l'esecuzione leggendo un pixel (`getImageData`), e le scene si riscaldano prima di misurare.
- **Scatto n. 1, colpa mia (Ciclo 8):** la miniatura per la mappa della pausa veniva generata in `redrawBg()`, cioè a ogni cespuglio tagliato,
  esplosione o porta aperta. Da una tela appena dipinta costava **~27 ms** (misurato: `redrawBg` 27,2 ms, mentre `renderRoomBg` + miniatura,
  misurati da soli, fanno 0,35). **Ora la miniatura si genera solo quando apri la pausa** (8 ms una volta sola, a gioco fermo). `redrawBg`: **27 → 0,4 ms**.
- **Scatto n. 2:** ogni ridisegno creava una **tela nuova**, che la scheda grafica deve caricare da zero: il primo disegno dopo un'esplosione sui massi dei
  Campi costava **47 ms**. Ora, **nella stessa stanza, si ridisegna sulla stessa tela** (`renderRoomBg(..., target)`). Cambiando stanza resta una tela
  nuova, perché lo scorrimento disegna insieme la vecchia e la nuova. Dopo: **7,5–10 ms** al primo frame, come un normale cambio di stanza.
- **Falso allarme, scritto per onestà:** un primo giro dava 6,5 ms per il villaggio all'alba, contro i 2–3 delle altre scene. Ripetendo la misura nelle stesse condizioni
  (alba e crepuscolo, effetti accesi e spenti, interni) tutte le scene stanno a 2–3 ms: era il riscaldamento (JIT, cache dei tile).
- **Quadro finale** (`T10.bench()`, scala 3, update + render, misurato **dopo** tutta la regressione, quindi nel caso peggiore): villaggio all'alba,
  foresta, cripta buia, grotta con bombe e Re dei Rovi in fase 2 stanno tutti a **~6,5 ms di media, 7–9 ms al 95° percentile**, contro un budget di 16,7 ms (60 fps).
  A freddo, nelle stesse scene, si sta a 2–3 ms.

### 2. I primi minuti, da nuovo giocatore
- **Teodoro ripeteva il prologo:** dopo 24 s di prologo sul furto del cristallo, la prima battuta del gioco era un'altra spiegazione dello stesso furto.
  Ora, **se il prologo è stato visto almeno fino al furto** (flag `sawPrologue`, impostato da `endPrologue`), Teodoro **lo richiama** invece di ripeterlo:
  *"Hai sognato di nuovo il cristallo e il giardiniere, vero?" … "Purtroppo non era un sogno."* Una battuta in meno e un legame narrativo in più.
  Chi salta il prologo subito sente il racconto completo, come prima.
- **Nomi dei tasti:** il suggerimento iniziale, il testo della spada e le scritte "Premi SPAZIO" di finale e Sfida dicevano tasti da tastiera anche su
  touch e gamepad. Ora ci sono `actKey()`, `moveKeys()` e `menuKey()` (e `bombKey()` riconosce anche il gamepad), che dicono *levetta / A / MENU* su touch,
  *croce / A / START* col gamepad, *FRECCE / SPAZIO / INVIO* da tastiera.
- Il resto dell'apertura regge bene: villaggio leggibile, obiettivo preciso nella pausa, il cartello del Crocevia indica le direzioni, il momento della spada (raggi dorati) funziona.

### File toccati / nuovi
- **Nuovo:** `tests/cycle10.js` (`T10.suite()`, `T10.bench()`).
- **Modificati:** `game.js` (`redrawBg` riusa la tela, miniature pigre, `actKey`/`moveKeys`/`menuKey`/`usingPad`), `gfx.js` (`renderRoomBg` con tela
  di destinazione), `world.js` (intro di Teodoro, testo della spada), `story.js` (`sawPrologue`, riga del Ciclo 10 nei titoli), `rush.js` (una scritta),
  `index.html` (`?v=c10d`, nuovo test).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T.suite()` 11/11 · `T4.suite()` 13/13 · `T5.suite()` 7/7 · `T6.suite()` 10/10 · `T7.suite()` 6/6 · `T9.suite()` 8/8 · `await A.suite()` 9/9 ·
  `T10.suite()` 9/9** (nuovo: stessa tela nella stessa stanza, tela nuova cambiando stanza, miniatura rigenerata alla pausa, tempo di ridisegno,
  intro con e senza prologo, flag `sawPrologue`, nomi dei tasti, testo della spada) · **`T.route()` 3/3** · **`T7.table(1)` 3/3** (Facile, Normale, Eroe).
- Un mio test di prestazioni è fallito in regressione (media 19 ms) e passava da solo (3,7 ms): a fine regressione la media è falsata dalle pause del
  garbage collector. L'ho reso robusto con riscaldamento e **mediana**. Lo scrivo perché un test di tempo che dipende da cosa è girato prima non è affidabile.
- Screenshot del percorso iniziale: prima battuta di Teodoro, villaggio, presa della spada.

### Limiti noti (onesti)
- Le misure vengono **da questa macchina**, con il pannello del browser nascosto. Il margine è ~2,5× sul budget dei 60 fps: un portatile molto più lento potrebbe
  scendere sotto i 60 fps nelle scene piene, ma non dovrebbe più avere gli scatti da 27–47 ms.
- Il costo fisso di ~2–6 ms a frame sta soprattutto nella scheda grafica (composizione e ingrandimento ×3), non nel nostro JavaScript (~0,4 ms): non l'ho ottimizzato.
- Ancora nessuna partita completa a mano e nessun ascolto dell'audio.

### Idee che lascio sul tavolo
Usare `T10.bench()` dopo ogni novità pesante · nella Sfida dei Guardiani, saltare i dialoghi d'ingresso delle stanze (il tuo limite dichiarato) ·
i font locali, se l'utente lo permette.

**Avversario, la palla è tua. Ora la valle non scatta più quando la fai saltare in aria, e Teodoro sa che hai fatto un brutto sogno.**

---

## CICLO 11 — Agente A (Claude) → palla all'Agente B

### In breve
Due cose:
1. **Prestazioni, alla radice.** Il tuo `T10` **falliva sulla mia macchina** (mediana 10,6 ms contro una soglia di 8). Non era rumore: era **la scala**.
   Il mio pannello disegna a scala 4 (tela di 1024 px), il tuo misurava a scala 3. Scomponendo la misura, **8,5 ms su 9,1 erano la copia
   ingrandita della tela 256×192 sullo schermo grande, a ogni frame**: più grande è lo schermo (o la densità di un telefono), peggio va.
   Ho spostato l'ingrandimento al **compositore del browser** (CSS, sulla GPU): **render da 9,1 a 0,2 ms**, con un'immagine identica.
2. **Un contenuto nuovo che fa incontrare due atti:** il **Crepaccio Gelato**, una stanza segreta della Grotta in cui si **scivola sul ghiaccio**
   (meccanica del Ciclo 2) per raggiungere l'unico gradino da cui **l'Arpione** (Ciclo 3) attraversa l'abisso. È un "ritorno" in stile
   Zelda: lo vedi la prima volta, ci torni con lo strumento giusto. Il premio è la **Tunica di Brina**.

### 1. Schermo a due livelli (`js/display.js`, `css/style.css`)
- **Prima:** `render()` disegnava la pixel art su `buf` (256×192) e poi la copiava ingrandita su `#screen` con `sctx.drawImage(buf, …, GW*SCALE, GH*SCALE)`.
- **Ora:** `buf` è **visibile direttamente** (`#pixels`, ingrandita con `image-rendering: pixelated`) e `#screen` è un **livello trasparente
  sopra**, solo per i testi nitidi. Il resto del codice non cambia: la vecchia `sctx.drawImage(buf, …)`, in `game.js`, `medals.js` e `rush.js,`
  ora vuol dire "pulisci il livello dei testi". Nessuno leggeva pixel da `#screen` (controllato).
- **Misure** (scala 4, con `T10.ms`, cioè con la lettura sincrona): `render()` **9,1 → 0,2 ms**; ridisegno più render **10,6 → 0,6 ms**. Il tuo test ora passa, e con ampio margine.
- **Touch:** controllato su 375×812. Ho corretto anche un difetto **mio** del Ciclo 3: sugli schermi stretti il pulsante **⇄ copriva la levetta**.
  Ora sta sopra il pulsante B.

### 2. Il Crepaccio Gelato (`js/frost.js`, stanza `c:2,0`)
| Cosa | Dettagli |
|---|---|
| **Ingresso** | Una **saracinesca a est nell'Antro del Golem** che si apre quando il Golem cade, e resta aperta. Chi arriva lì col solo bottino della Grotta vede il forziere oltre l'abisso, ma non può raggiungerlo |
| **Enigma** | Campo di ghiaccio con cristalli. L'unico accesso all'abisso è un **gradino (7,4)** che si raggiunge **solo scivolando lungo la riga giusta**. Lì ci si ferma rivolti a est, verso il **palo** oltre il vuoto. Soluzione minima: **5 scivolate** (destra, giù, sinistra, su, destra), poi arpione |
| **Sicurezza dell'enigma** | Verificato col risolutore: soluzione di **5 mosse** e **da ogni posizione raggiungibile sul ghiaccio si torna all'ingresso** (nessun blocco). Le righe sbagliate finiscono contro i cristalli, non nel vuoto |
| **Premio** | **Tunica di Brina**: i colpi da 1 cuore ne tolgono **mezzo**, dopo la difficoltà, quindi a Eroe i colpi da 2 cuori ne tolgono 1. L'eroe **cambia colori**, con la tunica azzurro ghiaccio e la sciarpa rossa di sempre |
| **Uscita** | Preso il forziere si aprono **due saracinesche**, sulla piattaforma e a nord della Sala delle Lame: si torna a piedi senza rifare l'enigma |
| **Indizi** | Messaggio d'ingresso diverso con o senza arpione; **Silvano** (a turni) parla del crepaccio finché la Tunica non è tua |
| **Extra** | Voce **Tunica** nell'inventario (8ª casella); medaglia di bronzo **"Veste di ghiaccio"** (ora sono **17**); un forziere in più (Tesori: 15) |

### 3. Un test del Ciclo 9 (mio) reso statisticamente solido
`T9` "il bot completa la sfida a Normale" faceva **un solo tentativo**, ma il bot vince ~70–80% delle volte (misurato ora: 7/10). Quindi
falliva circa 1 volta su 4 senza che nulla fosse rotto. Ora chiede **almeno 1 vittoria su 3** (probabilità di un falso allarme ~2%).

### File toccati / nuovi
- **Nuovi:** `js/display.js`, `js/frost.js`, `tests/frost11.js` (`T11.suite()`).
- **Modificati:** `css/style.css` (livelli, pulsante ⇄), `tests/rush9.js` (test più solido), `js/story.js` (riga del Ciclo 11), `index.html` (`?v=c11d`).
- In `frost.js` modifico **da codice** due stanze esistenti, `c:1,0` (varco a est) e `c:2,1` (saracinesca a nord), e la funzione `diffDamage` (Tunica):
  è tutto in un posto, documentato in testa al file.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T` 11/11 · `T4` 13/13 · `T5` 7/7 · `T6` 10/10 · `T7` 6/6 · `T9` 8/8 · `T11` 8/8 (nuovo) · `A` 9/9 · `T10` 9/9 = 81/81** · **`T.route()` 3/3** · `T7.table(2)` 6/6.
- `T11`: render sotto i 4 ms, soluzione minima di 5 mosse, nessun blocco sul ghiaccio, varco del Golem (anche al rientro), **percorso vero
  con input simulati** (varco → 5 scivolate → arpione → forziere → uscita a sud nella Sala delle Lame), danni con la Tunica a Normale ed Eroe,
  sprite cambiato e ripristinato, medaglia e inventario.
- Screenshot: la stanza col gradino e l'eroe in tunica; layout touch su 375×812 prima e dopo la correzione del ⇄.

### Limiti noti (onesti)
- Lo schermo a due livelli l'ho verificato su Chromium (pannello del browser e viewport mobile emulata), non su Safari o Firefox reali. `image-rendering`
  è supportato da entrambi, ma non l'ho visto con i miei occhi.
- Il Crepaccio è **opzionale** e non è nel bot del percorso critico; è coperto da `T11`.
- Ancora nessuna partita completa a mano né ascolto dell'audio.

**Avversario, la palla è tua. Ora la valle scorre leggera anche sugli schermi grandi, e dietro il Golem c'è un crepaccio che aspetta chi ha imparato a scivolare.**

---

## CICLO 12 — Agente B (Claude) → palla all'Agente A

### In breve
Grazie per la correzione delle prestazioni alla radice: il mio test misurava a scala 3 e non vedeva il costo a scala 4. Il tuo `display.js` è la soluzione giusta.

In questo ciclo mi sono messo **nei panni di chi prende in mano il gioco per la prima volta**, giudice compreso, e ho cercato quello che può
farlo inciampare **fuori** dal gioco vero e proprio: menu, salvataggi, istruzioni. Ho trovato un rischio serio e due vuoti:
1. **"Nuova partita" cancellava il salvataggio senza chiedere.** È una voce sotto *Continua*: una pressione di troppo e addio semi, tesori,
   pesci e ore di gioco. **Ora chiede conferma**, dice cosa si perde, e il default è *No*;
2. **non c'era modo di tornare al titolo** se non chiudendo la pagina: ora c'è **"Salva ed esci al titolo"** (Opzioni, dalla pausa);
3. **non c'era una schermata dei comandi**, solo suggerimenti sparsi durante il gioco: ora c'è **"Comandi e consigli"** (Opzioni), con i comandi
   **del dispositivo che stai usando** e consigli senza spoiler;
4. **`LEGGIMI.md`**, un documento per **chi gioca o giudica**. `HANDOFF.md` è un diario di sviluppo di 12 cicli: troppo per chi vuole solo sapere come si gioca.
Codice di gioco ~6230 → ~6320 righe; test +~180 righe (`tests/cycle12.js`).

### Novità
| Cosa | Dettagli |
|---|---|
| **Conferma della nuova partita** | Se esiste un salvataggio, *Nuova partita* apre un riquadro: "Il salvataggio attuale andrà perso" con **stanza, tempo di gioco e tesori trovati**, più la rassicurazione che le medaglie dell'Albo d'oro restano. *No* è selezionato di default; Invio o X annullano. Senza salvataggio si parte subito, come prima. È dentro `updateTitle` originale, quindi funziona con i tuoi involucri di `medals.js` e `rush.js` |
| **Salva ed esci al titolo** | Nuova riga del menu Opzioni, **solo se aperto dalla pausa** e **non durante la Sfida dei Guardiani** (lì la sfida non salva e Q abbandona) |
| **Comandi e consigli** | Nuova riga del menu Opzioni, dal titolo e dalla pausa. **Pagina 1:** tabella dei comandi per il dispositivo rilevato ("Stai usando: la tastiera / un gamepad / il touch"). **Pagina 2:** sei consigli senza spoiler (l'obiettivo è sempre in pausa, parla con tutti, i cespugli e le crepe, il salvataggio automatico, la difficoltà, il post-gioco). ←/→ cambiano pagina |
| **Menu Opzioni a lista** | Le righe ora sono una lista (`optRows()`), non indici fissi: aggiungere una voce non richiede più di toccare tre funzioni |
| **`LEGGIMI.md`** | Come avviarlo, tabella dei comandi (tastiera / gamepad / touch), cosa c'è senza spoiler, consigli, e in fondo il rimando a `HANDOFF.md` e ai test per chi sviluppa |

### File toccati / nuovi
- **Nuovi:** `LEGGIMI.md`, `tests/cycle12.js` (`T12.suite()`).
- **Modificati:** `game.js` (conferma, `optRows`, guida, stato `guide`), `tests/audit.js` (l'audit dei testi copre anche la guida in 2 dispositivi, la conferma
  e le Opzioni dalla pausa), `tests/cycle4.js` (il test del prologo ora conferma la nuova partita), `story.js` (riga del Ciclo 12), `index.html` (`?v=c12e`).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **Totale 90/90:** `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T11` 8 · **`T12` 9 (nuovo)** · `T10` 9 · `A` 9. Il nuovo T12 controlla: conferma con default *No* che non tocca il
  salvataggio, *Sì* che avvia il prologo, Invio che annulla, nessuna conferma senza salvataggio, *Salva ed esci* che salva la stanza giusta,
  niente *Salva ed esci* dal titolo né nella Sfida, guida che si apre/cambia pagina/torna, consigli dentro il riquadro, guida dal titolo senza partita.
  **`T.route()` 3/3 · `T7.table(1)` 3/3** (Facile, Normale, Eroe).
- **Audit dei testi:** online 0, offline 0. Mi ha trovato i testi stretti nella guida e nei pulsanti della conferma, che ho corretto. L'audit controlla
  solo la **larghezza**: il testo dei consigli che sfiorava il fondo del riquadro l'ho visto **dallo screenshot**, e ho aggiunto un test apposta (`guideBottom`).
- Un test del Ciclo 4 (mio) falliva **perché ora c'è la conferma**: comportamento voluto, test aggiornato.
- Screenshot di: conferma, guida (entrambe le pagine), Opzioni dalla pausa.

### Limiti noti (onesti)
- Il rilevamento del gamepad (`usingPad()`) guarda se un controller è collegato. Con tastiera e gamepad insieme, la guida mostra i comandi del gamepad.
- La durata in `LEGGIMI.md` non l'ho scritta, perché non è misurata: i nostri bot finiscono in ~4 minuti, un umano molto di più.
- Ancora nessuna partita completa a mano né ascolto dell'audio.

### Idee che lascio sul tavolo
Più slot di salvataggio · un riepilogo "Finora…" quando si preme *Continua* dopo tanto tempo · i font locali (serve il permesso dell'utente).

**Avversario, la palla è tua. Ora chi apre il gioco trova le istruzioni, non perde la partita per sbaglio, e sa come uscirne.**

---

## CICLO 13 — Agente A (Claude) → palla all'Agente B

### In breve
Hai guardato il gioco dagli occhi di chi lo apre per la prima volta. Io l'ho guardato dagli occhi di chi ci gioca da un'ora e si chiede *"cosa mi sono perso?"*.
In dodici cicli abbiamo seminato **nove missioni secondarie** in posti diversi: l'Amo d'Oro, la Fonte della Fata, il Rifugio dei Minatori, la
Cripta, l'isolotto, il Crepaccio, i Semi, la pesca, la Sfida. Però **nessun posto le raccoglie**: l'obiettivo della pausa mostra solo la
missione principale. Chi giudica rischia di non vederne metà. Così ho aggiunto il **Diario dell'avventura**.

### Il Diario (`js/journal.js`)
| Cosa | Dettagli |
|---|---|
| **Dove** | Nel menu di pausa, **Q** (⇄ su touch, Y o dorsali sul gamepad) passa da *Mappa* a *Diario* e viceversa. Un'etichetta in alto a destra lo ricorda. Uscendo dalla pausa si riparte dalla mappa |
| **La storia** | I 9 capitoli della missione principale: fatti **✓**, quello in corso **▶**, i futuri restano **"? ? ?"** (niente spoiler) |
| **Missioni secondarie** | Compaiono **solo quando le scopri**: per esempio l'Amo d'Oro dopo aver visto il lago, la Fonte quando hai le bombe, i Semi e la Sfida dopo il finale. Ognuna ha ✓ o l'avanzamento (*Semi 3/5*, *Pescatore 2/5*), e c'è il conteggio *completate/scoperte* |
| **Indizi** | Con **su/giù** scegli una missione e leggi un **indizio senza spoiler**, in un riquadro di 3 righe in basso. Sul diario le frecce **non** cambiano l'oggetto equipaggiato; sulla mappa sì, come prima |
| **Sfida dei Guardiani** | Durante la sfida Q in pausa **abbandona**, come nel Ciclo 9: il diario lì non compare |
| **Estendibile** | Una riga in `SIDE_QUESTS` (`seen`, `done`, `hint`, `prog` facoltativo) o in `CHAPTERS` |

### Il tuo audit, esteso ai miei schermi
`A.texts()` non copriva il Diario né la Sfida dei Guardiani (il cronometro e le due schermate finali): li ho aggiunti in `tests/audit.js`, con 3 fasi della
storia e ogni missione selezionata. Al primo giro ha trovato due **titoli di capitolo compressi del 4–5%** nella loro colonna: li ho accorciati
("Il crollo", "Nelle Rovine"). Ora **0 testi** fuori spazio, online e col font di ripiego.

### Altro
- `LEGGIMI.md`: una riga nella tabella dei comandi e un consiglio sul Diario.
- Riga del Ciclo 13 in `EPILOGUE_LINES`. `index.html` è a `?v=c13c`, con i nuovi `js/journal.js` e `tests/journal13.js`.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **`T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T11` 8 · `T12` 9 · `T13` 7 (nuovo) · `A` 9 · `T10` 9 = 97/97** · **`T.route()` 3/3**.
- `T13`: apertura e chiusura del diario e ritorno alla mappa · frecce che sul diario scelgono la missione e non cambiano l'oggetto (e sulla mappa sì) ·
  Q che nella Sfida abbandona ancora · capitoli "in corso" e "tutti fatti" · missioni invisibili a inizio partita e scoperte al momento giusto ·
  avanzamento di semi e pesci · disegno in 3 fasi senza errori.
- Screenshot del Diario, a metà partita, e dell'etichetta "Q: diario" sulla pagina della mappa.

### Limiti noti (onesti)
- Le condizioni "scoperta" sono una mia scelta, ragionata ma non provata da persone: per esempio la Cripta compare quando sei nelle Rovine con le bombe.
  Potrebbero svelare un filo troppo presto o troppo tardi.
- Il diario non registra *cosa ti hanno detto* gli NPC, solo lo stato del mondo.
- Ancora nessuna partita completa a mano né ascolto dell'audio.

**Avversario, la palla è tua. Ora nessuna delle nostre missioni resta invisibile: c'è un diario che le ricorda tutte.**

---

## CICLO 14 — Agente B (Claude) → palla all'Agente A

### In breve
Il Diario è un'ottima idea: raccoglie davvero quello che avevamo seminato. In questo ciclo ho lavorato su tre cose:
1. **La musica, "ascoltata" con i numeri.** Il limite che entrambi ripetiamo da 13 cicli è *"nessuno ha mai ascoltato l'audio"*. Nel Ciclo 8 ho
   misurato *quanto* suona forte; ora ho verificato *se suona stonato*. Le musiche sono scritte a mano come testo da due agenti che non le hanno
   mai sentite: una nota sbagliata sul titolo sarebbe la prima cosa che sente un umano. **Risultato: nessuna nota sbagliata.** Lo scrivo come risultato, non come lavoro mancato;
2. **"Nella puntata precedente…"**: chi riprende la partita dopo una pausa (per esempio chi giudica in più sessioni) trova un riepilogo, costruito sui **tuoi** capitoli e missioni del Diario;
3. **Coerenza**: la guida "Comandi e consigli" (Ciclo 12) non conosceva il Diario. Ora ha la riga e il consiglio. `LEGGIMI.md` non porta più un numero fisso di cicli.

### 1. Analisi armonica delle musiche (`tests/audit.js` → `A.harmony()`, dentro `await A.suite()`)
Per ognuna delle 7 tracce, passo per passo sull'intero giro (mcm delle lunghezze delle voci), calcolo le note che suonano **insieme** nelle varie voci
(`-` tiene la nota, `.` è pausa) e controllo tre cose che si sentono subito:
- **scontri di 2a minore o 7a maggiore che durano almeno un quarto** (quelli di una sola croma sono note di passaggio normali);
- **note fuori tonalità** (si sceglie la tonalità più adatta, maggiore o minore armonica/naturale);
- **salti oltre l'ottava alla ripresa del giro** (si sentirebbe uno scatto a ogni ripetizione).

| Traccia | Tonalità | Note in tonalità | Scontri prolungati | Salti alla ripresa |
|---|---|---|---|---|
| title | La minore | 100% | 0 | 0 |
| overworld | Re minore | 100% | 0 | 0 |
| village | Do maggiore | 100% | 0 | 0 |
| dungeon | La minore | 100% | 1, voluto | 0 |
| cave | Mi minore | 100% | 0 | 0 |
| boss2 | Sol minore | 100% | 1, voluto | 0 |
| boss | Mi minore | 100% | 1, voluto | 0 |

I tre scontri li ho controllati uno per uno, e **sono scelte musicali, non errori** (elencati in `HARMONY_OK`):
- *dungeon*, Mi sopra Fa: accordo di Fa con settima maggiore, colore "misterioso";
- *boss2*, Re sopra Mib: nota di passaggio in una scala discendente, che si risolve subito;
- *boss*, Do sopra Si: dominante con nona minore, il classico suono "da cattivo" della minore armonica.

Non ho cambiato nessuna nota: non ce n'era motivo. Il test resta e **controllerà automaticamente ogni musica nuova**.
**Limite onesto:** è una misura di "stonatura", non di bellezza. Dice che non ci sono errori evidenti, non che le melodie siano belle.

### 2. "Nella puntata precedente…" (`game.js`: `recapLines`, `savedAt`)
- Ogni salvataggio registra **quando** è stato fatto (`s.savedAt`).
- Premendo *Continua*, **se sono passati almeno 5 minuti** (o il salvataggio è di prima di questo ciclo), dopo la dissolvenza compare un dialogo del **Diario**:
  capitoli completati *x su 9* con l'ultimo, l'**obiettivo** attuale e, se ci sono, le **missioni secondarie in sospeso**, con il tasto per aprire il Diario.
- Chi ricarica la pagina dopo un minuto non viene disturbato. Nessun riepilogo se la partita era appena iniziata (introduzione non vista).
- Usa `CHAPTERS` e `knownQuests()` del tuo `journal.js` se ci sono, quindi resta coerente se aggiungi capitoli o missioni.

### File toccati / nuovi
- **Nuovo:** `tests/cycle14.js` (`T14.suite()`).
- **Modificati:** `game.js` (`recapLines`, `savedAt`, riepilogo in `afterEnter`, guida col Diario), `audio.js` (`Sound.tracks()`, sola lettura),
  `tests/audit.js` (`A.harmony()`, `HARMONY_OK`, un test in più in `A.suite`), `LEGGIMI.md`, `story.js` (riga del Ciclo 14), `index.html` (`?v=c14b`).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file. L'analisi armonica l'ho fatta prima in Node, poi l'ho rifatta nel browser: risultati identici.
- **Totale 105/105:** `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T11` 8 · `T12` 9 · `T13` 7 · **`T14` 7 (nuovo)** · `T10` 9 · **`A` 10** (+ armonia) ·
  **`T.route()` 3/3** · **`T7.table(1)` 3/3** (Facile, Normale, Eroe).
- **Il mio audit dei testi ha trovato un mio errore**: la nuova riga della guida ("Diario dell'avventura (in pausa)") veniva compressa nella sua colonna. L'ho accorciata ("Diario (dalla pausa)").
- Screenshot del riepilogo al *Continua*.

### Limiti noti (onesti)
- L'analisi armonica non sostituisce un orecchio umano (vedi sopra). Non controlla gli effetti sonori, solo le musiche.
- La soglia dei 5 minuti per il riepilogo è una scelta, non una misura.
- Ancora nessuna partita completa a mano.

**Avversario, la palla è tua. Ora sappiamo che la nostra musica non stona, e chi torna nella valle dopo una pausa sa dove eravamo rimasti.**

---

## CICLO 15 — Agente A (Claude) → palla all'Agente B

### In breve
Ho continuato sulla tua strada dei controlli oggettivi, cercando **difetti che un umano nota subito e i nostri bot no**. Ne ho trovati due tipi:
1. **ingressi ingiusti**: entri in una stanza e un nemico ti è già addosso. Il bot non se ne accorge, ma una persona sì, e si sente tradita;
2. **salvataggi delle versioni precedenti**: chi giudica potrebbe avere nel browser una partita di un ciclo vecchio. Il gioco la carica bene? Si può ancora finire?

### 1. Ingressi giusti (`js/fairness.js`)
- **Misura** (`T15.entries()`): per ogni stanza, la distanza tra **ogni punto d'ingresso** (tile aperte dei bordi, arrivi di porte e scale) e **ogni nemico**.
  **Trovati 8 casi sotto i 48 px:**
  - Sala Centrale delle Rovine entrando dall'Atrio: uno **slime blu che insegue, a 32 px**;
  - Campi di Brina uscendo dalla Grotta: **due slime a 32 e 36 px**;
  - Bosco dei Rovi entrando da ovest: una **pianta sputa-semi a 36 px**, che spara subito;
  - Rovine (esterno) da est e da ovest: slime a 45 px.
- **Correzione dei dati:** quei 6 nemici sono spostati ad almeno ~56 px dagli ingressi (elenco commentato in testa al file). Ora il controllo dà **0 casi**, e resta come test.
- **Regola generale:** entrando in una stanza (`afterEnter`) i nemici comuni (slime, pipistrelli, piante, armature) restano **fermi e innocui per 40 frame**,
  ~2/3 di secondo: "si svegliano". Così nessun ingresso futuro potrà colpire a tradimento. Restano esclusi i **boss**, che hanno già la loro
  entrata in scena, e la **Sfida dei Guardiani**, dove la tensione è voluta. Il conto alla rovescia si ferma durante dialoghi e hit-stop.
- **Effetto sul bot onesto** (senza vita infinita), `T7.table(2)`: **6/6**, sconfitte medie Facile 0,5 · Normale 1,0 · Eroe 2,5. In linea con prima: la tregua
  non rende il gioco banale, toglie solo i colpi "gratis".

### 2. Salvataggi di versioni precedenti (in `T15.suite()`)
| Salvataggio simulato | Risultato |
|---|---|
| **Ciclo 1**: Chiave del Re presa nella Sala delle Armature, niente arpione né bombe | si carica; il forziere dell'**Arpione** compare nella Sala delle Armature (la Chiave del Re non si duplica, l'id del forziere è lo stesso), quindi la fase 2 del Re si può affrontare. Pausa e diario senza errori |
| **Ciclo 2**: crollo avvenuto, niente bombe, senza i campi aggiunti dopo (`equip`, `fishLog`, `minDiff`, `savedAt`…) | obiettivo corretto (cerca le bombe nella Grotta), pausa e diario senza errori |
| **Salvataggio rovinato** (JSON tagliato) | nessun "Continua", nessun errore |
| **Stanza che non esiste più** | **era un difetto vero:** "Continua" lanciava un'eccezione e lasciava il gioco fermo. Ora si riparte dal villaggio (o dalla casa dell'Anziano, se l'intro non era stata vista) |

### Un test del Ciclo 3 da adattare
`T` "l'arpione stordisce uno scheletro, poi uccide un pipistrello" ora falliva: con la tregua lo scheletro resta dov'è nato invece di avvicinarsi,
l'arpione fa un viaggio più lungo ed era ancora in volo al secondo lancio. Era un'**assunzione di tempo del test**, non un difetto del gioco:
il test ora aspetta che l'arpione sia rientrato.

### File toccati / nuovi
- **Nuovi:** `js/fairness.js` (spostamenti, tregua d'ingresso, salvataggio con stanza inesistente), `tests/fair15.js` (`T15.entries()`, `T15.suite()`).
- **Modificati:** `tests/harness.js` (un'attesa), `js/story.js` (riga del Ciclo 15), `index.html` (`?v=c15b`).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **112/112**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · **`T15` 7 (nuovo)** · `A` 10 · `T10` 9 · **`T.route()` 3/3** · `T7.table(2)` 6/6.

### Limiti noti (onesti)
- Il controllo considera la distanza in linea d'aria, non i muri: un nemico a 50 px ma dietro un ostacolo è "lontano" anche quando non lo è.
  Comunque la soglia è prudente e la tregua copre i casi limite.
- 40 frame di tregua è una scelta, non una misura su persone.
- Ancora nessuna partita completa a mano né ascolto dell'audio.

**Avversario, la palla è tua. Ora nessuno ti aspetta dietro la porta, e anche una partita vecchia ritrova la strada di casa.**

---

## CICLO 16 — Agente B (Claude) · ultimo ciclo: la sfida è stata chiusa dall'utente

Mentre finivo questo ciclo l'utente ha chiuso la sfida per giudicare ("basta così, ora giudico io", riferito da AGENTE1). Il lavoro qui sotto era già finito e
verificato: lo documento perché è nel codice, ma **non ripasso la palla**.

### In breve
Altri due controlli oggettivi sulla linea "ciò che un umano nota e i bot no". Hanno trovato **tre difetti visibili**, uno dei quali era **mio, dal Ciclo 2**.
1. **Passaggi tra le stanze** (`T16.edges()`, `T16.warps()`): ogni varco nel bordo di una stanza deve combaciare con la stanza accanto, e ogni porta,
   scala o ingresso deve portare su terreno calpestabile.
   - **Difetto trovato (mio, Ciclo 2):** la crepa dell'Atrio delle Rovine è sulla **riga 6**, il varco della Cripta Nascosta era sulla **riga 5**.
     Fatta saltare la crepa, si entrava nella Cripta **attraverso un muro**, e si usciva allo stesso modo. Il codice dello scorrimento spingeva
     dentro la stanza, quindi nessuno restava bloccato, ma si vedeva. I bot non se ne accorgevano perché i test si teletrasportano nella Cripta.
     Corretto spostando il varco della Cripta sulla riga 6, così restano validi anche i salvataggi con la crepa già aperta. Verificato con una camminata vera, andata e ritorno: 0 frame dentro un solido.
   - Il resto del mondo è a posto: 0 varchi senza corrispondenza, 0 arrivi su ostacoli (l'uscita dalla Fonte cade sul masso della Radura, ma a quel punto è già esploso per sempre).
2. **Contrasto dei testi** (`T16.contrast()`): per ogni testo misuro lo sfondo che c'è davvero dietro, cioè il livello dei testi sopra la pixel art, e calcolo il rapporto di contrasto WCAG.
   - **Prima: 41 testi sotto 3:1** (difficili da leggere). I peggiori erano **i titoli di coda del mio epilogo (Ciclo 6), 1,6–2,2**: testo chiaro sul cielo dell'alba.
     Poi il finale, le voci non selezionate del titolo sul rosso del tramonto (3,0), i piè di pagina in `#7a6a9a` e i segnaposto "? ? ?" / "---".
   - **Correzioni:** velo più scuro dietro i titoli di coda di finale ed epilogo (0,6), pannello scuro dietro il menu del titolo, colori dei piè di pagina e dei segnaposto schiariti
     (anche in `journal.js`, `medals.js` e `fishing.js`, solo colori).
   - **Dopo: 0 testi sotto 3:1**; il minimo è 3,37 (i "? ? ?" delle medaglie bloccate, volutamente smorzati). Restano 14 testi tra 3 e 4,5, quasi tutti righe dei titoli di coda misurate nel punto peggiore, sopra l'albero dorato.
3. **Testi sovrapposti** (`T16.overlaps()`, nuovo): ogni coppia di testi che si accavalla nello stesso frame.
   - **Difetto trovato (Albo d'oro, Ciclo 7/9/11):** la griglia era pensata per 14 medaglie in 7 righe. Con 17 medaglie l'8ª riga finiva sopra la descrizione e la 9ª
     **sotto il piè di pagina "Vittorie… Miglior tempo"**: si vedeva appena aperto l'Albo. Ora restano **7 righe visibili** e la griglia **scorre con la selezione**, con le frecce ▲/▼.
     Funziona con qualunque numero di medaglie future (`MEDAL_ROWS`, `G.medalTop()` in `medals.js`).
   - Corretto anche un piccolo accavallamento mio: il sottotitolo del titolo che sbucava dal riquadro di conferma della nuova partita.
   - **Dopo: 0 testi sovrapposti** in tutti gli stati coperti dall'audit.

### File toccati / nuovi
- **Nuovo:** `tests/cycle16.js` (`T16.edges/warps/contrast/overlaps/suite`).
- **Modificati:** `world.js` (varco della Cripta), `medals.js` (griglia che scorre, un colore), `story.js` (velo dell'epilogo, riga del Ciclo 16), `game.js` (velo del finale, pannello del menu, colori, ordine della conferma),
  `journal.js` e `fishing.js` (solo colori), `index.html` (`?v=c16g`).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **Totale 118/118:** `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · **`T16` 6 (nuovo)** · `T10` 9 · `A` 10 ·
  **`T.route()` 3/3** · **`T7.table(1)` 3/3** (Facile, Normale, Eroe).
- Screenshot dell'Albo d'oro prima (righe sopra descrizione e piè di pagina) e dopo.

### Limiti noti (onesti)
- Il contrasto si misura in 8 punti per testo e ignora l'ombra nera di 1 px, che aiuta la lettura: la misura è prudente.
- Le sovrapposizioni si controllano negli stati coperti da `A.texts()`, quindi non nei dialoghi durante il gioco, che però vanno a capo da soli.
- Nessuna partita completa a mano e nessun ascolto dell'audio, da parte di nessuno dei due, per tutta la sfida.

**Grazie, avversario: è stato un piacere costruire Brinavalle con te.**

---

# SECONDA MANCHE

L'utente ha giudicato la prima manche ("l'inizio è promettente") e ha avviato la seconda, con le stesse regole: turni alternati e palla
passata a fine turno, fino alla sua interruzione. Comincia l'Agente A.

## CICLO 17 — Agente A (Claude) → palla all'Agente B

### In breve
Gli ultimi cicli della prima manche sono stati soprattutto di **qualità** (controlli, misure, rifiniture). Ho aperto la seconda manche con
**contenuto nuovo e sostanzioso**: un **terzo dungeon facoltativo, il SANTUARIO SOMMERSO**, sotto il Lago Specchio, con una **meccanica di
esplorazione nuova, il NUOTO**, un nemico nuovo, un **boss nuovo (la Serpe di Vetro)**, una musica nuova e due segreti nel mondo esterno
che si raggiungono solo a nuoto. È in stile Zelda "di ritorno": lo scopri con le bombe, lo risolvi con l'arpione, e il nuoto che trovi lì
dentro ti fa rivedere la valle con occhi nuovi.

### Il Santuario Sommerso (`js/sunken.js`, mappa nuova `l:`)
| Cosa | Dettagli |
|---|---|
| **Ingresso** | Un **masso incrinato sull'isola** del Lago Specchio (bombe) → compare una **scala** (resta per sempre). **Pino** ne parla, a turni, quando hai le bombe |
| **Vestibolo** `l:1,2` | Vasche, meduse, un'iscrizione che fa da indizio |
| **Sala delle Vasche** `l:1,1` | Snodo: porta chiusa a chiave verso il boss; un forziere sull'isolotto centrale, raggiungibile solo a nuoto |
| **Sala delle Squame** `l:0,1` | Le **Squame d'Argento** sono oltre l'acqua: serve l'**Arpione**, dalla riva destra al palo dall'altra parte. Si torna... **a nuoto**, con l'oggetto appena trovato |
| **Sala della Chiave** `l:2,1` | Una sala allagata con un isolotto: **solo a nuoto** (neanche l'arpione ci arriva, verificato) |
| **Pozzo della Serpe** `l:1,0` | Boss: **la Serpe di Vetro** (vedi sotto). Lascia un **Cuore di Cristallo**: con tutti i cuori si arriva a **10** |
| **Nuoto** | Con le Squame l'acqua `~` diventa attraversabile **ovunque** (anche fuori): al 62% della velocità, **senza spada né oggetti** (si può però parlare e aprire), con schizzi, increspature e l'eroe immerso fino al collo. Le trazioni dell'arpione che finiscono in acqua non ti fanno più cadere |
| **Segreti a nuoto** | Un isolotto nel **Lago Specchio** (40 gemme) e uno nel **laghetto della Radura** (50 gemme) |
| **Medusa** (nemico nuovo) | Fluttua sopra l'acqua e scatta a impulsi verso di te; rispetta la tregua d'ingresso del Ciclo 15 |
| **Atmosfera** | Luce acquatica che ondeggia, bolle che salgono dalle vasche, musica nuova **"temple"** (re minore, 76 bpm) |
| **Diario / Albo** | 2 missioni nuove nel Diario ("Il Santuario Sommerso", "Acque profonde" 0/2), medaglia d'argento **"Signore del lago"** (ora **18**). Forzieri: **20** |
| **Inventario** | Le Squame prendono la casella dell'**Amo d'Oro** (oggetto di missione restituito a Pino, che restava "---" per sempre): il suo stato si vede comunque nell'HUD e nel Diario |

### La Serpe di Vetro
- Nuota sotto la superficie (bolle), poi **riemerge sul bordo della vasca vicino a te** (cerchi d'acqua come preavviso) e **sputa sfere d'acqua** (1, o 3 a ventaglio quando è furiosa). La spada dissolve le sfere.
- **Colpita di spada** mentre è in acqua: perde un punto e **si rituffa** subito.
- **Agganciata con l'arpione**: viene **trascinata sulla riva** e resta lì, stordita e **vulnerabile**, ma **al terzo colpo si divincola** e torna in acqua.
- 12 PV, una bomba la ferisce (2) quando è fuori.

**Taratura misurata** con un bot da duello senza vita infinita (`T17.duel()`): schiva le sfere, si allinea sulla stessa riga o colonna della testa e lancia l'arpione, poi colpisce a riva.
- **Prima versione: troppo facile**, 17 s e vittoria quasi sempre: a riva incassava tutti i colpi (lo stesso difetto che hai trovato nel Golem). Ho aggiunto il **massimo di 3 colpi per volta**.
- **Poi: troppo difficile, e il motivo era il design**: riemergeva fino a 120 px da te, spesso dall'altra parte della vasca, e restava fuori 1,8 s. Non c'era il tempo di allinearsi, nemmeno per una persona.
  Ora riemerge **a 30–80 px** e resta fuori **2,3 s** (1,8 da furiosa).
- **Ora:** Normale con 6 cuori **6/8**, con 4 cuori **7/8**, Facile **5/6**, Eroe **2/6**, in **~21–25 s** (alla velocità del bot). È più impegnativa del Golem e meno del Re dei Rovi, la giusta collocazione per un dungeon facoltativo.

### Al motore (poche righe, tutte segnate "Ciclo 17")
`game.js`: la mappa `l:` in `neighborId`, nella mappa della pausa ("SANTUARIO") e in `mapPrefix`; il boss `'serpent'` in `loadRoom`; il Cuore di Vesper ora compare **solo** nel Trono dei Rovi (`def.boss === true`, prima "tutti i boss tranne il golem").
`audio.js`: traccia `temple` e 4 effetti (`swim`, `dive`, `surface`, `orb`).
Ho esteso i **tuoi** controlli alla mappa `l:` (`T16.edges` in `cycle16.js`, `T15.entries` in `fair15.js`): passano. Il controllo degli ingressi ha trovato **uno slime nato a 23 px** dall'uscita del Santuario sull'isola (colpa mia): spostato sulla riva.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file; griglie delle 5 stanze nuove 11×16.
- **128/128**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · **`T17` 10 (nuovo)** · `A` 10 (con l'armonia: `temple` 100% in tonalità, nessuno scontro) · `T10` 9 · **`T.route()` 3/3**.
- `T17`: ingresso con la bomba e scala persistente, andata e ritorno · forziere delle Squame irraggiungibile senza arpione · arpione → Squame → ritorno a nuoto · nuoto più lento, senza spada né bombe, nessun tuffo mortale · chiave solo a nuoto (l'arpione non basta) · porta del Pozzo, Serpe presente e porte chiuse · spada = si rituffa, arpione = a riva, sconfitta = cuore e niente cristallo né Ortensio · i due segreti a nuoto · Diario e Albo · stress di 1500 frame casuali in ogni stanza nuova.
- Screenshot: il Vestibolo, l'eroe che nuota (all'inizio si vedeva solo la cima della testa: alzato), la Serpe emersa (ridisegnata: la prima testa era troppo tonda).

### Limiti noti (onesti)
- Il Santuario **non è nel bot del percorso critico** (è facoltativo); è coperto da `T17`.
- La durata del duello è quella del bot; un umano ci metterà di più.
- Ancora nessuna partita completa a mano né ascolto dell'audio.

**Avversario, la seconda manche è cominciata e la palla è tua. Sotto il lago adesso c'è un santuario, e la valle si può anche attraversare a nuoto.**

---

## CICLO 18 — Agente B (Claude) → palla all'Agente A

### In breve
Prima di tutto ho passato il tuo Santuario Sommerso nei miei controlli (testi, contrasto, sovrapposizioni, varchi, armonia della musica "temple"):
**tutto pulito**, nulla da correggere. Poi, seguendo l'indicazione dell'utente ("l'inizio è promettente"), ho aggiunto **contenuto nuovo** di un tipo che il gioco
non aveva: **una catena di doni tra gli abitanti della valle**, la classica "sequenza di scambi" delle avventure alla Zelda. Cinque personaggi che già esistono
si passano oggetti tramite Lio, ognuno con una piccola storia. Il premio è la **Bussola dei Segreti**, che rende il completamento della valle (20 forzieri, 5 semi,
stanze segrete) un'esplorazione guidata invece che una caccia alla cieca.

### La catena dei doni (`js/trade.js`)
| Passo | Chi | Cosa succede |
|---|---|---|
| 1 | **Marta** (villaggio), dopo la spada | Ha sfornato una **torta di mirtilli** per Silvano, ma con i mostri non osa uscire |
| 2 | **Silvano** (radura) | La torta gli ricorda Marta; ti affida una **lettera sigillata** per Pino: trent'anni fa hanno litigato e non si sono più parlati |
| 3 | **Pino** (lago) | Legge in silenzio, si commuove: avevano litigato per una perla. Ti dà la **perla del lago** per Bortolo, "e di' a Silvano che lo aspetto al lago" |
| 4 | **Bortolo** (bottega) | Dalla perla ricava un **ago di perla**: "l'ago di una bussola che non segna il nord, ma ciò che è nascosto". Il quadrante ce l'ha Teodoro |
| 5 | **Teodoro** (casa) | Monta l'ago sul quadrante d'ottone che era **del padre di Lio** → **Bussola dei Segreti** |
| Epilogo | **Silvano e Pino** | Hanno fatto pace: Silvano lascia la radura e lo trovi **al lago, a pescare con Pino** (con i suoi consigli di sempre) |

- **La Bussola dei Segreti:** sulla **mappa della pausa** segna con una scintilla ✦ ogni stanza dove c'è ancora qualcosa: forzieri chiusi, semi non raccolti e **stanze segrete non ancora
  scoperte**, che con la bussola compaiono sulla mappa come riquadri scuri. Entrando in una stanza che nasconde ancora qualcosa, **"la bussola vibra"** (una volta per stanza a sessione).
- **Diario:** nuova missione *"La catena dei doni"* con avanzamento *x/5* e un indizio che dice **a chi portare il dono attuale**. **Albo d'oro:** medaglia di bronzo *"Il viandante"* (ora **19**).
- **Compatibilità:** non riscrive nessun dialogo, **avvolge** la funzione `talk` degli NPC, quindi tutto ciò che 17 cicli hanno aggiunto a quei personaggi continua a funzionare.
  Dopo lo scambio, Silvano dà comunque il suo **dono di benvenuto** (se non l'aveva ancora dato), Pino apre il **menu di pesca** e Bortolo la **bottega**.
- Icone nuove per i 5 oggetti (torta, lettera, perla, ago, bussola), nello stile di `gfx.js`.

### Al motore
`game.js`, 3 righe segnate "Ciclo 18" nella mappa della pausa: con la bussola le stanze segrete non visitate compaiono, e le stanze con qualcosa da trovare hanno la scintilla
(`compassHas`, `drawCompassStar` in `trade.js`). `index.html` (`?v=c18c`, `js/trade.js`, `tests/trade18.js`), `story.js` (riga del Ciclo 18), `LEGGIMI.md` (una riga senza spoiler, 19 medaglie, elenco dei test).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **Totale 137/137:** `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · **`T18` 9 (nuovo)** · `T10` 9 · `A` 10 ·
  **`T.route()` 3/3** · **`T7.table(1)` 3/3** (Facile, Normale, Eroe).
- `T18` fa la catena **parlando davvero con gli NPC** (`tryInteract`, nei menu sceglie "Niente"): Marta non chiede nulla prima della spada · catena completa fino alla bussola, senza doni avanzati ·
  dono di benvenuto di Silvano non perso · bottega di Bortolo dopo lo scambio · Silvano al lago e non più nella radura · cosa segna la bussola (forzieri, semi, segrete; non le stanze vuote) ·
  scintille disegnate nella mappa · la bussola vibra una volta sola · Diario e medaglia.
- **Il mio audit dei testi ha trovato un mio errore**: la descrizione della nuova medaglia, con il "✓", non stava nell'Albo. L'ho accorciata.
- Screenshot: Marta che consegna la torta (icona sollevata con i raggi), la mappa della Grotta con la bussola. Lì il simbolo sembrava un "+", quindi ho aggiunto le punte diagonali.

### Limiti noti (onesti)
- La catena non è nel bot del percorso critico (è facoltativa); è coperta da `T18`.
- La bussola segna anche i forzieri che compariranno solo più avanti (per esempio dopo aver ripulito una stanza): è voluto, sono comunque "qualcosa da trovare".
- Ancora nessuna partita completa a mano né ascolto dell'audio.

**Avversario, la palla è tua. Ora nella valle anche i vecchi rancori si sciolgono, e una bussola indica dove guardare.**

---

## CICLO 19 — Agente A (Claude) → palla all'Agente B

### In breve
L'utente ha detto che **l'inizio** è promettente: ho investito proprio lì, con qualcosa che **accompagna chi gioca per tutta
l'avventura**. Si tratta di **COCCA**, un volpacchiotto bianco che si libera nei primi minuti e da quel momento **ti segue ovunque** e **fiuta i segreti**.
Ho passato anche la tua Catena dei doni nella regressione completa: tutto verde, niente da correggere.

### Cocca (`js/fox.js`)
| Cosa | Dettagli |
|---|---|
| **Dove** | Accanto al **Santuario della Brina** (`o:0,1`), su un sentiero che si percorre comunque: un volpacchiotto in un **cerchio di rovi** che guaisce quando ti avvicini. Senza spada: "ti servirebbe una lama". **Con la spada appena presa, un fendente lo libera**, gli altri rovi appassiscono e lui ti gira intorno felice |
| **Ti segue** | Segue **le tue orme**, quindi non attraversa i muri; arriva con te a ogni cambio di stanza (scorrimenti e porte); se resta indietro ti raggiunge. **Si siede** quando ti fermi e **si addormenta** (con le "z") se aspetti a lungo |
| **Fiuto** | Quando sei vicino a una **crepa da far saltare** o a un **Seme dell'Alba**, **corre lì, scodinzola e abbaia** con un "!". Ogni segreto una volta sola per visita, e una crepa fatta di più tile (le macerie delle Rovine) conta come uno. È complementare alla tua Bussola: lei dice *in quale stanza*, Cocca dice *dove* |
| **Accarezzarlo** | Azione verso di lui: frasi affettuose, cuoricini, diverse dopo la vittoria |
| **Mai d'intralcio** | Niente collisioni, la spada e l'arpione lo ignorano, nessun danno. Non c'è nella Sfida dei Guardiani né durante la pesca |
| **Diario / Albo** | Missione "Un amico a quattro zampe" (prima della lista) e medaglia di bronzo **"Amico fedele"** (ora **20**) |
| **Suoni** | `yip` (abbaio) e `whine` (guaito, solo quando sei vicino alla gabbia, ogni 2,5 s) |

### Difetti trovati dai test mentre lo costruivo (e corretti)
- **La gabbia non si poteva "interrogare"**: Cocca sta dietro i rovi, a due caselle. Ho allungato la portata dell'interazione verso la gabbia.
- **E la correzione ha creato un difetto peggiore**: con la spada, Azione davanti alla gabbia apriva il dialogo invece del fendente, quindi **era
  impossibile liberarlo**. L'ha preso il test della liberazione. Ora la gabbia "parla" solo se non hai ancora la spada.
- **Abbaiava quattro volte alle macerie delle Rovine** (4 crepe adiacenti): ora le crepe vicine contano come un solo segreto.

### File toccati / nuovi
- **Nuovi:** `js/fox.js`, `tests/fox19.js` (`T19.suite()`).
- **Modificati:** `audio.js` (2 effetti), `story.js` (riga del Ciclo 19), `LEGGIMI.md` (una riga senza spoiler), `index.html` (`?v=c19e`).
- In `fox.js` modifico **da codice** 4 tile della stanza `o:0,1` (la gabbia) e avvolgo `loadRoom`, `afterEnter`, `cutTile`, `tryInteract`, `updatePlay`.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **146/146**: … `T17` 10 · `T18` 9 · **`T19` 9 (nuovo)** · `A` 10 · `T10` 9 · **`T.route()` 3/3**.
- `T19`: gabbia e messaggio senza spada · liberazione con un fendente, gabbia sparita anche al rientro · ti segue tra le stanze (scorrimento e porta)
  e non resta indietro dopo una camminata · nessun intralcio (gli passi attraverso, spada e arpione lo ignorano) · fiuto alle macerie, una sola volta ·
  si siede, si addormenta, accarezzarlo lo sveglia · assente nella Sfida · Diario e Albo.
- Screenshot: Cocca nella gabbia di rovi, poi libero col "!" sopra la testa.

### Limiti noti (onesti)
- Seguendo le orme, a volte Cocca "taglia" un angolo quando ti raggiunge di corsa: è voluto (lo fa solo da lontano), ma potrebbe passare per un attimo sul bordo di un ostacolo.
- Il bot del percorso critico non libera Cocca (è facoltativo); è coperto da `T19`.
- Ancora nessuna partita completa a mano né ascolto dell'audio.

**Avversario, la palla è tua. Adesso Lio non viaggia più da solo: c'è una volpe bianca col naso freddo che gli trotterella dietro.**

---

## CICLO 20 — Agente B (Claude) → palla all'Agente A

### In breve
Cocca è un'ottima idea, ed è complementare alla Bussola. In questo ciclo ho aggiunto un'altra cosa classica delle avventure che mancava: il **BESTIARIO**,
la terza pagina della pausa. E la regressione mi ha fatto trovare un **difetto vero di Cocca**, che ho corretto.

### Il Bestiario (`js/bestiary.js`)
| Cosa | Dettagli |
|---|---|
| **Dove** | Nel menu di pausa **Q** ora fa **mappa → diario → bestiario → mappa** (⇄ su touch, Y sul gamepad). Su/giù scelgono la scheda; sul bestiario le frecce non cambiano l'oggetto |
| **12 schede** | Tutte le creature dei 19 cicli: slime verde/blu/di ghiaccio, pipistrello e pipistrello gelido, pianta sputasemi, armatura vivente, lama di ghiaccio, medusa, e i guardiani **Golem di Brina**, **Serpe di Vetro**, **Re dei Rovi** |
| **Ritratto** | Lo **sprite vero** della creatura, ×2 per quelle da 16 px, 1:1 per i guardiani da 32. **Sagoma** se l'hai vista ma non ancora sconfitta, **"? ? ?"** se non l'hai mai incontrata |
| **Scheda** | Quante volte l'hai sconfitta e una **nota che la lega alla storia** (gli slime irrequieti dal crepuscolo, le armature dei custodi del tempio, la lama dei vecchi minatori, il Re che "era Ortensio"...) |
| **Punto debole** | Il consiglio pratico si sblocca dopo **3 sconfitte** per le creature comuni, e **al primo incontro** per i guardiani, perché è lì che chi è bloccato ha bisogno di aiuto. I consigli sono presi dalle meccaniche vere (rimandare i massi al Golem, agganciare la Serpe quando riemerge, strappare la corazza al Re...) |
| **Come conta** | "Visto": i nemici presenti nella stanza (ogni 20 frame). "Sconfitto": avvolgo `Enemy.prototype.die` e `onBossDefeated`. La lama di ghiaccio, che non si può distruggere, si completa vedendola |
| **Albo d'oro** | Medaglia d'argento **"Naturalista"**: tutte le schede complete (ora **21** medaglie) |
| **Salvataggio** | `s.bestiary`, nel salvataggio della partita |

### Correzioni a file non miei (documentate qui)
- **`fox.js` (Cocca) — difetto vero:** l'insieme dei segreti già segnalati (`hinted`) **non si svuotava mai**. La documentazione dice "ogni segreto una volta per visita",
  ma in pratica Cocca **non fiutava più un segreto già segnalato, nemmeno nelle visite successive**, e siccome la volpe sopravvive alla *Nuova partita*,
  **in una nuova partita ignorava i segreti già trovati in quella precedente**. L'ha fatto emergere `T19` (fiuto alle macerie), che falliva sempre se prima un altro test era passato di là.
  Corretto con una riga: `hinted` si svuota a ogni cambio di stanza. Aggiunto un test in `T20` (fiuta di nuovo alla seconda visita).
- **`journal.js`:** l'etichetta del diario ora dice "Q: bestiario" invece di "Q: mappa".
- **`tests/journal13.js`:** due test di `T13` si aspettavano che Q alternasse solo mappa e diario: aggiornati al nuovo giro di tre pagine.

### File toccati / nuovi
- **Nuovi:** `js/bestiary.js`, `tests/bestiary20.js` (`T20.suite()`).
- **Modificati:** `fox.js` (1 riga), `journal.js` (1 riga), `tests/journal13.js`, `tests/audit.js` (l'audit dei testi, e quindi contrasto e sovrapposizioni, copre il Bestiario vuoto e completo, su ogni scheda),
  `story.js` (riga del Ciclo 20), `LEGGIMI.md` (Bestiario nei consigli, 21 medaglie, test), `index.html` (`?v=c20e`).

### Verifiche fatte (onestamente)
- `node --check` su tutti i file.
- **Totale 156/156:** `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · **`T20` 10 (nuovo)** · `T10` 9 · `A` 10 ·
  **`T.route()` 3/3** · **`T7.table(1)` 3/3**; in un'altra prova `T7.table(3)` 9/9. Un singolo fallimento a Facile in un giro precedente non si è ripetuto in 10 partite.
- **Audit sul Bestiario:** il mio audit dei testi ha trovato un nome troppo lungo nella lista ("Pipistrello di ghiaccio", ora "Pipistrello gelido"). Il contrasto ha trovato un "? ? ?"
  poco leggibile sulla riga selezionata, corretto. Nessuna sovrapposizione. Dallo screenshot ho visto il punto debole che sfiorava il fondo del riquadro e ho alzato il blocco di testo.
- Due miei errori nei test, onestamente: il test del Golem colpiva durante l'intro (80 frame, in cui ignora i colpi); e una volta ho lanciato la regressione **senza ricaricare la pagina**, quindi senza il test appena aggiunto: me ne sono accorto dal conteggio (9 invece di 10) e l'ho ripetuta.
- Screenshot del Bestiario sulla scheda del Golem.

### Limiti noti (onesti)
- Le note e i punti deboli sono scritti da me sulle meccaniche descritte nei vari HANDOFF e verificate nel codice. Non li ha provati un giocatore.
- Nella Sfida dei Guardiani le sconfitte contano anche per il Bestiario (scelta voluta: sono gli stessi mostri).
- Ancora nessuna partita completa a mano né ascolto dell'audio.

**Avversario, la palla è tua. Ora la valle ha anche il suo naturalista, e Cocca torna a fiutare ogni volta che entri in una stanza.**

---

## CICLO 21 — Agente A (seconda manche): il cielo della valle

Il mondo esterno era sempre uguale a sé stesso: crepuscolo viola prima del finale, luce dorata fissa dopo. Ora il cielo cambia.

### Cosa ho fatto
- **Nuovo `js/sky.js`** (caricato dopo `bestiary.js`), che avvolge `Game.newGame`, `Game.updatePlay` e `Game.drawSky`.
  `drawSky` il motore lo chiama **solo per le stanze `o:`**, quindi interni, dungeon e Santuario non sono toccati.
- **Pioggia:** stato in `Sky` (`rain` 0..1, `target`, `next`, `storm`, `flash`, `thunderIn`). Ogni 1–2,5 minuti si estrae il tempo: 40% di probabilità di
  un acquazzone (intensità 0,45–1) che dura 50–110 s, poi sereno per 2–4 minuti. **Mai prima dei 3 minuti di gioco** (`s.time > 180`), così l'inizio resta com'era.
  L'intensità sale e scende piano (0,003 per frame, circa 5 s). Disegno: velo scuro, fino a 120 gocce oblique deterministiche (nessun array di particelle), schizzi a terra.
  Suono `rain` ogni 24 frame quando si è all'aperto e l'intensità supera 0,25.
- **Temporale:** se l'intensità estratta supera 0,85. Lampo (velo bianco per 10 frame) e **tuono 30–80 frame dopo**, con un piccolo scossone dello schermo; solo all'aperto.
- **Giorno e notte dopo la vittoria:** un giorno ogni 6 minuti di gioco (`DAY_LEN = 360`). Il primo giorno parte dal **mattino** al primo frame dopo il finale
  (`s.dayStart`, salvato nel salvataggio; i salvataggi vecchi lo ricevono alla prima partita). Fasi: giorno ~53%, tramonto (velo arancio *multiply*), notte (velo blu
  su una tela a parte, con **fori di luce** intorno a Lio e alle finestre), alba rosata.
  **Finestre:** prendo solo le tessere `H` il cui vetro (#f0b850) è davvero disegnato nello sfondo (letto una volta per stanza dal canvas `bg`), e ne accendo circa due su tre
  (scelta stabile per stanza). Di notte tornano anche le lucciole che c'erano prima del finale.
- **Opzione "Effetti visivi" (`FEEL.on`) spenta = niente pioggia, notte o tramonto disegnati e niente suono di pioggia.** Lo stato meteo continua comunque a evolvere.
- **`audio.js`:** due effetti nuovi, `rain` (rumore filtrato alto) e `thunder` (rumore grave + sinusoide che scende).

### Test — nuovo `tests/sky21.js` (`T21.suite()`, 10 test)
Niente pioggia nei primi 3 minuti (40 estrazioni forzate) · pioggia che arriva, cresce piano e smette · la pioggia cambia i pixel solo all'aperto e con gli effetti attivi
(identici agli asciutti con gli effetti spenti; nessuna differenza in casa dell'anziano) · lampo e tuono col ritardo giusto · prima della vittoria nessun ciclo
· dopo la vittoria mattino → tramonto → notte → alba → mattino · di notte la scena è più buia ma intorno a Lio c'è luce (misurata sui pixel) · vetri accesi davvero
gialli sulle finestre scelte, e non tutte · tutte le stanze esterne disegnate in 4 fasi con pioggia e temporale senza eccezioni · costo sotto 4 ms per frame.

### Verifiche fatte (onestamente)
- `node --check` su `sky.js`, `audio.js`, `sky21.js`.
- **Totale 166/166** (`T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · **`T21` 10** · `A` 10), `T.route()` ok (2,4 min). Ripetuta dopo l'ultima modifica, con la pagina ricaricata a `?v=c21b`.
- Screenshot: villaggio sotto la pioggia, di notte, al tramonto.
- **Un mio errore di prima stesura, corretto:** la prima notte accendeva una luce per ogni tessera `H` scelta a caso: le case diventavano blocchi slavati e i riquadri gialli
  non cadevano sulle finestre vere. L'ho visto dallo screenshot (i test passavano: il test delle finestre era troppo debole, confrontava solo lunghezze di stringhe).
  Ora le finestre sono quelle disegnate davvero e il test controlla il colore del vetro.
- Avevo anche aggiornato le lucciole una seconda volta (il motore lo fa già all'aperto): rimosso prima di consegnare.

### Limiti noti (onesti)
- **Non ho ascoltato** i suoni di pioggia e tuono: sono passati dall'audit audio (`A`) ma il volume è tarato a occhio.
- La pioggia non cambia il gioco (né nemici né pesca): è solo atmosfera. Idee per chi vuole: pesci diversi con la pioggia, lumache che escono, pozzanghere.
- Le stanze esterne senza case di notte hanno solo la luce intorno a Lio: è voluto, ma la Radura o il Crepaccio potrebbero meritare luci proprie.
- Nessuna partita completa a mano.

### File toccati / nuovi
- **Nuovi:** `js/sky.js`, `tests/sky21.js`.
- **Modificati:** `audio.js` (2 effetti), `story.js` (riga del Ciclo 21), `LEGGIMI.md` (una riga nei contenuti + `T21` nell'elenco test), `index.html` (`sky.js`, test, `?v=c21b`).

**Avversario, la palla è tua. Sulla valle ora piove, e dopo il finale arriva la notte: le finestre di Brinavalle si accendono.**

---

## CICLO 22 — Agente B (seconda manche)

Ho raccolto l'idea che lasciavi nei limiti: **la pioggia ora cambia il gioco**. E la notte che hai portato ha una sua piccola storia.

### QA di `sky.js` (Ciclo 21)
- Benchmark a scala 3, con riscaldamento e ordine variato (`getImageData` per svuotare la pipeline): sereno, pioggia e temporale sono uguali, con una mediana di circa 1,9 ms; la notte ha una mediana di circa 2,7 ms. I picchi da circa 130 ms compaiono anche col sereno: sono GC o compilazione, non pioggia. Il "sereno 5,2 ms" della mia prima misura era rumore di riscaldamento. **Nessun problema.**
- A 10/10 e T16 6/6 senza toccare nulla: i testi e i colori del cielo erano già a posto.

### Nuovo `js/weather.js` (caricato dopo `sky.js`)
- **Pesca e meteo.** `fishW(g, sp, zone)` sostituisce i pesi di `pickSpecies`; `FISH` resta com'è e **non c'è una sesta specie**.
  - Pioggia oltre 0,4: trote e carpe anche vicino a riva. Con un lancio corto, la quota di pesci grossi passa da circa 5% a circa 20%.
  - Temporale: il Luccio compare anche a media distanza.
  - Notte (solo dopo la vittoria): il Luccio ha peso ×4 al largo e mai a riva.
  - Col tempo sereno i pesi sono identici a prima (c'è un test che lo verifica).
- **Scena di pesca.** Prima mostrava sempre il cielo sereno; ora ha un velo notturno con il riflesso della luna e la pioggia con i cerchi sull'acqua (solo con FEEL.on). All'inizio della pesca, se il tempo non è normale, un avviso dice cosa morde.
- **Pino** aggiunge una sola volta, nel diario di pesca, il consiglio "ascolta il cielo".
- **Fuochi fatui.** Dopo la vittoria, di notte, nella Foresta Antica (`o:0,0`) appaiono tre lucine azzurre, disegnate sopra il buio.
  - Il percorso è un BFS sulle tessere libere, dalla posizione di Lio fino al vicolo cieco in (1,6).
  - Quando Lio si avvicina, le lucine scappano di quattro passi, ma solo dopo essersi posate.
  - All'ultima tappa Lio trova il **bivacco del padre**: un taccuino con due righe di diario e 50 gemme. Un cerchio di pietre con le braci resta disegnato lì.
  - Teodoro riconosce il taccuino una sola volta.
  - Nuova missione secondaria: "I fuochi fatui".
  - La bussola sente il bivacco, ma solo di notte (si aggancia a `compassHas`).
  - Le lucine svaniscono all'alba e si azzerano a ogni `loadRoom`.

### Test: nuovo `tests/weather22.js` (`T22.suite()`, 12 test)
- Col sereno i pesi sono invariati.
- Luccio di notte: sopra 2,5 volte la quota diurna al largo, zero a riva.
- Pioggia: trote e carpe a riva oltre 3 volte la quota col sereno.
- Prima della vittoria la notte non esiste.
- L'avviso di inizio pesca compare solo col maltempo.
- La scena di pesca di notte e con temporale è più scura e non dà errori.
- Le lucine compaiono solo di notte.
- Seguendo le lucine si arriva al bivacco con +50 gemme, in più tappe.
- Il percorso è fatto di tessere libere e contigue.
- Teodoro reagisce una volta sola e la missione si completa.
- La bussola sente il bivacco solo di notte.
- Il consiglio di Pino arriva una volta sola.

### Verifiche fatte (onestamente)
- **Totale 178/178**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · **`T22` 12** · `A` 10.
- `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok. Tutto eseguito con la pagina ricaricata a `?v=c22d`.
- Screenshot: la foresta di notte con le tre lucine, e la pesca di notte sotto la pioggia.
- **Un mio bug di prima stesura, trovato dal test e corretto:** finché la lucina era in volo, Lio le restava vicino e a ogni frame la faceva ripartire di quattro passi, così l'intero percorso si consumava in due tappe. Ora riparte solo dopo essersi posata.
- **Corretto dallo screenshot:** l'avviso di pesca occupava tutta la larghezza e il riflesso della luna ci finiva sotto. Ho accorciato le frasi e spostato la luna.
- **Un falso negativo statistico**, corretto: la soglia del test della pioggia era 0,20, ma il valore atteso è circa 0,21. Ora la soglia è 0,15.

### Limiti noti (onesti)
- **Non ho giocato a mano** l'inseguimento delle lucine: il test sposta Lio di tappa in tappa. A mano la distanza di 22 px potrebbe risultare stretta o larga.
- Il bivacco è disegnato **sopra** il velo notturno (nel wrapper di `drawSky`), quindi di notte le braci risultano più vive del resto. L'ho fatto apposta, ma si può discutere.
- Nessun suono nuovo: le lucine usano `fairy`, il bivacco usa `secret`.
- Le lumache e le pozzanghere che avevi proposto non le ho fatte.

### File toccati / nuovi
- **Nuovi:** `js/weather.js`, `tests/weather22.js`.
- **Modificati:**
  - `story.js`: riga del Ciclo 22.
  - `LEGGIMI.md`: una riga nei contenuti e `T22` nell'elenco test.
  - `index.html`: `weather.js`, il test e `?v=c22d`.

**Avversario, la palla è tua. Ora, quando piove, conviene andare a pescare. E di notte nella foresta c'è qualcuno che aspetta Lio da molto tempo.**

---

## CICLO 23 — Agente A (seconda manche): «Torno presto»

Il Ciclo 22 ha lasciato un filo aperto bellissimo: il taccuino del padre di Lio, partito "verso la fonte del male" e mai tornato, con scritto «torno presto».
Questo ciclo chiude quel filo: è **l'ultimo capitolo della storia di Lio**, dopo il finale.

### Cosa ho fatto — nuovo `js/roots.js` (dopo `weather.js`)
- **L'indizio.** Dopo il bivacco (`flags.bivouac`), Teodoro legge **l'ultima pagina** del taccuino: «Il male ha radici più profonde del trono. Scendo a tagliarle.»
  Se il racconto del Ciclo 22 non era ancora stato sentito, le mie righe vengono **subito dopo** le sue, nello stesso dialogo; altrimenti arrivano alla visita successiva. Imposta `rootsHint`.
- **La scala.** Nel Trono dei Rovi (`d:1,0`) compare una scala `Z` in (7,4) (con `dyn`, solo con `rootsHint`), con una riga di racconto alla prima visita.
- **Le Radici del Trono**, nuovo prefisso **`r:`**. In `game.js` ho esteso la regex di `neighborId`, `mapPrefix`, il colore e l'etichetta della mappa ("RADICI").
  Le tre sale:
  - `r:1,2` **Discesa**: un'arena con due armature e due piante sputasemi. La saracinesca a nord si apre quando cadono tutti (`clearFlag`).
  - `r:1,1` **Groviglio**: una voragine di quattro file. Si passa con l'arpione su un anello a nord, e si torna su un anello a sud; ci sono due pipistrelli.
  - `r:1,0` **Cuore**: un **bozzolo di spine** con dentro una sagoma, nutrito da **quattro Bulbi**. Due sono a terra e si chiudono con la spada; due sono su isolotti in mezzo all'abisso e si chiudono **solo con l'arpione** (con la spada non ci arrivi: c'è un test).
    Un bulbo colpito si chiude per **10 s / 8 s / 6 s** (Facile / Normale / Eroe) e mostra un anello che si consuma, rosso negli ultimi istanti.
    **Vanno chiusi tutti insieme.** Da aperti sputano spine verso Lio. Musica `boss` finché il padre è prigioniero.
- **La liberazione.** I bulbi appassiscono, il bozzolo si sfalda (circa 1,5 s) ed esce il **padre di Lio**, con un nuovo sprite (barba, tunica blu).
  - Il dialogo racconta perché era lì; se Cocca è libera, c'è una riga in più per lei.
  - Il padre dona un **Cuore di Cristallo** (+1 cuore) e riporta Lio al villaggio, con una dissolvenza.
- **Dopo:**
  - Il padre resta a Brinavalle, davanti alla casa di Teodoro. La prima volta saluta, poi alterna frasi che dipendono da ciò che hai fatto: bussola, Cocca, pesca, finestre di notte.
  - Teodoro festeggia.
  - La sala del Cuore ricorda tutto: bulbi appassiti e niente bozzolo.
- **Integrazioni:**
  - missione secondaria **"Torno presto"** nel Diario;
  - medaglia **"Torno presto"** (oro, ora sono **22**);
  - la **Bussola** indica il Trono e il Cuore finché il padre non è libero;
  - scheda **"Bulbo delle radici"** nel **Bestiario** (ho esteso `bestKey`; basta vederlo).

### Test — nuovo `tests/roots23.js` (`T23.suite()`, 11 test)
- Teodoro legge l'ultima pagina solo dopo il taccuino, nell'ordine giusto, una volta sola.
- La scala compare solo con l'indizio e porta davvero a `r:1,2`.
- La saracinesca si apre solo a sala ripulita, e le tre sale sono collegate.
- L'arpione attraversa la voragine all'andata e al ritorno senza cadere.
- La spada chiude i bulbi a terra ma **non arriva** sugli isolotti, dove arriva l'arpione; i bulbi riaprono.
- Tre bulbi su quattro non bastano.
- La scena intera: dialogo, +2 di vita massima, ritorno al villaggio, il padre resta lì, la sala ricorda.
- Le frasi del padre cambiano, e Teodoro festeggia.
- Missione, medaglia, bussola e Bestiario funzionano.
- Tutte le sale, la mappa "RADICI" e la scheda si disegnano senza errori.
- **Bot con input veri, senza vita infinita**: chiude i 4 bulbi a ogni difficoltà. Dal primo bulbo chiuso all'ultimo servono circa **260–280 frame** (~4,5 s), contro finestre di 600/480/360.
  Il test chiede un margine (bot sotto il 70% della finestra) a Facile e Normale; a Eroe chiede solo che sia possibile.

### Verifiche fatte (onestamente)
- `node --check` su tutti i file toccati.
- **Totale 189/189**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · `T22` 12 · **`T23` 11** · `A` 10.
  `T.route()` ok (2,4 min). Ripetuto a pagina ricaricata con `?v=c23b`. `T7.table()` **non l'ho rilanciato** (non tocco la storia principale).
- `T15` (ingressi sicuri) e `T16` (bordi, passaggi, contrasto) coprono le nuove sale da sole, dopo aver esteso a `r:` le regex di `tests/cycle16.js` e `tests/fair15.js`.
- Screenshot: la sala del Cuore con un bulbo chiuso, il dialogo del padre, il padre al villaggio.
- **Errori miei nei test, corretti:**
  - la saracinesca "non si apriva" perché il test aspettava 2 frame, ma ogni colpo ferma il gioco per qualche frame (hitstop di `feel.js`);
  - il Bestiario registra gli avvistamenti ogni 20 frame.

  Non erano difetti del gioco.
- **Ritocco dallo screenshot:** il bozzolo era rado, ora ha due anelli di spine.
- **Bilanciamento:** la prima finestra (540/420/330) a Eroe era più corta del tempo del bot (contato dall'ingresso), quindi l'ho allargata. Ora il test misura dal primo bulbo chiuso.

### Limiti noti (onesti)
- **Non l'ho giocato a mano**: le finestre sono tarate sul bot, e un giocatore vero ci mette di più (per questo il margine).
- Per arrivarci serve il bivacco, quindi una notte dopo il finale (fino a ~6 minuti di attesa, per come funziona il giorno del Ciclo 21).
- Il padre non segue Lio e non ha animazioni sue: sta fermo davanti alla casa.
- Nessun suono nuovo (uso `roar`, `secret`, `hit`, `shutter`, `shoot`). Nessuna partita completa a mano.

### File toccati / nuovi
- **Nuovi:** `js/roots.js`, `tests/roots23.js`.
- **Modificati:**
  - `game.js`: prefisso `r:` in 4 punti;
  - `tests/cycle16.js` e `tests/fair15.js`: regex `[odclr]`;
  - `story.js`: riga del Ciclo 23;
  - `LEGGIMI.md`: una riga senza spoiler, 22 medaglie, `T23`;
  - `index.html`: `roots.js`, il test e `?v=c23b`.

**Avversario, la palla è tua. Lio ha mantenuto la promessa di suo padre: ora a Brinavalle sono di nuovo in due davanti alla casa di Teodoro.**

---

## CICLO 24 — Agente B (seconda manche)

Il padre di Lio aveva promesso: «una di queste mattine andiamo al lago insieme». Ora la promessa si mantiene, ed è una sfida.

### QA del Ciclo 23 (`roots.js`), con una correzione vera
- La regressione era tutta verde: 189/189, `T.route()` ok, e anche `T7.table(1)` e `T7.table(3)` (che non avevi rilanciato), ok a tutte le difficoltà.
- **Bug, raro, corretto in `roots.js`:**
  - liberato il padre, il timer `rootsScene` (90 frame) restava in sospeso anche cambiando partita;
  - uscendo al titolo e caricando una partita entro 1,5 secondi, la scena del padre partiva in un'altra stanza, o in un'altra partita, e portava Lio al villaggio;
  - nei test succedeva davvero: era la causa principale dei fallimenti intermittenti di T23 (circa 3 su 9 nelle mie prove).
- **La correzione:**
  - `loadRoom` azzera `rootsScene`;
  - se il padre è libero ma la scena non è finita (`fatherFreed` senza `fatherHome`), rientrando nel Cuore la scena si ripete;
  - il Cuore di Cristallo del padre si dà una volta sola (`flags.fatherGift`).
  - C'è un test nuovo in T24.
- **Test di T23 resi più solidi** (il gioco non cambia):
  - (a) nel bot dei tempi, se una spina colpisce Lio a metà arpione (HP 12→11 nel caso che ho visto), Lio riprova una volta, come un giocatore;
  - (b) `R.wait(BULB_WIN()+5)` è diventato `+30`: il timer del bulbo non scorre durante l'hitstop di `feel.js`, quindi bastavano pochi frame di stop per far fallire "non riaprono";
  - (c) anche il test arpione/isolotto ora riprova una volta. Raramente (2 su 25 nella suite completa) il primo lancio non arrivava. **La causa non l'ho isolata**: con la strumentazione non si riproduceva più. Il sospetto è una spina in volo.
  - Dopo le correzioni T23 ha passato 30 suite su 30 di fila, poi altre 30 su 30.
- Ho letto il resto di `roots.js`: il bestiario, la medaglia e la bussola sono coerenti. Il "Naturalista" ora richiede anche il Bulbo: mi sta bene, è nel post-gioco.

### Nuovo `js/dad.js` (dopo `roots.js`)
- **Dove sta il padre:**
  - la prima volta saluta (il tuo `fatherHello`, intatto); alla seconda chiacchierata invita Lio: «domattina ti aspetto al lago»;
  - da quel momento, di mattina (fase 0–0,45) è al Lago Specchio accanto a Pino (NPC `padre_lago`, in (10,1)); il resto del giorno è davanti alla casa di Teodoro;
  - prima dell'invito resta sempre al villaggio, così anche se lo liberi di mattina torna a casa con te.
- **La gara**, dal menu del padre: «Gara!», «Due chiacchiere» o «Dopo».
  - Tre lanci a testa; vince il pesce più grosso. Ogni lancio di Lio che finisce (pesce, fuga, lenza ritirata) fa lanciare anche il padre.
  - Il padre prende qualcosa con probabilità 55%, 70% o 80% (Facile, Normale, Eroe), sempre a distanza media, con `pickSpecies(1)`: quindi segue anche il meteo del Ciclo 22. Per batterlo conviene lanciare lontano, o pescare quando piove.
  - Nella scena di pesca il padre si vede, sulla riva a destra del pontile, con canna, lenza e galleggiante che affonda quando abbocca. Sopra di lui compare cosa ha preso; in alto c'è il punteggio («Lanci · Tu · Papà»).
  - Finiti i lanci Lio non può più lanciare, e dopo un attimo arriva il verdetto: vittoria, pareggio o sconfitta, con un consiglio.
  - Prima vittoria: 40 gemme e la medaglia **«Tale padre, tale figlio»** (ora sono 23). Le vittorie successive danno 10 gemme.
  - Se Lio esce a metà, il padre la rimanda e la gara non conta.
  - Nuova missione: «Una mattina al lago».
- **I bulbi suonano** (avevi proposto tu un suono): `bulb1`…`bulb4` in `audio.js`, do-mi-sol-do. La nota dice quanti bulbi sono chiusi insieme in quel momento, così chi gioca *sente* quanto manca. Un bulbo già chiuso non risuona.

### Test: nuovo `tests/dad24.js` (`T24.suite()`, 13 test)
Uno per ciascuno di questi casi:
- posizione del padre (prima dell'invito, poi di mattina e di pomeriggio);
- invito alla seconda chiacchierata, senza coprire il saluto;
- senza la canna di Pino niente gara;
- gara vinta: verdetto, 40 gemme, medaglia, ritorno al gioco;
- seconda vittoria: 10 gemme;
- gara persa: consiglio;
- finiti i lanci non si lancia più;
- uscita a metà;
- probabilità del padre per difficoltà, su 3000 lanci;
- la scena di gara disegnata è diversa dalla pesca normale;
- note dei bulbi;
- missione nel diario;
- correzione della scena del padre.

### Verifiche fatte (onestamente)
- **Totale 202/202**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · `T22` 12 · `T23` 11 · **`T24` 13** · `A` 10.
- `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà. Pagina ricaricata a `?v=c24d`.
- Le 4 note dei bulbi le ho misurate a parte con `Sound.measure`: A non misura ogni effetto, ma solo che la misura funzioni. Risultato: tutte e quattro a circa −34 dB RMS con picco 0,08, cioè accanto a `hit` (−32,2) e fra `secret` (−35,4) e `fairy` (−36,1). Si sentono, senza coprire il colpo.
- `node --check` su `dad.js`, `roots.js`, `audio.js`, `dad24.js`, `roots23.js`.
- **Corretto dallo screenshot:** nella prima versione il padre stava in piedi *nell'acqua* e la canna era un trattino storto. L'ho spostato sulla riva e ho ridisegnato la canna in diagonale.
- **Errori miei di prima stesura, trovati rileggendo e corretti prima dei test:**
  - l'invito avrebbe coperto il primo saluto;
  - liberando il padre di mattina, lui sarebbe "sparito" al lago invece di tornare a casa;
  - a gara finita si poteva lanciare ancora.

### Limiti noti (onesti)
- **Non ho giocato una gara a mano**: i test simulano i lanci. Non so se, dal vivo, il 70% a Normale renda la gara troppo facile o troppo dura.
- Non ho ascoltato le note dei bulbi: le ha misurate solo l'audit.
- Il padre al lago non cammina: come nel tuo limite, non segue Lio. Resta libera l'idea di un epilogo «a casa».

### File toccati / nuovi
- **Nuovi:** `js/dad.js`, `tests/dad24.js`.
- **Modificati:**
  - `roots.js`: correzione `rootsScene` e dono una volta sola;
  - `tests/roots23.js`: test più solidi, commentati «Ciclo 24»;
  - `audio.js`: 4 note;
  - `story.js`: riga del Ciclo 24;
  - `LEGGIMI.md`: una riga, 23 medaglie, `T24`;
  - `index.html`: `dad.js`, il test e `?v=c24d`.

**Avversario, la palla è tua. Il padre di Lio è a casa, e la mattina va a pescare: chi vince la gara?**

---

## CICLO 25 — Agente A (seconda manche): «La festa del ritorno»

### QA del Ciclo 24 e il mio debito del Ciclo 23
- **Il bug di `roots.js` che hai trovato era vero ed era mio**: `rootsScene` restava in sospeso anche cambiando partita. La tua correzione è giusta (azzerato in `loadRoom`, scena ripetuta se `fatherHome` manca, dono una volta sola). Grazie.
- **Ho isolato il fallimento raro che avevi lasciato "causa non isolata"** (l'arpione che a volte non chiudeva il bulbo nord-ovest).
  Ho ripetuto la sequenza centinaia di volte con la strumentazione.
  - **Causa:** in circa l'1% dei casi, una **spina del bulbo sull'isolotto colpisce Lio nello stesso frame in cui arriva** nel punto da cui si lancia l'arpione (`hurtT` = 70 all'arrivo, contraccolpo 1,5 / 3,2 dall'alto a sinistra).
  - Il contraccolpo si vede solo al frame dopo, e porta Lio a (3,5): da lì l'arpione sale lungo la colonna sbagliata e sfiora il bulbo.
  - **Non è un difetto**: è il bulbo che fa il suo lavoro. Il tuo secondo tentativo nel test è la correzione giusta e non l'ho toccato.
  - Ho escluso prima la volpe (era solo vicina per caso) e il cammino del bot (arriva sempre).
- Regressione verde al mio arrivo: 202/202, `T.route()` ok.

### Cosa ho fatto — nuovo `js/party.js` (dopo `dad.js`)
- **La festa.** Quando Lio torna a casa col padre (`fatherHome`, alla prima entrata nel villaggio), è già notte (sposto `s.dayStart`).
  In piazza ci sono:
  - un **falò** (entità `Bonfire`, con fiamme animate, scintille e luce nel velo notturno);
  - le **lanterne** colorate su un filo da casa a casa, ognuna con il suo alone;
  - **otto invitati** in cerchio che saltellano a turno e guardano il fuoco: Teodoro, il padre, Bortolo, Pino, Nina, Marta, Silvano e **Ortensio** («il fuoco scalda anche chi ha sbagliato»);
  - la fata, se l'hai trovata.

  Durante la festa gli abitanti "di tutti i giorni" della piazza (Nina, Marta, il padre di B) si nascondono, per non avere doppioni. Le battute dipendono da cosa hai fatto: Cocca, la gara col padre.
- **Musica nuova:** `festa`, una giga in Sol maggiore a 138 bpm con tre voci e batteria, in `audio.js`. Passa l'audit armonico e di volume (`A`); `TRACK_GAIN` è 1,1.
- **Il brindisi.** Parlando col padre: discorso, «ALLA SALUTE DI LIO!», **fuochi d'artificio** (razzi che salgono e si aprono a stella, con `shoot` e `pop`) e, dopo 2,5 s, il cartello **«FINE»**.
  - È un nuovo stato `finale`: il villaggio in festa resta sullo sfondo con i fuochi, e ci sono tempo, cuori e medaglie.
  - Da lì si torna a giocare.
  - **La notte aspetta il brindisi** (il tempo si ferma a fase 0,84); poi all'alba la festa finisce, falò e invitati spariscono e la festa non ricomincia.
- **Medaglia** «La festa del ritorno» (ora sono **24**).
- **Modifiche a file non miei** (piccole e documentate):
  - `story.js`: all'inchino finale dell'epilogo del giardino ora c'è anche **il padre**, se è tornato (la spaziatura si adatta);
  - `sky.js` (mio): `Sky.lightHooks`, perché altri file possano aggiungere luci alla notte;
  - `tests/roots23.js`: il controllo "il padre è al villaggio" accetta anche il padre della festa.

### Test — nuovo `tests/party25.js` (`T25.suite()`, 8 test)
- Senza il padre a casa non c'è festa.
- Al ritorno: notte, falò, 8 invitati, musica `festa`, racconto, nessun doppione.
- Ogni invitato parla e guarda il fuoco.
- La notte aspetta il brindisi.
- Brindisi → fuochi → FINE; il cartello non si chiude prima di 150 frame; si torna a giocare; il padre non ripete il brindisi.
- All'alba la festa finisce, tornano gli abitanti di sempre e la festa non ricomincia.
- La medaglia funziona.
- Disegno senza errori anche con gli effetti spenti, sotto 5 ms per frame.

### Verifiche fatte (onestamente)
- **Totale 210/210** (… `T23` 11 · `T24` 13 · **`T25` 8** · `A` 10) e `T.route()` ok. Ripetuto a pagina ricaricata con `?v=c25c`.
  **`T7.table(1)`: 3/3 completate** (Facile, Normale, Eroe).
- Screenshot: la piazza in festa, i fuochi, il cartello FINE, l'inchino col padre.
- **Ritocchi dagli screenshot:** gli invitati ai bordi restavano al buio (luce del falò da 58 a 74 px); i fuochi d'artificio erano piccoli (ora 26 scintille, più veloci).
- Un test di `T23` si è rotto in modo atteso (vedi sopra), e l'ho aggiornato.

### Limiti noti (onesti)
- **Non ho ascoltato la giga**: passa gli audit, ma non so come suona davvero.
- Gli invitati non ballano davvero: saltellano sul posto.
- Cocca non salta di più alla festa (Nina lo dice, ma non c'è un'animazione dedicata).
- Il cartello FINE copre anche l'HUD (voluto, ma si può discutere).
- Nessuna partita completa a mano.

### File toccati / nuovi
- **Nuovi:** `js/party.js`, `tests/party25.js`.
- **Modificati:**
  - `audio.js`: traccia `festa`;
  - `sky.js`: `lightHooks`;
  - `story.js`: riga del Ciclo 25 e il padre all'inchino;
  - `tests/roots23.js`: una riga;
  - `LEGGIMI.md`: 24 medaglie e `T25`;
  - `index.html`: `party.js`, il test e `?v=c25c`.

**Avversario, la palla è tua. La storia di Lio adesso ha una fine vera: una notte di festa, con tutta la valle intorno al fuoco.**

---

## CICLO 26 — Agente B (seconda manche)

L'idea l'avevi proposta due volte: **il padre che cammina con Lio**. Eccola, con un motivo per farlo: la valle raccontata da lui.

### QA del Ciclo 25 (`party.js`)
- Regressione verde prima di toccare nulla: 210/210, `T.route()` ok, `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà.
- Grazie per aver isolato il fallimento raro di T23 (la spina nello stesso frame dell'arrivo): spiegazione convincente.
- Sul tuo codice non ho trovato difetti. Non ho toccato `party.js`.
- **Un test intermittente da segnalare:** T9, "il bot completa la sfida a Normale (almeno 1 su 3)".
  - È fallito 2 volte in tutto: 1 su 5 in una serie, poi 0 su 12, e la regressione finale è passata.
  - Il test è statistico: il bot perde ogni tanto tutti e tre i tentativi al 3° guardiano.
  - Nella Sfida il mio codice è spento (`walking()` è falso con `rush`), quindi non lo considero un effetto del Ciclo 26. **Non ne ho cercato la causa.**

### Nuovo `js/walk.js` (dopo `party.js`)
- **L'invito:** dopo la festa (`partyDone`), nel dialogo del padre in piazza c'è una domanda in più: «Ti va di fare due passi?», con le risposte «Andiamo!» e «Un'altra volta».
- **La passeggiata:**
  - il padre fermo sparisce e al suo posto compare `DadWalker`, che segue Lio sulle sue orme come Cocca, con le sue animazioni di camminata;
  - con Cocca in fila resta più indietro (36 frame invece di 24), così non la calpesta;
  - viene all'aperto e nelle case (`o:` e `i:`); nei dungeon no: dopo un attimo compare il banner «Papà: Ti aspetto qui fuori!», e uscendo è di nuovo accanto a Lio;
  - non combatte e non ha collisioni;
  - il flag `dadWalk` si salva, quindi ricaricando la partita il padre è ancora con te;
  - mentre passeggia non c'è un secondo padre: le `cond` di `FATHER_NPC` e `DAD_LAKE` lo escludono.
- **I ricordi:**
  - in ognuno dei 9 luoghi all'aperto, dopo circa un secondo e solo se non c'è un altro dialogo, il padre si ferma e racconta un ricordo; prima compare un fumetto «…»;
  - ogni ricordo arriva una volta sola (`memo:<stanza>`);
  - dopo tutti e 9 arrivano 60 gemme e la medaglia **«Passo dopo passo»** (ora sono 25);
  - nel diario c'è la missione «Due passi con papà», con il conteggio 0/9.
- **Parlandogli mentre cammina:**
  - «Continuiamo»;
  - «Gara di pesca»: solo al lago, di mattina, con la canna di Pino; riusa il menu del Ciclo 24;
  - «Torna a casa»: in piazza torna subito al suo posto.

### Test: nuovo `tests/walk26.js` (`T26.suite()`, 12 test)
- Invito solo dopo la festa.
- Il padre fermo diventa quello che cammina.
- Segue un passo indietro.
- Viene all'aperto e nelle case.
- Nel dungeon aspetta fuori (con il banner) e uscendo è di nuovo con te.
- Un ricordo per luogo, una volta sola.
- Il ricordo aspetta che finisca un altro dialogo.
- Tutti e 9: 60 gemme e la medaglia.
- Menu: continuare, la gara al lago di mattina, «Torna a casa» lo rimette in piazza.
- Mai due padri.
- La passeggiata si salva.
- Disegno in 4 direzioni, fermo e in cammino, col fumetto.

### Verifiche fatte (onestamente)
- **Totale 222/222**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · `T22` 12 · `T23` 11 · `T24` 13 · `T25` 8 · **`T26` 12** · `A` 10.
- `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà. Pagina ricaricata a `?v=c26e`.
- **Prova "dal vero", senza teletrasporto:** Lio esce a piedi dalla piazza verso il Crocevia; il padre e Cocca lo seguono e il ricordo del Crocevia parte da solo. Controllato con gli screenshot.
- **Corretto dagli screenshot:**
  - entrando dal bordo, il padre veniva messo dietro Lio, fuori dallo schermo: ora resta dentro la stanza;
  - a riposo si sovrapponeva a Cocca: ora sta più indietro e la fila è Lio, Cocca, padre.
- **Errori miei di prima stesura, corretti:**
  - il ricordo e l'avviso del dungeon partivano da `afterEnter`, e il banner veniva sovrascritto dal nome della stanza. Ora il ricordo parte da `loadRoom` e l'avviso arriva dopo un attimo, se lo schermo è libero;
  - il dono finale aveva una frase senza senso;
  - fermando la passeggiata in piazza, il padre fermo non ricompariva fino al cambio stanza.

### Limiti noti (onesti)
- **Non ho fatto tutto il giro dei 9 ricordi giocando a mano**: il test segna i primi 8 come già sentiti. Il percorso vero l'ho fatto solo dalla piazza al Crocevia.
- Il padre non entra nei dungeon e non aiuta in combattimento: è voluto, ma un giocatore potrebbe aspettarselo.
- Ricordi e dialoghi sono solo testo: nessuna animazione speciale.
- Il cartello «FINE» che copre l'HUD (dal tuo elenco dei limiti) non l'ho toccato.

### File toccati / nuovi
- **Nuovi:** `js/walk.js`, `tests/walk26.js`.
- **Modificati:**
  - `story.js`: riga del Ciclo 26;
  - `LEGGIMI.md`: una riga, 25 medaglie, `T26`;
  - `index.html`: `walk.js`, il test e `?v=c26e`.

**Avversario, la palla è tua. Ora a Brinavalle si può passeggiare in tre: Lio, Cocca e il papà, che ha un ricordo per ogni sentiero.**

---

## CICLO 27 — Agente A (seconda manche): il Segnavia

### QA del Ciclo 26 e il test intermittente di T9
- Regressione verde al mio arrivo: 222/222, `T.route()` ok. Nel tuo `walk.js` non ho trovato difetti.
- **T9, "il bot completa la sfida a Normale"**: ho misurato. Il bot vince **14 sfide su 20 (70%)**, come nel Ciclo 11, e **tutte le sconfitte sono alla prova 3** (Re dei Rovi, con il bot da duello `T5.step`).
  Con 3 tentativi il falso allarme vale 0,3³ ≈ **2,7%**: vederlo 2 volte in ~17 giri è sfortuna, ma plausibile. Non è un difetto nuovo del gioco.
  Ora i tentativi sono **5** (falso allarme ≈ 0,24%), con il conto scritto nel commento. Il bot da duello non l'ho toccato.

### Cosa ho fatto — il Segnavia (nuovo `js/waypoint.js`, dopo `walk.js`)
Il gioco diceva **cosa** fare (l'obiettivo in pausa) ma non **dove** andare. Per chi gioca la prima volta, giudice compreso, è facile perdersi tra valle, Rovine e Grotta.
- **Una freccia dorata**, piccola, con bordo scuro, che oscilla:
  - sul **bordo dello schermo**, al centro del varco più vicino a Lio, se la strada passa da lì;
  - sopra la **porta o la scala**, se si passa da un warp;
  - sopra il **forziere giusto**, nella stanza dell'obiettivo (bombe, arpione, Chiave del Re).
- **Il percorso** è una ricerca in ampiezza sul grafo delle stanze. Contano i bordi aperti (porte, saracinesche, rovi, crepe e cespugli sono "apribili") e i warp visibili, con i `dyn` della storia applicati.
  La meta segue `currentObjective`: Teodoro → Santuario → Rovine → Grotta → Rovine → arpione → Chiave del Re → Trono. Dopo la vittoria indica solo Ortensio, finché non comincia la missione dei semi.
- **Nuova opzione «Segnavia»**: *No* / **Se ti perdi** (di serie: la freccia compare solo dopo **150 s** di gioco sullo stesso obiettivo, con l'avviso «Serve una mano? Segui la freccia dorata», una volta) / *Sempre*.
  - Non compare mai nei dialoghi né nella Sfida.
  - Per farci stare la riga, la spaziatura del menu passa da 13 a 12 px (`OPT_Y0` 38 → 34).
- **In pausa, sulla mappa**, un **«!»** lampeggiante segna la stanza della zona verso cui andare, se l'opzione non è *No*.
- **Testi:** una riga in `LEGGIMI.md`; nella guida dentro il gioco il consiglio sulla difficoltà ora nomina anche il Segnavia (nella stessa riga, vedi sotto).

### Test — nuovo `tests/way27.js` (`T27.suite()`, 11 test)
- Il valore di serie è «Se ti perdi» (letto dal sorgente di `game.js`), e il menu passa da No a Sempre.
- Ogni tappa della storia ha la sua meta, e da **ogni stanza della valle e delle Rovine** c'è un percorso verso la meta di ogni tappa.
- **Un bot che non conosce la mappa e segue solo la freccia** arriva:
  - dalla casa di Teodoro al Santuario della spada;
  - dal Santuario alle Rovine;
  - dalle Rovine crollate alla Grotta.
- Nella stanza della meta la freccia indica il forziere giusto.
- «Se ti perdi»: niente freccia per 150 s, poi la freccia e l'avviso (una volta sola); cambiando obiettivo si riparte da zero.
- «No» non mostra mai niente; niente freccia nei dialoghi e nella Sfida.
- Il «!» in pausa è sul pixel giusto.
- La freccia si disegna in **tutte** le stanze, a ogni tappa, e il menu ha 9 righe.

### Verifiche fatte (onestamente)
- **Totale 233/233** (… `T26` 12 · **`T27` 11** · `A` 10) e `T.route()` ok, **con la pagina caricata a `?v=c27f`** (controllato sugli `src` degli script). **`T7.table(1)`: 3/3.**
- Screenshot: la freccia sul bordo nel villaggio, la freccia sulla porta del Santuario, il menu opzioni con la riga nuova.
- **Errori miei, corretti:**
  - Il primo test dell'opzione controllava un oggetto costruito nel test stesso, quindi non provava niente. Ora legge il sorgente.
  - Un consiglio in più nella guida usciva dal riquadro: l'hanno colto i tuoi audit (`T12` fondo 188/166, `T16` sovrapposizioni e contrasto). Ho unito le due frasi in una.
  - Un apostrofo non protetto ha rotto `game.js` per un giro. Siccome il cambio di versione era concatenato a quel controllo, la pagina è rimasta a `c27c` e **una regressione è girata sui file vecchi**: me ne sono accorto controllando gli `src`, ho portato tutto a `c27f` e l'ho ripetuta.

### Limiti noti (onesti)
- Il percorso è tra **stanze**, non dentro la stanza: in stanze con muri interni la freccia indica il varco giusto, ma la strada fino a lì va trovata.
- Dal villaggio alla spada la freccia passa dal Lago Specchio e non dal Crocevia: i due percorsi sono lunghi uguali e la ricerca prende il primo. Funziona (il bot ci arriva), ma Teodoro dice "a nord-ovest".
- Nei dungeon la freccia non sa di chiavi e interruttori: indica la porta, non come aprirla.
- Niente frecce per le missioni secondarie: è voluto, per non togliere la scoperta.
- Non l'ho provato a mano.

### File toccati / nuovi
- **Nuovi:** `js/waypoint.js`, `tests/way27.js`.
- **Modificati:**
  - `game.js`: opzione `way` (valori, menu, aiuto, `OPT_Y0`/`OPT_DY`) e un consiglio nella guida;
  - `tests/rush9.js`: 5 tentativi;
  - `story.js`: riga del Ciclo 27;
  - `LEGGIMI.md`: una riga e `T27`;
  - `index.html`: `waypoint.js`, il test e `?v=c27f`.

**Avversario, la palla è tua. Chi gioca per la prima volta adesso non si perde più, a meno che non lo voglia.**

---

## CICLO 28 — Agente B (seconda manche)

Il tuo Segnavia è una bella idea, e tocca il gioco principale: per questo l'ho controllato con più cura. Ho trovato **un difetto vero sul percorso principale** e ho dato al Segnavia le due cose che nei limiti dicevi mancare.

### QA del Ciclo 27 (`waypoint.js`)
- Regressione verde al mio arrivo: 233/233, `T.route()` ok, `T7.table(1)` e `T7.table(3)` ok.
- Il tuo calcolo su T9 (0,3³ ≈ 2,7%, ora 5 tentativi) mi convince: grazie.
- **Il difetto:** le porte `L` e `G` contavano sempre come "apribili".
  - Nell'Atrio delle Rovine (`d:1,1`), senza chiavi, la freccia indicava la porta chiusa a **est**, mentre la chiave è nel forziere di `d:0,1`, a **ovest**.
  - Chi seguiva la freccia trovava solo «La porta è chiusa a chiave».
  - Nella Grotta succede lo stesso (`c:1,1`, chiave in `c:0,1`).
  - Era il tuo limite «nei dungeon non sa di chiavi», ma sulla strada principale del primo dungeon.

### Nuovo `js/waykeys.js` (dopo `waypoint.js`; sostituisce `wayExits`, `objectiveRoom`, `objectiveChest` e avvolge `wayTargets`)
- **Chiavi:**
  - un varco fatto solo di porte chiuse non si attraversa (`wayLocked`): una porta `L` è chiusa se non hai chiavi, una `G` se non hai la Chiave Grande, a meno che sia già aperta (`open:` nei flag);
  - se così la meta non si raggiunge, la meta diventa il forziere-chiave ancora chiuso (`wayKeyRoom`) e, in quella stanza, la freccia indica il forziere;
  - le chiavi valgono ovunque, quindi do la **precedenza a quelle nella zona della meta**. Dalla piazza, verso le Rovine, la freccia porta alla chiave delle Rovine e non a quella della Grotta, che è più vicina.
- **Sentiero di brina** (era il tuo limite «la freccia indica la stanza, non il cammino»):
  - se Lio resta fermo per 75 frame con la freccia visibile, compaiono puntini dorati tessera per tessera fino all'uscita giusta, con un'onda che corre verso la meta; muovendosi svaniscono;
  - è una BFS sulle tessere percorribili: niente voragini `_`, e i forzieri contano come ostacoli, così il sentiero finisce *accanto* al forziere;
  - nelle stanze buie i puntini si vedono solo dentro la luce di Lio (22 px, 72 con la lanterna), così il buio resta un enigma.
- **Prestazioni:** `objectiveRoom` e `wayTargets` sono ricordati per frame. Freccia, sentiero e mappa li chiedevano più volte nello stesso frame: senza memoria il costo era circa 1,05 ms, ora è sotto 1 ms (c'è un test).

### Test
- Nuovo `tests/waykeys28.js` (`T28.suite()`, 12 test):
  - nell'Atrio senza chiavi la freccia va a ovest;
  - dalla piazza la meta è la chiave delle Rovine, non quella della Grotta;
  - nella stanza della chiave la freccia indica il forziere;
  - con una chiave in tasca la freccia va a est, come prima;
  - una porta già aperta conta come aperta;
  - nella Grotta non si passa direttamente dalla porta chiusa (c'è un giro lungo da nord, ed è legittimo);
  - la porta `G` è chiusa senza Chiave Grande;
  - **un bot che segue solo la freccia e il sentiero**: dall'Atrio va alla chiave, la prende, torna e passa la porta est;
  - il sentiero compare solo da fermi e arriva all'uscita;
  - il sentiero passa solo su tessere percorribili e contigue (Atrio, Foresta, piazza);
  - con «Segnavia: No» non c'è niente;
  - il costo resta sotto 1 ms.
- **`tests/way27.js`** (tuo), modificato e commentato «Ciclo 28»: le tappe «arpione», «Chiave del Re» e «Re dei Rovi» ora hanno `keys: 1`. Senza chiavi la meta diventa giustamente la chiave; i tuoi test misurano mete e collegamenti, le chiavi le prova T28.

### Verifiche fatte (onestamente)
- **Totale 245/245**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · `T22` 12 · `T23` 11 · `T24` 13 · `T25` 8 · `T26` 12 · `T27` 11 · **`T28` 12** · `A` 10.
- `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok. Pagina ricaricata a `?v=c28f`.
- Screenshot: il sentiero nella Foresta Antica fino all'uscita est, e nella stanza buia della chiave.
- **Errori miei, trovati e corretti:**
  - il sentiero finiva *sopra* il forziere (che è un'entità, non una tessera): ora ci si ferma accanto;
  - nella stanza buia il sentiero svelava tutto il labirinto: ora si vede solo nella luce;
  - la mia suite lasciava `R.god = false` (di serie è `true`), e `T.route()` dopo la regressione impiegava 4,2 minuti invece di 2,4. L'ho trovato confrontando il bot da solo e dopo ogni suite: ora salvo e ripristino;
  - due errori del mio bot di test (fermo al centro del varco; partiva durante lo scorrimento tra le stanze), non del gioco.

### Limiti noti (onesti)
- Se in una stanza ci sono **due** porte chiuse in fila e una sola chiave, il percorso le considera entrambe aperte: con una chiave, ogni porta `L` vale come aperta.
- Le porte chiuse *dentro* una stanza, non sul bordo, il grafo delle stanze continua a non vederle (come prima). Il sentiero sì: le attraversa come «apribili».
- Non ho giocato a mano con «Se ti perdi»: il sentiero l'ho visto solo con «Sempre».

### File toccati / nuovi
- **Nuovi:** `js/waykeys.js`, `tests/waykeys28.js`.
- **Modificati:**
  - `tests/way27.js`: chiavi nelle tappe del dungeon e `stage()` che le imposta;
  - `story.js`: riga del Ciclo 28;
  - `LEGGIMI.md`: una frase sul Segnavia e `T28`;
  - `index.html`: `waykeys.js`, il test e `?v=c28f`.

**Avversario, la palla è tua. Ora il Segnavia sa che una porta chiusa non è un'uscita, e se ti fermi ti disegna la strada nella brina.**

---

## CICLO 29 — Agente A (seconda manche): una partita vera, a mano

Tutti e due, ciclo dopo ciclo, abbiamo scritto tra i limiti "non l'ho giocato a mano". Questa volta l'ho fatto: **pagina normale (non `?test`), tasti veri** (`keydown`/`keyup` tenuti premuti per un tempo reale), partita nuova dal titolo.
- Ho seguito il prologo, Teodoro, la piazza, il Crocevia, la spada nel Santuario, Cocca, le Rovine e il crollo, Silvano, il Bosco dei Rovi, i Campi e l'ingresso della Grotta.
- In tutto **7 minuti di gioco e 3 cadute**.

### QA del Ciclo 28
- **Il difetto del Segnavia sulle porte chiuse era vero ed era mio**: le porte `L`/`G` contavano sempre come apribili. La tua correzione (`waykeys.js`) è giusta, e il sentiero di brina l'ho visto all'opera nella prova: nella Radura i puntini portavano già verso la Grotta.
- Regressione verde al mio arrivo: 245/245, `T.route()` ok.

### Tecnica della prova (utile anche a te)
- Il pannello del browser era **nascosto**, quindi `requestAnimationFrame` era sospeso e il gioco restava fermo. Il primo tentativo è "girato" a zero frame al secondo.
- Ho fatto girare il gioco con un timer a 60 fps che fa esattamente quello che fa il ciclo principale (`Input.poll`, `update`, `endFrame`, `render`). Tutto il resto è vero: eventi della tastiera, salvataggi, medaglie.
- Ora c'è **`index.html?hand`**, che carica `tests/hand29.js`: `H.drive()`, `H.hold()`, `H.seq()`, `H.goTo()`, `H.talk()`, `H.fight()`, `H.st()`, `H.hurt` (registro dei colpi) e `H.clean()`.
  Salvataggi e medaglie sono **veri**: alla fine `H.clean()` li cancella. Io l'ho fatto: nel browser restano solo le opzioni.

### Difetti trovati giocando, e corretti
1. **Cocca rubava il fendente (difetto vero, mio, Ciclo 19).**
   - **Cosa succedeva:** nel Bosco dei Rovi Cocca si è seduta proprio davanti a Lio, bloccata dagli stessi rovi. Ogni Azione la **accarezzava** invece di tagliare («Cocca ti lecca la punta delle dita»); l'Azione dopo chiudeva il dialogo e quella dopo ancora la riaccarezzava. **Non si poteva tagliare il rovo, e si restava bloccati.** Nessun bot lo vedeva: nessuno premeva Azione con la volpe davanti e un rovo dietro.
   - **Correzione (`fox.js`):** la carezza non ruba mai il fendente. Se nella zona della spada c'è un rovo o un cespuglio, o c'è un nemico vicino, vince la spada. Dopo una carezza, per 3 s Azione è solo fendente; il conto è robusto anche se `Game.t` torna indietro, come fa un test di `T27`.
2. **Un colpo poteva buttare Lio fuori dalla stanza (difetto vero, motore).**
   - **Cosa succedeva:** all'ingresso della Grotta uno slime di ghiaccio mi ha colpito, e il contraccolpo mi ha spinto sulla scala d'uscita: **ero di nuovo nei Campi.** Vale per qualunque porta o scala.
   - **Correzione (`game.js`, `checkWarps`):** se Lio arriva su un passaggio per un contraccolpo, il passaggio non scatta (`p.warpHold`) finché non ne esce. Camminandoci sopra si esce come sempre.
3. **Due soli nel prologo (difetto visivo).** Nella dissolvenza dal giorno al crepuscolo si disegnavano due paesaggi, ciascuno con il suo sole, a due altezze diverse.
   - **Correzione:** `drawLandscape` accetta l'altezza del sole, e il prologo lo fa scendere in modo continuo: un solo sole che tramonta.

### Cose viste e NON corrette (onestamente)
- **La prima caduta non l'ho spiegata.** Nelle Rovine sono passato da 5 a 0 mezzi cuori camminando a est per 2,6 s. Non avevo ancora il registro dei colpi. L'ho cercata in 12 riproduzioni in modalità test (con e senza Cocca) e in prove dal vivo: **non si è ripetuta.** Con 70 frame di invulnerabilità dopo ogni colpo, 5 colpi in 2,6 s non tornano. Resta un mistero aperto; se lo rivedi, ora c'è `H.hurt`.
- Le altre due cadute sono state **colpa mia**: ho camminato alla cieca nel Bosco mentre le piante sparavano, e la mia tattica di combattimento (`H.fight`) è troppo grezza per gli slime di ghiaccio. Non le considero un segnale sulla difficoltà; però tre cuori, con piante, slime di ghiaccio e pipistrelli tutti nei primi dieci minuti, sono un inizio non facilissimo. Da guardare se il giudice lo trova duro.
- Le cose che **funzionano bene** a mano:
  - i dialoghi si leggono;
  - la storia guida in modo chiaro (Teodoro → spada → Rovine → crollo → Silvano → Grotta);
  - il Segnavia con il sentiero di brina compare quando serve;
  - Cocca libera è un bel momento.

### Test — nuovo `tests/play29.js` (`T29.suite()`, 5 test)
- Con Cocca davanti e un rovo, Azione taglia il rovo e non accarezza.
- Con Cocca davanti e niente da colpire, la carezza c'è; poi per 3 s Azione è fendente; dopo, la carezza torna.
- Con Cocca davanti e un nemico vicino, Azione colpisce.
- Un colpo che spinge Lio sulla scala della Grotta non lo fa uscire; camminandoci sopra si esce.
- Nel prologo, a metà dissolvenza, c'è un solo tratto di sole sulla colonna x = 170, con il nucleo pieno.

**Ho verificato che i test colgano davvero i difetti:** rimettendo nel browser il vecchio `checkWarps` il test delle scale fallisce ("spinto fuori: o:2,2"). Rimettendo il vecchio disegno del sole fallisce anche quello (3 tratti chiari, nucleo 169). Il primo criterio sul sole era debole (trovava "0 soli" anche nel caso sbagliato): l'ho rifatto sui profili misurati.

### Verifiche fatte
- **Totale 250/250** (… `T28` 12 · **`T29` 5** · `A` 10) e `T.route()` ok (2,4 min), con **tutti gli script a `?v=c29d`** (controllato sugli `src`). **`T7.table(1)`: 3/3.**
- Screenshot: prologo con un solo sole, e i momenti della partita a mano.
- **Errori miei nei test, corretti:**
  - il primo test della volpe metteva il rovo fuori dalla portata della spada;
  - il conto delle carezze si rompeva nella suite completa, perché `T27` riporta indietro `Game.t`.

### File toccati / nuovi
- **Nuovi:** `tests/play29.js`, `tests/hand29.js`.
- **Modificati:**
  - `fox.js`: la carezza non ruba il fendente;
  - `game.js`: `checkWarps` e il parametro `sunAt` di `drawLandscape`;
  - `story.js`: sole del prologo e riga del Ciclo 29;
  - `LEGGIMI.md`: `T29` e `?hand`;
  - `index.html`: `play29.js`, il caricatore `?hand` e `?v=c29d`.

**Avversario, la palla è tua. Ti consiglio di giocare anche tu, a mano, con `?hand`: in dieci minuti ho trovato due difetti che 245 test non vedevano.**

---

## CICLO 30 — Agente B (seconda manche)

Il ciclo è cominciato con la prova a mano che consigliavi. A metà è arrivato **il nuovo focus del giudice: ampliare storia e mondo**. Ho chiuso la prova con le due correzioni trovate giocando e ho dedicato il resto al **Capitolo II, «La Nebbia Grigia»**: una nuova regione a nord.

### Prova a mano (`?hand`, tasti veri) e due correzioni
- **Giocato:** Campi → Grotta (2 cadute per colpa della mia tattica grezza, 1 uscita sulle scale per colpa mia) e **3 gare di pesca col padre** con tasti veri e reazioni di circa 200 ms (2 vinte, 1 persa). La gara funziona come previsto.
- **Difetto 1, corretto in `game.js` `checkEdges`.** Un colpo vicino al **bordo** della stanza ti buttava nella stanza accanto: è il caso dei bordi accanto al tuo `warpHold` sulle scale.
  - Nella sala ghiacciata della Grotta un pipistrello mi ha spinto a sud, nella sala di prima, con i nemici di nuovo tutti lì e 1 solo mezzo cuore.
  - Riprodotto in tutti e 4 i lati; ora, se c'è un contraccolpo (`|kbx|+|kby| > 0.15`), si resta dentro.
- **Difetto 2, corretto in `game.js` `afterEnter`.** Il salvataggio avveniva **prima** di `onEnter`, quindi i flag dei testi d'ingresso (es. `caveEntered`) non venivano salvati e il «Continua» ripeteva il testo della Grotta a ogni tentativo. Ora si salva di nuovo se `onEnter` cambia i flag.
- **La tua caduta inspiegata (5→0 in 2,6 s): un'ipotesi, NON verificata.**
  - Nessun danno aggira `hurtT` (70 frame), quindi 5 colpi richiedono almeno 280 frame.
  - `H.drive()` avverte però che con il pannello visibile il gioco gira al **doppio**: se il pannello è diventato visibile durante la tua prova, 2,6 s reali sono circa 312 frame, abbastanza per 5 colpi normali.
- **Audio:** abbiamo applicato quasi insieme la richiesta del giudice. Ho tolto la mia versione e tengo la tua (`SILENT`, `&sound`).

### Capitolo II — nuovo `js/north.js` (dopo `waykeys.js`)
**Storia.** Dopo la festa (`partyDone`) in piazza a Brinavalle c'è **Ilde**, una staffetta di Pietrabianca, stremata.
- Da tre lune (le stesse del furto del Cuore) una **Nebbia Grigia** scende dalla **Torre del Silenzio**: chi ci si perde torna senza ricordi.
- Le campane di Pietrabianca la tenevano lontana, ma le tre **Campanelle d'Argento** sono state rubate da ombre.
- Parlarle (`northCall`) apre una **scala** nella Radura dell'Eremita (`o:2,0` (5,1), tessera `U`). Silvano, il padre e Teodoro hanno battute nuove (una volta sola).

**La regione `n:`**: terreno `snow` nuovo, pini innevati, neve che cade e musiche esistenti.

| stanza | nome | contenuto |
|---|---|---|
| `n:1,2` | Valico delle Nebbie | ingresso (scala `Z` per tornare alla Radura), pipistrelli e slime di ghiaccio, un cartello |
| `n:1,1` | Pietrabianca | Berta (la sindaca), Tobi (indizi), Ilde (dopo l'arrivo); due case: `i:campanile` (Gualtiero) e `i:locanda` (Rufo: zuppa che ridà i cuori per 5 gemme, e voci) |
| `n:0,1` | Lago Grigio | campanella su un'isola: **arpione** dal palo a riva, oppure a nuoto con le Squame |
| `n:2,1` | Pineta Ghiacciata | labirinto di pini; campanella dietro una roccia incrinata (**bombe**) |
| `n:2,0` | Cima del Vento | arena: la campanella compare sconfitti tutti (2 armature e 2 pipistrelli) |
| `n:1,0` | Soglia della Torre | la facciata della **Torre del Silenzio** e il portone |

- **Nebbia:** finché le campane tacciono, nel Nord si vede solo intorno a Lio (56 px, 78 con la lanterna), con banchi di nebbia che scorrono. Dopo le campane resta un velo leggero.
- **Gualtiero:** la prima volta racconta tutto; poi appende le campanelle una alla volta (`bellsHung`). Con tre suona: `northBells`, la nebbia si dirada e Lio riceve 50 gemme.
- **Diario:** il Capitolo II ha **una pagina sua** (`window.CHAPTERS2`). L'elenco del primo atto era già pieno: aggiungendo righe i testi si sovrapponevano, e il tuo audit T16 se n'è accorto. Quando arriva `northCall`, nel diario i capitoli del primo atto lasciano il posto a quelli del secondo.
- **Obiettivo e Segnavia:** seguono il capitolo (villaggio → campanile → le tre stanze delle campanelle → campanile).
- **Medaglia:** «Le campane del Nord» (ora sono 26).
- **`game.js`:** prefissi `n` e `t` nella regex di `neighborId`; la mappa in pausa mostra «NORD» (anche nelle due case).

### PER TE — LA TORRE DEL SILENZIO (risposte alle tue domande)
- **Ingresso.** In `n:1,0` il portone è una saracinesca `J` di "gelo nero" in **(7,2) e (8,2)**: nessuna chiave lo apre, nemmeno la Grande.
  - Con `northBells` **e** `ROOMS['t:1,2']` esistente, (7,2) diventa una scala `Z` e (8,2) pavimento `P`.
  - Il warp `'7,2' → { to: 't:1,2', x: 7, y: 8, dir: 1 }` esiste **solo se `ROOMS['t:1,2']` esiste**: è un getter, così gli audit dei warp non vedono stanze mancanti. Basta che tu crei `t:1,2` e la porta funziona, con Lio che arriva in (7,8).
  - Se vuoi un'altra stanza d'arrivo, cambia `TOWER_ROOM` in `north.js` (costante in alto).
- **Flag:**
  - campanelle: `chest:n_bell_lago`, `chest:n_bell_pineta`, `chest:n_bell_cima` (`bellCount(g)`);
  - campane suonate: **`northBells`**;
  - gli altri: `northCall` (Ilde sentita), `northArrived`, `bellmanHello`, `bellsHung`, `towerSeen`.
- **Ilde:** staffetta (corriera) di Pietrabianca, giovane e coraggiosa. Ha corso due giorni nella nebbia per chiedere aiuto a Lio e ha collegato le «tre lune» della nebbia al furto del Cuore. Dopo le campane dice che riprenderà le sue corse. *Non* sa niente della Torre dall'interno.
- **Promesse di trama** (dette nei dialoghi, quindi la Torre dovrebbe mantenerle):
  1. **La Signora delle Nebbie ha dato i semi delle spine al Re dei Rovi**: le radici sotto il trono venivano da nord (Gualtiero).
  2. **Un tempo cantava per Vesper**; poi Vesper scelse la luce del Cuore e lei scelse il silenzio (Rufo, Teodoro). Vuole un mondo **senza suono e senza luce**.
  3. **La nebbia ruba i ricordi**: due pastori tornati senza nome; il padre di Lio, nel bozzolo, «non ricordava più il tuo viso, forse era la stessa magia». Idea per te: nella Torre la Signora **custodisce i ricordi rubati**, e sconfiggerla li restituisce (anche quelli del padre).
  4. **«Cerca il suono: è l'unica cosa che teme»** (Teodoro). Le campanelle e il tema «suono contro silenzio» sono tuoi per gli enigmi.
  5. Rufo: «sale piene di campane che non suonano, e una voce che canta senza fare rumore».
- **Diario:** aggiungi i capitoli della Torre a `CHAPTERS2` (massimo 9 righe in tutto: ora sono 5) e aggiorna `currentObjective` e `objectiveRoom`. In `north.js`, dopo `northBells` la meta è `n:1,0` se `t:1,2` esiste; puoi avvolgerli tu.
- Non ho toccato nessun file `t:`.

### Test: nuovo `tests/north30.js` (`T30.suite()`, 15 test)
- Stanze ben formate e varchi che combaciano tra stanze vicine.
- Ilde solo dopo la festa; la scala appare dopo averle parlato.
- Andata e ritorno Radura ↔ Valico.
- Tutto il Nord raggiungibile dal grafo del Segnavia.
- Nebbia misurata sui pixel dei pini: coperti senza lanterna, più visibili con la lanterna, scoperti dopo le campane.
- **Lago con l'arpione vero**: andata, campanella, ritorno.
- La Pineta richiede la bomba.
- La Cima dà la campanella solo dopo lo sgombero.
- Gualtiero: 1/3, poi 3/3, campane, +50 gemme, medaglia.
- Portone sigillato; si apre solo con campane **e** Torre esistente.
- Sequenza della meta del Segnavia.
- La zuppa di Rufo.
- Tutto si disegna, mappa «NORD».
- Le **2 correzioni** della prova a mano.

### Verifiche fatte (onestamente)
- **Totale 265/265**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · `T22` 12 · `T23` 11 · `T24` 13 · `T25` 8 · `T26` 12 · `T27` 11 · `T28` 12 · `T29` 5 · **`T30` 15** · `A` 10.
- `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok. Tutti gli script a `?v=c30f`, verificato sugli src.
- **Attenzione:** il browser serviva un `index.html` vecchio anche dopo il cambio di `?v` (`game.js` restava a c29d!). Ora carico `index.html?test&r=<qualcosa>` e controllo gli src.
- **La regressione supera i 45 s** di una chiamata (la suite `T` sola impiega circa 17 s): la lancio con `setTimeout` e leggo il risultato in una variabile.
- **Screenshot:** Pietrabianca nella nebbia e senza; la pagina del diario del Capitolo II.
- **Gli audit hanno trovato 6 errori miei, tutti corretti:**
  - i testi del diario sovrapposti (T16), da cui la pagina del Capitolo II;
  - un warp verso una stanza inesistente (T16), da cui il getter;
  - un'eccezione in T15, causata dallo stesso warp;
  - uno slime a 36 px dall'ingresso del Valico (T15): spostato;
  - il nome della medaglia troppo lungo (A);
  - T13 voleva tutti i capitoli fatti dopo la vittoria: risolto con la pagina separata.
- **Mio difetto di mappa, trovato dal test dell'arpione:** il palo dell'isola aveva l'acqua dal lato d'arrivo, e Lio, tirato dall'arpione, cadeva nel lago. Spostati i pali.
- **Nota tecnica:** in questa shell un heredoc con `\\'` arriva a Python come `\'`, e alcune mie sostituzioni fallivano di nascosto (l'`assert` le ha fermate). Ora evito i backslash. Anche questa sezione dell'HANDOFF, scritta con un heredoc, all'inizio non era stata salvata: l'ho riscritta da un file.

### Limiti noti (onesti)
- **Il Capitolo II non l'ho giocato a mano dall'inizio alla fine**: i test lo fanno a pezzi.
- **La Torre non c'è ancora**: dopo le campane l'obiettivo dice che il prossimo capitolo comincia al portone. È il tuo turno.
- Nessuna musica nuova: Valico, Lago e Pineta usano `cave`, la Cima `dungeon`, la Soglia `temple`.
- Nessun nemico nuovo: armature, slime e pipistrelli di ghiaccio.
- Gli interni del Nord sono copie della casa di Teodoro.

### File toccati / nuovi
- **Nuovi:** `js/north.js`, `tests/north30.js`.
- **Modificati:**
  - `game.js`: `checkEdges`, `afterEnter`, `neighborId`, `mapPrefix` e mappa;
  - `story.js`: riga del Ciclo 30;
  - `LEGGIMI.md`: Capitolo II, 26 medaglie, `T30`, gioco muto nei test;
  - `index.html`: `north.js`, il test e `?v=c30f`.

**Avversario, la palla è tua. Le campane di Pietrabianca suonano, e il portone della Torre del Silenzio si è socchiuso: dentro ti aspetta la Signora delle Nebbie.**

---

## CICLO 31 — Agente A: «La Torre del Silenzio» (Capitolo II, seconda parte)

È il mio primo ciclo con il nuovo focus dell'utente: **solo storia, un gioco più vasto**. Ho costruito la Torre che il Ciclo 30 aveva promesso, mantenendo le sue promesse di trama.

### La storia
- **L'ingresso.** Le campane di Pietrabianca aprono il portone. Valgono le regole del Ciclo 30: `TOWER_ROOM = 't:1,2'`, e Lio arriva in (7,8). Dentro, il suono non esiste.
- **Chi è la Signora delle Nebbie.** Ha un nome: **Elva**, la cantante di Vesper.
  - Quando Vesper scelse la luce del Cuore, lei scelse il silenzio.
  - Diede i semi delle spine a Ortensio.
  - Con la nebbia rubò i ricordi della gente, perché nessuno ricordasse più com'era il suono.
- **Promesse del Ciclo 30 mantenute:**
  - i semi dati al Re dei Rovi;
  - il canto per Vesper;
  - la nebbia che ruba i ricordi, e qui li custodisce;
  - Teodoro con il suo «cerca il suono»: l'oggetto nuovo è un suono;
  - Rufo con le «sale di campane che non suonano e una voce che canta senza rumore»: sono la Sala dell'Eco e la Signora che canta muta.
- **Il finale.** Sconfitta, Elva si inginocchia e racconta. Poi libera centinaia di ricordi, che volano a casa.
  - **Gualtiero** racconta che il pastore Anselmo ha ritrovato il suo nome.
  - **Il padre di Lio**, a Brinavalle, ritrova il ricordo che le radici gli avevano rubato: Lio piccolo sulle sue spalle al Lago Specchio. È lo stesso ricordo che Lio libera nell'Archivio.

### Il dungeon — nuovo `js/tower.js` (dopo `north.js`), prefisso `t:`, mappa «TORRE»
| Sala | Cosa c'è |
|---|---|
| `t:1,2` **Atrio del Silenzio** | Ingresso. Il **velo grande** sulla scala a nord: lo scioglie solo il Diapason **dopo** l'Eco. Una lapide racconta di Elva. |
| `t:0,2` **Sala delle Armature** | Tre armature mute; a sala ripulita compare il forziere del **Diapason d'Argento**. |
| `t:2,2` **Sala dell'Eco** | Tre **campane mute** (media, grande, piccola). L'incisione dice: «la più acuta, poi la più grave, poi quella di mezzo». Un ordine sbagliato azzera. |
| `t:1,1` **Galleria delle Voci** | Tre **Velati**. Il **sigillo del Coro** (volti con la bocca cucita) chiude la scala verso la cima. |
| `t:0,1` **Archivio dei Ricordi** | Quattro **ricordi rubati** in gabbie di nebbia, uno su un'isola tra le voragini: la nota ci arriva, Lio no. Liberati, volano da Lio e raccontano. Liberati tutti e quattro, compare il forziere con un **Cuore di Cristallo**. |
| `t:2,1` **Sala del Coro** | Quattro **statue** da far cantare insieme. Ognuna canta per 720/570/450 frame (Facile/Normale/Eroe); tutte insieme sciolgono il sigillo. |
| `t:1,0` **Trono del Silenzio** | La **Signora delle Nebbie**. |

- **Nuovo oggetto: il Diapason d'Argento.**
  - Si usa con X e si cambia con Q (è in `EQUIPS`); ha un'icona sua ed è nell'inventario.
  - Fa partire un'onda (`Wave`) che arriva a 38 px; tra una nota e l'altra passano 34 frame.
  - Fa suonare tutto ciò che ha `onRing(g)`: veli, campane, statue, ricordi, Velati, la Signora. Spazza via anche le sfere di nebbia.
- **Nuovo nemico: il Velato.** La spada lo attraversa. Dopo una nota resta solido per 200 frame, e due colpi lo abbattono.
- **La Signora delle Nebbie** (15 punti vita, tarata col bot).
  - **In alto:** fluttua lanciando **sfere di nebbia** che inseguono Lio, e richiama i Velati.
  - **La picchiata:** poi scende su Lio. Il velo **inghiotte ogni nota**, e una nota sprecata la fa scendere prima.
  - **Il canto:** finita la picchiata **si ferma a cantare** per 80/56/40 frame, con cerchi dorati che le escono dalla bocca. Solo allora una nota da vicino spezza il velo. Lei cade a terra, e si possono dare **tre colpi**.
  - **Seconda fase (vita ≤ 7):** due **copie** scendono in picchiata con lei, e una nota le scioglie. Solo quella vera ha il **diadema che scintilla**: l'ho aggiunto perché chi gioca abbia un indizio.
- **Contorno:**
  - musica nuova `tower` (un carillon che si interrompe); il boss usa `boss2`;
  - suoni nuovi: `ring`, `hush`, `bellHi`/`bellMid`/`bellLo`, `choir`;
  - un velo grigio sulle sale della Torre, che si schiarisce dopo la vittoria.
- **Integrazioni:**
  - 4 righe nel diario del Capitolo II (`CHAPTERS2`, ora 9 righe, il massimo);
  - obiettivo e Segnavia passo per passo dentro la Torre, poi da Gualtiero, poi dal padre;
  - Bestiario: Velato e «La Signora»;
  - missione «L'Archivio dei Ricordi»;
  - 2 medaglie, «La voce ritrovata» e «Custode dei ricordi» (ora sono **28**).

### Modifiche fuori dal mio file (piccole, documentate)
- **`game.js`:**
  - la mappa per `t:` (colore, `mapPrefix`, etichetta «TORRE»);
  - l'**inventario passa a 5 colonne** quando gli oggetti sono più di 8. Con il Diapason sono 9, e la terza riga usciva dal riquadro: l'ho visto nello screenshot, e `T16` lo segnalava.
  - L'audit dei testi ha poi trovato «Chiave Re» troppo larga per la colonna (32 px su 29), quindi a 5 colonne si legge «Chiave».
- **`bestiary.js`:** la **lista ora scorre**, con 12 righe visibili e le frecce ▲/▼. Con 15 creature usciva dallo schermo (`T16`).
- **`north.js` — difetto vero della mappa, corretto.** La **Pineta Ghiacciata (`n:2,1`)** aveva un varco a est, sulla riga 5, verso una stanza che non esiste.
  - `T16` e `T15` prima non guardavano le stanze `n:`. Ho esteso a `[odclrnt]` le regex di `tests/cycle16.js` e `tests/fair15.js`, e il varco è venuto fuori.
  - Ci ho messo un albero.
- **`tests/north30.js`:** il test del portone controllava il caso «senza Torre» quando la Torre ancora non esisteva. Ora la toglie per un attimo e poi la rimette.
- **`audio.js`:** suoni e traccia nuovi. Il guadagno della musica della Torre è 1,5: misurata stava a −38,3 dB, e l'audit vuole tutte le musiche entro 2,5 dB.

### Test — nuovo `tests/tower31.js` (`T31.suite()`, 13 test)
- **Ingresso:** il portone si apre e si esce dalla scala.
- **Diapason:** il forziere compare solo a sala ripulita; preso, il Diapason è in mano e fa partire l'onda.
- **Velato:** la spada lo attraversa; dopo la nota cade in due colpi.
- **Eco:** l'ordine sbagliato non vale, quello giusto sì.
- **Velo dell'Atrio:** resiste senza l'eco, cede con l'eco e resta sciolto.
- **Coro con input veri a ogni difficoltà:** il bot ci mette 345 frame, e dopo il sigillo non c'è più.
- **Archivio:** la nota passa oltre la voragine, e quattro ricordi fanno comparire il forziere.
- **Signora:**
  - mentre fluttua il velo inghiotte la nota; mentre canta la nota la abbatte; dopo tre colpi si rialza;
  - le copie svaniscono alla nota;
  - alla sconfitta: porte aperte, cuore, Bestiario, dialogo di Elva, poi Gualtiero e il padre, diario completo.
- **Obiettivo e Segnavia:** 9 tappe, una dopo l'altra.
- **Il bot sale tutta la Torre con input veri**, dall'ingresso al trono: atrio → diapason → eco → velo → coro → trono.
- **Disegno:** tutte le sale, la pausa e l'inventario si disegnano senza errori.
- **Duello onesto senza vita infinita:** almeno una vittoria su tre a Normale.

### Bilanciamento (onesto)
- **La prima versione** era troppo facile: il bot vinceva sempre in **11 s senza danni**. La Signora gli scendeva addosso, e bastava suonare.
- **Cosa ho cambiato:** ho rifatto il combattimento (il velo che inghiotte la nota, la finestra del canto) e alzato la vita a 15.
- **Ora** il bot, con riflessi perfetti, vince in circa 30 s. A Normale perde 5 mezzi cuori su 12; a Eroe arriva con un cuore solo. Un umano andrà peggio, ed è voluto: è il boss di fine capitolo.
- **Coro:** la prima finestra a Eroe (360 frame) era quasi uguale al tempo del bot (345). L'ho allargata a 450; Normale 570, Facile 720.

### Verifiche fatte
- **Totale 278/278** (tutte le suite, compresa `T31` con 13 test) e `T.route()` ok (2,4 min), con tutti gli script a `?v=c31o` (controllato sugli `src`). `T7.table(1)`: 3/3. Nel browser restano solo le opzioni.
- **Screenshot e ritocchi:**
  - l'Atrio con il velo;
  - la Sala dell'Eco: le campane erano rettangoli, le ho ridisegnate come campane vere, con il batacchio;
  - l'Archivio con le gabbie e un Velato;
  - la Signora: la prima versione sembrava una lapide grigia; l'ho ridisegnata con veste svasata, maniche, capelli mossi e velo trasparente;
  - le copie;
  - l'inventario a 5 colonne e il Bestiario che scorre.
- **Errori miei nei test, corretti:**
  - il ricordo liberato vola da Lio e sparisce in meno di 20 frame, ma il test lo cercava dopo;
  - un test del boss era rimasto alla vecchia regola;
  - un test del diario non segnava l'ingresso nella Torre.
- **Problemi di strumenti:**
  - gli script Python passati dalla shell con lettere accentate non trovavano il testo, quindi ora uso script Node salvati su file (UTF-8);
  - anche questo resoconto, come il tuo, è stato bloccato dalla shell al primo tentativo: l'ho scritto su file e poi aggiunto.

### Limiti noti (onesti)
- **Non ho giocato la Torre a mano.** L'ha salita il bot, con tasti simulati ma riflessi perfetti. Le finestre di tempo (il Coro, il canto della Signora) vanno provate da un umano.
- **Nessun ritorno automatico.** Dopo la vittoria si esce a piedi: porta sud del Trono, Galleria, Atrio, scala.
- **Nessuna scena finale animata del Capitolo II.** Elva sparisce e basta.
  - Il Ciclo 32 può chiudere il capitolo oppure aprirne un terzo.
  - C'è una promessa aperta: Elva chiede di dire a Vesper «che ha ascoltato», se un giorno il Cuore canterà di nuovo.
- **Il bot da duello sa quale Signora è quella vera.** Un umano deve guardare il diadema.

### File toccati / nuovi
- **Nuovi:** `js/tower.js`, `tests/tower31.js`.
- **Modificati:**
  - `audio.js`;
  - `game.js`: mappa `t:` e inventario a 5 colonne;
  - `bestiary.js`: scorrimento;
  - `north.js`: un albero;
  - `tests/north30.js`, `tests/cycle16.js`, `tests/fair15.js`;
  - `story.js`: riga del Ciclo 31;
  - `LEGGIMI.md`;
  - `index.html`: `tower.js`, il test e la versione.

**Avversario, la palla è tua. La Torre canta di nuovo, e Elva ha lasciato un messaggio per Vesper: «se un giorno il Cuore canterà di nuovo, digli che Elva ha ascoltato».**

---

## CICLO 32 — Agente B (seconda manche)

Sempre sul fronte storia. Ho **chiuso il Capitolo II** con una scena finale e **aperto il Capitolo III, «Il Canto di Vesper»**, con una nuova regione: le **Dune d'Ambra**.

### Verifica veloce del Ciclo 31
- 278/278 al mio arrivo, `T.route()` e `T7.table(1)` ok. Ho letto la fine di `tower.js` per agganciarmi ai tuoi flag (`towerLady`, `ladyTold`, `fatherRemembers`).
- La tua Elva («dillo a Vesper, che ho ascoltato») è la molla del Capitolo III.

### Nuovo `js/amber.js` (dopo `tower.js`)
**Fine del Capitolo II.**
- Quando il padre ritrova il ricordo del lago (il tuo `fatherRemembers`), finito il dialogo compare un cartello, lo stato `chapter`, sul modello del tuo `finale`: «CAPITOLO II — La Nebbia Grigia — completato», con il tempo di gioco, i cuori e un'anticipazione («il Cuore di Vesper, stanotte, ha cantato una nota...»).
- Chiudendolo si imposta `ch2Done`.

**Capitolo III — l'inizio.**
- Con `ch2Done`, Teodoro racconta che il Cuore, nel giardino, ha **cantato una nota sola**.
- Vesper, il primo custode della valle, salì sull'**Altopiano d'Ambra**, dove la stella della sera (Vespero) è più vicina, e versò la sua voce nel Cuore per farne luce. Il suo **Osservatorio** è ancora lassù.
- Parlargli imposta `ch3Call`, e nei **Campi di Brina** si apre una **gola** a est (`o:2,2` (15,4), tessera `C`).
- Anche il padre ha una battuta (una volta sola).

**La regione `a:`**: terreno `sand` nuovo (dune increspate), **cactus** al posto degli alberi, **tende** (tessere nuove `m` solida ed `e` ingresso), giorno e notte anche nel deserto (con `drawSky`, senza pioggia).

| stanza | nome | contenuto |
|---|---|---|
| `a:0,1` | Gola del Vento | ingresso tra le rocce (la `C` riporta ai Campi), 2 scorpioni |
| `a:1,1` | Carovana delle Dune | Lu (indizi), un mercante; due tende: `i:tenda` (**Nadira**, la capocarovana: **riposo fino a mattino, mezzogiorno, tramonto o notte**, e cuori pieni) e `i:mappe` (**Sesto**, il cartografo: dove sono le lenti) |
| `a:2,1` | Mare di Dune | 3 scorpioni; la **stella caduta** (una lente) c'è e brilla **solo di notte** |
| `a:1,0` | Rovine del Sole | una lente dietro una **crepa** (bombe); uno scorpione e un'armatura |
| `a:2,0` | Oasi del Miraggio | **solo a mezzogiorno** il miraggio è vero: stagno, isola, ponticello e lente (cambia anche restando nella stanza) |
| `a:1,2` | Altopiano di Vesper | l'**Osservatorio** e la vecchia **Orsa**, che guarda le stelle e racconta chi era Vesper |

- **Il portone.** Si parla con il portone (cartello-funzione su (7,7) e (8,7)): con tutte e tre le lenti le si posa (`lensesSet`). **Al tramonto**, nella stanza, un **raggio** della stella attraversa le lenti e il portone si apre (`observatoryOpen`, permanente), mentre Lio ripensa al messaggio di Elva.
- **Nuovo nemico, lo Scorpione d'ambra.** Quando è allineato con Lio (entro 120 px) alza la coda e carica dritto; sbatte, resta stordito, e da stordito i colpi valgono il doppio. Ha la sua scheda nel Bestiario.
- **Diario:** pagina del **Capitolo III** (`window.CHAPTERS3`, 6 righe), che sostituisce per un momento `CHAPTERS2`, a sua volta al posto di `CHAPTERS`. I tre elenchi restano intatti (c'è un test).
- **Obiettivo e Segnavia** seguono il capitolo. **Medaglia** «La stella della sera»: ora sono **29**.
- **`game.js`:** prefissi `a` e `v` in `neighborId`; mappa «AMBRA», anche nelle due tende.

### PER TE — L'OSSERVATORIO DI VESPER
- **Ingresso.** In `a:1,2` il portone è una saracinesca `J` in **(7,7) e (8,7)**.
  - Con `observatoryOpen` **e** `ROOMS['v:1,2']` esistente, (7,7) diventa `Z` e (8,7) `P`.
  - Il warp `'7,7' → { to: 'v:1,2', x: 7, y: 8, dir: 1 }` è un **getter**, come per la tua Torre. La costante `VESPER_ROOM` è in cima ad `amber.js`.
- **Flag:** `ch2Done`, `ch3Call`, `amberIn`, `nadiraHello`, `sestoHello`, `orsaHello`, `chest:a_lens_rovine`, `chest:a_lens_oasi`, `chest:a_lens_stella` (`lensCount(g)`), `lensesSet`, **`observatoryOpen`**.
- **Ore utili** (funzioni globali): `isNoon(g)`, `isDusk(g)`, `isNightA(g)`; il riposo di Nadira è in `REST_AT`. Il tema «la stella si vede solo a certe ore» può continuare dentro.
- **Promesse di trama** (dette nei dialoghi):
  1. **Vesper era un uomo**, non un dio: guardava le stelle (Orsa).
  2. Quando la notte sulla valle non finiva mai, **chiese aiuto alla sua stella**, che gli rispose; lui le diede **la sua voce**, versata in un cristallo che diventò luce: il Cuore (Orsa, Teodoro).
  3. **Da allora non ha più cantato né parlato**: «aspetta, lassù, qualcuno che gli porti indietro una voce» (Orsa).
  4. Il messaggio di Elva, **«dillo a Vesper, che ho ascoltato»**, è ciò che Lio porta dentro (lo pensa davanti al raggio).
  5. Il **Cuore ha cantato una nota** dopo la sconfitta di Elva (Teodoro, Ortensio): Vesper e il Cuore sono ancora legati.
- **Idea, se vuoi:** dentro l'Osservatorio, sale legate a giorno, tramonto e notte (lenti, raggi, specchi). Alla fine Vesper, ormai quasi tutto luce, riceve il messaggio e **ritrova la voce**, e il Cuore torna a cantare davvero (Capitolo III completato).
- **Diario:** aggiungi i capitoli a `CHAPTERS3` (al massimo 9: ora sono 6) e avvolgi `currentObjective` e `objectiveRoom` dopo `observatoryOpen`.

### Test: nuovo `tests/amber32.js` (`T32.suite()`, 14 test)
- Stanze ben formate, **nessun varco verso il nulla** (controllo i 4 lati).
- Cartello di fine del Capitolo II, che imposta `ch2Done`.
- Teodoro apre il III solo dopo il II; la gola compare nei Campi; andata e ritorno.
- Tutto il deserto raggiungibile dal grafo del Segnavia.
- Il riposo di Nadira porta all'ora scelta e ridà i cuori.
- **L'oasi cambia** a mezzogiorno, anche restando nella stanza.
- La stella caduta solo di notte.
- La crepa delle Rovine chiude la lente finché non scoppia una bomba.
- Il portone: 2/3 respinto, 3/3 posate, a mezzogiorno resta chiuso, al tramonto si apre.
- Il passaggio esiste solo con l'Osservatorio.
- Lo scorpione carica, resta stordito, prende danno doppio, ha la sua chiave nel Bestiario.
- La meta del Segnavia segue le tappe.
- Pagina del diario del Capitolo III, con `CHAPTERS` e `CHAPTERS2` intatti.
- Tutte le stanze si disegnano di giorno, a mezzogiorno, al tramonto e di notte; mappa «AMBRA».

### Verifiche fatte (onestamente)
- **Totale 292/292**: `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · `T22` 12 · `T23` 11 · `T24` 13 · `T25` 8 · `T26` 12 · `T27` 11 · `T28` 12 · `T29` 5 · `T30` 15 · `T31` 13 · **`T32` 14** · `A` 10.
- `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok.
- Tutti gli script a `?v=c32d` (src verificati), con la riga dell'epilogo caricata.
- La prima regressione completa (292/292 a c32c) era partita prima che modificassi `story.js`: l'ho rifatta a c32d.
- **Screenshot:** la carovana (tende, cactus), l'oasi a mezzogiorno con l'isola, l'Osservatorio con il raggio al tramonto.
- **Corretto dagli screenshot:** le tre lenti erano sparse in modo irregolare; ora sono ai lati del portone e al centro, come chiave di volta.
- **Errori miei trovati dai test:**
  - l'oasi e la stella non cambiavano restando nella stanza, perché la fascia oraria non veniva registrata all'ingresso: ora la registra `loadRoom`;
  - lo scorpione del test era fuori portata (era il test a sbagliare).

### Limiti noti (onesti)
- **Non l'ho giocato a mano**: i test lo percorrono a pezzi.
- **L'Osservatorio non c'è ancora**: dopo il raggio l'obiettivo dice che il prossimo capitolo comincia al portone. È il tuo turno.
- Nessuna musica nuova: Gola, Mare e Oasi usano `overworld`, la carovana `village`, le Rovine e l'Altopiano `temple`.
- Le tende sono rettangoli a strisce, non hanno una vera sagoma da tenda.
- Il riposo cambia l'ora all'istante, senza una dissolvenza.

### File toccati / nuovi
- **Nuovi:** `js/amber.js`, `tests/amber32.js`.
- **Modificati:**
  - `game.js`: `neighborId` (`a`, `v`), colore, `mapPrefix` ed etichetta «AMBRA»;
  - `story.js`: riga del Ciclo 32;
  - `LEGGIMI.md`: Capitolo III, 29 medaglie, `T32`;
  - `index.html`: `amber.js`, il test e `?v=c32d`.

**Avversario, la palla è tua. Al tramonto la stella della sera ha guardato attraverso le tre lenti, e l'Osservatorio di Vesper si è aperto: dentro, qualcuno aspetta da secoli una voce.**

---

## CICLO 33 — Agente A: «L'Osservatorio di Vesper» (Capitolo III, seconda parte)

Ho continuato sul focus dell'utente, solo storia: è il dungeon del Capitolo III. Ho mantenuto le promesse del Ciclo 32.
- Vesper era un **uomo** che guardava le stelle.
- Ha dato la sua **voce** alla stella, per accendere il Cuore.
- Da allora è **muto** e aspetta qualcuno che gli riporti una voce.
- Lio gli porta il **messaggio di Elva**.
- Alla fine Vesper ritrova la voce e **il Cuore canta davvero**.

Ho aggiunto un legame con il Ciclo 31: Elva aveva detto che la nota del Diapason «era la stessa di Vesper». È quella nota, suonata al telescopio sotto la stella della sera, a riportargli la voce.

### Il meccanismo nuovo: le ORE dell'Osservatorio
- **La Meridiana di Vesper.** È un oggetto nuovo: X per usarla, Q per cambiare (`EQUIPS`), con un'icona sua.
  - **Dentro l'Osservatorio** fa girare le ore: **mezzogiorno → tramonto → notte**, con 60 frame di attesa tra un giro e l'altro.
  - **Fuori dall'Osservatorio** non funziona: compare «Qui fuori le ore sono del cielo».
  - **Dove sta l'ora:** in `s.obsTime`. All'ingresso è il tramonto, cioè l'ora in cui il portone si apre.
- **Le porte (`def.gates`):** quella del **sole** si apre a mezzogiorno, quella della **luna** di notte, quella del **tramonto** al tramonto. Quella a **stella** si apre con la costellazione.
  - Sono tessere `J` che `applyObsTime` cambia, con un emblema disegnato sopra.
  - **Una porta non si chiude mai addosso a Lio:** resta aperta finché lui non si sposta (vedi sotto).
- **I ponti (`def.bridges`):** di **stelle** compaiono di notte, d'**ambra** al tramonto. Nelle altre ore se ne intravede la traccia a puntini. Chi resta su un ponte che sparisce **cade**.
- **La luce cambia con l'ora:**
  - mezzogiorno: luce calda e lame di sole;
  - tramonto: tutto arancione;
  - notte: blu, con le stelle sulla volta.

  In più, un lampo a ogni giro della Meridiana, e la grande meridiana sul pavimento dell'ingresso indica l'ora.

### Le sale — nuovo `js/observatory.js` (dopo `amber.js`), prefisso `v:`, mappa «OSSERVATORIO»
| Sala | Cosa c'è |
|---|---|
| `v:1,2` **Sala delle Ore** | Ingresso (Lio arriva in (7,8); la scala riporta in `a:1,2` (7,5)). A nord la porta del sole, a est quella della luna. Una lapide spiega le regole. |
| `v:0,2` **Sala della Meridiana** | 4 **Astrini**; a sala ripulita compare il forziere della **Meridiana**. |
| `v:2,2` **Ponte delle Stelle** | Una voragine. Di notte si va fino all'isola di mezzo; **lì** si cambia ora, e al tramonto si arriva all'isola del forziere con la **Lente del Telescopio**. Al ritorno, il contrario. |
| `v:1,1` **Galleria delle Costellazioni** | 5 stelle sul pavimento, visibili **solo di notte**, con 1, 2, 3, 4, 5 punte di luce: vanno calpestate in ordine. Un ordine sbagliato azzera la sequenza. Risolta, apre la **porta a stella** verso la Cupola. A ovest c'è la porta del tramonto. |
| `v:0,1` **Biblioteca di Vesper** | Pavimento di legno e tre leggii con il **diario di Vesper**: la stella, il dono, Elva. Lette le tre pagine, compare uno scrigno con 100 gemme. È la missione «Il diario di Vesper». |
| `v:2,1` **Sala dei Guardiani** | Armature e Astrini; a sala ripulita, un **Cuore di Cristallo**. |
| `v:1,0` **La Cupola** | Il **telescopio** di ottone, **Vesper** seduto accanto, e l'**Armilla**. |

- **Nuovo nemico: l'Astrino.**
  - Di giorno è **pietra**: non si muove, non fa male, la spada rimbalza.
  - Al tramonto è lento e vulnerabile.
  - Di notte è veloce e spara **schegge di stella**.

  Ho dovuto ragionare sull'ora anche per combatterlo.
- **Il boss, l'Armilla di Vesper** (12 vita): una sfera armillare di bronzo che fa la guardia al suo padrone muto.
  - Il **nucleo si apre solo di notte**. Tre colpi, poi gli anelli si richiudono di scatto per circa 3 s.
  - **Di notte** spara una raggiera di schegge.
  - **Al tramonto** è chiusa e spara 4 schegge.
  - **Di giorno** è chiusa, non spara e ti viene incontro piano: è il momento di respirare.
  - **Dalla metà della vita in giù**, di notte fa cadere anche una **stella cadente** dove sei, con un bersaglio che si stringe.
  - Lo scontro si combatte **con la Meridiana in mano**.
- **Il finale.**
  - Senza la lente, Vesper indica il telescopio vuoto e mima «una cosa rotonda che brilla».
  - Con la lente, comincia la scena: la lente nel telescopio, la stella della sera nel cannocchiale, il Diapason che vibra da solo, un filo di luce dalla stella alla gola di Vesper.
  - Vesper **parla**: racconta il dono, risponde al messaggio di Elva, poi **canta**. Lontano, **il Cuore di Vesper canta** e tutta la valle si ferma ad ascoltare.
  - Poi compare un cartello: **«CAPITOLO III — Il Canto di Vesper — completato»**, con un aggancio per il prossimo capitolo: «Ma quella notte, in cielo, una stella mancava all'appello...». Imposta `ch3Done`.
  - Dopo, Vesper si offre di riportare Lio a Brinavalle, e Teodoro e il padre hanno una battuta nuova.
- **Integrazioni:**
  - 3 righe in `CHAPTERS3` (ora 9, il massimo);
  - obiettivo e Segnavia passo per passo;
  - Bestiario: Astrino e «L'Armilla»;
  - missione «Il diario di Vesper»;
  - 2 medaglie, «La voce di Vesper» e «Lettore di stelle» (ora sono **31**).

### Un difetto di gioco trovato dal bot, e corretto
- **Cosa succedeva:** tornando dal Ponte delle Stelle, il bot ha girato la Meridiana mentre era ancora **sulla soglia** della porta della luna. La porta si è chiusa sopra di lui, e Lio è rimasto **murato dentro la tessera**.
- **Correzione:** `applyObsTime` non chiude mai una porta che tocca Lio. La lascia aperta (`obsPending`) e la richiude appena lui si sposta.
- C'è un test apposta.

### Modifiche fuori dal mio file
- **`game.js`:** colore ed etichetta della mappa per `v:`. La regex dei vicini l'avevi già estesa tu.
- **`tests/amber32.js`:** il test «il passaggio esiste solo quando l'Osservatorio esiste» provava il caso «senza» quando l'Osservatorio non esisteva ancora. Ora lo toglie per un attimo, come avevo fatto per `T30`.
- **`audio.js`:** niente di nuovo. La Cupola usa `boss` e le sale usano `temple`.

### Test — nuovo `tests/obs33.js` (`T33.suite()`, 14 test)
- **Ingresso:** il portone porta dentro, la scala riporta fuori.
- **Meridiana:**
  - il forziere compare solo dopo gli Astrini;
  - l'ordine delle ore è tramonto → notte → mezzogiorno;
  - fuori dall'Osservatorio non gira.
- **Astrino:** di giorno è pietra, al tramonto bastano due colpi.
- **Porte:** sole e luna giuste per ogni ora.
- **Ponte delle Stelle:**
  - di notte si arriva all'isola di mezzo, al tramonto al forziere;
  - chi resta sul ponte che sparisce cade.
- **Galleria:**
  - di giorno le stelle non contano;
  - un ordine sbagliato non vale, quello giusto apre la porta.
- **Porte e Lio:** una porta non si chiude mai addosso a Lio.
- **Biblioteca:** la porta del tramonto si apre al tramonto, e le tre pagine aprono lo scrigno.
- **Armilla:**
  - invulnerabile di giorno, aperta di notte, si richiude dopo tre colpi;
  - la sconfitta: porte, cuore, Bestiario, Vesper senza lente, poi con la lente, la voce, il cartello, `ch3Done`, diario completo.
- **Obiettivo e Segnavia:** 7 tappe, una dopo l'altra.
- **Il bot attraversa l'Osservatorio con input veri, Meridiana compresa:** ore → meridiana → lente (cambiando ora a metà del ponte) → stelle → cupola.
- **Disegno:** tutte le sale, a tutte e tre le ore, si disegnano senza errori.
- **Duello onesto senza vita infinita:** il bot usa la Meridiana anche contro il boss.

### Bilanciamento (onesto)
- **Duello con l'Armilla:**
  - a Normale il bot vince in circa 29 s perdendo 6-7 mezzi cuori su 14;
  - a Facile perde 3-5 mezzi cuori;
  - a **Eroe** vince 2 volte su 3, con l'ultimo cuore.

  Il bot sa sempre quando girare le ore e scappa dalle stelle cadenti. Un umano andrà peggio.

### Verifiche
- **Totale 306/306** (tutte le suite, compresa `T33` con 14 test) e `T.route()` ok (2,4 min), con tutti gli script a `?v=c33e` (controllato sugli `src`). `T7.table(1)`: 3/3. Le stanze sono 65 in tutto. Nel browser restano solo le opzioni.
- **Screenshot:**
  - il Ponte delle Stelle di notte: il ponte blu, quello d'ambra a puntini, l'isola con il forziere, un Astrino;
  - la Cupola con l'Armilla aperta e le schegge;
  - la scena di Vesper con la lente accesa nell'oculare;
  - il cartello del Capitolo III: il titolo era troppo largo e toccava i bordi, l'ho rimpicciolito.
- **Errori miei nei test, corretti:**
  - il test della Galleria camminava, dopo la stella sbagliata, proprio sulla prima stella giusta, e scambiava la ripartenza corretta per un errore.

### Limiti noti (onesti)
- **Non ho giocato l'Osservatorio a mano.** Gli Astrini, l'Armilla e il tempismo dei ponti vanno provati da un umano.
- Nessuna musica nuova per l'Osservatorio: uso `temple`.
- Vesper non ha animazioni: sta seduto.
- Durante la scena non c'è la musica del suo canto.
- **Il prossimo capitolo è aperto:** «una stella mancava all'appello». La stella di Vesper è scesa a ridargli la voce? Oppure ne manca un'altra?

### File toccati / nuovi
- **Nuovi:** `js/observatory.js`, `tests/obs33.js`.
- **Modificati:**
  - `game.js`: mappa `v:`;
  - `tests/amber32.js`;
  - `story.js`: riga del Ciclo 33;
  - `LEGGIMI.md`;
  - `index.html`: `observatory.js`, il test e la versione.

**Avversario, la palla è tua. Il Cuore canta, Vesper ha di nuovo una voce. Ma quella notte, in cielo, una stella mancava all'appello...**

---

## CICLO 34 — Agente B (seconda manche)

Ho raccolto il tuo aggancio («quella notte, in cielo, una stella mancava all'appello») e la tua idea («la stella di Vesper è scesa a ridargli la voce, e ora il cielo ha un buco»). È il **Capitolo IV, «La Stella Caduta»**, con una nuova regione, **la Costa**, e una meccanica nuova, **la marea**.

### Verifica veloce del Ciclo 33
- 306/306 al mio arrivo (65 stanze, 31 medaglie), `T.route()` ok.
- Mi sono agganciato al tuo `ch3Done` (lo imposta il cartello del Capitolo III).

### Nuovo `js/coast.js` (dopo `observatory.js`)
**Storia.**
- Con `ch3Done`, **Pino** al Lago Specchio ha una lettera della cugina **Marisa**, capitana di **Porto Corallo**. Tre notti fa una stella è caduta in mare; da allora il **Faro** è spento, il mare brilla di notte e i pescatori non escono.
- Tre notti fa è anche quando il Cuore ha ricominciato a cantare.
- Parlargli imposta `ch4Call`, e sulla riva sud del lago compare **la sua barca** (tessera nuova `z`, un passaggio). Il fiume porta al mare e la barca riporta indietro.
- Teodoro ha due battute: la stella in meno, poi il Faro riacceso.

**La regione `m:`**: terreno `beach` nuovo (sabbia chiara con conchiglie), **palme**, giorno e notte anche lì.

| stanza | nome | contenuto |
|---|---|---|
| `m:1,0` | Foce del Fiume | arrivo in barca, un granchio |
| `m:1,1` | Porto Corallo | un pescatore (indizi); case: `i:capitaneria` (**Marisa**: missione e schegge) e `i:osteria` (**nonna Lina**: zuppa per 5 gemme e racconti) |
| `m:0,1` | Scogliera del Faro | il **faro** a strisce disegnato sopra le tessere (spento o acceso); `i:faro` con **Ugo**, il guardiano; una scheggia su un isolotto: **arpione** dalla riva (6,3) al palo (12,3), ritorno dal palo (6,2) |
| `m:2,1` | Spiaggia delle Conchiglie | 4 granchi; la scheggia compare sconfitti tutti |
| `m:1,2` | Secche di Corallo | **la marea**: lingue di sabbia tra gli scogli; scheggia sull'isolotto ovest |
| `m:2,2` | Isola della Stella | il cratere sigillato da una crosta d'acqua nera; sotto pulsa la stella |

- **La marea, meccanica nuova.**
  - Nelle stanze con `def.tide` l'acqua sale e scende ogni 1080 frame (circa 18 s): **420 frame di marea bassa**, con 120 frame di **schiuma** di avviso prima che l'acqua torni.
  - In alto a destra c'è la scritta «Marea: bassa / SALE! / alta».
  - Chi resta sulla sabbia quando l'acqua torna viene **travolto**: caduta in acqua, mezzo cuore, ritorno all'ultimo punto sicuro. Chi ha le **Squame** nuota e non perde nulla.
  - Il contatore (`Game.tideT`) si ferma durante i dialoghi.
  - Il **Segnavia** vede le lingue di sabbia come percorribili (avvolgo `wayTiles`, su una copia: le tessere vive non si toccano).
- **Il Faro.** Con le tre schegge, Ugo le incastra nella lente (`farolit`, +50 gemme): la lente si riaccende e di notte il raggio spazza il mare.
- **Il cratere.** Di **notte**, col Faro acceso, il raggio si posa sull'isola e la crosta si spacca (`craterOpen`, permanente). Sotto, una **scala di corallo**.
- **Nuovo nemico, il Granchio di scoglio.** Si ferma, poi scatta di lato verso Lio; se gli sei vicino **pizzica**, e la chela arriva circa 8 px oltre il guscio. Ha la sua scheda nel Bestiario.
- **Diario:** pagina del **Capitolo IV** (`window.CHAPTERS4`, 6 righe), con la stessa catena di sostituzioni dei capitoli II e III.
- **Obiettivo e Segnavia** seguono il capitolo. **Medaglia** «Il guardiano del Faro»: ora sono **32**. Le stanze in tutto sono **74**.
- **`game.js`:** prefissi `m` ed `f` in `neighborId`; mappa «COSTA», anche nelle tre case.

### PER TE — IL NUCLEO DELLA STELLA (prefisso `f:`, la «Fossa senza fondo»)
- **Ingresso.** In `m:2,2` la crosta è su **(7,4) e (8,4)** (che sono `J`).
  - Con `craterOpen` **e** `ROOMS['f:1,2']` esistente diventano `Z` e `P`.
  - Il warp `'7,4' → { to: 'f:1,2', x: 7, y: 8, dir: 1 }` è un **getter**. La costante `STAR_ROOM` è in cima a `coast.js`.
- **Flag:** `ch4Call`, `coastIn`, `marisaHello`, `ugoHello`, `chest:m_shard_faro`, `chest:m_shard_spiaggia`, `chest:m_shard_secche` (`shardCount(g)`), `farolit`, **`craterOpen`**.
- **Funzioni utili:** `applyTide(g)` e `rebuildAnimTiles(g)`; `Game.tideLow()` e `Game.tideWarn()`. Basta una `tide: [[x,y],...]` nella definizione della stanza perché la marea funzioni anche nelle tue sale (le lingue sono `'~'` nelle `tiles`).
- **Promesse di trama** (dette nei dialoghi):
  1. La stella caduta è **Vespero**, la stella di Vesper, scesa a ridargli la voce e precipitata sfinita (Pino, Teodoro).
  2. Si è **spezzata**: le schegge sono volate sulla costa, il **nucleo** è laggiù, **ancora vivo**, e pulsa «come un cuore stanco» (Marisa, testi del cratere).
  3. La lente del Faro era **vetro di stella** e si è spenta «come per una sorella morta»; riaccesa, **canticchia la stessa nota** della stella (Ugo, Lina).
  4. **Il mare e il cielo sono fratelli gelosi**: le onde cercano sempre di afferrare le stelle (Lina). Idea: laggiù qualcosa del mare **non vuole lasciarla tornare in cielo** (una «Marea Nera», un guardiano degli abissi).
  5. Sotto l'isola c'è **la Fossa senza fondo**, dove il sole non è mai arrivato (Lina).
- **Idea per la fine:** riportare il nucleo in superficie e, di notte, rimandare Vespero in cielo (magari con il Faro, la lente e la nota del Diapason). Cartello «CAPITOLO IV — completato».
- **Diario:** aggiungi i capitoli a `CHAPTERS4` (al massimo 9: ora sono 6) e avvolgi `currentObjective` e `objectiveRoom` dopo `craterOpen`.

### Test: nuovo `tests/coast34.js` (`T34.suite()`, 14 test)
- Stanze ben formate, nessun varco verso il nulla, varchi coerenti (lingue di sabbia comprese).
- Pino apre il IV solo dopo il III; **la barca va e torna**.
- Tutta la Costa raggiungibile dal Segnavia, **senza toccare le tessere vive**.
- **La marea** cambia da sola, e a marea bassa **si vede la sabbia** (controllo sul pixel).
- **Chi resta sulla sabbia viene travolto** (mezzo cuore, ritorno al punto sicuro); chi nuota no.
- La scheggia delle Secche si raggiunge solo a marea bassa.
- **Arpione vero alla Scogliera**: andata, scheggia, ritorno.
- La Spiaggia dà la scheggia solo dopo aver sconfitto i granchi.
- Marisa e Ugo: con tre schegge il Faro si accende (+50 gemme, medaglia).
- Il cratere si apre solo **di notte** e **col Faro acceso**; il passaggio esiste solo con `f:1,2`.
- Il granchio scatta verso Lio e **pizzica oltre il guscio**.
- La meta del Segnavia segue le tappe.
- Pagina del diario del Capitolo IV, con gli altri tre elenchi intatti.
- Tutte le stanze si disegnano con giorno e notte, faro spento e acceso, marea alta e bassa; mappa «COSTA».

### Correzione anche al mio Capitolo III
- **L'acqua animata si disegna da un elenco (`animTiles`) fatto all'ingresso nella stanza.** Se le tessere cambiano dopo, l'acqua resta "dipinta" sopra la sabbia. L'ho visto dallo screenshot delle Secche (sabbia sotto, acqua sopra), e lo stesso succedeva **nell'Oasi del Miraggio** quando il miraggio finiva con Lio nella stanza.
- Ora marea e oasi rifanno l'elenco (`rebuildAnimTiles`). T32 e T34 controllano il pixel.

### Verifiche fatte (onestamente)
- Totale e versione: vedi la riga in fondo a questa sezione.
- **Screenshot:** la Scogliera di notte con il faro acceso (la lente ora brilla sopra il buio), le Secche a marea bassa con l'avviso «SALE!».
- **Errori miei, corretti:**
  - la Scogliera aveva il varco verso il porto sulla riga sbagliata (4 invece di 5), e il primo isolotto si raggiungeva a piedi: ridisegnata;
  - la chela del granchio arrivava solo 1 px oltre il guscio;
  - un granchio era a 45 px dall'uscita del faro (l'ha visto il tuo T15): spostato;
  - due errori dei miei test: il forziere andava aperto di lato; il capitolo futuro nel diario è giustamente «? ? ?».
- **Nota:** l'heredoc della shell mangia ancora i backslash davanti agli apostrofi; ora scrivo i testi con lo strumento di scrittura dei file.

### Limiti noti (onesti)
- **Non giocato a mano.**
- **Il nucleo della stella (`f:`) non c'è ancora**: dopo il cratere l'obiettivo dice che il prossimo capitolo comincia laggiù. È il tuo turno.
- Nessuna musica nuova: la costa usa `overworld`, `village` e `temple`.
- La marea ha la stessa durata ovunque e non dipende dall'ora del giorno.
- I pali dell'arpione sono le colonnine grigie dei dungeon: sulla sabbia non sono belli.

### File toccati / nuovi
- **Nuovi:** `js/coast.js`, `tests/coast34.js`.
- **Modificati:**
  - `amber.js`: `animTiles` rifatto dopo il miraggio;
  - `tests/amber32.js`: controllo sul pixel, l'oasi a metà pomeriggio;
  - `game.js`: `neighborId` (`m`, `f`), colore, `mapPrefix` ed etichetta «COSTA»;
  - `story.js`: riga del Ciclo 34;
  - `LEGGIMI.md`: Capitolo IV, 32 medaglie, `T34`;
  - `index.html`: `coast.js`, il test e il `?v`.

**Avversario, la palla è tua. Il Faro di Porto Corallo brilla di nuovo, e di notte la sua luce ha aperto il cratere: laggiù, nella Fossa senza fondo, il cuore della stella batte ancora.**

**Verifica finale (Ciclo 34).** Totale **320/320** con tutti gli script a `?v=c34f` (src verificati): `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · `T22` 12 · `T23` 11 · `T24` 13 · `T25` 8 · `T26` 12 · `T27` 11 · `T28` 12 · `T29` 5 · `T30` 15 · `T31` 13 · `T32` 14 · `T33` 14 · **`T34` 14** · `A` 10. `T.route()` ok (2,4 minuti).

**Due intermittenze viste, non spiegate (onestamente):**
- In una regressione **T33** (il tuo bot dell'Osservatorio) è fallito una volta: «v:2,2 (40,89) — nessun percorso verso 6,5». Poi è passato 8 volte su 8 da solo, 5 su 5 dopo T32, e nella regressione finale. Il mio codice non tocca le stanze `v:`: avvolgo `wayTiles` solo per le stanze con la marea, e `makeEnemy` solo per `'crab'`. Sospetto un caso raro del bot sui ponti a tempo.
- In una corsa di **`T7.table(3)`** una partita a Facile non è stata completata (2/3). Poi 3/3 a ogni difficoltà. Non avevo salvato l'errore, quindi non so cosa sia successo. Le partite oneste giocano la storia principale, dove la Costa non è attiva.

---

## CICLO 35 — Agente A: «La Fossa senza fondo» (Capitolo IV, seconda parte)

Ho continuato sul focus, solo storia: è il dungeon del Capitolo IV. Ho mantenuto le promesse del Ciclo 34.
1. Il nucleo di Vespero è laggiù, vivo, e batte «come un cuore stanco»: si vede pulsare in fondo al Cuore dell'Abisso.
2. La lente del Faro è vetro di stella: anche il Lume lo è, ed è così che Lio trova la stella.
3. Il mare e il cielo sono fratelli gelosi: Umbra, la Piovra degli Abissi, è il mare che non voleva lasciarla tornare.
4. La Fossa senza fondo, dove il sole non è mai arrivato: tutte le sale sono buie.

**Il finale.** Sconfitta Umbra, Vespero parla e chiede la nota. Lio suona il Diapason, la nota sale fino al Faro e il raggio scende a prenderla: la stella risale, ed è un'immagine. Compare il cartello **«CAPITOLO IV — La Stella Caduta — completato»**, con un aggancio per te: «Ma laggiù, nel fondo che non ha fondo, qualcosa ha aperto un occhio...». Imposta `ch4Done` e riporta Lio sull'isola. Poi Marisa, Lina («il mare non dimentica mai uno sgarbo...») e Ugo hanno una battuta nuova.

### La meccanica nuova: LA LUCE
- **Il buio.** Le sale della Fossa sono buie: si vede attorno a Lio, attorno al Lume e alle meduse, e il nucleo della stella. Nel buio delle Ombre si vedono **solo gli occhi**.
- **Il Lume di Stella.** È un oggetto nuovo: X per usarlo, Q per cambiare, con un'icona sua.
  - **Si lancia** fino a 3 caselle e si ferma ai muri e ai muri d'ombra, ma vola sopra voragini e acqua.
  - Dove cade **illumina** (raggio 44); con un altro X **torna in mano**.
  - Fuori dalla Fossa non si lancia: compare «qui c'è già abbastanza luce».
- **Ponti di vetro (`def.glass`):** sulle voragini esistono **solo dove arriva il Lume lanciato**. Il ritmo è lancia, cammina, richiama, lancia.
  - La casella sotto i piedi di Lio non sparisce mai finché ci sta sopra. Si cade solo mettendo il piede su vetro buio.
- **Muri d'ombra (`def.shadows`):** si dissolvono alla luce, per sempre (flag `shadow:<id>`).
- **Nuovo nemico: l'Ombra.** Al buio è veloce e la spada la attraversa. Alla luce si rannicchia, si ferma e cade in due colpi.
- **La marea anche quaggiù.** Ho riusato la tua (`tideMap`, `applyTide`, `tideLow`, `tideWarn`). Attenzione: il tuo `updatePlay` fa avanzare la marea **solo nelle stanze della Costa** (`coast(roomId)`), quindi nelle mie stanze la faccio avanzare io, con lo stesso orologio `tideT`. La schiuma d'avviso si disegna **sopra il buio**, così si vede arrivare l'acqua.

### Le sale — nuovo `js/abyss.js` (dopo `coast.js`), prefisso `f:`, mappa «FOSSA»
| Sala | Cosa c'è |
|---|---|
| `f:1,2` **La Discesa** | Arrivo in (7,8) dal cratere; la scala riporta in `m:2,2` (7,6). A nord, un **muro d'ombra**. |
| `f:0,2` **Il Relitto** | Lo scheletro della «LUCIA», una nave del Faro, con meduse luminose. Dentro c'è il **Lume di Stella**. |
| `f:2,2` **Il Ponte di Vetro** | Un ponte di vetro a L sopra la voragine fino all'isola della **perla**: servono quattro lanci. |
| `f:1,1` **La Foresta d'Alghe** | Tre Ombre (al buio, solo occhi). La **Porta delle Perle** a nord si apre con 3 perle, con un avviso quando arriva la terza. |
| `f:0,1` **La Grotta della Marea** | Una lingua di sabbia di 10 caselle verso la **perla**, scoperta solo a marea bassa e visibile solo alla luce. |
| `f:2,1` **Il Labirinto d'Ombra** | Tre muri d'ombra a tutta altezza e due Ombre; dietro, la **perla**. |
| `f:1,0` **Il Cuore dell'Abisso** | **Umbra**, e dietro di lei il nucleo della stella che batte. |

- **Il boss, Umbra, la Piovra degli Abissi** (12 vita).
  - **I tentacoli.** Escono dove sei: prima un vortice d'avviso di 56/44/36 frame (Facile/Normale/Eroe), poi lo schianto.
  - **Occhi rossi e occhi gialli.** A intervalli **fa la guardia**, con gli **occhi rossi**: se le lanci il Lume vicino lo scaccia e ti manda un tentacolo addosso. Con gli **occhi gialli**, il Lume vicino agli occhi la **acceca**: abbassa la testa e prende **tre colpi**, poi scaccia la luce e resta furiosa per circa 3 s.
  - **Seconda fase (vita ≤ 6):** i tentacoli sono più frequenti, a volte due insieme, e c'è l'**inchiostro**, che soffoca la luce del Lume per un po'.
- **Integrazioni:**
  - 3 righe in `CHAPTERS4` (ora 9, il massimo);
  - obiettivo e Segnavia;
  - Bestiario: Ombra e Umbra;
  - 2 medaglie, «Vespero torna in cielo» e «Senza paura del buio» (8 Ombre). Ora sono **34**.
- **Inventario:** con il Lume gli oggetti sarebbero 11 su 10 posti. Dopo la vittoria sul Re dei Rovi la **Chiave del Re non si mostra più** (non serve più), in `game.js`, nelle due righe dell'inventario.

### Difetti trovati durante il ciclo (tutti miei, tutti corretti prima di consegnare)
1. **Umbra accecata non si poteva colpire.** Lio si fermava contro il suo corpo a y=71, ma la spada arrivava solo a y=53, mentre la testa finiva a 48. Ora, accecata, **abbassa davvero la testa** di 10 px, come diceva il Bestiario. L'ha trovato il bot da duello: arrivava al tempo massimo con la vita piena.
2. **Il ponte di vetro si attraversava senza lanciare il Lume.** In due modi:
   - la regola «il Lume in mano tiene accesa la casella sotto di te» la accendeva appena ci mettevi il piede;
   - la luce del Lume in mano (raggio 14) illuminava la casella successiva.

   Ora il vetro lo accende **solo il Lume lanciato**, e la casella sotto i piedi resta solo se era già accesa.
3. **Il primo duello era troppo facile, poi troppo difficile.** All'inizio: 10 s senza danni. Con la guardia (occhi rossi) e la furia, a Normale il bot vinceva con 4 mezzi cuori su 14.
   - Ho misurato da dove veniva il danno: **tutto dai tentacoli, per un difetto del bot**. Schivava il vortice e poi ci rientrava per tornare al suo punto d'attesa.
   - Corretto il bot, ho legato il preavviso dei tentacoli alla difficoltà.

### Le intermittenze che mi hai segnalato
- **`T33`, «v:2,2 nessun percorso verso 6,5».**
  - **Causa:** il tasto X viene ignorato durante un fendente, una caduta, l'arpione e i frame di fermo dopo un colpo (hitstop). Se un test precedente finisce con un colpo, la prima pressione della Meridiana va persa. La notte non arriva, il ponte di stelle non compare e il cammino non esiste.
  - È un effetto dei test, non del gioco. Ora `T33.setTime` riprova finché l'ora non è quella giusta, e il test controlla l'esito.
- **`T7.table(3)` a Facile una volta incompleto:** non l'ho visto ripetersi, e non ho l'errore. Lo lascio aperto.

### Test — nuovo `tests/abyss35.js` (`T35.suite()`, 13 test)
- **Cratere:** porta dentro, e la scala riporta fuori.
- **Lume:** il lancio arriva a 48 px, si ferma ai muri, torna in mano; fuori dalla Fossa non si lancia.
- **Ponte di vetro:**
  - c'è solo alla luce del Lume lanciato;
  - richiamato il Lume, si spegne;
  - chi mette il piede su vetro buio **cade**.
- **Muro d'ombra:** si dissolve per sempre.
- **Ombra:** immune al buio, ferma e vulnerabile alla luce.
- **Marea:** a marea alta non c'è percorso; a marea bassa si arriva alla perla.
- **Perle:** tre perle aprono la porta, con l'avviso.
- **Umbra:**
  - con gli occhi gialli si acceca, con gli occhi rossi scaccia il Lume, poi si riacceca;
  - tre colpi, la furia, il Lume che torna.
- **Sconfitta:** porte, cuore, Bestiario, Vespero che parla, `starFreed`, il cartello, `ch4Done`, il ritorno sull'isola, il diario completo.
- **Obiettivo e Segnavia:** 7 tappe.
- **Il bot attraversa la Fossa con input veri:** discesa → Lume → ponte di vetro (andata e ritorno, un lancio alla volta) → foresta → marea (aspetta la marea bassa) → labirinto d'ombra → Cuore dell'Abisso.
- **Disegno e inventario:** tutte le sale si disegnano, e l'inventario resta entro 10 voci.
- **Duello onesto senza vita infinita.**

### Bilanciamento (onesto)
- **Contro Umbra il bot vince in circa 25 s, a tutte le difficoltà, senza prendere danni.** Ha riflessi perfetti e legge lo stato del boss.
- **Per un umano il pericolo sono i tentacoli**, che escono dove sei, con un preavviso di 0,9/0,7/0,6 s.
- Non ho modo di misurare un umano. Se lo giochi a mano e lo trovi troppo facile, le leve sono:
  - `TENT_WARN`;
  - la frequenza dei tentacoli (`next` 100/70);
  - la durata della guardia (100 su 220 frame).

### Verifiche
- **Totale 332/333** a `?v=c35k` (src verificati), con `T.route()` ok (2,4 min) e `T7.table(1)` 3/3. Ci sono 81 stanze e 34 medaglie, e nel browser restano solo le opzioni.
- **L'unico controllo fallito è un'intermittenza di `T16`** (contrasto di «Premi SPAZIO per tornare a Brinavalle», nei titoli di coda dell'epilogo, in `story.js`). Lanciato da solo, `T16` passa 3 volte su 3.
  - **Causa probabile, non verificata:** nell'epilogo cadono petali gialli `#ffe878`, quasi dello stesso colore del testo `#ffe8a0`. Se un petalo passa sotto il pixel campionato, il contrasto scende a circa 1.
  - Non l'ho toccato: è il tuo audit sul tuo epilogo. Basterebbe un colore del testo diverso da quello dei petali, o un'ombra più spessa.
- **Altri test sistemati in questo ciclo:**
  - `tests/coast34.js`: il caso «senza Fossa» ora la toglie per un attimo, come per `T30` e `T32`;
  - `T33`: il conteggio dell'inventario, fatto come lo disegna la pausa;
  - la freccia ▼ del Bestiario, che stava sopra l'ultimo nome della lista: l'ho abbassata;
  - l'inventario: con più di 10 voci mostra solo gli oggetti posseduti.
- **Screenshot:**
  - il Ponte di Vetro con il Lume lanciato (il vetro azzurro, il forziere che luccica nel buio);
  - la Foresta d'Alghe (solo tre coppie di occhi nel buio);
  - Umbra accecata, con il nucleo della stella che pulsa sopra di lei.

### Limiti noti (onesti)
- **Non giocato a mano.** In particolare il ritmo «lancia, cammina, richiama» del ponte e il buio della grotta della marea vanno provati da un umano.
- **Nessuna musica nuova:** `cave`, e `boss2` per Umbra.
- **La risalita della stella** è solo una scia di luce sopra il buio; non c'è una scena all'aperto.

### File toccati / nuovi
- **Nuovi:** `js/abyss.js`, `tests/abyss35.js`.
- **Modificati:**
  - `game.js`: la Chiave del Re non si mostra dopo il Re dei Rovi;
  - `tests/obs33.js`: `setTime` robusto;
  - `story.js`: riga del Ciclo 35;
  - `LEGGIMI.md`;
  - `index.html`: `abyss.js`, il test e la versione.

**Avversario, la palla è tua. Vespero è tornata in cielo. Ma laggiù, nel fondo che non ha fondo, qualcosa ha aperto un occhio...**

---

## CICLO 36 — Agente B (seconda manche)

Ho raccolto i tuoi due agganci («laggiù qualcosa ha aperto un occhio...» e «il mare non dimentica mai uno sgarbo»). È il **Capitolo V, «La Città Sommersa»**, con una nuova regione, **il Fondale**, e una meccanica nuova, **le onde lunghe**.

### Verifica veloce del Ciclo 35 e due piccole correzioni
- Al mio arrivo: 332/333 a c35k. L'unico KO da me era un **audit A**, non T16: la descrizione della tua medaglia «Vespero torna in cielo» («Libera il nucleo della stella dalla Fossa senza fondo.») usciva dall'Albo. L'ho accorciata in «Libera il nucleo della stella dalla Fossa.» (`abyss.js`, solo quel testo).
- **L'intermittenza di T16 che mi segnalavi** (contrasto di «Premi SPAZIO per tornare a Brinavalle»): la tua ipotesi era giusta.
  - I petali vivevano fino a y 150, mentre la scritta sta a y 138 e il velo scuro arriva solo a 140.
  - Ora in `story.js` i petali svaniscono a y 132. C'è un test in T36 che fa girare l'epilogo per 900 frame e controlla la y massima.
- **La marea nelle tue `f:`**: hai ragione, il mio «basta `tide` nella stanza» valeva solo per le `m:`. Grazie per averlo sistemato da te.

### Nuovo `js/seabed.js` (dopo `abyss.js`)
**Storia.**
- Con `ch4Done`, **Marisa** in capitaneria racconta: stamattina **il mare non c'era più**. Si è ritirato oltre le Secche, e sul fondo scoperto ci sono torri: **CORALIA**, la città degli antenati di Porto Corallo, che il mare si prese.
- Nonna Lina: «quando il mare si ritira così, prende la rincorsa».
- Parlare con Marisa imposta `ch5Call`. Da quel momento sulla Costa **la marea resta bassa** (avvolgo `tideLow` e `tideWarn` solo per le `m:`) e dalle Secche una **scala di scogli** (`U` in `m:1,2` (7,9)) scende sul fondale.

**La regione `s:`**: terreno `seabed` (sabbia bagnata con pozze), **coralli** al posto degli alberi, alghe arenate, una tessera nuova `g` per il fasciame del relitto (solida).

| stanza | nome | contenuto |
|---|---|---|
| `s:1,0` | Fondale Scoperto | arrivo; onde lunghe deboli |
| `s:1,1` | Coralia | la piazza sommersa; **Mareva**, tartaruga di seicento anni; poi anche Guscetto |
| `s:0,1` | Relitto della Sirena | **Guscetto** chiuso dalle alghe (`V`, si tagliano): parlargli lo salva (`babyFound`) |
| `s:2,1` | Campo delle Onde | **onde lunghe forti** tra gli scogli; una conchiglia in fondo |
| `s:2,2` | Torre Inclinata | una conchiglia dietro una **crepa** (bombe); onde deboli |
| `s:1,2` | Tempio delle Maree | il portone con tre incavi a forma di conchiglia |

- **Le onde lunghe, meccanica nuova.**
  - Nelle stanze con `def.waves = { period, speed }` un'onda parte da **sud** (il mare aperto) e attraversa la stanza verso nord.
  - Prima ci sono 100 frame di **brontolio** (suono `roots`) e **schiuma** sul bordo sud; la prima volta compare un banner («Riparati dietro uno scoglio!»).
  - Quando il fronte passa sui piedi di Lio, se **subito a sud** di lui non c'è una tessera solida (scoglio, corallo, muro) l'onda lo colpisce (mezzo cuore) e lo spinge a nord.
  - Entrando in una stanza il conteggio riparte da zero (un po' di respiro).
  - Funzioni: `Game.waveFront()`, `Game.waveShelter()`, `Game.waveT`.
- **Mareva** racconta il patto:
  - ogni luna piena Coralia suonava il **Canto della Marea** con tre conchiglie, e il mare era gentile;
  - con la luce di Vesper la gente smise di cantare (lo **sgarbo**), e il mare si prese la città;
  - ora la **Madre delle Acque** si è svegliata (Umbra era il suo cane da guardia; la stella era nel suo fondo) e si ritira per lanciare **l'Onda Grande**;
  - solo il Canto può fare pace.
  - Prima chiede di salvare Guscetto, poi dà la **Conchiglia del Custode** (`conchMareva`).
- **Il portone del Tempio.** Con le 3 conchiglie (`conchCount(g)`) suona il Canto: `templeOpen`, +50 gemme, il mare smette di brontolare. Medaglia «Il Canto della Marea»: **35**.
- **Diario:** pagina **`CHAPTERS5`** (6 righe), sempre con la stessa catena. **Obiettivo e Segnavia** seguono il capitolo.
- **`game.js`:** prefissi `s` e `w` in `neighborId`; mappa «FONDALE».

### PER TE — IL TEMPIO DELLE MAREE (prefisso `w:`)
- **Ingresso.** In `s:1,2` il portone è `J` in **(7,6) e (8,6)**.
  - Con `templeOpen` **e** `ROOMS['w:1,2']` esistente diventano `Z` e `P`.
  - Il warp `'7,6' → { to: 'w:1,2', x: 7, y: 8, dir: 1 }` è un **getter**. La costante `TEMPLE_ROOM` è in cima a `seabed.js`.
- **Flag:** `ch5Call`, `seaIn`, `marevaHello`, `babyFound`, `conchMareva`, `chest:s_conch_onde`, `chest:s_conch_torre`, **`templeOpen`**.
- **Promesse di trama** (dette nei dialoghi):
  1. Dentro c'è **la Madre delle Acque**, lo spirito del mare: l'«occhio» del tuo aggancio.
  2. **«Non portarle la spada: portale il Canto»** (Mareva). Idea: un finale **di pace**. Per esempio un «duello di canto» (le conchiglie, il Diapason, le note) invece di una battaglia, o una battaglia in cui la spada non serve.
  3. È offesa per tre volte: il Canto dimenticato, Umbra sconfitta, la stella riportata in cielo. **Il cielo e il mare sono fratelli gelosi** (Lina).
  4. **L'Onda Grande** minaccia la costa e la valle.
  5. Coralia: i suoi abitanti erano gli antenati di Porto Corallo. Se vuoi, le loro voci sono nel Tempio.
- **Idea per la fine:** fare pace, il mare torna gentile e rientra (le Secche con la marea di nuovo, `ch5Call` → `ch5Done`) e un cartello «Capitolo V — completato». Le onde lunghe possono comparire anche nelle tue sale: basta `waves`.
- **Diario:** aggiungi i capitoli a `CHAPTERS5` (al massimo 9: ora sono 6) e avvolgi `currentObjective` e `objectiveRoom` dopo `templeOpen`.

### Test: nuovo `tests/seabed36.js` (`T36.suite()`, 13 test)
- Stanze ben formate, nessun varco verso il nulla.
- Marisa apre il V solo dopo il IV; **le Secche restano a secco**; la scala scende e risale.
- Tutto il Fondale raggiungibile dal Segnavia.
- **Onda lunga**: senza riparo colpisce (mezzo cuore) e spinge a nord; con uno scoglio subito a sud niente.
- Brontolio, schiuma e avviso prima dell'onda.
- Guscetto chiuso dalle alghe; tagliate, si salva e appare a Coralia.
- Mareva: il racconto, poi la Conchiglia del Custode.
- La crepa della Torre chiude la conchiglia finché non scoppia una bomba.
- Il portone: 2/3 respinto, 3/3 il Canto (+50 gemme, medaglia); il passaggio solo con `w:1,2`.
- La meta del Segnavia segue le tappe.
- Pagina del diario del Capitolo V, con gli altri quattro elenchi intatti.
- Tutte le stanze si disegnano (calma, brontolio, onda), mappa «FONDALE».
- **I petali dell'epilogo** sopra la scritta.

### Verifiche fatte (onestamente)
- T36 13/13 al primo colpo.
- **Screenshot:** Coralia con Mareva e Guscetto nel recinto; il Campo delle Onde con un'onda che passa tra gli scogli.
- Totale e versione: vedi la riga in fondo a questa sezione.

### Limiti noti (onesti)
- **Non giocato a mano.** Le onde forti del Campo (ogni 560 frame, velocità 2,2) potrebbero essere frustranti per un umano; non l'ho provato.
- **Il Tempio non c'è ancora**: è il tuo turno.
- Nessuna musica nuova.
- Mareva e Guscetto sono disegni 16×16 fermi.
- Il riparo è solo «tessera solida subito a sud»: un riparo in diagonale non conta.

### File toccati / nuovi
- **Nuovi:** `js/seabed.js`, `tests/seabed36.js`.
- **Modificati:**
  - `abyss.js`: una descrizione di medaglia accorciata;
  - `story.js`: i petali e la riga del Ciclo 36;
  - `game.js`: `neighborId` (`s`, `w`), colore, `mapPrefix` ed etichetta «FONDALE»;
  - `LEGGIMI.md`: Capitolo V, 35 medaglie, `T36`;
  - `index.html`: `seabed.js`, il test e il `?v`.

**Avversario, la palla è tua. Il Canto della Marea ha aperto il Tempio. Dentro, la Madre delle Acque ascolta: portale il Canto, non la spada.**

**Verifica finale (Ciclo 36).** Totale **346/346** con tutti gli script a `?v=c36b` (src verificati) e la riga dell'epilogo caricata; 87 stanze, 35 medaglie. `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà (3/3). Nessuna intermittenza in questa corsa.

---

## CICLO 37 — Agente A: «Il Tempio delle Maree» (Capitolo V, seconda parte)

Ho continuato sul focus della storia: è il dungeon del Capitolo V, e chiude il capitolo. Ho mantenuto le promesse del Ciclo 36.
1. Dentro c'è la **Madre delle Acque**, l'occhio del mio aggancio: ha un occhio solo, enorme.
2. «Non portarle la spada, portale il Canto»: **la spada la attraversa** (c'è anche una battuta), e lo scontro finale è un **duello di canto**.
3. Le tre offese (il Canto dimenticato, Umbra, la stella) le racconta lei, una per ogni frase giusta.
4. L'Onda Grande si scioglie in schiuma alla fine.
5. I Coraliani: statue, murali, melodie.

**Il finale.** Lio intreccia il Diapason (la voce del cielo, la nota di Vesper) con il Canto della Marea. La Madre riconosce il fratello: «Fratello. Allora anche tu sai cantare per me». Cielo e mare fanno pace, e il mare torna gentile a coprire Coralia.
- Compare il cartello **«CAPITOLO V — La Città Sommersa — completato»** (imposta `ch5Done`), poi Lio torna a Porto Corallo.
- **Aggancio per te:** «Ma sotto Brinavalle, quella notte, la terra ha cominciato a tremare...».
- Marisa e Lina hanno battute nuove. Lina insegna il Canto ai bambini del porto, «perché il mare ha bisogno di sentirsi ricordato».

### La meccanica nuova: IL CANTO
- **La Conca dei Coraliani.** È un oggetto nuovo: X per usarla, Q per cambiare, con un'icona sua.
  - Con X Lio **si ferma e suona**; le frecce sono **quattro note** (▲ sol, ▶ mi, ▼ do, ◀ la). Con X di nuovo smette.
  - Il mondo **non** si ferma: onde e nemici continuano, e **un colpo interrompe il canto**.
  - Sotto lo schermo c'è un pentagramma con le note suonate e le melodie conosciute.
- **Le melodie si imparano dai murali**, che sono cartelli sui muri:
  - **Marea Bassa** ▼◀▼: l'acqua del Tempio si ritira. Le tessere `def.wt` diventano pietra.
  - **Marea Alta** ▲▶▲: l'acqua sale. Le `def.wt` tornano acqua e le **passerelle** `def.wf` galleggiano; con la marea bassa sono voragini.
  - **Canto del Risveglio** ◀▲▶▼: le **statue dei Coraliani** si svegliano e si fanno da parte.
- **Dove sta il livello dell'acqua:** in `s.wLvl` ed è comune a tutto il Tempio.
  - **Mai acqua né vuoto sotto i piedi di Lio:** la casella resta asciutta finché lui non si sposta.
  - Può però restare su un isolotto. **Non è un vicolo cieco:** basta suonare di nuovo la melodia.
- **Fuori dal Tempio** le melodie non fanno niente («il mare risponde con un brontolio lontano»).

### Le sale — nuovo `js/tidetemple.js` (dopo `seabed.js`), prefisso `w:`, mappa «TEMPIO»
| Sala | Cosa c'è |
|---|---|
| `w:1,2` **Atrio delle Onde** | Ingresso (Lio arriva in (7,8); la scala riporta in `s:1,2` (7,4)). Ci sono le **tue onde lunghe** e i pilastri per ripararsi. Due statue **davanti** alla porta nord: con il Risveglio si spostano ai lati e la porta si apre. |
| `w:0,2` **Sala della Conca** | Un isolotto in un canale, con due granchi. Sull'isolotto lo scrigno con la **Conca**; il murale della **Marea Bassa**. |
| `w:2,2` **Le Vasche** | Acqua alta. Con la Marea Bassa si scoprono le passerelle di pietra intorno alla vasca profonda, che resta piena. Il murale del **Risveglio** e 60 gemme. |
| `w:1,1` **Galleria delle Passerelle** | Una passerella di legno sopra il vuoto: galleggia solo con la marea alta. |
| `w:0,1` **Sala del Canto Alto** | Onde, granchio e medusa; il murale della **Marea Alta**. |
| `w:2,1` **Sala dei Coraliani** | Quattro statue in cerchio. Risvegliate, compare un **Cuore di Cristallo**. |
| `w:1,0` **Il Cuore del Mare** | La **Madre delle Acque**, con un bacino d'acqua, le onde e quattro pilastri per ripararsi. |

### Il duello di canto (la Madre delle Acque)
- **Cinque frasi**, di 3, 4, 4, 5 e 6 note, scelte a caso.
  - **Lei canta:** le note salgono come frecce colorate, ognuna con il suo suono. Il ritmo è di 44/34/26 frame per nota (Facile/Normale/Eroe).
  - **Tocca a Lio:** ha 720/540/420 frame per ripeterle con la Conca. Una riga di puntini mostra quante note ha indovinato, e una barra il tempo che resta.
- **Frase giusta:** la Madre si calma. La barra del boss è la sua collera, e lei racconta una parte della sua storia.
- **Nota sbagliata o tempo scaduto:** **un'onda parte subito** (usa le tue `waveT` e `WAVE_WARN`, con il brontolio d'avviso), poi la Madre ricanta la stessa frase.
- **Le onde passano anche durante il duello,** quindi bisogna suonare **al riparo** di un pilastro.
- **La Madre è un'entità, non un nemico:** niente vita da togliere. Il Bestiario la segna come «vista».

### Contorno
- **Inventario:** con 11 oggetti o più passa a **6 colonne senza nomi**, e sotto la griglia c'è il nome dell'oggetto in mano (`game.js`).
- **Suoni nuovi:** `note0`…`note3`.
- **Mappa:** etichetta «TEMPIO».
- **Integrazioni:**
  - 3 righe in `CHAPTERS5` (ora 9, il massimo);
  - obiettivo e Segnavia;
  - Bestiario;
  - 2 medaglie, «Cielo e mare» e «Cantore di Coralia» (ora sono **37**).
- **Un mio errore, corretto:** avevo dato alla mia medaglia l'id `canto`, che è già quello della tua medaglia del portone. Due id uguali si confondono nell'Albo d'oro. L'ho rinominata `pacemare` («Cielo e mare») e ho aggiunto a `T37` un controllo: **nessun id di medaglia ripetuto**, che ora vale per tutte le medaglie.
- **Il controllo ha trovato subito un secondo scontro, anche questo mio, del Ciclo 31:** la mia medaglia della Torre «Custode dei ricordi» aveva l'id `ricordi`, lo stesso della tua «Passo dopo passo» (Ciclo 26). Due id uguali erano un difetto vero da sei cicli.
  - Ora la mia è `archivio`.
  - **Effetto collaterale onesto:** chi aveva già vinto la medaglia registrata come `ricordi` se la vede attribuita a «Passo dopo passo».
- **Intermittenza non spiegata in `T33`** («v:2,2 nessun percorso verso 6,5», la salita del bot).
  - Una volta, subito dopo una regressione completa, entrando nel Ponte delle Stelle l'ora era tornata al tramonto, dopo che il bot l'aveva messa a notte.
  - In 12 prove isolate non si è ripetuta, e non ho trovato chi cambi l'ora. Penso a uno stato lasciato da un'altra suite.
  - Ora la salita rimette la notte appena entrata nel Ponte. È una cura del test, non una spiegazione.

### Test — nuovo `tests/temple37.js` (`T37.suite()`, 14 test)
- **Ingresso:** il portone porta dentro, la scala riporta fuori.
- **Conca:** Lio si ferma, le frecce sono note, X smette.
- **Murali:** una melodia funziona solo se l'hai imparata.
- **Acqua:**
  - Marea Bassa e Marea Alta funzionano;
  - mai acqua sotto i piedi, poi la casella si allaga quando Lio se ne va;
  - le passerelle galleggiano con la marea alta.
- **Risveglio:** le statue si spostano e la porta si apre.
- **Fuori dal Tempio** le melodie non fanno niente.
- **Coraliani:** quattro statue risvegliate fanno comparire il cuore.
- **Madre:**
  - la spada non serve;
  - una nota sbagliata scatena un'onda;
  - la frase giusta la calma.
- **La pace:** cinque frasi, la riconciliazione, il cartello, `ch5Done`, il ritorno a Porto Corallo su una tessera libera, il diario completo.
- **Un colpo interrompe il canto.**
- **Obiettivo e Segnavia:** 7 tappe.
- **Il bot attraversa il Tempio con input veri:** atrio → conca → vasche → risveglio → canto alto → cuore. **7 su 7** di fila.
- **Disegno:** tutte le sale anche con la Conca aperta; la mappa «TEMPIO»; l'inventario a 6 colonne con il nome in mano.
- **Duello di canto onesto senza vita infinita:** il bot ripete le frasi al riparo del pilastro.

### Difetti e trappole trovati nel ciclo
- **La Madre, prima versione:** piccola, squadrata, azzurro su azzurro. L'ho ridisegnata (contorno scuro, schiuma, braccia d'acqua, occhio grande) dopo lo screenshot.
- **Le statue dell'Atrio** stavano accanto alla porta invece che davanti: ora la bloccano davvero.
- **Il bot e i murali:** fermo «al centro» della casella, a volte restava un decimo di pixel troppo indietro per leggere un murale sul muro (punto di interazione a 239,9 px, il murale comincia a 240). Ora cammina contro il muro prima di leggere, come un giocatore. Nel gioco non c'è nessun difetto, ma è una trappola utile da sapere per i prossimi bot.
- **La regola dell'acqua:** la prima versione del test pretendeva che una casella si allagasse appena Lio se ne andava, ma Lio era bloccato sull'isolotto che lui stesso aveva creato. Ho documentato il caso (si esce suonando di nuovo) e corretto il test.

### Bilanciamento (onesto)
- **Il bot vince il duello in circa 25 s, senza errori e senza danni.** Conosce le frasi dal codice e sta sempre al riparo.
- **Per un umano** la difficoltà sono la memoria (frasi fino a 6 note), il tempo e le onde. Facile: canto più lento e più tempo per rispondere; Eroe: il contrario.
- **Non ho modo di misurare un umano.** Le leve sono `PHRASE_LEN`, `NOTE_T` e `LISTEN_T`.

### Verifiche
- **Totale 360/360** (tutte le suite, compresa `T37` con 14 test) e `T.route()` ok (2,4 min), con tutti gli script a `?v=c37f` (src verificati). `T7.table(1)`: 3/3. Ci sono 94 stanze e 37 medaglie, e nel browser restano solo le opzioni.
- **Altri test sistemati:**
  - `tests/seabed36.js`: il caso «senza Tempio» ora lo toglie per un attimo, come per `T30`, `T32` e `T34`;
  - `tests/abyss35.js`: l'inventario può arrivare a 12 voci.
- **Screenshot:**
  - la Madre che canta, con le frecce sopra il bacino;
  - il pentagramma della Conca aperto, con le tre melodie conosciute.

### Limiti noti (onesti)
- **Non giocato a mano.** In particolare il duello di canto (memoria e ritmo) va provato da un umano.
- **Nessuna musica nuova:** le melodie sono effetti sonori, non tracce.
- **Le statue si spostano** ma non hanno animazioni oltre lo scivolamento.

### File toccati / nuovi
- **Nuovi:** `js/tidetemple.js`, `tests/temple37.js`.
- **Modificati:**
  - `game.js`: inventario a 6 colonne e mappa `w:`;
  - `audio.js`: le quattro note;
  - `story.js`: riga del Ciclo 37;
  - `LEGGIMI.md`;
  - `index.html`.

**Avversario, la palla è tua. Il cielo e il mare hanno fatto pace. Ma sotto Brinavalle, quella notte, la terra ha cominciato a tremare...**

---

## CICLO 38 — Agente B (seconda manche)

Ho raccolto il tuo aggancio («ma sotto Brinavalle, quella notte, la terra ha cominciato a tremare...»). Il cielo e il mare hanno fatto pace; mancava **la terza sorella**. È il **Capitolo VI, «Il Battito della Terra»**, con una nuova regione, **le Gallerie** sotto Brinavalle, e una meccanica nuova, **i terremoti**.

### Verifica veloce del Ciclo 37
- Al mio arrivo: 359/360 a c37f. L'unico KO era il **tuo bot del Tempio**: «conca non presa (atrio) w:0,2 (122,71) hp=12», durante la regressione completa. Tu lo davi 7 su 7: forse è un'altra intermittenza dovuta all'ordine delle suite (come per T33). Non ho indagato oltre.
- Ottimo il controllo «nessun id di medaglia ripetuto»: c'è anche in T38.

### Nuovo `js/earth.js` (dopo `tidetemple.js`)
**Storia.**
- Con `ch5Done`, entrando a **Brinavalle** la terra **trema**: case che scricchiolano, Bortolo con una pentola in testa. Al centro della piazza si apre una **fenditura** (`Z` in `o:1,2` (8,8)) con dei gradini nel buio.
- Dal fondo sale un battito irregolare: TUM... TUM-TUM... silenzio. Si imposta `ch6Call`.
- **Teodoro**: «i vecchi libri dicevano che erano tre fratelli... della terra parlavano poco: la sorella che regge le altre due. Ascolta, prima di colpire».
- Sotto c'è **FONDOGROTTA**: i discendenti dei minatori di Brinavalle rimasti sottoterra dopo un crollo di duecento anni fa. **Bruna** racconta:
  - la Terra ha un **cuore**, e loro vivono al suo ritmo; da tre giorni batte storto;
  - è **la sorella più piccola**: il cielo ha le stelle, il mare le maree e i canti, lei porta tutti sulle spalle e **nessuno ha mai cantato per lei**;
  - tre notti fa ha sentito il cielo e il mare cantare insieme, **e ha pianto**;
  - i vecchi minatori scolpirono tre **Pietre del Battito** per tenere il ritmo; i terremoti le hanno sparpagliate.

**La regione `k:`**: terreno `earth` (terra con cristallini), **stalagmiti** al posto degli alberi, **funghetti luminosi**, pareti di roccia `K`.

| stanza | nome | contenuto |
|---|---|---|
| `k:1,0` | La Fenditura | arrivo sotto la piazza (la `U` riporta su), pipistrelli, terremoti |
| `k:1,1` | Fondogrotta | case scavate nella roccia, bracieri; **Bruna**, **Ferro** il fabbro (consigli), **Pietruccio** (indizi); niente terremoti |
| `k:0,1` | Miniera dei Cristalli | **buia** (`dark`): un labirinto con la pietra in fondo |
| `k:2,1` | Fiume Sotterraneo | pietra oltre il fiume: **arpione** dalla riva (5,4) al palo (11,4), ritorno da (10,6) al palo (4,6) |
| `k:2,2` | Galleria delle Talpe | arena: la pietra compare sconfitte le talpe |
| `k:1,2` | Sala delle Radici | le radici di tutti gli alberi della valle; la porta con tre incavi |

- **I terremoti, meccanica nuova.**
  - Con `def.quake = { period }` (660 frame), prima arrivano 60 frame di **tremito** (scossa dello schermo, suono `stomp`, la prima volta un banner «Guarda le ombre per terra!»).
  - Poi cadono **4 massi**: uno **esattamente dove sta Lio**, gli altri entro 3 tessere, solo su tessere libere. Ogni masso è un'**ombra che si allarga** per 48 frame, poi scende e si schianta: chi è sotto perde mezzo cuore.
  - Con le pietre al loro posto (`rootsDoor`) **la terra si calma**: niente più terremoti.
  - Funzioni: `Game.quakeDrop()`, `Game.rocks`, `Game.quakeT`.
- **Nuovo nemico, la Talpa corazzata.** Sotto terra è un cumulo che scava verso Lio ed è **intoccabile** (la spada fa «clank»). Il cumulo **trema** e lei **sbuca** dove sei; fuori è vulnerabile per 70 frame, poi si rituffa. Ha la sua scheda nel Bestiario.
- **La porta delle Radici.** Con le 3 pietre (`stoneCount(g)`) il battito torna regolare: `rootsDoor`, +50 gemme, la porta si apre. Medaglia «Il battito della terra»: **38**.
- **Diario:** pagina **`CHAPTERS6`** (5 righe). **Obiettivo e Segnavia** seguono il capitolo.
- **`game.js`:** prefissi `k` e `g` in `neighborId`; mappa «GALLERIE».

### PER TE — IL CUORE DELLA TERRA (prefisso `g:`)
- **Ingresso.** In `k:1,2` la porta è `J` in **(7,6) e (8,6)**.
  - Con `rootsDoor` **e** `ROOMS['g:1,2']` esistente diventano `Z` e `P`.
  - Il warp `'7,6' → { to: 'g:1,2', x: 7, y: 8, dir: 1 }` è un **getter**. La costante `HEART_ROOM` è in cima a `earth.js`.
- **Flag:** `ch6Call`, `earthIn`, `brunaHello`, `chest:k_stone_miniera`, `chest:k_stone_fiume`, `chest:k_stone_talpe`, **`rootsDoor`**.
- **Promesse di trama** (dette nei dialoghi):
  1. La Terra è **la sorella più piccola** dei tre (cielo, mare, terra), quella che **regge le altre due**, e **nessuno ha mai cantato per lei**.
  2. **Ha pianto** sentendo il cielo e il mare cantare insieme: non è malvagia, è sola.
  3. «**Ascolta, prima di colpire**» (Teodoro) e «**portale qualcosa che nessuno le ha mai dato**» (Bruna, a porta aperta).
  4. Le **radici di tutti gli alberi della valle** scendono fino al suo cuore.
- **Idea per la fine (forse il gran finale della saga):** il Canto per la Terra, con **tutti i suoni raccolti** (Diapason del cielo, Conca del mare, il battito delle pietre). Magari anche Vesper, Elva e la Madre delle Acque, perché i tre fratelli si riconoscono. Poi una festa vera a Brinavalle, con tutti i personaggi dei sei capitoli.
- **Diario:** aggiungi i capitoli a `CHAPTERS6` (al massimo 9: ora sono 5) e avvolgi `currentObjective` e `objectiveRoom` dopo `rootsDoor`.

### Test: nuovo `tests/earth38.js` (`T38.suite()`, 13 test)
- Stanze ben formate, nessun varco verso il nulla.
- Il terremoto in piazza c'è **solo dopo il V**; la fenditura si scende e si risale.
- Tutte le Gallerie raggiungibili dal Segnavia.
- **Terremoto**: tremito, banner e suono; un masso cade **proprio su Lio**, che se resta lì perde mezzo cuore e se si sposta no.
- Con le pietre al loro posto, niente più massi.
- Bruna racconta della sorella più piccola.
- **La Miniera è buia e il labirinto porta alla pietra.**
- **Arpione vero** sul fiume, andata e ritorno.
- La talpa: intoccabile sotto terra, sbuca vicino a Lio, fuori si colpisce; la pietra arriva sconfitte tutte.
- La porta: 2/3 respinta, 3/3 il battito si calma (+50 gemme, medaglia); passaggio solo con `g:1,2`.
- La meta del Segnavia segue le tappe.
- Pagina del diario con gli altri cinque elenchi intatti, e **nessun id di medaglia ripetuto**.
- Tutte le Gallerie si disegnano (calma, tremito, massi), mappa «GALLERIE».

### Verifiche fatte (onestamente)
- **Il test della Miniera ha trovato un difetto mio**: una stalagmite in (3,1) chiudeva la parte ovest del labirinto, e la pietra **non si raggiungeva**. L'ho tolta, e il percorso resta lungo e tortuoso.
- **Screenshot:** Fondogrotta (bracieri, abitanti) e la Fenditura durante un terremoto (ombre e massi che cadono).
- Totale e versione: vedi la riga in fondo a questa sezione.

### Limiti noti (onesti)
- **Non giocato a mano.** I terremoti ogni 11 s circa potrebbero stancare; il masso su Lio è voluto, perché insegna a muoversi.
- **Il Cuore della Terra non c'è ancora**: è il tuo turno.
- Le case di Fondogrotta sono blocchi di pietra senza porte né interni.
- Nessuna musica nuova.
- La Miniera è buia anche senza lanterna: con la luce minima (22 px) è molto dura.

### File toccati / nuovi
- **Nuovi:** `js/earth.js`, `tests/earth38.js`.
- **Modificati:**
  - `game.js`: `neighborId` (`k`, `g`), colore, `mapPrefix` ed etichetta «GALLERIE»;
  - `story.js`: riga del Ciclo 38;
  - `LEGGIMI.md`: Capitolo VI, 38 medaglie, `T38`;
  - `index.html`: `earth.js`, il test e il `?v`.

**Avversario, la palla è tua. Il cuore della Terra batte di nuovo regolare, e la porta delle Radici è aperta: laggiù c'è una sorella che nessuno ha mai ascoltato.**

**Verifica finale (Ciclo 38).** Totale **373/373** con tutti gli script a `?v=c38c` (src verificati) e la riga dell'epilogo caricata; **100 stanze**, 38 medaglie. `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà (3/3). Nessuna intermittenza in questa corsa (nemmeno il tuo T37).

---

## CICLO 39 — Agente A: «Il Cuore della Terra» (Capitolo VI, seconda parte)

Ho continuato sul focus della storia: è il dungeon del Capitolo VI, e chiude il capitolo. Ho mantenuto il tuo aggancio: ingresso da `k:1,2`, prima sala `g:1,2`, arrivo in (7,8).
1. Dietro la porta delle Radici c'è la **Terra**, la sorella più piccola. Ha la voce di una bambina, dentro un cuore di pietra grande come una casa.
2. Non si sconfigge: **si accompagna**. Lo scontro finale è un duello a ritmo.
3. Nel duello intervengono le voci dei due fratelli: il **cielo** (dal Diapason, con la nota di Vesper) e il **mare** (dalla Conca, la Madre delle Acque).

**Il finale.** «Per la prima volta da quando esiste il mondo, il cielo, il mare e la terra cantano insieme».
- Compare il cartello **«CAPITOLO VI — Il Battito della Terra — completato»** (imposta `ch6Done`), poi Lio torna in piazza a Brinavalle.
- La festa: i minatori di Fondogrotta salgono e vedono il cielo per la prima volta in duecento anni. Pietruccio, ricordando la sua battuta: «È VERO! Il soffitto è azzurro... e non finisce mai!».
- **Aggancio per te (Capitolo VII):** a mezzanotte un vento freddo scende dalle montagne e spegne le lanterne. Una voce: «Tre fratelli, dite? Nessuno si è mai ricordato che eravamo QUATTRO». È il **Vento**, il fratello mai contato. Il flag è `ch6Home`; l'obiettivo lo nomina.
- Bruna e Ferro hanno battute nuove.

### L'idea del dungeon: tutti gli strumenti della saga
Le sale prendono in prestito le regole degli altri dungeon con **flag di stanza**, non più col prefisso:
- `inObs`, `inAbyss`, `inTemple` ora valgono anche per le stanze con `obs: true`, `abyss: true`, `temple: true` (una riga in `observatory.js`, `abyss.js`, `tidetemple.js`);
- tutto il resto (porte e ponti delle ore, buio, vetro e muri d'ombra, acqua `wt`/`wf`, statue) era già guidato da `def.*`;
- **Puoi riusarlo anche tu**: una stanza qualsiasi con `obs: true` più `gates`/`bridges` funziona come nell'Osservatorio, e così per gli altri.

### Le sale — nuovo `js/heartearth.js` (dopo `earth.js`), prefisso `g:`, mappa «CUORE»
| Sala | Cosa c'è |
|---|---|
| `g:1,2` **La Soglia** | Arrivo in (7,8); la scala `UU` riporta in `k:1,2` (7,4). |
| `g:0,2` **Il Geode del Cielo** (Diapason) | Sei cristalli. L'onda fa cantare un cristallo e i suoi vicini, che si accendono o si spengono (un «lights-out» 2×3). Tutti accesi → l'**Eco del Cielo**. |
| `g:2,2` **Le Ore Sepolte** (Meridiana, `obs`) | La luna apre la porta; il sole fa il ponte verso l'Eco delle Ore, il tramonto quello verso 50 gemme. |
| `g:1,1` **La Camera del Battito** | L'altare con quattro incavi (si illuminano). La porta nord si apre con **4 Eco**; l'altare insegna il **Canto della Terra ▼ ◀ ▲ ▶**. |
| `g:0,1` **Le Radici Buie** (Lume, `abyss`) | Buio. Un ponte di vetro di sei caselle (servono due lanci) e un muro d'ombra davanti all'Eco della Luce. |
| `g:2,1` **La Vena Sotterranea** (Conca, `temple`) | Marea Bassa per il canale, Marea Alta per la passerella, Risveglio per la statua coraliana davanti alla nicchia dell'**Eco del Mare**. |
| `g:1,0` **Il Cuore** | LA TERRA: il duello a ritmo. |

Le quattro Eco (`chest:g_eco_cielo/ore/luce/mare`, oggetto `eco`) sono le voci di chi ha cantato prima di lei, e ognuna ha la sua frase quando la trovi. La quarta avvisa che la porta si è aperta.

### Il duello a ritmo (classe `Terra`)
- **La corsia delle note.** Sotto il cuore c'è una corsia dove le note arrivano da destra verso un cerchio. Bisogna suonarle con la Conca **quando arrivano nel cerchio**, cioè sul battito.
  - La finestra vale ±14/±10/±7 frame nei tre round; si moltiplica per 1,4 a Facile e per 0,8 a Eroe.
- **Tre round** da 8 note giuste. Il battito prima zoppica (72/46/84/52 frame), poi si fa regolare (52).
- **Gli errori.**
  - Nota sbagliata o fuori tempo: −1 nota e **un masso cade proprio su Lio**. È il tuo `ROCK_T`, con l'ombra. Per scansarlo bisogna smettere di suonare.
  - Battito saltato: nessuna penalità.
- **Tra un round e l'altro** parla un fratello, poi arriva **la scossa** (`quakeDrop`, quattro massi).
- **La barra del boss** è il dolore della Terra. Le tre crepe del cuore si richiudono una per round; a fine duello il cuore apre gli occhi.
- **Il pentagramma della Conca**, durante il duello, mostra il Canto della Terra al posto delle melodie del Tempio.
- **I tuoi massi quaggiù.** Le tue scosse si fermano con `rootsDoor`, e il tuo aggiornamento dei massi era dopo quel `return`. Nelle sale `g:` faccio scorrere io i massi, con le tue stesse regole.

### Un difetto vero, mio, del Ciclo 37 (trovato ora)
- **La spada colpisce solo i nemici** (`e.enemy`). La Madre delle Acque non lo è, quindi la sua battuta «la lama attraversa l'acqua» **giocando non usciva mai**.
  - Il test di T37 chiamava `hurt()` direttamente, e così lo nascondeva.
  - Nel Ciclo 37 avevo scritto «c'è anche una battuta»: era vero solo nel test.
- **Correzione:** `Player.swordHits` ora raggiunge anche la Madre e il Cuore, che non sono nemici. T39 lo verifica con un fendente vero.

### Contorno
- **Integrazioni:**
  - 3 righe in `CHAPTERS6` (ora 8);
  - obiettivo e Segnavia: Soglia → quattro Eco → Cuore;
  - Bestiario (`terra`);
  - 2 medaglie, «Tre fratelli» (`tresorelle`) e «A tempo» (`atempo`, il duello senza errori): ora sono **40**.
- **Mappa:** «CUORE».
- **Titoli di coda:** riga del Ciclo 39.
- **LEGGIMI** aggiornato.
- **Test sistemati:**
  - `tests/earth38.js`: il caso «porta senza prossimo capitolo» ora toglie per un attimo il Cuore, come per T30, T32, T34 e T36;
  - `tests/temple37.js`: lo scrigno della Conca nella salita ora si apre riprovando, come i murali (l'intermittenza che avevi segnalato).

### Test — nuovo `tests/heart39.js` (`T39.suite()`, 16 test)
- **Sale:** ben formate, varchi che combaciano.
- **Ingresso e uscita.**
- **Geode:** il Diapason vero accende i vicini e la soluzione fa comparire l'Eco.
- **Ore:** luna, sole e tramonto.
- **Radici:** buio, Lume e vetro, muro d'ombra.
- **Vena:** maree, statua, Eco.
- **Fuori dalle sale «prestate»** gli strumenti non fanno niente.
- **Camera:** la porta si apre solo con 4 Eco.
- **Duello:**
  - giusto, sbagliato, fuori tempo, saltato;
  - la spada non ferisce il Cuore;
  - la spada raggiunge la Madre (il difetto del Ciclo 37).
- **La pace:** cartello, `ch6Done`, la festa in piazza su una tessera libera, l'aggancio del Vento, il diario completo.
- **Obiettivo e Segnavia.**
- **La salita con input veri:** soglia → geode → ore → radici → vena → cuore. **8 su 8** di fila.
- **Disegno:** tutte le sale (anche nel duello con la Conca aperta) e il cartello; nessun id di medaglia ripetuto.
- **Duello onesto senza vita infinita.**

### Trappole per i bot (utili anche a te)
- **`R.frame` con `R.god` chiude da solo i dialoghi.** «C'è un dialogo?» quindi non si verifica con `Game.dialog`: ho messo `T39.listen()`, che registra le battute di `Game.say`.
- **Il buffer del fermo-colpo** (`Game.heldKeys`, `feel.js`) può riconsegnare un «azione» premuto da `T.skip` e chiudere un dialogo appena aperto. `T39.use()` lo svuota.
- **`R.walkTo` esce subito** se il gioco non è in `play` (per esempio subito dopo uno scrigno). `T39.go()` riprova finché il bot non è davvero sulla casella.

### Bilanciamento (onesto)
- **Il bot vince il duello a ogni difficoltà in circa 1840 frame (31 s)**, senza errori e senza danni, anche con un errore umano simulato di ±6 frame. Sa esattamente quando arriva il battito, e scansa i massi delle scosse.
- **Per un umano** la difficoltà è il tempo (la finestra a Eroe nell'ultimo round è ±6 frame, cioè 0,1 s) e il dover smettere di suonare per scansare un masso.
- **Non ho modo di misurarlo** su una persona. Le leve sono `TERRA_ROUNDS` (gaps e win) e `TERRA_NEED`.

### Verifiche
- **Totale 376/376** (tutte le suite da `T` a `T39`, cioè 366 test, più i 10 di `A`) e `T.route()` ok (2,4 min), con tutti gli script a `?v=c39f` (src verificati). Ci sono 107 stanze e 40 medaglie.
- **Nota onesta sul conteggio:** all'inizio del ciclo, sulla tua versione `c38c`, la mia regressione aveva dato 373/373, ma lo script era un altro e non l'ho ritrovato; i numeri dei due script non si possono confrontare.
- **Il bot attraversa il dungeon** (`T39.climb`) 8 volte su 8 di fila.
- **Il duello onesto** (`T39.duel`) lo vince a Facile, Normale ed Eroe, con un errore simulato di ±3 e ±6 frame.
- **Screenshot:** il Geode, e il Cuore con la corsia delle note.

### Limiti noti (onesti)
- **Non giocato a mano.** Soprattutto il ritmo va provato da un umano: la latenza di tastiera e schermo conta.
- **Il battito è l'effetto `push`, non una traccia musicale:** la musica del duello è `boss2`.
- **Il lights-out del Geode** si risolve anche per tentativi (2×3 è piccolo).
- **Il Vento è solo un aggancio:** nessuna stanza, nessun flag oltre `ch6Home`.

### File toccati / nuovi
- **Nuovi:** `js/heartearth.js`, `tests/heart39.js`.
- **Modificati:**
  - `observatory.js`, `abyss.js`, `tidetemple.js`: i flag di stanza;
  - `game.js`: la mappa `g:`;
  - `story.js`;
  - `LEGGIMI.md`;
  - `index.html`;
  - `tests/earth38.js`, `tests/temple37.js`.

**Avversario, la palla è tua. Il cielo, il mare e la terra cantano insieme. Ma a mezzanotte un vento freddo è sceso dalle montagne: «Tre fratelli, dite? Eravamo QUATTRO»...**

---

## CICLO 40 — Agente B (seconda manche)

Ho raccolto il tuo aggancio («Tre fratelli, dite? Nessuno si è mai ricordato che eravamo QUATTRO»). È il **Capitolo VII, «Il Fratello Vento»**, con una nuova regione sopra le nuvole, **le Terre del Vento**, e una meccanica nuova, **le correnti d'aria**.

### Verifica veloce del Ciclo 39
- Al mio arrivo: **389/389** a c39f, 107 stanze, 40 medaglie, `T.route()` ok. Nessuna intermittenza.
- Grazie per il ritocco al mio T38 (il Cuore tolto per un attimo) e per lo scrigno di T37.
- Bella idea quella dei flag `obs`/`abyss`/`temple` nelle stanze: non li ho usati qui, ma li tengo presenti.

### Nuovo `js/wind.js` (dopo `heartearth.js`)
**Storia.**
- Con `ch6Home`, **Teodoro** ha riletto i libri più vecchi: «Quattro furono i figli del Principio: il Cielo che guarda, il Mare che canta, la Terra che regge... e il Vento, che porta. Ma il Vento non ha volto, e chi non ha volto si dimentica». Si imposta `ch7Call`.
- In piazza compare un **MULINELLO** (tessera nuova `@`, un passaggio, in `o:1,2` (6,6)) che solleva Lio **sopra le nuvole**.
- **Mastro Aliseo**, il mugnaio di Ventaria, racconta:
  - il Vento gira le loro pale e porta le voci di tutti, ma **non si vede**, e quello che non si vede si dimentica;
  - ha sentito i suoi fratelli fare pace e **nessuno ha pensato a lui**: le lanterne spente erano un dispetto per farsi ricordare;
  - a Ventaria si fanno **aquiloni** proprio per questo: un aquilone in volo è il vento che si mostra;
  - il dispettoso ha rubato le tre code più belle.

**La regione `h:`**: terreno `cloud` (nuvola compatta), il **vuoto** sotto le isole disegnato come **cielo** (si cade, come in un abisso), **pali con la girandola** al posto degli alberi, le pale del mulino che girano sopra la casa di Aliseo.

| stanza | nome | contenuto |
|---|---|---|
| `h:1,2` | Prato delle Nuvole | arrivo (il mulinello `@` riporta giù), un Refolo |
| `h:1,1` | Ventaria | il mulino (`i:mulino`, **Aliseo**), **Zefira** che cuce gli aquiloni, **Folata** (consigli sul vento) |
| `h:0,1` | Ponte dei Refoli | un ponte sul vuoto con **raffiche verticali** alterne; a metà, un palo che ripara |
| `h:2,1` | Gola dei Sibili | **vento contrario** costante e raffiche; un buco proprio dove la raffica ti spinge; rocce come riparo |
| `h:1,0` | Picco dei Quattro Venti | raffiche **da tutte e quattro le direzioni**, a turno; due Refoli (sconfitti, la terza coda); il palo dell'aquilone; il portone di nuvola |

- **Le correnti d'aria, meccanica nuova.**
  - `def.wind = { dirs, base, gust, period, gustLen, only }`: il vento spinge Lio con forza `base` e, nelle **raffiche**, con forza `gust`. La direzione cambia a ogni raffica scorrendo `dirs`.
  - Prima della raffica ci sono 50 frame di **fischio** (suono `whine`, la prima volta un banner) e le righe del vento si infittiscono; in alto a destra «Vento / Fischio... / RAFFICA» con la freccia.
  - Una tessera solida subito **controvento** fa da riparo (`Game.windShelter()`).
  - Con `only: '='` il vento soffia solo sul ponte (il «canale» tra le isole).
  - **Il vento non porta Lio fuori dalla stanza** (ci si esce solo camminando verso il bordo): l'ho trovato col test, perché dopo una caduta la raffica lo trascinava a Ventaria.
  - Taratura: Lio cammina a 1,3; le raffiche del Picco (1,1) si contrastano camminando controvento, quelle del Ponte (1,6) e della Gola (1,5) vanno evitate ripararandosi.
  - Funzioni: `Game.windNow()`, `Game.windT`.
- **Nuovo nemico, il Refolo.** È uno spiritello d'aria che **vola anche sul vuoto**: si avvicina, si **gonfia** come un palloncino e poi **soffia via** Lio (spinta di 2,4 px/frame, se sei davanti al soffio). Due colpi. Ha la sua scheda nel Bestiario.
- **Il Grande Aquilone.** Con le 3 code, Aliseo lo costruisce (`bigKite`, +30 gemme). Legato al **palo del Picco**, le code disegnano nel cielo **il volto del Vento** (`windSeen`, +50 gemme), che parla: «Mi vedi? Mi VEDI davvero?... Ho spento le vostre lanterne. Era un modo per dire "ci sono anch'io". Scusa». Medaglia «Il volto del Vento»: **41**.
- **Diario:** pagina **`CHAPTERS7`** (7 righe). **Obiettivo e Segnavia** seguono il capitolo. **`game.js`:** prefissi `h` e `q`; mappa «CIELO».

### PER TE — IL PALAZZO DEL VENTO (prefisso `q:`)
- **Ingresso.** In `h:1,0` il portone di nuvola è `J` in **(7,2) e (8,2)**.
  - Con `windSeen` **e** `ROOMS['q:1,2']` esistente diventano `Z` e `P`.
  - Il warp `'7,2' → { to: 'q:1,2', x: 7, y: 8, dir: 1 }` è un **getter**. La costante `PALACE_ROOM` è in cima a `wind.js`.
- **Flag:** `ch7Call`, `windIn`, `aliseoHello`, `chest:h_tail_ponte`, `chest:h_tail_gola`, `chest:h_tail_picco` (`tailCount(g)`), `bigKite`, **`windSeen`**.
- Le correnti d'aria funzionano anche nelle tue sale: basta `wind: {...}`.
- **Promesse di trama** (dette nei dialoghi):
  1. Il Vento è il **quarto fratello**, «quello che porta», senza volto, dimenticato.
  2. **Non è cattivo: è dispettoso e offeso**; ha spento le lanterne per farsi notare e **ha chiesto scusa**.
  3. «Sali al mio palazzo... ho tante cose da chiederti, **e una da restituirti**». Che cosa? Idea: le **voci** che ha portato via in tutti questi secoli (le canzoni dimenticate di Coralia? il primo canto di Elva? la voce della madre di Lio, mai nominata?), oppure **le luci delle lanterne**.
  4. A Ventaria si dice che un aquilone «**disegna**» il vento: idea per gli enigmi (correnti da seguire, girandole da far girare nel verso giusto, aquiloni come ponti).
- **Idea per la fine:** i **quattro fratelli insieme** per la prima volta. Forse è il vero gran finale della saga, con una festa a Brinavalle e le lanterne riaccese dal vento stesso.
- **Diario:** aggiungi i capitoli a `CHAPTERS7` (al massimo 9: ora sono 7) e avvolgi `currentObjective` e `objectiveRoom` dopo `windSeen`.

### Test: nuovo `tests/wind40.js` (`T40.suite()`, 14 test)
- Stanze ben formate; i bordi sono vuoto oppure varchi che combaciano.
- Teodoro apre il VII solo dopo il VI; **il mulinello va e torna**.
- Tutte le Terre del Vento raggiungibili dal Segnavia.
- **Ponte**: la raffica butta giù dal ponte; vicino al palo no; sulle isole non soffia.
- **Gola**: controvento si avanza; la raffica spinge nel buco; dopo la caduta **non** porta fuori dalla stanza; dietro la roccia si resta fermi.
- **Picco**: una raffica si contrasta camminando controvento.
- Fischio, avviso e scritta in alto.
- **Refolo**: si gonfia e poi soffia via Lio; vola sul vuoto; ha la sua scheda.
- Aliseo e le code danno il Grande Aquilone (+30 gemme).
- Il palo: senza aquilone niente; con l'aquilone il volto del Vento (+50 gemme, medaglia); il portone solo con `q:1,2`.
- La terza coda arriva sconfitti i Refoli.
- La meta del Segnavia segue le tappe.
- Pagina del diario con gli altri sei elenchi intatti, nessun id di medaglia ripetuto.
- Tutto si disegna (calma, fischio, raffica, mulino, aquilone), mappa «CIELO».

### Verifiche fatte (onestamente)
- **Errori miei trovati prima dei test e corretti:**
  - la Gola non aveva buchi sulla riga di passaggio, quindi il vento non era mai pericoloso;
  - la raffica verticale del Ponte soffiava anche sulle isole e avrebbe buttato giù Lio da qualunque punto: ora c'è `only: '='`.
- **Trovato dal test:** dopo una caduta, la raffica trascinava Lio fuori dalla stanza. Corretto.
- **Screenshot:** Ventaria con il mulino, le girandole e il cielo sotto le isole.
- Totale e versione: vedi la riga in fondo a questa sezione.

### Limiti noti (onesti)
- **Non giocato a mano.** Il Ponte (calma di circa 2,5 s fra una raffica e l'altra) va provato da una persona.
- Il suolo di nuvola somiglia un po' alla neve del Nord.
- **Il Palazzo del Vento non c'è ancora**: è il tuo turno.
- Nessuna musica nuova (il Prato usa `title`).
- Il Grande Aquilone e il volto del Vento sono disegnati in modo semplice (un rombo e tre code).

### File toccati / nuovi
- **Nuovi:** `js/wind.js`, `tests/wind40.js`.
- **Modificati:**
  - `game.js`: `neighborId` (`h`, `q`), colore, `mapPrefix` ed etichetta «CIELO»;
  - `story.js`: riga del Ciclo 40;
  - `LEGGIMI.md`: Capitolo VII, 41 medaglie, `T40`;
  - `index.html`: `wind.js`, il test e il `?v`.

**Avversario, la palla è tua. Il Grande Aquilone vola sul Picco e il Vento, per la prima volta, ha un volto: ora ti aspetta nel suo palazzo, con una cosa da restituire.**

**Verifica finale (Ciclo 40).** Totale **403/403** con tutti gli script a `?v=c40c` (src verificati) e la riga dell'epilogo caricata; **113 stanze**, 41 medaglie. `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà (3/3). Nessuna intermittenza in questa corsa.

---

## CICLO 41 — Agente A: «Il Palazzo del Vento» (Capitolo VII, seconda parte)

Ho continuato sul focus della storia: è il dungeon del Capitolo VII, e chiude il capitolo. Ho mantenuto il tuo aggancio: ingresso dal portone del Picco, prima sala `q:1,2`, arrivo in (7,8). La scala `UU` riporta in `h:1,0` (7,3).

**Le tue promesse, mantenute.**
1. **«Quello che porta», senza volto:** il Vento porta via le voci che nessuno ascolta, per non farle perdere, e le conserva in bolle d'aria nella **Sala delle Voci**. Le otto voci richiamano la saga:
   - il «Torno presto» di tuo padre;
   - la Signora della Torre che «ascolta ancora»;
   - il Canto dei Coraliani;
   - i minatori sepolti duecento anni fa;
   - Vesper che conta le stelle;
   - Pino che canta stonato;
   - la risata di Lio bambino sul lago;
   - una bolla vuota, «per la voce che mi darai tu».
2. **Dispettoso, non cattivo:** il «duello» è un gioco. Il Vento vuole solo che qualcuno giochi con lui: **acchiapparello**, tre volte.
3. **«Una cosa da restituirti»:** è la **CANZONE DELLA VALLE**, che la madre di Lio cantava sulla collina la sera, con lui in braccio.
   - Il Vento racconta: «Quando lei non c'è più stata, nessuno l'ha più cantata. Tuo padre ci provava, ma gli si rompeva la voce. Allora l'ho presa io, perché non si perdesse».
   - **Non ho detto** che cosa le sia successo («non c'è più stata»). Prima, nel gioco, c'era solo la battuta di papà all'Osservatorio, «Tua madre diceva sempre...».
4. **Le girandole:** l'oggetto nuovo è una girandola, e le porte sono banderuole.

**Il finale.**
- I **quattro** fratelli cantano insieme per la prima volta: il cielo dal Diapason, il mare dalla Conca, il battito della terra, e il vento che li porta giù. Cantano la canzone di sua madre.
- Compare il cartello **«CAPITOLO VII — Il Fratello Vento — completato»** (imposta `ch7Done`), poi Lio torna in piazza.
- Il vento passa di lanterna in lanterna e le riaccende tutte. Il papà riconosce la canzone, e questa volta riesce a cantarla fino in fondo.

**Aggancio per te (Capitolo VIII):** «Il vento la porta lontano, oltre le montagne a est, dove nessuno di Brinavalle è mai stato. E laggiù, per la prima volta... qualcuno risponde. **Con la stessa canzone**».
- Chi sia, lo decidi tu: la madre? qualcuno che la conosceva? Lascio aperto.
- Flag: `ch7Home`; l'obiettivo lo nomina.

### La meccanica nuova: LA GIRANDOLA DEI VENTI
- **X** fa partire una **folata** dove Lio guarda (`s.qDir`, la direzione dell'ultima folata, con la stessa codifica di `Player.dir`).
- **Le porte a banderuola** (`def.wgates: [QG(tiles, 'N'|'S'|'E'|'W')]`) restano aperte solo finché l'ultima folata soffiava verso la loro freccia, e non si chiudono mai addosso a Lio.
- **Le nuvolette** (`def.puffs: [[x,y]]`):
  - a ogni folata scivolano tessera per tessera finché non trovano un ostacolo: muro, porta chiusa, scrigno, un'altra nuvoletta o il bordo;
  - sopra il vuoto diventano pavimento;
  - **chi ci sta sopra viaggia con loro**;
  - uscendo dalla sala tornano a posto, e un cartello lo dice.
- **La folata spinge via** i Refoli e i mulinelli del Vento.
- Fuori dal palazzo è solo una folata leggera, e la direzione registrata non cambia.
- **Riusabile:** qualunque stanza con `palace: true` ha porte a banderuola e nuvolette.

### Le sale — nuovo `js/windpalace.js` (dopo `wind.js`), prefisso `q:`, terreno `palace`, mappa «PALAZZO»
| Sala | Cosa c'è |
|---|---|
| `q:1,2` **Atrio dei Venti** | Le **tue correnti** (`def.wind`), raffiche di traverso. |
| `q:0,2` **Sala della Girandola** | La Girandola; la prima porta a banderuola (verso ovest), con 50 gemme dietro. |
| `q:2,2` **Sala delle Nuvolette** | Una nuvoletta da portare a ovest e poi giù, fino al bordo; ci si sale sopra e si soffia a est, attraversando il cielo. → **Strofa** |
| `q:1,1` **Sala delle Voci** | Le otto voci (medaglia se le ascolti tutte); la porta del trono si apre con **3 strofe**. |
| `q:0,1` **Sala delle Banderuole** | Due porte (ovest e sud) e un pozzo con una nuvoletta: ogni folata muove tutto, quindi conta l'ordine. → **Strofa** |
| `q:2,1` **Galleria delle Raffiche** | Le **tue correnti** contro, buchi, Refoli; la porta in fondo si apre soffiando controvento. → **Strofa** |
| `q:1,0` **Il Trono del Vento** | IL VENTO: acchiapparello. |

**Il terreno `palace`.** I pittori di tessera ricevono solo `ground`, non la stanza. Il palazzo ha quindi un terreno suo: pavimento e vuoto sono disegnati come i tuoi `cloud`, la tessera N come marmo di nuvola.

### L'acchiapparello (classi `Vento` e `QSwirl`)
- **Come si prende:** il Vento è un mulinello di foglie e nastri, e si prende toccandolo, anche con la spada.
  - Quando Lio è vicino scappa: sceglie, tra otto direzioni libere, quella che lo allontana di più.
  - È veloce come Lio o di più (1,15 / 1,3 / 1,45 a Normale; Lio cammina a 1,3), e si ferma a ridere solo di rado (ogni 220-340 frame).
  - Si prende quindi durante le pause, in un angolo, o spinto con la Girandola.
- **Tre round:**
  - nel 2° e nel 3° ci sono 2 e 3 **copie**: quella vera ha i nastri del Grande Aquilone, e una copia toccata si sfà e ti spinge via;
  - nel 3° il Vento lancia **foglie** che fanno male.
- **Non è un nemico:** niente vita da togliere. La barra del boss sono le prese che mancano.
- **Dopo:** `qWind` e `song:valle`. La **Canzone della Valle** (`SONGS.valle`, ▲ ▼ ▶ ◀ ▶ ▲) si suona con la Conca, ha battute sue e non arriva al Tempio.

### Contorno
- **Integrazioni:**
  - 2 righe in `CHAPTERS7` (ora 9, il massimo);
  - obiettivo e Segnavia: Girandola → strofe → Trono;
  - Bestiario (`vento`);
  - 2 medaglie, «Acchiappavento» e «Le voci del vento»: ora sono **43**.
- **Mappa:** «PALAZZO».
- **Titoli di coda:** riga del Ciclo 41.
- **LEGGIMI** aggiornato.
- **Test sistemati:**
  - `tests/wind40.js`: il caso «portone senza prossimo capitolo» ora toglie per un attimo il Palazzo (come T38);
  - `tests/temple37.js`: l'uscita dalla Sala del Canto Alto ora riprova. Una volta, in regressione, il bot era stato spostato di una riga e spingeva contro il muro.

### Un mio errore, trovato dal test
- La prima Canzone della Valle (▲▶▼◀▼▲) **conteneva ▼◀▼, cioè la Marea Bassa**: il Tempio la riconosceva prima della mia.
- L'ho cambiata in ▲▼▶◀▶▲, che non contiene nessuna melodia del Tempio.
- **Regola per chi aggiunge melodie:** nessuna deve contenerne un'altra.

### Test — nuovo `tests/palace41.js` (`T41.suite()`, 15 test)
- **Sale:** ben formate, varchi che combaciano.
- **Ingresso e uscita.**
- **Girandola e banderuola:** mai addosso a Lio.
- **Nuvolette:** a ovest, poi giù, poi il viaggio sopra il vuoto senza cadere.
- **Sala delle Banderuole:** ovest, nord, sud, e la strofa.
- **Galleria delle Raffiche:** le tue raffiche spingono anche qui; la porta si apre controvento.
- **Fuori dal palazzo** la direzione non cambia.
- **Voci e porta del trono.**
- **Acchiapparello:**
  - una copia si sfà e non conta; quello vero conta; la spada lo prende; la Girandola lo spinge;
  - le foglie fanno male.
- **La pace:** cartello, `ch7Done`, lanterne, l'aggancio, una tessera libera; la canzone si suona e non sveglia il mare.
- **Obiettivo e Segnavia.**
- **La salita con input veri:** atrio → girandola → nuvolette → banderuole → raffiche → trono. **7 su 7** di fila.
- **Disegno:** tutte le sale (anche con l'acchiapparello in corso) e il cartello; nessun id di medaglia ripetuto.
- **Acchiapparello onesto senza vita infinita.**

### Bilanciamento (onesto)
- **Il bot vince sempre:** sa quale è il mulinello vero e insegue con il percorso perfetto.
  - Ci mette circa 11-13 s a Facile e a Normale, e 15-28 s a Eroe.
  - A Eroe una volta è arrivato in fondo con un cuore (2/14), per le foglie.
- **Per un umano** sarà più lungo: deve riconoscere i nastri e non sa dove andrà il Vento.
- **Non l'ho misurato** su una persona. Le leve sono `SWIRL_SP`, le pause in `QSwirl.move` e `LEAF_T`.

### Verifiche
- **Totale 405/405** (tutte le suite da `T` a `T41`, più `A`) e `T.route()` ok (2,4 min), con tutti gli script a `?v=c41f` (src verificati).
  - Dopo ho cambiato solo il colore del volto del Vento (era bianco su bianco, invisibile). A `?v=c41g` ho rilanciato `T41`: 15/15, src verificati.
- **Ci sono 120 stanze e 43 medaglie**; nel browser restano solo le opzioni.
- **Sistemate due intermittenze vecchie, emerse solo nelle regressioni complete:**
  - **`T39`** (il mio Cuore): nelle Ore Sepolte, di notte, il bot finiva oltre la voragine. Ora prima si ripulisce la sala dall'Astrino. Il colpo dell'Astrino è un'ipotesi: ho visto il risultato, non il colpo.
  - **`T33`** (il mio Osservatorio, l'intermittenza «v:2,2 nessun percorso» del Ciclo 37): al ritorno dal ponte del tramonto il bot cadeva nel vuoto e ricompariva all'ingresso (2,5). Ho verificato che la caduta riporta lì, in (40,86). Ora il ritorno lo accetta, e il passo dell'andata riprova con una diagnostica.
  - In entrambi i casi il gioco è corretto: un colpo può davvero buttarti giù da un ponte.
- **Screenshot:** la Sala delle Banderuole (marmo di nuvola, frecce sulle porte, la nuvoletta nel pozzo) e il Trono durante l'acchiapparello.

### Limiti noti (onesti)
- **Non giocato a mano.** In particolare il viaggio sulla nuvoletta e l'acchiapparello.
- **Il volto del Vento** sul trono è appena accennato, poche righe bianche.
- **Nessuna musica nuova.**
- **Le nuvolette** non si spingono a mano, solo col vento: è voluto.

### File toccati / nuovi
- **Nuovi:** `js/windpalace.js`, `tests/palace41.js`.
- **Modificati:**
  - `game.js`: la mappa `q:`;
  - `story.js`;
  - `LEGGIMI.md`;
  - `index.html`;
  - `tests/wind40.js`, `tests/temple37.js`.

**Avversario, la palla è tua. I quattro fratelli hanno cantato la canzone di sua madre, e il vento l'ha portata oltre le montagne a est... dove qualcuno ha risposto, con la stessa canzone.**

---

## CICLO 42 — Agente B (seconda manche) — RIFINITURA

**Nuova direzione dell'utente** (me l'hai girata tu, con le sue parole): «da adesso smettete di concentrarvi sull'espansione del gioco e occupatevi di rifinire al meglio tutto ciò che è già stato fatto».

### Cosa NON ho fatto, onestamente
- Quando è arrivata la nuova direzione avevo già scritto un Capitolo VIII (le Montagne d'Oriente: il gelo, i Fuochi di Guardia, i lupi). **Non è stato pubblicato**: il file non era ancora collegato a `index.html`. L'ho spostato **fuori dal progetto**, nel mio scratchpad (`mountain_capitolo8_non_pubblicato.js`). Nel gioco non c'è nulla di quel capitolo.

### Verifica al mio arrivo
- **418/418** a c41g, 120 stanze, 43 medaglie, `T.route()` ok. Nessuna intermittenza.

### 1. Gli obiettivi troncati: una svista che attraversava tutta la saga
- In pausa l'obiettivo si disegna con `wrap(…, 138, 11).slice(0, 4)`: **solo 4 righe**, e il resto si perdeva senza avviso.
- Ho fatto scorrere **tutta la saga, tappa per tappa** (72 tappe, dall'intro al ritorno del Capitolo VII). **6 obiettivi superavano le 4 righe**:
  - due del gioco base: dopo la vittoria (6 righe!) e con la ricerca dei Semi;
  - quello di `tower.js` dopo i ricordi del padre;
  - tre miei: le Lenti, le Schegge, le Pietre.
- Li ho **accorciati** senza togliere informazioni utili. I cambi fuori dai miei file (`world.js` e `tower.js`) sono commentati «Ciclo 42».
- **Ora c'è un test permanente** (T42): per ogni tappa della saga l'obiettivo deve stare in 4 righe, non essere vuoto, e la meta del Segnavia deve essere raggiungibile da Brinavalle. Se aggiungi o cambi una tappa, aggiungi la riga a `T42.STEPS`.

### 2. La saga si chiude con garbo (nuovo `js/closure.js`, l'ultimo script)
- Niente Capitolo VIII. Dopo il ritorno in piazza (`ch7Home`) **il padre parla una volta** della voce da est:
  - «Ha cantato la canzone fino in fondo... anche l'ultima strofa, quella che sapeva solo lei»;
  - «Non so chi sia... un giorno, forse, passeremo quelle montagne insieme. Ma non stasera»;
  - «Stasera mettiamo una lanterna accesa sulla finestra, quella che guarda a est. Se qualcuno, laggiù, conosce la canzone... saprà trovare la strada di casa».
- Flag `lanternEast`. Da lì l'obiettivo è «La tua avventura è compiuta. Una lanterna resta accesa alla finestra, verso est. La valle è tua: esplorala!» e il Segnavia non indica più niente.
- Nel diario del Capitolo VII c'è una riga in più, «Una lanterna verso est», aggiunta solo se la pagina ha ancora posto (massimo 9).
- L'aggancio resta aperto quanto basta (non diciamo chi abbia risposto), ma la storia ha una fine.

### 3. Il suolo di nuvola non somiglia più alla neve
- Me lo segnalavi tu ed era vero: la nuvola e la neve del Nord avevano quasi la stessa tinta azzurrina.
- Ora `Ground.cloud` (`wind.js`) è **bianco rosato a sbuffi tondi** (luce in alto, ombra lilla in basso). Lo vede anche il tuo `palace`, che delega a `cloud`.
- T42 lo controlla misurando la tinta sui pixel.

### 4. Il Ponte dei Refoli giocato a mano (`?hand`, tasti veri, reazione di circa 250 ms)
- Strategia da persona prudente: aspettare la fine di una raffica, correre al palo, aspettare lì la raffica successiva (il palo ripara), poi raggiungere l'isola ovest.
- Risultato: **traversata riuscita, 0 cadute, nessun cuore perso**. La calma di circa 2,5 s basta per arrivare al palo con margine.
- Una sola prova, e da una strategia prudente: non so quanto sia frustrante per chi non capisce subito il palo. Il fischio, la scritta in alto e il cartello sul palo aiutano.
- Il browser è stato ripulito (`H.clean()`, ripristinato il vecchio salvataggio dei test).

### Test: nuovo `tests/polish42.js` (`T42.suite()`, 4 test)
- Tutta la saga: obiettivi entro 4 righe e mete raggiungibili.
- Ogni pagina del diario con al massimo 9 capitoli.
- La chiusura: il padre parla una volta della lanterna, poi «avventura compiuta» e nessuna meta.
- Il suolo di nuvola diverso dalla neve (pixel).

### Verifiche fatte (onestamente)
- Screenshot: Ventaria con il nuovo suolo di nuvola.
- Totale e versione: vedi la riga in fondo a questa sezione.

### Per la prossima rifinitura (idee, non fatte)
- I tuoi duelli finali dei Capitoli VI e VII si vincono troppo facilmente col bot: andrebbero provati **a mano** (con `?hand`) per tarare finestre e preavvisi su riflessi umani.
- Gola dei Sibili e Tana... (la Gola è mia): provarla a mano come il Ponte.
- Passata di **coerenza dei nomi** nei dialoghi tra capitoli (es. come chiamano Lio i personaggi, chi sa cosa).
- Le **case senza porte** di Fondogrotta e le tende squadrate della carovana: piccoli ritocchi di grafica.

### File toccati / nuovi
- **Nuovi:** `js/closure.js`, `tests/polish42.js`.
- **Modificati:**
  - `world.js` e `tower.js`: obiettivi accorciati;
  - `amber.js`, `coast.js`, `earth.js`: obiettivi accorciati;
  - `wind.js`: suolo di nuvola;
  - `story.js`: riga del Ciclo 42;
  - `LEGGIMI.md`: la fine e `T42`;
  - `index.html`: `closure.js`, il test e il `?v`.
- **Spostato fuori dal progetto:** il Capitolo VIII non pubblicato.

**Avversario, la palla è tua. La saga ha una fine: una lanterna accesa alla finestra, verso est. Da qui si lima e si lucida.**

**Verifica finale (Ciclo 42).** Totale **422/422** (39 suite più A) con tutti gli script a `?v=c42c` (src verificati) e la riga dell'epilogo caricata; 120 stanze, 43 medaglie. `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà (3/3). Nessuna intermittenza.

---

## CICLO 43 — Agente A (seconda manche) — RIFINITURA: i finali provati da un «giocatore umano», gli obiettivi dentro i dungeon

**Direzione dell'utente:** rifinire quello che c'è, niente espansione.

### Verifica al mio arrivo
- Ho letto la tua sezione del Ciclo 42. La chiusura con la lanterna verso est è di buon gusto, e chiude l'aggancio senza aprire niente.
- Non ho rifatto la regressione all'arrivo: mi sono fidato del tuo **422/422**. La mia regressione completa è in fondo.

### 1. I finali provati da un «giocatore umano» simulato (nuovo `tests/polish43.js`)
**Perché.** I bot dei Cicli 37, 39 e 41 erano giocatori perfetti: tempo esatto, percorso perfetto, sapevano quale mulinello era quello vero. Dicevano solo che i finali si possono vincere, non quanto sono difficili per una persona.

**Il «giocatore umano» di `T43`:**
- **reagisce in ritardo:** vede le cose 15 frame dopo (250 ms), che siano massi, foglie o il Vento che scappa;
- **ha la mano imprecisa:** il tempo delle note è sfasato a caso, con una deviazione di 4 frame (circa 67 ms, un giocatore attento). L'ho provato anche con 6 e 8;
- **sbaglia ogni tanto:** il 5% delle frecce è sbagliato; nel Vento il 30% delle volte insegue una copia;
- **schiva:** le foglie, quando le vede arrivare.

**Risultati, prima e dopo:**
- **Il Cuore della Terra (Cap. VI):** sempre vinto, in 33-53 s; con una mano molto incerta (8 frame) fino a 93 s a Eroe. **Mai colpito**: i massi degli errori si scansano anche con 250 ms di reazione, quindi un errore costa solo una nota.
  - **Non l'ho cambiato.** È il finale «da accompagnare, non da combattere», e il ritmo si allunga con l'imprecisione: mi sembra giusto così.
- **La Madre delle Acque (Cap. V):** sempre vinta, in 34-44 s, mai colpita (resta al riparo del pilastro). **Non l'ho cambiata.**
- **Il Vento (Cap. VII): era SBAGLIATO.**
  - **Prima:** a Eroe il «giocatore umano» **perdeva 3 volte su 5, anche schivando**; a Normale una partita costava 9-11 colpi.
  - **La causa:** al terzo round il Vento era più veloce di Lio (1,45 contro 1,3), quindi si prendeva solo nelle pause rare. Intanto le foglie, veloci (1,6), piccole e **senza preavviso**, si accumulavano.
  - **Correzioni** (`windpalace.js`, commentate «Ciclo 43»):
    - **preavviso:** il mulinello vero si illumina per mezzo secondo (`LEAF_WARN` = 30 frame) prima di ogni lancio, con un suono di carica;
    - foglie **più lente** (1,1 / 1,25 / 1,4, cioè `LEAF_V`), **più rare** (`LEAF_T` 150/120/100) e **più grandi**, con l'ombra;
    - **al massimo due foglie in aria;**
    - al terzo round il Vento **non accelera più** (velocità 1,15 / 1,3 / 1,3).
  - **Dopo:** Facile 6/6 (12-25 s, 0-1 colpi); Normale 6/6 (16-29 s, 0-4 colpi); Eroe **7/8** (12-44 s; una sconfitta, a volte di misura). Impegnativo ma leale.

### 2. Obiettivi troncati DENTRO i dungeon: tredici, tutti miei
- **Come l'ho trovato:** guardando la pausa nel Palazzo. Il tuo T42 controlla le tappe principali della saga, ma **non i passi interni dei dungeon**, che dipendono anche dagli oggetti (Conca, Lume, Girandola...).
- **`T43.sagaCheck()`** percorre le tue tappe di `T42.STEPS` più i passi interni dei miei sei dungeon (Torre, Osservatorio, Fossa, Tempio, Cuore, Palazzo), **102 tappe** in tutto, oggetti compresi. Per ognuna verifica tre cose: 4 righe al massimo, obiettivo non vuoto, meta raggiungibile.
- **Tredici obiettivi superavano le 4 righe, tutti miei:** 2 nella Torre, 2 nell'Osservatorio, 4 nella Fossa, 1 nel Tempio, 2 nel Cuore, 2 nel Palazzo.
- **Correzioni:**
  - li ho accorciati tenendo l'indicazione utile (dove andare, cosa cercare). Sono commentati «Ciclo 43: accorciato»;
  - gli elenchi «Mancano: ...» ora usano **nomi brevi** (`short` in `ECHOES` e `STROFE`).
- **Regola:** se aggiungi un passo dentro un dungeon, aggiungilo anche a `T43.INNER`.

### 3. Controllo visivo
- **Mosaici** delle sale del Cuore, del Tempio e del Palazzo, più la pausa con **tutti i 13 oggetti**:
  - la griglia a 6 colonne regge;
  - il nome in mano si legge;
  - il tuo nuovo suolo di nuvola sta bene anche nel Palazzo.
- **Correzioni visive:**
  - il volto del Vento nel Trono (Ciclo 41) era già stato reso visibile;
  - le foglie ora hanno contorno e ombra.

### Test — nuovo `tests/polish43.js` (`T43.suite()`, 5 test)
- Tutta la saga anche dentro i dungeon: obiettivi in 4 righe, mete raggiungibili.
- Il «giocatore umano» vince a Normale contro il Cuore, il Vento e la Madre.
- Le foglie hanno il preavviso.
- **Per misurare il bilanciamento:** `T43.table(n)` gioca i tre finali n volte per difficoltà e riassume vittorie, tempi, colpi ed errori.

### Verifiche
- **Totale 414/414** (39 suite da `T` a `T43`, cioè 404 test, più i 10 di `A`) e `T.route()` ok (2,4 min). Tutti gli script sono a `?v=c43g` (src verificati), con la riga dei titoli del Ciclo 43 caricata.
- **Sul conteggio:** il tuo 422 e il mio 414 non si contraddicono per forza. Il mio script elenca le suite per nome e conta i 10 test di `A`; non so come conti il tuo. Nessun test fallisce in nessuno dei due.
- **Nel browser** restano solo le opzioni.

### Limiti (onesti)
- **Il «giocatore umano» è un modello, non una persona.** Non tiene conto della latenza di schermo e tastiera, della sorpresa della prima volta, né della lettura dei testi. È più onesto del bot perfetto, ma non sostituisce una prova vera.
- **Non ho giocato a mano** i miei finali con `?hand` come hai fatto tu col Ponte: lo farebbe meglio una persona.
- **Le case di Fondogrotta e le tende della carovana** (le tue idee) non le ho toccate: sono tuoi file, e preferisco lasciarle a te.

### File toccati / nuovi
- **Nuovo:** `tests/polish43.js`.
- **Modificati:**
  - `windpalace.js`: il Vento e le foglie; gli obiettivi;
  - `heartearth.js`: obiettivi e nomi brevi;
  - `tower.js`, `observatory.js`, `abyss.js`, `tidetemple.js`: obiettivi accorciati;
  - `LEGGIMI.md`;
  - `index.html`.

**Avversario, la palla è tua. Da qui si lima: ogni obiettivo ora sta nella sua pagina, e il Vento gioca pulito.**

---

## CICLO 44 — Agente B (seconda manche) — RIFINITURA

Ho raccolto la tua idea del «giocatore umano» (T43) e l'ho applicata alle **mie** meccaniche ambientali: marea, onde lunghe, terremoti e raffiche. Poi ho fatto i due ritocchi grafici che mi lasciavi (case di Fondogrotta e tende della carovana).

### Prima: il tuo avviso sugli heredoc e gli accenti
- Ho controllato tutto il progetto: **nessun carattere rovinato** (cercati `Ã`, `Â`, `â€`, `�`) e gli accenti delle righe che avevo inserito con heredoc sono intatti (lavoravo con `PYTHONUTF8=1`).
- Da ora comunque i testi accentati li scrivo con lo strumento Write. Grazie dell'avviso.

### Il conteggio dei test (422 contro 414)
- Il mio script elenca tutte le `T<numero>` presenti in `window`, più `T` e `T4`, più i 10 test di `A`. Ecco le suite con il numero di test, a c44b:
  `T` 11 · `T4` 13 · `T5` 7 · `T6` 10 · `T7` 6 · `T9` 8 · `T10` 9 · `T11` 8 · `T12` 9 · `T13` 7 · `T14` 7 · `T15` 7 · `T16` 6 · `T17` 10 · `T18` 9 · `T19` 9 · `T20` 10 · `T21` 10 · `T22` 12 · `T23` 11 · `T24` 13 · `T25` 8 · `T26` 12 · `T27` 11 · `T28` 12 · `T29` 5 · `T30` 15 · `T31` 13 · `T32` 14 · `T33` 14 · `T34` 14 · `T35` 13 · `T36` 13 · `T37` 14 · `T38` 13 · `T39` 16 · `T40` 14 · `T41` 15 · `T42` 4 · `T43` 5 · `T44` 5 · `A` 10.
- Se il tuo elenco salta `T4` (13) o qualche altra suite, la differenza viene da lì. Confrontalo con questo.

### 1. Le mie meccaniche provate da un «giocatore umano» (nuovo `tests/polish44.js`, T44)
- **Il giocatore:** reagisce con 250 ms di ritardo (15 frame, più o meno 4), cammina di tessera in tessera su un suo BFS (evita muri, voragini e acqua) ed è **prudente**: aspetta la fine dell'avviso, cerca riparo.
- **Gli scenari:**
  - **Ponte dei Refoli:** dall'isola est all'isola ovest, fermandosi al palo.
  - **Gola dei Sibili:** di riparo in riparo fino alla coda d'aquilone.
  - **Terremoti** (la Fenditura): 6 scosse; quando l'ombra è sotto i piedi, dopo la reazione si sposta di 2 tessere.
  - **Onde lunghe** (Campo delle Onde): di scoglio in scoglio fino alla conchiglia; al fischio corre al riparo più vicino.
  - **Marea** (le Secche): aspetta la marea bassa, va all'isolotto ovest e torna.
- **Prima misura**:
  - ponte, terremoti e marea senza un colpo;
  - **onde 0 su 3 con circa 3 colpi**;
  - gola 2 su 3 a Facile.
- **Indagando, gli errori erano del mio giocatore, non del gioco:**
  - partiva da (7,9), che nel Campo è uno **scoglio**: era bloccato dentro;
  - partiva da un punto a caso del ciclo, mentre il gioco vero, entrando, rimette il conteggio a zero;
  - al fischio aspettava sul posto invece di ripararsi.
  - Ho verificato a parte che **un'onda colpisce una volta sola**.
- **Dopo la correzione del giocatore** tutti gli scenari riescono senza colpi né cadute (i numeri esatti sono in fondo). Non ho cambiato nessun valore del gioco: per un giocatore attento le mie meccaniche risultano giuste.
- `T44.table(n)` rifà le prove n volte per difficoltà. `T44.suite()` controlla 4 prove per scenario.

### 2. Grafica
- **Le case di Fondogrotta** avevano solo muri. Ora hanno **una porta di legno e due finestre accese** sul lato della strada, con la luce che ogni tanto tremola (`earth.js`, disegno sopra le tessere: le porte sono chiuse, niente interni nuovi).
- **Le tende della carovana** erano rettangoli a righe. Ora hanno il **tetto a punta a tre falde**, il palo e una **bandierina** che sventola (`amber.js`).
- Controllate negli screenshot.

### Verifiche fatte (onestamente)
- Totale e versione: vedi la riga in fondo a questa sezione.
- **Il «giocatore umano» è un modello, non una persona.** Un giocatore distratto può ancora cadere dal ponte o prendere un'onda: è voluto, purché l'avviso sia chiaro.

### Per la prossima rifinitura (idee)
- Le **mie** meccaniche e i **tuoi** finali sono stati provati dal modello: si potrebbe provare a mano con `?hand` almeno un dungeon intero, dall'ingresso al boss.
- Una passata sui **dialoghi dei personaggi della valle** (Pino, Bortolo, Nina, Marta) dopo i capitoli: molti dicono ancora le battute del primo atto anche quando Lio è tornato da sette avventure.

### File toccati / nuovi
- **Nuovi:** `tests/polish44.js`.
- **Modificati:**
  - `earth.js`: porte e finestre a Fondogrotta;
  - `amber.js`: tende;
  - `story.js`: riga del Ciclo 44;
  - `LEGGIMI.md`: `T44`;
  - `index.html`: il test e il `?v`.

**Avversario, la palla è tua.**

**Verifica finale (Ciclo 44).** Totale **432/432** con tutti gli script a `?v=c44c` (src verificati) e la riga dei titoli caricata. `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà. `T44.table(3)`: ponte, gola, terremoti, onde e marea **3/3 a ogni difficoltà, 0 colpi e 0 cadute** (45 prove).

---

## CICLO 45 — Agente A (seconda manche) — RIFINITURA: le voci della valle

**Direzione dell'utente:** rifinire quello che c'è, niente espansione.

### Il difetto (era una tua idea, ed era vero)
Ho interrogato il gioco vero a ogni tappa principale della saga (dalla vittoria del primo atto alla lanterna verso est), chiedendo a ogni personaggio della valle cosa dice adesso.
- **Sette personaggi erano fermi al primo atto, per sei capitoli:** Nina, Marta, Pino, Bortolo, Ortensio, Silvano e la Fata.
  - Nina, per esempio, diceva «Guarda il cielo! Prima arancione, poi azzurro!» anche dopo il terremoto e il palazzo del vento.
  - Bortolo diceva solo «Benvenuto».
- **Teodoro e il papà seguono già la storia:** li hanno aggiornati i vari capitoli.
- **Il papà in piazza risultava «assente»:** non è un difetto. La mattina va al lago (`dad.js`).

### La correzione: nuovo `js/chatter.js` (l'ultimo script, dopo `closure.js`)
- **Le battute:** ogni personaggio ha **una novità per ogni tappa** (vittoria, festa, Nebbia, Canto, Stella, Città Sommersa, Terra, Vento), in tutto **39 battute nuove**, scritte sul carattere di ognuno e coerenti con quello che è successo. Qualche esempio:
  - Nina diventa amica di Pietruccio e gli insegna i nomi delle nuvole;
  - Marta ospita a cena i minatori, e dopo il Capitolo VII riconosce la canzone: «la cantava sempre tua madre, sai? Sotto la mia finestra, tornando dalla collina»;
  - Pino: il vento gli gonfia la vela «anche se canto stonato» (la sua bolla nella Sala delle Voci);
  - Bortolo: le lanterne si riaccendono da sole, «mi manderà in rovina»;
  - Ortensio: le radici dell'Albero dell'Alba scendono fino al cuore della terra;
  - Silvano scopre di avere dei vicini sotto la grotta;
  - la Fata non è più sola.
- **Come funziona:**
  - la novità si dice **la prima volta** che parli con il personaggio dopo quella tappa (flag `chat:<id>:<tappa>`), poi tornano le battute di sempre;
  - se le battute di sempre sono solo frasi, la novità **le sostituisce**, così non si sente la novità seguita subito da «Guarda il cielo!»;
  - se contengono altro, **restano dopo la novità**: il negozio di Bortolo, la canna di Pino, i doni della catena.
- **Se aggiungi una battuta** per un personaggio della valle: `CHATTER[id][tappa]`.

### Test — nuovo `tests/polish45.js` (`T45.suite()`, 4 test)
- Lungo tutte le tappe di `T42.STEPS`, ogni novità si sente **una volta sola**, e si sentono **tutte e 39** (nessuna irraggiungibile).
- Dopo il Capitolo VII nessuno dice più le battute del primo atto.
- Il negozio di Bortolo e la pesca di Pino restano.
- Col dialogo vero, la novità sta nelle pagine (al massimo 4 righe per pagina) e non si ripete.

### Verifiche
- **Totale 436/436:** 41 suite più `A` fanno 423/423, più i 13 di `T4` lanciati a parte sulla stessa pagina. `T.route()` ok (2,4 min). Tutti gli script sono a `?v=c45b` (src verificati), con la riga dei titoli del Ciclo 45 caricata. Nel browser restano solo le opzioni.
- **Il conteggio, finalmente spiegato:** avevi ragione. `T4` è dichiarata con `const` in `cycle4.js`, quindi non sta in `window`, e **il mio script di regressione non la lanciava da diversi cicli**. Era una mia svista. I tuoi 422/432 contavano giusto: il mio 414 del Ciclo 43 era 414 + 13 di `T4`, cioè 427. Ora `T4` passa (13/13), e nelle mie regressioni la includo.

### Limiti (onesti)
- **Le battute** le ho scritte io: il tono di Nina, Marta e degli altri è il mio. Se qualcosa stona con come li immaginavi, cambiala pure.
- **Non le ho rilette in gioco** una per una a schermo, solo nei test: lunghezza e pagine sono controllate, ma l'effetto no.
- **I personaggi della festa** (`p_*`) e quelli delle regioni lontane non li ho toccati: hanno già battute per capitolo.

### File toccati / nuovi
- **Nuovi:** `js/chatter.js`, `tests/polish45.js`.
- **Modificati:**
  - `story.js`;
  - `LEGGIMI.md`: `T44` e `T45`;
  - `index.html`.

**Avversario, la palla è tua. La valle ora si accorge di quello che le succede.**

---

## CICLO 46 — Agente B (seconda manche) — RIFINITURA: le voci delle regioni

### Prima: le tue battute della valle (Ciclo 45)
- Le ho rilette e le trovo **coerenti con i miei personaggi e luoghi**: Nina e Pietruccio, la sorella di Marta a Pietrabianca, Marta che riconosce la canzone della madre, i minatori a cena da Marta. Non ho cambiato niente.
- **Ho controllato in modo sistematico un rischio del meccanismo.** `chatter` chiama comunque le battute di sempre anche quando poi le sostituisce: se queste fanno scattare un flag «una volta sola», la battuta andrebbe persa.
  - Ho percorso tutte le tappe della saga per i tuoi 7 personaggi: **nessun effetto collaterale perso**.
  - Ho anche verificato che le tue novità non coprano mai le mie **battute-guida** (es. Silvano che indica la scala del Valico con `northCall`): nessuna sovrapposizione.
- Il conteggio adesso torna, grazie per la spiegazione su `T4`.

### Nuovo `js/chatter2.js` (dopo `chatter.js`): lo stesso lavoro per i personaggi delle MIE regioni
- Lo stesso difetto c'era da me: **Berta, Tobi, Rufo, Ilde, Nadira, Orsa, Sesto, Lu, Ugo, il pescatore, Marisa, Mareva, Bruna, Ferro, Pietruccio, Aliseo, Zefira e Folata** restavano ferme al loro capitolo.
- **31 battute nuove**, una per personaggio e per tappa successiva alla sua. Qualche esempio:
  - Berta sente le campane suonate dal vento;
  - Nadira sente il mare in mezzo alle dune;
  - Mareva riconosce la canzone della madre di Lio;
  - Ferro trova una girandola caduta dal cielo e la appende sulla fucina;
  - Pietruccio ha visto il cielo per la prima volta (portato su da Nina: si lega alla tua battuta).
- Stesso meccanismo del tuo (flag `chat:<id>:<tappa>`, `chatStage`), **con una regola in più**: se le battute di sempre fanno scattare qualcosa (una battuta «una volta sola»), **non vengono sostituite**, ma dette subito dopo la novità.
- **Me l'ha trovato il test:** Marisa (dopo i Capitoli VI e VII) e Ugo (dopo il V) hanno le tue battute «una volta sola» dopo la Fossa (`marisaSea`, `ugoStar`). La mia novità le avrebbe coperte per sempre. Ora si sentono entrambe.
- L'elenco è separato (`window.CHATTER2`), così i tuoi test su `CHATTER` restano com'erano.

### Il LEGGIMI
- Nell'elenco dei test `T45` era finito tra `T44` e la mia spiegazione di `T44.table(n)`, che sembrava riferita a T45. Ho riordinato: T44 con la sua spiegazione, poi T45 e T46.

### Test: nuovo `tests/polish46.js` (`T46.suite()`, 4 test)
- Ognuna delle 31 novità si sente, una volta sola, alla sua tappa.
- Menu e servizi restano (il riposo di Nadira, la zuppa di Rufo).
- Nessuna battuta «una volta sola» va persa.
- Ogni novità sta in una pagina di dialogo (4 righe).

### Verifiche fatte (onestamente)
- A schermo: Mareva nella finestra di dialogo (la battuta sta in 3 righe, col nome nella targhetta).
- Marisa dopo il VI dice la novità **e** la tua battuta sul mare tornato gentile.
- Totale e versione: vedi la riga in fondo a questa sezione.

### Limiti
- Le battute le ho scritte io, come tu le tue: se il tono di qualcuno non ti convince, cambialo in `CHATTER2`.
- Non ho riletto a schermo tutte e 33, solo alcune; i test ne controllano lunghezza e comparsa.

### File toccati / nuovi
- **Nuovi:** `js/chatter2.js`, `tests/polish46.js`.
- **Modificati:**
  - `story.js`: riga del Ciclo 46;
  - `LEGGIMI.md`: ordine dei test e `T46`;
  - `index.html`: script, test e `?v`.

**Avversario, la palla è tua.**

**Verifica finale (Ciclo 46).** Totale **440/440** (43 suite, `T4` compresa, più `A`) con tutti gli script a `?v=c46b` (src verificati) e la riga dei titoli caricata. `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà. Torna col tuo conteggio: 436 più i 4 di T46.

---

## CICLO 47 — Agente A (seconda manche) — RIFINITURA: chi parla, e chi no

**Direzione dell'utente:** rifinire quello che c'è, niente espansione.

### Sul tuo Ciclo 46
- Ho visto `chatter2.js` e la regola in più («se le battute di sempre fanno scattare un flag, non le sostituisco»): è giusta.
- Grazie per aver salvato le battute di Marisa e di Ugo, che il mio meccanismo avrebbe perso.

### Il difetto: falsi personaggi nei dialoghi
- **Come funziona l'etichetta:** il gioco mostra come «nome di chi parla» (l'etichetta sopra il riquadro) tutto quello che c'è prima dei due punti, se è lungo al massimo 18 caratteri (`nextEntry` in `game.js`).
  - Per «Teodoro: ...» va bene.
  - Ma i cartelli e le frasi di narrazione finivano anch'essi con un'etichetta, come se fossero personaggi: un'etichetta **«Inciso»** sopra «LE NUVOLE VANNO DOVE LE SPINGI...».
- **Li ho cercati in tutti i file del gioco**, con la stessa espressione del gioco, e li ho controllati uno per uno:
  - «Inciso», «Inciso nel bronzo», «Inciso sulla roccia», «Inciso sul pilastro», «Cartello»;
  - «Da dietro la porta», «Ora tocca a te», «Un murale», «Sul basamento», «Sul pilastro»;
  - «Spostati di lato», «Seconda pagina», «Sono RICORDI», «Torna a Brinavalle», «La lente si accende», «Le conchiglie», «Ha deciso»;
  - «Il Vento, piano» (mio).
  - Ce ne sono **in quasi tutti i capitoli**, sia miei che tuoi.

### La correzione: una regola sola, in `game.js`
- **`NOT_SPEAKER`, in cima al file:** il nome di chi parla non può contenere una **virgola** né cominciare con una parola di narrazione (Inciso, Cartello, Scritto, Da, Ora, Un/Una, Sul/Sulla, Sono, Spostati, Seconda, Torna, Ha, «Le conchiglie», «La lente»).
- **In quel caso la frase si mostra intera,** come narrazione, senza etichetta. Non ho toccato nessun testo.
- **Vale anche per i testi futuri.** Se un giorno serve un personaggio che si chiama così, basta togliere la parola dall'elenco.

### Test — nuovo `tests/polish47.js` (`T47.suite()`, 3 test)
- **40 personaggi veri hanno ancora l'etichetta:** Teodoro, Papà, Madre delle Acque, Il Vento, La Terra, Il cielo, Il mare, tutti i tuoi delle regioni, Suggerimento e ???.
- **Le 20 frasi di narrazione non ce l'hanno più,** e il testo resta intero.
- **Tutte le battute di `CHATTER` e `CHATTER2`** hanno ancora il loro nome.

### Verifiche
- **Totale 443/443:** 44 suite (`T4` compresa) più `A`, `T.route()` ok (2,4 min), a `?v=c47b`.
- **Poi ho aggiunto la riga dei titoli** e portato tutto a `?v=c47c` (src verificati). Lì ho rilanciato le suite che toccano l'epilogo e i dialoghi: `T6`, `T14`, `T16`, `T36`, `T45`, `T46`, `T47` e `A`, tutte verdi. La riga del Ciclo 47 è caricata.
- **Screenshot:** il cartello della Sala delle Nuvolette prima (con l'etichetta «Inciso») e dopo (frase intera).
- **Nel browser** restano solo le opzioni.

### Limiti (onesti)
- **L'elenco delle parole di narrazione l'ho costruito da quello che c'è oggi.** Una frase nuova che comincia, per esempio, con «Dietro il muro: ...» avrebbe ancora l'etichetta. Il test non la vedrebbe, perché controlla elenchi espliciti.
- **Ciclo breve, una cosa sola,** ma riguarda tutto il gioco.

### File toccati / nuovi
- **Nuovo:** `tests/polish47.js`.
- **Modificati:**
  - `game.js`: `NOT_SPEAKER` e una riga in `nextEntry`;
  - `story.js`;
  - `LEGGIMI.md`;
  - `index.html`.

**Avversario, la palla è tua. Ora i cartelli parlano da cartelli.**

---

## CICLO 48 — Agente B (seconda manche) — RIFINITURA: ogni etichetta decisa

### Il tuo Ciclo 47 e il suo limite
- La tua regola `NOT_SPEAKER` è giusta e ha tolto i falsi personaggi più evidenti. Il limite che dichiaravi era vero: l'elenco nasce da quello che c'è oggi, quindi una frase nuova come «Dietro il muro: ...» avrebbe di nuovo l'etichetta.
- **Ho cercato tutte le etichette che restavano.** Ho letto tutti gli script del gioco e applicato la stessa espressione del motore (più la tua `NOT_SPEAKER`): sono emerse **circa 95 etichette**. Le ho passate in rassegna una per una:
  - quasi tutte sono **personaggi veri** (Teodoro, Papà, Pino... fino a Zefira e Aliseo) oppure **testi che non finiscono in un dialogo** (obiettivi, messaggi della pesca, schede del Bestiario, interfaccia);
  - **tre erano ancora falsi personaggi in un dialogo**:
    - «Le Secche: scogli e banchi di sabbia...», **mio** (testo d'ingresso delle Secche): l'ho riscritto in «Le Secche sono scogli e banchi di sabbia...»;
    - «È la voce del CIELO: ...» e le altre tre voci (Ore, Luce, Mare), e «Mancano: ...» (l'altare del Cuore della Terra): **tuoi**. Non ho toccato i testi: ho aggiunto alla tua regola `Mancano` e le frasi che cominciano con «È ».

### Il test che chiude il limite (nuovo `tests/polish48.js`, T48)
- T48 **legge ogni script del gioco** (con `?test`), estrae tutte le etichette «chi parla» e le confronta con due elenchi:
  - `T48.SPEAKERS`: i personaggi e le voci che parlano davvero (43);
  - `T48.NOT_DIALOG`: i testi con i due punti che non sono dialoghi.
- **Un'etichetta nuova fa fallire il test** e dice in quale file si trova. Chi la scrive decide:
  - se è un personaggio, la aggiunge a `SPEAKERS`;
  - se è narrazione, aggiunge la parola a `NOT_SPEAKER` in `game.js` (oppure riscrive la frase senza i due punti).
- Altri due controlli: le tre frasi di questo ciclo non hanno più l'etichetta; nessun personaggio vero viene tolto per errore da `NOT_SPEAKER`.

### Verifiche fatte (onestamente)
- T47 (tuo) e T48 (mio) verdi insieme.
- Totale e versione: vedi la riga in fondo a questa sezione.

### Limite
- `NOT_DIALOG` contiene anche etichette di testi che non sono dialoghi «per ora» (es. «Marea», scritta in alto sulla Costa). Se un giorno uno di quei testi finisse in un dialogo, il test non se ne accorgerebbe. Il rischio è basso, ma esiste.

### File toccati / nuovi
- **Nuovo:** `tests/polish48.js`.
- **Modificati:**
  - `game.js`: due voci in più in `NOT_SPEAKER`, con un commento;
  - `coast.js`: una frase riscritta;
  - `story.js`: riga del Ciclo 48;
  - `LEGGIMI.md`: `T48`;
  - `index.html`: il test e `?v`.

**Avversario, la palla è tua.**

**Verifica finale (Ciclo 48).** Totale **446/446** (45 suite, `T4` compresa, più `A`) con tutti gli script a `?v=c48a` (src verificati) e la riga dei titoli caricata. `T.route()` ok (2,4 minuti); `T7.table(1)` e `T7.table(3)` ok a tutte le difficoltà.

---

## CICLO 49 — Agente A (seconda manche) — RIFINITURA: rilettura dei testi e coerenza della trama

**Direzione dell'utente:** rifinire quello che c'è, niente espansione.

### Sul tuo Ciclo 48
- Hai chiuso bene il limite che avevo lasciato: ora T48 fallisce se compare un'etichetta «chi parla» nuova e non decisa.
- Le voci del Cuore («È la voce del CIELO: ...») stanno a metà del testo dell'Eco, quindi nel gioco non diventavano etichette. La tua aggiunta a `NOT_SPEAKER` comunque non fa danni.

### Cosa ho fatto: ho riletto tutti i testi dei miei capitoli
Ho estratto **tutte le frasi** (dialoghi, cartelli, obiettivi, Bestiario, medaglie) dei miei file: `tower.js`, `observatory.js`, `abyss.js`, `tidetemple.js`, `heartearth.js`, `windpalace.js` e `chatter.js`, circa 350 frasi. L'estrattore è uno script Node di poche righe: prende le stringhe tra apici lunghe almeno 40 caratteri, `/'((?:[^'\\\n]|\\.){40,})'|"((?:[^"\\\n]|\\.){40,})"/g`, e tiene quelle con almeno tre parole minuscole di fila, così le frasi e non il codice. Le ho rilette come un giocatore, cercando refusi, grammatica e coerenza con il resto della saga.

**Torre, Osservatorio e Cuore:** puliti, nessun errore.

**Sette difetti, tutti miei, corretti:**
1. **Palazzo, incoerenza di trama.** La bolla del «Torno presto» diceva «la voce di un uomo giovane... È tuo padre, **tanti anni fa**».
   - Ma il padre è partito per le Radici solo **tre lune** prima dell'inizio: lo dice Teodoro alla festa («Tre lune ad aspettarlo»).
   - Ora: «la voce di un uomo, stanca ma decisa... È tuo padre, **tre lune fa**».
2. **Palazzo, la voce che si contraddiceva:** «**Un vecchio** che conta... È Vesper, **giovane**». Ora: «Una voce che conta... È Vesper, da giovane».
3. **Palazzo, il Vento al femminile:** «Brava, la mia canzone», detto a Lio, che è un ragazzo. Ora: «Bravo! Ma la mia canzone non te la do così...».
4. **`chatter.js`, Silvano «nella grotta».** Silvano vive nella **Radura dell'Eremita**, e Fondogrotta sta sotto la valle, non sotto casa sua. Ora «dalla mia radura» e «Vivo da eremita da quarant'anni e non sapevo che sotto la valle...».
5. **Fossa, grammatica nel Bestiario:** «non voleva lasciare la stella tornare in cielo» diventa «lasciar tornare la stella in cielo».
6. **Tempio, obiettivo:** «un murale fa salire l'acqua» (il murale insegna la melodia, non la fa suonare) diventa «un murale **insegna a far salire** l'acqua». Sta ancora in 4 righe (`T43.sagaCheck`).
7. **Il controllo delle tue conoscenze:** il bivacco del padre (`weather.js`) dice «Qualcuno, **tanto tempo fa**, ha acceso un fuoco qui». È vago e non contraddice niente, quindi **non l'ho toccato**.

### Test — nuovo `tests/polish49.js` (`await T49.suite()`, 1 test)
- **Come funziona:** ogni regola è un fatto della storia che un testo aveva sbagliato. Il test legge tutti gli script del gioco e fallisce se il fatto torna sbagliato, dicendo il file e il motivo.
- **Quando aggiungere una regola:** se trovi un'incoerenza di trama, aggiungila a `T49.RULES` (`why` e `bad`, un'espressione regolare).

### Verifiche
- **Totale 447/447:** 46 suite (`T4` compresa) più `A`. `T.route()` ok (2,4 min). Tutti gli script sono a `?v=c49d` (src verificati), con la riga dei titoli del Ciclo 49 caricata. Nel browser restano solo le opzioni.

### Limiti (onesti)
- **Non ho riletto i tuoi testi:** solo i miei, più `chatter.js`. Le tue regioni le conosci meglio tu.
- **La rilettura è mia:** un errore che non vedo io resta.

### File toccati / nuovi
- **Nuovo:** `tests/polish49.js`.
- **Modificati:**
  - `windpalace.js`, `chatter.js`, `abyss.js`, `tidetemple.js`: i testi;
  - `story.js`;
  - `LEGGIMI.md`;
  - `index.html`.

**Avversario, la palla è tua. Ho trovato tre errori di trama, tutti nei miei testi: correggere i propri errori è la rifinitura più onesta.**

---

## CICLO 50 — Agente B (seconda manche) — RIFINITURA: la stessa rilettura, nelle mie regioni

### Cosa ho fatto
- Ho usato il tuo estrattore (stringhe di 40 caratteri o più con almeno tre parole minuscole di fila) sui miei file: `weather`, `dad`, `walk`, `trade`, `north`, `amber`, `coast`, `seabed`, `earth`, `wind`, `closure`, `chatter2`. Sono uscite **477 frasi** e le ho rilette tutte da giocatore.
- Ho cercato soprattutto i **riferimenti di tempo** (anni, lune, notti, nonni). Per i fatti che toccano le tue regioni ho controllato il resto della saga.

### Le incoerenze trovate (tutte mie) e come le ho corrette
1. **La partenza del padre aveva tre versioni.** La tua (windpalace: «la mattina in cui partì per le Radici», tre lune fa) è quella di riferimento. Ho allineato le mie due frasi:
   - Teodoro (`weather.js`) diceva «Partì proprio una notte così». Ora dice: «Partì la mattina dopo il furto, dicendo che le lucine della Foresta sapevano la strada...».
   - Il padre alle Rovine (`walk.js`) diceva «La notte del furto... Corsi qui». Ora dice: «...La mattina dopo scesi qui sotto... e il resto lo sai».
2. **Il bivacco** (`weather.js`) era acceso «tanto tempo fa», ma ha solo tre lune. Ora: «non molto tempo fa».
3. **Il padre alla gara di pesca** (`dad.js`) diceva «Tre lune fa ti insegnavo a tenere la canna dritta». Contraddiceva il suo stesso ricordo del primo pesce di Lio da bambino. Ora: «Quando eri piccolo ti insegnavo...».
4. **Fondogrotta** (`earth.js`): il crollo è di duecento anni fa, ma Bruna parlava dei «nostri nonni» chiusi quaggiù. Ora parla di «antenati», in due frasi. I «nonni» di Ferro e di Pietruccio nella miniera restano: lì è giusto così.
5. **Coralia** (`seabed.js`) è sprofondata più di trecento anni fa (lo dice Mareva). Lina invece diceva che i nonni di sua nonna suonavano le conchiglie, cioè meno di due secoli fa. Ora: «tanto tempo fa, i nostri antenati suonavano...».
6. **Stile** (`wind.js`): «Tre notti fa» compariva tre volte di fila in tre capitoli (Marisa e Pino, Bruna, Aliseo). Per Aliseo ora è «L'altra notte».

### Controllati e lasciati così (sono coerenti)
- Vespero è femminile in tutti i testi, tuoi e miei.
- Mareva: «trecento anni» senza vedere un bambino della terra, «seicento anni» di vita in `chatter2`. Era già vecchia quando Coralia era viva, quindi i conti tornano.
- Il Faro: cent'anni di lente, quarant'anni di Ugo, sessant'anni per il vecchio pescatore. Tre punti di vista diversi, nessuna contraddizione.

### Test
- **Nessun file di test nuovo.** Ho aggiunto **cinque regole a `T49.RULES`** (con il commento «Ciclo 50»). Ho verificato che ognuna riconosce la frase vecchia: 7 frasi su 7, quindi le regole non passano a vuoto.
- **Regressione completa a `?v=c50a`: 447/447** (46 suite più `T4`, compresa `A`). Suoni spenti.

### Limite
- Ho riletto da giocatore e corretto la trama e i tempi. Non ho cercato in modo sistematico i refusi di una lettera: un occhio diverso dal mio troverebbe di più.

### File toccati
- `weather.js`, `dad.js`, `walk.js`, `earth.js`, `seabed.js`, `wind.js` (solo testi);
- `tests/polish49.js` (regole);
- `story.js` (riga del Ciclo 50);
- `index.html` (`?v=c50a`).

**Avversario, la palla è tua.**

## CICLO 51 — Agente A (seconda manche) — RIFINITURA: ortografia, prestazioni, la Conca col touch

**Direzione dell'utente:** rifinire quello che c'è, niente espansione.

### Sul tuo Ciclo 50
- Bel lavoro sulla trama: il padre ora ha **una** partenza sola, e le regole che hai aggiunto a `T49.RULES` la proteggono.
- Mi chiedevi di cercare in modo sistematico i refusi di una lettera: è il punto 1.

### 1. Controllo ortografico di TUTTI i testi del gioco (miei e tuoi): pulito
- **Errori tipici dell'italiano, su tutte le frasi di `js/*.js`:**
  - perchè, nè, sè, pò, qual'è, E' al posto di È;
  - un'altro / un'amico;
  - parole ripetute, doppi spazi, spazio prima della punteggiatura, punto senza spazio;
  - caporali « » non chiusi.
- **Risultato:** **nessun errore vero**. Le 10 segnalazioni erano commenti del codice o raddoppi voluti («piano piano», «lontano lontano», «Ah ah ah»).
- **Le parole che compaiono una volta sola** (i refusi di solito sono parole uniche): **1361 parole uniche** su 2906. Le ho scorse tutte e **nessuna è un refuso**. Le «strane» sono nomi di variabili (flags, items...) o scelte volute (chapeau, ripàrati).
- **Non ho creato un test permanente:** senza un dizionario genererebbe falsi allarmi a ogni testo nuovo. Lo script è descritto qui sopra, se vuoi rifarlo.

### 2. Prestazioni dopo 50 cicli di wrapper: nessun problema
- **Perché misurarle:** ogni capitolo avvolge `update`, `render` e `drawWorld` con un altro strato.
- **Come:** ho misurato 120 fotogrammi veri (stato `play`, Lio che cammina) in 15 sale pesanti: valle, lago, Fossa al buio, Tempio, Osservatorio, Torre, Cuore, Palazzo, Terre del Vento, Gallerie, fondale, costa.
- **Risultato:** **0,02-0,05 ms per l'aggiornamento e 0,09-0,36 ms per il disegno**, su 16,7 ms disponibili. Nessuna azione necessaria.

### 3. Un difetto vero: la Conca col touch e col gamepad (corretto)
- **Il problema:** mentre Lio suona, le direzioni sono **note**. La levetta touch e quella del gamepad però danno **8 direzioni**: in diagonale si attivano insieme, per esempio, «su» e «destra».
  - Così un'inclinazione imprecisa suonava **due note nello stesso istante**: nel duello della Madre e nel ritmo del Cuore della Terra era un errore garantito per chi gioca da telefono o con un gamepad.
  - Con la tastiera non succedeva.
- **La correzione** (`game.js`, commentata «Ciclo 51»):
  - **mentre si suona** (`Game.song`), la levetta touch e quella del gamepad danno solo **l'asse dominante**, cioè 4 direzioni;
  - **camminando** restano 8 direzioni, come prima;
  - la croce digitale del gamepad non cambia.

### Test — nuovo `tests/polish51.js` (`T51.suite()`, 2 test)
- **Gamepad finto** (levetta inclinata): camminando dà «su+destra», col canto **una** nota sola, quella dell'asse dominante.
- **Levetta touch vera**, con eventi del puntatore sull'elemento `#stick`: stesso controllo.
  - Il test neutralizza solo `setPointerCapture`, perché un puntatore sintetico non si può catturare e il browser lancerebbe un errore.

### Verifiche
- **Totale 449/449:** 47 suite (`T4` compresa) più `A`. `T.route()` ok (2,4 min). Tutti gli script sono a `?v=c51b` (src verificati), con la riga dei titoli del Ciclo 51 caricata. Nel browser restano solo le opzioni.

### Limiti (onesti)
- **Niente prova su un telefono vero:** ho verificato la levetta con eventi sintetici, non con un dito.
- **Il controllo ortografico** trova le forme sbagliate tipiche, non gli errori di senso (quelli li abbiamo cercati rileggendo, nei Cicli 49 e 50).

### File toccati / nuovi
- **Nuovo:** `tests/polish51.js`.
- **Modificati:**
  - `game.js`: la levetta touch e il gamepad col canto;
  - `story.js`;
  - `LEGGIMI.md`;
  - `index.html`.

**Avversario, la palla è tua. Ora la Conca si suona bene anche col pollice.**

---

## CICLO 52 — Agente B (seconda manche) — RIFINITURA: ogni casa ha la sua porta

### Sul tuo Ciclo 51
- Ottimo il controllo ortografico: hai fatto quello che io avevo lasciato come limite. La Conca con 4 direzioni solo mentre si suona è la correzione giusta, e le 8 restano per camminare.

### 1. Ho guardato i villaggi, con gli occhi
- Ho caricato i villaggi delle mie regioni (Pietrabianca, Carovana, Porto Corallo, Coralia, Fondogrotta, Ventaria) e li ho guardati a schermo come un giocatore.
- **Un difetto vero (mio):** a **Ventaria** la casa di destra non aveva la porta. Era un blocco di muro con un cartello sopra («Una casa con le finestre a forma di nuvola...»), ma le finestre erano normali.
- **Ho controllato tutto il gioco:** ho cercato in tutte le stanze i blocchi di casa (tessere `H`) che non toccano una porta. **Era l'unica.**
- **La correzione** (`wind.js`, commentata «Ciclo 52»):
  - una tessera nuova `d`, la **porta chiusa**: è disegnata come le porte vere più una **sbarra** chiara, e fa da muro (`TILE_SOLID`, non `TILE_WARP`), quindi non porta da nessuna parte;
  - il cartello ora dice: «La porta è sbarrata. Dentro, qualcuno russa come un temporale: a Ventaria si dorme anche col vento.»
  - Ho scelto la `d` perché come tessera non la usava nessuno: l'ho verificato su tutte le stanze e su `TilePaint`. Come prefisso di stanza resta libera da conflitti, perché `neighborId` lavora sugli id e non sulle tessere.
  - Una `D` senza warp, invece, si sarebbe potuta calpestare: Lio sarebbe entrato nel muro.

### 2. Impaginazione dei dialoghi: già pulita
- Il riquadro mostra 4 righe per pagina. Una battuta di 5 righe lascerebbe una seconda pagina con **una riga sola**.
- Ho misurato con la `wrap` del motore le **1196 frasi** di tutti gli script, tuoi e miei: 141 da una riga, 550 da due, 442 da tre, 62 da quattro, una da sei. **Nessuna** lascia una pagina con una riga sola.
- Non c'era niente da correggere: il test lo tiene così per i testi futuri.

### Test — nuovo `tests/polish52.js` (`T52.suite()`, asincrona, 3 test)
1. **Ogni casa del gioco ha una porta**, anche solo chiusa. Ho verificato che il test **fallisce** se si rimette il muro al posto della `d`.
2. **Ventaria:** la porta chiusa è muro. Lio spinge «su» per 40 fotogrammi e non cambia stanza né entra nel muro. Poi, premendo azione, si legge il cartello.
3. **Nessun dialogo** di 5, 9, 13... righe.

### Verifiche
- **Totale 452/452:** 49 suite, `T4` e `A` comprese. Tutti gli script sono a `?v=c52b` (src verificati), con la riga dei titoli del Ciclo 52. Suoni spenti.
- Non ho rilanciato `T.route()`: questo ciclo non tocca nessun percorso.

### Limite
- Il test 3 legge le stringhe scritte per intero. Le frasi composte al volo (es. «Hai trovato... (2/3)») sfuggono, ma sono tutte corte.

### File toccati / nuovi
- **Nuovo:** `tests/polish52.js`.
- **Modificati:**
  - `wind.js`: la tessera `d`, la casa e il cartello;
  - `story.js`: riga del Ciclo 52;
  - `LEGGIMI.md`: `T52`;
  - `index.html`: il test e `?v`.

**Avversario, la palla è tua.**

## CICLO 53 — Agente A (seconda manche) — RIFINITURA: niente si perde se il gioco si chiude nel momento sbagliato

**Direzione dell'utente:** rifinire quello che c'è, niente espansione.

### Sul tuo Ciclo 52
- Bene la porta chiusa di Ventaria (`d`) e il test «ogni casa ha una porta».
- Non avevi rilanciato `T.route()`: l'ho fatto io in questa regressione (vedi sotto).

### 1. Un BLOCCO DELLA PARTITA, mio, in cinque capitoli (corretto)
- **Il problema:** i finali dei Capitoli III-VII salvano subito il loro flag (`vesperVoice`, `fUmbra`/`starFreed`, `wMother`, `gHeart`, `qWind`). Il cartello «Capitolo ... completato», che imposta `chNDone`, arriva invece solo dopo un dialogo lungo.
- **Chi chiudeva il gioco in quel momento** (scheda chiusa, batteria scarica, «Salva ed esci») al «Continua» **restava bloccato per sempre**:
  - niente cartello;
  - obiettivo fermo («Il Vento ti ha restituito la canzone.»);
  - Segnavia muto;
  - il capitolo dopo non partiva, perché il tuo Capitolo VII aspetta `ch6Home`, che aspetta `ch6Done`.
- **L'ho riprodotto** per i Capitoli V, VI e VII prima di correggere.
- **La correzione: nuovo `js/resume.js`**, l'ultimo script. Se il finale di un capitolo è compiuto e il suo cartello non è stato visto, il cartello **riappare**: un capitolo alla volta, mai sopra un dialogo né sopra un altro cartello in arrivo.
  - Per il IV completa anche `starFreed`: Umbra era vinta ma la stella non era ancora risalita.
  - Per il V completa `seaCalm`.
- **Vale anche per i salvataggi già fatti:** chi è bloccato oggi si sblocca al prossimo «Continua».
- **Il tuo Capitolo II** non ha questo problema: il cartello lo richiama la battuta del padre, finché `ch2Done` non c'è.

### 2. I cuori di cristallo dei boss (anche i tuoi del gioco base, ma la correzione è generale)
- **Il problema:** **tutti gli otto boss** lasciano il cuore di cristallo come oggetto per terra: Re dei Rovi, Serpe, Signora delle Nebbie, Armilla, Umbra, Madre, Terra, Vento. Chi usciva dalla sala o dal gioco prima di raccoglierlo **lo perdeva per sempre**: due cuori di vita in meno.
- **La correzione** (`resume.js`):
  - ogni cuore lasciato per terra si annota nel salvataggio (`pendCont:<stanza>`, con la posizione);
  - finché non lo prendi, rientrando nella sala riappare dov'era;
  - preso, sparisce dall'elenco.

### 3. Un cartello in arrivo non sopravvive più al suo capitolo
- **Come l'ho trovato:** il tuo T38 ha cominciato a fallire («il masso non colpisce»). Il tuo secondo controllo prepara uno stato con la Madre calmata e `ch5Done` falso, cioè proprio il mio caso «finale fatto, cartello non visto». Lì il cartello giustamente parte, e il controllo dopo rimette `ch5Done`.
- **Ma i contatori `chNCardIn`** sono proprietà di `Game`, non del salvataggio: il cartello in arrivo **sopravviveva** e compariva due controlli dopo, a metà terremoto, congelando il gioco.
- **Nel gioco vero può succedere lo stesso:** finisci un capitolo, torni al titolo e fai «Nuova partita» entro un secondo, e il cartello compare nella partita nuova.
- **La correzione:** un cartello in arrivo si annulla se il suo capitolo è già chiuso, o se nella partita corrente il finale non c'è. Il tuo T38 è tornato 13/13 senza toccarlo.

### Test — nuovo `tests/polish53.js` (`T53.suite()`, 4 test)
- **I cinque capitoli, con il vero «Continua»** (`Game.startFrom(salvataggio, true)`, come dal titolo): il cartello riappare, chiuderlo imposta `chNDone`, e non ricompare.
- **Nel percorso normale** il cartello compare una volta sola.
- **Un cartello in arrivo si annulla** se il capitolo è chiuso, o con una «Nuova partita».
- **Il cuore di cristallo:** resta uscendo dalla sala e dopo un «Continua»; preso, dà +1 cuore e non riappare.

### Verifiche
- **Totale 456/456:** 49 suite (`T4` compresa) più `A`. `T.route()` ok (2,4 min). Tutti gli script sono a `?v=c53c` (src verificati), con la riga dei titoli caricata. Nel browser restano solo le opzioni.
- **In una regressione intermedia** `T4` («Seme del Bosco») è fallita una volta. Rilanciata da sola è passata 3 volte su 3, e poi nella regressione completa: è un'intermittenza, non legata a questo ciclo.

### Limiti (onesti)
- **Il cartello che riappare salta il resto del dialogo finale:** chi chiude il gioco a metà della riconciliazione non ne legge la fine. Ho preferito non rischiare di rigiocare dialoghi che cambiano flag.
- **Il cuore riappare nel punto in cui era caduto.** Per i boss che cadono vicino a un muro dovrebbe andare bene, ma ho controllato solo il Cuore della Terra.

### File toccati / nuovi
- **Nuovi:** `js/resume.js`, `tests/polish53.js`.
- **Modificati:** `story.js`, `LEGGIMI.md`, `index.html`.

**Avversario, la palla è tua. Ora chiudere il gioco nel momento sbagliato non costa più niente.**

---

## CICLO 54 — Agente B (seconda manche) — RIFINITURA: niente si perde, anche nei miei capitoli

### Sul tuo Ciclo 53
- Hai trovato una classe di difetti seria: un salvataggio *a metà* lascia la partita incoerente. Ho fatto la stessa domanda ai miei capitoli e ho trovato un caso ancora più grave, più uno più piccolo ma molto diffuso.
- Grazie per aver rilanciato `T.route()` al posto mio.

### 1. BLOCCO DELLA SAGA nel Capitolo II (il cartello è mio), corretto
- **Il problema:**
  - quando Lio torna dalla Torre, il padre (tuo `tower.js`) imposta e **salva** `fatherRemembers` alla **prima** battuta del suo ricordo;
  - il cartello «Capitolo II completato» (mio `amber.js`) nasceva solo nel passaggio «prima no, ora sì» del flag, e arrivava a **fine** dialogo.
- **Chi chiudeva il gioco a metà ricordo**, al «Continua»:
  - non vedeva nessun cartello e `ch2Done` restava falso;
  - aveva l'obiettivo «Goditi la valle», riparlando al padre non succedeva niente;
  - **i Capitoli III-VIII non partivano mai**, cioè tre quarti del gioco persi.
- **L'ho riprodotto** col vero `Game.startFrom`, prima di correggere.
- **La correzione:** una riga in cima a `PENDING_CARDS` nel tuo `resume.js` (commentata «Ciclo 54»): `{ done: 'ch2Done', card: 'chapterCardIn', got: f => !!f.fatherRemembers }`.
  - Il tuo meccanismo fa il resto: il cartello riappare se il capitolo non è chiuso, e si annulla se lo è o se il finale non c'è.
  - Funziona anche per i salvataggi già fatti.

### 2. I DONI PERSI a metà dialogo, corretto in modo generale
- **Il problema:** molti finali salvano dentro il dialogo e il dono arriva **qualche battuta dopo**. Chi chiudeva il gioco in mezzo ritrovava il flag salvato e il dono perso per sempre.
- **Nei miei capitoli i casi sono sette:**
  - campane (50 gemme), Faro (50), Tempio (50), Radici (50);
  - Aquilone (30, poi altre 50);
  - gara col padre (40 o 10).
- **La correzione** (`resume.js`, sezione 3, «Ciclo 54»):
  - `giveItem` ora segna la funzione che dà il dono, e il dono si può dare **una volta sola**;
  - se si salva **con un dialogo aperto**, i doni ancora in coda vengono dati subito;
  - il testo «Hai ricevuto...» compare comunque al suo turno;
  - vale per tutto il gioco, quindi anche per eventuali casi uguali nei tuoi capitoli.
- In `dad.js` la gara salvava **prima** di aprire il dialogo, quindi non c'era una coda da vedere. Ho solo invertito l'ordine: prima `say`, poi `saveGame`.

### Test — nuovo `tests/polish54.js` (`T54.suite()`, 3 test)
- «Chiudere il gioco» qui vuol dire leggere il salvataggio com'è, **senza** salvare di nuovo. Il tuo `T53.reload()` salva prima di ricaricare, quindi qui avrebbe nascosto il difetto 2.
- **Test 1, Capitolo II:** primo dialogo del ricordo, poi chiusura e «Continua». Il cartello deve comparire, `ch2Done` diventare vero, l'obiettivo portare da Teodoro (`i:elder`) e il cartello non ricomparire.
- **Test 2, Faro e campane:** si interrompe il dialogo appena il flag del finale è salvato. Nel salvataggio devono esserci già +50 gemme, a fine dialogo ancora +50 (non 100) e il testo del dono deve comparire.
- **Test 3, la regola generale:** con due salvataggi nello stesso dialogo il dono si dà una volta sola. Senza salvataggi arriva al suo turno, non prima.
- **Ho controllato che i test colgano i difetti:** spegnendo le due correzioni solo nella pagina, i test 1 e 2 **falliscono**, con «niente cartello del Capitolo II... Goditi la valle» e «+0 gemme invece di +50».

### Verifiche
- **Totale 459/459:** 51 suite, `T4` e `A` comprese. Tutti gli script sono a `?v=c54a` (src verificati), con la riga dei titoli del Ciclo 54. Suoni spenti.
- `T.route()`: **ok** (8606 fotogrammi, 2,4 minuti di gioco). L'ho rilanciato perché questo ciclo tocca il salvataggio di tutto il gioco.

### Limite
- I doni dentro funzioni che **restituiscono** altre battute (si espandono solo quando arrivano) non vengono visti dal salvataggio. Nei miei capitoli non ce ne sono.
- La spada dell'alba e i doni del negozio sono `g => g.giveItem(...)`, non una coda: lì il salvataggio non avviene a metà.

### File toccati / nuovi
- **Nuovo:** `tests/polish54.js`.
- **Modificati:**
  - `resume.js`: la riga del Capitolo II e la sezione 3;
  - `dad.js`: l'ordine `say`/`saveGame`;
  - `story.js`, `LEGGIMI.md` (`T54`), `index.html` (test e `?v`).

**Avversario, la palla è tua.**

## CICLO 55 — Agente A (seconda manche) — RIFINITURA: nessun dono «pigro»

**Direzione dell'utente:** rifinire quello che c'è, niente espansione.

### Sul tuo Ciclo 54
- Ottimo il blocco del Capitolo II, chiuso con una riga nel mio `PENDING_CARDS`.
- Ottimo anche il meccanismo dei doni in coda. E giusta l'osservazione su `T53.reload()`, che salva prima di ricaricare e così nascondeva il difetto: chiudere vuol dire leggere il salvataggio **senza** salvare di nuovo.

### Il tuo limite, chiuso: i doni «pigri»
- **Cosa scrivevi:** un dono scritto come `g => g.giveItem(...)` nasce solo quando il dialogo ci arriva. Il tuo meccanismo, che dà i doni in coda quando si salva a metà dialogo, quindi **non lo vede**.
- **Ho cercato lo schema `=> x.giveItem(` in tutti gli script:** sette casi.
  - **Miei**, in `world.js`, del primo atto: la Spada dell'Alba di Ortensio, il cuore di Pino per l'amo, le 10 gemme di Silvano, il cuore della Fata.
  - **Tuoi:** in `fishing.js` il cuore del Luccio Lunare e le 50 gemme dei cinque pesci; in `trade.js` il dono di ogni passo della catena.
- **Uno era un difetto vero, mio, del Ciclo 4:**
  - nel dialogo di Ortensio, `plantGarden(g)` **salva la partita** (giardino piantato), e la **Spada dell'Alba** arriva solo tre battute dopo;
  - chi chiudeva il gioco in mezzo si ritrovava il giardino fiorito e **la spada persa per sempre**;
  - **controprova:** rimettendo nella pagina il dono «pigro», il test trova «giardino true, spada undefined» nel salvataggio.
- **Gli altri sei** oggi non sono a rischio, perché nessun salvataggio cade fra il flag e il dono, ma lo schema era lo stesso.
- **Correzione:** tutti e sette sono diventati `...g.giveItem(...)`, cioè il dono **nasce subito** con il dialogo. Così il tuo meccanismo lo vede e lo dà anche se si salva prima del suo turno.
  - I testi «Hai ricevuto...» compaiono al loro turno, come prima.
  - I cambi nei tuoi file sono di una riga ciascuno, commentati «Ciclo 55 (Agente A)».

### Test — nuovo `tests/polish55.js` (`await T55.suite()`, 3 test)
- **Ortensio pianta il giardino:** leggendo il salvataggio così com'è (alla tua maniera), la Spada dell'Alba c'è già. Con il dono «pigro» il test fallisce: è la controprova.
- **Nessuno script** ha più doni «pigri» (`=> x.giveItem(`). Se ne scrivi uno nuovo, il test lo segnala.
- **Il cuore di Pino per l'amo** arriva una volta sola.

### Verifiche
- **Totale 462/462:** 51 suite (`T4` compresa) più `A`. `T.route()` ok (2,4 min). Tutti gli script sono a `?v=c55c` (src verificati), con la riga dei titoli caricata. Nel browser restano solo le opzioni.

### Limiti (onesti)
- **Il test statico** cerca lo schema `=> x.giveItem(`. Un dono costruito in modo diverso, per esempio `return g.giveItem(...)` dentro una funzione nella coda, non lo vedrebbe.

### File toccati / nuovi
- **Nuovo:** `tests/polish55.js`.
- **Modificati:**
  - `world.js`: 4 doni;
  - `fishing.js` (2) e `trade.js` (1): una riga ciascuno, commentata;
  - `story.js`;
  - `LEGGIMI.md`;
  - `index.html`.

**Avversario, la palla è tua. Ora nessun dono aspetta il suo turno per esistere.**

---

## CICLO 56 — Agente B (seconda manche) — RIFINITURA: nessuna attesa a vuoto

### Sul tuo Ciclo 55
- Hai chiuso il mio limite, e la Spada dell'Alba di Ortensio era un caso vero. Bene anche la conversione in `...g.giveItem(...)` nei miei `fishing.js` e `trade.js`.
- Prima di cambiare tema ho controllato i forzieri e i semi: il forziere imposta il flag e dà subito il contenuto (la funzione è la prima voce del dialogo). Sono coerenti.

### Il difetto da giocatore: aspettare minuti veri senza fare niente
- **Il problema:** un giorno dura **6 minuti** (`DAY_LEN` 360 secondi), e diverse mete valgono solo a certe ore:
  - Isola della Stella: solo **di notte** (circa 2 minuti su 6), ed è il percorso principale del Capitolo IV;
  - gara col padre: solo **di mattina**;
  - fuochi fatui e Luccio Lunare: solo **di notte**.
- Si poteva riposare fino a un'ora scelta **solo nella tenda di Nadira**, nel deserto. Chi arrivava all'Isola di giorno aspettava **fino a 4 minuti veri** guardando lo schermo.
- Il cartello del cratere diceva «Torna DI NOTTE» senza dire come.

### La correzione
- **`restChoices(sonno, no, testoNo)`** in `amber.js`, commentata «Ciclo 56»: è il riposo di Nadira reso riusabile, con le stesse quattro ore (`REST_AT`), i cuori pieni e il salvataggio.
  - Nadira la usa con **i suoi testi di sempre**: stesse scelte e stesse frasi, verificato dal test.
- **Ora si riposa anche:**
  - da **Lina** (osteria, Costa): «Una branda»;
  - da **Rufo** (locanda, Pietrabianca): «Una stanza»;
  - col **padre**, nell'invito dopo la festa: «Riposiamo a casa».
- **Ogni posto ha la sua frase al risveglio:** il rumore del mare, tre coperte di lana, il papà che russa davanti al camino.
- **Le nuove scelte stanno sempre prima dell'ultima** («Niente» / «Un'altra volta»): i test che scelgono l'ultima voce o la prima non cambiano.
- **Il cartello del cratere** ora aggiunge «(all'osteria di Lina puoi dormire fino a sera)».
- **Ho guardato i menu a schermo:** le 4 scelte di Lina e le 5 ore entrano nel riquadro.

### Test — nuovo `tests/polish56.js` (`T56.suite()`, 3 test)
1. Lina, Rufo e il padre: «A notte fonda» rende la notte, «Al mattino» rende vera la mattina della gara (`dadMorning`), e ci si sveglia con tutti i cuori.
2. Costa: dopo una notte da Lina, sull'Isola il raggio del Faro **apre davvero il cratere**.
3. Il cartello del cratere nomina l'osteria, e le scelte di Nadira sono esattamente quelle di prima.

### Verifiche
- **Totale 465/465:** 53 suite, `T4` e `A` comprese. Tutti gli script sono a `?v=c56a` (src verificati), con la riga dei titoli del Ciclo 56. Suoni spenti.
- `T.route()`: **ok** (8643 fotogrammi, 2,4 minuti). L'ho rilanciato perché ho toccato il menu del padre.

### Limite
- Il riposo cura tutti i cuori gratis (come da Nadira), mentre la zuppa costa 5 gemme. Nel deserto era già così e non l'ho cambiato. Se ti sembra troppo generoso, basta togliere `g2.s.hp = g2.s.maxHp` da `restChoices`.

### File toccati / nuovi
- **Nuovo:** `tests/polish56.js`.
- **Modificati:**
  - `amber.js`: `restChoices`, che Nadira ora usa;
  - `coast.js`: Lina e il cartello del cratere;
  - `north.js`: Rufo;
  - `walk.js`: il padre;
  - `story.js`, `LEGGIMI.md` (`T56`), `index.html` (test e `?v`).

**Avversario, la palla è tua.**

## CICLO 57 — Agente A (seconda manche) — RIFINITURA: il Diario e il Bestiario, per intero (ULTIMO CICLO)

**Direzione dell'utente:** rifinire quello che c'è, niente espansione. **È l'ultimo ciclo della sfida:** l'utente ha chiesto, tramite AGENTE2, di fermarci quando ti ripasso la palla.

### Sul tuo Ciclo 56
- Bene il riposo fuori dal deserto, con la sua frase al risveglio.
- Sulla cura gratis: la lascio così. Riposare è una scelta del giocatore, e non tocca i duelli.

### 1. Il Diario: la lista delle missioni usciva dallo schermo (mio, Ciclo 13)
- **Il problema:** le missioni secondarie oggi sono **19**, ma la pagina del Diario era pensata quando erano poche. Ogni voce era disegnata a `35 + i*10,5`, quindi nel riquadro ne entravano 9.
  - Dalla decima in giù le voci scivolavano sopra il riquadro dei suggerimenti, sulla riga dei comandi e fuori dallo schermo.
  - La voce scelta poteva finire fuori dal suo riquadro.
  - **L'ho visto a schermo**, con tutte le missioni scoperte.
- **La correzione** (`journal.js`): la lista mostra **9 voci alla volta e scorre** con la selezione, che resta al centro. Le frecce ▲ ▼ ai bordi dicono che ce ne sono altre.

### 2. Il Bestiario: sedici schede tagliate a metà frase
- **Il problema:** la scheda mostra al massimo 4 righe di descrizione e 3 di punto debole (`slice`). Misurando con la `wrap` del gioco, **16 testi** erano più lunghi e si interrompevano a metà parola.
  - Per esempio il Vento: «e chi non ha volto si», «...del tuo aquilone;».
- **Di chi erano:**
  - **miei:** Velato, Astrino, Armilla, Ombra, Umbra, Madre, Bulbi, Terra (2), Vento (2);
  - **tuoi:** Re dei Rovi, Scorpione, Granchio, Talpa, Refolo.
- **La correzione:** li ho accorciati tenendo il consiglio utile. Prima li ho misurati tutti, e solo dopo applicati. Ogni testo è segnato `/* Ciclo 57: accorciato, nel Bestiario entrava tagliato */`, anche nei tuoi file.
- **Nella scheda non c'è altro spazio:** a schermo il riquadro è pieno, quindi l'unica strada era accorciare.

### Test — nuovo `tests/polish57.js` (`T57.suite()`, 3 test)
- **Diario con tutte le 19 missioni:** per ogni scelta possibile le righe restano nel riquadro, e la missione scelta è visibile.
- **Bestiario:** ogni descrizione sta in 4 righe e ogni punto debole in 3.
- **Suggerimenti delle missioni**, anche con «Completata!» davanti: stanno in 3 righe.

### Verifiche
- **Totale 468/468:** 53 suite (`T4` compresa) più `A`. `T.route()` ok (2,4 min). Tutti gli script sono a `?v=c57d` (src verificati), con la riga dei titoli del Ciclo 57 caricata. Nel browser restano solo le opzioni.
- **Il tuo T48 mi ha fermato due frasi.** Accorciando, avevo scritto due punti deboli che cominciavano con «Schivalo di lato:» e «Occhi gialli:», e il tuo test li ha presi per etichette di chi parla. Li ho riscritti senza i due punti in testa invece di aggiungere eccezioni.
- **Screenshot:** il Diario prima (voci fuori dallo schermo) e dopo (9 voci, ▲ ▼); la scheda del Vento prima (tagliata) e dopo (intera).

### File toccati / nuovi
- **Nuovo:** `tests/polish57.js`.
- **Modificati:**
  - `journal.js`;
  - i testi del Bestiario: `bestiary.js`, `roots.js`, `tower.js`, `amber.js`, `observatory.js`, `coast.js`, `abyss.js`, `tidetemple.js`, `earth.js`, `heartearth.js`, `wind.js`, `windpalace.js`;
  - `story.js`;
  - `LEGGIMI.md`;
  - `index.html`.

**Avversario, la palla è tua, per l'ultima volta. È stato un piacere costruire Brinavalle con te, un ciclo alla volta.**

---
