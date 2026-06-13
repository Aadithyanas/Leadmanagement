import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLeads,
  createLead,
  updateLead,
  updateLeadStatus,
  deleteLead,
  fetchDiscussionsByLeadId,
  createDiscussion,
  createLeadsBulk,
  fetchOrgMembers,
  fetchTeams,
  createTeam,
  createInvitation,
  updateOrgMemberTeam,
  updateOrgMemberRole,
  removeOrgMember
} from '@/services/api';
import type {
  CreateLeadInput,
  CreateDiscussionInput,
  LeadStatus,
  Lead,
} from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useLeadStore } from '@/store/useLeadStore';

// ---------- Members & Teams ----------
export function useOrgMembers() {
  const activeOrg = useAuthStore((s) => s.activeOrg);
  return useQuery({
    queryKey: ['orgMembers', activeOrg?.id],
    queryFn: fetchOrgMembers,
    enabled: !!activeOrg?.id, // Admins and leaders need this too
    staleTime: 60_000,
  });
}

export function useTeams() {
  const activeOrg = useAuthStore((s) => s.activeOrg);
  return useQuery({
    queryKey: ['teams', activeOrg?.id],
    queryFn: fetchTeams,
    enabled: !!activeOrg?.id,
    staleTime: 60_000,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

export function useUpdateMemberTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, teamId }: { memberId: string; teamId: string | null }) => 
      updateOrgMemberTeam(memberId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgMembers'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) => 
      updateOrgMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgMembers'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeOrgMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgMembers'] });
    },
  });
}

export function useCreateInvitation() {
  return useMutation({
    mutationFn: ({ email, role, teamId }: { email: string, role: string, teamId?: string }) => 
      createInvitation(email, role, teamId),
  });
}

// ---------- Leads ----------

export function useFilteredLeads() {
  const { data: leads, ...rest } = useLeads();
  const { data: members } = useOrgMembers();
  const { user, activeOrg } = useAuthStore();
  const { sourceCategoryFilter } = useLeadStore();
  
  if (!leads) return { data: leads, ...rest };

  // Filter by sourceCategory first if not 'All'
  let filteredData = leads;
  if (sourceCategoryFilter !== 'All') {
    filteredData = leads.filter(l => l.sourceCategory === sourceCategoryFilter);
  }
  
  if (activeOrg?.role === 'owner' || activeOrg?.role === 'admin' || activeOrg?.role === 'hr') {
    return { data: filteredData, ...rest };
  }
  
  const currentUserMember = members?.find(m => m.id === user?.id);
  
  if (activeOrg?.role === 'leader') {
    if (!currentUserMember?.teamId) {
      return { data: filteredData.filter(l => l.assignedTo === user?.id || l.assignedTo === null), ...rest };
    }
    const teamMemberIds = members?.filter(m => m.teamId === currentUserMember.teamId).map(m => m.id) || [];
    return { data: filteredData.filter(l => l.assignedTo === null || teamMemberIds.includes(l.assignedTo)), ...rest };
  }
  
  // Member
  return { data: filteredData.filter(l => l.assignedTo === user?.id), ...rest };
}

export function useAssignableMembers() {
  const { data: members } = useOrgMembers();
  const { user, activeOrg } = useAuthStore();
  
  if (!members) return [];
  
  if (activeOrg?.role === 'owner' || activeOrg?.role === 'admin' || activeOrg?.role === 'hr') {
    return members;
  }
  
  if (activeOrg?.role === 'leader') {
    const currentUserMember = members.find(m => m.id === user?.id);
    if (!currentUserMember?.teamId) return [currentUserMember]; // only themselves if no team
    return members.filter(m => m.teamId === currentUserMember.teamId);
  }
  
  return []; // Members can't assign
}

export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    staleTime: 30_000,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLead(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      updateLead(id, updates),
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: ['leads'] });
      const prev = qc.getQueryData<Lead[]>(['leads']);
      qc.setQueryData<Lead[]>(['leads'], (old) =>
        old?.map((l) => (l.id === id ? { ...l, ...updates } : l)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['leads'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useCreateLeadsBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeadsBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['leads'] });
      const prev = qc.getQueryData<Lead[]>(['leads']);
      qc.setQueryData<Lead[]>(['leads'], (old) =>
        old?.map((l) => (l.id === id ? { ...l, status } : l)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['leads'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['leads'] });
      const prev = qc.getQueryData<Lead[]>(['leads']);
      qc.setQueryData<Lead[]>(['leads'], (old) =>
        old?.filter((l) => l.id !== id) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['leads'], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// ---------- Discussions ----------

export function useDiscussions(leadId: string | null) {
  return useQuery({
    queryKey: ['discussions', leadId],
    queryFn: () => fetchDiscussionsByLeadId(leadId!),
    enabled: !!leadId,
    staleTime: 10_000,
  });
}

export function useCreateDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDiscussionInput) => createDiscussion(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['discussions', vars.leadId] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
