import { useState } from 'react';
import { usePlaylists, useCreatePlaylist, useDeletePlaylist, useLeads, useAssignableMembers, useUpdatePlaylistAssignee } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, ListMusic, Trash2, Calendar } from 'lucide-react';
import { PlaylistSpreadsheet } from '@/components/PlaylistSpreadsheet';
import { formatDate } from '@/lib/date-utils';
import type { Playlist } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

export function PlaylistsPage() {
  const { data: playlists, isLoading: isPlaylistsLoading } = usePlaylists();
  const { data: leads, isLoading: isLeadsLoading } = useLeads();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const { user, activeOrg } = useAuthStore();
  const assignableMembers = useAssignableMembers();
  const updatePlaylistAssignee = useUpdatePlaylistAssignee();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const isLoading = isPlaylistsLoading || isLeadsLoading;

  const isPrivileged = activeOrg?.role === 'owner' || activeOrg?.role === 'admin' || activeOrg?.role === 'hr' || activeOrg?.role === 'leader';

  const visiblePlaylists = (playlists || []).filter(p => {
    if (isPrivileged) return true;
    if (p.createdBy === user?.id) return true;
    return (leads || []).some(l => l.playlistId === p.id && l.assignedTo === user?.id);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      const p = await createPlaylist.mutateAsync(newPlaylistName.trim());
      toast({ title: 'Playlist created', variant: 'success' });
      setIsCreateOpen(false);
      setNewPlaylistName('');
      setSelectedPlaylist(p);
    } catch {
      toast({ title: 'Error creating playlist', variant: 'destructive' });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this playlist? The leads inside it will still exist but will lose this association.')) return;
    try {
      await deletePlaylist.mutateAsync(id);
      toast({ title: 'Playlist deleted', variant: 'success' });
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null);
      }
    } catch {
      toast({ title: 'Error deleting playlist', variant: 'destructive' });
    }
  };

  const handleAssignPlaylist = async (playlistId: string, memberId: string) => {
    try {
      await updatePlaylistAssignee.mutateAsync({ 
        playlistId, 
        assignedTo: memberId === 'unassigned' ? null : memberId 
      });
      toast({ title: 'Playlist assigned', variant: 'success' });
    } catch {
      toast({ title: 'Error assigning playlist', variant: 'destructive' });
    }
  };

  if (selectedPlaylist) {
    return <PlaylistSpreadsheet playlist={selectedPlaylist} onBack={() => setSelectedPlaylist(null)} />;
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Vibe Sheets (Playlists)</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and create leads rapidly with spreadsheet vibes.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Create Playlist
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !visiblePlaylists || visiblePlaylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <ListMusic className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No playlists found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-6">Create your first Vibe Sheet to quickly add leads using a spreadsheet-style interface.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="secondary" className="gap-2">
              <Plus className="h-4 w-4" />
              Start a Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visiblePlaylists.map((playlist) => (
              <div 
                key={playlist.id}
                onClick={() => setSelectedPlaylist(playlist)}
                className="group relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <ListMusic className="h-5 w-5" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all -mt-1 -mr-1"
                    onClick={(e) => handleDelete(e, playlist.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <h3 className="font-semibold text-lg line-clamp-1 mb-1">{playlist.name}</h3>
                
                {isPrivileged && (
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <Select onValueChange={(v) => handleAssignPlaylist(playlist.id, v)}>
                      <SelectTrigger className="h-8 text-xs w-full bg-secondary/50">
                        <SelectValue placeholder="Assign Playlist" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {assignableMembers?.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  Created {formatDate(playlist.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
                <DialogDescription>Give your vibe sheet a catchy name.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Input
                    id="name"
                    placeholder="e.g. Q3 Healthcare Outreach"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPlaylist.isPending || !newPlaylistName.trim()}>
                  {createPlaylist.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
