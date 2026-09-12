import React from 'react';
import {
  X,
  CheckCircle2,
  ShieldAlert,
  Sun,
  Compass,
  Palette,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';

export function GarmentDetailModal({ item, onClose, onEdit, onDelete, onToggleNeverWear }) {
  if (!item) return null;

  const getComplementaryColors = (colorName) => {
    const c = (colorName || '').toLowerCase();
    if (c.includes('black')) return [
      { name: 'Beige', hex: '#F5F5DC' },
      { name: 'Crisp White', hex: '#FFFFFF' },
      { name: 'Heather Gray', hex: '#9CA3AF' },
      { name: 'Indigo Denim', hex: '#2563EB' },
      { name: 'Camel Tan', hex: '#D97706' },
    ];
    if (c.includes('white')) return [
      { name: 'Charcoal Slate', hex: '#334155' },
      { name: 'Cobalt Blue', hex: '#2563EB' },
      { name: 'Emerald', hex: '#047857' },
      { name: 'Terracotta', hex: '#B45309' },
      { name: 'Onyx Black', hex: '#000000' },
    ];
    if (c.includes('brown')) return [
      { name: 'Crisp White', hex: '#FFFFFF' },
      { name: 'Warm Cream', hex: '#F5F5DC' },
      { name: 'Light Gray', hex: '#D1D5DB' },
      { name: 'Sage Green', hex: '#047857' },
      { name: 'Slate', hex: '#475569' },
    ];
    if (c.includes('beige')) return [
      { name: 'Deep Maroon', hex: '#800000' },
      { name: 'Sapphire Blue', hex: '#2563EB' },
      { name: 'Onyx Black', hex: '#000000' },
      { name: 'Olive Green', hex: '#047857' },
      { name: 'Plum Violet', hex: '#7C3AED' },
    ];
    if (c.includes('maroon') || c.includes('burgundy')) return [
      { name: 'Beige Cream', hex: '#F5F5DC' },
      { name: 'Crisp White', hex: '#FFFFFF' },
      { name: 'Onyx Black', hex: '#000000' },
      { name: 'Champagne Gold', hex: '#D4AF37' },
      { name: 'Slate Gray', hex: '#9CA3AF' },
    ];
    return [
      { name: 'Crisp White', hex: '#FFFFFF' },
      { name: 'Onyx Black', hex: '#000000' },
      { name: 'Beige', hex: '#F5F5DC' },
      { name: 'Cobalt', hex: '#2563EB' },
      { name: 'Neutral Gray', hex: '#6B7280' },
    ];
  };

  const getSeasonSuitability = (category, fabric) => {
    const text = `${category || ''} ${fabric || ''}`.toLowerCase();
    if (text.includes('wool') || text.includes('sweater') || text.includes('jacket') || text.includes('coat')) return 'Autumn / Winter';
    if (text.includes('cotton') || text.includes('linen') || text.includes('silk') || text.includes('satin')) return 'Spring / Summer';
    return 'All-Season Essential';
  };

  const getOccasions = (category, formality, style) => {
    const text = `${category || ''} ${formality || ''} ${style || ''}`.toLowerCase();
    if (text.includes('gown') || text.includes('formal') || text.includes('silk') || text.includes('satin') || text.includes('heels')) {
      return ['Wedding / Festive', 'Party / Gala', 'Formal Evening'];
    }
    if (text.includes('trouser') || text.includes('professional') || text.includes('shirt') || text.includes('blouse')) {
      return ['Office / Work', 'Interview / Pitch', 'Smart Casual'];
    }
    return ['Everyday Casual', 'Weekend Social', 'Travel', 'College'];
  };

  const isNeverWear = Boolean(item.never_wear);
  const compColors = getComplementaryColors(item.color);
  const season = getSeasonSuitability(item.category, item.fabric);
  const suitableOccasions = getOccasions(item.category, item.formality, item.style);
  const title = [item.color, item.subcategory || item.category].filter(Boolean).join(' ') || 'Wardrobe Piece';
  const colorHex = /^#[0-9a-f]{6}$/i.test(String(item.color || '').trim()) ? item.color : null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 dark:bg-black/70 backdrop-blur-xs" 
      role="dialog" 
      aria-modal="true" 
      aria-label="Garment details"
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[#ECEAF2] dark:border-[#27272A] bg-white dark:bg-[#0F0F12] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EEF6] dark:border-[#27272A] bg-[#FAF9FD] dark:bg-[#121214]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
              Piece Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isNeverWear 
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800' 
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            }`}>
              {isNeverWear ? <ShieldAlert className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{isNeverWear ? 'Archived' : 'Active'}</span>
            </span>

            <button 
              type="button" 
              onClick={onClose} 
              className="w-8 h-8 rounded-full border border-[#E9E5F5] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#6B6875] dark:text-[#A1A1AA] hover:text-[#7C3AED] flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Image Card (5 Cols) */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="w-full aspect-[4/5] max-h-72 rounded-2xl bg-[#FAF9FD] dark:bg-[#121214] p-4 border border-[#ECE7F6] dark:border-[#27272A] shadow-2xs flex items-center justify-center relative overflow-hidden group">
              <img 
                src={item.image_url} 
                alt={title} 
                className="max-h-full max-w-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { 
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="320"%3E%3Crect width="100%25" height="100%25" fill="%23F5F3FF" /%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%237C3AED" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E'; 
                }} 
              />
              
              <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#EDE9FE] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-[10px] font-bold shadow-2xs">
                Rotated {item.times_worn ?? 0} times
              </span>
            </div>
          </div>

          {/* Right Column: Essential Fashion Specs (7 Cols) */}
          <div className="sm:col-span-7 space-y-4">
            
            {/* Title & Category */}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-serif-luxury text-[#17151F] dark:text-white capitalize leading-tight">
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#F3F0FF] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-xs font-semibold capitalize">
                  {item.category || 'Piece'}
                </span>
                {item.subcategory && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9FD] dark:bg-[#18181B] border border-[#E9E5F5] dark:border-[#27272A] text-xs font-medium text-[#6B6875] dark:text-[#A1A1AA] capitalize">
                    {item.subcategory}
                  </span>
                )}
                {item.formality && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9FD] dark:bg-[#18181B] border border-[#E9E5F5] dark:border-[#27272A] text-xs font-medium text-[#6B6875] dark:text-[#A1A1AA] capitalize">
                    {item.formality}
                  </span>
                )}
              </div>
            </div>

            {/* 4 Core Attributes (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Color */}
              <div className="p-2.5 rounded-xl bg-[#FAF9FD] dark:bg-[#121214] border border-[#F0EEF6] dark:border-[#27272A]">
                <span className="text-[10px] font-semibold text-[#6B6875] dark:text-[#A1A1AA] block uppercase">Color</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: colorHex || '#7C3AED' }} />
                  <span className="text-xs font-bold text-[#17151F] dark:text-white capitalize truncate">{item.color || 'Unspecified'}</span>
                </div>
              </div>

              {/* Fabric */}
              <div className="p-2.5 rounded-xl bg-[#FAF9FD] dark:bg-[#121214] border border-[#F0EEF6] dark:border-[#27272A]">
                <span className="text-[10px] font-semibold text-[#6B6875] dark:text-[#A1A1AA] block uppercase">Fabric</span>
                <p className="text-xs font-bold text-[#17151F] dark:text-white capitalize truncate mt-0.5">{item.fabric || 'Cotton'}</p>
              </div>

              {/* Pattern */}
              <div className="p-2.5 rounded-xl bg-[#FAF9FD] dark:bg-[#121214] border border-[#F0EEF6] dark:border-[#27272A]">
                <span className="text-[10px] font-semibold text-[#6B6875] dark:text-[#A1A1AA] block uppercase">Pattern</span>
                <p className="text-xs font-bold text-[#17151F] dark:text-white capitalize truncate mt-0.5">{item.pattern || 'Solid'}</p>
              </div>

              {/* Season */}
              <div className="p-2.5 rounded-xl bg-[#FAF9FD] dark:bg-[#121214] border border-[#F0EEF6] dark:border-[#27272A]">
                <span className="text-[10px] font-semibold text-[#6B6875] dark:text-[#A1A1AA] block uppercase">Season</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-bold text-[#17151F] dark:text-white truncate">{season}</span>
                </div>
              </div>

            </div>

            {/* Suggested Occasions */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17151F] dark:text-white mb-1.5">
                <Compass className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Best Occasions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suitableOccasions.map((occ) => (
                  <span key={occ} className="px-2.5 py-0.5 rounded-full bg-[#EDE9FE]/70 dark:bg-[#18181B] text-[11px] font-semibold text-[#7C3AED] dark:text-[#C4B5FD] border border-[#DDD6FE]/60 dark:border-[#27272A]">
                    {occ}
                  </span>
                ))}
              </div>
            </div>

            {/* Matching Color Harmony */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#17151F] dark:text-white mb-1.5">
                <Palette className="w-3.5 h-3.5 text-[#EC4899]" />
                <span>Pairs Beautifully With</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {compColors.map((palette) => (
                  <div key={palette.name} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FAF9FD] dark:bg-[#121214] border border-[#ECEAF2] dark:border-[#27272A]">
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: palette.hex }} />
                    <span className="text-[11px] font-semibold text-[#17151F] dark:text-white">{palette.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#F0EEF6] dark:border-[#27272A] bg-[#FAF9FD] dark:bg-[#121214] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => onToggleNeverWear?.(item)} 
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                isNeverWear 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                  : 'bg-white dark:bg-[#18181B] text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 hover:bg-amber-50'
              }`}
            >
              {isNeverWear ? '✓ Re-activate' : 'Exclude / Never Wear'}
            </button>

            <button 
              type="button" 
              onClick={() => { onClose(); onDelete?.(item.id); }} 
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-full border border-[#ECEAF2] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-xs font-semibold text-[#6B6875] dark:text-[#A1A1AA] hover:text-[#17151F] dark:hover:text-white cursor-pointer"
            >
              Close
            </button>

            <button 
              type="button" 
              onClick={() => { onClose(); onEdit?.(item); }} 
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:scale-102"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
