import fs from 'fs';
import path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_FILE = path.join(process.cwd(), 'data', 'leads.json');

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    console.log('No data/leads.json found to migrate.');
    return;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const leads = JSON.parse(raw);
  console.log(`Found ${leads.length} leads in data/leads.json. Starting migration...`);

  let imported = 0;
  for (const lead of leads) {
    try {
      await prisma.lead.upsert({
        where: { placeId: lead.placeId || lead.id },
        update: {
          businessName: lead.businessName,
          category: lead.category,
          address: lead.address,
          city: lead.city,
          phone: lead.phone,
          rating: lead.rating || 0,
          reviewCount: lead.reviewCount || 0,
          website: lead.website || null,
          googleMapsUrl: lead.googleMapsUrl || '',
          opportunityScore: lead.opportunityScore || 0,
          stage: lead.pipeline?.stage || 'DISCOVERED',
          scoreBreakdown: (lead.scoreBreakdown || []) as unknown as Prisma.InputJsonValue,
          phoneIntelligence: (lead.phoneIntelligence || {}) as unknown as Prisma.InputJsonValue,
          ownerDiscovery: (lead.ownerDiscovery || {}) as unknown as Prisma.InputJsonValue,
          websiteAudit: (lead.websiteAudit || {}) as unknown as Prisma.InputJsonValue,
          outreach: (lead.outreach || null) as unknown as Prisma.InputJsonValue,
          reviews: (lead.reviews || []) as unknown as Prisma.InputJsonValue,
        },
        create: {
          id: lead.id,
          placeId: lead.placeId || lead.id,
          businessName: lead.businessName,
          category: lead.category,
          address: lead.address,
          city: lead.city,
          phone: lead.phone,
          rating: lead.rating || 0,
          reviewCount: lead.reviewCount || 0,
          website: lead.website || null,
          googleMapsUrl: lead.googleMapsUrl || '',
          opportunityScore: lead.opportunityScore || 0,
          stage: lead.pipeline?.stage || 'DISCOVERED',
          scoreBreakdown: (lead.scoreBreakdown || []) as unknown as Prisma.InputJsonValue,
          phoneIntelligence: (lead.phoneIntelligence || {}) as unknown as Prisma.InputJsonValue,
          ownerDiscovery: (lead.ownerDiscovery || {}) as unknown as Prisma.InputJsonValue,
          websiteAudit: (lead.websiteAudit || {}) as unknown as Prisma.InputJsonValue,
          outreach: (lead.outreach || null) as unknown as Prisma.InputJsonValue,
          reviews: (lead.reviews || []) as unknown as Prisma.InputJsonValue,
        },
      });
      imported++;
    } catch (err) {
      console.error(`Error importing lead ${lead.businessName}:`, err);
    }
  }

  console.log(`Successfully migrated ${imported}/${leads.length} leads into PostgreSQL.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
