import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ElasticCursor } from './components/ElasticCursor';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeTab } from './tabs/HomeTab';
import { UploadTab } from './tabs/UploadTab';
import { ClosetTab } from './tabs/ClosetTab';
import { StylistTab } from './tabs/StylistTab';
import { CustomStylingTab } from './tabs/CustomStylingTab';
import { SavedOutfitsTab } from './tabs/SavedOutfitsTab';
import { ProfileTab } from './tabs/ProfileTab';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState('about');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FC] dark:bg-black text-[#09090B] dark:text-white selection:bg-[#EDE9FE] selection:text-[#7C3AED] transition-colors duration-200">
      {/* Elastic Stretch Ball Cursor */}
      <ElasticCursor />

      {/* Topbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {(activeTab === 'about' || !['upload', 'wardrobe', 'closet', 'recommend', 'studio', 'split', 'history', 'profile'].includes(activeTab)) && (
          <HomeTab setActiveTab={setActiveTab} />
        )}
        {activeTab === 'upload' && <UploadTab setActiveTab={setActiveTab} />}
        {(activeTab === 'wardrobe' || activeTab === 'closet') && <ClosetTab setActiveTab={setActiveTab} />}
        {activeTab === 'recommend' && <StylistTab />}
        {(activeTab === 'studio' || activeTab === 'split') && <CustomStylingTab />}
        {activeTab === 'history' && <SavedOutfitsTab setActiveTab={setActiveTab} />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>

      {/* Luxury Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
