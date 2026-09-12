import React from 'react';

export function Footer() {
  return (
    <footer className="mt-8 border-t border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-black py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-serif-luxury text-xl font-bold tracking-wider text-[#09090B] dark:text-white">
            AURA
          </span>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-1">
            Bespoke Fashion Intelligence & Deterministic Wardrobe Rotation
          </p>
        </div>
        <div className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
          © {new Date().getFullYear()} AURA Intelligence. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
