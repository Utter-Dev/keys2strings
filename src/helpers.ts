import { CHORD_TYPES, getChordNotes, findChordVoicing } from './music';
import type { GuitarPosition } from './music';
import { state } from './state';

export interface ActiveNotes {
  semitones: Set<number>;   // all active semitone classes (0-11)
  exactMidis: Set<number>;  // the exact MIDI notes the user clicked
}

export function getActiveNotes(): ActiveNotes {
  if (state.mode === 'chord' && state.chordRoot !== null) {
    const chord = CHORD_TYPES[state.chordType];
    if (chord) {
      const semitones = new Set(getChordNotes(state.chordRoot, chord.intervals));
      const exactMidis = new Set<number>();
      if (state.chordRootMidi !== null) {
        const rootMidi = state.chordRootMidi;
        chord.intervals.forEach(i => exactMidis.add(rootMidi + i));
      }
      return { semitones, exactMidis };
    }
  }
  return {
    semitones: new Set(state.selectedSemitones),
    exactMidis: new Set(state.selectedMidis),
  };
}

/** Get the guitar chord voicing positions (one per string, max 6) */
export function getGuitarChordVoicing(): GuitarPosition[] {
  if (state.mode === 'chord' && state.chordRoot !== null) {
    const chord = CHORD_TYPES[state.chordType];
    if (chord) {
      const semitones = getChordNotes(state.chordRoot, chord.intervals);
      return findChordVoicing(semitones, state.chordRoot, state.chordType);
    }
  }
  return [];
}

export function getPlayableMidis(): number[] {
  const { exactMidis } = getActiveNotes();
  return [...exactMidis].sort((a, b) => a - b);
}
