import React, { useState } from 'react';
import { Play, Pause, ArrowUp, ChevronDown, ChevronUp, Gauge } from 'lucide-react';

interface AutoScrollFloatingBarProps {
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onScrollToTop: () => void;
  isAtBottom?: boolean;
}

export const AutoScrollFloatingBar: React.FC<AutoScrollFloatingBarProps> = ({
  isPlaying,
  speed,
  onTogglePlay,
  onSetSpeed,
  onScrollToTop,
  isAtBottom,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-500 transition text-xs font-bold"
          title="Buka Kontrol Auto Scroll"
        >
          <ChevronUp className="w-4 h-4" />
          <span>Auto Scroll ({isPlaying ? 'Aktif' : 'Off'})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-md">
      <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center justify-between gap-2 text-white">
        
        {/* Play/Pause Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow-sm ${
              isPlaying
                ? 'bg-amber-500 text-white hover:bg-amber-400 ring-2 ring-amber-400/40'
                : 'bg-sky-600 text-white hover:bg-sky-500'
            }`}
            title="Shortcut: Tekan Spasi"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Auto Scroll</span>
              </>
            )}
          </button>

          {isAtBottom && (
            <span className="text-[10px] text-amber-400 font-semibold hidden sm:inline">
              Akhir lagu
            </span>
          )}
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400">Kec:</span>

          <button
            onClick={() => onSetSpeed(Math.max(1, speed - 1))}
            disabled={speed <= 1}
            className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
          >
            -
          </button>

          <span className="w-5 text-center font-mono font-bold text-sky-400 text-xs">
            {speed}
          </span>

          <button
            onClick={() => onSetSpeed(Math.min(8, speed + 1))}
            disabled={speed >= 8}
            className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
          >
            +
          </button>
        </div>

        {/* Actions: Scroll To Top & Minimize */}
        <div className="flex items-center gap-1">
          <button
            onClick={onScrollToTop}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Kembali ke atas"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Sembunyikan"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
