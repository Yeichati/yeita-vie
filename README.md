# Yei'ta vie

Playground consultant PM construit avec React + Vite.

## Développement local

```bash
npm install
npm run dev
```

Vite affichera l'URL locale, généralement `http://localhost:5173`.

## Build de production

```bash
npm run build
npm run preview
```

Le build statique est généré dans `dist/`.

## Déployer sur Vercel

1. Pousse le dossier dans un repo GitHub/GitLab/Bitbucket.
2. Importe le repo dans Vercel.
3. Vercel détecte Vite automatiquement.
4. Déploie.

Le fichier `vercel.json` décrit aussi explicitement le build et le dossier de sortie.

## Organisation des données

```text
public/data/
├── app.json
└── journeys/
    ├── index.json
    └── start-mission.json
```

### `app.json`

Contient les textes globaux de l'interface : nom, hero, labels, recherche, sidebar, etc.

### `journeys/index.json`

Manifeste minimal des journeys à charger :

```json
{
  "journeys": [
    "start-mission.json",
    "un-autre-journey.json"
  ]
}
```

### Un fichier par journey

Chaque journey possède son propre JSON avec :

- son titre et sous-titre ;
- son bloc d'introduction `starter` ;
- ses fiches ;
- les liens entre fiches via `next`.

Exemple :

```json
{
  "id": "mon-journey",
  "title": "Mon parcours",
  "subtitle": "Description",
  "starter": {
    "mark": "→",
    "title": "Je commence où ?",
    "text": "Texte éditorial entièrement modifiable depuis la donnée."
  },
  "cards": []
}
```

Pour ajouter un journey : crée son fichier JSON puis ajoute simplement son nom dans `journeys/index.json`.

## Philosophie

Le code gère le rendu et les interactions. Le contenu éditorial reste dans les fichiers JSON afin de pouvoir faire évoluer le playground sans modifier les composants React.
