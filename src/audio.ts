let ctx: AudioContext | null = null;

export function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function playNote(midi: number, duration = 0.6) {
  const ac = getContext();
  const freq = midiToFreq(midi);
  const now = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.12, now + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playNotes(midis: number[], stagger = 0.08) {
  midis.sort((a, b) => a - b);
  midis.forEach((midi, i) => {
    setTimeout(() => playNote(midi, 0.8), i * stagger * 1000);
  });
}

export function playChordStrum(midis: number[]) {
  playNotes(midis, 0.05);
}

/** Schedule a chord to play at a specific AudioContext time */
export function scheduleChord(midis: number[], time: number, duration: number) {
  const ac = getContext();
  midis.forEach((midi, i) => {
    const freq = midiToFreq(midi);
    const t = time + i * 0.012; // slight strum

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.08, t + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration);
  });
}
