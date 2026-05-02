import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QHSE Control API',
      version: '1.0.0',
      description:
        'API REST de la plateforme QHSE Control. JWT Bearer (access) ; le refresh est un cookie httpOnly `qhse_refresh` (SameSite=strict), posé au login et renvoyé par le navigateur avec credentials.\n\n' +
        '**Multi-tenant** : la plupart des routes sous `/api` exigent un **tenant résolu** (`req.qhseTenantId`) ; sinon **403** `{ "error": "Contexte organisation requis." }` (y compris si `REQUIRE_AUTH=false`). ' +
        'Fournir un **JWT** avec organisation valide, ou l’en-tête **`X-User-Id`** en développement/test (en production uniquement si `ALLOW_X_USER_ID=true`). ' +
        'Exceptions : `requireTenantContext.middleware.js` → `isApiTenantOptionalPath` (santé, auth, docs, stream document signé, `POST /fds/analyze`, `/automation/*`).',
      contact: {
        name: 'Support QHSE Control',
        email: 'support@qhsecontrol.com'
      }
    },
    servers: [{ url: '/api', description: 'Serveur principal' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT obtenu via POST /auth/login'
        }
      },
      parameters: {
        XUserId: {
          name: 'X-User-Id',
          in: 'header',
          required: false,
          schema: { type: 'string' },
          description:
            'Résolution session dev/test : id utilisateur Prisma. Ignoré en production sauf `ALLOW_X_USER_ID=true`. Complète ou remplace le Bearer pour `attachRequestUser`.'
        }
      },
      schemas: {
        Incident: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1234abc' },
            ref: { type: 'string', example: 'INC-001' },
            type: { type: 'string', example: 'Quasi-accident' },
            site: { type: 'string', example: 'Site Dakar' },
            severity: { type: 'string', enum: ['Faible', 'Moyen', 'Grave', 'Critique'] },
            status: { type: 'string', enum: ['open', 'in_progress', 'closed'] },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Risk: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', example: 'Risque chimique — Acide sulfurique' },
            category: { type: 'string', example: 'Risque chimique' },
            probability: { type: 'integer', minimum: 1, maximum: 5 },
            severity: { type: 'integer', minimum: 1, maximum: 5 },
            gravity: { type: 'integer', example: 12 },
            status: { type: 'string', enum: ['open', 'in_progress', 'closed'] }
          }
        },
        Action: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'string', enum: ['open', 'in_progress', 'done', 'cancelled'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            responsible: { type: 'string' }
          }
        },
        Audit: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            ref: { type: 'string' },
            title: { type: 'string' },
            type: { type: 'string' },
            score: { type: 'number', minimum: 0, maximum: 100 },
            status: { type: 'string', enum: ['planned', 'in_progress', 'completed', 'cancelled'] },
            plannedDate: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' }
          }
        }
      },
      responses: {
        TenantContextRequired: {
          description:
            'Aucune organisation active pour la requête (JWT sans tenant résolu, ou absence de `X-User-Id` en dev). Même schéma pour la plupart des routes métier ; exceptions documentées dans la description de l’API.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['error'],
                properties: {
                  error: {
                    type: 'string',
                    example: 'Contexte organisation requis.'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification et sessions' },
      { name: 'Incidents', description: 'Gestion des incidents SST' },
      { name: 'Risks', description: 'Registre des risques' },
      { name: 'Actions', description: "Plan d'actions correctives" },
      { name: 'Audits', description: 'Planification et suivi des audits' },
      { name: 'Dashboard', description: 'Indicateurs et statistiques' },
      {
        name: 'AuditLogs',
        description: 'Journal serveur (traçabilité) — filtre tenant implicite sauf rôle ADMIN avec `?tenantId=`'
      },
      { name: 'Conformity', description: 'Assistances et statuts conformité ISO' },
      {
        name: 'ComplianceAssist',
        description: 'Assistant analyse de documents (corps texte) — droit `compliance:read`'
      },
      { name: 'ControlledDocuments', description: 'Documents contrôlés et FDS produits' },
      { name: 'Export', description: 'Exports tabulaires (CSV) et rapports PDF' },
      { name: 'Habilitations', description: 'Registre des habilitations' },
      { name: 'Imports', description: 'Historique et prévisualisation d’imports' },
      { name: 'NonConformities', description: 'Non-conformités' },
      { name: 'PTW', description: 'Permis de travail (habilitation chantier)' },
      { name: 'Settings', description: 'Paramètres serveur (ADMIN)' },
      { name: 'Notifications', description: 'Flux notifications utilisateur' },
      { name: 'Reports', description: 'Synthèses et rapports périodiques' },
      { name: 'Sites', description: 'Sites industriels du tenant' },
      { name: 'Users', description: 'Annuaire membres de l’organisation' },
      {
        name: 'AI',
        description:
          'Mistral direct (`/ai/*`) et suggestions persistées (`/ai-suggestions/*`, droits `ai_suggestions`)'
      },
      { name: 'FDS', description: 'Analyse des fiches de donnees de securite' }
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Connexion utilisateur',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@client.tld' },
                    password: { type: 'string', example: 'motdepasse123' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description:
                'Connexion reussie. En-tête Set-Cookie : `qhse_refresh` (httpOnly). Corps JSON : access token uniquement (pas de refresh dans le body).',
              headers: {
                'Set-Cookie': {
                  description: 'Cookie httpOnly `qhse_refresh` (refresh JWT)',
                  schema: { type: 'string' }
                }
              },
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      token: { type: 'string', description: 'Alias de accessToken' },
                      expiresIn: { type: 'integer', example: 3600 },
                      user: { type: 'object' },
                      tenant: { type: 'object' },
                      tenants: { type: 'array' }
                    }
                  }
                }
              }
            },
            401: { description: 'Identifiants incorrects' }
          }
        }
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: "Rafraichir le token d'acces",
          description:
            'Le refresh JWT est lu depuis le cookie httpOnly `qhse_refresh`. Requête sans body ; le client doit envoyer `Cookie` (navigateur : `fetch` avec `credentials: include`).',
          security: [],
          parameters: [
            {
              in: 'cookie',
              name: 'qhse_refresh',
              required: true,
              schema: { type: 'string' },
              description: 'Refresh token (httpOnly, posé par POST /auth/login)'
            }
          ],
          responses: {
            200: {
              description:
                'Nouveau access token ; nouveau refresh dans Set-Cookie `qhse_refresh` (rotation).',
              headers: {
                'Set-Cookie': {
                  schema: { type: 'string' }
                }
              },
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      token: { type: 'string' },
                      expiresIn: { type: 'integer', example: 3600 }
                    }
                  }
                }
              }
            },
            401: { description: 'Refresh token invalide ou expire' }
          }
        }
      },
      '/incidents': {
        get: {
          tags: ['Incidents'],
          summary: 'Lister tous les incidents',
          parameters: [
            { $ref: '#/components/parameters/XUserId' },
            { name: 'siteId', in: 'query', schema: { type: 'string' } },
            { name: 'severity', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } }
          ],
          responses: {
            200: {
              description: 'Liste des incidents',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/Incident' } }
                    }
                  }
                }
              }
            },
            401: { description: 'Non authentifie' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        },
        post: {
          tags: ['Incidents'],
          summary: 'Declarer un nouvel incident',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'site', 'severity'],
                  properties: {
                    type: { type: 'string', example: 'Quasi-accident' },
                    site: { type: 'string', example: 'Site Abidjan' },
                    severity: { type: 'string', enum: ['Faible', 'Moyen', 'Grave', 'Critique'] },
                    description: { type: 'string' },
                    responsible: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Incident cree',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Incident' } }
              }
            },
            422: {
              description: 'Donnees invalides',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
            },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/risks': {
        get: {
          tags: ['Risks'],
          summary: 'Lister les risques',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste des risques' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        },
        post: {
          tags: ['Risks'],
          summary: 'Creer un risque',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    probability: { type: 'integer', minimum: 1, maximum: 5 },
                    severity: { type: 'integer', minimum: 1, maximum: 5 }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Risque cree' },
            422: { description: 'Validation echouee' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/actions': {
        get: {
          tags: ['Actions'],
          summary: 'Lister les actions',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'OK' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        },
        post: {
          tags: ['Actions'],
          summary: 'Creer une action',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    dueDate: { type: 'string', format: 'date-time' },
                    responsible: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Action creee' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/dashboard/stats': {
        get: {
          tags: ['Dashboard'],
          summary: 'Indicateurs tableau de bord (KPI)',
          description:
            'Compteurs et agrégations par site / organisation — même logique que `GET /dashboard`.',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Statistiques JSON' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/ai-suggestions': {
        get: {
          tags: ['AI'],
          summary: 'Lister les suggestions IA (persistées)',
          parameters: [
            { $ref: '#/components/parameters/XUserId' },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50 },
              description: 'Nombre max. de lignes'
            },
            { name: 'status', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Tableau de suggestions' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/ai-suggestions/generate': {
        post: {
          tags: ['AI'],
          summary: 'Générer une suggestion IA',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: 'generic' },
                    context: { type: 'object' },
                    targetIncidentId: { type: 'string', nullable: true },
                    targetAuditId: { type: 'string', nullable: true }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Suggestion créée' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/audit-logs': {
        get: {
          tags: ['AuditLogs'],
          summary: 'Journal d’audit (pagination)',
          parameters: [
            { $ref: '#/components/parameters/XUserId' },
            { name: 'take', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Alias de take' },
            { name: 'skip', in: 'query', schema: { type: 'integer', default: 0 } },
            {
              name: 'tenantId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Réservé **ADMIN** : filtrer sur une organisation'
            }
          ],
          responses: {
            200: {
              description: '{ items, total, skip, take }',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      items: { type: 'array', items: { type: 'object' } },
                      total: { type: 'integer' },
                      skip: { type: 'integer' },
                      take: { type: 'integer' }
                    }
                  }
                }
              }
            },
            401: { description: 'Authentification requise (si REQUIRE_AUTH=true)' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/audits': {
        get: {
          tags: ['Audits'],
          summary: 'Lister les audits',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'OK' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        },
        post: {
          tags: ['Audits'],
          summary: 'Creer un audit',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    type: { type: 'string' },
                    plannedDate: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Audit cree' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/audits/{id}/pdf': {
        get: {
          tags: ['Audits'],
          summary: 'Telecharger le rapport PDF',
          parameters: [
            { $ref: '#/components/parameters/XUserId' },
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Fichier PDF', content: { 'application/pdf': {} } },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/export/incidents': {
        get: {
          tags: ['Export'],
          summary: 'Exporter les incidents en CSV',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: {
              description: 'Fichier CSV (UTF-8, séparateur ;)',
              content: {
                'text/csv': {}
              }
            },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/ai/incident-causes': {
        post: {
          tags: ['AI'],
          summary: 'Suggestions causes racines pour un incident',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Incident' } } }
          },
          responses: {
            200: {
              description: 'Suggestions IA',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { suggestion: { type: 'string' } }
                  }
                }
              }
            },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/sites': {
        get: {
          tags: ['Sites'],
          summary: 'Lister les sites',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste des sites' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Lister les membres du tenant',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste des utilisateurs' },
            401: { description: 'Si REQUIRE_AUTH=true' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Flux de notifications',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste de notifications' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/conformity': {
        get: {
          tags: ['Conformity'],
          summary: 'Statuts de conformité (exigences ISO)',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Référentiel / statuts' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/reports/summary': {
        get: {
          tags: ['Reports'],
          summary: 'Synthèse pilotage',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Agrégats JSON' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/nonconformities': {
        get: {
          tags: ['NonConformities'],
          summary: 'Lister les non-conformités',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/imports': {
        get: {
          tags: ['Imports'],
          summary: 'Historique des imports',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste des imports' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/habilitations': {
        get: {
          tags: ['Habilitations'],
          summary: 'Lister les habilitations',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/ptw': {
        get: {
          tags: ['PTW'],
          summary: 'Lister les permis de travail',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/settings/email-notifications': {
        get: {
          tags: ['Settings'],
          summary: 'Lire la config e-mail (ADMIN)',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Configuration' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/compliance/analyze-assist': {
        post: {
          tags: ['ComplianceAssist'],
          summary: 'Assistant analyse document ISO',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Extrait à analyser' },
                    fileName: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Analyse structurée' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/controlled-documents': {
        get: {
          tags: ['ControlledDocuments'],
          summary: 'Lister les documents contrôlés',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: { description: 'Liste' },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/export/risks': {
        get: {
          tags: ['Export'],
          summary: 'Export CSV des risques',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: {
              description: 'Fichier CSV (UTF-8, séparateur ;)',
              content: {
                'text/csv': {}
              }
            },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/export/actions': {
        get: {
          tags: ['Export'],
          summary: 'Export CSV des actions',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: {
              description: 'Fichier CSV (UTF-8, séparateur ;)',
              content: {
                'text/csv': {}
              }
            },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/export/audits': {
        get: {
          tags: ['Export'],
          summary: 'Export CSV des audits',
          parameters: [{ $ref: '#/components/parameters/XUserId' }],
          responses: {
            200: {
              description: 'Fichier CSV (UTF-8, séparateur ;)',
              content: {
                'text/csv': {}
              }
            },
            403: { $ref: '#/components/responses/TenantContextRequired' }
          }
        }
      },
      '/fds/analyze': {
        post: {
          tags: ['FDS'],
          summary: 'Analyser une fiche de donnees de securite PDF',
          description:
            'Analyse PDF sans persistance — **exemptée** du contrôle tenant global (pas de 403 « contexte organisation » pour absence de tenant).',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { fds: { type: 'string', format: 'binary' } }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Analyse FDS',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      productName: { type: 'string' },
                      dangerLabelsFound: { type: 'array', items: { type: 'string' } },
                      episRequired: { type: 'array', items: { type: 'string' } },
                      severity: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);
