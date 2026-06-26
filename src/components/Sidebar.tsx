import { LayoutDashboard, Users, Compass, Settings, LogOut, Zap, User, UserX, ShieldAlert, Trash2, BrainCircuit, Calendar, ListMusic, Gamepad2 } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { checkHealth } from '@/services/api';
import { Server, Database, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface SidebarProps {
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ onLogout, isOpen, onClose }: SidebarProps) {
  const { activeTab, setActiveTab } = useLeadStore();
  const { isSuperAdmin, activeOrg } = useAuthStore();
  const { isInstallable, installPWA } = usePWAInstall();

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'followups', label: 'Follow-Ups', icon: Calendar },
    { id: 'playlists', label: 'Vibe Sheets', icon: ListMusic },
    { id: 'rejected', label: 'Rejected Leads', icon: UserX },
    { id: 'discover', label: 'Discover Leads', icon: Compass },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'snake_game', label: 'Snake Game', icon: Gamepad2 },
  ] as const;

  const isElevated = activeOrg?.role === 'owner' || activeOrg?.role === 'admin' || isSuperAdmin;
  const adminNavItems = [...navItems];
  
  if (isElevated) {
    (adminNavItems as any).push({ id: 'ai_analytics', label: 'AI Analytics', icon: BrainCircuit });
    (adminNavItems as any).push({ id: 'trash', label: 'Trash', icon: Trash2 });
  }

  const finalNavItems = isSuperAdmin
    ? [{ id: 'super_admin' as const, label: 'Super Admin', icon: ShieldAlert }, ...adminNavItems]
    : adminNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 w-64 border-r border-r-white/5 bg-black/20 backdrop-blur-md flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 shadow-xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Lead<span className="text-primary">Flow</span>
            </span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <Compass className="h-4 w-4 rotate-45" /> {/* Use close icon if available, Compass rotated as placeholder */}
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {finalNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === item.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          
          {isInstallable && (
            <button
              onClick={installPWA}
              className="w-full flex items-center gap-3 px-3 py-2 mt-4 rounded-md text-sm font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 lg:hidden"
            >
              <Smartphone className="h-4 w-4" />
              Install App
            </button>
          )}
        </nav>

        <div className="p-4 mt-auto border-t space-y-4">
          <ServerStatus />
        </div>
      </aside>
    </>
  );
}

function ServerStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const check = async () => {
      try {
        const health = await checkHealth();
        setStatus('online');
        setDbStatus(health.db as any);
      } catch {
        setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-2 py-3 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">System Status</span>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : 
            status === 'offline' ? "bg-rose-500" : "bg-amber-500"
          )} />
          <span className={cn(
            "text-[10px] font-medium",
            status === 'online' ? "text-emerald-500" : 
            status === 'offline' ? "text-rose-500" : "text-amber-500"
          )}>
            {status === 'online' ? 'Live' : status === 'offline' ? 'Offline' : 'Checking...'}
          </span>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Server className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-foreground/80">API Server</span>
          {status === 'online' ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />
          ) : (
            <AlertCircle className="h-3 w-3 text-muted-foreground ml-auto" />
          )}
        </div>
        <div className="flex items-center gap-2 px-1">
          <Database className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-foreground/80">Database</span>
          {dbStatus === 'connected' ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />
          ) : (
            <AlertCircle className="h-3 w-3 text-rose-500 ml-auto" />
          )}
        </div>
      </div>
    </div>
  );
}
