import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, saveProfile, getWardrobe } from '../services/api';
import { LockedNotice } from '../components/LockedNotice';
import { Sparkles, Edit2, Check, User, CheckCircle2, AlertCircle } from 'lucide-react';

export function ProfileTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState(null);
  const [isExisting, setIsExisting] = useState(false);
  const [items, setItems] = useState([]);

  // Profile form state matching user's backend schema (skin_tone, height, weight, gender, favorite_colors, avoided_colors, favorite_styles, sizes)
  const [displayName, setDisplayName] = useState('');
  const [defaultCity, setDefaultCity] = useState('Greater Noida');
  const [skinTone, setSkinTone] = useState('cool');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [stylePersona, setStylePersona] = useState('Smart Casual');
  const [preferredFit, setPreferredFit] = useState('Tailored');
  const [height, setHeight] = useState('165');
  const [weight, setWeight] = useState('58');
  const [topSize, setTopSize] = useState('M');
  const [bottomSize, setBottomSize] = useState('30');
  const [shoesSize, setShoesSize] = useState('UK 7');
  const [favoriteColors, setFavoriteColors] = useState('Black, Beige, Olive, White');
  const [avoidedColors, setAvoidedColors] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prof, wItems] = await Promise.all([
        getProfile(),
        getWardrobe(),
      ]);
      setItems(wItems || []);

      if (prof) {
        setIsExisting(true);
        if (prof.skin_tone) setSkinTone(prof.skin_tone);
        if (prof.gender) setGender(prof.gender);
        if (prof.height !== null && prof.height !== undefined) setHeight(prof.height.toString());
        if (prof.weight !== null && prof.weight !== undefined) setWeight(prof.weight.toString());
        if (prof.favorite_styles?.length > 0) setStylePersona(prof.favorite_styles[0]);
        if (prof.favorite_colors?.length > 0) setFavoriteColors(prof.favorite_colors.join(', '));
        if (prof.avoided_colors?.length > 0) setAvoidedColors(prof.avoided_colors.join(', '));
        if (prof.sizes) {
          if (prof.sizes.fit) setPreferredFit(prof.sizes.fit);
          if (prof.sizes.top) setTopSize(prof.sizes.top);
          if (prof.sizes.bottom) setBottomSize(prof.sizes.bottom);
          if (prof.sizes.shoes) setShoesSize(prof.sizes.shoes);
        }
      }
      setDisplayName(user.email?.split('@')[0] || 'Fashion Member');
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return <LockedNotice tabName="your wardrobe & style persona" />;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveNotification(null);
    try {
      const numHeight = height ? parseFloat(height) : null;
      const numWeight = weight ? parseFloat(weight) : null;

      const data = {
        skin_tone: skinTone,
        gender: gender,
        height: numHeight && numHeight > 50 && numHeight < 250 ? numHeight : null,
        weight: numWeight && numWeight > 20 && numWeight < 300 ? numWeight : null,
        favorite_styles: [stylePersona, preferredFit].filter(Boolean),
        favorite_colors: favoriteColors ? favoriteColors.split(',').map(s => s.trim()).filter(Boolean) : [],
        avoided_colors: avoidedColors ? avoidedColors.split(',').map(s => s.trim()).filter(Boolean) : [],
        sizes: {
          fit: preferredFit,
          top: topSize,
          bottom: bottomSize,
          shoes: shoesSize,
        },
      };
      await saveProfile(data, isExisting);
      setIsExisting(true);
      setSaveNotification({
        type: 'success',
        message: 'Fashion Profile & Style DNA synced successfully!',
      });
      setTimeout(() => setSaveNotification(null), 4000);
    } catch (err) {
      setSaveNotification({
        type: 'error',
        message: 'Sync failed: ' + err.message,
      });
      setTimeout(() => setSaveNotification(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Real Wardrobe Analytics Synced with actual closet items
  const isCategory = (item, type) => {
    const cat = (item.category || '').toLowerCase();
    const sub = (item.subcategory || '').toLowerCase();
    const text = `${cat} ${sub}`;

    if (type === 'tops') {
      return ['shirt', 't-shirt', 'tshirt', 'top', 'blouse', 'sweater', 'hoodie', 'tank', 'polo', 'tee'].some(k => text.includes(k));
    }
    if (type === 'bottoms') {
      return ['trouser', 'pant', 'chinos', 'cargo', 'bottom', 'jean', 'denim', 'skirt', 'shorts'].some(k => text.includes(k));
    }
    if (type === 'outerwear') {
      return ['jacket', 'blazer', 'coat', 'outerwear', 'shacket', 'cardigan', 'overcoat'].some(k => text.includes(k));
    }
    if (type === 'shoes') {
      return ['heel', 'shoe', 'sneaker', 'boot', 'footwear', 'loafer', 'sandal', 'slide'].some(k => text.includes(k));
    }
    return false;
  };

  const total = items.length;
  const topsCount = items.filter(i => isCategory(i, 'tops')).length;
  const bottomsCount = items.filter(i => isCategory(i, 'bottoms')).length;
  const outerwearCount = items.filter(i => isCategory(i, 'outerwear')).length;
  const shoesCount = items.filter(i => isCategory(i, 'shoes')).length;

  const topsPct = total > 0 ? Math.round((topsCount / total) * 100) : 0;
  const bottomsPct = total > 0 ? Math.round((bottomsCount / total) * 100) : 0;
  const outerwearPct = total > 0 ? Math.round((outerwearCount / total) * 100) : 0;
  const shoesPct = total > 0 ? Math.round((shoesCount / total) * 100) : 0;

  const totalWears = items.reduce((acc, it) => acc + (it.times_worn || 0), 0);
  const wornCount = items.filter(i => (i.times_worn || 0) > 0).length;
  const utilizationRate = total > 0 ? Math.round((wornCount / total) * 100) : (total > 0 ? 0 : 83);
  const combinationsCount = Math.max(topsCount * Math.max(bottomsCount, 1), total > 0 ? total : 6);

  // Dynamic Color Composition from real wardrobe items
  const colorMap = {};
  items.forEach(it => {
    let col = (it.color || '').trim();
    if (!col) col = 'Neutral';
    col = col.charAt(0).toUpperCase() + col.slice(1).toLowerCase();
    colorMap[col] = (colorMap[col] || 0) + 1;
  });

  const getColorHex = (name) => {
    const n = name.toLowerCase();
    if (n.includes('black')) return '#000000';
    if (n.includes('white')) return '#FFFFFF';
    if (n.includes('beige')) return '#F5F5DC';
    if (n.includes('brown')) return '#8B4513';
    if (n.includes('maroon') || n.includes('burgundy')) return '#800000';
    if (n.includes('blue') || n.includes('navy')) return '#1E3A8A';
    if (n.includes('green') || n.includes('olive')) return '#556B2F';
    if (n.includes('grey') || n.includes('gray')) return '#6B7280';
    if (n.includes('pink')) return '#EC4899';
    if (n.includes('red')) return '#DC2626';
    if (n.includes('yellow')) return '#F59E0B';
    return '#A855F7';
  };

  const topColors = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-5 py-2 max-w-6xl mx-auto">
      
      {/* Title */}
      <div>
        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-[#7C3AED] dark:text-[#A78BFA] block mb-1">
          MANAGE YOUR STYLE
        </span>
        <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#09090B] dark:text-white tracking-tight">
          Wardrobe &amp; Style Persona
        </h2>
        <p className="text-base sm:text-lg text-[#52525B] dark:text-[#A1A1AA] mt-1.5 font-medium">
          Manage your identity, style preferences, fashion DNA, and closet analytics.
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] text-white flex items-center justify-center font-serif-luxury font-bold text-3xl shadow-sm">
            {user.email?.charAt(0).toUpperCase() || 'B'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-serif-luxury text-2xl font-extrabold text-[#09090B] dark:text-white">
                {displayName}
              </h3>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-2xs">
                AURA VIP STYLIST
              </span>
            </div>
            <p className="text-sm font-medium text-[#52525B] dark:text-[#A1A1AA] mt-1">{user.email}</p>
          </div>
        </div>

        {/* 4 Stats */}
        <div className="flex items-center gap-8 text-center border-t md:border-t-0 md:border-l border-[#E9E7EF] dark:border-[#27272A] pt-4 md:pt-0 md:pl-8">
          <div>
            <span className="font-serif-luxury text-xl font-bold text-[#17151F] dark:text-white block">{total}</span>
            <span className="text-[10px] text-[#6B6875] dark:text-[#A1A1AA] block">Total Pieces</span>
          </div>
          <div>
            <span className="font-serif-luxury text-xl font-bold text-[#17151F] dark:text-white block">{totalWears}</span>
            <span className="text-[10px] text-[#6B6875] dark:text-[#A1A1AA] block">Total Wears</span>
          </div>
          <div>
            <span className="font-serif-luxury text-xl font-bold text-[#17151F] dark:text-white block">{combinationsCount}+</span>
            <span className="text-[10px] text-[#6B6875] dark:text-[#A1A1AA] block">Combinations</span>
          </div>
          <div>
            <span className="font-serif-luxury text-xl font-bold text-[#10B981] block">{utilizationRate}%</span>
            <span className="text-[10px] text-[#6B6875] dark:text-[#A1A1AA] block">Closet Health</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Form & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Personal Fashion Identity Form (All Schema Attributes Included) */}
        <form onSubmit={handleSave} className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs space-y-6 self-start">
          <div>
            <h4 className="text-xl font-bold text-[#09090B] dark:text-white tracking-tight">
              Personal Fashion Identity &amp; DNA
            </h4>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5 font-medium">
              These attributes configure AURA's neural compatibility scores, color algorithms, and sizing filters.
            </p>
          </div>

          {/* Section 1: Aesthetics & Style Persona */}
          <div className="space-y-3.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA] block">
              1. Aesthetics &amp; Style Persona
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Primary Style Persona
                </label>
                <select
                  value={stylePersona}
                  onChange={(e) => setStylePersona(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
                >
                  <option value="Smart Casual">Smart Casual (Elevated &amp; Chic)</option>
                  <option value="Minimalist">Minimalist (Clean &amp; Structured)</option>
                  <option value="Classic">Classic (Timeless &amp; Tailored)</option>
                  <option value="Casual">Casual (Everyday &amp; Relaxed)</option>
                  <option value="Streetwear">Streetwear (Urban &amp; Trendy)</option>
                  <option value="Formal">Formal &amp; Professional</option>
                  <option value="Bohemian">Bohemian &amp; Eclectic</option>
                  <option value="Ethnic">Ethnic &amp; Traditional</option>
                  <option value="Sporty">Sporty &amp; Athleisure</option>
                  <option value="Maximalist">Maximalist &amp; Statement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Skin Undertone (Color Harmony)
                </label>
                <select
                  value={skinTone}
                  onChange={(e) => setSkinTone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
                >
                  <option value="cool">Cool Undertone (Rose, Blue, Olive, Berry)</option>
                  <option value="warm">Warm Undertone (Golden, Amber, Peach, Earth)</option>
                  <option value="neutral">Neutral Undertone (Versatile Balance)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Preferred Fit Silhouette
                </label>
                <select
                  value={preferredFit}
                  onChange={(e) => setPreferredFit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
                >
                  <option value="Tailored">Tailored &amp; Structured</option>
                  <option value="Slim">Slim &amp; Fitted</option>
                  <option value="Relaxed">Relaxed &amp; Regular</option>
                  <option value="Oversized">Oversized &amp; Boxy</option>
                  <option value="Hybrid">Hybrid (All Fits Welcome)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Gender Preference
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other / Non-Binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Body Metrics & Sizing Matrix */}
          <div className="space-y-3.5 pt-3 border-t border-[#F3F4F6] dark:border-[#27272A]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA] block">
              2. Body Metrics &amp; Sizing Matrix
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="60"
                  max="240"
                  placeholder="e.g. 165"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  placeholder="e.g. 58"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#7C3AED]"
                />
              </div>
            </div>

            {/* Sizing: Top, Bottom, Shoes */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Top Size
                </label>
                <select
                  value={topSize}
                  onChange={(e) => setTopSize(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Bottom (Waist)
                </label>
                <select
                  value={bottomSize}
                  onChange={(e) => setBottomSize(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
                >
                  <option value="26">26</option>
                  <option value="28">28</option>
                  <option value="30">30</option>
                  <option value="32">32</option>
                  <option value="34">34</option>
                  <option value="36">36</option>
                  <option value="38">38</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">
                  Footwear Size
                </label>
                <select
                  value={shoesSize}
                  onChange={(e) => setShoesSize(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
                >
                  <option value="UK 5">UK/US 5</option>
                  <option value="UK 6">UK/US 6</option>
                  <option value="UK 7">UK/US 7</option>
                  <option value="UK 8">UK/US 8</option>
                  <option value="UK 9">UK/US 9</option>
                  <option value="UK 10">UK/US 10</option>
                  <option value="UK 11">UK/US 11</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Color Scoring Boosts & Exclusions */}
          <div className="space-y-3.5 pt-3 border-t border-[#F3F4F6] dark:border-[#27272A]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA] block">
              3. Color Harmony &amp; Boundary Rules
            </span>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA]">
                  Favorite Colors (+20 Score Boost)
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">AI Priority</span>
              </div>
              <input
                type="text"
                value={favoriteColors}
                onChange={(e) => setFavoriteColors(e.target.value)}
                placeholder="e.g. Black, Beige, Olive, White, Navy"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#7C3AED]"
              />
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mt-1 block">
                Comma-separated colors you love wearing. AURA will prioritize these in daily styling.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA]">
                  Avoided Colors (-30 Penalty Rule)
                </label>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Never Recommend</span>
              </div>
              <input
                type="text"
                value={avoidedColors}
                onChange={(e) => setAvoidedColors(e.target.value)}
                placeholder="e.g. Neon Yellow, Bright Orange, Magenta"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#7C3AED]"
              />
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] mt-1 block">
                Colors you dislike or feel wash you out. The algorithm will strictly avoid pairing them.
              </span>
            </div>
          </div>

          {/* Section 4: Display & Location Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#F3F4F6] dark:border-[#27272A]">
            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">Default City / Climate</label>
              <input
                type="text"
                value={defaultCity}
                onChange={(e) => setDefaultCity(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED]"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-200 dark:shadow-none transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Syncing DNA & Preferences...' : 'Save Profile & Preferences'}</span>
            </button>

            {saveNotification && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                saveNotification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {saveNotification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{saveNotification.message}</span>
              </div>
            )}
          </div>
        </form>

        {/* Right 1 Col: Closet Analytics Synced with Database */}
        <div className="space-y-4">
          
          {/* Color Composition */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-2xs space-y-3">
            <h4 className="font-serif-luxury text-base font-bold text-[#17151F] dark:text-white">
              Closet Color Composition
            </h4>
            <div className="space-y-2.5 text-xs">
              {topColors.length > 0 ? (
                topColors.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20 shadow-2xs"
                        style={{ backgroundColor: getColorHex(name) }}
                      />
                      <span className="text-[#52525B] dark:text-[#A1A1AA] font-medium">{name}</span>
                    </div>
                    <span className="font-bold text-[#17151F] dark:text-white">{count} pcs</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">No items found in closet.</p>
              )}
            </div>
          </div>

          {/* Wardrobe Balance Ratio */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-serif-luxury text-base font-bold text-[#17151F] dark:text-white">
                Wardrobe Balance Ratio
              </h4>
              <span className="text-[10px] font-bold text-[#7C3AED] dark:text-[#C4B5FD] uppercase tracking-wider">
                {total} Total
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center text-[#52525B] dark:text-[#A1A1AA] mb-1 font-semibold">
                  <span>Tops &amp; Shirts</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{topsCount} pcs ({topsPct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#27272A] overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500 transition-all duration-500" style={{ width: `${topsPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[#52525B] dark:text-[#A1A1AA] mb-1 font-semibold">
                  <span>Trousers &amp; Bottoms</span>
                  <span className="font-bold text-[#7C3AED] dark:text-[#C4B5FD]">{bottomsCount} pcs ({bottomsPct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#27272A] overflow-hidden">
                  <div className="h-full rounded-full bg-[#7C3AED] transition-all duration-500" style={{ width: `${bottomsPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[#52525B] dark:text-[#A1A1AA] mb-1 font-semibold">
                  <span>Jackets &amp; Outerwear</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{outerwearCount} pcs ({outerwearPct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#27272A] overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${outerwearPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[#52525B] dark:text-[#A1A1AA] mb-1 font-semibold">
                  <span>Footwear &amp; Shoes</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{shoesCount} pcs ({shoesPct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F4F4F5] dark:bg-[#27272A] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${shoesPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Utilization Ring */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-2xs text-center space-y-3">
            <h4 className="font-serif-luxury text-base font-bold text-[#17151F] dark:text-white">
              Wardrobe Utilization Rate
            </h4>
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="#F5F3FF" strokeWidth="8" fill="none" className="dark:stroke-[#18181B]" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#7C3AED"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 - (238.7 * utilizationRate) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-serif-luxury text-2xl font-bold text-[#17151F] dark:text-white">
                {utilizationRate}%
              </span>
            </div>
            <p className="text-xs text-[#6B6875] dark:text-[#A1A1AA]">
              {utilizationRate}% of your closet ({wornCount}/{total} pieces) has been rotated into outfits.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
