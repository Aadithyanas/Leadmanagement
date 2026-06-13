import { supabase } from '../lib/supabase';
import type { Lead, Discussion, CreateLeadInput, CreateDiscussionInput, LeadStatus } from '@/types';
import type { Database } from '../types/supabase';
import { useAuthStore } from '../store/useAuthStore';

type DbLead = Database['public']['Tables']['leads']['Row'];
type DbDiscussion = Database['public']['Tables']['discussions']['Row'];

export interface GlobalSettings {
  id?: string;
  notificationEmail: string;
  enableNotifications: boolean;
  apifyApiKey: string;
}

const getOrgId = () => {
  const org = useAuthStore.getState().activeOrg;
  if (!org) throw new Error('No active organization');
  return org.id;
};

function mapLeadFromDb(db: DbLead): Lead {
  return {
    id: db.id,
    name: db.name,
    company: db.company || '',
    phone: db.phone || '',
    email: db.email || '',
    status: (db.status as LeadStatus) || 'New',
    industry: (db.industry as any) || 'Other',
    hasWebsite: db.has_website || false,
    websiteUrl: db.website_url || '',
    requirements: db.requirements || '',
    lastDiscussion: db.last_discussion || '',
    followUpAt: db.follow_up_at,
    createdAt: db.created_at || new Date().toISOString(),
    updatedAt: db.updated_at || new Date().toISOString(),
    assignedTo: db.assigned_to,
    customFields: (db.custom_fields as Record<string, string>) || {},
  };
}

function mapDiscussionFromDb(db: DbDiscussion): Discussion {
  return {
    id: db.id,
    leadId: db.lead_id,
    note: db.note,
    followUpAt: db.follow_up_at,
    createdAt: db.created_at || new Date().toISOString(),
  };
}

export async function checkHealth(): Promise<{ status: string; db: string }> {
  return { status: 'ok', db: 'connected' };
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'leader' | 'member';
  createdAt: string;
  teamId?: string | null;
  teamName?: string | null;
}

export interface Team {
  id: string;
  name: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  orgId: string;
  teamId?: string;
  role: 'admin' | 'leader' | 'member';
  token: string;
  email: string;
}

export async function fetchOrgMembers(): Promise<OrgMember[]> {
  const { data, error } = await supabase.rpc('get_org_members', {
    target_org_id: getOrgId(),
  });
  if (error) throw error;
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    createdAt: r.created_at,
    teamId: r.team_id,
    teamName: r.team_name,
  }));
}

export async function updateOrgMemberTeam(memberId: string, teamId: string | null): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ team_id: teamId })
    .eq('user_id', memberId)
    .eq('org_id', getOrgId());
    
  if (error) throw error;
}

export async function updateOrgMemberRole(memberId: string, role: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('user_id', memberId)
    .eq('org_id', getOrgId());
    
  if (error) throw error;
}

export async function removeOrgMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('user_id', memberId)
    .eq('org_id', getOrgId());
    
  if (error) throw error;
}

export async function fetchTeams(): Promise<Team[]> {
  const orgId = getOrgId();
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('org_id', orgId)
    .order('name');
  if (error) throw new Error(error.message);
  return (data || []).map(t => ({
    id: t.id,
    name: t.name,
    createdAt: t.created_at,
  }));
}

export async function createTeam(name: string): Promise<Team> {
  const orgId = getOrgId();
  const { data, error } = await supabase
    .from('teams')
    .insert({ org_id: orgId, name })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, createdAt: data.created_at };
}

export async function createInvitation(email: string, role: string, teamId?: string): Promise<Invitation> {
  const orgId = getOrgId();
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const { data, error } = await supabase
    .from('organization_invites')
    .insert({
      org_id: orgId,
      email,
      role,
      team_id: teamId || null,
      token,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    orgId: data.org_id,
    teamId: data.team_id,
    role: data.role as any,
    token: data.token,
    email: data.email,
  };
}

export async function consumeInvitation(token: string): Promise<{ orgId: string, role: string, teamId?: string }> {
  const { data: inv, error: invError } = await supabase
    .from('organization_invites')
    .select('*')
    .eq('token', token)
    .single();
    
  if (invError || !inv) throw new Error('Invalid or expired invitation token');
  
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Not logged in');

  const { error: joinError } = await supabase
    .from('organization_members')
    .insert({
      org_id: inv.org_id,
      user_id: user.id,
      role: inv.role,
      team_id: inv.team_id,
    });
    
  if (joinError) throw new Error(joinError.message);
  
  // Cleanup invitation
  await supabase.from('organization_invites').delete().eq('id', inv.id);
  
  return { orgId: inv.org_id, role: inv.role, teamId: inv.team_id };
}

export async function fetchLeads(): Promise<Lead[]> {
  const org = useAuthStore.getState().activeOrg;
  const user = useAuthStore.getState().user;
  if (!org || !user) throw new Error('Not logged in');
  
  const orgId = org.id;
  let query = supabase
    .from('leads')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (org.role === 'member') {
    // Members only see leads assigned to them
    query = query.eq('assigned_to', user.id);
  } else if (org.role === 'leader' && org.teamId) {
    // Leaders see leads assigned to anyone in their team
    const { data: teamMembers } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('team_id', org.teamId);
    
    if (teamMembers && teamMembers.length > 0) {
      const teamUserIds = teamMembers.map((m: any) => m.user_id);
      // Include the leader's own user.id just in case they are not in the team members list
      if (!teamUserIds.includes(user.id)) {
        teamUserIds.push(user.id);
      }
      query = query.in('assigned_to', teamUserIds);
    } else {
      // Fallback if no team members found, just show their own
      query = query.eq('assigned_to', user.id);
    }
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []).map(mapLeadFromDb);
}

export async function fetchLeadById(id: string): Promise<Lead | undefined> {
  const orgId = getOrgId();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', id)
    .single();

  if (error) return undefined;
  return mapLeadFromDb(data);
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const orgId = getOrgId();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      org_id: orgId,
      name: input.name,
      company: input.company,
      phone: input.phone,
      email: input.email,
      status: input.status,
      industry: input.industry,
      has_website: input.hasWebsite,
      website_url: input.websiteUrl,
      requirements: input.requirements,
      assigned_to: input.assignedTo || null,
      custom_fields: input.customFields || {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLeadFromDb(data);
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const orgId = getOrgId();
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.industry !== undefined) payload.industry = updates.industry;
  if (updates.hasWebsite !== undefined) payload.has_website = updates.hasWebsite;
  if (updates.websiteUrl !== undefined) payload.website_url = updates.websiteUrl;
  if (updates.requirements !== undefined) payload.requirements = updates.requirements;
  if (updates.lastDiscussion !== undefined) payload.last_discussion = updates.lastDiscussion;
  if (updates.followUpAt !== undefined) payload.follow_up_at = updates.followUpAt;
  if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
  if (updates.customFields !== undefined) payload.custom_fields = updates.customFields;

  const { data, error } = await supabase
    .from('leads')
    .update(payload)
    .eq('org_id', orgId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapLeadFromDb(data);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  return updateLead(id, { status });
}

export async function deleteLead(id: string): Promise<void> {
  const orgId = getOrgId();
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('org_id', orgId)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function fetchDiscussionsByLeadId(leadId: string): Promise<Discussion[]> {
  const orgId = getOrgId();
  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .eq('org_id', orgId)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapDiscussionFromDb);
}

export async function createDiscussion(input: CreateDiscussionInput): Promise<Discussion> {
  const orgId = getOrgId();
  const { data, error } = await supabase
    .from('discussions')
    .insert({
      org_id: orgId,
      lead_id: input.leadId,
      note: input.note,
      follow_up_at: input.followUpAt,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  await updateLead(input.leadId, {
    lastDiscussion: input.note,
    followUpAt: input.followUpAt || undefined,
  });

  return mapDiscussionFromDb(data);
}

export async function fetchSettings(): Promise<GlobalSettings> {
  const orgId = getOrgId();
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();

  if (error || !data) {
    return { notificationEmail: '', enableNotifications: false, apifyApiKey: '' };
  }

  return {
    id: data.id,
    notificationEmail: data.notification_email || '',
    enableNotifications: data.enable_notifications || false,
    apifyApiKey: data.apify_api_key || '',
  };
}

export async function updateSettings(updates: Partial<GlobalSettings>): Promise<GlobalSettings> {
  const orgId = getOrgId();
  const current = await fetchSettings();
  
  const payload = {
    org_id: orgId,
    notification_email: updates.notificationEmail ?? current.notificationEmail,
    enable_notifications: updates.enableNotifications ?? current.enableNotifications,
    apify_api_key: updates.apifyApiKey ?? current.apifyApiKey,
  };

  if (current.id) {
    const { data, error } = await supabase
      .from('settings')
      .update(payload)
      .eq('id', current.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      notificationEmail: data.notification_email || '',
      enableNotifications: data.enable_notifications || false,
      apifyApiKey: data.apify_api_key || '',
    };
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      notificationEmail: data.notification_email || '',
      enableNotifications: data.enable_notifications || false,
      apifyApiKey: data.apify_api_key || '',
    };
  }
}

export async function createLeadsBulk(leads: CreateLeadInput[]): Promise<{ message: string; count: number }> {
  const orgId = getOrgId();
  const payload = leads.map(l => ({
    org_id: orgId,
    name: l.name,
    company: l.company,
    phone: l.phone,
    email: l.email,
    status: l.status,
    industry: l.industry,
    has_website: l.hasWebsite,
    website_url: l.websiteUrl,
    requirements: l.requirements,
    assigned_to: l.assignedTo || null,
    custom_fields: l.customFields || {},
  }));

  const { error } = await supabase
    .from('leads')
    .insert(payload);

  if (error) throw new Error(error.message);
  return { message: 'Success', count: leads.length };
}

