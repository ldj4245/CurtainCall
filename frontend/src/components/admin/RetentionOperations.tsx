import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'

type DailyVisitor = {
  date: string
  visitors: number
  pageViews: number
}

type Metrics = {
  visitorsToday: number
  visitors7d: number
  visitors30d: number
  pageViewsToday: number
  dailyVisitors: DailyVisitor[]
  first24hEligible: number
  first24hSaved: number
  repeat30dEligible: number
  repeat30dSaved: number
  plans: number
  completedPlans: number
  events90d: Record<string, number>
}

export default function RetentionOperations() {
  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get<Metrics>('/admin/metrics').then(r => r.data),
  })

  return (
    <section className="mt-8 border-t border-line-base pt-5">
      <h2 className="font-semibold">방문·기록 지표</h2>
      {metrics && (
        <div className="my-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line-base bg-white px-3 py-2.5">
              <p className="text-xs text-neutral-500">오늘 방문자</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-neutral-900">
                {metrics.visitorsToday.toLocaleString()}명
              </p>
            </div>
            <div className="rounded-lg border border-line-base bg-white px-3 py-2.5">
              <p className="text-xs text-neutral-500">최근 7일</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-neutral-900">
                {metrics.visitors7d.toLocaleString()}명
              </p>
            </div>
            <div className="rounded-lg border border-line-base bg-white px-3 py-2.5">
              <p className="text-xs text-neutral-500">최근 30일</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-neutral-900">
                {metrics.visitors30d.toLocaleString()}명
              </p>
            </div>
            <div className="rounded-lg border border-line-base bg-white px-3 py-2.5">
              <p className="text-xs text-neutral-500">오늘 페이지뷰</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-neutral-900">
                {metrics.pageViewsToday.toLocaleString()}회
              </p>
            </div>
          </div>

          {metrics.dailyVisitors.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-line-base bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line-base bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">날짜 (KST)</th>
                    <th className="px-3 py-2 text-right font-medium">방문자</th>
                    <th className="px-3 py-2 text-right font-medium">페이지뷰</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-base tabular-nums text-neutral-800">
                  {[...metrics.dailyVisitors].reverse().map(day => (
                    <tr key={day.date}>
                      <td className="px-3 py-1.5">{day.date}</td>
                      <td className="px-3 py-1.5 text-right">{day.visitors.toLocaleString()}명</td>
                      <td className="px-3 py-1.5 text-right">{day.pageViews.toLocaleString()}회</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="space-y-1.5">
            <p>가입 후 24시간 내 기록: {metrics.first24hSaved} / {metrics.first24hEligible}명</p>
            <p>첫 기록 후 30일 내 재기록: {metrics.repeat30dSaved} / {metrics.repeat30dEligible}명</p>
            <p>예정 → 관람 기록: {metrics.completedPlans} / {metrics.plans}개</p>
            <p className="feed-meta">방문자는 KST 기준 익명 세션 수이며 DNT·추적 거부 설정 시 제외됩니다. 24시간·30일의 관찰 기간이 지난 계정만 리텐션 분모에 포함하고, 삭제된 기록·일정은 제외됩니다.</p>
          </div>
          <details>
            <summary>최근 90일 행동 횟수</summary>
            {Object.entries(metrics.events90d).map(([k, v]) => <p key={k}>{k}: {v}</p>)}
          </details>
        </div>
      )}
    </section>
  )
}
