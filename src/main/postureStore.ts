import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const db = new Database(join(app.getPath('userData'), 'posture.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    baseline_nose_y REAL,
    baseline_shoulder_distance REAL,
    blur_sensitivity REAL NOT NULL DEFAULT 1.0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posture_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL UNIQUE,
    good_posture_duration_sec INTEGER NOT NULL DEFAULT 0,
    bad_posture_duration_sec INTEGER NOT NULL DEFAULT 0,
    trigger_count INTEGER NOT NULL DEFAULT 0
  );
`)

// posture_logs rows are aggregated into 5-minute buckets per the TRD data model.
const WINDOW_MS = 5 * 60 * 1000
const BAD_POSTURE_SCORE_THRESHOLD = 40
// Clamp per-sample deltas so a sleep/idle gap between samples doesn't get
// counted as one long stretch of good or bad posture.
const MAX_SAMPLE_GAP_SEC = 5

const upsertWindow = db.prepare(`
  INSERT INTO posture_logs (timestamp, good_posture_duration_sec, bad_posture_duration_sec, trigger_count)
  VALUES (@timestamp, @good, @bad, @trigger)
  ON CONFLICT(timestamp) DO UPDATE SET
    good_posture_duration_sec = good_posture_duration_sec + excluded.good_posture_duration_sec,
    bad_posture_duration_sec = bad_posture_duration_sec + excluded.bad_posture_duration_sec,
    trigger_count = trigger_count + excluded.trigger_count
`)

let lastSampleAtMs: number | null = null
let lastWasBad = false

function windowStartFor(timestampMs: number): number {
  return Math.floor(timestampMs / WINDOW_MS) * WINDOW_MS
}

export function recordPostureSample(score: number, timestampMs: number): void {
  const isBad = score >= BAD_POSTURE_SCORE_THRESHOLD
  const windowStart = windowStartFor(timestampMs)

  let deltaSec = 0
  if (lastSampleAtMs !== null && windowStartFor(lastSampleAtMs) === windowStart) {
    deltaSec = Math.min(MAX_SAMPLE_GAP_SEC, Math.max(0, (timestampMs - lastSampleAtMs) / 1000))
  }
  const isNewTrigger = isBad && !lastWasBad

  upsertWindow.run({
    timestamp: new Date(windowStart).toISOString(),
    good: isBad ? 0 : deltaSec,
    bad: isBad ? deltaSec : 0,
    trigger: isNewTrigger ? 1 : 0
  })

  lastWasBad = isBad
  lastSampleAtMs = timestampMs
}

export interface PostureLogRow {
  id: number
  timestamp: string
  good_posture_duration_sec: number
  bad_posture_duration_sec: number
  trigger_count: number
}

export function getRecentPostureLogs(limit = 288): PostureLogRow[] {
  return db
    .prepare('SELECT * FROM posture_logs ORDER BY timestamp DESC LIMIT ?')
    .all(limit) as PostureLogRow[]
}
