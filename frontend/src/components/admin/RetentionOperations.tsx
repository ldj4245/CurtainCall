import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import type { PageResponse } from '../../types'
import { useState } from 'react'
import Pagination from '../common/Pagination'
type Report = { id: number; targetType: string; reason: string; evidence: string; status: string; createdAt: string }
type Metrics = { first24hEligible: number; first24hSaved: number; repeat30dEligible: number; repeat30dSaved: number; plans: number; completedPlans: number; events90d: Record<string, number> }
export default function RetentionOperations() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const { data: reports, isError } = useQuery({ queryKey: ['admin-reports', page], queryFn: () => api.get<PageResponse<Report>>('/admin/reports', { params: { page } }).then(r => r.data) })
  const { data: metrics } = useQuery({ queryKey: ['admin-metrics'], queryFn: () => api.get<Metrics>('/admin/metrics').then(r => r.data) })
  const resolve = async (id: number, status: 'HIDDEN' | 'DISMISSED') => { try { await api.put(`/admin/reports/${id}`, { status }); qc.invalidateQueries({ queryKey: ['admin-reports'] }) } catch { toast.error('처리하지 못했습니다.') } }
  return <section className="mt-8 border-t border-line-base pt-5">
    <h2 className="font-semibold">방문·기록 지표</h2>
    {metrics && <div className="my-4 space-y-2 text-sm"><p>가입 후 24시간 내 기록: {metrics.first24hSaved} / {metrics.first24hEligible}명</p><p>첫 기록 후 30일 내 재기록: {metrics.repeat30dSaved} / {metrics.repeat30dEligible}명</p><p>예정 → 관람 기록: {metrics.completedPlans} / {metrics.plans}개</p><p className="feed-meta">24시간·30일의 관찰 기간이 지난 계정만 분모에 포함합니다. 삭제된 기록과 일정은 집계에서 제외됩니다.</p><details><summary>최근 90일 행동 횟수</summary>{Object.entries(metrics.events90d).map(([k, v]) => <p key={k}>{k}: {v}</p>)}</details></div>}
    <h2 className="mt-6 font-semibold">채팅 신고</h2>{isError && <p>신고 목록을 불러오지 못했습니다.</p>}
    {reports?.content.map(r => <article key={r.id} className="border-b border-line-lightest py-3 text-sm"><p>{r.createdAt.slice(0, 10)} · {r.targetType} · {r.status}</p><p className="mt-2">사유: {r.reason}</p><p className="my-2 whitespace-pre-wrap">내용: {r.evidence}</p>{r.status === 'OPEN' && <div className="flex gap-4"><button className="text-action" onClick={() => { void resolve(r.id, 'HIDDEN') }}>메시지 삭제</button><button className="text-action" onClick={() => { void resolve(r.id, 'DISMISSED') }}>기각</button></div>}</article>)}
    {reports?.content.length === 0 && <p className="feed-notice">신고가 없습니다.</p>}
    {reports && reports.totalPages > 1 && <Pagination currentPage={page} totalPages={reports.totalPages} onPageChange={setPage} />}
  </section>
}
