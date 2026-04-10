import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AfricaQHSE API',
      version: '1.0.0',
      description:
        'API REST de la plateforme de pilotage QHSE AfricaQHSE. Authentification par JWT Bearer token.',
      contact: {
        name: 'Support AfricaQHSE',
        email: 'support@africaqhse.com'
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
      { name: 'Export', description: 'Exports Excel et PDF' },
      { name: 'AI', description: 'Suggestions et analyses IA' },
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
                    email: { type: 'string', format: 'email', example: 'admin@africaqhse.com' },
                    password: { type: 'string', example: 'motdepasse123' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Connexion reussie',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                      expiresIn: { type: 'integer', example: 3600 }
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
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: { refreshToken: { type: 'string' } }
                }
              }
            }
          },
          responses: {
            200: { description: 'Nouveau token genere' },
            401: { description: 'Refresh token invalide ou expire' }
          }
        }
      },
      '/incidents': {
        get: {
          tags: ['Incidents'],
          summary: 'Lister tous les incidents',
          parameters: [
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
            401: { description: 'Non authentifie' }
          }
        },
        post: {
          tags: ['Incidents'],
          summary: 'Declarer un nouvel incident',
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
            }
          }
        }
      },
      '/risks': {
        get: {
          tags: ['Risks'],
          summary: 'Lister les risques',
          responses: { 200: { description: 'Liste des risques' } }
        },
        post: {
          tags: ['Risks'],
          summary: 'Creer un risque',
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
            422: { description: 'Validation echouee' }
          }
        }
      },
      '/actions': {
        get: { tags: ['Actions'], summary: 'Lister les actions', responses: { 200: { description: 'OK' } } },
        post: {
          tags: ['Actions'],
          summary: 'Creer une action',
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
          responses: { 201: { description: 'Action creee' } }
        }
      },
      '/audits': {
        get: { tags: ['Audits'], summary: 'Lister les audits', responses: { 200: { description: 'OK' } } },
        post: {
          tags: ['Audits'],
          summary: 'Creer un audit',
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
          responses: { 201: { description: 'Audit cree' } }
        }
      },
      '/audits/{id}/pdf': {
        get: {
          tags: ['Audits'],
          summary: 'Telecharger le rapport PDF',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Fichier PDF', content: { 'application/pdf': {} } }
          }
        }
      },
      '/export/incidents': {
        get: {
          tags: ['Export'],
          summary: 'Exporter les incidents en Excel',
          responses: {
            200: {
              description: 'Fichier Excel',
              content: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {}
              }
            }
          }
        }
      },
      '/ai/incident-causes': {
        post: {
          tags: ['AI'],
          summary: 'Suggestions causes racines pour un incident',
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
            }
          }
        }
      },
      '/fds/analyze': {
        post: {
          tags: ['FDS'],
          summary: 'Analyser une fiche de donnees de securite PDF',
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
