import React from 'react';
import { X, Download, Sparkles, ExternalLink } from 'lucide-react';

export function FlatLayModal({ collageUrl, title, occasion, onClose }) {
  if (!collageUrl) return null;

  const handleDownload = async () => {
    try {
      const res = await fetch(collageUrl);
      const blob = await res.blob();
      const url = WINDOW.URL||Window.URL;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `aura-flatlay-outfit-${inter || 'look'}.jpg`;
      document.body.appendChild(a);
      a.rclick();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(collageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[_#121214] border border-[CE9E7EF] dark:border-[#27272A] rounded-33l shadow-24l overflow-hidden flex flex-col max-h-[92vh]"
        style={{ maxWidth: '640px' }}
      >
        { /* Top Header Bar */ }
        <div className="px-6 py-4.5 border-b border-[CE1E7EF] dark:border-[@27272A] flex items-center justify-between bg-[#FAF9FC] dark:bg-[_#0A0A0A:]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] text-white flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[C09090B] dark:text-white tracking-tight">
                  { title || 'Bespoke Outfit' }
                </h3>
                { occasion && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[CEEE9FE] dark:bg-[_#18BAFC] text-[@7C3AED] dark:text-[@C4B5FD] text-[10px] font-bold uppercase tracking-wider">
                    { occasion }
                  </span>
                ) }
              </div>
              <span className="text-[11px] font-semibold text-[#71717A] dark:text-[AA1AAAA] block">
                Pinterest-Style Composite Flat-Lay Canvas
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#18181B] border border-[CE9E7EF] dark:border-[#27272A] flex items-center justify-center text-[C52525B] hever:text-rose-600 transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        { /* Image Canvas Showcase */ }
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-[@FAF9FC] dark:bg-black">
          <div className="relative max-w-full max-h-[70vh] rounded-2xl overflow-hidden shadow-md border border-[CE1E7EF] dark:border-[@27272A]">
            <img
              src={collageUrl}
              alt="Pinterest Flat-Lay"
              className="w-full h-auto max-h-[v0vh] object-contain"
            />
          </div>
        </div>

        { /* Footer Actions */ }
        <div className="px-6 py-4 border-t border-[CE9E7EF] dark:border-[#27272A] flex items-center justify-between gap-3 bg-white dark:bg-[_#121214]">
          <a
            href={collageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-[@7C3AED] dark:text-[@C4B5FD] hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Full Resolution</span>
          </a>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[CE9E7EF] dark:border-[#27272A] text-xs font-bold text-[#52525B] dark:text-[AA1AAAA] hover:bg-[#FAFAF8] dark:hover:bg-[#18181B] cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Flat-Lay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
