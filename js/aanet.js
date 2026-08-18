"use strict";
/* =====================================================================
   ÄÄNET — kaikki ääniefektit luodaan WebAudiolla laitteessa,
   joten peli ei tarvitse yhtään äänitiedostoa ja toimii offline.
   ===================================================================== */

var AANET = (function () {

  var ctx = null;
  var mykistetty = false;

  function varmista() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Yksittäinen piippaus: taajuus, viive (s), kesto (s), aaltomuoto, voimakkuus.
  function piip(taajuus, viive, kesto, muoto, voima) {
    var c = varmista();
    if (!c || mykistetty) return;
    var t = c.currentTime + (viive || 0);
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = muoto || "sine";
    o.frequency.setValueAtTime(taajuus, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(voima || 0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + kesto);
    o.connect(g); g.connect(c.destination);
    o.start(t);
    o.stop(t + kesto + 0.05);
  }

  // Kohinapurske (lyönnit, pieru).
  function kohina(viive, kesto, suodatinHz, voima, varina) {
    var c = varmista();
    if (!c || mykistetty) return;
    var t = c.currentTime + (viive || 0);
    var puskuri = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * kesto)), c.sampleRate);
    var data = puskuri.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    var lahde = c.createBufferSource();
    lahde.buffer = puskuri;
    var suodin = c.createBiquadFilter();
    suodin.type = "lowpass";
    suodin.frequency.value = suodatinHz;
    var g = c.createGain();
    if (varina) {
      // "PRRRT" — voimakkuus värisee
      g.gain.setValueAtTime(0.001, t);
      var askel = 0.045;
      for (var a = 0; a * askel < kesto; a++) {
        g.gain.linearRampToValueAtTime(a % 2 ? voima : voima * 0.25, t + a * askel);
      }
      g.gain.linearRampToValueAtTime(0.001, t + kesto);
    } else {
      g.gain.setValueAtTime(voima, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + kesto);
    }
    lahde.connect(suodin); suodin.connect(g); g.connect(c.destination);
    lahde.start(t);
    lahde.stop(t + kesto);
  }

  return {
    // Kutsu ensimmäisen napautuksen yhteydessä (iOS vaatii käyttäjän eleen).
    herata: varmista,
    asetaMykistys: function (paalle) { mykistetty = paalle; },
    mykistetty: function () { return mykistetty; },

    // Osuma hirviöön: tömäys + kiliseva ding.
    osuma: function () {
      kohina(0, 0.12, 700, 0.5);
      piip(660, 0.05, 0.12, "triangle", 0.2);
      piip(880, 0.14, 0.18, "triangle", 0.2);
    },

    // Kriittinen osuma: isompi tömäys + nouseva helähdys.
    kriittinen: function () {
      kohina(0, 0.18, 500, 0.6);
      [660, 880, 1175, 1568].forEach(function (f, i) {
        piip(f, 0.06 + i * 0.07, 0.16, "triangle", 0.25);
      });
    },

    // Pieni positiivinen "pala meni oikein" -ding.
    ding: function () {
      piip(784, 0, 0.1, "sine", 0.18);
      piip(1047, 0.09, 0.15, "sine", 0.18);
    },

    // Lempeä "ei vielä osunut".
    hups: function () {
      piip(330, 0, 0.15, "sine", 0.12);
      piip(262, 0.13, 0.2, "sine", 0.12);
    },

    // Hirviö kukistui!
    voitto: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        piip(f, i * 0.11, 0.28, "triangle", 0.26);
      });
      piip(1319, 0.48, 0.5, "triangle", 0.26);
    },

    // Uusi arvonimi — juhlafanfaari.
    fanfaari: function () {
      [392, 523, 659, 784, 1047, 1319].forEach(function (f, i) {
        piip(f, i * 0.12, 0.3, "square", 0.12);
        piip(f * 1.5, i * 0.12 + 0.05, 0.25, "triangle", 0.15);
      });
    },

    // Tietenkin. 💨
    pieru: function () {
      var kesto = 0.45 + Math.random() * 0.35;
      kohina(0, kesto, 180, 0.7, true);
      piip(85 + Math.random() * 30, 0, kesto, "sawtooth", 0.15);
    }
  };
})();
