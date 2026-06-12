import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface Org {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'hr' | 'leader' | 'member';
  teamId?: string | null;
}

interface AuthStoreState {
  user: User | null;
  activeOrg: Org | null;
  orgs: Org[];
  setUser: (user: User | null) => void;
  setActiveOrg: (org: Org | null) => void;
  setOrgs: (orgs: Org[]) => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  activeOrg: null,
  orgs: [],
  setUser: (user) => set({ user }),
  setActiveOrg: (activeOrg) => set({ activeOrg }),
  setOrgs: (orgs) => set({ orgs }),
}));
