import { CHORD_TYPES, getChordNotes } from './music';
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
        // Build exact chord MIDIs from the clicked root
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

export function getPlayableMidis(): number[] {
  const { exactMidis } = getActiveNotes();
  return [...exactMidis].sort((a, b) => a - b);
}
