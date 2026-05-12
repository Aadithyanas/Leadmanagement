import { useState } from 'react';
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
import { useCreateLead } from '@/hooks/useLeads';
import { toast } from '@/hooks/useToast';
import { Loader2, Globe, Ban } from 'lucide-react';
import type { Industry } from '@/types';

const INDUSTRIES: Industry[] = [
  'Restaurant', 'Food & Beverage', 'Retail', 'Healthcare', 'Technology',
  'Education', 'Real Estate', 'Finance', 'Manufacturing', 'E-Commerce',
  'Hospitality', 'Other',
];

export function AddLeadDialog() {
  const { isAddLeadOpen, closeAddLead } = useLeadStore();
  const createLead = useCreateLead();
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '',
    industry: 'Other' as Industry,
    hasWebsite: false,
    websiteUrl: '',
    requirements: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await createLead.mutateAsync({
        name: form.name.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        status: 'New',
        industry: form.industry,
        hasWebsite: form.hasWebsite,
        websiteUrl: form.websiteUrl.trim(),
        requirements: form.requirements.trim(),
      });
      toast({ title: 'Lead created', description: `${form.name} has been added.`, variant: 'success' });
      setForm({ name: '', company: '', phone: '', email: '', industry: 'Other', hasWebsite: false, websiteUrl: '', requirements: '' });
      closeAddLead();
    } catch {
      toast({ title: 'Error', description: 'Failed to create lead.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isAddLeadOpen} onOpenChange={(o) => !o && closeAddLead()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Enter the client's information and requirements.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Company */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Name *</Label>
              <Input id="lead-name" placeholder="John Doe" required value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-company">Company</Label>
              <Input id="lead-company" placeholder="Acme Corp" value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lead-phone">Phone</Label>
              <Input id="lead-phone" placeholder="+1-555-0100" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email</Label>
              <Input id="lead-email" type="email" placeholder="john@acme.com" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label>Industry / Business Type</Label>
            <Select value={form.industry} onValueChange={(v) => setForm((p) => ({ ...p, industry: v as Industry }))}>
              <SelectTrigger id="lead-industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                Yes, has website
              </Button>
              <Button
                type="button"
                variant={!form.hasWebsite ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setForm((p) => ({ ...p, hasWebsite: false, websiteUrl: '' }))}
              >
                <Ban className="h-4 w-4" />
                No website
              </Button>
            </div>
          </div>

          {/* Website URL (conditional) */}
          {form.hasWebsite && (
            <div className="space-y-2 animate-slide-in">
              <Label htmlFor="lead-website">Website URL</Label>
              <Input id="lead-website" type="url" placeholder="https://example.com" value={form.websiteUrl}
                onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))} />
            </div>
          )}

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="lead-requirements">What does the client need?</Label>
            <textarea
              id="lead-requirements"
              placeholder="e.g. Need a website for their restaurant, want online ordering system, need marketing help..."
              value={form.requirements}
              onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[80px]"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAddLead}>Cancel</Button>
            <Button type="submit" disabled={createLead.isPending || !form.name.trim()}>
              {createLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
