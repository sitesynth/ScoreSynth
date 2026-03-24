// ─── Duration ────────────────────────────────────────────────────────────────

export type DurationBase =
  | 'whole' | 'half' | 'quarter' | 'eighth' | '16th' | '32nd' | '64th';

export interface Duration {
  base: DurationBase;
  dots: 0 | 1 | 2;
}

/** Duration in quarter-note beats (undotted) */
const BASE_BEATS: Record<DurationBase, number> = {
  whole: 4, half: 2, quarter: 1, eighth: 0.5,
  '16th': 0.25, '32nd': 0.125, '64th': 0.0625,
};

export function durationBeats(d: Duration): number {
  const base = BASE_BEATS[d.base];
  if (d.dots === 0) return base;
  if (d.dots === 1) return base * 1.5;
  return base * 1.75; // double-dotted
}

/** VexFlow duration string */
export function vexDuration(d: Duration): string {
  const map: Record<DurationBase, string> = {
    whole: 'w', half: 'h', quarter: 'q', eighth: '8',
    '16th': '16', '32nd': '32', '64th': '64',
  };
  return map[d.base] + (d.dots > 0 ? 'd'.repeat(d.dots) : '');
}

// ─── Pitch ───────────────────────────────────────────────────────────────────

export interface Pitch {
  midi: number;       // 0-127, C4 = 60
  alter: -1 | 0 | 1; // flat / natural / sharp (as displayed)
}

/** MIDI note number → VexFlow key string, e.g. "c/4", "f#/5" */
export function pitchToVexKey(pitch: Pitch): string {
  const noteNames = ['c', 'c', 'd', 'd', 'e', 'f', 'f', 'g', 'g', 'a', 'a', 'b'];
  const sharps    = [false, true, false, true, false, false, true, false, true, false, true, false];
  const pc = pitch.midi % 12;
  const octave = Math.floor(pitch.midi / 12) - 1;
  let name = noteNames[pc];
  // If the pitch class is a black key, use the alter to decide sharp/flat spelling
  if (sharps[pc]) {
    if (pitch.alter === -1) {
      // flat spelling: use the diatonic note above
      const flatNames = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];
      name = flatNames[pc];
    } else {
      // sharp spelling
      const sharpNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
      name = sharpNames[pc];
    }
  }
  return `${name}/${octave}`;
}

/** VexFlow accidental string for a pitch, or null if none needed */
export function pitchAccidental(pitch: Pitch): string | null {
  const pc = pitch.midi % 12;
  const isBlack = [false, true, false, true, false, false, true, false, true, false, true, false][pc];
  if (!isBlack) return null;
  return pitch.alter === -1 ? 'b' : '#';
}

// ─── Note / Rest ─────────────────────────────────────────────────────────────

export interface Note {
  type: 'note';
  id: string;
  pitch: Pitch;
  duration: Duration;
  tieStart?: boolean;
  tieEnd?: boolean;
}

export interface Rest {
  type: 'rest';
  id: string;
  duration: Duration;
}

export type NoteOrRest = Note | Rest;

// ─── Measure / Part / Score ──────────────────────────────────────────────────

export interface Measure {
  id: string;
  number: number;
  notes: NoteOrRest[]; // single voice for MVP
}

export interface Part {
  id: string;
  name: string;
  abbreviation: string;
  clef: 'treble' | 'bass' | 'alto';
  measures: Measure[];
}

export interface TimeSig {
  num: number;   // numerator
  den: number;   // denominator (4 = quarter note)
}

export interface Score {
  id: string;
  metadata: {
    title: string;
    composer: string;
    tempo: number;     // BPM
    timeSig: TimeSig;
    keySig: number;    // -7..7 (flats negative, sharps positive)
  };
  parts: Part[];
}

// ─── Cursor ──────────────────────────────────────────────────────────────────

export interface CursorPosition {
  partIndex: number;
  measureIndex: number;
  noteIndex: number; // insertion point (0 = before first note)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function beatsPerMeasure(timeSig: TimeSig): number {
  return timeSig.num * (4 / timeSig.den);
}

export function getMeasureBeats(measure: Measure): number {
  return measure.notes.reduce((s, n) => s + durationBeats(n.duration), 0);
}

export function isMeasureFull(measure: Measure, timeSig: TimeSig): boolean {
  return Math.abs(getMeasureBeats(measure) - beatsPerMeasure(timeSig)) < 0.001;
}

export function makeMeasure(number: number): Measure {
  return { id: crypto.randomUUID(), number, notes: [] };
}

export function createEmptyScore(
  title = 'New Score',
  composer = '',
  numMeasures = 8,
): Score {
  const treble: Part = {
    id: 'treble',
    name: 'Treble',
    abbreviation: 'Tr.',
    clef: 'treble',
    measures: Array.from({ length: numMeasures }, (_, i) => makeMeasure(i + 1)),
  };
  const bass: Part = {
    id: 'bass',
    name: 'Bass',
    abbreviation: 'Bs.',
    clef: 'bass',
    measures: Array.from({ length: numMeasures }, (_, i) => makeMeasure(i + 1)),
  };
  return {
    id: crypto.randomUUID(),
    metadata: { title, composer, tempo: 120, timeSig: { num: 4, den: 4 }, keySig: 0 },
    parts: [treble, bass],
  };
}

/**
 * Given a note letter (a-g) and the previous MIDI note,
 * return the MIDI number closest to prevMidi.
 */
export function letterToPitch(
  letter: string,
  prevMidi: number | null,
  alter: -1 | 0 | 1 = 0,
): Pitch {
  const semitones: Record<string, number> = {
    c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11,
  };
  const pc = semitones[letter.toLowerCase()];
  if (pc === undefined) throw new Error(`Invalid note letter: ${letter}`);

  const baseMidi = pc + alter;

  if (prevMidi === null) {
    // Default to octave 4 (middle of treble staff: C4=60)
    const midi = 48 + baseMidi; // octave 4 base = 48 (C3 is 48... actually C4=60 = 12*5)
    // C4 = 60, octave index 4: 12*(4+1) = 60 for C
    const oct4midi = 12 * 5 + baseMidi; // 60 + pc offset from C
    return { midi: oct4midi, alter };
  }

  // Find the closest occurrence of this pitch class to prevMidi
  const prevOct = Math.floor(prevMidi / 12);
  const candidates = [prevOct - 1, prevOct, prevOct + 1].map(
    oct => oct * 12 + baseMidi,
  );
  const best = candidates.reduce((a, b) =>
    Math.abs(a - prevMidi) <= Math.abs(b - prevMidi) ? a : b,
  );
  return { midi: best, alter };
}

/** Transpose a pitch by semitones */
export function transposePitch(pitch: Pitch, semitones: number): Pitch {
  const newMidi = Math.max(21, Math.min(108, pitch.midi + semitones));
  // Recalculate alter: preserve sharp/flat preference when possible
  const pc = newMidi % 12;
  const isBlack = [false, true, false, true, false, false, true, false, true, false, true, false][pc];
  return { midi: newMidi, alter: isBlack ? pitch.alter : 0 };
}

/** Deep clone a score (for undo/redo snapshots) */
export function cloneScore(score: Score): Score {
  return JSON.parse(JSON.stringify(score));
}
