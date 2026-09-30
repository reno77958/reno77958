import React, { useMemo } from 'react';
import { Song } from '../types/song';
import {
  Star,
  Music2,
  TrendingUp,
  Guitar,
  Sparkles,
  ChevronRight,
  BookmarkCheck,
  HelpCircle,
  Hash,
} from 'lucide-react';

interface SongListProps {
  songs: Song[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onSelectSong: (song: Song) => void;
  showOnlyFavorites: boolean;
  onToggleShowFavorites: () => void;
  isDarkMode: boolean;
  searchQuery: string;
  selectedLetter: string;
  onSelectLetter: (letter: string) => void;
  onOpenChordModal: (chord: string) => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  isFavorite,
  onToggleFavorite,
  onSelectSong,
  showOnlyFavorites,
  onToggleShowFavorites,
  isDarkMode,
  searchQuery,
  selectedLetter,
  onSelectLetter,
  onOpenChordModal,
}) => {
  const [selectedGenre, setSelectedGenre] = React.useState<string>('Semua');

  // Genres list
  const genres = useMemo(() => {
    const list = new Set<string>();
    songs.forEach(s => {
      if (s.genre) list.add(s.genre);
    });
    return ['Semua', ...Array.from(list)];
  }, [songs]);

  // Filter songs
  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      // Favorite filter
      if (showOnlyFavorites && !isFavorite(song.id)) {
        return false;
      }

      // Genre filter
      if (selectedGenre !== 'Semua' && song.genre !== selectedGenre) {
        return false;
      }

      // Alphabet filter
      if (selectedLetter !== 'Semua') {
        const firstLetter = (song.artist || song.title).trim().charAt(0).toUpperCase();
        if (firstLetter !== selectedLetter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = song.title.toLowerCase().includes(q);
        const matchArtist = song.artist.toLowerCase().includes(q);
        const matchContent = song.content.toLowerCase().includes(q);
        return matchTitle || matchArtist || matchContent;
      }

      return true;
    });
  }, [songs, showOnlyFavorites, isFavorite, selectedGenre, selectedLetter, searchQuery]);

  // Top popular songs (for Chordtela right sidebar)
  const popularSongs = useMemo(() => {
    return songs.slice(0, 6);
  }, [songs]);

  // Basic guitar chords list for Chordtela sidebar widget
  const basicChords = ['C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* ChordJitu Notice / Announcement Banner */}
      <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        isDarkMode 
          ? 'bg-sky-950/30 border-sky-900/60 text-sky-200' 
          : 'bg-sky-50 border-sky-200 text-sky-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="p-1 rounded bg-sky-600 text-white font-bold text-[10px] uppercase">
            Chord Dasar
          </span>
          <span className="font-semibold">
            Selamat datang di <strong>ChordJitu</strong> — Kumpulan kunci gitar dasar & lirik lagu mudah dimainkan!
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>✓ Transpose (+/-)</span>
          <span>✓ Auto-Scroll</span>
          <span>✓ Tanpa Login</span>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Song List (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Genre Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedGenre === genre
                    ? 'bg-sky-600 text-white shadow-sm'
                    : isDarkMode
                      ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Section Heading Bar */}
          <div className={`p-3.5 rounded-t-xl border-b-2 border-sky-600 flex items-center justify-between ${
            isDarkMode ? 'bg-slate-900' : 'bg-white'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-800 dark:text-white">
                {showOnlyFavorites
                  ? 'Daftar Lagu Favorit Tersimpan'
                  : searchQuery
                    ? `Hasil Pencarian: "${searchQuery}"`
                    : selectedLetter !== 'Semua'
                      ? `Kunci Gitar Artis Huruf [${selectedLetter}]`
                      : 'Chord Gitar Terbaru & Paling Dicari'}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {filteredSongs.length} Lagu
            </span>
          </div>

          {/* Song Rows (Chordtela signature list item format) */}
          {filteredSongs.length > 0 ? (
            <div className={`divide-y rounded-b-xl border transition-colors shadow-sm overflow-hidden ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 divide-slate-800' 
                : 'bg-white border-slate-200 divide-slate-100'
            }`}>
              {filteredSongs.map((song, index) => {
                const fav = isFavorite(song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => onSelectSong(song)}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition group ${
                      isDarkMode 
                        ? 'hover:bg-slate-800/60' 
                        : 'hover:bg-sky-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Number or Icon */}
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition ${
                        isDarkMode
                          ? 'bg-slate-800 text-sky-400 group-hover:bg-sky-600 group-hover:text-white'
                          : 'bg-slate-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white'
                      }`}>
                        {index + 1}
                      </span>

                      {/* Song Title and Artist */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition truncate">
                            {song.artist} - {song.title}
                          </h3>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                            Chord Dasar
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>Key: <strong className="text-sky-600 dark:text-sky-400 font-mono">{song.originalKey}</strong></span>
                          <span>•</span>
                          <span>{song.genre || 'Pop'}</span>
                          {song.capo !== undefined && song.capo > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400">Capo fret {song.capo}</span>
                            </>
                          )}
                          {song.isCustom && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-500 font-semibold">Admin</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Favorite Star and Arrow */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(song.id);
                        }}
                        className={`p-2 rounded-lg transition ${
                          fav
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={fav ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                      >
                        <Star className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition hidden sm:block" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`p-8 rounded-xl border text-center ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <Music2 className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                {showOnlyFavorites ? 'Belum Ada Lagu Favorit' : 'Lagu Tidak Ditemukan'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {showOnlyFavorites
                  ? 'Klik ikon bintang ⭐ pada lagu yang ingin Anda simpan untuk memainkannya nanti.'
                  : `Tidak ada lagu dengan kata kunci atau filter saat ini.`}
              </p>
              {showOnlyFavorites ? (
                <button
                  onClick={onToggleShowFavorites}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Tampilkan Semua Lagu
                </button>
              ) : (
                <button
                  onClick={() => onSelectLetter('Semua')}
                  className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Chordtela Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Chord Populer Minggu Ini */}
          <div className={`rounded-xl border overflow-hidden shadow-sm ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="bg-sky-600 p-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Chord Populer
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                TOP HITS
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 p-1">
              {popularSongs.map((song, i) => (
                <div
                  key={`pop-${song.id}`}
                  onClick={() => onSelectSong(song)}
                  className={`p-2.5 flex items-center gap-2.5 text-xs cursor-pointer rounded-lg transition ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-sky-50/70'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate hover:text-sky-600">
                      {song.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {song.artist}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    Key {song.originalKey}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Kunci Gitar Dasar (Click for Diagram) */}
          <div className={`rounded-xl border p-4 shadow-sm ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Guitar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Bentuk Kunci Gitar Dasar
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Klik chord di bawah untuk melihat diagram penempatan jari:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {basicChords.map(chord => (
                <button
                  key={chord}
                  onClick={() => onOpenChordModal(chord)}
                  className={`py-2 px-2 text-center rounded-lg font-mono font-bold text-xs transition border ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-sky-600 text-sky-300 hover:text-white border-slate-700'
                      : 'bg-slate-50 hover:bg-sky-600 text-sky-700 hover:text-white border-slate-200'
                  }`}
                >
                  {chord}
                </button>
              ))}
            </div>
          </div>

          {/* Widget 3: Tips Bermain & Capo Gitar */}
          <div className={`rounded-xl border p-4 shadow-sm text-xs ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-wider text-[11px]">
                Tips Transpose & Capo
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Gunakan tombol <strong>+ (naik)</strong> dan <strong>- (turun)</strong> di halaman chord untuk menyesuaikan jangkauan vokalmu. Aktifkan <strong>Auto-Scroll</strong> agar tidak perlu menggeser layar saat kedua tangan sedang memetik gitar!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
