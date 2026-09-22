---
title: "Importer des ventes depuis un fichier Excel/CSV"
description: "Charger plusieurs ventes en une fois depuis un fichier, avec vérification avant enregistrement."
category: "Ventes"
order: 2
---

## Où trouver cet écran

Menu **Gestion des ventes → Import Excel/CSV**.

## Étapes

1. Préparez votre fichier (Excel ou CSV) avec une ligne par vente — la page d'import affiche un
   lien pour **télécharger un modèle** déjà au bon format, le plus simple est de partir de celui-ci.
2. Glissez-déposez le fichier sur la zone d'import, ou cliquez pour le sélectionner.
3. L'application analyse le fichier et affiche un aperçu **ligne par ligne**, avec les éventuelles
   erreurs surlignées (produit introuvable, quantité invalide, date incorrecte...).
4. Corrigez les lignes en erreur directement dans le tableau d'aperçu si possible, ou corrigez le
   fichier source et réimportez-le.
5. Une fois qu'il n'y a plus d'erreur, cliquez sur **Confirmer l'import**.

> 📸 **Capture d'écran à ajouter :** tableau d'aperçu de l'import avec une ligne en erreur
> surlignée en rouge et le détail du message d'erreur.

## Pourquoi rien n'est enregistré avant la confirmation

L'import se fait toujours en deux temps : d'abord un **aperçu** (rien n'est encore modifié dans
l'application), puis une **confirmation** explicite. Vous pouvez donc annuler à tout moment avant
cette dernière étape sans aucun risque.

## En cas d'erreur qui bloque tout le fichier

Certaines erreurs (colonne obligatoire manquante, fichier vide, trop de lignes) empêchent
l'import de démarrer du tout — un message l'explique en haut de l'écran. Corrigez le fichier selon
le message, puis réessayez.
