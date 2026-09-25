# Yei'ta vie 

## Rôles

La source de vérité est :

`public/data/roles.json`

Rôles actuels :
- Product Manager
- Product Designer

Les rôles ne sont pas définis au niveau des journeys. Ils sont portés par :
- les fiches (`cards[].roles`)
- les scénarios (`roles`)

Un journey est visible pour un rôle dès qu'au moins une de ses fiches est compatible avec ce rôle.

## UX

- choix du rôle sur la page d'accueil ;
- rôle conservé dans `localStorage` ;
- petit bandeau de changement de rôle sous le header dans les vues Parcours et Scénarios ;
- filtrage des fiches, des parcours et des scénarios selon le rôle ;
- badges PM / PD sur les fiches et scénarios ;
- les JSON sont chargés avec `cache: 'no-store'` pour éviter les anciennes versions de données en cache.

## Lancer en local

```bash
npm install
npm run dev
```

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` est inclus. Un push sur `main` relance automatiquement le build et le déploiement.
