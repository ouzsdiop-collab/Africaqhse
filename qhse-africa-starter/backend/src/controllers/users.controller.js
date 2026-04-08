import * as usersService from '../services/users.service.js';
import {
  clampTrimString,
  FIELD_LIMITS,
  isValidEmailBasic,
  validatePasswordPolicy
} from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';

const ROLES = new Set(['ADMIN', 'QHSE', 'DIRECTION', 'ASSISTANT', 'TERRAIN']);

function isValidRole(role) {
  return typeof role === 'string' && ROLES.has(role.trim().toUpperCase());
}

function queryFlagTrue(req, key) {
  const raw = req.query && req.query[key];
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== 'string') return false;
  const v = s.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export async function getAll(req, res, next) {
  try {
    const items = await usersService.findAllUsers(req.qhseTenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const user = await usersService.findUserById(req.qhseTenantId, req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const name = clampTrimString(req.body.name, FIELD_LIMITS.userName);
    const email =
      typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';
    const roleRaw = typeof req.body.role === 'string' ? req.body.role.trim().toUpperCase() : '';

    if (!name || !email) {
      return res.status(400).json({ error: 'Champs requis : name, email' });
    }
    if (!isValidEmailBasic(email)) {
      return res.status(400).json({ error: 'Format e-mail invalide' });
    }
    if (!isValidRole(roleRaw)) {
      return res.status(400).json({
        error: `Rôle invalide — valeurs : ${[...ROLES].join(', ')}`
      });
    }

    const passwordRaw =
      typeof req.body.password === 'string' ? req.body.password : '';
    if (passwordRaw.length > 0) {
      const pv = validatePasswordPolicy(passwordRaw);
      if (!pv.ok) return res.status(400).json({ error: pv.error });
    }

    const created = await usersService.createUser(req.qhseTenantId, {
      name,
      email,
      role: roleRaw,
      password: passwordRaw.length ? passwordRaw : null
    });
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'users',
      resourceId: created.id,
      action: 'create',
      metadata: { email: created.email, role: created.role }
    });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    next(err);
  }
}

export async function patchById(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      return res.status(400).json({ error: 'Identifiant requis' });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const name = body.name != null ? clampTrimString(body.name, FIELD_LIMITS.userName) : undefined;
    const roleRaw =
      typeof body.role === 'string' ? body.role.trim().toUpperCase() : undefined;
    const passwordRaw = typeof body.password === 'string' ? body.password : '';
    if (passwordRaw.length > 0) {
      const pv = validatePasswordPolicy(passwordRaw);
      if (!pv.ok) return res.status(400).json({ error: pv.error });
    }
    const hasPassword = passwordRaw.length > 0;

    if (
      (name === undefined || name === '') &&
      (roleRaw === undefined || roleRaw === '') &&
      !hasPassword
    ) {
      return res.status(400).json({ error: 'Fournir au moins name, role ou password' });
    }
    if (roleRaw !== undefined && roleRaw !== '' && !isValidRole(roleRaw)) {
      return res.status(400).json({
        error: `Rôle invalide — valeurs : ${[...ROLES].join(', ')}`
      });
    }

    const patch = {};
    if (name != null && name !== '') patch.name = name;
    if (roleRaw != null && roleRaw !== '') patch.role = roleRaw;
    if (hasPassword) patch.password = passwordRaw;

    const updated = await usersService.updateUserInTenant(req.qhseTenantId, id, patch);
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'users',
      resourceId: id,
      action: 'update',
      metadata: {
        patch: Object.keys(patch).filter((k) => k !== 'password'),
        passwordSet: hasPassword
      }
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      return res.status(400).json({ error: 'Identifiant requis' });
    }
    const selfId =
      req.qhseUser && typeof req.qhseUser.id === 'string' ? req.qhseUser.id.trim() : '';
    if (selfId && id === selfId) {
      return res.status(403).json({
        error: 'Impossible de retirer votre propre compte depuis cette action.'
      });
    }
    const unassignActions = queryFlagTrue(req, 'unassignActions');
    await usersService.removeUserFromTenant(req.qhseTenantId, id, { unassignActions });
    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'users',
      resourceId: id,
      action: 'delete',
      metadata: { unassignActions }
    });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    if (err.statusCode === 409) {
      return res.status(409).json({
        error: err.message,
        code: err.code,
        assignedActionCount:
          typeof err.assignedActionCount === 'number' ? err.assignedActionCount : undefined
      });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
