# QHSE Control Africa — starter front

Ce zip est une **base de départ propre** pour ouvrir le projet dans Cursor sans repartir sur un HTML géant.

## Ce que contient ce starter
- un `index.html` minimal
- un shell front modulaire en JS natif
- un menu simple et directement exploitable
- des pages séparées par domaine métier
- une base de **notifications**
- une base de **journal des modifications**
- une page **Centre IA** pour préparer les futures options IA
- des styles centralisés dans un seul fichier pour la première phase

## Structure
- `src/components` : composants du shell
- `src/pages` : un module = une page
- `src/data` : mocks temporaires
- `src/utils` : état front léger
- `src/styles` : styles globaux

## Pourquoi cette structure
Elle permet de :
1. valider le produit avant de brancher le back
2. éviter un monolithe HTML ingérable
3. préparer un futur branchement backend module par module
4. faciliter le travail dans Cursor

## Plan conseillé
1. Valider le shell et la navigation
2. Refaire le design si besoin, sans casser la structure
3. Brancher d’abord `dashboard`, `incidents`, `risks`, `actions`
4. Ajouter ensuite le vrai système auth / rôles / back
5. Remplacer progressivement les mocks par l’API

## Pour lancer
Ouvre simplement `index.html` dans ton navigateur pour une prévisualisation rapide.

Pour une future phase plus propre, on pourra migrer cette base vers Vite ou un framework, mais pour cadrer le produit et travailler vite dans Cursor, cette base est suffisante.
