/**
 * Tone.js audio player for ScoreSynth.
 * Must only be used in browser (useEffect / click handlers).
 */

import type { Score } from './music-model';
import { durationBeats } from './music-model';

interface ScheduledEvent {
  time: number;    // seconds from start
  midi: number;
  duration: number; // seconds
}

// Lazy singletons — only created after a user gesture
let synthReady = false;
let synth: import('tone').PolySynth | null = null;
let toneLib: typeof import('tone') | null = null;

async function getTone(): Promise<typeof import('tone')> {
  if (!toneLib) toneLib = await import('tone');
  return toneLib;
}

export async function initPlayer(): Promise<void> {
  if (synthReady) return;
  const Tone = await getTone();
  await Tone.start(); // requires user gesture
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 1.0 },
    volume: -6,
  }).toDestination();
  synthReady = true;
}

function scoreToEvents(score: Score, tempo: number): ScheduledEvent[] {
  const secPerBeat = 60 / tempo;
  const events: ScheduledEvent[] = [];

  for (const part of score.parts) {
    let beatTime = 0;
    for (const measure of part.measures) {
      for (const noteOrRest of measure.notes) {
        const beats = durationBeats(noteOrRest.duration);
        if (noteOrRest.type === 'note') {
          events.push({
            time: beatTime * secPerBeat,
            midi: noteOrRest.pitch.midi,
            duration: beats * secPerBeat * 0.85,
          });
        }
        beatTime += beats;
      }
    }
  }

  return events.sort((a, b) => a.time - b.time);
}

function midiToNoteName(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = notes[midi % 12];
  return `${note}${octave}`;
}

let onStopCallback: (() => void) | null = null;

export async function playScore(
  score: Score,
  tempo: number,
  onBeat: (beat: number) => void,
  onStop?: () => void,
): Promise<void> {
  await initPlayer();
  const Tone = await getTone();
  if (!synth) return;

  Tone.getTransport().stop();
  Tone.getTransport().cancel();
  Tone.getTransport().bpm.value = tempo;

  onStopCallback = onStop ?? null;

  const events = scoreToEvents(score, tempo);
  if (events.length === 0) return;

  const totalDuration = events[events.length - 1].time + events[events.length - 1].duration + 0.5;

  events.forEach(e => {
    Tone.getTransport().schedule((time) => {
      try {
        synth!.triggerAttackRelease(midiToNoteName(e.midi), e.duration, time);
      } catch {
        // Invalid note name; skip
      }
    }, e.time);
  });

  // Beat callback — fires every 16th note for smooth cursor movement
  const secPerBeat = 60 / tempo;
  Tone.getTransport().scheduleRepeat((time) => {
    const beat = Tone.getTransport().seconds / secPerBeat;
    Tone.getDraw().schedule(() => onBeat(beat), time);
  }, '16n');

  // Schedule stop at the end
  Tone.getTransport().schedule(() => {
    Tone.getDraw().schedule(() => {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      onBeat(0);
      if (onStopCallback) onStopCallback();
    }, '+0.01');
  }, totalDuration);

  Tone.getTransport().start();
}

export async function pausePlayback(): Promise<void> {
  const Tone = await getTone();
  Tone.getTransport().pause();
}

export async function stopPlayback(): Promise<void> {
  const Tone = await getTone();
  Tone.getTransport().stop();
  Tone.getTransport().cancel();
  if (onStopCallback) {
    onStopCallback();
    onStopCallback = null;
  }
}

export async function resumePlayback(): Promise<void> {
  const Tone = await getTone();
  Tone.getTransport().start();
}

export function isTransportRunning(): boolean {
  return toneLib ? toneLib.getTransport().state === 'started' : false;
}
