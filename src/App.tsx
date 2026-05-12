import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { DashboardStats } from '@/components/DashboardStats';
import { LeadList } from '@/components/LeadList';
import { AddLeadDialog } from '@/components/AddLeadDialog';
import { LeadTimelineDialog } from '@/components/LeadTimelineDialog';
import { UploadJsonDialog } from '@/components/UploadJsonDialog';
import { UploadSheetDialog } from '@/components/UploadSheetDialog';
import { ConnectApifyDialog } from '@/components/ConnectApifyDialog';
import { AuthScreen } from '@/components/AuthScreen';
import { Toaster } from '@/components/ui/toaster';
import { seedDemoData } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeadStore } from '@/store/useLeadStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

interface AuthUser {
  name: string;
  email: string;
}

import { Sidebar } from '@/components/Sidebar';
import { DashboardOverview } from '@/components/DashboardOverview';
import { LeadsPage } from '@/components/LeadsPage';
import { DiscoverPage } from '@/components/DiscoverLeads';
import { SettingsPage } from '@/components/SettingsPage';
import { LandingPage } from '@/components/LandingPage';
import { Menu, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AppLayout({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const { activeTab } = useLeadStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background flex-col lg:flex-row">
      <Sidebar onLogout={onLogout} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
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
              {activeTab === 'discover' && <DiscoverPage />}
              {activeTab === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals */}
      <AddLeadDialog />
      <LeadTimelineDialog />
      <UploadJsonDialog />
      <UploadSheetDialog />
      <ConnectApifyDialog />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  // Check for persisted session
  useEffect(() => {
    seedDemoData();
    const sessionEmail = localStorage.getItem('leadflow_session');
    if (sessionEmail) {
      const stored = localStorage.getItem(`leadflow_user_${sessionEmail}`);
      if (stored) {
        try {
          setUser(JSON.parse(stored) as AuthUser);
          setShowLanding(false); // Skip landing if already logged in
        } catch { /* ignore */ }
      }
    }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('leadflow_session');
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

  // Show Landing Page first if not logged in
  if (!user && showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {user ? (
        <AppLayout user={user} onLogout={handleLogout} />
      ) : (
        <AuthScreen onLogin={(u) => {
          setUser(u);
          setShowLanding(false);
        }} />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}
