import { useFilteredLeads, useOrgMembers } from '@/hooks/useLeads';
import { useLeadStore } from '@/store/useLeadStore';
import { LeadCard } from '@/components/LeadCard';
import { isFollowUpToday, isOverdue } from '@/lib/date-utils';
import { Inbox, Loader2, CheckSquare, Square, MapPin, Globe, Ban } from 'lucide-react';
import type { Lead } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export function LeadList({ isRejectedView }: { isRejectedView?: boolean }) {
  const { data: leads, isLoading } = useFilteredLeads();
  const { data: members } = useOrgMembers();
  const { searchQuery, statusFilter, sourceCategoryFilter, viewMode, openTimeline, selectedLeadIds, toggleLeadSelection, setSelectedLeadIds } = useLeadStore();

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
  if (isRejectedView) {
    filtered = filtered.filter((l) => l.status === 'Rejected');
  } else {
    filtered = filtered.filter((l) => l.status !== 'Rejected');
    if (statusFilter !== 'All') {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
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

  const isPlaylistSpecific = !isRejectedView && sourceCategoryFilter !== 'All';
  const customFieldKeys = new Set<string>();
  if (isPlaylistSpecific && filtered.length > 0) {
    filtered.forEach(lead => {
      if (lead.customFields) {
        Object.keys(lead.customFields).forEach(k => customFieldKeys.add(k));
      }
    });
  }
  const dynamicColumns = Array.from(customFieldKeys);

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
              <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                <table className="w-full text-sm text-left relative">
                  <thead className="bg-muted text-muted-foreground sticky top-0 z-20 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <Checkbox 
                          checked={section.leads.length > 0 && section.leads.every(l => selectedLeadIds.includes(l.id))}
                          onCheckedChange={(checked: boolean) => {
                            const ids = section.leads.map(l => l.id);
                            if (checked) {
                              setSelectedLeadIds([...new Set([...selectedLeadIds, ...ids])]);
                            } else {
                              setSelectedLeadIds(selectedLeadIds.filter(id => !ids.includes(id)));
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">Name / Company</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">Assigned</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">Industry</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">Contact</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">Status</th>
                      {isPlaylistSpecific && dynamicColumns.map(col => (
                        <th key={col} className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap text-amber-500/80">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {section.leads.map((lead) => {
                      const assignee = members?.find(m => m.id === lead.assignedTo);
                      return (
                        <tr 
                          key={lead.id} 
                          className={cn(
                            "hover:bg-accent/50 cursor-pointer transition-colors border-l-2",
                            selectedLeadIds.includes(lead.id) ? "bg-primary/5 border-l-primary" : "border-l-transparent"
                          )}
                          onClick={() => openTimeline(lead.id)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedLeadIds.includes(lead.id)}
                              onCheckedChange={() => toggleLeadSelection(lead.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium whitespace-nowrap">{lead.name}</div>
                            {lead.company && <div className="text-xs text-muted-foreground whitespace-nowrap">{lead.company}</div>}
                            {lead.websiteUrl && (
                              <div className={cn(
                                "flex items-center gap-1 mt-1 text-[10px]",
                                (lead.websiteUrl.includes('google.com/maps') || lead.websiteUrl.includes('goo.gl/maps')) 
                                  ? "text-primary" 
                                  : "text-emerald-600 dark:text-emerald-400"
                              )}>
                                {(lead.websiteUrl.includes('google.com/maps') || lead.websiteUrl.includes('goo.gl/maps')) 
                                  ? <MapPin className="h-2.5 w-2.5" /> 
                                  : <Globe className="h-2.5 w-2.5" />}
                                <span className="truncate max-w-[150px]">
                                  {(lead.websiteUrl.includes('google.com/maps') || lead.websiteUrl.includes('goo.gl/maps')) 
                                    ? 'View on Maps' 
                                    : 'Website'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {lead.assignedTo ? (
                              <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                                {assignee ? (assignee.name || assignee.email) : 'Assigned'}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                             {lead.industry && (
                              <span className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
                                {lead.industry}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            {lead.email && <div>{lead.email}</div>}
                            {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              lead.status === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              lead.status === 'Qualified' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              lead.status === 'Proposal Sent' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                              lead.status === 'Won' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              lead.status === 'Rejected' ? 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          {isPlaylistSpecific && dynamicColumns.map(col => (
                            <td key={col} className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap max-w-[250px] truncate" title={lead.customFields?.[col] || ''}>
                              {lead.customFields?.[col] || '-'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
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
