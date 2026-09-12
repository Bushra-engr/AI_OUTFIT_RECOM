import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

export function LockedNotice({ tabName = 'this section' }) {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="my-8 max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E4E4E7] dark:border-[#27272A] shadow-sm text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#EDE9FE] dark:bg-[#18181B] flex items-center justify-center text-[#7C3AED] dark:text-[#C4B5FD] shadow-xs">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="font-serif-luxury text-2xl font-bold text-[#09090B] dark:text-white mb-2">
        Member Access Required
      </h3>
      <p className="text-sm text-[#52525B] dark:text-[#A1A1AA] max-w-md mx-auto mb-6 leading-relaxed">
        Sign in to personalize your digital wardrobe, access live weather-adaptive recommendations, and unlock {tabName}.
      </p>
      <button
        onClick={loginWithGoogle}
        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold shadow-md shadow-violet-200 dark:shadow-none transition-all hover:scale-105 cursor-pointer"
      >
        <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
