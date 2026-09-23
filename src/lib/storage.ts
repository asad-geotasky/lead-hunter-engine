import fs from 'fs';
import path from 'path';
import { Lead, PipelineStage, Project, Mailbox, Campaign, EmailLog } from '@/types/lead';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'leads.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const MAILBOXES_FILE = path.join(DATA_DIR, 'mailboxes.json');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');
const EMAIL_LOGS_FILE = path.join(DATA_DIR, 'email_logs.json');

const hasDbConnection = !!process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

function ensureFile(filePath: string, defaultData: any = []) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

function readJson<T>(filePath: string, defaultVal: T): T {
  try {
    ensureFile(filePath, defaultVal);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultVal;
  }
}

function writeJson(filePath: string, data: any): void {
  try {
    ensureFile(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
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
    email: record.email || null,
    rating: record.rating,
    reviewCount: record.reviewCount,
    website: record.website,
    googleMapsUrl: record.googleMapsUrl,
    opportunityScore: record.opportunityScore,
    projectId: record.projectId || null,
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

/* =========================================================================
   LEADS CRUD
   ========================================================================= */

export async function getAllLeads(filter?: {
  stage?: PipelineStage;
  noWebsite?: boolean;
  minScore?: number;
  search?: string;
  projectId?: string;
}): Promise<Lead[]> {
  if (hasDbConnection) {
    try {
      const where: any = {};

      if (filter?.stage) {
        where.stage = filter.stage;
      }
      if (filter?.projectId) {
        where.projectId = filter.projectId;
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
  let leads = readJson<Lead[]>(DATA_FILE, []);

  if (filter?.stage) {
    leads = leads.filter((l) => l.pipeline.stage === filter.stage);
  }
  if (filter?.projectId) {
    leads = leads.filter((l) => l.projectId === filter.projectId);
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

  const leads = readJson<Lead[]>(DATA_FILE, []);
  return leads.find((l) => l.id === id) || null;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  if (hasDbConnection) {
    try {
      const dataToUpdate: any = {};
      if (updates.businessName !== undefined) dataToUpdate.businessName = updates.businessName;
      if (updates.phone !== undefined) dataToUpdate.phone = updates.phone;
      if (updates.email !== undefined) dataToUpdate.email = updates.email;
      if (updates.website !== undefined) dataToUpdate.website = updates.website;
      if (updates.opportunityScore !== undefined) dataToUpdate.opportunityScore = updates.opportunityScore;
      if (updates.projectId !== undefined) dataToUpdate.projectId = updates.projectId;
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

  const leads = readJson<Lead[]>(DATA_FILE, []);
  const index = leads.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const existing = leads[index];
  const updated: Lead = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  leads[index] = updated;
  writeJson(DATA_FILE, leads);
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
              phone: lead.phone || exists.phone,
              email: lead.email || exists.email,
              rating: lead.rating,
              reviewCount: lead.reviewCount,
              opportunityScore: lead.opportunityScore,
              projectId: lead.projectId || exists.projectId,
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
              email: lead.email || null,
              rating: lead.rating || 0,
              reviewCount: lead.reviewCount || 0,
              website: lead.website || null,
              googleMapsUrl: lead.googleMapsUrl || '',
              opportunityScore: lead.opportunityScore || 0,
              stage: lead.pipeline?.stage || 'DISCOVERED',
              projectId: lead.projectId || null,
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

  // Local JSON fallback
  const existing = readJson<Lead[]>(DATA_FILE, []);
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
        projectId: lead.projectId || prev.projectId,
        email: lead.email || prev.email,
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
  writeJson(DATA_FILE, finalLeads);
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

  const leads = readJson<Lead[]>(DATA_FILE, []);
  const filtered = leads.filter((l) => l.id !== id);
  if (filtered.length !== leads.length) {
    writeJson(DATA_FILE, filtered);
    return true;
  }
  return false;
}

/* =========================================================================
   PROJECTS CRUD
   ========================================================================= */

export async function getAllProjects(): Promise<Project[]> {
  if (hasDbConnection) {
    try {
      const projects = await prisma.project.findMany({
        include: { _count: { select: { leads: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        targetCity: p.targetCity,
        leadCount: p._count.leads,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn('Prisma projects fetch failed, falling back:', err);
    }
  }

  const projects = readJson<Project[]>(PROJECTS_FILE, []);
  const leads = readJson<Lead[]>(DATA_FILE, []);
  return projects.map((p) => ({
    ...p,
    leadCount: leads.filter((l) => l.projectId === p.id).length,
  }));
}

export async function createProject(data: {
  name: string;
  description?: string;
  category?: string;
  targetCity?: string;
}): Promise<Project> {
  if (hasDbConnection) {
    try {
      const p = await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          targetCity: data.targetCity,
        },
      });
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        targetCity: p.targetCity,
        leadCount: 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn('Prisma create project failed, falling back:', err);
    }
  }

  const projects = readJson<Project[]>(PROJECTS_FILE, []);
  const newProject: Project = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    description: data.description,
    category: data.category,
    targetCity: data.targetCity,
    leadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.unshift(newProject);
  writeJson(PROJECTS_FILE, projects);
  return newProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (hasDbConnection) {
    try {
      await prisma.project.delete({ where: { id } });
      return true;
    } catch (err) {
      console.warn('Prisma delete project failed:', err);
    }
  }

  const projects = readJson<Project[]>(PROJECTS_FILE, []);
  const filtered = projects.filter((p) => p.id !== id);
  writeJson(PROJECTS_FILE, filtered);
  return true;
}

/* =========================================================================
   MAILBOXES CRUD
   ========================================================================= */

export async function getAllMailboxes(): Promise<Mailbox[]> {
  const todayStr = new Date().toISOString().split('T')[0];

  if (hasDbConnection) {
    try {
      const records = await prisma.mailbox.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Auto-reset daily counts if date rolled over
      const mailboxes = await Promise.all(
        records.map(async (m) => {
          if (m.lastResetDate !== todayStr) {
            return await prisma.mailbox.update({
              where: { id: m.id },
              data: { sentToday: 0, lastResetDate: todayStr },
            });
          }
          return m;
        })
      );

      return mailboxes.map((m) => ({
        id: m.id,
        email: m.email,
        senderName: m.senderName,
        smtpHost: m.smtpHost,
        smtpPort: m.smtpPort,
        smtpSecure: m.smtpSecure,
        smtpUser: m.smtpUser,
        smtpPass: m.smtpPass,
        replyTo: m.replyTo,
        dailyLimit: m.dailyLimit,
        sentToday: m.sentToday,
        lastResetDate: m.lastResetDate,
        isActive: m.isActive,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn('Prisma mailboxes fetch failed, falling back:', err);
    }
  }

  const mailboxes = readJson<Mailbox[]>(MAILBOXES_FILE, []);
  // reset if needed
  const updated = mailboxes.map((m) => {
    if (m.lastResetDate !== todayStr) {
      return { ...m, sentToday: 0, lastResetDate: todayStr };
    }
    return m;
  });
  writeJson(MAILBOXES_FILE, updated);
  return updated;
}

export async function saveMailbox(data: Omit<Mailbox, 'id' | 'createdAt' | 'updatedAt' | 'sentToday' | 'lastResetDate'> & { id?: string }): Promise<Mailbox> {
  const todayStr = new Date().toISOString().split('T')[0];

  if (hasDbConnection) {
    try {
      if (data.id) {
        const m = await prisma.mailbox.update({
          where: { id: data.id },
          data: {
            email: data.email,
            senderName: data.senderName,
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            smtpSecure: data.smtpSecure,
            smtpUser: data.smtpUser,
            smtpPass: data.smtpPass,
            replyTo: data.replyTo,
            dailyLimit: data.dailyLimit,
            isActive: data.isActive,
          },
        });
        return {
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        };
      } else {
        const m = await prisma.mailbox.create({
          data: {
            email: data.email,
            senderName: data.senderName,
            smtpHost: data.smtpHost || 'smtp.gmail.com',
            smtpPort: data.smtpPort || 465,
            smtpSecure: data.smtpSecure ?? true,
            smtpUser: data.smtpUser,
            smtpPass: data.smtpPass,
            replyTo: data.replyTo,
            dailyLimit: data.dailyLimit || 50,
            sentToday: 0,
            lastResetDate: todayStr,
            isActive: data.isActive ?? true,
          },
        });
        return {
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        };
      }
    } catch (err) {
      console.warn('Prisma save mailbox failed, falling back:', err);
    }
  }

  const mailboxes = readJson<Mailbox[]>(MAILBOXES_FILE, []);
  if (data.id) {
    const idx = mailboxes.findIndex((m) => m.id === data.id);
    if (idx !== -1) {
      mailboxes[idx] = {
        ...mailboxes[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeJson(MAILBOXES_FILE, mailboxes);
      return mailboxes[idx];
    }
  }

  const newMailbox: Mailbox = {
    id: `mb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...data,
    sentToday: 0,
    lastResetDate: todayStr,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mailboxes.push(newMailbox);
  writeJson(MAILBOXES_FILE, mailboxes);
  return newMailbox;
}

export async function deleteMailbox(id: string): Promise<boolean> {
  if (hasDbConnection) {
    try {
      await prisma.mailbox.delete({ where: { id } });
      return true;
    } catch (err) {
      console.warn('Prisma delete mailbox failed:', err);
    }
  }

  const mailboxes = readJson<Mailbox[]>(MAILBOXES_FILE, []);
  const filtered = mailboxes.filter((m) => m.id !== id);
  writeJson(MAILBOXES_FILE, filtered);
  return true;
}

export async function incrementMailboxSent(mailboxId: string): Promise<void> {
  if (hasDbConnection) {
    try {
      await prisma.mailbox.update({
        where: { id: mailboxId },
        data: { sentToday: { increment: 1 } },
      });
      return;
    } catch (err) {
      console.warn('Prisma increment mailbox sent failed:', err);
    }
  }

  const mailboxes = readJson<Mailbox[]>(MAILBOXES_FILE, []);
  const m = mailboxes.find((x) => x.id === mailboxId);
  if (m) {
    m.sentToday = (m.sentToday || 0) + 1;
    writeJson(MAILBOXES_FILE, mailboxes);
  }
}

/* =========================================================================
   CAMPAIGNS CRUD
   ========================================================================= */

export async function getAllCampaigns(): Promise<Campaign[]> {
  if (hasDbConnection) {
    try {
      const records = await prisma.campaign.findMany({
        include: {
          project: { select: { name: true } },
          _count: { select: { emailLogs: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return records.map((c) => ({
        id: c.id,
        projectId: c.projectId,
        projectName: c.project?.name,
        name: c.name,
        subject: c.subject,
        bodyTemplate: c.bodyTemplate,
        delaySeconds: c.delaySeconds,
        status: c.status as Campaign['status'],
        sentCount: c._count.emailLogs,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn('Prisma campaigns fetch failed, falling back:', err);
    }
  }

  return readJson<Campaign[]>(CAMPAIGNS_FILE, []);
}

export async function createCampaign(data: {
  projectId: string;
  name: string;
  subject: string;
  bodyTemplate: string;
  delaySeconds?: number;
}): Promise<Campaign> {
  if (hasDbConnection) {
    try {
      const c = await prisma.campaign.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          subject: data.subject,
          bodyTemplate: data.bodyTemplate,
          delaySeconds: data.delaySeconds || 90,
          status: 'DRAFT',
        },
        include: { project: { select: { name: true } } },
      });

      return {
        id: c.id,
        projectId: c.projectId,
        projectName: c.project?.name,
        name: c.name,
        subject: c.subject,
        bodyTemplate: c.bodyTemplate,
        delaySeconds: c.delaySeconds,
        status: 'DRAFT',
        sentCount: 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn('Prisma create campaign failed, falling back:', err);
    }
  }

  const campaigns = readJson<Campaign[]>(CAMPAIGNS_FILE, []);
  const newCamp: Campaign = {
    id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectId: data.projectId,
    name: data.name,
    subject: data.subject,
    bodyTemplate: data.bodyTemplate,
    delaySeconds: data.delaySeconds || 90,
    status: 'DRAFT',
    sentCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  campaigns.unshift(newCamp);
  writeJson(CAMPAIGNS_FILE, campaigns);
  return newCamp;
}

export async function updateCampaignStatus(id: string, status: Campaign['status']): Promise<void> {
  if (hasDbConnection) {
    try {
      await prisma.campaign.update({
        where: { id },
        data: { status },
      });
      return;
    } catch (err) {
      console.warn('Prisma update campaign status failed:', err);
    }
  }

  const campaigns = readJson<Campaign[]>(CAMPAIGNS_FILE, []);
  const c = campaigns.find((x) => x.id === id);
  if (c) {
    c.status = status;
    c.updatedAt = new Date().toISOString();
    writeJson(CAMPAIGNS_FILE, campaigns);
  }
}

/* =========================================================================
   EMAIL LOGS
   ========================================================================= */

export async function createEmailLog(data: {
  campaignId: string;
  leadId: string;
  mailboxId?: string | null;
  recipient: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string | null;
}): Promise<EmailLog> {
  if (hasDbConnection) {
    try {
      const log = await prisma.emailLog.create({
        data: {
          campaignId: data.campaignId,
          leadId: data.leadId,
          mailboxId: data.mailboxId || null,
          recipient: data.recipient,
          subject: data.subject,
          status: data.status,
          error: data.error || null,
          sentAt: data.status === 'SENT' ? new Date() : null,
        },
        include: { mailbox: { select: { email: true } } },
      });

      return {
        id: log.id,
        campaignId: log.campaignId,
        leadId: log.leadId,
        mailboxId: log.mailboxId,
        mailboxEmail: log.mailbox?.email,
        recipient: log.recipient,
        subject: log.subject,
        status: log.status as EmailLog['status'],
        error: log.error,
        sentAt: log.sentAt ? log.sentAt.toISOString() : null,
        createdAt: log.createdAt.toISOString(),
      };
    } catch (err) {
      console.warn('Prisma create email log failed, falling back:', err);
    }
  }

  const logs = readJson<EmailLog[]>(EMAIL_LOGS_FILE, []);
  const newLog: EmailLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...data,
    sentAt: data.status === 'SENT' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog);
  writeJson(EMAIL_LOGS_FILE, logs);
  return newLog;
}

export async function getCampaignEmailLogs(campaignId: string): Promise<EmailLog[]> {
  if (hasDbConnection) {
    try {
      const logs = await prisma.emailLog.findMany({
        where: { campaignId },
        include: { mailbox: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
      });

      return logs.map((l) => ({
        id: l.id,
        campaignId: l.campaignId,
        leadId: l.leadId,
        mailboxId: l.mailboxId,
        mailboxEmail: l.mailbox?.email,
        recipient: l.recipient,
        subject: l.subject,
        status: l.status as EmailLog['status'],
        error: l.error,
        sentAt: l.sentAt ? l.sentAt.toISOString() : null,
        createdAt: l.createdAt.toISOString(),
      }));
    } catch (err) {
      console.warn('Prisma email logs fetch failed, falling back:', err);
    }
  }

  const logs = readJson<EmailLog[]>(EMAIL_LOGS_FILE, []);
  return logs.filter((l) => l.campaignId === campaignId);
}
