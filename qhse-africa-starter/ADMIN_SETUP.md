## ADMIN_SETUP — QHSE Control

Objectif: **séparer clairement** les accès et éviter tout mélange entre:
- **admin démo** (environnement démo / données démo)
- **admin client** (administrateur d’une entreprise/tenant)
- **SUPER_ADMIN plateforme** (propriétaire QHSE Control)

Ce document décrit **uniquement** la mise en place et les règles de sécurité.

---

### 1) Les 3 types d’admin (à ne pas mélanger)

- **Admin démo (existant)**
  - **But**: démonstration / sandbox.
  - **Données**: démo uniquement.
  - **Attention**: ne jamais utiliser en production client.

- **Admin client**
  - **But**: gérer les utilisateurs, données et modules **dans son tenant**.
  - **Portée**: **un seul tenant** (organisation cliente).
  - **Rôle typique**: `CLIENT_ADMIN` (ou `ADMIN` selon votre politique).

- **Super admin plateforme**
  - **But**: gérer les **entreprises clientes** (création tenant, reset mots de passe provisoires, etc.).
  - **Portée**: plateforme (accès réservé).
  - **Rôle global**: `SUPER_ADMIN` (**réservé au propriétaire de QHSE Control**).
  - **Protection**: routes `/api/admin/*` protégées par middleware `requireSuperAdmin`.

---

### 2) Variables d’environnement (backend)

À définir **sur le service backend** (Railway/VM/serveur):

- `SUPER_ADMIN_EMAIL`: e-mail du propriétaire plateforme.
- `SUPER_ADMIN_PASSWORD`: mot de passe fort (politique backend: longueur + complexité).

Important:
- **Ne pas** utiliser `ALLOW_X_USER_ID` en production.
- **Ne pas** commiter ces secrets.

---

### 3) Création / régénération du SUPER_ADMIN

Depuis `backend/`:

```bash
npm run admin:create
```

Comportement du script:
- lit `SUPER_ADMIN_EMAIL` et `SUPER_ADMIN_PASSWORD`
- crée **ou met à jour** l’utilisateur (idempotent)
- force le rôle global `SUPER_ADMIN`
- hash le mot de passe (bcrypt)
- crée au besoin un tenant interne **`qhse-control-platform`** ("QHSE Control Platform")
- rattache l’utilisateur à ce tenant via `tenant_members`
- **ne crée aucune donnée démo**
- **ne modifie aucun compte client existant** (hors l’utilisateur ciblé par email)

---

### 4) Règles de sécurité recommandées

- **Un compte SUPER_ADMIN dédié** (pas un compte “admin client” recyclé).
- Mot de passe fort + rotation si nécessaire.
- Limiter `ALLOWED_ORIGINS` aux domaines front attendus (pas de wildcard).
- Garder Swagger/docs fermés en production sauf `ENABLE_SWAGGER=true`.

