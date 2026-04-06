import * as usersService from '../services/users.service.js';
import {
  clampTrimString,
  FIELD_LIMITS,
  isValidEmailBasic
} from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';

const ROLES = new Set(['ADMIN', 'QHSE', 'DIRECTION', 'ASSISTANT', 'TERRAIN']);

function isValidRole(role) {
  return typeof role === 'string' && ROLES.has(role.trim().toUpperCase());
}

export async function getAll(req, res, next) {
  try {
    const items = await usersService.findAllUsers();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const user = await usersService.findUserById(req.params.id);
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

    const created = await usersService.createUser({
      name,
      email,
      role: roleRaw
    });
    void writeAuditLog({
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
