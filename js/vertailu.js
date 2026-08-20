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

  // Tavutinta käytetään kuullun sanan pilkkomiseen: jos tunnistin
  // kuuli "kanava", tavoitetavu "KA" löytyy sen ensimmäisestä tavusta.
  var TAVUTIN = (typeof TAVUTUS !== "undefined" && TAVUTUS) ? TAVUTUS : null;
  if (!TAVUTIN && typeof require === "function") {
    try { TAVUTIN = require("./tavutus.js"); } catch (e) { TAVUTIN = null; }
  }

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

  /* ------------------------------------------------------------------
     FONEETTINEN VERTAILU

     Puheentunnistin käyttää kielimallia ja pyrkii aina tuottamaan
     OIKEITA SANOJA. Yksinäinen tavu ei ole sana, joten "KA" tulee ulos
     muodossa "kaa", "kah", "ga", "kaks" tai jonain aivan muuna — vaikka
     lapsi luki sen täysin oikein. Sama koskee höpölöitsyjä.

     Siksi tavuja ei verrata kirjaimina vaan äänteinä: kahdennukset
     puretaan (kaa -> ka) ja soinnilliset/soinnittomat parit niputetaan
     samaan luokkaan (k/g, t/d, p/b), koska tunnistin sekoittaa ne
     jatkuvasti. Vokaalit sen sijaan pidetään erillään: juuri vokaali
     erottaa tavut KA ja KU toisistaan, eikä sitä saa antaa anteeksi.
     ------------------------------------------------------------------ */

  var KONSONANTTILUOKAT = {
    k: "K", g: "K", c: "K", q: "K",
    t: "T", d: "T",
    p: "P", b: "P",
    s: "S", z: "S", "š": "S", x: "S",
    f: "V", v: "V", w: "V",
    h: "H", m: "M", n: "N", l: "L", r: "R", j: "J", "ž": "S"
  };

  function onVokaali(c) {
    return "aeiouyäöå".indexOf(c) >= 0;
  }

  // "kaa" -> "Ka", "gaa" -> "Ka", "tid" -> "TiT"
  function foneettinen(teksti) {
    var t = normalisoi(teksti).replace(/ /g, "").replace(/å/g, "o");
    var ulos = "";
    var edellinen = "";
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (c === edellinen) continue;          // kahdennus pois: kk -> k, aa -> a
      edellinen = c;
      ulos += onVokaali(c) ? c : (KONSONANTTILUOKAT[c] || c.toUpperCase());
    }
    return ulos;
  }

  // Tavun ydin: alkukonsonantti(luokkana) + ensimmäinen vokaali.
  // Tämä erottaa KA:n KU:sta ja TA:sta, muttei kompastu siihen
  // kuuliko tunnistin lopusta ylimääräistä.
  function tavuYdin(teksti) {
    var f = foneettinen(teksti);
    var alku = "";
    var i = 0;
    while (i < f.length && !onVokaali(f[i])) { alku += f[i]; i++; }
    var vokaali = i < f.length ? f[i] : "";
    return { alku: alku, vokaali: vokaali };
  }

  // Vastaako kuultu tavu tavoitetta? Lyhyillä tavuilla vaaditaan sama
  // alkuäänne ja sama vokaali; pidemmillä sallitaan yksi poikkeama.
  function tavutVastaavat(tavoite, kuultu) {
    var a = foneettinen(tavoite);
    var b = foneettinen(kuultu);
    if (!a || !b) return false;
    if (a === b) return true;

    var ya = tavuYdin(tavoite);
    var yb = tavuYdin(kuultu);
    if (!ya.vokaali || !yb.vokaali) return false;

    // Lyhyt tavu (KA, PIS): alkuäänne ja vokaali ratkaisevat.
    if (a.length <= 3) {
      return ya.alku === yb.alku && ya.vokaali === yb.vokaali;
    }
    // Pidempi tavu: alkuäänteen ja vokaalin lisäksi sallitaan
    // yksi ylimääräinen tai puuttuva äänne.
    return ya.alku === yb.alku && ya.vokaali === yb.vokaali &&
      etaisyys(a, b) <= 1;
  }

  /* Kirjainten nimet. Aloitteleva lukija tavaa usein kirjain kerrallaan
     ("koo — aa"), ja tunnistin kirjoittaa nimet auki. Muunnetaan ne
     takaisin kirjaimiksi, jotta "koo aa" tunnistetaan tavuksi KA. */
  var KIRJAINTEN_NIMET = {
    aa: "a", bee: "b", see: "c", dee: "d", ee: "e", "äf": "f", af: "f",
    gee: "g", hoo: "h", ii: "i", jii: "j", koo: "k", "äl": "l", el: "l",
    "ämmä": "m", "äm": "m", em: "m", "än": "n", en: "n", oo: "o",
    pee: "p", kuu: "q", "är": "r", er: "r", "äs": "s", es: "s",
    tee: "t", uu: "u", vee: "v", kaksois: "w", "äks": "x", yy: "y",
    tseta: "z", "ää": "ä", "öö": "ö", "åå": "å"
  };

  // Palauttaa kirjaimiksi puretun jonon, jos KAIKKI sanat ovat
  // kirjainten nimiä — muuten null.
  function kirjaimiksi(sanat) {
    if (!sanat.length) return null;
    var ulos = "";
    for (var i = 0; i < sanat.length; i++) {
      var kirjain = KIRJAINTEN_NIMET[sanat[i]];
      if (!kirjain) return null;
      ulos += kirjain;
    }
    return ulos;
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
    // Äänteinä verrattuna: k/g, t/d ja p/b menevät tunnistimelta sekaisin
    // ja kahdennukset katoavat. Tämä pelastaa etenkin höpölöitsyt.
    var fa = foneettinen(odotettu), fb = foneettinen(kuultu);
    if (fa && fa === fb) return true;
    if (etaisyys(fa, fb) <= toleranssi(fa.length) - (loysa ? 0 : 1)) return true;
    return false;
  }

  /* Tavutehtävä. Tunnistin ei tuota yksinäisiä tavuja vaan oikeita
     sanoja, joten tavoitetavua etsitään monella tapaa:
       1. koko kuultu sana äänteinä ("kaa" = "ka")
       2. kuullun sanan ALUSTA ("KIS" löytyy sanasta "kissa")
       3. kuullun sanan mistä tahansa TAVUSTA ("KA" löytyy "kanavasta")
       4. kaikki sanat yhteen liimattuina (lapsi tavasi kirjaimittain) */
  function tavuOsuu(tavu, kuultuTeksti) {
    var tavoite = normalisoi(tavu).replace(/ /g, "");
    if (!tavoite) return false;
    var sanat = sanalista(kuultuTeksti);

    for (var i = 0; i < sanat.length; i++) {
      var s = sanat[i];
      if (tavuTokenOsuu(tavoite, s)) return true;
    }

    // Lapsi saattoi sanoa tavun kirjain kerrallaan ("koo aa") tai
    // tunnistin pilkkoi yhden tavun kahdeksi sanaksi.
    if (sanat.length > 1) {
      var yhteen = sanat.join("");
      if (tavuTokenOsuu(tavoite, yhteen)) return true;
      if (sanaOsuu(tavoite, yhteen)) return true;
    }
    var tavattu = kirjaimiksi(sanat);
    if (tavattu && tavuTokenOsuu(tavoite, tavattu)) return true;
    return false;
  }

  // Sanatehtävä: kokeillaan jokaista kuultua sanaa erikseen sekä kaikkia
  // yhteen liimattuna (lapsi voi lukea "KAK ... KA" tavu kerrallaan).
  function kokoSanaOsuu(odotettu, kuultuTeksti, loysa) {
    var sanat = sanalista(kuultuTeksti);
    if (!sanat.length) return false;
    var tavattu = kirjaimiksi(sanat);
    if (tavattu && sanaOsuu(odotettu, tavattu, loysa)) return true;
    for (var i = 0; i < sanat.length; i++) {
      if (sanaOsuu(odotettu, sanat[i], loysa)) return true;
      if (i + 1 < sanat.length && sanaOsuu(odotettu, sanat[i] + sanat[i + 1], loysa)) return true;
    }
    return sanaOsuu(odotettu, sanat.join(""), loysa);
  }

  // Vertaa tavoitetavua yhteen kuultuun sanaan.
  function tavuTokenOsuu(tavu, token) {
    var tavoite = normalisoi(tavu).replace(/ /g, "");
    token = normalisoi(token).replace(/ /g, "");
    if (!tavoite || !token) return false;
    if (token === tavoite) return true;

    // Koko kuultu sana äänteinä: "kaa" ~ "ka", "gaa" ~ "ka"
    if (tavutVastaavat(tavoite, token)) return true;

    // Tavoitetavu kuullun sanan alussa: "KIS" ~ "kissa"
    if (tavoite.length >= 2 && token.indexOf(tavoite) === 0) return true;

    // Tavoitetavu jonain kuullun sanan tavuna: "KA" ~ "ka-na-va".
    // Rajataan lyhyisiin sanoihin, ettei mikä tahansa pitkä sana kelpaa.
    if (TAVUTIN) {
      var tavut = TAVUTIN.tavuta(token);
      if (tavut.length <= 4) {
        for (var i = 0; i < tavut.length; i++) {
          if (tavutVastaavat(tavoite, tavut[i])) return true;
        }
      }
    }
    return false;
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
    foneettinen: foneettinen,
    tavutVastaavat: tavutVastaavat,
    sanaOsuu: sanaOsuu,
    tavuOsuu: tavuOsuu,
    tavuTokenOsuu: tavuTokenOsuu,
    jonoOsuu: jonoOsuu,
    kokoSanaOsuu: kokoSanaOsuu,
    lauseOsuu: lauseOsuu
  };
})();

if (typeof module !== "undefined") module.exports = VERTAILU;
