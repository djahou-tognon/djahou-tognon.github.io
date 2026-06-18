# Guide — modifier le site vous-même

Pas de compilation : éditez les JSON, lancez `./preview.sh`, rechargez le navigateur.

## Structure

```
content/                  ← VOTRE CONTENU (éditez ici)
  profile.json            nom, email, CV, photo, contact
  about.json              bio EN + FR
  announcement.json       annonce sur l'accueil (actualités, talks, publications)
  research.json           grandes lignes de recherche (page Research)
  projects.json           projets de recherche (cartes + pages détail)
  publications.json       liste des publications
  talks.json              conférences
  teaching.json           enseignement

js/
  i18n.js                 libellés EN/FR (menu, boutons)
  site.js                 logique du site (ne pas toucher sauf besoin avancé)

css/style.css             apparence
```

## Commandes

```bash
./check-content.sh   # vérifie le JSON
./check-site.sh      # vérifie que le site est prêt pour GitHub Pages
./preview.sh         # les deux + http://localhost:8080
```

Site en ligne : **https://djahou-tognon.github.io**

Si une modification JSON (lien CODE, HAL, etc.) n'apparaît pas, rechargez avec **Ctrl+Shift+R**.
Le site recharge toujours les fichiers `content/*.json` à jour (pas de cache navigateur sur le contenu).

## Annonce sur l'accueil

Fichier : `content/announcement.json`.

Petit encart sur la page d'accueil pour signaler une actualité : texte libre, publication récente, conférence à venir, lien externe, etc.

### Activer / désactiver

```json
"enabled": true
```

Mettez `"enabled": false` pour masquer l'annonce — le contenu reste dans le fichier, prêt à être réactivé plus tard.

### Emplacement

```json
"placement": "about"
```

| Valeur | Affichage |
|--------|-----------|
| `"about"` | Sous la bio (section **About**) — **défaut** |
| `"contact"` | Sous les coordonnées (section **Contact**) |

### Structure complète

```json
{
  "enabled": true,
  "placement": "about",
  "en": {
    "title": "News",
    "items": [
      {
        "type": "text",
        "body": "I will visit INRIA Paris in March 2026."
      },
      {
        "type": "publication",
        "id": "neural-galerkin-2025",
        "prefix": "Preprint:"
      },
      {
        "type": "talk",
        "title": "My seminar talk",
        "event": "Seminar ANGE",
        "date": "March 2026",
        "location": "Paris",
        "href": "https://example.org/talk"
      },
      {
        "type": "link",
        "label": "Apply here",
        "href": "https://example.org/call",
        "text": "Open PhD position — deadline April 2026."
      }
    ]
  },
  "fr": {
    "title": "Actualités",
    "items": [
      {
        "type": "text",
        "body": "Visite à INRIA Paris en mars 2026."
      },
      {
        "type": "publication",
        "id": "neural-galerkin-2025",
        "prefix": "Prépublication :"
      },
      {
        "type": "talk",
        "title": "Mon exposé de séminaire",
        "event": "Séminaire ANGE",
        "date": "mars 2026",
        "location": "Paris",
        "href": "https://example.org/talk"
      },
      {
        "type": "link",
        "label": "Postuler ici",
        "href": "https://example.org/call",
        "text": "Thèse ouverte — date limite avril 2026."
      }
    ]
  }
}
```

### Types d'items

| Type | Champs | Usage |
|------|--------|--------|
| `text` | `body` | Texte libre. HTML autorisé (`<strong>`, `<a href=\"...\">`, etc.). Listes numérotées supportées (`1. …\\n2. …`). |
| `publication` | `id`, `prefix` (opt.) | Référence une publication par son `id` (depuis `publications.json`). Le titre est cliquable (lien HAL, DOI ou arXiv). |
| `talk` | `title`, `event`, `date`, `location`, `href` (opt.), `prefix` (opt.) | Conférence ou séminaire. Seuls `title` est obligatoire. |
| `link` | `href`, `label` ou `text` | Lien simple. Avec `label` + `text` : le libellé est le lien, `text` apparaît en sous-texte. |

- L'**ordre** des items dans `"items"` = l'ordre d'affichage.
- Le **titre** de l'encart (`"title"`) est traduit via les blocs `en` / `fr`.
- Pour une **publication**, l'`id` doit exister dans `publications.json` (ex. `"neural-galerkin-2025"`).
- Pour **désactiver** sans supprimer le fichier : `"enabled": false`.

Prévisualisez sur `http://localhost:8080` (section About ou Contact selon `"placement"`).

## Publications — badge HAL

Dans `content/publications.json`, utilisez `"hal"` (plus `"pdf"`) :

```json
{
  "id": "mon-article",
  "year": 2024,
  "title": "...",
  "authors": "...",
  "venue": "...",
  "category": "journal",
  "links": {
    "hal": "https://hal.science/hal-xxxxx",
    "doi": "https://doi.org/...",
    "code": ""
  }
}
```

Le site affiche un badge **HAL** (ou **DOI**, **CODE**, **SLIDES**, **VIDEO**, **POSTER**, **ABSTRACT**) — petites boîtes en majuscules, chacune avec sa couleur.

Pour afficher **CODE**, mettez l'URL dans `"links"."code"` (pas à la racine de la publication) :

```json
"links": {
  "hal": "https://inria.hal.science/hal-xxxxx",
  "code": "https://github.com/vous/projet"
}
```

Laissez `"code": ""` si aucun dépôt n'est disponible.

Catégories : `journal`, `preprint`, `proceeding`, `thesis`.

Les publications et conférences sont numérotées **à côté du titre**, séparées par un tiret (ex. `3 - Titre`). La catégorie **thesis** n'est pas numérotée.

## Grandes lignes de recherche

Fichier : `content/research.json`. Affiché en haut de la page **Research**, au-dessus des cartes de projets.

```json
{
  "en": {
    "themes": [
      {
        "title": "High-Performance Computing (HPC)",
        "body": "Development of parallel-in-time (PinT) algorithms..."
      },
      {
        "title": "Scientific Machine Learning (SciML)",
        "body": "Hybrid solvers combining machine learning..."
      }
    ]
  },
  "fr": {
    "themes": [
      {
        "title": "Calcul haute performance (HPC)",
        "body": "Développement d'algorithmes parallèles en temps..."
      }
    ]
  }
}
```

- L'ordre des blocs dans `"themes"` = l'ordre d'affichage.
- Les titres de section (**Research directions** / **Current projects**) sont traduits via `js/i18n.js`.
- Les **projets actuels** restent dans `projects.json` (`"visible": true`).

## Projets de recherche

Tout est dans **un seul fichier** : `content/projects.json` (un tableau).
Pour ajouter un projet, ajoutez simplement un bloc dans le tableau — autant que vous voulez.
L'ordre des blocs = l'ordre d'affichage (numérotés 01, 02, 03…).

Chaque projet :

```json
{
  "slug": "mon-projet",
  "visible": true,
  "en": {
    "title": "Project title",
    "summary": "Short text shown on the research card AND at the top of the project page.",
    "sections": [
      { "heading": "Goals", "body": "..." },
      {
        "heading": "Methods",
        "blocks": [
          { "type": "text", "body": "Paragraph with inline math: $E = mc^2$." },
          { "type": "math", "tex": "\\int_0^1 f(x)\\,dx = \\frac{1}{2}" },
          {
            "type": "image",
            "src": "assets/projects/mon-projet/schema.png",
            "alt": "Short description",
            "caption": "Optional caption under the figure.",
            "size": "medium"
          },
          {
            "type": "gallery",
            "size": "large",
            "images": [
              { "src": "assets/projects/mon-projet/fig-a.png", "alt": "Result A" },
              { "src": "assets/projects/mon-projet/fig-b.png", "alt": "Result B" }
            ],
            "caption": "Shared caption for both figures."
          },
          {
            "type": "video",
            "src": "https://www.youtube.com/watch?v=VIDEO_ID",
            "caption": "Optional caption."
          }
        ]
      }
    ],
    "relatedIds": ["publication-id-1", "publication-id-2"]
  },
  "fr": {
    "title": "Titre du projet",
    "summary": "Texte court affiché sur la carte ET en haut de la page projet.",
    "sections": [
      { "heading": "Objectifs", "body": "..." }
    ],
    "relatedIds": ["publication-id-1"]
  }
}
```

- La **carte** (page Research) utilise `title` + `summary`.
- La **page détail** s'ouvre via `project.html?p=mon-projet` (le `slug`).
- **Afficher / masquer sur Research** : `"visible": true` affiche la carte ; `"visible": false` la cache. La page détail reste accessible par lien direct (brouillon, partage privé).
- **Publications liées** : mettez l'`id` (depuis `publications.json`) dans `relatedIds`.
- Le `slug` doit être unique et sans espaces.

### Contenu riche dans les sections

Chaque section accepte soit un simple `"body"` (texte), soit un tableau `"blocks"`.
Les blocs s'affichent **dans l'ordre** où vous les écrivez dans le JSON.

| Type | Champs | Usage |
|------|--------|--------|
| `text` | `body` | Paragraphe. Formules inline avec `$...$` ou `\\(...\\)`. Listes numérotées ou à puces (voir ci-dessous). |
| `math` | `tex` | Formule centrée (LaTeX). Ex. `"\\int_0^1 f(x)\\,dx"`. |
| `image` | `src`, `alt`, `caption` (opt.), `size` (opt.) | Photo ou schéma dans `assets/projects/`. |
| `gallery` | `images`, `caption` (opt.), `size` (opt.) | 2 ou 3 images côte à côte, une seule légende. |
| `video` | `src`, `caption` (opt.) | Fichier local (`assets/projects/demo.mp4`) ou lien YouTube. |

#### Texte et formules mathématiques

- **Formule inline** dans un bloc `text` : entourez le LaTeX avec `$` :
  `"body": "Le coût vaut $J(u) = \\int_0^T L(x,u)\\,dt$."`
- **Formule centrée** : utilisez un bloc `math` avec le champ `tex` (sans `$`) :
  `"tex": "\\min_u J(u) \\quad \\text{s.t.} \\quad \\dot{x} = Ax + Bu"`
- Les **backslashes** LaTeX s'écrivent **doublés** dans le JSON : `"\\frac{1}{2}"`, `"\\int"`, `"\\alpha"`.
- Formules display alternatives dans le texte : `$$...$$` ou `\\[...\\]`.

#### Listes dans le texte

Dans un bloc `text` ou un simple `"body"`, vous pouvez écrire des listes :

**Liste numérotée** (une ligne par item) :

```json
"body": "1. Premier point\n2. Deuxième point\n3. Troisième point"
```

**Liste à puces** :

```json
"body": "- Point A\n- Point B\n- Point C"
```

**Texte + liste** (séparez par une ligne vide) :

```json
"body": "Contexte du projet.\n\n1. Objectif principal\n2. Objectif secondaire"
```

Vous pouvez aussi répartir chaque point dans un bloc `text` séparé ; le site regroupe automatiquement les blocs numérotés consécutifs en une seule liste.

#### Images

1. Copiez votre fichier dans `assets/projects/` (ex. `assets/projects/mon-projet/schema.png`).
2. Référencez-le dans le JSON avec un chemin relatif à la racine du site :

```json
{
  "type": "image",
  "src": "assets/projects/mon-projet/schema.png",
  "alt": "Description courte pour l'accessibilité",
  "caption": "Légende affichée sous l'image (optionnel).",
  "size": "large"
}
```

**Taille de l'image** — champ optionnel `"size"` :

| Valeur | Largeur max | Usage typique |
|--------|-------------|---------------|
| `"small"` | ~20 rem | Icône, schéma simple |
| `"medium"` | ~42 rem | **défaut** — figure standard |
| `"large"` | ~56 rem | Graphique détaillé |
| `"full"` | 100 % | Pleine largeur de la section |

Si `"size"` est omis, l'image utilise `"medium"`.

Formats conseillés : `.png`, `.jpg`, `.webp`, `.svg`.

#### Galeries (2 ou 3 images, une légende)

Pour aligner plusieurs figures avec **une seule légende** sous l'ensemble, utilisez le type `"gallery"` :

```json
{
  "type": "gallery",
  "size": "large",
  "images": [
    { "src": "assets/projects/mon-projet/fig-a.png", "alt": "Résultat A" },
    { "src": "assets/projects/mon-projet/fig-b.png", "alt": "Résultat B" }
  ],
  "caption": "Comparaison des deux méthodes sur le même cas test."
}
```

Pour **3 images**, ajoutez un troisième objet dans `"images"` (maximum 3).

- `"size"` accepte les mêmes valeurs que pour une image seule (`small`, `medium`, `large`, `full`).
- Chaque entrée de `"images"` doit avoir `"src"` et `"alt"`.
- Sur **mobile**, les images s'empilent verticalement ; sur **tablette**, une galerie de 3 images passe en grille 2 + 1.

Exemple avec texte et galerie :

```json
{
  "heading": "Résultats",
  "blocks": [
    { "type": "text", "body": "Les deux approches sont comparées ci-dessous." },
    {
      "type": "gallery",
      "size": "full",
      "images": [
        { "src": "assets/projects/benchmark.png", "alt": "Méthode A" },
        { "src": "assets/projects/filtering.png", "alt": "Méthode B" }
      ],
      "caption": "Erreur relative en fonction du nombre de capteurs."
    }
  ]
}
```

#### Vidéos

**YouTube** — collez l'URL complète :

```json
{
  "type": "video",
  "src": "https://www.youtube.com/watch?v=VIDEO_ID",
  "caption": "Démonstration de l'algorithme (optionnel)."
}
```

**Fichier local** — placez le fichier dans `assets/projects/` :

```json
{
  "type": "video",
  "src": "assets/projects/mon-projet/demo.mp4",
  "caption": "Simulation numérique."
}
```

Formats conseillés : `.mp4`, `.webm`.

#### Combiner texte, math, images et vidéos

Exemple de section mixte :

```json
{
  "heading": "Results",
  "blocks": [
    { "type": "text", "body": "The error satisfies $\\|u - u_h\\| \\leq C h^2$." },
    { "type": "math", "tex": "\\|A^{-1}\\|_2 \\leq \\frac{\\kappa(A)}{\\|A\\|_2}" },
    {
      "type": "image",
      "src": "assets/projects/parallel-in-time/convergence.png",
      "alt": "Convergence plot",
      "caption": "PinT speedup vs. serial time marching.",
      "size": "large"
    },
    {
      "type": "gallery",
      "images": [
        { "src": "assets/projects/parallel-in-time/run-a.png", "alt": "Run A" },
        { "src": "assets/projects/parallel-in-time/run-b.png", "alt": "Run B" },
        { "src": "assets/projects/parallel-in-time/run-c.png", "alt": "Run C" }
      ],
      "caption": "Three discretizations compared on the same problem."
    },
    {
      "type": "video",
      "src": "https://www.youtube.com/watch?v=VIDEO_ID",
      "caption": "Talk recording."
    }
  ]
}
```

Prévisualisez avec `./preview.sh`, ouvrez `project.html?p=votre-slug`, puis **Ctrl+Shift+R** pour éviter le cache.

<details><summary>Ancien format (référence)</summary>

```json
{
  "slug": "mon-projet",
  "title": "Titre du projet",
  "description": "Résumé court affiché sur la carte."
}
```

Page détaillée :

```json
"mon-projet": {
  "en": {
    "title": "Project title",
    "summary": "One-paragraph overview.",
    "sections": [
      { "heading": "Goals", "body": "..." }
    ],
    "relatedIds": ["mon-article"]
  },
  "fr": { ... }
}
```

</details>

## Enseignement

Fichier : `content/teaching.json`. Structure hiérarchique :

1. **Université + année** (en-tête)
2. **Semestre** (sous-titre)
3. **Cours** avec enseignant, volume horaire, département et niveau

```json
{
  "en": [
    {
      "university": "University of Example",
      "year": "2025–2026",
      "semesters": [
        {
          "label": "Fall semester",
          "courses": [
            {
              "course": "Numerical Analysis",
              "lecturer": "Dr. Jane Doe",
              "hours": "24h (problem sessions)",
              "department": "Department of Mathematics",
              "level": "Master 1"
            }
          ]
        },
        {
          "label": "Spring semester",
          "courses": [
            {
              "course": "Optimal Control",
              "lecturer": "Prof. John Smith",
              "hours": "30h",
              "department": "Department of Applied Mathematics",
              "level": "Master 2"
            }
          ]
        }
      ]
    }
  ],
  "fr": [
    {
      "university": "Université d'exemple",
      "year": "2025–2026",
      "semesters": [
        {
          "label": "Semestre 1",
          "courses": [
            {
              "course": "Analyse numérique",
              "lecturer": "Dr. Jane Doe",
              "hours": "24h (TD)",
              "department": "Département de mathématiques",
              "level": "Master 1"
            }
          ]
        }
      ]
    }
  ]
}
```

- **Ordre d'affichage** : l'ordre des blocs dans le tableau = l'ordre sur la page (du plus récent au plus ancien si vous le souhaitez).
- **Plusieurs universités** : ajoutez un bloc par établissement/année.
- **Plusieurs semestres** : ajoutez des entrées dans `"semesters"` (Semestre 1, Semestre 2, Année complète…).
- **Champs optionnels** : si un cours n'a pas de département, laissez la clé vide ou supprimez-la — le site n'affiche que les champs renseignés.
- Les libellés **Enseignant**, **Volume horaire**, etc. sont traduits automatiquement (EN/FR) via `js/i18n.js`.

## Ajouter une publication

Copiez un bloc existant dans `publications.json`, changez l'`id` (unique) et les champs.

## Langues

- Texte du contenu bilingue : champs `en` / `fr` dans les JSON
- Boutons et menus : `js/i18n.js`

## Publier sur GitHub Pages

Site cible : **https://djahou-tognon.github.io**

1. Créez le dépôt **`djahou-tognon.github.io`** sur GitHub (même nom que l'URL).
2. Poussez le projet sur la branche **`main`**.
3. **Settings → Pages** : source **Deploy from a branch**, branche **`main`**, dossier **`/ (root)`**.
4. Vérifiez le site après 1–2 minutes.

Fichiers utiles déjà présents :
- **`.nojekyll`** — GitHub Pages sert tous les fichiers tels quels (pas de traitement Jekyll).

```bash
git add .
git commit -m "Update content"
git push
```

Après chaque push sur `main`, le site se met à jour automatiquement.

```bash
git add . && git commit -m "Update content" && git push
```
