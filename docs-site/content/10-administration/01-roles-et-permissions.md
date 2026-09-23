---
title: "Gérer les rôles et permissions"
description: "Créer un rôle, cocher ses permissions, et l'attribuer à un compte — réservé aux gérants."
category: "Administration"
categoryIcon: "shield-check"
categoryOrder: 10
order: 1
---

> Cette page est réservée aux comptes ayant la permission **Rôles & permissions → Gérer** — en
> général, le ou les gérants de l'établissement, jamais le personnel de caisse.

## Où trouver cet écran

Menu du compte (en haut à droite, ou en bas de la barre latérale sur téléphone) → **Rôles &
permissions**. Ce n'est volontairement pas un module de la barre latérale principale, pour rester
réservé aux gérants. Deux onglets : **Rôles** et **Utilisateurs**.

![Liste des rôles et permissions](/screenshots/roles-permissions-liste.png)

## Comprendre les permissions

Chaque action de l'application correspond à une **permission** précise, regroupée par module. Un
**rôle** est un ensemble de permissions cochées, qu'on attribue ensuite à un ou plusieurs comptes.
La liste complète, module par module :

- **Tableau de bord** — Consulter ; Gérer (définir les objectifs mensuels de vente).
- **Notifications & Alertes** — Consulter ; Traiter (marquer une alerte comme traitée).
- **Gestion des ventes** — Consulter ; Saisir (manuel ou import) ; **Rembourser** *(sensible)* ;
  **Calcul du quotidien** *(sensible)*.
- **Stock** — Consulter ; Gérer (mouvements, pertes/ajustements) ; Importer ; Inventaires.
- **Gestion des produits** — Consulter ; Gérer (créer/modifier/supprimer produits, sous-recettes,
  catégories, suppléments) ; Importer.
- **Gestion des dépenses** — Consulter ; Saisir ; **Approuver** *(sensible)* ; **Supprimer**
  *(sensible)* ; Catégories.
- **Gestion des achats** — Consulter ; Créer ; Modifier (brouillon uniquement) ; **Annuler /
  Commander** *(sensible)* ; Réceptionner ; **Supprimer** *(sensible)* ; Fournisseurs ; Factures ;
  **Paiement** *(sensible)* ; Importer ; OCR des factures.
- **Rapports de gestion** — Consulter ; **Rapports financier & fiscal** *(sensible)*.
- **Gestion du personnel** — Consulter (employés, planning) ; Gérer ; **Suivi financier**
  *(sensible)*.
- **Journal d'activité** — Consulter.
- **Paramètres** — **Gérer** *(sensible)* — une seule permission pour toute la page Paramètres, y
  compris la section Site vitrine.
- **Rôles & permissions** — **Gérer** *(sensible)* — cette permission conditionne à elle seule la
  visibilité du menu "Rôles & permissions" pour un compte.

Les permissions marquées *(sensible)* touchent à l'argent, au stock ou aux droits d'accès — à
n'accorder qu'après réflexion.

## Créer un rôle

1. Cliquez sur **Nouveau rôle**.
2. Donnez-lui un **nom** (obligatoire, unique) et une **description** (optionnelle).
3. Cochez, module par module, les permissions que ce rôle doit avoir — un bouton **Tout
   sélectionner / Tout désélectionner** par module accélère la saisie pour un module entier.
4. Enregistrez.

**Exemple courant.** Un rôle "Caisse" typique coche uniquement : Ventes → Consulter, Ventes →
Saisir, et éventuellement Calcul du quotidien — rien sur le personnel, les rapports financiers ou
les rôles eux-mêmes.

## Attribuer un rôle à un compte

Dans l'onglet **Utilisateurs**, cliquez sur **Nouvel utilisateur**, puis choisissez la source :

- **Employé existant** — pré-remplit nom, CIN et téléphone à partir d'une fiche déjà créée dans
  **Gestion du personnel** (qui n'a pas encore de compte de connexion).
- **Nouveau contact externe** — un formulaire vierge, pour une personne qui n'a pas de fiche
  employé (ex : un comptable externe).

Renseignez le **rôle** dans la liste déroulante. Le mot de passe temporaire du nouveau compte est
toujours son **numéro CIN** — la personne devra le changer à sa première connexion (voir
[Se connecter et changer son mot de passe](/se-connecter)). Depuis la liste des utilisateurs, un
sélecteur permet de **réattribuer un rôle** à tout moment.

## Le rôle Super Admin

Un rôle spécial, **Super Admin**, existe par défaut et ne peut être ni renommé ni supprimé ni
modifié — il a toujours accès à absolument tout, même si de nouvelles permissions sont ajoutées à
l'application plus tard. Gardez toujours au moins un compte Super Admin actif.

## Réinitialiser le mot de passe d'un compte

Depuis la fiche d'un utilisateur, un bouton **Réinitialiser le mot de passe** régénère le mot de
passe temporaire (à nouveau le numéro CIN) — communiquez-le à la personne concernée, elle devra le
changer à sa prochaine connexion.

## Supprimer un compte utilisateur

La suppression déconnecte immédiatement toutes les sessions actives de ce compte, sur tous ses
appareils — une confirmation le rappelle avant de valider.

## Voir qui est connecté

La section **Sessions & appareils**, accessible depuis le menu du compte de chaque utilisateur,
permet à chacun de voir ses propres appareils connectés et de révoquer une session à distance si
besoin — voir [Consulter mes sessions actives](/sessions-et-appareils). Il n'existe pas, en
revanche, d'écran permettant à un gérant de consulter les sessions d'un autre compte : chacun ne
voit que les siennes.
