'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Note, Rest, Duration, DurationBase,
  letterToPitch, transposePitch,
  beatsPerMeasure, getMeasureBeats,
} from '@/lib/music-model';
import { useScore } from '@/lib/score-reducer';
import { useEditorState, DURATION_KEY_MAP, StaveLayout } from '@/lib/editor-state';
import { renderScore, resolveClick } from '@/lib/vexflow-renderer';
import { playScore, pausePlayback, stopPlayback } from '@/lib/tone-player';
import { downloadMIDI } from '@/lib/midi-export';
import { importMusicXml } from '@/lib/musicxml-import';

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  bg: '#1a1312',
  topbar: '#111010',
  panel: '#1a1312',
  canvas: '#2a2524',
  border: 'rgba(255,255,255,0.07)',
  borderLight: 'rgba(255,255,255,0.05)',
  text: '#e0d6d3',
  muted: '#6b5452',
  dimmed: '#9a8a88',
  red: '#c0392b',
  blue: '#4dabf7',
  btnBg: 'rgba(255,255,255,0.06)',
  btnBorder: 'rgba(255,255,255,0.1)',
};

// ─── Right panel helpers ──────────────────────────────────────────────────────

function Section({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [expanded, setExpanded] = useState(open);
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer',
          color: C.text, fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
        }}
      >
        {title}
        <svg width="12" height="12" fill="none" stroke={C.muted} strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {expanded && <div style={{ padding: '0 16px 14px' }}>{children}</div>}
    </div>
  );
}

function PillToggle({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
          fontSize: '11.5px', fontFamily: 'inherit', transition: 'all 0.15s',
          background: value === o ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: value === o ? C.text : C.muted,
        }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function RowField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: '11.5px', color: C.muted }}>{label}</span>
      {children}
    </div>
  );
}

function SmallSelect({ value, options }: { value: string; options: string[] }) {
  return (
    <select defaultValue={value} style={{
      padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.btnBorder}`,
      background: C.btnBg, color: C.text, fontSize: '11.5px', cursor: 'pointer',
      fontFamily: 'inherit', outline: 'none',
    }}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

function ColorSwatch({ color, hex }: { color: string; hex: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 20, height: 20, background: color, border: '1px solid rgba(0,0,0,0.25)', borderRadius: 3, cursor: 'pointer' }} />
      <span style={{ fontSize: '11px', color: C.muted, fontFamily: 'monospace' }}>{hex}</span>
    </div>
  );
}

function InstrumentRow({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderRadius: 6 }}>
      <div style={{ width: 3, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '12px', color: C.dimmed, flex: 1 }}>{label}</span>
      <svg width="12" height="12" fill="none" stroke={C.muted} strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    </div>
  );
}

// ─── Toolbar helpers ──────────────────────────────────────────────────────────

function ToolBtn({
  children, active = false, label, onClick,
}: {
  children: React.ReactNode; active?: boolean; label?: string; onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 34, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? C.red : hov ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active ? '#fff' : C.text,
        fontSize: '14px', transition: 'all 0.1s', flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 22, background: C.border, flexShrink: 0, margin: '0 2px' }} />;
}

function TabPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
      fontSize: '11.5px', fontFamily: 'inherit', transition: 'all 0.15s',
      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
      color: active ? C.text : C.muted,
    }}>
      {label}
    </button>
  );
}

// ─── Note/duration data ───────────────────────────────────────────────────────

const NOTE_DURATIONS: { sym: string; label: string; base: DurationBase; dots: 0|1|2 }[] = [
  { sym: '𝅘𝅥𝅯', label: '16th note (3)',  base: '16th',    dots: 0 },
  { sym: '♪',   label: 'Eighth note (4)', base: 'eighth',  dots: 0 },
  { sym: '♩',   label: 'Quarter note (5)',base: 'quarter', dots: 0 },
  { sym: '♩.',  label: 'Dotted quarter',  base: 'quarter', dots: 1 },
  { sym: '𝅗𝅥',  label: 'Half note (6)',   base: 'half',    dots: 0 },
  { sym: '𝅗𝅥.', label: 'Dotted half',     base: 'half',    dots: 1 },
  { sym: '○',   label: 'Whole note (7)',  base: 'whole',   dots: 0 },
];

const REST_DURATIONS: { sym: string; label: string; base: DurationBase }[] = [
  { sym: '𝄿', label: '16th rest',    base: '16th'    },
  { sym: '𝄽', label: 'Eighth rest',  base: 'eighth'  },
  { sym: '𝄼', label: 'Quarter rest', base: 'quarter' },
  { sym: '𝄻', label: 'Half rest',    base: 'half'    },
  { sym: '𝄺', label: 'Whole rest',   base: 'whole'   },
];

// ─── Toolbar rows ─────────────────────────────────────────────────────────────

function RhythmsRow({
  mode, selectedDuration, pendingAlter,
  onExitNoteInput, onSelectDuration, onInsertRest, onToggleDot, onSetAlter,
}: {
  mode: 'normal'|'note-input';
  selectedDuration: Duration;
  pendingAlter: -1|0|1;
  onExitNoteInput: () => void;
  onSelectDuration: (base: DurationBase, dots?: 0|1|2) => void;
  onInsertRest: (base: DurationBase) => void;
  onToggleDot: () => void;
  onSetAlter: (a: -1|0|1) => void;
}) {
  const isDurationActive = (base: DurationBase, dots: 0|1|2) =>
    mode === 'note-input' && selectedDuration.base === base && selectedDuration.dots === dots;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
      {/* Select cursor */}
      <ToolBtn active={mode === 'normal'} label="Select (Escape)" onClick={onExitNoteInput}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2 2L2 10L5 8L6.5 11L8 10.5L6.5 7.5L9.5 7.5L2 2Z" fill="currentColor" />
        </svg>
      </ToolBtn>
      <Divider />
      {/* Note durations */}
      {NOTE_DURATIONS.map((n, i) => (
        <ToolBtn key={i}
          active={isDurationActive(n.base, n.dots)}
          label={n.label}
          onClick={() => onSelectDuration(n.base, n.dots)}
        >
          <span style={{ fontSize: '13px', lineHeight: 1 }}>{n.sym}</span>
        </ToolBtn>
      ))}
      <Divider />
      {/* Rests */}
      {REST_DURATIONS.map((r, i) => (
        <ToolBtn key={i} label={r.label} onClick={() => onInsertRest(r.base)}>
          <span style={{ fontSize: '13px', lineHeight: 1 }}>{r.sym}</span>
        </ToolBtn>
      ))}
      <Divider />
      {/* Accidentals + dot */}
      <ToolBtn active={pendingAlter === 1}  label="Sharp (#)"  onClick={() => onSetAlter(pendingAlter === 1  ? 0 : 1)}>
        <span style={{ fontSize: '13px', lineHeight: 1 }}>♯</span>
      </ToolBtn>
      <ToolBtn active={pendingAlter === -1} label="Flat (b)"   onClick={() => onSetAlter(pendingAlter === -1 ? 0 : -1)}>
        <span style={{ fontSize: '13px', lineHeight: 1 }}>♭</span>
      </ToolBtn>
      <ToolBtn active={pendingAlter === 0 && mode === 'note-input'} label="Natural" onClick={() => onSetAlter(0)}>
        <span style={{ fontSize: '13px', lineHeight: 1 }}>♮</span>
      </ToolBtn>
      <ToolBtn active={selectedDuration.dots > 0} label="Dot (.)" onClick={onToggleDot}>
        <span style={{ fontSize: '13px', lineHeight: 1 }}>·</span>
      </ToolBtn>
    </div>
  );
}

function PitchRow({
  onInsertNote, onTranspose,
}: {
  onInsertNote: (letter: string) => void;
  onTranspose: (semitones: number) => void;
}) {
  const noteLetters = ['C','D','E','F','G','A','B'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
      {noteLetters.map(l => (
        <ToolBtn key={l} label={`${l} note`} onClick={() => onInsertNote(l)}>
          <span style={{ fontSize: '13px', fontFamily: 'sans-serif' }}>{l}</span>
        </ToolBtn>
      ))}
      <Divider />
      <ToolBtn label="Octave up (Alt+↑)"    onClick={() => onTranspose(12)}>
        <span style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>8va</span>
      </ToolBtn>
      <ToolBtn label="Octave down (Alt+↓)"  onClick={() => onTranspose(-12)}>
        <span style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>8vb</span>
      </ToolBtn>
      <ToolBtn label="Semitone up (↑)"   onClick={() => onTranspose(1)}>
        <span style={{ fontSize: '10px' }}>↑½</span>
      </ToolBtn>
      <ToolBtn label="Semitone down (↓)" onClick={() => onTranspose(-1)}>
        <span style={{ fontSize: '10px' }}>↓½</span>
      </ToolBtn>
    </div>
  );
}

function StructureRow() {
  const tools = ['||:',':|:',':|','𝄇','1st','2nd','D.C.','D.S.','Fine','Coda','𝄋','Sect.','Rehearsal','Sys. break','Pg. break'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
      {tools.map((t, i) => (
        <ToolBtn key={i} label={t}>
          <span style={{ fontSize: '10.5px', fontFamily: 'serif' }}>{t}</span>
        </ToolBtn>
      ))}
    </div>
  );
}

function ExpressionRow() {
  const tools = ['pp','p','mp','mf','f','ff','fff','fp','sfz','fz','＜','＞','~','⌢','tr','marc.','ten.','pizz.','arco'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
      {tools.map((t, i) => (
        <ToolBtn key={i} label={t}>
          <span style={{ fontSize: t.length > 2 ? '10px' : '12px', fontFamily: 'Georgia, serif', fontStyle: t.length > 2 ? 'normal' : 'italic' }}>{t}</span>
        </ToolBtn>
      ))}
    </div>
  );
}

function SymbolsRow() {
  const tools = ['𝄐','𝄑','↑','↓','○','+','◇','sul pont.','ord.','sord.','div.','unis.','flutter','col legno','Open','Stopped'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
      {tools.map((t, i) => (
        <ToolBtn key={i} label={t}>
          <span style={{ fontSize: t.length > 2 ? '10px' : '13px', fontFamily: 'serif' }}>{t}</span>
        </ToolBtn>
      ))}
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function EditorPage() {
  // ── State ────────────────────────────────────────────────────────────────
  const {
    score, cursor,
    insertNote, insertRest, deleteNotes, changePitch, moveCursor,
    undo, redo, canUndo, canRedo, addMeasure, loadScore,
    setKeySig, setTimeSig, dispatch,
  } = useScore();

  const {
    mode, selectedDuration, selectedNoteIds, isPlaying, playbackBeat,
    pendingAlter, setPendingAlter,
    selectNote, clearSelection,
    enterNoteInput, exitNoteInput,
    toggleDot, selectDuration,
    setIsPlaying, setPlaybackBeat,
  } = useEditorState();

  const [composerDraft, setComposerDraft] = useState('');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
  const [view, setView] = useState<'General' | 'Play'>('General');
  const [toolTab, setToolTab] = useState<'Rhythms' | 'Pitch & Staff' | 'Structure' | 'Expression' | 'Symbols'>('Rhythms');
  const [zoom, setZoom] = useState(100);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'ok' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [hoverSnap, setHoverSnap] = useState<{
    x: number;
    y: number;
    staveX: number;
    staveWidth: number;
    label: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // VexFlow refs
  const vexContainerRef = useRef<HTMLDivElement>(null);
  const staveLayoutsRef = useRef<StaveLayout[]>([]);
  const [staveLayouts, setStaveLayouts] = useState<StaveLayout[]>([]);
  const [svgHeight, setSvgHeight] = useState(400);

  // Last inserted MIDI (for smart octave selection)
  const lastMidiRef = useRef<number | null>(null);

  // ── VexFlow re-render ─────────────────────────────────────────────────────
  useEffect(() => {
    const container = vexContainerRef.current;
    if (!container) return;
    let cancelled = false;

    renderScore(container, score, cursor, mode, selectedNoteIds, zoom)
      .then(layouts => {
        if (cancelled) return;
        staveLayoutsRef.current = layouts;
        setStaveLayouts(layouts);
        // Track SVG height for overlay
        const svg = container.querySelector('svg');
        if (svg) setSvgHeight(Number(svg.getAttribute('height') || 400));
      })
      .catch(err => {
        if (!cancelled) console.error('VexFlow render error:', err);
      });

    return () => { cancelled = true; };
  }, [score, cursor, mode, selectedNoteIds, zoom]);

  // ResizeObserver for re-render on container resize
  useEffect(() => {
    const container = vexContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      // Trigger re-render by nudging score reference (no-op)
      renderScore(container, score, cursor, mode, selectedNoteIds, zoom)
        .then(layouts => {
          staveLayoutsRef.current = layouts;
          setStaveLayouts(layouts);
          const svg = container.querySelector('svg');
          if (svg) setSvgHeight(Number(svg.getAttribute('height') || 400));
        })
        .catch(() => {});
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [score, cursor, mode, selectedNoteIds, zoom]);

  // ── Note insertion helpers ────────────────────────────────────────────────

  const doInsertNote = useCallback((letter: string) => {
    const pitch = letterToPitch(letter, lastMidiRef.current, pendingAlter);
    const note: Note = {
      type: 'note',
      id: crypto.randomUUID(),
      pitch,
      duration: selectedDuration,
    };
    insertNote(note);
    lastMidiRef.current = pitch.midi;
  }, [selectedDuration, pendingAlter, insertNote]);

  const doInsertRest = useCallback((base?: DurationBase) => {
    const rest: Rest = {
      type: 'rest',
      id: crypto.randomUUID(),
      duration: base ? { base, dots: 0 } : selectedDuration,
    };
    insertRest(rest);
  }, [selectedDuration, insertRest]);

  const doTransposeSelected = useCallback((semitones: number) => {
    if (selectedNoteIds.size === 0) return;
    for (const noteId of selectedNoteIds) {
      // Find note in score
      for (const part of score.parts) {
        for (const measure of part.measures) {
          const n = measure.notes.find(x => x.id === noteId && x.type === 'note');
          if (n && n.type === 'note') {
            const newPitch = transposePitch(n.pitch, semitones);
            changePitch(noteId, newPitch.midi, newPitch.alter);
          }
        }
      }
    }
  }, [selectedNoteIds, score, changePitch]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  // Use refs to avoid stale closures without re-adding listener
  const modeRef = useRef(mode);
  const selectedDurationRef = useRef(selectedDuration);
  const selectedNoteIdsRef = useRef(selectedNoteIds);
  const cursorRef = useRef(cursor);
  const isPlayingRef = useRef(isPlaying);

  modeRef.current = mode;
  selectedDurationRef.current = selectedDuration;
  selectedNoteIdsRef.current = selectedNoteIds;
  cursorRef.current = cursor;
  isPlayingRef.current = isPlaying;

  const doInsertNoteRef = useRef(doInsertNote);
  const doInsertRestRef = useRef(doInsertRest);
  const doTransposeSelectedRef = useRef(doTransposeSelected);
  const deleteNotesRef = useRef(deleteNotes);
  const moveCursorRef = useRef(moveCursor);
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  const setPlaybackBeatRef = useRef(setPlaybackBeat);
  const setIsPlayingRef = useRef(setIsPlaying);

  doInsertNoteRef.current = doInsertNote;
  doInsertRestRef.current = doInsertRest;
  doTransposeSelectedRef.current = doTransposeSelected;
  deleteNotesRef.current = deleteNotes;
  moveCursorRef.current = moveCursor;
  undoRef.current = undo;
  redoRef.current = redo;
  setPlaybackBeatRef.current = setPlaybackBeat;
  setIsPlayingRef.current = setIsPlaying;

  // Stable refs for enterNoteInput / exitNoteInput / toggleDot / clearSelection / selectDuration
  const enterNoteInputRef = useRef(enterNoteInput);
  const exitNoteInputRef  = useRef(exitNoteInput);
  const toggleDotRef      = useRef(toggleDot);
  const clearSelectionRef = useRef(clearSelection);
  const selectDurationRef = useRef(selectDuration);
  enterNoteInputRef.current = enterNoteInput;
  exitNoteInputRef.current  = exitNoteInput;
  toggleDotRef.current      = toggleDot;
  clearSelectionRef.current = clearSelection;
  selectDurationRef.current = selectDuration;

  const pendingAlterRef = useRef(pendingAlter);
  pendingAlterRef.current = pendingAlter;
  const setPendingAlterRef = useRef(setPendingAlter);
  setPendingAlterRef.current = setPendingAlter;

  const scoreRef = useRef(score);
  scoreRef.current = score;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const cur = cursorRef.current;
      const m = modeRef.current;

      // Ctrl+Z / Ctrl+Y = undo/redo (always)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undoRef.current(); e.preventDefault(); return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Z')) {
        redoRef.current(); e.preventDefault(); return;
      }

      // N = enter note input
      if (e.key === 'n' || e.key === 'N') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          enterNoteInputRef.current(); e.preventDefault(); return;
        }
      }

      // Escape = exit note input / clear selection
      if (e.key === 'Escape') {
        exitNoteInputRef.current();
        clearSelectionRef.current();
        e.preventDefault(); return;
      }

      // Space = play/pause
      if (e.key === ' ') {
        e.preventDefault();
        document.getElementById('play-pause-btn')?.click();
        return;
      }

      // Delete / Backspace = delete selected notes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = [...selectedNoteIdsRef.current];
        if (ids.length > 0) {
          deleteNotesRef.current(ids);
          clearSelectionRef.current();
          e.preventDefault();
        }
        return;
      }

      if (m === 'note-input') {
        // Duration keys 1-7
        const durMap: Record<string, DurationBase> = DURATION_KEY_MAP;
        if (durMap[e.key] && !e.ctrlKey && !e.altKey) {
          selectDurationRef.current(durMap[e.key]);
          e.preventDefault(); return;
        }

        // Dot
        if (e.key === '.') { toggleDotRef.current(); e.preventDefault(); return; }

        // # = sharp
        if (e.key === '#') { setPendingAlterRef.current(1); e.preventDefault(); return; }
        // - = flat (Sibelius uses -)
        if (e.key === '-' && !e.ctrlKey) { setPendingAlterRef.current(pendingAlterRef.current === -1 ? 0 : -1); e.preventDefault(); return; }

        // A-G = insert note
        const noteKeys: Record<string, string> = { a:'a',b:'b',c:'c',d:'d',e:'e',f:'f',g:'g' };
        if (noteKeys[e.key.toLowerCase()] && !e.ctrlKey && !e.altKey) {
          doInsertNoteRef.current(e.key.toLowerCase());
          e.preventDefault(); return;
        }

        // R = insert rest
        if (e.key === 'r' || e.key === 'R') {
          doInsertRestRef.current(); e.preventDefault(); return;
        }

        // Arrow keys for cursor movement / pitch transposition
        if (e.key === 'ArrowUp') {
          if (e.altKey) doTransposeSelectedRef.current(12);
          else doTransposeSelectedRef.current(1);
          e.preventDefault(); return;
        }
        if (e.key === 'ArrowDown') {
          if (e.altKey) doTransposeSelectedRef.current(-12);
          else doTransposeSelectedRef.current(-1);
          e.preventDefault(); return;
        }

        // Arrow right/left = advance/retreat cursor
        if (e.key === 'ArrowRight') {
          const sc = scoreRef.current;
          const part = sc.parts[cur.partIndex];
          if (!part) return;
          const measure = part.measures[cur.measureIndex];
          if (!measure) return;
          if (cur.noteIndex < measure.notes.length) {
            moveCursorRef.current({ ...cur, noteIndex: cur.noteIndex + 1 });
          } else if (cur.measureIndex + 1 < part.measures.length) {
            moveCursorRef.current({ ...cur, measureIndex: cur.measureIndex + 1, noteIndex: 0 });
          }
          e.preventDefault(); return;
        }
        if (e.key === 'ArrowLeft') {
          if (cur.noteIndex > 0) {
            moveCursorRef.current({ ...cur, noteIndex: cur.noteIndex - 1 });
          } else if (cur.measureIndex > 0) {
            const sc = scoreRef.current;
            const prevMeasure = sc.parts[cur.partIndex].measures[cur.measureIndex - 1];
            moveCursorRef.current({ ...cur, measureIndex: cur.measureIndex - 1, noteIndex: prevMeasure.notes.length });
          }
          e.preventDefault(); return;
        }
      }

      // In normal mode: arrow keys move cursor too
      if (m === 'normal') {
        const durMap: Record<string, DurationBase> = DURATION_KEY_MAP;
        if (durMap[e.key] && !e.ctrlKey && !e.altKey) {
          enterNoteInputRef.current();
          selectDurationRef.current(durMap[e.key]);
          e.preventDefault(); return;
        }

        if (e.key === '.' && !e.ctrlKey && !e.altKey) {
          enterNoteInputRef.current();
          toggleDotRef.current();
          e.preventDefault(); return;
        }

        const noteKeys: Record<string, string> = { a:'a',b:'b',c:'c',d:'d',e:'e',f:'f',g:'g' };
        if (noteKeys[e.key.toLowerCase()] && !e.ctrlKey && !e.altKey) {
          enterNoteInputRef.current();
          doInsertNoteRef.current(e.key.toLowerCase());
          e.preventDefault(); return;
        }

        if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.altKey) {
          enterNoteInputRef.current();
          doInsertRestRef.current();
          e.preventDefault(); return;
        }

        if (e.key === 'ArrowRight') {
          const sc = scoreRef.current;
          const part = sc.parts[cur.partIndex];
          if (!part) { e.preventDefault(); return; }
          const measure = part.measures[cur.measureIndex];
          if (!measure) { e.preventDefault(); return; }
          if (cur.noteIndex < measure.notes.length) {
            moveCursorRef.current({ ...cur, noteIndex: cur.noteIndex + 1 });
          } else if (cur.measureIndex + 1 < part.measures.length) {
            moveCursorRef.current({ ...cur, measureIndex: cur.measureIndex + 1, noteIndex: 0 });
          }
          e.preventDefault(); return;
        }
        if (e.key === 'ArrowLeft') {
          if (cur.noteIndex > 0) {
            moveCursorRef.current({ ...cur, noteIndex: cur.noteIndex - 1 });
          } else if (cur.measureIndex > 0) {
            const sc = scoreRef.current;
            const prevMeasure = sc.parts[cur.partIndex].measures[cur.measureIndex - 1];
            moveCursorRef.current({ ...cur, measureIndex: cur.measureIndex - 1, noteIndex: prevMeasure.notes.length });
          }
          e.preventDefault(); return;
        }
        if (e.key === 'ArrowUp' && selectedNoteIdsRef.current.size > 0 && !e.altKey) {
          doTransposeSelectedRef.current(1); e.preventDefault(); return;
        }
        if (e.key === 'ArrowDown' && selectedNoteIdsRef.current.size > 0 && !e.altKey) {
          doTransposeSelectedRef.current(-1); e.preventDefault(); return;
        }
        if (e.key === 'ArrowUp' && selectedNoteIdsRef.current.size > 0 && e.altKey) {
          doTransposeSelectedRef.current(12); e.preventDefault(); return;
        }
        if (e.key === 'ArrowDown' && selectedNoteIdsRef.current.size > 0 && e.altKey) {
          doTransposeSelectedRef.current(-12); e.preventDefault(); return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // stable effect — uses refs

  // ── Score canvas click handler ────────────────────────────────────────────

  const handleScoreClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = vexContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const layouts = staveLayoutsRef.current;

    const result = resolveClick(e.clientX, e.clientY, rect, zoom, layouts, score);
    if (!result) { clearSelection(); return; }

    if (mode === 'note-input' && result.pitch) {
      // Insert note at clicked pitch
      const note: Note = {
        type: 'note',
        id: crypto.randomUUID(),
        pitch: result.pitch,
        duration: selectedDuration,
      };
      lastMidiRef.current = result.pitch.midi;
      dispatch({ type: 'INSERT_NOTE', partIndex: result.partIndex, measureIndex: result.measureIndex, noteIndex: result.noteIndex, note });
    } else {
      // Normal mode: check if we clicked on an existing note
      const layout = layouts.find(l => l.partIndex === result.partIndex && l.measureIndex === result.measureIndex);
      if (layout) {
        // Find the nearest note to the click x
        const rect2 = container.getBoundingClientRect();
        const clickX = (e.clientX - rect2.left) / (zoom / 100);
        let closest: string | null = null;
        let minDist = 15; // threshold in px
        for (const np of layout.notePositions) {
          const dist = Math.abs(np.x - clickX);
          if (dist < minDist) { minDist = dist; closest = np.noteId; }
        }
        if (closest) {
          selectNote(closest, e.shiftKey);
        } else {
          clearSelection();
          moveCursor({ partIndex: result.partIndex, measureIndex: result.measureIndex, noteIndex: result.noteIndex });
        }
      }
    }
  }, [mode, selectedDuration, zoom, moveCursor, selectNote, clearSelection, score, dispatch]);

  const handleScoreDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = vexContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const layouts = staveLayoutsRef.current;
    const result = resolveClick(e.clientX, e.clientY, rect, zoom, layouts, score);
    if (!result) return;
    enterNoteInput();
    moveCursor({ partIndex: result.partIndex, measureIndex: result.measureIndex, noteIndex: result.noteIndex });
  }, [zoom, score, enterNoteInput, moveCursor]);

  const handleScoreMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = vexContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const layouts = staveLayoutsRef.current;
    const result = resolveClick(e.clientX, e.clientY, rect, zoom, layouts, score);

    if (!result || !result.pitch) {
      setHoverSnap(null);
      return;
    }

    const layout = layouts.find(
      (l) => l.partIndex === result.partIndex && l.measureIndex === result.measureIndex,
    );
    if (!layout) {
      setHoverSnap(null);
      return;
    }

    const pitchNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const pc = result.pitch.midi % 12;
    const octave = Math.floor(result.pitch.midi / 12) - 1;
    const pitchLabel = `${pitchNames[pc]}${octave}`;

    const cursorX =
      layout.cursorXPositions[Math.min(result.noteIndex, layout.cursorXPositions.length - 1)] ??
      layout.x + 50;

    setHoverSnap({
      x: cursorX,
      y: result.snappedY,
      staveX: layout.x,
      staveWidth: layout.width,
      label: `${pitchLabel} • ${result.staffPositionLabel}`,
    });
  }, [zoom, score]);

  const handleScoreMouseLeave = useCallback(() => {
    setHoverSnap(null);
  }, []);

  // ── Playback ──────────────────────────────────────────────────────────────

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pausePlayback();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await playScore(
        score,
        score.metadata.tempo,
        (beat) => setPlaybackBeat(beat),
        () => { setIsPlaying(false); setPlaybackBeat(0); },
      );
    }
  }, [isPlaying, score, setIsPlaying, setPlaybackBeat]);

  const handleStop = useCallback(async () => {
    await stopPlayback();
    setIsPlaying(false);
    setPlaybackBeat(0);
  }, [setIsPlaying, setPlaybackBeat]);

  const handlePickImportFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const readMusicXmlFromMxl = useCallback(async (file: File): Promise<string> => {
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());

    let xmlEntry: { async: (type: 'text') => Promise<string> } | null = null;

    const containerEntry = zip.file('META-INF/container.xml');
    if (containerEntry) {
      const containerText = await containerEntry.async('text');
      const containerDoc = new DOMParser().parseFromString(containerText, 'application/xml');
      const rootPath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');
      if (rootPath) {
        xmlEntry = zip.file(rootPath) ?? zip.file(rootPath.replaceAll('\\', '/'));
      }
    }

    if (!xmlEntry) {
      const fallback = zip
        .filter((path) =>
          !path.startsWith('META-INF/') &&
          (path.toLowerCase().endsWith('.musicxml') || path.toLowerCase().endsWith('.xml')),
        )
        .sort((a, b) => a.name.length - b.name.length);
      xmlEntry = fallback[0] ?? null;
    }

    if (!xmlEntry) {
      throw new Error('Could not find MusicXML inside MXL archive.');
    }

    return xmlEntry.async('text');
  }, []);

  const handleImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.sib')) {
        setImportStatus({
          type: 'error',
          message: 'SIB is not directly supported in browser. Export this file from Sibelius as MusicXML and import again.',
        });
        return;
      }

      if (lowerName.endsWith('.mid') || lowerName.endsWith('.midi')) {
        setImportStatus({
          type: 'error',
          message: 'MIDI import is planned next. Please use MusicXML for notation import right now.',
        });
        return;
      }

      if (!lowerName.endsWith('.xml') && !lowerName.endsWith('.musicxml') && !lowerName.endsWith('.mxl')) {
        setImportStatus({
          type: 'error',
          message: 'Unsupported format. Use .musicxml, .xml, or .mxl exported from Sibelius.',
        });
        return;
      }

      const xml = lowerName.endsWith('.mxl')
        ? await readMusicXmlFromMxl(file)
        : await file.text();
      const result = importMusicXml(xml, file.name.replace(/\.[^/.]+$/, ''));

      loadScore(result.score);
      clearSelection();
      exitNoteInput();
      setPlaybackBeat(0);

      const warningSuffix = result.warnings.length > 0 ? ` Imported with ${result.warnings.length} warning(s).` : '';
      setImportStatus({
        type: 'ok',
        message: `Imported ${file.name}.${warningSuffix}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import file.';
      setImportStatus({ type: 'error', message });
    } finally {
      event.target.value = '';
    }
  }, [loadScore, clearSelection, exitNoteInput, setPlaybackBeat, readMusicXmlFromMxl]);

  // ── Cursor overlay position ───────────────────────────────────────────────

  const getCursorX = (): number | null => {
    if (mode !== 'note-input') return null;
    const layout = staveLayouts.find(
      l => l.partIndex === cursor.partIndex && l.measureIndex === cursor.measureIndex,
    );
    if (!layout) return null;
    const idx = Math.min(cursor.noteIndex, layout.cursorXPositions.length - 1);
    return layout.cursorXPositions[idx] ?? null;
  };

  const getCursorY = (): { top: number; bottom: number } | null => {
    if (mode !== 'note-input') return null;
    const measureLayouts = staveLayouts.filter(l => l.measureIndex === cursor.measureIndex);
    if (measureLayouts.length === 0) return null;
    const top = Math.min(...measureLayouts.map(l => l.staveTopY)) - 12;
    const bottom = Math.max(...measureLayouts.map(l => l.staveBottomY)) + 12;
    return { top, bottom };
  };

  const getPlaybackCursorX = (): { x: number; top: number; bottom: number } | null => {
    if (!isPlaying) return null;
    let beatAcc = 0;
    for (let mIdx = 0; mIdx < score.parts[0].measures.length; mIdx++) {
      const m = score.parts[0].measures[mIdx];
      const mBeats = getMeasureBeats(m) || beatsPerMeasure(score.metadata.timeSig);
      if (playbackBeat >= beatAcc && playbackBeat < beatAcc + mBeats) {
        const layout = staveLayouts.find(l => l.partIndex === 0 && l.measureIndex === mIdx);
        if (!layout) break;
        const beatInMeasure = playbackBeat - beatAcc;
        let x = layout.cursorXPositions[0] ?? layout.x + 60;
        for (const np of layout.notePositions) {
          if (np.beatOffset <= beatInMeasure) x = np.x;
        }
        return { x, top: layout.staveTopY - 5, bottom: layout.staveBottomY + 5 };
      }
      beatAcc += mBeats;
    }
    return null;
  };

  const toolTabs = ['Rhythms', 'Pitch & Staff', 'Structure', 'Expression', 'Symbols'] as const;

  // ── Render ────────────────────────────────────────────────────────────────

  const cursorX = getCursorX();
  const cursorY = getCursorY();
  const playbackCursor = getPlaybackCursorX();

  function ToolbarContent() {
    switch (toolTab) {
      case 'Rhythms':
        return (
          <RhythmsRow
            mode={mode}
            selectedDuration={selectedDuration}
            pendingAlter={pendingAlter}
            onExitNoteInput={exitNoteInput}
            onSelectDuration={(base, dots) => {
              selectDuration(base, dots);
            }}
            onInsertRest={base => { enterNoteInput(); doInsertRest(base); }}
            onToggleDot={toggleDot}
            onSetAlter={setPendingAlter}
          />
        );
      case 'Pitch & Staff':
        return (
          <PitchRow
            onInsertNote={letter => { enterNoteInput(); doInsertNote(letter); }}
            onTranspose={doTransposeSelected}
          />
        );
      case 'Structure':    return <StructureRow />;
      case 'Expression':   return <ExpressionRow />;
      case 'Symbols':      return <SymbolsRow />;
    }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: C.bg, display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', system-ui, sans-serif", color: C.text,
    }}>

      {/* ── TOP CHROME ── */}
      <div style={{
        height: 44, flexShrink: 0, background: C.topbar,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', zIndex: 10, position: 'relative',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '100%' }}>
          <Link href="/app" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 6,
            background: C.btnBg, color: C.muted, textDecoration: 'none', fontSize: '16px',
          }}>
            ←
          </Link>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, height: '100%',
            padding: '0 14px', background: '#1f1514', borderLeft: `1px solid ${C.border}`,
            borderRight: `1px solid ${C.border}`, position: 'relative', marginLeft: 4,
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: C.red }} />
            <span style={{ fontSize: '15px', lineHeight: 1 }}>♪</span>
            <span style={{ fontSize: '12.5px', color: C.text }}>{score.metadata.title || 'New Score'}</span>
          </div>
        </div>

        {/* Center: mode indicator */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          {mode === 'note-input' ? (
            <span style={{ fontSize: '11px', color: C.blue, fontWeight: 600, letterSpacing: '0.05em' }}>
              ● NOTE INPUT  —  {selectedDuration.base}{selectedDuration.dots > 0 ? '.' : ''}
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: C.muted }}>
              {score.metadata.title}
            </span>
          )}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Playback controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: `1px solid ${C.btnBorder}`, borderRadius: 6, overflow: 'hidden' }}>
            <button
              id="play-pause-btn"
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              style={{ padding: '4px 10px', background: isPlaying ? C.red : C.btnBg, border: 'none', color: isPlaying ? '#fff' : C.text, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center' }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              onClick={handleStop}
              title="Stop"
              style={{ padding: '4px 8px', background: C.btnBg, border: 'none', borderLeft: `1px solid ${C.btnBorder}`, color: C.muted, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center' }}
            >
              ⏹
            </button>
          </div>

          {/* General / Play view */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 2 }}>
            {(['General', 'Play'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '4px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '12px', fontFamily: 'inherit', transition: 'all 0.15s',
                background: view === v ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: view === v ? C.text : C.muted,
              }}>
                {v}
              </button>
            ))}
          </div>

          {/* Zoom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, border: `1px solid ${C.btnBorder}`, borderRadius: 6, overflow: 'hidden' }}>
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={{ padding: '4px 8px', background: C.btnBg, border: 'none', color: C.muted, cursor: 'pointer', fontSize: '14px' }}>−</button>
            <span style={{ padding: '4px 8px', fontSize: '12px', color: C.dimmed, minWidth: 38, textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={{ padding: '4px 8px', background: C.btnBg, border: 'none', color: C.muted, cursor: 'pointer', fontSize: '14px' }}>+</button>
          </div>

          {/* Undo/Redo */}
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.btnBorder}`, background: C.btnBg, color: canUndo ? C.text : C.muted, cursor: canUndo ? 'pointer' : 'not-allowed', fontSize: '12px', fontFamily: 'inherit' }}>↩</button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.btnBorder}`, background: C.btnBg, color: canRedo ? C.text : C.muted, cursor: canRedo ? 'pointer' : 'not-allowed', fontSize: '12px', fontFamily: 'inherit' }}>↪</button>

          {/* Share */}
          <button style={{
            padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: C.red, color: '#fff', fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
          }}>
            Share
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── SCORE CANVAS ── */}
        <div style={{ flex: 1, background: C.canvas, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 130 }}>

          {/* Keyboard hint */}
          {mode === 'normal' && (
            <div style={{ textAlign: 'center', padding: '6px 0 0', fontSize: '11px', color: C.muted }}>
              A-G to type notes · 1-7 change duration · R rest · . dot · Space play
            </div>
          )}

          <div style={{
            maxWidth: 720,
            minHeight: Math.round(720 * 1.414),
            margin: `${16 + (100 - zoom) * 0.3}px auto`,
            background: '#fff',
            boxShadow: '0 12px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)',
            borderRadius: 2,
            padding: '52px 52px 68px',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            position: 'relative',
          }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <input
                value={score.metadata.title}
                onChange={e => dispatch({ type: 'SET_TITLE', title: e.target.value })}
                style={{
                  fontSize: 24, fontFamily: 'Georgia, serif', color: '#111', fontWeight: 'normal',
                  border: 'none', borderBottom: '1px solid transparent', outline: 'none',
                  textAlign: 'center', background: 'transparent', width: '100%', cursor: 'text',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderBottomColor = '#bbb')}
                onBlur={e => (e.target.style.borderBottomColor = 'transparent')}
                placeholder="Untitled Score"
              />
              <input
                value={composerDraft}
                onChange={e => setComposerDraft(e.target.value)}
                style={{
                  fontSize: 13, fontFamily: 'Georgia, serif', color: '#666', marginTop: 4,
                  border: 'none', borderBottom: '1px solid transparent', outline: 'none',
                  textAlign: 'center', background: 'transparent', width: '100%', cursor: 'text', display: 'block',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderBottomColor = '#bbb')}
                onBlur={e => (e.target.style.borderBottomColor = 'transparent')}
                placeholder="Composer"
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'Georgia, serif', color: '#666' }}>♩ =</span>
                <input
                  type="number"
                  value={score.metadata.tempo}
                  min={20} max={300}
                  onChange={e => { const v = Number(e.target.value); if (v >= 20 && v <= 300) dispatch({ type: 'SET_TEMPO', tempo: v }); }}
                  style={{
                    fontSize: 11, fontFamily: 'Georgia, serif', color: '#666',
                    border: 'none', borderBottom: '1px solid #ddd', outline: 'none',
                    background: 'transparent', width: 42, textAlign: 'center', cursor: 'text',
                  }}
                />
                <select
                  value={score.metadata.keySig}
                  onChange={e => setKeySig(Number(e.target.value))}
                  style={{ fontSize: 10, color: '#666', border: '1px solid #ddd', borderRadius: 3, padding: '1px 4px', background: 'white', cursor: 'pointer' }}
                >
                  {[[-7,'Cb'],[-6,'Gb'],[-5,'Db'],[-4,'Ab'],[-3,'Eb'],[-2,'Bb'],[-1,'F'],[0,'C'],[1,'G'],[2,'D'],[3,'A'],[4,'E'],[5,'B'],[6,'F#'],[7,'C#']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <select
                  value={`${score.metadata.timeSig.num}/${score.metadata.timeSig.den}`}
                  onChange={e => { const [n, d] = e.target.value.split('/').map(Number); setTimeSig(n, d); }}
                  style={{ fontSize: 10, color: '#666', border: '1px solid #ddd', borderRadius: 3, padding: '1px 4px', background: 'white', cursor: 'pointer' }}
                >
                  {['2/2','2/4','3/4','4/4','5/4','6/4','3/8','6/8','9/8','12/8'].map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* VexFlow canvas */}
            <div style={{ position: 'relative', width: '100%' }}>
              <div
                ref={vexContainerRef}
                onClick={handleScoreClick}
                onDoubleClick={handleScoreDoubleClick}
                onMouseMove={handleScoreMouseMove}
                onMouseLeave={handleScoreMouseLeave}
                style={{
                  cursor: mode === 'note-input' ? 'crosshair' : 'default',
                  width: '100%',
                  userSelect: 'none',
                }}
              />

              {/* Overlay: cursor line + selection + playback */}
              <svg
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: svgHeight,
                  pointerEvents: 'none', overflow: 'visible',
                }}
              >
                {/* Note-input cursor line */}
                {cursorX !== null && cursorY !== null && (
                  <line
                    x1={cursorX} y1={cursorY.top}
                    x2={cursorX} y2={cursorY.bottom}
                    stroke={C.blue} strokeWidth={2} opacity={0.9}
                  />
                )}

                {/* Mouse snap preview */}
                {hoverSnap && (
                  <>
                    <line
                      x1={hoverSnap.staveX}
                      y1={hoverSnap.y}
                      x2={hoverSnap.staveX + hoverSnap.staveWidth}
                      y2={hoverSnap.y}
                      stroke="rgba(77,171,247,0.55)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={hoverSnap.x}
                      cy={hoverSnap.y}
                      r={5}
                      fill="rgba(77,171,247,0.95)"
                      stroke="rgba(10,45,70,0.9)"
                      strokeWidth={1}
                    />
                    <rect
                      x={hoverSnap.x + 8}
                      y={hoverSnap.y - 18}
                      rx={4}
                      width={Math.max(88, hoverSnap.label.length * 5.2)}
                      height={16}
                      fill="rgba(17,17,17,0.86)"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth={0.5}
                    />
                    <text
                      x={hoverSnap.x + 12}
                      y={hoverSnap.y - 7}
                      fill="#dbeeff"
                      style={{ fontSize: '9px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                    >
                      {hoverSnap.label}
                    </text>
                  </>
                )}

                {/* Selected note highlights */}
                {staveLayouts.map(layout =>
                  layout.notePositions
                    .filter(np => selectedNoteIds.has(np.noteId))
                    .map(np => (
                      <rect
                        key={np.noteId}
                        x={np.x - 12}
                        y={layout.staveTopY - 8}
                        width={24}
                        height={layout.staveBottomY - layout.staveTopY + 16}
                        fill="rgba(230,126,34,0.2)"
                        stroke="#e67e22"
                        strokeWidth={1}
                        rx={3}
                      />
                    ))
                )}

                {/* Playback cursor */}
                {playbackCursor && (
                  <line
                    x1={playbackCursor.x} y1={playbackCursor.top}
                    x2={playbackCursor.x} y2={playbackCursor.bottom}
                    stroke="#e74c3c" strokeWidth={1.5} opacity={0.85}
                  />
                )}
              </svg>
            </div>

            {/* Add measure button */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={addMeasure}
                style={{
                  padding: '4px 16px', borderRadius: 6, border: '1px dashed #ccc',
                  background: 'transparent', color: '#aaa', cursor: 'pointer',
                  fontSize: '12px', fontFamily: 'Georgia, serif',
                }}
              >
                + Add Measure
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          width: 256, flexShrink: 0, background: C.panel,
          borderLeft: `1px solid ${C.border}`, overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <Section title="Format">
            <PillToggle options={['Portrait', 'Landscape']} value={orientation} onChange={v => setOrientation(v as 'Portrait'|'Landscape')} />
            <div style={{ marginTop: 10 }}>
              <RowField label="Page size"><SmallSelect value="A4" options={['A4', 'A3', 'Letter', 'Legal']} /></RowField>
              <RowField label="Margins"><SmallSelect value="Normal" options={['Normal', 'Narrow', 'Wide', 'Custom']} /></RowField>
            </div>
          </Section>

          <Section title="Color">
            <RowField label="Page"><ColorSwatch color="#FFFFFF" hex="FFFFFF" /></RowField>
            <RowField label="Staves"><ColorSwatch color="#111111" hex="111111" /></RowField>
            <RowField label="Noteheads"><ColorSwatch color="#111111" hex="111111" /></RowField>
          </Section>

          <Section title="Layout" open={false}>
            <RowField label="Staff spacing"><SmallSelect value="10 pt" options={['8 pt', '9 pt', '10 pt', '12 pt', '14 pt']} /></RowField>
            <RowField label="System gap"><SmallSelect value="20 pt" options={['16 pt', '20 pt', '24 pt', '30 pt']} /></RowField>
            <RowField label="First measure"><SmallSelect value="Auto" options={['Auto', '80%', '60%', '50%']} /></RowField>
          </Section>

          <Section title="Bars" open={false}>
            <RowField label="Per system"><SmallSelect value="Auto" options={['Auto', '2', '3', '4', '5', '6']} /></RowField>
            <RowField label="Bar numbers"><SmallSelect value="Every 5" options={['None', 'Every bar', 'Every 5', 'First only']} /></RowField>
          </Section>

          <Section title="Export" open={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {['PDF', 'MusicXML', 'MIDI', 'MP3', 'PNG'].map(fmt => (
                <button key={fmt}
                  onClick={() => { if (fmt === 'MIDI') downloadMIDI(score); }}
                  style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
                  background: C.btnBg, color: C.text, cursor: 'pointer',
                  fontSize: '12px', fontFamily: 'inherit',
                }}>
                  <span>{fmt}</span>
                  <svg width="12" height="12" fill="none" stroke={C.muted} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Import">
            <input
              ref={fileInputRef}
              type="file"
              accept=".musicxml,.xml,.mxl,.sib,.mid,.midi"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
            <button
              onClick={handlePickImportFile}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: C.btnBg,
                color: C.text,
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'inherit',
              }}
            >
              <span>Import file</span>
              <span style={{ color: C.muted, fontSize: '11px' }}>MusicXML preferred</span>
            </button>
            {importStatus.type !== 'idle' && (
              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                  fontSize: '11px',
                  lineHeight: 1.45,
                  color: importStatus.type === 'ok' ? '#8bd4a6' : '#f3a1a1',
                }}
              >
                {importStatus.message}
              </p>
            )}
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: '11px', color: C.muted, lineHeight: 1.45 }}>
              `.sib` cannot be parsed directly in web browser. Export from Sibelius as `.musicxml` for best results.
            </p>
          </Section>

          <Section title="Instruments">
            {score.parts.map((part, i) => (
              <InstrumentRow key={part.id} label={part.name} color={i === 0 ? '#7eb8e0' : '#e07e7e'} />
            ))}
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
              padding: '6px 4px', border: 'none', background: 'none',
              color: C.muted, cursor: 'pointer', fontSize: '11.5px', fontFamily: 'inherit',
            }}>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Add instrument
            </button>
          </Section>
        </div>
      </div>

      {/* ── BOTTOM TOOLBAR ── */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%',
        transform: 'translateX(-50%)', zIndex: 100,
        background: '#231a18', border: `1px solid rgba(255,255,255,0.13)`,
        borderRadius: 14, padding: '8px 14px 10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', gap: 6,
        maxWidth: 'calc(100vw - 320px)',
      }}>
        {/* Mode indicator strip */}
        {mode === 'note-input' && (
          <div style={{ height: 2, background: C.blue, borderRadius: 1, marginBottom: 2 }} />
        )}
        {/* Tab row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: 6, whiteSpace: 'nowrap',
        }}>
          {toolTabs.map(tab => (
            <TabPill key={tab} label={tab} active={toolTab === tab} onClick={() => setToolTab(tab)} />
          ))}
        </div>
        {/* Tool buttons */}
        <div style={{ overflowX: 'auto' }}>
          <ToolbarContent />
        </div>
      </div>
    </div>
  );
}
