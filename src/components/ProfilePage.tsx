import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Mail, Copy, Building, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/useToast';
import { fetchOrgMembers, OrgMember } from '@/services/api';
import { useTeams, useCreateTeam, useCreateInvitation, useUpdateMemberTeam, useUpdateMemberRole, useRemoveMember } from '@/hooks/useLeads';
import { supabase } from '@/lib/supabase';

export function ProfilePage() {
  const { user, activeOrg } = useAuthStore();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'leader' | 'hr' | 'member'>('member');
  const [inviteTeamId, setInviteTeamId] = useState<string>('none');
  const [inviteLink, setInviteLink] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setProfileName(user.user_metadata.full_name);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: profileName }
      });
      if (error) throw error;
      
      useAuthStore.getState().setUser(data.user);
      toast({ title: 'Profile Updated', description: 'Your personal details have been saved.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  const { data: teams } = useTeams();
  const createTeam = useCreateTeam();
  const createInvitation = useCreateInvitation();
  const updateMemberTeam = useUpdateMemberTeam();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  
  const [newTeamName, setNewTeamName] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (activeOrg?.role === 'owner' || activeOrg?.role === 'admin') {
      setIsLoadingMembers(true);
      fetchOrgMembers()
        .then(setMembers)
        .catch((err) => {
          console.error(err);
          toast({ title: 'Error', description: 'Failed to fetch members.', variant: 'destructive' });
        })
        .finally(() => setIsLoadingMembers(false));
    } else if (activeOrg) {
      // If just a regular member, they can only see themselves or maybe we can fetch members
      // But let's just fetch their own profile details
    }
  }, [activeOrg]);

  const handleGenerateInvite = async () => {
    if (!inviteEmail || !activeOrg) return;
    setIsGeneratingInvite(true);
    try {
      const invite = await createInvitation.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
        teamId: inviteTeamId === 'none' ? undefined : inviteTeamId
      });
      
      const link = `${window.location.origin}?invite=${invite.token}`;
      setInviteLink(link);
      
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          targetEmail: inviteEmail, 
          inviteLink: link, 
          orgName: activeOrg.name, 
          role: inviteRole
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to send invite email via Supabase Edge Function');
      }
      
      toast({ title: 'Invite Sent', description: 'An email with the invite link has been sent to the user automatically via Resend.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setIsCreatingTeam(true);
    try {
      await createTeam.mutateAsync(newTeamName.trim());
      setNewTeamName('');
      toast({ title: 'Team Created', description: `Team "${newTeamName}" has been created.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Copied!', description: 'Invite link copied to clipboard.' });
  };

  const handleUpdateMemberTeam = async (memberId: string, teamId: string | null) => {
    try {
      await updateMemberTeam.mutateAsync({ memberId, teamId });
      toast({ title: 'Updated', description: 'Member team updated successfully.', variant: 'success' });
      setMembers(members.map(m => {
        if (m.id === memberId) {
          const tName = teamId ? teams?.find(t => t.id === teamId)?.name : null;
          return { ...m, teamId: teamId || null, teamName: tName || undefined };
        }
        return m;
      }));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    try {
      await updateMemberRole.mutateAsync({ memberId, role });
      toast({ title: 'Updated', description: 'Member role updated successfully.', variant: 'success' });
      setMembers(members.map(m => m.id === memberId ? { ...m, role: role as any } : m));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMember.mutateAsync(memberId);
      toast({ title: 'Removed', description: 'Member removed successfully.', variant: 'success' });
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & Organization</h1>
        <p className="text-muted-foreground">Manage your personal profile and organization settings.</p>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden mb-8">
        <div className="border-b p-6 bg-muted/20">
          <div className="flex items-center gap-3 mb-1">
            <User className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">Personal Profile</h2>
          </div>
          <p className="text-sm text-muted-foreground">Update your personal information.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)} 
                placeholder="e.g. John Doe" 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-muted text-muted-foreground"
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={isSavingProfile || !profileName.trim()}>
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="border-b p-6 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Users className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Organization: {activeOrg?.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground">Manage your team and invite new members.</p>
            </div>
            <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
              {activeOrg?.role}
            </div>
          </div>
        </div>
        
        {(activeOrg?.role === 'owner' || activeOrg?.role === 'admin') ? (
          <div className="p-6 space-y-6">
            {/* Teams Management */}
            <div className="space-y-3 max-w-xl pb-4 border-b">
              <Label>Manage Teams</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="New Team Name (e.g. Sales)" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <Button onClick={handleCreateTeam} disabled={isCreatingTeam || !newTeamName.trim()} variant="secondary">
                  Create Team
                </Button>
              </div>
              {teams && teams.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {teams.map(t => (
                    <span key={t.id} className="px-2.5 py-1 bg-muted rounded-full text-xs font-medium border">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Invite Member */}
            <div className="space-y-3 max-w-xl">
              <Label htmlFor="invite-email">Invite Team Member</Label>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                  >
                    <option value="member">Member</option>
                    <option value="hr">HR</option>
                    <option value="leader">Leader</option>
                    {activeOrg.role === 'owner' && <option value="admin">Admin</option>}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Team</Label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={inviteTeamId}
                    onChange={(e) => setInviteTeamId(e.target.value)}
                    disabled={inviteRole === 'admin'}
                  >
                    <option value="none">No Team (Or Admin)</option>
                    {teams?.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Input 
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com" 
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteLink('');
                  }}
                />
                <Button onClick={handleGenerateInvite} disabled={isGeneratingInvite || !inviteEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>
              
              {inviteLink && (
                <div className="mt-4 p-4 border rounded-md bg-muted/30 flex flex-col gap-2">
                  <span className="text-sm font-medium">Share this link securely:</span>
                  <div className="flex gap-2">
                    <Input readOnly value={inviteLink} className="font-mono text-xs text-muted-foreground" />
                    <Button variant="secondary" size="icon" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Members List */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Current Members</h3>
              {isLoadingMembers ? (
                <p className="text-sm text-muted-foreground">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members found.</p>
              ) : (
                <div className="border rounded-md divide-y overflow-hidden">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-card">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{member.name || 'Unknown'}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{member.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.role !== 'owner' && activeOrg.role === 'owner' && (
                          <div className="flex items-center gap-2">
                            <select
                              className="h-7 rounded border border-input bg-transparent px-2 text-xs max-w-[120px]"
                              value={member.role || 'member'}
                              onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                              disabled={updateMemberRole.isPending}
                            >
                              <option value="member">Member</option>
                              <option value="hr">HR</option>
                              <option value="leader">Leader</option>
                              <option value="admin">Admin</option>
                            </select>
                            <select
                              className="h-7 rounded border border-input bg-transparent px-2 text-xs max-w-[120px]"
                              value={member.teamId || 'none'}
                              onChange={(e) => handleUpdateMemberTeam(member.id, e.target.value === 'none' ? null : e.target.value)}
                              disabled={updateMemberTeam.isPending}
                            >
                              <option value="none">No Team</option>
                              {teams?.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {member.role !== 'owner' && activeOrg.role !== 'owner' && member.teamName && (
                          <span className="px-1.5 py-0.5 bg-muted rounded border text-xs">{member.teamName}</span>
                        )}
                        {(member.role === 'admin' || member.role === 'owner') && activeOrg.role !== 'owner' && (
                          <div className="px-2 py-1 bg-muted/50 rounded text-xs font-medium uppercase tracking-wider text-foreground border">
                            {member.role}
                          </div>
                        )}
                        {member.role === 'owner' && activeOrg.role === 'owner' && (
                          <div className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-bold uppercase tracking-wider border border-primary/30">
                            Owner
                          </div>
                        )}
                        {(activeOrg.role === 'owner' || (activeOrg.role === 'admin' && member.role !== 'owner' && member.role !== 'admin')) && member.id !== user?.id && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-7 text-xs px-2 ml-2" 
                            onClick={() => handleRemoveMember(member.id)} 
                            disabled={removeMember.isPending}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-muted-foreground">
            You are a member of this organization. You do not have permissions to manage teams or invite new users.
          </div>
        )}
      </div>
    </div>
  );
}
