import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export function EditItemModal({ item, onClose, onSave }) {
  const [category, setCategory] = useState(item.category || '');
  const [subcategory, setSubcategory] = useState(item.subcategory || '');
  const [color, setColor] = useState(item.color || '');
  const [fabric, setFabric] = useState(item.fabric || '');
  const [style, setStyle] = useState(item.style || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(item.id, {
        category,
        subcategory,
        color,
        fabric,
        style,
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#0F0F12] rounded-3xl border border-[#E4E4E7] dark:border-[#27272A] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-[#71717A] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-serif-luxury text-xl font-bold text-[#09090B] dark:text-white mb-1">
          Edit Garment Details
        </h3>
        <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mb-5">
          Update wardrobe tags to refine AI compatibility matches.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-white"
            >
              <option value="tops">Tops / Shirts</option>
              <option value="bottoms">Bottoms / Pants</option>
              <option value="footwear">Footwear / Shoes</option>
              <option value="outerwear">Jackets / Outerwear</option>
              <option value="one_piece">Dresses / One Piece</option>
              <option value="Hijab">Hijab &amp; Modest Headwear</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">Subcategory</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Oxford Shirt, Chinos, Loafers"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Navy, Beige, Olive"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">Fabric</label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. Cotton, Linen, Wool"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#52525B] dark:text-[#A1A1AA] mb-1">Style Note</label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. Classic, Tailored, Casual"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-full border border-[#E4E4E7] dark:border-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:bg-[#FAF9FC] dark:hover:bg-[#18181B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
