import * as auditsService from './audits.service.js';
import * as incidentsService from './incidents.service.js';
import * as auditAutoReport from './auditAutoReport.service.js';
import { can } from '../lib/permissions.js';

/**
 * @param {string | undefined} s
 */
function normalizeIncidentSeverity(s) {
  const t = String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  if (t.includes('critique')) return 'critique';
  if (t.includes('faible')) return 'faible';
  return 'moyen';
}

/**
 * Score audit 0–100 : évite parseInt sur « 82.5 » ou concaténations type « 82 » + « 3 ».
 * @param {unknown} raw
 * @returns {number}
 */
function parseAuditScore(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.round(raw);
  }
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.');
  const asFloat = parseFloat(s);
  if (!Number.isNaN(asFloat)) {
    return Math.round(asFloat);
  }
  const m = s.match(/\d{1,3}/);
  return m ? parseInt(m[0], 10) : NaN;
}

/**
 * Valide un brouillon importé et crée l’entité via les services métier existants.
 * @param {{
 *   tenantId: string | null | undefined,
 *   targetModule: string,
 *   validatedData: Record<string, unknown>,
 *   role: string | null | undefined
 * }} input
 * @returns {Promise<{
 *   success: boolean,
 *   moduleCreated?: string,
 *   createdEntityId?: string,
 *   createdEntityRef?: string,
 *   warnings: string[]
 * }>}
 */
export async function confirmValidatedImport(input) {
  const warnings = [];
  const tenantId = input.tenantId;
  const targetModule = String(input.targetModule ?? '').trim().toLowerCase();
  const data = input.validatedData;
  const role = input.role;

  if (
    !targetModule ||
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    return {
      success: false,
      warnings: ['Requête invalide : targetModule et validatedData (objet) requis.']
    };
  }

  if (targetModule === 'products' || targetModule === 'iso') {
    return {
      success: false,
      moduleCreated: targetModule,
      warnings: [
        'Aucune table Prisma pour Produits/FDS ou ISO/SMS dans cette version — création en base indisponible. Utilisez la copie JSON ou une saisie manuelle.'
      ]
    };
  }

  if (targetModule === 'audits') {
    if (role != null && role !== undefined && !can(role, 'audits', 'write')) {
      return {
        success: false,
        warnings: ['Permission « audits » en écriture requise pour créer un audit.']
      };
    }
    const ref = String(data.ref ?? '').trim();
    const site = String(data.site ?? '').trim();
    const score = parseAuditScore(data.score);
    const status = String(data.status ?? '').trim();
    if (!ref || !site || Number.isNaN(score) || !status) {
      return {
        success: false,
        warnings: ['Champs requis pour un audit : ref, site, score, status.']
      };
    }
    if (score < 0 || score > 100) {
      return {
        success: false,
        warnings: ['Le score doit être entre 0 et 100.']
      };
    }
    let checklist = data.checklist;
    if (checklist !== undefined && checklist !== null) {
      if (typeof checklist !== 'object') {
        checklist = undefined;
      }
    } else {
      checklist = undefined;
    }
    try {
      const created = await auditsService.createAudit(tenantId, {
        ref,
        site,
        score,
        status,
        checklist
      });
      const delivery = await auditAutoReport.trySendFinalAuditReport(null, created);
      const payload =
        delivery.sent && delivery.audit ? delivery.audit : created;
      if (delivery.sent === false && delivery.reason) {
        warnings.push(`Rapport automatique non envoyé : ${delivery.reason}`);
      }
      return {
        success: true,
        moduleCreated: 'audits',
        createdEntityId: payload.id,
        createdEntityRef: payload.ref,
        warnings
      };
    } catch (err) {
      if (err && err.code === 'P2002') {
        return {
          success: false,
          warnings: ['Référence audit déjà utilisée.']
        };
      }
      throw err;
    }
  }

  if (targetModule === 'incidents') {
    if (role != null && role !== undefined && !can(role, 'incidents', 'write')) {
      return {
        success: false,
        warnings: ['Permission « incidents » en écriture requise pour créer un incident.']
      };
    }
    const type = String(data.type ?? '').trim();
    const site = String(data.site ?? '').trim();
    const severityRaw = String(data.severity ?? data.gravite ?? '').trim();
    const severity = normalizeIncidentSeverity(severityRaw);
    const description =
      data.description != null && String(data.description).trim() !== ''
        ? String(data.description).trim().slice(0, 2000)
        : undefined;
    if (!type || !site || !severityRaw) {
      return {
        success: false,
        warnings: ['Champs requis pour un incident : type, site, gravité (severity ou gravite).']
      };
    }
    const ref = await incidentsService.computeNextIncidentRef(tenantId);
    const created = await incidentsService.createIncident(tenantId, {
      ref,
      type,
      site,
      severity,
      description,
      status: 'Nouveau'
    });
    return {
      success: true,
      moduleCreated: 'incidents',
      createdEntityId: created.id,
      createdEntityRef: created.ref,
      warnings
    };
  }

  return {
    success: false,
    warnings: [`Module cible non pris en charge : ${targetModule}`]
  };
}
