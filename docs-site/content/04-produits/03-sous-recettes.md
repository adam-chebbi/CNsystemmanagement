---
title: "Créer une sous-recette"
description: "Préparer un composant réutilisable (une base, une sauce...) utilisé dans plusieurs produits."
category: "Produits"
order: 3
---

## À quoi sert une sous-recette

Une sous-recette est une préparation intermédiaire, faite à partir d'ingrédients (et éventuellement
d'autres sous-recettes), et qui sert elle-même d'ingrédient dans un ou plusieurs produits (par
exemple une pâte à crêpe utilisée par tous les produits "crêpe" du menu, ou un sirop maison). Elle
évite de ressaisir la même recette dans chaque produit qui l'utilise, et permet de calculer son
coût une seule fois — si son coût change (un ingrédient plus cher), tous les produits qui
l'utilisent se recalculent automatiquement.

## Où trouver cet écran

Menu **Gestion des produits → Sous-recettes**.

## Étapes

1. Cliquez sur **Ajouter une sous-recette**.
2. Donnez-lui un **nom** (obligatoire, doit être unique parmi les sous-recettes existantes).
3. Indiquez la **quantité produite** (obligatoire, ex : 1000) et l'**unité de rendement**
   (obligatoire, ex : "g" si la préparation se compte en grammes une fois prête) — c'est dans
   cette unité que le lot entier est costé et consommé par les produits qui l'utilisent.
4. Ajoutez les **ingrédients** (ou d'autres sous-recettes) qui la composent, chacun avec sa
   quantité et une unité compatible. Au moins un composant est requis.
5. Une description est optionnelle.
6. Enregistrez.

![Formulaire de création d'une sous-recette](/screenshots/produits-catalogue.png)

## Imbriquer une sous-recette dans une autre

Une sous-recette peut elle-même utiliser une autre sous-recette comme composant — pratique pour
des préparations à plusieurs étages (par exemple une "Base" utilisée dans une "Sauce", elle-même
utilisée dans un produit final). La seule limite : une sous-recette ne peut jamais se référencer
elle-même, ni directement ni via une chaîne d'imbrications — l'application détecte et bloque ce
cas de figure ("Référence circulaire détectée").

## Comprendre le coût

Le **coût du lot estimé** s'affiche en direct pendant la saisie (somme du coût de chaque
composant). Sur l'écran de vérification, un **coût par unité de rendement** est aussi calculé
(coût du lot ÷ quantité produite) — c'est exactement ce chiffre qui est utilisé quand un produit
consomme une partie de cette sous-recette dans sa propre fiche technique.

## Utiliser une sous-recette dans un produit

Une fois créée, une sous-recette apparaît dans la liste des ingrédients disponibles quand vous
composez la fiche technique d'un produit (voir
[Ajouter un nouveau produit](/ajouter-un-produit)) — vous pouvez l'utiliser exactement comme un
ingrédient normal.

## Supprimer une sous-recette

La liste des sous-recettes indique, pour chacune, son nombre d'**utilisations** (par des produits
ou par d'autres sous-recettes). Une sous-recette encore utilisée ne peut pas être supprimée — il
faut d'abord la retirer de tout ce qui la référence.
