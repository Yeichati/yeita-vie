# Yei'ta vie — V3

Playground consultant PM construit avec React + Vite.

## Développement local

```bash
npm install
npm run dev
```

## Build de production

```bash
npm run build
npm run preview
```

Le build est généré dans `dist/`.

## GitHub Pages

La V3 est prête pour un repository GitHub nommé `yeita-vie`.

1. Pousse le contenu du projet sur la branche `main`.
2. Dans GitHub : **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. À chaque push sur `main`, `.github/workflows/deploy-pages.yml` construit puis publie le dossier `dist`.

La configuration Vite utilise des chemins relatifs (`base: './'`), donc les assets et les JSON fonctionnent sous `https://<user>.github.io/yeita-vie/` sans casser un déploiement à la racine sur Vercel.

## Vercel

Importe simplement le repository. Vercel détectera Vite ; le fichier `vercel.json` reste inclus.

## Organisation des données

```text
public/data/
├── app.json
└── journeys/
    ├── index.json
    └── start-mission.json
```

Chaque journey reste dans son propre JSON. `journeys/index.json` contient uniquement la liste des fichiers à charger.

Le contenu éditorial reste dans les JSON ; React gère seulement l'affichage et les interactions.
