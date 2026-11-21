import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { retentionApi } from '../../api/retention'
import type { Preferences } from '../../api/retention'
export default function NotificationsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isError, refetch } = useQuery({ queryKey: ['notifications'], queryFn: retentionApi.notices })
  const { data: prefs } = useQuery({ queryKey: ['notification-preferences'], queryFn: retentionApi.preferences })
  const update = async (key: keyof Preferences, value: boolean) => {
    if (!prefs) return
    try { await retentionApi.savePreferences({ ...prefs, [key]: value }); await qc.invalidateQueries({ queryKey: ['notification-preferences'] }); qc.invalidateQueries({ queryKey: ['notifications'] }) }
    catch { toast.error('설정을 저장하지 못했습니다.') }
  }
  return <div className="page-width">
    <header className="page-heading"><h1>알림</h1></header>
    <details className="border-b border-line-base pb-4 mt-1"><summary className="cursor-pointer text-sm font-semibold">알림 설정</summary><p className="feed-meta my-3">선택한 항목만 사이트 안에서 알려드립니다. 메일·푸시 알림은 제공하지 않습니다.</p>
      <div className="flex flex-wrap gap-5">{([['plans', '관람 일정'], ['favorites', '관심 공연 종료'], ['replies', '댓글·답글'], ['monthly', '월간 기록']] as const).map(([key, label]) => <label key={key} className="flex gap-2 text-sm"><input type="checkbox" disabled={!prefs} checked={prefs?.[key] ?? false} onChange={e => { void update(key, e.target.checked) }} />{label}</label>)}</div>
    </details>
    {isError ? <button className="text-action my-4" onClick={() => refetch()}>알림 다시 불러오기</button> : data?.length ? data.map(n => <button key={n.id} className="block w-full border-b border-line-lightest py-4 text-left" onClick={() => { void retentionApi.seen(n.id).then(() => qc.invalidateQueries({ queryKey: ['notifications'] })); navigate(n.path) }}><span className={n.seen ? 'text-ink-lighter' : 'text-ink-base font-semibold'}>{n.title}</span><span className="feed-meta block mt-1">{n.createdAt.slice(0, 10)}{!n.seen && ' · 안 읽음'}</span></button>) : <p className="feed-notice">알림이 없습니다.</p>}
  </div>
}
