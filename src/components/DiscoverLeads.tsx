import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateLead } from '@/hooks/useLeads';
import { useLeadStore } from '@/store/useLeadStore';
import { toast } from '@/hooks/useToast';
import { Search, MapPin, Plus, Loader2, Globe, Ban, Phone, Star, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Industry } from '@/types';

interface DiscoveredBusiness {
  id: string;
  name: string;
  category: Industry;
  address: string;
  phone: string;
  rating: number;
  hasWebsite: boolean;
  websiteUrl: string;
  email: string;
}

// Simulated business discovery data (replace with Google Places API / real API)
const MOCK_BUSINESSES: Record<string, DiscoveredBusiness[]> = {
  Restaurant: [
    { id: 'biz-1', name: 'Golden Dragon Chinese', category: 'Restaurant', address: '123 Main St, Downtown', phone: '+1-555-1001', rating: 4.5, hasWebsite: false, websiteUrl: '', email: '' },
    { id: 'biz-2', name: 'Bella Italia Trattoria', category: 'Restaurant', address: '456 Oak Ave, Midtown', phone: '+1-555-1002', rating: 4.8, hasWebsite: true, websiteUrl: 'https://bellaitalia.com', email: 'info@bellaitalia.com' },
    { id: 'biz-3', name: 'Sushi Masters', category: 'Restaurant', address: '789 Harbor Blvd', phone: '+1-555-1003', rating: 4.2, hasWebsite: false, websiteUrl: '', email: '' },
    { id: 'biz-4', name: 'Taco Fiesta Express', category: 'Restaurant', address: '321 Elm St, Westside', phone: '+1-555-1004', rating: 3.9, hasWebsite: false, websiteUrl: '', email: 'tacofiesta@email.com' },
    { id: 'biz-5', name: 'The Grill House', category: 'Restaurant', address: '555 Broadway, Center City', phone: '+1-555-1005', rating: 4.6, hasWebsite: true, websiteUrl: 'https://thegrillhouse.com', email: 'contact@grillhouse.com' },
  ],
  'Food & Beverage': [
    { id: 'biz-6', name: 'Fresh Juice Bar', category: 'Food & Beverage', address: '100 Health Plaza', phone: '+1-555-2001', rating: 4.3, hasWebsite: false, websiteUrl: '', email: '' },
    { id: 'biz-7', name: 'Mountain Coffee Roasters', category: 'Food & Beverage', address: '200 Bean St', phone: '+1-555-2002', rating: 4.7, hasWebsite: true, websiteUrl: 'https://mountaincoffee.co', email: 'hello@mountaincoffee.co' },
    { id: 'biz-8', name: 'Sweet Treats Bakery', category: 'Food & Beverage', address: '300 Sugar Lane', phone: '+1-555-2003', rating: 4.4, hasWebsite: false, websiteUrl: '', email: '' },
  ],
  Retail: [
    { id: 'biz-9', name: 'Fashion Forward Boutique', category: 'Retail', address: '50 Style Ave', phone: '+1-555-3001', rating: 4.1, hasWebsite: true, websiteUrl: 'https://fashionforward.shop', email: 'sales@fashionforward.shop' },
    { id: 'biz-10', name: 'Tech Gadgets Plus', category: 'Retail', address: '75 Circuit Dr', phone: '+1-555-3002', rating: 3.8, hasWebsite: false, websiteUrl: '', email: '' },
    { id: 'biz-11', name: 'Home & Garden Center', category: 'Retail', address: '120 Green Rd', phone: '+1-555-3003', rating: 4.5, hasWebsite: true, websiteUrl: 'https://homegarden.com', email: 'info@homegarden.com' },
  ],
  Healthcare: [
    { id: 'biz-12', name: 'Sunrise Dental Clinic', category: 'Healthcare', address: '400 Medical Pkwy', phone: '+1-555-4001', rating: 4.6, hasWebsite: true, websiteUrl: 'https://sunrisedental.com', email: '' },
    { id: 'biz-13', name: 'City Physiotherapy', category: 'Healthcare', address: '410 Wellness Blvd', phone: '+1-555-4002', rating: 4.0, hasWebsite: false, websiteUrl: '', email: '' },
  ],
  'Real Estate': [
    { id: 'biz-14', name: 'Prime Properties LLC', category: 'Real Estate', address: '600 Tower St', phone: '+1-555-5001', rating: 4.3, hasWebsite: true, websiteUrl: 'https://primeproperties.com', email: 'deals@primeproperties.com' },
    { id: 'biz-15', name: 'Skyline Realty Group', category: 'Real Estate', address: '650 View Dr', phone: '+1-555-5002', rating: 4.1, hasWebsite: false, websiteUrl: '', email: '' },
  ],
  Education: [
    { id: 'biz-16', name: 'Bright Minds Academy', category: 'Education', address: '800 Scholar Ave', phone: '+1-555-6001', rating: 4.7, hasWebsite: true, websiteUrl: 'https://brightminds.edu', email: 'admin@brightminds.edu' },
    { id: 'biz-17', name: 'Code Masters Bootcamp', category: 'Education', address: '850 Tech Park', phone: '+1-555-6002', rating: 4.4, hasWebsite: false, websiteUrl: '', email: '' },
  ],
  Hospitality: [
    { id: 'biz-18', name: 'Grand Vista Hotel', category: 'Hospitality', address: '1 Lakefront Dr', phone: '+1-555-7001', rating: 4.5, hasWebsite: true, websiteUrl: 'https://grandvista.com', email: 'reservations@grandvista.com' },
    { id: 'biz-19', name: 'Cozy Corner B&B', category: 'Hospitality', address: '25 Cottage Ln', phone: '+1-555-7002', rating: 4.8, hasWebsite: false, websiteUrl: '', email: '' },
  ],
};

const CATEGORIES: Industry[] = [
  'Restaurant', 'Food & Beverage', 'Retail', 'Healthcare',
  'Real Estate', 'Education', 'Hospitality',
];

interface DiscoverLeadsProps {
  isOpen: boolean;
}

export function DiscoverPage() {
  const [category, setCategory] = useState<string>('Restaurant');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<DiscoveredBusiness[]>([]);
  const [searching, setSearching] = useState(false);
  const { apifyApiKey } = useLeadStore();
  const [platform, setPlatform] = useState<string>('Google Maps');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const createLead = useCreateLead();

  // Advanced Filters
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [minRating, setMinRating] = useState<string>('0');
  const [maxResults, setMaxResults] = useState<string>('10');

  // Location Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const PLATFORMS = ['Google Maps', 'Yelp', 'Yellow Pages'];

  const handleSearch = async () => {
    setSearching(true);
    
    // If no API Key, fall back to mock data
    if (!apifyApiKey) {
      toast({ title: 'API Key Required', description: 'Please add your Apify API key in Settings to search real data. Using demo data instead.', variant: 'default' });
      await new Promise((r) => setTimeout(r, 1200));
      let data = MOCK_BUSINESSES[category] || [];
      if (location.trim()) {
        const q = location.toLowerCase();
        data = data.filter((b) => b.address.toLowerCase().includes(q) || b.name.toLowerCase().includes(q));
        
        // Apply filters to mock data
        if (hasWebsiteFilter === 'yes') data = data.filter(b => b.hasWebsite);
        if (hasWebsiteFilter === 'no') data = data.filter(b => !b.hasWebsite);
        data = data.filter(b => b.rating >= parseFloat(minRating));
        data = data.slice(0, parseInt(maxResults));

        if (data.length === 0) {
          const fakeNames = ['The Grand', 'Downtown', 'Central', 'Prime', 'Elite', 'Local'];
          const fakeSuffixes = ['Hub', 'Spot', 'Center', 'Place', 'Express'];
          for (let i = 0; i < parseInt(maxResults); i++) {
            const rName = `${fakeNames[Math.floor(Math.random() * fakeNames.length)]} ${category} ${fakeSuffixes[Math.floor(Math.random() * fakeSuffixes.length)]}`;
            const hasWeb = hasWebsiteFilter === 'all' ? Math.random() > 0.5 : hasWebsiteFilter === 'yes';
            const rating = parseFloat(minRating) + (Math.random() * (5 - parseFloat(minRating)));
            
            data.push({
              id: `dyn-biz-${Date.now()}-${i}`,
              name: rName,
              category: category as Industry,
              address: `${Math.floor(Math.random() * 999) + 1} Main St, ${location}`,
              phone: `+1-555-01${Math.floor(Math.random() * 90) + 10}`,
              rating: Number(rating.toFixed(1)),
              hasWebsite: hasWeb,
              websiteUrl: hasWeb ? `https://${rName.replace(/\s+/g, '').toLowerCase()}.com` : '',
              email: `contact@${rName.replace(/\s+/g, '').toLowerCase()}.com`
            });
          }
        }
      }
      setResults(data);
      setSearching(false);
      return;
    }

    // REAL APIFY INTEGRATION
    try {
      toast({ title: 'Scraping Apify...', description: `Running ${platform} scraper for "${category} in ${location}". This may take 15-30 seconds.`, variant: 'default' });
      
      const searchQuery = `${category} in ${location}`;
      let endpoint = '';
      let payload = {};

      if (platform === 'Google Maps') {
        // Popular Google Maps scraper
        endpoint = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apifyApiKey}`;
        payload = {
          searchStringsArray: [searchQuery],
          maxCrawledPlacesPerSearch: parseInt(maxResults),
          language: "en",
          // Note: Apify scrapers often have specific filters for rating/website
          // but we can also filter the results locally to be more accurate
        };
      } else {
        throw new Error(`Real scraping for ${platform} is not mapped yet. Try Google Maps!`);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Apify API rejected the request. Please check your API Key.');
      }

      const datasetItems = await res.json();
      
      // Map Apify results to our DiscoveredBusiness format
      const mappedData: DiscoveredBusiness[] = datasetItems.map((item: any, i: number) => ({
        id: `apify-${item.placeId || Date.now()}-${i}`,
        name: item.title || item.name || 'Unknown Business',
        category: category as Industry,
        address: item.address || item.street || location,
        phone: item.phone || item.phoneUnformatted || '',
        rating: item.totalScore || item.rating || 0,
        // Only count as website if it's NOT a google maps/search link
        hasWebsite: !!item.website && !item.website.includes('google.com/maps') && !item.website.includes('google.com/search'),
        websiteUrl: item.website || '', 
        email: item.email || ''
      }));

      // Apply user filters to fetched data
      let filteredData = mappedData;
      if (hasWebsiteFilter === 'yes') filteredData = filteredData.filter(b => b.hasWebsite);
      if (hasWebsiteFilter === 'no') filteredData = filteredData.filter(b => !b.hasWebsite);
      filteredData = filteredData.filter(b => b.rating >= parseFloat(minRating));

      setResults(filteredData);
      
      if (mappedData.length > 0 && filteredData.length === 0) {
        toast({ 
          title: 'All results filtered', 
          description: `Found ${mappedData.length} leads, but none matched your "Website" or "Rating" filters. Try loosening them!`, 
          variant: 'default' 
        });
      } else {
        toast({ 
          title: 'Success', 
          description: `Found ${filteredData.length} leads matching your filters!`, 
          variant: 'success' 
        });
      }
    } catch (err: any) {
      toast({ title: 'Apify Error', description: err.message || 'Failed to fetch from Apify.', variant: 'destructive' });
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddAsLead = async (biz: DiscoveredBusiness) => {
    try {
      await createLead.mutateAsync({
        name: biz.name,
        company: biz.name,
        phone: biz.phone,
        email: biz.email,
        industry: biz.category,
        hasWebsite: biz.hasWebsite,
        websiteUrl: biz.websiteUrl,
        requirements: `Discovered via ${platform} Search. Address: ${biz.address}. Rating: ${biz.rating}/5.`,
        status: 'New',
      });
      setAddedIds((prev) => new Set(prev).add(biz.id));
      toast({ title: 'Lead added!', description: `${biz.name} saved as a new lead.`, variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add lead.', variant: 'destructive' });
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleLocationChange = (val: string) => {
    setLocation(val);
    fetchSuggestions(val);
  };

  const handleSelectSuggestion = (feature: any) => {
    const { name, city, state, country } = feature.properties;
    const parts = [name, city, state, country].filter(Boolean);
    const uniqueParts = Array.from(new Set(parts));
    setLocation(uniqueParts.join(', '));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Discover Leads</h1>
        <p className="text-muted-foreground">Search and scrape business directories to discover new leads.</p>
      </div>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-violet-500/5 to-indigo-500/5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Discover New Leads</h2>
          <span className="text-xs text-muted-foreground">Search businesses and add them as leads</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((plat) => (
                <SelectItem key={plat} value={plat}>{plat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Business type" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Location (e.g. Downtown, Midtown...)"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-9"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-start gap-2 border-b last:border-0 border-border/50"
                    >
                      <MapPin className="h-3 w-3 mt-1 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{s.properties.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {[s.properties.city, s.properties.state, s.properties.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button onClick={handleSearch} disabled={searching} className="gap-2 shrink-0">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-violet-500/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website:</span>
            <div className="flex bg-muted rounded-lg p-0.5">
              {(['all', 'yes', 'no'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setHasWebsiteFilter(opt)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    hasWebsiteFilter === opt 
                      ? 'bg-white shadow-sm text-primary font-semibold' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt === 'all' ? 'All' : opt === 'yes' ? 'Has Website' : 'No Website'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Min Rating:</span>
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger className="h-8 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any</SelectItem>
                <SelectItem value="3">3.0+</SelectItem>
                <SelectItem value="4">4.0+</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Limit:</span>
            <Select value={maxResults} onValueChange={setMaxResults}>
              <SelectTrigger className="h-8 w-[80px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-h-[400px] overflow-y-auto">
        {searching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Searching businesses...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y">
            <AnimatePresence>
              {results.map((biz, i) => {
                const alreadyAdded = addedIds.has(biz.id);
                return (
                  <motion.div
                    key={biz.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                  >
                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{biz.name}</h3>
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {biz.rating}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {biz.address}
                        </span>
                        {biz.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {biz.phone}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 ${biz.hasWebsite ? 'text-emerald-600' : ''}`}>
                          {biz.hasWebsite ? <Globe className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                          {biz.hasWebsite ? 'Website' : 'No website'}
                        </span>
                      </div>
                      {biz.hasWebsite && biz.websiteUrl && (
                        <a href={biz.websiteUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                          <ExternalLink className="h-3 w-3" />
                          {biz.websiteUrl}
                        </a>
                      )}
                    </div>

                    {/* Add Button */}
                    <Button
                      size="sm"
                      variant={alreadyAdded ? 'secondary' : 'default'}
                      disabled={alreadyAdded || createLead.isPending}
                      onClick={() => handleAddAsLead(biz)}
                      className="gap-1.5 shrink-0"
                    >
                      {alreadyAdded ? (
                        <>✓ Added</>
                      ) : (
                        <><Plus className="h-4 w-4" /> Add Lead</>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : results.length === 0 && !searching ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">Search for businesses to discover new leads</p>
            <p className="text-xs mt-1">Select a category and click Search</p>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
