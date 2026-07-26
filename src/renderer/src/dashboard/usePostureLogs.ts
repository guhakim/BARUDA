import { useEffect, useState } from 'react'

// Mirrors main/postureStore.ts's PostureLogRow — kept as a separate type
// here since the renderer and main processes are compiled as independent
// TypeScript projects (tsconfig.web.json / tsconfig.node.json).
interface PostureLogRow {
  id: number
  timestamp: string
  good_posture_duration_sec: number
  bad_posture_duration_sec: number
  trigger_count: number
}

export interface DailyPostureSummary {
  date: string
  goodSec: number
  badSec: number
  triggerCount: number
}

function toDateKey(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10)
}

// Rolls the 5-minute buckets from posture_logs up into per-day totals for
// the weekly dashboard view (FR-04 / TODO "대시보드 통계 UI").
export function summarizeByDay(rows: PostureLogRow[]): DailyPostureSummary[] {
  const byDate = new Map<string, DailyPostureSummary>()

  for (const row of rows) {
    const date = toDateKey(row.timestamp)
    const existing = byDate.get(date) ?? { date, goodSec: 0, badSec: 0, triggerCount: 0 }
    existing.goodSec += row.good_posture_duration_sec
    existing.badSec += row.bad_posture_duration_sec
    existing.triggerCount += row.trigger_count
    byDate.set(date, existing)
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function dateKeyForDay(day: number): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(day)}`
}

function todayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// 07.21~07.24는 실제 사용 이력이 쌓이기 전 구간이라 더미 값으로 채우고,
// 오늘(todayKey) 이후부터는 실제 posture_logs 데이터로 대체한다.
const DUMMY_PREFIX_DAYS: DailyPostureSummary[] = [
  { day: 21, goodSec: 1980, badSec: 1620 }, // 55% / 45%
  { day: 22, goodSec: 1440, badSec: 2160 }, // 40% / 60%
  { day: 23, goodSec: 2340, badSec: 1260 }, // 65% / 35%
  { day: 24, goodSec: 1800, badSec: 1800 } // 50% / 50%
].map(({ day, goodSec, badSec }) => ({
  date: dateKeyForDay(day),
  goodSec,
  badSec,
  triggerCount: 0
}))

export function withDummyPrefix(realDays: DailyPostureSummary[]): DailyPostureSummary[] {
  const today = todayKey()
  const merged = new Map<string, DailyPostureSummary>()
  for (const day of DUMMY_PREFIX_DAYS) merged.set(day.date, day)
  for (const day of realDays) {
    if (day.date >= today) merged.set(day.date, day)
  }
  return Array.from(merged.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
}

export function usePostureLogs(): { days: DailyPostureSummary[]; loading: boolean } {
  const [days, setDays] = useState<DailyPostureSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    window.electron.ipcRenderer.invoke('posture:get-logs').then((rows: PostureLogRow[]) => {
      if (cancelled) return
      setDays(summarizeByDay(rows).slice(-7))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { days, loading }
}
