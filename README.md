# Site de Djahou N. Tognon

Page académique statique. Le texte (biographie, recherche, publications, exposés, enseignement) vient du dossier `website` et n’est pas reformulé. La mise en page et les réglages du site, eux, se font ici.

Deux adresses, deux usages :

| Usage | Adresse |
|---|---|
| Le site, celui qui sera publié | l’adresse habituelle du site, par exemple `https://djahou-tognon.github.io` |
| Les mises à jour, seulement sur cet ordinateur | http://127.0.0.1:8090/studio.html |

La page de mise à jour n’apparaît nulle part sur le site. Il n’y a pas de lien vers elle, ni dans le menu, ni en bas de page. On l’ouvre en tapant l’adresse locale.

## Voir le site en local

Dans ce dossier :

```bash
./preview.sh
```

Puis ouvrir http://127.0.0.1:8090

Le serveur n’écoute que cette machine. Arrêter avec Ctrl+C.

Ne pas ouvrir les fichiers HTML directement (`file://`) : les pages chargent leur contenu en JSON et cela ne fonctionne pas ainsi.

## Mettre à jour

1. Lancer `./preview.sh`.
2. Ouvrir http://127.0.0.1:8090/studio.html
3. Modifier, regarder l’aperçu, puis cliquer **Enregistrer**.

Tant que l’on n’a pas enregistré, le changement reste un brouillon de ce navigateur. **Annuler le brouillon** revient au dernier enregistrement.

Trois onglets :

- **Affichage.** Langue, couleurs du thème, pages du menu, photo, liens, sections de l’accueil, ce qui est montré pour chaque publication, exposé ou cours.
- **Textes.** Saisir un nouvel article, un exposé, un cours, une actualité, un paragraphe de biographie, un thème ou un projet. Pour corriger une erreur de saisie, choisir l’entrée dans « Corriger une entrée », modifier le texte, puis enregistrer la correction. Les fichiers d’origine ne sont pas réécrits. On ne rédige pas de JSON.
- **Style.** Couleur d’accent, couleur du texte, fond, largeur de la colonne, taille du texte, et un peu de CSS libre.

**Enregistrer** écrit trois fichiers, et seulement ceux-là :

| Fichier | Rôle |
|---|---|
| `content/display.json` | Ce que le site montre |
| `content/local.json` | Textes ajoutés ou corrigés depuis la page locale |
| `css/custom.css` | Le style réglé dans l’onglet Style |

Les neuf fichiers de contenu d’origine ne sont pas réécrits. Le site les lit, puis applique `local.json` par-dessus. Un article corrigé depuis la page locale s’affiche dans sa version corrigée ; le fichier d’origine garde le texte initial. **Retirer** enlève un ajout. **Revenir au texte d’origine** annule une correction.

La page de mise à jour ne fonctionne que par `./preview.sh`. Ouverte ailleurs, elle ne propose pas d’écrire les fichiers.

## Publier

Copier ce dossier tel quel vers l’hébergement (GitHub Pages, ou le dépôt déjà utilisé). `local.json`, `display.json` et `custom.css` partent avec le site : les ajouts enregistrés sont alors visibles à l’adresse publique.

La page `studio.html` est dans le dossier, mais rien ne la signale. Elle ne sert qu’en local.

## Contenu

Ne pas reformuler ces fichiers. Ils doivent rester identiques à ceux de `website`, y compris la ponctuation.

| Fichier | Contenu |
|---|---|
| `content/profile.json` | Nom, fonction, email, bureau, CV, photo, liens |
| `content/about.json` | Biographie, en anglais et en français |
| `content/research.json` | Domaines de recherche |
| `content/projects.json` | Projets. `"visible": false` masque un projet |
| `content/publications.json` | Publications |
| `content/talks.json` | Exposés |
| `content/teaching.json` | Enseignement. L’anglais et le français peuvent différer, par exemple le niveau d’un cours |
| `content/keywords.json` | Thèmes de l’accueil |
| `content/announcement.json` | Actualités |

```bash
./check-content.sh
```

La commande compare ces neuf fichiers à `../website/djahou-tognon.github.io/content`. Elle doit afficher `identique` pour chacun.

La photo est `assets/photo.png`. Le CV est `assets/cv.pdf`. Les figures de projets et d’articles sont sous `assets/projects/` et `assets/papers/`.

## Comment les pages sont composées

L’accueil porte le nom, la photo et la fonction. Sous le nom, l’email et les autres liens sont des boutons. CV et HAL y sont écrits en toutes lettres. Dans Contact, l’adresse mail reste écrite en toutes lettres. Viennent ensuite la biographie, les actualités, les thèmes, quelques publications et le contact.

Les publications ont une sous-navigation : tout, revue, prépublication, conférence, thèse, selon ce qui existe. Elles sont classées par année, de la plus récente à la plus ancienne. L’année n’est pas écrite devant l’entrée. Le numéro n’apparaît que dans Revue et Conférence. Le titre est suivi, à la ligne, des auteurs puis du support en italique. Les liens (HAL, DOI, arXiv, code, aperçu, résumé, BibTeX) sont sous cette ligne.

Les exposés ont la leur : tout, conférence, séminaire, atelier. Sous le titre : événement, mois et lieu, sans l’année et sans numéro. Les espaces déjà présents dans un lieu ou un nom d’événement sont conservés.

L’enseignement a la même sous-navigation, par année universitaire. Les boutons reprennent les années déjà écrites dans le contenu, de la plus récente à la plus ancienne. Une année ajoutée depuis Affichage apparaît dans cette liste.

L’aperçu d’un article (`paper.html`) et la page d’un projet reprennent le texte déjà rédigé, formules comprises.

## Fichiers du site

```
folio/
  index.html, research.html, publications.html, talks.html, teaching.html
  project.html, paper.html, studio.html
  css/site.css          mise en page
  css/custom.css        style enregistré depuis Affichage
  js/app.js             affichage des pages
  js/studio.js          page de mise à jour
  js/i18n.js            libellés de l’interface, en anglais et en français
  content/              textes et réglages
  assets/               photo, CV, figures
  preview.sh            serveur local
  check-content.sh      comparaison avec website
```

Il n’y a pas d’étape de compilation. Après un changement de `js/` ou de `css/site.css`, recharger la page. Les pages citent ces fichiers avec un numéro de version (`?v=`) pour éviter un ancien fichier gardé par le navigateur. `css/custom.css` n’a pas de numéro : un style enregistré depuis Affichage apparaît au rechargement.
