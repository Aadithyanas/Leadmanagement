import { Search, Plus, LogOut, Zap, FileJson, FileSpreadsheet, Keyboard, Unplug, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLeadStore } from '@/store/useLeadStore';
import type { LeadStatus } from '@/types';

const ALL_STATUSES: (LeadStatus | 'All')[] = [
  'All', 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost',
];

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
}

export function Header({ userName, onLogout }: HeaderProps) {
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, openAddLead, setUploadJsonOpen, setUploadSheetOpen, setConnectApifyOpen, viewMode, setViewMode } = useLeadStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:block">
            Lead<span className="text-primary">Flow</span>
          </span>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-leads"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as LeadStatus | 'All')}
        >
          <SelectTrigger id="filter-status" className="w-[150px] hidden sm:flex">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="hidden sm:flex items-center rounded-md border p-1 bg-secondary/50">
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

        {/* Add Lead Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button id="btn-add-lead" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Lead</span>
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
            <DropdownMenuItem onClick={() => setConnectApifyOpen(true)}>
              <Unplug className="mr-2 h-4 w-4" />
              <span>Connect Apify</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <div className="flex items-center gap-2 ml-auto">
          {userName && (
            <span className="text-sm text-muted-foreground hidden md:block">
              {userName}
            </span>
          )}
          {onLogout && (
            <Button id="btn-logout" variant="ghost" size="icon" onClick={onLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
