import { useState } from 'react'
import { usePostureLogs, withDummyPrefix, type DailyPostureSummary } from './usePostureLogs'

const CHART_HEIGHT = 160

function formatDate(dateKey: string): string {
  return dateKey.slice(5).replace('-', '.')
}

function WeeklyChart({ days }: { days: DailyPostureSummary[] }): React.JSX.Element {
  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span className="legend-chip legend-good">바른 자세</span>
        <span className="legend-chip legend-bad">나쁜 자세</span>
      </div>
      <div className="chart-axis">
        <div className="chart-yaxis" style={{ height: CHART_HEIGHT + 20 }}>
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>
        <div className="chart-plot-area">
          <div className="chart-bars">
            {days.map((day) => {
              const total = day.goodSec + day.badSec
              const goodPct = total === 0 ? 0 : Math.round((day.goodSec / total) * 100)
              const badPct = total === 0 ? 0 : Math.round((day.badSec / total) * 100)
              return (
                <div className="chart-day" key={day.date}>
                  <div className="chart-bar-group" style={{ height: CHART_HEIGHT }}>
                    <div className="chart-bar-col">
                      <span className="chart-bar-value good">{goodPct}%</span>
                      <div
                        className="chart-bar good"
                        style={{ height: (goodPct / 100) * CHART_HEIGHT }}
                      />
                    </div>
                    <div className="chart-bar-col">
                      <span className="chart-bar-value bad">{badPct}%</span>
                      <div
                        className="chart-bar bad"
                        style={{ height: (badPct / 100) * CHART_HEIGHT }}
                      />
                    </div>
                  </div>
                  <span className="chart-date-label">{formatDate(day.date)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function PostureCalendar({ days }: { days: DailyPostureSummary[] }): React.JSX.Element {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const byDate = new Map(days.map((day) => [day.date, day]))

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayKey = `${year}-${pad(month + 1)}-${pad(now.getDate())}`
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  const selected = selectedDate ? byDate.get(selectedDate) : undefined
  const selectedTotal = selected ? selected.goodSec + selected.badSec : 0
  const selectedGoodPct =
    selected && selectedTotal > 0 ? Math.round((selected.goodSec / selectedTotal) * 100) : 0
  const selectedBadPct = selected && selectedTotal > 0 ? 100 - selectedGoodPct : 0

  return (
    <div className="calendar-wrap">
      <div className="calendar-header">
        {year}년 {month + 1}월
      </div>
      <div className="calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} className="calendar-cell empty" />

          const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`
          const isFuture = dateKey > todayKey
          const hasData = byDate.has(dateKey)
          const isSelected = dateKey === selectedDate

          return (
            <button
              type="button"
              key={dateKey}
              className={`calendar-cell ${hasData ? 'has-data' : ''} ${isSelected ? 'selected' : ''}`}
              disabled={isFuture}
              onClick={() => setSelectedDate(dateKey)}
            >
              {day}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="calendar-detail">
          <span className="calendar-detail-date">{formatDate(selectedDate)}</span>
          {selected ? (
            <>
              <span className="calendar-detail-good">바른 자세 {selectedGoodPct}%</span>
              <span className="calendar-detail-bad">나쁜 자세 {selectedBadPct}%</span>
            </>
          ) : (
            <span className="calendar-detail-empty">기록이 없습니다</span>
          )}
        </div>
      )}
    </div>
  )
}

function Dashboard(): React.JSX.Element {
  const { days, loading } = usePostureLogs()

  if (loading || days.length === 0) {
    return (
      <section className="card chart-empty">
        <span>{loading ? '불러오는 중...' : '아직 데이터가 없어요'}</span>
      </section>
    )
  }

  const merged = withDummyPrefix(days)

  return (
    <section className="card">
      <WeeklyChart days={merged.slice(-7)} />
      <PostureCalendar days={merged} />
    </section>
  )
}

export default Dashboard
