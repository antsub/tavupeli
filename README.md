# ⚔️ Tavuritari — lue ääneen ja kukista hirviöt!

Suomenkielinen lukupeli lapselle, jolla on lukemisen haasteita
(esim. lukihäiriö). Lapsi on sankari, joka taistelee **kirotun koulun**
hirviöitä vastaan lukemalla "loitsuja" ääneen: tavuja, sanoja, hulluja
lauseita ja satuja. Puheentunnistus kuuntelee lukemisen — jokainen
onnistunut luku on osuma hirviöön. Toimii iPadilla, iPhonella ja
tietokoneella selaimessa, eikä vaadi asennuksia tai palvelinta.

## Miten peli toimii

- **Taistelu:** näytölle ilmestyy hirviö (esim. Aapinen, Pulpetti,
  Rehtori, Wessa...). Lapsi lukee lukukortin tekstin ääneen ja painaa
  mikrofoninappia. Onnistunut luku tekee 10 vahinkoa, täydellinen luku
  putkeen voi olla **kriittinen osuma** (20). Kun HP on nolla, hirviö
  kukistuu ja reppuun tipahtaa hassu aarre.
- **Kombot:** peräkkäiset puhtaat luvut kasvattavat 🔥-lukuputkea, joka
  lisää vahinkoa. Kombolla 3 (ja siitä eteenpäin joka viidennellä)
  laukeaa **KOMBOSYÖKSY**: palat luetaan putkeen yhteen hengenvetoon,
  ja sarja pitenee joka onnistumisesta (3 → 5 palaa) — tahti kiihtyy.
- **Hirviön vuoro:** välillä hirviö tekee hassun vastaiskun (heittää
  limaa, pieraisee myrkkypilven...), jonka sankarin 🛡️-kilpi torjuu tai
  sankari väistää. Vastaiskut ovat pelkkää teatteria — lukemisen
  virheistä ei ikinä rankaista, ja kilvet korjautuvat voitoista.
- **Kummituskauppa:** lukemisesta ja voitoista kertyy kolikoita 🪙,
  joilla ostetaan varusteita: miekat lisäävät vahinkoa, kilvet kestoa,
  ja Pierupossu-lemmikki juhlii voittoja omalla tavallaan. 💨
- **Kirotun koulun alueet:** Kirottu luokkahuone → Varjoisa kirjasto →
  Kaaoksen ruokala → Karmiva liikuntasali → Hylätty ullakko. Alue
  vaihtuu lukutaidon karttuessa, ja uusi alue avataan ovi-siirtymällä.
- **Sadut ovat pomotaisteluita:** satu luetaan virke kerrallaan, ja
  jokainen virke on osuma pomoon.
- **Sankaritaso:** tähdet (XP) ja arvonimet (Tavutonttu → Tavuritari →
  ... → Lukilegenda) vain kasvavat. Lapsi näkee aina edistyvänsä.

## Mukautuva vaikeustaso (pelin ydin)

Lukutaso (1–8: tavut → tavutetut sanat → sanat → lauseet → sadut) elää
pelin mukana, **lapselta piilossa**:

- 3 sujuvaa suoritusta peräkkäin → taso nousee huomaamatta.
- 2 hankalaa tehtävää peräkkäin → taso laskee hiljaa, ilman moitetta.
- Jos yksittäinen tehtävä ei suju, peli auttaa portaittain:
  1. kannustus ja uusi yritys
  2. peli lukee mallin ääneen ja **pilkkoo tehtävän paloihin**
     (sana → tavut, lause → sanat), jotka sanotaan yksi kerrallaan
  3. lopulta mennään iloisesti eteenpäin — yrityskin lasketaan osumaksi.

Peli ei koskaan rankaise: väärästä vastauksesta ei menetä mitään, ja
hirviöiden uho ei ikinä kohdistu lapsen taitoihin.

## Käyttöönotto iPadilla ja iPhonella

Puheentunnistus vaatii **https-osoitteen** ja mikrofoniluvan. Helpoin
reitti on GitHubin oma ilmainen sivuhosting:

1. Avaa GitHubissa repon **Settings → Pages**.
2. Valitse *Deploy from a branch*, haaraksi tämä haara ja kansioksi
   juuri (`/`). Tallenna.
3. Hetken päästä peli on osoitteessa
   `https://<käyttäjä>.github.io/<repo>/tavupeli/`.
4. Avaa osoite iPadin/iPhonen **Safarissa**, salli mikrofoni ja
   puheentunnistus kysyttäessä.
5. Halutessasi: jaa-nappi → **Lisää Koti-valikkoon**, niin peli saa
   oman kuvakkeen ja toimii koko näytöllä. ⚠️ Jos puheentunnistus ei
   toimi kotivalikon kuvakkeesta (iOS:n rajoitus joissain versioissa),
   pelaa Safarissa — tai käytä *aikuinen kuuntelee* -tilaa.

Ilman mikrofonia tai lupaa peli siirtyy automaattisesti **aikuinen
kuuntelee** -tilaan: aikuinen kuuntelee lukemisen ja painaa
😃 MENI HYVIN tai 🔁 UUDESTAAN. Sama tila löytyy asetuksista.

Puheentunnistuksesta rehellisesti: se on tarkoituksella armollinen ja
kuulee lyhyet tavut vain suunnilleen. Siksi ruudun kulmassa on aina
pieni *"aikuinen: meni oikein"* -nappi, jolla aikuinen voi kuitata
suorituksen, jos kone kuuli väärin. Applen sanelu tukee suomea; osa
selaimista lähettää puheen tunnistettavaksi verkon yli, joten
nettiyhteys voi olla tarpeen.

## Sisällön lisääminen (helppo!)

**Pelissä ilman koodia:** pidä ⚙️-nappia pohjassa hetki → *Omat sanat*
tai *Omat tarinat*. Liitä teksti, tallenna — peli tavuttaa sanat itse
ja jakaa tarinat virkkeiksi. Tallentuu laitteen omaan muistiin.

**Raportti aikuiselle:** samasta ⚙️-paneelista löytyy *Raportti*-
välilehti: montako tehtävää on luettu, kuinka moni meni heti oikein,
viimeisten 7 päivän harjoittelumäärät ja lista paloista, jotka ovat
toistuvasti vaatineet useita yrityksiä.

**Tiedostoon (kaikille laitteille):** muokkaa tiedostoa
[`js/sisalto.js`](js/sisalto.js). Sinne voi lisätä tavuja, sanoja,
lauseita, satuja, hirviöitä, aarteita, arvonimiä ja vitsejä — ohjeet
ovat tiedoston kommenteissa. Sanat voi kirjoittaa ihan tavallisesti
("lentokone"), peli tavuttaa ne itse; oman tavutuksen saa viivoilla
("len-to-ko-ne").

## Grafiikka

Peli piirtää hirviöt ja taustat itse (CSS), mutta käyttää
automaattisesti oikeita kuvia heti kun niitä pudottaa `kuvat/`-kansioon
oikeilla nimillä. Tarkka lista tarvittavista kuvista tiedostonimineen
ja tyyliohjeineen: [`GRAFIIKKA.md`](GRAFIIKKA.md).

## Kehittäjälle

```
tavupeli/
├── index.html            käyttöliittymän rakenne
├── tyyli.css             ulkoasu (tumma kirottu koulu -teema)
├── js/sisalto.js         ⭐ KAIKKI TEKSTIT JA SISÄLTÖ — muokkaa tätä
├── js/peli.js            pelilogiikka: taistelu + mukautuva vaikeustaso
├── js/puhe.js            puheentunnistus ja puhesynteesi (fi-FI)
├── js/tavutus.js         suomen kielen automaattinen tavutus
├── js/vertailu.js        kuullun puheen armollinen vertailu
├── js/aanet.js           ääniefektit (WebAudio, ei äänitiedostoja)
├── sw.js                 offline-tuki (service worker)
├── manifest.webmanifest  kotivalikkosovelluksen tiedot
├── icons/                sovelluskuvakkeet (tee_ikonit.py piirtää)
├── kuvat/                pudota oikeat grafiikat tänne (GRAFIIKKA.md)
└── testit/testit.js      testit: node testit/testit.js
```

- Testit: `node testit/testit.js` (tavutus, vertailu, sisällön eheys,
  HTML-id:t).
- Paikallinen kokeilu: `python3 -m http.server` tässä kansiossa ja avaa
  `http://localhost:8000` (mikrofoni toimii localhostissa).
- Yhden tiedoston versio (helppo jakaa tai julkaista missä vain):
  `python3 kokoa_yksi_tiedosto.py` → `tavuritari-yksi-tiedosto.html`.
- Kun muutat pelin tiedostoja julkaistussa versiossa, kasvata
  `sw.js`-tiedoston versionumeroa, jotta selaimet hakevat uudet
  tiedostot.
