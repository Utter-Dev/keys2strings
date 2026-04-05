import { NOTE_NAMES, CHORD_TYPES, noteToDisplay } from './music';
import { state, setMode, setChordRoot, setChordType, clearSelection, toggleSound, toggleShowAllOctaves, subscribe } from './state';

import { getActiveNotes, getPlayableMidis } from './helpers';
import { playNotes, playChordStrum } from './audio';

export function createControls(container: HTMLElement) {
  container.innerHTML = '';

  const controls = document.createElement('div');
  controls.className = 'controls';

  // Mode toggle
  const modeGroup = document.createElement('div');
  modeGroup.className = 'control-group';

  const modeLabel = document.createElement('span');
  modeLabel.className = 'control-label';
  modeLabel.textContent = 'Mode';
  modeGroup.appendChild(modeLabel);

  const modeToggle = document.createElement('div');
  modeToggle.className = 'toggle-group';

  const noteBtn = document.createElement('button');
  noteBtn.textContent = 'Notes';
  noteBtn.className = 'toggle-btn active';
  noteBtn.addEventListener('click', () => setMode('note'));

  const chordBtn = document.createElement('button');
  chordBtn.textContent = 'Chords';
  chordBtn.className = 'toggle-btn';
  chordBtn.addEventListener('click', () => setMode('chord'));

  modeToggle.appendChild(noteBtn);
  modeToggle.appendChild(chordBtn);
  modeGroup.appendChild(modeToggle);
  controls.appendChild(modeGroup);

  // Chord controls
  const chordGroup = document.createElement('div');
  chordGroup.className = 'control-group chord-controls';

  const rootLabel = document.createElement('span');
  rootLabel.className = 'control-label';
  rootLabel.textContent = 'Root';
  chordGroup.appendChild(rootLabel);

  const rootSelect = document.createElement('div');
  rootSelect.className = 'note-select';
  NOTE_NAMES.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.className = `note-btn ${name.includes('#') ? 'sharp' : ''}`;
    btn.dataset.semitone = String(i);
    btn.addEventListener('click', () => {
      // Default to octave 4 (MIDI 60 + semitone) when picking from control bar
      setChordRoot(i, 60 + i);
    });
    rootSelect.appendChild(btn);
  });
  chordGroup.appendChild(rootSelect);

  const typeLabel = document.createElement('span');
  typeLabel.className = 'control-label';
  typeLabel.textContent = 'Type';
  chordGroup.appendChild(typeLabel);

  const typeSelect = document.createElement('div');
  typeSelect.className = 'chord-type-select';
  Object.entries(CHORD_TYPES).forEach(([key, { label }]) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'type-btn';
    btn.dataset.type = key;
    btn.addEventListener('click', () => setChordType(key));
    typeSelect.appendChild(btn);
  });
  chordGroup.appendChild(typeSelect);

  controls.appendChild(chordGroup);

  // Right-side buttons
  const rightGroup = document.createElement('div');
  rightGroup.className = 'control-group right-controls';

  // All octaves toggle
  const octaveBtn = document.createElement('button');
  octaveBtn.className = 'icon-btn octave-btn';
  octaveBtn.title = 'Show same note across all octaves';
  octaveBtn.addEventListener('click', toggleShowAllOctaves);
  rightGroup.appendChild(octaveBtn);

  // Sound toggle
  const soundBtn = document.createElement('button');
  soundBtn.className = 'icon-btn sound-btn';
  soundBtn.title = 'Toggle sound';
  soundBtn.addEventListener('click', toggleSound);
  rightGroup.appendChild(soundBtn);

  // Play button
  const playBtn = document.createElement('button');
  playBtn.className = 'play-btn';
  playBtn.textContent = 'Play';
  playBtn.title = 'Play selected notes';
  playBtn.addEventListener('click', () => {
    const midis = getPlayableMidis();
    if (midis.length === 0) return;
    if (state.mode === 'chord') {
      playChordStrum(midis);
    } else {
      playNotes(midis);
    }
  });
  rightGroup.appendChild(playBtn);

  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear';
  clearBtn.className = 'clear-btn';
  clearBtn.addEventListener('click', clearSelection);
  rightGroup.appendChild(clearBtn);

  controls.appendChild(rightGroup);

  // Info display
  const info = document.createElement('div');
  info.className = 'info-display';
  controls.appendChild(info);

  container.appendChild(controls);

  function render() {
    noteBtn.classList.toggle('active', state.mode === 'note');
    chordBtn.classList.toggle('active', state.mode === 'chord');
    chordGroup.style.display = state.mode === 'chord' ? '' : 'none';

    rootSelect.querySelectorAll('.note-btn').forEach((btn) => {
      const el = btn as HTMLElement;
      el.classList.toggle('active', state.chordRoot === Number(el.dataset.semitone));
    });

    typeSelect.querySelectorAll('.type-btn').forEach((btn) => {
      const el = btn as HTMLElement;
      el.classList.toggle('active', state.chordType === el.dataset.type);
    });

    // Octave button
    octaveBtn.textContent = state.showAllOctaves ? 'All Octaves' : 'Single Note';
    octaveBtn.classList.toggle('active', state.showAllOctaves);

    // Sound button
    soundBtn.textContent = state.soundEnabled ? 'Sound ON' : 'Sound OFF';
    soundBtn.classList.toggle('active', state.soundEnabled);

    // Play button state
    const midis = getPlayableMidis();
    playBtn.disabled = midis.length === 0;

    // Info
    const { semitones } = getActiveNotes();
    if (semitones.size > 0) {
      if (state.mode === 'chord' && state.chordRoot !== null) {
        const root = NOTE_NAMES[state.chordRoot];
        const type = CHORD_TYPES[state.chordType].label;
        const names = [...semitones].map(s => NOTE_NAMES[s]).join(', ');
        info.textContent = `${root} ${type}: ${names}`;
      } else if (state.guitarStrings.size > 0) {
        // Show exact notes from guitar selections
        const notes = [...state.guitarStrings.entries()]
          .sort(([a], [b]) => a - b)
          .map(([, { midi }]) => noteToDisplay(midi));
        info.textContent = `Selected: ${notes.join(', ')}`;
      } else {
        const names = [...semitones].map(s => NOTE_NAMES[s]).join(', ');
        info.textContent = `Selected: ${names}`;
      }
    } else {
      info.textContent = state.mode === 'note'
        ? 'Click any key or fret to highlight that note'
        : 'Select a root note to see a chord';
    }
  }

  subscribe(render);
  render();
}
