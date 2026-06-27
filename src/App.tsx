import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { DashboardOverview } from '@/components/DashboardOverview';
import { LeadsPage } from '@/components/LeadsPage';
import { FollowUpsPage } from '@/components/FollowUpsPage';
import { PlaylistsPage } from '@/components/PlaylistsPage';
import { DiscoverPage } from '@/components/DiscoverLeads';
import { SettingsPage } from '@/components/SettingsPage';
import { ProfilePage } from '@/components/ProfilePage';
import { LandingPage } from '@/components/LandingPage';
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard';
import { TrashPage } from '@/components/TrashPage';
import { AIAnalyticsPage } from '@/components/AIAnalyticsPage';
import { SnakeGame } from '@/components/SnakeGame';
import { Menu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeadStore } from '@/store/useLeadStore';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthScreen } from '@/components/AuthScreen';
import { Toaster } from '@/components/ui/toaster';
import { AddLeadDialog } from '@/components/AddLeadDialog';
import { EditLeadDialog } from '@/components/EditLeadDialog';
import { LeadTimelineDialog } from '@/components/LeadTimelineDialog';
import { UploadJsonDialog } from '@/components/UploadJsonDialog';
import { UploadSheetDialog } from '@/components/UploadSheetDialog';
import { ConnectApifyDialog } from '@/components/ConnectApifyDialog';
import { InviteAcceptScreen } from '@/components/InviteAcceptScreen';
import { supabase } from '@/lib/supabase';
import { ThemeProvider } from '@/components/ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function AppLayout({ onLogout }: { onLogout: () => void }) {
  const { activeTab } = useLeadStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent flex-col lg:flex-row">
      <Sidebar onLogout={onLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight">LeadFlow</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-6xl"
            >
              {activeTab === 'dashboard' && <DashboardOverview />}
              {activeTab === 'leads' && <LeadsPage />}
              {activeTab === 'followups' && <FollowUpsPage />}
              {activeTab === 'playlists' && <PlaylistsPage />}
              {activeTab === 'rejected' && <LeadsPage isRejectedView />}
              {activeTab === 'discover' && <DiscoverPage />}
              {activeTab === 'profile' && <ProfilePage />}
              {activeTab === 'settings' && <SettingsPage onLogout={onLogout} />}
              {activeTab === 'super_admin' && <SuperAdminDashboard />}
              {activeTab === 'trash' && <TrashPage />}
              {activeTab === 'ai_analytics' && <AIAnalyticsPage />}
              {activeTab === 'snake_game' && <SnakeGame />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AddLeadDialog />
      <EditLeadDialog />
      <LeadTimelineDialog />
      <UploadJsonDialog />
      <UploadSheetDialog />
      <ConnectApifyDialog />
    </div>
  );
}

export default function App() {
  const { user, setUser, activeOrg, setOrgs, setActiveOrg, isSuperAdmin, setIsSuperAdmin } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      localStorage.setItem('leadflow_invite_token', token);
      setInviteToken(token);
      window.history.replaceState({}, '', '/');
    } else {
      const stored = localStorage.getItem('leadflow_invite_token');
      if (stored) setInviteToken(stored);
    }

    if (window.location.pathname === '/help@adi') {
      localStorage.setItem('leadflow_snake_unlocked', 'true');
      window.history.replaceState({}, '', '/');
    } else if (window.location.pathname === '/unhelp@adi') {
      localStorage.removeItem('leadflow_snake_unlocked');
      window.history.replaceState({}, '', '/');
    }
    
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setShowLanding(false);
        
        // Fetch org to prevent flashing AuthScreen
        const { data: superAdminData } = await supabase
          .from('super_admins' as any)
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        setIsSuperAdmin(!!superAdminData);

        const { data: members } = await supabase
          .from('organization_members')
          .select('role, team_id, organizations(id, name)')
          .eq('user_id', session.user.id);
          
          if (members && members.length > 0) {
          const orgsList = members.map(m => ({
            id: (m.organizations as any).id,
            name: (m.organizations as any).name,
            role: m.role as any,
            teamId: m.team_id
          }));
          setOrgs(orgsList);
          setActiveOrg(orgsList[0]);
        }
      }
      setChecking(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowLanding(true);
    queryClient.clear();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If we have an invite token AND the user is logged in, show the accept screen
  if (inviteToken && user) {
    return <InviteAcceptScreen token={inviteToken} onComplete={() => {
      setInviteToken(null);
      localStorage.removeItem('leadflow_invite_token');
      window.history.replaceState({}, '', '/');
    }} />;
  }

  if (!user && showLanding && !inviteToken) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        {user && (activeOrg || isSuperAdmin) ? (
          <AppLayout onLogout={handleLogout} />
        ) : (
          <AuthScreen onComplete={() => setShowLanding(false)} />
        )}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
