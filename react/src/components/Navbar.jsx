import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, Sun, Moon } from 'lucide-react';
import { AuraLogo } from './AuraLogo';
import { useTheme } from '../context/ThemeContext';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, loginWithGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navTabs = [
    { id: 'about', label: 'Home' },
    { id: 'upload', label: 'Add Piece' },
    { id: 'wardrobe', label: 'My Closet' },
    { id: 'recommend', label: 'AI Stylist' },
    { id: 'studio', label: 'Custom Studio' },
    { id: 'history', label: 'Saved Outfits' },
    { id: 'profile', label: 'My Profile' },
  ];

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#100E1D]/90 backdrop-blur-md border-b border-[#EDE9FE] dark:border-[#221F35] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-17 flex items-center justify-between gap-3 sm:gap-4 pt-1 sm:pt-1.5">
        
        {/* Brand: Aesthetic Fashion Logo (Compact) */}
        <div 
          onClick={() => setActiveTab('about')}
          className="cursor-pointer py-0.5 shrink-0 transition-transform duration-300 hover:scale-105"
        >
          <AuraLogo size="sm" />
        </div>

        {/* Centered Navigation: Seamless Clean Links (No Outer Circle/Pill Container, No Heavy Bold) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-2 text-xs lg:text-sm tracking-normal rounded-xl transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'text-[#7C3AED] dark:text-[#C4B5FD] font-medium bg-[#F5F3FF] dark:bg-[#18181B]'
                    : 'text-[#64748B] dark:text-[#94A3B8] font-normal hover:text-[#09090B] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#7C3AED] dark:bg-[#A78BFA] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Search + Theme Toggle + User Auth (Compact) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('wardrobe')}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#121214] border border-[#EDE9FE] dark:border-[#27272A] flex items-center justify-center text-[#52525B] dark:text-[#A1A1AA] hover:text-[#7C3AED] hover:border-[#DDD6FE] dark:hover:border-[#7C3AED] transition-all cursor-pointer hover:scale-105 shadow-2xs"
            title="Search Closet"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Functional Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#121214] border border-[#EDE9FE] dark:border-[#27272A] flex items-center justify-center text-[#52525B] hover:text-[#7C3AED] hover:border-[#DDD6FE] dark:hover:border-[#7C3AED] transition-all cursor-pointer hover:scale-105 shadow-2xs"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-90 duration-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#7C3AED] animate-in spin-in-90 duration-300" />
            )}
          </button>

          {!user ? (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#121214] border border-[#EDE9FE] dark:border-[#27272A] text-xs font-semibold text-[#18181B] dark:text-white shadow-2xs hover:border-[#7C3AED] hover:scale-[1.02] transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign In</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-white dark:bg-[#121214] border border-[#EDE9FE] dark:border-[#27272A] hover:border-[#7C3AED] transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] text-white flex items-center justify-center text-[11px] font-bold">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-[#18181B] dark:text-white max-w-[90px] truncate hidden sm:inline">
                  {user.email.split('@')[0]}
                </span>
              </button>

              <button
                onClick={logout}
                className="w-8 h-8 rounded-full border border-[#EDE9FE] dark:border-[#27272A] bg-white dark:bg-[#121214] flex items-center justify-center text-[#52525B] hover:text-rose-600 transition-all cursor-pointer hover:scale-105 shadow-2xs"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Navigation Bar - Single Screen, No Horizontal Scrollbar */}
      <div className="md:hidden flex items-center justify-between border-t border-[#EDE9FE] dark:border-[#27272A] bg-white/95 dark:bg-[#0A0A0A]/95 py-1 px-2 no-scrollbar overflow-x-auto">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-1 text-[11px] rounded-full whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#F5F3FF] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] font-medium'
                : 'text-[#52525B] dark:text-[#A1A1AA]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
