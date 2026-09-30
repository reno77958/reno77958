import React from 'react';
import { ChordDiagram } from '../types/song';
import { getChordDiagram } from '../utils/chordTransposer';
import { X, Guitar } from 'lucide-react';

interface ChordDiagramModalProps {
  chordName: string | null;
  onClose: () => void;
}

export const ChordDiagramModal: React.FC<ChordDiagramModalProps> = ({ chordName, onClose }) => {
  if (!chordName) return null;

  const diagram: ChordDiagram | null = getChordDiagram(chordName);

  // SVG dimensions for 6 strings and 5 frets
  const width = 220;
  const height = 260;
  const paddingX = 35;
  const paddingTop = 50;
  const stringSpacing = (width - paddingX * 2) / 5;
  const fretSpacing = 35;
  const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-lg">
            <Guitar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Kunci Gitar: <span className="text-sky-600 dark:text-sky-400 font-mono">{chordName}</span>
            </h3>
            <p className="text-[11px] text-slate-500">Diagram senar 1 sampai 6</p>
          </div>
        </div>

        {diagram ? (
          <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <svg width={width} height={height} className="select-none">
              {/* Base Fret Label or Thick Nut */}
              {diagram.baseFret && diagram.baseFret > 1 ? (
                <text
                  x={paddingX - 18}
                  y={paddingTop + fretSpacing * 0.7}
                  fill="#64748b"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {diagram.baseFret}fr
                </text>
              ) : (
                <line
                  x1={paddingX}
                  y1={paddingTop}
                  x2={width - paddingX}
                  y2={paddingTop}
                  stroke="#0284c7"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              )}

              {/* Fret horizontal lines */}
              {[1, 2, 3, 4, 5].map((fret) => {
                const y = paddingTop + fret * fretSpacing;
                return (
                  <line
                    key={`fret-${fret}`}
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* String vertical lines */}
              {[0, 1, 2, 3, 4, 5].map((sIndex) => {
                const x = paddingX + sIndex * stringSpacing;
                return (
                  <line
                    key={`string-${sIndex}`}
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + 5 * fretSpacing}
                    stroke="#64748b"
                    strokeWidth={sIndex === 0 ? "2.2" : sIndex < 3 ? "1.8" : "1.2"}
                  />
                );
              })}

              {/* Barre if present */}
              {diagram.barres && diagram.barres.map((barreFret) => {
                const relativeFret = diagram.baseFret ? barreFret - diagram.baseFret + 1 : barreFret;
                if (relativeFret >= 1 && relativeFret <= 5) {
                  const y = paddingTop + (relativeFret - 0.5) * fretSpacing;
                  return (
                    <rect
                      key={`barre-${barreFret}`}
                      x={paddingX - 2}
                      y={y - 6}
                      width={width - paddingX * 2 + 4}
                      height={12}
                      rx="6"
                      fill="#0284c7"
                      opacity="0.85"
                    />
                  );
                }
                return null;
              })}

              {/* Finger dots & Mute / Open Marks */}
              {diagram.frets.map((fretVal, sIndex) => {
                const x = paddingX + sIndex * stringSpacing;
                
                if (fretVal === 'x') {
                  return (
                    <text
                      key={`m-${sIndex}`}
                      x={x}
                      y={paddingTop - 12}
                      fill="#ef4444"
                      fontSize="13"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      ✕
                    </text>
                  );
                } else if (fretVal === 0) {
                  return (
                    <circle
                      key={`m-${sIndex}`}
                      cx={x}
                      cy={paddingTop - 12}
                      r="4.5"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  );
                } else if (typeof fretVal === 'number') {
                  const relativeFret = diagram.baseFret ? fretVal - diagram.baseFret + 1 : fretVal;
                  if (relativeFret >= 1 && relativeFret <= 5) {
                    const y = paddingTop + (relativeFret - 0.5) * fretSpacing;
                    const finger = diagram.fingers ? diagram.fingers[sIndex] : 0;
                    return (
                      <g key={`dot-${sIndex}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r="8.5"
                          fill="#0284c7"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        {finger > 0 && (
                          <text
                            x={x}
                            y={y + 0.5}
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {finger}
                          </text>
                        )}
                      </g>
                    );
                  }
                }
                return null;
              })}

              {/* String Names */}
              {stringNames.map((name, sIndex) => {
                const x = paddingX + sIndex * stringSpacing;
                return (
                  <text
                    key={`l-${sIndex}`}
                    x={x}
                    y={paddingTop + 5 * fretSpacing + 18}
                    fill="#64748b"
                    fontSize="11"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {name}
                  </text>
                );
              })}
            </svg>

            <span className="text-[10px] text-slate-500 mt-1">
              ✕ = Jangan dipetik | ○ = Senar lepas | 1-4 = Jari
            </span>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl">
            Diagram chord {chordName} belum terdaftar secara visual.
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
