import type { Duration, DurationBase, Measure, NoteOrRest, Part, Pitch, Score } from './music-model';

interface ImportWarning {
  code: string;
  message: string;
}

export interface MusicXmlImportResult {
  score: Score;
  warnings: ImportWarning[];
}

const DURATION_CANDIDATES: Duration[] = [
  { base: 'whole', dots: 0 },
  { base: 'whole', dots: 1 },
  { base: 'half', dots: 0 },
  { base: 'half', dots: 1 },
  { base: 'half', dots: 2 },
  { base: 'quarter', dots: 0 },
  { base: 'quarter', dots: 1 },
  { base: 'quarter', dots: 2 },
  { base: 'eighth', dots: 0 },
  { base: 'eighth', dots: 1 },
  { base: 'eighth', dots: 2 },
  { base: '16th', dots: 0 },
  { base: '16th', dots: 1 },
  { base: '32nd', dots: 0 },
  { base: '32nd', dots: 1 },
  { base: '64th', dots: 0 },
];

const BASE_TO_BEATS: Record<DurationBase, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  '16th': 0.25,
  '32nd': 0.125,
  '64th': 0.0625,
};

const TYPE_TO_BASE: Record<string, DurationBase> = {
  whole: 'whole',
  half: 'half',
  quarter: 'quarter',
  eighth: 'eighth',
  '16th': '16th',
  '32nd': '32nd',
  '64th': '64th',
};

function text(node: Element | null | undefined, selector: string): string | null {
  if (!node) return null;
  const target = node.querySelector(selector);
  return target?.textContent?.trim() ?? null;
}

function durationBeats(duration: Duration): number {
  const base = BASE_TO_BEATS[duration.base];
  if (duration.dots === 0) return base;
  if (duration.dots === 1) return base * 1.5;
  return base * 1.75;
}

function closestDurationFromBeats(beats: number): Duration {
  let best = DURATION_CANDIDATES[0];
  let minDelta = Math.abs(durationBeats(best) - beats);

  for (const candidate of DURATION_CANDIDATES) {
    const delta = Math.abs(durationBeats(candidate) - beats);
    if (delta < minDelta) {
      minDelta = delta;
      best = candidate;
    }
  }

  return best;
}

function parsePitch(noteEl: Element): Pitch | null {
  const step = text(noteEl, 'pitch > step');
  const alterRaw = text(noteEl, 'pitch > alter');
  const octaveRaw = text(noteEl, 'pitch > octave');
  if (!step || octaveRaw === null) return null;

  const octave = Number(octaveRaw);
  if (Number.isNaN(octave)) return null;

  const stepOffsets: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  const stepOffset = stepOffsets[step.toUpperCase()];
  if (stepOffset === undefined) return null;

  const rawAlter = alterRaw === null ? 0 : Number(alterRaw);
  const roundedAlter = Number.isNaN(rawAlter) ? 0 : rawAlter;
  const normalizedAlter: -1 | 0 | 1 = roundedAlter < 0 ? -1 : roundedAlter > 0 ? 1 : 0;

  const midi = (octave + 1) * 12 + stepOffset + normalizedAlter;
  return {
    midi: Math.max(0, Math.min(127, midi)),
    alter: normalizedAlter,
  };
}

function parseDuration(noteEl: Element, divisions: number): Duration {
  const typeRaw = text(noteEl, 'type');
  const dots = Math.min(noteEl.querySelectorAll('dot').length, 2) as 0 | 1 | 2;

  if (typeRaw && TYPE_TO_BASE[typeRaw]) {
    return { base: TYPE_TO_BASE[typeRaw], dots };
  }

  const durationRaw = text(noteEl, 'duration');
  const durationTicks = durationRaw === null ? NaN : Number(durationRaw);

  if (Number.isNaN(durationTicks) || divisions <= 0) {
    return { base: 'quarter', dots: 0 };
  }

  const beats = durationTicks / divisions;
  return closestDurationFromBeats(beats);
}

export function importMusicXml(xmlText: string, fallbackTitle = 'Imported score'): MusicXmlImportResult {
  const warnings: ImportWarning[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML file. Could not parse MusicXML.');
  }

  const root = doc.querySelector('score-partwise');
  if (!root) {
    throw new Error('Unsupported MusicXML format. Expected score-partwise.');
  }

  const title = text(root, 'work > work-title') || text(root, 'movement-title') || fallbackTitle;
  const composer = text(root, "identification > creator[type='composer']") || '';

  const partNameMap = new Map<string, string>();
  root.querySelectorAll('part-list > score-part').forEach((partNode) => {
    const id = partNode.getAttribute('id');
    if (!id) return;
    const name = text(partNode, 'part-name') || id;
    partNameMap.set(id, name);
  });

  const parts: Part[] = [];
  let globalTimeSig: { num: number; den: number } = { num: 4, den: 4 };
  let globalKeySig = 0;

  root.querySelectorAll('part').forEach((partEl, partIndex) => {
    const partId = partEl.getAttribute('id') || `P${partIndex + 1}`;
    const partName = partNameMap.get(partId) || `Part ${partIndex + 1}`;
    const measures: Measure[] = [];
    let currentDivisions = 1;

    partEl.querySelectorAll(':scope > measure').forEach((measureEl, measureIndex) => {
      const measureNumber = Number(measureEl.getAttribute('number') || measureIndex + 1);
      const attrs = measureEl.querySelector(':scope > attributes');

      if (attrs) {
        const divisionsRaw = text(attrs, 'divisions');
        if (divisionsRaw) {
          const nextDivisions = Number(divisionsRaw);
          if (!Number.isNaN(nextDivisions) && nextDivisions > 0) currentDivisions = nextDivisions;
        }

        const beatsRaw = text(attrs, 'time > beats');
        const beatTypeRaw = text(attrs, 'time > beat-type');
        if (beatsRaw && beatTypeRaw) {
          const beats = Number(beatsRaw);
          const beatType = Number(beatTypeRaw);
          if (!Number.isNaN(beats) && !Number.isNaN(beatType) && beats > 0 && beatType > 0) {
            globalTimeSig = { num: beats, den: beatType };
          }
        }

        const keyFifthsRaw = text(attrs, 'key > fifths');
        if (keyFifthsRaw !== null) {
          const fifths = Number(keyFifthsRaw);
          if (!Number.isNaN(fifths)) globalKeySig = Math.max(-7, Math.min(7, fifths));
        }
      }

      const notes: NoteOrRest[] = [];
      measureEl.querySelectorAll(':scope > note').forEach((noteEl) => {
        const isChordTone = !!noteEl.querySelector('chord');
        if (isChordTone) {
          warnings.push({
            code: 'CHORD_SIMPLIFIED',
            message: 'Chord notes were imported as sequential notes in this MVP.',
          });
        }

        const duration = parseDuration(noteEl, currentDivisions);
        const isRest = !!noteEl.querySelector('rest');

        if (isRest) {
          notes.push({
            type: 'rest',
            id: crypto.randomUUID(),
            duration,
          });
          return;
        }

        const pitch = parsePitch(noteEl);
        if (!pitch) {
          warnings.push({
            code: 'PITCH_SKIPPED',
            message: `Skipped a note with unsupported pitch in measure ${measureNumber}.`,
          });
          return;
        }

        notes.push({
          type: 'note',
          id: crypto.randomUUID(),
          pitch,
          duration,
        });
      });

      measures.push({
        id: crypto.randomUUID(),
        number: Number.isNaN(measureNumber) ? measureIndex + 1 : measureNumber,
        notes,
      });
    });

    parts.push({
      id: partId,
      name: partName,
      abbreviation: partName,
      clef: 'treble',
      measures,
    });
  });

  if (parts.length === 0) {
    throw new Error('No parts were found in MusicXML.');
  }

  return {
    score: {
      id: crypto.randomUUID(),
      metadata: {
        title,
        composer,
        tempo: 120,
        timeSig: globalTimeSig,
        keySig: globalKeySig,
      },
      parts,
    },
    warnings,
  };
}
