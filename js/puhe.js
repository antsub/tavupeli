"use strict";
/* =====================================================================
   PUHE — puheentunnistus (Web Speech API) ja puhesynteesi suomeksi.
   ---------------------------------------------------------------------
   iPadilla ja iPhonella tunnistus käyttää Applen omaa sanelua, joka
   osaa suomea. Tunnistus vaatii HTTPS-osoitteen ja mikrofoniluvan.
   Jos tunnistus ei ole käytettävissä, peli siirtyy automaattisesti
   "aikuinen kuuntelee" -tilaan.
   ===================================================================== */

var PUHE = (function () {

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  var tunnistin = null;
  var kuuntelee = false;
  var asetukset = null;
  var lopullinen = "";        // lopulliset tulokset peräkkäin
  var valiaikainen = "";      // viimeisin keskeneräinen arvaus
  var kandidaatit = [];       // kaikki vaihtoehtoiset tulkinnat
  var uudelleenKaynnistykset = 0;
  var ajastimet = { hiljaisuus: null, maksimi: null, eiPuhetta: null };

  function tuettu() { return !!SR; }

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

  function viritaHiljaisuusAjastin() {
    if (!asetukset || !asetukset.jatkuva) return;
    clearTimeout(ajastimet.hiljaisuus);
    ajastimet.hiljaisuus = setTimeout(function () {
      lopeta("valmis");
    }, asetukset.hiljaisuusMs || 2800);
  }

  /* Aloittaa kuuntelun.
     asetukset = {
       jatkuva: true/false   — pitkille lauseille true
       maksimiMs, hiljaisuusMs, eiPuhettaMs
       tulos(teksti, kandidaatit)         — kutsutaan aina kun kuullaan jotain
       loppu(teksti, kandidaatit, syy)    — kuuntelu päättyi
                                            syy: valmis|aika|ei-puhetta|estetty|virhe|kayttaja
     } */
  function aloita(a) {
    if (!SR) return false;
    if (kuuntelee) lopeta("kayttaja");

    asetukset = a;
    lopullinen = "";
    valiaikainen = "";
    kandidaatit = [];
    uudelleenKaynnistykset = 0;
    kuuntelee = true;

    tunnistin = new SR();
    tunnistin.lang = "fi-FI";
    tunnistin.continuous = !!a.jatkuva;
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
      if (virhe === "no-speech") { lopeta("ei-puhetta"); return; }
      if (virhe === "not-allowed" || virhe === "service-not-allowed") { lopeta("estetty"); return; }
      if (virhe === "aborted") return; // stop() aiheuttaa tämän joskus
      lopeta("virhe");
    };

    tunnistin.onend = function () {
      if (!kuuntelee) return;
      if (asetukset && asetukset.jatkuva && uudelleenKaynnistykset < 8) {
        // iOS lopettaa tunnistuksen jokaisen tauon jälkeen — jatketaan
        // kunnes hiljaisuus- tai maksimiaika täyttyy.
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
      return false;
    }
    return true;
  }

  /* ---------------------- Puhesynteesi (ääneen lukeminen) ------------ */

  var aani = null;

  function etsiAani() {
    if (!("speechSynthesis" in window)) return;
    var lista = window.speechSynthesis.getVoices() || [];
    var suomi = lista.filter(function (v) {
      return (v.lang || "").toLowerCase().indexOf("fi") === 0;
    });
    // Applen "Satu" on yleensä paras suomenkielinen ääni.
    aani = suomi.filter(function (v) { return /satu/i.test(v.name); })[0] || suomi[0] || null;
  }

  if ("speechSynthesis" in window) {
    etsiAani();
    window.speechSynthesis.onvoiceschanged = etsiAani;
  }

  function sano(teksti, nopeus, kunValmis) {
    if (!("speechSynthesis" in window)) { if (kunValmis) kunValmis(); return; }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(String(teksti));
    u.lang = "fi-FI";
    if (aani) u.voice = aani;
    u.rate = nopeus || 0.8;
    u.pitch = 1.05;
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
      sano(osa, 0.7, function () { setTimeout(seuraava, 250); });
    }
    seuraava();
  }

  function hiljenna() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  // iOS vaatii että puhesynteesi "herätetään" käyttäjän napautuksella.
  function herata() {
    if (!("speechSynthesis" in window)) return;
    etsiAani();
    var u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }

  return {
    tuettu: tuettu,
    aloita: aloita,
    lopeta: lopeta,
    kuunteleeko: function () { return kuuntelee; },
    sano: sano,
    sanoJono: sanoJono,
    hiljenna: hiljenna,
    herata: herata
  };
})();
