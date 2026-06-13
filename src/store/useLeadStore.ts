import { create } from 'zustand';
import type { LeadStatus } from '@/types';

type Tab = 'dashboard' | 'leads' | 'discover' | 'settings' | 'profile' | 'rejected';

interface LeadStoreState {
  searchQuery: string;
  statusFilter: LeadStatus | 'All';
  sourceCategoryFilter: string | 'All';
  viewMode: 'grid' | 'table';
  activeTab: Tab;
  apifyApiKey: string;
  selectedLeadId: string | null;
  isAddLeadOpen: boolean;
  isTimelineOpen: boolean;
  isUploadJsonOpen: boolean;
  isUploadSheetOpen: boolean;
  isConnectApifyOpen: boolean;
  isDiscoverOpen: boolean;
  notificationEmail: string;
  enableNotifications: boolean;
  selectedLeadIds: string[];
  isEditLeadOpen: boolean;
  editingLeadId: string | null;

  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: LeadStatus | 'All') => void;
  setSourceCategoryFilter: (s: string | 'All') => void;
  setViewMode: (mode: 'grid' | 'table') => void;
  setActiveTab: (tab: Tab) => void;
  setApifyApiKey: (key: string) => void;
  openTimeline: (leadId: string) => void;
  closeTimeline: () => void;
  openAddLead: () => void;
  closeAddLead: () => void;
  openEditLead: (leadId: string) => void;
  closeEditLead: () => void;
  setUploadJsonOpen: (open: boolean) => void;
  setUploadSheetOpen: (open: boolean) => void;
  setConnectApifyOpen: (open: boolean) => void;
  toggleDiscover: () => void;
  setNotificationEmail: (email: string) => void;
  setEnableNotifications: (enable: boolean) => void;
  toggleLeadSelection: (id: string) => void;
  setSelectedLeadIds: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useLeadStore = create<LeadStoreState>((set) => ({
  searchQuery: '',
  statusFilter: 'All',
  sourceCategoryFilter: 'All',
  viewMode: 'grid',
  activeTab: 'dashboard',
  apifyApiKey: localStorage.getItem('leadflow_apify_key') || '',
  selectedLeadId: null,
  isAddLeadOpen: false,
  isTimelineOpen: false,
  isUploadJsonOpen: false,
  isUploadSheetOpen: false,
  isConnectApifyOpen: false,
  isDiscoverOpen: false,
  notificationEmail: localStorage.getItem('leadflow_notification_email') || '',
  enableNotifications: localStorage.getItem('leadflow_enable_notifications') === 'true',
  selectedLeadIds: [],
  isEditLeadOpen: false,
  editingLeadId: null,

  setSearchQuery: (q) => set({ searchQuery: q }),
  setStatusFilter: (s) => set({ statusFilter: s }),
  setSourceCategoryFilter: (s) => set({ sourceCategoryFilter: s }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setApifyApiKey: (key) => {
    localStorage.setItem('leadflow_apify_key', key);
    set({ apifyApiKey: key });
  },

  openTimeline: (leadId) =>
    set({ selectedLeadId: leadId, isTimelineOpen: true }),
  closeTimeline: () =>
    set({ selectedLeadId: null, isTimelineOpen: false }),

  openAddLead: () => set({ isAddLeadOpen: true }),
  closeAddLead: () => set({ isAddLeadOpen: false }),
  openEditLead: (leadId) => set({ editingLeadId: leadId, isEditLeadOpen: true }),
  closeEditLead: () => set({ editingLeadId: null, isEditLeadOpen: false }),
  setUploadJsonOpen: (open) => set({ isUploadJsonOpen: open }),
  setUploadSheetOpen: (open) => set({ isUploadSheetOpen: open }),
  setConnectApifyOpen: (open) => set({ isConnectApifyOpen: open }),
  toggleDiscover: () => set((s) => ({ isDiscoverOpen: !s.isDiscoverOpen })),
  setNotificationEmail: (email: string) => {
    localStorage.setItem('leadflow_notification_email', email);
    set({ notificationEmail: email });
  },
  setEnableNotifications: (enable) => {
    localStorage.setItem('leadflow_enable_notifications', String(enable));
    set({ enableNotifications: enable });
  },
  toggleLeadSelection: (id) => set((s) => ({
    selectedLeadIds: s.selectedLeadIds.includes(id)
      ? s.selectedLeadIds.filter(i => i !== id)
      : [...s.selectedLeadIds, id]
  })),
  setSelectedLeadIds: (ids) => set({ selectedLeadIds: ids }),
  clearSelection: () => set({ selectedLeadIds: [] }),
}));
