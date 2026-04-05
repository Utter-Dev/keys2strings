import { PIANO_START, PIANO_END, isBlackKey, midiToNote, NOTE_NAMES } from './music';
import { state, toggleSemitone, setChordRoot, setHover, subscribe } from './state';
import { getActiveNotes } from './helpers';

export function createPiano(container: HTMLElement) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'piano-wrapper';

  const keyboard = document.createElement('div');
  keyboard.className = 'piano-keyboard';

  const keys: Map<number, HTMLElement> = new Map();

  for (let midi = PIANO_START; midi <= PIANO_END; midi++) {
    const note = midiToNote(midi);
    const black = isBlackKey(midi);

    const key = document.createElement('div');
    key.className = `piano-key ${black ? 'black' : 'white'}`;
    key.dataset.midi = String(midi);
    key.dataset.semitone = String(note.semitone);

    // Label on C keys and all black keys
    if (note.name === 'C' || black) {
      const label = document.createElement('span');
      label.className = 'piano-key-label';
      label.textContent = black ? NOTE_NAMES[note.semitone] : `C${note.octave}`;
      key.appendChild(label);
    }

    key.addEventListener('click', () => {
      if (state.mode === 'note') {
        toggleSemitone(note.semitone);
      } else {
        setChordRoot(note.semitone);
      }
    });

    key.addEventListener('mouseenter', () => setHover(midi, 'piano'));
    key.addEventListener('mouseleave', () => setHover(null, null));

    keyboard.appendChild(key);
    keys.set(midi, key);
  }

  wrapper.appendChild(keyboard);
  container.appendChild(wrapper);

  function render() {
    const active = getActiveNotes();
    const hoverSemitone = state.hoverMidi !== null ? state.hoverMidi % 12 : null;

    keys.forEach((el, midi) => {
      const semitone = midi % 12;
      const isActive = active.has(semitone);
      const isHover = hoverSemitone !== null && semitone === hoverSemitone;
      const black = isBlackKey(midi);

      el.classList.toggle('active', isActive);
      el.classList.toggle('hover', isHover);

      if (isActive) {
        el.style.background = black ? 'var(--accent-dark)' : 'var(--accent)';
      } else if (isHover) {
        el.style.background = black ? 'var(--hover-dark)' : 'var(--hover)';
      } else {
        el.style.background = '';
      }
    });
  }

  subscribe(render);
  render();
}
