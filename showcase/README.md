# Café Noir — site vitrine

Site public de Café Noir, fidèle à la maquette validée : une **page d'accueil** d'un seul tenant
(Accueil · Notre histoire · Galerie · Contact, avec un aperçu du menu) et une **page Menu** dédiée
(`/menu`) atteinte par « Découvrir notre menu », « Voir le menu complet » et le lien Menu de
l'en-tête. C'est un projet **indépendant** de l'application de gestion : il vit dans ce dossier, a son
propre `package.json`, son propre build, et se déploie sur **une autre URL** que le système
(`cafe.cafenoir.tn`).

- **Logo** : texte « Café Noir » en serif (composant `src/components/Logo.tsx`, aucune image).
- **Typographie / couleurs** : titres en *Newsreader*, texte en *DM Sans*, vert menthe `#5DD3B2`
  sur fond crème (jeu de couleurs dans `src/index.css`).
- **Mode clair / sombre** : bouton lune/soleil dans l'en-tête ; choix mémorisé, sinon préférence de
  l'appareil.
- **Responsive** : mobile (menu hamburger), tablette et ordinateur.
- **Menu dynamique** : les produits viennent en direct du système via
  `GET https://cafe.cafenoir.tn/api/products` (route publique en lecture seule ; l'ancienne URL
  `/api/public/products` répond aussi — voir `../PUBLIC_PRODUCTS_API.md`). Le CRUD des produits se
  fait uniquement dans le système ; le site ne fait que lire.
  - Sur l'accueil, les cartes (Cafés, Boissons, Pâtisseries, Salés…) sont **les catégories du système**,
    avec leurs produits et prix en TND (jusqu'à 4 cartes, 5 produits chacune ; une seule catégorie =
    une carte large). « + N autres » ouvre la page Menu sur la bonne catégorie.
  - La page **Menu** (`/menu`) liste tous les produits par catégorie (recherche, filtres, descriptions,
    tailles avec prix, suppléments, photos).
  - Un produit ajouté, modifié, rendu indisponible ou supprimé dans le système apparaît/disparaît
    tout seul : le site se rafraîchit toutes les 30 secondes et au retour sur l’onglet.
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
Il n'y a pas de système de réservation : le bouton de l'en-tête est « Voir le menu complet ».

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
| Système de gestion | `cafe.cafenoir.tn` | Node/PM2 (`cnsystemmanagement`, port 3011) derrière nginx |
| Vitrine (menu client) | `test.cafenoir.tn` | nginx, fichiers statiques de `showcase/dist` |

La vitrine ne partage rien avec le processus du système : le navigateur du visiteur lit le catalogue
sur `https://cafe.cafenoir.tn/api/products` (route publique, lecture seule, CORS ouvert). Aucun produit
ni aucune catégorie n'est écrit dans le code de la vitrine.

Mise en ligne / mise à jour sur le serveur :

```bash
cd /var/www/CNsystemmanagement && git pull --ff-only
cd showcase
npm ci
VITE_API_BASE_URL=https://cafe.cafenoir.tn npm run build   # typecheck + build -> showcase/dist
```

nginx : la configuration exacte utilisée en production est `deploy/test.cafenoir.tn.nginx.conf`
(à installer dans `/etc/nginx/sites-available/test.cafenoir.tn`, puis
`sudo nginx -t && sudo systemctl reload nginx`). `deploy/nginx.conf.example` sert de modèle pour un
autre domaine (DNS + `sudo certbot --nginx -d <domaine>` à prévoir).

Le déploiement de la vitrine ne touche ni au processus PM2 du système, ni à sa base de données, ni
à son bloc nginx. Mettre à jour la vitrine ne demande aucun redémarrage : nginx sert les nouveaux
fichiers (index.html n'est jamais mis en cache ; les fichiers de `assets/` sont versionnés).

Retour arrière : restaurer la sauvegarde de la configuration nginx puis `sudo systemctl reload nginx`.
