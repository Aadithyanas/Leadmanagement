import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { useLeadStore } from '@/store/useLeadStore';
import { useLeads, useUpdateLeadStatus, useDiscussions, useCreateDiscussion } from '@/hooks/useLeads';
import { toast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { Loader2, Send, Calendar, MessageCircle, Phone, Mail, Building2, Globe, Ban, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LeadStatus, Lead } from '@/types';

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

export function LeadTimelineDialog() {
  const { isTimelineOpen, closeTimeline, selectedLeadId } = useLeadStore();
  const { data: leads } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const { data: discussions, isLoading: loadingDisc } = useDiscussions(selectedLeadId);
  const createDiscussion = useCreateDiscussion();

  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState('');

  const lead = leads?.find((l: Lead) => l.id === selectedLeadId);

  useEffect(() => {
    if (!isTimelineOpen) { setNote(''); setFollowUp(''); }
  }, [isTimelineOpen]);

  const handleStatusChange = async (status: string) => {
    if (!selectedLeadId) return;
    try {
      await updateStatus.mutateAsync({ id: selectedLeadId, status: status as LeadStatus });
      toast({ title: 'Status updated', description: `Changed to ${status}`, variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const handleAddDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !note.trim()) return;
    try {
      await createDiscussion.mutateAsync({
        leadId: selectedLeadId,
        note: note.trim(),
        followUpAt: followUp ? new Date(followUp).toISOString() : null,
      });
      toast({ title: 'Discussion added', variant: 'success' });
      setNote('');
      setFollowUp('');
    } catch {
      toast({ title: 'Error', description: 'Failed to add discussion.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isTimelineOpen} onOpenChange={(o) => !o && closeTimeline()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        {lead ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-xl">{lead.name}</DialogTitle>
                  <DialogDescription className="mt-1 space-y-1">
                    {lead.company && (
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company}</span>
                    )}
                    <span className="flex items-center gap-3 flex-wrap">
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                      {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Client Details */}
            <div className="flex flex-wrap items-center gap-2 py-2 border-b">
              {lead.industry && lead.industry !== 'Other' && (
                <span className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                  {lead.industry}
                </span>
              )}
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
                lead.hasWebsite
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
              )}>
                {lead.hasWebsite ? <Globe className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                {lead.hasWebsite ? 'Has website' : 'No website'}
              </span>
              {lead.hasWebsite && lead.websiteUrl && (
                <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate max-w-[200px]">
                  {lead.websiteUrl}
                </a>
              )}
            </div>

            {/* Requirements */}
            {lead.requirements && (
              <div className="py-2 border-b">
                <div className="flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Client Requirements</p>
                    <p className="text-sm leading-relaxed">{lead.requirements}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Changer */}
            <div className="flex items-center gap-3 py-2 border-b">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Status:</Label>
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="timeline-status" className="w-[160px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-0">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Discussion Timeline
              </h3>
              {loadingDisc ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : !discussions || discussions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No discussions yet</p>
                </div>
              ) : (
                <div className="space-y-0">
                  <AnimatePresence>
                    {discussions.map((disc, i) => (
                      <motion.div
                        key={disc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative pl-8 pb-4 timeline-connector last:before:hidden"
                      >
                        {/* Dot */}
                        <div className={cn(
                          'absolute left-[11px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background',
                          i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                        )} />

                        <div className="rounded-lg border bg-card p-3 shadow-sm">
                          <p className="text-sm leading-relaxed">{disc.note}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{formatDateTime(disc.createdAt)}</span>
                            {disc.followUpAt && (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <Calendar className="h-3 w-3" />
                                Follow-up: {formatDateTime(disc.followUpAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Add Discussion Form */}
            <form onSubmit={handleAddDiscussion} className="border-t pt-3 space-y-3">
              <textarea
                id="discussion-note"
                placeholder="Add a note about this lead..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[80px]"
                rows={3}
              />
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="discussion-followup" className="text-xs text-muted-foreground">
                    Follow-up date (optional)
                  </Label>
                  <Input
                    id="discussion-followup"
                    type="datetime-local"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button type="submit" size="sm" disabled={createDiscussion.isPending || !note.trim()} className="gap-1.5">
                  {createDiscussion.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Lead not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
