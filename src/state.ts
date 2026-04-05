type Listener = () => void;

export type Mode = 'note' | 'chord';
export type Source = 'guitar' | 'piano' | null;

export interface AppState {
  mode: Mode;
  // Note mode: exact MIDI notes the user clicked
  selectedMidis: Set<number>;
  // Derived semitone classes (0-11) from selectedMidis
  selectedSemitones: Set<number>;
  // Chord mode
  chordRoot: number | null;    // semitone 0-11
  chordType: string;           // key into CHORD_TYPES
  chordRootMidi: number | null; // exact MIDI that was clicked for chord root
  // Hover
  hoverMidi: number | null;
  hoverSource: Source;
  // Audio
  soundEnabled: boolean;
}

const listeners: Set<Listener> = new Set();

export const state: AppState = {
  mode: 'note',
  selectedMidis: new Set(),
  selectedSemitones: new Set(),
  chordRoot: null,
  chordType: 'major',
  chordRootMidi: null,
  hoverMidi: null,
  hoverSource: null,
  soundEnabled: true,
};

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit() {
  listeners.forEach(fn => fn());
}

function syncSemitones() {
  state.selectedSemitones.clear();
  state.selectedMidis.forEach(m => state.selectedSemitones.add(m % 12));
}

export function toggleNote(midi: number) {
  const semitone = midi % 12;
  // If this semitone class is already selected, remove all MIDIs of that class
  if (state.selectedSemitones.has(semitone)) {
    for (const m of state.selectedMidis) {
      if (m % 12 === semitone) state.selectedMidis.delete(m);
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
