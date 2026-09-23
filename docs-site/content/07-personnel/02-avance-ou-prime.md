---
title: "Ajouter une avance ou une prime"
description: "Enregistrer rapidement une avance ou une prime pour un employé, et comprendre son effet sur ce qu'il reste à payer."
category: "Personnel"
order: 2
---

## Où trouver ces boutons

Menu **Gestion du personnel → Suivi financier**. En haut de la page, deux boutons directs :
**+ Avance** et **+ Prime**.

## Ajouter une avance ou une prime, en quelques clics

1. Cliquez sur **+ Avance** (ou **+ Prime**).
2. Choisissez l'**employé** concerné.
3. Indiquez le **montant** et la **date**.
4. Un aperçu s'affiche immédiatement : il indique le **nouveau reste à payer** pour ce mois, pour
   que vous voyiez l'effet avant même de confirmer.
5. Cliquez sur **Confirmer**.

![Fenêtre "Ajouter une avance"](/screenshots/personnel-ajouter-une-avance-formulaire.png)

Si l'employé n'a pas encore de suivi financier pour le mois en cours, il est créé automatiquement
(avec son salaire de base repris depuis sa fiche employé) — vous n'avez rien à préparer à l'avance.

## Comment une avance affecte ce qu'il reste à payer

C'est le point important à bien comprendre : une **avance** est de l'argent déjà remis à l'employé
**avant** la paie normale — ce n'est donc pas un coût supplémentaire, c'est le même salaire, payé
plus tôt. En conséquence, elle **réduit d'autant** ce qu'il reste à régler ce mois-ci.

**Exemple concret.** Un employé a un salaire de base de 1000 DT. En cours de mois, il reçoit une
avance de 200 DT. Le système calcule alors :

- **Coût réel de l'employé ce mois** (ce que l'entreprise dépense au total, avances comprises) :
  toujours **1000 DT** — l'avance n'est pas un coût en plus.
- **Reste à payer** à la fin du mois : **800 DT**, puisque 200 DT ont déjà été remis.

Une **prime**, à l'inverse, s'ajoute à ce qui est dû — elle augmente le reste à payer, exactement
comme une augmentation ponctuelle du salaire de ce mois-là.

## Pourquoi cette distinction compte pour les rapports

Le **"Coût du personnel"** affiché sur le tableau de bord et dans les rapports de gestion utilise
toujours le **coût réel** (avances comprises), jamais le "reste à payer". Si une avance venait
diminuer ce chiffre, verser une avance en cours de mois donnerait l'impression trompeuse que la
masse salariale du café a baissé — alors que la totalité doit bel et bien être payée d'ici la fin
du mois. C'est pour cette raison que "reste à payer" (utile pour savoir combien régler maintenant)
et "coût du personnel" (utile pour savoir combien le café dépense réellement) sont deux chiffres
volontairement différents dans l'application.

## Saisie complète (plutôt que les boutons rapides)

Les boutons **+ Avance** / **+ Prime** ciblent toujours le **mois en cours**. Pour créer ou
corriger le suivi financier d'un mois passé, ou pour renseigner en une fois salaire de base,
avances, primes **et** retenues, utilisez plutôt **Nouveau suivi financier** — le formulaire
complet, avec le choix du mois/année concerné.

## Voir le détail complet d'un employé

Depuis la liste du suivi financier, cliquez sur **Consulter** pour voir, pour un employé et une
période donnés, le détail complet : salaire de base, avances, primes, retenues, montant déjà payé,
et le reste à payer qui en découle.

![Liste du suivi financier du personnel](/screenshots/personnel-suivi-financier-liste.png)

## Marquer un paiement comme effectué

Quand vous réglez effectivement un employé (le reste à payer, en général), ouvrez son suivi
financier, cliquez sur **Modifier**, et renseignez le **montant payé** ainsi que la **date de
paiement**. Le statut (Non payé / Partiellement payé / Payé) se met à jour automatiquement selon
ce montant comparé au reste à payer.
