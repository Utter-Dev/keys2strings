import { NOTE_NAMES, CHORD_TYPES } from './music';
import { getContext, scheduleChord } from './audio';

export interface ChordEvent {
  root: number;   // semitone 0-11
  type: string;   // key into CHORD_TYPES
}

interface ComposerState {
  bpm: number;
  beatsPerMeasure: number;
  measures: number;
  sequence: (ChordEvent | null)[];
  playing: boolean;
  currentBeat: number;
  loop: boolean;
  // Brush: what chord to paint with
  brushRoot: number;
  brushType: string;
}

const cstate: ComposerState = {
  bpm: 120,
  beatsPerMeasure: 4,
  measures: 4,
  sequence: new Array(16).fill(null),
  playing: false,
  currentBeat: -1,
  loop: true,
  brushRoot: 0,  // C
  brushType: 'major',
};

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach(fn => fn()); }
function subscribe(fn: Listener) { listeners.add(fn); return () => listeners.delete(fn); }

function totalBeats() { return cstate.measures * cstate.beatsPerMeasure; }

function ensureSequenceLength() {
  const len = totalBeats();
  if (cstate.sequence.length < len) {
    cstate.sequence.push(...new Array(len - cstate.sequence.length).fill(null));
  } else if (cstate.sequence.length > len) {
    cstate.sequence.length = len;
  }
}

function chordToMidis(chord: ChordEvent): number[] {
  const intervals = CHORD_TYPES[chord.type]?.intervals ?? [0, 4, 7];
  const rootMidi = 48 + chord.root; // C3 octave base
  return intervals.map(i => rootMidi + i);
}

function chordLabel(chord: ChordEvent): string {
  const root = NOTE_NAMES[chord.root];
  const type = CHORD_TYPES[chord.type]?.label ?? chord.type;
  return `${root}${type === 'Major' ? '' : type}`;
}

// Playback
let playbackTimer: number | null = null;

function stopPlayback() {
  cstate.playing = false;
  cstate.currentBeat = -1;
  if (playbackTimer !== null) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  emit();
}

function startPlayback() {
  if (cstate.playing) { stopPlayback(); return; }

  const ac = getContext();
  cstate.playing = true;
  cstate.currentBeat = 0;
  emit();

  const beatDuration = 60 / cstate.bpm;
  const total = totalBeats();
  let startTime = ac.currentTime + 0.05;

  // Schedule all beats ahead
  function scheduleAll(from: number, audioStart: number) {
    for (let i = from; i < total; i++) {
      const chord = cstate.sequence[i];
      if (chord) {
        const midis = chordToMidis(chord);
        scheduleChord(midis, audioStart + (i - from) * beatDuration, beatDuration * 0.9);
      }
    }
  }

  scheduleAll(0, startTime);

  // Visual cursor tracking
  const visualStart = performance.now();
  playbackTimer = window.setInterval(() => {
    const elapsed = (performance.now() - visualStart) / 1000;
    const beat = Math.floor(elapsed / beatDuration);

    if (beat >= total) {
      if (cstate.loop) {
        // Reschedule
        startTime = ac.currentTime + 0.05;
        scheduleAll(0, startTime);
        cstate.currentBeat = 0;
        // Reset visual timer base - use a fresh closure
        const newVisualStart = performance.now();
        if (playbackTimer !== null) clearInterval(playbackTimer);
        playbackTimer = window.setInterval(() => {
          const el2 = (performance.now() - newVisualStart) / 1000;
          const b2 = Math.floor(el2 / beatDuration);
          if (b2 >= total) {
            // Restart loop again
            startPlayback(); // recursive restart
            return;
          }
          if (b2 !== cstate.currentBeat) {
            cstate.currentBeat = b2;
            emit();
          }
        }, 30);
        emit();
        return;
      } else {
        stopPlayback();
        return;
      }
    }

    if (beat !== cstate.currentBeat) {
      cstate.currentBeat = beat;
      emit();
    }
  }, 30);
}

export function createComposer(container: HTMLElement) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'composer';

  // Transport bar
  const transport = document.createElement('div');
  transport.className = 'composer-transport';

  // Play/Stop
  const playBtn = document.createElement('button');
  playBtn.className = 'composer-play-btn';
  playBtn.addEventListener('click', () => {
    if (cstate.playing) stopPlayback(); else startPlayback();
  });
  transport.appendChild(playBtn);

  // Loop toggle
  const loopBtn = document.createElement('button');
  loopBtn.className = 'composer-loop-btn';
  loopBtn.addEventListener('click', () => { cstate.loop = !cstate.loop; emit(); });
  transport.appendChild(loopBtn);

  // BPM
  const bpmGroup = document.createElement('div');
  bpmGroup.className = 'composer-param';
  const bpmLabel = document.createElement('span');
  bpmLabel.className = 'composer-param-label';
  bpmLabel.textContent = 'BPM';
  const bpmInput = document.createElement('input');
  bpmInput.type = 'number';
  bpmInput.className = 'composer-input';
  bpmInput.min = '40';
  bpmInput.max = '240';
  bpmInput.value = String(cstate.bpm);
  bpmInput.addEventListener('change', () => {
    const v = parseInt(bpmInput.value);
    if (v >= 40 && v <= 240) { cstate.bpm = v; emit(); }
  });
  bpmGroup.appendChild(bpmLabel);
  bpmGroup.appendChild(bpmInput);
  transport.appendChild(bpmGroup);

  // Time signature
  const tsGroup = document.createElement('div');
  tsGroup.className = 'composer-param';
  const tsLabel = document.createElement('span');
  tsLabel.className = 'composer-param-label';
  tsLabel.textContent = 'Beats';
  const tsSelect = document.createElement('select');
  tsSelect.className = 'composer-select';
  [2, 3, 4, 6, 8].forEach(n => {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = `${n}/4`;
    if (n === cstate.beatsPerMeasure) opt.selected = true;
    tsSelect.appendChild(opt);
  });
  tsSelect.addEventListener('change', () => {
    cstate.beatsPerMeasure = parseInt(tsSelect.value);
    ensureSequenceLength();
    if (cstate.playing) stopPlayback();
    emit();
  });
  tsGroup.appendChild(tsLabel);
  tsGroup.appendChild(tsSelect);
  transport.appendChild(tsGroup);

  // Measures
  const measGroup = document.createElement('div');
  measGroup.className = 'composer-param';
  const measLabel = document.createElement('span');
  measLabel.className = 'composer-param-label';
  measLabel.textContent = 'Bars';
  const measInput = document.createElement('input');
  measInput.type = 'number';
  measInput.className = 'composer-input';
  measInput.min = '1';
  measInput.max = '16';
  measInput.value = String(cstate.measures);
  measInput.addEventListener('change', () => {
    const v = parseInt(measInput.value);
    if (v >= 1 && v <= 16) {
      cstate.measures = v;
      ensureSequenceLength();
      if (cstate.playing) stopPlayback();
      emit();
    }
  });
  measGroup.appendChild(measLabel);
  measGroup.appendChild(measInput);
  transport.appendChild(measGroup);

  // Clear sequence
  const clearSeqBtn = document.createElement('button');
  clearSeqBtn.className = 'composer-clear-btn';
  clearSeqBtn.textContent = 'Clear';
  clearSeqBtn.addEventListener('click', () => {
    cstate.sequence.fill(null);
    if (cstate.playing) stopPlayback();
    emit();
  });
  transport.appendChild(clearSeqBtn);

  wrapper.appendChild(transport);

  // Brush selector: pick what chord to paint
  const brushBar = document.createElement('div');
  brushBar.className = 'composer-brush';

  const brushLabel = document.createElement('span');
  brushLabel.className = 'composer-param-label';
  brushLabel.textContent = 'Chord';
  brushBar.appendChild(brushLabel);

  const brushRootSelect = document.createElement('div');
  brushRootSelect.className = 'note-select';
  NOTE_NAMES.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.className = `note-btn composer-root-btn ${name.includes('#') ? 'sharp' : ''}`;
    btn.dataset.semitone = String(i);
    btn.addEventListener('click', () => { cstate.brushRoot = i; emit(); });
    brushRootSelect.appendChild(btn);
  });
  brushBar.appendChild(brushRootSelect);

  const brushTypeSelect = document.createElement('div');
  brushTypeSelect.className = 'chord-type-select';
  Object.entries(CHORD_TYPES).forEach(([key, { label }]) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = 'type-btn composer-type-btn';
    btn.dataset.type = key;
    btn.addEventListener('click', () => { cstate.brushType = key; emit(); });
    brushTypeSelect.appendChild(btn);
  });
  brushBar.appendChild(brushTypeSelect);

  const brushPreview = document.createElement('span');
  brushPreview.className = 'composer-brush-preview';
  brushBar.appendChild(brushPreview);

  wrapper.appendChild(brushBar);

  // Grid
  const gridScroll = document.createElement('div');
  gridScroll.className = 'composer-grid-scroll';

  const grid = document.createElement('div');
  grid.className = 'composer-grid';
  gridScroll.appendChild(grid);
  wrapper.appendChild(gridScroll);

  container.appendChild(wrapper);

  function buildGrid() {
    grid.innerHTML = '';
    const total = totalBeats();

    // Measure labels row
    const labelRow = document.createElement('div');
    labelRow.className = 'composer-grid-row composer-measure-labels';
    for (let m = 0; m < cstate.measures; m++) {
      const label = document.createElement('div');
      label.className = 'composer-measure-label';
      label.style.gridColumn = `span ${cstate.beatsPerMeasure}`;
      label.textContent = `Bar ${m + 1}`;
      labelRow.appendChild(label);
    }
    grid.appendChild(labelRow);

    // Beat cells row
    const beatRow = document.createElement('div');
    beatRow.className = 'composer-grid-row composer-beat-row';

    for (let i = 0; i < total; i++) {
      const cell = document.createElement('div');
      const beatInMeasure = i % cstate.beatsPerMeasure;
      const isDownbeat = beatInMeasure === 0;
      cell.className = `composer-cell ${isDownbeat ? 'downbeat' : ''}`;
      cell.dataset.beat = String(i);

      // Beat number
      const beatNum = document.createElement('span');
      beatNum.className = 'composer-beat-num';
      beatNum.textContent = String(beatInMeasure + 1);
      cell.appendChild(beatNum);

      // Chord label
      const chordEl = document.createElement('div');
      chordEl.className = 'composer-cell-chord';
      cell.appendChild(chordEl);

      // Click to place/remove chord
      cell.addEventListener('click', (e) => {
        const idx = parseInt(cell.dataset.beat!);
        if (e.shiftKey || (cstate.sequence[idx] &&
            cstate.sequence[idx]!.root === cstate.brushRoot &&
            cstate.sequence[idx]!.type === cstate.brushType)) {
          // Remove if shift-click or clicking same chord
          cstate.sequence[idx] = null;
        } else {
          cstate.sequence[idx] = { root: cstate.brushRoot, type: cstate.brushType };
        }
        emit();
      });

      // Right-click to remove
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const idx = parseInt(cell.dataset.beat!);
        cstate.sequence[idx] = null;
        emit();
      });

      beatRow.appendChild(cell);
    }

    grid.appendChild(beatRow);

    // Set grid template
    grid.style.setProperty('--total-beats', String(total));
    beatRow.style.gridTemplateColumns = `repeat(${total}, 1fr)`;
    labelRow.style.gridTemplateColumns = `repeat(${total}, 1fr)`;
  }

  function render() {
    // Transport
    playBtn.textContent = cstate.playing ? 'Stop' : 'Play';
    playBtn.classList.toggle('playing', cstate.playing);
    loopBtn.textContent = cstate.loop ? 'Loop ON' : 'Loop OFF';
    loopBtn.classList.toggle('active', cstate.loop);

    // Brush
    brushRootSelect.querySelectorAll('.composer-root-btn').forEach(btn => {
      const el = btn as HTMLElement;
      el.classList.toggle('active', cstate.brushRoot === Number(el.dataset.semitone));
    });
    brushTypeSelect.querySelectorAll('.composer-type-btn').forEach(btn => {
      const el = btn as HTMLElement;
      el.classList.toggle('active', cstate.brushType === el.dataset.type);
    });
    brushPreview.textContent = chordLabel({ root: cstate.brushRoot, type: cstate.brushType });

    // Rebuild grid if structure changed
    const total = totalBeats();
    const beatRow = grid.querySelector('.composer-beat-row');
    if (!beatRow || beatRow.children.length !== total) {
      buildGrid();
    }

    // Update cells
    const cells = grid.querySelectorAll('.composer-cell');
    cells.forEach((cell) => {
      const el = cell as HTMLElement;
      const i = parseInt(el.dataset.beat!);
      const chord = cstate.sequence[i];
      const chordEl = el.querySelector('.composer-cell-chord') as HTMLElement;

      el.classList.toggle('has-chord', !!chord);
      el.classList.toggle('current', cstate.currentBeat === i);

      if (chord) {
        chordEl.textContent = chordLabel(chord);
        // Color by root note
        const hue = (chord.root / 12) * 360;
        el.style.setProperty('--chord-hue', String(hue));
      } else {
        chordEl.textContent = '';
        el.style.removeProperty('--chord-hue');
      }
    });
  }

  subscribe(render);
  buildGrid();
  render();
}
