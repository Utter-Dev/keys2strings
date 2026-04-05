import { GUITAR_TUNING, GUITAR_STRING_NAMES, FRET_COUNT, midiToNote, NOTE_NAMES } from './music';
import { state, toggleNote, setChordRoot, setHover, subscribe } from './state';
import { getActiveNotes } from './helpers';
import { playNote } from './audio';

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];
const DOUBLE_MARKERS = [12];

export function createGuitar(container: HTMLElement) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'guitar-wrapper';

  const fretboard = document.createElement('div');
  fretboard.className = 'guitar-fretboard';

  // Fret markers row
  const markersRow = document.createElement('div');
  markersRow.className = 'guitar-markers';
  for (let f = 0; f <= FRET_COUNT; f++) {
    const cell = document.createElement('div');
    cell.className = 'guitar-marker-cell';
    if (f === 0) {
      cell.classList.add('nut-marker');
    }
    if (FRET_MARKERS.includes(f)) {
      const dot = document.createElement('div');
      dot.className = 'fret-dot';
      cell.appendChild(dot);
      if (DOUBLE_MARKERS.includes(f)) {
        const dot2 = document.createElement('div');
        dot2.className = 'fret-dot';
        cell.appendChild(dot2);
      }
    }
    if (f > 0 && (f <= 5 || f % 2 === 1 || FRET_MARKERS.includes(f))) {
      const num = document.createElement('span');
      num.className = 'fret-number';
      num.textContent = String(f);
      cell.appendChild(num);
    }
    markersRow.appendChild(cell);
  }
  fretboard.appendChild(markersRow);

  const cells: Map<string, HTMLElement> = new Map();

  for (let s = 5; s >= 0; s--) {
    const row = document.createElement('div');
    row.className = 'guitar-string-row';

    const label = document.createElement('div');
    label.className = 'guitar-string-label';
    label.textContent = GUITAR_STRING_NAMES[s];
    row.appendChild(label);

    for (let f = 0; f <= FRET_COUNT; f++) {
      const midi = GUITAR_TUNING[s] + f;
      const note = midiToNote(midi);

      const cell = document.createElement('div');
      cell.className = `guitar-cell ${f === 0 ? 'open-string' : ''}`;
      cell.dataset.string = String(s);
      cell.dataset.fret = String(f);
      cell.dataset.midi = String(midi);

      const dot = document.createElement('div');
      dot.className = 'guitar-note-dot';
      dot.textContent = NOTE_NAMES[note.semitone];
      cell.appendChild(dot);

      const stringLine = document.createElement('div');
      stringLine.className = 'string-line';
      const thickness = [3, 2.5, 2, 1.5, 1.2, 1][s];
      stringLine.style.height = `${thickness}px`;
      cell.appendChild(stringLine);

      cell.addEventListener('click', () => {
        if (state.mode === 'note') {
          toggleNote(midi);
          if (state.soundEnabled && state.selectedMidis.has(midi)) {
            playNote(midi);
          }
        } else {
          setChordRoot(note.semitone, midi);
        }
      });

      cell.addEventListener('mouseenter', () => setHover(midi, 'guitar'));
      cell.addEventListener('mouseleave', () => setHover(null, null));

      row.appendChild(cell);
      cells.set(`${s}-${f}`, cell);
    }

    fretboard.appendChild(row);
  }

  wrapper.appendChild(fretboard);
  container.appendChild(wrapper);

  function render() {
    const { semitones, exactMidis } = getActiveNotes();
    const hoverSemitone = state.hoverMidi !== null ? state.hoverMidi % 12 : null;

    cells.forEach((el) => {
      const midi = Number(el.dataset.midi);
      const semitone = midi % 12;
      const isExact = exactMidis.has(midi);
      const isOctave = !isExact && semitones.has(semitone);
      const isHover = hoverSemitone !== null && semitone === hoverSemitone && !isExact && !isOctave;
      const dot = el.querySelector('.guitar-note-dot') as HTMLElement;

      el.classList.toggle('active', isExact);
      el.classList.toggle('octave', isOctave);
      el.classList.toggle('hover', isHover);

      if (isExact) {
        dot.style.background = 'var(--accent)';
        dot.style.color = '#fff';
        dot.style.transform = 'scale(1)';
        dot.style.opacity = '1';
      } else if (isOctave) {
        dot.style.background = 'var(--octave)';
        dot.style.color = '#fff';
        dot.style.transform = 'scale(0.9)';
        dot.style.opacity = '0.85';
      } else if (isHover) {
        dot.style.background = 'var(--hover)';
        dot.style.color = '#fff';
        dot.style.transform = 'scale(0.85)';
        dot.style.opacity = '1';
      } else {
        dot.style.background = '';
        dot.style.color = '';
        dot.style.transform = '';
        dot.style.opacity = '';
      }
    });
  }

  subscribe(render);
  render();
}
