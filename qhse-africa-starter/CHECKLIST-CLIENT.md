# Checklist client — QHSE Control (test manuel + smoke)

Objectif : valider en 30–60 min que l’application est **utilisable** (démo / premier client) sur une base Postgres vierge, sans données démo visibles.

## Pré-requis (avant test)

- Base client vierge initialisée (tenant + admin uniquement)
- API + front démarrés
- Identifiants admin disponibles

### Variables indispensables (backend)

- `DATABASE_URL`
- `JWT_SECRET` (prod : fort)
- `ALLOWED_ORIGINS` (prod : obligatoire)
- `REQUIRE_AUTH=true` (prod recommandé)
- `ALLOW_X_USER_ID=false` (prod recommandé)

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

