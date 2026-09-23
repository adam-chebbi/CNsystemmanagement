---
title: "Importer des ventes depuis un fichier Excel/CSV"
description: "Charger plusieurs ventes en une fois depuis un fichier, avec vérification avant enregistrement."
category: "Ventes"
order: 2
---

## Où trouver cet écran

Menu **Gestion des ventes → Import Excel/CSV**.

## Préparer le fichier

Un fichier Excel (`.xlsx`, `.xls`) ou CSV, **une ligne par ticket** (donc par vente complète, pas
par article). Le bouton **Télécharger le template CSV**, sur cette page, génère un modèle déjà au
bon format avec 3 exemples de lignes construits à partir de vos vrais produits/shifts/employés —
partir de ce modèle est le plus simple.

### Les colonnes attendues

| Colonne                  | Obligatoire      | Format                                                                                                                                 |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `date`                   | Oui              | `AAAA-MM-JJ` (ex : 2026-09-08) ou `JJ/MM/AAAA`                                                                                         |
| `shift`                  | Oui              | Nom exact du shift (la casse n'a pas d'importance)                                                                                     |
| `employee`               | Oui              | Nom de l'employé (la casse n'a pas d'importance)                                                                                       |
| `consommations_articles` | Oui              | Articles séparés par `\|`, avec quantité en préfixe : `2x Espresso Double Arabica\|1x Croissant Pur Beurre`. Sans préfixe, quantité = 1. |
| `extras`                 | Non              | Alignés par position avec les articles via `\|` (plusieurs extras pour un même article séparés par une virgule)                        |
| `variantes`              | Non              | Alignées par position avec les articles via `\|` (une variante par article)                                                            |
| `service`                | Oui              | `Sur place` ou `À emporter`                                                                                                            |
| `comptoir`               | Selon `service`  | Obligatoire si `service = À emporter`                                                                                                  |
| `table`                  | Selon `service`  | Obligatoire si `service = Sur place`                                                                                                   |
| `reglement`              | Oui              | `Espèces`, `Carte bancaire` ou `Ticket resto`                                                                                          |

Chaque nom saisi (produit, shift, employé, variante, extra) est reconnu automatiquement, même avec
des différences d'accents, de majuscules ou d'espaces — il est ensuite ramené au nom exact
enregistré dans le système, jamais dupliqué.

## Étapes

1. Glissez-déposez le fichier sur la zone d'import, ou cliquez pour le sélectionner.
2. L'application analyse le fichier et affiche un **aperçu ligne par ligne** — chaque ligne
   devient une carte "ticket" modifiable, exactement comme en saisie manuelle par tickets (mêmes
   champs, mêmes sélecteurs).
3. Une ligne en erreur est signalée en rouge, avec le détail : valeur importée non reconnue
   (produit, shift, employé... introuvable), champ obligatoire manquant, date invalide, etc. Le
   texte tel qu'il était dans le fichier reste affiché à côté du champ, pour que vous puissiez
   corriger directement dans le tableau d'aperçu — sans avoir besoin de rouvrir le fichier source.

![Aperçu de l'import avec des lignes modifiables directement à l'écran](/screenshots/depenses-liste-statuts.png)

4. En haut de l'aperçu, des compteurs indiquent : tickets détectés, valides, invalides, articles,
   montant total estimé.
5. Corrigez chaque ligne en erreur (dans le tableau, ou en modifiant le fichier source et en le
   réimportant).
6. Une fois qu'il n'y a plus aucune erreur, le bouton **Confirmer l'import** devient actif.

## Pourquoi rien n'est enregistré avant la confirmation

L'import se fait toujours en deux temps : d'abord un **aperçu** (rien n'est encore modifié dans
l'application), puis une **confirmation** explicite. Vous pouvez donc annuler à tout moment avant
cette dernière étape sans aucun risque.

## Pourquoi l'import bloque tant qu'il reste une seule erreur

Il n'y a volontairement pas d'option "importer les lignes valides et ignorer les erreurs" : un
fichier de ventes est un tout, et importer une partie seulement risquerait de faire croire que
la journée est complète alors qu'il en manque une partie. Corrigez toutes les lignes avant de
confirmer.

## En cas d'erreur qui bloque tout le fichier

Certaines erreurs (colonne obligatoire manquante, fichier vide, trop de lignes) empêchent
l'import de démarrer du tout — un message l'explique en haut de l'écran. Corrigez le fichier selon
le message, puis réessayez.
