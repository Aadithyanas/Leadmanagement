import { 
  Zap, Compass, Users, Bell, ArrowRight, CheckCircle2, 
  Search, Shield, BarChart3, Globe 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThreeHero } from './LandingPage/ThreeHero';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-x-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 -left-4 w-96 h-96 bg-violet-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 -right-4 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Zap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Lead<span className="text-violet-600">Flow</span>
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button 
              onClick={onGetStarted}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8 h-11 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/25"
            >
              Launch App
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-24 px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="max-w-7xl mx-auto text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-100 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
            <span className="text-sm font-semibold text-violet-700 uppercase tracking-wider">The Intelligent CRM</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] text-slate-900">
            Find Leads.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
              Close Deals.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
            Automate your entire sales pipeline. Scrape businesses, manage discussions, and get real-time alerts—all in one place.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex items-center justify-center">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-violet-600 hover:bg-violet-700 text-white h-16 px-12 rounded-2xl text-xl font-bold group transition-all shadow-xl shadow-violet-500/30"
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            animate={{ 
              y: [0, -20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-200 to-indigo-200 rounded-[3rem] blur-3xl opacity-30"></div>
            <div className="relative bg-white/10 border border-slate-200 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] h-[550px] overflow-hidden">
              <ThreeHero />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* The Flow Section */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Your Sales Engine, Reimagined</h2>
            <p className="text-slate-500 text-lg">Four powerful steps to skyrocket your conversion rate.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                icon: Compass,
                title: "1. Explore",
                desc: "Discover businesses instantly with our deep Google Maps integration.",
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                icon: Search,
                title: "2. Qualify",
                desc: "Filter by ratings, websites, and niche to find perfect-fit prospects.",
                color: "text-violet-600",
                bg: "bg-violet-50"
              },
              {
                icon: Users,
                title: "3. Manage",
                desc: "Centralize your discussions and follow-ups in a beautiful CRM.",
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              },
              {
                icon: Bell,
                title: "4. Automate",
                desc: "Get smart Gmail alerts when leads need attention. Never slip up.",
                color: "text-amber-600",
                bg: "bg-amber-50"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="p-8 rounded-[2rem] bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`h-14 w-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 shadow-sm`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-5xl font-black mb-8 leading-tight text-slate-900">Built-in Scraping Intelligence</h2>
              <div className="space-y-6">
                {[
                  "Real-time location suggestions via Photon API",
                  "Deep website and social presence detection",
                  "Automated import with duplicate prevention",
                  "Encrypted Apify integration for maximum security"
                ].map((text, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-center gap-4"
                  >
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-lg text-slate-600 font-semibold">{text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 w-full relative"
            >
               <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="p-10 bg-white rounded-3xl border border-slate-200 shadow-2xl">
                    <pre className="text-sm text-violet-600 font-mono leading-relaxed">
                      {`{
  "business": "GrowthX Solutions",
  "rating": 4.9,
  "website": "https://growthx.com",
  "status": "QUALIFIED",
  "notifications": {
    "email": "active",
    "alert_type": "Expiring Lead"
  }
}`}
                    </pre>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 mb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto rounded-[4rem] bg-gradient-to-br from-violet-600 to-indigo-700 p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-violet-500/20"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" />
          <h2 className="text-5xl md:text-6xl font-bold mb-8 text-white">Ready to lead your market?</h2>
          <p className="text-xl text-violet-100 mb-12 max-w-2xl mx-auto font-medium">
            Join forward-thinking sales teams and automate your entire discovery engine today.
          </p>
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="bg-white text-violet-700 hover:bg-slate-50 h-16 px-16 rounded-2xl text-xl font-black shadow-xl"
          >
            Start Free Trial
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="py-16 px-6 border-t border-slate-200 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-violet-600" />
                <span className="text-xl font-bold text-slate-900">LeadFlow</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs text-center md:text-left font-medium">
                The world's most intuitive lead generation and CRM platform.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-10 text-slate-600 font-semibold text-sm">
              <span className="hover:text-violet-600 cursor-pointer transition-colors">Features</span>
              <span className="hover:text-violet-600 cursor-pointer transition-colors">Pricing</span>
              <span className="hover:text-violet-600 cursor-pointer transition-colors">Integrations</span>
              <span className="hover:text-violet-600 cursor-pointer transition-colors">Security</span>
            </div>

            <div className="flex gap-4">
              {[Globe, Shield, BarChart3].map((Icon, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5, scale: 1.1 }}
                  className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all cursor-pointer border border-slate-100"
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-100 text-center text-slate-400 text-sm font-medium">
            © 2026 LeadFlow CRM. Powered by Intelligent Discovery.
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
