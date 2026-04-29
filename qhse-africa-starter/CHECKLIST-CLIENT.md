# Checklist client — QHSE Control (test manuel + smoke)

Objectif : valider en 30–60 min que l’application est **utilisable** (démo / premier client) sur une base Postgres vierge, sans données démo visibles.

## Pré-requis (avant test)

- Base client vierge initialisée (tenant + admin uniquement)
- API + front démarrés
- Identifiants admin disponibles

### Variables indispensables (backend)

- `DATABASE_URL`
- `JWT_SECRET` (prod : fort)
- `CORS_ORIGINS` ou `ALLOWED_ORIGINS` (prod : liste explicite, pas de `*`)
- `REQUIRE_AUTH=true` (obligatoire en prod et sur hébergeur cloud détecté)
- `ALLOW_X_USER_ID=false` (obligatoire en prod et sur cloud ; les routes `/api/admin/*` n’acceptent jamais X-User-Id, uniquement JWT Bearer + SUPER_ADMIN)

### Lot A — garde-fous (avant vente)

- **Démarrage** : avec `REQUIRE_AUTH=false` en local uniquement, vérifier qu’un bandeau d’avertissement apparaît dans les logs stderr au boot.
- **Cloud** : sur un environnement type Railway (ou `MANAGED_CLOUD=true`), vérifier que l’API refuse de démarrer si `REQUIRE_AUTH` n’est pas `true` ou si `ALLOW_X_USER_ID` n’est pas explicitement `false`.
- **Super-admin** : appeler `GET /api/admin/clients` sans header `Authorization: Bearer …` → 401 ; avec `X-User-Id` seul (si autorisé ailleurs en dev) → 401 `SUPER_ADMIN_BEARER_REQUIRED`.
- **UI cockpit SaaS** : actions sensibles (reset MDP, rôle, suspension, statut entreprise, désactivation module) doivent demander une confirmation navigateur avant envoi.
- **Documents / preuves / FDS** : pas d’action de suppression exposée dans l’UI actuelle ; rien à confirmer côté front pour ce périmètre.

### Variables seed client

- `CLIENT_TENANT_SLUG`, `CLIENT_TENANT_NAME`
- `CLIENT_ADMIN_EMAIL`, `CLIENT_ADMIN_PASSWORD`
- Optionnel : `CLIENT_ADMIN_NAME`, `CLIENT_ADMIN_ROLE`

## Démarrage / commandes

### Base client vierge (backend)

```bash
npm run db:init:client --prefix backend
```

### Lancer l’app (front+API)

```bash
npm run dev
```

### Tests existants (rapides)

```bash
npm test --prefix backend
npm test
```

## Parcours à tester (manuel) — critères de réussite

### 1) Connexion admin

- **Action**: ouvrir l’UI, se connecter avec `CLIENT_ADMIN_EMAIL` + mot de passe.
- **Attendu**:
  - message de bienvenue / pas d’erreur
  - tenant correct sélectionné (si multi-tenant)
  - si `mustChangePassword=true`: parcours changement mot de passe fonctionne
- **À noter**: temps de chargement, erreurs console, toasts.

### 2) Dashboard chargé sans erreur

- **Action**: arriver sur Dashboard après login.
- **Attendu**:
  - aucun crash
  - widgets se chargent (même si “0 donnée”)
  - appels API OK (pas de 401/403 inattendus)

### 3) Création d’un risque

- **Action**: créer un risque minimal (titre, probabilité, gravité si requis).
- **Attendu**:
  - risque visible dans la liste
  - stats/compteurs cohérents
  - pas d’erreur 422/500

### 4) Création d’un incident

- **Action**: créer un incident minimal (type, site si requis, sévérité, description).
- **Attendu**:
  - incident listé
  - mise à jour statut possible

### 5) Création d’une action corrective

- **Action**: créer une action (titre, statut, échéance optionnelle, assignation si possible).
- **Attendu**:
  - action visible dans la liste / kanban
  - changement statut OK

### 6) Création ou consultation d’un audit

- **Action**: créer un audit minimal (ref, site, score, statut, checklist optionnelle) ou consulter un audit existant si tu en as créé.
- **Attendu**:
  - audit visible
  - pas de champ technique “detail” renvoyé en prod

### 7) Export PDF

- **Action**: sur un audit, exporter PDF (ou route UI dédiée).
- **Attendu**:
  - téléchargement PDF OK
  - contenu lisible, pas vide, pas de crash

### 8) Import fichier

- **Action**: importer un CSV/XLSX/PDF supporté.
- **Attendu**:
  - pré-analyse / parsing OK
  - aucun 500
  - historique import (si présent) cohérent

### 9) Changement de site (si disponible)

- **Action**: créer au moins 2 sites via l’UI (si fonctionnalité disponible), puis changer de site (filtre / contexte).
- **Attendu**:
  - dashboard/exports filtrés par site
  - aucune fuite cross-site

### 10) Test utilisateur non-admin (droits limités)

- **Préparation**: créer un utilisateur non-admin et l’ajouter au tenant (via UI admin / endpoint existant).
- **Actions**:
  - se connecter
  - vérifier lecture vs écriture selon rôle
- **Attendu**:
  - accès refusé proprement sur les actions non autorisées (403 + message clair)
  - pas d’accès aux endpoints admin/settings

## Contrôles “prod-ready” (rapides)

- Swagger non exposé en prod sans `ENABLE_SWAGGER=true`:
  - **Attendu**: `/api/docs` inaccessible en prod par défaut
- CORS:
  - **Attendu**: origine non whitelistée → 403 CORS
- Erreurs:
  - **Attendu**: pas de stack/SQL renvoyé au front en prod

## Notes / anomalies

- Bloquants (P0):
  - [ ] login impossible
  - [ ] dashboard crash
  - [ ] création incident/risque/action/audit impossible
  - [ ] export PDF KO
  - [ ] import KO
- Importants (P1):
  - [ ] lenteurs majeures
  - [ ] erreurs UI récurrentes / données incohérentes

