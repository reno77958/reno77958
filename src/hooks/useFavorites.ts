import { useState, useEffect } from 'react';

const FAVORITES_STORAGE_KEY = 'chordmaster_favorites_v1';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  const toggleFavorite = (songId: string) => {
    setFavorites(prev => {
      if (prev.includes(songId)) {
        return prev.filter(id => id !== songId);
      } else {
        return [...prev, songId];
      }
    });
  };

  const isFavorite = (songId: string) => favorites.includes(songId);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    favoritesCount: favorites.length,
  };
}
