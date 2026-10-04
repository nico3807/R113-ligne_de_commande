// Terminal Bash simulé, entièrement dans la page : un petit système de
// fichiers en mémoire et les commandes du TP (pwd, ls, cd, mkdir, touch, mv,
// rm, chmod, whoami...). Les messages d'erreur reprennent ceux de Bash (en
// anglais, comme dans MobaXterm ou le Terminal macOS), suivis d'une aide en
// français.
//
// Utilisation : Terminal.creer(element, { cle, missions }) où missions est
// une liste ordonnée de { id, test(ctx) }. Une mission n'est validée que si
// la précédente l'est déjà ; les éléments [data-mission="id"] de la page
// reçoivent alors la classe « faite ».

var Terminal = (function () {
  var esc = TP.echapper;
  var MOIS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ---------- Système de fichiers ----------

  function dossier(enfants, perm) {
    return { t: 'd', p: perm || '755', m: Date.now(), c: enfants || {} };
  }
  function fichier(txt, perm) {
    return { t: 'f', p: perm || '644', m: Date.now(), txt: txt || '' };
  }

  function profil(os) {
    return os === 'macos'
      ? { user: 'etudiant', home: '/Users/etudiant', machine: 'MacBook-MMI', shellrc: '.zshrc' }
      : { user: 'mobaxterm', home: '/home/mobaxterm', machine: 'MOBAXTERM', shellrc: '.bashrc' };
  }

  function arbreInitial(pr) {
    var maison = dossier({
      '.profile': fichier('# Fichier de configuration lu à la connexion\n'),
      '.bash_history': fichier('', '600'),
      Documents: dossier({ 'notes.txt': fichier('Penser à rendre le TP1 sur Moodle !\n') }),
      Images: dossier({ 'photo.jpg': fichier('(image)') }),
      Bureau: dossier({})
    });
    maison.c[pr.shellrc] = fichier('# Configuration du shell\nalias ll="ls -l"\n');
    var racine = dossier({
      bin: dossier({ bash: fichier('', '755'), ls: fichier('', '755') }),
      etc: dossier({ hosts: fichier('127.0.0.1   localhost\n'), passwd: fichier('root:x:0:0:root:/root:/bin/bash\n') }),
      tmp: dossier({}, '777'),
      usr: dossier({ bin: dossier({}), share: dossier({}) }),
      var: dossier({ log: dossier({}), www: dossier({ html: dossier({ 'index.html': fichier('<h1>It works!</h1>\n') }) }) })
    });
    var parties = pr.home.split('/').filter(Boolean); // home/mobaxterm ou Users/etudiant
    racine.c[parties[0]] = dossier({});
    racine.c[parties[0]].c[parties[1]] = maison;
    return racine;
  }

  // ---------- Fabrique ----------

  function creer(el, options) {
    var missions = options.missions || [];
    var cle = 'terminal-' + options.cle;
    var pr, etat;

    function neuf() {
      pr = profil(TP.os());
      return {
        os: TP.os(),
        fs: arbreInitial(pr),
        cwd: pr.home,
        ancien: pr.home,
        hist: [],
        lignes: [],
        faites: {}
      };
    }

    etat = TP.lire(cle, null);
    if (!etat || etat.os !== TP.os()) etat = neuf();
    pr = profil(etat.os);

    // ---------- Interface ----------

    el.classList.add('terminal');
    el.innerHTML =
      '<div class="terminal-barre"><span class="pastille"></span><span class="pastille"></span><span class="pastille"></span>' +
      '<span class="titre"></span><button type="button" data-t="reset" title="Repartir d\'un terminal neuf">Réinitialiser</button></div>' +
      '<div class="terminal-ecran" role="log" aria-live="polite"><div class="sortie"></div>' +
      '<label class="terminal-saisie"><span class="prompt"></span>' +
      '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Commande à exécuter" /></label></div>' +
      '<div class="terminal-aide">Tape une commande puis <kbd>Entrée</kbd> · <kbd>↑</kbd> <kbd>↓</kbd> historique · <kbd>Tab</kbd> complète un nom · <code>help</code> liste les commandes</div>';
    var ecran = el.querySelector('.terminal-ecran');
    var sortie = el.querySelector('.sortie');
    var input = el.querySelector('input');
    var promptEl = el.querySelector('.prompt');
    var titre = el.querySelector('.titre');
    var posHist = null;

    ecran.addEventListener('click', function () {
      if (!window.getSelection().toString()) input.focus();
    });

    function sauver() {
      etat.lignes = etat.lignes.slice(-200);
      TP.ecrire(cle, etat);
    }

    function ajouter(html) {
      etat.lignes.push(html);
      var d = document.createElement('div');
      d.className = 'ligne';
      d.innerHTML = html;
      sortie.appendChild(d);
    }
    function out(txt, classe) {
      ajouter(classe ? '<span class="' + classe + '">' + esc(txt) + '</span>' : esc(txt));
    }
    function err(txt) {
      out(txt, 't-err');
    }
    function aide(txt) {
      out('💡 ' + txt, 't-aide');
    }

    function court(chemin) {
      if (chemin === pr.home) return '~';
      if (chemin.indexOf(pr.home + '/') === 0) return '~' + chemin.slice(pr.home.length);
      return chemin;
    }
    function promptHtml() {
      return '<span class="t-prompt-user">' + esc(pr.user + '@' + pr.machine) + '</span>:' +
        '<span class="t-prompt-path">' + esc(court(etat.cwd)) + '</span>$ ';
    }
    function majPrompt() {
      promptEl.innerHTML = promptHtml();
      titre.textContent = (etat.os === 'macos' ? 'Terminal — ' : 'MobaXterm — ') + court(etat.cwd);
    }

    // ---------- Chemins ----------

    function decouper(chemin) {
      return chemin.split('/').filter(Boolean);
    }
    function absolu(ch) {
      if (ch === undefined || ch === '') return etat.cwd;
      if (ch === '~' || ch.indexOf('~/') === 0) ch = pr.home + ch.slice(1);
      var base = ch.charAt(0) === '/' ? [] : decouper(etat.cwd);
      decouper(ch).forEach(function (p) {
        if (p === '.') return;
        if (p === '..') base.pop();
        else base.push(p);
      });
      return '/' + base.join('/');
    }
    function noeud(abs) {
      var n = etat.fs;
      var parties = decouper(abs);
      for (var i = 0; i < parties.length; i++) {
        if (!n || n.t !== 'd') return null;
        n = n.c[parties[i]];
      }
      return n || null;
    }
    function parent(abs) {
      var p = decouper(abs);
      var nom = p.pop();
      return { dir: noeud('/' + p.join('/')), nom: nom, chemin: '/' + p.join('/') };
    }

    // ---------- Affichage ls ----------

    function rwx(p, type) {
      var s = type === 'd' ? 'd' : '-';
      p.split('').forEach(function (ch) {
        var n = parseInt(ch, 8);
        s += (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
      });
      return s;
    }
    function dateLs(ts) {
      var d = new Date(ts);
      var j = String(d.getDate());
      return MOIS[d.getMonth()] + ' ' + (j.length < 2 ? ' ' + j : j) + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    function nomHtml(nom, n) {
      if (n.t === 'd') return '<span class="t-dir">' + esc(nom) + '</span>';
      if (/[1357]/.test(n.p.charAt(0))) return '<span class="t-ok">' + esc(nom) + '</span>';
      return esc(nom);
    }
    function ligneLong(nom, n) {
      var taille = n.t === 'd' ? 4096 : n.txt.length;
      return esc(rwx(n.p, n.t) + ' ' + (n.t === 'd' ? 2 : 1) + ' ' + pr.user + ' ' + pr.user + ' ' +
        String(taille).padStart(5) + ' ' + dateLs(n.m) + ' ') + nomHtml(nom, n);
    }

    // ---------- Commandes ----------

    var COMMANDES = {
      help: function () {
        out('Commandes disponibles dans ce terminal d\'entraînement :', 't-dim');
        [
          'pwd              affiche le chemin du répertoire courant',
          'ls [-a] [-l] [chemin]   liste le contenu d\'un dossier',
          'cd [chemin]      change de répertoire (.. parent, / racine, ~ perso)',
          'mkdir [-p] nom   crée un dossier',
          'touch nom...     crée un ou plusieurs fichiers vides',
          'mv source dest   déplace ou renomme',
          'rm [-r] nom      supprime (prudence !)',
          'chmod 644 nom    change les permissions',
          'whoami · cat · echo · tree · history · clear'
        ].forEach(function (l) {
          out('  ' + l);
        });
        return true;
      },
      pwd: function () {
        out(etat.cwd);
        return true;
      },
      whoami: function () {
        out(pr.user);
        return true;
      },
      clear: function () {
        etat.lignes = [];
        sortie.innerHTML = '';
        return true;
      },
      history: function () {
        etat.hist.forEach(function (h, i) {
          out(String(i + 1).padStart(4) + '  ' + h);
        });
        return true;
      },
      echo: function (args) {
        out(args.join(' ').replace(/\$HOME/g, pr.home).replace(/\$USER/g, pr.user).replace(/\$PWD/g, etat.cwd));
        return true;
      },
      exit: function () {
        aide('Dans un vrai terminal, exit fermerait la session. Ici, le terminal reste ouvert.');
        return true;
      },
      cd: function (args) {
        var cible;
        if (!args.length || args[0] === '~') cible = pr.home;
        else if (args[0] === '-') {
          cible = etat.ancien;
          out(cible);
        } else cible = absolu(args[0]);
        var n = noeud(cible);
        if (!n) {
          err('bash: cd: ' + args[0] + ': No such file or directory');
          aide('Ce dossier n\'existe pas ici. Vérifie l\'orthographe (majuscules comprises) et ta position avec pwd ou ls.');
          return false;
        }
        if (n.t !== 'd') {
          err('bash: cd: ' + args[0] + ': Not a directory');
          aide('On ne peut entrer que dans un dossier, pas dans un fichier.');
          return false;
        }
        etat.ancien = etat.cwd;
        etat.cwd = cible;
        return true;
      },
      ls: function (args, opts) {
        var cibles = args.length ? args : ['.'];
        var ok = true;
        cibles.forEach(function (c, i) {
          var abs = absolu(c);
          var n = noeud(abs);
          if (!n) {
            err("ls: cannot access '" + c + "': No such file or directory");
            ok = false;
            return;
          }
          if (n.t === 'f') {
            ajouter(opts.l ? ligneLong(c, n) : nomHtml(c, n));
            return;
          }
          if (cibles.length > 1) ajouter((i ? '\n' : '') + esc(c) + ':');
          var noms = Object.keys(n.c).sort(function (a, b) {
            return a.replace(/^\./, '').localeCompare(b.replace(/^\./, ''));
          });
          if (!opts.a) noms = noms.filter(function (x) {
            return x.charAt(0) !== '.';
          });
          var entrees = noms.map(function (x) {
            return [x, n.c[x]];
          });
          if (opts.a) {
            var par = noeud(absolu(abs + '/..'));
            entrees.unshift(['..', par || n]);
            entrees.unshift(['.', n]);
          }
          if (opts.l) {
            out('total ' + entrees.length * 4);
            entrees.forEach(function (e) {
              ajouter(ligneLong(e[0], e[1]));
            });
          } else if (entrees.length) {
            ajouter(entrees.map(function (e) {
              return nomHtml(e[0], e[1]);
            }).join('  '));
          }
        });
        return ok;
      },
      mkdir: function (args, opts) {
        if (!args.length) {
          err('mkdir: missing operand');
          aide('Indique le nom du dossier à créer, par exemple : mkdir BUT_MMI');
          return false;
        }
        var ok = true;
        args.forEach(function (a) {
          var abs = absolu(a);
          if (opts.p) {
            var cur = etat.fs;
            decouper(abs).forEach(function (p) {
              if (!cur) return;
              if (!cur.c[p]) cur.c[p] = dossier({});
              cur = cur.c[p].t === 'd' ? cur.c[p] : null;
            });
            return;
          }
          var pa = parent(abs);
          if (!pa.dir || pa.dir.t !== 'd') {
            err('mkdir: cannot create directory ‘' + a + '’: No such file or directory');
            aide('Le dossier parent n\'existe pas. Crée-le d\'abord, ou utilise mkdir -p.');
            ok = false;
          } else if (pa.dir.c[pa.nom]) {
            err('mkdir: cannot create directory ‘' + a + '’: File exists');
            aide('Un élément porte déjà ce nom ici (vérifie avec ls).');
            ok = false;
          } else {
            pa.dir.c[pa.nom] = dossier({});
            pa.dir.m = Date.now();
          }
        });
        return ok;
      },
      touch: function (args) {
        if (!args.length) {
          err('touch: missing file operand');
          aide('Indique le ou les fichiers à créer : touch index.html style.css');
          return false;
        }
        var ok = true;
        args.forEach(function (a) {
          var abs = absolu(a);
          var n = noeud(abs);
          if (n) {
            n.m = Date.now();
            return;
          }
          var pa = parent(abs);
          if (!pa.dir || pa.dir.t !== 'd') {
            err("touch: cannot touch '" + a + "': No such file or directory");
            ok = false;
            return;
          }
          pa.dir.c[pa.nom] = fichier('');
        });
        return ok;
      },
      mv: function (args) {
        if (args.length < 2) {
          err(args.length ? "mv: missing destination file operand after '" + args[0] + "'" : 'mv: missing file operand');
          aide('mv attend deux arguments : la source puis la destination. Ex. : mv ancien.txt nouveau.txt');
          return false;
        }
        var dest = args[args.length - 1];
        var destAbs = absolu(dest);
        var destN = noeud(destAbs);
        // Avec plusieurs sources, la destination doit être un dossier
        // existant : sinon Bash refuse tout, sans rien déplacer.
        if (args.length > 2 && !(destN && destN.t === 'd')) {
          err("mv: target '" + dest + "' is not a directory");
          aide('Avec plus de deux arguments, mv déplace tous les premiers DANS le dernier, qui doit être un dossier. Pour renommer : mv ancien_nom nouveau_nom (deux arguments seulement).');
          return false;
        }
        var ok = true;
        args.slice(0, -1).forEach(function (src) {
          var srcAbs = absolu(src);
          var n = noeud(srcAbs);
          if (!n) {
            err("mv: cannot stat '" + src + "': No such file or directory");
            aide('Le fichier source est introuvable depuis ton dossier courant (pwd ?).');
            ok = false;
            return;
          }
          var cibleAbs, pa;
          if (destN && destN.t === 'd') {
            cibleAbs = destAbs + '/' + decouper(srcAbs).pop();
          } else {
            cibleAbs = destAbs;
          }
          if (cibleAbs === srcAbs) {
            err("mv: '" + src + "' and '" + dest + "' are the same file");
            ok = false;
            return;
          }
          if ((cibleAbs + '/').indexOf(srcAbs + '/') === 0) {
            err("mv: cannot move '" + src + "' to a subdirectory of itself");
            ok = false;
            return;
          }
          pa = parent(cibleAbs);
          if (!pa.dir || pa.dir.t !== 'd') {
            err("mv: cannot move '" + src + "' to '" + dest + "': No such file or directory");
            ok = false;
            return;
          }
          var sp = parent(srcAbs);
          delete sp.dir.c[sp.nom];
          pa.dir.c[pa.nom] = n;
        });
        return ok;
      },
      rm: function (args, opts) {
        if (!args.length) {
          err('rm: missing operand');
          return false;
        }
        var ok = true;
        args.forEach(function (a) {
          var abs = absolu(a);
          var n = noeud(abs);
          if (abs === '/' || abs === pr.home) {
            err("rm: refusing to remove '" + a + "'");
            aide('Ce terminal t\'empêche de supprimer la racine ou ton dossier personnel. Un vrai terminal, lui, ne te protège pas toujours !');
            ok = false;
            return;
          }
          if (!n) {
            if (!opts.f) {
              err("rm: cannot remove '" + a + "': No such file or directory");
              ok = false;
            }
            return;
          }
          if (n.t === 'd' && !opts.r) {
            err("rm: cannot remove '" + a + "': Is a directory");
            aide('Pour supprimer un dossier et tout son contenu : rm -r ' + a + ' (à utiliser avec grande prudence).');
            ok = false;
            return;
          }
          var pa = parent(abs);
          delete pa.dir.c[pa.nom];
        });
        if (!noeud(etat.cwd)) {
          etat.cwd = pr.home;
          out('(ton dossier courant a été supprimé : retour dans ~)', 't-dim');
        }
        return ok;
      },
      chmod: function (args) {
        if (args.length < 2) {
          err('chmod: missing operand');
          aide('Syntaxe : chmod 644 fichier (ou chmod u+x fichier)');
          return false;
        }
        var mode = args[0];
        var octal = /^[0-7]{3}$/.test(mode);
        var symb = /^([ugoa]*[+\-=][rwx]*)(,[ugoa]*[+\-=][rwx]*)*$/.test(mode);
        if (!octal && !symb) {
          err("chmod: invalid mode: ‘" + mode + '’');
          aide('Le mode s\'écrit avec trois chiffres de 0 à 7 (ex. 444) ou sous forme u+x, go-w...');
          return false;
        }
        var ok = true;
        args.slice(1).forEach(function (a) {
          var n = noeud(absolu(a));
          if (!n) {
            err("chmod: cannot access '" + a + "': No such file or directory");
            ok = false;
            return;
          }
          if (octal) {
            n.p = mode;
            return;
          }
          var v = n.p.split('').map(function (c) {
            return parseInt(c, 8);
          });
          mode.split(',').forEach(function (clause) {
            var m = clause.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
            var qui = m[1] || 'a';
            var bits = (m[3].indexOf('r') !== -1 ? 4 : 0) + (m[3].indexOf('w') !== -1 ? 2 : 0) + (m[3].indexOf('x') !== -1 ? 1 : 0);
            ['u', 'g', 'o'].forEach(function (q, i) {
              if (qui.indexOf(q) === -1 && qui.indexOf('a') === -1) return;
              if (m[2] === '+') v[i] |= bits;
              else if (m[2] === '-') v[i] &= ~bits;
              else v[i] = bits;
            });
          });
          n.p = v.join('');
        });
        return ok;
      },
      cat: function (args) {
        var ok = true;
        args.forEach(function (a) {
          var n = noeud(absolu(a));
          if (!n) {
            err('cat: ' + a + ': No such file or directory');
            ok = false;
          } else if (n.t === 'd') {
            err('cat: ' + a + ': Is a directory');
            ok = false;
          } else if (n.txt) {
            n.txt.replace(/\n$/, '').split('\n').forEach(function (l) {
              out(l);
            });
          }
        });
        return ok;
      },
      tree: function (args) {
        var abs = absolu(args[0]);
        var n = noeud(abs);
        if (!n || n.t !== 'd') {
          err((args[0] || '.') + ' [error opening dir]');
          return false;
        }
        ajouter('<span class="t-dir">' + esc(args[0] || '.') + '</span>');
        (function rec(d, pref) {
          var noms = Object.keys(d.c).filter(function (x) {
            return x.charAt(0) !== '.';
          }).sort();
          noms.forEach(function (x, i) {
            var der = i === noms.length - 1;
            ajouter(esc(pref + (der ? '└── ' : '├── ')) + nomHtml(x, d.c[x]));
            if (d.c[x].t === 'd') rec(d.c[x], pref + (der ? '    ' : '│   '));
          });
        })(n, '');
        return true;
      }
    };

    // Réflexes venus de Windows (invite CMD) : on oriente vers l'équivalent.
    var EQUIV = { dir: 'ls', cls: 'clear', md: 'mkdir', ren: 'mv', rename: 'mv', move: 'mv', del: 'rm', erase: 'rm', type: 'cat', copy: 'cp', 'cd..': 'cd ..', ll: 'ls -l' };

    // ---------- Exécution ----------

    function decouperArgs(ligne) {
      var res = [];
      var re = /"([^"]*)"|'([^']*)'|(\S+)/g;
      var m;
      while ((m = re.exec(ligne))) res.push(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]);
      return res;
    }

    function executerUne(ligne) {
      var mots = decouperArgs(ligne);
      if (!mots.length) return true;
      var cmd = mots[0];
      var opts = {};
      var args = [];
      mots.slice(1).forEach(function (m) {
        if (/^-[a-zA-Z]+$/.test(m) && cmd !== 'echo' && !(cmd === 'chmod' && !args.length && /^-[rwx]+$/.test(m))) {
          m.slice(1).split('').forEach(function (l) {
            opts[l.toLowerCase()] = true;
          });
        } else args.push(m);
      });
      if (cmd === 'cd' && mots[1] === '-') args = ['-'];
      if (cmd === 'll') {
        cmd = 'ls';
        opts.l = true;
      }
      var f = COMMANDES[cmd];
      if (!f) {
        err('bash: ' + cmd + ': command not found');
        if (EQUIV[cmd.toLowerCase()]) aide('« ' + cmd + ' » est une commande Windows. Sous Linux/Unix, on écrit : ' + EQUIV[cmd.toLowerCase()]);
        else if (COMMANDES[cmd.toLowerCase()]) aide('Les commandes s\'écrivent en minuscules : ' + cmd.toLowerCase());
        else aide('Commande inconnue (ou non simulée ici). Tape help pour la liste.');
        return false;
      }
      var ok = f(args, opts);
      // « mv a mv a b » : le nom de la commande recopié dans ses arguments.
      if (cmd !== 'echo' && cmd !== 'help' && args.indexOf(cmd) !== -1) {
        aide('Le mot « ' + cmd + ' » apparaît aussi dans les arguments : tu l\'as peut-être tapé deux fois. Le nom de la commande ne s\'écrit qu\'une fois, au début.');
      }
      verifierMissions({ cmd: cmd, args: args, opts: opts, ok: ok });
      return ok;
    }

    function executer(ligne) {
      ajouter(promptHtml() + esc(ligne));
      if (ligne.trim()) {
        etat.hist.push(ligne);
        etat.hist = etat.hist.slice(-100);
      }
      // Enchaînements « a ; b » et « a && b ».
      var morceaux = ligne.split(/(;|&&)/);
      var continuer = true;
      for (var i = 0; i < morceaux.length; i += 2) {
        if (!continuer) break;
        var ok = executerUne(morceaux[i].trim());
        continuer = morceaux[i + 1] === '&&' ? ok : true;
      }
      majPrompt();
      sauver();
      ecran.scrollTop = ecran.scrollHeight;
    }

    // ---------- Missions ----------

    function ctxMission(derniere) {
      return {
        cmd: derniere.cmd,
        args: derniere.args,
        opts: derniere.opts,
        ok: derniere.ok,
        cwd: etat.cwd,
        home: pr.home,
        // Chemin relatif au dossier personnel → nœud (ou null).
        perso: function (rel) {
          return noeud(pr.home + (rel ? '/' + rel : ''));
        },
        estIci: function (rel) {
          return etat.cwd === pr.home + (rel ? '/' + rel : '');
        },
        // Chemin absolu visé par le dernier ls réussi (ou null).
        lsCible: function () {
          return derniere.cmd === 'ls' && derniere.ok ? absolu(derniere.args[0]) : null;
        },
        // Le dernier ls visait-il ce dossier (relatif au dossier perso) ?
        lsSur: function (rel) {
          return this.lsCible() === pr.home + (rel ? '/' + rel : '');
        }
      };
    }

    function marquer(id) {
      document.querySelectorAll('[data-mission="' + id + '"]').forEach(function (li) {
        li.classList.add('faite');
      });
    }

    function verifierMissions(derniere) {
      var ctx = ctxMission(derniere);
      var nouvelles = [];
      for (var i = 0; i < missions.length; i++) {
        var m = missions[i];
        if (etat.faites[m.id]) continue;
        if (i > 0 && !etat.faites[missions[i - 1].id]) break;
        var reussi = false;
        try {
          reussi = m.test(ctx);
        } catch (e) {
          reussi = false;
        }
        if (!reussi) break;
        etat.faites[m.id] = true;
        marquer(m.id);
        nouvelles.push(m);
      }
      nouvelles.forEach(function (m) {
        out('✔ ' + (m.bravo || 'Étape validée'), 't-ok');
      });
      if (nouvelles.length && missions.every(function (m) {
        return etat.faites[m.id];
      })) {
        out('🎉 Toutes les actions de cette partie sont réussies. Refais-les maintenant dans ton vrai terminal pour le livrable !', 't-ok');
      }
    }

    // ---------- Clavier ----------

    function completer() {
      var val = input.value;
      var mots = val.split(/\s+/);
      var dernier = mots[mots.length - 1];
      var coupe = dernier.lastIndexOf('/');
      var dirPart = coupe >= 0 ? dernier.slice(0, coupe + 1) : '';
      var debut = dernier.slice(coupe + 1);
      var d = noeud(absolu(dirPart || '.'));
      if (!d || d.t !== 'd') return;
      var cands = Object.keys(d.c).filter(function (x) {
        return x.indexOf(debut) === 0 && (debut.charAt(0) === '.' || x.charAt(0) !== '.');
      });
      if (cands.length === 1) {
        var n = d.c[cands[0]];
        mots[mots.length - 1] = dirPart + cands[0] + (n.t === 'd' ? '/' : ' ');
        input.value = mots.join(' ');
      } else if (cands.length > 1) {
        ajouter(promptHtml() + esc(val));
        ajouter(cands.map(function (x) {
          return nomHtml(x, d.c[x]);
        }).join('  '));
        ecran.scrollTop = ecran.scrollHeight;
      }
    }

    input.addEventListener('keydown', function (evt) {
      if (evt.key === 'Enter') {
        var v = input.value;
        input.value = '';
        posHist = null;
        executer(v);
      } else if (evt.key === 'ArrowUp' || evt.key === 'ArrowDown') {
        if (!etat.hist.length) return;
        evt.preventDefault();
        if (posHist === null) posHist = etat.hist.length;
        posHist += evt.key === 'ArrowUp' ? -1 : 1;
        posHist = Math.max(0, Math.min(etat.hist.length, posHist));
        input.value = etat.hist[posHist] || '';
      } else if (evt.key === 'Tab') {
        evt.preventDefault();
        completer();
      } else if (evt.key === 'l' && evt.ctrlKey) {
        evt.preventDefault();
        COMMANDES.clear();
        sauver();
      } else if (evt.key === 'c' && evt.ctrlKey && !window.getSelection().toString()) {
        ajouter(promptHtml() + esc(input.value) + '^C');
        input.value = '';
      }
    });

    function demarrer() {
      sortie.innerHTML = '';
      var anciennes = etat.lignes;
      etat.lignes = [];
      if (!anciennes.length) {
        out(etat.os === 'macos'
          ? 'Last login: ' + new Date().toDateString() + ' on ttys000'
          : '• MobaXterm (terminal d\'entraînement simulé) •', 't-dim');
        out('Ce terminal est une simulation : rien n\'est modifié sur ton ordinateur.', 't-dim');
        out('Tape help pour la liste des commandes.', 't-dim');
      } else {
        anciennes.forEach(ajouter);
      }
      Object.keys(etat.faites).forEach(marquer);
      majPrompt();
      ecran.scrollTop = ecran.scrollHeight;
    }

    function repartir() {
      etat = neuf();
      document.querySelectorAll('[data-mission]').forEach(function (li) {
        var id = li.getAttribute('data-mission');
        if (missions.some(function (m) {
          return m.id === id;
        })) li.classList.remove('faite');
      });
      demarrer();
      sauver();
    }

    el.querySelector('[data-t="reset"]').addEventListener('click', function () {
      repartir();
      input.focus();
    });

    // Le système choisi change l'utilisateur et le dossier personnel.
    document.addEventListener('tp:os', function (evt) {
      if (etat.os !== evt.detail) repartir();
    });

    demarrer();
    return { executer: executer };
  }

  return { creer: creer };
})();
