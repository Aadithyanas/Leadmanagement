export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Proposal Sent'
  | 'Won'
  | 'Lost'
  | 'Rejected';

export type Industry =
  | 'Restaurant'
  | 'Food & Beverage'
  | 'Retail'
  | 'Healthcare'
  | 'Technology'
  | 'Education'
  | 'Real Estate'
  | 'Finance'
  | 'Manufacturing'
  | 'E-Commerce'
  | 'Hospitality'
  | 'Other';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: LeadStatus;
  industry: Industry;
  hasWebsite: boolean;
  websiteUrl: string;
  requirements: string;
  lastDiscussion: string;
  followUpAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: string;
  assignedTo?: string | null;
  customFields?: Record<string, string>;
}

export interface Discussion {
  id: string;
  leadId: string;
  note: string;
  followUpAt: string | null;
  createdAt: string;
}

export interface CreateLeadInput {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  status?: LeadStatus;
  industry?: Industry;
  hasWebsite?: boolean;
  websiteUrl?: string;
  requirements?: string;
  assignedTo?: string | null;
  customFields?: Record<string, string>;
}

export interface CreateDiscussionInput {
  leadId: string;
  note: string;
  followUpAt?: string | null;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  wonLeads: number;
  lostLeads: number;
  todayFollowUps: number;
  overdueFollowUps: number;
}
