import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLeadStore } from '@/store/useLeadStore';
import { useCreateLead } from '@/hooks/useLeads';
import { FileJson, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import type { CreateLeadInput } from '@/types';

export function UploadJsonDialog() {
  const { isUploadJsonOpen, setUploadJsonOpen } = useLeadStore();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const createLead = useCreateLead();

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const leads = Array.isArray(data) ? data : [data];
        
        let successCount = 0;
        let failCount = 0;
        
        for (const lead of leads) {
          try {
            // Super-robust field mapping
            const name = lead.name || lead.title || lead.placeName || lead.bizName || lead.businessName || lead.phone || lead.email || 'Unnamed Lead';
            const company = lead.company || lead.bizName || lead.businessName || name;
            const phone = lead.phone || lead.phoneNumber || lead.tel || '';
            const email = lead.email || lead.emailAddress || '';
            const website = lead.websiteUrl || lead.url || lead.website || lead.site || '';
            
            // Industry fallback
            const industry = lead.industry || lead.categoryName || lead.category || lead.bizType || 'Other';

            if (name) {
              // Build a requirements string from any available address fields
              let requirements = lead.requirements || '';
              if (!requirements) {
                const addrParts = [
                  lead.street, lead.address, lead.city, lead.state, lead.country, lead.countryCode, lead.zipCode, lead.postalCode
                ].filter(Boolean);
                if (addrParts.length > 0) {
                  requirements = `Location: ${addrParts.join(', ')}`;
                }
                if (lead.totalScore || lead.rating) {
                  requirements += `\nRating: ${lead.totalScore || lead.rating} (${lead.reviewsCount || lead.reviews || 0} reviews)`;
                }
              }

              await createLead.mutateAsync({
                name,
                company,
                phone,
                email,
                status: lead.status || 'New',
                industry,
                hasWebsite: lead.hasWebsite || !!website,
                websiteUrl: website,
                requirements
              } as CreateLeadInput);
              successCount++;
            }
          } catch (err) {
            console.error('Failed to import lead:', lead, err);
            failCount++;
          }
        }
        
        if (successCount > 0) {
          toast({ 
            title: 'Import Complete', 
            description: `Successfully imported ${successCount} leads.${failCount > 0 ? ` (${failCount} failed)` : ''}`, 
            variant: 'success' 
          });
        } else if (failCount > 0) {
          toast({ title: 'Import Failed', description: 'Failed to import leads. Check console for details.', variant: 'destructive' });
        }
        
        setFile(null);
        setUploadJsonOpen(false);
      } catch (err) {
        toast({ title: 'Invalid JSON', description: 'Failed to parse the JSON file format.', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isUploadJsonOpen} onOpenChange={setUploadJsonOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-violet-500" />
            Upload JSON
          </DialogTitle>
          <DialogDescription>
            Import multiple leads by uploading a JSON file. The file should contain an array of lead objects.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center w-full mt-4">
          <label htmlFor="dropzone-json" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 border-muted-foreground/30 hover:bg-muted/40 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">JSON files only</p>
            </div>
            <input id="dropzone-json" type="file" accept=".json" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        {file && (
          <div className="text-sm mt-2 text-center text-primary font-medium">
            Selected: {file.name}
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setUploadJsonOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || isProcessing} className="gap-2">
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isProcessing ? 'Importing...' : 'Import Leads'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
