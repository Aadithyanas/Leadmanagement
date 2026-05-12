import { useLeads } from '@/hooks/useLeads';
import { useLeadStore } from '@/store/useLeadStore';
import { LeadCard } from '@/components/LeadCard';
import { isFollowUpToday, isOverdue } from '@/lib/date-utils';
import { Inbox, Loader2 } from 'lucide-react';
import type { Lead } from '@/types';

export function LeadList() {
  const { data: leads, isLoading } = useLeads();
  const { searchQuery, statusFilter, viewMode, openTimeline } = useLeadStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Inbox className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-lg font-medium">No leads yet</p>
        <p className="text-sm">Click "Add Lead" to get started</p>
      </div>
    );
  }

  // Filter
  let filtered = leads;
  if (statusFilter !== 'All') {
    filtered = filtered.filter((l) => l.status === statusFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
    );
  }

  // Partition: today follow-ups, overdue, rest
  const todayLeads: Lead[] = [];
  const overdueLeads: Lead[] = [];
  const otherLeads: Lead[] = [];

  filtered.forEach((lead) => {
    if (isOverdue(lead.followUpAt)) overdueLeads.push(lead);
    else if (isFollowUpToday(lead.followUpAt)) todayLeads.push(lead);
    else otherLeads.push(lead);
  });

  const sections = [
    { title: '🔴 Overdue Follow-Ups', leads: overdueLeads },
    { title: '📅 Today\'s Follow-Ups', leads: todayLeads },
    { title: 'All Leads', leads: otherLeads },
  ].filter((s) => s.leads.length > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No leads match your search/filter</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            {section.title} ({section.leads.length})
          </h2>
          
          {viewMode === 'table' ? (
            <div className="rounded-md border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name / Company</th>
                      <th className="px-4 py-3 font-medium">Industry</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {section.leads.map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => openTimeline(lead.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{lead.name}</div>
                          {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
                        </td>
                        <td className="px-4 py-3">
                           {lead.industry && (
                            <span className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
                              {lead.industry}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {lead.email && <div>{lead.email}</div>}
                          {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            lead.status === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            lead.status === 'Qualified' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            lead.status === 'Proposal Sent' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                            lead.status === 'Won' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {section.leads.map((lead, i) => (
                <LeadCard key={lead.id} lead={lead} index={i} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
