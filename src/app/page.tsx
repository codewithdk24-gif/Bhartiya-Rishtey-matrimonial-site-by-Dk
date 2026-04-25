'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/constants/plans';
import Image from 'next/image';
import { 
  Shield, 
  Brain, 
  UserCheck, 
  Globe, 
  MessageSquare, 
  Crown,
  Check,
  X,
  ArrowRight
} from 'lucide-react';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-glass h-16 md:h-20 border-b border-stone-100/50' : 'h-18 md:h-24 bg-transparent border-none'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-1">
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col">
              <h1 className="font-headline text-[12px] min-[360px]:text-[15px] xs:text-lg md:text-2xl font-extrabold !text-[#9b1c31] leading-tight whitespace-nowrap">Bhartiya Rishtey</h1>
              <p className="text-[6px] min-[360px]:text-[7px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-primary font-bold block">Trusted Since 2016</p>
            </div>
          </Link>

          <div className="flex items-center gap-0.5 md:gap-8">
            <div className="hidden md:flex items-center gap-8 mr-4">
              <Link href="/search" className="text-sm font-medium text-stone-600 hover:text-primary transition-colors">Browse Matches</Link>
              <Link href="/premium" className="text-sm font-medium text-stone-600 hover:text-primary transition-colors">Premium Plans</Link>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
              <Link href="/login" className="btn-secondary !text-[8px] min-[360px]:!text-[9px] md:!text-xs !px-2 md:!px-4 !py-1 md:!py-2.5 whitespace-nowrap">Login</Link>
              <Link href="/signup" className="btn-primary !text-[8px] min-[360px]:!text-[9px] md:!text-xs !px-2 md:!px-4 !py-1 md:!py-2.5 whitespace-nowrap">Join</Link>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md animate-fade-in" onClick={() => setMobileOpen(false)} />

            <div className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
              {/* Decorative background elements in menu */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />

              <div className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex flex-col">
                    <h2 className="font-headline text-xl font-bold !text-[#9b1c31]">Bhartiya Rishtey</h2>
                    <p className="text-[9px] tracking-widest uppercase text-primary font-bold">Premium Matrimony</p>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors" onClick={() => setMobileOpen(false)}>
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                <nav className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4 ml-2">Navigation</p>
                  {[
                    { label: 'Browse Matches', icon: 'search', href: '/search', color: 'primary' },
                    { label: 'Premium Plans', icon: 'workspace_premium', href: '/premium', color: 'gold' },
                    { label: 'Success Stories', icon: 'auto_awesome', href: '/stories', color: 'secondary' },
                    { label: 'About Us', icon: 'info', href: '/about', color: 'stone-500' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-stone-50 transition-all group"
                      onClick={() => setMobileOpen(false)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                        <span className={`material-symbols-outlined text-lg text-stone-400 group-hover:text-primary`}>{item.icon}</span>
                      </div>
                      <span className="font-semibold text-stone-700 group-hover:text-stone-900">{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-8 relative z-10 border-t border-stone-50 bg-stone-50/50">
                <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-2xl shadow-sm border border-stone-100">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg">support_agent</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">Need help?</p>
                    <p className="text-[10px] text-stone-500">Talk to our experts</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" className="btn-secondary py-3 text-center text-xs font-bold rounded-xl" onClick={() => setMobileOpen(false)}>Log In</Link>
                  <Link href="/signup" className="btn-primary py-3 text-center text-xs font-bold rounded-xl" onClick={() => setMobileOpen(false)}>Join Now</Link>
                </div>
                <p className="text-[9px] text-center text-stone-400 mt-6 font-medium">© 2016 Bhartiya Rishtey</p>
              </div>
            </div>
          </div>
        )}
      </nav>


      <button
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-2xl z-[70] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <span className="material-symbols-outlined text-3xl font-light">
          {mobileOpen ? 'close' : 'segment'}
        </span>
      </button>
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 bg-[#f8f6f4]">
      {/* Seamless transition to next section */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-[#f8f6f4]/60 to-[#f8f6f4] pointer-events-none z-20" />
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl float-animation-delay" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 lg:gap-16 items-center relative z-10">
        {/* Image Section - Full bleed and seamless transition on mobile */}
        <div className="relative animate-fade-in-up-delay-1 order-1 lg:order-2 z-10 -mx-6 lg:mx-0">
          <div className="relative">
            <div className="w-full aspect-[3/4] lg:aspect-auto lg:h-[550px] lg:rounded-3xl relative lg:overflow-hidden lg:shadow-3xl lg:ring-1 lg:ring-black/5">
              <Image
                src="/images/hero_indian_wedding_v7.jpg"
                alt="Happy Indian Couple"
                fill
                priority
                className="object-cover object-[center_left] lg:hover:scale-105 transition-transform duration-1000 lg:rounded-3xl"
              />
              {/* Warm gradient overlay for cultural feel */}
              <div className="absolute inset-0 bg-[rgba(255,180,120,0.08)] pointer-events-none z-[5]" />
               {/* Elliptical Softener - Unified with background */}
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[160%] h-64 bg-[#f8f6f4] blur-[80px] rounded-[100%] lg:hidden z-30" />
              
              {/* Seamless gradient layers - Unified colors */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f8f6f4] via-[#f8f6f4]/60 to-transparent lg:hidden z-20" />
              <div className="absolute inset-0 backdrop-blur-[20px] [mask-image:linear-gradient(to_bottom,transparent_0%,transparent_45%,black_85%,black_100%)] lg:hidden pointer-events-none z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#f8f6f4]/20 via-transparent to-transparent pointer-events-none z-10" />
            </div>

            {/* Floating badges - only visible on desktop to keep mobile clear */}
            <div className="absolute bottom-12 left-12 bg-white rounded-2xl border border-stone-100 p-3.5 items-center gap-3.5 shadow-2xl z-20 transition-transform hover:scale-110 hidden lg:flex float-animation ring-4 ring-white/50">
              <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200 animate-pulse">
                <span className="material-symbols-outlined text-white text-xl">verified</span>
              </div>
              <div>
                <p className="font-bold text-xs text-stone-900">Trusted Rishtey ✅</p>
                <p className="text-[10px] text-stone-400 font-medium">Verified Profiles</p>
              </div>
            </div>

            <div className="absolute top-6 right-6 bg-white rounded-2xl border border-stone-100 p-3.5 items-center gap-3.5 shadow-2xl z-20 transition-transform hover:scale-110 hidden lg:flex float-animation-delay ring-4 ring-white/50">
              <div className="w-11 h-11 rounded-full bg-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-pink-200 pulse-ring">
                <span className="material-symbols-outlined text-white text-xl">favorite</span>
              </div>
              <div>
                <p className="font-bold text-xs text-stone-900">Tradition First ❤️</p>
                <p className="text-[10px] text-stone-400 font-medium">Rooted in values</p>
              </div>
            </div>
          </div>
        </div>

        {/* Text Section - Positioned high up over the blurred image area */}
        {/* Text Section - Adjusted margin for better readability on mobile */}
        <div className="relative z-30 animate-fade-in-up order-2 lg:order-1 -mt-40 xs:-mt-48 lg:mt-0 px-6 lg:px-0">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-2xl border border-white/40 mb-8 shadow-2xl">
            <span className="text-[10px] font-bold text-[#9b1c31] tracking-[0.15em] uppercase">Trusted by 10,000+ families</span>
          </div>

          <h1 className="font-headline text-3xl xs:text-4xl md:text-6xl font-extrabold leading-[1.4] text-stone-900 mb-6">
            Dil Ke <span className="text-primary">Rishtey,</span><br />
            <span className="!text-[#BE123C] italic">Zindagi Bhar</span>
          </h1>

          <div className="lg:bg-transparent lg:backdrop-blur-none px-0 py-8 lg:mx-0 lg:px-0 lg:py-0 mt-2">
            <p className="text-lg md:text-xl text-stone-500 leading-relaxed max-w-lg mb-10 font-medium">
              A premium matrimonial platform <span className="text-primary/80">rooted in Indian values</span>, designed to help you find a life partner who understands your <span className="text-primary/80">culture & vision</span>.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4 mb-12">
              <Link href="/signup" className="btn-primary text-xs sm:text-sm px-6 py-3.5 sm:px-8 sm:py-4">
                <span className="material-symbols-outlined text-lg">favorite</span>
                Begin Your Journey
              </Link>
              <Link href="/search" className="btn-secondary text-xs sm:text-sm px-6 py-3.5 sm:px-8 sm:py-4">
                Browse Matches
              </Link>
            </div>

            <div className="relative z-40 mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-y-6 gap-x-8 md:gap-12">
              <div className="flex items-center gap-3 min-w-[140px] justify-center lg:justify-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-headline text-2xl md:text-3xl font-black text-stone-900 leading-none mb-1">50K+</p>
                  <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Active Profiles</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 min-w-[140px] justify-center lg:justify-start">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-headline text-2xl md:text-3xl font-black text-stone-900 leading-none mb-1">1,200+</p>
                  <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Success Stories</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 min-w-[140px] justify-center lg:justify-start">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-700 shrink-0 shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-headline text-2xl md:text-3xl font-black text-stone-900 leading-none mb-1">98%</p>
                  <p className="text-[10px] md:text-xs text-stone-500 font-bold uppercase tracking-wider">Verified Profiles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {

  const [activeFeature, setActiveFeature] = useState<null | typeof features[0]>(null);

  const features = [
    { 
      icon: Shield, 
      title: 'Privacy First', 
      desc: 'Secure encrypted conversations for your safety.', 
      fullDesc: 'Your privacy is our top priority. We use military-grade encryption to ensure your private conversations stay private.',
      points: ['End-to-end encrypted chats', 'Data protection protocols', 'Safe & secure communication'],
      gradient: 'from-gray-800 to-black',
      shadow: 'shadow-gray-900/30',
      glow: 'bg-gray-400/20',
      number: '01' 
    },
    { 
      icon: Brain, 
      title: 'Smart Match', 
      desc: 'AI algorithm matching your core values.', 
      fullDesc: 'Our advanced AI analyzes thousands of data points to find partners who truly align with your lifestyle and vision.',
      points: ['AI Compatibility analysis', 'Core value matching', 'Personality-based insights'],
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/30',
      glow: 'bg-indigo-500/20',
      number: '02' 
    },
    { 
      icon: UserCheck, 
      title: 'Verified Only', 
      desc: 'Profiles manually checked for authenticity.', 
      fullDesc: 'We maintain a high-quality community by manually verifying every profile through a strict multi-step process.',
      points: ['Manual profile screening', 'ID verification options', '100% Genuine members'],
      gradient: 'from-green-500 to-emerald-600',
      shadow: 'shadow-green-500/30',
      glow: 'bg-green-500/20',
      number: '03' 
    },
    { 
      icon: Globe, 
      title: 'Cultural Roots', 
      desc: 'Find partners who share your heritage.', 
      fullDesc: 'Connect with people who understand your culture, language, and traditions for a more meaningful partnership.',
      points: ['Heritage-based matching', 'Language preferences', 'Community-focused search'],
      gradient: 'from-orange-400 to-orange-600',
      shadow: 'shadow-orange-500/30',
      glow: 'bg-orange-500/20',
      number: '04' 
    },
    { 
      icon: MessageSquare, 
      title: 'Instant Chat', 
      desc: 'Connect instantly with real-time messaging.', 
      fullDesc: 'Break the ice immediately with our fast and secure real-time messaging system built for serious seekers.',
      points: ['Real-time instant delivery', 'Secure media sharing', 'Smart push notifications'],
      gradient: 'from-pink-500 to-red-500',
      shadow: 'shadow-pink-500/30',
      glow: 'bg-pink-500/20',
      number: '05' 
    },
    { 
      icon: Crown, 
      title: 'Royal Perks', 
      desc: 'Priority matches and premium concierge.', 
      fullDesc: 'Experience luxury matchmaking with priority visibility and dedicated support to find your match faster.',
      points: ['Priority profile boosting', 'Exclusive premium badge', '24/7 Concierge support'],
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/30',
      glow: 'bg-blue-500/20',
      number: '06' 
    },
  ];

  return (
    <section className="min-h-screen pt-20 pb-12 md:py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-[#f8f6f4] via-[#ebe7e3] to-[#ebe7e3] flex flex-col justify-start animate-fade-in-up">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px] -ml-32 -mb-32 opacity-60" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-6 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm border border-stone-100 mb-3 md:mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase text-stone-400">Everything You Need</span>
          </div>
          <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-semibold text-stone-900 mb-1.5 md:mb-4 tracking-tight">
            Built for <span className="text-gradient">Serious Relationships</span>
          </h2>
          <p className="text-stone-500 max-w-lg md:max-w-xl mx-auto font-medium text-[11px] md:text-base leading-relaxed opacity-80">
            A premium platform designed to help you find a life partner who understands your <span className="text-primary/70">culture & vision</span>.
          </p>
        </div>

        <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8 lg:gap-10 select-none touch-none [-webkit-tap-highlight-color:transparent] transition-all duration-500 ${activeFeature ? 'blur-sm opacity-40 scale-[0.98]' : ''} max-w-6xl mx-auto`}>
          {features.map((f, i) => (
            <div 
              key={i} 
              onClick={() => setActiveFeature(f)}
              style={{ animationDelay: `${i * 0.2}s` }}
              className="group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-white/70 backdrop-blur-md border border-white/40 md:border-[#ece7e2] transition-all duration-300 shadow-lg hover:shadow-xl md:hover:-translate-y-2 flex flex-col items-center text-center overflow-hidden aspect-[1.1/1] md:aspect-auto justify-center cursor-pointer hover:scale-105 md:hover:scale-100 active:scale-95 animate-fade-in-up md:max-w-[320px] md:mx-auto"
            >
              {/* Soft Color Glow behind icon */}
              <div className={`absolute w-12 h-12 blur-2xl opacity-40 rounded-full transition-all duration-500 group-hover:scale-150 ${f.glow}`} />

              <div className={`w-12 h-12 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-6 bg-gradient-to-br ${f.gradient} ${f.shadow} transition-all duration-500 group-hover:brightness-110 group-hover:scale-110 shadow-lg relative z-10 animate-float`} style={{ animationDelay: `${i * 0.2}s` }}>
                <f.icon className="w-6 h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" strokeWidth={2.5} />
              </div>
              
              <h3 className="font-headline text-sm md:text-xl font-black mb-1 md:mb-3 text-stone-900 tracking-tight group-hover:text-primary transition-colors">
                {f.title}
              </h3>
              
              <p className="text-[11px] md:text-sm text-stone-500 leading-tight md:leading-relaxed font-medium line-clamp-1 md:line-clamp-none">
                {f.desc}
              </p>

              <span className="absolute top-1 right-2 text-[8px] font-black text-stone-100 md:hidden">
                {f.number}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Modal */}
      {activeFeature && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setActiveFeature(null)}
        >
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" />
          
          <div 
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-3xl animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 rounded-full -mr-16 -mt-16 bg-gradient-to-br ${activeFeature.gradient}`} />

            <button 
              onClick={() => setActiveFeature(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-xl bg-gradient-to-br ${activeFeature.gradient} ${activeFeature.shadow}`}>
              <activeFeature.icon className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>

            <h3 className="font-headline text-2xl font-black text-stone-900 mb-3 tracking-tight">
              {activeFeature.title}
            </h3>
            
            <p className="text-sm text-stone-500 leading-relaxed mb-8 font-medium">
              {activeFeature.fullDesc}
            </p>

            <div className="space-y-3">
              {activeFeature.points.map((point, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${activeFeature.gradient} ${activeFeature.shadow}`}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-bold text-stone-700">{point}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setActiveFeature(null)}
              className="w-full mt-10 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10"
            >
              Got it, thanks
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function SuccessStoriesSection() {
  const [activeStory, setActiveStory] = useState<null | typeof stories[0]>(null);

  const stories = [
    {
      name: "Rahul & Priya",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80",
      message: "We found our perfect match within 2 months! The platform is incredibly safe and easy to use.",
      fullStory: "Our journey started with a simple interest request. From the very first conversation, we realized we shared the same family values and life goals. Bhartiya Rishtey made it so easy to connect and verify each other's backgrounds. We're now happily married for a year!",
      date: "October 2023"
    },
    {
      name: "Vikram & Anjali",
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=400&q=80",
      message: "It felt like destiny. The detailed profiles helped us know we shared the same values before we even spoke.",
      fullStory: "What I loved most about this platform was the depth of the profiles. I knew Vikram's career aspirations and his love for travel before we even met. It saved us so much time and led us directly to our forever after.",
      date: "January 2024"
    },
    {
      name: "Aditya & Sneha",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=400&q=80",
      message: "Thank you Bhartiya Rishtey for bringing us together. Our families couldn't be happier!",
      fullStory: "Coming from two different states, we never thought our paths would cross. But thanks to the advanced search filters, we found each other. Our families met and immediately bonded. It truly is a platform for families.",
      date: "March 2024"
    },
    {
      name: "Karan & Neha",
      image: "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?auto=format&fit=crop&w=400&q=80",
      message: "The premium matchmaking features are brilliant. Met the love of my life through the 'For You' swipe!",
      fullStory: "The AI matches were surprisingly accurate. I was skeptical at first, but Neha was the first person the app suggested to me. We spoke for weeks on the platform before meeting. It was the best decision of our lives.",
      date: "June 2023"
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-[#f8f6f4]">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <span className="text-xs font-bold tracking-[0.3em] uppercase text-accent mb-4 block">Success Stories</span>
        <h2 className="font-headline text-4xl md:text-5xl font-bold text-stone-900 mb-4">
          Happily Ever <span className="text-gradient">Afters</span>
        </h2>
        <p className="text-stone-500 max-w-2xl mx-auto">
          Real stories from couples who found their soulmate on our platform.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-250px * 4 - 2rem * 4)); }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="flex w-[200%] gap-8 animate-scroll pl-8">
        {/* Render twice for continuous seamless sliding effect */}
        {[...stories, ...stories].map((story, i) => (
          <div 
            key={i} 
            onClick={() => setActiveStory(story)}
            className="w-[250px] flex-shrink-0 glass-card p-4 flex flex-col hover:-translate-y-2 transition-transform duration-300 cursor-pointer active:scale-95 group"
          >
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative shadow-md group-hover:shadow-xl transition-shadow">
              <Image src={story.image} alt={story.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="text-center px-2">
              <h3 className="font-headline font-bold text-lg text-stone-900">{story.name}</h3>
              <p className="text-xs text-stone-500 mt-2 italic">"{story.message}"</p>
            </div>
          </div>
        ))}
      </div>

      {/* Success Story Modal */}
      {activeStory && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setActiveStory(null)}
        >
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" />
          
          <div 
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-0 shadow-3xl animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 sm:h-80">
              <Image src={activeStory.image} alt={activeStory.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
              <button 
                onClick={() => setActiveStory(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 hover:bg-white/40 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pb-10 -mt-16 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <span className="material-symbols-outlined text-[10px] text-primary fill-1">auto_awesome</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Matched on Platform</span>
              </div>
              
              <h3 className="font-headline text-3xl font-black text-stone-900 mb-2 tracking-tight">
                {activeStory.name}
              </h3>
              <p className="text-xs font-bold text-gold uppercase tracking-widest mb-6">{activeStory.date}</p>
              
              <div className="bg-stone-50 rounded-3xl p-6 mb-8 border border-stone-100">
                <p className="text-sm md:text-base text-stone-600 leading-relaxed italic font-medium">
                  "{activeStory.fullStory}"
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xs text-stone-400">person</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">Shared with permission</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PricingSection() {
  return (
    <section className="py-24 relative bg-[#ebe7e3]" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-gold mb-4 block">Membership Plans</span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            Invest in Your <span className="text-gradient-gold">Forever</span>
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto">
            Choose the plan that suits your journey. All plans include our core matchmaking features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <div key={plan.id} className={`glass-card p-8 relative ${i === 1 ? 'ring-2 ring-primary/20 scale-[1.02]' : ''} ${i === 2 ? 'ring-2 ring-gold/20' : ''}`}>
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${i === 1 ? 'badge-premium' : 'badge-royal'}`}>
                  {plan.badge}
                </div>
              )}
              <div className="text-center mb-6 pt-2">
                <p className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">{plan.name}</p>
                <p className="font-headline text-4xl font-bold text-stone-900">{plan.price}</p>
                <p className="text-sm text-stone-400">{plan.period}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-stone-600">
                    <span className="material-symbols-outlined text-sm text-success">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`${plan.style} w-full text-center block py-3`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#f8f6f4] text-stone-600 py-16 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Brand */}
          <div>
            <div className="mb-8">
              <h3 className="font-headline text-2xl font-black text-[#9b1c31] leading-tight">Bhartiya Rishtey</h3>
              <p className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-black mt-1">Trusted Since 2016</p>
            </div>
            <p className="text-sm leading-relaxed text-stone-500 mb-6 font-medium">
              Verified matrimonial excellence, serving Indian families with trust and heritage for nearly a decade.
            </p>
            <p className="text-[10px] tracking-widest uppercase text-stone-400 font-bold">Browse profiles on the go using the app.</p>
          </div>

          {/* Column 2: Offices */}
          <div>
            <h4 className="font-bold text-stone-900 text-sm mb-6 uppercase tracking-wider">Our Offices</h4>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-primary uppercase mb-1">1. Raipur (Registration Office)</p>
                <p className="text-xs leading-relaxed text-stone-500">Near Spark, Behind Airtel Office, Ward No. 19, Raipur, Chhattisgarh – 490042</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-primary uppercase mb-1">2. Bhilai (Sales Team)</p>
                <p className="text-xs leading-relaxed text-stone-500">Bharat Infotech, Front of Ghadi Chowk, Supela, Bhilai, District Durg, Chhattisgarh – 490023</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-primary uppercase mb-1">3. Pune (Tech Team)</p>
                <p className="text-xs leading-relaxed text-stone-500">2nd Floor, Office No. 213, Mainland Hub, Kesnand Rd, Wagholi, Pune, Maharashtra – 412207</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:contents gap-8">
            {/* Column 3: Support */}
            <div>
              <h4 className="font-bold text-stone-900 text-xs md:text-sm mb-6 uppercase tracking-wider">Support & Connect</h4>
              <div className="mb-6">
                <p className="text-[10px] font-bold text-stone-400 mb-2 uppercase">Email Support:</p>
                <p className="text-[10px] md:text-xs text-stone-500 truncate">helpbhartiyarishtey09@gmail.com</p>
                <p className="text-[10px] md:text-xs text-stone-500 truncate">bhartiyarishte03@gmail.com</p>
              </div>
              <div className="mb-6">
                <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">Contact Us</p>
                <div className="flex items-center gap-2 text-primary font-bold text-xs md:text-sm">
                  <span className="material-symbols-outlined text-xs">call</span> 9109330332
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-xs md:text-sm">
                  <span className="material-symbols-outlined text-xs">call</span> 7898680332
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase mb-3 text-left">Connect with us</p>
                <div className="flex items-center gap-3 justify-start">
                  <a href="https://www.instagram.com/bhartiya_rishtey" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-orange-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
                  </a>
                  <a href="https://www.facebook.com/people/Bhartiya-Rishtey/61587312456369/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-lg shadow-[#1877F2]/20 hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.249h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                  </a>
                  <a href="https://t.me/+ccvYJYxatiY1NWJl" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0088cc] flex items-center justify-center text-white shadow-lg shadow-[#0088cc]/20 hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.462 8.357c-.147.251-1.879 3.033-2.618 4.242-.25.409-.501.819-.75 1.228-.249.409-.5 1.474-.751 1.474-.251 0-.543-.811-.795-1.22-.251-.41-.502-.82-.752-1.23-.739-1.209-2.434-3.951-2.581-4.202-.147-.251-.044-.213.104-.213.296-.001.593-.001.889-.001.296 0 .593 0 .889 0 .148 0 .251-.038.399.213.147.25 1.053 1.71 1.791 2.918.739 1.209 1.683 2.766 1.83 3.017.147.251.25.251.398 0 .148-.251.844-1.39 1.583-2.599.739-1.209 1.309-2.14 1.457-2.39.148-.251.25-.213.398-.213.296 0 .593 0 .889 0 .296.001.593.001.889.001.148 0 .044-.038-.103.213z"></path></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Column 4: Links */}
            <div>
              <h4 className="font-bold text-stone-900 text-xs md:text-sm mb-6 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-4">
                <li><Link href="#stories" className="text-xs md:text-sm font-semibold text-stone-500 hover:text-primary transition-colors">Success Stories</Link></li>
                <li><Link href="#pricing" className="text-xs md:text-sm font-semibold text-stone-500 hover:text-primary transition-colors">Membership Plans</Link></li>
                <li><Link href="/profile" className="text-xs md:text-sm font-semibold text-stone-500 hover:text-primary transition-colors">My Profile</Link></li>
                <li><Link href="/search" className="text-xs md:text-sm font-semibold text-stone-500 hover:text-primary transition-colors">Find Matches</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-6 flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-normal text-center md:text-left">
            © 2016 Bhartiya Rishtey. All rights reserved.<br />
            The most trusted name in Indian Matrimony.
          </p>

          <div className="flex flex-col items-center md:items-end">
            <div className="bg-stone-50/50 border border-stone-100 rounded-xl p-2.5 flex items-center gap-3 shadow-sm">
              <div className="text-right">
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tight">Developed by</p>
                <p className="text-xs font-bold text-stone-900">Dinesh Kurre</p>
              </div>
              <div className="w-px h-6 bg-stone-200" />
              <div className="text-left">
                <p className="text-[9px] text-primary font-bold flex items-center gap-1 mb-0.5">
                  <span className="material-symbols-outlined text-[12px]">call</span> 73890 90956
                </p>
                <p className="text-[9px] text-stone-500 lowercase font-medium">codewithdk24@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SuccessStoriesSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
