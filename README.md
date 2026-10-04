# R113-ligne_de_commande

TP interactif (BUT MMI1 — R1.13 Hébergement) : **TP1 Exploration du système
d'exploitation et de la ligne de commande**. Organisation du système de
fichiers, chemins absolus et relatifs, manipulation de fichiers et dossiers
(`pwd`, `ls`, `cd`, `mkdir`, `touch`, `mv`, `rm`) et permissions (`chmod`),
sous macOS (Terminal) ou Windows (MobaXterm en session locale Bash).

Compétence ciblée : **AC14.01** - Exploiter de manière autonome un
environnement de développement efficace et productif.

## Utiliser ce TP en tant qu'étudiant·e

1. Ouvrir `index.html` dans un navigateur (double-clic suffit : aucune page
   ne charge de données via `fetch()`, pas besoin de serveur local).
2. Suivre l'ordre du menu : Prérequis → Découverte → Manipulation → Livrable.
   Le Mémo reprend la fiche récapitulative des commandes.
3. S'entraîner dans le terminal simulé, puis refaire les manipulations dans
   son vrai terminal pour les captures d'écran du livrable.

Les réponses, la progression et l'état des terminaux sont enregistrés dans le
navigateur (`localStorage`) : rien n'est envoyé.

## Utiliser ce dépôt en tant qu'enseignant·e

Activer GitHub Pages sur la branche `main` (dossier racine) pour obtenir un
lien cliquable à distribuer.

## Éléments interactifs

- **Choix du système** (Windows / macOS) : la page Prérequis affiche la fiche
  d'installation de MobaXterm ou la consigne macOS, et le terminal simulé
  imite le système choisi (`/home/mobaxterm` ou `/Users/etudiant`).
- **Terminal Bash simulé** : système de fichiers en mémoire, commandes du TP,
  historique (↑ ↓), complétion (Tab), messages d'erreur de Bash suivis d'une
  aide en français (y compris pour les réflexes Windows : `dir`, `cd..`...).
  Chaque action du sujet se coche automatiquement quand elle est réussie.
- **Arborescence cliquable** : chemin absolu et chemin relatif de n'importe
  quel élément, depuis la position choisie.
- **Mini-jeu absolu / relatif** et **course Explorateur contre Terminal**
  (renommer 100 fichiers).
- **Ligne `ls -l` décodée** et **calculateur de permissions** (cases ↔ octal
  ↔ chaîne `rwx`).
- **Livrable** : prénom et nom, dépôt des deux captures d'écran (JPG
  uniquement, vérifié à la lecture du fichier), rédaction de Q1 à Q9, puis
  **compte rendu PDF** à déposer sur Moodle, avec la même mise en page que le
  certificat des exercices de `bases_de_js` (logos, identité, statistiques,
  avancement, réponses, captures). Le PDF est verrouillé (impression seule)
  et porte la mention « INCOMPLET » s'il manque une réponse ou une capture.
- **Mémo** : fiche récapitulative filtrable, boutons « copier », quiz
  « quelle commande ? ».

## Structure

```
R113-ligne_de_commande/
├── index.html         Accueil : objectif, compétence, déroulé
├── prerequis.html     2. Prérequis : fiche MobaXterm (Windows) ou Terminal (macOS)
├── decouverte.html    3. Découverte de l'environnement (Q1 à Q4)
├── manipulation.html  4. Manipulation des fichiers et dossiers (Q5 à Q9)
├── livrable.html      5. Livrable : identité, captures JPG, réponses, PDF
├── memo.html          Fiche récapitulative des commandes
├── css/style.css      Feuille de style partagée (thème clair / sombre)
├── img/               Logos IUT et MMI, logos Windows / macOS, captures MobaXterm
└── js/
    ├── main.js          Navigation, choix du système, étapes, stockage
    ├── terminal.js      Terminal Bash simulé et missions
    ├── decouverte.js    Missions, arborescence, tri, course
    ├── manipulation.js  Missions, calculateur chmod, ligne ls -l
    ├── livrable.js      Identité, captures, réponses Q1 à Q9
    ├── compte-rendu.js  Génération du compte rendu PDF (jsPDF)
    ├── certificat-logos.js  Logos du PDF en base64 (comme bases_de_js)
    ├── memo.js          Filtre, copie, quiz
    └── vendor/          jsPDF (licence MIT, jspdf.LICENSE.txt)
```

## Licence

Support pédagogique libre de réutilisation et d'adaptation dans un cadre
d'enseignement.
