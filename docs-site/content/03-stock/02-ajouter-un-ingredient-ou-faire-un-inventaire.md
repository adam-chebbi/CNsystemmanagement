---
title: "Ajouter un ingrédient ou faire un inventaire"
description: "Créer un ou plusieurs nouveaux ingrédients, ou lancer un inventaire pour ajuster le stock théorique au stock réel."
category: "Stock"
order: 2
featured: true
featuredOrder: 2
---

## Où trouver cet écran

Menu **Stock → Inventaires**. Cette page sert à deux choses différentes : **lancer un inventaire**
(compter le stock réel et corriger d'éventuels écarts) et **ajouter un nouvel ingrédient** au
système.

## Lancer un nouvel inventaire

1. Choisissez le **type d'inventaire** : **Complet** (tous les produits), **Par catégorie**
   (choisissez la catégorie), ou **Par zone** (choisissez Réserve principale ou Dépôt).
2. Indiquez qui **réalise** l'inventaire (employé, obligatoire).
3. Cliquez sur **Lancer l'inventaire**.
4. Pour chaque produit concerné, saisissez le **stock réel compté** — le **stock théorique** (ce
   que le système pense avoir, tous zones confondues sauf inventaire "Par zone") s'affiche à côté,
   avec l'**écart** calculé automatiquement en direct.
5. Une fois tous les produits comptés, cliquez sur **Vérifier l'inventaire**. L'écran de
   vérification affiche : le nombre de produits comptés, le nombre d'écarts détectés, et la valeur
   totale de l'écart (quantité en écart × coût moyen).
6. Choisissez comment traiter les écarts : **Ajuster le stock au stock réel** (le système adopte le
   chiffre que vous avez compté — le stock change réellement) ou **Conserver le stock théorique**
   (le stock système n'est pas modifié, l'écart est noté à titre indicatif uniquement).

![Formulaire de comptage d'inventaire](/screenshots/stock-inventaires-ajout-ingredient.png)

Dans les deux cas, l'écart reste **visible dans l'historique des inventaires**, en bas de page —
rien n'est jamais silencieusement effacé. Si l'inventaire n'est pas fait "Par zone", un ajustement
s'applique par convention à la **Réserve principale**.

## Ajouter un ou plusieurs nouveaux ingrédients

Pour créer un ingrédient qui n'existe pas encore dans le système (par exemple un nouveau produit
que vous venez d'acheter pour la première fois) :

1. Cliquez sur **Ajout inventaire ou ingrédient**, en haut de la page.
2. Remplissez la fiche du premier ingrédient :
   - **Nom de l'ingrédient*** — doit être différent de tout ingrédient déjà existant.
   - **Catégorie*** — Café & Boissons, Produits laitiers, Pâtisserie & Boulangerie, Emballages &
     Consommables, Sirops & Additifs, ou Épicerie.
   - **Unité de stock*** — l'unité dans laquelle ce produit se compte (kg, g, litre, unité...).
   - **Coût moyen d'achat (DT)*** — sert de base à toutes les valorisations (valeur du stock,
     coût matière des produits, valeur des pertes, écarts d'inventaire).
   - **Référence (SKU)** — optionnelle : si vous la laissez vide, une référence est générée
     automatiquement à partir du nom (ex : `ING-CAFE-ARABICA-1KG`).
   - **Stock initial** — un champ pour la Réserve principale, un pour le Dépôt (0 par défaut).
   - **Seuil minimum** — la quantité en dessous de laquelle ce produit sera signalé "à
     recommander" sur la page Stock.
   - **Stock cible** — le niveau visé lors d'un réassort (purement indicatif, ne déclenche pas
     d'alerte).
   - **Gestion par lot** (case à cocher, désactivée par défaut) — à cocher si ce produit doit être
     suivi par numéro de lot et date de péremption à chaque entrée en stock (voir
     [Gérer les lots et dates de péremption](/gerer-les-lots-et-peremption)).
3. Pour ajouter un deuxième ingrédient dans la foulée, cliquez sur **Ajouter un ingrédient** — un
   nouveau formulaire vide apparaît en dessous, sans perdre le premier. Répétez autant de fois que
   nécessaire.
4. Une fois tous les ingrédients renseignés, cliquez sur **Enregistrer** — ils sont tous créés en
   même temps.

> **Le numéro de lot est optionnel.** Si l'ingrédient est suivi par lot, vous ne le renseignez pas
> ici — il n'est demandé qu'au moment où vous enregistrez la première **entrée** de stock pour cet
> ingrédient (voir [Enregistrer un mouvement de stock](/enregistrer-un-mouvement-de-stock)), et
> même à ce moment-là il reste optionnel : un numéro est généré automatiquement si vous ne le
> connaissez pas encore.

## Importer plusieurs ingrédients depuis un fichier

Si vous avez une longue liste de nouveaux ingrédients à créer d'un coup, il est plus rapide de
passer par **Stock → Import Excel/CSV** plutôt que de les saisir un par un — le formulaire manuel
et l'import utilisent exactement les mêmes règles de validation, pour que les deux ne divergent
jamais.
