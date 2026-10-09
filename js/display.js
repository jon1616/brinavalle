'use strict';
/* =====================================================================
 *  DISPLAY — Ciclo 11 (Agente A): schermo a due livelli.
 *  Prima: a ogni frame la tela pixel-art 256x192 (`buf`) veniva ingrandita
 *  con drawImage sulla tela grande (#screen). Misurato: ~8,5 ms su 9 ms di
 *  render a scala 4 (schermo grande / telefono ad alta densità).
 *  Ora: `buf` è DIRETTAMENTE visibile e l'ingrandimento lo fa il browser
 *  via CSS (image-rendering: pixelated, sulla GPU, praticamente gratis);
 *  #screen diventa un livello TRASPARENTE sopra, solo per i testi nitidi.
 *  Il resto del codice non cambia: la vecchia chiamata
 *  `sctx.drawImage(buf, ...)` ora significa "pulisci il livello dei testi".
 * ===================================================================== */
(function layeredDisplay() {
  const stage = document.createElement('div');
  stage.id = 'stage';
  screenCanvas.parentNode.insertBefore(stage, screenCanvas);
  buf.id = 'pixels';
  stage.appendChild(buf);
  stage.appendChild(screenCanvas);
  const draw = sctx.drawImage.bind(sctx);
  sctx.drawImage = function (img, ...rest) {
    if (img === buf) { sctx.clearRect(0, 0, screenCanvas.width, screenCanvas.height); return; }
    return draw(img, ...rest);
  };
  window.DISPLAY_LAYERED = true;
})();
