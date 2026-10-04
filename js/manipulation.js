// Page Manipulation : terminal d'entraînement dont les missions suivent
// les actions du sujet (parties 4.1 à 4.3), calculateur chmod et ligne
// « ls -l » décodée.

(function () {
  var TP_H = 'BUT_MMI/TP_Hebergement';
  var RES = 'BUT_MMI/Ressources';

  function existe(c, rel, type) {
    var n = c.perso(rel);
    return !!n && (!type || n.t === type);
  }

  var el = document.getElementById('terminal-manip');
  if (el) {
    Terminal.creer(el, {
      cle: 'manipulation',
      missions: [
        // 4.1 Navigation et création
        { id: 'm-mkdir', bravo: 'Dossier BUT_MMI créé.', test: function (c) {
          return existe(c, 'BUT_MMI', 'd');
        } },
        { id: 'm-cd', bravo: 'Tu es dans BUT_MMI.', test: function (c) {
          return c.estIci('BUT_MMI');
        } },
        { id: 'm-sous', bravo: 'Sous-dossier TP_Hebergement créé.', test: function (c) {
          return existe(c, TP_H, 'd');
        } },
        { id: 'm-cd2', bravo: 'Tu es dans TP_Hebergement.', test: function (c) {
          return c.estIci(TP_H);
        } },
        { id: 'm-touch', bravo: 'Les trois fichiers vides existent.', test: function (c) {
          return ['index.html', 'style.css', 'config.json'].every(function (f) {
            return existe(c, TP_H + '/' + f, 'f');
          });
        } },
        { id: 'm-ls', bravo: 'Contenu vérifié.', test: function (c) {
          return c.lsSur(TP_H);
        } },
        // 4.2 Renommage et déplacement
        { id: 'm-mv', bravo: 'config.json est devenu parametres.json.', test: function (c) {
          return existe(c, TP_H + '/parametres.json', 'f') && !existe(c, TP_H + '/config.json');
        } },
        { id: 'm-parent', bravo: 'Remonté dans BUT_MMI en une commande.', test: function (c) {
          return c.cmd === 'cd' && c.estIci('BUT_MMI') && /^\.\.\/?$/.test(c.args[0] || '');
        } },
        { id: 'm-res', bravo: 'Dossier Ressources créé.', test: function (c) {
          return existe(c, RES, 'd');
        } },
        { id: 'm-deplace', bravo: 'style.css est rangé dans Ressources.', test: function (c) {
          return existe(c, RES + '/style.css', 'f') && !existe(c, TP_H + '/style.css');
        } },
        { id: 'm-lsres', bravo: 'Contenu de Ressources affiché.', test: function (c) {
          return c.lsSur(RES);
        } },
        // 4.3 Permissions
        { id: 'm-p1', bravo: 'Tu es dans BUT_MMI.', test: function (c) {
          return c.estIci('BUT_MMI');
        } },
        { id: 'm-p2', bravo: 'Tu es dans TP_Hebergement.', test: function (c) {
          return c.estIci(TP_H);
        } },
        { id: 'm-lsl', bravo: 'Voici les permissions détaillées.', test: function (c) {
          return c.opts.l && c.lsSur(TP_H);
        } },
        { id: 'm-chmod', bravo: 'index.html est en lecture seule (444).', test: function (c) {
          var n = c.perso(TP_H + '/index.html');
          return n && n.p === '444';
        } },
        { id: 'm-lsl2', bravo: 'Compare la nouvelle chaîne de permissions de index.html.', test: function (c) {
          return c.opts.l && c.lsSur(TP_H);
        } }
      ]
    });
  }

  // ---------- Calculateur chmod ----------
  var calc = document.getElementById('chmod-calc');
  if (calc) {
    var boites = calc.querySelectorAll('input[type="checkbox"]');
    var octal = calc.querySelector('[name="octal"]');
    var chaine = calc.querySelector('[name="chaine"]');
    var cmd = calc.querySelector('[name="cmd"]');

    function depuisCases() {
      var chiffres = [0, 0, 0];
      var s = '';
      boites.forEach(function (b) {
        var i = +b.getAttribute('data-qui');
        var v = +b.getAttribute('data-val');
        if (b.checked) chiffres[i] += v;
      });
      chiffres.forEach(function (n) {
        s += (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
      });
      octal.value = chiffres.join('');
      chaine.value = s;
      cmd.value = 'chmod ' + chiffres.join('') + ' index.html';
    }

    function depuisOctal() {
      var v = octal.value.trim();
      if (!/^[0-7]{3}$/.test(v)) {
        octal.setAttribute('aria-invalid', 'true');
        return;
      }
      octal.removeAttribute('aria-invalid');
      boites.forEach(function (b) {
        var n = parseInt(v.charAt(+b.getAttribute('data-qui')), 8);
        b.checked = !!(n & +b.getAttribute('data-val'));
      });
      depuisCases();
    }

    boites.forEach(function (b) {
      b.addEventListener('change', depuisCases);
    });
    octal.addEventListener('input', depuisOctal);
    calc.querySelectorAll('[data-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        octal.value = btn.getAttribute('data-preset');
        depuisOctal();
      });
    });
    depuisCases();
  }

  // ---------- Ligne ls -l décodée ----------
  var decode = document.getElementById('ls-decode');
  var explication = document.getElementById('ls-explication');
  if (decode && explication) {
    decode.addEventListener('click', function (evt) {
      var b = evt.target.closest('button');
      if (!b) return;
      decode.querySelectorAll('button').forEach(function (x) {
        x.classList.toggle('on', x === b);
      });
      explication.innerHTML = '<strong>' + TP.echapper(b.textContent.trim()) + '</strong> : ' + b.getAttribute('data-texte');
    });
  }
})();
