import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLeadStore } from '@/store/useLeadStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useFilteredLeads, useUpdateLead, useAssignableMembers, useCreateDiscussion, useTeams } from '@/hooks/useLeads';
import { toast } from '@/hooks/useToast';
import { Loader2, Globe, Ban, Plus, X, Users } from 'lucide-react';
import type { Industry, LeadStatus } from '@/types';

const INDUSTRIES: Industry[] = [
  'Restaurant', 'Food & Beverage', 'Retail', 'Healthcare', 'Technology',
  'Education', 'Real Estate', 'Finance', 'Manufacturing', 'E-Commerce',
  'Hospitality', 'Other',
];

const STATUSES: LeadStatus[] = [
  'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost', 'Rejected', 'Visited'
];

export function EditLeadDialog() {
  const { isEditLeadOpen, closeEditLead, editingLeadId } = useLeadStore();
  const { activeOrg } = useAuthStore();
  const { data: leads } = useFilteredLeads();
  const assignableMembers = useAssignableMembers();
  const { data: teams } = useTeams();
  const updateLead = useUpdateLead();
  const createDiscussion = useCreateDiscussion();
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '',
    industry: 'Other' as Industry,
    status: 'New' as LeadStatus,
    hasWebsite: false,
    websiteUrl: '',
    requirements: '',
    assignedTo: '',
  });
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', val: string) => {
    const newFields = [...customFields];
    newFields[index][field] = val;
    setCustomFields(newFields);
  };

  useEffect(() => {
    if (isEditLeadOpen && editingLeadId && leads) {
      const lead = leads.find(l => l.id === editingLeadId);
      if (lead) {
        setForm({
          name: lead.name,
          company: lead.company || '',
          phone: lead.phone || '',
          email: lead.email || '',
          industry: lead.industry,
          status: lead.status,
          hasWebsite: lead.hasWebsite,
          websiteUrl: lead.websiteUrl || '',
          requirements: lead.requirements || '',
          assignedTo: lead.assignedTo || '',
        });
        
        if (lead.customFields) {
          const fieldsArray = Object.entries(lead.customFields).map(([key, value]) => ({ key, value }));
          setCustomFields(fieldsArray);
        } else {
          setCustomFields([]);
        }

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
    }
  }, [isEditLeadOpen, editingLeadId]); // ONLY run when dialog opens or lead ID changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !editingLeadId) return;
    
    const lead = leads?.find(l => l.id === editingLeadId);
    if (!lead) return;

    // Detect changes
    const changes: string[] = [];
    if (lead.name !== form.name.trim()) changes.push(`Name to "${form.name.trim()}"`);
    if (lead.company !== form.company.trim()) changes.push(`Company to "${form.company.trim()}"`);
    if (lead.phone !== form.phone.trim()) changes.push(`Phone to "${form.phone.trim()}"`);
    if (lead.email !== form.email.trim()) changes.push(`Email to "${form.email.trim()}"`);
    if (lead.industry !== form.industry) changes.push(`Industry to "${form.industry}"`);
    if (lead.status !== form.status) changes.push(`Status to "${form.status}"`);
    if (lead.websiteUrl !== form.websiteUrl.trim()) changes.push(`Website URL to "${form.websiteUrl.trim()}"`);
    if (lead.assignedTo !== form.assignedTo) {
      const assignedName = form.assignedTo === 'unassigned' || !form.assignedTo ? 'Unassigned' : (assignableMembers?.find(m => m.id === form.assignedTo)?.name || 'a member');
      changes.push(`Assigned to ${assignedName}`);
    }

    const newCustomFields = customFields.reduce((acc, curr) => {
      if (curr.key.trim() && curr.value.trim()) acc[curr.key.trim()] = curr.value.trim();
      return acc;
    }, {} as Record<string, string>);

    if (JSON.stringify(lead.customFields || {}) !== JSON.stringify(newCustomFields)) {
      changes.push(`Custom Fields updated`);
    }

    try {
      await updateLead.mutateAsync({
        id: editingLeadId,
        updates: {
          name: form.name.trim(),
          company: form.company.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          status: form.status,
          industry: form.industry,
          hasWebsite: form.hasWebsite,
          websiteUrl: form.websiteUrl.trim(),
          requirements: form.requirements.trim(),
          assignedTo: form.assignedTo === 'unassigned' ? null : (form.assignedTo || null),
          customFields: newCustomFields,
        }
      });

      if (changes.length > 0) {
        await createDiscussion.mutateAsync({
          leadId: editingLeadId,
          note: `[System] Lead updated: ${changes.join(', ')}`,
          followUpAt: null,
        });
      }

      toast({ title: 'Lead updated', description: `${form.name} has been updated.`, variant: 'success' });
      closeEditLead();
    } catch {
      toast({ title: 'Error', description: 'Failed to update lead.', variant: 'destructive' });
    }
  };

  const availableTeams = teams || [];
  
  const filteredMembers = assignableMembers?.filter(m => {
    if (selectedTeamId === 'all') return true;
    if (selectedTeamId === 'unassigned') return !m.teamId;
    return m.teamId === selectedTeamId;
  });

  return (
    <Dialog open={isEditLeadOpen} onOpenChange={(o) => !o && closeEditLead()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>Modify the details of this lead.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Company */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-lead-name">Name *</Label>
              <Input id="edit-lead-name" placeholder="John Doe" required value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lead-company">Company</Label>
              <Input id="edit-lead-company" placeholder="Acme Corp" value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-lead-phone">Phone</Label>
              <Input id="edit-lead-phone" placeholder="+1-555-0100" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lead-email">Email</Label>
              <Input id="edit-lead-email" type="email" placeholder="john@acme.com" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Industry */}
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={(v) => setForm((p) => ({ ...p, industry: v as Industry }))}>
                <SelectTrigger id="edit-lead-industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as LeadStatus }))}>
                <SelectTrigger id="edit-lead-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>{st}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Has Website Toggle */}
          <div className="space-y-2">
            <Label>Does the client have a website?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={form.hasWebsite ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setForm((p) => ({ ...p, hasWebsite: true }))}
              >
                <Globe className="h-4 w-4" />
                Yes
              </Button>
              <Button
                type="button"
                variant={!form.hasWebsite ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setForm((p) => ({ ...p, hasWebsite: false, websiteUrl: '' }))}
              >
                <Ban className="h-4 w-4" />
                No
              </Button>
            </div>
          </div>

          {/* Website URL (conditional) */}
          {form.hasWebsite && (
            <div className="space-y-2 animate-slide-in">
              <Label htmlFor="edit-lead-website">Website URL</Label>
              <Input id="edit-lead-website" type="url" placeholder="https://example.com" value={form.websiteUrl}
                onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))} />
            </div>
          )}

          {/* Assign To */}
          {assignableMembers.length > 0 && (
            <div className={activeOrg?.role !== 'leader' ? "grid grid-cols-2 gap-3 animate-slide-in" : "animate-slide-in"}>
              {activeOrg?.role !== 'leader' && (
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select value={selectedTeamId} onValueChange={(v) => { setSelectedTeamId(v); setForm(p => ({ ...p, assignedTo: '' })); }}>
                    <SelectTrigger>
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
                </div>
              )}
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={form.assignedTo} onValueChange={(v) => setForm((p) => ({ ...p, assignedTo: v === 'unassigned' ? '' : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {filteredMembers.map((member) => (
                      <SelectItem key={member.id!} value={member.id!}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="edit-lead-requirements">Requirements</Label>
            <textarea
              id="edit-lead-requirements"
              placeholder="e.g. Need a website for their restaurant..."
              value={form.requirements}
              onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Custom Fields */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Additional Information</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddCustomField} className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add Field
              </Button>
            </div>
            {customFields.map((field, index) => (
              <div key={index} className="flex items-start gap-2 animate-slide-in">
                <div className="flex-1 space-y-1">
                  <Input 
                    placeholder="Field Name (e.g. LinkedIn)" 
                    value={field.key} 
                    onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)} 
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Input 
                    placeholder="Value" 
                    value={field.value} 
                    onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)} 
                    className="h-9"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveCustomField(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={closeEditLead}>Cancel</Button>
            <Button type="submit" disabled={updateLead.isPending || !form.name.trim()}>
              {updateLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
