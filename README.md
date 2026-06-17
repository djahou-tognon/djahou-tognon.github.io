# djahou-tognon.github.io

Site académique statique — voir **[GUIDE.md](GUIDE.md)** pour modifier le contenu.

**En ligne :** [https://djahou-tognon.github.io](https://djahou-tognon.github.io)

## Prévisualiser en local

```bash
./check-content.sh   # vérifie les JSON
./preview.sh         # http://localhost:8080
```

## Contenu (`content/`)

| Fichier | Rôle |
|---------|------|
| `profile.json` | Nom, email, CV, photo, liens |
| `about.json` | Bio EN / FR |
| `projects.json` | Projets (cartes Research + pages détail) |
| `publications.json` | Publications |
| `talks.json` | Conférences |
| `teaching.json` | Enseignement |

## Mettre en ligne (GitHub Pages)

1. Créez un dépôt GitHub nommé exactement **`djahou-tognon.github.io`**
2. Poussez ce dossier sur la branche **`main`**
3. Sur GitHub : **Settings → Pages → Build and deployment**
   - Source : **Deploy from a branch**
   - Branch : **`main`** / **`/ (root)`**
4. Attendez 1–2 minutes, puis ouvrez [https://djahou-tognon.github.io](https://djahou-tognon.github.io)

Pas de compilation : HTML + JSON servis tels quels. Le fichier `.nojekyll` évite que GitHub Pages ignore certains fichiers.

```bash
git add .
git commit -m "Publish site"
git remote add origin https://github.com/djahou-tognon/djahou-tognon.github.io.git
git push -u origin main
```

## Code

| Fichier | Rôle |
|---------|------|
| `js/i18n.js` | Libellés EN / FR |
| `js/site.js` | Chargement et affichage |
| `css/style.css` | Styles |
