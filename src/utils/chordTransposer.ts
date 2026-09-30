import { ChordDiagram } from '../types/song';

export const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_TO_INDEX: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

// Regex for single chord e.g. "C#m7/G#" or "Bbmaj7"
const CHORD_REGEX = /^([A-G][b#]?)(m|min|maj|dim|aug|sus[24]?|add[249]|[-+°ø]|[0-9]+)*(?:\/([A-G][b#]?))?$/;

/**
 * Transpose a single note by semitones delta
 */
export function transposeNote(note: string, delta: number, preferFlats = false): string {
  const index = NOTE_TO_INDEX[note];
  if (index === undefined) return note;

  const newIndex = (index + delta % 12 + 12) % 12;
  return preferFlats ? CHROMATIC_FLAT[newIndex] : CHROMATIC_SHARP[newIndex];
}

/**
 * Transpose a single chord string (e.g., "Am", "F#m7", "D/F#")
 */
export function transposeChord(chord: string, delta: number, preferFlats = false): string {
  if (delta === 0) return chord;
  
  const match = chord.match(CHORD_REGEX);
  if (!match) return chord;

  const [, root, modifier = '', bass] = match;
  const newRoot = transposeNote(root, delta, preferFlats);
  const newBass = bass ? '/' + transposeNote(bass, delta, preferFlats) : '';

  return `${newRoot}${modifier}${newBass}`;
}

/**
 * Check if a word is likely a chord
 */
export function isChord(word: string): boolean {
  const clean = word.trim().replace(/[()[\]{},.:;]/g, '');
  if (!clean) return false;
  return CHORD_REGEX.test(clean);
}

/**
 * Check if a text is a section tag e.g. [Intro], [Chorus], [Reff], [Verse 1], [Outro]
 */
export function isSectionHeader(text: string): boolean {
  const clean = text.trim();
  const sectionKeywords = [
    'intro', 'verse', 'chorus', 'reff', 'refrain', 'bridge', 'interlude', 
    'outro', 'solo', 'pre-chorus', 'bait', 'ending', 'hook', 'coda'
  ];
  const withoutBrackets = clean.replace(/^[\[({]|[\])}]$/g, '').toLowerCase();
  
  return sectionKeywords.some(kw => withoutBrackets.startsWith(kw));
}

/**
 * Check if an entire line consists of chords and spacing
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isSectionHeader(trimmed)) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    if (isChord(token)) {
      chordCount++;
    } else if (token === '-' || token === '|' || token === '/' || token === '2x' || token === '4x') {
      // common musical bar separators
      chordCount++;
    }
  }

  // At least 70% of tokens should be chords
  return chordCount / tokens.length >= 0.7;
}

/**
 * Transpose a chord line while maintaining column spacing
 */
export function transposeLineOfChords(line: string, delta: number, preferFlats = false): string {
  if (delta === 0) return line;

  // Match words and their positions
  const regex = /(\S+)/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const spaces = line.substring(lastIndex, match.index);
    const word = match[0];
    let transposed = word;

    if (isChord(word)) {
      transposed = transposeChord(word, delta, preferFlats);
    } else if (word.startsWith('[') && word.endsWith(']')) {
      const inner = word.slice(1, -1);
      if (isChord(inner)) {
        transposed = `[${transposeChord(inner, delta, preferFlats)}]`;
      }
    }

    result += spaces + transposed;
    lastIndex = match.index + word.length;
  }

  result += line.substring(lastIndex);
  return result;
}

/**
 * Transpose inline chords in brackets: "[C]Kutuliskan [G]kenangan"
 */
export function transposeInlineBracketChords(line: string, delta: number, preferFlats = false): string {
  if (delta === 0) return line;

  return line.replace(/\[([A-G][b#]?[^\]]*)\]/g, (match, inner) => {
    if (isChord(inner)) {
      return `[${transposeChord(inner, delta, preferFlats)}]`;
    }
    return match;
  });
}

/**
 * Transpose entire song content
 */
export function transposeSongContent(content: string, delta: number, preferFlats = false): string {
  if (delta === 0) return content;

  const lines = content.split('\n');
  const transposedLines = lines.map(line => {
    if (isSectionHeader(line)) {
      // Might contain chords in section e.g. [Intro: C G Am F]
      return line.replace(/([A-G][b#]?(?:m|maj|dim|aug|sus[24]?|add[249]|[0-9]+)*(?:\/[A-G][b#]?)?)/g, (match) => {
        if (isChord(match)) {
          return transposeChord(match, delta, preferFlats);
        }
        return match;
      });
    }

    if (line.includes('[') && line.includes(']')) {
      return transposeInlineBracketChords(line, delta, preferFlats);
    }

    if (isChordLine(line)) {
      return transposeLineOfChords(line, delta, preferFlats);
    }

    return line;
  });

  return transposedLines.join('\n');
}

/**
 * Calculate capo suggestion
 * e.g., Target key is D, but user plays in C with Capo on fret 2
 */
export function calculateCapo(originalKey: string, currentDelta: number): { capoFret: number; playedKey: string } | null {
  if (currentDelta === 0) return null;
  const normalizedDelta = (currentDelta % 12 + 12) % 12;
  if (normalizedDelta === 0) return null;

  // Capo fret corresponds to positive semitone transpose
  const capoFret = normalizedDelta;
  return {
    capoFret,
    playedKey: originalKey,
  };
}

/**
 * Comprehensive standard guitar chord diagrams (6 strings: E A D G B e)
 * 'x' = muted, 0 = open string, 1+ = fret number
 */
export const GUITAR_CHORD_DIAGRAMS: Record<string, ChordDiagram> = {
  // Majors
  'C': { name: 'C', frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  'D': { name: 'D', frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
  'E': { name: 'E', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
  'F': { name: 'F', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barres: [1] },
  'G': { name: 'G', frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4], baseFret: 1 },
  'A': { name: 'A', frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  'B': { name: 'B', frets: ['x', 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barres: [2] },
  
  // Sharps / Flats Majors
  'C#': { name: 'C#', frets: ['x', 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [4] },
  'Db': { name: 'Db', frets: ['x', 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1], baseFret: 4, barres: [4] },
  'D#': { name: 'D#', frets: ['x', 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barres: [6] },
  'Eb': { name: 'Eb', frets: ['x', 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6, barres: [6] },
  'F#': { name: 'F#', frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2] },
  'Gb': { name: 'Gb', frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barres: [2] },
  'G#': { name: 'G#', frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [4] },
  'Ab': { name: 'Ab', frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [4] },
  'A#': { name: 'A#', frets: ['x', 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1] },
  'Bb': { name: 'Bb', frets: ['x', 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [1] },

  // Minors
  'Cm': { name: 'Cm', frets: ['x', 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [3] },
  'Dm': { name: 'Dm', frets: ['x', 'x', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
  'Em': { name: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },
  'Fm': { name: 'Fm', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barres: [1] },
  'Gm': { name: 'Gm', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [3] },
  'Am': { name: 'Am', frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
  'Bm': { name: 'Bm', frets: ['x', 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barres: [2] },
  'C#m': { name: 'C#m', frets: ['x', 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [4] },
  'D#m': { name: 'D#m', frets: ['x', 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barres: [6] },
  'Ebm': { name: 'Ebm', frets: ['x', 6, 8, 8, 7, 6], fingers: [0, 1, 3, 4, 2, 1], baseFret: 6, barres: [6] },
  'F#m': { name: 'F#m', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barres: [2] },
  'G#m': { name: 'G#m', frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [4] },
  'Bbm': { name: 'Bbm', frets: ['x', 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barres: [1] },

  // 7th chords
  'C7': { name: 'C7', frets: ['x', 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
  'D7': { name: 'D7', frets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
  'E7': { name: 'E7', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  'G7': { name: 'G7', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  'A7': { name: 'A7', frets: ['x', 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], baseFret: 1 },
  'B7': { name: 'B7', frets: ['x', 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], baseFret: 1 },
  'Am7': { name: 'Am7', frets: ['x', 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], baseFret: 1 },
  'Dm7': { name: 'Dm7', frets: ['x', 'x', 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], baseFret: 1, barres: [1] },
  'Em7': { name: 'Em7', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 1, 0, 0, 0, 0], baseFret: 1 },

  // Common additions
  'Cadd9': { name: 'Cadd9', frets: ['x', 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4], baseFret: 1 },
  'Dsus4': { name: 'Dsus4', frets: ['x', 'x', 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 4], baseFret: 1 },
  'Asus4': { name: 'Asus4', frets: ['x', 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },
  'Gsus4': { name: 'Gsus4', frets: [3, 3, 0, 0, 1, 3], fingers: [3, 4, 0, 0, 1, 4], baseFret: 1 },
};

/**
 * Get chord diagram or a fallback based on root
 */
export function getChordDiagram(chordName: string): ChordDiagram | null {
  // Direct match
  if (GUITAR_CHORD_DIAGRAMS[chordName]) {
    return GUITAR_CHORD_DIAGRAMS[chordName];
  }

  // Strip bass note e.g. D/F# -> D
  const strippedBass = chordName.split('/')[0];
  if (GUITAR_CHORD_DIAGRAMS[strippedBass]) {
    return GUITAR_CHORD_DIAGRAMS[strippedBass];
  }

  // Strip minor/major extensions if needed
  const match = strippedBass.match(/^([A-G][b#]?)(m)?/);
  if (match) {
    const simplified = match[1] + (match[2] || '');
    if (GUITAR_CHORD_DIAGRAMS[simplified]) {
      return GUITAR_CHORD_DIAGRAMS[simplified];
    }
  }

  return null;
}
