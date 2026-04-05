type Listener = () => void;

export type Mode = 'note' | 'chord';
export type Source = 'guitar' | 'piano' | null;

export interface AppState {
  mode: Mode;
  // Piano selections: exact MIDI notes clicked on piano
  pianoMidis: Set<number>;
  // Guitar selections: string index -> { fret, midi }
  guitarStrings: Map<number, { fret: number; midi: number }>;
  // Derived from both sources
  selectedMidis: Set<number>;
  selectedSemitones: Set<number>;
  // Chord mode
  chordRoot: number | null;
  chordType: string;
  chordRootMidi: number | null;
  // Hover
  hoverMidi: number | null;
  hoverSource: Source;
  // Audio
  soundEnabled: boolean;
  // Display
  showAllOctaves: boolean;
}

const listeners: Set<Listener> = new Set();

export const state: AppState = {
  mode: 'note',
  pianoMidis: new Set(),
  guitarStrings: new Map(),
  selectedMidis: new Set(),
  selectedSemitones: new Set(),
  chordRoot: null,
  chordType: 'major',
  chordRootMidi: null,
  hoverMidi: null,
  hoverSource: null,
  soundEnabled: true,
  showAllOctaves: false,
};

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit() {
  listeners.forEach(fn => fn());
}

function syncDerived() {
  state.selectedMidis.clear();
  state.selectedSemitones.clear();
  state.pianoMidis.forEach(m => {
    state.selectedMidis.add(m);
    state.selectedSemitones.add(m % 12);
  });
  state.guitarStrings.forEach(({ midi }) => {
    state.selectedMidis.add(midi);
    state.selectedSemitones.add(midi % 12);
  });
}

/** Toggle a note on guitar: one note per string */
export function toggleGuitarNote(stringIndex: number, fret: number, midi: number) {
  const existing = state.guitarStrings.get(stringIndex);
  if (existing && existing.fret === fret) {
    state.guitarStrings.delete(stringIndex);
  } else {
    state.guitarStrings.set(stringIndex, { fret, midi });
  }
  syncDerived();
  emit();
}

/** Toggle a note from piano */
export function togglePianoNote(midi: number) {
  if (state.pianoMidis.has(midi)) {
    state.pianoMidis.delete(midi);
  } else {
    state.pianoMidis.add(midi);
  }
  syncDerived();
  emit();
}

export function clearSelection() {
  state.pianoMidis.clear();
  state.guitarStrings.clear();
  state.selectedMidis.clear();
  state.selectedSemitones.clear();
  state.chordRoot = null;
  state.chordRootMidi = null;
  emit();
}

export function setChordRoot(semitone: number, midi: number | null = null) {
  state.chordRoot = semitone;
  state.chordRootMidi = midi;
  emit();
}

export function setChordType(type: string) {
  state.chordType = type;
  emit();
}

export function setMode(mode: Mode) {
  state.mode = mode;
  state.pianoMidis.clear();
  state.guitarStrings.clear();
  state.selectedMidis.clear();
  state.selectedSemitones.clear();
  state.chordRoot = null;
  state.chordRootMidi = null;
  emit();
}

export function setHover(midi: number | null, source: Source) {
  state.hoverMidi = midi;
  state.hoverSource = source;
  emit();
}

export function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  emit();
}

export function toggleShowAllOctaves() {
  state.showAllOctaves = !state.showAllOctaves;
  emit();
}
