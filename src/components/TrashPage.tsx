import { useState } from 'react';
import { useDeletedLeads, useDeleteLead, useRestoreLead, useOrgMembers } from '@/hooks/useLeads';
import { Loader2, Trash2, RefreshCcw, Inbox, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/useToast';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/date-utils';

export function TrashPage() {
  const { data: leads, isLoading } = useDeletedLeads();
  const { data: members } = useOrgMembers();
  const deleteLead = useDeleteLead();
  const restoreLead = useRestoreLead();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

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
        <p className="text-lg font-medium">Trash is empty</p>
        <p className="text-sm">No recently deleted leads</p>
      </div>
    );
  }

  const handleRestore = async (id: string) => {
    setIsProcessing(id);
    try {
      await restoreLead.mutateAsync(id);
      toast({ title: 'Lead restored', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) return;
    setIsProcessing(id);
    try {
      await deleteLead.mutateAsync({ id, permanent: true });
      toast({ title: 'Lead permanently deleted', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Trash</h1>
        <p className="text-muted-foreground">
          Review and permanently delete or restore recently removed leads.
        </p>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground shadow-sm">
              <tr>
                <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Name / Company</th>
                <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Deleted On</th>
                <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Deleted By</th>
                <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => {
                const deletedByUser = members?.find(m => m.id === lead.deletedBy);
                return (
                <tr key={lead.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-muted-foreground line-through">{lead.name}</div>
                    {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {lead.deletedAt ? formatDate(lead.deletedAt) : 'Unknown'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 opacity-70" />
                      {deletedByUser ? deletedByUser.name : 'Unknown User'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="opacity-60">
                      <StatusBadge status={lead.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessing === lead.id}
                        onClick={() => handleRestore(lead.id)}
                        className="h-8 gap-1"
                      >
                        <RefreshCcw className="h-3 w-3" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isProcessing === lead.id}
                        onClick={() => handlePermanentDelete(lead.id, lead.name)}
                        className="h-8 gap-1"
                      >
                        {isProcessing === lead.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
