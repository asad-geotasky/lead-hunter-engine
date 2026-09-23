import fs from 'fs';
import path from 'path';
import { Lead, PipelineStage } from '@/types/lead';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'leads.json');

const hasDbConnection = !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function getLocalLeads(): Lead[] {
  try {
    ensureDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content) as Lead[];
  } catch (err) {
    console.error('Error reading local leads:', err);
    return [];
  }
}

function saveLocalLeads(leads: Lead[]): void {
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local leads:', err);
  }
}

// Transform Prisma record to domain Lead model
function mapDbRecordToLead(record: any): Lead {
  return {
    id: record.id,
    placeId: record.placeId,
    businessName: record.businessName,
    category: record.category,
    address: record.address,
    city: record.city,
    phone: record.phone,
    rating: record.rating,
    reviewCount: record.reviewCount,
    website: record.website,
    googleMapsUrl: record.googleMapsUrl,
    opportunityScore: record.opportunityScore,
    scoreBreakdown: (record.scoreBreakdown || []) as Lead['scoreBreakdown'],
    phoneIntelligence: (record.phoneIntelligence || {}) as Lead['phoneIntelligence'],
    ownerDiscovery: (record.ownerDiscovery || {}) as Lead['ownerDiscovery'],
    websiteAudit: (record.websiteAudit || {}) as Lead['websiteAudit'],
    outreach: record.outreach ? (record.outreach as Lead['outreach']) : undefined,
    reviews: (record.reviews || []) as Lead['reviews'],
    pipeline: {
      stage: record.stage as PipelineStage,
      notes: record.notes?.map((n: any) => n.content) || [],
      callLogs: record.callLogs?.map((c: any) => ({
        date: c.createdAt.toISOString(),
        summary: c.summary,
        outcome: c.outcome,
      })) || [],
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getAllLeads(filter?: {
  stage?: PipelineStage;
  noWebsite?: boolean;
  minScore?: number;
  search?: string;
}): Promise<Lead[]> {
  if (hasDbConnection) {
    try {
      const where: any = {};

      if (filter?.stage) {
        where.stage = filter.stage;
      }
      if (filter?.noWebsite) {
        where.OR = [{ website: null }, { website: '' }];
      }
      if (filter?.minScore && filter.minScore > 0) {
        where.opportunityScore = { gte: filter.minScore };
      }
      if (filter?.search) {
        where.OR = [
          { businessName: { contains: filter.search, mode: 'insensitive' } },
          { city: { contains: filter.search, mode: 'insensitive' } },
          { category: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const records = await prisma.lead.findMany({
        where,
        include: { notes: true, callLogs: true },
        orderBy: { opportunityScore: 'desc' },
      });

      return records.map(mapDbRecordToLead);
    } catch (err) {
      console.warn('Prisma query failed, falling back to local storage:', err);
    }
  }

  // Fallback to local storage
  let leads = getLocalLeads();

  if (filter?.stage) {
    leads = leads.filter((l) => l.pipeline.stage === filter.stage);
  }
  if (filter?.noWebsite) {
    leads = leads.filter((l) => !l.website);
  }
  if (filter?.minScore && filter.minScore > 0) {
    leads = leads.filter((l) => l.opportunityScore >= filter.minScore!);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.businessName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
    );
  }

  leads.sort((a, b) => b.opportunityScore - a.opportunityScore);
  return leads;
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (hasDbConnection) {
    try {
      const record = await prisma.lead.findUnique({
        where: { id },
        include: { notes: true, callLogs: true },
      });
      if (record) return mapDbRecordToLead(record);
    } catch (err) {
      console.warn('Prisma lookup failed, falling back to local file:', err);
    }
  }

  const leads = getLocalLeads();
  return leads.find((l) => l.id === id) || null;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  if (hasDbConnection) {
    try {
      const dataToUpdate: any = {};
      if (updates.businessName !== undefined) dataToUpdate.businessName = updates.businessName;
      if (updates.phone !== undefined) dataToUpdate.phone = updates.phone;
      if (updates.website !== undefined) dataToUpdate.website = updates.website;
      if (updates.opportunityScore !== undefined) dataToUpdate.opportunityScore = updates.opportunityScore;
      if (updates.pipeline?.stage !== undefined) dataToUpdate.stage = updates.pipeline.stage;
      if (updates.scoreBreakdown !== undefined) dataToUpdate.scoreBreakdown = updates.scoreBreakdown as unknown as Prisma.InputJsonValue;
      if (updates.phoneIntelligence !== undefined) dataToUpdate.phoneIntelligence = updates.phoneIntelligence as unknown as Prisma.InputJsonValue;
      if (updates.ownerDiscovery !== undefined) dataToUpdate.ownerDiscovery = updates.ownerDiscovery as unknown as Prisma.InputJsonValue;
      if (updates.websiteAudit !== undefined) dataToUpdate.websiteAudit = updates.websiteAudit as unknown as Prisma.InputJsonValue;
      if (updates.outreach !== undefined) dataToUpdate.outreach = updates.outreach as unknown as Prisma.InputJsonValue;

      const record = await prisma.lead.update({
        where: { id },
        data: dataToUpdate,
        include: { notes: true, callLogs: true },
      });

      return mapDbRecordToLead(record);
    } catch (err) {
      console.warn('Prisma update failed, falling back to local storage:', err);
    }
  }

  // Fallback to local
  const leads = getLocalLeads();
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const existing = leads[index];
  const updated: Lead = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  leads[index] = updated;
  saveLocalLeads(leads);
  return updated;
}

export async function upsertLeads(
  newLeads: Lead[]
): Promise<{ added: number; updated: number; total: number }> {
  if (hasDbConnection) {
    try {
      let added = 0;
      let updated = 0;

      for (const lead of newLeads) {
        const placeId = lead.placeId || lead.id;
        const exists = await prisma.lead.findUnique({ where: { placeId } });

        if (exists) {
          await prisma.lead.update({
            where: { placeId },
            data: {
              rating: lead.rating,
              reviewCount: lead.reviewCount,
              opportunityScore: lead.opportunityScore,
              scoreBreakdown: (lead.scoreBreakdown || []) as unknown as Prisma.InputJsonValue,
              phoneIntelligence: (lead.phoneIntelligence || {}) as unknown as Prisma.InputJsonValue,
              ownerDiscovery: (lead.ownerDiscovery || {}) as unknown as Prisma.InputJsonValue,
              websiteAudit: (lead.websiteAudit || {}) as unknown as Prisma.InputJsonValue,
              reviews: (lead.reviews || []) as unknown as Prisma.InputJsonValue,
            },
          });
          updated++;
        } else {
          await prisma.lead.create({
            data: {
              id: lead.id,
              placeId,
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
          added++;
        }
      }

      const total = await prisma.lead.count();
      return { added, updated, total };
    } catch (err) {
      console.warn('Prisma upsert failed, falling back to local storage:', err);
    }
  }

  // Fallback to local
  const existing = getLocalLeads();
  const existingMap = new Map(existing.map((l) => [l.placeId || l.phone, l]));
  let added = 0;
  let updated = 0;

  for (const lead of newLeads) {
    const key = lead.placeId || lead.phone;
    if (existingMap.has(key)) {
      const prev = existingMap.get(key)!;
      existingMap.set(key, {
        ...lead,
        id: prev.id,
        pipeline: prev.pipeline,
        updatedAt: new Date().toISOString(),
      });
      updated++;
    } else {
      existingMap.set(key, lead);
      added++;
    }
  }

  const finalLeads = Array.from(existingMap.values());
  saveLocalLeads(finalLeads);
  return { added, updated, total: finalLeads.length };
}

export async function deleteLead(id: string): Promise<boolean> {
  if (hasDbConnection) {
    try {
      await prisma.lead.delete({ where: { id } });
      return true;
    } catch (err) {
      console.warn('Prisma delete failed:', err);
    }
  }

  const leads = getLocalLeads();
  const filtered = leads.filter((l) => l.id !== id);
  if (filtered.length !== leads.length) {
    saveLocalLeads(filtered);
    return true;
  }
  return false;
}
