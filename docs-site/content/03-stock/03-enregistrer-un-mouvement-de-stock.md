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
- **Transfert** — vous déplacez une quantité d'une zone vers une autre (Réserve principale ↔
  Dépôt) : la quantité totale ne change pas, seule sa répartition par zone change.

## Étapes

1. Choisissez le type de mouvement en haut du formulaire.
2. Sélectionnez le **produit** (obligatoire) concerné.
3. Indiquez la **quantité** (obligatoire, doit être supérieure à 0) et la **zone** (obligatoire) —
   pour une Entrée/Sortie ; pour un Transfert, indiquez la **zone d'origine** et la **zone de
   destination** (obligatoires, elles doivent être différentes).
4. Indiquez le **motif** (obligatoire, texte libre, ex : "Réception fournisseur", "Réassort
   comptoir") et l'**employé** (obligatoire) qui l'effectue.
5. Si le produit est suivi par lot :
   - **Entrée** — le **numéro de lot** reste optionnel (laissez-le vide pour qu'il soit généré
     automatiquement, format `AUTO-AAAAMMJJ-XXXX`), mais la **date de péremption** devient
     obligatoire : c'est elle qui permet le suivi, un lot sans date de péremption n'aurait aucun
     intérêt.
   - **Sortie / Transfert** — vous devez choisir le **lot concerné** (obligatoire) parmi les lots existants de
     ce produit dans cette zone. Pour un transfert, la quantité se pré-remplit avec la quantité
     totale du lot, car **un transfert déplace toujours le lot entier** vers la zone de
     destination — on ne scinde pas un lot entre deux zones.
6. Cliquez sur **Vérifier**, contrôlez le récapitulatif, puis **Confirmer**.

![Formulaire de mouvement de stock](/screenshots/stock-inventaires-ajout-ingredient.png)

## Annuler un mouvement

Un mouvement déjà confirmé peut être annulé depuis l'historique en bas de page (bouton
d'annulation sur la ligne concernée, avec le nom de l'**employé qui annule**) — le stock est alors
remis dans l'état où il était avant ce mouvement. Un mouvement **lié à un lot** ne peut en revanche
pas être annulé depuis cet écran.

## Pour un import en masse

Si vous avez plusieurs mouvements à saisir d'un coup depuis un fichier, utilisez **Stock → Import
Excel/CSV** plutôt que de les saisir un par un ici.
