---
title: "Saisir une vente manuellement"
description: "Ajouter une ou plusieurs ventes à la main, ticket par ticket ou par quantités vendues."
category: "Ventes"
categoryIcon: "receipt"
categoryOrder: 2
order: 1
featured: true
featuredOrder: 1
---

## Où trouver cet écran

Menu **Gestion des ventes → Ajout manuel des ventes**.

## Pourquoi deux modes de saisie différents

En arrivant sur l'écran, l'application vous demande de choisir un mode — il n'y a pas de mode par
défaut, car les deux répondent à des besoins différents :

- **Par tickets** reproduit la façon dont une vente se passe réellement en salle : un client, une
  commande, un mode de règlement. C'est le mode le plus précis, à utiliser dès que vous pouvez
  saisir chaque vente au moment où elle a lieu.
- **Par quantités vendues** est fait pour les moments où saisir chaque ticket un par un n'est pas
  réaliste — par exemple pour rattraper toute une journée d'un coup, ou si votre caisse ne
  distingue pas les ventes une par une et ne vous donne que des totaux par produit en fin de
  journée. Vous indiquez juste combien d'unités de chaque produit sont parties, puis vous
  contrôlez que l'argent encaissé correspond.

Vous pouvez changer de mode à tout moment via le bouton **Changer de mode**, en haut de l'écran.

## Mode "Par tickets" — pour saisir chaque vente séparément

![Mode "Par tickets" de la saisie manuelle des ventes](/screenshots/ventes-saisie-manuelle-mode-tickets.png)

### Informations générales (une seule fois, pour toute la saisie)

- **Date** — la journée à laquelle ces ventes ont eu lieu (par défaut, aujourd'hui).
- **Shift** — le service concerné (ex : Matin, Soir), tel que défini dans
  [Suivre le planning](/suivre-le-planning).
- **Employé** — la personne qui a réalisé la vente (ou qui la saisit).

Ces trois champs sont obligatoires et s'appliquent à tous les tickets de cette saisie.

### Chaque ticket

1. Cliquez sur **Ajouter un ticket** — un nouveau formulaire vide apparaît, sans perdre les
   précédents. Répétez autant de fois que nécessaire ; un bouton **Tout développer/réduire**
   permet de replier les tickets déjà saisis pour garder une vue d'ensemble.
2. Pour chaque article vendu dans ce ticket :
   - Choisissez le **produit** (les articles sont groupés par catégorie, avec leur prix TTC
     affiché à côté du nom).
   - Réglez la **quantité** avec les boutons **−** / **+**.
   - Si le produit propose une **variante** (par exemple une taille), choisissez-la — sinon elle
     reste "Standard".
   - Ajoutez des **extras** si besoin (ex : chantilly, shot supplémentaire) via le panneau dédié —
     ils apparaissent en chips, avec leur supplément de prix.
   - Cliquez sur **Ajouter un article** pour ajouter une autre ligne au même ticket.
3. Renseignez le **service** : **Sur place** (avec le **numéro de table**) ou **À emporter** (avec
   le nom du **comptoir**) — l'un des deux est obligatoire selon le choix fait.
4. Choisissez le **mode de règlement** de ce ticket : **Espèces**, **Carte bancaire** ou
   **Ticket resto**.

Le total du ticket, puis le total général (nombre de tickets, d'articles, montant), se recalculent
en direct en bas de l'écran au fur et à mesure de la saisie.

> **Astuce.** C'est le même principe utilisé ailleurs dans l'application partout où vous pouvez
> ajouter plusieurs éléments d'un coup (par exemple pour ajouter plusieurs ingrédients en même
> temps dans **Stock → Inventaires**) : un bouton "Ajouter…" qui ouvre un nouveau formulaire vide
> à chaque clic, sans jamais perdre ce qui a déjà été saisi.

## Mode "Par quantités vendues" — pratique pour une journée entière

Plutôt que de recréer chaque ticket, indiquez simplement combien d'unités de chaque produit ont
été vendues sur la période, puis vérifiez que le total encaissé (espèces + carte + tickets resto)
correspond bien à ce qui a été réellement compté en caisse.

1. Renseignez les mêmes informations générales (**Date**, **Shift**, **Employé**).
2. Dans la liste des produits (groupée par catégorie, comme un menu), réglez la **quantité vendue**
   de chaque produit concerné avec les boutons **−** / **+** — le reste des produits, à 0, n'a
   besoin d'aucune action.
3. Dès qu'une quantité est saisie, deux réglages optionnels apparaissent pour ce produit :
   - **Réduction / unité** — en montant fixe (DT) ou en pourcentage, appliquée soit à toutes les
     unités vendues de ce produit, soit à un nombre précis d'entre elles seulement (utile si
     seulement certains clients ont eu une remise).
   - **Dont à emporter** — combien, parmi les unités vendues, sont parties à emporter plutôt que
     consommées sur place (le reste est compté "sur place" automatiquement).
4. Renseignez la répartition du règlement pour l'ensemble de la période : **Espèces**, **Carte
   bancaire**, **Tickets resto**.
5. Vérifiez que le total correspond, puis confirmez.

> **Pourquoi il n'y a pas de mode de règlement par produit ici.** Contrairement au mode "Par
> tickets", ce mode ne sait pas quel client a payé comment pour quel produit — seulement des
> totaux. L'application répartit donc automatiquement chaque quantité vendue entre sur
> place/à emporter et entre les modes de règlement, proportionnellement à ce que vous avez indiqué
> globalement.

## Comprendre le règlement en espèces (arrondi de caisse)

Seul le montant réglé en **espèces** est arrondi à la coupure la plus proche réellement disponible
en caisse (par exemple à 50 millimes près) — le montant exact de la vente, lui, reste toujours
enregistré tel quel pour les rapports. Les paiements par **carte** et par **ticket resto** ne sont
jamais arrondis : ils se règlent au montant exact.

## Vérifier les encaissements avant de confirmer

Avant de pouvoir enregistrer, cliquez sur **Vérifier les ventes** : l'écran compare le **total
encaissé** (Espèces + Carte + Tickets resto que vous avez saisis) au **total des ventes**
(calculé à partir de ce que vous avez saisi comme articles).

- Si les deux montants correspondent (à 0,01 DT près), rien de plus n'est demandé.
- S'il y a un écart, une **justification** devient obligatoire — choisissez une suggestion
  courante (pourboire laissé en caisse, erreur de comptage à vérifier, rendu de monnaie non
  enregistré, remise verbale non saisie, écart de caisse à régulariser) ou décrivez la situation
  en quelques mots. Cette note reste attachée à la vente.

Une fois la vérification passée, l'écran affiche un **récapitulatif complet** — rien n'est encore
enregistré à ce stade. Cliquez sur **Confirmer et enregistrer** pour valider, ou **Modifier les
ventes** pour revenir en arrière.

## Importer des ventes depuis un fichier

Si vous avez déjà les ventes dans un fichier Excel ou CSV (par exemple exporté d'une caisse
enregistreuse), utilisez plutôt **Gestion des ventes → Import Excel/CSV** — voir
[Importer des ventes depuis un fichier Excel/CSV](/importer-des-ventes).

## Rembourser une vente

Si une vente a été saisie par erreur ou doit être annulée, ne la supprimez pas — utilisez le
remboursement, qui réintègre automatiquement le stock consommé et annule les effets comptables de
la vente. Voir [Rembourser une vente](/rembourser-une-vente).
