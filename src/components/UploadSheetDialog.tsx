import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLeadStore } from '@/store/useLeadStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCreateLeadsBulk } from '@/hooks/useLeads';
import { FileSpreadsheet, UploadCloud, Loader2, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/useToast';
import type { CreateLeadInput } from '@/types';
import Papa from 'papaparse';

type Step = 'upload' | 'mapping';

const LEAD_FIELDS = [
  { key: 'name', label: 'Name (Required)', required: true },
  { key: 'company', label: 'Company', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'industry', label: 'Industry', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'websiteUrl', label: 'Website URL', required: false },
  { key: 'requirements', label: 'Requirements / Notes', required: false },
];

export function UploadSheetDialog() {
  const { isUploadSheetOpen, setUploadSheetOpen } = useLeadStore();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importUnmapped, setImportUnmapped] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const createLeadsBulk = useCreateLeadsBulk();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    setUploadSheetOpen(open);
  };

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    setImportUnmapped(true);
    setIsProcessing(false);
  };

  const guessMapping = (headers: string[]) => {
    const newMapping: Record<string, string> = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    LEAD_FIELDS.forEach(field => {
      const fieldKey = field.key.toLowerCase();
      
      const matchIndex = normalizedHeaders.findIndex(h => {
        if (h === fieldKey) return true;
        
        switch(fieldKey) {
          case 'name': return h.includes('name') && !h.includes('college') && !h.includes('company');
          case 'company': return h.includes('company') || h.includes('business') || h.includes('college') || h.includes('organization');
          case 'email': return h.includes('email') || h.includes('e-mail');
          case 'phone': return h.includes('phone') || h.includes('number') || h.includes('contact');
          case 'industry': return h.includes('industry') || h.includes('interest') || h.includes('category');
          case 'status': return h.includes('status') || h.includes('state');
          case 'websiteurl': return h.includes('website') || h.includes('url') || h.includes('link');
          case 'requirements': return h.includes('note') || h.includes('requirement') || h.includes('description') || h.includes('comment');
          default: return false;
        }
      });
      
      if (matchIndex !== -1) {
        newMapping[field.key] = headers[matchIndex];
      }
    });
    setMapping(newMapping);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast({ title: 'Unsupported format', description: 'Please select a .csv file.', variant: 'destructive' });
      return;
    }
    setFile(selectedFile);
    setIsProcessing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields && results.data.length > 0) {
          setCsvHeaders(results.meta.fields);
          setCsvData(results.data);
          guessMapping(results.meta.fields);
          setStep('mapping');
        } else {
          toast({ title: 'Invalid File', description: 'Could not find any data or headers in this CSV.', variant: 'destructive' });
        }
        setIsProcessing(false);
      },
      error: (error) => {
        toast({ title: 'Parsing Error', description: error.message, variant: 'destructive' });
        setIsProcessing(false);
      }
    });
  };

  const handleImport = async () => {
    if (!mapping.name) {
      toast({ title: 'Missing Field', description: 'You must map the Name field to import leads.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    
    try {
      const newLeads: CreateLeadInput[] = csvData.map(row => {
        const val = (key: string) => (mapping[key] ? row[mapping[key]] || '' : '');
        
        const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
        const VALID_INDUSTRIES = ['Restaurant', 'Food & Beverage', 'Retail', 'Healthcare', 'Technology', 'Education', 'Real Estate', 'Finance', 'Manufacturing', 'E-Commerce', 'Hospitality', 'Other'];

        const rawStatus = val('status');
        const finalStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : 'New';

        const rawIndustry = val('industry');
        const finalIndustry = VALID_INDUSTRIES.includes(rawIndustry) ? rawIndustry : 'Other';

        // Auto-assign to self if member, otherwise leave unassigned
        const { user, activeOrg } = useAuthStore.getState();
        const autoAssignTo = activeOrg?.role === 'member' ? user?.id : null;

        const mappedCsvHeaders = Object.values(mapping).filter(Boolean);
        const customFields: Record<string, string> = {};
        
        if (importUnmapped) {
          csvHeaders.forEach(header => {
            if (!mappedCsvHeaders.includes(header) && row[header]) {
              customFields[header] = String(row[header]).trim();
            }
          });
        }

        return {
          name: val('name'),
          company: val('company'),
          email: val('email'),
          phone: val('phone'),
          industry: finalIndustry as any,
          status: finalStatus as any,
          websiteUrl: val('websiteUrl'),
          hasWebsite: !!val('websiteUrl'),
          requirements: val('requirements'),
          assignedTo: autoAssignTo,
          customFields,
        };
      }).filter(lead => lead.name.trim() !== ''); // Filter out completely empty names

      if (newLeads.length === 0) {
        throw new Error("No valid leads found after mapping. Ensure the 'Name' column is not completely empty.");
      }

      await createLeadsBulk.mutateAsync(newLeads);
      
      toast({ title: 'Import Successful', description: `Successfully imported ${newLeads.length} leads.`, variant: 'success' });
      handleOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Import Failed', description: err.message || 'An error occurred during import.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isUploadSheetOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            {step === 'upload' ? 'Upload CSV' : 'Map Columns'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' 
              ? 'Import leads from a CSV file. You can map your custom columns in the next step.'
              : `Map the columns from "${file?.name}" to the corresponding Lead fields.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="flex flex-col gap-4 mt-4">
            <label htmlFor="dropzone-sheet" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 border-muted-foreground/30 hover:bg-muted/40 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">CSV files only</p>
              </div>
              <input 
                id="dropzone-sheet" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }} 
              />
            </label>
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Parsing file...
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="bg-muted/30 p-4 rounded-md border text-sm">
              <p className="font-medium text-foreground mb-1">Found {csvData.length} rows</p>
              <p className="text-muted-foreground">Please match your CSV columns to the system fields below.</p>
            </div>
            
            <div className="space-y-3">
              {LEAD_FIELDS.map(field => (
                <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                  <div className="text-sm font-medium">
                    {field.label}
                  </div>
                  <div>
                    <Select 
                      value={mapping[field.key] || "none"} 
                      onValueChange={(val) => setMapping(prev => ({ ...prev, [field.key]: val === "none" ? "" : val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Ignore --</SelectItem>
                        {csvHeaders.map(header => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t mt-4">
              <Checkbox 
                id="import-unmapped" 
                checked={importUnmapped} 
                onCheckedChange={(c) => setImportUnmapped(!!c)} 
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="import-unmapped"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Import unmapped columns as Custom Fields
                </label>
                <p className="text-xs text-muted-foreground">
                  Any column from your CSV that isn't mapped above will automatically be saved as additional information for the lead.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-8">
              <Button variant="outline" onClick={() => setStep('upload')} disabled={isProcessing}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isProcessing || !mapping.name} className="gap-2">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {isProcessing ? 'Importing...' : 'Import Leads'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
