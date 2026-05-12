/**
 * API Service — Connects to the Express + MongoDB backend.
 * Falls back to localStorage if the server is unreachable.
 */

import type { Lead, Discussion, CreateLeadInput, CreateDiscussionInput, LeadStatus } from '@/types';

export interface GlobalSettings {
  id?: string;
  notificationEmail: string;
  enableNotifications: boolean;
  apifyApiKey: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ---------- HTTP helpers ----------

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const userEmail = localStorage.getItem('leadflow_session') || '';
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 
      'Content-Type': 'application/json',
      'x-user-email': userEmail
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API request failed');
  }
  return res.json();
}

// ---------- Lead CRUD ----------

export async function fetchLeads(): Promise<Lead[]> {
  try {
    return await request<Lead[]>('/leads');
  } catch {
    console.warn('API unreachable, falling back to localStorage');
    return getLocalLeads();
  }
}

export async function fetchLeadById(id: string): Promise<Lead | undefined> {
  try {
    return await request<Lead>(`/leads/${id}`);
  } catch {
    return getLocalLeads().find((l) => l.id === id);
  }
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  try {
    const lead = await request<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return lead;
  } catch {
    return createLocalLead(input);
  }
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  try {
    return await request<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch {
    return updateLocalLead(id, updates);
  }
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  try {
    return await request<Lead>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch {
    return updateLocalLead(id, { status });
  }
}

export async function deleteLead(id: string): Promise<void> {
  try {
    await request(`/leads/${id}`, { method: 'DELETE' });
  } catch {
    deleteLocalLead(id);
  }
}

// ---------- Discussion CRUD ----------

export async function fetchDiscussionsByLeadId(leadId: string): Promise<Discussion[]> {
  try {
    return await request<Discussion[]>(`/discussions/${leadId}`);
  } catch {
    return getLocalDiscussions().filter((d) => d.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function createDiscussion(input: CreateDiscussionInput): Promise<Discussion> {
  try {
    return await request<Discussion>('/discussions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    return createLocalDiscussion(input);
  }
}

// ---------- Settings ----------

const SETTINGS_KEY = 'leadflow_global_settings';

export async function fetchSettings(): Promise<GlobalSettings> {
  try {
    return await request<GlobalSettings>('/settings');
  } catch {
    const local = localStorage.getItem(SETTINGS_KEY);
    return local ? JSON.parse(local) : { notificationEmail: '', enableNotifications: false, apifyApiKey: '' };
  }
}

export async function updateSettings(updates: Partial<GlobalSettings>): Promise<GlobalSettings> {
  try {
    const settings = await request<GlobalSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  } catch {
    const current = await fetchSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }
}

// ---------- localStorage fallback ----------

const LEADS_KEY = 'leadflow_leads';
const DISCUSSIONS_KEY = 'leadflow_discussions';

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
}

function getLocalLeads(): Lead[] {
  try { return JSON.parse(localStorage.getItem(LEADS_KEY) || '[]'); }
  catch { return []; }
}

function saveLocalLeads(leads: Lead[]) {
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

function getLocalDiscussions(): Discussion[] {
  try { return JSON.parse(localStorage.getItem(DISCUSSIONS_KEY) || '[]'); }
  catch { return []; }
}

function saveLocalDiscussions(discussions: Discussion[]) {
  localStorage.setItem(DISCUSSIONS_KEY, JSON.stringify(discussions));
}

function createLocalLead(input: CreateLeadInput): Lead {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: generateId(), 
    name: input.name, 
    company: input.company || '', 
    phone: input.phone || '',
    email: input.email || '', 
    status: input.status || 'New', 
    industry: input.industry || 'Other',
    hasWebsite: input.hasWebsite || false,
    websiteUrl: input.websiteUrl || '',
    requirements: input.requirements || '',
    lastDiscussion: '',
    followUpAt: null, 
    createdAt: now, 
    updatedAt: now,
  };
  const leads = getLocalLeads();
  leads.push(lead);
  saveLocalLeads(leads);
  return lead;
}

function updateLocalLead(id: string, updates: Partial<Lead>): Lead {
  const leads = getLocalLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error('Lead not found');
  leads[idx] = { ...leads[idx]!, ...updates, updatedAt: new Date().toISOString() };
  saveLocalLeads(leads);
  return leads[idx]!;
}

function deleteLocalLead(id: string) {
  saveLocalLeads(getLocalLeads().filter((l) => l.id !== id));
  saveLocalDiscussions(getLocalDiscussions().filter((d) => d.leadId !== id));
}

function createLocalDiscussion(input: CreateDiscussionInput): Discussion {
  const now = new Date().toISOString();
  const disc: Discussion = {
    id: generateId(), leadId: input.leadId, note: input.note,
    followUpAt: input.followUpAt || null, createdAt: now,
  };
  const discussions = getLocalDiscussions();
  discussions.push(disc);
  saveLocalDiscussions(discussions);
  // Update parent lead
  const leads = getLocalLeads();
  const idx = leads.findIndex((l) => l.id === input.leadId);
  if (idx !== -1) {
    leads[idx] = { ...leads[idx]!, lastDiscussion: input.note,
      followUpAt: input.followUpAt || leads[idx]!.followUpAt, updatedAt: now };
    saveLocalLeads(leads);
  }
  return disc;
}

// ---------- Seed (only for localStorage fallback) ----------

export function seedDemoData(): void {
  // Only seed localStorage if no server and no local data
  if (getLocalLeads().length > 0) return;

  const now = new Date();
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
  const future = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000).toISOString();
  const today = () => { const t = new Date(); t.setHours(14, 0, 0, 0); return t.toISOString(); };
  const yesterday = () => { const t = new Date(); t.setDate(t.getDate() - 1); t.setHours(10, 0, 0, 0); return t.toISOString(); };

  const demoLeads: Lead[] = [
    { 
      id: 'lead-1', name: 'Sarah Chen', company: 'TechVision Inc.', phone: '+1-555-0101', email: 'sarah.chen@techvision.com', 
      status: 'Qualified', industry: 'Technology', hasWebsite: true, websiteUrl: 'https://techvision.com', 
      requirements: 'Enterprise scale CRM integration', lastDiscussion: 'Very interested in enterprise plan. Wants demo next week.', 
      followUpAt: today(), createdAt: d(15), updatedAt: d(1) 
    },
    { 
      id: 'lead-2', name: 'Marcus Johnson', company: 'DataFlow Systems', phone: '+1-555-0102', email: 'marcus@dataflow.io', 
      status: 'Proposal Sent', industry: 'Finance', hasWebsite: true, websiteUrl: 'https://dataflow.io', 
      requirements: 'Data pipeline automation', lastDiscussion: 'Sent proposal for 50-seat license. Awaiting CFO approval.', 
      followUpAt: today(), createdAt: d(22), updatedAt: d(2) 
    },
    { 
      id: 'lead-3', name: 'Emily Rodriguez', company: 'GreenScale Analytics', phone: '+1-555-0103', email: 'emily.r@greenscale.com', 
      status: 'Contacted', industry: 'Retail', hasWebsite: true, websiteUrl: 'https://greenscale.com', 
      requirements: 'Inventory tracking', lastDiscussion: 'Had introductory call. Interested but budget cycle is Q2.', 
      followUpAt: yesterday(), createdAt: d(10), updatedAt: d(3) 
    },
    { 
      id: 'lead-4', name: 'Alex Kim', company: 'NovaBright Solutions', phone: '+1-555-0104', email: 'alex.kim@novabright.co', 
      status: 'New', industry: 'Other', hasWebsite: false, websiteUrl: '', 
      requirements: 'Route optimization', lastDiscussion: '', 
      followUpAt: future(3), createdAt: d(2), updatedAt: d(2) 
    },
    { 
      id: 'lead-5', name: 'Priya Sharma', company: 'CloudNine Platform', phone: '+1-555-0105', email: 'priya@cloudnine.dev', 
      status: 'Won', industry: 'Technology', hasWebsite: true, websiteUrl: 'https://cloudnine.dev', 
      requirements: 'SaaS platform management', lastDiscussion: 'Contract signed! 100-seat annual deal.', 
      followUpAt: null, createdAt: d(45), updatedAt: d(5) 
    },
    { 
      id: 'lead-6', name: "James O'Brien", company: 'Meridian Corp', phone: '+1-555-0106', email: 'jobrien@meridian.com', 
      status: 'Lost', industry: 'Real Estate', hasWebsite: true, websiteUrl: 'https://meridian.com', 
      requirements: 'Property listing scraper', lastDiscussion: 'Went with competitor.', 
      followUpAt: future(30), createdAt: d(60), updatedAt: d(8) 
    },
    { 
      id: 'lead-7', name: 'Lisa Wang', company: 'PixelForge Studios', phone: '+1-555-0107', email: 'lisa.wang@pixelforge.art', 
      status: 'Contacted', industry: 'Other', hasWebsite: true, websiteUrl: 'https://pixelforge.art', 
      requirements: 'Creative agency CRM', lastDiscussion: 'Left voicemail.', 
      followUpAt: future(1), createdAt: d(5), updatedAt: d(1) 
    },
    { 
      id: 'lead-8', name: 'Daniel Thompson', company: 'Apex Industries', phone: '+1-555-0108', email: 'dthompson@apex-ind.com', 
      status: 'Qualified', industry: 'Manufacturing', hasWebsite: true, websiteUrl: 'https://apex-ind.com', 
      requirements: 'Supply chain visibility', lastDiscussion: 'Needs custom integration.', 
      followUpAt: yesterday(), createdAt: d(18), updatedAt: d(2) 
    },
  ];

  saveLocalLeads(demoLeads);
}
