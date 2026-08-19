"use strict";
/* =====================================================================
   SISÄLTÖ — kaikki pelin tekstit, sadut, hirviöt ja vitsit
   =====================================================================

   👋 HEI AIKUINEN! Tämä on tiedosto, jota sinun kannattaa muokata.

   Näin lisäät sisältöä:

   1. TAVUT ...... lisää tavu lainausmerkeissä listaan, pilkku väliin.
   2. SANAT ...... kirjoita sana ihan tavallisesti ("lentokone") — peli
                   tavuttaa sen itse. Jos haluat päättää tavutuksen itse,
                   kirjoita tavuviivat ("len-to-ko-ne").
   3. LAUSEET .... lyhyet hassut lauseet. Piste loppuun.
   4. TARINAT .... nimi, tunnuskuva (emoji) ja teksti. Peli jakaa tekstin
                   virkkeisiin pisteiden, huuto- ja kysymysmerkkien
                   kohdalta — yksi virke luetaan kerrallaan.
   5. VASTUSTAJAT  hirviöt joita vastaan taistellaan. hp = montako
                   osumaa (luettua tehtävää) hirviön kukistaminen vaatii.
   6. KIRJAIMET .. pelin alin taso: peli sanoo äänteen, lapsi napauttaa
                   oikean kirjaimen (ei tarvitse mikrofonia).
   7. HÖPÖLÖITSYT  hassuja epäsanoja, joita ei voi lukea ulkomuistista.

   💡 Sisältöä voi lisätä myös suoraan pelissä ilman koodia:
      pidä pelin ⚙️-nappia pohjassa → "Omat sanat" / "Omat tarinat".

   Peli lajittelee sisällön vaikeustasoihin automaattisesti pituuden
   mukaan, joten mitään ei tarvitse merkitä "helpoksi" tai "vaikeaksi".
   ===================================================================== */

var SISALTO = {

  /* ------------------------------------------------------------------
     KIRJAIMET — pelin alin taso: peli sanoo äänteen, lapsi napauttaa
     oikean kirjaimen. Tämä on lukemisen perusta (kirjain–äänne-yhteys)
     eikä vaadi mikrofonia lainkaan.
       kirjain ... näytettävä kirjain
       aanne ..... miten peli sanoo äänteen ("mmm")
       esimerkki . tuttu sana jolla äänne havainnollistetaan
     ------------------------------------------------------------------ */
  kirjaimet: [
    { kirjain: "A", aanne: "aaa",  esimerkki: "AUTO" },
    { kirjain: "I", aanne: "iii",  esimerkki: "ISI" },
    { kirjain: "O", aanne: "ooo",  esimerkki: "OMENA" },
    { kirjain: "U", aanne: "uuu",  esimerkki: "UKKI" },
    { kirjain: "E", aanne: "eee",  esimerkki: "ETANA" },
    { kirjain: "Y", aanne: "yyy",  esimerkki: "YSTÄVÄ" },
    { kirjain: "Ä", aanne: "äää",  esimerkki: "ÄITI" },
    { kirjain: "Ö", aanne: "ööö",  esimerkki: "ÖTÖKKÄ" },
    { kirjain: "M", aanne: "mmm",  esimerkki: "MUMMO" },
    { kirjain: "N", aanne: "nnn",  esimerkki: "NENÄ" },
    { kirjain: "S", aanne: "sss",  esimerkki: "SIILI" },
    { kirjain: "L", aanne: "lll",  esimerkki: "LEIPÄ" },
    { kirjain: "R", aanne: "rrr",  esimerkki: "RAKETTI" },
    { kirjain: "V", aanne: "vvv",  esimerkki: "VESSA" },
    { kirjain: "K", aanne: "k, k, k", esimerkki: "KAKKA" },
    { kirjain: "T", aanne: "t, t, t", esimerkki: "TALO" },
    { kirjain: "P", aanne: "p, p, p", esimerkki: "PISSA" },
    { kirjain: "H", aanne: "hhh",  esimerkki: "HAUKI" },
    { kirjain: "J", aanne: "jjj",  esimerkki: "JÄÄTELÖ" },
    { kirjain: "D", aanne: "d, d, d", esimerkki: "DINOSAURUS" },
    { kirjain: "B", aanne: "b, b, b", esimerkki: "BANAANI" },
    { kirjain: "G", aanne: "g, g, g", esimerkki: "GORILLA" }
  ],

  /* ------------------------------------------------------------------
     SEKAANNUSPARIT — kirjaimet jotka menevät helposti sekaisin.
     Peli tarjoaa näitä vääriksi vaihtoehdoiksi valintatehtävissä, jotta
     harjoitus osuu juuri siihen mikä on vaikeaa. Voit lisätä ryhmiä.
     ------------------------------------------------------------------ */
  sekaannusparit: [
    ["b", "d", "p"], ["m", "n"], ["u", "y"], ["a", "ä"], ["o", "ö"],
    ["i", "j"], ["k", "g"], ["t", "d"], ["s", "z"], ["v", "w"],
    ["e", "ä"], ["h", "n"], ["r", "l"]
  ],

  /* ------------------------------------------------------------------
     HÖPÖLÖITSYT — hassuja epäsanoja, joita ei ole olemassakaan!
     Nämä ovat tärkeitä: oikean sanan lapsi oppii pian tunnistamaan
     ulkoa kuvana, mutta höpölöitsyn on pakko lukea kirjain kirjaimelta.
     Juuri sitä lukutaito on. Ja ne kuulostavat hauskoilta taikasanoilta.
     ------------------------------------------------------------------ */
  hopoloitsut: [
    // Lyhyet
    "PÖMPPÖ", "TIPSU", "RÖHKÄ", "NUPPA", "JYNKKY", "SUHNA",
    "VUPSA", "HÖRPPÖ", "MURKKO", "KÄPSÄ", "TÖRRÖ", "RÄTSÄ",
    // Keskipitkät
    "PÖMPPELI", "KRAPSUTI", "TIPSUKKA", "RÖHKÄLÖ", "NUPPELI",
    "LÖNKKYRÄ", "PÄTKÄMÖ", "SUHNAKKA", "VUPSAHTI", "HÖRPPÖLÖ",
    "MURKKELO", "KÄPSÄKKÄ", "TÖRRÖTIN", "RÄTSÄKKÄ", "JYNKKÄLÖ",
    "MÖLINKKI", "KUPSAHTI", "NIRSKUTA",
    // Pitkät
    "PÖMPPELIKKÄ", "KRAPSUTELLI", "TIPSUKAINEN", "HÖRPPÖLÖINEN",
    "RÄTSÄKKÄLÄ", "MURKKELOINEN"
  ],

  /* ------------------------------------------------------------------
     TAVUT — lyhyet (2 kirjainta) ovat helppoja, pidemmät vaikeampia.
     ------------------------------------------------------------------ */
  tavut: [
    // Helpot tavut (2 kirjainta)
    "KA", "KO", "KU", "KI", "SA", "SU", "SI", "SO",
    "TA", "TU", "TI", "TO", "PA", "PU", "PI", "PO",
    "MA", "MU", "MI", "NA", "NU", "NE", "LA", "LU",
    "LO", "HA", "HI", "HU", "JA", "JO", "VA", "VE",
    "RÖ", "PÖ", "PY", "ÄI",
    // Isommat tavut (3+ kirjainta)
    "KAK", "KIS", "KOI", "KUS", "PIS", "PYL", "PIE",
    "PUP", "PÖL", "RÖH", "NAM", "HAU", "MAU", "VES",
    "SAT", "MÖR", "LIM", "RÄK", "PRÖT", "HAI", "LEI",
    "TUS", "MYR", "KAA", "PII", "SUU", "HÖP", "LÖR"
  ],

  /* ------------------------------------------------------------------
     SANAT — peli tavuttaa nämä itse ja lajittelee tavumäärän mukaan:
     2 tavua = helpompi taso, 3+ tavua = vaikeampi taso.
     ------------------------------------------------------------------ */
  sanat: [
    // Klassikot 💩
    "kakka", "pissa", "pieru", "pylly", "peppu", "pönttö",
    "vessa", "räkä", "mönjä", "muta", "kura", "lima",
    // Eläimiä ja tyyppejä
    "possu", "pupu", "kissa", "koira", "pöllö", "mummo",
    "ukki", "peikko", "mörkö", "hirviö", "sammakko", "kärpänen",
    // Herkkuja ja tavaraa
    "pulla", "hillo", "makkara", "banaani", "jäätelö", "karkki",
    "raketti", "traktori", "prinsessa", "dinosaurus", "lohikäärme",
    // Hassut yhdyssanat — näistä lapset tykkäävät 😄
    "kakkapylly", "pierupilli", "pissahätä", "kakkamyrsky",
    "räkäklimppi", "limapallo", "kuralätäkkö", "mutakakku",
    "vessapaperi", "pierupussi", "hammaspeikko", "pyllypieru",
    "kakkakikkare", "avaruusraketti"
  ],

  /* ------------------------------------------------------------------
     LAUSEET — lyhyet (enintään 4 sanaa) tulevat ensin, pitkät ovat
     vaikeampi taso. Hassuus on tärkeintä!
     ------------------------------------------------------------------ */
  lauseet: [
    // Lyhyet
    "Pupu pieraisi.",
    "Kakka lentää!",
    "Possu istui kakalle.",
    "Mummo nauraa pierulle.",
    "Kissa haisee pahalle.",
    "Vessa on tukossa.",
    "Räkä valuu nenästä.",
    "Isä astui kakkaan.",
    "Pöllö pyllähti pyllylleen.",
    "Peikko syö mutakakkua.",
    "Äiti löysi limapallon.",
    "Koira piilotti makkaran.",
    // Pitkät
    "Koira söi mummon lätyt ja pieraisi kovaa.",
    "Vessanpöntössä asuu pieni vihreä limamonsteri.",
    "Prinsessa pieraisi niin kovaa että kruunu lensi.",
    "Traktori ajoi kuralätäkköön ja muta roiskui kaikkialle.",
    "Hammaspeikko pesi hampaansa karkilla ja limsalla.",
    "Lohikäärme paistoi lättyjä omalla tulellaan.",
    "Avaruusraketti täyttyi pierukaasulla ja lensi kuuhun.",
    "Kärpänen istui kakkakikkareen päälle syömään lounasta.",
    "Ukki nauroi niin kovaa että hammasproteesi lensi soppaan.",
    "Sammakko hyppäsi mummon hattuun ja jäi sinne asumaan."
  ],

  /* ------------------------------------------------------------------
     TARINAT — pomotaisteluita! Jokainen virke on yksi osuma pomoon.
     Kirjoita lyhyitä virkkeitä (3–6 sanaa on hyvä).
     ------------------------------------------------------------------ */
  tarinat: [
    {
      nimi: "Kakkasaaren aarre",
      emoji: "🏴‍☠️💩",
      teksti:
        "Merirosvo Pekka löysi kartan. " +
        "Kartta haisi tosi oudolle. " +
        "Se johti Kakkasaarelle. " +
        "Saarella kaikki oli ruskeaa. " +
        "Puutkin olivat kakkaa. " +
        "Pekka kaivoi kuoppaa hiekkaan. " +
        "Sieltä löytyi vanha arkku. " +
        "Arkussa oli kultainen pönttö. " +
        "Pekka istui pöntölle onnellisena. " +
        "Se oli maailman paras aarre."
    },
    {
      nimi: "Pieru joka karkasi",
      emoji: "💨",
      teksti:
        "Mummon mahassa asui pieru. " +
        "Pieru halusi kovasti ulos. " +
        "Mummo jonotti kaupan kassalla. " +
        "Pieru näki tilaisuutensa. " +
        "PRÖÖÖT! " +
        "Kaikki katsoivat mummoa. " +
        "Mummo katsoi koiraa. " +
        "Koira katsoi kissaa. " +
        "Kissa punastui ihan turhaan. " +
        "Pieru nauroi ja lensi karkuun."
    },
    {
      nimi: "Lentävä vessanpönttö",
      emoji: "🚽✨",
      teksti:
        "Villen vessanpönttö oli tylsistynyt. " +
        "Se halusi nähdä maailmaa. " +
        "Yöllä pönttö irrotti itsensä. " +
        "Se pörräsi ikkunasta ulos. " +
        "Pönttö lensi yli kaupungin. " +
        "Linnut ihmettelivät kovasti. " +
        "Pönttö kävi kuussa asti. " +
        "Aamulla se hiippaili kotiin. " +
        "Ville istui pöntölle aamulla. " +
        "Pönttö oli vielä viileä avaruudesta."
    },
    {
      nimi: "Avaruuskissa Mirri",
      emoji: "🚀🐱",
      teksti:
        "Mirri oli ihan tavallinen kissa. " +
        "Paitsi että sillä oli raketti. " +
        "Mirri lensi salaa avaruuteen. " +
        "Se maistoi kuun juustoa. " +
        "Juusto maistui vanhalta kalalta. " +
        "Mirri nauroi viiksiinsä. " +
        "Sitten se lensi takaisin kotiin. " +
        "Äiti kutsui syömään. " +
        "Mirri söi kalaa ja kehräsi. " +
        "Avaruus on kivaa mutta koti paras."
    }
  ],

  /* ------------------------------------------------------------------
     ALUEET — kirotun koulun pelialueet. Lukutaso määrää missä alueessa
     seikkaillaan (tasot-lista). Jokaisella alueella on oma taustakuva
     (kuvat/alue-<tunnus>.png), ovikuva siirtymäruutuun
     (kuvat/ovi-<tunnus>.png) ja omat hirviönsä.
     vari1/vari2 = varaväritaustan liukuväri, jos kuvaa ei ole.
     ------------------------------------------------------------------ */
  alueet: [
    {
      tunnus: "luokkahuone", nimi: "Kirottu luokkahuone", emoji: "🪑",
      kuvaus: "Pimeä luokka, jossa pulpetit leijuvat ilmassa.",
      tasot: [1, 2, 3], vari1: "#232030", vari2: "#3a2f4f"
    },
    {
      tunnus: "kirjasto", nimi: "Varjoisa kirjasto", emoji: "📚",
      kuvaus: "Kummitteleva kirjasto, jossa kirjat hehkuvat.",
      tasot: [4, 5], vari1: "#1f2430", vari2: "#33415c"
    },
    {
      tunnus: "ruokala", nimi: "Kaaoksen ruokala", emoji: "🍝",
      kuvaus: "Raunioitunut ruokala, jossa kuplii vihreää limaa.",
      tasot: [6, 7], vari1: "#1e2a22", vari2: "#2f4a35"
    },
    {
      tunnus: "liikuntasali", nimi: "Karmiva liikuntasali", emoji: "🏀",
      kuvaus: "Pimeä sali, jossa vanhat välineet heräävät eloon.",
      tasot: [8, 9], vari1: "#2a2226", vari2: "#4a3038"
    },
    {
      tunnus: "ullakko", nimi: "Hylätty ullakko", emoji: "🕸️",
      kuvaus: "Pölyinen ullakko, jonne sadut ovat piiloutuneet.",
      tasot: [10], vari1: "#241d18", vari2: "#3e3226"
    }
  ],

  /* ------------------------------------------------------------------
     AVATARIT — sankarihahmot joista lapsi valitsee omansa.
     Jos kansiosta löytyy kuva kuvat/sankari-<tunnus>.png, sitä käytetään
     emojin sijaan (kts. GRAFIIKKA.md).
     ------------------------------------------------------------------ */
  avatarit: [
    { tunnus: "ritari",     emoji: "🦸" },
    { tunnus: "ninja",      emoji: "🥷" },
    { tunnus: "velho",      emoji: "🧙" },
    { tunnus: "lohikaarme", emoji: "🐉" },
    { tunnus: "dino",       emoji: "🦖" },
    { tunnus: "robotti",    emoji: "🤖" }
  ],

  /* ------------------------------------------------------------------
     VASTUSTAJAT — kirotun koulun hirviöt.
       nimi ......... näkyy nimikyltissä
       vari1/vari2 .. CSS-varahirviön väri (vaalea ja tumma sävy)
       silmia ....... montako silmää (1, 2 tai 3)
       hp ........... voimapisteet. Yksi onnistunut luku = 10 vahinkoa,
                      kriittinen osuma = 20. Eli HP 30 = kolme osumaa.
       rekvisiitta .. pikku emoji joka leijuu hirviön vieressä
       sarvet/hampaat: hurjemmat piirteet CSS-varahirviölle
       alue ......... millä koulun alueella hirviö asuu (tunnus
                      ALUEET-listasta). Ilman aluetta hirviö voi
                      ilmestyä missä vain.
       repliikat .... hirviön omat uhoamiset taistelun alussa

     💡 Kuvat: jos kansiosta löytyy kuvat/hirvio-<tunnus>.png (tunnus =
     nimi pienillä kirjaimilla ilman ääkkösiä, esim. "Räkämöykky" ->
     hirvio-rakamoykky.png), peli näyttää kuvan CSS-hirviön sijaan.
     Tarkka lista: GRAFIIKKA.md
     ------------------------------------------------------------------ */
  vastustajat: [

    /* --- Kirottu luokkahuone (helpot, HP 20–40) --- */
    { nimi: "Aapinen", vari1: "#f0a95a", vari2: "#a85218", silmia: 2, hp: 25,
      rekvisiitta: "🔥", alue: "luokkahuone",
      repliikat: ["Minä olen AAPINEN! Kukaan ei ole lukenut minua loppuun! 🔥"] },
    { nimi: "Puffy", vari1: "#aebcd0", vari2: "#5d6c85", silmia: 2, hp: 25,
      rekvisiitta: "⚡", alue: "luokkahuone",
      repliikat: ["KRRRSH! Minä myrskyän kaikki läksyt sekaisin! ⚡"] },
    { nimi: "Räkämöykky", vari1: "#cdea6a", vari2: "#8fae23", silmia: 1, hp: 30,
      rekvisiitta: "🤧", alue: "luokkahuone" },
    { nimi: "Örkkivauva", vari1: "#9fe08a", vari2: "#4e9e3d", silmia: 3, hp: 30,
      rekvisiitta: "🍼", hampaat: true, alue: "luokkahuone" },
    { nimi: "Pulpetti", vari1: "#b08a5e", vari2: "#6b4a28", silmia: 2, hp: 40,
      rekvisiitta: "✏️", hampaat: true, alue: "luokkahuone",
      repliikat: ["NAM NAM! Minä syön läksyt JA lukijat! 🦷"] },

    /* --- Varjoisa kirjasto (HP 40–60) --- */
    { nimi: "Varjovelho", vari1: "#8e7cc3", vari2: "#3d2b66", silmia: 3, hp: 50,
      rekvisiitta: "🌑", sarvet: true, alue: "kirjasto" },
    { nimi: "Täikuningas", vari1: "#f0c96a", vari2: "#b8862f", silmia: 2, hp: 50,
      rekvisiitta: "👑", sarvet: true, alue: "kirjasto",
      repliikat: ["Minä hallitsen kirjahyllyjä! Kumarra kutinan kuningasta! 👑"] },
    { nimi: "Rehtori", vari1: "#9c8ab8", vari2: "#453a63", silmia: 2, hp: 60,
      rekvisiitta: "🤫", alue: "kirjasto",
      repliikat: ["HYYYS! Ei lukemista minun koulussani! 🤫",
                  "Muista viitata!... EI SITTENKÄÄN! Älä viittaa, älä lue!"] },

    /* --- Kaaoksen ruokala (HP 20–40) --- */
    { nimi: "Sienis", vari1: "#b89ac7", vari2: "#6d4d85", silmia: 2, hp: 20,
      rekvisiitta: "🍄", alue: "ruokala",
      repliikat: ["Pöyh! Minä kasvoin unohtuneesta eväsleivästä! 🍄"] },
    { nimi: "Lima", vari1: "#c47a7a", vari2: "#7a3040", silmia: 3, hp: 30,
      rekvisiitta: "🦴", alue: "ruokala",
      repliikat: ["BLUP BLUP... maanantain mystinen keitto heräsi eloon! 🥣"] },
    { nimi: "Kakkakäärme", vari1: "#c68958", vari2: "#8a5a2b", silmia: 2, hp: 30,
      rekvisiitta: "💩", hampaat: true, alue: "ruokala" },
    { nimi: "Limaklöntti", vari1: "#6fe3c1", vari2: "#2a9d80", silmia: 3, hp: 40,
      rekvisiitta: "🫠", alue: "ruokala" },
    { nimi: "Pönttöpeto", vari1: "#bfd4e0", vari2: "#7d9aad", silmia: 2, hp: 40,
      rekvisiitta: "🚽", hampaat: true, alue: "ruokala" },

    /* --- Karmiva liikuntasali (HP 30–50) --- */
    { nimi: "Wessa", vari1: "#d9e2e8", vari2: "#7d95a5", silmia: 2, hp: 30,
      rekvisiitta: "🚽", hampaat: true, alue: "liikuntasali",
      repliikat: ["BLUB BLUB! Kuka häiritsee pönttöäni?! 🌊"] },
    { nimi: "Tulilisko", vari1: "#ff9f5a", vari2: "#d1495b", silmia: 2, hp: 40,
      rekvisiitta: "🔥", sarvet: true, hampaat: true, alue: "liikuntasali" },
    { nimi: "Rautahammas", vari1: "#9fb4c7", vari2: "#5c718a", silmia: 1, hp: 40,
      rekvisiitta: "⚙️", hampaat: true, alue: "liikuntasali" },
    { nimi: "Kivikisu", vari1: "#8d86a8", vari2: "#453e63", silmia: 2, hp: 45,
      rekvisiitta: "🪨", alue: "liikuntasali",
      repliikat: ["JYM. JYM. Kivikisu murskaa... öh... halaa sinut litteäksi! 🪨"] },
    { nimi: "Mutamöhkäle", vari1: "#b08960", vari2: "#6e4f2e", silmia: 1, hp: 50,
      rekvisiitta: "🪨", alue: "liikuntasali" },

    /* --- Koko koulussa vaeltavat (ei aluetta) --- */
    { nimi: "Gobo", vari1: "#a8c46a", vari2: "#5f7a2f", silmia: 2, hp: 35,
      rekvisiitta: "🪵", hampaat: true,
      repliikat: ["Hehehee! Gobo varasti liidut! Ota kiinni jos saat! 🖍️"] },
    { nimi: "Talonmies", vari1: "#a8b08a", vari2: "#5c6b45", silmia: 2, hp: 50,
      rekvisiitta: "🧹",
      repliikat: ["EI MUTAISIA KENKIÄ AREENALLE! 🧹", "Taas joku sotkee käytävät! GRRR!"] },
    { nimi: "Pierupeikko", vari1: "#a8d971", vari2: "#5f9e2f", silmia: 2, hp: 30,
      rekvisiitta: "💨", sarvet: true },
    { nimi: "Haisuhurja", vari1: "#c9a0e8", vari2: "#8a56b8", silmia: 2, hp: 40,
      rekvisiitta: "🦨", sarvet: true },
    { nimi: "Pyllyvelho", vari1: "#f2a2c0", vari2: "#c05a86", silmia: 2, hp: 40,
      rekvisiitta: "🪄" },
    { nimi: "Luurankoritari", vari1: "#d8dde6", vari2: "#8b95a5", silmia: 2, hp: 50,
      rekvisiitta: "💀", sarvet: true }
  ],

  /* ------------------------------------------------------------------
     AARTEET — palkintoja hirviön kukistamisesta. Kerätään reppuun.
     ------------------------------------------------------------------ */
  aarteet: [
    { nimi: "Kultainen vessapaperirulla", emoji: "🧻✨" },
    { nimi: "Timanttikakkara", emoji: "💎💩" },
    { nimi: "Pierutyyny", emoji: "💨🛋️" },
    { nimi: "Haisevat sankarisaappaat", emoji: "🥾💚" },
    { nimi: "Limainen taikasauva", emoji: "🪄🟢" },
    { nimi: "Kuninkaallinen pönttökruunu", emoji: "👑🚽" },
    { nimi: "Ikuisesti pomppiva räkäpallo", emoji: "🏀🤢" },
    { nimi: "Mutakakkukirja", emoji: "📖🍫" },
    { nimi: "Näkymätön pieruviitta", emoji: "🦸💨" },
    { nimi: "Puhuva banaaninkuori", emoji: "🍌🗣️" },
    { nimi: "Sammakkopilli", emoji: "🐸🎺" },
    { nimi: "Jättimäinen tavumiekka", emoji: "🗡️🔤" },
    { nimi: "Kutituskypärä", emoji: "🪖🪶" },
    { nimi: "Peikonpapanapussi", emoji: "👝🟤" },
    { nimi: "Salainen satukartta", emoji: "🗺️⭐" },
    { nimi: "Hirviöiden hajuvesi", emoji: "🧴🤮" }
  ],

  /* ------------------------------------------------------------------
     VARUSTEET — ostetaan kaupasta kolikoilla 🪙.
       tyyppi "miekka": vahinko-bonus lisätään jokaiseen osumaan
       tyyppi "kilpi":  kilpiMax nostaa kilpien enimmäismäärää
       muut tyypit ovat hauskoja koristeita (näkyvät sankarin vierellä)
     ------------------------------------------------------------------ */
  varusteet: [
    { tunnus: "puumiekka", nimi: "Puumiekka", emoji: "🪵🗡️", hinta: 15,
      tyyppi: "miekka", vahinko: 2, kuvaus: "Parempi kuin ei mitään. Roiskeet irtoaa!" },
    { tunnus: "tavumiekka", nimi: "Tavumiekka", emoji: "🗡️✨", hinta: 40,
      tyyppi: "miekka", vahinko: 5, kuvaus: "Hehkuu aina kun luet oikein." },
    { tunnus: "liekkimiekka", nimi: "Liekkimiekka", emoji: "🔥🗡️", hinta: 90,
      tyyppi: "miekka", vahinko: 8, kuvaus: "Legendaarinen. Paistaa myös lättyjä." },
    { tunnus: "peltikilpi", nimi: "Peltikilpi", emoji: "🛡️", hinta: 20,
      tyyppi: "kilpi", kilpiMax: 4, kuvaus: "Kolisee hienosti. +1 kilpi." },
    { tunnus: "lohikaarmekilpi", nimi: "Lohikäärmekilpi", emoji: "🐉🛡️", hinta: 60,
      tyyppi: "kilpi", kilpiMax: 5, kuvaus: "Pelottaa hirviöitä. +2 kilpeä." },
    { tunnus: "sankariviitta", nimi: "Sankariviitta", emoji: "🧣", hinta: 25,
      tyyppi: "asu", kuvaus: "Hulmuaa mahtavasti vaikka ei tuulisi." },
    { tunnus: "pierupossu", nimi: "Pierupossu", emoji: "🐷", hinta: 35,
      tyyppi: "lemmikki", kuvaus: "Uskollinen kaveri, joka juhlii voittoja... omalla tavallaan. 💨" },
    { tunnus: "kultakruunu", nimi: "Kultakruunu", emoji: "👑", hinta: 120,
      tyyppi: "asu", kuvaus: "Lukusankarien kuninkaallinen päähine." }
  ],

  /* ------------------------------------------------------------------
     ARVONIMET — sankarin arvonimi nousee tähtien (XP) myötä.
     raja = montako tähteä arvonimeen vaaditaan.
     ------------------------------------------------------------------ */
  arvonimet: [
    { raja: 0,   nimi: "Tavutonttu",  emoji: "🧝" },
    { raja: 15,  nimi: "Tavuritari",  emoji: "⚔️" },
    { raja: 40,  nimi: "Sanasoturi",  emoji: "🛡️" },
    { raja: 80,  nimi: "Lauseveikko", emoji: "🧙" },
    { raja: 140, nimi: "Satusankari", emoji: "🦸" },
    { raja: 220, nimi: "Lukilegenda", emoji: "👑" }
  ],

  /* ------------------------------------------------------------------
     REPLIIKIT — pelin puheet. Muokkaa vapaasti hauskemmiksi!
     ------------------------------------------------------------------ */

  // Kun osuma onnistuu
  kehut: [
    "SUORA OSUMA! 💥",
    "PAM! Hirviö horjuu köysiin!",
    "Tavut iskevät kuin salama! ⚡",
    "KAPOW! 💫 Murskaavaa lukemista!",
    "Hirviö sylkee limaa ja horjuu! 🤢",
    "PRÖÖT! Osuit nappiin! 💨",
    "Loitsusi tärisytti koko areenaa! 🌋",
    "Hirviön polvet tutisevat! 😱",
    "JYSÄYS! Maa vavahti! 🌟",
    "TÄYSOSUMA! 🎯"
  ],

  // Kun yritys ei vielä osunut — aina lempeästi!
  lohdutukset: [
    "Ihan lähellä! Kokeile vielä 💪",
    "Melkein osui! Vielä kerran!",
    "Hirviö väisti! Sano uudestaan! 😄",
    "Hupsista! Uusi yritys, sankari!",
    "Vedä syvään henkeä ja kokeile taas 🌬️",
    "Sinä pystyt siihen! Vielä kerran!"
  ],

  // Hirviöiden örinät taistelun alussa — uhoavat, mutta pelkäävät
  // salaa lukemista. Uho ei koskaan pilkkaa lasta.
  hirvionPelot: [
    "GRRAAAH! Kukaan ei poistu areenaltani! ⚔️",
    "MUAHAHA! Minä olen voittamaton... paitsi jos osaat lukea. 😰",
    "Murisen ja mörisen! Näytä loitsusi jos uskallat!",
    "SSSSS! Tavut polttavat! Älä sano niitä ääneen!",
    "Minä söin edellisen sankarin eväät! Pelkää minua! 🥪",
    "HAH! Yksikään loitsu ei läpäise haisupanssariani! 💨",
    "Tuo kirja pois! EI SANOJA! EI IKINÄ SANOJA! 😱",
    "Kohtalosi on sinetöity... paitsi jos luet tosi hyvin. 🌑"
  ],

  // Kun hirviö kukistuu
  voittohuudot: [
    "K.O.! Hirviö kellahti kanveesiin! 🥊",
    "Hirviö RÄJÄHTI limaksi! 💥",
    "MURSKAVOITTO! 🏆",
    "PRÖÖÖT... hirviö tyhjeni kuin ilmapallo! 🎈",
    "Hirviö pakeni häntä koipien välissä! 🏃",
    "Hirviö suli kuplivaksi lätäköksi! 🫠"
  ],

  // Hirviön vastaisku (aina hassu, kilpi torjuu tai sankari väistää)
  hyokkaysHuudot: [
    "heittää limaklöntin!",
    "sylkäisee jättirään!",
    "pieraisee myrkkypilven!",
    "viskaa homeisen eväsleivän!",
    "heittää märän lattiarätin!",
    "sinkoaa kumitossun!"
  ],

  torjuntaHuudot: [
    "TORJUTTU! Kilpi hohtaa! 🛡️",
    "KILPI OTTI KOPIN! 🛡️",
    "PLONK! Kilpi kesti! 🛡️"
  ],

  vaistoHuudot: [
    "Väistit viime hetkellä! 😅",
    "HUTI! Hirviö osui omaan varpaaseensa! 🤣",
    "Ohi meni! Hirviö nolostui. 😳"
  ],

  // Vinkkejä tehtävän alussa
  vinkit: [
    "Lue loitsu ääneen ja hyökkää! ⚔️",
    "Sano loitsu kovalla äänellä! 📣",
    "Tavut ovat taikavoimasi! ✨",
    "Hyökkää lukemalla! 💥"
  ]
};

if (typeof module !== "undefined") module.exports = SISALTO;
