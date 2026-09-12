import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { recommendOutfits, saveOutfit, deleteOutfitHistory, submitFeedback, createOutfitCollage } from '../services/api';
import { LockedNotice } from '../components/LockedNotice';
import { WeatherWidget } from '../components/WeatherWidget';
import { FeedbackModal } from '../components/FeedbackModal';
import { FlatLayModal } from '../components/FlatLayModal';
import confetti from 'canvas-confetti';
import { Sparkles, Bookmark, Check, Loader2, MessageSquareHeart, Layers, Maximize2 } from 'lucide-react';

function StylistNoteCard({ text, expanded, onToggle }) {
  if (!text) return null;
  const isLong = text.length > 110;

  return (
    <div className="mt-2 p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] transition-all">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#C4B5FD] block mb-1">
        Stylist Note
      </span>
      <p className={`text-sm text-[#27272A] dark:text-[#E4E4E7] font-medium leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggle) onToggle();
          }}
          className="mt-1.5 text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:text-[#6D28D9] dark:hover:text-[#C4B5FD] cursor-pointer inline-flex items-center gap-1 transition-colors"
        >
          {expanded ? 'Read less ↑' : 'Read more ↓'}
        </button>
      )}
    </div>
  );
}

export function StylistTab() {
  const { user } = useAuth();
  const [occasion, setOccasion] = useState('office');
  const [city, setCity] = useState('Noida');
  const [skinUndertone, setSkinUndertone] = useState('neutral');
  const [showMoreOccasions, setShowMoreOccasions] = useState(false);
  const [includeHijab, setIncludeHijab] = useState(false);

  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [keptIds, setKeptIds] = useState(new Set());
  const [passedIds, setPassedIds] = useState(new Set());
  const [savedDbIds, setSavedDbIds] = useState({});
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [feedbackModalCombo, setFeedbackModalCombo] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [wardrobeAdvice, setWardrobeAdvice] = useState(null);
  const [expandedOutfits, setExpandedOutfits] = useState(new Set());

  const handleToggleExpand = (id) => {
    setExpandedOutfits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Flat-Lay state
  const [flatLayUrls, setFlatLayUrls] = useState({});
  const [loadingFlatLay, setLoadingFlatLay] = useState({});
  const [viewFlatLay, setViewFlatLay] = useState({});
  const [viewingModalCollage, setViewingModalCollage] = useState(null);

  if (!user) {
    return <LockedNotice tabName="the Bespoke AI Stylist" />;
  }

  const primaryOccasions = [
    { id: 'office', label: 'Work', sub: 'Office', icon: '💼' },
    { id: 'casual', label: 'Casual', sub: 'Everyday', icon: '☕' },
    { id: 'party', label: 'Party', sub: 'Night Out', icon: '🪩' },
    { id: 'wedding', label: 'Wedding', sub: 'Festive', icon: '💍' },
    { id: 'travel', label: 'Travel', sub: 'Getaway', icon: '✈️' },
    { id: 'college', label: 'College', sub: 'Campus', icon: '🎓' },
  ];

  const extraOccasions = [
    { id: 'date', label: 'Date Night', sub: 'Romance', icon: '🍷' },
    { id: 'cocktail', label: 'Cocktail', sub: 'Soirée', icon: '🍸' },
    { id: 'brunch', label: 'Brunch', sub: 'Cafe', icon: '🥞' },
    { id: 'vacation', label: 'Resort', sub: 'Beach', icon: '🏖️' },
    { id: 'interview', label: 'Interview', sub: 'Pitch', icon: '🎤' },
    { id: 'festival', label: 'Cultural', sub: 'Festive', icon: '🎪' },
    { id: 'gym', label: 'Fitness', sub: 'Activewear', icon: '⚡' },
    { id: 'gala', label: 'Gala', sub: 'Black Tie', icon: '🎭' },
    { id: 'dinner', label: 'Dining', sub: 'Upscale', icon: '🍽️' },
    { id: 'concert', label: 'Concert', sub: 'Music Fest', icon: '🎸' },
    { id: 'airport', label: 'Airport', sub: 'Transit', icon: '🛫' },
    { id: 'smart_casual', label: 'Smart Casual', sub: 'Friday', icon: '👔' },
  ];

  const allOccasions = [...primaryOccasions, ...extraOccasions];

  const undertoneOptions = [
    {
      id: 'cool',
      label: 'Cool',
      desc: 'Pink / Blue undertones',
      emoji: '🧊',
      colors: ['#2563EB', '#7C3AED', '#EC4899', '#94A3B8', '#3B82F6'],
      colorNames: ['Royal Blue', 'Violet', 'Rose', 'Silver', 'Sapphire'],
    },
    {
      id: 'warm',
      label: 'Warm',
      desc: 'Golden / Peachy undertones',
      emoji: '🌻',
      colors: ['#D97706', '#B45309', '#65A30D', '#F59E0B', '#92400E'],
      colorNames: ['Amber', 'Caramel', 'Olive', 'Gold', 'Chocolate'],
    },
    {
      id: 'neutral',
      label: 'Neutral',
      desc: 'Balanced / Olive undertones',
      emoji: '🌿',
      colors: ['#10B981', '#F43F5E', '#64748B', '#A8A29E', '#1E293B'],
      colorNames: ['Emerald', 'Coral', 'Slate', 'Stone', 'Charcoal'],
    },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setHasGenerated(true);
    setWardrobeAdvice(null);
    setExpandedOutfits(new Set());
    try {
      const data = await recommendOutfits({
        occasion,
        city,
        skin_undertone: skinUndertone,
        include_hijab: includeHijab,
      });
      setOutfits(data || []);
      if (data?.length > 0) {
        if (data[0]?.wardrobe_gap_advice) {
          setWardrobeAdvice(data[0].wardrobe_gap_advice);
        }
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      }
    } catch (err) {
      alert(err.message || 'Recommendation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeepPass = async (combo, idx, keep) => {
    if (keep) {
      setKeptIds((prev) => new Set([...prev, idx]));
      setPassedIds((prev) => { const s = new Set(prev); s.delete(idx); return s; });

      // Auto-save kept outfit to database immediately
      if (!savedIds.has(idx)) {
        try {
          const itemIds = (combo.items || []).map((it) => it.id);
          const res = await saveOutfit({
            item_ids: itemIds,
            occasion,
            weather: city,
            reasoning: combo.reasoning || 'AI Recommended ensemble',
            kept: true,
          });
          if (res && res.id) {
            setSavedDbIds((prev) => ({ ...prev, [idx]: res.id }));
          }
          setSavedIds((prev) => new Set([...prev, idx]));
          confetti({ particleCount: 35, spread: 50 });
        } catch (err) {
          console.error('Auto-save on keep failed:', err);
        }
      }
    } else {
      // User passed on outfit -> strictly NOT saved to DB
      setPassedIds((prev) => new Set([...prev, idx]));
      setKeptIds((prev) => { const s = new Set(prev); s.delete(idx); return s; });
      setSavedIds((prev) => { const s = new Set(prev); s.delete(idx); return s; });

      // If it was previously auto-saved, delete it from DB history
      const savedHistoryId = savedDbIds[idx];
      if (savedHistoryId) {
        try {
          await deleteOutfitHistory(savedHistoryId);
          setSavedDbIds((prev) => {
            const next = { ...prev };
            delete next[idx];
            return next;
          });
        } catch (err) {
          console.error('Failed to remove passed outfit from history:', err);
        }
      }
    }
  };

  const handleSaveOutfit = (combo, idx) => {
    handleKeepPass(combo, idx, true);
  };

  const handleSubmitFeedbackModal = async ({ rating, sentiment, excludedItemIds, combo }) => {
    const liked = sentiment === 'like';
    const outfitItems = combo.items || [];
    for (const it of outfitItems) {
      await submitFeedback({
        item_id: it.id,
        rating,
        liked,
        never_wear: excludedItemIds.includes(it.id),
      });
    }
    setFeedbackGiven({ ...feedbackGiven, [combo.idx]: liked ? 'liked' : 'disliked' });
  };

  const getLookTitle = (idx, occ) => {
    const occasionTitles = {
      party: ['Midnight Glamour', 'Cocktail Edge', 'After-Hours Chic', 'Night Out Statement', 'Urban Soirée'],
      office: ['Executive Poise', 'Tailored Minimalist', 'Modern Professional', 'Refined Classic', 'Smart Contemporary'],
      casual: ['Effortless Everyday', 'Weekend Ease', 'Laid-Back Minimalist', 'Relaxed Modern', 'Off-Duty Chic'],
      wedding: ['Haute Celebration', 'Regal Elegance', 'Festive Grandeur', 'Timeless Heritage', 'Graceful Luxe'],
      travel: ['Jetset Comfort', 'Transit Luxe', 'Wanderlust Chic', 'Elevated Traveler', 'Breezy Voyage'],
      college: ['Campus Cool', 'Varsity Minimalist', 'Preppy Casual', 'Urban Scholar', 'Effortless Scholar'],
      brunch: ['Sunlit Chic', 'Cafe Minimalist', 'Pastel Garden', 'Breezy Social', 'Al Fresco Elegance'],
      vacation: ['Resort Luxe', 'Coastal Breeze', 'Golden Hour Ease', 'Tropical Minimal', 'Sun-Kissed Chic'],
      interview: ['First Impression', 'Commanding Poise', 'Structured Ambition', 'Polished Modern', 'Power Dressing'],
      festival: ['Cultural Grandeur', 'Vibrant Heritage', 'Festive Radiance', 'Artisanal Elegance', 'Celebration Luxe'],
      gym: ['Athletic Performance', 'Sleek Active', 'Functional Edge', 'High-Motion', 'Core Studio'],
      dinner: ['Fine Soirée', 'Candlelit Glamour', 'Sophisticated Dusk', 'Intimate Luxe', 'Sleek Evening'],
    };
    const list = occasionTitles[occ] || occasionTitles.casual;
    return list[idx % list.length];
  };

  const handleGenerateFlatLay = async (combo, idx) => {
    if (flatLayUrls[idx]) {
      setViewFlatLay((prev) => ({ ...prev, [idx]: !prev[idx] }));
      return;
    }
    setLoadingFlatLay((prev) => ({ ...prev, [idx]: true }));
    setViewFlatLay((prev) => ({ ...prev, [idx]: true }));
    try {
      const res = await createOutfitCollage(combo.items);
      if (res && res.collage_url) {
        setFlatLayUrls((prev) => ({ ...prev, [idx]: res.collage_url }));
      }
    } catch (err) {
      alert('Flat-Lay creation failed: ' + err.message);
      setViewFlatLay((prev) => ({ ...prev, [idx]: false }));
    } finally {
      setLoadingFlatLay((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const selectedUndertone = undertoneOptions.find((u) => u.id === skinUndertone);

  return (
    <div className="space-y-6 py-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm sm:text-base font-extrabold uppercase tracking-[0.22em] text-[#7C3AED] dark:text-[#A78BFA] block mb-1.5">
            AI STYLIST
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#09090B] dark:text-white tracking-tight leading-tight">
            Bespoke Ensemble Styling
          </h2>
          <p className="text-base sm:text-lg text-[#52525B] dark:text-[#D4D4D8] mt-1.5 font-medium leading-relaxed">
            AI-curated recommendations tailored to your occasion, city weather &amp; skin tone harmony.
          </p>
        </div>
      </div>

      {/* Main Stylist Form */}
      <div className="space-y-6">
        {/* 1. Occasion Selector */}
        <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-bold text-[#09090B] dark:text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#EDE9FE] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-sm flex items-center justify-center font-extrabold shadow-2xs">1</span>
              Select Occasion
            </span>
            <button
              onClick={() => setShowMoreOccasions(!showMoreOccasions)}
              className="text-xs sm:text-sm font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:underline cursor-pointer"
            >
              {showMoreOccasions ? 'Show Less' : 'More Occasions +'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
            {primaryOccasions.map((occ) => {
              const isSelected = occasion === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onPointerDown={() => setOccasion(occ.id)}
                  onClick={() => setOccasion(occ.id)}
                  className={`p-4 sm:p-5 rounded-2xl border text-center transition-all duration-75 cursor-pointer flex flex-col items-center justify-center gap-2 active:scale-95 select-none ${
                    isSelected
                      ? 'border-[#7C3AED] bg-[#F5F3FF] dark:bg-[#18181B] shadow-md ring-2 ring-[#7C3AED]/20 scale-[1.02]'
                      : 'border-[#E9E7EF] dark:border-[#27272A] bg-[#FAFAF8] dark:bg-[#121214] hover:border-[#DDD6FE] dark:hover:border-[#7C3AED] hover:shadow-xs'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl block pointer-events-none">{occ.icon}</span>
                  <span className="text-sm sm:text-base font-bold text-[#09090B] dark:text-white block pointer-events-none">{occ.label}</span>
                  <span className="text-xs text-[#52525B] dark:text-[#A1A1AA] font-medium block pointer-events-none">{occ.sub}</span>
                </button>
              );
            })}
          </div>

          {showMoreOccasions && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 pt-3.5 border-t border-[#F3F4F6] dark:border-[#27272A] animate-in fade-in duration-200">
              {extraOccasions.map((occ) => (
                <button
                  key={occ.id}
                  type="button"
                  onPointerDown={() => setOccasion(occ.id)}
                  onClick={() => setOccasion(occ.id)}
                  className={`p-4 sm:p-5 rounded-2xl border text-center transition-all duration-75 cursor-pointer flex flex-col items-center justify-center gap-2 active:scale-95 select-none ${
                    occasion === occ.id
                      ? 'border-[#7C3AED] bg-[#F5F3FF] dark:bg-[#18181B] shadow-md ring-2 ring-[#7C3AED]/20 scale-[1.02]'
                      : 'border-[#E9E7EF] dark:border-[#27272A] bg-[#FAFAF8] dark:bg-[#121214] hover:border-[#DDD6FE] dark:hover:border-[#7C3AED] hover:shadow-xs'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl block pointer-events-none">{occ.icon}</span>
                  <span className="text-sm sm:text-base font-bold text-[#09090B] dark:text-white block pointer-events-none">{occ.label}</span>
                  <span className="text-xs text-[#52525B] dark:text-[#A1A1AA] font-medium block pointer-events-none">{occ.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column: Weather Context & Skin Undertone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Weather Widget Panel */}
          <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex flex-col space-y-3">
            <span className="text-base sm:text-lg font-bold text-[#09090B] dark:text-white flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#EDE9FE] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-sm flex items-center justify-center font-extrabold shadow-2xs">2</span>
              Live Weather Context
            </span>
            <WeatherWidget city={city} onCityChange={setCity} />
          </div>

          {/* Skin Undertone Panel */}
          <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-bold text-[#09090B] dark:text-white flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#EDE9FE] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-sm flex items-center justify-center font-extrabold shadow-2xs">3</span>
                Skin Undertone &amp; Harmony
              </span>
              <span className="text-xs sm:text-sm text-[#7C3AED] dark:text-[#C4B5FD] font-bold">Matched Palette</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {undertoneOptions.map((ut) => (
                <button
                  key={ut.id}
                  type="button"
                  onPointerDown={() => setSkinUndertone(ut.id)}
                  onClick={() => setSkinUndertone(ut.id)}
                  className={`rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-75 cursor-pointer flex flex-col justify-between active:scale-95 select-none ${
                    skinUndertone === ut.id
                      ? 'border-[#7C3AED] bg-[#F5F3FF] dark:bg-[#18181B] shadow-md ring-2 ring-[#7C3AED]/20 scale-[1.02]'
                      : 'border-[#E9E7EF] dark:border-[#27272A] bg-[#FAFAF8] dark:bg-[#121214] hover:border-[#DDD6FE] dark:hover:border-[#7C3AED]'
                  }`}
                >
                  <div>
                    <span className="text-2xl sm:text-3xl block mb-1 pointer-events-none">{ut.emoji}</span>
                    <span className={`text-sm sm:text-base font-bold block pointer-events-none ${skinUndertone === ut.id ? 'text-[#7C3AED] dark:text-[#C4B5FD]' : 'text-[#09090B] dark:text-white'}`}>
                      {ut.label}
                    </span>
                    <span className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] block leading-snug mt-0.5 mb-2.5 pointer-events-none">
                      {ut.desc}
                    </span>
                  </div>
                  <div className="flex gap-1.5 pointer-events-none">
                    {ut.colors.map((c, i) => (
                      <span key={i} title={ut.colorNames[i]} className="w-4 h-4 rounded-full border border-black/10 inline-block shrink-0 shadow-xs" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {selectedUndertone && (
              <div className="pt-3 border-t border-[#F3F4F6] dark:border-[#27272A] flex flex-wrap gap-2">
                {selectedUndertone.colors.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#09090B] dark:text-white bg-[#FAFAF8] dark:bg-[#121214] px-3 py-1.5 rounded-full border border-[#E9E7EF] dark:border-[#27272A]">
                    <span className="w-3 h-3 rounded-full border border-black/10 inline-block shrink-0" style={{ backgroundColor: c }} />
                    {selectedUndertone.colorNames[i]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Modest Styling / Hijab Toggle Option */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/60 dark:to-pink-950/40 text-2xl flex items-center justify-center shrink-0 shadow-2xs">
              🧕
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-[#09090B] dark:text-white">
                  Style with Hijab / Modest Headwear
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-[#C4B5FD] tracking-wider">
                  Toggle
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] mt-0.5">
                {includeHijab
                  ? 'Active: Curated outfits will specifically include your coordinated hijab & modest coverage.'
                  : 'Disabled: Outfits will be curated without any hijab or headscarf.'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center">
            <input
              type="checkbox"
              checked={includeHijab}
              onChange={(e) => setIncludeHijab(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-zinc-600 peer-checked:bg-[#7C3AED] shadow-inner"></div>
          </label>
        </div>

        {/* Generate Button - Prominent, Bold & Sleek */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="group px-10 sm:px-14 py-4 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#EC4899] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Synthesizing Combinations...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
                <span>Generate AI Outfits</span>
                <span className="text-amber-300">✨</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Wardrobe Gap Stylist Advice */}
      {wardrobeAdvice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3.5 shadow-2xs">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block text-amber-900 dark:text-amber-300">Stylist Wardrobe Insight</span>
            <p className="leading-relaxed opacity-95">{wardrobeAdvice}</p>
          </div>
        </div>
      )}

      {/* Honest Empty State if no outfits possible */}
      {hasGenerated && !loading && outfits.length === 0 && (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs max-w-2xl mx-auto space-y-4 my-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#C4B5FD] flex items-center justify-center text-3xl shadow-xs">
            👗
          </div>
          <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#17151F] dark:text-white">
            No Authentic Outfits for {allOccasions.find(o => o.id === occasion)?.label || occasion}
          </h3>
          <p className="text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed max-w-md mx-auto">
            AURA couldn't curate a genuine ensemble for this occasion because your wardrobe currently lacks dedicated pieces for it. An authentic luxury stylist refuses to fabricate inappropriate outfits!
          </p>
        </div>
      )}

      {/* Curated AI Outfits Grid */}
      {outfits.length > 0 && (
        <div className="space-y-5 pt-4">
          <div className="border-b border-[#E9E7EF] dark:border-[#27272A] pb-3">
            <h3 className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#09090B] dark:text-white">Curated Outfits for You</h3>
            <p className="text-sm sm:text-base text-[#52525B] dark:text-[#A1A1AA] mt-1 font-medium">AI-generated looks based on your occasion, weather and skin tone.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
            {outfits.map((combo, idx) => {
              const isSaved = savedIds.has(idx);
              const fb = feedbackGiven[idx];
              const isKept = keptIds.has(idx);
              const isPassed = passedIds.has(idx);
              const title = combo.title || getLookTitle(idx, occasion);
              const outfitKey = combo.outfit_id || combo.id || `outfit_${idx}`;
              const isExpanded = expandedOutfits.has(outfitKey);
              return (
                <div key={outfitKey} className="group bg-white dark:bg-[#0F0F12] rounded-3xl border border-[#E9E7EF] dark:border-[#27272A] hover:border-[#DDD6FE] dark:hover:border-[#7C3AED] p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all space-y-3.5 relative">
                  <div>
                    {/* Media Display: Composite Flat-Lay vs 2x2 Grid */}
                    {viewFlatLay[idx] && flatLayUrls[idx] ? (
                      <div
                        onClick={() => setViewingModalCollage({ url: flatLayUrls[idx], title, occasion })}
                        className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#FAF8F5] dark:bg-[#121214] p-1.5 mb-3 cursor-zoom-in relative group/flatlay border border-[#E9E7EF] dark:border-[#27272A] shadow-2xs hover:shadow-md transition-all flex items-center justify-center"
                        title="Click to view full screen & download"
                      >
                        <img
                          src={flatLayUrls[idx]}
                          alt={`${title} Flat-Lay`}
                          className="max-h-full max-w-full object-contain rounded-xl"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/80 backdrop-blur-xs text-[10px] font-bold text-[#7C3AED] dark:text-[#C4B5FD] uppercase tracking-wider shadow-2xs">
                          ✦ Pinterest Flat-Lay
                        </div>
                        <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 backdrop-blur-xs text-white opacity-0 group-hover/flatlay:opacity-100 transition-opacity">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : loadingFlatLay[idx] ? (
                      <div className="aspect-[4/5] rounded-2xl bg-[#FAF8F5] dark:bg-[#121214] flex flex-col items-center justify-center gap-2.5 p-4 mb-3 border border-dashed border-[#DDD6FE] dark:border-[#27272A] text-center">
                        <Loader2 className="w-7 h-7 text-[#7C3AED] animate-spin" />
                        <span className="text-xs font-bold text-[#7C3AED] dark:text-[#C4B5FD]">Synthesizing Flat-Lay...</span>
                        <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">Merging pieces on editorial canvas</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 aspect-[4/5] rounded-2xl bg-[#FAFAF8] dark:bg-[#121214] p-2 mb-3 overflow-hidden">
                        {combo.items.map((it, i) => (
                          <div key={i} className="rounded-xl bg-white dark:bg-[#18181B] p-2 flex items-center justify-center border border-[#E9E7EF]/80 dark:border-[#27272A] shadow-2xs">
                            <img src={it.image_url} alt={it.subcategory} className="max-h-full max-w-full object-contain" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-lg font-bold text-[#09090B] dark:text-white truncate">{title}</h4>
                        <button
                          onClick={() => handleGenerateFlatLay(combo, idx)}
                          disabled={loadingFlatLay[idx]}
                          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                            viewFlatLay[idx] && flatLayUrls[idx]
                              ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs'
                              : 'bg-[#FAF9FC] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] border-[#DDD6FE] dark:border-[#27272A] hover:bg-[#F5F3FF]'
                          }`}
                          title="Generate single Pinterest-style composite image"
                        >
                          {loadingFlatLay[idx] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          <span>{viewFlatLay[idx] && flatLayUrls[idx] ? 'Show Grid' : 'Flat-Lay'}</span>
                        </button>
                      </div>

                      {combo.reasoning && (
                        <StylistNoteCard
                          text={combo.reasoning}
                          expanded={isExpanded}
                          onToggle={() => handleToggleExpand(outfitKey)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Keep / Pass Row */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => handleKeepPass(combo, idx, true)}
                      className={`py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                        isKept
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      }`}
                      title="Keep outfit (auto-saves to your lookbook)"
                    >
                      <span className="text-base">✓</span> {isKept ? 'Kept & Saved' : 'Keep'}
                    </button>
                    <button
                      onClick={() => handleKeepPass(combo, idx, false)}
                      className={`py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                        isPassed
                          ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                          : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                      }`}
                      title="Pass outfit (will not be saved)"
                    >
                      <span className="text-base">✕</span> Pass
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#F3F4F6] dark:border-[#27272A]">
                    <button
                      onClick={() => setFeedbackModalCombo({ ...combo, idx })}
                      className={`px-3 py-2 rounded-xl border text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
                        fb === 'liked'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : fb === 'disliked'
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          : 'text-[#52525B] dark:text-[#A1A1AA] border-[#E9E7EF] dark:border-[#27272A] hover:bg-[#FAFAF8] dark:hover:bg-[#18181B]'
                      }`}
                      title="Give Feedback"
                    >
                      <MessageSquareHeart className="w-4 h-4 text-[#7C3AED] dark:text-[#C4B5FD]" />
                      <span className="font-bold">{fb ? fb : 'Rate'}</span>
                    </button>
                    <button
                      onClick={() => handleKeepPass(combo, idx, true)}
                      disabled={isKept || isSaved}
                      className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                        (isKept || isSaved) ? 'bg-emerald-600 text-white' : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] hover:scale-102'
                      }`}
                      title="Save this look to your Lookbook"
                    >
                      {(isKept || isSaved) ? <><Check className="w-4 h-4" /><span>Saved Look</span></> : <><Bookmark className="w-4 h-4" /><span>Save</span></>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {feedbackModalCombo && (
        <FeedbackModal
          combo={feedbackModalCombo}
          isOpen={!!feedbackModalCombo}
          onClose={() => setFeedbackModalCombo(null)}
          onSubmitFeedback={handleSubmitFeedbackModal}
        />
      )}

      {/* Pinterest Flat-Lay Full Modal */}
      {viewingModalCollage && (
        <FlatLayModal
          collageUrl={viewingModalCollage.url}
          title={viewingModalCollage.title}
          occasion={viewingModalCollage.occasion}
          onClose={() => setViewingModalCollage(null)}
        />
      )}
    </div>
  );
}
