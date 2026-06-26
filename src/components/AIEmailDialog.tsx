import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLeadStore } from '@/store/useLeadStore';
import { toast } from '@/hooks/useToast';
import { Loader2, Wand2, Copy, Mail, Check } from 'lucide-react';
import { generateProposalEmail, generateWelcomeEmail, generateFollowUpEmail } from '@/lib/ai-service';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchSettings } from '@/services/api';
import type { Lead } from '@/types';

export type EmailType = 'proposal' | 'welcome' | 'followup';

interface AIEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  type: EmailType;
  onComplete: (generatedEmail: string, type: EmailType, followUpAt?: string | null) => void;
}

const TYPE_CONFIG = {
  proposal: {
    title: 'Log Proposal',
    desc: 'draft a professional proposal email, or just log manual notes',
    promptLabel: 'Details / Notes',
    promptPlaceholder: 'Type your manual notes here, OR provide instructions to generate an AI email...',
  },
  welcome: {
    title: 'Log Welcome / Contact',
    desc: 'draft a friendly welcome email, or just log manual notes',
    promptLabel: 'Details / Notes',
    promptPlaceholder: 'Type your manual notes here, OR provide instructions to generate an AI email...',
  },
  followup: {
    title: 'Log Follow-Up',
    desc: 'draft a polite follow-up email, or just log manual notes',
    promptLabel: 'Details / Notes',
    promptPlaceholder: 'Type your manual notes here, OR provide instructions to generate an AI email...',
  }
};

export function AIEmailDialog({ open, onOpenChange, lead, type, onComplete }: AIEmailDialogProps) {
  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const [prompt, setPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [followUpAt, setFollowUpAt] = useState('');
  
  const { user } = useAuthStore();
  const [orgProfile, setOrgProfile] = useState<any>(null);
  
  useEffect(() => {
    fetchSettings().then(settings => setOrgProfile(settings)).catch(console.error);
  }, []);

  const config = TYPE_CONFIG[type];

  const handleGenerate = async () => {
    // For welcome and follow-up, prompt is optional. But let's require it for proposal.
    if (type === 'proposal' && !prompt.trim()) {
      toast({ title: 'Prompt required', description: 'Please provide some details for the proposal.', variant: 'destructive' });
      return;
    }
    if (!openRouterApiKey) {
      toast({ title: 'Configuration Error', description: 'Please set VITE_OPENROUTER_API_KEY in your .env file.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      let email = '';
      const senderName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Sales Representative';
      const profileInfo = orgProfile || {};

      if (type === 'proposal') email = await generateProposalEmail(openRouterApiKey, lead, prompt, senderName, profileInfo);
      else if (type === 'welcome') email = await generateWelcomeEmail(openRouterApiKey, lead, prompt, senderName, profileInfo);
      else if (type === 'followup') email = await generateFollowUpEmail(openRouterApiKey, lead, prompt, senderName, profileInfo);
      
      setGeneratedEmail(email);
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedEmail) return;
    try {
      await navigator.clipboard.writeText(generatedEmail);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({ title: 'Copied to clipboard', variant: 'success' });
    } catch (err) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleOpenEmail = async () => {
    if (!generatedEmail) return;
    
    let subject = `Following up with ${lead.company || lead.name}`;
    let body = generatedEmail;
    
    const subjectMatch = generatedEmail.match(/^Subject:\s*(.*)$/im);
    if (subjectMatch) {
      subject = subjectMatch[1];
      body = generatedEmail.replace(/^Subject:\s*.*$\n*/im, '').trim();
    }

    const isTooLong = body.length > 1500;
    if (isTooLong) {
      try {
        await navigator.clipboard.writeText(body);
        toast({ title: 'Draft Copied!', description: 'The draft was too long for the Gmail link and has been copied to your clipboard. Just hit Paste in Gmail!', variant: 'success' });
      } catch (err) {}
    }

    const bodyParam = isTooLong ? '' : `&body=${encodeURIComponent(body)}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email || '')}&su=${encodeURIComponent(subject)}${bodyParam}`;
    window.open(gmailUrl, '_blank');
  };

  const handleFinish = () => {
    onComplete(generatedEmail || prompt, type, followUpAt || null);
    onOpenChange(false);
    setTimeout(() => {
      setPrompt('');
      setGeneratedEmail('');
      setFollowUpAt('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-indigo-500" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            Provide some key points or links, and the AI will {config.desc} for {lead.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 min-h-[300px]">
          {!generatedEmail ? (
            <div className="space-y-3 h-full flex flex-col">
              <label className="text-sm font-medium">{config.promptLabel}</label>
              <p className="text-xs text-muted-foreground">{config.promptPlaceholder}</p>
              <Textarea
                placeholder={config.promptPlaceholder}
                className="flex-1 min-h-[150px] resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <div className="pt-2">
                <label className="text-sm font-medium block mb-2">Follow-up Date (Optional)</label>
                <input 
                  type="date" 
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Generated Email Draft</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setGeneratedEmail('')}>
                    Edit Prompt
                  </Button>
                </div>
              </div>
              <Textarea
                className="flex-1 min-h-[250px] font-mono text-sm resize-none"
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4">
          {!generatedEmail ? (
            <div className="flex w-full items-center justify-between gap-4">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={handleFinish}
                disabled={isGenerating}
              >
                {prompt.trim() ? 'Save Note (No AI)' : 'Skip Note & Update Status'}
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleGenerate} 
                disabled={isGenerating || (type === 'proposal' && !prompt.trim())}
              >
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  Copy
                </Button>
                <Button variant="outline" onClick={handleOpenEmail} className="gap-2">
                  <Mail className="h-4 w-4" />
                  Open Email
                </Button>
              </div>
              <Button onClick={handleFinish}>
                Approve & Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
