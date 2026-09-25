# Yei'ta vie

## Navigation

Le header expose désormais deux entrées principales :
- **Playground** : parcours et scénarios existants ;
- **Yekigai** : jeu de cartes pour les entretiens.

Le Yekigai est aussi accessible depuis la page d'accueil.

## Gameplay Yekigai

1. Choix du jeu : **Product Manager** ou **Product Designer**.
2. Tri instinctif des 12 cartes : « Ça me ressemble », « Ça dépend », « Pas vraiment moi ».
3. Choix forcé de **3 cartes fortes**.
4. Choix forcé de **2 cartes rejetées**.
5. Discussion guidée avec relances, signaux à observer et notes recruteur.
6. Synthèse finale copiable, sans score ni diagnostic de personnalité.

## Données

Le contenu Yekigai est entièrement piloté par JSON :

```text
public/data/yekigai/
├── index.json
├── product-manager.json
└── product-designer.json
```

Chaque deck contient 12 cartes avec :
- une affirmation ;
- un thème ;
- des relances de discussion ;
- des signaux à observer ;
- l'indication qu'une carte est partagée ou non entre les deux métiers.

Les parcours et scénarios Product Designer ajoutés après la V6 sont également inclus dans cette archive.

## Lancer en local

```bash
npm install
npm run dev
```

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` est inclus. Un push sur `main` relance automatiquement le build et le déploiement.
