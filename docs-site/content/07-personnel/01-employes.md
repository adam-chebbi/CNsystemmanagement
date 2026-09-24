---
title: "Employés"
description: "Créer et gérer les fiches employé — informations personnelles, poste, salaire et pièce d'identité — et comprendre leurs liens avec le reste de l'application."
category: "Personnel"
categoryIcon: "users"
categoryOrder: 7
order: 1
featured: true
featuredOrder: 7
---

## Où trouver cet écran

Menu **Gestion du personnel → Employés**.

![Liste des employés, avec indicateurs, filtres et tableau](/screenshots/personnel-employes-liste-detail.png)

## Les quatre indicateurs

- **Total employés** — le nombre total de fiches, tous statuts confondus.
- **Employés actifs** — ceux au statut **Actif**.
- **Employés inactifs** — le complément (total moins actifs).
- **Nouveaux employés** — ceux dont la **date d'entrée** se situe dans les 30 derniers jours (fenêtre
  glissante à partir d'aujourd'hui, pas le mois calendaire).

## Rechercher et filtrer

- **Recherche** — nom, prénom ou numéro CIN.
- **Statut** — Actif / Inactif / Tous les statuts.
- **Poste** — liste dynamique, construite à partir des postes réellement utilisés par les employés
  existants (pas d'une liste figée).
- **Date d'entrée** — une plage (du / au).
- **Réinitialiser** efface tous les filtres.

Le tableau est trié par **date d'entrée décroissante** (l'employé le plus récent en premier) — ce
tri n'est pas modifiable par un clic sur les colonnes. Affichage 8 lignes par page.

| Colonne | Contenu |
|---|---|
| **Photo** | L'avatar de l'employé, ou ses initiales à défaut de photo. |
| **Nom & prénom** | Nom complet. |
| **Téléphone** | |
| **Poste** | Texte libre (voir plus bas). |
| **Date d'entrée** | Au format jj/mm/aaaa. |
| **Statut** | Badge Actif / Inactif. |
| **Salaire** | En DT. |
| **CIN** | Numéro de la carte d'identité. |
| **Actions** | Voir, Modifier, Supprimer. |

## Ajouter un employé

Cliquez sur **Ajouter un employé**.

![Formulaire "Ajouter un employé"](/screenshots/personnel-employes-nouveau-formulaire.png)

| Champ | Détail |
|---|---|
| **Photo** | Optionnelle, image uniquement, jusqu'à 3 Mo. |
| **Prénom** * | |
| **Nom** * | |
| **Téléphone** * | Doit ressembler à un numéro (chiffres, espaces, points ou tirets, au moins 7 caractères) — le format tunisien n'est pas imposé strictement, seul le champ "+216 XX XXX XXX" est suggéré en exemple. |
| **Poste** * | Texte libre, avec des suggestions courantes (Barista, Serveur(se), Cuisinier(ère), Pâtissier(ère), Caissier(ère), Manager, Plongeur(se)) qui apparaissent en tapant, sans vous limiter à cette liste — il n'existe pas de catalogue de postes géré séparément. |
| **Date d'entrée** * | Aujourd'hui par défaut. |
| **Statut** | Actif (par défaut) ou Inactif. |
| **Salaire (DT)** * | Doit être 0 ou plus — c'est cette valeur qui préremplit automatiquement le [suivi financier](/suivi-financier) de l'employé. |
| **Numéro CIN** * | Exactement 8 chiffres, et **doit être unique** — un doublon est refusé, en indiquant à qui appartient déjà ce numéro. |
| **Date de délivrance** * | De la CIN. |
| **Copie de la CIN** | Optionnelle, photo ou PDF, jusqu'à 5 Mo. |

Cliquez sur **Vérifier**, contrôlez le récapitulatif ("rien n'est encore enregistré"), puis
**Confirmer et enregistrer**.

## Consulter la fiche d'un employé

Cliquez sur l'icône **œil (Voir)**.

![Fiche détaillée d'un employé, avec son document d'identité](/screenshots/personnel-employes-detail-consultation.png)

Cette fenêtre reprend toutes les informations du tableau, avec en plus la **copie de la CIN** si
elle a été jointe : une image s'affiche directement (cliquable pour l'agrandir en plein écran), un
PDF s'ouvre dans un nouvel onglet. Un bouton **Modifier** ouvre directement le formulaire d'édition
depuis cette fenêtre.

## Modifier un employé

Cliquez sur l'icône **crayon**, ou sur **Modifier** depuis la fiche détaillée. Le même formulaire
en trois étapes s'ouvre, pré-rempli.

![Formulaire de modification d'un employé](/screenshots/personnel-employes-modifier-formulaire.png)

## Passer un employé en Inactif

Le statut se change simplement en rouvrant le formulaire de modification et en basculant le bouton
**Statut** sur Inactif — il n'y a pas d'action dédiée "désactiver". Ce changement n'est jamais
automatique (aucune date de fin de contrat ne le déclenche).

### Effet du statut sur le reste de l'application

- Dans [Planning & Présence](/planning-et-presence), seuls les employés **Actifs** apparaissent
  dans la grille et peuvent être sélectionnés pour un nouveau planning — un employé passé en
  Inactif disparaît de la grille, mais son historique de présence n'est pas supprimé pour autant.
- Dans [Suivi financier](/suivi-financier), le statut n'a **aucun effet** : un employé Inactif
  reste sélectionnable, ce qui permet par exemple de régler un dernier salaire après son départ.
- Un indicateur informatif sur le tableau de bord signale le nombre d'employés inactifs dans la
  base.

## Supprimer un employé

![Confirmation de suppression, avec avertissement sur les données liées](/screenshots/personnel-employes-suppression-confirmation.png)

La suppression n'est **jamais bloquée**, mais si l'employé a déjà des données de planning ou de
suivi financier, un avertissement le précise avant de confirmer : *"Cet employé a des
enregistrements de planning et/ou de suivi financier associés — ils seront également supprimés."*
Une fois confirmée, la suppression est **irréversible** et **supprime en cascade** tout ce qui
concerne cet employé : ses jours de planning, ses éventuels plannings récurrents, et tout son
suivi financier.

## Comment cette fiche se connecte au reste de l'application

- **Salaire** → préremplit automatiquement le [Suivi financier](/suivi-financier) (nouveau suivi ou
  actions rapides +Avance/+Prime) — uniquement au moment de la création, et seulement si le champ
  salaire de base y est encore vide.
- **Nom complet** → apparaît, comme simple texte (pas de lien direct vers la fiche), dans de
  nombreux sélecteurs "Effectué par" ailleurs dans l'application (saisie manuelle des ventes,
  mouvements de stock, pertes, achats, OCR des factures...) — y compris les employés Inactifs,
  puisque ces sélecteurs ne filtrent pas par statut. Renommer ou supprimer l'employé plus tard ne
  modifie pas ces enregistrements passés, qui gardent le nom tel qu'il était au moment de la saisie.
- **Photo** → utilisée uniquement sur les écrans Employés (tableau, formulaire, fiche détaillée) ;
  elle n'apparaît nulle part ailleurs dans l'application.
- **Rôle et permissions applicatifs** — cette fiche ne donne **pas** accès à l'application : c'est
  un dossier RH, pas un compte utilisateur. Un compte de connexion se crée séparément dans
  **Rôles & Permissions**, où il est possible de partir d'une fiche employé existante pour
  préremplir le nom, le CIN et le téléphone du nouveau compte (les deux restent des enregistrements
  distincts, reliés uniquement au moment de la création par un rapprochement sur le numéro CIN).

## Voir la suite

- [Planning & Présence](/planning-et-presence)
- [Suivi financier](/suivi-financier)
