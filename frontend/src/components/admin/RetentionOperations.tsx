import { useQuery } from '@tanstack/react-query'
import api from '../../api/axios'

type Metrics = {
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
        <div className="my-4 space-y-2 text-sm">
          <p>가입 후 24시간 내 기록: {metrics.first24hSaved} / {metrics.first24hEligible}명</p>
          <p>첫 기록 후 30일 내 재기록: {metrics.repeat30dSaved} / {metrics.repeat30dEligible}명</p>
          <p>예정 → 관람 기록: {metrics.completedPlans} / {metrics.plans}개</p>
          <p className="feed-meta">24시간·30일의 관찰 기간이 지난 계정만 분모에 포함합니다. 삭제된 기록과 일정은 집계에서 제외됩니다.</p>
          <details>
            <summary>최근 90일 행동 횟수</summary>
            {Object.entries(metrics.events90d).map(([k, v]) => <p key={k}>{k}: {v}</p>)}
          </details>
        </div>
      )}
    </section>
  )
}
