---
title: "Ajouter une facture fournisseur et enregistrer un paiement"
description: "Suivre les factures reçues et leur règlement, y compris par lecture automatique (OCR)."
category: "Achats"
order: 3
---

## Où trouver cet écran

Menu **Gestion des achats → Factures**.

## Ajouter une facture manuellement

1. Cliquez sur **Nouvelle facture**.
2. Choisissez le fournisseur concerné et, si elle s'y rattache, la commande correspondante.
3. Renseignez le montant, la date, et joignez si possible une photo ou un scan de la facture.
4. Enregistrez.

## Lire une facture automatiquement (OCR)

Plutôt que de ressaisir les informations à la main, **Gestion des achats → OCR des factures**
permet de déposer une photo, un scan (PDF) ou un fichier Word d'une facture (jusqu'à 20 Mo) : le
texte est extrait automatiquement (reconnaissance d'écriture pour une image ou un PDF scanné,
lecture directe pour un PDF déjà numérique), puis analysé pour proposer : le fournisseur, le
numéro de facture, la date, les montants HT/TVA/TTC, et le détail des articles.

![Écran OCR de lecture automatique des factures](/screenshots/depenses-nouvelle-depense-formulaire.png)

### Ce qui est deviné automatiquement, et ce qui reste à confirmer vous-même

L'écran de vérification affiche le document original à côté des champs détectés, **tous
modifiables** — rien n'est encore enregistré à ce stade, un bandeau le rappelle explicitement.
Certaines informations ne peuvent techniquement jamais être devinées par la lecture automatique et
**doivent toujours être choisies à la main** : le **mode de paiement**, la **zone de réception** du
stock, l'employé qui **effectue** l'opération, et le **produit exact** correspondant à chaque
ligne détectée (la reconnaissance peut se tromper sur un nom de produit, notamment sur un document
de mauvaise qualité — validez toujours ces correspondances avant de confirmer).

Astuce : quand le nom détecté sur la facture ne correspond pas exactement au nom du produit dans
le système, l'icône "Mémoriser cette correspondance" permet d'enregistrer l'association une bonne
fois pour toutes — les prochaines factures du même fournisseur avec la même appellation seront
reconnues automatiquement.

### Ce que "Valider et intégrer" fait réellement

Ce bouton n'est pas un simple enregistrement de facture : il crée d'un coup, à partir des mêmes
informations que la saisie manuelle habituelle (jamais un chemin parallèle) :

1. Le fournisseur, si vous avez choisi "Nouveau fournisseur" plutôt qu'un existant.
2. Une **commande d'achat**, directement au statut "Commandée".
3. Une **réception complète** de cette commande (toutes les quantités des lignes sont considérées
   reçues intégralement) — le stock est donc mis à jour immédiatement, sans étape de réception
   séparée.
4. La **facture fournisseur** elle-même, non payée par défaut — vous enregistrez le paiement
   ensuite, comme pour une facture saisie à la main.

## Enregistrer un paiement sur une facture

Ouvrez la facture, puis cliquez sur **Enregistrer un paiement** : indiquez le montant payé et la
date. Une facture peut être payée en plusieurs fois — son statut (non payée / partiellement payée
/ payée) se met à jour automatiquement selon le total déjà réglé.
