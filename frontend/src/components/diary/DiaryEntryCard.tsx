import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { diaryApi } from '../../api/diary'
import type { DiaryEntry } from '../../types'
import ConfirmModal from '../common/ConfirmModal'

interface Props {
  entry: DiaryEntry
  onUpdated: () => void
  onEdit: () => void
}

export default function DiaryEntryCard({ entry, onUpdated, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => diaryApi.delete(entry.id),
    onSuccess: () => {
      toast.success('기록을 삭제했습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary'] })
      onUpdated()
    },
  })

  return (
    <article className="grid grid-cols-[73px_minmax(0,1fr)] gap-3.5 border-b border-line-lightest py-4 sm:grid-cols-[73px_minmax(0,1fr)_auto]">
      {entry.showPosterUrl ? (
        <img src={entry.showPosterUrl} alt="" className="h-[98px] w-full object-cover bg-surface-background" />
      ) : (
        <div className="h-[98px] bg-surface-background" />
      )}
      
      <div>
        <time className="text-[10px] font-semibold text-brand">{entry.watchedDate}</time>
        <h2 className="mt-1 text-[14px] font-semibold text-ink-base">
          <Link to={`/shows/${entry.showId}`}>{entry.showTitle}</Link>
        </h2>
        <p className="mt-2 text-[11px] leading-5 text-ink-lighter line-clamp-2">
          {entry.comment || entry.castMemo || ''}
        </p>
        <div className="mt-2 flex gap-2">
          <button onClick={onEdit} className="text-[10px] text-ink-light underline underline-offset-2">수정</button>
          <button onClick={() => setDeleting(true)} className="text-[10px] text-ink-light underline underline-offset-2">삭제</button>
        </div>
      </div>

      <span className="hidden whitespace-nowrap text-right text-[10px] leading-5 text-ink-lightest sm:block">
        {entry.seatInfo || '좌석 미상'}<br />
        <span className="text-brand">★</span> {entry.rating.toFixed(1)}
      </span>

      {deleting && (
        <ConfirmModal
          title="기록 삭제"
          message="정말 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleting(false)}
        />
      )}
    </article>
  )
}
