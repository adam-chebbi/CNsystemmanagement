---
title: "Gérer les fournisseurs"
description: "Ajouter et modifier la liste des fournisseurs utilisés pour les commandes et factures."
category: "Achats"
order: 2
---

## Où trouver cet écran

Menu **Gestion des achats → Listes des fournisseurs**.

## Ajouter un fournisseur

1. Cliquez sur **Ajouter un fournisseur**.
2. Renseignez :
   - **Nom / raison sociale** (obligatoire, doit être différent de tout fournisseur déjà
     existant).
   - **Matricule fiscal** — optionnel.
   - **Contact principal** — optionnel, le nom d'une personne à contacter chez ce fournisseur.
   - **Téléphone** et **WhatsApp** — optionnels (deux champs distincts, un fournisseur peut avoir
     un numéro WhatsApp différent).
   - **E-mail** — optionnel, mais vérifié s'il est renseigné.
   - **Adresse** — optionnelle.
   - **Notes** — optionnelles.
3. Enregistrez.

![Formulaire d'ajout de fournisseur](/screenshots/achats-liste-commandes.png)

## Modifier ou retirer un fournisseur

Ouvrez le fournisseur depuis la liste (recherche par nom, matricule fiscal, e-mail, téléphone ou
contact) pour modifier ses informations. Un fournisseur déjà utilisé dans une commande ou une
facture ne peut pas être supprimé (pour ne jamais casser l'historique) — l'application indique
alors combien de commandes ou factures l'utilisent encore.

## Consulter l'historique des prix d'un fournisseur

Ouvrez la fiche d'un fournisseur (icône œil) pour voir, en plus de ses coordonnées, son
**historique des prix d'achat** : pour chaque produit déjà commandé chez lui, le dernier prix payé
et le détail de chaque commande passée (date, numéro, prix). Ce tableau n'est pas une donnée
séparée à tenir à jour — il est reconstitué automatiquement à partir des commandes réelles, il ne
peut donc jamais être désynchronisé de la réalité.
