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
