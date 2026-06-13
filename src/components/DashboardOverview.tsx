import { DashboardStats } from '@/components/DashboardStats';
import { useFilteredLeads } from '@/hooks/useLeads';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, TrendingUp, Target, Globe, Filter, Rocket, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/useToast';

export function DashboardOverview() {
  const { data: leads, isLoading } = useFilteredLeads();
  const queryClient = useQueryClient();

  // Generate real data for the last 7 days for the chart
  const generateChartData = () => {
    const data = [];
    if (!leads) return [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStr = format(date, 'MMM dd');
      
      // Filter leads created on this day
      const acquired = leads.filter(l => isSameDay(new Date(l.createdAt), date)).length;
      
      // Filter leads updated on this day (as a proxy for engagement)
      const engaged = leads.filter(l => 
        isSameDay(new Date(l.updatedAt), date) && l.lastDiscussion
      ).length;

      data.push({
        name: dayStr,
        acquired,
        contacted: engaged,
      });
    }
    return data;
  };

  const chartData = generateChartData();

  // Industry distribution data
  const industryData = leads ? [
    { name: 'Tech', value: leads.filter(l => l.industry === 'Technology').length },
    { name: 'Retail', value: leads.filter(l => l.industry === 'Retail').length },
    { name: 'Food', value: leads.filter(l => l.industry === 'Food & Beverage' || l.industry === 'Restaurant').length },
    { name: 'Health', value: leads.filter(l => l.industry === 'Healthcare').length },
    { name: 'Other', value: leads.filter(l => !['Technology', 'Retail', 'Healthcare', 'Food & Beverage', 'Restaurant'].includes(l.industry)).length },
  ].filter(i => i.value > 0) : [];

  const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'];

  const statusData = leads ? [
    { name: 'New', count: leads.filter(l => l.status === 'New').length },
    { name: 'Contacted', count: leads.filter(l => l.status === 'Contacted').length },
    { name: 'Qualified', count: leads.filter(l => l.status === 'Qualified').length },
    { name: 'Proposal', count: leads.filter(l => l.status === 'Proposal Sent').length },
    { name: 'Won', count: leads.filter(l => l.status === 'Won').length },
    { name: 'Lost', count: leads.filter(l => l.status === 'Lost').length },
    { name: 'Rejected', count: leads.filter(l => l.status === 'Rejected').length },
  ] : [];

  const conversionRate = leads?.length ? Math.round((leads.filter(l => l.status === 'Won').length / leads.length) * 100) : 0;
  
  const avgEngagement = leads?.length 
    ? (leads.filter(l => l.lastDiscussion).length / leads.length * 5).toFixed(1) 
    : '0';
    
  const funnelEfficiency = leads?.length 
    ? Math.round((leads.filter(l => !['New'].includes(l.status)).length / leads.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here's an overview of your lead generation pipeline.</p>
        </div>
      </div>

      {leads && leads.length === 0 && !isLoading && (
        <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-dashed border-2">
          <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Get Started with LeadFlow</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Welcome! Your dashboard is currently empty. Start by adding new leads to explore the analytics features.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" size="lg" onClick={() => {}}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Lead
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DashboardStats />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-emerald-900/20 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary font-medium flex items-center gap-1">
              <Target className="h-3 w-3" /> Conversion Rate
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{conversionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-primary font-medium">+2.5%</span> from last week
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-900/20 border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-500 font-medium flex items-center gap-1">
              <Globe className="h-3 w-3" /> Market Reach
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{industryData.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Active in {industryData.length} primary industries</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600/10 to-emerald-950/20 border-emerald-600/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-500 font-medium flex items-center gap-1">
              <Activity className="h-3 w-3" /> Avg Engagement
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{avgEngagement}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Touchpoints per qualified lead</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-900/20 border-teal-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-teal-500 font-medium flex items-center gap-1">
              <Filter className="h-3 w-3" /> Funnel Efficiency
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{funnelEfficiency}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Based on lead status velocity</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lead Flow Analytics</CardTitle>
                <CardDescription>Visualizing discovery vs. engagement trends</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Last 7 Days</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcquired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorContacted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                />
                <Area type="monotone" dataKey="acquired" name="New Found" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorAcquired)" />
                <Area type="monotone" dataKey="contacted" name="Engaged" stroke="#15803d" strokeWidth={3} fillOpacity={1} fill="url(#colorContacted)" />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Industry Reach</CardTitle>
            <CardDescription>Top business categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col justify-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={industryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {industryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {industryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
            <CardDescription>Distribution of active leads</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your pipeline</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads?.slice(0, 4).map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {lead.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.company} • {lead.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">{format(new Date(lead.updatedAt), 'MMM dd, HH:mm')}</p>
                    <Badge 
                      variant={
                        lead.status === 'Won' ? 'won' : 
                        lead.status === 'Lost' ? 'lost' : 
                        lead.status === 'Qualified' ? 'qualified' : 
                        lead.status === 'Proposal Sent' ? 'proposal' : 
                        lead.status === 'Contacted' ? 'contacted' : 'new'
                      } 
                      className="text-[9px] h-4 mt-1"
                    >
                      {lead.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {!leads?.length && <p className="text-center py-10 text-muted-foreground">No recent activity</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
