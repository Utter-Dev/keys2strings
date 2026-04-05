import { CHORD_TYPES, getChordNotes } from './music';
import { state } from './state';

export function getActiveNotes(): Set<number> {
  if (state.mode === 'chord' && state.chordRoot !== null) {
    const chord = CHORD_TYPES[state.chordType];
    if (chord) {
      return new Set(getChordNotes(state.chordRoot, chord.intervals));
    }
  }
  return new Set(state.selectedSemitones);
}
