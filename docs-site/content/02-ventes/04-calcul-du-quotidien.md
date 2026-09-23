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
bancaire**, **Tickets restaurant**. En dessous, un calendrier façon "carte de contributions"
(8 derniers mois) permet de choisir la journée à vérifier en cliquant dessus (par défaut,
aujourd'hui).

![Vue d'ensemble du Calcul du quotidien](/screenshots/ventes-calcul-du-quotidien.png)

### D'où viennent les 3 indicateurs du haut

Ce ne sont pas de simples totaux de la journée : ils fonctionnent comme une vraie caisse qui
repart de zéro à chaque vérification confirmée. Le point de départ est le dernier comptage
confirmé ; à partir de là, chaque vente payée ou chiffre d'affaires saisi à la main **ajoute**, et
chaque dépense approuvée ou facture fournisseur payée **retire**. Le compteur "Tickets
restaurant" reste basé sur le dernier comptage physique (on ne peut connaître le nombre réel de
tickets qu'en les comptant), seul son montant net évolue entre deux vérifications.

## Saisir un chiffre d'affaires manuel (optionnel)

Si une partie du chiffre d'affaires du jour n'a pas été saisie comme vente classique (par exemple
un règlement encaissé directement), la section **Chiffres d'affaires saisis à la main** permet de
l'ajouter — cela vient alimenter les montants système en espèces/carte pour cette journée.

## Comprendre la section Espèces

Une fois une vérification confirmée pour la journée, le détail **coupure par coupure** (billets et
pièces comptés) s'affiche, avec le total. Tant qu'aucune vérification n'a été faite, cette section
indique qu'il faut lancer la vérification plus bas sur la page.

## Comprendre la section Tickets restaurant

Les tickets restaurant sont affichés avec leur **montant compté** (brut) et leur **montant net**
(après une déduction de 10 %, appliquée automatiquement — ce taux est réglable dans
[Paramètres généraux](/parametres-generaux) si votre émetteur applique un taux différent) — c'est
le montant net qui correspond à ce qui est réellement récupéré par le café. Depuis peu, un ticket
resto peut être réglé soit en liquide, soit par carte selon l'émetteur : cette section n'attend
donc plus de coupure par coupure, seulement le montant compté.

## Comprendre l'analyse comptable HT / TVA

Une section dédiée affiche, pour la journée, la ventilation **hors taxes / TVA / TTC** des ventes,
détaillée par taux de TVA. Cette section est **uniquement informative** : elle sert à l'analyse
comptable, mais n'a aucun effet sur la vérification de caisse elle-même, qui reste toujours
raisonnée en TTC (l'argent réellement encaissé).

## Lancer la vérification de caisse

1. Cliquez sur **Lancer une vérification**, en bas de page (le panneau est replié par défaut).
2. **Comptage des espèces** : comptez la caisse physiquement, puis saisissez le nombre de billets
   et pièces pour chaque coupure tunisienne (de 50 millimes à 50 DT) — le total "Compté" se calcule
   automatiquement et se compare en direct au total "Système" attendu.
3. **Tickets restaurant** : saisissez le montant compté — le montant net (après déduction) est
   affiché et comparé au montant système.
4. **Carte bancaire** : saisissez le montant vérifié (pré-rempli avec le montant système comme
   point de départ) et, si vous le souhaitez, le nombre de paiements comptés.
5. Une **synthèse** récapitule, pour chaque catégorie (Espèces, Ticket resto, Carte bancaire) :
   Système / Réel vérifié / Différence, plus un total général.
6. Cliquez sur **Confirmer la vérification**.

## Si les montants ne correspondent pas

C'est justement l'objectif de cet écran : repérer un écart entre ce que le système attend et ce
qui est réellement en caisse. Dès qu'une différence dépasse 0,01 DT sur une catégorie, une
**justification** devient obligatoire pour cette catégorie avant de pouvoir confirmer — un champ
de texte où vous expliquez la cause probable (erreur de rendu de monnaie, vente non saisie,
etc.). Un écart n'empêche jamais de confirmer : il est enregistré tel quel, avec sa justification,
pour que l'équipe puisse ensuite comprendre d'où il vient. Consultez l'historique en bas de page
pour voir les vérifications précédentes et repérer si l'écart est récurrent.

## Une vérification déjà confirmée ne se modifie jamais

Si vous relancez une vérification pour une journée déjà vérifiée, la nouvelle vérification
s'ajoute à l'historique sans effacer la précédente — chaque vérification confirmée reste
consultable telle qu'elle a été faite, l'historique en bas de page n'est jamais réécrit.
