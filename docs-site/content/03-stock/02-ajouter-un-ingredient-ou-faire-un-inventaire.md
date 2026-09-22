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

1. En haut de la page, choisissez le **type d'inventaire** : complet, par catégorie, ou par zone.
2. Cliquez sur **Lancer l'inventaire**.
3. Pour chaque produit concerné, saisissez le **stock réel compté** — l'écart avec le stock
   théorique (ce que le système pense avoir) s'affiche automatiquement à côté.
4. Une fois tous les produits comptés, cliquez sur **Vérifier l'inventaire**.
5. Sur l'écran de vérification, choisissez pour chaque écart : **Ajuster le stock au stock réel**
   (le système adopte le chiffre que vous avez compté) ou **Conserver le stock théorique** (l'écart
   est noté dans l'historique, mais le stock système n'est pas modifié).

> 📸 **Capture d'écran à ajouter :** écran de comptage d'inventaire, avec la colonne "Stock
> théorique" et "Stock réel" côte à côte, et l'écart calculé automatiquement.

Dans les deux cas, l'écart reste **visible dans l'historique des inventaires**, en bas de page —
rien n'est jamais silencieusement effacé.

## Ajouter un ou plusieurs nouveaux ingrédients

Pour créer un ingrédient qui n'existe pas encore dans le système (par exemple un nouveau produit
que vous venez d'acheter pour la première fois) :

1. Cliquez sur **Ajout inventaire ou ingrédient**, en haut de la page.
2. Remplissez la fiche du premier ingrédient : nom, catégorie, unité de stock, coût moyen d'achat,
   stock initial, seuil minimum, stock cible.
3. Pour ajouter un deuxième ingrédient dans la foulée, cliquez sur **Ajouter un ingrédient** — un
   nouveau formulaire vide apparaît en dessous, sans perdre le premier. Répétez autant de fois que
   nécessaire.
4. Une fois tous les ingrédients renseignés, cliquez sur **Enregistrer** — ils sont tous créés en
   même temps.

> 📸 **Capture d'écran à ajouter :** formulaire d'ajout d'ingrédient, avec plusieurs fiches
> empilées et le bouton "Ajouter un ingrédient" en bas.

> **Le numéro de lot est optionnel.** Si l'ingrédient est suivi par lot et que vous ne connaissez
> pas encore le numéro de lot au moment de la saisie, laissez le champ vide — un numéro est généré
> automatiquement, vous pourrez le corriger plus tard si besoin.

## Importer plusieurs ingrédients depuis un fichier

Si vous avez une longue liste de nouveaux ingrédients à créer d'un coup, il est plus rapide de
passer par **Stock → Import Excel/CSV** plutôt que de les saisir un par un.
