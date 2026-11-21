import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { retentionApi } from '../../api/retention'
export default function MessageActions({ type, messageId, senderId }: { type: 'CHAT' | 'LIVE'; messageId: number; senderId: number }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const report = useMutation({ mutationFn: () => retentionApi.report(type, messageId, reason), onSuccess: () => { toast.success('신고를 접수했습니다.'); setOpen(false) }, onError: () => toast.error('신고하지 못했습니다.') })
  const block = useMutation({ mutationFn: () => retentionApi.block(senderId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocks'] }); qc.invalidateQueries({ queryKey: ['chat-messages'] }); toast.success('차단했습니다.') }, onError: () => toast.error('차단하지 못했습니다.') })
  return <div className="text-[10px] text-ink-lighter">
    <button type="button" onClick={() => setOpen(!open)}>신고</button><span className="mx-2">·</span><button type="button" disabled={block.isPending} onClick={() => block.mutate()}>차단</button>
    {open && <form className="mt-2 flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); report.mutate() }}><input autoFocus aria-label="신고 사유" required maxLength={500} value={reason} onChange={e => setReason(e.target.value)} placeholder="신고 사유" className="border border-line-base bg-white p-1 text-ink-base" /><button disabled={report.isPending || !reason.trim()} className="text-action">접수</button></form>}
  </div>
}
