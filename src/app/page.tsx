'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PLANS } from '@/lib/constants/plans';

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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'nav-glass h-16 md:h-20 border-stone-100/50' : 'h-18 md:h-24 bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-1">
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col">
              <h1 className="font-headline text-[12px] min-[360px]:text-[15px] xs:text-lg md:text-2xl font-extrabold text-primary leading-tight whitespace-nowrap">Bhartiya Rishtey</h1>
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
                    <h2 className="font-headline text-xl font-bold text-primary">Bhartiya Rishtey</h2>
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

      {/* Floating Mobile Menu Button */}
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
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl float-animation-delay" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Image Section - Full bleed and seamless transition on mobile */}
        <div className="relative animate-fade-in-up-delay-1 order-1 lg:order-2 z-10 -mx-6 lg:mx-0">
          <div className="relative">
            <div className="w-full aspect-[3/4] lg:aspect-auto lg:h-[550px] lg:rounded-3xl overflow-hidden relative lg:shadow-3xl lg:ring-1 lg:ring-black/5">
              <img
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
                alt="Happy couple"
                className="w-full h-full object-cover lg:hover:scale-105 transition-transform duration-1000"
              />
              {/* Elliptical Softener - Positioned low to only affect the transition point */}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[150%] h-48 bg-[#FAF1ED] blur-[60px] rounded-[100%] lg:hidden z-30" />

              {/* Seamless gradient layers - TOP IS CLEAR, BLUR ONLY FOR TEXT */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#FAF1ED] via-[#FAF1ED]/40 to-transparent lg:hidden z-20" />
              <div className="absolute inset-0 backdrop-blur-[20px] [mask-image:linear-gradient(to_bottom,transparent_0%,transparent_45%,black_85%,black_100%)] lg:hidden pointer-events-none z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating badges - only visible on desktop to keep mobile clear */}
            <div className="absolute bottom-12 left-12 bg-white/95 backdrop-blur-md rounded-xl border border-stone-200 p-3 items-center gap-3 animate-fade-in-up-delay-2 shadow-xl z-20 transition-transform hover:scale-105 hidden lg:flex">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-success text-lg">verified</span>
              </div>
              <div>
                <p className="font-bold text-[10px] sm:text-xs text-primary">Trusted Rishtey</p>
                <p className="text-[10px] text-stone-400 whitespace-nowrap">ID Verified Profiles</p>
              </div>
            </div>

            <div className="absolute top-12 right-12 bg-white/95 backdrop-blur-md rounded-xl border border-stone-200 p-3 items-center gap-3 animate-fade-in-up-delay-3 shadow-xl z-20 transition-transform hover:scale-105 hidden lg:flex">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 pulse-ring">
                <span className="material-symbols-outlined text-primary text-lg">favorite</span>
              </div>
              <div>
                <p className="font-bold text-xs text-primary">Tradition First</p>
                <p className="text-[10px] text-stone-400 whitespace-nowrap">Rooted in values</p>
              </div>
            </div>
          </div>
        </div>

        {/* Text Section - Positioned high up over the blurred image area */}
        <div className="relative z-30 animate-fade-in-up order-2 lg:order-1 -mt-72 lg:mt-0 px-6 lg:px-0">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-primary/20 mb-8 shadow-sm">
            <span className="text-[10px] font-bold text-primary tracking-[0.15em] uppercase">Trusted by 10,000+ families</span>
          </div>

          <h1 className="font-headline text-3xl xs:text-4xl md:text-6xl font-extrabold leading-[1.2] text-stone-900 mb-6">
            Meaningful <span className="text-primary">Rishtey</span><br className="hidden md:block" />
            Made for Life
          </h1>

          <div className="lg:bg-transparent lg:backdrop-blur-none px-0 py-8 lg:mx-0 lg:px-0 lg:py-0">
            <p className="text-lg text-stone-500 leading-relaxed max-w-lg mb-8">
              A premium matrimonial platform rooted in Indian values, designed to help you find a life partner who truly understands your culture, vision, and aspirations.
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

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8 relative z-40">
              <div>
                <p className="font-headline text-2xl sm:text-3xl font-bold text-stone-900">50K+</p>
                <p className="text-[10px] sm:text-xs text-stone-400 font-medium">Active Profiles</p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-stone-200" />
              <div>
                <p className="font-headline text-2xl sm:text-3xl font-bold text-stone-900">1,200+</p>
                <p className="text-[10px] sm:text-xs text-stone-400 font-medium">Successful Matches</p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-stone-200" />
              <div className="col-span-2 sm:col-span-1">
                <p className="font-headline text-2xl sm:text-3xl font-bold text-stone-900">98%</p>
                <p className="text-[10px] sm:text-xs text-stone-400 font-medium">Verified Profiles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: 'shield',
      title: 'Privacy First',
      desc: 'End-to-end encrypted conversations. Your data is safe with military-grade security.',
      color: 'primary',
    },
    {
      icon: 'psychology',
      title: 'Smart Matchmaking',
      desc: 'Our intelligent algorithm considers 20+ compatibility factors to find your ideal partner.',
      color: 'gold',
    },
    {
      icon: 'verified_user',
      title: 'Verified Profiles',
      desc: 'Every profile is manually verified with ID proof to ensure a safe and genuine experience.',
      color: 'success',
    },
    {
      icon: 'diversity_3',
      title: 'Cultural Respect',
      desc: 'Filter by religion, community, language, and traditions. Your heritage matters to us.',
      color: 'accent',
    },
    {
      icon: 'chat_bubble',
      title: 'Real-Time Chat',
      desc: 'Connect instantly through our real-time messaging system with typing indicators.',
      color: 'primary',
    },
    {
      icon: 'workspace_premium',
      title: 'Premium Experience',
      desc: 'Unlock advanced filters, priority matches, and concierge support with premium plans.',
      color: 'gold',
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary/60 mb-4 block">Why Choose Us</span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-stone-900 mb-4">
            Built with <span className="text-gradient">Love & Trust</span>
          </h2>
          <p className="text-stone-500 max-w-2xl mx-auto">
            We combine traditional values with modern technology to create the most trusted matrimonial experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="glass-card glass-card-hover p-8 group">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${f.color === 'primary' ? 'bg-primary/10' :
                    f.color === 'gold' ? 'bg-gold/10' :
                      f.color === 'success' ? 'bg-success/10' :
                        'bg-accent/10'
                  }`}
              >
                <span className={`material-symbols-outlined text-2xl ${f.color === 'primary' ? 'text-primary' :
                    f.color === 'gold' ? 'text-gold' :
                      f.color === 'success' ? 'text-success' :
                        'text-accent'
                  }`}>{f.icon}</span>
              </div>
              <h3 className="font-headline text-xl font-bold text-stone-900 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SuccessStoriesSection() {
  const stories = [
    {
      name: "Rahul & Priya",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80",
      message: "We found our perfect match within 2 months! The platform is incredibly safe and easy to use.",
    },
    {
      name: "Vikram & Anjali",
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=400&q=80",
      message: "It felt like destiny. The detailed profiles helped us know we shared the same values before we even spoke.",
    },
    {
      name: "Aditya & Sneha",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=400&q=80",
      message: "Thank you Bhartiya Rishtey for bringing us together. Our families couldn't be happier!",
    },
    {
      name: "Karan & Neha",
      image: "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?auto=format&fit=crop&w=400&q=80",
      message: "The premium matchmaking features are brilliant. Met the love of my life through the 'For You' swipe!",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-stone-50 border-y border-stone-200">
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
          <div key={i} className="w-[250px] flex-shrink-0 glass-card p-4 flex flex-col hover:-translate-y-2 transition-transform duration-300">
            <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
              <img src={story.image} alt={story.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center px-2">
              <h3 className="font-headline font-bold text-lg text-stone-900">{story.name}</h3>
              <p className="text-xs text-stone-500 mt-2 italic">"{story.message}"</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="py-24 relative" id="pricing">
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
    <footer className="bg-white text-stone-600 py-12 border-t-[32px] border-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1: Brand */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="hidden sm:block">
                <h3 className="font-headline text-2xl font-bold text-primary leading-tight">Bhartiya Rishtey</h3>
                <p className="text-[10px] tracking-widest uppercase text-primary font-bold mt-1">Trusted Matrimony</p>
              </div>
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
