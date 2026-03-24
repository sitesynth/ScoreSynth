import type { Score } from './music-model';
import { durationBeats } from './music-model';

const TICKS_PER_BEAT = 480;

function writeVarLen(value: number): number[] {
  const bytes: number[] = [];
  bytes.push(value & 0x7f);
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7f) | 0x80);
    value >>= 7;
  }
  return bytes;
}

function writeUint32BE(value: number): number[] {
  return [(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function writeUint16BE(value: number): number[] {
  return [(value >> 8) & 0xff, value & 0xff];
}

interface MidiEvent {
  tick: number;
  data: number[];
}

export function exportMIDI(score: Score): Uint8Array {
  const tempo = score.metadata.tempo;
  const microsecondsPerBeat = Math.round(60_000_000 / tempo);

  const tracks: number[][] = [];

  // Track 0: tempo track
  const tempoTrack: number[] = [
    ...writeVarLen(0),
    0xFF, 0x51, 0x03,
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff,
    ...writeVarLen(0),
    0xFF, 0x2F, 0x00,
  ];
  tracks.push(tempoTrack);

  for (let pi = 0; pi < score.parts.length; pi++) {
    const part = score.parts[pi];
    // skip drum channel (9), use channels 0,1,2...8,10,11...
    const ch = pi < 9 ? pi : pi + 1;
    const channel = ch % 16;

    const events: MidiEvent[] = [];
    events.push({ tick: 0, data: [0xC0 | channel, 0] }); // program: piano

    let currentTick = 0;
    for (const measure of part.measures) {
      for (const noteOrRest of measure.notes) {
        const beats = durationBeats(noteOrRest.duration);
        const durationTicks = Math.round(beats * TICKS_PER_BEAT);
        if (noteOrRest.type === 'note') {
          const midi = Math.max(0, Math.min(127, noteOrRest.pitch.midi));
          events.push({ tick: currentTick, data: [0x90 | channel, midi, 80] });
          events.push({ tick: currentTick + Math.round(durationTicks * 0.9), data: [0x80 | channel, midi, 0] });
        }
        currentTick += durationTicks;
      }
    }
    events.push({ tick: currentTick, data: [0xFF, 0x2F, 0x00] });
    events.sort((a, b) => a.tick - b.tick || (a.data[0] === 0x80 ? 1 : -1));

    const trackBytes: number[] = [];
    let lastTick = 0;
    for (const event of events) {
      const delta = event.tick - lastTick;
      lastTick = event.tick;
      trackBytes.push(...writeVarLen(delta), ...event.data);
    }
    tracks.push(trackBytes);
  }

  const numTracks = tracks.length;
  const bytes: number[] = [
    0x4D, 0x54, 0x68, 0x64,
    ...writeUint32BE(6),
    ...writeUint16BE(1),
    ...writeUint16BE(numTracks),
    ...writeUint16BE(TICKS_PER_BEAT),
  ];
  for (const track of tracks) {
    bytes.push(0x4D, 0x54, 0x72, 0x6B, ...writeUint32BE(track.length), ...track);
  }
  return new Uint8Array(bytes);
}

export function downloadMIDI(score: Score): void {
  const data = exportMIDI(score);
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${score.metadata.title || 'score'}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
