"use strict";
/* =====================================================================
   VERTAILU — verrataan puheentunnistuksen kuulemaa tekstiä tavoitteeseen
   ---------------------------------------------------------------------
   Vertailu on tarkoituksella ARMOLLINEN: lukihäiriöiselle lapselle on
   tärkeämpää, ettei peli hylkää oikeaa yritystä, kuin että se nappaisi
   jokaisen pikkuvirheen. Puheentunnistus kuulee muutenkin vähän sinne
   päin, joten sallimme pieniä eroja sanan pituuden mukaan.
   ===================================================================== */

var VERTAILU = (function () {

  // Pienet kirjaimet, vain kirjaimet, yksi väli sanojen väliin.
  function normalisoi(teksti) {
    return String(teksti || "")
      .toLowerCase()
      .replace(/[^a-zåäöšž]+/gi, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function sanalista(teksti) {
    var n = normalisoi(teksti);
    return n ? n.split(" ") : [];
  }

  // Klassinen editointietäisyys (montako kirjainta pitää muuttaa).
  function etaisyys(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    var edellinen = [], nykyinen = [], j, i, k;
    for (j = 0; j <= n; j++) edellinen[j] = j;
    for (i = 1; i <= m; i++) {
      nykyinen[0] = i;
      for (k = 1; k <= n; k++) {
        var kustannus = a[i - 1] === b[k - 1] ? 0 : 1;
        nykyinen[k] = Math.min(edellinen[k] + 1, nykyinen[k - 1] + 1, edellinen[k - 1] + kustannus);
      }
      var tmp = edellinen; edellinen = nykyinen; nykyinen = tmp;
    }
    return edellinen[n];
  }

  // Montako virhettä sallitaan sanan pituuden mukaan.
  function toleranssi(pituus) {
    if (pituus <= 4) return 1;
    if (pituus <= 8) return 2;
    return 3;
  }

  // Vertaa yhtä odotettua sanaa yhteen kuultuun sanaan.
  // loysa = höpölöitsy eli epäsana: puheentunnistin ei tunne sanaa
  // ennestään ja arvaa sen helposti vähän väärin, joten sallitaan
  // yksi virhe enemmän. Muuten lapsi lukisi oikein ja peli hylkäisi.
  function sanaOsuu(odotettu, kuultu, loysa) {
    odotettu = normalisoi(odotettu).replace(/ /g, "");
    kuultu = normalisoi(kuultu).replace(/ /g, "");
    if (!odotettu || !kuultu) return false;
    if (odotettu === kuultu) return true;
    if (etaisyys(odotettu, kuultu) <= toleranssi(odotettu.length) + (loysa ? 1 : 0)) return true;
    // Tunnistin voi liimata sanoja yhteen tai lapsi lukee sanan pariin kertaan.
    if (odotettu.length >= 3 && kuultu.indexOf(odotettu) >= 0) return true;
    return false;
  }

  // Tavutehtävä: hyväksytään myös se, että tunnistin kuulee tavun osana
  // sanaa ("KIS" -> "kissa") tai vähän venytettynä ("KA" -> "kaa").
  function tavuOsuu(tavu, kuultuTeksti) {
    tavu = normalisoi(tavu).replace(/ /g, "");
    if (!tavu) return false;
    var sanat = sanalista(kuultuTeksti);
    for (var i = 0; i < sanat.length; i++) {
      var s = sanat[i];
      if (s === tavu) return true;
      if (tavu.length >= 2 && s.indexOf(tavu) === 0) return true;      // "kis" ~ "kissa"
      if (s[0] === tavu[0] && etaisyys(tavu, s) <= 1) return true;     // "ka" ~ "kaa"
    }
    // Lapsi saattoi sanoa tavun kirjain kerrallaan ("koo aa").
    return sanat.length > 1 && sanaOsuu(tavu, sanat.join(""));
  }

  // Sanatehtävä: kokeillaan jokaista kuultua sanaa erikseen sekä kaikkia
  // yhteen liimattuna (lapsi voi lukea "KAK ... KA" tavu kerrallaan).
  function kokoSanaOsuu(odotettu, kuultuTeksti, loysa) {
    var sanat = sanalista(kuultuTeksti);
    if (!sanat.length) return false;
    for (var i = 0; i < sanat.length; i++) {
      if (sanaOsuu(odotettu, sanat[i], loysa)) return true;
      if (i + 1 < sanat.length && sanaOsuu(odotettu, sanat[i] + sanat[i + 1], loysa)) return true;
    }
    return sanaOsuu(odotettu, sanat.join(""), loysa);
  }

  // Vertaa tavua yhteen kuultuun sanaan (ilman koko tekstin läpikäyntiä).
  function tavuTokenOsuu(tavu, token) {
    tavu = normalisoi(tavu).replace(/ /g, "");
    if (!tavu || !token) return false;
    if (token === tavu) return true;
    if (tavu.length >= 2 && token.indexOf(tavu) === 0) return true;
    return token[0] === tavu[0] && etaisyys(tavu, token) <= 1;
  }

  // Kombosyöksy ja palat: montako osaa listasta (alkaen kohdasta 'alku')
  // kuullusta tekstistä löytyy PERÄKKÄIN. Palauttaa uuden indeksin.
  // Jokainen kuultu sana voi kuitata vain yhden osan, joten "KAK" ei
  // vahingossa kuittaa sekä osaa "KAK" että osaa "KA".
  function jonoOsuu(osat, alku, kuultuTeksti, tavuja, ohitaTokenit) {
    var tokenit = sanalista(kuultuTeksti);
    var i = alku;
    var t = ohitaTokenit || 0;
    while (i < osat.length) {
      var loytyi = false;
      for (var j = t; j < tokenit.length; j++) {
        if (tavuja) {
          if (tavuTokenOsuu(osat[i], tokenit[j])) { loytyi = true; t = j + 1; break; }
        } else {
          if (sanaOsuu(osat[i], tokenit[j])) { loytyi = true; t = j + 1; break; }
          if (j + 1 < tokenit.length && sanaOsuu(osat[i], tokenit[j] + tokenit[j + 1])) {
            loytyi = true; t = j + 2; break;
          }
        }
      }
      if (!loytyi) break;
      i++;
    }
    return i;
  }

  // Lause tai tarinan virke: verrataan sana kerrallaan järjestyksessä.
  // Palauttaa { ok, osumat: [true/false per sana], osuus }
  function lauseOsuu(odotettuLause, kuultuTeksti) {
    var odotetut = sanalista(odotettuLause);
    var kuullut = sanalista(kuultuTeksti);
    var osumat = [];
    var k = 0;

    for (var i = 0; i < odotetut.length; i++) {
      var loytyi = false;
      var raja = Math.min(kuullut.length, k + 4);
      for (var j = k; j < raja; j++) {
        if (sanaOsuu(odotetut[i], kuullut[j])) { loytyi = true; k = j + 1; break; }
        // Kaksi kuultua sanaa voi vastata yhtä odotettua ("lento kone" ~ "lentokone").
        if (j + 1 < kuullut.length && sanaOsuu(odotetut[i], kuullut[j] + kuullut[j + 1])) {
          loytyi = true; k = j + 2; break;
        }
      }
      osumat.push(loytyi);
    }

    var oikein = 0;
    for (var o = 0; o < osumat.length; o++) if (osumat[o]) oikein++;
    var maara = odotetut.length;
    var vaadittu = maara <= 2 ? maara : Math.ceil(maara * 0.75);
    return {
      ok: maara > 0 && oikein >= vaadittu,
      osumat: osumat,
      osuus: maara ? oikein / maara : 0
    };
  }

  return {
    normalisoi: normalisoi,
    sanalista: sanalista,
    etaisyys: etaisyys,
    sanaOsuu: sanaOsuu,
    tavuOsuu: tavuOsuu,
    tavuTokenOsuu: tavuTokenOsuu,
    jonoOsuu: jonoOsuu,
    kokoSanaOsuu: kokoSanaOsuu,
    lauseOsuu: lauseOsuu
  };
})();

if (typeof module !== "undefined") module.exports = VERTAILU;
