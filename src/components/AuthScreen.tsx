import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthUser {
  name: string;
  email: string;
}

interface AuthScreenProps {
  onLogin: (user: AuthUser) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill all required fields.'); return; }
    if (mode === 'signup' && !form.name) { setError('Name is required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    // Simulate auth — replace with Amplify Auth
    await new Promise((r) => setTimeout(r, 800));

    // Demo: store credentials in localStorage
    const key = `leadflow_user_${form.email}`;
    if (mode === 'signup') {
      localStorage.setItem(key, JSON.stringify({ name: form.name, email: form.email }));
      localStorage.setItem('leadflow_session', form.email);
      onLogin({ name: form.name, email: form.email });
    } else {
      const stored = localStorage.getItem(key);
      if (stored) {
        const user = JSON.parse(stored) as AuthUser;
        localStorage.setItem('leadflow_session', form.email);
        onLogin(user);
      } else {
        // Auto-login for demo
        const name = form.email.split('@')[0] || 'User';
        localStorage.setItem(key, JSON.stringify({ name, email: form.email }));
        localStorage.setItem('leadflow_session', form.email);
        onLogin({ name, email: form.email });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 mb-4">
            <Zap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Lead<span className="text-primary">Flow</span>
          </h1>
          <p className="text-muted-foreground mt-1">Lightweight Lead Management CRM</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-xl shadow-black/5 p-6">
          <h2 className="text-lg font-semibold mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {mode === 'login'
              ? 'Enter your credentials to access your dashboard'
              : 'Fill in your details to get started'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Demo mode — any email/password will work
        </p>
      </motion.div>
    </div>
  );
}
