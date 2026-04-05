type Listener = () => void;

export type Mode = 'note' | 'chord';
export type Source = 'guitar' | 'piano' | null;

export interface AppState {
  mode: Mode;
  // Note mode: exact MIDI notes the user clicked
  selectedMidis: Set<number>;
  // Derived semitone classes (0-11) from selectedMidis
  selectedSemitones: Set<number>;
  // Guitar string selections: string index (0-5) -> { fret, midi }
  // One note per string, like forming a chord on guitar
  guitarStrings: Map<number, { fret: number; midi: number }>;
  // Chord mode
  chordRoot: number | null;    // semitone 0-11
  chordType: string;           // key into CHORD_TYPES
  chordRootMidi: number | null; // exact MIDI that was clicked for chord root
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
  selectedMidis: new Set(),
  selectedSemitones: new Set(),
  guitarStrings: new Map(),
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

function syncFromGuitar() {
  state.selectedMidis.clear();
  state.selectedSemitones.clear();
  state.guitarStrings.forEach(({ midi }) => {
    state.selectedMidis.add(midi);
    state.selectedSemitones.add(midi % 12);
  });
}

function syncSemitones() {
  state.selectedSemitones.clear();
  state.selectedMidis.forEach(m => state.selectedSemitones.add(m % 12));
}

/** Toggle a note on guitar: one note per string */
export function toggleGuitarNote(stringIndex: number, fret: number, midi: number) {
  const existing = state.guitarStrings.get(stringIndex);
  if (existing && existing.fret === fret) {
    // Same position: deselect this string
    state.guitarStrings.delete(stringIndex);
  } else {
    // New position on this string (replaces any previous on same string)
    state.guitarStrings.set(stringIndex, { fret, midi });
  }
  syncFromGuitar();
  emit();
}

/** Toggle a note from piano */
export function toggleNote(midi: number) {
  const semitone = midi % 12;
  if (state.selectedSemitones.has(semitone)) {
    for (const m of state.selectedMidis) {
      if (m % 12 === semitone) state.selectedMidis.delete(m);
    }
    // Also remove from guitar strings if any match this semitone
    for (const [s, { midi: gMidi }] of state.guitarStrings) {
      if (gMidi % 12 === semitone) state.guitarStrings.delete(s);
    }
  } else {
    state.selectedMidis.add(midi);
  }
  syncSemitones();
  emit();
}

export function clearSelection() {
  state.selectedMidis.clear();
  state.selectedSemitones.clear();
  state.guitarStrings.clear();
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
  state.selectedMidis.clear();
  state.selectedSemitones.clear();
  state.guitarStrings.clear();
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
