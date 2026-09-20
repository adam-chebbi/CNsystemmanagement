# Café Noir — site vitrine

Site public de Café Noir, en **une seule page** (Accueil · Menu · Notre histoire · Galerie · Contact),
fidèle à la maquette validée. C'est un projet **indépendant** de l'application de gestion : il vit dans
ce dossier, a son propre `package.json`, son propre build, et se déploie sur **une autre URL** que le
système (`cafe.cafenoir.tn`).

- **Logo** : texte « Café Noir » en serif (composant `src/components/Logo.tsx`, aucune image).
- **Typographie / couleurs** : titres en *Newsreader*, texte en *DM Sans*, vert menthe `#5DD3B2`
  sur fond crème (jeu de couleurs dans `src/index.css`).
- **Mode clair / sombre** : bouton lune/soleil dans l'en-tête ; choix mémorisé, sinon préférence de
  l'appareil.
- **Responsive** : mobile (menu hamburger), tablette et ordinateur.
- **Menu dynamique** : les produits viennent en direct du système via `GET /api/public/products`
  (voir `../PUBLIC_PRODUCTS_API.md`). Le CRUD des produits se fait uniquement dans le système ; le
  site ne fait que lire.
  - Les cartes (Cafés, Boissons, Pâtisseries, Salés…) sont **les catégories du système**, avec leurs
    produits et prix en TND (jusqu'à 4 cartes, 5 produits chacune ; une seule catégorie = une carte large).
  - « Voir le menu complet » ouvre tous les produits (recherche, filtres par catégorie, descriptions,
    tailles, suppléments, photos).
  - Un produit ajouté, modifié, rendu indisponible ou supprimé dans le système apparaît/disparaît
    tout seul : le site se rafraîchit toutes les minutes et au retour sur l'onglet.
  - Si le système a une photo pour un produit de la catégorie, elle remplace la photo par défaut de la carte.

## Photos

Les images sont dans `public/images/` : `hero.jpg`, `cafes.jpg`, `boissons.jpg`, `patisseries.jpg`,
`sales.jpg`, `story.jpg`, `ambiance.jpg`. **Ce sont des extraits basse résolution de la maquette** : pour
la mise en ligne, remplacez chaque fichier par la vraie photo **en gardant le même nom**.
Tailles conseillées : `hero` 1800×1000, `ambiance` 2000×700, `story` 1200×600, cartes 800×450.
La galerie (`GALLERY` dans `src/config/site.ts`) réutilise ces mêmes fichiers.

## Contenu à personnaliser

`src/config/site.ts` : adresse, téléphone, e-mail, horaires, liens sociaux (Instagram / Facebook /
TikTok : tant que le lien est vide, l'icône s'affiche sans lien), crédit du pied de page.
Le bouton « Réserver une table » appelle le numéro de téléphone.

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
