// Page Livrable : liste de contrôle des captures et rédaction des réponses
// Q1 à Q9, enregistrées dans le navigateur, à copier ou télécharger pour
// les déposer sur Moodle.

(function () {
  var zones = document.querySelectorAll('.reponse textarea');
  if (!zones.length) return;
  var reponses = TP.lire('reponses', {});
  var compteur = document.getElementById('reponses-compteur');
  var info = document.getElementById('reponses-info');

  function maj() {
    var n = 0;
    zones.forEach(function (z) {
      var pleine = z.value.trim().length > 0;
      z.closest('.reponse').classList.toggle('remplie', pleine);
      if (pleine) n++;
    });
    compteur.textContent = n + ' / ' + zones.length + ' réponses rédigées';
    document.querySelectorAll('[data-progress]').forEach(function (b) {
      b.style.width = Math.round((100 * n) / zones.length) + '%';
    });
  }

  zones.forEach(function (z) {
    z.value = reponses[z.id] || '';
    z.addEventListener('input', function () {
      reponses[z.id] = z.value;
      TP.ecrire('reponses', reponses);
      maj();
    });
  });

  function texte() {
    var nom = document.getElementById('nom-etudiant').value.trim();
    var lignes = ['R1.13 Hébergement - TP1 Exploration du Système d\'Exploitation et de la Ligne de Commande'];
    if (nom) lignes.push('Étudiant·e : ' + nom);
    lignes.push('');
    zones.forEach(function (z) {
      var label = z.closest('.reponse').querySelector('label').textContent.trim();
      lignes.push(label);
      lignes.push(z.value.trim() || '(pas de réponse)');
      lignes.push('');
    });
    return lignes.join('\n');
  }

  var nom = document.getElementById('nom-etudiant');
  nom.value = TP.lire('nom', '');
  nom.addEventListener('input', function () {
    TP.ecrire('nom', nom.value);
  });

  document.getElementById('reponses-copier').addEventListener('click', function () {
    var t = texte();
    function ok() {
      info.textContent = '✔ Réponses copiées : colle-les dans le devoir Moodle.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(ok, function () {
        info.textContent = 'Copie impossible : utilise plutôt le téléchargement.';
      });
    } else {
      info.textContent = 'Copie impossible : utilise plutôt le téléchargement.';
    }
  });

  document.getElementById('reponses-telecharger').addEventListener('click', function () {
    var blob = new Blob([texte()], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'TP1_reponses' + (nom.value.trim() ? '_' + nom.value.trim().replace(/\s+/g, '_') : '') + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
    info.textContent = '✔ Fichier téléchargé : dépose-le sur Moodle avec tes deux captures.';
  });

  // Cases de la liste de contrôle des captures.
  var coches = TP.lire('livrable', {});
  document.querySelectorAll('.objectifs-check input').forEach(function (c) {
    c.checked = !!coches[c.value];
    c.addEventListener('change', function () {
      coches[c.value] = c.checked;
      TP.ecrire('livrable', coches);
    });
  });

  maj();
})();
