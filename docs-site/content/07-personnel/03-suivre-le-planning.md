---
title: "Suivre le planning"
description: "Organiser les shifts et suivre la présence des employés."
category: "Personnel"
order: 3
---

## Où trouver cet écran

Menu **Gestion du personnel → Planning & Présence**. La grille affiche une ligne par employé actif
et une colonne par jour de la semaine (semaine du lundi au dimanche, navigable).

![Vue calendrier du planning, shifts affectés par employé](/screenshots/personnel-planning.png)

## Configurer les shifts

Avant de planifier, définissez les **shifts** disponibles (ex : "Matin" 07:00–15:00, "Soir"
15:00–23:00) via **Gérer les shifts** : nom, heure de début, heure de fin, description optionnelle.
Le nombre de shifts est limité (2 par défaut, réglable dans
[Paramètres généraux](/parametres-generaux)). Un shift déjà utilisé dans le planning ne peut pas
être supprimé.

## Planifier un shift pour plusieurs jours d'un coup

Le plus rapide pour couvrir une période entière est l'assistant **Créer un planning**, en 5
étapes :

1. **Employé** — choisissez-le parmi les employés actifs.
2. **Période** — dates de début et de fin.
3. **Horaire** — pour chaque jour de la semaine, choisissez **Repos** ou **Travail** (avec un ou,
   si vous cochez les deux, deux shifts ce jour-là — auquel cas l'employé est marqué "Doublage").
4. **Récurrence** — ce modèle hebdomadaire se répète-t-il chaque semaine jusqu'à la date de fin, ou
   s'applique-t-il une seule fois ?
5. **Aperçu** — un récapitulatif liste chaque jour qui sera créé ; si certains jours ont déjà un
   planning existant, un avertissement l'indique et vous devez cocher une case pour confirmer que
   vous acceptez de l'écraser.

## Modifier un seul jour

Cliquez directement sur une case employé/jour dans la grille pour ouvrir la fiche du jour : choisir
un statut (**Planifié**, **Présent**, **Absent**, **Congé**, **Repos**, **Retard**, **Doublage**),
et le ou les shifts concernés si le statut l'exige. C'est aussi ici que vous **enregistrez la
présence réelle** après coup : un jour marqué "Planifié" au départ peut être repassé à "Présent",
"Absent" ou "Retard" une fois la journée passée — planning prévisionnel et présence réelle
partagent la même case, l'un écrasant l'autre au fil de la journée.

> Le suivi de présence est saisi manuellement, sans pointeuse biométrique.

## En cas de conflit

Si vous essayez d'affecter un statut de travail sur un jour déjà marqué "Repos" pour cet employé,
l'application vous le signale avant d'enregistrer, pour éviter d'écraser un planning existant par
erreur.

## Voir la suite

- [Ajouter une avance ou une prime](/avance-ou-prime)
