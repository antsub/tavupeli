# Tavuritari — grafiikkalista

Peli toimii heti ilman kuvia: hirviöt piirretään CSS:llä, alueet ovat
liukuväritaustoja ja sankarit emojeja. **Kun pudotat tähän listattuja
kuvatiedostoja `kuvat/`-kansioon, peli alkaa käyttää niitä
automaattisesti** — koodia ei tarvitse muuttaa. Puuttuva kuva ei riko
mitään.

## Tyyliohje

Tyyli on jo lyöty lukkoon tekemiesi esimerkkien pohjalta:

- Tumma **kirottu koulu** -tunnelma: hämärät tilat, paksut ääriviivat,
  hehkuvat korostusvärit (lämmin keltainen, myrkynvihreä, violetti).
- Hurja mutta sarjakuvamainen (K-12): sarvia, torahampaita, hehkuvia
  silmiä — ei verta eikä aitoa kauhua.
- **Hahmokuvat ilman korttikehystä**: pelkkä hahmo läpinäkyvällä
  taustalla (PNG), peli piirtää nimikyltin ja HP-palkin itse.
  Korttikuvista siis hahmo irti leikattuna.
- Hirviöt katsovat **vasemmalle** (kohti sankaria), sankarit
  **oikealle**. Hahmo keskitettynä, ~8–10 % marginaali reunoihin.
- Kuva näkyy pelissä pienimmillään ~90 px leveänä — iso selkeä siluetti.

## 1. Aluetaustat — 5 kpl (PNG/JPG → tallenna .png-päätteellä, 2048×1024)

Vaakakuvia; alareunassa lattia/maa jolla hahmot seisovat, yläosaan ei
tärkeitä yksityiskohtia (puhekupla peittää). Ei tekstiä.

| Tiedosto | Alue | Tila |
|---|---|---|
| `kuvat/alue-luokkahuone.png` | Kirottu luokkahuone — pulpetit leijuvat | esimerkki jo tehty ✔ |
| `kuvat/alue-kirjasto.png` | Varjoisa kirjasto — hehkuvat kirjat | esimerkki jo tehty ✔ |
| `kuvat/alue-ruokala.png` | Kaaoksen ruokala — vihreää limaa | esimerkki jo tehty ✔ |
| `kuvat/alue-liikuntasali.png` | Karmiva liikuntasali — vanhat välineet | **puuttuu** |
| `kuvat/alue-ullakko.png` | Hylätty ullakko — pölyä ja seittejä | esimerkki jo tehty ✔ |

## 2. Alueiden ovet — 5 kpl (PNG, pysty/neliö, esim. 1024×1024)

Näytetään "UUSI ALUE LÖYTYI" -siirtymäruudussa. Tekemäsi "TASO 2"- ja
"TASO 3" -ovikuvat ovat juuri tätä — kyltiksi käy alueen nimi tai ovi
ilman tekstiä.

| Tiedosto | Ovi alueelle |
|---|---|
| `kuvat/ovi-luokkahuone.png` | Kirottu luokkahuone |
| `kuvat/ovi-kirjasto.png` | Varjoisa kirjasto |
| `kuvat/ovi-ruokala.png` | Kaaoksen ruokala (hämähäkkiovi ✔) |
| `kuvat/ovi-liikuntasali.png` | Karmiva liikuntasali |
| `kuvat/ovi-ullakko.png` | Hylätty ullakko (esim. kettinkiovi ✔) |

## 3. Hirviöt — 22 kpl (PNG, läpinäkyvä tausta, 1024×1024)

Tähdellä ✔ merkityistä sinulla on jo korttikuva — niistä tarvitaan vain
hahmo irti leikattuna läpinäkyvälle taustalle.

**Kirottu luokkahuone:** `hirvio-aapinen.png` ✔ (liekehtivä aapiskirja),
`hirvio-puffy.png` ✔ (ukkospilvi), `hirvio-rakamoykky.png` (yksisilmäinen
räkäklöntti), `hirvio-orkkivauva.png` (kolmisilmäinen örkkivauva),
`hirvio-pulpetti.png` ✔ (hampainen pulpetti)

**Varjoisa kirjasto:** `hirvio-varjovelho.png` (kolmisilmäinen
varjo-olento), `hirvio-taikuningas.png` (kruunupäinen jättitäi),
`hirvio-rehtori.png` ✔ (aavemainen rehtori)

**Kaaoksen ruokala:** `hirvio-sienis.png` ✔ (pääkallosieni),
`hirvio-lima.png` ✔ (luinen limamöykky), `hirvio-kakkakaarme.png`,
`hirvio-limaklontti.png`, `hirvio-ponttopeto.png`

**Karmiva liikuntasali:** `hirvio-wessa.png` ✔ (limaa pursuava pönttö),
`hirvio-tulilisko.png`, `hirvio-rautahammas.png`, `hirvio-kivikisu.png` ✔
(kivigolemi), `hirvio-mutamohkale.png`

**Koko koulu:** `hirvio-gobo.png` ✔ (goblin), `hirvio-talonmies.png` ✔
(vihainen talonmies), `hirvio-pierupeikko.png`, `hirvio-haisuhurja.png`,
`hirvio-pyllyvelho.png`, `hirvio-luurankoritari.png`

## 4. Satupomo — 1 kpl

| Tiedosto | Kuvaus |
|---|---|
| `kuvat/hirvio-pomo.png` | Iso punainen pomohirviö (3 silmää, sarvet, torahampaat) — selvästi muita mahtavampi. Käytetään kaikissa satu-pomotaisteluissa. |

## 5. Sankarit — 6 kpl (PNG, läpinäkyvä tausta, 1024×1024, katse oikealle)

`kuvat/sankari-ritari.png`, `sankari-ninja.png`, `sankari-velho.png`,
`sankari-lohikaarme.png`, `sankari-dino.png`, `sankari-robotti.png`
— reippaita lapsihahmoja, sama tyyli kuin hirviöissä mutta sankarillinen.

## 6. Sovelluskuvakkeet — 3 kokoa

Neliö, **ei läpinäkyvyyttä**; tärkeä sisältö keskimmäisen 80 % sisään.
Aihe-ehdotus: vihainen hirviö + hehkuva tavumiekka tummalla pohjalla.

`icons/ikoni-512.png` (512×512), `icons/ikoni-192.png` (192×192),
`icons/ikoni-180.png` (180×180, iPadin/iPhonen kotivalikko).
Nykyiset väliaikaisikonit on piirretty skriptillä `tee_ikonit.py`.

## Tiedostonimen sääntö

Hirviön tiedostonimi tulee sen nimestä `js/sisalto.js`-tiedostossa:
pienet kirjaimet, ääkköset ilman pisteitä (ä→a, ö→o), muut merkit
viivoiksi. Esim. `"Räkämöykky"` → `kuvat/hirvio-rakamoykky.png`.
Jos lisäät sisältöön uuden hirviön, nimeä kuva samalla säännöllä.

## Ei tarvita valintatehtäviin

Tasojen 1–2 kuuntele-ja-valitse -tehtävät (kirjaimet ja tavut) toimivat
pelkällä tekstillä eivätkä kaipaa grafiikkaa. Jos joskus haluat kuvat
kirjainten esimerkkisanoille (A → AUTO), pyydä — se on pieni lisätyö.

## Ei tarvita (peli tekee nämä itse)

- Ääniefektit (syntetisoidaan laitteessa)
- Viillot, räjähdykset, konfetit, HP-palkit, nimikyltit (CSS/emoji)
- Aarteet ja arvonimet (emoji) — kuvatuki näille on pieni lisätyö,
  pyydä jos haluat
