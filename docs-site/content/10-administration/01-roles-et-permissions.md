---
title: "Gérer les rôles et permissions"
description: "Créer un rôle, cocher ses permissions, et l'attribuer à un compte — réservé aux gérants."
category: "Administration"
categoryIcon: "shield-check"
categoryOrder: 10
order: 1
---

> Cette page est réservée aux comptes **Super Admin** — en général, le ou les gérants de
> l'établissement, jamais le personnel de caisse.

## Où trouver cet écran

Menu du compte (en haut à droite, ou en bas de la barre latérale sur téléphone) → **Rôles &
permissions**. Ce n'est volontairement pas un module de la barre latérale principale, pour rester
réservé aux gérants.

## Comprendre les permissions

Chaque action de l'application (voir les ventes, saisir une vente, rembourser, gérer le stock...)
correspond à une **permission** précise, regroupée par module (Ventes, Stock, Produits...). Un
**rôle** est un ensemble de permissions cochées, qu'on attribue ensuite à un ou plusieurs comptes.

## Créer un rôle

1. Cliquez sur **Nouveau rôle**.
2. Donnez-lui un nom clair (ex : "Caisse", "Comptabilité").
3. Cochez, module par module, les permissions que ce rôle doit avoir.
4. Enregistrez.

> 📸 **Capture d'écran à ajouter :** création d'un rôle avec la matrice de permissions par module.

**Exemple courant.** Un rôle "Caisse" typique coche uniquement : Ventes → Consulter, Ventes →
Saisir, et éventuellement Calcul du quotidien — rien sur le personnel, les rapports financiers ou
les rôles eux-mêmes.

## Attribuer un rôle à un compte

Dans la section **Utilisateurs**, créez un compte ou ouvrez un compte existant, puis choisissez son
rôle dans la liste déroulante.

## Le rôle Super Admin

Un rôle spécial, **Super Admin**, existe par défaut et ne peut être ni renommé ni supprimé — il a
toujours accès à tout, même si de nouvelles permissions sont ajoutées à l'application plus tard.
Gardez toujours au moins un compte Super Admin actif.

## Réinitialiser le mot de passe d'un compte

Depuis la fiche d'un utilisateur, un bouton permet de générer un nouveau mot de passe temporaire —
communiquez-le à la personne concernée, elle devra le changer à sa prochaine connexion (voir
[Se connecter et changer son mot de passe](/se-connecter)).

## Voir qui est connecté

La section **Sessions & appareils** (accessible aussi depuis le menu du compte de chaque
utilisateur) permet de voir les appareils connectés et de révoquer une session à distance si besoin.
