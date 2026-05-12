# Audit ciblé — Superadmin / Auth / SaaS client (QHSE Control)

Date audit: 2026-05-12
Périmètre: backend auth + admin SaaS + séparation espaces + isolation multi-tenant + invitations.

## A) État actuel détecté

- L’authentification est centralisée via `POST /api/auth/login` (`auth.controller.js`) avec JWT access + refresh cookie httpOnly. La logique intègre déjà le cas `mustChangePassword` avec jeton court `pwd_setup`.  
- Les rôles sont globaux sur `users.role` (`SUPER_ADMIN`, `CLIENT_ADMIN`, etc.) et les rôles tenant sont aussi présents sur `tenant_members.role`.
- Les routes SaaS admin API sont séparées via `/api/admin/*` + middleware `requireSuperAdmin` (Bearer obligatoire + rôle `SUPER_ADMIN`).
- Le modèle multi-tenant est bien en place (`tenants`, `tenant_members`, `tenantId` dans les tables métier) avec middleware global de contexte tenant.
- Le backoffice admin peut créer entreprise + utilisateur client, suspendre/réactiver utilisateur (`isActive`) et réinitialiser mot de passe provisoire.

## B) Problèmes / risques

1. **Redirection post-login non conforme à l’objectif**  
   Le frontend redirige toujours vers `#dashboard`, quel que soit le rôle, au lieu d’un routage explicite superadmin vers un espace dédié type `/saas-admin`.

2. **Mélange superadmin / app client côté UX**  
   `SUPER_ADMIN` a actuellement accès global (`*`) dans la matrice UI, donc peut naviguer facilement dans les pages client standard.

3. **Mot de passe provisoire renvoyé en clair en API admin**  
   `createClient` et reset password retournent `provisionalPassword` dans la réponse JSON. C’est acceptable uniquement en usage immédiat contrôlé, mais non idéal sécurité/SaaS (risque logs, extensions navigateur, replay opérateur).

4. **TTL provisoire trop longue**  
   `PROVISIONAL_PASSWORD_TTL_MS` = 7 jours; votre cible mentionne 24/48h.

5. **Statuts utilisateur incomplets**  
   Le système fonctionne surtout avec `isActive`, `mustChangePassword`, `temporaryPasswordCreatedAt`. Les statuts métier demandés (`INVITED`, `LOCKED`, `EXPIRED`, `DELETED`) ne sont pas formalisés dans un champ unique.

6. **Invitations email automatiques incomplètes**  
   Service email existe, mais le flux admin de création/réinit ne montre pas un envoi transactionnel robuste (template invitation + rollback/état cohérent si échec).

7. **Journalisation admin métier incomplète**  
   Il existe des audit logs techniques, mais pas une table dédiée `admin_logs` couvrant explicitement les événements SaaS demandés.

## C) Recommandations prioritaires

P1 (immédiat):
- Implémenter redirection post-login par rôle: `SUPER_ADMIN -> /saas-admin`, autres -> `/app` (ou hash équivalent stable).
- Interdire navigation superadmin dans espace client hors support mode.
- Ne plus exposer `provisionalPassword` en réponse API après création/reset.

P2:
- Introduire statut utilisateur SaaS (`INVITED`, `ACTIVE`, `SUSPENDED`, `LOCKED`, `EXPIRED`, `DELETED`) et transitions.
- Passer en invitation par lien d’activation signé (préféré) ou provisoire TTL 24/48h + invalidation stricte précédent secret.

P3:
- Ajouter `admin_logs` + journalisation systématique des actions superadmin.
- Ajouter support mode borné (durée, bannière, lecture seule par défaut, logs obligatoires).

## D) Fichiers à modifier (proposition)

Backend:
- `backend/prisma/schema.prisma` (user status, admin_logs, support session)
- `backend/src/controllers/auth.controller.js` (payload de redirection)
- `backend/src/controllers/admin.controller.js` (invitation/reset, ne plus renvoyer mdp brut)
- `backend/src/services/auth.service.js` (TTL provisoire, invalidation, policy)
- `backend/src/services/email.service.js` (templates invitation/reset accès)
- `backend/src/routes/admin.routes.js` (resend invite, support mode endpoints)

Frontend:
- `src/pages/loginV2.js` (ou `src/pages/login.js` selon écran actif) redirection par rôle
- `src/utils/permissionsUi.js` (barrières UI superadmin)
- `src/main.js` / routeur (espace dédié `saas-admin` vs app client)

## E) Plan d’implémentation

1. Ajouter un `postLoginRedirect` côté backend (`SAAS_ADMIN` / `CLIENT_APP`) dans la réponse login.
2. Faire respecter ce signal côté frontend avec navigation vers `/saas-admin` ou `/app`.
3. Isoler menu/navigation superadmin (only pages SaaS admin).
4. Migrer création/reset utilisateur vers lien d’activation (token hashé, expirant, one-time).
5. Retirer toute restitution de secret temporaire en réponse API.
6. Ajouter `user.status` + mapping avec `isActive/mustChangePassword` (migration progressive).
7. Ajouter `admin_logs` + hook dans chaque action admin critique.
8. Ajouter support mode (`supportMode`, `supportCompanyId`, `expiresAt`, `readOnly=true` par défaut).

## F) Correctifs code proposés (patchs prêts)

### 1) Redirection role-based après login (frontend)

```js
// Dans submitLogin(...) après setAuthSession(...)
const role = String(body?.user?.role || '').toUpperCase();
if (role === 'SUPER_ADMIN') {
  window.location.assign('/saas-admin');
} else {
  window.location.assign('/app');
}
```

### 2) Payload backend explicite

```js
// auth.controller.js (réponse login)
const redirectTarget = role === 'SUPER_ADMIN' ? 'SAAS_ADMIN' : 'CLIENT_APP';
res.json({
  accessToken,
  expiresIn: 3600,
  token: accessToken,
  redirectTarget,
  user: { ... },
  tenant,
  tenants
});
```

### 3) Provisoire 48h + no clear return

```js
// auth.service.js
export const PROVISIONAL_PASSWORD_TTL_MS = 48 * 60 * 60 * 1000;
```

```js
// admin.controller.js (create/reset responses)
res.status(201).json({
  ok: true,
  tenant: { ... },
  user: { ... },
  invitation: { sent: true }
});
```

### 4) Table admin_logs

```prisma
model AdminLog {
  id             String   @id @default(cuid())
  actorUserId    String
  actorUser      User     @relation(fields: [actorUserId], references: [id], onDelete: Cascade)
  action         String
  targetType     String?
  targetId       String?
  tenantId       String?
  metadata       Json     @default("{}")
  createdAt      DateTime @default(now())

  @@index([actorUserId, createdAt])
  @@index([tenantId, createdAt])
  @@map("admin_logs")
}
```

## G) Points de vigilance sécurité

- Séparer strictement authentification et autorisation (JWT valide != droit d’accès tenant).
- Ne jamais exposer `passwordHash`, tokens reset, mot de passe provisoire en API.
- Invalider anciens refresh tokens lors reset/suspension.
- Forcer changement mot de passe avant émission d’un token métier complet.
- Ajouter rate-limit dédié sur login/reset/admin endpoints + verrouillage progressif (`LOCKED`).
- Journaliser et monitorer les échecs d’envoi email pour cohérence de statut.

## H) Architecture finale recommandée (simple)

- **Auth unique**: page login commune.
- **Post-login router**:
  - `SUPER_ADMIN` -> `/saas-admin`
  - autres rôles -> `/app`
- **Domaines séparés logiquement**:
  - `/saas-admin/*` (gestion tenants/comptes/plans/support)
  - `/app/*` (QHSE client tenant-scopé)
- **Tenant isolation server-side obligatoire**: toutes requêtes métier filtrées `tenantId` côté API/service.
- **Onboarding accès**:
  - Option A (préférée): invitation par lien d’activation one-time (hash DB, TTL 24/48h)
  - Option B: mot de passe provisoire hashé, expirant, changement obligatoire first login.
- **Support mode**:
  - session temporaire `supportMode=true`, `supportCompanyId`, `expiresAt`, `readOnly=true`
  - bannière visible + logs `SUPPORT_MODE_STARTED/ENDED`.
