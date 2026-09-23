---
title: "Gérer les lots et dates de péremption"
description: "Suivre les produits par numéro de lot et repérer ce qui approche de la date de péremption."
category: "Stock"
order: 5
---

## Où trouver cet écran

Menu **Stock → Lots & péremptions**. Cette page est une page de **consultation** — un lot ne se
crée jamais directement ici : il se crée automatiquement lors d'un **mouvement d'entrée**, et les
sorties/transferts consomment ou déplacent un lot déjà existant. Voir
[Enregistrer un mouvement de stock](/enregistrer-un-mouvement-de-stock).

## Quels produits sont concernés

Seuls les produits marqués **"gestion par lot"** (réglage fait lors de la création du produit,
voir [Ajouter un ingrédient](/ajouter-un-ingredient-ou-faire-un-inventaire)) apparaissent
ici, avec pour chacun de leurs lots : le numéro de lot, la quantité restante, la zone, et la date
de péremption.

## Repérer ce qui approche de la péremption

Trois indicateurs en haut de page : **Lots suivis** (total), **Expiration proche**, **Lots
expirés**. Un lot est classé :

- **Expiré** — sa date de péremption est déjà passée.
- **Expiration proche** — il reste moins de jours que le **délai d'alerte** avant péremption (7
  jours par défaut — réglable dans [Paramètres généraux](/parametres-generaux), et ajustable
  temporairement rien que pour cette page via le champ "Délai d'alerte (jours)" en haut de
  l'écran).
- **Valide** — au-delà de ce délai.

![Liste des lots avec leur statut de péremption](/screenshots/stock-liste-produits.png)

Utilisez cette page en début de journée pour décider quoi utiliser en priorité (méthode "premier
arrivé, premier utilisé").

## Le numéro de lot est optionnel à la saisie

Quand vous enregistrez une entrée de stock pour un produit suivi par lot (voir
[Enregistrer un mouvement de stock](/enregistrer-un-mouvement-de-stock)), vous n'êtes pas obligé de
connaître le numéro de lot exact au moment de la saisie — laissez le champ vide et un numéro est
généré automatiquement (format `AUTO-AAAAMMJJ-XXXX`). Seule la **date de péremption** reste
obligatoire, puisque c'est elle qui permet le suivi.
