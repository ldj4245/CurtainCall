import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { retentionApi, type ViewingPlan } from '../../api/retention'
import { localDate, track } from '../../utils/analytics'

export default function PlanForm({ showId, showTitle, plan, onClose }: { showId: number; showTitle: string; plan?: ViewingPlan; onClose: () => void }) {
  const qc = useQueryClient()
  const [date, setDate] = useState(plan?.watchedDate ?? localDate())
  const [time, setTime] = useState(plan?.watchedTime ?? '')
  const [seat, setSeat] = useState(plan?.seatInfo ?? '')
  const [memo, setMemo] = useState(plan?.memo ?? '')
  const [reminder, setReminder] = useState(plan?.reminder ?? false)
  const save = useMutation({
    mutationFn: () => retentionApi.savePlan({ showId, watchedDate: date, watchedTime: time || undefined, seatInfo: seat, memo, reminder }, plan?.id),
    onSuccess: () => { track('plan_saved', showId); qc.invalidateQueries({ queryKey: ['plans'] }); toast.success('일정을 저장했습니다.'); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.message || '일정을 저장하지 못했습니다.'),
  })
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <form role="dialog" aria-modal="true" aria-label="관람 예정 등록" onSubmit={e => { e.preventDefault(); save.mutate() }} className="w-full max-w-md space-y-4 border border-line-base bg-white p-5" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-semibold">관람 예정</h2><p>{showTitle}</p>
      <label className="block text-sm">날짜<input autoFocus type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full border border-line-base p-2" /></label>
      <label className="block text-sm">시간 (선택)<input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full border border-line-base p-2" /></label>
      <label className="block text-sm">좌석 (선택)<input maxLength={100} value={seat} onChange={e => setSeat(e.target.value)} className="mt-1 block w-full border border-line-base p-2" /></label>
      <label className="block text-sm">메모 (선택)<textarea maxLength={500} value={memo} onChange={e => setMemo(e.target.value)} className="mt-1 block w-full border border-line-base p-2" /></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={reminder} onChange={e => setReminder(e.target.checked)} />사이트 알림 받기</label>
      <p className="feed-meta">알림 설정의 ‘관람 일정’도 켜야 표시됩니다. 알림은 사이트 방문 시 확인할 수 있습니다.</p>
      <div className="flex justify-end gap-2"><button type="button" className="button-secondary" onClick={onClose}>취소</button><button disabled={save.isPending} className="button-primary">저장</button></div>
    </form>
  </div>
}
