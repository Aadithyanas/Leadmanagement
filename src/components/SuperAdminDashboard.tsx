import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/useToast';
import { Loader2, ArrowRight, Building2, ShieldAlert } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export function SuperAdminDashboard() {
  const { setActiveOrg, setOrgs, orgs } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      // Super admins bypass RLS and can see all organizations
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to fetch organizations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnterOrganization = (org: Organization) => {
    const orgData = {
      id: org.id,
      name: org.name,
      role: 'owner' as const, // Treat super admin as owner of the org when entered
      teamId: undefined
    };

    // If it's not already in the orgs list, add it temporarily so the Header switcher works
    if (!orgs.find(o => o.id === org.id)) {
      setOrgs([...orgs, orgData]);
    }
    
    setActiveOrg(orgData);
    toast({ title: 'Entered Organization', description: `You are now viewing ${org.name} as Super Admin.`, variant: 'success' });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" />
          Super Admin Console
        </h1>
        <p className="text-muted-foreground">
          System-level overview of all organizations. You can enter any organization to manage its data.
        </p>
      </div>

      {organizations.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
          No organizations found in the system.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription>
                      Created: {new Date(org.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex items-end">
                <Button 
                  className="w-full mt-4" 
                  variant="secondary"
                  onClick={() => handleEnterOrganization(org)}
                >
                  Enter Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
