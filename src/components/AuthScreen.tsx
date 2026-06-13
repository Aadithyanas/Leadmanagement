import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
            data: { name: form.name },
            emailRedirectTo: window.location.origin
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
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative text-white font-body selection:bg-primary/40 selection:text-white p-4">
      
      {/* Massive Background Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <h1 className="text-[15rem] md:text-[25rem] font-black tracking-tighter uppercase whitespace-nowrap opacity-5 select-none text-white/50 mix-blend-overlay rotate-[-5deg]">
          LEAD FLOW
        </h1>
      </div>

      {/* Animated Green/Black Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 mix-blend-screen">
        <motion.div 
          animate={{ x: ['-20%', '20%', '-20%'], y: ['-10%', '10%', '-10%'], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-primary/20 blur-[150px] rounded-full"
        />
        <motion.div 
          animate={{ x: ['20%', '-20%', '20%'], y: ['10%', '-10%', '10%'], scale: [1, 1.5, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-[70vw] h-[70vh] bg-emerald-600/10 blur-[150px] rounded-full"
        />
      </div>

      {/* Interactive Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl text-primary shadow-[0_0_30px_rgba(34,197,94,0.2)] mb-6 group cursor-pointer"
          >
            <Zap className="h-8 w-8 group-hover:drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-all duration-300" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight uppercase">
            Lead<span className="text-primary drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">Flow</span>
          </h1>
          <p className="text-white/40 mt-3 font-medium uppercase tracking-widest text-xs">
            {step === 'auth' ? 'System Authorization' : 'Initialize Workspace'}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_80px_rgba(34,197,94,0.05)] p-8 md:p-10 relative overflow-hidden">
          
          {/* Internal subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          {step === 'auth' ? (
            <>
              {inviteOrgName && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-xl text-center"
                >
                  <h3 className="text-sm font-bold text-primary">
                    Invitation Pending: <span className="text-white">{inviteOrgName}</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-2 font-medium">
                    Authenticate to accept access.
                  </p>
                </motion.div>
              )}
              
              <h2 className="text-2xl font-bold mb-2">
                {mode === 'login' ? 'Welcome Back.' : 'Initialize Account.'}
              </h2>
              <p className="text-sm text-white/50 mb-8 font-medium">
                {mode === 'login'
                  ? 'Enter credentials to access the system.'
                  : 'Enter your details to generate an access token.'}
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-name" className="text-xs font-bold uppercase tracking-widest text-white/70">Name</Label>
                    <Input 
                      id="auth-name" 
                      placeholder="John Doe" 
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} 
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl transition-all"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="auth-email" className="text-xs font-bold uppercase tracking-widest text-white/70">Email Sequence</Label>
                  <Input 
                    id="auth-email" 
                    type="email" 
                    placeholder="agent@company.com" 
                    required
                    value={form.email} 
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} 
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-password" className="text-xs font-bold uppercase tracking-widest text-white/70">Security Key</Label>
                    {mode === 'login' && (
                      <a href="#" className="text-xs font-bold text-primary/80 hover:text-primary transition-colors">Recover?</a>
                    )}
                  </div>
                  <div className="relative">
                    <Input 
                      id="auth-password" 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••" 
                      required 
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} 
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl transition-all pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    {error}
                  </motion.p>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] mt-4 group flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      {mode === 'login' ? 'Authenticate' : 'Initialize'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center border-t border-white/10 pt-8">
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                  className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest"
                >
                  {mode === 'login' ? "Require an account? Register" : 'Already initialized? Login'}
                </button>
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-2xl font-bold mb-2">Configure Workspace.</h2>
              <p className="text-sm text-white/50 mb-8 font-medium">
                Establish an organization to begin operations.
              </p>
              
              <form onSubmit={handleCreateOrg} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="text-xs font-bold uppercase tracking-widest text-white/70">Organization Identifier</Label>
                  <Input 
                    id="org-name" 
                    placeholder="Acme Corp" 
                    required 
                    value={form.orgName}
                    onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))} 
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 h-12 rounded-xl transition-all"
                  />
                </div>
                
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                    {error}
                  </motion.p>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 group"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      Deploy Instance
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
