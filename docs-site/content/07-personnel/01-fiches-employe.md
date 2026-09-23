---
title: "Gérer les fiches employé"
description: "Ajouter un employé, ses informations, et suivre son statut."
category: "Personnel"
categoryIcon: "users"
categoryOrder: 7
order: 1
---

## Où trouver cet écran

Menu **Gestion du personnel → Employés**.

![Liste des employés](/screenshots/personnel-employes-liste.png)

## Ajouter un employé

1. Cliquez sur **Ajouter un employé**.
2. Renseignez :
   - **Prénom** et **Nom** (obligatoires).
   - **Photo** — optionnelle (jusqu'à 3 Mo) ; à défaut, un avatar avec les initiales est affiché.
   - **Téléphone** (obligatoire, ex : "+216 XX XXX XXX").
   - **Poste** (obligatoire) — champ libre, avec des suggestions courantes (Barista, Serveur(se),
     Cuisinier(ère), Pâtissier(ère), Caissier(ère), Manager, Plongeur(se)) qui apparaissent en
     tapant, sans vous limiter à cette liste.
   - **Date d'entrée** (obligatoire, aujourd'hui par défaut).
   - **Statut** — Actif (par défaut) ou Inactif.
   - **Salaire (DT)** (obligatoire, supérieur à 0) — le salaire de base mensuel ; c'est cette
     valeur qui préremplit automatiquement le suivi financier du mois quand vous enregistrez une
     avance ou une prime pour cet employé (voir
     [Ajouter une avance ou une prime](/avance-ou-prime)).
   - **Numéro CIN** (obligatoire, 8 chiffres) — doit être unique ; un doublon est refusé et
     l'application indique à qui appartient déjà ce numéro.
   - **Date de délivrance** de la CIN (obligatoire).
   - **Copie de la CIN** — optionnelle (photo ou PDF, jusqu'à 5 Mo).
3. Enregistrez.

## Modifier une fiche ou changer un statut

Ouvrez l'employé depuis la liste pour modifier ses informations, ou pour changer son statut (par
exemple marquer un départ en le passant à "Inactif").

## Supprimer un employé

Si l'employé a déjà des jours de planning ou un suivi financier enregistrés, l'application vous
prévient que ces données seront supprimées avec lui — vérifiez avant de confirmer.

## Voir la suite

- [Suivre le planning](/suivre-le-planning)
- [Ajouter une avance ou une prime](/avance-ou-prime)
