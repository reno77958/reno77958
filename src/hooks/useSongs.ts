import { useState, useEffect } from 'react';
import { Song } from '../types/song';
import { DEFAULT_SONGS } from '../data/defaultSongs';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

const CUSTOM_SONGS_STORAGE_KEY = 'chordjitu_custom_songs_v2';

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_SONGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SONGS;
    } catch {
      return DEFAULT_SONGS;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with Firestore in real-time
  useEffect(() => {
    const songsCol = collection(db, 'songs');

    // Subscribe to real-time updates from Firestore
    const unsubscribe = onSnapshot(
      songsCol,
      async (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, seed with initial default songs
          try {
            for (const song of DEFAULT_SONGS) {
              await setDoc(doc(db, 'songs', song.id), song);
            }
          } catch (seedErr) {
            console.warn('Initial seeding fallback to local defaults:', seedErr);
          }
          setSongs(DEFAULT_SONGS);
        } else {
          const remoteSongs: Song[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Song;
            remoteSongs.push({
              ...data,
              id: docSnap.id,
            });
          });
          setSongs(remoteSongs);
          try {
            localStorage.setItem(CUSTOM_SONGS_STORAGE_KEY, JSON.stringify(remoteSongs));
          } catch (e) {
            console.error(e);
          }
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn('Firestore offline / reading from cache:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addSong = (newSongData: Omit<Song, 'id'>): Song => {
    const slug = newSongData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const newSong: Song = {
      ...newSongData,
      id: `song-${Date.now()}-${slug}`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic local update
    setSongs((prev) => [newSong, ...prev.filter((s) => s.id !== newSong.id)]);

    // Write to Firestore cloud database
    const docRef = doc(db, 'songs', newSong.id);
    setDoc(docRef, newSong).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `songs/${newSong.id}`);
    });

    return newSong;
  };

  const updateSong = (id: string, updatedData: Partial<Song>) => {
    setSongs((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx >= 0) {
        const updated = [...prev];
        const merged: Song = {
          ...updated[idx],
          ...updatedData,
          updatedAt: new Date().toISOString(),
        };
        updated[idx] = merged;

        // Persist to Firestore
        const docRef = doc(db, 'songs', id);
        setDoc(docRef, merged, { merge: true }).catch((err) => {
          handleFirestoreError(err, OperationType.UPDATE, `songs/${id}`);
        });

        return updated;
      }
      return prev;
    });
  };

  const deleteSong = (id: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== id));

    // Delete from Firestore
    const docRef = doc(db, 'songs', id);
    deleteDoc(docRef).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `songs/${id}`);
    });
  };

  const resetToDefaults = async () => {
    setSongs(DEFAULT_SONGS);
    try {
      localStorage.setItem(CUSTOM_SONGS_STORAGE_KEY, JSON.stringify(DEFAULT_SONGS));
      for (const song of DEFAULT_SONGS) {
        await setDoc(doc(db, 'songs', song.id), song);
      }
    } catch (e) {
      console.error('Failed to reset songs in Firestore:', e);
    }
  };

  const exportSongs = () => {
    return JSON.stringify(songs, null, 2);
  };

  const importSongs = async (jsonContent: string): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!Array.isArray(parsed)) {
        return { success: false, error: 'Format JSON harus berupa daftar lagu (array)' };
      }

      const validSongs: Song[] = parsed
        .filter((s) => s && s.title && s.artist && s.content)
        .map((s) => ({
          ...s,
          id: s.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          isCustom: true,
        }));

      if (validSongs.length === 0) {
        return { success: false, error: 'Tidak ada lagu valid yang ditemukan' };
      }

      for (const song of validSongs) {
        await setDoc(doc(db, 'songs', song.id), song);
      }

      return { success: true, count: validSongs.length };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal membaca format JSON' };
    }
  };

  return {
    songs,
    isLoading,
    addSong,
    updateSong,
    deleteSong,
    resetToDefaults,
    exportSongs,
    importSongs,
  };
}
