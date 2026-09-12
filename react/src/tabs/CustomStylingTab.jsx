import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWardrobe, saveOutfit, createOutfitCollage } from '../services/api';
import { LockedNotice } from '../components/LockedNotice';
import { FlatLayModal } from '../components/FlatLayModal';
import confetti from 'canvas-confetti';
import { Bookmark, Check, Trash2, RotateCw, Sparkles, Loader2 } from 'lucide-react';

export function CustomStylingTab() {
  const { user } = useAuth();
  const [closetItems, setClosetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [occasion, setOccasion] = useState('Casual');

  // Drag & Drop Slots
  const [customTop, setCustomTop] = useState(null);
  const [customBottom, setCustomBottom] = useState(null);
  const [customFootwear, setCustomFootwear] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [customLookSaved, setCustomLookSaved] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  // Flat-Lay state
  const [generatingFlatLay, setGeneratingFlatLay] = useState(false);
  const [customFlatLayModal, setCustomFlatLayModal] = useState(null);

  const occasions = ['Casual', 'Work / Office', 'Party', 'Wedding', 'Brunch', 'Travel'];

  const loadCloset = async () => {
    setLoading(true);
    try {
      const items = await getWardrobe();
      setClosetItems(items || []);
    } catch (err) {
      console.error('Failed to load wardrobe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadCloset();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return <LockedNotice tabName="Custom Styling & Mix-and-Match Studio" />;
  }

  const handleSlotDrop = (slotType, e) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (slotType === 'top') setCustomTop(draggedItem);
    if (slotType === 'bottom') setCustomBottom(draggedItem);
    if (slotType === 'footwear') setCustomFootwear(draggedItem);
    setDraggedItem(null);
    setCustomLookSaved(false);
  };

  const handleSaveCustomLook = async () => {
    const customItems = [customTop, customBottom, customFootwear].filter(Boolean);
    if (customItems.length === 0) return;
    try {
      await saveOutfit({
        item_ids: customItems.map((i) => i.id),
        occasion: occasion.toLowerCase(),
        weather: 'Local',
        reasoning: `Custom hand-curated ${occasion} ensemble styled in the Custom Studio.`,
      });
      setCustomLookSaved(true);
      confetti({ particleCount: 40, spread: 55 });
    } catch (err) {
      alert('Failed to save look: ' + err.message);
    }
  };

  const handleClearCanvas = () => {
    setCustomTop(null);
    setCustomBottom(null);
    setCustomFootwear(null);
    setCustomLookSaved(false);
  };

  const handleGenerateFlatLay = async () => {
    const items = [customTop, customBottom, customFootwear].filter(Boolean);
    if (items.length === 0) return;
    setGeneratingFlatLay(true);
    try {
      const res = await createOutfitCollage(items);
      if (res && res.collage_url) {
        setCustomFlatLayModal(res.collage_url);
      }
    } catch (err) {
      alert('Failed to generate flat-lay: ' + err.message);
    } finally {
      setGeneratingFlatLay(false);
    }
  };

  const filteredWardrobe = closetItems.filter((item) => {
    if (activeCategoryFilter === 'all') return true;
    const cat = (item.category || '').toLowerCase();
    const sub = (item.subcategory || '').toLowerCase();
    const text = `${cat} ${sub}`;
    if (activeCategoryFilter === 'tops') return cat.includes('shirt') || cat.includes('top') || cat.includes('blouse') || cat.includes('dress') || cat.includes('jacket');
    if (activeCategoryFilter === 'bottoms') return cat.includes('trouser') || cat.includes('pant') || cat.includes('jean');
    if (activeCategoryFilter === 'footwear') return cat.includes('shoe') || cat.includes('heel') || cat.includes('sandal');
    if (activeCategoryFilter === 'hijabs') return ['hijab', 'headscarf', 'scarf', 'turban', 'abaya', 'dupatta'].some(k => text.includes(k));
    return true;
  });

  return (
    <div className="space-y-4 py-2 max-w-6xl mx-auto">
      {/* Header Strip - Compact */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.22em] text-[#7C3AED] dark:text-[#A78BFA] block mb-1">
            INTERACTIVE STYLE STUDIO
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#09090B] dark:text-white tracking-tight">
            Custom Mix &amp; Match Canvas
          </h2>
          <p className="text-base sm:text-lg text-[#52525B] dark:text-[#A1A1AA] mt-1.5 font-medium">
            Drag wardrobe pieces directly into the slots to design custom ensembles, or click pieces to auto-place.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(customTop || customBottom || customFootwear) && (
            <>
              <button
                onClick={handleClearCanvas}
                className="px-4 py-2.5 rounded-full border border-[#E9E7EF] dark:border-[#27272A] text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#FAFAF8] dark:hover:bg-[#18181B] cursor-pointer"
              >
                Clear Canvas
              </button>
              <button
                onClick={handleGenerateFlatLay}
                disabled={generatingFlatLay}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm sm:text-base font-bold bg-white dark:bg-[#18181B] border border-[#DDD6FE] dark:border-[#27272A] text-[#7C3AED] dark:text-[#C4B5FD] hover:bg-[#F5F3FF] dark:hover:bg-[#201830] transition-all cursor-pointer shadow-xs"
                title="Synthesize single Pinterest-style flat-lay composite image"
              >
                {generatingFlatLay ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                )}
                <span>{generatingFlatLay ? 'Synthesizing...' : 'Flat-Lay Canvas'}</span>
              </button>
              <button
                onClick={handleSaveCustomLook}
                disabled={customLookSaved}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm sm:text-base font-bold shadow-xs transition-all cursor-pointer ${
                  customLookSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white hover:scale-102'
                }`}
              >
                {customLookSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ensemble Saved!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Save Ensemble</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Occasion Tag Row */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs sm:text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] shrink-0">Tag Occasion:</span>
        {occasions.map((occ) => (
          <button
            key={occ}
            onClick={() => setOccasion(occ)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              occasion === occ
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white'
            }`}
          >
            {occ}
          </button>
        ))}
      </div>

      {/* The 3 Interactive Canvas Slots - Compact & Refined */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { type: 'top', label: 'Top / Dress', icon: '👗', current: customTop, setter: setCustomTop },
          { type: 'bottom', label: 'Bottom / Pants', icon: '👖', current: customBottom, setter: setCustomBottom },
          { type: 'footwear', label: 'Footwear / Shoes', icon: '👠', current: customFootwear, setter: setCustomFootwear },
        ].map(({ type, label, icon, current, setter }) => (
          <div
            key={type}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleSlotDrop(type, e)}
            className={`h-72 rounded-2xl border-2 border-dashed flex flex-col items-center justify-between p-3.5 relative transition-all ${
              current
                ? 'bg-white dark:bg-[#0F0F12] border-[#7C3AED] shadow-2xs'
                : 'bg-[#FAFAF8]/70 dark:bg-[#121214]/70 border-[#DDD6FE] dark:border-[#27272A] hover:border-[#7C3AED]'
            }`}
          >
            {current ? (
              <div className="h-full w-full flex flex-col items-center justify-between">
                <div className="w-full flex justify-between items-center text-[10px] font-bold text-[#7C3AED] uppercase">
                  <span>{label}</span>
                  <button
                    onClick={() => setter(null)}
                    className="text-[#9CA3AF] hover:text-rose-600 p-1 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center p-2 max-h-48 overflow-hidden">
                  <img
                    src={current.image_url}
                    alt={current.subcategory}
                    className="max-h-44 max-w-full object-contain drop-shadow-xs"
                  />
                </div>

                <div className="w-full text-center pt-1 border-t border-[#F3F4F6] dark:border-[#27272A]">
                  <span className="text-xs font-bold text-[#17151F] dark:text-white capitalize truncate block">
                    {current.color ? `${current.color} ` : ''}{current.subcategory || current.category}
                  </span>
                  <span className="text-[10px] text-[#6B6875] dark:text-[#A1A1AA] capitalize">
                    {current.fabric || current.style || 'Wardrobe piece'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center space-y-1.5 pointer-events-none p-4">
                <span className="text-3xl block">{icon}</span>
                <p className="text-xs font-bold text-[#17151F] dark:text-white">Drop {label}</p>
                <p className="text-[10px] text-[#6B6875] dark:text-[#A1A1AA]">Drag from wardrobe below</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Wardrobe Drawer - Spacious & Visible Gallery */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#F3F4F6] dark:border-[#27272A] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-[#09090B] dark:text-white">
              Your Wardrobe Pieces ({closetItems.length})
            </span>
            <span className="text-xs text-[#52525B] dark:text-[#A1A1AA] hidden sm:inline font-medium">
              • Drag to slot above or click to auto-place
            </span>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5">
            {['all', 'tops', 'bottoms', 'footwear', 'hijabs'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeCategoryFilter === cat
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'bg-[#F8F7FC] dark:bg-[#18181B] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              onClick={loadCloset}
              className="p-1.5 rounded-lg text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white cursor-pointer"
              title="Refresh pieces"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Ribbon with Larger, Clear Cards */}
        {loading ? (
          <div className="py-10 text-center text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA]">Loading closet pieces...</div>
        ) : filteredWardrobe.length === 0 ? (
          <div className="py-10 text-center text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA]">
            No wardrobe pieces found in this category.
          </div>
        ) : (
          <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1.5">
            {filteredWardrobe.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDraggedItem(item)}
                onClick={() => {
                  const cat = (item.category || '').toLowerCase();
                  if (cat.includes('shirt') || cat.includes('top') || cat.includes('blouse') || cat.includes('dress') || cat.includes('jacket')) {
                    setCustomTop(item);
                  } else if (cat.includes('trouser') || cat.includes('pant') || cat.includes('jean')) {
                    setCustomBottom(item);
                  } else if (cat.includes('shoe') || cat.includes('heel') || cat.includes('sandal')) {
                    setCustomFootwear(item);
                  } else {
                    if (!customTop) setCustomTop(item);
                    else if (!customBottom) setCustomBottom(item);
                    else setCustomFootwear(item);
                  }
                  setCustomLookSaved(false);
                }}
                className="w-28 sm:w-32 h-36 sm:h-40 shrink-0 rounded-2xl bg-[#FAFAF8] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] hover:border-[#7C3AED] hover:shadow-md p-2.5 flex flex-col items-center justify-between cursor-grab active:cursor-grabbing transition-all group select-none"
              >
                <div className="w-full flex-1 flex items-center justify-center overflow-hidden p-1">
                  <img
                    src={item.image_url}
                    alt={item.category}
                    className="max-h-24 sm:max-h-28 max-w-full object-contain group-hover:scale-108 transition-transform duration-200 drop-shadow-xs"
                  />
                </div>
                <div className="w-full text-center mt-1">
                  <span className="text-xs sm:text-[13px] font-bold text-[#09090B] dark:text-white truncate block">
                    {item.subcategory || item.category}
                  </span>
                  {item.color && (
                    <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] truncate block capitalize">
                      {item.color}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pinterest Flat-Lay Full View Modal */}
      {customFlatLayModal && (
        <FlatLayModal
          collageUrl={customFlatLayModal}
          title="Custom Ensemble Lookbook"
          occasion={occasion}
          onClose={() => setCustomFlatLayModal(null)}
        />
      )}
    </div>
  );
}
