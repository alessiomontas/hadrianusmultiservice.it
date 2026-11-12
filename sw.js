/* ══════════════════════════════════════════════════════════════════
   L'INTERRUTTORE CHE SPEGNE IL SITO VECCHIO — 12 novembre 2026

   IL PROBLEMA, TROVATO ADDOSSO AD ALESSIO.
   Il sito precedente era una applicazione React con `vite-plugin-pwa`:
   installava nel browser di ogni visitatore un «service worker», un
   programmino che resta li' e **risponde lui alle richieste** prima che
   partano verso la rete. Quel programma si chiamava `/sw.js` e teneva una
   copia del sito in una cache chiamata `workbox-precache-v2`.

   Conseguenza: cambiare il DNS non basta. Chi aveva gia' aperto
   hadrianusmultiservice.it **continua a vedere il sito vecchio**, servito
   dal suo stesso browser, per sempre. Verificato il 12/11/2026: il browser
   mostrava ancora il titolo e la pagina d'errore del sito del designer,
   mentre il server mandava gia' quello nuovo. Nessun messaggio, nessun
   errore: semplicemente la pagina sbagliata.

   LA CURA.
   Un service worker si aggiorna solo in un modo: il browser, a ogni
   navigazione, riscarica il file che sta a QUELLO stesso indirizzo e lo
   confronta byte per byte. Se e' cambiato, installa il nuovo. Quindi
   mettiamo a `/sw.js` un programma che fa una cosa sola: **si suicida**.
   Cancella tutte le cache, si cancella dal browser, e ricarica le schede
   aperte — che a quel punto prendono il sito vero dalla rete.

   ⚠️ QUESTO FILE NON SI CANCELLA MAI.
   Finche' esiste un browser al mondo con il vecchio service worker dentro,
   questo file e' l'unica cosa che lo libera. Toglierlo da qui vuol dire
   lasciare quelle persone sul sito di due anni fa. Costa 700 byte.
   ══════════════════════════════════════════════════════════════════ */

self.addEventListener('install', () => {
  // Non aspettare che le vecchie schede si chiudano: prendi il posto subito.
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    // 1 · via tutte le cache, compresa `workbox-precache-v2`
    const nomi = await caches.keys();
    await Promise.all(nomi.map((n) => caches.delete(n)));

    // 2 · disinstallati dal browser
    await self.registration.unregister();

    // 3 · ricarica le schede aperte, cosi' chi sta guardando vede il sito
    //     vero senza doverlo sapere e senza dover fare niente
    const schede = await self.clients.matchAll({ type: 'window' });
    for (const s of schede) {
      try { s.navigate(s.url); } catch (e) { /* una scheda chiusa nel frattempo */ }
    }
  })());
});

/* Finche' e' vivo non deve intercettare niente: ogni richiesta va in rete. */
self.addEventListener('fetch', () => {});
