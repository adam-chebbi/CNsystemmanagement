---
title: "Créer une commande d'achat"
description: "Passer commande auprès d'un fournisseur et suivre sa réception."
category: "Achats"
categoryIcon: "shopping-cart"
categoryOrder: 5
order: 1
---

## Où trouver cet écran

Menu **Gestion des achats → Achats et acquisitions**.

## Créer la commande

1. Cliquez sur **Ajouter l'achat**.
2. Choisissez le **fournisseur** (obligatoire) — s'il n'existe pas encore, cliquez sur
   **+ Nouveau fournisseur** juste à côté pour le créer sans quitter cet écran (nom, matricule
   fiscal, téléphone, e-mail, adresse) ; il est automatiquement sélectionné pour la commande en
   cours.
3. Renseignez la **date d'achat** (obligatoire, aujourd'hui par défaut) et, si vous la connaissez,
   la **date de livraison prévue** (optionnelle, purement informative).
4. Choisissez qui a **passé la commande** (employé, obligatoire).
5. Ajoutez une ligne par produit commandé : **produit**, **quantité** (supérieure à 0) et **prix
   unitaire** (obligatoires). Un même produit ne peut pas apparaître deux fois dans la commande.
6. Une note libre est optionnelle. Enregistrez — la commande est créée avec le statut
   **Brouillon**.

![Liste des commandes d'achat, avec leur statut](/screenshots/achats-liste-commandes.png)

## Le prix se pré-remplit tout seul

Dès que vous choisissez un produit, si le champ prix unitaire est encore vide, l'application le
pré-remplit avec le **dernier prix payé à ce fournisseur précis pour ce produit précis** — ou, à
défaut d'historique, avec le coût moyen actuel du produit. C'est pourquoi il vaut mieux choisir le
**fournisseur avant les produits** : le prix proposé sera le bon dès le départ.

## Faire évoluer le statut d'une commande

Une commande passe par plusieurs statuts, dans cet ordre logique : **Brouillon** → **Commandée** →
**Reçue** (ou **Partiellement reçue** en cas de réception incomplète), avec la possibilité
d'**Annuler** à tout moment tant qu'elle n'est pas terminée. Changez le statut depuis la liste des
commandes. Seule une commande encore en **Brouillon** peut être modifiée ou supprimée — une fois
passée à "Commandée", il n'est plus possible que de l'annuler.

## Réceptionner une commande

Quand la marchandise arrive, ouvrez la commande et cliquez sur **Ajouter une réception** :

1. Indiquez la **date de réception**, la **zone** de stockage (Réserve principale ou Dépôt) et
   qui a **réceptionné**.
2. Pour chaque ligne pas encore totalement reçue, saisissez la **quantité reçue** — elle ne peut
   jamais dépasser ce qu'il reste à recevoir sur cette ligne.
3. Confirmez.

Chaque quantité reçue **augmente le stock immédiatement**, exactement comme une entrée de stock
manuelle. Une **réception partielle est possible** : vous pouvez réceptionner une partie de la
commande aujourd'hui et le reste plus tard, en plusieurs fois si besoin — la commande passe alors
au statut **Partiellement reçue**, et ne repasse à **Reçue** que lorsque tout a été livré. Le
tableau de la commande affiche côte à côte, ligne par ligne, la quantité **Commandée** et la
quantité **Reçue**, avec un code couleur (vert = complet, orange = partiel, gris = rien reçu).

![Écran de réception d'une commande](/screenshots/achats-liste-commandes.png)

Toutes les réceptions passées d'une commande restent visibles dans son détail, avec leur date,
zone et auteur.
