"use strict";
/* =====================================================================
   PELI — Tavuritari: taistele hirviöitä vastaan lukemalla ääneen!
   ---------------------------------------------------------------------
   Pelin rakenne:
     * Lapsi lukee "loitsuja" (tavuja, sanoja, lauseita, satuja) ääneen.
     * Jokainen oikein luettu loitsu on osuma hirviöön.
     * Kun hirviön voimat loppuvat, se kukistuu ja lapsi saa aarteen.
     * Sadut ovat pomotaisteluita: yksi virke = yksi osuma pomoon.

   Mukautuva vaikeustaso (lapselle näkymätön):
     * 3 puhdasta onnistumista peräkkäin -> lukutaso nousee hiljaa.
     * 2 vaikeaa tehtävää peräkkäin   -> lukutaso laskee hiljaa.
     * Jos tehtävä ei suju, peli auttaa portaittain: kannustus ->
       ääneen luettu malli -> tehtävä pilkotaan paloihin (sana tavuiksi,
       lause sanoiksi) -> lopulta mennään eteenpäin iloisesti.
     * Sankaritaso (arvonimi + tähdet) vain nousee — se ei koskaan
       rankaise, joten lapsi näkee aina edistyvänsä.
   ===================================================================== */

(function () {

  /* ================= apurit ================= */

  function $(id) { return document.getElementById(id); }

  function luo(tagi, luokka, teksti) {
    var e = document.createElement(tagi);
    if (luokka) e.className = luokka;
    if (teksti !== undefined) e.textContent = teksti;
    return e;
  }

  function satunnainen(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  // "Räkämöykky" -> "rakamoykky" — käytetään kuvatiedostojen nimissä.
  function tunnus(nimi) {
    return String(nimi || "").toLowerCase()
      .replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /* Kuvatuki: jos kuvat/-kansiosta löytyy kuva, käytetään sitä —
     muuten peli piirtää hahmon itse. Tulokset muistetaan, ettei samaa
     puuttuvaa kuvaa yritetä ladata uudestaan. */
  var kuvaVarasto = {};

  function naytaKuva(img, polku, kunTietoa) {
    if (kuvaVarasto[polku] === false) { kunTietoa(false); return; }
    if (kuvaVarasto[polku] === true && img.getAttribute("src") === polku) { kunTietoa(true); return; }
    img.onload = function () { kuvaVarasto[polku] = true; kunTietoa(true); };
    img.onerror = function () { kuvaVarasto[polku] = false; img.removeAttribute("src"); kunTietoa(false); };
    img.src = polku;
    if (kuvaVarasto[polku] === true) kunTietoa(true);
  }

  /* ================= pysyvä tila ================= */

  var AVAIN_TILA = "tavuritari_tila";
  var AVAIN_SANAT = "tavuritari_omat_sanat";
  var AVAIN_TARINAT = "tavuritari_omat_tarinat";

  function oletusTila() {
    return {
      lukutaso: 1,          // 1..8, mukautuu automaattisesti (piilossa lapselta)
      tahdet: 0,            // XP-tähdet — eivät koskaan vähene
      kolikot: 0,           // 🪙 kaupan valuutta
      kilvet: 3,            // 🛡️ torjuu hirviöiden hassut vastaiskut
      varusteet: [],        // kaupasta ostetut varusteet (tunnukset)
      kombo: 0,             // 🔥 lukuputki — kasvattaa vahinkoa, säilyy taisteluista toiseen
      syoksyJono: false,    // ansaittu kombosyöksy odottaa vuoroaan
      komboPituus: 3,       // kombosyöksyn palojen määrä (kiihtyy 3 -> 5)
      putki: 0,             // peräkkäiset puhtaat onnistumiset
      kompuroinnit: 0,      // peräkkäiset vaikeat tehtävät
      arvonimiIndeksi: 0,
      avatar: "ritari",
      reppu: {},            // aarteen nimi -> lukumäärä
      voitot: 0,
      tilastot: { paivittain: {}, hankalat: {} },  // raportti aikuiselle
      alue: null,           // koulun alue jolla ollaan (tunnus)
      vastustaja: null,     // kesken oleva taistelu
      tarina: null,         // { nimi, virke } kun pomotaistelu käynnissä
      tarinatLuettu: {},
      asetukset: { aanet: true, isotKirjaimet: true, aikuistila: false }
    };
  }

  function lataaTila() {
    try {
      var raaka = localStorage.getItem(AVAIN_TILA);
      if (!raaka) return oletusTila();
      var t = JSON.parse(raaka);
      var pohja = oletusTila();
      for (var k in pohja) if (t[k] === undefined) t[k] = pohja[k];
      for (var a in pohja.asetukset) if (t.asetukset[a] === undefined) t.asetukset[a] = pohja.asetukset[a];
      if (!t.tilastot.paivittain) t.tilastot.paivittain = {};
      if (!t.tilastot.hankalat) t.tilastot.hankalat = {};
      return t;
    } catch (e) { return oletusTila(); }
  }

  function lataaLista(avain) {
    try { return JSON.parse(localStorage.getItem(avain)) || []; }
    catch (e) { return []; }
  }

  function tallenna() {
    try {
      localStorage.setItem(AVAIN_TILA, JSON.stringify(tila));
      localStorage.setItem(AVAIN_SANAT, JSON.stringify(omatSanat));
      localStorage.setItem(AVAIN_TARINAT, JSON.stringify(omatTarinat));
    } catch (e) { /* yksityinen selaus tms. — peli toimii silti */ }
  }

  var tila = lataaTila();
  var omatSanat = lataaLista(AVAIN_SANAT);
  var omatTarinat = lataaLista(AVAIN_TARINAT);

  /* ================= muuttuva pelitila ================= */

  var tehtava = null;
  var mikkiEstetty = false;
  var viimeksiNaytetyt = [];
  var viimeVastustaja = null;
  var odottavaArvonimi = null;
  var odottavaAlue = null;

  /* ================= lukutasot ================= */

  var LUKUTASOT = [
    { tyyppi: "tavu", lyhyt: true },     // 1: KA, SU ...
    { tyyppi: "tavu", lyhyt: false },    // 2: KAK, PRÖT ...
    { tyyppi: "sana", viivat: true, minT: 2, maxT: 2 },   // 3: KAK-KA
    { tyyppi: "sana", viivat: true, minT: 3, maxT: 99 },  // 4: PIE-RU-PIL-LI
    { tyyppi: "sana", viivat: false, minT: 2, maxT: 3 },  // 5: kakka (ilman viivoja)
    { tyyppi: "lause", minS: 1, maxS: 4 },                // 6: lyhyet lauseet
    { tyyppi: "lause", minS: 5, maxS: 99 },               // 7: pitkät lauseet
    { tyyppi: "tarina" }                                  // 8: pomotaistelut
  ];

  /* ================= sisällön kokoaminen ================= */

  function kaikkiSanat() { return SISALTO.sanat.concat(omatSanat); }
  function kaikkiTarinat() { return SISALTO.tarinat.concat(omatTarinat); }

  function virkkeiksi(teksti) {
    var osat = String(teksti || "").match(/[^.!?]+[.!?]*/g) || [];
    var tulos = [];
    for (var i = 0; i < osat.length; i++) {
      var s = osat[i].trim();
      if (s) tulos.push(s);
    }
    return tulos;
  }

  function kirjaimia(teksti) {
    return VERTAILU.normalisoi(teksti).replace(/ /g, "").length;
  }

  // Suodattaa listan; jos suodatus tyhjentäisi kaiken, palautetaan koko lista.
  function suodataTaiKaikki(lista, ehto) {
    var osa = lista.filter(ehto);
    return osa.length ? osa : lista;
  }

  // Vältetään saman tehtävän toistumista heti perään.
  function valitseUusi(lista) {
    var tuoreet = lista.filter(function (x) {
      var avain = typeof x === "string" ? x : x.nimi;
      return viimeksiNaytetyt.indexOf(avain) < 0;
    });
    var valinta = satunnainen(tuoreet.length ? tuoreet : lista);
    var avain = typeof valinta === "string" ? valinta : valinta.nimi;
    viimeksiNaytetyt.push(avain);
    if (viimeksiNaytetyt.length > 6) viimeksiNaytetyt.shift();
    return valinta;
  }

  /* ================= tekstin muotoilu ================= */

  function muotoileSana(t) {
    return tila.asetukset.isotKirjaimet ? t.toUpperCase() : t.toLowerCase();
  }

  function muotoileLause(t) {
    return tila.asetukset.isotKirjaimet ? t.toUpperCase() : t;
  }

  /* ================= puhekupla, toast, konfetti ================= */

  function kupla(teksti) {
    var e = $("puhekupla");
    e.textContent = teksti;
    e.classList.remove("pomppaa");
    void e.offsetWidth; // käynnistää animaation uudelleen
    e.classList.add("pomppaa");
  }

  var toastAjastin = null;
  function toast(teksti) {
    var e = $("toast");
    e.textContent = teksti;
    e.classList.add("nakyy");
    clearTimeout(toastAjastin);
    toastAjastin = setTimeout(function () { e.classList.remove("nakyy"); }, 2600);
  }

  function konfetti(maara, emojit) {
    var alusta = $("konfetti-alusta");
    for (var i = 0; i < maara; i++) {
      var pala = luo("span", "konfetti", satunnainen(emojit));
      pala.style.left = (Math.random() * 100) + "vw";
      pala.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
      pala.style.animationDelay = (Math.random() * 0.4) + "s";
      pala.style.fontSize = (18 + Math.random() * 22) + "px";
      alusta.appendChild(pala);
      pala.addEventListener("animationend", function () {
        if (this.parentNode) this.parentNode.removeChild(this);
      });
    }
  }

  /* ================= peitteet (overlayt) ================= */

  function naytaPeite(id) { $(id).classList.add("nakyy"); }
  function piilotaPeite(id) { $(id).classList.remove("nakyy"); }

  /* ================= arvonimet ================= */

  function arvonimiTahdilla(tahdet) {
    var lista = SISALTO.arvonimet;
    var indeksi = 0;
    for (var i = 0; i < lista.length; i++) if (tahdet >= lista[i].raja) indeksi = i;
    return indeksi;
  }

  function tarkistaArvonimi() {
    var uusi = arvonimiTahdilla(tila.tahdet);
    if (uusi > tila.arvonimiIndeksi) {
      tila.arvonimiIndeksi = uusi;
      odottavaArvonimi = SISALTO.arvonimet[uusi];
    }
  }

  function naytaArvonimiJuhla() {
    var a = odottavaArvonimi;
    odottavaArvonimi = null;
    $("arvonimi-emoji").textContent = a.emoji;
    $("arvonimi-teksti").textContent = "Olet nyt " + a.nimi.toUpperCase() + "!";
    naytaPeite("arvonimi-juhla");
    AANET.fanfaari();
    konfetti(40, ["🎉", "⭐", "👑", "💫", "🌈"]);
  }

  /* ================= varusteet ================= */

  function omistaa(tunnus) {
    return tila.varusteet.indexOf(tunnus) >= 0;
  }

  function omatVarusteet() {
    return (SISALTO.varusteet || []).filter(function (v) { return omistaa(v.tunnus); });
  }

  function miekkaBonus() {
    var paras = 0;
    omatVarusteet().forEach(function (v) {
      if (v.tyyppi === "miekka" && v.vahinko > paras) paras = v.vahinko;
    });
    return paras;
  }

  function kilpiKatto() {
    var katto = 3;
    omatVarusteet().forEach(function (v) {
      if (v.tyyppi === "kilpi" && v.kilpiMax > katto) katto = v.kilpiMax;
    });
    return katto;
  }

  // Kilvet + varusteet sankarin vierellä.
  function paivitaSankariRivi() {
    var osat = [];
    for (var i = 0; i < kilpiKatto(); i++) osat.push(i < tila.kilvet ? "🛡️" : "▫️");
    var muut = omatVarusteet()
      .filter(function (v) { return v.tyyppi !== "kilpi"; })
      .map(function (v) { return v.emoji.slice(0, 2); });
    $("sankari-rivi").textContent = osat.join("") + (muut.length ? "  " + muut.join(" ") : "");
  }

  /* ================= kombo ================= */

  function paivitaKombo() {
    var e = $("kombo-merkki");
    var kombo = tila.kombo || 0;
    if (kombo >= 2) {
      e.textContent = "🔥 KOMBO ×" + kombo;
      e.classList.add("nakyy");
      e.classList.remove("poksahdus");
      void e.offsetWidth;
      e.classList.add("poksahdus");
    } else {
      e.classList.remove("nakyy");
    }
  }

  /* ================= HUD ================= */

  function paivitaHUD() {
    var a = SISALTO.arvonimet[tila.arvonimiIndeksi];
    $("arvonimi-merkki").textContent = a.emoji + " " + a.nimi;
    $("xp-merkki").textContent = "⭐ " + tila.tahdet;
    $("kolikko-merkki").textContent = "🪙 " + tila.kolikot;
    $("aani-nappi").textContent = tila.asetukset.aanet ? "🔊" : "🔇";
    paivitaSankariRivi();
    paivitaKombo();
  }

  function poksautaXP() {
    var e = $("xp-merkki");
    e.classList.remove("poksahdus");
    void e.offsetWidth;
    e.classList.add("poksahdus");
  }

  /* ================= alueet ================= */

  function alueTasolle(taso) {
    var lista = SISALTO.alueet || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].tasot && lista[i].tasot.indexOf(taso) >= 0) return lista[i];
    }
    return lista[lista.length - 1] || null;
  }

  function nykyinenAlue() {
    return alueTasolle(tehokasLukutaso());
  }

  function paivitaAreena() {
    var alue = nykyinenAlue();
    if (!alue) return;
    $("taistelu").style.backgroundImage =
      'url("kuvat/alue-' + alue.tunnus + '.png"), ' +
      "radial-gradient(ellipse at 50% 118%, " + alue.vari2 + " 0%, transparent 60%), " +
      "linear-gradient(180deg, " + alue.vari1 + " 0%, " + alue.vari2 + " 100%)";
    $("alue-nimi").textContent = alue.emoji + " " + alue.nimi;
  }

  function naytaAluevaihto() {
    var alue = odottavaAlue;
    odottavaAlue = null;
    $("aluevaihto-emoji").textContent = alue.emoji;
    $("aluevaihto-otsikko").textContent = alue.nimi;
    $("aluevaihto-kuvaus").textContent = alue.kuvaus || "";
    var peite = $("aluevaihto");
    peite.classList.remove("ovellinen");
    naytaKuva($("aluevaihto-ovi"), "kuvat/ovi-" + alue.tunnus + ".png", function (loytyi) {
      peite.classList.toggle("ovellinen", loytyi);
    });
    naytaPeite("aluevaihto");
    AANET.fanfaari();
    konfetti(24, ["🗝️", "✨", "⭐", "🚪"]);
  }

  /* ================= vastustajat ================= */

  function uusiVastustaja() {
    var alue = nykyinenAlue();
    var lista = suodataTaiKaikki(SISALTO.vastustajat, function (m) {
      return !m.alue || (alue && m.alue === alue.tunnus);
    });
    var def = satunnainen(lista);
    if (lista.length > 1) {
      while (def.nimi === viimeVastustaja) def = satunnainen(lista);
    }
    viimeVastustaja = def.nimi;
    tila.vastustaja = {
      nimi: def.nimi, hp: def.hp, hpMax: def.hp,
      vari1: def.vari1, vari2: def.vari2,
      silmia: def.silmia, rekvisiitta: def.rekvisiitta, pomo: false,
      sarvet: !!def.sarvet, hampaat: !!def.hampaat,
      repliikat: def.repliikat || null
    };
  }

  function aloitaPomo() {
    var tarina = tarinaNimella(tila.tarina.nimi);
    var virkkeet = virkkeiksi(tarina.teksti);
    tila.vastustaja = {
      nimi: "POMO: " + tarina.nimi,
      hp: (virkkeet.length - tila.tarina.virke) * 10,
      hpMax: virkkeet.length * 10,
      vari1: "#f28d77", vari2: "#b23a48",
      silmia: 3, rekvisiitta: tarina.emoji || "📖", pomo: true,
      sarvet: true, hampaat: true
    };
  }

  function tarinaNimella(nimi) {
    var lista = kaikkiTarinat();
    for (var i = 0; i < lista.length; i++) if (lista[i].nimi === nimi) return lista[i];
    return lista[0];
  }

  function renderoiVastustaja(saapuu) {
    var v = tila.vastustaja;
    if (!v) return;
    var e = $("vastustaja");
    asetaMorkoTila("perus");
    e.style.setProperty("--m-vari1", v.vari1);
    e.style.setProperty("--m-vari2", v.vari2);
    e.classList.toggle("pomo", !!v.pomo);
    e.classList.toggle("sarvet", !!v.sarvet);
    e.classList.toggle("hampaat", !!v.hampaat);

    var silmat = e.querySelector(".morko-silmat");
    silmat.textContent = "";
    for (var i = 0; i < v.silmia; i++) {
      var silma = luo("div", "morko-silma");
      silma.appendChild(luo("div", "morko-pupilli"));
      silmat.appendChild(silma);
    }
    $("vastustaja-rekvisiitta").textContent = v.rekvisiitta || "";
    $("vastustaja-nimi").textContent = v.nimi;
    renderoiHP();
    paivitaKombo();

    // Käytä oikeaa kuvaa jos sellainen on kuvat/-kansiossa.
    e.classList.remove("kuvallinen");
    var kuvanNimi = v.pomo ? "hirvio-pomo" : "hirvio-" + tunnus(v.nimi);
    naytaKuva($("vastustaja-kuva"), "kuvat/" + kuvanNimi + ".png", function (loytyi) {
      e.classList.toggle("kuvallinen", loytyi);
    });

    if (saapuu) {
      e.classList.remove("saapuu");
      void e.offsetWidth;
      e.classList.add("saapuu");
    }
  }

  function renderoiHP() {
    var v = tila.vastustaja;
    var palkki = $("vastustaja-hp");
    if (!v) {
      $("hp-tayte").style.width = "0%";
      $("hp-teksti").textContent = "";
      return;
    }
    var osuus = Math.max(0, Math.min(1, v.hp / v.hpMax));
    $("hp-tayte").style.width = (osuus * 100) + "%";
    $("hp-teksti").textContent = "HP " + Math.max(0, v.hp) + " / " + v.hpMax;
    palkki.classList.toggle("matala", osuus <= 0.34);
  }

  /* ================= tehtävän rakentaminen ================= */

  function tehokasLukutaso() {
    // Pomotaistelussa luetaan aina tarinaa loppuun asti.
    if (tila.vastustaja && tila.vastustaja.pomo) return 8;
    // Tason 8 tehtävät ovat pomotaisteluita. Jos käynnissä on vielä
    // tavallinen taistelu, käytetään tason 7 tehtäviä kunnes se päättyy.
    if (tila.lukutaso === 8 && tila.vastustaja && !tila.vastustaja.pomo) return 7;
    return tila.lukutaso;
  }

  function rakennaTehtava() {
    var taso = tehokasLukutaso();
    var def = LUKUTASOT[taso - 1];

    // Ansaittu kombosyöksy: palat luetaan putkeen kiihtyvään tahtiin.
    if (tila.syoksyJono && def.tyyppi !== "tarina") {
      tila.syoksyJono = false;
      rakennaKombosyoksy(taso);
      return;
    }

    if (def.tyyppi === "tarina") {
      var tarina = tarinaNimella(tila.tarina.nimi);
      var virkkeet = virkkeiksi(tarina.teksti);
      var indeksi = Math.min(tila.tarina.virke, virkkeet.length - 1);
      tehtava = {
        tyyppi: "tarina", kohde: virkkeet[indeksi],
        sanat: virkkeet[indeksi].split(/\s+/),
        tarinaNimi: tarina.nimi, virke: indeksi, virkkeita: virkkeet.length,
        emoji: tarina.emoji || "📖",
        yritykset: 0, apu: false, palat: null, ratkaistu: false, osumat: []
      };
      return;
    }

    if (def.tyyppi === "tavu") {
      var tavut = suodataTaiKaikki(SISALTO.tavut, function (t) {
        return def.lyhyt ? kirjaimia(t) <= 2 : kirjaimia(t) >= 3;
      });
      tehtava = {
        tyyppi: "tavu", kohde: valitseUusi(tavut),
        yritykset: 0, apu: false, palat: null, ratkaistu: false
      };
      return;
    }

    if (def.tyyppi === "sana") {
      var sanat = suodataTaiKaikki(kaikkiSanat(), function (s) {
        var maara = TAVUTUS.tavuta(s).length;
        return maara >= def.minT && maara <= def.maxT;
      });
      var sana = valitseUusi(sanat);
      tehtava = {
        tyyppi: "sana", kohde: sana, tavut: TAVUTUS.tavuta(sana), viivat: def.viivat,
        yritykset: 0, apu: false, palat: null, ratkaistu: false
      };
      return;
    }

    // lause
    var lauseet = suodataTaiKaikki(SISALTO.lauseet, function (l) {
      var maara = VERTAILU.sanalista(l).length;
      return maara >= def.minS && maara <= def.maxS;
    });
    var lause = valitseUusi(lauseet);
    tehtava = {
      tyyppi: "lause", kohde: lause, sanat: lause.split(/\s+/),
      yritykset: 0, apu: false, palat: null, ratkaistu: false, osumat: []
    };
  }

  function rakennaKombosyoksy(taso) {
    var maara = Math.min(5, Math.max(3, tila.komboPituus || 3));
    var tavuja = taso <= 2;
    var pooli;
    if (tavuja) {
      pooli = SISALTO.tavut.slice();
    } else {
      pooli = suodataTaiKaikki(kaikkiSanat(), function (s) {
        return TAVUTUS.tavuta(s).length <= (taso >= 6 ? 3 : 2);
      }).slice();
    }
    var osat = [];
    while (osat.length < maara && pooli.length) {
      osat.push(pooli.splice(Math.floor(Math.random() * pooli.length), 1)[0]);
    }
    tehtava = {
      tyyppi: "kombo", kohde: osat.join(" "),
      palat: { tyyppi: tavuja ? "tavut" : "sanat", osat: osat, indeksi: 0, yritykset: 0 },
      yritykset: 0, apu: false, ratkaistu: false
    };
    kupla("⚡ KOMBOSYÖKSY! Lue palat putkeen — jättivahinko!");
  }

  /* ================= tehtävän piirtäminen ================= */

  function renderoiTehtava() {
    var otsikko = $("tehtava-otsikko");
    var kortti = $("tehtava-teksti");
    var pisteet = $("tarina-pisteet");
    kortti.textContent = "";
    pisteet.textContent = "";
    naytaKuultu("");

    if (tehtava.palat) { renderoiPalat(); return; }

    if (tehtava.tyyppi === "tavu") {
      otsikko.textContent = "Sano tavu ääneen:";
      kortti.appendChild(luo("span", "tavu v0", muotoileSana(tehtava.kohde)));
    } else if (tehtava.tyyppi === "sana") {
      otsikko.textContent = "Lue sana ääneen:";
      if (tehtava.viivat) {
        for (var i = 0; i < tehtava.tavut.length; i++) {
          if (i > 0) kortti.appendChild(luo("span", "viiva", "-"));
          kortti.appendChild(luo("span", "tavu v" + (i % 2), muotoileSana(tehtava.tavut[i])));
        }
      } else {
        kortti.appendChild(luo("span", "tavu yksivari", muotoileSana(tehtava.kohde)));
      }
    } else {
      // lause tai tarinan virke
      otsikko.textContent = tehtava.tyyppi === "tarina"
        ? tehtava.emoji + " " + tehtava.tarinaNimi
        : "Lue lause ääneen:";
      for (var s = 0; s < tehtava.sanat.length; s++) {
        if (s > 0) kortti.appendChild(document.createTextNode(" "));
        kortti.appendChild(luo("span", "sana-pala", muotoileLause(tehtava.sanat[s])));
      }
      if (tehtava.tyyppi === "tarina") {
        for (var p = 0; p < tehtava.virkkeita; p++) {
          pisteet.appendChild(luo("span", "piste" + (p < tehtava.virke ? " tehty" : (p === tehtava.virke ? " nykyinen" : ""))));
        }
      }
    }

    sovitaTekstikoko();
    paivitaMikkiTeksti();
  }

  function renderoiPalat() {
    var p = tehtava.palat;
    var otsikko = $("tehtava-otsikko");
    var kortti = $("tehtava-teksti");
    kortti.textContent = "";
    otsikko.textContent = tehtava.tyyppi === "kombo"
      ? "⚡ KOMBOSYÖKSY! Lue palat putkeen:"
      : "Pala kerrallaan! Sano tummennettu pala:";
    for (var i = 0; i < p.osat.length; i++) {
      if (i > 0) kortti.appendChild(document.createTextNode(" "));
      var luokka = "pala" + (i < p.indeksi ? " valmis-pala" : (i === p.indeksi ? " aktiivinen" : " tuleva"));
      var teksti = p.tyyppi === "tavut" ? muotoileSana(p.osat[i]) : muotoileLause(p.osat[i]);
      kortti.appendChild(luo("span", luokka, teksti));
    }
    sovitaTekstikoko();
    paivitaMikkiTeksti();
  }

  function sovitaTekstikoko() {
    var kortti = $("tehtava-teksti");
    var pituus = (kortti.textContent || "").length;
    kortti.classList.remove("pitka", "tosi-pitka");
    if (pituus > 46) kortti.classList.add("tosi-pitka");
    else if (pituus > 24) kortti.classList.add("pitka");
  }

  function varitaOsumat() {
    if (!tehtava || !tehtava.osumat) return;
    var palat = $("tehtava-teksti").querySelectorAll(".sana-pala");
    for (var i = 0; i < palat.length && i < tehtava.osumat.length; i++) {
      palat[i].classList.toggle("oikein", !!tehtava.osumat[i]);
    }
  }

  function naytaKuultu(teksti) {
    $("kuultu").textContent = teksti ? "🎤 " + teksti : "";
  }

  function paivitaMikkiTeksti() {
    var e = $("mikki-teksti");
    if (!tehtava) { e.textContent = "SANO!"; return; }
    if (tehtava.tyyppi === "kombo") e.textContent = "SYÖKSY! ⚡";
    else if (tehtava.palat) e.textContent = "SANO PALA!";
    else if (tehtava.tyyppi === "tavu") e.textContent = "SANO TAVU!";
    else if (tehtava.tyyppi === "sana") e.textContent = "LUE SANA!";
    else e.textContent = "LUE JA HYÖKKÄÄ!";
  }

  /* ================= ohjainten tila ================= */

  function aikuistilassa() {
    return tila.asetukset.aikuistila || !PUHE.tuettu() || mikkiEstetty;
  }

  function paivitaOhjaimet() {
    var aikuinen = aikuistilassa();
    $("mikki-nappi").classList.toggle("piilossa", aikuinen);
    $("aikuis-napit").classList.toggle("piilossa", !aikuinen);
    $("pikku-oikein").classList.toggle("piilossa", aikuinen);
  }

  function asetaKuunteluUI(paalla) {
    var nappi = $("mikki-nappi");
    nappi.classList.toggle("kuuntelee", paalla);
    $("mikki-teksti").textContent = paalla ? "KUUNTELEN…" : "";
    if (!paalla) paivitaMikkiTeksti();
    asetaMorkoTila(paalla ? "kuuntelee" : "perus");
  }

  function asetaMorkoTila(mieli) {
    $("vastustaja").setAttribute("data-mieli", mieli);
  }

  /* ================= kuuntelu ================= */

  function mikkiPainettu() {
    AANET.herata();
    if (PUHE.kuunteleeko()) { PUHE.lopeta("kayttaja"); return; }
    aloitaKuuntelu();
  }

  function aloitaKuuntelu() {
    if (!tehtava || tehtava.ratkaistu) return;
    PUHE.hiljenna();
    var kombo = tehtava.tyyppi === "kombo";
    var jatkuva = kombo ||
      ((tehtava.tyyppi === "lause" || tehtava.tyyppi === "tarina") && !tehtava.palat);
    var ratkaistuTassa = false;
    if (tehtava.palat) tehtava.palat.sessioAlku = tehtava.palat.indeksi;
    var alkuIndeksi = tehtava.palat ? tehtava.palat.indeksi : -1;
    asetaKuunteluUI(true);

    var kaynnistyi = PUHE.aloita({
      jatkuva: jatkuva,
      maksimiMs: kombo ? 22000 : (jatkuva ? 30000 : 10000),
      hiljaisuusMs: 3000,
      eiPuhettaMs: 8000,
      tulos: function (teksti, kandidaatit) {
        naytaKuultu(teksti);
        if (!ratkaistuTassa && tarkista(teksti, kandidaatit)) {
          ratkaistuTassa = true;
          PUHE.lopeta("osui");
        }
      },
      loppu: function (teksti, kandidaatit, syy) {
        asetaKuunteluUI(false);
        if (ratkaistuTassa || !tehtava || tehtava.ratkaistu) return;
        if (syy === "estetty") { mikkiEstyi(); return; }
        if (tarkista(teksti, kandidaatit)) return;
        // Palat etenivät osittain tämän kuuntelun aikana — ei virhettä.
        if (tehtava.palat && tehtava.palat.indeksi > alkuIndeksi) {
          kupla("Hyvä putki! Paina nappia ja jatka! ➡️");
          return;
        }
        if (syy === "ei-puhetta" || !teksti) { eiKuulunut(); return; }
        if (tehtava.palat) { osaEpaonnistui(teksti); return; }
        epaonnistuiYritys(teksti);
      }
    });

    if (!kaynnistyi) {
      asetaKuunteluUI(false);
      mikkiEstyi();
    }
  }

  function mikkiEstyi() {
    mikkiEstetty = true;
    paivitaOhjaimet();
    naytaPeite("mikki-ohje");
  }

  function eiKuulunut() {
    kupla("En kuullut mitään! 👂 Paina nappia ja sano rohkeasti!");
  }

  /* ================= tarkistus ================= */

  // Palauttaa true jos puhe osui — ja käynnistää samalla onnistumisen.
  function tarkista(teksti, kandidaatit) {
    if (!tehtava || tehtava.ratkaistu) return false;
    if (!kandidaatit || !kandidaatit.length) kandidaatit = teksti ? [teksti] : [];
    if (!kandidaatit.length) return false;

    if (tehtava.palat) {
      var p = tehtava.palat;
      // Yhdellä kuuntelulla voi kuitata useita paloja peräkkäin.
      // Aiemmin tässä sessiossa kuitatut palat ohitetaan kuullusta
      // tekstistä, ettei sama sana kuittaa kahta palaa.
      var ohita = p.indeksi - (p.sessioAlku !== undefined ? p.sessioAlku : p.indeksi);
      var paras = p.indeksi;
      for (var ki = 0; ki < kandidaatit.length; ki++) {
        var indeksi = VERTAILU.jonoOsuu(p.osat, p.indeksi, kandidaatit[ki], p.tyyppi === "tavut", ohita);
        if (indeksi > paras) paras = indeksi;
      }
      var askeleet = paras - p.indeksi;
      for (var a = 0; a < askeleet && !tehtava.ratkaistu; a++) osaOnnistui(true);
      if (tehtava.ratkaistu) return true;
      if (askeleet > 0 && tehtava.tyyppi !== "kombo") {
        kupla("Hyvä! Seuraava pala! ➡️");
        return true; // kuuntelu päättyy, seuraava pala uudella napautuksella
      }
      return false; // kombossa kuuntelu jatkuu putkeen
    }

    if (tehtava.tyyppi === "tavu") {
      if (kandidaatit.some(function (k) { return VERTAILU.tavuOsuu(tehtava.kohde, k); })) {
        onnistui("puhe"); return true;
      }
      return false;
    }

    if (tehtava.tyyppi === "sana") {
      if (kandidaatit.some(function (k) { return VERTAILU.kokoSanaOsuu(tehtava.kohde, k); })) {
        onnistui("puhe"); return true;
      }
      return false;
    }

    // lause tai tarinan virke
    var paras = null;
    for (var i = 0; i < kandidaatit.length; i++) {
      var tulos = VERTAILU.lauseOsuu(tehtava.kohde, kandidaatit[i]);
      if (!paras || tulos.osuus > paras.osuus) paras = tulos;
    }
    if (paras) { tehtava.osumat = paras.osumat; varitaOsumat(); }
    if (paras && paras.ok) { onnistui("puhe"); return true; }
    return false;
  }

  /* ================= epäonnistumisen portaat ================= */

  function epaonnistuiYritys(teksti) {
    tehtava.yritykset++;
    if (teksti) naytaKuultu(teksti);
    AANET.hups();
    valistaHirvio();

    if (tehtava.yritykset === 1) {
      kupla(satunnainen(SISALTO.lohdutukset));
      return;
    }
    if (tehtava.yritykset === 2) {
      if (voikoPaloitella()) {
        aloitaPalat();
      } else {
        kupla("Kuuntele malli ja sano perässä! 👂");
        puhuMalli();
      }
      return;
    }
    // Kolmas yritys ei mennyt — mennään iloisesti eteenpäin.
    autoLapi();
  }

  function valistaHirvio() {
    // Hirviö väistää — pieni ilkikurinen liike, ei ikinä lasta pilkaten.
    var e = $("vastustaja");
    e.classList.remove("vaistaa");
    void e.offsetWidth;
    e.classList.add("vaistaa");
  }

  function voikoPaloitella() {
    if (tehtava.palat) return false;
    if (tehtava.tyyppi === "sana") return tehtava.tavut.length >= 2;
    if (tehtava.tyyppi === "lause" || tehtava.tyyppi === "tarina") return tehtava.sanat.length >= 2;
    return false;
  }

  function aloitaPalat() {
    tehtava.apu = true;
    if (tehtava.tyyppi === "sana") {
      tehtava.palat = { tyyppi: "tavut", osat: tehtava.tavut.slice(), indeksi: 0, yritykset: 0 };
    } else {
      tehtava.palat = { tyyppi: "sanat", osat: tehtava.sanat.slice(), indeksi: 0, yritykset: 0 };
    }
    kupla("Otetaan pala kerrallaan — sinä pystyt! 🧩");
    renderoiPalat();
    puhuMalli();
  }

  function osaOnnistui(automaattinen) {
    var p = tehtava.palat;
    p.yritykset = 0;
    p.indeksi++;
    AANET.ding();
    if (p.indeksi >= p.osat.length) {
      onnistui("palat");
    } else {
      renderoiPalat();
      if (!automaattinen) kupla("Hyvä! Seuraava pala! ➡️");
    }
  }

  function osaEpaonnistui(teksti) {
    var p = tehtava.palat;
    p.yritykset++;
    if (teksti) naytaKuultu(teksti);
    AANET.hups();
    if (p.yritykset === 1) {
      kupla(satunnainen(SISALTO.lohdutukset));
    } else if (p.yritykset === 2) {
      kupla("Kuuntele malli! 👂");
      puhuMalli();
    } else {
      kupla("Mennään yhdessä eteenpäin! ✨");
      osaOnnistui(true);
    }
  }

  function autoLapi() {
    kupla("Sisukas yritys — se lasketaan osumaksi! 💪");
    onnistui("auto");
  }

  /* ================= mallin puhuminen ================= */

  function puhuMalli() {
    if (PUHE.kuunteleeko()) PUHE.lopeta("kayttaja");
    tehtava.apu = true;
    if (tehtava.palat) {
      PUHE.sano(tehtava.palat.osat[tehtava.palat.indeksi], 0.7);
      return;
    }
    if (tehtava.tyyppi === "tavu") {
      PUHE.sano(tehtava.kohde, 0.7);
    } else if (tehtava.tyyppi === "sana") {
      // Ensin tavu kerrallaan, sitten koko sana.
      PUHE.sanoJono(tehtava.tavut, function () { PUHE.sano(tehtava.kohde, 0.8); });
    } else {
      PUHE.sano(tehtava.kohde, 0.75);
    }
  }

  /* ================= onnistuminen ja taistelu ================= */

  function onnistui(lahde) {
    if (!tehtava || tehtava.ratkaistu) return;
    tehtava.ratkaistu = true;
    if (PUHE.kuunteleeko()) PUHE.lopeta("valmis");
    PUHE.hiljenna();

    var v = tila.vastustaja;
    var syoksy = tehtava.tyyppi === "kombo";
    var puhdas = tehtava.yritykset === 0 && !tehtava.apu && lahde !== "auto" && lahde !== "ohitus";
    var kompuroi = !syoksy &&
      (lahde === "auto" || lahde === "ohitus" || tehtava.yritykset >= 2 || !!tehtava.palat);

    var kriittinen = false;
    var vahinko, xp;

    if (syoksy) {
      // Kombosyöksy: jokainen pala tekee 15 vahinkoa kerralla.
      var paloja = tehtava.palat.osat.length;
      vahinko = 15 * paloja + miekkaBonus();
      xp = paloja;
      tila.komboPituus = Math.min(5, (tila.komboPituus || 3) + 1); // kiihtyvä tahti
      tila.kombo++;
    } else {
      // Kombomittari eli lukuputki: puhdas luku kasvattaa vahinkoa,
      // muu katkaisee putken (lempeästi — mitään ei menetetä).
      tila.kombo = puhdas ? (tila.kombo || 0) + 1 : 0;
      kriittinen = puhdas && v && !v.pomo && (tila.putki >= 2 || Math.random() < 0.2);
      var komboBonus = tila.kombo >= 2 ? 5 * Math.min(tila.kombo - 1, 4) : 0;
      vahinko = (kriittinen ? 20 : 10) + komboBonus + miekkaBonus();
      xp = kriittinen ? 2 : 1;
    }

    // Kombosyöksy ansaitaan kombolla 3 ja sen jälkeen joka viidennellä.
    if (tila.kombo === 3 || (tila.kombo > 3 && (tila.kombo - 3) % 5 === 0)) {
      tila.syoksyJono = true;
    }

    // Tähdet ja kolikot — aina vähintään yksi, yrityskin palkitaan.
    tila.tahdet += xp;
    tila.kolikot += xp;
    tarkistaArvonimi();
    kirjaaTilasto(puhdas, kompuroi);

    // Mukautuva vaikeustaso — hiljaa taustalla. Kombosyöksy on
    // bonuskierros eikä vaikuta lukutasoon.
    var tasoNousi = false;
    if (!syoksy) {
      if (puhdas) tila.putki++; else tila.putki = 0;
      if (kompuroi) tila.kompuroinnit++;
      else if (tehtava.yritykset <= 1) tila.kompuroinnit = 0;

      if (tila.putki >= 3 && tila.lukutaso < 8) {
        tila.lukutaso++; tila.putki = 0; tila.kompuroinnit = 0; tasoNousi = true;
      } else if (tila.kompuroinnit >= 2 && tila.lukutaso > 1) {
        tila.lukutaso--; tila.kompuroinnit = 0; tila.putki = 0;
        // Ei kerrota lapselle "laskusta" — vain kannustetaan.
      }

      // Siirryttiinkö koulun uudelle alueelle? Ovi näytetään, kun
      // meneillään oleva taistelu on ensin viety loppuun.
      var alueNyt = alueTasolle(tila.lukutaso);
      if (alueNyt && tila.alue !== alueNyt.tunnus) {
        tila.alue = alueNyt.tunnus;
        if (tasoNousi) odottavaAlue = alueNyt;
      }
    }

    // Tarinassa siirrytään seuraavaan virkkeeseen; pomoon jokainen
    // virke tekee tasan 10 vahinkoa (tarina rytmittää taistelun).
    if (v.pomo && tehtava.tyyppi === "tarina") {
      tila.tarina.virke = tehtava.virke + 1;
      vahinko = 10;
    }

    v.hp = Math.max(0, v.hp - vahinko);

    // Efektit
    var vahinkoTeksti = syoksy ? "SYÖKSY −" + vahinko + " 💥💥"
      : kriittinen ? "KRIITTINEN −" + vahinko + " 💥"
      : (tila.kombo >= 2 ? "KOMBO ×" + tila.kombo + " −" + vahinko + " 💥" : "−" + vahinko + " 💥");
    hyokkaysAnimaatio(kriittinen || syoksy, vahinkoTeksti);
    if (kriittinen || syoksy) AANET.kriittinen(); else AANET.osuma();
    if (lahde !== "auto" && Math.random() < 0.22) setTimeout(AANET.pieru, 500);
    poksautaXP();
    paivitaHUD();
    renderoiHP();

    if (syoksy) kupla("KOMBOSYÖKSY OSUI! ⚡ Hirviö pyörii ympyrää!");
    else if (lahde === "auto" || lahde === "ohitus") kupla("Hyvä yritys, se osui silti! 💥");
    else if (kriittinen) kupla("KRIITTINEN OSUMA! 💥💥 Upeaa lukemista!");
    else kupla(satunnainen(SISALTO.kehut));

    konfetti(kriittinen || syoksy ? 16 : 8, ["💥", "⭐", "✨"]);
    tallenna();

    setTimeout(function () {
      if (tila.vastustaja && tila.vastustaja.hp <= 0) { voitto(); return; }
      if (tasoNousi) toast("✨ Uusia loitsuja avattu!");
      // Hirviön vuoro: välillä hassu vastaisku, jonka kilpi torjuu
      // tai sankari väistää — ei ikinä oikeaa haittaa.
      if (tila.vastustaja && !tila.vastustaja.pomo &&
          !tila.syoksyJono && Math.random() < 0.3) {
        hirvionVastaisku(seuraavaTehtava);
      } else {
        seuraavaTehtava();
      }
    }, 1500);
  }

  /* ================= tilastot raporttia varten ================= */

  function kirjaaTilasto(puhdas, hankala) {
    var paiva = new Date().toISOString().slice(0, 10);
    var t = tila.tilastot;
    var p = t.paivittain[paiva] || { tehtavia: 0, ekalla: 0, apua: 0 };
    p.tehtavia++;
    if (puhdas) p.ekalla++;
    if (tehtava.apu || tehtava.palat) p.apua++;
    t.paivittain[paiva] = p;
    var paivat = Object.keys(t.paivittain).sort();
    while (paivat.length > 60) delete t.paivittain[paivat.shift()];

    if (hankala && tehtava.kohde && tehtava.tyyppi !== "kombo") {
      var avain = String(tehtava.kohde).slice(0, 48);
      t.hankalat[avain] = (t.hankalat[avain] || 0) + 1;
      var avaimet = Object.keys(t.hankalat);
      if (avaimet.length > 50) {
        avaimet.sort(function (a, b) { return t.hankalat[a] - t.hankalat[b]; });
        delete t.hankalat[avaimet[0]];
      }
    }
  }

  /* ================= hirviön vastaisku ================= */

  function hirvionVastaisku(kunValmis) {
    var v = tila.vastustaja;
    if (!v) { kunValmis(); return; }
    kupla(v.nimi + " " + satunnainen(SISALTO.hyokkaysHuudot));

    var vast = $("vastustaja");
    var sankari = $("sankari");
    var lahto = vast.getBoundingClientRect();
    var maali = sankari.getBoundingClientRect();
    var ammus = luo("div", "lentava-loitsu", v.rekvisiitta || "🟢");
    ammus.style.left = (lahto.left + lahto.width / 2) + "px";
    ammus.style.top = (lahto.top + lahto.height / 2) + "px";
    document.body.appendChild(ammus);
    void ammus.offsetWidth;
    var dx = (maali.left + maali.width / 2) - (lahto.left + lahto.width / 2);
    var dy = (maali.top + maali.height / 2) - (lahto.top + lahto.height / 2);
    ammus.style.transform =
      "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(0.9) rotate(-30deg)";
    ammus.style.opacity = "0.15";

    setTimeout(function () {
      if (ammus.parentNode) ammus.parentNode.removeChild(ammus);
      var taistelu = $("taistelu");
      var tRect = taistelu.getBoundingClientRect();
      var sRect = sankari.getBoundingClientRect();

      if (tila.kilvet > 0) {
        tila.kilvet--;
        kupla(satunnainen(SISALTO.torjuntaHuudot));
        AANET.torjunta();
        var valays = luo("div", "kilpi-valays", "🛡️");
        valays.style.left = (sRect.left - tRect.left + sRect.width / 2) + "px";
        valays.style.top = (sRect.top - tRect.top + sRect.height / 2) + "px";
        taistelu.appendChild(valays);
        valays.addEventListener("animationend", function () {
          if (valays.parentNode) valays.parentNode.removeChild(valays);
        });
      } else {
        kupla(satunnainen(SISALTO.vaistoHuudot));
        AANET.hups();
        sankari.classList.remove("vaistohyppy");
        void sankari.offsetWidth;
        sankari.classList.add("vaistohyppy");
      }
      paivitaSankariRivi();
      tallenna();
      setTimeout(kunValmis, 1000);
    }, 620);
  }

  // Näytetään juhlaruudut oikeassa järjestyksessä taistelun päätyttyä:
  // uusi arvonimi -> uusi alue -> seuraava tehtävä.
  function jatkaKetjua() {
    if (odottavaArvonimi) { naytaArvonimiJuhla(); return; }
    if (odottavaAlue) { naytaAluevaihto(); return; }
    seuraavaTehtava();
  }

  function hyokkaysAnimaatio(iso, vahinkoTeksti) {
    // Sankari syöksyy
    var sankari = $("sankari");
    sankari.classList.remove("syoksy");
    void sankari.offsetWidth;
    sankari.classList.add("syoksy");

    // Loitsu (tehtävän teksti) lentää hirviöön
    var kortti = $("tehtava-teksti");
    var vast = $("vastustaja");
    var lahtoRect = kortti.getBoundingClientRect();
    var maaliRect = vast.getBoundingClientRect();
    var lentava = luo("div", "lentava-loitsu", kortti.textContent);
    lentava.style.left = (lahtoRect.left + lahtoRect.width / 2) + "px";
    lentava.style.top = (lahtoRect.top + lahtoRect.height / 2) + "px";
    document.body.appendChild(lentava);
    void lentava.offsetWidth;
    var dx = (maaliRect.left + maaliRect.width / 2) - (lahtoRect.left + lahtoRect.width / 2);
    var dy = (maaliRect.top + maaliRect.height / 2) - (lahtoRect.top + lahtoRect.height / 2);
    lentava.style.transform =
      "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(0.25) rotate(20deg)";
    lentava.style.opacity = "0";
    setTimeout(function () { if (lentava.parentNode) lentava.parentNode.removeChild(lentava); }, 700);

    // Hirviö tärisee, viilto välähtää ja vahinkoluku pomppaa
    setTimeout(function () {
      vast.classList.remove("tarise");
      void vast.offsetWidth;
      vast.classList.add("tarise");
      asetaMorkoTila("auts");
      setTimeout(function () { asetaMorkoTila("perus"); }, 900);

      var viilto = luo("div", "viilto");
      vast.appendChild(viilto);
      viilto.addEventListener("animationend", function () {
        if (viilto.parentNode) viilto.parentNode.removeChild(viilto);
      });

      if (iso) {
        // Iso osuma ravistaa koko ruutua.
        var alue = $("pelialue");
        alue.classList.remove("ravista");
        void alue.offsetWidth;
        alue.classList.add("ravista");
      }

      var isku = luo("div", "vahinko-luku" + (iso ? " kriittinen" : ""), vahinkoTeksti);
      var alusta = $("taistelu");
      alusta.appendChild(isku);
      isku.addEventListener("animationend", function () {
        if (isku.parentNode) isku.parentNode.removeChild(isku);
      });
    }, 380);
  }

  function voitto() {
    var v = tila.vastustaja;
    tila.voitot++;

    var bonus = 2;
    var kolikkoBonus = 5;
    var otsikko = satunnainen(SISALTO.voittohuudot);
    if (v.pomo) {
      bonus = 5;
      kolikkoBonus = 10;
      otsikko = "SATU LUETTU LOPPUUN! 📖🎉";
      tila.tarinatLuettu[tila.tarina.nimi] = (tila.tarinatLuettu[tila.tarina.nimi] || 0) + 1;
      tila.tarina = null;
    }
    tila.tahdet += bonus;
    tila.kolikot += kolikkoBonus;
    tila.kilvet = Math.min(kilpiKatto(), tila.kilvet + 1); // kilpi korjautuu voitosta
    tarkistaArvonimi();
    AANET.kolikko();

    // Aarre reppuun
    var aarre = satunnainen(SISALTO.aarteet);
    tila.reppu[aarre.nimi] = (tila.reppu[aarre.nimi] || 0) + 1;

    // Kukistumisanimaatio: K.O.-silmät, räjähdys ja lima lentää
    var e = $("vastustaja");
    asetaMorkoTila("ko");
    var rajahdys = luo("div", "rajahdys", "💥");
    e.appendChild(rajahdys);
    rajahdys.addEventListener("animationend", function () {
      if (rajahdys.parentNode) rajahdys.parentNode.removeChild(rajahdys);
    });
    e.classList.remove("kukistuu");
    void e.offsetWidth;
    e.classList.add("kukistuu");
    AANET.voitto();
    setTimeout(AANET.pieru, 600);
    konfetti(36, ["💥", "🟢", "🤢", "💦", "⭐", "🏆", "💩"]);
    if (omistaa("pierupossu")) {
      // Pierupossu juhlii voittoa omalla tavallaan.
      setTimeout(function () { AANET.pieru(); konfetti(10, ["🐷", "💨"]); }, 1300);
    }

    tila.vastustaja = null;
    tallenna();
    paivitaHUD();

    setTimeout(function () {
      $("voitto-otsikko").textContent = otsikko;
      $("aarre-emoji").textContent = aarre.emoji;
      $("aarre-nimi").textContent = "Sait aarteen: " + aarre.nimi + "!";
      $("voitto-xp").textContent = "+" + bonus + " ⭐  ja  +" + kolikkoBonus + " 🪙";
      naytaPeite("voitto");
    }, 1100);
  }

  function voitonJalkeen() {
    piilotaPeite("voitto");
    $("vastustaja").classList.remove("kukistuu");
    jatkaKetjua();
  }

  /* ================= tehtäväkierto ================= */

  function seuraavaTehtava() {
    if (!peliKaynnissa()) return;
    if (!tila.vastustaja) {
      if (tila.lukutaso === 8) {
        if (!tila.tarina) { avaaTarinaValinta(); return; }
        aloitaPomo();
      } else {
        uusiVastustaja();
      }
      paivitaAreena();
      renderoiVastustaja(true);
      var v = tila.vastustaja;
      var repliikit = (v.repliikat && v.repliikat.length && Math.random() < 0.7)
        ? v.repliikat : SISALTO.hirvionPelot;
      kupla(satunnainen(repliikit));
    }
    rakennaTehtava();
    renderoiTehtava();
    tallenna();
  }

  function peliKaynnissa() {
    return $("peli").classList.contains("nakyy");
  }

  /* ================= tarinavalinta ================= */

  function avaaTarinaValinta() {
    var lista = $("tarina-lista");
    lista.textContent = "";
    kaikkiTarinat().forEach(function (t) {
      var kortti = luo("button", "tarina-kortti");
      kortti.appendChild(luo("div", "tarina-emoji", t.emoji || "📖"));
      kortti.appendChild(luo("div", "tarina-nimi", t.nimi));
      var luettu = tila.tarinatLuettu[t.nimi] || 0;
      var virkkeita = virkkeiksi(t.teksti).length;
      kortti.appendChild(luo("div", "tarina-tieto",
        virkkeita + " virkettä" + (luettu ? " · luettu " + luettu + "×" : "")));
      kortti.addEventListener("click", function () {
        tila.tarina = { nimi: t.nimi, virke: 0 };
        piilotaPeite("tarinavalinta");
        seuraavaTehtava();
      });
      lista.appendChild(kortti);
    });
    naytaPeite("tarinavalinta");
  }

  /* ================= reppu ================= */

  function avaaReppu() {
    var lista = $("reppu-lista");
    lista.textContent = "";
    var nimet = Object.keys(tila.reppu);
    if (!nimet.length) {
      lista.appendChild(luo("p", "reppu-tyhja", "Reppu on vielä tyhjä. Kukista hirviö niin saat aarteen! ⚔️"));
    } else {
      SISALTO.aarteet.forEach(function (a) {
        var maara = tila.reppu[a.nimi];
        if (!maara) return;
        var rivi = luo("div", "aarre-rivi");
        rivi.appendChild(luo("span", "aarre-rivi-emoji", a.emoji));
        rivi.appendChild(luo("span", "aarre-rivi-nimi", a.nimi));
        rivi.appendChild(luo("span", "aarre-rivi-maara", "×" + maara));
        lista.appendChild(rivi);
      });
      // Omituiset aarteet joita ei enää löydy listalta (esim. muokattu sisältö)
      nimet.forEach(function (nimi) {
        var tunnetaan = SISALTO.aarteet.some(function (a) { return a.nimi === nimi; });
        if (tunnetaan) return;
        var rivi = luo("div", "aarre-rivi");
        rivi.appendChild(luo("span", "aarre-rivi-emoji", "🎁"));
        rivi.appendChild(luo("span", "aarre-rivi-nimi", nimi));
        rivi.appendChild(luo("span", "aarre-rivi-maara", "×" + tila.reppu[nimi]));
        lista.appendChild(rivi);
      });
    }
    naytaPeite("reppu");
  }

  /* ================= kauppa ================= */

  function avaaKauppa() {
    renderoiKauppa();
    naytaPeite("kauppa");
  }

  function renderoiKauppa() {
    $("kauppa-saldo").textContent = "Kolikkosi: 🪙 " + tila.kolikot;
    var lista = $("kauppa-lista");
    lista.textContent = "";
    (SISALTO.varusteet || []).forEach(function (vd) {
      var kortti = luo("div", "kauppa-kortti" + (omistaa(vd.tunnus) ? " omistettu" : ""));
      kortti.appendChild(luo("div", "kauppa-emoji", vd.emoji));
      kortti.appendChild(luo("div", "kauppa-nimi", vd.nimi));
      kortti.appendChild(luo("div", "kauppa-kuvaus", vd.kuvaus || ""));
      if (omistaa(vd.tunnus)) {
        kortti.appendChild(luo("div", "kauppa-omistettu", "✔ Omistat"));
      } else {
        var nappi = luo("button", "isonappi kauppa-osta", "OSTA — " + vd.hinta + " 🪙");
        nappi.disabled = tila.kolikot < vd.hinta;
        nappi.addEventListener("click", function () { osta(vd); });
        kortti.appendChild(nappi);
      }
      lista.appendChild(kortti);
    });
  }

  function osta(vd) {
    if (omistaa(vd.tunnus) || tila.kolikot < vd.hinta) return;
    tila.kolikot -= vd.hinta;
    tila.varusteet.push(vd.tunnus);
    if (vd.tyyppi === "kilpi") tila.kilvet = kilpiKatto(); // uusi kilpi tulee täytenä
    AANET.kolikko();
    AANET.fanfaari();
    konfetti(14, ["🪙", "✨", vd.emoji.slice(0, 2)]);
    toast(vd.nimi + " ostettu! " + vd.emoji);
    tallenna();
    paivitaHUD();
    renderoiKauppa();
  }

  /* ================= raportti aikuiselle ================= */

  function renderoiRaportti() {
    var t = tila.tilastot;
    var paivat = Object.keys(t.paivittain).sort();
    var tehtavia = 0, ekalla = 0, apua = 0;
    paivat.forEach(function (p) {
      var d = t.paivittain[p];
      tehtavia += d.tehtavia; ekalla += d.ekalla; apua += d.apua;
    });
    var prosentti = tehtavia ? Math.round(100 * ekalla / tehtavia) : 0;

    var luvut = $("raportti-luvut");
    luvut.textContent = "";
    [
      [String(tehtavia), "tehtävää luettu"],
      [prosentti + " %", "heti oikein"],
      [String(paivat.length), "pelipäivää"],
      [tila.lukutaso + " / 8", "lukutaso nyt"]
    ].forEach(function (pari) {
      var chip = luo("div", "raportti-chip");
      chip.appendChild(luo("div", "raportti-arvo", pari[0]));
      chip.appendChild(luo("div", "raportti-nimi", pari[1]));
      luvut.appendChild(chip);
    });

    // Viimeiset 7 päivää pylväinä
    var rivi = $("raportti-paivat");
    rivi.textContent = "";
    var sarja = [];
    var maksimi = 1;
    for (var i = 6; i >= 0; i--) {
      var pv = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      var maara = t.paivittain[pv] ? t.paivittain[pv].tehtavia : 0;
      maksimi = Math.max(maksimi, maara);
      sarja.push({ pv: pv, maara: maara });
    }
    sarja.forEach(function (s) {
      var pylvas = luo("div", "paiva-pylvas");
      pylvas.appendChild(luo("div", "paiva-maara", s.maara ? String(s.maara) : ""));
      var palkki = luo("div", "paiva-palkki");
      palkki.style.height = (s.maara ? Math.round(8 + 46 * s.maara / maksimi) : 3) + "px";
      pylvas.appendChild(palkki);
      pylvas.appendChild(luo("div", "paiva-nimi", parseInt(s.pv.slice(8), 10) + "." + parseInt(s.pv.slice(5, 7), 10) + "."));
      rivi.appendChild(pylvas);
    });

    // Toistuvasti hankalat palat
    var hl = $("raportti-hankalat");
    hl.textContent = "";
    var avaimet = Object.keys(t.hankalat)
      .sort(function (a, b) { return t.hankalat[b] - t.hankalat[a]; })
      .slice(0, 8);
    if (!avaimet.length) {
      hl.appendChild(luo("p", "vanhemmat-vihje", "Ei toistuvia kompastuksia — hienoa! Tähän listautuvat palat, jotka ovat vaatineet useita yrityksiä."));
    }
    avaimet.forEach(function (avain) {
      var r = luo("div", "hankala-rivi");
      r.appendChild(luo("span", "hankala-teksti", avain));
      r.appendChild(luo("span", "hankala-maara", t.hankalat[avain] + "×"));
      hl.appendChild(r);
    });
  }

  /* ================= aikuisten paneeli ================= */

  function avaaVanhemmat() {
    if (PUHE.kuunteleeko()) PUHE.lopeta("kayttaja");
    $("asetus-aanet").checked = tila.asetukset.aanet;
    $("asetus-isot").checked = tila.asetukset.isotKirjaimet;
    $("asetus-aikuistila").checked = tila.asetukset.aikuistila;
    $("asetus-taso").value = String(tila.lukutaso);
    $("omat-sanat-teksti").value = omatSanat.join("\n");
    renderoiOmatTarinat();
    renderoiRaportti();
    naytaPeite("vanhemmat");
  }

  function renderoiOmatTarinat() {
    var lista = $("omat-tarinat-lista");
    lista.textContent = "";
    if (!omatTarinat.length) {
      lista.appendChild(luo("p", "vanhemmat-vihje", "Ei vielä omia tarinoita."));
      return;
    }
    omatTarinat.forEach(function (t, indeksi) {
      var rivi = luo("div", "oma-tarina-rivi");
      rivi.appendChild(luo("span", "", (t.emoji || "📖") + " " + t.nimi));
      var poista = luo("button", "poista-nappi", "✕");
      poista.addEventListener("click", function () {
        omatTarinat.splice(indeksi, 1);
        tallenna();
        renderoiOmatTarinat();
      });
      rivi.appendChild(poista);
      lista.appendChild(rivi);
    });
  }

  function vaihdaValilehti(nimi) {
    ["asetukset", "sanat", "tarinat", "raportti", "ohjeet"].forEach(function (v) {
      $("vali-" + v).classList.toggle("nakyy", v === nimi);
    });
    document.querySelectorAll("#vanhemmat nav button").forEach(function (b) {
      b.classList.toggle("valittu", b.getAttribute("data-vali") === nimi);
    });
  }

  /* ================= alkuruutu ================= */

  function avatarLista() {
    return (SISALTO.avatarit && SISALTO.avatarit.length)
      ? SISALTO.avatarit
      : [{ tunnus: "ritari", emoji: "🦸" }];
  }

  function nykyinenAvatar() {
    var lista = avatarLista();
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].tunnus === tila.avatar) return lista[i];
    }
    return lista[0];
  }

  function rakennaAvatarit() {
    var rivi = $("avatar-rivi");
    rivi.textContent = "";
    avatarLista().forEach(function (a) {
      var nappi = luo("button",
        "avatar-nappi" + (a.tunnus === tila.avatar ? " valittu" : ""), a.emoji);
      nappi.addEventListener("click", function () {
        tila.avatar = a.tunnus;
        tallenna();
        rakennaAvatarit();
      });
      rivi.appendChild(nappi);
    });
  }

  function paivitaSankari() {
    var a = nykyinenAvatar();
    var sankari = $("sankari");
    $("sankari-emoji").textContent = a.emoji;
    sankari.classList.remove("kuvallinen");
    naytaKuva($("sankari-kuva"), "kuvat/sankari-" + a.tunnus + ".png", function (loytyi) {
      sankari.classList.toggle("kuvallinen", loytyi);
    });
  }

  function aloitaPeli() {
    AANET.herata();
    PUHE.herata();
    AANET.asetaMykistys(!tila.asetukset.aanet);
    $("alku").classList.remove("nakyy");
    $("peli").classList.add("nakyy");
    var alue = nykyinenAlue();
    if (alue && !tila.alue) tila.alue = alue.tunnus;
    paivitaAreena();
    paivitaSankari();
    paivitaHUD();
    paivitaOhjaimet();
    pyydaValveilla();
    if (tila.vastustaja) {
      renderoiVastustaja(false);
      rakennaTehtava();
      renderoiTehtava();
      kupla("Taistelu jatkuu! " + satunnainen(SISALTO.vinkit));
    } else {
      seuraavaTehtava();
    }
  }

  // Yritetään pitää näyttö hereillä lukemisen ajan (jos selain tukee).
  var valvelukko = null;
  function pyydaValveilla() {
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request("screen").then(function (lukko) { valvelukko = lukko; });
      }
    } catch (e) { /* ei tukea — ei haittaa */ }
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && peliKaynnissa()) pyydaValveilla();
  });

  /* ================= tapahtumien kytkentä ================= */

  function kytke() {
    rakennaAvatarit();

    if (!PUHE.tuettu()) {
      $("tuki-ilmoitus").textContent =
        "Tämä selain ei tue puheentunnistusta, joten peli toimii " +
        "\"aikuinen kuuntelee\" -tilassa. iPadilla ja iPhonella avaa peli Safarissa.";
    }

    $("pelaa-nappi").addEventListener("click", aloitaPeli);
    $("mikki-nappi").addEventListener("click", mikkiPainettu);

    $("kuuntele-nappi").addEventListener("click", function () {
      AANET.herata();
      if (tehtava && !tehtava.ratkaistu) puhuMalli();
    });

    $("ohita-nappi").addEventListener("click", function () {
      if (tehtava && !tehtava.ratkaistu) {
        kupla("Ohitetaan tämä — ei haittaa! 😊");
        onnistui("ohitus");
      }
    });

    $("pikku-oikein").addEventListener("click", function () {
      if (!tehtava || tehtava.ratkaistu) return;
      if (PUHE.kuunteleeko()) PUHE.lopeta("kayttaja");
      if (tehtava.palat) osaOnnistui(false);
      else onnistui("aikuinen");
    });

    $("aikuinen-oikein").addEventListener("click", function () {
      AANET.herata();
      if (!tehtava || tehtava.ratkaistu) return;
      if (tehtava.palat) osaOnnistui(false);
      else onnistui("aikuinen");
    });

    $("aikuinen-uudestaan").addEventListener("click", function () {
      AANET.herata();
      if (!tehtava || tehtava.ratkaistu) return;
      if (tehtava.palat) osaEpaonnistui(null);
      else epaonnistuiYritys(null);
    });

    $("aani-nappi").addEventListener("click", function () {
      tila.asetukset.aanet = !tila.asetukset.aanet;
      AANET.asetaMykistys(!tila.asetukset.aanet);
      if (!tila.asetukset.aanet) PUHE.hiljenna();
      paivitaHUD();
      tallenna();
    });

    $("reppu-nappi").addEventListener("click", avaaReppu);
    $("reppu-sulje").addEventListener("click", function () { piilotaPeite("reppu"); });

    $("kolikko-merkki").addEventListener("click", function () {
      AANET.herata();
      avaaKauppa();
    });
    $("kauppa-sulje").addEventListener("click", function () { piilotaPeite("kauppa"); });

    $("raportti-tyhjenna").addEventListener("click", function () {
      if (window.confirm("Tyhjennetäänkö tilastot? Tähdet, kolikot ja varusteet säilyvät.")) {
        tila.tilastot = { paivittain: {}, hankalat: {} };
        tallenna();
        renderoiRaportti();
      }
    });

    // ⚙️ avautuu vain pitkällä painalluksella — lapset eivät eksy asetuksiin.
    var asetusAjastin = null;
    var asetusAvattu = false;
    function aloitaPito() {
      asetusAvattu = false;
      clearTimeout(asetusAjastin);
      asetusAjastin = setTimeout(function () {
        asetusAvattu = true;
        avaaVanhemmat();
      }, 1200);
    }
    function lopetaPito() {
      clearTimeout(asetusAjastin);
    }
    var asetusNappi = $("asetus-nappi");
    asetusNappi.addEventListener("pointerdown", aloitaPito);
    asetusNappi.addEventListener("pointerup", function () {
      lopetaPito();
      if (!asetusAvattu) toast("Aikuisille: pidä ⚙️-nappia pohjassa hetki");
    });
    asetusNappi.addEventListener("pointerleave", lopetaPito);

    $("alku-aikuisille").addEventListener("click", avaaVanhemmat);
    $("vanhemmat-sulje").addEventListener("click", function () {
      piilotaPeite("vanhemmat");
      paivitaOhjaimet();
      if (peliKaynnissa() && tehtava) renderoiTehtava();
    });

    document.querySelectorAll("#vanhemmat nav button").forEach(function (b) {
      b.addEventListener("click", function () { vaihdaValilehti(b.getAttribute("data-vali")); });
    });

    $("asetus-aanet").addEventListener("change", function () {
      tila.asetukset.aanet = this.checked;
      AANET.asetaMykistys(!this.checked);
      paivitaHUD();
      tallenna();
    });
    $("asetus-isot").addEventListener("change", function () {
      tila.asetukset.isotKirjaimet = this.checked;
      tallenna();
    });
    $("asetus-aikuistila").addEventListener("change", function () {
      tila.asetukset.aikuistila = this.checked;
      tallenna();
    });
    $("asetus-taso").addEventListener("change", function () {
      var taso = parseInt(this.value, 10);
      if (taso >= 1 && taso <= 8) {
        tila.lukutaso = taso;
        tila.putki = 0;
        tila.kompuroinnit = 0;
        tallenna();
        toast("Lukutaso asetettu: " + taso);
      }
    });
    $("nollaa-nappi").addEventListener("click", function () {
      if (window.confirm("Nollataanko koko edistyminen (tähdet, aarteet, taso)? Omat sanat ja tarinat säilyvät.")) {
        var vanhatSanat = omatSanat, vanhatTarinat = omatTarinat;
        tila = oletusTila();
        omatSanat = vanhatSanat;
        omatTarinat = vanhatTarinat;
        tehtava = null;
        tallenna();
        paivitaHUD();
        piilotaPeite("vanhemmat");
        if (peliKaynnissa()) seuraavaTehtava();
      }
    });

    $("omat-sanat-tallenna").addEventListener("click", function () {
      var rivit = $("omat-sanat-teksti").value.split("\n");
      omatSanat = [];
      rivit.forEach(function (r) {
        var sana = r.trim();
        if (sana) omatSanat.push(sana);
      });
      tallenna();
      toast("Tallennettu " + omatSanat.length + " omaa sanaa ✔");
    });

    $("oma-tarina-tallenna").addEventListener("click", function () {
      var nimi = $("oma-tarina-nimi").value.trim();
      var emoji = $("oma-tarina-emoji").value.trim() || "📖";
      var teksti = $("oma-tarina-teksti").value.trim();
      if (!nimi || !teksti) { toast("Anna tarinalle nimi ja teksti."); return; }
      if (virkkeiksi(teksti).length < 1) { toast("Tarinassa pitää olla ainakin yksi virke."); return; }
      omatTarinat.push({ nimi: nimi, emoji: emoji, teksti: teksti });
      tallenna();
      $("oma-tarina-nimi").value = "";
      $("oma-tarina-emoji").value = "";
      $("oma-tarina-teksti").value = "";
      renderoiOmatTarinat();
      toast("Tarina \"" + nimi + "\" tallennettu! 📖");
    });

    $("voitto-jatka").addEventListener("click", voitonJalkeen);
    $("arvonimi-jatka").addEventListener("click", function () {
      piilotaPeite("arvonimi-juhla");
      jatkaKetjua();
    });
    $("aluevaihto-jatka").addEventListener("click", function () {
      piilotaPeite("aluevaihto");
      jatkaKetjua();
    });
    $("tarina-takaisin").addEventListener("click", function () {
      // Lapsi voi valita helpompia tehtäviä satujen sijaan.
      piilotaPeite("tarinavalinta");
      tila.lukutaso = 7;
      tila.putki = 0;
      tila.kompuroinnit = 0;
      tallenna();
      seuraavaTehtava();
    });
    $("mikki-ohje-sulje").addEventListener("click", function () {
      piilotaPeite("mikki-ohje");
      paivitaOhjaimet();
    });

    paivitaHUD();
  }

  kytke();
})();
