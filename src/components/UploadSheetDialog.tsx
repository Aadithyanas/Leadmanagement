import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLeadStore } from '@/store/useLeadStore';
import { useCreateLead } from '@/hooks/useLeads';
import { FileSpreadsheet, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import type { CreateLeadInput } from '@/types';

export function UploadSheetDialog() {
  const { isUploadSheetOpen, setUploadSheetOpen } = useLeadStore();
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
        // Simple CSV parser
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) throw new Error('File needs headers and at least one row');
        
        const firstLine = lines[0];
        if (!firstLine) throw new Error('File is empty');
        const headers = firstLine.split(',').map(h => h.trim().toLowerCase());
        let successCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const currentLine = lines[i];
          if (!currentLine) continue;
          const values = currentLine.split(',').map(v => v.trim());
          const lead: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            if (values[index] !== undefined) {
              lead[header] = values[index];
            }
          });

          // Look for 'name' in any reasonable column
          const name = lead['name'] || lead['full name'] || lead['contact name'];
          if (name) {
            await createLead.mutateAsync({
              name,
              company: lead['company'] || lead['business'] || '',
              phone: lead['phone'] || lead['number'] || '',
              email: lead['email'] || '',
              status: 'New',
              industry: lead['industry'] || lead['category'] || 'Other',
              hasWebsite: !!(lead['website'] || lead['url']),
              websiteUrl: lead['website'] || lead['url'] || '',
              requirements: lead['requirements'] || lead['notes'] || ''
            } as CreateLeadInput);
            successCount++;
          }
        }

        toast({ title: 'Sheet Uploaded', description: `Successfully imported ${successCount} leads.`, variant: 'success' });
        setFile(null);
        setUploadSheetOpen(false);
      } catch (err: any) {
        toast({ title: 'Invalid File', description: err.message || 'Failed to parse the CSV file.', variant: 'destructive' });
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Only text parsing for CSV
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
       toast({ title: 'Unsupported format', description: 'Currently only .csv files are supported for parsing.', variant: 'destructive' });
       setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isUploadSheetOpen} onOpenChange={setUploadSheetOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            Upload Sheet
          </DialogTitle>
          <DialogDescription>
            Import leads from a CSV or Excel spreadsheet. First row should contain column headers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center w-full mt-4">
          <label htmlFor="dropzone-sheet" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 border-muted-foreground/30 hover:bg-muted/40 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">CSV, XLS, or XLSX</p>
            </div>
            <input id="dropzone-sheet" type="file" accept=".csv, .xls, .xlsx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        {file && (
          <div className="text-sm mt-2 text-center text-primary font-medium">
            Selected: {file.name}
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setUploadSheetOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || isProcessing} className="gap-2">
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isProcessing ? 'Importing...' : 'Import Leads'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
