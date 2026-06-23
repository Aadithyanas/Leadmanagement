import { useState, useMemo } from 'react';
import { useLeads, useAssignableMembers } from '@/hooks/useLeads';
import { generateAIAnalytics, type AIReport } from '@/lib/ai-service';
import { toast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Loader2, BrainCircuit, Sparkles, RefreshCw, BarChart3, PieChart as PieChartIcon, TrendingUp, AlertTriangle, Lightbulb, Target, ArrowUpRight, ArrowDownRight, Minus, Users, Award, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

// Modern curated color palette for charts
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function AIAnalyticsPage() {
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const members = useAssignableMembers() || [];
  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  const [analysis, setAnalysis] = useState<AIReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Prepare data for charts
  const { leadsPerUser, pipelineValue, statusDist, totalPipelineValue, calculatedMetrics, timeSeriesData } = useMemo(() => {
    if (!leads || !members) return { leadsPerUser: [], pipelineValue: [], statusDist: [], totalPipelineValue: 0, calculatedMetrics: [], timeSeriesData: [] };

    const userLeads: Record<string, { name: string; count: number; contacted: number }> = {};
    const userValue: Record<string, { name: string; value: number }> = {};
    const statusCounts: Record<string, number> = {};
    const timeSeries: Record<string, number> = {};
    let totalValue = 0;
    let wonCount = 0;

    members.forEach(m => {
      userLeads[m.id!] = { name: m.name || m.email, count: 0, contacted: 0 };
      userValue[m.id!] = { name: m.name || m.email, value: 0 };
    });
    userLeads['unassigned'] = { name: 'Unassigned', count: 0, contacted: 0 };
    userValue['unassigned'] = { name: 'Unassigned', value: 0 };

    leads.forEach(lead => {
      const assigned = lead.assignedTo || 'unassigned';
      if (userLeads[assigned]) {
        userLeads[assigned].count += 1;
        if (lead.status !== 'New') userLeads[assigned].contacted += 1;
        userValue[assigned].value += Number(lead.customFields?.estimatedValue || 0);
      } else {
        userLeads[assigned] = { name: 'Unknown User', count: 1, contacted: lead.status !== 'New' ? 1 : 0 };
        userValue[assigned] = { name: 'Unknown User', value: Number(lead.customFields?.estimatedValue || 0) };
      }

      totalValue += Number(lead.customFields?.estimatedValue || 0);
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
      if (lead.status === 'Won') wonCount++;

      if (lead.createdAt) {
        const dateStr = new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        timeSeries[dateStr] = (timeSeries[dateStr] || 0) + 1;
      }
    });

    const lpuArray = Object.values(userLeads).filter(u => u.count > 0).sort((a,b) => b.count - a.count);
    const mostActive = lpuArray.length > 0 ? lpuArray[0].name : 'N/A';
    const convRate = leads.length > 0 ? ((wonCount / leads.length) * 100).toFixed(1) : '0.0';

    const calcMetrics = [
      { label: 'Total Leads', value: leads.length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { label: 'Pipeline Value', value: `$${totalValue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { label: 'Conversion Rate', value: `${convRate}%`, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
      { label: 'Top Performer', value: mostActive, icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    const tsData = Object.entries(timeSeries).map(([date, count]) => ({ date, count }));

    return {
      leadsPerUser: lpuArray,
      pipelineValue: Object.values(userValue).filter(u => u.value > 0).sort((a,b) => b.value - a.value),
      statusDist: Object.entries(statusCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      totalPipelineValue: totalValue,
      calculatedMetrics: calcMetrics,
      timeSeriesData: tsData
    };
  }, [leads, members]);

  const handleGenerate = async () => {
    if (!openRouterApiKey) {
      toast({ title: 'API Key Missing', description: 'Please add VITE_OPENROUTER_API_KEY to your .env file.', variant: 'destructive' });
      return;
    }
    if (!leads || leads.length === 0) {
      toast({ title: 'No Data', description: 'There are no leads to analyze.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateAIAnalytics(openRouterApiKey, leads, members);
      setAnalysis(result);
      toast({ title: 'Analysis Complete', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  if (leadsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Loading your pipeline insights...</p>
        </div>
      </div>
    );
  }

  // Custom premium tooltip for charts
  const CustomTooltip = ({ active, payload, label, formatterLabel }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col gap-2 z-50">
          <p className="font-semibold text-foreground">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill || '#fff' }} />
              <p className="text-muted-foreground text-sm">
                {entry.name || formatterLabel}: <span className="font-bold text-foreground">
                  {entry.name === 'Pipeline Value' || formatterLabel === 'Pipeline Value' ? `$${entry.value.toLocaleString()}` : entry.value}
                </span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 max-w-7xl mx-auto pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Insights</span>
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            Pipeline Analytics
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
            Visual breakdown of team performance and deep AI strategic insights to help you close more deals.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col items-end justify-center">
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating} 
            size="lg" 
            className="gap-2 h-14 px-8 rounded-2xl text-base font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all shrink-0"
          >
            {isGenerating ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Processing Data...</>
            ) : analysis ? (
              <><RefreshCw className="h-5 w-5" /> Update AI Report</>
            ) : (
              <><BrainCircuit className="h-5 w-5" /> Generate AI Report</>
            )}
          </Button>
        </div>
      </div>

      {/* Top Level Key Metrics */}
      {leads && leads.length > 0 && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {calculatedMetrics.map((m, i) => (
            <motion.div key={i} variants={itemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{m.label}</p>
                  <p className="text-3xl font-black mt-1 text-foreground">{m.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${m.bg} ${m.color}`}>
                  <m.icon className="h-6 w-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Leads Over Time EKG Chart */}
      {timeSeriesData && timeSeriesData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 animate-pulse">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Leads Activity Monitor</h3>
              <p className="text-xs text-muted-foreground">Volume of leads added over time</p>
            </div>
          </div>
          <div className="h-[200px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip formatterLabel="Leads" />} cursor={{ stroke: 'var(--muted)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  animationDuration={2000}
                  style={{ filter: 'drop-shadow(0px 0px 8px rgba(16, 185, 129, 0.5))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center border border-primary/20 rounded-3xl bg-primary/5 shadow-inner mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
            </div>
            <h3 className="text-2xl font-bold mt-6">Crunching the Numbers</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Running multi-variant analysis on {leads?.length || 0} leads across {members?.length || 0} team members. This usually takes 10-15 seconds.
            </p>
          </motion.div>
        )}

        {analysis && !isGenerating && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mb-8 bg-card/60 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl"
          >
            {/* Overview Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 text-center shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <BrainCircuit className="w-32 h-32 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground relative z-10">{analysis.overview}</p>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bottlenecks */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-5 w-5 text-rose-500" /> Critical Bottlenecks
                </h3>
                <div className="space-y-4">
                  {analysis.bottlenecks.map((issue, i) => (
                    <div key={i} className="bg-card/40 border border-rose-500/20 rounded-xl p-5 shadow-sm flex items-start gap-4">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        issue.severity === 'high' ? 'bg-rose-500/20 text-rose-500' :
                        issue.severity === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-1">{issue.title}</h4>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                  <Lightbulb className="h-5 w-5 text-emerald-500" /> Strategic Recommendations
                </h3>
                <div className="space-y-4">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="bg-card/40 border border-emerald-500/20 rounded-xl p-5 shadow-sm flex items-start gap-4">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        rec.impact === 'high' ? 'bg-emerald-500/20 text-emerald-500' :
                        rec.impact === 'medium' ? 'bg-teal-500/20 text-teal-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-1">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Charts Dashboard */}
      {leads && leads.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* SVG Definitions for Gradients */}
          <svg style={{ height: 0, width: 0, position: 'absolute' }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
          </svg>

          {/* Leads Per User Chart */}
          <motion.div variants={itemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Lead Distribution</h3>
                <p className="text-xs text-muted-foreground">Active leads per team member</p>
              </div>
            </div>
            <div className="h-[320px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsPerUser} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)/40', radius: 4 }} />
                  <Bar dataKey="count" name="Total Leads" fill="url(#colorLeads)" radius={[6, 6, 0, 0]} barSize={20} animationDuration={1500} />
                  <Bar dataKey="contacted" name="Contacted Leads" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={20} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pipeline Value Chart */}
          <motion.div variants={itemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Pipeline Value</h3>
                <p className="text-xs text-muted-foreground">Estimated revenue per member</p>
              </div>
            </div>
            <div className="h-[320px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineValue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip formatterLabel="Pipeline Value" />} cursor={{ fill: 'var(--muted)/40', radius: 4 }} />
                  <Bar dataKey="value" fill="url(#colorValue)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Status Distribution Pie Chart */}
          <motion.div variants={itemVariants} className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group lg:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <PieChartIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Pipeline Health</h3>
                <p className="text-xs text-muted-foreground">Lead distribution by status</p>
              </div>
            </div>
            <div className="h-[350px] w-full flex items-center justify-center relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={130}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                  >
                    {statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-sm hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip formatterLabel="Leads" />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-foreground font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <div className="p-16 text-center border border-dashed rounded-3xl bg-card/20 backdrop-blur-sm">
          <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Data Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">Your pipeline is currently empty. Add some leads to visualize your team's performance and generate insights.</p>
        </div>
      )}


    </motion.div>
  );
}

