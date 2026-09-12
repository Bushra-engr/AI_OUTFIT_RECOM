import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 1. WARDROBE
export async function uploadGarment(file) {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/wardrobe/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function getWardrobe(category = null) {
  const headers = await getAuthHeaders();
  const url = category ? `${BASE_URL}/wardrobe/?category=${encodeURIComponent(category)}` : `${BASE_URL}/wardrobe/`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error('Failed to fetch wardrobe');
  }
  return res.json();
}

export async function updateGarment(id, updates) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/wardrobe/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update garment');
  return res.json();
}

export async function deleteGarment(id) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/wardrobe/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete garment');
  return res.json();
}

// 2. LIVE WEATHER
export async function fetchWeather(city = 'Noida') {
  const res = await fetch(`${BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error('Failed to fetch live weather');
  const data = await res.json();
  return data.weather;
}

// 3. RECOMMENDATIONS
export async function recommendOutfits({ occasion, city, skin_undertone, include_hijab }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/recommend/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({
      occasion: occasion || 'casual',
      city: city || 'Noida',
      skin_undertone: skin_undertone || 'neutral',
      include_hijab: Boolean(include_hijab),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Styling failed' }));
    throw new Error(err.detail || 'Styling failed');
  }
  return res.json();
}

// 4. OUTFIT SAVING & HISTORY
export async function saveOutfit(outfitData) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/outfit/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(outfitData),
  });
  if (!res.ok) throw new Error('Failed to save outfit');
  return res.json();
}

export async function getOutfitHistory() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/outfit/history`, { headers });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error('Failed to fetch history');
  }
  return res.json();
}

export async function deleteOutfitHistory(historyId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/outfit/history/${historyId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete history');
  return res.json();
}

export async function updateOutfitKept(historyId, kept) {
  const { data, error } = await supabase
    .from('outfit_history')
    .update({ kept })
    .eq('id', historyId)
    .select();
  if (error) throw new Error(error.message);
  return data?.[0];
}

export async function submitFeedback({ item_id, outfit_id, rating, liked, never_wear }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/outfit/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ item_id, outfit_id, rating, liked, never_wear }),
  });
  if (!res.ok) throw new Error('Feedback submission failed');
  return res.json();
}

// 5. USER PROFILE
export async function getProfile() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/profile/`, { headers });
  if (!res.ok) return null;
  return res.json();
}

export async function saveProfile(profileData, isExisting = false) {
  const headers = await getAuthHeaders();
  const method = isExisting ? 'PATCH' : 'POST';
  const res = await fetch(`${BASE_URL}/profile/`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error('Failed to save profile');
  return res.json();
}

// 6. PINTEREST FLAT-LAY COMPOSITE COLLAGE
export async function createOutfitCollage(items) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/outfit/collage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Flat-Lay collage generation failed' }));
    throw new Error(err.detail || 'Flat-Lay collage generation failed');
  }
  return res.json();
}
