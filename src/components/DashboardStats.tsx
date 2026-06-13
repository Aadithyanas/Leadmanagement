import { useFilteredLeads } from '@/hooks/useLeads';
import { isFollowUpToday, isOverdue } from '@/lib/date-utils';
import { Users, UserPlus, Trophy, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function DashboardStats() {
  const { data: leads } = useFilteredLeads();
  if (!leads) return null;

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: Users, color: 'from-primary to-emerald-800' },
    { label: 'New', value: leads.filter((l) => l.status === 'New').length, icon: UserPlus, color: 'from-green-400 to-green-700' },
    { label: 'Won', value: leads.filter((l) => l.status === 'Won').length, icon: Trophy, color: 'from-emerald-400 to-emerald-700' },
    { label: 'Lost', value: leads.filter((l) => l.status === 'Lost').length, icon: XCircle, color: 'from-stone-600 to-stone-800' },
    { label: "Today's Follow-ups", value: leads.filter((l) => isFollowUpToday(l.followUpAt)).length, icon: Clock, color: 'from-teal-400 to-teal-700' },
    { label: 'Overdue', value: leads.filter((l) => isOverdue(l.followUpAt)).length, icon: AlertTriangle, color: 'from-stone-700 to-black' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${stat.color}`} />
          <div className="relative flex items-center gap-3">
            <div className={`flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
