import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOutfitHistory, deleteOutfitHistory } from '../services/api';
import { LockedNotice } from '../components/LockedNotice';
import { Calendar, Trash2, RotateCw, MapPin, Sparkles, Heart } from 'lucide-react';

function StylistNoteCard({ text, expanded, onToggle }) {
  if (!text) return null;
  const isLong = text.length > 100;

  return (
    <div className="mt-2.5 p-2.5 rounded-xl bg-[#F8F7FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] transition-all">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#C4B5FD] block mb-0.5">
        Stylist Note
      </span>
      <p className={`text-xs text-[#374151] dark:text-[#E4E4E7] font-normal leading-relaxed ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggle) onToggle();
          }}
          className="mt-1 text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:text-[#6D28D9] dark:hover:text-[#C4B5FD] cursor-pointer inline-flex items-center gap-0.5 transition-colors"
        >
          {expanded ? 'Read less ↑' : 'Read more ↓'}
        </button>
      )}
    </div>
  );
}

export function SavedOutfitsTab({ setActiveTab }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all');
  const [expandedSaved, setExpandedSaved] = useState(new Set());

  const handleToggleExpandSaved = (id) => {
    setExpandedSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getOutfitHistory();
      setHistory(data || []);
    } catch (err) {
      console.error('History load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadHistory();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return <LockedNotice tabName="your saved outfit lookbook and history" />;
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this look from your lookbook?')) return;
    try {
      await deleteOutfitHistory(id);
      setHistory(history.filter((h) => h.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const savedHistory = history.filter((h) => h.kept !== false);
  const occasions = ['all', ...Array.from(new Set(savedHistory.map((h) => h.occasion).filter(Boolean)))];

  const filteredHistory = filterMode === 'all'
    ? savedHistory
    : savedHistory.filter((entry) => entry.occasion === filterMode);

  return (
    <div className="space-y-5 py-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-[#7C3AED] dark:text-[#A78BFA] block mb-1">
            ARCHIVED ENSEMBLES
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#09090B] dark:text-white tracking-tight">
            Saved Outfits &amp; Lookbook History
          </h2>
          <p className="text-base sm:text-lg text-[#52525B] dark:text-[#A1A1AA] mt-1.5 font-medium">
            Review your kept outfits for any occasion, and revisit AI stylist recommendations.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E9E7EF] dark:border-[#27272A] bg-white dark:bg-[#0F0F12] text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white hover:border-[#DDD6FE] shadow-2xs transition-all cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {occasions.map((occ) => {
          const count = occ === 'all' ? savedHistory.length : savedHistory.filter((h) => h.occasion === occ).length;
          const label = occ === 'all' ? 'All Saved' : occ.charAt(0).toUpperCase() + occ.slice(1);
          return (
            <button
              key={occ}
              onClick={() => setFilterMode(occ)}
              className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-bold transition-all shadow-2xs cursor-pointer ${
                filterMode === occ
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid of Saved Outfits */}
      {loading ? (
        <div className="py-24 text-center text-xs text-[#6B6875] dark:text-[#A1A1AA]">
          Loading lookbook history...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-[#0F0F12] rounded-3xl border border-[#E9E7EF] dark:border-[#27272A]">
          <p className="text-sm font-semibold text-[#17151F] dark:text-white">No outfits found in this filter</p>
          <p className="text-xs text-[#6B6875] dark:text-[#A1A1AA]">
            Curate tailored ensembles in the AI Stylist tab and save them to build your lookbook.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filteredHistory.map((entry) => {
            return (
              <div
                key={entry.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Strip */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#6B6875] dark:text-[#A1A1AA]">
                      <Calendar className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#C4B5FD]" />
                      <span>{new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {entry.occasion && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-[10px] font-bold uppercase tracking-wider">
                        {entry.occasion}
                      </span>
                    )}
                  </div>

                  {/* Garment Thumbnails Row */}
                  {entry.items && entry.items.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5 my-3">
                      {entry.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-2xl bg-[#FAFAF8] dark:bg-[#121214] p-2 flex items-center justify-center border border-[#E9E7EF] dark:border-[#27272A]"
                        >
                          <img
                            src={it.image_url}
                            alt={it.category}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-[#9CA3AF] dark:text-[#A1A1AA] bg-[#FAFAF8] dark:bg-[#121214] rounded-2xl my-3">
                      {entry.item_ids?.length || 0} pieces ensemble
                    </div>
                  )}

                  {/* AI Reasoning in Clean Readable Font */}
                  {entry.reasoning && (
                    <StylistNoteCard
                      text={entry.reasoning}
                      expanded={expandedSaved.has(entry.id)}
                      onToggle={() => handleToggleExpandSaved(entry.id)}
                    />
                  )}
                </div>

                {/* Bottom meta strip */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6] dark:border-[#27272A] mt-2">
                  <span className="text-[11px] text-[#6B6875] dark:text-[#A1A1AA] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                    <span>{entry.weather || 'Noida'}</span>
                  </span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#18181B] transition-colors"
                    title="Delete look"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Editorial Quote Banner Matching Reference Image */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#FFF1F2] via-[#FAF5FF] to-[#EFF6FF] dark:from-[#121214] dark:via-[#18181B] dark:to-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-serif-luxury text-2xl font-bold text-[#17151F] dark:text-white">
            "Good outfits lead to great days."
          </h4>
          <p className="text-xs text-[#6B6875] dark:text-[#A1A1AA] mt-1">
            Deterministic Wardrobe Rotation • Curated with Care
          </p>
        </div>
        <span className="font-handwriting text-2xl text-[#7C3AED] dark:text-[#C4B5FD]">
          Same wardrobe. A brighter you.
        </span>
      </div>

    </div>
  );
}
