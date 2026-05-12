import { LeadList } from '@/components/LeadList';
import { useLeadStore } from '@/store/useLeadStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, FileJson, FileSpreadsheet, Keyboard, Unplug, LayoutGrid, List, Download } from 'lucide-react';
import type { LeadStatus } from '@/types';
import { exportLeadsToCSV } from '@/lib/export-utils';
import { useLeads } from '@/hooks/useLeads';
import { toast } from '@/hooks/useToast';

const ALL_STATUSES: (LeadStatus | 'All')[] = [
  'All', 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost',
];

export function LeadsPage() {
  const {
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    viewMode, setViewMode,
    openAddLead, setUploadJsonOpen, setUploadSheetOpen, setConnectApifyOpen,
    apifyApiKey, setActiveTab, selectedLeadIds, clearSelection
  } = useLeadStore();
  const { data: leads } = useLeads();

  const leadsToExport = selectedLeadIds.length > 0 
    ? leads?.filter(l => selectedLeadIds.includes(l.id)) 
    : leads;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Leads Pipeline</h1>
          <p className="text-muted-foreground">Manage, track, and convert your business prospects.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="default" 
            className="gap-2 shrink-0"
            onClick={() => {
              if (leadsToExport) {
                exportLeadsToCSV(leadsToExport);
                if (selectedLeadIds.length > 0) {
                  toast({ title: 'Export Complete', description: `Exported ${selectedLeadIds.length} selected leads.` });
                  clearSelection();
                }
              }
            }}
            disabled={!leadsToExport?.length}
          >
            <Download className="h-4 w-4" />
            <span>{selectedLeadIds.length > 0 ? `Export (${selectedLeadIds.length})` : 'Export CSV'}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="default" className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                <span>Add Lead</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setUploadJsonOpen(true)}>
                <FileJson className="mr-2 h-4 w-4" />
                <span>Upload JSON</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUploadSheetOpen(true)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span>Upload Sheet</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openAddLead}>
                <Keyboard className="mr-2 h-4 w-4" />
                <span>Manual Entry</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                if (apifyApiKey) {
                  setActiveTab('discover');
                } else {
                  setConnectApifyOpen(true);
                }
              }}>
                <Unplug className="mr-2 h-4 w-4" />
                <span>Connect Apify</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-2 rounded-lg border">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-leads"
            placeholder="Search leads by name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div className="h-8 w-px bg-border hidden sm:block mx-1" />

        <div className="flex items-center gap-3 w-full sm:w-auto px-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as LeadStatus | 'All')}
          >
            <SelectTrigger id="filter-status" className="w-[140px] border-none bg-transparent hover:bg-muted/50 focus:ring-0">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center rounded-md border p-1 bg-secondary/50 shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-sm ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-sm ${viewMode === 'table' ? 'bg-background shadow-sm' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <LeadList />
    </div>
  );
}
