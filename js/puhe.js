"use strict";
/* =====================================================================
   PUHE — puheentunnistus (Web Speech API) ja puhesynteesi suomeksi.
   ---------------------------------------------------------------------
   PUHESYNTEESI (peli puhuu)
     Ääni on säädettävissä aikuisten paneelista: laitteelta löytyvät
     suomenkieliset äänet, nopeus ja äänenkorkeus. Laadun ratkaisee
     ennen kaikkea se, mikä ääni laitteeseen on asennettu — iPadilla ja
     iPhonella kannattaa ladata "Satu (parannettu)" -ääni, joka kuulostaa
     selvästi luonnollisemmalta kuin peruslaatuinen.

     Äänellä on kaksi roolia:
       "opetus" — mallilukeminen. Selkeä ja rauhallinen; tämä on
                  pedagogiikkaa, joten sitä ei sotketa tehosteilla.
       "hahmo"  — velhon/kertojan repliikit. Matalampi ja verkkaisempi,
                  eli tunnelmaa saa ilman että mallilukeminen kärsii.

   PUHEENTUNNISTUS (peli kuuntelee)
     Vaatii https-osoitteen ja mikrofoniluvan. Lapsen hidas, tavuttava
     lukeminen on tunnistukselle vaikeaa, joten peli tarjoaa kaksi tapaa:
       - napauta ja puhu (peli päättää kuuntelun hiljaisuudesta)
       - PIDÄ NAPPIA POHJASSA ja puhu, päästä irti kun valmis
     Jälkimmäinen on selvästi luotettavampi, koska tunnistuksen ei
     tarvitse arvailla milloin lapsi lopetti.
   ===================================================================== */

var PUHE = (function () {

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  // iOS ja Safari käyttäytyvät puheen kanssa omalla tavallaan:
  // jatkuva tunnistus katkeilee ja puhesynteesi varaa äänilaitteen.
  var IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var SAFARI = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  var OMA_TAPA = IOS || SAFARI;

  var tunnistin = null;
  var kuuntelee = false;
  var asetukset = null;
  var lopullinen = "";        // lopulliset tulokset peräkkäin
  var valiaikainen = "";      // viimeisin keskeneräinen arvaus
  var kandidaatit = [];       // kaikki vaihtoehtoiset tulkinnat
  var uudelleenKaynnistykset = 0;
  var viimeisinVirhe = null;  // vianetsintää varten
  var ajastimet = { hiljaisuus: null, maksimi: null, eiPuhetta: null };

  function tuettu() { return !!SR; }
  function viimeVirhe() { return viimeisinVirhe; }

  // Ihmisluettava selitys tunnistuksen virhekoodille.
  function virheSelitys(koodi) {
    var selitykset = {
      "not-allowed": "Mikrofonilupa puuttuu. Salli mikrofoni selaimen asetuksista.",
      "service-not-allowed": "Selain ei anna käyttää puheentunnistusta. Kokeile Safaria.",
      "no-speech": "Peli ei kuullut puhetta. Puhu lähempänä ja kovempaa.",
      "audio-capture": "Mikrofonia ei löytynyt.",
      "network": "Puheentunnistus tarvitsee nettiyhteyden — yhteys ei toiminut.",
      "aborted": "Kuuntelu keskeytyi.",
      "language-not-supported": "Tämä selain ei tunnista suomea. Kokeile Safaria."
    };
    return selitykset[koodi] || ("Tuntematon virhe: " + koodi);
  }

  function peruAjastimet() {
    clearTimeout(ajastimet.hiljaisuus);
    clearTimeout(ajastimet.maksimi);
    clearTimeout(ajastimet.eiPuhetta);
  }

  function kokoTeksti() {
    return (lopullinen + " " + valiaikainen).replace(/\s+/g, " ").trim();
  }

  function kaikkiKandidaatit() {
    var lista = [kokoTeksti()];
    for (var i = 0; i < kandidaatit.length; i++) {
      if (lista.indexOf(kandidaatit[i]) < 0) lista.push(kandidaatit[i]);
    }
    if (valiaikainen && lista.indexOf(valiaikainen.trim()) < 0) lista.push(valiaikainen.trim());
    return lista.filter(function (t) { return t.length > 0; });
  }

  // Päättää kuuntelun ja ilmoittaa tuloksen pelille.
  function lopeta(syy) {
    if (!kuuntelee) return;
    kuuntelee = false;
    peruAjastimet();
    if (tunnistin) {
      try { tunnistin.stop(); } catch (e) { /* jo pysähtynyt */ }
    }
    var a = asetukset;
    asetukset = null;
    if (a && a.loppu) a.loppu(kokoTeksti(), kaikkiKandidaatit(), syy || "loppu");
  }

  // Napautus (lyhyt painallus) vaihtaa pidä-pohjassa -tilasta
  // automaattitilaan, jolloin hiljaisuus päättää kuuntelun.
  function vapautaPito() {
    if (!kuuntelee || !asetukset) return;
    asetukset.pidetaanPohjassa = false;
    viritaHiljaisuusAjastin();
  }

  function viritaHiljaisuusAjastin() {
    if (!asetukset) return;
    clearTimeout(ajastimet.hiljaisuus);
    // Pidä-pohjassa-tilassa lapsi päättää itse milloin lopettaa.
    if (asetukset.pidetaanPohjassa) return;
    ajastimet.hiljaisuus = setTimeout(function () {
      lopeta("valmis");
    }, asetukset.hiljaisuusMs || 2800);
  }

  /* Aloittaa kuuntelun.
     asetukset = {
       jatkuva: true/false          — pitkille lauseille true
       pidetaanPohjassa: true/false — lapsi pitää nappia pohjassa
       maksimiMs, hiljaisuusMs, eiPuhettaMs
       tulos(teksti, kandidaatit)         — kutsutaan aina kun kuullaan jotain
       loppu(teksti, kandidaatit, syy)    — kuuntelu päättyi
                                            syy: valmis|aika|ei-puhetta|estetty|virhe|kayttaja
     } */
  function aloita(a) {
    if (!SR) return false;
    if (kuuntelee) lopeta("kayttaja");

    // Puhesynteesi varaa äänilaitteen etenkin iOS:llä. Jos peli on juuri
    // puhunut, tunnistus ei käynnisty kunnolla — vaimennetaan ensin.
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    asetukset = a;
    lopullinen = "";
    valiaikainen = "";
    kandidaatit = [];
    uudelleenKaynnistykset = 0;
    viimeisinVirhe = null;
    kuuntelee = true;

    tunnistin = new SR();
    tunnistin.lang = "fi-FI";
    // Safarissa ja iOS:llä jatkuva tunnistus katkeilee ja aiheuttaa
    // toistuvia uudelleenkäynnistyksiä. Kertakuuntelu on luotettavampi.
    tunnistin.continuous = !!a.jatkuva && !OMA_TAPA;
    tunnistin.interimResults = true;
    tunnistin.maxAlternatives = 4;

    tunnistin.onresult = function (e) {
      if (!kuuntelee) return;
      clearTimeout(ajastimet.eiPuhetta);
      valiaikainen = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var r = e.results[i];
        if (r.isFinal) {
          lopullinen += " " + r[0].transcript;
          for (var j = 0; j < r.length; j++) {
            var vaihtoehto = String(r[j].transcript || "").trim();
            if (vaihtoehto) kandidaatit.push(vaihtoehto);
          }
        } else {
          valiaikainen += " " + r[0].transcript;
        }
      }
      lopullinen = lopullinen.replace(/\s+/g, " ");
      viritaHiljaisuusAjastin();
      if (asetukset && asetukset.tulos) asetukset.tulos(kokoTeksti(), kaikkiKandidaatit());
    };

    tunnistin.onerror = function (e) {
      if (!kuuntelee) return;
      var virhe = e && e.error;
      viimeisinVirhe = { koodi: virhe, selitys: virheSelitys(virhe) };
      if (virhe === "no-speech") { lopeta("ei-puhetta"); return; }
      if (virhe === "not-allowed" || virhe === "service-not-allowed") { lopeta("estetty"); return; }
      if (virhe === "aborted") return; // stop() aiheuttaa tämän joskus
      lopeta("virhe");
    };

    tunnistin.onend = function () {
      if (!kuuntelee) return;
      // Pidä-pohjassa-tilassa jatketaan kunnes sormi nostetaan.
      var jatketaanko = asetukset &&
        (asetukset.pidetaanPohjassa || (asetukset.jatkuva && !OMA_TAPA));
      var raja = OMA_TAPA ? 3 : 8;
      if (jatketaanko && uudelleenKaynnistykset < raja) {
        uudelleenKaynnistykset++;
        try { tunnistin.start(); return; } catch (e) { /* jatketaan alas */ }
      }
      lopeta(kokoTeksti() ? "valmis" : "ei-puhetta");
    };

    ajastimet.maksimi = setTimeout(function () { lopeta("aika"); }, a.maksimiMs || 12000);
    ajastimet.eiPuhetta = setTimeout(function () {
      if (!kokoTeksti()) lopeta("ei-puhetta");
    }, a.eiPuhettaMs || 8000);

    try {
      tunnistin.start();
    } catch (e) {
      kuuntelee = false;
      peruAjastimet();
      viimeisinVirhe = { koodi: "start-epaonnistui", selitys: "Tunnistusta ei saatu käynnistettyä." };
      return false;
    }
    return true;
  }

  /* ---------------------- Puhesynteesi (ääneen lukeminen) ------------ */

  var kaikkiAanet = [];
  var valittuAani = null;

  // Aikuisten paneelista säädettävät. nopeus 0.5–1.2, korkeus 0.5–1.5.
  var aaniAsetus = { nimi: null, nopeus: 0.8, korkeus: 1.0, hahmoAani: true };

  function onSuomiAani(v) {
    return (v.lang || "").toLowerCase().indexOf("fi") === 0;
  }

  function paivitaAanet() {
    if (!("speechSynthesis" in window)) return;
    kaikkiAanet = window.speechSynthesis.getVoices() || [];
    valitseAani();
  }

  function valitseAani() {
    var suomi = kaikkiAanet.filter(onSuomiAani);

    // 1) Aikuisen valitsema ääni, jos se on yhä olemassa.
    if (aaniAsetus.nimi) {
      var toive = kaikkiAanet.filter(function (v) { return v.name === aaniAsetus.nimi; })[0];
      if (toive) { valittuAani = toive; return; }
    }
    // 2) Paras suomenkielinen: parannetut/premium-äänet kuulostavat
    //    selvästi luonnollisemmilta kuin peruslaatuiset.
    var parannettu = suomi.filter(function (v) {
      return /enhanced|premium|neural|parannettu/i.test(v.name);
    })[0];
    valittuAani = parannettu || suomi.filter(function (v) {
      return /satu/i.test(v.name);
    })[0] || suomi[0] || null;
  }

  if ("speechSynthesis" in window) {
    paivitaAanet();
    window.speechSynthesis.onvoiceschanged = paivitaAanet;
  }

  // Onko laitteessa lainkaan suomenkielistä ääntä? Ilman sitä selain
  // lukee suomea vieraskielisellä äänellä, mikä kuulostaa konemaiselta
  // eikä kelpaa mallilukemiseksi.
  function onkoSuomiAania() {
    return kaikkiAanet.some(onSuomiAani);
  }

  // Valittavissa olevat äänet aikuisten paneelin valikkoon.
  function aanivaihtoehdot() {
    var suomi = kaikkiAanet.filter(onSuomiAani);
    var lista = suomi.length ? suomi : kaikkiAanet;
    return lista.map(function (v) {
      return { nimi: v.name, kieli: v.lang, suomi: onSuomiAani(v) };
    });
  }

  function asetaAaniAsetukset(uudet) {
    if (!uudet) return;
    if (uudet.nimi !== undefined) aaniAsetus.nimi = uudet.nimi;
    if (uudet.nopeus !== undefined) aaniAsetus.nopeus = uudet.nopeus;
    if (uudet.korkeus !== undefined) aaniAsetus.korkeus = uudet.korkeus;
    if (uudet.hahmoAani !== undefined) aaniAsetus.hahmoAani = uudet.hahmoAani;
    valitseAani();
  }

  function aaniAsetukset() {
    return {
      nimi: valittuAani ? valittuAani.name : null,
      nopeus: aaniAsetus.nopeus,
      korkeus: aaniAsetus.korkeus,
      hahmoAani: aaniAsetus.hahmoAani
    };
  }

  /* sano(teksti, valinnat, kunValmis)
     valinnat = { rooli: "opetus" | "hahmo", nopeus: kerroin }
     Mallilukeminen pidetään aina selkeänä; hahmorooli saa velhomaisen
     matalan ja verkkaisen sävyn. */
  function sano(teksti, valinnat, kunValmis) {
    if (typeof valinnat === "function") { kunValmis = valinnat; valinnat = null; }
    if (typeof valinnat === "number") valinnat = { nopeus: valinnat };
    valinnat = valinnat || {};

    if (!("speechSynthesis" in window)) { if (kunValmis) kunValmis(); return; }
    window.speechSynthesis.cancel();

    var u = new SpeechSynthesisUtterance(String(teksti));
    u.lang = "fi-FI";
    if (valittuAani) u.voice = valittuAani;

    var nopeus = aaniAsetus.nopeus * (valinnat.nopeus || 1);
    var korkeus = aaniAsetus.korkeus;
    if (valinnat.rooli === "hahmo" && aaniAsetus.hahmoAani) {
      // Velhon sävy: matalampi ja hitaampi, muttei epäselvä.
      nopeus *= 0.9;
      korkeus *= 0.8;
    }
    u.rate = Math.max(0.4, Math.min(1.5, nopeus));
    u.pitch = Math.max(0.4, Math.min(1.6, korkeus));

    var valmisKutsuttu = false;
    function valmis() {
      if (valmisKutsuttu) return;
      valmisKutsuttu = true;
      if (kunValmis) kunValmis();
    }
    u.onend = valmis;
    u.onerror = valmis;
    window.speechSynthesis.speak(u);
    // Varmistus: jos onend ei koskaan tule (vanhat selaimet).
    setTimeout(valmis, 1500 + String(teksti).length * 130);
  }

  // Lukee listan osia tauoilla: ["KIS","SA"] -> "KIS ... SA".
  function sanoJono(osat, kunValmis) {
    var i = 0;
    function seuraava() {
      if (i >= osat.length) { if (kunValmis) kunValmis(); return; }
      var osa = osat[i++];
      sano(osa, { nopeus: 0.85 }, function () { setTimeout(seuraava, 250); });
    }
    seuraava();
  }

  function hiljenna() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // iOS vaatii että puhesynteesi "herätetään" käyttäjän napautuksella.
  function herata() {
    if (!("speechSynthesis" in window)) return;
    paivitaAanet();
    var u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }

  // Vianetsintää varten aikuisten paneeliin.
  function laitetiedot() {
    return {
      tunnistusTuettu: !!SR,
      suomiAani: onkoSuomiAania(),
      aaniaYhteensa: kaikkiAanet.length,
      valittuAani: valittuAani ? valittuAani.name + " (" + valittuAani.lang + ")" : "ei ääntä",
      ios: IOS,
      safari: SAFARI,
      https: location.protocol === "https:" || location.hostname === "localhost",
      kehyksessa: window.self !== window.top,
      viimeVirhe: viimeisinVirhe
    };
  }

  return {
    tuettu: tuettu,
    aloita: aloita,
    lopeta: lopeta,
    vapautaPito: vapautaPito,
    kuunteleeko: function () { return kuuntelee; },
    viimeVirhe: viimeVirhe,
    virheSelitys: virheSelitys,
    sano: sano,
    sanoJono: sanoJono,
    hiljenna: hiljenna,
    herata: herata,
    aanivaihtoehdot: aanivaihtoehdot,
    asetaAaniAsetukset: asetaAaniAsetukset,
    aaniAsetukset: aaniAsetukset,
    onkoSuomiAania: onkoSuomiAania,
    laitetiedot: laitetiedot
  };
})();
