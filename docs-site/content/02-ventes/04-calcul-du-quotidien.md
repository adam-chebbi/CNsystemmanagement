---
title: "Faire le calcul du quotidien (caisse)"
description: "Vérifier et confirmer, en fin de journée, que la caisse correspond bien aux ventes enregistrées."
category: "Ventes"
order: 4
featured: true
featuredOrder: 3
---

## À quoi sert cet écran

Le **Calcul du quotidien** est la vérification de fin de journée : on compare ce que le système
attend (les ventes enregistrées) avec ce qui est **réellement présent en caisse** (espèces
comptées, tickets restaurant, paiements carte). C'est là que se fait la réconciliation de caisse.

Menu **Gestion des ventes → Calcul du quotidien**.

## Vue d'ensemble de la page

En haut de la page, trois indicateurs affichent la situation actuelle : **Espèces**, **Carte
bancaire**, **Tickets restaurant**. En dessous, un calendrier/graphique permet de choisir la
journée à vérifier (par défaut, aujourd'hui).

> 📸 **Capture d'écran à ajouter :** vue d'ensemble de la page Calcul du quotidien, avec les 3
> indicateurs en haut et le calendrier de sélection de la journée.

## Saisir un chiffre d'affaires manuel (optionnel)

Si une partie du chiffre d'affaires du jour n'a pas été saisie comme vente classique (par exemple
un règlement encaissé directement), la section **Chiffres d'affaires saisis à la main** permet de
l'ajouter — cela vient alimenter les montants système en espèces/carte pour cette journée.

## Comprendre la section Espèces

Une fois une vérification confirmée pour la journée, le détail **coupure par coupure** (billets et
pièces comptés) s'affiche, avec le total. Tant qu'aucune vérification n'a été faite, cette section
indique qu'il faut lancer la vérification plus bas sur la page.

## Comprendre la section Tickets restaurant

Les tickets restaurant sont affichés avec leur **montant brut** (avant déduction) et leur
**montant net** (après la déduction habituelle, appliquée automatiquement) — c'est le montant net
qui correspond à ce qui est réellement récupéré.

## Comprendre l'analyse comptable HT / TVA

Une section dédiée affiche, pour la journée, la ventilation **hors taxes / TVA / TTC** des ventes,
détaillée par taux de TVA. Cette section est **uniquement informative** : elle sert à l'analyse
comptable, mais n'a aucun effet sur la vérification de caisse elle-même, qui reste toujours
raisonnée en TTC (l'argent réellement encaissé).

## Lancer la vérification de caisse

1. Faites défiler jusqu'à la section de vérification, en bas de page.
2. Comptez la caisse physiquement, puis saisissez le nombre de billets/pièces de chaque coupure —
   le total se calcule automatiquement au fur et à mesure.
3. Renseignez de la même façon les tickets restaurant et les paiements carte comptés.
4. Cliquez sur **Confirmer**.

> 📸 **Capture d'écran à ajouter :** formulaire de vérification avec la saisie coupure par
> coupure des espèces.

## Si les montants ne correspondent pas

C'est justement l'objectif de cet écran : repérer un écart entre ce que le système attend et ce
qui est réellement en caisse. Un écart n'empêche pas de confirmer — il est enregistré tel quel,
pour que l'équipe puisse ensuite comprendre d'où il vient (erreur de rendu de monnaie, vente non
saisie, etc.). Consultez l'historique en bas de page pour voir les vérifications précédentes et
repérer si l'écart est récurrent.
