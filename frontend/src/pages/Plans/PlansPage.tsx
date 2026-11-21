import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { retentionApi, type ViewingPlan } from '../../api/retention'
import PlanForm from '../../components/plan/PlanForm'
import DiaryFormModal from '../../components/diary/DiaryFormModal'
import ConfirmModal from '../../components/common/ConfirmModal'
import { localDate } from '../../utils/analytics'

export default function PlansPage() {
  const qc = useQueryClient()
  const [edit, setEdit] = useState<ViewingPlan>()
  const [record, setRecord] = useState<ViewingPlan>()
  const [remove, setRemove] = useState<ViewingPlan>()
  const { data = [], isLoading, isError, refetch } = useQuery({ queryKey: ['plans'], queryFn: retentionApi.plans })
  const pending = data.filter(p => !p.diaryId)
  const completed = data.filter(p => p.diaryId)
  return <div className="page-width">
    <header className="page-heading"><h1>관람 예정</h1><Link className="text-action" to="/shows">공연 찾아 등록하기</Link></header>
    {isLoading ? <p className="feed-notice">불러오는 중...</p> : isError ? <button className="text-action" onClick={() => refetch()}>다시 불러오기</button> : !pending.length ? <p className="feed-notice">등록된 일정이 없습니다. 공연 상세에서 등록할 수 있습니다.</p> : pending.map(p => <article key={p.id} className="diary-entry">
      <h2><Link to={`/shows/${p.showId}`}>{p.showTitle}</Link></h2>
      <p className="feed-meta">{p.watchedDate} {p.watchedTime?.slice(0, 5)} · {p.theaterName}{p.seatInfo && ` · ${p.seatInfo}`}</p>
      {p.memo && <p className="feed-description">{p.memo}</p>}
      <div className="feed-links"><button onClick={() => setEdit(p)}>수정</button><button onClick={() => setRemove(p)}>삭제</button>{p.watchedDate <= localDate() && <button onClick={() => setRecord(p)}>관람 기록 남기기</button>}</div>
    </article>)}
    {completed.length > 0 && <details className="mt-8"><summary className="cursor-pointer text-sm">기록으로 옮긴 일정 ({completed.length})</summary>{completed.map(p => <p key={p.id} className="feed-meta mt-2">{p.watchedDate} · {p.showTitle} · <Link className="text-action" to="/diary">기록 보기</Link></p>)}</details>}
    {edit && <PlanForm showId={edit.showId} showTitle={edit.showTitle} plan={edit} onClose={() => setEdit(undefined)} />}
    {record && <DiaryFormModal initialShowId={record.showId} initialShowTitle={record.showTitle} initialPlan={record} onClose={() => setRecord(undefined)} onSaved={() => { setRecord(undefined); qc.invalidateQueries({ queryKey: ['plans'] }) }} />}
    {remove && <ConfirmModal title="일정 삭제" message={`'${remove.showTitle}' 일정을 삭제할까요?`} confirmText="삭제" onCancel={() => setRemove(undefined)} onConfirm={() => { void retentionApi.deletePlan(remove.id).then(() => { qc.invalidateQueries({ queryKey: ['plans'] }); setRemove(undefined) }).catch(() => toast.error('삭제하지 못했습니다.')) }} />}
  </div>
}
