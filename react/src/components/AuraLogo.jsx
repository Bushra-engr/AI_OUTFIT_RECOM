import React from 'react';

export function AuraLogo({ size = 'sm', className = '' }) {
  const isSm = size === 'sm';
  return (
    <div className={`flex flex-col items-center justify-center group select-none ${className}`}>
      {/* Aesthetic Light Badge with Sunglasses Fashion Girl Icon */}
      <div className={`${isSm ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-[#F3F0FF] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] border border-[#DDD6FE] dark:border-[#27272A] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300`}>
        <svg 
          className={`${isSm ? 'w-5 h-5' : 'w-6 h-6'}`} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Chic Bob Hair Silhouette */}
          <path 
            d="M16 4.5C10.8 4.5 6.5 8.8 6.5 14C6.5 17.5 8 20.8 10 22V20.5C8.8 19 8 16.8 8 14C8 9.6 11.6 6 16 6C20.4 6 24 9.6 24 14C24 16.8 23.2 19 22 20.5V22C24 20.8 25.5 17.5 25.5 14C25.5 8.8 21.2 4.5 16 4.5Z" 
            fill="currentColor"
          />
          {/* Chic Bangs Fringe */}
          <path 
            d="M10 12C12 9.8 14.8 9.2 16 9.2C17.2 9.2 20 9.8 22 12C20.5 10.8 18.2 10.2 16 10.2C13.8 10.2 11.5 10.8 10 12Z" 
            fill="currentColor"
          />
          {/* Bold Aesthetic Sunglasses - Left Lens */}
          <path 
            d="M8.5 13.8H14.2C14.2 13.8 14.2 17.2 11.4 17.2C8.6 17.2 8.5 13.8 8.5 13.8Z" 
            fill="currentColor"
          />
          {/* Bold Aesthetic Sunglasses - Right Lens */}
          <path 
            d="M17.8 13.8H23.5C23.5 13.8 23.4 17.2 20.6 17.2C17.8 17.2 17.8 13.8 17.8 13.8Z" 
            fill="currentColor"
          />
          {/* Sunglasses Frame Bridge */}
          <path 
            d="M14.2 14.5H17.8" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            strokeLinecap="round"
          />
          {/* Subtle Delicate Lips */}
          <path 
            d="M14.2 21.2C15 21.9 17 21.9 17.8 21.2" 
            stroke="currentColor" 
            strokeWidth="1.1" 
            strokeLinecap="round"
          />
          {/* Slender Neck & Minimalist Blazer Collar */}
          <path 
            d="M14.5 23V25.8L10.5 28.5M17.5 23V25.8L21.5 28.5" 
            stroke="currentColor" 
            strokeWidth="1.1" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Name directly below */}
      <span className="font-serif-luxury text-xs font-extrabold tracking-[0.25em] text-[#09090B] dark:text-white mt-1 leading-none group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition-colors">
        AURA
      </span>
    </div>
  );
}
