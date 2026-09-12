import React, { useState } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, Check, Sparkles, Loader2 } from 'lucide-react';

export function FeedbackModal({ combo, isOpen, onClose, onSubmitFeedback }) {
  if (!isOpen || !combo) return null;

  const [rating, setRating] = useState(5);
  const [sentiment, setSentiment] = useState('like');
  const [excludedIds, setExcludedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  const toggleExclude = (id) => {
    const next = new Set(excludedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExcludedIds(next);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmitFeedback({
        rating,
        sentiment,
        excludedItemIds: Array.from(excludedIds),
        combo,
      });
      onClose();
    } catch (err) {
      alert('Feedback submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#0F0F12] rounded-3xl border border-[#DDD6FE] dark:border-[#27272A] shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6B6875] dark:text-[#A1A1AA] hover:bg-[#F3F4F6] dark:hover:bg-[#18181B] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Stylist Feedback</span>
          </div>
          <h3 className="font-serif-luxury text-xl font-bold text-[#17151F] dark:text-white">
            How was this ensemble?
          </h3>
          <p className="text-xs text-[#6B6875] dark:text-[#A1A1AA] mt-0.5">
            Your feedback sharpens AURA's neural compatibility scores for future outfits.
          </p>
        </div>

        {/* 1. Star Rating */}
        <div className="p-4 rounded-2xl bg-[#FAFAF8] dark:bg-[#18181B] border border-[#E9E7EF] dark:border-[#27272A] text-center space-y-2">
          <span className="text-[11px] font-bold text-[#6B6875] dark:text-[#A1A1AA] block">Overall Rating</span>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-115 cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-[#D1D5DB] dark:text-zinc-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 2. Sentiment Pills */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSentiment('like')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              sentiment === 'like'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50 shadow-xs'
                : 'bg-white dark:bg-[#18181B] text-[#6B6875] dark:text-[#A1A1AA] border-[#E9E7EF] dark:border-[#27272A] hover:bg-[#FAFAF8] dark:hover:bg-[#121214]'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Love this look</span>
          </button>

          <button
            type="button"
            onClick={() => setSentiment('dislike')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              sentiment === 'dislike'
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/50 shadow-xs'
                : 'bg-white dark:bg-[#18181B] text-[#6B6875] dark:text-[#A1A1AA] border-[#E9E7EF] dark:border-[#27272A] hover:bg-[#FAFAF8] dark:hover:bg-[#121214]'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>Not my vibe</span>
          </button>
        </div>

        {/* 3. Checklist of Items to Exclude / Never Wear */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#17151F] dark:text-white block">
            Exclude any pieces from future pairings?
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
            {(combo.items || []).map((it) => {
              const isExcluded = excludedIds.has(it.id);
              return (
                <label
                  key={it.id}
                  onClick={() => toggleExclude(it.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isExcluded
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-200'
                      : 'bg-[#FAFAF8] dark:bg-[#18181B] border-[#E9E7EF] dark:border-[#27272A] text-[#17151F] dark:text-[#E4E4E7] hover:bg-white dark:hover:bg-[#121214]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isExcluded}
                    onChange={() => {}}
                    className="rounded text-rose-600 focus:ring-0 cursor-pointer"
                  />
                  <img
                    src={it.image_url}
                    alt={it.category}
                    className="w-9 h-9 rounded-lg object-contain bg-white dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] p-0.5"
                  />
                  <div className="flex-1 truncate">
                    <div className="font-bold truncate">{it.subcategory || it.category}</div>
                    <div className="text-[10px] text-[#6B6875] dark:text-[#A1A1AA]">{it.color} • {it.fabric}</div>
                  </div>
                  {isExcluded && (
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Exclude</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F3F4F6] dark:border-[#27272A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-full border border-[#E9E7EF] dark:border-[#27272A] text-[#6B6875] dark:text-[#A1A1AA] hover:bg-[#FAFAF8] dark:hover:bg-[#18181B] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-6 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
