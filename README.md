# Miahso_ Dashboard

Tableau de bord perso de création de contenu (TikTok, Instagram, 2 chaînes YouTube), installable sur téléphone, tablette et ordinateur. Aucun serveur à gérer : des fichiers statiques sur GitHub Pages, et une base Supabase gratuite pour la synchro.

## Fonctions

- **Analyse** : vues, engagement, abonnés gagnés, meilleur jour, régularité, ce qui marche / ne marche pas par plateforme.
- **Stratégie** : banque d'idées, calendrier en pipeline / mois / liste.
- **Veille** : créatrices à suivre, inspirations, sujets tendance avec suivi des tests, revue hebdomadaire.
- **À faire maintenant** : rappels automatiques sur l'accueil.
- **Réglages** : synchro entre appareils, YouTube automatique, import CSV TikTok / Instagram, installation.

## Mise en ligne

Settings > Pages > branche `main`, dossier `/ (root)`. Adresse : `https://sarahtestelin.github.io/infdashboard/`.

Voir **SETUP.md** pour la synchro, YouTube et l'import CSV.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `style.css` | Page et design |
| `app.js` | Pages, calculs, formulaires |
| `extras.js` | Synchro Supabase, YouTube, import CSV, réglages |
| `config.js` | URL et clé Supabase (facultatif) |
| `supabase.sql` | Table et règles de sécurité |
| `sw.js`, `manifest.webmanifest`, `*.png` | Installation et mode hors-ligne |
