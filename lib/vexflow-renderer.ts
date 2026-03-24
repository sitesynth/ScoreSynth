/**
 * VexFlow rendering engine for ScoreSynth.
 *
 * Import this module only inside useEffect (browser-only).
 * Never import at the top level of a Next.js page.
 */

import type { Score, CursorPosition } from './music-model';
import type { EditorMode, StaveLayout } from './editor-state';
import { vexDuration, pitchToVexKey, pitchAccidental, beatsPerMeasure, durationBeats } from './music-model';

// ─── Layout constants ─────────────────────────────────────────────────────────

const STAVE_SPACE      = 10;   // VexFlow default: 10px between staff lines
const STAVE_HEIGHT     = 40;   // 5 lines × 10px spacing (top line to bottom line)
const PART_GAP         = 40;   // vertical gap between parts in a system
const SYSTEM_GAP       = 80;   // vertical gap between systems
const MARGIN_LEFT      = 20;
const MARGIN_RIGHT     = 20;
const MARGIN_TOP       = 10;   // title rendered in HTML above
const MIN_MEASURE_WIDTH = 120;
const NOTES_PER_BEAT_WIDTH = 40; // px per beat worth of notes
const CLEF_WIDTH       = 50;
const TIME_SIG_WIDTH   = 30;
const KEY_SIG_WIDTH    = 12;   // per accidental

// Height of one stave block (all parts stacked)
function systemHeight(numParts: number): number {
  return numParts * STAVE_HEIGHT + (numParts - 1) * PART_GAP;
}

// ─── Key signature: VexFlow spec key string ───────────────────────────────────
// VexFlow uses strings like 'C', 'G', 'D', 'F', 'Bb', etc.
const KEY_SIG_NAMES: Record<number, string> = {
  0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#',
  '-1': 'F', '-2': 'Bb', '-3': 'Eb', '-4': 'Ab', '-5': 'Db', '-6': 'Gb', '-7': 'Cb',
};

// ─── Main render function ─────────────────────────────────────────────────────

export async function renderScore(
  container: HTMLDivElement,
  score: Score,
  cursor: CursorPosition,
  mode: EditorMode,
  selectedNoteIds: Set<string>,
  zoom: number,
): Promise<StaveLayout[]> {
  // Dynamic import — only runs in browser
  const VF = await import('vexflow');
  const { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Accidental, Dot } = VF;

  container.innerHTML = '';

  // Key sig uses keySig integer from metadata
  const keySig = score.metadata.keySig;
  const keySigStr = KEY_SIG_NAMES[keySig] ?? 'C';

  const numParts = score.parts.length;
  const timeSig = score.metadata.timeSig;
  const beatsPerMeas = beatsPerMeasure(timeSig);
  const numMeasures = score.parts[0].measures.length;

  // ── Measure width calculation ────────────────────────────────────────────
  function measureMinWidth(measureIndex: number, isFirst: boolean): number {
    let maxNotes = 0;
    for (const part of score.parts) {
      const m = part.measures[measureIndex];
      if (m) maxNotes = Math.max(maxNotes, m.notes.length);
    }
    const noteWidth = Math.max(
      MIN_MEASURE_WIDTH,
      maxNotes * NOTES_PER_BEAT_WIDTH + 20,
    );
    if (isFirst) return noteWidth + CLEF_WIDTH + KEY_SIG_WIDTH * Math.abs(keySig) + TIME_SIG_WIDTH;
    return noteWidth + CLEF_WIDTH + KEY_SIG_WIDTH * Math.abs(keySig);
  }

  // ── System layout: pack measures into rows ───────────────────────────────
  const containerWidth = container.offsetWidth || 800;
  const availableWidth = containerWidth - MARGIN_LEFT - MARGIN_RIGHT;

  const systems: number[][] = []; // systems[i] = array of measureIndex
  let currentSystem: number[] = [];
  let currentWidth = 0;

  for (let m = 0; m < numMeasures; m++) {
    const isFirst = m === 0;
    const w = measureMinWidth(m, isFirst);
    if (currentSystem.length > 0 && currentWidth + w > availableWidth) {
      systems.push(currentSystem);
      currentSystem = [m];
      currentWidth = w;
    } else {
      currentSystem.push(m);
      currentWidth += w;
    }
  }
  if (currentSystem.length > 0) systems.push(currentSystem);

  // ── Total SVG height ─────────────────────────────────────────────────────
  const totalHeight = MARGIN_TOP + systems.length * (systemHeight(numParts) + SYSTEM_GAP);

  // ── Create SVG renderer ──────────────────────────────────────────────────
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(containerWidth, totalHeight);
  const context = renderer.getContext();
  context.setFont('Arial', 10);

  const layouts: StaveLayout[] = [];

  // ── Render systems ───────────────────────────────────────────────────────
  for (let sysIdx = 0; sysIdx < systems.length; sysIdx++) {
    const measureIndices = systems[sysIdx];
    const sysY = MARGIN_TOP + sysIdx * (systemHeight(numParts) + SYSTEM_GAP);

    // Distribute available width among measures in this system
    const totalMinWidth = measureIndices.reduce((sum, mIdx) => {
      return sum + measureMinWidth(mIdx, mIdx === 0);
    }, 0);
    const extraWidth = Math.max(0, availableWidth - totalMinWidth);
    const extraPerMeasure = extraWidth / measureIndices.length;

    let xPos = MARGIN_LEFT;
    const staveColumns: { x: number; width: number; measureIndex: number }[] = [];

    for (const mIdx of measureIndices) {
      const isFirst = mIdx === 0;
      const mWidth = measureMinWidth(mIdx, isFirst) + extraPerMeasure;
      staveColumns.push({ x: xPos, width: mWidth, measureIndex: mIdx });
      xPos += mWidth;
    }

    // Draw system bracket (left bracket connecting all parts)
    if (numParts > 1) {
      const bracketX = MARGIN_LEFT - 8;
      const bracketTop = sysY;
      const bracketBottom = sysY + systemHeight(numParts);
      context.fillStyle = '#111';
      context.beginPath();
      context.rect(bracketX, bracketTop, 3, bracketBottom - bracketTop);
      context.fill();
    }

    // Render each part in this system
    for (let partIdx = 0; partIdx < numParts; partIdx++) {
      const part = score.parts[partIdx];
      const partY = sysY + partIdx * (STAVE_HEIGHT + PART_GAP);

      // Render each measure in this system for this part
      for (const col of staveColumns) {
        const { x, width, measureIndex: mIdx } = col;
        const measure = part.measures[mIdx];
        const isFirstMeasure = mIdx === 0;

        // Create stave
        const stave = new Stave(x, partY, width);

        if (isFirstMeasure) {
          stave.addClef(part.clef);
          stave.addKeySignature(keySigStr);
          stave.addTimeSignature(`${timeSig.num}/${timeSig.den}`);
        } else {
          stave.addClef(part.clef);
        }

        stave.setContext(context).draw();

        // Draw measure number above first part staves (skip measure 1)
        if (partIdx === 0 && mIdx > 0) {
          context.save();
          context.setFont('Arial', 9);
          context.fillStyle = '#999';
          context.fillText(String(mIdx + 1), x + 2, partY - 5);
          context.restore();
        }

        // Build VexFlow notes for this measure
        const staveNotes: InstanceType<typeof StaveNote>[] = [];

        for (const noteOrRest of (measure?.notes ?? [])) {
          const dur = vexDuration(noteOrRest.duration);

          if (noteOrRest.type === 'note') {
            const key = pitchToVexKey(noteOrRest.pitch);
            const sn = new StaveNote({
              keys: [key],
              duration: dur,
              clef: part.clef,
              autoStem: true,
            });
            // Attach accidental if needed
            const acc = pitchAccidental(noteOrRest.pitch);
            if (acc) sn.addModifier(new Accidental(acc), 0);
            // Attach dots
            for (let d = 0; d < noteOrRest.duration.dots; d++) {
              Dot.buildAndAttach([sn], { all: true });
            }
            // Style selected notes
            if (selectedNoteIds.has(noteOrRest.id)) {
              sn.setStyle({ fillStyle: '#e67e22', strokeStyle: '#e67e22' });
            }
            staveNotes.push(sn);
          } else {
            // Rest
            const sn = new StaveNote({
              keys: [`b/${part.clef === 'bass' ? '2' : '4'}`],
              duration: dur + 'r',
              clef: part.clef,
            });
            for (let d = 0; d < noteOrRest.duration.dots; d++) {
              Dot.buildAndAttach([sn], { all: true });
            }
            staveNotes.push(sn);
          }
        }

        // If measure is empty, add a visible whole rest placeholder
        const ghostNotes: InstanceType<typeof StaveNote>[] = [];
        if (staveNotes.length === 0) {
          const ghost = new StaveNote({
            keys: [`b/${part.clef === 'bass' ? '2' : '4'}`],
            duration: 'wr',
          });
          ghost.setStyle({ fillStyle: '#bbb', strokeStyle: '#bbb' });
          ghostNotes.push(ghost);
        }

        const tickables = staveNotes.length > 0 ? staveNotes : ghostNotes;

        try {
          const voice = new Voice({ numBeats: timeSig.num, beatValue: timeSig.den });
          voice.setStrict(false);
          voice.addTickables(tickables);

          const innerWidth = width - (isFirstMeasure
            ? CLEF_WIDTH + KEY_SIG_WIDTH * Math.abs(keySig) + TIME_SIG_WIDTH
            : CLEF_WIDTH + KEY_SIG_WIDTH * Math.abs(keySig)
          );

          new Formatter()
            .joinVoices([voice])
            .format([voice], Math.max(innerWidth - 20, 40));

          voice.draw(context, stave);

          // Auto-beam eighth notes and shorter
          if (staveNotes.length > 0) {
            const beams = Beam.generateBeams(staveNotes);
            beams.forEach(beam => beam.setContext(context).draw());
          }
        } catch {
          // Formatting errors can happen with unusual note combinations; silently skip
        }

        // ── Collect layout info for hit-testing ─────────────────────────
        const notePositions: StaveLayout['notePositions'] = [];
        const cursorXPositions: number[] = [];

        let beatAcc = 0;
        for (let ni = 0; ni < (measure?.notes ?? []).length; ni++) {
          const sn = staveNotes[ni];
          if (sn) {
            try {
              const bb = sn.getBoundingBox();
              const nx = bb ? bb.getX() + bb.getW() / 2 : x + 60 + ni * NOTES_PER_BEAT_WIDTH;
              notePositions.push({
                noteId: (measure?.notes[ni] as { id: string }).id,
                x: nx,
                beatOffset: beatAcc,
              });
              cursorXPositions.push(nx - 8);
            } catch {
              cursorXPositions.push(x + 60 + ni * NOTES_PER_BEAT_WIDTH);
            }
          }
          beatAcc += durationBeats((measure?.notes[ni])?.duration ?? { base: 'quarter', dots: 0 });
        }
        // Cursor position after last note
        const lastX = staveNotes.length > 0
          ? (() => {
              try {
                const bb = staveNotes[staveNotes.length - 1].getBoundingBox();
                return bb ? bb.getX() + bb.getW() + 8 : x + width - 20;
              } catch { return x + width - 20; }
            })()
          : x + (isFirstMeasure ? CLEF_WIDTH + TIME_SIG_WIDTH + 20 : CLEF_WIDTH + 20);
        cursorXPositions.push(lastX);

        layouts.push({
          partIndex: partIdx,
          measureIndex: mIdx,
          x,
          y: partY,
          width,
          staveTopY: partY,
          staveBottomY: partY + STAVE_HEIGHT,
          clef: part.clef,
          notePositions,
          cursorXPositions,
        });
      }
    }
  }

  return layouts;
}

// ─── Click → cursor position ──────────────────────────────────────────────────

export interface ClickResult {
  partIndex: number;
  measureIndex: number;
  noteIndex: number;
  pitch: { midi: number; alter: -1|0|1 } | null;
  snappedY: number;
  staffPositionLabel: string;
}

export function resolveClick(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  zoom: number,
  layouts: StaveLayout[],
  score: Score,
): ClickResult | null {
  const scale = zoom / 100;
  const svgX = (clientX - containerRect.left) / scale;
  const svgY = (clientY - containerRect.top) / scale;

  // Find which stave was clicked
  const hit = layouts.find(l =>
    svgX >= l.x &&
    svgX <= l.x + l.width &&
    svgY >= l.staveTopY - 30 &&  // extend hit area above/below for ledger lines
    svgY <= l.staveBottomY + 30,
  );
  if (!hit) return null;

  // Find noteIndex from x position
  let noteIndex = hit.notePositions.length; // default: end of measure
  for (let i = 0; i < hit.notePositions.length; i++) {
    if (svgX < hit.notePositions[i].x) {
      noteIndex = i;
      break;
    }
  }

  // Map y → pitch
  const pitchInfo = yToPitchInfo(svgY, hit.staveTopY, hit.clef);

  return {
    partIndex: hit.partIndex,
    measureIndex: hit.measureIndex,
    noteIndex,
    pitch: pitchInfo.pitch,
    snappedY: pitchInfo.snappedY,
    staffPositionLabel: pitchInfo.staffPositionLabel,
  };
}

// ─── Y coordinate → pitch ────────────────────────────────────────────────────
//
// Treble clef staff:
//   staveTopY       = top line     = F5  (MIDI 77)
//   staveTopY + 5   = 1st space    = E5  (74)
//   staveTopY + 10  = 2nd line     = D5  (74 - wait, let me recalculate)
//
// VexFlow stave height = 40px (4 gaps × 10px).
// Lines from bottom: E4(0), G4(1), B4(2), D5(3), F5(4)  ← standard treble
// So staveTopY = F5 line, staveBottomY = E4 line.
// Going DOWN = lower pitch, each 5px = one diatonic step.
//
// Treble diatonic steps from TOP (F5, each 5px lower):
// 0: F5=77, 1: E5=76, 2: D5=74, 3: C5=72, 4: B4=71,
// 5: A4=69, 6: G4=67, 7: F4=65, 8: E4=64, 9: D4=62, 10: C4=60
// (continuing below bottom line for ledger lines)
//
// Bass clef diatonic steps from TOP (A3=57):
// 0: A3=57, 1: G3=55, 2: F3=53, 3: E3=52, 4: D3=50,
// 5: C3=48, 6: B2=47, 7: A2=45, 8: G2=43, 9: F2=41

const TREBLE_STEPS: number[] = [77,76,74,72,71, 69,67,65,64,62, 60,59,57,55,53, 52,50,48,47,45];
const BASS_STEPS:   number[] = [57,55,53,52,50, 48,47,45,43,41, 40,38,36,35,33, 31,29,28,26,24];

function yToPitchInfo(
  svgY: number,
  staveTopY: number,
  clef: 'treble' | 'bass' | 'alto',
): {
  pitch: { midi: number; alter: -1|0|1 };
  snappedY: number;
  staffPositionLabel: string;
} {
  const relY = svgY - staveTopY;
  const step = Math.round(relY / 5);
  const steps = clef === 'bass' ? BASS_STEPS : TREBLE_STEPS;
  const clampedStep = Math.max(0, Math.min(steps.length - 1, step));
  const midi = steps[clampedStep];
  const snappedY = staveTopY + clampedStep * 5;
  // Determine if this is a black key
  const pc = midi % 12;
  const isBlack = [false, true, false, true, false, false, true, false, true, false, true, false][pc];
  const isLine = clampedStep % 2 === 0;
  const slotIndexFromTop = Math.floor(clampedStep / 2) + 1;
  const inStaff = clampedStep >= 0 && clampedStep <= 8;
  const labelPrefix = isLine ? 'Line' : 'Space';
  const slotIndexFromBottom = Math.max(1, 6 - slotIndexFromTop);
  const staffPositionLabel = inStaff
    ? `${labelPrefix} ${slotIndexFromBottom}`
    : isLine
      ? 'Ledger line'
      : 'Ledger space';

  return {
    pitch: { midi, alter: isBlack ? 1 : 0 },
    snappedY,
    staffPositionLabel,
  }; // default to sharp if black key
}
