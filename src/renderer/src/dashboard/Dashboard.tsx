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
      <WeeklyChart days={withDummyPrefix(days)} />
    </section>
  )
}

export default Dashboard
