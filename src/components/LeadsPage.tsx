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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, FileJson, FileSpreadsheet, Keyboard, Unplug, LayoutGrid, List, Download, Trash2, X, CheckCircle2, FolderOpen } from 'lucide-react';
import type { LeadStatus } from '@/types';
import { exportLeadsToCSV } from '@/lib/export-utils';
import { useLeads, useFilteredLeads, useDeleteLead } from '@/hooks/useLeads';
import { toast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ALL_STATUSES: (LeadStatus | 'All')[] = [
  'All', 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost',
];

export function LeadsPage({ isRejectedView }: { isRejectedView?: boolean }) {
  const {
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    sourceCategoryFilter, setSourceCategoryFilter,
    viewMode, setViewMode,
    openAddLead, setUploadJsonOpen, setUploadSheetOpen, setConnectApifyOpen,
    apifyApiKey, setActiveTab, selectedLeadIds, clearSelection,
    isPlaylistView, setIsPlaylistView
  } = useLeadStore();
  
  const { data: allLeads } = useLeads();
  const { data: leads } = useFilteredLeads();
  const deleteLead = useDeleteLead();

  const uniqueCategories = Array.from(new Set((allLeads || []).map(l => l.sourceCategory).filter(Boolean)));

  const leadsToExport = selectedLeadIds.length > 0 
    ? leads?.filter(l => selectedLeadIds.includes(l.id)) 
    : leads;

  const handleBulkDelete = async () => {
    if (!selectedLeadIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected leads?`)) return;
    
    try {
      // We'll delete one by one for now since the API handles IDs.
      // In a real app, we might have a /bulk-delete endpoint.
      await Promise.all(selectedLeadIds.map(id => deleteLead.mutateAsync(id)));
      toast({ title: 'Success', description: `Deleted ${selectedLeadIds.length} leads.`, variant: 'success' });
      clearSelection();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete leads.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {isRejectedView ? 'Rejected Leads' : 'Leads Pipeline'}
          </h1>
          <p className="text-muted-foreground">
            {isRejectedView ? 'Review leads that were unresponsive or disqualified.' : 'Manage, track, and convert your business prospects.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="default" 
                className="gap-2 shrink-0"
                disabled={!leads?.length}
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => leads && exportLeadsToCSV(leads)}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                <span>Export All ({leads?.length || 0})</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                disabled={selectedLeadIds.length === 0}
                onClick={() => {
                  if (leadsToExport) {
                    exportLeadsToCSV(leadsToExport);
                    toast({ title: 'Export Complete', description: `Exported ${selectedLeadIds.length} selected leads.` });
                    clearSelection();
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Export Selected ({selectedLeadIds.length})</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
          {!isRejectedView && (
            <>
              {uniqueCategories.length > 0 && (
                <Select
                  value={sourceCategoryFilter}
                  onValueChange={(v) => setSourceCategoryFilter(v)}
                >
                  <SelectTrigger className="w-[160px] border-none bg-transparent hover:bg-muted/50 focus:ring-0">
                    <SelectValue placeholder="Sheet / Playlist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Sheets</SelectItem>
                    {uniqueCategories.map((cat: any) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as LeadStatus | 'All')}
              >
                <SelectTrigger id="filter-status" className="w-[140px] border-none bg-transparent hover:bg-muted/50 focus:ring-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {/* Playlist View Toggle */}
          <div className="flex items-center rounded-md border p-1 bg-secondary/50 shrink-0 mr-2">
            <Button
              variant={!isPlaylistView ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs rounded-sm ${!isPlaylistView ? 'bg-background shadow-sm' : ''}`}
              onClick={() => setIsPlaylistView(false)}
            >
              Leads
            </Button>
            <Button
              variant={isPlaylistView ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs rounded-sm ${isPlaylistView ? 'bg-background shadow-sm' : ''}`}
              onClick={() => setIsPlaylistView(true)}
            >
              Playlists
            </Button>
          </div>

          {/* View Toggle (Only in Leads View) */}
          {!isPlaylistView && (
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
          )}
        </div>
      </div>

      {isPlaylistView ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uniqueCategories.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-lg">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No playlists available yet.</p>
              <p className="text-sm">Upload a CSV sheet to automatically create a playlist.</p>
            </div>
          ) : (
            uniqueCategories.map((cat: any) => {
              const count = allLeads?.filter(l => l.sourceCategory === cat).length || 0;
              return (
                <Card 
                  key={cat} 
                  className="cursor-pointer hover:border-primary/50 transition-colors group"
                  onClick={() => {
                    setSourceCategoryFilter(cat);
                    setIsPlaylistView(false);
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1" title={cat}>
                      {cat}
                    </CardTitle>
                    <CardDescription>Imported Sheet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Leads:</span>
                      <span className="font-semibold bg-secondary px-2 py-0.5 rounded text-xs">{count}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <LeadList isRejectedView={isRejectedView} />
      )}

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedLeadIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 px-6 py-4 bg-gray-900 dark:bg-gray-800 text-white rounded-full shadow-2xl border border-white/10"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-white/20">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-semibold whitespace-nowrap">
                {selectedLeadIds.length} leads selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/10 gap-2 h-9"
                onClick={() => {
                  if (leadsToExport) {
                    exportLeadsToCSV(leadsToExport);
                    toast({ title: 'Export Complete', description: `Exported ${selectedLeadIds.length} selected leads.` });
                    clearSelection();
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>

              <Button 
                size="sm" 
                variant="ghost" 
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 h-9"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>

              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-white/50 hover:text-white"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
