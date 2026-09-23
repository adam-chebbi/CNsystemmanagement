---
title: "Rôles et permissions"
description: "Comprendre les rôles et permissions du système, ce qu'ils contrôlent, et comment gérer qui a accès à quoi."
category: "Démarrage"
order: 4
---

> Créer ou modifier un rôle, ou attribuer un rôle à un compte, est réservé aux comptes ayant la
> permission **Rôles & permissions → Gérer** — en général, le ou les gérants de l'établissement,
> jamais le personnel de caisse. Comprendre ce que sont les rôles et permissions, en revanche,
> est utile à toute l'équipe : c'est ce qui explique pourquoi certains menus ou boutons sont
> visibles pour une personne et pas pour une autre.

## Pourquoi les rôles et les permissions existent

Tout le monde dans l'équipe n'a pas besoin — ni intérêt — à avoir accès à tout. Un(e) caissier(ère)
doit pouvoir enregistrer des ventes, mais n'a aucune raison de voir les salaires de l'équipe ou de
modifier les taux de TVA ; un(e) comptable a besoin des rapports financiers, mais pas forcément de
créer des commandes d'achat. Le système répond à ce besoin avec deux notions distinctes, qu'il est
important de ne pas confondre :

- Une **permission** est le droit d'effectuer **une action précise** dans l'application (par
  exemple "Rembourser une vente", ou "Approuver une dépense").
- Un **rôle** est un **ensemble nommé de permissions** (par exemple le rôle "Caisse"), que l'on
  attribue ensuite à un compte utilisateur.

Autrement dit : **on ne coche jamais des permissions individuellement sur un compte** — on
attribue un rôle à ce compte, et c'est ce rôle qui détermine, via les permissions qu'il regroupe,
ce que la personne peut voir et faire. Changer ce qu'une personne peut faire revient donc à
changer son rôle, ou à modifier les permissions du rôle qu'elle a déjà (ce qui change alors le
comportement de **tous** les comptes qui partagent ce rôle, pas seulement le sien).

## Ce qu'une permission contrôle concrètement

Une permission conditionne deux choses à la fois : la **visibilité** d'un menu, bouton ou champ
dans l'interface (une action que vous n'avez pas le droit de faire n'apparaît simplement pas à
l'écran), et l'**autorisation réelle** d'effectuer l'action correspondante — la seconde est la
vraie barrière de sécurité, la première n'est qu'un confort visuel qui évite d'afficher des
boutons inutilisables.

## Où trouver cet écran

Menu du compte (en haut à droite, ou en bas de la barre latérale sur téléphone) → **Rôles &
permissions**. Ce n'est volontairement pas un module de la barre latérale principale, pour rester
réservé aux gérants. Deux onglets : **Rôles** et **Utilisateurs**.

![Liste des rôles et permissions](/screenshots/roles-permissions-liste.png)

## La liste complète des permissions, par module

| Module | Permissions disponibles |
|---|---|
| Tableau de bord | Consulter · Gérer (définir les objectifs mensuels de vente) |
| Notifications & Alertes | Consulter · Traiter (marquer une alerte comme traitée) |
| Gestion des ventes | Consulter · Saisir (manuel ou import) · **Rembourser** *(sensible)* · **Calcul du quotidien** *(sensible)* |
| Stock | Consulter · Gérer (mouvements, pertes/ajustements) · Importer · Inventaires |
| Gestion des produits | Consulter · Gérer (créer/modifier/supprimer produits, sous-recettes, catégories, suppléments) · Importer |
| Gestion des dépenses | Consulter · Saisir · **Approuver** *(sensible)* · **Supprimer** *(sensible)* · Catégories |
| Gestion des achats | Consulter · Créer · Modifier (brouillon uniquement) · **Annuler / Commander** *(sensible)* · Réceptionner · **Supprimer** *(sensible)* · Fournisseurs · Factures · **Paiement** *(sensible)* · Importer · OCR des factures |
| Rapports de gestion | Consulter · **Rapports financier & fiscal** *(sensible)* |
| Gestion du personnel | Consulter (employés, planning) · Gérer · **Suivi financier** *(sensible)* |
| Journal d'activité | Consulter |
| Paramètres | **Gérer** *(sensible)* — une seule permission pour toute la page Paramètres, y compris la section Site vitrine |
| Rôles & permissions | **Gérer** *(sensible)* — conditionne à elle seule la visibilité du menu "Rôles & permissions" |

Les permissions marquées *(sensible)* touchent à l'argent, au stock ou aux droits d'accès — à
n'accorder qu'après réflexion.

## Exemples de rôles courants

| Rôle | Permissions typiques | Ce que la personne peut faire |
|---|---|---|
| **Caisse** | Ventes → Consulter, Saisir, éventuellement Calcul du quotidien | Enregistrer des ventes et faire la caisse de fin de journée — rien sur le personnel, les finances ou les rôles. |
| **Comptabilité** | Rapports → Consulter et Financier/fiscal, Dépenses, Achats → Consulter | Suivre les chiffres et les dépenses — sans nécessairement pouvoir modifier le stock ou les ventes. |
| **Super Admin** | Toutes, automatiquement | Accès total, y compris aux permissions ajoutées plus tard. Voir plus bas. |

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
[Première connexion](/se-connecter)). Depuis la liste des utilisateurs, un
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
