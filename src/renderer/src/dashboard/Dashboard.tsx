import type { SubscriptionStatus } from '../billing/useSubscriptionStatus'
import { usePostureLogs, type DailyPostureSummary } from './usePostureLogs'

const CHART_HEIGHT = 120
const BAR_WIDTH = 28
const BAR_GAP = 12

function goodRatio(day: DailyPostureSummary): number {
  const total = day.goodSec + day.badSec
  return total === 0 ? 0 : day.goodSec / total
}

function WeeklyChart({ days }: { days: DailyPostureSummary[] }): React.JSX.Element {
  const width = days.length * (BAR_WIDTH + BAR_GAP)

  return (
    <svg width={width} height={CHART_HEIGHT + 24} role="img" aria-label="주간 바른 자세 비율">
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
              rx={4}
            />
            <text x={x + BAR_WIDTH / 2} y={CHART_HEIGHT + 16} textAnchor="middle" fontSize={10}>
              {day.date.slice(5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function PremiumLock(): React.JSX.Element {
  return (
    <div
      style={{
        border: '1px dashed #999',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
        color: '#999'
      }}
    >
      <p>주간 자세 통계 대시보드는 프리미엄 구독자 전용 기능입니다.</p>
    </div>
  )
}

interface DashboardProps {
  subscriptionStatus: SubscriptionStatus
}

function Dashboard({ subscriptionStatus }: DashboardProps): React.JSX.Element {
  const { days, loading } = usePostureLogs()
  const isPremium = subscriptionStatus === 'active'

  return (
    <div style={{ marginTop: 24 }}>
      <h3>주간 자세 통계</h3>
      {!isPremium ? (
        <PremiumLock />
      ) : loading ? (
        <p>불러오는 중...</p>
      ) : days.length === 0 ? (
        <p>아직 기록된 자세 데이터가 없습니다.</p>
      ) : (
        <WeeklyChart days={days} />
      )}
    </div>
  )
}

export default Dashboard
