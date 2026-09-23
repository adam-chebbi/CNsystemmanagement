---
title: "Modifier les paramètres de l'établissement"
description: "Les seuils et taux utilisés dans les calculs de l'application, et les informations affichées sur le site vitrine public."
category: "Paramètres"
categoryIcon: "settings"
categoryOrder: 9
order: 1
---

## Où trouver cet écran

Menu **Paramètres** (réservé aux comptes ayant la permission **Paramètres → Gérer**).

## Réglages généraux

Contrairement à ce qu'on pourrait imaginer, cette section ne contient ni le nom du café ni ses
coordonnées (ces informations vivent dans la section **Site vitrine**, plus bas — voir pourquoi
ci-dessous) : ce sont six réglages purement **opérationnels**, qui pilotent des calculs et des
alertes dans toute l'application :

- **Délai d'alerte de péremption** (1 à 60 jours, par défaut 7) — nombre de jours avant la date de
  péremption d'un lot à partir duquel il est signalé "Expiration proche" (Stock, Lots,
  notifications, tableau de bord).
- **Seuil d'écart d'inventaire** (0 à 1000 DT, par défaut 30) — montant, en dinars, au-delà duquel
  un écart constaté lors d'un inventaire déclenche une alerte.
- **Fenêtre de recherche des écarts d'inventaire** (1 à 365 jours, par défaut 60) — période sur
  laquelle l'application recherche un écart d'inventaire récent à signaler.
- **Commission Ticket resto** (0 à 30 %, par défaut 10 %) — le pourcentage retenu par l'émetteur
  des tickets restaurant, déduit automatiquement dans
  [Calcul du quotidien](/calcul-du-quotidien).
- **Marge cible par défaut** (0 à 100 %, par défaut 65 %) — la marge visée pour tout produit qui ne
  définit pas sa propre marge cible (voir [Ajouter un nouveau produit](/ajouter-un-produit)).
- **Nombre maximum de shifts** (1 à 6, par défaut 2) — le nombre de shifts différents que vous
  pouvez créer dans [Suivre le planning](/suivre-le-planning). Réduire ce nombre n'affecte jamais
  les shifts déjà créés.

Deux boutons : **Valeurs par défaut** (revenir aux valeurs d'origine, sans encore enregistrer) et
**Enregistrer**.

## Attention avant de modifier un réglage

Ces réglages sont utilisés dans les calculs affichés partout dans l'application (marges, alertes
de stock, calcul du quotidien, planning) — une modification s'applique **immédiatement** à toute
nouvelle saisie, sans confirmation supplémentaire. Vérifiez la valeur avant de cliquer sur
**Enregistrer**.

## Site vitrine (cafenoir.tn)

Juste en dessous des réglages généraux, cette section pilote le contenu du **site public de
présentation** du café (cafenoir.tn) — c'est ici, et pas ailleurs, que se trouvent les vraies
coordonnées et horaires du café :

- **Coordonnées et horaires** — phrase d'accroche, adresse, téléphone, e-mail, horaires (texte
  affiché en pied de page), heures d'ouverture/fermeture et ville (utilisées uniquement pour le
  référencement Google, pas affichées telles quelles).
- **Réseaux sociaux** — un lien par réseau (Instagram, Facebook, TikTok, YouTube, WhatsApp, X,
  LinkedIn) ; un réseau non renseigné n'apparaît simplement pas sur le site.
- **Plan Google Maps** — collez le code d'intégration obtenu depuis Google Maps ("Partager →
  Intégrer une carte") : l'application en extrait automatiquement le lien nécessaire, avec un
  aperçu de la carte affiché en direct.

![Paramètres — section Site vitrine](/screenshots/parametres-site-vitrine.png)

Le catalogue de produits affiché sur le site vitrine, lui, n'est pas géré ici : il reprend
directement ce qui est configuré dans **Gestion des produits**.

Trois actions : **Valeurs par défaut** (avec confirmation, car cela réinitialise tout le contenu du
site public), **Annuler les modifications** (revenir à la dernière version enregistrée), et
**Enregistrer**. Les changements sont visibles sur le site public en quelques secondes, sans
nécessiter de redéploiement technique.
