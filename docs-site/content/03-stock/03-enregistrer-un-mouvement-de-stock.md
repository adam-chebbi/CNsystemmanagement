---
title: "Enregistrer un mouvement de stock"
description: "Entrée, sortie ou transfert entre zones pour un ingrédient déjà existant."
category: "Stock"
order: 3
---

## Où trouver cet écran

Menu **Stock → Mouvements**.

## Les trois types de mouvement

- **Entrée** — vous recevez de la marchandise (hors commande fournisseur formelle) : le stock
  augmente.
- **Sortie** — vous sortez de la marchandise du stock (casse, usage interne...) : le stock diminue.
- **Transfert** — vous déplacez une quantité d'une zone vers une autre (par exemple du Dépôt vers
  la Réserve principale) : la quantité totale ne change pas, seule sa répartition par zone change.

## Étapes

1. Choisissez le type de mouvement en haut du formulaire.
2. Sélectionnez le **produit** concerné.
3. Indiquez la **quantité** et la **zone** (et, pour un transfert, la zone de destination).
4. Indiquez le **motif** du mouvement et l'**employé** qui l'effectue.
5. Si le produit est suivi par lot et que le mouvement est une entrée, renseignez la **date de
   péremption** — le numéro de lot, lui, reste optionnel (laissez-le vide pour qu'il soit généré
   automatiquement).
6. Cliquez sur **Vérifier**, contrôlez le récapitulatif, puis **Confirmer**.

> 📸 **Capture d'écran à ajouter :** formulaire de mouvement de stock, type "Entrée" sélectionné,
> avec les champs lot et péremption visibles.

## Annuler un mouvement

Un mouvement déjà confirmé peut être annulé depuis la liste des mouvements (bouton d'annulation
sur la ligne concernée) — le stock est alors remis dans l'état où il était avant ce mouvement.

## Pour un import en masse

Si vous avez plusieurs mouvements à saisir d'un coup depuis un fichier, utilisez **Stock → Import
Excel/CSV** plutôt que de les saisir un par un ici.
