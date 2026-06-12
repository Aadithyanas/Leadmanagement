import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/hooks/useToast';

interface AuthScreenProps {
  onComplete: () => void;
}

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [error, setError] = useState('');
  
  const [step, setStep] = useState<'auth' | 'create_org'>('auth');
  const [inviteOrgName, setInviteOrgName] = useState<string | null>(null);

  const { setUser, setOrgs, setActiveOrg } = useAuthStore();

  useEffect(() => {
    // Check for pending invite
    const pendingInviteToken = localStorage.getItem('leadflow_invite_token');
    if (pendingInviteToken) {
      setMode('signup');
      supabase
        .from('organization_invites')
        .select('organizations(name)')
        .eq('token', pendingInviteToken)
        .single()
        .then(({ data }) => {
          if (data && data.organizations) {
            setInviteOrgName((data.organizations as any).name);
          }
        });
    }

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserLoggedIn(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserLoggedIn(session.user);
      } else {
        setUser(null);
        setStep('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserLoggedIn = async (user: any) => {
    setUser(user);
    // Check organizations
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('role, team_id, organizations(id, name)')
      .eq('user_id', user.id);

    if (error) {
      console.error(error);
      return;
    }

    if (members && members.length > 0) {
      const orgsList = members.map(m => ({
        id: (m.organizations as any).id,
        name: (m.organizations as any).name,
        role: m.role as any,
        teamId: m.team_id || undefined
      }));
      setOrgs(orgsList);
      setActiveOrg(orgsList[0]);
      onComplete();
    } else {
      setStep('create_org');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!form.email || !form.password) { setError('Please fill all required fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { name: form.name }
          }
        });
        if (signUpError) throw signUpError;
        toast({ title: 'Success', description: 'Account created. Please check your email if confirmation is enabled, otherwise you are logged in.' });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.orgName) { setError('Organization name is required.'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_organization', {
        org_name: form.orgName,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      const newOrg = { id: (data as any).id, name: (data as any).name, role: 'owner' as const };
      setOrgs([newOrg]);
      setActiveOrg(newOrg);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 mb-4">
            <Zap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Lead<span className="text-primary">Flow</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {step === 'auth' ? 'Lightweight Lead Management CRM' : 'Set up your workspace'}
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-xl shadow-black/5 p-6">
          {step === 'auth' ? (
            <>
              {inviteOrgName && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                    You've been invited to join <span className="font-bold">{inviteOrgName}</span>
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    Create an account or sign in to accept the invitation.
                  </p>
                </div>
              )}
              <h2 className="text-lg font-semibold mb-1">
                {mode === 'login' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {mode === 'login'
                  ? 'Enter your credentials to access your dashboard'
                  : 'Fill in your details to get started'}
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-name">Name</Label>
                    <Input id="auth-name" placeholder="Your name" value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input id="auth-email" type="email" placeholder="you@company.com" required
                    value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password">Password</Label>
                  <div className="relative">
                    <Input id="auth-password" type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••" required value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-1">Create Organization</h2>
              <p className="text-sm text-muted-foreground mb-5">
                You need an organization to start managing leads.
              </p>
              
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" placeholder="Acme Corp" required value={form.orgName}
                    onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))} />
                </div>
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create & Continue
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
