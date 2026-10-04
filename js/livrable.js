// Page Livrable : identité, dépôt des deux captures d'écran (JPG),
// rédaction des réponses Q1 à Q9, puis génération du compte rendu PDF
// (js/compte-rendu.js). Tout reste dans le navigateur : rien n'est envoyé.

(function () {
  var zones = document.querySelectorAll('.reponse textarea');
  if (!zones.length) return;
  var reponses = TP.lire('reponses', {});
  var prenom = document.getElementById('prenom');
  var nom = document.getElementById('nom');
  var info = document.getElementById('pdf-info');

  // Captures en mémoire (la copie dans le navigateur peut échouer si
  // l'espace de stockage est plein : la capture reste alors utilisable
  // tant que la page est ouverte).
  var captures = { capture1: TP.lire('capture1', null), capture2: TP.lire('capture2', null) };

  // ---------- État du livrable ----------

  function nbReponses() {
    var n = 0;
    zones.forEach(function (z) {
      if (z.value.trim()) n++;
    });
    return n;
  }

  function maj() {
    var n = nbReponses();
    zones.forEach(function (z) {
      z.closest('.reponse').classList.toggle('remplie', z.value.trim().length > 0);
    });
    document.getElementById('reponses-compteur').textContent = n + ' / ' + zones.length;
    document.getElementById('reponses-progression').textContent = n + ' / ' + zones.length + ' réponses rédigées';
    document.querySelectorAll('[data-progress]').forEach(function (b) {
      b.style.width = Math.round((100 * n) / zones.length) + '%';
    });
    var etats = {
      identite: prenom.value.trim() && nom.value.trim(),
      capture1: !!captures.capture1,
      capture2: !!captures.capture2,
      reponses: n === zones.length
    };
    Object.keys(etats).forEach(function (k) {
      var li = document.querySelector('[data-etat="' + k + '"]');
      if (li) li.classList.toggle('faite', !!etats[k]);
    });
  }

  // ---------- Identité et réponses ----------

  prenom.value = TP.lire('prenom', '');
  nom.value = TP.lire('nom', '');
  [prenom, nom].forEach(function (champ) {
    champ.addEventListener('input', function () {
      TP.ecrire(champ.id, champ.value);
      maj();
    });
  });

  zones.forEach(function (z) {
    z.value = reponses[z.id] || '';
    z.addEventListener('input', function () {
      reponses[z.id] = z.value;
      TP.ecrire('reponses', reponses);
      maj();
    });
  });

  // ---------- Captures d'écran ----------

  function estJpeg(fichier, octets) {
    var nomOk = /\.jpe?g$/i.test(fichier.name);
    var typeOk = fichier.type === 'image/jpeg' || fichier.type === '';
    // Signature d'un JPEG : les deux premiers octets valent FF D8.
    var magique = octets[0] === 0xff && octets[1] === 0xd8;
    return nomOk && typeOk && magique;
  }

  // Réduit l'image (1600 px de large au plus) et la réencode en JPEG : le
  // PDF reste léger et la capture tient dans le stockage du navigateur.
  function preparer(url, rappel) {
    var img = new Image();
    img.onload = function () {
      var max = 1600;
      var r = Math.min(1, max / img.naturalWidth);
      var w = Math.round(img.naturalWidth * r);
      var h = Math.round(img.naturalHeight * r);
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      rappel(null, { data: canvas.toDataURL('image/jpeg', 0.88), w: w, h: h });
    };
    img.onerror = function () {
      rappel(new Error('image illisible'));
    };
    img.src = url;
  }

  function sauverCapture(cle, valeur) {
    try {
      if (valeur) localStorage.setItem('lignecmd-' + cle, JSON.stringify(valeur));
      else localStorage.removeItem('lignecmd-' + cle);
      return true;
    } catch (e) {
      return false;
    }
  }

  document.querySelectorAll('.capture').forEach(function (bloc) {
    var cle = bloc.getAttribute('data-capture');
    var input = bloc.querySelector('input[type="file"]');
    var depot = bloc.querySelector('.depot');
    var apercu = bloc.querySelector('.depot-apercu');
    var etat = bloc.querySelector('.capture-etat');
    var retirer = bloc.querySelector('[data-retirer]');

    function afficher(message, erreur) {
      var c = captures[cle];
      bloc.classList.toggle('ok', !!c && !erreur);
      bloc.classList.toggle('erreur', !!erreur);
      apercu.hidden = !c;
      depot.classList.toggle('rempli', !!c);
      if (c) apercu.src = c.data;
      else apercu.removeAttribute('src');
      retirer.hidden = !c;
      etat.textContent = message || (c ? '✔ ' + c.nom + ' (' + c.w + ' × ' + c.h + ' px)' : 'Aucune capture');
      maj();
    }

    function charger(fichier) {
      if (!fichier) return;
      var lecteur = new FileReader();
      lecteur.onload = function () {
        var octets = new Uint8Array(lecteur.result.slice(0, 4));
        if (!estJpeg(fichier, octets)) {
          afficher('✖ « ' + fichier.name + ' » n\'est pas une image JPG. Enregistre ta capture au format .jpg.', true);
          return;
        }
        var url = URL.createObjectURL(fichier);
        preparer(url, function (err, res) {
          URL.revokeObjectURL(url);
          if (err) {
            afficher('✖ Impossible de lire cette image.', true);
            return;
          }
          res.nom = fichier.name;
          captures[cle] = res;
          var ok = sauverCapture(cle, res);
          afficher(ok ? null : '✔ ' + fichier.name + ' chargée, mais non mémorisée (stockage plein) : génère le PDF avant de quitter la page.');
        });
      };
      lecteur.readAsArrayBuffer(fichier);
    }

    input.addEventListener('change', function () {
      charger(input.files[0]);
      input.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (t) {
      depot.addEventListener(t, function (evt) {
        evt.preventDefault();
        depot.classList.add('survol');
      });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      depot.addEventListener(t, function () {
        depot.classList.remove('survol');
      });
    });
    depot.addEventListener('drop', function (evt) {
      evt.preventDefault();
      charger(evt.dataTransfer.files[0]);
    });
    retirer.addEventListener('click', function () {
      captures[cle] = null;
      sauverCapture(cle, null);
      afficher();
    });
    afficher();
  });

  // ---------- Copie des réponses ----------

  function texte() {
    var lignes = ['R1.13 Hébergement - TP1 Exploration du Système d\'Exploitation et de la Ligne de Commande'];
    var qui = (prenom.value.trim() + ' ' + nom.value.trim()).trim();
    if (qui) lignes.push('Étudiant·e : ' + qui);
    lignes.push('');
    zones.forEach(function (z) {
      lignes.push(z.closest('.reponse').querySelector('label').textContent.trim());
      lignes.push(z.value.trim() || '(pas de réponse)');
      lignes.push('');
    });
    return lignes.join('\n');
  }

  function message(txt, ok) {
    info.textContent = txt;
    info.className = 'feedback ' + (ok ? 'ok' : 'ko');
  }

  document.getElementById('reponses-copier').addEventListener('click', function () {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      message('Copie impossible dans ce navigateur.', false);
      return;
    }
    navigator.clipboard.writeText(texte()).then(function () {
      message('✔ Réponses copiées dans le presse-papiers.', true);
    }, function () {
      message('Copie impossible dans ce navigateur.', false);
    });
  });

  // ---------- Génération du PDF ----------

  // Nombre d'actions réussies dans chaque terminal d'entraînement.
  function entrainement() {
    return [
      { libelle: 'Découverte', cle: 'terminal-decouverte', total: 4 },
      { libelle: 'Manipulation', cle: 'terminal-manipulation', total: 16 }
    ].map(function (t) {
      var etat = TP.lire(t.cle, null);
      var faites = etat && etat.faites ? Object.keys(etat.faites).filter(function (k) {
        return etat.faites[k];
      }).length : 0;
      return { libelle: t.libelle, faites: Math.min(faites, t.total), total: t.total };
    });
  }

  document.getElementById('generer-pdf').addEventListener('click', function () {
    var bouton = this;
    if (!prenom.value.trim() || !nom.value.trim()) {
      message('✖ Renseigne ton prénom et ton nom avant de générer le PDF.', false);
      (prenom.value.trim() ? nom : prenom).focus();
      return;
    }
    if (!window.jspdf || !window.CompteRendu) {
      message('✖ Le générateur de PDF n\'a pas pu être chargé.', false);
      return;
    }
    var maintenant = new Date();
    var opts = {
      prenom: prenom.value,
      nom: nom.value,
      date: maintenant.toLocaleDateString('fr-FR') + ' à ' + maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      questions: Array.prototype.map.call(zones, function (z) {
        var bloc = z.closest('.reponse');
        return {
          titre: bloc.querySelector('label').textContent.trim(),
          enonce: bloc.querySelector('.rappel').firstChild.textContent.trim(),
          reponse: z.value,
          partie: +bloc.getAttribute('data-partie')
        };
      }),
      captures: [captures.capture1, captures.capture2],
      titresCaptures: ['Arborescence', 'Permissions'],
      legendesCaptures: Array.prototype.map.call(document.querySelectorAll('.capture .rappel'), function (p) {
        return p.textContent.trim();
      }),
      entrainement: entrainement()
    };
    bouton.disabled = true;
    bouton.textContent = 'Génération en cours…';
    try {
      var res = CompteRendu.generer(opts);
      message(res.complet
        ? '✔ PDF généré (' + res.pages + ' pages) : dépose-le sur Moodle.'
        : '⚠ PDF généré (' + res.pages + ' pages) mais INCOMPLET : complète les éléments non cochés en haut de la page, puis régénère-le.',
        res.complet);
    } catch (e) {
      message('✖ Échec de la génération du PDF : ' + e.message, false);
    } finally {
      bouton.disabled = false;
      bouton.textContent = '📄 Générer mon compte rendu PDF';
    }
  });

  maj();
})();
