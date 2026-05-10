# Audit — Initialisation à zéro des nouveaux comptes (QHSE Control)

## Périmètre et méthode
- Audit statique backend + frontend, sans changement de logique métier.
- Cible: causes possibles de KPI/compteurs non nuls à la création d’un compte/entreprise.
- Axes vérifiés: onboarding, tenant scoping, seeds/demo data, fallbacks frontend, cache local.

## A) Résumé du problème probable
**Cause racine la plus probable :** mélange entre données de démonstration et contexte tenant par défaut, combiné à des fallbacks frontend permissifs.

1. Le backend définit un `DEFAULT_TENANT_ID = qhse_default_tenant` partagé avec les données seed démo.
2. La création d’utilisateur peut rattacher un utilisateur au tenant par défaut si `tenantId` est absent.
3. Le dashboard frontend injecte des listes démo si le mode démo est actif (`isDemoMode()`), ce qui produit des KPI non nuls même si la base est vide pour un nouveau compte.
4. Plusieurs modules utilisent du `localStorage` avec clés globales (non suffixées par user/tenant), ce qui peut afficher des états hérités d’un autre compte après logout/login.

---

## B) Liste des fichiers suspects (priorité)

### Priorité 1 (très probable)
- `backend/src/services/users.service.js`
- `backend/src/lib/tenantConstants.js`
- `backend/prisma/seed.js`
- `src/pages/dashboard.js`
- `src/services/demoMode.service.js`
- `src/utils/reconcileDashboardStats.js`

### Priorité 2 (isolation/cache/session)
- `src/utils/risksRegisterModel.js`
- `src/utils/dashboardNavigationIntent.js`
- `src/utils/settingsPageStorage.js`
- `src/utils/pageViewMode.js`
- `src/utils/displayMode.js`

---

## C) Tableau par module

| Module | Fichier | Valeur affichée incorrecte | Source actuelle | Cause probable | Correction minimale recommandée | Risque |
|---|---|---|---|---|---|---|
| Onboarding / création user | `backend/src/services/users.service.js` | Nouveau compte voit des données non nulles | Fallback `tenantId` vers `DEFAULT_TENANT_ID` | Si tenant manquant à la création, rattachement au tenant démo | Refuser la création si `tenantId` absent (400) au lieu de fallback silencieux | Élevé |
| Tenant / org | `backend/src/lib/tenantConstants.js` | Tenant démo partagé | Constante globale `qhse_default_tenant` | Mélange seed démo / runtime | Réserver cette constante au seed/admin scripts, pas aux flux runtime | Élevé |
| Dashboard KPI | `src/pages/dashboard.js` | incidents/actions/audits/nc > 0 sur compte vierge | `DASHBOARD_DEMO_LISTS` + fallback `incR || demo` etc. quand `isDemoMode()` | Mode démo activé et non strictement isolé | Bloquer fallback démo pour comptes non explicitement démo (feature flag + tenant allowlist) | Élevé |
| Dashboard stats | `src/utils/reconcileDashboardStats.js` | Recalcul local des compteurs en cas API “à 0” | Fallback listes client si API jugée “non authoritative” | Peut surécrire des zéros légitimes avec signaux locaux | Restreindre ce fallback aux erreurs API explicites, pas au simple 0 | Moyen |
| Risques | `src/utils/risksRegisterModel.js` | Registre non vide après switch compte | Cache localStorage global | Données d’un autre compte réutilisées | Clé cache suffixée par `tenantId`/`userId` | Moyen |
| Navigation / intents | `src/utils/dashboardNavigationIntent.js` | filtres/intent hérités | localStorage global | Persistance cross-session | Préfixer par tenant + purge logout | Faible/Moyen |
| Paramètres UI | `src/utils/settingsPageStorage.js`, `pageViewMode.js`, `displayMode.js` | états UI non vierges | localStorage global | contamination inter-compte | Namespace par tenant/user pour tout storage métier | Faible |
| Seed DB | `backend/prisma/seed.js` | base déjà non vide | insertion massive de données démo | environnement de test/prod seedé par erreur | Garde-fou env: seed démo uniquement si `ALLOW_DEMO_SEED=true` | Élevé |

---

## D) Anti-patterns trouvés

1. **Fallback tenant implicite**
   - `const tid = normalizeTenantId(tenantId) || DEFAULT_TENANT_ID;`
   - Effet: rattachement silencieux au tenant partagé.

2. **Mock/demo data active dans le dashboard**
   - `incR || DASHBOARD_DEMO_LISTS.incidents` (idem actions/audits/ncs) sous `isDemoMode()`.

3. **Fallback avec `||` sur structures de données**
   - acceptable pour `null/undefined`, mais peut masquer des états métier réels si la source est invalide.

4. **localStorage non isolé par utilisateur/tenant**
   - plusieurs clés globales non namespacées.

5. **Risque d’isolation partielle**
   - stratégie “server not authoritative => derive from client lists” dans le dashboard peut introduire un bruit non attendu.

---

## E) Proposition de correction minimale (sans application immédiate)

### Correctif 1 — bloquer fallback tenant implicite (priorité absolue)
**Pourquoi:** évite que des comptes ne tombent sur le tenant démo.

```diff
--- a/backend/src/services/users.service.js
+++ b/backend/src/services/users.service.js
@@
-  const tid = normalizeTenantId(tenantId) || DEFAULT_TENANT_ID;
+  const tid = normalizeTenantId(tenantId);
+  if (!tid) {
+    const err = new Error('Tenant requis');
+    err.statusCode = 400;
+    throw err;
+  }
```

**Impact:** limité au flux de création user quand contexte tenant absent.
**Compatibilité:** comptes existants inchangés.
**Test:** création user sans tenant => 400; avec tenant => OK.

### Correctif 2 — verrouiller fallback dashboard démo
**Pourquoi:** éviter KPI non nuls sur comptes vierges.

```diff
--- a/src/pages/dashboard.js
+++ b/src/pages/dashboard.js
@@
-const incidents = isDemoMode() ? incR || DASHBOARD_DEMO_LISTS.incidents : incR || [];
+const useDemo = isDemoMode() && sessionUser?.tenant?.slug === 'demo';
+const incidents = useDemo ? (incR ?? DASHBOARD_DEMO_LISTS.incidents) : (incR ?? []);
```

(même principe pour actions/audits/ncs)

**Impact:** seulement comptes non démo.
**Compatibilité:** mode démo explicite préservé.

### Correctif 3 — namespace storage local
**Pourquoi:** éviter pollution inter-compte.

```diff
-const RISKS_LIST_CACHE_KEY = 'qhse-risks-list-cache';
+const RISKS_LIST_CACHE_KEY = `qhse-risks-list-cache:${tenantId}:${userId}`;
```

**Impact:** faible, cache local seulement.

---

## F) Plan de tests à ajouter

### Tests manuels
1. Créer compte/entreprise vierge A.
2. Première connexion A: dashboard = 0 partout où aucun enregistrement n’existe.
3. Vérifier modules vides: risques/incidents/actions/audits/FDS/équipements/formations/conformité/documents/alertes/notifications/rappels/recherche.
4. Logout/login A: mêmes zéros.
5. Créer compte B (vierge): vérifier isolation totale A/B.
6. Purger localStorage/sessionStorage: aucun changement fonctionnel des KPI serveur.
7. Activer/désactiver mode démo: vérifier qu’il n’impacte pas un tenant non démo.

### Tests automatisés (suggestion)
- Backend intégration:
  - `createUser` sans tenant => 400.
  - `dashboard/stats` d’un tenant vierge => tous compteurs à 0.
- Frontend unit:
  - `reconcileDashboardStatsWithLists` ne remplace pas des zéros API valides.
  - dashboard n’utilise `DASHBOARD_DEMO_LISTS` que sous condition explicite “tenant démo”.
- E2E:
  - flow signup compte vierge + assert KPI 0.
  - flow switch compte + assert absence de fuite cache UI.

---

## Conclusion demandée
1. **Cause racine la plus probable:** fallback implicite vers tenant démo + fallback dashboard démo + storage local non isolé.
2. **Fichiers à corriger d’abord:** `backend/src/services/users.service.js`, `src/pages/dashboard.js`, puis clés storage des modules.
3. **Corrections minimales recommandées:** supprimer fallback `DEFAULT_TENANT_ID` en runtime, conditionner strictement les données démo, namespace localStorage par tenant/user.
4. **Risques avant merge:** casser un ancien flux qui créait sans tenant explicite; nécessité de tests de non-régression login/switch-tenant/dashboard.
