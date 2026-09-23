---
title: "Ajouter un nouveau produit"
description: "Créer un produit vendable : informations générales, fiche technique (recette) et prix."
category: "Produits"
categoryIcon: "chef-hat"
categoryOrder: 4
order: 1
---

## Où trouver cet écran

Menu **Gestion des produits → Ajout produits**.

## Informations générales

- **Photo** — optionnelle, cliquez ou glissez une image dans le cadre.
- **Nom** (obligatoire).
- **Prix de vente (DT)** (obligatoire, doit être supérieur à 0).
- **Description** — optionnelle.
- **Catégorie** (obligatoire) — doit exister au préalable dans **Gestion des produits →
  Catalogue**.
- **Sous-catégorie** — optionnelle, se débloque une fois une catégorie choisie, et doit lui
  appartenir.
- **Marge cible (optionnel)** — le taux de marge visé pour ce produit spécifiquement (ex : 0.65
  pour 65 %). Si vous ne renseignez rien, c'est la **marge cible par défaut** de l'établissement
  qui s'applique (réglable dans [Paramètres généraux](/parametres-generaux)).
- **Taux de TVA (optionnel)** — un menu déroulant propose les taux tunisiens courants : 0 %
  (exonéré), 7 % (réduit), 13 % (intermédiaire), 19 % (standard, valeur par défaut si rien n'est
  choisi).
- **Le prix ci-dessus inclut la TVA** — bouton oui/non (oui par défaut). Détermine si le **prix de
  vente** saisi plus haut est TTC (toutes taxes comprises, le cas normal pour un prix affiché en
  carte) ou HT.
- **Disponible à la vente / Indisponible** — bascule, disponible par défaut.

## Pourquoi la marge se calcule toujours hors TVA

La **marge brute** affichée par l'application est toujours calculée sur le prix **hors taxes**
(Prix de vente HT − Coût matière), jamais sur le prix TTC — parce que la TVA collectée appartient
à l'État, pas au café : la compter dans le prix de vente gonflerait artificiellement chaque marge
affichée. Si "Le prix inclut la TVA" est activé, l'application calcule elle-même le prix HT en
retirant le taux de TVA du produit ; sinon, le prix saisi est déjà considéré comme HT.

## Fiche technique (la recette)

Optionnelle — un produit peut être vendu sans fiche technique (par exemple un article acheté déjà
fini). Si vous en ajoutez une, chaque ligne peut être de trois natures différentes :

- **Ingrédient** — un ingrédient du stock, avec une quantité et une unité (l'unité proposée doit
  être compatible avec l'unité de stockage de l'ingrédient : par exemple un ingrédient stocké en
  kg peut être dosé en g ou en kg, jamais en litres).
- **Sous-recette** — une préparation intermédiaire déjà créée dans
  [Sous-recettes](/sous-recettes), avec une quantité dans son unité de rendement. Son coût est
  automatiquement proportionnel à la part du lot utilisée.
- **Produit** — un autre produit du catalogue, utilisé comme composant d'un produit composé (par
  exemple une formule "Menu"), avec un simple multiplicateur. Un produit ne peut jamais se
  référencer lui-même, ni directement ni via une chaîne d'autres produits composés — l'application
  bloque ce cas avec un message d'erreur explicite.

Le **coût matière estimé** se recalcule en direct en haut de la fiche technique, à mesure que vous
ajoutez des lignes.

## Aperçu des marges

En bas de page (et sur l'écran de vérification), quatre chiffres se recalculent en direct au fur
et à mesure de votre saisie : **Prix de vente HT**, **Coût matière**, **Marge brute** (HT − coût
matière) et **Taux de marge** (marge brute ÷ prix HT) — comparé visuellement à la marge cible du
produit (en vert si elle est atteinte ou dépassée, en rouge si elle est inférieure).

## Étapes

1. Renseignez les **informations générales**.
2. Renseignez la **fiche technique** si le produit en a une.
3. Complétez les sections [Variantes et Extras](/variantes-et-extras) si le produit en propose.
4. Cliquez sur **Vérifier le produit**, contrôlez le récapitulatif (rien n'est encore enregistré à
   ce stade), puis **Confirmer et créer le produit**.

## Modifier un produit existant

Depuis **Gestion des produits → Produits**, ouvrez le produit à modifier (icône crayon) — le même
formulaire s'ouvre, pré-rempli.

## Rendre un produit indisponible sans le supprimer

Si un produit est temporairement en rupture ou hors carte, cliquez directement sur son badge de
disponibilité dans la liste des produits pour le **désactiver** — il n'apparaîtra plus à la vente
(saisie manuelle, quantités, import), mais son historique (ventes passées, recette) reste intact.
Supprimer un produit (icône corbeille) est en revanche définitif et irréversible.
