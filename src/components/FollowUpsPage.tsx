import { useState } from 'react';
import { useLeads, useOrgMembers, usePlaylists } from '@/hooks/useLeads';
import { useLeadStore } from '@/store/useLeadStore';
import { LeadCard } from '@/components/LeadCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Inbox, Loader2 } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, addMonths, subMonths, parseISO, isToday
} from 'date-fns';
import { cn } from '@/lib/utils';

export function FollowUpsPage() {
  const { selectedFollowUpDate, setSelectedFollowUpDate } = useLeadStore();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedFollowUpDate || new Date()));
  const { data: leads, isLoading } = useLeads();
  const { data: members } = useOrgMembers();
  const { data: playlists } = usePlaylists();
  
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState<string>('All');

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Generate grid
  const startDate = startOfWeek(startOfMonth(currentMonth));
  const endDate = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  let filteredLeads = leads || [];

  if (assigneeFilter !== 'All') {
    if (assigneeFilter === 'Unassigned') {
      filteredLeads = filteredLeads.filter(l => !l.assignedTo);
    } else {
      filteredLeads = filteredLeads.filter(l => l.assignedTo === assigneeFilter);
    }
  }

  if (sourceCategoryFilter !== 'All') {
    if (sourceCategoryFilter.startsWith('playlist:')) {
      const pId = sourceCategoryFilter.replace('playlist:', '');
      filteredLeads = filteredLeads.filter(l => l.playlistId === pId);
    } else {
      filteredLeads = filteredLeads.filter(l => l.sourceCategory === sourceCategoryFilter);
    }
  }

  const followUpMap = new Map<string, number>();
  filteredLeads.forEach(lead => {
    if (lead.followUpAt) {
      try {
        const dateStr = format(parseISO(lead.followUpAt), 'yyyy-MM-dd');
        followUpMap.set(dateStr, (followUpMap.get(dateStr) || 0) + 1);
      } catch (e) {
        // invalid date
      }
    }
  });

  const selectedDateStr = selectedFollowUpDate ? format(selectedFollowUpDate, 'yyyy-MM-dd') : '';
  const selectedLeads = filteredLeads.filter(l => l.followUpAt && format(parseISO(l.followUpAt), 'yyyy-MM-dd') === selectedDateStr);

  const uniqueCategories = Array.from(new Set((leads || []).map(l => l.sourceCategory).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Follow-Ups</h1>
        <p className="text-muted-foreground">Manage and track your scheduled follow-ups via the calendar view.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border shadow-sm h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-24 text-center">
                {format(currentMonth, 'MMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs font-semibold text-muted-foreground py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = followUpMap.get(dateStr) || 0;
                const isSelected = selectedDateStr === dateStr;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFollowUpDate(day)}
                    className={cn(
                      "relative h-10 w-full flex flex-col items-center justify-center rounded-md text-sm transition-colors cursor-pointer",
                      !isCurrentMonth && "text-muted-foreground/30",
                      isSelected ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "hover:bg-muted",
                      isTodayDate && !isSelected && "bg-secondary text-secondary-foreground font-semibold border border-primary/20",
                    )}
                  >
                    <span>{format(day, 'd')}</span>
                    {count > 0 && (
                      <span className={cn(
                        "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Has Follow-Ups</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-primary/20 bg-secondary" />
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Scheduled for {selectedFollowUpDate ? format(selectedFollowUpDate, 'MMMM d, yyyy') : '...'}
              <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs">
                {selectedLeads.length}
              </span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Select value={sourceCategoryFilter} onValueChange={setSourceCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="Sheet / Playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sheets & Playlists</SelectItem>
                  {playlists && playlists.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20 my-1 rounded-sm select-none">Playlists</div>
                      {playlists.map(p => (
                        <SelectItem key={p.id} value={`playlist:${p.id}`}>{p.name}</SelectItem>
                      ))}
                    </>
                  )}
                  {uniqueCategories.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20 my-1 rounded-sm select-none">Imported Sheets</div>
                      {uniqueCategories.map((cat: any) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Members</SelectItem>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  {members?.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedLeads.length === 0 ? (
            <Card className="border-dashed bg-transparent shadow-none flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No follow-ups for this date</p>
              <p className="text-xs mt-1">Select a date with a blue dot to view scheduled leads.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedLeads.map((lead, i) => (
                <LeadCard key={lead.id} lead={lead} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
