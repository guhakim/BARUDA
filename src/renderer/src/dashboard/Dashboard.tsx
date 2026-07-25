import { usePostureLogs, type DailyPostureSummary } from './usePostureLogs'

const CHART_HEIGHT = 96
const BAR_WIDTH = 24
const BAR_GAP = 10

function goodRatio(day: DailyPostureSummary): number {
  const total = day.goodSec + day.badSec
  return total === 0 ? 0 : day.goodSec / total
}

function WeeklyChart({ days }: { days: DailyPostureSummary[] }): React.JSX.Element {
  const width = days.length * (BAR_WIDTH + BAR_GAP)

  return (
    <svg width={width} height={CHART_HEIGHT + 20} role="img" aria-label="주간 바른 자세 비율">
      {days.map((day, i) => {
        const ratio = goodRatio(day)
        const barHeight = Math.max(2, ratio * CHART_HEIGHT)
        const x = i * (BAR_WIDTH + BAR_GAP)
        return (
          <g key={day.date}>
            <rect
              x={x}
              y={CHART_HEIGHT - barHeight}
              width={BAR_WIDTH}
              height={barHeight}
              fill="#4f9d69"
              rx={5}
            />
            <text
              x={x + BAR_WIDTH / 2}
              y={CHART_HEIGHT + 14}
              textAnchor="middle"
              fontSize={10}
              fill="var(--ev-c-text-3)"
            >
              {day.date.slice(5).replace('-', '.')}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function formatDate(dateKey: string): string {
  return dateKey.slice(5).replace('-', '.')
}

function DailyRecordList({ days }: { days: DailyPostureSummary[] }): React.JSX.Element {
  return (
    <ul className="record-list">
      {[...days].reverse().map((day) => {
        const total = day.goodSec + day.badSec
        const goodPct = total === 0 ? 0 : Math.round((day.goodSec / total) * 100)
        const badPct = 100 - goodPct
        return (
          <li key={day.date} className="record-row">
            <span className="record-date">{formatDate(day.date)}</span>
            <span className="record-good">바른 자세 {goodPct}%</span>
            <span className="record-bad">나쁜 자세 {badPct}%</span>
          </li>
        )
      })}
    </ul>
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

  return (
    <section className="card">
      <WeeklyChart days={days} />
      <DailyRecordList days={days} />
    </section>
  )
}

export default Dashboard
