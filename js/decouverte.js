// Page Découverte : terminal d'entraînement, arborescence cliquable (chemin
// absolu / relatif), tri de chemins et course Explorateur / Terminal.

(function () {
  // ---------- Terminal et missions ----------
  var el = document.getElementById('terminal-decouverte');
  if (el) {
    Terminal.creer(el, {
      cle: 'decouverte',
      missions: [
        { id: 'd-pwd', bravo: 'pwd affiche le chemin complet de ton dossier personnel.', test: function (c) {
          return c.cmd === 'pwd' && c.estIci('');
        } },
        { id: 'd-racine', bravo: 'Te voilà à la racine du système de fichiers.', test: function (c) {
          return c.cmd === 'ls' && c.lsCible() === '/';
        } },
        { id: 'd-retour', bravo: 'Retour à la maison !', test: function (c) {
          return c.cmd === 'cd' && c.estIci('');
        } },
        { id: 'd-lsa', bravo: 'Les fichiers qui commencent par un point apparaissent maintenant.', test: function (c) {
          return c.opts.a && c.lsSur('');
        } }
      ]
    });
  }

  // ---------- Arborescence cliquable ----------
  var ARBRE = {
    '/': {
      bin: {},
      etc: { hosts: null },
      home: {
        etudiant: {
          'projet.txt': null,
          images: { 'photo.jpg': null },
          Documents: { 'cv.pdf': null }
        }
      },
      tmp: {},
      var: { www: { html: { 'index.html': null } } }
    }
  };

  var arbo = document.getElementById('arbo');
  var ici = '/home/etudiant';
  var cible = null;
  var mode = 'cible';

  function construire(noeud, chemin) {
    var ul = document.createElement('ul');
    Object.keys(noeud).forEach(function (nom) {
      var li = document.createElement('li');
      var abs = chemin === '' ? '/' : (chemin === '/' ? '' : chemin) + '/' + nom;
      var estDossier = noeud[nom] !== null;
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.chemin = abs;
      b.dataset.dossier = estDossier ? '1' : '';
      b.textContent = (estDossier ? '📁 ' : '📄 ') + nom + (estDossier && nom !== '/' ? '/' : '');
      li.appendChild(b);
      if (estDossier && Object.keys(noeud[nom]).length) li.appendChild(construire(noeud[nom], abs));
      ul.appendChild(li);
    });
    return ul;
  }

  function relatif(de, vers) {
    var a = de.split('/').filter(Boolean);
    var b = vers.split('/').filter(Boolean);
    var i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    var parts = [];
    for (var k = i; k < a.length; k++) parts.push('..');
    return parts.concat(b.slice(i)).join('/') || '.';
  }

  function majArbo() {
    arbo.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('ici', b.dataset.chemin === ici);
      b.classList.toggle('cible', b.dataset.chemin === cible);
    });
    document.getElementById('arbo-ici').textContent = ici;
    document.getElementById('arbo-abs').textContent = cible || '—';
    document.getElementById('arbo-rel').textContent = cible ? relatif(ici, cible) : '—';
    var exp = document.getElementById('arbo-explication');
    if (!cible) {
      exp.textContent = 'Clique sur un fichier ou un dossier de l\'arborescence.';
    } else {
      var rel = relatif(ici, cible);
      exp.textContent = 'Le chemin absolu commence par « / » : il est valable où que tu sois. ' +
        'Le chemin relatif « ' + rel + ' » ne fonctionne que depuis ' + ici +
        (rel.indexOf('..') === 0 ? ' (« .. » remonte d\'un niveau).' : '.');
    }
  }

  if (arbo) {
    arbo.appendChild(construire(ARBRE, ''));
    arbo.addEventListener('click', function (evt) {
      var b = evt.target.closest('button');
      if (!b) return;
      if (mode === 'ici') {
        if (!b.dataset.dossier) return;
        ici = b.dataset.chemin;
      } else {
        cible = b.dataset.chemin;
      }
      majArbo();
    });
    document.querySelectorAll('[data-arbo-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.getAttribute('data-arbo-mode');
        document.querySelectorAll('[data-arbo-mode]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === btn);
        });
      });
    });
    majArbo();
  }

  // ---------- Tri absolu / relatif ----------
  var tri = document.getElementById('tri');
  if (tri) {
    var score = document.getElementById('tri-score');
    var reponses = {};
    function majScore() {
      var total = tri.querySelectorAll('.tri-item').length;
      var bons = tri.querySelectorAll('.tri-item.ok').length;
      var faits = Object.keys(reponses).length;
      score.textContent = faits ? bons + ' / ' + total + ' bien classés' + (bons === total ? ' 🎉' : '') : '';
    }
    tri.querySelectorAll('.tri-item').forEach(function (item, i) {
      item.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          var bon = b.getAttribute('data-choix') === item.getAttribute('data-type');
          reponses[i] = true;
          item.classList.toggle('ok', bon);
          item.classList.toggle('ko', !bon);
          item.querySelector('.verdict').textContent = (bon ? '✔ ' : '✖ ') + item.getAttribute('data-explication');
          majScore();
        });
      });
    });
  }

  // ---------- Course Explorateur / Terminal ----------
  var depart = document.getElementById('course-depart');
  if (depart) {
    var fin = document.getElementById('course-fin');
    var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    depart.addEventListener('click', function () {
      depart.disabled = true;
      fin.hidden = true;
      var expl = document.querySelector('.couloir.explorateur');
      var term = document.querySelector('.couloir.terminal-c');
      var pisteE = expl.querySelector('.piste span');
      var pisteT = term.querySelector('.piste span');
      var chronoE = expl.querySelector('.chrono');
      var chronoT = term.querySelector('.chrono');
      pisteE.style.width = pisteT.style.width = '0%';
      // Le terminal : une seule ligne, quasi instantanée.
      setTimeout(function () {
        pisteT.style.width = '100%';
        chronoT.textContent = '100 / 100 · 3 s';
      }, 300);
      // L'explorateur : clic droit > Renommer > taper > Entrée, 100 fois
      // (environ 6 s par fichier, accéléré ici 60 fois).
      var n = 0;
      var t = setInterval(function () {
        n += reduit ? 20 : 1;
        if (n > 100) n = 100;
        pisteE.style.width = n + '%';
        var s = n * 6;
        chronoE.textContent = n + ' / 100 · ' + Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0');
        if (n >= 100) {
          clearInterval(t);
          depart.disabled = false;
          fin.hidden = false;
        }
      }, reduit ? 200 : 100);
    });
  }
})();
