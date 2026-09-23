---
title: "Ajouter une dépense"
description: "Enregistrer une dépense (loyer, électricité, fournitures...) et suivre son approbation."
category: "Dépenses"
categoryIcon: "wallet"
categoryOrder: 6
order: 1
featured: true
featuredOrder: 4
---

## Où trouver cet écran

Menu **Gestion des dépenses → Dépenses**, puis **Enregistrer une dépense**.

## Les champs du formulaire

- **Titre / Objet** (obligatoire) — ex : "Facture STEG - Septembre 2026".
- **Montant (DT)** (obligatoire, supérieur à 0).
- **Date** (obligatoire, aujourd'hui par défaut).
- **Catégorie** (obligatoire) — doit exister au préalable, voir plus bas.
- **Récurrence** — Ponctuelle (par défaut), Hebdomadaire, Mensuelle, Trimestrielle ou Annuelle.
- **Mode de paiement** (obligatoire) — Espèces, Carte bancaire, Chèque, ou Virement bancaire.
- **Commentaire** — optionnel.
- **Justificatif (photo ou PDF)** — optionnel, jusqu'à 5 Mo, recommandé pour garder une trace.

![Formulaire "Nouvelle dépense"](/screenshots/depenses-nouvelle-depense-formulaire.png)

Vérifiez, puis confirmez — rien n'est encore enregistré tant que vous n'avez pas validé le
récapitulatif.

## Faire évoluer le statut d'une dépense

Une dépense saisie est d'abord **En attente**. Une personne ayant la permission **Dépenses →
Approuver** peut ensuite la faire passer à **Approuvé** ou **Rejeté**, directement depuis la liste
ou depuis sa fiche détaillée — ce statut représente une validation interne de la dépense (par
exemple par le gérant), indépendante du fait qu'elle soit déjà payée ou non. Seules les dépenses
**Approuvées** sont comptées dans les indicateurs de coût du tableau de bord et des rapports ; une
dépense **Rejetée** est exclue de ces totaux mais reste visible dans l'historique.

![Liste des dépenses, avec leur statut](/screenshots/depenses-liste-statuts.png)

## Catégories de dépenses

Menu **Gestion des dépenses → Catégories de dépenses**. L'application est livrée avec 12
catégories courantes pour un café en Tunisie : Loyer, STEG, SONEDE, Téléphone / Internet,
Personnel, Entretien, Réparation, Marketing, Fournitures, Transport, Taxes et frais, Divers. Vous
pouvez en ajouter d'autres si besoin. Une catégorie encore utilisée par au moins une dépense ne
peut pas être supprimée. Si l'une des catégories par défaut a été supprimée par erreur, un bouton
**Recréer les catégories par défaut** permet de la restaurer sans avoir à la retaper.

## À propos de la TVA sur les ventes

La TVA collectée sur les ventes n'apparaît **pas** dans la liste des dépenses — elle est présentée
uniquement à titre d'analyse, dans **Gestion des ventes → Calcul du quotidien** (section "Analyse
comptable HT / TVA") et dans le **Rapport fiscal**, pour éviter de la compter en double.
