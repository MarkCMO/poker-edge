/**
 * Spaced-repetition study drills (Phase 12). SM-2 scheduling over the user's
 * worst spot types, seeded from detected leaks. The headline success metric is
 * leak EV cost trending down over time (shown on the dashboard).
 */
import { getDb, makeId } from './database';

export interface StudyDrill {
  id: string;
  drillRef: string;
  label: string;
  easeFactor: number;
  intervalDays: number;
  reps: number;
  lastSeen: number | null;
  nextDue: number;
  createdAt: number;
}

const DAY = 86400000;

const BASE_DRILLS: { drillRef: string; label: string }[] = [
  { drillRef: 'preflop_open', label: 'Preflop opening ranges' },
  { drillRef: 'three_bet', label: '3-bet spots' },
  { drillRef: 'fold_to_3bet', label: 'Defending vs 3-bets' },
  { drillRef: 'cbet', label: 'C-bet decisions' },
  { drillRef: 'fold_to_cbet', label: 'Facing c-bets' },
  { drillRef: 'showdown', label: 'River and showdown' },
];

export function listDrills(): StudyDrill[] {
  return getDb().getAllSync<StudyDrill>('SELECT * FROM study_drills ORDER BY nextDue ASC');
}

export function listDueDrills(): StudyDrill[] {
  return getDb().getAllSync<StudyDrill>(
    'SELECT * FROM study_drills WHERE nextDue <= ? ORDER BY nextDue ASC',
    [Date.now()]
  );
}

function hasDrill(drillRef: string): boolean {
  const r = getDb().getFirstSync<{ c: number }>(
    'SELECT COUNT(*) as c FROM study_drills WHERE drillRef = ?',
    [drillRef]
  );
  return (r?.c ?? 0) > 0;
}

function addDrill(drillRef: string, label: string, dueOffsetMs = 0): void {
  getDb().runSync(
    `INSERT INTO study_drills (id, drillRef, label, easeFactor, intervalDays, reps, lastSeen, nextDue, createdAt)
     VALUES (?, ?, ?, 2.5, 0, 0, NULL, ?, ?)`,
    [makeId('drill-'), drillRef, label, Date.now() + dueOffsetMs, Date.now()]
  );
}

/** Ensure the base drill set exists. Safe to call on every study open. */
export function ensureBaseDrills(): void {
  for (const d of BASE_DRILLS) if (!hasDrill(d.drillRef)) addDrill(d.drillRef, d.label);
}

/** Prioritize drills for detected leaks: create if missing, move due to now. */
export function enqueueLeakDrills(leaks: { drillRef: string; label: string }[]): void {
  for (const l of leaks) {
    if (!hasDrill(l.drillRef)) addDrill(l.drillRef, l.label);
    else getDb().runSync('UPDATE study_drills SET nextDue = ? WHERE drillRef = ?', [Date.now(), l.drillRef]);
  }
}

/**
 * Record a review and reschedule with SM-2. `correct` maps to a quality of 4,
 * incorrect to 2 (below the 3 threshold that resets the interval).
 */
export function reviewDrill(id: string, correct: boolean): void {
  const db = getDb();
  const d = db.getFirstSync<StudyDrill>('SELECT * FROM study_drills WHERE id = ?', [id]);
  if (!d) return;
  const q = correct ? 4 : 2;
  let { easeFactor, intervalDays, reps } = d;
  if (q < 3) {
    reps = 0;
    intervalDays = 1;
  } else {
    reps += 1;
    if (reps === 1) intervalDays = 1;
    else if (reps === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }
  const now = Date.now();
  db.runSync(
    'UPDATE study_drills SET easeFactor = ?, intervalDays = ?, reps = ?, lastSeen = ?, nextDue = ? WHERE id = ?',
    [easeFactor, intervalDays, reps, now, now + intervalDays * DAY, id]
  );
}

/** A short warmup set: the most-overdue drills (top leak first). */
export function warmupDrills(n = 5): StudyDrill[] {
  ensureBaseDrills();
  return listDrills().slice(0, n);
}
