export type Genre = 'Pop' | 'Rock' | 'Akustik' | 'Dangdut' | 'Indie' | 'Mancanegara' | 'Religi';

export type Difficulty = 'Mudah' | 'Menengah' | 'Mahir';

export interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string; // e.g. "C", "G", "Am"
  genre: Genre | string;
  difficulty?: Difficulty;
  tempo?: string; // e.g. "72 BPM"
  capo?: number; // e.g. 0, 1, 2
  content: string; // The lyrics and chords
  isCustom?: boolean; // added by admin
  createdAt?: string;
  updatedAt?: string;
}

export interface ChordDiagram {
  name: string;
  frets: (number | 'x')[]; // 6 strings from low E (6th) to high E (1st), e.g. ['x', 3, 2, 0, 1, 0] for C
  fingers?: (number | 0)[]; // finger 1 (index) to 4 (pinky)
  baseFret?: number; // default 1
  barres?: number[]; // fret that has a barre
}
