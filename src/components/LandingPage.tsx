import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Play, Compass, Search, Users, Bell, ArrowRight, ChevronDown, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onGetStarted: () => void;
}

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-white/10 overflow-hidden">
      <button 
        className="w-full py-8 flex items-center justify-between text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xl md:text-3xl font-bold tracking-tight group-hover:text-primary transition-colors duration-500">{question}</span>
        <ChevronDown className={`w-8 h-8 transition-transform duration-500 text-white/40 group-hover:text-primary ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div 
        ref={contentRef}
        className="transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <p className="pb-8 text-lg text-white/60 leading-relaxed max-w-4xl">
          {answer}
        </p>
      </div>
    </div>
  );
};

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Initial Hero Text Stagger Reveal
    gsap.fromTo('.gsap-kinetic-word', 
      { y: 100, opacity: 0, rotateX: -80 },
      { y: 0, opacity: 1, rotateX: 0, duration: 1.5, stagger: 0.1, ease: 'power4.out', delay: 0.2 }
    );

    // Fade in subtext and buttons
    gsap.fromTo('.gsap-hero-sub',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.5, stagger: 0.2, ease: 'power3.out', delay: 1 }
    );

    // Scroll-scrubbing parallax on massive text
    gsap.to('.gsap-kinetic-container', {
      scrollTrigger: {
        trigger: '.gsap-kinetic-container',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      y: 200,
      scale: 0.9,
      opacity: 0,
      ease: 'none'
    });

    // Morphing background gradients
    gsap.to('.gsap-gradient-1', {
      x: '20vw',
      y: '10vh',
      scale: 1.2,
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    
    gsap.to('.gsap-gradient-2', {
      x: '-20vw',
      y: '-10vh',
      scale: 1.5,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Reveal standard sections
    gsap.utils.toArray('.gsap-section').forEach((section: any) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
        },
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out'
      });
    });

    // Stagger feature items
    gsap.utils.toArray('.gsap-features-container').forEach((container: any) => {
      const items = container.querySelectorAll('.gsap-feature-item');
      gsap.from(items, {
        scrollTrigger: {
          trigger: container,
          start: 'top 75%',
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
      });
    });
  }, { scope: container });

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-body selection:bg-primary/40 selection:text-white" ref={container}>
      
      {/* Dynamic Animated Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden mix-blend-screen">
        <div className="gsap-gradient-1 absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-primary/20 blur-[120px] rounded-full" />
        <div className="gsap-gradient-2 absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-emerald-600/20 blur-[150px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between py-6 px-6 md:px-12 lg:px-24 bg-black/50 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2 uppercase">
          <div className="w-2 h-2 bg-primary shadow-[0_0_10px_#22c55e]" />
          LeadFlow
        </div>
        <div className="hidden md:flex items-center gap-10 text-xs font-bold tracking-widest text-white/60 uppercase">
          <a href="#" className="hover:text-primary transition-colors">Platform</a>
          <a href="#" className="hover:text-primary transition-colors">Features</a>
          <a href="#" className="hover:text-primary transition-colors">Pricing</a>
          <a href="#" className="hover:text-primary transition-colors">FAQ</a>
        </div>
        <button 
          onClick={onGetStarted} 
          className="px-6 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-black transition-all border border-primary/20"
        >
          Sign In
        </button>
      </nav>

      {/* Kinetic Typography Hero Section */}
      <main className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-32 z-10 px-6 overflow-hidden">
        
        <div className="gsap-kinetic-container flex flex-col items-center justify-center text-center w-full max-w-[1400px]">
          
          <div className="gsap-hero-sub inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-5 py-2 text-xs uppercase tracking-[0.2em] text-white/70 font-bold mb-12">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-[0_0_8px_#22c55e]"></span>
            </span>
            Next-Gen AI Discovery Engine
          </div>

          <h1 className="flex flex-col items-center justify-center font-black tracking-tighter uppercase leading-[0.85] mb-12" style={{ perspective: '1000px' }}>
            <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-8 overflow-hidden">
              <span className="gsap-kinetic-word text-[5rem] md:text-[8rem] lg:text-[12rem] xl:text-[14rem] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-2xl">AUTOMATE</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-8 overflow-hidden">
              <span className="gsap-kinetic-word text-[5rem] md:text-[8rem] lg:text-[12rem] xl:text-[14rem] text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-700 drop-shadow-[0_0_40px_rgba(34,197,94,0.3)]">EVERYTHING</span>
            </div>
          </h1>

          <p className="gsap-hero-sub text-xl md:text-3xl font-medium text-white/50 max-w-4xl leading-tight mb-16">
            The quiet power behind hyper-growth sales teams. Clean data, precise targeting, and absolute scale.
          </p>

          <div className="gsap-hero-sub flex flex-col sm:flex-row items-center gap-6">
            <button 
              onClick={onGetStarted} 
              className="px-10 py-5 rounded-full bg-primary text-black font-black text-sm uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-105 duration-300"
            >
              Start Building Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-10 py-5 rounded-full bg-transparent text-white font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/20 flex items-center justify-center gap-3">
              <Play className="w-4 h-4 fill-white" />
              Watch Overview
            </button>
          </div>
        </div>
      </main>

      {/* Expanded Features Section (Typographic Focus) */}
      <section className="py-40 px-6 md:px-12 lg:px-24 bg-black relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="gsap-section mb-32 max-w-4xl">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">
              A complete <br/>
              <span className="text-primary">infrastructure</span>.
            </h2>
            <p className="text-2xl font-medium text-white/50 leading-snug">
              We've stripped away the complexity of lead generation and replaced it with a silent, ruthless, automated pipeline.
            </p>
          </div>

          <div className="gsap-features-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
            {[
              {
                icon: Compass,
                title: "Maps AI",
                desc: "Our system sweeps geographic regions, extracting business profiles and precise location data instantly."
              },
              {
                icon: Search,
                title: "Deep Scrape",
                desc: "Analyzes websites, social presence, and tech stacks to determine if a prospect fits your exact profile."
              },
              {
                icon: Users,
                title: "Intent Scoring",
                desc: "Filter thousands of leads instantly using our algorithm to focus only on clear buying signals."
              },
              {
                icon: CheckCircle2,
                title: "Sequences",
                desc: "Deploy highly personalized, automated outreach campaigns. Dynamic variables ensure absolute scale."
              },
              {
                icon: Bell,
                title: "Live Alerts",
                desc: "The moment a lead opens an email or replies, your team receives an immediate notification to strike."
              },
              {
                icon: ArrowRight,
                title: "Zero Setup",
                desc: "Qualified leads automatically flow into a minimalist CRM board. No complex setup—drag, drop, close."
              }
            ].map((feature, i) => (
              <div key={i} className="gsap-feature-item group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 group-hover:bg-primary group-hover:border-primary transition-colors duration-500">
                  <feature.icon className="w-8 h-8 text-white/50 group-hover:text-black transition-colors duration-500" />
                </div>
                <h3 className="text-3xl font-bold uppercase tracking-tight mb-4">{feature.title}</h3>
                <p className="text-lg text-white/40 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section (Massive Accordion) */}
      <section className="py-40 px-6 md:px-12 lg:px-24 relative z-10 border-t border-white/10 bg-gradient-to-b from-black to-black/90">
        <div className="max-w-5xl mx-auto">
          <div className="gsap-section mb-24">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
              Queries & <br/> <span className="text-white/30">Resolutions</span>
            </h2>
          </div>

          <div className="gsap-section border-t-2 border-white/20">
            {[
              {
                q: "HOW DOES THE SCRAPING TECHNOLOGY WORK?",
                a: "LeadFlow uses distributed, proxy-rotated crawlers combined with official APIs (like Google Maps and Photon) to extract public data. Our AI models then parse and clean the data to ensure 99% accuracy before it reaches your dashboard."
              },
              {
                q: "IS THIS COMPLIANT WITH DATA PRIVACY LAWS?",
                a: "Yes. We strictly extract publicly available B2B contact information and firmly adhere to GDPR and CCPA guidelines regarding data processing and storage."
              },
              {
                q: "CAN I INTEGRATE THIS WITH MY EXISTING CRM?",
                a: "Absolutely. While LeadFlow has a built-in pipeline management tool, we offer one-click integrations with Salesforce, HubSpot, and Pipedrive, as well as universal webhooks."
              },
              {
                q: "WHAT HAPPENS WHEN I HIT MY USAGE LIMITS?",
                a: "We don't hard-cap your growth. If you exceed your monthly lead generation limit, our system will seamlessly transition to a low-cost pay-as-you-go model for the remainder of the billing cycle."
              }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 md:px-12 lg:px-24 bg-primary text-black relative overflow-hidden z-10">
        {/* Kinetic background text for CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] text-[20rem] font-black uppercase tracking-tighter text-black/10 whitespace-nowrap pointer-events-none">
          EXECUTE EXECUTE
        </div>
        
        <div className="gsap-section max-w-5xl mx-auto text-center relative z-20 flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-10">
            Stop Searching. <br/> Start Closing.
          </h2>
          <p className="text-2xl opacity-80 mb-16 max-w-3xl font-bold">
            Join the elite sales teams who have automated their entire discovery pipeline. Set up your first workflow in under 5 minutes.
          </p>
          <button 
            onClick={onGetStarted}
            className="px-12 py-6 rounded-full bg-black text-white hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 text-xl font-black uppercase tracking-widest flex items-center gap-4 shadow-2xl"
          >
            Create Your Account
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-12 lg:px-24 border-t border-white/10 bg-black flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-white/40 font-bold uppercase tracking-widest z-10 relative">
        <div className="flex items-center gap-3 text-white">
          <div className="w-2 h-2 bg-primary shadow-[0_0_8px_#22c55e]" />
          LeadFlow
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">Twitter</a>
          <a href="#" className="hover:text-primary transition-colors">GitHub</a>
        </div>
        <div>
          © 2026 LeadFlow Inc.
        </div>
      </footer>
    </div>
  );
}
