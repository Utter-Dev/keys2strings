export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export type NoteName = typeof NOTE_NAMES[number];

// Standard guitar tuning: E2, A2, D3, G3, B3, E4 (MIDI note numbers)
export const GUITAR_TUNING = [40, 45, 50, 55, 59, 64]; // low E to high E
export const GUITAR_STRING_NAMES = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
export const FRET_COUNT = 15;

// Piano range: A0 (21) to C8 (108)
export const PIANO_START = 36; // C2
export const PIANO_END = 84;   // C6 (4 octaves, practical range)

export interface NotePosition {
  midi: number;
  name: string;
  octave: number;
  semitone: number; // 0-11
}

export interface GuitarPosition {
  string: number; // 0-5 (low E = 0)
  fret: number;   // 0-14
  midi: number;
}

export interface ChordShape {
  name: string;
  notes: number[]; // semitone classes (0-11)
  guitarPositions: GuitarPosition[];
}

export function midiToNote(midi: number): NotePosition {
  const semitone = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { midi, name: NOTE_NAMES[semitone], octave, semitone };
}

export function noteToDisplay(midi: number): string {
  const note = midiToNote(midi);
  return `${note.name}${note.octave}`;
}

export function getGuitarMidi(string: number, fret: number): number {
  return GUITAR_TUNING[string] + fret;
}

export function findGuitarPositions(midi: number): GuitarPosition[] {
  const positions: GuitarPosition[] = [];
  for (let s = 0; s < 6; s++) {
    const fret = midi - GUITAR_TUNING[s];
    if (fret >= 0 && fret <= FRET_COUNT) {
      positions.push({ string: s, fret, midi });
    }
  }
  return positions;
}

export function findAllGuitarPositionsForSemitone(semitone: number): GuitarPosition[] {
  const positions: GuitarPosition[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= FRET_COUNT; f++) {
      const m = GUITAR_TUNING[s] + f;
      if (m % 12 === semitone) {
        positions.push({ string: s, fret: f, midi: m });
      }
    }
  }
  return positions;
}

export function findPianoKeysForSemitone(semitone: number): number[] {
  const keys: number[] = [];
  for (let m = PIANO_START; m <= PIANO_END; m++) {
    if (m % 12 === semitone) keys.push(m);
  }
  return keys;
}

export function isBlackKey(midi: number): boolean {
  const s = midi % 12;
  return [1, 3, 6, 8, 10].includes(s);
}

// Common chord definitions (intervals from root as semitones)
export const CHORD_TYPES: Record<string, { label: string; intervals: number[] }> = {
  major:    { label: 'Major',     intervals: [0, 4, 7] },
  minor:    { label: 'Minor',     intervals: [0, 3, 7] },
  dom7:     { label: '7',         intervals: [0, 4, 7, 10] },
  maj7:     { label: 'Maj7',      intervals: [0, 4, 7, 11] },
  min7:     { label: 'm7',        intervals: [0, 3, 7, 10] },
  dim:      { label: 'dim',       intervals: [0, 3, 6] },
  aug:      { label: 'aug',       intervals: [0, 4, 8] },
  sus2:     { label: 'sus2',      intervals: [0, 2, 7] },
  sus4:     { label: 'sus4',      intervals: [0, 5, 7] },
  power:    { label: '5 (Power)', intervals: [0, 7] },
};

export function getChordNotes(rootSemitone: number, intervals: number[]): number[] {
  return intervals.map(i => (rootSemitone + i) % 12);
}

/**
 * Find a playable guitar chord voicing: at most one note per string,
 * within a reasonable fret span, with root as the lowest note when possible.
 */
export function findChordVoicing(chordSemitones: number[], rootSemitone: number): GuitarPosition[] {
  const chordSet = new Set(chordSemitones);
  let bestVoicing: GuitarPosition[] = [];
  let bestScore = -Infinity;

  // Try voicings rooted at each base fret position
  for (let baseFret = 0; baseFret <= 12; baseFret++) {
    const minFret = baseFret === 0 ? 0 : baseFret;
    const maxFret = baseFret === 0 ? 3 : baseFret + 3;

    // For each string, find candidate frets in range that match a chord tone
    const candidates: (GuitarPosition | null)[][] = [];
    for (let s = 0; s < 6; s++) {
      const opts: (GuitarPosition | null)[] = [null]; // null = muted string
      for (let f = minFret; f <= Math.min(maxFret, FRET_COUNT); f++) {
        const midi = GUITAR_TUNING[s] + f;
        if (chordSet.has(midi % 12)) {
          opts.push({ string: s, fret: f, midi });
        }
      }
      // Also allow open string even if baseFret > 0
      if (baseFret > 0) {
        const openMidi = GUITAR_TUNING[s];
        if (chordSet.has(openMidi % 12)) {
          opts.push({ string: s, fret: 0, midi: openMidi });
        }
      }
      candidates.push(opts);
    }

    // Try all combinations - but limit branching by picking best per string
    // Use greedy: for each string pick the option that covers needed tones
    // Try two strategies: (A) maximize strings, (B) ensure root bass

    for (const requireRootBass of [true, false]) {
      const voicing: (GuitarPosition | null)[] = [];
      const covered = new Set<number>();
      let lowestString = -1;

      for (let s = 0; s < 6; s++) {
        const opts = candidates[s].filter(p => p !== null) as GuitarPosition[];
        if (opts.length === 0) {
          voicing.push(null);
          continue;
        }

        // If we haven't found the bass note yet and requireRootBass,
        // only allow root on this string or mute it
        if (requireRootBass && lowestString === -1) {
          const rootOpt = opts.find(p => p.midi % 12 === rootSemitone);
          if (rootOpt) {
            voicing.push(rootOpt);
            covered.add(rootOpt.midi % 12);
            lowestString = s;
          } else {
            voicing.push(null); // mute - root not available here
          }
          continue;
        }

        // Pick the option that adds uncovered tones, prefer lower frets
        let best: GuitarPosition | null = null;
        let bestPri = -1;
        for (const p of opts) {
          const sem = p.midi % 12;
          const addsNew = !covered.has(sem) ? 10 : 0;
          const openBonus = p.fret === 0 ? 2 : 0;
          const pri = addsNew + openBonus;
          if (pri > bestPri) {
            bestPri = pri;
            best = p;
          }
        }

        if (best) {
          voicing.push(best);
          covered.add(best.midi % 12);
          if (lowestString === -1) lowestString = s;
        } else {
          voicing.push(null);
        }
      }

      const usable = voicing.filter(p => p !== null) as GuitarPosition[];
      if (usable.length < 3) continue;

      // Check muted strings aren't in the middle of played strings
      const playedStrings = usable.map(p => p.string);
      const minStr = Math.min(...playedStrings);
      const maxStr = Math.max(...playedStrings);
      const span = maxStr - minStr + 1;
      const gaps = span - usable.length; // muted strings in the middle

      // Coverage: how many unique chord tones are represented
      const coveredSemitones = new Set(usable.map(p => p.midi % 12));
      const coverage = chordSemitones.filter(s => coveredSemitones.has(s)).length;

      // Bass note
      const bassPos = usable.reduce((a, b) => a.string < b.string ? a : b);
      const hasRootBass = bassPos.midi % 12 === rootSemitone;

      // Fret span of fretted notes (exclude open strings)
      const fretted = usable.filter(p => p.fret > 0);
      const fretSpan = fretted.length > 0
        ? Math.max(...fretted.map(p => p.fret)) - Math.min(...fretted.map(p => p.fret))
        : 0;

      let score = 0;
      score += coverage * 20;          // cover all chord tones
      score += usable.length * 3;       // more strings
      score += hasRootBass ? 15 : 0;    // root in bass
      score -= baseFret * 0.5;          // prefer lower positions
      score -= fretSpan * 2;            // compact shapes
      score -= gaps * 5;                // avoid middle-string gaps
      score += usable.filter(p => p.fret === 0).length; // open strings

      if (score > bestScore) {
        bestScore = score;
        bestVoicing = usable;
      }
    }
  }

  return bestVoicing;
}
