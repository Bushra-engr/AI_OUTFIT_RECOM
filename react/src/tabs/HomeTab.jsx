import React from 'react';
import { Sparkles, ArrowRight, Eye, CloudSun, Palette, UserCheck, Leaf, Compass, ChevronRight } from 'lucide-react';

export function HomeTab({ setActiveTab }) {
  const featureCards = [
    {
      id: 'vision',
      title: 'Smart Vision',
      subtitle: 'AI garment tagging, category, color & fabric recognition from photos',
      icon: Eye,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
      badge: 'Vision AI',
      target: 'upload',
    },
    {
      id: 'recommend',
      title: 'Hyper-Local Weather',
      subtitle: 'Live weather-aware layering, precipitation guard & thermal comfort',
      icon: CloudSun,
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
      badge: 'Dynamic Sync',
      target: 'recommend',
    },
    {
      id: 'studio',
      title: 'Color Harmony Engine',
      subtitle: 'Monochromatic, complementary & skin-undertone palette precision',
      icon: Palette,
      iconBg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/50',
      badge: 'Harmonic DNA',
      target: 'studio',
    },
    {
      id: 'profile',
      title: 'Personalized DNA',
      subtitle: 'Tailored to your body proportions, size matrix & style persona',
      icon: UserCheck,
      iconBg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/50',
      badge: '1:1 Styling',
      target: 'profile',
    },
  ];

  return (
    <div className="space-y-10 py-2 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#FAF5FF] via-white to-[#FFF1F2] dark:from-[#09090B] dark:via-[#121214] dark:to-[#18181B] border border-[#E9E7EF] dark:border-[#27272A] p-6 sm:p-10 lg:p-12 shadow-sm">
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-400/10 dark:bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-md border border-[#E9E7EF] dark:border-[#27272A] text-[#7C3AED] dark:text-[#C4B5FD] text-xs sm:text-sm font-extrabold tracking-widest uppercase shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#C4B5FD]" />
              <span>YOUR STYLE, SMARTER</span>
            </div>

            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-[#09090B] dark:text-white leading-[1.05]">
                Wear What <br />
                <span className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent font-black">
                  Matters.
                </span>
              </h1>
            </div>

            <p className="text-lg sm:text-xl text-[#3F3F46] dark:text-[#D4D4D8] leading-relaxed max-w-2xl font-medium">
              AI-powered haute styling that understands your wardrobe, syncs with hyper-local weather, and curates bespoke looks tailored to your exact aesthetic.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setActiveTab('recommend')}
                className="group flex items-center gap-3 px-8 sm:px-9 py-4 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#EC4899] hover:opacity-95 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-purple-500/25 transition-all hover:scale-105 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
              <button
                onClick={() => setActiveTab('studio')}
                className="flex items-center gap-2.5 px-7 sm:px-8 py-4 rounded-full bg-white dark:bg-[#121214] border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-white font-extrabold text-base sm:text-lg shadow-2xs hover:border-[#7C3AED] hover:bg-[#FAF9FC] dark:hover:bg-[#18181B] transition-all hover:scale-102 cursor-pointer"
              >
                <Compass className="w-5 h-5 text-[#7C3AED] dark:text-[#C4B5FD]" />
                <span>See How It Works</span>
              </button>
            </div>
          </div>

          {/* Right Model Graphic in Organic Luxury Arched Frame */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full max-w-[340px] sm:max-w-[380px] h-[440px] sm:h-[480px] rounded-[52px] overflow-hidden border-4 border-white dark:border-[#27272A] shadow-2xl relative bg-gradient-to-tr from-[#DDD6FE] to-[#FCE7F3] dark:from-[#18181B] dark:to-[#0F0F12] group">
              <img
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=900&auto=format&fit=crop"
                alt="Editorial Fashion Aesthetic"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Floating Top Pill */}
              <div className="absolute top-5 right-5">
                <span className="px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-extrabold tracking-wider border border-white/20 uppercase shadow-xs">
                  ✦ Bespoke Edit
                </span>
              </div>

              {/* Bottom Caption Card */}
              <div className="absolute bottom-5 left-5 right-5 text-left p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25">
                <span className="text-[11px] font-extrabold tracking-widest text-violet-200 uppercase block">
                  CAPSULE 2026
                </span>
                <span className="text-white text-xl font-bold tracking-tight block mt-0.5">
                  AURA Bespoke Lookbook
                </span>
                <span className="text-white/80 text-xs font-medium block mt-0.5">
                  Intelligent seasonal curation with zero fashion fatigue
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Feature Cards Below Hero - Upgraded, High-Visibility, Bold & Interactive */}
        <div className="mt-10 pt-8 border-t border-[#E9E7EF] dark:border-[#27272A]/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-[#7C3AED] dark:text-[#A78BFA] uppercase">
              Core Intelligence Modules
            </h3>
            <span className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">
              Click any module to launch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featureCards.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={feat.id}
                  onClick={() => setActiveTab(feat.target)}
                  className="group relative p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs hover:shadow-xl hover:border-[#7C3AED] dark:hover:border-[#A78BFA] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform ${feat.iconBg}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#FAF9FC] dark:bg-[#18181B] text-[#52525B] dark:text-[#A1A1AA] border border-[#E9E7EF] dark:border-[#27272A] uppercase tracking-wider group-hover:text-[#7C3AED] dark:group-hover:text-[#C4B5FD] transition-colors">
                        {feat.badge}
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-extrabold text-[#09090B] dark:text-white tracking-tight group-hover:text-[#7C3AED] dark:group-hover:text-[#C4B5FD] transition-colors">
                      {feat.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] font-medium leading-relaxed mt-1.5">
                      {feat.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F4F4F5] dark:border-[#1E1E22] flex items-center justify-between text-xs font-bold text-[#7C3AED] dark:text-[#C4B5FD]">
                    <span>Open Module</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </section>

      {/* Sustainability Mindful Wardrobe Section - Redesigned & Elevated */}
      <section className="p-6 sm:p-10 rounded-[32px] bg-gradient-to-r from-[#F0FDF4] to-[#ECFDF5] dark:from-[#064E3B]/20 dark:to-[#022C22]/20 border border-[#DCFCE7] dark:border-[#065F46]/50 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-xs sm:text-sm font-extrabold text-[#059669] dark:text-[#34D399] uppercase tracking-wider">
            <Leaf className="w-4 h-4" />
            <span>Sustainable Wardrobe Philosophy</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[#09090B] dark:text-white leading-tight tracking-tight">
            A more mindful wardrobe for a brighter tomorrow.
          </h3>
          <p className="text-sm sm:text-base text-[#4B5563] dark:text-[#A7F3D0] leading-relaxed font-medium">
            By rotating your investment pieces and discovering fresh pairings, AURA curates maximum combinations with minimal new consumption.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full lg:w-auto">
          <div className="px-5 py-4 rounded-2xl bg-white dark:bg-[#121214] border border-[#BBF7D0] dark:border-[#065F46]/60 shadow-xs text-center lg:text-left hover:scale-102 transition-transform">
            <span className="text-sm sm:text-base font-extrabold text-[#059669] dark:text-[#34D399] block">Reduce Waste</span>
            <span className="text-xs sm:text-sm text-[#4B5563] dark:text-[#D1D5DB] font-medium block mt-0.5">Revive unworn pieces</span>
          </div>
          <div className="px-5 py-4 rounded-2xl bg-white dark:bg-[#121214] border border-[#BBF7D0] dark:border-[#065F46]/60 shadow-xs text-center lg:text-left hover:scale-102 transition-transform">
            <span className="text-sm sm:text-base font-extrabold text-[#059669] dark:text-[#34D399] block">Multiply Looks</span>
            <span className="text-xs sm:text-sm text-[#4B5563] dark:text-[#D1D5DB] font-medium block mt-0.5">10x more combinations</span>
          </div>
          <div className="px-5 py-4 rounded-2xl bg-white dark:bg-[#121214] border border-[#BBF7D0] dark:border-[#065F46]/60 shadow-xs text-center lg:text-left hover:scale-102 transition-transform">
            <span className="text-sm sm:text-base font-extrabold text-[#059669] dark:text-[#34D399] block">Curate Style</span>
            <span className="text-xs sm:text-sm text-[#4B5563] dark:text-[#D1D5DB] font-medium block mt-0.5">Mindful closet longevity</span>
          </div>
        </div>
      </section>

    </div>
  );
}
