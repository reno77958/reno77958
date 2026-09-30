import React from 'react';
import { Music2, Star, ShieldCheck, Home, Sun, Moon, Search, Flame, ZoomIn, ZoomOut, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'admin';
  favoritesCount: number;
  showOnlyFavorites: boolean;
  isDarkMode: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectView: (view: 'home' | 'admin') => void;
  onToggleShowFavorites: () => void;
  onToggleTheme: () => void;
  onBackToHome?: () => void;
  selectedLetter: string;
  onSelectLetter: (letter: string) => void;
  isAdminAuthenticated: boolean;
  adminEmail: string | null;
  onOpenLoginModal: () => void;
  zoomScale: number;
  onToggleZoom: () => void;
}

const ALPHABET = ['Semua', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  favoritesCount,
  showOnlyFavorites,
  isDarkMode,
  searchQuery,
  onSearchChange,
  onSelectView,
  onToggleShowFavorites,
  onToggleTheme,
  onBackToHome,
  selectedLetter,
  onSelectLetter,
  isAdminAuthenticated,
  adminEmail,
  onOpenLoginModal,
  zoomScale,
  onToggleZoom,
}) => {
  return (
    <header className={`sticky top-0 z-30 transition-colors shadow-sm ${
      isDarkMode 
        ? 'bg-slate-900 border-b border-slate-800 text-slate-100' 
        : 'bg-white border-b border-slate-200 text-slate-800'
    }`}>
      {/* Top Primary Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* ChordJitu Iconic Brand */}
          <div
            onClick={() => {
              if (onBackToHome) onBackToHome();
              onSelectView('home');
            }}
            className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30 group-hover:bg-sky-500 transition">
              <Music2 className="w-5 h-5 font-bold stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-sky-600 dark:text-sky-400">
                  Chord<span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Jitu</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-600/10 text-sky-600 dark:text-sky-400 border border-sky-600/20">
                  .com
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden md:block -mt-1 font-medium">
                Kunci Gitar Dasar & Lirik Lagu Indonesia
              </p>
            </div>
          </div>

          {/* Search Bar in Header */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari chord & lirik (misal: Peterpan, Dewa 19)..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? 'bg-slate-950 border border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Beranda */}
            <button
              onClick={() => {
                if (onBackToHome) onBackToHome();
                onSelectView('home');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                currentView === 'home' && !showOnlyFavorites
                  ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>

            {/* Favorit */}
            <button
              onClick={() => {
                if (currentView !== 'home') onSelectView('home');
                onToggleShowFavorites();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                showOnlyFavorites
                  ? 'bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Lagu Favorit Saya"
            >
              <Star className={`w-4 h-4 ${showOnlyFavorites ? 'fill-current' : favoritesCount > 0 ? 'text-amber-500 fill-amber-500' : ''}`} />
              <span className="hidden sm:inline">Favorit</span>
              {favoritesCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  showOnlyFavorites
                    ? 'bg-slate-900 text-amber-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                }`}>
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Admin (Protected Gate) */}
            {isAdminAuthenticated ? (
              <button
                onClick={() => onSelectView(currentView === 'admin' ? 'home' : 'admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                  currentView === 'admin'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
                title="Akun Admin: reno77958@gmail.com (Aktif)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title="Login Pemilik (reno77958@gmail.com)"
              >
                <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Admin</span>
              </button>
            )}

            {/* Zoom 80% / 100% Scale Switcher */}
            <button
              onClick={onToggleZoom}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                zoomScale === 0.8
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="Atur skala ukuran tampilan (80% / 100%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{Math.round(zoomScale * 100)}%</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg transition ${
                isDarkMode 
                  ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              title={isDarkMode ? 'Beralih ke Mode Terang (ChordJitu Classic)' : 'Beralih ke Mode Malam'}
              aria-label="Ubah tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 sm:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari chord & lirik lagu..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium ${
                isDarkMode
                  ? 'bg-slate-950 border border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Chordtela Alphabet Navigation Strip */}
      <div className={`border-t py-1.5 px-4 overflow-x-auto scrollbar-none text-xs font-bold transition-colors ${
        isDarkMode
          ? 'bg-slate-950/80 border-slate-800 text-slate-400'
          : 'bg-slate-50 border-slate-200/80 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center gap-1 min-w-max">
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 mr-2 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current" /> Artis A-Z:
          </span>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => onSelectLetter(letter)}
              className={`px-2 py-0.5 rounded transition ${
                selectedLetter === letter
                  ? 'bg-sky-600 text-white font-black shadow-sm'
                  : 'hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
