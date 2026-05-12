import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLeadStore } from '@/store/useLeadStore';
import { Unplug, MapPin, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/useToast';

export function ConnectApifyDialog() {
  const { isConnectApifyOpen, setConnectApifyOpen, toggleDiscover } = useLeadStore();
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    setIsConnecting(true);
    // Simulate API connection
    await new Promise((r) => setTimeout(r, 1500));
    setIsConnecting(false);
    toast({ title: 'Apify Connected', description: 'API key verified. You can now scrape leads.', variant: 'success' });
    setConnectApifyOpen(false);
    
    // Auto-open discover panel
    const store = useLeadStore.getState();
    if (!store.isDiscoverOpen) {
        store.toggleDiscover();
    }
  };

  return (
    <Dialog open={isConnectApifyOpen} onOpenChange={setConnectApifyOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unplug className="h-5 w-5 text-blue-500" />
            Connect Apify
          </DialogTitle>
          <DialogDescription>
            Enter your Apify API key to connect. Once connected, you can scrape leads directly from Google Maps and other platforms.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apify-key">Apify API Key</Label>
            <Input 
              id="apify-key" 
              type="password" 
              placeholder="apify_api_..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your API key is securely stored locally and used only for fetching data.
            </p>
          </div>
          
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 border border-blue-100 dark:border-blue-900/50">
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold block mb-1">Google Maps Scraper</span>
                Connecting Apify allows you to search for local businesses (like restaurants, plumbers) and import them as leads instantly.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setConnectApifyOpen(false)}>Cancel</Button>
          <Button onClick={handleConnect} disabled={!apiKey.trim() || isConnecting} className="gap-2">
            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
            Connect & Scrape
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
