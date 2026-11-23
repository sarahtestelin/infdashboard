# Mise en route complète

Tout est gratuit. Compte une dizaine de minutes pour la synchro, autant pour YouTube.

## 1. Synchro entre appareils (Supabase)

1. Crée un compte sur https://supabase.com puis **New project** (nom : `miahso`, choisis une région en Europe, note le mot de passe de la base).
2. Dans le projet : **SQL Editor** > **New query**, colle le contenu de `supabase.sql`, clique sur **Run**.
3. **Authentication** > **Providers** > **Email** : désactive **Confirm email** (sinon tu devras cliquer sur un lien de confirmation à la création du compte), puis **Save**.
4. **Project Settings** > **API** (ou **API Keys**) : copie
   - **Project URL** (`https://xxxx.supabase.co`),
   - la clé **anon / publishable** (publique, faite pour être visible).
5. Dans l'app : **Réglages** > colle l'URL et la clé > **Enregistrer** > **Créer le compte** (e-mail + mot de passe).
6. Sur chaque autre appareil : ouvre l'app > **Réglages** > colle les mêmes URL et clé > **Se connecter**.

Astuce : pour ne pas ressaisir l'URL et la clé sur chaque appareil, mets-les dans `config.js` puis `git push`. Ces deux valeurs peuvent être publiques : tes données sont protégées par ton e-mail et ton mot de passe.

Comment ça marche : chaque changement est envoyé dans le cloud au bout d'une seconde et demie. Si tu modifies sur deux appareils en même temps, la version la plus récente gagne. Ne touche pas aux deux sans attendre que le point en bas du menu soit vert.

## 2. YouTube automatique

1. https://console.cloud.google.com : crée un projet (`miahso`).
2. **APIs & Services** > **Library** > cherche **YouTube Data API v3** > **Enable**.
3. **APIs & Services** > **Credentials** > **Create credentials** > **API key**.
4. Clique sur la clé > **Application restrictions** : *Websites* et ajoute `https://sarahtestelin.github.io/*`. **API restrictions** : *YouTube Data API v3*. **Save**.
5. Dans l'app : **Réglages** > colle la clé, et le @nom (ou le lien) de chacune de tes deux chaînes > **Enregistrer** > **Synchroniser maintenant**.

L'app resynchronise ensuite toute seule à l'ouverture (au plus toutes les 6 heures). Tes vidéos arrivent en catégorie « Autre » : change-la dans la fiche pour alimenter l'analyse.

## 3. TikTok et Instagram (CSV)

- **TikTok** : TikTok Studio > Analyses > Contenu > Télécharger les données.
- **Instagram** : Meta Business Suite > Statistiques > Exporter les données.

Dans l'app : **Réglages** > **Choisir un fichier CSV**, vérifie les colonnes proposées, valide. Réimporter le même fichier met à jour les chiffres sans créer de doublons.

## 4. Mise en ligne

```
git add . && git commit -m "Mise à jour" && git push
```

GitHub Pages republie en une à deux minutes.
