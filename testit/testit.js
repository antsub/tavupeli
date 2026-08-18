"use strict";
/* Pelin logiikkatestit. Aja:  node testit/testit.js  */

var polku = require("path");
var fs = require("fs");
var TAVUTUS = require("../js/tavutus.js");
var VERTAILU = require("../js/vertailu.js");
var SISALTO = require("../js/sisalto.js");

var virheita = 0;

function vaadi(ehto, viesti) {
  if (ehto) return;
  virheita++;
  console.error("  ❌ " + viesti);
}

/* ---------------- tavutus ---------------- */

console.log("Tavutus:");
var tavutusTapaukset = {
  "kissa": "kis-sa",
  "kakka": "kak-ka",
  "pieru": "pie-ru",
  "pylly": "pyl-ly",
  "lentokone": "len-to-ko-ne",
  "mummo": "mum-mo",
  "aurinko": "au-rin-ko",
  "koira": "koi-ra",
  "pöllö": "pöl-lö",
  "myrsky": "myrs-ky",
  "portti": "port-ti",
  "kaaos": "kaa-os",
  "radio": "ra-di-o",
  "haluaa": "ha-lu-aa",
  "siili": "sii-li",
  "suo": "suo",
  "yö": "yö",
  "leijona": "lei-jo-na",
  "banaani": "ba-naa-ni",
  "traktori": "trak-to-ri",
  "katsoa": "kat-so-a",
  "lauantai": "lau-an-tai",
  "vessanpönttö": "ves-san-pönt-tö",
  "prinsessa": "prin-ses-sa",
  "dinosaurus": "di-no-sau-rus",
  "kärpänen": "kär-pä-nen",
  "hammaspeikko": "ham-mas-peik-ko",
  "kis-sa": "kis-sa" // valmis tavutus säilyy
};
Object.keys(tavutusTapaukset).forEach(function (sana) {
  var saatu = TAVUTUS.tavutaViivoilla(sana);
  vaadi(saatu === tavutusTapaukset[sana],
    sana + " -> " + saatu + " (odotettiin " + tavutusTapaukset[sana] + ")");
});

/* ---------------- vertailu ---------------- */

console.log("Vertailu:");

// Tavut
vaadi(VERTAILU.tavuOsuu("KA", "ka"), "tavu: KA ~ 'ka'");
vaadi(VERTAILU.tavuOsuu("KA", "kaa"), "tavu: KA ~ 'kaa' (venytetty)");
vaadi(VERTAILU.tavuOsuu("KIS", "kissa"), "tavu: KIS ~ 'kissa' (alku)");
vaadi(!VERTAILU.tavuOsuu("KA", "talo"), "tavu: KA ei osu 'talo'");
vaadi(VERTAILU.tavuOsuu("PRÖT", "pröt"), "tavu: PRÖT ~ 'pröt'");

// Sanat
vaadi(VERTAILU.kokoSanaOsuu("kakka", "kakka"), "sana: tarkka osuma");
vaadi(VERTAILU.kokoSanaOsuu("kakka", "kakkaa"), "sana: pieni venytys kelpaa");
vaadi(VERTAILU.kokoSanaOsuu("kakka", "kak ka"), "sana: tavu kerrallaan kelpaa");
vaadi(VERTAILU.kokoSanaOsuu("lentokone", "lento kone"), "sana: yhdyssana kahtena sanana");
vaadi(!VERTAILU.kokoSanaOsuu("kakka", "auto"), "sana: eri sana ei kelpaa");
vaadi(!VERTAILU.kokoSanaOsuu("pieru", ""), "sana: tyhjä ei kelpaa");

// Lauseet
var t1 = VERTAILU.lauseOsuu("Pupu pieraisi.", "pupu pieraisi");
vaadi(t1.ok, "lause: täysi osuma");
var t2 = VERTAILU.lauseOsuu("Koira söi mummon lätyt ja pieraisi kovaa.",
  "koira söi mummon lätyt ja pieraisi");
vaadi(t2.ok, "lause: yksi puuttuva sana sallitaan pitkässä lauseessa");
var t3 = VERTAILU.lauseOsuu("Pupu pieraisi.", "auto ajaa");
vaadi(!t3.ok, "lause: väärä sisältö hylätään");
var t4 = VERTAILU.lauseOsuu("Kissa haisee pahalle.", "tota kissa haisee tosi pahalle");
vaadi(t4.ok, "lause: ylimääräiset täytesanat sallitaan");

/* ---------------- sisältö ---------------- */

console.log("Sisältö:");
var alueTunnukset = SISALTO.alueet.map(function (a) { return a.tunnus; });
SISALTO.vastustajat.forEach(function (v) {
  vaadi(typeof v.hp === "number" && v.hp >= 10, "hirviöllä " + v.nimi + " kelvollinen hp");
  if (v.alue) {
    vaadi(alueTunnukset.indexOf(v.alue) >= 0,
      "hirviön " + v.nimi + " alue '" + v.alue + "' on olemassa");
  }
});
for (var taso = 1; taso <= 8; taso++) {
  var loytyi = SISALTO.alueet.some(function (a) { return a.tasot.indexOf(taso) >= 0; });
  vaadi(loytyi, "lukutasolle " + taso + " on alue");
}
SISALTO.tarinat.forEach(function (t) {
  var virkkeita = (t.teksti.match(/[^.!?]+[.!?]*/g) || []).length;
  vaadi(virkkeita >= 3, "tarinassa '" + t.nimi + "' on ainakin 3 virkettä");
});
vaadi(SISALTO.tavut.length >= 20, "tavuja on riittävästi");
vaadi(SISALTO.sanat.length >= 20, "sanoja on riittävästi");
vaadi(SISALTO.lauseet.length >= 10, "lauseita on riittävästi");

/* ---------------- HTML:n ja pelikoodin vastaavuus ---------------- */

console.log("HTML-id:t:");
var peliKoodi = fs.readFileSync(polku.join(__dirname, "../js/peli.js"), "utf8");
var html = fs.readFileSync(polku.join(__dirname, "../index.html"), "utf8");
var htmlIdt = {};
(html.match(/id="([^"]+)"/g) || []).forEach(function (m) {
  htmlIdt[m.slice(4, -1)] = true;
});
var kaytetyt = {};
(peliKoodi.match(/\$\("([^"]+)"\)/g) || []).forEach(function (m) {
  kaytetyt[m.slice(3, -2)] = true;
});
// dynaamisesti muodostetut id:t
["vali-asetukset", "vali-sanat", "vali-tarinat", "vali-ohjeet"].forEach(function (id) {
  kaytetyt[id] = true;
});
Object.keys(kaytetyt).forEach(function (id) {
  if (id.indexOf("vali-") === 0 || htmlIdt[id]) {
    vaadi(htmlIdt[id], "peli.js käyttää id:tä '" + id + "', joka puuttuu index.html:stä");
  } else {
    vaadi(false, "peli.js käyttää id:tä '" + id + "', joka puuttuu index.html:stä");
  }
});

/* ---------------- tulos ---------------- */

if (virheita) {
  console.error("\n" + virheita + " testiä EPÄONNISTUI");
  process.exit(1);
} else {
  console.log("\nKaikki testit OK ✔");
}
