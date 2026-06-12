import { motion } from 'framer-motion';
import { Building2, Clock, MessageSquare, Calendar, Globe, Ban, MapPin, User } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useLeadStore } from '@/store/useLeadStore';
import { timeAgo, formatDate, isFollowUpToday, isOverdue } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types';
import { useDeleteLead, useOrgMembers } from '@/hooks/useLeads';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/useToast';
import { Checkbox } from '@/components/ui/checkbox';

interface LeadCardProps {
  lead: Lead;
  index: number;
}

export function LeadCard({ lead, index }: LeadCardProps) {
  const { openTimeline, selectedLeadIds, toggleLeadSelection } = useLeadStore();
  const { data: members } = useOrgMembers();
  const overdue = isOverdue(lead.followUpAt);
  const todayFU = isFollowUpToday(lead.followUpAt);
  const isMapsLink = lead.websiteUrl?.includes('google.com/maps') || lead.websiteUrl?.includes('goo.gl/maps');
  const assignee = members?.find(m => m.id === lead.assignedTo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      onClick={() => openTimeline(lead.id)}
      className={cn(
        'group relative cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5',
        overdue && 'border-destructive/40 pulse-overdue',
        todayFU && !overdue && 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10',
        selectedLeadIds.includes(lead.id) && 'ring-2 ring-primary border-primary/50 bg-primary/5'
      )}
    >
      {/* Selection checkbox */}
      <div 
        className={cn(
          "absolute top-3 left-3 z-10 transition-opacity",
          selectedLeadIds.includes(lead.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox 
          checked={selectedLeadIds.includes(lead.id)}
          onCheckedChange={() => toggleLeadSelection(lead.id)}
        />
      </div>

      {/* Overdue indicator */}
      {overdue && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-medium text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          Overdue
        </div>
      )}
      {todayFU && !overdue && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Today
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {lead.name}
          </h3>
          {lead.company && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {/* Industry & Website */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {lead.industry && lead.industry !== 'Other' && (
          <span className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
            {lead.industry}
          </span>
        )}
        <span className={cn(
          'inline-flex items-center gap-1 text-[10px]',
          lead.hasWebsite ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
        )}>
          {isMapsLink ? <MapPin className="h-2.5 w-2.5" /> : (lead.hasWebsite ? <Globe className="h-2.5 w-2.5" /> : <Ban className="h-2.5 w-2.5" />)}
          {isMapsLink ? 'View on Maps' : (lead.hasWebsite ? 'Has website' : 'No website')}
        </span>
        
        {/* Assignee */}
        {lead.assignedTo && (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
            <User className="h-2.5 w-2.5" />
            {assignee ? (assignee.name || assignee.email) : 'Assigned'}
          </span>
        )}
      </div>

      {/* Last Discussion */}
      {lead.lastDiscussion && (
        <div className="flex items-start gap-1.5 mb-2">
          <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {lead.lastDiscussion}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{lead.lastDiscussion ? timeAgo(lead.updatedAt) : 'No discussions'}</span>
        </div>
        {lead.followUpAt && (
          <div className={cn(
            'flex items-center gap-1',
            overdue && 'text-destructive font-medium',
            todayFU && !overdue && 'text-amber-600 dark:text-amber-400 font-medium'
          )}>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(lead.followUpAt)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
