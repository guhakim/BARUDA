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
