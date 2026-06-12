import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { consumeInvitation } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/useToast';
import { Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function InviteAcceptScreen({ token, onComplete }: { token: string, onComplete: () => void }) {
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkInvite() {
      const { data: invite, error: fetchError } = await supabase
        .from('organization_invites')
        .select('*, organizations(name)')
        .eq('token', token)
        .single();
        
      if (fetchError || !invite) {
        setError('Invalid or expired invite link.');
      } else {
        setInvite(invite);
      }
      setLoading(false);
    }
    checkInvite();
  }, [token]);

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    // Ensure user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Sign In Required', description: 'Please sign in or create an account first.', variant: 'destructive' });
      onComplete(); // Hand back to App to show AuthScreen
      return;
    }

    try {
      await consumeInvitation(token);
      setSuccess(true);
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg mb-4">
            <Zap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Invite</h1>
        </div>

        <div className="rounded-2xl border bg-card shadow-xl p-6 text-center">
          {error ? (
            <div className="space-y-4">
              <p className="text-destructive font-medium">{error}</p>
              <Button onClick={onComplete} className="w-full">Go to Home</Button>
            </div>
          ) : success ? (
            <div className="space-y-4 flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
              <h2 className="text-xl font-bold">Invite Accepted!</h2>
              <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                You've been invited to join <span className="text-primary">{(invite.organizations as any)?.name}</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Click below to accept the invitation and join the organization.
              </p>
              <Button onClick={handleAccept} disabled={loading} className="w-full" size="lg">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accept Invitation
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
