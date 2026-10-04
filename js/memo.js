// Page Mémo : filtre des commandes, boutons « copier » et quiz « quelle
// commande ? ».

(function () {
  // ---------- Filtre ----------
  var filtre = document.getElementById('filtre');
  if (filtre) {
    filtre.addEventListener('input', function () {
      var q = filtre.value.trim().toLowerCase();
      document.querySelectorAll('[data-filtrable] tbody tr').forEach(function (tr) {
        tr.hidden = q && tr.textContent.toLowerCase().indexOf(q) === -1;
      });
    });
  }

  // ---------- Copier une commande ----------
  document.querySelectorAll('[data-copie]').forEach(function (code) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'copier';
    b.textContent = 'copier';
    b.setAttribute('aria-label', 'Copier ' + code.textContent);
    b.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        b.textContent = 'copié ✔';
        setTimeout(function () {
          b.textContent = 'copier';
        }, 1500);
      });
    });
    code.insertAdjacentElement('afterend', b);
  });

  // ---------- Quiz « quelle commande ? » ----------
  var QUIZ = [
    { q: 'Afficher le chemin du dossier dans lequel je me trouve.', r: ['pwd'] },
    { q: 'Lister les fichiers, y compris les fichiers cachés.', r: ['ls -a', 'ls -la', 'ls -al'] },
    { q: 'Afficher les permissions des fichiers du dossier courant.', r: ['ls -l', 'ls -la', 'ls -al'] },
    { q: 'Remonter au dossier parent.', r: ['cd ..', 'cd ../'] },
    { q: 'Revenir dans mon dossier personnel.', r: ['cd', 'cd ~', 'cd ~/'] },
    { q: 'Créer un dossier nommé site.', r: ['mkdir site'] },
    { q: 'Créer un fichier vide contact.html.', r: ['touch contact.html'] },
    { q: 'Renommer brouillon.txt en final.txt.', r: ['mv brouillon.txt final.txt'] },
    { q: 'Supprimer le dossier vieux et tout son contenu.', r: ['rm -r vieux', 'rm -rf vieux', 'rm -fr vieux'] },
    { q: 'Donner rw-r--r-- à page.html.', r: ['chmod 644 page.html'] },
    { q: 'Afficher le nom de l\'utilisateur connecté.', r: ['whoami'] }
  ];

  var bloc = document.getElementById('quiz-cmd');
  if (!bloc) return;
  var enonce = bloc.querySelector('.q-enonce');
  var input = bloc.querySelector('input');
  var fb = bloc.querySelector('.feedback');
  var compte = bloc.querySelector('.q-compte');
  var ordre = QUIZ.map(function (_, i) {
    return i;
  }).sort(function () {
    return Math.random() - 0.5;
  });
  var pos = 0;
  var bons = 0;
  var essaye = false;

  function afficher() {
    if (pos >= ordre.length) {
      enonce.textContent = 'Terminé : ' + bons + ' / ' + ordre.length + ' du premier coup. Recharge la page pour rejouer.';
      bloc.querySelector('form').hidden = true;
      return;
    }
    enonce.textContent = QUIZ[ordre[pos]].q;
    compte.textContent = 'Question ' + (pos + 1) + ' / ' + ordre.length;
    input.value = '';
    essaye = false;
  }

  bloc.querySelector('form').addEventListener('submit', function (evt) {
    evt.preventDefault();
    var item = QUIZ[ordre[pos]];
    var rep = input.value.trim().replace(/\s+/g, ' ');
    if (item.r.indexOf(rep) !== -1) {
      if (!essaye) bons++;
      fb.className = 'feedback ok';
      fb.textContent = '✔ Exact : ' + rep;
      pos++;
      afficher();
    } else {
      essaye = true;
      fb.className = 'feedback ko';
      fb.textContent = '✖ Pas tout à fait. Réponse attendue : ' + item.r[0] + ' (retape-la pour continuer).';
    }
  });

  afficher();
})();
