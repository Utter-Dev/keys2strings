export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export type NoteName = typeof NOTE_NAMES[number];

// Standard guitar tuning: E2, A2, D3, G3, B3, E4 (MIDI note numbers)
export const GUITAR_TUNING = [40, 45, 50, 55, 59, 64]; // low E to high E
export const GUITAR_STRING_NAMES = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
export const FRET_COUNT = 15;

// Piano range: A0 (21) to C8 (108)
export const PIANO_START = 36; // C2
export const PIANO_END = 84;   // C6 (4 octaves, practical range)

export interface NotePosition {
  midi: number;
  name: string;
  octave: number;
  semitone: number; // 0-11
}

export interface GuitarPosition {
  string: number; // 0-5 (low E = 0)
  fret: number;   // 0-14
  midi: number;
}

export interface ChordShape {
  name: string;
  notes: number[]; // semitone classes (0-11)
  guitarPositions: GuitarPosition[];
}

export function midiToNote(midi: number): NotePosition {
  const semitone = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { midi, name: NOTE_NAMES[semitone], octave, semitone };
}

export function noteToDisplay(midi: number): string {
  const note = midiToNote(midi);
  return `${note.name}${note.octave}`;
}

export function getGuitarMidi(string: number, fret: number): number {
  return GUITAR_TUNING[string] + fret;
}

export function findGuitarPositions(midi: number): GuitarPosition[] {
  const positions: GuitarPosition[] = [];
  for (let s = 0; s < 6; s++) {
    const fret = midi - GUITAR_TUNING[s];
    if (fret >= 0 && fret <= FRET_COUNT) {
      positions.push({ string: s, fret, midi });
    }
  }
  return positions;
}

export function findAllGuitarPositionsForSemitone(semitone: number): GuitarPosition[] {
  const positions: GuitarPosition[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= FRET_COUNT; f++) {
      const m = GUITAR_TUNING[s] + f;
      if (m % 12 === semitone) {
        positions.push({ string: s, fret: f, midi: m });
      }
    }
  }
  return positions;
}

export function findPianoKeysForSemitone(semitone: number): number[] {
  const keys: number[] = [];
  for (let m = PIANO_START; m <= PIANO_END; m++) {
    if (m % 12 === semitone) keys.push(m);
  }
  return keys;
}

export function isBlackKey(midi: number): boolean {
  const s = midi % 12;
  return [1, 3, 6, 8, 10].includes(s);
}

// Common chord definitions (intervals from root as semitones)
export const CHORD_TYPES: Record<string, { label: string; intervals: number[] }> = {
  major:    { label: 'Major',     intervals: [0, 4, 7] },
  minor:    { label: 'Minor',     intervals: [0, 3, 7] },
  dom7:     { label: '7',         intervals: [0, 4, 7, 10] },
  maj7:     { label: 'Maj7',      intervals: [0, 4, 7, 11] },
  min7:     { label: 'm7',        intervals: [0, 3, 7, 10] },
  dim:      { label: 'dim',       intervals: [0, 3, 6] },
  aug:      { label: 'aug',       intervals: [0, 4, 8] },
  sus2:     { label: 'sus2',      intervals: [0, 2, 7] },
  sus4:     { label: 'sus4',      intervals: [0, 5, 7] },
  power:    { label: '5 (Power)', intervals: [0, 7] },
};

export function getChordNotes(rootSemitone: number, intervals: number[]): number[] {
  return intervals.map(i => (rootSemitone + i) % 12);
}

// ── Standard guitar chord shapes ──
// Fret per string [lowE, A, D, G, B, highE], -1 = muted
// Semitones: C=0 C#=1 D=2 D#=3 E=4 F=5 F#=6 G=7 G#=8 A=9 A#=10 B=11

const STANDARD_CHORDS: Record<string, number[]> = {
  // ── Major ──
  '0-major':  [-1, 3, 2, 0, 1, 0],   // C
  '1-major':  [-1, 4, 3, 1, 2, 1],   // C# (A-shape barre 4)
  '2-major':  [-1, -1, 0, 2, 3, 2],  // D
  '3-major':  [-1, 6, 5, 3, 4, 3],   // Eb (A-shape barre 6)
  '4-major':  [0, 2, 2, 1, 0, 0],    // E
  '5-major':  [1, 3, 3, 2, 1, 1],    // F (E-shape barre 1)
  '6-major':  [2, 4, 4, 3, 2, 2],    // F# (E-shape barre 2)
  '7-major':  [3, 2, 0, 0, 0, 3],    // G
  '8-major':  [4, 6, 6, 5, 4, 4],    // Ab (E-shape barre 4)
  '9-major':  [-1, 0, 2, 2, 2, 0],   // A
  '10-major': [-1, 1, 3, 3, 3, 1],   // Bb (A-shape barre 1)
  '11-major': [-1, 2, 4, 4, 4, 2],   // B (A-shape barre 2)

  // ── Minor ──
  '0-minor':  [-1, 3, 5, 5, 4, 3],   // Cm (A-shape barre 3)
  '1-minor':  [-1, 4, 6, 6, 5, 4],   // C#m (A-shape barre 4)
  '2-minor':  [-1, -1, 0, 2, 3, 1],  // Dm
  '3-minor':  [-1, 6, 8, 8, 7, 6],   // Ebm (A-shape barre 6)
  '4-minor':  [0, 2, 2, 0, 0, 0],    // Em
  '5-minor':  [1, 3, 3, 1, 1, 1],    // Fm (E-shape barre 1)
  '6-minor':  [2, 4, 4, 2, 2, 2],    // F#m (E-shape barre 2)
  '7-minor':  [3, 5, 5, 3, 3, 3],    // Gm (E-shape barre 3)
  '8-minor':  [4, 6, 6, 4, 4, 4],    // G#m (E-shape barre 4)
  '9-minor':  [-1, 0, 2, 2, 1, 0],   // Am
  '10-minor': [-1, 1, 3, 3, 2, 1],   // Bbm (A-shape barre 1)
  '11-minor': [-1, 2, 4, 4, 3, 2],   // Bm (A-shape barre 2)

  // ── Dominant 7 ──
  '0-dom7':   [-1, 3, 2, 3, 1, 0],   // C7
  '1-dom7':   [-1, 4, 3, 4, 2, 1],   // C#7
  '2-dom7':   [-1, -1, 0, 2, 1, 2],  // D7
  '3-dom7':   [-1, -1, 1, 3, 2, 3],  // Eb7
  '4-dom7':   [0, 2, 0, 1, 0, 0],    // E7
  '5-dom7':   [1, 3, 1, 2, 1, 1],    // F7
  '6-dom7':   [2, 4, 2, 3, 2, 2],    // F#7
  '7-dom7':   [3, 2, 0, 0, 0, 1],    // G7
  '8-dom7':   [4, 6, 4, 5, 4, 4],    // Ab7
  '9-dom7':   [-1, 0, 2, 0, 2, 0],   // A7
  '10-dom7':  [-1, 1, 3, 1, 3, 1],   // Bb7
  '11-dom7':  [-1, 2, 1, 2, 0, 2],   // B7

  // ── Major 7 ──
  '0-maj7':   [-1, 3, 2, 0, 0, 0],   // Cmaj7
  '1-maj7':   [-1, 4, 3, 1, 1, 1],   // C#maj7
  '2-maj7':   [-1, -1, 0, 2, 2, 2],  // Dmaj7
  '3-maj7':   [-1, -1, 1, 3, 3, 3],  // Ebmaj7
  '4-maj7':   [0, 2, 1, 1, 0, 0],    // Emaj7
  '5-maj7':   [1, 3, 2, 2, 1, 0],    // Fmaj7
  '6-maj7':   [2, 4, 3, 3, 2, 1],    // F#maj7
  '7-maj7':   [3, 2, 0, 0, 0, 2],    // Gmaj7
  '8-maj7':   [4, 6, 5, 5, 4, 3],    // Abmaj7
  '9-maj7':   [-1, 0, 2, 1, 2, 0],   // Amaj7
  '10-maj7':  [-1, 1, 3, 2, 3, 1],   // Bbmaj7
  '11-maj7':  [-1, 2, 4, 3, 4, 2],   // Bmaj7

  // ── Minor 7 ──
  '0-min7':   [-1, 3, 5, 3, 4, 3],   // Cm7
  '1-min7':   [-1, 4, 6, 4, 5, 4],   // C#m7
  '2-min7':   [-1, -1, 0, 2, 1, 1],  // Dm7
  '3-min7':   [-1, -1, 1, 3, 2, 2],  // Ebm7
  '4-min7':   [0, 2, 0, 0, 0, 0],    // Em7
  '5-min7':   [1, 3, 1, 1, 1, 1],    // Fm7
  '6-min7':   [2, 4, 2, 2, 2, 2],    // F#m7
  '7-min7':   [3, 5, 3, 3, 3, 3],    // Gm7
  '8-min7':   [4, 6, 4, 4, 4, 4],    // G#m7
  '9-min7':   [-1, 0, 2, 0, 1, 0],   // Am7
  '10-min7':  [-1, 1, 3, 1, 2, 1],   // Bbm7
  '11-min7':  [-1, 2, 0, 2, 0, 2],   // Bm7

  // ── Diminished ──
  '0-dim':    [-1, 3, 4, 2, 4, 2],   // Cdim
  '1-dim':    [-1, 4, 5, 3, 5, 3],   // C#dim
  '2-dim':    [-1, -1, 0, 1, 3, 1],  // Ddim
  '3-dim':    [-1, -1, 1, 2, 4, 2],  // Ebdim
  '4-dim':    [0, 1, 2, 0, -1, -1],  // Edim
  '5-dim':    [1, 2, 3, 1, -1, -1],  // Fdim
  '6-dim':    [2, 3, 4, 2, -1, -1],  // F#dim
  '7-dim':    [3, 4, 5, 3, -1, -1],  // Gdim
  '8-dim':    [4, 5, 6, 4, -1, -1],  // G#dim
  '9-dim':    [-1, 0, 1, 2, 1, -1],  // Adim
  '10-dim':   [-1, 1, 2, 3, 2, -1],  // Bbdim
  '11-dim':   [-1, 2, 3, 4, 3, -1],  // Bdim

  // ── Augmented ──
  '0-aug':    [-1, 3, 2, 1, 1, 0],   // Caug
  '1-aug':    [-1, 4, 3, 2, 2, 1],   // C#aug
  '2-aug':    [-1, -1, 0, 3, 3, 2],  // Daug
  '3-aug':    [-1, -1, 1, 0, 0, 3],  // Ebaug
  '4-aug':    [0, 3, 2, 1, 1, 0],    // Eaug
  '5-aug':    [-1, -1, 3, 2, 2, 1],  // Faug
  '6-aug':    [-1, -1, 4, 3, 3, 2],  // F#aug
  '7-aug':    [3, -1, 5, 4, 4, 3],   // Gaug
  '8-aug':    [4, -1, 6, 5, 5, 4],   // G#aug
  '9-aug':    [-1, 0, 3, 2, 2, 1],   // Aaug
  '10-aug':   [-1, 1, 4, 3, 3, 2],   // Bbaug
  '11-aug':   [-1, 2, 1, 0, 0, 3],   // Baug

  // ── Sus2 ──
  '0-sus2':   [-1, 3, 0, 0, 1, 3],   // Csus2
  '1-sus2':   [-1, 4, 6, 6, 4, 4],   // C#sus2
  '2-sus2':   [-1, -1, 0, 2, 3, 0],  // Dsus2
  '3-sus2':   [-1, 6, 8, 8, 6, 6],   // Ebsus2
  '4-sus2':   [0, 2, 4, 4, 0, 0],    // Esus2
  '5-sus2':   [-1, -1, 3, 0, 1, 1],  // Fsus2
  '6-sus2':   [2, 4, 4, 1, 2, 2],    // F#sus2
  '7-sus2':   [3, 0, 0, 0, 3, 3],    // Gsus2
  '8-sus2':   [4, 6, 6, 3, 4, 4],    // G#sus2
  '9-sus2':   [-1, 0, 2, 2, 0, 0],   // Asus2
  '10-sus2':  [-1, 1, 3, 3, 1, 1],   // Bbsus2
  '11-sus2':  [-1, 2, 4, 4, 2, 2],   // Bsus2

  // ── Sus4 ──
  '0-sus4':   [-1, 3, 3, 0, 1, 1],   // Csus4
  '1-sus4':   [-1, 4, 6, 6, 7, 4],   // C#sus4
  '2-sus4':   [-1, -1, 0, 2, 3, 3],  // Dsus4
  '3-sus4':   [-1, 6, 8, 8, 9, 6],   // Ebsus4
  '4-sus4':   [0, 2, 2, 2, 0, 0],    // Esus4
  '5-sus4':   [1, 3, 3, 3, 1, 1],    // Fsus4
  '6-sus4':   [2, 4, 4, 4, 2, 2],    // F#sus4
  '7-sus4':   [3, 5, 5, 5, 3, 3],    // Gsus4 (or 3 3 0 0 1 3)
  '8-sus4':   [4, 6, 6, 6, 4, 4],    // G#sus4
  '9-sus4':   [-1, 0, 2, 2, 3, 0],   // Asus4
  '10-sus4':  [-1, 1, 3, 3, 4, 1],   // Bbsus4
  '11-sus4':  [-1, 2, 4, 4, 5, 2],   // Bsus4

  // ── Power chords (5th) ──
  '0-power':  [-1, 3, 5, 5, -1, -1], // C5
  '1-power':  [-1, 4, 6, 6, -1, -1], // C#5
  '2-power':  [-1, -1, 0, 2, 3, -1], // D5
  '3-power':  [-1, 6, 8, 8, -1, -1], // Eb5
  '4-power':  [0, 2, 2, -1, -1, -1], // E5
  '5-power':  [1, 3, 3, -1, -1, -1], // F5
  '6-power':  [2, 4, 4, -1, -1, -1], // F#5
  '7-power':  [3, 5, 5, -1, -1, -1], // G5
  '8-power':  [4, 6, 6, -1, -1, -1], // G#5
  '9-power':  [-1, 0, 2, 2, -1, -1], // A5
  '10-power': [-1, 1, 3, 3, -1, -1], // Bb5
  '11-power': [-1, 2, 4, 4, -1, -1], // B5
};

/**
 * Look up the standard guitar chord voicing for a given root and chord type.
 * Returns GuitarPositions for the strings that are played (not muted).
 */
export function findChordVoicing(_chordSemitones: number[], rootSemitone: number, chordType: string = 'major'): GuitarPosition[] {
  const key = `${rootSemitone}-${chordType}`;
  const shape = STANDARD_CHORDS[key];
  if (!shape) return [];

  const positions: GuitarPosition[] = [];
  for (let s = 0; s < 6; s++) {
    const fret = shape[s];
    if (fret >= 0) {
      positions.push({
        string: s,
        fret,
        midi: GUITAR_TUNING[s] + fret,
      });
    }
  }
  return positions;
}
