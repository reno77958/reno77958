import React, { useState, useEffect } from 'react';
import { Song } from './types/song';
import { useSongs } from './hooks/useSongs';
import { useFavorites } from './hooks/useFavorites';
import { useTheme } from './hooks/useTheme';
import { useAdminAuth } from './hooks/useAdminAuth';
import { Navbar } from './components/Navbar';
import { SongList } from './components/SongList';
import { SongViewer } from './components/SongViewer';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ChordDiagramModal } from './components/ChordDiagramModal';
import { Music2, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'admin'>('home');
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('Semua');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeModalChord, setActiveModalChord] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Default UI scale 80% as requested
  const [zoomScale, setZoomScale] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('chordjitu_zoom_scale');
      return stored ? parseFloat(stored) : 0.8;
    } catch {
      return 0.8;
    }
  });

  const { isDarkMode, toggleTheme } = useTheme();

  // Admin authentication (Restricted strictly to reno77958@gmail.com)
  const {
    isAdminAuthenticated,
    adminEmail,
    ownerEmail,
    login,
    logout,
    changePassword,
  } = useAdminAuth();

  // Apply zoom scale to body
  useEffect(() => {
    try {
      localStorage.setItem('chordjitu_zoom_scale', zoomScale.toString());
      document.body.style.zoom = zoomScale.toString();
    } catch (e) {
      console.error(e);
    }
  }, [zoomScale]);

  const toggleZoom = () => {
    setZoomScale(prev => (prev === 0.8 ? 1.0 : 0.8));
  };

  const {
    songs,
    addSong,
    updateSong,
    deleteSong,
    resetToDefaults,
    exportSongs,
    importSongs,
  } = useSongs();

  const {
    favorites,
    isFavorite,
    toggleFavorite,
    favoritesCount,
  } = useFavorites();

  const handleToggleFavoriteWithToast = (songId: string) => {
    const isCurrentlyFav = isFavorite(songId);
    toggleFavorite(songId);
    const targetSong = songs.find(s => s.id === songId);
    const title = targetSong?.title || 'Lagu';
    
    setToastMessage(isCurrentlyFav ? `"${title}" dihapus dari favorit` : `⭐ "${title}" disimpan ke favorit!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectSong = (song: Song) => {
    setActiveSong(song);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setActiveSong(null);
  };

  const handlePreviewSongFromAdmin = (song: Song) => {
    setCurrentView('home');
    setActiveSong(song);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectView = (view: 'home' | 'admin') => {
    if (view === 'admin') {
      if (!isAdminAuthenticated) {
        setIsLoginModalOpen(true);
        return;
      }
      setActiveSong(null);
      setCurrentView('admin');
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white' 
        : 'bg-slate-100/80 text-slate-800 selection:bg-sky-500 selection:text-white'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 border border-sky-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-150 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ChordJitu Navbar */}
      <Navbar
        currentView={currentView}
        favoritesCount={favoritesCount}
        showOnlyFavorites={showOnlyFavorites}
        isDarkMode={isDarkMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectView={handleSelectView}
        onToggleShowFavorites={() => {
          setShowOnlyFavorites(prev => !prev);
          setActiveSong(null);
        }}
        onToggleTheme={toggleTheme}
        onBackToHome={() => {
          setActiveSong(null);
          setShowOnlyFavorites(false);
          setSearchQuery('');
          setSelectedLetter('Semua');
        }}
        selectedLetter={selectedLetter}
        onSelectLetter={(letter) => {
          setSelectedLetter(letter);
          if (currentView !== 'home') setCurrentView('home');
          if (activeSong) setActiveSong(null);
        }}
        isAdminAuthenticated={isAdminAuthenticated}
        adminEmail={adminEmail}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        zoomScale={zoomScale}
        onToggleZoom={toggleZoom}
      />

      {/* Main Container */}
      <main className="flex-1">
        {currentView === 'admin' && isAdminAuthenticated ? (
          <AdminDashboard
            songs={songs}
            adminEmail={adminEmail}
            onLogout={() => {
              logout();
              setCurrentView('home');
              setToastMessage('Sesi admin telah ditutup.');
              setTimeout(() => setToastMessage(null), 2500);
            }}
            onChangePassword={changePassword}
            onAddSong={addSong}
            onUpdateSong={updateSong}
            onDeleteSong={(id) => {
              deleteSong(id);
              if (activeSong?.id === id) setActiveSong(null);
            }}
            onResetToDefaults={resetToDefaults}
            onExportSongs={exportSongs}
            onImportSongs={importSongs}
            onPreviewSong={handlePreviewSongFromAdmin}
            isDarkMode={isDarkMode}
          />
        ) : activeSong ? (
          <SongViewer
            song={activeSong}
            allSongs={songs}
            isFavorite={isFavorite(activeSong.id)}
            onToggleFavorite={() => handleToggleFavoriteWithToast(activeSong.id)}
            onBack={handleBackToCatalog}
            onSelectOtherSong={handleSelectSong}
            isDarkMode={isDarkMode}
          />
        ) : (
          <SongList
            songs={songs}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavoriteWithToast}
            onSelectSong={handleSelectSong}
            showOnlyFavorites={showOnlyFavorites}
            onToggleShowFavorites={() => setShowOnlyFavorites(prev => !prev)}
            isDarkMode={isDarkMode}
            searchQuery={searchQuery}
            selectedLetter={selectedLetter}
            onSelectLetter={setSelectedLetter}
            onOpenChordModal={(chord) => setActiveModalChord(chord)}
          />
        )}
      </main>

      {/* ChordJitu Footer */}
      <footer className={`border-t py-8 px-4 text-xs transition-colors mt-auto ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800 text-slate-400' 
          : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
              <Music2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-white">ChordJitu.com</span>
            <span>— Kunci Gitar Dasar & Lirik Lagu Populer Indonesia</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>Shortcut: <strong>Spasi</strong> (Auto-Scroll)</span>
            <span>•</span>
            <span><strong>+/-</strong> (Transpose Kunci)</span>
            <span>•</span>
            <button
              onClick={() => handleSelectView('admin')}
              className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              {isAdminAuthenticated ? 'Dashboard Admin (Aktif)' : 'Login Admin'}
            </button>
            <span>•</span>
            <button
              onClick={toggleZoom}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
            >
              Skala: {Math.round(zoomScale * 100)}%
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center text-[11px] text-slate-400">
          ChordJitu: Koleksi chord gitar mudah untuk pemula dan musisi. Dilengkapi fitur transpose otomatis, auto scroll, dan simpan lagu favorit tanpa login.
        </div>
      </footer>

      {/* Admin Login Modal (Restricted to reno77958@gmail.com) */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        ownerEmail={ownerEmail}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(emailInput, passwordInput) => {
          const res = login(emailInput, passwordInput);
          if (res.success) {
            setCurrentView('admin');
            setActiveSong(null);
            setToastMessage(`Selamat datang kembali, ${ownerEmail}!`);
            setTimeout(() => setToastMessage(null), 2500);
          }
          return res;
        }}
        isDarkMode={isDarkMode}
      />

      {/* Chord Diagram Popup */}
      <ChordDiagramModal
        chordName={activeModalChord}
        onClose={() => setActiveModalChord(null)}
      />
    </div>
  );
}
