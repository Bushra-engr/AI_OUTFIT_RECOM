import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWardrobe, updateGarment, deleteGarment } from '../services/api';
import { LockedNotice } from '../components/LockedNotice';
import { EditItemModal } from '../components/EditItemModal';
import { GarmentDetailModal } from '../components/GarmentDetailModal';
import { Search, Plus, RotateCw, MoreHorizontal } from 'lucide-react';

export function ClosetTab({ setActiveTab }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filterSort, setFilterSort] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getWardrobe();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load wardrobe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadItems();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return <LockedNotice tabName="your personal wardrobe sanctuary" />;
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this garment from your wardrobe?')) return;
    try {
      await deleteGarment(id);
      setItems(items.filter((item) => item.id !== id));
      if (selectedDetailItem?.id === id) setSelectedDetailItem(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleUpdate = async (id, updates) => {
    const updated = await updateGarment(id, updates);
    setItems(items.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    if (selectedDetailItem?.id === id) {
      setSelectedDetailItem({ ...selectedDetailItem, ...updated });
    }
  };

  const handleToggleNeverWear = async (item) => {
    try {
      const nextVal = !item.never_wear;
      await updateGarment(item.id, { never_wear: nextVal });
      const updated = { ...item, never_wear: nextVal };
      setItems(items.map(i => i.id === item.id ? updated : i));
      if (selectedDetailItem?.id === item.id) {
        setSelectedDetailItem(updated);
      }
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  // Robust category matching function that handles real DB values ('Shirt', 'Trouser', 'Dress', 'Heels')
  const isMatch = (item, catId) => {
    if (catId === 'all') return true;
    const cat = (item.category || '').toLowerCase();
    const sub = (item.subcategory || '').toLowerCase();
    const text = `${cat} ${sub}`;

    switch (catId) {
      case 'tops':
        return ['shirt', 't-shirt', 'top', 'blouse', 'sweater', 'hoodie', 'tank'].some(k => text.includes(k));
      case 'shirts':
        return text.includes('shirt') || text.includes('blouse');
      case 't-shirts':
        return text.includes('t-shirt') || text.includes('tshirt') || text.includes('tee');
      case 'trousers':
        return ['trouser', 'pant', 'chinos', 'cargo', 'bottom'].some(k => text.includes(k));
      case 'jeans':
        return text.includes('jean') || text.includes('denim');
      case 'dresses':
        return ['dress', 'gown', 'one_piece', 'frock'].some(k => text.includes(k));
      case 'jackets':
        return ['jacket', 'blazer', 'coat', 'outerwear', 'shacket', 'cardigan'].some(k => text.includes(k));
      case 'shoes':
        return ['heel', 'shoe', 'sneaker', 'boot', 'footwear', 'loafer', 'sandal'].some(k => text.includes(k));
      case 'sandals':
        return ['sandal', 'slide', 'flip-flop', 'heel'].some(k => text.includes(k));
      case 'hijabs':
        return ['hijab', 'headscarf', 'scarf', 'turban', 'abaya', 'dupatta', 'stole', 'shawl'].some(k => text.includes(k));
      default:
        return text.includes(catId);
    }
  };

  // KPIs
  const totalCount = items.length;
  const topsCount = items.filter(i => isMatch(i, 'tops')).length;
  const bottomsCount = items.filter(i => isMatch(i, 'trousers') || isMatch(i, 'jeans')).length;
  const shoesCount = items.filter(i => isMatch(i, 'shoes')).length;
  const activeCount = items.filter(i => !i.never_wear).length;

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'tops', label: 'Tops' },
    { id: 'shirts', label: 'Shirts' },
    { id: 't-shirts', label: 'T-Shirts' },
    { id: 'trousers', label: 'Trousers' },
    { id: 'jeans', label: 'Jeans' },
    { id: 'dresses', label: 'Dresses' },
    { id: 'jackets', label: 'Jackets' },
    { id: 'hijabs', label: 'Hijabs & Modest' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'sandals', label: 'Sandals' },
  ];

  const filteredItems = items.filter((item) => {
    const matchesCat = isMatch(item, activeCategory);
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || 
      (item.subcategory || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query) ||
      (item.color || '').toLowerCase().includes(query) ||
      (item.fabric || '').toLowerCase().includes(query) ||
      (item.style || '').toLowerCase().includes(query);
    
    if (filterSort === 'worn') return matchesCat && matchesSearch && (item.times_worn > 0);
    if (filterSort === 'unworn') return matchesCat && matchesSearch && (!item.times_worn || item.times_worn === 0);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 py-3">
      
      {/* Eyebrow & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-[#7C3AED] dark:text-[#A78BFA] block mb-1">
            DIGITAL INVENTORY
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#09090B] dark:text-white tracking-tight">
            My Wardrobe Sanctuary
          </h2>
          <p className="text-base sm:text-lg text-[#52525B] dark:text-[#A1A1AA] mt-1.5 font-medium">
            Search, filter, and explore your personal digital closet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadItems}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E9E7EF] dark:border-[#27272A] bg-white dark:bg-[#0F0F12] text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white hover:border-[#DDD6FE] shadow-2xs transition-all cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm sm:text-base shadow-md shadow-violet-200 dark:shadow-none transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Piece</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] text-[#EC4899] flex items-center justify-center font-serif-luxury font-bold text-2xl">
            👗
          </div>
          <div>
            <span className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#09090B] dark:text-white leading-none block">{totalCount}</span>
            <span className="text-xs sm:text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] mt-1 block">Total Pieces</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center font-serif-luxury font-bold text-2xl">
            👔
          </div>
          <div>
            <span className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#3B82F6] leading-none block">{topsCount}</span>
            <span className="text-xs sm:text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] mt-1 block">Tops &amp; Shirts</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] text-[#FF6B6B] flex items-center justify-center font-serif-luxury font-bold text-2xl">
            👖
          </div>
          <div>
            <span className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#FF6B6B] leading-none block">{bottomsCount}</span>
            <span className="text-xs sm:text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] mt-1 block">Bottoms</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center font-serif-luxury font-bold text-2xl">
            👠
          </div>
          <div>
            <span className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#10B981] leading-none block">{shoesCount}</span>
            <span className="text-xs sm:text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] mt-1 block">Footwear</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center font-serif-luxury font-bold text-2xl">
            ✨
          </div>
          <div>
            <span className="font-serif-luxury text-2xl sm:text-3xl font-extrabold text-[#7C3AED] leading-none block">{activeCount}</span>
            <span className="text-xs sm:text-sm font-bold text-[#52525B] dark:text-[#A1A1AA] mt-1 block">Active</span>
          </div>
        </div>
      </div>

      {/* Prominent Search + Dropdown */}
      <div className="flex flex-col sm:flex-row items-center gap-3.5">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by color, style, fabric, pattern..."
            className="w-full pl-12 pr-4 py-3 text-sm sm:text-base rounded-full bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED] shadow-2xs font-medium placeholder-[#A1A1AA]"
          />
        </div>

        <select
          value={filterSort}
          onChange={(e) => setFilterSort(e.target.value)}
          className="w-full sm:w-auto px-5 py-3 text-sm sm:text-base rounded-full bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] text-[#09090B] dark:text-white focus:outline-hidden focus:border-[#7C3AED] shadow-2xs cursor-pointer font-bold"
        >
          <option value="all">All Items</option>
          <option value="worn">Rotated / Worn</option>
          <option value="unworn">Unworn (Ready for Outfits)</option>
        </select>
      </div>

      {/* Pill-shaped Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const count = items.filter(i => isMatch(i, cat.id)).length;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 sm:px-5 py-2 rounded-full text-sm sm:text-base font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-md'
                  : 'bg-white dark:bg-[#0F0F12] border border-[#E9E7EF] dark:border-[#27272A] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white hover:border-[#DDD6FE]'
              }`}
            >
              <span>{cat.label}</span>
              {cat.id !== 'all' && (
                <span className={`ml-1.5 text-xs sm:text-sm ${isActive ? 'text-white/80' : 'text-[#A1A1AA]'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Garment Grid (4 per row on desktop) */}
      {loading ? (
        <div className="py-24 text-center text-base font-medium text-[#52525B] dark:text-[#A1A1AA]">
          Loading your wardrobe collection...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-[#0F0F12] rounded-3xl border border-[#E9E7EF] dark:border-[#27272A]">
          <p className="text-base font-bold text-[#09090B] dark:text-white">No garments found in this category</p>
          <p className="text-sm text-[#52525B] dark:text-[#A1A1AA] max-w-sm mx-auto">
            Try switching category pills or adding more clothing pieces to your wardrobe.
          </p>
          <button
            onClick={() => setActiveCategory('all')}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs cursor-pointer"
          >
            Show All Pieces
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedDetailItem(item)}
              className="group bg-white dark:bg-[#121214] rounded-2xl border border-[#E9E7EF] dark:border-[#27272A] hover:border-[#7C3AED]/60 dark:hover:border-[#A78BFA]/60 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
            >
              {/* Image Container - Flush E-commerce Showcase */}
              <div className="w-full aspect-[3/4] bg-[#F8F8FA] dark:bg-[#18181B] p-2.5 sm:p-3 flex items-center justify-center overflow-hidden relative">
                <img
                  src={item.image_url}
                  alt={item.subcategory || item.category || 'Piece'}
                  className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-500 ease-out"
                />

                {/* E-commerce Badges (Top Left: Category & Wears) */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/80 backdrop-blur-xs text-[10px] font-bold text-[#52525B] dark:text-[#D4D4D8] uppercase tracking-wider shadow-2xs">
                    {item.category || 'Piece'}
                  </span>
                  {(item.times_worn || 0) > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-[#F5F3FF]/95 dark:bg-[#1E1B2E]/95 backdrop-blur-xs text-[9px] font-bold text-[#7C3AED] dark:text-[#C4B5FD] shadow-2xs">
                      {item.times_worn}× Worn
                    </span>
                  )}
                </div>

                {/* Top Right Quick Action Pill */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDetailItem(item);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 dark:bg-[#202024]/95 text-[#52525B] dark:text-[#D4D4D8] hover:text-[#7C3AED] dark:hover:text-white flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer"
                  title="View Details"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & E-commerce Product Details */}
              <div className="p-3 sm:p-3.5 space-y-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#09090B] dark:text-white truncate capitalize tracking-tight">
                    {item.subcategory || item.category || 'Piece'}
                  </h4>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] truncate font-medium mt-0.5">
                    {[item.formality, item.fabric].filter(Boolean).join(' • ') || 'Wardrobe Essential'}
                  </p>
                </div>

                {/* Sleek E-commerce Attribute Tags */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {item.color && (
                    <span className="px-2 py-0.5 rounded-md bg-[#F5F3FF] dark:bg-[#1A162B] text-[#7C3AED] dark:text-[#C4B5FD] text-[10px] sm:text-[11px] font-semibold capitalize">
                      {item.color}
                    </span>
                  )}
                  {item.style && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FDF2F8] dark:bg-[#251420] text-[#EC4899] dark:text-[#F472B6] text-[10px] sm:text-[11px] font-semibold capitalize">
                      {item.style}
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Garment Details Modal */}
      {selectedDetailItem && (
        <GarmentDetailModal
          item={selectedDetailItem}
          allItems={items}
          onClose={() => setSelectedDetailItem(null)}
          onEdit={(it) => {
            setSelectedDetailItem(null);
            setEditingItem(it);
          }}
          onDelete={handleDelete}
          onToggleNeverWear={handleToggleNeverWear}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdate}
        />
      )}

    </div>
  );
}
