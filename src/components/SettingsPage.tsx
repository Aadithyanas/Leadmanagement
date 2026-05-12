import { useLeadStore } from '@/store/useLeadStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Compass, Key, Save, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/useToast';
import { fetchSettings, updateSettings } from '@/services/api';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function SettingsPage() {
  const { 
    apifyApiKey, setApifyApiKey, 
    notificationEmail, setNotificationEmail,
    enableNotifications, setEnableNotifications
  } = useLeadStore();
  const [keyInput, setKeyInput] = useState(apifyApiKey);
  const [emailInput, setEmailInput] = useState(notificationEmail);
  const [notifEnabled, setNotifEnabled] = useState(enableNotifications);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Sync with backend on mount
  useEffect(() => {
    fetchSettings().then(settings => {
      setApifyApiKey(settings.apifyApiKey);
      setNotificationEmail(settings.notificationEmail);
      setEnableNotifications(settings.enableNotifications);
      setKeyInput(settings.apifyApiKey);
      setEmailInput(settings.notificationEmail);
      setNotifEnabled(settings.enableNotifications);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        apifyApiKey: keyInput,
        notificationEmail: emailInput,
        enableNotifications: notifEnabled
      });
      
      setApifyApiKey(keyInput);
      setNotificationEmail(emailInput);
      setEnableNotifications(notifEnabled);
      
      toast({ title: 'Settings Saved', description: 'Your preferences have been successfully updated on the server.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailInput) {
      toast({ title: 'Error', description: 'Please enter an email address first.', variant: 'destructive' });
      return;
    }
    
    setIsTesting(true);
    try {
      const res = await fetch(`${API_BASE}/leads/test-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test email');
      
      toast({ title: 'Success', description: 'Test email sent! Check your inbox (and spam folder).', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Mail Error', description: err.message || 'Failed to send test email. Check server credentials.', variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your application preferences and external integrations.</p>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="border-b p-6 bg-muted/20">
          <div className="flex items-center gap-3 mb-1">
            <Compass className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold">Apify Integration</h2>
          </div>
          <p className="text-sm text-muted-foreground">Connect your Apify account to scrape business leads directly from maps and directories.</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2 max-w-xl">
            <Label htmlFor="apify-key" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </Label>
            <Input 
              id="apify-key"
              type="password"
              placeholder="apify_api_xxxxxxxxxxxxxxxxxxxxx" 
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This key will be encrypted and saved in your database profile. It allows the Discover tool to run actor jobs on your behalf.
            </p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="border-b p-6 bg-muted/20">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-5 w-5 text-emerald-500 flex items-center justify-center">
              <span className="text-xl">📧</span>
            </div>
            <h2 className="text-lg font-semibold">Email Notifications</h2>
          </div>
          <p className="text-sm text-muted-foreground">Receive alerts for overdue follow-ups and expiring leads directly in your inbox.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-alerts" className="text-base font-medium cursor-pointer">
                Enable Expiry Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a lead's follow-up date has passed.
              </p>
            </div>
            <input 
              type="checkbox"
              id="enable-alerts"
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
              checked={notifEnabled}
              onChange={(e) => setNotifEnabled(e.target.checked)}
            />
          </div>

          <div className="space-y-2 max-w-xl">
            <Label htmlFor="notif-email" className="flex items-center gap-2">
              Notification Email
            </Label>
            <Input 
              id="notif-email"
              type="email"
              placeholder="your-email@gmail.com" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={!notifEnabled}
            />
            <p className="text-xs text-muted-foreground">
              Leads that are "Overdue" will trigger a daily summary email to this address.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || (keyInput === apifyApiKey && emailInput === notificationEmail && notifEnabled === enableNotifications)}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save All Settings'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleTestEmail}
              disabled={isTesting || !emailInput}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isTesting ? 'Sending Test...' : 'Send Test Email'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
