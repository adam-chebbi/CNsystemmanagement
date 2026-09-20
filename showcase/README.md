# Café Noir — site vitrine

Site public de Café Noir (accueil, menu, à propos). C'est un projet **indépendant** de l'application
de gestion : il vit dans ce dossier, a son propre `package.json`, son propre build, et se déploie sur
**une autre URL** que le système (`cafe.cafenoir.tn`).

- **Logo** : texte « Café Noir » (composant `src/components/Logo.tsx`, aucune image).
- **UI/UX** : mêmes couleurs (vert `#00A86B`), police (Plus Jakarta Sans) et cartes arrondies que le
  système, avec **mode clair / mode sombre** (bouton dans l'en-tête ; choix mémorisé, sinon
  préférence du téléphone/ordinateur).
- **Menu** : les produits viennent en direct du système via `GET /api/public/products`
  (voir `../PUBLIC_PRODUCTS_API.md`). Le CRUD des produits se fait uniquement dans le système ; le
  site ne fait que lire. Un produit créé, modifié, rendu indisponible ou supprimé dans le système
  apparaît/disparaît sur le menu au prochain chargement (cache navigateur de 60 s max).

## Développement

```bash
cd showcase
npm install
npm run dev        # http://localhost:3100
```

Le serveur de dev redirige `/api` vers le système local (`http://localhost:4000`, lancé avec
`npm run server:dev` à la racine). Pour viser un autre serveur : `SHOWCASE_DEV_API_TARGET=… npm run dev`.

## Build

```bash
cd showcase
npm run build      # typecheck + build → showcase/dist
```

En production, le site appelle l'API par URL absolue : par défaut `https://cafe.cafenoir.tn`
(défini dans `src/config/site.ts`). Pour changer : `VITE_API_BASE_URL=https://autre.domaine npm run build`.

## Contenu à personnaliser

`src/config/site.ts` : adresse, téléphone, e-mail, horaires. Les lignes téléphone / e-mail / horaires
n'apparaissent que lorsqu'elles sont renseignées (vides pour l'instant).

## Déploiement — sur une URL différente du système

| Site | URL | Servi par |
| --- | --- | --- |
| Système de gestion | `cafe.cafenoir.tn` | Node/PM2 (`cnsystemmanagement`) derrière nginx |
| Vitrine | un **autre** domaine ou sous-domaine (ex. `cafenoir.tn`) | nginx, fichiers statiques de `showcase/dist` |

1. **DNS** : créer l'enregistrement A/AAAA du domaine choisi vers l'IP du serveur.
2. **Build** sur le serveur (ou en local puis copie de `dist/`) :
   ```bash
   cd /var/www/CNsystemmanagement/showcase
   npm ci && npm run build
   ```
3. **nginx** : copier `deploy/nginx.conf.example` dans `/etc/nginx/sites-available/`, remplacer le
   `server_name`, activer le site, puis `sudo nginx -t && sudo systemctl reload nginx`.
4. **HTTPS** : `sudo certbot --nginx -d <domaine>`.

Le déploiement de la vitrine ne touche ni au processus PM2 du système, ni à sa base de données, ni
à son bloc nginx. Mettre à jour la vitrine = `git pull && cd showcase && npm ci && npm run build`
(aucun redémarrage nécessaire, nginx sert simplement les nouveaux fichiers).
