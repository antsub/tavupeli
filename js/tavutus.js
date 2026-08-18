"use strict";
/* =====================================================================
   TAVUTUS — suomen kielen automaattinen tavutus
   ---------------------------------------------------------------------
   Peli tavuttaa sanat itse, joten sisältöön voi kirjoittaa sanat ihan
   tavallisesti ("kissa"). Jos haluat itse päättää tavutuksen, kirjoita
   sanaan tavuviivat ("kis-sa") — silloin niitä käytetään sellaisenaan.
   ===================================================================== */

var TAVUTUS = (function () {

  var VOKAALIT = "aeiouyäöå";

  // Suomen diftongit eli vokaaliparit, jotka pysyvät samassa tavussa.
  var DIFTONGIT = {
    ai: 1, ei: 1, oi: 1, ui: 1, yi: 1, "äi": 1, "öi": 1,
    au: 1, eu: 1, iu: 1, ou: 1,
    "äy": 1, "öy": 1, ey: 1, iy: 1,
    ie: 1, uo: 1, "yö": 1
  };

  function onVokaali(c) {
    return !!c && VOKAALIT.indexOf(c.toLowerCase()) >= 0;
  }

  function onKirjain(c) {
    return !!c && /[a-zåäöšž]/i.test(c);
  }

  // Tavuttaa yhden sanan ja palauttaa tavut taulukkona.
  // "kissa" -> ["kis","sa"], "kis-sa" -> ["kis","sa"]
  function tavuta(sana) {
    sana = String(sana || "");
    if (sana.indexOf("-") >= 0) {
      return sana.split("-").filter(function (t) { return t.length > 0; });
    }

    var tavut = [];
    var nyk = "";        // rakenteilla oleva tavu
    var vokaaleja = 0;   // vokaalien määrä nykyisessä tavussa
    var merkit = sana.split("");
    var i = 0;

    while (i < merkit.length) {
      var c = merkit[i];

      // Välimerkit yms. liimataan mukaan tavuun.
      if (!onKirjain(c)) { nyk += c; i++; continue; }

      if (onVokaali(c)) {
        if (vokaaleja === 0) { nyk += c; vokaaleja = 1; i++; continue; }
        var edellinen = nyk[nyk.length - 1];
        if (!onVokaali(edellinen)) { nyk += c; vokaaleja++; i++; continue; }
        var pari = (edellinen + c).toLowerCase();
        var pitkaVokaali = edellinen.toLowerCase() === c.toLowerCase();
        if (vokaaleja === 1 && (pitkaVokaali || DIFTONGIT[pari])) {
          nyk += c; vokaaleja = 2; i++;
        } else {
          // Kolmas vokaali tai pari joka ei kuulu yhteen -> tavuraja.
          tavut.push(nyk); nyk = c; vokaaleja = 1; i++;
        }
        continue;
      }

      // c on konsonantti.
      if (vokaaleja === 0) { nyk += c; i++; continue; } // tavun alun konsonantit

      // Kerätään konsonanttijono ja katsotaan, seuraako sitä vokaali.
      var j = i;
      while (j < merkit.length && onKirjain(merkit[j]) && !onVokaali(merkit[j])) j++;

      if (j < merkit.length && onVokaali(merkit[j])) {
        // Tavuraja tulee jonon viimeisen konsonantin eteen:
        // "kissa" -> kis|sa, "myrsky" -> myrs|ky, "portti" -> port|ti
        nyk += merkit.slice(i, j - 1).join("");
        tavut.push(nyk);
        nyk = merkit[j - 1];
        vokaaleja = 0;
        i = j;
      } else {
        // Sanan lopun konsonantit kuuluvat viimeiseen tavuun.
        nyk += merkit.slice(i, j).join("");
        i = j;
      }
    }

    if (nyk.length) tavut.push(nyk);
    return tavut;
  }

  // "kissa" -> "kis-sa"
  function tavutaViivoilla(sana) {
    return tavuta(sana).join("-");
  }

  return { tavuta: tavuta, tavutaViivoilla: tavutaViivoilla, onVokaali: onVokaali };
})();

if (typeof module !== "undefined") module.exports = TAVUTUS;
