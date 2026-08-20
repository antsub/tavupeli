"use strict";
/* Service worker: tallentaa pelin välimuistiin, jotta se toimii myös
   ilman nettiyhteyttä. Kasvata versionumeroa kun muutat pelin tiedostoja,
   niin pelaajat saavat uuden version. */

/* Välimuistin nimi sisältää version. Kun tätä kasvatetaan, vanha
   välimuisti poistetaan aktivoinnissa eikä vanha koodi jää roikkumaan.
   Kasvata aina kun pelin tiedostoja muutetaan. */
var VERSIO = "2026-08-20b";
var VALIMUISTI = "tavuritari-" + VERSIO;

var TIEDOSTOT = [
  "./",
  "index.html",
  "tyyli.css",
  "manifest.webmanifest",
  "js/tavutus.js",
  "js/vertailu.js",
  "js/sisalto.js",
  "js/aanet.js",
  "js/puhe.js",
  "js/peli.js",
  "icons/ikoni-180.png",
  "icons/ikoni-192.png",
  "icons/ikoni-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VALIMUISTI).then(function (c) { return c.addAll(TIEDOSTOT); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (avaimet) {
      return Promise.all(avaimet.map(function (avain) {
        if (avain !== VALIMUISTI) return caches.delete(avain);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    // Verkko ensin (jotta päivitykset näkyvät), välimuisti varalla (offline).
    fetch(e.request).then(function (vastaus) {
      var kopio = vastaus.clone();
      caches.open(VALIMUISTI).then(function (c) { c.put(e.request, kopio); });
      return vastaus;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
