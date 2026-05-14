import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (process.env.ALLOW_DEMO_SEED !== "true") {
  throw new Error("Demo seed disabled. Set ALLOW_DEMO_SEED=true to continue.");
}

const prisma = new PrismaClient();

const TENANT = {
  slug: 'sahelgaz-energie-demo',
  name: 'SahelGaz Énergie',
  status: 'active',
  settings: {
    plan: 'business',
    sector: 'Gaz / énergie',
    region: 'Afrique de l’Ouest',
    country: 'Sénégal',
    source: 'demo_seed'
  }
};

const ADMIN = {
  firstName: 'Aminata',
  lastName: 'Diop',
  email: 'admin@sahelgaz-demo.com',
  password: 'DemoGaz2026!',
  role: 'CLIENT_ADMIN'
};

const sites = [
  'Siège administratif - Dakar',
  'Station de détente gaz - Diamniadio',
  'Dépôt bouteilles GPL - Rufisque',
  'Atelier maintenance - Thiès',
  'Zone intervention réseau - Dakar Plateau',
  'Poste énergie industriel - Zone portuaire'
];

const services = [
  'Direction générale',
  'QHSE',
  'Exploitation gaz',
  'Maintenance réseau',
  'Distribution GPL',
  'Atelier technique',
  'Environnement',
  'Astreinte intervention'
];

const risks = [
  'Fuite gaz sur poste de détente',
  'Atmosphère explosive en zone ATEX',
  'Travaux par point chaud sans permis feu complet',
  'Surpression sur canalisation gaz',
  'Défaillance détecteur gaz',
  'Manutention manuelle de bouteilles GPL',
  'Incendie dépôt bouteilles',
  'Asphyxie en espace confiné',
  'Brûlure thermique lors maintenance brûleur',
  'Électrisation sur coffret de régulation',
  'Chute de hauteur sur toiture local technique',
  'Accident circulation véhicule d’intervention',
  'Pollution sol par fuite huile compresseur',
  'Exposition au bruit local compression',
  'Non-disponibilité FDS produit odorant'
];

const products = [
  'Gaz naturel',
  'GPL propane',
  'GPL butane',
  'THT odorant gaz',
  'Huile compresseur',
  'Graisse mécanique',
  'Nettoyant dégraissant',
  'Azote comprimé',
  'Peinture anticorrosion',
  'Absorbant hydrocarbures'
];

const incidents = [
  'Odeur gaz signalée avant intervention sur coffret',
  'Détecteur gaz non étalonné détecté lors prise de poste',
  'Départ de flamme mineur pendant opération de meulage',
  'Fuite d’huile compresseur sur rétention saturée',
  'Chute sans gravité lors descente véhicule atelier',
  'Bouteille GPL mal arrimée détectée au dépôt'
];

const audits = [
  'Audit ATEX station détente gaz',
  'Contrôle permis feu atelier maintenance',
  'Vérification détecteurs gaz',
  'Inspection dépôt bouteilles GPL',
  'Audit FDS produits chimiques',
  'Contrôle extincteurs',
  'Exercice évacuation fuite gaz',
  'Audit ISO 45001 interne',
  'Inspection rétentions environnement'
];

const actions = [
  'Mettre à jour le DRPCE station détente',
  'Remplacer deux détecteurs gaz non conformes',
  'Former les techniciens au permis feu',
  'Mettre à jour les FDS GPL et THT',
  'Réaliser exercice fuite gaz avec évacuation',
  'Installer affichage ATEX zone 1 / zone 2',
  'Contrôler les bacs de rétention atelier',
  'Créer procédure intervention isolée terrain'
];

function toCode(prefix, i) {
  return `${prefix}-${String(i + 1).padStart(2, '0')}`;
}

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN.password, 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT.slug },
    create: TENANT,
    update: { name: TENANT.name, status: TENANT.status, settings: TENANT.settings }
  });

  const admin = await prisma.user.upsert({
    where: { email: ADMIN.email },
    create: {
      name: `${ADMIN.firstName} ${ADMIN.lastName}`,
      email: ADMIN.email,
      role: ADMIN.role,
      passwordHash,
      status: 'ACTIVE',
      isActive: true,
      mustChangePassword: false
    },
    update: {
      name: `${ADMIN.firstName} ${ADMIN.lastName}`,
      role: ADMIN.role,
      passwordHash,
      status: 'ACTIVE',
      isActive: true,
      mustChangePassword: false
    }
  });

  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: admin.id } },
    create: { tenantId: tenant.id, userId: admin.id, role: ADMIN.role },
    update: { role: ADMIN.role }
  });

  const siteRows = [];
  for (const [i, name] of sites.entries()) {
    const row = await prisma.site.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: toCode('SG', i) } },
      create: { tenantId: tenant.id, code: toCode('SG', i), name, address: 'Sénégal' },
      update: { name, address: 'Sénégal' }
    });
    siteRows.push(row);
  }

  for (const [i, title] of risks.entries()) {
    const site = siteRows[i % siteRows.length];
    const severity = (i % 5) + 1;
    const probability = ((i + 2) % 5) + 1;
    await prisma.risk.upsert({
      where: { tenantId_ref: { tenantId: tenant.id, ref: toCode('RISK-SG', i) } },
      create: {
        tenantId: tenant.id,
        ref: toCode('RISK-SG', i),
        title,
        description: `Risque opérationnel SahelGaz (${services[i % services.length]}). source=demo_seed`,
        category: 'Gaz / énergie',
        severity,
        probability,
        gp: severity * probability,
        status: 'open',
        owner: services[i % services.length],
        siteId: site.id
      },
      update: {
        title,
        description: `Risque opérationnel SahelGaz (${services[i % services.length]}). source=demo_seed`,
        category: 'Gaz / énergie',
        severity,
        probability,
        gp: severity * probability,
        status: 'open',
        owner: services[i % services.length],
        siteId: site.id
      }
    });
  }

  for (const [i, name] of products.entries()) {
    const site = siteRows[i % siteRows.length];
    const existing = await prisma.product.findFirst({ where: { tenantId: tenant.id, name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { siteId: site.id, supplier: 'SahelGaz Énergie' } });
    } else {
      await prisma.product.create({
        data: { tenantId: tenant.id, name, siteId: site.id, supplier: 'SahelGaz Énergie', storageClass: 'source=demo_seed' }
      });
    }
  }

  for (const [i, desc] of incidents.entries()) {
    const site = siteRows[i % siteRows.length];
    await prisma.incident.upsert({
      where: { tenantId_ref: { tenantId: tenant.id, ref: toCode('INC-SG', i) } },
      create: {
        tenantId: tenant.id,
        ref: toCode('INC-SG', i),
        type: 'Sécurité',
        site: site.name,
        siteId: site.id,
        severity: i % 2 === 0 ? 'Majeur' : 'Modéré',
        description: `${desc} (source=demo_seed)`,
        status: 'Nouveau'
      },
      update: {
        type: 'Sécurité',
        site: site.name,
        siteId: site.id,
        severity: i % 2 === 0 ? 'Majeur' : 'Modéré',
        description: `${desc} (source=demo_seed)`,
        status: 'Nouveau'
      }
    });
  }

  for (const [i, label] of audits.entries()) {
    const site = siteRows[i % siteRows.length];
    await prisma.audit.upsert({
      where: { tenantId_ref: { tenantId: tenant.id, ref: toCode('AUD-SG', i) } },
      create: {
        tenantId: tenant.id,
        ref: toCode('AUD-SG', i),
        site: site.name,
        siteId: site.id,
        score: 70 + (i % 15),
        status: i < 6 ? 'Réalisé' : 'Planifié',
        checklist: { source: 'demo_seed', title: label }
      },
      update: {
        site: site.name,
        siteId: site.id,
        score: 70 + (i % 15),
        status: i < 6 ? 'Réalisé' : 'Planifié',
        checklist: { source: 'demo_seed', title: label }
      }
    });
  }

  for (const [i, title] of actions.entries()) {
    const site = siteRows[i % siteRows.length];
    const existing = await prisma.action.findFirst({ where: { tenantId: tenant.id, title } });
    const data = {
      tenantId: tenant.id,
      title,
      detail: `Action corrective SahelGaz (${services[i % services.length]}). source=demo_seed`,
      status: i < 3 ? 'À lancer' : i < 6 ? 'En cours' : 'Clôturée',
      owner: services[i % services.length],
      siteId: site.id,
      assigneeId: admin.id
    };
    if (existing) await prisma.action.update({ where: { id: existing.id }, data });
    else await prisma.action.create({ data });
  }

  console.log('[seed-demo-sahelgaz] OK');
  console.log(`tenant=${tenant.slug} id=${tenant.id}`);
  console.log(`admin=${ADMIN.email}`);
  console.log(`password=${ADMIN.password}`);
  console.log('counts:', {
    sites: sites.length,
    services: services.length,
    risks: risks.length,
    products: products.length,
    incidents: incidents.length,
    audits: audits.length,
    actions: actions.length
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('[seed-demo-sahelgaz] failed', err);
    await prisma.$disconnect();
    process.exit(1);
  });
