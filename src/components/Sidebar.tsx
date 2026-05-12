import { LayoutDashboard, Users, Compass, Settings, LogOut, Zap } from 'lucide-react';
import { useLeadStore } from '@/store/useLeadStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onLogout?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ onLogout, isOpen, onClose }: SidebarProps) {
  const { activeTab, setActiveTab } = useLeadStore();

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'discover', label: 'Discover Leads', icon: Compass },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

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
        "fixed lg:sticky top-0 left-0 z-50 w-64 border-r bg-card flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 shadow-xl lg:shadow-none",
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
          {navItems.map((item) => (
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
        </nav>

        <div className="p-4 mt-auto border-t">
          {onLogout && (
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
