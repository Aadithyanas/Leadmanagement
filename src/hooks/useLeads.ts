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
} from '@/services/api';
import type {
  CreateLeadInput,
  CreateDiscussionInput,
  LeadStatus,
  Lead,
} from '@/types';

// ---------- Leads ----------

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
