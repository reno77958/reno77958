import React, { useState, useMemo, useEffect } from 'react';
import { Song } from '../types/song';
import {
  transposeChord,
  transposeNote,
  isChord,
  isSectionHeader,
  isChordLine,
  calculateCapo,
} from '../utils/chordTransposer';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { AutoScrollFloatingBar } from './AutoScrollFloatingBar';
import { ChordDiagramModal } from './ChordDiagramModal';
import {
  Home,
  ChevronRight,
  Star,
  Plus,
  Minus,
  RotateCcw,
  Play,
  Pause,
  Copy,
  Check,
  Guitar,
  HelpCircle,
  Share2,
  TrendingUp,
} from 'lucide-react';

interface SongViewerProps {
  song: Song;
  allSongs: Song[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onSelectOtherSong: (song: Song) => void;
  isDarkMode: boolean;
}

export const SongViewer: React.FC<SongViewerProps> = ({
  song,
  allSongs,
  isFavorite,
  onToggleFavorite,
  onBack,
  onSelectOtherSong,
  isDarkMode,
}) => {
  const [transposeDelta, setTransposeDelta] = useState<number>(0);
  const [preferFlats, setPreferFlats] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [activeChordForModal, setActiveChordForModal] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Auto scroll hook
  const {
    isPlaying,
    speed,
    isAtBottom,
    setSpeed,
    togglePlay,
    scrollToTop,
  } = useAutoScroll();

  // Reset transpose on song change
  useEffect(() => {
    setTransposeDelta(0);
  }, [song.id]);

  // Spacebar toggle auto-scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  // Current transposed key
  const currentKey = useMemo(() => {
    return transposeNote(song.originalKey, transposeDelta, preferFlats);
  }, [song.originalKey, transposeDelta, preferFlats]);

  // Capo helper
  const capoInfo = useMemo(() => {
    return calculateCapo(song.originalKey, transposeDelta);
  }, [song.originalKey, transposeDelta]);

  // Unique chords in song
  const uniqueChords = useMemo(() => {
    const set = new Set<string>();
    const tokens = song.content.split(/[\s[\](),]+/);
    for (const t of tokens) {
      if (isChord(t)) {
        set.add(transposeChord(t, transposeDelta, preferFlats));
      }
    }
    return Array.from(set);
  }, [song.content, transposeDelta, preferFlats]);

  // Other songs by same artist or general suggestions
  const relatedSongs = useMemo(() => {
    const sameArtist = allSongs.filter(s => s.id !== song.id && s.artist.toLowerCase().includes(song.artist.toLowerCase()));
    if (sameArtist.length >= 3) return sameArtist.slice(0, 4);
    const others = allSongs.filter(s => s.id !== song.id);
    return [...sameArtist, ...others].slice(0, 5);
  }, [song, allSongs]);

  // Font styling
  const fontStyles = {
    sm: 'text-xs sm:text-sm leading-relaxed',
    base: 'text-sm sm:text-base leading-relaxed',
    lg: 'text-base sm:text-lg leading-loose',
    xl: 'text-lg sm:text-xl leading-loose',
  }[fontSize];

  // Copy with transposed chords
  const handleCopy = () => {
    const lines = song.content.split('\n');
    const transposedLines = lines.map(line => {
      if (isSectionHeader(line)) return line;
      if (isChordLine(line)) {
        const regex = /(\S+)/g;
        let res = '';
        let last = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(line)) !== null) {
          res += line.substring(last, match.index);
          res += isChord(match[0]) ? transposeChord(match[0], transposeDelta, preferFlats) : match[0];
          last = match.index + match[0].length;
        }
        res += line.substring(last);
        return res;
      }
      return line;
    });

    const fullText = `Kunci Gitar ${song.artist} - ${song.title} (Chord Dasar - ChordJitu)\nNada Dasar: ${currentKey} (Asli: ${song.originalKey})\n\n` + transposedLines.join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render chord line with ChordJitu blue styling
  const renderChordLine = (line: string, lineIndex: number) => {
    const tokens: React.ReactNode[] = [];
    const regex = /(\S+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      const whitespace = line.substring(lastIndex, match.index);
      if (whitespace) {
        tokens.push(
          <span key={`space-${lineIndex}-${lastIndex}`} className="whitespace-pre">
            {whitespace}
          </span>
        );
      }

      const word = match[0];
      if (isChord(word)) {
        const transposed = transposeChord(word, transposeDelta, preferFlats);
        tokens.push(
          <button
            key={`chord-${lineIndex}-${match.index}`}
            type="button"
            onClick={() => setActiveChordForModal(transposed)}
            className={`inline-block font-mono font-bold hover:underline cursor-pointer select-text px-0.5 ${
              isDarkMode
                ? 'text-sky-300 hover:text-sky-100'
                : 'text-sky-600 hover:text-sky-800'
            }`}
            title={`Lihat bentuk diagram ${transposed}`}
          >
            {transposed}
          </button>
        );
      } else {
        tokens.push(
          <span
            key={`word-${lineIndex}-${match.index}`}
            className={`font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}
          >
            {word}
          </span>
        );
      }

      lastIndex = match.index + word.length;
    }

    const trailing = line.substring(lastIndex);
    if (trailing) {
      tokens.push(
        <span key={`space-end-${lineIndex}`} className="whitespace-pre">
          {trailing}
        </span>
      );
    }

    return (
      <div
        key={`chord-row-${lineIndex}`}
        className={`overflow-x-auto whitespace-pre font-mono font-bold leading-normal ${
          isDarkMode ? 'text-sky-300' : 'text-sky-600'
        }`}
      >
        {tokens}
      </div>
    );
  };

  // Render inline bracket chords e.g. [C]
  const renderBracketLine = (line: string, lineIndex: number) => {
    const parts = line.split(/(\[[^\]]+\])/);

    return (
      <div key={`bracket-row-${lineIndex}`} className="my-1 whitespace-pre-wrap leading-loose">
        {parts.map((part, pIdx) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const raw = part.slice(1, -1);
            if (isChord(raw)) {
              const transposed = transposeChord(raw, transposeDelta, preferFlats);
              return (
                <button
                  key={`bc-${lineIndex}-${pIdx}`}
                  type="button"
                  onClick={() => setActiveChordForModal(transposed)}
                  className={`inline-block mx-0.5 font-mono font-bold hover:underline cursor-pointer ${
                    isDarkMode ? 'text-sky-300' : 'text-sky-600'
                  }`}
                  title={`Lihat chord ${transposed}`}
                >
                  [{transposed}]
                </button>
              );
            }
          }
          return (
            <span
              key={`bt-${lineIndex}-${pIdx}`}
              className={`font-sans font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-28">
      
      {/* ChordJitu Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 overflow-x-auto whitespace-nowrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-400 font-medium"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>{song.genre || 'Pop'}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-medium text-slate-700 dark:text-slate-300">{song.artist}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-sky-600 dark:text-sky-400 font-semibold truncate max-w-xs">{song.title}</span>
      </nav>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left / Center Article Body (8 cols) */}
        <div className="lg:col-span-8 space-y-3.5">
          
          {/* Article Header (Streamlined Compact Card) */}
          <div className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl border transition-colors shadow-sm ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    Chord Dasar
                  </span>
                  <h1 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                    {song.artist} - {song.title}
                  </h1>
                </div>
                
                {/* Meta details inline */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Nada Dasar: <strong className="font-mono font-bold text-sky-600 dark:text-sky-400">{song.originalKey}</strong></span>
                  <span>•</span>
                  <span>{song.genre || 'Pop'}</span>
                  {song.capo !== undefined && song.capo > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        Capo fret {song.capo}
                      </span>
                    </>
                  )}
                  {song.tempo && (
                    <>
                      <span>•</span>
                      <span>{song.tempo}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Favorite & Copy */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={onToggleFavorite}
                  className={`p-2 rounded-lg border transition ${
                    isFavorite
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border-amber-200 dark:border-amber-900'
                      : 'text-slate-400 hover:text-amber-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title={isFavorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  title="Salin lirik & chord"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Capo alert if transposed (Compact Ribbon) */}
            {capoInfo && (
              <div className="mt-2.5 py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>
                  <strong>Tips Capo Gitar:</strong> Pasang Capo di <strong>Fret {capoInfo.capoFret}</strong> dan mainkan bentuk kunci <strong>{capoInfo.playedKey}</strong> untuk nada {currentKey}.
                </span>
              </div>
            )}
          </div>

          {/* Iconic ChordJitu Interactive Control Box (Toolbar) */}
          <div className={`p-3 sm:p-3.5 rounded-xl border transition-colors shadow-sm ${
            isDarkMode 
              ? 'bg-slate-900/95 border-slate-800' 
              : 'bg-slate-50/90 border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
              
              {/* Transpose Stepper (- / +) */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Transpose:
                </span>
                
                <div className="flex items-center border rounded-lg overflow-hidden bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 shadow-sm">
                  <button
                    onClick={() => setTransposeDelta(prev => (prev <= -11 ? 11 : prev - 1))}
                    className="px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 font-black border-r border-slate-200 dark:border-slate-800 transition active:scale-95"
                    title="Turunkan 1 semitone (-)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="px-3 py-1 font-mono font-black text-center min-w-[65px] text-sky-700 dark:text-sky-300">
                    <span>{transposeDelta > 0 ? `+${transposeDelta}` : transposeDelta}</span>
                    <span className="text-[10px] block text-slate-500 dark:text-slate-400 font-sans font-semibold">
                      {transposeDelta === 0 ? 'Normal' : currentKey}
                    </span>
                  </div>

                  <button
                    onClick={() => setTransposeDelta(prev => (prev >= 11 ? -11 : prev + 1))}
                    className="px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 font-black border-l border-slate-200 dark:border-slate-800 transition active:scale-95"
                    title="Naikkan 1 semitone (+)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {transposeDelta !== 0 && (
                  <button
                    onClick={() => setTransposeDelta(0)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    title="Reset ke nada dasar asli"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Auto Scroll Quick Toggle */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={togglePlay}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition shadow-sm ${
                    isPlaying
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-sky-600 text-white hover:bg-sky-500'
                  }`}
                  title="Tekan Spasi untuk Putar/Jeda"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current animate-pulse" />
                      <span>Jeda Scroll</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Auto Scroll</span>
                    </>
                  )}
                </button>
              </div>

              {/* Accidental (# / b) */}
              <div className="flex items-center border rounded-lg overflow-hidden bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-[11px] font-bold">
                <button
                  onClick={() => setPreferFlats(false)}
                  className={`px-2 py-1 transition ${
                    !preferFlats
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  # (Kres)
                </button>
                <button
                  onClick={() => setPreferFlats(true)}
                  className={`px-2 py-1 transition ${
                    preferFlats
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  b (Mol)
                </button>
              </div>

              {/* Font Size Adjuster */}
              <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 px-1 font-bold">Font:</span>
                <button
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    fontSize === 'sm' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('base')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    fontSize === 'base' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    fontSize === 'lg' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  A+
                </button>
              </div>

            </div>
          </div>

          {/* Quick Chord Palette Bar */}
          {uniqueChords.length > 0 && (
            <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-wrap items-center gap-1.5 text-xs transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Guitar className="w-3.5 h-3.5 text-sky-600" />
                Chord Lagu:
              </span>
              {uniqueChords.map(chord => (
                <button
                  key={chord}
                  onClick={() => setActiveChordForModal(chord)}
                  className={`px-2 py-0.5 rounded font-mono font-bold transition border ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-sky-600 text-sky-400 hover:text-white border-slate-700'
                      : 'bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border-sky-200'
                  }`}
                  title={`Klik untuk melihat diagram chord ${chord}`}
                >
                  {chord}
                </button>
              ))}
              <span className="text-[10px] text-slate-400 ml-auto hidden sm:inline">
                *Klik chord untuk gambar kunci
              </span>
            </div>
          )}

          {/* The ChordJitu Lyrics & Chord Sheet Card with Pure White Lyrics in Darkmode */}
          <div className={`p-5 sm:p-8 rounded-xl border transition-colors shadow-sm ${fontStyles} font-mono select-text leading-relaxed ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 text-white' 
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {song.content.split('\n').map((line, idx) => {
              const trimmed = line.trim();

              if (!trimmed) {
                return <div key={`empty-${idx}`} className="h-3" />;
              }

              // Section Headers e.g. [Intro], [Bait 1], [Reff], [Chorus]
              if (isSectionHeader(trimmed)) {
                const transposedSec = trimmed.replace(
                  /([A-G][b#]?(?:m|maj|dim|aug|sus[24]?|add[249]|[0-9]+)*(?:\/[A-G][b#]?)?)/g,
                  (match) => (isChord(match) ? transposeChord(match, transposeDelta, preferFlats) : match)
                );

                return (
                  <div key={`section-${idx}`} className="my-3 pt-1">
                    <span
                      className={`font-sans font-bold text-xs uppercase px-2 py-0.5 rounded border ${
                        isDarkMode
                          ? 'bg-sky-950/80 text-sky-300 border-sky-800'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {transposedSec}
                    </span>
                  </div>
                );
              }

              // Bracket chords line
              if (line.includes('[') && line.includes(']')) {
                return renderBracketLine(line, idx);
              }

              // Pure chord line
              if (isChordLine(line)) {
                return renderChordLine(line, idx);
              }

              // Lyric line (Crisp white text in dark mode for maximum readability)
              return (
                <div
                  key={`lyric-${idx}`}
                  className={`my-0.5 font-sans font-semibold leading-relaxed tracking-wide ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Chord Lainnya / Terkait */}
          <div className={`rounded-xl border overflow-hidden shadow-sm ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="bg-sky-600 p-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Chord Populer Lainnya
                </h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 p-1">
              {relatedSongs.map((rSong, i) => (
                <div
                  key={`rel-${rSong.id}`}
                  onClick={() => onSelectOtherSong(rSong)}
                  className={`p-2.5 flex items-center gap-2.5 text-xs cursor-pointer rounded-lg transition ${
                    isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-sky-50/70'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate hover:text-sky-600">
                      {rSong.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {rSong.artist}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    Key {rSong.originalKey}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chordtela Capo Guide */}
          <div className={`rounded-xl border p-4 shadow-sm text-xs ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Guitar className="w-4 h-4 text-sky-600" />
              Panduan Capo Gitar
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Jika suara penyanyi terlalu tinggi atau rendah, gunakan tombol <strong>Transpose (+ / -)</strong> di atas. Aplikasi akan otomatis merekomendasikan letak fret Capo gitar agar kamu tetap bisa memetik bentuk chord yang mudah dihafal.
            </p>
          </div>

        </div>

      </div>

      {/* Floating Auto-Scroll Control Bar */}
      <AutoScrollFloatingBar
        isPlaying={isPlaying}
        speed={speed}
        onTogglePlay={togglePlay}
        onSetSpeed={setSpeed}
        onScrollToTop={scrollToTop}
        isAtBottom={isAtBottom}
      />

      {/* Chord Diagram Modal */}
      <ChordDiagramModal
        chordName={activeChordForModal}
        onClose={() => setActiveChordForModal(null)}
      />

    </div>
  );
};
