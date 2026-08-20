"use strict";
/* Testaa puheentunnistuksen lopetuslogiikan väärennetyllä tunnistimella.

   Oikea vika oli: kun lapsi nosti sormen mikkinapilta, peli kutsui
   stop() ja arvioi tuloksen HETI — mutta Web Speech API toimittaa
   lopullisen tuloksen vasta stop():n jälkeen. Lyhyt lukusuoritus
   näytti siis siltä ettei mitään kuultu. */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const JUURI = path.join(__dirname, "..");

let virheita = 0;
function vaadi(ehto, viesti) {
  if (ehto) { console.log("  ✔ " + viesti); return; }
  virheita++;
  console.error("  ❌ " + viesti);
}

/* Väärennetty SpeechRecognition, joka käyttäytyy kuten oikea:
   lopullinen tulos saapuu vasta stop():n jälkeen viiveellä. */
function teeYmparisto(asetukset) {
  const tila = { instanssi: null };

  class FakeSR {
    constructor() { tila.instanssi = this; this.pysaytetty = false; }
    start() {
      this.kaynnissa = true;
      if (asetukset.valitulosMs !== undefined) {
        setTimeout(() => {
          if (this.onresult) {
            this.onresult({
              resultIndex: 0,
              results: [Object.assign([{ transcript: asetukset.valitulos }],
                { isFinal: false, length: 1 })]
            });
          }
        }, asetukset.valitulosMs);
      }
    }
    stop() {
      if (this.pysaytetty) return;
      this.pysaytetty = true;
      // Oikea tunnistin toimittaa lopullisen tuloksen VASTA tässä.
      if (asetukset.lopputulosMs !== undefined) {
        setTimeout(() => {
          if (this.onresult) {
            this.onresult({
              resultIndex: 0,
              results: [Object.assign([{ transcript: asetukset.lopputulos }],
                { isFinal: true, length: 1 })]
            });
          }
          setTimeout(() => this.onend && this.onend(), 20);
        }, asetukset.lopputulosMs);
      } else {
        setTimeout(() => this.onend && this.onend(), 20);
      }
    }
  }

  const window = {
    SpeechRecognition: FakeSR,
    speechSynthesis: { speaking: false, cancel() {}, speak() {}, getVoices: () => [] },
    SpeechSynthesisUtterance: function () {},
    PELI_VERSIO: "testi"
  };
  window.window = window;

  const konteksti = vm.createContext({
    window,
    navigator: { userAgent: "test", platform: "test", maxTouchPoints: 0 },
    location: { protocol: "https:", hostname: "localhost", search: "" },
    setTimeout, clearTimeout, console
  });
  vm.runInContext(fs.readFileSync(path.join(JUURI, "js/puhe.js"), "utf8"), konteksti);
  return konteksti;
}

function aja(nimi, asetukset, toiminta) {
  return new Promise((valmis) => {
    const ymparisto = teeYmparisto(asetukset);
    const PUHE = ymparisto.PUHE;
    PUHE.aloita({
      pidetaanPohjassa: true,
      maksimiMs: 9000,
      loppu: (teksti, kandidaatit, syy) => valmis({ nimi, teksti, kandidaatit, syy })
    });
    toiminta(PUHE);
  });
}

(async () => {
  console.log("Puheentunnistuksen lopetus:");

  // 1. Sormi nostetaan heti — tulos saapuu vasta 400 ms stop():n jälkeen.
  //    Juuri tämä meni ennen rikki: peli näki tyhjän tuloksen.
  const a = await aja("nopea painallus",
    { lopputulos: "kahvi", lopputulosMs: 400 },
    (PUHE) => setTimeout(() => PUHE.lopeta("valmis"), 100));
  vaadi(a.teksti === "kahvi",
    "stop():n jälkeen saapuva tulos ehtii mukaan (saatiin: '" + a.teksti + "')");
  vaadi(a.syy === "valmis", "lopetuksen syy säilyy: " + a.syy);

  // 2. Hidas tunnistin (1,2 s) — pitää silti ehtiä.
  const b = await aja("hidas tunnistin",
    { lopputulos: "ka", lopputulosMs: 1200 },
    (PUHE) => setTimeout(() => PUHE.lopeta("valmis"), 50));
  vaadi(b.teksti === "ka", "hidaskin tulos ehtii mukaan (saatiin: '" + b.teksti + "')");

  // 3. Tunnistin ei tuota mitään — ei jäädä jumiin, vaan päätetään ajallaan.
  const alku = Date.now();
  const c = await aja("ei tulosta", {},
    (PUHE) => setTimeout(() => PUHE.lopeta("valmis"), 50));
  const kesto = Date.now() - alku;
  vaadi(c.teksti === "", "tuloksettomasta kuuntelusta tulee tyhjä");
  vaadi(kesto < 3000, "odotus ei jää roikkumaan (" + kesto + " ms)");

  // 4. Käyttäjän peruutus ei odota turhaan.
  const alku2 = Date.now();
  const d = await aja("peruutus", { lopputulos: "ka", lopputulosMs: 1500 },
    (PUHE) => setTimeout(() => PUHE.lopeta("kayttaja"), 50));
  vaadi(Date.now() - alku2 < 500, "peruutus päättyy heti (" + (Date.now() - alku2) + " ms)");
  vaadi(d.syy === "kayttaja", "peruutuksen syy välittyy");

  // 5. Välitulos ennen lopetusta säilyy, jos lopullista ei tule.
  const e = await aja("vain välitulos",
    { valitulos: "ka", valitulosMs: 60 },
    (PUHE) => setTimeout(() => PUHE.lopeta("valmis"), 200));
  vaadi(/ka/.test(e.teksti), "välitulos kelpaa jos lopullista ei tule (saatiin: '" + e.teksti + "')");

  if (virheita) { console.error("\n" + virheita + " testiä EPÄONNISTUI"); process.exit(1); }
  console.log("\nPuhetestit OK ✔");
})();
