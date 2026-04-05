type Listener = () => void;

export type Mode = 'note' | 'chord';
export type Source = 'guitar' | 'piano' | null;

export interface AppState {
  mode: Mode;
  // Note mode: selected semitones (0-11), can be multiple individual notes
  selectedSemitones: Set<number>;
  // Chord mode
  chordRoot: number | null;    // semitone 0-11
  chordType: string;           // key into CHORD_TYPES
  // Hover
  hoverMidi: number | null;
  hoverSource: Source;
}

const listeners: Set<Listener> = new Set();

export const state: AppState = {
  mode: 'note',
  selectedSemitones: new Set(),
  chordRoot: null,
  chordType: 'major',
  hoverMidi: null,
  hoverSource: null,
};

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit() {
  listeners.forEach(fn => fn());
}

export function toggleSemitone(semitone: number) {
  if (state.selectedSemitones.has(semitone)) {
    state.selectedSemitones.delete(semitone);
  } else {
    state.selectedSemitones.add(semitone);
  }
  emit();
}

export function clearSelection() {
  state.selectedSemitones.clear();
  state.chordRoot = null;
  emit();
}

export function setChordRoot(semitone: number) {
  state.chordRoot = semitone;
  emit();
}

export function setChordType(type: string) {
  state.chordType = type;
  emit();
}

export function setMode(mode: Mode) {
  state.mode = mode;
  state.selectedSemitones.clear();
  state.chordRoot = null;
  emit();
}

export function setHover(midi: number | null, source: Source) {
  state.hoverMidi = midi;
  state.hoverSource = source;
  emit();
}
