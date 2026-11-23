# Miahso_ Dashboard

Tableau de bord perso pour suivre mes réseaux (TikTok, Instagram, 2 chaînes YouTube) : abonnés et objectifs, rythme de publication, calendrier, banque d'idées et analyse de ce qui marche.

PWA installable sur téléphone, tablette et ordinateur. Aucun serveur, aucun build : des fichiers statiques servis par GitHub Pages.

## Mise en ligne (GitHub Pages)

1. Dépôt > **Settings** > **Pages**.
2. **Source** : *Deploy from a branch*, branche `main`, dossier `/ (root)`, puis **Save**.
3. Après ~1 minute : `https://sarahtestelin.github.io/infdashboard/`

## Installer l'app

- **iPhone / iPad** : Safari > Partager > *Sur l'écran d'accueil*.
- **Android** : Chrome > menu > *Installer l'application*.
- **Ordinateur** : Chrome / Edge > icône d'installation dans la barre d'adresse.

## V1 (actuelle)

- Données stockées sur l'appareil (localStorage) + export / import JSON pour les transférer.
- Abonnés et objectifs par compte (modifiables en touchant la carte).
- Rythme de la semaine, calendrier des posts avec vues / likes / commentaires.
- Banque d'idées, bouton « Planifier ».
- Analyse : types de contenu, jours, comptes ; conseils automatiques.

## Prochaines étapes

- V2 : connexion + synchro entre appareils (Supabase).
- V3 : YouTube automatique (API officielle), import CSV TikTok / Instagram, lecture de Google Agenda.
