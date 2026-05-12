import { create } from 'zustand';
import type { LeadStatus } from '@/types';

type Tab = 'dashboard' | 'leads' | 'discover' | 'settings';

interface LeadStoreState {
  searchQuery: string;
  statusFilter: LeadStatus | 'All';
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

  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: LeadStatus | 'All') => void;
  setViewMode: (mode: 'grid' | 'table') => void;
  setActiveTab: (tab: Tab) => void;
  setApifyApiKey: (key: string) => void;
  openTimeline: (leadId: string) => void;
  closeTimeline: () => void;
  openAddLead: () => void;
  closeAddLead: () => void;
  setUploadJsonOpen: (open: boolean) => void;
  setUploadSheetOpen: (open: boolean) => void;
  setConnectApifyOpen: (open: boolean) => void;
  toggleDiscover: () => void;
  setNotificationEmail: (email: string) => void;
  setEnableNotifications: (enable: boolean) => void;
}

export const useLeadStore = create<LeadStoreState>((set) => ({
  searchQuery: '',
  statusFilter: 'All',
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

  setSearchQuery: (q) => set({ searchQuery: q }),
  setStatusFilter: (s) => set({ statusFilter: s }),
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
}));
