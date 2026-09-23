---
title: "Gérer les variantes et les extras"
description: "Ajouter des tailles/formats (variantes) et des suppléments (extras) à un produit."
category: "Produits"
order: 2
---

Ces deux sections se trouvent dans le formulaire **Ajout produits** (voir
[Ajouter un nouveau produit](/ajouter-un-produit)), sous la fiche technique.

## Variantes — les variations du produit (taille, format...)

Une variante représente une variation du produit lui-même : par exemple "Grande" pour un café, ou
"33cl" pour une boisson, chacune avec son propre supplément de prix par rapport au prix de base.

1. Dans la section **Variantes**, cliquez sur **Ajouter une variante**.
2. Donnez-lui un **nom** (ex : "Grande", "Sans sucre").
3. Indiquez le **supplément de prix** en dinars, s'il y en a un (laissez à 0 s'il n'y en a pas).
4. Répétez pour chaque variante proposée.

Les variantes sont optionnelles — un produit reste parfaitement vendable sans aucune variante.
Une variante n'a pas besoin d'être définie sur tous les produits : elle est propre à celui pour
lequel vous la créez (par exemple les tailles "Petit/Moyen/Grand" saisies sur un café n'apparaissent
pas sur un croissant).

## Extras — les suppléments optionnels (chantilly, shot en plus...)

Un extra est un ajout optionnel au produit, partagé par tous les produits (une fois créé, un
extra comme "Chantilly" peut être proposé sur n'importe quel produit, pas seulement celui pour
lequel il a été créé la première fois).

**Utiliser un extra déjà existant :** dans la section **Extras / suppléments**, cliquez simplement
sur son nom pour le sélectionner pour ce produit (il apparaît en vert quand il est sélectionné).

**Créer un tout nouvel extra :** s'il n'existe pas encore dans la liste, renseignez son nom et son
prix dans le mini-formulaire **Créer un nouvel extra**, puis cliquez sur **Ajouter** — il est créé
dans le catalogue partagé et sélectionné automatiquement pour ce produit, sans avoir à quitter la
page.

![Sections Variantes et Extras du formulaire produit](/screenshots/produits-ajout-variantes-extras.png)

## Variante ou extra : comment choisir

- Une **variante** est une **variation du produit lui-même** : on n'en choisit en général qu'une
  seule par vente (par exemple une seule taille), et elle est propre à ce produit (stockée avec
  lui, pas partagée).
- Un **extra** est un **ajout optionnel et cumulable** : on peut en choisir plusieurs à la fois
  (chantilly *et* shot supplémentaire), et il vit dans un catalogue partagé par tous les produits
  — le créer ou le modifier une fois suffit pour qu'il soit disponible partout.

## Gérer le catalogue des extras indépendamment d'un produit

Pour renommer, modifier le prix ou supprimer un extra (plutôt que d'en créer un nouveau depuis le
formulaire produit), allez dans **Gestion des produits → Catalogue → Suppléments**. Un extra ne
peut pas être supprimé tant qu'il est utilisé par au moins un produit — on doit d'abord le retirer
de chaque produit qui l'utilise.
