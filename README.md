# Yei'ta vie — V5 complète

Application React + Vite avec :
- 4 parcours ;
- 1 scénario préfabriqué ;
- contenus stockés en JSON ;
- scénarios construits à partir de références `journey + cardId` ;
- compatibilité GitHub Pages et Vercel.

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée par Vite, généralement `http://localhost:5173`.

## Build

```bash
npm run build
```

Le build est généré dans `dist/`.

## GitHub Pages

Le workflow est déjà présent dans :

`.github/workflows/deploy-pages.yml`

Dans GitHub :
1. `Settings` → `Pages`
2. Source : `GitHub Actions`
3. Push sur `main`

Le workflow build et déploie automatiquement l'application.

## Ajouter un parcours

1. Ajouter `public/data/journeys/mon-parcours.json`
2. Ajouter `mon-parcours.json` dans `public/data/journeys/index.json`

## Ajouter un scénario

1. Ajouter `public/data/scenarios/mon-scenario.json`
2. Ajouter le fichier dans `public/data/scenarios/index.json`
3. Référencer les fiches existantes :

```json
{
  "journey": "start-mission.json",
  "cardId": "mandate"
}
```

Le contenu de la fiche reste uniquement dans le fichier du parcours source.
