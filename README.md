# Suivi des projets architecturaux

Application de suivi des dossiers architecturaux. Les données sont enregistrées dans MongoDB et synchronisées entre les appareils après connexion avec le mot de passe partagé du cabinet.

## Déploiement sur Vercel

La base de données doit être créée sur MongoDB Atlas. Ne publiez jamais les identifiants MongoDB, le mot de passe du cabinet ou `JWT_SECRET` dans GitHub.

1. Créez une base MongoDB Atlas et copiez son URI de connexion.
2. Dans Vercel, importez le dépôt GitHub une première fois pour le backend. Définissez **Root Directory** sur `backend`, puis ajoutez ces variables d’environnement :
   - `MONGO_URL` : URI de connexion Atlas.
   - `DB_NAME` : par exemple `suivi_projets`.
   - `APP_PASSWORD` : mot de passe privé utilisé pour se connecter depuis les appareils.
   - `JWT_SECRET` : valeur aléatoire privée d’au moins 32 caractères.
   - `CORS_ORIGINS` : URL exacte du déploiement frontend, par exemple `https://suivi-projets-architecturaux.vercel.app`.
3. Déployez le backend et copiez son URL Vercel.
4. Créez un second projet Vercel depuis le même dépôt. Définissez **Root Directory** sur `frontend` et ajoutez `REACT_APP_BACKEND_URL` avec l’URL du backend, sans barre oblique finale.
5. Déployez le frontend. Après le premier déploiement, mettez l’URL frontend exacte dans `CORS_ORIGINS` sur le projet backend, puis redéployez le backend.
6. Connectez-vous avec `APP_PASSWORD`. Pour transférer d’anciennes données, importez le fichier de sauvegarde JSON dans **Paramètres & sauvegarde**.

Les variables sont à saisir dans **Vercel → Project → Settings → Environment Variables**. Configurez-les pour l’environnement **Production** et redéployez après toute modification.
