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
import { useAuthStore } from '@/store/useAuthStore';
import { useFilteredLeads, useDiscussions, useCreateDiscussion, useUpdateDiscussion, useUpdateLeadStatus, useUpdateLead, useAssignableMembers, useDeleteLead, useTeams } from '@/hooks/useLeads';
import { toast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { Loader2, Send, Calendar, MessageCircle, Phone, Mail, Building2, Globe, Ban, FileText, Trash2, MapPin, User, Edit, Users, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIEmailDialog, type EmailType } from '@/components/AIEmailDialog';
import { scoreLeadQuality } from '@/lib/ai-service';
import type { LeadStatus, Lead } from '@/types';

const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost', 'Rejected', 'Visited'];

export function LeadTimelineDialog() {
  const { isTimelineOpen, closeTimeline, selectedLeadId, openEditLead, columnOrder } = useLeadStore();
  const { activeOrg } = useAuthStore();
  const { data: leads } = useFilteredLeads();
  const assignableMembers = useAssignableMembers();
  const { data: teams } = useTeams();
  const updateStatus = useUpdateLeadStatus();
  const updateLead = useUpdateLead();
  const { data: discussions, isLoading: loadingDisc } = useDiscussions(selectedLeadId);
  const createDiscussion = useCreateDiscussion();
  const updateDiscussion = useUpdateDiscussion();
  const deleteLead = useDeleteLead();
  const [isDeleting, setIsDeleting] = useState(false);

  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');

  const [editingDiscId, setEditingDiscId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editFollowUp, setEditFollowUp] = useState('');
  
  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [aiEmailType, setAiEmailType] = useState<EmailType>('proposal');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  
  const [isScoring, setIsScoring] = useState(false);
  const [leadScore, setLeadScore] = useState<{score: number, reasoning: string} | null>(null);

  const lead = leads?.find((l: Lead) => l.id === selectedLeadId);

  useEffect(() => {
    if (!isTimelineOpen) { setNote(''); setFollowUp(''); }
    if (isTimelineOpen && lead) {
      if (lead.assignedTo && assignableMembers) {
        const assignedMember = assignableMembers.find(m => m.id === lead.assignedTo);
        if (activeOrg?.role === 'leader') {
          setSelectedTeamId(activeOrg.teamId || 'unassigned');
        } else if (assignedMember?.teamId) {
          setSelectedTeamId(assignedMember.teamId);
        } else {
          setSelectedTeamId('all');
        }
      } else {
        setSelectedTeamId(activeOrg?.role === 'leader' ? (activeOrg.teamId || 'unassigned') : 'all');
      }
    }
  }, [isTimelineOpen, lead?.id, assignableMembers, activeOrg]);

  const openGoogleCalendar = (leadData: Lead) => {
    const title = encodeURIComponent(`Meeting with ${leadData.name} (${leadData.company || ''})`);
    const details = encodeURIComponent(`Lead details:
Name: ${leadData.name}
Email: ${leadData.email || ''}
Phone: ${leadData.phone || ''}
Requirements: ${leadData.requirements || ''}
`);
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(calUrl, '_blank');
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedLeadId || !lead) return;
    
    if (status === 'Proposal Sent') {
      setPendingStatus(status);
      setAiEmailType('proposal');
      setIsAIPromptOpen(true);
      return;
    }
    if (status === 'Contacted') {
      setPendingStatus(status);
      setAiEmailType('welcome');
      setIsAIPromptOpen(true);
      return;
    }
    
    if (status === 'Qualified' || status === 'Won') {
      if (confirm(`Do you want to create a Calendar Event for ${lead.name}?`)) {
        openGoogleCalendar(lead);
      }
    }
    
    await commitStatusChange(status);
  };

  const commitStatusChange = async (status: string, additionalNote?: string, followUpAt?: string | null) => {
    try {
      await updateStatus.mutateAsync({ id: selectedLeadId!, status: status as LeadStatus });
      await createDiscussion.mutateAsync({
        leadId: selectedLeadId!,
        note: additionalNote || `[System] Status changed from ${lead!.status} to ${status}`,
        followUpAt: followUpAt || null,
      });
      toast({ title: 'Status updated', description: `Changed to ${status}`, variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const handleAIEmailComplete = async (generatedEmail: string, type: EmailType, followUpAt?: string | null) => {
    if (pendingStatus) {
      await commitStatusChange(
        pendingStatus, 
        `[System] Status changed from ${lead!.status} to ${pendingStatus}.\n\nNote/Draft (${type}):\n${generatedEmail}`,
        followUpAt
      );
      setPendingStatus(null);
    } else {
      await createDiscussion.mutateAsync({
        leadId: selectedLeadId!,
        note: `Note/Draft (${type}):\n${generatedEmail}`,
        followUpAt: followUpAt || null,
      });
      toast({ title: 'Note Saved', variant: 'success' });
    }
  };

  const handleScoreLead = async () => {
    if (!lead) return;
    if (!openRouterApiKey) {
      toast({ title: 'API Key Missing', description: 'Please add VITE_OPENROUTER_API_KEY to your .env file.', variant: 'destructive' });
      return;
    }
    setIsScoring(true);
    try {
      const result = await scoreLeadQuality(openRouterApiKey, lead);
      setLeadScore(result);
      
      await createDiscussion.mutateAsync({
        leadId: lead.id,
        note: `[AI Score: ${result.score}/10] ${result.reasoning}`,
        followUpAt: null,
      });
      toast({ title: 'Lead Scored', variant: 'success' });
    } catch (err) {
      toast({ title: 'Failed to score lead', variant: 'destructive' });
    } finally {
      setIsScoring(false);
    }
  };

  const handleAssignmentChange = async (userId: string) => {
    if (!selectedLeadId) return;
    try {
      await updateLead.mutateAsync({ id: selectedLeadId, updates: { assignedTo: userId === 'unassigned' ? null : userId } });
      
      const assignedUserName = userId === 'unassigned' ? 'Unassigned' : (assignableMembers?.find(m => m.id === userId)?.name || 'a member');
      await createDiscussion.mutateAsync({
        leadId: selectedLeadId,
        note: `[System] Lead assigned to ${assignedUserName}`,
        followUpAt: null,
      });
      
      toast({ title: 'Assignment updated', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to assign lead.', variant: 'destructive' });
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

  const saveEdit = async () => {
    if (!editingDiscId || !selectedLeadId) return;
    try {
      await updateDiscussion.mutateAsync({
        id: editingDiscId,
        leadId: selectedLeadId,
        note: editNote,
        followUpAt: editFollowUp ? new Date(editFollowUp).toISOString() : null,
      });
      setEditingDiscId(null);
      toast({ title: 'Discussion updated', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update discussion.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedLeadId || !lead) return;
    if (!confirm(`Are you sure you want to delete ${lead.name}?`)) return;
    
    try {
      setIsDeleting(true);
      await deleteLead.mutateAsync({ id: selectedLeadId });
      toast({ title: 'Lead deleted', description: `${lead.name} has been removed.`, variant: 'success' });
      closeTimeline();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete lead.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const isMapsLink = lead?.websiteUrl?.includes('google.com/maps') || lead?.websiteUrl?.includes('goo.gl/maps');
  const assignee = assignableMembers?.find(m => m.id === lead?.assignedTo);

  const availableTeams = teams || [];
  
  const filteredMembers = assignableMembers?.filter(m => {
    if (selectedTeamId === 'all') return true;
    if (selectedTeamId === 'unassigned') return !m.teamId;
    return m.teamId === selectedTeamId;
  });

  const canAssign = ['owner', 'admin', 'hr', 'leader'].includes(activeOrg?.role || '');
  const canSeeTeamsDropdown = ['owner', 'admin', 'hr'].includes(activeOrg?.role || '');

  const getOrderedCustomFields = () => {
    if (!lead?.customFields) return [];
    
    // Get keys that actually have data for this specific lead
    const availableKeys = Object.keys(lead.customFields).filter(
      k => lead.customFields![k] !== undefined && lead.customFields![k] !== null && String(lead.customFields![k]).trim() !== ''
    );
    
    // Sort them according to columnOrder
    const sortedKeys = availableKeys.sort((keyA, keyB) => {
      const idxA = columnOrder.indexOf(keyA);
      const idxB = columnOrder.indexOf(keyB);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return keyA.localeCompare(keyB);
    });

    // Return the key and its value
    return sortedKeys.map(key => ({
      key,
      value: String(lead.customFields![key])
    }));
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={() => openEditLead(lead.id)}
                    title="Edit Lead"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    title="Delete Lead"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2 space-y-4">
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
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:emerald-300'
                  : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300'
              )}>
                {isMapsLink ? <MapPin className="h-3 w-3" /> : (lead.hasWebsite ? <Globe className="h-3 w-3" /> : <Ban className="h-3 w-3" />)}
                {isMapsLink ? 'View on Maps' : (lead.hasWebsite ? 'Has website' : 'No website')}
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

            {/* Custom Fields - Show all possible fields */}
            {getOrderedCustomFields().length > 0 && (
              <div className="py-2 border-b">
                <p className="text-xs font-medium text-muted-foreground mb-2">Additional Information</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2">
                  {getOrderedCustomFields().map(({key, value}) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{key}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status & Assignment Changer */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-2 border-b">
              <div className="flex items-center gap-3">
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

              {(canAssign || lead.assignedTo) && (
                <div className="flex items-center gap-3">
                  {canSeeTeamsDropdown && assignableMembers && assignableMembers.length > 0 && (
                    <>
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Team:</Label>
                      <Select value={selectedTeamId} onValueChange={(v) => { setSelectedTeamId(v); }}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="All Teams" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Teams</SelectItem>
                          {availableTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="unassigned">No Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}

                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Assigned To:</Label>
                  {canAssign ? (
                    <Select value={lead.assignedTo || 'unassigned'} onValueChange={handleAssignmentChange}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {filteredMembers?.map((m) => (
                          <SelectItem key={m.id!} value={m.id!}>
                            {m.name || m.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      <User className="h-3 w-3" />
                      {assignee ? (assignee.name || assignee.email) : 'Assigned to you'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* AI Action Bar */}
            <div className="flex flex-wrap items-center gap-2 py-2 border-b bg-muted/20 px-2 rounded-md">
              <Button size="sm" variant="outline" className="gap-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 hover:text-indigo-400 border-indigo-200 dark:border-indigo-800" onClick={handleScoreLead} disabled={isScoring}>
                {isScoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {leadScore ? `AI Score: ${leadScore.score}/10` : 'AI Score Lead'}
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => { setPendingStatus(null); setAiEmailType('followup'); setIsAIPromptOpen(true); }}>
                <Mail className="h-4 w-4" />
                Draft Follow-Up
              </Button>
            </div>

            {/* Timeline */}
            <div className="py-1 space-y-0">
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

                        <div className="rounded-lg border bg-card p-3 shadow-sm group">
                          {editingDiscId === disc.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[60px]"
                              />
                              <div className="flex items-center gap-2">
                                <Input
                                  type="datetime-local"
                                  value={editFollowUp}
                                  onChange={(e) => setEditFollowUp(e.target.value)}
                                  className="h-8 text-xs w-[200px]"
                                />
                                <Button size="sm" onClick={saveEdit} disabled={updateDiscussion.isPending}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingDiscId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{disc.note}</p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{formatDateTime(disc.createdAt)}</span>
                                  {disc.followUpAt && (
                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                      <Calendar className="h-3 w-3" />
                                      Follow-up: {formatDateTime(disc.followUpAt)}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setEditingDiscId(disc.id);
                                    setEditNote(disc.note);
                                    setEditFollowUp(disc.followUpAt ? disc.followUpAt.slice(0, 16) : '');
                                  }}
                                >
                                  <Edit className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
            </div>

            {/* Add Discussion Form */}
            <form onSubmit={handleAddDiscussion} className="border-t pt-3 space-y-3 shrink-0">
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
      
      {lead && (
        <AIEmailDialog 
          open={isAIPromptOpen}
          onOpenChange={setIsAIPromptOpen}
          lead={lead}
          type={aiEmailType}
          onComplete={handleAIEmailComplete}
        />
      )}
    </Dialog>
  );
}
