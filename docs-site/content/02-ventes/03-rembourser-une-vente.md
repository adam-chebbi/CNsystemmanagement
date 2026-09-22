---
title: "Rembourser une vente"
description: "Annuler proprement une vente déjà enregistrée : le stock et les effets comptables sont automatiquement corrigés."
category: "Ventes"
order: 3
---

## Pourquoi ne jamais supprimer une vente

Une vente saisie a déjà eu des effets : elle a déduit des ingrédients du stock, et elle apparaît
dans les rapports. La supprimer laisserait ces effets en place sans la vente elle-même — ce qui
fausserait le stock et les chiffres. Le **remboursement** est la bonne façon d'annuler une vente :
il défait proprement tout ce que la vente avait fait.

## Étapes

1. Allez dans **Gestion des ventes → Ventes**.
2. Retrouvez la vente à rembourser (utilisez la recherche ou les filtres par date si besoin).
3. Ouvrez la vente, puis cliquez sur **Rembourser**.
4. Confirmez.

> 📸 **Capture d'écran à ajouter :** détail d'une vente avec le bouton "Rembourser" et la boîte de
> confirmation.

## Ce qui se passe automatiquement au remboursement

- Les ingrédients consommés par cette vente sont **réintégrés au stock**.
- La vente passe au statut **Remboursé** dans la liste (elle reste visible, pour garder une trace,
  mais n'est plus comptée dans le chiffre d'affaires).

## Qui peut rembourser une vente

Le remboursement est une action sensible (elle touche au stock et à la caisse) — seuls les comptes
ayant la permission **Rembourser** peuvent le faire. Si le bouton n'apparaît pas pour vous,
demandez à un gérant.
